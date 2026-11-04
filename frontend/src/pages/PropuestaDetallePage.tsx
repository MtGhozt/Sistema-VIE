import { CoordinacionEditor } from "../components/CoordinacionEditor";
import { DocumentosPanel } from "../components/DocumentosPanel";
import { FormWizardStepContent } from "../components/FormWizardStepContent";
import { ProcessTimeline, stepFromPropuestaEstado } from "../components/ProcessTimeline";
import { WizardLineSteps } from "../components/WizardLineSteps";
import { apiJson } from "../api/client";
import { labelEstado } from "../data/proposalStates";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchConvocatorias, type Convocatoria } from "../api/convocatorias";
import {
  enviarPropuesta,
  fetchPropuesta,
  fetchPropuestas,
  type PropuestaDetalle,
} from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import {
  DEFAULT_FORM_WIZARD_STATE,
  FORM_WIZARD_STEPS,
  type FormWizardState,
} from "../data/formWizard";
import { hydrateFormWizardFromDetalle } from "../data/hydrateFormWizard";

export function PropuestaDetallePage() {
  const { id } = useParams();
  const proposalId = Number(id);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<PropuestaDetalle | null>(null);
  const [form, setForm] = useState<FormWizardState>(DEFAULT_FORM_WIZARD_STATE);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [idConvocatoria, setIdConvocatoria] = useState<number | "">("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reconsideracion, setReconsideracion] = useState("");
  const [sending, setSending] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);

  const canEditRole =
    session?.role === "investigador" || session?.role === "admin";

  async function onEnviarBorrador() {
    if (!detail || detail.estadoActual !== "borrador") return;
    setSending(true);
    try {
      const sent = await enviarPropuesta(detail.id);
      setDetail(sent);
      setForm(hydrateFormWizardFromDetalle(sent));
      showToast(`Propuesta ${sent.codigo} enviada a revisión`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "No se pudo enviar",
        "error",
      );
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    stepHeadingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    void (async () => {
      try {
        setConvocatorias(await fetchConvocatorias());
      } catch {
        /* catálogo auxiliar; el expediente sigue siendo legible */
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const target =
          Number.isSafeInteger(proposalId) && proposalId > 0
            ? proposalId
            : (await fetchPropuestas()).find((p) => p.codigo === id)?.id;
        if (!target) throw new Error("Expediente no disponible en su ámbito");
        const d = await fetchPropuesta(target);
        setDetail(d);
        setIdConvocatoria(d.idConvocatoria);
        setForm(hydrateFormWizardFromDetalle(d));
        setStep(0);
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "No se pudo cargar",
          "error",
        );
        navigate("/propuestas", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, proposalId, navigate, showToast]);

  if (loading || !detail) {
    return (
      <section className="card" aria-busy="true">
        <h1 className="sr-only">Cargando expediente</h1>
        <p role="status" aria-live="polite">
          Cargando expediente…
        </p>
      </section>
    );
  }

  const canEdit =
    canEditRole &&
    (session?.role === "admin" || detail.idCoordinador === session?.userId);
  const isDraft = detail.estadoActual === "borrador";
  const isCorrection = detail.estadoActual === "en_subsanacion";
  const progressPct = Math.round(
    ((step + 1) / FORM_WIZARD_STEPS.length) * 100,
  );
  const etapa = stepFromPropuestaEstado(
    detail.estadoActual,
    detail.etapaFlujo,
  );

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{detail.codigo}</span>
      </div>

      <header className="page-header">
        <div>
          <p className="eyebrow">{detail.codigo}</p>
          <h1>{detail.titulo}</h1>
          <p>
            {detail.coordinadorNombre} · {detail.escuelaNombre}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/propuestas" className="btn btn-secondary">
            Volver
          </Link>
          {canEdit && (isDraft || isCorrection) && (
            <Link
              to={`/propuestas/nueva?edit=${detail.id}`}
              className="btn btn-secondary"
            >
              Editar propuesta
            </Link>
          )}
          {canEdit && isDraft && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={sending}
              onClick={() => void onEnviarBorrador()}
            >
              {sending ? "Enviando…" : "Enviar a revisión"}
            </button>
          )}
        </div>
      </header>

      {isCorrection && (
        <p role="status" aria-live="polite">
          Debe atender las observaciones y reenviar desde el formulario de
          edición.
        </p>
      )}

      {detail.estadoActual === "rechazo_aval" && canEdit && (
        <section className="card stack-md">
          <h2>Solicitar reconsideración al Consejo</h2>
          <p>
            El rechazo de aval continúa vigente hasta que el Consejo autorice un
            nuevo ciclo. No es una resolución CIE.
          </p>
          <label className="field">
            <span>Motivo de reconsideración</span>
            <textarea
              aria-label="Motivo de reconsideración"
              className="input textarea"
              value={reconsideracion}
              onChange={(e) => setReconsideracion(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!reconsideracion.trim() || sending}
            onClick={async () => {
              setSending(true);
              try {
                await apiJson(
                  `/api/evaluaciones/propuestas/${detail.id}/acciones`,
                  {
                    method: "POST",
                    body: JSON.stringify({
                      action: "request-reconsideration",
                      payload: { texto: reconsideracion },
                    }),
                  },
                );
                showToast(
                  "Solicitud registrada para el Consejo",
                  "success",
                );
              } catch (e) {
                showToast(
                  e instanceof Error ? e.message : "No se pudo solicitar",
                  "error",
                );
              } finally {
                setSending(false);
              }
            }}
          >
            Solicitar nuevo ciclo
          </button>
        </section>
      )}

      <section className="card proposal-status-card">
        <div className="proposal-status-head">
          <div>
            <span>Estado actual</span>
            <span className="badge badge-primary">
              {labelEstado(detail.estadoActual)}
            </span>
          </div>
          <div>
            <span>Modalidad</span>
            <strong>{detail.modalidadLabel || detail.modalidad}</strong>
          </div>
          <div>
            <span>Convocatoria</span>
            <strong>{detail.convocatoriaNombre}</strong>
          </div>
          <div>
            <span>Propiedad intelectual</span>
            <strong>
              {detail.requiereDictamenPi
                ? "Requiere dictamen"
                : "No requerida"}
            </strong>
          </div>
        </div>
        <ProcessTimeline
          currentStep={etapa}
          piRequired={detail.requiereDictamenPi}
          piAcreditada={detail.piAcreditada}
          completed={
            detail.estadoActual === "aprobada" ||
            detail.estadoActual === "rechazada"
          }
        />
      </section>

      <div className="wizard-layout wizard-layout-wide">
        <aside className="wizard-sidebar">
          <div className="wizard-progress-head">
            <span>Progreso</span>
            <strong>{progressPct}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Avance del formulario"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${progressPct}% del formulario`}
          >
            <div style={{ width: `${progressPct}%` }} />
          </div>
          <WizardLineSteps
            steps={FORM_WIZARD_STEPS}
            step={step}
            onSelect={setStep}
          />
        </aside>

        <section className="card wizard-card">
          <div className="wizard-card-head institutional-form-head">
            <div>
              <span className="eyebrow">
                Formulario VIE 2027 · Solo lectura · Paso {step + 1} de{" "}
                {FORM_WIZARD_STEPS.length}
              </span>
              <h1 className="sr-only">
                Expediente {detail.codigo} en solo lectura
              </h1>
              <h2 ref={stepHeadingRef} tabIndex={-1}>
                {FORM_WIZARD_STEPS[step]}
              </h2>
            </div>
            <div className="form-code">
              <strong>F-VIE-2027</strong>
              <span role="status" aria-live="polite">
                Solo lectura
              </span>
            </div>
          </div>

          <div className="wizard-body">
            <FormWizardStepContent
              readOnly
              step={step}
              form={form}
              patch={() => {}}
              convocatorias={convocatorias}
              idConvocatoria={idConvocatoria}
              setIdConvocatoria={() => {}}
              documentos={<DocumentosPanel id={detail.id} />}
            />
          </div>

          <div className="wizard-footer">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Anterior
            </button>
            <div className="wizard-footer-actions">
              {step < FORM_WIZARD_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    setStep((s) =>
                      Math.min(FORM_WIZARD_STEPS.length - 1, s + 1),
                    )
                  }
                >
                  Siguiente
                </button>
              ) : (
                <Link to="/propuestas" className="btn btn-primary">
                  Volver a propuestas
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>

      {session &&
        ["admin", "vie_publicacion"].includes(session.role) &&
        detail.etapaFlujo <= 1 &&
        !["aprobada", "rechazada"].includes(detail.estadoActual) && (
          <CoordinacionEditor
            id={detail.id}
            onSaved={() => navigate("/propuestas")}
          />
        )}
    </>
  );
}

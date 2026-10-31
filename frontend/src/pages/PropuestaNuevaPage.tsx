import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchConvocatorias, type Convocatoria } from "../api/convocatorias";
import {
  createPropuesta,
  enviarPropuesta,
  fetchPropuesta,
  patchPropuesta,
  type PropuestaDetalle,
} from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { FormWizardStepContent } from "../components/FormWizardStepContent";
import { useToast } from "../components/toast/ToastContext";
import {
  DEFAULT_FORM_WIZARD_STATE,
  FORM_WIZARD_STEPS,
  type FormWizardState,
} from "../data/formWizard";

export function PropuestaNuevaPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdRaw = searchParams.get("edit");
  const editId = editIdRaw ? Number(editIdRaw) : NaN;
  const isEditing = Number.isFinite(editId);

  const canCreate =
    session?.role === "investigador" || session?.role === "admin";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormWizardState>(DEFAULT_FORM_WIZARD_STATE);
  const [saveStatus, setSaveStatus] = useState(
    "Sin guardar",
  );
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [idConvocatoria, setIdConvocatoria] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  const progressPct = Math.round(((step + 1) / FORM_WIZARD_STEPS.length) * 100);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await fetchConvocatorias();
        const activas = rows.filter((c) => c.estado === "activa");
        setConvocatorias(activas.length > 0 ? activas : rows);
        if (!isEditing) {
          if (activas[0]) setIdConvocatoria(activas[0].id);
          else if (rows[0]) setIdConvocatoria(rows[0].id);
        }
      } catch (err) {
        showToast(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar convocatorias",
          "error",
        );
      }
    })();
  }, [showToast, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    void (async () => {
      setLoadingEdit(true);
      try {
        const d = await fetchPropuesta(editId);
        if (d.estadoActual !== "borrador") {
          showToast(
            "Solo se pueden editar propuestas en borrador",
            "error",
          );
          navigate(`/propuestas/${d.id}`, { replace: true });
          return;
        }
        setIdConvocatoria(d.idConvocatoria);
        setForm((prev) => ({
          ...prev,
          titulo: d.titulo,
          modalidad: d.modalidadLabel || prev.modalidad,
          resumen: d.resumen ?? "",
          estadoArte: d.estadoArte ?? "", referencias: d.referencias ?? "", hojaRuta: d.hojaRuta ?? "", divulgacion: d.divulgacion ?? "",
          inicio: d.fechaInicio?.slice(0,10) ?? "", fin: d.fechaFin?.slice(0,10) ?? "",
          keywordsEn: d.keywordsEn.join(", "),
          ...Object.fromEntries((d.preguntasGenerales ?? []).map(q => [`q${q.numero}`, q.respuesta])),
          q2Proyecto: (d.preguntasGenerales?.find(q => q.numero === 2)?.detalle ?? "").split("\n")[0] ?? "",
          q2Relacion: (d.preguntasGenerales?.find(q => q.numero === 2)?.detalle ?? "").split("\n").slice(1).join("\n"),
          q3Detalle: d.preguntasGenerales?.find(q => q.numero === 3)?.detalle ?? "",
          abstract: d.abstractEn ?? "",
          palabras: d.keywordsEs.join(", "),
          problema: d.problema ?? prev.problema,
          objetivos: d.objetivoGeneral ?? prev.objetivos,
          metodologia: d.metodologia ?? prev.metodologia,
        }));
        setSaveStatus("Borrador cargado");
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "No se pudo cargar el borrador",
          "error",
        );
        navigate("/propuestas", { replace: true });
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [isEditing, editId, navigate, showToast]);

  function patch(partial: Partial<FormWizardState>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setSaveStatus("Cambios sin guardar");
  }

  function draftPayload() {
    return {
      titulo: form.titulo.trim(),
      modalidad: form.modalidad,
      resumen: form.resumen.trim(),
      abstractEn: form.abstract.trim(),
      problema: form.problema.trim(),
      objetivoGeneral: form.objetivos.trim(),
      metodologia: form.metodologia.trim(),
      keywordsEs: form.palabras,
      keywordsEn: form.keywordsEn,
      estadoArte: form.estadoArte, referencias: form.referencias, hojaRuta: form.hojaRuta, divulgacion: form.divulgacion,
      fechaInicio: form.inicio, fechaFin: form.fin, requiereDictamenPi: form.q8 === "Sí",
      preguntasGenerales: Array.from({ length: 8 }, (_, i) => ({ numero: i + 1,
        respuesta: String(form[`q${i + 1}` as keyof FormWizardState]),
        detalle: i === 1 ? `${form.q2Proyecto}\n${form.q2Relacion}` : i === 2 ? form.q3Detalle : null })),
    };
  }

  async function persistDraft(): Promise<PropuestaDetalle> {
    if (isEditing) {
      return patchPropuesta(editId, draftPayload());
    }
    return createPropuesta({
      ...draftPayload(),
      idConvocatoria: Number(idConvocatoria),
    });
  }

  async function onSave() {
    if (!canCreate) {
      showToast("Ingresá como investigador para crear propuestas", "error");
      return;
    }
    if (!form.titulo.trim() || idConvocatoria === "") {
      showToast("Completá título y convocatoria", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await persistDraft();
      setSaveStatus("Borrador guardado en el servidor");
      showToast("Borrador guardado", "success");
      navigate(`/propuestas/${saved.id}`, { replace: true });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "No se pudo guardar",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  /** Guarda el borrador y lo envía a revisión (CU2 → bandeja CU3). */
  async function onEnviar() {
    if (!canCreate) {
      showToast("Ingresá como investigador para enviar propuestas", "error");
      return;
    }
    if (!form.titulo.trim() || idConvocatoria === "") {
      showToast("Completá título y convocatoria antes de enviar", "error");
      return;
    }
    if (!form.declaracion) {
      showToast("Debés aceptar la declaración jurada antes de enviar", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await persistDraft();
      const sent = await enviarPropuesta(saved.id);
      showToast(
        `Propuesta ${sent.codigo} enviada a revisión`,
        "success",
      );
      navigate(`/propuestas/${sent.id}`, { replace: true });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "No se pudo enviar la propuesta",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <section className="card">
        <h1>Nueva propuesta</h1>
        <p>Esta acción requiere el rol Investigador (o admin).</p>
        <Link to="/propuestas" className="btn btn-secondary">
          Volver
        </Link>
      </section>
    );
  }

  if (loadingEdit) {
    return (
      <section className="card">
        <p>Cargando borrador…</p>
      </section>
    );
  }

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{isEditing ? "Editar borrador" : "Nueva"}</span>
      </div>

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
          >
            <div style={{ width: `${progressPct}%` }} />
          </div>
          <nav className="wizard-steps" aria-label="Pasos del formulario">
            {FORM_WIZARD_STEPS.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-current={i === step ? "step" : undefined}
                className={
                  i === step ? "active" : i < step ? "done" : undefined
                }
                onClick={() => setStep(i)}
              >
                <span>{i + 1}</span>
                <div>
                  <strong>
                    {i + 1}. {label}
                  </strong>
                  <small>{i === step ? "Paso actual" : "Sección del formulario"}</small>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        <section className="card wizard-card">
          <div className="wizard-card-head institutional-form-head">
            <div>
              <span className="eyebrow">
                Formulario VIE 2027 · Paso {step + 1} de{" "}
                {FORM_WIZARD_STEPS.length}
              </span>
              <h1 className="sr-only">
                {isEditing ? "Editar borrador de propuesta" : "Nueva propuesta de investigación"}
              </h1>
              <h2>{FORM_WIZARD_STEPS[step]}</h2>
            </div>
            <div className="form-code">
              <strong>F-VIE-2027</strong>
              <span role="status" aria-live="polite">
                {saveStatus}
              </span>
            </div>
          </div>

          <div className="wizard-body">
            <FormWizardStepContent
              step={step}
              form={form}
              patch={patch}
              convocatorias={convocatorias}
              idConvocatoria={idConvocatoria}
              setIdConvocatoria={setIdConvocatoria}
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
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => void onSave()}
              >
                Guardar borrador
              </button>
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
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={saving}
                    onClick={() => void onSave()}
                  >
                    Guardar y salir
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => void onEnviar()}
                  >
                    Enviar a revisión
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

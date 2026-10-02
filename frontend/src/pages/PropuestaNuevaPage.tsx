import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchConvocatorias, type Convocatoria } from "../api/convocatorias";
import { createPropuesta } from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import { MODALIDADES } from "../data/demo";

export function PropuestaNuevaPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canCreate =
    session?.role === "investigador" || session?.role === "admin";

  const [step, setStep] = useState(0);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [idConvocatoria, setIdConvocatoria] = useState<number | "">("");
  const [titulo, setTitulo] = useState("");
  const [modalidad, setModalidad] = useState<string>(MODALIDADES[0]);
  const [resumen, setResumen] = useState("");
  const [abstractEn, setAbstractEn] = useState("");
  const [keywordsEs, setKeywordsEs] = useState("");
  const [keywordsEn, setKeywordsEn] = useState("");
  const [saving, setSaving] = useState(false);

  const steps = [
    "Identificación",
    "Resumen y palabras clave",
    "Revisión",
  ];

  useEffect(() => {
    void (async () => {
      try {
        const rows = await fetchConvocatorias();
        const activas = rows.filter((c) => c.estado === "activa");
        setConvocatorias(activas.length > 0 ? activas : rows);
        if (activas[0]) setIdConvocatoria(activas[0].id);
        else if (rows[0]) setIdConvocatoria(rows[0].id);
      } catch (err) {
        showToast(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar convocatorias",
          "error",
        );
      }
    })();
  }, [showToast]);

  async function onSave(enviarDespues = false) {
    if (!canCreate) {
      showToast("Ingresá como investigador para crear propuestas", "error");
      return;
    }
    if (!titulo.trim() || idConvocatoria === "") {
      showToast("Completá título y convocatoria", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await createPropuesta({
        titulo: titulo.trim(),
        idConvocatoria: Number(idConvocatoria),
        modalidad,
        resumen: resumen.trim() || undefined,
        abstractEn: abstractEn.trim() || undefined,
        keywordsEs,
        keywordsEn,
      });
      showToast(
        enviarDespues
          ? "Borrador creado"
          : "Borrador guardado en PostgreSQL",
        "success",
      );
      navigate(`/propuestas/${created.id}`, { replace: true });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "No se pudo guardar",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void onSave(false);
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

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>Nueva</span>
      </div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Formulación · CU2</p>
          <h1>Nueva propuesta</h1>
          <p>
            Primer bloque persistente: convocatoria, título, modalidad, resumen
            ES/EN y palabras clave. El resto del formulario se completa después.
          </p>
        </div>
      </header>

      <form className="wizard-layout wizard-layout-wide" onSubmit={onSubmit}>
        <aside className="wizard-sidebar card">
          <div className="wizard-progress-head">
            <span>Progreso</span>
            <span>
              {step + 1}/{steps.length}
            </span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <div className="wizard-steps">
            {steps.map((label, i) => (
              <button
                key={label}
                type="button"
                className={
                  i === step ? "active" : i < step ? "done" : undefined
                }
                onClick={() => setStep(i)}
              >
                <span>{i + 1}</span>
                <div>
                  <strong>{label}</strong>
                  <small>
                    {i < step
                      ? "Completado"
                      : i === step
                        ? "Actual"
                        : "Pendiente"}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="card wizard-card">
          <div className="wizard-card-head institutional-form-head">
            <div>
              <h2>{steps[step]}</h2>
              <p className="save-status">Persistencia PostgreSQL</p>
            </div>
            <div className="form-code">
              <strong>Fondos VIE</strong>
              <span>Formulario institucional</span>
            </div>
          </div>

          <div className="wizard-body stack-lg">
            {step === 0 && (
              <>
                <label className="field">
                  <span className="field-label">Convocatoria</span>
                  <select
                    className="input"
                    value={idConvocatoria}
                    onChange={(e) =>
                      setIdConvocatoria(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    required
                  >
                    <option value="" disabled>
                      Seleccionar…
                    </option>
                    {convocatorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.estado})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Título de la propuesta</span>
                  <input
                    className="input"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </label>
                <fieldset className="field">
                  <legend className="field-label">Modalidad</legend>
                  <div className="choice-row" style={{ marginLeft: 0 }}>
                    {MODALIDADES.map((m) => (
                      <label
                        key={m}
                        className={`radio-choice${modalidad === m ? " selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="modalidad"
                          checked={modalidad === m}
                          onChange={() => setModalidad(m)}
                        />
                        <span className="radio-dot" />
                        {m}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {step === 1 && (
              <>
                <label className="field">
                  <span className="field-label">Resumen (español)</span>
                  <textarea
                    className="input textarea"
                    rows={5}
                    value={resumen}
                    onChange={(e) => setResumen(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Abstract (English)</span>
                  <textarea
                    className="input textarea"
                    rows={5}
                    value={abstractEn}
                    onChange={(e) => setAbstractEn(e.target.value)}
                  />
                </label>
                <div className="form-grid two-col">
                  <label className="field">
                    <span className="field-label">Palabras clave (ES)</span>
                    <input
                      className="input"
                      value={keywordsEs}
                      onChange={(e) => setKeywordsEs(e.target.value)}
                      placeholder="Separadas por coma"
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Keywords (EN)</span>
                    <input
                      className="input"
                      value={keywordsEn}
                      onChange={(e) => setKeywordsEn(e.target.value)}
                      placeholder="Comma separated"
                    />
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="review-summary">
                <strong>{titulo || "(Sin título)"}</strong>
                <p>
                  Modalidad: {modalidad}. Keywords ES: {keywordsEs || "—"}. EN:{" "}
                  {keywordsEn || "—"}.
                </p>
                <p>
                  Al guardar se crea el expediente en estado <em>borrador</em>.
                  Desde el detalle podés enviarlo a revisión.
                </p>
              </div>
            )}
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
            <div className="wizard-footer-right">
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    setStep((s) => Math.min(steps.length - 1, s + 1))
                  }
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Guardar borrador"}
                </button>
              )}
            </div>
          </div>
        </section>
      </form>
    </>
  );
}

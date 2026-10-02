import { useState } from "react";
import { Link } from "react-router-dom";
import { MODALIDADES } from "../data/demo";

export function PropuestaNuevaPage() {
  const [step, setStep] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [modalidad, setModalidad] = useState<string>(MODALIDADES[0]);
  const [resumen, setResumen] = useState("");
  const [abstractEn, setAbstractEn] = useState("");
  const [keywordsEs, setKeywordsEs] = useState("");
  const [keywordsEn, setKeywordsEn] = useState("");

  const steps = [
    "Identificación",
    "Resumen y palabras clave",
    "Equipo",
    "Revisión",
  ];

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>Nueva</span>
      </div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Formulación</p>
          <h1>Nueva propuesta</h1>
          <p>
            Wizard local (sin API). Modalidades y abstract EN alineados al
            formulario VIE 2027; el resto de secciones se irá portando del
            prototipo.
          </p>
        </div>
      </header>

      <div className="wizard-layout wizard-layout-wide">
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
                    {i < step ? "Completado" : i === step ? "Actual" : "Pendiente"}
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
              <p className="save-status">Guardado local · sin backend</p>
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
                  <span className="field-label">Título de la propuesta</span>
                  <input
                    className="input"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
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
              <div className="instruction-box">
                <span>i</span>
                <div>
                  <strong>Equipo investigador</strong>
                  <p>
                    En el port completo se capturan ORCID, instancia, rol,
                    horas VIE y participantes externos. Por ahora este paso es
                    un marcador estructural.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="review-summary">
                <strong>{titulo || "(Sin título)"}</strong>
                <p>
                  Modalidad: {modalidad}. Keywords ES: {keywordsEs || "—"}. EN:{" "}
                  {keywordsEn || "—"}.
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
                <Link to="/propuestas" className="btn btn-primary">
                  Guardar borrador local
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

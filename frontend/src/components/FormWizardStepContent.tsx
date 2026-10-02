import type { ReactNode } from "react";
import type { Convocatoria } from "../api/convocatorias";
import { MODALIDADES } from "../data/demo";
import { DEMO_PROPOSALS } from "../data/demo";
import type { FormWizardState, GradoVinculo, YesNo } from "../data/formWizard";
import { formatCRC } from "../data/proposalView";

type Props = {
  step: number;
  form: FormWizardState;
  patch: (partial: Partial<FormWizardState>) => void;
  convocatorias: Convocatoria[];
  idConvocatoria: number | "";
  setIdConvocatoria: (v: number | "") => void;
};

function QuestionBlock({
  number,
  question,
  children,
}: {
  number: number;
  question: string;
  children: ReactNode;
}) {
  return (
    <div className="question-block">
      <div className="question-title">
        <span>{number}</span>
        <p>{question}</p>
      </div>
      {children}
    </div>
  );
}

function YesNoRow({
  value,
  onChange,
  extra,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="stack-md">
      <div className="choice-row" style={{ marginLeft: 0 }}>
        {(["No", "Sí"] as YesNo[]).map((opt) => (
          <label
            key={opt}
            className={`radio-choice${value === opt ? " selected" : ""}`}
          >
            <input
              type="radio"
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span className="radio-dot" />
            {opt}
          </label>
        ))}
      </div>
      {extra}
    </div>
  );
}

export function FormWizardStepContent({
  step,
  form,
  patch,
  convocatorias,
  idConvocatoria,
  setIdConvocatoria,
}: Props) {
  const rich = DEMO_PROPOSALS[0]!;

  if (step === 0) {
    return (
      <div className="stack-xl">
        <div className="form-section-block">
          <p className="body-copy">
            Identificación y preguntas generales. Esta pantalla reproduce la
            primera parte del formulario oficial VIE 2027. Respondé todas las
            preguntas; los campos adicionales aparecen cuando seleccionás «Sí».
          </p>
        </div>

        <section className="form-section-block">
          <div className="numbered-title">
            <span>1</span>
            <h3>Identificación del proyecto</h3>
          </div>
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
            >
              <option value="" disabled>
                Seleccionar…
              </option>
              {convocatorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid two-col">
            <label className="field">
              <span className="field-label">Nombre del proyecto</span>
              <input
                className="input"
                value={form.titulo}
                onChange={(e) => patch({ titulo: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Modalidad</span>
              <select
                className="input"
                value={form.modalidad}
                onChange={(e) => patch({ modalidad: e.target.value })}
              >
                {MODALIDADES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Fecha de inicio</span>
              <input
                type="date"
                className="input"
                value={form.inicio}
                onChange={(e) => patch({ inicio: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Fecha de finalización</span>
              <input
                type="date"
                className="input"
                value={form.fin}
                onChange={(e) => patch({ fin: e.target.value })}
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">
              Dependencia académica coordinadora
            </span>
            <input
              className="input"
              value={form.escuela}
              onChange={(e) => patch({ escuela: e.target.value })}
            />
          </label>
        </section>

        <section className="form-section-block">
          <div className="numbered-title">
            <span>2</span>
            <h3>Preguntas generales</h3>
          </div>
          <div className="questions-stack">
            <QuestionBlock
              number={1}
              question="¿Ha sido esta propuesta sometida, parcial o totalmente, a otras fuentes de financiamiento o a FUNDATEC?"
            >
              <YesNoRow
                value={form.q1}
                onChange={(q1) => patch({ q1 })}
              />
            </QuestionBlock>
            <QuestionBlock
              number={2}
              question="¿Existe vinculación técnica o de continuidad con otros proyectos inscritos ante la VIE o con una hoja de ruta?"
            >
              <YesNoRow
                value={form.q2}
                onChange={(q2) => patch({ q2 })}
                extra={
                  form.q2 === "Sí" ? (
                    <div className="form-grid two-col">
                      <label className="field">
                        <span className="field-label">
                          Nombre del proyecto relacionado
                        </span>
                        <input
                          className="input"
                          value={form.q2Proyecto}
                          onChange={(e) =>
                            patch({ q2Proyecto: e.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">Tipo de relación</span>
                        <input
                          className="input"
                          value={form.q2Relacion}
                          onChange={(e) =>
                            patch({ q2Relacion: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={3}
              question="¿Atiende problemas prioritarios identificados por planes nacionales, sectoriales o entes externos de relevancia?"
            >
              <YesNoRow
                value={form.q3}
                onChange={(q3) => patch({ q3 })}
                extra={
                  form.q3 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Problema y documento de referencia
                      </span>
                      <textarea
                        className="input textarea"
                        rows={3}
                        value={form.q3Detalle}
                        onChange={(e) => patch({ q3Detalle: e.target.value })}
                      />
                    </label>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={4}
              question="¿Se requiere formalizar un instrumento jurídico entre el ITCR y entes externos?"
            >
              <YesNoRow value={form.q4} onChange={(q4) => patch({ q4 })} />
            </QuestionBlock>
            <QuestionBlock
              number={5}
              question="¿Se fundamenta esta iniciativa en un convenio marco de cooperación técnica actualmente vigente?"
            >
              <YesNoRow value={form.q5} onChange={(q5) => patch({ q5 })} />
            </QuestionBlock>
            <QuestionBlock
              number={6}
              question="¿Corresponde esta propuesta, parcial o totalmente, a investigación base para optar por un grado académico superior?"
            >
              <div className="choice-row" style={{ marginLeft: 0 }}>
                {(["No", "Sí, parcial", "Sí, totalmente"] as GradoVinculo[]).map(
                  (opt) => (
                    <label
                      key={opt}
                      className={`radio-choice${form.q6 === opt ? " selected" : ""}`}
                    >
                      <input
                        type="radio"
                        checked={form.q6 === opt}
                        onChange={() => patch({ q6: opt })}
                      />
                      <span className="radio-dot" />
                      {opt}
                    </label>
                  ),
                )}
              </div>
            </QuestionBlock>
            <QuestionBlock
              number={7}
              question="¿Contiene la propuesta información sensible de terceros o datos sujetos a confidencialidad?"
            >
              <YesNoRow value={form.q7} onChange={(q7) => patch({ q7 })} />
            </QuestionBlock>
            <QuestionBlock
              number={8}
              question="¿La propuesta presenta potencial de generar resultados susceptibles de protección mediante propiedad intelectual?"
            >
              <YesNoRow value={form.q8} onChange={(q8) => patch({ q8 })} />
            </QuestionBlock>
          </div>
        </section>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="stack-lg">
        <label className="field">
          <span className="field-label">Resumen (español)</span>
          <textarea
            className="input textarea"
            rows={6}
            value={form.resumen}
            onChange={(e) => patch({ resumen: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Abstract (English)</span>
          <textarea
            className="input textarea"
            rows={6}
            value={form.abstract}
            onChange={(e) => patch({ abstract: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Palabras clave</span>
          <input
            className="input"
            value={form.palabras}
            onChange={(e) => patch({ palabras: e.target.value })}
          />
        </label>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>ORCID</th>
              <th>Instancia</th>
              <th>Rol</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {rich.teamTec.map((m) => (
              <tr key={m.nombre}>
                <td>{m.nombre}</td>
                <td>{m.orcid ?? "—"}</td>
                <td>{m.instancia}</td>
                <td>{m.rol}</td>
                <td>{m.horas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="stack-lg">
        <label className="field">
          <span className="field-label">Planteamiento del problema</span>
          <textarea
            className="input textarea"
            rows={5}
            value={form.problema}
            onChange={(e) => patch({ problema: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Objetivos</span>
          <textarea
            className="input textarea"
            rows={4}
            value={form.objetivos}
            onChange={(e) => patch({ objetivos: e.target.value })}
          />
        </label>
      </div>
    );
  }

  if (step === 4) {
    return (
      <p className="body-copy">
        Revisión bibliográfica y antecedentes técnicos alineados al formulario
        oficial VIE 2027 (sección Estado del arte).
      </p>
    );
  }

  if (step === 5) {
    return (
      <label className="field">
        <span className="field-label">Metodología</span>
        <textarea
          className="input textarea"
          rows={8}
          value={form.metodologia}
          onChange={(e) => patch({ metodologia: e.target.value })}
        />
      </label>
    );
  }

  if (step === 6 && rich.plan) {
    return (
      <div className="table-wrap">
        <table className="data-table wide-form-table">
          <thead>
            <tr>
              <th>Objetivo</th>
              <th>Actividad</th>
              <th>Resultado</th>
              <th>Riesgo</th>
              <th>Mitigación</th>
            </tr>
          </thead>
          <tbody>
            {rich.plan.map((row) => (
              <tr key={row.objetivo + row.actividad}>
                <td>{row.objetivo}</td>
                <td>{row.actividad}</td>
                <td>{row.resultado}</td>
                <td>{row.riesgo}</td>
                <td>{row.mitigacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (step === 7 && rich.presupuestoAnual) {
    const total = rich.presupuestoAnual.reduce(
      (s, r) => s + r.operativo + r.duraderos,
      0,
    );
    return (
      <div className="stack-lg">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Año</th>
                <th>Operativo</th>
                <th>Duraderos</th>
              </tr>
            </thead>
            <tbody>
              {rich.presupuestoAnual.map((r) => (
                <tr key={r.anio}>
                  <td>{r.anio}</td>
                  <td>{formatCRC(r.operativo)}</td>
                  <td>{formatCRC(r.duraderos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="budget-total-banner">
          <strong>Total</strong>
          <span>{formatCRC(total)}</span>
        </div>
      </div>
    );
  }

  if (step === 8) {
    return (
      <ul>
        {(rich.productos ?? []).map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    );
  }

  if (step === 9) {
    return (
      <p className="body-copy">
        Resguardo de productos y activos de propiedad intelectual:{" "}
        {rich.activoPI ?? "—"}
      </p>
    );
  }

  if (step === 10) {
    return (
      <p className="body-copy">
        Plan de divulgación y socialización de resultados (conferencias, talleres
        y transferencia a comunidades beneficiarias).
      </p>
    );
  }

  if (step === 11) {
    return <p className="body-copy">{rich.etica}</p>;
  }

  if (step === 12) {
    return (
      <p className="body-copy">
        Vinculación con hoja de ruta institucional y continuidad de líneas de
        investigación priorizadas por la VIE.
      </p>
    );
  }

  if (step === 13) {
    return (
      <label className="field">
        <span className="field-label">Referencias</span>
        <textarea
          className="input textarea"
          rows={10}
          value={form.referencias}
          onChange={(e) => patch({ referencias: e.target.value })}
        />
      </label>
    );
  }

  if (step === 14) {
    return (
      <label className="field">
        <span className="field-label">Declaración jurada</span>
        <label className="radio-choice selected">
          <input
            type="checkbox"
            checked={form.declaracion}
            onChange={(e) => patch({ declaracion: e.target.checked })}
          />
          <span className="radio-dot" />
          Confirmo que la información es veraz y completa según el formulario
          VIE 2027.
        </label>
      </label>
    );
  }

  if (step === 15) {
    return (
      <div className="task-list">
        {rich.documentos.map((d) => (
          <div key={d.nombre} className="task-row" style={{ cursor: "default" }}>
            <strong>{d.nombre}</strong>
            <span className="badge badge-primary">{d.estado}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="review-summary stack-md">
      <strong>{form.titulo}</strong>
      <p>
        Modalidad: {form.modalidad}. Escuela: {form.escuela}. Palabras clave:{" "}
        {form.palabras}.
      </p>
      <p>
        Al guardar se crea o actualiza el borrador con identificación y resumen.
        El resto de secciones permanecen en el expediente del formulario.
      </p>
    </div>
  );
}

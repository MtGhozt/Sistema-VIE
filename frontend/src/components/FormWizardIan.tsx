import {apiJson} from "../api/client";
import { useEffect, useState, useId, type ReactNode } from "react";
import type { Convocatoria } from "../api/convocatorias";

import {
  BASIC_ACADEMIC_PRODUCTS,
  ESTADO_ARTE_MAX_WORDS,
  FINANCING_TYPES,
  PLAN_RESPONSIBILITIES,
  TECHNOLOGY_ACADEMIC_PRODUCTS,
  TECHNOLOGY_IP_ASSETS,
  type ActionPlanActivityDraft,
  type AcademicProductDraft,
  type ActionPlanParticipantDraft,
  type ActionPlanRiskDraft,
  type AdditionalProductDraft,
  type AmbitoInstrumento,
  type FormWizardState,
  type GradoVinculo,
  type NivelTrl,
  TEAM_HOUR_TYPES,
  TEAM_MEMBER_ROLES,
  type TeamHourDraft,
  type TeamTecDraft,
  type TipoInnovacion,
  type TechnologyAssetDraft,
  type YesNo,
  TRL_LEVELS,
} from "../data/formWizardIan";
import { formatCRC } from "../data/proposalView";

type Props = {
  bloquearIdentificacion?:boolean;
  documentos?:ReactNode;
  lineas:number[];
  onIdentificacion:(p:{lineas?:number[]})=>void;
  step: number;
  form: FormWizardState;
  patch: (partial: Partial<FormWizardState>) => void;
  convocatorias: Convocatoria[];
  idConvocatoria: number | "";
  setIdConvocatoria: (v: number | "") => void;
  /** Solo lectura: sin mutaciones; ocultar Agregar/Quitar. */
  readOnly?: boolean;
};

function yesNoValue(value: string): YesNo | "" {
  if (value === "Sí" || value === "No") return value;
  return "";
}

function ambitoValue(value: string): AmbitoInstrumento {
  if (value === "nacional" || value === "internacional") return value;
  return "";
}

function tipoInnovacionValue(value: string): TipoInnovacion {
  if (value === "Proceso" || value === "Producto") return value;
  return "";
}

function nivelTrlValue(value: string): NivelTrl {
  return TRL_LEVELS.find((nivel) => nivel.value === value)?.value ?? "";
}

function formatOrcidInput(input: HTMLInputElement): string {
  const cursorPosition = input.selectionStart ?? input.value.length;
  const inputBeforeCursor = input.value
    .slice(0, cursorPosition)
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
  const characters = input.value.toUpperCase().replace(/[^0-9X]/g, "");
  const digits = characters.replace(/\D/g, "").slice(0, 16);
  const value =
    characters.endsWith("X") && digits.length === 15
      ? `${digits}X`
      : digits;
  const digitsBeforeCursor = inputBeforeCursor.replace(/X/g, "").length;
  const cursorCharacters = Math.min(
    digitsBeforeCursor +
      (inputBeforeCursor.endsWith("X") && value.endsWith("X") ? 1 : 0),
    value.length,
  );
  const formatted =
    value.match(/.{1,4}/g)?.join("-") ?? "";
  const formattedCursor =
    cursorCharacters === 0
      ? 0
      : cursorCharacters + Math.floor((cursorCharacters - 1) / 4);

  requestAnimationFrame(() =>
    input.setSelectionRange(formattedCursor, formattedCursor),
  );
  return formatted;
}

function QuestionBlock({
  number,
  question,
  children,
}: {
  number: number;
  question: string;
  children: ReactNode;
}) {
  const questionId = useId();
  return (
    // El bloque completo se anuncia como grupo con el nombre de la pregunta,
    // para que un lector de pantalla anuncie el contexto antes del control.
    <div className="question-block" role="group" aria-labelledby={questionId}>
      <div className="question-title">
        <span>{number}</span>
        <p id={questionId}>{question}</p>
      </div>
      {children}
    </div>
  );
}

function YesNoRow({
  value,
  onChange,
  extra,
  disabled=false,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  extra?: ReactNode;
  disabled?:boolean;
}) {
  // Checkbox exclusivo (mismo patrón que el formulario oficial VIE)
  return (
    <div className="stack-md">
      <div className="choice-row" style={{ marginLeft: 0 }} role="group">
        {(["No", "Sí"] as YesNo[]).map((opt) => (
          <label
            key={opt}
            className={`radio-choice${value === opt ? " selected" : ""}`}
          >
            <input
              type="checkbox"
              disabled={disabled}
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

export function FormWizardIan({
  bloquearIdentificacion=false, documentos, lineas, onIdentificacion,
  step,
  form,
  patch: patchProp,
  convocatorias,
  idConvocatoria,
  setIdConvocatoria,
  readOnly = false,
}: Props) {
  const q6GroupName = useId();
  const [catalogos,setCatalogos]=useState<{modalidades:{codigo:string;nombre:string}[];lineas:{id_linea_investigacion:number;nombre:string}[]}>({modalidades:[],lineas:[]});
  const [error,setError]=useState('');
  const [collapsedActivities, setCollapsedActivities] = useState<
    Record<string, boolean>
  >({});
  useEffect(()=>{let mounted=true;apiJson<typeof catalogos>('/api/catalogos').then(c=>{if(mounted)setCatalogos(c);}).catch(e=>{if(mounted)setError(e.message);});return()=>{mounted=false;};},[]);
  const BUDGET_YEARS=form.presupuestoAnual.map(p=>p.anio);
  const patch = readOnly ? (() => {}) as typeof patchProp : patchProp;

  function patchTeamTec(id: string, partial: Partial<TeamTecDraft>) {
    patch({
      teamTec: form.teamTec.map((member) =>
        member.id === id ? { ...member, ...partial } : member,
      ),
    });
  }

  function patchTeamHours(
    memberId: string,
    index: number,
    partial: Partial<TeamHourDraft>,
  ) {
    patch({
      teamTec: form.teamTec.map((member) =>
        member.id === memberId
          ? {
              ...member,
              horas:
                member.horas.length === 0 && index === 0
                  ? [{ tipo: "", cantidad: "", ...partial }]
                  : member.horas.map((hours, hourIndex) =>
                      hourIndex === index ? { ...hours, ...partial } : hours,
                    ),
            }
          : member,
      ),
    });
  }

  function patchPlanActivity(
    activityId: string,
    partial: Partial<ActionPlanActivityDraft>,
  ) {
    patch({
      planAccion: form.planAccion.map((activity) =>
        activity.id === activityId ? { ...activity, ...partial } : activity,
      ),
    });
  }

  function patchPlanParticipant(
    activityId: string,
    participantId: string,
    partial: Partial<ActionPlanParticipantDraft>,
  ) {
    patch({
      planAccion: form.planAccion.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              participantes: activity.participantes.map((participant) =>
                participant.id === participantId
                  ? { ...participant, ...partial }
                  : participant,
              ),
            }
          : activity,
      ),
    });
  }

  function patchPlanRisk(
    activityId: string,
    riskId: string,
    partial: Partial<ActionPlanRiskDraft>,
  ) {
    patch({
      planAccion: form.planAccion.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              riesgos: activity.riesgos.map((risk) =>
                risk.id === riskId ? { ...risk, ...partial } : risk,
              ),
            }
          : activity,
      ),
    });
  }

  function patchAcademicProduct(
    id: string,
    partial: Partial<AcademicProductDraft>,
  ) {
    patch({
      productosAcademicos: form.productosAcademicos.map((product) =>
        product.id === id ? { ...product, ...partial } : product,
      ),
    });
  }

  function patchTechnologyAsset(
    id: string,
    partial: Partial<TechnologyAssetDraft>,
  ) {
    patch({
      activosPI: form.activosPI.map((asset) =>
        asset.id === id ? { ...asset, ...partial } : asset,
      ),
    });
  }

  function patchAdditionalProduct(
    id: string,
    partial: Partial<AdditionalProductDraft>,
  ) {
    patch({
      productosAdicionales: form.productosAdicionales.map((product) =>
        product.id === id ? { ...product, ...partial } : product,
      ),
    });
  }

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

        {error&&<p role="alert">{error}</p>}
        <fieldset className="research-lines">
          <legend>Líneas de investigación</legend>
          <div className="research-lines-options">
            {catalogos.lineas.map((linea) => (
              <label
                className="research-line-option"
                key={linea.id_linea_investigacion}
              >
                <input
                  type="checkbox"
                  checked={lineas.includes(linea.id_linea_investigacion)}
                  onChange={(event) =>
                    onIdentificacion({
                      lineas: event.target.checked
                        ? [...lineas, linea.id_linea_investigacion]
                        : lineas.filter(
                            (id) => id !== linea.id_linea_investigacion,
                          ),
                    })
                  }
                />
                {linea.nombre}
              </label>
            ))}
          </div>
        </fieldset>
        <section className="form-section-block project-identification">
          <div className="numbered-title">
            <span>1</span>
            <h3>Identificación del proyecto</h3>
          </div>
          <label className="field">
            <span className="field-label">Convocatoria</span>
            <select
              aria-label="Convocatoria"
              className="input"
              disabled={bloquearIdentificacion} value={idConvocatoria}
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
                aria-label="Nombre del proyecto"
                className="input"
                value={form.titulo}
                onChange={(e) => patch({ titulo: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Modalidad</span>
              <select
                aria-label="Modalidad"
                className="input"
                disabled={bloquearIdentificacion} value={form.modalidad}
                onChange={(e) => patch({ modalidad: e.target.value })}
              >
                <option value="">Seleccionar…</option>
                {form.modalidad&&!catalogos.modalidades.some(m=>m.nombre===form.modalidad)&&<option value={form.modalidad}>{form.modalidad} (actual)</option>}
                {catalogos.modalidades.map(({codigo,nombre:m}) => (
                  <option key={codigo} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Fecha de inicio (día/mes/año)</span>
              <input
                aria-label="Fecha de inicio"
                type="date"
                className="input"
                min="2000-01-01"
                max="2100-12-31"
                value={form.inicio}
                onChange={(e) => patch({ inicio: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Fecha de finalización (día/mes/año)</span>
              <input
                aria-label="Fecha de finalización"
                type="date"
                className="input"
                min={form.inicio || "2000-01-01"}
                max="2100-12-31"
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
              aria-label="Dependencia académica coordinadora"
              className="input"
              value={form.escuela} readOnly
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
                extra={
                  form.q1 === "Sí" ? (
                    <div className="stack-md">
                      <div className="form-grid two-col">
                        <label className="field">
                          <span className="field-label">Entidad</span>
                          <input
                            aria-label="Entidad"
                            className="input"
                            value={form.q1Entidad}
                            onChange={(e) =>
                              patch({ q1Entidad: e.target.value })
                            }
                          />
                        </label>
                        <label className="field">
                          <span className="field-label">
                            Estado de la gestión
                          </span>
                          <select
                            aria-label="Estado de la gestión"
                            className="input"
                            value={form.q1Estado}
                            onChange={(e) =>
                              patch({ q1Estado: e.target.value })
                            }
                          >
                            <option value="">Seleccionar…</option>
                            <option value="En evaluación">En evaluación</option>
                            <option value="Aprobada">Aprobada</option>
                            <option value="Rechazada">Rechazada</option>
                            <option value="En ejecución">En ejecución</option>
                            <option value="Finalizada">Finalizada</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </label>
                      </div>
                      <label className="field">
                        <span className="field-label">
                          ¿Existe compromiso de contrapartida institucional?
                        </span>
                        <select
                          aria-label="¿Existe compromiso de contrapartida institucional?"
                          className="input"
                          value={form.q1Contrapartida}
                          onChange={(e) =>
                            patch({
                              q1Contrapartida: yesNoValue(e.target.value),
                            })
                          }
                        >
                          <option value="">Seleccionar…</option>
                          <option value="Sí">Sí</option>
                          <option value="No">No</option>
                        </select>
                      </label>
                    </div>
                  ) : null
                }
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
                          aria-label="Nombre del proyecto relacionado"
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
                          aria-label="Tipo de relación"
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
                        aria-label="Problema y documento de referencia"
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
              <YesNoRow
                value={form.q4}
                onChange={(q4) => patch({ q4 })}
                extra={
                  form.q4 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Ámbito del instrumento a gestionar
                      </span>
                      <select
                        aria-label="Ámbito del instrumento a gestionar"
                        className="input"
                        value={form.q4Ambito}
                        onChange={(e) =>
                          patch({
                            q4Ambito: ambitoValue(e.target.value),
                          })
                        }
                      >
                        <option value="">Seleccionar…</option>
                        <option value="nacional">Convenio Nacional</option>
                        <option value="internacional">
                          Convenio Internacional
                        </option>
                      </select>
                    </label>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={5}
              question="¿Se fundamenta esta iniciativa en un convenio marco de cooperación técnica actualmente vigente?"
            >
              <YesNoRow
                value={form.q5}
                onChange={(q5) => patch({ q5 })}
                extra={
                  form.q5 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Nombre completo del convenio
                      </span>
                      <input
                        aria-label="Nombre completo del convenio"
                        className="input"
                        value={form.q5Convenio}
                        onChange={(e) =>
                          patch({ q5Convenio: e.target.value })
                        }
                      />
                    </label>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={6}
              question="¿Corresponde esta propuesta, parcial o totalmente, a investigación base para optar por un grado académico superior?"
            >
              <div className="stack-md">
                <div className="choice-row" style={{ marginLeft: 0 }}>
                  {(["No", "Sí, parcial", "Sí, totalmente"] as GradoVinculo[]).map(
                    (opt) => (
                      <label
                        key={opt}
                        className={`radio-choice${form.q6 === opt ? " selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={q6GroupName}
                          checked={form.q6 === opt}
                          onChange={() => patch({ q6: opt })}
                        />
                        <span className="radio-dot" />
                        {opt}
                      </label>
                    ),
                  )}
                </div>
                {form.q6 !== "No" && form.q6 !== "" ? (
                  <div className="form-grid two-col">
                    <label className="field">
                      <span className="field-label">
                        Nombre de la persona candidata
                      </span>
                      <input
                        aria-label="Nombre de la persona candidata"
                        className="input"
                        value={form.q6Persona}
                        onChange={(e) => patch({ q6Persona: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">
                        Programa y grado académico a obtener
                      </span>
                      <input
                        aria-label="Programa y grado académico a obtener"
                        className="input"
                        value={form.q6Programa}
                        onChange={(e) => patch({ q6Programa: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">
                        Universidad que acredita el grado
                      </span>
                      <input
                        aria-label="Universidad que acredita el grado"
                        className="input"
                        value={form.q6Universidad}
                        onChange={(e) =>
                          patch({ q6Universidad: e.target.value })
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </QuestionBlock>
            <QuestionBlock
              number={7}
              question="¿Contiene la propuesta información sensible de terceros o datos sujetos a confidencialidad?"
            >
              <YesNoRow
                value={form.q7}
                onChange={(q7) => patch({ q7 })}
                extra={
                  form.q7 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Tipo de información y fuente de la restricción
                      </span>
                      <textarea
                        aria-label="Tipo de información y fuente de la restricción"
                        className="input textarea"
                        rows={3}
                        value={form.q7Detalle}
                        onChange={(e) => patch({ q7Detalle: e.target.value })}
                      />
                    </label>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={8}
              question="¿La propuesta presenta potencial de generar resultados susceptibles de protección mediante propiedad intelectual?"
            >
              <YesNoRow
                disabled={bloquearIdentificacion} value={form.q8}
                onChange={(q8) => patch({ q8 })}
                extra={
                  form.q8 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Número de oficio del dictamen del Centro de Vinculación
                      </span>
                      <input
                        aria-label="Número de oficio del dictamen del Centro de Vinculación"
                        className="input"
                        value={form.q8Oficio}
                        onChange={(e) => patch({ q8Oficio: e.target.value })}
                      />
                    </label>
                  ) : null
                }
              />
            </QuestionBlock>
            <QuestionBlock
              number={9}
              question="¿Considera que los resultados del proyecto se traducirán en una innovación conforme a los criterios institucionales, alcanzando aplicación, implementación o adopción real que demuestre generación de valor o impacto?"
            >
              <YesNoRow
                value={form.q9}
                onChange={(q9) => patch({ q9 })}
                extra={
                  form.q9 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Tipo de innovación predominante
                      </span>
                      <select
                        aria-label="Tipo de innovación predominante"
                        className="input"
                        value={form.q9Tipo}
                        onChange={(e) =>
                          patch({ q9Tipo: tipoInnovacionValue(e.target.value) })
                        }
                      >
                        <option value="">Seleccionar…</option>
                        <option value="Proceso">Proceso</option>
                        <option value="Producto">Producto</option>
                      </select>
                    </label>
                  ) : null
                }
              />
            </QuestionBlock>
            {form.modalidad === "Desarrollo tecnológico" ? (
              <label className="field">
                <span className="field-label">
                  Si es una iniciativa de desarrollo tecnológico, indique el
                  nivel de madurez tecnológica (TRL) que mejor lo describe según
                  el siguiente cuadro:
                </span>
                <select
                  aria-label="Nivel de madurez tecnológica (TRL) esperado"
                  className="input"
                  value={form.trlEsperado}
                  onChange={(e) =>
                    patch({ trlEsperado: nivelTrlValue(e.target.value) })
                  }
                >
                  <option value="">Seleccionar nivel…</option>
                  {TRL_LEVELS.map((nivel) => (
                    <option key={nivel.value} value={nivel.value}>
                      {nivel.value}: {nivel.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  if (step === 1) {
    const resumenWords = form.resumen
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return (
      <div className="stack-lg">
        <label className="field">
          <span className="field-label">Resumen (español · máximo 500 palabras)</span>
          <textarea
            aria-label="Resumen (español · máximo 500 palabras)"
            className="input textarea"
            rows={6}
            value={form.resumen}
            onChange={(e) => patch({ resumen: e.target.value })}
          />
          <span
            className="field-hint"
            style={
              resumenWords > 500
                ? { color: "var(--danger, #b00020)" }
                : undefined
            }
          >
            {resumenWords} / 500 palabras
            {resumenWords > 500 && " — reduzca el texto antes de continuar"}
          </span>
        </label>
        <label className="field">
          <span className="field-label">Abstract (English)</span>
          <textarea
            aria-label="Abstract (English)"
            className="input textarea"
            rows={6}
            value={form.abstract}
            onChange={(e) => patch({ abstract: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Palabras clave</span>
          <input
            aria-label="Palabras clave"
            className="input"
            value={form.palabras}
            onChange={(e) => patch({ palabras: e.target.value })}
            placeholder="Separadas por comas"
          />
        </label>
        <label className="field">
          <span className="field-label">Keywords EN (opcionales)</span>
          <input
            aria-label="Keywords EN (opcionales)"
            className="input"
            value={form.keywords}
            onChange={(e) => patch({ keywords: e.target.value })}
            placeholder="Separate with commas"
          />
        </label>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="stack-xl">
        <p className="body-copy">
          Agregá las personas funcionarias del TEC y las personas colaboradoras
          externas que participarán en la propuesta. Podés añadir tantas filas y
          tipos de horas como necesités.
        </p>

        <section className="stack-md" aria-labelledby="team-tec-heading">
          <div className="page-heading">
            <div>
              <h3 id="team-tec-heading">
                Cuadro 2. Investigadores que son funcionarios del TEC
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                patch({
                  teamTec: [
                    ...form.teamTec,
                    {
                      id: `tec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      nombre: "",
                      iniciales: "",
                      orcid: "",
                      instancia: "",
                      rol: "",
                      horas: [{ tipo: "", cantidad: "" }],
                      periodo: "",
                    },
                  ],
                })
              }
            >
              Agregar investigador/a TEC
            </button>
          </div>
          {form.teamTec.length === 0 ? (
            <p className="team-empty-state">
              Aún no agregaste personas funcionarias del TEC.
            </p>
          ) : (
            <div className="team-member-list">
              {form.teamTec.map((member, memberIndex) => (
                <article className="team-member-card" key={member.id}>
                  <div className="team-member-card-header">
                    <h4>Persona investigadora TEC {memberIndex + 1}</h4>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-label={`Quitar persona TEC ${memberIndex + 1}${member.nombre ? `: ${member.nombre}` : ""}`}
                      onClick={() =>
                        patch({
                          teamTec: form.teamTec.filter(
                            (item) => item.id !== member.id,
                          ),
                        })
                      }
                    >
                      Quitar persona
                    </button>
                  </div>
                  <div className="team-member-fields team-tec-fields">
                    <label className="team-member-field">
                      <span className="field-label">Nombre y apellidos</span>
                      <input
                        className="input"
                        value={member.nombre}
                        maxLength={150}
                        aria-label={`Nombre y apellidos, persona TEC ${memberIndex + 1}`}
                        onChange={(event) =>
                          patchTeamTec(member.id, {
                            nombre: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">Iniciales</span>
                      <input
                        className="input"
                        value={member.iniciales}
                        maxLength={10}
                        aria-label={`Iniciales, persona TEC ${memberIndex + 1}`}
                        onChange={(event) =>
                          patchTeamTec(member.id, {
                            iniciales: event.target.value.toUpperCase(),
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">ID ORCID *</span>
                      <input
                        className="input"
                        value={member.orcid}
                        maxLength={19}
                        placeholder="0000-0000-0000-0000"
                        aria-required="true"
                        aria-label={`ID ORCID, persona TEC ${memberIndex + 1}`}
                        onChange={(event) =>
                          patchTeamTec(member.id, {
                            orcid: formatOrcidInput(event.currentTarget),
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">Instancia académica</span>
                      <input
                        className="input"
                        value={member.instancia}
                        maxLength={200}
                        aria-label={`Instancia académica, persona TEC ${memberIndex + 1}`}
                        onChange={(event) =>
                          patchTeamTec(member.id, {
                            instancia: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">Condición (rol) *</span>
                      <select
                        className="input"
                        value={member.rol}
                        aria-required="true"
                        aria-label={`Condición o rol, persona TEC ${memberIndex + 1}`}
                        onChange={(event) => {
                          const role =
                            TEAM_MEMBER_ROLES.find(
                              (item) => item === event.target.value,
                            ) ?? "";
                          patchTeamTec(member.id, { rol: role });
                        }}
                      >
                        <option value="">Elegí una condición</option>
                        {TEAM_MEMBER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="team-member-field team-hours-field">
                      <span className="field-label">
                        Cantidad y tipo de horas
                      </span>
                      <div className="stack-sm">
                        {(member.horas.length > 0
                          ? member.horas
                          : [{ tipo: "", cantidad: "" }]
                        ).map((hours, hourIndex) => (
                          <div
                            className="team-hours-row"
                            key={`${member.id}-hours-${hourIndex}`}
                          >
                            <label
                              className="sr-only"
                              htmlFor={`${member.id}-hours-type-${hourIndex}`}
                            >
                              Tipo de horas, persona TEC {memberIndex + 1}
                            </label>
                            <select
                              id={`${member.id}-hours-type-${hourIndex}`}
                              className="input"
                              value={hours.tipo}
                              aria-label={`Tipo de horas ${hourIndex + 1}, persona TEC ${memberIndex + 1}`}
                              onChange={(event) => {
                                const hourType =
                                  TEAM_HOUR_TYPES.find(
                                    (item) => item === event.target.value,
                                  ) ?? "";
                                patchTeamHours(member.id, hourIndex, {
                                  tipo: hourType,
                                });
                              }}
                            >
                              <option value="">Tipo</option>
                              {TEAM_HOUR_TYPES.map((type) => (
                                <option
                                  key={type}
                                  value={type}
                                  disabled={member.horas.some(
                                    (item, index) =>
                                      index !== hourIndex &&
                                      item.tipo === type,
                                  )}
                                >
                                  {type}
                                </option>
                              ))}
                            </select>
                            <label
                              className="sr-only"
                              htmlFor={`${member.id}-hours-amount-${hourIndex}`}
                            >
                              Cantidad de horas, persona TEC {memberIndex + 1}
                            </label>
                            <input
                              id={`${member.id}-hours-amount-${hourIndex}`}
                              className="input"
                              type="number"
                              min="0.01"
                              max="999.99"
                              step="0.01"
                              value={hours.cantidad}
                              aria-label={`Cantidad de horas ${hourIndex + 1}, persona TEC ${memberIndex + 1}`}
                              onChange={(event) =>
                                patchTeamHours(member.id, hourIndex, {
                                  cantidad: event.target.value,
                                })
                              }
                            />
                            {member.horas.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                aria-label={`Quitar tipo de horas ${hourIndex + 1}, persona TEC ${memberIndex + 1}`}
                                onClick={() =>
                                  patchTeamTec(member.id, {
                                    horas: member.horas.filter(
                                      (_, index) => index !== hourIndex,
                                    ),
                                  })
                                }
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-secondary team-add-hours"
                          aria-label={`Agregar otro tipo de horas, persona TEC ${memberIndex + 1}`}
                          onClick={() =>
                            patchTeamTec(member.id, {
                              horas: [
                                ...member.horas,
                                { tipo: "", cantidad: "" },
                              ],
                            })
                          }
                        >
                          Agregar otro tipo de horas
                        </button>
                      </div>
                    </div>
                    <label className="team-member-field">
                      <span className="field-label">
                        Periodo de nombramiento
                      </span>
                      <input
                        className="input"
                        value={member.periodo}
                        maxLength={60}
                        placeholder="Ej. ene. 2027 - dic. 2027"
                        aria-label={`Periodo de nombramiento, persona TEC ${memberIndex + 1}`}
                        onChange={(event) =>
                          patchTeamTec(member.id, {
                            periodo: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">
                        Titular de horas CONS (si aplica)
                      </span>
                      <input
                        aria-label={`Titular de horas CONS, persona TEC ${memberIndex + 1}`}
                        className="input"
                        value={member.titularCons ?? ""}
                        onChange={(event) =>
                          patchTeamTec(member.id, {
                            titularCons: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="stack-md" aria-labelledby="team-external-heading">
          <div className="page-heading">
            <div>
              <h3 id="team-external-heading">
                Cuadro 3. Colaboradores externos
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                patch({
                  teamExternal: [
                    ...form.teamExternal,
                    {
                      id: `externo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      nombre: "",
                      iniciales: "",
                      orcid: "",
                      institucion: "",
                    },
                  ],
                })
              }
            >
              Agregar colaborador/a externo/a
            </button>
          </div>
          {form.teamExternal.length === 0 ? (
            <p className="team-empty-state">
              Aún no agregaste colaboradores externos.
            </p>
          ) : (
            <div className="team-member-list">
              {form.teamExternal.map((member, memberIndex) => (
                <article className="team-member-card" key={member.id}>
                  <div className="team-member-card-header">
                    <h4>Colaborador/a externo/a {memberIndex + 1}</h4>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-label={`Quitar colaborador externo ${memberIndex + 1}${member.nombre ? `: ${member.nombre}` : ""}`}
                      onClick={() =>
                        patch({
                          teamExternal: form.teamExternal.filter(
                            (item) => item.id !== member.id,
                          ),
                        })
                      }
                    >
                      Quitar colaborador/a
                    </button>
                  </div>
                  <div className="team-member-fields team-external-fields">
                    <label className="team-member-field">
                      <span className="field-label">
                        Nombre completo del colaborador externo
                      </span>
                      <input
                        className="input"
                        value={member.nombre}
                        maxLength={150}
                        aria-label={`Nombre completo, colaborador externo ${memberIndex + 1}`}
                        onChange={(event) =>
                          patch({
                            teamExternal: form.teamExternal.map((item) =>
                              item.id === member.id
                                ? { ...item, nombre: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">Iniciales</span>
                      <input
                        className="input"
                        value={member.iniciales}
                        maxLength={10}
                        aria-label={`Iniciales, colaborador externo ${memberIndex + 1}`}
                        onChange={(event) =>
                          patch({
                            teamExternal: form.teamExternal.map((item) =>
                              item.id === member.id
                                ? {
                                    ...item,
                                    iniciales: event.target.value.toUpperCase(),
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">ID ORCID *</span>
                      <input
                        className="input"
                        value={member.orcid}
                        maxLength={19}
                        placeholder="0000-0000-0000-0000"
                        aria-required="true"
                        aria-label={`ID ORCID, colaborador externo ${memberIndex + 1}`}
                        onChange={(event) =>
                          patch({
                            teamExternal: form.teamExternal.map((item) =>
                              item.id === member.id
                                ? {
                                    ...item,
                                    orcid: formatOrcidInput(event.currentTarget),
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="team-member-field">
                      <span className="field-label">
                        Institución o empresa que representa
                      </span>
                      <input
                        className="input"
                        value={member.institucion}
                        maxLength={200}
                        aria-label={`Institución o empresa, colaborador externo ${memberIndex + 1}`}
                        onChange={(event) =>
                          patch({
                            teamExternal: form.teamExternal.map((item) =>
                              item.id === member.id
                                ? {
                                    ...item,
                                    institucion: event.target.value,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="field-hint">
          * El ID ORCID es indispensable para asegurar la visibilidad y
          trazabilidad de la colaboración en el portal público de Orión.
        </p>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="stack-lg">
        <label className="field">
          <span className="field-label">Planteamiento del problema</span>
          <textarea
            aria-label="Planteamiento del problema"
            className="input textarea"
            rows={5}
            value={form.problema}
            onChange={(e) => patch({ problema: e.target.value })}
          />
        </label>

        <label className="field">
          <span className="field-label">Objetivo general</span>
          <textarea
            aria-label="Objetivo general"
            className="input textarea"
            rows={3}
            value={form.objetivoGeneral}
            onChange={(e) => patch({ objetivoGeneral: e.target.value })}
          />
        </label>
        <section
          className="stack-md"
          aria-labelledby="specific-objectives-heading"
        >
          <div>
            <h3 id="specific-objectives-heading">Objetivos específicos</h3>
            <p className="field-hint">
              Completá los tres objetivos específicos requeridos en el
              Formulario 4.
            </p>
          </div>
          {form.objetivosEspecificos.slice(0, 3).map((objective, index) => (
            <label
              className="field"
              key={objective.id}
              htmlFor={`specific-objective-${objective.id}`}
            >
              <span className="field-label">
                Objetivo específico {index + 1}
              </span>
              <textarea
                id={`specific-objective-${objective.id}`}
                aria-label={`Objetivo específico ${index + 1}`}
                className="input textarea"
                rows={2}
                value={objective.descripcion}
                onChange={(event) =>
                  patch({
                    objetivosEspecificos: form.objetivosEspecificos.map(
                      (item) =>
                        item.id === objective.id
                          ? { ...item, descripcion: event.target.value }
                          : item,
                    ),
                  })
                }
              />
            </label>
          ))}
        </section>
      </div>
    );
  }

  if (step === 4) {
    const wordCount = form.estadoArte
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return (
      <div className="stack-lg">
        <p className="body-copy">
          Analizá teorías actualizadas, investigaciones, antecedentes y
          metodologías previas nacionales e internacionales. Explicá el aporte
          original de la investigación y los vacíos de conocimiento que busca
          atender. Incluí al menos 10 referencias bibliográficas de fuentes
          primarias publicadas en los últimos cinco años; los artículos deben
          provenir de revistas indexadas en Scopus o Web of Science.
        </p>
        <label className="field">
          <span className="field-label">Estado del arte (máximo 2 páginas)</span>
          <textarea
            className="input textarea"
            rows={12}
            aria-label="Estado del arte" value={form.estadoArte}
            aria-describedby="estado-arte-guidance estado-arte-count"
            onChange={(event) => patch({ estadoArte: event.target.value })}
          />
        </label>
        <p id="estado-arte-guidance" className="field-hint">
          Para orientar la extensión en este campo de texto, el límite es de{" "}
          {ESTADO_ARTE_MAX_WORDS} palabras (aproximación a dos páginas; la
          cantidad real por página depende del formato).
        </p>
        <p
          id="estado-arte-count"
          className={
            wordCount > ESTADO_ARTE_MAX_WORDS
              ? "field-error-text"
              : "field-hint"
          }
          aria-live="polite"
        >
          {wordCount} / {ESTADO_ARTE_MAX_WORDS} palabras
          {wordCount > ESTADO_ARTE_MAX_WORDS &&
            " — extensión orientativa superada; revise el formato de dos páginas"}
        </p>
      </div>
    );
  }

  if (step === 5) {
    return (
      <label className="field">
        <span className="field-label">Metodología</span>
        <textarea
          aria-label="Metodología"
          className="input textarea"
          rows={8}
          value={form.metodologia}
          onChange={(e) => patch({ metodologia: e.target.value })}
        />
      </label>
    );
  }

  if (step === 6) {
    const teamMembers = [
      ...form.teamTec.map((member) => ({
        id: member.id,
        nombre: member.nombre,
        iniciales: member.iniciales,
      })),
      ...form.teamExternal.map((member) => ({
        id: member.id,
        nombre: member.nombre,
        iniciales: member.iniciales,
      })),
    ];

    return (
      <div className="stack-xl">
        <p className="body-copy">
          Registrá las actividades y riesgos del proyecto. Incluí giras,
          informes de avance y pasantías cuando corresponda. El periodo admite
          hasta 36 meses; cada actividad debe tener al menos una persona
          responsable y un riesgo con su medida de mitigación.
        </p>
        <div className="page-heading">
          <div>
            <h3>Plan de acción y gestión de riesgos</h3>
            <p className="field-hint">
              Los participantes se seleccionan del equipo de investigación
              definido en la etapa 3.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              patch({
                planAccion: [
                  ...form.planAccion,
                  {
                    id: `actividad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    objetivoNumero: "",
                    actividad: "",
                    resultadoEsperado: "",
                    participantes: [],
                    riesgos: [
                      {
                        id: `riesgo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        riesgo: "",
                        mitigacion: "",
                        responsable: "",
                      },
                    ],
                    mesInicio: "",
                    duracionMeses: "",
                  },
                ],
              })
            }
          >
            Agregar actividad
          </button>
        </div>

        {form.planAccion.length === 0 ? (
          <p className="field-hint">
            Aún no agregaste actividades al plan.
          </p>
        ) : (
          form.planAccion.map((activity, activityIndex) => (
            <section
              className="form-section-block action-plan-activity"
              key={activity.id}
              aria-labelledby={`activity-heading-${activity.id}`}
            >
              <div className="page-heading">
                <h3 id={`activity-heading-${activity.id}`}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-expanded={!collapsedActivities[activity.id]}
                    onClick={() =>
                      setCollapsedActivities((prev) => ({
                        ...prev,
                        [activity.id]: !prev[activity.id],
                      }))
                    }
                  >
                    {collapsedActivities[activity.id] ? "▸" : "▾"} Actividad{" "}
                    {activityIndex + 1}
                    {activity.actividad.trim()
                      ? `: ${activity.actividad.trim().slice(0, 48)}`
                      : ""}
                  </button>
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Quitar actividad ${activityIndex + 1}`}
                  onClick={() =>
                    patch({
                      planAccion: form.planAccion.filter(
                        (item) => item.id !== activity.id,
                      ),
                    })
                  }
                >
                  Quitar actividad
                </button>
              </div>
              {!collapsedActivities[activity.id] && (
              <>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Objetivo asociado</span>
                  <select
                    aria-label={`Objetivo asociado, actividad ${activityIndex + 1}`}
                    className="input"
                    value={activity.objetivoNumero}
                    onChange={(event) => {
                      const number = event.target.value;
                      patchPlanActivity(activity.id, {
                        objetivoNumero:
                          number === "1" || number === "2" || number === "3"
                            ? number
                            : "",
                      });
                    }}
                  >
                    <option value="">Seleccioná un objetivo</option>
                    {form.objetivosEspecificos.slice(0, 3).map((objective, index) => (
                      <option key={objective.id} value={index + 1}>
                        OE{index + 1}
                        {objective.descripcion.trim()
                          ? ` — ${objective.descripcion.trim()}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Mes de inicio</span>
                  <input
                    aria-label={`Mes de inicio, actividad ${activityIndex + 1}`}
                    className="input"
                    type="number"
                    min="1"
                    max="36"
                    step="1"
                    value={activity.mesInicio}
                    onChange={(event) =>
                      patchPlanActivity(activity.id, {
                        mesInicio: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">Duración (meses)</span>
                  <input
                    aria-label={`Duración en meses, actividad ${activityIndex + 1}`}
                    className="input"
                    type="number"
                    min="0.01"
                    max="36"
                    step="0.01"
                    value={activity.duracionMeses}
                    onChange={(event) =>
                      patchPlanActivity(activity.id, {
                        duracionMeses: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Actividad</span>
                  <textarea
                    aria-label={`Descripción de la actividad ${activityIndex + 1}`}
                    className="input textarea"
                    rows={3}
                    value={activity.actividad}
                    onChange={(event) =>
                      patchPlanActivity(activity.id, {
                        actividad: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">Resultado esperado</span>
                  <textarea
                    aria-label={`Resultado esperado, actividad ${activityIndex + 1}`}
                    className="input textarea"
                    rows={3}
                    value={activity.resultadoEsperado}
                    onChange={(event) =>
                      patchPlanActivity(activity.id, {
                        resultadoEsperado: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <section className="stack-md" aria-label="Participantes de la actividad">
                <div className="page-heading">
                  <h4>Participantes y responsabilidades</h4>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={teamMembers.length === 0}
                    aria-label={`Agregar participante, actividad ${activityIndex + 1}`}
                    onClick={() =>
                      patchPlanActivity(activity.id, {
                        participantes: [
                          ...activity.participantes,
                          {
                            id: `asignacion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            teamMemberId: "",
                            responsabilidad: "",
                          },
                        ],
                      })
                    }
                  >
                    Agregar participante
                  </button>
                </div>
                {activity.participantes.map((assignment, assignmentIndex) => (
                  <div className="team-hours-row" key={assignment.id}>
                    <label className="field">
                      <span className="field-label">
                        Persona participante {assignmentIndex + 1}
                      </span>
                      <select
                        className="input"
                        value={assignment.teamMemberId}
                        onChange={(event) =>
                          patchPlanParticipant(activity.id, assignment.id, {
                            teamMemberId: event.target.value,
                          })
                        }
                      >
                        <option value="">Seleccioná una persona</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.nombre || "Sin nombre"}
                            {member.iniciales
                              ? ` (${member.iniciales})`
                              : " — agregá sus iniciales en etapa 3"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">Responsabilidad</span>
                      <select
                        aria-label={`Responsabilidad, participante ${assignmentIndex + 1} de la actividad ${activityIndex + 1}`}
                        className="input"
                        value={assignment.responsabilidad}
                        onChange={(event) => {
                          const responsibility =
                            PLAN_RESPONSIBILITIES.find(
                              (value) => value === event.target.value,
                            ) ?? "";
                          patchPlanParticipant(activity.id, assignment.id, {
                            responsabilidad: responsibility,
                          });
                        }}
                      >
                        <option value="">Seleccioná responsabilidad</option>
                        {PLAN_RESPONSIBILITIES.map((responsibility) => (
                          <option key={responsibility} value={responsibility}>
                            {responsibility}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-label={`Quitar participante ${assignmentIndex + 1} de actividad ${activityIndex + 1}`}
                      onClick={() =>
                        patchPlanActivity(activity.id, {
                          participantes: activity.participantes.filter(
                            (item) => item.id !== assignment.id,
                          ),
                        })
                      }
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <p className="field-hint">
                    Agregá personas al equipo en la etapa 3 para asignarlas a
                    las actividades.
                  </p>
                )}
              </section>

              <section className="stack-md" aria-label="Gestión de riesgos">
                <div className="page-heading">
                  <h4>Riesgos y medidas de mitigación</h4>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    aria-label={`Agregar riesgo, actividad ${activityIndex + 1}`}
                    onClick={() =>
                      patchPlanActivity(activity.id, {
                        riesgos: [
                          ...activity.riesgos,
                          {
                            id: `riesgo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            riesgo: "",
                            mitigacion: "",
                            responsable: "",
                          },
                        ],
                      })
                    }
                  >
                    Agregar riesgo
                  </button>
                </div>
                {activity.riesgos.map((risk, riskIndex) => (
                  <div className="form-section-block action-plan-risk" key={risk.id}>
                    <div className="page-heading">
                      <h5>Riesgo {riskIndex + 1}</h5>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={activity.riesgos.length === 1}
                        aria-label={`Quitar riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                        onClick={() =>
                          patchPlanActivity(activity.id, {
                            riesgos: activity.riesgos.filter(
                              (item) => item.id !== risk.id,
                            ),
                          })
                        }
                      >
                        Quitar riesgo
                      </button>
                    </div>
                    <div className="form-grid">
                      <label className="field">
                        <span className="field-label">Riesgo identificado</span>
                        <textarea
                          aria-label={`Riesgo identificado, riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                          className="input textarea"
                          rows={2}
                          value={risk.riesgo}
                          onChange={(event) =>
                            patchPlanRisk(activity.id, risk.id, {
                              riesgo: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">
                          Medidas de mitigación
                        </span>
                        <textarea
                          aria-label={`Medidas de mitigación, riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                          className="input textarea"
                          rows={2}
                          value={risk.mitigacion}
                          onChange={(event) =>
                            patchPlanRisk(activity.id, risk.id, {
                              mitigacion: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span className="field-label">
                        Responsable de la gestión del riesgo
                      </span>
                      <input
                        aria-label={`Responsable de la gestión del riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                        className="input"
                        value={risk.responsable}
                        maxLength={150}
                        onChange={(event) =>
                          patchPlanRisk(activity.id, risk.id, {
                            responsable: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                ))}
              </section>
              </>
              )}
            </section>
          ))
        )}
      </div>
    );
  }

  if (step === 7) {
    const annualTotals = BUDGET_YEARS.map((_, index) =>
      form.financiamiento.reduce(
        (total, source) =>
          total + Number([source.anio1, source.anio2, source.anio3][index] || 0),
        0,
      ),
    );
    const budgetTotals = form.presupuestoAnual.reduce(
      (totals, row, index) => ({
        operativo: totals.operativo + Number(row.operativo || 0),
        duraderos:
          totals.duraderos +
          (index === 0 ? Number(row.duraderos || 0) : 0),
      }),
      { operativo: 0, duraderos: 0 },
    );
    return (
      <div className="stack-xl">
        <section className="stack-md" aria-labelledby="annual-budget-heading">
          <div>
            <h3 id="annual-budget-heading">Presupuesto solicitado por año</h3>
            <p className="field-hint">
              El desglose de cada partida se adjunta en el archivo Excel de
              presupuesto. Los bienes duraderos se formulan únicamente para el
              primer año.
            </p>
          </div>
          <div className="table-wrap">
            <table className="data-table" aria-label="Presupuesto solicitado por año">
              <thead>
                <tr>
                  <th scope="col">Año</th>
                  <th scope="col">Presupuesto operativo</th>
                  <th scope="col">Bienes duraderos</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {form.presupuestoAnual.map((row, index) => (
                  <tr key={row.anio}>
                    <th scope="row">{row.anio}</th>
                    <td>
                      <label className="sr-only" htmlFor={`budget-operativo-${row.anio}`}>
                        Presupuesto operativo {row.anio}
                      </label>
                      <input
                        id={`budget-operativo-${row.anio}`}
                        className="input"
                        type="number"
                        min="0"
                        max="999999999999.99"
                        step="0.01"
                        value={row.operativo}
                        onChange={(event) =>
                          patch({
                            presupuestoAnual: form.presupuestoAnual.map(
                              (budget) =>
                                budget.anio === row.anio
                                  ? { ...budget, operativo: event.target.value }
                                  : budget,
                            ),
                          })
                        }
                      />
                    </td>
                    <td>
                      <label className="sr-only" htmlFor={`budget-durable-${row.anio}`}>
                        Presupuesto de bienes duraderos {row.anio}
                      </label>
                      <input
                        id={`budget-durable-${row.anio}`}
                        className="input"
                        type="number"
                        min="0"
                        max="999999999999.99"
                        step="0.01"
                        value={index === 0 ? row.duraderos : "0"}
                        disabled={index > 0}
                        onChange={(event) =>
                          patch({
                            presupuestoAnual: form.presupuestoAnual.map(
                              (budget) =>
                                budget.anio === row.anio
                                  ? { ...budget, duraderos: event.target.value }
                                  : budget,
                            ),
                          })
                        }
                      />
                    </td>
                    <td>
                      {formatCRC(
                        Number(row.operativo || 0) +
                          (index === 0 ? Number(row.duraderos || 0) : 0),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td>{formatCRC(budgetTotals.operativo)}</td>
                  <td>{formatCRC(budgetTotals.duraderos)}</td>
                  <td>
                    {formatCRC(
                      budgetTotals.operativo + budgetTotals.duraderos,
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="stack-md" aria-labelledby="financing-heading">
          <div>
            <h3 id="financing-heading">
              Financiamiento externo, contrapartida y cofinanciamiento
            </h3>
            <p className="field-hint">
              Completá la fuente, los montos por año y el oficio de respaldo
              junto con la entidad emisora. El detalle del destino por partida
              se consigna en el Excel adjunto.
            </p>
          </div>
          <div className="table-wrap">
            <table className="data-table" aria-label="Financiamiento externo, contrapartida y cofinanciamiento">
              <thead>
                <tr>
                  <th scope="col">Desglose</th>
                  {BUDGET_YEARS.map((year) => (
                    <th scope="col" key={year}>
                      Año {year}
                    </th>
                  ))}
                  <th scope="col">Número de oficio / entidad emisora</th>
                </tr>
              </thead>
              <tbody>
                {form.financiamiento.map((source, sourceIndex) => (
                  <tr key={source.tipo}>
                    <th scope="row">
                      {FINANCING_TYPES[sourceIndex].label}
                    </th>
                    {(["anio1", "anio2", "anio3"] as const).map(
                      (yearKey, index) => (
                        <td key={yearKey}>
                          <label
                            className="sr-only"
                            htmlFor={`financing-${source.tipo}-${yearKey}`}
                          >
                            {FINANCING_TYPES[sourceIndex].label}, año{" "}
                            {BUDGET_YEARS[index]}
                          </label>
                          <input
                            id={`financing-${source.tipo}-${yearKey}`}
                            className="input"
                            type="number"
                            min="0"
                            max="999999999999.99"
                            step="0.01"
                            value={source[yearKey]}
                            onChange={(event) =>
                              patch({
                                financiamiento: form.financiamiento.map(
                                  (item) =>
                                    item.tipo === source.tipo
                                      ? {
                                          ...item,
                                          [yearKey]: event.target.value,
                                        }
                                      : item,
                                ),
                              })
                            }
                          />
                        </td>
                      ),
                    )}
                    <td>
                      <label
                        className="sr-only"
                        htmlFor={`financing-oficio-${source.tipo}`}
                      >
                        Oficio y entidad emisora:{" "}
                        {FINANCING_TYPES[sourceIndex].label}
                      </label>
                      <input
                        id={`financing-oficio-${source.tipo}`}
                        className="input"
                        maxLength={60}
                        value={source.oficio}
                        onChange={(event) =>
                          patch({
                            financiamiento: form.financiamiento.map((item) =>
                              item.tipo === source.tipo
                                ? { ...item, oficio: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  {annualTotals.map((total, index) => (
                    <td key={BUDGET_YEARS[index]}>{formatCRC(total)}</td>
                  ))}
                  <td>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    );
  }

  if (step === 8) {
    const technologyProject = form.modalidad === "Desarrollo tecnológico";
    const academicOptions = technologyProject
      ? TECHNOLOGY_ACADEMIC_PRODUCTS
      : BASIC_ACADEMIC_PRODUCTS;
    const weeklyHours = form.teamTec.reduce(
      (total, member) =>
        total +
        member.horas.reduce(
          (memberTotal, hour) =>
            memberTotal + (Number(hour.cantidad) || 0),
          0,
        ),
      0,
    );
    const minimumAcademicProducts = Math.ceil(weeklyHours / 10);
    const selectedAcademicProducts = form.productosAcademicos.reduce(
      (total, product) =>
        total +
        (product.codigoOpcion ? Number(product.cantidad) || 0 : 0),
      0,
    );
    const selectedAssets = form.activosPI.reduce(
      (total, asset) =>
        total + (asset.codigoOpcion ? Number(asset.cantidad) || 0 : 0),
      0,
    );
    const minimumProductCombinations =
      weeklyHours > 0
        ? minimumAcademicProducts + (technologyProject ? 1 : 0)
        : 0;
    const commitmentRanges = [
      { min: 1, max: 10, basic: 1, technology: 2 },
      { min: 11, max: 20, basic: 2, technology: 3 },
      { min: 21, max: 30, basic: 3, technology: 4 },
    ];
    const selectedRange = commitmentRanges.find(
      (range) => weeklyHours >= range.min && weeklyHours <= range.max,
    );

    return (
      <div className="stack-xl">
        <section className="stack-md" aria-labelledby="product-commitment-heading">
          <div>
            <h3 id="product-commitment-heading">
              {technologyProject
                ? "12.2 Compromiso para proyectos de desarrollo tecnológico"
                : "12.1 Compromiso para proyectos de investigación"}
            </h3>
            <p className="body-copy">
              Las horas semanales se calculan con las horas asignadas al equipo
              TEC en la etapa 3 (VIE, VIE-Centros, REC, CONS, DOC y VIESA).
              {technologyProject
                ? " El mínimo incluye los productos académicos y al menos un activo de propiedad industrial."
                : " El mínimo corresponde a opciones de productos académicos."}
            </p>
            <p className="field-hint">
              Total semanal: <strong>{weeklyHours}</strong> horas · mínimo de
              productos académicos:{" "}
              <strong>{minimumAcademicProducts || "—"}</strong>
              {technologyProject
                ? " · Para desarrollo tecnológico también se requiere al menos un activo de propiedad industrial."
                : ""}
            </p>
            {weeklyHours > 30 && (
              <p className="field-error" role="alert">
                El Formulario 4 solo define rangos hasta 30 horas semanales.
                Revisá las horas del equipo en la etapa 3.
              </p>
            )}
            {weeklyHours === 0 && (
              <p className="field-error" role="alert">
                Agregá las horas semanales del equipo TEC en la etapa 3 para
                determinar el mínimo de productos.
              </p>
            )}
            <div className="table-wrap">
              <table className="data-table" aria-label="Productos mínimos requeridos según horas semanales">
                <thead>
                  <tr>
                    <th scope="col">Horas semanales</th>
                    <th scope="col">
                      {technologyProject
                        ? "Combinaciones mínimas"
                        : "Productos mínimos requeridos"}
                    </th>
                    <th scope="col">Selección aplicable</th>
                  </tr>
                </thead>
                <tbody>
                  {commitmentRanges.map((range) => {
                    const selected = range === selectedRange;
                    return (
                      <tr key={range.min}>
                        <th scope="row">
                          {range.min} a {range.max} horas
                        </th>
                        <td>
                          {technologyProject
                            ? `${range.technology} opciones (incluye al menos 1 activo de propiedad industrial)`
                            : `${range.basic} ${range.basic === 1 ? "opción" : "opciones"}`}
                        </td>
                        <td>{selected ? "X" : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="page-heading">
            <h4>Productos académicos comprometidos</h4>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                patch({
                  productosAcademicos: [
                    ...form.productosAcademicos,
                    {
                      id: `producto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      codigoOpcion: "",
                      cantidad: "1",
                      objetivoNumero: "",
                    },
                  ],
                })
              }
            >
              Agregar producto académico
            </button>
          </div>
          <p className="field-hint">
            Seleccioná una o varias opciones. Cada fila cuenta como una opción;
            podés repetirla con la cantidad o combinar opciones para alcanzar el
            mínimo requerido. Cada producto académico debe vincularse con uno
            de los tres objetivos específicos.
          </p>
          {form.productosAcademicos.length === 0 ? (
            <p className="empty-state">Todavía no agregaste productos académicos.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table" aria-label="Productos académicos comprometidos">
                <thead>
                  <tr>
                    <th scope="col">Selección</th>
                    <th scope="col">Cantidad de opciones</th>
                    <th scope="col">Opción de producto</th>
                    <th scope="col">Objetivo específico asociado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {form.productosAcademicos.map((product, index) => (
                    <tr key={product.id}>
                      <td>{index + 1}</td>
                      <td>
                        <label
                          className="sr-only"
                          htmlFor={`academic-quantity-${product.id}`}
                        >
                          Cantidad de opciones académicas {index + 1}
                        </label>
                        <input
                          id={`academic-quantity-${product.id}`}
                          className="input"
                          type="number"
                          min="1"
                          max="99"
                          step="1"
                          value={product.cantidad}
                          onChange={(event) =>
                            patchAcademicProduct(product.id, {
                              cantidad: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <label
                          className="sr-only"
                          htmlFor={`academic-option-${product.id}`}
                        >
                          Opción de producto académico {index + 1}
                        </label>
                        <select
                          id={`academic-option-${product.id}`}
                          className="input"
                          value={product.codigoOpcion}
                          onChange={(event) =>
                            patchAcademicProduct(product.id, {
                              codigoOpcion:
                                academicOptions.find(
                                  (option) => option.value === event.target.value,
                                )?.value ?? "",
                            })
                          }
                        >
                          <option value="">Seleccioná una opción</option>
                          {academicOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <label
                          className="sr-only"
                          htmlFor={`academic-objective-${product.id}`}
                        >
                          Objetivo específico del producto {index + 1}
                        </label>
                        <select
                          id={`academic-objective-${product.id}`}
                          className="input"
                          value={product.objetivoNumero}
                          onChange={(event) =>
                            patchAcademicProduct(product.id, {
                              objetivoNumero:
                                event.target.value === "1" ||
                                event.target.value === "2" ||
                                event.target.value === "3"
                                  ? event.target.value
                                  : "",
                            })
                          }
                        >
                          <option value="">Seleccioná un objetivo</option>
                          {form.objetivosEspecificos
                            .slice(0, 3)
                            .map((objective, objectiveIndex) => (
                              <option
                                key={objective.id}
                                value={objectiveIndex + 1}
                              >
                                OE{objectiveIndex + 1}
                                {objective.descripcion.trim()
                                  ? ` — ${objective.descripcion.trim()}`
                                  : ""}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          aria-label={`Quitar producto académico ${index + 1}`}
                          onClick={() =>
                            patch({
                              productosAcademicos:
                                form.productosAcademicos.filter(
                                  (item) => item.id !== product.id,
                                ),
                            })
                          }
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="field-hint">
            Opciones seleccionadas: {selectedAcademicProducts} de{" "}
            {minimumAcademicProducts || "—"} requeridas.
            {technologyProject
              ? ` Compromisos mínimos totales (incluido activo industrial): ${minimumProductCombinations || "—"}; seleccionados: ${selectedAcademicProducts + selectedAssets}.`
              : ""}
          </p>
        </section>

        {technologyProject && (
          <section className="stack-md" aria-labelledby="ip-assets-heading">
            <div>
              <h3 id="ip-assets-heading">
                Activos de propiedad industrial (obligatorio)
              </h3>
              <p className="field-hint">
                Seleccioná al menos un activo y registrá el consecutivo del
                dictamen técnico del Centro de Vinculación.
              </p>
            </div>
            <div className="page-heading">
              <h4>Activos comprometidos</h4>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  patch({
                    activosPI: [
                      ...form.activosPI,
                      {
                        id: `activo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        codigoOpcion: "",
                        cantidad: "1",
                        dictamen: "",
                      },
                    ],
                  })
                }
              >
                Agregar activo
              </button>
            </div>
            {form.activosPI.length === 0 ? (
              <p className="empty-state">No has agregado activos de propiedad industrial.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table" aria-label="Activos de propiedad industrial comprometidos">
                  <thead>
                    <tr>
                      <th scope="col">Selección</th>
                      <th scope="col">Cantidad</th>
                      <th scope="col">Tipo de activo</th>
                      <th scope="col">Consecutivo del dictamen</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.activosPI.map((asset, index) => (
                      <tr key={asset.id}>
                        <td>{index + 1}</td>
                        <td>
                          <label
                            className="sr-only"
                            htmlFor={`asset-quantity-${asset.id}`}
                          >
                            Cantidad del activo {index + 1}
                          </label>
                          <input
                            id={`asset-quantity-${asset.id}`}
                            className="input"
                            type="number"
                            min="1"
                            max="99"
                            step="1"
                            value={asset.cantidad}
                            onChange={(event) =>
                              patchTechnologyAsset(asset.id, {
                                cantidad: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <label
                            className="sr-only"
                            htmlFor={`asset-option-${asset.id}`}
                          >
                            Tipo de activo {index + 1}
                          </label>
                          <select
                            id={`asset-option-${asset.id}`}
                            className="input"
                            value={asset.codigoOpcion}
                            onChange={(event) =>
                              patchTechnologyAsset(asset.id, {
                                codigoOpcion:
                                  TECHNOLOGY_IP_ASSETS.find(
                                    (option) =>
                                      option.value === event.target.value,
                                  )?.value ?? "",
                              })
                            }
                          >
                            <option value="">Seleccioná un activo</option>
                            {TECHNOLOGY_IP_ASSETS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <label
                            className="sr-only"
                            htmlFor={`asset-dictamen-${asset.id}`}
                          >
                            Consecutivo del dictamen técnico {index + 1}
                          </label>
                          <input
                            id={`asset-dictamen-${asset.id}`}
                            className="input"
                            maxLength={40}
                            value={asset.dictamen}
                            onChange={(event) =>
                              patchTechnologyAsset(asset.id, {
                                dictamen: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            aria-label={`Quitar activo ${index + 1}`}
                            onClick={() =>
                              patch({
                                activosPI: form.activosPI.filter(
                                  (item) => item.id !== asset.id,
                                ),
                              })
                            }
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {!technologyProject && (
          <section
            className="stack-md"
            aria-labelledby="additional-products-heading"
          >
            <div>
              <h3 id="additional-products-heading">
                Otros resultados y activos tecnológicos (complementarios)
              </h3>
              <p className="field-hint">
                Agregá hasta dos resultados adicionales, por ejemplo software,
                prototipos, bases de datos, guías técnicas o manuales. No
                sustituyen los productos académicos requeridos.
              </p>
            </div>
            {form.productosAdicionales.map((product, index) => (
              <div
                className="team-hours-row additional-product-row"
                key={product.id}
              >
                <label className="field">
                  <span className="field-label">
                    Producto adicional {index + 1}
                  </span>
                  <textarea
                    className="input textarea"
                    rows={2}
                    maxLength={500}
                    value={product.descripcion}
                    onChange={(event) =>
                      patchAdditionalProduct(product.id, {
                        descripcion: event.target.value,
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Quitar producto adicional ${index + 1}`}
                  onClick={() =>
                    patch({
                      productosAdicionales: form.productosAdicionales.filter(
                        (item) => item.id !== product.id,
                      ),
                    })
                  }
                >
                  Quitar
                </button>
              </div>
            ))}
            {form.productosAdicionales.length < 2 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  patch({
                    productosAdicionales: [
                      ...form.productosAdicionales,
                      {
                        id: `adicional-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        descripcion: "",
                      },
                    ],
                  })
                }
              >
                Agregar producto adicional
              </button>
            )}
          </section>
        )}
      </div>
    );
  }

  if (step === 9) {
    return (
      <div className="stack-md product-safeguard">
        <p className="body-copy">
          Seleccioná una respuesta para cada compromiso indicado en el
          Formulario 4.
        </p>
        <div className="field" role="group">
          <span className="field-label">
            Declaro conocer la obligatoriedad de depositar todos los productos,
            artículos y resultados derivados del proyecto en el Repositorio
            Institucional, conforme al artículo 44 del Reglamento de
            Investigación y Extensión. El depósito se realizará salvo que
            exista una prohibición explícita por protección de propiedad
            intelectual o procesos de arbitraje de publicaciones
            internacionales.
          </span>
          <div className="radio-group">
            {(["No", "Sí"] as const).map((answer) => (
              <label
                className={`radio-choice${form.resguardoProductos.depositoRepositorio === answer ? " selected" : ""}`}
                key={answer}
              >
                <input
                  type="radio"
                  name="safeguard-repository"
                  value={answer}
                  checked={
                    form.resguardoProductos.depositoRepositorio === answer
                  }
                  onChange={() =>
                    patch({
                      resguardoProductos: {
                        ...form.resguardoProductos,
                        depositoRepositorio: answer,
                      },
                    })
                  }
                />
                <span className="radio-dot" />
                {answer === "Sí" ? "Sí, acepto el compromiso" : answer}
              </label>
            ))}
          </div>
        </div>
        <div className="field" role="group">
          <span className="field-label">
            ¿La ejecución del proyecto desarrollará software (incluido código
            fuente y manuales) o bases de datos?
          </span>
          <div className="radio-group">
            {(["No", "Sí"] as const).map((answer) => (
              <label
                className={`radio-choice${form.resguardoProductos.desarrollaSoftwareBaseDatos === answer ? " selected" : ""}`}
                key={answer}
              >
                <input
                  type="radio"
                  name="safeguard-software-applicability"
                  value={answer}
                  checked={
                    form.resguardoProductos.desarrollaSoftwareBaseDatos ===
                    answer
                  }
                  onChange={() =>
                    patch({
                      resguardoProductos: {
                        ...form.resguardoProductos,
                        desarrollaSoftwareBaseDatos: answer,
                        entregaRespaldoSoftware:
                          answer === "No"
                            ? ""
                            : form.resguardoProductos.entregaRespaldoSoftware,
                      },
                    })
                  }
                />
                <span className="radio-dot" />
                {answer}
              </label>
            ))}
          </div>
        </div>
        {form.resguardoProductos.desarrollaSoftwareBaseDatos === "Sí" && (
          <div className="field" role="group">
            <span className="field-label">
              En caso de desarrollar software o bases de datos, asumo el
              compromiso de entregar el respaldo técnico completo a la
              Dirección de Investigación para su debido resguardo.
            </span>
            <div className="radio-group">
              {(["No", "Sí"] as const).map((answer) => (
                <label
                  className={`radio-choice${form.resguardoProductos.entregaRespaldoSoftware === answer ? " selected" : ""}`}
                  key={answer}
                >
                  <input
                    type="radio"
                    name="safeguard-software-commitment"
                    value={answer}
                    checked={
                      form.resguardoProductos.entregaRespaldoSoftware ===
                      answer
                    }
                    onChange={() =>
                      patch({
                        resguardoProductos: {
                          ...form.resguardoProductos,
                          entregaRespaldoSoftware: answer,
                        },
                      })
                    }
                  />
                  <span className="radio-dot" />
                  {answer === "Sí" ? "Sí, acepto el compromiso" : answer}
                </label>
              ))}
            </div>
          </div>
        )}
        {form.resguardoProductos.depositoRepositorio === "No" && (
          <p className="field-error" role="alert">
            El depósito institucional es un compromiso obligatorio para enviar
            la propuesta.
          </p>
        )}
        {form.resguardoProductos.desarrollaSoftwareBaseDatos === "Sí" &&
          form.resguardoProductos.entregaRespaldoSoftware === "No" && (
            <p className="field-error" role="alert">
              Para proyectos que desarrollan software o bases de datos, el
              Formulario 4 requiere aceptar el compromiso de entregar el
              respaldo técnico.
            </p>
          )}
      </div>
    );
  }

  if (step === 10) {
    return (
      <div className="stack-md">
        <p className="body-copy">
          Estas actividades proyectan y transfieren los hallazgos a distintas
          audiencias y no sustituyen los productos académicos comprometidos.
        </p>
        <label className="field">
          <span className="field-label">
            Divulgación científica o técnica
          </span>
          <span className="field-hint">
            Eventos previstos y población meta: congresos, charlas técnicas,
            actividades con docentes o estudiantes, entre otros.
          </span>
          <textarea
            className="input textarea"
            rows={4}
            maxLength={5000}
            aria-label="Divulgación científica o técnica" value={form.divulgacion.divulgacionCientifica}
            onChange={(event) =>
              patch({
                divulgacion: {
                  ...form.divulgacion,
                  divulgacionCientifica: event.target.value,
                },
              })
            }
          />
        </label>
        <label className="field">
          <span className="field-label">Canales institucionales</span>
          <span className="field-hint">
            Detallá canales como Investiga.TEC, sitios web, redes TEC u Orión.
          </span>
          <textarea
            className="input textarea"
            rows={3}
            maxLength={5000}
            aria-label="Canales institucionales" value={form.divulgacion.canalesInstitucionales}
            onChange={(event) =>
              patch({
                divulgacion: {
                  ...form.divulgacion,
                  canalesInstitucionales: event.target.value,
                },
              })
            }
          />
        </label>
        <label className="field">
          <span className="field-label">Eventos de socialización</span>
          <span className="field-hint">
            Charlas a comunidades, talleres con personas beneficiarias o
            presentaciones a entes externos.
          </span>
          <textarea
            className="input textarea"
            rows={3}
            maxLength={5000}
            aria-label="Eventos de socialización" value={form.divulgacion.eventosSocializacion}
            onChange={(event) =>
              patch({
                divulgacion: {
                  ...form.divulgacion,
                  eventosSocializacion: event.target.value,
                },
              })
            }
          />
        </label>
        <label className="field">
          <span className="field-label">Medios masivos</span>
          <span className="field-hint">
            Medios que se pretende gestionar, por ejemplo radio, televisión o
            prensa nacional.
          </span>
          <textarea
            className="input textarea"
            rows={3}
            maxLength={5000}
            aria-label="Medios masivos" value={form.divulgacion.mediosMasivos}
            onChange={(event) =>
              patch({
                divulgacion: {
                  ...form.divulgacion,
                  mediosMasivos: event.target.value,
                },
              })
            }
          />
        </label>
      </div>
    );
  }

  if (step === 11) {
    const ethics = form.aspectosEticos;
    const ethicalQuestions = [
      {
        key: "seresHumanos" as const,
        label:
          "¿Involucra la participación directa o indirecta de seres humanos como sujetos de investigación?",
        requirement:
          "Requiere evaluación y aval de un Comité Ético Científico (CEC) inscrito ante CONIS, conforme a la Ley 9234.",
      },
      {
        key: "biodiversidad" as const,
        label:
          "¿Involucra el uso, colecta, acceso o estudio de biodiversidad, recursos genéticos o material biológico silvestre?",
        requirement:
          "Requiere gestionar permisos ante CONAGEBIO, conforme a la Ley 7788.",
      },
      {
        key: "animales" as const,
        label:
          "¿Involucra el uso, manipulación, cría o experimentación con animales vertebrados?",
        requirement:
          "Requiere aprobación del CICUA (UCR) o COBAB (UNA), según la Ley 7451.",
      },
      {
        key: "territoriosIndigenas" as const,
        label:
          "¿Involucra trabajo en o con territorios, comunidades o pueblos indígenas?",
        requirement:
          "Debe detallar consulta previa y consentimiento libre e informado, y contar con aval de la ADI correspondiente.",
      },
    ];
    const allEthicsAnswered = ethicalQuestions.every(
      ({ key }) => ethics[key] === "Sí" || ethics[key] === "No",
    );
    const needsEthicalReview = ethicalQuestions.some(
      ({ key }) => ethics[key] === "Sí",
    );
    return (
      <div className="stack-md ethical-review">
        <p className="body-copy">
          La declaración ética es requisito de admisibilidad. Indicá en todos
          los casos si se requiere autorización y completá la justificación o
          los datos del aval según corresponda.
        </p>
        {ethicalQuestions.map(({ key, label, requirement }, index) => (
          <div className="field" role="group" key={key}>
            <span className="field-label">
              {index + 1}. {label}
            </span>
            <div className="radio-group">
              {(["No", "Sí"] as const).map((answer) => (
                <label
                  className={`radio-choice${ethics[key] === answer ? " selected" : ""}`}
                  key={answer}
                >
                  <input
                    type="radio"
                    name={`ethics-${key}`}
                    value={answer}
                    checked={ethics[key] === answer}
                    onChange={() =>
                      patch({
                        aspectosEticos: { ...ethics, [key]: answer },
                      })
                    }
                  />
                  <span className="radio-dot" />
                  {answer}
                </label>
              ))}
            </div>
            {ethics[key] === "Sí" && (
              <span className="field-hint">{requirement}</span>
            )}
            {key === "territoriosIndigenas" && ethics[key] === "Sí" && (
              <label className="field">
                <span className="field-label">
                  Consulta previa y consentimiento libre e informado
                </span>
                <textarea
                  aria-label="Consulta previa y consentimiento libre e informado"
                  className="input textarea"
                  rows={3}
                  maxLength={5000}
                  value={ethics.consultaConsentimiento}
                  onChange={(event) =>
                    patch({
                      aspectosEticos: {
                        ...ethics,
                        consultaConsentimiento: event.target.value,
                      },
                    })
                  }
                />
              </label>
            )}
          </div>
        ))}
        {allEthicsAnswered && !needsEthicalReview && (
          <label className="field">
            <span className="field-label">
              Justificación de exención ética
            </span>
            <span className="field-hint">
              Explicá por qué la propuesta no requiere aval de un comité ético
              ni ente regulatorio.
            </span>
            <textarea
              aria-label="Justificación de exención ética"
              className="input textarea"
              rows={4}
              maxLength={5000}
              value={ethics.exencionJustificacion}
              onChange={(event) =>
                patch({
                  aspectosEticos: {
                    ...ethics,
                    exencionJustificacion: event.target.value,
                  },
                })
              }
            />
          </label>
        )}
        {allEthicsAnswered && needsEthicalReview && (
          <>
            <fieldset className="field">
              <legend className="field-label">
                Comité o ente regulatorio ante el cual se tramitará el aval
              </legend>
              {[
                ["cec", "Comité Ético Científico (CEC)"],
                ["conagebio", "CONAGEBIO"],
                ["cicua_cobab", "CICUA (UCR) o COBAB (UNA)"],
                ["adi", "Asociación de Desarrollo Integral (ADI)"],
                ["otro", "Otro comité o ente regulatorio"],
              ].map(([value, label]) => (
                <label
                  className={`radio-choice${ethics.entesRegulatorios.includes(value) ? " selected" : ""}`}
                  key={value}
                >
                  <input
                    type="checkbox"
                    checked={ethics.entesRegulatorios.includes(value)}
                    onChange={(event) =>
                      patch({
                        aspectosEticos: {
                          ...ethics,
                          entesRegulatorios: event.target.checked
                            ? [...ethics.entesRegulatorios, value]
                            : ethics.entesRegulatorios.filter(
                                (entity) => entity !== value,
                              ),
                        },
                      })
                    }
                  />
                  <span className="radio-dot" />
                  {label}
                </label>
              ))}
            </fieldset>
            {ethics.entesRegulatorios.includes("otro") && (
              <label className="field">
                <span className="field-label">Especifique el otro ente</span>
                <input
                  aria-label="Especifique el otro ente"
                  className="input"
                  maxLength={200}
                  value={ethics.otroEnte}
                  onChange={(event) =>
                    patch({
                      aspectosEticos: {
                        ...ethics,
                        otroEnte: event.target.value,
                      },
                    })
                  }
                />
              </label>
            )}
            <label className="field">
              <span className="field-label">
                Nombre o número del comité/ente y estado del trámite del aval
              </span>
              <textarea
                aria-label="Nombre o número del comité/ente y estado del trámite del aval"
                className="input textarea"
                rows={3}
                maxLength={5000}
                value={ethics.detalleAval}
                onChange={(event) =>
                  patch({
                    aspectosEticos: {
                      ...ethics,
                      detalleAval: event.target.value,
                    },
                  })
                }
              />
            </label>
          </>
        )}
        <p className="field-hint">
          La fase experimental no podrá iniciar sin el aval formal. Incluí la
          medida de mitigación correspondiente en el plan de riesgos.
        </p>
      </div>
    );
  }

  if (step === 12) {
    return (
      <div className="stack-md">
        <p className="body-copy">
          Describí cómo se inserta la propuesta en un proceso sistemático de
          generación de conocimiento o desarrollo tecnológico a largo plazo.
        </p>
        {[
          ["lineaInvestigacion", "Nombre de la línea de investigación"],
          ["objetivoEstrategico", "Objetivo estratégico de largo plazo"],
          ["duracionTotal", "Duración total estimada del proceso"],
          ["fases", "Fases o proyectos (pasados, presente y futuros)"],
          ["productosIntermedios", "Productos intermedios por fase"],
        ].map(([key, label]) => (
          <label className="field" key={key}>
            <span className="field-label">{label}</span>
            <textarea
              className="input textarea"
              rows={key === "objetivoEstrategico" ? 4 : 3}
              maxLength={5000}
              aria-label={label} value={form.hojaRuta[key as keyof typeof form.hojaRuta]}
              onChange={(event) =>
                patch({
                  hojaRuta: {
                    ...form.hojaRuta,
                    [key]: event.target.value,
                  },
                })
              }
            />
          </label>
        ))}
      </div>
    );
  }

  if (step === 13) {
    return (
      <label className="field">
        <span className="field-label">Referencias</span>
        <textarea
          aria-label="Referencias"
          className="input textarea"
          rows={10}
          value={form.referencias}
          onChange={(e) => patch({ referencias: e.target.value })}
        />
      </label>
    );
  }

  if (step === 14) {
    const declaration = form.declaracionJurada;
    return (
      <div className="stack-md">
        <section className="card stack-sm" aria-labelledby="decl-jurada-label">
          <h3 id="decl-jurada-label">
            Declaración jurada de veracidad y compromiso institucional
          </h3>
          <p>
            Por este medio, manifiesto y declaro bajo fe de juramento:
          </p>
          <ol>
            <li>
              Que la información y los datos consignados en esta propuesta son
              íntegros, veraces y correctos.
            </li>
            <li>
              Que los documentos adjuntos y las firmas que los respaldan son
              auténticos y se gestionaron conforme a los requerimientos
              técnicos y administrativos aprobados por el CIE.
            </li>
            <li>
              Que conozco que la titularidad y protección de la propiedad
              intelectual de los productos, activos y resultados se rigen por
              la normativa institucional vigente y las disposiciones del Centro
              de Vinculación.
            </li>
            <li>
              Que esta declaración se rinde conforme al artículo 96 del
              Estatuto Orgánico y a los artículos 13, 21 y 34 del Reglamento de
              Investigación y Extensión del TEC.
            </li>
          </ol>
          <p>
            Asumo la responsabilidad directa por la gestión, ejecución y
            rendición de cuentas de las actividades planificadas, así como por
            la veracidad de los informes de avance y finales.
          </p>
        </section>
        <label className="field">
          <span className="field-label">Nombre completo de la persona coordinadora</span>
          <input
            aria-label="Nombre completo de la persona coordinadora"
            className="input"
            maxLength={150}
            value={declaration.nombreCompleto}
            onChange={(event) =>
              patch({
                declaracionJurada: {
                  ...declaration,
                  nombreCompleto: event.target.value,
                },
              })
            }
          />
        </label>
        <label className="field">
          <span className="field-label">Número de cédula</span>
          <input
            aria-label="Número de cédula"
            className="input"
            maxLength={20}
            value={declaration.cedula}
            onChange={(event) =>
              patch({
                declaracionJurada: {
                  ...declaration,
                  cedula: event.target.value,
                },
              })
            }
          />
        </label>
        <label className="field">
          <span className="field-label">
            Firma de la persona investigadora coordinadora
          </span>
          <input
            aria-label="Firma de la persona investigadora coordinadora"
            className="input"
            maxLength={150}
            value={declaration.firma}
            onChange={(event) =>
              patch({
                declaracionJurada: {
                  ...declaration,
                  firma: event.target.value,
                },
              })
            }
          />
          <span className="field-hint">
            Escribí el nombre completo como manifestación de firma. Este
            registro de aceptación no sustituye una firma digital certificada
            cuando sea requerida.
          </span>
        </label>
        <label
          className={`radio-choice${declaration.acepta ? " selected" : ""}`}
        >
          <input
            type="checkbox"
            checked={declaration.acepta}
            onChange={(event) =>
              patch({
                declaracionJurada: {
                  ...declaration,
                  acepta: event.target.checked,
                },
              })
            }
          />
          <span className="radio-dot" />
          Declaro bajo fe de juramento que leí y acepto lo anterior.
        </label>
      </div>
    );
  }

  if (step === 15) return <div className="stack-md">{documentos??<p>Guarde el borrador para adjuntar documentos.</p>}<p>PDF, DOCX y XLSX hasta 10 MiB. Imágenes y videos fuera del alcance de esta entrega.</p></div>;

  return (
    <div className="review-summary stack-md">
      <strong>{form.titulo}</strong>
      <p>
        Modalidad: {form.modalidad}. Escuela: {form.escuela}. Palabras clave:{" "}
        {form.palabras}.
      </p>
      <p>
        «Guardar y salir» deja el expediente en borrador. «Enviar a revisión»
        guarda los campos y anexos capturados y pasa la propuesta a la
        bandeja de evaluación.
      </p>
    </div>
  );
}

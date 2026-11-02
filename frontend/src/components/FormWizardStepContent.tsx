import { useId, type ReactNode } from "react";
import type { Convocatoria } from "../api/convocatorias";
import { MODALIDADES } from "../data/demo";
import { DEMO_PROPOSALS } from "../data/demo";
import {
  ALT_TEXT_MIN_CHARS,
  ESTADO_ARTE_MAX_WORDS,
  PLAN_RESPONSIBILITIES,
  type ActionPlanActivityDraft,
  type ActionPlanParticipantDraft,
  type ActionPlanRiskDraft,
  type AmbitoInstrumento,
  type FormWizardState,
  type GradoVinculo,
  type GraphicResource,
  type NivelTrl,
  TEAM_HOUR_TYPES,
  TEAM_MEMBER_ROLES,
  type TeamHourDraft,
  type TeamTecDraft,
  type TipoInnovacion,
  type YesNo,
  TRL_LEVELS,
} from "../data/formWizard";
import { formatCRC } from "../data/proposalView";

type Props = {
  step: number;
  form: FormWizardState;
  patch: (partial: Partial<FormWizardState>) => void;
  convocatorias: Convocatoria[];
  idConvocatoria: number | "";
  setIdConvocatoria: (v: number | "") => void;
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
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  extra?: ReactNode;
}) {
  // Sin `name` compartido los dos radios no son un grupo real: no navegan con
  // las flechas ni se anuncian como "1 de 2".
  const groupName = useId();
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
              name={groupName}
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
  const q6GroupName = useId();

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
                <option value="">Seleccionar…</option>
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
                extra={
                  form.q1 === "Sí" ? (
                    <div className="stack-md">
                      <div className="form-grid two-col">
                        <label className="field">
                          <span className="field-label">Entidad</span>
                          <input
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
                          <input
                            className="input"
                            value={form.q1Estado}
                            onChange={(e) =>
                              patch({ q1Estado: e.target.value })
                            }
                          />
                        </label>
                      </div>
                      <label className="field">
                        <span className="field-label">
                          ¿Existe compromiso de contrapartida institucional?
                        </span>
                        <select
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
                value={form.q8}
                onChange={(q8) => patch({ q8 })}
                extra={
                  form.q8 === "Sí" ? (
                    <label className="field">
                      <span className="field-label">
                        Número de oficio del dictamen del Centro de Vinculación
                      </span>
                      <input
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
                  Nivel de madurez tecnológica (TRL) esperado
                </span>
                <select
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
            placeholder="Separadas por comas"
          />
        </label>
        <label className="field">
          <span className="field-label">Keywords</span>
          <input
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
          <div className="table-wrap">
            <table className="data-table wide-form-table team-edit-table">
              <thead>
                <tr>
                  <th scope="col">Nombre y apellidos</th>
                  <th scope="col">Iniciales</th>
                  <th scope="col">ID ORCID *</th>
                  <th scope="col">Instancia académica</th>
                  <th scope="col">Condición (rol) *</th>
                  <th scope="col">
                    Cantidad y tipo de horas (REC, CONS, DOC VIE, VIESA o
                    VIE-Centro)
                  </th>
                  <th scope="col">Periodo de nombramiento</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {form.teamTec.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      Aún no agregaste personas funcionarias del TEC.
                    </td>
                  </tr>
                ) : (
                  form.teamTec.map((member, memberIndex) => (
                    <tr key={member.id}>
                      <td>
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
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <input
                          className="input"
                          value={member.orcid}
                          maxLength={19}
                          placeholder="0000-0000-0000-0000"
                          aria-required="true"
                          aria-label={`ID ORCID, persona TEC ${memberIndex + 1}`}
                          onChange={(event) =>
                            patchTeamTec(member.id, {
                              orcid: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
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
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <div className="stack-sm">
                          {(member.horas.length > 0
                            ? member.horas
                            : [{ tipo: "", cantidad: "" }]
                          ).map((hours, hourIndex) => (
                            <div
                              className="team-hours-row"
                              key={`${member.id}-hours-${hourIndex}`}
                            >
                              <label className="sr-only" htmlFor={`${member.id}-hours-type-${hourIndex}`}>
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
                              <label className="sr-only" htmlFor={`${member.id}-hours-amount-${hourIndex}`}>
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
                            className="btn btn-secondary"
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
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            patch({
                              teamTec: form.teamTec.filter(
                                (item) => item.id !== member.id,
                              ),
                            })
                          }
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
          <div className="table-wrap">
            <table className="data-table wide-form-table team-edit-table team-external-edit-table">
              <thead>
                <tr>
                  <th scope="col">Nombre completo del colaborador externo</th>
                  <th scope="col">Iniciales</th>
                  <th scope="col">ID ORCID *</th>
                  <th scope="col">Institución o empresa que representa</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {form.teamExternal.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Aún no agregaste colaboradores externos.</td>
                  </tr>
                ) : (
                  form.teamExternal.map((member, memberIndex) => (
                    <tr key={member.id}>
                      <td>
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
                      </td>
                      <td>
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
                      </td>
                      <td>
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
                                  ? { ...item, orcid: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            patch({
                              teamExternal: form.teamExternal.filter(
                                (item) => item.id !== member.id,
                              ),
                            })
                          }
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
            className="input textarea"
            rows={5}
            value={form.problema}
            onChange={(e) => patch({ problema: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Objetivo general</span>
          <textarea
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
            value={form.estadoArte}
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
            " — reducilo para poder guardar el borrador"}
        </p>
      </div>
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
                  Actividad {activityIndex + 1}
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
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
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Objetivo asociado</span>
                  <select
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
                    className="input"
                    type="number"
                    min="1"
                    max="36"
                    step="1"
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
            </section>
          ))
        )}
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
      <div className="field" role="group" aria-labelledby="decl-jurada-label">
        <span className="field-label" id="decl-jurada-label">
          Declaración jurada
        </span>
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
      </div>
    );
  }

  if (step === 15) {
    function addResource(tipo: GraphicResource["tipo"], fileList: FileList | null) {
      const file = fileList?.[0];
      if (!file) return;
      const next: GraphicResource = {
        id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo,
        nombreArchivo: file.name,
        altText: "",
      };
      patch({ recursosGraficos: [...form.recursosGraficos, next] });
    }

    function updateAlt(id: string, altText: string) {
      patch({
        recursosGraficos: form.recursosGraficos.map((r) =>
          r.id === id ? { ...r, altText } : r,
        ),
      });
    }

    function removeResource(id: string) {
      patch({
        recursosGraficos: form.recursosGraficos.filter((r) => r.id !== id),
      });
    }

    return (
      <div className="stack-md">
        <div>
          <h3>Documentos del expediente</h3>
          <p className="field-hint">
            Formulario, plan de acción, presupuesto y acuerdos (referencia del
            prototipo).
          </p>
          <div className="task-list" style={{ marginTop: 12 }}>
            {rich.documentos.map((d) => (
              <div
                key={d.nombre}
                className="task-row"
                style={{ cursor: "default" }}
              >
                <strong>{d.nombre}</strong>
                <span className="badge badge-primary">{d.estado}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>Recursos gráficos (imágenes y videos)</h3>
          <p className="field-hint">
            Cada recurso debe incluir un texto alternativo editable y
            suficientemente descriptivo (rúbrica de accesibilidad · WCAG 1.1.1).
          </p>

          <div className="resource-alt-actions" style={{ marginTop: 12 }}>
            <label className="btn btn-secondary">
              Agregar imagen
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  addResource("imagen", e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="btn btn-secondary">
              Agregar video
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => {
                  addResource("video", e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {form.recursosGraficos.length === 0 ? (
            <p className="empty-state" style={{ marginTop: 16 }}>
              Todavía no hay recursos gráficos. Agregue una imagen o un video y
              complete su descripción alternativa.
            </p>
          ) : (
            <ul className="resource-alt-list" style={{ marginTop: 16 }}>
              {form.recursosGraficos.map((r) => {
                const len = r.altText.trim().length;
                const short = len > 0 && len < ALT_TEXT_MIN_CHARS;
                const altId = `alt-${r.id}`;
                return (
                  <li key={r.id} className="resource-alt-card">
                    <div className="resource-alt-card-head">
                      <div className="resource-alt-meta">
                        <span className="badge">
                          {r.tipo === "imagen" ? "Imagen" : "Video"}
                        </span>
                        <strong>{r.nombreArchivo}</strong>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => removeResource(r.id)}
                      >
                        Quitar
                      </button>
                    </div>
                    <label className="field" htmlFor={altId}>
                      <span className="field-label">
                        Texto alternativo / descripción
                      </span>
                      <textarea
                        id={altId}
                        className="input textarea"
                        rows={3}
                        value={r.altText}
                        onChange={(e) => updateAlt(r.id, e.target.value)}
                        placeholder={
                          r.tipo === "imagen"
                            ? "Describa el contenido visual relevante de la imagen…"
                            : "Describa el contenido del video (tema, escenas, información clave)…"
                        }
                      />
                    </label>
                    <p
                      className={`resource-alt-hint${short ? " warn" : ""}`}
                      role="status"
                    >
                      {len === 0
                        ? "Falta el texto alternativo."
                        : short
                          ? `La descripción es corta (${len} caracteres). Se recomienda al menos ${ALT_TEXT_MIN_CHARS} para que sea útil con lector de pantalla.`
                          : `Descripción lista (${len} caracteres). Puede editarla en cualquier momento.`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
        «Guardar y salir» deja el expediente en borrador. «Enviar a revisión»
        persiste el bloque núcleo (identificación, resumen, problema, objetivo
        general, objetivos específicos y metodología) y pasa la propuesta a la
        bandeja de evaluación.
      </p>
    </div>
  );
}

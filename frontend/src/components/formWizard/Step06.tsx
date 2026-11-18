import type { WizardStepBag } from "./wizardTypes";
import { FormInput, FormSelect, LimitedTextarea } from "../ProposalFieldControls";
import {
  PLAN_RESPONSIBILITIES,
} from "../../data/formWizardIan";
import { planHorizonMonths } from "../../data/dateRules";
import { PersonPicker } from "../PersonPicker";
import { RemoveIconButton } from "../ConfirmDialog";

export function Step06(ctx: WizardStepBag) {
  const {
    form,
    patch,
    collapsedActivities,
    setCollapsedActivities,
    pendingRisk,
    patchPlanActivity,
    patchPlanParticipant,
    patchPlanRisk,
  } = ctx;
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
  const horizonMonths = planHorizonMonths(form.inicio, form.fin);
  const planMax = horizonMonths || 36;

  return (
    <div className="stack-xl">
      <p className="body-copy">
        Registrá las actividades y riesgos del proyecto. Incluí giras,
        informes de avance y pasantías cuando corresponda. El mes 1 corresponde
        al inicio del proyecto
        {horizonMonths > 0
          ? ` (${horizonMonths} mes${horizonMonths === 1 ? "" : "es"} entre inicio y fin)`
          : ""}
        ; ninguna actividad puede salir de ese rango. Duración e inicio se
        indican en meses enteros. Cada actividad debe tener al menos una
        persona responsable y un riesgo con su medida de mitigación.
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
                  riesgos: [],
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
              <RemoveIconButton
                ariaLabel={`Quitar actividad ${activityIndex + 1}`}
                confirmWhat={`la actividad ${activityIndex + 1}`}
                onConfirm={() =>
                  patch({
                    planAccion: form.planAccion.filter(
                      (item) => item.id !== activity.id,
                    ),
                  })
                }
              />
            </div>
            {!collapsedActivities[activity.id] && (
            <>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Objetivo asociado</span>
                <FormSelect
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
                </FormSelect>
              </label>
              <label className="field">
                <span className="field-label">
                  Mes de inicio (1–{planMax} del proyecto)
                </span>
                <FormInput
                  aria-label={`Mes de inicio, actividad ${activityIndex + 1}`}
                  className="input"
                  type="number"
                  min="1"
                  max={planMax}
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
                <span className="field-label">
                  Duración (meses enteros · máx. {planMax})
                </span>
                <FormInput
                  aria-label={`Duración en meses, actividad ${activityIndex + 1}`}
                  className="input"
                  type="number"
                  min="1"
                  max={planMax}
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
                <LimitedTextarea
                  aria-label={`Descripción de la actividad ${activityIndex + 1}`}
                  className="input textarea"
                  rows={3}
                  maxLength={5000} value={activity.actividad}
                  onChange={(event) =>
                    patchPlanActivity(activity.id, {
                      actividad: event.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Resultado esperado</span>
                <LimitedTextarea
                  aria-label={`Resultado esperado, actividad ${activityIndex + 1}`}
                  className="input textarea"
                  rows={3}
                  maxLength={5000} value={activity.resultadoEsperado}
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
                    <FormSelect
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
                    </FormSelect>
                  </label>
                  <label className="field">
                    <span className="field-label">Responsabilidad</span>
                    <FormSelect
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
                    </FormSelect>
                  </label>
                  <RemoveIconButton
                    ariaLabel={`Quitar participante ${assignmentIndex + 1} de actividad ${activityIndex + 1}`}
                    confirmWhat={`al participante ${assignmentIndex + 1} de la actividad ${activityIndex + 1}`}
                    onConfirm={() =>
                      patchPlanActivity(activity.id, {
                        participantes: activity.participantes.filter(
                          (item) => item.id !== assignment.id,
                        ),
                      })
                    }
                  />
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
                  onClick={() => {
                    pendingRisk.current={activityId:activity.id,index:activity.riesgos.length};
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
                    });
                  }}
                >
                  Agregar riesgo
                </button>
              </div>
              {activity.riesgos.map((risk, riskIndex) => (
                <div className="form-section-block action-plan-risk" id={`risk-${activity.id}-${riskIndex}`} key={risk.id}>
                  <div className="page-heading">
                    <h5>Riesgo {riskIndex + 1}</h5>
                    <RemoveIconButton
                      ariaLabel={`Quitar riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                      confirmWhat={`el riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                      onConfirm={() =>
                        patchPlanActivity(activity.id, {
                          riesgos: activity.riesgos.filter(
                            (item) => item.id !== risk.id,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">Riesgo identificado</span>
                      <LimitedTextarea
                        aria-label={`Riesgo identificado, riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                        className="input textarea"
                        rows={2}
                        maxLength={5000} value={risk.riesgo}
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
                      <LimitedTextarea
                        aria-label={`Medidas de mitigación, riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                        className="input textarea"
                        rows={2}
                        maxLength={5000} value={risk.mitigacion}
                        onChange={(event) =>
                          patchPlanRisk(activity.id, risk.id, {
                            mitigacion: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <PersonPicker
                    label="Responsable de la gestión del riesgo"
                    ariaLabel={`Responsable de la gestión del riesgo ${riskIndex + 1} de la actividad ${activityIndex + 1}`}
                    value={risk.responsable}
                    includeCatalog={false}
                    onChangeNombre={(nombre) =>
                      patchPlanRisk(activity.id, risk.id, { responsable: nombre })
                    }
                    onPick={(person) =>
                      patchPlanRisk(activity.id, risk.id, {
                        responsable: person.nombre,
                      })
                    }
                  />
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

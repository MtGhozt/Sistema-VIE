import type { WizardStepBag } from "./wizardTypes";
import { FormInput, FormSelect } from "../ProposalFieldControls";
import { ConvocatoriaDateField } from "../ConvocatoriaDateField";
import { dateFromInput } from "../../data/convocatoriaUi";
import {
  TEAM_HOUR_TYPES,
  TEAM_MEMBER_ROLES,
} from "../../data/formWizardIan";
import { PersonPicker } from "../PersonPicker";
import { formatOrcidInput } from "../../data/orcidFormat";
import { RemoveIconButton } from "../ConfirmDialog";

export function Step02(ctx: WizardStepBag) {
  const {
    form,
    patch,
    patchTeamTec,
    patchAppointment,
    patchTeamHours,
  } = ctx;
  return (
    <div className="stack-xl">
      <p className="body-copy">
        Agregá las personas funcionarias del TEC y las personas colaboradoras
        externas que participarán en la propuesta. Podés añadir tantas filas y
        tipos de horas TEC como necesités. Las personas externas se registran con los datos de colaboración establecidos en el formulario oficial.
      </p>

      <section className="stack-md" aria-labelledby="team-tec-heading">
        <div className="page-heading">
          <div>
            <h3 id="team-tec-heading">
              Personas investigadoras del TEC
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
                  <RemoveIconButton
                    ariaLabel={`Quitar persona TEC ${memberIndex + 1}${member.nombre ? `: ${member.nombre}` : ""}`}
                    confirmWhat={`a la persona TEC ${memberIndex + 1}${member.nombre ? ` (${member.nombre})` : ""}`}
                    onConfirm={() =>
                      patch({
                        teamTec: form.teamTec.filter(
                          (item) => item.id !== member.id,
                        ),
                      })
                    }
                  />
                </div>
                <div className="team-member-fields team-tec-fields">
                  <div className="team-member-field">
                    <PersonPicker
                      label="Nombre y apellidos"
                      ariaLabel={`Nombre y apellidos, persona TEC ${memberIndex + 1}`}
                      value={member.nombre}
                      includeCatalog
                      onChangeNombre={(nombre) =>
                        patchTeamTec(member.id, { nombre, idUsuario: null })
                      }
                      onPick={(person) =>
                        patchTeamTec(member.id, {
                          nombre: person.nombre,
                          iniciales: person.iniciales || member.iniciales,
                          orcid: person.orcid || member.orcid,
                          instancia: person.instancia || member.instancia,
                          idUsuario: person.idUsuario ?? null,
                        })
                      }
                    />
                  </div>
                  <label className="team-member-field">
                    <span className="field-label">Iniciales</span>
                    <FormInput
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
                    <FormInput
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
                    <FormInput
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
                    <FormSelect
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
                    </FormSelect>
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
                          <FormSelect
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
                          </FormSelect>
                          <label
                            className="sr-only"
                            htmlFor={`${member.id}-hours-amount-${hourIndex}`}
                          >
                            Cantidad de horas, persona TEC {memberIndex + 1}
                          </label>
                          <FormInput
                            id={`${member.id}-hours-amount-${hourIndex}`}
                            className="input"
                            type="number"
                            min="0"
                            max="999"
                            step="1"
                            value={hours.cantidad}
                            aria-label={`Cantidad de horas ${hourIndex + 1}, persona TEC ${memberIndex + 1}`}
                            onChange={(event) =>
                              patchTeamHours(member.id, hourIndex, {
                                cantidad: event.target.value,
                              })
                            }
                          />
                          {member.horas.length > 1 && (
                            <RemoveIconButton
                              ariaLabel={`Quitar tipo de horas ${hourIndex + 1}, persona TEC ${memberIndex + 1}`}
                              confirmWhat={`el tipo de horas ${hourIndex + 1} de la persona TEC ${memberIndex + 1}`}
                              onConfirm={() =>
                                patchTeamTec(member.id, {
                                  horas: member.horas.filter(
                                    (_, index) => index !== hourIndex,
                                  ),
                                })
                              }
                            />
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-secondary team-add-hours"
                        aria-label={`Agregar otro tipo de horas, persona TEC ${memberIndex + 1}`}
                        disabled={member.horas.length>=TEAM_HOUR_TYPES.length}
                        onClick={() =>
                          patchTeamTec(member.id, {
                            horas: [
                              ...(member.horas.length?member.horas:[{tipo:"" as const,cantidad:""}]),
                              { tipo: "", cantidad: "" },
                            ],
                          })
                        }
                      >
                        Agregar otro tipo de horas
                      </button>
                    </div>
                  </div>
                  <div className="team-member-field appointment-dates">
                    <span className="field-label appointment-caption">Período de nombramiento (obligatorio para continuar)</span><span className="field-hint appointment-caption">Indique inicio y fin. El borrador puede quedar incompleto; para avanzar o confirmar la sección se requieren ambas fechas.</span>
                    {member.periodo&&!member.periodo.includes(' / ')&&<p className="field-hint">Período anterior: {member.periodo}. Indique las fechas para actualizarlo.</p>}
                    <ConvocatoriaDateField id={`${member.id}-periodo-inicio`} required label={`Inicio de nombramiento, persona TEC ${memberIndex+1}`} value={member.periodo.includes(' / ')?member.periodo.split(' / ')[0]:''} onChange={v=>patchAppointment(member.id,v,member.periodo.split(' / ')[1]??'')}/>
                    <ConvocatoriaDateField id={`${member.id}-periodo-fin`} required label={`Fin de nombramiento, persona TEC ${memberIndex+1}`} value={member.periodo.includes(' / ')?member.periodo.split(' / ')[1]:''} min={dateFromInput(member.periodo.split(' / ')[0])??undefined} onChange={v=>patchAppointment(member.id,member.periodo.includes(' / ')?member.periodo.split(' / ')[0]:'',v)}/>
                  </div>
                  <div className="team-member-field">
                    <span className="field-hint">CONS: horas del régimen de Investigador Consolidado. Indique quién aporta estas horas; complete solo si asignó horas CONS.</span>
                    <PersonPicker
                      label="Dependencia o persona que aporta horas CONS (si aplica)"
                      ariaLabel={`Titular de horas CONS, persona TEC ${memberIndex + 1}`}
                      value={member.titularCons ?? ""}
                      includeCatalog
                      onChangeNombre={(nombre) =>
                        patchTeamTec(member.id, { titularCons: nombre })
                      }
                      onPick={(person) =>
                        patchTeamTec(member.id, { titularCons: person.nombre })
                      }
                    />
                  </div>
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
              Personas colaboradoras externas
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
                  <RemoveIconButton
                    ariaLabel={`Quitar colaborador externo ${memberIndex + 1}${member.nombre ? `: ${member.nombre}` : ""}`}
                    confirmWhat={`al colaborador/a externo/a ${memberIndex + 1}${member.nombre ? ` (${member.nombre})` : ""}`}
                    onConfirm={() =>
                      patch({
                        teamExternal: form.teamExternal.filter(
                          (item) => item.id !== member.id,
                        ),
                      })
                    }
                  />
                </div>
                <div className="team-member-fields team-external-fields">
                  <div className="team-member-field">
                    <PersonPicker
                      label="Nombre completo del colaborador externo"
                      ariaLabel={`Nombre completo, colaborador externo ${memberIndex + 1}`}
                      value={member.nombre}
                      includeCatalog={false}
                      onChangeNombre={(nombre) =>
                        patch({
                          teamExternal: form.teamExternal.map((item) =>
                            item.id === member.id
                              ? { ...item, nombre, idUsuario: null }
                              : item,
                          ),
                        })
                      }
                      onPick={(person) =>
                        patch({
                          teamExternal: form.teamExternal.map((item) =>
                            item.id === member.id
                              ? {
                                  ...item,
                                  nombre: person.nombre,
                                  iniciales: person.iniciales || item.iniciales,
                                  orcid: person.orcid || item.orcid,
                                  institucion: person.instancia || item.institucion,
                                  idUsuario: person.idUsuario ?? null,
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </div>
                  <label className="team-member-field">
                    <span className="field-label">Iniciales</span>
                    <FormInput
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
                    <FormInput
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
                    <FormInput
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

import type { WizardStepBag } from "./wizardTypes";
import { FormInput, FormSelect, LimitedTextarea } from "../ProposalFieldControls";
import { ConvocatoriaDateField } from "../ConvocatoriaDateField";
import { dateFromInput, dateLabel } from "../../data/convocatoriaUi";
import {
  TRL_LEVELS,
  type GradoVinculo,
} from "../../data/formWizardIan";
import { DATE_YEAR_MAX, DATE_YEAR_MIN } from "../../data/dateRules";
import { QuestionBlock, YesNoRow, ambitoValue, tipoInnovacionValue, nivelTrlValue } from "./shared";

export function Step00(ctx: WizardStepBag) {
  const {
    form,
    patch,
    readOnly,
    lineas,
    onIdentificacion,
    convocatorias,
    idConvocatoria,
    setIdConvocatoria,
    bloquearIdentificacion,
    catalogos,
    error,
    q6GroupName,
  } = ctx;
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
              <FormInput
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
          <FormSelect
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
          </FormSelect>
        </label>
        <div className="form-grid two-col">
          <label className="field">
            <span className="field-label">Nombre del proyecto</span>
            <FormInput
              aria-label="Nombre del proyecto" maxLength={500}
              className="input"
              value={form.titulo}
              onChange={(e) => patch({ titulo: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Modalidad</span>
            <FormSelect
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
            </FormSelect>
          </label>
          <ConvocatoriaDateField
            id="proyecto-inicio"
            label="Fecha de inicio (día/mes/año)"
            value={/^\d{4}-/.test(form.inicio)?dateLabel(form.inicio):form.inicio}
            min={`${DATE_YEAR_MIN}-01-01`}
            max={`${DATE_YEAR_MAX}-12-31`}
            disabled={readOnly}
            onChange={(value) => {
              const iso = dateFromInput(value);
              // No persistir texto parcial inválido; conservar solo ISO o borrador DD/MM en edición.
              patch({ inicio: iso ?? (/^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value : form.inicio) });
            }}
          />
          <ConvocatoriaDateField
            id="proyecto-fin"
            label="Fecha de finalización (día/mes/año)"
            value={/^\d{4}-/.test(form.fin)?dateLabel(form.fin):form.fin}
            min={/^\d{4}-\d{2}-\d{2}$/.test(form.inicio)?form.inicio:`${DATE_YEAR_MIN}-01-01`}
            max={`${DATE_YEAR_MAX}-12-31`}
            disabled={readOnly}
            onChange={(value) => {
              const iso = dateFromInput(value);
              patch({ fin: iso ?? (/^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value : form.fin) });
            }}
          />
        </div>
        <label className="field">
          <span className="field-label">
            Dependencia académica coordinadora
          </span>
          <FormInput
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
                        <FormInput
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
                        <FormSelect
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
                        </FormSelect>
                      </label>
                    </div>
                    <div className="field"><span className="field-label">¿Existe compromiso de contrapartida institucional?</span>
                      <YesNoRow label="¿Existe compromiso de contrapartida institucional?" value={form.q1Contrapartida} onChange={q1Contrapartida=>patch({q1Contrapartida})}/>
                    </div>
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
                      <FormInput
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
                      <FormInput
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
                    <LimitedTextarea
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
                    <FormSelect
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
                    </FormSelect>
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
                    <FormInput
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
                      <FormInput
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
                    <FormInput
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
                    <FormInput
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
                    <FormInput
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
                    <LimitedTextarea
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
                    <FormInput
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
                    <FormSelect
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
                    </FormSelect>
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
              <FormSelect
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
              </FormSelect>
            </label>
          ) : null}
        </div>
      </section>
    </div>
  );
}

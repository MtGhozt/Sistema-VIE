import type { WizardStepBag } from "./wizardTypes";
import { FormInput, LimitedTextarea } from "../ProposalFieldControls";

export function Step11(ctx: WizardStepBag) {
  const {
    form,
    patch,
  } = ctx;
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
                <FormInput
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
              <LimitedTextarea
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
          <LimitedTextarea
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
                <FormInput
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
              <FormInput
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
            <LimitedTextarea
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

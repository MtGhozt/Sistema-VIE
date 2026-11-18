import type { WizardStepBag } from "./wizardTypes";
import { FormInput } from "../ProposalFieldControls";

export function Step09(ctx: WizardStepBag) {
  const {
    form,
    patch,
  } = ctx;
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
              <FormInput
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
              <FormInput
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
                <FormInput
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

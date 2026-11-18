import type { WizardStepBag } from "./wizardTypes";
import { FormInput } from "../ProposalFieldControls";
import { PersonPicker } from "../PersonPicker";

export function Step14(ctx: WizardStepBag) {
  const {
    form,
    patch,
  } = ctx;
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
      <PersonPicker
        label="Nombre completo de la persona coordinadora"
        ariaLabel="Nombre completo de la persona coordinadora"
        value={declaration.nombreCompleto}
        includeCatalog={false}
        onChangeNombre={(nombre) =>
          patch({
            declaracionJurada: { ...declaration, nombreCompleto: nombre },
          })
        }
        onPick={(person) =>
          patch({
            declaracionJurada: {
              ...declaration,
              nombreCompleto: person.nombre,
              cedula: person.cedula || declaration.cedula,
              firma: person.nombre,
            },
          })
        }
      />
      <label className="field">
        <span className="field-label">Número de cédula</span>
        <FormInput
          aria-label="Número de cédula"
          className="input"
          maxLength={11} inputMode="numeric" placeholder="X-XXXX-XXXX"
          value={declaration.cedula}
          onChange={(event) =>
            patch({
              declaracionJurada: {
                ...declaration,
                cedula: (()=>{const d=event.target.value.replace(/\D/g,'').slice(0,9);return [d.slice(0,1),d.slice(1,5),d.slice(5)].filter(Boolean).join('-');})(),
              },
            })
          }
        />
      </label>
      <label className="field">
        <span className="field-label">
          Firma de la persona investigadora coordinadora
        </span>
        <FormInput
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
        <FormInput
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

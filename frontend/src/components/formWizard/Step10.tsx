import type { WizardStepBag } from "./wizardTypes";
import { LimitedTextarea } from "../ProposalFieldControls";

export function Step10(ctx: WizardStepBag) {
  const {
    form,
    patch,
  } = ctx;
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
        <LimitedTextarea
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
        <LimitedTextarea
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
        <LimitedTextarea
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
        <LimitedTextarea
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

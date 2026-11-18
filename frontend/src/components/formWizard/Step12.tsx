import type { WizardStepBag } from "./wizardTypes";
import { LimitedTextarea } from "../ProposalFieldControls";

export function Step12(ctx: WizardStepBag) {
  const {
    form,
    patch,
  } = ctx;
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
          <LimitedTextarea
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

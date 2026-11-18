import type { WizardStepBag } from "./wizardTypes";
import { LimitedTextarea } from "../ProposalFieldControls";
import {
  FIELD_WORD_LIMITS,
} from "../../data/formWizardIan";
import { WordBudget } from "../WordBudget";

export function Step03(ctx: WizardStepBag) {
  const {
    form,
    patch,
  } = ctx;
  return (
    <div className="stack-lg">
      <label className="field">
        <span className="field-label">
          Planteamiento del problema (máx. 1 página ·{" "}
          {FIELD_WORD_LIMITS.problema} palabras)
        </span>
        <LimitedTextarea
          aria-label="Planteamiento del problema"
          className="input textarea"
          rows={5}
          value={form.problema}
          aria-describedby="wb-problema"
          onChange={(e) => patch({ problema: e.target.value })}
        />
        <WordBudget
          id="wb-problema"
          value={form.problema}
          maxWords={FIELD_WORD_LIMITS.problema}
        />
      </label>

      <label className="field">
        <span className="field-label">Objetivo general</span>
        <LimitedTextarea
          aria-label="Objetivo general"
          className="input textarea"
          rows={3}
          value={form.objetivoGeneral}
          aria-describedby="wb-objetivo-general"
          onChange={(e) => patch({ objetivoGeneral: e.target.value })}
        />
        <WordBudget
          id="wb-objetivo-general"
          value={form.objetivoGeneral}
          maxWords={FIELD_WORD_LIMITS.objetivoGeneral}
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
            <LimitedTextarea
              id={`specific-objective-${objective.id}`}
              aria-label={`Objetivo específico ${index + 1}`}
              className="input textarea"
              rows={2}
              value={objective.descripcion}
              aria-describedby={`wb-obj-${objective.id}`}
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
            <WordBudget
              id={`wb-obj-${objective.id}`}
              value={objective.descripcion}
              maxWords={FIELD_WORD_LIMITS.objetivoEspecifico}
            />
          </label>
        ))}
      </section>
    </div>
  );
}

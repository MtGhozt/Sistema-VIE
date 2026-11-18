import type { WizardStepBag } from "./wizardTypes";
import { LimitedTextarea } from "../ProposalFieldControls";
import {
  FIELD_WORD_LIMITS,
} from "../../data/formWizardIan";
import { CollapsibleBlock } from "../CollapsibleBlock";
import { WordBudget } from "../WordBudget";

export function Step04(ctx: WizardStepBag) {
  const {
    form,
    patch,
    readOnly,
    expandReadOnly,
  } = ctx;
  const estadoArteBody = (
    <>
      <p className="body-copy">
        Analizá teorías actualizadas, investigaciones, antecedentes y
        metodologías previas nacionales e internacionales. Explicá el aporte
        original de la investigación y los vacíos de conocimiento que busca
        atender. Incluí al menos 10 referencias bibliográficas de fuentes
        primarias publicadas en los últimos cinco años; los artículos deben
        provenir de revistas indexadas en Scopus o Web of Science.
      </p>
      <label className="field">
        <span className="field-label">
          Estado del arte (máximo 2 páginas ·{" "}
          {FIELD_WORD_LIMITS.estadoArte} palabras)
        </span>
        <LimitedTextarea
          className="input textarea"
          rows={12}
          aria-label="Estado del arte"
          value={form.estadoArte}
          aria-describedby="estado-arte-guidance wb-estado-arte"
          onChange={(event) => patch({ estadoArte: event.target.value })}
        />
      </label>
      <p id="estado-arte-guidance" className="field-hint">
        Orientación: {FIELD_WORD_LIMITS.estadoArte} palabras ≈ dos páginas
        (la cantidad real depende del formato).
      </p>
      <WordBudget
        id="wb-estado-arte"
        value={form.estadoArte}
        maxWords={FIELD_WORD_LIMITS.estadoArte}
      />
    </>
  );
  return (
    <div className="stack-lg">
      {readOnly ? (
        <CollapsibleBlock
          title="Estado del arte"
          defaultOpen={expandReadOnly}
          preview={form.estadoArte.slice(0, 160) || "Sin texto"}
        >
          {estadoArteBody}
        </CollapsibleBlock>
      ) : (
        estadoArteBody
      )}
    </div>
  );
}

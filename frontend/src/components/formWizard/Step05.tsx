import type { WizardStepBag } from "./wizardTypes";
import { LimitedTextarea } from "../ProposalFieldControls";
import {
  FIELD_WORD_LIMITS,
} from "../../data/formWizardIan";
import { CollapsibleBlock } from "../CollapsibleBlock";
import { WordBudget } from "../WordBudget";

export function Step05(ctx: WizardStepBag) {
  const {
    form,
    patch,
    readOnly,
    expandReadOnly,
  } = ctx;
  const metodologiaBody = (
    <label className="field">
      <span className="field-label">Metodología</span>
      <LimitedTextarea
        aria-label="Metodología"
        className="input textarea"
        rows={8}
        value={form.metodologia}
        aria-describedby="wb-metodologia"
        onChange={(e) => patch({ metodologia: e.target.value })}
      />
      <WordBudget
        id="wb-metodologia"
        value={form.metodologia}
        maxWords={FIELD_WORD_LIMITS.metodologia}
      />
    </label>
  );
  return readOnly ? (
    <CollapsibleBlock
      title="Metodología"
      defaultOpen={expandReadOnly}
      preview={form.metodologia.slice(0, 160) || "Sin texto"}
    >
      {metodologiaBody}
    </CollapsibleBlock>
  ) : (
    metodologiaBody
  );
}

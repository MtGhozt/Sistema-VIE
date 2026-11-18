import type { WizardStepBag } from "./wizardTypes";
import { LimitedTextarea } from "../ProposalFieldControls";
import {
  FIELD_WORD_LIMITS,
} from "../../data/formWizardIan";
import { WordBudget } from "../WordBudget";

export function Step13(ctx: WizardStepBag) {
  const {
    form,
    patch,
  } = ctx;
  return (
    <label className="field">
      <span className="field-label">Referencias</span>
      <LimitedTextarea
        aria-label="Referencias"
        className="input textarea"
        rows={10}
        value={form.referencias}
        aria-describedby="wb-referencias"
        onChange={(e) => patch({ referencias: e.target.value })}
      />
      <WordBudget
        id="wb-referencias"
        value={form.referencias}
        maxWords={FIELD_WORD_LIMITS.referencias}
      />
    </label>
  );
}

import type { WizardStepBag } from "./wizardTypes";
import { FormInput, LimitedTextarea } from "../ProposalFieldControls";
import {
  FIELD_WORD_LIMITS,
} from "../../data/formWizardIan";
import { CollapsibleBlock } from "../CollapsibleBlock";
import { WordBudget } from "../WordBudget";

export function Step01(ctx: WizardStepBag) {
  const {
    form,
    patch,
    readOnly,
    expandReadOnly,
  } = ctx;
  const resumenBlock = (
    <label className="field">
      <span className="field-label">
        Resumen (español · máximo {FIELD_WORD_LIMITS.resumen} palabras)
      </span>
      <LimitedTextarea
        aria-label={`Resumen (español · máximo ${FIELD_WORD_LIMITS.resumen} palabras)`}
        className="input textarea"
        rows={6}
        value={form.resumen}
        aria-describedby="wb-resumen"
        onChange={(e) => patch({ resumen: e.target.value })}
      />
      <WordBudget
        id="wb-resumen"
        value={form.resumen}
        maxWords={FIELD_WORD_LIMITS.resumen}
      />
    </label>
  );
  const abstractBlock = (
    <label className="field">
      <span className="field-label">
        Abstract (English · max. {FIELD_WORD_LIMITS.abstract} words)
      </span>
      <LimitedTextarea
        aria-label={`Abstract (English · max. ${FIELD_WORD_LIMITS.abstract} words)`}
        className="input textarea"
        rows={6}
        value={form.abstract}
        aria-describedby="wb-abstract"
        onChange={(e) => patch({ abstract: e.target.value })}
      />
      <WordBudget
        id="wb-abstract"
        value={form.abstract}
        maxWords={FIELD_WORD_LIMITS.abstract}
      />
    </label>
  );
  return (
    <div className="stack-lg">
      {readOnly ? (
        <CollapsibleBlock
          title="Resumen (español)"
          defaultOpen={expandReadOnly}
          preview={form.resumen.slice(0, 160) || "Sin texto"}
        >
          {resumenBlock}
        </CollapsibleBlock>
      ) : (
        resumenBlock
      )}
      {readOnly ? (
        <CollapsibleBlock
          title="Abstract (English)"
          defaultOpen={expandReadOnly}
          preview={form.abstract.slice(0, 160) || "Sin texto"}
        >
          {abstractBlock}
        </CollapsibleBlock>
      ) : (
        abstractBlock
      )}
      <label className="field">
        <span className="field-label">Palabras clave</span>
        <FormInput
          aria-label="Palabras clave"
          className="input"
          value={form.palabras}
          onChange={(e) => patch({ palabras: e.target.value })}
          placeholder="Separadas por comas"
        />
      </label>
      <label className="field">
        <span className="field-label">Keywords EN (opcionales)</span>
        <FormInput
          aria-label="Keywords EN (opcionales)"
          className="input"
          value={form.keywords}
          onChange={(e) => patch({ keywords: e.target.value })}
          placeholder="De 4 a 6 términos separados por comas (si completa el campo)"
        />
      </label>
    </div>
  );
}

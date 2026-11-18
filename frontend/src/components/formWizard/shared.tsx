import { useContext, useId, type ReactNode } from "react";
import { ProposalFieldErrors } from "../ProposalFieldContext";
import { FormInput } from "../ProposalFieldControls";
import {
  TRL_LEVELS,
  type AmbitoInstrumento,
  type NivelTrl,
  type TipoInnovacion,
  type YesNo,
} from "../../data/formWizardIan";

export function ambitoValue(value: string): AmbitoInstrumento {
  if (value === "nacional" || value === "internacional") return value;
  return "";
}

export function tipoInnovacionValue(value: string): TipoInnovacion {
  if (value === "Proceso" || value === "Producto") return value;
  return "";
}

export function nivelTrlValue(value: string): NivelTrl {
  return TRL_LEVELS.find((nivel) => nivel.value === value)?.value ?? "";
}

export function QuestionBlock({
  number,
  question,
  children,
}: {
  number: number;
  question: string;
  children: ReactNode;
}) {
  const questionId = useId();
  const issue = useContext(ProposalFieldErrors)[`Pregunta ${number}`];
  return (
    <div
      className="question-block"
      role="group"
      aria-labelledby={questionId}
      aria-invalid={Boolean(issue)}
      data-proposal-label={`Pregunta ${number}`}
      tabIndex={-1}
    >
      <div className="question-title">
        <span>{number}</span>
        <p id={questionId}>{question}</p>
      </div>
      {children}
      {issue && <p className="field-error-text">{issue}</p>}
    </div>
  );
}

export function YesNoRow({
  value,
  onChange,
  extra,
  disabled = false,
  label,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  extra?: ReactNode;
  disabled?: boolean;
  label?: string;
}) {
  const groupName = useId();
  const issue = useContext(ProposalFieldErrors)[label ?? ""];
  return (
    <div className="stack-md">
      <div
        className="choice-row"
        style={{ marginLeft: 0 }}
        role="group"
        aria-label={label}
        aria-invalid={Boolean(issue)}
        data-proposal-label={label}
        tabIndex={-1}
      >
        {(["No", "Sí"] as YesNo[]).map((opt) => (
          <label
            key={opt}
            className={`radio-choice${value === opt ? " selected" : ""}`}
          >
            <FormInput
              type="radio"
              name={groupName}
              disabled={disabled}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span className="radio-dot" />
            {opt}
          </label>
        ))}
      </div>
      {issue && <p className="field-error-text">{issue}</p>}
      {extra}
    </div>
  );
}

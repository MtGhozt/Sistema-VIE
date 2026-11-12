import {CollapsibleBlock} from "./CollapsibleBlock";
import {ProposalReadOnly} from "./ProposalFieldContext";
import {FORM_WIZARD_STEPS} from "../data/formWizard";
import type { ReactNode } from "react";
import type { Convocatoria } from "../api/convocatorias";
import type { FormWizardState } from "../data/formWizard";
import { toIan, applyIan } from "../data/formWizardAdapter";
import { FormWizardIan } from "./FormWizardIan";

export function FormWizardStepContent(props: {
  bloquearIdentificacion?: boolean;
  expandReadOnly?:boolean;
  documentos?: ReactNode;
  step: number;
  form: FormWizardState;
  patch: (p: Partial<FormWizardState>) => void;
  convocatorias: Convocatoria[];
  idConvocatoria: number | "";
  setIdConvocatoria: (v: number | "") => void;
  /** Vista expediente: mismos controles, sin mutaciones. */
  readOnly?: boolean;
}) {
  const readOnly = Boolean(props.readOnly);
  const patch = readOnly ? () => {} : props.patch;
  const setIdConvocatoria = readOnly ? () => {} : props.setIdConvocatoria;

  if (props.step === 16) {
    return (
      <div className="stack-md proposal-review-sections">
        <h3>Revisión antes del envío</h3>
        <p>Abra cada sección para revisar sus datos. Los controles se muestran en solo lectura.</p>
        {FORM_WIZARD_STEPS.slice(0,16).map((title,step)=><CollapsibleBlock key={title} title={`${String(step+1).padStart(2,'0')} · ${title}`} defaultOpen={false}>
          <FormWizardStepContent {...props} step={step} readOnly expandReadOnly/>
        </CollapsibleBlock>)}
      </div>
    );
  }

  return (
    <>
      <ProposalReadOnly.Provider value={readOnly}><fieldset
        className={readOnly ? "wizard-readonly" : undefined}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        aria-label={readOnly ? "Formulario en solo lectura" : undefined}
      >
        <FormWizardIan
          bloquearIdentificacion={props.bloquearIdentificacion}
          documentos={readOnly ? undefined : props.documentos}
          step={props.step}
          form={toIan(props.form)}
          patch={(partial) =>
            patch(applyIan(props.form, partial, props.step))
          }
          lineas={props.form.lineas}
          onIdentificacion={patch}
          convocatorias={props.convocatorias}
          idConvocatoria={props.idConvocatoria}
          setIdConvocatoria={setIdConvocatoria}
          readOnly={readOnly} expandReadOnly={props.expandReadOnly}
        />
      </fieldset></ProposalReadOnly.Provider>
      {/* Fuera del fieldset disabled para permitir descargas en solo lectura */}
      {readOnly && props.step === 15 && props.documentos}
    </>
  );
}

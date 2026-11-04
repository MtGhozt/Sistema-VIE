import { ComplementosFormulario } from "./ComplementosFormulario";
import type { ReactNode } from "react";
import type { Convocatoria } from "../api/convocatorias";
import type { FormWizardState } from "../data/formWizard";
import { toIan, applyIan } from "../data/formWizardAdapter";
import { FormWizardIan } from "./FormWizardIan";

export function FormWizardStepContent(props: {
  bloquearIdentificacion?: boolean;
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
      <div className="stack-md">
        <h3>Revisión antes del envío</h3>
        <p>{props.form.titulo}</p>
        <p>
          Modalidad: {props.form.modalidad}. Resumen: {props.form.resumen}
        </p>
        <p>Objetivo general: {props.form.objetivos}</p>
        <p>
          Equipo: {props.form.equipo.length} personas. Plan:{" "}
          {props.form.actividades.length} actividades.
        </p>
        <p>
          {readOnly
            ? "Consulta en solo lectura del expediente guardado."
            : "Revise también los datos normalizados y documentos en «Ver expediente guardado». El servidor valida los requisitos al enviar."}
        </p>
        <ComplementosFormulario detalles={props.form.detallesFormulario} />
      </div>
    );
  }

  return (
    <>
      <fieldset
        disabled={readOnly}
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
          readOnly={readOnly}
        />
      </fieldset>
      {/* Fuera del fieldset disabled para permitir descargas en solo lectura */}
      {readOnly && props.step === 15 && props.documentos}
    </>
  );
}

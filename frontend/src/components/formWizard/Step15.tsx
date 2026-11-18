import type { WizardStepBag } from "./wizardTypes";

export function Step15(ctx: WizardStepBag) {
  const {
    readOnly,
    documentos,
  } = ctx;
  return (
    <div className="stack-md">
      {documentos ??
        (readOnly ? (
          <p role="status">Los documentos del expediente aparecen a continuación.</p>
        ) : (
          <p>Guarde el borrador para adjuntar documentos.</p>
        ))}
      {!readOnly && (
        <p>
          PDF, DOCX y XLSX hasta 10 MiB. Imágenes y videos fuera del alcance de
          esta entrega.
        </p>
      )}
    </div>
  );
}

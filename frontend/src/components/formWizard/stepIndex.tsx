import type { ReactNode } from "react";
import type { WizardStepBag } from "./wizardTypes";
import { Step00 } from "./Step00";
import { Step01 } from "./Step01";
import { Step02 } from "./Step02";
import { Step03 } from "./Step03";
import { Step04 } from "./Step04";
import { Step05 } from "./Step05";
import { Step06 } from "./Step06";
import { Step07 } from "./Step07";
import { Step08 } from "./Step08";
import { Step09 } from "./Step09";
import { Step10 } from "./Step10";
import { Step11 } from "./Step11";
import { Step12 } from "./Step12";
import { Step13 } from "./Step13";
import { Step14 } from "./Step14";
import { Step15 } from "./Step15";

const STEPS: Record<number, (ctx: WizardStepBag) => ReactNode> = {
  0: Step00,
  1: Step01,
  2: Step02,
  3: Step03,
  4: Step04,
  5: Step05,
  6: Step06,
  7: Step07,
  8: Step08,
  9: Step09,
  10: Step10,
  11: Step11,
  12: Step12,
  13: Step13,
  14: Step14,
  15: Step15,
};

export function renderWizardStep(step: number, ctx: WizardStepBag): ReactNode {
  const render = STEPS[step];
  if (!render) {
    return (
      <div className="review-summary stack-md">
        <strong>{ctx.form.titulo}</strong>
        <p>
          Modalidad: {ctx.form.modalidad}. Escuela: {ctx.form.escuela}. Palabras
          clave: {ctx.form.palabras}.
        </p>
        <p>
          «Guardar y salir» deja el expediente en borrador. «Enviar a revisión»
          guarda los campos y anexos capturados y pasa la propuesta a la bandeja
          de evaluación.
        </p>
      </div>
    );
  }
  return render(ctx);
}



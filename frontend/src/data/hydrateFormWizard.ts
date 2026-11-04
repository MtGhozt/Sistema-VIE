import type { PropuestaDetalle } from "../api/propuestas";
import {
  DEFAULT_FORM_WIZARD_STATE,
  type FormWizardState,
  type GradoVinculo,
  type YesNo,
} from "./formWizard";

function asYesNo(value: string | undefined): YesNo {
  return value === "Sí" ? "Sí" : "No";
}

function asGradoVinculo(value: string | undefined): GradoVinculo {
  if (value === "Sí, parcial" || value === "Sí, totalmente" || value === "No") {
    return value;
  }
  return "No";
}

/** Misma hidratación que `PropuestaNuevaPage` al editar (`?edit=`). */
export function hydrateFormWizardFromDetalle(
  d: PropuestaDetalle,
): FormWizardState {
  const preguntas = d.preguntasGenerales ?? [];
  const byNum = (n: number) => preguntas.find((q) => q.numero === n);
  const q2Detalle = byNum(2)?.detalle ?? "";

  return {
    ...DEFAULT_FORM_WIZARD_STATE,
    trlActual: d.trlEsperado ?? d.trlActual,
    trlEsperado: d.trlEsperado,
    lineas: d.lineas ?? [],
    objetivosRegistrados: d.objetivosEspecificos ?? [],
    detallesFormulario: d.detallesFormulario ?? {},
    titulo: d.titulo,
    escuela: d.escuelaNombre,
    modalidad: d.modalidadLabel || DEFAULT_FORM_WIZARD_STATE.modalidad,
    aspectosEticos: d.aspectosEticos ?? {
      humanos: false,
      biodiversidad: false,
      animales: false,
      indigenas: false,
      exencion: "",
    },
    permisos: d.permisos ?? [],
    compromisos: d.compromisos ?? [],
    actividades: d.actividades ?? [],
    equipo: d.equipo ?? [],
    presupuesto: d.presupuesto ?? [],
    fuentes: d.fuentes ?? [],
    declaracion: d.declaracion,
    resguardoRepositorio: d.resguardoRepositorio,
    resguardoTecnico: d.resguardoTecnico,
    resumen: d.resumen ?? "",
    estadoArte: d.estadoArte ?? "",
    referencias: d.referencias ?? "",
    hojaRuta: d.hojaRuta ?? "",
    divulgacion: d.divulgacion ?? "",
    inicio: d.fechaInicio?.slice(0, 10) ?? "",
    fin: d.fechaFin?.slice(0, 10) ?? "",
    keywordsEn: d.keywordsEn.join(", "),
    q1: asYesNo(byNum(1)?.respuesta),
    q2: asYesNo(byNum(2)?.respuesta),
    q2Proyecto: q2Detalle.split("\n")[0] ?? "",
    q2Relacion: q2Detalle.split("\n").slice(1).join("\n"),
    q3: asYesNo(byNum(3)?.respuesta),
    q3Detalle: byNum(3)?.detalle ?? "",
    q4: asYesNo(byNum(4)?.respuesta),
    q5: asYesNo(byNum(5)?.respuesta),
    q6: asGradoVinculo(byNum(6)?.respuesta),
    q7: asYesNo(byNum(7)?.respuesta),
    q8: d.requiereDictamenPi ? "Sí" : "No",
    abstract: d.abstractEn ?? "",
    palabras: d.keywordsEs.join(", "),
    problema: d.problema ?? "",
    objetivos: d.objetivoGeneral ?? "",
    metodologia: d.metodologia ?? "",
  };
}

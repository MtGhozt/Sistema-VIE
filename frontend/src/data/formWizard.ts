import type { ParticipanteInput } from "../api/propuestas";
/** 17 pasos del formulario VIE (HTML prototipo, `const At`). */
export const FORM_WIZARD_STEPS = [
  "Datos y preguntas generales",
  "Resumen y palabras clave",
  "Equipo de investigación",
  "Problema y objetivos",
  "Estado del arte",
  "Metodología",
  "Plan de acción y riesgos",
  "Presupuesto y financiamiento",
  "Compromisos de productos",
  "Resguardo de productos",
  "Divulgación y socialización",
  "Aspectos éticos",
  "Hoja de ruta",
  "Referencias",
  "Declaración jurada",
  "Documentación",
  "Revisión y envío",
] as const;

export type YesNo = "No" | "Sí";
export type GradoVinculo = "No" | "Sí, parcial" | "Sí, totalmente";

/** Recurso gráfico del paso Documentación (rúbrica: alt text editable). */
export type GraphicResource = {
  id: string;
  tipo: "imagen" | "video";
  nombreArchivo: string;
  /** Texto alternativo / descripción accesible (editable). */
  altText: string;
};

/** Longitud mínima sugerida para una descripción útil (rúbrica a11y). */
export const ALT_TEXT_MIN_CHARS = 40;

export type FormWizardState = {
  equipo: ParticipanteInput[];
  titulo: string;
  modalidad: string;
  inicio: string;
  fin: string;
  escuela: string;
  estadoArte: string;
  hojaRuta: string;
  divulgacion: string;
  keywordsEn: string;
  resumen: string;
  palabras: string;
  abstract: string;
  q1: YesNo;
  q2: YesNo;
  q2Proyecto: string;
  q2Relacion: string;
  q3: YesNo;
  q3Detalle: string;
  q4: YesNo;
  q5: YesNo;
  q6: GradoVinculo;
  q7: YesNo;
  q8: YesNo;
  problema: string;
  objetivos: string;
  metodologia: string;
  referencias: string;
  declaracion: boolean;
  /** Imágenes y videos con texto alternativo editable. */
  recursosGraficos: GraphicResource[];
};

export const DEFAULT_FORM_WIZARD_STATE: FormWizardState = {
  equipo: [],
  titulo:
    "Sistema inteligente para monitoreo de calidad del agua mediante sensores IoT",
  modalidad: "Desarrollo tecnológico",
  inicio: "2027-01-15",
  fin: "2028-06-30",
  escuela: "Escuela de Ingeniería en Computación",
  estadoArte: "",
  hojaRuta: "",
  divulgacion: "",
  keywordsEn: "",
  resumen:
    "Diseño y validación de una plataforma de monitoreo de calidad del agua basada en sensores IoT, analítica de datos y visualización web para apoyar la toma de decisiones en comunidades rurales.",
  palabras: "IoT, calidad del agua, sensores, analítica, monitoreo ambiental",
  abstract:
    "Design and validation of an IoT-based water-quality monitoring platform combining low-cost sensors, data analytics and web visualization to support decision-making in rural communities.",
  q1: "No",
  q2: "Sí",
  q2Proyecto: "Sistema piloto de monitoreo ambiental VIE-2025-021",
  q2Relacion: "Nueva etapa y ampliación de línea de investigación",
  q3: "Sí",
  q3Detalle:
    "ODS 6 Agua limpia y saneamiento; prioridades nacionales de adaptación climática.",
  q4: "No",
  q5: "No",
  q6: "No",
  q7: "No",
  q8: "Sí",
  problema:
    "Las comunidades rurales carecen de monitoreo continuo de calidad del agua con bajo costo operativo.",
  objetivos:
    "OE1: Diseñar arquitectura IoT. OE2: Validar prototipo en campo piloto.",
  metodologia:
    "Diseño experimental, prototipado iterativo, validación con datos de campo y analítica en la nube.",
  referencias:
    "[1] WHO, 2023. Guidelines for drinking-water quality.\n[2] Sensors, 2024. Edge analytics for environmental monitoring.",
  declaracion: true,
  recursosGraficos: [
    {
      id: "demo-img-1",
      tipo: "imagen",
      nombreArchivo: "diagrama-arquitectura-iot.png",
      altText:
        "Diagrama de arquitectura IoT con sensores de calidad del agua, gateway LoRaWAN y panel web de analítica para comunidades rurales.",
    },
  ],
};

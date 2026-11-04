import type { ParticipanteInput, PresupuestoInput, FuenteInput, AspectosEticos, PermisoInput, ActividadInput, CompromisoInput } from "../api/propuestas";
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
  objetivosRegistrados:{id:number;numero:number;descripcion:string}[];
  detallesFormulario:Record<string,Record<string,unknown>>;
  aspectosEticos: AspectosEticos;
  permisos: PermisoInput[];
  compromisos: CompromisoInput[];
  actividades: ActividadInput[];
  equipo: ParticipanteInput[];
  presupuesto: PresupuestoInput[];
  fuentes: FuenteInput[];
  trlActual:number|null;trlEsperado:number|null;lineas:number[];
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
  resguardoRepositorio: boolean;
  resguardoTecnico: boolean;
  /** Imágenes y videos con texto alternativo editable. */
  recursosGraficos: GraphicResource[];
};

export const DEFAULT_FORM_WIZARD_STATE: FormWizardState = {
  objetivosRegistrados:[],
  detallesFormulario:{},
  trlActual:null,trlEsperado:null,lineas:[],
  equipo: [], actividades: [], compromisos: [], presupuesto: [], fuentes: [], permisos: [],
  aspectosEticos: { humanos:false, biodiversidad:false, animales:false, indigenas:false, exencion:"" },
  titulo:"", modalidad:"Investigación básica", inicio:"", fin:"", escuela:"",
  resumen:"", palabras:"", abstract:"", keywordsEn:"", estadoArte:"", hojaRuta:"", divulgacion:"",
  q1:"No", q2:"No", q2Proyecto:"", q2Relacion:"", q3:"No", q3Detalle:"", q4:"No", q5:"No", q6:"No", q7:"No", q8:"No",
  problema:"", objetivos:"", metodologia:"", referencias:"", declaracion:false,
  resguardoRepositorio:false, resguardoTecnico:false, recursosGraficos:[],
};

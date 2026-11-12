import type { DemoProposal } from "../data/demo";
import { apiJson } from "./client";

export type CompromisoInput = { id?:number; ambito:string; codigo:string; descripcion:string; cantidad:number; dictamen:string|null };
export type ActividadInput = { id?:number; objetivo:string; actividad:string; resultado:string; responsabilidad:string; inicio:number; duracion:number; participantes:(number|string)[]; asignaciones?:{idParticipante:number|string;responsabilidad:string}[]; riesgos:{riesgo:string;mitigacion:string;responsable:string}[] };
export type AspectosEticos = { humanos: boolean; biodiversidad: boolean; animales: boolean; indigenas: boolean; exencion: string };
export type PermisoInput = { ente: string; detalle: string; estado: string };
export type PresupuestoInput = { anio: number; operativo: number; duraderos: number };
export type FuenteInput = { tipo: string; anio: number; monto: number; oficio: string | null };
export type ParticipanteInput = {
  clienteId?:string; id?: number; idUsuario?: number | null; tipo: "funcionario_tec" | "externo";
  nombre: string; orcid: string | null; instancia: string | null; rol: string | null; periodo: string | null;
  titularCons?:string|null;
  iniciales?:string;
  horas: { tipo: string; cantidad: number }[];
};

export type Propuesta = {
  id: number;
  codigo: string;
  idConvocatoria: number;
  convocatoriaNombre: string;
  idCoordinador: number;
  coordinadorNombre: string;
  idEscuela: number;
  escuelaNombre: string;
  titulo: string;
  modalidad: string;
  modalidadLabel: string;
  resumen: string | null;
  abstractEn: string | null;
  problema: string | null;
  objetivoGeneral: string | null;
  metodologia: string | null;
  estadoArte: string | null;
  referencias: string | null;
  hojaRuta: string | null;
  divulgacion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  trlActual:number|null;trlEsperado:number|null;lineas:number[];lineasNombres:string[];
  requiereDictamenPi: boolean;
  piAcreditada: boolean;
  declaracion: boolean;
  resguardoRepositorio: boolean;
  resguardoTecnico: boolean;
  estadoActual: string;
  etapaFlujo: number;
  fechaEnvio: string | null;
};

export type PropuestaDetalle = Propuesta & Partial<Pick<DemoProposal, "teamTec" | "teamExternal" | "presupuestoAnual" | "productos" | "observaciones" | "timeline" | "documentos">> & {
  objetivosEspecificos?:{id:number;numero:number;descripcion:string}[];
  detallesFormulario?:Record<string,Record<string,unknown>>;
  subsanacion?: {instancia:string;motivo:string;secciones:string[];respuesta?:string|null;campos_atendidos:string[]}|null;
  aspectosEticos?: AspectosEticos | null;
  permisos?: PermisoInput[];
  compromisos?: CompromisoInput[];
  actividades?: ActividadInput[];
  equipo?: ParticipanteInput[];
  presupuesto?: PresupuestoInput[];
  fuentes?: FuenteInput[];
  preguntasGenerales?: { numero: number; respuesta: string; detalle: string | null }[];
  keywordsEs: string[];
  keywordsEn: string[];
};

export type PropuestaInput = {
  respuestaSubsanacion?:string;
  titulo: string;
  idConvocatoria: number;
  modalidad: string;
  estadoArte?: string;
  referencias?: string;
  hojaRuta?: string;
  divulgacion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  trlActual?:number|null;trlEsperado?:number|null;lineas?:number[];
  requiereDictamenPi?: boolean;
  declaracion?: boolean;
  resguardoRepositorio?: boolean;
  resguardoTecnico?: boolean;
  aspectosEticos?: AspectosEticos | null;
  permisos?: PermisoInput[];
  compromisos?: CompromisoInput[];
  actividades?: ActividadInput[];
  equipo?: ParticipanteInput[];
  presupuesto?: PresupuestoInput[];
  fuentes?: FuenteInput[];
  preguntasGenerales?: { numero: number; respuesta: string; detalle: string | null }[];
  resumen?: string;
  abstractEn?: string;
  problema?: string;
  objetivoGeneral?: string;
  metodologia?: string;
  keywordsEs?: string;
  keywordsEn?: string;
};

export function fetchPropuestas() {
  return apiJson<Propuesta[]>("/api/propuestas");
}

export function fetchPropuesta(id: number) {
  return apiJson<PropuestaDetalle>(`/api/propuestas/${id}`);
}

export function createPropuesta(body: PropuestaInput) {
  return apiJson<PropuestaDetalle>("/api/propuestas", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchPropuesta(id: number, body: Partial<PropuestaInput>) {
  return apiJson<PropuestaDetalle>(`/api/propuestas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function enviarPropuesta(id: number, respuesta?: string) {
  return apiJson<PropuestaDetalle>(`/api/propuestas/${id}/enviar`, {
    method: "POST",
    body: JSON.stringify({respuesta}),
  });
}

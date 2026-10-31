import type { DemoProposal } from "../data/demo";
import { apiJson } from "./client";

export type ParticipanteInput = {
  id?: number; idUsuario?: number | null; tipo: "funcionario_tec" | "externo";
  nombre: string; orcid: string | null; instancia: string | null; rol: string | null; periodo: string | null;
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
  requiereDictamenPi: boolean;
  declaracion: boolean;
  resguardoRepositorio: boolean;
  resguardoTecnico: boolean;
  estadoActual: string;
  etapaFlujo: number;
  fechaEnvio: string | null;
};

export type PropuestaDetalle = Propuesta & Partial<Pick<DemoProposal, "teamTec" | "teamExternal" | "presupuestoAnual" | "productos" | "observaciones" | "timeline" | "documentos">> & {
  equipo?: ParticipanteInput[];
  preguntasGenerales?: { numero: number; respuesta: string; detalle: string | null }[];
  keywordsEs: string[];
  keywordsEn: string[];
};

export type PropuestaInput = {
  titulo: string;
  idConvocatoria: number;
  modalidad: string;
  estadoArte?: string;
  referencias?: string;
  hojaRuta?: string;
  divulgacion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  requiereDictamenPi?: boolean;
  declaracion?: boolean;
  resguardoRepositorio?: boolean;
  resguardoTecnico?: boolean;
  equipo?: ParticipanteInput[];
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

export function enviarPropuesta(id: number) {
  return apiJson<PropuestaDetalle>(`/api/propuestas/${id}/enviar`, {
    method: "POST",
  });
}

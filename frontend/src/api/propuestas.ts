import { apiJson } from "./client";

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
  estadoActual: string;
  etapaFlujo: number;
  fechaEnvio: string | null;
};

export type PropuestaDetalle = Propuesta & {
  keywordsEs: string[];
  keywordsEn: string[];
};

export type PropuestaInput = {
  titulo: string;
  idConvocatoria: number;
  modalidad: string;
  resumen?: string;
  abstractEn?: string;
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

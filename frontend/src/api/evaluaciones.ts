import type {RubricSection} from "../data/evaluationRubrics";
import { apiJson } from "./client";

export type EvaluacionBandejaItem = {
  id: number;
  codigo: string;
  titulo: string;
  modalidad: string;
  modalidadLabel: string;
  estadoActual: string;
  estadoLabel: string;
  etapaFlujo: number;
  fechaEnvio: string | null;
  resumen: string | null;
  abstractEn: string | null;
  piRequired: boolean;
  piEstado: string|null;
  escuela: string;
  investigadora: string;
  coordinadorCorreo: string;
  fechaResolucion: string | null;
  convocatoria: string;
  oficioPI: string | null;
  oficioComite: string | null;
  oficioAval: string | null;
  resolucion: string | null;
  notificada: boolean;
  vieChecks: Record<string,boolean>;
  justificacionAval: string | null;
  evaluacionComite: { average: number } | null;
};

export type EvaluacionBandejaResponse = {
  role: string;
  items: EvaluacionBandejaItem[];
  total: number;
};

export type EvaluacionAccionResponse = {
  message: string;
  action: string;
  propuesta: EvaluacionBandejaItem | null;
};

export function fetchEvaluacionBandeja(view?: string) {
  return apiJson<EvaluacionBandejaResponse>(`/api/evaluaciones/bandeja${view ? `?vista=${encodeURIComponent(view)}` : ""}`);
}

export function postEvaluacionAccion(
  idPropuesta: number,
  action: string,
  payload?: unknown,
) {
  return apiJson<EvaluacionAccionResponse>(
    `/api/evaluaciones/propuestas/${idPropuesta}/acciones`,
    {
      method: "POST",
      body: JSON.stringify({ action, payload }),
    },
  );
}

export function fetchSavedRubric(id: number, instancia: "cie" | "comite") {
  return apiJson<{ scores: Record<string, { score:number; reason:string }>; productosVerificados:boolean;productos:{minAcademicos:number;minPI:number;academicos:number;activosPI:number;cumple:boolean};ciclo:number;asignado:boolean;sections:RubricSection[];version:string;estado:string|null;productosCumplen:boolean }>(`/api/evaluaciones/propuestas/${id}/rubrica?instancia=${instancia}`);
}

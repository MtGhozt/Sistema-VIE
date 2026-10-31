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
  escuela: string;
  investigadora: string;
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
  return apiJson<{ scores: Record<string, { score:number; reason:string }> }>(`/api/evaluaciones/propuestas/${id}/rubrica?instancia=${instancia}`);
}

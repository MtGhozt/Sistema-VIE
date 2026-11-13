import type {RubricSection} from "../data/evaluationRubrics";
import { apiJson } from "./client";

export type EvaluacionBandejaItem = {
  comiteEnviado?:boolean;
  fechaDictamenComite?:string|null;
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
  comiteEnviadas?:number;
  resumenConsejo?:{recibidos:number;pendientes:number;en_consejo:number;enviados:number};
  pendientesConsejo?:EvaluacionBandejaItem[];
  resumenEvaluador?:{asignadas:number;pendientes:number;borradores:number;entregadas:number};
  resumenComite?:{pendientes:number;reenviadas:number;enviadas:number;devueltas:number};
  role: string;
  items: EvaluacionBandejaItem[];
  total: number;
};

export type EvaluacionAccionResponse = {
  message: string;
  action: string;
  propuesta: EvaluacionBandejaItem | null;
};

export type EvaluacionIACriterion = {
  id: string;
  label: string;
  section: string;
  weight: number;
  required: boolean;
  puntaje: number;
  justificacion: string;
  evidencia: string | null;
  confianza: "alta" | "media" | "baja" | null;
};

export type EvaluacionIAResult = {
  resumen: string;
  criterios: EvaluacionIACriterion[];
  alertas: string[];
  completa: boolean;
};

export type EvaluacionIA = {
  id: number;
  modelo: string;
  proveedor: string;
  fechaGeneracion: string;
  puntajeTotal: number;
  recomendacion: "RECOMIENDA" | "NO RECOMIENDA";
  resumen: string;
  resultado: EvaluacionIAResult;
  generadoPor: string;
};

export function fetchEvaluacionIA(idPropuesta: number) {
  return apiJson<{ evaluacion: EvaluacionIA | null }>(
    `/api/evaluaciones/propuestas/${idPropuesta}/ia`,
  );
}

export function postEvaluacionIA(idPropuesta: number) {
  return apiJson<{ evaluacion: EvaluacionIA }>(
    `/api/evaluaciones/propuestas/${idPropuesta}/ia`,
    { method: "POST" },
  );
}

export function fetchEvaluacionBandeja(view?: string, propuesta?:string|null,comite?:string|null,evaluacion?:string|null,consejo?:string|null) {
  const params=new URLSearchParams();if(view)params.set("vista",view);if(propuesta)params.set("propuesta",propuesta);if(comite)params.set("comite",comite);if(evaluacion)params.set("evaluacion",evaluacion);if(consejo)params.set("consejo",consejo);
  return apiJson<EvaluacionBandejaResponse>(`/api/evaluaciones/bandeja${params.size?"?"+params.toString():""}`);
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

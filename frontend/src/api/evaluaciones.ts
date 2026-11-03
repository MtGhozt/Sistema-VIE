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

export type AiRubricSuggestionResponse = {
  rubric: {
    code: string;
    name: string;
    criteria: {
      id: string;
      number: number;
      section: string;
      name: string;
      weight: number;
      required: boolean;
      levels: { score: 0 | 6 | 8 | 10; description: string }[];
    }[];
    productsPolicy: string;
  };
  suggestion: {
    criteria: {
      id: string;
      score: 0 | 6 | 8 | 10;
      justification: string;
      evidence: string;
      missingInformation: string;
    }[];
    productsCompliance: {
      status: "cumple" | "no_cumple" | "indeterminado";
      justification: string;
      evidence: string;
    };
    summary: string;
    model: string;
  };
  weightedScore: number;
  recommendation: "RECOMIENDA" | "NO RECOMIENDA";
};

export type OfficialRubricResponse = Pick<
  AiRubricSuggestionResponse["rubric"],
  "code" | "name" | "criteria" | "productsPolicy"
>;

export type SavedIndividualEvaluation = {
  scores: Record<string, { score: number; reason: string }>;
  aiScores: Record<string, number>;
  productsCompliance: "cumple" | "no_cumple" | "indeterminado";
  productsJustification: string;
  aiSummary: string;
  aiModel: string;
  aiSuggestions: AiRubricSuggestionResponse["suggestion"]["criteria"];
  aiProductsCompliance: AiRubricSuggestionResponse["suggestion"]["productsCompliance"];
};

export function fetchEvaluacionBandeja() {
  return apiJson<EvaluacionBandejaResponse>("/api/evaluaciones/bandeja");
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

export function fetchAiRubricSuggestion(idPropuesta: number) {
  return apiJson<AiRubricSuggestionResponse>(
    `/api/evaluaciones/propuestas/${idPropuesta}/sugerencia-ia`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function fetchOfficialRubric(idPropuesta: number) {
  return apiJson<{ rubric: OfficialRubricResponse }>(
    `/api/evaluaciones/propuestas/${idPropuesta}/rubrica`,
  );
}

export function fetchSavedIndividualEvaluation(idPropuesta: number) {
  return apiJson<{ evaluation: SavedIndividualEvaluation | null }>(
    `/api/evaluaciones/propuestas/${idPropuesta}/evaluacion-individual`,
  );
}

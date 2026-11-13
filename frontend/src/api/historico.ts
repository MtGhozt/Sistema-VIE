import { apiJson } from "./client";

export type HistoricoItem = {
  id: number;
  estadoEvaluacion?:string;
  estadoPi?:string;estadoPiLabel?:string;
  codigo: string;
  titulo: string;
  modalidad: string;
  modalidadLabel: string;
  estado: string;
  estadoLabel: string;
  etapaFlujo: number;
  fechaEnvio: string | null;
  fechaResolucion: string | null;
  escuelaCodigo: string;
  escuela: string;
  investigadora: string;
  lineas: string[];
  documentos: { tipo: string; numero: string }[];
};

export type HistoricoFiltros = {
  escuela: string;
  investigadora: string;
  linea: string;
  estado: string;
  anio: string;
  pi:string;
  comite:string;
  evaluacion:string;
  consejo:string;
};

export type HistoricoOpciones = {
  escuelas: { codigo: string; nombre: string }[];
  lineas: string[];
  estados: { valor: string; label: string }[];
  anios: number[];
};

export type HistoricoRespuesta = {
  items: HistoricoItem[];
  total: number;
  filtrosAplicados: HistoricoFiltros;
  opciones: HistoricoOpciones;
};

export const EMPTY_HISTORICO_FILTROS: HistoricoFiltros = {
  escuela: "",
  investigadora: "",
  linea: "",
  estado: "",
  anio: "",
  pi:"",
  comite:"",
  evaluacion:"",
  consejo:"",
};

/** Listado del histórico con filtros combinables (CU5). */
export function fetchHistorico(filtros: Partial<HistoricoFiltros> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filtros)) {
    if (value) params.set(key, String(value));
  }
  const qs = params.toString();
  return apiJson<HistoricoRespuesta>(
    `/api/historico/propuestas${qs ? `?${qs}` : ""}`,
  );
}

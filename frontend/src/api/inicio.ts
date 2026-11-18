import { apiJson } from "./client";

export type InicioTendencias = {
  role: string;
  windowDays: number;
  envios: number;
  porEstadoNuevo: Record<string, number>;
  porEtapaEvento: Record<string, number>;
  convocatoriasPublicadas: number;
  convocatoriasCerradasEnVentana: number;
};

export function fetchInicioTendencias(opts?: {
  view?: string;
  days?: number;
}) {
  const q = new URLSearchParams();
  if (opts?.view) q.set("view", opts.view);
  if (opts?.days) q.set("days", String(opts.days));
  const suffix = q.toString() ? `?${q}` : "";
  return apiJson<InicioTendencias>(`/api/inicio/tendencias${suffix}`);
}

import { API_BASE, ApiError, apiJson, getDemoAuth } from "./client";

export type PerfilOversight = {
  propuestasCoordinadas: number;
  participaciones: number;
  recientes: { codigo: string; titulo: string; estado: string; fecha: string | null }[];
};

export type Perfil = {
  id: number;
  correo: string;
  nombre: string;
  cedula: string | null;
  orcid: string | null;
  escuelaId: number | null;
  escuela: string | null;
  fotoUrl: string | null;
  preferencias: Record<string, unknown>;
  activo: boolean;
  fechaRegistro: string;
  roles: { codigo: string; nombre: string }[];
  oversight: PerfilOversight;
};

export type PersonaSugerida = {
  contactoId?: number;
  idUsuario?: number | null;
  nombre: string;
  orcid?: string | null;
  cedula?: string | null;
  instancia?: string | null;
  roles?: string[];
  etiqueta: string;
};

export type PersonasSugeridas = {
  usted: PersonaSugerida | null;
  pineados: PersonaSugerida[];
  anteriores: PersonaSugerida[];
  catalogo: PersonaSugerida[];
};

export type EstadisticasResponse = {
  role: string;
  title: string;
  kpis: { label: string; value: number }[];
  charts: {
    id: string;
    title: string;
    type: "bar" | "pie" | "line" | "donut" | "column";
    series: { label: string; value: number }[];
  }[];
};

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const auth = getDemoAuth();
  if (auth) {
    headers.set("X-Demo-User-Id", String(auth.userId));
    headers.set("X-Demo-Role", auth.role);
  }
  return headers;
}

export function fetchPerfil() {
  return apiJson<Perfil>("/api/perfil");
}

export function patchPerfil(body: {
  nombre?: string;
  cedula?: string | null;
  orcid?: string | null;
  preferencias?: Record<string, unknown>;
}) {
  return apiJson<{
    ok: boolean;
    nombre: string;
    cedula: string | null;
    orcid: string | null;
    preferencias: Record<string, unknown>;
  }>("/api/perfil", { method: "PATCH", body: JSON.stringify(body) });
}

export async function uploadPerfilFoto(file: Blob, contentType = file.type || "image/jpeg") {
  const res = await fetch(`${API_BASE}/api/perfil/foto`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": contentType }),
    body: file,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? "No se pudo subir la foto", res.status);
  }
  return (await res.json()) as { fotoUrl: string };
}

export function deletePerfilFoto() {
  return apiJson<void>("/api/perfil/foto", { method: "DELETE" });
}

export async function fetchPerfilFotoBlob(userId: number): Promise<string | null> {
  const res = await fetch(`${API_BASE}/api/perfil/foto/${userId}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError("No se pudo cargar la foto", res.status);
  return URL.createObjectURL(await res.blob());
}

export function fetchPersonasSugeridas() {
  return apiJson<PersonasSugeridas>("/api/personas/sugeridas");
}

export function pinPersona(body: {
  nombre: string;
  orcid?: string | null;
  instancia?: string | null;
  idUsuario?: number | null;
}) {
  return apiJson<{ id: number }>("/api/personas/pineados", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function unpinPersona(id: number) {
  return apiJson<void>(`/api/personas/pineados/${id}`, { method: "DELETE" });
}

export function fetchEstadisticas(viewRole?: string) {
  const q = viewRole ? `?view=${encodeURIComponent(viewRole)}` : "";
  return apiJson<EstadisticasResponse>(`/api/estadisticas${q}`);
}

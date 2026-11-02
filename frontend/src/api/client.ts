/** Base URL vacía = rutas relativas `/api/...` (proxy Vite en dev). */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type DemoAuthHeaders = {
  userId: number;
  role: string;
};

let demoAuth: DemoAuthHeaders | null = null;

/** Lo llama AuthProvider cuando hay sesión. */
export function setDemoAuth(auth: DemoAuthHeaders | null) {
  demoAuth = auth;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (demoAuth) {
    headers.set("X-Demo-User-Id", String(demoAuth.userId));
    headers.set("X-Demo-Role", demoAuth.role);
  }

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...init, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : res.statusText || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

export async function downloadFile(path:string,name:string){
 const headers=new Headers();if(demoAuth){headers.set('X-Demo-User-Id',String(demoAuth.userId));headers.set('X-Demo-Role',demoAuth.role);}
 const response=await fetch(API_BASE+path,{headers});
 if(!response.ok){const data=await response.json().catch(()=>null);throw new ApiError(data?.error??'No se pudo descargar',response.status);}
 const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}

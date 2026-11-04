import { apiJson } from "./client";

export type ConvocatoriaEstado =
  | "borrador"
  | "activa"
  | "cerrada"
  | "finalizada";

export type Convocatoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
  fechaApertura: string;
  fechaCierre: string;
  presupuestoEstimado: number | null;
  estado: ConvocatoriaEstado | string;
  idPublicadaPor: number | null;
  fechaPublicacion: string | null;
  propuestasCount: number;
};

export type ConvocatoriaHito = {
  id: number;
  idConvocatoria: number;
  nombre: string;
  responsable: string;
  fechaInicio: string;
  fechaFin: string;
  orden: number;
};

export type ConvocatoriaDetalle = Convocatoria & {
  hitos: ConvocatoriaHito[];
};

export type CreateConvocatoriaInput = {
  nombre: string;
  descripcion?: string | null;
  fechaApertura: string;
  fechaCierre: string;
  presupuestoEstimado?: number | null;
  estado?: ConvocatoriaEstado;
  hitos?: {
    id?: number;
    nombre: string;
    responsable?: string;
    fechaInicio: string;
    fechaFin: string;
  }[];
};

export function fetchConvocatorias() {
  return apiJson<Convocatoria[]>("/api/convocatorias");
}

export function fetchConvocatoria(id: number) {
  return apiJson<ConvocatoriaDetalle>(`/api/convocatorias/${id}`);
}

export function createConvocatoria(body: CreateConvocatoriaInput) {
  return apiJson<Convocatoria>("/api/convocatorias", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchConvocatoria(
  id: number,
  body: Partial<CreateConvocatoriaInput> & { estado?: ConvocatoriaEstado },
) {
  return apiJson<Convocatoria>(`/api/convocatorias/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export type ConvocatoriaHitoInput={nombre:string;responsable:string;fechaInicio:string;fechaFin:string};
export function deleteConvocatoria(id:number){return apiJson<void>(`/api/convocatorias/${id}`,{method:"DELETE"});}

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
  problema: string | null;
  objetivoGeneral: string | null;
  estadoArte: string | null;
  metodologia: string | null;
  estadoActual: string;
  etapaFlujo: number;
  fechaEnvio: string | null;
};

export type PropuestaDetalle = Propuesta & {
  keywordsEs: string[];
  keywordsEn: string[];
  preguntasGenerales: PreguntaGeneral[];
  participantes: PropuestaParticipante[];
  objetivosEspecificos: ObjetivoEspecifico[];
  planAccion: PlanAccionActividad[];
  presupuestoAnual: PresupuestoAnual[];
  financiamiento: Financiamiento[];
  compromisosProductos: PropuestaProducto[];
  divulgacion: {
    divulgacionCientifica: string;
    canalesInstitucionales: string;
    eventosSocializacion: string;
    mediosMasivos: string;
  } | null;
  aspectosEticos: {
    seresHumanos: "Sí" | "No" | "";
    biodiversidad: "Sí" | "No" | "";
    animales: "Sí" | "No" | "";
    territoriosIndigenas: "Sí" | "No" | "";
    consultaConsentimiento: string;
    exencionJustificacion: string;
    entesRegulatorios: string[];
    otroEnte: string;
    detalleAval: string;
  } | null;
  hojaRuta: {
    lineaInvestigacion: string;
    objetivoEstrategico: string;
    duracionTotal: string;
    fases: string;
    productosIntermedios: string;
  } | null;
  declaracionJurada: {
    acepta: boolean;
    nombreCompleto: string;
    cedula: string;
    firma: string;
  } | null;
  resguardoProductos: {
    depositoRepositorio: "Sí" | "No" | "";
    desarrollaSoftwareBaseDatos: "Sí" | "No" | "";
    entregaRespaldoSoftware: "Sí" | "No" | "";
  } | null;
};

export type PresupuestoAnual = {
  anio: number;
  operativo: number;
  duraderos: number;
  total: number;
};

export type Financiamiento = {
  tipo: "externo" | "contrapartida" | "cofinanciamiento";
  anio1: number;
  anio2: number;
  anio3: number;
  oficio: string;
};

export type PresupuestoAnualInput = {
  anio: number;
  operativo: number;
  duraderos: number;
};

export type FinanciamientoInput = Financiamiento;

export type PropuestaProducto = {
  id: number;
  tipo: "academico" | "activo_pi" | "adicional";
  codigoOpcion: string;
  descripcion: string;
  cantidad: number;
  objetivoId: number | null;
  objetivoNumero: number | null;
  dictamenConsecutivo: string;
};

export type PropuestaProductoInput =
  | {
      tipo: "academico";
      codigoOpcion: string;
      cantidad: number;
      objetivoNumero: number;
    }
  | {
      tipo: "activo_pi";
      codigoOpcion: string;
      cantidad: number;
      dictamenConsecutivo: string;
    }
  | {
      tipo: "adicional";
      codigoOpcion: string;
      cantidad: 1;
      descripcion: string;
    };

export type PlanAccionParticipante = {
  idParticipante: number | null;
  nombre: string;
  iniciales: string;
  responsabilidad: string;
};

export type PlanAccionRiesgo = {
  riesgo: string;
  mitigacion: string;
  responsable: string;
};

export type PlanAccionActividad = {
  id: number;
  objetivoId: number;
  objetivoNumero: number;
  actividad: string;
  resultadoEsperado: string;
  participantes: PlanAccionParticipante[];
  riesgos: PlanAccionRiesgo[];
  mesInicio: number;
  duracionMeses: number;
};

export type PlanAccionActividadInput = {
  objetivoNumero: number;
  actividad: string;
  resultadoEsperado: string;
  participantes: { iniciales: string; responsabilidad: string }[];
  riesgos: PlanAccionRiesgo[];
  mesInicio: number;
  duracionMeses: number;
};

export type ObjetivoEspecifico = {
  id: number;
  numero: number;
  descripcion: string;
};

export type ObjetivoEspecificoInput = {
  id?: number;
  descripcion: string;
};

export type PreguntaGeneral = {
  numero: number;
  codigo: string;
  respuesta: string;
  detalle: string | null;
};

export type TeamHour = {
  tipo: string;
  cantidad: number;
};

export type TeamTecMember = {
  nombre: string;
  iniciales: string;
  orcid: string;
  instancia: string;
  rol: string;
  horas: TeamHour[];
  periodo: string;
};

export type TeamExternalMember = {
  nombre: string;
  iniciales: string;
  orcid: string;
  institucion: string;
};

export type PropuestaParticipante =
  | ({ id: number; tipo: "funcionario_tec" } & TeamTecMember)
  | ({ id: number; tipo: "colaborador_externo" } & TeamExternalMember);

export type PropuestaParticipanteInput =
  | ({ id?: number; tipo: "funcionario_tec" } & TeamTecMember)
  | ({ id?: number; tipo: "colaborador_externo" } & TeamExternalMember);

export type PropuestaInput = {
  titulo: string;
  idConvocatoria: number;
  modalidad: string;
  resumen?: string;
  abstractEn?: string;
  problema?: string;
  objetivoGeneral?: string;
  estadoArte?: string;
  objetivosEspecificos?: ObjetivoEspecificoInput[];
  metodologia?: string;
  keywordsEs?: string;
  keywordsEn?: string;
  preguntasGenerales?: PreguntaGeneral[];
  participantes?: PropuestaParticipanteInput[];
  planAccion?: PlanAccionActividadInput[];
  presupuestoAnual?: PresupuestoAnualInput[];
  financiamiento?: FinanciamientoInput[];
  compromisosProductos?: PropuestaProductoInput[];
  divulgacion?: PropuestaDetalle["divulgacion"];
  aspectosEticos?: PropuestaDetalle["aspectosEticos"];
  hojaRuta?: PropuestaDetalle["hojaRuta"];
  declaracionJurada?: PropuestaDetalle["declaracionJurada"];
  resguardoProductos?: PropuestaDetalle["resguardoProductos"];
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

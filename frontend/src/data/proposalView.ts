import type { PropuestaDetalle } from "../api/propuestas";
import {
  DEMO_PROPOSALS,
  getDemoProposal,
  type DemoProposal,
} from "./demo";

export type TeamTecMember = {
  id?: number;
  nombre: string;
  orcid?: string;
  instancia: string;
  rol: string;
  horas: string;
  periodo?: string;
};

export type TeamExternalMember = {
  id?: number;
  nombre: string;
  orcid?: string;
  institucion: string;
};

export type PlanRow = {
  objetivo: string;
  actividad: string;
  resultado: string;
  participantes: string;
  responsabilidad: string;
  riesgo: string;
  mitigacion: string;
  responsable: string;
  inicio: number;
  duracion: number;
};

export type PresupuestoAnualRow = {
  anio: number;
  operativo: number;
  duraderos: number;
};

export type FinanciamientoRow = {
  tipo: string;
  anio1: number;
  anio2: number;
  anio3: number;
  oficio: string;
};

export type TimelineEvent = {
  titulo: string;
  detalle: string;
  fecha: string;
};

export type ProposalViewModel = {
  id: string;
  titulo: string;
  convocatoria: string;
  investigadora: string;
  escuela: string;
  modalidad: string;
  estado: string;
  etapa: number;
  piRequired: boolean;
  presupuesto: string;
  resumen: string;
  abstract: string;
  palabras: string[];
  keywords: string[];
  teamTec: TeamTecMember[];
  teamExternal: TeamExternalMember[];
  plan: PlanRow[];
  presupuestoAnual: PresupuestoAnualRow[];
  financiamiento: FinanciamientoRow[];
  productos: string[];
  activoPI: string;
  etica: string;
  documentos: { nombre: string; estado: string }[];
  observaciones: string[];
  timeline: TimelineEvent[];
};

const RICH_TEMPLATE = DEMO_PROPOSALS[0]!;

const DEFAULT_TIMELINE: TimelineEvent[] = [
  {
    titulo: "Propuesta creada",
    detalle: "Se inició la formulación de la propuesta.",
    fecha: "12 Ago",
  },
  {
    titulo: "Propuesta enviada",
    detalle:
      "La propuesta fue enviada para continuar el flujo institucional.",
    fecha: "18 Ago",
  },
];

const DEFAULT_PLAN: PlanRow[] = [
  {
    objetivo: "OE1",
    actividad: "Diseñar arquitectura IoT",
    resultado: "Arquitectura validada",
    participantes: "Equipo coordinador",
    responsabilidad: "Ejecuta",
    riesgo: "Retraso de componentes",
    mitigacion: "Proveedor alterno y compra temprana",
    responsable: "Coordinación",
    inicio: 1,
    duracion: 3,
  },
];

const DEFAULT_PRESUPUESTO: PresupuestoAnualRow[] = [
  { anio: 2027, operativo: 2_800_000, duraderos: 9_500_000 },
  { anio: 2028, operativo: 6_150_000, duraderos: 0 },
];

export function formatCRC(amount: number) {
  return `₡${new Intl.NumberFormat("es-CR").format(amount)}`;
}

function labelEstadoApi(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    enviada: "Enviada",
  };
  return map[estado] ?? estado;
}

function demoToView(d: DemoProposal): ProposalViewModel {
  return {
    id: d.id,
    titulo: d.titulo,
    convocatoria: d.convocatoria,
    investigadora: d.investigadora,
    escuela: d.escuela,
    modalidad: d.modalidad,
    estado: d.estado,
    etapa: d.etapa,
    piRequired: d.piRequired,
    presupuesto: d.presupuesto,
    resumen: d.resumen,
    abstract: d.abstract,
    palabras: d.palabras,
    keywords: d.keywords,
    teamTec: d.teamTec.map((m) => ({ ...m, orcid: m.orcid, periodo: m.periodo })),
    teamExternal: d.teamExternal ?? [],
    plan: d.plan ?? DEFAULT_PLAN,
    presupuestoAnual: d.presupuestoAnual ?? DEFAULT_PRESUPUESTO,
    financiamiento: d.financiamiento ?? [],
    productos: d.productos ?? [],
    activoPI: d.activoPI ?? "—",
    etica: d.etica ?? "—",
    documentos: d.documentos,
    observaciones: d.observaciones ?? [],
    timeline: d.timeline ?? DEFAULT_TIMELINE,
  };
}

export function getProposalViewById(id: string): ProposalViewModel | undefined {
  const demo = getDemoProposal(id);
  if (demo) return demoToView(demo);
  return undefined;
}

export function apiToProposalView(detail: PropuestaDetalle): ProposalViewModel {
  const etapa =
    detail.estadoActual === "borrador"
      ? 0
      : Math.max(1, detail.etapaFlujo || 1);

  const timeline: TimelineEvent[] = [
    {
      titulo: "Propuesta creada",
      detalle: "Se inició la formulación de la propuesta.",
      fecha: "Reciente",
    },
  ];
  if (detail.fechaEnvio) {
    timeline.push({
      titulo: "Propuesta enviada",
      detalle:
        "La propuesta fue enviada para continuar el flujo institucional.",
      fecha: new Date(detail.fechaEnvio).toLocaleDateString("es-CR", {
        day: "numeric",
        month: "short",
      }),
    });
  }

  const presupuestoTotal = DEFAULT_PRESUPUESTO.reduce(
    (s, r) => s + r.operativo + r.duraderos,
    0,
  );

  return {
    id: detail.codigo,
    titulo: detail.titulo,
    convocatoria: detail.convocatoriaNombre,
    investigadora: detail.coordinadorNombre,
    escuela: detail.escuelaNombre,
    modalidad: detail.modalidadLabel,
    estado: labelEstadoApi(detail.estadoActual),
    etapa,
    piRequired: false,
    presupuesto: formatCRC(presupuestoTotal),
    resumen: detail.resumen ?? "Sin resumen registrado.",
    abstract: detail.abstractEn ?? "",
    palabras: detail.keywordsEs.length ? detail.keywordsEs : ["—"],
    keywords: detail.keywordsEn.length ? detail.keywordsEn : [],
    teamTec: detail.participantes.flatMap((participant) =>
      participant.tipo === "funcionario_tec"
        ? [
            {
              id: participant.id,
              nombre: participant.nombre,
              orcid: participant.orcid || undefined,
              instancia: participant.instancia,
              rol: participant.rol,
              horas:
                participant.horas
                  .map((hours) => `${hours.cantidad} ${hours.tipo}`)
                  .join(", ") || "—",
              periodo: participant.periodo || "—",
            },
          ]
        : [],
    ),
    teamExternal: detail.participantes.flatMap((participant) =>
      participant.tipo === "colaborador_externo"
        ? [
            {
              id: participant.id,
              nombre: participant.nombre,
              orcid: participant.orcid || undefined,
              institucion: participant.institucion,
            },
          ]
        : [],
    ),
    plan: RICH_TEMPLATE.plan ?? DEFAULT_PLAN,
    presupuestoAnual: DEFAULT_PRESUPUESTO,
    financiamiento: RICH_TEMPLATE.financiamiento ?? [],
    productos: RICH_TEMPLATE.productos ?? [],
    activoPI: RICH_TEMPLATE.activoPI ?? "—",
    etica: RICH_TEMPLATE.etica ?? "—",
    documentos: RICH_TEMPLATE.documentos,
    observaciones: [],
    timeline,
  };
}

export function formatCRCFromParts(operativo: number, duraderos: number) {
  return formatCRC(operativo + duraderos);
}

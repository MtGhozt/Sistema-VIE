import type { EvaluacionBandejaItem } from "../api/evaluaciones";
import type { PropuestaDetalle } from "../api/propuestas";
import type { DemoProposal } from "./demo";
import { formatCRC } from "./proposalView";

/**
 * Adapta un expediente de la API (CU3/CU4) al shape de expediente de evaluación
 * que consumen CaseFile / EvaluationRolePanels (paridad con el HTML).
 */
export function bandejaToDemoProposal(
  item: EvaluacionBandejaItem,
): DemoProposal {
  return {
    id: item.codigo,
    numericId: item.id,
    coordinadorCorreo: item.coordinadorCorreo,
    fechaResolucion: item.fechaResolucion,
    titulo: item.titulo,
    convocatoria: item.convocatoria,
    investigadora: item.investigadora,
    escuela: item.escuela,
    modalidad: item.modalidadLabel,
    estado: item.estadoLabel,
    etapa: Math.min(Math.max(item.etapaFlujo, 0), 6),
    piRequired: item.piRequired,
    piAcreditada: item.piRequired
      ? item.piEstado === "emitido"
      : item.piEstado === "no_requerido",
    presupuesto: "—",
    resumen: item.resumen ?? "",
    abstract: item.abstractEn ?? "",
    palabras: [],
    keywords: [],
    // La bandeja no trae integrantes; CaseFile los completa vía GET /propuestas/:id.
    teamTec: [],
    documentos: [
      ...(!item.piRequired
        ? [
            {
              nombre: "Certificación PI no requerido",
              estado:
                item.piEstado === "no_requerido" ? "No requerido" : "Pendiente",
            },
          ]
        : []),
      ...(item.oficioPI
        ? [{ nombre: `Dictamen PI ${item.oficioPI}`, estado: "Registrado" }]
        : []),
      ...(item.oficioComite
        ? [
            {
              nombre: `Oficio Comité ${item.oficioComite}`,
              estado: "Registrado",
            },
          ]
        : []),
      ...(item.oficioAval
        ? [{ nombre: `Aval Consejo ${item.oficioAval}`, estado: "Registrado" }]
        : []),
      ...(item.resolucion
        ? [
            {
              nombre: `Resolución ${item.resolucion}`,
              estado: "Registrado",
            },
          ]
        : []),
    ],
    evaluacionComite: item.evaluacionComite ?? undefined,
    oficioComite: item.oficioComite ?? undefined,
    oficioPI: item.oficioPI ?? undefined,
    oficioAval: item.oficioAval ?? undefined,
    resolucion: item.resolucion ?? undefined,
    notificada: item.notificada,
    vieChecks: item.vieChecks,
    justificacionAval: item.justificacionAval ?? undefined,
  };
}

/** Fusiona el detalle persistido con la ficha de bandeja. Nunca inventa plantillas demo. */
export function mergeDetalleIntoCase(
  base: DemoProposal,
  detail: PropuestaDetalle,
): DemoProposal {
  const presupuestoAnual =
    detail.presupuestoAnual ??
    detail.presupuesto?.map((p) => ({
      anio: p.anio,
      operativo: p.operativo,
      duraderos: p.duraderos,
    })) ??
    [];
  const total = presupuestoAnual.reduce(
    (s, r) => s + r.operativo + r.duraderos,
    0,
  );
  const teamTec =
    detail.teamTec?.length
      ? detail.teamTec
      : (detail.equipo ?? [])
          .filter((p) => p.tipo === "funcionario_tec")
          .map((p) => ({
            nombre: p.nombre,
            orcid: p.orcid ?? undefined,
            instancia: p.instancia ?? detail.escuelaNombre,
            rol: p.rol ?? "Integrante",
            horas:
              p.horas?.map((h) => `${h.cantidad} ${h.tipo}`).join(", ") || "—",
            periodo: p.periodo ?? undefined,
          }));
  const teamExternal =
    detail.teamExternal ??
    (detail.equipo ?? [])
      .filter((p) => p.tipo === "externo")
      .map((p) => ({
        nombre: p.nombre,
        orcid: p.orcid ?? undefined,
        institucion: p.instancia ?? "",
      }));
  const plan =
    detail.actividades?.flatMap((a) => {
      const riesgos = a.riesgos?.length
        ? a.riesgos
        : [{ riesgo: "", mitigacion: "", responsable: "" }];
      return riesgos.map((r) => ({
        objetivo: a.objetivo,
        actividad: a.actividad,
        resultado: a.resultado,
        participantes: "",
        responsabilidad: a.responsabilidad,
        riesgo: r.riesgo,
        mitigacion: r.mitigacion,
        responsable: r.responsable,
        inicio: a.inicio,
        duracion: a.duracion,
      }));
    }) ?? [];
  const adjuntos = (detail.documentos ?? []).map((d) => ({
    nombre: d.nombre,
    estado: d.estado,
  }));
  return {
    ...base,
    resumen: detail.resumen ?? base.resumen,
    abstract: detail.abstractEn ?? base.abstract,
    palabras: detail.keywordsEs?.length ? detail.keywordsEs : base.palabras,
    keywords: detail.keywordsEn?.length ? detail.keywordsEn : base.keywords,
    presupuesto: total > 0 ? formatCRC(total) : base.presupuesto,
    presupuestoAnual,
    teamTec,
    teamExternal,
    plan,
    productos: detail.productos ?? detail.compromisos?.map((c) => c.descripcion),
    observaciones: detail.observaciones ?? base.observaciones,
    documentos: [...adjuntos, ...base.documentos.filter((d) => !adjuntos.some((a) => a.nombre === d.nombre))],
  };
}

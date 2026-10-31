import { loadProductos } from "./propuestaProductos.js";
import { loadPlan } from "./propuestaPlan.js";
import { loadEtica } from "./propuestaEtica.js";
import { loadPresupuesto } from "./propuestaPresupuesto.js";
import { loadEquipo } from "./propuestaEquipo.js";
import { query } from "./db.js";

/** Datos reales del agregado; ninguna sección se rellena desde una plantilla demo. */
export async function loadPropuestaDisplay(id: number, execute: typeof query = query) {
  const [team, years, products, observations, history, documents, questions] = await Promise.all([
    execute<{ nombre: string; orcid: string | null; instancia: string; rol: string; periodo: string; tipo: string; horas: string }>(
      `SELECT p.nombre_completo AS nombre, p.orcid, COALESCE(p.instancia_o_institucion,'') AS instancia,
      p.rol_en_proyecto AS rol, p.periodo_nombramiento AS periodo, p.tipo,
      COALESCE((SELECT string_agg(h.cantidad_horas::text || ' ' || h.tipo_hora, ', ' ORDER BY h.tipo_hora)
      FROM propuesta_participante_hora h WHERE h.id_participante=p.id_participante), '—') AS horas
      FROM propuesta_participante p WHERE p.id_propuesta=$1 ORDER BY p.id_participante`, [id]),
    execute<{ anio: number; operativo: string; duraderos: string }>("SELECT anio, monto_operativo AS operativo, monto_bienes_duraderos AS duraderos FROM propuesta_presupuesto_anual WHERE id_propuesta=$1 ORDER BY anio", [id]),
    execute<{ descripcion: string }>("SELECT descripcion FROM propuesta_producto WHERE id_propuesta=$1 ORDER BY id_producto", [id]),
    execute<{ mensaje: string }>("SELECT mensaje FROM observacion WHERE id_propuesta=$1 ORDER BY fecha_creacion,id_observacion", [id]),
    execute<{ titulo: string; detalle: string; fecha: Date }>("SELECT estado_nuevo AS titulo, observacion AS detalle, fecha_hora AS fecha FROM propuesta_historial_estado WHERE id_propuesta=$1 ORDER BY fecha_hora,id_historial", [id]),
    execute<{ nombre: string; estado: string }>("SELECT nombre, estado FROM propuesta_documento WHERE id_propuesta=$1 ORDER BY id_documento", [id]),
    execute<{ numero: number; respuesta: string; detalle: string | null }>("SELECT numero_pregunta AS numero,respuesta,detalle FROM propuesta_pregunta_general WHERE id_propuesta=$1 ORDER BY numero_pregunta", [id]),
  ]);
  return {
    ...await loadEtica(id, execute),
    ...await loadPresupuesto(id, execute),
    compromisos: await loadProductos(id, execute),
    actividades: await loadPlan(id, execute),
    equipo: await loadEquipo(id, execute),
    preguntasGenerales: questions.rows,
    teamTec: team.rows.filter(p => p.tipo === "funcionario_tec").map(p => ({ ...p, orcid: p.orcid ?? undefined })),
    teamExternal: team.rows.filter(p => p.tipo === "externo").map(p => ({ nombre: p.nombre, orcid: p.orcid ?? undefined, institucion: p.instancia })),
    presupuestoAnual: years.rows.map(p => ({ anio: p.anio, operativo: Number(p.operativo), duraderos: Number(p.duraderos) })),
    productos: products.rows.map(p => p.descripcion), observaciones: observations.rows.map(p => p.mensaje),
    timeline: history.rows.map(p => ({ ...p, fecha: p.fecha.toISOString() })), documentos: documents.rows,
  };
}

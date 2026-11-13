import {DIRECCION_FILTROS,AVAL_COMUNICADO_SQL} from "../direccionEstado.js";
import {CONSEJO_FILTROS,CONSEJO_DECISION_FILTROS} from "../consejoEstado.js";
import {estadoEvaluadorSql,asignadoEvaluadorSql} from "../evaluadorEstado.js";
import {COMITE_DEVUELTA_SQL} from "../comiteEstado.js";
import {ESTADO_PI_SQL,ESTADOS_PI} from "../estadoPi.js";
import {HttpError} from "../middleware/HttpError.js";
import { alcancePropuestas } from "../alcancePropuestas.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router } from "express";
import { query } from "../db.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";

export const historicoRouter = Router();

/**
 * CU5 — Consulta histórica de propuestas.
 *
 * Los filtros se aplican en PostgreSQL (no en memoria): la rúbrica exige
 * "Resultados desde PostgreSQL, no datos hardcodeados".
 *
 * Filtros (combinables):
 *   escuela      → nombre o código de la dependencia
 *   investigadora→ nombre de la persona coordinadora
 *   linea        → línea de investigación (tema)
 *   estado       → estado_actual de la propuesta
 *   anio         → año de resolución, envío o inicio
 */

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_subsanacion: "En subsanación",
  enviada: "Enviada",
  en_evaluacion: "En evaluación",
  dictaminada: "Dictaminada",
  avalada: "Avalada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  rechazo_aval:"Aval rechazado",
};

const MODALIDAD_LABEL: Record<string, string> = {
  basica: "Investigación básica",
  aplicada: "Investigación aplicada",
  basica_aplicada: "Investigación básica y aplicada",
  desarrollo_tecnologico: "Desarrollo tecnológico",
  fortalecimiento: "Actividades de fortalecimiento",
};

type HistoricoRow = {
  id_propuesta: number;
  estado_evaluacion?:string;
  codigo: string;
  estado_pi:keyof typeof ESTADOS_PI;
  titulo: string;
  modalidad: string;modalidad_nombre:string|null;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  fecha_resolucion: string | null;
  escuela_codigo: string;
  escuela_nombre: string;
  investigador_nombre: string;
  lineas: string | null;
  numero_resolucion: string | null;
  numero_oficio_consejo: string | null;
  estado_aval:string|null;
  aval_comunicado:boolean;
  numero_oficio_comite: string | null;
  numero_oficio_pi: string | null;
};

const SELECT_BASE = `
  SELECT
    p.id_propuesta,
    p.codigo,
    ${ESTADO_PI_SQL} AS estado_pi,
    p.titulo,
    p.modalidad,mc.nombre AS modalidad_nombre,
    p.estado_actual,
    p.etapa_flujo,
    p.fecha_envio,
    r.fecha_resolucion,
    e.codigo AS escuela_codigo,
    e.nombre AS escuela_nombre,
    u.nombre_completo AS investigador_nombre,
    (
      SELECT string_agg(l.nombre, ' · ' ORDER BY l.nombre)
      FROM propuesta_linea pl
      JOIN linea_investigacion l
        ON l.id_linea_investigacion = pl.id_linea_investigacion
      WHERE pl.id_propuesta = p.id_propuesta
    ) AS lineas,
    r.numero_resolucion,
    av.numero_oficio AS numero_oficio_consejo,
    av.resultado AS estado_aval,
    (${AVAL_COMUNICADO_SQL}) AS aval_comunicado,
    rc.numero_oficio AS numero_oficio_comite,
    dpi.numero_oficio AS numero_oficio_pi
  FROM propuesta p
  LEFT JOIN modalidad_catalogo mc ON mc.codigo=p.modalidad
  JOIN escuela e ON e.id_escuela = p.id_escuela
  JOIN usuario u ON u.id_usuario = p.id_coordinador
  LEFT JOIN resolucion_cie r ON r.id_propuesta = p.id_propuesta
  LEFT JOIN aval_consejo av ON av.id_propuesta = p.id_propuesta
  LEFT JOIN resultado_comite rc ON rc.id_propuesta = p.id_propuesta
  LEFT JOIN dictamen_pi dpi ON dpi.id_propuesta = p.id_propuesta
`;

/** Año de referencia de la propuesta: resolución, envío o inicio. */
const ANIO_EXPR = `EXTRACT(YEAR FROM COALESCE(r.fecha_resolucion, p.fecha_envio, p.fecha_inicio))`;

function filtrosAnio(anio: string): number | null {
  const n = Number(anio);
  return Number.isInteger(n) && n > 1900 ? n : null;
}

function buildWhere(filters: {
  escuela: string;
  investigadora: string;
  linea: string;
  estado: string;
  anio: string;
  pi:string;
  comite:string;
}) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  /** Sustituye cada `?` por su placeholder numerado, en orden. */
  const push = (sql: string, ...vals: unknown[]) => {
    let out = sql;
    for (const v of vals) {
      values.push(v);
      out = out.replace("?", `$${values.length}`);
    }
    clauses.push(out);
  };

  if(filters.comite)push(`(${COMITE_DEVUELTA_SQL})`);
  if (filters.escuela) {
    push(
      "(e.nombre ILIKE ? OR e.codigo ILIKE ?)",
      `%${filters.escuela}%`,
      `%${filters.escuela}%`,
    );
  }
  if (filters.investigadora) {
    push("u.nombre_completo ILIKE ?", `%${filters.investigadora}%`);
  }
  if (filters.linea) {
    push(
      `EXISTS (
         SELECT 1
         FROM propuesta_linea pl
         JOIN linea_investigacion l
           ON l.id_linea_investigacion = pl.id_linea_investigacion
         WHERE pl.id_propuesta = p.id_propuesta AND l.nombre ILIKE ?
       )`,
      `%${filters.linea}%`,
    );
  }
  if(filters.pi){push(`(${ESTADO_PI_SQL}) = ?`,filters.pi);clauses.push("p.estado_actual<>'borrador'");}
  if (filters.estado) {
    push("p.estado_actual = ?", filters.estado);
  }
  const anio = filtrosAnio(filters.anio);
  if (anio !== null) {
    push(`${ANIO_EXPR} = ?`, anio);
  }

  return { where: clauses, values };
}

function mapRow(row: HistoricoRow) {
  const documentos: { tipo: string; numero: string }[] = [];
  if (row.numero_oficio_pi) {
    documentos.push({ tipo: "Dictamen PI", numero: row.numero_oficio_pi });
  }
  if (row.numero_oficio_comite) {
    documentos.push({ tipo: "Oficio Comité", numero: row.numero_oficio_comite });
  }
  if (row.numero_oficio_consejo) {
    documentos.push({ tipo: "Aval Consejo", numero: row.numero_oficio_consejo });
  }
  if (row.numero_resolucion) {
    documentos.push({ tipo: "Resolución CIE", numero: row.numero_resolucion });
  }

  return {
    id: row.id_propuesta,
    estadoAval:row.estado_aval,
    avalComunicado:row.aval_comunicado,
    estadoEvaluacion:row.estado_evaluacion,
    estadoPi:row.estado_pi,estadoPiLabel:ESTADOS_PI[row.estado_pi],
    codigo: row.codigo,
    titulo: row.titulo,
    modalidad: row.modalidad,
    modalidadLabel: row.modalidad_nombre ?? MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
    estado: row.estado_actual,
    estadoLabel: ESTADO_LABEL[row.estado_actual] ?? row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
    fechaResolucion: row.fecha_resolucion,
    escuelaCodigo: row.escuela_codigo,
    escuela: row.escuela_nombre,
    investigadora: row.investigador_nombre,
    lineas: row.lineas ? row.lineas.split(" · ") : [],
    documentos,
  };
}

/** Listado con filtros combinados + opciones disponibles para los select. */
historicoRouter.get(
  "/historico/propuestas",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const q = req.query;
    const filtros = {
      escuela: String(q.escuela ?? "").trim(),
      investigadora: String(q.investigadora ?? "").trim(),
      linea: String(q.linea ?? "").trim(),
      estado: String(q.estado ?? "").trim(),
      anio: String(q.anio ?? "").trim(),
      pi:String(q.pi??"").trim(),
      comite:String(q.comite??"").trim(),
    };

    if(filtros.comite&&filtros.comite!=="devueltas")throw new HttpError(400,"Seleccione un filtro de devoluciones del Comité válido.");
    if(filtros.pi&&!Object.hasOwn(ESTADOS_PI,filtros.pi))throw new HttpError(400,"Seleccione un estado de PI válido.");
    const { where, values } = buildWhere(filtros);
    const direccion=String(q.direccion??'');
    if(direccion){if(!Object.hasOwn(DIRECCION_FILTROS,direccion))throw new HttpError(400,'Filtro de comunicación del aval inválido');where.push(`(${DIRECCION_FILTROS[direccion]})`);}
    const consejo=String(q.consejo??'');
    if(consejo){const all={...CONSEJO_FILTROS,...CONSEJO_DECISION_FILTROS};if(!Object.hasOwn(all,consejo))throw new HttpError(400,'Filtro del Consejo inválido');where.push(`(${all[consejo]})`);}
    const personal=String(q.evaluacion??'');
    if(personal){
      if(req.demoAuth!.role!=='comite_evaluador'||!['pendiente','en_progreso','completada'].includes(personal))throw new HttpError(400,'Filtro de evaluación individual inválido');
      values.push(req.demoAuth!.userId);const usuario=`$${values.length}`;values.push(personal);
      where.push(`${asignadoEvaluadorSql(usuario)} AND ${estadoEvaluadorSql(usuario)}=$${values.length}`);
    }
    const scope = alcancePropuestas(req.demoAuth!,values.length+1);
    where.push(scope.sql);
    values.push(...scope.params);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    let select=SELECT_BASE;
    if(req.demoAuth!.role==='comite_evaluador'){
      values.push(req.demoAuth!.userId);const usuario=`$${values.length}`;
      select=select.replace('p.id_propuesta,',`p.id_propuesta, CASE WHEN ${asignadoEvaluadorSql(usuario)} THEN ${estadoEvaluadorSql(usuario)} ELSE 'no_asignada' END AS estado_evaluacion,`);
    }
    const rows = await query<HistoricoRow>(
      `${select} ${whereSql}
       ORDER BY COALESCE(r.fecha_resolucion, p.fecha_envio, p.fecha_inicio) DESC NULLS LAST,
                p.id_propuesta DESC`,
      values,
    );

    if(q.opciones==='0'){res.json({items:rows.rows.map(mapRow),total:rows.rows.length,filtrosAplicados:filtros});return;}
    const scopeOnly=alcancePropuestas(req.demoAuth!);
    const [escuelas,lineas,estados,anios]=await Promise.all([
      query<{codigo:string;nombre:string}>(`SELECT DISTINCT e.codigo,e.nombre FROM propuesta p JOIN escuela e ON e.id_escuela=p.id_escuela WHERE ${scopeOnly.sql} ORDER BY e.nombre`,scopeOnly.params),
      query<{nombre:string}>(`SELECT DISTINCT l.nombre FROM propuesta p JOIN propuesta_linea pl ON pl.id_propuesta=p.id_propuesta JOIN linea_investigacion l ON l.id_linea_investigacion=pl.id_linea_investigacion WHERE ${scopeOnly.sql} ORDER BY l.nombre`,scopeOnly.params),
      query<{estado_actual:string}>(`SELECT DISTINCT p.estado_actual FROM propuesta p WHERE ${scopeOnly.sql} ORDER BY p.estado_actual`,scopeOnly.params),
      query<{anio:number}>(`SELECT DISTINCT ${ANIO_EXPR}::int AS anio FROM propuesta p LEFT JOIN resolucion_cie r ON r.id_propuesta=p.id_propuesta WHERE ${scopeOnly.sql} AND COALESCE(r.fecha_resolucion,p.fecha_envio,p.fecha_inicio) IS NOT NULL ORDER BY anio DESC`,scopeOnly.params),
    ]);

    res.json({
      items: rows.rows.map(mapRow),
      total: rows.rows.length,
      filtrosAplicados: filtros,
      opciones: {
        estadosPi:Object.entries(ESTADOS_PI).map(([valor,label])=>({valor,label})),
        escuelas: escuelas.rows,
        lineas: lineas.rows.map((l) => l.nombre),
        estados: estados.rows.map((e) => ({
          valor: e.estado_actual,
          label: ESTADO_LABEL[e.estado_actual] ?? e.estado_actual,
        })),
        anios: anios.rows.map((a) => a.anio),
      },
    });
  }),
);

/** Indicadores de Vinculación: mismo estado y ámbito que el histórico, sin LIMIT de bandeja. */
historicoRouter.get('/vinculacion/resumen',requireDemoAuth,asyncHandler(async(req,res)=>{
 if(!['vinculacion','admin'].includes(req.demoAuth!.role??''))throw new HttpError(403,'Solo Vinculación o administración consulta estos indicadores.');
 const scope=alcancePropuestas(req.demoAuth!);
 const counts=await query<{estado:keyof typeof ESTADOS_PI;cantidad:string}>(`SELECT (${ESTADO_PI_SQL}) AS estado,count(*) AS cantidad FROM propuesta p LEFT JOIN dictamen_pi dpi ON dpi.id_propuesta=p.id_propuesta WHERE ${scope.sql} AND p.estado_actual<>'borrador' GROUP BY 1`,scope.params);
 const pendientes=await query<HistoricoRow>(`${SELECT_BASE} WHERE ${scope.sql} AND p.estado_actual IN ('enviada','en_evaluacion','dictaminada','avalada') AND p.etapa_flujo BETWEEN 1 AND 5 AND (${ESTADO_PI_SQL}) IN ('pendiente','en_revision') ORDER BY p.fecha_envio ASC NULLS LAST,p.id_propuesta ASC LIMIT 5`,scope.params);
 res.json({conteos:Object.fromEntries(Object.keys(ESTADOS_PI).map(key=>[key,Number(counts.rows.find(r=>r.estado===key)?.cantidad??0)])),pendientes:pendientes.rows.map(mapRow),criterio:'Pendientes de PI con mayor antigüedad desde el envío; no incluye expedientes cerrados ni en subsanación.'});
}));

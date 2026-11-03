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
  codigo: string;
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
  numero_oficio_comite: string | null;
  numero_oficio_pi: string | null;
};

const SELECT_BASE = `
  SELECT
    p.id_propuesta,
    p.codigo,
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
    };

    const { where, values } = buildWhere(filtros);
    const scope = alcancePropuestas(req.demoAuth!,values.length+1);
    where.push(scope.sql);
    values.push(...scope.params);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await query<HistoricoRow>(
      `${SELECT_BASE} ${whereSql}
       ORDER BY COALESCE(r.fecha_resolucion, p.fecha_envio, p.fecha_inicio) DESC NULLS LAST,
                p.id_propuesta DESC`,
      values,
    );

    const scopeOnly=alcancePropuestas(req.demoAuth!);
    const accessible=await query<HistoricoRow & {anio:number|null}>(`${SELECT_BASE} WHERE ${scopeOnly.sql}`,scopeOnly.params);
    const all=accessible.rows;
    const escuelas={rows:[...new Map(all.map(r=>[r.escuela_codigo,{codigo:r.escuela_codigo,nombre:r.escuela_nombre}])).values()].sort((a,b)=>a.nombre.localeCompare(b.nombre))};
    const lineas={rows:[...new Set(all.flatMap(r=>r.lineas?.split(" · ")??[]))].sort().map(nombre=>({nombre}))};
    const estados={rows:[...new Set(all.map(r=>r.estado_actual))].sort().map(estado_actual=>({estado_actual}))};
    const years=await query<{anio:number}>(`SELECT DISTINCT ${ANIO_EXPR}::int AS anio FROM propuesta p LEFT JOIN resolucion_cie r ON r.id_propuesta=p.id_propuesta WHERE ${scopeOnly.sql} AND COALESCE(r.fecha_resolucion,p.fecha_envio,p.fecha_inicio) IS NOT NULL ORDER BY anio DESC`,scopeOnly.params);
    const anios={rows:years.rows};

    res.json({
      items: rows.rows.map(mapRow),
      total: rows.rows.length,
      filtrosAplicados: filtros,
      opciones: {
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

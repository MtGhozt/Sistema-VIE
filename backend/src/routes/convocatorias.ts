import { saveHitos } from "../convocatoriaHitos.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router, type Response } from "express";
import { query, transaction } from "../db.js";
import { requireDemoAuth, requirePublisher } from "../middleware/demoAuth.js";

export const convocatoriasRouter = Router();

const ESTADOS = new Set(["borrador", "activa", "cerrada", "finalizada"]);
const MAX_PRESUPUESTO = 999_999_999_999.99;

type PresupuestoResult =
  | { valid: true; value: number | null }
  | { valid: false };

function parsePresupuesto(value: unknown): PresupuestoResult {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: null };
  }
  if (typeof value !== "number" && typeof value !== "string") {
    return { valid: false };
  }

  const parsed = typeof value === "string" ? Number(value.trim()) : value;
  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    parsed > MAX_PRESUPUESTO
  ) {
    return { valid: false };
  }
  return { valid: true, value: parsed };
}

function sendInvalidPresupuesto(res: Response) {
  res.status(400).json({
    error: "presupuestoEstimado debe ser un número entre 0 y 999999999999.99",
  });
}

type ConvocatoriaRow = {
  id_convocatoria: number;
  nombre: string;
  descripcion: string | null;
  fecha_apertura: string | Date;
  fecha_cierre: string | Date;
  presupuesto_estimado: string | null;
  estado: string;
  id_publicada_por: number | null;
  fecha_publicacion: string | null;
  propuestas_count: string | number;
};

type HitoRow = {
  id_hito: number;
  id_convocatoria: number;
  nombre: string;
  responsable: string;
  fecha_inicio: string | Date;
  fecha_fin: string | Date;
  orden: number;
};

function asDateOnly(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapConvocatoria(row: ConvocatoriaRow) {
  return {
    id: row.id_convocatoria,
    nombre: row.nombre,
    descripcion: row.descripcion,
    fechaApertura: asDateOnly(row.fecha_apertura),
    fechaCierre: asDateOnly(row.fecha_cierre),
    presupuestoEstimado: row.presupuesto_estimado
      ? Number(row.presupuesto_estimado)
      : null,
    estado: row.estado,
    idPublicadaPor: row.id_publicada_por,
    fechaPublicacion: row.fecha_publicacion,
    propuestasCount: Number(row.propuestas_count ?? 0),
  };
}

function mapHito(row: HitoRow) {
  return {
    id: row.id_hito,
    idConvocatoria: row.id_convocatoria,
    nombre: row.nombre,
    responsable: row.responsable,
    fechaInicio: asDateOnly(row.fecha_inicio),
    fechaFin: asDateOnly(row.fecha_fin),
    orden: row.orden,
  };
}

const LIST_SQL = `
  SELECT c.*,
    (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
  FROM convocatoria c
  ORDER BY c.fecha_apertura DESC, c.id_convocatoria DESC
`;

/** Listado — cualquier sesión demo. */
convocatoriasRouter.get(
  "/convocatorias",
  requireDemoAuth,
  asyncHandler(async (_req, res) => {
    const result = await query<ConvocatoriaRow>(LIST_SQL);
    res.json(result.rows.map(mapConvocatoria));
  }),
);

/** Detalle + hitos. */
convocatoriasRouter.get(
  "/convocatorias/:id",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const result = await query<ConvocatoriaRow>(
      `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
      FROM convocatoria c
      WHERE c.id_convocatoria = $1
      `,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Convocatoria no encontrada" });
      return;
    }
    const hitos = await query<HitoRow>(
      `
      SELECT * FROM convocatoria_hito
      WHERE id_convocatoria = $1
      ORDER BY orden ASC, id_hito ASC
      `,
      [id],
    );
    res.json({
      ...mapConvocatoria(row),
      hitos: hitos.rows.map(mapHito),
    });
  }),
);

/** Crear borrador o publicar. */
convocatoriasRouter.post(
  "/convocatorias",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const nombre = String(req.body?.nombre ?? "").trim();
    const descripcion = req.body?.descripcion
      ? String(req.body.descripcion).trim()
      : null;
    const fechaApertura = String(req.body?.fechaApertura ?? "").trim();
    const fechaCierre = String(req.body?.fechaCierre ?? "").trim();
    const presupuestoResult = parsePresupuesto(req.body?.presupuestoEstimado);
    if (!presupuestoResult.valid) {
      sendInvalidPresupuesto(res);
      return;
    }
    const presupuesto = presupuestoResult.value;
    let estado = String(req.body?.estado ?? "borrador").trim().toLowerCase();
    if (!ESTADOS.has(estado)) estado = "borrador";

    if (!nombre || !fechaApertura || !fechaCierre) {
      res.status(400).json({
        error: "nombre, fechaApertura y fechaCierre son obligatorios",
      });
      return;
    }
    if (fechaCierre < fechaApertura) {
      res.status(400).json({ error: "fechaCierre debe ser >= fechaApertura" });
      return;
    }

    const userId = req.demoAuth!.userId!;
    const publicar = estado === "activa";

    const insert = await query<ConvocatoriaRow>(
      `
      INSERT INTO convocatoria (
        nombre, descripcion, fecha_apertura, fecha_cierre,
        presupuesto_estimado, estado, id_publicada_por, fecha_publicacion
      ) VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8)
      RETURNING *, 0::int AS propuestas_count
      `,
      [
        nombre,
        descripcion,
        fechaApertura,
        fechaCierre,
        presupuesto,
        estado,
        publicar ? userId : null,
        publicar ? new Date().toISOString() : null,
      ],
    );

    const created = insert.rows[0];
    const hitosIn = Array.isArray(req.body?.hitos) ? req.body.hitos : [];
    for (let i = 0; i < hitosIn.length; i++) {
      const h = hitosIn[i];
      const hNombre = String(h?.nombre ?? "").trim();
      const responsable = String(h?.responsable ?? "VIE").trim() || "VIE";
      const fechaInicio = String(h?.fechaInicio ?? fechaApertura).trim();
      const fechaFin = String(h?.fechaFin ?? fechaCierre).trim();
      if (!hNombre) continue;
      await query(
        `
        INSERT INTO convocatoria_hito (
          id_convocatoria, nombre, responsable, fecha_inicio, fecha_fin, orden
        ) VALUES ($1, $2, $3, $4::date, $5::date, $6)
        `,
        [created.id_convocatoria, hNombre, responsable, fechaInicio, fechaFin, i + 1],
      );
    }

    const detail = await query<ConvocatoriaRow>(
      `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
      FROM convocatoria c WHERE c.id_convocatoria = $1
      `,
      [created.id_convocatoria],
    );
    res.status(201).json(mapConvocatoria(detail.rows[0]));
  }),
);

/** Actualizar datos / estado (publicar, cerrar). */
convocatoriasRouter.patch(
  "/convocatorias/:id",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }

    const existing = await query<{ estado: string }>(
      `SELECT estado FROM convocatoria WHERE id_convocatoria = $1`,
      [id],
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Convocatoria no encontrada" });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    const set = (col: string, val: unknown) => {
      fields.push(`${col} = $${i++}`);
      values.push(val);
    };

    if (req.body?.nombre !== undefined) {
      const nombre = String(req.body.nombre).trim();
      if (!nombre) {
        res.status(400).json({ error: "nombre vacío" });
        return;
      }
      set("nombre", nombre);
    }
    if (req.body?.descripcion !== undefined) {
      set(
        "descripcion",
        req.body.descripcion === null
          ? null
          : String(req.body.descripcion).trim(),
      );
    }
    if (req.body?.fechaApertura !== undefined) {
      set("fecha_apertura", String(req.body.fechaApertura));
    }
    if (req.body?.fechaCierre !== undefined) {
      set("fecha_cierre", String(req.body.fechaCierre));
    }
    if (req.body?.presupuestoEstimado !== undefined) {
      const presupuestoResult = parsePresupuesto(req.body.presupuestoEstimado);
      if (!presupuestoResult.valid) {
        sendInvalidPresupuesto(res);
        return;
      }
      set("presupuesto_estimado", presupuestoResult.value);
    }
    if (req.body?.estado !== undefined) {
      const estado = String(req.body.estado).trim().toLowerCase();
      if (!ESTADOS.has(estado)) {
        res.status(400).json({ error: "estado inválido" });
        return;
      }
      set("estado", estado);
      if (estado === "activa" && existing.rows[0].estado !== "activa") {
        set("id_publicada_por", req.demoAuth!.userId);
        set("fecha_publicacion", new Date().toISOString());
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "Sin campos para actualizar" });
      return;
    }

    const saved = await transaction(async(execute)=>{
    await execute("SELECT id_convocatoria FROM convocatoria WHERE id_convocatoria=$1 FOR UPDATE",[id]);
    values.push(id);
    await execute(
      `UPDATE convocatoria SET ${fields.join(", ")} WHERE id_convocatoria = $${i}`,
      values,
    );

    await saveHitos(id,req.body?.hitos,execute);
    const result = await execute<ConvocatoriaRow>(
      `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
      FROM convocatoria c WHERE c.id_convocatoria = $1
      `,
      [id],
    );
    return mapConvocatoria(result.rows[0]);
    });
    res.json(saved);
  }),
);

/** Agregar hito. */
convocatoriasRouter.post(
  "/convocatorias/:id/hitos",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const nombre = String(req.body?.nombre ?? "").trim();
    const responsable = String(req.body?.responsable ?? "VIE").trim() || "VIE";
    const fechaInicio = String(req.body?.fechaInicio ?? "").trim();
    const fechaFin = String(req.body?.fechaFin ?? "").trim();
    if (!Number.isFinite(id) || !nombre || !fechaInicio || !fechaFin) {
      res.status(400).json({
        error: "nombre, fechaInicio y fechaFin son obligatorios",
      });
      return;
    }

    const max = await query<{ m: number | null }>(
      `SELECT MAX(orden) AS m FROM convocatoria_hito WHERE id_convocatoria = $1`,
      [id],
    );
    const orden =
      req.body?.orden !== undefined
        ? Number(req.body.orden)
        : (max.rows[0]?.m ?? 0) + 1;

    const result = await query<HitoRow>(
      `
      INSERT INTO convocatoria_hito (
        id_convocatoria, nombre, responsable, fecha_inicio, fecha_fin, orden
      ) VALUES ($1, $2, $3, $4::date, $5::date, $6)
      RETURNING *
      `,
      [id, nombre, responsable, fechaInicio, fechaFin, orden],
    );
    res.status(201).json(mapHito(result.rows[0]));
  }),
);

/** Eliminar hito. */
convocatoriasRouter.delete(
  "/convocatorias/:id/hitos/:hitoId",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const hitoId = Number(req.params.hitoId);
    const result = await query(
      `
      DELETE FROM convocatoria_hito
      WHERE id_hito = $1 AND id_convocatoria = $2
      `,
      [hitoId, id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Hito no encontrado" });
      return;
    }
    res.status(204).send();
  }),
);

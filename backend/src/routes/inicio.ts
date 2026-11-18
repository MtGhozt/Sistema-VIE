import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";
import { query } from "../db.js";
import { alcancePropuestas } from "../alcancePropuestas.js";

export const inicioRouter = Router();

function asCountMap(rows: { key: string; value: string | number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    out[String(row.key)] = Number(row.value) || 0;
  }
  return out;
}

/**
 * Tendencias honestas de Inicio: solo conteos con ventana temporal real
 * (envíos, historial de estado, publicaciones de convocatoria).
 */
inicioRouter.get(
  "/inicio/tendencias",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const auth = req.demoAuth!;
    const requestedView = String(req.query.view ?? "").trim();
    const role =
      auth.role === "admin" && requestedView ? requestedView : auth.role!;
    const daysRaw = Number(req.query.days ?? 7);
    const windowDays =
      Number.isFinite(daysRaw) && daysRaw >= 1 && daysRaw <= 90
        ? Math.floor(daysRaw)
        : 7;

    const scopeAuth =
      auth.role === "admin"
        ? { role: "admin" as const, userId: auth.userId! }
        : { role, userId: auth.userId! };
    const scope = alcancePropuestas(scopeAuth);
    const dayParam = scope.params.length + 1;

    const envios = Number(
      (
        await query<{ n: string }>(
          `SELECT COUNT(*)::text AS n
           FROM propuesta p
           WHERE ${scope.sql}
             AND p.fecha_envio IS NOT NULL
             AND p.fecha_envio >= (CURRENT_DATE - ($${dayParam}::int) * INTERVAL '1 day')`,
          [...scope.params, windowDays],
        )
      ).rows[0]?.n ?? 0,
    );

    const porEstadoNuevo = asCountMap(
      (
        await query<{ key: string; value: string }>(
          `SELECT h.estado_nuevo AS key, COUNT(*)::text AS value
           FROM propuesta_historial_estado h
           JOIN propuesta p ON p.id_propuesta = h.id_propuesta
           WHERE ${scope.sql}
             AND h.fecha_hora >= (NOW() - ($${dayParam}::int) * INTERVAL '1 day')
           GROUP BY h.estado_nuevo`,
          [...scope.params, windowDays],
        )
      ).rows,
    );

    const porEtapaEvento = asCountMap(
      (
        await query<{ key: string; value: string }>(
          `SELECT h.etapa_evento::text AS key, COUNT(*)::text AS value
           FROM propuesta_historial_estado h
           JOIN propuesta p ON p.id_propuesta = h.id_propuesta
           WHERE ${scope.sql}
             AND h.etapa_evento IS NOT NULL
             AND h.fecha_hora >= (NOW() - ($${dayParam}::int) * INTERVAL '1 day')
           GROUP BY h.etapa_evento`,
          [...scope.params, windowDays],
        )
      ).rows,
    );

    const convocatoriasPublicadas = Number(
      (
        await query<{ n: string }>(
          `SELECT COUNT(*)::text AS n
           FROM convocatoria
           WHERE fecha_publicacion IS NOT NULL
             AND fecha_publicacion >= (NOW() - ($1::int) * INTERVAL '1 day')`,
          [windowDays],
        )
      ).rows[0]?.n ?? 0,
    );

    const convocatoriasCerradasEnVentana = Number(
      (
        await query<{ n: string }>(
          `SELECT COUNT(*)::text AS n
           FROM convocatoria
           WHERE estado IN ('cerrada', 'finalizada')
             AND fecha_cierre >= (CURRENT_DATE - ($1::int))
             AND fecha_cierre <= CURRENT_DATE`,
          [windowDays],
        )
      ).rows[0]?.n ?? 0,
    );

    res.json({
      role,
      windowDays,
      envios,
      porEstadoNuevo,
      porEtapaEvento,
      convocatoriasPublicadas,
      convocatoriasCerradasEnVentana,
    });
  }),
);

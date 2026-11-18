import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";
import { query } from "../db.js";
import { alcancePropuestas } from "../alcancePropuestas.js";

export const estadisticasRouter = Router();

type SeriesPoint = { label: string; value: number };

function asSeries(rows: { label: string; value: string | number }[]): SeriesPoint[] {
  return rows.map((r) => ({ label: String(r.label), value: Number(r.value) || 0 }));
}

estadisticasRouter.get(
  "/estadisticas",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const auth = req.demoAuth!;
    const requestedView = String(req.query.view ?? "").trim();
    const role =
      auth.role === "admin" && requestedView
        ? requestedView
        : auth.role!;
    const userId = auth.userId!;
    const scope = alcancePropuestas({
      role: auth.role === "admin" ? "admin" : role,
      userId,
    });

    const porEstado = asSeries(
      (
        await query<{ label: string; value: string }>(
          `SELECT p.estado_actual AS label, COUNT(*)::text AS value
           FROM propuesta p
           WHERE ${scope.sql}
           GROUP BY p.estado_actual
           ORDER BY COUNT(*) DESC`,
          scope.params,
        )
      ).rows,
    );

    const porEscuela = asSeries(
      (
        await query<{ label: string; value: string }>(
          `SELECT e.nombre AS label, COUNT(*)::text AS value
           FROM propuesta p
           JOIN escuela e ON e.id_escuela = p.id_escuela
           WHERE ${scope.sql}
           GROUP BY e.nombre
           ORDER BY COUNT(*) DESC
           LIMIT 8`,
          scope.params,
        )
      ).rows,
    );

    const enviosMes = asSeries(
      (
        await query<{ label: string; value: string }>(
          `SELECT to_char(date_trunc('month', p.fecha_envio), 'YYYY-MM') AS label,
                  COUNT(*)::text AS value
           FROM propuesta p
           WHERE ${scope.sql} AND p.fecha_envio IS NOT NULL
           GROUP BY 1
           ORDER BY 1
           LIMIT 12`,
          scope.params,
        )
      ).rows,
    );

    const kpisBase = {
      totalAlcance: porEstado.reduce((a, b) => a + b.value, 0),
      aprobadas: porEstado.find((p) => p.label === "aprobada")?.value ?? 0,
      rechazadas: porEstado.find((p) => p.label === "rechazada")?.value ?? 0,
      borradores: porEstado.find((p) => p.label === "borrador")?.value ?? 0,
    };

    if (role === "investigador") {
      const mias = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT estado_actual AS label, COUNT(*)::text AS value
             FROM propuesta WHERE id_coordinador=$1
             GROUP BY estado_actual ORDER BY COUNT(*) DESC`,
            [userId],
          )
        ).rows,
      );
      const participaciones = Number(
        (
          await query<{ n: string }>(
            "SELECT COUNT(*)::text AS n FROM propuesta_participante WHERE id_usuario=$1",
            [userId],
          )
        ).rows[0]?.n ?? 0,
      );
      res.json({
        role,
        title: "Mis estadísticas de investigación",
        kpis: [
          { label: "Propuestas coordinadas", value: mias.reduce((a, b) => a + b.value, 0) },
          { label: "Participaciones en equipos", value: participaciones },
          { label: "Aprobadas", value: mias.find((p) => p.label === "aprobada")?.value ?? 0 },
          { label: "En borrador", value: mias.find((p) => p.label === "borrador")?.value ?? 0 },
        ],
        charts: [
          { id: "estados", title: "Mis propuestas por estado", type: "bar", series: mias },
          { id: "envios", title: "Envíos por mes (alcance)", type: "line", series: enviosMes },
        ],
      });
      return;
    }

    if (role === "vie_publicacion") {
      const convocatorias = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT estado AS label, COUNT(*)::text AS value FROM convocatoria GROUP BY estado ORDER BY COUNT(*) DESC`,
          )
        ).rows,
      );
      const porConv = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT c.nombre AS label, COUNT(p.id_propuesta)::text AS value
             FROM convocatoria c
             LEFT JOIN propuesta p ON p.id_convocatoria = c.id_convocatoria AND p.estado_actual <> 'borrador'
             GROUP BY c.nombre
             ORDER BY COUNT(p.id_propuesta) DESC
             LIMIT 8`,
          )
        ).rows,
      );
      res.json({
        role,
        title: "Estadísticas de convocatorias",
        kpis: [
          { label: "Convocatorias", value: convocatorias.reduce((a, b) => a + b.value, 0) },
          { label: "Activas", value: convocatorias.find((p) => p.label === "activa")?.value ?? 0 },
          { label: "Propuestas no borrador", value: kpisBase.totalAlcance - kpisBase.borradores },
          { label: "Cerradas", value: convocatorias.find((p) => p.label === "cerrada")?.value ?? 0 },
        ],
        charts: [
          { id: "conv-estado", title: "Convocatorias por estado", type: "pie", series: convocatorias },
          { id: "prop-conv", title: "Propuestas por convocatoria", type: "bar", series: porConv },
        ],
      });
      return;
    }

    if (role === "vinculacion") {
      const piSeries = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT p.estado_actual AS label, COUNT(*)::text AS value
             FROM propuesta p
             WHERE ${scope.sql} AND p.etapa_flujo <= 2
             GROUP BY p.estado_actual
             ORDER BY COUNT(*) DESC`,
            scope.params,
          )
        ).rows,
      );
      res.json({
        role,
        title: "Estadísticas de Vinculación (PI)",
        kpis: [
          { label: "En alcance", value: kpisBase.totalAlcance },
          {
            label: "Pendientes de etapa PI",
            value: porEstado
              .filter((p) =>
                ["enviada", "en_revision_pi", "dictaminada", "pendiente_pi"].includes(p.label),
              )
              .reduce((a, b) => a + b.value, 0),
          },
          { label: "Aprobadas finales", value: kpisBase.aprobadas },
          { label: "Rechazadas", value: kpisBase.rechazadas },
        ],
        charts: [
          { id: "pi", title: "Distribución de casos PI / estado", type: "bar", series: piSeries },
          { id: "envios", title: "Ingresos por mes", type: "line", series: enviosMes },
        ],
      });
      return;
    }

    if (role === "comite_asistente" || role === "comite_evaluador") {
      const evaluaciones = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT COALESCE(e.estado,'sin_iniciar') AS label, COUNT(*)::text AS value
             FROM evaluacion e
             WHERE e.instancia='comite' ${role === "comite_evaluador" ? "AND e.id_evaluador=$1" : ""}
             GROUP BY 1 ORDER BY COUNT(*) DESC`,
            role === "comite_evaluador" ? [userId] : [],
          )
        ).rows,
      );
      const puntajes = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT width_bucket(COALESCE(e.puntaje_total,0), 0, 100, 5)::text AS bucket,
                    COUNT(*)::text AS value
             FROM evaluacion e
             WHERE e.instancia='comite' AND e.puntaje_total IS NOT NULL
               ${role === "comite_evaluador" ? "AND e.id_evaluador=$1" : ""}
             GROUP BY 1 ORDER BY 1`,
            role === "comite_evaluador" ? [userId] : [],
          )
        ).rows.map((r) => ({
          label: `Rango ${r.label}`,
          value: r.value,
        })),
      );
      res.json({
        role,
        title: role === "comite_evaluador" ? "Mis evaluaciones del Comité" : "Estadísticas del Comité Técnico",
        kpis: [
          { label: "Propuestas en alcance", value: kpisBase.totalAlcance },
          { label: "Evaluaciones registradas", value: evaluaciones.reduce((a, b) => a + b.value, 0) },
          { label: "Aprobadas", value: kpisBase.aprobadas },
          { label: "En evaluación", value: porEstado.find((p) => p.label === "en_evaluacion")?.value ?? 0 },
        ],
        charts: [
          { id: "eval-estado", title: "Evaluaciones por estado", type: "pie", series: evaluaciones },
          { id: "puntajes", title: "Distribución de puntajes", type: "bar", series: puntajes },
        ],
      });
      return;
    }

    if (role === "consejo_asistente" || role === "consejo" || role === "direccion_escuela") {
      const avales = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT COALESCE(a.resultado,'pendiente') AS label, COUNT(*)::text AS value
             FROM propuesta p
             LEFT JOIN lateral (
               SELECT resultado FROM aval_consejo av WHERE av.id_propuesta=p.id_propuesta
               ORDER BY av.id_aval DESC LIMIT 1
             ) a ON true
             WHERE ${scope.sql}
             GROUP BY 1 ORDER BY COUNT(*) DESC`,
            scope.params,
          )
        ).rows,
      );
      res.json({
        role,
        title: "Estadísticas de Consejo de Escuela",
        kpis: [
          { label: "Expedientes en alcance", value: kpisBase.totalAlcance },
          { label: "Avales favorables", value: avales.find((p) => /favor|aprob|aval/i.test(p.label))?.value ?? 0 },
          { label: "Sin aval / pendientes", value: avales.find((p) => p.label === "pendiente")?.value ?? 0 },
          { label: "Rechazadas", value: kpisBase.rechazadas },
        ],
        charts: [
          { id: "avales", title: "Resultados de aval", type: "pie", series: avales },
          { id: "estados", title: "Propuestas por estado", type: "bar", series: porEstado },
        ],
      });
      return;
    }

    if (role === "gestora_vie" || role === "cie" || role === "direccion_investigacion") {
      const resoluciones = asSeries(
        (
          await query<{ label: string; value: string }>(
            `SELECT COALESCE(r.resultado, p.estado_actual) AS label, COUNT(*)::text AS value
             FROM propuesta p
             LEFT JOIN resolucion_cie r ON r.id_propuesta = p.id_propuesta
             WHERE ${scope.sql}
             GROUP BY 1 ORDER BY COUNT(*) DESC`,
            scope.params,
          )
        ).rows,
      );
      res.json({
        role,
        title:
          role === "cie"
            ? "Estadísticas CIE"
            : role === "gestora_vie"
              ? "Estadísticas Gestora VIE"
              : "Estadísticas Dirección de Investigación",
        kpis: [
          { label: "En pipeline", value: kpisBase.totalAlcance },
          { label: "Aprobadas", value: kpisBase.aprobadas },
          { label: "Rechazadas", value: kpisBase.rechazadas },
          { label: "Escuelas representadas", value: porEscuela.length },
        ],
        charts: [
          { id: "funnel", title: "Embudo por estado", type: "bar", series: porEstado },
          { id: "resoluciones", title: "Resoluciones / resultados", type: "pie", series: resoluciones },
          { id: "escuelas", title: "Volumen por escuela", type: "bar", series: porEscuela },
        ],
      });
      return;
    }

    // admin y fallback
    res.json({
      role,
      title: "Estadísticas institucionales",
      kpis: [
        { label: "Propuestas en alcance", value: kpisBase.totalAlcance },
        { label: "Aprobadas", value: kpisBase.aprobadas },
        { label: "Rechazadas", value: kpisBase.rechazadas },
        { label: "Escuelas", value: porEscuela.length },
      ],
      charts: [
        { id: "funnel", title: "Embudo global por estado", type: "bar", series: porEstado },
        { id: "escuelas", title: "Volumen por escuela", type: "bar", series: porEscuela },
        { id: "envios", title: "Envíos mensuales", type: "line", series: enviosMes },
      ],
    });
  }),
);

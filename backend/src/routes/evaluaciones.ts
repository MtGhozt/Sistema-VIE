import { Router } from "express";
import { pool, query } from "../db.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";

/**
 * CU3 / CU4 — Persistencia de dictamen PI, resultado de comité, aval y resolución CIE.
 *
 * Las pantallas del frontend siguen siendo por rol; este router escribe en Postgres
 * y avanza `propuesta.estado_actual` / `etapa_flujo` para que el histórico (CU5)
 * refleje las decisiones.
 *
 * etapa_flujo (alineado al seed):
 *   0 redacción · 1 vinculación/envío · 2 comité · 3 consejo · 4 VIE · 5 CIE · 6 resolución
 */

export const evaluacionesRouter = Router();

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  en_evaluacion: "En evaluación",
  dictaminada: "Dictaminada",
  avalada: "Avalada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const MODALIDAD_LABEL: Record<string, string> = {
  basica: "Investigación básica",
  aplicada: "Investigación aplicada",
  basica_aplicada: "Investigación básica y aplicada",
  desarrollo_tecnologico: "Desarrollo tecnológico",
  fortalecimiento: "Fortalecimiento",
};

type BandejaRow = {
  id_propuesta: number;
  codigo: string;
  titulo: string;
  modalidad: string;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  resumen: string | null;
  abstract_en: string | null;
  requiere_dictamen_pi: boolean;
  escuela_nombre: string;
  coordinador_nombre: string;
  convocatoria_nombre: string;
  oficio_pi: string | null;
  oficio_comite: string | null;
  oficio_aval: string | null;
  resolucion: string | null;
  calificacion_comite: string | null;
};

const BANDEJA_SQL = `
  SELECT
    p.id_propuesta,
    p.codigo,
    p.titulo,
    p.modalidad,
    p.estado_actual,
    p.etapa_flujo,
    p.fecha_envio,
    p.resumen,
    p.abstract_en,
    p.requiere_dictamen_pi,
    e.nombre AS escuela_nombre,
    u.nombre_completo AS coordinador_nombre,
    c.nombre AS convocatoria_nombre,
    dpi.numero_oficio AS oficio_pi,
    rc.numero_oficio AS oficio_comite,
    av.numero_oficio AS oficio_aval,
    r.numero_resolucion AS resolucion,
    rc.calificacion_promedio::text AS calificacion_comite
  FROM propuesta p
  JOIN escuela e ON e.id_escuela = p.id_escuela
  JOIN usuario u ON u.id_usuario = p.id_coordinador
  JOIN convocatoria c ON c.id_convocatoria = p.id_convocatoria
  LEFT JOIN dictamen_pi dpi ON dpi.id_propuesta = p.id_propuesta
  LEFT JOIN resultado_comite rc ON rc.id_propuesta = p.id_propuesta
  LEFT JOIN aval_consejo av ON av.id_propuesta = p.id_propuesta
  LEFT JOIN resolucion_cie r ON r.id_propuesta = p.id_propuesta
  WHERE p.estado_actual <> 'borrador'
`;

function mapBandeja(row: BandejaRow) {
  return {
    id: row.id_propuesta,
    codigo: row.codigo,
    titulo: row.titulo,
    modalidad: row.modalidad,
    modalidadLabel: MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
    estadoActual: row.estado_actual,
    estadoLabel: ESTADO_LABEL[row.estado_actual] ?? row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
    resumen: row.resumen,
    abstractEn: row.abstract_en,
    piRequired: row.requiere_dictamen_pi,
    escuela: row.escuela_nombre,
    investigadora: row.coordinador_nombre,
    convocatoria: row.convocatoria_nombre,
    oficioPI: row.oficio_pi,
    oficioComite: row.oficio_comite,
    oficioAval: row.oficio_aval,
    resolucion: row.resolucion,
    evaluacionComite: row.calificacion_comite
      ? { average: Number(row.calificacion_comite) }
      : null,
  };
}

/** Roles que pueden operar cada acción del prototipo. */
const ACTION_ROLES: Record<string, Set<string>> = {
  pi: new Set(["vinculacion", "admin"]),
  "committee-ready": new Set(["comite_asistente", "admin"]),
  return: new Set(["comite_asistente", "admin"]),
  "save-rubric": new Set(["comite_evaluador", "cie", "admin"]),
  "committee-score": new Set(["comite_evaluador", "admin"]),
  "send-council": new Set(["consejo_asistente", "admin"]),
  "council-approve": new Set(["consejo", "admin"]),
  "council-reject": new Set(["consejo", "admin"]),
  "communicate-aval": new Set(["direccion_escuela", "admin"]),
  "vie-observation": new Set(["gestora_vie", "admin"]),
  "send-cie": new Set(["gestora_vie", "admin"]),
  "cie-approve": new Set(["cie", "admin"]),
  "cie-reject": new Set(["cie", "admin"]),
  "notify-resolution": new Set(["direccion_investigacion", "admin"]),
};

function roleOk(role: string | null | undefined, action: string) {
  const allowed = ACTION_ROLES[action];
  if (!allowed) return false;
  return !!role && allowed.has(role);
}

/** Filtro de bandeja por rol (etapa / estado). */
function bandejaClause(role: string | null | undefined): {
  sql: string;
  params: unknown[];
} {
  switch (role) {
    case "vinculacion":
      return {
        sql: ` AND p.etapa_flujo <= 1 AND p.estado_actual IN ('enviada', 'en_evaluacion')`,
        params: [],
      };
    case "comite_asistente":
    case "comite_evaluador":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 1 AND 2 AND p.estado_actual IN ('enviada', 'en_evaluacion', 'dictaminada')`,
        params: [],
      };
    case "consejo_asistente":
    case "consejo":
    case "direccion_escuela":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 2 AND 3 AND p.estado_actual IN ('en_evaluacion', 'dictaminada', 'avalada')`,
        params: [],
      };
    case "gestora_vie":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 3 AND 4 AND p.estado_actual IN ('dictaminada', 'avalada')`,
        params: [],
      };
    case "cie":
      return {
        sql: ` AND p.etapa_flujo >= 4 AND p.estado_actual IN ('avalada', 'en_evaluacion', 'dictaminada') AND p.estado_actual NOT IN ('aprobada', 'rechazada')`,
        params: [],
      };
    case "direccion_investigacion":
      return {
        sql: ` AND p.estado_actual IN ('aprobada', 'rechazada')`,
        params: [],
      };
    case "admin":
    default:
      return { sql: "", params: [] };
  }
}

async function loadPropuesta(id: number) {
  const result = await query<{
    id_propuesta: number;
    codigo: string;
    estado_actual: string;
    etapa_flujo: number;
    id_escuela: number;
    id_coordinador: number;
    titulo: string;
  }>(
    `SELECT id_propuesta, codigo, estado_actual, etapa_flujo, id_escuela, id_coordinador, titulo
     FROM propuesta WHERE id_propuesta = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function advanceEstado(
  client: { query: typeof pool.query },
  opts: {
    idPropuesta: number;
    estadoAnterior: string;
    estadoNuevo: string;
    etapa: number;
    userId: number;
    observacion: string;
  },
) {
  await client.query(
    `UPDATE propuesta
     SET estado_actual = $1, etapa_flujo = $2
     WHERE id_propuesta = $3`,
    [opts.estadoNuevo, opts.etapa, opts.idPropuesta],
  );
  await client.query(
    `INSERT INTO propuesta_historial_estado (
       id_propuesta, estado_anterior, estado_nuevo, id_usuario, fecha_hora, observacion
     ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
    [
      opts.idPropuesta,
      opts.estadoAnterior,
      opts.estadoNuevo,
      opts.userId,
      opts.observacion.slice(0, 500),
    ],
  );
}

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function yes(v: unknown): boolean {
  const s = str(v).toLowerCase();
  return s === "sí" || s === "si" || s === "true" || s === "1";
}

/** Listado de expedientes para la bandeja del rol actual. */
evaluacionesRouter.get(
  "/evaluaciones/bandeja",
  requireDemoAuth,
  async (req, res) => {
    const role = req.demoAuth!.role;
    const clause = bandejaClause(role);
    const result = await query<BandejaRow>(
      `${BANDEJA_SQL}${clause.sql}
       ORDER BY p.fecha_envio DESC NULLS LAST, p.id_propuesta DESC
       LIMIT 100`,
      clause.params,
    );
    res.json({
      role,
      items: result.rows.map(mapBandeja),
      total: result.rows.length,
    });
  },
);

/** Detalle de un expediente en bandeja (por id numérico). */
evaluacionesRouter.get(
  "/evaluaciones/propuestas/:id",
  requireDemoAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    const result = await query<BandejaRow>(
      `${BANDEJA_SQL} AND p.id_propuesta = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    res.json(mapBandeja(row));
  },
);

/**
 * Ejecuta una acción de evaluación del prototipo.
 * Body: { action: string, payload?: object }
 */
evaluacionesRouter.post(
  "/evaluaciones/propuestas/:id/acciones",
  requireDemoAuth,
  async (req, res) => {
    const id = Number(req.params.id);
    const action = str(req.body?.action);
    const payload = asRecord(req.body?.payload);
    const role = req.demoAuth!.role;
    const userId = req.demoAuth!.userId!;

    if (!Number.isFinite(id) || !action) {
      res.status(400).json({ error: "id y action son obligatorios" });
      return;
    }
    if (!roleOk(role, action)) {
      res.status(403).json({
        error: `El rol ${role ?? "(ninguno)"} no puede ejecutar la acción "${action}"`,
      });
      return;
    }

    const propuesta = await loadPropuesta(id);
    if (!propuesta) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    if (propuesta.estado_actual === "borrador") {
      res.status(400).json({ error: "La propuesta aún está en borrador" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let message = "Acción registrada";
      const prev = propuesta.estado_actual;

      switch (action) {
        case "pi": {
          const oficio =
            str(payload.oficio) ||
            `CV-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const fecha = str(payload.fecha) || new Date().toISOString().slice(0, 10);
          await client.query(
            `
            INSERT INTO dictamen_pi (
              id_propuesta, id_emisor, potencial_proteccion, es_innovador,
              activo_identificable, mecanismo_pi, novedad, titularidad,
              recomendaciones_divulgacion, confidencialidad, analisis_tecnico,
              recomendaciones_vinculacion, numero_oficio, fecha_dictamen, estado
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::date, 'emitido'
            )
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_emisor = EXCLUDED.id_emisor,
              potencial_proteccion = EXCLUDED.potencial_proteccion,
              es_innovador = EXCLUDED.es_innovador,
              activo_identificable = EXCLUDED.activo_identificable,
              mecanismo_pi = EXCLUDED.mecanismo_pi,
              novedad = EXCLUDED.novedad,
              titularidad = EXCLUDED.titularidad,
              recomendaciones_divulgacion = EXCLUDED.recomendaciones_divulgacion,
              confidencialidad = EXCLUDED.confidencialidad,
              analisis_tecnico = EXCLUDED.analisis_tecnico,
              recomendaciones_vinculacion = EXCLUDED.recomendaciones_vinculacion,
              numero_oficio = EXCLUDED.numero_oficio,
              fecha_dictamen = EXCLUDED.fecha_dictamen,
              estado = 'emitido'
            `,
            [
              id,
              userId,
              yes(payload.potencial),
              yes(payload.innovacion),
              str(payload.tipoActivo).slice(0, 200) || null,
              str(payload.tipoPI).slice(0, 200) || null,
              str(payload.novedad) || null,
              str(payload.titularidad) || null,
              str(payload.divulgacion) || null,
              str(payload.confidencialidad) || null,
              str(payload.analisis) || null,
              str(payload.recomendaciones) || null,
              oficio.slice(0, 40),
              fecha,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 2),
            userId,
            observacion: `Dictamen PI emitido (${oficio})`,
          });
          message = "Dictamen de PI emitido y oficio agregado al expediente.";
          break;
        }

        case "committee-ready": {
          await client.query(
            `
            INSERT INTO revision_expediente (
              id_propuesta, etapa, ciclo, id_revisor, resultado, fecha_inicio, fecha_fin
            ) VALUES ($1, 'comite', 1, $2, 'completo', NOW(), NOW())
            ON CONFLICT (id_propuesta, etapa, ciclo) DO UPDATE SET
              id_revisor = EXCLUDED.id_revisor,
              resultado = 'completo',
              fecha_fin = NOW()
            `,
            [id, userId],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 2),
            userId,
            observacion: "Expediente marcado completo para el cuerpo evaluador",
          });
          message = "Propuesta enviada al cuerpo evaluador.";
          break;
        }

        case "return": {
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La observación es obligatoria" });
            return;
          }
          const rev = await client.query<{ id_revision: number }>(
            `
            INSERT INTO revision_expediente (
              id_propuesta, etapa, ciclo, id_revisor, resultado, fecha_inicio, fecha_fin
            ) VALUES ($1, 'comite', 1, $2, 'devuelto', NOW(), NOW())
            ON CONFLICT (id_propuesta, etapa, ciclo) DO UPDATE SET
              id_revisor = EXCLUDED.id_revisor,
              resultado = 'devuelto',
              fecha_fin = NOW()
            RETURNING id_revision
            `,
            [id, userId],
          );
          const idRevision = rev.rows[0]?.id_revision;
          await client.query(
            `
            INSERT INTO observacion (
              id_propuesta, id_revision, etapa, id_creada_por, mensaje,
              requiere_respuesta, fecha_creacion
            ) VALUES ($1, $2, 'comite', $3, $4, true, NOW())
            `,
            [id, idRevision ?? null, userId, texto],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "enviada",
            etapa: 1,
            userId,
            observacion: `Devuelta con observaciones: ${texto.slice(0, 200)}`,
          });
          message = "Propuesta devuelta con observaciones.";
          break;
        }

        case "save-rubric": {
          message = "Los cambios de la evaluación se guardaron correctamente.";
          break;
        }

        case "committee-score": {
          const promedio = Number(payload.average ?? payload.promedio ?? 80);
          const oficio =
            str(payload.oficio) ||
            `CT-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const fundamento =
            str(payload.fundamento) ||
            str(payload.texto) ||
            "Evaluación del Comité Técnico registrada desde el prototipo.";
          await client.query(
            `
            INSERT INTO resultado_comite (
              id_propuesta, recomendacion, calificacion_promedio, numero_oficio,
              fundamento, fecha_dictamen, id_coordinador_comite
            ) VALUES ($1, 'recomienda', $2, $3, $4, CURRENT_DATE, $5)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              recomendacion = 'recomienda',
              calificacion_promedio = EXCLUDED.calificacion_promedio,
              numero_oficio = EXCLUDED.numero_oficio,
              fundamento = EXCLUDED.fundamento,
              fecha_dictamen = CURRENT_DATE,
              id_coordinador_comite = EXCLUDED.id_coordinador_comite
            `,
            [
              id,
              Number.isFinite(promedio) ? promedio : 80,
              oficio.slice(0, 40),
              fundamento,
              userId,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "dictaminada",
            etapa: Math.max(propuesta.etapa_flujo, 3),
            userId,
            observacion: `Dictamen del Comité (${oficio})`,
          });
          message = "Evaluación completada y preparada para consolidación.";
          break;
        }

        case "send-council": {
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: prev === "dictaminada" ? "dictaminada" : "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 3),
            userId,
            observacion: "Expediente enviado al Consejo de Profesores",
          });
          message = "Expediente enviado al Consejo de Profesores.";
          break;
        }

        case "council-approve":
        case "council-reject": {
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La justificación es obligatoria" });
            return;
          }
          const aprueba = action === "council-approve";
          const oficio =
            str(payload.oficio) ||
            `ESC-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          await client.query(
            `
            INSERT INTO aval_consejo (
              id_propuesta, id_aprobador, resultado, articulo,
              numero_oficio, observaciones, fecha_aval
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_aprobador = EXCLUDED.id_aprobador,
              resultado = EXCLUDED.resultado,
              articulo = EXCLUDED.articulo,
              numero_oficio = EXCLUDED.numero_oficio,
              observaciones = EXCLUDED.observaciones,
              fecha_aval = CURRENT_DATE
            `,
            [
              id,
              userId,
              aprueba ? "aprueba" : "rechaza",
              "Art. 12 del Reglamento",
              oficio.slice(0, 40),
              texto,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: aprueba ? "avalada" : "rechazada",
            etapa: aprueba ? Math.max(propuesta.etapa_flujo, 4) : 6,
            userId,
            observacion: aprueba
              ? `Aval aprobado (${oficio})`
              : `Aval rechazado (${oficio}): ${texto.slice(0, 200)}`,
          });
          message = aprueba
            ? "Aval aprobado y oficio generado."
            : "Aval rechazado correctamente. Justificación registrada.";
          break;
        }

        case "communicate-aval": {
          await client.query(
            `
            INSERT INTO comunicacion_institucional (
              id_propuesta, tipo, id_emisor, destinatario_texto,
              confirmada, fecha_envio, mensaje
            ) VALUES ($1, 'aval_consejo', $2, 'VIE / Dirección de Investigación', false, NOW(), $3)
            `,
            [
              id,
              userId,
              `Comunicación de aval de la propuesta ${propuesta.codigo}`,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: prev === "rechazada" ? "rechazada" : "avalada",
            etapa: Math.max(propuesta.etapa_flujo, 4),
            userId,
            observacion: "Aval comunicado a VIE",
          });
          message =
            "Memorando generado · Envío simulado a Dirección de Investigación / VIE.";
          break;
        }

        case "vie-observation": {
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La observación es obligatoria" });
            return;
          }
          await client.query(
            `
            INSERT INTO observacion (
              id_propuesta, etapa, id_creada_por, mensaje,
              requiere_respuesta, fecha_creacion
            ) VALUES ($1, 'vie', $2, $3, true, NOW())
            `,
            [id, userId, texto],
          );
          message = "Observación enviada correctamente al equipo investigador.";
          break;
        }

        case "send-cie": {
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "avalada",
            etapa: Math.max(propuesta.etapa_flujo, 5),
            userId,
            observacion: "Expediente remitido al CIE",
          });
          message = "Expediente enviado al CIE.";
          break;
        }

        case "cie-approve":
        case "cie-reject": {
          const fundamento =
            str(payload.texto) ||
            str(payload.fundamento) ||
            (action === "cie-approve"
              ? "Resolución aprobatoria del CIE."
              : "Resolución de rechazo del CIE.");
          if (action === "cie-reject" && !str(payload.texto) && !str(payload.fundamento)) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La justificación es obligatoria" });
            return;
          }
          const numero =
            str(payload.numero) ||
            `CIE-RES-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const resultado = action === "cie-approve" ? "aprobada" : "rechazada";
          await client.query(
            `
            INSERT INTO resolucion_cie (
              id_propuesta, id_responsable, resultado, numero_resolucion,
              fundamento, fecha_resolucion
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_responsable = EXCLUDED.id_responsable,
              resultado = EXCLUDED.resultado,
              numero_resolucion = EXCLUDED.numero_resolucion,
              fundamento = EXCLUDED.fundamento,
              fecha_resolucion = CURRENT_DATE
            `,
            [id, userId, resultado, numero.slice(0, 40), fundamento],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: resultado,
            etapa: 6,
            userId,
            observacion: `Resolución CIE ${numero}: ${resultado}`,
          });
          message =
            action === "cie-approve"
              ? "Resolución aprobatoria emitida."
              : "Resolución de rechazo emitida. Justificación registrada.";
          break;
        }

        case "notify-resolution": {
          await client.query(
            `
            INSERT INTO notificacion (
              id_usuario_destino, id_propuesta, titulo, mensaje, leida, fecha_hora
            ) VALUES ($1, $2, $3, $4, false, NOW())
            `,
            [
              propuesta.id_coordinador,
              id,
              `Resolución de ${propuesta.codigo}`,
              `Se notificó formalmente el resultado de la propuesta «${propuesta.titulo}».`,
            ],
          );
          await client.query(
            `
            INSERT INTO comunicacion_institucional (
              id_propuesta, tipo, id_emisor, id_destinatario,
              confirmada, fecha_envio, mensaje
            ) VALUES ($1, 'resolucion_cie', $2, $3, true, NOW(), $4)
            `,
            [
              id,
              userId,
              propuesta.id_coordinador,
              `Notificación de resolución de ${propuesta.codigo}`,
            ],
          );
          message =
            "CIE-453 generado · notificación simulada · expediente en Histórico.";
          break;
        }

        default:
          await client.query("ROLLBACK");
          res.status(400).json({ error: `Acción desconocida: ${action}` });
          return;
      }

      await client.query("COMMIT");

      const refreshed = await query<BandejaRow>(
        `${BANDEJA_SQL} AND p.id_propuesta = $1`,
        [id],
      );
      res.json({
        message,
        action,
        propuesta: refreshed.rows[0] ? mapBandeja(refreshed.rows[0]) : null,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[evaluaciones]", action, detail);
      res.status(500).json({ error: "No se pudo persistir la acción", detail });
    } finally {
      client.release();
    }
  },
);

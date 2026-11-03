import { Router } from "express";
import { query } from "../db.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const notificacionesRouter = Router();
notificacionesRouter.use(requireDemoAuth);
notificacionesRouter.get("/notificaciones", asyncHandler(async (req, res) => {
  const rows = await query<{ id_notificacion: number; titulo: string; mensaje: string; leida: boolean; fecha_hora: Date }>(
    `SELECT id_notificacion, titulo, mensaje, leida, fecha_hora FROM notificacion
     WHERE id_usuario_destino=$1 ORDER BY fecha_hora DESC, id_notificacion DESC`, [req.demoAuth!.userId],
  );
  res.json(rows.rows.map(n => ({ id: String(n.id_notificacion), title: n.titulo, body: n.mensaje, when: n.fecha_hora, unread: !n.leida })));
}));
notificacionesRouter.patch("/notificaciones/leidas", asyncHandler(async (req, res) => {
  await query("UPDATE notificacion SET leida=true WHERE id_usuario_destino=$1", [req.demoAuth!.userId]);
  res.sendStatus(204);
}));
notificacionesRouter.patch("/notificaciones/:id/leida", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "ID de notificación inválido" }); return; }
  const result = await query("UPDATE notificacion SET leida=true WHERE id_notificacion=$1 AND id_usuario_destino=$2 RETURNING id_notificacion", [id, req.demoAuth!.userId]);
  if (!result.rowCount) { res.status(404).json({ error: "Notificación no encontrada" }); return; }
  res.sendStatus(204);
}));

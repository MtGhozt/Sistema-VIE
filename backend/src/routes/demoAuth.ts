import { Router } from "express";
import { query } from "../db.js";

export const demoRouter = Router();

/** Lista roles + usuarios seed para el login demo (sin password real). */
demoRouter.get("/demo/roles", async (_req, res) => {
  const result = await query<{
    codigo: string;
    nombre: string;
    correo_institucional: string;
    nombre_completo: string;
    id_usuario: number;
  }>(`
    SELECT r.codigo, r.nombre, u.correo_institucional, u.nombre_completo, u.id_usuario
    FROM rol r
    JOIN usuario_rol ur ON ur.id_rol = r.id_rol
    JOIN usuario u ON u.id_usuario = ur.id_usuario
    WHERE u.correo_institucional = r.codigo || '@tec.ac.cr'
    ORDER BY r.id_rol
  `);
  res.json(result.rows);
});

demoRouter.post("/demo/login", async (req, res) => {
  const roleCode = String(req.body?.roleCode ?? "").trim();
  if (!roleCode) {
    res.status(400).json({ error: "roleCode es obligatorio" });
    return;
  }

  const result = await query<{
    id_usuario: number;
    correo_institucional: string;
    nombre_completo: string;
    codigo: string;
    nombre: string;
  }>(`
    SELECT u.id_usuario, u.correo_institucional, u.nombre_completo, r.codigo, r.nombre
    FROM usuario u
    JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
    JOIN rol r ON r.id_rol = ur.id_rol
    WHERE r.codigo = $1
      AND u.correo_institucional = r.codigo || '@tec.ac.cr'
    LIMIT 1
  `, [roleCode]);

  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ error: "Rol demo no encontrado. ¿Corriste el seed?" });
    return;
  }

  res.json({
    user: {
      id: row.id_usuario,
      email: row.correo_institucional,
      name: row.nombre_completo,
      roleCode: row.codigo,
      roleName: row.nombre,
    },
    mode: "demo",
  });
});

import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router } from "express";
import { scrypt, timingSafeEqual } from "node:crypto";
import { query } from "../db.js";

export const demoRouter = Router();

function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !/^[a-f0-9]{32}$/i.test(saltHex ?? "") ||
    !/^[a-f0-9]{128}$/i.test(hashHex ?? "")
  ) {
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    scrypt(password, Buffer.from(saltHex, "hex"), 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(timingSafeEqual(derivedKey, Buffer.from(hashHex, "hex")));
    });
  });
}

/** Lista roles + usuarios seed para el login demo (sin password real). */
demoRouter.get("/demo/roles", asyncHandler(async (_req, res) => {
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
}));

demoRouter.post("/demo/login", asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const roleCode = typeof req.body?.roleCode === "string" ? req.body.roleCode.trim() : "";
  if (!email || !password || !roleCode) {
    res.status(400).json({ error: "Correo, contraseña y rol son obligatorios" });
    return;
  }

  const result = await query<{
    id_usuario: number;
    clave_hash: string;
    correo_institucional: string;
    nombre_completo: string;
    codigo: string;
    nombre: string;
  }>(`
    SELECT u.id_usuario, u.clave_hash, u.correo_institucional, u.nombre_completo, r.codigo, r.nombre
    FROM usuario u
    JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
    JOIN rol r ON r.id_rol = ur.id_rol
    WHERE lower(u.correo_institucional) = lower($1)
      AND r.codigo = $2
      AND u.activo = true
    LIMIT 1
  `, [email, roleCode]);

  const row = result.rows[0];
  if (!row || !(await verifyPassword(password, row.clave_hash))) {
    res.status(401).json({ error: "Correo, contraseña o rol incorrectos" });
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
}));

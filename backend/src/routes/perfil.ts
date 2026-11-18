import { Router, raw } from "express";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";
import { HttpError } from "../middleware/HttpError.js";
import { query } from "../db.js";

export const perfilRouter = Router();

const perfilesRoot = path.resolve(
  process.env.PERFILES_DIR ??
    fileURLToPath(
      new URL(
        process.env.NODE_ENV === "test"
          ? "../../../var/perfiles-pruebas/"
          : "../../../var/perfiles/",
        import.meta.url,
      ),
    ),
);

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function formatOrcid(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(raw)) {
    throw new HttpError(400, "ORCID inválido. Use el formato 0000-0000-0000-000X.");
  }
  return raw.toUpperCase();
}

function formatCedula(value: unknown): string | null {
  const raw = String(value ?? "").replace(/\D/g, "").slice(0, 9);
  if (!raw) return null;
  if (raw.length !== 9 || raw.startsWith("0")) {
    throw new HttpError(400, "Cédula inválida. Use nueve dígitos en formato X-XXXX-XXXX.");
  }
  return [raw.slice(0, 1), raw.slice(1, 5), raw.slice(5)].join("-");
}

perfilRouter.get(
  "/perfil",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const userId = req.demoAuth!.userId!;
    const user = (
      await query<{
        id: number;
        correo: string;
        nombre: string;
        cedula: string | null;
        orcid: string | null;
        escuela_id: number | null;
        escuela: string | null;
        foto_ruta: string | null;
        preferencias: Record<string, unknown>;
        activo: boolean;
        fecha_registro: Date;
      }>(
        `SELECT u.id_usuario AS id, u.correo_institucional AS correo, u.nombre_completo AS nombre,
          u.cedula, u.orcid, u.id_escuela AS escuela_id, e.nombre AS escuela,
          u.foto_ruta, COALESCE(u.preferencias, '{}'::jsonb) AS preferencias,
          u.activo, u.fecha_registro
         FROM usuario u
         LEFT JOIN escuela e ON e.id_escuela = u.id_escuela
         WHERE u.id_usuario = $1`,
        [userId],
      )
    ).rows[0];
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    const roles = (
      await query<{ codigo: string; nombre: string }>(
        `SELECT r.codigo, r.nombre FROM usuario_rol ur
         JOIN rol r ON r.id_rol = ur.id_rol
         WHERE ur.id_usuario = $1 ORDER BY r.nombre`,
        [userId],
      )
    ).rows;

    const counts = (
      await query<{ coordinadas: string; participaciones: string }>(
        `SELECT
          (SELECT COUNT(*)::text FROM propuesta WHERE id_coordinador = $1) AS coordinadas,
          (SELECT COUNT(*)::text FROM propuesta_participante WHERE id_usuario = $1) AS participaciones`,
        [userId],
      )
    ).rows[0];

    const recientes = (
      await query<{ codigo: string; titulo: string; estado: string; fecha: Date | null }>(
        `SELECT p.codigo, p.titulo, p.estado_actual AS estado, p.fecha_envio AS fecha
         FROM propuesta p
         WHERE p.id_coordinador = $1
            OR EXISTS (
              SELECT 1 FROM propuesta_participante pp
              WHERE pp.id_propuesta = p.id_propuesta AND pp.id_usuario = $1
            )
         ORDER BY COALESCE(p.fecha_envio, to_timestamp(p.id_propuesta)) DESC NULLS LAST
         LIMIT 5`,
        [userId],
      )
    ).rows;

    res.json({
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      cedula: user.cedula,
      orcid: user.orcid,
      escuelaId: user.escuela_id,
      escuela: user.escuela,
      fotoUrl: user.foto_ruta ? `/api/perfil/foto/${user.id}` : null,
      preferencias: user.preferencias ?? {},
      activo: user.activo,
      fechaRegistro: user.fecha_registro,
      roles,
      oversight: {
        propuestasCoordinadas: Number(counts?.coordinadas ?? 0),
        participaciones: Number(counts?.participaciones ?? 0),
        recientes: recientes.map((r) => ({
          codigo: r.codigo,
          titulo: r.titulo,
          estado: r.estado,
          fecha: r.fecha ? r.fecha.toISOString() : null,
        })),
      },
    });
  }),
);

perfilRouter.patch(
  "/perfil",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const userId = req.demoAuth!.userId!;
    const body = req.body ?? {};
    const current = (
      await query<{
        nombre_completo: string;
        cedula: string | null;
        orcid: string | null;
        preferencias: Record<string, unknown>;
      }>("SELECT nombre_completo, cedula, orcid, preferencias FROM usuario WHERE id_usuario=$1", [
        userId,
      ])
    ).rows[0];
    if (!current) throw new HttpError(404, "Usuario no encontrado");

    const nombre =
      body.nombre !== undefined
        ? String(body.nombre).trim().slice(0, 150)
        : current.nombre_completo;
    if (!nombre) throw new HttpError(400, "El nombre completo es obligatorio");

    const cedula =
      body.cedula !== undefined ? formatCedula(body.cedula) : current.cedula;
    const orcid =
      body.orcid !== undefined ? formatOrcid(body.orcid) : current.orcid;

    let preferencias = current.preferencias ?? {};
    if (body.preferencias && typeof body.preferencias === "object") {
      preferencias = { ...preferencias, ...body.preferencias };
    }

    await query(
      `UPDATE usuario SET nombre_completo=$2, cedula=$3, orcid=$4, preferencias=$5::jsonb
       WHERE id_usuario=$1`,
      [userId, nombre, cedula, orcid, JSON.stringify(preferencias)],
    );

    res.json({ ok: true, nombre, cedula, orcid, preferencias });
  }),
);

perfilRouter.post(
  "/perfil/foto",
  requireDemoAuth,
  raw({ type: ["image/jpeg", "image/png", "image/webp", "application/octet-stream"], limit: "2mb" }),
  asyncHandler(async (req, res) => {
    const userId = req.demoAuth!.userId!;
    const contentType = String(req.headers["content-type"] ?? "image/jpeg").split(";")[0].trim();
    const ext = IMAGE_TYPES[contentType] ?? ".jpg";
    const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    if (data.length < 32) throw new HttpError(400, "La imagen está vacía o es inválida");
    if (data.length > 2 * 1024 * 1024) throw new HttpError(413, "La foto supera 2 MiB");

    const previous = (
      await query<{ foto_ruta: string | null }>("SELECT foto_ruta FROM usuario WHERE id_usuario=$1", [
        userId,
      ])
    ).rows[0];

    await mkdir(perfilesRoot, { recursive: true });
    const key = `${userId}-${randomUUID()}${ext}`;
    const stored = path.join(perfilesRoot, key);
    await writeFile(stored, data, { flag: "wx" });
    await query("UPDATE usuario SET foto_ruta=$2 WHERE id_usuario=$1", [userId, key]);

    if (previous?.foto_ruta) {
      try {
        await unlink(path.join(perfilesRoot, path.basename(previous.foto_ruta)));
      } catch {
        /* ignore missing previous file */
      }
    }

    res.status(201).json({ fotoUrl: `/api/perfil/foto/${userId}` });
  }),
);

perfilRouter.delete(
  "/perfil/foto",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const userId = req.demoAuth!.userId!;
    const previous = (
      await query<{ foto_ruta: string | null }>("SELECT foto_ruta FROM usuario WHERE id_usuario=$1", [
        userId,
      ])
    ).rows[0];
    await query("UPDATE usuario SET foto_ruta=NULL WHERE id_usuario=$1", [userId]);
    if (previous?.foto_ruta) {
      try {
        await unlink(path.join(perfilesRoot, path.basename(previous.foto_ruta)));
      } catch {
        /* ignore */
      }
    }
    res.sendStatus(204);
  }),
);

perfilRouter.get(
  "/perfil/foto/:id",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "id inválido");
    const row = (
      await query<{ foto_ruta: string | null }>(
        "SELECT foto_ruta FROM usuario WHERE id_usuario=$1 AND activo=true",
        [id],
      )
    ).rows[0];
    if (!row?.foto_ruta) throw new HttpError(404, "Foto no disponible");
    const filePath = path.join(perfilesRoot, path.basename(row.foto_ruta));
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(data);
  }),
);

perfilRouter.get(
  "/personas/sugeridas",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const userId = req.demoAuth!.userId!;
    const self = (
      await query<{
        id: number;
        nombre: string;
        orcid: string | null;
        cedula: string | null;
        instancia: string | null;
      }>(
        `SELECT u.id_usuario AS id, u.nombre_completo AS nombre, u.orcid, u.cedula,
          e.nombre AS instancia
         FROM usuario u LEFT JOIN escuela e ON e.id_escuela=u.id_escuela
         WHERE u.id_usuario=$1`,
        [userId],
      )
    ).rows[0];

    const pineados = (
      await query<{
        id: number;
        nombre: string;
        orcid: string | null;
        instancia: string | null;
        id_usuario_referido: number | null;
      }>(
        `SELECT id_contacto AS id, nombre_completo AS nombre, orcid,
          instancia_o_institucion AS instancia, id_usuario_referido
         FROM usuario_contacto_pineado
         WHERE id_usuario=$1
         ORDER BY fecha DESC
         LIMIT 30`,
        [userId],
      )
    ).rows;

    const recientes = (
      await query<{
        nombre: string;
        orcid: string | null;
        instancia: string | null;
        id_usuario: number | null;
      }>(
        `SELECT DISTINCT ON (lower(pp.nombre_completo))
          pp.nombre_completo AS nombre, pp.orcid, pp.instancia_o_institucion AS instancia,
          pp.id_usuario
         FROM propuesta_participante pp
         JOIN propuesta p ON p.id_propuesta = pp.id_propuesta
         WHERE p.id_coordinador = $1
           AND pp.nombre_completo IS NOT NULL
           AND lower(pp.nombre_completo) <> lower($2)
         ORDER BY lower(pp.nombre_completo), pp.id_participante DESC
         LIMIT 40`,
        [userId, self?.nombre ?? ""],
      )
    ).rows;

    const catalogo = (
      await query<{
        id: number;
        nombre: string;
        orcid: string | null;
        cedula: string | null;
        instancia: string | null;
        roles: string[];
      }>(
        `SELECT u.id_usuario AS id, u.nombre_completo AS nombre, u.orcid, u.cedula,
          e.nombre AS instancia,
          ARRAY(SELECT r.codigo FROM usuario_rol ur JOIN rol r ON r.id_rol=ur.id_rol WHERE ur.id_usuario=u.id_usuario) AS roles
         FROM usuario u
         LEFT JOIN escuela e ON e.id_escuela=u.id_escuela
         WHERE u.activo=true AND u.id_usuario <> $1
         ORDER BY u.nombre_completo
         LIMIT 200`,
        [userId],
      )
    ).rows;

    res.json({
      usted: self
        ? {
            idUsuario: self.id,
            nombre: self.nombre,
            orcid: self.orcid,
            cedula: self.cedula,
            instancia: self.instancia,
            etiqueta: "usted",
          }
        : null,
      pineados: pineados.map((p) => ({
        contactoId: p.id,
        idUsuario: p.id_usuario_referido,
        nombre: p.nombre,
        orcid: p.orcid,
        instancia: p.instancia,
        etiqueta: "pineado",
      })),
      anteriores: recientes.map((p) => ({
        idUsuario: p.id_usuario,
        nombre: p.nombre,
        orcid: p.orcid,
        instancia: p.instancia,
        etiqueta: "colaborador anterior",
      })),
      catalogo: catalogo.map((p) => ({
        idUsuario: p.id,
        nombre: p.nombre,
        orcid: p.orcid,
        cedula: p.cedula,
        instancia: p.instancia,
        roles: p.roles,
        etiqueta: "catalogo",
      })),
    });
  }),
);

perfilRouter.post(
  "/personas/pineados",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const userId = req.demoAuth!.userId!;
    const nombre = String(req.body?.nombre ?? "").trim().slice(0, 150);
    if (!nombre) throw new HttpError(400, "Nombre requerido para pinear");
    const orcid = req.body?.orcid ? formatOrcid(req.body.orcid) : null;
    const instancia = String(req.body?.instancia ?? "").trim().slice(0, 200) || null;
    const referido = req.body?.idUsuario ? Number(req.body.idUsuario) : null;

    const row = (
      await query<{ id: number }>(
        `INSERT INTO usuario_contacto_pineado
          (id_usuario, nombre_completo, orcid, instancia_o_institucion, id_usuario_referido)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id_usuario, nombre_completo)
         DO UPDATE SET orcid=EXCLUDED.orcid,
           instancia_o_institucion=EXCLUDED.instancia_o_institucion,
           id_usuario_referido=COALESCE(EXCLUDED.id_usuario_referido, usuario_contacto_pineado.id_usuario_referido),
           fecha=now()
         RETURNING id_contacto AS id`,
        [userId, nombre, orcid, instancia, Number.isFinite(referido) ? referido : null],
      )
    ).rows[0];

    res.status(201).json({ id: row.id });
  }),
);

perfilRouter.delete(
  "/personas/pineados/:id",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const userId = req.demoAuth!.userId!;
    const id = Number(req.params.id);
    const result = await query(
      "DELETE FROM usuario_contacto_pineado WHERE id_contacto=$1 AND id_usuario=$2",
      [id, userId],
    );
    if (!result.rowCount) throw new HttpError(404, "Contacto pineado no encontrado");
    res.sendStatus(204);
  }),
);

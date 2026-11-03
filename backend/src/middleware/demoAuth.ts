import type { Request, Response, NextFunction } from "express";
import { query } from "../db.js";

export type DemoAuth = {
  userId: number | null;
  role: string | null;
};

declare global {
  namespace Express {
    interface Request {
      demoAuth?: DemoAuth;
    }
  }
}

/** Auth demo vía headers (misma sesión localStorage del frontend). */
export function attachDemoAuth(req: Request, _res: Response, next: NextFunction) {
  const userRaw = req.header("x-demo-user-id");
  const role = req.header("x-demo-role")?.trim() || null;
  const userId = userRaw ? Number(userRaw) : null;
  req.demoAuth = {
    userId: Number.isFinite(userId) ? userId : null,
    role,
  };
  next();
}

export function requireDemoAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.demoAuth?.role || !req.demoAuth.userId) {
    res.status(401).json({ error: "Sesión demo requerida (headers X-Demo-User-Id / X-Demo-Role)" });
    return;
  }
  // El encabezado de rol no concede permisos que la identidad no tenga registrados.
  void query(`SELECT 1 FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario
    JOIN rol r ON r.id_rol=ur.id_rol WHERE u.id_usuario=$1 AND u.activo=true AND r.codigo=$2`,
    [req.demoAuth.userId, req.demoAuth.role]).then(result => {
      if (!result.rowCount) { res.status(403).json({error:"Identidad o rol no autorizado"}); return; }
      next();
    }).catch(next);
}

const PUBLISHER_ROLES = new Set(["vie_publicacion", "admin"]);

export function requirePublisher(req: Request, res: Response, next: NextFunction) {
  const role = req.demoAuth?.role;
  if (!role || !PUBLISHER_ROLES.has(role)) {
    res.status(403).json({
      error: "Solo VIE — Publicación o Super Admin pueden modificar convocatorias",
    });
    return;
  }
  next();
}

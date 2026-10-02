import type { Request, Response, NextFunction } from "express";

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
  next();
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

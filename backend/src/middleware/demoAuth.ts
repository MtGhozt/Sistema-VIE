import type { Request, Response, NextFunction } from "express";
import { query } from "../db.js";
import { env } from "../env.js";
import { resolveDemoSession } from "../demoSessions.js";

export type DemoAuth = {
  userId: number | null;
  role: string | null;
  /** Presente cuando la identidad proviene de X-Demo-Session. */
  sessionToken?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      demoAuth?: DemoAuth;
    }
  }
}

async function roleBelongsToUser(userId: number, role: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM usuario u
     JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
     JOIN rol r ON r.id_rol = ur.id_rol
     WHERE u.id_usuario = $1 AND u.activo = true AND r.codigo = $2`,
    [userId, role],
  );
  return Boolean(result.rowCount);
}

/** Auth demo: sesión opaca preferente; headers solo si ALLOW_HEADER_AUTH. */
export function attachDemoAuth(req: Request, _res: Response, next: NextFunction) {
  const sessionToken = req.header("x-demo-session")?.trim() || null;
  const session = resolveDemoSession(sessionToken);
  if (session) {
    req.demoAuth = {
      userId: session.userId,
      role: session.role,
      sessionToken: session.token,
    };
    next();
    return;
  }

  const userRaw = req.header("x-demo-user-id");
  const role = req.header("x-demo-role")?.trim() || null;
  const userId = userRaw ? Number(userRaw) : null;
  req.demoAuth = {
    userId: Number.isFinite(userId) ? userId : null,
    role,
    sessionToken: null,
  };
  next();
}

export function requireDemoAuth(req: Request, res: Response, next: NextFunction) {
  void (async () => {
    if (!req.demoAuth?.role || !req.demoAuth.userId) {
      res.status(401).json({
        error: "Sesión requerida. Inicie sesión de nuevo.",
      });
      return;
    }

    // Sesión emitida por login: basta con comprobar que sigue activa y el rol pertenece.
    if (req.demoAuth.sessionToken) {
      if (!(await roleBelongsToUser(req.demoAuth.userId, req.demoAuth.role))) {
        res.status(403).json({ error: "Identidad o rol no autorizado" });
        return;
      }
      next();
      return;
    }

    // Headers sin token: permitido solo en desarrollo/pruebas (scripts de regresión).
    if (!env.allowHeaderAuth) {
      res.status(401).json({
        error: "Sesión inválida o expirada. Inicie sesión de nuevo.",
      });
      return;
    }

    if (!(await roleBelongsToUser(req.demoAuth.userId, req.demoAuth.role))) {
      res.status(403).json({ error: "Identidad o rol no autorizado" });
      return;
    }
    next();
  })().catch(next);
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

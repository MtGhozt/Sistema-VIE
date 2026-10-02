import { Router } from "express";
import { pool } from "../db.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    const result = await pool.query<{ ok: number; now: Date }>(
      "SELECT 1 AS ok, NOW() AS now",
    );
    res.json({
      status: "ok",
      database: "up",
      serverTime: result.rows[0]?.now ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    res.status(503).json({
      status: "error",
      database: "down",
      message,
    });
  }
});

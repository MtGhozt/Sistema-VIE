import type { RequestHandler } from "express";

/** Express 4 no reenvía automáticamente el rechazo de una promesa. */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve().then(() => handler(req, res, next)).catch(next);
  };
}

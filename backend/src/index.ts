import { createApp } from "./app.js";
import { env } from "./env.js";
import { pool } from "./db.js";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Sistema VIE API en http://localhost:${env.port}`);
  console.log(`Health: http://localhost:${env.port}/api/health`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

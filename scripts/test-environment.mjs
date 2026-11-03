import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
export async function testEnvironment({ ui = false } = {}) {
  const dbUrl = process.env.TEST_DATABASE_URL;
  if (!dbUrl || new URL(dbUrl).pathname !== '/fondos_vie_test') throw new Error('Indique TEST_DATABASE_URL para fondos_vie_test. No se usa la BD de desarrollo.');
  const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url));
  const { Pool } = requireBackend('pg');
  const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
  let server, appPool, vite;
  async function close() {
    if (vite) await vite.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (appPool) await appPool.end();
    await pool.end();
  }
  try {
    const identity = await pool.query('SELECT current_database() AS name');
    if (identity.rows[0].name !== 'fondos_vie_test') throw new Error('BD inesperada');
    process.env.DATABASE_URL = dbUrl;
    process.env.NODE_ENV = 'test';
    const { createApp } = await import('../backend/dist/app.js');
    ({ pool: appPool } = await import('../backend/dist/db.js'));
    server = await new Promise(resolve => { const s = createApp().listen(0, '127.0.0.1', () => resolve(s)); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    let uiOrigin;
    if (ui) {
      const requireFrontend = createRequire(new URL('../frontend/package.json', import.meta.url));
      const { createServer } = await import(pathToFileURL(requireFrontend.resolve('vite')).href);
      vite = await createServer({ root: path.join(root, 'frontend'), server: { host:'127.0.0.1',port:0,proxy:{'/api':{target:origin}} } });
      await vite.listen(); uiOrigin = `http://127.0.0.1:${vite.httpServer.address().port}`;
    }
    return { pool, api: origin + '/api', uiOrigin, close };
  } catch (error) { await close(); throw error; }
}

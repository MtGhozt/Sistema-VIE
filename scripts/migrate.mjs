import { createRequire } from 'node:module';
import { readdir, readFile } from 'node:fs/promises';
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url));
const { Pool } = requireBackend('pg');
if (!process.env.DATABASE_URL) throw new Error('Indique DATABASE_URL explícitamente; no se modifica una base por defecto.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('sistema-vie-migraciones'))");
  await client.query('CREATE TABLE IF NOT EXISTS sistema_vie_migracion (archivo text PRIMARY KEY, aplicado_en timestamptz NOT NULL DEFAULT NOW())');
  for (const file of (await readdir(new URL('../database/migrations/', import.meta.url))).filter(n=>n.endsWith('.sql')).sort()) {
    const applied = await client.query('SELECT 1 FROM sistema_vie_migracion WHERE archivo=$1', [file]);
    if (applied.rowCount) continue;
    await client.query(await readFile(new URL(`../database/migrations/${file}`, import.meta.url), 'utf8'));
    await client.query('INSERT INTO sistema_vie_migracion(archivo) VALUES($1)', [file]);
    console.log(`Aplicada: ${file}`);
  }
  await client.query('COMMIT');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }

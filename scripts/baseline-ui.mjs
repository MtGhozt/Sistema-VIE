/** Inspección de interfaz real sobre BD aislada. No guarda ni decide expedientes. */
import { chromium, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(root, 'correcciones/evidencias', `${run}-linea-base-ui`);
const results = [];
const errors = [];
let appServer, vite, browser, appPool;
let pool;
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url));
const requireFrontend = createRequire(new URL('../frontend/package.json', import.meta.url));
async function check(name, fn) {
  try { results.push({ name, status: 'OBSERVADO', detail: await fn() }); }
  catch (error) { results.push({ name, status: 'ERROR DE PRUEBA', detail: error.message }); }
  console.log(results.at(-1).status, name, JSON.stringify(results.at(-1).detail));
}
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(output, `${name}.png`) });
  return `${name}.png`;
}
try {
  await mkdir(output, { recursive: true });
  const dbUrl = process.env.TEST_DATABASE_URL;
  if (!dbUrl || new URL(dbUrl).pathname !== '/fondos_vie_test') throw new Error('TEST_DATABASE_URL debe indicar fondos_vie_test');
  const { Pool } = requireBackend('pg');
  pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
  const identity = await pool.query('SELECT current_database() AS name');
  if (identity.rows[0].name !== 'fondos_vie_test') throw new Error('BD inesperada');
  process.env.DATABASE_URL = dbUrl;
  process.env.NODE_ENV = 'test';
  const { createApp } = await import('../backend/dist/app.js');
  ({ pool: appPool } = await import('../backend/dist/db.js'));
  appServer = await new Promise(resolve => { const server = createApp().listen(0, '127.0.0.1', () => resolve(server)); });
  const api = `http://127.0.0.1:${appServer.address().port}`;
  const { createServer } = await import(pathToFileURL(requireFrontend.resolve('vite')).href);
  vite = await createServer({ root: path.join(root, 'frontend'), server: { host: '127.0.0.1', port: 0, proxy: { '/api': { target: api } } } });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true });
  const roles = ['vie_publicacion', 'investigador', 'vinculacion', 'comite_asistente', 'comite_evaluador', 'consejo_asistente', 'consejo', 'direccion_escuela', 'gestora_vie', 'cie', 'direccion_investigacion', 'admin'];
  for (const role of (process.env.UI_ROLES ? process.env.UI_ROLES.split(',') : roles)) {
    const context = await browser.newContext({ viewport: { width: Number(process.env.UI_WIDTH ?? 1440), height: Number(process.env.UI_HEIGHT ?? 900) } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push({ role, url: page.url(), message: error.message }));
    try {
      await check(`${role}: login e inicio`, async () => {
        await page.goto(`${origin}/login`);
        const select = page.locator('.prototype-role-box select');
        await expect(select).toBeEnabled();
        await select.selectOption(role);
        await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
        await expect(page).toHaveURL(/\/inicio$/);
        await expect(page.getByRole('main')).toBeVisible();
        return { screenshot: await screenshot(page, `${role}-inicio`), title: await page.locator('h1').allTextContents() };
      });
      if (results.at(-1).status !== 'OBSERVADO') { await screenshot(page, `${role}-login-error`); continue; }
      await check(`${role}: vista principal`, async () => {
        const route = role === 'investigador' ? '/propuestas/nueva' : role === 'vie_publicacion' ? '/convocatorias' : '/evaluaciones';
        await page.goto(origin + route);
        await expect(page.getByRole('main')).toBeVisible();
        await expect(page.getByText('Cargando bandeja…', { exact: true })).toBeHidden();
        return { route, screenshot: await screenshot(page, `${role}-principal`), title: await page.locator('h1').allTextContents(), demo: await page.getByText('Modo demo local · las acciones actualizan esta pantalla pero no la base de datos.', { exact: true }).count() };
      });
      if (role === 'investigador') {
        for (let step = 0; step < 17; step++) await check(`Wizard: paso ${step + 1}`, async () => {
          await page.locator('.wizard-steps button').nth(step).click();
          const controls = await page.locator('.wizard-body input:not([type=file]), .wizard-body textarea, .wizard-body select').count();
          return { title: await page.locator('.wizard-card-head h2').innerText(), controls, screenshot: await screenshot(page, `wizard-${String(step + 1).padStart(2, '0')}`) };
        });
      }
      if (role === 'comite_asistente') await check('Modal devolución: geometría y foco', async () => {
        await page.getByRole('button', { name: 'Devolver con observaciones', exact: true }).click();
        const modal = page.getByRole('dialog', { name: 'Devolver propuesta', exact: true });
        await expect(modal).toBeVisible();
        const detail = await modal.evaluate(node => {
          const r = node.getBoundingClientRect();
          const occlusions = [];
          for (let x = r.left + 15; x < r.right - 15; x += 30) {
            for (let y = r.top + 15; y < r.bottom - 15; y += 30) {
              const hit = document.elementFromPoint(x, y);
              if (hit && !node.contains(hit)) occlusions.push({ x, y, tag: hit.tagName, className: String(hit.className).slice(0,120) });
            }
          }
          return { occlusions, top: r.top, bottom: r.bottom, left: r.left, right: r.right, viewport: { width: innerWidth, height: innerHeight }, focusInside: node.contains(document.activeElement), centerHitInside: node.contains(document.elementFromPoint(r.left + r.width/2, r.top + r.height/2)) };
        });
        await screenshot(page, 'comite-devolucion-modal');
        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
        return detail;
      });
      if (role === 'cie') await check('CIE: rechazo con fundamento no vacío (sin escribir en BD)', async () => {
        let actionRequests = 0;
        // Si el frontend llega a la API, se aborta: este diagnóstico no decide propuestas semilla.
        await page.route('**/evaluaciones/propuestas/*/acciones', async route => { actionRequests++; await route.abort(); });
        await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
        const modal = page.getByRole('dialog', { name: 'Emitir resolución de rechazo', exact: true });
        await expect(modal).toBeVisible();
        const bounds = await modal.boundingBox();
        await screenshot(page, 'cie-rechazo-modal');
        await modal.getByRole('textbox').fill('Fundamento no vacío para reproducir el contrato de rechazo.');
        await modal.getByRole('button', { name: 'Confirmar rechazo', exact: true }).click();
        await expect(page.getByText('La justificación u observación es obligatoria.', { exact: true })).toBeVisible();
        return { defectReproduced: true, actionRequests, modalClosed: !await modal.isVisible(), bounds, screenshot: await screenshot(page, 'cie-rechazo-error') };
      });
      if (role === 'admin') {
        for (const route of ['/historico', '/notificaciones', '/administracion', '/propuestas']) await check(`Admin: ${route}`, async () => {
          await page.goto(origin + route);
          await expect(page.locator('h1')).toBeVisible();
          // Esperar respuesta al histórico; su consulta tiene debounce de 300 ms.
          if (route === '/historico') await expect(page.getByText('Consultando…', { exact: true })).toBeHidden();
          return { screenshot: await screenshot(page, `admin-${route.slice(1)}`), title: await page.locator('h1').allTextContents() };
        });
      }
    } finally { await context.close(); }
  }
} catch (error) {
  results.push({ name: 'Preparación del entorno', status: 'BLOQUEADO', detail: error.message });
} finally {
  if (browser) await browser.close();
  if (vite) await vite.close();
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (appPool) await appPool.end();
  if (pool) await pool.end();
  await writeFile(path.join(output, 'reporte.json'), JSON.stringify({ run, timezone: 'America/Costa_Rica', scope: 'Línea base visual sin decisiones ni guardados; OBSERVADO no equivale a aceptado ni corregido.', results, errors }, null, 2) + '\n');
  for (const row of results) console.log(`${row.status} | ${row.name} | ${JSON.stringify(row.detail)}`);
  console.log(`Evidencia: ${path.relative(root, output)}`);
  process.exitCode = results.some(row => row.status !== 'OBSERVADO') || errors.length ? 1 : 0;
}

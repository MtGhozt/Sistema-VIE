/** Línea base API aislada: no usa el backend de desarrollo ni modifica su BD. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url));
const run = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(root, 'correcciones/evidencias', `${run}-linea-base-api`);
const rows = [];
const sessions = new Map();
const fixtures = [];
let pool;
let server;
let serverLog = '';
let api;
const dbUrl = process.env.TEST_DATABASE_URL;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function check(id, name, fn) {
  try {
    const detail = await fn();
    rows.push({ id, name, status: 'PASA', detail: detail ?? '' });
  } catch (error) {
    rows.push({ id, name, status: error.blocked ? 'BLOQUEADO' : 'FALLA', detail: error.message });
  }
}
function blocked(message) { const error = new Error(message); error.blocked = true; throw error; }
async function request(route, role, method = 'GET', body) {
  const session = sessions.get(role);
  if (role && !session) blocked(`No hay sesión disponible de ${role}`);
  const response = await fetch(`${api}${route}`, {
    method,
    signal: AbortSignal.timeout(10000),
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { 'X-Demo-User-Id': String(session.id), 'X-Demo-Role': session.roleCode } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  assert(response.ok, `${method} ${route}: HTTP ${response.status} ${data.error ?? ''}`);
  return data;
}
const roles = ['vie_publicacion', 'investigador', 'vinculacion', 'comite_asistente',
  'comite_evaluador', 'consejo_asistente', 'consejo', 'direccion_escuela',
  'gestora_vie', 'cie', 'direccion_investigacion', 'admin'];
const routes = [
  ['pi', 'vinculacion', { oficio: `CV-${Date.now()}`, potencial: 'Sí', analisis: 'Dictamen de prueba' }],
  ['committee-ready', 'comite_asistente', {}],
  ['save-rubric', 'comite_evaluador', { average: 80, scores: {} }],
  ['committee-score', 'comite_evaluador', { average: 80, recommendation: 'RECOMIENDA' }],
  ['send-council', 'consejo_asistente', {}],
  ['council-approve', 'consejo', { texto: 'Fundamento de aval de prueba' }],
  ['communicate-aval', 'direccion_escuela', {}],
  ['vie-observation', 'gestora_vie', { texto: 'Observación de prueba recuperable' }],
  ['send-cie', 'gestora_vie', {}],
  ['cie-approve', 'cie', { texto: 'Fundamento de resolución de prueba' }],
  ['notify-resolution', 'direccion_investigacion', {}],
];
try {
  await check('ENTORNO', 'Conectar únicamente a BD de prueba y arrancar API propia', async () => {
    if (!dbUrl) blocked('Falta TEST_DATABASE_URL. No se utiliza DATABASE_URL ni la BD de desarrollo.');
    const parsed = new URL(dbUrl);
    assert(['postgres:', 'postgresql:'].includes(parsed.protocol), 'URL PostgreSQL requerida');
    assert(parsed.pathname === '/fondos_vie_test', 'La BD debe llamarse exactamente fondos_vie_test');
    const { Pool } = requireBackend('pg');
    pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
    let result;
    try { result = await pool.query('SELECT current_database() AS name'); }
    catch (error) { blocked(`BD de prueba no disponible (${error.code ?? 'conexión'}).`); }
    assert(result.rows[0].name === 'fondos_vie_test', 'Identidad de BD inesperada');
    // PORT=0 solicita un puerto libre; el proceso escucha solo para esta ejecución.
    server = spawn(process.execPath, ['--input-type=module', '-e',
      `import { createApp } from './backend/dist/app.js'; const s=createApp().listen(0,'127.0.0.1',()=>console.log('BASELINE_PORT='+s.address().port));`],
      { cwd: root, env: { ...process.env, DATABASE_URL: dbUrl, NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('API de prueba no inició en 10 s')), 10000);
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', code => { clearTimeout(timer); reject(new Error(`API terminó al iniciar (${code})`)); });
      server.stderr.on('data', data => { serverLog += data; });
      server.stdout.on('data', data => {
        serverLog += data;
        const match = serverLog.match(/BASELINE_PORT=(\d+)/);
        if (match) { clearTimeout(timer); api = `http://127.0.0.1:${match[1]}/api`; resolve(); }
      });
    });
    const health = await request('/health');
    assert(health.database === 'up', 'Health no confirma BD conectada');
    return 'API nueva conectada a fondos_vie_test; puerto dinámico.';
  });
  if (rows[0].status !== 'PASA') {
    for (const role of roles) rows.push({ id: 'F01', name: `Login ${role}`, status: 'BLOQUEADO', detail: 'Depende de ENTORNO' });
    for (const [action] of routes) rows.push({ id: 'FLUJO', name: action, status: 'BLOQUEADO', detail: 'Depende de ENTORNO' });
  } else {
    for (const role of roles) await check('F01', `Login ${role}`, async () => {
      const data = await request('/demo/login', null, 'POST', { email: `${role}@tec.ac.cr`, password: 'prototipo2026', roleCode: role });
      assert(data.user?.roleCode === role, 'Rol de sesión incorrecto'); sessions.set(role, data.user);
    });
    for (const role of roles.slice(2)) await check('BANDEJA', `Consultar bandeja ${role}`, async () => {
      const data = await request('/evaluaciones/bandeja', role);
      assert(Array.isArray(data.items), 'La bandeja no entrega items');
      return `${data.items.length} expedientes; no implica permisos correctos`;
    });
    let conv;
    await check('F02', 'Crear y publicar convocatoria exclusiva de ejecución', async () => {
      conv = await request('/convocatorias', 'vie_publicacion', 'POST', { nombre: `Baseline ${run}`, fechaApertura: '2026-01-01', fechaCierre: '2027-12-31', estado: 'borrador' });
      fixtures.push({ type: 'convocatoria', id: conv.id });
      await request(`/convocatorias/${conv.id}`, 'vie_publicacion', 'PATCH', { estado: 'activa' });
    });
    for (const scenario of ['aprobacion', 'rechazo-cie', 'rechazo-consejo']) {
      let proposal;
      let canContinue = true;
      let avalRejected = false;
      await check('F03', `Crear expediente ${scenario}`, async () => {
        if (!conv?.id) blocked('Sin convocatoria de prueba');
        proposal = await request('/propuestas', 'investigador', 'POST', { titulo: `Baseline ${run} ${scenario}`, idConvocatoria: conv.id, modalidad: 'aplicada', resumen: 'Resumen de prueba', problema: 'Problema', objetivoGeneral: 'Objetivo', metodologia: 'Metodología' });
        fixtures.push({ type: 'propuesta', scenario, id: proposal.id });
      });
      await check('F12', `Enviar expediente ${scenario}`, async () => {
        if (!proposal?.id) blocked('Sin expediente');
        try { await request(`/propuestas/${proposal.id}/enviar`, 'investigador', 'POST'); }
        catch (error) { canContinue = false; throw error; }
      });
      for (let [action, role, payload] of routes) {
        if (avalRejected) {
          rows.push({ id: 'FLUJO', name: `${scenario}: ${action}`, status: 'NO APLICA', detail: 'La rama termina al rechazar el aval; no se fuerza una resolución CIE.' });
          continue;
        }
        if (scenario === 'rechazo-cie' && action === 'cie-approve') action = 'cie-reject';
        if (scenario === 'rechazo-consejo' && action === 'council-approve') action = 'council-reject';
        await check('FLUJO', `${scenario}: ${action}`, async () => {
          if (!proposal?.id || !canContinue) blocked('No continuar después de una transición fallida o rechazo de aval');
          try {
            await request(`/evaluaciones/propuestas/${proposal.id}/acciones`, role, 'POST', { action, payload: action === 'pi' ? { ...payload, oficio: `CV-BASE-${proposal.id}` } : payload });
            const stored = await pool.query('SELECT estado_actual, etapa_flujo FROM propuesta WHERE id_propuesta=$1', [proposal.id]);
            return JSON.stringify(stored.rows[0]);
          } catch (error) { canContinue = false; throw error; }
          finally {
            if (action === 'council-reject' && canContinue) avalRejected = true;
          }
        });
      }
      await check('F28', `Localizar ${scenario} en histórico`, async () => {
        if (!proposal?.id) blocked('Sin expediente');
        const history = await request('/historico/propuestas', 'admin');
        assert(history.items.some(item => item.id === proposal.id), 'No aparece el expediente');
      });
    }
  }
} finally {
  if (server && server.exitCode === null) {
    await new Promise(resolve => { server.once('exit', resolve); server.kill('SIGTERM'); });
  }
  if (pool) await pool.end();
  await mkdir(output, { recursive: true });
  const report = { run, timezone: 'America/Costa_Rica', fixtures, results: rows,
    scope: 'API actual: contratos y transiciones. No certifica rúbrica, permisos, completitud ni interfaz. No usa motivo del frontend: el defecto UI CIE requiere navegador.',
    remaining: 'F04–F11, F13–F27 en sus verificaciones detalladas, F29–F37 y cobertura visual siguen pendientes del registro manual.' };
  await writeFile(path.join(output, 'reporte.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(path.join(output, 'api.txt'), serverLog);
  for (const row of rows) console.log(`${row.status} | ${row.name} | ${row.detail}`);
  console.log(`Evidencia: ${path.relative(root, output)}`);
  process.exitCode = rows.some(row => row.status === 'FALLA' || row.status === 'BLOQUEADO') ? 1 : 0;
}

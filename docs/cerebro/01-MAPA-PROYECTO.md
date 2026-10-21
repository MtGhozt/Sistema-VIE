# 01 — MAPA DEL PROYECTO | Qué hay en cada carpeta

> Inventario físico del repo. Las rutas de este documento son **relativas a la raíz del repo** (donde clones el proyecto), no a una carpeta local concreta.

## Raíz (cerebro teórico — fuera de todas las carpetas)

| Archivo | Propósito |
|---|---|
| `00-INDICE-CEREBRO.md` | Índice maestro, a dónde ir por cada X/Y/Z |
| `01-MAPA-PROYECTO.md` | Este archivo: inventario carpeta por carpeta |
| `02-DOMINIO-VIE.md` | Dominio Fondos VIE + extractos clave de documentos |
| `03-MARCA-TEC.md` | Marca TEC: colores, logo, tipografía, reglas de uso |

## Codigo0.1/ — prototipo base ultra-simple (NUEVO)

Vacía antes. Ahora contiene el prototipo elegido:
`Node + Express + SQLite (node:sqlite nativo)` + frontend sin frameworks.

| Archivo | Qué es | Líneas aprox |
|---|---|---|
| `package.json` | Solo `express`. Scripts `pnpm start / dev` | ~15 |
| `server.js` | Crea `prototipo.db`, tabla `propuestas`, 5 endpoints REST, sirve `/public` | ~130 |
| `public/index.html` | 1 página: header TEC, login por rol, 3 módulos (redactar/evaluar/histórico) | ~150 |
| `public/styles.css` | Variables TEC, layout, cards, responsive mínimo | ~150 |
| `public/app.js` | CRUD con fetch, filtros histórico, cambio de estado | ~150 |
| `README.md` | Cómo instalar y correr en 2 pasos | ~30 |
| `.gitignore` | Ignora `node_modules/` y `*.db` | ~5 |

**Dónde encontrar X en el código:**

- Tabla y columnas → `server.js` bloque `SCHEMA`
- Endpoints → `server.js` bloque `API`
- Datos semilla (3 propuestas ejemplo) → `server.js` bloque `SEED`
- Formulario redacción → `index.html` `#modulo-redactar`
- Rúbrica simplificada → `index.html` `#modulo-evaluar` + `app.js` fn `evaluar()`
- Filtros histórico (escuela, investigador, temática, estado) → `app.js` fn `cargarHistorico()`
- Colores TEC → `styles.css` `:root`

## DOCS info proyecto/ — 9 archivos oficiales

1. `1-Disposiciones Convocatoria Fondos VIE 2027.pdf` (348 KB) — reglas madre.
2. `2-Rúbricas_Investigación_2027__Fondos_VIE.xlsx` (108 KB) — criterios de calificación.
3. `4- Formulario Proyecto Investigacion Fondos VIE 2027.docx` (89 KB) — campos oficiales.
4. `5- Plan de Acción y Gestión del Riesgo Fondos VIE 2027.xlsx` (37 KB).
5. `6- Plantilla Presupuesto Convocatoria Fondos VIE 2027.xlsx` (34 KB).
6. `7- Formato de acuerdo instancia coordinadora Fondos VIE 2027.docx` (143 KB).
7. `8- Formato de acuerdo instancia participante Fondos VIE 2027.docx` (136 KB).
8. `Basado en los documentos adjuntos, genera las ins....pdf` (114 KB).
9. `Cronograma_Convocatoria_2027_para_la_presentación_de_propuestas.pdf` (350 KB).

> Nota: nombres con tildes/acentos pueden fallar en scripts — usar comillas siempre.

## ETAPA1/ — 8 entradas

- `Contexto-Proyecto-Fondos-VIE.md` (12 KB) — **leer primero**.
- `Analisis-de-Personas-Fondos-VIE.md` — 6 personas + Super Admin, roles a/b/c, matriz de necesidades y de permisos.
- `Arquitectura de Información - Análisis de lo Existente.pdf` (1.1 MB) + `.md` + `_assets/` (12 png).
- `Arquitectura de Información - Proceso.pdf` (2 MB) + `.md` + `_assets/` (19 png).
- Los `.md` de arquitectura son transcripciones página-por-página del PDF (portada, proceso, modelo, criterios). Valor teórico, no funcional.

## Manual Identidad Tec/ — 4 PDFs

- `30_01_25-manual-tec-1.pdf` (6.3 MB) — libro de marca completo.
- `logotec.pdf` (313 KB), `firmatec-1.pdf` (203 KB), `firmatec-2.pdf` (371 KB).
- Extracción aplicable en `03-MARCA-TEC.md`.

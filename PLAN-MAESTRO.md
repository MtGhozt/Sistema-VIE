# PLAN MAESTRO — Sistema VIE (prototipo funcional)

**Audiencia:** todo el equipo.  
**Autor de esta versión:** Matias + asistente Cursor (2026-10-01).  
**Repo:** [https://github.com/MatiasBS027/Sistema-VIE](https://github.com/MatiasBS027/Sistema-VIE) (privado)  
**Carpeta local:** la raíz del repo donde clones el proyecto (todas las rutas de este doc son relativas a esa raíz)

> **Cómo usar este documento:** léelo de arriba abajo una vez.  
> Luego trabaja solo la fase activa. Toda decisión nueva se anota en §11 (bitácora).

---

## 0. Lectura obligatoria (orden sugerido, ~45–60 min)


| #   | Archivo                                                                                 | Para qué                                            |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Este `PLAN-MAESTRO.md`                                                                  | Mapa completo                                       |
| 2   | `CONTINUIDAD.md`                                                                        | Stack y estado corto                                |
| 3   | `docs/casos-de-uso/CASOS-DE-USO.md`                                                     | Los 5 CUs                                           |
| 4   | `database/Diseno_Base_Datos_Fondos_VIE (con cambios).md`                                | BD 40 tablas (fuente de verdad)                     |
| 5   | `docs/cerebro/02-DOMINIO-VIE.md`                                                        | Flujo institucional y reglas                        |
| 6   | `docs/etapa1/Analisis-de-Personas-Fondos-VIE.md`                                        | Actores / roles                                     |
| 7   | `docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html`                               | Referencia visual (docs; no va en frontend/)        |
| 8   | Rúbrica del LMS (capturas en chat / si se agrega a `docs/rubrica-prototipo-funcional/`) | Criterios de nota                                   |


Si algo de la lista no está en tu máquina: `git pull` en este repo.

---



## 1. Qué es el proyecto (una frase)

Prototipo web académico para **gestionar propuestas Fondos VIE del TEC**: convocatoria → redacción → revisión/PI → evaluación/resolución → histórico, con **PostgreSQL**, sin integrar Orión.

---



## 2. Estructura del repositorio

```
Sistema-VIE/
├── backend/      → API (hoy Express+SQLite andamiaje; destino: Node+TS+Express+Postgres)
├── frontend/     → UI (hoy HTML React empaquetado; destino: React+TS+Vite)
├── database/     → Diseño + DDL PostgreSQL (40 tablas)
├── docs/         → Material académico (se puede recortar al final del curso)
├── CONTINUIDAD.md
├── PLAN-MAESTRO.md   ← este archivo
└── README.md
```

---



## 3. Rúbrica del prototipo funcional (qué nos califican)


| Bloque                                                      | Peso    | Qué hay que demostrar                                                           |
| ----------------------------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| Interfaz (estética, ortografía, flujo)                      | 22%     | UI clara, marca TEC, sin errores ortográficos, navegación lógica                |
| Accesibilidad (contraste, teclado, alt text, lector)        | 28%     | Control alto contraste, tab order, alt editable si hay media, usable con lector |
| **5 casos de uso** (completitud + **CRUD** + proceso claro) | **50%** | Cada CU funciona de punta a punta y **persiste en BD**                          |


Implicación: no basta el HTML en `localStorage`. Hace falta **API + PostgreSQL**.

---



## 4. Decisiones YA TOMADAS (no reabrir sin motivo escrito)


| ID  | Decisión                                                            | Motivo                                                | Fecha           |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------- | --------------- |
| D1  | Repo oficial = `Sistema-VIE` en GitHub (privado)                    | Un solo lugar para código + docs                      | 2026-10-01      |
| D2  | Estructura `backend` / `frontend` / `database` / `docs`             | Repo de producto, no solo documentos                  | 2026-10-01      |
| D3  | Backend: **Node.js + TypeScript + Express +** `pg`                  | Simple, tipado, alineado a SQL                        | 2026-10-01      |
| D4  | Frontend: **React + TypeScript + Vite**                             | Ya hay UI React de referencia; Vite = tooling moderno | 2026-10-01      |
| D5  | BD: **PostgreSQL**, esquema de **40 tablas** del MD                 | Rúbrica/clase + diseño entregado                      | 2026-10-01      |
| D6  | Fuente de verdad BD = MD en `docs/database/` + `database/DisennoDB.sql` | Sincronizados a 40 tablas                         | 2026-10-01      |
| D7  | Sin integración real con Orión ni correo real                       | Alcance académico; correo = simulación/registro       | (desde dominio) |
| D8  | Cinco CUs documentados en `docs/casos-de-uso/CASOS-DE-USO.md`       | Cubren módulos oficiales + flujo mínimo               | 2026-10-01      |
| D9  | SQLite actual del backend es **temporal**                           | Solo andamiaje; se elimina al conectar Postgres       | 2026-10-01      |
| D11 | Docs académicos se pueden podar al final | Mientras tanto documentar de más | 2026-10-01 |
| D12 | Postgres vía **Docker Compose** | Matias tiene Docker Desktop | 2026-10-01 |
| D13 | Auth = **login demo por rol** | Como el HTML; flexible a cambios | 2026-10-01 |
| D14 | CU4 = **vistas separadas por rol** (Comité, Consejo, CIE, …) | Igual que el prototipo HTML | 2026-10-01 |
| D15 | 5 CUs aprobados sin cambios de alcance | Confirmado Matias | 2026-10-01 |
| D16 | **UI = prototipo HTML 1:1** (`docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html`). Código en `frontend/src`. Prohibido inventar otra estética. | Feedback Matias 2026-10-01 | 2026-10-01 |
| D17 | **pnpm monorepo** en la raíz (`pnpm install`, `pnpm dev` levanta front+back) | Preferencia Matias; menos lockfiles npm | 2026-10-01 |
| D18 | **Solo código** en `backend/`, `frontend/`, `database/` (SQL); referencias y legado en `docs/` | Limpieza de repo | 2026-10-01 |
| D19 | **Sidebar azul TEC** + logo oficial (`logotec.pdf` → `public/brand/logotec-*.png`) | Contraste marca; variante blanca del manual | 2026-10-01 |
| D20 | Propuesta **editable solo en borrador**; enviada/en flujo = solo lectura | Evitar reescritura tras envío; alinea detalle + `?edit=` | 2026-10-02 |





### Glosario rápido (para quien no es de frontend)

- **React:** librería para UI por componentes.
- **Vite:** herramienta que arranca y empaqueta el frontend (`npm run dev`).
- **TypeScript:** JavaScript con tipos (menos errores).
- **Express:** framework HTTP mínimo en Node.
- **PostgreSQL:** motor SQL; usamos el DDL de `database/DisennoDB.sql`.

---



## 5. Preguntas al equipo — RESPONDIDAS (2026-10-01, Matias)

| # | Pregunta | Respuesta acordada |
|---|---|---|
| Q1 | ¿OK los 5 CUs? | **Sí**, tal cual `CASOS-DE-USO.md` |
| Q2 | ¿Postgres? | **Docker Compose** (Docker Desktop disponible) |
| Q3 | ¿Auth? | **Login demo por rol** (como el HTML; cambiable después) |
| Q4 | ¿CU4? | **Varias etapas, pantallas por rol separadas** (igual que el prototipo HTML; no una sola UI genérica) |

### Defaults técnicos derivados
- `docker-compose.yml` en la raíz del repo.
- No hace falta ruta custom de Docker si `docker` está en el PATH.
- CU4 se implementa como rutas/vistas por rol (`/comite`, `/consejo`, `/cie`, …), no un único formulario multipropósito.





### 5.2 Importantes (no bloquean Fase 0)


| #   | Pregunta                                                     | Default propuesto                                                                                         |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Q5  | ¿Monorepo con workspaces (`pnpm`) o carpetas independientes? | Carpetas independientes al inicio (`backend/`, `frontend/`)                                               |
| Q6  | ¿Dónde vive el CSS/tokens TEC?                               | Variables CSS en frontend según Manual TEC (`docs/manual-identidad-tec/`, `docs/cerebro/03-MARCA-TEC.md`) |
| Q7  | ¿IA de evaluación?                                           | Simular sugerencia de puntaje (regla o random acotado) + edición humana obligatoria                       |
| Q8  | ¿Alt text / media (rúbrica a11y)?                            | En CU2: campo de documento con `descripcion_alt` editable al subir/metadato                               |
| Q9  | ¿Hosting de demo?                                            | Local para defensa; opcional Render/Railway después                                                       |
| Q10 | ¿Quién es dueño de cada CU?                                  | Ver §9 (propuesta de roles de equipo)                                                                     |




### 5.3 Cosas que **explícitamente no** vamos a debatir ahora

- Integrar Orión, Active Directory o correo institucional real.

---



## 6. Los 5 casos de uso (resumen ejecutivo)

Detalle completo: `docs/casos-de-uso/CASOS-DE-USO.md`.


| CU  | Nombre                             | Actor                       | CRUD núcleo                                           |
| --- | ---------------------------------- | --------------------------- | ----------------------------------------------------- |
| CU1 | Gestionar convocatoria             | VIE                         | `convocatoria`, `convocatoria_hito`                   |
| CU2 | Formular y enviar propuesta        | Investigadora               | `propuesta` + hijas (horas, keywords, plan, riesgos…) |
| CU3 | Revisar expediente y dictaminar PI | Vinculación / revisión      | `dictamen_pi`, `revision_*`, `observacion*`           |
| CU4 | Evaluar con rúbrica y resolver     | Evaluadores / CIE / consejo | `evaluacion*`, `aval_consejo` / `resolucion_cie`      |
| CU5 | Consultar histórico                | Consulta                    | Lecturas filtradas + ficha                            |


**Criterio de “CU terminado”:** flujo feliz en UI + datos en Postgres tras F5 + copy sin faltas + teclado usable en esa pantalla.

---



## 7. Plan de implementación (fases detalladas)



### Fase 0 — Cimientos (infra + esqueleto)

**Objetivo:** repo listo para programar CUs sin pelearse con el entorno.  
**Duración estimada:** 1 sesión larga o 2 cortas.


| Paso | Tarea                                                                       | Entregable                                     | Dueño      |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------- | ---------- |
| 0.1  | Responder Q1–Q4 (aunque sea “vamos con el default”)                         | Bitácora §11                                   | Equipo     |
| 0.2  | Añadir `docker-compose.yml` (Postgres) **o** doc de instalación nativa      | Archivo en raíz                                | Backend    |
| 0.3  | Script/doc: aplicar `database/DisennoDB.sql` + verificar 40 tablas          | `database/README.md` actualizado               | Backend    |
| 0.4  | Seed mínimo: escuelas, roles, usuarios demo, 1 convocatoria, 1–2 propuestas | `database/seed.sql`                            | Backend    |
| 0.5  | Migrar `backend` a TypeScript (Express + `pg` + dotenv)                     | `backend/src/…`, healthcheck `GET /api/health` | Backend    |
| 0.6  | Scaffold `frontend` con Vite+React+TS                                       | `frontend/` con `npm run dev`                  | Frontend   |
| 0.7  | Tokens CSS TEC + layout shell (sidebar/topbar)                              | Página vacía con marca                         | Frontend   |
| 0.8  | Actualizar README raíz con comandos copy-paste                              | README                                         | Cualquiera |


**Definition of Done Fase 0:**  
`docker compose up` (o Postgres local) + SQL aplicado + `curl /api/health` OK + Vite abre en navegador.

---



### Fase 1 — CU1 Gestionar convocatoria

**Dependencias:** Fase 0.


| Paso | Backend                                                | Frontend                                   |
| ---- | ------------------------------------------------------ | ------------------------------------------ |
| 1.1  | CRUD API `/api/convocatorias` + hitos                  | —                                          |
| 1.2  | —                                                      | Lista + formulario crear/editar + publicar |
| 1.3  | Tests manuales: crear, editar, F5, estados             | Misma demo                                 |
| 1.4  | Checklist a11y básico (labels, foco) en esas pantallas |                                            |


**DoD:** VIE crea convocatoria con hitos; persiste; se ve en listado.

---



### Fase 2 — CU2 Formular y enviar propuesta

**Dependencias:** Fase 1 (convocatoria activa).


| Paso | Contenido                                                                                    |
| ---- | -------------------------------------------------------------------------------------------- |
| 2.1  | API propuesta borrador + update por secciones (priorizar campos del formulario oficial)      |
| 2.2  | Tablas hijas mínimas: objetivos, participantes+horas, keywords, presupuesto anual, productos |
| 2.3  | Plan/actividad/riesgo (al menos 1 actividad + 1 riesgo)                                      |
| 2.4  | UI wizard o secciones con guardado                                                           |
| 2.5  | Acción **Enviar** → cambia `estado_actual` / `etapa_flujo` + historial                       |
| 2.6  | Alt text / descripción en documentos si se suben archivos (o metadato)                       |


**DoD:** Investigadora completa y envía; datos en BD; no se pierde al recargar.

**Nota:** No hace falta el 100% de columnas del Excel el día 1; sí el flujo completo y persistencia real. Ampliar campos en iteraciones.

---



### Fase 3 — CU3 Revisar + dictamen PI

**Dependencias:** Fase 2 (propuesta enviada).


| Paso | Contenido                 |
| ---- | ------------------------- |
| 3.1  | Bandeja por etapa         |
| 3.2  | Checklist + observaciones |
| 3.3  | Formulario dictamen PI    |
| 3.4  | Devolver / avanzar etapa  |


**DoD:** Dictamen u observación queda guardado y visible en expediente.

---



### Fase 4 — CU4 Evaluar y resolver

**Dependencias:** Fase 3 (o seed que salte a etapa evaluación).


| Paso | Contenido                                                             |
| ---- | --------------------------------------------------------------------- |
| 4.1  | Cargar rúbrica seed (criterios + niveles 0/6/8/10 o escala del Excel) |
| 4.2  | UI evaluación + justificación + override de sugerencia IA             |
| 4.3  | Guardar `evaluacion` / `evaluacion_puntaje`                           |
| 4.4  | Registrar aval **o** resolución CIE según rol/etapa                   |
| 4.5  | Toast/notificación in-app (no correo real)                            |


**DoD:** Propuesta pasa a estado final o avalada con fundamento persistido.

---



### Fase 5 — CU5 Histórico

**Dependencias:** Datos de fases anteriores o seed rico.


| Paso | Contenido                                                                            |
| ---- | ------------------------------------------------------------------------------------ |
| 5.1  | API búsqueda con filtros combinados (escuela, investigadora, línea/temática, estado) |
| 5.2  | UI filtros + tabla + ficha resumen                                                   |
| 5.3  | Verificar con datos reales de demo                                                   |


**DoD:** Los 4 filtros combinables funcionan contra Postgres.

---



### Fase 6 — Rúbrica transversal (UI + a11y)

Puede ir **en paralelo** desde Fase 1, pero se cierra aquí.


| Ítem           | Criterio                                                           |
| -------------- | ------------------------------------------------------------------ |
| Estética TEC   | Azul 295C `#002F6C`, rojo 032C `#EF3340`, tipografía institucional |
| Ortografía     | Pasada de spellcheck en strings UI (es-CR)                         |
| Flujo          | Sin callejones; mismas etiquetas que los CUs                       |
| Alto contraste | Toggle global                                                      |
| Teclado        | Tab order lógico; Enter/Esc en modales                             |
| Lector         | landmarks, labels, `aria-*` en controles custom                    |
| Media          | alt/descripción editable donde haya upload                         |


---



### Fase 7 — Limpieza y defensa


| Paso | Contenido                                                          |
| ---- | ------------------------------------------------------------------ |
| 7.1  | Eliminar SQLite y `backend/public` legacy si ya no se usa          |
| 7.2  | Podar `docs/` que no aporten a la defensa (opcional)               |
| 7.3  | Script demo (usuarios, passwords demo, orden de recorrido CU1→CU5) |
| 7.4  | README “Cómo demostrar en 10 minutos”                              |


---



## 8. Orden de tablas Postgres por fase (no las 40 el día 1 en código)

Usar **todo el DDL** al instalar (40 tablas), pero el **código** toca primero:


| Fase | Tablas mínimas en código                                                          |
| ---- | --------------------------------------------------------------------------------- |
| 0    | `escuela`, `rol`, `usuario`, `usuario_rol` (+ seed)                               |
| 1    | `convocatoria`, `convocatoria_hito`                                               |
| 2    | `propuesta` + hijas de redacción listadas en CU2                                  |
| 3    | `dictamen_pi`, `revision_expediente`, `revision_checklist`, `observacion*`        |
| 4    | `rubrica*`, `evaluacion*`, `aval_consejo` / `resolucion_cie`, `notificacion`      |
| 5    | lecturas + `propuesta_linea`, `linea_investigacion`, `propuesta_historial_estado` |


Así no bloqueamos por modelar endpoints de las 40 de golpe.

---



## 9. División de trabajo sugerida (cuando vuelvan)


| Persona        | Enfoque                                                  | Fases           |
| -------------- | -------------------------------------------------------- | --------------- |
| A — Backend    | Express TS, SQL, seeds, APIs                             | 0, 1–5 API      |
| B — Frontend   | Vite React, pantallas, a11y visual                       | 0 UI, 1–5 UI, 6 |
| C — Dominio/QA | Seeds realistas, guion demo, revisar rúbrica, ortografía | 2–7             |


Si son 2: A+B y se turnan QA.  
Matias puede arrancar Fase 0 solo con defaults de §5.

---



## 10. Protocolo de documentación (para que nadie se pierda)

1. **Toda decisión nueva** → fila en bitácora §11 + commit.
2. **Todo PR/commit de feature** → menciona `CU#` en el mensaje (`feat(CU2): save draft proposal`).
3. **No borrar docs** sin anotar en bitácora qué se movió y por qué.
4. Si Cursor ayuda: pedirle *“leé PLAN-MAESTRO.md y CONTINUIDAD.md”* al abrir el repo.
5. Al final de cada sesión: 5 líneas en bitácora (qué se hizo / qué falta / blockers).

---



## 11. Bitácora de decisiones y sesiones



### 2026-10-02 — Parity UI HTML + regla edit borrador
- Restaurado alineamiento con `Fondos-VIE-Prototipo.html` en: inicio admin/investigador, detalle de propuesta (`ProposalDetailView`), wizard de 17 pasos, bandejas de evaluación por rol.
- Wizard: scroll contenido en `.wizard-sidebar` (no derrama los 17 pasos sobre el canvas).
- **D20 (implícita):** editar propuesta solo en `borrador`; enviada/en flujo = read-only.
- **CU2:** API persiste primer bloque; resto del wizard = UI local/demo.
- Se mantienen: notificaciones, toasts, marca TEC, API CU1/CU2.
- Huecos conscientes: PDF/documento 4 campo-a-campo, impresión de oficios, rúbricas ≠ catálogo Excel completo.
- Detalle en `CONTINUIDAD.md` § Estado UI.

### 2026-10-01 — Marca: logo oficial TEC
- Assets desde `docs/manual-identidad-tec/logotec.pdf` → `frontend/public/brand/` (azul/blanco).
- Sidebar azul corporativo para la variante blanca; `TecLogo` en shell y login.
- Motivo documentado en `brand-overrides.css`, CONTINUIDAD y `docs/cerebro/03-MARCA-TEC.md` (D19).

### 2026-10-01 — Limpieza repo + frontend multiarchivo + pnpm
- Documentación de BD → `docs/database/`; `database/` queda solo con `.sql`.
- Prototipo HTML y análisis → `docs/prototipo-html-referencia/` (fuera de `frontend/`).
- Demo SQLite vieja → `docs/backend-legacy/`.
- App de entrega: React multiarchivo en `frontend/src`, CSS extraído del prototipo, login demo en `localStorage` (sin API aún).
- Monorepo **pnpm**: `pnpm db:up`, `pnpm dev` desde la raíz (D17, D18).

### 2026-10-01 — Corrección UI
- Fuente de verdad visual: `docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html`. App multiarchivo: `frontend/src` (D16).

### 2026-10-01 — Sesión Matias (respuestas Q1–Q4 + Fase 0)

- Q1: 5 CUs OK. Q2: Docker Compose. Q3: login demo por rol. Q4: CU4 con **vistas por rol separadas** (como el HTML).
- Arranque Fase 0.

### 2026-10-01 — Sesión Matias

- Repo GitHub creado y push: [https://github.com/MatiasBS027/Sistema-VIE](https://github.com/MatiasBS027/Sistema-VIE)  
- Estructura app + CONTINUIDAD + 5 CUs documentados.  
- Stack acordado: Node TS Express + React TS Vite + Postgres.  
- Equipo no disponible; se documenta plan maestro para onboarding.  
- **Pendiente equipo:** Q1–Q4.  
- **Siguiente acción sugerida (Matias solo):** Fase 0 con defaults (Q2=Docker, Q3=login demo por rol, Q4=UI multi-etapa).

---



## 12. Checklist “¿estamos listos para codear Fase 0?”

- [x] Repo remoto existe y `git push` funciona  
- [x] Estructura backend/frontend/database/docs  
- [x] BD 40 tablas documentada y SQL/PDF/DBML alineados  
- [x] 5 CUs escritos  
- [x] Plan maestro escrito  
- [x] Equipo confirmó o Matias asume defaults Q1–Q4  
- [x] Postgres disponible (Docker Desktop)  
- [x] Node LTS + **pnpm** en las máquinas del equipo  

---



## 13. Mensaje listo para pegar al equipo (WhatsApp/Discord)

```
Muchachos, el repo oficial es:
https://github.com/MatiasBS027/Sistema-VIE (privado — pídanme acceso)

Lean EN ESTE ORDEN:
1) PLAN-MAESTRO.md
2) CONTINUIDAD.md
3) docs/casos-de-uso/CASOS-DE-USO.md
4) docs/database/Diseno_Base_Datos_Fondos_VIE (con cambios).md

Ahí está el stack (Node TS + React Vite + Postgres), los 5 CUs,
qué ya se decidió y qué falta opinar (Q1–Q4 del plan).

No trabajen en TEC_No_Git. Todo vive en Sistema-VIE.
Cuando puedan, comenten Q1–Q4 o digan “vamos con los defaults”.
```

---

*Fin del plan maestro. Actualizar este archivo en cada decisión relevante.*
# Auditoría integral — Sistema VIE · 18 de noviembre de 2026

Auditoría crítica multidisciplinaria del prototipo académico Fondos VIE (TEC).  
**Criterio:** ¿qué encontraría una institución real, un equipo de seguridad, QA, UX y mantenimiento?

> **Actualización:** la [2.ª auditoría integral](AUDITORIA-INTEGRAL-2-2026-11-18.md) cuestionó y corrigió cierres sobredeclarados de este documento (gate IAN, vista admin, IA, histórico). Leer ambos.

Documentos hermanos: [PRIORIDAD-POST-AUDITORIA.md](PRIORIDAD-POST-AUDITORIA.md) · [ESTADO-DE-REVISION.md](ESTADO-DE-REVISION.md) · [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md) · [CONTINUIDAD.md](../CONTINUIDAD.md)

---

## 1. Síntesis ejecutiva

El sistema **sí implementa** el circuito institucional completo (redacción → PI → Comité → Consejo → VIE → CIE → notificación) con persistencia en PostgreSQL, roles, bandejas y rúbricas de 100 puntos. Es un prototipo académico **honesto en varios límites** (auth demo, sin PDF de oficios, sin correo SMTP, sin Orión).

**No está listo para producción institucional** sin sustituir autenticación, endurecer PII, unificar esquema base+migraciones y reducir deuda en archivos monolíticos (wizard, evaluaciones, CSS).

En esta sesión se corrigieron hallazgos **P0/P1/P2** verificables (sesión, CORS, PII, foto, UNIQUE evaluación, índices, responsive, modal, bloqueo CIE con rúbrica incompleta) y se dejó evidencia en `correcciones/correcciones-finales/evidencias/*-seguridad-sesion` y regresiones API/smoke.

---

## 2. Arquitectura observada

| Capa | Tecnología | Notas |
|------|------------|-------|
| Frontend | React 19 + Vite + TS | Routing por rol; validación fuerte en `data/` |
| Backend | Express + TS + `pg` | Sin capa services; dominio en `routes/` + helpers |
| BD | PostgreSQL 16 | DDL `DisennoDB.sql` (40 tablas) + migraciones 001–014 (~50 tablas) |
| Auth | Demo headers + **sesión opaca** (nuevo) | Headers sin token solo si `ALLOW_HEADER_AUTH` |

Flujo mutante central: `POST /api/evaluaciones/propuestas/:id/acciones` + `POST /api/propuestas/:id/enviar`.

---

## 3. Problemas corregidos en esta iteración

| ID | Prioridad | Problema | Evidencia | Solución | Pruebas |
|----|-----------|----------|-----------|----------|---------|
| S01 | P0 | Identidad solo por headers (suplantación trivial) | `demoAuth.ts` | Token `X-Demo-Session` emitido en login; obligatorio en producción | `pnpm regression:seguridad-sesion` |
| S02 | P0 | CORS abierto | `app.ts` `cors()` | Orígenes whitelist (`CORS_ORIGINS`) | Smoke + API |
| S03 | P1 | `/demo/roles` filtraba `id_usuario` | `demoAuth.ts` | Catálogo sin IDs | seguridad-sesion |
| S04 | P1 | `/personas` exponía cédula/ORCID | `propuestas.ts` | Catálogo mínimo | seguridad-sesion |
| S05 | P1 | Catálogo sugeridas con cédula masiva | `perfil.ts` | Catálogo sin cédula | seguridad-sesion |
| S06 | P2 | Foto de perfil IDOR | `GET /perfil/foto/:id` | ACL propia / misma escuela / admin | seguridad-sesion |
| S07 | P1 | Sin rate limit en login | — | 20 req/min por IP | Manual + código |
| S08 | P1 | Health filtraba mensaje DB crudo | `health.ts` | Mensaje genérico | smoke |
| S09 | P1 | `evaluacion` sin UNIQUE → duplicados concurrentes | `rubricas.ts` + schema | Migración `014` + mensaje 23505 | migrate + API |
| S10 | P2 | Índices débiles en bandejas/histórico | SQL histórico | Índices en `014` | migrate |
| S11 | P2 | Estadísticas comité sin alcance | `estadisticas.ts` | JOIN + `alcancePropuestas` | typecheck |
| S12 | P0 | `body { min-width: 1100/1180px }` | `prototipo.css` | `min-width: 0` + reflow en `a11y.css` | CSS |
| S13 | P1 | Modal se cerraba al clic fuera | `SimpleModal.tsx` | `closeOnBackdrop=false` por defecto | revisión |
| S14 | P1 | CIE podía aprobar con rúbrica &lt;100 pts | `EvaluationRolePanels.tsx` | Botón deshabilitado si `availablePoints < 100` | revisión |
| S15 | P2 | Login: select Rol sin `htmlFor`/`id` | `LoginPage.tsx` | Asociados | revisión |
| S16 | P2 | Errores 500 con detalle interno en prod | `app.ts` | Mensaje genérico si `NODE_ENV=production` | código |
| S17 | P2 | Middleware auth con `void .then` | `requireDemoAuth` | `async` + `catch(next)` | typecheck |

**Verificación ejecutada:**

- `pnpm regression:seguridad-sesion` → **7/7 PASA**
- `pnpm smoke` → **18/18 PASS**
- `pnpm regression:api` → **todos PASA** (tras restaurar límite JSON por defecto)

---

## 4. Problemas identificados pendientes

### Seguridad / producción (no inventar SSO institucional)

| ID | Pri | Hallazgo | Notas |
|----|-----|----------|-------|
| P-S1 | P0* | Auth demo ≠ Orión/LDAP | Documentado fuera de alcance; token mitiga pero no sustituye IdP |
| P-S2 | P1 | Contraseña única seed `prototipo2026` | Aceptable en demo; intolerable en despliegue real |
| P-S3 | P1 | ~~Sin helmet~~ → `helmet` + `x-powered-by` off; CSRF/WAF siguen fuera (API sin cookies de sesión) |
| P-S4 | P2 | Alcance institucional = toda la escuela | Diseño actual; puede ser demasiado amplio |
| P-S5 | P2 | Validación PDF superficial | Magic bytes; sin antivirus |
| P-S6 | P2 | Sesiones en memoria | Se pierden al reiniciar API; OK prototipo |

\*P0 institucional; mitigado parcialmente para el prototipo.

### Base de datos

| ID | Pri | Hallazgo |
|----|-----|----------|
| P-D1 | P0 | ~~Docker init / esquema incompleto~~ → `DisennoDB` incorpora DDL 003–014 + migraciones idempotentes |
| P-D2 | P1 | `estado_actual` + `etapa_flujo` sin CHECK / FSM en BD |
| P-D3 | P2 | `formulario_detalle` JSONB duplica tablas normalizadas |
| P-D4 | P2 | Eventos VIE/CIE anclados a texto libre en `observacion` |
| P-D5 | P2 | Docs DBML aún dicen ~40 tablas |

### Frontend / UX / a11y

| ID | Pri | Hallazgo |
|----|-----|----------|
| P-F1 | P0 | Wizard 17 pasos: carga cognitiva extrema |
| P-F2 | P1 | `FormWizardIan` partido; `EvaluationRolePanels` ~450 + `RubricPanel`/`VinculacionPanel`; `evaluacionesBandeja` extraído; `InicioPage` ~1000 |
| P-F3 | P1 | ~~Sin RBAC en router~~ → `RequireRoleNav` + `roleCanAccessPath` (backend sigue mandando) |
| P-F4 | P1 | ~~Histórico dual~~ → unificado a expediente completo |
| P-F5 | P1 | 8 hojas CSS + prototipo minificado |
| P-F6 | P2 | ~~Validación IAN parcial~~ → límites en `shared/`; `/enviar` exige ORCID, horas TEC, productos mínimos, oficio ≤60 |
| P-F7 | P2 | Mezcla voseo / formal en algunos textos |
| P-F8 | P3 | Wildcard `*` → `/inicio` sin 404 explícito |

### Funcional / institucional pendiente humano

- Firma V01–V06 y revisión manual VIE Publicación
- Erratas de descriptores de rúbrica 2027
- Confirmar que 3 evaluadores = solo demo
- Exclusiones: PDF oficios, correo real, imágenes/video, Orión

---

## 5. Mejoras implementadas (no solo bugs)

1. Modelo de sesión demo con logout y TTL.
2. Configuración documentada en `backend/.env.example` (`ALLOW_HEADER_AUTH`, `CORS_ORIGINS`).
3. Reflow responsive institucional en `a11y.css`.
4. Script `pnpm regression:seguridad-sesion`.
5. Migración `014_integridad_evaluacion_indices.sql`.
6. **Bandeja de evaluaciones** con tabla/lista seleccionable (`EvaluacionBandejaList`) en lugar de solo `<select>`.
7. **Init Docker** aplica migraciones tras schema+seed (`database/docker-init/03-aplicar-migraciones.sh`).
8. Wizard: indicador de secciones incompletas + acceso directo a la siguiente pendiente.
9. **Histórico unificado:** todos los roles abren `/historico/:codigo` con expediente completo (se eliminó el modal resumido dual).
10. **FormWizardIan partido:** orquestador (~240 líneas) + `formWizard/Step00`–`Step15` + `shared.tsx` / `wizardTypes.ts`.
11. **Steps tipados:** eliminado `@ts-nocheck` e imports muertos en `Step00`–`Step15`.
12. **EvaluationRolePanels reducido:** `RubricPanel` en archivo propio (~500 líneas) + `evalTypes.ts`; monolito ~620 líneas (antes ~1100).
13. **RBAC de rutas FE:** `RequireRoleNav` bloquea deep-links fuera de `ROUTES_BY_ROLE` (perfil/config siempre permitidos).
14. **Límites IAN compartidos:** `shared/ian-field-word-limits.json` consumido por FE (`textLimits.ts`) y BE (`propuestaLimites.ts` / enviar / objetivos).
15. **Gate `/enviar` IAN:** `ianEnviarValidacion.ts` + `shared/ian-product-codes.json` (ORCID, mínimos de productos por horas/modalidad, oficio ≤60; espejo del wizard).
16. **Esquema unificado:** `DisennoDB.sql` incluye DDL idempotente 003–014; migraciones hechas re-aplicables.
17. **Helmet** en API (`contentSecurityPolicy` off; CORP cross-origin para el front local).
18. **Split adicional:** `VinculacionPanel.tsx` + `panelShared.tsx`; `backend/src/evaluacionesBandeja.ts`.

---

## 6. Funcionalidades nuevas / no hechas a propósito

| Idea | Valor | Decisión |
|------|-------|----------|
| SSO Orión | Alto institucional | **Pendiente de decisión**; fuera de alcance curso |
| PDF oficios | Alto | Excluido explícitamente |
| Correo SMTP | Alto | Excluido; notificaciones in-app sí |
| Motor workflow configurable | Medio | No; hardcode en `evaluaciones.ts` suficiente para prototipo |
| Export CSV / reportes | Medio | Pendiente; histórico ya filtra |
| Versionado optimista formulario | Medio | Pendiente; hay `FOR UPDATE` en partes |

---

## 7. Decisiones pendientes (no inventadas)

Ver [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md) y perfiles en `correcciones-finales/`.  
Ejemplos: topes de horas/productos sin norma oficial, cierre automático de convocatorias, volumen de bandejas, DIMEX.

---

## 8. Limitaciones de esta auditoría

- No se ejecutó la batería UI completa Playwright (`verificar-actual`) en esta sesión (tiempo/entorno); sí smoke, API y seguridad-sesión.
- No se hizo revisión NVDA presencial.
- No se auditó despliegue en servidor remoto (solo localhost).
- Auth sigue siendo **demo** por diseño del curso; el token eleva el piso pero no es autenticación institucional.

---

## 9. Próximos pasos recomendados (orden)

1. ~~Unificar `DisennoDB.sql` con migraciones 003–014~~ (hecho; backfills siguen en migrations/).
2. Seguir partiendo paneles restantes / acciones de `evaluaciones.ts` (bandeja ya en `evaluacionesBandeja.ts`).
3. ~~Espejo IAN en `/enviar`~~ (hecho). Pendiente opcional: allowlist estricta de códigos de producto.
4. ~~Bandeja tipo tabla~~ / ~~Helmet básico~~ (hechos).
5. Cuando el API salga de localhost: `ALLOW_HEADER_AUTH=false`, secretos rotados, HTTPS; valorar CSRF si aparecen cookies.

---

## 10. Cómo reproducir las pruebas de esta iteración

```bash
# Base de pruebas
docker compose -f docker-compose.test.yml up -d
DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm db:migrate
pnpm --filter sistema-vie-backend build

TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:seguridad-sesion
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:api
# Smoke usa fondos_vie de desarrollo si no se redefine; verificar DATABASE_URL del proceso.
pnpm smoke
```

# Segunda auditoría integral — Sistema VIE · 18 de noviembre de 2026

**Postura:** auditor externo, escéptico respecto a las correcciones de la sesión anterior.  
**No** se da por cerrado un hallazgo solo porque el código fue tocado.  
Documento hermano: [AUDITORIA-INTEGRAL-2026-11-18.md](AUDITORIA-INTEGRAL-2026-11-18.md) · [CONTINUIDAD.md](../CONTINUIDAD.md)

---

## 1. Síntesis ejecutiva (honesta)

El prototipo **sigue siendo académicamente utilizable** para demo del circuito Fondos VIE (redacción → PI → Comité → Consejo → VIE → CIE). Tras esta segunda pasada y el cierre feature-first (sin Orión/IdP), varios **falsos cierres** de la primera auditoría quedaron expuestos y corregidos.

**No está listo para un entorno institucional real.** Auth demo, PII de seed y ausencia de IdP (Orión fuera de alcance por decisión) lo impiden. El gate `/enviar`, la checklist de comité y el alcance de Inicio ya no son cosméticos en API.

Lo verificado automáticamente (tras `pnpm --filter sistema-vie-backend run build`): `regression:api` completo (incl. checklist committee-ready), `regression:completion`, `regression:seguridad-sesion` 7/7, `tsc` BE.  
**No** se verificó: Playwright UI completo, NVDA, volumen Docker fresco desde cero en esta pasada, ni recorrido manual de los 12 roles en navegador.

---

## 2. Revisión crítica de las modificaciones previas

| Afirmación de la 1.ª auditoría | Veredicto 2.ª pasada | Acción |
|-------------------------------|----------------------|--------|
| Gate IAN en `/enviar` “espeja el wizard” | **Sobredeclarado.** Solo equipo/productos/ORCID/oficio; se podía enviar sin fechas, narrativa, plan ni resguardo vía API. | Ampliado gate + test de rechazo |
| RBAC de rutas FE cerrado | **Parcial.** `RequireRoleNav` usa rol real; admin con “Vista actual” no-eval cargaba bandeja admin. | Bandeja admin sin vista de evaluación → mensaje, sin datos |
| Esquema unificado en `DisennoDB` | **Parcial.** Overlay útil; `ADD COLUMN … CHECK` podía no crear constraint; comentarios con mojibake; 009 no está en overlay. | Constraint vía `DO $$`; limpieza comentarios |
| Helmet = endurecimiento | **Cosmético relativo.** Cabeceras OK; CORS sin Origin permitido; CSP off. Aceptable en prototipo, no producción. | Documentado; sin cambio de política |
| Extracción paneles / bandeja | **Correcta estructuralmente**; permisos ad hoc en `evaluaciones.ts` siguen duplicados vs `ACTION_ROLES`. | Deuda residual |
| Scripts one-shot en `/scripts` | **Riesgo de ops** (mutan SQL fuera de pipeline). | Eliminados varios scripts temporales |

**Regresión de proceso descubierta:** `scripts/test-environment.mjs` importa `backend/dist/*`. Cambios en `src` **no** afectan regresiones hasta `pnpm --filter sistema-vie-backend run build`. La 1.ª auditoría pudo dar por “pasados” escenarios con `dist` viejo.

---

## 3. Hallazgos adicionales (2.ª pasada)

### Corregidos en esta sesión

| ID | Pri | Hallazgo | Corrección |
|----|-----|----------|------------|
| A2-01 | P0 | `/enviar` aceptaba expedientes sin fechas/narrativa/plan/resguardo | `validarEnvioIan` ampliado; regresión API |
| A2-02 | P1 | Histórico: `estado` inventado → 200 vacío | Whitelist `ESTADO_LABEL` → 400 |
| A2-03 | P1 | Admin “Vista actual” no-eval veía bandeja admin | `EvaluacionesPage` no carga bandeja |
| A2-04 | P1 | Admin podía **generar** IA sin ser `comite_miembro` | POST IA exige evaluador asignado; GET admin solo lectura |
| A2-05 | P1 | Dictamen PI emitible sin análisis/recomendaciones | Obligatorios en acción `pi` |
| A2-06 | P2 | Códigos de producto no contrastados con `shared/` | Validación + legado `5.5.*` / `opcion_` |
| A2-07 | P2 | `etapa_evento` CHECK frágil en overlay | `DO $$ ADD CONSTRAINT` |
| A2-08 | P2 | Fechas de proyecto: texto parcial inválido en estado | `Step00` no guarda basura |
| A2-09 | P2 | Date picker nativo `pointer-events:none` + `tabIndex=-1` | Foco/teclado restaurados |
| A2-10 | P3 | Scripts one-shot sueltos | Eliminados |
| A2-12 | P1 | Checklist Comité solo UI; `committee-ready` sin payload | Exige `checks` todos true o `completitudConfirmada`; FE envía ambos; test API |
| A2-13 | P1 | `/enviar` sin ética/divulgación/hoja ruta/presupuesto/Q1–Q8+q9 | Gate ampliado; q9 vía `formularioGenerales` |
| A2-15 | P1 | Inicio KPIs con `?view=` cosmético | Alcance usa el rol de vista (admin simulado) |
| A2-16 | P2 | IA incompleta se persistía | Rechazo 502 si `completa:false` tras reintento |

### Pendientes / no corregidos (decisión o alcance)

| ID | Pri | Hallazgo | Por qué no se cerró |
|----|-----|----------|---------------------|
| A2-11 | P0* | Auth demo ≠ Orión/LDAP | **Fuera de alcance permanente** (decisión de producto) |
| A2-14 | P1 | Admin puede subir documentos ajenos (`writable`) | Posible rol de soporte demo; decidir política |
| A2-17 | P2 | Convocatorias: `validDate` UTC vs “hoy” CR | Alinear TZ institucional |
| A2-18 | P2 | `*` → `/inicio` enmascara 404 | UX menor |
| A2-19 | P3 | `ian-product-codes.json` no importado en FE | FE sigue con constantes en `formWizardIan.ts` |

\*Institucional / Orión.

---

## 4. Mejoras adicionales implementadas (más allá de bugs)

- Tests API: rechazo de envío incompleto; rechazo de estado histórico inválido; `committee-ready` sin confirmación → 400.
- Documentación de riesgo: rebuild de `dist` obligatorio antes de regresiones.
- Limpieza de scripts temporales de refactor.
- Prioridad feature-first: Orión descartado; integridad de envío/evaluación/inicio antes que pulido.

---

## 5. Pruebas ejecutadas (esta pasada)

| Suite | Resultado | Notas |
|-------|-----------|-------|
| `tsc` / `build` BE | OK | **Requerido** para regresiones |
| `pnpm regression:api` | todos PASA | Incluye A2-01/02/12/13 |
| `pnpm regression:completion` | todos PASA | |
| `pnpm regression:seguridad-sesion` | 7/7 PASA | |
| Playwright / `verificar-actual` | **No ejecutado** | Tiempo/entorno |
| Docker volume wipe + init | **No ejecutado** en esta pasada | Riesgo residual de init |
| NVDA / a11y manual | **No ejecutado** | |

---

## 6. Qué no pude garantizar

1. Que un volumen Docker **nuevo** aplique overlay + migraciones sin error (solo revisión estática + historial previo).
2. Que la UI Playwright de cada rol no se haya roto por splits de paneles.
3. Que no existan más bypass API en acciones de evaluación no re-leídas línea a línea (~800+ LOC restantes).
4. Paridad 100% wizard ↔ `/enviar` (objetivos específicos, declaración jurada con cédula/firma, adjuntos) sigue parcial.
5. Seguridad fuera de localhost (headers legacy, CORS sin Origin, sesiones en memoria). Orión no aplica.

---

## 7. Preparación institucional

| Criterio | Estado |
|----------|--------|
| Demo de curso / defensa con guion | **Viable** con límites honestos |
| Piloto interno TEC con datos reales | **No** (auth demo, PII, correo, oficios PDF) |
| Producción | **No** |

**Falta para acercarse a institucional (sin Orión en este proyecto):** secretos, HTTPS, `ALLOW_HEADER_AUTH=false`, política de documentos admin, paridad residual IAN, y aceptación humana V01–V06.

---

## 8. Autocrítica final

La primera auditoría mejoró el piso de seguridad y mantenibilidad, pero **infló el cierre** de P-F6 (IAN) y del esquema unificado. Esta segunda pasada lo desinfló con evidencia y luego cerró los huecos feature-critical (enviar, checklist comité, Inicio, IA).

El sistema está **mejor que al inicio de la sesión**, **no terminado**, y **no “listo”** en el sentido institucional. Cualquier afirmación de “listo para usar” debe acotarse a: **prototipo demo con auth de rol y datos de seed**.

# C02 · Línea base en Chromium

**Fecha local:** 30 de octubre de 2026, aproximadamente 22:12, Costa Rica. Las carpetas usan UTC.  
**Aplicación probada:** base `dfb9503`, con infraestructura Playwright nueva; no se cambió código funcional de frontend/backend.

## Sustento y preparación

C02 del plan exige reproducir las observaciones con navegador antes de corregirlas. Se agregó `@playwright/test` como dependencia de desarrollo, su lockfile y `scripts/baseline-ui.mjs`. Se utilizó Chromium descargado por Playwright, una API temporal y un Vite temporal que reenvía `/api` a esa API. Ambos se cierran al terminar. La aplicación se conecta exclusivamente a `fondos_vie_test` después de comprobar su identidad.

La selección del rol en el script se acota a `.prototype-role-box select`: el intento inicial con selector accesible genérico no completó el login. Ese intento se interrumpió y no se usa como evidencia de las pantallas internas ni de un fallo del producto. El script ahora omite el recorrido de un rol cuando falla su login y registra cada observación inmediatamente.

Las pruebas no guardan propuestas ni emiten decisiones. En el diagnóstico CIE se abortaría cualquier petición de acción que llegara a la red para evitar modificar expedientes semilla. **Se observaron cero peticiones**: la validación local impide enviarla antes de ese bloqueo de prueba.

## Resultados comprobados

[Recorrido de escritorio: reporte](2026-10-31T04-12-29-072Z-linea-base-ui/reporte.json).

- Chromium, viewport **1440×900**.
- **47 observaciones registradas**, 48 capturas y **0 errores JavaScript de página** durante ese recorrido. OBSERVADO no significa que la funcionalidad esté correcta.
- Login real de los **12 roles**, inicio y vista principal de cada uno.
- Navegación de los **17 pasos** del formulario, registrando título y cantidad de controles.
- Consulta de histórico, notificaciones, administración y listado de propuestas como admin.
- Apertura de devolución, geometría, foco inicial y cierre mediante Escape.
- Reproducción del rechazo CIE con fundamento no vacío.

[Recorrido móvil de modales: reporte](2026-10-31T04-13-15-308Z-linea-base-ui/reporte.json).

- Viewport **390×844**, roles asistente de Comité y CIE.
- **6 observaciones**, **0 errores JavaScript de página**.
- Se confirma el mismo rechazo CIE y un elemento `.timeline-marker` por encima del diálogo de devolución mediante `elementFromPoint` en la posición (75, 500.90625).

### CTA-01 · Superposición confirmada

[Captura de escritorio](2026-10-31T04-12-29-072Z-linea-base-ui/comite-devolucion-modal.png) · [captura móvil](2026-10-31T04-13-15-308Z-linea-base-ui/comite-devolucion-modal.png).

La ruta de etapas del expediente se dibuja por encima del campo Motivo del modal. El diálogo está dentro del viewport y contiene el foco, pero eso no evita el conflicto de apilamiento. El punto central del diálogo tampoco detecta por sí solo este defecto; por eso se añadió un muestreo de varios puntos internos.

**Dictamen actualizado:** confirmado visualmente en esas condiciones; no corregido. C28 conserva la responsabilidad de corregir y verificar foco/scroll/apilamiento sin cambiar decisiones del negocio.

### CIE-01 · Rechazo bloqueado antes de la API

[Modal con campo](2026-10-31T04-12-29-072Z-linea-base-ui/cie-rechazo-modal.png) · [error posterior](2026-10-31T04-12-29-072Z-linea-base-ui/cie-rechazo-error.png).

Se escribió «Fundamento no vacío para reproducir el contrato de rechazo.» y se confirmó. Aparece «La justificación u observación es obligatoria.», se cierra el modal y **no sale ninguna petición de acción**. Reproducido también en móvil.

Confirma la lectura de código: el panel envía `motivo`, pero el controlador espera `texto`. El recorrido API anterior usó `texto` directamente y no podía descubrir este defecto de interfaz.

### INV-03 · Secciones sin editor

Se observaron cero controles de entrada en Equipo, Estado del arte, Plan de acción y riesgos, Presupuesto y financiamiento, Compromisos, Resguardo, Divulgación, Ética y Hoja de ruta. En Revisión y envío también hay cero controles del cuerpo, lo que no constituye por sí solo una carencia: ahí se esperan resumen y acciones.

[Estado del arte](2026-10-31T04-12-29-072Z-linea-base-ui/wizard-05.png) muestra solo el párrafo orientativo. La etiqueta «Completa» y el aviso de autoguardado aparecen sin probar que exista contenido propio persistido.

## Repetir las pruebas

```bash
pnpm build
pnpm exec playwright install chromium
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm baseline:ui

# Inspección móvil acotada de los dos modales:
UI_ROLES=comite_asistente,cie UI_WIDTH=390 UI_HEIGHT=844 TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm baseline:ui
```

Requiere la base aislada ya healthy. El instalador avisó que utiliza un build fallback Ubuntu 24.04 para este sistema; Chromium funcionó en las ejecuciones registradas. No se infiere compatibilidad con todos los navegadores.

## Pendientes y V0

No se certificaron todavía zoom real al 200 %, lector de pantalla, captura/guardado/relectura de todos los campos, detalle de cada expediente, permisos negativos ni cobertura completa de todos los modales. Las capturas y las pruebas de navegación no sustituyen esos escenarios.

Se actualiza el estado de CTA-01/CIE-01 a reproducidos, pero **no se cierran hallazgos ni se marca aceptación del usuario**. C03 y las nuevas reglas siguen pendientes de V0 y del sustento acordado. La política anual/global de numeración INC-01 no se encontró en las fuentes consultadas y requiere discusión.

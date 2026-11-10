# Guion de demo · V01 (validación humana)

**Fecha de preparación:** 2026-11-09.  
**Objetivo:** recorrer aprobación (y, si hay tiempo, rechazo) con cuentas reales del prototipo. Las casillas de aceptación en `COSAS-A-DISCUTIR.md` las firma el equipo.

## Arranque

```bash
./instalar.sh          # o: docker compose up -d && pnpm db:migrate && pnpm install
pnpm dev
```

- UI: http://localhost:5173  
- API: http://localhost:3000/api/health  
- Contraseña demo: `prototipo2026`  
- Correos: `<rol>@tec.ac.cr` (p. ej. `investigador@tec.ac.cr`)

Para tres evaluadores del Comité: `comite_evaluador@tec.ac.cr`, `comite_evaluador2@tec.ac.cr`, `comite_evaluador3@tec.ac.cr`.

## Recorrido mínimo (V01)

| Paso | Rol | Qué comprobar |
| --- | --- | --- |
| 1 | investigador | Crear borrador, completar secciones clave, **guardar**, F5, ver mismos datos |
| 2 | investigador | Subir un PDF en Documentación, descargarlo, enviar a revisión |
| 3 | vinculacion | Dictamen PI u opción «no requerido» con fundamento |
| 4 | comite_asistente | Completitud / remitir a evaluadores |
| 5 | comite_evaluador ×3 | Ver **CaseFile con resumen, metodología, equipo, plan, presupuesto**; calificar rúbrica |
| 6 | comite_asistente | Confirmar consolidado |
| 7 | consejo | Aval con justificación |
| 8 | direccion_escuela | Comunicar aval (botón PDF = «fuera de alcance») |
| 9 | gestora_vie | Checklist + enviar CIE |
| 10 | cie | Resolución con fundamento |
| 11 | direccion_investigacion | Notificar (aparece en campana del investigador) |
| 12 | admin / investigador | Histórico: filtros escuela + estado; localizar la propuesta |

## Negativos rápidos (V03)

- Login con contraseña mala → 401.
- Investigador no ve borradores ajenos.
- Acción de otro rol en API → 403.
- Enviar sin abstract EN / sin declaración → rechazo con mensaje claro.

## Evidencia automática (no sustituye V01)

```bash
pnpm smoke
# o la batería completa:
./instalar.sh --pruebas --verificar
```

Registrar resultado y carpeta en `correcciones/evidencias/`.

## Firma

- [ ] V01 recorrido feliz  
- [ ] V02 persistencia wizard + adjunto  
- [ ] V03 negativos  
- [ ] V04 a11y (teclado + contraste + lector)  
- [ ] V05 instalación  
- [ ] V06 aceptación en docs de decisiones  

**Responsable:** ____________________ · **Fecha:** ____________________

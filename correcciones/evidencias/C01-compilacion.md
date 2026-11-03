# C01 · Contrato del expediente de evaluación

- Fecha: 30 de octubre de 2026 (Costa Rica).
- Base: `956d609`.
- Hallazgo: bloqueo de compilación adicional identificado en el plan; relacionado con ADI-01.
- Sustento: C01 del plan, contrato `DemoProposal` y CU3/CU4 (expediente real). La API de bandeja no entrega participantes; una lista vacía representa ausencia de datos disponibles y evita atribuir integrantes de ejemplo.
- Cambio: `bandejaToDemoProposal()` entrega `teamTec: []`. No modifica reglas, campos ni validaciones del formulario; no implementa aún la consulta del equipo.
- Antes: `pnpm build` falla con TS2741 por ausencia de `teamTec`.
- Después: `pnpm build` termina con salida 0; backend TypeScript y frontend TypeScript/Vite compilan (65 módulos).
- `git diff --check`: sin errores.
- Límite: la compilación no demuestra el recorrido visual ni la persistencia. API local sin conexión; Docker daemon no disponible incluso fuera del sandbox. No hay pruebas de BD ni navegador aprobadas.

# Prioridad post-auditoría · 9 de noviembre de 2026

Síntesis operativa de la auditoría integral del prototipo (secciones A–J, conversación Cursor 2026-11-09). Alcance de esta iteración: lo que desbloquea la defensa y elimina riesgos de percepción, sin ampliar el producto fuera de la rúbrica.

**Documentos hermanos:** [GUIION-DEMO-V01.md](GUIION-DEMO-V01.md) · [ESTADO-DE-REVISION.md](ESTADO-DE-REVISION.md) · [CONTINUIDAD.md](../CONTINUIDAD.md)

## Orden acordado

| # | Qué | Por qué | Estado en esta iteración |
| --- | --- | --- | --- |
| 1 | Expediente completo en Evaluaciones (CaseFile + enlace RO) | CU4 / 50% CUs: el evaluador debe ver contenido real | Implementado |
| 2 | Limpiar adapters/demo muertos y etiquetar exclusiones de oficios | Evitar que el tribunal confunda plantillas con datos vivos | Implementado |
| 3 | Alinear CONTINUIDAD + INFORME-WCAG con el producto real | Docs desfasados = riesgo en defensa del 28% a11y y del alcance | Implementado |
| 4 | Guion / evidencia automática V01 (smoke + checklist) | Aceptación humana sigue siendo del equipo; se deja rastro ejecutable | Preparado |
| 5 | Seed docs/notifs, UNIQUE evaluación, `propuesta_asignacion`, gate CIE | Integridad / datos de demo | Diferido (siguiente sprint) |
| 6 | Token firmado / CORS / restringir `/demo/roles` | Solo si el API sale de localhost | Diferido (D13 vigente en clase) |

## Fuera de esta iteración (explícito)

- PDF automático de oficios, imágenes/videos, motor genérico de formularios, Orión, correo real.
- Refactor monolítico de `evaluaciones.ts`.
- Rediseño responsive completo (`min-width`).

## Criterio de cierre de esta iteración

- [x] Prioridad escrita y acotada.
- [x] CaseFile muestra datos de `GET /propuestas/:id` (equipo, plan, presupuesto, narrativa).
- [x] Sin `apiToProposalView` inventando plan/presupuesto desde plantilla demo.
- [x] CONTINUIDAD e INFORME-WCAG alineados al producto.
- [ ] Firma humana de V01–V06 (sigue pendiente del equipo).

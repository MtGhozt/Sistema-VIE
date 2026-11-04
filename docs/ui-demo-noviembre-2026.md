# UI demo · noviembre 2026

Resumen de cambios aplicados sobre `master` para la demo con el profesor: KPIs reales, filtros, errores más claros, wizard validado, **detalle = mismo formulario en solo lectura**, y un line-sidebar calmado en los 17 pasos.

## 1. Inicio — KPIs reales

- `InicioPage` deja de mostrar números hardcodeados.
- Las tarjetas de estado son botones/enlaces hacia listados filtrados.
- Fuente: conteos derivados de las propuestas del ámbito del usuario.

## 2. Listas — filtros estilo histórico

- `PropuestasPage` y `ConvocatoriasPage` usan la misma tarjeta de filtros (`filter-card`): búsqueda + estado + Limpiar.
- Estilos reforzados en `brand-overrides.css` (borde sutil y degradado institucional).

## 3. Backend — errores y presupuesto

- `backend/src/app.ts`: respuestas 500 / fallos de API más explícitos en español para la demo.
- `propuestaPresupuesto.ts`: validaciones de montos/años alineadas con el wizard.

## 4. Shell — sidebar colapsable

- `AppShell`: rail de iconos colapsable, sticky a `100vh`, animaciones de transición.
- Iconos auxiliares en `icons.tsx`.

## 5. Wizard — validación al avanzar

- `FormWizardIan` / `PropuestaNuevaPage`: el botón Siguiente valida el paso (fechas, palabras del resumen, presupuesto no negativo, etc.) antes de avanzar.
- Mensajes en español, orientados a corrección.

## 6. Detalle = formulario idéntico en solo lectura

**Problema:** `/propuestas/:id` usaba pestañas distintas al wizard de 17 pasos.

**Solución:**

| Pieza | Rol |
|-------|-----|
| `hydrateFormWizardFromDetalle` | Misma hidratación que `?edit=` |
| `FormWizardStepContent` + `FormWizardIan` (`readOnly`) | Controles iguales; `fieldset disabled`; `patch` no-op |
| `PropuestaDetallePage` | Header de expediente + timeline + wizard 17 pasos |
| Documentos | Fuera del `fieldset` disabled para poder descargar |

- Borrador / subsanación: botones **Editar** → `/propuestas/nueva?edit=` y **Enviar a revisión**.
- CSS: no forzar `opacity: 1` en inputs de `.radio-choice` (evitaba el doble icono Sí/No).

## 7. Line sidebar de pasos

- Componente propio `WizardLineSteps` (inspirado en React Bits *Line Sidebar*, **sin** instalar la librería).
- Raya lateral + leve desplazamiento por proximidad del cursor.
- Colores TEC (`--blue`); respeta `prefers-reduced-motion`.
- Usado en `PropuestaNuevaPage` y `PropuestaDetallePage`.

## Verificación rápida

1. Inicio: KPIs coinciden con el listado.
2. Propuestas / convocatorias: filtrar y limpiar.
3. Nueva propuesta: Siguiente bloquea pasos incompletos.
4. Expediente aprobado: 17 pasos, Sí/No visibles y no editables.
5. Borrador: Editar abre wizard editable; Guardar borrador sigue presente.
6. Pasos: pasar el mouse sobre la lista lateral y ver el efecto de raya.

## Fuera de alcance (consciente)

- No se adoptaron el resto de efectos de React Bits / Uiverse (glitch, cursors, glass, etc.).
- `ProposalDetailView` permanece en el repo por si hace falta depuración; ya no es la vista principal del detalle.

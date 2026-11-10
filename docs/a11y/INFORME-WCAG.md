# Informe de accesibilidad — Sistema VIE (WCAG 2.1 AA)

> Evidencia del bloque **Accesibilidad (28%)** de la rúbrica de
> *Diseño Sw — Prototipo Funcional de Proyecto*.
>
> - Rama: `feat/sprint3-a11y`
> - Commits: `2ceac07`, `082c8c0`, `156a20a`
> - Capa CSS: `frontend/src/styles/a11y.css` (cargada al final, en `main.tsx`)
>
> El CSS del prototipo (`frontend/src/styles/prototipo.css`) **no se modificó**:
> está extraído del HTML de referencia y su cabecera pide no editarlo a mano.
> Todos los cambios viven en una capa aparte, `a11y.css`, que gana la cascada.

---

## 1. Resumen por criterio de la rúbrica

| Criterio | Peso | Antes | Después | Cambio principal |
|---|---|---|---|---|
| Uso de alto contraste | 7% | 🔴 ~40 reglas bajo 4.5:1 | 🟢 todos los textos ≥ 4.5:1, contornos ≥ 3:1 | Tokens de tinta + variantes accesibles del rojo y ámbar TEC |
| Navegación por teclado | 7% | 🔴 sin `:focus-visible`, 4 `outline:0`, modales sin trampa | 🟢 anillo global, foco atrapado en modales, fondo `inert`, `Escape`, skip-link | `a11y.css` + `SimpleModal` |
| Descripción de imágenes/videos | 7% | 🟢 mayormente bien | 🟢 logo/`aria-hidden`; **media del wizard fuera de alcance** (PDF/DOCX/XLSX) | Ver §4.2 actualizado 2026-11-09 |
| Lector de pantalla | 7% | 🔴 toasts no anunciados, diálogos sin nombre, `<h1>` ausente, SPA sin avisos de ruta | 🟢 live regions permanentes, rutas anunciadas + título + foco, tablas con caption/scope, nombres contextuales | Cambios en 22 componentes/páginas + `RouteAnnouncer` |

---

## 2. Uso de alto contraste (WCAG 1.4.3 / 1.4.11)

### 2.0 Control de alto contraste en la UI (rúbrica del curso)

Además del contraste AA por defecto y de `forced-colors`, la rúbrica exige un
**control** en el prototipo. Implementación (2026-10-29):

| Pieza | Ubicación |
|---|---|
| Estado + `localStorage` (`vie.a11y.highContrast`) | `frontend/src/a11y/ContrastContext.tsx` |
| Atributo `data-contrast="high"` en `<html>` | mismo contexto |
| Estilos reforzados (negro / blanco / amarillo) | `a11y.css` §5 |
| Botón en topbar (sesión) y login | `ContrastToggle.tsx` |
| Anuncio a lector de pantalla | `role="status"` + `aria-live="polite"` en `AppShell` |
| Estado del botón | `aria-pressed` |

Cómo probar: en login o en la barra superior, pulsar «Alto contraste» y
verificar que fondos, texto y foco cambian; con NVDA/Narrator debe anunciarse
la activación.

### 2.1 Tokens de tinta

El prototipo tenía **tres bloques `:root`** (dos dentro de la línea minificada
`prototipo.css:3` y uno en `prototipo.css:7-23`). Cada uno redefinía
`--ink` con un tono distinto, así que `--ink-55`/`--ink-35`/`--ink-15`
derivaban de `#1b252d` mientras `--ink` valía `#17212b`. `a11y.css` los
redefine **una sola vez**, todos derivados de `--ink`:

| Token | Antes | Ratio | Después | Ratio | Uso |
|---|---|---|---|---|---|
| `--ink-70` | `rgba(27,37,45,.72)` | 6.0 : 1 | `rgba(23,33,43,.70)` | **6.04 : 1** | texto secundario |
| `--ink-55` | `rgba(27,37,45,.56)` | 3.73 : 1 | `rgba(23,33,43,.68)` | **5.65 : 1** | hints, metadatos, pestañas |
| `--ink-35` | `rgba(27,37,45,.35)` | 2.15 : 1 | `rgba(23,33,43,.52)` | **3.40 : 1** | bordes de control, iconos |
| `--ink-15` | `rgba(27,37,45,.15)` | 1.35 : 1 | `rgba(23,33,43,.50)` | **3.22 : 1** | contorno de input / botón |

> Todos los ratios calculados con la fórmula de luminancia relativa de
> WCAG 2.x sobre fondo blanco (`#fff`).

Con `--ink-55` subido, se corrigen de golpe ~40 reglas que lo usaban:
`.data-table th`, `.field-hint`, `.tabs button`, `.icon-btn`, `.empty-state`,
`.search-field`, `.filter-select`, `.timeline-copy span`, `.notif-popover-item span`,
`.flow-lane small`, `.admin-flow-cards span/small`, `.admin-proposal-list span`,
`.admin-stage-grid span`, `.compact-process > span`.

### 2.2 Colores de marca sobre superficies con texto

El rojo y el ámbar TEC se conservan **intactos para uso decorativo**
(línea roja del logo, marker de la barra lateral, `border-left` de avisos).
Para superficies que llevan texto se añaden dos variantes:

| Token | Original | Ratio con blanco | Variante | Ratio con blanco |
|---|---|---|---|---|
| `--tec-red` | `#EF3340` | 4.02 : 1 ❌ | `--tec-red-strong: #C2262F` | **5.81 : 1** ✅ |
| `--warning` | `#B7791F` | 3.64 : 1 ❌ | `--warning-strong: #8A5A0F` | **5.92 : 1** ✅ |

Aplicado a `.btn-danger`, `.toast.error`, `button[class*="danger"]`,
`.variant-danger` y `.btn-observation`.

### 2.3 Contornos no textuales (1.4.11)

`--ink-15` es el borde de **todos** los inputs, botones secundarios, radios,
checkboxes y selectores. Subirlo a 3.22 : 1 cumple 1.4.11 de una sola vez.
Además se corrigieron tres bordes que usaban `--ink-08` (1.17 : 1):
`.admin-flow-cards button`, `.admin-proposal-list > button`, `.check-row` y
`.custom-check`.

### 2.4 Anillo de foco

`.input:focus` usaba `box-shadow: 0 0 0 3px var(--blue-soft)` → **1.1 : 1,
prácticamente invisible**. Ahora el anillo real es el `outline` global
(§3.1) y el halo del input se reforzó a `rgba(0,47,108,.28)`.

### 2.5 Preferencias del sistema

- `prefers-reduced-motion: reduce` → anula animaciones y transiciones.
- `forced-colors: active` → fuerza `border-color: CanvasText` en todos los
  controles (en modo forzado los bordes por token desaparecen) y anillo
  `Highlight`.

---

## 3. Navegación por teclado (WCAG 2.1.1 / 2.1.2 / 2.4.1 / 2.4.3 / 2.4.7)

### 3.1 Indicador de foco visible

El proyecto **no tenía ni una regla `:focus-visible`** y el prototipo
anulaba el `outline` en cuatro selectores:

| Selector | Problema |
|---|---|
| `.role-select` | `outline:0` |
| `.search-field input` | `border:0; outline:0` |
| `.filter-select select` | `border:0; outline:0` |
| `.admin-role-switch select` | `border:0; outline:0` |
| `.input` | `outline:none` |

`a11y.css` define:

```css
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 3px solid var(--focus-ring) !important;
  outline-offset: 2px !important;
}
```

El `!important` es **deliberado**: `.search-field input` y compañía tienen
especificidad (0,1,1), superior a la de cualquier regla normal, así que sin
`!important` seguirían gana y el foco volvería a ser invisible. El foco solo
se oculta con ratón, porque `:focus-visible` no aplica al pulsar.

Dentro de la barra lateral (fondo azul `#002F6C`) el anillo pasa a blanco:
```css
.sidebar :focus-visible { outline-color: #ffffff !important; }
```

Para los controles cuyo `<input>` real va oculto (`opacity:0`), el anillo se
dibuja sobre el control visible:
```css
.radio-choice input:focus-visible + .radio-dot,
.check-row input:focus-visible + .custom-check { outline: 3px solid … !important; }
```

### 3.2 Skip-link

`AppShell.tsx` ahora abre con un enlace de salto que solo aparece al recibir
foco por teclado:

```html
<a className="skip-link" href="#contenido">Saltar al contenido principal</a>
…
<main className="content" id="contenido" tabIndex={-1}>
```

### 3.3 Modales: trampa de foco, Escape y retorno del foco

`SimpleModal` (usado por los 6 diálogos de evaluación) y el modal de
histórico ahora:

| Comportamiento | Antes | Ahora |
|---|---|---|
| Trampa de foco (`Tab` / `Shift+Tab`) | el teclado salía al fondo | cicla dentro del diálogo |
| `Escape` | no cerraba | cierra |
| Foco inicial | ninguno | primer control del `.modal-body`, o el propio diálogo |
| Retorno del foco | se perdía | vuelve al elemento que abrió el diálogo |
| Nombre accesible | `role="dialog"` sin nombre | `aria-labelledby` + `aria-describedby` |
| Scroll del body | seguía scrolleando | bloqueado mientras el modal está abierto |

`HistoricoPage` dejó de duplicar el modal y ahora reutiliza `SimpleModal`
(una sola implementación, con un solo punto de bugs).

### 3.4 Radios que sí son un grupo

En el wizard, los radios «Sí» / «No» **no compartían `name`**: eran dos
controles independientes, no navegaban con las flechas y no se anunciaban
como «1 de 2». Ahora cada `YesNoRow` genera un `name` con `useId()`.

### 3.5 Pestañas con teclado

Histórico (2026-10): `ProposalDetailView` implementó el patrón APG de
pestañas (`tablist` / `tab` / `tabpanel`, flechas, Home/End). **2026-11-09:**
ese componente se retiró; el detalle vivo es el wizard en solo lectura
(`PropuestaDetallePage` / `FormWizardIan`) y el expediente de evaluación es
`CaseFile` (datos de API, no plantilla demo).

---

## 4. Descripción de imágenes y videos (WCAG 1.1.1)

### 4.1 UI estática

- La app tiene **un solo `<img>`** (`TecLogo.tsx`) con `alt="TEC · Tecnológico
  de Costa Rica"`, `width` y `height`.
- Los 16 iconos SVG de `icons.tsx` usan `aria-hidden="true"`.
- El check del checklist (`CheckIcon`) lleva `aria-hidden="true"`.
- Barras de progreso: `role="progressbar"` con `aria-valuenow` / `aria-valuetext`.

### 4.2 Documentación del wizard (actualizado 2026-11-09)

**Cambio de alcance:** imágenes y videos **no** forman parte del prototipo
entregable. El paso Documentación usa `DocumentosPanel` con carga real de
**PDF / DOCX / XLSX** (≤ 10 MiB, versionado, descarga autorizada).

Implicación para la rúbrica de «descripción de imágenes/videos» (7%):

- Cumplimiento sobre **medios presentes en la UI**: logo TEC con `alt` textual;
  iconos decorativos con `aria-hidden`.
- El control de alt text editable para galería de imagen/video **ya no aplica**
  porque esos controles se retiraron a propósito (exclusión documentada en
  `COSAS-A-DISCUTIR.md` / README). No se debe demostrar como feature viva.
- Si el evaluador pregunta por ese 7%: responder con logo + iconos + exclusión
  explícita de media; no abrir un flujo de alt text que ya no existe.

---

## 5. Lector de pantalla (WCAG 1.3.1 / 2.4.6 / 4.1.2 / 4.1.3)

### 5.1 Regiones live permanentes (el bug más grave)

`ToastHost` montaba y desmontaba el contenedor `aria-live` **junto con el
toast**. Muchos lectores de pantalla no anuncian una región live que recién
aparece, así que **los avisos de éxito y error no se anunciaban**.

El contenedor ahora **nunca se desmonta**; solo se vacía. Igual se aplicó en:

- `LoginPage` — estado de la API y error de conexión.
- `ConvocatoriasPage` — mensajes de error al crear/publicar.
- `NotificacionesPage` y `NotificationBell` — cantidad de notificaciones sin
  leer (`role="status"`), y «Sin leer.» como texto solo para lector dentro de
  cada notificación no leída (el punto azul es decorativo).
- `AppShell` — el contador de la barra lateral es `aria-hidden` y su equivalente
  accesible («3 sin leer») forma parte del nombre del enlace.
- `PropuestasPage`, `HistoricoPage` y `ConvocatoriasPage` — número de
  resultados tras cargar o filtrar, con `aria-busy` en la tarjeta mientras se
  consulta la API.
- `AdministracionPage` — sección seleccionada al cambiar de pestaña.
- `EvaluationRolePanels` — calificación ponderada y recomendación de la rúbrica.
- `DocumentosPanel` — «Procesando documento…» mientras se sube o retira.
- `PropuestaDetallePage` — aviso de subsanación.

### 5.2 Diálogos y popovers

- `SimpleModal`: `aria-labelledby` (título) y `aria-describedby` (descripción).
  Mientras está abierto, `.app-shell` / `.login-page` reciben `inert` y
  `aria-hidden="true"` (con contador por si hay más de un diálogo), de modo que
  el lector no puede recorrer la página de fondo. Al cerrar se restauran los
  valores previos y el foco vuelve al control que abrió el diálogo.
- `NotificationBell`: era `role="menu"` conteniendo `<ul>/<li>` (roles
  `listitem` dentro de un `menu`, **ARIA inválido**) y `role="menuitem"`
  sobre `<button>` (sobrescribía el rol `button` y exigía navegación con
  flechas inexistente). Ahora es `role="dialog"` con `aria-label` y
  `aria-controls`; al abrir el foco entra en el primer elemento del panel, y al
  cerrar con `Escape` vuelve al botón.
- `ConvocatoriasPage`: al abrir el detalle, el foco va al `<h2>` del bloque
  (`tabIndex={-1}`), que además nombra la región con `aria-labelledby`.

### 5.3 Landmarks

| Landmark | Antes | Ahora |
|---|---|---|
| `main` | 1 (solo AppShell) | 2 — **LoginPage ahora tiene `<main>`** |
| `contentinfo` | ✗ (`<div class="sidebar-footer">`) | ✓ `<footer class="sidebar-footer">` |
| `navigation` | ✓ | ✓ + `<nav class="wizard-steps" aria-label="Pasos del formulario">` |
| `banner` | ✓ | ✓ |

### 5.4 Jerarquía de encabezados

| Página | Antes | Ahora |
|---|---|---|
| Detalle de propuesta | `h1` → `h3` (salto) | `h1` → `h2` (los `h3` de los paneles son `h2`) |
| Wizard de 17 pasos | **sin `h1`** | `h1` (sr-only) → `h2` (paso) → `h3` (bloques del formulario) |
| Login | `h1` + `h2` | `h1` + `h2` (sin cambios) |

> El `h1` del wizard es `sr-only` a propósito: la barra de la tarjeta del
> wizard es un encabezado compacto y agregar un título visible cambiaría el
> diseño ya validado contra el prototipo HTML.

### 5.5 Formularios

- **`<label>` anidado eliminado** (`FormWizardStepContent.tsx`, paso 14): HTML
  inválido que rompía la asociación nombre↔control del checkbox. El bloque
  ahora es `role="group"` con `aria-labelledby`.
- `htmlFor` / `id` explícitos en login, filtros de histórico, campos del
  checklist y criterios de la rúbrica (antes: 0 coincidencias de `htmlFor` en
  todo el repo).
- Cada bloque de pregunta del wizard es `role="group"` con
  `aria-labelledby` → el lector anuncia la pregunta antes del control.
- El checklist de completitud es un `role="group"` con nombre.

### 5.6 Elementos no textuales con nombre accesible

- `ProcessTimeline`: era `<div aria-label="Etapas del flujo">` — un `div`
  genérico **ignora** el nombre accesible. Ahora es `<ol role="list">` con
  `aria-label` y los marcadores son `aria-hidden`.
- `PropuestasPage` / `PropuestaNuevaPage`: `role="progressbar"` con
  `aria-valuenow`, `aria-valuemin`, `aria-valuemax` y `aria-valuetext`.
- `PropuestaNuevaPage`: `aria-current="step"` en el paso activo del wizard
  (antes el paso actual se distinguía **solo por color**).
- `EvaluacionesPage`: `aria-label` en el selector de expediente de la vista
  admin (la vista no-admin ya lo tenía).
- `AdministracionPage`: las secciones «Usuarios», «Catálogos» y «Formularios»
  no están implementadas; antes parecían botones activos sin `onClick`.
  Ahora quedan `disabled` con `title` explicativo.

### 5.7 Navegación de una SPA: título, anuncio y foco

En una aplicación de una sola página no hay cambio de documento, así que el
lector **no se enteraba** de que la vista había cambiado. `RouteAnnouncer`
(`frontend/src/a11y/RouteAnnouncer.tsx`, montado en `main.tsx`):

1. Actualiza `document.title` con el `<h1>` de la vista y el nombre del sitio.
2. Anuncia «Página: …» en una región `role="status"` permanente.
3. Mueve el foco al `<main>` (`tabIndex={-1}`) en cada cambio de ruta — el
   primer render no mueve el foco.

Un `MutationObserver` sobre el contenido vuelve a sincronizar el título cuando
una vista de detalle termina de cargar (`Cargando…` → título real). Las
mutaciones se agrupan en un `requestAnimationFrame` para no recalcular en cada
tecla. El `<main>` del login también es enfocable (`id="contenido"`), igual que
el `main` del shell.

### 5.8 Tablas con semántica completa

En `PropuestasPage`, `HistoricoPage`, `ConvocatoriasPage`,
`AdministracionPage`, `CaseFile` y en las tablas del wizard:

- Cada tabla tiene `<caption>` (visible solo para lector) o `aria-label`.
- Todos los `<th>` tienen `scope="col"`.
- La columna de acciones tiene un `th` con «Acciones» solo para lector.

Además, las filas de propuestas/histórico **dejaron de ser enfocables**
(`tabIndex` + `onKeyDown` en `<tr>`). El título ahora es un `<Link>` o
`<button>` real, de modo que se puede recorrer con la tecla de enlaces/botones
del lector y cada acción tiene un nombre propio:

- «Ver propuesta VIE-…: …», «Ver expediente …: …», «Ver convocatoria VIE-…: …».
- El clic con ratón en la fila se conserva como atajo; el enlace detiene la
  propagación para no navegar dos veces.

### 5.9 Nombres accesibles en controles repetidos

Los botones idénticos de listas dinámicas se distinguían solo por posición
visual. Ahora incluyen contexto (`FormWizardIan`, `EquipoEditor`,
`EditableRows`, `PlanEditor`, `ConvocatoriasPage`):

| Antes | Ahora |
|---|---|
| «Quitar» | «Quitar persona TEC 2: Ana Pérez» |
| «Quitar actividad» | «Quitar actividad 3» |
| «Quitar riesgo» | «Quitar riesgo 2 de la actividad 1» |
| «Agregar tipo de horas» | «Agregar tipo de horas, persona TEC 1» |
| «Quitar tipo de horas» | «Quitar VIE de Ana Pérez» |
| «Responsabilidad» | «Responsabilidad, participante 2 de la actividad 3» |
| «Actividad» | «Descripción de la actividad 1» |
| «Eliminar» (cronograma) | «Eliminar actividad 1 del cronograma» |
| «Quitar ítem» | «Quitar Riesgos y mitigación 1» |

En `PropuestaNuevaPage` el foco pasa al `<h2>` del paso al avanzar/retroceder,
y el `role="progressbar"` anuncia «NN % del formulario completado» además del
valor numérico.

### 5.10 Estados de carga

Las vistas que antes mostraban solo «Cargando…» ahora tienen un `h1` (visible o
`sr-only`) para que la ruta tenga título, y el mensaje dentro de un
`role="status"`. La tarjeta contenedora usa `aria-busy` mientras dura la
consulta (`PropuestasPage`, `HistoricoPage`, `ConvocatoriasPage`,
`EvaluacionesPage`, `PropuestaDetallePage`, `PropuestaNuevaPage`,
`DocumentosPanel`).

---

## 6. Qué queda fuera (decisiones consciente)

| Ítem | Decisión |
|---|---|
| `htmlFor` en **todos** los labels del wizard (17 pasos) | Se hizo en login, histórico, rúbrica y alt text de recursos. El resto usa label implícito (válido). |
| `h1` visible en el wizard | Se optó por `sr-only` para no romper el layout validado contra el prototipo HTML. |
| Subir binarios de imagen/video al backend | Fuera de alcance; Documentación = PDF/DOCX/XLSX reales. No hay UI de alt text para media. |
| Pruebas automatizadas (axe-core / Playwright) | Candidato natural; aún no hay harness de e2e en el repo. |

### 6.1 Checklist manual con lector de pantalla (NVDA / Narrator)

1. Login: anuncia «Iniciar sesión», campos Correo / Contraseña / Rol.
2. Al entrar (o cambiar de sección) debe oírse «Página: …» y el foco quedar en
   el contenido principal; el título de la ventana cambia con la vista.
3. Activar **Alto contraste** → debe oírse el anuncio de estado.
4. Skip-link con Tab → «Saltar al contenido principal».
5. Propuestas / Histórico: con la tecla de tablas del lector, cada tabla
   anuncia su caption y los encabezados; con la tecla de enlaces, cada título
   se anuncia como enlace («Ver propuesta …»).
6. Wizard · Documentación: subir un PDF/DOCX/XLSX, oír el estado de carga y
   comprobar descarga; no hay paso de imagen/video.
7. Evaluaciones · modal de aval: justificación obligatoria anunciada; Confirmar
   deshabilitado hasta escribir; con el modal abierto no se puede tabular al
   fondo.
8. Campana de notificaciones: al abrir, el foco entra en el panel; `Escape`
   vuelve a la campana.
9. Toast de éxito/error anunciado (live region permanente).

---

## 7. Cómo verificarlo

```powershell
# Frontend (typecheck + build + lint)
cd frontend
npx tsc -b
npx vite build
npx oxlint
```

Para una revisión manual:

1. Levantar el stack desde la raíz: `pnpm db:up` → `pnpm install` → `pnpm dev`.
2. Recorrer **solo con teclado** (`Tab` / `Shift+Tab` / `←` `→` / `Escape`):
   - el anillo de foco debe verse en **todos** los controles;
   - el skip-link aparece al primer `Tab`;
   - en un modal, `Tab` no sale del diálogo y `Escape` lo cierra.
3. Revisar que el borde de los inputs ahora es visible (cambio visual
   intencional: `--ink-15` pasó de 1.35 : 1 a 3.22 : 1).

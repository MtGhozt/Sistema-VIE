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
| Navegación por teclado | 7% | 🔴 sin `:focus-visible`, 4 `outline:0`, modales sin trampa | 🟢 anillo global, foco atrapado en modales, `Escape`, skip-link | `a11y.css` + `SimpleModal` |
| Descripción de imágenes/videos | 7% | 🟢 mayormente bien | 🟢 igual + iconos decorativos marcados | `aria-hidden` en el check del checklist |
| Lector de pantalla | 7% | 🔴 toasts no anunciados, diálogos sin nombre, `<h1>` ausente | 🟢 live regions permanentes, roles ARIA, jerarquía h1→h2→h3, landmarks | Cambios en 12 componentes/páginas |

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

`ProposalDetailView` — las 6 pestañas del detalle ahora implementan el
patrón APG completo: `role="tablist"` / `role="tab"` / `role="tabpanel"`,
`aria-selected`, `aria-controls`, `aria-labelledby`, `tabIndex` roving y
navegación con `←` `→` `Home` `End`.

---

## 4. Descripción de imágenes y videos (WCAG 1.1.1)

### 4.1 UI estática

- La app tiene **un solo `<img>`** (`TecLogo.tsx`) con `alt="TEC · Tecnológico
  de Costa Rica"`, `width` y `height`.
- Los 16 iconos SVG de `icons.tsx` usan `aria-hidden="true"`.
- El check del checklist (`CheckIcon`) lleva `aria-hidden="true"`.
- Barras de progreso: `role="progressbar"` con `aria-valuenow` / `aria-valuetext`.

### 4.2 Recursos gráficos del wizard (rúbrica: alt text editable)

Paso **Documentación** del formulario (`FormWizardStepContent`, step 15):

- Se pueden **agregar imágenes y videos** (`accept="image/*"` / `video/*`).
- Cada recurso exige un **texto alternativo editable** (y modificable después).
- Aviso si la descripción tiene menos de 40 caracteres (`ALT_TEXT_MIN_CHARS`).
- Estado en `FormWizardState.recursosGraficos` (prototipo; no sube binarios al
  servidor — sí demuestra el control de descripción alternativa).

---

## 5. Lector de pantalla (WCAG 1.3.1 / 2.4.6 / 4.1.2 / 4.1.3)

### 5.1 Regiones live permanentes (el bug más grave)

`ToastHost` montaba y desmontaba el contenedor `aria-live` **junto con el
toast**. Muchos lectores de pantalla no anuncian una región live que recién
aparece, así que **los avisos de éxito y error no se anunciaban**.

El contenedor ahora **nunca se desmonta**; solo se vacía. Igual se aplicó en:

- `LoginPage` — estado de la API y error de conexión.
- `ConvocatoriasPage` — mensajes de error al crear/publicar.

### 5.2 Diálogos y popovers

- `SimpleModal`: `aria-labelledby` (título) y `aria-describedby` (descripción).
- `NotificationBell`: era `role="menu"` conteniendo `<ul>/<li>` (roles
  `listitem` dentro de un `menu`, **ARIA inválido**) y `role="menuitem"`
  sobre `<button>` (sobrescribía el rol `button` y exigía navegación con
  flechas inexistente). Ahora es `role="dialog"` con `aria-label` y
  `aria-controls`, y el foco vuelve al botón al cerrar con `Escape`.

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

---

## 6. Qué queda fuera (decisiones consciente)

| Ítem | Decisión |
|---|---|
| `htmlFor` en **todos** los labels del wizard (17 pasos) | Se hizo en login, histórico, rúbrica y alt text de recursos. El resto usa label implícito (válido). |
| `h1` visible en el wizard | Se optó por `sr-only` para no romper el layout validado contra el prototipo HTML. |
| Subir binarios de imagen/video al backend | Fuera de alcance del prototipo; el control de alt text sí está en la UI. |
| Pruebas automatizadas (axe-core / Playwright) | Candidato natural; aún no hay harness de e2e en el repo. |

### 6.1 Checklist manual con lector de pantalla (NVDA / Narrator)

1. Login: anuncia «Iniciar sesión», campos Correo / Contraseña / Rol.
2. Activar **Alto contraste** → debe oírse el anuncio de estado.
3. Skip-link con Tab → «Saltar al contenido principal».
4. Wizard · Documentación: agregar imagen, oír el label «Texto alternativo»,
   editar y oír el `role="status"` de longitud.
5. Evaluaciones · modal de aval: justificación obligatoria anunciada; Confirmar
   deshabilitado hasta escribir.
6. Toast de éxito/error anunciado (live region permanente).

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

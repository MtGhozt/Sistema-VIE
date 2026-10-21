# 03 — MARCA TEC | Colores, logo, tipografía y reglas aplicadas

> Extraído del Libro de Marca TEC (`Manual Identidad Tec/30_01_25-manual-tec-1.pdf`)
> y verificado con el Manual de Identidad Institucional público (tec.ac.cr).
> Uso académico para el prototipo.

## 1. Colores oficiales (lo único que el prototipo necesita)

| Uso | PANTONE | HEX aplicado | RGB aprox |
|---|---|---|---|
| **Azul corporativo** (principal) | 295C | `#002855` | 0, 40, 85 |
| **Rojo complementario** (acento) | 032C | `#EF3340` | 239, 51, 64 |
| Fondo | Blanco | `#FFFFFF` | 255,255,255 |
| Texto | Negro / gris oscuro | `#1A1A1A` / `#444444` | — |
| Gris soporte (fondos logo) | Gris | `#E5E7EB` | — |

**Proporción oficial**: ~70% blanco · 20% azul · 5% rojo · 5% otros.
**Trama**: el azul puede tramarse hasta 20%.
**Prohibido**: fondos amarillos, rojos, cian o combinación amarillo+azul en piezas con
logo (colores de otras universidades estatales). El rojo/cian no se usan en
proporciones significativas — solo como acento.

> HEX: PANTONE es tinta impresa, no tiene HEX único. `#002855` (295C) y `#EF3340`
> (032C) son las equivalencias digitales estándar usadas por el TEC en web.

## 2. Logo y firmas

- **Logo institucional** = uso oficial y formal (oficios, comunicados, eventos académicos).
  Solo sobre fondos sólidos: negro, azul, gris, blanco. La **línea roja se mantiene roja**
  salvo limitación técnica del soporte.
- **Firmas TEC-1 / TEC-2** (`firmatec-1.pdf`, `firmatec-2.pdf`) = uso promocional o cuando
  el logo no es viable técnicamente. TEC-1 va "anclada" al nombre Tecnológico de Costa Rica.
- **Área de reserva**: dejar libre alrededor el ancho de la letra "T" (arriba/abajo y laterales).
- **Tamaño mínimo**: logo 2.5 cm / 150 px horizontal; firma TEC-1 1 cm / 50 px; TEC-2 3 cm / 110 px.
- **Nombre**: escribir "Tecnológico de Costa Rica (TEC)" la primera vez; luego "TEC".
  Nombre legal: Instituto Tecnológico de Costa Rica (uso formal/reglamentario).
- El prototipo usa el **logo oficial** de `docs/manual-identidad-tec/logotec.pdf`
  exportado a `frontend/public/brand/logotec-*.png` (azul / blanco).
  Area de reserva: no apretar el PNG; ancho ~220px en sidebar.
- Los PNG **no** son capturas de pantalla: se generan desde el PDF vectorial del
  manual con `pnpm brand` (`scripts/build-brand-assets.mjs`). Regenerarlos si se
  cambia el manual, y no editarlos a mano.

## 3. Tipografía y tono

- Tipografía del logo alude a carácter/prestigio; azul = solidez, seriedad, inteligencia,
  compromiso; rojo = movimiento, fuerza, intensidad.
- Tono de comunicación: confianza, ayuda y orientación (no promocional vacío).
- Web del prototipo: fuente del sistema (`system-ui`) — neutra y legible. En versión final
  definir la familia institucional según manual (ver capítulo tipografías del PDF).

## 4. Aplicado en el prototipo (`Codigo0.1/public/styles.css`)

```css
:root {
  --tec-azul: #002855;   /* PANTONE 295C */
  --tec-rojo: #EF3340;   /* PANTONE 032C */
  --fondo: #FFFFFF;      /* 70% */
  --texto: #1A1A1A;
  --gris: #E5E7EB;
}
```

Header azul, acentos/botones críticos en rojo solo para acciones (aprobar, alertas),
fondo blanco, cards con borde gris. Cumple 70/20/5/5 a simple vista.

## 5. Checklist de cumplimiento

- [x] Header azul + texto blanco, línea roja fina (línea roja del logo).
- [x] Sidebar azul + logo oficial blanco (`frontend/public/brand/logotec-blanco.png`) — contraste marca.
- [x] Proporción blanco/azul/rojo respetada.
- [x] Sin fondos amarillos/cian/rojos plenos.
- [x] Logo oficial de `logotec.pdf` en sidebar/login (`frontend/public/brand/`).
- [ ] Sustituir PNG por SVG vectorial exportado desde Illustrator (Etapa 2).
- [ ] Definir familia tipográfica institucional (Etapa 2).

# Brand assets — TEC

Fuente oficial: **Manual de Identidad Institucional TEC**, incluido en este repo
(`docs/manual-identidad-tec/`). Todo lo que hay aquí se genera con `pnpm brand`;
no hay capturas de pantalla ni rutas absolutas, así que cualquier compañero puede
regenerarlo.

| Archivo | Uso | Origen |
|---------|-----|--------|
| `logotec-azul.png` | Logo completo sobre fondos claros | `logotec.pdf` p1 |
| `logotec-blanco.png` | Logo completo sobre azul/oscuro (sidebar, login) | `logotec.pdf` p1 (variante vaciada) |
| `tec-wordmark-azul.png` | Solo “TEC” (azul) | `firmatec-1.pdf` |
| `tec-wordmark-blanco.png` | Solo “TEC” (blanco) | `firmatec-1.pdf` (variante vaciada) |
| `tec-nombre-azul.png` | Solo “Tecnológico de Costa Rica” | `firmatec-2.pdf` |
| `tec-nombre-blanco.png` | Solo “Tecnológico de Costa Rica” (blanco) | `firmatec-2.pdf` (variante vaciada) |
| `tec-separador-rojo.png` | Línea roja vertical del lockup | `logotec.pdf` p1 |

Reglas del manual que ya se respetan en estos archivos:

- Azul `#002855` (PANTONE 295C) y rojo `#EF3340` (PANTONE 032C).
- La **línea roja se mantiene roja** también en la versión vaciada (cap. 2,
  “Marca de la institución”).
- Fondo transparente (no blanco) para que sirvan sobre cualquier color.

## Regenerar

```powershell
pnpm install     # una sola vez (trae @napi-rs/canvas y pdfjs-dist)
pnpm brand       # escribe los PNG en frontend/public/brand/
```

Inspección de los PDF originales (salida en `out/brand-render/`, ignorado por git):

```powershell
pnpm brand:preview
```

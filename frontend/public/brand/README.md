# Brand assets — TEC

Fuente oficial: `docs/manual-identidad-tec/logotec.pdf`

| Archivo | Uso |
|---------|-----|
| `logotec-azul.png` | Logo completo sobre fondos claros |
| `logotec-blanco.png` | Logo completo sobre azul/oscuro (sidebar, login) |
| `tec-wordmark-azul.png` | Solo “TEC” (azul) |
| `tec-wordmark-blanco.png` | Solo “TEC” (blanco) |
| `tec-nombre-azul.png` | Solo “Tecnológico de Costa Rica” |

Regenerar (requiere `pnpm add -D -w canvas` una vez):

```powershell
node scripts/crop-logotec-from-shot.mjs
```


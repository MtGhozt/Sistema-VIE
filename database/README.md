# Database — Sistema VIE (PostgreSQL)

Diseño relacional del sistema Fondos VIE.

## Fuente de verdad

`Diseno_Base_Datos_Fondos_VIE (con cambios).md` — **40 tablas**.

| Archivo | Uso |
|---|---|
| `fondos_vie_modelo.dbml` | Modelo para [dbdiagram.io](https://dbdiagram.io) |
| `DisennoDB.sql` | DDL exportado (crear esquema en PostgreSQL) |
| `DisennoDB.pdf` | Diagrama ER exportado |
| `DMBL-VIE.pdf` | Propuesta intermedia del compañero (histórico) |
| `Diseno_Base_Datos_Fondos_VIE.md` | Versión anterior (38 tablas) — archivo histórico |

## Tablas añadidas (38 → 40)

- `propuesta_palabra_clave`
- `propuesta_participante_hora`

También: `trl_actual` / `trl_esperado` en `propuesta`.

## Regenerar diagrama

1. Pegar `fondos_vie_modelo.dbml` en dbdiagram.io  
2. Export PNG/PDF → actualizar `DisennoDB.pdf`  
3. Export SQL si cambia el modelo → actualizar `DisennoDB.sql`

# Diseño de BD — Fondos VIE

Artefactos del modelo relacional PostgreSQL (**40 tablas**).

## Archivos

| Archivo | Rol |
|---|---|
| `Diseno_Base_Datos_Fondos_VIE (con cambios).md` | **Fuente de verdad** (diccionario, inventario, análisis) |
| `fondos_vie_modelo.dbml` | Modelo para [dbdiagram.io](https://dbdiagram.io) (sincronizado con el MD) |
| `DisennoDB.pdf` / `DisennoDB.sql` | Export actual del diagrama y DDL (40 tablas; 2026-10-01) |
| `DMBL-VIE.pdf` | Export PDF previo del diagrama (referencia) |
| `Diseno_Base_Datos_Fondos_VIE.md` | Versión anterior del documento (38 tablas) — histórica |

## Checks rápidos

- Inventario §3.1 del MD: **40 tablas**.
- En `propuesta`: `trl_actual` / `trl_esperado` (no `nivel_trl`); sin `palabras_clave` / `keywords_en` embebidas.
- Horas: solo en `propuesta_participante_hora` (`tipo_hora`, `cantidad_horas`).
- Tablas nuevas: `propuesta_palabra_clave`, `propuesta_participante_hora`.

## Regenerar desde DBML (si hace falta)

1. Abrir https://dbdiagram.io → pegar `fondos_vie_modelo.dbml`.
2. Verificar **40** tablas y panel de errores vacío.
3. Export → PDF/SQL y reemplazar `DisennoDB.pdf` / `DisennoDB.sql`.

## Copias del proyecto

Mantener los mismos archivos en:

- `...\Diseno\04-diseno-bd\`
- `...\Proyecto1\diseno-bd\`
- `...\Sistema-VIE\diseno-bd\`

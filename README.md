# Sistema Fondos VIE

Repositorio del proyecto de Diseño de Interfaces — Sistema de gestión de convocatorias y propuestas de investigación (Fondos VIE, TEC).

## Estructura

```
Sistema-VIE/
├── diseno-bd/              # Modelo BD (MD 40 tablas, DBML, PDF, SQL)
├── docs/                   # Documentación del proyecto
│   ├── cerebro/            # Mapa, dominio, marca, handoff Figma
│   ├── etapa1/             # Personas, AI, contexto
│   ├── oficiales-vie/      # Formularios y anexos oficiales
│   ├── enunciado-curso/    # Material del curso
│   ├── referencias/        # Ejemplos / extractos
│   └── rubrica-prototipo-funcional/
├── manual-identidad-tec/   # Manual de marca TEC
├── prototipo-html/         # Prototipo HTML estático
└── prototipo-funcional/    # Prototipo Node (sin node_modules)
```

## Diseño de base de datos

Fuente de verdad: `diseno-bd/Diseno_Base_Datos_Fondos_VIE (con cambios).md` (**40 tablas**).

- Modelo: `diseno-bd/fondos_vie_modelo.dbml`
- Export DDL: `diseno-bd/DisennoDB.sql`
- Diagrama: `diseno-bd/DisennoDB.pdf`

Cambios clave respecto a la versión de 38 tablas: `propuesta_palabra_clave`, `propuesta_participante_hora`, y `trl_actual` / `trl_esperado` en `propuesta`.

## Prototipos

```bash
# HTML estático
open prototipo-html/Fondos-VIE-Prototipo.html

# Funcional (Node)
cd prototipo-funcional
pnpm install
pnpm start
```

## Notas

- No versionar `node_modules/`, `*.db` ni `.env`.
- PDFs, SQL y documentación del proyecto **sí** van al repo.

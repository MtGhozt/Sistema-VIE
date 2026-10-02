# Sistema VIE (Fondos VIE — TEC)

Repositorio del **prototipo funcional** del sistema de gestión de propuestas Fondos VIE  
(Tecnológico de Costa Rica). Curso: Diseño de Software.

Stack objetivo: **PostgreSQL** + backend Node + frontend web.  
La base académica (rúbrica, convocatoria, marca, etapa 1) vive en `docs/`.

## Estructura

```
Sistema-VIE/
├── backend/     # API / servidor (hoy: Express + SQLite de arranque)
├── frontend/    # Interfaz (hoy: prototipo HTML/React empaquetado)
├── database/    # Diseño y DDL PostgreSQL (40 tablas) — fuente de verdad
└── docs/        # Material académico (rúbrica, enunciado, oficiales, marca…)
```

## Base de datos (PostgreSQL)

Fuente de verdad:  
`database/Diseno_Base_Datos_Fondos_VIE (con cambios).md` (**40 tablas**)

| Artefacto | Archivo |
|---|---|
| Modelo DBML | `database/fondos_vie_modelo.dbml` |
| DDL SQL | `database/DisennoDB.sql` |
| Diagrama | `database/DisennoDB.pdf` |

> El backend actual aún usa SQLite solo como andamiaje. La implementación del prototipo funcional debe migrar a **PostgreSQL** según este diseño.

## Cómo correr (estado actual — scaffolding)

```powershell
# Frontend (abrir en navegador o servir estático)
cd frontend
npx --yes serve -l 5173 .

# Backend (prototipo base)
cd backend
pnpm install
pnpm start
# http://localhost:3000
```

## Docs académicos

- Rúbrica prototipo funcional → `docs/rubrica-prototipo-funcional/`
- Convocatoria / formularios → `docs/oficiales-vie/`
- Personas / contexto etapa 1 → `docs/etapa1/`
- Manual identidad TEC → `docs/manual-identidad-tec/`
- Dominio / mapa → `docs/cerebro/`

## Próximo objetivo (rúbrica)

1. Interfaz (estética TEC, ortografía, flujo)  
2. Accesibilidad (contraste, teclado, alt text, lector)  
3. **5 casos de uso** con **CRUD real** sobre PostgreSQL  

## Notas Git

No versionar: `node_modules/`, `*.db`, `.env`.  
Sí versionar: SQL, PDF de diseño, documentación del curso.

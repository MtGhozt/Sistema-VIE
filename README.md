# Sistema VIE · Fondos VIE — TEC

Prototipo académico para formular, evaluar y consultar propuestas de investigación. Frontend React + TypeScript + Vite, API Express + TypeScript y PostgreSQL 16.

## Instalación rápida en Linux/macOS o una terminal Bash

Requisitos previos:

- Node.js compatible con Vite: **20.19+ o 22.12+**.
- **pnpm** (el proyecto declara 9.15.0) o Corepack disponible para ejecutarlo.
- **Docker con Compose**, iniciado y accesible desde su cuenta.

Desde la raíz del repositorio:

```bash
./instalar.sh
pnpm dev
```

El instalador descarga las dependencias según `pnpm-lock.yaml`, compila frontend/backend, levanta PostgreSQL y aplica las migraciones incrementales. No sobrescribe archivos `.env` ni borra datos existentes. Las herramientas compartidas del sistema —Node, pnpm y Docker— son requisitos, no se instalan ni desinstalan automáticamente.

| Servicio | Dirección |
| --- | --- |
| Interfaz | http://localhost:5173 |
| API · salud | http://localhost:3000/api/health |
| PostgreSQL de desarrollo | `localhost:5432`, base `fondos_vie` |

El usuario/contraseña local de PostgreSQL del compose es `vie` / `vie`. Si el puerto 5432 ya está ocupado, revise su servicio existente o configure el compose y la URL antes de iniciar.

Si el archivo perdió el permiso de ejecución al copiarlo, ejecute `bash instalar.sh` o `bash desinstalar.sh`.

## Preparar y ejecutar pruebas con un solo comando

```bash
./instalar.sh --pruebas --verificar
```

Este modo usa **`fondos_vie_test` en el puerto 55432**, con contenedor y volumen separados de desarrollo. Instala Chromium de Playwright y ejecuta las regresiones API, D01–D11 y de navegador. Cada prueba inicia sus propios servidores temporales y los cierra al finalizar.

Los datos creados por las pruebas se conservan para inspección. Los reportes y capturas se escriben en `correcciones/evidencias/<ejecucion>/`. Un resultado correcto de estas regresiones no sustituye las validaciones del usuario ni resuelve las decisiones institucionales pendientes.

Para preparar la base de pruebas sin ejecutar las regresiones:

```bash
./instalar.sh --pruebas
```

Para revisar manualmente esa misma base desde la interfaz:

```bash
DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm dev
```

La interfaz continúa en `localhost:5173` y la API en `localhost:3000`, conectadas a la base aislada. Cierre antes otra instancia de `pnpm dev` que use esos puertos.

Otros modos útiles:

```bash
./instalar.sh --pruebas --verificar --simular  # muestra acciones sin ejecutarlas
./instalar.sh --con-navegador                 # desarrollo + Chromium
./instalar.sh --help
```

Las pruebas de navegador necesitan las bibliotecas del sistema que requiera Chromium. Si Playwright informa que faltan, resuelva ese requisito antes de repetir; el instalador no modifica paquetes del sistema operativo.

La integración del formulario y las convocatorias de Ian se documenta en [MERGE-IAN.md](correcciones/MERGE-IAN.md). Sus comprobaciones específicas se ejecutan con `pnpm regression:merge-ian` usando `TEST_DATABASE_URL` de pruebas; también están incluidas en `./instalar.sh --pruebas --verificar`.

## Desinstalar o limpiar el proyecto

Cierre primero `pnpm dev` u otros procesos del proyecto que haya iniciado manualmente.

```bash
./desinstalar.sh                 # detiene desarrollo y elimina dependencias/builds locales
./desinstalar.sh --pruebas       # selecciona los contenedores del entorno de pruebas
```

Por defecto se conservan **el volumen PostgreSQL, el código, `.env`, documentos, lockfile y evidencias**. Las dependencias del repositorio son compartidas por ambos perfiles; puede conservarlas si solo quiere detener la base:

```bash
./desinstalar.sh --pruebas --conservar-dependencias
```

Para borrar también los datos del perfil elegido, debe solicitarlo expresamente:

```bash
./desinstalar.sh --pruebas --purgar-datos
```

**`--purgar-datos` elimina el volumen de ese perfil y pierde sus datos.** Para ver primero las acciones:

```bash
./desinstalar.sh --pruebas --purgar-datos --simular
./desinstalar.sh --help
```

Los scripts no desinstalan Node/Docker/pnpm ni borran las cachés compartidas de otras aplicaciones. Después de limpiar dependencias puede volver a preparar el proyecto con `./instalar.sh` o `./instalar.sh --pruebas --verificar`.

## Acceso de demostración

En el login seleccione uno de los 12 roles. Las cuentas demo usan el correo `<codigo_rol>@tec.ac.cr` y contraseña **`prototipo2026`**. El catálogo se obtiene de PostgreSQL.

Ejemplos: `investigador`, `vinculacion`, `comite_asistente`, `comite_evaluador`, `consejo`, `gestora_vie`, `cie`, `direccion_investigacion` y `admin`. VIE Publicación usa `vie_publicacion`.

Super Administrador conserva su identidad al cambiar «Vista actual»; esa selección filtra el panel operativo. Es autenticación de demostración, sin integración con Orión.

## Comandos manuales

El gestor del repositorio es **pnpm**.

```bash
pnpm install --frozen-lockfile
pnpm db:up
DATABASE_URL=postgresql://vie:vie@localhost:5432/fondos_vie pnpm db:migrate
pnpm dev
pnpm build
pnpm --filter sistema-vie-frontend lint
pnpm --filter sistema-vie-backend typecheck
```

Para repetir verificaciones sobre la base aislada ya preparada:

```bash
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:api
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:decisions
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:completion
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:ui
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm regression:completion-ui
TEST_DATABASE_URL=postgresql://vie:vie@127.0.0.1:55432/fondos_vie_test pnpm test:fresh-schema
pnpm test:lifecycle
```

`test:lifecycle` comprueba los scripts Bash en un directorio temporal con Docker/pnpm simulados; no desinstala el repositorio real. Las regresiones API/UI sí usan PostgreSQL real y escriben fixtures propios.

También existen `pnpm baseline:api`, `pnpm baseline:ui` y `pnpm smoke`. Son recorridos de diagnóstico con alcance parcial; no sustituyen las regresiones. `smoke` usa `API_BASE` o `localhost:3000/api` y escribe datos: apúntelo expresamente a una API de prueba cuando lo utilice. Los recorridos de línea base pueden conservar expectativas de diagnóstico que cambien al corregir un fallo.

## Migraciones y conservación de datos

`database/DisennoDB.sql` y `database/seed.sql` se ejecutan al crear un volumen nuevo. Cambiar esos archivos **no actualiza** uno existente.

Para actualizar, use `pnpm db:migrate` con `DATABASE_URL` explícita. Las migraciones de `database/migrations/` quedan registradas y pueden volver a ejecutarse sin reiniciar ni borrar el volumen. No use una eliminación de volumen como sustituto de migraciones.

## Qué está implementado y qué sigue abierto

- Borradores con guardado y recuperación de textos, equipo/horas, plan/riesgos, presupuesto/fuentes, ética/permisos, compromisos y declaración.
- Notificaciones reales por destinatario y marcas de lectura en la base.
- Modales corregidos, mensajes de error que conservan el texto y vistas sin sustitución automática por expedientes ficticios.
- Rúbrica oficial completa (100 puntos), tres evaluadores independientes, notas por criterio y confirmación humana del consolidado. Las devoluciones abren otro ciclo sin sobrescribir las notas entregadas; el expediente conserva su versión de rúbrica.
- Carga real de PDF/DOCX/XLSX de hasta 10 MiB, versiones, descarga autorizada y retiro lógico. Los binarios están en `var/documentos/` (desarrollo) o `var/documentos-pruebas/`; `DOCUMENTOS_DIR` permite configurarlo. Se conservan al actualizar/desinstalar; la purga de PostgreSQL no elimina esos directorios. La generación automática de PDF de oficios y la carga de imágenes/videos están fuera de este alcance.
- Administración real de usuarios, roles asignados, escuelas, modalidades, líneas y rúbricas versionadas, con motivo y auditoría. No incluye motor genérico de formularios.
- Guardar borrador permanece en edición; Guardar y salir abre el expediente. Para enviar se exige declaración, resumen de hasta 500 palabras, 4–6 términos ES y abstract EN; keywords EN son opcionales.

Los códigos nuevos son automáticos (`PROP-AAAA-NNN`) con consecutivo anual transaccional; se conservan los códigos históricos. Las consultas respetan el ámbito de cada identidad. Las devoluciones de Comité/VIE permiten subsanar únicamente las secciones indicadas y reenviar a la misma instancia. El avance exige dictamen PI o certificación fundamentada de no requerimiento.

Los acuerdos implementados están en [DECISIONES-D01-D04.md](correcciones/DECISIONES-D01-D04.md). Aplicar las migraciones 001–008 al actualizar una base existente; no se generan certificaciones PI ficticias para expedientes antiguos. Las decisiones restantes implementadas y sus límites están en [DECISIONES-D05-D11.md](correcciones/DECISIONES-D05-D11.md). La aceptación del equipo continúa en [COSAS-A-DISCUTIR.md](correcciones/COSAS-A-DISCUTIR.md). Las casillas de aceptación del usuario se conservan en [VALIDACION-DEL-FLUJO.md](correcciones/VALIDACION-DEL-FLUJO.md).

## Estructura y referencias

| Carpeta | Contenido |
| --- | --- |
| `frontend/` | Interfaz React y recursos de marca TEC. |
| `backend/` | API Express, reglas y persistencia. |
| `database/` | Esquema, seed y migraciones SQL. |
| `scripts/` | Verificaciones y generación de recursos. |
| `correcciones/` | Hallazgos, implementación, discusiones y evidencias. |
| `docs/` | Fuentes oficiales, casos de uso, diseño y referencias. |

- [Plan de correcciones](correcciones/PLAN-DE-CORRECCIONES.md) y [bitácora](correcciones/IMPLEMENTACION.md).
- [Prioridad post-auditoría (2026-11-09)](correcciones/PRIORIDAD-POST-AUDITORIA.md) y [guion de demo V01](correcciones/GUIION-DEMO-V01.md).
- [Estado de revisión](correcciones/ESTADO-DE-REVISION.md) · [validación del flujo](correcciones/VALIDACION-DEL-FLUJO.md).
- [Casos de uso](docs/casos-de-uso/CASOS-DE-USO.md).
- [Continuidad](CONTINUIDAD.md) y [plan maestro](PLAN-MAESTRO.md).
- [Accesibilidad](docs/a11y/INFORME-WCAG.md): las pruebas pendientes no equivalen a certificación WCAG completa.
- Variables de referencia: [backend/.env.example](backend/.env.example) y [frontend/.env.example](frontend/.env.example).

En desarrollo, Vite reenvía `/api` a `localhost:3000`; `VITE_API_URL` permite apuntar a otra API. El backend utiliza `DATABASE_URL` y `PORT` (3000 por defecto).

### IA de apoyo al Comité

El panel de evaluación individual permite generar una **sugerencia** con Gemini a partir de la rúbrica oficial. La IA nunca escribe la nota oficial: la persona evaluadora revisa, ajusta y justifica cada criterio, y solo su evaluación humana se consolida.

Configure `GEMINI_API_KEY` en `backend/.env` (nunca en el frontend). El modelo predeterminado es `gemini-3.8-flash`, disponible en el nivel gratuito; `AI_MODEL` permite cambiarlo por otro modelo gratuito como `gemini-3.6-flash` o `gemini-3.5-flash-lite`. La clave se obtiene en <https://aistudio.google.com/apikey>.

> En el nivel gratuito, Google puede usar el contenido enviado para mejorar sus productos. Para propuestas reales o información sensible, use una cuenta/cuota institucional con condiciones de privacidad adecuadas.

## Comité y reconsideración

Las tres cuentas demo son `comite_evaluador@tec.ac.cr`, `comite_evaluador2@tec.ac.cr` y `comite_evaluador3@tec.ac.cr` (contraseña inicial `prototipo2026`). Seleccionar el rol Comité · Evaluador y cambiar el correo para usar cada cuenta. Después de tres entregas, la asistencia confirma el dictamen; una sola nota no adelanta el expediente.

El rechazo del Consejo se comunica al investigador como **aval rechazado**, sin fabricar una resolución CIE. El investigador solicita reconsideración y el Consejo autoriza un nuevo ciclo con fundamento; la decisión anterior permanece auditada. Admin no puede saltarse estas precondiciones.

# Basado en los documentos adjuntos, genera las ins....pdf

> Fuente: C:\Users\Matias\Downloads\Telegram Desktop\Basado en los documentos adjuntos, genera las ins....pdf
> Convertido con markitdown

---

Instituto Tecnológico de Costa Rica (TEC)
Carrera: Ingeniería en Computación
Curso: Diseño de Software
Prototipo de Sistema para la Gestión de Propuestas de Investigación
(Fondos VIE)
Descripción
El proyecto consiste en el diseño y desarrollo de un prototipo de software orientado a la automatización y
gestión del ciclo de vida de las iniciativas de investigación del Instituto Tecnológico de Costa Rica. El
sistema debe digitalizar los procesos definidos para la convocatoria de Fondos VIE, contemplando un
módulo para la redacción y presentación estructurada de propuestas, un módulo de evaluación para la
revisión, aprobación o rechazo por parte de las instancias correspondientes (Comité Técnico, Dirección de
Investigación y el Consejo de Investigación y Extensión - CIE), y un módulo de consulta histórica que
permita filtrar proyectos por escuela, investigador, tema o línea de investigación y estatus (aprobada,
rechazada, etc.). El desarrollo seguirá un enfoque iterativo estructurado en cuatro etapas fundamentales
del diseño de software.
Objetivo General
Diseñar y desarrollar un prototipo funcional de software para la gestión integral de propuestas de
investigación, aplicando metodologías de arquitectura de la información, diseño de interfaces y modelado
de bases de datos para satisfacer los requerimientos del proceso institucional de evaluación académica.
Objetivos Específicos
● Establecer la arquitectura de información del sistema mediante el análisis de la normativa
existente, perfiles de usuario (personas) y soluciones competitivas en el ámbito académico.
● Diseñar interfaces de usuario intuitivas y accesibles para los módulos de redacción, evaluación y
consulta histórica, garantizando una óptima experiencia de usuario.
● Modelar la base de datos relacional y la arquitectura de software necesaria para soportar los flujos
de información, los distintos roles de usuario y los estados de las propuestas.
● Implementar un prototipo funcional que demuestre la operabilidad de los módulos de formulación,
revisión y consulta histórica.
Instrucciones
El proyecto se desarrollará en equipos de trabajo y la entrega se dividirá en cuatro etapas secuenciales.

Los estudiantes deben tomar como base de requerimientos de negocio el documento "1-Disposiciones
Convocatoria Fondos VIE 2027.pdf".
● Etapa 1: Arquitectura de información
○ Análisis de lo existente: Analizar a profundidad las reglas de negocio del proceso de
postulación y evaluación. Identificar los estados por los que pasa una propuesta (ej. en
redacción, sometida, dictaminada, resuelta).
○ Análisis de personas: Definir los perfiles de usuario involucrados, tales como la persona
investigadora coordinadora, el Comité Técnico de la instancia académica, la Dirección de
Investigación y los miembros del CIE.
○ Análisis competitivo: Evaluar al menos dos plataformas existentes de gestión de grants o
proyectos de investigación académicos para identificar buenas prácticas y áreas de mejora.
○ Entregable: Documento que contenga los user personas, user journeys para los tres
módulos principales, y el mapa del sitio del sistema.
● Etapa 2: Diseño de Interfaz
○ Crear wireframes de baja fidelidad y mockups de alta fidelidad interactivos.
○ El módulo de redacción debe contemplar campos clave como problema, metodología,
equipo de investigación (con validación de horas asignadas y tipo de horas: VIE, CONS,
DOC, etc.), y presupuesto.
○ El módulo de revisión debe permitir a los evaluadores visualizar la propuesta y emitir un
aval o rechazo, simulando la evaluación según la composición disciplinaria,
fundamentación, rigor metodológico y plan de riesgos.
○ El módulo de histórico debe presentar un dashboard o tabla avanzada con filtros
combinados (por escuela, persona investigadora, temática, y estatus final).
○ Entregable: Enlace al prototipo navegable en una herramienta de diseño (ej. Figma, Adobe
XD) y guía de estilos UI.
● Etapa 3: Diseño de Base de Datos y Arquitectura de Software
○ Diseñar el Modelo Entidad-Relación (MER) y el diagrama relacional asegurando la
normalización de datos. Debe modelarse correctamente la relación entre Investigadores,
Escuelas, Propuestas, Líneas de Investigación y Evaluaciones.
○ Elaborar el diagrama de componentes y el diagrama de despliegue para el sistema.
○ Entregable: Documento de diseño técnico con los diagramas de base de datos (con su
diccionario de datos) y diagramas arquitectónicos UML.
● Etapa 4: Prototipo funcional
○ Desarrollar el frontend y backend del sistema implementando los tres módulos principales.
○ El prototipo no requiere integrarse con los sistemas reales de la universidad, pero la base de
datos debe contener seed data (datos semilla) realista que permita demostrar el
funcionamiento del módulo de consultas históricas con diversas escuelas, investigadores y
estatus.
○ Demostrar el flujo completo: un usuario investigador crea y envía la propuesta; un usuario
evaluador la aprueba o rechaza; un usuario administrador busca la propuesta en el histórico.
○ Entregable: Código fuente alojado en un repositorio, instrucciones de despliegue
(README) y demostración funcional ante la clase.

Rúbrica de Evaluación
| Criterio | Excelente  | Bueno (80%) | Regular (60%) | Deficiente (0- |
| -------- | ---------- | ----------- | ------------- | -------------- |
|          | (100%)     |             |               | 40%)           |
Etapa 1:  Análisis  Perfiles y flujos  Análisis  No se presentan
Arquitectura de  profundo del  adecuados, pero  superficial.  perfiles claros,
Información  documento base.  faltan detalles  Flujos de  ni análisis del
(20%) Perfiles de  específicos sobre  usuario  proceso actual o
|     | usuario y          | los roles de      | incompletos o   | de la        |
| --- | ------------------ | ----------------- | --------------- | ------------ |
|     | journeys reflejan  | evaluación        | que no          | competencia. |
|     | fielmente el       | institucionales.  | concuerdan con  |              |
|     | proceso de         | Análisis          | el proceso de   |              |
|     | postulación y      | competitivo       | investigación   |              |
|     | revisión           | básico.           | requerido.      |              |
institucional.
Análisis
competitivo bien
documentado.
Etapa 2: Diseño  Mockups  Diseño funcional  Interfaz difícil  Diseños
de Interfaz  altamente  e interactivo.  de navegar. Los  ausentes,
| (20%) | interactivos,  | Falta  | prototipos no  | incompletos o  |
| ----- | -------------- | ------ | -------------- | -------------- |
intuitivos y  refinamiento  son interactivos  realizados sin
estéticamente  visual o el  o faltan vistas  herramientas de
|     | acordes a un    | diseño de filtros   | clave de los  | prototipado. |
| --- | --------------- | ------------------- | ------------- | ------------ |
|     | sistema         | en el histórico es  | módulos       |              |
|     | institucional.  | básico y poco       | solicitados.  |              |
|     | Todos los       | escalable.          |               |              |
módulos
(redacción,
evaluación,
histórico con
filtros) están
completamente
diseñados.
Etapa 3: Base  Modelo  Modelo de datos  Base de datos  No se entrega
de Datos y  relacional  funcional pero  con problemas  diseño de base
| Arquitectura  | óptimo,  | con  | graves de diseño  | de datos ni  |
| ------------- | -------- | ---- | ----------------- | ------------ |
(25%) normalizado y  redundancias  (ej. incapacidad  diagramas

|     | con un           | menores.        | para filtrar por  | arquitectónicos,  |
| --- | ---------------- | --------------- | ----------------- | ----------------- |
|     | diccionario de   | Diagramas UML   | escuela o         | o son             |
|     | datos completo.  | presentes pero  | estatus).         | incomprensibles.  |
|     | Diagramas UML    | con errores de  | Arquitectura no   |                   |
|     | precisos que     | notación.       | justificada.      |                   |
soportan
claramente los
tres módulos
requeridos.
| Etapa 4:  | Sistema  | El sistema  | Prototipo  | El software no  |
| --------- | -------- | ----------- | ---------- | --------------- |
Prototipo  desplegado y  funciona en su  incompleto; solo  compila, no
Funcional  operando sin  mayoría, pero  funciona la  ejecuta o no
(35%) errores. El flujo  presenta bugs no  interfaz pero sin  cumple con las
de los tres  críticos o algún  conexión real a  funcionalidades
|     | módulos es        | filtro del módulo  | base de datos, o   | mínimas     |
| --- | ----------------- | ------------------ | ------------------ | ----------- |
|     | demostrable de    | histórico no       | falta desarrollar  | requeridas. |
|     | principio a fin.  | opera              | un módulo          |             |
|     | Base de datos     | correctamente.     | completo.          |             |
poblada con
datos realistas
para probar
filtros históricos.
Consideraciones adicionales:
1. El proyecto será generado en grupos de 4 personas.
2. Las fechas de entrega de las etapas son las que se indican en el TEC Digital.
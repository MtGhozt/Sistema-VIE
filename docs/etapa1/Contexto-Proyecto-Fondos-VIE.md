# Gestión de Propuestas de Investigación — Fondos VIE (TEC) | Contexto del Proyecto y Apuntes de Clase

## Apuntes de la Clase

### Flujo institucional de la convocatoria y la propuesta

1. La **VIE** publica la convocatoria, con su cronograma / calendario, y la comunica a los **Centros de Investigación**.
2. El **Centro de Investigación** toma la convocatoria y la distribuye con un **cronograma interno**.
3. Los **profesores e investigadores** toman esta convocatoria y crean una **propuesta**.
4. La propuesta va al **Centro de Vinculación**, donde se genera un **dictamen de propiedad intelectual**, que se devuelve al Centro de Investigación.
5. Esto se manda a la **VIE**, que genera otro dictamen.

### Documentos requeridos

De los archivos, están:

- El formulario
- El plan de trabajo
- El presupuesto

### Módulos requeridos (según clase)

- Módulo de **edición de formularios**
- Módulo de **gestión de formularios**

### Evaluación con IA + revisión humana

- Se requiere una **IA que califique con una rúbrica**.
- Debe haber una **persona que la revise y modifique** (revisión humana del puntaje / calificación automática).

### Restricción tecnológica

- Bases de datos **solo SQL**. Se aconseja **Postgres**.

---

## 1. Contexto del Proyecto

### 1.1 Descripción General del Proyecto

El proyecto consiste en el diseño y desarrollo de un **prototipo de sistema o software para la gestión de propuestas de investigación correspondientes a los Fondos VIE del Instituto Tecnológico de Costa Rica (TEC)**. El propósito es representar digitalmente las principales actividades que forman parte del ciclo de vida de una propuesta de investigación, desde su formulación hasta evaluación y resolución.

El sistema busca **centralizar la información** relacionada con las propuestas y facilitar la interacción entre las personas investigadoras y las diferentes instancias responsables de su revisión. De acuerdo con las instrucciones del proyecto, el prototipo debe contemplar tres áreas funcionales principales: **redacción y evaluación de propuestas y consulta histórica**.

La necesidad del sistema surge de un proceso institucional que requiere la participación de diferentes actores, documentos, criterios de evaluación y etapas de revisión. Las iniciativas de investigación se deben presentar mediante el sistema institucional del TEC llamado **Orión**, y acompañarse de la documentación de respaldo definida por la convocatoria.

El prototipo propuesto **no pretende sustituir ni integrarse directamente con los sistemas reales del TEC** durante esta etapa académica. En cambio, deberá simular un proceso utilizando información y datos realistas que permitan demostrar el funcionamiento completo de los módulos principales.

### 1.2 Organización donde se desarrolla el proyecto

El sistema se plantea para el **Instituto Tecnológico de Costa Rica (TEC)**, específicamente en el contexto de la gestión de iniciativas de investigación administradas por la **Vicerrectoría de Investigación y Extensión (VIE)**.

Dentro de este proceso intervienen varias instancias institucionales:

- La **Dirección de Investigación** es la unidad técnica-administrativa responsable de gestionar, administrar y supervisar el portafolio de iniciativas de investigación, además de emitir dictámenes técnicos que sirven como base para decisiones del Consejo de Investigación y Extensión (CIE).
- El **CIE** constituye el órgano encargado de analizar y resolver las iniciativas de investigación y extensión del TEC.
- Participan los **Comités Técnicos de las dependencias académicas**, responsables de evaluar la viabilidad técnica y metodológica de las propuestas mediante las rúbricas que dicta el CIE.

Por ende, el sistema / software debe apoyar un proceso ordenado y estructurado en el que intervienen diferentes niveles de responsabilidad, en el que cada actor u órgano necesita consultar o aportar información diferente.

### 1.3 Funcionalidades principales

El sistema estará organizado en tres módulos principales:

#### Módulo de redacción de propuestas

Permitirá a la persona investigadora coordinadora crear y completar una propuesta de investigación. Dentro de este módulo se manejará información como:

- Problema de investigación
- Justificación
- Objetivos
- Metodología
- Equipo de investigación
- Asignación de horas
- Presupuesto
- Plan de acción
- Gestión de riesgos
- Entre otros datos requeridos por la convocatoria

El formulario oficial contempla, junto a otros elementos, la identificación del equipo investigador, el problema, objetivos, el estado del arte y metodología de la propuesta.

#### Módulo de evaluación

Permitirá que las instancias responsables revisen las propuestas y registren los resultados del proceso de evaluación.

- El **Comité Técnico** debe considerar aspectos como la composición del equipo investigador, fundamentación, metodología, plan de acción, gestión de riesgos, aspectos éticos y pertinencia e impacto.
- Posteriormente, la **Dirección de Investigación** realiza verificaciones adicionales y el **CIE** analiza y resuelve la propuesta.

#### Módulo de Consulta Histórica

Permitirá consultar propuestas registradas anteriormente y localizar información mediante diferentes criterios de búsqueda.

El proyecto establece que este módulo debe contar con filtros combinados por:

- Escuela o Dependencia
- Persona Investigadora
- Temática
- Estado de Propuesta

### 1.4 Descripción general del proceso

El proceso de gestión de una propuesta involucra diferentes actores y etapas institucionales.

1. Inicialmente, el grupo investigador formula la propuesta y prepara la documentación necesaria.
2. Posteriormente, la propuesta es evaluada por el **Comité Técnico de la dependencia académica coordinadora** utilizando las rúbricas del CIE.
3. Una vez realizada la evaluación, las dependencias académicas involucradas deben emitir los respectivos **avales**. La convocatoria establece que toda propuesta debe estar respaldada formalmente por los consejos de las dependencias participantes.
4. Posteriormente, la propuesta es revisada por la **Dirección de Investigación**, que realiza el dictamen técnico correspondiente.
5. Finalmente, el **CIE** analiza la propuesta y emite la resolución final.

### 1.5 Actores involucrados en el sistema

A partir de la documentación inicial se logran identificar los siguientes actores principales:

| Actor | Participación General |
|-------|------------------------|
| VIE (publicación) | Publica la convocatoria y el cronograma. |
| Persona Investigadora Coordinadora / profesores | Formula y presenta la propuesta (formulario + plan + presupuesto). |
| Equipo Investigador | Participa en las actividades y productos asociados al proyecto. |
| Centro de Vinculación | Emite el dictamen de propiedad intelectual. |
| Comité Técnico — asistente | Recibe y revisa completitud del contenido. |
| Comité Técnico — cuerpo evaluador (Coordinador, Director de Escuela, 3 profesores) | Evalúa con rúbrica CIE, nota independiente y oficio. |
| Consejo de Escuela — asistente | Recibe la calificación del Comité y la envía al consejo de profesores. |
| Consejo de profesores | Aprueba o rechaza y genera el aval. |
| Dirección de Escuela | Comunica el aval a la VIE. |
| Persona gestora VIE | Revisa contenidos, completitud y comentarios a las investigadoras. |
| CIE | Evalúa con rúbrica, observa y determina aprobación o rechazo. |
| Dirección de Investigación | Recibe los dictámenes del CIE y notifica aprobación o rechazo. |
| Super Administrador | Ve y edita todo el flujo; opera cualquier rol sin cerrar sesión. |

> En el caso del Centro de Vinculación, su participación es relevante cuando se identifica la posibilidad de resultados susceptibles de protección mediante propiedad intelectual; en dicho caso se requiere un dictamen técnico.

### 1.6 Alcance del Prototipo

El alcance del proyecto se concentra en desarrollar un prototipo funcional que permita demostrar los principales flujos del proceso de gestión de propuestas.

Donde se debe representar al menos el siguiente escenario:

1. Persona investigadora coordinadora crea propuesta.
2. Completa la información necesaria.
3. Envía propuesta para revisión.
4. Un usuario evaluador revisa la información.
5. Es aprobada.
6. Es rechazada.
7. Se logra localizar en el módulo histórico.

El prototipo no requiere integración con los sistemas institucionales del TEC, no obstante, deberá utilizar datos semilla realistas para la representación de un escenario realista.

---

## 2. Diagrama de Contexto

> Imagen 1: Diagrama de Contexto del Software. Elaboración Propia.

Los principales intercambios de información serán:

| Actor | Envía al sistema | Recibe del sistema |
|-------|------------------|--------------------|
| Investigador | Toda la información de la propuesta | Estado, observaciones y resolución de la propuesta |
| Comité Técnico | Evaluación y calificación | Propuesta y documentación |
| Consejo de Escuela / Dependencia | Aval institucional | Información de la propuesta |
| Dirección de Investigación | Dictamen | Propuesta, documentos y evaluaciones previas |
| CIE | Resolución final | Propuesta y dictamen |
| Centro de Vinculación | Dictamen (si corresponde) | Información relacionada a Propiedad Intelectual (PI) o vinculación |

---

## 3. Análisis Competitivo

**Objetivo:** responde a ¿para qué se usa / hace el AC?

Define qué se va a analizar, qué problema busca resolver el proyecto (funcionalidades esperadas y mejoras prácticas) y cuáles son los competidores seleccionados (directos e indirectos) y las novedades que tienen sus portales para así poder ofrecer un valor diferenciador.

**Metodología empleada:** se utilizaron entrevistas no formales en las clases con el profesor, en las que explicó los procesos institucionales, el funcionamiento del flujo Fondos VIE y qué se espera que tenga la aplicación web (ver Anexos). Complementariamente se aplicaron los siguientes criterios de análisis:

- Organización y Jerarquía: cómo se agrupa y categoriza la información.
- Rotulado y Nomenclatura: claridad y consistencia en los nombres de secciones, menús y botones.
- Sistemas de Navegación: tipos de navegación (global, local, contextual, migas de pan / breadcrumbs).
- Búsqueda y Recuperación: eficiencia de los motores de búsqueda, filtros y facetas.
- Flujos Principales: facilidad para completar las tareas clave (p. ej., checkout, registro, consulta).

**Productos:**

- Matriz comparativa de portales
- Resultado de la comparación y evaluación de portales

## 4. Análisis de Personas

**Objetivo:** responde a ¿para qué se usa / hace el AP?

**Metodología empleada:** se utilizaron entrevistas no formales en las clases con el profesor, en las que explicó los procesos, el funcionamiento institucional, los roles involucrados y qué se espera que tenga la aplicación web (ver Anexos). No se aplicaron cuestionarios ni grupos focales en esta etapa; estos se citan solo como referencia teórica del curso.

**Productos:**

- Descripción de usuarios prototípicos identificados
- Descripción de Roles identificados
- Matriz de necesidades
- Contenidos requeridos del portal

## 5. Inventario de Contenidos

**Objetivo:** responde a ¿para qué se usa / hace el IC?

**Metodología empleada a partir del análisis de usuarios y necesidades:** se parte de las entrevistas no formales en las clases con el profesor, en las que explicó los procesos, el funcionamiento y los contenidos que se espera que tenga la aplicación web (ver Anexos), junto con el análisis de usuarios prototípicos y necesidades.

**Productos:**

- Inventario de Contenidos actuales o propuestos para el portal
- Propuesta de arquitectura (tipo mapa conceptual) de contenidos

---

## 6. Anexos

### Anexo A — Fotografías de clase (entrevistas no formales con el profesor)

[Insertar fotografía 1 — explicación de los procesos institucionales Fondos VIE]

[Insertar fotografía 2 — explicación del funcionamiento del flujo y los roles]

### Anexo B — Fotografías de clase (qué se espera de la aplicación web)

[Insertar fotografía 3 — explicación de módulos, formularios y contenidos esperados de la aplicación web]

[Insertar fotografía 4 — aclaración de dudas y detalles adicionales explicados en clase]

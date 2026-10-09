# Diagrama de secuencia — Proceso Fondos VIE

Vista de proceso (actores ↔ sistema). Documentos del expediente: **doc.4** Formulario, **doc.5** Plan/riesgos, **doc.6** Presupuesto.

```mermaid
sequenceDiagram
    autonumber
    actor VIE
    actor Investigador
    actor Vinculacion
    actor AsistenteComite
    actor Comite
    actor AsistenteConsejo
    actor Consejo
    actor DirEscuela
    actor GestoraVIE
    actor CIE
    actor DirInvestigacion
    participant Sistema as Sistema Fondos VIE
    participant DB as PostgreSQL

    VIE->>Sistema: Publica convocatoria + cronograma
    Sistema->>DB: Guarda convocatoria
    Sistema-->>Investigador: Convocatoria disponible

    Investigador->>Sistema: Envía propuesta (doc.4 Formulario, doc.5 Plan, doc.6 Presupuesto)
    Sistema->>DB: Guarda expediente
    Sistema-->>Investigador: Acuse de envío

    Sistema-->>Vinculacion: Expediente para PI (docs 4, 5, 6)
    Vinculacion->>Sistema: Dictamen PI (oficio)
    Sistema->>DB: Guarda dictamen_pi
    Sistema-->>Investigador: Copia del dictamen PI

    Sistema-->>AsistenteComite: Expediente (docs 4, 5, 6 + dictamen PI)
    AsistenteComite->>Sistema: Checklist completitud / observaciones
    Sistema->>DB: Guarda revisión
    Sistema-->>Investigador: Observaciones de completitud (si aplica)
    AsistenteComite->>Sistema: Pasa a evaluadores

    Comite->>Sistema: Evaluaciones rúbrica + oficio Comité
    Sistema->>DB: Guarda evaluaciones / resultado
    Sistema-->>Investigador: Nota / oficio del Comité
    Sistema-->>AsistenteConsejo: Calificación del Comité

    AsistenteConsejo->>Sistema: Remite expediente + nota al Consejo
    Consejo->>Sistema: Aval aprueba/rechaza (oficio)
    Sistema->>DB: Guarda aval
    Sistema-->>Investigador: Notificación del aval
    DirEscuela->>Sistema: Comunica aval a la VIE (oficio)
    Sistema->>DB: Guarda comunicación

    Sistema-->>GestoraVIE: Expediente consolidado + aval
    GestoraVIE->>Sistema: Verificación / comentarios
    Sistema->>DB: Guarda revisión VIE
    Sistema-->>Investigador: Comentarios gestora (si aplica)

    Sistema-->>CIE: Expediente listo para resolución
    CIE->>Sistema: Resolución aprueba/rechaza
    Sistema->>DB: Guarda resolución
    DirInvestigacion->>Sistema: Notifica resultado
    Sistema->>DB: Guarda notificación
    Sistema-->>Investigador: Notificación final (aprobada | rechazada)
```

### Notas

- Entre **( )** va el contenido concreto de esa flecha (docs 4/5/6, oficios, etc.).
- El investigador recibe: convocatoria, acuse, dictamen PI, observaciones, nota Comité, aval, comentarios gestora y resolución final.
- Las flechas `Sistema → PostgreSQL` son la conexión a la base de datos en cada persistencia.

### Exportar

Copiar el Mermaid a [mermaid.live](https://mermaid.live) → PNG/SVG.

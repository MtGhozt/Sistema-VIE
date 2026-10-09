# Diagrama de secuencia — Proceso Fondos VIE

Vista de proceso (actores ↔ sistema). Documentos del expediente: **doc.4** Formulario, **doc.5** Plan/riesgos, **doc.6** Presupuesto.

Las **barras blancas** sobre cada línea de vida (activar / desactivar) marcan cuándo empieza y cuándo termina la participación de ese actor en el paso — es lo que el profe llama las “dos líneas” del foco de control.

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

    activate Sistema

    activate VIE
    VIE->>Sistema: Publica convocatoria + cronograma
    Sistema->>+DB: Guarda convocatoria
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Convocatoria disponible
    deactivate VIE

    activate Investigador
    Investigador->>Sistema: Envía propuesta (doc.4 Formulario, doc.5 Plan, doc.6 Presupuesto)
    Sistema->>+DB: Guarda expediente
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Acuse de envío
    deactivate Investigador

    Sistema-->>+Vinculacion: Expediente para PI (docs 4, 5, 6)
    Vinculacion->>Sistema: Dictamen PI (oficio)
    Sistema->>+DB: Guarda dictamen_pi
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Copia del dictamen PI
    deactivate Vinculacion

    Sistema-->>+AsistenteComite: Expediente (docs 4, 5, 6 + dictamen PI)
    AsistenteComite->>Sistema: Checklist completitud / observaciones
    Sistema->>+DB: Guarda revisión
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Observaciones de completitud (si aplica)
    AsistenteComite->>Sistema: Pasa a evaluadores
    deactivate AsistenteComite

    activate Comite
    Comite->>Sistema: Evaluaciones rúbrica + oficio Comité
    Sistema->>+DB: Guarda evaluaciones / resultado
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Nota / oficio del Comité
    Sistema-->>AsistenteConsejo: Calificación del Comité
    deactivate Comite

    activate AsistenteConsejo
    AsistenteConsejo->>Sistema: Remite expediente + nota al Consejo
    deactivate AsistenteConsejo

    activate Consejo
    Consejo->>Sistema: Aval aprueba/rechaza (oficio)
    Sistema->>+DB: Guarda aval
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Notificación del aval
    deactivate Consejo

    activate DirEscuela
    DirEscuela->>Sistema: Comunica aval a la VIE (oficio)
    Sistema->>+DB: Guarda comunicación
    DB-->>-Sistema: ok
    deactivate DirEscuela

    Sistema-->>+GestoraVIE: Expediente consolidado + aval
    GestoraVIE->>Sistema: Verificación / comentarios
    Sistema->>+DB: Guarda revisión VIE
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Comentarios gestora (si aplica)
    deactivate GestoraVIE

    Sistema-->>+CIE: Expediente listo para resolución
    CIE->>Sistema: Resolución aprueba/rechaza
    Sistema->>+DB: Guarda resolución
    DB-->>-Sistema: ok
    deactivate CIE

    activate DirInvestigacion
    DirInvestigacion->>Sistema: Notifica resultado
    Sistema->>+DB: Guarda notificación
    DB-->>-Sistema: ok
    Sistema-->>Investigador: Notificación final (aprobada | rechazada)
    deactivate DirInvestigacion

    deactivate Sistema
```

### Notas

- **Activación:** la barra vertical en cada actor indica el tramo en que está “en el proceso”; al desactivar, termina su participación en ese paso (igual que en el ejemplo del juego con las cajas blancas).
- **Sistema** permanece activo de punta a punta; **PostgreSQL** se activa solo en cada guarda.
- Entre **( )** va el contenido concreto de esa flecha (docs 4/5/6, oficios, etc.).
- El investigador recibe: convocatoria, acuse, dictamen PI, observaciones, nota Comité, aval, comentarios gestora y resolución final.

### Exportar

Copiar el Mermaid a [mermaid.live](https://mermaid.live) → PNG/SVG.

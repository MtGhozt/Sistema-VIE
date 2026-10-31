# Bitácora de implementación

Cada entrada indica cambio, sustento y verificación. Las decisiones abiertas están en [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md). No se marca aceptación del usuario automáticamente.

| Cambio / mensaje de commit | Sustento | Comprobación |
| --- | --- | --- |
| `docs(correcciones): separar decisiones abiertas de fallos confirmados` | Instrucción explícita del usuario; no modificar reglas ambiguas. | Revisión de los 33 hallazgos y separación de D01–D11. |
| `fix(api): controlar rechazos asincronos sin terminar el servidor` | INC-01 reproducido; CU2 exige errores controlados. Express 4 no captura rechazos de handlers async. | Compilación backend; regresión de colisión y health en prueba final. No cambia numeración. |

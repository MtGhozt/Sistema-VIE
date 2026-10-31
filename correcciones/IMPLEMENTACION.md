# Bitácora de implementación

Cada entrada indica cambio, sustento y verificación. Las decisiones abiertas están en [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md). No se marca aceptación del usuario automáticamente.

| Cambio / mensaje de commit | Sustento | Comprobación |
| --- | --- | --- |
| `docs(correcciones): separar decisiones abiertas de fallos confirmados` | Instrucción explícita del usuario; no modificar reglas ambiguas. | Revisión de los 33 hallazgos y separación de D01–D11. |
| `fix(api): controlar rechazos asincronos sin terminar el servidor` | INC-01 reproducido; CU2 exige errores controlados. Express 4 no captura rechazos de handlers async. | Compilación backend; regresión de colisión y health en prueba final. No cambia numeración. |
| `fix(propuestas): revertir creaciones parciales ante conflictos` | INC-01, restricción UNIQUE y CU2. Creación, código y términos deben ser una operación atómica. | Typecheck; la regresión final fuerza colisión y verifica que no quede TMP ni se caiga API. La decisión anual/global queda en D01. |
| `fix(propuestas): preservar idiomas y actualizar borrador atomicamente` | INV-02/INV-05 y CU2: PATCH parcial no debe eliminar datos del idioma omitido ni guardar medio agregado. | Typecheck; regresión ES-only preserva EN y fallo de keywords revierte título. |
| `fix(cie): enviar el fundamento con el contrato esperado` | CIE-01/02 reproducido y CU4: justificación humana debe llegar intacta. | Typecheck frontend; regresión Chromium comprueba `texto` y ausencia del rechazo local falso. |

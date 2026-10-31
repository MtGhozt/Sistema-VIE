# Bitácora de implementación

Cada entrada indica cambio, sustento y verificación. Las decisiones abiertas están en [COSAS-A-DISCUTIR.md](COSAS-A-DISCUTIR.md). No se marca aceptación del usuario automáticamente.

| Cambio / mensaje de commit | Sustento | Comprobación |
| --- | --- | --- |
| `docs(correcciones): separar decisiones abiertas de fallos confirmados` | Instrucción explícita del usuario; no modificar reglas ambiguas. | Revisión de los 33 hallazgos y separación de D01–D11. |
| `fix(api): controlar rechazos asincronos sin terminar el servidor` | INC-01 reproducido; CU2 exige errores controlados. Express 4 no captura rechazos de handlers async. | Compilación backend; regresión de colisión y health en prueba final. No cambia numeración. |
| `fix(propuestas): revertir creaciones parciales ante conflictos` | INC-01, restricción UNIQUE y CU2. Creación, código y términos deben ser una operación atómica. | Typecheck; la regresión final fuerza colisión y verifica que no quede TMP ni se caiga API. La decisión anual/global queda en D01. |
| `fix(propuestas): preservar idiomas y actualizar borrador atomicamente` | INV-02/INV-05 y CU2: PATCH parcial no debe eliminar datos del idioma omitido ni guardar medio agregado. | Typecheck; regresión ES-only preserva EN y fallo de keywords revierte título. |
| `fix(cie): enviar el fundamento con el contrato esperado` | CIE-01/02 reproducido y CU4: justificación humana debe llegar intacta. | Typecheck frontend; regresión Chromium comprueba `texto` y ausencia del rechazo local falso. |
| `fix(evaluaciones): conservar modales y texto cuando falla la accion` | CIE-01/CTA-01 y CU3/CU4: confirmar solo tras respuesta real y permitir reintento. | Typecheck; prueba Chromium fuerza HTTP 500 y comprueba modal/texto conservados. Un bloqueo síncrono evita doble acción concurrente. |
| `fix(modales): montar dialogos fuera del apilamiento de los paneles` | CTA-01 confirmado en capturas y elementFromPoint; informe a11y exige foco y lectura del diálogo. | Typecheck; captura posterior y muestreo sin elementos de timeline encima, escritorio/móvil, Escape y retorno de foco. |
| `fix(bandejas): distinguir respuesta vacia de error sin inventar expedientes` | C02/FLU-01: API vacía no equivale a demostración ni datos persistidos. | Typecheck; regresión de red/array vacío muestra estado real y permite reintentar. No modifica ámbito ni transiciones. |
| `fix(paneles): aislar formularios al cambiar de expediente` | ADI-08: useState inicial no se reinicia al seleccionar otro expediente. | Typecheck; regresión escribe en A, cambia a B y verifica que no se arrastre el texto. No cambia la carga inicial pendiente de cada dictamen. |

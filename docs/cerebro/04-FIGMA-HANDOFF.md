# 04 — HANDOFF A FIGMA | Todo lo necesario para maquetar el prototipo

> Lee este archivo de arriba a abajo y puedes reconstruir el diseño en Figma
> sin preguntar nada. Incluye: tokens, páginas, componentes, textos exactos,
> estados, responsive y assets. Última actualización: 2026-09-09.

## 0. Sobre las imágenes: SÍ puedo leerlas

- **Sí, mi modelo lee imágenes** (PNG/JPG). Mándame una captura por cada página
  que ya tengan y te digo qué conservar, qué cambiar y qué falta según marca TEC.
- Formas de mandarlas (elige la que te sirva):
  1. Pegarlas directamente en el chat (una por mensaje con su nombre, ej. "01-redactar.png").
  2. Guardarlas en una carpeta nueva `Proeycto1/FIGMA-estado/` y avisarme: las leo con mi herramienta de lectura.
  3. Si pesan mucho, baja la resolución a 1440px de ancho, igual las leo bien.
- Por cada imagen dime: nombre de la página + qué duda tienes de esa pantalla.
  Yo te devuelvo: descripción de lo que veo, problemas vs marca TEC y propuesta de corrección.

---

## 1. Estructura a crear en Figma (3 páginas + 1 de estilos)

```
Figma file: Fondos VIE — Prototipo base
├── 🎨 00-Estilos y componentes (Color styles, Text styles, componentes)
├── 📝 01-Redactar (formulario de propuesta)
├── ✅ 02-Evaluar (bandeja del Comité)
└── 🔍 03-Histórico (búsqueda + filtros + ficha)
```

Frames: desktop **1440×900**, una frame por pantalla. Grilla: 12 columnas,
margen 120px, gutter 24px. Espaciado base múltiplo de **8** (8/16/24).

## 2. Design tokens (créalos como Color Styles en Figma)

| Token | Valor | Uso |
|---|---|---|
| `tec-azul` | `#002855` | Header, títulos H2, botones primarios |
| `tec-rojo` | `#EF3340` | Línea bajo header (4px), badge Rechazada, botón rechazar |
| `fondo` | `#FFFFFF` | Fondo página (70% de la composición) |
| `texto` | `#1A1A1A` | Texto general |
| `gris-borde` | `#E5E7EB` | Bordes de cards e inputs |
| `gris-ayuda` | `#777777` | Texto de ayuda y footer |
| `verde-ok` | `#1E7E34` | Borde card Aprobada |

Regla visual: página blanca, header azul con línea roja de 4px abajo,
cards blancas con borde gris y **borde izquierdo de 5px** según estado
(azul = normal, verde = aprobada, rojo = rechazada).

### Text styles

| Estilo | Fuente | Tamaño / peso |
|---|---|---|
| Header marca "TEC" | system-ui, negrita | 20px / 800, tracking +1px |
| H1 | system-ui | 22px / 700, blanco sobre azul |
| H2 sección | system-ui | 18px / 700, color `tec-azul` |
| Cuerpo | system-ui | 16px / 400 |
| Ayuda / footer | system-ui | 14px / 400, color `gris-ayuda` |
| Badge estado | system-ui | 12px / 700, MAYÚSCULAS |

## 3. Componentes (créalos como Components con variants)

1. **Header/TEC**: rectángulo `tec-azul`, texto "TEC + Tecnológico de Costa Rica",
   H1 "Fondos VIE — Prototipo base 0.1", selector "Rol simulado" a la derecha,
   línea roja 4px abajo.
2. **Botón primario**: fondo `tec-azul`, texto blanco, radio 4px, padding 10/16.
3. **Input / Textarea / Select**: borde 1px `gris-borde`, radio 4px, padding 8px.
4. **Card propuesta**: borde gris, borde izquierdo 5px por estado, título en negrita,
   línea "coordinadora · escuela · temática", badge de estado, fila de acciones.
5. **Badge estado**: variants `borrador` (gris), `en_revision` (azul),
   `aprobada` (verde), `rechazada` (rojo), `observada` (naranja `#E67E22`).
6. **Filtros histórico**: 2 inputs + 1 select + botón Filtrar en una fila (wrap en móvil).

## 4. Pantalla 01 — Redactar (textos exactos)

- Título sección: "1. Redactar propuesta"
- Campos en orden: Título* · Coordinadora* · Escuela* (ej. "Computación") ·
  Temática* (ej. "IA") · Resumen ("Resumen: problema, objetivos, metodología") ·
  Presupuesto en colones (number, min 0) · Botón "Guardar borrador".
- Al guardar: la card aparece abajo en Histórico como `borrador` con botón
  "Enviar a revisión". Validación: si falta un campo con *, mostrar error
  "Faltan campos: titulo, coordinador, escuela, tematica".

## 5. Pantalla 02 — Evaluar (textos exactos)

- Título: "2. Evaluar (bandeja en revisión)"
- Ayuda: "Rúbrica simplificada 0–100. La rúbrica oficial CIE se conecta en Etapa 2."
- Vacío: "No hay propuestas en revisión."
- Por card en revisión: input numérico (0–100, default 80) + "Aprobar" + "Rechazar".
  Al decidir se guarda puntaje y el estado cambia (la card sale de la bandeja).
- Nota: la rúbrica oficial tiene 8 dimensiones (equipo, fundamentación, metodología,
  plan, presupuesto, riesgos, ética, impacto) — en Etapa 2 cada una será una fila
  con puntaje + comentario. Deja espacio previsto debajo del input.

## 6. Pantalla 03 — Histórico (textos exactos)

- Título: "3. Consulta histórica"
- Filtros: "Buscar título o investigadora" · "Escuela" · select estado
  (Todos/borrador/en revisión/aprobada/rechazada/observada) · "Filtrar".
- Vacío: "Sin resultados."
- Datos semilla para maquetar 3 cards:
  1. "Biofiltros con residuos de café para agua rural" — Ana Ruiz · Ingeniería Ambiental · Ambiente · `en_revision` · "Prototipo de biofiltro de bajo costo." · ₡2 500 000.
  2. "Detección temprana de roya con visión artificial" — Luis Mora · Computación · IA · `aprobada` · puntaje 92.
  3. "Secado solar de cacao en la zona sur" — María Fernández · Agronegocios · Energía · `rechazada` · puntaje 58.
- Footer: "Prototipo académico — no se integra con Orión en esta etapa."

## 7. Prototipo interactivo en Figma (connections)

```
Redactar: Guardar → card nueva en Histórico (borrador)
Histórico: Enviar a revisión → card pasa a Evaluar
Evaluar: Aprobar/Rechazar → card vuelve a Histórico con estado final
Filtros: cada cambio → lista filtrada (mostrar estado "Sin resultados" si aplica)
```

## 8. Responsive mínimo

- Desktop ≥1024: contenido centrado max 900px, filtros en fila.
- Móvil <640: header apilado, filtros en columna, input de puntaje ancho completo.
  (El CSS actual ya hace wrap con flex; replicar con Auto Layout vertical.)

## 9. Assets que debes exportar de `Manual Identidad Tec/`

- `logotec.pdf` → logo oficial (reemplaza el texto "TEC" en Etapa 2, respetando
  área de reserva = ancho de la "T" y tamaño mínimo 150px horizontal).
- `firmatec-1.pdf` / `firmatec-2.pdf` → firmas para piezas promocionales.
- No usar el logo sobre fondos amarillos, rojos, cian ni combos amarillo+azul.

## 10. Qué NO maquetar todavía (para no perder tiempo)

Login real, subida de archivos (plan/presupuesto), tabla de riesgos por actividad,
desglose de presupuesto, oficios de aval, IA pre-calificadora, paginación.
Todo eso es Etapa 2 y ya está previsto en `02-DOMINIO-VIE.md` §5–§6.

## 11. Checklist de entrega Figma

- [ ] 3 páginas maquetadas con los textos exactos de §4–§6
- [ ] Color styles + text styles creados según §2
- [ ] Componentes Header/Botón/Input/Card/Badge/Filtros con variants
- [ ] Connections del flujo §7 funcionando en Present
- [ ] Una captura por página guardada en `Proeycto1/FIGMA-estado/` para que yo las revise

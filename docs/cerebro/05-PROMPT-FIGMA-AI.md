# 05 — PROMPT PARA LA IA DE FIGMA | Sistema Fondos VIE (TEC)

> Copia el bloque de abajo y pégalo en la IA de Figma (Figma Make / First Draft).
> Reutiliza el estilo visual de tus 4 capturas (login split, formulario por
> secciones numeradas, tabla con badges) pero con el dominio CORRECTO:
> Fondos VIE de investigación, no trámites estudiantiles F-REG-042.

## ⚠️ Observación crítica sobre tus capturas

Lo que tienes maquetado es "Solicitud de Trámites Académicos" (Vicerrectoría de
Docencia, Registro y Admisión, estudiante, F-REG-042). Nuestro proyecto es
"Fondos VIE" (Vicerrectoría de Investigación y Extensión: investigadores,
rúbrica CIE, dictamen PI, avales, TRL). Si le pides a la IA "continúa este
diseño" sin aclarar, te construye el sistema equivocado. El prompt de abajo
conserva tu lenguaje visual y corrige el contenido.

---

## PROMPT LISTO PARA PEGAR (inicio del bloque) ──────────────

Design a web app prototype in Spanish for "Fondos VIE — Tecnológico de Costa Rica (TEC)", a research proposal management system. Keep the exact visual language of my reference screenshots: white background, institutional header with TEC logo left and form code badge right, numbered sections with blue titles and hairline dividers, light inputs with placeholder examples, split-screen login with blue photo panel left and white form right.

BRAND TOKENS (create as styles): tec-azul #002855 (headers, primary buttons, table header), tec-rojo #EF3340 (4px line under header, accents only), background #FFFFFF, text #1A1A1A, border #E5E7EB, muted #777777, success green #1E7E34. Font system-ui. Base spacing 8px. Desktop frames 1440px, content max-width 900px centered.

BUILD 4 SCREENS:

1) LOGIN (replicate my screenshot 1): left blue panel with campus photo, headline "Investigación y Extensión para el Progreso", subtext "Portal unificado Fondos VIE: redacte, evalúe y consulte propuestas de investigación del TEC.", stats "50+ años de excelencia" and "12k+ estudiantes activos". Right white panel: TEC logo, title "Iniciar Sesión", subtitle "Utilice sus credenciales institucionales (@itcr.ac.cr / @estudiantec.cr)", fields Correo institucional + Contraseña with show/hide, checkbox Recordar + link "¿Olvidó su contraseña?", primary button "Ingresar al Sistema →", footer "soporte@itcr.ac.cr • 2550-2222" and language "Español".

2) REDACTAR PROPUESTA (same section style as my screenshots 2-3): header "INSTITUTO TECNOLÓGICO DE COSTA RICA / Vicerrectoría de Investigación y Extensión • Dirección de Investigación", badge "F-VIE-2027", "Página 1 de 3", title "Formulario de Propuesta de Investigación", subtitle about official correspondence to institutional email. Info box "INSTRUCCIONES IMPORTANTES". Section 1 "Datos de la propuesta": Título*, Coordinadora*, Escuela* (placeholder Ej: Computación), Temática* (Ej: IA). Section 2 "Contenido científico": Problema, Justificación, Objetivos, Metodología, TRL inicial (1-9) y TRL final (1-9). Section 3 "Equipo, plan y presupuesto": textarea Plan de acción, textarea Riesgos (1 por actividad + mitigación), Presupuesto total en colones. Primary button "Guardar borrador" + secondary "Enviar a revisión".

3) EVALUAR (bandeja del Comité Técnico): title "Evaluación — Bandeja en revisión", help text "Rúbrica CIE simplificada 0–100. La rúbrica oficial se conecta en Etapa 2." Cards with left border 5px by status (blue en revisión, green aprobada, red rechazada). Each card under review shows numeric input 0-100 default 80 plus "Aprobar" and "Rechazar" buttons. Empty state "No hay propuestas en revisión." Seed 3 cards: "Biofiltros con residuos de café para agua rural" (Ana Ruiz, Ingeniería Ambiental, Ambiente, en_revision, ₡2 500 000), "Detección temprana de roya con visión artificial" (Luis Mora, Computación, IA, aprobada, 92), "Secado solar de cacao en la zona sur" (María Fernández, Agronegocios, Energía, rechazada, 58).

4) HISTÓRICO: title "Consulta histórica", filter row with search "Buscar título o investigadora", "Escuela" input, status select (Todos/borrador/en revisión/aprobada/rechazada/observada), "Filtrar" button. Card list with status badges uppercase. Empty state "Sin resultados." Footer "Prototipo académico — no se integra con Orión en esta etapa."

COMPONENTS: HeaderTEC, PrimaryButton, Input, Textarea, Select, ProposalCard (variants per status), StatusBadge, FilterBar. Wire interactions: Guardar→new card in Histórico as borrador; Enviar→moves to Evaluar; Aprobar/Rechazar→returns to Histórico with final status; filters narrow the list. Responsive: stack filters vertically under 640px.

PERMISSION TO CHANGE: you are explicitly authorized to modify, rename, reorder, add or delete anything from my reference screenshots as needed to fit this Fondos VIE system — including headers, dependency names, form codes, section titles, fields, tables, buttons and copy. Keep only the visual style (colors, spacing, component look); replace all academic-procedures content with the research-proposals content above. If a reference element conflicts with the VIE domain, change it without asking.

## ────────────── (fin del bloque, pega hasta aquí)

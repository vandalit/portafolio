# Insights & Notas de Arquitectura: Sistema de Tokens Tipográficos

**Fecha:** Octubre 2026  
**Contexto:** Migración tipográfica de *Cormorant Garamond* (Serif Editorial) a *Darker Grotesque* (Sans Brutalista).  
**Propósito:** Documentar los aprendizajes del cambio de fuente, los cuellos de botella detectados en el sistema de tokens actual y la propuesta técnica recomendada para la próxima iteración.

---

## 1. El Diagnóstico: ¿Qué ocurrió?

Durante la migración tipográfica se buscó:
1. Reemplazar la familia tipográfica display por una grotesca condensada de alto impacto (*Darker Grotesque*).
2. Diferenciar drásticamente los pesos visuales: **Black (900)** para títulos de sección y grandes bloques, y **SemiBold (600)** para tarjetas.

### Lo que funcionó de inmediato (Tokens Atómicos)
* **La familia tipográfica estaba correctamente centralizada:** Con modificar una sola variable (`--font-display` en `src/css/base.css`), el 100% de los encabezados del sitio pasaron a renderizar la nueva fuente.
* **La escala fluida (`--text-*`):** Los tamaños relativos calculados mediante `clamp(...)` respondieron bien sin necesidad de recalcular los tamaños en píxeles.

### El cuello de botella: Pesos y Métricas Acopladas a Componentes
A pesar de tener tokens de fuente y tamaño, el cambio requirió editar múltiples archivos (`layout.css`, `components.css`, `base.css`) debido a:

1. **`font-weight` hardcodeado por componente:**  
   En la etapa serif, se habían definido valores fijos (`font-weight: 300` o `font-weight: 400`) directamente dentro de selectores específicos como `.section-header__title`, `.hero__name`, `.featured-case__title`, `.skill-card__title`, etc.
2. **Dependencia anatómica de la tipografía (Tracking & Leading):**  
   Una serif ligera (*Cormorant 300*) requiere interlineado amplio y tracking neutro/positivo. Una grotesca densa y condensada (*Darker Grotesque 900*) requiere `line-height: 0.95–1.0` y `letter-spacing: -0.025em` para no desparramarse visualmente. Estas métricas estaban escritas a fuego en cada clase.
3. **Falta de tokens semánticos de segundo nivel:**  
   Teníamos tokens *atómicos* (valores de materias primas como la familia o el tamaño), pero no tokens *semánticos* por rol visual (ej. *cómo se comporta un título de sección versus un título de tarjeta*).

---

## 2. Propuesta de Arquitectura para Futura Iteración

Para que un futuro rediseño o ajuste tipográfico se resuelva en **un solo archivo (`base.css`)** sin tocar componentes individuales, se recomienda evolucionar hacia una capa de tokens semánticos compuestos.

### A. Tokens Semánticos de Jerarquía Tipográfica (`base.css`)

```css
:root {
  /* ── 1. Tokens Atómicos de Tipografía ─────────────────── */
  --font-display: 'Darker Grotesque', system-ui, sans-serif;
  --font-sans:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'DM Mono', monospace;

  /* Pesos primitivos */
  --weight-display-black:    900;
  --weight-display-extrabold: 800;
  --weight-display-bold:     700;
  --weight-display-semibold: 600;
  --weight-display-medium:   500;
  --weight-display-regular:  400;

  /* ── 2. Tokens Semánticos por Rol (Decisión de diseño centralizada) ── */
  
  /* Título Masivo / Hero */
  --hero-title-weight:   var(--weight-display-black);
  --hero-title-tracking: -0.03em;
  --hero-title-leading:  0.90;

  /* Títulos de Sección (Perfil Técnico, Trabajos, Lab) */
  --section-title-weight:   var(--weight-display-black);
  --section-title-tracking: -0.025em;
  --section-title-leading:  0.95;

  /* Títulos de Modal Expandido */
  --modal-title-weight:   var(--weight-display-black);
  --modal-title-tracking: -0.03em;
  --modal-title-leading:  0.95;

  /* Títulos de Tarjetas (Skills, Casos, Lab, Proyectos) */
  --card-title-weight:   var(--weight-display-semibold);
  --card-title-tracking: -0.015em;
  --card-title-leading:  1.10;

  /* Subtítulos / Taglines editoriales */
  --tagline-weight:   var(--weight-display-medium);
  --tagline-tracking: -0.01em;
  --tagline-leading:  var(--leading-snug);
}
```

### B. Cómo consumen los componentes estos tokens

En `src/css/layout.css` y `src/css/components.css`:

```css
/* Títulos de sección */
.section-header__title,
.section-title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--section-title-weight);
  letter-spacing: var(--section-title-tracking);
  line-height: var(--section-title-leading);
}

/* Títulos de tarjetas */
.skill-card__title,
.case-card__title,
.lab-card__title,
.project-thumb__title {
  font-family: var(--font-display);
  font-weight: var(--card-title-weight);
  letter-spacing: var(--card-title-tracking);
  line-height: var(--card-title-leading);
}
```

---

## 3. Beneficios de esta Refactorización (Roadmap)

| Escenario | Con tokens actuales | Con tokens semánticos propuestos |
|---|---|---|
| Cambiar la fuente display | 1 archivo (`base.css`) | 1 archivo (`base.css`) |
| Cambiar peso de todas las tarjetas | 4 archivos (`components.css`, `layout.css`, etc.) | 1 línea en `base.css` (`--card-title-weight`) |
| Ajustar espaciado/interlineado por fuente | Búsqueda y reemplazo en ~12 selectores | 1 bloque en `base.css` |
| Coherencia visual garantizada | Requiere disciplina manual en cada CSS | Imposible romper la jerarquía por descuido |

---

## 4. Estado Actual

* **Fuentes activas:** `Darker Grotesque` (Display / Brutalista), `DM Sans` (Cuerpo / Lectura), `DM Mono` (Consola / Metadata).
* **Calibración actual:** Funcionando en producción local, visualmente consistente y verificada con `npm run build`.
* **Próxima acción cuando se decida refactorizar:** Migrar los selectores de componentes a las variables semánticas descritas en la Sección 2.


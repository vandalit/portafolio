# Design System — vandalit Portfolio
## Tokens, Paleta, Tipografía, Componentes y Gobernanza Visual

**Versión:** 2.0 (Sincronizada con el codebase vivo)  
**Última actualización:** Octubre 2026

---

## 1. Filosofía Visual

**Estilo:** Technical Console / Editorial High-Tech ("*Diseño que comunica. Código que respira.*").  
Combina el refinamiento editorial tipográfico clásico (Serif display de alto contraste) con la precisión de una consola técnica de desarrollo (superficies oscuras profundas, micro-grillas, acentos fluorescentes cyber-minimalistas y tipografía monoespaciada para metadatos).

**Principios:**
- **Contraste jerárquico:** El fondo `--bg-0` (#080810) sostiene capas superpuestas sin fatiga visual.
- **Triada cromática de autor:** Magenta (autoral/diseño), Lime (código/desarrollo) y Mango (estrategia/comercial).
- **Consistencia de tokens:** Ningún color `#hex`, valor `rgba(...)` arbitrario ni espaciado ad-hoc debe escribirse en componentes. Todo consume variables CSS.
- **Progressive Enhancement:** La interfaz es 100% legible y estructurada con CSS base si JavaScript está inactivo o en espera.

---

## 2. Paleta de Color y Tokens Centralizados (`base.css`)

### A. Fondos y Superficies

```css
:root {
  /* Lienzos generales */
  --bg-0: #080810;                 /* Fondo principal / canvas profundo */
  --bg-1: #0d0d18;                 /* Secciones primarias */
  --bg-2: #111120;                 /* Secciones alternas */
  --bg-3: #181828;                 /* Cards, modales, superficies elevadas */
  --bg-4: #1e1e30;                 /* Hover de superficies */
  --bg-glass: rgba(255, 255, 255, 0.03);
  --bg-glass-hover: rgba(255, 255, 255, 0.06);

  /* Superficies técnicas especializadas (Lab, Modales, Consolas) */
  --bg-surface-elevated: #161c26;  /* Cards técnicas comprimidas */
  --bg-surface-hover:    #1c2432;  /* Hover en cards técnicas */
  --bg-modal-narrative:  #0d1017;  /* Columna izquierda narrativa modal */
  --bg-modal-showcase:   #080a10;  /* Columna derecha interactiva modal */
  --bg-modal-backdrop:   rgba(6, 8, 14, 0.94); /* Telón difuminado */
}
```

### B. Triada Cromática de Ejes y Categorías

```css
:root {
  /* EJE 1: Autoral · Multimedia y Diseño */
  --magenta:        #d4205a;
  --magenta-bright: #e8306e;
  --magenta-dark:   #8a1040;
  --magenta-glow:   rgba(212, 32, 90, 0.22);
  --magenta-glow-sm:rgba(212, 32, 90, 0.12);
  --magenta-fade:   rgba(212, 32, 90, 0.08);

  /* EJE 2: Desarrollo · Coding & AI */
  --lime:           #ccf020;
  --lime-bright:    #ccf020;
  --lime-muted:     #b8e030;
  --lime-dark:      #6a8010;
  --lime-glow:      rgba(204, 240, 32, 0.22);
  --lime-glow-sm:   rgba(204, 240, 32, 0.12);
  --lime-fade:      rgba(204, 240, 32, 0.08);

  /* EJE 3: Comercial · Estrategia, Contenido & Negocio (Contraste WCAG AA: 7.2:1) */
  --mango:          #ff6b35;
  --mango-bright:   #ff834f;
  --mango-dark:     #b83d10;
  --mango-glow:     rgba(255, 107, 53, 0.22);
  --mango-glow-sm:  rgba(255, 107, 53, 0.12);
  --mango-fade:     rgba(255, 107, 53, 0.08);

  /* Gradientes de ejes */
  --grad-magenta: linear-gradient(135deg, #e8306e 0%, #d4205a 100%);
  --grad-lime:    linear-gradient(135deg, #ccf020 0%, #8ab820 100%);
  --grad-mango:   linear-gradient(135deg, #ff834f 0%, #ff6b35 100%);
  --grad-hero:    linear-gradient(135deg, rgba(212,32,90,0.15) 0%, rgba(204,240,32,0.08) 100%);
}
```

### C. Bordes y Delimitadores

```css
:root {
  --border-0: rgba(255, 255, 255, 0.04);
  --border-1: rgba(255, 255, 255, 0.08);
  --border-2: rgba(255, 255, 255, 0.14);
  --border-3: rgba(255, 255, 255, 0.22);
}
```

### D. Jerarquía de Texto

```css
:root {
  --text-0: #f2eff8;     /* Primario — blanco cálido */
  --text-1: #a8a5b5;     /* Secundario — lavanda ceniza */
  --text-2: #6a677a;     /* Terciario — metadatos / subtítulos sutiles */
  --text-3: #3d3a4a;     /* Mudo / deshabilitado */
}
```

---

## 3. Tipografía

### Familias Tipográficas
1. **Display / Titulares:** `Cormorant Garamond` (Google Fonts, serif italiano/clásico).
2. **UI / Textos de cuerpo:** `DM Sans` (Grotesca geométrica moderna, alta legibilidad).
3. **Técnica / Metadatos / Badges:** `DM Mono` (Monoespaciada limpia para códigos, números de versión y tags).

### Escala Fluida (`clamp`)
```css
:root {
  --text-2xs: clamp(0.625rem, 0.5vw + 0.4rem, 0.688rem); /* 10–11px */
  --text-xs:  clamp(0.700rem, 0.5vw + 0.5rem, 0.750rem); /* 11–12px */
  --text-sm:  clamp(0.812rem, 0.6vw + 0.6rem, 0.875rem); /* 13–14px */
  --text-base:clamp(0.937rem, 0.6vw + 0.7rem, 1.000rem); /* 15–16px */
  --text-lg:  clamp(1.062rem, 1vw  + 0.6rem, 1.125rem); /* 17–18px */
  --text-xl:  clamp(1.200rem, 1.5vw + 0.6rem, 1.375rem); /* 19–22px */
  --text-2xl: clamp(1.500rem, 2vw  + 0.6rem, 1.875rem); /* 24–30px */
  --text-3xl: clamp(1.875rem, 3vw  + 0.4rem, 2.500rem); /* 30–40px */
  --text-4xl: clamp(2.500rem, 4vw  + 0.4rem, 3.500rem); /* 40–56px */
  --text-5xl: clamp(3.000rem, 6vw  + 0.3rem, 5.000rem); /* 48–80px */
  --text-hero:clamp(3.500rem, 9vw  + 0.3rem, 9.000rem); /* 56–144px */
}
```

---

## 4. Espaciado y Cuadrícula

Escala modular basada en unidades de 4px:

```css
:root {
  --sp-1:  0.25rem;  /* 4px */
  --sp-2:  0.50rem;  /* 8px */
  --sp-3:  0.75rem;  /* 12px */
  --sp-4:  1.00rem;  /* 16px */
  --sp-5:  1.25rem;  /* 20px */
  --sp-6:  1.50rem;  /* 24px */
  --sp-8:  2.00rem;  /* 32px */
  --sp-10: 2.50rem;  /* 40px */
  --sp-12: 3.00rem;  /* 48px */
  --sp-16: 4.00rem;  /* 64px */
  --sp-20: 5.00rem;  /* 80px */
  --sp-24: 6.00rem;  /* 96px */
  --sp-32: 8.00rem;  /* 128px */

  --section-py: clamp(5rem, 10vw, 9rem);
  --section-px: clamp(1.25rem, 5vw, 4.5rem);
  --container-max: 1400px;
  --container-text: 720px;
  --grid-gap: clamp(1rem, 2vw, 1.75rem);
}
```

---

## 5. Radios y Profundidad

```css
:root {
  --radius-sm:   3px;
  --radius-md:   8px;
  --radius-lg:   14px;
  --radius-xl:   22px;
  --radius-pill: 9999px;
  --radius-card: 2px;    /* Estética editorial para thumbs */

  --shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.7);
  --shadow-xl: 0 24px 64px rgba(0, 0, 0, 0.85);
}
```

---

## 6. Motion y Easing

```css
:root {
  --dur-fast:   150ms;
  --dur-normal: 300ms;
  --dur-slow:   550ms;
  --dur-reveal: 900ms;

  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  --transition: var(--dur-normal) var(--ease-out);
  --transition-fast: var(--dur-fast) var(--ease-out);
}
```

---

## 7. Reglas de Gobernanza CSS

1. **Cero colores hex inline en componentes:** Se prohíbe escribir `#hex` dentro de `components.css`, `layout.css` o plantillas HTML. Se debe consumir siempre `var(--nombre-token)`.
2. **Cero estilos de layout en `index.html`:** En el `<head>` solo se permite el bloque `<style>` del preloader crítico y el `<noscript>` de fallback. Todo estilo de componente reside en `components.css`, y los grids/secciones en `layout.css`.
3. **Accesibilidad de Contraste (WCAG AA):**
   - Todo color de texto o acento sobre fondo `--bg-0` debe superar el ratio mínimo de 4.5:1 (el token `--mango` pasa con 7.2:1, `--lime` con 13.8:1, `--magenta` con 5.1:1).
4. **Respeto a Reduced Motion:** Toda animación decorativa o parallax debe anularse cuando `@media (prefers-reduced-motion: reduce)` esté activo.

---
*Este documento es la única fuente de verdad visual del proyecto vandalit.*

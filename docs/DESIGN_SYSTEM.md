# Design System — vandalit Portfolio
## Tokens, Paleta, Tipografía, Componentes

**Versión:** 1.0 | **Última actualización:** Octubre 2026

---

## 1. Filosofía Visual

**Estilo:** Nórdico-editorial minimalista con carácter propio.  
El diseño comunica precisión, gusto, y autoría. No neutralidad vacía.

**Principios:**
- **Aire como elemento:** El espacio negativo no es ausencia — es estructura
- **Contraste con propósito:** No decorativo, sino jerárquico
- **Motion que informa:** Cada animación transmite un estado, no solo belleza
- **Coherencia sistémica:** Tokens centralizados, ningún valor ad-hoc

---

## 2. Paleta de Color

### Colores Base

```css
:root {
  /* Fondos */
  --color-bg-primary:    #0c0c0e;   /* Negro azulado profundo — fondo principal */
  --color-bg-secondary:  #111115;   /* Ligeramente más claro — secciones alternas */
  --color-bg-tertiary:   #1a1a22;   /* Cards, modales, elementos elevados */
  --color-bg-glass:      rgba(255, 255, 255, 0.04); /* Glassmorphism sutil */

  /* Superficies */
  --color-surface-1:     #16161f;
  --color-surface-2:     #1e1e2a;
  --color-surface-hover: #252535;

  /* Bordes */
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-soft:   rgba(255, 255, 255, 0.10);
  --color-border-medium: rgba(255, 255, 255, 0.16);

  /* Texto */
  --color-text-primary:  #f0ede8;   /* Blanco cálido, no puro */
  --color-text-secondary:#a09d97;   /* Gris medio cálido */
  --color-text-tertiary: #6b6866;   /* Gris oscuro — metadatos */
  --color-text-disabled: #3d3c3b;

  /* Accents */
  --color-accent-warm:   #e8c98a;   /* Dorado arena — accent principal */
  --color-accent-rust:   #c4704a;   /* Terracota — segundo accent */
  --color-accent-sage:   #7a9e8a;   /* Verde salvia — tercer accent */
  --color-accent-lavender: #9b8fc4; /* Lavanda — casos de estudio */

  /* Accent UI */
  --color-accent-glow:   rgba(232, 201, 138, 0.12); /* Glow para elementos hover */
  --color-accent-focus:  rgba(232, 201, 138, 0.30); /* Focus rings */
}
```

### Uso de Colores por Sección

| Sección | Fondo | Accent | Notas |
|---------|-------|--------|-------|
| Hero | `--bg-primary` | `--accent-warm` | Máximo contraste, impactante |
| Cases | `--bg-secondary` | `--accent-lavender` | Tono editorial |
| Skills | `--bg-primary` | Por categoría | Cada skill card tiene su accent |
| Clientes | `--bg-secondary` | `--accent-rust` | Tierra, profesional |
| Lab IA | `--bg-tertiary` | `--accent-sage` | Más frío, más técnico |
| Footer | `--bg-primary` | `--text-tertiary` | Minimalismo total |

### Paleta de Skills por Categoría

```css
--skill-ux:       #4a7fa5;   /* Azul profundo */
--skill-ui:       #c4704a;   /* Terracota */
--skill-frontend: #7a9e8a;   /* Verde salvia */
--skill-motion:   #9b8fc4;   /* Lavanda */
--skill-content:  #c4a84a;   /* Ocre */
--skill-ai:       #8a8fa5;   /* Gris azulado */
```

---

## 3. Tipografía

### Fuentes Seleccionadas

**Display / Headings:** [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- Serif clásico con altura de x elegante
- Perfecto para títulos de sección y nombres de proyectos
- Pesos usados: 300, 400, 500, 600

**UI / Body:** [DM Sans](https://fonts.google.com/specimen/DM+Sans)
- Grotesca contemporánea con excelente legibilidad
- Moderna sin ser genérica
- Pesos usados: 300, 400, 500

**Monospace (código/metadata):** [DM Mono](https://fonts.google.com/specimen/DM+Mono)
- Para tags, labels técnicos, metadatos
- Peso: 300, 400

### Escala Tipográfica

```css
:root {
  /* Fuentes */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-sans:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'DM Mono', 'Courier New', monospace;

  /* Escala (fluid type con clamp) */
  --text-xs:    clamp(0.70rem, 0.5vw + 0.5rem, 0.75rem);   /* 11–12px */
  --text-sm:    clamp(0.812rem, 0.5vw + 0.6rem, 0.875rem); /* 13–14px */
  --text-base:  clamp(0.937rem, 0.5vw + 0.7rem, 1rem);     /* 15–16px */
  --text-lg:    clamp(1.062rem, 1vw + 0.6rem, 1.125rem);   /* 17–18px */
  --text-xl:    clamp(1.2rem, 1.5vw + 0.7rem, 1.375rem);   /* 19–22px */
  --text-2xl:   clamp(1.5rem, 2vw + 0.7rem, 1.875rem);     /* 24–30px */
  --text-3xl:   clamp(1.875rem, 3vw + 0.5rem, 2.5rem);     /* 30–40px */
  --text-4xl:   clamp(2.5rem, 4vw + 0.5rem, 3.5rem);       /* 40–56px */
  --text-5xl:   clamp(3rem, 6vw + 0.5rem, 5rem);           /* 48–80px */
  --text-hero:  clamp(4rem, 9vw + 0.5rem, 8rem);           /* 64–128px */

  /* Line heights */
  --leading-tight:  1.1;
  --leading-snug:   1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
  --leading-loose:  2.0;

  /* Letter spacing */
  --tracking-tight:  -0.02em;
  --tracking-normal: 0em;
  --tracking-wide:   0.05em;
  --tracking-wider:  0.1em;
  --tracking-widest: 0.2em;
}
```

### Uso por Tipo de Texto

| Elemento | Fuente | Tamaño | Peso | Spacing |
|----------|--------|--------|------|---------|
| Hero nombre | Display | `--text-hero` | 300 | `--tracking-tight` |
| Hero tagline | Display | `--text-4xl` | 400 | normal |
| H2 sección | Display | `--text-4xl` | 400 | `--tracking-tight` |
| H3 card | Display | `--text-2xl` | 500 | normal |
| Body | Sans | `--text-base` | 300 | normal |
| Label/tag | Mono | `--text-xs` | 400 | `--tracking-widest` uppercase |
| Navegación | Sans | `--text-sm` | 400 | `--tracking-wide` |
| CTA button | Sans | `--text-sm` | 500 | `--tracking-wider` |

---

## 4. Espaciado

Sistema basado en múltiplos de 4px con variables semánticas.

```css
:root {
  --space-1:  0.25rem;  /*  4px */
  --space-2:  0.5rem;   /*  8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px */
  --space-40: 10rem;    /* 160px */

  /* Semánticos */
  --section-padding-y:    clamp(5rem, 10vw, 10rem);
  --section-padding-x:    clamp(1.5rem, 5vw, 5rem);
  --container-max:        1440px;
  --container-wide:       1200px;
  --container-text:       720px;
  --grid-gap:             clamp(1rem, 2vw, 2rem);
}
```

---

## 5. Bordes y Radios

```css
:root {
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  20px;
  --radius-full: 9999px;

  /* Cards de proyectos: sin radio o mínimo (estética editorial) */
  --card-radius: 2px;
  /* Cards de skills: radio medio */
  --skill-card-radius: var(--radius-lg);
  /* Botones: full pill o cuadrado */
  --btn-radius-pill: var(--radius-full);
  --btn-radius-square: var(--radius-sm);
}
```

---

## 6. Sombras y Profundidad

```css
:root {
  /* Sombra inset para glassmorphism */
  --shadow-inset: inset 0 1px 0 rgba(255,255,255,0.05);

  /* Elevación de componentes */
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4);
  --shadow-lg:   0 8px 32px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.5);
  --shadow-xl:   0 20px 60px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5);

  /* Glow accent */
  --glow-warm:   0 0 20px rgba(232, 201, 138, 0.15), 0 0 60px rgba(232, 201, 138, 0.05);
  --glow-rust:   0 0 20px rgba(196, 112, 74, 0.15);
}
```

---

## 7. Transiciones y Easing

```css
:root {
  /* Duraciones */
  --duration-instant:   100ms;
  --duration-fast:      150ms;
  --duration-normal:    300ms;
  --duration-slow:      500ms;
  --duration-slower:    700ms;
  --duration-reveal:    900ms;

  /* Easing personalizados */
  --ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart:  cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1); /* Ligero bounce */
  --ease-smooth:     cubic-bezier(0.4, 0, 0.2, 1);

  /* Transición default */
  --transition-base: var(--duration-normal) var(--ease-out-quart);
  --transition-fast: var(--duration-fast) var(--ease-out-expo);
  --transition-reveal: var(--duration-reveal) var(--ease-out-expo);
}
```

---

## 8. Grid System

```css
/* Layout principal */
.container {
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--section-padding-x);
}

/* Grid de proyectos */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--grid-gap);
}

/* Grid split 60/40 (modal detalle) */
.split-canvas {
  display: grid;
  grid-template-columns: 38fr 62fr;
  height: 100vh;
  overflow: hidden;
}
```

---

## 9. Tokens de Componentes

### Cards de Proyecto
```css
.project-card {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius);
  overflow: hidden;
  transition: transform var(--transition-base),
              box-shadow var(--transition-base),
              border-color var(--transition-base);
}
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-medium);
}
```

### Botones
```css
/* Primary — filled */
.btn-primary {
  background: var(--color-accent-warm);
  color: var(--color-bg-primary);
  font: 500 var(--text-sm)/1 var(--font-sans);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--btn-radius-pill);
  border: none;
  transition: var(--transition-fast);
}

/* Ghost — outline */
.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  /* mismo font y padding */
}
.btn-ghost:hover {
  border-color: var(--color-accent-warm);
  color: var(--color-accent-warm);
}
```

### Tags / Badges
```css
.tag {
  font: 400 var(--text-xs)/1 var(--font-mono);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
}
```

---

## 10. Iconografía

- **Sistema:** Phosphor Icons (CDN) — peso: Regular y Thin
- **Uso:** Solo para UI funcional (nav, cierres, flechas), nunca decorativo
- **Tamaños estándar:** 16px (inline), 20px (botones), 24px (headings)
- **Alternativa local:** SVG inline para íconos únicos/personalizados

---

*Este documento es la fuente de verdad para todas las decisiones visuales del proyecto.*

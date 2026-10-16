# vandalit · Portfolio

> Portafolio personal de diseño UX/UI y desarrollo front-end.  
> Sitio estático desplegado en GitHub Pages.

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-0d1117?style=flat-square&logo=github)](https://vandalit.github.io/portafolio)
[![Status](https://img.shields.io/badge/Status-En%20desarrollo-f0a500?style=flat-square)]()

---

## 🧭 Descripción

Portafolio one-page de **vandalit** — diseñador front-end UX/UI con foco en interfaces limpias, motion design, y experiencias de usuario bien construidas. Incluye proyectos de clientes, casos de estudio, experimentos de laboratorio con IA, y un perfil de habilidades técnicas.

El sitio está construido como HTML/CSS/JS estático sin dependencias de frameworks, pensado para máximo rendimiento en GitHub Pages. Incorpora Three.js para efectos 3D selectivos, GSAP para motion y parallax, y una filosofía de diseño nórdico-minimalista.

---

## 📁 Estructura del Proyecto

```
portafolio/
├── index.html              # One-page principal (entry point GitHub Pages)
├── README.md
├── docs/                   # Documentación estratégica
│   ├── PRD.md              # Product Requirements Document
│   ├── DESIGN_SYSTEM.md    # Sistema de diseño: tokens, paleta, tipografía
│   ├── CONTENT_STRATEGY.md # Estrategia de contenido y copywriting
│   └── ARCHITECTURE.md     # Arquitectura técnica y decisiones
├── src/
│   ├── css/
│   │   ├── base.css        # Reset, variables CSS, tokens
│   │   ├── layout.css      # Grid, secciones, contenedores
│   │   ├── components.css  # Cards, carrusel, tabs, modal
│   │   └── animations.css  # Keyframes, transiciones, parallax
│   ├── js/
│   │   ├── main.js         # Init, scroll, intersection observers
│   │   ├── three-scene.js  # Escena Three.js hero
│   │   ├── carousel.js     # Lógica carrusel skills
│   │   ├── grid-filter.js  # Tabs + filtro de proyectos
│   │   ├── project-modal.js # Canvas detalle proyecto (split-scroll)
│   │   └── parallax.js     # Parallax vertical/horizontal
│   └── data/
│       └── projects.json   # Data de proyectos y casos de estudio
├── assets/
│   ├── images/
│   │   ├── clients/        # Imágenes proyectos de clientes
│   │   ├── case-studies/   # Imágenes casos de estudio
│   │   └── lab/            # Screenshots demos CSS-driven
│   └── fonts/              # Fuentes locales (opcional)
└── demos/                  # Experimentos previos (lab IA)
    ├── cssaidriven_v1/
    ├── cssaidriven-v2/
    └── case-study-ai-driven/
```

---

## 🗂 Secciones del Portafolio

| # | Sección | Componente Principal | Descripción |
|---|---------|---------------------|-------------|
| 1 | **Hero** | Three.js + scroll reveal | Presentación animada con escena 3D cel-shading |
| 2 | **Casos de Estudio** | Cards destacadas + carrusel | Proyectos ambiciosos con descripción e imagen |
| 3 | **Skills** | Carrusel de cards apaisadas | Habilidades técnicas organizadas por categoría |
| 4 | **Trabajo de Clientes** | Grid con tabs + modal split-scroll | Proyectos WordPress y web de clientes |
| 5 | **Lab IA** | Grid simple | Demos CSS-driven generados con IA |
| 6 | **Contacto / Footer** | Minimal | Links, email, redes |

---

## 🚀 Setup & Deploy

```bash
# Clonar y abrir localmente
git clone https://github.com/vandalit/portafolio.git
cd portafolio

# No requiere build. Abrir index.html directamente o usar servidor local:
npx serve .

# GitHub Pages: rama main / carpeta raíz
```

---

## 🛠 Stack Técnico

- **HTML5** semántico, sin frameworks
- **CSS3** — Custom properties, Grid, Flexbox, scroll-driven animations
- **Vanilla JS** — ES Modules, Intersection Observer, ResizeObserver
- **Three.js** (CDN) — Escena hero 3D con cel-shading
- **GSAP** (CDN) — Motion, ScrollTrigger, parallax
- **GitHub Pages** — Deploy estático

---

## 📌 Proyectos Incluidos

### Clientes
- **Turismo Lickancoy** — Sitio WordPress turismo atacameño
- **Infinito Ingeniería** — Sitio WordPress corporativo ingeniería

### Casos de Estudio
- **Syzygy** — Sistema de diseño astral / motion
- **AFK** — Plataforma gaming / UX research
- **Kaktus** — App mobile diseño editorial
- **multiPiP** — Tool multi picture-in-picture
- **Card Tools** — Sistema de tarjetas interactivas
- **Backlog** — Gestión de proyectos personal
- **Twitch Redesign** — Rediseño conceptual Twitch
- **Rizoma** — Proyecto de visualización de datos

### Lab IA
- CSS AI-Driven v1 — Exploración CSS generativo
- CSS AI-Driven v2 — WIP exploración avanzada
- Paprika — Anime E-Commerce case study

---

## 👤 Autor

**vandalit** · [@vandalittt](https://twitter.com/vandalittt) · [github.com/vandalit](https://github.com/vandalit)

---

*Portafolio construido con intención: menos es más, cada elemento justifica su presencia.*

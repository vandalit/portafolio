# Arquitectura Técnica — vandalit Portfolio

**Versión:** 1.0 | **Última actualización:** Octubre 2026

---

## 1. Stack y Decisiones

### ¿Por qué estático puro (sin frameworks)?
- **GitHub Pages:** Deploy inmediato sin configuración
- **Velocidad:** Sin overhead de bundler, hidratación, o runtime JS
- **Mantenibilidad:** Cualquier dev puede abrir y editar sin setup
- **Portfolio en sí mismo:** Demuestra control nativo del stack web

### Librería externa aceptadas (CDN)
| Librería | Versión | Uso |
|----------|---------|-----|
| Three.js | r165 | Escena 3D hero |
| GSAP + ScrollTrigger | 3.x | Motion, parallax, reveal |
| Phosphor Icons | 2.x | Iconografía UI |
| Google Fonts | — | Cormorant Garamond, DM Sans, DM Mono |

> **Regla:** CDN solo. Sin npm, sin bundler, sin node_modules. Todo funcional al abrir `index.html`.

---

## 2. Estructura de Archivos

```
portafolio/
│
├── index.html                    # Entry point único. One-page.
├── README.md
│
├── docs/
│   ├── PRD.md
│   ├── DESIGN_SYSTEM.md
│   ├── ARCHITECTURE.md           ← este archivo
│   └── CONTENT_STRATEGY.md
│
├── src/
│   ├── css/
│   │   ├── base.css              # Variables, reset, tokens
│   │   ├── layout.css            # Contenedores, secciones, grid
│   │   ├── components.css        # Cards, tabs, modal, nav, footer
│   │   └── animations.css        # Keyframes, reveal, parallax classes
│   │
│   ├── js/
│   │   ├── main.js               # Bootstrap, init, event listeners globales
│   │   ├── three-scene.js        # Three.js: escena, geometría, cel-shader
│   │   ├── carousel.js           # Carrusel skills + cases (drag, keyboard)
│   │   ├── grid-filter.js        # Tabs + filtro animado de proyectos
│   │   ├── project-modal.js      # Modal split-canvas, scroll dual
│   │   ├── parallax.js           # GSAP ScrollTrigger parallax layers
│   │   └── nav.js                # Navegación sticky, active states
│   │
│   └── data/
│       └── projects.json         # Source of truth para todo el contenido
│
└── assets/
    ├── images/
    │   ├── clients/
    │   │   ├── lickancoy/        # thumb.jpg + gallery-01.jpg ... gallery-N.jpg
    │   │   └── infinito/
    │   ├── case-studies/
    │   │   ├── syzygy/
    │   │   ├── afk/
    │   │   ├── kaktus/
    │   │   └── ...
    │   └── lab/
    │       ├── cssdriven-v1/
    │       ├── cssdriven-v2/
    │       └── paprika/
    └── og-image.jpg              # Open Graph image
```

---

## 3. Arquitectura del One-Page

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Meta, OG, fonts, CSS -->
</head>
<body>

  <!-- NAV: sticky, minimalista -->
  <nav id="nav">...</nav>

  <!-- HERO: full-viewport, Three.js canvas -->
  <section id="hero">
    <canvas id="three-canvas"></canvas>
    <div class="hero-content">...</div>
  </section>

  <!-- CASES: destacados + carrusel -->
  <section id="cases">
    <div class="featured-case">...</div>        <!-- "Destacado" component -->
    <div class="cases-carousel">...</div>
  </section>

  <!-- SKILLS: carrusel apaisado -->
  <section id="skills">
    <div class="skills-carousel">...</div>
  </section>

  <!-- WORK: grid con tabs + modales -->
  <section id="work">
    <nav class="tabs">...</nav>
    <div class="projects-grid">...</div>
  </section>

  <!-- LAB: experimentos IA -->
  <section id="lab">
    <div class="lab-grid">...</div>
  </section>

  <!-- FOOTER: contacto -->
  <footer id="contact">...</footer>

  <!-- MODAL (overlay, fuera del flujo normal) -->
  <div id="project-modal" class="modal" aria-hidden="true">
    <div class="modal-split-canvas">
      <aside class="modal-sidebar">...</aside>
      <main class="modal-gallery">...</main>
    </div>
  </div>

  <!-- SCRIPTS -->
  <script type="module" src="./src/js/main.js"></script>
</body>
</html>
```

---

## 4. Módulo: projects.json

Único source of truth para todo el contenido dinámico.

```json
{
  "cases": [
    {
      "id": "syzygy",
      "category": "ui",
      "title": "Syzygy",
      "subtitle": "Sistema de diseño astral",
      "description": "...",
      "year": 2024,
      "role": "Design System Lead",
      "tags": ["ui", "motion", "design-systems"],
      "coverImage": "./assets/images/case-studies/syzygy/thumb.jpg",
      "accentColor": "#9b8fc4",
      "featured": true,
      "gallery": [
        "./assets/images/case-studies/syzygy/gallery-01.jpg"
      ],
      "links": {
        "github": "https://github.com/vandalit/Syzygy",
        "live": null
      }
    }
  ],
  "clients": [
    {
      "id": "lickancoy",
      "category": "wordpress",
      "title": "Turismo Lickancoy",
      "client": "Turismo Lickancoy",
      "description": "Sitio web de turismo para la comunidad atacameña de Lickancoy. Diseño orientado a experiencia inmersiva del destino.",
      "year": 2023,
      "role": "UX/UI Design + WordPress Dev",
      "tags": ["wordpress", "ux", "web"],
      "coverImage": "./assets/images/clients/lickancoy/thumb.jpg",
      "challenge": "...",
      "solution": "...",
      "result": "...",
      "stack": ["WordPress", "Elementor", "Custom CSS"],
      "gallery": [],
      "links": { "live": "https://turismolickancoy.cl" }
    }
  ],
  "skills": [
    {
      "id": "ux",
      "category": "ux",
      "title": "UX Research & Strategy",
      "description": "Investigación de usuarios, síntesis de hallazgos, journey maps y definición de problemas de diseño.",
      "skills": ["User Interviews", "Wireframing", "Journey Mapping", "Heuristic Evaluation", "Usability Testing"],
      "accentColor": "#4a7fa5"
    }
  ],
  "lab": [
    {
      "id": "cssdriven-v1",
      "title": "CSS AI-Driven v1",
      "description": "Exploración de CSS generativo con prompts de IA como herramienta de dirección.",
      "aiAssisted": true,
      "coverImage": "./assets/images/lab/cssdriven-v1/thumb.jpg",
      "links": {
        "demo": "./demos/cssaidriven_v1/index.html",
        "github": "https://github.com/vandalit/portafolio"
      }
    }
  ]
}
```

---

## 5. Three.js — Escena Hero

### Concepto Visual
Geometría flotante abstracta (poliedros irregulares, líneas de conexión) con estilo cel-shading. Los objetos responden levemente al movimiento del cursor y collapsan al hacer scroll.

### Implementación

```javascript
// three-scene.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

class HeroScene {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    // Sin antialias intencional → estética de bordes duros = cel-shading feeling
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, ...);
    this.objects = [];
    this.mouse = new THREE.Vector2();
  }

  createCelShader() {
    // ShaderMaterial con toon shading (2-3 bandas de luz)
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#e8c98a') },
        uLightDir: { value: new THREE.Vector3(1, 2, 3).normalize() },
        uBands: { value: 3.0 }
      },
      vertexShader: `...`,
      fragmentShader: `...`
    });
  }

  onScroll(progress) {
    // progress: 0 (hero visible) → 1 (hero fuera de pantalla)
    this.camera.position.z = 5 + progress * 3;
    this.scene.children.forEach(obj => {
      obj.material.opacity = 1 - progress;
    });
  }
}
```

### Fallback
Si `WebGL` no está disponible, el canvas se oculta y se muestra un fondo con gradiente CSS animado.

```css
@supports not (transform: perspective(1px)) {
  #three-canvas { display: none; }
  .hero-bg-fallback { display: block; }
}
```

---

## 6. Scroll Dual — Modal Split Canvas

### Lógica de Estados

```
Estado A: sidebar puede scrollear, gallery puede scrollear
Estado B: sidebar en bottom, gallery puede scrollear
Estado C: sidebar puede scrollear, gallery en bottom
Estado D: AMBOS en bottom → unlock page scroll
```

```javascript
class SplitCanvas {
  constructor(sidebarEl, galleryEl) {
    this.sidebar = sidebarEl;
    this.gallery = galleryEl;
    this.sidebarBottom = false;
    this.galleryBottom = false;
  }

  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY;
    const target = this.getScrollTarget(e);

    if (target === 'sidebar') {
      this.sidebar.scrollTop += delta;
      this.sidebarBottom = this.isAtBottom(this.sidebar);
    } else {
      this.gallery.scrollTop += delta;
      this.galleryBottom = this.isAtBottom(this.gallery);
    }

    // Si ambos en bottom, liberar scroll del body
    if (this.sidebarBottom && this.galleryBottom) {
      this.unlockPageScroll();
    }
  }

  isAtBottom(el) {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
  }
}
```

El visor de imágenes compartido por los modales de proyectos y Lab permite ampliar con la rueda del mouse y desplazar la imagen ampliada manteniendo el botón medio. El zoom se limita a 5×, el pan permanece dentro del área visible y cada cambio de imagen restablece el encuadre.

---

## 7. Carrusel — Skills y Cases

### Comportamiento
- Drag con momentum (inertia)
- Snap a la card más cercana al soltar
- Navegación por teclado (←→)
- Indicador de progreso (dots o línea)

### Implementación (Vanilla JS)
```javascript
class Carousel {
  constructor(trackEl, options = {}) {
    this.track = trackEl;
    this.isDragging = false;
    this.startX = 0;
    this.scrollStart = 0;
    this.velocity = 0;

    this.bindEvents();
  }

  onPointerDown(e) { this.isDragging = true; this.startX = e.clientX; }
  onPointerMove(e) {
    if (!this.isDragging) return;
    const delta = e.clientX - this.startX;
    this.track.scrollLeft = this.scrollStart - delta;
  }
  onPointerUp() { this.isDragging = false; this.applyMomentum(); }
}
```

---

## 8. Filtro de Proyectos — Tabs

### Comportamiento
- Tabs con active state (underline animado que se desliza)
- Filtro: items que no coinciden → `opacity: 0; scale: 0.95; pointer-events: none`
- Items que coinciden → `opacity: 1; scale: 1`
- Transición escalonada (stagger 50ms por item)

```javascript
function filterProjects(category) {
  const items = document.querySelectorAll('.project-card');
  items.forEach((item, i) => {
    const match = category === 'all' || item.dataset.category === category;
    item.style.transitionDelay = match ? `${i * 50}ms` : '0ms';
    item.classList.toggle('hidden', !match);
  });
}
```

---

## 9. Rendimiento

### Estrategias
- **Preloader:** el avance se mantiene en 2% mientras se cargan los datos; al terminar esos datos, el montaje de la estructura y la descarga de los covers empiezan en paralelo. Llega a 25% cuando la estructura, los modales y los skeletons están montados; de 25% a 90% refleja bytes descargados (ponderados por tamaño cuando el navegador informa todos los tamaños; en caso contrario, promedio por cover) y decodificación de cada cover único de Cases. Los covers que fallen o superen 30 segundos se marcan como fallback y no bloquean indefinidamente el preloader. 92% espera fuentes, 98% espera el siguiente paint y 100% inicia la salida visual.
- **Orden de carga:**

  ```text
  HTML/CSS/JS + datos de contenido
              ↓
  ┌─────────────────────────────────────┐
  │ En paralelo                         │
  ├─────────────────────────────────────┤
  │ Montar secciones, modales y skeletons│
  │ Descargar y decodificar covers Cases│
  └─────────────────────────────────────┘
              ↓
  Fuentes + paint → retirar el preloader
              ↓
  Activar imágenes lazy a baja prioridad; skeleton → imagen/error
              ↓
  Cargar videos Bento al acercarse al viewport
              ↓
  Si el usuario permanece en Hero: texturas 3D secuenciales y de baja prioridad
  Si se desplaza o sale del Hero: cancelar la cola de texturas
  ```

- **Images:** `loading="lazy"` y prioridad baja para grids, galerías y covers Bento; los skeletons se montan antes de asignarles `src`.
- **Cases:** cuatro covers de portada se sirven como WebP; los originales PNG y las rutas de galería se conservan. Los covers únicos se descargan durante el preloader, se muestran con sus skeletons y alimentan las instancias activas del carrusel.
- **Fonts:** `font-display: swap`; el preloader espera `document.fonts.ready`.
- **Three.js:** la escena base se prepara durante el montaje; las texturas se solicitan después de retirar el preloader y solo si el usuario sigue en Hero.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` desactiva parallax y reveal animations

### Target de Performance
- FCP (First Contentful Paint) < 1.5s
- LCP < 2.5s
- Sin JavaScript bloqueante en `<head>`

---

## 10. Navegación y Routing

Single-page sin routing real. Navegación por anclas (`#section-id`) con scroll suave.

```javascript
// Highlight de nav según sección activa
const sections = document.querySelectorAll('section[id]');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      document.querySelector(`[href="#${entry.target.id}"]`)?.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));
```

### Estación de scroll implementada: Cases V6

Cases V6 parte de la implementación V5 y tiene una estación de aproximadamente 400 px efectivos en escritorio: el tablero queda fijado bajo el navbar y se libera al terminar el recorrido. Solo el rótulo contextual junto al logo cambia a lima durante el pin; el tab «CASES» conserva su estilo. Se implementa con `position: sticky` y un runway, sin interceptar la rueda ni bloquear el scroll. Se mantiene activa en escritorio aunque el tablero supere el alto disponible, y se desactiva en pantallas móviles. V4 se conserva como implementación independiente de referencia.

La duración se define en `--cv6-station-length` (`src/css/cases-v6.css`); `src/js/main.js` observa el estado fijado y aplica `is-station-active` exclusivamente a `#nav-context-text`. El rótulo se estiliza en `src/css/layout.css` y el runway está en `src/partials/cases-v6.html`. En escritorio, la fila inferior organiza en tres columnas el carrusel compacto, la aguja con contador y el carrusel ancho. La línea de progreso y las flechas se ubican en una fila separada debajo de ambos carruseles. En móvil se oculta el carrusel compacto y esos controles siguen debajo del carrusel ancho. Las tags de las tarjetas se ocultan y el contenido/CTA del feature se compacta.

Cases V6 queda activo en el ensamblado. La implementación anterior se conserva como `cases-deprecated.html`, `cases-deprecated.css` y `cases-deprecated.js`; no se importa ni activa, y sus selectores `cv5` no se comparten con V6. El snapshot histórico V5-old permanece en `src/partials/cases-v5-old.html`, `src/css/cases-v5-old.css` y `src/js/cases-v5-old.js`, también sin importarse ni activarse.

La aguja divisora `.cv6-divider` permanece fija en la columna central del grid entre ambos carruseles; no sigue el desplazamiento de las tarjetas. En escritorio, la columna del carrusel compacto mide una tarjeta más el padding horizontal del track, para evitar espacio sobrante; el ancho de las tarjetas es responsivo al viewport (`clamp(190px, 24vw, 280px)`, con un rango menor en móvil).

---

## 11. Deploy — GitHub Pages

El contrato de build y despliegue vigente está documentado en [`arquitectura-despliegue.md`](./arquitectura-despliegue.md). En resumen: `index.html` es la plantilla de parciales; `npm run build` ensambla y prerenderiza `dist/`; GitHub Actions publica ese artefacto. La fuente de Pages debe ser **GitHub Actions**, nunca `main:/`, y no debe mantenerse un publicador de rama en paralelo.

---

*Este documento describe decisiones de arquitectura y patrones del frontend. Para el flujo operativo de contenido, build y deploy, mantener como referencia única `docs/arquitectura-despliegue.md`.*

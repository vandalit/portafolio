# PRD — Product Requirements Document
## Portafolio vandalit · v1.0

**Última actualización:** Octubre 2026  
**Autor:** vandalit  
**Estado:** Documentación inicial / Fase 1

---

## 1. Resumen Ejecutivo

### Propósito
Construir un portafolio personal one-page de excelencia para vandalit, diseñador UX/UI y desarrollador front-end. El sitio debe funcionar simultáneamente como:

1. **Tarjeta de presentación técnica** — demostrar habilidades de diseño e implementación
2. **Archivo de proyectos** — mostrar trabajo real de clientes y casos de estudio
3. **Showcase de capacidades** — el propio sitio es la mejor demostración de skills
4. **Laboratorio** — transparencia sobre la exploración con IA generativa

### Audiencia Objetivo
- Clientes potenciales buscando diseñador UX/UI / front-end
- Reclutadores y estudios de diseño
- Colegas del sector (networking, colaboración)
- Personas del área tech interesadas en el stack y metodología

### Propuesta de Valor
> Un portafolio que no solo *muestra* trabajo — sino que *es* el trabajo. Cada interacción, cada transición, cada decisión visual es evidencia directa de las capacidades de su autor.

---

## 2. Objetivos y Métricas

### Objetivos de Negocio
- Establecer presencia digital profesional en GitHub Pages
- Generar contactos de calidad para proyectos freelance
- Posicionar el perfil como UX/UI senior con skills técnicas

### Objetivos de UX
- Primera impresión memorable en los primeros 3 segundos
- Flujo de navegación intuitivo sin instrucciones explícitas
- Acceso a información de proyecto en máximo 2 clicks
- Cero saturación visual — calidad sobre cantidad

### KPIs (cualitativos para v1)
- Tiempo de permanencia > 2 min promedio
- Completar flujo hero → caso de estudio → contacto
- Funcionalidad completa en móvil

---

## 3. Scope — Fase 1 (MVP)

### En Scope
- [x] One-page HTML/CSS/JS estático
- [x] Sección Hero con Three.js
- [x] Sección Cases de Estudio (cards + carrusel destacados)
- [x] Sección Skills (carrusel cards apaisadas)
- [x] Sección Trabajo de Clientes (grid + tabs + modal split-scroll)
- [x] Sección Lab IA
- [x] Footer / Contacto
- [x] Navegación sticky con highlight por sección activa
- [x] Responsive (mobile-first)
- [x] Deploy GitHub Pages

### Fuera de Scope (v2+)
- [ ] CMS / headless content management
- [ ] Blog / artículos
- [ ] Formulario de contacto funcional (backend)
- [ ] Animaciones Three.js adicionales por sección
- [ ] Dark/Light mode toggle
- [ ] Multilingual (ES/EN)

---

## 4. Secciones Detalladas

### 4.1 HERO
**Objetivo:** Primera impresión impactante, establece tono visual y personalidad.

**Componentes:**
- Escena Three.js de fondo: geometría abstracta flotante con cel-shading, colores del sistema de diseño
- Texto de presentación con reveal animado (stagger de letras/líneas)
- Tagline corta: *"Diseño que comunica. Código que respira."*
- CTA scroll indicator animado
- Nombre y rol visible inmediatamente

**Comportamiento:**
- Parallax sutil con movimiento de mouse (mouse-tracking 3D)
- La geometría Three.js responde al scroll (shrink/fade out)
- Transición fluida al primer contenido de la página

**No hacer:** Texto de hero largísimo, múltiples CTAs, efectos distractores.

---

### 4.2 CASOS DE ESTUDIO (Destacados)
**Objetivo:** Mostrar los proyectos más ambiciosos con narrativa visual y de proceso.

**Componente "Destacado":**
- Container de ancho completo con imagen de fondo de alta calidad
- Overlay en color sólido de la paleta (sin transparencia excesiva) sobre la imagen, creando un efecto de color wash que integra la imagen al sistema
- Texto editorial: nombre del proyecto, categoría, descripción brief
- CTA: "Ver caso" → abre modal o navega a sección expandida

**Carrusel de Cases:**
- Desplazamiento horizontal drag-to-scroll o con botones
- Cards de proporción ~16:9 con imagen + info overlay en hover
- Transición: las cards no seleccionadas se reducen sutilmente (scale)
- Máximo 6 proyectos en carrusel inicial

**Proyectos candidatos (ordenados por impacto visual):**
1. Syzygy — sistema astral / generativo
2. AFK — gaming / plataforma
3. Kaktus — editorial mobile
4. Twitch Redesign — redesign conceptual
5. multiPiP — herramienta técnica
6. Card Tools / Backlog — productividad

**Vinculación con Skills:** Cada case study tiene tags que corresponden a categorías de la sección Skills. Clic en tag → scrollea a Skills y activa el filtro.

---

### 4.3 SKILLS / PERFIL TÉCNICO
**Objetivo:** Comunicar el perfil técnico completo de forma elegante, no una lista de íconos plana.

**Carrusel de Cards Apaisadas:**
- Cards horizontales (landscape ~320×180px en desktop), formato panorámico
- Cada card = una categoría de habilidad
- Scroll horizontal drag + botones de navegación
- Hover: elevación sutil + revelación de skill tags específicos

**Categorías propuestas:**

| Categoría | Skills Destacados | Color Accent |
|-----------|------------------|--------------|
| UX Research & Strategy | User interviews, Wireframing, Journey Mapping, Heurística | Azul profundo |
| UI Design | Design Systems, Figma, Responsive, Tipografía, Grillas | Terracota |
| Front-end Dev | HTML/CSS/JS, Three.js, GSAP, CSS Animations, GitHub | Verde salvia |
| Motion & Visual | Motion Graphics, Parallax, CSS Art, Generative | Lavanda |
| Content & SEO | Copywriting UX, SEO On-page, SEM básico, Analítica | Ocre |
| AI-Assisted Design | Prompting visual, CSS generativo, Workflows AI | Gris plateado |

**Vinculación con Grid:** Botón "Ver ejemplos" en cada card → scrollea al grid de trabajo y activa el tab correspondiente.

---

### 4.4 TRABAJO DE CLIENTES
**Objetivo:** Mostrar proyectos reales de clientes con contexto profesional y proceso.

**Grid con Tabs:**
- Tabs: `Todos` · `Web & WordPress` · `UX/UI` · `Motion` · `Lab`
- Grid de thumbnails: masonry o grid uniforme 2-3 columnas
- Hover: overlay con nombre + categoría + año
- Filtro con transición suave (fade + slide de items)

**Proyectos de clientes actuales:**
1. **Turismo Lickancoy** — WordPress, turismo, Atacama
2. **Infinito Ingeniería** — WordPress, corporativo, ingeniería

*(Se expandirá con nuevos proyectos)*

**Modal de Detalle — Split Canvas:**

```
┌─────────────────────────────────────────────────────┐
│  [X] cerrar                              [nav prev/next] │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│  SIDEBAR INFO        │   MASONRY GALLERY            │
│  (scroll indep.)     │   (scroll indep.)            │
│                      │                              │
│  · Nombre proyecto   │   [Imagen 1 - full width]   │
│  · Cliente           │   [Img 2] [Img 3]           │
│  · Año               │   [Imagen 4 - full width]   │
│  · Rol               │   [Img 5] [Img 6]           │
│  · Stack / Tools     │                              │
│  · Challenge         │                              │
│  · Solución          │                              │
│  · Resultado         │                              │
│  · Tags de skills    │                              │
│  · Link al sitio     │                              │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

**Comportamiento de scroll dual:**
- Sidebar: `overflow-y: auto` independiente
- Gallery: `overflow-y: auto` independiente
- Al llegar al fondo de cualquiera de las dos columnas con el cursor encima: la columna llega a su límite pero el scroll no pasa al body
- Solo cuando **ambas** columnas están en su fondo (o la sección continua aparece): el scroll del body se desbloquea y la siguiente sección comienza a deslizarse
- Implementación: interceptar `wheel` y `touch` events con lógica de estado

---

### 4.5 LAB IA
**Objetivo:** Honestidad y transparencia sobre la experimentación con IA generativa como herramienta.

**Diseño:**
- Sección con tono diferente: sutilmente más técnico/experimental
- Grid de cards simples (2-3 cols) con captura de pantalla del demo
- Badge visible "Creado con IA" en cada card
- Descripción breve del experimento y herramientas usadas
- Link al demo y al código

**Proyectos actuales:**
1. CSS AI-Driven v1 — Exploración de CSS generativo con instrucciones de IA
2. CSS AI-Driven v2 — Segunda iteración, WIP
3. Paprika — Anime E-Commerce, caso de estudio conceptual

**Mensaje editorial:** *"Estos proyectos son exploraciones de la IA como herramienta de diseño. El código y las decisiones de dirección son míos; la generación inicial, asistida por IA."*

---

### 4.6 CONTACTO / FOOTER
**Objetivo:** Cierre limpio con call to action claro.

**Componentes:**
- Email visible y copiable (no oculto en formulario)
- Links: GitHub, Twitter/X, LinkedIn (si aplica)
- Disponibilidad: badge de estado (disponible / ocupado)
- Copyright mínimo

---

## 5. Principios de Diseño

### 5.1 Sistema Visual
- **Filosofía:** Nórdico-minimalista con toques editoriales
- **Color:** Paleta oscura principal (casi negro, no negro puro), con 1-2 colores accent cálidos
- **Tipografía:** Serif editorial para headings, grotesque sans-serif para body/UI
- **Espacio:** Muy generoso. El espacio es parte del diseño, no el resultado de falta de contenido

### 5.2 Motion
- **Principio:** Cada animación tiene propósito funcional (guía la atención, da feedback, comunica estado)
- **Velocidades:** Lentas para revelaciones (600-800ms), rápidas para feedback (150-200ms)
- **Easing:** `cubic-bezier` personalizados, nunca `linear` para UI
- **No hacer:** Loops infinitos sin interacción del usuario, animaciones que retrasen la lectura de contenido

### 5.3 Three.js — Criterios de Uso
- Solo en hero, controlado, no distractor
- Estilo: cel-shading con outline, integrado al sistema de color del sitio
- Geometrías: abstractas, evitar realismo 3D que compita con fotografía de proyectos
- Rendimiento: siempre fallback CSS si WebGL no disponible

### 5.4 Accesibilidad Mínima
- Contraste AA en texto principal
- Focus states visibles
- Alt text en imágenes de proyectos
- `prefers-reduced-motion` respetado (desactiva animaciones pesadas)

---

## 6. Fases de Desarrollo

```
Fase 0: Documentación (actual)
  └── README, PRD, Design System, Architecture docs

Fase 1: Layout Base
  └── HTML semántico completo, CSS base sin animaciones, data estática

Fase 2: Animaciones Base
  └── Reveal on scroll, hover states, transiciones de sección

Fase 3: Componentes Interactivos
  └── Carrusel, tabs, modal split-scroll, filtro grid

Fase 4: Three.js & Motion Avanzado
  └── Escena hero, parallax GSAP, polish final

Fase 5: Content & Deploy
  └── Imágenes reales, copywriting final, GitHub Pages
```

---

## 7. Decisiones Pendientes / Preguntas Abiertas

- [ ] ¿Nombre/alias visible en hero? ¿"vandalit" o nombre real?
- [ ] ¿Tagline final aprobada?
- [ ] ¿Foto/avatar personal o mantener identidad gráfica abstracta?
- [ ] ¿Sección de servicios/precios o solo portafolio puro?
- [ ] ¿Blog o artículos en v1?
- [ ] ¿LinkedIn activo para linkear?
- [ ] ¿Colores accent: cuántos y cuáles son definitivos?
- [ ] Orden de casos de estudio: ¿criterio cronológico, impacto, o curado manualmente?

---

*Documento vivo — actualizar a medida que avanza el proyecto.*

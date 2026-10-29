# Portafolio vandalit: brief fase 2, skill set

**Repositorio:** `vandalit/portafolio`
**Depende de:** `arquitectura-despliegue.md` (fase 1). El skill set se renderiza en el build, no por JavaScript.
**Fuera de alcance:** schema JSON-LD, metaetiquetas, imágenes de vista previa, favicon, robots y estrategia GEO. Se trabajan en la fase 3.

---

## 1. Objetivo

Reemplazar las seis cards actuales de "Perfil Técnico" por siete cards de skill set, con nombres claros, niveles honestos, tres ejes de color que funcionan como filtros, y contenido renderizado en HTML.

La regla central es **no sobrevender**. Un ítem entra al listado solo si tiene evidencia (proyecto, caso, certificación o experiencia documentada) y su nivel está escrito en texto visible.

---

## 2. Encabezado y bajada

- **Título de sección:** Perfil técnico
- **Subtítulo actual** ("No una lista de íconos. Un mapa de capacidades reales, con sus conexiones."): se mantiene.
- **Titular del portafolio:** UX/UI Designer y Front-end Developer.
- **Bajada (copy propuesto, pendiente de aprobación):**
  > Egresado de Ingeniería en Fabricación y Diseño Industrial (UTFSM), titulación en trámite. En construcción hacia Product Design Engineer.

**No usar** "Product Engineer" ni "Product Design Engineer" como título. Aparecen solo en la bajada, como trayectoria.

---

## 3. Leyenda de ejes (filtros)

Tres ejes. Cada card tiene uno o dos, y responde a los filtros correspondientes.

| Eje | Dot | Nombre visible | Color |
|---|---|---|---|
| Autoral | Magenta | Autoral · multimedia y diseño | `#d4205a` (token existente) |
| Desarrollo | Verde | Desarrollo | `#ccf020` (token existente) |
| Comercial | Mango-rojizo | Comercial | Definir en tokens; verificar contraste WCAG AA sobre fondo oscuro |

**Reglas de color:**

- Card con un dot: color sólido en la línea superior y en la etiqueta.
- Card con dos dots: **gradiente lineal de izquierda a derecha**, en el orden de la leyenda (magenta → verde → mango-rojizo), aplicado a la línea superior y a la etiqueta.
- El gradiente es decoración. **No puede ser el único indicador:** la etiqueta de texto (UX, UI, Frontend, etc.) debe bastar por sí sola.
- Los filtros actúan por dot. Una card de dos dots aparece al activar cualquiera de sus dos filtros.

---

## 4. Cards

Orden fijo, pensado por empleabilidad y no solo por habilidad.

### Card 1: Diseño de producto
- **Dots:** Magenta
- **Nombre técnico:** UX/UI y diseño de producto
- **Descripción:** Investigación de usuarios, arquitectura de información, interfaces y sistemas de diseño. Diseño con formación en diseño industrial, aplicado a productos digitales y físicos. *(El término "digital y físico" va en la descripción, no en el título.)*
- **Ítems:**

| Ítem | Nivel | Estado |
|---|---|---|
| UX research y síntesis | Intermedio | Propuesta, por confirmar |
| Arquitectura de información | Intermedio | Propuesta, por confirmar |
| Figma, UI y design systems | Intermedio | Propuesta, por confirmar |
| Docencia UX/UI | Avanzado | Respaldo: Desafío Latam |

### Card 2: Desarrollo web y front-end
- **Dots:** Verde
- **Nombre técnico:** Desarrollo web y front-end
- **Descripción:** WordPress como base, con desarrollo a medida en Laravel y Angular, y front-end con HTML, CSS y JavaScript. Trabajo con CMS headless y React en formación.
- **Ítems:**

| Ítem | Nivel | Estado |
|---|---|---|
| WordPress (ecosistema Crocoblock) | Avanzado | Confirmado |
| Laravel | Avanzado | Confirmado: UBO Insight |
| Angular | Avanzado | Confirmado: UBO Insight |
| HTML, CSS y JavaScript | Avanzado | Propuesta, por confirmar |
| React | Intermedio | Confirmado, en proyecto de portafolio |
| CMS headless | Intermedio | Propuesta, por confirmar |

### Card 3: Marketing digital y contenido
- **Dots:** Mango-rojizo
- **Nombre técnico:** Estrategia de contenido, SEO y GEO
- **Descripción:** Contenido, SEO técnico y on-page, y campañas pagadas, con criterio comercial para pymes. Marketing con IA como puente hacia la enseñanza.
- **Ítems:**

| Ítem | Nivel | Estado |
|---|---|---|
| Estrategia de contenido | Intermedio | Respaldo: contenido para Vstone Propiedades e Infinito |
| SEO técnico y on-page | Intermedio | Respaldo: trabajo sobre el propio portafolio |
| Copywriting UX y storytelling | Intermedio | Respaldo: textos de casos y docencia |
| Marketing con IA | Intermedio | Propuesta, por confirmar |
| GEO (optimización para motores generativos) | Básico | En estudio |
| Campañas Meta y Google Ads (SEM) | Básico | Respaldo: campaña de Vstone; no mostrar resultados |
| Analítica (GA4) | Básico | En curso: certificación de Google Marketing |

**Importante:** la certificación de Google Marketing aparece como **"en curso"** hasta que esté obtenida. No se muestra como credencial terminada.

### Card 4: Diseño industrial, CAD y fabricación
- **Dots:** Magenta
- **Nombre técnico:** Ingeniería en Fabricación y Diseño Industrial
- **Descripción:** Formación en Ingeniería en Fabricación y Diseño Industrial (UTFSM). Modelado paramétrico, render de producto, prototipado y fabricación digital.
- **Ítems:**

| Ítem | Nivel | Estado |
|---|---|---|
| Autodesk Inventor | Avanzado | Confirmado |
| Fusion 360 | Avanzado | Confirmado |
| KeyShot | Avanzado | Confirmado |
| Rhinoceros | Básico | Confirmado |
| Creo Parametric | Básico | Confirmado |
| SketchUp, AutoCAD | Por confirmar | Pendiente |
| Impresión 3D FDM | Por confirmar | Pendiente |
| Arduino y microcomponentes | Por confirmar | Pendiente |
| Corte láser y CNC | Por confirmar | Pendiente |

**Nota de nombre:** Creo es el software de PTC, no el verbo. Escribirlo siempre como "Creo Parametric".

### Card 5: Interacción espacial
- **Dots:** Magenta + Verde
- **Nombre técnico:** XR y 3D web
- **Descripción:** Experimentos de interacción espacial, realidad extendida y 3D en el navegador. Área en formación, con estado honesto de cada pieza.
- **Ítems:**

| Ítem | Nivel | Estado |
|---|---|---|
| Three.js | Intermedio | Confirmado en lab |
| MediaPipe (gestos y seguimiento) | Intermedio | Propuesta, por confirmar |
| Experimentos XR y VR | En formación | Cada pieza indica su estado |
| 3D Gaussian Splatting | En formación | Prototipo en validación |

**Regla:** cada experimento muestra su estado (prototipo, demo, idea). Ninguno se presenta como producción.

### Card 6: IA aplicada y automatización
- **Dots:** Verde + Mango-rojizo
- **Nombre técnico:** Flujos generativos y automatización
- **Descripción:** Flujos con modelos de lenguaje y generación de imágenes, automatización con n8n, y pipelines de contenido. Orientado a pymes y emprendedores.
- **Ítems:**

| Ítem | Nivel | Estado |
|---|---|---|
| Midjourney y prompting visual | Avanzado | Confirmado |
| LLM con API y flujos de trabajo | Intermedio | Propuesta, por confirmar |
| n8n | Intermedio | Propuesta, por confirmar |
| ComfyUI y pipelines locales | Básico | En proceso |

### Card 7: Multimedia y audiovisual
- **Dots:** Magenta
- **Nombre técnico:** Producción audiovisual y 3D
- **Descripción:** Video, motion y 3D para proyectos autorales, eventos y productoras. Rama autoral en desarrollo.
- **Ítems:**

| Ítem | Nivel | Estado |
|---|---|---|
| Blender | Básico | Confirmado |
| Edición de video (DaVinci, Premiere, Vegas) | Por confirmar | Pendiente |
| Motion y 3D (Cinema 4D, Moho) | Por confirmar | Pendiente |
| TouchDesigner | Por confirmar | Pendiente |
| Línea autoral | En desarrollo | Etiqueta, no nivel |

---

## 5. Escala de niveles

Cuatro niveles, escritos en texto visible en cada ítem:

- **Básico:** se ha usado en proyectos, pero no sin consultar.
- **Intermedio:** se usa con autonomía en proyectos reales, sin dominio profundo.
- **Avanzado:** se ha usado en producción durante meses, resuelve problemas complejos y puede enseñarlo.
- **Experto:** reservado para lo que se enseña o dirige. Ninguno lo cumple hoy: no se usa.

Además, cada ítem puede llevar un **estado**: Confirmado, En proceso, En formación, En desarrollo o Pendiente de confirmar. Los ítems marcados "Pendiente" o "Por confirmar" **no se publican** hasta que el autor los valide.

---

## 6. Qué no debe aparecer

- Google Ads con resultados, A/B testing, Lottie, After Effects, Copilot, GA4 como credencial terminada.
- Design Systems y Component Libraries como capacidad entregada (en el repo solo hay un sistema en diseño).
- Cualquier cliente o proyecto de UBO Insight en las cards (es material de mindsurfer).
- "Product Engineer" o "Product Design Engineer" como título.

---

## 7. Requisitos de render y estructura

Estos puntos conectan con la fase 1 y son obligatorios:

- **Todo el contenido de las cards está en el HTML generado en el build.** Nombres de categoría, descripciones, ítems, niveles y estados. Ningún texto depende de `fetch` o de JavaScript.
- **El filtrado es mejora progresiva.** Con JavaScript deshabilitado, las siete cards se ven como lista completa.
- **Fuente de datos:** `content/skills/skills.json`. Una categoría por card, con el siguiente esquema mínimo:

```json
{
  "categories": [
    {
      "id": "diseno-producto",
      "order": 1,
      "title": "Diseño de producto",
      "technicalName": "UX/UI y diseño de producto",
      "description": "...",
      "dots": ["autoral"],
      "items": [
        { "name": "Figma, UI y design systems", "level": "intermedio", "state": "pendiente-confirmar" }
      ]
    }
  ],
  "legend": {
    "autoral": { "label": "Autoral · multimedia y diseño", "color": "#d4205a" },
    "desarrollo": { "label": "Desarrollo", "color": "#ccf020" },
    "comercial": { "label": "Comercial", "color": "por-definir" }
  }
}
```

- **Validación en el build (fase 1):** el build falla si una card no tiene dot, si un ítem no tiene nivel, o si un ítem en estado "pendiente-confirmar" aparece en la salida publicada.
- **Carrusel:** corregir el recorte de la card de Frontend, donde el texto "El código como" se corta, y la tercera card oculta en pantallas medianas. Las siete cards deben ser accesibles en todos los anchos, con scroll o con grid responsive.
- **Accesibilidad de color:** verificar contraste WCAG AA de los tres colores y del texto de etiqueta sobre el fondo de la card.

---

## 8. Criterios de aceptación

- [ ] Siete cards en el orden de la sección 4.
- [ ] Leyenda con tres dots y etiquetas exactas de la sección 3.
- [ ] Cards de dos dots con gradiente en el orden magenta → verde → mango-rojizo.
- [ ] Cada ítem muestra nivel y estado en texto visible.
- [ ] Ningún ítem "pendiente" o "por confirmar" aparece en la salida publicada.
- [ ] Creo aparece como "Creo Parametric", básico.
- [ ] Todo el contenido está en `dist/index.html` sin ejecutar JavaScript.
- [ ] Los filtros funcionan por dot y las cards de dos dots aparecen en ambos filtros.
- [ ] Las siete cards se ven completas en escritorio, tablet y móvil, sin texto cortado.
- [ ] Los tres colores pasan contraste WCAG AA sobre el fondo de las cards.

---

## 9. Pendientes que confirma el autor antes de publicar

1. Niveles marcados como "Propuesta, por confirmar".
2. Ítems "Pendiente" en cards 4 y 7.
3. Color hexadecimal del mango-rojizo.
4. Copy de la bajada del titular.

Hasta que estén confirmados, el agente implementa la estructura completa, pero marca esos ítems como borrador y no los publica.

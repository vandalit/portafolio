# Sesión de Corrección: Tríada de Bugs de Calibración

**Fecha:** 30 de Octubre de 2026  
**Rama:** `main`  
**Objetivo:** Resolver y calibrar de forma integral tres bugs reportados en el flujo de contenido, frontend y backoffice:
1. **Redundancia del Caso Destacado (Featured) en Casos de Estudio**
2. **Reconexión y Calibración de Cards de Skills en el Backoffice (CMS)**
3. **Badges de DEMO y CÓDIGO en Cards Comprimidas de Lab**

---

## 1. BUG 1: Redundancia del Caso Destacado en Case Studies

### Diagnóstico
- **Ubicación:** Sección `Casos de Estudio` (`#cases`).
- **Archivos:** `build/build.js` y `src/js/main.js` (`renderFeatured` y `renderCaseCards`).
- **Problema:** El banner superior (`#featured-case`) destaca el proyecto con `featured: true` (por defecto *Syzygy*). Sin embargo, `renderCaseCards(cases)` itera sobre toda la lista de casos sin excluir el destacado. Esto provoca que el mismo caso aparezca duplicado: una vez en el banner panorámico y de inmediato como primera tarjeta en el carrusel inferior.
- **Solución Técnica:**
  - En `renderCaseCards(cases)`:
    ```js
    const featured = cases.find(c => c.featured) || cases[0];
    const carouselCases = featured ? cases.filter(c => (c.id || c._id) !== (featured.id || featured._id)) : cases;
    // Renderizar carouselCases
    ```
  - Aplicar la misma exclusión tanto en el ensamblador estático `build/build.js` como en la hidratación cliente `src/js/main.js`.

---

## 2. BUG 2: Reconexión de Cards de Skills en el Backoffice (CMS)

### Diagnóstico
- **Ubicación:** Backoffice (`backoffice/backoffice.js` y `backoffice/index.html`).
- **Archivo de datos:** `content/skills/skills.json`.
- **Problema:**
  1. **Schema Mismatch (Objeto vs Array):** `skills.json` tiene la estructura `{ "legend": {...}, "categories": [...] }`. El Backoffice en `init()` asignaba `state.data['skills'] = rawData.skills || []`. Al recibir un objeto en lugar de un array, `state.data['skills'].length` resultaba `undefined`, y al pulsar la pestaña de Skills, `list.forEach()` provocaba una excepción `TypeError` bloqueando la renderización de la lista.
  2. **Campos desalineados:** El formulario del Backoffice buscaba propiedades antiguas (`category`, `filterTag`, `accentColor`, `skills: ['...']`), mientras que `skills.json` utiliza `technicalName`, `dots: ['autoral' | 'desarrollo' | 'comercial']`, `workTab` e `items: [{ name, level, state }]`.
- **Solución Técnica:**
  - En `backoffice/backoffice.js`:
    - Extraer `state.data['skills'] = rawData.skills.categories || []` y preservar `state.skillsLegend = rawData.skills.legend || {}`.
    - Adaptar `populateSkillForm()` y `saveActiveSkillValues()` a los campos reales (`technicalName`, `workTab`, `dots`, `items`).
    - Al guardar a disco, backend Express (`/api/skills`) o `localStorage`, reconstruir el objeto completo `{ legend: state.skillsLegend, categories: state.data['skills'] }`.

---

## 3. BUG 3: Badges de DEMO y CÓDIGO en Cards Comprimidas de Lab

### Diagnóstico
- **Ubicación:** Carrusel de experimentos Lab (`#lab-track`).
- **Archivos:** `src/js/main.js`, `build/build.js`, `content/lab/*/project.json` y `backoffice/backoffice.js`.
- **Problema:**
  1. **Discrepancia `live` vs `demo`:** El Backoffice guardaba el enlace como `links.live`, pero el frontend (`main.js` y `build.js`) consultaba estrictamente `l.links?.demo`. Por ello, experimentos con URL activa (como `cssdriven-v1`) no mostraban el botón "DEMO".
  2. **Campos incompletos en mockups:** Varios mockups de lab no tenían poblado ni estandarizado el objeto `links`, provocando comportamientos inconsistentes o botones faltantes.
  3. **Condicional estricto:** El botón DEMO y CÓDIGO deben mostrarse **única y exclusivamente si existe una URL válida poblada**, sin quedar hardcodeados ni ausentes cuando sí hay enlace.
- **Solución Técnica:**
  - En `main.js` y `build.js`:
    ```js
    const demoUrl = l.links?.demo || l.links?.live || null;
    const codeUrl = l.links?.github || null;
    const demoBtn = demoUrl ? `<a href="${escapeHtml(demoUrl)}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>` : '';
    const codeBtn = codeUrl ? `<a href="${escapeHtml(codeUrl)}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>` : '';
    ```
  - En `backoffice/backoffice.js`:
    - Al leer el formulario: `el.fieldLive.value = project.links?.demo || project.links?.live || ''`.
    - Al guardar: sincronizar bidireccionalmente `links.live` y `links.demo` con el valor del input.
  - En `content/lab/`: estandarizar `project.json` de los 9 experimentos con sus enlaces reales a código y demo si corresponde.

---

## 4. Plan de Ejecución

1. **Paso 1:** Aplicar corrección del BUG 1 en `build/build.js` y `src/js/main.js` para eliminar la redundancia de caso destacado.
2. **Paso 2:** Aplicar corrección del BUG 3 en `build/build.js`, `src/js/main.js`, `backoffice/backoffice.js` y normalizar `content/lab/*/project.json`.
3. **Paso 3:** Aplicar corrección del BUG 2 en `backoffice/backoffice.js` y `backoffice/index.html` para reconectar el CMS de Skills con el esquema moderno `{ legend, categories }`.
4. **Paso 4:** Ejecutar `npm run build` y verificar en `dist/index.html` que no haya redundancias y que las cards y badges se rendericen con total exactitud.
5. **Paso 5:** Commit local de las correcciones.

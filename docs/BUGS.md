# Registro de Bugs y Tareas Pendientes (Backlog de Calibración)

**Fecha de creación:** Octubre 2026  
**Propósito:** Registrar incidentes visuales, inconsistencias y mejoras detectadas para abordarlas en sesiones de calibración dedicadas sin fragmentar el contexto activo.

---

## 1. Bugs Visuales y Redundancias

### BUG-001: Redundancia del Caso Destacado en el Carrusel de Casos
* **Ubicación:** Sección `Casos de Estudio` (`#cases`).
* **Archivo(s) involucrado(s):**
  * `src/js/main.js` (`renderCaseCards` y `renderFeatured`).
  * `build/build.js` (`renderCaseCards` y `renderFeatured`).
* **Descripción del problema:**
  El banner superior (`#featured-case`) renderiza el proyecto marcado con `featured: true` (o el primero de la lista, en este caso *Syzygy*). Simultáneamente, la función `renderCaseCards(cases)` itera sobre el arreglo completo sin filtrar el elemento ya destacado, provocando que *Syzygy* aparezca dos veces seguidas en pantalla (en el banner panorámico y como la primera tarjeta del carrusel inmediatamente abajo).
* **Solución acordada (Opción 1 - Exclusión Directa):**
  * Filtrar el arreglo de tarjetas para el carrusel excluyendo el ID del caso destacado:
    ```js
    const featured = cases.find(c => c.featured) || cases[0];
    const carouselCases = cases.filter(c => c.id !== featured.id);
    // Renderizar carouselCases en #cases-carousel
    ```
  * Aplicar la misma lógica en `build/build.js` para mantener la sincronía del pre-renderizado SSG estático.
* **Estado:** Pendiente para próxima sesión.

### BUG-002: El fondo de video del Hero dejó de inicializarse
* **Ubicación:** Fondo ambiental del Hero.
* **Archivo(s) involucrado(s):**
  * `src/js/main.js` (inicialización diferida tras el preloader).
  * `src/js/video-bg.js` (registro del evento `window.load` e inyección de iframes).
  * `content/settings/hero.json` (IDs de video).
* **Descripción del problema:**
  El fondo de video dejó de aparecer tras la iteración de rendimiento/preloader del 29 de octubre de 2026 (`27ca911`). `main.js` difiere `initVideoBackground()` hasta después de cargar contenido, montar componentes y retirar el preloader; luego `video-bg.js` espera `window.load` para insertar los iframes. Si `load` ya ocurrió, el listener queda esperando un evento que no volverá a dispararse y ningún iframe se inserta.
* **Diagnóstico:**
  Los IDs anteriores (`Hse_HTX6KGs` y `GKq9nKZpmu0`) respondieron correctamente en las consultas de oEmbed y del endpoint embed el 3 de noviembre de 2026. Esto descarta que los enlaces estén simplemente muertos, pero no confirma reproducción en navegador ni descarta restricciones de embed/autoplay. La carrera con `window.load` es la causa probable observada en el flujo.
* **Estado actual / siguiente paso:**
  Los campos `videos.stage1Id` y `videos.stage2Id` quedan vacíos intencionalmente y el reproductor no inserta iframes mientras ambos estén vacíos. Al reactivar videos, corregir el inicio diferido para ejecutar la carga inmediatamente si `document.readyState === 'complete'` (o esperar `load` solo si aún no ocurrió) y validar reproducción real en navegador.

---

## 2. Mejoras de Arquitectura y Refactors Agendados

### TSK-001: Tokens Semánticos de Jerarquía Tipográfica
* **Documentación de referencia:** [docs/INSIGHTS_DESIGN_TOKENS.md](file:///home/vandalit/work/vandalit/portafolio/docs/INSIGHTS_DESIGN_TOKENS.md).
* **Objetivo:** Desacoplar `font-weight`, `line-height` y `letter-spacing` de los selectores de componentes hacia variables semánticas en `src/css/base.css` (`--section-title-weight`, `--card-title-weight`, etc.).
* **Estado:** Agendado para refactor futuro.

### TSK-002: Texturas multimedia sobre geometrías del Hero
* **Ubicación:** Escena Three.js del Hero (`src/js/three-scene.js`).
* **Objetivo:** Evaluar imágenes y video en las superficies del Hero manteniendo el cel-shading. Three.js ya incluye `VideoTexture`; no asumir una dependencia adicional antes de probarlo.
* **Biblioteca modular implementada:** `content/geometry-textures/index.json` define cuatro imágenes compartidas desde `content/geometry-textures/assets/`, resolución de GPU (512 px), escala de grises, brillo, contraste y capa oscura. El backoffice permite editar estos parámetros y el pool, cargar imágenes en local, guardar el manifiesto y exportarlo.
* **Asignación:** El pool se reparte de forma pseudoaleatoria y determinista por geometría/cara, para mantener el resultado estable entre cargas. Las texturas se procesan una vez al cargar, se comparten entre caras y renderers, y usan `MeshToonMaterial` para conservar el cel-shading y los contornos.
* **Costo estimado, no perfilado:** Cuatro superficies de 512 × 512 consumen 4 MiB de memoria base por contexto WebGL, o aproximadamente 5.3 MiB con mipmaps. Con los dos renderers del Hero, el estimado agregado es ~10.7 MiB de GPU. Las imágenes originales ocupan unos 4.3 MB en disco; no se crea una copia por cara. El costo real depende del navegador y la GPU; queda pendiente medir FPS/frame time y memoria en dispositivos.
* **Siguiente iteración:** Evaluar `VideoTexture` por separado y medir el costo de decodificación antes de sumar video a las caras.
* **Estado:** Biblioteca, procesamiento oscuro monocromático y asignación a todas las caras implementados; perfilado y prueba de video pendientes.

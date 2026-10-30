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

---

## 2. Mejoras de Arquitectura y Refactors Agendados

### TSK-001: Tokens Semánticos de Jerarquía Tipográfica
* **Documentación de referencia:** [docs/INSIGHTS_DESIGN_TOKENS.md](file:///home/vandalit/work/vandalit/portafolio/docs/INSIGHTS_DESIGN_TOKENS.md).
* **Objetivo:** Desacoplar `font-weight`, `line-height` y `letter-spacing` de los selectores de componentes hacia variables semánticas en `src/css/base.css` (`--section-title-weight`, `--card-title-weight`, etc.).
* **Estado:** Agendado para refactor futuro.


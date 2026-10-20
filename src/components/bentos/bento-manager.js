/* ==========================================================
   BENTO-MANAGER.JS — Orquestador de Componentes Bento
   Gestiona el registro, montaje en DOM y scroll de los marcos Bento
   Capa 2 Dinámica (Rango z-index: 10 a 19)
   ========================================================== */

import { bentoCard1 } from './bento-card-1/bento-card-1.js';

class BentoManager {
  constructor() {
    this.bentos = [bentoCard1]; // Registro ampliable a futuro: [bentoCard1, bentoCard2, ...]
    this.mountedElements = new Map();
    this.container = null;
  }

  /**
   * Monta todos los bentos registrados dentro del contenedor dinámico
   * @param {HTMLElement} containerEl - Contenedor con z-index: 12
   */
  mount(containerEl) {
    if (!containerEl) {
      console.warn('[BentoManager] No se encontró el contenedor de bentos');
      return;
    }
    this.container = containerEl;
    this.container.innerHTML = ''; // Limpiar previo

    this.bentos.forEach((bento) => {
      const domEl = bento.render();
      if (bento.zIndex) {
        domEl.style.zIndex = bento.zIndex;
      }
      this.container.appendChild(domEl);
      this.mountedElements.set(bento.id, { def: bento, el: domEl });
    });

    console.log(`[BentoManager] ${this.bentos.length} Bento(s) montado(s) exitosamente.`);
  }

  /**
   * Actualiza los bentos según la posición de scroll
   * @param {number} progress - Progreso normalizado de 0 a 1
   * @param {number} scrolledPx - Pixels scrolleados
   */
  updateScroll(progress, scrolledPx) {
    this.mountedElements.forEach(({ def, el }) => {
      if (typeof def.updateScroll === 'function') {
        def.updateScroll(el, progress, scrolledPx);
      }
    });
  }
}

export const bentoManager = new BentoManager();

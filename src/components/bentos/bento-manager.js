/* ==========================================================
   BENTO-MANAGER.JS — Orquestador de Componentes Bento
   Gestiona el registro, montaje en DOM y scroll de los 12 marcos Bento
   Capa 2 Dinámica (Rango z-index: 10 a 19)
   ========================================================== */

import { bentoCard1 } from './bento-card-1/bento-card-1.js';
import { bentoCard2 } from './bento-card-2/bento-card-2.js';
import { bentoCard3 } from './bento-card-3/bento-card-3.js';
import { bentoCard4 } from './bento-card-4/bento-card-4.js';
import { bentoCard5 } from './bento-card-5/bento-card-5.js';
import { bentoCard6 } from './bento-card-6/bento-card-6.js';
import { bentoCard7 } from './bento-card-7/bento-card-7.js';
import { bentoCard8 } from './bento-card-8/bento-card-8.js';
import { bentoCard9 } from './bento-card-9/bento-card-9.js';
import { bentoCard10 } from './bento-card-10/bento-card-10.js';
import { bentoCard11 } from './bento-card-11/bento-card-11.js';
import { bentoCard12 } from './bento-card-12/bento-card-12.js';

class BentoManager {
  constructor() {
    this.bentos = [
      bentoCard1,
      bentoCard2,
      bentoCard3,
      bentoCard4,
      bentoCard5,
      bentoCard6,
      bentoCard7,
      bentoCard8,
      bentoCard9,
      bentoCard10,
      bentoCard11,
      bentoCard12
    ];
    this.mountedElements = new Map();
    this.container = null;
  }

  /**
   * Monta todos los bentos registrados dentro del contenedor dinámico
   * @param {HTMLElement} containerEl - Contenedor en Capa 2
   */
  mount(containerEl) {
    if (!containerEl) {
      console.warn('[BentoManager] No se encontró el contenedor de bentos');
      return;
    }
    this.container = containerEl;
    this.container.innerHTML = '';

    this.bentos.forEach((bento) => {
      const domEl = bento.render();
      if (bento.zIndex) {
        domEl.style.zIndex = bento.zIndex;
      }
      this.container.appendChild(domEl);
      this.mountedElements.set(bento.id, { def: bento, el: domEl });
    });

    console.log(`[BentoManager] ${this.bentos.length} Bento interfaces montadas exitosamente.`);
  }

  /**
   * Actualiza los bentos según la posición de scroll en el stage
   * @param {number} progress - Progreso normalizado de 0 a 1
   * @param {number} scrolledPx - Pixels scrolleados (0 a 600px)
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

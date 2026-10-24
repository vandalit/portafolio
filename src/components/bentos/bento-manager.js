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
   * Carga configuración de bentos desde hero.json o localStorage
   */
  async loadHeroConfig() {
    try {
      const local = localStorage.getItem('vandalit_hero_override');
      if (local) {
        return JSON.parse(local);
      }
      const res = await fetch('./content/settings/hero.json');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[BentoManager] Could not load hero.json, using static defaults:', e);
    }
    return null;
  }

  /**
   * Monta todos los bentos registrados dentro del contenedor dinámico y el HUD frontal
   * @param {HTMLElement} containerEl - Contenedor en Capa 2
   */
  async mount(containerEl) {
    if (!containerEl) {
      console.warn('[BentoManager] No se encontró el contenedor de bentos');
      return;
    }
    this.container = containerEl;
    this.container.innerHTML = '';

    // Cargar y aplicar configuración dinámica
    const heroConfig = await this.loadHeroConfig();
    if (heroConfig && Array.isArray(heroConfig.bentos)) {
      this.bentos.forEach((bento) => {
        const conf = heroConfig.bentos.find(b => b.id === bento.id);
        if (conf) {
          bento.workTitle = conf.workTitle || bento.workTitle;
          bento.workMeta = conf.workMeta || bento.workMeta;
          bento.targetAnchor = conf.targetAnchor || bento.targetAnchor;
          bento.accentColor = conf.accentColor || bento.accentColor;
          bento.calloutDir = conf.calloutDir || bento.calloutDir;

          if (conf.mediaSrc && conf.mediaSrc.trim().length > 0) {
            if (conf.mediaType === 'video') {
              bento.renderContent = () => `
                <div class="bento-video-wrapper">
                  <video 
                    class="bento-video-element"
                    src="${conf.mediaSrc}"
                    ${conf.poster ? `poster="${conf.poster}"` : ''}
                    autoplay loop muted playsinline webkit-playsinline
                    disablepictureinpicture preload="metadata"
                    aria-hidden="true"
                    oncanplay="this.defaultMuted=true; this.muted=true; this.play().catch(()=>{});">
                  </video>
                </div>
              `;
            } else {
              bento.renderContent = () => `
                <img class="bento-image-fill" src="${conf.mediaSrc}" alt="${bento.workTitle}" loading="lazy">
              `;
            }
          }
        }
      });
    }

    const hudContainer = document.getElementById('hero-hud-container');
    if (hudContainer) {
      hudContainer.innerHTML = '';
    }

    this.bentos.forEach((bento) => {
      const { bentoEl, hudEl } = typeof bento.renderPair === 'function'
        ? bento.renderPair()
        : { bentoEl: bento.render(), hudEl: null };

      if (bento.zIndex) {
        bentoEl.style.zIndex = bento.zIndex;
      }
      this.container.appendChild(bentoEl);

      if (hudContainer && hudEl) {
        hudContainer.appendChild(hudEl);
      }

      this.mountedElements.set(bento.id, { def: bento, el: bentoEl, hudEl });
    });

    console.log(`[BentoManager] ${this.bentos.length} Bento & HUD interfaces montadas exitosamente.`);
  }

  /**
   * Actualiza los bentos y sus HUDs según la posición de scroll en el stage
   * @param {number} progress - Progreso normalizado de 0 a 1
   * @param {number} scrolledPx - Pixels scrolleados (0 a 600px)
   */
  updateScroll(progress, scrolledPx) {
    this.mountedElements.forEach(({ def, el, hudEl }) => {
      if (typeof def.updateScroll === 'function') {
        def.updateScroll(el, progress, scrolledPx, hudEl);
      }
    });
  }
}

export const bentoManager = new BentoManager();

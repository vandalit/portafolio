/* ==========================================================
   BENTO-BASE.JS — Factory Base para Componentes Bento
   Físicas 2D, barrido sin opacidad y render de color plano
   ========================================================== */

import { BENTO_TOKENS } from './bento-tokens.js';

export function createBentoCard({ id, name, ratio, zIndex, startPx, endPx }) {
  return {
    id,
    name,
    ratio,
    zIndex,
    startPx,
    endPx,

    render() {
      const el = document.createElement('div');
      el.id = this.id;
      el.className = 'bento-frame';
      el.setAttribute('data-bento-id', this.id.replace('bento-card-', ''));
      el.setAttribute('aria-label', `${this.name} (${this.ratio})`);

      const num = String(this.id.replace('bento-card-', '')).padStart(2, '0');
      
      // Lógica limpia y modular: verificamos si el bento tiene contenido
      let contentHtml = '';
      if (typeof this.renderContent === 'function') {
        contentHtml = this.renderContent();
      } else if (typeof this.renderInner === 'function') {
        contentHtml = this.renderInner();
      } else if (typeof this.content === 'string') {
        contentHtml = this.content;
      }

      const hasContent = Boolean(contentHtml && contentHtml.trim().length > 0);

      // Solo mostramos el número en las tarjetas vacías pendientes de contenido
      const numHtml = hasContent ? '' : `<span class="bento-card__num">${num}</span>`;

      el.innerHTML = `
        <article class="bento-card-flat ${hasContent ? 'bento-card-flat--populated' : 'bento-card-flat--empty'}">
          ${numHtml}
          ${hasContent ? `<div class="bento-card__content">${contentHtml}</div>` : ''}
        </article>
      `;
      return el;
    },

    updateScroll(el, progress, scrolledPx) {
      if (!el) return;

      if (scrolledPx < this.startPx) {
        el.style.transform = `translate(-50%, -50%) translateY(${BENTO_TOKENS.physics.sweepDistanceVh}vh) scale(var(--bento-scale))`;
        return;
      }

      if (scrolledPx >= this.endPx) {
        el.style.transform = 'translate(-50%, -50%) translateY(0) scale(var(--bento-scale))';
        return;
      }

      // Curva de aceleración 2D sin opacidad
      const p = (scrolledPx - this.startPx) / (this.endPx - this.startPx);
      const easeOut = 1 - Math.pow(1 - p, BENTO_TOKENS.physics.easingPower);
      const yOffset = (1 - easeOut) * BENTO_TOKENS.physics.sweepDistanceVh;

      el.style.transform = `translate(-50%, -50%) translateY(${yOffset.toFixed(1)}vh) scale(var(--bento-scale))`;
    }
  };
}

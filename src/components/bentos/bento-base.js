/* ==========================================================
   BENTO-BASE.JS — Factory Base para Componentes Bento
   Físicas 2D, barrido sin opacidad y render de color plano
   ========================================================== */

import { BENTO_TOKENS } from './bento-tokens.js';

export function createBentoCard({
  id,
  name,
  ratio,
  zIndex,
  startPx,
  endPx,
  workTitle,
  workMeta,
  targetAnchor,
  calloutDir = 'left',
  accentColor = '#ccf020'
}) {
  return {
    id,
    name,
    ratio,
    zIndex,
    startPx,
    endPx,
    workTitle: workTitle || name,
    workMeta: workMeta || '',
    targetAnchor: targetAnchor || '',
    calloutDir,
    accentColor,

    renderPair() {
      const num = String(this.id.replace('bento-card-', '')).padStart(2, '0');
      const hudId = `bento-hud-${parseInt(num, 10)}`;

      // ── 1. ELEMENTO BENTO EN CAPA 2 (z-index: 12) ──
      const bentoEl = document.createElement('div');
      bentoEl.id = this.id;
      bentoEl.className = 'bento-frame';
      bentoEl.setAttribute('data-bento-id', num);
      bentoEl.setAttribute('aria-label', `${this.name} (${this.ratio}): ${this.workTitle}`);
      bentoEl.style.setProperty('--bento-accent', this.accentColor);

      // Verificamos si el bento tiene contenido
      let contentHtml = '';
      if (typeof this.renderContent === 'function') {
        contentHtml = this.renderContent();
      } else if (typeof this.renderInner === 'function') {
        contentHtml = this.renderInner();
      } else if (typeof this.content === 'string') {
        contentHtml = this.content;
      }

      const hasContent = Boolean(contentHtml && contentHtml.trim().length > 0);
      const numHtml = hasContent ? '' : `<span class="bento-card__num">${num}</span>`;

      bentoEl.innerHTML = `
        <!-- Base de trazo audaz posterior: crece desde el centro en Yellow-Green sin fade -->
        <div class="bento-hover-stroke" aria-hidden="true"></div>

        <!-- Tarjeta Bento frontal: su sombra profunda cae directamente sobre la base -->
        <article class="bento-card-flat ${hasContent ? 'bento-card-flat--populated' : 'bento-card-flat--empty'}">
          ${numHtml}
          ${hasContent ? `<div class="bento-card__content">${contentHtml}</div>` : ''}
        </article>
      `;

      // ── 2. ELEMENTO HUD EN CAPA 5 (z-index: 30) ──
      const hudEl = document.createElement('div');
      hudEl.id = hudId;
      hudEl.className = `bento-hud-frame bento-hud-frame--${this.calloutDir}`;
      hudEl.setAttribute('data-hud-id', num);
      hudEl.style.setProperty('--bento-accent', this.accentColor);

      const isCalloutLeft = this.calloutDir === 'left';
      const arrowSvg = isCalloutLeft ? `
        <svg class="bento-callout-svg" viewBox="0 0 190 14" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <line x1="0" y1="7" x2="176" y2="7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="bento-callout-stem" />
          <polygon points="174,3 186,7 174,11" fill="currentColor" class="bento-callout-head" />
        </svg>
      ` : `
        <svg class="bento-callout-svg" viewBox="0 0 190 14" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <polygon points="12,3 0,7 12,11" fill="currentColor" class="bento-callout-head" />
          <line x1="10" y1="7" x2="190" y2="7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="bento-callout-stem" />
        </svg>
      `;

      hudEl.innerHTML = `
        <!-- Zona activa de interacción en el frente de todo (z-index: 31) -->
        <div class="bento-hud-trigger" role="link" tabindex="0" aria-label="${this.name}: ${this.workTitle}"></div>

        <!-- Widget Callout Flotante HUD (z-index: 32) -->
        <div class="bento-hover-callout" aria-hidden="true">
          <span class="bento-callout-title">${this.workTitle}</span>
          <div class="bento-callout-line-wrap">
            ${arrowSvg}
          </div>
          <span class="bento-callout-meta">${this.workMeta}</span>
        </div>
      `;

      // ── 3. SINCRONIZACIÓN BIDIRECCIONAL & CLICK NAVIGATION ──
      const setActive = (active) => {
        bentoEl.classList.toggle('is-hovered', active);
        hudEl.classList.toggle('is-hovered', active);
      };

      const trigger = hudEl.querySelector('.bento-hud-trigger');
      if (trigger) {
        trigger.addEventListener('mouseenter', () => setActive(true));
        trigger.addEventListener('mouseleave', () => setActive(false));
      }

      bentoEl.addEventListener('mouseenter', () => setActive(true));
      bentoEl.addEventListener('mouseleave', () => setActive(false));

      if (this.targetAnchor) {
        const navigate = (e) => {
          e.preventDefault();
          const target = document.querySelector(this.targetAnchor);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            try {
              history.pushState(null, '', this.targetAnchor);
            } catch (_) {}
          }
        };

        if (trigger) {
          trigger.addEventListener('click', navigate);
          trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate(e);
          });
        }
        bentoEl.addEventListener('click', navigate);
      }

      return { bentoEl, hudEl };
    },

    render() {
      const { bentoEl } = this.renderPair();
      return bentoEl;
    },

    updateScroll(bentoEl, progress, scrolledPx, hudEl) {
      if (!bentoEl) return;

      let transformStr = '';
      if (scrolledPx < this.startPx) {
        transformStr = `translate(-50%, -50%) translateY(${BENTO_TOKENS.physics.sweepDistanceVh}vh) scale(var(--bento-scale))`;
      } else if (scrolledPx >= this.endPx) {
        transformStr = 'translate(-50%, -50%) translateY(0) scale(var(--bento-scale))';
      } else {
        // Curva de aceleración 2D sin opacidad
        const p = (scrolledPx - this.startPx) / (this.endPx - this.startPx);
        const easeOut = 1 - Math.pow(1 - p, BENTO_TOKENS.physics.easingPower);
        const yOffset = (1 - easeOut) * BENTO_TOKENS.physics.sweepDistanceVh;
        transformStr = `translate(-50%, -50%) translateY(${yOffset.toFixed(1)}vh) scale(var(--bento-scale))`;
      }

      bentoEl.style.transform = transformStr;
      if (hudEl) {
        hudEl.style.transform = transformStr;
      }
    }
  };
}

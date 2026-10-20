/* ==========================================================
   BENTO-CARD-2.JS — Componente Modular Bento #2
   Ratio 16:9 (Desktop Widescreen)
   Color plano, sin fade, barrido 2D desde bottom
   ========================================================== */

export const bentoCard2 = {
  id: 'bento-card-2',
  name: 'Bento #02',
  ratio: '16:9',
  zIndex: 13,      // Capa 2 Dinámica (Sandwich)
  startPx: 340,    // Comienza a subir a los 340px
  endPx: 460,      // Ocupa su posición a los 460px

  render() {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'bento-frame';
    el.setAttribute('data-bento-id', '2');
    el.setAttribute('aria-label', `${this.name} (${this.ratio})`);

    el.innerHTML = `
      <article class="bento-card-flat">
        <header class="bento-card__meta">
          <span class="bento-card__id">${this.name}</span>
          <span class="bento-card__ratio">${this.ratio}</span>
        </header>
        <div class="bento-card__body-placeholder">
          <span class="bento-card__indicator"></span>
        </div>
      </article>
    `;

    return el;
  },

  updateScroll(el, progress, scrolledPx) {
    if (!el) return;

    if (scrolledPx < this.startPx) {
      el.style.transform = 'translate(-50%, -50%) translateY(115vh)';
      return;
    }

    if (scrolledPx >= this.endPx) {
      el.style.transform = 'translate(-50%, -50%) translateY(0)';
      return;
    }

    const p = (scrolledPx - this.startPx) / (this.endPx - this.startPx);
    const easeOut = 1 - Math.pow(1 - p, 3);
    const yOffset = (1 - easeOut) * 115;

    el.style.transform = `translate(-50%, -50%) translateY(${yOffset.toFixed(1)}vh)`;
  }
};

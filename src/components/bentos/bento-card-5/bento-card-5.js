/* ==========================================================
   BENTO-CARD-5.JS — Componente Modular Bento #5
   Ratio 4:3 (Tablet / iPad Display)
   Color plano, sin fade, barrido 2D desde bottom
   ========================================================== */

export const bentoCard5 = {
  id: 'bento-card-5',
  name: 'Bento #05',
  ratio: '4:3',
  zIndex: 13,      // Capa 2 Dinámica (Sandwich)
  startPx: 460,    // Comienza a subir a los 460px
  endPx: 560,      // Ocupa su posición a los 560px

  render() {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'bento-frame';
    el.setAttribute('data-bento-id', '5');
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

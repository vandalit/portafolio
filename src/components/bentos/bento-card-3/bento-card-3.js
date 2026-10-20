/* ==========================================================
   BENTO-CARD-3.JS — Componente Modular Bento #3
   Ratio 1:1 (Instagram Post Square)
   Color plano, sin fade, barrido 2D desde bottom
   ========================================================== */

export const bentoCard3 = {
  id: 'bento-card-3',
  name: 'Bento #03',
  ratio: '1:1',
  zIndex: 12,      // Capa 2 Dinámica (Sandwich)
  startPx: 380,    // Comienza a subir a los 380px
  endPx: 490,      // Ocupa su posición a los 490px

  render() {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'bento-frame';
    el.setAttribute('data-bento-id', '3');
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

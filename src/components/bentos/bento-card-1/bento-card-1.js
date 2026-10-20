/* ==========================================================
   BENTO-CARD-1.JS — Componente Modular Bento #1
   Ratio 9:16 | Micro-experiencia UX/UI & WebGL
   ========================================================== */

export const bentoCard1 = {
  id: 'bento-card-1',
  zIndex: 12, // Rango de la Capa 2 Dinámica (Sandwich)

  render() {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'bento-frame';
    el.setAttribute('aria-label', 'Destacado: Metamedia Lab & Creative Tech');
    el.setAttribute('data-bento-id', '1');

    el.innerHTML = `
      <article class="bento-card">
        <!-- Header -->
        <header class="bento-card__header">
          <span class="bento-card__badge">
            <span class="bento-card__badge-pulse"></span>
            Metamedia Lab
          </span>
          <span class="bento-card__index">01 / 01</span>
        </header>

        <!-- Visual Core with SVG Hologram -->
        <div class="bento-card__visual">
          <svg class="bento-card__visual-graphic" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" stroke="#e8306e" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
            <polygon points="40,12 66,56 14,56" stroke="#b8e030" stroke-width="2" fill="rgba(184,224,48,0.12)"/>
            <circle cx="40" cy="42" r="10" fill="#e8306e" opacity="0.85"/>
            <line x1="20" y1="40" x2="60" y2="40" stroke="#ffffff" stroke-width="1" opacity="0.5"/>
          </svg>
          <span class="bento-card__visual-tag">Generative 3D Canvas</span>
        </div>

        <!-- Footer / Typography -->
        <footer class="bento-card__footer">
          <h3 class="bento-card__title">Creative Engineering</h3>
          <p class="bento-card__desc">Intersección entre arquitectura de diseño y tecnología interactiva.</p>
          <div class="bento-card__tags">
            <span class="bento-card__pill">Three.js</span>
            <span class="bento-card__pill">UI/UX</span>
            <span class="bento-card__pill">Shaders</span>
          </div>
        </footer>
      </article>
    `;

    return el;
  },

  /**
   * Responde al progreso del scrolltelling en el Hero (0 a 600px)
   * @param {HTMLElement} el - Elemento del DOM del bento
   * @param {number} progress - Progreso normalizado de 0 a 1
   * @param {number} scrolledPx - Pixels scrolleados
   */
  updateScroll(el, progress, scrolledPx) {
    if (!el) return;

    // Solo aparece cuando comenzamos a scrollear desde el bottom y se centra con generoso aire
    if (scrolledPx < 10) {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, calc(-50% + 220px)) scale(0.85)';
      el.classList.remove('is-active');
      return;
    }

    // Curva de entrada suave desde el fondo hacia el centro
    const enterProgress = Math.min(1, scrolledPx / 350);
    const easeOutQuad = 1 - (1 - enterProgress) * (1 - enterProgress);

    // Desplazamiento desde +220px hacia 0 (centrado perfecto con aire)
    const yOffset = (1 - easeOutQuad) * 220;
    const scale = 0.88 + easeOutQuad * 0.12;
    const opacity = Math.min(1, enterProgress * 1.6);

    el.style.opacity = opacity.toFixed(3);
    el.style.transform = `translate(-50%, calc(-50% + ${yOffset.toFixed(1)}px)) scale(${scale.toFixed(3)})`;
    
    if (enterProgress > 0.4) {
      el.classList.add('is-active');
    } else {
      el.classList.remove('is-active');
    }
  }
};

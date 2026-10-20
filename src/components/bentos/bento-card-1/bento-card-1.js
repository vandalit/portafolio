/* ==========================================================
   BENTO-CARD-1.JS — Componente Modular Bento #1
   Ratio 9:16 (Instagram Story / Reels)
   Estrategia Híbrida: Video HTML5 con Poster Instantáneo
   Soporte Edge Autoplay & Brave WebGL
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard1 = createBentoCard({
  id: 'bento-card-1',
  name: 'Bento #01',
  workTitle: 'Valle de la Luna — Atacama',
  workMeta: '2023 · CLIENT WORK',
  targetAnchor: '#work',
  calloutDir: 'right',
  accentColor: '#ccf020',
  ratio: '9:16',
  zIndex: 12,
  startPx: 100,
  endPx: 220
});

bentoCard1.renderContent = function() {
  return `
    <div class="bento-video-wrapper">
      <video 
        class="bento-video-element"
        src="https://turismolickancoy.cl/wp-content/uploads/2025/07/Duna-mayor-dentro-del-valle-de-la-luna.mp4"
        poster="./assets/images/midjourney/vandalit_Blob_graphic_dopamine_design_abstract_modern_design__7ce2ff82-6ce2-4c99-ba8d-15649dcbe2c2_1.png"
        autoplay
        loop
        muted
        playsinline
        webkit-playsinline
        disablepictureinpicture
        preload="metadata"
        aria-hidden="true"
        oncanplay="this.defaultMuted=true; this.muted=true; this.play().catch(()=>{});">
      </video>
    </div>
  `;
};

// Sobrescribimos updateScroll para que el scroll del usuario desbloquee el autoplay en Edge
const baseUpdateScroll = bentoCard1.updateScroll.bind(bentoCard1);
bentoCard1.updateScroll = function(el, progress, scrolledPx) {
  baseUpdateScroll(el, progress, scrolledPx);
  if (!el) return;

  // En Edge / navegadores con políticas estrictas de media: el scroll es un gesto de usuario que activa el play
  const video = el.querySelector('video');
  if (video && video.paused) {
    video.defaultMuted = true;
    video.muted = true;
    video.play().catch(() => {});
  }
};

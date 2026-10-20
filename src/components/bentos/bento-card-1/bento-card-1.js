/* ==========================================================
   BENTO-CARD-1.JS — Componente Modular Bento #1
   Ratio 9:16 (Instagram Story / Reels)
   Estrategia Híbrida: Video HTML5 con Poster Instantáneo
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard1 = createBentoCard({
  id: 'bento-card-1',
  name: 'Bento #01',
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
        oncanplay="this.muted=true; this.play();">
      </video>
    </div>
  `;
};

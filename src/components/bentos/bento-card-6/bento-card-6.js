/* ==========================================================
   BENTO-CARD-6.JS — Componente Modular Bento #6
   Ratio 21:9 (Ultrawide / Banner HUD)
   Imagen: Black Paper Iridescent Texture (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard6 = createBentoCard({
  id: 'bento-card-6',
  name: 'Bento #06',
  ratio: '21:9',
  zIndex: 12,
  startPx: 275,
  endPx: 395
});

bentoCard6.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_black_paper_with_iridescent_effect_texture_embossed_gr_dc33a515-4896-4553-9559-90821e277c1f.png"
      alt="Black Paper Iridescent Texture"
      loading="lazy">
  `;
};

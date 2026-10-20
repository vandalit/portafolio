/* ==========================================================
   BENTO-CARD-3.JS — Componente Modular Bento #3
   Ratio 1:1 (Instagram Square)
   Imagen: Blob Graphic Dopamine Design (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard3 = createBentoCard({
  id: 'bento-card-3',
  name: 'Bento #03',
  ratio: '1:1',
  zIndex: 12,
  startPx: 170,
  endPx: 290
});

bentoCard3.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_Blob_graphic_dopamine_design_abstract_modern_design__7ce2ff82-6ce2-4c99-ba8d-15649dcbe2c2_1.png"
      alt="Blob Graphic Dopamine Design"
      loading="lazy">
  `;
};

/* ==========================================================
   BENTO-CARD-2.JS — Componente Modular Bento #2
   Ratio 16:9 (Desktop Widescreen)
   Imagen: Screens Mockup Web Design (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard2 = createBentoCard({
  id: 'bento-card-2',
  name: 'Bento #02',
  ratio: '16:9',
  zIndex: 13,
  startPx: 135,
  endPx: 255
});

bentoCard2.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_screens_mockup_web_design_--sref_httpss.mj.runcgBuE3_bdfc81af-66c5-42b8-9a78-09b2648c35f5_3.png"
      alt="Screens Mockup Web Design"
      loading="lazy">
  `;
};

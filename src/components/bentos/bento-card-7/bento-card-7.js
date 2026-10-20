/* ==========================================================
   BENTO-CARD-7.JS — Componente Modular Bento #7
   Ratio 9:16 (Story / Reel Vertical)
   Imagen: Rizoma Macro Coloured Photo (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard7 = createBentoCard({
  id: 'bento-card-7',
  name: 'Bento #07',
  workTitle: 'Rizoma Macro Biology',
  workMeta: '2024 · MULTIMEDIA',
  targetAnchor: '#lab',
  calloutDir: 'left',
  accentColor: '#ccf020',
  ratio: '9:16',
  zIndex: 14,
  startPx: 310,
  endPx: 430
});

bentoCard7.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_Rizoma_national_geographic_macro_coloured_photograph_64ec413f-e06f-4998-8654-5994bbba87c2_2.png"
      alt="Rizoma Macro Photograph"
      loading="lazy">
  `;
};

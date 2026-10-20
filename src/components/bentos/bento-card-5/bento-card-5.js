/* ==========================================================
   BENTO-CARD-5.JS — Componente Modular Bento #5
   Ratio 4:3 (Tablet / iPad Display)
   Imagen: Suburban Living Room Staged (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard5 = createBentoCard({
  id: 'bento-card-5',
  name: 'Bento #05',
  workTitle: 'Spatial Living Architecture',
  workMeta: '2023 · CORPORATE UI',
  targetAnchor: '#work',
  calloutDir: 'right',
  accentColor: '#ccf020',
  ratio: '4:3',
  zIndex: 13,
  startPx: 240,
  endPx: 360
});

bentoCard5.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_A_cozy_and_clean_suburban_living_room_staged_for_sal_81f8c780-9cd8-4b20-877f-d4edd27a1244_1.png"
      alt="Suburban Living Room Staged"
      loading="lazy">
  `;
};

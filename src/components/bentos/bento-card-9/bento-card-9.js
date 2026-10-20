/* ==========================================================
   BENTO-CARD-9.JS — Componente Modular Bento #9
   Ratio 3:2 (Classic Photo Frame)
   Imagen: La Disqura Natales Lettering (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard9 = createBentoCard({
  id: 'bento-card-9',
  name: 'Bento #09',
  workTitle: 'Natales Food Lettering',
  workMeta: '2023 · BRANDING & WEB',
  targetAnchor: '#work',
  calloutDir: 'left',
  accentColor: '#ccf020',
  ratio: '3:2',
  zIndex: 13,
  startPx: 380,
  endPx: 500
});

bentoCard9.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_la_disqura_natales_logotype_as_lettering_on_a_food_d_fc757d24-20cc-4d78-93cd-75bf0fe88265_3.png"
      alt="La Disqura Natales Lettering"
      loading="lazy">
  `;
};

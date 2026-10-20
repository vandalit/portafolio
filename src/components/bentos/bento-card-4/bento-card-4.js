/* ==========================================================
   BENTO-CARD-4.JS — Componente Modular Bento #4
   Ratio 4:5 (Instagram Portrait Feed)
   Imagen: VTuber Punk Fluor Street Art (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard4 = createBentoCard({
  id: 'bento-card-4',
  name: 'Bento #04',
  ratio: '4:5',
  zIndex: 15,
  startPx: 205,
  endPx: 325
});

bentoCard4.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_a_vtuber_as_a_punk_fluor_colour_street_art_inspired__e1f91a82-97a9-4307-888e-654603a3dcd8_2.png"
      alt="VTuber Punk Street Art"
      loading="lazy">
  `;
};

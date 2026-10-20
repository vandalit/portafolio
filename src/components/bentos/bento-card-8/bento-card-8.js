/* ==========================================================
   BENTO-CARD-8.JS — Componente Modular Bento #8
   Ratio 16:10 (Laptop MacBook Display)
   Imagen: Outline Digital Illustration (Midjourney)
   ========================================================== */

import { createBentoCard } from '../bento-base.js';

export const bentoCard8 = createBentoCard({
  id: 'bento-card-8',
  name: 'Bento #08',
  workTitle: 'Digital Neon Outline',
  workMeta: '2024 · DESIGN SYSTEM',
  targetAnchor: '#cases',
  calloutDir: 'right',
  accentColor: '#ccf020',
  ratio: '16:10',
  zIndex: 12,
  startPx: 345,
  endPx: 465
});

bentoCard8.renderContent = function() {
  return `
    <img 
      class="bento-image-fill"
      src="./assets/images/midjourney/vandalit_Outline_digital_illustration_hipertealostic_photogra_47c8bf74-1925-427f-8eda-ebf0690ac2b3_2.png"
      alt="Outline Digital Illustration"
      loading="lazy">
  `;
};

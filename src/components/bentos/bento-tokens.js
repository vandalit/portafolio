/* ==========================================================
   BENTO-TOKENS.JS — Design Tokens & Configuración Global
   Centraliza la escala, timing de scroll y físicas de animación
   ========================================================== */

export const BENTO_TOKENS = {
  // Rango global de activación en el Hero Scrollytelling (pixels de scroll)
  scroll: {
    startPx: 100,       // Inicio de activación del primer bento
    stageRangePx: 600,  // Rango total del stage
    travelDuration: 120 // Pixels que toma cada bento en volar desde bottom a su lugar
  },

  // Distancia inicial en vh (fuera de pantalla por abajo)
  physics: {
    sweepDistanceVh: 115,
    easingPower: 3 // Curva cúbica ease-out para entrada veloz y suave aterrizaje
  },

  // Factor de escala multiplicador (+20% adicional: 1.44)
  scale: 1.44
};

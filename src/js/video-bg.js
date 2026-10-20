/* ==========================================================
   VIDEO-BG.JS — Dual-Stage YouTube Ambient Background
   Capa 0 (z-index: 0)
   - Stage 1 (<500px):  Hse_HTX6KGs
   - Stage 2 (>=500px): GKq9nKZpmu0
   - Crossfade con transición suave CSS
   - Bandwidth aware (saveData / 2g checks)
   - Control de efectos FX (pause / resume)
   ========================================================== */

let containerEl = null;
let iframeV1 = null;
let iframeV2 = null;
let isVideo2Injected = false;
let isPaused = false;
let currentStage = 1; // 1: Hse_HTX6KGs, 2: GKq9nKZpmu0

const VIDEO_1_ID = 'Hse_HTX6KGs';
const VIDEO_2_ID = 'GKq9nKZpmu0';

// Altura de scroll donde se dispara el crossfade
// Adelantado 200px (a 300px, justo en el ecuador del scrollytelling de 600px del hero)
export const VIDEO_TRANSITION_PX = 300;
export const VIDEO_PRELOAD_PX = 80;

function getEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1`;
}

function sendIframeCommand(iframe, command) {
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: command,
        args: []
      }), '*');
    } catch (_) {}
  }
}

function createIframe(videoId, extraClass) {
  const iframe = document.createElement('iframe');
  iframe.className = `hero__video-iframe ${extraClass}`;
  iframe.src = getEmbedUrl(videoId);
  iframe.title = `Ambient background video ${videoId}`;
  iframe.allow = 'autoplay; encrypted-media';
  iframe.setAttribute('tabindex', '-1');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.loading = 'lazy';
  return iframe;
}

export function initVideoBackground() {
  containerEl = document.getElementById('hero-layer-video');
  if (!containerEl) return;

  // 1. Connection check: skip if slow or data-saver is active
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    if (conn.saveData) {
      console.log('[VideoBG] Save-Data mode detected, skipping background video');
      return;
    }
    if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
      console.log(`[VideoBG] Low-bandwidth connection (${conn.effectiveType}), skipping background video`);
      return;
    }
  }

  // 2. Inyección de Video 1 (Hse_HTX6KGs)
  const injectVideo1 = () => {
    if (iframeV1) return;
    iframeV1 = createIframe(VIDEO_1_ID, 'hero__video-iframe--v1');
    iframeV1.onload = () => {
      containerEl.classList.add('is-ready');
      console.log('[VideoBG] Ambient Video 1 (Hse_HTX6KGs) loaded and playing');
    };
    containerEl.appendChild(iframeV1);
  };

  // 3. Inyección perezosa de Video 2 (GKq9nKZpmu0)
  const injectVideo2 = () => {
    if (isVideo2Injected || !containerEl) return;
    isVideo2Injected = true;
    iframeV2 = createIframe(VIDEO_2_ID, 'hero__video-iframe--v2');
    iframeV2.onload = () => {
      console.log('[VideoBG] Ambient Video 2 (GKq9nKZpmu0) preloaded and ready for crossfade');
    };
    containerEl.appendChild(iframeV2);
  };

  // Programación perezosa
  if ('requestIdleCallback' in window) {
    window.addEventListener('load', () => {
      requestIdleCallback(injectVideo1, { timeout: 2500 });
      // Pre-cargar Video 2 tras un breve respiro para que esté listo al scrollear
      requestIdleCallback(injectVideo2, { timeout: 4500 });
    });
  } else {
    window.addEventListener('load', () => {
      setTimeout(injectVideo1, 1000);
      setTimeout(injectVideo2, 2500);
    });
  }

  // 4. Listener de scroll para transición a los 300px
  const handleScrollTransition = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    // Si el usuario scrollea antes de idle, asegurar que Video 2 empieza a cargar
    if (scrollY >= VIDEO_PRELOAD_PX && !isVideo2Injected) {
      injectVideo2();
    }

    if (scrollY >= VIDEO_TRANSITION_PX) {
      if (currentStage !== 2) {
        currentStage = 2;
        containerEl.classList.add('is-video2-active');
        if (!isPaused && iframeV2) {
          sendIframeCommand(iframeV2, 'playVideo');
        }
        console.log(`%c[VideoBG] 🎬 ${VIDEO_TRANSITION_PX}px reached: crossfade to Video 2 (GKq9nKZpmu0)`, 'color: #b8e030; font-weight: bold;');
      }
    } else {
      if (currentStage !== 1) {
        currentStage = 1;
        containerEl.classList.remove('is-video2-active');
        if (!isPaused && iframeV1) {
          sendIframeCommand(iframeV1, 'playVideo');
        }
        console.log(`%c[VideoBG] 🎬 <${VIDEO_TRANSITION_PX}px: crossfade back to Video 1 (Hse_HTX6KGs)`, 'color: #e8306e; font-weight: bold;');
      }
    }
  };

  window.addEventListener('scroll', handleScrollTransition, { passive: true });

  // 5. Instancia de control para el toggle FX
  window.__videoBgInstance = {
    pause: () => {
      isPaused = true;
      if (containerEl) {
        containerEl.style.visibility = 'hidden';
      }
      sendIframeCommand(iframeV1, 'pauseVideo');
      sendIframeCommand(iframeV2, 'pauseVideo');
      console.log('[VideoBG] Background videos paused');
    },
    resume: () => {
      isPaused = false;
      if (containerEl) {
        containerEl.style.visibility = 'visible';
      }
      const activeIframe = currentStage === 2 ? iframeV2 : iframeV1;
      sendIframeCommand(activeIframe, 'playVideo');
      console.log('[VideoBG] Background videos resumed');
    },
    toggle: (enable) => {
      if (enable) {
        window.__videoBgInstance.resume();
      } else {
        window.__videoBgInstance.pause();
      }
    }
  };
}

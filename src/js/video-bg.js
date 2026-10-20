/* ==========================================================
   VIDEO-BG.JS — Lazy-loaded YouTube Ambient Background
   Capa 0 (z-index: 0) — Video ID: Hse_HTX6KGs
   ========================================================== */

export function initVideoBackground() {
  const container = document.getElementById('hero-layer-video');
  if (!container) return;

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

  // 2. Lazyload execution after full page load + idle time
  const injectIframe = () => {
    // Avoid double injection
    if (container.querySelector('iframe')) return;

    const iframe = document.createElement('iframe');
    iframe.className = 'hero__video-iframe';
    // YouTube embed parameters: muted, autoplay, loop, playsinline, no controls, no branding
    iframe.src = 'https://www.youtube-nocookie.com/embed/Hse_HTX6KGs?autoplay=1&mute=1&controls=0&loop=1&playlist=Hse_HTX6KGs&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1';
    iframe.title = 'Background video';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.loading = 'lazy';

    iframe.onload = () => {
      container.classList.add('is-ready');
      console.log('[VideoBG] YouTube background video loaded and playing');
    };

    container.appendChild(iframe);
  };

  // Schedule lazily
  if ('requestIdleCallback' in window) {
    window.addEventListener('load', () => {
      requestIdleCallback(injectIframe, { timeout: 3500 });
    });
  } else {
    window.addEventListener('load', () => {
      setTimeout(injectIframe, 1500);
    });
  }
}

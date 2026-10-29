/* ==========================================================
   LAB-MODAL.JS — Frontier Tech & Experimentos Showcase Modal
   Estructura Split Screen exclusiva para Lab:
   - Izquierda: Narrativa técnica, hipótesis y links de código/demo
   - Derecha:
     1. Stack tecnológico fronterizo (pills)
     2. Video demostrativo en micro-loop
     3. Galería de capturas al pie
   ========================================================== */

export class LabModal {
  constructor() {
    this.modal = document.getElementById('lab-modal');
    this.closeBtn = this.modal?.querySelector('.lab-modal__close');
    this.backdrop = this.modal?.querySelector('.lab-modal__backdrop');

    // Elementos columna izquierda
    this.titleEl = this.modal?.querySelector('.lab-modal__title');
    this.subtitleEl = this.modal?.querySelector('.lab-modal__subtitle');
    this.descEl = this.modal?.querySelector('.lab-modal__desc');
    this.challengeEl = this.modal?.querySelector('.lab-modal__challenge');
    this.solutionEl = this.modal?.querySelector('.lab-modal__solution');
    this.resultEl = this.modal?.querySelector('.lab-modal__result');
    this.linksEl = this.modal?.querySelector('.lab-modal__actions');

    // Elementos columna derecha
    this.stackEl = this.modal?.querySelector('.lab-modal__stack-pills');
    this.videoEl = this.modal?.querySelector('.lab-modal__video');
    this.videoContainer = this.modal?.querySelector('.lab-modal__video-stage');
    this.galleryEl = this.modal?.querySelector('.lab-modal__gallery-grid');

    this.currentProject = null;
    this._init();
  }

  _init() {
    if (!this.modal) return;

    this.closeBtn?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
        this.close();
      }
    });
  }

  open(projectData) {
    if (!this.modal || !projectData) return;

    this.currentProject = projectData;
    document.body.style.overflow = 'hidden';

    this._populate(projectData);

    this.modal.setAttribute('aria-hidden', 'false');
    this.modal.classList.add('is-open');

    // Reproducir video si existe
    if (this.videoEl && projectData.video) {
      this.videoEl.currentTime = 0;
      this.videoEl.play().catch(() => {});
    }
  }

  close() {
    if (!this.modal) return;

    if (this.videoEl) {
      this.videoEl.pause();
    }

    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  _populate(data) {
    // 1. Columna Izquierda: Narrativa
    if (this.titleEl) this.titleEl.textContent = data.title;
    if (this.subtitleEl) this.subtitleEl.textContent = data.subtitle || 'Experimento de Laboratorio';
    if (this.descEl) this.descEl.textContent = data.description || '';

    if (this.challengeEl) {
      this.challengeEl.textContent = data.challenge || 'Exploración de viabilidad y límites del hardware.';
    }
    if (this.solutionEl) {
      this.solutionEl.textContent = data.solution || 'Implementación en código puro y experimentación de paradigmas.';
    }
    if (this.resultEl) {
      this.resultEl.textContent = data.result || 'Validación de concepto técnico y documentación de patrones.';
    }

    // Acciones (Demo & Código)
    if (this.linksEl) {
      this.linksEl.innerHTML = '';
      if (data.links?.demo) {
        this.linksEl.innerHTML += `
          <a href="${data.links.demo}" target="_blank" rel="noopener" class="btn btn--lime">
            Demo en Vivo <span class="btn__icon">↗</span>
          </a>
        `;
      }
      if (data.links?.github) {
        this.linksEl.innerHTML += `
          <a href="${data.links.github}" target="_blank" rel="noopener" class="btn btn--ghost btn--ghost-lime">
            Repositorio <span class="btn__icon">↗</span>
          </a>
        `;
      }
    }

    // 2. Columna Derecha — Sección 1: Stack Tecnológico
    if (this.stackEl) {
      const stack = Array.isArray(data.techStack) && data.techStack.length > 0
        ? data.techStack
        : (data.tags || ['WebGL', 'Coding', 'Experimental']);

      this.stackEl.innerHTML = stack.map(tech => `
        <span class="lab-pill">${tech}</span>
      `).join('');
    }

    // 2. Columna Derecha — Sección 2: Video Demostrativo
    if (this.videoContainer) {
      if (data.video) {
        this.videoContainer.innerHTML = `
          <div class="lab-video-wrapper">
            <video class="lab-modal__video" src="${data.video}" loop muted playsinline autoplay></video>
            <div class="lab-video-badge">
              <span class="lab-video-dot"></span>
              <span>Micro-Loop Demo</span>
            </div>
          </div>
        `;
        this.videoEl = this.videoContainer.querySelector('.lab-modal__video');
      } else {
        // Fallback a imagen de cover con scanline
        this.videoContainer.innerHTML = `
          <div class="lab-video-wrapper lab-scanline">
            <img src="${data.cover || data.coverPlaceholder}" alt="${data.title}" class="lab-video-fallback-img">
            <div class="lab-video-badge">
              <span>✦ Prototipo Interactivo</span>
            </div>
          </div>
        `;
        this.videoEl = null;
      }
    }

    // 2. Columna Derecha — Sección 3: Galería al pie
    if (this.galleryEl) {
      const gallery = Array.isArray(data.gallery) && data.gallery.length > 0
        ? data.gallery
        : (data.coverPlaceholder ? [data.coverPlaceholder] : []);

      this.galleryEl.innerHTML = gallery.map((imgSrc, i) => `
        <div class="lab-gallery-thumb" data-img-index="${i}">
          <img src="${imgSrc}" alt="${data.title} captura ${i + 1}" loading="lazy">
        </div>
      `).join('');
    }
  }
}

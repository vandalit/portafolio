/* ==========================================================
   LAB-MODAL.JS — Frontier Tech & Experimentos Showcase Modal
   Estructura Split Screen exclusiva para Lab:
   - Izquierda: Narrativa técnica, hipótesis y links de código/demo
   - Derecha:
     1. Stack tecnológico fronterizo (pills)
     2. Video demostrativo en micro-loop
     3. Galería de capturas al pie con visor Lightbox
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

    // Visor Lightbox Compartido
    this.lightbox = document.querySelector('.modal__lightbox');
    this.lightboxImg = this.lightbox?.querySelector('.modal__lightbox-img');
    this.lightboxCounter = this.lightbox?.querySelector('.modal__lightbox-counter');
    this.lightboxClose = this.lightbox?.querySelector('.modal__lightbox-close');
    this.lightboxPrev = this.lightbox?.querySelector('.modal__lightbox-btn--prev');
    this.lightboxNext = this.lightbox?.querySelector('.modal__lightbox-btn--next');

    this.currentProject = null;
    this.photos = [];
    this.currentPhotoIndex = 0;
    this.isLightboxOpen = false;

    this._init();
  }

  _init() {
    if (!this.modal) return;

    this.closeBtn?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());

    // Lightbox listeners
    this.lightboxClose?.addEventListener('click', () => {
      if (this.isLightboxOpen) this.closeLightbox();
    });
    this.lightboxPrev?.addEventListener('click', () => {
      if (this.isLightboxOpen) this.prevPhoto();
    });
    this.lightboxNext?.addEventListener('click', () => {
      if (this.isLightboxOpen) this.nextPhoto();
    });

    this.lightbox?.addEventListener('click', (e) => {
      if (this.isLightboxOpen && (e.target === this.lightbox || e.target.classList.contains('modal__lightbox-stage'))) {
        this.closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('is-open')) return;

      if (this.isLightboxOpen) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          this.closeLightbox();
        } else if (e.key === 'ArrowRight') {
          this.nextPhoto();
        } else if (e.key === 'ArrowLeft') {
          this.prevPhoto();
        }
      } else {
        if (e.key === 'Escape') {
          this.close();
        }
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

    this.closeLightbox();

    if (this.videoEl) {
      this.videoEl.pause();
    }

    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ── LIGHTBOX MÉTODOS ──────────────────────────────────────
  openLightbox(index) {
    if (!this.lightbox || !this.photos.length) return;
    this.currentPhotoIndex = (index >= 0 && index < this.photos.length) ? index : 0;
    this.isLightboxOpen = true;
    this._updateLightboxView();
    this.lightbox.classList.add('is-open');
    this.lightbox.setAttribute('aria-hidden', 'false');
  }

  closeLightbox() {
    if (!this.lightbox || !this.isLightboxOpen) return;
    this.isLightboxOpen = false;
    this.lightbox.classList.remove('is-open');
    this.lightbox.setAttribute('aria-hidden', 'true');
  }

  nextPhoto() {
    if (!this.isLightboxOpen || !this.photos.length) return;
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
    this._updateLightboxView();
  }

  prevPhoto() {
    if (!this.isLightboxOpen || !this.photos.length) return;
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.photos.length) % this.photos.length;
    this._updateLightboxView();
  }

  _updateLightboxView() {
    const src = this.photos[this.currentPhotoIndex];
    if (this.lightboxImg) {
      this.lightboxImg.style.opacity = '0';
      this.lightboxImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        this.lightboxImg.src = src;
        this.lightboxImg.alt = `${this.currentProject?.title || 'Experimento'} — Captura ${this.currentPhotoIndex + 1}`;
        this.lightboxImg.style.opacity = '1';
        this.lightboxImg.style.transform = 'scale(1)';
      }, 80);
    }

    if (this.lightboxCounter) {
      this.lightboxCounter.textContent = `${this.currentPhotoIndex + 1} / ${this.photos.length}`;
    }

    const hasMultiple = this.photos.length > 1;
    if (this.lightboxPrev) this.lightboxPrev.style.display = hasMultiple ? 'flex' : 'none';
    if (this.lightboxNext) this.lightboxNext.style.display = hasMultiple ? 'flex' : 'none';
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
        // Fallback a imagen de cover con scanline (clickable para lightbox)
        this.videoContainer.innerHTML = `
          <div class="lab-video-wrapper lab-scanline" role="button" tabindex="0" style="cursor:zoom-in;" title="Click para ampliar captura" aria-label="Ampliar captura principal">
            <img src="${data.cover || data.coverPlaceholder}" alt="${data.title}" class="lab-video-fallback-img">
            <div class="lab-video-badge">
              <span>✦ Prototipo Interactivo (Zoom ↗)</span>
            </div>
          </div>
        `;
        this.videoEl = null;
        const fallbackStage = this.videoContainer.querySelector('.lab-video-wrapper');
        fallbackStage?.addEventListener('click', () => this.openLightbox(0));
      }
    }

    // 2. Columna Derecha — Sección 3: Galería al pie con interacción Lightbox
    const gallery = [];
    if (data.cover || data.coverPlaceholder) {
      gallery.push(data.cover || data.coverPlaceholder);
    }
    if (Array.isArray(data.gallery)) {
      data.gallery.forEach(img => {
        if (!gallery.includes(img)) gallery.push(img);
      });
    }
    this.photos = gallery;

    if (this.galleryEl) {
      if (this.photos.length > 0) {
        this.galleryEl.innerHTML = this.photos.map((imgSrc, i) => `
          <div class="lab-gallery-thumb" data-img-index="${i}" role="button" tabindex="0" aria-label="Ver captura ${i + 1} ampliada">
            <img src="${imgSrc}" alt="${data.title} captura ${i + 1}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')">
          </div>
        `).join('');

        this.galleryEl.querySelectorAll('.lab-gallery-thumb').forEach(thumb => {
          const idx = parseInt(thumb.dataset.imgIndex, 10);
          thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openLightbox(idx);
          });
          thumb.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              this.openLightbox(idx);
            }
          });
        });
      } else {
        this.galleryEl.innerHTML = '<span style="color:var(--text-3); font-size:12px;">Sin capturas adicionales.</span>';
      }
    }
  }
}

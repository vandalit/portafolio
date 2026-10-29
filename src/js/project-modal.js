/* ==========================================================
   PROJECT-MODAL.JS — Split Canvas with Dual Scroll & Lightbox Carousel
   ========================================================== */

export class ProjectModal {
  constructor() {
    this.modal = document.getElementById('project-modal');
    this.sidebar = this.modal?.querySelector('.modal__sidebar');
    this.gallery = this.modal?.querySelector('.modal__gallery');
    this.closeBtn = this.modal?.querySelector('.modal__close');
    this.scrollHint = this.modal?.querySelector('.modal__scroll-hint');
    this.backdrop = this.modal?.querySelector('.modal__backdrop');

    // Lightbox / Vista Detalle de Imágenes
    this.lightbox = this.modal?.querySelector('.modal__lightbox');
    this.lightboxImg = this.lightbox?.querySelector('.modal__lightbox-img');
    this.lightboxCounter = this.lightbox?.querySelector('.modal__lightbox-counter');
    this.lightboxClose = this.lightbox?.querySelector('.modal__lightbox-close');
    this.lightboxPrev = this.lightbox?.querySelector('.modal__lightbox-btn--prev');
    this.lightboxNext = this.lightbox?.querySelector('.modal__lightbox-btn--next');

    this.sidebarBottom = false;
    this.galleryBottom = false;
    this.pageUnlocked = false;
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
    this.scrollHint?.addEventListener('click', () => this.close());

    // Lightbox listeners
    this.lightboxClose?.addEventListener('click', () => this.closeLightbox());
    this.lightboxPrev?.addEventListener('click', () => this.prevPhoto());
    this.lightboxNext?.addEventListener('click', () => this.nextPhoto());

    // Click en fondo oscuro para cerrar lightbox
    this.lightbox?.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target.classList.contains('modal__lightbox-stage')) {
        this.closeLightbox();
      }
    });

    // Teclado
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

    // Native scrolling state tracking
    this.sidebar?.addEventListener('scroll', () => this._checkBottoms(), { passive: true });
    this.gallery?.addEventListener('scroll', () => this._checkBottoms(), { passive: true });
  }

  _checkBottoms() {
    const sidebarAtBottom = this._isAtBottom(this.sidebar);
    const galleryAtBottom = this._isAtBottom(this.gallery);

    this.sidebarBottom = sidebarAtBottom;
    this.galleryBottom = galleryAtBottom;

    if (sidebarAtBottom && galleryAtBottom) {
      this.scrollHint?.classList.add('visible');
    } else {
      this.scrollHint?.classList.remove('visible');
    }
  }

  _isAtBottom(el) {
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
  }

  open(projectData) {
    if (!this.modal) return;

    this.currentProject = projectData;
    this.pageUnlocked = false;
    this.sidebarBottom = false;
    this.galleryBottom = false;

    // Lock page scroll
    document.body.style.overflow = 'hidden';

    // Populate content
    this._populate(projectData);

    // Reset scroll positions
    if (this.sidebar) this.sidebar.scrollTop = 0;
    if (this.gallery) this.gallery.scrollTop = 0;

    // Show modal
    this.modal.setAttribute('aria-hidden', 'false');
    this.modal.classList.add('is-open');
  }

  close() {
    if (!this.modal) return;
    this.closeLightbox();
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.pageUnlocked = false;
  }

  // ── MÉTODOS DEL LIGHTBOX CARRUSEL ─────────────────────────
  openLightbox(index) {
    if (!this.lightbox || !this.photos.length) return;
    this.currentPhotoIndex = (index >= 0 && index < this.photos.length) ? index : 0;
    this.isLightboxOpen = true;
    this._updateLightboxView();
    this.lightbox.classList.add('is-open');
    this.lightbox.setAttribute('aria-hidden', 'false');
  }

  closeLightbox() {
    if (!this.lightbox) return;
    this.isLightboxOpen = false;
    this.lightbox.classList.remove('is-open');
    this.lightbox.setAttribute('aria-hidden', 'true');
  }

  nextPhoto() {
    if (!this.photos.length) return;
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
    this._updateLightboxView();
  }

  prevPhoto() {
    if (!this.photos.length) return;
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
        this.lightboxImg.alt = `${this.currentProject?.title || 'Proyecto'} — Foto ${this.currentPhotoIndex + 1}`;
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

  // ── POBLAR DATOS ──────────────────────────────────────────
  _populate(data) {
    // Sidebar
    const accentColor = data.accentColor || (data.category === 'coding' ? 'var(--lime)' : 'var(--magenta)');
    const isMultimedia = data.category === 'multimedia' || data.category === 'wordpress';

    this.modal.querySelector('.modal__project-eyebrow').textContent = data.role || data.category;
    this.modal.querySelector('.modal__project-eyebrow').style.color = accentColor;
    this.modal.querySelector('.modal__project-title').textContent = data.title;
    this.modal.querySelector('.modal__project-desc').textContent = data.description;

    // Meta sections
    const metaContainer = this.modal.querySelector('.modal__meta-sections');
    if (metaContainer) {
      metaContainer.innerHTML = '';

      const metas = [
        { label: 'Cliente', value: data.client || 'Proyecto personal' },
        { label: 'Año', value: data.year },
        { label: 'Rol', value: data.role },
        { label: 'Challenge', value: data.challenge },
        { label: 'Solución', value: data.solution },
        { label: 'Resultado', value: data.result },
      ].filter(m => m.value);

      metas.forEach(({ label, value }) => {
        const div = document.createElement('div');
        div.className = 'modal__meta-section';
        div.innerHTML = `
          <div class="modal__meta-label">${label}</div>
          <div class="modal__meta-value">${value}</div>
        `;
        metaContainer.appendChild(div);
      });

      // Stack
      if (data.stack?.length) {
        const stackDiv = document.createElement('div');
        stackDiv.className = 'modal__meta-section';
        stackDiv.innerHTML = `
          <div class="modal__meta-label">Stack</div>
          <div class="modal__stack-pills">
            ${data.stack.map(s => `<span class="skill-pill">${s}</span>`).join('')}
          </div>
        `;
        metaContainer.appendChild(stackDiv);
      }
    }

    // Tags
    const tagsContainer = this.modal.querySelector('.modal__tags');
    if (tagsContainer && data.tags) {
      tagsContainer.innerHTML = data.tags.map(t => {
        const cls = isMultimedia ? 'tag--magenta' : 'tag--lime';
        return `<span class="tag ${cls}">${t}</span>`;
      }).join('');
    }

    // Actions
    const actionsContainer = this.modal.querySelector('.modal__actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      if (data.links?.live) {
        actionsContainer.innerHTML += `<a href="${data.links.live}" target="_blank" class="btn btn--${isMultimedia ? 'primary' : 'lime'}">Ver sitio <span class="btn__icon">↗</span></a>`;
      }
      if (data.links?.github) {
        actionsContainer.innerHTML += `<a href="${data.links.github}" target="_blank" class="btn btn--ghost">GitHub <span class="btn__icon">↗</span></a>`;
      }
    }

    // Normalizar lista de fotos para el lightbox y masonry
    const gallery = Array.isArray(data.gallery) && data.gallery.length > 0 ? [...data.gallery] : [];
    if (gallery.length === 0 && data.coverPlaceholder) {
      gallery.push(data.coverPlaceholder);
    }
    this.photos = gallery;

    // Gallery — Masonry
    const masonry = this.modal.querySelector('.modal__masonry');
    if (masonry) {
      if (this.photos.length > 0) {
        masonry.innerHTML = this.photos.map((src, i) => `
          <div class="modal__masonry-item" data-photo-index="${i}" role="button" tabindex="0" aria-label="Ver imagen ${i + 1} ampliada" style="animation-delay:${i * 80}ms">
            <img class="modal__masonry-img" src="${src}" alt="${data.title} — imagen ${i + 1}" loading="lazy">
          </div>
        `).join('');

        // Listeners para abrir lightbox en cada imagen
        masonry.querySelectorAll('.modal__masonry-item').forEach(item => {
          const idx = parseInt(item.dataset.photoIndex, 10);
          item.addEventListener('click', () => this.openLightbox(idx));
          item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.openLightbox(idx);
            }
          });
        });
      } else {
        masonry.innerHTML = '<p style="color:var(--text-3); padding:2rem;">Sin imágenes en la galería.</p>';
      }
    }
  }
}

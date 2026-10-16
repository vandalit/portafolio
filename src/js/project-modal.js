/* ==========================================================
   PROJECT-MODAL.JS — Split Canvas with Dual Independent Scroll
   ========================================================== */

export class ProjectModal {
  constructor() {
    this.modal = document.getElementById('project-modal');
    this.sidebar = this.modal?.querySelector('.modal__sidebar');
    this.gallery = this.modal?.querySelector('.modal__gallery');
    this.closeBtn = this.modal?.querySelector('.modal__close');
    this.scrollHint = this.modal?.querySelector('.modal__scroll-hint');
    this.backdrop = this.modal?.querySelector('.modal__backdrop');

    this.sidebarBottom = false;
    this.galleryBottom = false;
    this.pageUnlocked = false;
    this.currentProject = null;

    this._init();
  }

  _init() {
    if (!this.modal) return;

    this.closeBtn?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-open')) this.close();
    });

    // Wheel intercept
    this.modal.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

    // Touch
    let touchStartY = 0;
    this.modal.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    this.modal.addEventListener('touchmove', (e) => {
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      this._scroll(e.target, delta);
    }, { passive: false });

    // Scroll state tracking
    this.sidebar?.addEventListener('scroll', () => this._checkBottoms());
    this.gallery?.addEventListener('scroll', () => this._checkBottoms());
  }

  _onWheel(e) {
    if (this.pageUnlocked) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target.closest('.modal__sidebar') ? 'sidebar'
                 : e.target.closest('.modal__gallery') ? 'gallery'
                 : null;

    if (!target) return;
    this._scroll(e.target, e.deltaY);
  }

  _scroll(target, delta) {
    const el = target.closest('.modal__sidebar') ? this.sidebar
             : target.closest('.modal__gallery') ? this.gallery
             : null;
    if (!el) return;

    el.scrollTop += delta;
    this._checkBottoms();
  }

  _checkBottoms() {
    const sidebarAtBottom = this._isAtBottom(this.sidebar);
    const galleryAtBottom = this._isAtBottom(this.gallery);

    this.sidebarBottom = sidebarAtBottom;
    this.galleryBottom = galleryAtBottom;

    if (sidebarAtBottom && galleryAtBottom) {
      this.scrollHint?.classList.add('visible');
      // After brief delay, allow page scroll
      if (!this.pageUnlocked) {
        setTimeout(() => {
          this.pageUnlocked = true;
          document.body.style.overflow = '';
        }, 600);
      }
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
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.pageUnlocked = false;
  }

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

    // Gallery — Masonry
    const masonry = this.modal.querySelector('.modal__masonry');
    if (masonry && data.gallery?.length) {
      masonry.innerHTML = data.gallery.map((src, i) => `
        <div class="modal__masonry-item" style="animation-delay:${i * 80}ms">
          <img class="modal__masonry-img" src="${src}" alt="${data.title} — imagen ${i + 1}" loading="lazy">
        </div>
      `).join('');
    } else if (masonry && data.coverPlaceholder) {
      masonry.innerHTML = `
        <div class="modal__masonry-item">
          <img class="modal__masonry-img" src="${data.coverPlaceholder}" alt="${data.title}" loading="lazy">
        </div>
      `;
    }
  }
}

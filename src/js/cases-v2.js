/**
 * CasesV2 — Feature Stage + Strip Carousel
 *
 * Layout:
 *   - Full-bleed stage card: background = featured case cover image
 *   - Content overlay: tags (top-right), eyebrow / title / desc / meta (bottom-left)
 *   - Bottom strip: [prev_thumb] [needle] [next_1…next_n-2] | [prev_btn] [next_btn]
 *   - Featured case is EXCLUDED from the strip (no redundancy)
 *   - Drag (mouse + touch) + keyboard (ArrowLeft / ArrowRight) navigation
 *   - Clicking any thumbnail calls goTo(idx)
 *   - CTA button carries data-project-id + data-type="case" → auto-triggers ProjectModal
 */

export class CasesV2 {
  /**
   * @param {Array<Object>} cases  – array of case objects from loadAllContent()
   */
  constructor(cases) {
    if (!cases || cases.length === 0) return;

    this.cases = cases;
    this.n     = cases.length;
    this.idx   = 0; // index of the currently featured case

    // DOM refs
    this._stage     = document.getElementById('cv2-stage');
    this._bgImg     = document.getElementById('cv2-bg-img');
    this._bgStrip   = document.getElementById('cv2-bg-strip');
    this._eyebrow   = document.getElementById('cv2-eyebrow');
    this._title     = document.getElementById('cv2-title');
    this._desc      = document.getElementById('cv2-desc');
    this._meta      = document.getElementById('cv2-meta');
    this._tags      = document.getElementById('cv2-tags');
    this._track     = document.getElementById('cv2-strip-track');
    this._prevBtn   = document.getElementById('cv2-prev');
    this._nextBtn   = document.getElementById('cv2-next');

    if (!this._stage) return; // guard: section not in DOM

    this._firstRender = true;
    this._stripAnimations = [];
    this._render();
    this._bind();
  }

  // ─── Accent colour helper ─────────────────────────────────────────────────

  _accent(c) {
    return c.category === 'multimedia' ? 'var(--magenta)' : 'var(--lime)';
  }

  // ─── Feature panel ────────────────────────────────────────────────────────

  _renderFeature() {
    const c      = this.cases[this.idx];
    const accent = this._accent(c);
    const src    = c.cover || c.coverPlaceholder || '';
    const id     = c.id || c._id || '';

    // Background image – swap with fade
    if (this._bgImg.src !== src) {
      this._bgImg.classList.remove('is-loaded');
      this._bgImg.src = src;
      this._bgImg.alt = c.title || '';
      this._bgImg.onload = () => this._bgImg.classList.add('is-loaded');
      // Fallback: if already cached the event may not fire
      if (this._bgImg.complete && this._bgImg.naturalWidth) {
        this._bgImg.classList.add('is-loaded');
      }
    }

    // Left accent strip colour
    this._bgStrip.style.background = accent;

    // Eyebrow
    const cat   = c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : '';
    const year  = c.year ? String(c.year) : '';
    this._eyebrow.innerHTML =
      `<span style="color:${accent};font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--tracking-widest);text-transform:uppercase;">${cat}${cat && year ? ' · ' : ''}${year}</span>`;

    // Title
    this._title.textContent = c.title || '';

    // Description
    this._desc.textContent = c.description || '';

    // Meta: CTA button + role badge
    const roleHtml = c.role
      ? `<span class="cv2-meta__role" style="border-color:${accent};">${c.role}</span>`
      : '';
    this._meta.innerHTML = `
      <button
        class="cv2-meta__cta btn btn--primary"
        data-project-id="${id}"
        data-type="case"
        style="--btn-accent:${accent};"
        aria-label="Ver proyecto ${c.title || ''}"
      >Ver proyecto</button>
      ${roleHtml}`;

    // Tags (top-right)
    const tagArr = Array.isArray(c.tags) ? c.tags : [];
    this._tags.innerHTML = tagArr
      .map(t => `<span class="cv2-tag" style="border-color:${accent}40;">${t}</span>`)
      .join('');
  }

  // ─── Strip thumbnails ─────────────────────────────────────────────────────

  _renderStrip(direction = 'next', previousIdx = null, isAdjacent = false) {
    const n   = this.n;
    const idx = this.idx;
    let previousLayout = null;

    if (previousIdx !== null) {
      previousLayout = {
        stageRect: this._stage.getBoundingClientRect(),
        needleRect: this._track.querySelector('.cv2-needle')?.getBoundingClientRect(),
        cards: new Map(
          [...this._track.querySelectorAll('.cv2-thumb')].map(thumb => [
            thumb.dataset.role,
            {
              element: thumb,
              rect: thumb.getBoundingClientRect(),
              opacity: getComputedStyle(thumb).opacity
            }
          ])
        )
      };
      this._clearDragOffset();
      this._cancelStripAnimations();
    }

    // Exactamente 3 tarjetas visibles según requerimiento de diseño:
    // 1 a la izquierda del marcador (histórico/loop previo)
    // + Aguja/marcador de selección
    // + 2 a la derecha del marcador (siguientes casos)
    const prevIdx  = (idx - 1 + n) % n;
    const next1Idx = (idx + 1) % n;
    const next2Idx = (idx + 2) % n;

    const html =
      this._thumbHtml(prevIdx, 'prev') +
      this._needleHtml() +
      this._thumbHtml(next1Idx, 'next1') +
      this._thumbHtml(next2Idx, 'next2');

    this._track.innerHTML = html;

    if (previousLayout && !this._firstRender) {
      if (isAdjacent && previousLayout.needleRect) {
        this._animateAdjacentStrip(direction, previousLayout);
      } else {
        this._animateDirectStrip(direction);
      }
    }
    this._firstRender = false;

    // Lazy-load thumb images
    this._track.querySelectorAll('.cv2-thumb__img').forEach(img => {
      if (img.complete && img.naturalWidth) {
        img.classList.add('is-loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      }
    });
  }

  _animateAdjacentStrip(direction, previousLayout) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const nextCards = new Map(
      [...this._track.querySelectorAll('.cv2-thumb')].map(thumb => [
        thumb.dataset.role,
        thumb
      ])
    );
    const needle = previousLayout.needleRect;
    const markerCenterX = needle.left + needle.width / 2;
    const markerCenterY = needle.top + needle.height / 2 - 24;
    const toFeaturedRole = direction === 'next' ? 'prev' : 'next1';
    const fromFeaturedRole = direction === 'next' ? 'next1' : 'prev';
    const departingRole = direction === 'next' ? 'prev' : 'next2';
    const duration = 420;

    const outgoingFeature = previousLayout.cards.get(fromFeaturedRole);
    if (outgoingFeature) {
      const start = outgoingFeature.rect;
      const targetX = markerCenterX - (start.left + start.width / 2);
      const targetY = markerCenterY - (start.top + start.height / 2);
      this._animateGhost(outgoingFeature, previousLayout.stageRect, [
        { transform: 'translate(0, 0) scale(1)', opacity: outgoingFeature.opacity },
        { transform: `translate(${targetX}px, ${targetY}px) scale(0.52)`, opacity: 0 }
      ], duration);
    }

    const departingCard = previousLayout.cards.get(departingRole);
    if (departingCard) {
      const start = departingCard.rect;
      this._animateGhost(departingCard, previousLayout.stageRect, [
        { transform: 'translate(0, 0) scale(1)', opacity: departingCard.opacity },
        {
          transform: `translate(${direction === 'next' ? -90 : 90}px, 0) scale(0.92)`,
          opacity: 0
        }
      ], duration);
    }

    const moves = direction === 'next'
      ? [['next2', 'next1']]
      : [['next1', 'next2']];
    moves.forEach(([fromRole, toRole]) => {
      const from = previousLayout.cards.get(fromRole);
      const to = nextCards.get(toRole);
      if (from && to) this._animateFromRect(to, from.rect, duration);
    });

    const featuredCard = nextCards.get(toFeaturedRole);
    if (featuredCard) {
      const rect = featuredCard.getBoundingClientRect();
      const targetOpacity = getComputedStyle(featuredCard).opacity;
      this._playStripAnimation(featuredCard, [
        {
          transform: `translate(${markerCenterX - (rect.left + rect.width / 2)}px, ${markerCenterY - (rect.top + rect.height / 2)}px) scale(0.52)`,
          transformOrigin: 'center center',
          opacity: 0
        },
        { transform: 'translate(0, 0) scale(1)', transformOrigin: 'center center', opacity: targetOpacity }
      ], duration);
    }

    const enteringRole = direction === 'next' ? 'next2' : 'prev';
    const enteringCard = nextCards.get(enteringRole);
    if (enteringCard) {
      const offset = (enteringCard.getBoundingClientRect().width + 28) * (direction === 'next' ? 1 : -1);
      this._playStripAnimation(enteringCard, [
        { transform: `translateX(${offset}px) scale(0.94)`, opacity: 0 },
        { transform: 'translateX(0) scale(1)', opacity: getComputedStyle(enteringCard).opacity }
      ], duration);
    }
  }

  _animateDirectStrip(direction) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const offset = direction === 'next' ? 36 : -36;
    this._track.querySelectorAll('.cv2-thumb').forEach((thumb, index) => {
      const opacity = getComputedStyle(thumb).opacity;
      this._playStripAnimation(thumb, [
        { transform: `translateX(${offset}px)`, opacity: 0 },
        { transform: 'translateX(0)', opacity }
      ], 360, index * 35);
    });
  }

  _animateFromRect(element, fromRect, duration) {
    const toRect = element.getBoundingClientRect();
    const opacity = getComputedStyle(element).opacity;
    this._playStripAnimation(element, [
      {
        transform: `translate(${fromRect.left - toRect.left}px, ${fromRect.top - toRect.top}px) scale(${fromRect.width / toRect.width}, ${fromRect.height / toRect.height})`,
        transformOrigin: 'top left',
        opacity
      },
      { transform: 'translate(0, 0) scale(1)', transformOrigin: 'top left', opacity }
    ], duration);
  }

  _animateGhost(snapshot, stageRect, keyframes, duration) {
    const ghost = snapshot.element.cloneNode(true);
    const rect = snapshot.rect;
    ghost.classList.add('cv2-thumb--ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('tabindex', '-1');
    ghost.style.position = 'absolute';
    ghost.style.left = `${rect.left - stageRect.left}px`;
    ghost.style.top = `${rect.top - stageRect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.margin = '0';
    ghost.style.flex = 'none';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '5';
    this._stage.appendChild(ghost);
    this._playStripAnimation(ghost, keyframes, duration, 0, () => ghost.remove());
  }

  _playStripAnimation(element, keyframes, duration, delay = 0, onFinish = null) {
    element.style.willChange = 'transform, opacity';
    const animation = element.animate(keyframes, {
      duration,
      delay,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)'
    });
    this._stripAnimations.push(animation);
    animation.onfinish = () => {
      animation.cancel();
      element.style.willChange = '';
      this._stripAnimations = this._stripAnimations.filter(item => item !== animation);
      if (onFinish) onFinish();
    };
  }

  _cancelStripAnimations() {
    this._stripAnimations.forEach(animation => animation.cancel());
    this._stripAnimations = [];
    this._track.querySelectorAll('.cv2-thumb').forEach(thumb => {
      thumb.style.willChange = '';
    });
    this._stage.querySelectorAll('.cv2-thumb--ghost').forEach(ghost => ghost.remove());
  }

  _clearDragOffset() {
    this._track.classList.remove('cv2-strip__track--dragging');
    this._track.style.removeProperty('--cv2-drag-offset');
    this._stage.classList.remove('cv2-stage--dragging');
  }

  _thumbHtml(caseIdx, role) {
    const c      = this.cases[caseIdx];
    const accent = this._accent(c);
    const src    = c.cover || c.coverPlaceholder || '';
    const name   = c.title || '';
    const cat    = c.category ? c.category.toUpperCase() : '';
    const year   = c.year ? String(c.year) : '';
    const sub    = c.subtitle || '';
    const roleClass = role === 'prev' ? ' cv2-thumb--prev' : '';

    return `
      <article
        class="cv2-thumb${roleClass}"
        data-role="${role}"
        data-idx="${caseIdx}"
        role="listitem"
        aria-label="${name}"
        tabindex="0"
        title="${name}"
      >
        <div class="cv2-thumb__img-wrap">
          <img
            class="cv2-thumb__img"
            src="${src}"
            alt="${name}"
            loading="lazy"
            decoding="async"
          >
        </div>
        <div class="cv2-thumb__overlay"></div>
        <div class="cv2-thumb__body">
          <div class="cv2-thumb__header">
            <span class="cv2-thumb__cat" style="color:${accent};">${cat}${cat && year ? ' · ' : ''}${year}</span>
            <span class="cv2-thumb__dot" style="background:${accent};"></span>
          </div>
          <h4 class="cv2-thumb__name">${name}</h4>
          ${sub ? `<p class="cv2-thumb__sub">${sub}</p>` : ''}
        </div>
      </article>`;
  }

  _needleHtml() {
    const c = this.cases[this.idx];
    const accent = this._accent(c);
    // Marcador vectorial: toca el bottom del frame como parte de su geometría,
    // con una circunferencia en la punta (apex) y transición fluida.
    return `
      <div class="cv2-needle" aria-hidden="true">
        <svg
          class="cv2-needle__shape"
          viewBox="0 0 28 120"
          fill="${accent}"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Punta del marcador: circunferencia -->
          <circle cx="14" cy="8" r="5" />
          <!-- Geometría con curvas que nace y toca el bottom de su frame -->
          <path d="
            M 0,120
            C 5,116 9,80 11,36
            C 12,20 16,20 17,36
            C 19,80 23,116 28,120
            Z
          "/>
        </svg>
      </div>`;
  }

  // ─── Orchestrate both panels ──────────────────────────────────────────────

  _render(direction, previousIdx = null, isAdjacent = false) {
    this._renderFeature();
    this._renderStrip(direction, previousIdx, isAdjacent);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  goTo(i) {
    const targetIdx   = ((i % this.n) + this.n) % this.n;
    if (targetIdx === this.idx) return;

    const previousIdx = this.idx;
    const forwardSteps = (targetIdx - this.idx + this.n) % this.n;
    const direction   = forwardSteps <= this.n / 2 ? 'next' : 'prev';
    const isAdjacent = targetIdx === (previousIdx + 1) % this.n
      || targetIdx === (previousIdx - 1 + this.n) % this.n;
    this.idx = targetIdx;
    this._render(direction, previousIdx, isAdjacent);
  }

  next() { this.goTo(this.idx + 1); }
  prev() { this.goTo(this.idx - 1); }

  // ─── Event binding ────────────────────────────────────────────────────────

  _bind() {
    // Nav buttons
    this._prevBtn && this._prevBtn.addEventListener('click', e => { e.stopPropagation(); this.prev(); });
    this._nextBtn && this._nextBtn.addEventListener('click', e => { e.stopPropagation(); this.next(); });

    // Keyboard on stage
    this._stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
    });

    // Keyboard on thumbs (Enter / Space)
    this._track.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const thumb = e.target.closest('.cv2-thumb');
        if (thumb) {
          e.preventDefault();
          const i = parseInt(thumb.dataset.idx, 10);
          if (!isNaN(i)) this.goTo(i);
        }
      }
    });

    this._track.addEventListener('click', e => {
      const thumb = e.target.closest('.cv2-thumb');
      if (!thumb) return;
      const index = Number.parseInt(thumb.dataset.idx, 10);
      if (!Number.isNaN(index)) this.goTo(index);
    });

    this._bindDrag();
  }

  _bindDrag() {
    let pointer = null;
    let suppressClick = false;
    const DRAG_THRESHOLD = 50;
    const INTENT_THRESHOLD = 6;
    const suppressNextClick = () => {
      suppressClick = true;
    };

    this._stage.addEventListener('pointerdown', e => {
      suppressClick = false;
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (e.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;

      pointer = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        isDragging: false
      };
    });

    window.addEventListener('pointermove', e => {
      if (!pointer || e.pointerId !== pointer.id) return;

      const deltaX = e.clientX - pointer.startX;
      const deltaY = e.clientY - pointer.startY;
      if (!pointer.isDragging) {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < INTENT_THRESHOLD) return;
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          pointer = null;
          suppressNextClick();
          return;
        }
        pointer.isDragging = true;
      }

      const offset = Math.max(-180, Math.min(180, deltaX));
      this._track.style.setProperty('--cv2-drag-offset', `${offset}px`);
      this._track.classList.add('cv2-strip__track--dragging');
      this._stage.classList.add('cv2-stage--dragging');
      e.preventDefault();
    });

    window.addEventListener('pointerup', e => {
      if (!pointer || e.pointerId !== pointer.id) return;

      const deltaX = e.clientX - pointer.startX;
      const dragged = pointer.isDragging;
      pointer = null;
      if (!dragged) return;

      suppressNextClick();

      if (Math.abs(deltaX) >= DRAG_THRESHOLD) {
        deltaX < 0 ? this.next() : this.prev();
      } else {
        this._clearDragOffset();
      }
    });

    window.addEventListener('pointercancel', e => {
      if (!pointer || e.pointerId !== pointer.id) return;
      pointer = null;
      this._clearDragOffset();
    });

    this._stage.addEventListener('click', e => {
      if (!suppressClick) return;
      suppressClick = false;
      if (e.detail === 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    this._stage.addEventListener('dragstart', e => e.preventDefault());
  }
}

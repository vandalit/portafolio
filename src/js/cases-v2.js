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

  _renderStrip() {
    const n   = this.n;
    const idx = this.idx;

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
      this._thumbHtml(next1Idx, 'next') +
      this._thumbHtml(next2Idx, 'next');

    this._track.innerHTML = html;

    // Bind thumb clicks
    this._track.querySelectorAll('.cv2-thumb').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.idx, 10);
        if (!isNaN(i)) this.goTo(i);
      });
    });

    // Lazy-load thumb images
    this._track.querySelectorAll('.cv2-thumb__img').forEach(img => {
      if (img.complete && img.naturalWidth) {
        img.classList.add('is-loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      }
    });
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

  _render() {
    this._renderFeature();
    this._renderStrip();
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  goTo(i) {
    this.idx = ((i % this.n) + this.n) % this.n;
    this._render();
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

    // Drag / swipe on stage
    let dragStartX = null;
    const DRAG_THRESHOLD = 50;

    const onDragStart = e => {
      dragStartX = e.type.startsWith('touch')
        ? e.touches[0].clientX
        : e.clientX;
    };

    const onDragEnd = e => {
      if (dragStartX === null) return;
      const endX = e.type.startsWith('touch')
        ? (e.changedTouches[0]?.clientX ?? dragStartX)
        : e.clientX;
      const diff = endX - dragStartX;
      dragStartX = null;
      if (Math.abs(diff) < DRAG_THRESHOLD) return;
      diff < 0 ? this.next() : this.prev();
    };

    this._stage.addEventListener('mousedown',  onDragStart);
    this._stage.addEventListener('mouseup',    onDragEnd);
    this._stage.addEventListener('touchstart', onDragStart, { passive: true });
    this._stage.addEventListener('touchend',   onDragEnd,   { passive: true });

    // Prevent drag from accidentally opening modals
    this._stage.addEventListener('click', e => {
      // allow clicks on .cv2-meta__cta (modal triggers) and thumbs
      // suppress only if a drag occurred (dragStartX was nulled after a real swipe)
    });
  }
}


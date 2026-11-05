const TRACK_COPIES = 5;
const IMPULSE_FRICTION_MS = 360;
const MAX_IMPULSE_STEPS = 6;
const MIN_FLICK_SPEED = 0.22;
const POINTER_SAMPLE_WINDOW_MS = 100;
const DIVIDER_BOUNCE_DURATION_MS = 140;
const DIVIDER_BOUNCE_COMPRESS = 0.9;
const DIVIDER_BOUNCE_OVERSHOOT = 1.05;
const DIVIDER_MAIN_BOUNCE_GROWTH = 1.05;
const CATEGORY_SIGILS = {
  coding: '✦',
  multimedia: '◈',
  ux: '◈',
  design: '◈',
  commercial: '¤',
  comercial: '¤'
};

const mod = (value, length) => ((value % length) + length) % length;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

export class CasesV4 {
  constructor(cases, root = document.getElementById('cases-v4')) {
    if (!root || !cases?.length) {
      console.warn('[CasesV4] Missing root element or case study data');
      return;
    }

    this.root = root;
    this.items = cases.map(item => ({
      ...item,
      image: item.cover || item.coverPlaceholder || ''
    }));
    this.viewports = [...root.querySelectorAll('.cv4-carousel__viewport')];
    this.currentIndex = 0;
    this.anchorSlot = this.items.length * 2 + this.currentIndex;
    this._scrollTimers = new WeakMap();
    this._programmaticTimers = new WeakMap();
    this._scrollOrigins = new WeakMap();
    this._wheelTimer = 0;
    this._wheelSource = null;
    this._pointer = null;
    this._lastDragClick = null;
    this._momentumFrame = 0;
    this._momentum = false;
    this._momentumSource = null;
    this._featuredContentHidden = false;
    this._featuredDirection = 1;
    this._featuredMorph = null;
    this._featuredBackgroundRequest = null;
    this._decodedFeaturedImages = new Map();
    this._dividerPendingScrolls = new Set();
    this._dividerBoundaryPositions = {
      compactRight: new WeakMap(),
      wideLeft: new WeakMap(),
      wideMidpoint: new WeakMap()
    };
    this._dividerBounceAnimations = new Map();
    this._dividerBounceRunning = new Set();
    this._dividerBounceRunIds = { main: 0, left: 0, right: 0 };
    this._dividerReleasePending = false;
    this._exitPulseDistance = Number.parseFloat(
      getComputedStyle(root).getPropertyValue('--cv4-exit-pulse-distance')
    ) || 100;
    this._exitPulseScale = Number.parseFloat(
      getComputedStyle(root).getPropertyValue('--cv4-exit-pulse-scale')
    ) || 0.88;
    this._renderTracks();
    this._bind();
    this._updateFeatured();
    this._positionWindows();
  }

  _renderTracks() {
    this.viewports.forEach(viewport => {
      const track = viewport.querySelector('.cv4-carousel__track');
      if (!track) return;

      track.innerHTML = Array.from({ length: TRACK_COPIES }, (_, copy) =>
        this.items.map((item, index) => `
          <article
            class="cv4-item"
            data-item-id="${escapeHTML(item.id)}"
            data-project-id="${escapeHTML(item.id)}"
            data-type="case"
            data-index="${index}"
            data-slot="${copy * this.items.length + index}"
            role="button"
            tabindex="${copy === 2 ? '0' : '-1'}"
            aria-hidden="${copy !== 2}"
            aria-label="Ver caso: ${escapeHTML(item.title)}"
          >
            <img class="cv4-item__image" alt="" aria-hidden="true" loading="lazy" decoding="async">
            <span class="cv4-item__index">${String(index + 1).padStart(2, '0')}</span>
            <div class="cv4-item__copy">
              <div class="cv4-item__eyebrow">
                <span class="cv4-item__sigil" aria-hidden="true">${this._getCategorySigil(item)}</span>
                <span class="cv4-item__role">${escapeHTML(item.role)}</span>
              </div>
              <h3 class="cv4-item__title">${escapeHTML(item.title)}</h3>
              <div class="cv4-item__tags">
                ${(Array.isArray(item.tags) ? item.tags : []).map(tag => `
                  <span class="cv4-item__tag">${escapeHTML(tag)}</span>
                `).join('')}
              </div>
            </div>
          </article>
        `).join('')
      ).join('');

      track.querySelectorAll('.cv4-item').forEach(card => {
        const item = this.items[Number(card.dataset.index)];
        card.style.setProperty('--cv4-accent-color', this._getAccentColor(item));
      });
      track.querySelectorAll('.cv4-item__image').forEach(image => {
        image.src = this.items[Number(image.closest('.cv4-item').dataset.index)].image;
      });
    });
  }

  _bind() {
    this.viewports.forEach(viewport => {
      viewport.addEventListener('scroll', () => this._onScroll(viewport), { passive: true });
      viewport.addEventListener('scrollend', () => this._onScrollEnd(viewport));
      viewport.addEventListener('pointerdown', () => {
        this._cancelProgrammaticScroll(viewport);
        this._clearFeaturedMorph();
      });
      viewport.addEventListener('wheel', () => {
        this._cancelProgrammaticScroll(viewport);
        this._clearFeaturedMorph();
      }, { passive: true });
      viewport.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        this._goTo(event.key === 'ArrowRight' ? 1 : -1);
      });
    });
    this.root.addEventListener('click', event => {
      const card = event.target.closest('.cv4-item[data-project-id]');
      if (card && this._isDragClick(event, card)) {
        event.preventDefault();
        event.stopPropagation();
        this._lastDragClick = null;
        return;
      }

      const button = event.target.closest('[data-cv4-step]');
      if (!button) return;
      this._goTo(Number(button.dataset.cv4Step));
    });

    this.root.addEventListener('keydown', event => {
      if (event.key !== ' ') return;
      const card = event.target.closest('.cv4-item[role="button"]');
      if (!card) return;
      event.preventDefault();
    });

    this.root.addEventListener('keyup', event => {
      if (event.key !== ' ') return;
      const card = event.target.closest('.cv4-item[role="button"]');
      if (!card) return;
      event.preventDefault();
      card.click();
    });

    this.root.addEventListener('wheel', event => {
      if (event.target.closest('button')) return;
      const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
      const hasHorizontalIntent = event.shiftKey
        ? horizontalDelta !== 0
        : Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.15;
      if (!hasHorizontalIntent) return;

      event.preventDefault();
      this._clearFeaturedMorph();
      if (this._momentumFrame) this._cancelMomentum(false);
      this.viewports.forEach(viewport => this._cancelProgrammaticScroll(viewport));

      const source = event.target.closest('.cv4-carousel__viewport')
        || this.root.querySelector('.cv4-carousel--wide .cv4-carousel__viewport');
      if (!source) return;
      this._setDividerMotion(horizontalDelta);

      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? source.clientWidth
          : 1;
      this.viewports.forEach(viewport => {
        window.clearTimeout(this._scrollTimers.get(viewport));
        this._scrollTimers.delete(viewport);
      });

      const sourceStride = this._stride(source);
      const slotDelta = horizontalDelta * unit / sourceStride;
      this._wheelSource = source;
      this.viewports.forEach(viewport => {
        viewport.scrollLeft += slotDelta * this._stride(viewport);
        this._updateCarouselEdgePulse(viewport);
      });
      window.clearTimeout(this._wheelTimer);
      this._wheelTimer = window.setTimeout(() => this._settleWheel(source), 140);
    }, { passive: false });

    this._bindPointerDrag();
    window.addEventListener('resize', () => this._positionWindows(false));
  }

  _clearFeaturedMorph() {
    window.clearTimeout(this._featuredMorphTimer);
    this._featuredMorph = null;
    this._updateFeaturedBackground(0);
  }

  _beginFeaturedMorph(direction, fromIndex = this.currentIndex, anchorSlot = this.anchorSlot) {
    const step = Math.sign(direction);
    if (!step) return;

    window.clearTimeout(this._featuredMorphTimer);
    this._featuredMorph = {
      kind: 'control',
      direction: step,
      fromIndex,
      toIndex: mod(fromIndex + step, this.items.length),
      slot: mod(anchorSlot + (step > 0 ? 1 : 0), this.items.length * TRACK_COPIES)
    };
  }

  _goTo(step) {
    if (!Number.isInteger(step) || step === 0) return;
    if (this._momentumFrame) this._cancelMomentum(true);
    const previousIndex = this.currentIndex;
    const previousAnchorSlot = this.anchorSlot;
    this.currentIndex = mod(this.currentIndex + step, this.items.length);
    this.anchorSlot += step;
    this._setDividerMotion(step);
    window.clearTimeout(this._featuredMorphTimer);
    this._featuredMorph = null;
    if (Math.abs(step) === 1) {
      this._beginFeaturedMorph(step, previousIndex, previousAnchorSlot);
      const morph = this._featuredMorph;
      this._featuredMorphTimer = window.setTimeout(() => {
        if (this._featuredMorph !== morph) return;
        this._clearFeaturedMorph();
      }, 550);
    }
    this._updateFeatured();
    this._positionWindows(true);
    this._scheduleRecenter();
  }

  _setDividerMotion(direction) {
    if (!direction) return;
    this._featuredDirection = Math.sign(direction);
    this._hideFeaturedContent();

    const divider = this.root.querySelector('.cv4-divider');
    if (!divider) return;

    this._dividerPendingScrolls.clear();
    this._dividerReleasePending = false;
    const nextDirection = direction > 0 ? 'forward' : 'backward';
    const directionChanged = divider.dataset.direction
      && divider.dataset.direction !== nextDirection;
    divider.dataset.direction = nextDirection;
    divider.classList.add('is-tracking');

    if (directionChanged) {
      ['left', 'right'].forEach(target => {
        const animation = this._dividerBounceAnimations.get(target);
        if (!animation) return;
        animation.cancel();
        this._dividerBounceAnimations.delete(target);
        this._dividerBounceRunning.delete(target);
        this._dividerBounceRunIds[target] += 1;
      });
    }
  }

  _releaseDividerMotion() {
    this._dividerPendingScrolls.clear();
    if (this._dividerBounceRunning.size) {
      this._dividerReleasePending = true;
      return;
    }

    this._finishDividerMotion();
  }

  _finishDividerMotion() {
    this._dividerReleasePending = false;
    const divider = this.root.querySelector('.cv4-divider');
    divider?.classList.remove('is-tracking');
    divider?.removeAttribute('data-direction');
    this._showFeaturedContent(this._featuredDirection);
  }

  _hideFeaturedContent() {
    const content = this.root.querySelector('.cv4-featured__content');
    if (!content || this._featuredContentHidden) return;

    content.getAnimations().forEach(animation => animation.cancel());
    content.classList.add('is-transition-hidden');
    content.inert = true;
    content.setAttribute('aria-hidden', 'true');
    this._featuredContentHidden = true;
  }

  _showFeaturedContent(direction) {
    const content = this.root.querySelector('.cv4-featured__content');
    if (!content || !this._featuredContentHidden) return;

    content.classList.remove('is-transition-hidden');
    content.inert = false;
    content.removeAttribute('aria-hidden');
    this._featuredContentHidden = false;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const offset = direction > 0 ? 8 : -8;
    const animation = content.animate(
      [
        { opacity: 0, transform: `translateX(${offset}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ],
      { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
    animation.onfinish = () => animation.cancel();
  }

  _queueDividerBounce(target, count) {
    if (!count || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const divider = this.root.querySelector('.cv4-divider');
    if (!divider?.classList.contains('is-tracking')) return;

    this._dividerReleasePending = false;
    this._playDividerBounce(target);
  }

  _playDividerBounce(target) {
    const divider = this.root.querySelector('.cv4-divider');
    if (!divider?.classList.contains('is-tracking')) return;

    this._dividerBounceAnimations.get(target)?.cancel();
    this._dividerBounceRunning.add(target);
    const runId = ++this._dividerBounceRunIds[target];
    const element = target === 'main'
      ? divider.querySelector('.cv4-divider__bar--main')
      : divider.querySelector(`.cv4-divider__bar--${target}`);
    const direction = divider.dataset.direction;
    const sideScale = direction === 'forward'
      ? { left: 1.1, right: 0.9 }
      : { left: 0.9, right: 1.1 };
    const multipliers = target === 'main'
      ? [1, 0.98, DIVIDER_MAIN_BOUNCE_GROWTH, 1]
      : [1, DIVIDER_BOUNCE_COMPRESS, DIVIDER_BOUNCE_OVERSHOOT, 1];
    const offsets = [0, 0.35, 0.68, 1];
    const baselineScale = target === 'main' ? 1 : sideScale[target];
    const animation = element.animate(
      multipliers.map((factor, index) => ({
        transform: target === 'main'
          ? `translate(-50%, -50%) scaleY(${factor})`
          : `translateY(-50%) scaleY(${baselineScale * factor})`,
        offset: offsets[index]
      })),
      { duration: DIVIDER_BOUNCE_DURATION_MS, easing: 'ease-out' }
    );
    this._dividerBounceAnimations.set(target, animation);

    animation.finished.catch(() => {}).then(() => {
      if (runId !== this._dividerBounceRunIds[target]) return;
      this._dividerBounceAnimations.delete(target);
      this._dividerBounceRunning.delete(target);
      if (this._dividerReleasePending && !this._dividerBounceRunning.size) {
        this._finishDividerMotion();
      }
    });
  }

  _updateFeatured() {
    const item = this.items[this.currentIndex];
    const content = this.root.querySelector('.cv4-featured__content');
    const featured = this.root.querySelector('.cv4-featured');
    const eyebrow = this.root.querySelector('.cv4-featured__eyebrow');
    const title = this.root.querySelector('.cv4-featured__title');
    const description = this.root.querySelector('.cv4-featured__description');
    if (!content || !featured || !eyebrow || !title || !description) return;

    content.getAnimations().forEach(animation => animation.cancel());
    this._setFeaturedContent(item, featured, eyebrow, title, description);
  }

  _setFeaturedContent(item, featured, eyebrow, title, description) {
    featured.dataset.activeItem = item.id;
    featured.style.setProperty('--cv4-accent-color', this._getAccentColor(item));
    eyebrow.replaceChildren();
    const sigil = this._getCategorySigil(item);
    if (sigil) {
      const sigilElement = document.createElement('span');
      sigilElement.className = 'cv4-featured__sigil';
      sigilElement.setAttribute('aria-hidden', 'true');
      sigilElement.textContent = sigil;
      eyebrow.append(sigilElement);
    }
    eyebrow.append(document.createTextNode(
      `${item.category} · Caso ${String(this.currentIndex + 1).padStart(2, '0')}`
    ));
    title.textContent = item.title;
    description.textContent = item.description || '';

    const cta = featured.querySelector('.cv4-featured__cta');
    if (cta) {
      cta.dataset.projectId = item.id;
      cta.dataset.type = 'case';
      cta.setAttribute('aria-label', `Ver caso: ${item.title}`);
    }

    const year = featured.querySelector('[data-cv4-featured-year]');
    if (year) {
      year.textContent = item.year ? String(item.year) : '';
      year.hidden = !item.year;
    }

    const role = featured.querySelector('[data-cv4-featured-role]');
    if (role) {
      role.textContent = item.role || '';
      role.hidden = !item.role;
    }

    const itemNumber = this.root.querySelector('[data-cv4-item-number]');
    if (itemNumber) itemNumber.textContent = String(this.currentIndex + 1).padStart(2, '0');
  }

  _getAccentColor(item) {
    const color = String(item?.accentColor || '').trim();
    return color && CSS.supports('color', color) ? color : 'var(--lime)';
  }

  _getCategorySigil(item) {
    return CATEGORY_SIGILS[String(item?.category || '').trim().toLowerCase()] || '';
  }

  _decodeFeaturedImage(src) {
    if (!src) return Promise.resolve();
    const cached = this._decodedFeaturedImages.get(src);
    if (cached) return cached;

    const image = new Image();
    image.src = src;
    const decoded = typeof image.decode === 'function'
      ? image.decode()
      : new Promise((resolve, reject) => {
        if (image.complete) {
          if (image.naturalWidth > 0) resolve();
          else reject(new Error(`Unable to load featured image: ${src}`));
          return;
        }
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', () => reject(new Error(`Unable to load featured image: ${src}`)), { once: true });
      });

    const cachedDecode = decoded.catch(error => {
      this._decodedFeaturedImages.delete(src);
      throw error;
    });
    this._decodedFeaturedImages.set(src, cachedDecode);
    return cachedDecode;
  }

  _updateFeaturedBackground(progress, fromIndex = this.currentIndex, toIndex = mod(fromIndex + 1, this.items.length)) {
    const requestKey = `${fromIndex}:${toIndex}`;
    let request = this._featuredBackgroundRequest;
    if (request?.key === requestKey) {
      request.progress = progress;
      if (request.ready) this._applyFeaturedBackground(request);
      return;
    }

    request = {
      key: requestKey,
      fromIndex,
      toIndex,
      progress,
      ready: false
    };
    this._featuredBackgroundRequest = request;

    Promise.all([
      this._decodeFeaturedImage(this.items[fromIndex].image),
      this._decodeFeaturedImage(this.items[toIndex].image)
    ]).then(() => {
      if (this._featuredBackgroundRequest !== request) return;
      request.ready = true;
      this._applyFeaturedBackground(request);
    }).catch(error => {
      if (this._featuredBackgroundRequest !== request) return;
      console.warn('[CasesV4] Could not decode featured images before transition:', error);
      request.ready = true;
      this._applyFeaturedBackground(request);
    });
  }

  _applyFeaturedBackground(request) {
    const activeSrc = this.items[request.fromIndex].image;
    const incomingSrc = this.items[request.toIndex].image;
    const imageLayers = [
      {
        active: this.root.querySelector('[data-featured-layer="active"]'),
        incoming: this.root.querySelector('[data-featured-layer="incoming"]')
      },
      {
        active: this.root.querySelector('[data-cv4-backdrop-layer="active"]'),
        incoming: this.root.querySelector('[data-cv4-backdrop-layer="incoming"]')
      }
    ];

    imageLayers.forEach(({ active, incoming }) => {
      if (!active || !incoming) return;
      if (active.getAttribute('src') !== activeSrc) active.src = activeSrc;
      if (incoming.getAttribute('src') !== incomingSrc) incoming.src = incomingSrc;
      incoming.style.opacity = String(request.progress);
    });

    const itemNumber = this.root.querySelector('[data-cv4-item-number]');
    if (itemNumber) {
      const activeIndex = request.progress > 0 ? request.toIndex : request.fromIndex;
      itemNumber.textContent = String(activeIndex + 1).padStart(2, '0');
    }
  }

  _positionWindows(smooth = false) {
    this._dividerPendingScrolls.clear();
    this.viewports.forEach((viewport, index) => {
      const slot = this.anchorSlot + (index === 0 ? -1 : 1);
      const item = viewport.querySelector(`.cv4-item[data-slot="${mod(slot, this.items.length * TRACK_COPIES)}"]`);
      if (!item) return;

      const viewportRect = viewport.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const trackPadding = parseFloat(getComputedStyle(item.parentElement).paddingLeft) || 0;
      const inset = viewport.clientLeft + trackPadding;
      const target = Math.max(0, viewport.scrollLeft + itemRect.left - viewportRect.left - inset);
      if (this._scrollTo(viewport, target, smooth)) this._dividerPendingScrolls.add(viewport);
      this._setWindowSlot(viewport, slot);
      this._scrollOrigins.set(viewport, target);
    });
    this.viewports.forEach(viewport => this._updateCarouselEdgePulse(viewport));
    if (!this._dividerPendingScrolls.size && !this._pointer && !this._momentum && !this._wheelSource) {
      this._releaseDividerMotion();
    }
  }

  _updateCarouselEdgePulse(viewport) {
    if (viewport.closest('.cv4-carousel--compact')) {
      const clipRight = viewport.getBoundingClientRect().left
        + viewport.clientLeft + viewport.clientWidth;
      let boundaryCrossings = 0;
      [...viewport.querySelectorAll('.cv4-item')].forEach(item => {
        const rect = item.getBoundingClientRect();
        const unscaledRight = rect.right + (item.offsetWidth - rect.width) / 2;
        const previousRight = this._dividerBoundaryPositions.compactRight.get(item);
        if (previousRight !== undefined
          && (previousRight < clipRight) !== (unscaledRight < clipRight)) {
          boundaryCrossings += 1;
        }
        this._dividerBoundaryPositions.compactRight.set(item, unscaledRight);
        const visibility = Math.max(0, Math.min(1,
          (clipRight - unscaledRight + this._exitPulseDistance) / this._exitPulseDistance
        ));
        const scale = this._exitPulseScale + (1 - this._exitPulseScale) * visibility;
        item.style.setProperty('--cv4-right-edge-opacity', visibility.toFixed(3));
        item.style.setProperty('--cv4-right-edge-scale', scale.toFixed(3));
      });
      // this._queueDividerBounce('left', boundaryCrossings);
      return;
    }

    if (!viewport.closest('.cv4-carousel--wide')) return;

    const clipLeft = viewport.getBoundingClientRect().left + viewport.clientLeft;
    const controlMorph = this._featuredMorph?.kind === 'control' ? this._featuredMorph : null;
    let rightBoundaryCrossings = 0;
    let centerBoundaryCrossings = 0;
    const items = [...viewport.querySelectorAll('.cv4-item')].map(item => {
      const rect = item.getBoundingClientRect();
      const unscaledLeft = rect.left - (item.offsetWidth - rect.width) / 2;
      const previousLeft = this._dividerBoundaryPositions.wideLeft.get(item);
      const previousMidpointPosition = this._dividerBoundaryPositions.wideMidpoint.get(item);
      if (previousLeft !== undefined) {
        if ((previousLeft < clipLeft) !== (unscaledLeft < clipLeft)) {
          rightBoundaryCrossings += 1;
        }
      }
      const midpointBoundary = clipLeft - this._exitPulseDistance / 2;
      const currentMidpointPosition = unscaledLeft < midpointBoundary;
      if (previousMidpointPosition !== undefined
        && previousMidpointPosition !== currentMidpointPosition) {
        centerBoundaryCrossings += 1;
      }
      this._dividerBoundaryPositions.wideLeft.set(item, unscaledLeft);
      this._dividerBoundaryPositions.wideMidpoint.set(item, currentMidpointPosition);
      const visibility = Math.max(0, Math.min(1,
        (unscaledLeft - clipLeft + this._exitPulseDistance) / this._exitPulseDistance
      ));
      if (controlMorph && Number(item.dataset.slot) === controlMorph.slot) {
        controlMorph.progress = controlMorph.direction > 0 ? 1 - visibility : visibility;
      }
      return {
        item,
        opacity: visibility,
        scale: this._exitPulseScale + (1 - this._exitPulseScale) * visibility
      };
    });

    // this._queueDividerBounce('right', rightBoundaryCrossings);
    // this._queueDividerBounce('main', centerBoundaryCrossings);
    items.forEach(({ item, opacity, scale }) => {
      item.style.setProperty('--cv4-left-edge-opacity', opacity.toFixed(3));
      item.style.setProperty('--cv4-left-edge-scale', scale.toFixed(3));
    });
    if (controlMorph) {
      this._updateFeaturedBackground(
        controlMorph.progress,
        controlMorph.fromIndex,
        controlMorph.toIndex
      );
      return;
    }

    // Measure against the settled position so each crossed pulse stays reversible.
    const origin = this._scrollOrigins.get(viewport) ?? viewport.scrollLeft;
    const displacement = viewport.scrollLeft - origin;
    const stride = this._stride(viewport);
    const totalSlots = this.items.length * TRACK_COPIES;
    const clampProgress = value => Math.max(0, Math.min(1, value));

    if (displacement >= 0) {
      const firstSlot = mod(this.anchorSlot + 1, totalSlots);
      const firstItem = viewport.querySelector(`.cv4-item[data-slot="${firstSlot}"]`);
      if (!firstItem) return;
      const rect = firstItem.getBoundingClientRect();
      const initialLeft = rect.left - (firstItem.offsetWidth - rect.width) / 2
        - clipLeft + displacement;
      const completed = Math.max(0, Math.floor(
        (displacement - initialLeft - this._exitPulseDistance) / stride
      ) + 1);
      const slot = mod(this.anchorSlot + 1 + completed, totalSlots);
      const toIndex = mod(slot, this.items.length);
      const progress = clampProgress(
        (displacement - initialLeft - completed * stride) / this._exitPulseDistance
      );
      this._updateFeaturedBackground(progress, mod(toIndex - 1, this.items.length), toIndex);
      return;
    }

    const firstSlot = mod(this.anchorSlot, totalSlots);
    const firstItem = viewport.querySelector(`.cv4-item[data-slot="${firstSlot}"]`);
    if (!firstItem) return;
    const rect = firstItem.getBoundingClientRect();
    const initialLeft = rect.left - (firstItem.offsetWidth - rect.width) / 2
      - clipLeft + displacement;
    const distance = -displacement;
    const completed = Math.max(0, Math.floor((distance + initialLeft) / stride) + 1);
    const slot = mod(this.anchorSlot - completed, totalSlots);
    const toIndex = mod(slot - 1, this.items.length);
    const progress = clampProgress(
      (distance + initialLeft - completed * stride + this._exitPulseDistance)
        / this._exitPulseDistance
    );
    this._updateFeaturedBackground(progress, mod(toIndex + 1, this.items.length), toIndex);
  }

  _stride(viewport) {
    const items = viewport.querySelectorAll('.cv4-item');
    if (items.length < 2) return items[0]?.offsetWidth || 1;
    return items[1].offsetLeft - items[0].offsetLeft;
  }

  _setWindowSlot(viewport, slot) {
    viewport.dataset.windowSlot = String(slot);
  }

  _scrollTo(viewport, left, smooth = true) {
    const shouldScroll = Math.abs(viewport.scrollLeft - left) > 0.5;
    if (!shouldScroll) {
      this._cancelProgrammaticScroll(viewport);
      return false;
    }

    const behavior = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'smooth'
      : 'auto';
    window.clearTimeout(this._scrollTimers.get(viewport));
    this._scrollTimers.delete(viewport);
    viewport.scrollTo({ left, behavior });
    this._cancelProgrammaticScroll(viewport);
    this._programmaticTimers.set(viewport, window.setTimeout(
      () => this._programmaticTimers.delete(viewport),
      behavior === 'smooth' ? 500 : 120
    ));
    return true;
  }

  _cancelProgrammaticScroll(viewport) {
    window.clearTimeout(this._programmaticTimers.get(viewport));
    this._programmaticTimers.delete(viewport);
  }

  _onScroll(source) {
    this._updateCarouselEdgePulse(source);
    if (this._pointer || this._momentum || this._wheelSource || this._programmaticTimers.has(source)) return;
    window.clearTimeout(this._scrollTimers.get(source));
    this._scrollTimers.set(source, window.setTimeout(() => {
      const slot = this._nearestSlot(source);
      const previousSlot = Number(source.dataset.windowSlot);
      const step = slot - previousSlot;
      if (!step) {
        this._clearFeaturedMorph();
        this._releaseDividerMotion();
        return;
      }

      this._setWindowSlot(source, slot);
      this.anchorSlot += step;
      this.currentIndex = mod(this.currentIndex + step, this.items.length);
      this._setDividerMotion(step);
      this._clearFeaturedMorph();
      this._updateFeatured();
      this._positionWindows(true);
      this._scheduleRecenter();
    }, 140));
  }

  _settleWheel(source) {
    if (this._wheelSource !== source) return;
    this._wheelSource = null;
    this._wheelTimer = 0;

    const previousSlot = Number(source.dataset.windowSlot);
    const slot = this._nearestSlot(source);
    const steps = slot - previousSlot;
    if (!steps) {
      this._positionWindows(false);
      this._releaseDividerMotion();
      return;
    }

    this._setWindowSlot(source, slot);
    this.currentIndex = mod(this.currentIndex + steps, this.items.length);
    this.anchorSlot += steps;
    this._setDividerMotion(steps);
    this._clearFeaturedMorph();
    this._updateFeatured();
    this._positionWindows(true);
    this._scheduleRecenter();
  }

  _onScrollEnd(source) {
    this._cancelProgrammaticScroll(source);
    if (!this._dividerPendingScrolls.delete(source)) return;
    if (this._dividerPendingScrolls.size || this._pointer || this._momentum || this._wheelSource) return;
    this._releaseDividerMotion();
  }

  _nearestSlot(viewport) {
    const track = viewport.querySelector('.cv4-carousel__track');
    const trackPadding = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const viewportLeft = viewport.getBoundingClientRect().left + viewport.clientLeft + trackPadding;
    return [...viewport.querySelectorAll('.cv4-item')].reduce((best, item) => {
      const distance = Math.abs(item.getBoundingClientRect().left - viewportLeft);
      return distance < best.distance
        ? { slot: Number(item.dataset.slot), distance }
        : best;
    }, { slot: Number(viewport.dataset.windowSlot), distance: Infinity }).slot;
  }

  _bindPointerDrag() {
    this.viewports.forEach(viewport => {
      viewport.addEventListener('pointerdown', event => {
        if (!event.target.closest('.cv4-item')) return;
        this._lastDragClick = null;
        if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
        if (this._pointer) return;
        this._cancelMomentum(false);
        this.viewports.forEach(item => this._cancelProgrammaticScroll(item));

        this._pointer = {
          id: event.pointerId,
          source: viewport,
          startX: event.clientX,
          startY: event.clientY,
          startScrolls: this.viewports.map(item => item.scrollLeft),
          strides: this.viewports.map(item => this._stride(item)),
          dragging: false,
          samples: [{ x: event.clientX, time: event.timeStamp }]
        };
      });
    });

    window.addEventListener('pointermove', event => {
      const gesture = this._pointer;
      if (!gesture || event.pointerId !== gesture.id) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      this._recordPointerSample(gesture, event);
      if (!gesture.dragging) {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 5) return;
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          this._pointer = null;
          return;
        }
        gesture.dragging = true;
        this.viewports.forEach(viewport => viewport.classList.add('is-dragging'));
      }

      this._setDividerMotion(-deltaX);
      const progress = -deltaX / gesture.strides[this.viewports.indexOf(gesture.source)];
      this.viewports.forEach((viewport, index) => {
        viewport.scrollLeft = gesture.startScrolls[index] + progress * gesture.strides[index];
        this._updateCarouselEdgePulse(viewport);
      });
      event.preventDefault();
    });

    window.addEventListener('pointerup', event => this._finishDrag(event, false));
    window.addEventListener('pointercancel', event => this._finishDrag(event, true));
  }

  _finishDrag(event, cancelled) {
    const gesture = this._pointer;
    if (!gesture || event.pointerId !== gesture.id) return;
    this._pointer = null;
    this.viewports.forEach(viewport => viewport.classList.remove('is-dragging'));
    if (!gesture.dragging) {
      this._clearFeaturedMorph();
      this._releaseDividerMotion();
      return;
    }

    if (!cancelled) {
      this._lastDragClick = {
        pointerId: event.pointerId,
        source: gesture.source,
        x: event.clientX,
        y: event.clientY,
        time: performance.now()
      };
    }

    const sourceStride = gesture.strides[this.viewports.indexOf(gesture.source)];
    if (!cancelled) this._recordPointerSample(gesture, event);
    const releaseTime = event.timeStamp;
    const velocity = cancelled ? 0 : -this._estimatePointerVelocity(gesture, releaseTime);
    if (event.clientX !== gesture.startX) this._setDividerMotion(gesture.startX - event.clientX);
    const distance = this._momentumDistance(velocity, sourceStride);
    if (distance && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._setDividerMotion(distance);
      this._startMomentum(gesture.source, sourceStride, distance);
      return;
    }

    this._settleDrag(gesture.source, cancelled);
  }

  _isDragClick(event, card) {
    const drag = this._lastDragClick;
    if (!drag || event.detail === 0 || performance.now() - drag.time > 500) return false;
    if (card.closest('.cv4-carousel__viewport') !== drag.source) return false;
    if (typeof event.pointerId === 'number' && event.pointerId !== drag.pointerId) return false;
    return Math.hypot(event.clientX - drag.x, event.clientY - drag.y) <= 32;
  }

  _recordPointerSample(gesture, event) {
    const samples = gesture.samples;
    const time = event.timeStamp || performance.now();
    const previous = samples[samples.length - 1];
    if (Math.abs(event.clientX - previous.x) > 0.5) {
      samples.push({ x: event.clientX, time });
    }
    while (samples.length > 2 && time - samples[1].time > POINTER_SAMPLE_WINDOW_MS) {
      samples.shift();
    }
  }

  _estimatePointerVelocity(gesture, releaseTime) {
    const samples = gesture.samples;
    const last = samples[samples.length - 1];
    if (!last || releaseTime - last.time > POINTER_SAMPLE_WINDOW_MS) return 0;
    const first = samples.find(sample => releaseTime - sample.time <= POINTER_SAMPLE_WINDOW_MS);
    const elapsed = releaseTime - first.time;
    if (!first || elapsed <= 0) return 0;
    return (last.x - first.x) / elapsed;
  }

  _impulseSteps(velocity, stride) {
    if (Math.abs(velocity) < MIN_FLICK_SPEED) return 0;
    const distance = Math.max(
      -stride * MAX_IMPULSE_STEPS,
      Math.min(stride * MAX_IMPULSE_STEPS, velocity * IMPULSE_FRICTION_MS)
    );
    return distance / stride;
  }

  _momentumDistance(velocity, stride) {
    const steps = this._impulseSteps(velocity, stride);
    return steps * stride;
  }

  _startMomentum(source, sourceStride, distance) {
    const startPositions = this.viewports.map(viewport => viewport.scrollLeft);
    const strideRatios = this.viewports.map(viewport => this._stride(viewport) / sourceStride);
    const startedAt = performance.now();
    const maxDuration = IMPULSE_FRICTION_MS * 4;
    this._momentum = true;
    this._momentumSource = source;

    const animate = now => {
      const elapsed = Math.min(now - startedAt, maxDuration);
      const traveled = distance * (1 - Math.exp(-elapsed / IMPULSE_FRICTION_MS));
      this.viewports.forEach((viewport, index) => {
        viewport.scrollLeft = startPositions[index] + traveled * strideRatios[index];
        this._updateCarouselEdgePulse(viewport);
      });

      if (elapsed < maxDuration && Math.abs(distance - traveled) > 0.5) {
        this._momentumFrame = window.requestAnimationFrame(animate);
        return;
      }

      this._momentumFrame = 0;
      this._momentum = false;
      this._momentumSource = null;
      this._settleDrag(source, false);
    };

    this._momentumFrame = window.requestAnimationFrame(animate);
  }

  _cancelMomentum(settle) {
    if (!this._momentumFrame) return;
    const source = this._momentumSource;
    window.cancelAnimationFrame(this._momentumFrame);
    this._momentumFrame = 0;
    this._momentum = false;
    this._momentumSource = null;
    if (settle && source) this._settleDrag(source, false, false);
  }

  _settleDrag(source, cancelled, smooth = true) {
    const previousSlot = Number(source.dataset.windowSlot);
    const slot = cancelled ? previousSlot : this._nearestSlot(source);
    const steps = slot - previousSlot;
    this._setWindowSlot(source, slot);
    this.currentIndex = mod(this.currentIndex + steps, this.items.length);
    this.anchorSlot += steps;
    if (steps) this._setDividerMotion(steps);
    this._clearFeaturedMorph();
    this._updateFeatured();
    this._positionWindows(smooth);
    this._scheduleRecenter();
  }

  _scheduleRecenter() {
    window.clearTimeout(this._recenterTimer);
    this._recenterTimer = window.setTimeout(() => this._recenter(), 520);
  }

  _recenter() {
    const count = this.items.length;
    if (this.anchorSlot >= count * 3) this._shiftCopies(-count);
    else if (this.anchorSlot < count * 2) this._shiftCopies(count);
  }

  _shiftCopies(shift) {
    this.anchorSlot += shift;
    this.viewports.forEach((viewport, index) => {
      const stride = this._stride(viewport);
      const scrollShift = shift * stride;
      viewport.scrollLeft += scrollShift;
      const origin = this._scrollOrigins.get(viewport);
      if (origin !== undefined) this._scrollOrigins.set(viewport, origin + scrollShift);
      this._setWindowSlot(viewport, this.anchorSlot + (index === 0 ? -1 : 1));
    });
  }
}

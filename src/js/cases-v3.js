const MOCK_ITEMS = [
  { id: 'case-01', title: 'Identidad en movimiento', category: 'Branding', tone: 'lime' },
  { id: 'case-02', title: 'Una nueva perspectiva', category: 'Digital', tone: 'magenta' },
  { id: 'case-03', title: 'Formas de conectar', category: 'Experiencia', tone: 'blue' },
  { id: 'case-04', title: 'Materia y memoria', category: 'Editorial', tone: 'orange' },
  { id: 'case-05', title: 'Sistema abierto', category: 'Design system', tone: 'violet' },
  { id: 'case-06', title: 'Señales del futuro', category: 'Interacción', tone: 'cyan' }
];
const TRACK_COPIES = 5;

const mod = (value, length) => ((value % length) + length) % length;

export class CasesV3 {
  constructor(root = document.getElementById('cases-v3')) {
    if (!root) return;

    this.root = root;
    this.viewports = [...root.querySelectorAll('.cv3-carousel__viewport')];
    this.currentIndex = 0;
    this.anchorSlot = MOCK_ITEMS.length * 2 + this.currentIndex;
    this._scrollTimers = new WeakMap();
    this._programmaticTimers = new WeakMap();
    this._pointer = null;
    this._featuredTransition = 0;
    this._exitPulseDistance = Number.parseFloat(
      getComputedStyle(root).getPropertyValue('--cv3-exit-pulse-distance')
    ) || 100;
    this._exitPulseScale = Number.parseFloat(
      getComputedStyle(root).getPropertyValue('--cv3-exit-pulse-scale')
    ) || 0.88;
    this._renderTracks();
    this._bind();
    this._updateFeatured(false);
    this._positionWindows();
  }

  _renderTracks() {
    this.viewports.forEach(viewport => {
      const track = viewport.querySelector('.cv3-carousel__track');
      if (!track) return;

      track.innerHTML = Array.from({ length: TRACK_COPIES }, (_, copy) =>
        MOCK_ITEMS.map((item, index) => `
          <article
            class="cv3-item"
            data-item-id="${item.id}"
            data-index="${index}"
            data-slot="${copy * MOCK_ITEMS.length + index}"
            data-tone="${item.tone}"
            role="listitem"
            aria-hidden="${copy !== 2}"
            aria-label="${item.title}, ${item.category}"
          >
            <span class="cv3-item__index">${String(index + 1).padStart(2, '0')}</span>
            <div class="cv3-item__copy">
              <span class="cv3-item__category">${item.category}</span>
              <h3 class="cv3-item__title">${item.title}</h3>
            </div>
          </article>
        `).join('')
      ).join('');
    });
  }

  _bind() {
    this.viewports.forEach(viewport => {
      viewport.addEventListener('scroll', () => this._onScroll(viewport), { passive: true });
      viewport.addEventListener('pointerdown', () => this._cancelProgrammaticScroll(viewport));
      viewport.addEventListener('wheel', () => this._cancelProgrammaticScroll(viewport), { passive: true });
      viewport.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        this._goTo(event.key === 'ArrowRight' ? 1 : -1);
      });
    });

    this.root.addEventListener('click', event => {
      const button = event.target.closest('[data-cv3-step]');
      if (!button) return;
      this._goTo(Number(button.dataset.cv3Step));
    });

    this._bindPointerDrag();
    window.addEventListener('resize', () => this._positionWindows(false));
  }

  _goTo(step) {
    if (!Number.isInteger(step) || step === 0) return;
    this.currentIndex = mod(this.currentIndex + step, MOCK_ITEMS.length);
    this.anchorSlot += step;
    this._updateFeatured(true);
    this._positionWindows(true);
    this._scheduleRecenter();
  }

  _updateFeatured(animate) {
    const item = MOCK_ITEMS[this.currentIndex];
    const content = this.root.querySelector('.cv3-featured__content');
    const featured = this.root.querySelector('.cv3-featured');
    const eyebrow = this.root.querySelector('.cv3-featured__eyebrow');
    const title = this.root.querySelector('.cv3-featured__title');
    const description = this.root.querySelector('.cv3-featured__description');
    if (!content || !featured || !eyebrow || !title || !description) return;

    const transitionId = ++this._featuredTransition;
    content.getAnimations().forEach(animation => animation.cancel());
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      content.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(8px)' }],
        { duration: 130, easing: 'ease-in', fill: 'forwards' }
      ).onfinish = () => {
        if (transitionId !== this._featuredTransition) return;
        this._setFeaturedContent(item, featured, eyebrow, title, description);
        content.animate(
          [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      };
      return;
    }

    this._setFeaturedContent(item, featured, eyebrow, title, description);
  }

  _setFeaturedContent(item, featured, eyebrow, title, description) {
    featured.dataset.activeItem = item.id;
    featured.dataset.tone = item.tone;
    eyebrow.textContent = `${item.category} · Caso ${String(this.currentIndex + 1).padStart(2, '0')}`;
    title.textContent = item.title;
    description.textContent = `Contenido de muestra para ${item.title}.`;
  }

  _positionWindows(smooth = false) {
    this.viewports.forEach((viewport, index) => {
      if (viewport.closest('.cv3-carousel--compact')) {
        viewport.querySelector('.cv3-carousel__track').style.setProperty(
          '--cv3-compact-item-width',
          `${Math.max(120, viewport.clientWidth - 20)}px`
        );
      }
      const slot = this.anchorSlot + (index === 0 ? -1 : 1);
      const item = viewport.querySelector(`.cv3-item[data-slot="${mod(slot, MOCK_ITEMS.length * TRACK_COPIES)}"]`);
      if (!item) return;

      const viewportRect = viewport.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const trackPadding = parseFloat(getComputedStyle(item.parentElement).paddingLeft) || 0;
      const inset = viewport.clientLeft + trackPadding;
      const target = viewport.scrollLeft + itemRect.left - viewportRect.left - inset;
      this._scrollTo(viewport, Math.max(0, target), smooth);
      this._setWindowSlot(viewport, slot);
    });
    this.viewports.forEach(viewport => this._updateLeftExitPulse(viewport));
  }

  _updateLeftExitPulse(viewport) {
    if (!viewport.closest('.cv3-carousel--wide')) return;

    const clipLeft = viewport.getBoundingClientRect().left + viewport.clientLeft;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = [...viewport.querySelectorAll('.cv3-item')].map(item => {
      const rect = item.getBoundingClientRect();
      const unscaledLeft = rect.left - (item.offsetWidth - rect.width) / 2;
      const progress = reducedMotion
        ? 1
        : Math.round(Math.max(0, Math.min(1,
          (unscaledLeft - clipLeft + this._exitPulseDistance) / this._exitPulseDistance
        )) * 100) / 100;
      return {
        item,
        opacity: progress,
        scale: this._exitPulseScale + (1 - this._exitPulseScale) * progress
      };
    });

    items.forEach(({ item, opacity, scale }) => {
      item.style.setProperty('--cv3-left-edge-opacity', opacity.toFixed(3));
      item.style.setProperty('--cv3-left-edge-scale', scale.toFixed(3));
    });
  }

  _stride(viewport) {
    const items = viewport.querySelectorAll('.cv3-item');
    if (items.length < 2) return items[0]?.getBoundingClientRect().width || 1;
    return items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
  }

  _setWindowSlot(viewport, slot) {
    viewport.dataset.windowSlot = String(slot);
  }

  _scrollTo(viewport, left, smooth = true) {
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
  }

  _cancelProgrammaticScroll(viewport) {
    window.clearTimeout(this._programmaticTimers.get(viewport));
    this._programmaticTimers.delete(viewport);
  }

  _onScroll(source) {
    this._updateLeftExitPulse(source);
    if (this._pointer || this._programmaticTimers.has(source)) return;
    window.clearTimeout(this._scrollTimers.get(source));
    this._scrollTimers.set(source, window.setTimeout(() => {
      const slot = this._nearestSlot(source);
      const previousSlot = Number(source.dataset.windowSlot);
      const step = slot - previousSlot;
      if (!step) return;

      this._setWindowSlot(source, slot);
      this.anchorSlot += step;
      this.currentIndex = mod(this.currentIndex + step, MOCK_ITEMS.length);
      this._updateFeatured(true);
      this._positionWindows(true);
      this._scheduleRecenter();
    }, 140));
  }

  _nearestSlot(viewport) {
    const track = viewport.querySelector('.cv3-carousel__track');
    const trackPadding = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const viewportLeft = viewport.getBoundingClientRect().left + viewport.clientLeft + trackPadding;
    return [...viewport.querySelectorAll('.cv3-item')].reduce((best, item) => {
      const distance = Math.abs(item.getBoundingClientRect().left - viewportLeft);
      return distance < best.distance
        ? { slot: Number(item.dataset.slot), distance }
        : best;
    }, { slot: Number(viewport.dataset.windowSlot), distance: Infinity }).slot;
  }

  _bindPointerDrag() {
    this.viewports.forEach(viewport => {
      viewport.addEventListener('pointerdown', event => {
        if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
        if (this._pointer) return;
        this.viewports.forEach(item => this._cancelProgrammaticScroll(item));

        this._pointer = {
          id: event.pointerId,
          source: viewport,
          startX: event.clientX,
          startY: event.clientY,
          startScrolls: this.viewports.map(item => item.scrollLeft),
          strides: this.viewports.map(item => this._stride(item)),
          dragging: false
        };
      });
    });

    window.addEventListener('pointermove', event => {
      const gesture = this._pointer;
      if (!gesture || event.pointerId !== gesture.id) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      if (!gesture.dragging) {
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 5) return;
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          this._pointer = null;
          return;
        }
        gesture.dragging = true;
        this.viewports.forEach(viewport => viewport.classList.add('is-dragging'));
      }

      const progress = -deltaX / gesture.strides[this.viewports.indexOf(gesture.source)];
      this.viewports.forEach((viewport, index) => {
        viewport.scrollLeft = gesture.startScrolls[index] + progress * gesture.strides[index];
        this._updateLeftExitPulse(viewport);
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
    if (!gesture.dragging) return;

    const deltaX = event.clientX - gesture.startX;
    const sourceStride = gesture.strides[this.viewports.indexOf(gesture.source)];
    const steps = cancelled ? 0 : Math.round(-deltaX / sourceStride);
    this.currentIndex = mod(this.currentIndex + steps, MOCK_ITEMS.length);
    this.anchorSlot += steps;
    this._updateFeatured(true);
    this._positionWindows(true);
    this._scheduleRecenter();
  }

  _scheduleRecenter() {
    window.clearTimeout(this._recenterTimer);
    this._recenterTimer = window.setTimeout(() => this._recenter(), 520);
  }

  _recenter() {
    const count = MOCK_ITEMS.length;
    if (this.anchorSlot >= count * 3) this._shiftCopies(-count);
    else if (this.anchorSlot < count * 2) this._shiftCopies(count);
  }

  _shiftCopies(shift) {
    this.anchorSlot += shift;
    this.viewports.forEach((viewport, index) => {
      const stride = this._stride(viewport);
      viewport.scrollLeft += shift * stride;
      this._setWindowSlot(viewport, this.anchorSlot + (index === 0 ? -1 : 1));
    });
  }
}

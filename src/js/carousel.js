/* ==========================================================
   CAROUSEL.JS — Drag + Snap + Keyboard Carousel
   ========================================================== */

export class Carousel {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.track = containerEl.querySelector('.carousel-track');
    this.items = [...containerEl.querySelectorAll('.carousel-track > *')];
    this.prevBtn = containerEl.querySelector('[data-carousel-prev]');
    this.nextBtn = containerEl.querySelector('[data-carousel-next]');
    this.progressFill = containerEl.querySelector('.carousel-progress__fill');

    this.options = {
      snap: true,
      activeClass: 'is-active',
      align: options.activeClass === '' ? 'start' : 'center',
      gap: 24,
      ...options
    };

    this.currentIndex = 0;
    this.isDragging = false;
    this.startX = 0;
    this.currentTranslate = 0;
    this.prevTranslate = 0;
    this.velocity = 0;
    this.lastX = 0;
    this.lastTime = 0;
    this.rafId = null;
    this.hasDragged = false;
    this.dragDistance = 0;
    this.wheelDebounceTimer = null;

    this._init();
  }

  _init() {
    if (!this.track || this.items.length === 0) return;

    this._updateActive(0);
    this._updateProgress();
    this._bindEvents();
  }

  refresh() {
    if (!this.track) return;
    this.items = [...this.container.querySelectorAll('.carousel-track > *')];
    this._updateActive(this.currentIndex);
    this._updateProgress();
  }

  _bindEvents() {
    // Touch
    this.track.addEventListener('touchstart', (e) => this._onStart(e.touches[0].clientX), { passive: true });
    this.track.addEventListener('touchmove',  (e) => this._onMove(e.touches[0].clientX), { passive: true });
    this.track.addEventListener('touchend',   () => this._onEnd());

    // Mouse — do not prevent default on interactive elements (buttons, links)
    this.track.addEventListener('mousedown',  (e) => {
      if (e.target.closest('button, a')) return;
      e.preventDefault();
      this._onStart(e.clientX);
    });
    window.addEventListener('mousemove', (e) => { if (this.isDragging) this._onMove(e.clientX); });
    window.addEventListener('mouseup',   () => { if (this.isDragging) this._onEnd(); });

    // Buttons
    this.prevBtn?.addEventListener('click', () => this.prev());
    this.nextBtn?.addEventListener('click', () => this.next());

    // Intercept click on track when user was dragging cards/items
    this.track.addEventListener('click', (e) => {
      if (this.hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.hasDragged = false;
      }
    }, true);

    // Touchpad / horizontal wheel scroll
    this.container.addEventListener('wheel', (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // Only handle dominant horizontal gesture
      if (absX > absY && absX > 3) {
        e.preventDefault();

        const containerWidth = this.container.offsetWidth;
        const trackWidth = this.track.scrollWidth;
        const minTranslate = Math.min(0, -(trackWidth - containerWidth));
        const maxTranslate = 0;

        this.track.style.transition = 'none';
        this.currentTranslate = Math.min(maxTranslate, Math.max(minTranslate, this.currentTranslate - e.deltaX));
        this._setTranslate(this.currentTranslate);

        clearTimeout(this.wheelDebounceTimer);
        this.wheelDebounceTimer = setTimeout(() => {
          this._snapToNearest();
        }, 120);
      }
    }, { passive: false });

    // Keyboard
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this._snapToIndex(this.currentIndex), 200);
    });
  }

  _onStart(x) {
    this.isDragging = true;
    this.startX = x;
    this.lastX = x;
    this.lastTime = Date.now();
    this.velocity = 0;
    this.dragDistance = 0;
    this.hasDragged = false;
    this.prevTranslate = this.currentTranslate;
    this.track.style.transition = 'none';
    this.track.style.cursor = 'grabbing';
    cancelAnimationFrame(this.rafId);
  }

  _onMove(x) {
    if (!this.isDragging) return;
    const now = Date.now();
    const dt = now - this.lastTime;
    if (dt > 0) {
      this.velocity = (x - this.lastX) / dt;
    }
    this.lastX = x;
    this.lastTime = now;

    const delta = x - this.startX;
    this.dragDistance = Math.abs(delta);
    if (this.dragDistance > 6) {
      this.hasDragged = true;
    }

    this.currentTranslate = this.prevTranslate + delta;
    this._setTranslate(this.currentTranslate);
  }

  _onEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.track.style.cursor = 'grab';

    // Clear hasDragged after click event dispatch window if no click caught
    if (this.hasDragged) {
      setTimeout(() => {
        this.hasDragged = false;
      }, 100);
    }

    // Snap based on velocity or position
    if (Math.abs(this.velocity) > 0.3) {
      if (this.velocity < 0) this.next();
      else this.prev();
    } else {
      this._snapToNearest();
    }
  }

  _snapToNearest() {
    const containerRect = this.container.getBoundingClientRect();
    const referencePos = this.options.align === 'center'
      ? containerRect.left + containerRect.width / 2
      : containerRect.left;

    let closest = 0;
    let minDist = Infinity;
    this.items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const itemPos = this.options.align === 'center'
        ? rect.left + rect.width / 2
        : rect.left;
      const dist = Math.abs(referencePos - itemPos);
      if (dist < minDist) { minDist = dist; closest = i; }
    });

    this._snapToIndex(closest);
  }

  _snapToIndex(index) {
    index = Math.max(0, Math.min(this.items.length - 1, index));
    this.currentIndex = index;

    const containerWidth = this.container.offsetWidth;
    const item = this.items[index];
    if (!item) return;

    const itemWidth = item.offsetWidth;
    const itemLeft = item.offsetLeft;
    const target = this.options.align === 'center'
      ? -(itemLeft - (containerWidth - itemWidth) / 2)
      : -itemLeft;

    // Clamp
    const maxTranslate = 0;
    const trackWidth = this.track.scrollWidth;
    const minTranslate = Math.min(0, -(trackWidth - containerWidth));
    this.currentTranslate = Math.min(maxTranslate, Math.max(minTranslate, target));

    this.track.style.transition = 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)';
    this._setTranslate(this.currentTranslate);
    this._updateActive(index);
    this._updateProgress();
  }

  _setTranslate(x) {
    this.track.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  _updateActive(index) {
    if (!this.options.activeClass) return;
    this.items.forEach((item, i) => {
      item.classList.toggle(this.options.activeClass, i === index);
    });
  }

  _updateProgress() {
    if (!this.progressFill) return;
    const pct = this.items.length > 1
      ? (this.currentIndex / (this.items.length - 1)) * 100
      : 100;
    this.progressFill.style.width = `${pct}%`;
  }

  next() {
    this._snapToIndex(Math.min(this.currentIndex + 1, this.items.length - 1));
  }

  prev() {
    this._snapToIndex(Math.max(this.currentIndex - 1, 0));
  }

  goTo(index) {
    this._snapToIndex(index);
  }
}

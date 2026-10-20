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

    this._init();
  }

  _init() {
    if (!this.track || this.items.length === 0) return;

    this._updateActive(0);
    this._bindEvents();
  }

  _bindEvents() {
    // Touch
    this.track.addEventListener('touchstart', (e) => this._onStart(e.touches[0].clientX), { passive: true });
    this.track.addEventListener('touchmove',  (e) => this._onMove(e.touches[0].clientX), { passive: true });
    this.track.addEventListener('touchend',   () => this._onEnd());

    // Mouse
    this.track.addEventListener('mousedown',  (e) => { e.preventDefault(); this._onStart(e.clientX); });
    window.addEventListener('mousemove', (e) => { if (this.isDragging) this._onMove(e.clientX); });
    window.addEventListener('mouseup',   () => { if (this.isDragging) this._onEnd(); });

    // Buttons
    this.prevBtn?.addEventListener('click', () => this.prev());
    this.nextBtn?.addEventListener('click', () => this.next());

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
    this.currentTranslate = this.prevTranslate + delta;
    this._setTranslate(this.currentTranslate);
  }

  _onEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.track.style.cursor = 'grab';

    // Snap based on velocity or position
    if (Math.abs(this.velocity) > 0.3) {
      if (this.velocity < 0) this.next();
      else this.prev();
    } else {
      this._snapToNearest();
    }
  }

  _snapToNearest() {
    const trackRect = this.track.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const center = containerRect.left + containerRect.width / 2;

    let closest = 0;
    let minDist = Infinity;
    this.items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const dist = Math.abs(center - itemCenter);
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
    const target = -(itemLeft - (containerWidth - itemWidth) / 2);

    // Clamp
    const maxTranslate = 0;
    const trackWidth = this.track.scrollWidth;
    const minTranslate = -(trackWidth - containerWidth);
    this.currentTranslate = Math.min(maxTranslate, Math.max(minTranslate, target));

    this.track.style.transition = 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)';
    this._setTranslate(this.currentTranslate);
    this._updateActive(index);
    this._updateProgress();
  }

  _setTranslate(x) {
    this.track.style.transform = `translateX(${x}px)`;
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

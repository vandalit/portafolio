const TONES = ['lime', 'magenta', 'blue', 'orange', 'violet', 'cyan'];
const TRACK_COPIES = 5;
const IMPULSE_FRICTION_MS = 360;
const MAX_IMPULSE_STEPS = 6;
const MIN_FLICK_SPEED = 0.22;
const POINTER_SAMPLE_WINDOW_MS = 100;

const mod = (value, length) => ((value % length) + length) % length;

export class CasesV3 {
  constructor(cases, root = document.getElementById('cases-v3')) {
    if (!root || !cases?.length) {
      console.warn('[CasesV3] Missing root element or case study data');
      return;
    }

    this.root = root;
    this.items = cases.map((item, index) => ({
      ...item,
      image: item.cover || item.coverPlaceholder || '',
      tone: TONES[index % TONES.length]
    }));
    this.viewports = [...root.querySelectorAll('.cv3-carousel__viewport')];
    this.currentIndex = 0;
    this.anchorSlot = this.items.length * 2 + this.currentIndex;
    this._scrollTimers = new WeakMap();
    this._programmaticTimers = new WeakMap();
    this._scrollOrigins = new WeakMap();
    this._pointer = null;
    this._momentumFrame = 0;
    this._momentum = false;
    this._momentumSource = null;
    this._featuredTransition = 0;
    this._featuredMorph = null;
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
        this.items.map((item, index) => `
          <article
            class="cv3-item"
            data-item-id="${item.id}"
            data-index="${index}"
            data-slot="${copy * this.items.length + index}"
            data-tone="${item.tone}"
            role="listitem"
            aria-hidden="${copy !== 2}"
            aria-label="${item.title}, ${item.category}"
          >
            <img class="cv3-item__image" alt="" aria-hidden="true" loading="lazy" decoding="async">
            <span class="cv3-item__index">${String(index + 1).padStart(2, '0')}</span>
            <div class="cv3-item__copy">
              <span class="cv3-item__category">${item.category}</span>
              <h3 class="cv3-item__title">${item.title}</h3>
            </div>
          </article>
        `).join('')
      ).join('');

      track.querySelectorAll('.cv3-item__image').forEach(image => {
        image.src = this.items[Number(image.closest('.cv3-item').dataset.index)].image;
      });
    });
  }

  _bind() {
    this.viewports.forEach(viewport => {
      viewport.addEventListener('scroll', () => this._onScroll(viewport), { passive: true });
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
      const button = event.target.closest('[data-cv3-step]');
      if (!button) return;
      this._goTo(Number(button.dataset.cv3Step));
    });

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
    this._updateFeatured(true);
    this._positionWindows(true);
    this._scheduleRecenter();
  }

  _updateFeatured(animate) {
    const item = this.items[this.currentIndex];
    const content = this.root.querySelector('.cv3-featured__content');
    const featured = this.root.querySelector('.cv3-featured');
    const eyebrow = this.root.querySelector('.cv3-featured__eyebrow');
    const title = this.root.querySelector('.cv3-featured__title');
    const description = this.root.querySelector('.cv3-featured__description');
    if (!content || !featured || !eyebrow || !title || !description) return;

    const transitionId = ++this._featuredTransition;
    content.getAnimations().forEach(animation => animation.cancel());
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fadeOut = content.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(8px)' }],
        { duration: 130, easing: 'ease-in', fill: 'forwards' }
      );
      fadeOut.onfinish = () => {
        if (transitionId !== this._featuredTransition) return;
        fadeOut.cancel();
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

  _updateFeaturedBackground(progress, fromIndex = this.currentIndex, toIndex = mod(fromIndex + 1, this.items.length)) {
    const art = this.root.querySelector('.cv3-featured__art');
    if (!art) return;

    const activeImage = art.querySelector('[data-featured-layer="active"]');
    const incomingImage = art.querySelector('[data-featured-layer="incoming"]');
    if (!activeImage || !incomingImage) return;

    const activeSrc = this.items[fromIndex].image;
    const incomingSrc = this.items[toIndex].image;
    if (activeImage.getAttribute('src') !== activeSrc) activeImage.src = activeSrc;
    if (incomingImage.getAttribute('src') !== incomingSrc) incomingImage.src = incomingSrc;
    incomingImage.style.opacity = String(progress);
  }

  _positionWindows(smooth = false) {
    this.viewports.forEach((viewport, index) => {
      const slot = this.anchorSlot + (index === 0 ? -1 : 1);
      const item = viewport.querySelector(`.cv3-item[data-slot="${mod(slot, this.items.length * TRACK_COPIES)}"]`);
      if (!item) return;

      const viewportRect = viewport.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const trackPadding = parseFloat(getComputedStyle(item.parentElement).paddingLeft) || 0;
      const inset = viewport.clientLeft + trackPadding;
      const target = Math.max(0, viewport.scrollLeft + itemRect.left - viewportRect.left - inset);
      this._scrollTo(viewport, target, smooth);
      this._setWindowSlot(viewport, slot);
      this._scrollOrigins.set(viewport, target);
    });
    this.viewports.forEach(viewport => this._updateCarouselEdgePulse(viewport));
  }

  _updateCarouselEdgePulse(viewport) {
    if (viewport.closest('.cv3-carousel--compact')) {
      const clipRight = viewport.getBoundingClientRect().left
        + viewport.clientLeft + viewport.clientWidth;
      [...viewport.querySelectorAll('.cv3-item')].forEach(item => {
        const rect = item.getBoundingClientRect();
        const unscaledRight = rect.right + (item.offsetWidth - rect.width) / 2;
        const visibility = Math.max(0, Math.min(1,
          (clipRight - unscaledRight + this._exitPulseDistance) / this._exitPulseDistance
        ));
        const scale = this._exitPulseScale + (1 - this._exitPulseScale) * visibility;
        item.style.setProperty('--cv3-right-edge-opacity', visibility.toFixed(3));
        item.style.setProperty('--cv3-right-edge-scale', scale.toFixed(3));
      });
      return;
    }

    if (!viewport.closest('.cv3-carousel--wide')) return;

    const clipLeft = viewport.getBoundingClientRect().left + viewport.clientLeft;
    const controlMorph = this._featuredMorph?.kind === 'control' ? this._featuredMorph : null;
    const items = [...viewport.querySelectorAll('.cv3-item')].map(item => {
      const rect = item.getBoundingClientRect();
      const unscaledLeft = rect.left - (item.offsetWidth - rect.width) / 2;
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

    items.forEach(({ item, opacity, scale }) => {
      item.style.setProperty('--cv3-left-edge-opacity', opacity.toFixed(3));
      item.style.setProperty('--cv3-left-edge-scale', scale.toFixed(3));
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
      const firstItem = viewport.querySelector(`.cv3-item[data-slot="${firstSlot}"]`);
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
    const firstItem = viewport.querySelector(`.cv3-item[data-slot="${firstSlot}"]`);
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
    const items = viewport.querySelectorAll('.cv3-item');
    if (items.length < 2) return items[0]?.offsetWidth || 1;
    return items[1].offsetLeft - items[0].offsetLeft;
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
    this._updateCarouselEdgePulse(source);
    if (this._pointer || this._momentum || this._programmaticTimers.has(source)) return;
    window.clearTimeout(this._scrollTimers.get(source));
    this._scrollTimers.set(source, window.setTimeout(() => {
      const slot = this._nearestSlot(source);
      const previousSlot = Number(source.dataset.windowSlot);
      const step = slot - previousSlot;
      if (!step) {
        this._clearFeaturedMorph();
        return;
      }

      this._setWindowSlot(source, slot);
      this.anchorSlot += step;
      this.currentIndex = mod(this.currentIndex + step, this.items.length);
      this._clearFeaturedMorph();
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
        if (!event.target.closest('.cv3-item')) return;
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
        this._setImpulse(0);
        this.viewports.forEach(viewport => viewport.classList.add('is-dragging'));
      }

      const progress = -deltaX / gesture.strides[this.viewports.indexOf(gesture.source)];
      const velocity = this._estimatePointerVelocity(gesture, event.timeStamp);
      this._setImpulse(this._impulseSteps(
        -velocity,
        gesture.strides[this.viewports.indexOf(gesture.source)]
      ));
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
      return;
    }

    const sourceStride = gesture.strides[this.viewports.indexOf(gesture.source)];
    if (!cancelled) this._recordPointerSample(gesture, event);
    const releaseTime = event.timeStamp;
    const velocity = cancelled ? 0 : -this._estimatePointerVelocity(gesture, releaseTime);
    const distance = this._momentumDistance(velocity, sourceStride);
    this._setImpulse(distance / sourceStride);
    if (distance && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._startMomentum(gesture.source, sourceStride, distance);
      return;
    }

    this._settleDrag(gesture.source, cancelled);
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

  _setImpulse(steps) {
    const output = this.root.querySelector('[data-cv3-impulse]');
    if (output) output.value = `${steps >= 0 ? '+' : ''}${steps.toFixed(1)}`;
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
    this._clearFeaturedMorph();
    this._updateFeatured(true);
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

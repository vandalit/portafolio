/* ==========================================================
   CASES-FEATURED-CAROUSEL.JS
   Componente especializado que sincroniza el carrusel de casos
   con el caso destacado (featured), agregando auto-play y timer.
   
   Extiende la funcionalidad de Carousel.js sin modificarlo.
   ========================================================== */

import { Carousel } from './carousel.js';

export class CasesFeaturedCarousel {
  constructor(data, options = {}) {
    this.cases = data;
    this.featuredEl = document.getElementById('featured-case');
    this.carouselEl = document.getElementById('cases-carousel');
    
    if (!this.featuredEl || !this.carouselEl || !this.cases?.length) {
      console.warn('[CasesFeaturedCarousel] Missing required elements or data');
      return;
    }

    this.options = {
      autoplaySpeed: 6000,     // 6 segundos por slide
      pauseOnHover: true,
      loop: true,
      timerVisible: true,
      ...options
    };

    this.currentIndex = 0;
    this.carouselInstance = null;
    this.autoplayTimer = null;
    this.timerStartTime = 0;
    this.timerPaused = false;
    this.timerEl = null;

    this._init();
  }

  _init() {
    // 1. Crear controles superiores (nav + timer)
    this._createTopControls();

    // 2. Renderizar featured inicial (index 0)
    this._renderFeatured(0);

    // 3. Renderizar cards del carrusel (sin filtrar ninguno, todos van al carousel)
    this._renderCarouselCards();

    // 4. Instanciar Carousel genérico
    this.carouselInstance = new Carousel(this.carouselEl);

    // 5. Interceptar cambios del carousel para sincronizar featured
    this._setupCarouselSync();

    // 6. Setup hover pause
    if (this.options.pauseOnHover) {
      this._setupHoverPause();
    }

    // 7. Iniciar autoplay
    this._startAutoplay();
  }

  _renderFeatured(index) {
    const featured = this.cases[index];
    if (!featured) return;

    const isMultimedia = featured.category === 'multimedia';
    const accentColor = isMultimedia ? 'var(--magenta)' : 'var(--lime)';

    this.featuredEl.innerHTML = `
      <img class="featured-case__img" 
           src="${featured.coverPlaceholder || featured.cover}" 
           alt="${featured.title}" 
           loading="eager" 
           decoding="async" 
           onload="this.classList.add('is-loaded');this.closest('.featured-case').classList.add('image-loaded')">
      <div class="featured-case__overlay"></div>
      <div class="featured-case__strip" style="background:${accentColor}"></div>
      <div class="featured-case__content">
        <p class="featured-case__category" style="color:${accentColor}">
          ${featured.category === 'coding' ? '✦ Coding' : '◈ Multimedia'}
        </p>
        <h2 class="featured-case__title">${featured.title}</h2>
        <p class="featured-case__desc">${featured.description}</p>
        <div class="featured-case__meta">
          <button class="btn ${isMultimedia ? 'btn--primary' : 'btn--lime'}"
                  data-project-id="${featured.id}" data-type="case">
            Ver caso <span class="btn__icon">→</span>
          </button>
          <span class="tag ${isMultimedia ? 'tag--magenta' : 'tag--lime'}">${featured.year}</span>
          <span class="tag">${featured.role}</span>
        </div>
      </div>
    `;

    this.featuredEl.dataset.projectId = featured.id;
    this.featuredEl.dataset.type = 'case';
  }

  _renderCarouselCards() {
    const track = this.carouselEl.querySelector('.carousel-track');
    if (!track) return;

    track.innerHTML = this.cases.map((c, i) => {
      const isMultimedia = c.category === 'multimedia';
      const accentColor = isMultimedia ? 'var(--magenta)' : 'var(--lime)';
      const tagClass = isMultimedia ? 'tag--magenta' : 'tag--lime';
      
      return `
        <article class="case-card ${i === 0 ? 'is-active' : ''}"
                 data-project-id="${c.id}"
                 data-type="case"
                 data-case-index="${i}"
                 role="button" 
                 tabindex="0"
                 aria-label="Ver caso de estudio: ${c.title}">
          <img class="case-card__img"
               src="${c.coverPlaceholder || c.cover}"
               alt="${c.title}"
               loading="${i < 2 ? 'eager' : 'lazy'}"
               decoding="async"
               onload="this.classList.add('is-loaded');this.closest('.case-card').classList.add('image-loaded')">
          <div class="case-card__overlay"></div>
          <div class="case-card__accent" style="background:${accentColor}"></div>
          <div class="case-card__content">
            <p class="case-card__eyebrow">${c.role}</p>
            <h3 class="case-card__title">${c.title}</h3>
            <div class="case-card__tags">
              ${c.tags.map(t => `<span class="tag ${tagClass}">${t}</span>`).join('')}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  _setupCarouselSync() {
    // Interceptar cambios del carousel observando la clase is-active
    const observer = new MutationObserver(() => {
      const activeCard = this.carouselEl.querySelector('.case-card.is-active');
      if (activeCard) {
        const index = parseInt(activeCard.dataset.caseIndex, 10);
        if (!isNaN(index) && index !== this.currentIndex) {
          this.currentIndex = index;
          this._renderFeatured(index);
          this._resetAutoplay();
        }
      }
    });

    // Observar cambios en el track del carousel
    const track = this.carouselEl.querySelector('.carousel-track');
    if (track) {
      observer.observe(track, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: true 
      });
    }

    // Click en cards para navegar manualmente
    this.carouselEl.addEventListener('click', (e) => {
      const card = e.target.closest('.case-card');
      if (card && !e.target.closest('button, a')) {
        const index = parseInt(card.dataset.caseIndex, 10);
        if (!isNaN(index)) {
          this.goTo(index);
        }
      }
    });
  }

  _createTopControls() {
    // Crear controles superiores: nav buttons + timer
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'cases-system__controls';
    
    controlsWrapper.innerHTML = `
      <div class="cases-system__timer">
        <div class="cases-system__timer-fill"></div>
      </div>
      <div class="cases-system__nav">
        <button class="carousel-btn carousel-btn--prev" aria-label="Caso anterior">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button class="carousel-btn carousel-btn--next" aria-label="Siguiente caso">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    `;

    // Insertar antes del featured
    this.featuredEl.parentNode.insertBefore(controlsWrapper, this.featuredEl);
    
    // Guardar referencia al timer
    this.timerEl = controlsWrapper.querySelector('.cases-system__timer');
    
    // Conectar botones
    const prevBtn = controlsWrapper.querySelector('.carousel-btn--prev');
    const nextBtn = controlsWrapper.querySelector('.carousel-btn--next');
    
    prevBtn?.addEventListener('click', () => this.prev());
    nextBtn?.addEventListener('click', () => this.next());
  }

  _setupHoverPause() {
    // Pausar en hover sobre featured o carousel
    this.featuredEl.addEventListener('mouseenter', () => {
      this._pauseAutoplay();
    });
    this.featuredEl.addEventListener('mouseleave', () => {
      this._resumeAutoplay();
    });

    this.carouselEl.addEventListener('mouseenter', () => {
      this._pauseAutoplay();
    });
    this.carouselEl.addEventListener('mouseleave', () => {
      this._resumeAutoplay();
    });
    
    // También pausar al interactuar con controles
    const controls = document.querySelector('.cases-system__controls');
    if (controls) {
      controls.addEventListener('mouseenter', () => {
        this._pauseAutoplay();
      });
      controls.addEventListener('mouseleave', () => {
        this._resumeAutoplay();
      });
    }
  }

  _startAutoplay() {
    if (!this.options.autoplaySpeed) return;
    
    this._resetAutoplay();
  }

  _resetAutoplay() {
    this._stopAutoplay();
    this.timerStartTime = Date.now();
    this.timerPaused = false;
    
    this.autoplayTimer = setTimeout(() => {
      this._advance();
    }, this.options.autoplaySpeed);

    this._animateTimer();
  }

  _stopAutoplay() {
    if (this.autoplayTimer) {
      clearTimeout(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  _pauseAutoplay() {
    if (this.timerPaused) return;
    this.timerPaused = true;
    this._stopAutoplay();
  }

  _resumeAutoplay() {
    if (!this.timerPaused) return;
    this.timerPaused = false;
    this._resetAutoplay();
  }

  _animateTimer() {
    if (!this.timerEl) return;

    const fill = this.timerEl.querySelector('.cases-system__timer-fill');
    if (!fill) return;

    const animate = () => {
      if (this.timerPaused) {
        fill.style.width = '0%';
        return;
      }

      const elapsed = Date.now() - this.timerStartTime;
      const progress = Math.min(100, (elapsed / this.options.autoplaySpeed) * 100);
      fill.style.width = `${progress}%`;

      if (progress < 100) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  _advance() {
    const nextIndex = this.options.loop 
      ? (this.currentIndex + 1) % this.cases.length
      : Math.min(this.currentIndex + 1, this.cases.length - 1);
    
    this.goTo(nextIndex);
  }

  goTo(index) {
    if (index < 0 || index >= this.cases.length) return;
    
    this.currentIndex = index;
    this._renderFeatured(index);
    
    if (this.carouselInstance) {
      this.carouselInstance.goTo(index);
    }
    
    this._resetAutoplay();
  }

  next() {
    const nextIndex = this.options.loop 
      ? (this.currentIndex + 1) % this.cases.length
      : Math.min(this.currentIndex + 1, this.cases.length - 1);
    this.goTo(nextIndex);
  }

  prev() {
    const prevIndex = this.options.loop 
      ? (this.currentIndex - 1 + this.cases.length) % this.cases.length
      : Math.max(this.currentIndex - 1, 0);
    this.goTo(prevIndex);
  }

  destroy() {
    this._stopAutoplay();
    // Cleanup si es necesario
  }
}

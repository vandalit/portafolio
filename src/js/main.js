/* ==========================================================
   MAIN.JS — Bootstrap, Render, Observers
   ========================================================== */

console.log('%c[Portafolio:Main] 🚀 main.js loaded', 'background: #080810; color: #b8e030; font-weight: bold; border: 1px solid #b8e030; padding: 2px 6px; border-radius: 3px;');

import { HeroScene } from './three-scene.js';
import { Carousel } from './carousel.js';
import { GridFilter } from './grid-filter.js';
import { ProjectModal } from './project-modal.js';
import { LabModal } from './lab-modal.js';
import { initVideoBackground } from './video-bg.js';
import { bentoManager } from '../components/bentos/bento-manager.js';
import { loadAllContent, loadSiteSettings } from './content-loader.js';

// ── DATA ──────────────────────────────────────────────────
let projectsData = null;
let siteSettings = null;

async function loadData() {
  const [content, site] = await Promise.all([
    loadAllContent(),
    loadSiteSettings()
  ]);
  projectsData = content;
  siteSettings = site;
}

// ── RENDER ────────────────────────────────────────────────
function renderCaseCards(cases) {
  const track = document.querySelector('#cases-carousel .carousel-track');
  if (!track) return;

  track.innerHTML = cases.map((c, i) => {
    const isMultimedia = c.category === 'multimedia';
    const accentColor = isMultimedia ? 'var(--magenta)' : 'var(--lime)';
    const tagClass = isMultimedia ? 'tag--magenta' : 'tag--lime';
    return `
      <article class="case-card ${i === 0 ? 'is-active' : ''}"
               data-project-id="${c.id}"
               data-type="case"
               role="button" tabindex="0"
               aria-label="Ver caso de estudio: ${c.title}">
        <img class="case-card__img"
             src="${c.coverPlaceholder}"
             alt="${c.title}"
             loading="${i < 2 ? 'eager' : 'lazy'}"
             decoding="async"
             onload="this.classList.add('is-loaded')">
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

function renderFeatured(cases) {
  const featured = cases.find(c => c.featured) || cases[0];
  const el = document.getElementById('featured-case');
  if (!el || !featured) return;

  const isMultimedia = featured.category === 'multimedia';
  const accentColor = isMultimedia ? 'var(--magenta)' : 'var(--lime)';

  el.innerHTML = `
    <img class="featured-case__img" src="${featured.coverPlaceholder}" alt="${featured.title}" loading="eager">
    <div class="featured-case__overlay"></div>
    <div class="featured-case__strip" style="background:${accentColor}"></div>
    <div class="featured-case__content">
      <p class="featured-case__category" style="color:${accentColor}">${featured.category === 'coding' ? '✦ Coding' : '◈ Multimedia'}</p>
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

  el.dataset.projectId = featured.id;
  el.dataset.type = 'case';
}

function renderSkillCards(skills) {
  const track = document.querySelector('#skills-carousel .carousel-track');
  if (!track) return;

  track.innerHTML = skills.map((s, i) => {
    const isMagenta = s.accentColor.includes('d4') || s.accentColor.includes('e8');
    const accent = isMagenta ? 'magenta' : 'lime';
    const accentColor = isMagenta ? 'var(--magenta)' : 'var(--lime)';

    const icons = { circle: circleIcon, square: squareIcon, triangle: triangleIcon };
    const iconSvg = icons[s.icon] || circleIcon;

    return `
      <article class="skill-card" data-accent="${accent}" tabindex="0">
        <div class="skill-card__icon-bg">${iconSvg(accentColor)}</div>
        <p class="skill-card__category">${s.category.toUpperCase()}</p>
        <h3 class="skill-card__title">${s.title}</h3>
        <p class="skill-card__desc">${s.description}</p>
        <div class="skill-card__pills">
          ${s.skills.map(sk => `<span class="skill-pill">${sk}</span>`).join('')}
        </div>
        <button class="skill-card__cta btn--ghost-${accent}"
                data-filter="${s.filterTag}"
                data-scroll-to="work">
          Ver ejemplos <span>→</span>
        </button>
      </article>
    `;
  }).join('');
}

function renderClientGrid(clients) {
  const grid = document.getElementById('clients-grid');
  if (!grid || !Array.isArray(clients)) return;

  // Cover por defecto: imagen SVG blanca inlined (sin red, funciona estático)
  const DEFAULT_COVER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23f4f4f4'/%3E%3C/svg%3E`;

  const allProjects = clients.map(c => ({ ...c, _type: 'client' }));

  grid.innerHTML = allProjects.map(c => {
    const isMultimedia = c.category === 'multimedia' || (c.tags && c.tags.includes('multimedia')) || c.category === 'wordpress';
    const tagClass = isMultimedia ? 'tag--magenta' : 'tag--lime';
    const badge = c.client ? c.client : (c.category === 'coding' ? '✦ Coding' : '◈ Multimedia');
    const tagsStr = (c.tags || []).join(' ');
    const coverSrc = c.cover || c.coverPlaceholder || DEFAULT_COVER_SVG;
    const isEmpty = !c.client && !c.description;

    return `
      <article class="project-thumb ${isEmpty ? 'project-thumb--wip' : ''}"
               data-category="${c.category}"
               data-tags="${tagsStr}"
               data-project-id="${isEmpty ? '' : c.id}"
               data-type="${c._type}"
               ${isEmpty ? '' : 'role="button" tabindex="0"'}
               aria-label="${isEmpty ? 'Proyecto próximamente' : 'Ver proyecto: ' + c.title}">
        <img class="project-thumb__img" src="${coverSrc}" alt="${c.title || 'Próximamente'}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')">
        ${isEmpty ? '<div class="project-thumb__wip-badge">Próximamente</div>' : `
        <div class="project-thumb__overlay"></div>
        <div class="project-thumb__info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-2)">
            <span class="tag ${tagClass}">${badge}</span>
            <span class="project-thumb__meta">${c.year}</span>
          </div>
          <h3 class="project-thumb__title">${c.title}</h3>
          <p class="project-thumb__meta" style="color:var(--text-1); font-size:var(--text-xs); margin-top:2px; text-transform:none">
            ${c.subtitle || c.role}
          </p>
        </div>`}
      </article>
    `;
  }).join('');
}

let labModalInstance = null;

function renderLabGrid(lab) {
  const track = document.getElementById('lab-track');
  if (!track) return;

  // Agrupamiento secuencial: cards comprimidas adyacentes o con el mismo wrapperGroup se empaquetan en un wrapper
  const blocks = [];
  let currentGroup = null;

  lab.forEach(item => {
    if (item.cardType === 'compressed') {
      const groupKey = item.wrapperGroup || 'default';
      if (!currentGroup || currentGroup.key !== groupKey) {
        currentGroup = { type: 'wrapper', key: groupKey, items: [] };
        blocks.push(currentGroup);
      }
      currentGroup.items.push(item);
    } else {
      currentGroup = null;
      blocks.push({ type: 'expanded', item });
    }
  });

  track.innerHTML = blocks.map(block => {
    if (block.type === 'expanded') {
      const l = block.item;
      const demoBtn = l.links?.demo ? `<a href="${l.links.demo}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>` : '';
      const codeBtn = l.links?.github ? `<a href="${l.links.github}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>` : '';

      return `
        <article class="lab-card--expanded" data-lab-id="${l.id}" tabindex="0" role="button" aria-label="Ver experimento: ${l.title}">
          <div class="lab-card__thumb lab-scanline">
            <img class="lab-card__img" src="${l.coverPlaceholder || l.cover}" alt="${l.title}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')">
            <span class="lab-card__badge">Experimento</span>
          </div>
          <div class="lab-card__body">
            <h3 class="lab-card__title">${l.title}</h3>
            <p class="lab-card__subtitle">${l.subtitle || 'Exploración técnica'}</p>
            <p class="lab-card__desc">${l.description}</p>
            <div class="lab-card__links">
              ${demoBtn}
              ${codeBtn}
            </div>
          </div>
        </article>
      `;
    } else {
      // Wrapper con cards comprimidas (Templates / Trabajos anteriores sin modal detalle)
      const items = block.items;
      const isOverlap = items.length >= 4;

      const innerCards = items.map(l => `
        <div class="lab-card--compressed" aria-label="Template o caso base: ${l.title}">
          <span class="lab-pill-outline">Ejemplo</span>
          <h4 class="lab-card__title--compressed">${l.title}</h4>
          <p class="lab-card__desc--compressed">${l.description || l.subtitle}</p>
        </div>
      `).join('');

      return `
        <div class="lab-wrapper ${isOverlap ? 'lab-wrapper--overlap' : ''}">
          ${innerCards}
        </div>
      `;
    }
  }).join('');

  // Event listener para abrir LabModal SOLO en las cards expandidas
  track.querySelectorAll('.lab-card--expanded').forEach(cardEl => {
    cardEl.addEventListener('click', (e) => {
      // Si hizo clic en un link o botón dentro de la tarjeta, dejamos que navegue
      if (e.target.closest('a, button')) return;

      const id = cardEl.dataset.labId;
      const project = lab.find(p => p.id === id);
      if (project && labModalInstance) {
        labModalInstance.open(project);
      }
    });

    cardEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('a, button')) return;
        e.preventDefault();
        const id = cardEl.dataset.labId;
        const project = lab.find(p => p.id === id);
        if (project && labModalInstance) {
          labModalInstance.open(project);
        }
      }
    });
  });
}

// ── SVG DOODLES ──────────────────────────────────────────
const circleIcon = (color) => `
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="24" stroke="${color}" stroke-width="2"/>
    <circle cx="28" cy="28" r="12" stroke="${color}" stroke-width="1" stroke-dasharray="4 4"/>
    <circle cx="28" cy="28" r="4" fill="${color}"/>
  </svg>`;

const squareIcon = (color) => `
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="44" height="44" stroke="${color}" stroke-width="2"/>
    <rect x="18" y="18" width="20" height="20" stroke="${color}" stroke-width="1" stroke-dasharray="4 4"/>
    <rect x="24" y="24" width="8" height="8" fill="${color}"/>
  </svg>`;

const triangleIcon = (color) => `
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="28,6 52,50 4,50" stroke="${color}" stroke-width="2" fill="none"/>
    <polygon points="28,18 42,42 14,42" stroke="${color}" stroke-width="1" stroke-dasharray="4 4" fill="none"/>
    <circle cx="28" cy="34" r="4" fill="${color}"/>
  </svg>`;

// ── SCROLL REVEAL ────────────────────────────────────────
function initReveal() {
  const revealEls = document.querySelectorAll('.reveal, .stagger');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => obs.observe(el));
}

// ── WORK TITLE SCROLLTELL — transiciona reactivo al scroll (izq -> centro al llegar a mitad de pantalla) ──
function initWorkTitleScrolltell() {
  const workHeader = document.querySelector('.work-header');
  if (!workHeader) return;

  const titleEl = document.getElementById('work-title');
  const eyebrowEl = document.getElementById('work-eyebrow');
  const descEl = document.getElementById('work-desc');
  const elements = [eyebrowEl, titleEl, descEl].filter(Boolean);

  let ticking = false;

  function update() {
    const rect = workHeader.getBoundingClientRect();
    const vh = window.innerHeight;

    // Comienza la transición en la parte inferior (88% del viewport)
    const startY = vh * 0.88;
    // Alcanza la posición final (centrado exacto) cerca de la mitad vertical (48% del viewport)
    const endY = vh * 0.48;

    // Progreso dinámico 0 -> 1 estrictamente vinculado a la posición de scroll
    let progress = (startY - rect.top) / (startY - endY);
    progress = Math.max(0, Math.min(1, progress));

    // Curva de aceleración/desaceleración suave para sensación natural
    const ease = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const containerWidth = workHeader.clientWidth;

    elements.forEach(el => {
      const elWidth = el.offsetWidth;
      const targetOffset = Math.max(0, (containerWidth - elWidth) / 2);
      const currentX = targetOffset * ease;
      el.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  // Cálculo inicial al montar
  update();
}

// ── SKILL MODAL (fullscreen detail) ──────────────────────
function initSkillModal() {
  const modal = document.getElementById('skill-modal');
  if (!modal) return;

  const backdrop = modal.querySelector('.skill-modal__backdrop');
  const closeBtn = modal.querySelector('.skill-modal__close');
  const catEl    = modal.querySelector('.skill-modal__category');
  const titleEl  = modal.querySelector('.skill-modal__title');
  const descEl   = modal.querySelector('.skill-modal__desc');
  const pillsEl  = modal.querySelector('.skill-modal__pills');

  function openSkillModal(skillData) {
    if (catEl)   catEl.textContent   = skillData.category?.toUpperCase() || '';
    if (titleEl) titleEl.textContent = skillData.title || '';
    if (descEl)  descEl.textContent  = skillData.description || '';
    if (pillsEl) {
      pillsEl.innerHTML = (skillData.skills || [])
        .map(sk => `<span class="skill-pill skill-pill--lg">${sk}</span>`)
        .join('');
    }
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeSkillModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  backdrop?.addEventListener('click', closeSkillModal);
  closeBtn?.addEventListener('click', closeSkillModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeSkillModal();
  });

  // Delegate — escucha clics en skill-cards renderizadas dinámicamente
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.skill-card');
    if (!card || e.target.closest('[data-scroll-to]')) return;
    // Leer datos del DOM (ya renderizados)
    const category = card.querySelector('.skill-card__category')?.textContent || '';
    const title    = card.querySelector('.skill-card__title')?.textContent || '';
    const desc     = card.querySelector('.skill-card__desc')?.textContent || '';
    const pills    = [...card.querySelectorAll('.skill-pill')].map(p => p.textContent);
    openSkillModal({ category, title, description: desc, skills: pills });
  });
}

// ── NAV ──────────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"], .nav__cta[href^="#"]');
  const logo = document.querySelector('.nav__logo');

  // Logo click -> always scroll smoothly to point 0 (top of page)
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Scrolled state
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active section tracking
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => sectionObs.observe(s));

  // Smooth scroll on click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      e.preventDefault();
      if (href === '#hero' || href === '#top' || href === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ── FX TOGGLE (EFECTOS VISUALES 3D & VIDEO) ────────────────
function initFxToggle() {
  const fxBtn = document.getElementById('fx-toggle');
  if (!fxBtn) return;

  let fxActive = true;

  fxBtn.addEventListener('click', () => {
    fxActive = !fxActive;
    fxBtn.setAttribute('aria-pressed', fxActive ? 'true' : 'false');
    fxBtn.classList.toggle('is-off', !fxActive);

    // Toggle global body class
    document.body.classList.toggle('fx-off', !fxActive);

    // Toggle Three.js scene
    if (window.__heroSceneInstance && typeof window.__heroSceneInstance.toggle === 'function') {
      window.__heroSceneInstance.toggle(fxActive);
    }

    // Toggle Video background
    if (window.__videoBgInstance && typeof window.__videoBgInstance.toggle === 'function') {
      window.__videoBgInstance.toggle(fxActive);
    }

    console.log(`[FX Toggle] FX visual effects switched ${fxActive ? 'ON' : 'OFF'}`);
  });
}

// ── CURSOR GLOW ──────────────────────────────────────────
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) {
    glow?.remove();
    return;
  }

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const animateGlow = () => {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = `${glowX}px`;
    glow.style.top  = `${glowY}px`;
    requestAnimationFrame(animateGlow);
  };
  animateGlow();
}

// ── HERO ─────────────────────────────────────────────────
function initHero() {
  const hero = document.getElementById('hero');
  setTimeout(() => hero?.classList.add('hero--loaded'), 100);

  // Parallax doodles on mouse
  const doodles = document.querySelectorAll('.hero__doodle');
  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    doodles.forEach((d, i) => {
      const depth = 0.015 * (i + 1);
      d.style.transform = `translate(${dx * depth * 80}px, ${dy * depth * 60}px)`;
    });
  }, { passive: true });
}

// ── PARALLAX ─────────────────────────────────────────────
function initParallax() {
  const layers = document.querySelectorAll('[data-parallax]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.parallax) || 0.3;
      const rect = layer.closest('section')?.getBoundingClientRect() || { top: 0 };
      const offset = (window.innerHeight - rect.top) * speed;
      layer.style.transform = `translateY(${offset * 0.1}px)`;
    });
  }, { passive: true });
}

// ── MODAL ─────────────────────────────────────────────────
let modalInstance = null;

function initModal() {
  modalInstance = new ProjectModal();
  labModalInstance = new LabModal();

  // Delegate click to open modal
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-project-id]');
    if (!trigger) return;

    const id = trigger.dataset.projectId;
    const type = trigger.dataset.type;

    if (!projectsData) return;

    let project;
    if (type === 'case') {
      project = projectsData.cases?.find(c => c.id === id);
    } else if (type === 'client') {
      project = projectsData.clients?.find(c => c.id === id);
    } else if (type === 'lab') {
      project = projectsData.lab?.find(c => c.id === id);
      if (project && labModalInstance) {
        labModalInstance.open(project);
        return;
      }
    } else {
      project = projectsData.cases?.find(c => c.id === id) ||
                projectsData.clients?.find(c => c.id === id);
    }

    if (project) modalInstance.open(project);
  });

  // Keyboard enter for cards
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const trigger = e.target.closest('[data-project-id]');
      trigger?.click();
    }
  });
}

// ── SKILLS → WORK LINK ───────────────────────────────────
function initSkillLinks() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scroll-to][data-filter]');
    if (!btn) return;

    const section = document.getElementById(btn.dataset.scrollTo);
    section?.scrollIntoView({ behavior: 'smooth' });

    // After scroll, activate tab
    setTimeout(() => {
      const filter = btn.dataset.filter;
      const tab = document.querySelector(`[data-tab="${filter}"]`);
      if (tab) tab.click();
    }, 600);
  });
}

function hydrateSiteSettings(site) {
  if (!site) return;

  // Hero
  if (site.hero) {
    const eyebrow = document.getElementById('hero-eyebrow');
    if (eyebrow && site.hero.eyebrow) eyebrow.textContent = site.hero.eyebrow;

    const name1 = document.getElementById('hero-name-1');
    const name2 = document.getElementById('hero-name-2');
    if (name1 && site.brand?.nameLine1) name1.textContent = site.brand.nameLine1;
    if (name2 && site.brand?.nameLine2) name2.textContent = site.brand.nameLine2;

    const tagline = document.getElementById('hero-tagline');
    if (tagline && site.hero.tagline) tagline.textContent = site.hero.tagline;

    const ctaWork = document.getElementById('hero-cta-work');
    if (ctaWork) {
      if (site.hero.ctaWorkHref) ctaWork.href = site.hero.ctaWorkHref;
      if (site.hero.ctaWorkText) ctaWork.innerHTML = `${site.hero.ctaWorkText} <span class="btn__icon">↓</span>`;
    }

    const ctaContact = document.getElementById('hero-cta-contact');
    if (ctaContact) {
      if (site.hero.ctaContactHref || site.hero.email) {
        ctaContact.href = site.hero.ctaContactHref || `mailto:${site.hero.email}`;
      }
      if (site.hero.ctaContactText) ctaContact.innerHTML = `${site.hero.ctaContactText} <span class="btn__icon">✉</span>`;
    }

    const socialGithub = document.getElementById('hero-social-github');
    if (socialGithub && site.hero.socials?.github) socialGithub.href = site.hero.socials.github;

    const socialBehance = document.getElementById('hero-social-behance');
    if (socialBehance && site.hero.socials?.behance) socialBehance.href = site.hero.socials.behance;
  }

  // Secciones
  if (site.sections) {
    const { cases, skills, work, lab } = site.sections;

    if (cases) {
      const elEyebrow = document.getElementById('cases-eyebrow');
      const elTitle = document.getElementById('cases-title');
      const elDesc = document.getElementById('cases-desc');
      if (elEyebrow && cases.eyebrow) elEyebrow.textContent = cases.eyebrow;
      if (elTitle && cases.title) elTitle.textContent = cases.title;
      if (elDesc && cases.description) elDesc.textContent = cases.description;
    }

    if (skills) {
      const elEyebrow = document.getElementById('skills-eyebrow');
      const elTitle = document.getElementById('skills-title');
      const elDesc = document.getElementById('skills-desc');
      const elLegM = document.getElementById('skills-legend-multimedia');
      const elLegC = document.getElementById('skills-legend-coding');
      if (elEyebrow && skills.eyebrow) elEyebrow.textContent = skills.eyebrow;
      if (elTitle && skills.title) elTitle.textContent = skills.title;
      if (elDesc && skills.description) elDesc.textContent = skills.description;
      if (elLegM && skills.legendMultimedia) elLegM.textContent = skills.legendMultimedia;
      if (elLegC && skills.legendCoding) elLegC.textContent = skills.legendCoding;
    }

    if (work) {
      const elEyebrow = document.getElementById('work-eyebrow');
      const elTitle = document.getElementById('work-title');
      const elDesc = document.getElementById('work-desc');
      if (elEyebrow && work.eyebrow) elEyebrow.textContent = work.eyebrow;
      if (elTitle && work.title) elTitle.textContent = work.title;
      if (elDesc && work.description) elDesc.textContent = work.description;
    }

    if (lab) {
      const elEyebrow = document.getElementById('lab-eyebrow');
      const elTitle = document.getElementById('lab-title');
      const elDesc = document.getElementById('lab-desc');
      const elNoteTitle = document.getElementById('lab-note-title');
      const elNoteContent = document.getElementById('lab-note-content');
      if (elEyebrow && lab.eyebrow) elEyebrow.textContent = lab.eyebrow;
      if (elTitle && lab.title) elTitle.textContent = lab.title;
      if (elDesc && lab.description) elDesc.textContent = lab.description;
      if (elNoteTitle && lab.noteTitle) elNoteTitle.textContent = lab.noteTitle;
      if (elNoteContent && lab.noteContent) elNoteContent.textContent = lab.noteContent;
    }
  }

  // Footer
  if (site.footer) {
    const logo = document.getElementById('footer-logo');
    if (logo && site.footer.logoHtml) logo.innerHTML = site.footer.logoHtml;

    const tagline = document.getElementById('footer-tagline');
    if (tagline && site.footer.tagline) tagline.innerHTML = site.footer.tagline;

    const contactEyebrow = document.getElementById('footer-contact-eyebrow');
    if (contactEyebrow && site.footer.contactEyebrow) contactEyebrow.textContent = site.footer.contactEyebrow;

    const contactEmail = document.getElementById('footer-contact-email');
    if (contactEmail && site.footer.contactEmail) {
      contactEmail.href = `mailto:${site.footer.contactEmail}`;
      contactEmail.textContent = site.footer.contactEmail;
    }

    const copy = document.getElementById('footer-copy');
    if (copy && site.footer.copyright) copy.textContent = site.footer.copyright;
  }
}

// ── PRELOADER TELEMETRY CONTROLLER ─────────────────────────
const preloaderEl = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const preloaderStatus = document.getElementById('preloader-status');
const preloaderPercent = document.getElementById('preloader-percent');

function setPreloadProgress(percent, statusText) {
  if (preloaderBar) preloaderBar.style.width = `${percent}%`;
  if (preloaderPercent) preloaderPercent.textContent = `${String(Math.round(percent)).padStart(2, '0')}%`;
  if (preloaderStatus && statusText) preloaderStatus.textContent = `// ${statusText}`;
}

async function finishPreloader() {
  if (!preloaderEl || preloaderEl.classList.contains('is-loaded')) return;
  setPreloadProgress(100, 'SYSTEM_READY');
  await new Promise(r => setTimeout(r, 180));
  preloaderEl.classList.add('is-loaded');
  setTimeout(() => {
    preloaderEl.style.display = 'none';
  }, 650);
}

// ── SCROLL TO TOP ─────────────────────────────────────────
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  let ticking = false;

  function update() {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  update();
}

// ── INIT ──────────────────────────────────────────────────
async function init() {
  console.log('%c[Portafolio:Main] ⏳ init() running, readyState:', 'color: #b8e030; font-weight: bold;', document.readyState);

  // Safety fallback: si algún recurso tarda de más, el preloader se retira en máx 2.2s
  const preloaderTimer = setTimeout(finishPreloader, 2200);

  setPreloadProgress(18, 'INITIALIZING MANIFESTS');

  // 1. Cargar datos dinámicos de proyectos y configuración
  try {
    await loadData();
    setPreloadProgress(38, 'HYDRATING SITE TOKENS');
    if (siteSettings) {
      hydrateSiteSettings(siteSettings);
    }
    if (projectsData) {
      renderFeatured(projectsData.cases);
      renderCaseCards(projectsData.cases);
      renderSkillCards(projectsData.skills);
      renderClientGrid(projectsData.clients);
      renderLabGrid(projectsData.lab);
    }
  } catch (err) {
    console.error('[Main] loadData error:', err);
  }

  setPreloadProgress(60, 'MOUNTING MODULAR BENTOS');

  // 2. Capa 2.b: Montar componentes Bento modulares
  const bentoContainer = document.getElementById('hero-bento-container');
  if (bentoContainer) {
    window.__bentoManagerInstance = bentoManager;
    await bentoManager.mount(bentoContainer);
  }

  setPreloadProgress(78, 'COMPILING 3D SHADERS');

  // 3. Capa 2.a & 2.c: Inicializar Sandwich 3D (canvas-back z:11, canvas-front z:14)
  const canvasBack = document.getElementById('three-canvas-back');
  const canvasFront = document.getElementById('three-canvas-front');
  if (canvasBack || canvasFront) {
    try {
      console.log('[Portafolio:Main] Instantiating dual-canvas HeroScene sandwich...');
      const scene = new HeroScene({ canvasBack, canvasFront }, bentoManager);
      window.__heroSceneInstance = scene;
      scene.init();
      console.log('[Portafolio:Main] HeroScene dual-canvas initialized.');
    } catch (err) {
      console.error('%c[Portafolio:Main] HeroScene init error:', 'background: red; color: white;', err);
    }
  }

  // 4. Init UI listeners & navigation
  initNav();
  initFxToggle();
  initHero();
  initCursorGlow();
  initReveal();
  initParallax();
  initModal();
  initSkillLinks();
  initSkillModal();
  initWorkTitleScrolltell();
  initScrollTop();

  // 5. Carousels & Grid Filter
  const casesCarousel = document.getElementById('cases-carousel');
  if (casesCarousel) new Carousel(casesCarousel);

  const skillsCarousel = document.getElementById('skills-carousel');
  if (skillsCarousel) new Carousel(skillsCarousel, { activeClass: '' });

  const labCarousel = document.getElementById('lab-carousel');
  if (labCarousel) new Carousel(labCarousel, { activeClass: '' });

  const workSection = document.getElementById('work');
  if (workSection) new GridFilter(workSection);

  setPreloadProgress(92, 'VERIFYING FONTS & LAYOUT');

  // Esperar a que las fuentes web terminen de renderizar (máx 300ms)
  if (document.fonts && document.fonts.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise(r => setTimeout(r, 300))
    ]);
  }

  clearTimeout(preloaderTimer);
  await finishPreloader();

  // 6. Defer Video Ambient Background: iniciarlo en idle / tras disipar el loader
  // para evitar saturación de ancho de banda y contención de hilos con YouTube en el primer paint
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initVideoBackground(), { timeout: 1500 });
  } else {
    setTimeout(() => initVideoBackground(), 400);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

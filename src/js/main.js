/* ==========================================================
   MAIN.JS — Bootstrap, Render, Observers
   ========================================================== */

console.log('%c[Portafolio:Main] 🚀 main.js loaded', 'background: #080810; color: #b8e030; font-weight: bold; border: 1px solid #b8e030; padding: 2px 6px; border-radius: 3px;');

import { HeroScene } from './three-scene.js';
import { Carousel } from './carousel.js';
import { GridFilter } from './grid-filter.js';
import { ProjectModal } from './project-modal.js';

// ── DATA ──────────────────────────────────────────────────
let projectsData = null;

async function loadData() {
  const res = await fetch('./src/data/projects.json');
  projectsData = await res.json();
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
             loading="${i < 2 ? 'eager' : 'lazy'}">
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

function renderClientGrid(clients, cases = []) {
  const grid = document.getElementById('clients-grid');
  if (!grid) return;

  const allProjects = [
    ...clients.map(c => ({ ...c, _type: 'client' })),
    ...cases.map(c => ({ ...c, _type: 'case' }))
  ];

  grid.innerHTML = allProjects.map(c => {
    const isMultimedia = c.category === 'multimedia' || (c.tags && c.tags.includes('multimedia')) || c.category === 'wordpress';
    const tagClass = isMultimedia ? 'tag--magenta' : 'tag--lime';
    const badge = c.client ? c.client : (c.category === 'coding' ? '✦ Coding' : '◈ Multimedia');
    const tagsStr = (c.tags || []).join(' ');

    return `
      <article class="project-thumb"
               data-category="${c.category}"
               data-tags="${tagsStr}"
               data-project-id="${c.id}"
               data-type="${c._type}"
               role="button" tabindex="0"
               aria-label="Ver proyecto: ${c.title}">
        <img class="project-thumb__img" src="${c.coverPlaceholder}" alt="${c.title}" loading="lazy">
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
        </div>
      </article>
    `;
  }).join('');
}

function renderLabGrid(lab) {
  const grid = document.getElementById('lab-grid');
  if (!grid) return;

  grid.innerHTML = lab.map(l => `
    <article class="lab-card" tabindex="0">
      <div class="lab-card__thumb lab-scanline">
        <img class="lab-card__img" src="${l.coverPlaceholder}" alt="${l.title}" loading="lazy">
        <span class="lab-card__badge">Experimento</span>
      </div>
      <div class="lab-card__body">
        <h3 class="lab-card__title">${l.title}</h3>
        <p class="lab-card__subtitle">${l.subtitle}</p>
        <p class="lab-card__desc">${l.description}</p>
        <div class="lab-card__links">
          ${l.links.demo ? `<a href="${l.links.demo}" class="btn btn--lime btn--sm" target="_blank">Demo <span class="btn__icon">↗</span></a>` : ''}
          ${l.links.github ? `<a href="${l.links.github}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank">Código</a>` : ''}
        </div>
      </div>
    </article>
  `).join('');
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

// ── NAV ──────────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

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
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      target?.scrollIntoView({ behavior: 'smooth' });
    });
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

  // Delegate click to open modal
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-project-id]');
    if (!trigger) return;

    const id = trigger.dataset.projectId;
    const type = trigger.dataset.type;

    if (!projectsData) return;

    let project;
    if (type === 'case') {
      project = projectsData.cases.find(c => c.id === id);
    } else {
      project = projectsData.clients.find(c => c.id === id);
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

// ── INIT ──────────────────────────────────────────────────
async function init() {
  console.log('%c[Portafolio:Main] ⏳ init() running, readyState:', 'color: #b8e030; font-weight: bold;', document.readyState);

  // 1. Init Hero 3D scene immediately
  const canvas = document.getElementById('three-canvas');
  console.log('[Portafolio:Main] Canvas element check:', canvas ? 'FOUND #three-canvas' : 'MISSING #three-canvas');
  if (canvas) {
    try {
      console.log('[Portafolio:Main] Instantiating HeroScene...');
      const scene = new HeroScene(canvas);
      window.__heroSceneInstance = scene;
      scene.init();
      console.log('[Portafolio:Main] HeroScene.init() executed.');
    } catch (err) {
      console.error('%c[Portafolio:Main] HeroScene init error:', 'background: red; color: white;', err);
    }
  }

  // 2. Init UI listeners & navigation
  initNav();
  initHero();
  initCursorGlow();
  initReveal();
  initParallax();
  initModal();
  initSkillLinks();

  // 3. Load projects data & render dynamic sections
  try {
    await loadData();
    if (projectsData) {
      renderFeatured(projectsData.cases);
      renderCaseCards(projectsData.cases);
      renderSkillCards(projectsData.skills);
      renderClientGrid(projectsData.clients, projectsData.cases);
      renderLabGrid(projectsData.lab);
    }
  } catch (err) {
    console.error('[Main] loadData error:', err);
  }

  // 4. Carousels & Grid Filter
  const casesCarousel = document.getElementById('cases-carousel');
  if (casesCarousel) new Carousel(casesCarousel);

  const skillsCarousel = document.getElementById('skills-carousel');
  if (skillsCarousel) new Carousel(skillsCarousel, { activeClass: '' });

  const workSection = document.getElementById('work');
  if (workSection) new GridFilter(workSection);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

#!/usr/bin/env node
/**
 * build.js — Generador de dist/index.html para vandalit/portafolio
 *
 * Responsabilidades:
 *   1. Leer todos los JSON de content/
 *   2. Generar dist/index.html con todo el texto en el HTML (no fetch, no innerHTML en runtime)
 *   3. Copiar src/css, src/js, src/vendor, src/components y assets a dist/
 *   4. [Fase posterior] Generar sitemap.xml, robots.txt, llms.txt
 *
 * El JS del sitio pasa a ser mejora progresiva:
 *   - Carrusel, modales, Three.js, animaciones → funcionan con JS
 *   - Texto, estructura y navegación → funcionan sin JS
 *
 * Uso: node build/build.js
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');
const DIST       = join(ROOT, 'dist');
const CONTENT    = join(ROOT, 'content');

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

function readJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`[build] JSON inválido en ${filePath}: ${err.message}`);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Copia recursiva (Node 16.7+ tiene cpSync nativa)
function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTORES DE CONTENIDO
// ─────────────────────────────────────────────────────────────────────────────

function loadSiteSettings() {
  return readJSON(join(CONTENT, 'settings', 'site.json'));
}

function loadCaseStudies() {
  const index = readJSON(join(CONTENT, 'case-studies', 'index.json'));
  return index
    .filter(id => !id.endsWith('.template'))
    .map(id => {
      const p = join(CONTENT, 'case-studies', id, 'project.json');
      const data = readJSON(p);
      data._id = id;
      return data;
    });
}

function loadClients() {
  const index = readJSON(join(CONTENT, 'clients', 'index.json'));
  return index
    .filter(id => !id.endsWith('.template'))
    .map(id => {
      const p = join(CONTENT, 'clients', id, 'project.json');
      const data = readJSON(p);
      data._id = id;
      return data;
    });
}

function loadLab() {
  const index = readJSON(join(CONTENT, 'lab', 'index.json'));
  return index.map(id => {
    const p = join(CONTENT, 'lab', id, 'project.json');
    const data = readJSON(p);
    data._id = id;
    return data;
  });
}

function loadSkills() {
  const raw = readJSON(join(CONTENT, 'skills', 'skills.json'));
  // Support new schema { legend, categories } or legacy flat array
  return Array.isArray(raw) ? { legend: {}, categories: raw } : raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERADORES DE HTML POR SECCIÓN (Identidad 1:1 con frontend main.js)
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * SKILLS — Perfil técnico
 */
function renderSkillCards(categories) {
  const ACCENT_MAP = { autoral: 'magenta', desarrollo: 'lime', comercial: 'mango' };
  const MAX_CARD_PILLS = 6;

  return categories.map((s) => {
    const primaryDot = (s.dots && s.dots[0]) || 'autoral';
    const accent = ACCENT_MAP[primaryDot] || 'magenta';
    const accentColor = accent === 'magenta' ? 'var(--magenta)' : accent === 'lime' ? 'var(--lime)' : 'var(--mango)';

    const icons = { circle: circleIcon, square: squareIcon, triangle: triangleIcon };
    const iconSvg = icons[s.icon] || circleIcon;

    const cardItems = (s.items || []).slice(0, MAX_CARD_PILLS);
    const extraCount = (s.items || []).length - cardItems.length;
    const modalData = JSON.stringify({ id: s.id, title: s.title, technicalName: s.technicalName, description: s.description, dots: s.dots, items: s.items || [] });
    const draftClass = s.draft ? ' skill-card--draft' : '';
    const bgStyle = s.bgImage ? ` style="--card-bg-image: url('${escapeHtml(s.bgImage)}')"` : '';
    const bgImgEl = s.bgImage ? `<div class="skill-card__bg-img" aria-hidden="true"></div>` : '';

    const hasWorkTab = s.workTab && s.workTab !== null;
    const ctaHtml = hasWorkTab
      ? `<button class="skill-card__cta btn--ghost-${accent}" data-filter="${escapeHtml(s.workTab)}" data-scroll-to="work">Ver ejemplos <span>→</span></button>`
      : `<button class="skill-card__cta skill-card__cta--disabled btn--ghost-${accent}" disabled aria-disabled="true">Ver ejemplos <span>→</span></button>`;

    return `
      <article class="skill-card${draftClass}" data-accent="${accent}" data-dots="${(s.dots || []).join(',')}" data-skill='${modalData.replace(/'/g, '&#39;')}'${bgStyle} tabindex="0">
        ${bgImgEl}
        <div class="skill-card__icon-bg">${iconSvg(accentColor)}</div>
        <p class="skill-card__category">${escapeHtml(s.technicalName.toUpperCase())}</p>
        <h3 class="skill-card__title">${escapeHtml(s.title)}</h3>
        <p class="skill-card__desc">${escapeHtml(s.description)}</p>
        <div class="skill-card__pills">
          ${cardItems.map(item => `<span class="skill-pill">${escapeHtml(item.name)}</span>`).join('')}
          ${extraCount > 0 ? `<span class="skill-pill skill-pill--more">+${extraCount} más</span>` : ''}
        </div>
        ${ctaHtml}
      </article>
    `.trim();
  }).join('\n');
}

/**
 * CASES — Caso destacado (featured) y carousel de cards
 */
function renderFeatured(cases) {
  const featured = cases.find(c => c.featured) || cases[0];
  if (!featured) return '<!-- sin caso destacado -->';

  const isMultimedia = featured.category === 'multimedia';
  const coverSrc = featured.coverPlaceholder || featured.cover || '';

  return `
    <img class="featured-case__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(featured.title)}" loading="eager" decoding="async" onload="this.classList.add('is-loaded')">
    <div class="featured-case__overlay"></div>
    <div class="featured-case__body">
      <p class="featured-case__eyebrow">${escapeHtml(featured.category.toUpperCase())} · ${escapeHtml(featured.role)}</p>
      <h3 class="featured-case__title">${escapeHtml(featured.title)}</h3>
      <p class="featured-case__desc">${escapeHtml(featured.description)}</p>
      <div class="featured-case__tags">
        ${(featured.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        <span class="tag ${isMultimedia ? 'tag--magenta' : 'tag--lime'}">${escapeHtml(String(featured.year))}</span>
        <span class="tag">${escapeHtml(featured.role)}</span>
      </div>
    </div>
  `.trim();
}

function renderCaseCards(cases) {
  return cases.map((c, i) => {
    const isMultimedia = c.category === 'multimedia';
    const accentColor = isMultimedia ? 'var(--magenta)' : 'var(--lime)';
    const tagClass = isMultimedia ? 'tag--magenta' : 'tag--lime';
    const coverSrc = c.coverPlaceholder || c.cover || '';

    return `
      <article class="case-card ${i === 0 ? 'is-active' : ''}"
               data-project-id="${escapeHtml(c.id || c._id)}"
               data-type="case"
               role="button"
               tabindex="0"
               style="--card-accent: ${accentColor};">
        <div class="case-card__thumb">
          <img class="case-card__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(c.title)}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" onload="this.classList.add('is-loaded')">
          <div class="case-card__thumb-overlay"></div>
          <span class="case-card__year">${escapeHtml(String(c.year))}</span>
        </div>
        <div class="case-card__body">
          <p class="case-card__role">${escapeHtml(c.role)}</p>
          <h3 class="case-card__title">${escapeHtml(c.title)}</h3>
          <div class="case-card__tags">
            ${(c.tags || []).map(t => `<span class="tag ${tagClass}">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      </article>
    `.trim();
  }).join('\n');
}

/**
 * CLIENTS / TRABAJOS — Grid flush
 */
const DEFAULT_COVER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23f4f4f4'/%3E%3C/svg%3E`;

function renderClientGrid(clients) {
  const allProjects = clients.map(c => ({ ...c, _type: 'client' }));

  return allProjects.map(c => {
    const isMultimedia = c.category === 'multimedia' || (c.tags && c.tags.includes('multimedia')) || c.category === 'wordpress';
    const tagClass = isMultimedia ? 'tag--magenta' : 'tag--lime';
    const badge = c.client ? c.client : (c.category === 'coding' ? '✦ Coding' : '◈ Multimedia');
    const tagsStr = (c.tags || []).join(' ');
    const coverSrc = c.cover || c.coverPlaceholder || DEFAULT_COVER_SVG;
    const isEmpty = !c.client && !c.description;

    return `
      <article class="project-thumb ${isEmpty ? 'project-thumb--wip' : ''}"
               data-category="${escapeHtml(c.category || '')}"
               data-tags="${escapeHtml(tagsStr)}"
               data-project-id="${isEmpty ? '' : escapeHtml(c.id || c._id)}"
               data-type="${escapeHtml(c._type)}"
               ${isEmpty ? '' : 'role="button" tabindex="0"'}
               aria-label="${isEmpty ? 'Proyecto próximamente' : 'Ver proyecto: ' + escapeHtml(c.title)}">
        <img class="project-thumb__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(c.title || 'Próximamente')}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')">
        ${isEmpty ? '<div class="project-thumb__wip-badge">Próximamente</div>' : `
        <div class="project-thumb__overlay"></div>
        <div class="project-thumb__info">
          <div class="project-thumb__header">
            <span class="tag ${tagClass}">${escapeHtml(badge)}</span>
            <span class="project-thumb__meta">${escapeHtml(String(c.year || ''))}</span>
          </div>
          <h3 class="project-thumb__title">${escapeHtml(c.title)}</h3>
          <p class="project-thumb__subtitle">
            ${escapeHtml(c.subtitle || c.role || '')}
          </p>
        </div>`}
      </article>
    `.trim();
  }).join('\n');
}

/**
 * LAB — Carrusel de experimentos
 */
function renderLabGrid(lab) {
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

  return blocks.map(block => {
    if (block.type === 'expanded') {
      const l = block.item;
      const badge = l.badge || (l.tags && l.tags[0]) || 'Experimento';
      const demoBtn = l.links?.demo ? `<a href="${escapeHtml(l.links.demo)}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>` : '';
      const codeBtn = l.links?.github ? `<a href="${escapeHtml(l.links.github)}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>` : '';
      const coverSrc = l.coverPlaceholder || l.cover || '';

      return `
        <article class="lab-card--expanded" data-lab-id="${escapeHtml(l.id || l._id)}" tabindex="0" role="button" aria-label="Ver experimento: ${escapeHtml(l.title)}">
          <div class="lab-card__thumb lab-scanline">
            <img class="lab-card__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(l.title)}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')">
            <span class="lab-card__badge">${escapeHtml(badge)}</span>
          </div>
          <div class="lab-card__body">
            <h3 class="lab-card__title">${escapeHtml(l.title)}</h3>
            <p class="lab-card__subtitle">${escapeHtml(l.subtitle || 'Exploración técnica')}</p>
            <p class="lab-card__desc">${escapeHtml(l.description || '')}</p>
            <div class="lab-card__links">
              ${demoBtn}
              ${codeBtn}
            </div>
          </div>
        </article>
      `.trim();
    } else {
      const items = block.items;
      const isOverlap = items.length >= 4;

      const innerCards = items.map(l => {
        const badge = l.badge || (l.tags && l.tags[0]) || 'Ejemplo';
        const demoBtn = l.links?.demo ? `<a href="${escapeHtml(l.links.demo)}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>` : '';
        const codeBtn = l.links?.github ? `<a href="${escapeHtml(l.links.github)}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>` : '';

        return `
          <div class="lab-card--compressed" data-lab-id="${escapeHtml(l.id || l._id)}" aria-label="Template o caso base: ${escapeHtml(l.title)}">
            <div class="lab-card__header--compressed">
              <span class="lab-pill-outline">${escapeHtml(badge)}</span>
            </div>
            <div class="lab-card__body--compressed">
              <h4 class="lab-card__title--compressed">${escapeHtml(l.title)}</h4>
              <p class="lab-card__desc--compressed">${escapeHtml(l.description || l.subtitle || '')}</p>
            </div>
            ${(demoBtn || codeBtn) ? `
            <div class="lab-card__links lab-card__links--compressed">
              ${demoBtn}
              ${codeBtn}
            </div>` : ''}
          </div>
        `.trim();
      }).join('\n');

      return `
        <div class="lab-wrapper ${isOverlap ? 'lab-wrapper--overlap' : ''}">
          ${innerCards}
        </div>
      `.trim();
    }
  }).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// ENSAMBLADOR — Toma index.html y reemplaza los placeholders
// ─────────────────────────────────────────────────────────────────────────────

function buildHtml({ site, cases, clients, lab, skills }) {
  let html = readFileSync(join(ROOT, 'index.html'), 'utf8');

  // ── 1. HEAD: ajustar rutas de assets de relativas a dist-relativas ──────────
  // En dist/ los archivos están al mismo nivel, las rutas ./src/ → ./src/ se mantienen.
  // Solo ajustamos title y description desde site.json si difieren.
  // (meta tags completas vienen en Fase 3 con seo.json)

  // ── 2. SKILLS — carrusel de habilidades ────────────────────────────────────
  html = html.replace(
    /(<div class="carousel-track" role="list">\s*)<!-- Skill cards populated by JS -->(\s*<\/div>)/,
    `$1${renderSkillCards(skills.categories || [])}\n            $2`
  );

  // ── 3. CASES — caso destacado ───────────────────────────────────────────────
  html = html.replace(
    /(<div id="featured-case"[^>]*>\s*)<!-- Populated by JS -->(\s*<\/div>)/,
    `$1\n      ${renderFeatured(cases)}\n    $2`
  );

  // ── 4. CASES — carrusel de cards ────────────────────────────────────────────
  html = html.replace(
    /(<div class="carousel-track" role="list">\s*)<!-- Cards populated by JS -->(\s*<\/div>)/,
    `$1${renderCaseCards(cases)}\n            $2`
  );

  // ── 5. TRABAJOS — grid de clientes ──────────────────────────────────────────
  html = html.replace(
    /(<div id="clients-grid"[^>]*>\s*)<!-- Populated by JS -->(\s*<\/div>)/,
    `$1\n      ${renderClientGrid(clients)}\n    $2`
  );

  // ── 6. LAB — carrusel de experimentos ───────────────────────────────────────
  html = html.replace(
    /(<div id="lab-track"[^>]*>\s*)<!-- Cards & Wrappers populated by JS -->(\s*<\/div>)/,
    `$1\n            ${renderLabGrid(lab)}\n          $2`
  );

  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// METADATA GENERATORS: ROBOTS, SITEMAP, LLMS.TXT & VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────

function validateContent({ site, cases, clients, lab, skills }) {
  console.log('[build] 🔍 Validando coherencia de datos...');
  const errors = [];
  const warnings = [];

  if (!site.brand?.fullName) errors.push('site.json: falta brand.fullName');
  if (!site.hero?.email) errors.push('site.json: falta hero.email');

  cases.forEach(c => {
    if (!c.title) errors.push(`Caso sin título (${c.id || 'desconocido'})`);
    if (!c.description) warnings.push(`Caso sin descripción: ${c.title}`);
  });

  (skills.categories || []).forEach(s => {
    if (!s.title) errors.push(`Grupo de habilidades sin título (${s.id})`);
    if (!Array.isArray(s.items) || s.items.length === 0) warnings.push(`Habilidades vacías en ${s.title}`);
  });

  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`[build]    ⚠️  ${w}`));
  }

  if (errors.length > 0) {
    errors.forEach(e => console.error(`[build]    ❌ ${e}`));
    throw new Error(`Validación fallida con ${errors.length} error(es) críticos.`);
  }

  console.log('[build]    ✓ Validación superada exitosamente.');
}

function generateRobotsTxt() {
  const robots = `User-agent: *
Allow: /

Sitemap: https://vandalit.github.io/portafolio/sitemap.xml
`;
  writeFileSync(join(DIST, 'robots.txt'), robots, 'utf8');
  console.log('[build]    ✓ dist/robots.txt generado');
}

function generateSitemapXml() {
  const today = new Date().toISOString().split('T')[0];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vandalit.github.io/portafolio/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8');
  console.log('[build]    ✓ dist/sitemap.xml generado');
}

function generateLlmsTxt({ site, cases, clients, lab, skills }) {
  const brand = site.brand?.fullName || 'vandalit';
  const tagline = site.hero?.tagline || '';
  const email = site.hero?.email || '';

  const skillsBlock = (skills.categories || [])
    .map(s => `- **${s.title}** (${s.technicalName}): ${s.description} [Skills: ${(s.items || []).map(i => i.name).join(', ')}]`)
    .join('\n');

  const casesBlock = cases
    .map(c => `- **${c.title}** (${c.year}): ${c.description} (Rol: ${c.role})`)
    .join('\n');

  const labBlock = lab
    .map(l => `- **${l.title}**: ${l.description || l.subtitle}`)
    .join('\n');

  const clientsBlock = clients
    .filter(c => c.title && c.title !== 'Próximamente')
    .map(c => `- **${c.title}** (${c.year}): ${c.subtitle || c.role || ''}`)
    .join('\n');

  const content = `# ${brand}
> ${site.hero?.eyebrow || 'UX/UI Designer & Front-end Developer'}
> Ubicación: Valparaíso, Chile
> Sitio web oficial: https://vandalit.github.io/portafolio/
> Contacto directo: ${email}
> GitHub: https://github.com/vandalit
> Behance: https://behance.net/vandalit

## Resumen de Perfil
${tagline}
Especialista en diseño de producto digital (UX/UI, design systems, prototipado) e ingeniería front-end (HTML/CSS nativo, JavaScript moderno, Three.js, WebGL y optimización de rendimiento).

## Capacidades y Perfil Técnico
${skillsBlock}

## Casos de Estudio Seleccionados
${casesBlock}

## Proyectos Reales y Trabajos
${clientsBlock}

## Laboratorio de Experimentación (R&D)
${labBlock}

## Enlaces y Canales Oficiales
- Portafolio: https://vandalit.github.io/portafolio/
- Repositorio código abierto: https://github.com/vandalit/portafolio
- Contacto: ${email}
`;

  writeFileSync(join(DIST, 'llms.txt'), content, 'utf8');
  console.log('[build]    ✓ dist/llms.txt generado');
}

// ─────────────────────────────────────────────────────────────────────────────
// COPIADOR DE ASSETS
// ─────────────────────────────────────────────────────────────────────────────

function copyAssets() {
  // src/css, src/js, src/components, src/vendor, src/data
  copyDir(join(ROOT, 'src'),     join(DIST, 'src'));
  // assets estáticos (imágenes locales)
  copyDir(join(ROOT, 'assets'), join(DIST, 'assets'));
  // content/ (para que los fetch del JS sigan funcionando en dev mode)
  copyDir(join(ROOT, 'content'), join(DIST, 'content'));
  // backoffice (studio local)
  copyDir(join(ROOT, 'backoffice'), join(DIST, 'backoffice'));
  // demos
  copyDir(join(ROOT, 'demos'), join(DIST, 'demos'));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[build] ══ vandalit/portafolio build ══════════════════════\n');

  // 1. Preparar dist/
  mkdirSync(DIST, { recursive: true });

  // 2. Leer contenido
  console.log('[build] 📖 Leyendo content/...');
  const site    = loadSiteSettings();
  const cases   = loadCaseStudies();
  const clients = loadClients();
  const lab     = loadLab();
  const skills  = loadSkills();

  console.log(`[build]    - ${cases.length} casos de estudio`);
  console.log(`[build]    - ${clients.length} proyectos (trabajos)`);
  console.log(`[build]    - ${lab.length} experimentos de lab`);
  console.log(`[build]    - ${(skills.categories || []).length} grupos de habilidades`);

  // 3. Validar
  validateContent({ site, cases, clients, lab, skills });

  // 4. Generar dist/index.html
  console.log('\n[build] 🔨 Generando dist/index.html...');
  const html = buildHtml({ site, cases, clients, lab, skills });
  writeFileSync(join(DIST, 'index.html'), html, 'utf8');
  console.log('[build]    ✓ dist/index.html escrito');

  // 5. Generar robots.txt, sitemap.xml y llms.txt
  console.log('\n[build] 🌐 Generando artefactos SEO & LLMs...');
  generateRobotsTxt();
  generateSitemapXml();
  generateLlmsTxt({ site, cases, clients, lab, skills });

  // 6. Copiar assets
  console.log('\n[build] 📁 Copiando assets...');
  copyAssets();
  console.log('[build]    ✓ src/ → dist/src/');
  console.log('[build]    ✓ assets/ → dist/assets/');
  console.log('[build]    ✓ content/ → dist/content/');

  // 7. Reporte final
  const distSize = readdirSync(DIST).length;
  console.log(`\n[build] ✅ Build completado exitosamente. ${distSize} entradas en dist/`);
  console.log('[build] ══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n[build] ❌ BUILD FALLIDO:', err.message);
  process.exit(1);
});

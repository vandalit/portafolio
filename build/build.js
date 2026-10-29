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
  return readJSON(join(CONTENT, 'skills', 'skills.json'));
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERADORES DE HTML POR SECCIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SKILLS — Perfil técnico
 * Genera cards pre-renderizadas en HTML; el carrusel JS funciona como enhancer.
 */
function renderSkillCards(skills) {
  return skills.map(skill => {
    const colorDot    = skill.accentColor || '#d4205a';
    const filterTag   = skill.filterTag   || skill.category || '';
    const skillPills  = (skill.skills || [])
      .map(s => `<span class="skill-pill">${escapeHtml(s)}</span>`)
      .join('');

    return `
      <article class="skill-card" data-filter="${escapeHtml(filterTag)}" role="listitem">
        <div class="skill-card__accent" style="background:${colorDot}" aria-hidden="true"></div>
        <div class="skill-card__body">
          <div class="skill-card__header">
            <span class="skill-card__dot" style="background:${colorDot}" aria-hidden="true"></span>
            <span class="skill-card__category eyebrow">${escapeHtml(filterTag)}</span>
          </div>
          <h3 class="skill-card__title">${escapeHtml(skill.title)}</h3>
          <p class="skill-card__desc">${escapeHtml(skill.description)}</p>
          <div class="skill-card__pills" aria-label="Tecnologías y herramientas">
            ${skillPills}
          </div>
        </div>
      </article>`.trim();
  }).join('\n');
}

/**
 * CASES — Caso destacado (featured) y carousel de cards
 */
function renderFeatured(cases) {
  const featured = cases.find(c => c.featured) || cases[0];
  if (!featured) return '<!-- sin caso destacado -->';

  const tagClass = featured.category === 'coding' ? 'tag--coding' : 'tag--multimedia';
  const badge    = (featured.tags && featured.tags[0]) || featured.category || '';
  const coverSrc = featured.coverPlaceholder || featured.cover || '';

  return `
    <div class="featured-case__content">
      <div class="featured-case__thumb">
        <img
          class="featured-case__img"
          src="${escapeHtml(coverSrc)}"
          alt="Portada del proyecto ${escapeHtml(featured.title)}"
          width="1200" height="675"
          loading="eager"
          decoding="async">
        <span class="tag ${tagClass}">${escapeHtml(badge)}</span>
      </div>
      <div class="featured-case__info">
        <p class="eyebrow">${escapeHtml(featured.role || '')}</p>
        <h3 class="featured-case__title display">${escapeHtml(featured.title)}</h3>
        <p class="featured-case__desc">${escapeHtml(featured.description)}</p>
        <div class="featured-case__meta">
          <span class="featured-case__year">${escapeHtml(String(featured.year || ''))}</span>
        </div>
      </div>
    </div>`.trim();
}

function renderCaseCards(cases) {
  return cases.map((c, i) => {
    const tagClass = c.category === 'coding' ? 'tag--coding' : 'tag--multimedia';
    const badge    = (c.tags && c.tags[0]) || c.category || '';
    const coverSrc = c.coverPlaceholder || c.cover || '';

    return `
      <article
        class="case-card"
        data-case-id="${escapeHtml(c.id || c._id)}"
        tabindex="0"
        role="listitem button"
        aria-label="Ver caso: ${escapeHtml(c.title)}">
        <div class="case-card__thumb">
          <img
            class="case-card__img"
            src="${escapeHtml(coverSrc)}"
            alt="Portada de ${escapeHtml(c.title)}"
            width="800" height="450"
            loading="${i < 2 ? 'eager' : 'lazy'}"
            decoding="async">
        </div>
        <div class="case-card__body">
          <div class="case-card__meta-row">
            <span class="tag ${tagClass}">${escapeHtml(badge)}</span>
            <span class="case-card__year">${escapeHtml(String(c.year || ''))}</span>
          </div>
          <h3 class="case-card__title">${escapeHtml(c.title)}</h3>
          <p class="case-card__subtitle">${escapeHtml(c.subtitle || c.role || '')}</p>
        </div>
      </article>`.trim();
  }).join('\n');
}

/**
 * CLIENTS / TRABAJOS — Grid flush
 */
const DEFAULT_COVER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23f4f4f4'/%3E%3C/svg%3E`;

function renderClientGrid(clients) {
  return clients.map(c => {
    const coverSrc = c.coverPlaceholder || c.cover || DEFAULT_COVER_SVG;
    const isWip    = !c.title || c.title === 'Próximamente';
    const tabTag   = c.category ? `data-tab="${escapeHtml(c.category)}"` : '';

    return `
      <article
        class="project-thumb${isWip ? ' project-thumb--wip' : ''}"
        ${tabTag}
        role="listitem"
        ${!isWip ? `data-client-id="${escapeHtml(c.id || c._id)}" tabindex="0"` : ''}>
        <img
          class="project-thumb__img"
          src="${escapeHtml(coverSrc)}"
          alt="${isWip ? 'Próximamente' : escapeHtml(c.title)}"
          width="800" height="450"
          loading="lazy"
          decoding="async">
        ${!isWip ? `
        <div class="project-thumb__overlay">
          <div class="project-thumb__meta-row">
            <span class="tag">${escapeHtml((c.tags && c.tags[0]) || c.category || '')}</span>
            <span class="project-thumb__meta">${escapeHtml(String(c.year || ''))}</span>
          </div>
          <h3 class="project-thumb__title">${escapeHtml(c.title)}</h3>
          <p class="project-thumb__meta" style="color:var(--text-1);font-size:var(--text-xs);margin-top:2px;text-transform:none">${escapeHtml(c.subtitle || c.role || '')}</p>
        </div>` : ''}
      </article>`.trim();
  }).join('\n');
}

/**
 * LAB — Carrusel de experimentos
 * Agrupa comprimidos en wrappers igual que el JS actual.
 */
function renderLabGrid(lab) {
  // Agrupar por cardType, igual que main.js
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
      const l        = block.item;
      const badge    = l.badge || (l.tags && l.tags[0]) || 'Experimento';
      const coverSrc = l.coverPlaceholder || l.cover || '';
      const demoBtn  = l.links?.demo
        ? `<a href="${escapeHtml(l.links.demo)}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>`
        : '';
      const codeBtn  = l.links?.github
        ? `<a href="${escapeHtml(l.links.github)}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>`
        : '';

      return `
        <article
          class="lab-card--expanded"
          data-lab-id="${escapeHtml(l.id || l._id)}"
          tabindex="0"
          role="listitem button"
          aria-label="Ver experimento: ${escapeHtml(l.title)}">
          <div class="lab-card__thumb lab-scanline">
            <img
              class="lab-card__img"
              src="${escapeHtml(coverSrc)}"
              alt="${escapeHtml(l.title)}"
              loading="lazy"
              decoding="async">
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
        </article>`.trim();
    } else {
      // Wrapper con cards comprimidas
      const isOverlap = block.items.length >= 4;
      const innerCards = block.items.map(l => {
        const badge   = l.badge || (l.tags && l.tags[0]) || 'Ejemplo';
        const demoBtn = l.links?.demo
          ? `<a href="${escapeHtml(l.links.demo)}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>`
          : '';
        const codeBtn = l.links?.github
          ? `<a href="${escapeHtml(l.links.github)}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>`
          : '';

        return `
          <div class="lab-card--compressed" data-lab-id="${escapeHtml(l.id || l._id)}" aria-label="${escapeHtml(l.title)}">
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
          </div>`.trim();
      }).join('\n');

      return `
        <div class="lab-wrapper ${isOverlap ? 'lab-wrapper--overlap' : ''}">
          ${innerCards}
        </div>`.trim();
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
    `$1${renderSkillCards(skills)}\n            $2`
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
  console.log(`[build]    - ${skills.length} grupos de habilidades`);

  // 3. Generar dist/index.html
  console.log('\n[build] 🔨 Generando dist/index.html...');
  const html = buildHtml({ site, cases, clients, lab, skills });
  writeFileSync(join(DIST, 'index.html'), html, 'utf8');
  console.log('[build]    ✓ dist/index.html escrito');

  // 4. Copiar assets
  console.log('\n[build] 📁 Copiando assets...');
  copyAssets();
  console.log('[build]    ✓ src/ → dist/src/');
  console.log('[build]    ✓ assets/ → dist/assets/');
  console.log('[build]    ✓ content/ → dist/content/');

  // 5. Reporte final
  const distSize = readdirSync(DIST).length;
  console.log(`\n[build] ✅ Build completado. ${distSize} entradas en dist/`);
  console.log('[build] ══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n[build] ❌ BUILD FALLIDO:', err.message);
  process.exit(1);
});

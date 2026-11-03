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

// Importar parciales
import { renderSkillCards } from './partials/skills.js';
import { renderFeatured, renderCaseCards } from './partials/cases.js';
import { renderClientGrid } from './partials/work.js';
import { renderLabGrid } from './partials/lab.js';
import { escapeHtml } from './utils.js';

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

// Copia recursiva (Node 16.7+ tiene cpSync nativa)
function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTORES DE CONTENIDO
// ─────────────────────────────────────────────────────────────────────────────

function resolveAssetPath(section, slug, assetPath) {
  if (!assetPath) return '';
  // Quitar localhost o 127.0.0.1 si estuviera presente
  let cleaned = assetPath.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?/i, '');
  cleaned = cleaned.replace(/^\/?content\/[^\/]+\/[^\/]+\//i, '');
  if (/^(https?:|\/\/|data:)/i.test(cleaned)) {
    return cleaned;
  }
  cleaned = cleaned.replace(/^(\.\/|\/)+/, '');
  return `./content/${section}/${slug}/${cleaned}`;
}

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
      data.cover = resolveAssetPath('case-studies', id, data.cover || data.coverPlaceholder);
      data.coverPlaceholder = data.cover;
      if (Array.isArray(data.gallery)) {
        data.gallery = data.gallery.map(img => resolveAssetPath('case-studies', id, img));
      }
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
      data.cover = resolveAssetPath('clients', id, data.cover || data.coverPlaceholder);
      data.coverPlaceholder = data.cover;
      if (Array.isArray(data.gallery)) {
        data.gallery = data.gallery.map(img => resolveAssetPath('clients', id, img));
      }
      return data;
    });
}

function loadLab() {
  const index = readJSON(join(CONTENT, 'lab', 'index.json'));
  return index.map(id => {
    const p = join(CONTENT, 'lab', id, 'project.json');
    const data = readJSON(p);
    data._id = id;
    data.cover = resolveAssetPath('lab', id, data.cover || data.coverPlaceholder);
    data.coverPlaceholder = data.cover;
    if (Array.isArray(data.gallery)) {
      data.gallery = data.gallery.map(img => resolveAssetPath('lab', id, img));
    }
    return data;
  });
}

function loadSkills() {
  const raw = readJSON(join(CONTENT, 'skills', 'skills.json'));
  // Support new schema { legend, categories } or legacy flat array
  return Array.isArray(raw) ? { legend: {}, categories: raw } : raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERADORES DE HTML (ahora importados desde parciales)
// ─────────────────────────────────────────────────────────────────────────────
// Los renders ahora vienen de build/partials/*.js

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
    if (c.cover && (c.cover.includes('localhost') || c.cover.includes('127.0.0.1'))) {
      errors.push(`Ruta prohibida con localhost en portada de caso: ${c.title} -> ${c.cover}`);
    }
  });

  clients.forEach(cl => {
    if (cl.cover && (cl.cover.includes('localhost') || cl.cover.includes('127.0.0.1'))) {
      errors.push(`Ruta prohibida con localhost en portada de trabajo: ${cl.title} -> ${cl.cover}`);
    }
  });

  lab.forEach(lb => {
    if (lb.cover && (lb.cover.includes('localhost') || lb.cover.includes('127.0.0.1'))) {
      errors.push(`Ruta prohibida con localhost en portada de lab: ${lb.title} -> ${lb.cover}`);
    }
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

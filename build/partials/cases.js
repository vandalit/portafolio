/**
 * cases.js — Renderiza la sección de Cases (Caso destacado + Carousel)
 */

import { escapeHtml } from '../utils.js';

export function renderFeatured(cases) {
  const featured = cases.find(c => c.featured) || cases[0];
  if (!featured) return '<!-- sin caso destacado -->';

  const isMultimedia = featured.category === 'multimedia';
  const coverSrc = featured.coverPlaceholder || featured.cover || '';

  return `
    <img class="featured-case__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(featured.title)}" loading="eager" decoding="async" onload="this.classList.add('is-loaded');this.closest('.featured-case').classList.add('image-loaded')">
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

export function renderCaseCards(cases) {
  const featured = cases.find(c => c.featured) || cases[0];
  const carouselCases = featured ? cases.filter(c => (c.id || c._id) !== (featured.id || featured._id)) : cases;

  return carouselCases.map((c, i) => {
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
          <img class="case-card__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(c.title)}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" onload="this.classList.add('is-loaded');this.closest('.case-card').classList.add('image-loaded')">
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

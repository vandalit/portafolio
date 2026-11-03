/**
 * work.js — Renderiza la sección de Work (Proyectos de clientes)
 */

import { escapeHtml } from '../utils.js';

const DEFAULT_COVER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23f4f4f4'/%3E%3C/svg%3E`;

export function renderClientGrid(clients) {
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
        <img class="project-thumb__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(c.title || 'Próximamente')}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded');this.closest('.project-thumb').classList.add('image-loaded')">
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

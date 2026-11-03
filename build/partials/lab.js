/**
 * lab.js — Renderiza la sección de Lab (Experimentos)
 */

import { escapeHtml } from '../utils.js';

export function renderLabGrid(lab) {
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
      const demoUrl = (l.links?.demo || l.links?.live || '').trim();
      const codeUrl = (l.links?.github || '').trim();
      const demoBtn = demoUrl ? `<a href="${escapeHtml(demoUrl)}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>` : '';
      const codeBtn = codeUrl ? `<a href="${escapeHtml(codeUrl)}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>` : '';
      const coverSrc = l.coverPlaceholder || l.cover || '';

      return `
        <article class="lab-card--expanded" data-lab-id="${escapeHtml(l.id || l._id)}" tabindex="0" role="button" aria-label="Ver experimento: ${escapeHtml(l.title)}">
          <div class="lab-card__thumb lab-scanline">
            <img class="lab-card__img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(l.title)}" loading="lazy" decoding="async" onload="this.classList.add('is-loaded');this.closest('.lab-card__thumb').classList.add('image-loaded')">
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
        const demoUrl = (l.links?.demo || l.links?.live || '').trim();
        const codeUrl = (l.links?.github || '').trim();
        const demoBtn = demoUrl ? `<a href="${escapeHtml(demoUrl)}" class="btn btn--lime btn--sm" target="_blank" rel="noopener">Demo <span class="btn__icon">↗</span></a>` : '';
        const codeBtn = codeUrl ? `<a href="${escapeHtml(codeUrl)}" class="btn btn--ghost btn--ghost-lime btn--sm" target="_blank" rel="noopener">Código</a>` : '';

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

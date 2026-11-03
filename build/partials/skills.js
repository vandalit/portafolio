/**
 * skills.js — Renderiza la sección de Skills (Perfil técnico)
 */

import { escapeHtml } from '../utils.js';

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

export function renderSkillCards(categories) {
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

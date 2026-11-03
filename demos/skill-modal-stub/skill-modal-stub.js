const LEVELS = {
  '0': 0,
  avanzado: 95,
  intermedio: 70,
  basico: 40,
  'en-formacion': 20,
  'en-desarrollo': 20,
  'en-proceso': 20
};

const pills = document.querySelector('[data-pills]');

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function renderPills(items, levelMode) {
  const itemsHTML = items.map((item) => {
    const levelPct = LEVELS[item.level] ?? 40;
    const isUnmeasured = levelPct === 0;
    const stateClass = levelMode
      ? isUnmeasured ? ' skill-stub__pill--unmeasured' : ' skill-stub__pill--level'
      : '';
    const levelStyle = levelMode && !isUnmeasured
      ? ` style="--level-pct:${levelPct}%"`
      : '';

    return `<span class="skill-stub__pill${stateClass}"${levelStyle}><span>${escapeHTML(item.name)}</span></span>`;
  }).join('');

  const eyeLabel = levelMode ? 'Ocultar niveles' : 'Mostrar niveles';
  pills.innerHTML = `${itemsHTML}
    <button class="skill-stub__eye${levelMode ? ' is-active' : ''}" type="button"
      aria-label="${eyeLabel}" aria-pressed="${levelMode}" title="${eyeLabel}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>`;
  pills.querySelector('.skill-stub__eye').addEventListener('click', () => {
    renderPills(items, !levelMode);
  });
}

try {
  const response = await fetch('../../content/skills/skills.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const content = await response.json();
  const skill = content.categories?.find((category) => category.id === 'diseno-producto');
  if (!skill) throw new Error('No se encontró la categoría de diseño de producto.');
  renderPills(skill.items || [], true);
} catch (error) {
  console.error('[SkillModalStub] No se pudo cargar skills.json:', error);
  document.querySelector('.skill-stub__title').textContent = 'No se pudo cargar la propuesta';
  document.querySelector('.skill-stub__description').textContent = error.message;
}

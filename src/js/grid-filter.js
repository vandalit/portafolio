/* ==========================================================
   GRID-FILTER.JS — Tabs + Animated Filter
   ========================================================== */

export class GridFilter {
  constructor(containerEl) {
    this.container = containerEl;
    this.tabs = [...containerEl.querySelectorAll('.tab-btn')];
    this.items = [...containerEl.querySelectorAll('[data-category]')];
    this.current = 'all';
    this._init();
  }

  _init() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.tab;
        this._setActive(tab);
        this._filter(cat);
      });
    });
  }

  _setActive(tab) {
    this.tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  }

  _filter(category) {
    this.current = category;
    let delay = 0;

    this.items.forEach((item) => {
      const itemCat = item.dataset.category;
      const itemTags = (item.dataset.tags || '').toLowerCase().split(/\s+/);
      const match = category === 'all' || itemCat === category || itemTags.includes(category);

      if (match) {
        item.style.transitionDelay = `${delay}ms`;
        delay += 40;
        item.classList.remove('hidden');
      } else {
        item.style.transitionDelay = '0ms';
        item.classList.add('hidden');
      }
    });
  }

  // Called from skill card CTA to auto-filter
  activateTab(category) {
    const tab = this.tabs.find(t => t.dataset.tab === category);
    if (tab) {
      this._setActive(tab);
      this._filter(category);
    }
  }
}

/* ==========================================================
   BACKOFFICE.JS — Vandalit Content Studio Engine
   - CRUD para Casos de Estudio, Clientes, Lab y Skills
   - Mover proyectos entre secciones (con ajuste físico de carpetas e index.json)
   - Customización de los 12 Bentos del Hero y Videos de fondo
   - File System Access API para guardado nativo a disco en Local
   - Persistencia ligera en localStorage (solo texto y rutas relativas)
   - Exportación e Importación de configuración JSON
   - Verificador de rutas relativas de imágenes (OK vs 404)
   ========================================================== */

import { loadAllContent, loadSiteSettings, resolveAssetPath, CONTENT_BASE_URL } from '../src/js/content-loader.js';

// ── ESTADO GLOBAL ─────────────────────────────────────────
const state = {
  currentSection: 'clients', // 'clients' | 'case-studies' | 'lab' | 'skills' | 'hero' | 'site'
  activeProjectIndex: 0,
  activeBentoIndex: 0,
  data: {
    'case-studies': [],
    'clients': [],
    'lab': [],
    'skills': []
  },
  skillsLegend: {},
  heroData: {
    videos: {
      stage1Id: 'Hse_HTX6KGs',
      stage2Id: 'GKq9nKZpmu0',
      transitionPx: 300
    },
    bentos: []
  },
  siteData: null, // content/settings/site.json
  pendingMoves: [], // Proyectos movidos entre carpetas físicas
  fsHandle: null, // DirectoryHandle para File System API en Local
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  hasBackend: false // True si el servidor Node.js responde en /api/status
};

// ── DOM ELEMENTS ──────────────────────────────────────────
const el = {
  envBadge: document.getElementById('env-badge'),
  envText: document.getElementById('env-text'),
  readOnlyBanner: document.getElementById('bo-readonly-banner'),
  btnConnectFs: document.getElementById('btn-connect-fs'),
  fsStatusLabel: document.getElementById('fs-status-label'),
  btnSaveDisk: document.getElementById('btn-save-disk'),
  btnExportJson: document.getElementById('btn-export-json'),
  inputImportJson: document.getElementById('input-import-json'),
  btnResetDraft: document.getElementById('btn-reset-draft'),
  btnAddProject: document.getElementById('btn-add-project'),
  btnMoveProject: document.getElementById('btn-move-project'),
  btnDeleteProject: document.getElementById('btn-delete-project'),

  // Modal Mover Proyecto
  modalMove: document.getElementById('bo-modal-move'),
  modalMoveClose: document.getElementById('modal-move-close'),
  modalMoveCancel: document.getElementById('modal-move-btn-cancel'),
  modalMoveConfirm: document.getElementById('modal-move-btn-confirm'),
  modalMoveTitle: document.getElementById('modal-move-project-title'),
  modalMoveSlug: document.getElementById('modal-move-project-slug'),
  modalMoveFromLabel: document.getElementById('modal-move-from-label'),
  modalMoveSelect: document.getElementById('modal-move-select'),

  currentSectionLabel: document.getElementById('current-section-label'),
  projectList: document.getElementById('project-list'),
  projectForm: document.getElementById('project-form'),
  heroEditor: document.getElementById('hero-editor'),
  siteEditor: document.getElementById('site-editor'),
  editorEmpty: document.getElementById('editor-empty'),
  
  // Headers del form
  formEyebrow: document.getElementById('form-eyebrow'),
  formDisplayTitle: document.getElementById('form-display-title'),
  formDisplaySlug: document.getElementById('form-display-slug'),
  
  // Inputs del form
  fieldId: document.getElementById('field-id'),
  fieldTitle: document.getElementById('field-title'),
  fieldClient: document.getElementById('field-client'),
  fieldSubtitle: document.getElementById('field-subtitle'),
  fieldCategory: document.getElementById('field-category'),
  fieldYear: document.getElementById('field-year'),
  fieldAccent: document.getElementById('field-accent'),
  fieldAccentColor: document.getElementById('field-accent-color'),
  fieldRole: document.getElementById('field-role'),
  fieldFeatured: document.getElementById('field-featured'),
  fieldTags: document.getElementById('field-tags'),
  fieldStack: document.getElementById('field-stack'),
  tagsChips: document.getElementById('tags-chips'),
  stackChips: document.getElementById('stack-chips'),
  fieldDesc: document.getElementById('field-desc'),
  fieldChallenge: document.getElementById('field-challenge'),
  fieldSolution: document.getElementById('field-solution'),
  fieldResult: document.getElementById('field-result'),
  fieldLive: document.getElementById('field-live'),
  fieldGithub: document.getElementById('field-github'),

  // Lab Options Elements
  boLabOptionsCard: document.getElementById('bo-lab-options-card'),
  fieldCardType: document.getElementById('field-card-type'),
  fieldWrapperGroup: document.getElementById('field-wrapper-group'),
  fieldVideo: document.getElementById('field-video'),
  fieldTechStack: document.getElementById('field-tech-stack'),
  
  // Cover & Media
  fieldCover: document.getElementById('field-cover'),
  coverResolvedPath: document.getElementById('cover-resolved-path'),
  coverStatusBadge: document.getElementById('cover-status-badge'),
  coverPreviewImg: document.getElementById('cover-preview-img'),
  coverPreviewFallback: document.getElementById('cover-preview-fallback'),
  coverDropzone: document.getElementById('cover-dropzone'),
  coverFileInput: document.getElementById('cover-file-input'),
  galleryList: document.getElementById('gallery-list'),
  btnAddGalleryImg: document.getElementById('btn-add-gallery-img'),
  btnUploadGalleryImg: document.getElementById('btn-upload-gallery-img'),
  galleryFileInput: document.getElementById('gallery-file-input'),

  // Hero & Bentos Elements
  fieldVideo1: document.getElementById('field-video-1'),
  fieldVideo2: document.getElementById('field-video-2'),
  fieldVideoTrans: document.getElementById('field-video-trans'),
  heroBentoGridSelector: document.getElementById('hero-bento-grid-selector'),
  bentoEditorTitle: document.getElementById('bento-editor-title'),
  bentoMediaBadge: document.getElementById('bento-media-badge'),
  bentoWorkTitle: document.getElementById('bento-work-title'),
  bentoWorkMeta: document.getElementById('bento-work-meta'),
  bentoTargetAnchor: document.getElementById('bento-target-anchor'),
  bentoMediaType: document.getElementById('bento-media-type'),
  bentoCalloutDir: document.getElementById('bento-callout-dir'),
  bentoMediaSrc: document.getElementById('bento-media-src'),
  bentoPoster: document.getElementById('bento-poster'),
  bentoPosterField: document.getElementById('bento-poster-field'),
  bentoPreviewBox: document.getElementById('bento-preview-box'),
  bentoPreviewImg: document.getElementById('bento-preview-img'),
  bentoPreviewVideo: document.getElementById('bento-preview-video'),
  bentoPreviewFallback: document.getElementById('bento-preview-fallback'),

  // Skills Editor Elements
  skillEditor: document.getElementById('skill-editor'),
  skillDisplayTitle: document.getElementById('skill-display-title'),
  skillDisplaySlug: document.getElementById('skill-display-slug'),
  btnDeleteSkill: document.getElementById('btn-delete-skill'),
  skillFieldId: document.getElementById('skill-field-id'),
  skillFieldTitle: document.getElementById('skill-field-title'),
  skillFieldCategory: document.getElementById('skill-field-category'),
  skillFieldFilter: document.getElementById('skill-field-filter'),
  skillFieldIcon: document.getElementById('skill-field-icon'),
  skillFieldAccent: document.getElementById('skill-field-accent'),
  skillFieldDesc: document.getElementById('skill-field-desc'),
  skillFieldPills: document.getElementById('skill-field-pills'),
  skillChipsPreview: document.getElementById('skill-chips-preview'),
  skillCardPreviewWrap: document.getElementById('skill-card-preview-wrap'),

  // Site / Landing Copy Editor Elements
  siteBrandLine1: document.getElementById('site-brand-line1'),
  siteBrandLine2: document.getElementById('site-brand-line2'),
  siteHeroEyebrow: document.getElementById('site-hero-eyebrow'),
  siteHeroTagline: document.getElementById('site-hero-tagline'),
  siteHeroCtaWork: document.getElementById('site-hero-cta-work'),
  siteHeroCtaContact: document.getElementById('site-hero-cta-contact'),
  siteHeroEmail: document.getElementById('site-hero-email'),
  siteSocialGithub: document.getElementById('site-social-github'),
  siteSocialBehance: document.getElementById('site-social-behance'),
  siteCasesEyebrow: document.getElementById('site-cases-eyebrow'),
  siteCasesTitle: document.getElementById('site-cases-title'),
  siteCasesDesc: document.getElementById('site-cases-desc'),
  siteSkillsEyebrow: document.getElementById('site-skills-eyebrow'),
  siteSkillsTitle: document.getElementById('site-skills-title'),
  siteSkillsDesc: document.getElementById('site-skills-desc'),
  siteSkillsLegM: document.getElementById('site-skills-leg-m'),
  siteSkillsLegC: document.getElementById('site-skills-leg-c'),
  siteWorkEyebrow: document.getElementById('site-work-eyebrow'),
  siteWorkTitle: document.getElementById('site-work-title'),
  siteWorkDesc: document.getElementById('site-work-desc'),
  siteLabEyebrow: document.getElementById('site-lab-eyebrow'),
  siteLabTitle: document.getElementById('site-lab-title'),
  siteLabDesc: document.getElementById('site-lab-desc'),
  siteLabNoteTitle: document.getElementById('site-lab-note-title'),
  siteLabNoteContent: document.getElementById('site-lab-note-content'),
  siteFooterLogo: document.getElementById('site-footer-logo'),
  siteFooterTagline: document.getElementById('site-footer-tagline'),
  siteFooterContactEyebrow: document.getElementById('site-footer-contact-eyebrow'),
  siteFooterContactEmail: document.getElementById('site-footer-contact-email'),
  siteFooterCopy: document.getElementById('site-footer-copy'),
  
  toastContainer: document.getElementById('bo-toast-container')
};

// ── TOAST NOTIFICATION ────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `bo-toast bo-toast--${type}`;
  toast.innerHTML = `
    <span class="bo-toast__icon">${type === 'success' ? '✔' : '✖'}</span>
    <span class="bo-toast__msg">${message}</span>
  `;
  el.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ── INICIALIZACIÓN ────────────────────────────────────────
async function init() {
  // 0. Detectar si el backend local Node.js está activo
  try {
    const statusRes = await fetch('/api/status');
    if (statusRes.ok) {
      const statusJson = await statusRes.json();
      if (statusJson.status === 'ok') {
        state.hasBackend = true;
        console.log('[Backoffice] 🚀 Backend Local conectado en puerto:', statusJson.serverPort);
      }
    }
  } catch (err) {
    state.hasBackend = false;
  }

  setupEnvironmentUI();
  setupNavigation();
  setupFormListeners();
  setupHeroEditorListeners();
  setupSkillEditorListeners();
  setupSiteEditorListeners();
  setupMoveProject();
  setupFileSystemAPI();
  setupExportImport();

  // 1. Cargar contenido de proyectos
  try {
    const rawData = await loadAllContent();
    state.data['case-studies'] = rawData.cases || [];
    state.data['clients'] = rawData.clients || [];
    state.data['lab'] = rawData.lab || [];
    if (rawData.skills && Array.isArray(rawData.skills.categories)) {
      state.skillsLegend = rawData.skills.legend || {};
      state.data['skills'] = rawData.skills.categories;
    } else if (Array.isArray(rawData.skills)) {
      state.skillsLegend = {};
      state.data['skills'] = rawData.skills;
    } else {
      state.skillsLegend = {};
      state.data['skills'] = [];
    }
  } catch (err) {
    showToast('Error cargando contenidos del portafolio', 'danger');
    console.error('[Backoffice] Error loading data:', err);
  }

  // 2. Cargar configuración de Hero & Bentos
  await loadHeroSettings();

  // 3. Cargar textos globales del sitio (site.json)
  try {
    state.siteData = await loadSiteSettings();
  } catch (err) {
    console.warn('[Backoffice] No se pudo cargar site.json:', err);
  }

  updateCounts();
  renderProjectList();
  loadActiveProject();
}

// ── SANITIZACIÓN DE RUTAS DE ASSETS ───────────────────────
export function sanitizeAssetInput(val) {
  if (!val) return '';
  let cleaned = String(val).trim();
  // Quitar localhost o 127.0.0.1 con o sin puerto y protocolo
  cleaned = cleaned.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?/i, '');
  // Quitar prefijo de GitHub Pages si alguien copió la URL completa del navegador
  cleaned = cleaned.replace(/^https?:\/\/[^\/]+\/portafolio\/?/i, '');
  // Quitar cualquier prefijo content/<section>/<slug>/
  cleaned = cleaned.replace(/^\/?content\/[^\/]+\/[^\/]+\//i, '');
  // Quitar slash o punto-slash inicial
  cleaned = cleaned.replace(/^(\.\/|\/)+/, '');
  return cleaned;
}

// ── ENTORNO UI ────────────────────────────────────────────
function setupEnvironmentUI() {
  if (state.hasBackend) {
    el.envBadge.className = 'bo-badge bo-badge--local';
    el.envText.textContent = 'Backend Local Conectado';
    el.btnConnectFs.style.display = 'none';
    el.fsStatusLabel.textContent = '⚡ API Activa (Escritura directa a disco)';
    el.btnSaveDisk.style.display = 'inline-flex';
    if (el.readOnlyBanner) el.readOnlyBanner.style.display = 'none';
  } else if (state.isLocal) {
    el.envBadge.className = 'bo-badge bo-badge--local';
    el.envText.textContent = 'Entorno Local (Estático)';
    el.btnConnectFs.style.display = 'inline-flex';
    if (el.readOnlyBanner) el.readOnlyBanner.style.display = 'none';
  } else {
    // ENTORNO WEB DESPLEGADO (GitHub Pages) -> MODO SOLO LECTURA
    el.envBadge.className = 'bo-badge bo-badge--web';
    el.envText.textContent = 'Web / Solo Lectura';
    el.btnConnectFs.style.display = 'none';
    el.btnSaveDisk.style.display = 'none';
    if (el.readOnlyBanner) el.readOnlyBanner.style.display = 'block';

    // Desactivar o restringir acciones de modificación física en repositorio
    if (el.btnAddProject) {
      el.btnAddProject.title = 'Crear proyectos en repositorio solo está disponible en local (npm run dev)';
      el.btnAddProject.disabled = true;
      el.btnAddProject.style.opacity = '0.4';
      el.btnAddProject.style.cursor = 'not-allowed';
    }
    if (el.btnMoveProject) {
      el.btnMoveProject.title = 'Mover carpetas físicas solo disponible en local';
      el.btnMoveProject.disabled = true;
      el.btnMoveProject.style.opacity = '0.4';
      el.btnMoveProject.style.cursor = 'not-allowed';
    }
    if (el.btnDeleteProject) {
      el.btnDeleteProject.title = 'Eliminar proyectos físicos solo disponible en local';
      el.btnDeleteProject.disabled = true;
      el.btnDeleteProject.style.opacity = '0.4';
      el.btnDeleteProject.style.cursor = 'not-allowed';
    }
    if (el.btnDeleteSkill) {
      el.btnDeleteSkill.title = 'Eliminar skills físicas solo disponible en local';
      el.btnDeleteSkill.disabled = true;
      el.btnDeleteSkill.style.opacity = '0.4';
      el.btnDeleteSkill.style.cursor = 'not-allowed';
    }
    if (el.btnUploadGalleryImg) {
      el.btnUploadGalleryImg.style.display = 'none';
    }
    if (el.coverDropzone) {
      el.coverDropzone.title = 'Subida directa de archivos a disco deshabilitada en versión web';
    }
    return;
  }

  // Restaurar controles activos en entorno Local
  if (el.btnAddProject) {
    el.btnAddProject.disabled = false;
    el.btnAddProject.style.opacity = '1';
    el.btnAddProject.style.cursor = 'pointer';
    el.btnAddProject.title = 'Añadir nuevo proyecto a esta sección';
  }
  if (el.btnMoveProject) {
    el.btnMoveProject.disabled = false;
    el.btnMoveProject.style.opacity = '1';
    el.btnMoveProject.style.cursor = 'pointer';
    el.btnMoveProject.title = 'Mover proyecto completo a otra sección';
  }
  if (el.btnDeleteProject) {
    el.btnDeleteProject.disabled = false;
    el.btnDeleteProject.style.opacity = '1';
    el.btnDeleteProject.style.cursor = 'pointer';
    el.btnDeleteProject.title = 'Eliminar proyecto';
  }
  if (el.btnDeleteSkill) {
    el.btnDeleteSkill.disabled = false;
    el.btnDeleteSkill.style.opacity = '1';
    el.btnDeleteSkill.style.cursor = 'pointer';
    el.btnDeleteSkill.title = 'Eliminar habilidad';
  }
  if (el.btnUploadGalleryImg) {
    el.btnUploadGalleryImg.style.display = 'inline-flex';
  }
  if (el.coverDropzone) {
    el.coverDropzone.title = 'Haz clic o arrastra una imagen para subir la portada';
  }
}

// ── NAVEGACIÓN DE SECCIONES ───────────────────────────────
function setupNavigation() {
  const tabs = document.querySelectorAll('.bo-sec-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      state.currentSection = tab.dataset.section;
      state.activeProjectIndex = 0;

      const labels = {
        'clients': 'Trabajo de Clientes',
        'case-studies': 'Casos de Estudio',
        'lab': 'Experimentos Lab',
        'skills': 'Perfil Técnico',
        'hero': '⚡ Hero (Bentos & Video)',
        'site': '🌐 Textos del Sitio (Landing Copy)'
      };
      el.currentSectionLabel.textContent = labels[state.currentSection] || state.currentSection;

      if (state.currentSection === 'hero') {
        el.btnAddProject.style.display = 'none';
        el.projectForm.style.display = 'none';
        el.skillEditor.style.display = 'none';
        el.siteEditor.style.display = 'none';
        el.editorEmpty.style.display = 'none';
        el.heroEditor.style.display = 'block';
        renderHeroEditor();
      } else if (state.currentSection === 'skills') {
        el.btnAddProject.style.display = 'inline-flex';
        el.projectForm.style.display = 'none';
        el.heroEditor.style.display = 'none';
        el.siteEditor.style.display = 'none';
        el.skillEditor.style.display = 'block';
        el.editorEmpty.style.display = 'none';
        renderProjectList();
        populateSkillForm();
      } else if (state.currentSection === 'site') {
        el.btnAddProject.style.display = 'none';
        el.projectForm.style.display = 'none';
        el.heroEditor.style.display = 'none';
        el.skillEditor.style.display = 'none';
        el.editorEmpty.style.display = 'none';
        el.siteEditor.style.display = 'block';
        renderSiteProjectList();
        populateSiteForm();
      } else {
        el.btnAddProject.style.display = 'inline-flex';
        el.heroEditor.style.display = 'none';
        el.skillEditor.style.display = 'none';
        el.siteEditor.style.display = 'none';
        renderProjectList();
        loadActiveProject();
      }
    });
  });

  // Reset borrador
  el.btnResetDraft.addEventListener('click', async () => {
    if (confirm('¿Descartar el borrador local y recargar los contenidos originales de los archivos?')) {
      localStorage.removeItem('vandalit_content_override');
      localStorage.removeItem('vandalit_hero_override');
      showToast('Borrador restablecido. Recargando archivos...', 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  });

  // Añadir nuevo proyecto
  el.btnAddProject.addEventListener('click', () => {
    addNewProject();
  });

  // Eliminar proyecto activo
  el.btnDeleteProject.addEventListener('click', () => {
    deleteActiveProject();
  });
}

// ── RENDER LISTA DE PROYECTOS ─────────────────────────────
function updateCounts() {
  document.getElementById('count-clients').textContent = state.data['clients'].length;
  document.getElementById('count-case-studies').textContent = state.data['case-studies'].length;
  document.getElementById('count-lab').textContent = state.data['lab'].length;
  document.getElementById('count-skills').textContent = state.data['skills'].length;
  document.getElementById('count-bentos').textContent = state.heroData.bentos?.length || 12;
}

function renderProjectList() {
  if (state.currentSection === 'hero') {
    el.projectList.innerHTML = '';
    state.heroData.bentos.forEach((bento, idx) => {
      const isSelected = idx === state.activeBentoIndex;
      const bentoItem = document.createElement('div');
      bentoItem.className = `bo-project-item ${isSelected ? 'is-selected' : ''}`;
      bentoItem.innerHTML = `
        <div class="bo-project-item__info">
          <span class="bo-project-item__title">Bento #${bento.num || idx + 1} (${bento.ratio})</span>
          <span class="bo-project-item__slug">${bento.workTitle || 'Sin título'}</span>
        </div>
      `;
      bentoItem.addEventListener('click', () => {
        state.activeBentoIndex = idx;
        renderProjectList();
        populateBentoForm();
      });
      el.projectList.appendChild(bentoItem);
    });
    return;
  }

  const list = state.data[state.currentSection] || [];
  el.projectList.innerHTML = '';

  if (list.length === 0) {
    el.projectList.innerHTML = `
      <div style="padding:14px; text-align:center; color:var(--bo-text-muted); font-size:12px">
        No hay proyectos en esta sección.
      </div>
    `;
    return;
  }

  list.forEach((item, index) => {
    const isSelected = index === state.activeProjectIndex;
    const projectItem = document.createElement('div');
    projectItem.className = `bo-project-item ${isSelected ? 'is-selected' : ''}`;
    projectItem.innerHTML = `
      <div class="bo-project-item__info">
        <span class="bo-project-item__title">${item.title || item.name || 'Sin título'}</span>
        <span class="bo-project-item__slug">${item.id || 'slug-n/a'}</span>
      </div>
      <div class="bo-project-item__controls">
        <button type="button" class="bo-order-btn bo-order-up" title="Mover arriba" ${index === 0 ? 'disabled style="opacity:0.2"' : ''}>▲</button>
        <button type="button" class="bo-order-btn bo-order-down" title="Mover abajo" ${index === list.length - 1 ? 'disabled style="opacity:0.2"' : ''}>▼</button>
      </div>
    `;

    projectItem.addEventListener('click', (e) => {
      if (e.target.closest('.bo-order-btn')) return;
      state.activeProjectIndex = index;
      renderProjectList();
      if (state.currentSection === 'skills') {
        populateSkillForm();
      } else {
        loadActiveProject();
      }
    });

    const upBtn = projectItem.querySelector('.bo-order-up');
    const downBtn = projectItem.querySelector('.bo-order-down');

    upBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      moveProjectOrder(index, -1);
    });

    downBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      moveProjectOrder(index, 1);
    });

    el.projectList.appendChild(projectItem);
  });
}

function moveProjectOrder(fromIndex, delta) {
  const list = state.data[state.currentSection];
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= list.length) return;

  const item = list.splice(fromIndex, 1)[0];
  list.splice(toIndex, 0, item);
  state.activeProjectIndex = toIndex;

  if (state.currentSection === 'skills') {
    list.forEach((it, idx) => { it.order = idx + 1; });
  }

  persistDraft();
  renderProjectList();
  if (state.currentSection === 'skills') {
    populateSkillForm();
  } else {
    loadActiveProject();
  }
  showToast(`Orden actualizado en ${state.currentSection}`);
}

// ── CARGAR PROYECTO ACTIVO EN EL FORMULARIO ────────────────
function loadActiveProject() {
  if (state.currentSection === 'hero') return;

  const list = state.data[state.currentSection] || [];
  const project = list[state.activeProjectIndex];

  if (!project) {
    el.projectForm.style.display = 'none';
    el.editorEmpty.style.display = 'flex';
    return;
  }

  el.projectForm.style.display = 'block';
  el.editorEmpty.style.display = 'none';

  // Headers
  el.formEyebrow.textContent = `SECCIÓN: ${state.currentSection.toUpperCase()}`;
  el.formDisplayTitle.textContent = project.title || 'Proyecto sin título';
  el.formDisplaySlug.textContent = project.id || 'slug';

  // Inputs
  el.fieldId.value = project.id || '';
  el.fieldTitle.value = project.title || '';
  el.fieldClient.value = project.client || '';
  el.fieldSubtitle.value = project.subtitle || '';
  el.fieldCategory.value = project.category || 'wordpress';
  el.fieldYear.value = project.year || 2024;
  el.fieldRole.value = project.role || '';
  el.fieldFeatured.checked = !!project.featured;

  const accent = project.accentColor || '#ccf020';
  el.fieldAccent.value = accent;
  el.fieldAccentColor.value = accent.startsWith('#') && accent.length === 7 ? accent : '#ccf020';

  // Tags & Stack
  const tags = Array.isArray(project.tags) ? project.tags : [];
  el.fieldTags.value = tags.join(', ');
  renderChips(el.tagsChips, tags, false);

  const stack = Array.isArray(project.stack) ? project.stack : [];
  el.fieldStack.value = stack.join(', ');
  renderChips(el.stackChips, stack, true);

  // Narrative
  el.fieldDesc.value = project.description || '';
  el.fieldChallenge.value = project.challenge || '';
  el.fieldSolution.value = project.solution || '';
  el.fieldResult.value = project.result || '';

  // Links
  el.fieldLive.value = project.links?.demo || project.links?.live || '';
  el.fieldGithub.value = project.links?.github || '';

  // Opciones de Lab
  if (el.boLabOptionsCard) {
    if (state.currentSection === 'lab') {
      el.boLabOptionsCard.style.display = 'block';
      if (el.fieldCardType) el.fieldCardType.value = project.cardType || 'expanded';
      if (el.fieldWrapperGroup) el.fieldWrapperGroup.value = project.wrapperGroup || '';
      if (el.fieldVideo) el.fieldVideo.value = project.video || '';
      if (el.fieldTechStack) {
        el.fieldTechStack.value = Array.isArray(project.techStack) ? project.techStack.join(', ') : '';
      }
    } else {
      el.boLabOptionsCard.style.display = 'none';
    }
  }

  // Cover
  const coverVal = project.cover || project.coverPlaceholder || '';
  el.fieldCover.value = coverVal;
  updateCoverPreview(coverVal);

  // Gallery
  renderGalleryList(project.gallery || []);
}

// ── CHIPS RENDER ──────────────────────────────────────────
function renderChips(container, items, isLime = false) {
  container.innerHTML = '';
  items.forEach(item => {
    const text = String(item).trim();
    if (!text) return;
    const chip = document.createElement('span');
    chip.className = `bo-chip ${isLime ? 'bo-chip--lime' : ''}`;
    chip.textContent = text;
    container.appendChild(chip);
  });
}

// ── VERIFICADOR DE RUTAS DE IMÁGENES (OK vs 404) ──────────
function updateCoverPreview(assetPath) {
  const cleanPath = sanitizeAssetInput(assetPath);
  const slug = el.fieldId.value || 'slug';
  const section = state.currentSection;
  const projectDir = `${CONTENT_BASE_URL}/${section}/${slug}`;
  const resolvedUrl = resolveAssetPath(projectDir, cleanPath);

  el.coverResolvedPath.textContent = resolvedUrl;

  if (!cleanPath) {
    el.coverStatusBadge.className = 'bo-status-badge bo-status-badge--neutral';
    el.coverStatusBadge.textContent = 'Sin portada';
    el.coverPreviewImg.classList.remove('is-loaded');
    el.coverPreviewFallback.style.display = 'block';
    el.coverPreviewFallback.textContent = 'Sin imagen asignada';
    return;
  }

  el.coverStatusBadge.className = 'bo-status-badge bo-status-badge--neutral';
  el.coverStatusBadge.textContent = 'Verificando...';

  const imgTester = new Image();
  imgTester.onload = () => {
    el.coverPreviewImg.src = resolvedUrl;
    el.coverPreviewImg.classList.add('is-loaded');
    el.coverPreviewFallback.style.display = 'none';

    el.coverStatusBadge.className = 'bo-status-badge bo-status-badge--ok';
    el.coverStatusBadge.textContent = '🟢 OK (Encontrada)';
  };

  imgTester.onerror = () => {
    el.coverPreviewImg.classList.remove('is-loaded');
    el.coverPreviewFallback.style.display = 'block';
    el.coverPreviewFallback.innerHTML = `
      <span style="color:var(--bo-danger)">🔴 404 No encontrada en:<br><code>${resolvedUrl}</code></span>
    `;

    el.coverStatusBadge.className = 'bo-status-badge bo-status-badge--err';
    el.coverStatusBadge.textContent = '🔴 404 (No existe en disco)';
  };

  imgTester.src = resolvedUrl;
}

// ── GESTIÓN DE GALERÍA SHOWCASE ───────────────────────────
function renderGalleryList(gallery) {
  el.galleryList.innerHTML = '';
  const slug = el.fieldId.value || 'slug';
  const projectDir = `${CONTENT_BASE_URL}/${state.currentSection}/${slug}`;

  if (!gallery || gallery.length === 0) {
    el.galleryList.innerHTML = `
      <div style="font-size:11px; color:var(--bo-text-faint); padding:8px 0;">
        Sin imágenes en la galería. Haz clic en <strong>+ Añadir Imagen</strong> para agregar capturas.
      </div>
    `;
    return;
  }

  gallery.forEach((imgPath, idx) => {
    const item = document.createElement('div');
    item.className = 'bo-gallery-item';
    const resolved = resolveAssetPath(projectDir, imgPath);

    item.innerHTML = `
      <img class="bo-gallery-item__thumb" src="${resolved}" onerror="this.style.opacity='0.2'" alt="Thumb ${idx+1}">
      <input type="text" class="bo-input bo-input--mono bo-gallery-item__input" value="${imgPath}" placeholder="gallery/0${idx+1}.webp">
      <div class="bo-gallery-item__actions">
        <button type="button" class="bo-btn bo-btn--xs bo-btn--outline btn-gal-up" ${idx === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" class="bo-btn bo-btn--xs bo-btn--outline btn-gal-down" ${idx === gallery.length - 1 ? 'disabled' : ''}>▼</button>
        <button type="button" class="bo-btn bo-btn--xs bo-btn--danger btn-gal-del">✕</button>
      </div>
    `;

    const input = item.querySelector('.bo-gallery-item__input');
    input.addEventListener('change', () => {
      gallery[idx] = sanitizeAssetInput(input.value);
      input.value = gallery[idx];
      saveCurrentFormValues();
      renderGalleryList(gallery);
    });

    item.querySelector('.btn-gal-up')?.addEventListener('click', () => {
      if (idx > 0) {
        const temp = gallery[idx];
        gallery[idx] = gallery[idx - 1];
        gallery[idx - 1] = temp;
        saveCurrentFormValues();
        renderGalleryList(gallery);
      }
    });

    item.querySelector('.btn-gal-down')?.addEventListener('click', () => {
      if (idx < gallery.length - 1) {
        const temp = gallery[idx];
        gallery[idx] = gallery[idx + 1];
        gallery[idx + 1] = temp;
        saveCurrentFormValues();
        renderGalleryList(gallery);
      }
    });

    item.querySelector('.btn-gal-del')?.addEventListener('click', () => {
      gallery.splice(idx, 1);
      saveCurrentFormValues();
      renderGalleryList(gallery);
    });

    el.galleryList.appendChild(item);
  });
}

// ── LISTENERS DEL FORMULARIO DE PROYECTO ───────────────────
function setupFormListeners() {
  const liveInputs = [
    el.fieldId, el.fieldTitle, el.fieldClient, el.fieldSubtitle,
    el.fieldCategory, el.fieldYear, el.fieldAccent, el.fieldRole,
    el.fieldFeatured, el.fieldDesc, el.fieldChallenge, el.fieldSolution,
    el.fieldResult, el.fieldLive, el.fieldGithub,
    el.fieldCardType, el.fieldWrapperGroup, el.fieldVideo, el.fieldTechStack
  ];

  liveInputs.forEach(input => {
    input.addEventListener('input', () => {
      saveCurrentFormValues();
    });
  });

  // Color picker sync
  el.fieldAccentColor.addEventListener('input', () => {
    el.fieldAccent.value = el.fieldAccentColor.value;
    saveCurrentFormValues();
  });
  el.fieldAccent.addEventListener('input', () => {
    if (el.fieldAccent.value.startsWith('#') && el.fieldAccent.value.length === 7) {
      el.fieldAccentColor.value = el.fieldAccent.value;
    }
    saveCurrentFormValues();
  });

  // Tags & Stack
  el.fieldTags.addEventListener('change', () => {
    const list = el.fieldTags.value.split(',').map(s => s.trim()).filter(Boolean);
    renderChips(el.tagsChips, list, false);
    saveCurrentFormValues();
  });
  el.fieldStack.addEventListener('change', () => {
    const list = el.fieldStack.value.split(',').map(s => s.trim()).filter(Boolean);
    renderChips(el.stackChips, list, true);
    saveCurrentFormValues();
  });

  // Cover input change
  el.fieldCover.addEventListener('change', () => {
    const val = sanitizeAssetInput(el.fieldCover.value);
    el.fieldCover.value = val;
    updateCoverPreview(val);
    saveCurrentFormValues();
  });

  // Add gallery image (ruta manual)
  el.btnAddGalleryImg.addEventListener('click', () => {
    const project = state.data[state.currentSection][state.activeProjectIndex];
    if (!project) return;
    if (!Array.isArray(project.gallery)) project.gallery = [];
    const nextNum = String(project.gallery.length + 1).padStart(2, '0');
    project.gallery.push(`gallery/${nextNum}.webp`);
    saveCurrentFormValues();
    renderGalleryList(project.gallery);
  });

  // Upload gallery image (archivo real)
  if (el.btnUploadGalleryImg && el.galleryFileInput) {
    el.btnUploadGalleryImg.addEventListener('click', () => el.galleryFileInput.click());
    el.galleryFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const project = state.data[state.currentSection][state.activeProjectIndex];
      if (!project) return;
      if (!Array.isArray(project.gallery)) project.gallery = [];

      if (state.hasBackend) {
        try {
          const formData = new FormData();
          // Importante: los campos de texto deben añadirse ANTES de 'file' para que Multer procese req.body antes de destination()
          formData.append('section', state.currentSection);
          formData.append('slug', el.fieldId.value || project.id || 'temp');
          formData.append('target', 'gallery');
          formData.append('file', file);

          showToast('Subiendo imagen a galería...', 'success');
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const json = await res.json();
          if (json.success) {
            project.gallery.push(json.relativePath);
            saveCurrentFormValues();
            renderGalleryList(project.gallery);
            showToast(`✅ Imagen subida a galería: ${json.relativePath}`);
            return;
          }
        } catch (err) {
          console.error('[Backoffice] Error subiendo imagen a galería:', err);
          showToast('Error al subir imagen a galería', 'danger');
        }
      }

      // Fallback si no hay backend
      project.gallery.push(`gallery/${file.name}`);
      saveCurrentFormValues();
      renderGalleryList(project.gallery);
      showToast(`Añadida ruta 'gallery/${file.name}'. Recuerda colocar el archivo en disco.`);
    });
  }

  // Dropzone de portada
  el.coverDropzone.addEventListener('click', () => el.coverFileInput.click());
  el.coverFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) handleCoverFileSelected(file);
  });

  el.coverDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.coverDropzone.classList.add('is-dragover');
  });
  el.coverDropzone.addEventListener('dragleave', () => {
    el.coverDropzone.classList.remove('is-dragover');
  });
  el.coverDropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    el.coverDropzone.classList.remove('is-dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleCoverFileSelected(file);
    }
  });
}

// Guardar archivo arrastrado o seleccionado
async function handleCoverFileSelected(file) {
  if (!state.isLocal) {
    showToast('Subida de archivos deshabilitada en la versión web desplegada.', 'danger');
    return;
  }

  const fileName = sanitizeAssetInput(file.name);

  if (state.hasBackend) {
    try {
      const formData = new FormData();
      // Importante: los campos de texto deben añadirse ANTES de 'file' para que Multer procese req.body antes de destination()
      formData.append('section', state.currentSection);
      formData.append('slug', el.fieldId.value || 'temp');
      formData.append('target', 'cover');
      formData.append('file', file);

      showToast('Subiendo portada al servidor...', 'success');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        el.fieldCover.value = json.fileName;
        saveCurrentFormValues();
        updateCoverPreview(json.fileName);
        showToast(`✅ Portada guardada en content/${state.currentSection}/${el.fieldId.value}/${json.fileName}`);
        return;
      }
    } catch (err) {
      console.error('[Backoffice] Error subiendo portada al backend:', err);
      showToast('Error subiendo portada al backend', 'danger');
    }
  }

  el.fieldCover.value = fileName;

  if (state.fsHandle) {
    try {
      const slug = el.fieldId.value || 'temp';
      const sectionDir = await state.fsHandle.getDirectoryHandle(`content`);
      const secHandle = await sectionDir.getDirectoryHandle(state.currentSection);
      const projDir = await secHandle.getDirectoryHandle(slug, { create: true });
      const fileHandle = await projDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
      showToast(`Imagen copiada físicamente en /content/${state.currentSection}/${slug}/${fileName}`);
    } catch (err) {
      console.warn('[Backoffice] No se pudo guardar la imagen directamente en disco:', err);
    }
  }

  updateCoverPreview(fileName);
  saveCurrentFormValues();
}

// ── GUARDAR VALORES EN MEMORIA Y PERSISTIR BORRADOR ───────
function saveCurrentFormValues() {
  const list = state.data[state.currentSection];
  const project = list[state.activeProjectIndex];
  if (!project) return;

  project.id = el.fieldId.value.trim();
  project.title = el.fieldTitle.value.trim();
  project.client = el.fieldClient.value.trim();
  project.subtitle = el.fieldSubtitle.value.trim();
  project.category = el.fieldCategory.value;
  project.year = parseInt(el.fieldYear.value, 10) || 2024;
  project.accentColor = el.fieldAccent.value.trim();
  project.role = el.fieldRole.value.trim();
  project.featured = el.fieldFeatured.checked;

  project.tags = el.fieldTags.value.split(',').map(s => s.trim()).filter(Boolean);
  project.stack = el.fieldStack.value.split(',').map(s => s.trim()).filter(Boolean);

  project.description = el.fieldDesc.value;
  project.challenge = el.fieldChallenge.value;
  project.solution = el.fieldSolution.value;
  project.result = el.fieldResult.value;

  const liveVal = el.fieldLive.value.trim() || null;
  const githubVal = el.fieldGithub.value.trim() || null;
  project.links = {
    live: liveVal,
    demo: liveVal,
    github: githubVal
  };

  if (state.currentSection === 'lab') {
    if (el.fieldCardType) project.cardType = el.fieldCardType.value;
    if (el.fieldWrapperGroup) project.wrapperGroup = el.fieldWrapperGroup.value.trim() || undefined;
    if (el.fieldVideo) project.video = el.fieldVideo.value.trim() || undefined;
    if (el.fieldTechStack) {
      project.techStack = el.fieldTechStack.value.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const cleanCover = sanitizeAssetInput(el.fieldCover.value);
  el.fieldCover.value = cleanCover;
  project.cover = cleanCover;
  project.coverPlaceholder = cleanCover;

  el.formDisplayTitle.textContent = project.title || 'Proyecto sin título';
  el.formDisplaySlug.textContent = project.id || 'slug';

  const activeSidebarItem = el.projectList.children[state.activeProjectIndex];
  if (activeSidebarItem) {
    const titleEl = activeSidebarItem.querySelector('.bo-project-item__title');
    const slugEl = activeSidebarItem.querySelector('.bo-project-item__slug');
    if (titleEl) titleEl.textContent = project.title || 'Sin título';
    if (slugEl) slugEl.textContent = project.id || 'slug';
  }

  persistDraft();
}

function persistDraft() {
  try {
    const payload = {
      cases: state.data['case-studies'],
      clients: state.data['clients'],
      lab: state.data['lab'],
      skills: {
        legend: state.skillsLegend || {
          autoral: { label: "Multimedia y diseño", color: "magenta" },
          desarrollo: { label: "Desarrollo", color: "lime" },
          comercial: { label: "Comercial", color: "mango" }
        },
        categories: state.data['skills']
      },
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('vandalit_content_override', JSON.stringify(payload));
  } catch (err) {
    console.error('[Backoffice] Error guardando borrador:', err);
  }
}

// ── CREAR Y ELIMINAR PROYECTOS ────────────────────────────
function addNewProject() {
  if (state.currentSection === 'skills') {
    const slug = prompt('Ingresa el ID único para la nueva tarjeta de habilidad (ej: devops):');
    if (!slug) return;
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newSkill = {
      id: cleanSlug,
      order: state.data['skills'].length + 1,
      title: 'Nueva Capacidad Técnica',
      technicalName: 'Especialidad y Metodología',
      description: 'Descripción de las herramientas y metodologías...',
      icon: 'circle',
      dots: ['autoral'],
      workTab: 'ux',
      items: [
        { name: 'Capacidad 1', level: 'intermedio', state: 'confirmado' },
        { name: 'Capacidad 2', level: 'avanzado', state: 'confirmado' }
      ],
      skills: ['Capacidad 1', 'Capacidad 2']
    };
    state.data['skills'].push(newSkill);
    state.activeProjectIndex = state.data['skills'].length - 1;
    updateCounts();
    persistDraft();
    renderProjectList();
    populateSkillForm();
    showToast(`Habilidad '${cleanSlug}' creada.`);
    return;
  }

  const slug = prompt('Ingresa el ID / slug único para la carpeta del nuevo proyecto (ej: nuevo-cliente):');
  if (!slug) return;

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const isCase = state.currentSection === 'case-studies';

  const newProject = {
    id: cleanSlug,
    category: isCase ? 'coding' : 'wordpress',
    title: 'Nuevo Proyecto',
    client: isCase ? '' : 'Nombre del Cliente',
    subtitle: 'Síntesis descriptiva',
    description: 'Descripción del trabajo realizado...',
    year: new Date().getFullYear(),
    role: 'UX/UI Design + Dev',
    tags: [isCase ? 'coding' : 'wordpress', 'ux'],
    stack: ['Figma', 'CSS', 'JavaScript'],
    accentColor: '#ccf020',
    featured: false,
    cover: 'cover.webp',
    coverPlaceholder: 'cover.webp',
    gallery: ['gallery/01.webp'],
    challenge: 'Desafío del proyecto...',
    solution: 'Solución implementada...',
    result: 'Resultado obtenido...',
    links: { live: null, github: null }
  };

  state.data[state.currentSection].push(newProject);
  state.activeProjectIndex = state.data[state.currentSection].length - 1;

  updateCounts();
  persistDraft();
  renderProjectList();
  loadActiveProject();
  showToast(`Proyecto '${cleanSlug}' añadido a ${state.currentSection}`);
}

function deleteActiveProject() {
  const list = state.data[state.currentSection];
  const project = list[state.activeProjectIndex];
  if (!project) return;

  if (confirm(`¿Estás seguro de eliminar '${project.title || project.id}' de ${state.currentSection}?`)) {
    list.splice(state.activeProjectIndex, 1);
    state.activeProjectIndex = Math.max(0, state.activeProjectIndex - 1);

    updateCounts();
    persistDraft();
    renderProjectList();
    loadActiveProject();
    showToast(`Proyecto eliminado`, 'danger');
  }
}

// ── MOVER PROYECTO A OTRA SECCIÓN (MODAL + API) ───────────
function setupMoveProject() {
  if (!el.btnMoveProject || !el.modalMove) return;

  const ALL_SECTIONS = [
    { key: 'clients', label: 'Trabajo de Clientes' },
    { key: 'case-studies', label: 'Casos de Estudio' },
    { key: 'lab', label: 'Laboratorio' }
  ];

  function closeModal() {
    el.modalMove.classList.remove('is-open');
    el.modalMove.setAttribute('aria-hidden', 'true');
    el.modalMoveConfirm.disabled = false;
    el.modalMoveConfirm.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
      <span>Confirmar y Mover</span>
    `;
  }

  function openModal() {
    const currentList = state.data[state.currentSection];
    const project = currentList ? currentList[state.activeProjectIndex] : null;
    if (!project) {
      showToast('No hay ningún proyecto activo seleccionado para mover.', 'warning');
      return;
    }

    const currentSecObj = ALL_SECTIONS.find(s => s.key === state.currentSection) || { label: state.currentSection };
    const availableSections = ALL_SECTIONS.filter(s => s.key !== state.currentSection);

    el.modalMoveTitle.textContent = project.title || project.id;
    el.modalMoveSlug.textContent = project.id;
    el.modalMoveFromLabel.textContent = currentSecObj.label;

    el.modalMoveSelect.innerHTML = availableSections.map(s => 
      `<option value="${s.key}">${s.label} (${s.key})</option>`
    ).join('');

    el.modalMove.setAttribute('aria-hidden', 'false');
    el.modalMove.classList.add('is-open');
  }

  // Triggers de apertura y cierre
  el.btnMoveProject.addEventListener('click', openModal);
  el.modalMoveClose?.addEventListener('click', closeModal);
  el.modalMoveCancel?.addEventListener('click', closeModal);

  // Cerrar al hacer clic en el backdrop
  el.modalMove.querySelector('.bo-modal__backdrop')?.addEventListener('click', closeModal);

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.modalMove.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Confirmar movimiento
  el.modalMoveConfirm?.addEventListener('click', async () => {
    const currentList = state.data[state.currentSection];
    const project = currentList ? currentList[state.activeProjectIndex] : null;
    if (!project) return;

    const sourceSection = state.currentSection;
    const destSection = el.modalMoveSelect.value;
    const destSecObj = ALL_SECTIONS.find(s => s.key === destSection);

    el.modalMoveConfirm.disabled = true;
    el.modalMoveConfirm.innerHTML = '<span>Moviendo proyecto...</span>';

    // 1. Si Backend API Express está activo, mover físicamente carpetas en servidor
    if (state.hasBackend) {
      try {
        const res = await fetch('/api/content/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: project.id,
            fromSection: sourceSection,
            toSection: destSection
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        console.log(`[Backoffice] ✅ /api/content/move exitoso: ${project.id} de ${sourceSection} a ${destSection}`);
      } catch (err) {
        console.warn('[Backoffice] Error en endpoint /api/content/move:', err);
        showToast(`Advertencia de servidor: ${err.message}. Los cambios se sincronizarán al Guardar en Disco.`, 'warning');
      }
    }

    // 2. Si File System Access API está conectada en Chrome, mover en disco cliente
    if (state.fsHandle) {
      try {
        await moveProjectDirectoryOnDisk(project.id, sourceSection, destSection, project);
      } catch (err) {
        console.warn('[Backoffice] No se pudo mover la carpeta física vía FS API:', err);
      }
    }

    // Registrar en pendingMoves
    state.pendingMoves.push({
      slug: project.id,
      from: sourceSection,
      to: destSection
    });

    // 3. Mover datos en memoria
    currentList.splice(state.activeProjectIndex, 1);
    if (!state.data[destSection]) state.data[destSection] = [];
    state.data[destSection].push(project);

    persistDraft();
    updateCounts();

    closeModal();
    showToast(`✅ Proyecto '${project.title || project.id}' movido a '${destSecObj ? destSecObj.label : destSection}'.`);

    // 4. Cambiar a la pestaña de la sección destino y activar el proyecto transferido
    const targetTab = document.querySelector(`.bo-sec-tab[data-section="${destSection}"]`);
    targetTab?.click();
    state.activeProjectIndex = state.data[destSection].length - 1;
    renderProjectList();
    loadActiveProject();
  });
}

async function moveProjectDirectoryOnDisk(slug, fromSec, toSec, projectData) {
  const contentDir = await state.fsHandle.getDirectoryHandle('content');
  const sourceSecDir = await contentDir.getDirectoryHandle(fromSec, { create: true });
  const destSecDir = await contentDir.getDirectoryHandle(toSec, { create: true });

  // Crear o asegurar carpeta en destino y escribir project.json
  const destProjDir = await destSecDir.getDirectoryHandle(slug, { create: true });
  const destProjFile = await destProjDir.getFileHandle('project.json', { create: true });
  const writable = await destProjFile.createWritable();
  writable.write(JSON.stringify(projectData, null, 2) + '\n');
  await writable.close();

  // Intentar eliminar del origen
  try {
    await sourceSecDir.removeEntry(slug, { recursive: true });
  } catch (_) {}

  // Actualizar ambos index.json
  await saveSectionIndexOnly(sourceSecDir, state.data[fromSec].map(p => p.id));
  await saveSectionIndexOnly(destSecDir, state.data[toSec].map(p => p.id));
}

async function saveSectionIndexOnly(sectionDir, slugs) {
  const indexFile = await sectionDir.getFileHandle('index.json', { create: true });
  const indexWritable = await indexFile.createWritable();
  await indexWritable.write(JSON.stringify(slugs, null, 2) + '\n');
  await indexWritable.close();
}

// ── SKILLS STUDIO ENGINE ──────────────────────────────────
const skillDoodles = {
  circle: (c) => `<svg viewBox="0 0 56 56" fill="none" style="width:48px;height:48px"><circle cx="28" cy="28" r="24" stroke="${c}" stroke-width="2"/><circle cx="28" cy="28" r="12" stroke="${c}" stroke-width="1" stroke-dasharray="4 4"/><circle cx="28" cy="28" r="4" fill="${c}"/></svg>`,
  square: (c) => `<svg viewBox="0 0 56 56" fill="none" style="width:48px;height:48px"><rect x="6" y="6" width="44" height="44" stroke="${c}" stroke-width="2"/><rect x="18" y="18" width="20" height="20" stroke="${c}" stroke-width="1" stroke-dasharray="4 4"/><rect x="24" y="24" width="8" height="8" fill="${c}"/></svg>`,
  triangle: (c) => `<svg viewBox="0 0 56 56" fill="none" style="width:48px;height:48px"><polygon points="28,6 52,50 4,50" stroke="${c}" stroke-width="2" fill="none"/><polygon points="28,18 42,42 14,42" stroke="${c}" stroke-width="1" stroke-dasharray="4 4" fill="none"/><circle cx="28" cy="34" r="4" fill="${c}"/></svg>`
};

function setupSkillEditorListeners() {
  const inputs = [
    el.skillFieldId, el.skillFieldTitle, el.skillFieldCategory,
    el.skillFieldFilter, el.skillFieldIcon, el.skillFieldAccent,
    el.skillFieldDesc
  ];
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      saveActiveSkillValues();
    });
    input.addEventListener('change', () => {
      saveActiveSkillValues();
      updateSkillLivePreview();
    });
  });

  el.skillFieldPills.addEventListener('change', () => {
    saveActiveSkillValues();
    updateSkillLivePreview();
  });

  el.btnDeleteSkill.addEventListener('click', () => {
    deleteActiveSkill();
  });
}

function populateSkillForm() {
  const list = state.data['skills'] || [];
  const skill = list[state.activeProjectIndex];

  if (!skill) {
    el.skillEditor.style.display = 'none';
    el.editorEmpty.style.display = 'flex';
    return;
  }

  el.skillEditor.style.display = 'block';
  el.editorEmpty.style.display = 'none';

  el.skillDisplayTitle.textContent = skill.title || 'Habilidad sin título';
  el.skillDisplaySlug.textContent = skill.id || 'slug';

  el.skillFieldId.value = skill.id || '';
  el.skillFieldTitle.value = skill.title || '';
  el.skillFieldCategory.value = skill.technicalName || skill.category || '';
  el.skillFieldFilter.value = skill.workTab !== undefined ? (skill.workTab || '') : (skill.filterTag || '');
  el.skillFieldIcon.value = skill.icon || 'circle';

  // Dots / Eje principal
  const primaryDot = (skill.dots && skill.dots[0]) || (skill.accentColor?.includes('d4') ? 'autoral' : (skill.accentColor?.includes('ff') ? 'comercial' : 'desarrollo'));
  el.skillFieldAccent.value = primaryDot;

  el.skillFieldDesc.value = skill.description || '';

  // Pills / Items
  const items = Array.isArray(skill.items) && skill.items.length > 0
    ? skill.items.map(i => i.name || i)
    : (Array.isArray(skill.skills) ? skill.skills : []);
  el.skillFieldPills.value = items.join(', ');
  renderChips(el.skillChipsPreview, items, primaryDot === 'desarrollo');

  updateSkillLivePreview();
}

function saveActiveSkillValues() {
  const list = state.data['skills'];
  const skill = list[state.activeProjectIndex];
  if (!skill) return;

  skill.id = el.skillFieldId.value.trim();
  skill.title = el.skillFieldTitle.value.trim();
  skill.technicalName = el.skillFieldCategory.value.trim();
  skill.category = skill.technicalName; // retrocompatibilidad
  skill.workTab = el.skillFieldFilter.value || null;
  skill.filterTag = skill.workTab || 'ux'; // retrocompatibilidad
  skill.icon = el.skillFieldIcon.value;

  const chosenDot = el.skillFieldAccent.value;
  skill.dots = [chosenDot];
  skill.accentColor = chosenDot === 'autoral' ? '#d4205a' : (chosenDot === 'comercial' ? '#ffaa00' : '#b6e030');

  skill.description = el.skillFieldDesc.value;

  const names = el.skillFieldPills.value.split(',').map(s => s.trim()).filter(Boolean);

  // Actualizar items preservando level y state existentes
  const prevItems = Array.isArray(skill.items) ? skill.items : [];
  skill.items = names.map(name => {
    const existing = prevItems.find(it => (it.name || it) === name);
    if (existing && typeof existing === 'object') {
      return existing;
    }
    return { name, level: 'intermedio', state: 'confirmado' };
  });
  skill.skills = names; // retrocompatibilidad

  renderChips(el.skillChipsPreview, names, chosenDot === 'desarrollo');

  el.skillDisplayTitle.textContent = skill.title || 'Habilidad sin título';
  el.skillDisplaySlug.textContent = skill.id || 'slug';

  const activeSidebarItem = el.projectList.children[state.activeProjectIndex];
  if (activeSidebarItem) {
    const titleEl = activeSidebarItem.querySelector('.bo-project-item__title');
    const slugEl = activeSidebarItem.querySelector('.bo-project-item__slug');
    if (titleEl) titleEl.textContent = skill.title || 'Sin título';
    if (slugEl) slugEl.textContent = `${skill.id || 'slug'} · ${skill.technicalName || ''}`;
  }

  persistDraft();
}

function updateSkillLivePreview() {
  const list = state.data['skills'] || [];
  const skill = list[state.activeProjectIndex];
  if (!skill) return;

  const dot = (skill.dots && skill.dots[0]) || 'autoral';
  const accent = dot === 'desarrollo' ? 'lime' : (dot === 'comercial' ? 'mango' : 'magenta');
  const accentColor = accent === 'magenta' ? 'var(--magenta, #d4205a)' : (accent === 'lime' ? 'var(--lime, #b6e030)' : '#ffaa00');
  const iconSvg = skillDoodles[skill.icon] ? skillDoodles[skill.icon](accentColor) : skillDoodles.circle(accentColor);

  const items = Array.isArray(skill.items) && skill.items.length > 0
    ? skill.items.map(i => i.name || i)
    : (Array.isArray(skill.skills) ? skill.skills : []);

  const hasFilter = skill.workTab;

  el.skillCardPreviewWrap.innerHTML = `
    <article class="skill-card" data-accent="${accent}" style="position:relative; width:100%; max-width:320px; margin:0 auto; cursor:default;">
      <div class="skill-card__icon-bg">${iconSvg}</div>
      <p class="skill-card__category">${(skill.technicalName || skill.category || 'SKILL').toUpperCase()}</p>
      <h3 class="skill-card__title">${skill.title || 'Título'}</h3>
      <p class="skill-card__desc">${skill.description || 'Descripción...'}</p>
      <div class="skill-card__pills">
        ${items.slice(0, 6).map(sk => `<span class="skill-pill">${sk}</span>`).join('')}
        ${items.length > 6 ? `<span class="skill-pill skill-pill--more">+${items.length - 6} más</span>` : ''}
      </div>
      <button type="button" class="skill-card__cta ${hasFilter ? `btn--ghost-${accent}` : 'skill-card__cta--disabled'}" style="pointer-events:none;">
        Ver ejemplos <span>→</span>
      </button>
    </article>
  `;
}

function deleteActiveSkill() {
  const list = state.data['skills'];
  const skill = list[state.activeProjectIndex];
  if (!skill) return;

  if (confirm(`¿Estás seguro de eliminar la habilidad '${skill.title || skill.id}'?`)) {
    list.splice(state.activeProjectIndex, 1);
    state.activeProjectIndex = Math.max(0, state.activeProjectIndex - 1);
    updateCounts();
    persistDraft();
    renderProjectList();
    populateSkillForm();
    showToast(`Habilidad eliminada`, 'danger');
  }
}

// ── HERO & BENTOS STUDIO ENGINE ───────────────────────────
async function loadHeroSettings() {
  try {
    const local = localStorage.getItem('vandalit_hero_override');
    if (local) {
      state.heroData = JSON.parse(local);
      if (Array.isArray(state.heroData?.bentos) && state.heroData.bentos.length > 0) {
        return;
      }
    }
    const res = await fetch(`${CONTENT_BASE_URL}/settings/hero.json`);
    if (res.ok) {
      state.heroData = await res.json();
    }
  } catch (err) {
    console.warn('[Backoffice] Could not load hero.json, using defaults:', err);
  }

  // Garantizar que existan los 12 bentos si no se pudieron cargar
  if (!state.heroData || !Array.isArray(state.heroData.bentos) || state.heroData.bentos.length === 0) {
    state.heroData = {
      videos: { stage1Id: 'Hse_HTX6KGs', stage2Id: 'GKq9nKZpmu0', transitionPx: 300 },
      bentos: [
        { id: 'bento-card-1', num: '01', ratio: '9:16', workTitle: 'Valle de la Luna — Atacama', workMeta: '2023 · CLIENT WORK', targetAnchor: '#work', calloutDir: 'right', accentColor: '#ccf020', mediaType: 'video', mediaSrc: 'https://turismolickancoy.cl/wp-content/uploads/2025/07/Duna-mayor-dentro-del-valle-de-la-luna.mp4', poster: './assets/images/midjourney/vandalit_Blob_graphic_dopamine_design_abstract_modern_design__7ce2ff82-6ce2-4c99-ba8d-15649dcbe2c2_1.png' },
        { id: 'bento-card-2', num: '02', ratio: '16:9', workTitle: 'Screens Mockup Web UI', workMeta: '2024 · MULTIMEDIA', targetAnchor: '#cases', calloutDir: 'left', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_screens_mockup_web_design_--sref_httpss.mj.runcgBuE3_bdfc81af-66c5-42b8-9a78-09b2648c35f5_3.png' },
        { id: 'bento-card-3', num: '03', ratio: '1:1', workTitle: 'Dopamine Organic Fluid', workMeta: '2024 · AI EXPERIMENT', targetAnchor: '#lab', calloutDir: 'left', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_Blob_graphic_dopamine_design_abstract_modern_design__7ce2ff82-6ce2-4c99-ba8d-15649dcbe2c2_1.png' },
        { id: 'bento-card-4', num: '04', ratio: '4:5', workTitle: 'Fluor Street Punk Art', workMeta: '2024 · MULTIMEDIA', targetAnchor: '#cases', calloutDir: 'left', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_a_vtuber_as_a_punk_fluor_colour_street_art_inspired__e1f91a82-97a9-4307-888e-654603a3dcd8_2.png' },
        { id: 'bento-card-5', num: '05', ratio: '4:3', workTitle: 'Spatial Living Architecture', workMeta: '2024 · 3D SPACE', targetAnchor: '#cases', calloutDir: 'right', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_A_cozy_and_clean_suburban_living_room_staged_for_sal_81f8c780-9cd8-4b20-877f-d4edd27a1244_1.png' },
        { id: 'bento-card-6', num: '06', ratio: '21:9', workTitle: 'Iridescent Paper Texture', workMeta: '2024 · EDITORIAL', targetAnchor: '#skills', calloutDir: 'left', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_black_paper_with_iridescent_effect_texture_embossed_gr_dc33a515-4896-4553-9559-90821e277c1f.png' },
        { id: 'bento-card-7', num: '07', ratio: '9:16', workTitle: 'Rizoma Macro Biology', workMeta: '2024 · AI VISUAL', targetAnchor: '#lab', calloutDir: 'left', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_Rizoma_national_geographic_macro_coloured_photograph_64ec413f-e06f-4998-8654-5994bbba87c2_2.png' },
        { id: 'bento-card-8', num: '08', ratio: '16:10', workTitle: 'Digital Neon Outline', workMeta: '2024 · CODING', targetAnchor: '#skills', calloutDir: 'right', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_Outline_digital_illustration_hipertealostic_photogra_47c8bf74-1925-427f-8eda-ebf0690ac2b3_2.png' },
        { id: 'bento-card-9', num: '09', ratio: '3:2', workTitle: 'Natales Food Lettering', workMeta: '2023 · BRANDING', targetAnchor: '#work', calloutDir: 'right', accentColor: '#ccf020', mediaType: 'image', mediaSrc: './assets/images/midjourney/vandalit_la_disqura_natales_logotype_as_lettering_on_a_food_d_fc757d24-20cc-4d78-93cd-75bf0fe88265_3.png' },
        { id: 'bento-card-10', num: '10', ratio: '1:1', workTitle: 'Modular Studio Box 10', workMeta: '2024 · FRONT-END', targetAnchor: '#cases', calloutDir: 'right', accentColor: '#ccf020', mediaType: 'image', mediaSrc: '' },
        { id: 'bento-card-11', num: '11', ratio: '4:5', workTitle: 'Editorial Format 11', workMeta: '2024 · DESIGN SYSTEMS', targetAnchor: '#skills', calloutDir: 'right', accentColor: '#ccf020', mediaType: 'image', mediaSrc: '' },
        { id: 'bento-card-12', num: '12', ratio: '2:1', workTitle: 'Cinema Banner 12', workMeta: '2024 · MULTIMEDIA', targetAnchor: '#cases', calloutDir: 'left', accentColor: '#ccf020', mediaType: 'image', mediaSrc: '' }
      ]
    };
  }
}

function setupHeroEditorListeners() {
  // Videos de fondo
  const onVideoChange = () => {
    state.heroData.videos.stage1Id = cleanYouTubeId(el.fieldVideo1.value);
    state.heroData.videos.stage2Id = cleanYouTubeId(el.fieldVideo2.value);
    state.heroData.videos.transitionPx = parseInt(el.fieldVideoTrans.value, 10) || 300;
    persistHeroSettings();
  };

  el.fieldVideo1.addEventListener('change', onVideoChange);
  el.fieldVideo2.addEventListener('change', onVideoChange);
  el.fieldVideoTrans.addEventListener('change', onVideoChange);

  // Bento fields
  const bentoInputs = [
    el.bentoWorkTitle, el.bentoWorkMeta, el.bentoTargetAnchor,
    el.bentoMediaType, el.bentoCalloutDir, el.bentoMediaSrc, el.bentoPoster
  ];

  bentoInputs.forEach(input => {
    input.addEventListener('input', () => {
      saveActiveBentoValues();
    });
    input.addEventListener('change', () => {
      saveActiveBentoValues();
      updateBentoLivePreview();
    });
  });
}

function cleanYouTubeId(input) {
  if (!input) return '';
  const str = input.trim();
  // Si es una URL completa
  const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : str;
}

function renderHeroEditor() {
  if (!state.heroData || !state.heroData.bentos) return;

  // Videos
  el.fieldVideo1.value = state.heroData.videos?.stage1Id || 'Hse_HTX6KGs';
  el.fieldVideo2.value = state.heroData.videos?.stage2Id || 'GKq9nKZpmu0';
  el.fieldVideoTrans.value = state.heroData.videos?.transitionPx || 300;

  // Grid de 12 bentos
  el.heroBentoGridSelector.innerHTML = '';
  state.heroData.bentos.forEach((bento, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `bo-bento-btn ${idx === state.activeBentoIndex ? 'is-selected' : ''}`;
    btn.innerHTML = `
      <span>#${bento.num || idx + 1}</span>
      <span class="bo-bento-btn__ratio">${bento.ratio || '1:1'}</span>
    `;
    btn.addEventListener('click', () => {
      state.activeBentoIndex = idx;
      renderHeroEditor();
    });
    el.heroBentoGridSelector.appendChild(btn);
  });

  populateBentoForm();
}

function populateBentoForm() {
  const bento = state.heroData.bentos[state.activeBentoIndex];
  if (!bento) return;

  el.bentoEditorTitle.textContent = `Bento #${bento.num || state.activeBentoIndex + 1} (Ratio ${bento.ratio})`;
  el.bentoMediaBadge.textContent = `Ratio ${bento.ratio} · ${bento.mediaType || 'image'}`;

  el.bentoWorkTitle.value = bento.workTitle || '';
  el.bentoWorkMeta.value = bento.workMeta || '';
  el.bentoTargetAnchor.value = bento.targetAnchor || '#work';
  el.bentoMediaType.value = bento.mediaType || 'image';
  el.bentoCalloutDir.value = bento.calloutDir || 'right';
  el.bentoMediaSrc.value = bento.mediaSrc || '';
  el.bentoPoster.value = bento.poster || '';

  // Mostrar/ocultar campo poster según tipo
  el.bentoPosterField.style.display = bento.mediaType === 'video' ? 'block' : 'none';

  updateBentoLivePreview();
}

function saveActiveBentoValues() {
  const bento = state.heroData.bentos[state.activeBentoIndex];
  if (!bento) return;

  bento.workTitle = el.bentoWorkTitle.value.trim();
  bento.workMeta = el.bentoWorkMeta.value.trim();
  bento.targetAnchor = el.bentoTargetAnchor.value;
  bento.mediaType = el.bentoMediaType.value;
  bento.calloutDir = el.bentoCalloutDir.value;
  bento.mediaSrc = el.bentoMediaSrc.value.trim();
  bento.poster = el.bentoPoster.value.trim();

  el.bentoPosterField.style.display = bento.mediaType === 'video' ? 'block' : 'none';
  el.bentoMediaBadge.textContent = `Ratio ${bento.ratio} · ${bento.mediaType}`;

  persistHeroSettings();
}

function updateBentoLivePreview() {
  const bento = state.heroData.bentos[state.activeBentoIndex];
  if (!bento) return;

  const src = bento.mediaSrc || '';

  if (!src) {
    el.bentoPreviewImg.style.display = 'none';
    el.bentoPreviewVideo.style.display = 'none';
    el.bentoPreviewFallback.style.display = 'block';
    return;
  }

  el.bentoPreviewFallback.style.display = 'none';

  if (bento.mediaType === 'video') {
    el.bentoPreviewImg.style.display = 'none';
    el.bentoPreviewVideo.style.display = 'block';
    el.bentoPreviewVideo.src = src;
    el.bentoPreviewVideo.load();
    el.bentoPreviewVideo.play().catch(() => {});
  } else {
    el.bentoPreviewVideo.style.display = 'none';
    el.bentoPreviewImg.style.display = 'block';
    el.bentoPreviewImg.src = src;
  }
}

function persistHeroSettings() {
  try {
    localStorage.setItem('vandalit_hero_override', JSON.stringify(state.heroData));
  } catch (err) {
    console.error('[Backoffice] Error persistiendo hero settings:', err);
  }
}

// ── FILE SYSTEM ACCESS API (LOCAL DISK SAVE) ──────────────
function setupFileSystemAPI() {
  // En entorno web desplegado, JAMÁS solicitar acceso al sistema de archivos ni disparar permisos del navegador
  if (!state.isLocal) {
    if (el.btnConnectFs) el.btnConnectFs.style.display = 'none';
    return;
  }

  if (!window.showDirectoryPicker) {
    el.btnConnectFs.title = 'Tu navegador no soporta File System Access API (se recomienda Chrome/Edge/Brave).';
    return;
  }

  el.btnConnectFs.addEventListener('click', async () => {
    try {
      const handle = await window.showDirectoryPicker({
        id: 'vandalit-portfolio-root',
        mode: 'readwrite'
      });

      let hasContent = false;
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory' && entry.name === 'content') {
          hasContent = true;
          break;
        }
      }

      if (!hasContent) {
        showToast("Selecciona la carpeta raíz 'portafolio' (que contiene el directorio 'content/').", 'danger');
        return;
      }

      state.fsHandle = handle;
      el.fsStatusLabel.textContent = `📁 Conectado: ${handle.name}`;
      el.btnConnectFs.classList.add('bo-btn--lime');
      el.btnConnectFs.classList.remove('bo-btn--outline');
      el.btnSaveDisk.style.display = 'inline-flex';

      showToast('¡Carpeta del portafolio conectada! Ahora puedes guardar directamente a disco.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Backoffice] Error conectando File System:', err);
        showToast('No se pudo conectar la carpeta.', 'danger');
      }
    }
  });

  // Guardar en Disco (Híbrido: Backend Local API o File System API)
  el.btnSaveDisk.addEventListener('click', async () => {
    // CASO A: Backend Local API activo
    if (state.hasBackend) {
      try {
        el.btnSaveDisk.disabled = true;
        el.btnSaveDisk.innerHTML = '<span>Guardando vía API...</span>';

        // 1. Guardar Casos de Estudio
        await fetch('/api/content/case-studies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: state.data['case-studies'] })
        });

        // 2. Guardar Clientes
        await fetch('/api/content/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: state.data['clients'] })
        });

        // 3. Guardar Lab
        await fetch('/api/content/lab', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: state.data['lab'] })
        });

        // 4. Guardar Skills
        if (state.data['skills'] && state.data['skills'].length > 0) {
          const skillsPayload = {
            legend: state.skillsLegend || {
              autoral: { label: "Multimedia y diseño", color: "magenta" },
              desarrollo: { label: "Desarrollo", color: "lime" },
              comercial: { label: "Comercial", color: "mango" }
            },
            categories: state.data['skills']
          };
          await fetch('/api/skills', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skillsPayload)
          });
        }

        // 5. Guardar Hero & Bentos
        if (state.heroData) {
          await fetch('/api/hero', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.heroData)
          });
        }

        // 6. Guardar Textos del Sitio (site.json)
        if (state.siteData) {
          await fetch('/api/site', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.siteData)
          });
        }

        // Limpiar borradores
        localStorage.removeItem('vandalit_content_override');
        localStorage.removeItem('vandalit_hero_override');
        localStorage.removeItem('vandalit_site_override');

        showToast('✅ ¡Todos los JSONs y archivos se guardaron físicamente en disco mediante el backend local!');
      } catch (err) {
        console.error('[Backoffice] Error guardando mediante backend:', err);
        showToast('Error guardando en el backend: ' + err.message, 'danger');
      } finally {
        el.btnSaveDisk.disabled = false;
        el.btnSaveDisk.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          <span>Guardar en Disco</span>
        `;
      }
      return;
    }

    // CASO B: File System Access API nativo
    if (!state.fsHandle) return;

    try {
      el.btnSaveDisk.disabled = true;
      el.btnSaveDisk.innerHTML = '<span>Guardando...</span>';

      const contentDir = await state.fsHandle.getDirectoryHandle('content');

      // 1. Guardar Casos de Estudio
      await saveSectionToDisk(contentDir, 'case-studies', state.data['case-studies']);

      // 2. Guardar Clientes
      await saveSectionToDisk(contentDir, 'clients', state.data['clients']);

      // 3. Guardar Lab
      await saveSectionToDisk(contentDir, 'lab', state.data['lab']);

      // 4. Guardar Skills
      if (state.data['skills'] && state.data['skills'].length > 0) {
        const skillsPayload = {
          legend: state.skillsLegend || {
            autoral: { label: "Multimedia y diseño", color: "magenta" },
            desarrollo: { label: "Desarrollo", color: "lime" },
            comercial: { label: "Comercial", color: "mango" }
          },
          categories: state.data['skills']
        };
        const skillsDir = await contentDir.getDirectoryHandle('skills', { create: true });
        const skillsFile = await skillsDir.getFileHandle('skills.json', { create: true });
        const writable = await skillsFile.createWritable();
        await writable.write(JSON.stringify(skillsPayload, null, 2) + '\n');
        await writable.close();
      }

      // 5. Guardar Hero & Bentos en content/settings/hero.json
      if (state.heroData) {
        const settingsDir = await contentDir.getDirectoryHandle('settings', { create: true });
        const heroFile = await settingsDir.getFileHandle('hero.json', { create: true });
        const heroWritable = await heroFile.createWritable();
        await heroWritable.write(JSON.stringify(state.heroData, null, 2) + '\n');
        await heroWritable.close();
      }

      // Limpiar borradores
      localStorage.removeItem('vandalit_content_override');
      localStorage.removeItem('vandalit_hero_override');

      showToast('✅ ¡Todos los archivos project.json, index.json y hero.json se guardaron físicamente en disco!');
    } catch (err) {
      console.error('[Backoffice] Error guardando a disco:', err);
      showToast('Error escribiendo archivos en disco: ' + err.message, 'danger');
    } finally {
      el.btnSaveDisk.disabled = false;
      el.btnSaveDisk.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span>Guardar en Disco</span>
      `;
    }
  });
}

async function saveSectionToDisk(contentDir, sectionName, projects) {
  const sectionDir = await contentDir.getDirectoryHandle(sectionName, { create: true });

  const slugs = projects.map(p => p.id);
  const indexFile = await sectionDir.getFileHandle('index.json', { create: true });
  const indexWritable = await indexFile.createWritable();
  await indexWritable.write(JSON.stringify(slugs, null, 2) + '\n');
  await indexWritable.close();

  for (const project of projects) {
    if (!project.id) continue;
    const projDir = await sectionDir.getDirectoryHandle(project.id, { create: true });
    const projFile = await projDir.getFileHandle('project.json', { create: true });
    const projWritable = await projFile.createWritable();

    const cleanProject = { ...project };
    delete cleanProject._type;

    await projWritable.write(JSON.stringify(cleanProject, null, 2) + '\n');
    await projWritable.close();
  }
}

// ── EXPORTACIÓN E IMPORTACIÓN JSON ────────────────────────
function setupExportImport() {
  el.btnExportJson.addEventListener('click', () => {
    const payload = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      'case-studies': state.data['case-studies'],
      'clients': state.data['clients'],
      'lab': state.data['lab'],
      'skills': {
        legend: state.skillsLegend || {},
        categories: state.data['skills']
      },
      'hero': state.heroData
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vandalit-portfolio-config-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo JSON de configuración exportado (incluye Hero & Bentos)');
  });

  el.inputImportJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported['clients'] && !imported['case-studies']) {
          throw new Error('El archivo no contiene la estructura requerida de secciones.');
        }

        if (imported['case-studies']) state.data['case-studies'] = imported['case-studies'];
        if (imported['clients']) state.data['clients'] = imported['clients'];
        if (imported['lab']) state.data['lab'] = imported['lab'];
        if (imported['skills']) {
          if (Array.isArray(imported['skills'].categories)) {
            state.skillsLegend = imported['skills'].legend || {};
            state.data['skills'] = imported['skills'].categories;
          } else if (Array.isArray(imported['skills'])) {
            state.data['skills'] = imported['skills'];
          }
        }
        if (imported['hero']) state.heroData = imported['hero'];

        persistDraft();
        persistHeroSettings();
        updateCounts();
        renderProjectList();
        loadActiveProject();
        if (state.currentSection === 'hero') renderHeroEditor();

        showToast('Configuración JSON importada y aplicada al borrador con éxito');
      } catch (err) {
        showToast('Error al importar JSON: ' + err.message, 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

// ── SITE SETTINGS & LANDING COPY EDITOR ───────────────────
function renderSiteProjectList() {
  el.projectList.innerHTML = `
    <div class="bo-project-item is-selected">
      <div class="bo-project-item__info">
        <span class="bo-project-item__title">🌐 Configuración General</span>
        <span class="bo-project-item__slug">content/settings/site.json</span>
      </div>
    </div>
  `;
}

function populateSiteForm() {
  if (!state.siteData) return;

  const site = state.siteData;

  // Hero & Brand
  if (el.siteBrandLine1) el.siteBrandLine1.value = site.brand?.nameLine1 || 'van·';
  if (el.siteBrandLine2) el.siteBrandLine2.value = site.brand?.nameLine2 || 'dalit';
  if (el.siteHeroEyebrow) el.siteHeroEyebrow.value = site.hero?.eyebrow || '';
  if (el.siteHeroTagline) el.siteHeroTagline.value = site.hero?.tagline || '';
  if (el.siteHeroCtaWork) el.siteHeroCtaWork.value = site.hero?.ctaWorkText || 'Ver trabajo';
  if (el.siteHeroCtaContact) el.siteHeroCtaContact.value = site.hero?.ctaContactText || 'Contacto';
  if (el.siteHeroEmail) el.siteHeroEmail.value = site.hero?.email || '';
  if (el.siteSocialGithub) el.siteSocialGithub.value = site.hero?.socials?.github || '';
  if (el.siteSocialBehance) el.siteSocialBehance.value = site.hero?.socials?.behance || '';

  // Secciones
  const sec = site.sections || {};
  if (el.siteCasesEyebrow) el.siteCasesEyebrow.value = sec.cases?.eyebrow || '';
  if (el.siteCasesTitle) el.siteCasesTitle.value = sec.cases?.title || '';
  if (el.siteCasesDesc) el.siteCasesDesc.value = sec.cases?.description || '';

  if (el.siteSkillsEyebrow) el.siteSkillsEyebrow.value = sec.skills?.eyebrow || '';
  if (el.siteSkillsTitle) el.siteSkillsTitle.value = sec.skills?.title || '';
  if (el.siteSkillsDesc) el.siteSkillsDesc.value = sec.skills?.description || '';
  if (el.siteSkillsLegM) el.siteSkillsLegM.value = sec.skills?.legendMultimedia || '';
  if (el.siteSkillsLegC) el.siteSkillsLegC.value = sec.skills?.legendCoding || '';

  if (el.siteWorkEyebrow) el.siteWorkEyebrow.value = sec.work?.eyebrow || '';
  if (el.siteWorkTitle) el.siteWorkTitle.value = sec.work?.title || '';
  if (el.siteWorkDesc) el.siteWorkDesc.value = sec.work?.description || '';

  if (el.siteLabEyebrow) el.siteLabEyebrow.value = sec.lab?.eyebrow || '';
  if (el.siteLabTitle) el.siteLabTitle.value = sec.lab?.title || '';
  if (el.siteLabDesc) el.siteLabDesc.value = sec.lab?.description || '';
  if (el.siteLabNoteTitle) el.siteLabNoteTitle.value = sec.lab?.noteTitle || '';
  if (el.siteLabNoteContent) el.siteLabNoteContent.value = sec.lab?.noteContent || '';

  // Footer
  const footer = site.footer || {};
  if (el.siteFooterLogo) el.siteFooterLogo.value = footer.logoHtml || '';
  if (el.siteFooterTagline) el.siteFooterTagline.value = footer.tagline || '';
  if (el.siteFooterContactEyebrow) el.siteFooterContactEyebrow.value = footer.contactEyebrow || '';
  if (el.siteFooterContactEmail) el.siteFooterContactEmail.value = footer.contactEmail || '';
  if (el.siteFooterCopy) el.siteFooterCopy.value = footer.copyright || '';
}

function setupSiteEditorListeners() {
  const siteInputs = [
    el.siteBrandLine1, el.siteBrandLine2, el.siteHeroEyebrow, el.siteHeroTagline,
    el.siteHeroCtaWork, el.siteHeroCtaContact, el.siteHeroEmail, el.siteSocialGithub,
    el.siteSocialBehance, el.siteCasesEyebrow, el.siteCasesTitle, el.siteCasesDesc,
    el.siteSkillsEyebrow, el.siteSkillsTitle, el.siteSkillsDesc, el.siteSkillsLegM,
    el.siteSkillsLegC, el.siteWorkEyebrow, el.siteWorkTitle, el.siteWorkDesc,
    el.siteLabEyebrow, el.siteLabTitle, el.siteLabDesc, el.siteLabNoteTitle,
    el.siteLabNoteContent, el.siteFooterLogo, el.siteFooterTagline,
    el.siteFooterContactEyebrow, el.siteFooterContactEmail, el.siteFooterCopy
  ];

  siteInputs.forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      saveSiteValuesFromForm();
    });
  });
}

function saveSiteValuesFromForm() {
  if (!state.siteData) state.siteData = {};

  const s = state.siteData;
  if (!s.brand) s.brand = {};
  s.brand.nameLine1 = el.siteBrandLine1.value.trim();
  s.brand.nameLine2 = el.siteBrandLine2.value.trim();
  s.brand.fullName = `${s.brand.nameLine1}${s.brand.nameLine2}`.replace(/·/g, '');

  if (!s.hero) s.hero = {};
  s.hero.eyebrow = el.siteHeroEyebrow.value.trim();
  s.hero.tagline = el.siteHeroTagline.value.trim();
  s.hero.ctaWorkText = el.siteHeroCtaWork.value.trim();
  s.hero.ctaContactText = el.siteHeroCtaContact.value.trim();
  s.hero.email = el.siteHeroEmail.value.trim();
  if (!s.hero.socials) s.hero.socials = {};
  s.hero.socials.github = el.siteSocialGithub.value.trim();
  s.hero.socials.behance = el.siteSocialBehance.value.trim();

  if (!s.sections) s.sections = {};
  if (!s.sections.cases) s.sections.cases = {};
  s.sections.cases.eyebrow = el.siteCasesEyebrow.value.trim();
  s.sections.cases.title = el.siteCasesTitle.value.trim();
  s.sections.cases.description = el.siteCasesDesc.value.trim();

  if (!s.sections.skills) s.sections.skills = {};
  s.sections.skills.eyebrow = el.siteSkillsEyebrow.value.trim();
  s.sections.skills.title = el.siteSkillsTitle.value.trim();
  s.sections.skills.description = el.siteSkillsDesc.value.trim();
  s.sections.skills.legendMultimedia = el.siteSkillsLegM.value.trim();
  s.sections.skills.legendCoding = el.siteSkillsLegC.value.trim();

  if (!s.sections.work) s.sections.work = {};
  s.sections.work.eyebrow = el.siteWorkEyebrow.value.trim();
  s.sections.work.title = el.siteWorkTitle.value.trim();
  s.sections.work.description = el.siteWorkDesc.value.trim();

  if (!s.sections.lab) s.sections.lab = {};
  s.sections.lab.eyebrow = el.siteLabEyebrow.value.trim();
  s.sections.lab.title = el.siteLabTitle.value.trim();
  s.sections.lab.description = el.siteLabDesc.value.trim();
  s.sections.lab.noteTitle = el.siteLabNoteTitle.value.trim();
  s.sections.lab.noteContent = el.siteLabNoteContent.value.trim();

  if (!s.footer) s.footer = {};
  s.footer.logoHtml = el.siteFooterLogo.value.trim();
  s.footer.tagline = el.siteFooterTagline.value.trim();
  s.footer.contactEyebrow = el.siteFooterContactEyebrow.value.trim();
  s.footer.contactEmail = el.siteFooterContactEmail.value.trim();
  s.footer.copyright = el.siteFooterCopy.value.trim();

  try {
    localStorage.setItem('vandalit_site_override', JSON.stringify(state.siteData));
  } catch (err) {
    console.error('[Backoffice] Error guardando borrador de site.json en localStorage:', err);
  }
}

// ── BOOTSTRAP ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

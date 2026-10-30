/* ==========================================================
   CONTENT-LOADER.JS — Modular Content Fetcher & Path Resolver
   Desacoplamiento modular de /content/:
   - case-studies/
   - clients/
   - lab/
   - skills/
   ========================================================== */

/**
 * Normaliza una ruta de asset:
 * - Si es URL externa (http://, https://, //, data:): la deja idéntica (modo mock).
 * - Si es relativa (ej: 'cover.webp' o 'gallery/01.webp'):
 *   le antepone la ruta base del proyecto (ej: './content/case-studies/syzygy/').
 *
 * @param {string} basePath - Ruta base de la carpeta del proyecto
 * @param {string} assetPath - Ruta del asset indicada en project.json
 * @returns {string} Ruta normalizada lista para usar en src
 */
export function resolveAssetPath(basePath, assetPath) {
  if (!assetPath) return '';
  if (/^(https?:|\/\/|data:)/i.test(assetPath)) {
    return assetPath;
  }
  const cleanBase = basePath.replace(/\/+$/, '');
  const cleanAsset = assetPath.replace(/^(\.\/|\/)+/, '');
  return `${cleanBase}/${cleanAsset}`;
}

/**
 * Normaliza los assets de un proyecto (cover y galería)
 *
 * @param {string} projectDir - Carpeta del proyecto (ej: './content/case-studies/syzygy')
 * @param {Object} projectData - Datos leídos del project.json
 * @returns {Object} Proyecto con rutas resueltas y retrocompatibles
 */
function normalizeProjectAssets(projectDir, projectData) {
  const coverRaw = projectData.cover || projectData.coverPlaceholder || '';
  const resolvedCover = resolveAssetPath(projectDir, coverRaw);

  const rawGallery = Array.isArray(projectData.gallery) ? projectData.gallery : [];
  const resolvedGallery = rawGallery.map(img => resolveAssetPath(projectDir, img));

  return {
    ...projectData,
    cover: resolvedCover,
    coverPlaceholder: resolvedCover, // Retrocompatibilidad para componentes existentes
    gallery: resolvedGallery
  };
}

export const CONTENT_BASE_URL = new URL('../../content', import.meta.url).href.replace(/\/+$/, '');

/**
 * Carga una sección modular a partir de su index.json y los subfolders de proyectos
 *
 * @param {string} sectionName - 'case-studies' | 'clients' | 'lab'
 * @returns {Promise<Array<Object>>} Lista de proyectos cargados y normalizados
 */
export async function loadSection(sectionName) {
  try {
    const indexPath = `${CONTENT_BASE_URL}/${sectionName}/index.json`;
    const indexRes = await fetch(indexPath);
    if (!indexRes.ok) {
      throw new Error(`Failed to fetch section index: ${indexPath} (${indexRes.status})`);
    }
    const slugs = await indexRes.json();

    const projects = await Promise.all(
      slugs.map(async (slug) => {
        const projectDir = `${CONTENT_BASE_URL}/${sectionName}/${slug}`;
        const projectPath = `${projectDir}/project.json`;
        try {
          const res = await fetch(projectPath);
          if (!res.ok) {
            console.warn(`[ContentLoader] Could not load ${projectPath}: HTTP ${res.status}`);
            return null;
          }
          const rawData = await res.json();
          return normalizeProjectAssets(projectDir, rawData);
        } catch (err) {
          console.error(`[ContentLoader] Error parsing ${projectPath}:`, err);
          return null;
        }
      })
    );

    return projects.filter(Boolean);
  } catch (err) {
    console.error(`[ContentLoader] Failed to load section '${sectionName}':`, err);
    return [];
  }
}

/**
 * Carga las habilidades técnicas desde content/skills/skills.json
 *
 * @returns {Promise<{ legend: Object, categories: Array<Object> }>}
 */
export async function loadSkills() {
  try {
    const skillsPath = `${CONTENT_BASE_URL}/skills/skills.json`;
    const res = await fetch(skillsPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[ContentLoader] Failed to load skills:', err);
    return { legend: {}, categories: [] };
  }
}

/**
 * Carga todo el contenido modular del portafolio en paralelo.
 * Si existe un borrador de edición en localStorage ('vandalit_content_override'),
 * lo utiliza prioritariamente (ideal para pruebas en Web/GitHub Pages).
 *
 * @param {boolean} [forceFromFiles=false] - Forzar carga desde archivos ignorando localStorage
 * @returns {Promise<{ cases: Array, clients: Array, lab: Array, skills: Array }>}
 */
export async function loadAllContent(forceFromFiles = false) {
  if (!forceFromFiles) {
    try {
      const localOverride = localStorage.getItem('vandalit_content_override');
      if (localOverride) {
        const parsed = JSON.parse(localOverride);
        if (parsed && parsed.cases && parsed.clients) {
          console.log('%c[ContentLoader] ⚡ Usando datos desde borrador localStorage (modo preview / backoffice)', 'color: #ccf020; font-weight: bold;');
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[ContentLoader] Error leyendo borrador de localStorage, continuando con archivos:', err);
    }
  }

  console.log('%c[ContentLoader] 📦 Loading modular content from /content/...', 'color: #b8e030; font-weight: bold;');
  const startTime = performance.now();

  const [cases, clients, lab, skills] = await Promise.all([
    loadSection('case-studies'),
    loadSection('clients'),
    loadSection('lab'),
    loadSkills()
  ]);

  const elapsed = (performance.now() - startTime).toFixed(1);
  console.log(`%c[ContentLoader] ✅ Modular content loaded in ${elapsed}ms:`, 'color: #b8e030; font-weight: bold;', {
    cases: cases.length,
    clients: clients.length,
    lab: lab.length,
    skills: (skills.categories || []).length
  });

  return { cases, clients, lab, skills };
}

/**
 * Carga la configuración global del sitio desde content/settings/site.json
 * Soporta override de borrador en localStorage ('vandalit_site_override').
 *
 * @param {boolean} [forceFromFiles=false]
 * @returns {Promise<Object>}
 */
export async function loadSiteSettings(forceFromFiles = false) {
  if (!forceFromFiles) {
    try {
      const localOverride = localStorage.getItem('vandalit_site_override');
      if (localOverride) {
        const parsed = JSON.parse(localOverride);
        if (parsed && (parsed.hero || parsed.sections)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[ContentLoader] Error leyendo borrador de site settings:', err);
    }
  }

  try {
    const sitePath = `${CONTENT_BASE_URL}/settings/site.json`;
    const res = await fetch(sitePath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[ContentLoader] Failed to load site settings:', err);
    return null;
  }
}



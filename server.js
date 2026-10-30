import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper seguro para paths
const contentPath = (...subpaths) => path.join(__dirname, 'content', ...subpaths);
const assetsPath = (...subpaths) => path.join(__dirname, 'assets', ...subpaths);

// Función auxiliar para leer JSON de forma segura
function readJsonFile(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[Server] Error leyendo ${filePath}:`, err.message);
    return defaultValue;
  }
}

// Función auxiliar para escribir JSON formateado
function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ── CONFIGURACIÓN DE MULTER PARA UPLOADS ─────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const section = req.body.section || 'general';
    const slug = req.body.slug || 'temp';
    const target = req.body.target || 'cover'; // 'cover' | 'gallery' | 'bento' | 'general'

    let destDir = '';

    if (target === 'gallery') {
      destDir = contentPath(section, slug, 'gallery');
    } else if (target === 'cover') {
      destDir = contentPath(section, slug);
    } else if (target === 'bento') {
      destDir = assetsPath('images', 'bentos');
    } else {
      destDir = assetsPath('images');
    }

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    // Sanitizar nombre de archivo (remover acentos y diacríticos, pasar a minúsculas)
    const originalExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, originalExt)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-');
    cb(null, `${baseName}${originalExt.toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB max
});

// ── RUTAS API ───────────────────────────────────────────────

// 1. Status / Health-check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'local-backend',
    serverPort: PORT,
    timestamp: new Date().toISOString()
  });
});

// 2. Site Settings
app.get('/api/site', (req, res) => {
  const filePath = contentPath('settings', 'site.json');
  const data = readJsonFile(filePath, {});
  res.json(data);
});

app.put('/api/site', (req, res) => {
  try {
    const filePath = contentPath('settings', 'site.json');
    writeJsonFile(filePath, req.body);
    res.json({ success: true, message: 'site.json actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Hero Settings
app.get('/api/hero', (req, res) => {
  const filePath = contentPath('settings', 'hero.json');
  const data = readJsonFile(filePath, { videos: {}, bentos: [] });
  res.json(data);
});

app.put('/api/hero', (req, res) => {
  try {
    const filePath = contentPath('settings', 'hero.json');
    writeJsonFile(filePath, req.body);
    res.json({ success: true, message: 'hero.json actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Skills
app.get('/api/skills', (req, res) => {
  const filePath = contentPath('skills', 'skills.json');
  const data = readJsonFile(filePath, []);
  res.json(data);
});

app.put('/api/skills', (req, res) => {
  try {
    const filePath = contentPath('skills', 'skills.json');
    writeJsonFile(filePath, req.body);
    res.json({ success: true, message: 'skills.json actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Proyectos por Sección ('clients', 'case-studies', 'lab')
app.get('/api/content/:section', (req, res) => {
  const { section } = req.params;
  const indexPath = contentPath(section, 'index.json');
  const slugs = readJsonFile(indexPath, []);

  const projects = slugs.map(slug => {
    const projectPath = contentPath(section, slug, 'project.json');
    return readJsonFile(projectPath);
  }).filter(Boolean);

  res.json({ section, slugs, projects });
});

app.put('/api/content/:section', (req, res) => {
  const { section } = req.params;
  const { projects } = req.body;

  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'Body debe incluir un array `projects`' });
  }

  try {
    const slugs = projects.map(p => p.id || p.slug);
    // 1. Guardar index.json
    writeJsonFile(contentPath(section, 'index.json'), slugs);

    // 2. Guardar cada project.json
    for (const proj of projects) {
      const slug = proj.id || proj.slug;
      if (!slug) continue;
      const projDir = contentPath(section, slug);
      if (!fs.existsSync(projDir)) {
        fs.mkdirSync(projDir, { recursive: true });
      }
      writeJsonFile(path.join(projDir, 'project.json'), proj);
    }

    res.json({ success: true, message: `Sección ${section} actualizada`, slugsCount: slugs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Mover proyectos entre secciones físicas
app.post('/api/content/move', (req, res) => {
  const { slug, fromSection, toSection } = req.body;
  if (!slug || !fromSection || !toSection) {
    return res.status(400).json({ error: 'Faltan parámetros: slug, fromSection, toSection' });
  }

  try {
    const srcDir = contentPath(fromSection, slug);
    const destDir = contentPath(toSection, slug);

    if (fs.existsSync(srcDir)) {
      // Si la carpeta de destino ya existe, renombrar o reemplazar
      if (!fs.existsSync(path.dirname(destDir))) {
        fs.mkdirSync(path.dirname(destDir), { recursive: true });
      }
      fs.renameSync(srcDir, destDir);
    }

    // Actualizar index.json origen
    const fromIndexFile = contentPath(fromSection, 'index.json');
    let fromSlugs = readJsonFile(fromIndexFile, []);
    fromSlugs = fromSlugs.filter(s => s !== slug);
    writeJsonFile(fromIndexFile, fromSlugs);

    // Actualizar index.json destino
    const toIndexFile = contentPath(toSection, 'index.json');
    let toSlugs = readJsonFile(toIndexFile, []);
    if (!toSlugs.includes(slug)) {
      toSlugs.push(slug);
    }
    writeJsonFile(toIndexFile, toSlugs);

    res.json({ success: true, message: `Proyecto ${slug} movido de ${fromSection} a ${toSection}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Eliminar proyecto
app.delete('/api/content/:section/:slug', (req, res) => {
  const { section, slug } = req.params;
  try {
    // 1. Quitar de index.json
    const indexPath = contentPath(section, 'index.json');
    let slugs = readJsonFile(indexPath, []);
    slugs = slugs.filter(s => s !== slug);
    writeJsonFile(indexPath, slugs);

    // 2. Mover a papelera temporal o eliminar directorio
    const projDir = contentPath(section, slug);
    if (fs.existsSync(projDir)) {
      fs.rmSync(projDir, { recursive: true, force: true });
    }

    res.json({ success: true, message: `Proyecto ${slug} eliminado de ${section}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Upload de imágenes (Fase 3)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo' });
  }

  const { section, slug, target } = req.body;
  const fileName = req.file.filename;

  let relativePath = '';
  if (target === 'gallery') {
    relativePath = `gallery/${fileName}`;
  } else if (target === 'cover') {
    relativePath = fileName;
  } else if (target === 'bento') {
    relativePath = `./assets/images/bentos/${fileName}`;
  } else {
    relativePath = `./assets/images/${fileName}`;
  }

  res.json({
    success: true,
    fileName,
    relativePath,
    size: req.file.size,
    mimeType: req.file.mimetype
  });
});

// ── SERVIR ARCHIVOS ESTÁTICOS ───────────────────────────────
// Servir la raíz del proyecto para acceder al portafolio e index.html
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
  console.log(`\n%c[Vandalit Studio Backend] 🚀 Servidor activo en http://localhost:${PORT}`);
  console.log(`  • Portafolio:  http://localhost:${PORT}/`);
  console.log(`  • Backoffice:  http://localhost:${PORT}/backoffice/`);
  console.log(`  • Status API:  http://localhost:${PORT}/api/status\n`);
});


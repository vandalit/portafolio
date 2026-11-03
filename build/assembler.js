import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

/**
 * assembleHtml — Resuelve las directivas <!-- include:ruta --> recursivamente
 * a partir de un template base (por defecto ROOT/index.html).
 */
export function assembleHtml(templatePath = join(ROOT, 'index.html')) {
  if (!existsSync(templatePath)) {
    throw new Error(`[assembler] Template no encontrado en: ${templatePath}`);
  }

  let content = readFileSync(templatePath, 'utf8');

  // Reemplazar <!-- include:path/to/file.html -->
  const includeRegex = /<!--\s*include:([^\s]+)\s*-->/g;

  content = content.replace(includeRegex, (match, relPath) => {
    const fullPath = join(ROOT, relPath.trim());
    if (!existsSync(fullPath)) {
      console.warn(`[assembler] ⚠️ Advertencia: Archivo include no encontrado: ${fullPath}`);
      return `<!-- Error: include ${relPath} not found -->`;
    }
    return readFileSync(fullPath, 'utf8').trimEnd();
  });

  return content;
}


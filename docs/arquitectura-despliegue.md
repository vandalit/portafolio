# Portafolio vandalit: arquitectura y despliegue

**Repositorio:** `vandalit/portafolio`
**Sitio publicado:** https://vandalit.github.io/portafolio/
**Alcance:** cómo se genera y publica el sitio. No cubre cambios de contenido (textos, habilidades, casos) ni la estrategia de SEO; esas capas se trabajan en documentos separados.

---

## 1. Diagnóstico del estado actual

- La landing se hidrata en el navegador: `src/js/main.js` lee `content/settings/site.json`, `content/settings/hero.json` y `content/skills/skills.json` con `fetch` y construye el DOM. El HTML inicial es un shell casi vacío.
- El repositorio se publica directamente desde la rama `main` en GitHub Pages, sin paso de build.
- Hay URLs de prueba (Unsplash) en `hero.json` y un caso con portada provisional (`content/case-studies/syzygy/`), que llegan a producción.
- El README describe el sitio como "estático de alto rendimiento", pero el contenido visible no existe en el HTML publicado.
- `server.js` y el Studio (`backoffice/`) se usan solo en local, sin separación explícita entre lo que se publica y lo que es herramienta de edición.

---

## 2. Arquitectura objetivo

```
content/ (JSON + assets)  →  build/  →  dist/  →  GitHub Pages
        ↑
   Studio (local, escribe JSON)
```

**Principios:**

1. **`content/` es la única fuente de verdad.** Nadie edita HTML generado.
2. **`dist/` no se versiona.** Se genera en cada despliegue y se incluye en `.gitignore`.
3. **El texto debe estar en el HTML inicial.** Todo contenido visible o indexable se renderiza en el build.
4. **El JavaScript mejora, no construye.** Si el JS falla, la página sigue mostrando contenido, navegación y enlaces.
5. **El Studio no forma parte del sitio público.** Su salida es JSON e imágenes, nunca HTML.

---

## 3. Build

Un script de build en Node, sin framework en esta primera versión (ver decisiones abiertas), con estas responsabilidades:

- Leer `content/settings/`, `content/case-studies/`, `content/clients/`, `content/lab/` y `content/skills/`.
- Generar `dist/index.html` completo: todo el texto, navegación y enlaces de contacto.
- Generar `dist/sitemap.xml` y `dist/robots.txt`.
- Copiar `assets/` y las imágenes de `content/` a `dist/` conservando sus rutas.
- Generar `dist/llms.txt` desde los mismos JSON, para que no se desfase del sitio.
- Copiar los scripts de `src/js/` y los estilos de `src/css/` a `dist/`, para cargarlos después del primer render.
- **Fallar el build** si detecta:
  - URLs de Unsplash u otros servicios de prueba en cualquier JSON.
  - Rutas de imagen que no existen en disco.
  - Campos obligatorios vacíos (título, descripción, enlace de contacto).
  - JSON mal formado.

---

## 4. Despliegue

- GitHub Pages cambia su fuente de **rama `main`** a **GitHub Actions**.
- Un workflow en `.github/workflows/deploy.yml` se ejecuta en cada push a `main`:
  1. Instala dependencias.
  2. Ejecuta el build.
  3. Sube `dist/` como artefacto con `actions/upload-pages-artifact`.
  4. Publica con `actions/deploy-pages`.
- El paso de build debe fallar si no pasa las validaciones del punto 3, y el despliegue no debe ejecutarse en ese caso.
- Si el workflow falla, Pages conserva la última versión publicada correctamente.

---

## 5. Requisitos de carga y JavaScript

- **Three.js:** se carga después del evento `load`, o cuando la escena entra en pantalla con `IntersectionObserver`. En dispositivos móviles la escena se reemplaza por una imagen estática.
- **Videos de YouTube:** se muestra una imagen de portada y el iframe se carga solo al hacer clic. Ningún iframe se carga al inicio.
- **Imágenes:** `loading="lazy"` en todo lo que está fuera del primer pantallazo, con `width` y `height` declarados para evitar saltos de diseño.
- **Scripts:** `defer` en todos los scripts de la página.
- **Sin dependencias de runtime:** el sitio no requiere Node en producción.

---

## 6. Studio

- Sigue siendo una herramienta local. Escribe JSON y copia imágenes a `content/`.
- Deja de ser necesario para publicar. El flujo es: editar en el Studio → revisar con `git diff content/` → commit → push.
- El modo web (borradores en `localStorage` y exportación/importación de `vandalit-portfolio-config.json`) se mantiene como respaldo, documentado en el README.

---

## 7. Estructura de carpetas propuesta

```
portafolio/
├── content/            # fuente de verdad (JSON + imágenes)
├── build/              # script de build
├── src/                # JS y CSS del sitio (mejora progresiva)
├── backoffice/         # Studio (solo local)
├── assets/             # favicons, iconos y recursos estáticos
├── dist/               # generado; en .gitignore
├── .github/workflows/deploy.yml
└── README.md
```

---

## 8. Criterios de aceptación

El despliegue se considera correcto cuando:

- [ ] Una petición HTTP simple a la URL publicada devuelve el texto de identidad, habilidades y casos, sin ejecutar JavaScript.
- [ ] No hay URLs de prueba ni rutas de imagen rotas en `dist/`.
- [ ] `dist/` no está versionado y el repositorio no contiene HTML generado.
- [ ] El workflow se ejecuta en cada push a `main` y no publica si el build no pasa validaciones.
- [ ] La página es usable con JavaScript deshabilitado.
- [ ] `sitemap.xml`, `robots.txt` y `llms.txt` existen en la URL publicada.

---

## 9. Decisiones abiertas

1. **Script de Node propio o Astro.** Un script propio da control total y es más código que mantener. Astro resuelve el pre-renderizado y las islas de JavaScript, pero agrega una dependencia. **Recomendación:** script propio, por ser un ejercicio de arquitectura.
2. **Dominio.** Se mantiene la URL de GitHub Pages por ahora. La migración a dominio propio no cambia la arquitectura.
3. **Repositorio.** Se mantiene `vandalit/portafolio`, con las identidades separadas según lo definido.

---

## 10. Fuera de alcance de este documento

- Correcciones de contenido: textos, habilidades y niveles, casos y laboratorio.
- Estrategia de SEO: metadatos por página, JSON-LD, imágenes de vista previa (`og:image`, `twitter:image`), favicon y políticas de robots para crawlers de IA.

Estas capas se documentan por separado y dependen de los criterios de este documento.

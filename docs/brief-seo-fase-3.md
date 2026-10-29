# Portafolio vandalit: brief fase 3, SEO y configuración

**Repositorio:** `vandalit/portafolio`
**Sitio publicado:** https://vandalit.github.io/portafolio/
**Depende de:** `arquitectura-despliegue.md` (fase 1) y `brief-skillset-fase-2.md` (fase 2).
**Alcance:** metadatos, schema, idiomas, rastreo, imágenes de vista previa, favicon y el módulo SEO del backoffice.

---

## 1. Principios

1. **Una página, dos idiomas.** La home en español (`/portafolio/`) y su versión en inglés (`/portafolio/en/`). Los casos y clientes viven como secciones con anchor dentro de cada página. No se generan páginas por caso.
2. **Sin plugins ni servicios de terceros.** El SEO se resuelve con HTML, JSON-LD, `robots.txt`, `sitemap.xml` y archivos estáticos.
3. **Las limitaciones de GitHub Pages son parte del diseño.** No hay headers HTTP propios, ni redirecciones del servidor. Todo se controla desde el HTML y los archivos del build.
4. **Todo parámetro SEO es configurable desde el backoffice.** Nada de textos, URLs, imágenes ni identidades se escribe a mano en plantillas. Los valores viven en `content/settings/seo.json`, editado desde el Studio.
5. **Las identidades se mantienen separadas.** Este sitio representa a vandalit. No enlaza cuentas de mindsurfer ni datos personales ajenos a la identidad pública.

---

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Dominio | `https://vandalit.github.io/portafolio/`. Sin cambios. |
| Estructura | Una página por idioma, con secciones y anchors (`#casos`, `#clientes`, `#lab`, `#habilidades`, `#contacto`). |
| Idiomas | `es-CL` por defecto en `/portafolio/`. `en` en `/portafolio/en/`. |
| Nombre del sitio | `vandalit` |
| Nombre alternativo | `Van Dalit` |
| Ubicación | Valparaíso, Chile |
| Enlaces en `sameAs` | GitHub (`https://github.com/vandalit`) y Behance (`https://www.behance.net/vandalit`). Ninguna red social. |
| Keywords | No se usan como metaetiqueta. Se mantiene una lista interna de consultas objetivo en el CMS, para redactar títulos y textos. |
| Analítica | Ninguna por ahora. Google Search Console queda preparado (verificación configurable), sin scripts de terceros. |
| Rastreo | Permitido para buscadores y para asistentes de IA que citan fuentes. Configurable por bot desde el CMS. |

---

## 3. Limitaciones que el agente debe respetar

- **Canonical y `og:url` absolutos**, con la ruta completa `https://vandalit.github.io/portafolio/`. Cualquier URL relativa rompe la indexación en GitHub Pages.
- **Rutas de imagen absolutas** en metaetiquetas (`og:image`, `twitter:image`, favicon).
- **`robots.txt` y `sitemap.xml` en la raíz del sitio publicado**, es decir, `/portafolio/robots.txt` y `/portafolio/sitemap.xml`. El sitemap incluye ambas versiones de idioma.
- **Sin `X-Robots-Tag`.** Cualquier restricción de indexación se hace por `<meta name="robots">` o por `robots.txt`.
- **Redirecciones:** no hay redirecciones del servidor. Si una URL cambia, se mantiene la anterior como página mínima con `<link rel="canonical">` y, si es necesario, meta refresh.

---

## 4. Configuración editable desde el backoffice

El módulo SEO del Studio edita `content/settings/seo.json`. Todos los campos son editables; ninguno se hardcodea en el build.

```json
{
  "siteUrl": "https://vandalit.github.io/portafolio/",
  "siteName": "vandalit",
  "defaultLang": "es-CL",
  "languages": {
    "es-CL": {
      "path": "/",
      "title": "vandalit · Diseño de producto y desarrollo web",
      "description": "Diseño UX/UI y desarrollo front-end en Valparaíso, Chile. Casos, habilidades y experimentos en interacción espacial.",
      "htmlLang": "es-CL"
    },
    "en": {
      "path": "/en/",
      "title": "vandalit · Product design and web development",
      "description": "UX/UI design and front-end development from Valparaíso, Chile. Case studies, skills and spatial interaction experiments.",
      "htmlLang": "en"
    }
  },
  "person": {
    "name": "vandalit",
    "alternateName": "Van Dalit",
    "jobTitle": ["UX/UI Designer", "Front-end Developer"],
    "location": { "locality": "Valparaíso", "region": "Valparaíso", "country": "CL" },
    "sameAs": [
      "https://github.com/vandalit",
      "https://www.behance.net/vandalit"
    ]
  },
  "images": {
    "ogImage": "assets/images/og/home.png",
    "ogAlt": "Vista previa del portafolio de vandalit",
    "twitterCard": "summary_large_image"
  },
  "favicon": {
    "svg": "assets/icons/favicon.svg",
    "png32": "assets/icons/favicon-32.png",
    "png192": "assets/icons/icon-192.png",
    "png512": "assets/icons/icon-512.png",
    "appleTouchIcon": "assets/icons/apple-touch-icon.png",
    "themeColor": "#1e2327"
  },
  "robots": {
    "default": "allow",
    "bots": {
      "Googlebot": "allow",
      "Bingbot": "allow",
      "Google-Extended": "allow",
      "GPTBot": "allow",
      "ClaudeBot": "allow",
      "PerplexityBot": "allow",
      "CCBot": "disallow"
    }
  },
  "verification": {
    "googleSiteVerification": "",
    "bingSiteVerification": ""
  },
  "queries": {
    "note": "Consultas objetivo para redactar títulos y textos. No se publican en el HTML.",
    "es-CL": [],
    "en": []
  }
}
```

**Notas sobre los campos:**

- `person.sameAs` es editable, pero debe contener solo cuentas de vandalit. El agente rechaza cualquier URL de mindsurfer en el build.
- `robots.bots` define la política por crawler. El build genera `robots.txt` a partir de este objeto.
- `queries` es interno. Sirve para redactar y revisar títulos y textos, y no se renderiza.
- `verification` se inserta como metaetiqueta cuando tenga valor. Vacío significa que no se emite.

---

## 5. Requisitos de cada página

Cada versión de idioma (`/` y `/en/`) debe emitir en `<head>`:

- `<html lang="...">` con el valor de `htmlLang`.
- `<title>` y `<meta name="description">` según `seo.json`.
- `<link rel="canonical">` con la URL absoluta de la versión.
- `<link rel="alternate" hreflang="es-CL">`, `hreflang="en"` y `hreflang="x-default"` apuntando a `/`. Las dos versiones se declaran mutuamente.
- `<meta name="robots" content="index,follow">`.
- Open Graph: `og:type` (`profile`), `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image` con URL absoluta, `og:image:width` (1200), `og:image:height` (630), `og:image:alt`, `og:locale` (`es_CL` o `en_US`).
- Twitter card: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- Favicon: `<link rel="icon" type="image/svg+xml">`, `<link rel="icon" sizes="32x32">`, `<link rel="apple-touch-icon">` y `<link rel="manifest">` con sus iconos de 192 y 512.
- `<meta name="theme-color">` con el valor de `favicon.themeColor`.
- Un solo `<h1>` por página, con el nombre de la identidad y el posicionamiento.
- Encabezados en orden (`h2` para secciones, `h3` para tarjetas).
- Texto alternativo descriptivo en todas las imágenes, en el idioma de la página.
- Dimensiones declaradas en las imágenes (`width` y `height`).

---

## 6. JSON-LD

Un bloque `<script type="application/ld+json">` por página, generado en el build a partir de `seo.json` y de los JSON de contenido.

**Home (`WebSite` + `ProfilePage` + `Person`):**

- `WebSite`: `name`, `url`, `inLanguage`, `publisher` apuntando a la `Person`.
- `ProfilePage`: `mainEntity` apuntando a la `Person`, `dateModified` tomado de la fecha del último commit que modificó `content/`, `inLanguage`.
- `Person`: `name`, `alternateName`, `url`, `jobTitle`, `knowsAbout` (los nombres visibles de los ítems de habilidades con nivel confirmado), `alumniOf` (Universidad Técnica Federico Santa María, con el título "Ingeniería en Fabricación y Diseño Industrial, titulación en trámite"), `homeLocation` o `address` con la ubicación configurada, `sameAs` y `image`.

**Casos de estudio y clientes (dentro de la home):**

- `CreativeWork` por caso: `name`, `description`, `dateCreated` (año), `author` apuntando a la `Person`, `keywords` (tags visibles del caso), `url` con anchor (`/#casos`, `/#clientes`).

**Restricciones:**

- Todo valor del JSON-LD debe existir como texto visible en la página. El build falla si una propiedad no tiene correspondencia en el HTML.
- No usar `aggregateRating`, `review` ni otros tipos de reseñas.
- No incluir ítems de habilidades en estado "pendiente" o "por confirmar".

---

## 7. Imágenes de vista previa y favicon

- **`og:image` de la home:** 1200×630, PNG o JPG bajo 300 KB. Generada una vez y guardada en `assets/images/og/`. Declarada en `seo.json`.
- **Versión en inglés:** mismo archivo por defecto. Si se crea una variante, se declara `ogImage` por idioma.
- **Favicon:** SVG para navegadores modernos, PNG de 32×32 y `favicon.ico` de respaldo. Los iconos de 192 y 512 para el manifest.
- **Requisito de Google:** el favicon debe ser cuadrado y reconocible a 16 píxeles. Verificar la documentación vigente antes de publicar.
- **`manifest.webmanifest`** generado en el build, con `name`, `short_name`, `theme_color`, `background_color` e iconos. Las rutas son relativas al sitio.

---

## 8. Sitemap y robots

- **`sitemap.xml`** generado en el build, con las dos URLs de idioma (`/` y `/en/`), `lastmod` tomado de Git y `xhtml:link` para `hreflang`.
- **`robots.txt`** generado desde `seo.json.robots`:
  - `User-agent` por cada bot de la lista, con `Allow: /` o `Disallow: /`.
  - Una línea `Sitemap:` con la URL absoluta del sitemap.
  - Línea `default` para cualquier otro crawler.
- **`llms.txt`** generado desde los mismos JSON de contenido, en español e inglés, con la identidad, las habilidades confirmadas y los enlaces a casos y experimentos. Debe coincidir con lo que se ve en la página.

---

## 9. Validaciones del build

El build falla si ocurre cualquiera de estas condiciones:

- Falta `title`, `description`, `htmlLang` o `canonical` en alguna versión de idioma.
- La `description` tiene más de 160 caracteres o menos de 70.
- Una URL de `sameAs` no pertenece a la lista de identidades permitidas de vandalit.
- `ogImage` no existe, o no tiene 1200×630.
- Falta alguna versión del `hreflang` o la declaración no es recíproca.
- Una propiedad del JSON-LD no tiene correspondencia visible en el HTML.
- Hay URLs relativas en canonical, `og:url`, `og:image` o `hreflang`.
- Un ítem pendiente de confirmación aparece en el JSON-LD (`knowsAbout`).

---

## 10. Módulo SEO del backoffice

El Studio incluye una sección "SEO" con:

- Campos por idioma: título, descripción y `htmlLang`.
- Persona: nombre, nombre alternativo, puesto, ubicación y lista de `sameAs`, con validación de dominios.
- Imágenes: selector para `ogImage` con vista previa y dimensiones; advertencia si no es 1200×630.
- Favicon: selector de cada archivo, con vista previa.
- Política de rastreo: selector por bot con opciones permitir o bloquear, y un valor por defecto.
- Verificación: campos para Google y Bing.
- Consultas objetivo: lista por idioma, interna, sin publicación.
- Botón de validación que ejecuta las reglas de la sección 9 sin construir el sitio.

Los cambios se guardan en `seo.json`, igual que el resto del contenido. El flujo sigue siendo editar → revisar `git diff` → commit → push.

---

## 11. Criterios de aceptación

- [ ] `/portafolio/` y `/portafolio/en/` existen en el sitio publicado, con sus `lang`, `title` y `description`.
- [ ] Cada página declara `canonical`, `hreflang` recíproco y `x-default`.
- [ ] Open Graph y Twitter card completos, con imagen absoluta de 1200×630.
- [ ] Favicon, `apple-touch-icon` y manifest presentes y enlazados.
- [ ] `robots.txt` refleja la política de `seo.json`.
- [ ] `sitemap.xml` incluye ambas URLs de idioma.
- [ ] JSON-LD válido en ambas páginas, sin propiedades sin correspondencia visible.
- [ ] `sameAs` contiene solo GitHub y Behance de vandalit.
- [ ] Ningún valor SEO está escrito a mano en plantillas. Todo sale de `seo.json` o de los JSON de contenido.
- [ ] El módulo SEO del backoffice edita `seo.json` y pasa las validaciones antes de guardar.

---

## 12. Pendientes que confirma el autor

1. Copy final de `title` y `description` en ambos idiomas.
2. Imagen `og:image` de la home (crear y revisar).
3. Lista inicial de consultas objetivo por idioma.
4. Confirmar si `@vandalittt` se elimina del pie o se mantiene como enlace de contacto sin `sameAs`.
5. Política de rastreo por bot (la propuesta arriba es visibilidad total, con CCBot bloqueado).

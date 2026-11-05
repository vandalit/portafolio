# Arquitectura de contenido, build y despliegue

**Repositorio:** `vandalit/portafolio`
**Sitio:** https://vandalit.github.io/portafolio/
**Alcance:** flujo de edición local, composición HTML, generación estática y publicación en GitHub Pages.

## 1. Modelo de trabajo

```text
Studio local ──→ API Express local ──→ content/ (JSON + assets)
                                           │
                                  git commit + push
                                           │
                                           ▼
index.html (plantilla) + src/partials/ + content/
                                           │
                                    GitHub Actions
                                           │
                                      npm run build
                                           │
                                           ▼
                                       dist/
                                           │
                                 artefacto de Pages
                                           │
                                           ▼
                                    GitHub Pages
```

La fuente de contenido es `content/`. El Studio edita esos archivos en local; Git es el mecanismo de revisión, historial y publicación. El sitio desplegado es estático y no requiere Node ni una API en producción.

## 2. HTML fuente y parciales

- El `index.html` de la raíz es la **plantilla de composición**, no el documento que debe servirse al visitante. Sus comentarios `<!-- include:... -->` referencian las piezas de `src/partials/`.
- `build/assembler.js` resuelve esas referencias. `build/build.js` ensambla el HTML, prerenderiza los datos de contenido y escribe el documento final en `dist/index.html`.
- El build también genera `robots.txt`, `sitemap.xml` y `llms.txt`, y copia a `dist/` los recursos requeridos (`src/`, `assets/`, `content/`, `backoffice/` y demos).
- `dist/` es un artefacto generado, está excluido de Git y no debe editarse manualmente.
- El JavaScript del navegador conserva las interacciones y la mejora progresiva; los contenidos principales también quedan en el HTML prerenderizado.

**Regla de publicación:** no configurar Pages para servir `main:/`. Esa ruta contiene la plantilla con `include:`, que Pages no procesa. La salida pública es `dist/`.

## 3. Build y publicación

El workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) define el único flujo de publicación previsto:

1. Se dispara en `push` a `main` o manualmente.
2. Instala dependencias con `npm ci`.
3. Ejecuta `npm run build`.
4. Sube `./dist` como artefacto de Pages.
5. Publica el artefacto con `actions/deploy-pages`.

La configuración del repositorio en **Settings → Pages → Build and deployment → Source** debe ser **GitHub Actions**. No debe coexistir con **Deploy from a branch (`main` / `/`)**: esa modalidad publica el `index.html`-plantilla y puede competir con el artefacto generado.

Un workflow verde demuestra que ese workflow construyó y publicó su artefacto; no sustituye la verificación de la fuente configurada en Pages ni de la respuesta pública. Tras desplegar, comprobar que la URL devuelve HTML completo y que existen `/robots.txt`, `/sitemap.xml` y `/llms.txt`.

**Estado verificado el 3 de noviembre de 2026:** la API de Pages informa `build_type: workflow`, el último workflow `Deploy to GitHub Pages` terminó exitosamente y la URL pública devuelve un documento HTML completo, no las directivas `include:`. Esta comprobación confirma que la ruta de publicación por Actions está activa actualmente.

## 4. CMS híbrido: local frente a web

### Local

1. Ejecutar `npm run dev`.
2. Abrir `http://localhost:3000/backoffice/`.
3. El Backoffice detecta `/api/status` y usa el backend Express local para leer/escribir datos y subir archivos a `content/`.
4. Revisar `git diff`, ejecutar `npm run build` para validar y previsualizar `dist/`.
5. Hacer commit y push de los cambios fuente; no versionar `dist/`.

### Producción

- GitHub Pages sirve archivos estáticos. No ejecuta `server.js`, no tiene API de escritura ni acceso al disco del repositorio.
- El Backoffice puede estar incluido como interfaz estática en `dist/`, pero la edición física y la subida están deshabilitadas fuera de `localhost`. El modo web permite borradores/exportación local; esos cambios no modifican el repositorio ni se publican automáticamente.
- Para publicar contenido editado, usar el Studio local y el flujo Git descrito arriba.

## 5. Estación de scroll de Cases V5

Cases V5 implementa una estación piloto de aproximadamente **400 px efectivos** en escritorio. El tablero se fija (`position: sticky`) bajo el navbar y se libera al terminar el recorrido. Mientras está fijado, el rótulo contextual junto al logo cambia a lima; el tab «CASES» no recibe ese estado. La estación se desactiva en móvil, pero se mantiene en escritorio aunque el tablero supere el alto disponible para permitir revisar y ajustar los elementos que quedan bajo el pliegue. V4 permanece como implementación independiente de referencia.

La duración se controla con `--cv5-station-length` en `src/css/cases-v5.css`; el runway compensa 1 px para el límite de sticky. `src/js/main.js` calcula el estado fijado y activa la clase solo en `#nav-context-text`. En escritorio, la fila inferior organiza el carrusel compacto, una columna central con navegación/aguja/contador y el carrusel ancho; la columna compacta mide una tarjeta más el padding del track y la columna derecha ocupa el espacio restante. Las barras de la aguja son más cortas. En móvil, el compacto y la aguja se ocultan y los controles pasan bajo el carrusel ancho. El estilo contextual está en `src/css/layout.css` y el runway en `src/partials/cases-v5.html`. Es un patrón piloto: cada nueva estación requiere definir por separado anclaje, duración y componente contextual.

## 6. Estructura relevante

```text
index.html                 # Plantilla de composición; no publicar directamente
src/partials/              # Fragmentos HTML fuente
content/                   # Fuente de contenido: JSON y medios
build/                     # Ensamblador y generador SSG
dist/                      # Sitio generado; ignorado por Git; artefacto Pages
server.js                  # Backend del CMS local, no disponible en Pages
backoffice/                # Interfaz del Studio; escritura solo en entorno local
.github/workflows/deploy.yml
```

## 7. Verificación de aceptación

- `npm run build` termina correctamente y genera `dist/index.html` completo, sin directivas `include:`.
- El HTML de `dist/` contiene el contenido prerenderizado y las rutas necesarias funcionan bajo `/portafolio/`.
- `dist/` no está versionado.
- Pages tiene seleccionada la fuente **GitHub Actions**, y el workflow publica el artefacto `./dist`.
- La respuesta publicada contiene HTML completo sin ejecutar JavaScript; los archivos SEO generados están disponibles.
- El Backoffice no puede escribir archivos ni subir medios en el sitio público.

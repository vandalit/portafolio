# Plan de Remediación: Separación Estricta Entorno Local vs. Web Pública (GitHub Pages)

**Fecha:** Octubre 2026  
**Objetivo:** Eliminar de raíz la contaminación de rutas locales (`localhost:3000`) en el repositorio, erradicar cualquier alerta de permisos de red/dispositivo en navegadores y bloquear de forma estricta las capacidades de escritura del Backoffice cuando se ejecute en la web pública desplegada.

---

## 1. Diagnóstico del Problema

1. **Contaminación de Datos en JSON:**  
   Al interactuar con el formulario del Backoffice, se guardaron URLs absolutas con el prefijo `http://localhost:3000/content/...` dentro de los campos `cover`, `coverPlaceholder` y `gallery` en:
   * `content/case-studies/syzygy/project.json`
   * `content/case-studies/kaktus/project.json`
   * `content/lab/afk/project.json`
2. **Consecuencia en Producción (GitHub Pages):**  
   Al desplegarse en `https://vandalit.github.io/portafolio/`, el navegador interpreta que un sitio público HTTPS intenta acceder a la red privada del cliente (`http://localhost:3000`). La política de seguridad **Private Network Access (PNA)** de Chrome bloquea la carga de la imagen y dispara la alerta del sistema operativo: *"vandalit.github.io solicita acceso a dispositivos en tu red local"*. En móviles, donde no existe tal servidor corriendo, la imagen falla de inmediato.
3. **Ambigüedad en el Backoffice Web:**  
   El Backoffice desplegado en GitHub Pages no debe intentar conectarse a servidores locales ni solicitar acceso a carpetas del sistema. Debe operar exclusivamente en modo solo lectura con un aviso visual claro.

---

## 2. Plan de Ejecución por Etapas

### Etapa 1: Saneamiento de Datos (`content/`)
* Limpiar todos los archivos `project.json` contaminados.
* Reemplazar cualquier URL con `http://localhost:3000/...` por el nombre relativo y portable del asset (ej: `ondas-ne--n-sobre-panel-oscuro.png` o `gallery/ondas-ne--n-sobre-panel-oscuro.png`).
* Verificar que los archivos físicos correspondientes existan en su carpeta de proyecto (`./content/case-studies/syzygy/`, `./content/case-studies/kaktus/`, `./content/lab/afk/`).

### Etapa 2: Blindaje del Motor de Build SSG (`build/build.js`)
* Implementar normalización relativa estricta: anteponer siempre `./content/<seccion>/<slug>/` a las rutas de imágenes relativas al generar `dist/index.html`.
* Añadir una regla de validación en el proceso de build (`validateContent`): si cualquier proyecto contiene `localhost` o `127.0.0.1` en sus rutas, el build debe fallar con error descriptivo impidiendo la compilación para producción.

### Etapa 3: Bloqueo de Edición y Persistencia en Web (`backoffice/`)
* **Detección de entorno:** Verificar si el host es local (`localhost` o `127.0.0.1`).
* **En entorno Web desplegado (`vandalit.github.io`):**
  * Ocultar o deshabilitar botones de escritura física: *"Guardar en Disco"*, *"Conectar Carpeta Local"*, *"Subir Imagen"*, *"Mover a..."* y *"Eliminar"*.
  * Mostrar un banner persistente destacado:  
    `🔒 Modo Solo Lectura: La edición, subida de archivos y persistencia en repositorio están disponibles únicamente en entorno local (npm run dev).`
  * Desactivar cualquier invocación a File System Access API (`showDirectoryPicker`) en producción para nunca pedir permisos de dispositivo.
* **En entorno Local (`npm run dev`):**
  * Sanitizar automáticamente en tiempo real los inputs de portada y galería: si alguien pega o entra una ruta con `http://localhost:3000/...`, se recorta automáticamente dejando solo el nombre relativo del archivo.

### Etapa 4: Compilación y Verificación
* Ejecutar `npm run build`.
* Auditar que en `dist/index.html` y `dist/content/` no exista ni una sola ocurrencia de `localhost`.
* Comprobar que todas las imágenes apunten a rutas relativas portables que funcionen tanto en local como en GitHub Pages y en cualquier navegador móvil o desktop.

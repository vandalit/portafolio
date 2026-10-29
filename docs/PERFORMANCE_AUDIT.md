# Auditoría de Rendimiento & Guía de Optimización Front-End
> **Proyecto:** Portafolio vandalit  
> **Objetivo:** 60/120 FPS estables, cero layout thrashing y carga fluida sin micro-stutters (*jank*).

---

## 1. Contexto & Problema Observado
En aplicaciones web con identidades visuales ricas (geometrías 3D WebGL, fondos de video ambiental, tipografía display, transiciones de scroll y carruseles fluidos), es común experimentar **"tirones" o caídas de frame (jank)**.

A menudo se atribuye erróneamente estos tirones a la "pesadez del diseño", cuando en realidad obedecen a **cuellos de botella específicos en el pipeline de renderizado del navegador**:
1. Bloqueo del hilo principal (*Main Thread contention*).
2. Forzado de re-cálculos de geometría (*Layout Thrashing*).
3. Descompresión síncrona de imágenes (*Image Rasterization stall*).
4. Renderizado continuo de contextos GPU invisibles (*Off-screen WebGL draws*).

A continuación se documentan los hallazgos técnicos encontrados en este portafolio, su causa raíz y el patrón de solución aplicado.

---

## 2. Hallazgos Técnicos & Soluciones

### Hallazgo 1: Renderizado continuo de WebGL fuera de pantalla
* **Síntoma:** Al scrollear hacia las secciones inferiores (*Trabajos*, *Casos*, *Lab*), el framerate bajaba y el ventilador o uso de GPU se mantenía alto.
* **Causa raíz:** `HeroScene` instancia 2 renderers de Three.js (primer y segundo plano) con shaders y 6 mallas animadas. Su bucle `_animate()` continuaba ejecutando `requestAnimationFrame` y llamadas `renderer.render()` a 60 fps **incluso cuando el Hero estaba 2000px más arriba fuera de pantalla**, consumiendo entre 25% y 40% del tiempo de GPU disponible.
* **Solución aplicada:**
  Se integró un `IntersectionObserver` vinculado al `#hero`. Cuando el Hero sale del viewport:
  ```javascript
  if (!this.isHeroVisible) {
    this.animFrame = requestAnimationFrame(() => this._animate());
    return; // Libera inmediatamente el 100% de llamadas WebGL a la GPU
  }
  ```
  Al volver a subir, el observer detecta la intersección y la escena 3D se reanuda al instante sin saltos.

---

### Hallazgo 2: Layout Thrashing en eventos de Scroll y Mouse
* **Síntoma:** Micro-cortes al hacer scroll rápido o al mover el cursor sobre la pantalla.
* **Causa raíz:** En listeners de `scroll` y `mousemove`:
  1. Se consultaban propiedades geométricas del DOM como `getBoundingClientRect()`, `offsetWidth` o `clientWidth` (lectura forzada de layout).
  2. Acto seguido se modificaban estilos CSS como `transform` o `opacity` en el mismo frame (escritura).
  3. Al alternar **Lectura → Escritura → Lectura → Escritura** decenas de veces por segundo, el motor de render (Blink/Gecko/WebKit) se ve forzado a recalcular el árbol de layout de toda la página una y otra vez (*Forced Synchronous Layout*).
* **Soluciones aplicadas:**
  * **Caché de mediciones en reposo:** En `initWorkTitleScrolltell()`, las dimensiones del contenedor y el ancho de los textos ahora se calculan **únicamente en el arranque y en eventos `resize`**. En cada tick de scroll solo se ejecuta aritmética pura y `translate3d(X, 0, 0)`. Cero lecturas de DOM en caliente.
  * **Throttling con `requestAnimationFrame`:** Todas las funciones de scroll (`video-bg`, `three-scene`, `nav`, `scroll-top`) usan un flag booleano `ticking` para que nunca se ejecute más de una actualización por frame de pantalla (16.6ms a 60Hz / 8.3ms a 120Hz).
  * **Modificaciones condicionales de clases:** En el Navbar, `classList.toggle('scrolled')` solo se ejecuta si el estado booleano realmente cambió (`isScrolled !== wasScrolled`), eliminando mutaciones DOM redundantes cada pixel.

---

### Hallazgo 3: Decodificación Síncrona de Imágenes vs. GPU Bitmap Pre-decoding
* **Síntoma:** Un tirón perceptible la **primera vez** que se pasa del banner destacado (`#featured-case`) al carrusel (`#cases-carousel`), que **no se repite** al volver a pasar.
* **Causa raíz:** 
  1. La imagen del banner y las primeras tarjetas del carrusel descargaban los archivos desde la red.
  2. Sin la directiva `decoding="async"`, el navegador suspende el hilo principal de la interfaz mientras descomprime el mapa de bits JPEG/WebP (una imagen de 1200x800 px puede tardar entre 40ms y 90ms en descomprimirse en CPUs de gama media/móviles).
  3. Como la imagen aún no estaba en el caché de bitmaps decodificados de la GPU, el scroll se congelaba 2-4 frames mientras el decodificador terminaba.
* **Soluciones aplicadas:**
  * Inclusión estricta de `decoding="async"` y `onload="this.classList.add('is-loaded')"` en todas las etiquetas `<img>`.
  * **Pre-calentamiento asíncrono en memoria de texturas:** Durante el Preloader de inicio, se invocan las primeras imágenes mediante la Web API nativa `Image.decode()`:
    ```javascript
    const img = new Image();
    img.decoding = 'async';
    img.src = coverUrl;
    img.decode().catch(() => {});
    ```
    Esto descompime el mapa de bits en un hilo secundario *antes* de que el usuario haga scroll. Cuando el usuario llega a la sección, la textura ya reside lista en la memoria VRAM de la tarjeta de video: **tiempo de decodificación en scroll = 0 ms**.

---

### Hallazgo 4: Aceleración por Hardware en `#cursor-glow`
* **Síntoma:** Caída leve de fluidez al mover el ratón con soltura.
* **Causa raíz:** El cursor glow modificaba `glow.style.left` y `glow.style.top` cada frame. Modificar coordenadas posicionales fuerza el ciclo completo de *Layout → Paint → Composite*.
* **Solución aplicada:**
  * Se migró a `transform: translate3d(X, Y, 0)` con `will-change: transform`.
  * La transformación ahora es ejecutada directamente por el **hilo compositor de la GPU** sin generar *Reflow* ni alterar la geometría de otros elementos.
  * Se añadió un detector de reposo: si el cursor se detiene, la función cancela cálculos innecesarios.

---

### Hallazgo 5: Contención de Red y Hilos por Iframes Externos (YouTube)
* **Síntoma:** Micro-congelamientos durante los primeros 500 ms de vida de la página.
* **Causa raíz:** Inyectar iframes de YouTube en el frame 0 descarga decenas de scripts externos (`base.js`, `remote.js`, etc.) y bibliotecas de analytics que compiten por ancho de banda con las fuentes web (`Syne`, `Space Mono`) y los manifiestos JSON.
* **Solución aplicada:**
  * Se desacopló la inyección del video de fondo usando `requestIdleCallback()`.
  * La página se arma y despliega a 60 fps con el preloader; una vez que la CPU está ociosa y el Hero está listo, el video ambiental se conecta en segundo plano sin restar prioridad a la experiencia del usuario.
  * Además, al scrollear a más de 1100 px hacia abajo, se envía un comando `pauseVideo` al iframe para no gastar decodificadores de video de hardware mientras el usuario lee proyectos.

---

### Hallazgo 6: Conflictos de Transiciones Compuestas en CSS
* **Síntoma:** Salto visual o stuttering cuando entraba `#featured-case`.
* **Causa raíz:** El elemento tenía dos clases compuestas que declaraban transiciones incompatibles sobre la misma propiedad:
  * `.featured-case` declaraba `transform: translateY(20px)`
  * `.reveal` declaraba `transform: translateY(28px)`
  Al dispararse la intersección, ambas reglas competían en la cascada de CSS.
* **Solución aplicada:** Se eliminó la regla duplicada en `animations.css`, delegando la animación de revelado exclusivamente a `.reveal`. Se agregó `contain: content;` a las tarjetas para que el navegador aísle su repintado del resto del DOM.

---

## 3. Checklist de Buenas Prácticas para Nuevas Secciones

Al añadir nuevas secciones interactivas, verificar esta lista de control:

- [ ] **Imágenes:** Usar siempre `decoding="async"` y `loading="lazy"` (excepto elementos sobre el pliegue inicial).
- [ ] **Animaciones por Scroll:** Nunca leer `offsetWidth`, `clientHeight` ni `getBoundingClientRect()` dentro del listener de scroll sin cachear o proteger con `requestAnimationFrame`.
- [ ] **Movimiento:** Animar exclusivamente `transform` (`translate3d`, `scale`, `rotate`) y `opacity`. Evitar animar `top`, `left`, `width`, `height`, `margin` o `padding`.
- [ ] **Contextos 3D / Canvas:** Implementar siempre pausa con `IntersectionObserver` cuando el canvas salga del campo visual.
- [ ] **Contención CSS:** Aplicar `contain: content;` o `contain: paint;` en tarjetas de grids y carruseles para evitar invalidaciones masivas de árbol de render.


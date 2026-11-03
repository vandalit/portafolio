/* ==========================================================
   THREE-SCENE.JS — Hero 3D Sandwich (Cel-Shading & Edges)
   Capa 2 Dinámica:
   - sceneBack -> canvasBack (z-index: 11)
   - Bento HTML container (z-index: 12)
   - sceneFront -> canvasFront (z-index: 14)
   ========================================================== */

import * as THREE from '../vendor/three.module.js';
import { bentoManager } from '../components/bentos/bento-manager.js';

console.log('%c[HeroScene] module loaded | THREE revision:', 'color: #e8306e; font-weight: bold;', THREE.REVISION);

export class HeroScene {
  /**
   * @param {HTMLElement|Object} canvases - Un canvas único o un objeto { canvasBack, canvasFront }
   * @param {Object} [manager] - Instancia de BentoManager
   */
  constructor(canvases, manager = null) {
    this.three = THREE;
    this.bentoManager = manager || (typeof window !== 'undefined' ? window.__bentoManagerInstance : null) || bentoManager;

    if (canvases instanceof HTMLElement) {
      this.canvasBack = canvases;
      this.canvasFront = null;
    } else if (canvases && typeof canvases === 'object') {
      this.canvasBack = canvases.canvasBack || canvases.back || null;
      this.canvasFront = canvases.canvasFront || canvases.front || null;
    } else {
      this.canvasBack = document.getElementById('three-canvas-back');
      this.canvasFront = document.getElementById('three-canvas-front');
    }

    this.rendererBack = null;
    this.rendererFront = null;
    this.sceneBack = null;
    this.sceneFront = null;
    this.camera = null;
    this.objects = [];
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    this.scrollProgress = 0;
    this.animFrame = null;
    this.initialized = false;
    this.paused = false;
    this._firstRenderLogged = false;
    this.geometryTextures = [];
    this.destroyed = false;

    console.log('[HeroScene] Constructor instantiated with canvasBack:', this.canvasBack, 'canvasFront:', this.canvasFront);
  }

  init() {
    console.log('%c[HeroScene] init() starting with Sandwich layering...', 'color: #e8306e; font-weight: bold;');
    try {
      this._setup();
      this._createGeometries();
      this._bindEvents();
      this._animate();
      this.initialized = true;
      console.log('%c[HeroScene] Three.js dual-scene Sandwich successfully initialized!', 'background: #b8e030; color: #080810; font-weight: bold; padding: 2px 6px; border-radius: 3px;');
    } catch (e) {
      console.error('%c[HeroScene] Three.js init FAILED with exception:', 'background: red; color: white; font-weight: bold; padding: 4px 8px; border-radius: 3px;', e);
    }
  }

  _createRenderer(canvas, label) {
    if (!canvas) return null;
    const width = window.innerWidth;
    const height = window.innerHeight;

    let renderer = null;
    const webglOptions = {
      canvas,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true, // Evita que Brave/Windows ANGLE descarte el buffer del canvas
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false, // Permite renderizar incluso si Brave o el SO usa emulación de GPU por privacidad
    };

    try {
      renderer = new THREE.WebGLRenderer({ ...webglOptions, antialias: true });
      console.log(`[HeroScene] WebGLRenderer (${label}) creado con antialias: true`);
    } catch (errAntialias) {
      console.warn(`[HeroScene] Falló antialias en ${label}, reintentando modo compatible...`, errAntialias);
      try {
        renderer = new THREE.WebGLRenderer({ ...webglOptions, antialias: false });
        console.log(`[HeroScene] WebGLRenderer (${label}) creado en modo fallback antialias: false`);
      } catch (errFallback) {
        console.error(`%c[HeroScene] WebGL bloqueado en ${label} (posible Brave Shield / Farbling o aceleración deshabilitada):`, 'color: orange; font-weight: bold;', errFallback);
        return null;
      }
    }

    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
    }
    return renderer;
  }

  _addLightsToScene(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    // Neutral key light keeps the toon shading monochromatic.
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);

    // Soft graphite fill preserves detail in the darker faces.
    const fillLight = new THREE.DirectionalLight(0xd8dce2, 1.4);
    fillLight.position.set(-6, -3, 4);
    scene.add(fillLight);

    // Neutral rim light adds a restrained silver edge.
    const backLight = new THREE.DirectionalLight(0xaeb4bd, 0.8);
    backLight.position.set(0, -6, -4);
    scene.add(backLight);
  }

  _setup() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    console.log('[HeroScene] Viewport dimensions:', width, 'x', height, '| DPR:', window.devicePixelRatio);

    // 1. Renderers para capas sandwich
    this.rendererBack = this._createRenderer(this.canvasBack, 'Back Canvas [z:11]');
    if (this.canvasFront) {
      this.rendererFront = this._createRenderer(this.canvasFront, 'Front Canvas [z:14]');
    }

    // 2. Escenas separadas con fallback inteligente:
    // Si Brave o el navegador bloquea el segundo contexto WebGL, unificamos todo en sceneBack
    this.sceneBack = new THREE.Scene();
    this._addLightsToScene(this.sceneBack);

    if (this.rendererFront) {
      this.sceneFront = new THREE.Scene();
      this._addLightsToScene(this.sceneFront);
    } else {
      // Fallback: si no hay rendererFront, sceneFront apunta a sceneBack
      this.sceneFront = this.sceneBack;
      console.log('[HeroScene] Modo fallback mono-canvas activo: todas las geometrías renderizadas en sceneBack.');
    }

    // 3. Cámara compartida con perspectiva cinemática
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    console.log('[HeroScene] Camera and scenes initialized successfully.');
  }

  _createMesh(targetScene, geometry, faceColor, edgeColor, pos, scale = 1) {
    const THREE = this.three;
    const group = new THREE.Group();

    // Cel-shaded / Toon face material
    const mat = new THREE.MeshToonMaterial({
      color: new THREE.Color(faceColor),
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    group.add(mesh);

    // Ink outlines con EdgesGeometry
    const edges = new THREE.EdgesGeometry(geometry, 15);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(edgeColor),
      transparent: true,
      opacity: 0.95,
      linewidth: 2,
    });
    const outline = new THREE.LineSegments(edges, lineMat);
    group.add(outline);

    group.position.set(...pos);
    group.scale.setScalar(scale);

    group.userData = {
      basePosition: [...pos],
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: 0.4 + Math.random() * 0.4,
      rotSpeedX: (Math.random() - 0.5) * 0.008,
      rotSpeedY: (Math.random() - 0.5) * 0.012,
      rotSpeedZ: (Math.random() - 0.5) * 0.006,
      mat,
      lineMat,
    };

    targetScene.add(group);
    this.objects.push(group);
    return group;
  }

  async _loadGeometryFaceTextures() {
    const THREE = this.three;
    const manifestUrl = './content/geometry-textures/index.json';

    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      const images = manifest.images;
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error('The texture library does not contain any images.');
      }

      const size = Math.max(64, Math.min(1024, Number(manifest.textureSize) || 512));
      const appearance = manifest.appearance || {};
      const textureLoader = new THREE.TextureLoader();
      const textures = await Promise.all(images.map(async (image) => {
        if (!image.id || !image.file || image.file.includes('..')) {
          throw new Error(`Invalid texture entry: ${JSON.stringify(image)}`);
        }

        const source = await new Promise((resolve, reject) => {
          textureLoader.load(
            new URL(image.file, new URL(manifestUrl, window.location.href)).href,
            resolve,
            undefined,
            reject
          );
        });
        if (this.destroyed) {
          source.dispose();
          return null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          source.dispose();
          throw new Error('Could not create a 2D context for geometry texture processing.');
        }

        const imageAspect = source.image.width / source.image.height;
        const cropWidth = imageAspect > 1 ? source.image.height : source.image.width;
        const cropHeight = imageAspect > 1 ? source.image.height : source.image.width;
        const cropX = (source.image.width - cropWidth) / 2;
        const cropY = (source.image.height - cropHeight) / 2;
        context.drawImage(source.image, cropX, cropY, cropWidth, cropHeight, 0, 0, size, size);
        source.dispose();

        const pixels = context.getImageData(0, 0, size, size);
        const configuredBrightness = Number(appearance.brightness);
        const configuredContrast = Number(appearance.contrast);
        const configuredOverlayOpacity = Number(appearance.overlayOpacity);
        const brightness = Number.isFinite(configuredBrightness) ? Math.max(0, Math.min(1.5, configuredBrightness)) : 0.72;
        const contrast = Number.isFinite(configuredContrast) ? Math.max(0, Math.min(2, configuredContrast)) : 0.68;
        const overlayOpacity = Number.isFinite(configuredOverlayOpacity) ? Math.max(0, Math.min(1, configuredOverlayOpacity)) : 0.38;
        const overlayHex = /^#[\da-f]{6}$/i.test(appearance.overlayColor) ? appearance.overlayColor.slice(1) : '080a0e';
        const overlayR = parseInt(overlayHex.slice(0, 2), 16);
        const overlayG = parseInt(overlayHex.slice(2, 4), 16);
        const overlayB = parseInt(overlayHex.slice(4, 6), 16);

        for (let index = 0; index < pixels.data.length; index += 4) {
          const luminance = appearance.grayscale === false
            ? (pixels.data[index] + pixels.data[index + 1] + pixels.data[index + 2]) / 3
            : pixels.data[index] * 0.2126 + pixels.data[index + 1] * 0.7152 + pixels.data[index + 2] * 0.0722;
          const tone = Math.max(0, Math.min(255, ((luminance - 128) * contrast + 128) * brightness));
          pixels.data[index] = tone * (1 - overlayOpacity) + overlayR * overlayOpacity;
          pixels.data[index + 1] = tone * (1 - overlayOpacity) + overlayG * overlayOpacity;
          pixels.data[index + 2] = tone * (1 - overlayOpacity) + overlayB * overlayOpacity;
        }
        context.putImageData(pixels, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this.geometryTextures.push(texture);
        return { id: image.id, texture };
      }));

      if (this.destroyed) return;
      const availableTextures = textures.filter(Boolean);
      if (availableTextures.length === 0) return;

      this.objects.forEach((group, geometryIndex) => {
        const mesh = group.children.find((child) => child.isMesh);
        if (!mesh) return;
        const geometry = mesh.geometry;
        const materials = availableTextures.map(({ texture }) => new THREE.MeshToonMaterial({
          color: 0xffffff,
          map: texture,
          transparent: true,
          opacity: 0.92,
        }));

        if (!geometry.index) {
          const uv = geometry.attributes.uv;
          geometry.clearGroups();
          for (let vertex = 0; vertex < uv.count; vertex += 3) {
            uv.setXY(vertex, 0, 0);
            uv.setXY(vertex + 1, 1, 0);
            uv.setXY(vertex + 2, 0.5, 1);
            const faceIndex = vertex / 3;
            const materialIndex = this._stableTextureIndex(geometryIndex, faceIndex, availableTextures.length, manifest.seed);
            geometry.addGroup(vertex, 3, materialIndex);
          }
          uv.needsUpdate = true;
        } else if (geometry.groups.length) {
          geometry.groups.forEach((face, faceIndex) => {
            face.materialIndex = this._stableTextureIndex(geometryIndex, faceIndex, availableTextures.length, manifest.seed);
          });
        } else {
          geometry.clearGroups();
          const indexCount = geometry.index.count;
          for (let vertex = 0; vertex < indexCount; vertex += 3) {
            const faceIndex = vertex / 3;
            const materialIndex = this._stableTextureIndex(geometryIndex, faceIndex, availableTextures.length, manifest.seed);
            geometry.addGroup(vertex, 3, materialIndex);
          }
        }

        mesh.material.dispose();
        mesh.material = materials;
        group.userData.mat = null;
        group.userData.surfaceMats = materials;
      });
    } catch (error) {
      this.geometryTextures.forEach((texture) => texture.dispose());
      this.geometryTextures = [];
      console.error('[HeroScene] Could not load geometry texture library.', error);
    }
  }

  _stableTextureIndex(geometryIndex, faceIndex, textureCount, seed = '') {
    let hash = 2166136261;
    const key = `${seed}:${geometryIndex}:${faceIndex}`;
    for (let index = 0; index < key.length; index++) {
      hash ^= key.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % textureCount;
  }

  _createGeometries() {
    const THREE = this.three;
    console.log('[HeroScene] Distributing 3D geometries between Back [z:11] and Front [z:14] scenes...');

    // ── SCENE BACK (z-index: 11 - detrás del Bento HTML) ─────────
    // 1. Large Icosahedron — center-left, graphite with a bright outline
    this._createMesh(
      this.sceneBack,
      new THREE.IcosahedronGeometry(1.5, 0),
      '#41464e', '#f3f4f6',
      [-3.0, 0.2, -0.5], 1.0
    );

    // 2. Box — lower left floating
    this._createMesh(
      this.sceneBack,
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      '#22262c', '#bfc5ce',
      [-2.0, -2.4, -1.0], 0.85
    );

    // 3. Dodecahedron — deep right background
    this._createMesh(
      this.sceneBack,
      new THREE.DodecahedronGeometry(1.3, 0),
      '#343941', '#e1e5ea',
      [2.0, -3.0, -3.0], 0.9
    );

    // ── SCENE FRONT (z-index: 14 - por delante del Bento HTML) ──
    const frontScene = this.sceneFront || this.sceneBack;

    // 4. Octahedron — upper right, mid graphite with a white outline
    this._createMesh(
      frontScene,
      new THREE.OctahedronGeometry(1.2, 0),
      '#4a5058', '#ffffff',
      [3.6, 1.8, -0.5], 1.0
    );

    // 5. Tetrahedron — lower right, obsidian with a silver outline
    this._createMesh(
      frontScene,
      new THREE.TetrahedronGeometry(1.1, 0),
      '#2b3037', '#d5dae1',
      [4.2, -1.8, 0.5], 1.0
    );

    // 6. Small Icosahedron — top left floating
    this._createMesh(
      frontScene,
      new THREE.IcosahedronGeometry(0.7, 0),
      '#3a4048', '#f7f8fa',
      [-4.2, 2.5, 0.5], 0.9
    );

    this._loadGeometryFaceTextures();

    console.log(`[HeroScene] Total 3D objects instantiated: ${this.objects.length} (3 in Back, 3 in Front).`);
  }

  _bindEvents() {
    this.isHeroVisible = true;

    // Observador para pausar el renderizado 3D cuando el Hero no es visible en pantalla
    const heroEl = document.getElementById('hero') || document.getElementById('hero-scroll-container');
    if (heroEl && 'IntersectionObserver' in window) {
      const heroObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isHeroVisible = entry.isIntersecting;
        });
      }, { threshold: 0 });
      heroObs.observe(heroEl);
    }

    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('resize', () => this._onResize());

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 850 && !this.isHeroVisible) return;

      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          scrollTicking = false;
          const container = document.getElementById('hero-scroll-container') || document.getElementById('hero');
          if (!container) return;
          const rect = container.getBoundingClientRect();
          const scrolled = Math.max(0, -rect.top);
          // Rango de scrolltelling: 600px
          const progress = Math.min(1, scrolled / 600);
          this.scrollProgress = progress;

          // 1. Matizado rápido de la Capa 3 (overlay de contraste) en los primeros 180px
          const contrastOverlay = document.getElementById('hero-layer-contrast') || document.getElementById('hero-contrast-overlay');
          if (contrastOverlay) {
            contrastOverlay.style.opacity = Math.max(0, 1 - (scrolled / 180));
          }

          // 2. Transición del Bento Frame modular (Capa 2.b, z-index: 12)
          const bm = this.bentoManager || (typeof window !== 'undefined' ? window.__bentoManagerInstance : null) || bentoManager;
          if (bm && typeof bm.updateScroll === 'function') {
            bm.updateScroll(progress, scrolled);
          }

          // 3. Reacción visual del contenido tipográfico (Capa 4, z-index: 21)
          const heroContent = document.getElementById('hero-layer-content') || document.querySelector('.hero__content');
          if (heroContent) {
            const textProgress = Math.max(0, (scrolled - 180) / 420);
            heroContent.style.opacity = Math.max(0, 1 - textProgress * 1.4);
            heroContent.style.transform = `translate3d(0, ${-textProgress * 45}px, 0)`;
          }

          const scrollIndicator = document.querySelector('.hero__scroll');
          if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(0, 1 - progress * 2.5);
          }

          // 4. Doodles vectoriales (Capa 2.d, z-index: 15)
          const heroDoodles = document.querySelectorAll('.hero__doodle');
          heroDoodles.forEach((d, i) => {
            const factor = (i + 1) * 28;
            d.style.transform = `translate3d(0, ${-progress * factor}px, 0) scale(${1 + progress * 0.15})`;
            d.style.opacity = Math.max(0, 1 - progress * 1.3);
          });
        });
      }
    }, { passive: true });

    console.log('[HeroScene] Mouse and 600px scroll event listeners bound.');
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    if (this.rendererBack) this.rendererBack.setSize(width, height);
    if (this.rendererFront) this.rendererFront.setSize(width, height);
  }

  _animate() {
    const t = performance.now() * 0.001;

    // Inercia de mouse
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    const sp = this.scrollProgress; // 0.0 a 1.0 en 600px

    // Cámara compartida reacciona al mouse y se profundiza con el scroll
    this.camera.position.x = this.mouse.x * 1.5 * (1 - sp * 0.5);
    this.camera.position.y = this.mouse.y * 1.0 * (1 - sp * 0.5) - sp * 0.7;
    this.camera.position.z = 9 + sp * 3.0;
    this.camera.lookAt(0, -sp * 0.5, 0);

    // Animación de rotación y flotación de objetos
    this.objects.forEach((obj, idx) => {
      const { floatPhase, floatSpeed, rotSpeedX, rotSpeedY, rotSpeedZ, basePosition } = obj.userData;

      const spinBoost = 1 + sp * 3.5;
      obj.rotation.x += rotSpeedX * spinBoost;
      obj.rotation.y += rotSpeedY * spinBoost;
      obj.rotation.z += rotSpeedZ * spinBoost;

      const expandDir = idx % 2 === 0 ? 1 : -1;
      const targetX = basePosition[0] + expandDir * sp * 2.2;
      const targetY = basePosition[1] + (idx > 2 ? -1 : 1) * sp * 1.4;
      const targetZ = basePosition[2] + sp * 1.8;

      obj.position.x = targetX + Math.cos(t * floatSpeed * 0.8 + floatPhase) * 0.2;
      obj.position.y = targetY + Math.sin(t * floatSpeed + floatPhase) * 0.35;
      obj.position.z = targetZ;

      if (obj.userData.mat) {
        obj.userData.mat.opacity = Math.max(0.1, 0.92 - Math.max(0, sp - 0.75) * 3.5);
      }
      if (obj.userData.surfaceMats) {
        const opacity = Math.max(0.1, 0.92 - Math.max(0, sp - 0.75) * 3.5);
        obj.userData.surfaceMats.forEach((material) => {
          material.opacity = opacity;
        });
      }
      if (obj.userData.lineMat) {
        obj.userData.lineMat.opacity = Math.max(0.15, 0.95 - Math.max(0, sp - 0.75) * 3.0);
      }
    });

    if (this.paused) return;

    // Si el hero no está en viewport, posponer render sin quemar ciclos de GPU
    if (!this.isHeroVisible) {
      this.animFrame = requestAnimationFrame(() => this._animate());
      return;
    }

    try {
      const hasBack = !!(this.rendererBack && this.sceneBack);
      const hasFront = !!(this.rendererFront && this.sceneFront);

      if (hasBack) {
        this.rendererBack.render(this.sceneBack, this.camera);
      }
      if (hasFront) {
        this.rendererFront.render(this.sceneFront, this.camera);
      }

      if (!this._firstRenderLogged && (hasBack || hasFront)) {
        this._firstRenderLogged = true;
        console.log(`%c[HeroScene] 🎬 DUAL SCENE SANDWICH RENDERED FIRST FRAME! (Back: ${hasBack}, Front: ${hasFront})`, 'background: #b8e030; color: #080810; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;');
      }
    } catch (renderErr) {
      console.error('%c[HeroScene] Error during dual render:', 'background: red; color: white;', renderErr);
    }

    this.animFrame = requestAnimationFrame(() => this._animate());
  }

  pause() {
    this.paused = true;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    if (this.canvasBack) this.canvasBack.style.visibility = 'hidden';
    if (this.canvasFront) this.canvasFront.style.visibility = 'hidden';
    console.log('[HeroScene] Paused and canvases hidden');
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this.canvasBack) this.canvasBack.style.visibility = 'visible';
    if (this.canvasFront) this.canvasFront.style.visibility = 'visible';
    this._animate();
    console.log('[HeroScene] Resumed and render loop restarted');
  }

  toggle(enable) {
    const shouldEnable = enable !== undefined ? enable : this.paused;
    if (shouldEnable) {
      this.resume();
    } else {
      this.pause();
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.geometryTextures.forEach((texture) => texture.dispose());
    this.objects.forEach((group) => {
      group.children.forEach((child) => {
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material?.dispose());
      });
    });
    this.rendererBack?.dispose();
    this.rendererFront?.dispose();
  }
}

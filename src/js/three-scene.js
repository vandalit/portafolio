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
   */
  constructor(canvases) {
    this.three = THREE;

    if (canvases instanceof HTMLElement) {
      this.canvasBack = canvases;
      this.canvasFront = null;
    } else {
      this.canvasBack = canvases.canvasBack || canvases.back || null;
      this.canvasFront = canvases.canvasFront || canvases.front || null;
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
    this._firstRenderLogged = false;

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

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
      });
      console.log(`[HeroScene] WebGLRenderer (${label}) created with antialias: true`);
    } catch (errAntialias) {
      console.warn(`[HeroScene] Failed antialias for ${label}, retrying fallback...`, errAntialias);
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false
      });
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    return renderer;
  }

  _addLightsToScene(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    // Key light (warm magenta/pink tint)
    const keyLight = new THREE.DirectionalLight(0xff609a, 1.8);
    keyLight.position.set(5, 6, 6);
    scene.add(keyLight);

    // Fill light (lime tint from lower opposite side)
    const fillLight = new THREE.DirectionalLight(0xb8e030, 1.4);
    fillLight.position.set(-6, -3, 4);
    scene.add(fillLight);

    // Back rim light (cool lavender/cyan)
    const backLight = new THREE.DirectionalLight(0x8080ff, 0.8);
    backLight.position.set(0, -6, -4);
    scene.add(backLight);
  }

  _setup() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    console.log('[HeroScene] Viewport dimensions:', width, 'x', height, '| DPR:', window.devicePixelRatio);

    // 1. Renderers para ambas capas de sandwich
    this.rendererBack = this._createRenderer(this.canvasBack, 'Back Canvas [z:11]');
    if (this.canvasFront) {
      this.rendererFront = this._createRenderer(this.canvasFront, 'Front Canvas [z:14]');
    }

    // 2. Escenas separadas que comparten la misma cámara y transformaciones
    this.sceneBack = new THREE.Scene();
    this._addLightsToScene(this.sceneBack);

    if (this.canvasFront) {
      this.sceneFront = new THREE.Scene();
      this._addLightsToScene(this.sceneFront);
    } else {
      this.sceneFront = this.sceneBack;
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

  _createGeometries() {
    const THREE = this.three;
    console.log('[HeroScene] Distributing 3D geometries between Back [z:11] and Front [z:14] scenes...');

    // ── SCENE BACK (z-index: 11 - detrás del Bento HTML) ─────────
    // 1. Large Icosahedron — center-left, magenta
    this._createMesh(
      this.sceneBack,
      new THREE.IcosahedronGeometry(1.5, 0),
      '#e8306e', '#ffa0c4',
      [-3.0, 0.2, -0.5], 1.0
    );

    // 2. Box — lower left floating
    this._createMesh(
      this.sceneBack,
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      '#8a1040', '#ff6090',
      [-2.0, -2.4, -1.0], 0.85
    );

    // 3. Dodecahedron — deep right background
    this._createMesh(
      this.sceneBack,
      new THREE.DodecahedronGeometry(1.3, 0),
      '#6a8010', '#d8ff40',
      [2.0, -3.0, -3.0], 0.9
    );

    // ── SCENE FRONT (z-index: 14 - por delante del Bento HTML) ──
    const frontScene = this.sceneFront || this.sceneBack;

    // 4. Octahedron — upper right, lime / yellowgreen
    this._createMesh(
      frontScene,
      new THREE.OctahedronGeometry(1.2, 0),
      '#b8e030', '#f0ff90',
      [3.6, 1.8, -0.5], 1.0
    );

    // 5. Tetrahedron — lower right, magenta reddish
    this._createMesh(
      frontScene,
      new THREE.TetrahedronGeometry(1.1, 0),
      '#d4205a', '#ff80a0',
      [4.2, -1.8, 0.5], 1.0
    );

    // 6. Small Icosahedron — top left floating
    this._createMesh(
      frontScene,
      new THREE.IcosahedronGeometry(0.7, 0),
      '#ccf020', '#ffffff',
      [-4.2, 2.5, 0.5], 0.9
    );

    console.log(`[HeroScene] Total 3D objects instantiated: ${this.objects.length} (3 in Back, 3 in Front).`);
  }

  _bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('resize', () => this._onResize());

    window.addEventListener('scroll', () => {
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
      bentoManager.updateScroll(progress, scrolled);

      // 3. Reacción visual del contenido tipográfico (Capa 4, z-index: 21)
      const heroContent = document.getElementById('hero-layer-content') || document.querySelector('.hero__content');
      if (heroContent) {
        const textProgress = Math.max(0, (scrolled - 180) / 420);
        heroContent.style.opacity = Math.max(0, 1 - textProgress * 1.4);
        heroContent.style.transform = `translateY(${-textProgress * 45}px)`;
      }

      const scrollIndicator = document.querySelector('.hero__scroll');
      if (scrollIndicator) {
        scrollIndicator.style.opacity = Math.max(0, 1 - progress * 2.5);
      }

      // 4. Doodles vectoriales (Capa 2.d, z-index: 15)
      const heroDoodles = document.querySelectorAll('.hero__doodle');
      heroDoodles.forEach((d, i) => {
        const factor = (i + 1) * 28;
        d.style.transform = `translateY(${-progress * factor}px) scale(${1 + progress * 0.15})`;
        d.style.opacity = Math.max(0, 1 - progress * 1.3);
      });
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
      if (obj.userData.lineMat) {
        obj.userData.lineMat.opacity = Math.max(0.15, 0.95 - Math.max(0, sp - 0.75) * 3.0);
      }
    });

    try {
      if (this.rendererBack && this.sceneBack) {
        this.rendererBack.render(this.sceneBack, this.camera);
      }
      if (this.rendererFront && this.sceneFront) {
        this.rendererFront.render(this.sceneFront, this.camera);
      }

      if (!this._firstRenderLogged) {
        this._firstRenderLogged = true;
        console.log('%c[HeroScene] 🎬 DUAL SCENE SANDWICH RENDERED FIRST FRAME!', 'background: #b8e030; color: #080810; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;');
      }
    } catch (renderErr) {
      console.error('%c[HeroScene] Error during dual render:', 'background: red; color: white;', renderErr);
    }

    this.animFrame = requestAnimationFrame(() => this._animate());
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.rendererBack?.dispose();
    this.rendererFront?.dispose();
  }
}

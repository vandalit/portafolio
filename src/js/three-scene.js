/* ==========================================================
   THREE-SCENE.JS — Hero 3D with Cel-Shading & Edges
   ========================================================== */

import * as THREE from '../vendor/three.module.js';

console.log('%c[HeroScene] module loaded | THREE revision:', 'color: #e8306e; font-weight: bold;', THREE.REVISION);

export class HeroScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.three = THREE;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.objects = [];
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    this.scrollProgress = 0;
    this.animFrame = null;
    this.initialized = false;
    this._firstRenderLogged = false;
    console.log('[HeroScene] Constructor instantiated with canvas:', canvas);
  }

  init() {
    console.log('%c[HeroScene] init() starting...', 'color: #e8306e; font-weight: bold;');
    try {
      this._setup();
      this._createGeometries();
      this._bindEvents();
      this._animate();
      this.initialized = true;
      console.log('%c[HeroScene] Three.js scene successfully initialized and active!', 'background: #b8e030; color: #080810; font-weight: bold; padding: 2px 6px; border-radius: 3px;');
    } catch (e) {
      console.error('%c[HeroScene] Three.js init FAILED with exception:', 'background: red; color: white; font-weight: bold; padding: 4px 8px; border-radius: 3px;', e);
    }
  }

  _setup() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    console.log('[HeroScene] Window dimensions:', width, 'x', height, '| devicePixelRatio:', window.devicePixelRatio);

    // 1. Diagnostic: check WebGL context
    const glTest = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    if (!glTest) {
      console.error('%c[HeroScene] WebGL context is NOT available on this canvas element! Browser hardware acceleration might be disabled or blocked.', 'background: red; color: white; font-size: 13px; font-weight: bold; padding: 4px;');
    } else {
      console.log('[HeroScene] WebGL context verified. Renderer string:', glTest.getParameter(glTest.RENDERER));
    }

    // 2. Create WebGLRenderer with fallback
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true
      });
      console.log('[HeroScene] WebGLRenderer created with antialias: true');
    } catch (errAntialias) {
      console.warn('[HeroScene] Failed to create WebGLRenderer with antialias, retrying without antialias...', errAntialias);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: false
      });
      console.log('[HeroScene] WebGLRenderer created with antialias: false');
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    // 3. Inspect DOM canvas state
    const rect = this.canvas.getBoundingClientRect();
    const style = window.getComputedStyle(this.canvas);
    console.log('[HeroScene] Canvas DOM inspect -> rect:', rect.width, 'x', rect.height, '| opacity:', style.opacity, '| zIndex:', style.zIndex, '| display:', style.display, '| visibility:', style.visibility);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    // Ambient light - gives base visibility to toon shading
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    // Key light (warm magenta/pink tint)
    const keyLight = new THREE.DirectionalLight(0xff609a, 1.8);
    keyLight.position.set(5, 6, 6);
    this.scene.add(keyLight);

    // Fill light (lime tint from lower opposite side)
    const fillLight = new THREE.DirectionalLight(0xb8e030, 1.4);
    fillLight.position.set(-6, -3, 4);
    this.scene.add(fillLight);

    // Back rim light (cool lavender/cyan)
    const backLight = new THREE.DirectionalLight(0x8080ff, 0.8);
    backLight.position.set(0, -6, -4);
    this.scene.add(backLight);

    console.log('[HeroScene] Scene, Camera, and Lights added successfully.');
  }

  _createMesh(geometry, faceColor, edgeColor, pos, scale = 1) {
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

    // Crisp ink outlines using EdgesGeometry
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

    this.scene.add(group);
    this.objects.push(group);
    return group;
  }

  _createGeometries() {
    const THREE = this.three;
    console.log('[HeroScene] Generating 3D geometries...');

    // 1. Large Icosahedron — center-left, vivid magenta
    this._createMesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      '#e8306e', '#ffa0c4',
      [-3.0, 0.2, -0.5], 1.0
    );

    // 2. Octahedron — upper right, lime / yellowgreen
    this._createMesh(
      new THREE.OctahedronGeometry(1.2, 0),
      '#b8e030', '#f0ff90',
      [3.6, 1.8, -1.5], 1.0
    );

    // 3. Tetrahedron — lower right, magenta reddish
    this._createMesh(
      new THREE.TetrahedronGeometry(1.1, 0),
      '#d4205a', '#ff80a0',
      [4.2, -1.8, 0], 1.0
    );

    // 4. Small Icosahedron — top left floating
    this._createMesh(
      new THREE.IcosahedronGeometry(0.7, 0),
      '#ccf020', '#ffffff',
      [-4.2, 2.5, 0.5], 0.9
    );

    // 5. Box — lower left floating
    this._createMesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      '#8a1040', '#ff6090',
      [-2.0, -2.4, -1.0], 0.85
    );

    // 6. Dodecahedron — deep right background
    this._createMesh(
      new THREE.DodecahedronGeometry(1.3, 0),
      '#6a8010', '#d8ff40',
      [2.0, -3.0, -3.0], 0.9
    );

    console.log('[HeroScene] Geometries generated. Total objects in scene:', this.objects.length);
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
      // Total scrollable range of the stage = 300px
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(1, scrolled / 300);
      this.scrollProgress = progress;

      // Visual reaction on DOM elements
      const heroContent = document.querySelector('.hero__content');
      if (heroContent) {
        heroContent.style.opacity = Math.max(0, 1 - progress * 1.5);
        heroContent.style.transform = `translateY(${-progress * 35}px)`;
      }
      const scrollIndicator = document.querySelector('.hero__scroll');
      if (scrollIndicator) {
        scrollIndicator.style.opacity = Math.max(0, 1 - progress * 2.5);
      }
      const heroDoodles = document.querySelectorAll('.hero__doodle');
      heroDoodles.forEach((d, i) => {
        const factor = (i + 1) * 25;
        d.style.transform = `translateY(${-progress * factor}px) scale(${1 + progress * 0.12})`;
        d.style.opacity = Math.max(0, 1 - progress * 1.2);
      });
    }, { passive: true });

    console.log('[HeroScene] Mouse and scroll event listeners bound.');
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _animate() {
    const t = performance.now() * 0.001;

    // Smooth mouse inertia
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    const sp = this.scrollProgress; // 0.0 to 1.0 during 300px

    // Camera responds to mouse + subtle depth pull during scrollytelling
    this.camera.position.x = this.mouse.x * 1.5 * (1 - sp * 0.5);
    this.camera.position.y = this.mouse.y * 1.0 * (1 - sp * 0.5) - sp * 0.6;
    this.camera.position.z = 9 + sp * 2.5;
    this.camera.lookAt(0, -sp * 0.4, 0);

    // Float & rotate each polygon + scrollytelling choreography
    this.objects.forEach((obj, idx) => {
      const { floatPhase, floatSpeed, rotSpeedX, rotSpeedY, rotSpeedZ, basePosition } = obj.userData;

      // Acceleration multiplier with scroll progress
      const spinBoost = 1 + sp * 3.0;
      obj.rotation.x += rotSpeedX * spinBoost;
      obj.rotation.y += rotSpeedY * spinBoost;
      obj.rotation.z += rotSpeedZ * spinBoost;

      // Expansion and convergence choreography during scrollytelling
      const expandDir = idx % 2 === 0 ? 1 : -1;
      const targetX = basePosition[0] + expandDir * sp * 1.8;
      const targetY = basePosition[1] + (idx > 2 ? -1 : 1) * sp * 1.2;
      const targetZ = basePosition[2] + sp * 1.5;

      obj.position.x = targetX + Math.cos(t * floatSpeed * 0.8 + floatPhase) * 0.2;
      obj.position.y = targetY + Math.sin(t * floatSpeed + floatPhase) * 0.35;
      obj.position.z = targetZ;

      // Smooth fade-out at the end of the 300px stage
      if (obj.userData.mat) {
        obj.userData.mat.opacity = Math.max(0.1, 0.92 - sp * 0.45);
      }
      if (obj.userData.lineMat) {
        obj.userData.lineMat.opacity = Math.max(0.15, 0.95 - sp * 0.4);
      }
    });

    try {
      this.renderer.render(this.scene, this.camera);
      if (!this._firstRenderLogged) {
        this._firstRenderLogged = true;
        console.log('%c[HeroScene] 🎬 FIRST FRAME RENDERED SUCCESSFULLY TO WEBGL CANVAS!', 'background: #b8e030; color: #080810; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;');
      }
    } catch (renderErr) {
      console.error('%c[HeroScene] Error during renderer.render():', 'background: red; color: white;', renderErr);
    }

    this.animFrame = requestAnimationFrame(() => this._animate());
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.renderer?.dispose();
  }
}

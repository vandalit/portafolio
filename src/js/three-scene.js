/* ==========================================================
   THREE-SCENE.JS — Hero 3D with Cel-Shading
   ========================================================== */

export class HeroScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.three = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.objects = [];
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    this.scrollProgress = 0;
    this.animFrame = null;
    this.initialized = false;
  }

  async init() {
    // Dynamic import Three.js
    try {
      this.three = await import('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js');
      this._setup();
      this._createGeometries();
      this._bindEvents();
      this._animate();
      this.canvas.classList.add('loaded');
      this.initialized = true;
    } catch (e) {
      console.warn('[HeroScene] Three.js failed to load:', e);
    }
  }

  _setup() {
    const THREE = this.three;
    const { width, height } = this.canvas.getBoundingClientRect();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,  // Intentional: hard edges for cel look
      powerPreference: 'low-power'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 8);

    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);

    // Key light — magenta-ish
    const keyLight = new THREE.DirectionalLight(0xe8306e, 1.2);
    keyLight.position.set(3, 4, 5);
    this.scene.add(keyLight);

    // Fill light — lime
    const fillLight = new THREE.DirectionalLight(0xb8e030, 0.6);
    fillLight.position.set(-4, -2, 3);
    this.scene.add(fillLight);

    // Back light — cool blue
    const backLight = new THREE.DirectionalLight(0x2040ff, 0.2);
    backLight.position.set(0, -5, -4);
    this.scene.add(backLight);
  }

  _celShaderMaterial(color, outlineColor) {
    const THREE = this.three;
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor:    { value: new THREE.Color(color) },
        uLightDir: { value: new THREE.Vector3(0.6, 0.8, 0.5).normalize() },
        uLightDir2:{ value: new THREE.Vector3(-0.5, -0.3, 0.4).normalize() },
        uBands:    { value: 4.0 },
        uTime:     { value: 0 },
        uAlpha:    { value: 1 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec3 pos = position;
          pos.x += sin(uTime * 0.4 + position.y * 1.2) * 0.04;
          pos.y += cos(uTime * 0.3 + position.x * 0.8) * 0.04;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uLightDir;
        uniform vec3 uLightDir2;
        uniform float uBands;
        uniform float uAlpha;
        varying vec3 vNormal;
        void main() {
          vec3 n = normalize(vNormal);
          float diff  = max(dot(n, uLightDir),  0.0);
          float diff2 = max(dot(n, uLightDir2), 0.0) * 0.3;
          float total = diff + diff2;
          // Posterize
          float toon = floor(total * uBands) / uBands;
          toon = max(toon, 0.15);
          vec3 finalColor = uColor * toon;
          // Rim light hint
          float rim = 1.0 - max(dot(n, vec3(0.0,0.0,1.0)), 0.0);
          finalColor += uColor * rim * rim * 0.12;
          gl_FragColor = vec4(finalColor, uAlpha);
        }
      `,
      transparent: true,
    });
  }

  _outlineMaterial(color) {
    const THREE = this.three;
    return new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0.35 } },
      vertexShader: `
        void main() {
          vec3 n = normalize(normalMatrix * normal);
          vec4 pos = modelViewMatrix * vec4(position, 1.0);
          pos.xyz += n * 0.06;
          gl_Position = projectionMatrix * pos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAlpha;
        void main() { gl_FragColor = vec4(uColor, uAlpha); }
      `,
      side: this.three.BackSide,
      transparent: true,
    });
  }

  _createMesh(geometry, color, outlineColor, pos, scale = 1) {
    const THREE = this.three;
    const group = new THREE.Group();

    const mat = this._celShaderMaterial(color);
    const mesh = new THREE.Mesh(geometry, mat);
    group.add(mesh);

    const outlineMat = this._outlineMaterial(outlineColor);
    const outline = new THREE.Mesh(geometry, outlineMat);
    group.add(outline);

    group.position.set(...pos);
    group.scale.setScalar(scale);

    // Store for animation
    group.userData = {
      mat,
      basePosition: [...pos],
      floatPhase: Math.random() * Math.PI * 2,
      floatSpeed: 0.3 + Math.random() * 0.3,
      rotSpeed: (Math.random() - 0.5) * 0.005,
    };

    this.scene.add(group);
    this.objects.push(group);
    return group;
  }

  _createGeometries() {
    const THREE = this.three;

    // Large icosahedron — center-left, magenta tones
    this._createMesh(
      new THREE.IcosahedronGeometry(1.4, 0),
      '#c4205a', '#ff5090',
      [-2.5, -0.5, -1], 1
    );

    // Octahedron — upper right, lime
    this._createMesh(
      new THREE.OctahedronGeometry(1.0, 0),
      '#6a9010', '#b8e030',
      [3.2, 1.5, -2], 1
    );

    // Tetrahedron — right, magenta
    this._createMesh(
      new THREE.TetrahedronGeometry(0.9, 0),
      '#8a1040', '#e8306e',
      [4.0, -1.5, -0.5], 1
    );

    // Small icosahedron — left floating
    this._createMesh(
      new THREE.IcosahedronGeometry(0.6, 0),
      '#4a6010', '#b8e030',
      [-4.0, 2.0, 0.5], 1
    );

    // Box — far back, subtle
    this._createMesh(
      new THREE.BoxGeometry(1, 1, 1),
      '#3a0820', '#e8306e',
      [1.5, 3.0, -4], 0.8
    );

    // Dodecahedron — background
    this._createMesh(
      new THREE.DodecahedronGeometry(1.2, 0),
      '#1a3008', '#8ab820',
      [-3.5, -2.5, -3], 0.9
    );
  }

  _bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => this._onResize());

    window.addEventListener('scroll', () => {
      const hero = document.getElementById('hero');
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      this.scrollProgress = Math.max(0, Math.min(1, -rect.top / rect.height));
    });
  }

  _onResize() {
    const { width, height } = this.canvas.parentElement?.getBoundingClientRect()
      || { width: window.innerWidth, height: window.innerHeight };
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _animate() {
    const THREE = this.three;
    const t = performance.now() * 0.001;

    // Smooth mouse
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.06;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.06;

    // Camera parallax
    this.camera.position.x += (this.mouse.x * 0.8 - this.camera.position.x) * 0.04;
    this.camera.position.y += (this.mouse.y * 0.5 - this.camera.position.y) * 0.04;
    this.camera.lookAt(0, 0, 0);

    // Fade out on scroll
    const heroAlpha = 1 - this.scrollProgress * 1.5;
    this.scene.children.forEach(child => {
      if (child.userData?.mat?.uniforms?.uAlpha) {
        child.userData.mat.uniforms.uAlpha.value = Math.max(0, heroAlpha);
        child.userData.mat.uniforms.uTime.value = t;
      }
    });

    // Float objects
    this.objects.forEach((obj) => {
      const { floatPhase, floatSpeed, rotSpeed, basePosition } = obj.userData;
      obj.position.y = basePosition[1] + Math.sin(t * floatSpeed + floatPhase) * 0.25;
      obj.position.x = basePosition[0] + Math.cos(t * floatSpeed * 0.7 + floatPhase) * 0.1;
      obj.rotation.x += rotSpeed;
      obj.rotation.y += rotSpeed * 1.3;
      obj.rotation.z += rotSpeed * 0.7;
    });

    // Scale + pull camera back on scroll
    this.camera.position.z = 8 + this.scrollProgress * 3;

    this.renderer.render(this.scene, this.camera);
    this.animFrame = requestAnimationFrame(() => this._animate());
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.renderer?.dispose();
  }
}

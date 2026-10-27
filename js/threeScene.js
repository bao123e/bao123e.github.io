/**
 * AETHERIA TCG - Three.js 3D WebGL Scene & Holographic Architecture
 * Manages full-viewport 3D booster pack, 1800+ particle vortex,
 * dynamic lighting, pack drag-to-rip laser slice, and 3D explosion shards.
 */

class ThreeSceneManager {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.canvas = document.getElementById('webgl-canvas');

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Objects
    this.packGroup = null;
    this.packMesh = null;
    this.vortexPoints = null;
    this.starfieldPoints = null;
    this.explosionShards = [];

    // Lighting
    this.ambientLight = null;
    this.corePointLight = null;
    this.rimLight1 = null;
    this.rimLight2 = null;

    // Interaction & Animation state
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isCharging = false;
    this.vortexSpeed = 0.008;
    this.targetVortexSpeed = 0.008;
    this.currentRarityColor = new THREE.Color('#38bdf8');
    this.targetRarityColor = new THREE.Color('#38bdf8');
    this.isExploded = false;

    // Drag-to-slice state
    this.isDraggingSlice = false;
    this.sliceStartX = 0;
    this.sliceProgress = 0;
    this.onSliceComplete = null;

    this.init();
  }

  init() {
    if (!this.canvas) return;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070913, 0.04);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 7.8);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    // 4. Lighting
    this.setupLighting();

    // 5. Starfield & Particle Vortex
    this.setupStarfield();
    this.setupParticleVortex();

    // 6. 3D Booster Pack
    this.createBoosterPack('yugioh');

    // 7. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.setupDragSliceEvents();

    // 8. Start Render Loop
    this.animate();
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x181830, 2.0);
    this.scene.add(this.ambientLight);

    // Dynamic Central Point Light
    this.corePointLight = new THREE.PointLight(0x38bdf8, 3.5, 14);
    this.corePointLight.position.set(0, 0, 2.5);
    this.scene.add(this.corePointLight);

    // Cyan Astral Rim Light (Left)
    this.rimLight1 = new THREE.DirectionalLight(0x06b6d4, 2.2);
    this.rimLight1.position.set(-5, 4, 3);
    this.scene.add(this.rimLight1);

    // Violet Mystic Rim Light (Right)
    this.rimLight2 = new THREE.DirectionalLight(0xa855f7, 2.4);
    this.rimLight2.position.set(5, -3, 3);
    this.scene.add(this.rimLight2);
  }

  // Generate dynamic canvas texture for Booster Pack front
  generatePackTexture(bannerKey = 'yugioh') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');

    const isYGO = bannerKey === 'yugioh';
    const primaryColor = isYGO ? '#f59e0b' : '#38bdf8';
    const accentColor = isYGO ? '#dc2626' : '#a855f7';
    const titleText = isYGO ? 'CHRONO-DRAGON' : 'NEBULA POCKET';
    const subtitleText = isYGO ? 'GENESIS SUMMONS' : 'LEGENDS EXPANSION';

    // Metallic foil dark background
    const bg = ctx.createLinearGradient(0, 0, 1024, 1536);
    bg.addColorStop(0, '#0a0d1b');
    bg.addColorStop(0.3, isYGO ? '#261205' : '#0b1633');
    bg.addColorStop(0.7, '#070913');
    bg.addColorStop(1, '#05070f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 1536);

    // Foil crimp ridges at top and bottom
    const drawCrimps = (yStart, height) => {
      ctx.fillStyle = '#1e2238';
      ctx.fillRect(0, yStart, 1024, height);
      for (let x = 0; x < 1024; x += 16) {
        ctx.fillStyle = x % 32 === 0 ? '#475569' : '#0f172a';
        ctx.fillRect(x, yStart, 10, height);
      }
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, yStart + (yStart === 0 ? height : 0));
      ctx.lineTo(1024, yStart + (yStart === 0 ? height : 0));
      ctx.stroke();
    };
    drawCrimps(0, 70); // Top crimp
    drawCrimps(1466, 70); // Bottom crimp

    // Diagonal Holographic Sheen Streaks
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (let i = -1000; i < 2000; i += 280) {
      const grad = ctx.createLinearGradient(i, 0, i + 350, 1536);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 500, 0);
      ctx.lineTo(i + 200, 1536);
      ctx.lineTo(i - 300, 1536);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Central Astral Sigil / Crest
    ctx.save();
    ctx.translate(512, 680);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 260, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 290, 0, Math.PI * 2);
    ctx.stroke();

    // Mystic Dragon / Beast emblem star
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const r = k % 2 === 0 ? 230 : 90;
      const ang = (k * Math.PI) / 8;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Core glow
    const coreGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 180);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, primaryColor);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Brand Logo & Headers
    ctx.textAlign = 'center';
    ctx.font = '900 36px "Orbitron", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '12px';
    ctx.fillText('A E T H E R I A   T C G', 512, 180);

    // Title
    ctx.font = '900 68px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 25;
    ctx.fillText(titleText, 512, 290);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '700 30px "Orbitron", sans-serif';
    ctx.fillStyle = primaryColor;
    ctx.fillText(subtitleText, 512, 350);

    // Pack Features Banner at bottom
    ctx.fillStyle = '#0f172aee';
    ctx.fillRect(100, 1180, 824, 180);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 1180, 824, 180);

    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(isYGO ? '5 CARDS PER PACK  •  GUARANTEED SSR+' : 'POKÉMON LEGENDS  •  5 CARDS', 512, 1250);

    ctx.font = '600 24px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ HARNESS THE ASTRAL MULTIVERSE ⚡', 512, 1310);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  createBoosterPack(bannerKey = 'yugioh') {
    if (this.packGroup) {
      this.scene.remove(this.packGroup);
    }

    this.packGroup = new THREE.Group();

    // Geometry: Box with foil thickness
    const geometry = new THREE.BoxGeometry(2.4, 3.65, 0.22, 4, 4, 2);

    const frontTexture = this.generatePackTexture(bannerKey);

    // Metallic foil materials
    const foilMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      metalness: 0.85,
      roughness: 0.28
    });

    // Materials array: [right, left, top, bottom, front, back]
    const materials = [
      foilMaterial,
      foilMaterial,
      foilMaterial,
      foilMaterial,
      frontMaterial,
      foilMaterial
    ];

    this.packMesh = new THREE.Mesh(geometry, materials);
    this.packMesh.castShadow = true;
    this.packMesh.receiveShadow = true;

    // Golden foil border accent frame
    const borderGeo = new THREE.BoxGeometry(2.46, 3.71, 0.24);
    const borderMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    this.packMesh.add(borderMesh);

    this.packGroup.add(this.packMesh);
    this.packGroup.position.set(0, 0.15, 0);

    this.scene.add(this.packGroup);
    this.isExploded = false;
  }

  setupStarfield() {
    const starCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25 - 5;

      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.7, 0.8);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.starfieldPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starfieldPoints);
  }

  setupParticleVortex() {
    const count = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.vortexVelocities = new Float32Array(count);
    this.vortexRadii = new Float32Array(count);
    this.vortexAngles = new Float32Array(count);
    this.vortexHeights = new Float32Array(count);

    const baseColor = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      const radius = 1.4 + Math.pow(Math.random(), 1.5) * 4.2;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 5.0;

      this.vortexRadii[i] = radius;
      this.vortexAngles[i] = angle;
      this.vortexHeights[i] = height;
      this.vortexVelocities[i] = (1.5 / radius) * (0.8 + Math.random() * 0.4);

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.vortexPoints = new THREE.Points(geometry, material);
    this.scene.add(this.vortexPoints);
  }

  // Update vortex particle colors matching highest rarity
  setRarityVortex(rarity) {
    const colorMap = {
      R: '#38bdf8',       // Cyan Astral
      SR: '#c084fc',      // Purple Void
      SSR: '#facc15',     // Gold Solar
      UR: '#f43f5e'       // Cosmic Crimson / Rainbow
    };
    const hex = colorMap[rarity] || '#38bdf8';
    this.targetRarityColor.set(hex);
    if (this.corePointLight) {
      this.corePointLight.color.set(hex);
    }
  }

  // Set charging speed
  setChargingState(charging) {
    this.isCharging = charging;
    this.targetVortexSpeed = charging ? 0.055 : 0.008;
  }

  // Explode 3D Pack into 45+ flying metallic foil shards
  explodePack() {
    if (this.isExploded || !this.packMesh) return;
    this.isExploded = true;
    this.packMesh.visible = false;

    // Clean up previous shards
    this.explosionShards.forEach(s => this.scene.remove(s));
    this.explosionShards = [];

    const shardCount = 50;
    const shardGeos = [
      new THREE.TetrahedronGeometry(0.25, 0),
      new THREE.BufferGeometry()
    ];

    // Create custom triangle shards
    for (let i = 0; i < shardCount; i++) {
      const geom = new THREE.BufferGeometry();
      const s = 0.2 + Math.random() * 0.35;
      const vertices = new Float32Array([
        -s, -s, 0,
         s, -s, 0,
         0,  s, (Math.random() - 0.5) * 0.2
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.4 ? this.currentRarityColor : 0xffffff,
        metalness: 0.9,
        roughness: 0.2,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 0.4
      );

      // Random 3D blast velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      mesh.userData = {
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.8 + Math.random() * 0.5) + 1.5,
        vz: (Math.random() - 0.3) * 6,
        rotX: (Math.random() - 0.5) * 18,
        rotY: (Math.random() - 0.5) * 18,
        rotZ: (Math.random() - 0.5) * 18,
        life: 1.0
      };

      this.scene.add(mesh);
      this.explosionShards.push(mesh);
    }
  }

  // Apex Celestial Supernova Explosion for UR / 5-Star Gold pulls
  triggerApexSupernovaExplosion() {
    this.explodePack();

    // Intense golden flare burst
    if (this.corePointLight) {
      this.corePointLight.color.set('#facc15');
      this.corePointLight.intensity = 16.0;
      anime({
        targets: this.corePointLight,
        intensity: [16.0, 4.0],
        duration: 1800,
        easing: 'easeOutQuad'
      });
    }

    // Expanding 3D Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.45, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 0, 0.5);
    this.scene.add(ringMesh);

    anime({
      targets: ringMesh.scale,
      x: [0.5, 35],
      y: [0.5, 35],
      duration: 1200,
      easing: 'easeOutExpo',
      complete: () => {
        this.scene.remove(ringMesh);
      }
    });

    anime({
      targets: ringMat,
      opacity: [1, 0],
      duration: 1200,
      easing: 'easeOutQuad'
    });

    // Spawn 70 additional golden crystal diamond shards
    for (let k = 0; k < 70; k++) {
      const g = new THREE.OctahedronGeometry(0.18 + Math.random() * 0.25, 0);
      const m = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.3 ? 0xfacc15 : (Math.random() > 0.5 ? 0xf43f5e : 0xffffff),
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0x332200
      });
      const shard = new THREE.Mesh(g, m);
      shard.position.set(0, 0, 0);

      const angle = Math.random() * Math.PI * 2;
      const speed = 7 + Math.random() * 11;
      shard.userData = {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.4) * 8,
        rotX: (Math.random() - 0.5) * 25,
        rotY: (Math.random() - 0.5) * 25,
        rotZ: (Math.random() - 0.5) * 25,
        life: 1.4
      };

      this.scene.add(shard);
      this.explosionShards.push(shard);
    }
  }

  // Restore 3D Pack after summon sequence completes
  resetPack(bannerKey = 'yugioh') {
    this.explosionShards.forEach(s => this.scene.remove(s));
    this.explosionShards = [];
    this.isExploded = false;
    this.setChargingState(false);
    this.setRarityVortex('R');

    if (this.packMesh) {
      this.packMesh.visible = true;
      this.packMesh.position.set(0, 0, 0);
      this.packMesh.rotation.set(0, 0, 0);
      this.packMesh.scale.set(1, 1, 1);
    }
    this.createBoosterPack(bannerKey);
  }

  // Drag-to-slice interaction on pack
  setupDragSliceEvents() {
    const packTearIndicator = document.getElementById('pack-tear-slider');
    if (!packTearIndicator) return;

    let isDown = false;
    let startX = 0;

    const onStart = (clientX) => {
      if (!this.packMesh || this.isExploded) return;
      isDown = true;
      startX = clientX;
      if (window.soundFX) window.soundFX.playClick();
    };

    const onMove = (clientX) => {
      if (!isDown) return;
      const deltaX = clientX - startX;
      const progress = Math.max(0, Math.min(1, deltaX / 240));
      this.sliceProgress = progress;

      // Update laser trail indicator
      const trail = document.getElementById('slice-laser-trail');
      if (trail) {
        trail.style.width = `${progress * 100}%`;
      }

      if (progress >= 0.85) {
        isDown = false;
        if (window.soundFX) window.soundFX.playLaserSlice();
        if (this.onSliceComplete) {
          this.onSliceComplete();
        }
      }
    };

    const onEnd = () => {
      isDown = false;
      this.sliceProgress = 0;
      const trail = document.getElementById('slice-laser-trail');
      if (trail) trail.style.width = '0%';
    };

    packTearIndicator.addEventListener('mousedown', (e) => onStart(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    // Touch events
    packTearIndicator.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smooth mouse parallax interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 2. Booster Pack Idle levitation & tilt
    if (this.packGroup && !this.isExploded) {
      if (this.isCharging) {
        // High vibration during charge
        this.packMesh.position.x = (Math.random() - 0.5) * 0.08;
        this.packMesh.position.y = (Math.random() - 0.5) * 0.08;
        this.packMesh.rotation.z = (Math.random() - 0.5) * 0.06;
      } else {
        // Smooth floating motion
        const floatY = Math.sin(elapsedTime * 1.8) * 0.12;
        this.packMesh.position.y = floatY;
        this.packMesh.rotation.y = this.mouse.x * 0.45 + Math.sin(elapsedTime * 0.8) * 0.08;
        this.packMesh.rotation.x = -this.mouse.y * 0.35;
      }
    }

    // 3. Update Shards Physics
    if (this.isExploded && this.explosionShards.length > 0) {
      for (let i = this.explosionShards.length - 1; i >= 0; i--) {
        const s = this.explosionShards[i];
        const u = s.userData;
        s.position.x += u.vx * delta;
        s.position.y += u.vy * delta;
        s.position.z += u.vz * delta;
        u.vy -= 9.8 * delta; // Gravity

        s.rotation.x += u.rotX * delta;
        s.rotation.y += u.rotY * delta;
        s.rotation.z += u.rotZ * delta;

        u.life -= delta * 0.9;
        s.scale.setScalar(Math.max(0, u.life));

        if (u.life <= 0) {
          this.scene.remove(s);
          this.explosionShards.splice(i, 1);
        }
      }
    }

    // 4. Update Particle Vortex Orbit
    this.vortexSpeed += (this.targetVortexSpeed - this.vortexSpeed) * 0.05;
    this.currentRarityColor.lerp(this.targetRarityColor, 0.06);

    if (this.vortexPoints) {
      const positions = this.vortexPoints.geometry.attributes.position.array;
      const colors = this.vortexPoints.geometry.attributes.color.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        this.vortexAngles[i] += this.vortexVelocities[i] * this.vortexSpeed * 3.5;
        const radius = this.vortexRadii[i];
        const angle = this.vortexAngles[i];

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        // Wave heights
        positions[i * 3 + 1] = this.vortexHeights[i] + Math.sin(elapsedTime * 2 + radius) * 0.3;

        // Color morphing
        colors[i * 3] = this.currentRarityColor.r;
        colors[i * 3 + 1] = this.currentRarityColor.g;
        colors[i * 3 + 2] = this.currentRarityColor.b;
      }

      this.vortexPoints.geometry.attributes.position.needsUpdate = true;
      this.vortexPoints.geometry.attributes.color.needsUpdate = true;
    }

    // 5. Starfield slow rotation
    if (this.starfieldPoints) {
      this.starfieldPoints.rotation.y = elapsedTime * 0.015;
    }

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Global scene manager instance
window.threeSceneManager = null;

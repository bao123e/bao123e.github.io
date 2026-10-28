/**
 * WUTHERING WAVES // AKADEMIYA TERMINAL
 * wuwaCombat.js - 2D Chibi Combat Arena Simulator (60FPS Canvas Engine)
 * 3 Modes: Tower of Adversity, Whimpering Wastes, Matrix
 * Dual Control: Manual PC Keybinds (J, E, F, R, Space, 1, 2, 3) + AI Auto-Battle Quickswap (P, 1x/2x)
 */

class WuWaCombatArena {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;

    // Config & Game State
    this.selectedMode = 'toa'; // 'toa' | 'ww' | 'matrix'
    this.selectedSquad = ['jinhsi', 'changli', 'verina']; // 3 Resonator IDs
    this.activeSlot = 0; // 0, 1, 2
    this.selectedToken = 'plunderer_seal';
    this.squadFilter = 'all';
    this.squadSearch = '';

    this.battleState = 'setup'; // 'setup' | 'fighting' | 'paused' | 'ended'
    this.isAuto = false;
    this.speedMultiplier = 1; // 1 or 2

    // Combat Clock & Stats
    this.timeLeft = 180;
    this.score = 0;
    this.combo = 0;
    this.waveIndex = 0;
    this.bossPhase = 1;
    this.screenShake = 0;

    // Squad runtime state (HP, Energy, Concerto, Forte, Skill CD)
    this.squadRuntime = [];

    // Enemy runtime state
    this.enemies = []; // [{ x, y, hp, maxHp, atk, vibration, maxVibration, name, element, isBoss, telegraph, telegraphTimer, telegraphType }]
    
    // Visual FX & Floating Combat Text
    this.particles = [];
    this.floatingTexts = []; // [{ text, x, y, color, size, alpha, vy }]
    this.slashes = []; // [{ x, y, radius, color, alpha, angle }]

    this.imagesCache = {};

    if (window.wuwaMasterData) {
      this.masterData = window.wuwaMasterData;
      this.initSquadRuntime();
    }

    window.addEventListener('wuwa_data_ready', (e) => {
      this.masterData = e.detail;
      this.initSquadRuntime();
    });

    window.addEventListener('wuwa_lang_changed', () => {
      this.updateUI();
    });

    this.bindKeyboard();
  }

  updateUI() {
    this.updateHUD();
    this.renderSquadSelector();
  }

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.initSquadRuntime();
    this.renderSquadSelector();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = Math.min(500, Math.max(360, window.innerHeight * 0.5));
  }

  // Preload chibi / avatar sprite
  getImage(url) {
    if (!url) return null;
    if (this.imagesCache[url]) return this.imagesCache[url];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    this.imagesCache[url] = img;
    return img;
  }

  // Squad selection
  setSquad(squadIds) {
    this.selectedSquad = squadIds.slice(0, 3);
    this.initSquadRuntime();
    this.renderSquadSelector();
  }

  addResonatorToSquad(resonatorId) {
    if (this.selectedSquad.includes(resonatorId)) return;
    this.selectedSquad.shift();
    this.selectedSquad.push(resonatorId);
    this.initSquadRuntime();
    this.renderSquadSelector();
  }

  getStageBackgroundUrl() {
    const modeData = window.wuwaMasterData?.combatModesData;
    if (this.selectedMode === 'toa') {
      return modeData?.toa?.stageBg || 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/UiSingleTower/Image/T_UiSingleTowerBg_UI.png';
    } else if (this.selectedMode === 'ww') {
      return modeData?.whimpering_wastes?.stageBg || 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/UiTacetfield/Image/T_TacetfieldFirstBg.png';
    } else if (this.selectedMode === 'matrix') {
      return modeData?.matrix?.stageBg || 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/UiSingleTower/Image/T_loopTowerBg03_UI.png';
    }
    return '';
  }

  initSquadRuntime() {
    const list = window.wuwaMasterData?.resonators || [];
    const canvasH = this.canvas ? this.canvas.height : 400;
    const floorY = canvasH * 0.68;

    this.squadRuntime = this.selectedSquad.map((id, idx) => {
      const data = list.find(r => r.id === id) || {
        id,
        name: { en: id, vi: id },
        element: 'Spectro',
        weapon: 'Sword',
        role: idx === 0 ? 'main_dps' : (idx === 1 ? 'sub_dps' : 'support'),
        assets: { chibi: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/Common/Image/IconRoleHeadQ/T_IconRoleHeadQJinxi.png', avatar: 'assets/jinhsi-official.webp' },
        combatStats: { hp: 11000, atk: 2400, critRate: 0.7, critDmg: 2.5 }
      };

      const maxHp = data.combatStats?.hp || 10000;
      return {
        data,
        hp: maxHp,
        maxHp: maxHp,
        concerto: idx === 0 ? 0 : (idx === 1 ? 50 : 100), // Start with some concerto for tactical quickswap
        forte: 0, // 0 - 100
        liberationEnergy: 60, // 0 - 100
        skillCd: 0,
        skillMaxCd: data.combatStats?.skills?.skill?.cd || 8,
        forteCd: 0,
        isAttacking: false,
        attackTimer: 0,
        animX: 0,
        x: 180,
        y: floorY - 35
      };
    });
    this.activeSlot = 0;
  }

  // Bind Global Keyboard Controls (J, E, F, R, Space, 1, 2, 3, P)
  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const combatView = document.getElementById('view-combat');
      if (!combatView || combatView.classList.contains('hidden')) return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.toggleAuto();
        return;
      }

      if (this.battleState !== 'fighting') return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        this.triggerBasicAttack();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.triggerSkill();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.triggerForte();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.triggerLiberation();
      } else if (e.key === ' ' || e.key === 'Shift') {
        e.preventDefault();
        this.triggerDodgeOrParry();
      } else if (e.key === '1') {
        e.preventDefault();
        this.swapResonator(0);
      } else if (e.key === '2') {
        e.preventDefault();
        this.swapResonator(1);
      } else if (e.key === '3') {
        e.preventDefault();
        this.swapResonator(2);
      }
    });
  }

  startBattle() {
    this.initSquadRuntime();
    this.battleState = 'fighting';
    this.score = 0;
    this.combo = 0;
    this.waveIndex = 0;
    this.bossPhase = 1;
    this.particles = [];
    this.floatingTexts = [];
    this.slashes = [];

    const modeData = window.wuwaMasterData?.combatModesData;

    if (this.selectedMode === 'toa') {
      this.timeLeft = modeData?.toa?.timeLimitSeconds || 180;
      this.spawnToaBoss();
    } else if (this.selectedMode === 'ww') {
      this.timeLeft = modeData?.whimpering_wastes?.timeLimitSeconds || 120;
      this.spawnWwWave(0);
    } else if (this.selectedMode === 'matrix') {
      this.timeLeft = modeData?.matrix?.timeLimitSeconds || 150;
      this.spawnMatrixBoss(1);
    }

    const setupPanel = document.getElementById('combat-setup-panel');
    const battlePanel = document.getElementById('combat-battle-panel');
    if (setupPanel) setupPanel.classList.add('hidden');
    if (battlePanel) battlePanel.classList.remove('hidden');

    this.resizeCanvas();
    this.lastTime = performance.now();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame((ts) => this.loop(ts));
    this.updateHUD();
  }

  spawnToaBoss() {
    const modeData = window.wuwaMasterData?.combatModesData?.toa;
    const bossConfig = modeData?.bosses ? modeData.bosses[0] : {
      name: { en: "Scar (Aberrant Form)", vi: "Scar (Dạng Quỷ Dê)" },
      hp: 450000,
      atk: 1400,
      vibrationMax: 100,
      sprite: "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/Common/Image/ImgBoss/T_Boss_34011.png"
    };

    const canvasH = this.canvas ? this.canvas.height : 400;
    const canvasW = this.canvas ? this.canvas.width : 800;
    const floorY = canvasH * 0.68;
    const spriteUrl = bossConfig.sprite || "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/Common/Image/ImgBoss/T_Boss_34011.png";

    this.enemies = [{
      id: 'toa_boss',
      name: bossConfig.name,
      hp: bossConfig.hp,
      maxHp: bossConfig.hp,
      vibration: bossConfig.vibrationMax,
      maxVibration: bossConfig.vibrationMax,
      staggerTimer: 0,
      atk: bossConfig.atk || 1400,
      element: bossConfig.elementResist || 'Havoc',
      isBoss: true,
      x: canvasW - 190,
      y: floorY - 55,
      width: 170,
      height: 190,
      sprite: spriteUrl,
      telegraphType: null, // 'parry' (gold circle) or 'dodge' (red flash)
      telegraphTimer: 0,
      attackCooldown: 3.5,
      animBob: 0
    }];

    this.getImage(spriteUrl);
  }

  spawnWwWave(waveIdx) {
    this.waveIndex = waveIdx;
    const waves = window.wuwaMasterData?.combatModesData?.whimpering_wastes?.waves;
    const wave = waves && waves[waveIdx] ? waves[waveIdx] : {
      enemyName: "Tacet Discord Pack (x6)",
      count: 6,
      hpPerMob: 30000,
      pointsPerKill: 200,
      sprite: "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/Common/Image/ImgBoss/T_Boss_02.png"
    };

    const canvasH = this.canvas ? this.canvas.height : 400;
    const canvasW = this.canvas ? this.canvas.width : 800;
    const floorY = canvasH * 0.68;
    const mobCount = wave.count || 5;
    const isBossWave = (waveIdx === 3 || mobCount === 1);

    this.enemies = [];

    if (isBossWave) {
      const bossSprite = wave.sprite || "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/Common/Image/ImgBoss/T_Boss_34021.png";
      this.enemies.push({
        id: `mob_${waveIdx}_boss`,
        name: { en: "Crownless (Overlord Class)", vi: "Vô Quán Giả (Crownless)" },
        hp: wave.hpPerMob || 280000,
        maxHp: wave.hpPerMob || 280000,
        vibration: 100,
        maxVibration: 100,
        staggerTimer: 0,
        atk: 1350,
        pointsPerKill: wave.pointsPerKill || 2000,
        element: 'Havoc',
        isBoss: true,
        x: canvasW - 190,
        y: floorY - 60,
        width: 170,
        height: 200,
        sprite: bossSprite,
        telegraphType: null,
        telegraphTimer: 0,
        attackCooldown: 3.2,
        animBob: 0
      });
      this.getImage(bossSprite);
    } else {
      const defaultMobSprite = wave.sprite || "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/Common/Image/ImgBoss/T_Boss_02.png";
      for (let i = 0; i < mobCount; i++) {
        const mob = {
          id: `mob_${waveIdx}_${i}`,
          name: { en: wave.enemyName, vi: wave.enemyName },
          hp: wave.hpPerMob,
          maxHp: wave.hpPerMob,
          vibration: 35,
          maxVibration: 35,
          staggerTimer: 0,
          atk: 650,
          pointsPerKill: wave.pointsPerKill || 200,
          element: (i % 2 === 0 ? 'Glacio' : 'Havoc'),
          isBoss: false,
          x: canvasW - 110 - (i * 42),
          y: floorY - 25 + ((i % 3 - 1) * 22),
          width: 80,
          height: 95,
          sprite: defaultMobSprite,
          telegraphType: (i === 0 ? 'dodge' : null),
          telegraphTimer: 0,
          attackCooldown: 3.0 + (i * 0.7),
          animBob: i * 0.5
        };
        this.enemies.push(mob);
        this.getImage(mob.sprite);
      }
    }
  }

  spawnMatrixBoss(phase) {
    this.bossPhase = phase;
    const matrixData = window.wuwaMasterData?.combatModesData?.matrix;
    const phaseConfig = matrixData?.boss?.phases && matrixData.boss.phases[phase - 1]
      ? matrixData.boss.phases[phase - 1]
      : { hp: 300000, attackSpeed: 1.0 + phase * 0.35, parryWindowMs: 500 };

    const canvasH = this.canvas ? this.canvas.height : 400;
    const canvasW = this.canvas ? this.canvas.width : 800;
    const floorY = canvasH * 0.68;
    const spriteUrl = matrixData?.boss?.sprite || "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/UI/UIResources/Common/Image/ImgBoss/T_Boss_34080.png";

    this.enemies = [{
      id: 'matrix_boss',
      name: {
        en: `Fallacy of No Return // PHASE ${phase}`,
        vi: `Ngụy Thần Vô Quy // GIAI ĐOẠN ${phase}`
      },
      hp: phaseConfig.hp,
      maxHp: phaseConfig.hp,
      vibration: 120,
      maxVibration: 120,
      staggerTimer: 0,
      atk: 1600 * phaseConfig.attackSpeed,
      attackSpeed: phaseConfig.attackSpeed,
      parryWindowMs: phaseConfig.parryWindowMs,
      element: phase === 1 ? 'Spectro' : (phase === 2 ? 'Electro' : 'Havoc'),
      isBoss: true,
      x: canvasW - 200,
      y: floorY - 65,
      width: 180,
      height: 220,
      sprite: spriteUrl,
      telegraphType: null,
      telegraphTimer: 0,
      attackCooldown: 3.6 / phaseConfig.attackSpeed,
      animBob: 0
    }];

    this.getImage(spriteUrl);
  }

  // Game Loop (60FPS)
  loop(timestamp) {
    if (this.battleState !== 'fighting') return;

    const dt = Math.min(0.1, (timestamp - (this.lastTime || timestamp)) / 1000) * this.speedMultiplier;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    this.animFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    // 1. Update Timer
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endBattle(false);
      return;
    }

    // 2. Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake -= dt * 30;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // 3. Update Squad Runtime
    const activeRes = this.squadRuntime[this.activeSlot];
    if (activeRes) {
      if (activeRes.skillCd > 0) {
        activeRes.skillCd -= dt;
        if (activeRes.skillCd < 0) activeRes.skillCd = 0;
      }
      if (activeRes.forteCd > 0) activeRes.forteCd -= dt;
      if (activeRes.attackTimer > 0) {
        activeRes.attackTimer -= dt;
        if (activeRes.attackTimer <= 0) {
          activeRes.isAttacking = false;
          activeRes.animX = 0;
        }
      }
    }

    // Passive Concerto generation on standby
    this.squadRuntime.forEach((res, i) => {
      if (i !== this.activeSlot && res.concerto < 100) {
        res.concerto = Math.min(100, res.concerto + dt * 4);
      }
    });

    // 4. Update Enemies & Telegraphs
    this.enemies.forEach(enemy => {
      if (enemy.staggerTimer > 0) {
        enemy.staggerTimer -= dt;
        return; // Staggered, cannot attack
      }

      enemy.attackCooldown -= dt;
      if (enemy.attackCooldown <= 0) {
        // Trigger Telegraph: randomly Parry (Gold Circle) or Dodge (Red Flash)
        enemy.telegraphType = Math.random() < 0.5 ? 'parry' : 'dodge';
        enemy.telegraphTimer = (enemy.parryWindowMs ? enemy.parryWindowMs / 1000 : 0.85);
        enemy.attackCooldown = 3.5 + Math.random() * 2.0;
      }

      if (enemy.telegraphTimer > 0) {
        enemy.telegraphTimer -= dt;
        if (enemy.telegraphTimer <= 0) {
          // Boss attacks and lands hit if player didn't parry/dodge!
          this.enemyDealDamage(enemy);
          enemy.telegraphType = null;
        }
      }
    });

    // 5. AI Auto-Battle & Quickswap Algorithm (when AUTO: ON)
    if (this.isAuto) {
      this.runAiCombatLogic(dt);
    }

    // 6. Update Visual Particles & Floating Text
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.5;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.2;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.radius += dt * 300;
      s.alpha -= dt * 3.5;
      if (s.alpha <= 0) this.slashes.splice(i, 1);
    }

    this.updateHUD();
  }

  // AI Auto-Battle Quickswap Brain
  runAiCombatLogic(dt) {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes) return;

    // A. Frame-perfect Reaction to Enemy Telegraphs
    const dangerEnemy = this.enemies.find(e => e.telegraphTimer > 0.05 && e.telegraphTimer < 0.6);
    if (dangerEnemy) {
      this.triggerDodgeOrParry();
      return;
    }

    // B. Meta Quickswap Rotation Logic
    // If active is Support and Concerto full -> Swap to Sub-DPS
    // If active is Sub-DPS and Concerto full -> Swap to Main DPS
    // If active is Main DPS and Concerto empty -> Swap to Support
    if (activeRes.concerto >= 100) {
      if (activeRes.data.role === 'support') {
        const subSlot = this.squadRuntime.findIndex(r => r.data.role === 'sub_dps');
        if (subSlot !== -1 && subSlot !== this.activeSlot) {
          this.swapResonator(subSlot);
          return;
        }
      } else if (activeRes.data.role === 'sub_dps') {
        const mainSlot = this.squadRuntime.findIndex(r => r.data.role === 'main_dps');
        if (mainSlot !== -1 && mainSlot !== this.activeSlot) {
          this.swapResonator(mainSlot);
          return;
        }
      }
    }

    // C. Skill Execution Priority: Liberation -> Forte Nuke -> Resonance Skill -> Basic Attack
    if (activeRes.liberationEnergy >= 100) {
      this.triggerLiberation();
    } else if (activeRes.forte >= 100) {
      this.triggerForte();
    } else if (activeRes.skillCd <= 0) {
      this.triggerSkill();
    } else {
      this.triggerBasicAttack();
    }
  }

  // Player Actions: Basic Attack (J)
  triggerBasicAttack() {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes || activeRes.attackTimer > 0.1) return;

    activeRes.isAttacking = true;
    activeRes.attackTimer = 0.22;
    activeRes.animX = 40;

    const stats = activeRes.data.combatStats;
    const baseAtk = stats.atk || 2200;
    const mult = stats.skills?.basic?.multiplier || 1.3;
    const isCrit = Math.random() < (stats.critRate || 0.7);
    const dmg = Math.round(baseAtk * mult * (isCrit ? stats.critDmg : 1) * (1 + this.combo * 0.01));

    // Build Concerto & Forte
    activeRes.concerto = Math.min(100, activeRes.concerto + (stats.skills?.basic?.concertoGain || 12));
    activeRes.forte = Math.min(100, activeRes.forte + 15);
    activeRes.liberationEnergy = Math.min(100, activeRes.liberationEnergy + 8);

    this.dealDamageToEnemies(dmg, activeRes.data.element, isCrit, false);
    this.addSlashEffect(activeRes.data.element);
    if (window.soundFX) window.soundFX.playClick();
  }

  // Player Actions: Resonance Skill (E)
  triggerSkill() {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes || activeRes.skillCd > 0) return;

    activeRes.skillCd = activeRes.skillMaxCd;
    activeRes.isAttacking = true;
    activeRes.attackTimer = 0.35;
    activeRes.animX = 65;
    this.screenShake = 6;

    const stats = activeRes.data.combatStats;
    const baseAtk = stats.atk || 2200;
    const mult = stats.skills?.skill?.multiplier || 3.4;
    const isCrit = Math.random() < (stats.critRate || 0.75);
    const dmg = Math.round(baseAtk * mult * (isCrit ? stats.critDmg : 1) * 1.2);

    // Hazard Buff check in ToA (30% bonus upon swap)
    const hazardMult = (this.selectedMode === 'toa' && this.hasIntroBuff) ? 1.3 : 1.0;

    activeRes.concerto = Math.min(100, activeRes.concerto + (stats.skills?.skill?.concertoGain || 30));
    activeRes.forte = Math.min(100, activeRes.forte + 30);
    activeRes.liberationEnergy = Math.min(100, activeRes.liberationEnergy + 18);

    // Support Heal
    if (stats.skills?.skill?.healTeam) {
      this.squadRuntime.forEach(r => {
        r.hp = Math.min(r.maxHp, r.hp + stats.skills.skill.healTeam);
        this.addFloatingText(`+${stats.skills.skill.healTeam}`, r.x, r.y - 40, '#34d399', 16);
      });
    }

    this.dealDamageToEnemies(Math.round(dmg * hazardMult), activeRes.data.element, isCrit, true);
    this.addSlashEffect(activeRes.data.element, 1.8);
    this.spawnParticles(activeRes.x + 80, activeRes.y, this.getElementColor(activeRes.data.element), 18);
  }

  // Player Actions: Forte Circuit Nuke (F)
  triggerForte() {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes || activeRes.forte < 100) return;

    activeRes.forte = 0;
    activeRes.isAttacking = true;
    activeRes.attackTimer = 0.45;
    activeRes.animX = 85;
    this.screenShake = 12;

    const stats = activeRes.data.combatStats;
    const baseAtk = stats.atk || 2200;
    const mult = stats.skills?.forte?.multiplier || 6.8;
    const isCrit = Math.random() < (stats.critRate || 0.8);
    const dmg = Math.round(baseAtk * mult * (isCrit ? stats.critDmg : 1) * 1.4);

    activeRes.concerto = Math.min(100, activeRes.concerto + 35);
    activeRes.liberationEnergy = Math.min(100, activeRes.liberationEnergy + 25);

    this.dealDamageToEnemies(dmg, activeRes.data.element, isCrit, true, 25);
    this.addSlashEffect(activeRes.data.element, 2.5);
    this.spawnParticles(activeRes.x + 120, activeRes.y, '#facc15', 30);
    this.addFloatingText("⚡ FORTE NUKE!", activeRes.x + 40, activeRes.y - 70, '#facc15', 18);
  }

  // Player Actions: Resonance Liberation (R)
  triggerLiberation() {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes || activeRes.liberationEnergy < 100) return;

    activeRes.liberationEnergy = 0;
    this.screenShake = 22;

    const stats = activeRes.data.combatStats;
    const baseAtk = stats.atk || 2200;
    const mult = stats.skills?.liberation?.multiplier || 8.5;
    const isCrit = Math.random() < (stats.critRate || 0.85);
    const dmg = Math.round(baseAtk * mult * (isCrit ? stats.critDmg : 1) * 1.8);

    // Supernova flash
    const flashEl = document.getElementById('wuwa-video-flash');
    if (flashEl) {
      flashEl.style.opacity = '0.85';
      setTimeout(() => { flashEl.style.opacity = '0'; }, 250);
    }

    this.dealDamageToEnemies(dmg, activeRes.data.element, isCrit, true, 45);
    this.addSlashEffect(activeRes.data.element, 3.5);
    this.spawnParticles(this.canvas.width / 2, this.canvas.height / 2, this.getElementColor(activeRes.data.element), 60);
    this.addFloatingText(`💥 ${activeRes.data.name.en} LIBERATION!`, this.canvas.width / 2, 120, '#ffffff', 24);
  }

  // Player Actions: Dodge Counter / Parry (Space / Shift)
  triggerDodgeOrParry() {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes) return;

    let handled = false;
    this.enemies.forEach(enemy => {
      if (enemy.telegraphTimer > 0) {
        if (enemy.telegraphType === 'parry') {
          // SUCCESSFUL PARRY!
          handled = true;
          enemy.telegraphType = null;
          enemy.telegraphTimer = 0;
          enemy.vibration = Math.max(0, enemy.vibration - 45);
          if (enemy.vibration <= 0) {
            enemy.staggerTimer = 4.0; // 4s stagger window
            this.addFloatingText("💫 VIBRATION BROKEN!", enemy.x, enemy.y - 80, '#facc15', 22);
          }

          this.score += 500;
          this.combo += 5;
          this.screenShake = 14;
          this.addFloatingText("⚔️ PERFECT PARRY! +500", enemy.x, enemy.y - 50, '#facc15', 20);
          this.spawnParticles(enemy.x, enemy.y, '#facc15', 30);
          activeRes.concerto = Math.min(100, activeRes.concerto + 25);
        } else if (enemy.telegraphType === 'dodge') {
          // PERFECT DODGE COUNTER!
          handled = true;
          enemy.telegraphType = null;
          enemy.telegraphTimer = 0;
          this.score += 300;
          this.combo += 4;
          this.screenShake = 10;
          this.addFloatingText("✨ PERFECT DODGE! +300", activeRes.x + 30, activeRes.y - 50, '#38bdf8', 20);
          this.spawnParticles(activeRes.x, activeRes.y, '#38bdf8', 25);

          // Counter Strike Damage
          const counterDmg = Math.round(activeRes.data.combatStats.atk * 3.5);
          this.dealDamageToEnemies(counterDmg, activeRes.data.element, true, false);
        }
      }
    });

    if (!handled) {
      // Regular dash dodge animation
      activeRes.animX = 50;
      setTimeout(() => { activeRes.animX = 0; }, 180);
    }
  }

  // Player Actions: Swap Resonator (1, 2, 3)
  swapResonator(newSlot) {
    if (newSlot === this.activeSlot || newSlot >= this.squadRuntime.length) return;
    const oldRes = this.squadRuntime[this.activeSlot];
    const newRes = this.squadRuntime[newSlot];

    const hasFullConcerto = oldRes.concerto >= 100;
    oldRes.concerto = 0;
    this.activeSlot = newSlot;

    newRes.animX = 70;
    setTimeout(() => { newRes.animX = 0; }, 250);

    if (hasFullConcerto) {
      // Trigger Intro & Outro Synergy!
      this.hasIntroBuff = true;
      setTimeout(() => { this.hasIntroBuff = false; }, 8000);

      this.score += 350;
      this.combo += 3;
      this.screenShake = 8;
      const introDmg = Math.round(newRes.data.combatStats.atk * 2.8);
      this.dealDamageToEnemies(introDmg, newRes.data.element, true, true);
      this.addFloatingText(`🌪️ ${newRes.data.name.en} INTRO SKILL!`, newRes.x, newRes.y - 60, '#d4b475', 18);
      this.spawnParticles(newRes.x, newRes.y, this.getElementColor(newRes.data.element), 30);
    }

    this.updateHUD();
  }

  // Damage pipeline
  dealDamageToEnemies(rawDmg, element, isCrit, isAoe, vibrationDamage = 10) {
    if (this.enemies.length === 0) return;

    this.combo++;
    this.score += Math.round(rawDmg * 0.1);

    const hitEnemies = isAoe ? this.enemies : [this.enemies[0]];
    const color = this.getElementColor(element);

    hitEnemies.forEach(enemy => {
      enemy.hp -= rawDmg;
      if (vibrationDamage > 0) {
        enemy.vibration = Math.max(0, enemy.vibration - vibrationDamage);
        if (enemy.vibration <= 0 && enemy.staggerTimer <= 0) {
          enemy.staggerTimer = 3.5;
          this.addFloatingText("STAGGERED!", enemy.x, enemy.y - 70, '#facc15', 18);
        }
      }

      this.addFloatingText(
        (isCrit ? `${rawDmg}!` : `${rawDmg}`),
        enemy.x + (Math.random() * 40 - 20),
        enemy.y - 20 - (Math.random() * 30),
        color,
        isCrit ? 22 : 16
      );
    });

    // Check defeated enemies
    this.checkEnemiesStatus();
  }

  enemyDealDamage(enemy) {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes) return;

    const dmg = enemy.atk || 800;
    activeRes.hp = Math.max(0, activeRes.hp - dmg);
    this.combo = 0;
    this.screenShake = 10;
    this.addFloatingText(`-${dmg}`, activeRes.x, activeRes.y - 30, '#f43f5e', 20);

    if (activeRes.hp <= 0) {
      // Find next alive resonator
      const nextAlive = this.squadRuntime.findIndex(r => r.hp > 0);
      if (nextAlive !== -1) {
        this.swapResonator(nextAlive);
      } else {
        this.endBattle(false);
      }
    }
  }

  checkEnemiesStatus() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) {
        this.score += (e.pointsPerKill || 500);
        this.spawnParticles(e.x, e.y, '#facc15', 25);
        this.enemies.splice(i, 1);
      }
    }

    if (this.enemies.length === 0) {
      if (this.selectedMode === 'toa') {
        this.endBattle(true);
      } else if (this.selectedMode === 'ww') {
        const nextWave = this.waveIndex + 1;
        const totalWaves = window.wuwaMasterData?.combatModesData?.whimpering_wastes?.waves?.length || 4;
        if (nextWave < totalWaves) {
          this.spawnWwWave(nextWave);
          this.addFloatingText(`🌊 WAVE ${nextWave + 1} START!`, this.canvas.width / 2, 100, '#38bdf8', 24);
        } else {
          this.endBattle(true);
        }
      } else if (this.selectedMode === 'matrix') {
        const nextPhase = this.bossPhase + 1;
        if (nextPhase <= 3) {
          this.spawnMatrixBoss(nextPhase);
          this.addFloatingText(`⚠️ OVERCLOCK PHASE ${nextPhase}!`, this.canvas.width / 2, 100, '#ec4899', 26);
        } else {
          this.endBattle(true);
        }
      }
    }
  }

  endBattle(isVictory) {
    this.battleState = 'ended';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const modal = document.getElementById('combat-result-modal');
    const content = document.getElementById('combat-result-content');
    if (!modal || !content) return;

    const lang = window.wuwaI18n ? window.wuwaI18n.getLang() : 'vi';
    const t = (k) => window.wuwaI18n ? window.wuwaI18n.t(k) : k;

    let rewardBadge = '';
    if (this.selectedMode === 'toa') {
      const crests = this.timeLeft >= 150 ? 3 : (this.timeLeft >= 120 ? 2 : (this.timeLeft >= 60 ? 1 : 0));
      rewardBadge = `
        <div class="text-amber-400 font-orbitron font-black text-xl flex items-center justify-center gap-1.5 my-3">
          ${'⭐'.repeat(crests)} <span class="text-white">${crests} / 3 Crests</span>
        </div>
      `;
    } else if (this.selectedMode === 'ww') {
      const rank = this.score >= 6000 ? 'SSS' : (this.score >= 4500 ? 'S' : (this.score >= 3000 ? 'A' : 'B'));
      rewardBadge = `
        <div class="font-orbitron font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-500 to-purple-400 my-3">
          RANK: ${rank}
        </div>
      `;
    } else {
      rewardBadge = `
        <div class="font-orbitron font-bold text-lg text-cyan-300 my-3">
          Matrix Overclock Complete • Phase ${this.bossPhase} Cleared
        </div>
      `;
    }

    content.innerHTML = `
      <div class="text-center p-6 sm:p-8">
        <div class="w-16 h-16 mx-auto rounded-3xl ${isVictory ? 'bg-amber-400/20 border-2 border-amber-400 text-amber-300' : 'bg-rose-500/20 border-2 border-rose-500 text-rose-400'} flex items-center justify-center shadow-2xl mb-4">
          <i data-lucide="${isVictory ? 'trophy' : 'alert-triangle'}" class="w-8 h-8"></i>
        </div>

        <h2 class="font-orbitron font-black text-xl sm:text-3xl text-white">
          ${isVictory ? t('combatUI.victory') : t('combatUI.defeat')}
        </h2>

        ${rewardBadge}

        <div class="grid grid-cols-3 gap-3 my-5 font-mono text-xs max-w-md mx-auto">
          <div class="p-3 rounded-xl bg-black/60 border border-white/10">
            <div class="text-slate-400 text-[10px] uppercase">${t('combatUI.score')}</div>
            <div class="font-bold text-amber-300 text-base mt-0.5">${this.score.toLocaleString()}</div>
          </div>
          <div class="p-3 rounded-xl bg-black/60 border border-white/10">
            <div class="text-slate-400 text-[10px] uppercase">${t('combatUI.timeRemaining')}</div>
            <div class="font-bold text-cyan-300 text-base mt-0.5">${Math.round(this.timeLeft)}s</div>
          </div>
          <div class="p-3 rounded-xl bg-black/60 border border-white/10">
            <div class="text-slate-400 text-[10px] uppercase">Combo Max</div>
            <div class="font-bold text-purple-300 text-base mt-0.5">${this.combo}x</div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-3 mt-6">
          <button onclick="window.wuwaCombat.startBattle()"
                  class="btn-summon-glow text-white font-orbitron font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer active:scale-95">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>${t('combatUI.restartBattle')}</span>
          </button>
          <button onclick="window.wuwaCombat.exitToSetup()"
                  class="glass-panel hover:bg-slate-800 text-slate-300 font-orbitron font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer">
            <span>${t('combatUI.backToSetup')}</span>
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }

  exitToSetup() {
    const modal = document.getElementById('combat-result-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    const battlePanel = document.getElementById('combat-battle-panel');
    const setupPanel = document.getElementById('combat-setup-panel');
    if (battlePanel) battlePanel.classList.add('hidden');
    if (setupPanel) setupPanel.classList.remove('hidden');
    this.battleState = 'setup';
  }

  toggleAuto() {
    this.isAuto = !this.isAuto;
    const autoBtn = document.getElementById('combat-auto-btn');
    if (autoBtn) {
      autoBtn.className = this.isAuto
        ? "px-3.5 py-1.5 rounded-xl font-orbitron font-black text-xs border border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all cursor-pointer"
        : "px-3.5 py-1.5 rounded-xl font-orbitron font-bold text-xs border border-white/20 bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer";
      autoBtn.innerText = this.isAuto ? "AUTO: ON (P)" : "AUTO: OFF (P)";
    }
  }

  toggleSpeed() {
    this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
    const speedBtn = document.getElementById('combat-speed-btn');
    if (speedBtn) {
      speedBtn.innerText = `${this.speedMultiplier}x Speed`;
      speedBtn.className = this.speedMultiplier === 2
        ? "px-3 py-1.5 rounded-xl font-orbitron font-black text-xs border border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all cursor-pointer"
        : "px-3 py-1.5 rounded-xl font-orbitron font-bold text-xs border border-white/20 bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer";
    }
  }

  // Draw 2D Chibi Canvas (60FPS)
  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const floorY = h * 0.68;

    ctx.save();

    // Screen Shake offset
    if (this.screenShake > 0) {
      const ox = (Math.random() - 0.5) * this.screenShake;
      const oy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(ox, oy);
    }

    // 1. Draw Authentic Stage Backdrop Image (ToA / WW / Matrix)
    const stageBgUrl = this.getStageBackgroundUrl();
    const stageImg = this.getImage(stageBgUrl);

    if (stageImg && stageImg.complete && stageImg.naturalWidth > 0) {
      // Draw backdrop covering the canvas with nice cinematic tint
      ctx.drawImage(stageImg, 0, 0, w, h);

      // Vignette & Floor lighting overlay
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, h);
      overlayGrad.addColorStop(0, 'rgba(5, 7, 13, 0.60)');
      overlayGrad.addColorStop(0.55, 'rgba(10, 14, 25, 0.40)');
      overlayGrad.addColorStop(1, 'rgba(5, 7, 13, 0.88)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Fallback sci-fi gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a0d17');
      bgGrad.addColorStop(1, '#05070c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Dynamic Sci-Fi Floor Platform Grid
    const gridGrad = ctx.createLinearGradient(0, floorY, 0, h);
    gridGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
    gridGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = gridGrad;
    ctx.fillRect(0, floorY, w, h - floorY);

    ctx.strokeStyle = 'rgba(212, 180, 117, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    // Perspective Arena Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x * 1.3 - w * 0.15, h);
      ctx.stroke();
    }

    // 2. Draw Slashes FX
    this.slashes.forEach(s => {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 4. Draw Enemies
    this.enemies.forEach(enemy => {
      this.drawEnemy(enemy);
    });

    // 5. Draw Player Resonators (Standby Bench + Active Chibi)
    this.squadRuntime.forEach((res, idx) => {
      if (idx !== this.activeSlot) {
        // Bench mini chibi
        this.drawBenchResonator(res, idx);
      }
    });

    const activeRes = this.squadRuntime[this.activeSlot];
    if (activeRes) {
      this.drawActiveResonator(activeRes);
    }

    // 6. Draw Floating Combat Damage Numbers
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = `bold ${ft.size}px 'Orbitron', monospace`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  drawActiveResonator(res) {
    const ctx = this.ctx;
    const x = res.x + (res.animX || 0);
    const y = res.y;
    const elemColor = this.getElementColor(res.data.element);

    // Chibi Sprite / Avatar Image
    const img = this.getImage(res.data.assets.chibi || res.data.assets.avatar);
    const size = 95;

    ctx.save();

    // Floor Shadow & Elemental Glow Aura
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 42, 45, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = elemColor;
    ctx.shadowBlur = res.concerto >= 100 ? 25 : 12;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    } else {
      // Procedural Chibi fallback
      ctx.fillStyle = elemColor;
      ctx.beginPath();
      ctx.arc(x, y, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active Resonator Header Tag
    ctx.font = "bold 11px 'Orbitron', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(res.data.name.en, x, y - 55);

    // Mini HP & Concerto Bar above head
    const barW = 70;
    const hpPct = Math.max(0, res.hp / res.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - barW / 2, y - 48, barW, 5);
    ctx.fillStyle = "#34d399";
    ctx.fillRect(x - barW / 2, y - 48, barW * hpPct, 5);

    // Concerto Bar
    const concPct = Math.max(0, res.concerto / 100);
    ctx.fillStyle = res.concerto >= 100 ? "#facc15" : elemColor;
    ctx.fillRect(x - barW / 2, y - 42, barW * concPct, 3);

    ctx.restore();
  }

  drawBenchResonator(res, slotIdx) {
    const ctx = this.ctx;
    const bx = 65 + slotIdx * 45;
    const by = (this.canvas ? this.canvas.height * 0.42 : 180);
    const elemColor = this.getElementColor(res.data.element);
    const img = this.getImage(res.data.assets.avatar);
    const size = 38;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(bx, by, size / 2 + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = res.concerto >= 100 ? "#facc15" : elemColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, bx - size / 2, by - size / 2, size, size);
      ctx.restore();
    }

    // Hotkey badge (1, 2, 3)
    ctx.fillStyle = res.concerto >= 100 ? "#facc15" : "#ffffff";
    ctx.font = "bold 9px 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${slotIdx + 1}`, bx, by + size / 2 + 10);

    ctx.restore();
  }

  drawEnemy(enemy) {
    const ctx = this.ctx;
    const x = enemy.x;
    // Add subtle idle floating / breathing animation
    const bob = Math.sin((performance.now() / 600) + (enemy.animBob || 0)) * (enemy.isBoss ? 4 : 2);
    const y = enemy.y + bob;
    const elemColor = this.getElementColor(enemy.element);

    ctx.save();

    // 1. Dynamic Floor Shadow (scaled by height above ground)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, enemy.y + (enemy.height * 0.42), enemy.width * 0.45, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Telegraph Indicators (Parry / Dodge)
    if (enemy.telegraphTimer > 0) {
      if (enemy.telegraphType === 'parry') {
        // GOLDEN CIRCLE PARRY WINDOW!
        const maxTime = enemy.parryWindowMs ? enemy.parryWindowMs / 1000 : 0.85;
        const progress = Math.max(0, enemy.telegraphTimer / maxTime);
        const radius = 40 + progress * 60;

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 24;

        ctx.beginPath();
        ctx.arc(x, y - 20, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "bold 14px 'Orbitron', sans-serif";
        ctx.fillStyle = "#facc15";
        ctx.textAlign = "center";
        ctx.fillText("⚡ PARRY (SPACE)!", x, y - radius - 15);
      } else if (enemy.telegraphType === 'dodge') {
        // RED FLASH DANGER TELEGRAPH!
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 28;

        ctx.beginPath();
        ctx.arc(x, y - 20, 55, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "bold 14px 'Orbitron', sans-serif";
        ctx.fillStyle = "#f43f5e";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ DODGE (SPACE)!", x, y - 75);
      }
    }

    // 3. Boss / Mob Sprite Rendering (Real Visual Assets)
    const spriteImg = enemy.sprite ? this.getImage(enemy.sprite) : null;

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      // Glow Aura around sprite
      ctx.shadowColor = elemColor;
      ctx.shadowBlur = enemy.isBoss ? 28 : 14;

      // If staggered, wobble and dim
      if (enemy.staggerTimer > 0) {
        ctx.globalAlpha = 0.7;
        const wobble = Math.sin(performance.now() * 0.05) * 6;
        ctx.drawImage(spriteImg, x - (enemy.width / 2) + wobble, y - (enemy.height / 2), enemy.width, enemy.height);
        ctx.globalAlpha = 1.0;

        // Dazed stars
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("💫", x, y - (enemy.height / 2) - 30);
      } else {
        ctx.drawImage(spriteImg, x - (enemy.width / 2), y - (enemy.height / 2), enemy.width, enemy.height);
      }
    } else {
      // High-tech Cybernetic Silhouette Fallback (No emojis!)
      ctx.fillStyle = enemy.staggerTimer > 0 ? '#475569' : '#1e1b4b';
      ctx.strokeStyle = elemColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = elemColor;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.roundRect(x - enemy.width / 2, y - enemy.height / 2, enemy.width, enemy.height, enemy.isBoss ? 20 : 12);
      ctx.fill();
      ctx.stroke();

      // Stylized Crest
      ctx.fillStyle = elemColor;
      ctx.font = "bold 13px 'Orbitron', monospace";
      ctx.textAlign = "center";
      ctx.fillText(enemy.isBoss ? "[OVERLORD]" : "[TACET DISCORD]", x, y + 5);
    }

    // 4. Enemy Header Tag & HP / Vibration Gauges
    const barW = enemy.isBoss ? 170 : 80;
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
    const lang = window.wuwaI18n ? window.wuwaI18n.getLang() : 'vi';
    const enemyDisplayName = typeof enemy.name === 'object' ? (enemy.name[lang] || enemy.name.en) : enemy.name;

    ctx.font = `bold ${enemy.isBoss ? 12 : 10}px 'Orbitron', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 6;
    ctx.fillText(enemyDisplayName, x, y - (enemy.height / 2) - 22);

    // HP Bar Outer Frame
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(x - barW / 2, y - (enemy.height / 2) - 15, barW, 7);
    // HP Bar Fill
    ctx.fillStyle = enemy.isBoss ? "#f43f5e" : "#f97316";
    ctx.fillRect(x - barW / 2, y - (enemy.height / 2) - 15, barW * hpPct, 7);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barW / 2, y - (enemy.height / 2) - 15, barW, 7);

    // Vibration Gauge (Bosses)
    if (enemy.isBoss && enemy.maxVibration) {
      const vibPct = Math.max(0, enemy.vibration / enemy.maxVibration);
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(x - barW / 2, y - (enemy.height / 2) - 7, barW, 4);
      ctx.fillStyle = enemy.staggerTimer > 0 ? "#cbd5e1" : "#facc15";
      ctx.fillRect(x - barW / 2, y - (enemy.height / 2) - 7, barW * vibPct, 4);
    }

    ctx.restore();
  }

  // FX Helpers
  addSlashEffect(element, scale = 1.0) {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes) return;
    this.slashes.push({
      x: activeRes.x + 80,
      y: activeRes.y - 10,
      radius: 20 * scale,
      color: this.getElementColor(element),
      alpha: 1.0
    });
  }

  spawnParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3.5,
        alpha: 1.0
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffffff', size = 18) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      alpha: 1.0,
      vy: -40
    });
  }

  getElementColor(element) {
    const colors = {
      Glacio: '#38bdf8',
      Fusion: '#f97316',
      Electro: '#c084fc',
      Aero: '#2dd4bf',
      Spectro: '#facc15',
      Havoc: '#f43f5e'
    };
    return colors[element] || '#d4b475';
  }

  // Sync Bottom & Top HUD with current battle state
  updateHUD() {
    const activeRes = this.squadRuntime[this.activeSlot];
    if (!activeRes) return;

    // Timer & Score
    const timeEl = document.getElementById('combat-timer-text');
    if (timeEl) timeEl.innerText = `${Math.ceil(this.timeLeft)}s`;

    const scoreEl = document.getElementById('combat-score-text');
    if (scoreEl) scoreEl.innerText = this.score.toLocaleString();

    const comboEl = document.getElementById('combat-combo-text');
    if (comboEl) comboEl.innerText = `${this.combo}x COMBO`;

    // Active Resonator Skills UI
    const skillBtn = document.getElementById('combat-btn-skill');
    if (skillBtn) {
      const cdEl = skillBtn.querySelector('.cd-text');
      if (cdEl) {
        cdEl.innerText = activeRes.skillCd > 0 ? `${activeRes.skillCd.toFixed(1)}s` : 'E';
      }
      skillBtn.classList.toggle('opacity-50', activeRes.skillCd > 0);
    }

    const forteBtn = document.getElementById('combat-btn-forte');
    if (forteBtn) {
      const isReady = activeRes.forte >= 100;
      forteBtn.classList.toggle('shadow-[0_0_20px_#facc15]', isReady);
      forteBtn.classList.toggle('border-yellow-300', isReady);
      const forteFill = forteBtn.querySelector('.forte-fill');
      if (forteFill) forteFill.style.width = `${activeRes.forte}%`;
    }

    const libBtn = document.getElementById('combat-btn-liberation');
    if (libBtn) {
      const isReady = activeRes.liberationEnergy >= 100;
      libBtn.classList.toggle('shadow-[0_0_25px_#facc15]', isReady);
      libBtn.classList.toggle('animate-pulse', isReady);
      const libFill = libBtn.querySelector('.lib-fill');
      if (libFill) libFill.style.width = `${activeRes.liberationEnergy}%`;
    }

    // Squad Slot Cards (1, 2, 3)
    this.squadRuntime.forEach((res, idx) => {
      const card = document.getElementById(`combat-squad-slot-${idx}`);
      if (card) {
        card.classList.toggle('ring-2', idx === this.activeSlot);
        card.classList.toggle('ring-amber-400', idx === this.activeSlot);

        const hpBar = card.querySelector('.slot-hp-bar');
        if (hpBar) hpBar.style.width = `${Math.max(0, (res.hp / res.maxHp) * 100)}%`;

        const concertoBar = card.querySelector('.slot-concerto-bar');
        if (concertoBar) {
          concertoBar.style.width = `${res.concerto}%`;
          concertoBar.classList.toggle('bg-amber-400', res.concerto >= 100);
        }
      }
    });
  }

  setSquadFilter(filter) {
    this.squadFilter = filter;
    document.querySelectorAll('.element-filter-chip').forEach(btn => {
      const match = btn.innerText.toLowerCase().includes(filter.toLowerCase());
      btn.classList.toggle('active', match);
      btn.classList.toggle('bg-amber-500/20', match);
      btn.classList.toggle('text-amber-300', match);
      btn.classList.toggle('border-amber-400', match);
      btn.classList.toggle('border-white/10', !match);
      btn.classList.toggle('text-slate-300', !match);
    });
    this.renderSquadSelector();
  }

  setSquadSearch(query) {
    this.squadSearch = (query || '').toLowerCase().trim();
    this.renderSquadSelector();
  }

  removeFromSquad(id) {
    if (this.selectedSquad.length > 1) {
      this.selectedSquad = this.selectedSquad.filter(sid => sid !== id);
      this.initSquadRuntime();
      this.renderSquadSelector();
    }
  }

  renderSquadSelector() {
    const allResonators = window.wuwaMasterData?.resonators || [];
    const lang = window.wuwaI18n ? window.wuwaI18n.getLang() : 'vi';

    // 1. Render Selected Squad Dock (Slot 1 Main DPS, Slot 2 Sub-DPS, Slot 3 Support)
    const dock = document.getElementById('combat-selected-dock');
    if (dock) {
      const slotLabels = [
        { title: "SLOT 1 // MAIN DPS", role: "main_dps" },
        { title: "SLOT 2 // SUB-DPS", role: "sub_dps" },
        { title: "SLOT 3 // SUPPORT", role: "support" }
      ];

      dock.innerHTML = slotLabels.map((slot, idx) => {
        const resId = this.selectedSquad[idx];
        const res = resId ? allResonators.find(r => r.id === resId) : null;
        if (!res) {
          return `
            <div class="p-3 rounded-xl border border-dashed border-white/20 bg-black/40 flex items-center justify-center text-slate-500 font-mono text-xs">
              [+ CHỌN SLOT ${idx + 1}]
            </div>
          `;
        }

        const name = typeof res.name === 'object' ? (res.name[lang] || res.name.en) : res.name;
        const elemColor = this.getElementColor(res.element);

        return `
          <div class="relative p-2.5 rounded-xl border border-amber-400/40 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between gap-3 shadow-md group">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border flex-shrink-0" style="border-color: ${elemColor}">
                <img src="${res.assets?.avatar || res.assets?.chibi}" alt="${name}" class="w-full h-full object-cover object-top"
                     onerror="this.src='assets/jinhsi-official.webp'">
              </div>
              <div class="truncate">
                <span class="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400">${slot.title}</span>
                <div class="font-orbitron font-bold text-xs text-white truncate">${name}</div>
                <div class="text-[10px] font-mono text-slate-400">${res.element} • ${res.weapon}</div>
              </div>
            </div>
            ${this.selectedSquad.length > 1 ? `
              <button onclick="window.wuwaCombat.removeFromSquad('${res.id}')"
                      class="text-slate-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer" title="Đổi / Bỏ chọn">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    // 2. Render Roster Grid
    const container = document.getElementById('combat-squad-picker');
    if (!container) return;

    let filtered = allResonators;
    if (this.squadFilter && this.squadFilter !== 'all') {
      filtered = filtered.filter(r => r.element.toLowerCase() === this.squadFilter.toLowerCase());
    }
    if (this.squadSearch) {
      filtered = filtered.filter(r => {
        const en = (r.name?.en || '').toLowerCase();
        const vi = (r.name?.vi || '').toLowerCase();
        const elem = (r.element || '').toLowerCase();
        const role = (r.role || '').toLowerCase();
        return en.includes(this.squadSearch) || vi.includes(this.squadSearch) || elem.includes(this.squadSearch) || role.includes(this.squadSearch);
      });
    }

    container.innerHTML = filtered.map(r => {
      const isSelected = this.selectedSquad.includes(r.id);
      const elemColor = this.getElementColor(r.element);
      const name = typeof r.name === 'object' ? (r.name[lang] || r.name.en) : r.name;

      return `
        <div onclick="window.wuwaCombat.toggleResonatorSelection('${r.id}')"
             class="p-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${isSelected ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_18px_rgba(250,204,21,0.35)] scale-[1.02]' : 'bg-black/50 border-white/10 hover:border-white/30 hover:bg-black/70'}">
          <div class="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border flex-shrink-0" style="border-color: ${elemColor}">
            <img src="${r.assets.avatar || r.assets.chibi}" alt="${name}" class="w-full h-full object-cover object-top"
                 onerror="this.src='assets/jinhsi-official.webp'">
          </div>
          <div class="min-w-0">
            <div class="font-orbitron font-bold text-xs text-white truncate">${name}</div>
            <div class="text-[10px] font-mono text-slate-400 truncate">${r.element} • ${r.role.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  toggleResonatorSelection(id) {
    if (this.selectedSquad.includes(id)) {
      if (this.selectedSquad.length > 1) {
        this.selectedSquad = this.selectedSquad.filter(sid => sid !== id);
      }
    } else {
      if (this.selectedSquad.length < 3) {
        this.selectedSquad.push(id);
      } else {
        this.selectedSquad.shift();
        this.selectedSquad.push(id);
      }
    }
    this.initSquadRuntime();
    this.renderSquadSelector();
  }
}

window.wuwaCombat = new WuWaCombatArena();

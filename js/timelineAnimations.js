/**
 * AETHERIA TCG - Anime.js Choreographed Gacha Timelines
 * Manages the 4-Stage Summoning Sequence:
 * Stage 1: Charge & Anticipation
 * Stage 2: Climax, Pack Tear & Radial Flash
 * Stage 3: Staggered Card Deal
 * Stage 4: 3D Flip & Rolling Stat Counters
 */

class TimelineAnimationController {
  constructor() {
    this.isSummoning = false;
    this.currentPullResult = null;
    this.revealedCards = new Set();
  }

  // Trigger full 4-stage summon flow
  async executeSummonSequence(pullResult) {
    if (this.isSummoning) return;
    this.isSummoning = true;
    this.currentPullResult = pullResult;
    this.revealedCards.clear();

    const { cards, highestRarity, packType } = pullResult;

    // Set Three.js vortex target color & acceleration
    if (window.threeSceneManager) {
      window.threeSceneManager.setRarityVortex(highestRarity);
      window.threeSceneManager.setChargingState(true);
    }

    // Play synthesized charge hum
    if (window.soundFX) window.soundFX.playCharge(1.3);

    // ==========================================
    // STAGE 1: Charge & Anticipation (0 - 1300ms)
    // ==========================================
    await this.runStage1Charge();

    // ==========================================
    // STAGE 2: Climax, Tear & Shard Explosion (1300 - 2000ms)
    // ==========================================
    await this.runStage2TearAndExplosion(highestRarity);

    // ==========================================
    // STAGE 3: Staggered Card Deal (2000 - 3000ms)
    // ==========================================
    await this.runStage3StaggerDeal(cards, packType);

    this.isSummoning = false;
  }

  // Stage 1: HUD Fade & Magic Summon Circle Glow
  runStage1Charge() {
    return new Promise(resolve => {
      // 1. Fade out HUD controls
      anime({
        targets: '.hud-panel, .banner-selector-card, #summon-action-bar',
        opacity: [1, 0],
        translateY: [0, 25],
        easing: 'easeOutQuad',
        duration: 400
      });

      // 2. Show & Animate Summon Circle SVG
      const circleContainer = document.getElementById('summon-circle-container');
      if (circleContainer) {
        circleContainer.style.display = 'flex';
        anime({
          targets: circleContainer,
          opacity: [0, 1],
          scale: [0.6, 1.15],
          duration: 1200,
          easing: 'easeOutCubic'
        });

        anime({
          targets: '#summon-circle-container svg path',
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInOutSine',
          duration: 1200
        });

        anime({
          targets: '#summon-circle-container svg',
          rotate: [0, 360],
          duration: 1300,
          easing: 'linear'
        });
      }

      // 3. Screen anticipation micro-shake
      anime({
        targets: '#app-root',
        translateX: () => anime.random(-4, 4),
        translateY: () => anime.random(-4, 4),
        duration: 80,
        direction: 'alternate',
        loop: 8,
        easing: 'easeInOutSine',
        complete: () => {
          document.getElementById('app-root').style.transform = '';
          resolve();
        }
      });
    });
  }

  // Stage 2: Pack Explosion, Laser Slice & Fullscreen Flash
  runStage2TearAndExplosion(highestRarity) {
    return new Promise(resolve => {
      // Explode 3D Pack in Three.js (or Apex Supernova if UR!)
      if (window.threeSceneManager) {
        if (highestRarity === 'UR' && window.threeSceneManager.triggerApexSupernovaExplosion) {
          window.threeSceneManager.triggerApexSupernovaExplosion();
        } else {
          window.threeSceneManager.explodePack();
        }
      }

      // Audio: Explosion impact (or divine Supernova Rupture if UR!)
      if (window.soundFX) {
        if (highestRarity === 'UR' && window.soundFX.playSupernovaRupture) {
          window.soundFX.playSupernovaRupture();
        } else {
          window.soundFX.playExplosion();
        }
      }

      // If UR, trigger reality shatter SVG & chromatic inversion!
      if (highestRarity === 'UR') {
        const inv = document.getElementById('supernova-inversion-overlay');
        const shatterSvg = document.getElementById('supernova-reality-cracks-svg');
        if (inv) {
          inv.style.display = 'block';
          setTimeout(() => { inv.style.display = 'none'; }, 110);
        }
        if (shatterSvg) {
          shatterSvg.style.display = 'block';
          anime({
            targets: '#supernova-reality-cracks-svg path',
            strokeDashoffset: [anime.setDashoffset, 0],
            duration: 350,
            easing: 'easeOutExpo',
            complete: () => {
              setTimeout(() => {
                anime({
                  targets: shatterSvg,
                  opacity: [1, 0],
                  duration: 400,
                  easing: 'easeOutQuad',
                  complete: () => {
                    shatterSvg.style.display = 'none';
                    shatterSvg.style.opacity = '1';
                  }
                });
              }, 600);
            }
          });
        }
      }

      // Fullscreen Radial Flash Overlay
      const flashOverlay = document.getElementById('rarity-flash-overlay');
      const rarityColors = {
        UR: 'radial-gradient(circle, rgba(244,63,94,0.95) 0%, rgba(168,85,247,0.7) 40%, rgba(7,9,19,0.95) 100%)',
        SSR: 'radial-gradient(circle, rgba(250,204,21,0.95) 0%, rgba(245,158,11,0.7) 40%, rgba(7,9,19,0.95) 100%)',
        SR: 'radial-gradient(circle, rgba(192,132,252,0.95) 0%, rgba(147,51,234,0.7) 40%, rgba(7,9,19,0.95) 100%)',
        R: 'radial-gradient(circle, rgba(56,189,248,0.95) 0%, rgba(2,132,199,0.7) 40%, rgba(7,9,19,0.95) 100%)'
      };

      flashOverlay.style.background = rarityColors[highestRarity] || rarityColors.R;
      flashOverlay.style.display = 'block';

      // Spawn 40 radiating DOM energy shards
      this.spawnDomEnergyShards(highestRarity);

      // Flash animation timeline
      anime.timeline({
        complete: () => {
          flashOverlay.style.display = 'none';
          const circleContainer = document.getElementById('summon-circle-container');
          if (circleContainer) circleContainer.style.display = 'none';
          resolve();
        }
      })
      .add({
        targets: flashOverlay,
        opacity: [0, 1],
        duration: 180,
        easing: 'easeInQuad'
      })
      .add({
        targets: flashOverlay,
        opacity: [1, 0],
        duration: 550,
        easing: 'easeOutQuad'
      });
    });
  }

  // Spawn 35+ radiating DOM energy sparks
  spawnDomEnergyShards(rarity) {
    const container = document.getElementById('shard-particles-container');
    if (!container) return;
    container.innerHTML = '';
    container.style.display = 'block';

    const colors = {
      UR: ['#f43f5e', '#fbbf24', '#c084fc', '#38bdf8'],
      SSR: ['#facc15', '#f59e0b', '#fef08a', '#ffffff'],
      SR: ['#c084fc', '#9333ea', '#e9d5ff', '#38bdf8'],
      R: ['#38bdf8', '#0284c7', '#a5f3fc', '#ffffff']
    };
    const palette = colors[rarity] || colors.R;

    for (let i = 0; i < 36; i++) {
      const shard = document.createElement('div');
      shard.className = 'dom-energy-shard';
      const c = palette[i % palette.length];
      const size = anime.random(8, 22);
      shard.style.width = `${size}px`;
      shard.style.height = `${size * 2.2}px`;
      shard.style.background = c;
      shard.style.boxShadow = `0 0 16px ${c}`;
      shard.style.borderRadius = '30% 70% 70% 30% / 30% 30% 70% 70%';
      shard.style.position = 'absolute';
      shard.style.left = '50%';
      shard.style.top = '50%';
      container.appendChild(shard);
    }

    anime({
      targets: '.dom-energy-shard',
      translateX: () => anime.random(-window.innerWidth * 0.45, window.innerWidth * 0.45),
      translateY: () => anime.random(-window.innerHeight * 0.4, window.innerHeight * 0.4),
      rotate: () => anime.random(-360, 360),
      scale: [1.8, 0],
      opacity: [1, 0],
      easing: 'easeOutExpo',
      duration: anime.stagger(15, { start: 700 }),
      complete: () => {
        container.innerHTML = '';
        container.style.display = 'none';
      }
    });
  }

  // Stage 3: Staggered Card Deal onto Glassmorphic Grid
  runStage3StaggerDeal(cards, packType) {
    return new Promise(resolve => {
      const revealOverlay = document.getElementById('reveal-stage-overlay');
      const cardsGrid = document.getElementById('reveal-cards-grid');
      revealOverlay.classList.remove('hidden');
      revealOverlay.style.display = 'flex';
      cardsGrid.innerHTML = '';

      // Grid classes depending on card count (5 vs 10)
      const isMulti = cards.length > 5;
      if (isMulti) {
        cardsGrid.className = 'grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3 max-w-5xl w-full px-2 sm:px-4';
      } else {
        cardsGrid.className = 'grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 max-w-4xl w-full px-2 sm:px-4';
      }

      // Generate Card DOM Elements
      cards.forEach((card, index) => {
        const cardElem = this.createCardElement(card, index, isMulti);
        cardsGrid.appendChild(cardElem);
      });

      // Play card deal sound in staggered timing
      cards.forEach((_, idx) => {
        setTimeout(() => {
          if (window.soundFX) window.soundFX.playCardDeal(0.8 + idx * 0.05);
        }, idx * 100);
      });

      // Animate dealing with Anime.js stagger
      anime({
        targets: '.gacha-card-wrapper',
        translateY: [350, 0],
        scale: [0.15, 1],
        rotateZ: () => anime.random(-12, 12),
        opacity: [0, 1],
        delay: anime.stagger(110, { from: 'center' }),
        duration: 750,
        easing: 'easeOutBack(1.2)',
        complete: () => {
          // Reveal action buttons (e.g., Reveal All, Collect)
          const controls = document.getElementById('reveal-action-controls');
          controls.classList.remove('hidden');
          const collectBtn = document.getElementById('collect-cards-btn');
          if (collectBtn) collectBtn.classList.remove('hidden');

          anime({
            targets: controls,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 400,
            easing: 'easeOutQuad'
          });
          resolve();
        }
      });
    });
  }

  // Build card DOM structure (Face-down back + Face-up front)
  createCardElement(card, index, isMulti = false) {
    const wrap = document.createElement('div');
    wrap.className = 'gacha-card-wrapper relative cursor-pointer select-none';
    wrap.dataset.index = index;
    wrap.dataset.cardId = card.id;
    wrap.dataset.rarity = card.rarity;

    const isHighRarity = card.rarity === 'SSR' || card.rarity === 'UR';
    const auraGlow = isHighRarity
      ? (card.rarity === 'UR' ? 'aura-pulse-ur' : 'aura-pulse-ssr')
      : '';

    // Compact height for 10-card pulls to guarantee viewport fit
    const heightClass = isMulti
      ? 'h-[175px] xs:h-[190px] sm:h-[195px] md:h-[220px] lg:h-[235px]'
      : 'h-[240px] sm:h-[280px] md:h-[310px]';

    wrap.innerHTML = `
      <div class="card-inner-3d w-full ${heightClass} relative transition-transform duration-700">
        <!-- Aura Ring (SSR / UR excitement builder) -->
        <div class="card-aura-ring ${auraGlow}"></div>

        <!-- Back of Card (Face Down) -->
        <div class="card-face card-back absolute inset-0 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 sm:p-3 border border-cyan-500/30">
          <div class="card-back-bg absolute inset-0"></div>
          <div class="relative z-10 text-center">
            <div class="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 rounded-full border-2 border-cyan-400/50 flex items-center justify-center bg-black/40 shadow-inner backdrop-blur-sm">
              <i data-lucide="sparkles" class="w-5 h-5 sm:w-7 sm:h-7 text-cyan-300 animate-spin-slow"></i>
            </div>
            <div class="font-orbitron font-bold text-[10px] sm:text-xs tracking-widest text-cyan-200">AETHERIA</div>
            <div class="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">Tap To Reveal</div>
          </div>
          ${isHighRarity ? `<div class="absolute bottom-1.5 text-[8px] sm:text-[9px] font-orbitron font-semibold text-amber-300 animate-pulse">⚡ HIGH ENERGY</div>` : ''}
        </div>

        <!-- Front of Card (Face Up) -->
        <div class="card-face card-front absolute inset-0 rounded-xl overflow-hidden shadow-2xl flex flex-col border border-white/20 holo-${card.foilType}">
          <!-- Holographic Shimmer Grating -->
          <div class="holo-shimmer-layer"></div>
          <div class="holo-specular-glare"></div>

          <!-- Header: Name & Rarity Badge -->
          <div class="p-1.5 sm:p-2 bg-black/70 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-10">
            <span class="font-orbitron font-bold text-[9px] sm:text-[11px] text-white truncate max-w-[65%]" title="${card.name}">${card.name}</span>
            <span class="badge-${card.rarity.toLowerCase()} text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-orbitron tracking-wider">
              ${card.rarity}
            </span>
          </div>

          <!-- Card Artwork Container -->
          <div class="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center min-h-0">
            <img src="${card.image || ''}" alt="${card.name}"
                 class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                 onerror="window.cardDataService.handleImageError(this, '${card.id}');">
            
            ${card.isNew ? '<span class="absolute top-1 left-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-[8px] px-1 py-0.5 rounded shadow-lg uppercase font-orbitron">NEW!</span>' : ''}
            ${card.duplicateCount > 1 ? `<span class="absolute top-1 right-1 bg-purple-900/90 text-purple-200 border border-purple-400/50 font-bold text-[8px] px-1 py-0.5 rounded shadow font-mono">x${card.duplicateCount}</span>` : ''}
          </div>

          <!-- Footer: Card Type, ATK/DEF / Power Rollup -->
          <div class="p-1.5 sm:p-2 bg-black/85 backdrop-blur-md border-t border-white/10 flex flex-col gap-0.5 z-10">
            <div class="text-[8px] sm:text-[9px] text-slate-400 truncate font-mono">${card.type}</div>
            <div class="flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-bold">
              <span class="text-rose-400 flex items-center gap-1">
                ATK <span class="stat-roll-atk text-white font-orbitron" data-val="${card.atk}">0</span>
              </span>
              <span class="text-sky-400 flex items-center gap-1">
                DEF <span class="stat-roll-def text-white font-orbitron" data-val="${card.def}">0</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Re-render lucide icon inside card
    if (window.lucide) {
      setTimeout(() => window.lucide.createIcons({ root: wrap }), 10);
    }

    // Click handler to flip individual card
    wrap.addEventListener('click', () => {
      this.flipCard(wrap, card);
    });

    return wrap;
  }

  // Flip single card
  flipCard(cardWrap, card) {
    const cardInner = cardWrap.querySelector('.card-inner-3d');
    const index = cardWrap.dataset.index;

    // If already flipped, open 3D inspector modal!
    if (this.revealedCards.has(index)) {
      if (window.appController) {
        window.appController.openInspector(card);
      }
      return;
    }

    this.revealedCards.add(index);

    // Audio: flip sound + rarity reveal sound
    if (window.soundFX) {
      window.soundFX.playCardFlip();
      window.soundFX.playRarityReveal(card.rarity);
    }

    // 3D Y-Axis Flip with Anime.js Elastic Spring
    anime({
      targets: cardInner,
      rotateY: [0, 180],
      duration: 750,
      easing: 'easeOutElastic(1, .85)'
    });

    // Screen Shake on SSR / UR reveal
    if (card.rarity === 'SSR' || card.rarity === 'UR') {
      const shakeAmt = card.rarity === 'UR' ? 8 : 4;
      anime({
        targets: '#app-root',
        translateX: () => anime.random(-shakeAmt, shakeAmt),
        translateY: () => anime.random(-shakeAmt, shakeAmt),
        duration: 50,
        direction: 'alternate',
        loop: 4,
        easing: 'easeInOutSine',
        complete: () => {
          document.getElementById('app-root').style.transform = '';
        }
      });
    }

    // Number roll-up animation for ATK and DEF
    const atkEl = cardWrap.querySelector('.stat-roll-atk');
    const defEl = cardWrap.querySelector('.stat-roll-def');

    const statObj = { atk: 0, def: 0 };
    anime({
      targets: statObj,
      atk: card.atk,
      def: card.def,
      round: 1,
      duration: 650,
      easing: 'easeOutExpo',
      update: () => {
        if (atkEl) atkEl.innerText = statObj.atk;
        if (defEl) defEl.innerText = statObj.def;
      }
    });

    // Check if all cards have been revealed
    this.checkAllRevealed();
  }

  // Reveal All cards simultaneously with staggered flips
  revealAllCards() {
    const wrappers = document.querySelectorAll('.gacha-card-wrapper');
    wrappers.forEach((wrap, i) => {
      const index = wrap.dataset.index;
      if (!this.revealedCards.has(index)) {
        setTimeout(() => {
          const cardId = wrap.dataset.cardId;
          const card = this.currentPullResult.cards.find(c => c.id === cardId);
          if (card) this.flipCard(wrap, card);
        }, i * 90);
      }
    });
  }

  // Check if all cards in current pull are revealed
  checkAllRevealed() {
    if (!this.currentPullResult) return;
    const total = this.currentPullResult.cards.length;
    if (this.revealedCards.size >= total) {
      const collectBtn = document.getElementById('collect-cards-btn');
      if (collectBtn) {
        collectBtn.classList.remove('hidden');
        anime({
          targets: collectBtn,
          scale: [0.8, 1],
          opacity: [0, 1],
          duration: 350,
          easing: 'easeOutBack'
        });
      }
    }
  }

  // Dismiss reveal stage and restore Summon Altar
  closeRevealStage() {
    const revealOverlay = document.getElementById('reveal-stage-overlay');
    if (!revealOverlay) return;

    anime({
      targets: revealOverlay,
      opacity: [1, 0],
      duration: 400,
      easing: 'easeInQuad',
      complete: () => {
        revealOverlay.classList.add('hidden');
        revealOverlay.style.display = 'none';
        revealOverlay.style.opacity = '1';

        // Restore HUD panels
        anime({
          targets: '.hud-panel, .banner-selector-card, #summon-action-bar',
          opacity: [0, 1],
          translateY: [25, 0],
          easing: 'easeOutQuad',
          duration: 400
        });

        // Reset Three.js Booster Pack
        if (window.threeSceneManager) {
          const banner = window.cardDataService.currentBanner;
          window.threeSceneManager.resetPack(banner);
        }
      }
    });
  }
}

// Global animation controller instance
window.timelineController = new TimelineAnimationController();

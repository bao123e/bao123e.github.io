/**
 * AETHERIA TCG - CS2 Case Opening & Roulette Spinner System
 * Authentic CS:GO / CS2 case unboxing experience:
 * Horizontal decelerating carousel track with center needle crosshair,
 * realistic deceleration ticks, teasing rare drops, and winning showcase modal!
 */

class CS2CaseOpener {
  constructor() {
    this.isSpinning = false;
    this.trackElement = null;
    this.viewportElement = null;
    this.winningCard = null;
    this.currentTrackItems = [];

    // Configuration
    this.ITEM_WIDTH = 190; // px
    this.ITEM_GAP = 10;    // px
    this.ITEM_FULL_WIDTH = this.ITEM_WIDTH + this.ITEM_GAP;
    this.TOTAL_ITEMS = 65;
    this.WIN_INDEX = 50;   // The needle lands on item index 50

    this.lastTickTime = 0;
  }

  init() {
    this.trackElement = document.getElementById('cs2-roulette-track');
    this.viewportElement = document.getElementById('cs2-roulette-viewport');

    this.bindEvents();
    this.renderCasePreview();
  }

  bindEvents() {
    const openBtn = document.getElementById('cs2-open-case-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.startCaseOpening());
    }

    const inspectBtn = document.getElementById('cs2-showcase-inspect-btn');
    if (inspectBtn) {
      inspectBtn.addEventListener('click', () => {
        if (this.winningCard && window.appController) {
          this.closeShowcase();
          window.appController.openInspector(this.winningCard);
        }
      });
    }

    const openAgainBtn = document.getElementById('cs2-showcase-again-btn');
    if (openAgainBtn) {
      openAgainBtn.addEventListener('click', () => {
        this.closeShowcase();
        setTimeout(() => this.startCaseOpening(), 300);
      });
    }

    const closeShowcaseBtn = document.getElementById('cs2-showcase-close-btn');
    if (closeShowcaseBtn) {
      closeShowcaseBtn.addEventListener('click', () => this.closeShowcase());
    }
  }

  // Render possible items showcase inside the Case details panel
  async renderCasePreview() {
    const previewContainer = document.getElementById('cs2-case-loot-preview');
    if (!previewContainer) return;

    const banner = window.cardDataService ? window.cardDataService.currentBanner : 'yugioh';
    const pool = await window.cardDataService.getCardsForBanner(banner);

    // Pick representative cards for each CS2 tier
    const tiers = [
      { rarity: 'UR', label: '★ Exceedingly Rare Special Item', csColor: '#facc15', bgClass: 'from-amber-600/30' },
      { rarity: 'SSR', label: 'Covert Grade', csColor: '#f43f5e', bgClass: 'from-rose-600/30' },
      { rarity: 'SR', label: 'Classified Grade', csColor: '#c084fc', bgClass: 'from-purple-600/30' },
      { rarity: 'R', label: 'Restricted / Mil-Spec', csColor: '#38bdf8', bgClass: 'from-sky-600/30' }
    ];

    previewContainer.innerHTML = '';

    tiers.forEach(tier => {
      const candidates = pool.filter(c => c.rarity === tier.rarity);
      const sample = candidates[0] || pool[0];
      if (!sample) return;

      const itemEl = document.createElement('div');
      itemEl.className = `p-2.5 rounded-xl border border-white/10 bg-gradient-to-t ${tier.bgClass} to-slate-900/80 flex items-center gap-3 shadow-lg`;
      itemEl.innerHTML = `
        <div class="w-12 h-14 rounded-lg bg-black/60 overflow-hidden border border-white/20 flex-shrink-0">
          <img src="${sample.image || ''}" alt="${sample.name}" class="w-full h-full object-cover"
               onerror="window.cardDataService.handleImageError(this, '${sample.id}')">
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[10px] font-mono uppercase tracking-wider font-bold" style="color: ${tier.csColor}">
            ${tier.label}
          </div>
          <div class="text-xs font-orbitron font-bold text-white truncate">${sample.name}</div>
          <div class="text-[10px] text-slate-400 font-mono">ATK ${sample.atk} • ${sample.type}</div>
        </div>
      `;
      previewContainer.appendChild(itemEl);
    });

    // Populate initial static track
    this.populateInitialTrack(pool);
  }

  // Populate static items on the track before spin
  populateInitialTrack(pool) {
    if (!this.trackElement) return;
    this.trackElement.innerHTML = '';
    this.trackElement.style.transform = 'translateX(0px)';

    for (let i = 0; i < 15; i++) {
      const card = pool[i % pool.length];
      const el = this.createTrackCardElement(card, i);
      this.trackElement.appendChild(el);
    }
  }

  // Create single card item element on the roulette track
  createTrackCardElement(card, index) {
    const el = document.createElement('div');
    el.className = 'cs2-track-item flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-slate-900/90 relative flex flex-col select-none transition-all duration-200';
    el.style.width = `${this.ITEM_WIDTH}px`;
    el.style.height = `255px`;
    el.dataset.index = index;

    // CS2 Rarity Color Coding
    const csRarityMap = {
      UR: { color: '#facc15', label: '★ SPECIAL RARE', barColor: 'bg-amber-400' },
      SSR: { color: '#f43f5e', label: 'COVERT', barColor: 'bg-rose-500' },
      SR: { color: '#c084fc', label: 'CLASSIFIED', barColor: 'bg-purple-500' },
      R: { color: '#38bdf8', label: 'RESTRICTED', barColor: 'bg-sky-400' }
    };
    const rInfo = csRarityMap[card.rarity] || csRarityMap.R;

    el.innerHTML = `
      <!-- Card Image Area -->
      <div class="relative w-full h-[175px] bg-slate-950 overflow-hidden flex items-center justify-center">
        <img src="${card.image || ''}" alt="${card.name}"
             class="w-full h-full object-cover transition-transform duration-300"
             onerror="window.cardDataService.handleImageError(this, '${card.id}')">
        
        <!-- Rarity Badge -->
        <span class="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded font-orbitron text-black" style="background-color: ${rInfo.color}">
          ${card.rarity === 'UR' ? '★ GOLD' : card.rarity}
        </span>
      </div>

      <!-- Item Info -->
      <div class="p-2.5 bg-black/85 flex-1 flex flex-col justify-between border-t border-white/10">
        <div>
          <div class="text-[9px] font-mono font-bold uppercase truncate" style="color: ${rInfo.color}">
            ${rInfo.label}
          </div>
          <div class="font-orbitron font-bold text-xs text-white truncate" title="${card.name}">
            ${card.name}
          </div>
        </div>
        <div class="text-[9px] font-mono text-slate-400 flex items-center justify-between mt-1">
          <span class="text-rose-400 font-bold">ATK ${card.atk}</span>
          <span class="text-slate-500">FN 0.012</span>
        </div>
      </div>

      <!-- CS2 Bottom Color Stripe -->
      <div class="w-full h-1.5 ${rInfo.barColor}"></div>
    `;

    return el;
  }

  // Start the Case Opening Sequence
  async startCaseOpening() {
    if (this.isSpinning) return;

    const cost = 500;
    if (window.gachaEngine.state.gems < cost) {
      if (window.appController) {
        window.appController.showToast(`⚠️ Insufficient Astral Gems! Need ${cost} Gems.`);
      }
      return;
    }

    this.isSpinning = true;
    const openBtn = document.getElementById('cs2-open-case-btn');
    if (openBtn) openBtn.disabled = true;

    try {
      // 1. Roll via Gacha Engine (1 winning card)
      const banner = window.cardDataService.currentBanner;
      const pullResult = await window.gachaEngine.summon('single', banner);
      this.winningCard = pullResult.cards[0];

      // 2. Build Track Items
      const pool = await window.cardDataService.getCardsForBanner(banner);
      this.buildTrack(this.winningCard, pool);

      // 3. Play charging hum
      if (window.soundFX) window.soundFX.playCharge(0.8);

      // 4. Calculate final scroll translation
      // Center needle position = viewport width / 2
      const viewportWidth = this.viewportElement.offsetWidth;
      const centerNeedleX = viewportWidth / 2;

      // Small randomized landing offset within the winning card (-40% to +40% width)
      const randomOffset = (Math.random() - 0.5) * (this.ITEM_WIDTH * 0.7);

      // Final target translation
      const winningCenterPos = (this.WIN_INDEX * this.ITEM_FULL_WIDTH) + (this.ITEM_WIDTH / 2);
      const targetTranslateX = -(winningCenterPos - centerNeedleX + randomOffset);

      // 5. Spin with authentic CS2 physics easing
      await this.spinCarousel(targetTranslateX);

      // 6. Stop and trigger winning celebration!
      this.onSpinComplete();

    } catch (err) {
      console.error('Case opening error:', err);
      if (window.appController) window.appController.showToast(`Error: ${err.message}`);
    } finally {
      this.isSpinning = false;
      if (openBtn) openBtn.disabled = false;
    }
  }

  // Construct full 65-item track
  buildTrack(winningCard, pool) {
    this.trackElement.innerHTML = '';
    this.trackElement.style.transform = 'translateX(0px)';
    this.currentTrackItems = [];

    // Group cards by rarity for realistic decoy generation
    const grouped = {
      UR: pool.filter(c => c.rarity === 'UR'),
      SSR: pool.filter(c => c.rarity === 'SSR'),
      SR: pool.filter(c => c.rarity === 'SR'),
      R: pool.filter(c => c.rarity === 'R')
    };

    for (let i = 0; i < this.TOTAL_ITEMS; i++) {
      let card;

      if (i === this.WIN_INDEX) {
        // EXACT WINNING ITEM AT INDEX 50
        card = winningCard;
      } else {
        // Decoy distribution: mostly R and SR, with occasional tease SSR/UR right near index 50!
        let chosenRarity = 'R';
        const rand = Math.random() * 100;

        // Place a tantalizing tease right before or after winning card!
        if (i === this.WIN_INDEX - 1 || i === this.WIN_INDEX + 1) {
          chosenRarity = Math.random() < 0.35 ? 'UR' : (Math.random() < 0.6 ? 'SSR' : 'SR');
        } else if (rand < 5) {
          chosenRarity = 'UR';
        } else if (rand < 20) {
          chosenRarity = 'SSR';
        } else if (rand < 50) {
          chosenRarity = 'SR';
        } else {
          chosenRarity = 'R';
        }

        const candidates = grouped[chosenRarity].length ? grouped[chosenRarity] : pool;
        card = candidates[Math.floor(Math.random() * candidates.length)];
      }

      const cardEl = this.createTrackCardElement(card, i);
      this.trackElement.appendChild(cardEl);
      this.currentTrackItems.push({ card, element: cardEl, index: i });
    }
  }

  // Animate the rolling track using requestAnimationFrame & cubic-bezier easing
  spinCarousel(targetX) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const duration = 5800; // 5.8s spin time like CS2

      let lastCrossedIndex = -1;
      const viewportWidth = this.viewportElement.offsetWidth;
      const centerNeedleX = viewportWidth / 2;

      // Authentic CS2 Deceleration Bezier: starts fast, long suspenseful crawl at the end
      // Approximated cubic-bezier(0.12, 0.8, 0.2, 1)
      const easeOutCustom = (t) => {
        return 1 - Math.pow(1 - t, 4);
      };

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = easeOutCustom(progress);

        const currentX = targetX * easedProgress;
        this.trackElement.style.transform = `translateX(${currentX}px)`;

        // Calculate which item is currently passing the center needle
        const currentCenterItemIndex = Math.floor((-currentX + centerNeedleX) / this.ITEM_FULL_WIDTH);

        if (currentCenterItemIndex !== lastCrossedIndex && currentCenterItemIndex >= 0 && currentCenterItemIndex < this.TOTAL_ITEMS) {
          lastCrossedIndex = currentCenterItemIndex;

          // Sound tick for each card crossing the needle!
          if (window.soundFX) {
            window.soundFX.playCaseTick();
          }

          // Micro-shake the needle indicator
          const needle = document.getElementById('cs2-center-needle');
          if (needle) {
            needle.style.transform = 'translateX(-50%) scale(1.15)';
            setTimeout(() => needle.style.transform = 'translateX(-50%) scale(1)', 40);
          }
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  // Spin complete handler
  onSpinComplete() {
    // Heavy metallic lock sound
    if (window.soundFX) {
      window.soundFX.playCaseStop();
    }

    // Highlight winning item in track
    const winningEl = this.trackElement.children[this.WIN_INDEX];
    if (winningEl) {
      winningEl.classList.add('ring-4', 'ring-amber-400', 'scale-105', 'z-20');
      anime({
        targets: winningEl,
        scale: [1, 1.08, 1.05],
        duration: 400,
        easing: 'easeOutBack'
      });
    }

    // Delay 700ms before bursting into Winning Showcase Modal
    setTimeout(() => {
      this.showWinningShowcase(this.winningCard);
    }, 700);
  }

  // Display CS2 Winning Item Showcase Modal
  showWinningShowcase(card) {
    const modal = document.getElementById('cs2-winning-showcase-modal');
    if (!modal) return;

    // Play fanfare based on rarity
    if (window.soundFX) {
      window.soundFX.playRarityReveal(card.rarity);
    }

    const csRarityMap = {
      UR: { color: '#facc15', label: '★ EXCEEDINGLY RARE SPECIAL ITEM ★', glow: 'shadow-amber-500/40', badge: 'GOLD ★' },
      SSR: { color: '#f43f5e', label: 'COVERT GRADE', glow: 'shadow-rose-500/40', badge: 'COVERT' },
      SR: { color: '#c084fc', label: 'CLASSIFIED GRADE', glow: 'shadow-purple-500/40', badge: 'CLASSIFIED' },
      R: { color: '#38bdf8', label: 'RESTRICTED GRADE', glow: 'shadow-sky-500/40', badge: 'RESTRICTED' }
    };
    const rInfo = csRarityMap[card.rarity] || csRarityMap.R;

    const bannerEl = document.getElementById('cs2-showcase-tier-banner');
    const nameEl = document.getElementById('cs2-showcase-item-name');
    const typeEl = document.getElementById('cs2-showcase-item-type');
    const imgEl = document.getElementById('cs2-showcase-item-img');
    const atkEl = document.getElementById('cs2-showcase-atk');
    const defEl = document.getElementById('cs2-showcase-def');
    const floatEl = document.getElementById('cs2-showcase-float');

    if (bannerEl) {
      bannerEl.innerText = rInfo.label;
      bannerEl.style.color = rInfo.color;
    }
    if (nameEl) nameEl.innerText = card.name;
    if (typeEl) typeEl.innerText = card.type;
    if (atkEl) atkEl.innerText = card.atk;
    if (defEl) defEl.innerText = card.def;
    if (floatEl) {
      const wear = (0.001 + Math.random() * 0.04).toFixed(5);
      floatEl.innerText = `Condition: Factory New • Float: ${wear}`;
    }

    if (imgEl) {
      imgEl.src = card.image || '';
      imgEl.onerror = () => window.cardDataService.handleImageError(imgEl, card.id);
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // Animate pop-in
    anime({
      targets: '#cs2-showcase-card-container',
      scale: [0.75, 1],
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutBack'
    });

    if (window.lucide) window.lucide.createIcons({ root: modal });
  }

  closeShowcase() {
    const modal = document.getElementById('cs2-winning-showcase-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }
}

// Global instance
window.cs2CaseOpener = new CS2CaseOpener();

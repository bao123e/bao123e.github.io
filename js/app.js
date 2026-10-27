/**
 * AETHERIA TCG - Main Application Controller
 * Coordinates Three.js 3D stage, Anime.js gacha timelines,
 * CardDataService APIs, GachaEngine, SoundFX, Binder, and Arena.
 */

class AppController {
  constructor() {
    this.currentView = 'altar'; // 'altar' | 'binder' | 'arena'
    this.selectedBanner = 'yugioh'; // 'yugioh' | 'pokemon'

    // Binder filtering & sorting state
    this.binderFilter = 'ALL';
    this.binderSearch = '';
    this.binderSort = 'rarity'; // 'rarity' | 'atk' | 'count' | 'name'

    // Active inspected card
    this.inspectedCard = null;

    this.init();
  }

  async init() {
    console.log('[Aetheria TCG] Initializing application...');

    // 1. Initialize Three.js Scene
    if (window.ThreeSceneManager) {
      window.threeSceneManager = new ThreeSceneManager();
    }

    // 2. Setup Drag Slice trigger
    if (window.threeSceneManager) {
      window.threeSceneManager.onSliceComplete = () => {
        this.handleSummonPull('single');
      };
    }

    // 3. Preload initial banner cards
    window.cardDataService.getCardsForBanner('yugioh').catch(console.error);

    // 4. Update HUD Counters & Pity Progress
    this.updateGemsDisplay(window.gachaEngine.state.gems, false);
    this.updatePityDisplay();

    // 5. Setup UI Event Listeners
    this.bindEvents();

    // 6. Setup Audio Mute Button
    this.updateMuteIcon();

    // 7. Initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // 8. Listen to Engine state updates
    window.addEventListener('aetheria:stateUpdated', (e) => {
      this.updateGemsDisplay(e.detail.gems, true);
      this.updatePityDisplay();
    });

    // 9. Initialize CS2 Case Opener
    if (window.cs2CaseOpener) {
      window.cs2CaseOpener.init();
    }

    // 10. Initialize Wuthering Waves Convene Engine
    if (window.wuwaConveneEngine) {
      window.wuwaConveneEngine.init();
    }

    console.log('[Aetheria TCG] Ready!');
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });

    // API Source / Banner Switcher Buttons
    const bannerYgoBtn = document.getElementById('banner-tab-ygo');
    const bannerPkmnBtn = document.getElementById('banner-tab-pkmn');

    if (bannerYgoBtn) {
      bannerYgoBtn.addEventListener('click', () => this.switchBanner('yugioh'));
    }
    if (bannerPkmnBtn) {
      bannerPkmnBtn.addEventListener('click', () => this.switchBanner('pokemon'));
    }

    // Quick Switch to CS2 Mode from Altar
    const switchToCs2Btn = document.getElementById('switch-to-cs2-btn');
    if (switchToCs2Btn) {
      switchToCs2Btn.addEventListener('click', () => this.switchView('case'));
    }

    // Refill Gems (+5,000)
    const refillBtn = document.getElementById('refill-gems-btn');
    if (refillBtn) {
      refillBtn.addEventListener('click', () => {
        const newTotal = window.gachaEngine.refillGems(5000);
        this.showToast(`✨ Refilled +5,000 Astral Gems! (Total: ${newTotal.toLocaleString()})`);
      });
    }

    // Mute Audio Toggle
    const muteBtn = document.getElementById('audio-toggle-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = window.soundFX.toggleMute();
        this.updateMuteIcon();
        this.showToast(isMuted ? '🔇 Audio Muted' : '🔊 Audio Enabled');
      });
    }

    // Summon Action Buttons
    const summon1xBtn = document.getElementById('summon-1x-btn');
    const summon10xBtn = document.getElementById('summon-10x-btn');

    if (summon1xBtn) {
      summon1xBtn.addEventListener('click', () => this.handleSummonPull('single'));
    }
    if (summon10xBtn) {
      summon10xBtn.addEventListener('click', () => this.handleSummonPull('multi'));
    }

    // Reveal Stage Action Controls
    const revealAllBtn = document.getElementById('reveal-all-btn');
    const collectBtn = document.getElementById('collect-cards-btn');
    const closeRevealBtn = document.getElementById('close-reveal-overlay-btn');

    if (revealAllBtn) {
      revealAllBtn.addEventListener('click', () => {
        if (window.soundFX) window.soundFX.playClick();
        window.timelineController.revealAllCards();
      });
    }

    if (collectBtn) {
      collectBtn.addEventListener('click', () => {
        if (window.soundFX) window.soundFX.playClick();
        window.timelineController.closeRevealStage();
      });
    }

    if (closeRevealBtn) {
      closeRevealBtn.addEventListener('click', () => {
        if (window.soundFX) window.soundFX.playClick();
        window.timelineController.closeRevealStage();
      });
    }

    // Binder Controls (Search, Filter, Sort, Dismantle All)
    const searchInput = document.getElementById('binder-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.binderSearch = e.target.value.toLowerCase();
        this.renderBinderGrid();
      });
    }

    document.querySelectorAll('.binder-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.binder-filter-btn').forEach(b => b.classList.remove('active', 'border-cyan-400', 'text-cyan-300'));
        btn.classList.add('active', 'border-cyan-400', 'text-cyan-300');
        this.binderFilter = btn.dataset.filter;
        this.renderBinderGrid();
      });
    });

    const sortSelect = document.getElementById('binder-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.binderSort = e.target.value;
        this.renderBinderGrid();
      });
    }

    const dismantleAllBtn = document.getElementById('dismantle-all-btn');
    if (dismantleAllBtn) {
      dismantleAllBtn.addEventListener('click', () => {
        const result = window.gachaEngine.dismantleAllDuplicates();
        if (result.countDismantled > 0) {
          if (window.soundFX) window.soundFX.playGemsRefill();
          this.showToast(`♻️ Dismantled ${result.countDismantled} duplicate cards for +${result.totalRefund.toLocaleString()} Gems!`);
          this.renderBinderGrid();
        } else {
          this.showToast("No duplicate cards to dismantle.");
        }
      });
    }

    // Drop Rates & Pity Modal
    const pityModalBtn = document.getElementById('rates-modal-btn');
    const closeRatesBtn = document.getElementById('close-rates-modal');
    const ratesModal = document.getElementById('rates-modal');

    if (pityModalBtn && ratesModal) {
      pityModalBtn.addEventListener('click', () => {
        ratesModal.classList.remove('hidden');
        if (window.soundFX) window.soundFX.playClick();
      });
    }
    if (closeRatesBtn && ratesModal) {
      closeRatesBtn.addEventListener('click', () => {
        ratesModal.classList.add('hidden');
      });
    }

    // Inspector Modal Close Buttons
    const closeInspectorBtn = document.getElementById('close-inspector-btn');
    const inspectorModal = document.getElementById('inspector-modal');
    if (closeInspectorBtn && inspectorModal) {
      closeInspectorBtn.addEventListener('click', () => this.closeInspector());
    }

    // Arena Controls
    const autoPickArenaBtn = document.getElementById('arena-auto-pick-btn');
    const startArenaBtn = document.getElementById('arena-start-battle-btn');
    const closeArenaResultBtn = document.getElementById('arena-close-result-btn');

    if (autoPickArenaBtn) {
      autoPickArenaBtn.addEventListener('click', () => {
        window.arenaDuelManager.autoSelectBestCards();
      });
    }

    if (startArenaBtn) {
      startArenaBtn.addEventListener('click', () => {
        window.arenaDuelManager.startDuel();
      });
    }

    if (closeArenaResultBtn) {
      closeArenaResultBtn.addEventListener('click', () => {
        window.arenaDuelManager.closeResultModal();
      });
    }

    // Keyboard Shortcuts (ESC to close modals or reveal overlay)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const revealOverlay = document.getElementById('reveal-stage-overlay');
        if (revealOverlay && !revealOverlay.classList.contains('hidden') && revealOverlay.style.display !== 'none') {
          if (window.soundFX) window.soundFX.playClick();
          window.timelineController.closeRevealStage();
          return;
        }
        if (window.cs2CaseOpener) window.cs2CaseOpener.closeShowcase();
        if (window.wuwaConveneEngine) {
          window.wuwaConveneEngine.closeSummary();
          const splash = document.getElementById('wuwa-splash-modal');
          if (splash) splash.classList.add('hidden');
        }
        this.closeInspector();
        if (ratesModal) ratesModal.classList.add('hidden');
        if (window.arenaDuelManager) window.arenaDuelManager.closeResultModal();
      }
    });

    // Setup 3D Tilt for Inspector Card
    this.setupInspector3DTilt();
  }

  // Switch between Summon Altar, Card Binder, and Arena
  switchView(viewName) {
    if (this.currentView === viewName) return;
    this.currentView = viewName;

    if (window.soundFX) window.soundFX.playClick();

    // Update Nav buttons styling
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300');
        btn.classList.remove('text-slate-400', 'border-transparent');
      } else {
        btn.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-300');
        btn.classList.add('text-slate-400', 'border-transparent');
      }
    });

    // View Containers
    const altarView = document.getElementById('view-altar');
    const wuwaView = document.getElementById('view-wuwa');
    const trackerView = document.getElementById('view-tracker');
    const caseView = document.getElementById('view-case');
    const binderView = document.getElementById('view-binder');
    const arenaView = document.getElementById('view-arena');
    const webglContainer = document.getElementById('webgl-container');

    altarView.classList.add('hidden');
    if (wuwaView) wuwaView.classList.add('hidden');
    if (trackerView) trackerView.classList.add('hidden');
    if (caseView) caseView.classList.add('hidden');
    binderView.classList.add('hidden');
    arenaView.classList.add('hidden');

    if (viewName === 'altar') {
      altarView.classList.remove('hidden');
      if (webglContainer) webglContainer.style.opacity = '1';
    } else if (viewName === 'wuwa') {
      if (wuwaView) wuwaView.classList.remove('hidden');
      if (webglContainer) webglContainer.style.opacity = '0.25';
      if (window.wuwaConveneEngine) window.wuwaConveneEngine.renderBannerDetails();
    } else if (viewName === 'tracker') {
      if (trackerView) trackerView.classList.remove('hidden');
      if (webglContainer) webglContainer.style.opacity = '0.15';
      if (window.wuwaConveneEngine) window.wuwaConveneEngine.renderTrackerDashboard();
    } else if (viewName === 'case') {
      if (caseView) caseView.classList.remove('hidden');
      if (webglContainer) webglContainer.style.opacity = '0.35';
      if (window.cs2CaseOpener) window.cs2CaseOpener.renderCasePreview();
    } else if (viewName === 'binder') {
      binderView.classList.remove('hidden');
      if (webglContainer) webglContainer.style.opacity = '0.35';
      this.renderBinderGrid();
    } else if (viewName === 'arena') {
      arenaView.classList.remove('hidden');
      if (webglContainer) webglContainer.style.opacity = '0.45';
      this.setupArenaView();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Switch Active Banner / API Mode
  switchBanner(bannerKey) {
    if (this.selectedBanner === bannerKey) return;
    this.selectedBanner = bannerKey;

    if (window.soundFX) window.soundFX.playClick();

    const bannerYgoBtn = document.getElementById('banner-tab-ygo');
    const bannerPkmnBtn = document.getElementById('banner-tab-pkmn');
    const bannerTitle = document.getElementById('active-banner-title');
    const bannerDesc = document.getElementById('active-banner-desc');
    const bannerSource = document.getElementById('active-banner-source-tag');

    if (bannerKey === 'yugioh') {
      bannerYgoBtn.classList.add('border-amber-400', 'bg-amber-500/20', 'text-amber-300');
      bannerPkmnBtn.classList.remove('border-amber-400', 'bg-amber-500/20', 'text-amber-300');
      bannerPkmnBtn.classList.add('border-slate-800', 'text-slate-400');

      if (bannerTitle) bannerTitle.innerText = "CHRONO-DRAGON GENESIS";
      if (bannerDesc) bannerDesc.innerText = "Features supreme Yu-Gi-Oh! archetypes, dragons, synchros, and god-tier beasts.";
      if (bannerSource) bannerSource.innerText = "YGOPRODeck API v7 (Live)";
    } else {
      bannerPkmnBtn.classList.add('border-amber-400', 'bg-amber-500/20', 'text-amber-300');
      bannerYgoBtn.classList.remove('border-amber-400', 'bg-amber-500/20', 'text-amber-300');
      bannerYgoBtn.classList.add('border-slate-800', 'text-slate-400');

      if (bannerTitle) bannerTitle.innerText = "NEBULA POCKET LEGENDS";
      if (bannerDesc) bannerDesc.innerText = "Features high-res Pokémon TCG Darkness Ablaze cards, VMAX, and Holo Rares.";
      if (bannerSource) bannerSource.innerText = "TCGdex REST API v2 (Live)";
    }

    // Update Three.js Booster Pack
    if (window.threeSceneManager) {
      window.threeSceneManager.resetPack(bannerKey);
    }

    // Preload pool cards
    window.cardDataService.getCardsForBanner(bannerKey).catch(console.error);
    if (window.cs2CaseOpener) {
      window.cs2CaseOpener.renderCasePreview();
    }
    this.showToast(`Switched Banner to: ${bannerKey === 'yugioh' ? 'Chrono-Dragon (YGO)' : 'Nebula Pocket (Pokémon)'}`);
  }

  // Handle Summon Pull (Single vs Multi)
  async handleSummonPull(packType) {
    try {
      // 1. Roll via Gacha Engine
      const pullResult = await window.gachaEngine.summon(packType, this.selectedBanner);

      // 2. Trigger Choreographed Anime.js Sequence
      await window.timelineController.executeSummonSequence(pullResult);

    } catch (err) {
      this.showToast(`⚠️ ${err.message}`);
      if (window.soundFX) window.soundFX.playClick();
    }
  }

  // Update Astral Gems Counter with Anime.js roll-up animation
  updateGemsDisplay(targetGems, animate = true) {
    const gemEl = document.getElementById('astral-gems-counter');
    if (!gemEl) return;

    if (!animate) {
      gemEl.innerText = targetGems.toLocaleString();
      return;
    }

    const currentGems = parseInt(gemEl.innerText.replace(/,/g, '')) || 0;
    const obj = { val: currentGems };

    anime({
      targets: obj,
      val: targetGems,
      round: 1,
      duration: 600,
      easing: 'easeOutExpo',
      update: () => {
        gemEl.innerText = obj.val.toLocaleString();
      }
    });
  }

  // Update Pity Counter Bar
  updatePityDisplay() {
    const pity = window.gachaEngine.state.pityCounter;
    const max = window.gachaEngine.HARD_PITY_MAX;
    const pct = Math.min(100, (pity / max) * 100);

    const bar = document.getElementById('pity-progress-bar');
    const text = document.getElementById('pity-progress-text');

    if (bar) bar.style.width = `${pct}%`;
    if (text) text.innerText = `${pity} / ${max} until Guaranteed UR`;
  }

  // Update Audio Mute Icon
  updateMuteIcon() {
    const iconEl = document.getElementById('audio-toggle-icon');
    if (!iconEl) return;
    const isMuted = window.soundFX.muted;
    iconEl.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
    if (window.lucide) window.lucide.createIcons();
  }

  // Render Collection Binder Grid
  renderBinderGrid() {
    const grid = document.getElementById('binder-cards-grid');
    if (!grid) return;

    let items = window.gachaEngine.getCollectionList();

    // Filter by Rarity
    if (this.binderFilter !== 'ALL') {
      items = items.filter(item => item.card.rarity === this.binderFilter);
    }

    // Filter by Search
    if (this.binderSearch.trim()) {
      items = items.filter(item => item.card.name.toLowerCase().includes(this.binderSearch));
    }

    // Sort items
    const rarityWeights = { UR: 4, SSR: 3, SR: 2, R: 1 };
    items.sort((a, b) => {
      if (this.binderSort === 'atk') {
        return (b.card.atk || 0) - (a.card.atk || 0);
      } else if (this.binderSort === 'count') {
        return b.count - a.count;
      } else if (this.binderSort === 'name') {
        return a.card.name.localeCompare(b.card.name);
      } else {
        // Default: Rarity descending
        return (rarityWeights[b.card.rarity] || 0) - (rarityWeights[a.card.rarity] || 0);
      }
    });

    grid.innerHTML = '';

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-500 font-orbitron">
          <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-40"></i>
          <div>No cards found matching your criteria.</div>
          <div class="text-xs text-slate-600 mt-1">Summon packs from the Altar to grow your collection!</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ root: grid });
      return;
    }

    items.forEach(item => {
      const card = item.card;
      const count = item.count;

      const cardEl = document.createElement('div');
      cardEl.className = `binder-card-item rounded-xl overflow-hidden border border-white/10 bg-slate-900/90 shadow-lg flex flex-col cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20 holo-${card.foilType} relative group`;
      cardEl.innerHTML = `
        <div class="relative h-44 sm:h-52 bg-slate-950 overflow-hidden flex items-center justify-center">
          <img src="${card.image || ''}" alt="${card.name}"
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               onerror="window.cardDataService.handleImageError(this, '${card.id}');">
          
          <span class="absolute top-2 left-2 badge-${card.rarity.toLowerCase()} text-[10px] font-black px-1.5 py-0.5 rounded font-orbitron">
            ${card.rarity}
          </span>
          <span class="absolute top-2 right-2 bg-black/80 backdrop-blur text-purple-300 border border-purple-500/40 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
            x${count}
          </span>
        </div>
        <div class="p-2.5 bg-black/70 flex flex-col gap-1 mt-auto">
          <div class="font-orbitron font-bold text-xs text-white truncate" title="${card.name}">${card.name}</div>
          <div class="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span class="text-rose-400 font-bold">ATK ${card.atk}</span>
            <span class="text-sky-400 font-bold">DEF ${card.def}</span>
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => {
        this.openInspector(card);
      });

      grid.appendChild(cardEl);
    });

    // Update Binder Collection Stats
    this.updateBinderStats();
  }

  updateBinderStats() {
    const stats = window.gachaEngine.getCollectionStats();

    const uniqueEl = document.getElementById('binder-stat-unique');
    const totalEl = document.getElementById('binder-stat-total');
    const valueEl = document.getElementById('binder-stat-value');

    if (uniqueEl) uniqueEl.innerText = stats.uniqueCards;
    if (totalEl) totalEl.innerText = stats.totalCards;
    if (valueEl) valueEl.innerText = `${stats.totalValue.toLocaleString()} Gems`;
  }

  // Setup Arena View with selection and bosses
  setupArenaView() {
    if (window.arenaDuelManager) {
      window.arenaDuelManager.renderSelectedDeck();
    }
  }

  // Open 3D Card Inspector Modal with Prismatic Foil Shader
  openInspector(card) {
    this.inspectedCard = card;
    if (window.soundFX) window.soundFX.playClick();

    const modal = document.getElementById('inspector-modal');
    const imgEl = document.getElementById('inspector-card-image');
    const nameEl = document.getElementById('inspector-card-name');
    const rarityBadge = document.getElementById('inspector-rarity-badge');
    const typeEl = document.getElementById('inspector-card-type');
    const atkEl = document.getElementById('inspector-stat-atk');
    const defEl = document.getElementById('inspector-stat-def');
    const hpEl = document.getElementById('inspector-stat-hp');
    const descEl = document.getElementById('inspector-card-desc');
    const foilMesh = document.getElementById('inspector-card-frame');
    const dismantleBtn = document.getElementById('inspector-dismantle-btn');
    const dupCountEl = document.getElementById('inspector-dup-count');

    if (!modal) return;

    // Fill data
    nameEl.innerText = card.name;
    typeEl.innerText = card.type;
    atkEl.innerText = card.atk || 0;
    defEl.innerText = card.def || 0;
    hpEl.innerText = card.hp || Math.round((card.atk || 1500) / 10);
    descEl.innerText = card.description || 'An elusive astral relic.';

    rarityBadge.innerText = `${card.rarity} • ${card.rarityName || 'Rare'}`;
    rarityBadge.className = `badge-${card.rarity.toLowerCase()} text-xs font-black px-2.5 py-1 rounded font-orbitron inline-block`;

    imgEl.src = card.image || '';
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = window.cardDataService.generateProceduralArt(card);
    };

    // Apply foil style class to 3D target
    foilMesh.className = `inspector-card-target w-[280px] sm:w-[340px] h-[400px] sm:h-[490px] rounded-2xl overflow-hidden shadow-2xl relative border-2 border-white/20 holo-${card.foilType}`;

    // Duplicate count & dismantle info
    const entry = window.gachaEngine.state.collection[card.id];
    const dups = entry ? entry.count : 1;
    if (dupCountEl) dupCountEl.innerText = `Owned: x${dups}`;

    const values = { R: 50, SR: 150, SSR: 400, UR: 1000 };
    const refund = values[card.rarity] || 50;

    if (dismantleBtn) {
      if (dups > 1) {
        dismantleBtn.classList.remove('hidden');
        dismantleBtn.innerHTML = `
          <i data-lucide="recycle" class="w-4 h-4"></i>
          <span>Dismantle 1 Duplicate (+${refund} Gems)</span>
        `;
        dismantleBtn.onclick = () => {
          const res = window.gachaEngine.dismantleDuplicate(card.id);
          if (res.success) {
            if (window.soundFX) window.soundFX.playGemsRefill();
            this.showToast(`♻️ Dismantled duplicate for +${res.refund} Gems!`);
            this.openInspector(card); // Refresh modal
            this.renderBinderGrid();
          }
        };
      } else {
        dismantleBtn.classList.add('hidden');
      }
    }

    if (window.lucide) window.lucide.createIcons({ root: modal });

    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    anime({
      targets: '#inspector-modal-content',
      scale: [0.85, 1],
      opacity: [0, 1],
      duration: 350,
      easing: 'easeOutBack'
    });
  }

  // Setup Gyroscopic 3D Perspective Tilt on Inspector Card
  setupInspector3DTilt() {
    const container = document.getElementById('inspector-tilt-area');
    const target = document.getElementById('inspector-card-frame');
    if (!container || !target) return;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -18;
      const rotateY = ((x - centerX) / centerX) * 18;

      target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;

      // Update specular glare CSS variable
      const pctX = (x / rect.width) * 100;
      const pctY = (y / rect.height) * 100;
      target.style.setProperty('--mouse-x', `${pctX}%`);
      target.style.setProperty('--mouse-y', `${pctY}%`);
    });

    container.addEventListener('mouseleave', () => {
      target.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  }

  closeInspector() {
    const modal = document.getElementById('inspector-modal');
    if (modal) {
      anime({
        targets: '#inspector-modal-content',
        scale: [1, 0.85],
        opacity: [1, 0],
        duration: 200,
        easing: 'easeInQuad',
        complete: () => {
          modal.classList.add('hidden');
          modal.style.display = 'none';
          this.inspectedCard = null;
        }
      });
    }
  }

  // Toast Notification System
  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;

    toast.innerText = message;
    toast.classList.remove('hidden', 'opacity-0');
    toast.classList.add('opacity-100');

    anime({
      targets: toast,
      translateY: [-20, 0],
      duration: 300,
      easing: 'easeOutBack'
    });

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      anime({
        targets: toast,
        translateY: [0, -20],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInQuad',
        complete: () => toast.classList.add('hidden')
      });
    }, 3200);
  }
}

// Global App controller instance
window.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});

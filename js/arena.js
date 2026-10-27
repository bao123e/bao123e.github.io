/**
 * AETHERIA TCG - Quick Duel Arena System
 * Select 3 Cards from collection to clash against AI Boss Decks!
 * Animated card clashes, damage number popups, HP bars, and 500 Gem rewards.
 */

class ArenaDuelManager {
  constructor() {
    this.selectedCardIds = [];
    this.isBattling = false;

    this.bosses = [
      {
        name: "Omni-Drake Chronos: Void Sovereign",
        title: "Astral Core Entity",
        maxHp: 8500,
        currentHp: 8500,
        atk: 2400,
        themeColor: "#8b5cf6",
        avatar: "🐲"
      },
      {
        name: "Abyssal Behemoth Tiamat",
        title: "Deep Rift Devourer",
        maxHp: 9800,
        currentHp: 9800,
        atk: 2700,
        themeColor: "#f43f5e",
        avatar: "👹"
      }
    ];

    this.currentBoss = this.bosses[0];
  }

  // Toggle card selection in arena deck (up to 3)
  toggleCardSelection(cardId) {
    if (this.isBattling) return;

    const idx = this.selectedCardIds.indexOf(cardId);
    if (idx > -1) {
      this.selectedCardIds.splice(idx, 1);
    } else {
      if (this.selectedCardIds.length >= 3) {
        // Replace oldest or notify
        this.selectedCardIds.shift();
      }
      this.selectedCardIds.push(cardId);
    }

    if (window.soundFX) window.soundFX.playClick();
    this.renderSelectedDeck();
  }

  // Auto-fill top 3 strongest cards
  autoSelectBestCards() {
    const list = window.gachaEngine.getCollectionList();
    if (list.length === 0) return;

    const sorted = [...list].sort((a, b) => (b.card.atk || 0) - (a.card.atk || 0));
    this.selectedCardIds = sorted.slice(0, 3).map(item => item.card.id);

    if (window.soundFX) window.soundFX.playClick();
    this.renderSelectedDeck();
  }

  // Render player's 3 selected cards in the arena HUD
  renderSelectedDeck() {
    const container = document.getElementById('arena-player-deck');
    if (!container) return;
    container.innerHTML = '';

    let totalAtk = 0;
    let totalHp = 0;

    for (let slot = 0; slot < 3; slot++) {
      const cardId = this.selectedCardIds[slot];
      const entry = cardId ? window.gachaEngine.state.collection[cardId] : null;

      const slotEl = document.createElement('div');
      slotEl.className = 'arena-card-slot h-44 sm:h-52 w-28 sm:w-36 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 backdrop-blur flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all duration-300';

      if (entry) {
        const card = entry.card;
        totalAtk += card.atk || 1500;
        totalHp += card.hp || 200;

        slotEl.className = `arena-card-slot h-44 sm:h-52 w-28 sm:w-36 rounded-xl border border-white/20 bg-slate-900 flex flex-col p-2 relative overflow-hidden shadow-lg holo-${card.foilType} cursor-pointer group`;
        slotEl.innerHTML = `
          <div class="relative w-full h-24 sm:h-28 rounded-lg overflow-hidden mb-1.5 bg-black">
            <img src="${card.image || ''}" alt="${card.name}"
                 class="w-full h-full object-cover"
                 onerror="window.cardDataService.handleImageError(this, '${card.id}');">
            <span class="absolute top-1 right-1 badge-${card.rarity.toLowerCase()} text-[8px] font-bold px-1 rounded font-orbitron">${card.rarity}</span>
          </div>
          <div class="text-[10px] font-orbitron font-bold text-white truncate w-full" title="${card.name}">${card.name}</div>
          <div class="flex items-center justify-between w-full text-[9px] font-mono text-slate-300 mt-auto">
            <span class="text-rose-400 font-bold">ATK ${card.atk}</span>
            <span class="text-emerald-400 font-bold">HP ${card.hp}</span>
          </div>
          <div class="absolute inset-0 bg-red-950/70 text-red-300 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Remove</div>
        `;
        slotEl.addEventListener('click', () => this.toggleCardSelection(card.id));
      } else {
        slotEl.innerHTML = `
          <div class="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 mb-2 font-orbitron text-xs">
            +
          </div>
          <div class="text-[10px] font-mono text-slate-500 text-center">Slot #${slot + 1}<br>Pick Card</div>
        `;
      }

      container.appendChild(slotEl);
    }

    // Update Stats readout
    const statsEl = document.getElementById('arena-team-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <span class="text-rose-400 font-orbitron font-bold">Total ATK: ${totalAtk.toLocaleString()}</span>
        <span class="text-slate-500">•</span>
        <span class="text-emerald-400 font-orbitron font-bold">Total HP: ${totalHp.toLocaleString()}</span>
      `;
    }

    const startBtn = document.getElementById('arena-start-battle-btn');
    if (startBtn) {
      startBtn.disabled = this.selectedCardIds.length === 0 || this.isBattling;
    }
  }

  // Execute full clash turn
  async startDuel() {
    if (this.selectedCardIds.length === 0 || this.isBattling) return;
    this.isBattling = true;

    const startBtn = document.getElementById('arena-start-battle-btn');
    if (startBtn) startBtn.disabled = true;

    // Reset Boss HP
    this.currentBoss.currentHp = this.currentBoss.maxHp;
    this.updateBossHpBar();

    // Calculate total player stats
    const playerCards = this.selectedCardIds.map(id => window.gachaEngine.state.collection[id].card);
    let playerMaxHp = playerCards.reduce((sum, c) => sum + (c.hp || 200), 0);
    let playerCurHp = playerMaxHp;

    const logEl = document.getElementById('arena-combat-log');
    if (logEl) logEl.innerHTML = `<div class="text-cyan-400">⚔️ Battle initiated against ${this.currentBoss.name}!</div>`;

    // Turn Loop (up to 3 rounds)
    for (let round = 1; round <= 3; round++) {
      if (this.currentBoss.currentHp <= 0 || playerCurHp <= 0) break;

      // 1. Player Attack Phase
      for (const card of playerCards) {
        if (this.currentBoss.currentHp <= 0) break;
        await this.animateCardClash(card);

        // Calculate damage
        const isCrit = Math.random() < 0.35;
        const damage = Math.round((card.atk || 1500) * (isCrit ? 1.5 : 1.0) * (0.9 + Math.random() * 0.2));
        this.currentBoss.currentHp = Math.max(0, this.currentBoss.currentHp - damage);

        // Sound & Floating Damage
        if (window.soundFX) window.soundFX.playClash();
        this.spawnDamagePopup(damage, isCrit, 'boss');
        this.updateBossHpBar();

        if (logEl) {
          logEl.innerHTML = `<div class="text-white"><span class="font-bold text-amber-400">${card.name}</span> strikes for <span class="text-rose-400 font-black">${damage} DMG</span>${isCrit ? ' 💥 CRITICAL!' : ''}!</div>` + logEl.innerHTML;
        }

        await new Promise(r => setTimeout(r, 650));
      }

      if (this.currentBoss.currentHp <= 0) break;

      // 2. Boss Counter Attack Phase
      await new Promise(r => setTimeout(r, 400));
      await this.animateBossAttack();

      const bossDmg = Math.round(this.currentBoss.atk * (0.85 + Math.random() * 0.3));
      playerCurHp = Math.max(0, playerCurHp - bossDmg);

      if (window.soundFX) window.soundFX.playClash();
      this.spawnDamagePopup(bossDmg, false, 'player');

      if (logEl) {
        logEl.innerHTML = `<div class="text-purple-300">💥 <span class="font-bold text-purple-400">${this.currentBoss.name}</span> unleashes Void Nova for <span class="text-rose-400 font-bold">${bossDmg} DMG</span>!</div>` + logEl.innerHTML;
      }

      await new Promise(r => setTimeout(r, 800));
    }

    // Battle Conclusion
    const won = this.currentBoss.currentHp <= 0;
    this.handleBattleResult(won);
    this.isBattling = false;
    if (startBtn) startBtn.disabled = false;
  }

  // Animate Card lunge forward
  animateCardClash(card) {
    return new Promise(resolve => {
      anime({
        targets: '#arena-player-deck .arena-card-slot',
        translateY: [0, -40, 0],
        scale: [1, 1.08, 1],
        duration: 380,
        easing: 'easeOutBack',
        complete: resolve
      });
    });
  }

  // Animate Boss shake and slam
  animateBossAttack() {
    return new Promise(resolve => {
      anime({
        targets: '#arena-boss-card',
        translateY: [0, 50, 0],
        scale: [1, 1.15, 1],
        duration: 450,
        easing: 'easeOutElastic(1, .8)',
        complete: resolve
      });
    });
  }

  // Spawn floating RPG damage numbers
  spawnDamagePopup(damage, isCrit, target) {
    const parent = document.getElementById(target === 'boss' ? 'arena-boss-container' : 'arena-player-container');
    if (!parent) return;

    const popup = document.createElement('div');
    popup.className = `absolute z-50 font-orbitron font-black pointer-events-none ${isCrit ? 'text-amber-300 text-2xl sm:text-3xl' : 'text-rose-400 text-lg sm:text-xl'}`;
    popup.style.left = '50%';
    popup.style.top = '40%';
    popup.style.textShadow = '0 0 12px rgba(0,0,0,0.9), 0 0 20px currentColor';
    popup.innerText = `-${damage.toLocaleString()}${isCrit ? ' 💥' : ''}`;
    parent.appendChild(popup);

    anime({
      targets: popup,
      translateY: [-20, -90],
      translateX: () => anime.random(-30, 30),
      opacity: [1, 0],
      scale: [isCrit ? 1.4 : 1, 0.7],
      duration: 1000,
      easing: 'easeOutExpo',
      complete: () => popup.remove()
    });
  }

  updateBossHpBar() {
    const bar = document.getElementById('arena-boss-hp-bar');
    const text = document.getElementById('arena-boss-hp-text');
    const pct = Math.max(0, Math.min(100, (this.currentBoss.currentHp / this.currentBoss.maxHp) * 100));

    if (bar) bar.style.width = `${pct}%`;
    if (text) text.innerText = `${this.currentBoss.currentHp.toLocaleString()} / ${this.currentBoss.maxHp.toLocaleString()} HP`;
  }

  // Victory / Defeat Modal or Alert
  handleBattleResult(won) {
    const resultModal = document.getElementById('arena-result-modal');
    const resultTitle = document.getElementById('arena-result-title');
    const resultMsg = document.getElementById('arena-result-message');
    const rewardBox = document.getElementById('arena-result-reward');

    if (!resultModal) return;

    if (won) {
      if (window.soundFX) window.soundFX.playVictory();
      // Reward 500 Gems
      window.gachaEngine.refillGems(500);

      resultTitle.innerText = "VICTORY ACHIEVED!";
      resultTitle.className = "font-orbitron font-black text-3xl sm:text-4xl text-amber-300 tracking-wider mb-2";
      resultMsg.innerText = `You crushed ${this.currentBoss.name} with your Astral Triad!`;
      rewardBox.innerHTML = `
        <div class="flex items-center justify-center gap-2 text-cyan-300 font-orbitron font-bold text-xl">
          <i data-lucide="gem" class="w-6 h-6 text-cyan-400"></i>
          <span>+500 Astral Gems Earned!</span>
        </div>
      `;
    } else {
      if (window.soundFX) window.soundFX.playClick();
      resultTitle.innerText = "DEFEAT...";
      resultTitle.className = "font-orbitron font-black text-3xl sm:text-4xl text-rose-500 tracking-wider mb-2";
      resultMsg.innerText = "Your team fell to the Void Overlord. Upgrade your cards and try again!";
      rewardBox.innerHTML = `<div class="text-slate-400 text-sm">No gems earned this duel.</div>`;
    }

    if (window.lucide) window.lucide.createIcons({ root: resultModal });

    resultModal.classList.remove('hidden');
    anime({
      targets: '#arena-result-content',
      scale: [0.85, 1],
      opacity: [0, 1],
      duration: 400,
      easing: 'easeOutBack'
    });
  }

  closeResultModal() {
    const resultModal = document.getElementById('arena-result-modal');
    if (resultModal) {
      resultModal.classList.add('hidden');
      this.currentBoss.currentHp = this.currentBoss.maxHp;
      this.updateBossHpBar();
    }
  }
}

// Global arena instance
window.arenaDuelManager = new ArenaDuelManager();

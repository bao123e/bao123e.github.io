/**
 * WUTHERING WAVES // AKADEMIYA TERMINAL
 * wuwaTierList.js - Endgame Meta Tier List Engine (ToA, Whimpering Wastes, Matrix)
 */

class WuWaTierList {
  constructor() {
    this.activeMode = 'toa'; // 'toa' | 'ww' | 'matrix'
    this.filterElement = 'all';
    this.filterWeapon = 'all';
    this.filterSearch = '';
    this.resonators = [];
    this.selectedResonator = null;

    window.addEventListener('wuwa_data_ready', (e) => {
      this.initData(e.detail);
    });

    window.addEventListener('wuwa_lang_changed', () => {
      this.render();
      if (this.selectedResonator) {
        this.openBuildModal(this.selectedResonator.id);
      }
    });
  }

  initData(masterData) {
    if (masterData && masterData.resonators) {
      this.resonators = masterData.resonators;
      this.render();
    }
  }

  setMode(mode) {
    if (this.activeMode === mode) return;
    this.activeMode = mode;
    this.render();
  }

  setFilterElement(elem) {
    this.filterElement = elem;
    this.render();
  }

  setFilterWeapon(weap) {
    this.filterWeapon = weap;
    this.render();
  }

  setFilterSearch(query) {
    this.filterSearch = query.trim().toLowerCase();
    this.render();
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

  render() {
    const container = document.getElementById('tierlist-container');
    if (!container) return;

    const lang = window.wuwaI18n ? window.wuwaI18n.getLang() : 'vi';
    const t = (k) => window.wuwaI18n ? window.wuwaI18n.t(k) : k;

    // Filter resonators
    const filtered = this.resonators.filter(r => {
      if (this.filterElement !== 'all' && r.element !== this.filterElement) return false;
      if (this.filterWeapon !== 'all' && r.weapon !== this.filterWeapon) return false;
      if (this.filterSearch) {
        const nameEn = (r.name.en || '').toLowerCase();
        const nameVi = (r.name.vi || '').toLowerCase();
        if (!nameEn.includes(this.filterSearch) && !nameVi.includes(this.filterSearch)) return false;
      }
      return true;
    });

    const tiers = ['T0', 'T0.5', 'T1', 'T1.5', 'T2', 'T3'];
    const roles = ['main_dps', 'sub_dps', 'support'];

    let html = `
      <!-- Tier List Mode Description Banner -->
      <div class="glass-panel p-4 rounded-2xl border border-amber-400/30 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-[#0e1322] to-slate-950">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <i data-lucide="${this.activeMode === 'toa' ? 'flame' : (this.activeMode === 'ww' ? 'wind' : 'cpu')}" class="w-5 h-5"></i>
          </div>
          <div>
            <h2 class="font-orbitron font-black text-sm sm:text-base text-white tracking-wider">
              ${t('modes.' + this.activeMode)}
            </h2>
            <p class="text-xs text-slate-400 font-mono mt-0.5">
              ${t('modes.' + this.activeMode + 'Desc')}
            </p>
          </div>
        </div>
        <div class="text-[11px] font-mono text-amber-300 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <span>Active Filter: </span>
          <strong>${filtered.length} / ${this.resonators.length} Resonators</strong>
        </div>
      </div>

      <!-- Matrix Header (Roles Columns) -->
      <div class="hidden lg:grid grid-cols-12 gap-3 mb-2 px-3 text-xs font-orbitron font-black uppercase text-slate-400 tracking-wider">
        <div class="col-span-2 text-center text-amber-400">TIER RANK</div>
        <div class="col-span-4 text-center border-b border-amber-400/20 pb-1">${t('roles.main_dps')}</div>
        <div class="col-span-3 text-center border-b border-purple-400/20 pb-1">${t('roles.sub_dps')}</div>
        <div class="col-span-3 text-center border-b border-emerald-400/20 pb-1">${t('roles.support')}</div>
      </div>
    `;

    // Tier Rows
    tiers.forEach(tierKey => {
      const tierLabel = tierKey;
      const tierBadgeColor = tierKey === 'T0'
        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.6)]'
        : (tierKey === 'T0.5'
          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-400'
          : (tierKey === 'T1'
            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400'
            : 'bg-slate-800 text-slate-300 border-white/10'));

      html += `
        <div class="tier-row glass-panel rounded-2xl border border-white/10 p-3 sm:p-4 mb-3.5 transition-all hover:border-amber-400/40">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            
            <!-- Tier Badge Column -->
            <div class="col-span-1 lg:col-span-2 flex lg:flex-col items-center justify-between lg:justify-center p-2 rounded-xl bg-black/40 border border-white/5">
              <span class="font-orbitron font-black text-sm sm:text-base px-3 py-1 rounded-xl border ${tierBadgeColor}">
                ${tierLabel}
              </span>
              <span class="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest hidden lg:inline">
                ${tierKey === 'T0' ? 'Dominant' : (tierKey === 'T0.5' ? 'Elite' : (tierKey === 'T1' ? 'Top Pick' : 'Standard'))}
              </span>
            </div>

            <!-- Role 1: Main DPS -->
            <div class="col-span-1 lg:col-span-4 min-h-[70px] bg-black/25 rounded-xl p-2 border border-white/5">
              <div class="text-[10px] font-mono text-amber-300 font-bold mb-1.5 lg:hidden">${t('roles.main_dps')}</div>
              <div class="flex flex-wrap gap-2.5 items-center">
                ${this.renderResonatorCards(filtered, tierKey, 'main_dps', lang)}
              </div>
            </div>

            <!-- Role 2: Sub-DPS -->
            <div class="col-span-1 lg:col-span-3 min-h-[70px] bg-black/25 rounded-xl p-2 border border-white/5">
              <div class="text-[10px] font-mono text-purple-300 font-bold mb-1.5 lg:hidden">${t('roles.sub_dps')}</div>
              <div class="flex flex-wrap gap-2.5 items-center">
                ${this.renderResonatorCards(filtered, tierKey, 'sub_dps', lang)}
              </div>
            </div>

            <!-- Role 3: Support -->
            <div class="col-span-1 lg:col-span-3 min-h-[70px] bg-black/25 rounded-xl p-2 border border-white/5">
              <div class="text-[10px] font-mono text-emerald-300 font-bold mb-1.5 lg:hidden">${t('roles.support')}</div>
              <div class="flex flex-wrap gap-2.5 items-center">
                ${this.renderResonatorCards(filtered, tierKey, 'support', lang)}
              </div>
            </div>

          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  renderResonatorCards(list, tierKey, role, lang) {
    const matched = list.filter(r => {
      const rTier = (r.tiers && r.tiers[this.activeMode]) || 'T2';
      return rTier === tierKey && r.role === role;
    });

    if (matched.length === 0) {
      return `<span class="text-[11px] font-mono text-slate-600 italic py-2">--</span>`;
    }

    return matched.map(r => {
      const name = r.name[lang] || r.name.en;
      const elemColor = this.getElementColor(r.element);
      const avatarSrc = r.assets.avatar || r.assets.chibi || 'assets/jinhsi-official.webp';

      return `
        <div onclick="window.wuwaTierList.openBuildModal('${r.id}')"
             class="group relative w-14 sm:w-16 flex flex-col items-center cursor-pointer transform transition-all duration-200 hover:scale-110 active:scale-95"
             title="${name} (${r.element} • ${r.weapon}) - Click to view Build Guide">
          
          <!-- Avatar Frame -->
          <div class="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl overflow-hidden bg-slate-900 border-2 transition-all shadow-lg group-hover:shadow-[0_0_20px_${elemColor}]"
               style="border-color: ${elemColor}">
            <img src="${avatarSrc}" alt="${name}" class="w-full h-full object-cover object-top"
                 onerror="this.src='assets/jinhsi-official.webp'">
          </div>

          <!-- Element Indicator Dot -->
          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-black shadow"
                style="background-color: ${elemColor}" title="${r.element}"></span>

          <!-- Name label -->
          <span class="text-[10px] sm:text-[11px] font-orbitron font-bold text-slate-200 truncate max-w-full text-center mt-1 group-hover:text-amber-300">
            ${name}
          </span>
        </div>
      `;
    }).join('');
  }

  openBuildModal(resonatorId) {
    const res = this.resonators.find(r => r.id === resonatorId);
    if (!res) return;
    this.selectedResonator = res;

    const modal = document.getElementById('wuwa-build-modal');
    const content = document.getElementById('wuwa-build-modal-content');
    if (!modal || !content) return;

    const lang = window.wuwaI18n ? window.wuwaI18n.getLang() : 'vi';
    const t = (k) => window.wuwaI18n ? window.wuwaI18n.t(k) : k;

    const name = res.name[lang] || res.name.en;
    const elemColor = this.getElementColor(res.element);
    const analysis = res.build?.analysis ? (res.build.analysis[lang] || res.build.analysis.en) : 'No analysis available.';

    content.innerHTML = `
      <!-- Modal Header -->
      <div class="flex items-start justify-between border-b border-white/10 pb-4 mb-5">
        <div class="flex items-center gap-3.5">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 shadow-xl flex-shrink-0"
               style="border-color: ${elemColor}; box-shadow: 0 0 25px ${elemColor}40">
            <img src="${res.assets.avatar || res.assets.chibi}" alt="${name}" class="w-full h-full object-cover object-top"
                 onerror="this.src='assets/jinhsi-official.webp'">
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-orbitron font-black text-lg sm:text-2xl text-white">${name}</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
                    style="background-color: ${elemColor}25; color: ${elemColor}; border: 1px solid ${elemColor}60">
                ${res.element}
              </span>
              <span class="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                ${res.weapon}
              </span>
              <span class="text-amber-400 font-mono text-xs font-black">
                ${'★'.repeat(res.rarity || 5)}
              </span>
            </div>
            <div class="text-xs font-mono text-slate-400 mt-1">
              Role: <strong class="text-amber-300">${t('roles.' + res.role)}</strong>
            </div>
          </div>
        </div>

        <button onclick="window.wuwaTierList.closeBuildModal()"
                class="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:border-amber-400 transition-all cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Mode Tiers Badges -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-5 text-center font-orbitron">
        <div class="p-2.5 rounded-xl bg-black/50 border border-amber-400/20">
          <div class="text-[10px] text-slate-400 uppercase">ToA Rank</div>
          <div class="font-black text-sm sm:text-base text-amber-300 mt-0.5">${res.tiers?.toa || 'T1'}</div>
        </div>
        <div class="p-2.5 rounded-xl bg-black/50 border border-purple-400/20">
          <div class="text-[10px] text-slate-400 uppercase">WW Rank</div>
          <div class="font-black text-sm sm:text-base text-purple-300 mt-0.5">${res.tiers?.ww || 'T1'}</div>
        </div>
        <div class="p-2.5 rounded-xl bg-black/50 border border-sky-400/20">
          <div class="text-[10px] text-slate-400 uppercase">Matrix Rank</div>
          <div class="font-black text-sm sm:text-base text-sky-300 mt-0.5">${res.tiers?.matrix || 'T1'}</div>
        </div>
      </div>

      <!-- Build Specifications Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5 font-mono text-xs">
        
        <!-- Weapon & Main Echo -->
        <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-amber-400">
              <i data-lucide="sword" class="w-3.5 h-3.5"></i>
              <span>${t('buildModal.bestWeapon')}</span>
            </div>
            <div class="font-bold text-slate-100 bg-slate-900/80 p-2 rounded-xl border border-white/5">
              ${res.build?.bestWeapon || 'Signature 5★ Weapon'}
            </div>
          </div>

          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-cyan-400">
              <i data-lucide="shield" class="w-3.5 h-3.5"></i>
              <span>${t('buildModal.mainEcho')}</span>
            </div>
            <div class="font-bold text-slate-100 bg-slate-900/80 p-2 rounded-xl border border-white/5">
              ${res.build?.mainEcho || 'Cost-4 Calamity/Overlord'}
            </div>
          </div>
        </div>

        <!-- Echo Set & Stat Priority -->
        <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-purple-400">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
              <span>${t('buildModal.echoSet')}</span>
            </div>
            <div class="font-bold text-slate-100 bg-slate-900/80 p-2 rounded-xl border border-white/5">
              ${res.build?.echoSet || '5pc Sonata Effect'}
            </div>
          </div>

          <div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-emerald-400">
              <i data-lucide="activity" class="w-3.5 h-3.5"></i>
              <span>${t('buildModal.statPriority')}</span>
            </div>
            <div class="font-bold text-slate-100 bg-slate-900/80 p-2 rounded-xl border border-white/5">
              ${res.build?.statPriority || 'Crit Rate / DMG > Element% > ATK%'}
            </div>
          </div>
        </div>

      </div>

      <!-- Tactical Analysis & Playstyle Review -->
      <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 mb-5">
        <div class="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">
          <i data-lucide="book-open" class="w-4 h-4 text-amber-400"></i>
          <span>${t('buildModal.tacticalAnalysis')}</span>
        </div>
        <p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
          ${analysis}
        </p>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <button onclick="window.wuwaTierList.closeBuildModal()"
                class="glass-panel hover:bg-slate-800 text-slate-300 font-orbitron font-bold text-xs px-5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer">
          ${t('buildModal.closeBtn')}
        </button>
        <button onclick="window.wuwaTierList.deployToCombat('${res.id}')"
                class="btn-summon-glow text-white font-orbitron font-black text-xs px-6 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer active:scale-95">
          <i data-lucide="swords" class="w-4 h-4 text-amber-300"></i>
          <span>${t('buildModal.deployBtn')}</span>
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }

  closeBuildModal() {
    const modal = document.getElementById('wuwa-build-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }

  deployToCombat(resonatorId) {
    this.closeBuildModal();
    if (window.wuwaCombat) {
      window.wuwaCombat.addResonatorToSquad(resonatorId);
    }
    if (window.appController) {
      window.appController.switchView('combat');
    }
  }
}

window.wuwaTierList = new WuWaTierList();

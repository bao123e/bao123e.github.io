/**
 * AETHERIA TCG - Wuthering Waves (鸣潮) Convene & Resonator Gacha System
 * Full faithful clone of Kuro Games' Wuthering Waves Convene Engine:
 * - Sonoro Sphere frequency tuning & sound wave drop sequence
 * - Sonic Meteor Beam with Apex Supernova Reality Shatter for 5★ Gold drops
 * - Resonator Silhouette tease with chromatic aberration inversion
 * - Full-screen character splash art with Element Crests & Forte stats
 * - Authentic 10-Item Diamond Convene Summary Grid
 * - Standalone Dedicated WuWa Tracker Dashboard View & Convene Telemetry Analytics
 */

class WuWaConveneEngine {
  constructor() {
    this.isConvening = false;
    this.currentBanner = 'all'; // 'all' | 'jinhsi' | 'changli' | 'camellya' | ...
    this.pity5Star = 0; // 0 to 70
    this.pity4Star = 0; // 0 to 10
    this.totalWuWaPulls = 0;
    this.pullHistory = [];
    this.activeTrackerFilter = 'all'; // 'all' | '5' | '4' | '3'
    this.trackerSearchQuery = '';

    this.banners = {
      all: {
        id: 'all',
        title: 'TIDAL CONVERGENCE',
        subtitle: 'Standard Convene • All 48 Resonators & 64 Weapons (Equal 5★ Odds)',
        featured5Star: null,
        element: 'Omni',
        themeColor: '#38bdf8',
        rateUp4Stars: [],
        bgGradient: 'from-blue-950/60 via-slate-950/90 to-[#070913]'
      },
      jinhsi: {
        id: 'jinhsi',
        title: 'TIDES OF JINZHOU',
        subtitle: 'Magistrate’s Mandate • Featured Resonator Convene',
        featured5Star: 'wuwa-5-jinhsi',
        element: 'Spectro',
        themeColor: '#facc15',
        rateUp4Stars: ['wuwa-4-sanhua', 'wuwa-4-danjin', 'wuwa-4-mortefi'],
        bgGradient: 'from-amber-950/60 via-slate-950/90 to-[#070913]'
      },
      changli: {
        id: 'changli',
        title: 'SOLITARY ASHEN FLAME',
        subtitle: 'Blazing Feather • Featured Resonator Convene',
        featured5Star: 'wuwa-5-changli',
        element: 'Fusion',
        themeColor: '#f43f5e',
        rateUp4Stars: ['wuwa-4-chixia', 'wuwa-4-mortefi', 'wuwa-4-baizhi'],
        bgGradient: 'from-rose-950/60 via-slate-950/90 to-[#070913]'
      },
      camellya: {
        id: 'camellya',
        title: 'CRIMSON BLOOM',
        subtitle: 'Black Shores Sprout • Featured Resonator Convene',
        featured5Star: 'wuwa-5-camellya',
        element: 'Havoc',
        themeColor: '#c026d3',
        rateUp4Stars: ['wuwa-4-danjin', 'wuwa-4-sanhua', 'wuwa-4-lumi'],
        bgGradient: 'from-fuchsia-950/60 via-slate-950/90 to-[#070913]'
      },
      shorekeeper: {
        id: 'shorekeeper',
        title: 'QUIET SEA OF REMNANTS',
        subtitle: 'Overseer of Black Shores • Featured Resonator Convene',
        featured5Star: 'wuwa-5-shorekeeper',
        element: 'Spectro',
        themeColor: '#06b6d4',
        rateUp4Stars: ['wuwa-4-baizhi', 'wuwa-4-yangyang', 'wuwa-4-aalto'],
        bgGradient: 'from-cyan-950/60 via-slate-950/90 to-[#070913]'
      },
      carlotta: {
        id: 'carlotta',
        title: 'SONANCE DIVA',
        subtitle: 'Frost Harmonizer • Featured Resonator Convene',
        featured5Star: 'wuwa-5-carlotta',
        element: 'Glacio',
        themeColor: '#38bdf8',
        rateUp4Stars: ['wuwa-4-buling', 'wuwa-4-sanhua', 'wuwa-4-chixia'],
        bgGradient: 'from-sky-950/60 via-slate-950/90 to-[#070913]'
      },
      yinlin: {
        id: 'yinlin',
        title: 'LIGHTNING CRADLE',
        subtitle: 'Zapstring Overseer • Featured Resonator Convene',
        featured5Star: 'wuwa-5-yinlin',
        element: 'Electro',
        themeColor: '#8b5cf6',
        rateUp4Stars: ['wuwa-4-danjin', 'wuwa-4-mortefi', 'wuwa-4-lumi'],
        bgGradient: 'from-violet-950/60 via-slate-950/90 to-[#070913]'
      },
      jiyan: {
        id: 'jiyan',
        title: 'VERDANT DRAGON TEMPEST',
        subtitle: 'Midnight Rangers General • Featured Resonator Convene',
        featured5Star: 'wuwa-5-jiyan',
        element: 'Aero',
        themeColor: '#10b981',
        rateUp4Stars: ['wuwa-4-mortefi', 'wuwa-4-yangyang', 'wuwa-4-aalto'],
        bgGradient: 'from-emerald-950/60 via-slate-950/90 to-[#070913]'
      },
      phrolova: {
        id: 'phrolova',
        title: 'ABYSSAL DISCORD',
        subtitle: 'Fractsidus Sonata • Featured Resonator Convene',
        featured5Star: 'wuwa-5-phrolova',
        element: 'Havoc',
        themeColor: '#d946ef',
        rateUp4Stars: ['wuwa-4-danjin', 'wuwa-4-sanhua', 'wuwa-4-yangyang'],
        bgGradient: 'from-purple-950/60 via-slate-950/90 to-[#070913]'
      }
    };

    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('aetheria_wuwa_pity');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.pity5Star = parsed.pity5Star || 0;
        this.pity4Star = parsed.pity4Star || 0;
        this.totalWuWaPulls = parsed.totalWuWaPulls || 0;
      }
      const historySaved = localStorage.getItem('aetheria_wuwa_history');
      if (historySaved) {
        this.pullHistory = JSON.parse(historySaved);
      } else {
        this.pullHistory = [];
      }
    } catch (e) {
      console.warn('Failed to load WuWa pity state:', e);
      this.pullHistory = [];
    }
  }

  saveState() {
    try {
      localStorage.setItem('aetheria_wuwa_pity', JSON.stringify({
        pity5Star: this.pity5Star,
        pity4Star: this.pity4Star,
        totalWuWaPulls: this.totalWuWaPulls
      }));
      localStorage.setItem('aetheria_wuwa_history', JSON.stringify(this.pullHistory));
    } catch (e) {
      console.warn('Failed to save WuWa pity state:', e);
    }
    this.updatePityUI();
    this.updateTrackerSummaryPill();
  }

  init() {
    this.bindEvents();
    this.initTrackerUI();
    this.renderBannerDetails();
    this.updatePityUI();
    this.updateTrackerSummaryPill();
  }

  bindEvents() {
    // Banner tab switchers
    document.querySelectorAll('.wuwa-banner-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchBanner(btn.dataset.banner);
      });
    });

    // Convene Buttons (1x = 160 Astrite, 10x = 1,600 Astrite)
    const btn1x = document.getElementById('wuwa-convene-1x-btn');
    const btn10x = document.getElementById('wuwa-convene-10x-btn');

    if (btn1x) {
      btn1x.addEventListener('click', () => this.executeConvene(1));
    }
    if (btn10x) {
      btn10x.addEventListener('click', () => this.executeConvene(10));
    }

    // Splash reveal skip / proceed
    const splashNextBtn = document.getElementById('wuwa-splash-next-btn');
    if (splashNextBtn) {
      splashNextBtn.addEventListener('click', () => {
        if (this.onSplashNext) this.onSplashNext();
      });
    }

    // Result summary close / convene again / open tracker
    const closeSummaryBtn = document.getElementById('wuwa-summary-close-btn');
    if (closeSummaryBtn) {
      closeSummaryBtn.addEventListener('click', () => this.closeSummary());
    }

    const againBtn = document.getElementById('wuwa-summary-again-btn');
    if (againBtn) {
      againBtn.addEventListener('click', () => {
        this.closeSummary();
        setTimeout(() => this.executeConvene(10), 300);
      });
    }

    const summaryTrackerBtn = document.getElementById('wuwa-summary-tracker-btn');
    if (summaryTrackerBtn) {
      summaryTrackerBtn.addEventListener('click', () => {
        this.closeSummary();
        this.openTrackerDashboardView();
      });
    }
  }

  // Bind WuWa Tracker standalone dashboard & modal events
  initTrackerUI() {
    // Open Dedicated Dashboard View
    const openBtn = document.getElementById('wuwa-tracker-open-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.openTrackerDashboardView());
    }

    // Go back to Convene from Dashboard
    const goConveneBtn = document.getElementById('dash-go-convene-btn');
    if (goConveneBtn) {
      goConveneBtn.addEventListener('click', () => {
        if (window.appController) window.appController.switchView('wuwa');
      });
    }

    // Reset Buttons (both dashboard & modal)
    const dashResetBtn = document.getElementById('dash-reset-btn');
    if (dashResetBtn) {
      dashResetBtn.addEventListener('click', () => this.resetHistory());
    }
    const modalResetBtn = document.getElementById('wuwa-tracker-reset-btn');
    if (modalResetBtn) {
      modalResetBtn.addEventListener('click', () => this.resetHistory());
    }

    // Modal Close
    const closeBtn = document.getElementById('wuwa-tracker-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeTrackerModal());
    }

    // Filter tabs in Standalone Dashboard
    document.querySelectorAll('.dash-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dash-filter-btn').forEach(b => {
          b.classList.remove('active', 'border-amber-400', 'bg-amber-500/20', 'text-amber-300');
          b.classList.add('border-transparent', 'text-slate-400');
        });
        btn.classList.add('active', 'border-amber-400', 'bg-amber-500/20', 'text-amber-300');
        btn.classList.remove('border-transparent', 'text-slate-400');

        this.activeTrackerFilter = btn.dataset.dashFilter || 'all';
        this.renderDashboardTable();
      });
    });

    // Search input in Standalone Dashboard
    const dashSearch = document.getElementById('dash-search-input');
    if (dashSearch) {
      dashSearch.addEventListener('input', (e) => {
        this.trackerSearchQuery = e.target.value.toLowerCase().trim();
        this.renderDashboardTable();
      });
    }

    // Modal Filter tabs
    document.querySelectorAll('.tracker-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tracker-filter-btn').forEach(b => {
          b.classList.remove('active', 'border-amber-400', 'bg-amber-500/20', 'text-amber-300');
          b.classList.add('border-transparent', 'text-slate-400');
        });
        btn.classList.add('active', 'border-amber-400', 'bg-amber-500/20', 'text-amber-300');
        btn.classList.remove('border-transparent', 'text-slate-400');

        this.activeTrackerFilter = btn.dataset.trackerFilter || 'all';
        this.renderHistoryTable();
      });
    });

    // Modal Search input
    const modalSearch = document.getElementById('tracker-search-input');
    if (modalSearch) {
      modalSearch.addEventListener('input', (e) => {
        this.trackerSearchQuery = e.target.value.toLowerCase().trim();
        this.renderHistoryTable();
      });
    }
  }

  // Open Standalone View or Modal
  openTrackerDashboardView() {
    if (window.soundFX) window.soundFX.playClick();
    if (window.appController) {
      window.appController.switchView('tracker');
    } else {
      this.openTrackerModal();
    }
  }

  openTrackerModal() {
    const modal = document.getElementById('wuwa-tracker-modal');
    if (!modal) return;

    if (window.soundFX) window.soundFX.playClick();
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    this.renderTrackerStats();
    if (window.lucide) window.lucide.createIcons();
  }

  closeTrackerModal() {
    const modal = document.getElementById('wuwa-tracker-modal');
    if (!modal) return;
    if (window.soundFX) window.soundFX.playClick();
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }

  resetHistory() {
    if (!confirm('Bạn có chắc chắn muốn đặt lại toàn bộ lịch sử roll và dữ liệu WuWa Tracker không?')) {
      return;
    }
    this.pullHistory = [];
    this.pity5Star = 0;
    this.pity4Star = 0;
    this.totalWuWaPulls = 0;
    this.saveState();
    this.renderTrackerDashboard();
    this.renderTrackerStats();
    if (window.appController) {
      window.appController.showToast('✅ Đã đặt lại toàn bộ lịch sử WuWa Tracker!');
    }
  }

  updateTrackerSummaryPill() {
    const pill = document.getElementById('wuwa-tracker-summary-pill');
    const astriteEl = document.getElementById('wuwa-astrite-spent');
    const quick5PityEl = document.getElementById('wuwa-quick-5star-pity');

    const total = this.pullHistory.length;
    const goldPulls = this.pullHistory.filter(p => p.stars === 5);
    const goldCount = goldPulls.length;

    const featuredPulls = goldPulls.filter(p => p.is5050Won !== null);
    const won5050 = featuredPulls.filter(p => p.is5050Won === true).length;
    const winRate = featuredPulls.length > 0 ? Math.round((won5050 / featuredPulls.length) * 100) : 100;

    const avgPity = goldCount > 0
      ? (goldPulls.reduce((acc, c) => acc + (c.pity || 0), 0) / goldCount).toFixed(1)
      : '0.0';

    if (pill) {
      pill.innerHTML = `Total: <strong class="text-white">${total}</strong> pulls • 5★: <strong class="text-amber-400">${goldCount}</strong> • 50/50: <strong class="text-emerald-400">${winRate}%</strong>`;
    }
    if (astriteEl) {
      astriteEl.innerText = `${(total * 160).toLocaleString()} ✦`;
    }
    if (quick5PityEl) {
      quick5PityEl.innerText = `Avg 5★: ${avgPity} pulls`;
    }
  }

  // =========================================================================
  // STANDALONE DEDICATED TRACKER DASHBOARD (VIEW-TRACKER)
  // =========================================================================
  renderTrackerDashboard() {
    const totalPulls = this.pullHistory.length;
    const astriteSpent = totalPulls * 160;

    const goldPulls = this.pullHistory.filter(p => p.stars === 5);
    const purplePulls = this.pullHistory.filter(p => p.stars === 4);
    const bluePulls = this.pullHistory.filter(p => p.stars === 3);

    const goldCount = goldPulls.length;
    const purpleCount = purplePulls.length;
    const blueCount = bluePulls.length;

    const goldRate = totalPulls > 0 ? ((goldCount / totalPulls) * 100).toFixed(2) + '%' : '0.00%';
    const purpleRate = totalPulls > 0 ? ((purpleCount / totalPulls) * 100).toFixed(2) + '%' : '0.00%';
    const blueRate = totalPulls > 0 ? ((blueCount / totalPulls) * 100).toFixed(2) + '%' : '0.00%';

    const avgPity = goldCount > 0
      ? (goldPulls.reduce((acc, c) => acc + (c.pity || 0), 0) / goldCount).toFixed(1)
      : '0.0';

    const featuredPulls = goldPulls.filter(p => p.is5050Won !== null);
    const wonCount = featuredPulls.filter(p => p.is5050Won === true).length;
    const lostCount = featuredPulls.filter(p => p.is5050Won === false).length;
    const winRate = featuredPulls.length > 0 ? Math.round((wonCount / featuredPulls.length) * 100) : 100;

    // Update Dashboard KPI Elements
    const totalEl = document.getElementById('dash-stat-total-pulls');
    const astriteEl = document.getElementById('dash-stat-astrite');
    const goldCountEl = document.getElementById('dash-stat-5star-count');
    const goldRateEl = document.getElementById('dash-stat-5star-rate');
    const avgPityEl = document.getElementById('dash-stat-avg-pity');
    const pityProgEl = document.getElementById('dash-stat-pity-progress');
    const winRateEl = document.getElementById('dash-stat-win-rate');
    const winLossEl = document.getElementById('dash-stat-win-loss');
    const purpleCountEl = document.getElementById('dash-stat-4star-count');
    const purpleRateEl = document.getElementById('dash-stat-4star-rate');

    if (totalEl) totalEl.innerText = totalPulls.toLocaleString();
    if (astriteEl) astriteEl.innerText = `${astriteSpent.toLocaleString()} Astrite (✦)`;
    if (goldCountEl) goldCountEl.innerText = goldCount;
    if (goldRateEl) goldRateEl.innerText = `Rate: ${goldRate} (Base: 0.8%)`;
    if (avgPityEl) avgPityEl.innerText = avgPity;
    if (pityProgEl) pityProgEl.innerText = `Current Pity: ${this.pity5Star} / 80 (≤ ${80 - this.pity5Star} to guarantee)`;
    if (winRateEl) winRateEl.innerText = `${winRate}%`;
    if (winLossEl) winLossEl.innerText = `${wonCount} Won / ${lostCount} Lost`;
    if (purpleCountEl) purpleCountEl.innerText = purpleCount;
    if (purpleRateEl) purpleRateEl.innerText = `Rate: ${purpleRate} (Base: 12%)`;

    // Rarity Distribution Bar
    const distSummary = document.getElementById('dash-dist-summary');
    const bar5 = document.getElementById('dash-bar-5star');
    const bar4 = document.getElementById('dash-bar-4star');
    const bar3 = document.getElementById('dash-bar-3star');
    const leg5 = document.getElementById('dash-leg-5star');
    const leg4 = document.getElementById('dash-leg-4star');
    const leg3 = document.getElementById('dash-leg-3star');

    if (distSummary) distSummary.innerText = `${totalPulls.toLocaleString()} lượt quay đã ghi nhận`;
    const denom = totalPulls || 1;
    if (bar5) bar5.style.width = `${((goldCount / denom) * 100).toFixed(1)}%`;
    if (bar4) bar4.style.width = `${((purpleCount / denom) * 100).toFixed(1)}%`;
    if (bar3) bar3.style.width = `${((blueCount / denom) * 100).toFixed(1)}%`;

    if (leg5) leg5.innerText = `${goldCount} (${goldRate})`;
    if (leg4) leg4.innerText = `${purpleCount} (${purpleRate})`;
    if (leg3) leg3.innerText = `${blueCount} (${blueRate})`;

    // Badges in Filters
    const countAll = document.getElementById('dash-count-all');
    const count5 = document.getElementById('dash-count-5');
    const count4 = document.getElementById('dash-count-4');
    const count3 = document.getElementById('dash-count-3');
    const totalBadge = document.getElementById('dash-5star-total-badge');

    if (countAll) countAll.innerText = totalPulls;
    if (count5) count5.innerText = goldCount;
    if (count4) count4.innerText = purpleCount;
    if (count3) count3.innerText = blueCount;
    if (totalBadge) totalBadge.innerText = `${goldCount} Resonators`;

    // Render Timeline & Table
    this.renderDashboardTimeline(goldPulls);
    this.renderDashboardTable();

    // Also sync modal
    this.renderTrackerStats();

    if (window.lucide) window.lucide.createIcons();
  }

  renderDashboardTimeline(goldPulls) {
    const container = document.getElementById('dash-5star-timeline');
    if (!container) return;

    container.innerHTML = '';

    if (!goldPulls || goldPulls.length === 0) {
      container.innerHTML = `
        <div class="py-10 px-4 text-center text-slate-400 font-mono text-xs w-full bg-slate-950/60 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
          <i data-lucide="sparkles" class="w-6 h-6 text-amber-400/60"></i>
          <span class="text-white font-bold font-orbitron">Chưa có lượt nổ 5★ nào</span>
          <span class="text-slate-400 text-xs">Hãy thực hiện Convene x10 trên các banner để bắt đầu ghi nhận dữ liệu telemetry!</span>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Render 5★ timeline cards
    goldPulls.forEach((item) => {
      const card = document.createElement('div');
      const pityNum = item.pity || 1;

      let pityColor = 'bg-emerald-500 text-black';
      if (pityNum > 60) {
        pityColor = 'bg-rose-500 text-white';
      } else if (pityNum > 40) {
        pityColor = 'bg-amber-400 text-black';
      }

      let badge5050 = '';
      if (item.is5050Won === true) {
        badge5050 = '<span class="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Won 50/50</span>';
      } else if (item.is5050Won === false) {
        badge5050 = '<span class="text-[9px] font-mono text-purple-400 font-bold flex items-center gap-1"><i data-lucide="shield-alert" class="w-3 h-3"></i> Standard Drop</span>';
      } else {
        badge5050 = '<span class="text-[9px] font-mono text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="globe" class="w-3 h-3"></i> Omni Pool</span>';
      }

      card.className = 'flex-shrink-0 w-44 sm:w-48 rounded-2xl p-3.5 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-black border-2 border-amber-400/60 flex flex-col items-center text-center shadow-xl relative group select-none hover:border-amber-300 transition-all';
      card.innerHTML = `
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black border border-amber-400/80 mb-2 relative shadow-md">
          <img src="${item.icon || item.image || ''}" alt="${item.name}" class="w-full h-full object-cover"
               onerror="window.cardDataService.handleImageError(this, '${item.cardId}')">
          <span class="absolute top-0 right-0 bg-amber-400 text-black text-[9px] font-black px-1.5 font-mono">5★</span>
        </div>
        <div class="font-orbitron font-black text-xs sm:text-sm text-white truncate w-full" title="${item.name}">${item.name}</div>
        <div class="text-[10px] font-mono text-amber-300/90 font-bold mt-0.5">${item.element || 'Spectro'} ${item.weapon ? '• ' + item.weapon : ''}</div>
        
        <div class="mt-2 flex items-center gap-1">
          <span class="text-[10px] font-orbitron font-black px-2.5 py-0.5 rounded shadow ${pityColor}">
            Pity ${pityNum}
          </span>
        </div>
        
        <div class="mt-1.5">${badge5050}</div>
        <div class="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-full">${item.timeFormatted || ''}</div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  renderDashboardTable() {
    const tbody = document.getElementById('dash-history-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filtered = this.pullHistory.slice();

    if (this.activeTrackerFilter === '5') {
      filtered = filtered.filter(p => p.stars === 5);
    } else if (this.activeTrackerFilter === '4') {
      filtered = filtered.filter(p => p.stars === 4);
    } else if (this.activeTrackerFilter === '3') {
      filtered = filtered.filter(p => p.stars === 3);
    }

    if (this.trackerSearchQuery) {
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(this.trackerSearchQuery)) ||
        (p.element && p.element.toLowerCase().includes(this.trackerSearchQuery)) ||
        (p.bannerName && p.bannerName.toLowerCase().includes(this.trackerSearchQuery))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-500 font-mono text-xs">
            Không tìm thấy bản ghi nào khớp với điều kiện lọc.
          </td>
        </tr>
      `;
      return;
    }

    const total = this.pullHistory.length;
    filtered.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-white/5 transition-colors';

      const is5Star = item.stars === 5;
      const is4Star = item.stars === 4;

      const starBadge = is5Star
        ? 'bg-amber-400 text-black font-black'
        : (is4Star ? 'bg-purple-600 text-white font-bold' : 'bg-sky-600/60 text-sky-200');

      const nameColor = is5Star ? 'text-amber-300 font-bold' : (is4Star ? 'text-purple-300' : 'text-slate-300');
      const starStr = '★'.repeat(item.stars || 3);

      const pullNum = item.pullNumber || (total - idx);
      const pityNum = item.pity || '-';

      tr.innerHTML = `
        <td class="p-2.5 text-center text-slate-500 font-mono">${pullNum}</td>
        <td class="p-2.5 flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg overflow-hidden bg-black flex-shrink-0 border ${is5Star ? 'border-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : (is4Star ? 'border-purple-400' : 'border-sky-400/40')}">
            <img src="${item.icon || item.image || ''}" alt="${item.name}" class="w-full h-full object-cover"
                 onerror="window.cardDataService.handleImageError(this, '${item.cardId}')">
          </div>
          <span class="font-orbitron font-bold ${nameColor} text-xs truncate max-w-[170px]">${item.name}</span>
        </td>
        <td class="p-2.5 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono ${starBadge}">${starStr}</span>
        </td>
        <td class="p-2.5 text-slate-300 text-xs">
          ${item.element ? item.element + ' ' : ''}${item.category === 'resonator' ? 'Resonator' : 'Weapon'}
        </td>
        <td class="p-2.5 text-slate-400 text-[11px] truncate max-w-[150px]" title="${item.bannerName}">
          ${item.bannerName || 'Convene'}
        </td>
        <td class="p-2.5 text-center font-mono font-bold ${is5Star ? 'text-amber-400' : (is4Star ? 'text-purple-300' : 'text-slate-400')}">
          ${pityNum}
        </td>
        <td class="p-2.5 text-right text-slate-500 text-[11px] font-mono">
          ${item.timeFormatted || ''}
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // Sync Modal Stats
  renderTrackerStats() {
    const totalPulls = this.pullHistory.length;
    const astriteSpent = totalPulls * 160;

    const goldPulls = this.pullHistory.filter(p => p.stars === 5);
    const purplePulls = this.pullHistory.filter(p => p.stars === 4);
    const bluePulls = this.pullHistory.filter(p => p.stars === 3);

    const goldCount = goldPulls.length;
    const purpleCount = purplePulls.length;
    const blueCount = bluePulls.length;

    const goldRate = totalPulls > 0 ? ((goldCount / totalPulls) * 100).toFixed(2) + '%' : '0.00%';
    const avgPity = goldCount > 0
      ? (goldPulls.reduce((acc, c) => acc + (c.pity || 0), 0) / goldCount).toFixed(1)
      : '0.0';

    const featuredPulls = goldPulls.filter(p => p.is5050Won !== null);
    const wonCount = featuredPulls.filter(p => p.is5050Won === true).length;
    const lostCount = featuredPulls.filter(p => p.is5050Won === false).length;
    const winRate = featuredPulls.length > 0 ? Math.round((wonCount / featuredPulls.length) * 100) : 100;

    // Update Modal Elements
    const totalPullsEl = document.getElementById('tracker-stat-total-pulls');
    const astriteEl = document.getElementById('tracker-stat-astrite');
    const goldCountEl = document.getElementById('tracker-stat-5star-count');
    const goldRateEl = document.getElementById('tracker-stat-5star-rate');
    const avgPityEl = document.getElementById('tracker-stat-avg-pity');
    const pityProgEl = document.getElementById('tracker-stat-pity-progress');
    const winRateEl = document.getElementById('tracker-stat-win-rate');
    const winLossEl = document.getElementById('tracker-stat-win-loss');
    const totalBadgeEl = document.getElementById('tracker-5star-total-badge');

    if (totalPullsEl) totalPullsEl.innerText = totalPulls.toLocaleString();
    if (astriteEl) astriteEl.innerText = `${astriteSpent.toLocaleString()} Astrite (✦)`;
    if (goldCountEl) goldCountEl.innerText = goldCount;
    if (goldRateEl) goldRateEl.innerText = `Rate: ${goldRate} (Base: 0.8%)`;
    if (avgPityEl) avgPityEl.innerText = avgPity;
    if (pityProgEl) pityProgEl.innerText = `Current Pity: ${this.pity5Star} / 70 (≤ ${70 - this.pity5Star} to guarantee)`;
    if (winRateEl) winRateEl.innerText = `${winRate}%`;
    if (winLossEl) winLossEl.innerText = `${wonCount} Won / ${lostCount} Lost`;
    if (totalBadgeEl) totalBadgeEl.innerText = `${goldCount} Resonators`;

    const countAll = document.getElementById('tracker-count-all');
    const count5 = document.getElementById('tracker-count-5');
    const count4 = document.getElementById('tracker-count-4');
    const count3 = document.getElementById('tracker-count-3');

    if (countAll) countAll.innerText = totalPulls;
    if (count5) count5.innerText = goldCount;
    if (count4) count4.innerText = purpleCount;
    if (count3) count3.innerText = blueCount;

    this.renderTimeline(goldPulls);
    this.renderHistoryTable();
  }

  renderTimeline(goldPulls) {
    const container = document.getElementById('tracker-5star-timeline');
    if (!container) return;

    container.innerHTML = '';

    if (!goldPulls || goldPulls.length === 0) {
      container.innerHTML = `
        <div class="py-8 px-4 text-center text-slate-400 font-mono text-xs w-full bg-slate-950/60 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1.5">
          <i data-lucide="sparkles" class="w-5 h-5 text-amber-400/60"></i>
          <span>Chưa có lượt nổ 5★ nào. Thực hiện Convene x10 để bắt đầu ghi nhận dữ liệu!</span>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    goldPulls.forEach((item) => {
      const card = document.createElement('div');
      const pityNum = item.pity || 1;

      let pityColor = 'bg-emerald-500 text-black';
      if (pityNum > 60) {
        pityColor = 'bg-rose-500 text-white';
      } else if (pityNum > 40) {
        pityColor = 'bg-amber-400 text-black';
      }

      let badge5050 = '';
      if (item.is5050Won === true) {
        badge5050 = '<span class="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Won 50/50</span>';
      } else if (item.is5050Won === false) {
        badge5050 = '<span class="text-[9px] font-mono text-purple-400 font-bold flex items-center gap-1"><i data-lucide="shield-alert" class="w-3 h-3"></i> Standard Drop</span>';
      } else {
        badge5050 = '<span class="text-[9px] font-mono text-cyan-400 font-bold flex items-center gap-1"><i data-lucide="globe" class="w-3 h-3"></i> Omni Pool</span>';
      }

      card.className = 'flex-shrink-0 w-44 rounded-2xl p-3 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-black border-2 border-amber-400/60 flex flex-col items-center text-center shadow-xl relative group select-none hover:border-amber-300 transition-all';
      card.innerHTML = `
        <div class="w-16 h-16 rounded-xl overflow-hidden bg-black border border-amber-400/80 mb-2 relative shadow-md">
          <img src="${item.icon || item.image || ''}" alt="${item.name}" class="w-full h-full object-cover"
               onerror="window.cardDataService.handleImageError(this, '${item.cardId}')">
          <span class="absolute top-0 right-0 bg-amber-400 text-black text-[9px] font-black px-1 font-mono">5★</span>
        </div>
        <div class="font-orbitron font-black text-xs text-white truncate w-full" title="${item.name}">${item.name}</div>
        <div class="text-[10px] font-mono text-amber-300/90 font-bold mt-0.5">${item.element || 'Spectro'} ${item.weapon ? '• ' + item.weapon : ''}</div>
        
        <div class="mt-2 flex items-center gap-1">
          <span class="text-[10px] font-orbitron font-black px-2 py-0.5 rounded shadow ${pityColor}">
            Pity ${pityNum}
          </span>
        </div>
        
        <div class="mt-1.5">${badge5050}</div>
        <div class="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-full">${item.timeFormatted || ''}</div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  renderHistoryTable() {
    const tbody = document.getElementById('tracker-history-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filtered = this.pullHistory.slice();

    if (this.activeTrackerFilter === '5') {
      filtered = filtered.filter(p => p.stars === 5);
    } else if (this.activeTrackerFilter === '4') {
      filtered = filtered.filter(p => p.stars === 4);
    } else if (this.activeTrackerFilter === '3') {
      filtered = filtered.filter(p => p.stars === 3);
    }

    if (this.trackerSearchQuery) {
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(this.trackerSearchQuery)) ||
        (p.element && p.element.toLowerCase().includes(this.trackerSearchQuery)) ||
        (p.bannerName && p.bannerName.toLowerCase().includes(this.trackerSearchQuery))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-6 text-center text-slate-500 font-mono text-xs">
            Không tìm thấy bản ghi nào khớp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    const total = this.pullHistory.length;
    filtered.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-white/5 transition-colors';

      const is5Star = item.stars === 5;
      const is4Star = item.stars === 4;

      const starBadge = is5Star
        ? 'bg-amber-400 text-black font-black'
        : (is4Star ? 'bg-purple-600 text-white font-bold' : 'bg-sky-600/60 text-sky-200');

      const nameColor = is5Star ? 'text-amber-300 font-bold' : (is4Star ? 'text-purple-300' : 'text-slate-300');
      const starStr = '★'.repeat(item.stars || 3);

      const pullNum = item.pullNumber || (total - idx);
      const pityNum = item.pity || '-';

      tr.innerHTML = `
        <td class="p-2.5 text-center text-slate-500 font-mono">${pullNum}</td>
        <td class="p-2.5 flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg overflow-hidden bg-black flex-shrink-0 border ${is5Star ? 'border-amber-400' : (is4Star ? 'border-purple-400' : 'border-sky-400/40')}">
            <img src="${item.icon || item.image || ''}" alt="${item.name}" class="w-full h-full object-cover"
                 onerror="window.cardDataService.handleImageError(this, '${item.cardId}')">
          </div>
          <span class="font-orbitron font-bold ${nameColor} text-xs truncate max-w-[150px]">${item.name}</span>
        </td>
        <td class="p-2.5 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono ${starBadge}">${starStr}</span>
        </td>
        <td class="p-2.5 text-slate-300 text-xs">
          ${item.element ? item.element + ' ' : ''}${item.category === 'resonator' ? 'Resonator' : 'Weapon'}
        </td>
        <td class="p-2.5 text-slate-400 text-[11px] truncate max-w-[140px]" title="${item.bannerName}">
          ${item.bannerName || 'Convene'}
        </td>
        <td class="p-2.5 text-center font-mono font-bold ${is5Star ? 'text-amber-400' : (is4Star ? 'text-purple-300' : 'text-slate-400')}">
          ${pityNum}
        </td>
        <td class="p-2.5 text-right text-slate-500 text-[11px] font-mono">
          ${item.timeFormatted || ''}
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  switchBanner(bannerId) {
    if (!this.banners[bannerId]) return;
    this.currentBanner = bannerId;

    if (window.soundFX) window.soundFX.playClick();

    document.querySelectorAll('.wuwa-banner-tab').forEach(b => {
      if (b.dataset.banner === bannerId) {
        b.classList.add('border-amber-400', 'bg-amber-500/20', 'text-amber-300');
        b.classList.remove('border-transparent', 'text-slate-400');
      } else {
        b.classList.remove('border-amber-400', 'bg-amber-500/20', 'text-amber-300');
        b.classList.add('border-transparent', 'text-slate-400');
      }
    });

    this.renderBannerDetails();
  }

  // Render authentic banner details with proper aspect ratio character art
  renderBannerDetails() {
    const b = this.banners[this.currentBanner];
    if (!b) return;

    const titleEl = document.getElementById('wuwa-banner-title');
    const subEl = document.getElementById('wuwa-banner-subtitle');
    const featuredCardEl = document.getElementById('wuwa-featured-resonator-card');

    if (titleEl) titleEl.innerText = b.title;
    if (subEl) subEl.innerText = b.subtitle;

    const featuredCard = b.featured5Star ? window.cardDataService.getCardById(b.featured5Star) : null;
    if (featuredCard && featuredCardEl) {
      const themeColor = b.themeColor || '#facc15';
      featuredCardEl.innerHTML = `
        <div class="relative w-full h-full min-h-[280px] sm:min-h-[320px] rounded-3xl overflow-hidden border-2 shadow-2xl flex items-center group select-none transition-all duration-300"
             style="border-color: ${themeColor}88; background: linear-gradient(135deg, rgba(8,12,24,0.98) 0%, rgba(12,18,36,0.95) 50%, rgba(5,7,15,0.98) 100%);">
          
          <!-- Dynamic Ambient Glow matching Character Element -->
          <div class="absolute -right-10 -bottom-10 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700 group-hover:opacity-35"
               style="background: radial-gradient(circle, ${themeColor} 0%, transparent 70%);"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-[#070913] via-[#070913]/85 to-transparent z-10 pointer-events-none"></div>

          <!-- Left Info Column (z-20) -->
          <div class="relative z-20 flex flex-col justify-between h-full p-5 sm:p-7 max-w-[62%] sm:max-w-[56%]">
            <div>
              <div class="flex items-center gap-2 mb-2.5 flex-wrap">
                <span class="font-orbitron font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1"
                      style="background: ${themeColor}; color: #000;">
                  <span>★</span> 5★ FEATURED
                </span>
                <span class="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-black/60 backdrop-blur"
                      style="color: ${themeColor}; border-color: ${themeColor}55;">
                  ${featuredCard.element || 'Spectro'} • ${featuredCard.weapon || 'Broadblade'}
                </span>
              </div>

              <h2 class="font-orbitron font-black text-2xl sm:text-4xl text-white tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                ${featuredCard.name}
              </h2>

              <div class="flex items-center gap-1 text-sm mt-1 mb-2 font-mono font-bold" style="color: ${themeColor}">
                ★★★★★
              </div>

              <p class="text-xs sm:text-[13px] text-slate-300 line-clamp-3 font-sans leading-relaxed drop-shadow">
                ${featuredCard.quote || featuredCard.description}
              </p>
            </div>

            <!-- Banner Rate-Up Perk Footer -->
            <div class="pt-3 border-t border-white/10 flex items-center gap-3">
              <div class="text-[10px] font-mono font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-black/50"
                   style="color: ${themeColor}; border-color: ${themeColor}44;">
                <i data-lucide="sparkles" class="w-3 h-3"></i>
                <span>50% WIN RATE BOOST ON 5★</span>
              </div>
              <div class="text-[10px] font-mono text-slate-400 hidden sm:block">
                ATK ${featuredCard.atk || 3500} • DEF ${featuredCard.def || 3200}
              </div>
            </div>
          </div>

          <!-- Right Floating Resonator Sprite (z-15) - Preserves natural aspect ratio without head cropping -->
          <div class="absolute right-1 sm:right-6 bottom-0 top-0 w-[52%] sm:w-[48%] flex items-end justify-center pointer-events-none z-15 overflow-visible">
            <img src="${featuredCard.image || ''}" alt="${featuredCard.name}"
                 class="h-[120%] max-h-[380px] w-auto max-w-none object-contain object-bottom drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                 onerror="window.cardDataService.handleImageError(this, '${featuredCard.id}')">
          </div>
        </div>
      `;
    } else if (featuredCardEl) {
      // Standard Convene Banner (All 48 Resonators & 64 Weapons)
      featuredCardEl.innerHTML = `
        <div class="relative w-full h-full min-h-[280px] sm:min-h-[320px] rounded-3xl overflow-hidden border-2 border-cyan-400/50 shadow-2xl bg-gradient-to-br from-blue-950/90 via-slate-950 to-black flex items-center group select-none p-6 sm:p-8">
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.25)_0,transparent_70%)] pointer-events-none"></div>
          
          <div class="relative z-20 max-w-lg">
            <div class="flex items-center gap-2 mb-2.5">
              <span class="bg-cyan-400 text-black font-orbitron font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-lg shadow">ALL RESONATORS POOL</span>
              <span class="text-xs font-mono font-bold text-cyan-300">48 Resonators • 64 Weapons</span>
            </div>
            <h2 class="font-orbitron font-black text-2xl sm:text-4xl text-white drop-shadow-lg">TIDAL CONVERGENCE</h2>
            <div class="flex items-center gap-1 text-sm mt-1 mb-2 text-cyan-400 font-mono font-bold">
              ★★★★★
            </div>
            <p class="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed mt-2">
              Every 5★ Resonator has an equal probability! Pure random variety across all elements, weapons, and 47 official convene video cutscenes.
            </p>
            <div class="mt-4 flex items-center gap-3">
              <span class="text-[11px] font-mono text-cyan-200 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-500/30">
                ✦ Equal 5★ Drop Pool
              </span>
              <span class="text-[11px] font-mono text-purple-200 bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-500/30">
                ✦ Multi-Gold Jackpot Enabled
              </span>
            </div>
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();

    // Render Rate-Up 4-Stars
    const rateUpContainer = document.getElementById('wuwa-rateup-4stars');
    if (rateUpContainer) {
      rateUpContainer.innerHTML = '';
      const listToShow = (b.rateUp4Stars && b.rateUp4Stars.length)
        ? b.rateUp4Stars
        : ['wuwa-4-sanhua', 'wuwa-4-danjin', 'wuwa-4-chixia'];

      listToShow.forEach(cid => {
        const c = window.cardDataService.getCardById(cid);
        if (!c) return;
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-purple-500/30';
        item.innerHTML = `
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-purple-400/40">
            <img src="${c.image || ''}" alt="${c.name}" class="w-full h-full object-cover"
                 onerror="window.cardDataService.handleImageError(this, '${c.id}')">
          </div>
          <div class="min-w-0">
            <div class="text-[9px] font-mono text-purple-300 font-bold">${b.rateUp4Stars && b.rateUp4Stars.length ? '4★ Rate-Up' : '4★ Pool'}</div>
            <div class="text-xs font-orbitron font-bold text-white truncate">${c.name}</div>
          </div>
        `;
        rateUpContainer.appendChild(item);
      });
    }
  }

  updatePityUI() {
    const pityEl = document.getElementById('wuwa-pity-text');
    const barEl = document.getElementById('wuwa-pity-bar');

    if (pityEl) pityEl.innerText = `${this.pity5Star} / 80 until Guaranteed 5★ Resonator`;
    if (barEl) {
      const pct = Math.min(100, (this.pity5Star / 80) * 100);
      barEl.style.width = `${pct}%`;
    }
  }

  // Roll single item with boosted WuWa odds, soft pity & jackpot support
  rollWuWaItem(b, isGuaranteed4Star = false, force5Star = false) {
    this.pity5Star++;
    this.pity4Star++;
    this.totalWuWaPulls++;

    const pool = window.cardDataService.pools.wuwa || [];
    const pool5Star = pool.filter(c => c.stars === 5);
    const pool4StarRes = pool.filter(c => c.stars === 4 && c.category === 'resonator');
    const pool4StarWeap = pool.filter(c => c.stars === 4 && c.category === 'weapon');
    const pool3Star = pool.filter(c => c.stars === 3);

    // Hard Pity Trigger at 80 pulls OR Forced 5-Star (Jackpot Surge): 100% 5-Star!
    if (force5Star || this.pity5Star >= 80) {
      const pityAtDrop = this.pity5Star;
      this.pity5Star = 0;
      this.pity4Star = 0;

      let picked;
      let isWon = null;
      if (b && b.featured5Star) {
        if (Math.random() < 0.5) {
          picked = window.cardDataService.getCardById(b.featured5Star) || pool5Star[0];
          isWon = true;
        } else {
          const standardPool = pool5Star.filter(c => c.id !== b.featured5Star);
          picked = standardPool.length ? standardPool[Math.floor(Math.random() * standardPool.length)] : pool5Star[0];
          isWon = false;
        }
      } else {
        picked = pool5Star[Math.floor(Math.random() * pool5Star.length)];
        isWon = null;
      }
      return Object.assign({}, picked, { _pityAtDrop: pityAtDrop, _is5050Won: isWon });
    }

    const rand = Math.random() * 100;

    // Soft pity ramp after 60 pulls (+7.0% per pull); Base rate: 0.8% (Official WuWa)
    const base5StarRate = this.pity5Star > 60 ? (0.8 + (this.pity5Star - 60) * 7.0) : 0.8;

    // 5-Star Drop (Gold)
    if (rand < base5StarRate) {
      const pityAtDrop = this.pity5Star;
      this.pity5Star = 0;
      this.pity4Star = 0;

      let picked;
      let isWon = null;
      if (b && b.featured5Star) {
        if (Math.random() < 0.5) {
          picked = window.cardDataService.getCardById(b.featured5Star) || pool5Star[0];
          isWon = true;
        } else {
          const standardPool = pool5Star.filter(c => c.id !== b.featured5Star);
          picked = standardPool.length ? standardPool[Math.floor(Math.random() * standardPool.length)] : pool5Star[0];
          isWon = false;
        }
      } else {
        picked = pool5Star[Math.floor(Math.random() * pool5Star.length)];
        isWon = null;
      }
      return Object.assign({}, picked, { _pityAtDrop: pityAtDrop, _is5050Won: isWon });
    }

    // 4-Star Drop (Purple) - Base 6.0% (Guaranteed at 10 pulls)
    if (isGuaranteed4Star || this.pity4Star >= 10 || rand < (base5StarRate + 6.0)) {
      const pityAtDrop = this.pity4Star;
      this.pity4Star = 0;

      // High chance for rate-up 4-stars
      if (b && b.rateUp4Stars && b.rateUp4Stars.length && Math.random() < 0.5) {
        const cid = b.rateUp4Stars[Math.floor(Math.random() * b.rateUp4Stars.length)];
        const found = window.cardDataService.getCardById(cid);
        if (found) return Object.assign({}, found, { _pityAtDrop: pityAtDrop, _is5050Won: null });
      }

      // 50% 4-star resonator, 50% 4-star weapon
      let picked;
      if (Math.random() < 0.5 && pool4StarRes.length) {
        picked = pool4StarRes[Math.floor(Math.random() * pool4StarRes.length)];
      } else if (pool4StarWeap.length) {
        picked = pool4StarWeap[Math.floor(Math.random() * pool4StarWeap.length)];
      } else {
        const p4 = pool.filter(c => c.stars === 4);
        picked = p4[Math.floor(Math.random() * p4.length)] || pool[0];
      }
      return Object.assign({}, picked, { _pityAtDrop: pityAtDrop, _is5050Won: null });
    }

    // 3-Star Weapon (Blue)
    const p3 = pool3Star.length ? pool3Star[Math.floor(Math.random() * pool3Star.length)] : pool[0];
    return Object.assign({}, p3, { _pityAtDrop: this.pity5Star, _is5050Won: null });
  }

  // Execute Convene Pull (count: 1 or 10)
  async executeConvene(count = 10) {
    if (this.isConvening) return;

    const cost = count === 10 ? 1600 : 160;
    if (window.gachaEngine.state.gems < cost) {
      if (window.appController) {
        window.appController.showToast(`⚠️ Insufficient Astrite! You need ${cost.toLocaleString()} Astrite/Gems.`);
      }
      return;
    }

    this.isConvening = true;
    window.gachaEngine.state.gems -= cost;
    window.gachaEngine.saveState();

    const b = this.banners[this.currentBanner];
    const pulledItems = [];
    let has5Star = false;
    let has4Star = false;

    // Multi-Gold Jackpot Surge with exact user-defined rates:
    // - Nổ 10 (Full 10 Golden 5★ Resonators): 0.067%
    // - Nổ 5 (Quintuple 5★): 0.8%
    // - Nổ 4 (Quadruple 5★): 0.8%
    // - Nổ 3 (Triple 5★): 0.8%
    // - Nổ 2 (Double 5★): 1.8% (đã giảm mạnh để nổ 1 phổ biến hơn nổ 2 rất nhiều)
    const guaranteed5StarSlots = new Set();
    if (count === 10) {
      const jackpotRoll = Math.random() * 100;
      let multiCount = 0;

      if (jackpotRoll < 0.067) {
        multiCount = 10; // 0.067% - Nổ Mười (10/10 Gold God Roll)
      } else if (jackpotRoll < 0.067 + 0.8) {
        multiCount = 5;  // 0.8% - Nổ Năm (Quintuple 5★)
      } else if (jackpotRoll < 0.067 + 0.8 + 0.8) {
        multiCount = 4;  // 0.8% - Nổ Bốn (Quadruple 5★)
      } else if (jackpotRoll < 0.067 + 0.8 + 0.8 + 0.8) {
        multiCount = 3;  // 0.8% - Nổ Ba (Triple 5★)
      } else if (jackpotRoll < 0.067 + 0.8 + 0.8 + 0.8 + 1.8) {
        multiCount = 2;  // 1.8% - Nổ Đôi (Double 5★)
      }

      if (multiCount > 0) {
        while (guaranteed5StarSlots.size < multiCount) {
          guaranteed5StarSlots.add(Math.floor(Math.random() * 10));
        }
      }
    }

    const currentTotalBefore = this.totalWuWaPulls;
    for (let i = 0; i < count; i++) {
      const isForce5 = guaranteed5StarSlots.has(i);
      const isGuaranteed4StarSlot = (count === 10 && i === count - 1 && !has4Star && !has5Star && !isForce5);
      const item = this.rollWuWaItem(b, isGuaranteed4StarSlot, isForce5);
      pulledItems.push(item);

      if (item.stars === 5) has5Star = true;
      if (item.stars === 4) has4Star = true;

      // Add to overall Collection Binder
      const cid = item.id;
      if (!window.gachaEngine.state.collection[cid]) {
        window.gachaEngine.state.collection[cid] = {
          card: item,
          count: 1,
          firstAcquired: Date.now()
        };
      } else {
        window.gachaEngine.state.collection[cid].count++;
      }

      // Add to WuWa Tracker pull history (newest at index 0)
      this.pullHistory.unshift({
        id: 'pull_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        pullNumber: currentTotalBefore + i + 1,
        cardId: item.id,
        name: item.name,
        stars: item.stars,
        category: item.category || 'weapon',
        element: item.element || '',
        weapon: item.weapon || '',
        icon: item.icon || item.image || '',
        image: item.image || '',
        bannerId: b ? b.id : 'all',
        bannerName: b ? b.title : 'Tidal Convergence',
        pity: item._pityAtDrop || 1,
        is5050Won: item._is5050Won,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN')
      });
    }

    // Keep history bounded to 1,500 records
    if (this.pullHistory.length > 1500) {
      this.pullHistory = this.pullHistory.slice(0, 1500);
    }

    this.saveState();

    // Trigger WuWa Convene Drop Sequence!
    await this.runWuWaConveneSequence(pulledItems, has5Star, has4Star);

    this.isConvening = false;
  }

  // The Iconic WuWa Convene Drop Animation Sequence
  async runWuWaConveneSequence(items, has5Star, has4Star) {
    const highTierResonators = items.filter(c => c.stars === 5);

    // ====================================================================
    // 5★ GOLD DROP: PLAY AUTHENTIC WUWA CONVENE VIDEO CUTSCENES
    // (Video 1 Gold Intro -> Playlist Individual 5★ Resonator Animation)
    // ====================================================================
    if (has5Star && highTierResonators.length > 0) {
      await this.playCinematic5StarConvene(highTierResonators);
    } else {
      // 4★ / 3★ Standard Sonic Meteor Beam
      const stageOverlay = document.getElementById('wuwa-convene-stage-overlay');
      const meteorBeam = document.getElementById('wuwa-meteor-beam');

      if (stageOverlay) {
        stageOverlay.classList.remove('hidden');
        stageOverlay.style.display = 'flex';

        if (window.soundFX) {
          window.soundFX.playWuWaConvene(false);
        }

        anime({
          targets: '.wuwa-sonoro-ring',
          scale: [0.8, 1.4],
          opacity: [0.9, 0],
          duration: 1200,
          loop: 2,
          easing: 'easeOutSine'
        });

        const beamColor = has4Star ? '#c084fc' : '#38bdf8';
        if (meteorBeam) {
          meteorBeam.style.background = `linear-gradient(180deg, transparent, ${beamColor}, #ffffff)`;
          meteorBeam.style.boxShadow = `0 0 40px ${beamColor}, 0 0 80px ${beamColor}`;

          await new Promise(resolve => {
            anime({
              targets: meteorBeam,
              translateY: ['-100vh', '100vh'],
              scaleX: [1, 2.5, 1],
              opacity: [0, 1, 1],
              duration: 1300,
              easing: 'easeInQuad',
              complete: resolve
            });
          });
        }

        stageOverlay.classList.add('hidden');
        stageOverlay.style.display = 'none';
      }
    }

    // Display 10-Item Convene Result Summary Grid
    this.displayConveneSummary(items);
  }

  // Cinematic 5★ Video Convene Cutscene Sequence
  async playCinematic5StarConvene(highTierResonators) {
    const videoOverlay = document.getElementById('wuwa-video-overlay');
    const videoEl = document.getElementById('wuwa-cutscene-video');
    const badgeEl = document.getElementById('wuwa-video-char-badge');
    const nameEl = document.getElementById('wuwa-video-char-name');
    const skipBtn = document.getElementById('wuwa-video-skip-btn');
    const flashEl = document.getElementById('wuwa-video-flash');

    if (!videoOverlay || !videoEl) return;

    if (window.lucide) window.lucide.createIcons();

    videoOverlay.classList.remove('hidden');
    videoOverlay.style.display = 'flex';
    if (badgeEl) badgeEl.style.opacity = '0';
    if (flashEl) flashEl.style.opacity = '0';

    let currentStepResolve = null;
    let currentStepCleanup = null;
    let isSkippedAll = false;

    // Advance current clip or exit cutscene
    const advanceStep = () => {
      try {
        videoEl.pause();
      } catch (e) {}

      if (currentStepCleanup) {
        currentStepCleanup();
        currentStepCleanup = null;
      }

      if (currentStepResolve) {
        const resolve = currentStepResolve;
        currentStepResolve = null;
        resolve();
      }
    };

    // Skip mode switcher:
    // 'intro': transparent hotspot precisely mapped over the video's baked-in hexagon button (invisible/clean).
    // 'character': stylish visible gold SKIP >> button for 5★ character cutscenes.
    const setSkipMode = (mode) => {
      if (!skipBtn) return;
      if (mode === 'intro') {
        skipBtn.className = "wuwa-skip-intro-hotspot";
        skipBtn.innerHTML = '';
        skipBtn.title = "Bỏ qua đoạn mở đầu (Skip Intro)";
        skipBtn.setAttribute('aria-label', 'Skip Intro');
      } else {
        skipBtn.className = "wuwa-skip-character-btn";
        skipBtn.innerHTML = `
          <span>SKIP</span>
          <i data-lucide="fast-forward" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400"></i>
        `;
        skipBtn.title = "Bỏ qua hoạt cảnh nhân vật (Skip to Results)";
        skipBtn.setAttribute('aria-label', 'Skip Character Cutscene');
        if (window.lucide) window.lucide.createIcons();
      }
    };

    // User triggers Skip button
    const handleSkipClick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // If currently on character cutscene, skip directly to 10-item result screen
      if (skipBtn && skipBtn.classList.contains('wuwa-skip-character-btn')) {
        isSkippedAll = true;
      }
      advanceStep();
    };

    if (skipBtn) {
      skipBtn.onclick = handleSkipClick;
      skipBtn.ontouchend = handleSkipClick;
    }

    // Clicking anywhere on video overlay also advances
    const onOverlayClick = (e) => {
      if (e.target === skipBtn || (skipBtn && skipBtn.contains(e.target))) return;
      advanceStep();
    };
    videoOverlay.onclick = onOverlayClick;

    // Keyboard shortcuts for PC (Space, Escape, Enter)
    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (skipBtn && skipBtn.classList.contains('wuwa-skip-character-btn')) {
          isSkippedAll = true;
        }
        advanceStep();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Safe video playback runner
    const playClip = (src) => {
      return new Promise(resolve => {
        if (isSkippedAll) return resolve();

        currentStepResolve = resolve;
        videoEl.src = src;
        videoEl.muted = false;
        videoEl.volume = 1.0;
        videoEl.currentTime = 0;

        const onEnded = () => {
          cleanup();
          resolve();
        };

        const onError = (e) => {
          console.warn("Video playback error for " + src, e);
          cleanup();
          resolve();
        };

        const cleanup = () => {
          videoEl.removeEventListener('ended', onEnded);
          videoEl.removeEventListener('error', onError);
          currentStepResolve = null;
          currentStepCleanup = null;
        };

        currentStepCleanup = cleanup;
        videoEl.addEventListener('ended', onEnded, { once: true });
        videoEl.addEventListener('error', onError, { once: true });

        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Video play with sound blocked by browser, falling back to muted:", err);
            videoEl.muted = true;
            videoEl.play().catch(e => {
              console.warn("Fatal video play error:", e);
              cleanup();
              resolve();
            });
          });
        }
      });
    };

    // 1. Play Golden Convene Meteor Vortex Intro (wuwa_gold_intro.mp4)
    // Intro video has baked-in hexagon skip icon -> use transparent hotspot mode
    setSkipMode('intro');
    await playClip('assets/videos/wuwa_gold_intro.mp4');

    // 2. Play Individual 5★ Character Cutscene(s) in sequence
    // Character videos do NOT have hexagon button -> switch to stylish gold SKIP >> button
    setSkipMode('character');
    const total5 = highTierResonators.length;
    for (let idx = 0; idx < highTierResonators.length; idx++) {
      if (isSkippedAll) break;

      const res = highTierResonators[idx];

      // White supernova flash transition into character cutscene
      if (flashEl) {
        flashEl.style.opacity = '1';
        setTimeout(() => { flashEl.style.opacity = '0'; }, 350);
      }

      // Update Character Badge HUD with Multi-Gold indicator
      if (nameEl) nameEl.innerText = res.name;
      if (badgeEl) {
        const tagSpan = badgeEl.querySelector('span:first-child');
        if (tagSpan) {
          if (total5 >= 10) {
            tagSpan.className = "bg-gradient-to-r from-yellow-300 via-rose-500 to-purple-600 text-white font-orbitron font-black text-xs px-3.5 py-1.5 rounded-lg shadow-[0_0_40px_rgba(250,204,21,1)] animate-bounce";
            tagSpan.innerText = `💥 NỔ MƯỜI (10/10 5★ GOD ROLL 0.067%) [${idx + 1}/${total5}]`;
          } else if (total5 >= 5) {
            tagSpan.className = "bg-gradient-to-r from-amber-300 via-yellow-400 to-rose-600 text-black font-orbitron font-black text-xs px-3.5 py-1.5 rounded-lg shadow-[0_0_30px_rgba(250,204,21,0.95)] animate-pulse";
            tagSpan.innerText = `🌌 NỔ NĂM (QUINTUPLE 5★ 0.8%) [${idx + 1}/${total5}]`;
          } else if (total5 === 4) {
            tagSpan.className = "bg-gradient-to-r from-yellow-300 via-amber-400 to-red-600 text-black font-orbitron font-black text-xs px-3.5 py-1.5 rounded-lg shadow-[0_0_25px_rgba(250,204,21,0.9)] animate-pulse";
            tagSpan.innerText = `👑 NỔ BỐN (QUADRUPLE 5★ 0.8%) [${idx + 1}/${total5}]`;
          } else if (total5 === 3) {
            tagSpan.className = "bg-gradient-to-r from-amber-300 via-yellow-400 to-rose-500 text-black font-orbitron font-black text-xs px-3.5 py-1.5 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.8)]";
            tagSpan.innerText = `⚡ NỔ BA (TRIPLE 5★ 0.8%) [${idx + 1}/${total5}]`;
          } else if (total5 === 2) {
            tagSpan.className = "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 text-black font-orbitron font-black text-xs px-3.5 py-1.5 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.7)]";
            tagSpan.innerText = `🔥 NỔ ĐÔI (DOUBLE 5★) [${idx + 1}/${total5}]`;
          } else {
            tagSpan.className = "bg-amber-400 text-black font-orbitron font-black text-xs px-3.5 py-1.5 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.6)]";
            tagSpan.innerText = `★★★★★ 5★ CONVENE`;
          }
        }
        badgeEl.style.opacity = '1';
      }

      const videoSrc = res.videoUrl || `assets/videos/${res.id}.mp4`;
      await playClip(videoSrc);

      if (badgeEl) badgeEl.style.opacity = '0';
    }

    // 3. Cleanup & Exit Cinema Overlay
    try {
      videoEl.pause();
      videoEl.src = '';
    } catch (e) {}

    videoOverlay.onclick = null;
    window.removeEventListener('keydown', onKeyDown);
    if (skipBtn) {
      skipBtn.onclick = null;
      skipBtn.ontouchend = null;
    }

    videoOverlay.classList.add('hidden');
    videoOverlay.style.display = 'none';
  }

  // Display Fullscreen 5★ Resonator Splash Art Modal
  displayResonatorSplashModal(resonator) {
    return new Promise(resolve => {
      const modal = document.getElementById('wuwa-splash-modal');
      const nameEl = document.getElementById('wuwa-splash-name');
      const elemEl = document.getElementById('wuwa-splash-element');
      const weaponEl = document.getElementById('wuwa-splash-weapon');
      const quoteEl = document.getElementById('wuwa-splash-quote');
      const imgEl = document.getElementById('wuwa-splash-image');

      if (!modal) return resolve();

      if (nameEl) nameEl.innerText = resonator.name;
      if (elemEl) elemEl.innerText = `${resonator.element || 'Spectro'} Resonator`;
      if (weaponEl) weaponEl.innerText = `Weapon: ${resonator.weapon || 'Broadblade'}`;
      if (quoteEl) quoteEl.innerText = resonator.quote || `“Resonance frequency attuned with the Sentinel.”`;

      if (imgEl) {
        imgEl.src = resonator.image || '';
        imgEl.onerror = () => window.cardDataService.handleImageError(imgEl, resonator.id);
      }

      modal.classList.remove('hidden');
      modal.style.display = 'flex';

      // Animate Splash Pop
      anime({
        targets: '#wuwa-splash-content',
        scale: [0.85, 1],
        opacity: [0, 1],
        duration: 450,
        easing: 'easeOutBack'
      });

      this.onSplashNext = () => {
        anime({
          targets: '#wuwa-splash-content',
          scale: [1, 1.1],
          opacity: [1, 0],
          duration: 250,
          easing: 'easeInQuad',
          complete: () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            this.onSplashNext = null;
            resolve();
          }
        });
      };
    });
  }

  // Display 10-Item Diamond Convene Summary Grid
  displayConveneSummary(items) {
    const summaryOverlay = document.getElementById('wuwa-summary-modal');
    const grid = document.getElementById('wuwa-summary-grid');
    const stageOverlay = document.getElementById('wuwa-convene-stage-overlay');

    if (stageOverlay) {
      stageOverlay.classList.add('hidden');
      stageOverlay.style.display = 'none';
    }

    if (!summaryOverlay || !grid) return;
    grid.innerHTML = '';

    // Check Multi-Gold Jackpot (Nổ đôi, nổ 3, nổ 4)
    const jackpotBanner = document.getElementById('wuwa-summary-jackpot-banner');
    const goldCount = items.filter(c => c.stars === 5).length;
    if (jackpotBanner) {
      if (goldCount >= 10) {
        jackpotBanner.className = "mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-full font-orbitron font-black text-xs sm:text-sm bg-gradient-to-r from-yellow-300 via-rose-500 to-purple-600 text-white border-2 border-yellow-300 shadow-[0_0_60px_rgba(250,204,21,1)] animate-bounce";
        jackpotBanner.innerHTML = `<span>💥 ĐỊA CHẤN LỊCH SỬ: NỔ MƯỜI (10/10 5★ GOLD - TỶ LỆ 0.067%!)</span>`;
        jackpotBanner.classList.remove('hidden');
      } else if (goldCount >= 5) {
        jackpotBanner.className = "mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-full font-orbitron font-black text-xs sm:text-sm bg-gradient-to-r from-amber-300 via-yellow-400 to-purple-600 text-black border-2 border-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.9)] animate-pulse";
        jackpotBanner.innerHTML = `<span>🌌 SIÊU THẦN THOẠI: NỔ NĂM (QUINTUPLE 5★ RESONANCE 0.8%!)</span>`;
        jackpotBanner.classList.remove('hidden');
      } else if (goldCount === 4) {
        jackpotBanner.className = "mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-full font-orbitron font-black text-xs sm:text-sm bg-gradient-to-r from-yellow-300 via-amber-400 to-red-600 text-black border-2 border-white shadow-[0_0_50px_rgba(250,204,21,1)] animate-bounce";
        jackpotBanner.innerHTML = `<span>👑 CỰC PHẨM VẬN MAY: NỔ BỐN (QUADRUPLE 5★ 0.8%!)</span>`;
        jackpotBanner.classList.remove('hidden');
      } else if (goldCount === 3) {
        jackpotBanner.className = "mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-orbitron font-black text-xs sm:text-sm bg-gradient-to-r from-amber-300 via-yellow-400 to-rose-500 text-black border border-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.8)]";
        jackpotBanner.innerHTML = `<span>⚡ SIÊU ĐỈNH NỔ BA (TRIPLE 5★ SUPERNOVA 0.8%!)</span>`;
        jackpotBanner.classList.remove('hidden');
      } else if (goldCount === 2) {
        jackpotBanner.className = "mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-orbitron font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 text-black border border-amber-300 shadow-[0_0_20px_rgba(250,204,21,0.6)]";
        jackpotBanner.innerHTML = `<span>🔥 KỶ LỤC NỔ ĐÔI (DOUBLE 5★ GOLD DROP!)</span>`;
        jackpotBanner.classList.remove('hidden');
      } else {
        jackpotBanner.classList.add('hidden');
      }
    }

    items.forEach((item, idx) => {
      const cardEl = document.createElement('div');
      const is5Star = item.stars === 5;
      const is4Star = item.stars === 4;

      const starStr = '★'.repeat(item.stars || 3);

      const borderClass = is5Star
        ? 'border-2 border-amber-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
        : (is4Star ? 'border border-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.3)]' : 'border border-sky-400/30');

      cardEl.className = `wuwa-diamond-card flex flex-col rounded-xl overflow-hidden bg-slate-900/90 ${borderClass} relative group select-none transition-transform duration-300 hover:scale-105 h-48 sm:h-56`;

      cardEl.innerHTML = `
        <div class="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          <img src="${item.image || ''}" alt="${item.name}" class="w-full h-full object-cover object-top"
               onerror="window.cardDataService.handleImageError(this, '${item.id}')">
          <span class="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${is5Star ? 'bg-amber-400 text-black' : (is4Star ? 'bg-purple-600 text-white' : 'bg-sky-600 text-white')}">
            ${starStr}
          </span>
          ${is5Star ? '<div class="absolute inset-0 bg-gradient-to-t from-amber-500/30 via-transparent to-transparent pointer-events-none"></div>' : ''}
        </div>
        <div class="p-2 bg-slate-950 flex flex-col justify-between border-t border-white/10">
          <div class="text-[9px] font-mono ${is5Star ? 'text-amber-300 font-bold' : (is4Star ? 'text-purple-300' : 'text-slate-400')} truncate">
            ${item.element || item.type}
          </div>
          <div class="font-orbitron font-bold text-xs text-white truncate" title="${item.name}">${item.name}</div>
        </div>
      `;

      grid.appendChild(cardEl);
    });

    summaryOverlay.classList.remove('hidden');
    summaryOverlay.style.display = 'flex';

    // Stagger animation on cards
    anime({
      targets: '.wuwa-diamond-card',
      translateY: [40, 0],
      opacity: [0, 1],
      delay: anime.stagger(80),
      duration: 500,
      easing: 'easeOutBack'
    });
  }

  closeSummary() {
    const summaryOverlay = document.getElementById('wuwa-summary-modal');
    if (summaryOverlay) {
      summaryOverlay.classList.add('hidden');
      summaryOverlay.style.display = 'none';
    }
    const videoOverlay = document.getElementById('wuwa-video-overlay');
    const videoEl = document.getElementById('wuwa-cutscene-video');
    if (videoOverlay) {
      videoOverlay.classList.add('hidden');
      videoOverlay.style.display = 'none';
    }
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.src = '';
      } catch (e) {}
    }
  }
}

// Global instance
window.wuwaConveneEngine = new WuWaConveneEngine();

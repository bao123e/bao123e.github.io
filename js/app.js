/**
 * WUTHERING WAVES // AKADEMIYA TERMINAL
 * app.js - Main Application Controller
 * Manages Views: Convene, Tracker, Meta Tier List, 2D Chibi Combat, Archive
 */

class AppController {
  constructor() {
    this.currentView = 'convene'; // 'convene' | 'tracker' | 'tierlist' | 'combat' | 'archive'
    this.init();
  }

  async init() {
    console.log('[WuWa Akademiya] Initializing terminal application...');

    // 1. Initialize i18n
    if (window.wuwaI18n) {
      window.wuwaI18n.updateDom();
    }

    // 2. Setup Event Listeners
    this.bindEvents();

    // 3. Setup Audio
    this.updateMuteIcon();

    // 4. Initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // 5. Initialize WuWa Convene Engine
    try {
      if (window.wuwaConveneEngine) {
        window.wuwaConveneEngine.init();
      }
    } catch (e) {
      console.error('[AppController] Error initializing Convene Engine:', e);
    }

    // 6. Initialize 2D Chibi Combat Arena Canvas
    try {
      const combatCanvas = document.getElementById('combat-canvas');
      if (combatCanvas && window.wuwaCombat) {
        window.wuwaCombat.init(combatCanvas);
      }
    } catch (e) {
      console.error('[AppController] Error initializing Combat Canvas:', e);
    }

    // 7. Ensure Tier List is ready
    try {
      if (window.wuwaTierList && window.wuwaMasterData) {
        window.wuwaTierList.initData(window.wuwaMasterData);
      }
    } catch (e) {
      console.error('[AppController] Error initializing Tier List:', e);
    }

    // Default view: Convene
    this.switchView('convene');

    console.log('[WuWa Akademiya] Ready!');
  }

  bindEvents() {
    // Navigation Tab Buttons (Desktop & Mobile)
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });

    // Language Toggle Button (VI / EN)
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        if (window.wuwaI18n) {
          const nextLang = window.wuwaI18n.toggleLang();
          this.showToast(nextLang === 'vi' ? '🇻🇳 Đã chuyển sang Tiếng Việt' : '🌐 Switched to English');
        }
      });
    }

    // Astrite Refill (+5,000)
    const refillBtn = document.getElementById('refill-gems-btn');
    if (refillBtn) {
      refillBtn.addEventListener('click', () => {
        if (window.wuwaConveneEngine) {
          // Refill Astrite
          const current = parseInt(localStorage.getItem('wuwa_astrite') || '10000', 10);
          const newTotal = current + 5000;
          localStorage.setItem('wuwa_astrite', newTotal);
          const astriteEl = document.getElementById('astral-gems-counter');
          if (astriteEl) astriteEl.innerText = newTotal.toLocaleString();
          this.showToast(`✦ +5,000 Astrite Refilled! (Total: ${newTotal.toLocaleString()})`);
        }
      });
    }

    // Mute Audio Toggle
    const muteBtn = document.getElementById('audio-toggle-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.soundFX) {
          const isMuted = window.soundFX.toggleMute();
          this.updateMuteIcon();
          this.showToast(isMuted ? '🔇 Audio Muted' : '🔊 Audio Enabled');
        }
      });
    }

    // Combat Mode Selection Buttons
    document.querySelectorAll('.combat-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        document.querySelectorAll('.combat-mode-btn').forEach(b => {
          b.classList.remove('active', 'border-amber-400', 'shadow-[0_0_25px_rgba(250,204,21,0.25)]');
          b.classList.add('border-white/10');
        });
        btn.classList.add('active', 'border-amber-400', 'shadow-[0_0_25px_rgba(250,204,21,0.25)]');
        btn.classList.remove('border-white/10');

        if (window.wuwaCombat) {
          window.wuwaCombat.selectedMode = mode;
          const tokenSection = document.getElementById('combat-token-section');
          if (tokenSection) {
            tokenSection.classList.toggle('hidden', mode !== 'ww');
          }
        }
      });
    });

    // Tier List Mode Tabs
    document.querySelectorAll('.tier-mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.tierMode;
        document.querySelectorAll('.tier-mode-tab').forEach(b => {
          b.classList.remove('active', 'border-amber-400', 'bg-amber-500/20', 'text-amber-300');
          b.classList.add('border-transparent', 'text-slate-400');
        });
        btn.classList.add('active', 'border-amber-400', 'bg-amber-500/20', 'text-amber-300');
        btn.classList.remove('border-transparent', 'text-slate-400');

        if (window.wuwaTierList) {
          window.wuwaTierList.setMode(mode);
        }
      });
    });

    // Tier List Element Filter Buttons
    document.querySelectorAll('.tier-elem-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const elem = btn.dataset.element;
        document.querySelectorAll('.tier-elem-filter').forEach(b => {
          b.classList.remove('active', 'ring-2', 'ring-amber-400', 'bg-amber-500/20');
        });
        btn.classList.add('active', 'ring-2', 'ring-amber-400', 'bg-amber-500/20');

        if (window.wuwaTierList) {
          window.wuwaTierList.setFilterElement(elem);
        }
      });
    });

    // Tier List Search Input
    const searchInput = document.getElementById('tier-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (window.wuwaTierList) {
          window.wuwaTierList.setFilterSearch(e.target.value);
        }
      });
    }
  }

  switchView(viewName) {
    // Map aliases
    if (viewName === 'altar' || viewName === 'wuwa') viewName = 'convene';
    if (viewName === 'binder') viewName = 'archive';
    if (viewName === 'arena') viewName = 'combat';

    this.currentView = viewName;
    if (window.soundFX) window.soundFX.playClick();

    // Update Nav buttons styling
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      let bView = btn.dataset.view;
      if (bView === 'altar' || bView === 'wuwa') bView = 'convene';
      if (bView === 'binder') bView = 'archive';
      if (bView === 'arena') bView = 'combat';

      if (bView === viewName) {
        btn.classList.add('bg-amber-500/20', 'border-amber-400', 'text-amber-300');
        btn.classList.remove('text-slate-400', 'border-transparent');
      } else {
        btn.classList.remove('bg-amber-500/20', 'border-amber-400', 'text-amber-300');
        btn.classList.add('text-slate-400', 'border-transparent');
      }
    });

    // View Containers Visibility
    const views = {
      convene: document.getElementById('view-wuwa'),
      tracker: document.getElementById('view-tracker'),
      tierlist: document.getElementById('view-tierlist'),
      combat: document.getElementById('view-combat'),
      archive: document.getElementById('view-archive')
    };

    Object.keys(views).forEach(key => {
      const el = views[key];
      if (el) {
        if (key === viewName) {
          el.classList.remove('hidden');
          el.style.display = (key === 'convene' || key === 'tracker' || key === 'tierlist' || key === 'combat' || key === 'archive') ? 'flex' : 'block';
        } else {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      }
    });

    // View specific activations
    if (viewName === 'tierlist' && window.wuwaTierList) {
      window.wuwaTierList.render();
    } else if (viewName === 'combat' && window.wuwaCombat) {
      window.wuwaCombat.resizeCanvas();
      window.wuwaCombat.renderSquadSelector();
    } else if (viewName === 'archive') {
      this.renderArchive();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderArchive() {
    const grid = document.getElementById('archive-resonators-grid');
    if (!grid) return;

    const resonators = window.wuwaMasterData?.resonators || [];
    const lang = window.wuwaI18n ? window.wuwaI18n.getLang() : 'vi';

    grid.innerHTML = resonators.map(r => {
      const name = r.name[lang] || r.name.en;
      const elemColor = window.wuwaTierList ? window.wuwaTierList.getElementColor(r.element) : '#d4b475';

      return `
        <div onclick="window.wuwaTierList.openBuildModal('${r.id}')"
             class="glass-panel p-3 sm:p-4 rounded-2xl border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer flex flex-col justify-between group hover:scale-[1.02] shadow-xl">
          <div class="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-black mb-3 border" style="border-color: ${elemColor}40">
            <img src="${r.assets.avatar || r.assets.chibi}" alt="${name}" class="w-full h-full object-cover object-top"
                 onerror="this.src='assets/jinhsi-official.webp'">
            <span class="absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
                  style="background-color: ${elemColor}25; color: ${elemColor}; border: 1px solid ${elemColor}60">
              ${r.element}
            </span>
            <span class="absolute top-2 right-2 text-amber-400 font-mono text-xs font-black">
              ${'★'.repeat(r.rarity || 5)}
            </span>
          </div>
          <div>
            <div class="font-orbitron font-black text-sm text-white group-hover:text-amber-300 truncate">${name}</div>
            <div class="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
              <span>${r.weapon}</span>
              <span class="text-amber-400">${r.role.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  updateMuteIcon() {
    const icon = document.getElementById('audio-toggle-icon');
    if (icon && window.soundFX) {
      icon.setAttribute('data-lucide', window.soundFX.isMuted ? 'volume-x' : 'volume-2');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.remove('hidden');
    toast.style.opacity = '1';

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});

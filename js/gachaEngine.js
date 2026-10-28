/**
 * WUTHERING WAVES // AKADEMIYA TERMINAL
 * gachaEngine.js - Stateful Astrite & Resonator Inventory Store
 * 100% Dedicated to Wuthering Waves (No Pokemon, No Yu-Gi-Oh, No CS2)
 */

class WuWaStateEngine {
  constructor() {
    this.STORAGE_KEY = 'wuwa_gacha_state_v2';
    this.LEGACY_KEY = 'aetheria_gacha_state_v1';
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      gems: 10000, // Astrite
      pityCounter: 0,
      totalPulls: 0,
      collection: {}, // { [id]: { card, count, firstAcquired } }
      history: []
    };
  }

  loadState() {
    try {
      let saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) {
        // Try migrating from legacy
        saved = localStorage.getItem(this.LEGACY_KEY);
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (err) {
      console.error('[WuWaStateEngine] Failed to parse state:', err);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      this.dispatchStateChangeEvent();
    } catch (err) {
      console.error('[WuWaStateEngine] Failed to save state:', err);
    }
  }

  dispatchStateChangeEvent() {
    const astriteEl = document.getElementById('astral-gems-counter');
    if (astriteEl) {
      astriteEl.innerText = (this.state.gems || 0).toLocaleString();
    }

    window.dispatchEvent(new CustomEvent('aetheria:stateUpdated', {
      detail: {
        gems: this.state.gems,
        pity: this.state.pityCounter,
        totalPulls: this.state.totalPulls,
        collectionCount: Object.keys(this.state.collection || {}).length
      }
    }));
  }

  // Refill Astrite (+5,000)
  refillGems(amount = 5000) {
    this.state.gems = (this.state.gems || 0) + amount;
    this.saveState();
    if (window.soundFX && window.soundFX.playGemsRefill) {
      window.soundFX.playGemsRefill();
    }
    return this.state.gems;
  }

  getCollectionList() {
    return Object.values(this.state.collection || {});
  }
}

// Global Singleton
window.gachaEngine = new WuWaStateEngine();

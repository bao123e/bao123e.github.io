/**
 * AETHERIA TCG - Stateful Gacha Engine & Pity System
 * Persists gems, pity counter, collections, and stats in localStorage
 */

class GachaEngine {
  constructor() {
    this.STORAGE_KEY = 'aetheria_gacha_state_v1';
    this.HARD_PITY_MAX = 50;

    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      gems: 10000,
      pityCounter: 0, // 0 to 50
      softPityCounter: 0, // 0 to 10
      totalPulls: 0,
      stats: {
        UR: 0,
        SSR: 0,
        SR: 0,
        R: 0
      },
      collection: {}, // { [cardId]: { card, count, firstAcquired: timestamp } }
      history: []
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (err) {
      console.error('Failed to parse gacha state from localStorage:', err);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      this.dispatchStateChangeEvent();
    } catch (err) {
      console.error('Failed to save gacha state:', err);
    }
  }

  dispatchStateChangeEvent() {
    window.dispatchEvent(new CustomEvent('aetheria:stateUpdated', {
      detail: {
        gems: this.state.gems,
        pity: this.state.pityCounter,
        totalPulls: this.state.totalPulls,
        collectionCount: Object.keys(this.state.collection).length
      }
    }));
  }

  // Refill debug / free gems (+5,000)
  refillGems(amount = 5000) {
    this.state.gems += amount;
    this.saveState();
    if (window.soundFX) window.soundFX.playGemsRefill();
    return this.state.gems;
  }

  // Determine rarity of a single pull based on RNG and Pity
  rollRarity(isGuaranteedSSR = false) {
    this.state.pityCounter++;
    this.state.softPityCounter++;

    // Hard Pity Trigger: 50th pull guarantees UR
    if (this.state.pityCounter >= this.HARD_PITY_MAX) {
      this.state.pityCounter = 0;
      this.state.softPityCounter = 0;
      return 'UR';
    }

    const rand = Math.random() * 100; // 0 - 100

    // Multi-pull guaranteed slot (SSR or UR)
    if (isGuaranteedSSR) {
      // 10% chance to upgrade to UR, 90% SSR
      if (rand < 10) {
        this.state.pityCounter = 0;
        this.state.softPityCounter = 0;
        return 'UR';
      }
      this.state.softPityCounter = 0;
      return 'SSR';
    }

    // Soft Pity: every 10 pulls guarantees at least SSR
    if (this.state.softPityCounter >= 10) {
      this.state.softPityCounter = 0;
      if (rand < 15) {
        this.state.pityCounter = 0;
        return 'UR';
      }
      return 'SSR';
    }

    // Standard Drop Rates:
    // UR: 3% (0 -> 3)
    // SSR: 12% (3 -> 15)
    // SR: 30% (15 -> 45)
    // R: 55% (45 -> 100)
    if (rand < 3.0) {
      this.state.pityCounter = 0;
      this.state.softPityCounter = 0;
      return 'UR';
    } else if (rand < 15.0) {
      this.state.softPityCounter = 0;
      return 'SSR';
    } else if (rand < 45.0) {
      return 'SR';
    } else {
      return 'R';
    }
  }

  // Perform a summon pull
  // packType: 'single' (5 cards, 500 gems) | 'multi' (10 cards, 1000 gems)
  async summon(packType = 'single', bannerKey = 'yugioh') {
    const cost = packType === 'multi' ? 1000 : 500;
    const cardCount = packType === 'multi' ? 10 : 5;

    if (this.state.gems < cost) {
      throw new Error(`Insufficient Astral Gems! You need ${cost} Gems, but only have ${this.state.gems}.`);
    }

    // Deduct cost
    this.state.gems -= cost;

    // Retrieve pool cards
    const pool = await window.cardDataService.getCardsForBanner(bannerKey);

    // Group cards by rarity for selection
    const grouped = {
      UR: pool.filter(c => c.rarity === 'UR'),
      SSR: pool.filter(c => c.rarity === 'SSR'),
      SR: pool.filter(c => c.rarity === 'SR'),
      R: pool.filter(c => c.rarity === 'R')
    };

    // Ensure groups are not empty (pull from fallback if needed)
    ['UR', 'SSR', 'SR', 'R'].forEach(rarity => {
      if (!grouped[rarity] || grouped[rarity].length === 0) {
        grouped[rarity] = window.cardDataService.pools.fallback.filter(c => c.rarity === rarity);
      }
    });

    const pulledCards = [];
    let hasSSRorHigher = false;

    for (let i = 0; i < cardCount; i++) {
      // For multi-pull, guarantee slot #0 is at least SSR if no other high rarity rolled
      const isGuaranteedSlot = (packType === 'multi' && i === cardCount - 1 && !hasSSRorHigher);
      const rarity = this.rollRarity(isGuaranteedSlot);

      if (rarity === 'SSR' || rarity === 'UR') {
        hasSSRorHigher = true;
      }

      // Pick random card of that rarity
      const candidates = grouped[rarity];
      const pickedTemplate = candidates[Math.floor(Math.random() * candidates.length)];

      // Clone card object
      const pulledCard = {
        ...pickedTemplate,
        pullInstanceId: `${pickedTemplate.id}-${Date.now()}-${i}`,
        pulledAt: Date.now()
      };

      pulledCards.push(pulledCard);

      // Track in stats
      this.state.stats[rarity] = (this.state.stats[rarity] || 0) + 1;
      this.state.totalPulls++;

      // Track in Collection
      const cid = pulledCard.id;
      const isNew = !this.state.collection[cid];
      if (isNew) {
        this.state.collection[cid] = {
          card: pickedTemplate,
          count: 1,
          firstAcquired: Date.now()
        };
      } else {
        this.state.collection[cid].count++;
      }
      pulledCard.isNew = isNew;
      pulledCard.duplicateCount = this.state.collection[cid].count;
    }

    // Determine highest rarity in this pull
    const rarityPriority = { UR: 4, SSR: 3, SR: 2, R: 1 };
    let highestRarity = 'R';
    pulledCards.forEach(c => {
      if (rarityPriority[c.rarity] > rarityPriority[highestRarity]) {
        highestRarity = c.rarity;
      }
    });

    // Save and commit
    this.saveState();

    return {
      cards: pulledCards,
      highestRarity: highestRarity,
      packType: packType,
      cost: cost,
      remainingGems: this.state.gems,
      pityCounter: this.state.pityCounter
    };
  }

  // Dismantle duplicate cards to reclaim gems
  dismantleDuplicate(cardId) {
    const entry = this.state.collection[cardId];
    if (!entry || entry.count <= 1) {
      return { success: false, message: "No duplicates available to dismantle." };
    }

    const rarity = entry.card.rarity;
    const values = { R: 50, SR: 150, SSR: 400, UR: 1000 };
    const refund = values[rarity] || 50;

    entry.count--;
    this.state.gems += refund;
    this.saveState();

    return {
      success: true,
      cardName: entry.card.name,
      refund: refund,
      remainingCount: entry.count,
      totalGems: this.state.gems
    };
  }

  // Dismantle ALL duplicates across entire collection
  dismantleAllDuplicates() {
    let totalRefund = 0;
    let countDismantled = 0;
    const values = { R: 50, SR: 150, SSR: 400, UR: 1000 };

    Object.keys(this.state.collection).forEach(cid => {
      const entry = this.state.collection[cid];
      if (entry && entry.count > 1) {
        const excess = entry.count - 1;
        const refund = excess * (values[entry.card.rarity] || 50);
        totalRefund += refund;
        countDismantled += excess;
        entry.count = 1;
      }
    });

    if (countDismantled > 0) {
      this.state.gems += totalRefund;
      this.saveState();
    }

    return {
      totalRefund,
      countDismantled,
      totalGems: this.state.gems
    };
  }

  // Get collection array with duplicates and stats
  getCollectionList() {
    return Object.values(this.state.collection);
  }

  // Calculate total binder collection value
  getCollectionStats() {
    const list = this.getCollectionList();
    let totalValue = 0;
    const counts = { UR: 0, SSR: 0, SR: 0, R: 0 };
    const values = { R: 100, SR: 300, SSR: 800, UR: 2500 };

    list.forEach(item => {
      const r = item.card.rarity;
      counts[r] = (counts[r] || 0) + item.count;
      totalValue += item.count * (values[r] || 100);
    });

    return {
      uniqueCards: list.length,
      totalCards: list.reduce((acc, curr) => acc + curr.count, 0),
      totalValue: totalValue,
      counts: counts
    };
  }
}

// Global gacha engine instance
window.gachaEngine = new GachaEngine();

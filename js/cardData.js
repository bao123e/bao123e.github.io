/**
 * WUTHERING WAVES // AKADEMIYA TERMINAL
 * cardData.js - Master Data Provider for Resonators, Weapons & Echoes
 * Completely dedicated to Wuthering Waves (No Pokemon, No Yu-Gi-Oh, No CS2)
 */

class CardDataService {
  constructor() {
    this.masterData = null;
    this.wuwaResonators = [];
    this.wuwaWeapons = [];
    this.isLoaded = false;
  }

  async init() {
    try {
      const res = await fetch('src/data/wuwa_master_data.json');
      if (res.ok) {
        this.masterData = await res.json();
      }
    } catch (e) {
      console.warn('[CardDataService] Local fetch error, using embedded fallback:', e);
    }

    if (!this.masterData) {
      this.masterData = this.getEmbeddedMasterData();
    }

    window.wuwaMasterData = this.masterData;
    this.initWuWaPools();
    this.isLoaded = true;
    console.log('[CardDataService] WuWa Master Data initialized with', this.masterData.resonators.length, 'Resonators');
    window.dispatchEvent(new CustomEvent('wuwa_data_ready', { detail: this.masterData }));
  }

  initWuWaPools() {
    // 5-Star Resonators
    const fiveStars = [
      { id: 'camellya', name: 'Camellya', element: 'Havoc', weapon: 'Sword', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Camellya.png' },
      { id: 'carlotta', name: 'Carlotta', element: 'Glacio', weapon: 'Pistols', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Carlotta.png' },
      { id: 'jinhsi', name: 'Jinhsi', element: 'Spectro', weapon: 'Broadblade', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Jinhsi.png' },
      { id: 'changli', name: 'Changli', element: 'Fusion', weapon: 'Sword', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Changli.png' },
      { id: 'shorekeeper', name: 'Shorekeeper', element: 'Spectro', weapon: 'Rectifier', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Shorekeeper.png' },
      { id: 'yinlin', name: 'Yinlin', element: 'Electro', weapon: 'Rectifier', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Yinlin.png' },
      { id: 'jiyan', name: 'Jiyan', element: 'Aero', weapon: 'Broadblade', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Jiyan.png' },
      { id: 'xiangli_yao', name: 'Xiangli Yao', element: 'Electro', weapon: 'Gauntlets', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Xiangli_Yao.png' },
      { id: 'zhezhi', name: 'Zhezhi', element: 'Glacio', weapon: 'Rectifier', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Zhezhi.png' },
      { id: 'roccia', name: 'Roccia', element: 'Havoc', weapon: 'Gauntlets', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Roccia.png' },
      { id: 'phoebe', name: 'Phoebe', element: 'Spectro', weapon: 'Rectifier', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Phoebe.png' },
      { id: 'brant', name: 'Brant', element: 'Fusion', weapon: 'Broadblade', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Brant.png' },
      { id: 'cantarella', name: 'Cantarella', element: 'Havoc', weapon: 'Gauntlets', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Cantarella.png' },
      { id: 'zani', name: 'Zani', element: 'Electro', weapon: 'Pistols', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Zani.png' },
      { id: 'cartethyia', name: 'Cartethyia', element: 'Aero', weapon: 'Sword', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Cartethyia.png' },
      { id: 'verina', name: 'Verina', element: 'Spectro', weapon: 'Rectifier', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Verina.png' },
      { id: 'encore', name: 'Encore', element: 'Fusion', weapon: 'Rectifier', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Encore.png' },
      { id: 'calcharo', name: 'Calcharo', element: 'Electro', weapon: 'Broadblade', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Calcharo.png' },
      { id: 'jianxin', name: 'Jianxin', element: 'Aero', weapon: 'Gauntlets', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Jianxin.png' },
      { id: 'lingyang', name: 'Lingyang', element: 'Glacio', weapon: 'Gauntlets', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Lingyang.png' }
    ];

    // 4-Star Resonators
    const fourStars = [
      { id: 'sanhua', name: 'Sanhua', element: 'Glacio', weapon: 'Sword', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Sanhua.png' },
      { id: 'mortefi', name: 'Mortefi', element: 'Fusion', weapon: 'Pistols', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Mortefi.png' },
      { id: 'danjin', name: 'Danjin', element: 'Havoc', weapon: 'Sword', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Danjin.png' },
      { id: 'chixia', name: 'Chixia', element: 'Fusion', weapon: 'Pistols', role: 'main_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Chixia.png' },
      { id: 'baizhi', name: 'Baizhi', element: 'Glacio', weapon: 'Rectifier', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Baizhi.png' },
      { id: 'yangyang', name: 'Yangyang', element: 'Aero', weapon: 'Sword', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Yangyang.png' },
      { id: 'yuanwu', name: 'Yuanwu', element: 'Electro', weapon: 'Gauntlets', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Yuanwu.png' },
      { id: 'taoqi', name: 'Taoqi', element: 'Havoc', weapon: 'Broadblade', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Taoqi.png' },
      { id: 'aalto', name: 'Aalto', element: 'Aero', weapon: 'Pistols', role: 'sub_dps', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Aalto.png' },
      { id: 'youhu', name: 'Youhu', element: 'Glacio', weapon: 'Gauntlets', role: 'support', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Youhu.png' }
    ];

    this.wuwaResonators = [
      ...fiveStars.map(r => ({ ...r, stars: 5, category: 'resonator', videoUrl: `assets/videos/wuwa-5-${r.id}.mp4` })),
      ...fourStars.map(r => ({ ...r, stars: 4, category: 'resonator' }))
    ];

    // Authentic Weapons Pool
    const w5 = [
      { id: 'w_red_spring', name: 'Red Spring', weapon: 'Sword', stars: 5 },
      { id: 'w_ages_of_harvest', name: 'Ages of Harvest', weapon: 'Broadblade', stars: 5 },
      { id: 'w_verdant_summit', name: 'Verdant Summit', weapon: 'Broadblade', stars: 5 },
      { id: 'w_stringmaster', name: 'Stringmaster', weapon: 'Rectifier', stars: 5 },
      { id: 'w_emerald_genesis', name: 'Emerald of Genesis', weapon: 'Sword', stars: 5 },
      { id: 'w_static_mist', name: 'Static Mist', weapon: 'Pistols', stars: 5 },
      { id: 'w_abyss_surges', name: 'Abyss Surges', weapon: 'Gauntlets', stars: 5 },
      { id: 'w_cosmic_ripples', name: 'Cosmic Ripples', weapon: 'Rectifier', stars: 5 },
      { id: 'w_lustrous_razor', name: 'Lustrous Razor', weapon: 'Broadblade', stars: 5 }
    ];

    const w4 = [
      { id: 'w_commando_conviction', name: 'Commando Conviction', weapon: 'Sword', stars: 4 },
      { id: 'w_lunar_cutter', name: 'Lunar Cutter', weapon: 'Sword', stars: 4 },
      { id: 'w_dauntless_evernight', name: 'Dauntless Evernight', weapon: 'Broadblade', stars: 4 },
      { id: 'w_autumntrace', name: 'Autumntrace', weapon: 'Broadblade', stars: 4 },
      { id: 'w_undying_flame', name: 'Undying Flame', weapon: 'Pistols', stars: 4 },
      { id: 'w_novaburst', name: 'Novaburst', weapon: 'Pistols', stars: 4 },
      { id: 'w_jinzhou_keeper', name: 'Jinzhou Keeper', weapon: 'Rectifier', stars: 4 },
      { id: 'w_augmentation', name: 'Augmentation', weapon: 'Rectifier', stars: 4 },
      { id: 'w_amity_accord', name: 'Amity Accord', weapon: 'Gauntlets', stars: 4 },
      { id: 'w_stonard', name: 'Stonard', weapon: 'Gauntlets', stars: 4 }
    ];

    const w3 = [
      { id: 'w_sword_night', name: 'Sword of Night', weapon: 'Sword', stars: 3 },
      { id: 'w_originite_type1', name: 'Originite: Type I', weapon: 'Sword', stars: 3 },
      { id: 'w_broadblade_night', name: 'Broadblade of Night', weapon: 'Broadblade', stars: 3 },
      { id: 'w_originite_type2', name: 'Originite: Type II', weapon: 'Broadblade', stars: 3 },
      { id: 'w_pistols_night', name: 'Pistols of Night', weapon: 'Pistols', stars: 3 },
      { id: 'w_originite_type3', name: 'Originite: Type III', weapon: 'Pistols', stars: 3 },
      { id: 'w_rectifier_night', name: 'Rectifier of Night', weapon: 'Rectifier', stars: 3 },
      { id: 'w_originite_type4', name: 'Originite: Type IV', weapon: 'Rectifier', stars: 3 },
      { id: 'w_gauntlets_night', name: 'Gauntlets of Night', weapon: 'Gauntlets', stars: 3 },
      { id: 'w_originite_type5', name: 'Originite: Type V', weapon: 'Gauntlets', stars: 3 }
    ];

    this.wuwaWeapons = [
      ...w5.map(w => ({ ...w, category: 'weapon', image: `https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/${w.id.replace('w_', '')}.png` })),
      ...w4.map(w => ({ ...w, category: 'weapon', image: `https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/${w.id.replace('w_', '')}.png` })),
      ...w3.map(w => ({ ...w, category: 'weapon', image: `https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/3star.png` }))
    ];
  }

  getResonatorById(id) {
    if (this.masterData && this.masterData.resonators) {
      const match = this.masterData.resonators.find(r => r.id === id);
      if (match) return match;
    }
    return this.wuwaResonators.find(r => r.id === id) || null;
  }

  handleImageError(imgEl, itemId) {
    if (!imgEl) return;
    imgEl.onerror = null;
    // Fallback to local high-res art or placeholder SVG
    if (itemId && itemId.includes('jinhsi')) {
      imgEl.src = 'assets/jinhsi-official.webp';
    } else if (itemId && itemId.includes('carlotta')) {
      imgEl.src = 'assets/carlotta-wuwa.gif';
    } else {
      imgEl.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230c101d"/><text x="50%" y="50%" fill="%23d4b475" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle">WuWa // Item</text></svg>`;
    }
  }

  getEmbeddedMasterData() {
    // Built-in fallback mirror of wuwa_master_data.json
    return {
      themeConfig: {
        colors: {
          bgPrimary: "#0a0c10",
          bgSecondary: "#11151f",
          glassCard: "rgba(18, 22, 34, 0.78)",
          borderGold: "rgba(212, 180, 117, 0.25)",
          accentGold: "#d4b475",
          accentCyan: "#38bdf8",
          elements: {
            Glacio: "#38bdf8",
            Fusion: "#f97316",
            Electro: "#a855f7",
            Aero: "#2dd4bf",
            Spectro: "#facc15",
            Havoc: "#ec4899"
          }
        }
      },
      resonators: []
    };
  }
}

window.cardDataService = new CardDataService();
window.cardDataService.init();

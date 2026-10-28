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
    this.pools = { wuwa: [] };
    this.isLoaded = false;
  }

  async init() {
    if (window.wuwaMasterData && window.wuwaMasterData.resonators && window.wuwaMasterData.resonators.length) {
      this.masterData = window.wuwaMasterData;
    } else {
      try {
        const res = await fetch('src/data/wuwa_master_data.json');
        if (res.ok) {
          this.masterData = await res.json();
        }
      } catch (e) {
        console.warn('[CardDataService] Local fetch error, using embedded fallback:', e);
      }
    }

    if (!this.masterData || !this.masterData.resonators || !this.masterData.resonators.length) {
      this.masterData = this.getEmbeddedMasterData();
    }

    window.wuwaMasterData = this.masterData;
    this.initWuWaPools();
    this.isLoaded = true;
    console.log('[CardDataService] WuWa Master Data initialized with', this.pools.wuwa.length, 'Pool Items');
    window.dispatchEvent(new CustomEvent('wuwa_data_ready', { detail: this.masterData }));
  }

  initWuWaPools() {
    // 1. Resonators from Master Data (or built-in defaults)
    const masterList = (this.masterData && this.masterData.resonators) ? this.masterData.resonators : [];
    
    const formattedResonators = masterList.map(r => {
      const isRover = r.id.startsWith('rover');
      const stars = isRover ? 4 : (r.rarity || 5);
      return {
        id: r.id,
        name: typeof r.name === 'object' ? (r.name.en || r.id) : r.name,
        displayName: r.name,
        stars: stars,
        rarity: stars === 5 ? 'UR' : 'SSR',
        isGachaPullable: !isRover, // Exclude Rover from 5-star gacha
        category: 'resonator',
        element: r.element,
        weapon: r.weapon,
        role: r.role,
        image: r.assets?.avatar || r.assets?.chibi || `https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/${r.id}.png`,
        videoUrl: r.assets?.cutsceneVideo || `assets/videos/wuwa-5-${r.id}.mp4`,
        build: r.build,
        tiers: r.tiers,
        combatStats: r.combatStats
      };
    });

    // Additional 4-Star Resonators
    const fourStarResonators = [
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
    ].map(r => ({
      ...r,
      stars: 4,
      rarity: 'SSR',
      isGachaPullable: true,
      category: 'resonator',
      displayName: { en: r.name, vi: r.name }
    }));

    // Merge Unique Resonators
    const resMap = new Map();
    formattedResonators.forEach(r => resMap.set(r.id, r));
    fourStarResonators.forEach(r => {
      if (!resMap.has(r.id)) resMap.set(r.id, r);
    });
    this.wuwaResonators = Array.from(resMap.values());

    // 2. 5★ Signature Weapons Pool with Individual Cutscene Videos (from YouTube)
    const w5 = [
      { id: 'w_blazing_brilliance', name: 'Blazing Brilliance', weapon: 'Sword', stars: 5, videoUrl: 'assets/videos/wuwa-5w-blazingbrilliance.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Blazing_Brilliance.png' },
      { id: 'w_blooming_jadehaven', name: 'Blooming Jadehaven', weapon: 'Broadblade', stars: 5, videoUrl: 'assets/videos/wuwa-5w-bloomingjadehaven.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Ages_of_Harvest.png' },
      { id: 'w_azure_oath', name: 'Azure Oath', weapon: 'Sword', stars: 5, videoUrl: 'assets/videos/wuwa-5w-azureoath.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Emerald_of_Genesis.png' },
      { id: 'w_firstlights_herald', name: "Firstlight's Herald", weapon: 'Pistols', stars: 5, videoUrl: 'assets/videos/wuwa-5w-firstlightsherald.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Static_Mist.png' },
      { id: 'w_frostburn', name: 'Frostburn', weapon: 'Gauntlets', stars: 5, videoUrl: 'assets/videos/wuwa-5w-frostburn.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Abyss_Surges.png' },
      { id: 'w_glint_of_clouds', name: 'Glint of Clouds', weapon: 'Rectifier', stars: 5, videoUrl: 'assets/videos/wuwa-5w-glintofclouds.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Cosmic_Ripples.png' },
      { id: 'w_forged_dwarf_star', name: 'Forged Dwarf Star', weapon: 'Broadblade', stars: 5, videoUrl: 'assets/videos/wuwa-5w-forgeddwarfstar.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Verdant_Summit.png' },
      { id: 'w_everbright_polestar', name: 'Everbright Polestar', weapon: 'Gauntlets', stars: 5, videoUrl: 'assets/videos/wuwa-5w-everbrightpolestar.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Abyss_Surges.png' },
      { id: 'w_daybreakers_spine', name: "Daybreaker's Spine", weapon: 'Broadblade', stars: 5, videoUrl: 'assets/videos/wuwa-5w-daybreakersspine.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Lustrous_Razor.png' },
      { id: 'w_spectrum_blaster', name: 'Spectrum Blaster', weapon: 'Pistols', stars: 5, videoUrl: 'assets/videos/wuwa-5w-spectrumblaster.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Static_Mist.png' },
      { id: 'w_unspoken_rue', name: 'Unspoken Rue', weapon: 'Sword', stars: 5, videoUrl: 'assets/videos/wuwa-5w-unspokenrue.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Red_Spring.png' },
      { id: 'w_thousandfold_deliverance', name: 'Thousandfold Deliverance', weapon: 'Sword', stars: 5, videoUrl: 'assets/videos/wuwa-5w-thousandfolddeliverance.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/The_Last_Dance.png' },
      { id: 'w_freeze_frame', name: 'Freeze Frame', weapon: 'Rectifier', stars: 5, videoUrl: 'assets/videos/wuwa-5w-freezeframe.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Stringmaster.png' },
      { id: 'w_spectral_trigger', name: 'Spectral Trigger', weapon: 'Pistols', stars: 5, videoUrl: 'assets/videos/wuwa-5w-spectraltrigger.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Static_Mist.png' },
      { id: 'w_skull_thrasher', name: 'Skull Thrasher', weapon: 'Gauntlets', stars: 5, videoUrl: 'assets/videos/wuwa-5w-skullthrasher.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Abyss_Surges.png' },
      { id: 'w_red_spring', name: 'Red Spring', weapon: 'Sword', stars: 5, videoUrl: 'assets/videos/wuwa-5w-unspokenrue.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Red_Spring.png' },
      { id: 'w_ages_of_harvest', name: 'Ages of Harvest', weapon: 'Broadblade', stars: 5, videoUrl: 'assets/videos/wuwa-5w-bloomingjadehaven.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Ages_of_Harvest.png' },
      { id: 'w_verdant_summit', name: 'Verdant Summit', weapon: 'Broadblade', stars: 5, videoUrl: 'assets/videos/wuwa-5w-forgeddwarfstar.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Verdant_Summit.png' },
      { id: 'w_stringmaster', name: 'Stringmaster', weapon: 'Rectifier', stars: 5, videoUrl: 'assets/videos/wuwa-5w-freezeframe.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Stringmaster.png' },
      { id: 'w_emerald_genesis', name: 'Emerald of Genesis', weapon: 'Sword', stars: 5, videoUrl: 'assets/videos/wuwa-5w-azureoath.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Emerald_of_Genesis.png' },
      { id: 'w_static_mist', name: 'Static Mist', weapon: 'Pistols', stars: 5, videoUrl: 'assets/videos/wuwa-5w-firstlightsherald.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Static_Mist.png' },
      { id: 'w_abyss_surges', name: 'Abyss Surges', weapon: 'Gauntlets', stars: 5, videoUrl: 'assets/videos/wuwa-5w-frostburn.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Abyss_Surges.png' },
      { id: 'w_cosmic_ripples', name: 'Cosmic Ripples', weapon: 'Rectifier', stars: 5, videoUrl: 'assets/videos/wuwa-5w-glintofclouds.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Cosmic_Ripples.png' },
      { id: 'w_lustrous_razor', name: 'Lustrous Razor', weapon: 'Broadblade', stars: 5, videoUrl: 'assets/videos/wuwa-5w-daybreakersspine.mp4', image: 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/Lustrous_Razor.png' }
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
      ...w5.map(w => ({ ...w, category: 'weapon', rarity: 'UR', isGachaPullable: true, displayName: { en: w.name, vi: w.name } })),
      ...w4.map(w => ({ ...w, category: 'weapon', rarity: 'SSR', isGachaPullable: true, image: `https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/${w.id.replace('w_', '')}.png`, displayName: { en: w.name, vi: w.name } })),
      ...w3.map(w => ({ ...w, category: 'weapon', rarity: 'SR', isGachaPullable: true, image: `https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Weapon/Icon/3star.png`, displayName: { en: w.name, vi: w.name } }))
    ];

    // Combine all into Master Pool
    this.pools.wuwa = [
      ...this.wuwaResonators,
      ...this.wuwaWeapons
    ];

    this.pools.wuwa_character = this.wuwaResonators;
    this.pools.wuwa_weapon = this.wuwaWeapons;
  }

  // Get single item by ID (Resonator or Weapon)
  getCardById(id) {
    if (!id) return null;

    // Check pool first
    const fromPool = this.pools.wuwa.find(c => c.id === id);
    if (fromPool) return fromPool;

    // Check resonators master list
    const fromMaster = this.getResonatorById(id);
    if (fromMaster) {
      return {
        id: fromMaster.id,
        name: typeof fromMaster.name === 'object' ? (fromMaster.name.en || fromMaster.id) : fromMaster.name,
        displayName: fromMaster.name,
        stars: fromMaster.rarity || 5,
        rarity: (fromMaster.rarity || 5) === 5 ? 'UR' : 'SSR',
        category: 'resonator',
        element: fromMaster.element,
        weapon: fromMaster.weapon,
        role: fromMaster.role,
        image: fromMaster.assets?.avatar || fromMaster.assets?.chibi || 'assets/jinhsi-official.webp',
        videoUrl: fromMaster.assets?.cutsceneVideo || `assets/videos/wuwa-5-${fromMaster.id}.mp4`,
        build: fromMaster.build,
        tiers: fromMaster.tiers,
        combatStats: fromMaster.combatStats
      };
    }

    // Check weapons
    const fromWeapons = this.wuwaWeapons.find(w => w.id === id);
    if (fromWeapons) return fromWeapons;

    return null;
  }

  getResonatorById(id) {
    if (!id) return null;
    if (this.masterData && this.masterData.resonators) {
      const match = this.masterData.resonators.find(r => r.id === id);
      if (match) return match;
    }
    return this.wuwaResonators.find(r => r.id === id) || null;
  }

  async getCardsForBanner(bannerKey = 'wuwa') {
    return this.pools.wuwa;
  }

  handleImageError(imgEl, itemId) {
    if (!imgEl) return;
    imgEl.onerror = null;
    if (itemId && itemId.includes('jinhsi')) {
      imgEl.src = 'assets/jinhsi-official.webp';
    } else if (itemId && itemId.includes('carlotta')) {
      imgEl.src = 'assets/carlotta-wuwa.gif';
    } else {
      imgEl.src = 'assets/jinhsi-official.webp';
    }
  }

  getEmbeddedMasterData() {
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
      resonators: [
        {
          id: "jinhsi",
          name: { en: "Jinhsi", vi: "Kim Tịch (Jinhsi)" },
          rarity: 5,
          element: "Spectro",
          weapon: "Broadblade",
          role: "main_dps",
          assets: {
            avatar: "assets/jinhsi-official.webp",
            chibi: "assets/jinhsi-official.webp",
            cutsceneVideo: "assets/videos/wuwa-5-jinhsi.mp4"
          },
          tiers: { toa: "T0", ww: "T0", matrix: "T0" },
          build: {
            bestWeapon: "Ages of Harvest",
            echoSet: "Celestial Light (5pc)",
            mainEcho: "Jué (Cost 4)",
            statPriority: "Crit Rate / DMG > Spectro DMG > ATK%",
            analysis: {
              vi: "Main DPS hệ Quang cực mạnh với khả năng tích tầng Incandescence qua đòn phối hợp của đồng đội để tung ra chiêu cường hóa nộ rồng khủng khiếp.",
              en: "Premier Spectro Main DPS capable of converting coordinated attack stacks into massive dragon nuke damage."
            }
          },
          combatStats: {
            hp: 12500,
            atk: 2850,
            critRate: 0.72,
            critDmg: 2.65,
            skills: {
              basic: { name: "Slash", dmg: 480 },
              skill: { name: "Overhead Cleave", dmg: 1450, cd: 7 },
              forte: { name: "Incandescence Dragon Nuke", dmg: 4800, forteCost: 100 },
              liberation: { name: "Purifying Dragon Light", dmg: 6200, energyCost: 100 }
            }
          }
        },
        {
          id: "changli",
          name: { en: "Changli", vi: "Trường Ly (Changli)" },
          rarity: 5,
          element: "Fusion",
          weapon: "Sword",
          role: "sub_dps",
          assets: {
            avatar: "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Changli.png",
            chibi: "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Changli.png",
            cutsceneVideo: "assets/videos/wuwa-5-changli.mp4"
          },
          tiers: { toa: "T0", ww: "T0.5", matrix: "T0" },
          build: {
            bestWeapon: "Blazing Brilliance",
            echoSet: "Molten Rift (5pc)",
            mainEcho: "Inferno Rider (Cost 4)",
            statPriority: "Crit Rate / DMG > Fusion DMG > Resonance Liberation DMG",
            analysis: {
              vi: "Sub-DPS / Quickswap Fusion thượng hạng. Outro buff trực tiếp Fusion DMG & Resonance Liberation DMG cho đồng đội kế tiếp.",
              en: "Elite Fusion Sub-DPS / Quickswap. Outro buffs Fusion DMG & Resonance Liberation DMG."
            }
          },
          combatStats: {
            hp: 11800,
            atk: 2700,
            critRate: 0.7,
            critDmg: 2.55,
            skills: {
              basic: { name: "Flaming Rapier", dmg: 420 },
              skill: { name: "Tri-Flames Burst", dmg: 1300, cd: 6 },
              forte: { name: "Flaming Feather Nuke", dmg: 4200, forteCost: 100 },
              liberation: { name: "Radiance of Vermilion", dmg: 5800, energyCost: 100 }
            }
          }
        },
        {
          id: "verina",
          name: { en: "Verina", vi: "Verina (Bạch Thược)" },
          rarity: 5,
          element: "Spectro",
          weapon: "Rectifier",
          role: "support",
          assets: {
            avatar: "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Verina.png",
            chibi: "https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main/Character/Icon/Verina.png",
            cutsceneVideo: "assets/videos/wuwa-5-verina.mp4"
          },
          tiers: { toa: "T0", ww: "T0", matrix: "T0" },
          build: {
            bestWeapon: "Variation (4★)",
            echoSet: "Rejuvenating Glow (5pc)",
            mainEcho: "Bell-Borne Geochelone (Cost 4)",
            statPriority: "Energy Regen > Healing Bonus > ATK%",
            analysis: {
              vi: "Support quốc dân vạn năng. Hồi phục toàn đội, cấp khiên bảo hộ và buff sát thương toàn hệ cho cả đội hình.",
              en: "Universal tier 0 amplifier and healer. Buffs all-attribute DMG and shields the entire team."
            }
          },
          combatStats: {
            hp: 13200,
            atk: 1800,
            critRate: 0.5,
            critDmg: 1.8,
            skills: {
              basic: { name: "Botanical Seeds", dmg: 280 },
              skill: { name: "Arboreal Burst", dmg: 750, cd: 8 },
              forte: { name: "Photosynthesis Bloom", dmg: 2100, forteCost: 100 },
              liberation: { name: "Verdant Miracle Field", dmg: 3200, energyCost: 100 }
            }
          }
        }
      ]
    };
  }
}

window.cardDataService = new CardDataService();
window.cardDataService.init();

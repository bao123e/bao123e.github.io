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
    
    this.wuwaResonators = masterList.map(r => {
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
        image: r.assets?.avatar || r.assets?.chibi || `https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_${r.id}_UI.webp`,
        videoUrl: r.assets?.cutsceneVideo || `assets/videos/wuwa-5-${r.id}.mp4`,
        assets: r.assets,
        build: r.build,
        tiers: r.tiers,
        combatStats: r.combatStats
      };
    });

    // 2. Weapons Pool from Master Data (124 Akademiya Official Weapons)
    const masterWeapons = (this.masterData && this.masterData.weapons && this.masterData.weapons.length)
      ? this.masterData.weapons
      : [];

    const rarityMap = { 5: 'UR', 4: 'SSR', 3: 'SR', 2: 'R', 1: 'N' };

    this.wuwaWeapons = masterWeapons.map(w => {
      const stars = w.stars || w.rarity || 5;
      const img = w.assets?.icon || w.assets?.fullArt || w.image;
      return {
        id: w.id,
        weaponId: w.weaponId,
        name: typeof w.name === 'object' ? (w.name.en || w.id) : w.name,
        displayName: w.name,
        stars: stars,
        rarity: rarityMap[stars] || 'SSR',
        category: 'weapon',
        weapon: w.weapon || 'Sword',
        weaponType: w.weapon || 'Sword',
        isGachaPullable: w.isGachaPullable !== undefined ? w.isGachaPullable : true,
        image: img,
        videoUrl: w.assets?.cutsceneVideo || w.videoUrl || null,
        assets: w.assets || { icon: img, fullArt: img }
      };
    });

    // Combine all into Master Pools
    this.pools.wuwa = [
      ...this.wuwaResonators,
      ...this.wuwaWeapons
    ];

    this.pools.wuwa_character = this.wuwaResonators;
    this.pools.wuwa_weapon = this.wuwaWeapons;
  }

  // Get single item by ID (Resonator or Weapon) with alias & prefix tolerance
  getCardById(id) {
    if (!id) return null;

    let cleanId = String(id).trim();

    // Map historical aliases to canonical IDs
    const ALIASES = {
      'w_firstlights_herald': 'w_firstlight_s_herald',
      'w_commando_conviction': 'w_commando_of_conviction',
      'w_helio_sleeper': 'w_helios_cleaver',
      'w_helios_sleeper': 'w_helios_cleaver',
    };
    if (ALIASES[cleanId]) cleanId = ALIASES[cleanId];

    // 1. Direct match in active pool
    let found = this.pools.wuwa.find(c => c.id === cleanId || c.id === id);
    if (found) return found;

    // 2. Strip standard prefixes: wuwa-5-, wuwa-4-, wuwa-3-, wuwa-
    const unPrefixed = cleanId.replace(/^wuwa-[345]-/, '').replace(/^wuwa-/, '');
    if (ALIASES[unPrefixed]) {
      const aliasTarget = ALIASES[unPrefixed];
      found = this.pools.wuwa.find(c => c.id === aliasTarget);
      if (found) return found;
    }

    found = this.pools.wuwa.find(c => c.id === unPrefixed);
    if (found) return found;

    // 3. Search resonators in master list
    const fromMasterRes = this.getResonatorById(unPrefixed) || this.getResonatorById(cleanId);
    if (fromMasterRes) {
      const isRover = fromMasterRes.id.startsWith('rover');
      const stars = isRover ? 4 : (fromMasterRes.rarity || 5);
      return {
        id: fromMasterRes.id,
        name: typeof fromMasterRes.name === 'object' ? (fromMasterRes.name.en || fromMasterRes.id) : fromMasterRes.name,
        displayName: fromMasterRes.name,
        stars: stars,
        rarity: stars === 5 ? 'UR' : 'SSR',
        category: 'resonator',
        element: fromMasterRes.element,
        weapon: fromMasterRes.weapon,
        role: fromMasterRes.role,
        image: fromMasterRes.assets?.avatar || fromMasterRes.assets?.chibi || `https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_${fromMasterRes.id}_UI.webp`,
        videoUrl: fromMasterRes.assets?.cutsceneVideo || `assets/videos/wuwa-5-${fromMasterRes.id}.mp4`,
        assets: fromMasterRes.assets,
        build: fromMasterRes.build,
        tiers: fromMasterRes.tiers,
        combatStats: fromMasterRes.combatStats
      };
    }

    // 4. Search weapons in master list
    const fromWeapons = this.wuwaWeapons.find(w =>
      w.id === cleanId ||
      w.id === unPrefixed ||
      w.id === 'w_' + unPrefixed ||
      (w.name && typeof w.name === 'string' && w.name.toLowerCase() === unPrefixed.toLowerCase()) ||
      (w.displayName && typeof w.displayName.en === 'string' && w.displayName.en.toLowerCase() === unPrefixed.toLowerCase())
    );
    if (fromWeapons) return fromWeapons;

    return null;
  }

  getResonatorById(id) {
    if (!id) return null;
    const cleanId = String(id).replace(/^wuwa-[345]-/, '').replace(/^wuwa-/, '');
    if (this.masterData && this.masterData.resonators) {
      const match = this.masterData.resonators.find(r => r.id === cleanId || r.id === id);
      if (match) return match;
    }
    return this.wuwaResonators.find(r => r.id === cleanId || r.id === id) || null;
  }

  async getCardsForBanner(bannerKey = 'wuwa') {
    return this.pools.wuwa;
  }

  handleImageError(imgEl, itemId) {
    if (!imgEl) return;
    imgEl.onerror = null; // Prevent loop

    if (itemId) {
      const card = this.getCardById(itemId);
      if (card) {
        if (card.category === 'weapon') {
          // If weapon image failed, try alternative asset or fallback SVG
          if (card.assets?.fullArt && imgEl.src !== card.assets.fullArt) {
            imgEl.src = card.assets.fullArt;
            return;
          }
          const starCount = card.stars || 4;
          const starColor = starCount === 5 ? '#facc15' : '#c084fc';
          const typeName = card.weapon || 'Weapon';
          const cardName = typeof card.name === 'string' ? card.name : (card.name?.en || 'Weapon');
          imgEl.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%230f172a"/><circle cx="128" cy="110" r="60" fill="%231e293b" stroke="${encodeURIComponent(starColor)}" stroke-width="3"/><path d="M128 75 L133 90 L148 90 L136 100 L140 115 L128 106 L116 115 L120 100 L108 90 L123 90 Z" fill="${encodeURIComponent(starColor)}"/><text x="128" y="195" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23f1f5f9" text-anchor="middle">${encodeURIComponent(cardName.substring(0, 18))}</text><text x="128" y="220" font-family="sans-serif" font-size="12" fill="${encodeURIComponent(starColor)}" text-anchor="middle">${encodeURIComponent(typeName)} • ${starCount}★</text></svg>`;
          return;
        } else {
          // Resonator
          if (card.assets?.fullArt && imgEl.src !== card.assets.fullArt) {
            imgEl.src = card.assets.fullArt;
            return;
          }
          if (card.assets?.avatar && imgEl.src !== card.assets.avatar) {
            imgEl.src = card.assets.avatar;
            return;
          }
          if (card.id === 'jinhsi') {
            imgEl.src = 'assets/jinhsi-official.webp';
            return;
          }
          if (card.id === 'carlotta') {
            imgEl.src = 'assets/carlotta-wuwa.gif';
            return;
          }
          const elem = card.element || 'Spectro';
          const resName = typeof card.name === 'string' ? card.name : (card.name?.en || 'Resonator');
          imgEl.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23090d16"/><circle cx="128" cy="110" r="64" fill="%23172033" stroke="%2338bdf8" stroke-width="3"/><text x="128" y="120" font-family="sans-serif" font-weight="bold" font-size="28" fill="%2338bdf8" text-anchor="middle">${encodeURIComponent(elem.substring(0, 3).toUpperCase())}</text><text x="128" y="200" font-family="sans-serif" font-weight="bold" font-size="15" fill="%23f8fafc" text-anchor="middle">${encodeURIComponent(resName.substring(0, 18))}</text><text x="128" y="222" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">${encodeURIComponent(elem)} Resonator</text></svg>`;
          return;
        }
      }
    }

    // Neutral fallback - never default to Jinhsi!
    imgEl.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%230b0f19"/><circle cx="128" cy="110" r="50" fill="%231e293b"/><text x="128" y="118" font-family="sans-serif" font-weight="bold" font-size="24" fill="%2364748b" text-anchor="middle">✦</text><text x="128" y="195" font-family="sans-serif" font-size="13" fill="%2364748b" text-anchor="middle">WuWa Asset</text></svg>`;
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

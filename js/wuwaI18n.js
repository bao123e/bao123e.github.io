/**
 * WUTHERING WAVES // AKADEMIYA TERMINAL
 * wuwaI18n.js - Bilingual Internationalization Engine (Tiếng Việt & English)
 */

class WuWaI18n {
  constructor() {
    this.currentLang = localStorage.getItem('wuwa_lang') || 'vi';
    this.dictionary = {
      vi: {
        appTitle: "WUTHERING WAVES // AKADEMIYA TERMINAL",
        appSubtitle: "HỆ THỐNG MÔ PHỎNG & DỮ LIỆU CỘNG HƯỞNG ĐỈNH CAO",
        nav: {
          convene: "Triệu Hồi (Convene)",
          tracker: "Thống Kê (Tracker)",
          tierList: "Bảng Xếp Hạng Meta",
          combat: "Đấu Trường 2D Chibi",
          archive: "Hồ Sơ Resonator"
        },
        modes: {
          toa: "Tháp Nghịch Cảnh (ToA)",
          toaDesc: "Khiêu chiến Boss đơn/đôi máu trâu. Đạt 3 Huy hiệu trước khi hết giờ (180s).",
          ww: "Vùng Đất Than Khóc (WW)",
          wwDesc: "Dọn quái đa đợt liên hoàn (Multi-wave AOE). Chọn Tín vật và tối ưu điểm số.",
          matrix: "Ma Trận Chiến Thuật (Matrix)",
          matrixDesc: "Boss đa giai đoạn cường độ cao. Tích điểm nhờ Parry, Né hoàn hảo và chuỗi đòn."
        },
        roles: {
          main_dps: "Main DPS",
          sub_dps: "Sub-DPS / Hybrid",
          support: "Amplifier / Support"
        },
        tiers: {
          T0: "T0 - Tối Thượng (Dominant Meta)",
          T05: "T0.5 - Siêu Cấp (Elite Carry)",
          T1: "T1 - Vững Chắc (Top Tier)",
          T15: "T1.5 - Chuyên Dụng (Solid Pick)",
          T2: "T2 - Tình Huống (Viable)",
          T3: "T3 - Khởi Đầu (Niche)"
        },
        filter: {
          all: "Tất cả",
          elements: "Nguyên Tố",
          weapons: "Vũ Khí",
          searchPlaceholder: "Tìm kiếm Resonator theo tên..."
        },
        buildModal: {
          title: "CHI TIẾT BUILD & ĐÁNH GIÁ META",
          bestWeapon: "Vũ Khí Khuyên Dùng",
          echoSet: "Bộ Echo Chuẩn (5pc)",
          mainEcho: "Echo Chủ Lực (Cost 4)",
          statPriority: "Chỉ Số Ưu Tiên",
          tacticalAnalysis: "Phân Tích Chiến Thuật & Lối Chơi",
          deployBtn: "Chọn vào Đội Hình Chiến Đấu",
          closeBtn: "Đóng"
        },
        combatUI: {
          title: "ĐẤU TRƯỜNG 2D CHIBI COMBAT SIMULATOR",
          subtitle: "Mô phỏng cơ chế chiến đấu WuWa 60FPS: Quickswap, Đổi người Intro/Outro, Parry vòng vàng & Né đòn đỏ",
          selectMode: "1. Chọn Chế Độ Endgame",
          selectSquad: "2. Chọn Đội Hình (3 Resonators)",
          selectToken: "3. Chọn Tín Vật Buff (Whimpering Wastes)",
          startBattle: "BẮT ĐẦU KHIÊU CHIẾN",
          restartBattle: "Khiêu Chiến Lại",
          backToSetup: "Đổi Đội Hình",
          autoOn: "AUTO: BẬT",
          autoOff: "AUTO: TẮT",
          speed1x: "Tốc Độ 1x",
          speed2x: "Tốc Độ 2x",
          basicAtk: "Đánh Thường (J)",
          skill: "Kỹ Năng (E)",
          forte: "Forte Nuke (F)",
          liberation: "Nộ Tuyệt Kỹ (R)",
          dodgeParry: "Né / Đỡ Đòn (Space)",
          swap1: "Đổi Nhân Vật 1",
          swap2: "Đổi Nhân Vật 2",
          swap3: "Đổi Nhân Vật 3",
          concertoFull: "HỢP TẤU SẴN SÀNG (SWAP INTRO)",
          vibrationBroken: "VIBRATION VỠ - BOSS STAGGER!",
          parrySuccess: "PARRY HOÀN HẢO! +500 ĐIỂM",
          dodgeSuccess: "NÉ HOÀN HẢO! +300 ĐIỂM",
          victory: "CHIẾN THẮNG KHIÊU CHIẾN!",
          defeat: "KHIÊU CHIẾN THẤT BẠI - HẾT THỜI GIAN!",
          score: "Điểm Số",
          timeRemaining: "Thời Gian",
          crestsEarned: "Huy Hiệu Đạt Được",
          rankEarned: "Xếp Hạng Đạt Được",
          wave: "Đợt Quái",
          phase: "Giai Đoạn Boss"
        },
        common: {
          close: "Đóng",
          confirm: "Xác Nhận",
          gems: "Astrite",
          refill: "+5,000 Astrite",
          audioMuted: "Đã tắt âm thanh",
          audioEnabled: "Đã bật âm thanh"
        }
      },
      en: {
        appTitle: "WUTHERING WAVES // AKADEMIYA TERMINAL",
        appSubtitle: "NEXT-GEN RESONANCE COMBAT & TELEMETRY PLATFORM",
        nav: {
          convene: "Convene",
          tracker: "Tracker",
          tierList: "Meta Tier List",
          combat: "2D Chibi Combat",
          archive: "Resonator Archive"
        },
        modes: {
          toa: "Tower of Adversity (ToA)",
          toaDesc: "High-HP Boss Rush. Clear within the time limit to earn 3 Crests (180s).",
          ww: "Whimpering Wastes (WW)",
          wwDesc: "Multi-wave AOE endless rush. Equip Tokens and maximize wave clear score.",
          matrix: "Tactical Matrix",
          matrixDesc: "Multi-phase Boss simulation. Gain high multipliers via Parries and Perfect Dodges."
        },
        roles: {
          main_dps: "Main DPS",
          sub_dps: "Sub-DPS / Hybrid",
          support: "Amplifier / Support"
        },
        tiers: {
          T0: "T0 - Dominant Meta",
          T05: "T0.5 - Elite Carry",
          T1: "T1 - Top Tier",
          T15: "T1.5 - Solid Pick",
          T2: "T2 - Viable",
          T3: "T3 - Niche"
        },
        filter: {
          all: "All",
          elements: "Elements",
          weapons: "Weapons",
          searchPlaceholder: "Search Resonator by name..."
        },
        buildModal: {
          title: "BUILD OVERVIEW & META ANALYSIS",
          bestWeapon: "Recommended Weapon",
          echoSet: "Standard Echo Set (5pc)",
          mainEcho: "Main Echo (Cost 4)",
          statPriority: "Substat Priority",
          tacticalAnalysis: "Tactical Analysis & Playstyle",
          deployBtn: "Deploy to Combat Squad",
          closeBtn: "Close"
        },
        combatUI: {
          title: "2D CHIBI COMBAT SIMULATOR",
          subtitle: "60FPS WuWa Combat Engine: Quickswap, Intro/Outro Skills, Golden Circle Parry & Red Flash Dodge",
          selectMode: "1. Select Endgame Mode",
          selectSquad: "2. Select Squad (3 Resonators)",
          selectToken: "3. Select Battle Token (Whimpering Wastes)",
          startBattle: "DEPLOY COMBAT SQUAD",
          restartBattle: "Retry Battle",
          backToSetup: "Change Squad",
          autoOn: "AUTO: ON",
          autoOff: "AUTO: OFF",
          speed1x: "Speed 1x",
          speed2x: "Speed 2x",
          basicAtk: "Basic Attack (J)",
          skill: "Skill (E)",
          forte: "Forte Nuke (F)",
          liberation: "Liberation (R)",
          dodgeParry: "Dodge / Parry (Space)",
          swap1: "Swap Resonator 1",
          swap2: "Swap Resonator 2",
          swap3: "Swap Resonator 3",
          concertoFull: "CONCERTO READY (SWAP INTRO)",
          vibrationBroken: "VIBRATION BROKEN - BOSS STAGGERED!",
          parrySuccess: "PERFECT PARRY! +500 PTS",
          dodgeSuccess: "PERFECT DODGE! +300 PTS",
          victory: "SIMULATION CLEARED!",
          defeat: "CHALLENGE FAILED - TIME OVER!",
          score: "Score",
          timeRemaining: "Time Left",
          crestsEarned: "Crests Earned",
          rankEarned: "Clear Rank",
          wave: "Wave",
          phase: "Boss Phase"
        },
        common: {
          close: "Close",
          confirm: "Confirm",
          gems: "Astrite",
          refill: "+5,000 Astrite",
          audioMuted: "Audio Muted",
          audioEnabled: "Audio Enabled"
        }
      }
    };
  }

  // Get current language code
  getLang() {
    return this.currentLang;
  }

  // Switch language and trigger UI update
  setLang(lang) {
    if (lang !== 'vi' && lang !== 'en') return;
    this.currentLang = lang;
    localStorage.setItem('wuwa_lang', lang);
    this.updateDom();
    window.dispatchEvent(new CustomEvent('wuwa_lang_changed', { detail: { lang } }));
  }

  toggleLang() {
    const nextLang = this.currentLang === 'vi' ? 'en' : 'vi';
    this.setLang(nextLang);
    return nextLang;
  }

  // Translate by dot-notation key e.g. 'nav.combat'
  t(key) {
    const keys = key.split('.');
    let val = this.dictionary[this.currentLang];
    for (const k of keys) {
      if (val && val[k] !== undefined) {
        val = val[k];
      } else {
        return key;
      }
    }
    return val;
  }

  // Scan and translate all DOM elements with data-i18n attributes
  updateDom() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text && text !== key) {
        el.innerText = text;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = this.t(key);
      if (text && text !== key) {
        el.placeholder = text;
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const text = this.t(key);
      if (text && text !== key) {
        el.title = text;
      }
    });

    // Update language toggle button label
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.innerHTML = `
        <span class="font-black text-xs ${this.currentLang === 'vi' ? 'text-amber-300' : 'text-slate-400'}">VI</span>
        <span class="text-white/30 text-xs">/</span>
        <span class="font-black text-xs ${this.currentLang === 'en' ? 'text-cyan-300' : 'text-slate-400'}">EN</span>
      `;
    }

    // Update html lang attribute
    document.documentElement.lang = this.currentLang;
  }
}

window.wuwaI18n = new WuWaI18n();

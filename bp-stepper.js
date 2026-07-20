/**
 * bp-stepper.js  v2.0
 * 橫向／縱向步驟流程元件
 * ✔ 品牌色彩整合  ✔ 十種預設主題  ✔ 四種步驟狀態
 * ✔ 彈性全域設定  ✔ 虛線連接線    ✔ 縱向版型
 *
 * ─────────────────────────────────────────
 * HTML 用法範例
 * ─────────────────────────────────────────
 * <div class="bp-stepper"
 *      data-theme="sky"
 *      data-connector="dashed"
 *      data-layout="vertical"
 *      data-color="#ff0"
 *      data-card-width="260px"
 *      data-gap="40px"
 *      data-stroke="3px"
 *      data-radius="8px"
 *      data-auto-number="false">
 *
 *   <div class="bp-step" data-state="done">
 *     <span class="bp-step-icon">🔍</span>
 *     <div class="bp-step-title">搜尋</div>
 *     <div class="bp-step-desc">輸入關鍵字</div>
 *   </div>
 *   <div class="bp-step" data-state="active">...</div>
 *   <div class="bp-step">...</div>
 * </div>
 *
 * ─────────────────────────────────────────
 * 步驟狀態（data-state）
 *   done    → 已完成（綠色 + 徽章顯示 ✓）
 *   active  → 進行中（主題強調色 + 光暈）
 *   error   → 錯誤（warning 色 + 徽章顯示 !）
 *   (無)    → 待處理（預設樣式）
 *
 * ─────────────────────────────────────────
 * 主題（data-theme）
 *   lavender / sky / safe / special /
 *   warning  / salmon / stone / pink / orange / shell
 *
 * ─────────────────────────────────────────
 * 全域設定（頁面載入前執行）
 *   BPStepper.defaults.cardWidth = '280px';
 *   BPStepper.defaults.theme     = 'sky';
 *
 * ─────────────────────────────────────────
 * JS API
 *   BPStepper.init(rootEl?)          重新初始化（動態內容用）
 *   BPStepper.setActive(el, index)   0-based，前面自動 done
 *   BPStepper.setError(el, index)    標記指定步驟為 error
 *   BPStepper.resetStates(el)        清除所有步驟狀態
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     品牌色盤
  ═══════════════════════════════════════════ */
  const BRAND = {
    bg:       '#0c0d0c',
    shell:    '#c6c7bd',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#08a9d1',
    safe:     '#40c99a',
    yellow:   '#DECA4B',
    info:     '#5fafed',
    stone:    '#7090A8',
    pink:     '#FFB3D9',
    orange:   '#eda109',
  };

  /* ═══════════════════════════════════════════
     主題包（十種）
  ═══════════════════════════════════════════ */
  const THEMES = {
    lavender: {
      color: BRAND.lavender, colorActive: BRAND.special,
      colorDone: BRAND.safe, titleColor: BRAND.lavender,
      badgeBg: 'rgba(195,165,229,0.15)',
    },
    sky: {
      color: BRAND.sky,  colorActive: BRAND.info,
      colorDone: BRAND.safe, titleColor: BRAND.sky,
      badgeBg: 'rgba(8,169,209,0.12)',
    },
    safe: {
      color: BRAND.safe,    colorActive: BRAND.yellow,
      colorDone: BRAND.special, titleColor: BRAND.safe,
      badgeBg: 'rgba(64,201,154,0.12)',
    },
    special: {
      color: BRAND.special, colorActive: BRAND.yellow,
      colorDone: BRAND.safe, titleColor: BRAND.special,
      badgeBg: 'rgba(200,221,90,0.12)',
    },
    warning: {
      color: BRAND.warning, colorActive: BRAND.orange,
      colorDone: BRAND.salmon, titleColor: BRAND.warning,
      badgeBg: 'rgba(240,128,128,0.12)',
    },
    salmon: {
      color: BRAND.salmon,  colorActive: BRAND.pink,
      colorDone: BRAND.safe, titleColor: BRAND.salmon,
      badgeBg: 'rgba(229,195,179,0.12)',
    },
    stone: {
      color: BRAND.stone,   colorActive: BRAND.sky,
      colorDone: BRAND.safe, titleColor: BRAND.stone,
      badgeBg: 'rgba(112,144,168,0.14)',
    },
    pink: {
      color: BRAND.pink,    colorActive: BRAND.lavender,
      colorDone: BRAND.safe, titleColor: BRAND.pink,
      badgeBg: 'rgba(255,179,217,0.12)',
    },
    orange: {
      color: BRAND.orange,  colorActive: BRAND.yellow,
      colorDone: BRAND.safe, titleColor: BRAND.orange,
      badgeBg: 'rgba(237,161,9,0.12)',
    },
    shell: {
      color: BRAND.shell,   colorActive: BRAND.info,
      colorDone: BRAND.safe, titleColor: BRAND.shell,
      badgeBg: 'rgba(198,199,189,0.13)',
    },
  };

  /* ═══════════════════════════════════════════
     全域預設值（BPStepper.defaults 可外部覆寫）
  ═══════════════════════════════════════════ */
  const defaults = {
    /* ── 顏色 ── */
    color:          BRAND.lavender,            // 預設主色
    colorActive:    BRAND.special,             // 進行中步驟色
    colorDone:      BRAND.safe,                // 已完成步驟色
    colorError:     BRAND.warning,             // 錯誤步驟色
    textColor:      BRAND.shell,               // 卡片說明文字
    titleColor:     BRAND.lavender,            // 卡片標題文字
    badgeBg:        'rgba(195,165,229,0.15)',  // 步驟號徽章背景
    cardBg:         'rgba(12,13,12,0.55)',     // 卡片背景
    cardBgActive:   'rgba(200,221,90,0.07)',   // 進行中卡片背景
    cardBgDone:     'rgba(64,201,154,0.07)',   // 完成卡片背景
    cardBgError:    'rgba(240,128,128,0.07)',  // 錯誤卡片背景

    /* ── 幾何 ── */
    stroke:         '2px',                     // 邊框 / 連接線粗細
    radius:         '12px',                    // 卡片圓角
    cardWidth:      '220px',                   // 卡片寬度
    cardPadding:    '16px 18px',               // 卡片內距
    gap:            '36px',                    // 步驟間距（連接線長度）
    badgeSize:      '28px',                    // 步驟號徽章尺寸

    /* ── 字體 ── */
    fontSize:       '0.9rem',                  // 說明文字
    titleSize:      '1rem',                    // 標題文字
    badgeFontSize:  '0.82rem',                 // 步驟號

    /* ── 連接線 ── */
    connectorStyle: 'solid',                   // solid | dashed | dotted
    arrowSize:      '6px',                     // 箭頭大小

    /* ── 主題／行為 ── */
    theme:          null,                      // 預設主題名稱
    autoNumber:     true,                      // 自動注入步驟號徽章
  };

  /* ═══════════════════════════════════════════
     CSS 模板（透過函式產生，確保 BRAND 變數已套用）
  ═══════════════════════════════════════════ */
  function buildCSS() {
    return `
/* ══════════════════════════════════════════
   bp-stepper v2.0
══════════════════════════════════════════ */

/* ── 容器 ── */
.bp-stepper {
  display: flex;
  overflow-x: auto;
  align-items: stretch;
  gap: var(--bps-gap);
  padding: 32px 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--bps-color) rgba(255,255,255,0.05);
  box-sizing: border-box;

  /* CSS 變數預設值（JS 初始化時會依設定覆寫） */
  --bps-color:          ${BRAND.lavender};
  --bps-color-active:   ${BRAND.special};
  --bps-color-done:     ${BRAND.safe};
  --bps-color-error:    ${BRAND.warning};
  --bps-text:           ${BRAND.shell};
  --bps-title:          ${BRAND.lavender};
  --bps-badge-bg:       rgba(195,165,229,0.15);
  --bps-card-bg:        rgba(12,13,12,0.55);
  --bps-card-bg-act:    rgba(200,221,90,0.07);
  --bps-card-bg-done:   rgba(64,201,154,0.07);
  --bps-card-bg-err:    rgba(240,128,128,0.07);
  --bps-stroke:         2px;
  --bps-radius:         12px;
  --bps-width:          220px;
  --bps-padding:        16px 18px;
  --bps-gap:            36px;
  --bps-badge-sz:       28px;
  --bps-fs:             0.9rem;
  --bps-title-fs:       1rem;
  --bps-badge-fs:       0.82rem;
  --bps-arrow:          6px;
}

/* ── 卡片 ── */
.bp-step {
  flex: 0 0 var(--bps-width);
  border: var(--bps-stroke) solid var(--bps-color);
  border-radius: var(--bps-radius);
  padding: var(--bps-padding);
  position: relative;
  background: var(--bps-card-bg);
  color: var(--bps-text);
  font-size: var(--bps-fs);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color .28s, background .28s, box-shadow .28s;
  box-sizing: border-box;
}

/* ── 狀態：進行中 ── */
.bp-step[data-state="active"] {
  border-color: var(--bps-color-active);
  background:   var(--bps-card-bg-act);
  box-shadow:   0 0 16px -5px var(--bps-color-active);
}
.bp-step[data-state="active"] .bp-step-badge {
  background:   var(--bps-color-active);
  border-color: var(--bps-color-active);
  color:        #0c0d0c;
}
.bp-step[data-state="active"] .bp-step-title { color: var(--bps-color-active); }

/* ── 狀態：已完成 ── */
.bp-step[data-state="done"] {
  border-color: var(--bps-color-done);
  background:   var(--bps-card-bg-done);
}
.bp-step[data-state="done"] .bp-step-badge {
  background:   var(--bps-color-done);
  border-color: var(--bps-color-done);
  color:        #0c0d0c;
}
.bp-step[data-state="done"] .bp-step-title { color: var(--bps-color-done); }
.bp-step[data-state="done"] .bp-step-desc  { opacity: .65; }

/* ── 狀態：錯誤 ── */
.bp-step[data-state="error"] {
  border-color: var(--bps-color-error);
  background:   var(--bps-card-bg-err);
  box-shadow:   0 0 14px -5px var(--bps-color-error);
}
.bp-step[data-state="error"] .bp-step-badge {
  background:   var(--bps-color-error);
  border-color: var(--bps-color-error);
  color:        #0c0d0c;
}
.bp-step[data-state="error"] .bp-step-title { color: var(--bps-color-error); }

/* ── 步驟號徽章 ── */
.bp-step-badge {
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  width:           var(--bps-badge-sz);
  height:          var(--bps-badge-sz);
  border-radius:   50%;
  border:          var(--bps-stroke) solid var(--bps-color);
  background:      var(--bps-badge-bg);
  font-size:       var(--bps-badge-fs);
  font-weight:     700;
  color:           var(--bps-color);
  flex-shrink:     0;
  margin-bottom:   4px;
  transition:      background .28s, color .28s, border-color .28s;
}

/* ── 標題 ── */
.bp-step-title {
  font-size:   var(--bps-title-fs);
  font-weight: 600;
  color:       var(--bps-title);
  line-height: 1.3;
  transition:  color .28s;
}

/* ── 說明文字 ── */
.bp-step-desc {
  font-size:   var(--bps-fs);
  color:       var(--bps-text);
  opacity:     .82;
  line-height: 1.55;
  transition:  opacity .28s;
}

/* ── 自訂圖示（emoji 或 inline SVG） ── */
.bp-step-icon {
  font-size:     1.4rem;
  line-height:   1;
  margin-bottom: 2px;
  user-select:   none;
}

/* ══════════════════════════════════════════
   連接線（橫向）
   ::after  → 線段
   ::before → 箭頭
══════════════════════════════════════════ */
.bp-step:not(:last-child)::after {
  content:          '';
  position:         absolute;
  right:            calc(-1 * var(--bps-gap));
  top:              50%;
  width:            var(--bps-gap);
  height:           var(--bps-stroke);
  background-color: var(--bps-color);
  transform:        translateY(-50%);
  z-index:          0;
  transition:       background-color .28s;
}
.bp-step:not(:last-child)::before {
  content:       '';
  position:      absolute;
  right:         calc(-1 * var(--bps-gap));
  top:           50%;
  transform:     translateY(-50%);
  border-left:   calc(var(--bps-arrow) * 1.5) solid var(--bps-color);
  border-top:    var(--bps-arrow) solid transparent;
  border-bottom: var(--bps-arrow) solid transparent;
  z-index:       1;
  transition:    border-left-color .28s;
}

/* 連接線顏色隨步驟狀態變化 */
.bp-step[data-state="done"]:not(:last-child)::after    { background-color:    var(--bps-color-done);   }
.bp-step[data-state="done"]:not(:last-child)::before   { border-left-color:   var(--bps-color-done);   }
.bp-step[data-state="active"]:not(:last-child)::after  { background-color:    var(--bps-color-active); }
.bp-step[data-state="active"]:not(:last-child)::before { border-left-color:   var(--bps-color-active); }
.bp-step[data-state="error"]:not(:last-child)::after   { background-color:    var(--bps-color-error);  }
.bp-step[data-state="error"]:not(:last-child)::before  { border-left-color:   var(--bps-color-error);  }

/* ── 虛線連接線 ── */
.bp-stepper[data-connector="dashed"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color) 0, var(--bps-color) 6px,
    transparent 6px, transparent 13px);
}
.bp-stepper[data-connector="dashed"] .bp-step[data-state="done"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color-done) 0, var(--bps-color-done) 6px,
    transparent 6px, transparent 13px);
}
.bp-stepper[data-connector="dashed"] .bp-step[data-state="active"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color-active) 0, var(--bps-color-active) 6px,
    transparent 6px, transparent 13px);
}
.bp-stepper[data-connector="dashed"] .bp-step[data-state="error"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color-error) 0, var(--bps-color-error) 6px,
    transparent 6px, transparent 13px);
}

/* ── 點線連接線 ── */
.bp-stepper[data-connector="dotted"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color) 0, var(--bps-color) 3px,
    transparent 3px, transparent 8px);
}
.bp-stepper[data-connector="dotted"] .bp-step[data-state="done"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color-done) 0, var(--bps-color-done) 3px,
    transparent 3px, transparent 8px);
}
.bp-stepper[data-connector="dotted"] .bp-step[data-state="active"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color-active) 0, var(--bps-color-active) 3px,
    transparent 3px, transparent 8px);
}
.bp-stepper[data-connector="dotted"] .bp-step[data-state="error"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right,
    var(--bps-color-error) 0, var(--bps-color-error) 3px,
    transparent 3px, transparent 8px);
}

/* ══════════════════════════════════════════
   縱向版型
══════════════════════════════════════════ */
.bp-stepper[data-layout="vertical"] {
  flex-direction: column;
  overflow-x:     visible;
  overflow-y:     auto;
  align-items:    flex-start;
}
.bp-stepper[data-layout="vertical"] .bp-step {
  flex:      0 0 auto;
  width:     100%;
  max-width: var(--bps-width);
  min-width: 180px;
}

/* 縱向線段（垂直向下） */
.bp-stepper[data-layout="vertical"] .bp-step:not(:last-child)::after {
  right:     auto;
  left:      calc(var(--bps-badge-sz) / 2 - var(--bps-stroke) / 2);
  top:       100%;
  width:     var(--bps-stroke);
  height:    var(--bps-gap);
  transform: none;
  background-color: var(--bps-color);
}
.bp-stepper[data-layout="vertical"] .bp-step[data-state="done"]:not(:last-child)::after   { background-color: var(--bps-color-done);   }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="active"]:not(:last-child)::after { background-color: var(--bps-color-active); }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="error"]:not(:last-child)::after  { background-color: var(--bps-color-error);  }

/* 縱向箭頭（向下三角） */
.bp-stepper[data-layout="vertical"] .bp-step:not(:last-child)::before {
  right:         auto;
  left:          calc(var(--bps-badge-sz) / 2 - var(--bps-arrow));
  top:           auto;
  bottom:        calc(-1 * var(--bps-gap));
  transform:     none;
  border-left:   var(--bps-arrow) solid transparent;
  border-right:  var(--bps-arrow) solid transparent;
  border-top:    calc(var(--bps-arrow) * 1.5) solid var(--bps-color);
  border-bottom: none;
}
.bp-stepper[data-layout="vertical"] .bp-step[data-state="done"]:not(:last-child)::before   { border-top-color: var(--bps-color-done);   }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="active"]:not(:last-child)::before { border-top-color: var(--bps-color-active); }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="error"]:not(:last-child)::before  { border-top-color: var(--bps-color-error);  }

/* 縱向虛線 */
.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom,
    var(--bps-color) 0, var(--bps-color) 6px,
    transparent 6px, transparent 13px);
}
.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step[data-state="done"]:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom,
    var(--bps-color-done) 0, var(--bps-color-done) 6px,
    transparent 6px, transparent 13px);
}
.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step[data-state="active"]:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom,
    var(--bps-color-active) 0, var(--bps-color-active) 6px,
    transparent 6px, transparent 13px);
}
.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step[data-state="error"]:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom,
    var(--bps-color-error) 0, var(--bps-color-error) 6px,
    transparent 6px, transparent 13px);
}

/* 縱向點線 */
.bp-stepper[data-layout="vertical"][data-connector="dotted"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom,
    var(--bps-color) 0, var(--bps-color) 3px,
    transparent 3px, transparent 8px);
}
`;
  }

  /* ═══════════════════════════════════════════
     data-* 屬性 → CSS 變數對照表
  ═══════════════════════════════════════════ */
  const DATA_MAP = {
    color:         '--bps-color',
    colorActive:   '--bps-color-active',
    colorDone:     '--bps-color-done',
    colorError:    '--bps-color-error',
    textColor:     '--bps-text',
    titleColor:    '--bps-title',
    badgeBg:       '--bps-badge-bg',
    cardBg:        '--bps-card-bg',
    cardBgActive:  '--bps-card-bg-act',
    cardBgDone:    '--bps-card-bg-done',
    cardBgError:   '--bps-card-bg-err',
    stroke:        '--bps-stroke',
    radius:        '--bps-radius',
    cardWidth:     '--bps-width',
    cardPadding:   '--bps-padding',
    gap:           '--bps-gap',
    badgeSize:     '--bps-badge-sz',
    fontSize:      '--bps-fs',
    titleSize:     '--bps-title-fs',
    badgeFontSize: '--bps-badge-fs',
    arrowSize:     '--bps-arrow',
  };

  /* ═══════════════════════════════════════════
     注入樣式表（僅注入一次）
  ═══════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('bp-stepper-style')) return;
    const s = document.createElement('style');
    s.id = 'bp-stepper-style';
    s.textContent = buildCSS();
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════
     初始化單一容器
  ═══════════════════════════════════════════ */
  function initEl(el) {
    /* 1. 從 defaults 複製基礎設定 */
    const cfg = Object.assign({}, defaults);

    /* 2. 套用主題（data-theme > defaults.theme） */
    const theme = el.dataset.theme || cfg.theme;
    if (theme && THEMES[theme]) Object.assign(cfg, THEMES[theme]);

    /* 3. 套用個別 data-* 屬性（最高優先）→ CSS 變數 */
    Object.entries(DATA_MAP).forEach(([key, cssVar]) => {
      const val = el.dataset[key] !== undefined ? el.dataset[key] : cfg[key];
      if (val) el.style.setProperty(cssVar, val);
    });

    /* 4. 連接線樣式（data-connector > data-connectorStyle > cfg） */
    if (!el.dataset.connector) {
      const cs = el.dataset.connectorStyle || cfg.connectorStyle;
      if (cs && cs !== 'solid') el.dataset.connector = cs;
    }

    /* 5. 自動步驟號徽章 */
    const autoNum = el.dataset.autoNumber !== undefined
      ? el.dataset.autoNumber !== 'false'
      : cfg.autoNumber;

    if (autoNum) {
      el.querySelectorAll('.bp-step').forEach((step, i) => {
        if (step.querySelector('.bp-step-badge')) return; // 已有徽章則跳過
        const badge = document.createElement('span');
        badge.className = 'bp-step-badge';
        badge.setAttribute('aria-hidden', 'true');
        const state = step.dataset.state;
        badge.textContent = state === 'done'  ? '✓'
                          : state === 'error' ? '!'
                          : String(i + 1);
        step.insertBefore(badge, step.firstChild);
      });
    }
  }

  /* ═══════════════════════════════════════════
     批次初始化（支援傳入根元素，用於動態內容）
  ═══════════════════════════════════════════ */
  function init(root) {
    (root || document).querySelectorAll('.bp-stepper').forEach(initEl);
  }

  /* ═══════════════════════════════════════════
     API：setActive(el, index)
     將第 index 步設為 active，之前全 done，之後清除
  ═══════════════════════════════════════════ */
  function setActive(el, index) {
    el.querySelectorAll('.bp-step').forEach((step, i) => {
      const badge = step.querySelector('.bp-step-badge');
      if (i < index) {
        step.dataset.state = 'done';
        if (badge) badge.textContent = '✓';
      } else if (i === index) {
        step.dataset.state = 'active';
        if (badge) badge.textContent = String(i + 1);
      } else {
        delete step.dataset.state;
        if (badge) badge.textContent = String(i + 1);
      }
    });
  }

  /* ═══════════════════════════════════════════
     API：setError(el, index)
     標記指定步驟為 error
  ═══════════════════════════════════════════ */
  function setError(el, index) {
    const steps = el.querySelectorAll('.bp-step');
    if (!steps[index]) return;
    steps[index].dataset.state = 'error';
    const badge = steps[index].querySelector('.bp-step-badge');
    if (badge) badge.textContent = '!';
  }

  /* ═══════════════════════════════════════════
     API：resetStates(el)
     清除所有步驟狀態（回到初始）
  ═══════════════════════════════════════════ */
  function resetStates(el) {
    el.querySelectorAll('.bp-step').forEach((step, i) => {
      delete step.dataset.state;
      const badge = step.querySelector('.bp-step-badge');
      if (badge) badge.textContent = String(i + 1);
    });
  }

  /* ═══════════════════════════════════════════
     公開 API
  ═══════════════════════════════════════════ */
  window.BPStepper = {
    defaults,   // 可在頁面載入後修改全域預設值
    BRAND,      // 品牌色盤（供其他元件參考）
    THEMES,     // 主題包（可自行擴充）
    init,
    setActive,
    setError,
    resetStates,
  };

  /* ═══════════════════════════════════════════
     自動啟動
  ═══════════════════════════════════════════ */
  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

})();

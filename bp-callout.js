/**
 * bp-callout.js  v1.1
 * 通用教學提示框元件
 * v1.0: 15 種語意型別 / 折疊展開 / 答案遮蓋揭示 / 語意 HTML
 * v1.1: + 卡片翻面（正面→背面，自動翻回）/ 正背面各自支援 HTML 格式內容
 * v1.2: + Hover 邊框發光（subtle / normal / strong，支援全 15 種品牌色）
 *
 * ─────────────────────────────────────────────────────
 * 翻牌用法（v1.1 新增）
 * ─────────────────────────────────────────────────────
 *
 * 基本翻牌：
 *   <aside class="bp-callout" data-flip>
 *     <div class="bpc-front" data-type="example" data-title="問題">
 *       <p>HTML 格式的正面內容</p>
 *     </div>
 *     <div class="bpc-back" data-type="tip" data-title="答案">
 *       <p>HTML 格式的背面內容</p>
 *     </div>
 *   </aside>
 *
 * 自動翻回正面（N 秒後）：
 *   <aside class="bp-callout" data-flip data-flip-delay="5">
 *     ...
 *   </aside>
 *
 * 調整翻轉速度（預設 0.55s）：
 *   <aside class="bp-callout" data-flip data-flip-speed="0.8s">
 *     ...
 *   </aside>
 *
 * 自訂翻面提示圖示（預設 ↻）：
 *   <aside class="bp-callout" data-flip data-flip-hint="🔄">
 *     ...
 *   </aside>
 *
 * 事件監聽：
 *   el.addEventListener('bpc:flip-back',  e => console.log('翻到背面', e.detail));
 *   el.addEventListener('bpc:flip-front', e => console.log('翻回正面', e.detail.isAuto));
 *
 * ─────────────────────────────────────────────────────
 * 原有用法（v1.0）
 * ─────────────────────────────────────────────────────
 *
 * 基本提示框：
 *   <aside class="bp-callout" data-type="tip">
 *     <p>內容</p>
 *   </aside>
 *
 * 折疊展開：
 *   <aside class="bp-callout" data-type="example" data-collapsible>
 *     <p>內容</p>
 *   </aside>
 *
 * 答案遮蓋揭示：
 *   <aside class="bp-callout" data-type="example" data-reveal>
 *     <p>答案</p>
 *   </aside>
 *
 * 引用框：
 *   <blockquote class="bp-callout" data-type="quote" data-cite="作者">
 *     <p>引用文字</p>
 *   </blockquote>
 *
 * ─────────────────────────────────────────────────────
 * 全域設定
 * ─────────────────────────────────────────────────────
 *  BPCallout.defaults.revealText  = 'Show Answer';
 *  BPCallout.defaults.flipHint    = '🔄';
 *  BPCallout.defaults.flipDelay   = 5;   // 全域自動翻回秒數
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     品牌色盤（優先參考已載入的 BPStepper.BRAND）
  ═══════════════════════════════════════════════════ */
  const BRAND = (window.BPStepper && window.BPStepper.BRAND) || {
    bg:       '#0c0d0c',
    shell:    '#c6c7bd',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#08a9d1',
    safe:     '#40c99a',
    vanilla:  '#FDF6ED',
    yellow:   '#DECA4B',
    info:     '#5fafed',
    stone:    '#95BDD7',
    pink:     '#FFB3D9',
    orange:   '#eda109',
  };

  /* ═══════════════════════════════════════════════════
     15 種語意型別設定
  ═══════════════════════════════════════════════════ */
  const TYPES = {
    note:        { icon: '\u2139',  label: '說明',     color: '#95BDD7', bg: 'rgba(149,189,215,0.09)' },
    tip:         { icon: '💡', label: '技巧',     color: '#40c99a', bg: 'rgba(64,201,154,0.08)'  },
    warning:     { icon: '\u26a0',  label: '注意',     color: '#eda109', bg: 'rgba(237,161,9,0.09)'   },
    example:     { icon: '\u25c8',  label: '範例',     color: '#C3A5E5', bg: 'rgba(195,165,229,0.09)' },
    definition:  { icon: '\u00a7',  label: '定義',     color: '#08a9d1', bg: 'rgba(8,169,209,0.09)'   },
    explanation: { icon: '\u229e',  label: '解說',     color: '#5fafed', bg: 'rgba(95,175,237,0.09)'  },
    contrast:    { icon: '\u21cc',  label: '比較',     color: '#C8DD5A', bg: 'rgba(200,221,90,0.08)'  },
    mistake:     { icon: '\u2715',  label: '常見錯誤', color: '#F08080', bg: 'rgba(240,128,128,0.09)' },
    exception:   { icon: '\u26a1', label: '例外',     color: '#DECA4B', bg: 'rgba(222,202,75,0.08)'  },
    insight:     { icon: '\u25c9',  label: '深度見解', color: '#FFB3D9', bg: 'rgba(255,179,217,0.08)' },
    context:     { icon: '\u2299',  label: '背景知識', color: '#E5C3B3', bg: 'rgba(229,195,179,0.09)' },
    memory:      { icon: '\u25c6',  label: '記憶提示', color: '#C3A5E5', bg: 'rgba(195,165,229,0.09)' },
    goal:        { icon: '\u25ce',  label: '學習目標', color: '#C8DD5A', bg: 'rgba(200,221,90,0.08)'  },
    summary:     { icon: '\u2261',  label: '重點整理', color: '#40c99a', bg: 'rgba(64,201,154,0.08)'  },
    quote:       { icon: '\u275d',  label: '引用',     color: '#95BDD7', bg: 'rgba(149,189,215,0.07)' },
  };

  /* ═══════════════════════════════════════════════════
     全域預設值
  ═══════════════════════════════════════════════════ */
  const defaults = {
    defaultType:   'note',
    revealText:    '點擊查看',
    rehideText:    '重新隱藏',
    openDefault:   false,
    /* 翻牌 */
    flipHint:      '\u21bb',   // ↻
    flipBackLabel: '背面',
    flipDelay:     0,            // 0 = 不自動翻回
    flipSpeed:     '0.55s',
    /* 發光效果 */
    glow:          true,         // false = 全域關閉
  };

  /* ═══════════════════════════════════════════════════
     CSS（含翻牌新增部分）
  ═══════════════════════════════════════════════════ */
  function buildCSS() {
    const typeColorCSS = Object.entries(TYPES).map(([key, cfg]) =>
      `.bp-callout[data-type="${key}"] { --bpc-color: ${cfg.color}; --bpc-bg: ${cfg.bg}; }\n` +
      `.bpc-front[data-type="${key}"], .bpc-back[data-type="${key}"] { --bpc-color: ${cfg.color}; --bpc-bg: ${cfg.bg}; }`
    ).join('\n');

    return `
/* ══════════════════════════════════════════════════
   bp-callout v1.2
══════════════════════════════════════════════════ */

/* ── 容器 ── */
.bp-callout {
  display: block;
  border-left: var(--bpc-border-w, 4px) solid var(--bpc-color, ${BRAND.stone});
  border-radius: var(--bpc-radius, 8px);
  background: var(--bpc-bg, rgba(149,189,215,0.09));
  padding: 0;
  margin: 1.25em 0;
  overflow: hidden;
  color: ${BRAND.shell};
  font-size: var(--bpc-fs, 0.92rem);
  line-height: 1.65;
  position: relative;
  quotes: none;
}
blockquote.bp-callout { margin-inline: 0; }

/* ── 靜態標題列 ── */
.bpc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 9px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  box-sizing: border-box;
}

/* ── 圖示 ── */
.bpc-icon {
  font-size: 1.05rem;
  line-height: 1;
  flex-shrink: 0;
  user-select: none;
}

/* ── 標題文字 ── */
.bpc-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--bpc-color, ${BRAND.stone});
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── 內容區 ── */
.bpc-body {
  padding: 12px 16px 14px;
  box-sizing: border-box;
}
.bpc-body > *:first-child { margin-top: 0; }
.bpc-body > *:last-child  { margin-bottom: 0; }

/* ── 折疊展開（原生 details/summary）── */
.bpc-details { display: block; }
.bpc-details > summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  list-style: none;
  border-bottom: 1px solid transparent;
  transition: background .18s, border-color .18s;
  box-sizing: border-box;
  outline-offset: 2px;
}
.bpc-details > summary::-webkit-details-marker { display: none; }
.bpc-details > summary::marker { content: ''; }
.bpc-details > summary:hover  { background: rgba(255,255,255,0.04); }
.bpc-details[open] > summary  { border-bottom-color: rgba(255,255,255,0.06); }
.bpc-chevron {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--bpc-color);
  opacity: 0.65;
  display: inline-block;
  transition: transform .25s ease;
  flex-shrink: 0;
}
.bpc-details[open] > summary .bpc-chevron { transform: rotate(180deg); }
.bpc-details[open] .bpc-body { animation: bpc-slide-in .22s ease; }
@keyframes bpc-slide-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: none; }
}

/* ── 答案遮蓋揭示 ── */
.bpc-reveal-wrap {
  position: relative;
  min-height: 52px;
  border-radius: 6px;
  overflow: hidden;
}
.bpc-content { transition: filter .38s ease, opacity .38s ease; }
.bpc-content.bpc-masked {
  filter: blur(5px);
  opacity: 0.16;
  user-select: none;
  pointer-events: none;
}
.bpc-reveal-btn {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(12,13,12,0.48);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  border: 1.5px solid var(--bpc-color);
  border-radius: 6px;
  color: var(--bpc-color);
  font-size: 0.83rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background .2s;
}
.bpc-reveal-btn:hover { background: rgba(12,13,12,0.3); }
.bpc-reveal-btn .bpc-reveal-icon { font-size: 1rem; }
.bpc-rehide-btn {
  background: none;
  border: none;
  color: var(--bpc-color);
  font-size: 0.76rem;
  opacity: 0.5;
  cursor: pointer;
  padding: 4px 0 0;
  display: block;
  width: 100%;
  text-align: right;
  transition: opacity .2s;
}
.bpc-rehide-btn:hover { opacity: 0.9; }

/* ── blockquote 引用 ── */
blockquote.bp-callout .bpc-body { font-style: italic; }
.bpc-cite {
  display: block;
  font-style: normal;
  font-size: 0.8rem;
  opacity: 0.6;
  text-align: right;
  margin-top: 10px;
}
.bpc-cite::before { content: '— '; }

/* ══════════════════════════════════════════════════
   翻牌功能（v1.1）
   正面/背面使用 CSS Grid grid-area: 1/1
   讓容器高度自動取兩面較高者，不需 JS 計算高度。
══════════════════════════════════════════════════ */

/* 翻牌模式：外層僅作容器，樣式交由各面自管 */
.bp-callout[data-flip] {
  border-left: none;
  background: transparent;
  padding: 0;
  overflow: visible;
}

/* Perspective 容器 */
.bpc-flip-wrap {
  perspective: 1000px;
  perspective-origin: 50% 50%;
}

/* 3D 旋轉層 */
.bpc-flip-inner {
  display: grid;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  transition: transform var(--bpc-flip-speed, 0.55s) cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: var(--bpc-radius, 8px);
  outline: none;
}
.bpc-flip-inner:focus-visible {
  outline: 2px solid var(--bpc-color, ${BRAND.stone});
  outline-offset: 3px;
}
.bpc-flip-inner.is-flipped {
  transform: rotateY(180deg);
}

/* 正面與背面共用 */
.bpc-front,
.bpc-back {
  grid-area: 1 / 1;                    /* 同格 — 高度取較高者 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-left: var(--bpc-border-w, 4px) solid var(--bpc-color, ${BRAND.stone});
  border-radius: var(--bpc-radius, 8px);
  background: var(--bpc-bg, rgba(149,189,215,0.09));
  overflow: hidden;
  color: ${BRAND.shell};
  font-size: var(--bpc-fs, 0.92rem);
  line-height: 1.65;
  box-sizing: border-box;
}
.bpc-back {
  transform: rotateY(180deg);
  position: relative;           /* for .bpc-timer absolute positioning */
}

/* 翻面提示（正面右側）*/
.bpc-flip-hint {
  margin-left: auto;
  font-size: 1rem;
  opacity: 0.35;
  display: inline-block;
  transition: opacity .22s, transform .22s;
  flex-shrink: 0;
}
.bpc-flip-inner:hover .bpc-flip-hint,
.bpc-flip-inner:focus-visible .bpc-flip-hint {
  opacity: 0.8;
  transform: rotate(45deg);
}

/* 背面標籤（右側）*/
.bpc-back-badge {
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bpc-color);
  opacity: 0.55;
  flex-shrink: 0;
}

/* 倒數秒數文字 */
.bpc-countdown-text {
  font-size: 0.72rem;
  color: var(--bpc-color);
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
  text-align: right;
  margin-left: 4px;
  flex-shrink: 0;
  transition: opacity .3s;
}

/* 倒數計時條（背面底部）*/
.bpc-timer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.08);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}
.bpc-timer-bar {
  height: 100%;
  width: 100%;
  background: var(--bpc-color, ${BRAND.stone});
}
@keyframes bpc-countdown {
  from { width: 100%; }
  to   { width: 0%; }
}

/* ── 15 型別顏色（外層 + 翻牌正背面）── */
${typeColorCSS}

/* ══════════════════════════════════════════════════
   Hover 邊框發光效果
   核心原理：--bpc-glow 定義在外層並繼承至子元素，
   box-shadow 裡的 var(--bpc-color) 在各子元素節點
   延遲解析，因此每面自動對應自己的品牌色。
══════════════════════════════════════════════════ */

/* ── glow shadow 定義（三種強度）── */
.bp-callout {
  --bpc-glow: 0 0 0 1px var(--bpc-color), 0 0 18px -4px var(--bpc-color);
}
.bp-callout[data-glow="subtle"] {
  --bpc-glow: 0 0 12px -5px var(--bpc-color);
}
.bp-callout[data-glow="strong"] {
  --bpc-glow:
    0 0 0 2px var(--bpc-color),
    0 0 28px -2px var(--bpc-color),
    0 0 8px 0 var(--bpc-color);
}
.bp-callout[data-glow="false"],
.bp-callout[data-glow="off"],
.bp-callout[data-glow="none"] {
  --bpc-glow: none;
}

/* ── 一般 callout hover ── */
.bp-callout:not([data-flip]) {
  transition: box-shadow .28s ease;
}
.bp-callout:not([data-flip]):hover {
  box-shadow: var(--bpc-glow);
}

/* ── 翻牌正/背面 hover
   兩面都套用 box-shadow，但 backface-visibility: hidden
   確保不可見的那面不會顯示光暈。
   var(--bpc-color) 在各面節點延遲解析：
     正面（data-type="example"）→ lavender #C3A5E5
     背面（data-type="tip"）    → safe    #40c99a
── */
.bpc-front,
.bpc-back {
  transition: box-shadow .28s ease;
}
.bp-callout[data-flip] .bpc-flip-inner:hover .bpc-front,
.bp-callout[data-flip] .bpc-flip-inner:hover .bpc-back {
  box-shadow: var(--bpc-glow);
}
`;
  }

  /* ═══════════════════════════════════════════════════
     注入樣式（僅一次）
  ═══════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('bp-callout-style')) return;
    const s = document.createElement('style');
    s.id = 'bp-callout-style';
    s.textContent = buildCSS();
    document.head.appendChild(s);
    /* 全域關閉發光（BPCallout.defaults.glow = false）*/
    if (!defaults.glow) {
      const off = document.createElement('style');
      off.id = 'bp-callout-glow-off';
      off.textContent =
        '.bp-callout:hover{box-shadow:none!important}' +
        '.bpc-flip-inner:hover .bpc-front,' +
        '.bpc-flip-inner:hover .bpc-back{box-shadow:none!important}';
      document.head.appendChild(off);
    }
  }

  /* ═══════════════════════════════════════════════════
     翻牌初始化
  ═══════════════════════════════════════════════════ */
  function initFlipEl(el) {
    const frontEl = el.querySelector(':scope > .bpc-front');
    const backEl  = el.querySelector(':scope > .bpc-back');
    if (!frontEl || !backEl) {
      console.warn('bp-callout [data-flip]: .bpc-front 和 .bpc-back 都必須存在。', el);
      return;
    }

    const delay    = parseFloat(el.dataset.flipDelay  ?? defaults.flipDelay) || 0;
    const speed    = el.dataset.flipSpeed  || defaults.flipSpeed;
    const hintChar = el.dataset.flipHint   || defaults.flipHint;
    const backLabel = el.dataset.flipBackLabel || defaults.flipBackLabel;

    el.style.setProperty('--bpc-flip-speed', speed);
    if (el.dataset.borderWidth) el.style.setProperty('--bpc-border-w', el.dataset.borderWidth);
    if (el.dataset.radius)      el.style.setProperty('--bpc-radius',   el.dataset.radius);

    /* ── 建構正面 / 背面內部結構 ── */
    let countdownEl = null;

    [[frontEl, true], [backEl, false]].forEach(([side, isFront]) => {
      const typeName = side.dataset.type || defaults.defaultType;
      const cfg      = TYPES[typeName] || TYPES.note;
      const icon     = side.dataset.icon  || cfg.icon;
      const title    = side.dataset.title || cfg.label;

      /* 套用個別 CSS 變數覆寫 */
      if (side.dataset.color)       side.style.setProperty('--bpc-color',    side.dataset.color);
      if (side.dataset.bg)          side.style.setProperty('--bpc-bg',       side.dataset.bg);
      if (side.dataset.borderWidth) side.style.setProperty('--bpc-border-w', side.dataset.borderWidth);

      /* 儲存原始子節點 */
      const nodes = Array.from(side.childNodes);
      side.innerHTML = '';

      /* Header */
      const hdr = document.createElement('header');
      hdr.className = 'bpc-header';

      const iconEl = document.createElement('span');
      iconEl.className = 'bpc-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.textContent = icon;
      hdr.appendChild(iconEl);

      const titleEl = document.createElement('strong');
      titleEl.className = 'bpc-title';
      titleEl.textContent = title;
      hdr.appendChild(titleEl);

      if (isFront) {
        /* 正面：翻面提示符號 */
        const hint = document.createElement('span');
        hint.className = 'bpc-flip-hint';
        hint.setAttribute('aria-hidden', 'true');
        hint.textContent = hintChar;
        hdr.appendChild(hint);
      } else {
        /* 背面：「背面」標籤 */
        const badge = document.createElement('span');
        badge.className = 'bpc-back-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = backLabel;
        hdr.appendChild(badge);

        /* 倒數秒數（僅在有 delay 時顯示）*/
        if (delay > 0) {
          const cnt = document.createElement('span');
          cnt.className = 'bpc-countdown-text';
          cnt.setAttribute('aria-hidden', 'true');
          hdr.appendChild(cnt);
          countdownEl = cnt;
        }
      }

      /* Body */
      const body = document.createElement('div');
      body.className = 'bpc-body';
      nodes.forEach(n => body.appendChild(n.cloneNode(true)));

      side.appendChild(hdr);
      side.appendChild(body);
    });

    /* ── 倒數計時條（背面底部）── */
    let timerBar = null;
    if (delay > 0) {
      const timer = document.createElement('div');
      timer.className = 'bpc-timer';
      const bar = document.createElement('div');
      bar.className = 'bpc-timer-bar';
      timer.appendChild(bar);
      backEl.appendChild(timer);
      timerBar = bar;
    }

    /* ── 組裝 3D 翻牌結構 ── */
    const wrap  = document.createElement('div');
    wrap.className = 'bpc-flip-wrap';
    const inner = document.createElement('div');
    inner.className = 'bpc-flip-inner';
    inner.setAttribute('role',      'button');
    inner.setAttribute('tabindex',  '0');
    inner.setAttribute('aria-label', '翻面');

    inner.appendChild(frontEl);   /* DOM move（非 clone）*/
    inner.appendChild(backEl);
    wrap.appendChild(inner);
    el.appendChild(wrap);

    /* ── 狀態與計時器 ── */
    let isFlipped   = false;
    let autoTimer   = null;
    let cntInterval = null;

    function cancelAuto() {
      if (autoTimer)   { clearTimeout(autoTimer);    autoTimer   = null; }
      if (cntInterval) { clearInterval(cntInterval); cntInterval = null; }
      if (timerBar)    { timerBar.style.animation = 'none'; }
      if (countdownEl) { countdownEl.textContent = ''; }
    }

    function startAuto() {
      if (!delay) return;

      /* 計時條動畫 */
      if (timerBar) {
        timerBar.style.animation = 'none';
        timerBar.offsetHeight;          // force reflow
        timerBar.style.animation = `bpc-countdown ${delay}s linear forwards`;
      }

      /* 倒數秒數文字 */
      if (countdownEl) {
        let remaining = Math.ceil(delay);
        countdownEl.textContent = `${remaining}s`;
        cntInterval = setInterval(() => {
          remaining--;
          if (countdownEl) {
            countdownEl.textContent = remaining > 0 ? `${remaining}s` : '';
          }
          if (remaining <= 0) clearInterval(cntInterval);
        }, 1000);
      }

      /* 自動翻回正面 */
      autoTimer = setTimeout(() => {
        if (isFlipped) flip(true);
      }, delay * 1000);
    }

    function flip(isAuto) {
      isAuto = isAuto || false;
      if (isFlipped) {
        /* 翻回正面 */
        cancelAuto();
        isFlipped = false;
        inner.classList.remove('is-flipped');
        inner.setAttribute('aria-label', '翻面');
        el.dispatchEvent(new CustomEvent('bpc:flip-front', {
          bubbles: true,
          detail: { isAuto }
        }));
      } else {
        /* 翻到背面 */
        isFlipped = true;
        inner.classList.add('is-flipped');
        inner.setAttribute('aria-label', '翻回正面');
        startAuto();
        el.dispatchEvent(new CustomEvent('bpc:flip-back', {
          bubbles: true,
          detail: { delay }
        }));
      }
    }

    inner.addEventListener('click', () => flip(false));
    inner.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip(false);
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     一般提示框初始化（v1.0 原有邏輯）
  ═══════════════════════════════════════════════════ */
  function initEl(el) {
    if (el.dataset.bpcInit) return;
    el.dataset.bpcInit = '1';

    /* 翻牌模式 → 路由至 initFlipEl */
    if ('flip' in el.dataset) {
      return initFlipEl(el);
    }

    const typeName    = el.dataset.type || defaults.defaultType;
    const cfg         = TYPES[typeName] || TYPES.note;
    const icon        = el.dataset.icon  || cfg.icon;
    const title       = el.dataset.title || cfg.label;
    const isCollapse  = 'collapsible' in el.dataset;
    const isReveal    = 'reveal'      in el.dataset;
    const isOpenNow   = 'open'        in el.dataset || defaults.openDefault;
    const revealText  = el.dataset.revealText  || defaults.revealText;
    const rehideText  = el.dataset.rehideText  || defaults.rehideText;
    const cite        = el.dataset.cite || null;

    if (el.dataset.color)       el.style.setProperty('--bpc-color',    el.dataset.color);
    if (el.dataset.bg)          el.style.setProperty('--bpc-bg',       el.dataset.bg);
    if (el.dataset.borderWidth) el.style.setProperty('--bpc-border-w', el.dataset.borderWidth);
    if (el.dataset.radius)      el.style.setProperty('--bpc-radius',   el.dataset.radius);
    if (el.dataset.fontSize)    el.style.setProperty('--bpc-fs',       el.dataset.fontSize);

    const originalNodes = Array.from(el.childNodes);
    el.innerHTML = '';

    const body = document.createElement('div');
    body.className = 'bpc-body';
    originalNodes.forEach(n => body.appendChild(n.cloneNode(true)));

    if (cite && el.tagName === 'BLOCKQUOTE') {
      const citeEl = document.createElement('cite');
      citeEl.className = 'bpc-cite';
      citeEl.textContent = cite;
      body.appendChild(citeEl);
    }

    if (isReveal) {
      const wrap = document.createElement('div');
      wrap.className = 'bpc-reveal-wrap';
      const content = document.createElement('div');
      content.className = 'bpc-content bpc-masked';
      content.setAttribute('aria-hidden', 'true');
      Array.from(body.childNodes).forEach(n => content.appendChild(n.cloneNode(true)));

      const revealBtn = document.createElement('button');
      revealBtn.type = 'button';
      revealBtn.className = 'bpc-reveal-btn';
      revealBtn.setAttribute('aria-label', revealText);
      revealBtn.innerHTML = `<span class="bpc-reveal-icon" aria-hidden="true">👁</span>${revealText}`;

      const rehideBtn = document.createElement('button');
      rehideBtn.type = 'button';
      rehideBtn.className = 'bpc-rehide-btn';
      rehideBtn.textContent = `\u21a9 ${rehideText}`;
      rehideBtn.hidden = true;

      revealBtn.addEventListener('click', () => {
        content.classList.remove('bpc-masked');
        content.setAttribute('aria-hidden', 'false');
        revealBtn.style.display = 'none';
        rehideBtn.hidden = false;
        el.dispatchEvent(new CustomEvent('bpc:revealed', { bubbles: true }));
      });
      rehideBtn.addEventListener('click', () => {
        content.classList.add('bpc-masked');
        content.setAttribute('aria-hidden', 'true');
        revealBtn.style.display = '';
        rehideBtn.hidden = true;
        el.dispatchEvent(new CustomEvent('bpc:hidden', { bubbles: true }));
      });

      wrap.appendChild(content);
      wrap.appendChild(revealBtn);
      wrap.appendChild(rehideBtn);
      body.innerHTML = '';
      body.appendChild(wrap);
    }

    function makeIcon() {
      const s = document.createElement('span');
      s.className = 'bpc-icon';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = icon;
      return s;
    }
    function makeTitle() {
      const s = document.createElement('strong');
      s.className = 'bpc-title';
      s.textContent = title;
      return s;
    }

    if (isCollapse) {
      const details = document.createElement('details');
      details.className = 'bpc-details';
      if (isOpenNow) details.open = true;

      const summary = document.createElement('summary');
      summary.appendChild(makeIcon());
      summary.appendChild(makeTitle());

      const chevron = document.createElement('span');
      chevron.className = 'bpc-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '\u25be';
      summary.appendChild(chevron);

      details.addEventListener('toggle', () => {
        el.dispatchEvent(new CustomEvent(
          details.open ? 'bpc:opened' : 'bpc:closed',
          { bubbles: true }
        ));
      });

      details.appendChild(summary);
      details.appendChild(body);
      el.appendChild(details);
    } else {
      const header = document.createElement('header');
      header.className = 'bpc-header';
      header.appendChild(makeIcon());
      header.appendChild(makeTitle());
      el.appendChild(header);
      el.appendChild(body);
    }
  }

  /* ═══════════════════════════════════════════════════
     批次初始化
  ═══════════════════════════════════════════════════ */
  function init(root) {
    (root || document).querySelectorAll('.bp-callout:not([data-bpc-init])').forEach(initEl);
  }

  /* ═══════════════════════════════════════════════════
     公開 API
  ═══════════════════════════════════════════════════ */
  window.BPCallout = { defaults, TYPES, BRAND, init, version: '1.2' };

  /* ═══════════════════════════════════════════════════
     自動啟動
  ═══════════════════════════════════════════════════ */
  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

})();

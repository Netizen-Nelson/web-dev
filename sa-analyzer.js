/*!
 * SentenceAnalyzer v1.3.0
 * 宣告式 HTML 標籤句子標注分析元件
 * 支援 Bootstrap Icons（bi-xxx）與 emoji 圖示
 *
 * v1.3.0 新增屬性：
 *   dot-size        — active 圓點大小（px，預設 7）
 *   content-gap     — 下方頁籤與詳細資訊方塊的間距（px，預設 0）
 *   content-border  — 詳細資訊方塊邊框樣式：'left'（預設）| 'box'
 *   border-width    — 邊框粗細（px，left 預設 3，box 預設 1）
 */
(function (global) {
  'use strict';

  /* ══════════════════════════════════════════
     § 常數
  ══════════════════════════════════════════ */

  const DEFAULT_COLORS = [
    '#C3A5E5', '#08A9D1', '#40C99A',
    '#DECA4B', '#EDA109', '#FFB3D9',
  ];

  /* ══════════════════════════════════════════
     § CSS 注入
  ══════════════════════════════════════════ */

  let _cssInjected = false;

  function injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;

    const style = document.createElement('style');
    style.id = 'sa-analyzer-styles';
    style.textContent = `
      sa-root     { display: block; }
      sa-sentence, sa-mark, sa-content { display: none; }

      .sa-wrapper {
        display: flex;
        flex-direction: column;
        font-size: 1.125rem;
        font-family: inherit;
      }

      /* ── 外層邊框殼 ──
         clip-path 切角 + 1px padding → 1px 切角邊框 */
      .sa-border-wrap {
        clip-path: polygon(
          0 0,
          calc(100% - var(--sa-chamfer, 26px)) 0,
          100% var(--sa-chamfer, 26px),
          100% 100%,
          0 100%
        );
        background: rgba(198,199,189,0.85);
        padding: 1px;
        display: flex;
        transition: background 0.22s ease;
      }

      /* ── 內層內容面板 ──
         背景必須不透明，否則邊框殼灰底透出 */
      .sa-ch-panel {
        clip-path: polygon(
          0 0,
          calc(100% - var(--sa-chamfer, 26px)) 0,
          100% var(--sa-chamfer, 26px),
          100% 100%,
          0 100%
        );
        background: var(--sa-panel-bg, #111211);
        padding: 22px 28px;
        flex: 1;
        min-width: 0;
        transition: background 0.22s ease;
      }

      /* 上列 */
      .sa-top-row { display: flex; }
      .sa-top-row .sa-border-wrap { flex: 1; }

      /* 下列 */
      .sa-bottom-row { display: flex; }
      .sa-bottom-row .sa-border-wrap {
        flex: 1;
        cursor: pointer;
        user-select: none;
      }
      .sa-bottom-row .sa-border-wrap:focus-visible {
        outline: 2px solid rgba(195,165,229,0.8);
        outline-offset: 2px;
      }

      .sa-tab-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* ── 指示圓點 ──
         大小透過 CSS 變數 --sa-dot-size 設定 */
      .sa-tab-dot {
        display: inline-block;
        width:  var(--sa-dot-size, 7px);
        height: var(--sa-dot-size, 7px);
        border-radius: 50%;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .sa-ch-panel.sa-active .sa-tab-dot { opacity: 1; }

      .sa-mark-span {
        cursor: pointer;
        border-radius: 2px;
        transition: background 0.18s;
        padding: 0 2px;
      }
      .sa-mark-span:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }

      .sa-panel-eyebrow {
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0.72;
        margin-bottom: 10px;
      }

      .sa-sentence-text {
        line-height: 2;
        word-break: break-word;
      }

      /* ══════════════════════════════════════
         詳細資訊方塊（兩種邊框模式）
      ══════════════════════════════════════ */

      .sa-content-panel {
        position: relative;
        background: rgba(198,199,189,0.05);
        padding: 28px 32px;
        overflow: hidden;
        transition: border-color 0.25s;
      }

      /* ── left 模式（預設）：左側彩色粗條 ──
         粗細由 --sa-bar-width 控制 */
      .sa-content-panel[data-border="left"] {
        border: 1px solid rgba(198,199,189,0.22);
        border-left: none;                          /* 讓 ::before 負責左邊 */
      }
      .sa-content-panel[data-border="left"]::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: var(--sa-bar-width, 3px);
        background: var(--sa-bar-color, #C3A5E5);
        transition: background 0.25s, width 0.25s;
      }

      /* ── box 模式：四邊等寬彩色邊框 ──
         border 由 JS 動態設定（顏色跟隨 active annotation）*/
      .sa-content-panel[data-border="box"] {
        border-style: solid;
        border-color: rgba(198,199,189,0.25);       /* 初始未選取時的顏色 */
        /* border-width 由 JS 設定 */
      }
      .sa-content-panel[data-border="box"]::before {
        display: none;                               /* box 模式不需要左側粗條 */
      }

      /* 內容淡入 */
      .sa-content-body {
        animation: saFadeUp 0.25s ease both;
      }
      @keyframes saFadeUp {
        from { opacity: 0; transform: translateY(7px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .sa-empty-hint {
        color: rgba(198,199,189,0.45);
        font-style: italic;
        font-size: 1rem;
        padding: 20px 0;
        text-align: center;
      }

      .sa-content-label {
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 14px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(198,199,189,0.18);
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  /* ══════════════════════════════════════════
     § 工具函式
  ══════════════════════════════════════════ */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hex2rgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  function hex2arr(hex) {
    return hex2rgb(hex).split(',').map(Number);
  }

  /**
   * 將 HEX 顏色以 alpha 混合到 base 底色，回傳不透明 HEX。
   * 用於計算 active 頁籤背景（必須不透明，否則邊框殼灰底透出）。
   */
  function blendHex(hex, alpha, base) {
    const [r, g, b]   = hex2arr(hex);
    const [br, bg_, bb] = hex2arr(base);
    const mix = (c, bc) => Math.round(c * alpha + bc * (1 - alpha));
    return '#'
      + mix(r,  br).toString(16).padStart(2, '0')
      + mix(g,  bg_).toString(16).padStart(2, '0')
      + mix(b,  bb).toString(16).padStart(2, '0');
  }

  function renderIcon(icon) {
    if (!icon) return '';
    const t = icon.trim();
    if (/^bi-/.test(t)) return `<i class="bi ${esc(t)}" aria-hidden="true"></i>`;
    return `<span aria-hidden="true">${esc(t)}</span>`;
  }

  function extractContent(markEl) {
    const contentEl = markEl.querySelector('sa-content');
    if (contentEl) return contentEl.innerHTML;
    const clone = markEl.cloneNode(true);
    clone.querySelectorAll('sa-content').forEach(el => el.remove());
    return clone.innerHTML.trim() || esc(clone.textContent.trim());
  }

  /* ══════════════════════════════════════════
     § 標注句子 HTML 建立
  ══════════════════════════════════════════ */

  function buildAnnotatedHTML(sentence, annotations) {
    const hits = [];
    annotations.forEach((ann, idx) => {
      if (!ann.match) return;
      const pos = sentence.indexOf(ann.match);
      if (pos !== -1) hits.push({ start: pos, end: pos + ann.match.length, index: idx });
    });
    hits.sort((a, b) => a.start - b.start);

    let html = '', cursor = 0;
    for (const hit of hits) {
      if (hit.start < cursor) continue;
      if (hit.start > cursor) html += esc(sentence.slice(cursor, hit.start));

      const ann = annotations[hit.index];
      const udStyle = [
        'text-decoration:underline',
        `text-decoration-color:${ann.color}`,
        `text-decoration-style:${ann.underlineStyle}`,
        `text-decoration-thickness:${ann.underlineThickness}px`,
        'color:inherit',
      ].join(';');

      html += `<span class="sa-mark-span"
        data-index="${hit.index}"
        data-rgb="${hex2rgb(ann.color)}"
        data-highlight="${ann.highlightBg ? '1' : '0'}"
        style="${udStyle}"
        ${ann.tooltip ? `title="${esc(ann.tooltip)}"` : ''}
        tabindex="0" role="button" aria-label="${esc(ann.label)}"
      >${esc(ann.match)}</span>`;

      cursor = hit.end;
    }
    if (cursor < sentence.length) html += esc(sentence.slice(cursor));
    return html;
  }

  /* ══════════════════════════════════════════
     § DOM 輔助
  ══════════════════════════════════════════ */

  function makeBorderedPanel(extraPanelClass) {
    const wrap  = document.createElement('div');
    wrap.className = 'sa-border-wrap';
    const panel = document.createElement('div');
    panel.className = 'sa-ch-panel' + (extraPanelClass ? ` ${extraPanelClass}` : '');
    wrap.appendChild(panel);
    return { wrap, panel };
  }

  /* ══════════════════════════════════════════
     § 掛載主邏輯
  ══════════════════════════════════════════ */

  function mount(root) {
    injectCSS();

    /* ── 1. 全域設定 ── */
    const cycleStr = (root.getAttribute('color-cycle') || '').trim();
    const colorCycle = cycleStr
      ? cycleStr.split(',').map(s => s.trim()).filter(Boolean)
      : [...DEFAULT_COLORS];

    /* content-border 預設值決定 border-width 的預設值 */
    const contentBorderStyle = root.getAttribute('content-border') || 'left';
    const defaultBorderWidth = contentBorderStyle === 'box' ? 1 : 3;

    const cfg = {
      chamfer:          parseInt(root.getAttribute('chamfer'))          || 26,
      tabGap:           parseInt(root.getAttribute('tab-gap'))          || 14,
      /* bottom-tab-gap：下方分析頁籤之間的水平間距；未設定則沿用 tab-gap */
      get bottomTabGap() {
        const v = root.getAttribute('bottom-tab-gap');
        return v !== null ? (parseInt(v) || 0) : this.tabGap;
      },
      defActive:        parseInt(root.getAttribute('default-active') ?? -1),
      shellColor:       root.getAttribute('sentence-color')             || '#C6C7BD',
      tabMinH:          parseInt(root.getAttribute('tab-min-height'))   || 80,
      contentMinH:      parseInt(root.getAttribute('content-min-height')) || 180,
      panelBg:          root.getAttribute('panel-bg')                   || '#111211',

      /* v1.3.0 新增 */
      dotSize:          parseInt(root.getAttribute('dot-size'))         || 7,
      contentGap:       parseInt(root.getAttribute('content-gap'))      || 0,
      contentBorderStyle,
      borderWidth:      parseInt(root.getAttribute('border-width'))     || defaultBorderWidth,

      colorCycle,
    };

    /* ── 2. <sa-sentence> ── */
    const sentEl   = root.querySelector('sa-sentence');
    const sentence = sentEl ? sentEl.textContent.trim() : '';
    const eyebrow  = sentEl?.getAttribute('panel-label') || '';
    const fontSize = sentEl?.getAttribute('font-size')   || '1.125rem';
    const lineH    = sentEl?.getAttribute('line-height') || '2';

    /* ── 3. <sa-mark> → annotations ── */
    const annotations = Array.from(root.querySelectorAll('sa-mark'))
      .map((el, i) => ({
        match:              el.getAttribute('match')                               || '',
        label:              el.getAttribute('label')                               || `標注 ${i + 1}`,
        color:              el.getAttribute('color')                               || colorCycle[i % colorCycle.length],
        bgAlpha:            parseFloat(el.getAttribute('bg-alpha'))                || 0.18,
        underlineStyle:     el.getAttribute('underline-style')                     || 'solid',
        underlineThickness: parseInt(el.getAttribute('underline-thickness'))       || 2,
        highlightBg:        el.getAttribute('highlight-bg') !== 'false',
        icon:               el.getAttribute('icon')                                || '',
        tooltip:            el.getAttribute('tooltip')                             || '',
        autoScroll:         el.getAttribute('auto-scroll') !== 'false',
        content:            extractContent(el),
        index: i,
      }));

    /* ── 4. 建立 DOM ── */

    const wrapper = document.createElement('div');
    wrapper.className = 'sa-wrapper';
    /* CSS 變數統一設在 wrapper 上，供子元素取用 */
    wrapper.style.setProperty('--sa-chamfer',  `${cfg.chamfer}px`);
    wrapper.style.setProperty('--sa-panel-bg', cfg.panelBg);
    wrapper.style.setProperty('--sa-dot-size', `${cfg.dotSize}px`);
    wrapper.style.setProperty('--sa-bar-width', `${cfg.borderWidth}px`);

    /* 上列 */
    const topRow = document.createElement('div');
    topRow.className = 'sa-top-row';
    topRow.style.gap          = `${cfg.tabGap}px`;
    topRow.style.marginBottom = `${cfg.tabGap}px`;  /* 上列與下列的間距 */

    const { wrap: leftWrap, panel: leftPanel } = makeBorderedPanel();
    leftPanel.innerHTML = `
      ${eyebrow ? `<div class="sa-panel-eyebrow" style="color:${cfg.shellColor}">${esc(eyebrow)}</div>` : ''}
      <div class="sa-sentence-text"
           style="color:${cfg.shellColor};font-size:${fontSize};line-height:${lineH}">
        ${esc(sentence)}
      </div>`;

    const { wrap: rightWrap, panel: rightPanel } = makeBorderedPanel();
    rightPanel.innerHTML = `
      <div class="sa-sentence-text"
           style="color:${cfg.shellColor};font-size:${fontSize};line-height:${lineH}">
        ${buildAnnotatedHTML(sentence, annotations)}
      </div>`;

    topRow.append(leftWrap, rightWrap);

    /* 下列 */
    const bottomRow = document.createElement('div');
    bottomRow.className = 'sa-bottom-row';
    bottomRow.style.marginBottom = `${cfg.contentGap}px`;

    const tabEls  = [];
    const wrapEls = [];

    annotations.forEach(ann => {
      const { wrap, panel } = makeBorderedPanel();
      wrap.style.minHeight = `${cfg.tabMinH}px`;
      wrap.dataset.index   = ann.index;
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'tab');
      wrap.setAttribute('aria-label', ann.label);

      panel.dataset.index = ann.index;
      panel.innerHTML = `
        <div class="sa-tab-header">
          <span class="sa-tab-dot" style="background:${ann.color}"></span>
          ${renderIcon(ann.icon)}
          <span style="color:${ann.color};font-weight:700;font-size:1rem">${esc(ann.label)}</span>
        </div>`;

      tabEls.push(panel);
      wrapEls.push(wrap);
      bottomRow.appendChild(wrap);
    });

    /* ── 頁籤間距／重疊處理 ──
       正值：flex gap（正常間距）
       負值：margin-left 製造重疊 + z-index 控制層疊順序
             預設左側頁籤在上，active 頁籤永遠置頂 */
    const negOverlap = cfg.bottomTabGap < 0;
    if (negOverlap) {
      bottomRow.style.gap = '0';
      wrapEls.forEach((wrap, i) => {
        wrap.style.position = 'relative';
        if (i > 0) wrap.style.marginLeft = `${cfg.bottomTabGap}px`; /* 負值 → 重疊 */
        wrap.style.zIndex = annotations.length - i;                   /* 左側在上 */
      });
    } else {
      bottomRow.style.gap = `${cfg.bottomTabGap}px`;
    }

    /* 詳細資訊方塊 */
    const contentPanel = document.createElement('div');
    contentPanel.className = 'sa-content-panel';
    contentPanel.style.minHeight = `${cfg.contentMinH}px`;
    /* 邊框模式：left 或 box */
    contentPanel.dataset.border = cfg.contentBorderStyle;
    /* box 模式需要設定 border-width（left 模式由 ::before width 負責） */
    if (cfg.contentBorderStyle === 'box') {
      contentPanel.style.borderWidth = `${cfg.borderWidth}px`;
    }
    contentPanel.innerHTML = `<div class="sa-empty-hint">點擊右側句子中的標注文字，查看語法分析。</div>`;

    wrapper.append(topRow, bottomRow, contentPanel);
    root.innerHTML = '';
    root.appendChild(wrapper);

    /* ── 5. 互動邏輯 ── */

    let activeIdx = -1;

    function setActive(idx) {
      if (idx < 0 || idx >= annotations.length) return;
      activeIdx = idx;
      const ann = annotations[idx];

      /* 下方頁籤：邊框色 + 調色後的不透明背景 + 重疊時的 z-index */
      tabEls.forEach((panel, i) => {
        const a  = annotations[i];
        const on = i === idx;
        panel.classList.toggle('sa-active', on);
        panel.style.background = on
          ? blendHex(a.color, a.bgAlpha, cfg.panelBg)
          : cfg.panelBg;
        wrapEls[i].style.background = on
          ? a.color
          : 'rgba(198,199,189,0.85)';
        /* 重疊模式：active 頁籤置頂，其餘維持左側在上的預設順序 */
        if (negOverlap) {
          wrapEls[i].style.zIndex = on
            ? annotations.length + 1
            : annotations.length - i;
        }
      });

      /* 底線 span 高亮 */
      rightPanel.querySelectorAll('.sa-mark-span').forEach(span => {
        const sIdx = parseInt(span.dataset.index);
        const sAnn = annotations[sIdx];
        const on   = sIdx === idx;
        span.style.background = (on && sAnn.highlightBg)
          ? blendHex(sAnn.color, 0.18, cfg.panelBg)
          : 'transparent';
      });

      /* 詳細資訊方塊：更新顏色 */
      if (cfg.contentBorderStyle === 'left') {
        /* left 模式：更新 CSS 變數讓 ::before 變色 */
        contentPanel.style.setProperty('--sa-bar-color', ann.color);
      } else {
        /* box 模式：直接更新四邊邊框色 */
        contentPanel.style.borderColor = ann.color;
      }

      /* 替換內文（重建元素觸發 fadeUp 動畫） */
      const body = document.createElement('div');
      body.className = 'sa-content-body';
      body.innerHTML = `
        <div class="sa-content-label" style="color:${ann.color}">
          ${renderIcon(ann.icon)}
          ${esc(ann.label)}
        </div>
        <div style="color:${cfg.shellColor};line-height:1.85">${ann.content}</div>`;

      contentPanel.innerHTML = '';
      contentPanel.appendChild(body);

      if (ann.autoScroll) {
        contentPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    /* 下方頁籤事件 */
    wrapEls.forEach(wrap => {
      wrap.addEventListener('click', () => setActive(parseInt(wrap.dataset.index)));
      wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActive(parseInt(wrap.dataset.index));
        }
      });
    });

    /* 右側句子事件委派 */
    rightPanel.addEventListener('click', e => {
      const span = e.target.closest('.sa-mark-span');
      if (span) setActive(parseInt(span.dataset.index));
    });
    rightPanel.addEventListener('mouseover', e => {
      const span = e.target.closest('.sa-mark-span');
      if (!span) return;
      const sIdx = parseInt(span.dataset.index);
      if (sIdx === activeIdx) return;
      const sAnn = annotations[sIdx];
      if (sAnn.highlightBg) span.style.background = blendHex(sAnn.color, 0.12, cfg.panelBg);
    });
    rightPanel.addEventListener('mouseout', e => {
      const span = e.target.closest('.sa-mark-span');
      if (!span) return;
      if (parseInt(span.dataset.index) === activeIdx) return;
      span.style.background = 'transparent';
    });
    rightPanel.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const span = e.target.closest('.sa-mark-span');
      if (span) { e.preventDefault(); setActive(parseInt(span.dataset.index)); }
    });

    if (cfg.defActive >= 0) setActive(cfg.defActive);

    root._sa = { setActive, getAnnotations: () => annotations };
  }

  /* ══════════════════════════════════════════
     § 自動初始化
  ══════════════════════════════════════════ */

  function init() {
    document.querySelectorAll('sa-root:not([data-sa-init])').forEach(root => {
      root.setAttribute('data-sa-init', '1');
      mount(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.SentenceAnalyzer = { init, mount };

})(window);

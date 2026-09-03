(function () {
  'use strict';

  /* ── 工具函式 ────────────────────────────────────────────────────── */
  const cap     = s => s.charAt(0).toUpperCase() + s.slice(1);
  const addUnit = (val, unit) => {
    if (!val) return null;
    if (/[a-z%]$/i.test(String(val))) return String(val);
    return val + unit;
  };

  /* ── 品牌色 ─────────────────────────────────────────────────────── */
  const BrandColors = {
    bg:       '#0C0D0C',
    region:   '#333333',
    shell:    '#C6C7BD',
    lavender: '#C3A5E5',
    sky:      '#95c9de',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    ocean:    '#0ABDC6',
    safe:     '#20c21d',
    teal:     '#0DA591',
    vanilla:  '#DBEDD8',
    yellow:   '#DECA4B',
    focus:    '#e0be79',
    info:     '#788cde',
    indigo:   '#9B72CF',
    pink:     '#FFB3D9',
    orange:   '#EDA109',
    special:  '#C8DD5A',
    stone:    '#95BDD7',
  };

  /* ── 全域預設值 ─────────────────────────────────────────────────── */
  const defaults = {
    defaultColor:       'sky',
    animDuration:       500,
    horizontalAnimDur:  380,
    defaultInterval:    500,
    borderWidth:        4,
    borderAllWidth:     null,
    borderTopWidth:     null,
    borderRightWidth:   null,
    borderBottomWidth:  null,
    borderLeftWidth:    null,
    borderStyle:        'solid',
    borderTopStyle:     null,
    borderRightStyle:   null,
    borderBottomStyle:  null,
    borderLeftStyle:    null,
    borderRadius:       '0 6px 6px 0',
    bgColor:            BrandColors.region,
    textColor:          BrandColors.shell,
    fontSize:           '1rem',
    padding:            '14px 18px 20px 20px',
    marginBottom:       '10px',
    countdownHeight:    3,
    countdownPosition:  'bottom',
    progressHeight:     4,
    progressPosition:   'bottom',
    progressTransition: 400,
    manualLabel:        '▶ 下一步',
    manualAlign:        'right',
    cascadeInterval:    0,
    colsPerRow:         4,
    btnWidth:           null,
    btnHeight:          null,
    btnFontSize:        null,
    btnPadding:         null,
    startBtnWidth:      null,
    startBtnHeight:     null,
    startBtnFontSize:   null,
    startBtnPadding:    null,
    resetBtnWidth:      null,
    resetBtnHeight:     null,
    resetBtnFontSize:   null,
    resetBtnPadding:    null,
  };

  window.InfoRegionConfig = Object.assign({}, defaults, window.InfoRegionConfig || {});

  /* ================================================================
   * 靜態 CSS（不在執行期動態生成色彩 variant 迴圈）
   * 動畫時長讀自 cfg，注入一次後不再重算
   * ================================================================ */
  let _stylesInjected = false;

  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;

    const cfg  = window.InfoRegionConfig;
    const vDur = cfg.animDuration + 'ms';
    const hDur = cfg.horizontalAnimDur + 'ms';
    const defClr = BrandColors[cfg.defaultColor] || BrandColors.sky;

    /* ── 靜態色彩 variant（硬編碼，不走迴圈） ── */
    const COLOR_VARIANTS = `
      info-region[active="true"][color="shell"]    { border-left-color: #C6C7BD; }
      info-region[active="true"][color="lavender"] { border-left-color: #C3A5E5; }
      info-region[active="true"][color="sky"]      { border-left-color: #95c9de; }
      info-region[active="true"][color="warning"]  { border-left-color: #F08080; }
      info-region[active="true"][color="salmon"]   { border-left-color: #E5C3B3; }
      info-region[active="true"][color="ocean"]    { border-left-color: #0ABDC6; }
      info-region[active="true"][color="safe"]     { border-left-color: #20c21d; }
      info-region[active="true"][color="teal"]     { border-left-color: #0DA591; }
      info-region[active="true"][color="vanilla"]  { border-left-color: #DBEDD8; }
      info-region[active="true"][color="yellow"]   { border-left-color: #DECA4B; }
      info-region[active="true"][color="focus"]    { border-left-color: #e0be79; }
      info-region[active="true"][color="info"]     { border-left-color: #788cde; }
      info-region[active="true"][color="indigo"]   { border-left-color: #9B72CF; }
      info-region[active="true"][color="pink"]     { border-left-color: #FFB3D9; }
      info-region[active="true"][color="orange"]   { border-left-color: #EDA109; }
      info-region[active="true"][color="special"]  { border-left-color: #C8DD5A; }
      info-region[active="true"][color="stone"]    { border-left-color: #95BDD7; }`;

    const BTN_VARIANTS = `
      .ir-btn--shell    { border-color: #C6C7BD; color: #C6C7BD; }
      .ir-btn--shell:hover    { background: #C6C7BD22; }
      .ir-btn--lavender { border-color: #C3A5E5; color: #C3A5E5; }
      .ir-btn--lavender:hover { background: #C3A5E522; }
      .ir-btn--sky      { border-color: #95c9de; color: #95c9de; }
      .ir-btn--sky:hover      { background: #95c9de22; }
      .ir-btn--warning  { border-color: #F08080; color: #F08080; }
      .ir-btn--warning:hover  { background: #F0808022; }
      .ir-btn--salmon   { border-color: #E5C3B3; color: #E5C3B3; }
      .ir-btn--salmon:hover   { background: #E5C3B322; }
      .ir-btn--ocean    { border-color: #0ABDC6; color: #0ABDC6; }
      .ir-btn--ocean:hover    { background: #0ABDC622; }
      .ir-btn--safe     { border-color: #20c21d; color: #20c21d; }
      .ir-btn--safe:hover     { background: #20c21d22; }
      .ir-btn--teal     { border-color: #0DA591; color: #0DA591; }
      .ir-btn--teal:hover     { background: #0DA59122; }
      .ir-btn--vanilla  { border-color: #DBEDD8; color: #DBEDD8; }
      .ir-btn--vanilla:hover  { background: #DBEDD822; }
      .ir-btn--yellow   { border-color: #DECA4B; color: #DECA4B; }
      .ir-btn--yellow:hover   { background: #DECA4B22; }
      .ir-btn--focus    { border-color: #e0be79; color: #e0be79; }
      .ir-btn--focus:hover    { background: #e0be7922; }
      .ir-btn--info     { border-color: #788cde; color: #788cde; }
      .ir-btn--info:hover     { background: #788cde22; }
      .ir-btn--indigo   { border-color: #9B72CF; color: #9B72CF; }
      .ir-btn--indigo:hover   { background: #9B72CF22; }
      .ir-btn--pink     { border-color: #FFB3D9; color: #FFB3D9; }
      .ir-btn--pink:hover     { background: #FFB3D922; }
      .ir-btn--orange   { border-color: #EDA109; color: #EDA109; }
      .ir-btn--orange:hover   { background: #EDA10922; }
      .ir-btn--special  { border-color: #C8DD5A; color: #C8DD5A; }
      .ir-btn--special:hover  { background: #C8DD5A22; }
      .ir-btn--stone    { border-color: #95BDD7; color: #95BDD7; }
      .ir-btn--stone:hover    { background: #95BDD722; }`;

    const css = `
      info-region {
        display: block;
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        position: relative;
        border-left: ${cfg.borderWidth}px solid transparent;
        border-radius: ${cfg.borderRadius};
        font-size: ${cfg.fontSize};
        line-height: 1.75;
        transition:
          max-height  ${vDur} cubic-bezier(.4, 0, .2, 1),
          opacity     ${vDur} ease,
          transform   ${vDur} ease;
      }
      info-region[active="true"] {
        max-height: 4000px;
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
        margin-bottom: ${cfg.marginBottom};
        background: ${cfg.bgColor};
        color: ${cfg.textColor};
        padding: ${cfg.padding};
        border-left-color: ${defClr};
      }
      ${COLOR_VARIANTS}

      /* ── 水平佈局：改用 CSS Flexbox，不搬移 DOM ── */
      info-region-group[layout="horizontal"] {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ir-row-gap, 16px);
        align-items: stretch;
      }
      info-region-group[layout="horizontal"] info-region {
        flex: 1 1 var(--ir-col-min, 200px);
        max-height: none;
        overflow: visible;
        transform: translateX(-8px);
        padding: ${cfg.padding};
        margin-bottom: 0;
        transition:
          opacity   ${hDur} ease,
          transform ${hDur} ease;
      }
      info-region-group[layout="horizontal"] info-region[active="true"] {
        max-height: none;
        transform: translateX(0);
        margin-bottom: 0;
      }

      .ir-col { display: flex; flex-direction: column; }

      .ir-countdown-bar {
        position: absolute;
        left: 0;
        width: 100%;
        transform-origin: left center;
        transform: scaleX(1);
        pointer-events: none;
        border-radius: 0 2px 2px 0;
      }

      .ir-manual-wrap { display: flex; margin-top: 14px; }
      .ir-manual-btn {
        font-size: 0.85rem;
        padding: 6px 16px;
        animation: ir-manual-in 0.25s ease forwards;
      }
      @keyframes ir-manual-in {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .ir-manual-btn.is-leaving {
        animation: ir-manual-out 0.18s ease forwards;
      }
      @keyframes ir-manual-out {
        from { opacity: 1; transform: translateY(0); }
        to   { opacity: 0; transform: translateY(-4px); }
      }

      info-region-group { display: block; }

      .ir-controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .ir-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${BrandColors.region};
        border: 1px solid #555;
        border-radius: 6px;
        padding: 8px 20px;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 0.9rem;
        line-height: 1;
        cursor: pointer;
        color: ${BrandColors.shell};
        transition: background 0.2s, border-color 0.2s, color 0.2s;
        -webkit-user-select: none;
        user-select: none;
      }
      .ir-btn:hover { background: #3a3b3a; }
      ${BTN_VARIANTS}

      .ir-global-progress-wrap { display: flex; align-items: center; gap: 10px; }
      .ir-global-progress-track {
        flex: 1;
        position: relative;
        border-radius: 3px;
        background: #1e1f1e;
        overflow: hidden;
      }
      .ir-global-progress-bar {
        position: absolute;
        inset: 0;
        transform-origin: left center;
        transform: scaleX(0);
        border-radius: 3px;
      }
      .ir-global-percent {
        font-family: 'Space Mono', monospace;
        font-size: 0.72rem;
        min-width: 38px;
        text-align: right;
        opacity: 0;
        transition: opacity 0.3s ease;
        white-space: nowrap;
        letter-spacing: 0.03em;
      }

      info-region h1, info-region h2, info-region h3,
      info-region h4, info-region h5, info-region h6 {
        color: inherit; margin-bottom: 6px;
      }
      info-region p  { margin-bottom: 4px; }
      info-region p:last-child { margin-bottom: 0; }
      info-region ul, info-region ol { padding-left: 18px; }
      info-region li { margin-bottom: 3px; }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'info-region-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ════════════════════════════════════════════════════════════════════
   *  InfoRegion
   * ════════════════════════════════════════════════════════════════════ */
  class InfoRegion extends HTMLElement {
    static get observedAttributes() {
      return [
        'active', 'color',
        'border-width',
        'border-top-width', 'border-right-width',
        'border-bottom-width', 'border-left-width',
        'border-style',
        'border-top-style', 'border-right-style',
        'border-bottom-style', 'border-left-style',
      ];
    }

    connectedCallback() {
      /* ★ 守衛：CSS 只注入一次；active 狀態由 attributeChangedCallback 處理，
           避免 DOM 搬移時重複觸發 _onActivated */
      injectStyles();
      if (!this._irConnected) {
        this._irConnected = true;
        if (this.getAttribute('active') === 'true') {
          requestAnimationFrame(() => this._onActivated());
        }
      }
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'active') {
        if (newVal === 'true' && oldVal !== 'true') {
          this._onActivated();
        }
      } else if (this.getAttribute('active') === 'true') {
        this._applyBorderStyles();
      }
    }

    /* ── 啟動流程 ─────────────────────────────────────────────────── */
    _onActivated() {
      this._applyBorderStyles();

      if (this.hasAttribute('manual') && this.getAttribute('next')) {
        this._insertManualButton();
        return;
      }

      const parentGroup    = this.closest('info-region-group');
      const groupHasGlobal = parentGroup && parentGroup.hasAttribute('global-progress');
      const groupCascade   = parentGroup &&
        parseInt(parentGroup.getAttribute('cascade-interval'), 10) > 0;

      if (groupCascade) return;

      if (this.hasAttribute('countdown') && !groupHasGlobal) {
        this._startCountdown();
      } else {
        this._triggerNext(this._getInterval());
      }
    }

    /* ── 框線樣式套用 ─────────────────────────────────────────────── */
    _applyBorderStyles() {
      const cfg       = window.InfoRegionConfig;
      const colorName = this.getAttribute('color') || cfg.defaultColor;
      const colorHex  = BrandColors[colorName] || BrandColors.sky;

      const attrAllW = this.getAttribute('border-width');
      const attrAllS = this.getAttribute('border-style');

      ['top', 'right', 'bottom', 'left'].forEach(side => {
        const C    = cap(side);
        const prop = 'border' + C;

        const attrW = this.getAttribute(`border-${side}-width`) != null
                    ? this.getAttribute(`border-${side}-width`)
                    : attrAllW;

        let cfgW = cfg[`border${C}Width`] != null
                 ? cfg[`border${C}Width`]
                 : cfg.borderAllWidth != null
                   ? cfg.borderAllWidth
                   : (side === 'left' ? cfg.borderWidth : 0);

        const w = attrW != null ? (parseInt(attrW, 10) || 0) : (parseInt(cfgW, 10) || 0);

        const attrS = this.getAttribute(`border-${side}-style`) != null
                    ? this.getAttribute(`border-${side}-style`)
                    : attrAllS;

        const s = attrS
               || cfg[`border${C}Style`]
               || cfg.borderStyle
               || 'solid';

        this.style[`${prop}Width`] = w + 'px';
        this.style[`${prop}Style`] = w > 0 ? s : 'none';
        this.style[`${prop}Color`] = w > 0 ? colorHex : 'transparent';
      });
    }

    /* ── 框線樣式清除 ─────────────────────────────────────────────── */
    _clearBorderStyles() {
      ['top', 'right', 'bottom', 'left'].forEach(side => {
        const prop = 'border' + cap(side);
        this.style[`${prop}Width`] = '';
        this.style[`${prop}Style`] = '';
        this.style[`${prop}Color`] = '';
      });
    }

    /* ── 手動按鈕 ─────────────────────────────────────────────────── */
    _insertManualButton() {
      if (this.querySelector('.ir-manual-wrap')) return;

      const cfg       = window.InfoRegionConfig;
      const label     = this.getAttribute('manual-label') || cfg.manualLabel;
      const colorName = this.getAttribute('manual-color')
                     || this.getAttribute('color')
                     || cfg.defaultColor;
      const align     = this.getAttribute('manual-align') || cfg.manualAlign;
      const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

      const wrap = document.createElement('div');
      wrap.className = 'ir-manual-wrap';
      wrap.style.justifyContent = justifyMap[align] || 'flex-end';

      const btn = document.createElement('button');
      btn.className = `ir-btn ir-manual-btn ir-btn--${colorName}`;
      btn.textContent = label;

      btn.addEventListener('click', () => {
        btn.classList.add('is-leaving');
        btn.addEventListener('animationend', () => {
          wrap.remove();
          this._triggerNext(0);
        }, { once: true });
      });

      wrap.appendChild(btn);
      this.appendChild(wrap);
    }

    /* ── 倒數進度條 ───────────────────────────────────────────────── */
    _startCountdown() {
      const cfg       = window.InfoRegionConfig;
      const duration  = parseInt(this.getAttribute('countdown'), 10) || 2000;
      const position  = this.getAttribute('countdown-position') || cfg.countdownPosition;
      const height    = parseInt(this.getAttribute('countdown-height'), 10) || cfg.countdownHeight;
      const colorName = this.getAttribute('countdown-color')
                     || this.getAttribute('color')
                     || cfg.defaultColor;
      const colorHex  = BrandColors[colorName] || BrandColors.sky;

      const old = this.querySelector('.ir-countdown-bar');
      if (old) old.remove();

      const bar = document.createElement('div');
      bar.className = 'ir-countdown-bar';
      Object.assign(bar.style, {
        height:     height + 'px',
        background: colorHex,
        [position]: '0',
        transition: `transform ${duration}ms linear`,
      });
      this.appendChild(bar);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; });
      });

      setTimeout(() => this._triggerNext(0), duration);
    }

    /* ── 鏈結下一個元素 ───────────────────────────────────────────── */
    _triggerNext(delay) {
      const nextId = this.getAttribute('next');
      if (!nextId) return;
      setTimeout(() => {
        const el = document.getElementById(nextId);
        if (el) el.setAttribute('active', 'true');
        else console.warn(`[InfoRegion] 找不到 id="${nextId}" 的元素。`);
      }, delay);
    }

    _getInterval() {
      return parseInt(this.getAttribute('next-interval'), 10)
          || window.InfoRegionConfig.defaultInterval;
    }

    activate() { this.setAttribute('active', 'true'); }

    reset() {
      this._irConnected = false; // 允許下次 connectedCallback 重新初始化
      this.removeAttribute('active');
      this._clearBorderStyles();
      const bar  = this.querySelector('.ir-countdown-bar');
      const wrap = this.querySelector('.ir-manual-wrap');
      if (bar)  bar.remove();
      if (wrap) wrap.remove();
    }
  }

  /* ════════════════════════════════════════════════════════════════════
   *  InfoRegionGroup
   * ════════════════════════════════════════════════════════════════════ */
  class InfoRegionGroup extends HTMLElement {
    constructor() {
      super();
      this._progressBar = null;
      this._percentEl   = null;
      this._observer    = null;
    }

    connectedCallback() {
      injectStyles();
      /* ★ 守衛：_build 只跑一次，避免 DOM 操作觸發重複初始化 */
      if (this._irGroupBuilt) return;
      this._irGroupBuilt = true;
      Promise.resolve().then(() => this._build());
    }

    disconnectedCallback() {
      if (this._observer) this._observer.disconnect();
    }

    _getChildren() {
      return Array.from(this.querySelectorAll('info-region'));
    }

    _build() {
      this._setupLayout();
      this._setupControls();
      if (this.hasAttribute('global-progress')) {
        this._setupGlobalProgress();
        this._setupObserver();
      }
      if (this.hasAttribute('auto-start')) {
        Promise.resolve().then(() => this._start());
      }
    }

    /* ── 水平佈局（純 CSS，不搬移 DOM）────────────────────────────── */
    /*
     * 改用 CSS 變數控制欄寬，完全不移動子元素。
     * cols-per-row 轉換為 flex-basis 百分比，讓瀏覽器處理折行。
     * row-gap / gutter 屬性仍有效，對應 CSS gap。
     */
    _setupLayout() {
      if (this.getAttribute('layout') !== 'horizontal') return;

      const cfg    = window.InfoRegionConfig;
      const perRow = parseInt(this.getAttribute('cols-per-row'), 10)
                  || cfg.colsPerRow || 4;
      const gap    = this.getAttribute('gutter-size') || '16px';
      const rowGap = this.getAttribute('row-gap')     || gap;

      /* 計算每欄最小寬度（百分比留些許空間讓 gap 呼吸） */
      const pct = Math.floor(100 / perRow) - 1;

      this.style.setProperty('--ir-col-min', pct + '%');
      this.style.setProperty('--ir-row-gap', rowGap);
      this.style.gap = rowGap;
    }

    /* ── 控制按鈕（不變） ─────────────────────────────────────────── */
    _setupControls() {
      if (this.getAttribute('show-controls') === 'false') return;

      const startLabel = this.getAttribute('start-label') || '▶ 開始';
      const resetLabel = this.getAttribute('reset-label') || '↺ 重設';
      const startColor = this.getAttribute('start-color') || 'sky';
      const resetColor = this.getAttribute('reset-color') || 'warning';

      const div = document.createElement('div');
      div.className = 'ir-controls';

      const startBtn = document.createElement('button');
      startBtn.className = `ir-btn ir-btn--${startColor}`;
      startBtn.textContent = startLabel;
      startBtn.addEventListener('click', () => this._start());
      this._applyBtnStyles(startBtn, 'start');

      const resetBtn = document.createElement('button');
      resetBtn.className = `ir-btn ir-btn--${resetColor}`;
      resetBtn.textContent = resetLabel;
      resetBtn.addEventListener('click', () => this._reset());
      this._applyBtnStyles(resetBtn, 'reset');

      div.append(startBtn, resetBtn);
      this.insertBefore(div, this.firstChild);
    }

    _applyBtnStyles(btn, prefix) {
      const cfg = window.InfoRegionConfig;
      const cfgPrefix = prefix + 'Btn';

      const resolve = (attr, cfgKey, fbAttr, fbCfgKey) => {
        const v = this.getAttribute(attr);
        if (v != null) return v;
        if (cfg[cfgKey] != null) return String(cfg[cfgKey]);
        if (fbAttr) {
          const fv = this.getAttribute(fbAttr);
          if (fv != null) return fv;
        }
        if (fbCfgKey && cfg[fbCfgKey] != null) return String(cfg[fbCfgKey]);
        return null;
      };

      const width    = resolve(`${prefix}-width`,     `${cfgPrefix}Width`,    'btn-width',     'btnWidth');
      const height   = resolve(`${prefix}-height`,    `${cfgPrefix}Height`,   'btn-height',    'btnHeight');
      const fontSize = resolve(`${prefix}-font-size`, `${cfgPrefix}FontSize`, 'btn-font-size', 'btnFontSize');
      const padding  = resolve(`${prefix}-padding`,   `${cfgPrefix}Padding`,  'btn-padding',   'btnPadding');

      if (width)    btn.style.width    = addUnit(width, 'px');
      if (height)   btn.style.height   = addUnit(height, 'px');
      if (fontSize) btn.style.fontSize = addUnit(fontSize, 'rem');
      if (padding)  btn.style.padding  = padding;
    }

    /* ── 全體進度條（不變） ───────────────────────────────────────── */
    _setupGlobalProgress() {
      const cfg       = window.InfoRegionConfig;
      const position  = this.getAttribute('progress-position') || cfg.progressPosition;
      const height    = parseInt(this.getAttribute('progress-height'), 10) || cfg.progressHeight;
      const colorName = this.getAttribute('progress-color') || cfg.defaultColor;
      const colorHex  = BrandColors[colorName] || BrandColors.sky;
      const showPct   = this.hasAttribute('show-percent');

      const wrap = document.createElement('div');
      wrap.className = 'ir-global-progress-wrap';
      wrap.style[position === 'top' ? 'marginBottom' : 'marginTop'] = '12px';

      const track = document.createElement('div');
      track.className = 'ir-global-progress-track';
      track.style.height = height + 'px';

      const bar = document.createElement('div');
      bar.className = 'ir-global-progress-bar';
      bar.style.background = colorHex;
      track.appendChild(bar);
      this._progressBar = bar;
      wrap.appendChild(track);

      if (showPct) {
        const pct = document.createElement('span');
        pct.className = 'ir-global-percent';
        pct.style.color = colorHex;
        pct.textContent = '0%';
        wrap.appendChild(pct);
        this._percentEl = pct;
      }

      if (position === 'top') {
        const controls = this.querySelector('.ir-controls');
        if (controls) controls.insertAdjacentElement('afterend', wrap);
        else          this.insertBefore(wrap, this.firstChild);
      } else {
        this.appendChild(wrap);
      }
    }

    /* ── MutationObserver（不變） ─────────────────────────────────── */
    _setupObserver() {
      this._observer = new MutationObserver(() => this._updateProgress());
      this._getChildren().forEach(child => {
        this._observer.observe(child, { attributes: true, attributeFilter: ['active'] });
      });
    }

    _updateProgress() {
      if (!this._progressBar) return;
      const children  = this._getChildren();
      const total     = children.length;
      const activated = children.filter(el => el.getAttribute('active') === 'true').length;
      const ratio     = total > 0 ? activated / total : 0;

      this._progressBar.style.transform = `scaleX(${ratio})`;

      if (this._percentEl) {
        this._percentEl.textContent = Math.round(ratio * 100) + '%';
        if (ratio > 0) this._percentEl.style.opacity = '1';
      }
    }

    /* ── 開始 / 重設（不變） ──────────────────────────────────────── */
    _start() {
      this._reset(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this._progressBar) {
            const cfg = window.InfoRegionConfig;
            this._progressBar.style.transition =
              `transform ${cfg.progressTransition}ms ease`;
          }

          const children = this._getChildren();
          if (children.length === 0) return;

          const cascadeMs = parseInt(this.getAttribute('cascade-interval'), 10)
                         || window.InfoRegionConfig.cascadeInterval;

          if (cascadeMs > 0) {
            children.forEach((child, i) => {
              setTimeout(() => child.activate(), i * cascadeMs);
            });
          } else {
            children[0].activate();
          }
        });
      });
    }

    _reset(reenableTransition = true) {
      this._getChildren().forEach(el => el.reset());

      if (this._progressBar) {
        this._progressBar.style.transition = 'none';
        this._progressBar.style.transform  = 'scaleX(0)';
        if (reenableTransition) {
          requestAnimationFrame(() => {
            if (this._progressBar) {
              const cfg = window.InfoRegionConfig;
              this._progressBar.style.transition =
                `transform ${cfg.progressTransition}ms ease`;
            }
          });
        }
      }

      if (this._percentEl) {
        this._percentEl.textContent = '0%';
        this._percentEl.style.opacity = '0';
      }
    }

    start() { this._start(); }
    reset() { this._reset(); }
  }

  /* ── 元素註冊 ────────────────────────────────────────────────────── */
  customElements.define('info-region',       InfoRegion);
  customElements.define('info-region-group', InfoRegionGroup);

  /* ── 公開 API ────────────────────────────────────────────────────── */
  window.InfoRegion = {
    activate(id) {
      const el = document.getElementById(id);
      if (el && el.tagName === 'INFO-REGION') el.activate();
      else console.warn(`[InfoRegion.activate] 找不到 info-region#${id}`);
    },
    resetAll(scopeSelector = 'info-region') {
      document.querySelectorAll(scopeSelector).forEach(el => {
        if (el.tagName === 'INFO-REGION') el.reset();
      });
    },
    get colors() { return Object.keys(BrandColors); },
    get config()  { return Object.assign({}, window.InfoRegionConfig); },
  };

})();

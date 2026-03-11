
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
    bg:        '#0c0d0c',
    region:    '#333333',
    shell:     '#c6c7bd',
    lavender:  '#C3A5E5',
    special:   '#b9c971',
    warning:   '#F08080',
    salmon:    '#E5C3B3',
    attention: '#E5E5A6',
    sky:       '#04b5a3',
    safe:      '#81E6D9',
    brown:     '#d9b375',
    info:      '#90CDF4',
    pink:      '#FFB3D9',
    orange:    '#f69653',
  };

  /* ── 全域預設值 ─────────────────────────────────────────────────── */
  const defaults = {
    defaultColor:       'sky',
    animDuration:       500,          // 垂直展開動畫 ms
    horizontalAnimDur:  380,          // 橫向淡入動畫 ms
    defaultInterval:    500,          // 無 countdown 的鏈結延遲 ms

    /* ── 內容框線 ────────────────────────── */
    borderWidth:        4,            // 左邊框粗細（原始預設，僅左側）
    borderAllWidth:     null,         // 若設定，四邊框同寬（覆蓋各側個別設定）
    borderTopWidth:     null,         // 上框線粗細
    borderRightWidth:   null,         // 右框線粗細
    borderBottomWidth:  null,         // 下框線粗細
    borderLeftWidth:    null,         // 左框線粗細（覆蓋 borderWidth）
    borderStyle:        'solid',      // 全邊框樣式（solid|dashed|dotted|double|groove|ridge|inset|outset）
    borderTopStyle:     null,         // 上框線樣式
    borderRightStyle:   null,         // 右框線樣式
    borderBottomStyle:  null,         // 下框線樣式
    borderLeftStyle:    null,         // 左框線樣式

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
    cascadeInterval:    0,            // 0 = 不啟用，由 next 屬性鏈結

    /* ── 按鈕尺寸（開始 / 重設共用，可被個別覆蓋） ─── */
    btnWidth:           null,         // 共用寬度
    btnHeight:          null,         // 共用高度
    btnFontSize:        null,         // 共用字體大小
    btnPadding:         null,         // 共用 padding
    startBtnWidth:      null,         // 開始按鈕寬度
    startBtnHeight:     null,         // 開始按鈕高度
    startBtnFontSize:   null,         // 開始按鈕字體大小
    startBtnPadding:    null,         // 開始按鈕 padding
    resetBtnWidth:      null,         // 重設按鈕寬度
    resetBtnHeight:     null,         // 重設按鈕高度
    resetBtnFontSize:   null,         // 重設按鈕字體大小
    resetBtnPadding:    null,         // 重設按鈕 padding
  };

  window.InfoRegionConfig = Object.assign({}, defaults, window.InfoRegionConfig || {});

  let _stylesInjected = false;

  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;

    const cfg = window.InfoRegionConfig;
    const vDur = cfg.animDuration + 'ms';
    const hDur = cfg.horizontalAnimDur + 'ms';
    const defaultBorderColor = BrandColors[cfg.defaultColor] || BrandColors.sky;

    // 色彩 variants（保留，inline-style 會覆蓋，但 CSS 提供無 JS 降級）
    const irColorVariants = Object.entries(BrandColors)
      .filter(([n]) => n !== 'bg' && n !== 'region')
      .map(([name, hex]) =>
        `info-region[active="true"][color="${name}"] { border-left-color: ${hex}; }`
      ).join('\n      ');

    const btnColorVariants = Object.entries(BrandColors)
      .filter(([n]) => n !== 'bg' && n !== 'region')
      .map(([name, hex]) => `
        .ir-btn--${name} { border-color: ${hex}; color: ${hex}; }
        .ir-btn--${name}:hover { background: ${hex}22; }
      `).join('\n      ');

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
        border-left-color: ${defaultBorderColor};
      }

      /* 邊框色 variants */
      ${irColorVariants}

      info-region-group[layout="horizontal"] info-region {
        max-height: none;
        overflow: visible;
        transform: translateX(-8px);
        padding: ${cfg.padding};
        flex: 1;
        transition:
          opacity   ${hDur} ease,
          transform ${hDur} ease;
        margin-bottom: 0;
      }

      info-region-group[layout="horizontal"] info-region[active="true"] {
        max-height: none;
        transform: translateX(0);
        margin-bottom: 0;
      }

      .ir-col {
        display: flex;
        flex-direction: column;
      }

      .ir-countdown-bar {
        position: absolute;
        left: 0;
        width: 100%;
        transform-origin: left center;
        transform: scaleX(1);
        pointer-events: none;
        border-radius: 0 2px 2px 0;
      }

      .ir-manual-wrap {
        display: flex;
        margin-top: 14px;
      }

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

      /* ── 群組容器 ────────────────────────────────────────────────────── */
      info-region-group { display: block; }

      /* ── 群組控制列 ─────────────────────────────────────────────────── */
      .ir-controls {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      /* ── 按鈕基礎樣式 ───────────────────────────────────────────────── */
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

      /* 品牌色按鈕 variants */
      ${btnColorVariants}

      /* ── 全體進度條 ──────────────────────────────────────────────────── */
      .ir-global-progress-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }

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

      /* ── info-region 內 heading / p 繼承色彩 ────────────────────────── */
      info-region h1, info-region h2, info-region h3,
      info-region h4, info-region h5, info-region h6 {
        color: inherit;
        margin-bottom: 6px;
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
      injectStyles();
      if (this.getAttribute('active') === 'true') {
        requestAnimationFrame(() => this._onActivated());
      }
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'active') {
        if (newVal === 'true' && oldVal !== 'true') {
          this._onActivated();
        }
      } else if (this.getAttribute('active') === 'true') {
        // color 或 border-* 變更時，在啟用狀態下即時更新
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
    /*
     * 屬性優先順序（高→低）：
     *   元素的 border-{side}-width  >  元素的 border-width  >
     *   InfoRegionConfig.border{Side}Width  >  InfoRegionConfig.borderAllWidth  >
     *   左側預設 cfg.borderWidth，其他側預設 0
     *
     * 樣式（style）同理：
     *   border-{side}-style  >  border-style  >
     *   cfg.border{Side}Style  >  cfg.borderStyle  >  'solid'
     */
    _applyBorderStyles() {
      const cfg       = window.InfoRegionConfig;
      const colorName = this.getAttribute('color') || cfg.defaultColor;
      const colorHex  = BrandColors[colorName] || BrandColors.sky;

      const attrAllW = this.getAttribute('border-width');
      const attrAllS = this.getAttribute('border-style');

      ['top', 'right', 'bottom', 'left'].forEach(side => {
        const C    = cap(side);           // 'Top' / 'Right' / 'Bottom' / 'Left'
        const prop = 'border' + C;        // 'borderTop' etc.

        /* Width */
        const attrW = this.getAttribute(`border-${side}-width`) != null
                    ? this.getAttribute(`border-${side}-width`)
                    : attrAllW;

        let cfgW = cfg[`border${C}Width`] != null
                 ? cfg[`border${C}Width`]
                 : cfg.borderAllWidth != null
                   ? cfg.borderAllWidth
                   : (side === 'left' ? cfg.borderWidth : 0);

        const w = attrW != null ? (parseInt(attrW, 10) || 0) : (parseInt(cfgW, 10) || 0);

        /* Style */
        const attrS = this.getAttribute(`border-${side}-style`) != null
                    ? this.getAttribute(`border-${side}-style`)
                    : attrAllS;

        const s = attrS
               || cfg[`border${C}Style`]
               || cfg.borderStyle
               || 'solid';

        /* Apply inline */
        this.style[`${prop}Width`] = w + 'px';
        this.style[`${prop}Style`] = w > 0 ? s : 'none';
        this.style[`${prop}Color`] = w > 0 ? colorHex : 'transparent';
      });
    }

    /* ── 框線樣式清除（reset 時呼叫） ────────────────────────────── */
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
      setTimeout(() => this._build(), 0);
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
        setTimeout(() => this._start(), 0);
      }
    }

    /* ── 水平佈局 ─────────────────────────────────────────────────── */
    _setupLayout() {
      if (this.getAttribute('layout') !== 'horizontal') return;

      const children = Array.from(this.querySelectorAll(':scope > info-region'));
      if (children.length === 0) return;

      const colClass = this.getAttribute('col-class') || this._autoColClass(children.length);
      const gutter   = this.getAttribute('gutter') || 'g-3';

      const row = document.createElement('div');
      row.className = `row ${gutter} align-items-stretch`;

      children.forEach(child => {
        const col = document.createElement('div');
        col.className = `ir-col ${colClass}`;
        this.removeChild(child);
        col.appendChild(child);
        row.appendChild(col);
      });

      this.appendChild(row);
    }

    _autoColClass(count) {
      if (count <= 2) return 'col-md-6 col-12';
      if (count === 3) return 'col-md-4 col-sm-6 col-12';
      if (count === 4) return 'col-md-3 col-sm-6 col-12';
      if (count === 6) return 'col-md-2 col-sm-4 col-12';
      return 'col-md col-sm-6 col-12';
    }

    /* ── 控制按鈕 ─────────────────────────────────────────────────── */
    /*
     * 按鈕尺寸屬性（在 info-region-group 上設定）：
     *
     * 共用（開始與重設同時套用）：
     *   btn-width="120px"   btn-height="36px"
     *   btn-font-size="1rem"  btn-padding="8px 24px"
     *
     * 個別（覆蓋共用值）：
     *   start-width  start-height  start-font-size  start-padding
     *   reset-width  reset-height  reset-font-size  reset-padding
     *
     * 亦可在 InfoRegionConfig 全域設定對應駝峰式鍵值，例如：
     *   window.InfoRegionConfig.startBtnWidth = '120px';
     */
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

    /*
     * 套用按鈕尺寸樣式。
     * prefix = 'start' 或 'reset'
     * 解析順序：元素個別屬性 > 元素共用屬性 > 個別 cfg > 共用 cfg
     */
    _applyBtnStyles(btn, prefix) {
      const cfg = window.InfoRegionConfig;
      const cfgPrefix = prefix + 'Btn';   // 'startBtn' | 'resetBtn'

      // resolve(attrName, cfgKey, fallbackAttr, fallbackCfgKey)
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

      const width    = resolve(
        `${prefix}-width`,     `${cfgPrefix}Width`,
        'btn-width',           'btnWidth'
      );
      const height   = resolve(
        `${prefix}-height`,    `${cfgPrefix}Height`,
        'btn-height',          'btnHeight'
      );
      const fontSize = resolve(
        `${prefix}-font-size`, `${cfgPrefix}FontSize`,
        'btn-font-size',       'btnFontSize'
      );
      const padding  = resolve(
        `${prefix}-padding`,   `${cfgPrefix}Padding`,
        'btn-padding',         'btnPadding'
      );

      if (width)    btn.style.width    = addUnit(width, 'px');
      if (height)   btn.style.height   = addUnit(height, 'px');
      if (fontSize) btn.style.fontSize = addUnit(fontSize, 'rem');
      if (padding)  btn.style.padding  = padding;   // padding 必須自帶單位
    }

    /* ── 全體進度條 ───────────────────────────────────────────────── */
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

    /* ── MutationObserver ─────────────────────────────────────────── */
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

    /* ── 開始 / 重設 ──────────────────────────────────────────────── */
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
  customElements.define('info-region', InfoRegion);
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

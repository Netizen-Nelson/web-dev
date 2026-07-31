(function () {
  'use strict';

  const cap     = s => s.charAt(0).toUpperCase() + s.slice(1);
  const addUnit = (val, unit) => {
    if (!val) return null;
    if (/[a-z%]$/i.test(String(val))) return String(val);
    return val + unit;
  };

  const BrandColors = {
    bg:       '#0C0D0C',
    region:   '#333333',
    shell:    '#C6C7BD',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#08A9D1',
    safe:     '#40C99A',
    vanilla:  '#DBEDD8',
    yellow:   '#DECA4B',
    focus:    '#A0CF72',
    info:     '#4285EB',
    stone:    '#95BDD7',
    indigo:   '#7B6CF0',
    pink:     '#FFB3D9',
    orange:   '#EDA109',
  };

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
    // ── 測驗模式新增預設值 ─────────────────────────────
    quizRevealLabel:   '👁 揭曉答案',
    quizRevealColor:   null,      // null = 繼承 region color
    quizOkLabel:       '✓ 記住了',
    quizRetryLabel:    '↺ 再看一次',
    quizOkColor:       'safe',
    quizRetryColor:    'warning',
    quizContinueLabel: '▶ 繼續',
    quizCompleteTitle: '🎉 測驗完成！',
  };

  window.InfoRegionConfig = Object.assign({}, defaults, window.InfoRegionConfig || {});

  // ── 樣式注入 ───────────────────────────────────────────

  let _stylesInjected = false;

  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;

    const cfg = window.InfoRegionConfig;
    const vDur = cfg.animDuration + 'ms';
    const hDur = cfg.horizontalAnimDur + 'ms';
    const defaultBorderColor = BrandColors[cfg.defaultColor] || BrandColors.sky;

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
        min-height: 0;
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
      .ir-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      ${btnColorVariants}

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

      info-region h1, info-region h2, info-region h3,
      info-region h4, info-region h5, info-region h6 {
        color: inherit;
        margin-bottom: 6px;
        margin-top: 0;
      }

      info-region p  { margin-top: 0; margin-bottom: 4px; }
      info-region p:last-child { margin-bottom: 0; }
      info-region ul, info-region ol { margin-top: 0; padding-left: 18px; }
      info-region li { margin-bottom: 3px; }

      /* ═══════════════════════════════════════════════
         測驗模式 (Quiz Mode)
         ═══════════════════════════════════════════════ */

      /* data-ir-ans：在 quiz region 裡預設收合 */
      info-region[quiz] [data-ir-ans] {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        margin-top: 0;
        padding-top: 0;
        border-top: 0px solid #4a4b4a;
        transition:
          max-height  0.4s cubic-bezier(.4, 0, .2, 1),
          opacity     0.35s ease,
          margin-top  0.3s ease,
          padding-top 0.3s ease;
      }

      /* quiz-mode group 內的 region 也適用相同規則 */
      info-region-group[quiz-mode] info-region [data-ir-ans] {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        margin-top: 0;
        padding-top: 0;
        border-top: 0px solid #4a4b4a;
        transition:
          max-height  0.4s cubic-bezier(.4, 0, .2, 1),
          opacity     0.35s ease,
          margin-top  0.3s ease,
          padding-top 0.3s ease;
      }

      /* 揭曉後展開 */
      info-region [data-ir-ans].ir-ans-revealed {
        max-height: 2000px;
        opacity: 1;
        margin-top: 14px;
        padding-top: 14px;
        border-top-width: 1px;
      }

      /* 測驗按鈕列 */
      .ir-quiz-wrap {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 14px;
        animation: ir-manual-in 0.25s ease forwards;
      }

      /* 題號標籤 */
      .ir-quiz-label {
        font-size: 0.7rem;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 6px;
      }

      /* 得分顯示 */
      .ir-quiz-score {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-family: 'Space Mono', monospace;
        font-size: 0.8rem;
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid ${BrandColors.safe};
        color: ${BrandColors.safe};
        white-space: nowrap;
        margin-bottom: 14px;
      }

      .ir-quiz-score-num {
        font-size: 1rem;
        font-weight: 700;
      }

      /* 完成訊息框 */
      .ir-quiz-complete {
        padding: 24px 28px;
        border-radius: 10px;
        background: #1a1b1a;
        border: 1px solid #3a3b3a;
        margin-top: 18px;
        text-align: center;
        animation: ir-manual-in 0.35s ease forwards;
      }

      .ir-quiz-complete-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: ${BrandColors.special};
        margin-bottom: 10px;
      }

      .ir-quiz-complete-detail {
        font-size: 0.88rem;
        color: ${BrandColors.shell};
        opacity: 0.85;
        line-height: 1.8;
        margin-bottom: 18px;
      }

      .ir-quiz-complete-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }

      /* answered 狀態視覺 (quiz-keep-all 時使用) */
      info-region[data-ir-answered="ok"] {
        border-left-color: ${BrandColors.safe} !important;
        opacity: 0.75;
      }
      info-region[data-ir-answered="retry"] {
        border-left-color: ${BrandColors.warning} !important;
        opacity: 0.75;
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'info-region-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ══════════════════════════════════════════════════════
  //  InfoRegion
  // ══════════════════════════════════════════════════════

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
        this._applyBorderStyles();
      }
    }

    // ── 啟動時行為判斷 ───────────────────────────────────

    _onActivated() {
      this._applyBorderStyles();

      // 測驗模式優先於所有其他行為
      if (this.hasAttribute('quiz') || this._isInQuizGroup()) {
        this._insertQuizUI();
        return;
      }

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

    _isInQuizGroup() {
      const g = this.closest('info-region-group');
      return g && g.hasAttribute('quiz-mode');
    }

    // ── 測驗 UI ──────────────────────────────────────────

    /**
     * 啟動時插入測驗互動列：
     *   - 有 [data-ir-ans] → 「揭曉答案」按鈕
     *   - 無               → 「繼續」按鈕（純說明型 region）
     */
    _insertQuizUI() {
      if (this.querySelector('.ir-quiz-wrap')) return;

      const cfg       = window.InfoRegionConfig;
      const colorName = this.getAttribute('color') || cfg.defaultColor;
      const ansEl     = this.querySelector('[data-ir-ans]');

      const wrap = document.createElement('div');
      wrap.className = 'ir-quiz-wrap';

      if (ansEl) {
        const revealColor = this.getAttribute('quiz-reveal-color')
                         || cfg.quizRevealColor
                         || colorName;
        const revealLabel = this.getAttribute('quiz-reveal-label') || cfg.quizRevealLabel;

        const btn = document.createElement('button');
        btn.className = `ir-btn ir-btn--${revealColor}`;
        btn.textContent = revealLabel;
        btn.addEventListener('click', () => this._revealAnswer(wrap, ansEl), { once: true });
        wrap.appendChild(btn);
      } else {
        const continueColor = this.getAttribute('quiz-reveal-color')
                           || cfg.quizRevealColor
                           || colorName;
        const continueLabel = this.getAttribute('quiz-continue-label') || cfg.quizContinueLabel;

        const btn = document.createElement('button');
        btn.className = `ir-btn ir-btn--${continueColor}`;
        btn.textContent = continueLabel;
        btn.addEventListener('click', () => {
          wrap.remove();
          this._onQuizAnswer(true);
        }, { once: true });
        wrap.appendChild(btn);
      }

      this.appendChild(wrap);
    }

    /**
     * 展開答案後，將「揭曉」按鈕換成「記住了」/「再看一次」
     */
    _revealAnswer(wrap, ansEl) {
      ansEl.classList.add('ir-ans-revealed');

      const cfg        = window.InfoRegionConfig;
      const okLabel    = this.getAttribute('quiz-ok-label')    || cfg.quizOkLabel;
      const retryLabel = this.getAttribute('quiz-retry-label') || cfg.quizRetryLabel;
      const okColor    = this.getAttribute('quiz-ok-color')    || cfg.quizOkColor;
      const retryColor = this.getAttribute('quiz-retry-color') || cfg.quizRetryColor;

      wrap.innerHTML = '';

      const okBtn = document.createElement('button');
      okBtn.className = `ir-btn ir-btn--${okColor}`;
      okBtn.textContent = okLabel;

      const retryBtn = document.createElement('button');
      retryBtn.className = `ir-btn ir-btn--${retryColor}`;
      retryBtn.textContent = retryLabel;

      // ✓ 記住了：推進下一題
      okBtn.addEventListener('click', () => {
        okBtn.disabled = true;
        retryBtn.disabled = true;
        wrap.remove();
        this._onQuizAnswer(true);
      }, { once: true });

      // ↺ 再看一次：收合答案，恢復「揭曉答案」按鈕，不推進
      retryBtn.addEventListener('click', () => {
        okBtn.disabled = true;
        retryBtn.disabled = true;

        // 收合答案（觸發 CSS transition）
        ansEl.classList.remove('ir-ans-revealed');

        // 等收合動畫結束後換回揭曉按鈕
        setTimeout(() => {
          if (!wrap.isConnected) return;
          wrap.innerHTML = '';

          const colorName   = this.getAttribute('color') || cfg.defaultColor;
          const revealColor = this.getAttribute('quiz-reveal-color')
                           || cfg.quizRevealColor
                           || colorName;
          const revealLabel = this.getAttribute('quiz-reveal-label') || cfg.quizRevealLabel;

          const newRevealBtn = document.createElement('button');
          newRevealBtn.className = `ir-btn ir-btn--${revealColor}`;
          newRevealBtn.textContent = revealLabel;
          newRevealBtn.addEventListener('click',
            () => this._revealAnswer(wrap, ansEl), { once: true }
          );
          wrap.appendChild(newRevealBtn);
        }, 380); // 配合 CSS transition 0.4s
      }, { once: true });

      wrap.append(okBtn, retryBtn);
    }

    /**
     * 使用者作答後：
     *   - 通知所屬 quiz-mode group（若有）
     *   - 否則退化為普通 next 鏈
     */
    _onQuizAnswer(correct) {
      this.setAttribute('data-ir-answered', correct ? 'ok' : 'retry');

      const group = this.closest('info-region-group[quiz-mode]');
      if (group) {
        group._onQuizAnswer(this, correct);
      } else {
        // 獨立 quiz region：直接觸發 next
        this._triggerNext(0);
      }
    }

    // ── 邊框 ─────────────────────────────────────────────

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

        const s = attrS || cfg[`border${C}Style`] || cfg.borderStyle || 'solid';

        this.style[`${prop}Width`] = w + 'px';
        this.style[`${prop}Style`] = w > 0 ? s : 'none';
        this.style[`${prop}Color`] = w > 0 ? colorHex : 'transparent';
      });
    }

    _clearBorderStyles() {
      ['top', 'right', 'bottom', 'left'].forEach(side => {
        const prop = 'border' + cap(side);
        this.style[`${prop}Width`] = '';
        this.style[`${prop}Style`] = '';
        this.style[`${prop}Color`] = '';
      });
    }

    // ── 手動推進 ─────────────────────────────────────────

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

    // ── 倒數計時 ─────────────────────────────────────────

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

    // ── next 鏈結 ─────────────────────────────────────────

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

    // ── 公開 API ─────────────────────────────────────────

    activate() { this.setAttribute('active', 'true'); }

    /**
     * 停用（保留 answered 狀態與答案揭曉狀態）
     * 由 quiz-mode group 在跳題時呼叫
     */
    deactivate() {
      this.removeAttribute('active');
      this._clearBorderStyles();
      const qwrap = this.querySelector('.ir-quiz-wrap');
      const mwrap = this.querySelector('.ir-manual-wrap');
      const bar   = this.querySelector('.ir-countdown-bar');
      if (qwrap) qwrap.remove();
      if (mwrap) mwrap.remove();
      if (bar)   bar.remove();
      // 刻意保留 [data-ir-ans].ir-ans-revealed 和 data-ir-answered
    }

    /**
     * 完全重設，清除所有狀態
     */
    reset() {
      this.removeAttribute('active');
      this.removeAttribute('data-ir-answered');
      this._clearBorderStyles();
      const bar   = this.querySelector('.ir-countdown-bar');
      const mwrap = this.querySelector('.ir-manual-wrap');
      const qwrap = this.querySelector('.ir-quiz-wrap');
      const ans   = this.querySelector('[data-ir-ans]');
      if (bar)   bar.remove();
      if (mwrap) mwrap.remove();
      if (qwrap) qwrap.remove();
      if (ans)   ans.classList.remove('ir-ans-revealed');
    }
  }

  // ══════════════════════════════════════════════════════
  //  InfoRegionGroup
  // ══════════════════════════════════════════════════════

  class InfoRegionGroup extends HTMLElement {
    constructor() {
      super();
      this._progressBar    = null;
      this._percentEl      = null;
      this._observer       = null;
      // 測驗狀態
      this._quizQueue      = [];
      this._quizIndex      = 0;
      this._quizScore      = 0;
      this._quizAnswered   = 0;
      this._quizScoreEl    = null;
      this._quizCompleteEl = null;
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
      if (this.hasAttribute('quiz-mode') && this.hasAttribute('quiz-score')) {
        this._setupQuizScore();
      }
      if (this.hasAttribute('auto-start')) {
        setTimeout(() => this._start(), 0);
      }
    }

    // ── 排版 ─────────────────────────────────────────────

    _setupLayout() {
      if (this.getAttribute('layout') !== 'horizontal') return;

      const children = Array.from(this.querySelectorAll(':scope > info-region'));
      if (children.length === 0) return;

      const cfg      = window.InfoRegionConfig;
      const perRow   = parseInt(this.getAttribute('cols-per-row'), 10) || cfg.colsPerRow || 4;
      const colClass = this.getAttribute('col-class') || this._autoColClass(perRow);
      const gutter   = this.getAttribute('gutter')    || 'g-3';
      const rowGap   = this.getAttribute('row-gap')   || '16px';

      children.forEach(child => this.removeChild(child));

      for (let i = 0; i < children.length; i += perRow) {
        const chunk = children.slice(i, i + perRow);
        const row   = document.createElement('div');
        row.className = `row ${gutter} align-items-stretch`;
        if (i > 0) row.style.marginTop = rowGap;

        chunk.forEach(child => {
          const col = document.createElement('div');
          col.className = `ir-col ${colClass}`;
          col.appendChild(child);
          row.appendChild(col);
        });

        this.appendChild(row);
      }
    }

    _autoColClass(perRow) {
      if (perRow === 1) return 'col-12';
      if (perRow === 2) return 'col-md-6 col-12';
      if (perRow === 3) return 'col-md-4 col-sm-6 col-12';
      if (perRow === 4) return 'col-md-3 col-sm-6 col-12';
      if (perRow === 6) return 'col-md-2 col-sm-4 col-12';
      return 'col-md col-sm-6 col-12';
    }

    // ── 控制列 ───────────────────────────────────────────

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
      const cfg       = window.InfoRegionConfig;
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

    // ── 全域進度條 ───────────────────────────────────────

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

    _setupObserver() {
      this._observer = new MutationObserver(() => this._updateProgress());
      this._getChildren().forEach(child => {
        this._observer.observe(child, { attributes: true, attributeFilter: ['active'] });
      });
    }

    /**
     * 進度更新：
     *   - 測驗模式：用已作答題數 / 總題數（避免 deactivate 讓進度倒退）
     *   - 一般模式：用 active="true" 的數量
     */
    _updateProgress() {
      if (!this._progressBar) return;

      let ratio;
      if (this.hasAttribute('quiz-mode') && this._quizQueue.length > 0) {
        ratio = this._quizAnswered / this._quizQueue.length;
      } else {
        const children  = this._getChildren();
        const total     = children.length;
        const activated = children.filter(el => el.getAttribute('active') === 'true').length;
        ratio = total > 0 ? activated / total : 0;
      }

      this._progressBar.style.transform = `scaleX(${ratio})`;

      if (this._percentEl) {
        this._percentEl.textContent = Math.round(ratio * 100) + '%';
        this._percentEl.style.opacity = ratio > 0 ? '1' : '0';
      }
    }
	
    _setupQuizScore() {
      const el = document.createElement('div');
      el.className = 'ir-quiz-score';
      el.innerHTML = '<span class="ir-quiz-score-num">0 / 0</span>';
      this._quizScoreEl = el;

      const controls = this.querySelector('.ir-controls');
      if (controls) controls.insertAdjacentElement('afterend', el);
      else          this.insertBefore(el, this.firstChild);
    }

    _updateQuizScore() {
      if (!this._quizScoreEl) return;
      const total = this._quizQueue.length;
      const answered = this._quizAnswered;
      const pct = answered > 0 ? Math.round(this._quizScore / answered * 100) : 0;
      const remaining = total - answered;

      this._quizScoreEl.innerHTML =
        `✓ <span class="ir-quiz-score-num">${this._quizScore}</span>` +
        ` / ${answered} 題答對` +
        (answered > 0 ? `（${pct}%）` : '') +
        (remaining > 0 ? `　剩 ${remaining} 題` : '');
    }
	
    _start() {
      this._reset(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this._progressBar) {
            this._progressBar.style.transition =
              `transform ${window.InfoRegionConfig.progressTransition}ms ease`;
          }

          if (this.hasAttribute('quiz-mode')) {
            this._startQuiz();
            return;
          }

          const children  = this._getChildren();
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

    _startQuiz(queue = null) {
      if (this._quizCompleteEl) {
        this._quizCompleteEl.remove();
        this._quizCompleteEl = null;
      }

      let children = queue || this._getChildren();

      // 洗牌（只在非複習輪次執行）
      if (!queue && this.hasAttribute('quiz-shuffle')) {
        children = [...children];
        for (let i = children.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [children[i], children[j]] = [children[j], children[i]];
        }
      }

      this._quizQueue  = children;
      this._quizIndex  = 0;

      if (children.length > 0) children[0].activate();
    }

    _onQuizAnswer(region, correct) {
      if (correct) this._quizScore++;
      this._quizAnswered++;
      this._updateQuizScore();
      this._updateProgress();

      if (!this.hasAttribute('quiz-keep-all')) {
        region.deactivate();
      }

      this._quizIndex++;

      if (this._quizIndex < this._quizQueue.length) {
        const delay = this.hasAttribute('quiz-keep-all') ? 300 : 160;
        setTimeout(() => this._quizQueue[this._quizIndex].activate(), delay);
      } else {
        setTimeout(() => this._onQuizComplete(), 420);
      }
    }

    _onQuizComplete() {
      const total   = this._quizQueue.length;
      const correct = this._quizScore;
      const pct     = total > 0 ? Math.round(correct / total * 100) : 0;
      const retryList = this._quizQueue.filter(r =>
        r.getAttribute('data-ir-answered') === 'retry'
      );

      const cfg   = window.InfoRegionConfig;
      const title = this.getAttribute('quiz-complete-title') || cfg.quizCompleteTitle;

      const box = document.createElement('div');
      box.className = 'ir-quiz-complete';
      this._quizCompleteEl = box;

      const titleEl = document.createElement('div');
      titleEl.className = 'ir-quiz-complete-title';
      titleEl.textContent = title;

      const detailEl = document.createElement('div');
      detailEl.className = 'ir-quiz-complete-detail';
      detailEl.innerHTML =
        `答對 <strong style="color:${BrandColors.safe}">${correct}</strong> 題，` +
        `共 <strong>${total}</strong> 題（正確率 ${pct}%）` +
        (retryList.length > 0
          ? `<br>尚有 <strong style="color:${BrandColors.warning}">${retryList.length}</strong> 題標記為「再看一次」`
          : `<br><span style="color:${BrandColors.special}">全部答對，太厲害了！</span>`);

      const actionsEl = document.createElement('div');
      actionsEl.className = 'ir-quiz-complete-actions';

      const restartBtn = document.createElement('button');
      restartBtn.className = 'ir-btn ir-btn--sky';
      restartBtn.textContent = '↺ 重新開始';
      restartBtn.addEventListener('click', () => {
        this._getChildren().forEach(el => el.reset());
        this._quizScore    = 0;
        this._quizAnswered = 0;
        this._updateQuizScore();
        this._updateProgress();
        this._startQuiz();
      });
      actionsEl.appendChild(restartBtn);

      if (retryList.length > 0 && this.hasAttribute('quiz-retry-at-end')) {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'ir-btn ir-btn--warning';
        retryBtn.textContent = `↺ 只複習 ${retryList.length} 題`;
        retryBtn.addEventListener('click', () => {
          retryList.forEach(el => el.reset());
          this._quizScore    = 0;
          this._quizAnswered = 0;
          this._updateQuizScore();
          this._updateProgress();
          this._startQuiz(retryList);
        });
        actionsEl.appendChild(retryBtn);
      }

      box.append(titleEl, detailEl, actionsEl);

      const progressWrap = this.querySelector('.ir-global-progress-wrap');
      if (progressWrap) progressWrap.insertAdjacentElement('afterend', box);
      else              this.appendChild(box);
    }

    _reset(reenableTransition = true) {
      this._getChildren().forEach(el => el.reset());

      this._quizQueue    = [];
      this._quizIndex    = 0;
      this._quizScore    = 0;
      this._quizAnswered = 0;
      this._updateQuizScore();

      if (this._quizCompleteEl) {
        this._quizCompleteEl.remove();
        this._quizCompleteEl = null;
      }

      if (this._progressBar) {
        this._progressBar.style.transition = 'none';
        this._progressBar.style.transform  = 'scaleX(0)';
        if (reenableTransition) {
          requestAnimationFrame(() => {
            if (this._progressBar) {
              this._progressBar.style.transition =
                `transform ${window.InfoRegionConfig.progressTransition}ms ease`;
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

  customElements.define('info-region', InfoRegion);
  customElements.define('info-region-group', InfoRegionGroup);

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
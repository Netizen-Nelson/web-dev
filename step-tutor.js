/**
 * StepTutor v2.0
 * 步驟鏈教學元件，支援 manual / auto / auto-pausable 混合模式
 * 僅適用於寬螢幕教學與展示場景
 */

class StepTutor {

    // ─── 色票常數（統一維護） ────────────────────────────────────────
    static COLORS = {
        shell:     '#c6c7bd',
        lavender:  '#C3A5E5',
        special:   '#C8DD5A',
        warning:   '#F08080',
        salmon:    '#E5C3B3',
        sky:       '#08a9d1',
        safe:      '#40c99a',
        yellow:    '#DECA4B',
        info:      '#5fafed',
        stone:     '#7090A8',
        pink:      '#FFB3D9',
        orange:    '#eda109',
    };

    static GRADIENTS = {
        'special-sky':      'linear-gradient(90deg, #C8DD5A 0%, #08a9d1 100%)',
        'lavender-pink':    'linear-gradient(90deg, #C3A5E5 0%, #FFB3D9 100%)',
        'warning-orange':   'linear-gradient(90deg, #F08080 0%, #eda109 100%)',
        'safe-sky':         'linear-gradient(90deg, #40c99a 0%, #08a9d1 100%)',
        'yellow-safe':      'linear-gradient(90deg, #DECA4B 0%, #40c99a 100%)',
        'yellow-special':   'linear-gradient(90deg, #DECA4B 0%, #C8DD5A 100%)',
        'yellow-orange':    'linear-gradient(90deg, #DECA4B 0%, #eda109 100%)',
        'yellow-sky':       'linear-gradient(90deg, #DECA4B 0%, #08a9d1 100%)',
    };

    static resolveColor(value) {
        if (!value) return null;
        return StepTutor.COLORS[value] || value;
    }

    static resolveGradient(value) {
        if (!value) return null;
        return StepTutor.GRADIENTS[value] || value;
    }

    // ─── 建構子 ────────────────────────────────────────────────────
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`[StepTutor] 找不到容器: ${containerId}`);
            return;
        }

        this.options = this._mergeOptions(options);

        // 狀態
        this.currentStep   = 0;
        this.totalSteps    = 0;
        this.steps         = [];
        this.isPaused      = false;
        this._autoTimer    = null;
        this._countdownRAF = null;
        this._countdownStart = null;
        this._countdownDuration = 0;

        // DOM 參照
        this.stepContainer   = null;
        this.button          = null;
        this.pauseButton     = null;
        this.restartButton   = null;
        this.progressDisplay = null;
        this.progressBar     = null;
        this.progressBarFill = null;
        this.targetElements  = new Map();
        this.topSlot         = null;
        this.bottomSlot      = null;

        this._init();
    }

    // ─── 選項合併（分組結構） ────────────────────────────────────────
    _mergeOptions(o) {
        const rc = StepTutor.resolveColor.bind(StepTutor);
        const rg = StepTutor.resolveGradient.bind(StepTutor);

        return {
            // 步驟外觀
            step: {
                bgColor:      rc(o.stepBgColor)      || 'rgba(200,221,90,0.07)',
                borderColor:  rc(o.stepBorderColor)  || StepTutor.COLORS.special,
                textColor:    rc(o.stepTextColor)     || '#F0F0F0',
                padding:      o.stepPadding           || '14px 18px',
                margin:       o.stepMargin            || '6px 0',
                borderPos:    o.borderPosition        || 'left',
                borderWidth:  o.borderWidth           || '3px',
                borderStyle:  o.borderStyle           || 'solid',
                highlightColor: rc(o.highlightColor)  || StepTutor.COLORS.lavender,
                animDuration: o.animationDuration     || '0.35s',
                // 目前步驟 active 標示
                activeBorderColor:  rc(o.activeBorderColor)  || StepTutor.COLORS.yellow,
                activeBorderWidth:  o.activeBorderWidth       || '3px',
                activeBgColor:      rc(o.activeBgColor)       || 'rgba(222,202,75,0.10)',
                activeGlow:         o.activeGlow !== false,
            },
            // 指示器
            indicator: {
                show:         o.showIndicator !== false,
                format:       o.indicatorFormat       || '步驟 {current}',
                showTotal:    o.showTotalSteps !== false,
                bgColor:      null, // 由 button.theme 決定，見 _init
                textColor:    rc(o.indicatorTextColor) || '#1C1C1E',
                fontSize:     o.indicatorFontSize      || '0.78rem',
                borderRadius: o.indicatorBorderRadius  || '4px',
                padding:      o.indicatorPadding       || '3px 8px',
                marginBottom: o.indicatorMarginBottom  || '8px',
            },
            // 按鈕
            button: {
                text:         o.buttonText             || '顯示下一步',
                completeText: o.buttonCompleteText     || '所有步驟已顯示',
                skipText:     o.buttonSkipText         || '跳過等待',
                pauseText:    o.buttonPauseText        || '暫停',
                resumeText:   o.buttonResumeText       || '繼續',
                theme:        o.buttonTheme            || 'special',
                size:         o.buttonSize             || 'large',
                // 層次二：精細 override（有設定就覆蓋 size 預設值）
                paddingX:     o.buttonPaddingX         || null,
                paddingY:     o.buttonPaddingY         || null,
                fontSize:     o.buttonFontSize         || null,
            },
            // 進度文字
            progress: {
                show:     o.showProgress !== false,
                text:     o.progressText      || '已顯示步驟 {current} / {total}',
                fontSize: o.progressFontSize  || '0.875rem',
                position: o.progressPosition  || 'bottom',
            },
            // 進度條
            progressBar: {
                show:         o.showProgressBar       || false,
                height:       o.progressBarHeight     || '20px',
                bgColor:      rc(o.progressBarBgColor)  || '#1a1b1a',
                gradient:     rg(o.progressBarGradient) || rg('special-sky'),
                borderWidth:  o.progressBarBorderWidth || '1px',
                borderColor:  rc(o.progressBarBorderColor) || StepTutor.COLORS.stone,
                borderRadius: o.progressBarBorderRadius || '4px',
                padding:      o.progressBarPadding    || '4px 8px',
                textFontSize: o.progressBarTextFontSize   || '0.75rem',
                textFontWeight: o.progressBarTextFontWeight || 'bold',
                textColor:    rc(o.progressBarTextColor) || null,
            },
            // 倒數條（每個 auto 步驟的附屬倒數進度條）
            countdown: {
                height:   o.countdownHeight   || '3px',
                color:    rc(o.countdownColor) || StepTutor.COLORS.sky,
                position: o.countdownPosition || 'bottom', // 'top' | 'bottom'
            },
            // 滾動
            scroll: {
                auto:   o.autoScroll !== false,
                offset: o.scrollOffset || 80,
            },
            // 目標渲染
            target: {
                mode:         o.targetMode         || 'replace',
                clearOnReset: o.targetClearOnReset !== false,
            },
            // 步驟鏈行為
            chain: {
                defaultAdvance: o.defaultAdvance || 'manual', // 'manual' | 'auto' | 'auto-pausable'
                defaultDelay:   o.defaultDelay   || 3,        // 秒
                restart:        o.restart !== false,
                contentPosition: o.contentPosition || 'top',
            },
            // 回調
            callbacks: {
                onStepRevealed: o.onStepRevealed || null,
                onAllRevealed:  o.onAllRevealed  || null,
                onReset:        o.onReset        || null,
                onPause:        o.onPause        || null,
                onResume:       o.onResume       || null,
            },
            // 翻轉卡片
            fc: {
                defaultColor: o.fcColor || 'yellow',
            },
        };
    }

    // ─── 初始化 ─────────────────────────────────────────────────────
    _init() {
        // 讓 indicator.bgColor 跟隨 button.theme
        this.options.indicator.bgColor =
            StepTutor.COLORS[this.options.button.theme] ||
            StepTutor.COLORS.special;

        this._loadSlots();
        this._loadSteps();
        this._createStyles();
        this._createLayout();
    }

    _loadSlots() {
        ['progress-top', 'progress-bottom'].forEach(name => {
            const el = this.container.querySelector(`[data-slot="${name}"]`);
            if (!el) return;
            const clone = el.cloneNode(true);
            clone.removeAttribute('data-slot');
            el.style.display = 'none';
            if (name === 'progress-top')    this.topSlot    = clone;
            if (name === 'progress-bottom') this.bottomSlot = clone;
        });
    }

    _loadSteps() {
        const els = this.container.querySelectorAll('[data-step]');
        this.totalSteps = els.length;

        els.forEach((el, idx) => {
            const targetId  = el.getAttribute('data-step-target') || null;
            const advance   = el.getAttribute('data-advance') || this.options.chain.defaultAdvance;
            const delay     = parseFloat(el.getAttribute('data-delay'))
                              || this.options.chain.defaultDelay;

            const step = {
                index:         idx,
                number:        parseInt(el.getAttribute('data-step')) || idx + 1,
                content:       el.innerHTML,
                indicator:     el.getAttribute('data-step-indicator') || null,
                highlight:     el.getAttribute('data-step-highlight') || null,
                advance,
                delay,
                target:        targetId,
                targetElement: targetId ? document.getElementById(targetId) : null,
                // 卡片模式
                isCard:     el.hasAttribute('data-card'),
                cardTitle:  el.getAttribute('data-card-title') || el.querySelector('strong,h3,h4')?.textContent.trim() || `卡片 ${idx + 1}`,
                cardBack:   el.getAttribute('data-card-back') || null,
                cardColor:  el.getAttribute('data-card-color') || null,
            };
            this.steps.push(step);
            el.style.display = 'none';

            if (step.targetElement) {
                this.targetElements.set(idx, step.targetElement);
            }
        });
    }

    // 從陣列載入（JSON 匯入路徑）
    _loadStepsFromArray(arr) {
        this.steps = [];
        this.targetElements = new Map();
        arr.forEach((s, idx) => {
            const step = {
                index:         idx,
                number:        s.number        ?? idx + 1,
                content:       s.content       ?? '',
                indicator:     s.indicator     ?? null,
                highlight:     s.highlight     ?? null,
                advance:       s.advance       ?? this.options.chain.defaultAdvance,
                delay:         s.delay         ?? this.options.chain.defaultDelay,
                target:        s.target        ?? null,
                targetElement: s.target ? document.getElementById(s.target) : null,
                isCard:        s.isCard        ?? false,
                cardTitle:     s.cardTitle     ?? `卡片 ${idx + 1}`,
                cardBack:      s.cardBack      ?? null,
                cardColor:     s.cardColor     ?? null,
            };
            this.steps.push(step);
            if (step.targetElement) this.targetElements.set(idx, step.targetElement);
        });
        this.totalSteps = this.steps.length;
    }

    // ─── DOM 建構 ────────────────────────────────────────────────────
    _createLayout() {
        this._buildStepContainer();
        this._buildControls();

        const { contentPosition } = this.options.chain;
        const controls = this._controlsContainer;

        if (contentPosition === 'bottom') {
            this.container.appendChild(controls);
            this.container.appendChild(this.stepContainer);
        } else {
            this.container.appendChild(this.stepContainer);
            this.container.appendChild(controls);
        }

        if (this.options.progress.show)     this._updateProgressDisplay();
        if (this.options.progressBar.show)  this._updateProgressBar();
    }

    _buildControls() {
        const wrap = document.createElement('div');
        wrap.className = 'st-controls';
        this._controlsContainer = wrap;

        const { position } = this.options.progress;
        const parts = this._buildControlParts();

        // 根據 progressPosition 排列 controlParts 順序
        if (position === 'top') {
            if (this.topSlot)    wrap.appendChild(this.topSlot.cloneNode(true));
            if (parts.progressBar)  wrap.appendChild(parts.progressBar);
            if (parts.progressText) wrap.appendChild(parts.progressText);
            if (this.bottomSlot) wrap.appendChild(this.bottomSlot.cloneNode(true));
            wrap.appendChild(parts.buttonRow);
        } else {
            wrap.appendChild(parts.buttonRow);
            if (this.topSlot)    wrap.appendChild(this.topSlot.cloneNode(true));
            if (parts.progressText) wrap.appendChild(parts.progressText);
            if (parts.progressBar)  wrap.appendChild(parts.progressBar);
            if (this.bottomSlot) wrap.appendChild(this.bottomSlot.cloneNode(true));
        }
    }

    _buildControlParts() {
        // 按鈕列
        const buttonRow = document.createElement('div');
        buttonRow.className = 'st-button-row';

        // 主按鈕
        this.button = document.createElement('button');
        this.button.className = 'st-btn st-btn-main';
        this.button.textContent = this.options.button.text;
        this.button.addEventListener('click', () => this._onMainButtonClick());
        buttonRow.appendChild(this.button);

        // 暫停按鈕（先建立，根據步驟決定是否顯示）
        this.pauseButton = document.createElement('button');
        this.pauseButton.className = 'st-btn st-btn-pause';
        this.pauseButton.textContent = this.options.button.pauseText;
        this.pauseButton.style.display = 'none';
        this.pauseButton.addEventListener('click', () => this._togglePause());
        buttonRow.appendChild(this.pauseButton);

        // 重來按鈕
        if (this.options.chain.restart) {
            this.restartButton = document.createElement('button');
            this.restartButton.className = 'st-btn st-btn-restart';
            this.restartButton.innerHTML = '↻';
            this.restartButton.title = '重新開始';
            this.restartButton.style.display = 'none';
            this.restartButton.addEventListener('click', () => this.reset());
            buttonRow.appendChild(this.restartButton);
        }

        // 進度文字
        let progressText = null;
        if (this.options.progress.show) {
            progressText = document.createElement('div');
            progressText.className = 'st-progress-text';
            this.progressDisplay = progressText;
        }

        // 進度條
        let progressBar = null;
        if (this.options.progressBar.show) {
            progressBar = document.createElement('div');
            progressBar.className = 'st-progress-bar';
            const fill = document.createElement('div');
            fill.className = 'st-progress-bar-fill';
            const text = document.createElement('div');
            text.className = 'st-progress-bar-text';
            text.textContent = '0%';
            progressBar.appendChild(fill);
            progressBar.appendChild(text);
            this.progressBar = progressBar;
            this.progressBarFill = fill;
        }

        return { buttonRow, progressText, progressBar };
    }

    _buildStepContainer() {
        this.stepContainer = document.createElement('div');
        this.stepContainer.className = 'st-step-container';

        this.steps.forEach((step) => {
            if (step.target) return;

            const item = document.createElement('div');
            item.className = 'st-step-item';
            item.setAttribute('data-step-index', step.index);

            if (step.isCard) {
                item.appendChild(this._buildCardItem(step));
            } else {
                if (this.options.indicator.show) {
                    item.appendChild(this._buildIndicator(step));
                }
                item.appendChild(this._buildContentEl(step));
            }

            // 倒數條（auto / auto-pausable 步驟才加）
            if (step.advance !== 'manual') {
                const bar = document.createElement('div');
                bar.className = 'st-countdown-bar';
                const fill = document.createElement('div');
                fill.className = 'st-countdown-fill';
                bar.appendChild(fill);
                item.appendChild(bar);
                step._countdownEl = fill;
                step._countdownBarEl = bar;
            }

            this.stepContainer.appendChild(item);
        });
    }

    // 建立指示器元素（共用）
    _buildIndicator(step) {
        const ind = document.createElement('div');
        ind.className = 'st-indicator';
        let text = this.options.indicator.format.replace('{current}', step.number);
        if (step.indicator) text = step.indicator;
        if (this.options.indicator.showTotal) text += ` / ${this.totalSteps}`;
        ind.textContent = text;
        return ind;
    }

    // 建立內容元素（共用）
    _buildContentEl(step) {
        const div = document.createElement('div');
        div.className = 'st-content';
        div.innerHTML = step.content;
        if (step.highlight) {
            div.classList.add('highlighted');
            if (step.highlight !== 'true') {
                div.style.setProperty('--hl-color', step.highlight);
            }
        }
        // 偵測並初始化翻轉卡片
        this._initFlipCards(div);
        return div;
    }

    // 建立摺疊式卡片步驟
    _buildCardItem(step) {
        const accentHex = StepTutor.resolveColor(step.cardColor)
            || StepTutor.resolveColor(this.options.button.theme)
            || StepTutor.COLORS.special;

        const card = document.createElement('div');
        card.className = 'st-card';
        card.style.setProperty('--card-accent', accentHex);

        // ── 標題列 ──
        const header = document.createElement('div');
        header.className = 'st-card-header';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'st-card-title';

        if (this.options.indicator.show) {
            const ind = document.createElement('span');
            ind.className = 'st-card-indicator';
            let t = this.options.indicator.format.replace('{current}', step.number);
            if (step.indicator) t = step.indicator;
            if (this.options.indicator.showTotal) t += ` / ${this.totalSteps}`;
            ind.textContent = t;
            titleWrap.appendChild(ind);
        }

        const titleText = document.createElement('span');
        titleText.className = 'st-card-title-text';
        titleText.textContent = step.cardTitle;
        titleWrap.appendChild(titleText);

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'st-card-toggle';
        toggleBtn.setAttribute('aria-label', '展開');
        toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';

        header.appendChild(titleWrap);
        header.appendChild(toggleBtn);

        // ── 內容體 ──
        const body = document.createElement('div');
        body.className = 'st-card-body';

        // 正面
        const front = document.createElement('div');
        front.className = 'st-card-face st-card-face-front';
        front.appendChild(this._buildContentEl(step));

        // 翻轉按鈕（只在有 cardBack 時出現）
        if (step.cardBack) {
            const flipRow = document.createElement('div');
            flipRow.className = 'st-card-flip-row';

            const flipBtn = document.createElement('button');
            flipBtn.className = 'st-card-flip-btn';
            flipBtn.textContent = '翻到背面 ↺';
            flipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                card.classList.toggle('is-flipped');
                flipBtn.textContent = card.classList.contains('is-flipped') ? '翻回正面 ↺' : '翻到背面 ↺';
            });
            flipRow.appendChild(flipBtn);
            front.appendChild(flipRow);
        }

        body.appendChild(front);

        // 背面
        if (step.cardBack) {
            const back = document.createElement('div');
            back.className = 'st-card-face st-card-face-back';

            const backContent = document.createElement('div');
            backContent.className = 'st-content';
            backContent.innerHTML = step.cardBack;
            this._initFlipCards(backContent);
            back.appendChild(backContent);

            const backFlipRow = document.createElement('div');
            backFlipRow.className = 'st-card-flip-row';
            const backFlipBtn = document.createElement('button');
            backFlipBtn.className = 'st-card-flip-btn';
            backFlipBtn.textContent = '翻回正面 ↺';
            backFlipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                card.classList.remove('is-flipped');
                // 同步正面按鈕文字
                const frontBtn = front.querySelector('.st-card-flip-btn');
                if (frontBtn) frontBtn.textContent = '翻到背面 ↺';
            });
            backFlipRow.appendChild(backFlipBtn);
            back.appendChild(backFlipRow);

            body.appendChild(back);
        }

        card.appendChild(header);
        card.appendChild(body);

        // ── 展開／收合 ──
        const toggleExpand = () => {
            const expanded = card.classList.toggle('is-expanded');
            toggleBtn.setAttribute('aria-label', expanded ? '收合' : '展開');
        };
        header.addEventListener('click', toggleExpand);

        // 記錄 DOM 參照方便 reset
        step._cardEl = card;

        return card;
    }
    _initFlipCards(container) {
        container.querySelectorAll('.fc').forEach(fc => {
            if (fc._fcInit) return; // 避免重複初始化
            fc._fcInit = true;

            const backText = fc.getAttribute('data-back') || '';
            const colorAttr = fc.getAttribute('data-color') || this.options.fc.defaultColor;
            const hex = StepTutor.COLORS[colorAttr] || colorAttr;
            const alpha = hex.replace('#','');
            const r = parseInt(alpha.substr(0,2),16);
            const g = parseInt(alpha.substr(2,2),16);
            const b = parseInt(alpha.substr(4,2),16);
            const alphaColor = `rgba(${r},${g},${b},0.13)`;

            fc.style.setProperty('--fc-accent', hex);
            fc.style.setProperty('--fc-accent-alpha', alphaColor);

            // 建立 inner 包裝
            const frontText = fc.textContent.trim();
            fc.innerHTML = '';

            const inner = document.createElement('div');
            inner.className = 'fc-inner';

            const front = document.createElement('span');
            front.className = 'fc-front';
            front.textContent = frontText;

            const back = document.createElement('span');
            back.className = 'fc-back';
            // 支援 HTML 標記（例如 <br>、<strong>）
            back.innerHTML = backText;

            inner.appendChild(front);
            inner.appendChild(back);
            fc.appendChild(inner);

            // 點擊切換正背面
            fc.addEventListener('click', (e) => {
                e.stopPropagation();
                fc.classList.toggle('is-flipped');
            });
        });
    }

    // ─── 樣式注入 ────────────────────────────────────────────────────
    _createStyles() {
        const styleId = 'st-styles-' + this.container.id;
        if (document.getElementById(styleId)) return;

        const s   = this.options.step;
        const ind = this.options.indicator;
        const btn = this.options.button;
        const pg  = this.options.progress;
        const pb  = this.options.progressBar;
        const cd  = this.options.countdown;
        const themeColor = StepTutor.COLORS[this.options.button.theme] || StepTutor.COLORS.special;

        const borderCSS = s.borderPos === 'all'
            ? `border: ${s.borderWidth} ${s.borderStyle} ${s.borderColor};`
            : `border-${s.borderPos}: ${s.borderWidth} ${s.borderStyle} ${s.borderColor};`;

        const btnSizes = {
            small:  { padding: '5px 12px',  fontSize: '0.875rem' },
            medium: { padding: '8px 16px',  fontSize: '1rem'     },
            large:  { padding: '11px 26px', fontSize: '1.1rem'   },
        };
        const bsBase   = btnSizes[this.options.button.size] || btnSizes.large;
        const bsPaddingY  = this.options.button.paddingY  || bsBase.padding.split(' ')[0];
        const bsPaddingX  = this.options.button.paddingX  || bsBase.padding.split(' ')[1];
        const bsFontSize  = this.options.button.fontSize  || bsBase.fontSize;
        const bsPadding   = `${bsPaddingY} ${bsPaddingX}`;

        // 輔助按鈕字體跟隨主按鈕，padding 維持合理相對比例
        const auxFontSize = bsFontSize;
        const auxPaddingY = bsPaddingY;
        const auxPaddingX = `calc(${bsPaddingX} * 0.7)`;

        const el = document.createElement('style');
        el.id = styleId;
        el.textContent = `
        #${this.container.id} .st-step-container {
            display: flex;
            flex-direction: column;
        }
        #${this.container.id} .st-step-item {
            background: ${s.bgColor};
            ${borderCSS}
            padding: ${s.padding};
            margin: ${s.margin};
            opacity: 0;
            max-height: 0;
            overflow: hidden;
            transition: opacity ${s.animDuration} ease,
                        max-height ${s.animDuration} ease;
            position: relative;
        }
        #${this.container.id} .st-step-item.revealed {
            opacity: 1;
            max-height: 9999px;
        }

        /* ── 目前步驟 active 框 ── */
        #${this.container.id} .st-step-item.active {
            background: ${s.activeBgColor};
            ${s.borderPos === 'all'
                ? `border: ${s.activeBorderWidth} solid ${s.activeBorderColor};`
                : `border-${s.borderPos}: ${s.activeBorderWidth} solid ${s.activeBorderColor};`
            }
            ${s.activeGlow ? `box-shadow: 0 0 0 1px ${s.activeBorderColor}28, 0 2px 16px ${s.activeBorderColor}22;` : ''}
            transition: background ${s.animDuration} ease,
                        border-color ${s.animDuration} ease,
                        box-shadow ${s.animDuration} ease,
                        opacity ${s.animDuration} ease,
                        max-height ${s.animDuration} ease;
        }
        #${this.container.id} .st-step-item.active .st-indicator {
            background: ${s.activeBorderColor};
            color: #1C1C1E;
        }

        #${this.container.id} .st-indicator {
            background: ${ind.bgColor};
            color: ${ind.textColor};
            font-size: ${ind.fontSize};
            font-weight: bold;
            padding: ${ind.padding};
            border-radius: ${ind.borderRadius};
            display: inline-block;
            margin-bottom: ${ind.marginBottom};
            letter-spacing: 0.04em;
        }
        #${this.container.id} .st-content {
            color: ${s.textColor};
            line-height: 1.6;
        }
        #${this.container.id} .st-content.highlighted {
            background: ${s.highlightColor}18;
            border-left: 3px solid var(--hl-color, ${s.highlightColor});
            padding: 6px 12px;
            margin: 4px 0;
        }

        /* ── 倒數條 ── */
        #${this.container.id} .st-countdown-bar {
            position: absolute;
            ${cd.position === 'top' ? 'top: 0;' : 'bottom: 0;'}
            left: 0; right: 0;
            height: ${cd.height};
            background: ${s.bgColor};
            overflow: hidden;
            display: none;
        }
        #${this.container.id} .st-step-item.revealed .st-countdown-bar {
            display: block;
        }
        #${this.container.id} .st-countdown-fill {
            height: 100%;
            width: 100%;
            background: ${cd.color};
            transform-origin: left center;
            will-change: transform;
        }

        /* ── 控制列 ── */
        #${this.container.id} .st-controls {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: ${this.options.chain.contentPosition === 'bottom' ? '0' : '14px'};
            margin-bottom: ${this.options.chain.contentPosition === 'bottom' ? '14px' : '0'};
        }
        #${this.container.id} .st-button-row {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        /* ── 按鈕共用 ── */
        #${this.container.id} .st-btn {
            border: none;
            font-weight: bold;
            cursor: pointer;
            transition: opacity 0.18s, transform 0.15s;
            border-radius: 3px;
            letter-spacing: 0.03em;
        }
        #${this.container.id} .st-btn:hover:not(:disabled) {
            opacity: 0.82;
        }
        #${this.container.id} .st-btn:active:not(:disabled) {
            transform: scale(0.97);
        }
        #${this.container.id} .st-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        /* ── 主按鈕 ── */
        #${this.container.id} .st-btn-main {
            background: ${themeColor};
            color: #1C1C1E;
            padding: ${bsPadding};
            font-size: ${bsFontSize};
        }

        /* ── 暫停按鈕 ── */
        #${this.container.id} .st-btn-pause {
            background: ${StepTutor.COLORS.stone};
            color: #fff;
            padding: ${auxPaddingY} ${auxPaddingX};
            font-size: ${auxFontSize};
        }
        #${this.container.id} .st-btn-pause.is-paused {
            background: ${StepTutor.COLORS.sky};
            color: #1C1C1E;
        }

        /* ── 重來按鈕 ── */
        #${this.container.id} .st-btn-restart {
            background: transparent;
            color: ${StepTutor.COLORS.stone};
            border: 1px solid ${StepTutor.COLORS.stone};
            padding: ${auxPaddingY} ${auxPaddingX};
            font-size: ${auxFontSize};
            border-radius: 3px;
        }
        #${this.container.id} .st-btn-restart:hover {
            color: ${themeColor};
            border-color: ${themeColor};
        }

        /* ── 進度文字 ── */
        #${this.container.id} .st-progress-text {
            color: ${s.textColor};
            font-size: ${pg.fontSize};
            opacity: 0.7;
        }

        /* ── 進度條 ── */
        #${this.container.id} .st-progress-bar {
            background: ${pb.bgColor};
            border: ${pb.borderWidth} solid ${pb.borderColor};
            height: ${pb.height};
            border-radius: ${pb.borderRadius};
            overflow: hidden;
            position: relative;
            display: flex;
            align-items: center;
        }
        #${this.container.id} .st-progress-bar-fill {
            background: ${pb.gradient};
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
        }
        #${this.container.id} .st-progress-bar-text {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            color: ${pb.textColor || s.textColor};
            font-size: ${pb.textFontSize};
            font-weight: ${pb.textFontWeight};
            pointer-events: none;
            z-index: 1;
        }

        /* ── target-content 淡入 ── */
        .st-target-content {
            animation: stFadeIn ${s.animDuration} ease;
        }
        @keyframes stFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0);    }
        }

        /* ════ 翻轉卡片 .fc ════ */
        #${this.container.id} .fc {
            display: inline-block;
            vertical-align: middle;
            cursor: pointer;
            margin: 2px 3px;
        }
        #${this.container.id} .fc-inner {
            display: inline-block;
            width: 100%;
        }
        #${this.container.id} .fc-front,
        #${this.container.id} .fc-back {
            padding: 4px 12px;
            border-radius: 4px;
            line-height: 1.5;
            font-size: inherit;
            min-width: 2em;
            text-align: center;
            display: block;
            transition: opacity 0.2s ease;
        }
        #${this.container.id} .fc-front {
            background: var(--fc-accent-alpha, rgba(222,202,75,0.13));
            color: var(--fc-accent, ${StepTutor.COLORS.yellow});
            border: 1px solid var(--fc-accent, ${StepTutor.COLORS.yellow});
        }
        #${this.container.id} .fc-front::after {
            content: ' ↺';
            font-size: 0.78em;
            opacity: 0.55;
        }
        #${this.container.id} .fc-back {
            background: var(--fc-accent, ${StepTutor.COLORS.yellow});
            color: #1c1c1e;
            border: 1px solid var(--fc-accent, ${StepTutor.COLORS.yellow});
            display: none;
            white-space: normal;
            word-break: break-word;
            text-align: left;
            line-height: 1.6;
        }
        #${this.container.id} .fc.is-flipped .fc-front {
            display: none;
        }
        #${this.container.id} .fc.is-flipped .fc-back {
            display: block;
        }
        #${this.container.id} .fc:hover:not(.is-flipped) .fc-front {
            filter: brightness(1.15);
        }

        /* ════ 摺疊卡片 .st-card ════ */
        #${this.container.id} .st-card {
            --card-accent: ${themeColor};
            border: 1px solid rgba(255,255,255,0.06);
            border-left: 3px solid var(--card-accent);
            border-radius: 0 6px 6px 0;
            background: #111211;
            overflow: hidden;
            width: 100%;
        }

        /* 標題列 */
        #${this.container.id} .st-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px 12px 16px;
            cursor: pointer;
            user-select: none;
            gap: 12px;
            transition: background 0.2s;
        }
        #${this.container.id} .st-card-header:hover {
            background: rgba(255,255,255,0.03);
        }
        #${this.container.id} .st-card-title {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }
        #${this.container.id} .st-card-indicator {
            font-size: 0.7rem;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 3px;
            letter-spacing: 0.06em;
            flex-shrink: 0;
            background: var(--card-accent);
            color: #1c1c1e;
        }
        #${this.container.id} .st-card-title-text {
            font-size: 0.98rem;
            font-weight: 600;
            color: ${s.textColor};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* 展開箭頭按鈕 */
        #${this.container.id} .st-card-toggle {
            flex-shrink: 0;
            width: 30px;
            height: 30px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 4px;
            color: var(--card-accent);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.3s ease;
            padding: 0;
        }
        #${this.container.id} .st-card-toggle svg {
            width: 16px;
            height: 16px;
            transition: transform 0.3s ease;
        }
        #${this.container.id} .st-card.is-expanded .st-card-toggle svg {
            transform: rotate(180deg);
        }
        #${this.container.id} .st-card-toggle:hover {
            background: rgba(255,255,255,0.09);
        }

        /* 內容體（摺疊動畫） */
        #${this.container.id} .st-card-body {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.38s cubic-bezier(0.4,0,0.2,1);
            position: relative;
        }
        #${this.container.id} .st-card.is-expanded .st-card-body {
            max-height: 9999px;
            overflow: visible;
        }

        /* 正背面 */
        #${this.container.id} .st-card-face {
            padding: 16px 18px 14px;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        #${this.container.id} .st-card-face-back {
            display: none;
            background: rgba(255,255,255,0.02);
        }
        #${this.container.id} .st-card.is-flipped .st-card-face-front {
            display: none;
        }
        #${this.container.id} .st-card.is-flipped .st-card-face-back {
            display: block;
        }

        /* 翻轉按鈕列 */
        #${this.container.id} .st-card-flip-row {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.06);
            display: flex;
            justify-content: flex-end;
        }
        #${this.container.id} .st-card-flip-btn {
            background: transparent;
            border: 1px solid var(--card-accent);
            color: var(--card-accent);
            padding: 5px 14px;
            font-size: 0.82rem;
            border-radius: 3px;
            cursor: pointer;
            letter-spacing: 0.03em;
            transition: background 0.2s, color 0.2s;
        }
        #${this.container.id} .st-card-flip-btn:hover {
            background: var(--card-accent);
            color: #1c1c1e;
        }
        `;

        document.head.appendChild(el);
    }

    // ─── 核心行為 ────────────────────────────────────────────────────

    _onMainButtonClick() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        // 若目前正在 auto 倒數（代表使用者按「跳過等待」）
        if (this._autoTimer !== null || this._countdownRAF !== null) {
            this._cancelCountdown();
            this._advance();
            return;
        }

        // 一般推進
        this._revealCurrent();
    }

    _revealCurrent() {
        if (this.currentStep >= this.totalSteps) return;

        const step = this.steps[this.currentStep];

        // 移除前一個 active（僅限非 target 步驟）
        this._clearActive();

        // 渲染到目標或 stepContainer
        if (step.target && step.targetElement) {
            this._revealToTarget(step);
        } else {
            const item = this.stepContainer.querySelector(`[data-step-index="${this.currentStep}"]`);
            if (item) {
                this._revealItem(item, true);
                if (this.options.scroll.auto) this._scrollTo(item);
            }
        }

        // 觸發回調
        if (this.options.callbacks.onStepRevealed) {
            this.options.callbacks.onStepRevealed(this.currentStep + 1, this.totalSteps);
        }

        // 根據 advance 決定後續行為
        if (step.advance === 'auto' || step.advance === 'auto-pausable') {
            this._startAutoAdvance(step);
        } else {
            // manual：推進 step index，更新 UI
            this.currentStep++;
            this._updateUI();
        }
    }

    _startAutoAdvance(step) {
        const delayMs = step.delay * 1000;
        this.isPaused = false;

        // 按鈕改為「跳過等待」
        this.button.textContent = this.options.button.skipText;

        // auto-pausable 顯示暫停鈕
        if (step.advance === 'auto-pausable') {
            this.pauseButton.style.display = 'inline-block';
            this.pauseButton.textContent = this.options.button.pauseText;
            this.pauseButton.classList.remove('is-paused');
        }

        // 啟動倒數動畫
        this._startCountdown(step, delayMs, () => {
            this._advance();
        });
    }

    _startCountdown(step, durationMs, onComplete) {
        this._countdownDuration = durationMs;
        this._countdownStart    = performance.now();
        this._countdownRemaining = durationMs;

        const fill = step._countdownEl;
        if (!fill) {
            // target 模式沒有倒數條，直接用 setTimeout
            this._autoTimer = setTimeout(onComplete, durationMs);
            return;
        }

        // 用 requestAnimationFrame 驅動倒數
        const tick = (now) => {
            if (this.isPaused) return; // 暫停時停住
            const elapsed = now - this._countdownStart;
            const remaining = Math.max(0, this._countdownDuration - elapsed);
            const ratio = remaining / this._countdownDuration;
            fill.style.transform = `scaleX(${ratio})`;

            if (remaining <= 0) {
                fill.style.transform = 'scaleX(0)';
                this._countdownRAF = null;
                onComplete();
            } else {
                this._countdownRAF = requestAnimationFrame(tick);
            }
        };
        this._countdownRAF = requestAnimationFrame(tick);
    }

    _cancelCountdown() {
        if (this._autoTimer) {
            clearTimeout(this._autoTimer);
            this._autoTimer = null;
        }
        if (this._countdownRAF) {
            cancelAnimationFrame(this._countdownRAF);
            this._countdownRAF = null;
        }
        this.pauseButton.style.display = 'none';
        this.isPaused = false;
    }

    _togglePause() {
        const step = this.steps[this.currentStep - 1]; // 已顯示的步驟
        if (!step) return;

        if (this.isPaused) {
            // 繼續：重新計算剩餘時間
            this.isPaused = false;
            this._countdownStart = performance.now() - (this._countdownDuration - this._countdownRemaining);
            this.pauseButton.textContent = this.options.button.pauseText;
            this.pauseButton.classList.remove('is-paused');

            // 重啟 RAF
            const fill = step._countdownEl;
            if (fill) {
                const onComplete = () => this._advance();
                const tick = (now) => {
                    if (this.isPaused) return;
                    const elapsed = now - this._countdownStart;
                    const remaining = Math.max(0, this._countdownDuration - elapsed);
                    const ratio = remaining / this._countdownDuration;
                    fill.style.transform = `scaleX(${ratio})`;
                    if (remaining <= 0) {
                        fill.style.transform = 'scaleX(0)';
                        this._countdownRAF = null;
                        onComplete();
                    } else {
                        this._countdownRAF = requestAnimationFrame(tick);
                    }
                };
                this._countdownRAF = requestAnimationFrame(tick);
            }

            if (this.options.callbacks.onResume) this.options.callbacks.onResume();
        } else {
            // 暫停
            this.isPaused = true;
            const now = performance.now();
            this._countdownRemaining = Math.max(0,
                this._countdownDuration - (now - this._countdownStart));
            if (this._countdownRAF) {
                cancelAnimationFrame(this._countdownRAF);
                this._countdownRAF = null;
            }
            this.pauseButton.textContent = this.options.button.resumeText;
            this.pauseButton.classList.add('is-paused');
            if (this.options.callbacks.onPause) this.options.callbacks.onPause();
        }
    }

    _advance() {
        this._cancelCountdown();
        this._clearActive();
        this.currentStep++;
        this._updateUI();

        // 若全部完成
        if (this.currentStep >= this.totalSteps) return;

        // 若下一步也是 auto，自動接著顯示
        const next = this.steps[this.currentStep];
        if (next && (next.advance === 'auto' || next.advance === 'auto-pausable')) {
            this._revealCurrent();
        }
    }

    _updateUI() {
        const done = this.currentStep >= this.totalSteps;

        if (done) {
            this.button.textContent = this.options.button.completeText;
            this.button.disabled = true;
            this.pauseButton.style.display = 'none';
            if (this.restartButton) this.restartButton.style.display = 'inline-block';
            if (this.options.callbacks.onAllRevealed) this.options.callbacks.onAllRevealed();
        } else {
            // 更新主按鈕文字
            const next = this.steps[this.currentStep];
            if (next && next.advance !== 'manual') {
                this.button.textContent = this.options.button.skipText;
            } else {
                this.button.textContent = this.options.button.text;
                this.button.disabled = false;
            }
        }

        if (this.options.progress.show)     this._updateProgressDisplay();
        if (this.options.progressBar.show)  this._updateProgressBar();
    }

    _revealToTarget(step) {
        const wrap = document.createElement('div');
        wrap.className = 'st-target-content';
        wrap.setAttribute('data-step-index', step.index);

        if (this.options.indicator.show) {
            const ind = this._buildIndicator(step);
            // target 模式下指示器用 inline style（避免 CSS 容器 scope 問題）
            ind.style.cssText = `
                background: ${this.options.indicator.bgColor};
                color: ${this.options.indicator.textColor};
                font-size: ${this.options.indicator.fontSize};
                font-weight: bold;
                padding: ${this.options.indicator.padding};
                border-radius: ${this.options.indicator.borderRadius};
                display: inline-block;
                margin-bottom: ${this.options.indicator.marginBottom};
            `;
            wrap.appendChild(ind);
        }

        wrap.appendChild(this._buildContentEl(step));

        switch (this.options.target.mode) {
            case 'append':
                step.targetElement.appendChild(wrap);
                break;
            case 'prepend':
                step.targetElement.insertBefore(wrap, step.targetElement.firstChild);
                break;
            case 'replace':
            default:
                step.targetElement.innerHTML = '';
                step.targetElement.appendChild(wrap);
        }

        if (this.options.scroll.auto) this._scrollTo(step.targetElement);
    }

    // ─── 進度更新 ────────────────────────────────────────────────────
    _updateProgressDisplay() {
        if (!this.progressDisplay) return;
        this.progressDisplay.textContent = this.options.progress.text
            .replace('{current}', this.currentStep)
            .replace('{total}',   this.totalSteps);
    }

    _updateProgressBar() {
        if (!this.progressBar || !this.progressBarFill) return;
        const pct = this.totalSteps > 0
            ? Math.round((this.currentStep / this.totalSteps) * 100)
            : 0;
        this.progressBarFill.style.width = pct + '%';
        const t = this.progressBar.querySelector('.st-progress-bar-text');
        if (t) t.textContent = pct + '%';
    }

    _scrollTo(el) {
        setTimeout(() => {
            const top = el.getBoundingClientRect().top + window.pageYOffset - this.options.scroll.offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }, 80);
    }

    _clearActive() {
        this.stepContainer.querySelectorAll('.st-step-item.active')
            .forEach(el => el.classList.remove('active'));
    }

    // 揭露單一步驟 DOM 節點，動畫結束後開放 overflow
    _revealItem(item, addActive = false) {
        if (!item) return;
        item.classList.add('revealed');
        if (addActive) item.classList.add('active');

        // 動畫結束後切換 overflow，確保翻轉卡片等子內容不被截斷
        const onEnd = (e) => {
            if (e.propertyName !== 'max-height') return;
            item.style.overflow = 'visible';
            item.removeEventListener('transitionend', onEnd);
        };
        item.addEventListener('transitionend', onEnd);
    }

    // ─── 公開 API ────────────────────────────────────────────────────

    reset() {
        this._cancelCountdown();
        this.currentStep = 0;
        this.isPaused    = false;

        // 清除所有 revealed / active 狀態，並重置 inline overflow
        this.stepContainer.querySelectorAll('.st-step-item').forEach(el => {
            el.classList.remove('revealed', 'active');
            el.style.overflow = '';
        });

        // 重置倒數條與卡片狀態
        this.steps.forEach(step => {
            if (step._countdownEl) {
                step._countdownEl.style.transform = 'scaleX(1)';
            }
            if (step._cardEl) {
                step._cardEl.classList.remove('is-expanded', 'is-flipped');
                const flipBtn = step._cardEl.querySelector('.st-card-face-front .st-card-flip-btn');
                if (flipBtn) flipBtn.textContent = '翻到背面 ↺';
            }
        });

        // 清空 target
        if (this.options.target.clearOnReset) {
            this.targetElements.forEach(el => {
                el.querySelectorAll('.st-target-content').forEach(c => c.remove());
            });
        }

        // 重置按鈕
        this.button.textContent = this.options.button.text;
        this.button.disabled    = false;
        this.pauseButton.style.display = 'none';
        if (this.restartButton) this.restartButton.style.display = 'none';

        if (this.options.progress.show)     this._updateProgressDisplay();
        if (this.options.progressBar.show)  this._updateProgressBar();

        if (this.options.callbacks.onReset) this.options.callbacks.onReset();
    }

    revealAll() {
        this._cancelCountdown();
        this._clearActive();
        while (this.currentStep < this.totalSteps) {
            const step = this.steps[this.currentStep];
            if (step.target && step.targetElement) {
                this._revealToTarget(step);
            } else {
                const item = this.stepContainer.querySelector(`[data-step-index="${this.currentStep}"]`);
                const isLast = this.currentStep === this.totalSteps - 1;
                this._revealItem(item, isLast);
            }
            this.currentStep++;
        }
        this._updateUI();
    }

    goToStep(n) {
        // 直接跳至第 n 步（不觸發 auto 行為，不觸發 callbacks）
        this._cancelCountdown();
        this.currentStep = 0;
        this.stepContainer.querySelectorAll('.st-step-item').forEach(el =>
            el.classList.remove('revealed')
        );
        if (this.options.target.clearOnReset) {
            this.targetElements.forEach(el =>
                el.querySelectorAll('.st-target-content').forEach(c => c.remove())
            );
        }
        const target = Math.min(n, this.totalSteps);
        for (let i = 0; i < target; i++) {
            const step = this.steps[i];
            if (step.target && step.targetElement) {
                this._revealToTarget(step);
            } else {
                const item = this.stepContainer.querySelector(`[data-step-index="${i}"]`);
                this._revealItem(item, false);
            }
            this.currentStep++;
        }
        this._updateUI();
    }

    destroy() {
        this._cancelCountdown();
        [this.stepContainer, this._controlsContainer].forEach(el => el?.remove());
        const styleEl = document.getElementById('st-styles-' + this.container.id);
        if (styleEl) styleEl.remove();
        this.targetElements.forEach(el =>
            el.querySelectorAll('.st-target-content').forEach(c => c.remove())
        );
    }

    // ─── JSON 匯出 / 匯入 ────────────────────────────────────────────

    // 將 options 的巢狀結構展平為單層 key-value（供 JSON 匯出及重新初始化使用）
    _flattenOptions() {
        const o = this.options;
        return {
            // 步驟外觀
            stepBgColor:            o.step.bgColor,
            stepBorderColor:        o.step.borderColor,
            stepTextColor:          o.step.textColor,
            stepPadding:            o.step.padding,
            stepMargin:             o.step.margin,
            borderPosition:         o.step.borderPos,
            borderWidth:            o.step.borderWidth,
            borderStyle:            o.step.borderStyle,
            highlightColor:         o.step.highlightColor,
            animationDuration:      o.step.animDuration,
            activeBorderColor:      o.step.activeBorderColor,
            activeBorderWidth:      o.step.activeBorderWidth,
            activeBgColor:          o.step.activeBgColor,
            activeGlow:             o.step.activeGlow,
            // 指示器
            showIndicator:          o.indicator.show,
            indicatorFormat:        o.indicator.format,
            showTotalSteps:         o.indicator.showTotal,
            indicatorTextColor:     o.indicator.textColor,
            indicatorFontSize:      o.indicator.fontSize,
            indicatorBorderRadius:  o.indicator.borderRadius,
            indicatorPadding:       o.indicator.padding,
            indicatorMarginBottom:  o.indicator.marginBottom,
            // 按鈕
            buttonText:             o.button.text,
            buttonCompleteText:     o.button.completeText,
            buttonSkipText:         o.button.skipText,
            buttonPauseText:        o.button.pauseText,
            buttonResumeText:       o.button.resumeText,
            buttonTheme:            o.button.theme,
            buttonSize:             o.button.size,
            buttonPaddingX:         o.button.paddingX,
            buttonPaddingY:         o.button.paddingY,
            buttonFontSize:         o.button.fontSize,
            // 進度文字
            showProgress:           o.progress.show,
            progressText:           o.progress.text,
            progressFontSize:       o.progress.fontSize,
            progressPosition:       o.progress.position,
            // 進度條
            showProgressBar:        o.progressBar.show,
            progressBarHeight:      o.progressBar.height,
            progressBarBgColor:     o.progressBar.bgColor,
            progressBarGradient:    o.progressBar.gradient,
            progressBarBorderWidth: o.progressBar.borderWidth,
            progressBarBorderColor: o.progressBar.borderColor,
            progressBarBorderRadius:o.progressBar.borderRadius,
            progressBarPadding:     o.progressBar.padding,
            progressBarTextFontSize:o.progressBar.textFontSize,
            progressBarTextFontWeight: o.progressBar.textFontWeight,
            progressBarTextColor:   o.progressBar.textColor,
            // 倒數條
            countdownHeight:        o.countdown.height,
            countdownColor:         o.countdown.color,
            countdownPosition:      o.countdown.position,
            // 滾動
            autoScroll:             o.scroll.auto,
            scrollOffset:           o.scroll.offset,
            // 目標渲染
            targetMode:             o.target.mode,
            targetClearOnReset:     o.target.clearOnReset,
            // 步驟鏈
            defaultAdvance:         o.chain.defaultAdvance,
            defaultDelay:           o.chain.defaultDelay,
            restart:                o.chain.restart,
            contentPosition:        o.chain.contentPosition,
            // 翻轉卡片
            fcColor:                o.fc.defaultColor,
        };
    }

    exportJSON() {
        const config = this._flattenOptions();
        const steps  = this.steps.map(s => ({
            number:    s.number,
            advance:   s.advance,
            delay:     s.delay,
            indicator: s.indicator,
            highlight: s.highlight,
            target:    s.target,
            isCard:    s.isCard,
            cardTitle: s.isCard ? s.cardTitle  : undefined,
            cardBack:  s.isCard ? s.cardBack   : undefined,
            cardColor: s.isCard ? s.cardColor  : undefined,
            content:   s.content,
        }));

        // 移除 undefined 欄位，讓 JSON 更乾淨
        const cleanSteps = steps.map(s =>
            Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined && v !== null))
        );

        return JSON.stringify({ config, steps: cleanSteps }, null, 2);
    }

    downloadJSON(filename) {
        const name = filename || `step-tutor-${this.container.id}.json`;
        const blob = new Blob([this.exportJSON()], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    }

    importJSON(jsonStr) {
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            console.error('[StepTutor] importJSON 解析失敗：', e.message);
            return false;
        }

        if (!data.steps || !Array.isArray(data.steps)) {
            console.error('[StepTutor] importJSON：缺少 steps 陣列');
            return false;
        }

        // 銷毀現有 DOM（保留 style tag 讓重建更快）
        this._cancelCountdown();
        if (this.stepContainer)     this.stepContainer.remove();
        if (this._controlsContainer) this._controlsContainer.remove();

        // 重置狀態
        this.currentStep  = 0;
        this.isPaused     = false;
        this._autoTimer   = null;
        this._countdownRAF = null;
        this.steps        = [];
        this.targetElements = new Map();

        // 合併 config（若有提供）
        if (data.config && typeof data.config === 'object') {
            this.options = this._mergeOptions(data.config);
            this.options.indicator.bgColor =
                StepTutor.COLORS[this.options.button.theme] || StepTutor.COLORS.special;
        }

        // 從陣列載入步驟
        this._loadStepsFromArray(data.steps);

        // 移除舊 style，重新注入（config 可能有色彩變更）
        const oldStyle = document.getElementById('st-styles-' + this.container.id);
        if (oldStyle) oldStyle.remove();
        this._createStyles();
        this._createLayout();

        return true;
    }

    // 靜態工廠：直接從 JSON 字串建立實例
    static fromJSON(containerId, jsonStr) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[StepTutor] fromJSON：找不到容器 #${containerId}`);
            return null;
        }
        // 建立一個空殼實例再 importJSON
        const instance = Object.create(StepTutor.prototype);
        instance.container = container;
        instance.options   = instance._mergeOptions({});
        instance.currentStep = 0;
        instance.totalSteps  = 0;
        instance.steps       = [];
        instance.isPaused    = false;
        instance._autoTimer  = null;
        instance._countdownRAF = null;
        instance._countdownStart = null;
        instance._countdownDuration = 0;
        instance.stepContainer = null;
        instance.button = null;
        instance.pauseButton = null;
        instance.restartButton = null;
        instance.progressDisplay = null;
        instance.progressBar = null;
        instance.progressBarFill = null;
        instance.targetElements = new Map();
        instance.topSlot = null;
        instance.bottomSlot = null;

        const ok = instance.importJSON(jsonStr);
        return ok ? instance : null;
    }
}

// ─── 自動初始化 ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // data-attribute → options 對照表
    // 格式：[dataAttrName, optionKey, type]
    // type: 's'=string, 'b'=boolean(非'false'為true), 'bt'=boolean('true'為true), 'n'=number
    const ATTR_MAP = [
        ['stepBgColor',             'stepBgColor',             's'],
        ['stepBorderColor',         'stepBorderColor',         's'],
        ['stepTextColor',           'stepTextColor',           's'],
        ['indicatorBgColor',        'indicatorBgColor',        's'],
        ['indicatorTextColor',      'indicatorTextColor',      's'],
        ['highlightColor',          'highlightColor',          's'],
        ['stepPadding',             'stepPadding',             's'],
        ['stepMargin',              'stepMargin',              's'],
        ['indicatorPadding',        'indicatorPadding',        's'],
        ['borderWidth',             'borderWidth',             's'],
        ['borderStyle',             'borderStyle',             's'],
        ['borderPosition',          'borderPosition',          's'],
        ['showIndicator',           'showIndicator',           'b'],
        ['animationDuration',       'animationDuration',       's'],
        ['buttonText',              'buttonText',              's'],
        ['buttonCompleteText',      'buttonCompleteText',      's'],
        ['buttonSkipText',          'buttonSkipText',          's'],
        ['buttonPauseText',         'buttonPauseText',         's'],
        ['buttonResumeText',        'buttonResumeText',        's'],
        ['buttonTheme',             'buttonTheme',             's'],
        ['buttonSize',              'buttonSize',              's'],
        ['buttonPaddingX',          'buttonPaddingX',          's'],
        ['buttonPaddingY',          'buttonPaddingY',          's'],
        ['buttonFontSize',          'buttonFontSize',          's'],
        ['restart',                 'restart',                 'b'],
        ['contentPosition',         'contentPosition',         's'],
        ['indicatorFormat',         'indicatorFormat',         's'],
        ['showTotalSteps',          'showTotalSteps',          'bt'],
        ['showProgress',            'showProgress',            'b'],
        ['progressText',            'progressText',            's'],
        ['progressFontSize',        'progressFontSize',        's'],
        ['progressPosition',        'progressPosition',        's'],
        ['showProgressBar',         'showProgressBar',         'bt'],
        ['progressBarHeight',       'progressBarHeight',       's'],
        ['progressBarBgColor',      'progressBarBgColor',      's'],
        ['progressBarGradient',     'progressBarGradient',     's'],
        ['progressBarBorderWidth',  'progressBarBorderWidth',  's'],
        ['progressBarBorderColor',  'progressBarBorderColor',  's'],
        ['progressBarBorderRadius', 'progressBarBorderRadius', 's'],
        ['progressBarPadding',      'progressBarPadding',      's'],
        ['progressBarTextFontSize', 'progressBarTextFontSize', 's'],
        ['progressBarTextFontWeight','progressBarTextFontWeight','s'],
        ['progressBarTextColor',    'progressBarTextColor',    's'],
        ['indicatorFontSize',       'indicatorFontSize',       's'],
        ['indicatorBorderRadius',   'indicatorBorderRadius',   's'],
        ['indicatorMarginBottom',   'indicatorMarginBottom',   's'],
        ['autoScroll',              'autoScroll',              'b'],
        ['scrollOffset',            'scrollOffset',            'n'],
        ['targetMode',              'targetMode',              's'],
        ['targetClearOnReset',      'targetClearOnReset',      'b'],
        ['countdownHeight',         'countdownHeight',         's'],
        ['countdownColor',          'countdownColor',          's'],
        ['countdownPosition',       'countdownPosition',       's'],
        ['defaultAdvance',          'defaultAdvance',          's'],
        ['defaultDelay',            'defaultDelay',            'n'],
        ['activeBorderColor',       'activeBorderColor',       's'],
        ['activeBorderWidth',       'activeBorderWidth',       's'],
        ['activeBgColor',           'activeBgColor',           's'],
        ['activeGlow',              'activeGlow',              'b'],
        ['fcColor',                 'fcColor',                 's'],
    ];

    document.querySelectorAll('[data-step-tutor]').forEach(container => {
        const d = container.dataset;
        const opts = {};
        ATTR_MAP.forEach(([attr, key, type]) => {
            if (d[attr] === undefined) return;
            if (type === 's')  opts[key] = d[attr];
            if (type === 'b')  opts[key] = d[attr] !== 'false';
            if (type === 'bt') opts[key] = d[attr] === 'true';
            if (type === 'n')  opts[key] = parseFloat(d[attr]);
        });
        container.stepTutorInstance = new StepTutor(container.id, opts);
    });
});

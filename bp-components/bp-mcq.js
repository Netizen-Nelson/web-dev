// ================================================================
// bp-mcq.js — 單選／多選練習題元件
//
// 掛載方式：
//   <div data-bp="mcq" data-payload='{"question":"...","options":[...],"answer":[0]}'></div>
//
// payload 欄位：
//   question  {string}   題目說明（純文字或 HTML）
//   options   {string[]} 選項陣列
//   answer    {number[]} 正確選項的 index 陣列（單選填一個，多選填多個）
//   multi     {boolean}  是否為多選題（預設 false）
//   hint      {string}   可選提示文字（答錯時顯示）
//
// 全域設定：
//   BpMcq.config.apiUrl   = 'practice_api.php';
//   BpMcq.config.autoInit = true;
//
// 獨立使用：不依賴任何外部 JS
// 若頁面已引入 rich-input.js，題目文字會自動套用 RichInput.render()
// ================================================================

(function (G) {
    'use strict';

    // ── 全域設定 ─────────────────────────────────────────────────
    var Config = {
        apiUrl      : 'practice_api.php',
        autoInit    : true,
        showFeedback: true,
        allowRetry  : true,
        // ── 色彩主題（CSS 變數名稱或直接色碼皆可）─────────────────
        theme: {
            optBorder : 'var(--lavender,#C3A5E5)',  // 選項 hover / selected 邊框與色
            correct   : 'var(--safe,#81E6D9)',       // 答對色
            wrong     : 'var(--warning,#F08080)',    // 答錯色
            submit    : 'var(--lavender,#C3A5E5)',   // 送出按鈕背景
            hint      : 'var(--attention,#E5E5A6)',  // 提示左邊框
        },
    };

    // ── CSS 注入（theme 變更時重新產生）─────────────────────────
    var _cssEl = null;
    function injectCSS() {
        if (!_cssEl) {
            _cssEl = document.createElement('style');
            _cssEl.id = 'bp-mcq-styles';
            document.head.appendChild(_cssEl);
        }
        var t = Config.theme;
        _cssEl.textContent = [
            '.bp-mcq{font-size:1rem;}',

            /* 題目文字 */
            '.bp-mcq-question{',
            'color:var(--shell,#c6c7bd);',
            'line-height:1.75;margin-bottom:14px;font-size:.95rem;}',

            /* 選項按鈕 */
            '.bp-mcq-options{display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}',
            '.bp-mcq-opt{',
            'display:flex;align-items:flex-start;gap:10px;',
            'background:var(--area2,#2a2b2a);',
            'border:1px solid var(--card-border,#3a3b3a);',
            'border-radius:6px;padding:10px 14px;',
            'cursor:pointer;transition:border-color .15s,background .15s;',
            'color:var(--shell,#c6c7bd);font-size:.9rem;line-height:1.55;',
            'text-align:left;width:100%;appearance:none;-webkit-appearance:none;}',

            '.bp-mcq-opt:hover:not(:disabled){border-color:' + t.optBorder + ';background:rgba(195,165,229,.08);}',
            '.bp-mcq-opt.selected{border-color:' + t.optBorder + ';background:rgba(195,165,229,.13);}',
            '.bp-mcq-opt.correct{border-color:' + t.correct + ';background:rgba(129,230,217,.12);color:' + t.correct + ';}',
            '.bp-mcq-opt.wrong{border-color:' + t.wrong + ';background:rgba(240,128,128,.1);color:' + t.wrong + ';}',
            '.bp-mcq-opt.reveal-correct{border-color:' + t.correct + ';background:rgba(129,230,217,.07);color:' + t.correct + ';}',
            '.bp-mcq-opt:disabled{cursor:default;opacity:.85;}',

            /* 序號標籤 */
            '.bp-mcq-label{flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1px solid currentColor;',
            'display:flex;align-items:center;justify-content:center;',
            'font-size:.72rem;font-weight:700;line-height:1;color:var(--shell-dim,#888);margin-top:1px;}',
            '.bp-mcq-opt.selected .bp-mcq-label,.bp-mcq-opt.correct .bp-mcq-label,',
            '.bp-mcq-opt.wrong .bp-mcq-label,.bp-mcq-opt.reveal-correct .bp-mcq-label{color:currentColor;}',

            /* 多選提示 */
            '.bp-mcq-multi-hint{font-size:.75rem;color:var(--shell-dim,#888);margin-bottom:10px;}',

            /* 送出按鈕 */
            '.bp-mcq-submit{background:' + t.submit + ';color:#0c0d0c;',
            'border:none;border-radius:6px;padding:8px 20px;',
            'font-size:.85rem;font-weight:700;cursor:pointer;transition:opacity .2s;}',
            '.bp-mcq-submit:disabled{opacity:.35;cursor:default;}',

            /* 重試按鈕 */
            '.bp-mcq-retry{background:none;border:1px solid var(--card-border,#3a3b3a);',
            'color:var(--shell-dim,#888);border-radius:6px;',
            'padding:7px 18px;font-size:.82rem;cursor:pointer;',
            'margin-left:8px;transition:border-color .15s,color .15s;}',
            '.bp-mcq-retry:hover{border-color:' + t.submit + ';color:' + t.submit + ';}',

            /* 回饋列 */
            '.bp-mcq-feedback{font-size:.85rem;padding:8px 12px;border-radius:6px;margin-bottom:10px;line-height:1.55;}',
            '.bp-mcq-feedback.ok{background:rgba(129,230,217,.12);border:1px solid ' + t.correct + ';color:' + t.correct + ';}',
            '.bp-mcq-feedback.fail{background:rgba(240,128,128,.1);border:1px solid ' + t.wrong + ';color:' + t.wrong + ';}',

            /* 提示文字 */
            '.bp-mcq-hint{',
            'font-size:.8rem;color:var(--shell-dim,#888);',
            'margin-top:6px;padding:6px 10px;',
            'border-left:2px solid ' + t.hint + ';',
            'background:rgba(229,229,166,.07);}',
        ].join('');
    }

    // ── 工具 ─────────────────────────────────────────────────────

    /** 渲染題目文字：若 rich-input.js 已載入則套用 render()，否則直接用 */
    function renderQuestion(html) {
        if (G.RichInput && typeof G.RichInput.render === 'function') {
            return G.RichInput.render(html);
        }
        return html || '';
    }

    /** 選項字母標籤：0→A, 1→B … */
    function optLabel(i) {
        return String.fromCharCode(65 + i);
    }

    // ── BpMcqWidget ──────────────────────────────────────────────

    function BpMcqWidget(el) {
        this.el       = el;
        this.payload  = {};
        this.selected = [];   // 目前選取的 index 陣列
        this.submitted = false;
        this._parse();
        this._render();
    }

    // 解析 payload
    BpMcqWidget.prototype._parse = function () {
        try {
            this.payload = JSON.parse(this.el.getAttribute('data-payload') || '{}');
        } catch (e) {
            this.payload = {};
        }
        this.isMulti = !!this.payload.multi;
        this.answer  = (this.payload.answer || []).map(Number);
    };

    // 渲染整個元件
    BpMcqWidget.prototype._render = function () {
        injectCSS();
        var p    = this.payload;
        var el   = this.el;
        el.innerHTML = '';
        el.className = (el.className + ' bp-mcq').trim();

        // 題目
        if (p.question) {
            var qDiv = document.createElement('div');
            qDiv.className = 'bp-mcq-question';
            qDiv.innerHTML = renderQuestion(p.question);
            el.appendChild(qDiv);
        }

        // 多選提示
        if (this.isMulti) {
            var hint = document.createElement('div');
            hint.className = 'bp-mcq-multi-hint';
            hint.textContent = '（多選題，請選出所有正確答案）';
            el.appendChild(hint);
        }

        // 選項列表
        var optWrap = document.createElement('div');
        optWrap.className = 'bp-mcq-options';
        this._optWrap = optWrap;

        var self = this;
        (p.options || []).forEach(function (opt, i) {
            var btn = document.createElement('button');
            btn.type      = 'button';
            btn.className = 'bp-mcq-opt';
            btn.setAttribute('data-idx', i);
            btn.innerHTML =
                '<span class="bp-mcq-label">' + optLabel(i) + '</span>' +
                '<span class="bp-mcq-text">' + renderQuestion(opt) + '</span>';
            btn.addEventListener('click', function () { self._onSelect(i, btn); });
            optWrap.appendChild(btn);
        });
        el.appendChild(optWrap);

        // 回饋區
        var fb = document.createElement('div');
        fb.className = 'bp-mcq-feedback';
        fb.style.display = 'none';
        this._feedback = fb;
        el.appendChild(fb);

        // 按鈕列
        var btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.alignItems = 'center';
        btnRow.style.flexWrap = 'wrap';
        btnRow.style.gap = '4px';

        // 按鈕外觀：從 payload 或 data-* 屬性讀取
        var btnCfg = {
            submitText   : p.submitText    || el.getAttribute('data-submit-text')    || '確認答案',
            retryText    : p.retryText     || el.getAttribute('data-retry-text')     || '↺ 重試',
            btnSize      : p.btnSize       || el.getAttribute('data-btn-size')       || '',
            btnPadding   : p.btnPadding    || el.getAttribute('data-btn-padding')    || '',
            btnFontSize  : p.btnFontSize   || el.getAttribute('data-btn-font-size')  || '',
        };

        var submitBtn = document.createElement('button');
        submitBtn.type      = 'button';
        submitBtn.className = 'bp-mcq-submit';
        submitBtn.disabled  = true;
        submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>' + btnCfg.submitText;
        if (btnCfg.btnPadding)  submitBtn.style.padding    = btnCfg.btnPadding;
        if (btnCfg.btnFontSize) submitBtn.style.fontSize   = btnCfg.btnFontSize;
        if (btnCfg.btnSize === 'sm') {
            submitBtn.style.padding  = submitBtn.style.padding  || '5px 14px';
            submitBtn.style.fontSize = submitBtn.style.fontSize || '.78rem';
        } else if (btnCfg.btnSize === 'lg') {
            submitBtn.style.padding  = submitBtn.style.padding  || '11px 28px';
            submitBtn.style.fontSize = submitBtn.style.fontSize || '1rem';
        }
        submitBtn.addEventListener('click', function () { self._onSubmit(); });
        this._submitBtn = submitBtn;
        btnRow.appendChild(submitBtn);

        if (Config.allowRetry) {
            var retryBtn = document.createElement('button');
            retryBtn.type      = 'button';
            retryBtn.className = 'bp-mcq-retry';
            retryBtn.style.display = 'none';
            retryBtn.innerHTML = btnCfg.retryText;
            if (btnCfg.btnPadding)  retryBtn.style.padding  = btnCfg.btnPadding;
            if (btnCfg.btnFontSize) retryBtn.style.fontSize = btnCfg.btnFontSize;
            retryBtn.addEventListener('click', function () { self._onRetry(); });
            this._retryBtn = retryBtn;
            btnRow.appendChild(retryBtn);
        }

        el.appendChild(btnRow);
    };

    // 選取選項
    BpMcqWidget.prototype._onSelect = function (idx, btn) {
        if (this.submitted) return;

        if (this.isMulti) {
            // 多選：toggle
            var pos = this.selected.indexOf(idx);
            if (pos === -1) {
                this.selected.push(idx);
                btn.classList.add('selected');
            } else {
                this.selected.splice(pos, 1);
                btn.classList.remove('selected');
            }
        } else {
            // 單選：清除舊選取
            var self = this;
            this._optWrap.querySelectorAll('.bp-mcq-opt').forEach(function (b) {
                b.classList.remove('selected');
            });
            this.selected = [idx];
            btn.classList.add('selected');
        }

        this._submitBtn.disabled = this.selected.length === 0;
    };

    // 確認答案
    BpMcqWidget.prototype._onSubmit = function () {
        if (this.submitted || this.selected.length === 0) return;
        this.submitted = true;
        this._submitBtn.disabled = true;

        // 排序後比對
        var sel = this.selected.slice().sort(function (a, b) { return a - b; });
        var ans = this.answer.slice().sort(function (a, b) { return a - b; });
        var isCorrect = sel.length === ans.length &&
            sel.every(function (v, i) { return v === ans[i]; });

        // 標色選項
        var self = this;
        this._optWrap.querySelectorAll('.bp-mcq-opt').forEach(function (btn) {
            var i = parseInt(btn.getAttribute('data-idx'), 10);
            btn.disabled = true;
            var isAns = ans.indexOf(i) !== -1;
            var isSel = sel.indexOf(i) !== -1;
            if (isSel && isAns)  btn.classList.add('correct');
            else if (isSel)      btn.classList.add('wrong');
            else if (isAns)      btn.classList.add('reveal-correct');
        });

        // 回饋
        if (Config.showFeedback) {
            var fb = this._feedback;
            fb.style.display = '';
            if (isCorrect) {
                fb.className = 'bp-mcq-feedback ok';
                fb.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>正確！';
            } else {
                fb.className = 'bp-mcq-feedback fail';
                fb.innerHTML = '<i class="bi bi-x-circle-fill me-2"></i>答案不正確。';
                if (this.payload.hint) {
                    fb.innerHTML +=
                        '<div class="bp-mcq-hint">' +
                        '<i class="bi bi-lightbulb me-1"></i>' +
                        renderQuestion(this.payload.hint) +
                        '</div>';
                }
            }
        }

        // 顯示重試
        if (this._retryBtn) this._retryBtn.style.display = '';

        // 回呼
        var practiceId = parseInt(this.el.getAttribute('data-practice-id') || '0', 10);
        var unitId     = parseInt(this.el.getAttribute('data-unit-id')     || '0', 10);
        var sectionId  = parseInt(this.el.getAttribute('data-section-id') || '0', 10);

        // 外部回呼（供頁面監聽）
        this.el.dispatchEvent(new CustomEvent('bp:answered', {
            bubbles: true,
            detail : {
                practiceId: practiceId,
                correct   : isCorrect,
                selected  : sel,
                answer    : ans,
            }
        }));

        // API 送出（若有設定 practice-id 才送）
        if (practiceId && Config.apiUrl) {
            fetch(Config.apiUrl + '?action=submit', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({
                    practice_id  : practiceId,
                    unit_id      : unitId,
                    section_id   : sectionId,
                    practice_type: 'mcq',
                    response     : JSON.stringify(sel),
                    is_correct   : isCorrect ? 1 : 0,
                })
            }).catch(function () {});
        }
    };

    // 重試
    BpMcqWidget.prototype._onRetry = function () {
        this.submitted = false;
        this.selected  = [];
        this._optWrap.querySelectorAll('.bp-mcq-opt').forEach(function (btn) {
            btn.disabled  = false;
            btn.className = 'bp-mcq-opt';
        });
        this._feedback.style.display = '';
        this._feedback.className     = 'bp-mcq-feedback';
        this._feedback.innerHTML     = '';
        this._feedback.style.display = 'none';
        this._submitBtn.disabled     = true;
        if (this._retryBtn) this._retryBtn.style.display = 'none';
    };

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('[data-bp="mcq"]:not([data-bp-init])').forEach(function (el) {
            el.setAttribute('data-bp-init', '1');
            el._bpMcq = new BpMcqWidget(el);
        });
    }

    // ── 掛載全域 ─────────────────────────────────────────────────
    G.BpMcq = {
        config  : Config,
        init    : initAll,
        _reCSS  : function () { if (_cssEl) injectCSS(); },
        getInstance: function (el) { return el && el._bpMcq ? el._bpMcq : null; },
    };

    if (Config.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

})(window);

// ================================================================
// bp-fill.js — 填充題元件
//
// 掛載方式：
//   <div data-bp="fill" data-payload='{"question":"I go {{jogging}} every {{Tuesday}} morning."}'></div>
//
// 空格語法（嵌入 question 字串內）：
//   {{答案}}          — 單一正確答案
//   {{答案1/答案2}}   — 多個可接受答案，斜線分隔
//
// payload 欄位：
//   question     {string}  題目（含 {{}} 語法，可含 HTML 格式）
//   hint         {string}  可選提示（答錯時顯示）
//   submitText   {string}  送出按鈕文字（預設「確認答案」）
//   retryText    {string}  重試按鈕文字（預設「↺ 重試」）
//   btnSize      {string}  sm / lg
//   btnPadding   {string}  CSS padding 值
//   btnFontSize  {string}  CSS font-size 值
//
// data-* 屬性：
//   data-case-insensitive  — 不區分大小寫（預設區分）
//   data-show-length       — 輸入框寬度對應答案字元數
//   data-group="groupId"   — 相同 groupId 的題目共用一個送出按鈕
//                            按鈕渲染在同一 group 最後一題的底部
//   data-practice-id       — 對應後端 practice id（有值才送 API）
//   data-unit-id           — 單元 id
//   data-section-id        — 段落 id
//   data-btn-size / data-btn-padding / data-btn-font-size
//   data-submit-text / data-retry-text
//
// 全域設定：
//   BpFill.config.apiUrl        = 'practice_api.php';
//   BpFill.config.autoInit      = true;
//   BpFill.config.allowRetry    = true;
//   BpFill.config.showFeedback  = true;
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
        allowRetry  : true,
        showFeedback: true,
        // ── 色彩主題（CSS 變數名稱或直接色碼皆可）─────────────────
        theme: {
            blank       : 'var(--lavender,#C3A5E5)',  // 空格底線預設色
            blankHover  : 'var(--sky,#04b5a3)',        // 空格 hover / focus 底線色
            correct     : 'var(--safe,#81E6D9)',       // 答對色
            wrong       : 'var(--warning,#F08080)',    // 答錯色
            submit      : 'var(--lavender,#C3A5E5)',   // 送出按鈕背景
            hint        : 'var(--attention,#E5E5A6)',  // 提示左邊框
        },
    };

    // ── CSS 注入（每次呼叫都重新產生，確保 theme 變更生效）────────
    var _cssEl = null;
    function injectCSS() {
        if (!_cssEl) {
            _cssEl = document.createElement('style');
            _cssEl.id = 'bp-fill-styles';
            document.head.appendChild(_cssEl);
        }
        var t = Config.theme;
        _cssEl.textContent = [
            '.bp-fill{font-size:1rem;}',

            /* 題目文字 */
            '.bp-fill-question{',
            'color:var(--shell,#c6c7bd);line-height:2;',
            'font-size:.95rem;margin-bottom:14px;word-break:break-word;}',

            /* 空格 input */
            '.bp-fill-blank{',
            'display:inline-block;',
            'background:var(--input-bg,#111211);',
            'border:none;border-bottom:2px solid ' + t.blank + ';',
            'color:var(--shell,#c6c7bd);',
            'font-size:inherit;font-family:inherit;',
            'padding:1px 6px;margin:0 3px;',
            'border-radius:3px 3px 0 0;',
            'outline:none;',
            'transition:border-color .15s,background .15s;',
            'vertical-align:baseline;',
            'min-width:32px;}',

            '.bp-fill-blank:focus{',
            'border-bottom-color:' + t.blankHover + ';',
            'background:rgba(4,181,163,.06);}',

            '.bp-fill-blank:hover:not(:disabled):not(:focus){',
            'border-bottom-color:' + t.blankHover + ';}',

            '.bp-fill-blank.correct{',
            'border-bottom-color:' + t.correct + ';',
            'background:rgba(129,230,217,.1);',
            'color:' + t.correct + ';}',

            '.bp-fill-blank.wrong{',
            'border-bottom-color:' + t.wrong + ';',
            'background:rgba(240,128,128,.08);',
            'color:' + t.wrong + ';}',

            '.bp-fill-blank:disabled{cursor:default;}',

            /* 答案提示 */
            '.bp-fill-answer-hint{',
            'display:inline-block;',
            'font-size:.75rem;color:' + t.correct + ';',
            'margin-left:4px;vertical-align:baseline;}',

            /* 回饋列 */
            '.bp-fill-feedback{',
            'font-size:.85rem;padding:8px 12px;border-radius:6px;',
            'margin-bottom:10px;line-height:1.55;}',
            '.bp-fill-feedback.ok{',
            'background:rgba(129,230,217,.12);',
            'border:1px solid ' + t.correct + ';',
            'color:' + t.correct + ';}',
            '.bp-fill-feedback.fail{',
            'background:rgba(240,128,128,.1);',
            'border:1px solid ' + t.wrong + ';',
            'color:' + t.wrong + ';}',

            /* 提示文字 */
            '.bp-fill-hint{',
            'font-size:.8rem;color:var(--shell-dim,#888);',
            'margin-top:6px;padding:6px 10px;',
            'border-left:2px solid ' + t.hint + ';',
            'background:rgba(229,229,166,.07);}',

            /* 送出按鈕 */
            '.bp-fill-submit{',
            'background:' + t.submit + ';color:#0c0d0c;',
            'border:none;border-radius:6px;padding:8px 20px;',
            'font-size:.85rem;font-weight:700;cursor:pointer;',
            'transition:opacity .2s;}',
            '.bp-fill-submit:disabled{opacity:.35;cursor:default;}',

            /* 重試按鈕 */
            '.bp-fill-retry{',
            'background:none;border:1px solid var(--card-border,#3a3b3a);',
            'color:var(--shell-dim,#888);border-radius:6px;',
            'padding:7px 18px;font-size:.82rem;cursor:pointer;',
            'margin-left:8px;transition:border-color .15s,color .15s;}',
            '.bp-fill-retry:hover{',
            'border-color:' + t.submit + ';',
            'color:' + t.submit + ';}',

            /* group 送出區 */
            '.bp-fill-group-actions{margin-top:14px;}',
        ].join('');
    }

    // ── 工具 ─────────────────────────────────────────────────────

    function renderQuestion(html) {
        if (G.RichInput && typeof G.RichInput.render === 'function') {
            return G.RichInput.render(html);
        }
        return html || '';
    }

    /**
     * parseQuestion(question)
     * 解析含 {{}} 的題目字串，回傳：
     *   html    : 替換後可插入 DOM 的 HTML（{{}} 換成 <input> 佔位）
     *   blanks  : [{answers: string[], inputId: string}, ...]
     *
     * 注意：先用 RichInput.render() 處理分欄等格式，
     *       再用正則替換 {{}}，確保 HTML 標籤不被截斷。
     */
    function parseQuestion(raw, showLength, uid) {
        var rendered = renderQuestion(raw);
        var blanks   = [];
        var idx      = 0;

        var html = rendered.replace(/\{\{([^}]+)\}\}/g, function (_, inner) {
            var answers = inner.split('/').map(function (a) { return a.trim(); });
            var id      = 'bp-fill-' + uid + '-' + idx;
            // 寬度：showLength 模式用答案最長字元數，否則固定 min-width
            var longest = answers.reduce(function (max, a) {
                return a.length > max ? a.length : max;
            }, 4);
            var widthStyle = showLength
                ? 'width:' + Math.max(2, (longest * 0.5)).toFixed(1) + 'em;'
                : '';
            blanks.push({ answers: answers, inputId: id });
            idx++;
            return '<input type="text" '
                + 'id="' + id + '" '
                + 'class="bp-fill-blank" '
                + 'style="' + widthStyle + '" '
                + 'autocomplete="off" spellcheck="false" '
                + 'data-blank-idx="' + (idx - 1) + '">';
        });

        return { html: html, blanks: blanks };
    }

    // ── BpFillWidget ─────────────────────────────────────────────

    function BpFillWidget(el) {
        this.el          = el;
        this.payload     = {};
        this.blanks      = [];   // [{answers, inputId}]
        this.submitted   = false;
        this._uid        = Math.random().toString(36).slice(2, 8);
        this._parse();
        this._render();
    }

    BpFillWidget.prototype._parse = function () {
        try {
            this.payload = JSON.parse(this.el.getAttribute('data-payload') || '{}');
        } catch (e) {
            this.payload = {};
        }
        this.caseInsensitive = this.el.hasAttribute('data-case-insensitive');
        this.showLength      = this.el.hasAttribute('data-show-length');
        this.groupId         = this.el.getAttribute('data-group') || null;
    };

    BpFillWidget.prototype._render = function () {
        injectCSS();
        var p   = this.payload;
        var el  = this.el;
        el.innerHTML = '';
        el.className = (el.className + ' bp-fill').trim();

        // ── 題目（含空格 input）────────────────────────────────
        if (p.question) {
            var parsed = parseQuestion(p.question, this.showLength, this._uid);
            this.blanks = parsed.blanks;

            var qDiv = document.createElement('div');
            qDiv.className = 'bp-fill-question';
            qDiv.innerHTML = parsed.html;
            el.appendChild(qDiv);

            // Enter 鍵跳至下一格或觸發送出
            var self = this;
            var inputs = qDiv.querySelectorAll('.bp-fill-blank');
            inputs.forEach(function (input, i) {
                input.addEventListener('keydown', function (e) {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    if (i < inputs.length - 1) {
                        inputs[i + 1].focus();
                    } else {
                        // 最後一格 Enter：觸發送出
                        self._triggerSubmit();
                    }
                });
            });
        }

        // ── 回饋區 ─────────────────────────────────────────────
        var fb = document.createElement('div');
        fb.className   = 'bp-fill-feedback';
        fb.style.display = 'none';
        this._feedback = fb;
        el.appendChild(fb);

        // ── 按鈕區（無 group 才在此渲染；group 由 initGroups 統一處理）
        if (!this.groupId) {
            this._appendButtons(el, p);
        }
    };

    // 渲染送出 / 重試按鈕到指定容器
    BpFillWidget.prototype._appendButtons = function (container, p) {
        var self   = this;
        var btnCfg = this._btnConfig(p);

        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-top:10px;';

        var submitBtn = document.createElement('button');
        submitBtn.type      = 'button';
        submitBtn.className = 'bp-fill-submit';
        submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>' + btnCfg.submitText;
        this._styleBtn(submitBtn, btnCfg);
        submitBtn.addEventListener('click', function () { self._onSubmit(); });
        this._submitBtn = submitBtn;
        btnRow.appendChild(submitBtn);

        if (Config.allowRetry) {
            var retryBtn = document.createElement('button');
            retryBtn.type      = 'button';
            retryBtn.className = 'bp-fill-retry';
            retryBtn.style.display = 'none';
            retryBtn.innerHTML = btnCfg.retryText;
            this._styleBtn(retryBtn, btnCfg);
            retryBtn.addEventListener('click', function () { self._onRetry(); });
            this._retryBtn = retryBtn;
            btnRow.appendChild(retryBtn);
        }

        container.appendChild(btnRow);
        this._btnRow = btnRow;
    };

    // 按鈕樣式套用
    BpFillWidget.prototype._styleBtn = function (btn, cfg) {
        if (cfg.btnPadding)  btn.style.padding  = cfg.btnPadding;
        if (cfg.btnFontSize) btn.style.fontSize = cfg.btnFontSize;
        if (cfg.btnSize === 'sm') {
            if (!cfg.btnPadding)  btn.style.padding  = '5px 14px';
            if (!cfg.btnFontSize) btn.style.fontSize = '.78rem';
        } else if (cfg.btnSize === 'lg') {
            if (!cfg.btnPadding)  btn.style.padding  = '11px 28px';
            if (!cfg.btnFontSize) btn.style.fontSize = '1rem';
        }
    };

    BpFillWidget.prototype._btnConfig = function (p) {
        var el = this.el;
        return {
            submitText : p.submitText   || el.getAttribute('data-submit-text')   || '確認答案',
            retryText  : p.retryText    || el.getAttribute('data-retry-text')    || '↺ 重試',
            btnSize    : p.btnSize      || el.getAttribute('data-btn-size')      || '',
            btnPadding : p.btnPadding   || el.getAttribute('data-btn-padding')   || '',
            btnFontSize: p.btnFontSize  || el.getAttribute('data-btn-font-size') || '',
        };
    };

    // 外部觸發送出（Enter 鍵或 group 按鈕用）
    BpFillWidget.prototype._triggerSubmit = function () {
        this._onSubmit();
    };

    // 確認答案
    BpFillWidget.prototype._onSubmit = function () {
        if (this.submitted) return;
        this.submitted = true;

        if (this._submitBtn) this._submitBtn.disabled = true;

        var self      = this;
        var allCorrect = true;
        var results   = [];

        this.blanks.forEach(function (blank) {
            var input     = document.getElementById(blank.inputId);
            if (!input) return;
            input.disabled = true;

            var raw     = input.value;
            var val     = self.caseInsensitive ? raw.trim().toLowerCase() : raw.trim();
            var correct = blank.answers.some(function (a) {
                return self.caseInsensitive
                    ? a.toLowerCase() === val
                    : a === val;
            });

            if (correct) {
                input.classList.add('correct');
            } else {
                input.classList.add('wrong');
                allCorrect = false;
                // 顯示正確答案
                var hint = document.createElement('span');
                hint.className   = 'bp-fill-answer-hint';
                hint.textContent = '→ ' + blank.answers[0];
                input.insertAdjacentElement('afterend', hint);
            }

            results.push({ inputId: blank.inputId, value: raw, correct: correct });
        });

        // 回饋
        if (Config.showFeedback) {
            var fb = this._feedback;
            fb.style.display = '';
            if (allCorrect) {
                fb.className = 'bp-fill-feedback ok';
                fb.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>全部正確！';
            } else {
                fb.className = 'bp-fill-feedback fail';
                fb.innerHTML = '<i class="bi bi-x-circle-fill me-2"></i>有空格答案不正確，正確答案已標示於空格右側。';
                if (this.payload.hint) {
                    fb.innerHTML +=
                        '<div class="bp-fill-hint">' +
                        '<i class="bi bi-lightbulb me-1"></i>' +
                        renderQuestion(this.payload.hint) +
                        '</div>';
                }
            }
        }

        // 顯示重試
        if (this._retryBtn) this._retryBtn.style.display = '';

        // 事件
        var practiceId = parseInt(this.el.getAttribute('data-practice-id') || '0', 10);
        var unitId     = parseInt(this.el.getAttribute('data-unit-id')     || '0', 10);
        var sectionId  = parseInt(this.el.getAttribute('data-section-id') || '0', 10);

        this.el.dispatchEvent(new CustomEvent('bp:answered', {
            bubbles: true,
            detail : {
                practiceId: practiceId,
                correct   : allCorrect,
                results   : results,
            }
        }));

        // API 送出
        if (practiceId && Config.apiUrl) {
            fetch(Config.apiUrl + '?action=submit', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({
                    practice_id  : practiceId,
                    unit_id      : unitId,
                    section_id   : sectionId,
                    practice_type: 'fill',
                    response     : JSON.stringify(results),
                    is_correct   : allCorrect ? 1 : 0,
                })
            }).catch(function () {});
        }
    };

    // 重試
    BpFillWidget.prototype._onRetry = function () {
        this.submitted = false;
        var self = this;

        // 清除答案提示 span
        this.el.querySelectorAll('.bp-fill-answer-hint').forEach(function (s) { s.remove(); });

        this.blanks.forEach(function (blank) {
            var input = document.getElementById(blank.inputId);
            if (!input) return;
            input.disabled  = false;
            input.value     = '';
            input.className = 'bp-fill-blank';
        });

        this._feedback.style.display = 'none';
        this._feedback.className     = 'bp-fill-feedback';
        this._feedback.innerHTML     = '';

        if (this._submitBtn) this._submitBtn.disabled = false;
        if (this._retryBtn)  this._retryBtn.style.display = 'none';

        // 聚焦第一格
        var first = this.el.querySelector('.bp-fill-blank');
        if (first) first.focus();
    };

    // ── Group 處理 ───────────────────────────────────────────────

    /**
     * initGroups()
     * 掃描所有有 data-group 的 widget，同 group 中的最後一個
     * 元素底部插入共用的送出按鈕，送出時依序呼叫每個 widget._onSubmit()
     */
    function initGroups() {
        var groups = {};

        // 收集各 group 的 widget 清單
        document.querySelectorAll('[data-bp="fill"][data-group][data-bp-init]').forEach(function (el) {
            var gid = el.getAttribute('data-group');
            if (!el._bpFill) return;
            if (!groups[gid]) groups[gid] = [];
            groups[gid].push(el._bpFill);
        });

        Object.keys(groups).forEach(function (gid) {
            var widgets = groups[gid];
            if (!widgets.length) return;

            // 按照 DOM 順序排序
            widgets.sort(function (a, b) {
                return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1;
            });

            var lastWidget = widgets[widgets.length - 1];
            var p          = lastWidget.payload;

            // 在最後一個 widget 底部插入 group 按鈕區
            var wrap = document.createElement('div');
            wrap.className = 'bp-fill-group-actions';

            lastWidget._appendButtons(wrap, p);

            // 覆寫 _onSubmit：觸發 group 內所有 widget
            var origSubmit = lastWidget._submitBtn.onclick;
            lastWidget._submitBtn.onclick = null;
            lastWidget._submitBtn.removeEventListener('click', origSubmit);

            lastWidget._submitBtn.addEventListener('click', function () {
                widgets.forEach(function (w) {
                    if (!w.submitted) w._onSubmit();
                });
            });

            if (lastWidget._retryBtn) {
                lastWidget._retryBtn.addEventListener('click', function () {
                    widgets.forEach(function (w) { w._onRetry(); });
                });
            }

            lastWidget.el.appendChild(wrap);
        });
    }

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('[data-bp="fill"]:not([data-bp-init])').forEach(function (el) {
            el.setAttribute('data-bp-init', '1');
            el._bpFill = new BpFillWidget(el);
        });
        initGroups();
    }

    // ── 掛載全域 ─────────────────────────────────────────────────
    G.BpFill = {
        config     : Config,
        init       : initAll,
        _reCSS     : function () { if (_cssEl) injectCSS(); },
        getInstance: function (el) { return el && el._bpFill ? el._bpFill : null; },
    };

    if (Config.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

})(window);

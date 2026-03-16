// ================================================================
// rich-input.js — 富文字輸入元件
//
// 使用方式（HTML）：
//   <rich-input name="content" placeholder="輸入內容…" height="200"></rich-input>
//
// 分欄語法：
//   在任一行輸入 ||| 作為分隔符號，儲存或顯示時自動轉為 Bootstrap col
//   例：左欄內容 ||| 右欄內容 ||| 第三欄
//   → <div class="row g-2"><div class="col">...</div>...</div>
//
// 學員端顯示：
//   element.innerHTML = RichInput.render(storedHTML);
//
// 全域設定（在引入此檔後修改）：
//   RichInput.config.colors = ['#FF0000', ...];
//   RichInput.config.fontSizeStep = 0.2;
//
// 無 Shadow DOM，CSS 自動注入 <head> 一次
// ================================================================

(function (G) {
    'use strict';

    // ── 全域設定 ─────────────────────────────────────────────────
    var Config = {
        colors: [
            '#F08080', // warning（紅）
            '#81E6D9', // safe（綠）
            '#C8DD5A', // special（黃綠）
            '#C3A5E5', // lavender（紫）
            '#f69653', // orange
            '#90CDF4', // info（藍）
            '#FFB3D9', // pink
            '#04b5a3', // sky
            '#c6c7bd', // shell（灰白）
        ],
        fontSizeStep : 0.15,  // 每次放大/縮小的 em 增量
        minFontSize  : 0.65,
        maxFontSize  : 2.6,
    };

    // ── CSS 注入（全域只注入一次）────────────────────────────────
    var _cssInjected = false;
    function injectCSS() {
        if (_cssInjected) return;
        _cssInjected = true;
        var s = document.createElement('style');
        s.id = 'rich-input-styles';
        s.textContent = [
            /* ── 外框 ── */
            '.ri-wrap{border:1px solid var(--input-border,#444);border-radius:6px;overflow:hidden;background:var(--input-bg,#141514);}',
            '.ri-wrap:focus-within{border-color:var(--lavender,#C3A5E5);box-shadow:0 0 0 2px rgba(195,165,229,.18);}',

            /* ── 工具列 ── */
            '.ri-toolbar{display:flex;align-items:center;gap:2px;padding:5px 8px;',
            'background:var(--area2,#2a2b2a);border-bottom:1px solid var(--input-border,#444);flex-wrap:wrap;}',

            /* ── 按鈕 ── */
            '.ri-btn{background:none;border:1px solid transparent;color:var(--shell,#c6c7bd);',
            'border-radius:4px;padding:3px 8px;font-size:.78rem;cursor:pointer;',
            'line-height:1.4;transition:background .15s,border-color .15s,color .15s;white-space:nowrap;}',
            '.ri-btn:hover{background:rgba(195,165,229,.12);border-color:var(--lavender,#C3A5E5);color:var(--lavender,#C3A5E5);}',
            '.ri-btn.ri-active{background:rgba(195,165,229,.22);border-color:var(--lavender,#C3A5E5);color:var(--lavender,#C3A5E5);}',

            /* ── 分隔線 ── */
            '.ri-sep{width:1px;height:18px;background:var(--input-border,#444);margin:0 3px;flex-shrink:0;}',

            /* ── 編輯區 ── */
            '.ri-editor{outline:none;padding:10px 14px;color:var(--shell,#c6c7bd);',
            'font-size:1rem;line-height:1.75;word-break:break-word;background:transparent;}',
            '.ri-editor:empty::before{content:attr(data-placeholder);color:var(--placeholder,#555);pointer-events:none;}',
            '.ri-editor .row{margin-top:4px;margin-bottom:4px;}',

            /* ── 原始碼區 ── */
            '.ri-source{display:none;width:100%;padding:10px 14px;',
            'background:#080908;color:#90CDF4;border:none;outline:none;',
            'font-family:monospace;font-size:.8rem;line-height:1.65;resize:vertical;box-sizing:border-box;}',

            /* ── 色彩選擇器 ── */
            '.ri-cpicker{position:relative;display:inline-block;}',
            '.ri-cpanel{display:none;position:absolute;top:calc(100% + 5px);left:0;',
            'background:var(--area,#1a1b1a);border:1px solid var(--card-border,#2e2f2e);',
            'border-radius:6px;padding:9px;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.45);min-width:175px;}',
            '.ri-cpanel.open{display:block;}',
            '.ri-swatches{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;}',
            '.ri-swatch{width:20px;height:20px;border-radius:4px;cursor:pointer;',
            'border:2px solid transparent;transition:border-color .15s,transform .15s;}',
            '.ri-swatch:hover{border-color:var(--shell,#c6c7bd);transform:scale(1.18);}',
            '.ri-crow{display:flex;align-items:center;gap:7px;',
            'font-size:.74rem;color:var(--shell-dim,#888);}',
            '.ri-crow input[type="color"]{width:24px;height:24px;border:1px solid var(--input-border,#444);',
            'border-radius:4px;cursor:pointer;padding:1px;background:none;}',

            /* ── 分欄提示標籤（工具列說明用）── */
            '.ri-hint{font-size:.7rem;color:#555;padding:0 5px;white-space:nowrap;}',
            '.ri-hint code{color:var(--lavender,#C3A5E5);}',
        ].join('');
        document.head.appendChild(s);
    }

    // ── 工具函式 ─────────────────────────────────────────────────

    /** 在選取文字上包一個 <span style="..."> */
    function wrapSelection(styles) {
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
        var range = sel.getRangeAt(0);
        var span  = document.createElement('span');
        Object.keys(styles).forEach(function (k) { span.style[k] = styles[k]; });
        try {
            range.surroundContents(span);
        } catch (e) {
            // 跨多節點時 surroundContents 失敗，改用 extractContents
            span.appendChild(range.extractContents());
            range.insertNode(span);
        }
        // 重選 span 內容，保持選取狀態
        var nr = document.createRange();
        nr.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(nr);
    }

    /** 取得選取文字所在容器的目前 font-size（em 單位） */
    function getCurrentFontSizeEm(editorEl) {
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return 1;
        var node = sel.getRangeAt(0).commonAncestorContainer;
        var el   = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        var pxRoot   = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        var pxCurrent = parseFloat(getComputedStyle(el).fontSize) || 16;
        return pxCurrent / pxRoot;
    }

    /** 基本 XSS 過濾（原始碼模式用） */
    function sanitize(html) {
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript\s*:/gi, '#');
    }

    // ── ||| 分欄處理 ────────────────────────────────────────────

    /**
     * processColumns(html)
     * 偵測兩種結構：
     *  A) 有 block 元素（div/p/h*）→ 逐一對每個 block 的 innerHTML split
     *  B) 純文字 + 行內元素（span/b/i）→ 整個 innerHTML 一次 split
     * 兩種情況都對字串 split，不做 DOM 遞迴，確保 <span> 色彩完整保留。
     */
    function processColumns(html) {
        if (!html || html.indexOf('|||') === -1) return html;

        var BLOCK_TAGS = { DIV:1, P:1, H1:1, H2:1, H3:1, H4:1, H5:1, H6:1, LI:1 };

        function makeRow(parts) {
            return '<div class="row g-2">'
                + parts.map(function (p) {
                    return '<div class="col">' + p.trim() + '</div>';
                }).join('')
                + '</div>';
        }

        var tmp = document.createElement('div');
        tmp.innerHTML = html;

        // 有 block 子元素：逐一處理每個 block
        var blockChildren = Array.from(tmp.children).filter(function (el) {
            return BLOCK_TAGS[el.tagName];
        });

        if (blockChildren.length > 0) {
            blockChildren.forEach(function (block) {
                if (block.innerHTML.indexOf('|||') === -1) return;
                var parts = block.innerHTML.split(/\s*\|\|\|\s*/);
                if (parts.length < 2) return;
                var row = document.createElement('div');
                row.innerHTML = makeRow(parts);
                block.parentNode.replaceChild(row.firstChild, block);
            });
            return tmp.innerHTML;
        }

        // 無 block 子元素（純文字 + 行內 span/b/i）：整個 innerHTML 一次 split
        var parts = tmp.innerHTML.split(/\s*\|\|\|\s*/);
        if (parts.length >= 2) {
            tmp.innerHTML = makeRow(parts);
        }

        return tmp.innerHTML;
    }

    // ── RichInputElement ─────────────────────────────────────────

    function RichInputElement(el) {
        this.el          = el;
        this._sourceMode = false;
        this._colorOpen  = false;
        this._init();
    }

    RichInputElement.prototype._init = function () {
        injectCSS();

        var el      = this.el;
        var name    = el.getAttribute('name')        || '';
        var ph      = el.getAttribute('placeholder') || '輸入內容…';
        var height  = parseInt(el.getAttribute('height') || '200', 10);
        var initVal = el.getAttribute('value') || el.textContent.trim() || '';
        var colors  = el.getAttribute('colors')
                      ? el.getAttribute('colors').split(',').map(function (c) { return c.trim(); })
                      : Config.colors;

        el.innerHTML = '';

        // ── DOM 結構 ─────────────────────────────────────────────
        var wrap    = document.createElement('div');
        wrap.className = 'ri-wrap';

        var toolbar = document.createElement('div');
        toolbar.className = 'ri-toolbar';
        toolbar.innerHTML = this._buildToolbar(colors);

        var editor  = document.createElement('div');
        editor.className       = 'ri-editor';
        editor.contentEditable = 'true';
        editor.setAttribute('data-placeholder', ph);
        editor.style.minHeight = height + 'px';
        if (initVal) editor.innerHTML = initVal;

        var source  = document.createElement('textarea');
        source.className   = 'ri-source';
        source.style.minHeight = height + 'px';

        var hidden  = document.createElement('input');
        hidden.type  = 'hidden';
        hidden.name  = name;
        hidden.value = processColumns(initVal);

        wrap.appendChild(toolbar);
        wrap.appendChild(editor);
        wrap.appendChild(source);
        el.appendChild(wrap);
        el.appendChild(hidden);

        this._toolbar = toolbar;
        this._editor  = editor;
        this._source  = source;
        this._hidden  = hidden;

        this._bindEvents();
    };

    RichInputElement.prototype._buildToolbar = function (colors) {
        var swatches = colors.map(function (c) {
            return '<span class="ri-swatch" data-color="' + c + '" '
                 + 'style="background:' + c + ';" title="' + c + '"></span>';
        }).join('');

        return ''
            // 粗體
            + '<button type="button" class="ri-btn" data-cmd="bold" title="粗體 Ctrl+B"><b>B</b></button>'
            // 斜體
            + '<button type="button" class="ri-btn" data-cmd="italic" title="斜體 Ctrl+I"><i>I</i></button>'
            // 換行
            + '<button type="button" class="ri-btn" data-cmd="br" title="插入換行 &lt;br&gt; (Shift+Enter)">↵ br</button>'
            + '<span class="ri-sep"></span>'
            // 放大
            + '<button type="button" class="ri-btn" data-cmd="bigger" title="放大字體">A＋</button>'
            // 縮小
            + '<button type="button" class="ri-btn" data-cmd="smaller" title="縮小字體">A－</button>'
            + '<span class="ri-sep"></span>'
            // 色彩
            + '<div class="ri-cpicker">'
            +   '<button type="button" class="ri-btn ri-cbtn" data-cmd="color" title="文字色彩">'
            +     '<span class="ri-cpreview" style="display:inline-block;width:11px;height:11px;'
            +     'border-radius:2px;background:var(--lavender,#C3A5E5);vertical-align:middle;margin-right:3px;"></span>'
            +     '色彩'
            +   '</button>'
            +   '<div class="ri-cpanel">'
            +     '<div class="ri-swatches">' + swatches + '</div>'
            +     '<div class="ri-crow">'
            +       '<input type="color" class="ri-customcolor" value="#ffffff" title="自訂色彩">'
            +       '<span>自訂色彩</span>'
            +     '</div>'
            +   '</div>'
            + '</div>'
            + '<span class="ri-sep"></span>'
            // 原始碼
            + '<button type="button" class="ri-btn ri-srcbtn" data-cmd="source" title="切換原始碼模式">&lt;/&gt;</button>'
            + '<span class="ri-sep"></span>'
            // 分欄提示
            + '<span class="ri-hint">分欄：<code>|||</code></span>';
    };

    RichInputElement.prototype._bindEvents = function () {
        var self    = this;
        var editor  = this._editor;
        var source  = this._source;
        var toolbar = this._toolbar;

        // ── 工具列 mousedown（防止 editor 失焦）──────────────────
        toolbar.addEventListener('mousedown', function (e) {
            // 整個工具列的 mousedown 一律阻擋預設，防止 editor 失焦
            // （色彩面板內的 input[type=color] 除外，讓它能正常取得焦點）
            if (e.target.type === 'color') return;
            e.preventDefault();

            var btn = e.target.closest('[data-cmd]');
            if (!btn) return;
            var cmd = btn.getAttribute('data-cmd');
            if (cmd === 'color') return; // 色彩按鈕由 click 事件處理開關面板
            self._exec(cmd);
        });

        // ── 色彩面板切換 ────────────────────────────────────────
        toolbar.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-cmd="color"]');
            if (btn) {
                // 開啟面板前先儲存目前選取範圍
                var sel = window.getSelection();
                self._savedRange = (sel && sel.rangeCount > 0 && !sel.isCollapsed)
                    ? sel.getRangeAt(0).cloneRange()
                    : null;
                self._colorOpen = !self._colorOpen;
                var panel = toolbar.querySelector('.ri-cpanel');
                if (panel) panel.classList.toggle('open', self._colorOpen);
                return;
            }
            // 色塊點擊
            var swatch = e.target.closest('.ri-swatch');
            if (swatch) {
                self._applyColor(swatch.getAttribute('data-color'));
                self._closeColor();
            }
        });

        // 自訂色彩 input
        var customColor = toolbar.querySelector('.ri-customcolor');
        if (customColor) {
            customColor.addEventListener('input', function () {
                self._applyColor(this.value);
            });
            customColor.addEventListener('mousedown', function (e) {
                e.stopPropagation(); // 防止面板被 document click 關掉
            });
        }

        // 點擊元件外部關閉色彩面板
        document.addEventListener('click', function (e) {
            if (!self._toolbar.querySelector('.ri-cpicker').contains(e.target)) {
                self._closeColor();
            }
        });

        // ── 編輯區 input → 同步 hidden ──────────────────────────
        editor.addEventListener('input', function () {
            self._sync();
        });

        // ── 原始碼區 input → 同步 hidden ────────────────────────
        source.addEventListener('input', function () {
            self._hidden.value = sanitize(source.value);
        });

        // ── 鍵盤快捷鍵 ──────────────────────────────────────────
        editor.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault(); self._exec('bold');
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault(); self._exec('italic');
            }
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault(); self._exec('br');
            }
        });
    };

    // ── 指令執行 ─────────────────────────────────────────────────
    RichInputElement.prototype._exec = function (cmd) {
        var editor = this._editor;

        switch (cmd) {

            case 'bold':
                document.execCommand('bold', false, null);
                break;

            case 'italic':
                document.execCommand('italic', false, null);
                break;

            case 'br': {
                var sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) break;
                var range = sel.getRangeAt(0);
                var br = document.createElement('br');
                range.deleteContents();
                range.insertNode(br);
                range.setStartAfter(br);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                break;
            }

            case 'bigger':
            case 'smaller': {
                var pxRoot = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
                var curPx  = getCurrentFontSizeEm(editor) * pxRoot;
                var stepPx = Config.fontSizeStep * pxRoot;
                var minPx  = Config.minFontSize  * pxRoot;
                var maxPx  = Config.maxFontSize  * pxRoot;
                var nextPx = cmd === 'bigger'
                    ? Math.min(curPx + stepPx, maxPx)
                    : Math.max(curPx - stepPx, minPx);
                wrapSelection({ fontSize: nextPx.toFixed(1) + 'px' });
                break;
            }

            case 'source':
                this._toggleSource();
                break;
        }

        if (cmd !== 'source') {
            editor.focus();
            this._sync();
        }
    };

    // ── 色彩 ─────────────────────────────────────────────────────
    RichInputElement.prototype._applyColor = function (color) {
        this._editor.focus();

        // 恢復面板開啟前儲存的選取範圍
        if (this._savedRange) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this._savedRange);
            this._savedRange = null;
        }

        var sel2 = window.getSelection();
        if (!sel2 || sel2.isCollapsed) return;

        // 更新工具列預覽色塊
        var preview = this._toolbar.querySelector('.ri-cpreview');
        if (preview) preview.style.background = color;

        wrapSelection({ color: color });
        this._sync();
    };

    RichInputElement.prototype._closeColor = function () {
        var panel = this._toolbar.querySelector('.ri-cpanel');
        if (panel) panel.classList.remove('open');
        this._colorOpen = false;
    };

    // ── 原始碼切換 ───────────────────────────────────────────────
    RichInputElement.prototype._toggleSource = function () {
        this._sourceMode = !this._sourceMode;
        var srcBtn = this._toolbar.querySelector('.ri-srcbtn');

        if (this._sourceMode) {
            // 視覺 → 原始碼
            this._source.value    = this._editor.innerHTML;
            this._editor.style.display = 'none';
            this._source.style.display = 'block';
            if (srcBtn) srcBtn.classList.add('ri-active');
            this._source.focus();
        } else {
            // 原始碼 → 視覺
            this._editor.innerHTML    = sanitize(this._source.value);
            this._source.style.display = 'none';
            this._editor.style.display = '';
            if (srcBtn) srcBtn.classList.remove('ri-active');
            this._editor.focus();
            this._sync();
        }
    };

    // ── 同步 hidden input ─────────────────────────────────────────
    RichInputElement.prototype._sync = function () {
        this._hidden.value = processColumns(this._editor.innerHTML);
    };

    // ── 公開方法 ─────────────────────────────────────────────────
    /** 取得目前值（已處理分欄的 HTML） */
    RichInputElement.prototype.getValue = function () {
        return this._hidden.value;
    };

    /** 設定值 */
    RichInputElement.prototype.setValue = function (html) {
        this._editor.innerHTML = html || '';
        this._sync();
    };

    /** 清空 */
    RichInputElement.prototype.clear = function () {
        this._editor.innerHTML = '';
        this._hidden.value = '';
    };

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('rich-input:not([data-ri])').forEach(function (el) {
            el.setAttribute('data-ri', '1');
            el._ri = new RichInputElement(el);
        });
    }

    // ── 掛載到全域 ───────────────────────────────────────────────
    G.RichInput = {
        /** 全域設定，可在引入後修改 */
        config: Config,

        /**
         * 學員端渲染：把儲存的 HTML 處理 ||| 分欄後輸出
         * 用法：element.innerHTML = RichInput.render(storedHTML);
         */
        render: function (html) {
            return processColumns(html || '');
        },

        /** 手動觸發初始化（動態插入的 <rich-input> 用） */
        init: initAll,

        /** 取得特定元素的實例 */
        getInstance: function (el) {
            return (el && el._ri) ? el._ri : null;
        },
    };

    // DOM 就緒後自動初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

})(window);

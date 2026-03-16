// ================================================================
// bp-notice.js — 公告 / 廣告 / Sticky Bar 元件
//
// 掛載方式：
//   <!-- 公告 -->
//   <bp-notice type="announcement" notice-id="maint-2026-03">
//     系統將於週日 02:00–04:00 進行維護。
//   </bp-notice>
//
//   <!-- 廣告 / 促銷 -->
//   <bp-notice type="promo" dismissible cta-text="立即報名" cta-href="/register">
//     雅思衝刺班 4 月開課，限額 12 人！
//   </bp-notice>
//
//   <!-- Sticky Bar（底部固定）-->
//   <bp-notice type="sticky" position="bottom" dismissible>
//     今日學習進度：3 / 5 段落
//   </bp-notice>
//
//   <!-- PHP 動態內容 -->
//   <bp-notice type="announcement" notice-id="<?= $noticeId ?>">
//     <?= htmlspecialchars($noticeText) ?>
//   </bp-notice>
//
// 屬性：
//   type          announcement | promo | sticky（預設 announcement）
//   position      top | bottom（sticky 時有效，預設 bottom）
//   notice-id     {string} 若設定，關閉後以 localStorage 記憶，下次不再顯示
//   dismissible             有此屬性則顯示關閉按鈕
//   icon          {string} Bootstrap Icons class（預設依 type 自動選）
//   cta-text      {string} 行動呼叫按鈕文字
//   cta-href      {string} 行動呼叫按鈕連結
//   cta-target    {string} _blank 等（預設 _self）
//   auto-dismiss  {number} 幾秒後自動關閉（0 = 不自動關閉）
//   color         {string} 覆蓋顏色：accent | correct | wrong | warning | special
//                          或直接輸入 CSS 色碼
//   no-anim                 停用動畫
//
// 全域設定：
//   BpNotice.config.theme.accent = '#C3A5E5';
//   BpNotice.config.stickyOffset = '64px'; // 避開 navbar
//
// 事件：
//   bp:notice-close  → detail: { noticeId }
//   bp:notice-cta    → detail: { noticeId, href }
//
// 無 Shadow DOM，CSS 注入 <head>
// ================================================================

(function (G) {
    'use strict';

    // ── 全域設定 ─────────────────────────────────────────────────
    var Config = {
        autoInit     : true,
        stickyOffset : '0px',   // sticky bar 距離頂部或底部的偏移（避開 navbar）
        theme: {
            accent      : 'var(--lavender,#C3A5E5)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            warning     : 'var(--attention,#E5E5A6)',
            special     : 'var(--special,#C8DD5A)',
            text        : 'var(--shell,#c6c7bd)',
            bg          : 'var(--area,#1a1b1a)',
            border      : 'var(--card-border,#2e2f2e)',
            ctaBg       : 'var(--lavender,#C3A5E5)',
            ctaText     : '#0c0d0c',
            closeColor  : 'var(--shell-dim,#888)',
        },
    };

    // ── 預設圖示（依 type）───────────────────────────────────────
    var DEFAULT_ICONS = {
        announcement : 'bi-megaphone-fill',
        promo        : 'bi-tag-fill',
        sticky       : 'bi-info-circle-fill',
    };

    // ── CSS 注入 ─────────────────────────────────────────────────
    var _cssEl = null;
    function injectCSS() {
        if (!_cssEl) {
            _cssEl = document.createElement('style');
            _cssEl.id = 'bp-notice-styles';
            document.head.appendChild(_cssEl);
        }
        var t = Config.theme;
        _cssEl.textContent = [

            /* ── 基礎容器 ── */
            '.bpn-box{',
            'display:flex;align-items:center;gap:10px;',
            'padding:11px 16px;',
            'background:' + t.bg + ';',
            'border:1px solid ' + t.border + ';',
            'border-left:3px solid ' + t.accent + ';',
            'border-radius:7px;',
            'font-size:.88rem;',
            'color:' + t.text + ';',
            'line-height:1.55;',
            'position:relative;',
            'transition:opacity .25s,transform .25s;}',

            /* 出現動畫 */
            '@keyframes bpn-slidein{',
            'from{opacity:0;transform:translateY(-8px)}',
            'to{opacity:1;transform:translateY(0)}}',
            '.bpn-box.anim{animation:bpn-slidein .25s ease forwards;}',

            /* sticky 從下方滑入 */
            '@keyframes bpn-slideup{',
            'from{opacity:0;transform:translateY(16px)}',
            'to{opacity:1;transform:translateY(0)}}',
            '.bpn-box.anim-up{animation:bpn-slideup .28s ease forwards;}',

            /* 關閉動畫 */
            '.bpn-box.closing{opacity:0;transform:translateY(-6px);pointer-events:none;}',
            '.bpn-box.closing-down{opacity:0;transform:translateY(10px);pointer-events:none;}',

            /* 圖示 */
            '.bpn-icon{flex-shrink:0;font-size:1rem;}',

            /* 內容 */
            '.bpn-content{flex:1;min-width:0;}',

            /* CTA 按鈕 */
            '.bpn-cta{',
            'flex-shrink:0;',
            'background:' + t.ctaBg + ';',
            'color:' + t.ctaText + ';',
            'border:none;border-radius:5px;',
            'padding:5px 14px;font-size:.8rem;font-weight:700;',
            'cursor:pointer;white-space:nowrap;',
            'text-decoration:none;display:inline-block;',
            'transition:opacity .15s;}',
            '.bpn-cta:hover{opacity:.85;color:' + t.ctaText + ';}',

            /* 關閉按鈕 */
            '.bpn-close{',
            'flex-shrink:0;',
            'background:none;border:none;',
            'color:' + t.closeColor + ';',
            'cursor:pointer;font-size:1rem;',
            'padding:2px 4px;border-radius:4px;',
            'line-height:1;',
            'transition:color .15s;}',
            '.bpn-close:hover{color:' + t.text + ';}',

            /* ── Sticky ── */
            'bp-notice[type="sticky"]{',
            'display:block;',
            'position:fixed;',
            'left:0;right:0;',
            'z-index:1040;',
            'padding:0 16px;}',
            'bp-notice[type="sticky"][position="top"]{top:' + Config.stickyOffset + ';}',
            'bp-notice[type="sticky"]:not([position="top"]){bottom:' + Config.stickyOffset + ';}',
            'bp-notice[type="sticky"] .bpn-box{',
            'border-radius:0;border-left-width:1px;',
            'border-top:2px solid ' + t.accent + ';',
            'max-width:100%;',
            'justify-content:center;}',

            /* ── 顏色變體（color 屬性）── */
            '.bpn-box[data-color="correct"]{border-left-color:' + t.correct + ';}',
            '.bpn-box[data-color="correct"] .bpn-icon{color:' + t.correct + ';}',
            '.bpn-box[data-color="wrong"]{border-left-color:' + t.wrong + ';}',
            '.bpn-box[data-color="wrong"] .bpn-icon{color:' + t.wrong + ';}',
            '.bpn-box[data-color="warning"]{border-left-color:' + t.warning + ';}',
            '.bpn-box[data-color="warning"] .bpn-icon{color:' + t.warning + ';}',
            '.bpn-box[data-color="special"]{border-left-color:' + t.special + ';}',
            '.bpn-box[data-color="special"] .bpn-icon{color:' + t.special + ';}',
            '.bpn-box[data-color="accent"]{border-left-color:' + t.accent + ';}',
            '.bpn-box[data-color="accent"] .bpn-icon{color:' + t.accent + ';}',

            /* sticky 顏色變體改上邊框 */
            'bp-notice[type="sticky"] .bpn-box[data-color="correct"]{border-top-color:' + t.correct + ';}',
            'bp-notice[type="sticky"] .bpn-box[data-color="wrong"]{border-top-color:' + t.wrong + ';}',
            'bp-notice[type="sticky"] .bpn-box[data-color="warning"]{border-top-color:' + t.warning + ';}',
            'bp-notice[type="sticky"] .bpn-box[data-color="special"]{border-top-color:' + t.special + ';}',
        ].join('');
    }

    // ── 色彩解析（color 屬性）───────────────────────────────────
    // 預設 token 用 data-color，直接色碼用 inline style
    var COLOR_TOKENS = ['accent','correct','wrong','warning','special'];

    function applyColor(box, colorAttr) {
        if (!colorAttr) return;
        if (COLOR_TOKENS.indexOf(colorAttr) !== -1) {
            box.setAttribute('data-color', colorAttr);
        } else {
            // 直接色碼
            box.style.borderLeftColor = colorAttr;
            var icon = box.querySelector('.bpn-icon');
            if (icon) icon.style.color = colorAttr;
            // sticky 改上邊框
            if (box.closest('bp-notice[type="sticky"]')) {
                box.style.borderTopColor = colorAttr;
            }
        }
    }

    // ── BpNoticeWidget ───────────────────────────────────────────
    function BpNoticeWidget(el) {
        this.el = el;
        this._closed = false;
        this._parse();
        this._render();
    }

    BpNoticeWidget.prototype._parse = function () {
        var el = this.el;
        this._type        = el.getAttribute('type')         || 'announcement';
        this._position    = el.getAttribute('position')     || 'bottom';
        this._noticeId    = el.getAttribute('notice-id')    || '';
        this._dismissible = el.hasAttribute('dismissible');
        this._icon        = el.getAttribute('icon')         || DEFAULT_ICONS[this._type] || 'bi-info-circle-fill';
        this._ctaText     = el.getAttribute('cta-text')     || '';
        this._ctaHref     = el.getAttribute('cta-href')     || '#';
        this._ctaTarget   = el.getAttribute('cta-target')   || '_self';
        this._autoDismiss = parseInt(el.getAttribute('auto-dismiss') || '0', 10);
        this._color       = el.getAttribute('color')        || '';
        this._noAnim      = el.hasAttribute('no-anim');
        // 保存原始內容 HTML（data-content 屬性優先，否則用子節點）
        this._contentHtml = el.getAttribute('data-content') || el.innerHTML.trim();
    };

    BpNoticeWidget.prototype._render = function () {
        injectCSS();
        var el   = this.el;
        var self = this;

        // 若已在 localStorage 關閉過，直接隱藏
        if (this._noticeId && this._wasClosedBefore()) {
            el.style.display = 'none';
            return;
        }

        el.innerHTML = '';

        var isSticky = this._type === 'sticky';

        // 外框
        var box = document.createElement('div');
        box.className = 'bpn-box';
        if (!this._noAnim) {
            box.classList.add(isSticky && this._position !== 'top' ? 'anim-up' : 'anim');
        }
        applyColor(box, this._color);
        this._box = box;

        // 圖示
        var icon = document.createElement('i');
        icon.className = 'bi ' + this._icon + ' bpn-icon';
        box.appendChild(icon);

        // 內容
        var content = document.createElement('div');
        content.className = 'bpn-content';
        content.innerHTML = this._contentHtml;
        box.appendChild(content);

        // CTA 按鈕
        if (this._ctaText) {
            var cta = document.createElement('a');
            cta.className  = 'bpn-cta';
            cta.href       = this._ctaHref;
            cta.target     = this._ctaTarget;
            cta.textContent = this._ctaText;
            if (this._ctaTarget === '_blank') cta.rel = 'noopener';
            cta.addEventListener('click', function () {
                el.dispatchEvent(new CustomEvent('bp:notice-cta', {
                    bubbles: true,
                    detail : { noticeId: self._noticeId, href: self._ctaHref },
                }));
            });
            box.appendChild(cta);
        }

        // 關閉按鈕
        if (this._dismissible) {
            var closeBtn = document.createElement('button');
            closeBtn.type      = 'button';
            closeBtn.className = 'bpn-close';
            closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
            closeBtn.setAttribute('aria-label', '關閉');
            closeBtn.addEventListener('click', function () { self.close(); });
            box.appendChild(closeBtn);
        }

        el.appendChild(box);

        // 自動關閉
        if (this._autoDismiss > 0) {
            setTimeout(function () { self.close(); }, this._autoDismiss * 1000);
        }
    };

    // 關閉
    BpNoticeWidget.prototype.close = function () {
        if (this._closed) return;
        this._closed = true;
        var el   = this.el;
        var box  = this._box;
        var self = this;
        var isDown = this._type === 'sticky' && this._position !== 'top';

        if (!this._noAnim && box) {
            box.classList.add(isDown ? 'closing-down' : 'closing');
            setTimeout(function () { el.style.display = 'none'; }, 280);
        } else {
            el.style.display = 'none';
        }

        // 記憶關閉狀態
        if (this._noticeId) {
            try { localStorage.setItem('bpn-closed-' + this._noticeId, '1'); } catch (e) {}
        }

        el.dispatchEvent(new CustomEvent('bp:notice-close', {
            bubbles: true,
            detail : { noticeId: this._noticeId },
        }));
    };

    // 重新顯示（清除記憶）
    BpNoticeWidget.prototype.show = function () {
        this._closed = false;
        if (this._noticeId) {
            try { localStorage.removeItem('bpn-closed-' + this._noticeId); } catch (e) {}
        }
        this.el.style.display = '';
        this._render();
    };

    // 更新內容（PHP 動態更新後呼叫）
    BpNoticeWidget.prototype.setContent = function (html) {
        this._contentHtml = html;
        var content = this._box && this._box.querySelector('.bpn-content');
        if (content) content.innerHTML = html;
    };

    BpNoticeWidget.prototype._wasClosedBefore = function () {
        try { return !!localStorage.getItem('bpn-closed-' + this._noticeId); } catch (e) { return false; }
    };

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('bp-notice:not([data-bp-init])').forEach(function (el) {
            el.setAttribute('data-bp-init', '1');
            el._bpNotice = new BpNoticeWidget(el);
        });
    }

    // ── 全域 API ─────────────────────────────────────────────────
    G.BpNotice = {
        config     : Config,
        init       : initAll,
        _reCSS     : function () { if (_cssEl) injectCSS(); },

        /** 關閉指定元件 */
        close: function (el) {
            if (typeof el === 'string') el = document.getElementById(el);
            if (el && el._bpNotice) el._bpNotice.close();
        },

        /** 重新顯示（清除記憶）*/
        show: function (el) {
            if (typeof el === 'string') el = document.getElementById(el);
            if (el && el._bpNotice) el._bpNotice.show();
        },

        /** 更新內容 */
        setContent: function (el, html) {
            if (typeof el === 'string') el = document.getElementById(el);
            if (el && el._bpNotice) el._bpNotice.setContent(html);
        },

        getInstance: function (el) {
            if (typeof el === 'string') el = document.getElementById(el);
            return (el && el._bpNotice) ? el._bpNotice : null;
        },
    };

    if (Config.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

})(window);

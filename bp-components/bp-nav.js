// ================================================================
// bp-nav.js — 導覽選單元件
//
// 掛載方式：
//   <bp-nav layout="horizontal|vertical" id="myNav">
//     <a href="/dashboard" active>儀表板</a>
//     <a data-group="課程管理">          ← 第一層群組（不跳頁，只展開）
//       <a href="/courses">所有課程</a>
//       <a href="/units">單元管理</a>
//     </a>
//     <a href="/messages">訊息</a>
//   </bp-nav>
//
// 收合按鈕：
//   <button onclick="BpNav.toggle('myNav')">選單</button>
//   或設定 data-toggle="myNav" 自動綁定
//
// 屬性：
//   layout        horizontal | vertical（預設 horizontal）
//   collapsed     有此屬性則初始收合
//   storage-key   sessionStorage 的 key（預設 bp-nav-{id}）
//
// 全域設定：
//   BpNav.config.theme.accent = '#C3A5E5';
//
// 無 Shadow DOM，CSS 注入 <head>
// ================================================================

(function (G) {
    'use strict';

    // ── 全域設定 ─────────────────────────────────────────────────
    var Config = {
        autoInit: true,
        theme: {
            bg          : 'var(--area,#1a1b1a)',          // 選單背景
            border      : 'var(--card-border,#2e2f2e)',   // 邊框
            text        : 'var(--shell,#c6c7bd)',          // 文字
            textDim     : 'var(--shell-dim,#888)',         // 次要文字
            accent      : 'var(--lavender,#C3A5E5)',      // active / hover 強調色
            activeText  : 'var(--lavender,#C3A5E5)',      // active 連結文字
            activeBg    : 'rgba(195,165,229,.12)',         // active 連結背景
            hoverBg     : 'rgba(195,165,229,.07)',         // hover 背景
            groupArrow  : 'var(--shell-dim,#888)',         // 箭頭色
            indent      : 'var(--card-border,#2e2f2e)',   // 第二層縮排線色
            toggleColor : 'var(--shell,#c6c7bd)',          // 收合按鈕色
        },
    };

    // ── CSS 注入 ─────────────────────────────────────────────────
    var _cssEl = null;
    function injectCSS() {
        if (!_cssEl) {
            _cssEl = document.createElement('style');
            _cssEl.id = 'bp-nav-styles';
            document.head.appendChild(_cssEl);
        }
        var t = Config.theme;
        _cssEl.textContent = [

            /* ── 外層容器 ── */
            'bp-nav{display:block;}',

            /* ── 收合動畫容器 ── */
            '.bpn-inner{overflow:hidden;transition:max-height .28s cubic-bezier(.4,0,.2,1),opacity .2s;}',
            '.bpn-inner.collapsed{max-height:0!important;opacity:0;pointer-events:none;}',
            '.bpn-inner.no-anim{transition:none!important;}',

            /* ════════════════════════════════════════
               橫排 layout
            ════════════════════════════════════════ */
            'bp-nav[layout="horizontal"] .bpn-inner{',
            'display:flex;align-items:center;gap:4px;flex-wrap:wrap;',
            'max-height:200px;}',

            /* 橫排連結 */
            'bp-nav[layout="horizontal"] .bpn-link{',
            'display:flex;align-items:center;gap:6px;',
            'color:' + t.text + ';text-decoration:none;',
            'padding:7px 14px;border-radius:6px;',
            'font-size:.88rem;white-space:nowrap;',
            'transition:background .15s,color .15s;}',
            'bp-nav[layout="horizontal"] .bpn-link:hover{',
            'background:' + t.hoverBg + ';color:' + t.accent + ';}',
            'bp-nav[layout="horizontal"] .bpn-link.active{',
            'background:' + t.activeBg + ';color:' + t.activeText + ';font-weight:600;}',

            /* ════════════════════════════════════════
               垂直 layout
            ════════════════════════════════════════ */
            'bp-nav[layout="vertical"] .bpn-inner{',
            'display:flex;flex-direction:column;gap:2px;max-height:2000px;}',

            /* 第一層連結 */
            'bp-nav[layout="vertical"] .bpn-link{',
            'display:flex;align-items:center;gap:8px;',
            'color:' + t.text + ';text-decoration:none;',
            'padding:8px 14px;border-radius:6px;',
            'font-size:.9rem;cursor:pointer;',
            'transition:background .15s,color .15s;',
            'user-select:none;}',
            'bp-nav[layout="vertical"] .bpn-link:hover{',
            'background:' + t.hoverBg + ';color:' + t.accent + ';}',
            'bp-nav[layout="vertical"] .bpn-link.active{',
            'background:' + t.activeBg + ';color:' + t.activeText + ';font-weight:600;}',
            'bp-nav[layout="vertical"] .bpn-link.is-group{cursor:pointer;}',
            'bp-nav[layout="vertical"] .bpn-link.is-group.open{color:' + t.accent + ';}',

            /* 群組標題文字（flex:1 推箭頭到右側）*/
            '.bpn-group-label{flex:1;}',

            /* 展開箭頭 */
            '.bpn-arrow{',
            'font-size:.65rem;color:' + t.groupArrow + ';',
            'transition:transform .2s;flex-shrink:0;}',
            '.bpn-link.open .bpn-arrow{transform:rotate(90deg);}',

            /* 第二層容器（縮排 + 左側細線）*/
            '.bpn-children{',
            'overflow:hidden;',
            'max-height:0;opacity:0;',
            'transition:max-height .22s cubic-bezier(.4,0,.2,1),opacity .18s;',
            'margin-left:14px;',
            'padding-left:12px;',
            'border-left:1px solid ' + t.indent + ';}',
            '.bpn-children.open{max-height:600px;opacity:1;}',
            '.bpn-children.no-anim{transition:none!important;}',

            /* 第二層連結 */
            '.bpn-child-link{',
            'display:flex;align-items:center;gap:7px;',
            'color:' + t.textDim + ';text-decoration:none;',
            'padding:6px 10px;border-radius:5px;',
            'font-size:.85rem;',
            'transition:background .15s,color .15s;}',
            '.bpn-child-link:hover{',
            'background:' + t.hoverBg + ';color:' + t.accent + ';}',
            '.bpn-child-link.active{',
            'color:' + t.activeText + ';font-weight:600;}',

            /* ── 收合切換按鈕樣式（元件外部，由使用者自訂）── */
            /* 僅提供 data-bp-nav-toggle 的游標樣式 */
            '[data-bp-nav-toggle]{cursor:pointer;}',
        ].join('');
    }

    // ── active 自動偵測輔助函式 ──────────────────────────────────
    // 比對 href 與目前頁面 URL（路徑 + hash 皆支援）
    function isHrefActive(href) {
        if (!href || href === '#') return false;
        // hash 書籤：比對 location.hash
        if (href.charAt(0) === '#') {
            return G.location && G.location.hash === href;
        }
        // 一般路徑：比對 pathname
        try {
            var a    = document.createElement('a');
            a.href   = href;
            var loc  = G.location;
            // 同源才比對
            if (a.host !== loc.host) return false;
            return a.pathname === loc.pathname;
        } catch (e) { return false; }
    }
    function BpNavInstance(el) {
        this.el          = el;
        this.layout      = el.getAttribute('layout') || 'horizontal';
        this.id          = el.id || ('bpnav-' + Math.random().toString(36).slice(2, 7));
        this.storageKey  = el.getAttribute('storage-key') || ('bp-nav-' + this.id);
        this._inner      = null;
        this._collapsed  = el.hasAttribute('collapsed');
        this._groups     = {};   // groupId → { btn, children }
        this._build();
    }

    BpNavInstance.prototype._build = function () {
        injectCSS();
        var el     = this.el;
        var self   = this;
        var isVert = this.layout === 'vertical';

        // 讀取原始子節點（在清空前）
        var origChildren = Array.from(el.childNodes);

        // 外層加 layout 屬性（確保 CSS 選擇器正確）
        if (!el.getAttribute('layout')) el.setAttribute('layout', this.layout);

        // 建立動畫容器
        var inner = document.createElement('div');
        inner.className = 'bpn-inner no-anim';
        this._inner = inner;

        el.innerHTML = '';

        // 解析原始子節點
        origChildren.forEach(function (node) {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            var tag = node.tagName.toLowerCase();

            // ── 群組容器（div[data-group] 或 a[data-group]）──────
            // 注意：<a> 內不能巢狀 <a>（HTML 規範），群組容器應用 <div data-group>
            var isGroupNode = node.hasAttribute('data-group');

            if (isGroupNode && isVert) {
                var groupName = node.getAttribute('data-group');
                var icon      = node.getAttribute('data-icon') || '';
                var gid = 'g-' + self.id + '-' + Object.keys(self._groups).length;

                // 群組標題按鈕
                var groupBtn = document.createElement('div');
                groupBtn.className = 'bpn-link is-group';
                groupBtn.setAttribute('role', 'button');
                groupBtn.setAttribute('aria-expanded', 'false');
                groupBtn.innerHTML =
                    (icon ? '<i class="bi ' + icon + '"></i>' : '') +
                    '<span class="bpn-group-label">' + escHtml(groupName) + '</span>' +
                    '<i class="bi bi-chevron-right bpn-arrow"></i>';

                // 第二層容器
                var childWrap = document.createElement('div');
                childWrap.className = 'bpn-children';

                // 解析群組內的子項（<a> 子元素）
                var hasActiveChild = false;
                Array.from(node.childNodes).forEach(function (child) {
                    if (child.nodeType !== Node.ELEMENT_NODE) return;
                    var childHref   = child.getAttribute('href') || '#';
                    var childIcon   = child.getAttribute('data-icon') || '';
                    var childActive = child.hasAttribute('active') ||
                                      child.getAttribute('aria-current') === 'page' ||
                                      isHrefActive(child.getAttribute('href'));
                    var childLink   = document.createElement('a');
                    childLink.className = 'bpn-child-link' + (childActive ? ' active' : '');
                    childLink.href      = childHref;
                    childLink.innerHTML =
                        (childIcon ? '<i class="bi ' + childIcon + '"></i>' : '') +
                        escHtml(child.textContent.trim());
                    if (childActive) hasActiveChild = true;
                    childWrap.appendChild(childLink);
                });

                // 若有 active 子項，預設展開此群組
                if (hasActiveChild) {
                    groupBtn.classList.add('open');
                    childWrap.classList.add('open', 'no-anim');
                    groupBtn.setAttribute('aria-expanded', 'true');
                }

                groupBtn.addEventListener('click', function () {
                    self._toggleGroup(gid);
                });

                self._groups[gid] = { btn: groupBtn, children: childWrap };
                inner.appendChild(groupBtn);
                inner.appendChild(childWrap);

            // ── 一般連結（<a> 無 data-group）────────────────────
            } else if (tag === 'a' && !isGroupNode) {
                var href     = node.getAttribute('href') || '#';
                var icon2    = node.getAttribute('data-icon') || '';
                var isActive = node.hasAttribute('active') ||
                               node.getAttribute('aria-current') === 'page' ||
                               isHrefActive(node.getAttribute('href'));
                var link = document.createElement('a');
                link.className = 'bpn-link' + (isActive ? ' active' : '');
                link.href      = href;
                link.innerHTML =
                    (icon2 ? '<i class="bi ' + icon2 + '"></i>' : '') +
                    escHtml(node.textContent.trim());
                inner.appendChild(link);
            }
        });

        el.appendChild(inner);

        // 恢復 sessionStorage 的展開狀態
        this._restoreState();

        // 初始收合
        if (this._collapsed) {
            inner.classList.add('collapsed');
            inner.style.maxHeight = '0';
        } else {
            this._setMaxHeight();
        }

        // 移除 no-anim（讓後續操作有動畫）
        setTimeout(function () {
            inner.classList.remove('no-anim');
            inner.querySelectorAll('.bpn-children.no-anim').forEach(function (c) {
                c.classList.remove('no-anim');
            });
        }, 50);
    };

    // 展開 / 收合群組
    BpNavInstance.prototype._toggleGroup = function (gid) {
        var g    = this._groups[gid];
        if (!g) return;
        var open = g.children.classList.contains('open');
        g.btn.classList.toggle('open', !open);
        g.children.classList.toggle('open', !open);
        g.btn.setAttribute('aria-expanded', !open ? 'true' : 'false');
        this._saveState();
        // 重新計算整體最大高度
        this._setMaxHeight();
    };

    // 整體收合 / 展開
    BpNavInstance.prototype.toggle = function () {
        var inner = this._inner;
        var isCollapsed = inner.classList.contains('collapsed');
        if (isCollapsed) {
            inner.classList.remove('collapsed');
            this._setMaxHeight();
        } else {
            this._setMaxHeight();   // 先設定當前高度
            requestAnimationFrame(function () {
                inner.classList.add('collapsed');
            });
        }
        this._collapsed = !isCollapsed;
    };

    // 設定 max-height（使動畫正確）
    BpNavInstance.prototype._setMaxHeight = function () {
        var inner    = this._inner;
        var scrollH  = inner.scrollHeight;
        // 額外加上展開子選單的高度
        var openKids = inner.querySelectorAll('.bpn-children.open');
        openKids.forEach(function (k) { scrollH += k.scrollHeight; });
        inner.style.maxHeight = (scrollH + 40) + 'px';
    };

    // sessionStorage：儲存哪些群組是開著的
    BpNavInstance.prototype._saveState = function () {
        if (this.layout !== 'vertical') return;
        var openGroups = [];
        var self = this;
        Object.keys(self._groups).forEach(function (gid) {
            if (self._groups[gid].children.classList.contains('open')) {
                openGroups.push(gid);
            }
        });
        try { sessionStorage.setItem(this.storageKey, JSON.stringify(openGroups)); } catch (e) {}
    };

    // sessionStorage：恢復展開狀態
    BpNavInstance.prototype._restoreState = function () {
        if (this.layout !== 'vertical') return;
        var saved = [];
        try { saved = JSON.parse(sessionStorage.getItem(this.storageKey) || '[]'); } catch (e) {}
        var self = this;
        saved.forEach(function (gid) {
            var g = self._groups[gid];
            if (!g) return;
            g.btn.classList.add('open');
            g.children.classList.add('open', 'no-anim');
            g.btn.setAttribute('aria-expanded', 'true');
        });
    };

    // ── 工具 ─────────────────────────────────────────────────────
    function escHtml(str) {
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('bp-nav:not([data-bp-init])').forEach(function (el) {
            el.setAttribute('data-bp-init', '1');
            if (!el.id) el.id = 'bpnav-' + Math.random().toString(36).slice(2, 7);
            el._bpNav = new BpNavInstance(el);
        });

        // 綁定外部收合按鈕
        document.querySelectorAll('[data-bp-nav-toggle]:not([data-bp-toggle-bound])').forEach(function (btn) {
            btn.setAttribute('data-bp-toggle-bound', '1');
            var targetId = btn.getAttribute('data-bp-nav-toggle');
            btn.addEventListener('click', function () {
                BpNav.toggle(targetId);
            });
        });
    }

    // hash 變更時重新偵測 active 狀態（書籤切換用）
    G.addEventListener('hashchange', function () {
        document.querySelectorAll('bp-nav[data-bp-init]').forEach(function (el) {
            if (!el._bpNav) return;
            // 更新所有第一層連結
            el.querySelectorAll('.bpn-link:not(.is-group)').forEach(function (link) {
                var href = link.getAttribute('href');
                link.classList.toggle('active', isHrefActive(href));
            });
            // 更新所有第二層連結
            el.querySelectorAll('.bpn-child-link').forEach(function (link) {
                var href = link.getAttribute('href');
                var active = isHrefActive(href);
                link.classList.toggle('active', active);
                // 若子項 active，確保父群組展開
                if (active) {
                    var parent = link.closest('.bpn-children');
                    if (parent && !parent.classList.contains('open')) {
                        parent.classList.add('open');
                        var idx = Array.from(parent.parentNode.children).indexOf(parent);
                        var btn = parent.parentNode.children[idx - 1];
                        if (btn) btn.classList.add('open');
                    }
                }
            });
        });
    });

    // ── 全域 API ─────────────────────────────────────────────────
    G.BpNav = {
        config: Config,
        init  : initAll,
        _reCSS: function () { if (_cssEl) injectCSS(); },

        /** 收合 / 展開指定 nav（傳入 id 字串或 element）*/
        toggle: function (target) {
            var el = typeof target === 'string'
                ? document.getElementById(target)
                : target;
            if (el && el._bpNav) el._bpNav.toggle();
        },

        getInstance: function (el) {
            return (el && el._bpNav) ? el._bpNav : null;
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

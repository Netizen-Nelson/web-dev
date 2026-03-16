// ================================================================
// bp-theme.js — bp-* 元件統一主題系統
//
// 必須在所有 bp-*.js 之後引入：
//   <script src="bp-mcq.js"></script>
//   <script src="bp-fill.js"></script>
//   <script src="bp-record.js"></script>
//   <script src="bp-nav.js"></script>
//   <script src="rich-input.js"></script>
//   <script src="bp-theme.js"></script>   ← 最後引入
//
// 使用方式：
//   BpTheme.set('lavender');             // 套用內建主題
//   BpTheme.set({ accent:'#ff6b6b' });   // 部分覆蓋
//   BpTheme.apply();                     // 重新渲染（init 後需再呼叫）
//
// 內建主題：lavender | sky | safe | orange | salmon | special
// ================================================================

(function (G) {
    'use strict';

    // ── 語意色彩 token → 各元件 theme key 的對應表 ──────────────
    //
    // BpTheme 使用語意名稱，不直接操作各元件的 theme key
    // set() 呼叫後，此對應表決定哪些元件的哪些 key 要更新
    //
    var MAP = {
        // 主強調色：按鈕、邊框、active 狀態
        accent: {
            mcq    : ['optBorder', 'submit'],
            fill   : ['blank', 'submit'],
            record : ['accent', 'submit'],
            nav    : ['accent', 'activeText'],
            invite : ['accent', 'submitBg'],
            notice : ['accent', 'ctaBg'],
            thread : ['accent', 'submitBg', 'teacherBorder', 'teacherTag'],
            rich   : null,
        },
        // 次要強調色（hover 底線、focus 狀態）
        accentHover: {
            fill   : ['blankHover'],
            nav    : null,
        },
        // 答對 / 成功色
        correct: {
            mcq    : ['correct'],
            fill   : ['correct'],
            record : ['correct'],
            invite : ['correct'],
            notice : ['correct'],
            nav    : null,
            thread : null,
        },
        // 答錯 / 錯誤色
        wrong: {
            mcq    : ['wrong'],
            fill   : ['wrong'],
            record : ['wrong'],
            invite : ['wrong'],
            notice : ['wrong'],
            nav    : null,
            thread : null,
        },
        // 提示文字左邊框
        hint: {
            mcq    : ['hint'],
            fill   : ['hint'],
            record : ['hint'],
            nav    : null,
        },
        // 選單背景（nav 專用）
        navBg: {
            nav    : ['bg'],
        },
        // 選單 active 背景（nav 專用，通常是 accent 的半透明版）
        navActiveBg: {
            nav    : ['activeBg'],
        },
        // 選單 hover 背景（nav 專用）
        navHoverBg: {
            nav    : ['hoverBg'],
        },
    };

    // ── 內建主題 ─────────────────────────────────────────────────
    var PRESETS = {

        lavender: {
            accent      : 'var(--lavender,#C3A5E5)',
            accentHover  : 'var(--sky,#04b5a3)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(195,165,229,.12)',
            navHoverBg  : 'rgba(195,165,229,.07)',
        },

        sky: {
            accent      : 'var(--sky,#04b5a3)',
            accentHover  : 'var(--safe,#81E6D9)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(4,181,163,.12)',
            navHoverBg  : 'rgba(4,181,163,.07)',
        },

        safe: {
            accent      : 'var(--safe,#81E6D9)',
            accentHover  : 'var(--sky,#04b5a3)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(129,230,217,.12)',
            navHoverBg  : 'rgba(129,230,217,.07)',
        },

        orange: {
            accent      : 'var(--orange,#f69653)',
            accentHover  : 'var(--attention,#E5E5A6)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(246,150,83,.12)',
            navHoverBg  : 'rgba(246,150,83,.07)',
        },

        salmon: {
            accent      : 'var(--salmon,#E5C3B3)',
            accentHover  : 'var(--orange,#f69653)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(229,195,179,.12)',
            navHoverBg  : 'rgba(229,195,179,.07)',
        },

        special: {
            accent      : 'var(--special,#C8DD5A)',
            accentHover  : 'var(--sky,#04b5a3)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(200,221,90,.12)',
            navHoverBg  : 'rgba(200,221,90,.07)',
        },

        pink: {
            accent      : 'var(--pink,#FFB3D9)',
            accentHover  : 'var(--lavender,#C3A5E5)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(255,179,217,.12)',
            navHoverBg  : 'rgba(255,179,217,.07)',
        },

        info: {
            accent      : 'var(--info,#90CDF4)',
            accentHover  : 'var(--sky,#04b5a3)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            hint        : 'var(--attention,#E5E5A6)',
            navActiveBg : 'rgba(144,205,244,.12)',
            navHoverBg  : 'rgba(144,205,244,.07)',
        },
    };

    // ── 目前套用的 token 值 ──────────────────────────────────────
    var _current = Object.assign({}, PRESETS.lavender);

    // ── 工具：把 token 值寫入各元件的 Config.theme ───────────────
    function applyToComponents(tokens) {
        Object.keys(tokens).forEach(function (token) {
            var val     = tokens[token];
            var targets = MAP[token];
            if (!targets) return;

            if (targets.mcq && G.BpMcq) {
                targets.mcq.forEach(function (k) {
                    G.BpMcq.config.theme[k] = val;
                });
            }
            if (targets.fill && G.BpFill) {
                targets.fill.forEach(function (k) {
                    G.BpFill.config.theme[k] = val;
                });
            }
            if (targets.record && G.BpRecord) {
                targets.record.forEach(function (k) {
                    G.BpRecord.config.theme[k] = val;
                });
            }
            if (targets.nav && G.BpNav) {
                targets.nav.forEach(function (k) {
                    G.BpNav.config.theme[k] = val;
                });
            }
            if (targets.invite && G.BpInvite) {
                targets.invite.forEach(function (k) {
                    G.BpInvite.config.theme[k] = val;
                });
            }
            if (targets.notice && G.BpNotice) {
                targets.notice.forEach(function (k) {
                    G.BpNotice.config.theme[k] = val;
                });
            }
            if (targets.thread && G.BpThread) {
                targets.thread.forEach(function (k) {
                    G.BpThread.config.theme[k] = val;
                });
            }
        });
    }

    // ── 重新渲染所有元件的 CSS ────────────────────────────────────
    function reRenderCSS() {
        if (G.BpMcq    && typeof G.BpMcq._reCSS    === 'function') G.BpMcq._reCSS();
        if (G.BpFill   && typeof G.BpFill._reCSS   === 'function') G.BpFill._reCSS();
        if (G.BpRecord && typeof G.BpRecord._reCSS === 'function') G.BpRecord._reCSS();
        if (G.BpNav    && typeof G.BpNav._reCSS    === 'function') G.BpNav._reCSS();
        if (G.BpInvite && typeof G.BpInvite._reCSS === 'function') G.BpInvite._reCSS();
        if (G.BpNotice && typeof G.BpNotice._reCSS === 'function') G.BpNotice._reCSS();
        if (G.BpThread && typeof G.BpThread._reCSS === 'function') G.BpThread._reCSS();
    }

    // ── 全域 API ─────────────────────────────────────────────────
    G.BpTheme = {

        /**
         * 套用主題
         * @param {string|object} preset  內建主題名稱（字串）或 token 物件（部分覆蓋）
         *
         * 用法：
         *   BpTheme.set('sky');
         *   BpTheme.set({ accent: '#ff6b6b', wrong: '#ff0000' });
         *   BpTheme.set('orange', { correct: '#00ff00' });  // 以 preset 為基礎再覆蓋
         */
        set: function (preset, overrides) {
            var tokens = {};

            if (typeof preset === 'string') {
                // 內建主題
                var base = PRESETS[preset];
                if (!base) {
                    console.warn('[BpTheme] 未知主題：' + preset + '。可用：' + Object.keys(PRESETS).join(', '));
                    return G.BpTheme;
                }
                tokens = Object.assign({}, base, overrides || {});
            } else if (typeof preset === 'object' && preset !== null) {
                // 純 token 物件（部分覆蓋目前主題）
                tokens = Object.assign({}, _current, preset);
            }

            _current = Object.assign({}, _current, tokens);
            applyToComponents(tokens);
            reRenderCSS();
            return G.BpTheme;   // 支援鏈式呼叫
        },

        /** 重新套用目前主題（元件 init 之後呼叫）*/
        apply: function () {
            applyToComponents(_current);
            reRenderCSS();
            return G.BpTheme;
        },

        /** 取得目前 token 物件的複本 */
        current: function () {
            return Object.assign({}, _current);
        },

        /** 列出所有內建主題名稱 */
        presets: function () {
            return Object.keys(PRESETS);
        },
    };

})(window);

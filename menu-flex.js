/**
 * menu-flex  Web Component  v2
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Dropdown 模式（預設）：
 *   <menu-flex attach-to="app" theme="sky">
 *     <menu-item text="檔案" icon="bi-file-earmark">
 *       <menu-subitem text="開啟" icon="bi-folder2-open" on-click="v-open"></menu-subitem>
 *       <menu-subitem text="---"></menu-subitem>
 *       <menu-subitem text="儲存" icon="bi-save" on-click="v-save"></menu-subitem>
 *     </menu-item>
 *   </menu-flex>
 *
 * Ribbon 模式：
 *   <menu-flex attach-to="app" theme="sky" mode="ribbon">
 *     <menu-item text="常用" icon="bi-star">
 *       <menu-group label="剪貼簿">
 *         <menu-subitem text="貼上" icon="bi-clipboard" on-click="v-paste" size="large"></menu-subitem>
 *         <menu-subitem text="複製" icon="bi-copy"      on-click="v-copy"  size="small"></menu-subitem>
 *         <menu-subitem text="剪下" icon="bi-scissors"  on-click="v-cut"   size="small"></menu-subitem>
 *       </menu-group>
 *     </menu-item>
 *   </menu-flex>
 *
 * 屬性說明：
 *   <menu-flex>       attach-to(必填) | theme | anim-speed | mode(dropdown|ribbon)
 *   <menu-item>       text | icon
 *   <menu-group>      label  （ribbon 模式專用）
 *   <menu-subitem>    text | icon | on-click | size(large|small，ribbon 用)
 *                     text="---" 在 dropdown 模式渲染分隔線
 *
 * Ribbon 按鈕佈局：
 *   size="large" → 大圖示在上，文字在下（垂直排列）
 *   size="small" → 小圖示＋文字水平排列，最多 3 個自動堆疊成一欄
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  const PALETTE = {
    sky:      '#04b5a3', lavender: '#C3A5E5', special: '#C8DD5A',
    warning:  '#F08080', salmon:   '#E5C3B3', safe:    '#81E6D9',
    yellow:   '#D4B440', info:     '#90CDF4', stone:   '#7090A8',
    pink:     '#FFB3D9', orange:   '#f69653', shell:   '#c6c7bd',
  };

  const SPEED = {
    slow:   { drop:'0.35s', ribbon:'0.30s', item:'0.22s', chevron:'0.30s' },
    normal: { drop:'0.20s', ribbon:'0.18s', item:'0.15s', chevron:'0.20s' },
    quick:  { drop:'0.12s', ribbon:'0.10s', item:'0.09s', chevron:'0.12s' },
    speedy: { drop:'0.06s', ribbon:'0.05s', item:'0.04s', chevron:'0.06s' },
  };

  window.MenuFlexConfig = Object.assign({
    defaultTheme: 'sky', defaultAnimSpeed: 'normal', defaultMode: 'dropdown',
  }, window.MenuFlexConfig || {});

  /* ── 樣式注入 ── */
  function injectStyles() {
    if (document.getElementById('__mfx-styles')) return;
    const s = document.createElement('style');
    s.id = '__mfx-styles';
    s.textContent = `
      .mfx-bar {
        display:flex; align-items:stretch;
        background:#1c1d1c; border-bottom:1px solid #2e2f2e;
        padding:0 6px; position:relative; z-index:200;
        user-select:none; flex-shrink:0;
      }
      .mfx-top { position:relative; }
      .mfx-top-btn {
        display:inline-flex; align-items:center; gap:5px;
        padding:6px 12px; background:transparent;
        border:none; border-bottom:2px solid transparent;
        color:#c6c7bd; font-size:.875rem; font-family:inherit;
        cursor:pointer; border-radius:4px 4px 0 0;
        white-space:nowrap; outline:none; line-height:1.4;
        transition:
          background   var(--mfx-item-dur,.15s) ease,
          color        var(--mfx-item-dur,.15s) ease,
          border-color var(--mfx-item-dur,.15s) ease;
      }
      .mfx-top-btn:hover, .mfx-top-btn.open {
        background:color-mix(in srgb,var(--mfx-color,#04b5a3) 13%,#1c1d1c);
        color:var(--mfx-color,#04b5a3);
        border-bottom-color:var(--mfx-color,#04b5a3);
      }
      .mfx-chevron {
        font-size:.65em; opacity:.5;
        transition:transform var(--mfx-chevron-dur,.20s) cubic-bezier(.4,0,.2,1),
                   opacity   var(--mfx-chevron-dur,.20s);
      }
      .mfx-top-btn.open .mfx-chevron { transform:rotate(180deg); opacity:1; }

      /* ── Dropdown 面板 ── */
      .mfx-drop {
        position:absolute; top:100%; left:0; min-width:190px;
        background:#242524; border:1px solid #333534;
        border-top:2px solid var(--mfx-color,#04b5a3);
        border-radius:0 4px 6px 6px;
        box-shadow:0 8px 28px rgba(0,0,0,.55);
        padding:4px 0; z-index:210;
        opacity:0; transform:translateY(-6px) scaleY(.94);
        transform-origin:top center; pointer-events:none;
        transition:
          opacity   var(--mfx-drop-dur,.20s) ease,
          transform var(--mfx-drop-dur,.20s) cubic-bezier(.22,.68,0,1.12);
      }
      .mfx-drop.open { opacity:1; transform:translateY(0) scaleY(1); pointer-events:auto; }

      .mfx-sub-btn {
        display:flex; align-items:center; gap:9px; width:100%;
        padding:7px 16px; background:transparent; border:none;
        color:#b8b9b1; font-size:.85rem; font-family:inherit;
        text-align:left; cursor:pointer; outline:none; white-space:nowrap;
        transition:background var(--mfx-item-dur,.15s) ease,
                   color      var(--mfx-item-dur,.15s) ease;
      }
      .mfx-sub-btn:hover, .mfx-sub-btn.mfx-active {
        background:color-mix(in srgb,var(--mfx-color,#04b5a3) 14%,#242524);
        color:var(--mfx-color,#04b5a3);
      }
      .mfx-sub-btn:hover .mfx-sub-icon,
      .mfx-sub-btn.mfx-active .mfx-sub-icon { color:var(--mfx-color,#04b5a3); }
      .mfx-sub-icon {
        font-size:1em; color:#666; flex-shrink:0;
        transition:color var(--mfx-item-dur,.15s) ease;
        width:1.1em; text-align:center;
      }
      .mfx-divider { height:1px; background:#333534; margin:4px 10px; }

      /* ── Ribbon 面板（浮在 content 上方） ── */
      .mfx-ribbon-panel {
        position:absolute; top:100%; left:0; right:0;
        background:#1e1f1e;
        border-bottom:2px solid var(--mfx-color,#04b5a3);
        border-left:1px solid #2e2f2e; border-right:1px solid #2e2f2e;
        box-shadow:0 12px 36px rgba(0,0,0,.65);
        z-index:210; padding:10px 14px 0; overflow:hidden;
        opacity:0; transform:translateY(-5px); pointer-events:none;
        transition:
          opacity   var(--mfx-ribbon-dur,.18s) ease,
          transform var(--mfx-ribbon-dur,.18s) cubic-bezier(.22,.68,0,1.1);
      }
      .mfx-ribbon-panel.open { opacity:1; transform:translateY(0); pointer-events:auto; }

      .mfx-ribbon-groups {
        display:flex; flex-direction:row; align-items:stretch;
        overflow-x:auto; scrollbar-width:thin; scrollbar-color:#333 transparent;
      }
      .mfx-ribbon-group {
        display:flex; flex-direction:column; align-items:stretch; padding:0 10px 0;
      }
      .mfx-ribbon-group-body {
        display:flex; flex-direction:row; align-items:flex-end; gap:3px;
        flex:1; padding-bottom:7px;
      }
      .mfx-ribbon-group-label {
        font-size:.64rem; color:#484848; text-align:center;
        padding:4px 0 7px; border-top:1px solid #2a2b2a;
        white-space:nowrap; letter-spacing:.04em; text-transform:uppercase;
      }
      .mfx-ribbon-sep {
        width:1px; background:#2a2b2a; margin:4px 2px 14px;
        align-self:stretch; flex-shrink:0;
      }

      /* ── 大按鈕 ── */
      .mfx-ribbon-btn-large {
        display:flex; flex-direction:column; align-items:center;
        justify-content:flex-start; gap:5px;
        padding:8px 10px 6px; border:1px solid transparent; border-radius:5px;
        background:transparent; color:#a8a9a1;
        cursor:pointer; font-family:inherit; outline:none;
        min-width:52px; max-width:72px;
        transition:background var(--mfx-item-dur,.15s) ease,
                   border-color var(--mfx-item-dur,.15s) ease,
                   color var(--mfx-item-dur,.15s) ease;
      }
      .mfx-ribbon-btn-large i {
        font-size:1.5rem; line-height:1; color:#707170; flex-shrink:0;
        transition:color var(--mfx-item-dur,.15s) ease;
      }
      .mfx-ribbon-btn-large span {
        font-size:.67rem; line-height:1.25; text-align:center;
        word-break:break-word; hyphens:auto;
      }
      .mfx-ribbon-btn-large:hover {
        background:color-mix(in srgb,var(--mfx-color,#04b5a3) 14%,#1e1f1e);
        border-color:color-mix(in srgb,var(--mfx-color,#04b5a3) 38%,transparent);
        color:var(--mfx-color,#04b5a3);
      }
      .mfx-ribbon-btn-large:hover i { color:var(--mfx-color,#04b5a3); }
      .mfx-ribbon-btn-large.mfx-active {
        background:color-mix(in srgb,var(--mfx-color,#04b5a3) 20%,#1e1f1e);
        border-color:color-mix(in srgb,var(--mfx-color,#04b5a3) 55%,transparent);
        color:var(--mfx-color,#04b5a3);
      }
      .mfx-ribbon-btn-large.mfx-active i { color:var(--mfx-color,#04b5a3); }

      /* ── 小按鈕欄（最多 3 個自動堆疊） ── */
      .mfx-ribbon-small-col {
        display:flex; flex-direction:column; justify-content:flex-end;
        gap:1px; align-self:stretch; min-width:96px;
      }

      /* ── 小按鈕 ── */
      .mfx-ribbon-btn-small {
        display:flex; flex-direction:row; align-items:center; gap:7px;
        padding:4px 8px; border:1px solid transparent; border-radius:4px;
        background:transparent; color:#a8a9a1;
        cursor:pointer; font-family:inherit; font-size:.78rem;
        outline:none; white-space:nowrap; flex:1;
        transition:background var(--mfx-item-dur,.15s) ease,
                   border-color var(--mfx-item-dur,.15s) ease,
                   color var(--mfx-item-dur,.15s) ease;
      }
      .mfx-ribbon-btn-small i {
        font-size:.92rem; color:#606160; flex-shrink:0;
        transition:color var(--mfx-item-dur,.15s) ease;
      }
      .mfx-ribbon-btn-small:hover {
        background:color-mix(in srgb,var(--mfx-color,#04b5a3) 14%,#1e1f1e);
        border-color:color-mix(in srgb,var(--mfx-color,#04b5a3) 38%,transparent);
        color:var(--mfx-color,#04b5a3);
      }
      .mfx-ribbon-btn-small:hover i { color:var(--mfx-color,#04b5a3); }
      .mfx-ribbon-btn-small.mfx-active {
        background:color-mix(in srgb,var(--mfx-color,#04b5a3) 20%,#1e1f1e);
        border-color:color-mix(in srgb,var(--mfx-color,#04b5a3) 55%,transparent);
        color:var(--mfx-color,#04b5a3);
      }
      .mfx-ribbon-btn-small.mfx-active i { color:var(--mfx-color,#04b5a3); }

      /* ── 容器 & 內容區 ── */
      .mfx-wrapper { display:flex; flex-direction:column; }
      .mfx-content { flex:1; overflow:auto; position:relative; }
      .mfx-placeholder {
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; height:100%; min-height:100px;
        color:#2e2f2e; font-size:.82rem; gap:8px; pointer-events:none;
      }
      .mfx-placeholder i { font-size:2rem; }
    `;
    document.head.appendChild(s);
  }

  /* ── 點擊外部關閉所有面板 ── */
  document.addEventListener('click', e => {
    document.querySelectorAll('.mfx-bar').forEach(bar => {
      if (!bar.contains(e.target)) _closeAll(bar);
    });
  });

  function _closeAll(bar) {
    bar.querySelectorAll('.mfx-drop.open, .mfx-ribbon-panel.open')
       .forEach(p => p.classList.remove('open'));
    bar.querySelectorAll('.mfx-top-btn.open')
       .forEach(b => b.classList.remove('open'));
  }

  /* ── 元件定義 ── */
  class MenuFlexCfg extends HTMLElement {
    connectedCallback() {
      const map = {
        'default-theme':'defaultTheme',
        'default-anim-speed':'defaultAnimSpeed',
        'default-mode':'defaultMode',
      };
      for (const [a, k] of Object.entries(map)) {
        const v = this.getAttribute(a);
        if (v !== null) window.MenuFlexConfig[k] = v;
      }
      this.style.display = 'none';
    }
  }
  class MenuItem    extends HTMLElement { connectedCallback() { this.style.display='none'; } }
  class MenuGroup   extends HTMLElement { connectedCallback() { this.style.display='none'; } }
  class MenuSubitem extends HTMLElement { connectedCallback() { this.style.display='none'; } }

  /* ── 主元件 ── */
  class MenuFlex extends HTMLElement {
    connectedCallback() {
      injectStyles();
      this.style.display = 'none';
      requestAnimationFrame(() => this._render());
    }

    _cfg(attr, key) {
      const v = this.getAttribute(attr);
      return v !== null ? v : window.MenuFlexConfig[key];
    }

    _render() {
      const attachId = this.getAttribute('attach-to');
      if (!attachId) { console.warn('[menu-flex] 缺少 attach-to'); return; }

      const container = document.getElementById(attachId);
      if (!container) { console.warn(`[menu-flex] 找不到 #${attachId}`); return; }

      const VOID = new Set(['area','base','br','col','embed','hr','img','input',
                            'link','meta','param','source','track','wbr']);
      if (VOID.has(container.tagName.toLowerCase())) {
        console.warn(`[menu-flex] <${container.tagName.toLowerCase()}> 是 void element`);
        return;
      }

      const theme    = this._cfg('theme', 'defaultTheme');
      const speedKey = this._cfg('anim-speed', 'defaultAnimSpeed');
      const mode     = this._cfg('mode', 'defaultMode');
      const color    = PALETTE[theme] || PALETTE.sky;
      const timing   = SPEED[speedKey] || SPEED.normal;

      container.querySelector('.mfx-bar')?.remove();
      container.querySelector('.mfx-content')?.remove();

      container.classList.add('mfx-wrapper');
      container.style.setProperty('--mfx-color',       color);
      container.style.setProperty('--mfx-drop-dur',    timing.drop);
      container.style.setProperty('--mfx-ribbon-dur',  timing.ribbon);
      container.style.setProperty('--mfx-item-dur',    timing.item);
      container.style.setProperty('--mfx-chevron-dur', timing.chevron);

      const bar = document.createElement('div');
      bar.className = 'mfx-bar';

      const content = document.createElement('div');
      content.className = 'mfx-content';
      content.innerHTML = `<div class="mfx-placeholder">
        <i class="bi bi-layout-text-window"></i>
        <span>請從上方選單選擇內容</span></div>`;

      [...this.querySelectorAll(':scope > menu-item')].forEach(mi => {
        mode === 'ribbon'
          ? this._buildRibbonItem(mi, bar, container)
          : this._buildDropdownItem(mi, bar, container);
      });

      container.prepend(content);
      container.prepend(bar);
    }

    /* ════ Dropdown ════ */
    _buildDropdownItem(mi, bar, container) {
      const text     = mi.getAttribute('text') || '';
      const icon     = mi.getAttribute('icon') || '';
      const subitems = [...mi.querySelectorAll(':scope > menu-subitem')];

      const wrap = document.createElement('div');
      wrap.className = 'mfx-top';

      const topBtn = document.createElement('button');
      topBtn.type = 'button';
      topBtn.className = 'mfx-top-btn';
      topBtn.innerHTML =
        (icon ? `<i class="bi ${icon}"></i>` : '') +
        `<span>${text}</span>` +
        (subitems.length ? `<i class="mfx-chevron bi bi-chevron-down"></i>` : '');

      const drop = document.createElement('div');
      drop.className = 'mfx-drop';

      subitems.forEach(si => {
        const sText    = si.getAttribute('text')     || '';
        const sIcon    = si.getAttribute('icon')     || '';
        const sOnClick = si.getAttribute('on-click') || '';

        if (sText === '---') {
          const d = document.createElement('div');
          d.className = 'mfx-divider';
          drop.appendChild(d);
          return;
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mfx-sub-btn';
        btn.innerHTML =
          `<i class="mfx-sub-icon bi ${sIcon || 'bi-dot'}"></i><span>${sText}</span>`;
        if (sOnClick) {
          btn.addEventListener('click', () => {
            this._showView(sOnClick, container, bar, btn);
            _closeAll(bar);
          });
        }
        drop.appendChild(btn);
      });

      topBtn.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = drop.classList.contains('open');
        _closeAll(bar);
        if (!wasOpen) { drop.classList.add('open'); topBtn.classList.add('open'); }
      });

      wrap.appendChild(topBtn);
      wrap.appendChild(drop);
      bar.appendChild(wrap);
    }

    /* ════ Ribbon ════ */
    _buildRibbonItem(mi, bar, container) {
      const text   = mi.getAttribute('text') || '';
      const icon   = mi.getAttribute('icon') || '';
      const groups = [...mi.querySelectorAll(':scope > menu-group')];

      const wrap = document.createElement('div');
      wrap.className = 'mfx-top';

      const topBtn = document.createElement('button');
      topBtn.type = 'button';
      topBtn.className = 'mfx-top-btn';
      topBtn.innerHTML =
        (icon ? `<i class="bi ${icon}"></i>` : '') + `<span>${text}</span>`;

      const panel = document.createElement('div');
      panel.className = 'mfx-ribbon-panel';

      const groupsRow = document.createElement('div');
      groupsRow.className = 'mfx-ribbon-groups';

      /* 若沒有 menu-group，把直屬 menu-subitem 包進假群組 */
      const groupSrc = groups.length ? groups : this._wrapLoose(mi);

      groupSrc.forEach((grp, gi) => {
        if (gi > 0) {
          const sep = document.createElement('div');
          sep.className = 'mfx-ribbon-sep';
          groupsRow.appendChild(sep);
        }

        const label    = grp.getAttribute('label') || '';
        const subitems = [...grp.querySelectorAll(':scope > menu-subitem')]
                         .filter(si => si.getAttribute('text') !== '---');

        const grpEl = document.createElement('div');
        grpEl.className = 'mfx-ribbon-group';

        const body = document.createElement('div');
        body.className = 'mfx-ribbon-group-body';

        /* 小按鈕堆疊（每欄最多 3 個） */
        let col = null, cnt = 0;
        const flushCol = () => { if (col) { body.appendChild(col); col = null; cnt = 0; } };

        subitems.forEach(si => {
          const sText    = si.getAttribute('text')     || '';
          const sIcon    = si.getAttribute('icon')     || '';
          const sOnClick = si.getAttribute('on-click') || '';
          const sSize    = (si.getAttribute('size') || 'large').toLowerCase();

          if (sSize === 'small') {
            if (!col || cnt >= 3) { flushCol(); col = document.createElement('div'); col.className = 'mfx-ribbon-small-col'; cnt = 0; }
            col.appendChild(this._ribbonBtn('small', sIcon, sText, sOnClick, container, bar));
            cnt++;
          } else {
            flushCol();
            body.appendChild(this._ribbonBtn('large', sIcon, sText, sOnClick, container, bar));
          }
        });
        flushCol();

        grpEl.appendChild(body);
        if (label) {
          const lbl = document.createElement('div');
          lbl.className = 'mfx-ribbon-group-label';
          lbl.textContent = label;
          grpEl.appendChild(lbl);
        }
        groupsRow.appendChild(grpEl);
      });

      panel.appendChild(groupsRow);

      topBtn.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = panel.classList.contains('open');
        _closeAll(bar);
        if (!wasOpen) { panel.classList.add('open'); topBtn.classList.add('open'); }
      });

      /* panel 掛在 bar 而非 wrap，才能用 left:0;right:0 撐滿選單列寬度 */
      wrap.appendChild(topBtn);
      bar.appendChild(wrap);
      bar.appendChild(panel);
    }

    _ribbonBtn(size, icon, text, onClickId, container, bar) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mfx-ribbon-btn-${size}`;
      btn.innerHTML = `<i class="bi ${icon || 'bi-dot'}"></i><span>${text}</span>`;
      if (onClickId) {
        btn.addEventListener('click', () => {
          this._showView(onClickId, container, bar, btn);
          _closeAll(bar);
        });
      }
      return btn;
    }

    _wrapLoose(mi) {
      const subitems = [...mi.querySelectorAll(':scope > menu-subitem')]
                       .filter(si => si.getAttribute('text') !== '---');
      if (!subitems.length) return [];
      return [{ getAttribute: () => '', querySelectorAll: () => subitems }];
    }

    _showView(targetId, container, bar, clickedBtn) {
      const src = document.getElementById(targetId);
      if (!src) { console.warn(`[menu-flex] 找不到 #${targetId}`); return; }
      const content = container.querySelector('.mfx-content');
      if (!content) return;
      bar.querySelectorAll('.mfx-sub-btn.mfx-active, .mfx-ribbon-btn-large.mfx-active, .mfx-ribbon-btn-small.mfx-active')
         .forEach(b => b.classList.remove('mfx-active'));
      clickedBtn.classList.add('mfx-active');
      content.innerHTML = src.innerHTML;
    }
  }

  customElements.define('menu-flex-cfg', MenuFlexCfg);
  customElements.define('menu-item',     MenuItem);
  customElements.define('menu-group',    MenuGroup);
  customElements.define('menu-subitem',  MenuSubitem);
  customElements.define('menu-flex',     MenuFlex);

})();

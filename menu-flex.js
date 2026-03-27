/**
 * menu-flex  Web Component
 * ─────────────────────────────────────────────────────────────────────────────
 * 使用方式：
 *
 *   <menu-flex-cfg default-theme="sky" default-anim-speed="normal"></menu-flex-cfg>
 *
 *   <menu-flex attach-to="my-app" theme="sky" anim-speed="normal">
 *     <menu-item text="檔案" icon="bi-file-earmark">
 *       <menu-subitem text="開啟專案" icon="bi-folder2-open" on-click="view-open"></menu-subitem>
 *       <menu-subitem text="---"></menu-subitem>
 *       <menu-subitem text="另存新檔" icon="bi-save"        on-click="view-save"></menu-subitem>
 *     </menu-item>
 *   </menu-flex>
 *
 *   <div id="my-app">
 *     <!-- 選單會自動貼齊這個容器的頂部，內容區顯示在選單正下方 -->
 *   </div>
 *
 *   <div id="view-open" style="display:none">...內容...</div>
 *   <div id="view-save" style="display:none">...內容...</div>
 *
 * 功能說明：
 *   - attach-to      : 目標容器 id，選單列會 prepend 進去並貼齊頂部
 *   - theme          : 主題色（sky / lavender / special / warning / salmon / safe
 *                              yellow / info / stone / pink / orange / shell）
 *   - anim-speed     : slow | normal | quick | speedy
 *   - on-click       : 點擊後將指定 id 的 innerHTML 注入容器內容區
 *   - text="---"     : 渲染分隔線，icon 屬性忽略
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ── 色盤 ── */
  const PALETTE = {
    sky:      '#04b5a3',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    safe:     '#81E6D9',
    yellow:   '#D4B440',
    info:     '#90CDF4',
    stone:    '#7090A8',
    pink:     '#FFB3D9',
    orange:   '#f69653',
    shell:    '#c6c7bd',
  };

  /* ── 速度表 ── */
  const SPEED = {
    slow:   { drop: '0.35s', item: '0.22s', chevron: '0.30s' },
    normal: { drop: '0.20s', item: '0.15s', chevron: '0.20s' },
    quick:  { drop: '0.12s', item: '0.09s', chevron: '0.12s' },
    speedy: { drop: '0.06s', item: '0.04s', chevron: '0.06s' },
  };

  /* ── 全域配置 ── */
  window.MenuFlexConfig = Object.assign({
    defaultTheme:     'sky',
    defaultAnimSpeed: 'normal',
  }, window.MenuFlexConfig || {});

  /* ────────────────────────────────────────────────────────────────────
   * 樣式注入（僅一次）
   * ──────────────────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('__mfx-styles')) return;
    const s = document.createElement('style');
    s.id = '__mfx-styles';
    s.textContent = `
      /* ══════════════════════════════════════════════
         選單列容器
      ══════════════════════════════════════════════ */
      .mfx-bar {
        display: flex;
        align-items: stretch;
        background: #1c1d1c;
        border-bottom: 1px solid #2e2f2e;
        padding: 0 6px;
        position: relative;
        z-index: 200;
        user-select: none;
        flex-shrink: 0;
      }

      /* ══════════════════════════════════════════════
         頂層選單項目
      ══════════════════════════════════════════════ */
      .mfx-top {
        position: relative;
      }
      .mfx-top-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 12px;
        background: transparent;
        border: none;
        color: #c6c7bd;
        font-size: .875rem;
        font-family: inherit;
        cursor: pointer;
        border-radius: 4px 4px 0 0;
        white-space: nowrap;
        outline: none;
        transition: background var(--mfx-item-dur, .15s) ease,
                    color     var(--mfx-item-dur, .15s) ease;
        line-height: 1.4;
      }
      .mfx-top-btn:hover,
      .mfx-top-btn.open {
        background: color-mix(in srgb, var(--mfx-color, #04b5a3) 14%, #1c1d1c);
        color: var(--mfx-color, #04b5a3);
      }
      .mfx-top-btn .mfx-chevron {
        font-size: .65em;
        transition: transform var(--mfx-chevron-dur, .20s) cubic-bezier(.4,0,.2,1);
        opacity: .55;
      }
      .mfx-top-btn.open .mfx-chevron {
        transform: rotate(180deg);
        opacity: 1;
      }

      /* ══════════════════════════════════════════════
         下拉面板
      ══════════════════════════════════════════════ */
      .mfx-drop {
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 190px;
        background: #242524;
        border: 1px solid #333534;
        border-top: 2px solid var(--mfx-color, #04b5a3);
        border-radius: 0 4px 6px 6px;
        box-shadow: 0 8px 28px rgba(0,0,0,.5);
        padding: 4px 0;
        z-index: 210;
        /* 收合狀態 */
        opacity: 0;
        transform: translateY(-6px) scaleY(.94);
        transform-origin: top center;
        pointer-events: none;
        transition:
          opacity    var(--mfx-drop-dur, .20s) ease,
          transform  var(--mfx-drop-dur, .20s) cubic-bezier(.22,.68,0,1.12);
      }
      .mfx-drop.open {
        opacity: 1;
        transform: translateY(0) scaleY(1);
        pointer-events: auto;
      }

      /* ══════════════════════════════════════════════
         子項目
      ══════════════════════════════════════════════ */
      .mfx-sub-btn {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        padding: 7px 16px;
        background: transparent;
        border: none;
        color: #b8b9b1;
        font-size: .85rem;
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        outline: none;
        white-space: nowrap;
        transition: background var(--mfx-item-dur, .15s) ease,
                    color     var(--mfx-item-dur, .15s) ease;
      }
      .mfx-sub-btn:hover {
        background: color-mix(in srgb, var(--mfx-color, #04b5a3) 15%, #242524);
        color: var(--mfx-color, #04b5a3);
      }
      .mfx-sub-btn:hover .mfx-sub-icon {
        color: var(--mfx-color, #04b5a3);
      }
      .mfx-sub-btn.active {
        color: var(--mfx-color, #04b5a3);
        background: color-mix(in srgb, var(--mfx-color, #04b5a3) 8%, #242524);
      }
      .mfx-sub-icon {
        font-size: 1em;
        color: #666;
        flex-shrink: 0;
        transition: color var(--mfx-item-dur, .15s) ease;
        width: 1.1em;
        text-align: center;
      }
      .mfx-sub-text {
        flex: 1;
      }

      /* 分隔線 */
      .mfx-divider {
        height: 1px;
        background: #333534;
        margin: 4px 10px;
      }

      /* ══════════════════════════════════════════════
         容器包裝器（將 attach-to 容器改為 flex-column）
      ══════════════════════════════════════════════ */
      .mfx-wrapper {
        display: flex;
        flex-direction: column;
        /* 繼承原容器的寬高，不強制設定，由使用者控制 */
      }

      /* ══════════════════════════════════════════════
         內容區
      ══════════════════════════════════════════════ */
      .mfx-content {
        flex: 1;
        overflow: auto;
        position: relative;
      }

      /* 空白佔位提示 */
      .mfx-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 120px;
        color: #3a3b3a;
        font-size: .82rem;
        gap: 8px;
        pointer-events: none;
      }
      .mfx-placeholder i { font-size: 2rem; }
    `;
    document.head.appendChild(s);
  }

  /* ────────────────────────────────────────────────────────────────────
   * 點擊外部關閉所有下拉
   * ──────────────────────────────────────────────────────────────────── */
  document.addEventListener('click', e => {
    document.querySelectorAll('.mfx-drop.open').forEach(drop => {
      const bar = drop.closest('.mfx-bar');
      if (bar && !bar.contains(e.target)) {
        _closeAll(bar);
      }
    });
  });

  function _closeAll(bar) {
    bar.querySelectorAll('.mfx-drop.open').forEach(d => d.classList.remove('open'));
    bar.querySelectorAll('.mfx-top-btn.open').forEach(b => b.classList.remove('open'));
  }

  /* ══════════════════════════════════════════════════════════════════
   * <menu-flex-cfg>
   * ══════════════════════════════════════════════════════════════════ */
  class MenuFlexCfg extends HTMLElement {
    connectedCallback() {
      const map = {
        'default-theme':      'defaultTheme',
        'default-anim-speed': 'defaultAnimSpeed',
      };
      for (const [attr, key] of Object.entries(map)) {
        const v = this.getAttribute(attr);
        if (v !== null) window.MenuFlexConfig[key] = v;
      }
      this.style.display = 'none';
    }
  }

  /* ══════════════════════════════════════════════════════════════════
   * <menu-item>  (資料節點，不渲染)
   * ══════════════════════════════════════════════════════════════════ */
  class MenuItem extends HTMLElement {
    connectedCallback() { this.style.display = 'none'; }
  }

  /* ══════════════════════════════════════════════════════════════════
   * <menu-subitem>  (資料節點，不渲染)
   * ══════════════════════════════════════════════════════════════════ */
  class MenuSubitem extends HTMLElement {
    connectedCallback() { this.style.display = 'none'; }
  }

  /* ══════════════════════════════════════════════════════════════════
   * <menu-flex>  主元件
   * 屬性：
   *   attach-to   (必填) — 目標容器 id
   *   theme               — 主題色
   *   anim-speed          — slow | normal | quick | speedy
   * ══════════════════════════════════════════════════════════════════ */
  class MenuFlex extends HTMLElement {

    connectedCallback() {
      injectStyles();
      this.style.display = 'none';           // 自身隱藏，UI 渲染在目標容器內
      requestAnimationFrame(() => this._render());
    }

    _cfg(attr, globalKey) {
      const v = this.getAttribute(attr);
      return v !== null ? v : window.MenuFlexConfig[globalKey];
    }

    /* ══════════════════════════════════════════════
       主渲染
    ══════════════════════════════════════════════ */
    _render() {
      const attachId  = this.getAttribute('attach-to');
      if (!attachId) { console.warn('[menu-flex] 缺少 attach-to 屬性'); return; }

      const container = document.getElementById(attachId);
      if (!container) { console.warn(`[menu-flex] 找不到 #${attachId}`); return; }

      /* ── void element 防護（不能包含子節點的標籤） ── */
      const VOID_TAGS = new Set([
        'area','base','br','col','embed','hr','img','input',
        'link','meta','param','source','track','wbr',
      ]);
      if (VOID_TAGS.has(container.tagName.toLowerCase())) {
        console.warn(
          `[menu-flex] <${container.tagName.toLowerCase()}> 是 void element，無法掛載選單。` +
          `請改用 <div>、<section>、<article>、<main>、<aside>、<header>、<footer>、` +
          `<nav>、<figure>、<details>、<dialog> 等可包含子節點的元素。`
        );
        return;
      }

      const theme     = this._cfg('theme', 'defaultTheme');
      const speedKey  = this._cfg('anim-speed', 'defaultAnimSpeed');
      const color     = PALETTE[theme] || PALETTE.sky;
      const timing    = SPEED[speedKey]  || SPEED.normal;

      /* ── 若已初始化過，移除舊有 bar ── */
      const old = container.querySelector('.mfx-bar');
      if (old) old.remove();
      const oldContent = container.querySelector('.mfx-content');
      if (oldContent) oldContent.remove();

      /* ── 包裝容器為 flex-column ── */
      container.classList.add('mfx-wrapper');
      container.style.setProperty('--mfx-color',       color);
      container.style.setProperty('--mfx-drop-dur',    timing.drop);
      container.style.setProperty('--mfx-item-dur',    timing.item);
      container.style.setProperty('--mfx-chevron-dur', timing.chevron);

      /* ── 建立選單列 ── */
      const bar = document.createElement('div');
      bar.className = 'mfx-bar';

      const menuItems = [...this.querySelectorAll(':scope > menu-item')];
      menuItems.forEach(mi => {
        const text = mi.getAttribute('text') || '';
        const icon = mi.getAttribute('icon') || '';
        const subitems = [...mi.querySelectorAll(':scope > menu-subitem')];

        /* 頂層按鈕 */
        const topWrap = document.createElement('div');
        topWrap.className = 'mfx-top';

        const topBtn = document.createElement('button');
        topBtn.type      = 'button';
        topBtn.className = 'mfx-top-btn';
        topBtn.innerHTML =
          (icon ? `<i class="bi ${icon}"></i>` : '') +
          `<span>${text}</span>` +
          (subitems.length ? `<i class="mfx-chevron bi bi-chevron-down"></i>` : '');

        /* 下拉面板 */
        const drop = document.createElement('div');
        drop.className = 'mfx-drop';

        subitems.forEach(si => {
          const sText    = si.getAttribute('text')     || '';
          const sIcon    = si.getAttribute('icon')     || '';
          const sOnClick = si.getAttribute('on-click') || '';

          /* 分隔線 */
          if (sText === '---') {
            const div = document.createElement('div');
            div.className = 'mfx-divider';
            drop.appendChild(div);
            return;
          }

          const subBtn = document.createElement('button');
          subBtn.type      = 'button';
          subBtn.className = 'mfx-sub-btn';
          subBtn.innerHTML =
            `<i class="mfx-sub-icon bi ${sIcon || 'bi-dot'}"></i>` +
            `<span class="mfx-sub-text">${sText}</span>`;

          if (sOnClick) {
            subBtn.addEventListener('click', () => {
              this._showView(sOnClick, container, bar, subBtn);
              _closeAll(bar);
            });
          }
          drop.appendChild(subBtn);
        });

        /* 頂層按鈕點擊：切換下拉 */
        topBtn.addEventListener('click', e => {
          e.stopPropagation();
          const isOpen = drop.classList.contains('open');
          _closeAll(bar);
          if (!isOpen) {
            drop.classList.add('open');
            topBtn.classList.add('open');
          }
        });

        topWrap.appendChild(topBtn);
        topWrap.appendChild(drop);
        bar.appendChild(topWrap);
      });

      /* ── 內容區 ── */
      const content = document.createElement('div');
      content.className = 'mfx-content';
      content.innerHTML = `
        <div class="mfx-placeholder">
          <i class="bi bi-layout-text-window"></i>
          <span>請從上方選單選擇內容</span>
        </div>`;

      /* ── 插入容器 ── */
      container.prepend(content);
      container.prepend(bar);

      /* ── 記錄 content 供 _showView 使用 ── */
      this._content = content;
      this._bar     = bar;
    }

    /* ══════════════════════════════════════════════
       顯示指定 div 的內容
    ══════════════════════════════════════════════ */
    _showView(targetId, container, bar, clickedBtn) {
      const src = document.getElementById(targetId);
      if (!src) {
        console.warn(`[menu-flex] 找不到 #${targetId}`);
        return;
      }

      const content = container.querySelector('.mfx-content');
      if (!content) return;

      /* 更新 active 狀態（同一 bar 內所有 subBtn） */
      bar.querySelectorAll('.mfx-sub-btn').forEach(b => b.classList.remove('active'));
      clickedBtn.classList.add('active');

      /* 注入內容（複製 innerHTML，不移動原始 DOM） */
      content.innerHTML = src.innerHTML;
    }
  }

  /* ── 註冊 ── */
  customElements.define('menu-flex-cfg',  MenuFlexCfg);
  customElements.define('menu-item',      MenuItem);
  customElements.define('menu-subitem',   MenuSubitem);
  customElements.define('menu-flex',      MenuFlex);

})();

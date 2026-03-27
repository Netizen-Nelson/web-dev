/**
 * icon-btn  Web Component  v3
 * ─────────────────────────────────────────────────────────────────────────────
 * 使用方式：
 *   <icon-btn-cfg
 *     api-url="icon-btn-api.php"
 *     default-theme="sky"
 *     default-font-size="1rem"
 *     default-slide-from="left"           ← left | right | none
 *     default-anim-speed="normal">        ← slow | normal | quick | speedy
 *   </icon-btn-cfg>
 *
 *   <icon-btn id="article-42" theme="sky"
 *             slide-from="left"
 *             anim-speed="quick"
 *             collapsible>
 *     <btn-item icon="bi-heart"       text="喜愛"  value="12"></btn-item>
 *     <btn-item icon="bi-fire"        text="熱門"  value="5"></btn-item>
 *     <btn-item icon="bi-emoji-laugh" text="有趣"  value="3"></btn-item>
 *   </icon-btn>
 *
 * 速度預設（所有時間單位 ms）：
 *   slow   — enterDur 600 / stagger 120 / exitDur 440 / pop 500
 *   normal — enterDur 360 / stagger  68 / exitDur 260 / pop 300
 *   quick  — enterDur 200 / stagger  38 / exitDur 150 / pop 170
 *   speedy — enterDur  95 / stagger  16 / exitDur  75 / pop  90
 *
 * 入場動畫：元件掛載時，各按鈕以 stagger 方式依序滑入。
 * 收合動畫：collapsible 模式下，切換鈕讓按鈕群向左或向右滑出 / 滑入。
 * 最多支援 6 個 btn-item。
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

  /* ── 速度預設表 ──────────────────────────────────────────────
   *  enterDur   : 入場單顆動畫時長
   *  enterStagger: 入場每顆間隔
   *  exitDur    : 退場單顆動畫時長
   *  exitStagger : 退場每顆間隔
   *  popDur     : 點擊 pop 時長
   *  chevron    : 切換鈕箭頭旋轉時長（CSS transition）
   * ─────────────────────────────────────────────────────────── */
  const SPEED = {
    slow:   { enterDur: 600, enterStagger: 120, exitDur: 440, exitStagger:  95, popDur: 500, chevron: '0.60s' },
    normal: { enterDur: 360, enterStagger:  68, exitDur: 260, exitStagger:  55, popDur: 300, chevron: '0.35s' },
    quick:  { enterDur: 200, enterStagger:  38, exitDur: 150, exitStagger:  30, popDur: 170, chevron: '0.20s' },
    speedy: { enterDur:  95, enterStagger:  16, exitDur:  75, exitStagger:  12, popDur:  90, chevron: '0.10s' },
  };

  /* ── 全域配置 ── */
  window.IconBtnConfig = Object.assign({
    apiUrl:           'icon-btn-api.php',
    defaultTheme:     'sky',
    defaultFontSize:  '1rem',
    defaultSlideFrom: 'left',    // left | right | none
    defaultAnimSpeed: 'normal',  // slow | normal | quick | speedy
  }, window.IconBtnConfig || {});

  /* ── 注入樣式（僅執行一次） ── */
  function injectStyles() {
    if (document.getElementById('__ikb-styles')) return;
    const s = document.createElement('style');
    s.id = '__ikb-styles';
    s.textContent = `
      icon-btn {
        display: inline-flex;
        flex-wrap: nowrap;
        gap: 6px;
        align-items: center;
        font-family: inherit;
      }

      /* ════════════════════════════════
         按鈕基底
      ════════════════════════════════ */
      .ikb-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 15px;
        border-radius: 999px;
        border: 1.5px solid #555555;
        background: #333333;
        color: #c6c7bd;
        cursor: pointer;
        font-size: var(--ikb-fs, 1rem);
        font-family: inherit;
        line-height: 1.4;
        white-space: nowrap;
        user-select: none;
        outline: none;
        position: relative;
        transition: background .18s ease, border-color .18s ease,
                    color .18s ease, box-shadow .18s ease;
      }
      .ikb-btn:focus-visible {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ikb-color) 40%, transparent);
      }
      .ikb-btn:hover:not(.ikb-loading) {
        border-color: var(--ikb-color);
        color: var(--ikb-color);
        background: color-mix(in srgb, var(--ikb-color) 12%, #333333);
      }
      .ikb-btn.active {
        border-color: var(--ikb-color);
        background: var(--ikb-color);
        color: #0c0d0c;
        font-weight: 600;
      }
      .ikb-btn.ikb-loading {
        opacity: .55;
        cursor: not-allowed;
        pointer-events: none;
      }

      /* ════════════════════════════════
         子元素
      ════════════════════════════════ */
      .ikb-icon  { line-height: 1; transition: transform .2s ease; }
      .ikb-text  { font-size: .88em; }
      .ikb-count { font-size: .82em; font-weight: 700; min-width: .9em; text-align: left; }
      .ikb-btn.active .ikb-icon { transform: scale(1.22); }

      /* ════════════════════════════════
         收合切換按鈕
      ════════════════════════════════ */
      .ikb-toggle {
        padding: 5px 10px !important;
        flex-shrink: 0;
        z-index: 1;
      }
      .ikb-toggle .ikb-chevron {
        display: inline-block;
        /* 時長由 JS 透過 inline style 設定 */
        transition: transform var(--ikb-chevron-dur, .35s) cubic-bezier(.4,0,.2,1);
        line-height: 1;
      }

      /* ════════════════════════════════
         按鈕群容器（用於收合裁剪）
      ════════════════════════════════ */
      .ikb-track {
        display: inline-flex;
        flex-wrap: nowrap;
        gap: 6px;
        align-items: center;
        overflow: hidden;            /* 裁剪滑出的按鈕 */
        /* max-width 由 JS 控制 */
      }

      /* ════════════════════════════════
         入場 / 離場 Keyframes
      ════════════════════════════════ */

      /* 從左滑入 */
      @keyframes ikb-enter-ltr {
        from { opacity: 0; transform: translateX(-28px) scale(.82); }
        to   { opacity: 1; transform: translateX(0)     scale(1);   }
      }
      /* 從右滑入 */
      @keyframes ikb-enter-rtl {
        from { opacity: 0; transform: translateX(28px)  scale(.82); }
        to   { opacity: 1; transform: translateX(0)     scale(1);   }
      }
      /* 往左滑出 */
      @keyframes ikb-exit-ltr {
        from { opacity: 1; transform: translateX(0)     scale(1);   }
        to   { opacity: 0; transform: translateX(-24px) scale(.82); }
      }
      /* 往右滑出 */
      @keyframes ikb-exit-rtl {
        from { opacity: 1; transform: translateX(0)    scale(1);   }
        to   { opacity: 0; transform: translateX(24px) scale(.82); }
      }

      /* ════════════════════════════════
         點擊 pop 動畫
      ════════════════════════════════ */
      @keyframes ikb-pop {
        0%  { transform: scale(1);    }
        40% { transform: scale(1.32); }
        100%{ transform: scale(1.22); }
      }
      .ikb-btn.ikb-popping   .ikb-icon { animation: ikb-pop   var(--ikb-pop-dur, .30s) ease forwards; }
      @keyframes ikb-unpop {
        from { transform: scale(1.22); }
        to   { transform: scale(1);    }
      }
      .ikb-btn.ikb-unpopping .ikb-icon { animation: ikb-unpop calc(var(--ikb-pop-dur, .30s) * .73) ease forwards; }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════════════
   * 輔助：清除按鈕動畫屬性
   * ══════════════════════════════════════════════════════════════════ */
  function clearAnim(btn) {
    btn.style.animation   = '';
    btn.style.opacity     = '';
    btn.style.transform   = '';
  }

  /* ══════════════════════════════════════════════════════════════════
   * <icon-btn-cfg>
   * 屬性：api-url | default-theme | default-font-size | default-slide-from
   * ══════════════════════════════════════════════════════════════════ */
  class IconBtnCfg extends HTMLElement {
    connectedCallback() {
      const map = {
        'api-url':             'apiUrl',
        'default-theme':       'defaultTheme',
        'default-font-size':   'defaultFontSize',
        'default-slide-from':  'defaultSlideFrom',
        'default-anim-speed':  'defaultAnimSpeed',
      };
      for (const [attr, key] of Object.entries(map)) {
        const v = this.getAttribute(attr);
        if (v !== null) window.IconBtnConfig[key] = v;
      }
      this.style.display = 'none';
    }
  }

  /* ══════════════════════════════════════════════════════════════════
   * <btn-item>
   * ══════════════════════════════════════════════════════════════════ */
  class BtnItem extends HTMLElement {
    connectedCallback() { this.style.display = 'none'; }
  }

  /* ══════════════════════════════════════════════════════════════════
   * <icon-btn>  主元件
   * 屬性：
   *   id (必填)           — 文章 / 內容識別碼
   *   theme               — 主題色
   *   default-font-size   — 字體大小
   *   api-url             — API 路徑
   *   slide-from          — left | right | none  入場 & 收合方向
   *   anim-speed          — slow | normal | quick | speedy
   *   collapsible         — 存在即啟用收合切換鈕
   * ══════════════════════════════════════════════════════════════════ */
  class IconBtn extends HTMLElement {

    connectedCallback() {
      injectStyles();
      requestAnimationFrame(() => this._render());
    }

    _cfg(attr, globalKey) {
      const v = this.getAttribute(attr);
      return v !== null ? v : window.IconBtnConfig[globalKey];
    }

    /* ── localStorage ── */
    _lsKey(cid, rt)        { return `ikb::${cid}::${rt}`; }
    _isActive(cid, rt)     { return localStorage.getItem(this._lsKey(cid, rt)) === '1'; }
    _setActive(cid, rt, v) {
      v ? localStorage.setItem(this._lsKey(cid, rt), '1')
        : localStorage.removeItem(this._lsKey(cid, rt));
    }

    /* ══════════════════════════════
       主渲染
    ══════════════════════════════ */
    _render() {
      const cid         = this.getAttribute('id') || this.getAttribute('content-id') || '';
      const theme       = this._cfg('theme', 'defaultTheme');
      const fs          = this._cfg('default-font-size', 'defaultFontSize');
      const slideFrom   = this._cfg('slide-from', 'defaultSlideFrom');
      const speedKey    = this._cfg('anim-speed', 'defaultAnimSpeed');
      const collapsible = this.hasAttribute('collapsible');
      const color       = PALETTE[theme] || PALETTE.sky;
      const timing      = SPEED[speedKey] || SPEED.normal;

      this.style.setProperty('--ikb-color',       color);
      this.style.setProperty('--ikb-fs',           fs);
      this.style.setProperty('--ikb-pop-dur',      `${timing.popDur}ms`);
      this.style.setProperty('--ikb-chevron-dur',  timing.chevron);

      /* 清除先前渲染的節點（保留 btn-item） */
      this.querySelectorAll('.ikb-btn, .ikb-track').forEach(el => el.remove());

      const items = [...this.querySelectorAll('btn-item')].slice(0, 6);
      if (!items.length) return;

      /* ── 建立 track 容器 ── */
      const track = document.createElement('div');
      track.className = 'ikb-track';

      /* ── 建立反應按鈕 ── */
      const btns = items.map(item => {
        const icon = item.getAttribute('icon')  || 'bi-hand-thumbs-up';
        const text = item.getAttribute('text')  || '';
        const val  = parseInt(item.getAttribute('value') || '0', 10);
        const rt   = icon;

        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'ikb-btn' + (this._isActive(cid, rt) ? ' active' : '');
        btn.dataset.rt = rt;
        btn.innerHTML  =
          `<i class="ikb-icon bi ${icon}"></i>` +
          (text ? `<span class="ikb-text">${text}</span>` : '') +
          `<span class="ikb-count">${isNaN(val) ? 0 : val}</span>`;
        btn.addEventListener('click', () => this._onClick(cid, rt, btn));
        track.appendChild(btn);
        return btn;
      });

      /* ── 建立切換鈕（collapsible 模式） ── */
      let toggleBtn = null;
      if (collapsible) {
        toggleBtn = this._makeToggleBtn(slideFrom);
        toggleBtn.addEventListener('click', () =>
          this._toggleTrack(track, btns, slideFrom, toggleBtn, timing)
        );
      }

      /* ── DOM 插入順序（決定切換鈕位置） ── */
      if (slideFrom === 'right') {
        this.appendChild(track);
        if (toggleBtn) this.appendChild(toggleBtn);
      } else {
        if (toggleBtn) this.appendChild(toggleBtn);
        this.appendChild(track);
      }

      /* ── 觸發入場動畫 ── */
      requestAnimationFrame(() => this._playEnter(btns, slideFrom, track, timing));
    }

    /* ══════════════════════════════
       製作切換鈕
    ══════════════════════════════ */
    _makeToggleBtn(slideFrom) {
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'ikb-btn ikb-toggle';
      btn.title     = '收合 / 展開';
      /* 展開時，左方向 = 箭頭朝左（可收合向左）；右方向 = 箭頭朝右 */
      const chevronClass = slideFrom === 'right' ? 'bi-chevron-double-right'
                                                 : 'bi-chevron-double-left';
      btn.innerHTML = `<i class="ikb-chevron bi ${chevronClass}"></i>`;
      btn.dataset.open = 'true';
      return btn;
    }

    /* ══════════════════════════════
       入場動畫（stagger）
    ══════════════════════════════ */
    _playEnter(btns, slideFrom, track, timing) {
      if (slideFrom === 'none') return;

      track.style.maxWidth = '';
      track.style.overflow = 'hidden';

      const animName = slideFrom === 'right' ? 'ikb-enter-rtl' : 'ikb-enter-ltr';
      const DUR      = timing.enterDur;
      const STAGGER  = timing.enterStagger;

      btns.forEach((btn, i) => {
        const delay = i * STAGGER;
        btn.style.opacity   = '0';
        btn.style.animation = 'none';
        void btn.offsetWidth;
        btn.style.animation = `${animName} ${DUR}ms cubic-bezier(.22,.68,0,1.2) ${delay}ms forwards`;
      });

      const totalMs = (btns.length - 1) * STAGGER + DUR + 20;
      setTimeout(() => { track.style.overflow = ''; }, totalMs);
    }

    /* ══════════════════════════════
       收合 / 展開
    ══════════════════════════════ */
    _toggleTrack(track, btns, slideFrom, toggleBtn, timing) {
      const isOpen = toggleBtn.dataset.open === 'true';

      if (isOpen) {
        this._playExit(btns, slideFrom, timing, () => {
          track.style.maxWidth   = '0';
          track.style.overflow   = 'hidden';
          track.style.visibility = 'hidden';
        });
        const chev = toggleBtn.querySelector('.ikb-chevron');
        chev.style.transform = 'rotate(180deg)';
        toggleBtn.dataset.open = 'false';
        toggleBtn.title = '展開';

      } else {
        track.style.maxWidth   = '';
        track.style.overflow   = 'hidden';
        track.style.visibility = '';
        btns.forEach(clearAnim);
        requestAnimationFrame(() => this._playEnter(btns, slideFrom, track, timing));
        const chev = toggleBtn.querySelector('.ikb-chevron');
        chev.style.transform = '';
        toggleBtn.dataset.open = 'true';
        toggleBtn.title = '收合';
      }
    }

    /* ── 滑出動畫（stagger，收合方向） ── */
    _playExit(btns, slideFrom, timing, onDone) {
      const animName = slideFrom === 'right' ? 'ikb-exit-rtl' : 'ikb-exit-ltr';
      const DUR      = timing.exitDur;
      const STAGGER  = timing.exitStagger;

      [...btns].reverse().forEach((btn, ri) => {
        const delay = ri * STAGGER;
        btn.style.animation = 'none';
        void btn.offsetWidth;
        btn.style.animation = `${animName} ${DUR}ms ease ${delay}ms forwards`;
      });

      const totalMs = (btns.length - 1) * STAGGER + DUR + 20;
      setTimeout(onDone, totalMs);
    }

    /* ══════════════════════════════
       點擊處理（樂觀更新 + API）
    ══════════════════════════════ */
    async _onClick(cid, rt, btn) {
      if (btn.classList.contains('ikb-loading')) return;

      const countEl   = btn.querySelector('.ikb-count');
      const wasActive = this._isActive(cid, rt);
      const delta     = wasActive ? -1 : 1;
      const newActive = !wasActive;
      const prev      = parseInt(countEl.textContent, 10) || 0;

      /* 樂觀更新 */
      btn.classList.toggle('active', newActive);
      btn.classList.remove('ikb-popping', 'ikb-unpopping');
      void btn.offsetWidth;
      btn.classList.add(newActive ? 'ikb-popping' : 'ikb-unpopping');
      btn.addEventListener('animationend', () => {
        btn.classList.remove('ikb-popping', 'ikb-unpopping');
      }, { once: true });

      countEl.textContent = Math.max(0, prev + delta);
      this._setActive(cid, rt, newActive);
      btn.classList.add('ikb-loading');

      /* API */
      try {
        const apiUrl = this._cfg('api-url', 'apiUrl');
        const res = await fetch(apiUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ content_id: cid, reaction_type: rt, delta }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success) {
          countEl.textContent = json.count;
        } else {
          throw new Error(json.error || 'API error');
        }
      } catch (err) {
        btn.classList.toggle('active', wasActive);
        countEl.textContent = prev;
        this._setActive(cid, rt, wasActive);
        console.error('[icon-btn]', err.message);
      } finally {
        btn.classList.remove('ikb-loading');
      }
    }
  }

  /* ── 註冊 ── */
  customElements.define('icon-btn-cfg', IconBtnCfg);
  customElements.define('btn-item',     BtnItem);
  customElements.define('icon-btn',     IconBtn);

})();

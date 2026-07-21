/*!
 * card-carousel.js  v1.1
 * 堆疊視差卡片輪轉 Web Component — 無 Shadow DOM，CSS / JS 合體
 *
 * 自訂標籤：
 *   <card-carousel
 *       theme="lavender"        ← 主題色（見下方清單）
 *       variant="invert"        ← invert | fill | shell | 自訂名稱
 *       icon-size="2.2rem"      ← Bootstrap Icon 尺寸
 *       card-width="420px"
 *       visible-back="2"        ← 後方顯示幾張
 *       icon-radius="12px"
 *       show-arrows>            ← 加上此屬性才顯示左右箭頭（預設隱藏）
 *
 *     <carousel-card
 *         icon="bi-person-fill"
 *         name="姓名"
 *         sub="副標"
 *         [theme="sky"]         ← 單張覆寫
 *         [variant="fill"]>
 *     </carousel-card>
 *     …
 *   </card-carousel>
 *
 * 全域設定：
 *   CardCarousel.config({ iconSize:'2.6rem', stackOffsetY:32, … })
 *
 * 主題清單：
 *   lavender · sky · special · salmon · safe · yellow · info
 *   stone · pink · orange · warning
 *
 * 內建 variant：
 *   fill   → 主題色底色，sky 邊框 / 文字
 *   invert → 深底色，主題色邊框 / 文字（預設）
 *   shell  → 主題色底色，shell 邊框，safe 文字
 *
 * 自訂 variant（可擴充）：
 *   CardCarousel.config({
 *     customThemes: {
 *       'my-style': {
 *         cardBg:   (c, T) => c,          ← 函式：第一參數為 theme token 色
 *         border:   '2px solid #fff',      ← 字串：直接使用
 *         nameFg:   (c, T) => T.safe,
 *         subFg:    'rgba(64,201,154,.6)',
 *         iconBg:   (c, T) => T.shell,
 *         iconFg:   '#0c0d0c',
 *         dotOn:    (c, T) => T.safe,
 *         dotOff:   'rgba(64,201,154,.2)',
 *         btnBd:    '#fff',
 *         btnFg:    '#fff',
 *         btnHovBg: '#fff',
 *         btnHovFg: '#0c0d0c',
 *         shadow:   (c) => `0 10px 40px rgba(0,0,0,.4)`,
 *       }
 *     }
 *   })
 *
 * 操作：← → 鍵盤、Touch 滑動、點擊後方卡片跳至該張
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     BRAND TOKENS
  ══════════════════════════════════════════════════════════ */
  const T = {
    bg:       '#0c0d0c',
    shell:    '#c6c7bd',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#08a9d1',
    safe:     '#40c99a',
    yellow:   '#DECA4B',
    info:     '#5fafed',
    stone:    '#7090A8',
    pink:     '#FFB3D9',
    orange:   '#eda109',
  };

  /* ══════════════════════════════════════════════════════════
     GLOBAL DEFAULTS
  ══════════════════════════════════════════════════════════ */
  const DEF = {
    theme:        'lavender',
    variant:      'invert',
    iconSize:     '2.2rem',
    iconPadding:  '13px',
    iconRadius:   '12px',
    cardWidth:    '420px',
    cardRadius:   '18px',
    visibleBack:  2,
    transitionMs: 370,
    stackOffsetY: 27,    // px，每層往上位移
    stackScale:   0.07,  // 每層縮放遞減
    stackBlur:    1.8,   // px，每層模糊遞增
    stackOpacity: 0.22,  // 每層透明度遞減
    customThemes: {},    // 使用者自訂 variant 對照表
  };

  let _G = { ...DEF };

  /* ══════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════ */
  window.CardCarousel = {
    /** 覆寫全域預設值，對之後掛載的 carousel 生效 */
    config: (opts) => Object.assign(_G, opts),
    /** 品牌色表，供外部取用 */
    tokens: T,
  };

  /* ══════════════════════════════════════════════════════════
     THEME RESOLVER
     優先序：customThemes → 內建 shell → fill → invert（預設）
  ══════════════════════════════════════════════════════════ */
  function resolveTheme(name, variant) {
    const c = T[name] || T.lavender;

    /* ── 1. 自訂 variant（customThemes）────────────────────── */
    if (_G.customThemes[variant]) {
      const def = _G.customThemes[variant];
      const resolve = (v) => (typeof v === 'function' ? v(c, T) : v);
      return {
        cardBg:   resolve(def.cardBg),
        border:   resolve(def.border),
        nameFg:   resolve(def.nameFg),
        subFg:    resolve(def.subFg),
        iconBg:   resolve(def.iconBg),
        iconFg:   resolve(def.iconFg),
        dotOn:    resolve(def.dotOn),
        dotOff:   resolve(def.dotOff),
        btnBd:    resolve(def.btnBd),
        btnFg:    resolve(def.btnFg),
        btnHovBg: resolve(def.btnHovBg),
        btnHovFg: resolve(def.btnHovFg),
        shadow:   resolve(def.shadow),
      };
    }

    /* ── 2. 內建 shell：主題色底色 + shell 邊框 + safe 文字 ── */
    if (variant === 'shell') {
      return {
        cardBg:   c,
        border:   `2px solid ${T.shell}`,
        nameFg:   T.safe,
        subFg:    toRgba(T.safe, 0.65),
        iconBg:   T.shell,
        iconFg:   T.bg,
        dotOn:    T.safe,
        dotOff:   toRgba(T.safe, 0.22),
        btnBd:    T.shell,
        btnFg:    T.shell,
        btnHovBg: T.shell,
        btnHovFg: T.bg,
        shadow:   `0 10px 40px ${toRgba(c, 0.3)}`,
      };
    }

    /* ── 3. 內建 fill：主題色底色 + bg 色邊框 / 文字（invert 純對調）*/
    if (variant === 'fill') {
      return {
        cardBg:   c,
        border:   `2px solid ${T.bg}`,
        nameFg:   T.bg,
        subFg:    toRgba(T.bg, 0.58),
        iconBg:   T.bg,
        iconFg:   c,
        dotOn:    T.bg,
        dotOff:   toRgba(T.bg, 0.28),
        btnBd:    T.bg,
        btnFg:    T.bg,
        btnHovBg: T.bg,
        btnHovFg: c,
        shadow:   `0 10px 40px ${toRgba(c, 0.35)}`,
      };
    }

    /* ── 4. 預設 invert：深底色 + 主題色邊框 / 文字 ─────────── */
    return {
      cardBg:   '#161817',
      border:   `2px solid ${c}`,
      nameFg:   c,
      subFg:    T.stone,
      iconBg:   c,
      iconFg:   T.bg,
      dotOn:    c,
      dotOff:   '#2e2f2e',
      btnBd:    c,
      btnFg:    c,
      btnHovBg: c,
      btnHovFg: T.bg,
      shadow:   `0 10px 40px rgba(0,0,0,.55)`,
    };
  }

  function toRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ══════════════════════════════════════════════════════════
     INJECT BASE STYLES (once)
  ══════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('__cc-styles')) return;
    const st = document.createElement('style');
    st.id = '__cc-styles';
    st.textContent = `
      /* 隱藏資料標籤 */
      carousel-card { display: none !important; }

      card-carousel {
        display: inline-block;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
        -webkit-font-smoothing: antialiased;
        outline: none;
        -webkit-tap-highlight-color: transparent;
      }

      .cc-root { width: 100%; }

      /* 視口容器 */
      .cc-vp { position: relative; width: 100%; }

      /* 堆疊區：相對定位，高度由 JS 計算 */
      .cc-stack { position: relative; width: 100%; }

      /* 每張卡的定位包裝 — 絕對定位，底部對齊 */
      .cc-wrap {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 100%;
        transform-origin: center bottom;
      }

      /* 卡片視覺面 */
      .cc-face {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 22px;
        box-sizing: border-box;
        min-height: 88px;
      }

      /* Icon 槽 */
      .cc-icon-slot {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* 文字區 */
      .cc-text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .cc-name {
        font-size: 1.15rem;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cc-sub {
        font-size: 0.88rem;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* 導航列 */
      .cc-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin-top: 22px;
      }

      /* 前 / 後按鈕 */
      .cc-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid;
        background: transparent;
        cursor: pointer;
        font-size: 1.05rem;
        outline: none;
        flex-shrink: 0;
        transition: background 160ms ease, color 160ms ease, transform 110ms ease;
      }
      .cc-arrow:hover  { transform: scale(1.1); }
      .cc-arrow:active { transform: scale(0.92); }

      /* 點狀指示器 */
      .cc-dots { display: flex; gap: 7px; align-items: center; }
      .cc-dot {
        height: 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 220ms ease, width 260ms cubic-bezier(.4,0,.2,1);
      }
    `;
    document.head.appendChild(st);
  }

  /* ══════════════════════════════════════════════════════════
     UTILITY
  ══════════════════════════════════════════════════════════ */
  const mk = (tag, cls) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };

  /* ══════════════════════════════════════════════════════════
     <carousel-card>  — 資料容器（僅宣告用）
  ══════════════════════════════════════════════════════════ */
  class CarouselCard extends HTMLElement {}
  customElements.define('carousel-card', CarouselCard);

  /* ══════════════════════════════════════════════════════════
     <card-carousel>  — 主元件
  ══════════════════════════════════════════════════════════ */
  class CardCarouselEl extends HTMLElement {

    constructor() {
      super();
      this._idx   = 0;
      this._cards = [];
      this._wraps = [];
      this._built = false;
      this._tx0   = null;   // touch start X
    }

    static get observedAttributes() {
      return ['theme', 'variant', 'icon-size', 'card-width', 'visible-back', 'icon-radius', 'show-arrows'];
    }

    /* ── 生命週期 ─────────────────────────────────────────── */
    connectedCallback() {
      injectStyles();
      this._build();
      this._built = true;
      this.setAttribute('tabindex', '0');

      /* 只監聽 carousel-card 相關變化，避免 UI 重建觸發無限迴圈 */
      this._mo = new MutationObserver((muts) => {
        const hit = muts.some(m => {
          if (m.type === 'childList')
            return [...m.addedNodes, ...m.removedNodes]
              .some(n => n.tagName === 'CAROUSEL-CARD');
          if (m.type === 'attributes')
            return m.target.tagName === 'CAROUSEL-CARD';
          return false;
        });
        if (hit) this._rebuild();
      });
      this._mo.observe(this, {
        childList: true, subtree: true,
        attributes: true,
        attributeFilter: ['icon', 'name', 'sub', 'theme', 'variant'],
      });

      this.addEventListener('keydown',    this._onKey.bind(this));
      this.addEventListener('touchstart', this._tsStart.bind(this), { passive: true });
      this.addEventListener('touchend',   this._tsEnd.bind(this),   { passive: true });
    }

    disconnectedCallback() {
      this._mo?.disconnect();
    }

    attributeChangedCallback() {
      if (this._built) this._rebuild();
    }

    /* ── 設定讀取（屬性 > 全域預設）────────────────────────── */
    _g(key) {
      const map = {
        theme: 'theme', variant: 'variant',
        iconSize: 'icon-size', iconRadius: 'icon-radius',
        cardWidth: 'card-width', visibleBack: 'visible-back',
      };
      if (map[key] && this.hasAttribute(map[key])) {
        const v = this.getAttribute(map[key]);
        return key === 'visibleBack' ? (parseInt(v) || _G.visibleBack) : v;
      }
      return _G[key];
    }

    /* ── 箭頭顯示判斷 ────────────────────────────────────────
       show-arrows 出現（含空值）且不等於 "false" → 顯示
       屬性不存在 → 隱藏（預設）
    ──────────────────────────────────────────────────────── */
    _arrowsVisible() {
      const attr = this.getAttribute('show-arrows');
      return attr !== null && attr !== 'false';
    }

    /* ── 同步箭頭顯示狀態 ─────────────────────────────────── */
    _syncArrows() {
      const show = this._arrowsVisible();
      this._bPrev.style.display = show ? 'flex' : 'none';
      this._bNext.style.display = show ? 'flex' : 'none';
    }

    /* ── 解析 <carousel-card> ─────────────────────────────── */
    _parse() {
      return Array.from(this.querySelectorAll(':scope > carousel-card')).map(el => ({
        icon:    el.getAttribute('icon')    || 'bi-person-fill',
        name:    el.getAttribute('name')    || '',
        sub:     el.getAttribute('sub')     || '',
        theme:   el.getAttribute('theme')   || null,
        variant: el.getAttribute('variant') || null,
      }));
    }

    /* ── 首次建構 DOM 骨架 ─────────────────────────────────── */
    _build() {
      this._cards      = this._parse();
      this.style.width = this._g('cardWidth');

      this.querySelector('.cc-root')?.remove();

      const root  = mk('div', 'cc-root');
      const vp    = mk('div', 'cc-vp');
      const stack = mk('div', 'cc-stack');
      const nav   = mk('div', 'cc-nav');
      const bPrev = mk('button', 'cc-arrow');
      const dots  = mk('div', 'cc-dots');
      const bNext = mk('button', 'cc-arrow');

      vp.appendChild(stack);
      bPrev.setAttribute('aria-label', 'Previous');
      bNext.setAttribute('aria-label', 'Next');
      bPrev.innerHTML = '<i class="bi bi-chevron-left"></i>';
      bNext.innerHTML = '<i class="bi bi-chevron-right"></i>';
      bPrev.addEventListener('click', () => this._prev());
      bNext.addEventListener('click', () => this._next());

      nav.append(bPrev, dots, bNext);
      root.append(vp, nav);
      this.appendChild(root);

      this._stack = stack;
      this._dots  = dots;
      this._bPrev = bPrev;
      this._bNext = bNext;

      this._buildCards();
      this._syncArrows();
      this._applyPos();
      requestAnimationFrame(() => this._syncH());
    }

    /* ── 輕量重建（資料變動 / 屬性變動）──────────────────────── */
    _rebuild() {
      this._cards      = this._parse();
      this._idx        = Math.min(this._idx, Math.max(this._cards.length - 1, 0));
      this.style.width = this._g('cardWidth');
      this._buildCards();
      this._syncArrows();
      this._applyPos();
      requestAnimationFrame(() => this._syncH());
    }

    /* ── 建立卡片元素 ─────────────────────────────────────── */
    _buildCards() {
      this._stack.innerHTML = '';
      this._dots.innerHTML  = '';
      this._wraps = [];

      const gT   = resolveTheme(this._g('theme'), this._g('variant'));
      const ms   = _G.transitionMs;
      const iSz  = this._g('iconSize');
      const iPad = _G.iconPadding;
      const iRad = this._g('iconRadius') || _G.iconRadius;
      const cRad = _G.cardRadius;
      const bxSz = `calc(${iSz} + ${iPad} * 2)`;

      this._cards.forEach((card, i) => {
        const t = card.theme
          ? resolveTheme(card.theme, card.variant ?? this._g('variant'))
          : gT;

        /* 定位包裝 */
        const wrap = mk('div', 'cc-wrap');
        wrap.style.transition =
          `transform ${ms}ms cubic-bezier(.4,0,.2,1),`
          + `opacity ${ms}ms ease,`
          + `filter ${ms}ms ease`;

        /* 視覺卡面 */
        const face = mk('div', 'cc-face');
        Object.assign(face.style, {
          background:   t.cardBg,
          border:       t.border,
          borderRadius: cRad,
          boxShadow:    t.shadow,
        });

        /* Icon 槽 */
        const slot = mk('div', 'cc-icon-slot');
        Object.assign(slot.style, {
          width: bxSz, height: bxSz, minWidth: bxSz,
          background: t.iconBg, borderRadius: iRad,
        });
        const ico = document.createElement('i');
        ico.className = `bi ${card.icon}`;
        Object.assign(ico.style, { fontSize: iSz, color: t.iconFg });
        slot.appendChild(ico);

        /* 文字 */
        const txt  = mk('div', 'cc-text');
        const name = mk('div', 'cc-name');
        const sub  = mk('div', 'cc-sub');
        name.style.color = t.nameFg;
        name.textContent = card.name;
        sub.style.color  = t.subFg;
        sub.textContent  = card.sub;
        txt.append(name, sub);

        face.append(slot, txt);
        wrap.appendChild(face);

        /* 點擊後方卡片跳轉 */
        wrap.addEventListener('click', () => {
          if (i !== this._idx) this._goTo(i);
        });

        this._stack.appendChild(wrap);
        this._wraps.push(wrap);

        /* 點狀指示器 */
        const dot = mk('div', 'cc-dot');
        dot.style.background = (i === this._idx) ? t.dotOn : t.dotOff;
        dot.style.width      = (i === this._idx) ? '22px' : '8px';
        dot.addEventListener('click', () => this._goTo(i));
        this._dots.appendChild(dot);
      });

      this._styleNavBtns(gT);
    }

    _styleNavBtns(t) {
      [this._bPrev, this._bNext].forEach(btn => {
        Object.assign(btn.style, {
          borderColor: t.btnBd,
          color:       t.btnFg,
          background:  'transparent',
        });
        btn.onmouseenter = () => {
          btn.style.background = t.btnHovBg;
          btn.style.color      = t.btnHovFg;
        };
        btn.onmouseleave = () => {
          btn.style.background = 'transparent';
          btn.style.color      = t.btnFg;
        };
      });
    }

    /* ── 套用堆疊位置 ─────────────────────────────────────── */
    _applyPos() {
      const total  = this._cards.length;
      const vBack  = this._g('visibleBack');
      const offY   = _G.stackOffsetY;
      const scStep = _G.stackScale;
      const blStep = _G.stackBlur;
      const opStep = _G.stackOpacity;

      this._wraps.forEach((wrap, i) => {
        const dist = (this._idx - i + total) % total;

        if (dist === 0) {
          /* 作用中卡片 */
          Object.assign(wrap.style, {
            transform:     'translateX(-50%) translateY(0) scale(1)',
            opacity:       '1',
            filter:        'none',
            zIndex:        '20',
            pointerEvents: 'none',
            cursor:        'default',
          });
        } else if (dist <= vBack) {
          /* 後方可見卡片 */
          const ty = -(dist * offY);
          const sc = Math.max(1 - dist * scStep, 0.5);
          const bl = dist * blStep;
          const op = Math.max(1 - dist * opStep, 0.05);
          Object.assign(wrap.style, {
            transform:     `translateX(-50%) translateY(${ty}px) scale(${sc})`,
            opacity:       String(op),
            filter:        `blur(${bl}px)`,
            zIndex:        String(20 - dist),
            pointerEvents: 'auto',
            cursor:        'pointer',
          });
        } else {
          /* 隱藏卡片 */
          const ty = -((vBack + 1) * offY);
          const sc = Math.max(1 - (vBack + 1) * scStep, 0.5);
          Object.assign(wrap.style, {
            transform:     `translateX(-50%) translateY(${ty}px) scale(${sc})`,
            opacity:       '0',
            filter:        `blur(${(vBack + 1) * blStep}px)`,
            zIndex:        '1',
            pointerEvents: 'none',
          });
        }
      });

      this._syncDots();
    }

    _syncDots() {
      const t    = resolveTheme(this._g('theme'), this._g('variant'));
      const dots = this._dots.querySelectorAll('.cc-dot');
      dots.forEach((d, i) => {
        const on = (i === this._idx);
        d.style.background = on ? t.dotOn  : t.dotOff;
        d.style.width      = on ? '22px' : '8px';
      });
    }

    /* 同步堆疊容器高度（卡高 + 後方偏移量）*/
    _syncH() {
      const face  = this._stack.querySelector('.cc-face');
      const h     = face ? face.offsetHeight : 88;
      const vBack = this._g('visibleBack');
      this._stack.style.height = `${h + vBack * _G.stackOffsetY + 4}px`;
    }

    /* ── 導航 ─────────────────────────────────────────────── */
    _prev() { this._goTo((this._idx - 1 + this._cards.length) % this._cards.length); }
    _next() { this._goTo((this._idx + 1) % this._cards.length); }

    _goTo(i) {
      if (i < 0 || i >= this._cards.length || i === this._idx) return;
      this._idx = i;
      this._applyPos();
    }

    /* ── 鍵盤 ─────────────────────────────────────────────── */
    _onKey(e) {
      if (e.key === 'ArrowLeft')  { this._prev(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { this._next(); e.preventDefault(); }
    }

    /* ── Touch 滑動 ───────────────────────────────────────── */
    _tsStart(e) { this._tx0 = e.touches[0].clientX; }
    _tsEnd(e) {
      if (this._tx0 === null) return;
      const dx = e.changedTouches[0].clientX - this._tx0;
      if (Math.abs(dx) > 40) dx < 0 ? this._next() : this._prev();
      this._tx0 = null;
    }
  }

  customElements.define('card-carousel', CardCarouselEl);

})();

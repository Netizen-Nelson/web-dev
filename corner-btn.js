/**
 * <corner-btn> Web Component  v2
 * 在父容器的指定角落放置一個三角形可點擊按鈕，尖端朝內。
 * v2 新增：target 屬性，點擊後切換目標元素的顯示 / 隱藏狀態。
 *
 * ── 基本屬性 ──────────────────────────────────────────────────
 *   corner        top-left | top-right | bottom-left | bottom-right（必填）
 *   size          三角形邊長 px，預設 32
 *   color         填滿色彩（關閉 / 預設狀態），預設 #C8DD5A
 *   active-color  目標顯示中（開啟）時的三角形色彩（未設則不變色）
 *   action        自訂識別字串，出現在事件 detail 中
 *   title         滑鼠懸停提示（tooltip）
 *   disabled      禁用狀態（布林屬性）
 *
 * ── 切換屬性（toggle）──────────────────────────────────────────
 *   target        CSS 選擇器，逗號分隔可指定多個目標元素
 *   toggle-mode   display（預設）| class
 *                   display → 操作 el.style.display
 *                   class   → 在目標上加 / 移除指定 CSS class
 *   toggle-class  class 模式使用的 class 名稱，預設 is-hidden
 *   animate       fade → 淡入淡出動畫（僅 display 模式有效）
 *
 * ── 全域設定 ──────────────────────────────────────────────────
 *   CornerBtn.config({ size, color })
 *   CornerBtn.resetConfig()
 *
 * ── 事件 ──────────────────────────────────────────────────────
 *   click          原生 click 事件（自動觸發）
 *   corner-click   自訂，bubbles，detail: { corner, action, color, size }
 *   toggle         自訂，bubbles，detail: { open, corner, action, targets[] }
 *                  （僅在設定 target 屬性時發出）
 */

(() => {
  'use strict';

  /* ═══════════════════════════════════════════
     全域樣式（只注入一次）
  ═══════════════════════════════════════════ */
  const STYLE_ID = '__corner-btn-style__';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      corner-btn {
        position  : absolute;
        display   : block;
        z-index   : 10;
        cursor    : pointer;
        line-height: 0;
        padding   : 0;
        border    : none;
        background: none;
        outline   : none;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      corner-btn[corner="top-left"]     { top: 0; left: 0; }
      corner-btn[corner="top-right"]    { top: 0; right: 0; }
      corner-btn[corner="bottom-left"]  { bottom: 0; left: 0; }
      corner-btn[corner="bottom-right"] { bottom: 0; right: 0; }

      corner-btn svg { display: block; }

      corner-btn svg polygon {
        transition: opacity .15s ease, filter .15s ease, fill .2s ease;
      }
      corner-btn:hover  svg polygon { opacity: .72; filter: brightness(1.3); }
      corner-btn:active svg polygon { opacity: .45; filter: brightness(0.85); }

      corner-btn[disabled] {
        pointer-events: none;
        opacity: .25;
      }
      corner-btn:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════
     預設全域設定
  ═══════════════════════════════════════════ */
  const DEFAULTS = {
    size : 32,
    color: '#C8DD5A',
  };

  let _cfg = { ...DEFAULTS };

  /* ═══════════════════════════════════════════
     各角落的 SVG polygon points
  ═══════════════════════════════════════════ */
  const POLY_POINTS = {
    'top-left'    : s => `0,0 ${s},0 0,${s}`,
    'top-right'   : s => `0,0 ${s},0 ${s},${s}`,
    'bottom-left' : s => `0,0 0,${s} ${s},${s}`,
    'bottom-right': s => `${s},0 0,${s} ${s},${s}`,
  };

  /* ═══════════════════════════════════════════
     動畫工具
  ═══════════════════════════════════════════ */
  function showEl(el, animate) {
    if (animate === 'fade') {
      el.style.opacity    = '0';
      el.style.display    = '';
      el.style.transition = 'opacity .25s ease';
      // 雙 rAF 確保瀏覽器完成 layout 再開始過渡
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.addEventListener('transitionend', () => {
          el.style.transition = '';
        }, { once: true });
      }));
    } else {
      el.style.display = '';
    }
  }

  function hideEl(el, animate) {
    if (animate === 'fade') {
      el.style.transition = 'opacity .25s ease';
      el.style.opacity    = '0';
      el.addEventListener('transitionend', () => {
        el.style.display    = 'none';
        el.style.opacity    = '';
        el.style.transition = '';
      }, { once: true });
    } else {
      el.style.display = 'none';
    }
  }

  /* ═══════════════════════════════════════════
     Web Component
  ═══════════════════════════════════════════ */
  class CornerBtn extends HTMLElement {

    static get observedAttributes() {
      return ['corner', 'size', 'color', 'active-color', 'action',
              'title', 'disabled', 'target'];
    }

    connectedCallback() {
      this._ensureParentPositioned();
      this._render();
      this._bindEvents();
      // target 設定後，延遲一 tick 讓目標元素確定在 DOM 中
      setTimeout(() => this._syncColorToTargetState(), 0);
    }

    attributeChangedCallback(name) {
      if (!this.isConnected) return;
      this._render();
      if (name === 'target') {
        setTimeout(() => this._syncColorToTargetState(), 0);
      }
    }

    /* ── 確保父元素可定位 ─────────────────── */
    _ensureParentPositioned() {
      const p = this.parentElement;
      if (p && getComputedStyle(p).position === 'static') {
        p.style.position = 'relative';
      }
    }

    /* ── 渲染 SVG ─────────────────────────── */
    _render() {
      const corner  = this.getAttribute('corner') || 'top-right';
      const size    = Math.max(8, parseInt(this.getAttribute('size') || _cfg.size, 10));
      const color   = this._currentColor();
      const title   = this.getAttribute('title') || '';
      const polyFn  = POLY_POINTS[corner] || POLY_POINTS['top-right'];
      const titleTag = title ? `<title>${_esc(title)}</title>` : '';

      this.innerHTML =
        `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="${title ? 'false' : 'true'}"
              role="${title ? 'img' : 'presentation'}"
         >${titleTag}<polygon points="${polyFn(size)}" fill="${_esc(color)}"/></svg>`;

      if (!this.hasAttribute('disabled')) {
        this.setAttribute('tabindex', '0');
        this.setAttribute('role', 'button');
        if (title) this.setAttribute('aria-label', title);
      } else {
        this.removeAttribute('tabindex');
        this.setAttribute('aria-disabled', 'true');
      }
    }

    /* ── 決定目前應顯示的色彩 ────────────── */
    _currentColor() {
      const activeColor = this.getAttribute('active-color');
      if (activeColor && this._isOpen === true) return activeColor;
      return this.getAttribute('color') || _cfg.color;
    }

    /* ── 依目標元素目前狀態同步按鈕色彩 ──── */
    _syncColorToTargetState() {
      const els = this._targetEls();
      if (!els.length) return;
      this._isOpen = !_isElHidden(els[0]);
      this._applyColor();
    }

    /* ── 僅更新 polygon fill（不重繪整個 SVG）*/
    _applyColor() {
      const poly = this.querySelector('polygon');
      if (poly) poly.setAttribute('fill', _esc(this._currentColor()));
    }

    /* ── 取得目標元素陣列 ─────────────────── */
    _targetEls() {
      const sel = (this.getAttribute('target') || '').trim();
      if (!sel) return [];
      try {
        return Array.from(document.querySelectorAll(sel));
      } catch { return []; }
    }

    /* ── 切換目標顯示狀態 ────────────────── */
    _handleToggle() {
      const els = this._targetEls();
      if (!els.length) return;

      const mode    = this.getAttribute('toggle-mode') || 'display';
      const animate = this.getAttribute('animate') || '';
      const nextOpen = _isElHidden(els[0]);   // 目前隱藏 → 下一步顯示

      els.forEach(el => {
        if (mode === 'class') {
          const cls = this.getAttribute('toggle-class') || 'is-hidden';
          el.classList.toggle(cls, !nextOpen);  // !nextOpen = 隱藏時加上 class
        } else {
          nextOpen ? showEl(el, animate) : hideEl(el, animate);
        }
      });

      this._isOpen = nextOpen;
      this._applyColor();

      this.dispatchEvent(new CustomEvent('toggle', {
        bubbles   : true,
        cancelable: true,
        detail    : {
          open   : nextOpen,
          corner : this.getAttribute('corner') || 'top-right',
          action : this.getAttribute('action') || null,
          targets: els,
        },
      }));
    }

    /* ── 綁定事件（只綁一次） ─────────────── */
    _bindEvents() {
      if (this._evBound) return;
      this._evBound = true;

      this.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });

      this.addEventListener('click', () => {
        if (this.hasAttribute('disabled')) return;

        // target 切換
        if (this.getAttribute('target')) {
          this._handleToggle();
        }

        // corner-click 事件
        this.dispatchEvent(new CustomEvent('corner-click', {
          bubbles   : true,
          cancelable: true,
          detail    : {
            corner: this.getAttribute('corner') || 'top-right',
            action: this.getAttribute('action') || null,
            color : this._currentColor(),
            size  : parseInt(this.getAttribute('size') || _cfg.size, 10),
          },
        }));
      });
    }

    /* ── 公開：強制設定開關狀態 ──────────── */
    open()  { this._setOpen(true);  }
    close() { this._setOpen(false); }

    _setOpen(toOpen) {
      const els = this._targetEls();
      if (!els.length) return;
      const mode    = this.getAttribute('toggle-mode') || 'display';
      const animate = this.getAttribute('animate') || '';

      els.forEach(el => {
        if (mode === 'class') {
          const cls = this.getAttribute('toggle-class') || 'is-hidden';
          el.classList.toggle(cls, !toOpen);
        } else {
          toOpen ? showEl(el, animate) : hideEl(el, animate);
        }
      });

      this._isOpen = toOpen;
      this._applyColor();
    }

    /* ── 靜態全域設定 ─────────────────────── */
    static config(opts = {}) { Object.assign(_cfg, opts); }
    static resetConfig()     { _cfg = { ...DEFAULTS };    }
  }

  /* ═══════════════════════════════════════════
     私有工具（模組內使用）
  ═══════════════════════════════════════════ */
  function _isElHidden(el) {
    if (!el) return true;
    if (el.style.display === 'none') return true;
    if (getComputedStyle(el).display === 'none') return true;
    return false;
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ═══════════════════════════════════════════
     註冊
  ═══════════════════════════════════════════ */
  customElements.define('corner-btn', CornerBtn);
  window.CornerBtn = CornerBtn;

})();

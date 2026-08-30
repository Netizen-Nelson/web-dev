(function (global) {
  'use strict';

  var BRAND = {
    shell:    '#C6C7BD',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#0ABDC6',
    safe:     '#40C99A',
    vanilla:  '#DBEDD8',
    yellow:   '#DECA4B',
    focus:    '#A0CF72',
    info:     '#4285EB',
    stone:    '#95BDD7',
    indigo:   '#9B72CF',
    pink:     '#FFB3D9',
    orange:   '#EDA109',
    teal:     '#0DA591'
  };

  var BG     = '#0C0D0C';
  var BG_RGB = [12, 13, 12];

  var CFG = global.UiBtnConfig = Object.assign({
    theme:        'shell',
    size:         'md',
    variant:      'fill',
    animation:    'slide',
    animDuration: 320,
    chevron:      false
  }, global.UiBtnConfig || {});

  var SIZES = {
    sm: { fs: '0.85rem', pad: '5px 12px',  r: '20px', dim: '32px', gap: '5px', icoFs: '1rem'    },
    md: { fs: '1rem',    pad: '8px 16px',  r: '24px', dim: '40px', gap: '6px', icoFs: '1.15rem' },
    lg: { fs: '1.1rem',  pad: '10px 20px', r: '28px', dim: '48px', gap: '8px', icoFs: '1.3rem'  }
  };

  var CSS = [
    'ui-btn{display:none}',

    '.ubtn-wrap{display:inline-block;vertical-align:middle}',

    '.ubtn{display:inline-flex;align-items:center;justify-content:center;' +
      'border:none;cursor:pointer;font-family:inherit;font-weight:600;' +
      'line-height:1;white-space:nowrap;user-select:none;outline:none;' +
      'box-sizing:border-box;position:relative;' +
      'transition:filter .2s ease,transform .12s ease,background .2s ease}',

    '.ubtn:not([disabled]):hover{filter:brightness(1.1)}',
    '.ubtn:not([disabled]):active{transform:scale(0.93)}',
    '.ubtn[disabled]{opacity:.48;cursor:not-allowed;pointer-events:none}',

    /* fill */
    '.ubtn-fill{color:' + BG + ';background:var(--ubtn-c)}',
    '.ubtn-fill.is-open{filter:brightness(0.88)}',
    '.ubtn-fill.is-open:hover{filter:brightness(0.92)}',

    /* outline */
    '.ubtn-outline{background:transparent;color:var(--ubtn-c);border:1.5px solid var(--ubtn-c)}',
    '.ubtn-outline:hover{background:var(--ubtn-ch);filter:none}',
    '.ubtn-outline.is-open{background:var(--ubtn-ch)}',

    /* ghost */
    '.ubtn-ghost{background:transparent;color:var(--ubtn-c)}',
    '.ubtn-ghost:hover{background:var(--ubtn-ch);filter:none}',
    '.ubtn-ghost.is-open{background:var(--ubtn-ch)}',

    /* chevron */
    '.ubtn-chev{display:inline-flex;align-items:center;flex-shrink:0;margin-left:2px;' +
      'transition:transform .28s ease}',
    '.ubtn.is-open .ubtn-chev{transform:rotate(180deg)}',

    /* icon */
    '.ubtn-ico{display:inline-flex;align-items:center;flex-shrink:0;line-height:1}',

    /* label */
    '.ubtn-lbl{flex-shrink:0}',

    /* icon-only 狀態圓點 */
    '.ubtn-dot{position:absolute;bottom:3px;right:3px;width:5px;height:5px;' +
      'border-radius:50%;opacity:0;transition:opacity .2s ease}',
    '.ubtn-fill .ubtn-dot{background:' + BG + '}',
    '.ubtn-outline .ubtn-dot,.ubtn-ghost .ubtn-dot{background:var(--ubtn-c)}',
    '.ubtn.is-open .ubtn-dot{opacity:1}',

    /* ── Alert 通知 ── */
    /* 堆疊容器 */
    '.ubtn-astack{position:fixed;left:50%;transform:translateX(-50%);z-index:9999;' +
      'display:flex;flex-direction:column;align-items:center;gap:8px;' +
      'pointer-events:none;max-width:calc(100vw - 32px)}',
    '.ubtn-astack-top{top:16px}',
    '.ubtn-astack-bottom{bottom:16px;flex-direction:column-reverse}',

    /* Alert 條目 */
    '.ubtn-alert{display:flex;align-items:center;gap:8px;' +
      'padding:10px 14px 10px 18px;border-radius:24px;' +
      'font-weight:600;font-size:1rem;line-height:1.4;' +
      'pointer-events:all;white-space:nowrap;max-width:88vw;' +
      'opacity:0;transition:opacity .25s ease,transform .25s ease}',
    '.ubtn-astack-top .ubtn-alert{transform:translateY(-14px)}',
    '.ubtn-astack-bottom .ubtn-alert{transform:translateY(14px)}',
    '.ubtn-alert.ubtn-alert-in{opacity:1;transform:translateY(0)}',

    /* Alert 關閉按鈕 */
    '.ubtn-alert-x{background:none;border:none;cursor:pointer;' +
      'font-size:1.15rem;line-height:1;padding:0;margin-left:6px;' +
      'opacity:.65;font-weight:700;flex-shrink:0;' +
      'transition:opacity .15s ease}',
    '.ubtn-alert-x:hover{opacity:1}'

  ].join('\n');

  var _cssInj = false;
  function injectCSS() {
    if (_cssInj) return;
    _cssInj = true;
    var s = document.createElement('style');
    s.id = 'ubtn-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  injectCSS();

  /* ================================================================
   * 工具函式
   * ================================================================ */
  function resolveColor(v) {
    if (!v) return null;
    v = String(v).trim();
    return BRAND[v] || (/^#|^rgb/.test(v) ? v : null);
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /* 混色：將主題色與 BG 混合，回傳不透明色，避免使用低透明度 rgba */
  function blendColor(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgb(' +
      Math.round(BG_RGB[0] + alpha * (c[0] - BG_RGB[0])) + ',' +
      Math.round(BG_RGB[1] + alpha * (c[1] - BG_RGB[1])) + ',' +
      Math.round(BG_RGB[2] + alpha * (c[2] - BG_RGB[2])) + ')';
  }

  /* ── unlock-chunk 屬性解析器 ──────────────────────────────────
     格式：  "demoId:chunkId"
     多個：  "demoId:0,demoId:1,otherId:2"
     回傳 [{ demoId: string, chunkId: number }, ...]
  ─────────────────────────────────────────────────────────── */
  function parseUnlockChunk(val) {
    if (!val) return [];
    return val.split(',').reduce(function (acc, seg) {
      seg = seg.trim();
      var parts = seg.split(':');
      if (parts.length !== 2) {
        console.warn('[ui-btn] unlock-chunk 格式錯誤（應為 "demoId:chunkId"）：', seg);
        return acc;
      }
      var demoId  = parts[0].trim();
      var chunkId = parseInt(parts[1].trim(), 10);
      if (!demoId || isNaN(chunkId)) {
        console.warn('[ui-btn] unlock-chunk 解析失敗：', seg);
        return acc;
      }
      acc.push({ demoId: demoId, chunkId: chunkId });
      return acc;
    }, []);
  }

  function mkIco(name) {
    if (!name) return '';
    if (/^bi-/.test(name)) {
      return '<span class="ubtn-ico"><i class="bi ' + name + '" aria-hidden="true"></i></span>';
    }
    return '';
  }

  /* 內建 Chevron SVG（不依賴 BI） */
  var CHEV_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"' +
    ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M6 9 12 15 18 9"/></svg>';

  /* ================================================================
   * 動畫函式
   *
   * ★ 修正 v1.1.0：
   *   - animOpen slide 結束後同步清除 opacity/overflow/transition inline style
   *   - animClose/animOpen 加入 _animLock 防止快速連點導致 scrollHeight=0
   * ================================================================ */
  function rAF2(fn) {
    requestAnimationFrame(function () { requestAnimationFrame(fn); });
  }

  function onTransEnd(el, prop, fn) {
    var done = false;
    function h(e) {
      if (e.propertyName === prop && !done) {
        done = true;
        el.removeEventListener('transitionend', h);
        fn();
      }
    }
    el.addEventListener('transitionend', h);
    /* fallback：若 transition 未觸發（元素不可見等）仍確保 cleanup */
    setTimeout(function () {
      if (!done) { done = true; el.removeEventListener('transitionend', h); fn(); }
    }, 600);
  }

  function clearAnim(el) {
    /* 中止進行中的動畫，清除所有動畫相關 inline style */
    el.style.transition = el.style.maxHeight = el.style.overflow =
      el.style.opacity   = '';
  }

  function animOpen(el, mode, dur) {
    clearAnim(el); /* ★ 先中止上一輪動畫（防止快速連點） */

    if (mode === 'none') { el.style.display = ''; return; }

    el.style.display = '';

    if (mode === 'fade') {
      el.style.opacity    = '0';
      el.style.transition = 'opacity ' + dur + 'ms ease';
      rAF2(function () { el.style.opacity = '1'; });
      onTransEnd(el, 'opacity', function () {
        el.style.transition = el.style.opacity = '';
      });
    } else {
      /* slide
       * ★ 讀 scrollHeight 在 display='' 之後、maxHeight='0' 之前
       *   此時 el 已可佈局但尚未繪製，瀏覽器批次處理樣式，不會閃爍 */
      var h = el.scrollHeight || 200; /* fallback 防止 0 */
      el.style.overflow   = 'hidden';
      el.style.maxHeight  = '0';
      el.style.opacity    = '0';
      el.style.transition = 'max-height ' + dur + 'ms ease, opacity ' +
        Math.round(dur * 0.7) + 'ms ease';
      rAF2(function () {
        el.style.maxHeight = h + 'px';
        el.style.opacity   = '1';
      });
      onTransEnd(el, 'max-height', function () {
        /* ★ 全部清除，包含 opacity，讓元素回到自然狀態 */
        el.style.maxHeight = el.style.overflow =
          el.style.transition = el.style.opacity = '';
      });
    }
  }

  function animClose(el, mode, dur) {
    clearAnim(el); /* ★ 先中止上一輪動畫 */

    if (mode === 'none') { el.style.display = 'none'; return; }

    if (mode === 'fade') {
      el.style.transition = 'opacity ' + dur + 'ms ease';
      el.style.opacity    = '0';
      onTransEnd(el, 'opacity', function () {
        el.style.display    = 'none';
        el.style.transition = el.style.opacity = '';
      });
    } else {
      /* slide：先確保 maxHeight 從實際高度開始 */
      var h = el.scrollHeight || 1;
      el.style.overflow   = 'hidden';
      el.style.maxHeight  = h + 'px';
      el.style.transition = 'max-height ' + dur + 'ms ease, opacity ' +
        Math.round(dur * 0.7) + 'ms ease';
      rAF2(function () {
        el.style.maxHeight = '0';
        el.style.opacity   = '0';
      });
      onTransEnd(el, 'max-height', function () {
        el.style.display    = 'none';
        el.style.maxHeight  = el.style.overflow =
          el.style.transition = el.style.opacity = '';
      });
    }
  }

  /* ================================================================
   * Group 手風琴登錄表
   * ================================================================ */
  var _groups = {};

  /* ================================================================
   * UiBtn 建構子
   * ================================================================ */
  function UiBtn(el) {
    this.el          = el;
    this.icon        = el.getAttribute('icon')         || '';
    this.iconActive  = el.getAttribute('icon-active')  || '';
    this.theme       = el.getAttribute('theme')        || CFG.theme;
    this.size        = el.getAttribute('size')         || CFG.size;
    this.variant     = el.getAttribute('variant')      || CFG.variant;
    this.animation   = el.getAttribute('animation')    || CFG.animation;
    this.animDur     = parseInt(el.getAttribute('anim-duration')) || CFG.animDuration;
    this.hasChevron  = el.hasAttribute('chevron')      || !!CFG.chevron;
    this.startOpen   = el.hasAttribute('open');
    this.disabled    = el.hasAttribute('disabled');
    this.targetId    = el.getAttribute('target')       || '';
    this.labelClosed = el.textContent.trim();
    this.labelOpen   = el.getAttribute('label-open')   || '';
    this.group       = el.getAttribute('group')        || '';
    this.tooltip     = el.getAttribute('tooltip')      || '';

    this.unlockChunkTargets = parseUnlockChunk(el.getAttribute('unlock-chunk') || '');

    this.color   = resolveColor(this.theme) || BRAND.shell;
    this.isOpen  = false;
    this._target = null;
    this._btn    = null;
    this._lbl    = null;
    this._icoEl  = null;

    /* ★ 在任何 DOM 操作前捕捉 nextElementSibling
     *   若緊鄰元素也是 ui-btn，往後再找一個（並排多鈕的容錯）
     *   但當按鈕在 flex/grid 容器內時，仍建議用 target 屬性 */
    var ns = el.nextElementSibling;
    while (ns && ns.tagName && ns.tagName.toLowerCase() === 'ui-btn') {
      ns = ns.nextElementSibling;
    }
    this._nextSib = ns || null;
  }

  /* ----------------------------------------------------------------
   * init
   * ---------------------------------------------------------------- */
  UiBtn.prototype.init = function () {
    this._render();

    /* 解析目標元素 */
    if (this.targetId) {
      this._target = document.getElementById(this.targetId);
      if (!this._target) console.warn('[ui-btn] 找不到 target: #' + this.targetId);
    } else {
      this._target = this._nextSib;
      if (!this._target) {
        console.warn('[ui-btn] 找不到目標元素，請設定 target 屬性。');
      }
    }

    /* 初始展開/收合狀態 */
    if (this._target) {
      var hidden = this._target.style.display === 'none' ||
        (this._target.style.display === '' &&
          getComputedStyle(this._target).display === 'none');
      this.isOpen = this.startOpen || !hidden;
      if (this.startOpen && hidden) this._target.style.display = '';
    } else {
      this.isOpen = this.startOpen;
    }

    this._syncBtn();

    /* 若初始狀態已展開，立即解鎖對應 chunk
       用 setTimeout 確保 chunk-demo 已完成初始化 */
    if (this.isOpen && this.unlockChunkTargets.length) {
      var self = this;
      setTimeout(function () { self._applyChunkLock(false); }, 0);
    }
  };

  /* ----------------------------------------------------------------
   * _render
   * ---------------------------------------------------------------- */
  UiBtn.prototype._render = function () {
    var self     = this;
    var sz       = SIZES[this.size] || SIZES.md;
    var hasText  = !!this.labelClosed;
    var iconOnly = !hasText;
    var hoverBg  = blendColor(this.color, 0.22);

    var wrap = document.createElement('span');
    wrap.className = 'ubtn-wrap';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ubtn ubtn-' + this.variant;
    if (this.disabled) btn.setAttribute('disabled', '');
    if (this.tooltip)  btn.title = this.tooltip;
    btn.style.cssText = '--ubtn-c:' + this.color + ';--ubtn-ch:' + hoverBg;

    if (iconOnly) {
      btn.style.width        = sz.dim;
      btn.style.height       = sz.dim;
      btn.style.borderRadius = '50%';
      btn.style.fontSize     = sz.icoFs;
    } else {
      btn.style.padding      = sz.pad;
      btn.style.borderRadius = sz.r;
      btn.style.gap          = sz.gap;
      btn.style.fontSize     = sz.fs;
    }

    if (this.icon) {
      btn.insertAdjacentHTML('beforeend', mkIco(this.icon));
      this._icoEl = btn.querySelector('.ubtn-ico i');
    }

    if (hasText) {
      var lbl = document.createElement('span');
      lbl.className   = 'ubtn-lbl';
      lbl.textContent = this.labelClosed;
      btn.appendChild(lbl);
      this._lbl = lbl;
    }

    if (this.hasChevron) {
      var chev = document.createElement('span');
      chev.className = 'ubtn-chev';
      chev.innerHTML = CHEV_SVG;
      btn.appendChild(chev);
    }

    if (iconOnly) {
      var dot = document.createElement('span');
      dot.className = 'ubtn-dot';
      btn.appendChild(dot);
    }

    btn.addEventListener('click', function () { self._toggle(); });
    wrap.appendChild(btn);
    this.el.before(wrap);
    this.el.style.display = 'none';
    this._btn  = btn;
    this._wrap = wrap;
  };

  /* ----------------------------------------------------------------
   * _toggle / _open / _close / _syncBtn
   * ---------------------------------------------------------------- */
  UiBtn.prototype._toggle = function () {
    var self = this;
    if (this.isOpen) {
      this._close();
    } else {
      if (this.group && _groups[this.group]) {
        _groups[this.group].forEach(function (b) {
          if (b !== self && b.isOpen) b._close();
        });
      }
      this._open();
    }
  };

  UiBtn.prototype._open = function () {
    this.isOpen = true;
    this._syncBtn();
    if (this._target) animOpen(this._target, this.animation, this.animDur);
    this._applyChunkLock(false);   /* false = 解鎖 */
  };

  UiBtn.prototype._close = function () {
    this.isOpen = false;
    this._syncBtn();
    if (this._target) animClose(this._target, this.animation, this.animDur);
    this._applyChunkLock(true);    /* true  = 回鎖 */
  };

  /* ── chunk-demo 解鎖 / 回鎖 ───────────────────────────────────
     lock = false → 對每個目標呼叫 unlockChunk(chunkId)
     lock = true  → 對每個目標呼叫 lockChunk(chunkId)
  ─────────────────────────────────────────────────────────── */
  UiBtn.prototype._applyChunkLock = function (lock) {
    if (!this.unlockChunkTargets.length) return;
    this.unlockChunkTargets.forEach(function (t) {
      var el = document.getElementById(t.demoId);
      if (!el) {
        console.warn('[ui-btn] unlock-chunk：找不到 chunk-demo #' + t.demoId);
        return;
      }
      var method = lock ? 'lockChunk' : 'unlockChunk';
      if (typeof el[method] === 'function') {
        el[method](t.chunkId);
      } else {
        console.warn('[ui-btn] unlock-chunk：#' + t.demoId + ' 不支援 ' + method + '()，請確認已載入 chunk-demo.js');
      }
    });
  };

  UiBtn.prototype._syncBtn = function () {
    if (!this._btn) return;
    this._btn.classList.toggle('is-open', this.isOpen);
    if (this._icoEl) {
      this._icoEl.className = (this.isOpen && this.iconActive)
        ? 'bi ' + this.iconActive
        : 'bi ' + this.icon;
    }
    if (this._lbl) {
      this._lbl.textContent = (this.isOpen && this.labelOpen)
        ? this.labelOpen : this.labelClosed;
    }
  };

  var _alertStacks = {};

  function ensureAlertStack(pos) {
    if (!_alertStacks[pos]) {
      var c = document.createElement('div');
      c.className = 'ubtn-astack ubtn-astack-' + pos;
      document.body.appendChild(c);
      _alertStacks[pos] = c;
    }
    return _alertStacks[pos];
  }

  function showAlert(message, opts) {
    opts  = opts || {};
    var pos   = opts.position === 'bottom' ? 'bottom' : 'top';
    var color = resolveColor(opts.theme) || BRAND.safe;
    var dur   = (opts.duration != null) ? +opts.duration : 3000;
    var icon  = opts.icon || '';

    var width = opts.width ? String(opts.width).trim() : '';
    if (width && !/^\d+(\.\d+)?(px|%)$/.test(width)) {
      console.warn('[ui-btn] alert width 格式無效（應為 px 或 %，例如 "400px"、"80%"），已忽略。');
      width = '';
    }

    var stack = ensureAlertStack(pos);

    var item = document.createElement('div');
    item.className = 'ubtn-alert';
    item.style.background = color;
    item.style.color      = BG;

    if (width) {
      item.style.width      = width;
      item.style.maxWidth   = 'none';
      item.style.whiteSpace = 'normal';
    }

    if (icon && /^bi-/.test(icon)) {
      var iEl = document.createElement('i');
      iEl.className = 'bi ' + icon;
      iEl.setAttribute('aria-hidden', 'true');
      iEl.style.flexShrink = '0';
      item.appendChild(iEl);
    }
    var txt = document.createElement('span');
    txt.textContent = message;
    item.appendChild(txt);
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'ubtn-alert-x';
    x.innerHTML = '&times;';
    x.style.color = BG;
    item.appendChild(x);
    function dismiss() {
      item.classList.remove('ubtn-alert-in');
      onTransEnd(item, 'opacity', function () { item.remove(); });
    }

    x.addEventListener('click', dismiss);
    var timer = (dur > 0) ? setTimeout(dismiss, dur) : null;
    item.addEventListener('click', function (e) {
      if (e.target !== x) { clearTimeout(timer); dismiss(); }
    });

    stack.appendChild(item);
    rAF2(function () { item.classList.add('ubtn-alert-in'); });

    return { dismiss: dismiss };
  }

  showAlert.clear = function () {
    ['top', 'bottom'].forEach(function (pos) {
      if (_alertStacks[pos]) {
        Array.from(_alertStacks[pos].children).forEach(function (c) { c.remove(); });
      }
    });
  };

  function boot() {
    var instances = [];
    document.querySelectorAll('ui-btn:not([data-ubtn])').forEach(function (el) {
      el.setAttribute('data-ubtn', '');
      instances.push(new UiBtn(el));
    });
    instances.forEach(function (b) {
      b.init();
      if (b.group) {
        if (!_groups[b.group]) _groups[b.group] = [];
        _groups[b.group].push(b);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.UiBtn = { init: boot, alert: showAlert, config: CFG, colors: BRAND };

})(window);
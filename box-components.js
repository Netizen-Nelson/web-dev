/*!
 * box-components.js
 * 語意佈局元件：<box-single> / <box-double> / <box-col>
 * 全域配置：BoxConfig
 */
(function () {
  'use strict';

  /* ════════════════════════════════════════════
     色票
  ════════════════════════════════════════════ */
  const PALETTE = {
    bg:'#0C0D0C', shell:'#C6C7BD', lavender:'#C3A5E5', special:'#C8DD5A',
    warning:'#F08080', salmon:'#E5C3B3', sky:'#08A9D1', safe:'#40C99A',
    vanilla:'#DBEDD8', yellow:'#DECA4B', focus:'#A0CF72', info:'#4285EB',
    stone:'#95BDD7', indigo:'#7B6CF0', pink:'#FFB3D9', orange:'#EDA109',
    transparent:'transparent', none:'transparent',
  };

  function rc(v) { return v ? (PALETTE[v] || v) : null; }

  function toPx(v, fb = 0) {
    const n = parseFloat(v);
    return isNaN(n) ? fb : n;
  }

  /**
   * 組合背景色（支援透明度）
   * @param {string} colorAttr  - 色票關鍵字或 hex
   * @param {string} opacityAttr - 0 ~ 1 數值字串
   */
  function buildBg(colorAttr, opacityAttr) {
    const color = rc(colorAttr);
    if (!color || color === 'transparent') return 'transparent';
    const op  = parseFloat(opacityAttr);
    const hex = color.startsWith('#') ? color.slice(1) : null;
    if (!isNaN(op) && op !== 1 && op >= 0 && hex && hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${op})`;
    }
    return color;
  }

  /** 從 border 值萃取寬度數字（px） */
  function parseBW(borderStr) {
    if (!borderStr || borderStr === 'none') return 0;
    const m = borderStr.match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 1;
  }

  /* ════════════════════════════════════════════
     全域樣式（頁面中只注入一次）
  ════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('_bx-styles')) return;
    const s = document.createElement('style');
    s.id = '_bx-styles';
    s.textContent = `
      box-single,box-double{display:block;box-sizing:border-box;position:relative}
      box-col{display:block;box-sizing:border-box;min-width:0;position:relative}
      ._bxsb{display:flex;flex-direction:column;box-sizing:border-box;width:100%}
      ._bxdb{display:flex;flex-direction:row;box-sizing:border-box;width:100%}
      ._bxdb.bxst{flex-direction:column}
      ._bxdb.bxrv{flex-direction:column-reverse}
      ._bxcp{
        position:absolute;box-sizing:border-box;
        font-weight:600;line-height:1.4;white-space:nowrap;z-index:1;
        user-select:none;
      }
    `;
    document.head.appendChild(s);
  }

  /* ════════════════════════════════════════════
     BoxConfig — 全域配置系統
  ════════════════════════════════════════════ */
  window.BoxConfig = (() => {
    const D = {
      gap:       16,
      colGap:    24,
      padding:   20,
      radius:    0,          // 預設圓角 0
      breakpoint:768,
      capBg:     '#1e1f1e',  // caption 背景
      capColor:  '#C6C7BD',  // caption 文字色
      capSize:   '0.82rem',  // caption 字體大小
      capPadV:   3,          // caption 垂直內距 (px)
      capPadH:   10,         // caption 水平內距 (px)
      capOffset: 6,          // caption 與容器內容的最小間距 (px)
    };
    const subs = new Set();
    return {
      set(opts) {
        const o = { ...opts };
        if (o.capBg)    o.capBg    = rc(o.capBg)    || o.capBg;
        if (o.capColor) o.capColor = rc(o.capColor) || o.capColor;
        Object.assign(D, o);
        subs.forEach(f => f({ ...D }));
      },
      get(k) { return k ? D[k] : { ...D }; },
      _sub(f) { subs.add(f); return () => subs.delete(f); },
    };
  })();

  /* ════════════════════════════════════════════
     Caption 管理
     - 頂部模式 (caption-pos="top")：
         caption 上邊框與容器上邊框重疊
         border 粗細自動與容器一致
         caption-align 控制水平對齊
     - 左側模式 (caption-pos="left")：
         caption 左邊框與容器左邊框重疊
         文字垂直由下至上顯示
  ════════════════════════════════════════════ */
  function syncCaption(host, a) {
    // 取消前一個待執行的 rAF
    if (host._cpRaf) { cancelAnimationFrame(host._cpRaf); host._cpRaf = null; }

    const text = a.caption;

    // 無 caption：移除元素並結束（padding 由 _applyBase 重置）
    if (!text) {
      if (host._cp) { host._cp.remove(); host._cp = null; }
      return;
    }

    // 建立或重用 caption 元素
    if (!host._cp) {
      const cp = document.createElement('div');
      cp.className = '_bxcp';
      host.appendChild(cp);
      host._cp = cp;
    }
    const cp     = host._cp;
    cp.textContent = text;

    const cfg    = BoxConfig.get();
    const border = a.border || 'none';
    const bw     = parseBW(border);
    const pos    = (a.captionPos   || 'top').toLowerCase();
    const align  = (a.captionAlign || 'left').toLowerCase();
    const capBg  = rc(a.captionBg)    || cfg.capBg;
    const capCol = rc(a.captionColor) || cfg.capColor;
    // 無外框時，caption 自帶 1px 邊框
    const capBdr = bw > 0 ? border : `1px solid ${capCol}`;
    const pv     = cfg.capPadV;
    const ph     = cfg.capPadH;
    const base   = toPx(a.padding, cfg.padding);

    // 共用樣式
    Object.assign(cp.style, {
      background: capBg,
      color:      capCol,
      fontSize:   cfg.capSize,
      border:     capBdr,
    });

    if (pos === 'left') {
      /* ── 左側模式 ── */
      Object.assign(cp.style, {
        writingMode:    'vertical-rl',
        transform:      'rotate(180deg)',
        top:            `${-bw}px`,
        bottom:         `${-bw}px`,
        left:           `${-bw}px`,
        right:          'auto',
        padding:        `${ph}px ${pv}px`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          'auto',
      });
      host._cpRaf = requestAnimationFrame(() => {
        host._cpRaf = null;
        if (!host._cp) return;
        const cw = host._cp.offsetWidth;
        if (cw > 0) host.style.paddingLeft = Math.max(cw - bw + cfg.capOffset, base) + 'px';
      });

    } else {
      /* ── 頂部模式 ── */
      const al = align === 'center'
        ? { left:'50%',  right:'auto',     transform:'translateX(-50%)' }
        : align === 'right'
        ? { left:'auto', right:`${ph}px`,  transform:'none' }
        : { left:`${ph}px`, right:'auto',  transform:'none' };

      Object.assign(cp.style, {
        writingMode: '',
        display:     '',
        top:         `${-bw}px`,
        bottom:      'auto',
        left:        al.left,
        right:       al.right,
        transform:   al.transform,
        padding:     `${pv}px ${ph}px`,
        width:       'auto',
      });
      host._cpRaf = requestAnimationFrame(() => {
        host._cpRaf = null;
        if (!host._cp) return;
        const ch = host._cp.offsetHeight;
        if (ch > 0) host.style.paddingTop = Math.max(ch - bw + cfg.capOffset, base) + 'px';
      });
    }
  }

  /* ════════════════════════════════════════════
     BoxBase — 共用基礎類別
  ════════════════════════════════════════════ */
  class BoxBase extends HTMLElement {
    /** 讀取所有共用屬性 */
    _a() {
      return {
        gap:          this.getAttribute('gap'),
        padding:      this.getAttribute('padding'),
        bgColor:      this.getAttribute('bg-color'),
        bgOpacity:    this.getAttribute('bg-opacity'),
        border:       this.getAttribute('border'),
        radius:       this.getAttribute('radius'),
        maxWidth:     this.getAttribute('max-width'),
        align:        this.getAttribute('align'),
        justify:      this.getAttribute('justify'),
        caption:      this.getAttribute('caption'),
        captionPos:   this.getAttribute('caption-pos'),
        captionAlign: this.getAttribute('caption-align'),
        captionBg:    this.getAttribute('caption-bg'),
        captionColor: this.getAttribute('caption-color'),
      };
    }

    /** 套用容器樣式（每次 _apply 呼叫） */
    _applyBase(cfg, a) {
      const pad    = toPx(a.padding, cfg.padding);
      const bg     = buildBg(a.bgColor, a.bgOpacity) || 'transparent';
      const border = a.border  || 'none';
      const radius = toPx(a.radius, cfg.radius);
      const mw     = a.maxWidth;
      Object.assign(this.style, {
        background:   bg,
        border,
        borderRadius: radius + 'px',
        padding:      pad + 'px',
        maxWidth:     mw ? mw + 'px' : '',
        margin:       mw ? '0 auto'  : '',
        boxSizing:    'border-box',
        display:      'block',
        position:     'relative',
      });
    }
  }

  /* ════════════════════════════════════════════
     box-single
     屬性：gap | padding | bg-color | bg-opacity | border | radius | max-width
           align | justify
           caption | caption-pos | caption-align | caption-bg | caption-color
  ════════════════════════════════════════════ */
  class BoxSingle extends BoxBase {
    static get observedAttributes() {
      return ['gap','padding','bg-color','bg-opacity','border','radius','max-width',
              'align','justify',
              'caption','caption-pos','caption-align','caption-bg','caption-color'];
    }
    connectedCallback() {
      injectStyles();
      if (!this._i) { this._setup(); this._i = true; }
      this._apply();
      this._u = BoxConfig._sub(() => this._apply());
    }
    disconnectedCallback() { this._u?.(); }
    attributeChangedCallback() { if (this._i) this._apply(); }

    _setup() {
      const body = document.createElement('div');
      body.className = '_bxsb';
      while (this.firstChild) body.appendChild(this.firstChild);
      this.appendChild(body);
      this._b = body;
    }

    _apply() {
      const cfg = BoxConfig.get();
      const a   = this._a();
      this._applyBase(cfg, a);
      if (this._b) Object.assign(this._b.style, {
        gap:            toPx(a.gap, cfg.gap) + 'px',
        alignItems:     a.align   || 'stretch',
        justifyContent: a.justify || 'flex-start',
      });
      syncCaption(this, a);
    }
  }

  /* ════════════════════════════════════════════
     box-double
     在 box-single 屬性基礎上另加：
     ratio | col-gap | break | reverse | valign
  ════════════════════════════════════════════ */
  class BoxDouble extends BoxBase {
    static get observedAttributes() {
      return ['ratio','gap','col-gap','padding','bg-color','bg-opacity','border','radius','max-width',
              'break','reverse','valign',
              'caption','caption-pos','caption-align','caption-bg','caption-color'];
    }
    connectedCallback() {
      injectStyles();
      if (!this._i) { this._setup(); this._i = true; }
      this._apply();
      this._startRO();
      this._u = BoxConfig._sub(() => this._apply());
    }
    disconnectedCallback() { this._ro?.disconnect(); this._u?.(); }
    attributeChangedCallback(name) {
      if (!this._i) return;
      if (name === 'break' || name === 'reverse') this._chk();
      this._apply();
    }

    _setup() {
      // 將所有 box-col 子元素與其他節點分類
      const cols = [...this.querySelectorAll(':scope>box-col')];
      const rest = [...this.childNodes].filter(n => !cols.includes(n));
      while (this.firstChild) this.firstChild.remove();

      const body = document.createElement('div');
      body.className = '_bxdb';
      this.appendChild(body);
      cols.forEach(c => body.appendChild(c));
      rest.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE && !n.textContent.trim()) return;
        body.appendChild(n);
      });
      this._b    = body;
      this._cols = cols;
    }

    _ratio() {
      const r = (this.getAttribute('ratio') || '1:1').split(':').map(Number);
      return (r.length === 2 && !r.some(isNaN)) ? r : [1, 1];
    }

    _startRO() {
      this._ro?.disconnect();
      this._ro = new ResizeObserver(() => this._chk());
      this._ro.observe(this);
    }

    _chk() {
      const bp = toPx(this.getAttribute('break'), BoxConfig.get('breakpoint'));
      const w  = this.offsetWidth;
      const st = w > 0 && w < bp;
      const rv = st && this.hasAttribute('reverse');
      this._st = st;
      if (this._b) {
        this._b.classList.toggle('bxst', st && !rv);
        this._b.classList.toggle('bxrv', rv);
      }
      this._fx();
    }

    _fx() {
      if (!this._cols) return;
      if (this._st) {
        this._cols.forEach(c => { c.style.flex = '1 1 100%'; });
        return;
      }
      const [r0, r1] = this._ratio();
      if (this._cols[0]) this._cols[0].style.flex = String(r0);
      if (this._cols[1]) this._cols[1].style.flex = String(r1);
    }

    _apply() {
      const cfg  = BoxConfig.get();
      const a    = this._a();
      this._applyBase(cfg, a);
      const gap  = toPx(a.gap, cfg.gap);
      const cgap = toPx(this.getAttribute('col-gap'), cfg.colGap);
      if (this._b) Object.assign(this._b.style, {
        gap:        (this._st ? gap : cgap) + 'px',
        alignItems: this.getAttribute('valign') || 'stretch',
      });
      this._fx();
      syncCaption(this, a);
    }
  }

  /* ════════════════════════════════════════════
     box-col
     屬性：gap | padding | bg-color | bg-opacity | border | radius | align
  ════════════════════════════════════════════ */
  class BoxCol extends HTMLElement {
    static get observedAttributes() {
      return ['gap','padding','bg-color','bg-opacity','border','radius','align'];
    }
    connectedCallback() {
      if (!this._i) { this._setup(); this._i = true; }
      this._apply();
      this._u = BoxConfig._sub(() => this._apply());
    }
    disconnectedCallback() { this._u?.(); }
    attributeChangedCallback() { if (this._i) this._apply(); }

    _setup() {
      const body = document.createElement('div');
      body.className = '_bxsb';
      while (this.firstChild) body.appendChild(this.firstChild);
      this.appendChild(body);
      this._b = body;
    }

    _apply() {
      const cfg    = BoxConfig.get();
      const pad    = toPx(this.getAttribute('padding'),   0);
      const bg     = buildBg(this.getAttribute('bg-color'), this.getAttribute('bg-opacity')) || 'transparent';
      const border = this.getAttribute('border') || 'none';
      const radius = toPx(this.getAttribute('radius'),    cfg.radius);
      const align  = this.getAttribute('align')  || 'stretch';
      const gap    = toPx(this.getAttribute('gap'),       cfg.gap);
      Object.assign(this.style, {
        background: bg, border, borderRadius: radius + 'px',
        padding: pad + 'px', boxSizing: 'border-box', minWidth: '0', position: 'relative',
      });
      if (this._b) Object.assign(this._b.style, { gap: gap + 'px', alignItems: align });
    }
  }

  /* ════════════════════════════════════════════
     註冊元件
  ════════════════════════════════════════════ */
  customElements.define('box-single', BoxSingle);
  customElements.define('box-double', BoxDouble);
  customElements.define('box-col',    BoxCol);

})();

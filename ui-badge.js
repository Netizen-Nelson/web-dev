/*!
 * ui-badge.js  v1.0.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Badge Web Component — 任意字符，五種外框形狀，實心或空心。
 *
 * 形狀   : circle | square | triangle | hexagon | diamond
 * 填色   : solid | outline
 *
 * Attributes
 *   char         顯示字符（支援 emoji、漢字等任意 Unicode）  default "?"
 *   shape        外框形狀                                     default "circle"
 *   fill         solid | outline                              default "outline"
 *   bg           十六進位色碼 — 填滿色或描邊色               default theme.bg
 *   color        十六進位色碼 — 文字色（省略時自動反色）
 *   size         渲染尺寸 px                                  default 36
 *   stroke       描邊粗細 px（outline 模式）                  default 2
 *   font-weight  CSS font-weight                              default 700
 *   radius       方形圓角半徑（SVG units）                    default 6
 *   on-click     點擊時呼叫的全域函式名稱
 *
 * Click 三層掛鉤（可同時並存）
 *   1. Attribute   on-click="myFn"      → window.myFn(detail)
 *   2. Property    el.onClick = fn      → fn(detail)
 *   3. CustomEvent el / doc.addEventListener('ui-badge:click', e => e.detail)
 *      detail: { char, shape, fill, bg, color, size, element }
 *
 * 全域設定
 *   UIBadge.config({
 *     defaultSize, defaultShape, defaultFill, defaultStroke,
 *     defaultFontWeight, defaultRadius,
 *     theme: { bg, color, darkText, lightText }
 *   })
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  // ── 全域預設值 ────────────────────────────────────────────────────────────
  const CFG = {
    defaultSize:       36,
    defaultShape:      'circle',
    defaultFill:       'outline',
    defaultStroke:     2,
    defaultFontWeight: 700,
    defaultRadius:     6,
    theme: {
      bg:        '#C3A5E5',   // lavender — 預設徽章色
      color:     '#C6C7BD',   // shell    — outline 模式文字色
      darkText:  '#0C0D0C',   // 淺色實心背景時的文字色
      lightText: '#C6C7BD',   // 深色實心背景時的文字色
    },
  };

  // ── 色彩工具 ──────────────────────────────────────────────────────────────
  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const lin = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  /** 根據背景亮度自動選擇深色或淺色文字。 */
  function autoTextColor(bgHex) {
    return relativeLuminance(bgHex) > 0.179
      ? CFG.theme.darkText
      : CFG.theme.lightText;
  }

  // ── SVG 建構器 ────────────────────────────────────────────────────────────
  /** 將 px 轉換為 SVG viewBox 單位（viewBox = 0 0 100 100）。 */
  function px2u(px, size) { return px * 100 / size; }

  function buildSVG({ char, shape, fill, bg, color, size, stroke, fontWeight, radius }) {
    const isOutline = fill === 'outline';

    // 描邊粗細（SVG 單位）與安全內縮量
    const sw  = isOutline ? px2u(stroke, size) : 0;
    const pad = sw / 2 + 3;   // half-stroke + 3-unit 安全邊距，防止截切

    // XML 轉義（SVG text 內容）
    const safeChar = char
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 文字色：明確指定 → 自動反色（solid）→ 主題預設（outline）
    const textColor = color ?? (isOutline ? CFG.theme.color : autoTextColor(bg));

    // 形狀填色 / 描邊
    const shFill   = isOutline ? 'none' : bg;
    const shStroke = isOutline ? bg     : 'none';
    const shAttr   = `fill="${shFill}" stroke="${shStroke}" stroke-width="${sw.toFixed(2)}"`;

    let shapeSVG = '';
    let textY    = 50;   // 文字視覺重心 Y（預設 = 幾何中心）

    switch (shape) {

      case 'circle':
        shapeSVG = `<circle cx="50" cy="50" r="${(50 - pad).toFixed(2)}" ${shAttr}/>`;
        break;

      case 'square': {
        const x  = pad;
        const w  = 100 - 2 * pad;
        const rx = Math.min(radius, w / 2);
        shapeSVG = `<rect x="${x.toFixed(2)}" y="${x.toFixed(2)}" width="${w.toFixed(2)}" height="${w.toFixed(2)}" rx="${rx.toFixed(1)}" ${shAttr}/>`;
        break;
      }

      case 'triangle': {
        // 頂點朝上的等腰三角形；文字置於重心（centroid）
        const apexY  = pad;
        const baseY  = 100 - pad;
        const leftX  = pad;
        const rightX = 100 - pad;
        shapeSVG = (
          `<polygon points="50,${apexY.toFixed(2)} ` +
          `${rightX.toFixed(2)},${baseY.toFixed(2)} ` +
          `${leftX.toFixed(2)},${baseY.toFixed(2)}" ` +
          `${shAttr} stroke-linejoin="round"/>`
        );
        // 重心 Y = (apexY + baseY + baseY) / 3
        textY = (apexY + baseY + baseY) / 3;
        break;
      }

      case 'hexagon': {
        // 頂點朝上的六角形（12 點鐘及 6 點鐘方向為頂點）
        const r   = 50 - pad;
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 - 90) * Math.PI / 180;
          return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
        }).join(' ');
        shapeSVG = `<polygon points="${pts}" ${shAttr} stroke-linejoin="round"/>`;
        break;
      }

      case 'diamond': {
        const p = pad;
        shapeSVG = (
          `<polygon points="50,${p.toFixed(2)} ` +
          `${(100 - p).toFixed(2)},50 ` +
          `50,${(100 - p).toFixed(2)} ` +
          `${p.toFixed(2)},50" ` +
          `${shAttr} stroke-linejoin="round"/>`
        );
        break;
      }

      default:
        shapeSVG = `<circle cx="50" cy="50" r="${(50 - pad).toFixed(2)}" ${shAttr}/>`;
    }

    // 字體大小（SVG 單位）：字符數越多自動縮小
    const charCount = [...char].length;
    const fontSize  = charCount === 1 ? 46
                    : charCount === 2 ? 36
                    : Math.max(Math.floor(48 / Math.sqrt(charCount)), 14);

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ` +
      `width="${size}" height="${size}" ` +
      `style="display:inline-block;vertical-align:middle;">` +
      shapeSVG +
      `<text x="50" y="${textY.toFixed(2)}" ` +
      `text-anchor="middle" dominant-baseline="central" ` +
      `font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" ` +
      `style="font-family:inherit;user-select:none;pointer-events:none;">${safeChar}</text>` +
      `</svg>`
    );
  }

  // ── Custom Element ────────────────────────────────────────────────────────
  class UIBadge extends HTMLElement {
    constructor() {
      super();
      this._onClick    = null;   // onClick property handler
      this._clickBound = null;   // 已綁定的 click listener
    }

    static get observedAttributes() {
      return [
        'char', 'shape', 'fill', 'bg', 'color',
        'size', 'stroke', 'font-weight', 'radius', 'on-click',
      ];
    }

    connectedCallback()        { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _attr(key, fallback) {
      return this.hasAttribute(key) ? this.getAttribute(key) : fallback;
    }

    _render() {
      const char       = this._attr('char',        '?');
      const shape      = this._attr('shape',        CFG.defaultShape);
      const fill       = this._attr('fill',         CFG.defaultFill);
      const size       = parseFloat(this._attr('size',        CFG.defaultSize));
      const stroke     = parseFloat(this._attr('stroke',      CFG.defaultStroke));
      const fontWeight = this._attr('font-weight',  CFG.defaultFontWeight);
      const bg         = this._attr('bg',           CFG.theme.bg);
      const radius     = parseFloat(this._attr('radius',      CFG.defaultRadius));
      const color      = this.hasAttribute('color') ? this.getAttribute('color') : null;

      this.innerHTML     = buildSVG({ char, shape, fill, bg, color, size, stroke, fontWeight, radius });
      this.style.display = 'inline-block';

      // 有 click handler 時才顯示 pointer cursor
      const hasClick = this.hasAttribute('on-click') || typeof this._onClick === 'function';
      this.style.cursor = hasClick ? 'pointer' : 'default';

      // 重新掛載 click listener
      if (this._clickBound) this.removeEventListener('click', this._clickBound);
      this._clickBound = () => {
        const detail = { char, shape, fill, bg, color, size, element: this };

        // Layer 1 — attribute (全域函式名稱)
        const fnName = this.getAttribute('on-click');
        if (fnName && typeof window[fnName] === 'function') window[fnName](detail);

        // Layer 2 — onClick property
        if (typeof this._onClick === 'function') this._onClick(detail);

        // Layer 3 — CustomEvent（bubbles，可委派監聽）
        this.dispatchEvent(new CustomEvent('ui-badge:click', { bubbles: true, detail }));
      };
      this.addEventListener('click', this._clickBound);
    }

    // onClick property 存取器
    set onClick(fn) {
      this._onClick = fn;
      this.style.cursor = typeof fn === 'function' ? 'pointer' : 'default';
    }
    get onClick() { return this._onClick; }
  }

  customElements.define('ui-badge', UIBadge);

  // ── 公開 API ──────────────────────────────────────────────────────────────
  window.UIBadge = {
    /**
     * 覆蓋全域預設值。
     * 建議在元素插入 DOM 之前呼叫；或呼叫後手動觸發重繪。
     *
     * @param {object} opts
     * @param {number}  [opts.defaultSize]
     * @param {string}  [opts.defaultShape]  'circle'|'square'|'triangle'|'hexagon'|'diamond'
     * @param {string}  [opts.defaultFill]   'solid'|'outline'
     * @param {number}  [opts.defaultStroke]
     * @param {number}  [opts.defaultFontWeight]
     * @param {number}  [opts.defaultRadius]
     * @param {object}  [opts.theme]         { bg, color, darkText, lightText }
     */
    config(opts = {}) {
      const keys = [
        'defaultSize', 'defaultShape', 'defaultFill', 'defaultStroke',
        'defaultFontWeight', 'defaultRadius',
      ];
      keys.forEach(k => { if (opts[k] !== undefined) CFG[k] = opts[k]; });
      if (opts.theme) Object.assign(CFG.theme, opts.theme);
    },
  };

})();

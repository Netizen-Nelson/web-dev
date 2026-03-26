/**
 * bp-graph.js
 * ─────────────────────────────────────────────────────────────
 * 包含兩個 Web Component（無 Shadow DOM）：
 *
 *   <bp-radar>   — SVG 雷達圖
 *   <flow-card>  — 圖示卡片流程圖（需搭配 Bootstrap Icons CDN）
 *
 * 使用方式：
 *   <script src="bp-graph.js"></script>
 *
 * Bootstrap Icons（flow-card 依賴）：
 *   <link rel="stylesheet"
 *     href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
 *
 * 全域設定優先序：元件屬性 > window.BpRadarConfig / window.FlowCardConfig > 內建預設
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ════════════════════════════════════════════
     §1  共用調色盤 & 工具
  ════════════════════════════════════════════ */

  const PALETTE = {
    shell:    '#c6c7bd',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#04b5a3',
    safe:     '#81E6D9',
    yellow:   '#D4B440',
    info:     '#90CDF4',
    stone:    '#7090A8',
    pink:     '#FFB3D9',
    orange:   '#f69653',
    region:   '#333333',
    bg:       '#0c0d0c',
  };

  /**
   * 顏色解析：調色盤名稱 → hex，否則原值回傳
   * @param {string} v       - 輸入值（調色盤鍵名或 hex）
   * @param {string} [fb=''] - 找不到時的 fallback
   */
  const resolveColor = (v, fb = '') => PALETTE[v] || v || fb;

  /** 設計基準字體大小（px） */
  const ROOT_BASE = 14;

  /**
   * 解析字體大小
   * @param {Function} cfg   - 讀取屬性的方法（this._cfg）
   * @param {string}   key   - 'title' | 'label' | ...
   * @param {Object}   ratios - key→倍率 map
   */
  const resolveFont = (cfg, key, ratios) => {
    const explicit = parseFloat(cfg('font-' + key));
    if (explicit > 0) return explicit;
    return (parseFloat(cfg('root-font')) || ROOT_BASE) * (ratios[key] || 1);
  };


  /* ════════════════════════════════════════════
     §2  共用 CSS 注入（一次）
  ════════════════════════════════════════════ */

  if (!document.getElementById('_bp-graph-styles')) {
    const s = document.createElement('style');
    s.id = '_bp-graph-styles';
    s.textContent = `
      /* ── bp-radar 動畫 ── */
      @keyframes _bp-radar-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      /* ── flow-card 佈局 ── */
      flow-card    { display: block; }
      flow-content { display: none !important; }

      .fc-row {
        display: flex;
        align-items: stretch;
        width: 100%;
      }
      .fc-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        min-width: 0;
      }
      .fc-icon {
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        position: relative;
        z-index: 2;
      }
      .fc-card {
        width: 100%;
        flex: 1;
      }
      .fc-title {
        font-weight: 700;
        margin-bottom: 10px;
      }
      .fc-body {
        color: #c6c7bd;
        line-height: 1.7;
      }
      .fc-conn-wrap {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      .fc-connector {
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: #fff;
        font-weight: 800;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
      }

      /* ── flow-card 進場動畫 ── */
      @keyframes fc-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(s);
  }


  /* ════════════════════════════════════════════
     §3  bp-radar
  ════════════════════════════════════════════ */

  /** 全域預設（可在引入 script 前設定 window.BpRadarConfig 覆蓋） */
  window.BpRadarConfig = Object.assign({
    'color-label':  'shell',   // 軸標籤顏色
    'color-web':    'stone',   // 格線 / 軸線顏色
    'color-fill':   'sky',     // 資料多邊形填色
    'min-scale':    '0',       // 最小刻度值
    'max-scale':    '10',      // 最大刻度值
    'levels':       '5',       // 格線層數（2–10）
    'show-values':  'true',    // 是否顯示數值
    'stroke-width': '2',       // 資料多邊形線寬（px）
    'web-width':    '0.75',    // 格線 / 軸線粗細（px）
    'animate':      'true',    // 淡入動畫
    /* 字體（空字串 = 依 root-font 比例自動推算）*/
    'root-font':    '14',
    'font-title':   '',
    'font-label':   '',
    'font-value':   '',
    'font-tick':    '',
  }, window.BpRadarConfig || {});

  /** bp-radar 字體比例（基準 root-font = 14） */
  const RADAR_FONT_RATIOS = {
    title: 14.5 / ROOT_BASE,  // 1.036
    label: 13.5 / ROOT_BASE,  // 0.964
    value: 11.0 / ROOT_BASE,  // 0.786
    tick:   9.5 / ROOT_BASE,  // 0.679
  };

  /* SVG 幾何工具 */
  const polar  = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const ptsToD = (pts, close = true) =>
    pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') +
    (close ? 'Z' : '');
  const fmtN = (v) => Number.isInteger(v) ? v : parseFloat(v.toFixed(1));

  class BpRadar extends HTMLElement {

    static get observedAttributes() {
      return [
        'color-label', 'color-web', 'color-fill',
        'min-scale', 'max-scale', 'levels',
        'show-values', 'stroke-width', 'web-width', 'animate', 'title',
        'root-font', 'font-title', 'font-label', 'font-value', 'font-tick',
      ];
    }

    connectedCallback()        { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    /** 個別屬性 → 全域預設 */
    _cfg(key) { return this.getAttribute(key) ?? window.BpRadarConfig[key]; }

    _render() {
      const notes = [...this.querySelectorAll('radar-note')].map((el) => ({
        label: el.textContent.trim(),
        value: parseFloat(el.getAttribute('value')) || 0,
      }));
      if (notes.length < 3) return;

      /* 設定 */
      const cLabel   = resolveColor(this._cfg('color-label'), PALETTE.shell);
      const cWeb     = resolveColor(this._cfg('color-web'),   PALETTE.stone);
      const cFill    = resolveColor(this._cfg('color-fill'),  PALETTE.sky);
      const minV     = parseFloat(this._cfg('min-scale'));
      const maxV     = parseFloat(this._cfg('max-scale'));
      const range    = maxV - minV || 1;
      const levels   = Math.max(2, Math.min(10, parseInt(this._cfg('levels')) || 5));
      const showVals = this._cfg('show-values') !== 'false';
      const sw       = Math.max(0.5, parseFloat(this._cfg('stroke-width')) || 2);
      const ww       = Math.max(0.1, parseFloat(this._cfg('web-width'))    || 0.75);
      const doAnim   = this._cfg('animate') !== 'false';
      const title    = this.getAttribute('title') || '';

      /* 字體 */
      const _cfg    = (k) => this._cfg(k);
      const fsTitle = resolveFont(_cfg, 'title', RADAR_FONT_RATIOS);
      const fsLabel = resolveFont(_cfg, 'label', RADAR_FONT_RATIOS);
      const fsValue = resolveFont(_cfg, 'value', RADAR_FONT_RATIOS);
      const fsTick  = resolveFont(_cfg, 'tick',  RADAR_FONT_RATIOS);
      const rootPx  = parseFloat(this._cfg('root-font')) || ROOT_BASE;
      const LH      = 18 * (rootPx / ROOT_BASE);

      /* SVG 幾何 */
      const n   = notes.length;
      const W   = 500;
      const TH  = title ? 46 : 0;
      const H   = W + TH;
      const cx  = W / 2;
      const cy  = W / 2 + TH;
      const R   = 155;
      const LP  = 44;
      const uid = '_r' + Math.random().toString(36).slice(2, 7);
      const ang = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;

      /* 格線 */
      let gridSVG = '';
      for (let lv = 1; lv <= levels; lv++) {
        const r    = R * lv / levels;
        const fill = lv % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'none';
        const pts  = Array.from({ length: n }, (_, i) => polar(cx, cy, r, ang(i)));
        gridSVG += `<path d="${ptsToD(pts)}" fill="${fill}" stroke="${cWeb}" stroke-width="${ww}" opacity="0.5"/>`;
      }

      /* 軸線 */
      const axesSVG = notes.map((_, i) => {
        const [x, y] = polar(cx, cy, R, ang(i));
        return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${cWeb}" stroke-width="${ww}" opacity="0.4"/>`;
      }).join('');

      /* 刻度標籤（沿第一軸偏右）*/
      const ticksSVG = Array.from({ length: levels }, (_, li) => {
        const lv  = li + 1;
        const r   = R * lv / levels;
        const val = minV + range * lv / levels;
        const [tx, ty] = polar(cx, cy, r, ang(0));
        return `<text x="${(tx + 7).toFixed(1)}" y="${ty.toFixed(1)}"
          fill="${cWeb}" font-size="${fsTick.toFixed(2)}"
          font-family="'Courier New',monospace"
          dominant-baseline="middle" opacity="0.55">${fmtN(val)}</text>`;
      }).join('');

      /* 資料多邊形 */
      const dataPts = notes.map((note, i) => {
        const ratio = Math.max(0, Math.min(1, (note.value - minV) / range));
        return polar(cx, cy, R * ratio, ang(i));
      });
      const dataD = ptsToD(dataPts);

      /* 頂點圓點 */
      const dotsSVG = dataPts.map(([x, y]) =>
        `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4.5" fill="${cFill}" stroke="#0c0d0c" stroke-width="2"/>`
      ).join('');

      /* 軸標籤 + 數值（雙行）*/
      const labelsSVG = notes.map((note, i) => {
        const a    = ang(i);
        const cosA = Math.cos(a), sinA = Math.sin(a);
        const [lx, ly] = polar(cx, cy, R + LP, a);
        const anchor   = Math.abs(cosA) < 0.18 ? 'middle' : cosA > 0 ? 'start' : 'end';

        let y1, y2;
        if      (sinA < -0.45) { y1 = ly - LH * 0.55; y2 = ly + LH * 0.55; }
        else if (sinA >  0.45) { y1 = ly + LH * 0.05; y2 = ly + LH * 1.1;  }
        else                   { y1 = ly - LH * 0.45; y2 = ly + LH * 0.65; }

        const lbl = `<text x="${lx.toFixed(2)}" y="${y1.toFixed(2)}"
          text-anchor="${anchor}" dominant-baseline="middle"
          fill="${cLabel}" font-size="${fsLabel.toFixed(2)}" font-weight="600"
          font-family="'Noto Sans TC','PingFang TC',sans-serif">${note.label}</text>`;

        const val = showVals
          ? `<text x="${lx.toFixed(2)}" y="${y2.toFixed(2)}"
              text-anchor="${anchor}" dominant-baseline="middle"
              fill="${cFill}" font-size="${fsValue.toFixed(2)}" font-weight="700"
              font-family="'Courier New',monospace">${note.value}</text>`
          : '';

        return lbl + val;
      }).join('');

      /* 標題 */
      const titleSVG = title
        ? `<text x="${cx}" y="26" text-anchor="middle"
            fill="${cLabel}" font-size="${fsTitle.toFixed(2)}" font-weight="700"
            font-family="'Noto Sans TC','PingFang TC',sans-serif"
            letter-spacing="0.1em" opacity="0.9">${title}</text>`
        : '';

      /* 動畫 */
      const animAttr = doAnim ? `style="animation:_bp-radar-in 0.55s ease both"` : '';

      /* 組合 SVG */
      const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
  style="width:100%;display:block;border-radius:14px;background:#0c0d0c;" ${animAttr}>
  <defs>
    <radialGradient id="${uid}-g" cx="50%" cy="50%" r="55%">
      <stop offset="0%"   stop-color="${cFill}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${cFill}" stop-opacity="0.04"/>
    </radialGradient>
    <filter id="${uid}-f" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>
  ${titleSVG}
  ${gridSVG}
  ${axesSVG}
  ${ticksSVG}
  <path d="${dataD}" fill="none" stroke="${cFill}" stroke-width="${sw + 5}" opacity="0.14" filter="url(#${uid}-f)"/>
  <path d="${dataD}" fill="url(#${uid}-g)" stroke="${cFill}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>
  ${dotsSVG}
  ${labelsSVG}
</svg>`;

      /* 注入 DOM */
      this.querySelectorAll('radar-note').forEach((el) => (el.style.display = 'none'));
      this.querySelector(':scope > svg')?.remove();
      this.insertAdjacentHTML('afterbegin', svg);
    }
  }


  /* ════════════════════════════════════════════
     §4  flow-card
  ════════════════════════════════════════════ */

  /** 全域預設（可在引入 script 前設定 window.FlowCardConfig 覆蓋） */
  window.FlowCardConfig = Object.assign({
    'theme':             'sky',     // 圖示圓圈預設顏色
    'connector':         'VS',      // 連結徽章文字
    'connector-icon':    '',        // 連結徽章 Bootstrap icon（優先於文字）
    'connector-color':   'salmon',  // 連結徽章背景色
    'connector-size':    '36',      // 連結徽章直徑（px）
    'connector-overlap': '0.1',     // 壓入卡片側邊比例（相對 connector-size）
    'icon-size':         '80',      // 頂部圓圈直徑（px）
    'icon-font':         '32',      // 圓圈內 icon 大小（px）
    'icon-shadow':       'true',    // 圓圈陰影
    'card-bg':           'region',  // 卡片背景色
    'card-radius':       '12',      // 卡片圓角（px）
    'card-padding':      '20',      // 卡片內距（px）
    'text-align':        'center',  // 文字對齊（center / left / right）
    'animate':           'true',    // 進場動畫
    /* 字體（空字串 = 依 root-font 比例自動推算）*/
    'root-font':         '14',
    'font-title':        '',
    'font-body':         '',
    'font-connector':    '',
  }, window.FlowCardConfig || {});

  /** flow-card 字體比例 */
  const FC_FONT_RATIOS = { title: 1.14, body: 0.93 };

  class FlowCard extends HTMLElement {

    static get observedAttributes() {
      return [
        'theme',
        'connector', 'connector-icon', 'connector-color',
        'connector-size', 'connector-overlap',
        'icon-size', 'icon-font', 'icon-shadow',
        'card-bg', 'card-radius', 'card-padding',
        'text-align', 'animate',
        'root-font', 'font-title', 'font-body', 'font-connector',
      ];
    }

    connectedCallback()        { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    /** 個別屬性 → 全域預設 */
    _cfg(key) { return this.getAttribute(key) ?? window.FlowCardConfig[key]; }

    _render() {
      const items = [...this.querySelectorAll(':scope > flow-content')];
      if (!items.length) return;
      if (items.length > 5) items.length = 5;

      /* 讀取設定 */
      const defaultTheme = resolveColor(this._cfg('theme'), PALETTE.sky);
      const defConnText  = this._cfg('connector') ?? 'VS';
      const defConnIcon  = this._cfg('connector-icon') || '';
      const connColor    = resolveColor(this._cfg('connector-color'), PALETTE.salmon);
      const connSize     = Math.max(20, parseInt(this._cfg('connector-size'))    || 36);
      const overlap      = connSize * (parseFloat(this._cfg('connector-overlap')) || 0.1);
      const iconSize     = Math.max(32, parseInt(this._cfg('icon-size'))  || 80);
      const iconFont     = Math.max(12, parseInt(this._cfg('icon-font'))  || 32);
      const iconShadow   = this._cfg('icon-shadow') !== 'false';
      const cardBg       = resolveColor(this._cfg('card-bg'), PALETTE.region);
      const cardRadius   = parseInt(this._cfg('card-radius'))  || 12;
      const cardPad      = parseInt(this._cfg('card-padding')) || 20;
      const tAlign       = this._cfg('text-align') || 'center';
      const doAnim       = this._cfg('animate') !== 'false';

      /* 字體 */
      const _cfg    = (k) => this._cfg(k);
      const fsTitle = resolveFont(_cfg, 'title', FC_FONT_RATIOS);
      const fsBody  = resolveFont(_cfg, 'body',  FC_FONT_RATIOS);
      const fsConn  = (() => {
        const v = parseFloat(this._cfg('font-connector'));
        return v > 0 ? v : connSize * 0.36;
      })();

      const iconHalf  = iconSize / 2;
      const shadowCSS = iconShadow ? 'box-shadow:0 4px 20px rgba(0,0,0,0.45);' : '';

      /* 先抽資料（innerHTML 不受 display:none 影響，但提前讀更保險）*/
      const data = items.map((el) => ({
        iconClass: el.getAttribute('icon') || 'bi-circle',
        iconColor: resolveColor(el.getAttribute('icon-color') || '', '') || defaultTheme,
        title:     el.getAttribute('title') || '',
        connText:  el.getAttribute('connector'),       // null = 用父元素預設
        connIcon:  el.getAttribute('connector-icon'),  // null = 用父元素預設
        body:      el.innerHTML,
      }));

      /* 組合 HTML */
      let html = '';
      data.forEach((d, i) => {

        /* 連結徽章（第二欄起）*/
        if (i > 0) {
          const ct    = d.connText != null ? d.connText : defConnText;
          const ci    = d.connIcon != null ? d.connIcon : defConnIcon;
          const inner = ci
            ? `<i class="${ci}" style="font-size:${fsConn.toFixed(1)}px;color:#fff;line-height:1"></i>`
            : `<span style="font-size:${fsConn.toFixed(1)}px;font-family:'Courier New',monospace;font-weight:800;letter-spacing:0">${ct}</span>`;

          html += `
<div class="fc-conn-wrap" style="padding-top:${iconHalf}px;margin-left:-${overlap.toFixed(2)}px;margin-right:-${overlap.toFixed(2)}px;position:relative;z-index:3">
  <div class="fc-connector" style="width:${connSize}px;height:${connSize}px;background:${connColor}">
    ${inner}
  </div>
</div>`;
        }

        /* 卡片欄 */
        const animStyle = doAnim
          ? `animation:fc-in 0.45s ease ${(i * 0.1).toFixed(2)}s both`
          : '';

        const titleHTML = d.title
          ? `<div class="fc-title" style="color:${d.iconColor};font-size:${fsTitle.toFixed(1)}px;text-align:${tAlign};font-family:inherit">${d.title}</div>`
          : '';

        html += `
<div class="fc-item" style="${animStyle}">
  <div class="fc-icon" style="width:${iconSize}px;height:${iconSize}px;background:${d.iconColor};margin-bottom:-${iconHalf}px;${shadowCSS}">
    <i class="${d.iconClass}" style="font-size:${iconFont}px;color:#fff;line-height:1"></i>
  </div>
  <div class="fc-card" style="background:${cardBg};border-radius:${cardRadius}px;padding:${iconHalf + cardPad}px ${cardPad}px ${cardPad}px">
    ${titleHTML}
    <div class="fc-body" style="font-size:${fsBody.toFixed(1)}px;text-align:${tAlign}">${d.body}</div>
  </div>
</div>`;
      });

      /* 更新 DOM */
      this.querySelector(':scope > .fc-row')?.remove();
      const row = document.createElement('div');
      row.className = 'fc-row';
      row.innerHTML = html;
      this.prepend(row);
    }
  }


  /* ════════════════════════════════════════════
     §5  Custom Elements 註冊
  ════════════════════════════════════════════ */

  customElements.define('bp-radar', BpRadar);
  customElements.define('flow-card', FlowCard);

  /* 子元素佔位（定義後才不會被瀏覽器當 unknown element 處理）*/
  if (!customElements.get('radar-note'))
    customElements.define('radar-note', class extends HTMLElement {});
  if (!customElements.get('flow-content'))
    customElements.define('flow-content', class extends HTMLElement {});

})();

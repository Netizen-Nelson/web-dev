/**
 * bp-graph.js
 * ──────────────────────────────────────────────────────────────
 * 包含三個元件（無 Shadow DOM）：
 *
 *   <bp-radar>   — SVG 雷達圖
 *   <flow-card>  — 圖示卡片流程圖（需 Bootstrap Icons CDN）
 *   StepTutor    — 逐步揭示教學元件
 *
 * ⚠️  請置於 </body> 前引入，確保 DOM 子元素已解析：
 *       <script src="bp-graph.js"></script>
 *       </body>
 *
 * Bootstrap Icons（flow-card 依賴）：
 *   <link rel="stylesheet"
 *     href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
 *
 * 全域設定優先序：元件屬性 > window.BpRadarConfig / window.FlowCardConfig > 內建預設
 * ──────────────────────────────────────────────────────────────
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

  const GRADIENTS = {
    'special-sky':    'linear-gradient(90deg, #C8DD5A 0%, #04b5a3 100%)',
    'lavender-pink':  'linear-gradient(90deg, #C3A5E5 0%, #FFB3D9 100%)',
    'warning-orange': 'linear-gradient(90deg, #F08080 0%, #f69653 100%)',
    'safe-sky':       'linear-gradient(90deg, #81E6D9 0%, #04b5a3 100%)',
    'yellow-special': 'linear-gradient(90deg, #D4B440 0%, #C8DD5A 100%)',
  };

  /** 顏色解析：調色盤名稱 → hex，否則原值回傳 */
  const resolveColor    = (v, fb = '') => PALETTE[v] || v || fb;

  /** 漸層解析：預設名稱 → CSS gradient，否則原值回傳 */
  const resolveGradient = (v) => GRADIENTS[v] || v || null;

  /** 設計基準字體大小（px） */
  const ROOT_BASE = 14;

  /** 解析字體大小（bp-radar / flow-card 用） */
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
      .fc-card  { width: 100%; flex: 1; }
      .fc-title { font-weight: 700; margin-bottom: 10px; }
      .fc-body  { color: #c6c7bd; line-height: 1.7; }

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

  window.BpRadarConfig = Object.assign({
    'color-label':  'shell',
    'color-web':    'stone',
    'color-fill':   'sky',
    'min-scale':    '0',
    'max-scale':    '10',
    'levels':       '5',
    'show-values':  'true',
    'stroke-width': '2',
    'web-width':    '0.75',
    'animate':      'true',
    'root-font':    '14',
    'font-title':   '',
    'font-label':   '',
    'font-value':   '',
    'font-tick':    '',
  }, window.BpRadarConfig || {});

  const RADAR_FONT_RATIOS = {
    title: 14.5 / ROOT_BASE,
    label: 13.5 / ROOT_BASE,
    value: 11.0 / ROOT_BASE,
    tick:   9.5 / ROOT_BASE,
  };

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
    _cfg(key) { return this.getAttribute(key) ?? window.BpRadarConfig[key]; }

    _render() {
      const notes = [...this.querySelectorAll('radar-note')].map((el) => ({
        label: el.textContent.trim(),
        value: parseFloat(el.getAttribute('value')) || 0,
      }));
      if (notes.length < 3) return;

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
      const _c       = (k) => this._cfg(k);
      const fsTitle  = resolveFont(_c, 'title', RADAR_FONT_RATIOS);
      const fsLabel  = resolveFont(_c, 'label', RADAR_FONT_RATIOS);
      const fsValue  = resolveFont(_c, 'value', RADAR_FONT_RATIOS);
      const fsTick   = resolveFont(_c, 'tick',  RADAR_FONT_RATIOS);
      const rootPx   = parseFloat(this._cfg('root-font')) || ROOT_BASE;
      const LH       = 18 * (rootPx / ROOT_BASE);

      const n = notes.length, W = 500, TH = title ? 46 : 0, H = W + TH;
      const cx = W / 2, cy = W / 2 + TH, R = 155, LP = 44;
      const uid = '_r' + Math.random().toString(36).slice(2, 7);
      const ang = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;

      let gridSVG = '';
      for (let lv = 1; lv <= levels; lv++) {
        const r = R * lv / levels;
        const f = lv % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'none';
        gridSVG += `<path d="${ptsToD(Array.from({length:n},(_,i)=>polar(cx,cy,r,ang(i))))}" fill="${f}" stroke="${cWeb}" stroke-width="${ww}" opacity="0.5"/>`;
      }
      const axesSVG = notes.map((_,i)=>{const[x,y]=polar(cx,cy,R,ang(i));return`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${cWeb}" stroke-width="${ww}" opacity="0.4"/>`;}).join('');
      const ticksSVG = Array.from({length:levels},(_,li)=>{
        const lv=li+1,r=R*lv/levels,val=minV+range*lv/levels,[tx,ty]=polar(cx,cy,r,ang(0));
        return `<text x="${(tx+7).toFixed(1)}" y="${ty.toFixed(1)}" fill="${cWeb}" font-size="${fsTick.toFixed(2)}" font-family="'Courier New',monospace" dominant-baseline="middle" opacity="0.55">${fmtN(val)}</text>`;
      }).join('');
      const dataPts = notes.map((note,i)=>{const ratio=Math.max(0,Math.min(1,(note.value-minV)/range));return polar(cx,cy,R*ratio,ang(i));});
      const dataD   = ptsToD(dataPts);
      const dotsSVG = dataPts.map(([x,y])=>`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4.5" fill="${cFill}" stroke="#0c0d0c" stroke-width="2"/>`).join('');
      const labelsSVG = notes.map((note,i)=>{
        const a=ang(i),cosA=Math.cos(a),sinA=Math.sin(a),[lx,ly]=polar(cx,cy,R+LP,a);
        const anchor=Math.abs(cosA)<0.18?'middle':cosA>0?'start':'end';
        let y1,y2;
        if(sinA<-0.45){y1=ly-LH*0.55;y2=ly+LH*0.55;}
        else if(sinA>0.45){y1=ly+LH*0.05;y2=ly+LH*1.1;}
        else{y1=ly-LH*0.45;y2=ly+LH*0.65;}
        const lbl=`<text x="${lx.toFixed(2)}" y="${y1.toFixed(2)}" text-anchor="${anchor}" dominant-baseline="middle" fill="${cLabel}" font-size="${fsLabel.toFixed(2)}" font-weight="600" font-family="'Noto Sans TC','PingFang TC',sans-serif">${note.label}</text>`;
        const val=showVals?`<text x="${lx.toFixed(2)}" y="${y2.toFixed(2)}" text-anchor="${anchor}" dominant-baseline="middle" fill="${cFill}" font-size="${fsValue.toFixed(2)}" font-weight="700" font-family="'Courier New',monospace">${note.value}</text>`:'';
        return lbl+val;
      }).join('');
      const titleSVG = title?`<text x="${cx}" y="26" text-anchor="middle" fill="${cLabel}" font-size="${fsTitle.toFixed(2)}" font-weight="700" font-family="'Noto Sans TC','PingFang TC',sans-serif" letter-spacing="0.1em" opacity="0.9">${title}</text>`:'';

      const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;border-radius:14px;background:#0c0d0c;" ${doAnim?`style="animation:_bp-radar-in 0.55s ease both"`:''}>
  <defs>
    <radialGradient id="${uid}-g" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="${cFill}" stop-opacity="0.5"/><stop offset="100%" stop-color="${cFill}" stop-opacity="0.04"/></radialGradient>
    <filter id="${uid}-f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  ${titleSVG}${gridSVG}${axesSVG}${ticksSVG}
  <path d="${dataD}" fill="none" stroke="${cFill}" stroke-width="${sw+5}" opacity="0.14" filter="url(#${uid}-f)"/>
  <path d="${dataD}" fill="url(#${uid}-g)" stroke="${cFill}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>
  ${dotsSVG}${labelsSVG}
</svg>`;

      this.querySelectorAll('radar-note').forEach((el)=>(el.style.display='none'));
      this.querySelector(':scope > svg')?.remove();
      this.insertAdjacentHTML('afterbegin', svg);
    }
  }


  /* ════════════════════════════════════════════
     §4  flow-card
  ════════════════════════════════════════════ */

  window.FlowCardConfig = Object.assign({
    'theme':             'sky',
    'connector':         'VS',
    'connector-icon':    '',
    'connector-color':   'salmon',
    'connector-size':    '36',
    'connector-overlap': '0.1',
    'icon-size':         '80',
    'icon-font':         '32',
    'icon-shadow':       'true',
    'card-bg':           'region',
    'card-radius':       '12',
    'card-padding':      '20',
    'text-align':        'center',
    'animate':           'true',
    'root-font':         '14',
    'font-title':        '',
    'font-body':         '',
    'font-connector':    '',
  }, window.FlowCardConfig || {});

  const FC_FONT_RATIOS = { title: 1.14, body: 0.93 };

  class FlowCard extends HTMLElement {
    static get observedAttributes() {
      return [
        'theme', 'connector', 'connector-icon', 'connector-color',
        'connector-size', 'connector-overlap',
        'icon-size', 'icon-font', 'icon-shadow',
        'card-bg', 'card-radius', 'card-padding',
        'text-align', 'animate',
        'root-font', 'font-title', 'font-body', 'font-connector',
      ];
    }
    connectedCallback()        { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }
    _cfg(key) { return this.getAttribute(key) ?? window.FlowCardConfig[key]; }

    _render() {
      const items = [...this.querySelectorAll(':scope > flow-content')];
      if (!items.length) return;
      if (items.length > 5) items.length = 5;

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
      const _c           = (k) => this._cfg(k);
      const fsTitle      = resolveFont(_c, 'title', FC_FONT_RATIOS);
      const fsBody       = resolveFont(_c, 'body',  FC_FONT_RATIOS);
      const fsConn       = (() => { const v = parseFloat(this._cfg('font-connector')); return v > 0 ? v : connSize * 0.36; })();
      const iconHalf     = iconSize / 2;
      const shadowCSS    = iconShadow ? 'box-shadow:0 4px 20px rgba(0,0,0,0.45);' : '';

      const data = items.map((el) => ({
        iconClass: el.getAttribute('icon') || 'bi-circle',
        iconColor: resolveColor(el.getAttribute('icon-color') || '', '') || defaultTheme,
        title:     el.getAttribute('title') || '',
        connText:  el.getAttribute('connector'),
        connIcon:  el.getAttribute('connector-icon'),
        body:      el.innerHTML,
      }));

      let html = '';
      data.forEach((d, i) => {
        if (i > 0) {
          const ct = d.connText != null ? d.connText : defConnText;
          const ci = d.connIcon != null ? d.connIcon : defConnIcon;
          const inner = ci
            ? `<i class="${ci}" style="font-size:${fsConn.toFixed(1)}px;color:#fff;line-height:1"></i>`
            : `<span style="font-size:${fsConn.toFixed(1)}px;font-family:'Courier New',monospace;font-weight:800;letter-spacing:0">${ct}</span>`;
          html += `\n<div class="fc-conn-wrap" style="padding-top:${iconHalf}px;margin-left:-${overlap.toFixed(2)}px;margin-right:-${overlap.toFixed(2)}px;position:relative;z-index:3"><div class="fc-connector" style="width:${connSize}px;height:${connSize}px;background:${connColor}">${inner}</div></div>`;
        }
        const titleHTML = d.title ? `<div class="fc-title" style="color:${d.iconColor};font-size:${fsTitle.toFixed(1)}px;text-align:${tAlign};font-family:inherit">${d.title}</div>` : '';
        html += `\n<div class="fc-item" style="${doAnim?`animation:fc-in 0.45s ease ${(i*0.1).toFixed(2)}s both`:''}">
  <div class="fc-icon" style="width:${iconSize}px;height:${iconSize}px;background:${d.iconColor};margin-bottom:-${iconHalf}px;${shadowCSS}"><i class="${d.iconClass}" style="font-size:${iconFont}px;color:#fff;line-height:1"></i></div>
  <div class="fc-card" style="background:${cardBg};border-radius:${cardRadius}px;padding:${iconHalf+cardPad}px ${cardPad}px ${cardPad}px">${titleHTML}<div class="fc-body" style="font-size:${fsBody.toFixed(1)}px;text-align:${tAlign}">${d.body}</div></div>
</div>`;
      });

      this.querySelector(':scope > .fc-row')?.remove();
      const row = document.createElement('div');
      row.className = 'fc-row';
      row.innerHTML = html;
      this.prepend(row);
    }
  }


  /* ════════════════════════════════════════════
     §5  StepTutor
  ════════════════════════════════════════════ */

  class StepTutor {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`StepTutor: 找不到容器 "${containerId}"`);
        return;
      }

      const rc = (v) => resolveColor(v);
      const rg = (v) => resolveGradient(v);

      this.options = {
        /* ── 步驟卡片 ────────────────────────── */
        stepBgColor:         rc(options.stepBgColor)       || 'rgba(195,165,229,0.1)',
        stepBorderColor:     rc(options.stepBorderColor)   || PALETTE.lavender,
        stepTextColor:       rc(options.stepTextColor)     || PALETTE.shell,
        stepPadding:         options.stepPadding           || '12px',
        stepMargin:          options.stepMargin            || '8px 0px',
        stepGap:             options.stepGap               || '0px',

        /* ── 指示器 ──────────────────────────── */
        indicatorBgColor:      rc(options.indicatorBgColor)   || null,
        indicatorTextColor:    rc(options.indicatorTextColor)  || PALETTE.bg,
        indicatorPadding:      options.indicatorPadding        || null,
        indicatorFontSize:     options.indicatorFontSize       || '0.8rem',
        indicatorBorderRadius: options.indicatorBorderRadius   || '4px',
        indicatorMarginBottom: options.indicatorMarginBottom   || '8px',
        showIndicator:         options.showIndicator !== false,
        indicatorFormat:       options.indicatorFormat         || '步驟 {current}',
        showTotalSteps:        options.showTotalSteps !== false,

        /* ── 邊框 ────────────────────────────── */
        borderWidth:    options.borderWidth    || '2px',
        borderStyle:    options.borderStyle    || 'solid',
        borderPosition: options.borderPosition || 'left',
        borderSize:     options.borderSize     || '2px',

        /* ── Highlight ───────────────────────── */
        highlightColor:       rc(options.highlightColor)  || PALETTE.lavender,
        highlightBorderWidth: options.highlightBorderWidth || '4px',
        highlightOpacity:     options.highlightOpacity != null ? options.highlightOpacity : 12,

        /* ── 動畫 ────────────────────────────── */
        animationDuration: options.animationDuration || '0.3s',
        animationEasing:   options.animationEasing   || 'ease',

        /* ── 主按鈕 ──────────────────────────── */
        buttonText:         options.buttonText         || '顯示下一步',
        buttonCompleteText: options.buttonCompleteText || '所有步驟已顯示',
        buttonTheme:        options.buttonTheme        || 'special',
        buttonSize:         options.buttonSize         || 'large',
        buttonTextColor:    rc(options.buttonTextColor) || PALETTE.bg,
        buttonBorderRadius: options.buttonBorderRadius  || '4px',

        /* ── 顯示全部按鈕 ★ ─────────────────── */
        showRevealAllButton:    options.showRevealAllButton === true,
        revealAllButtonText:    options.revealAllButtonText    || '顯示全部',
        revealAllButtonTheme:   options.revealAllButtonTheme   || 'stone',
        revealAllButtonSize:    options.revealAllButtonSize    || 'small',
        revealAllButtonFontSize:options.revealAllButtonFontSize || '',

        /* ── 自動播放 ★ ──────────────────────── */
        autoPlay:             options.autoPlay === true,
        autoPlayDelay:        options.autoPlayDelay  || 2000,
        showAutoPlayButton:   options.showAutoPlayButton === true,
        autoPlayButtonText:   options.autoPlayButtonText  || '▶ 自動播放',
        autoPlayPauseText:    options.autoPlayPauseText   || '⏸ 暫停',
        autoPlayButtonTheme:  options.autoPlayButtonTheme || 'stone',
        autoPlayButtonSize:   options.autoPlayButtonSize  || 'small',
        autoPlayButtonFontSize:options.autoPlayButtonFontSize || '',

        /* ── 重新開始按鈕 ────────────────────── */
        restart:                 options.restart !== false,
        restartButtonPadding:    options.restartButtonPadding    || '6px 10px',
        restartButtonFontSize:   options.restartButtonFontSize   || '1.125rem',
        restartButtonFontWeight: options.restartButtonFontWeight || 'bold',
        restartButtonTitle:      options.restartButtonTitle      || '重新開始',

        /* ── 進度文字 ────────────────────────── */
        showProgress:    options.showProgress !== false,
        progressText:    options.progressText     || '已顯示步驟 {current} / {total}',
        progressFontSize:options.progressFontSize || '0.875rem',
        progressPosition:options.progressPosition || 'bottom',

        /* ── 進度條 ──────────────────────────── */
        showProgressBar:           options.showProgressBar === true,
        progressBarHeight:         options.progressBarHeight          || '20px',
        progressBarBgColor:        rc(options.progressBarBgColor)     || '#242426',
        progressBarGradient:       rg(options.progressBarGradient)    || GRADIENTS['special-sky'],
        progressBarBorderWidth:    options.progressBarBorderWidth     || '2px',
        progressBarBorderColor:    rc(options.progressBarBorderColor) || PALETTE.shell,
        progressBarBorderRadius:   options.progressBarBorderRadius    || '4px',
        progressBarPadding:        options.progressBarPadding         || '6px 8px',
        progressBarTextFontSize:   options.progressBarTextFontSize    || '0.75rem',
        progressBarTextFontWeight: options.progressBarTextFontWeight  || 'bold',
        progressBarTextColor:      rc(options.progressBarTextColor)   || null,
        progressBarTextFormat:     options.progressBarTextFormat      || '{percent}%',

        /* ── 滾動 ────────────────────────────── */
        autoScroll:  options.autoScroll !== false,   /* ★ 修正 Bug：原為 !== true */
        scrollOffset:options.scrollOffset || 100,

        /* ── 版面 ────────────────────────────── */
        contentPosition: options.contentPosition || 'top',

        /* ── Target ──────────────────────────── */
        targetMode:         options.targetMode          || 'replace',
        targetClearOnReset: options.targetClearOnReset !== false,

        /* ── 回調 ────────────────────────────── */
        onStepRevealed: options.onStepRevealed || null,
        onAllRevealed:  options.onAllRevealed  || null,
        onReset:        options.onReset        || null,
      };

      /* indicatorBgColor 未設定時跟隨主題色 */
      if (!this.options.indicatorBgColor) {
        this.options.indicatorBgColor = PALETTE[this.options.buttonTheme] || PALETTE.special;
      }

      this.currentStep     = 0;
      this.totalSteps      = 0;
      this.steps           = [];
      this.button          = null;
      this.revealAllBtn    = null;
      this.autoPlayBtn     = null;
      this.restartButton   = null;
      this.progressDisplay = null;
      this.progressBar     = null;
      this.progressBarFill = null;
      this.targetElements  = new Map();
      this.topSlot         = null;
      this.bottomSlot      = null;
      this._autoPlayTimer  = null;
      this._autoPlaying    = false;

      this.init();
    }

    /* ──────────────────────────────────────────
       Init
    ────────────────────────────────────────── */

    init() {
      this.loadSlots();
      this.loadSteps();
      this.createStyles();
      this.createControls();
      if (this.options.autoPlay) this.startAutoPlay();
    }

    /* ──────────────────────────────────────────
       Slots
    ────────────────────────────────────────── */

    loadSlots() {
      const pick = (slot) => {
        const el = this.container.querySelector(`[data-slot="${slot}"]`);
        if (!el) return null;
        const clone = el.cloneNode(true);
        clone.removeAttribute('data-slot');
        el.style.display = 'none';
        return clone;
      };
      this.topSlot    = pick('progress-top');
      this.bottomSlot = pick('progress-bottom');
    }

    /* ──────────────────────────────────────────
       Steps
    ────────────────────────────────────────── */

    loadSteps() {
      const els = this.container.querySelectorAll('[data-step]');
      this.totalSteps = els.length;
      els.forEach((el, index) => {
        const targetId = el.getAttribute('data-step-target') || null;
        const step = {
          index,
          number:        parseInt(el.getAttribute('data-step')) || index + 1,
          content:       el.innerHTML,
          indicator:     el.getAttribute('data-step-indicator') || null,
          highlight:     el.getAttribute('data-step-highlight') || null,
          target:        targetId,
          targetElement: targetId ? document.getElementById(targetId) : null,
        };
        this.steps.push(step);
        el.style.display = 'none';
        if (step.targetElement) this.targetElements.set(index, step.targetElement);
      });
    }

    /* ──────────────────────────────────────────
       Controls
    ────────────────────────────────────────── */

    createControls() {
      const cc   = document.createElement('div');
      cc.className = 'step-tutor-controls';
      this.createStepContainer();
      this.createButton();

      const progressTop = this.options.progressPosition === 'top';

      const appendProgress = (parent, barFirst) => {
        if (this.topSlot)    parent.appendChild(this.topSlot.cloneNode(true));
        const addBar  = () => { if (this.options.showProgressBar) { this.createProgressBar();    parent.appendChild(this.progressBar); } };
        const addText = () => { if (this.options.showProgress)    { this.createProgressDisplay(); parent.appendChild(this.progressDisplay); } };
        barFirst ? (addBar(), addText()) : (addText(), addBar());
        if (this.bottomSlot) parent.appendChild(this.bottomSlot.cloneNode(true));
      };

      if (this.options.contentPosition === 'bottom') {
        if (progressTop) { appendProgress(cc, true);  cc.appendChild(this.buttonWrapper); }
        else             { cc.appendChild(this.buttonWrapper); appendProgress(cc, false); }
        this.container.appendChild(cc);
        this.container.appendChild(this.stepContainer);
      } else {
        this.container.appendChild(this.stepContainer);
        if (progressTop) { appendProgress(cc, true);  cc.appendChild(this.buttonWrapper); }
        else             { cc.appendChild(this.buttonWrapper); appendProgress(cc, false); }
        this.container.appendChild(cc);
      }

      if (this.options.showProgress)    this.updateProgressDisplay();
      if (this.options.showProgressBar) this.updateProgressBar();
    }

    createStepContainer() {
      this.stepContainer = document.createElement('div');
      this.stepContainer.className = 'step-tutor-container';

      this.steps.forEach((step, index) => {
        if (step.target) return;
        const el = document.createElement('div');
        el.className = 'step-tutor-item';
        el.setAttribute('data-step-index', index);

        if (this.options.showIndicator) {
          const ind = document.createElement('div');
          ind.className = 'step-tutor-indicator';
          let txt = this.options.indicatorFormat.replace('{current}', step.number);
          if (step.indicator) txt = step.indicator;
          if (this.options.showTotalSteps) txt += ` / ${this.totalSteps}`;
          ind.textContent = txt;
          el.appendChild(ind);
        }

        const cd = document.createElement('div');
        cd.className = 'step-tutor-content';
        cd.innerHTML = step.content;
        if (step.highlight) {
          cd.classList.add('highlighted');
          if (step.highlight !== 'true') cd.style.setProperty('--highlight-color', step.highlight);
        }
        el.appendChild(cd);
        this.stepContainer.appendChild(el);
      });
    }

    /* ──────────────────────────────────────────
       Styles
    ────────────────────────────────────────── */

    createStyles() {
      const id      = this.container.id;
      const styleId = 'step-tutor-styles-' + id;
      /* ★ 修正：先移除舊樣式再重建，確保動態更新可用 */
      document.getElementById(styleId)?.remove();

      const hlColor = resolveColor(this.options.highlightColor, PALETTE.lavender);
      const hlAlpha = Math.round(Math.max(0, Math.min(100, this.options.highlightOpacity)) / 100 * 255)
        .toString(16).padStart(2, '0');

      const style = document.createElement('style');
      style.id    = styleId;
      style.textContent = `
        #${id} .step-tutor-container {
          display: flex;
          flex-direction: column;
          gap: ${this.options.stepGap};
        }
        #${id} .step-tutor-item {
          background: ${this.options.stepBgColor};
          ${this._getBorderCSS()}
          padding: ${this.options.stepPadding};
          margin: ${this.options.stepMargin};
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transition: opacity ${this.options.animationDuration} ${this.options.animationEasing},
                      max-height ${this.options.animationDuration} ${this.options.animationEasing};
        }
        #${id} .step-tutor-item.revealed { opacity: 1; max-height: 1600px; }
        #${id} .step-tutor-indicator {
          background: ${this.options.indicatorBgColor};
          color: ${this.options.indicatorTextColor};
          ${this.options.indicatorPadding ? `padding: ${this.options.indicatorPadding};` : ''}
          display: inline-block;
          margin-bottom: ${this.options.indicatorMarginBottom};
          font-size: ${this.options.indicatorFontSize};
          border-radius: ${this.options.indicatorBorderRadius};
        }
        #${id} .step-tutor-content {
          color: ${this.options.stepTextColor};
          line-height: 1.5;
        }
        #${id} .step-tutor-content.highlighted {
          background: ${hlColor}${hlAlpha};
          border-left: ${this.options.highlightBorderWidth} solid var(--highlight-color, ${hlColor});
          padding: 6px 10px;
          margin: 4px 0;
        }
        #${id} .step-tutor-controls {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: ${this.options.contentPosition === 'bottom' ? '0' : '12px'};
          margin-bottom: ${this.options.contentPosition === 'bottom' ? '12px' : '0'};
        }
        #${id} .step-tutor-button { ${this._makeButtonCSS(this.options.buttonTheme, this.options.buttonSize, '')} }
        #${id} .step-tutor-button:hover:not(:disabled) { opacity: 0.8; }
        #${id} .step-tutor-button:disabled { opacity: 0.5; cursor: not-allowed; }

        #${id} .step-tutor-revealall-button { ${this._makeButtonCSS(this.options.revealAllButtonTheme, this.options.revealAllButtonSize, this.options.revealAllButtonFontSize)} }
        #${id} .step-tutor-revealall-button:hover:not(:disabled) { opacity: 0.8; }
        #${id} .step-tutor-revealall-button:disabled { opacity: 0.5; cursor: not-allowed; }

        #${id} .step-tutor-autoplay-button { ${this._makeButtonCSS(this.options.autoPlayButtonTheme, this.options.autoPlayButtonSize, this.options.autoPlayButtonFontSize)} }
        #${id} .step-tutor-autoplay-button:hover:not(:disabled) { opacity: 0.8; }
        #${id} .step-tutor-autoplay-button:disabled { opacity: 0.5; cursor: not-allowed; }

        #${id} .step-tutor-restart-button {
          background: ${PALETTE[this.options.buttonTheme] || PALETTE.special};
          color: ${this.options.buttonTextColor};
          border: none;
          border-radius: ${this.options.buttonBorderRadius};
          padding: ${this.options.restartButtonPadding};
          font-size: ${this.options.restartButtonFontSize};
          font-weight: ${this.options.restartButtonFontWeight};
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          line-height: 1;
        }
        #${id} .step-tutor-restart-button:hover  { opacity: 0.8; transform: scale(1.05); }
        #${id} .step-tutor-restart-button:active { transform: scale(0.95); }

        #${id} .step-tutor-progress {
          color: ${this.options.stepTextColor};
          font-size: ${this.options.progressFontSize};
          text-align: center;
        }
        #${id} .step-tutor-progress-bar {
          background: ${this.options.progressBarBgColor};
          border: ${this.options.progressBarBorderWidth} solid ${this.options.progressBarBorderColor};
          ${this.options.progressBarHeight === 'auto' ? 'min-height: 24px;' : `height: ${this.options.progressBarHeight};`}
          padding: ${this.options.progressBarHeight === 'auto' ? this.options.progressBarPadding : '0'};
          border-radius: ${this.options.progressBarBorderRadius};
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
        }
        #${id} .step-tutor-progress-bar-fill {
          background: ${this.options.progressBarGradient};
          ${this.options.progressBarHeight === 'auto' ? 'position:absolute;top:0;left:0;bottom:0;' : 'height:100%;'}
          width: 0%;
          transition: width 0.3s ease;
        }
        #${id} .step-tutor-progress-bar-text {
          ${this.options.progressBarHeight === 'auto' ? 'position:relative;' : 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);'}
          color: ${this.options.progressBarTextColor || this.options.stepTextColor};
          font-size: ${this.options.progressBarTextFontSize};
          font-weight: ${this.options.progressBarTextFontWeight};
          pointer-events: none;
          z-index: 1;
          ${this.options.progressBarHeight === 'auto' ? 'width:100%;text-align:center;' : ''}
        }
        .step-tutor-target-content {
          animation: stepTutorFadeIn ${this.options.animationDuration} ${this.options.animationEasing};
        }
        @keyframes stepTutorFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    /* ──────────────────────────────────────────
       Helpers
    ────────────────────────────────────────── */

    _getBorderCSS() {
      const { borderPosition: pos, borderSize: w, borderStyle: s, stepBorderColor: c } = this.options;
      return pos === 'all' ? `border: ${w} ${s} ${c};` : `border-${pos}: ${w} ${s} ${c};`;
    }

    /** 產生按鈕 CSS 字串（主按鈕 / revealAll / autoPlay 共用） */
    _makeButtonCSS(theme, size, fontSizeOverride) {
      const bg = PALETTE[theme] || resolveColor(theme, PALETTE.special);
      const sizes = {
        small:  { padding: '6px 12px',  fontSize: '0.875rem' },
        medium: { padding: '8px 16px',  fontSize: '1rem' },
        large:  { padding: '12px 24px', fontSize: '1.125rem' },
      };
      const s = sizes[size] || sizes.small;
      return `
        background: ${bg};
        color: ${this.options.buttonTextColor};
        border: none;
        border-radius: ${this.options.buttonBorderRadius};
        padding: ${s.padding};
        font-size: ${fontSizeOverride || s.fontSize};
        font-weight: bold;
        cursor: pointer;
        transition: opacity 0.2s, transform 0.2s;
        line-height: 1.2;
      `;
    }

    /** 格式化進度條文字，支援 {percent} {current} {total} */
    _formatProgressBarText(percent, current, total) {
      return this.options.progressBarTextFormat
        .replace('{percent}', percent)
        .replace('{current}', current)
        .replace('{total}', total);
    }

    /** 同步所有按鈕的啟用 / 停用狀態 */
    _syncButtonState() {
      const done = this.currentStep >= this.totalSteps;
      this.button.textContent = done ? this.options.buttonCompleteText : this.options.buttonText;
      this.button.disabled    = done;
      if (this.revealAllBtn) this.revealAllBtn.disabled = done;
      if (this.autoPlayBtn)  this.autoPlayBtn.disabled  = done;
      if (this.options.restart && this.restartButton) {
        this.restartButton.style.display = done ? 'inline-block' : 'none';
      }
    }

    /* ──────────────────────────────────────────
       Button creation
    ────────────────────────────────────────── */

    createButton() {
      this.buttonWrapper = document.createElement('div');
      this.buttonWrapper.className = 'step-tutor-button-wrapper';
      this.buttonWrapper.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';

      /* 下一步 */
      this.button = document.createElement('button');
      this.button.className = 'step-tutor-button';
      this.button.textContent = this.options.buttonText;
      this.button.addEventListener('click', () => this.revealNext());
      this.buttonWrapper.appendChild(this.button);

      /* 顯示全部 ★ */
      if (this.options.showRevealAllButton) {
        this.revealAllBtn = document.createElement('button');
        this.revealAllBtn.className = 'step-tutor-revealall-button';
        this.revealAllBtn.textContent = this.options.revealAllButtonText;
        this.revealAllBtn.addEventListener('click', () => { this.stopAutoPlay(); this.revealAll(); });
        this.buttonWrapper.appendChild(this.revealAllBtn);
      }

      /* 自動播放 ★ */
      if (this.options.showAutoPlayButton) {
        this.autoPlayBtn = document.createElement('button');
        this.autoPlayBtn.className = 'step-tutor-autoplay-button';
        this.autoPlayBtn.textContent = this.options.autoPlayButtonText;
        this.autoPlayBtn.addEventListener('click', () => this.toggleAutoPlay());
        this.buttonWrapper.appendChild(this.autoPlayBtn);
      }

      /* 重新開始 */
      if (this.options.restart) {
        this.restartButton = document.createElement('button');
        this.restartButton.className = 'step-tutor-restart-button';
        this.restartButton.innerHTML = '↻';
        this.restartButton.style.display = 'none';
        this.restartButton.title = this.options.restartButtonTitle;
        this.restartButton.addEventListener('click', () => this.reset());
        this.buttonWrapper.appendChild(this.restartButton);
      }
    }

    createProgressDisplay() {
      this.progressDisplay = document.createElement('div');
      this.progressDisplay.className = 'step-tutor-progress';
    }

    createProgressBar() {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'step-tutor-progress-bar';
      this.progressBarFill = document.createElement('div');
      this.progressBarFill.className = 'step-tutor-progress-bar-fill';
      const txt = document.createElement('div');
      txt.className = 'step-tutor-progress-bar-text';
      txt.textContent = this._formatProgressBarText(0, 0, this.totalSteps);
      this.progressBar.appendChild(this.progressBarFill);
      this.progressBar.appendChild(txt);
    }

    /* ──────────────────────────────────────────
       Updates
    ────────────────────────────────────────── */

    updateProgressDisplay() {
      if (!this.progressDisplay) return;
      this.progressDisplay.textContent = this.options.progressText
        .replace('{current}', this.currentStep)
        .replace('{total}', this.totalSteps);
    }

    updateProgressBar() {
      if (!this.progressBar || !this.progressBarFill) return;
      const pct = this.totalSteps > 0 ? Math.round((this.currentStep / this.totalSteps) * 100) : 0;
      this.progressBarFill.style.width = pct + '%';
      const el = this.progressBar.querySelector('.step-tutor-progress-bar-text');
      if (el) el.textContent = this._formatProgressBarText(pct, this.currentStep, this.totalSteps);
    }

    /* ──────────────────────────────────────────
       Auto-play ★
    ────────────────────────────────────────── */

    startAutoPlay() {
      if (this._autoPlaying || this.currentStep >= this.totalSteps) return;
      this._autoPlaying = true;
      if (this.autoPlayBtn) this.autoPlayBtn.textContent = this.options.autoPlayPauseText;
      this._autoPlayTimer = setInterval(() => {
        if (this.currentStep >= this.totalSteps) { this.stopAutoPlay(); return; }
        this.revealNext();
      }, this.options.autoPlayDelay);
    }

    stopAutoPlay() {
      if (!this._autoPlaying) return;
      this._autoPlaying = false;
      clearInterval(this._autoPlayTimer);
      this._autoPlayTimer = null;
      if (this.autoPlayBtn) this.autoPlayBtn.textContent = this.options.autoPlayButtonText;
    }

    toggleAutoPlay() {
      this._autoPlaying ? this.stopAutoPlay() : this.startAutoPlay();
    }

    /* ──────────────────────────────────────────
       Reveal
    ────────────────────────────────────────── */

    revealNext() {
      if (this.currentStep >= this.totalSteps) return;
      const step = this.steps[this.currentStep];

      if (step.target && step.targetElement) {
        this.revealToTarget(step);
      } else {
        const el = this.stepContainer.querySelector(`[data-step-index="${this.currentStep}"]`);
        if (el) {
          el.classList.add('revealed');
          if (this.options.autoScroll) {
            setTimeout(() => {
              window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - this.options.scrollOffset, behavior: 'smooth' });
            }, 100);
          }
        }
      }

      this.currentStep++;
      if (this.options.showProgress)    this.updateProgressDisplay();
      if (this.options.showProgressBar) this.updateProgressBar();

      /* ★ onStepRevealed 現在傳入 stepData 作為第一個參數 */
      if (this.options.onStepRevealed) this.options.onStepRevealed(step, this.currentStep, this.totalSteps);

      if (this.currentStep >= this.totalSteps) {
        this.stopAutoPlay();
        this._syncButtonState();
        if (this.options.onAllRevealed) this.options.onAllRevealed();
      }
    }

    revealToTarget(step) {
      if (!step.targetElement) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'step-tutor-target-content';
      wrapper.setAttribute('data-step-index', step.index);

      if (this.options.showIndicator) {
        const ind = document.createElement('div');
        ind.className = 'step-tutor-indicator';
        ind.style.cssText = `background:${this.options.indicatorBgColor};color:${this.options.indicatorTextColor};${this.options.indicatorPadding?`padding:${this.options.indicatorPadding};`:'padding:4px 8px;'}display:inline-block;margin-bottom:8px;font-weight:bold;font-size:${this.options.indicatorFontSize};border-radius:${this.options.indicatorBorderRadius};`;
        let txt = this.options.indicatorFormat.replace('{current}', step.number);
        if (step.indicator) txt = step.indicator;
        if (this.options.showTotalSteps) txt += ` / ${this.totalSteps}`;
        ind.textContent = txt;
        wrapper.appendChild(ind);
      }

      const hlColor = resolveColor(this.options.highlightColor, PALETTE.lavender);
      const hlAlpha = Math.round(Math.max(0, Math.min(100, this.options.highlightOpacity)) / 100 * 255).toString(16).padStart(2, '0');

      const cd = document.createElement('div');
      cd.innerHTML = step.content;
      cd.style.cssText = `color:${this.options.stepTextColor};line-height:1.5;`;
      if (step.highlight) {
        cd.style.cssText += `background:${hlColor}${hlAlpha};border-left:${this.options.highlightBorderWidth} solid ${step.highlight !== 'true' ? step.highlight : hlColor};padding:6px 10px;margin:4px 0;`;
      }
      wrapper.appendChild(cd);

      switch (this.options.targetMode) {
        case 'append':  step.targetElement.appendChild(wrapper); break;
        case 'prepend': step.targetElement.insertBefore(wrapper, step.targetElement.firstChild); break;
        default: step.targetElement.innerHTML = ''; step.targetElement.appendChild(wrapper);
      }

      if (this.options.autoScroll) {
        setTimeout(() => {
          window.scrollTo({ top: step.targetElement.getBoundingClientRect().top + window.pageYOffset - this.options.scrollOffset, behavior: 'smooth' });
        }, 100);
      }
    }

    revealAll() {
      while (this.currentStep < this.totalSteps) {
        const step = this.steps[this.currentStep];
        if (step.target && step.targetElement) {
          this.revealToTarget(step);
        } else {
          const el = this.stepContainer.querySelector(`[data-step-index="${this.currentStep}"]`);
          if (el) el.classList.add('revealed');
        }
        this.currentStep++;
      }
      if (this.options.showProgress)    this.updateProgressDisplay();
      if (this.options.showProgressBar) this.updateProgressBar();
      this.stopAutoPlay();
      this._syncButtonState();
      if (this.options.onAllRevealed) this.options.onAllRevealed();
    }

    /* ──────────────────────────────────────────
       Reset / Nav
    ────────────────────────────────────────── */

    reset() {
      this.stopAutoPlay();
      this.currentStep = 0;
      this.stepContainer.querySelectorAll('.step-tutor-item').forEach(el => el.classList.remove('revealed'));
      if (this.options.targetClearOnReset) {
        this.targetElements.forEach(t => t.querySelectorAll('.step-tutor-target-content').forEach(c => c.remove()));
      }
      if (this.options.showProgress)    this.updateProgressDisplay();
      if (this.options.showProgressBar) this.updateProgressBar();

      this.button.textContent = this.options.buttonText;
      this.button.disabled    = false;
      if (this.revealAllBtn) this.revealAllBtn.disabled = false;
      if (this.autoPlayBtn)  { this.autoPlayBtn.disabled = false; this.autoPlayBtn.textContent = this.options.autoPlayButtonText; }
      if (this.options.restart && this.restartButton) this.restartButton.style.display = 'none';
      if (this.options.onReset) this.options.onReset();
    }

    goToStep(stepNumber) {
      this.reset();
      for (let i = 0; i < stepNumber && i < this.totalSteps; i++) this.revealNext();
    }

    destroy() {
      this.stopAutoPlay();
      this.stepContainer?.remove();
      this.button?.remove();
      this.progressDisplay?.remove();
      this.progressBar?.remove();
      this.targetElements.forEach(t => t.querySelectorAll('.step-tutor-target-content').forEach(c => c.remove()));
      document.getElementById('step-tutor-styles-' + this.container.id)?.remove();
    }
  }


  /* ════════════════════════════════════════════
     §6  Custom Elements 註冊 & StepTutor auto-init
  ════════════════════════════════════════════ */

  customElements.define('bp-radar', BpRadar);
  customElements.define('flow-card', FlowCard);
  if (!customElements.get('radar-note'))
    customElements.define('radar-note', class extends HTMLElement {});
  if (!customElements.get('flow-content'))
    customElements.define('flow-content', class extends HTMLElement {});

  /* StepTutor：透過 data-step-tutor 屬性自動初始化 */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-step-tutor]').forEach(container => {
      const d = container.dataset;
      const o = {};

      /* 顏色 */
      if (d.stepBgColor)        o.stepBgColor        = d.stepBgColor;
      if (d.stepBorderColor)    o.stepBorderColor    = d.stepBorderColor;
      if (d.stepTextColor)      o.stepTextColor      = d.stepTextColor;
      if (d.indicatorBgColor)   o.indicatorBgColor   = d.indicatorBgColor;
      if (d.indicatorTextColor) o.indicatorTextColor = d.indicatorTextColor;
      if (d.highlightColor)     o.highlightColor     = d.highlightColor;

      /* 步驟卡片間距 */
      if (d.stepPadding)     o.stepPadding     = d.stepPadding;
      if (d.stepMargin)      o.stepMargin      = d.stepMargin;
      if (d.stepGap)         o.stepGap         = d.stepGap;
      if (d.indicatorPadding)o.indicatorPadding= d.indicatorPadding;

      /* 邊框 */
      if (d.borderWidth)    o.borderWidth    = d.borderWidth;
      if (d.borderStyle)    o.borderStyle    = d.borderStyle;
      if (d.borderPosition) o.borderPosition = d.borderPosition;
      if (d.borderSize)     o.borderSize     = d.borderSize;
      if (!d.borderSize && d.borderWidth) o.borderSize = d.borderWidth;

      /* Highlight */
      if (d.highlightBorderWidth) o.highlightBorderWidth = d.highlightBorderWidth;
      if (d.highlightOpacity)     o.highlightOpacity     = parseFloat(d.highlightOpacity);

      /* 動畫 */
      if (d.animationDuration) o.animationDuration = d.animationDuration;
      if (d.animationEasing)   o.animationEasing   = d.animationEasing;

      /* 指示器 */
      if (d.showIndicator)           o.showIndicator          = d.showIndicator !== 'false';
      if (d.indicatorFontSize)       o.indicatorFontSize      = d.indicatorFontSize;
      if (d.indicatorBorderRadius)   o.indicatorBorderRadius  = d.indicatorBorderRadius;
      if (d.indicatorMarginBottom)   o.indicatorMarginBottom  = d.indicatorMarginBottom;
      if (d.indicatorFormat)         o.indicatorFormat        = d.indicatorFormat;
      if (d.showTotalSteps)          o.showTotalSteps         = d.showTotalSteps !== 'false';

      /* 主按鈕 */
      if (d.buttonText)         o.buttonText         = d.buttonText;
      if (d.buttonCompleteText) o.buttonCompleteText = d.buttonCompleteText;
      if (d.buttonTheme)        o.buttonTheme        = d.buttonTheme;
      if (d.buttonSize)         o.buttonSize         = d.buttonSize;
      if (d.buttonTextColor)    o.buttonTextColor    = d.buttonTextColor;
      if (d.buttonBorderRadius) o.buttonBorderRadius = d.buttonBorderRadius;

      /* 顯示全部按鈕 */
      if (d.showRevealAllButton)     o.showRevealAllButton     = d.showRevealAllButton === 'true';
      if (d.revealAllButtonText)     o.revealAllButtonText     = d.revealAllButtonText;
      if (d.revealAllButtonTheme)    o.revealAllButtonTheme    = d.revealAllButtonTheme;
      if (d.revealAllButtonSize)     o.revealAllButtonSize     = d.revealAllButtonSize;
      if (d.revealAllButtonFontSize) o.revealAllButtonFontSize = d.revealAllButtonFontSize;

      /* 自動播放 */
      if (d.autoPlay)              o.autoPlay              = d.autoPlay === 'true';
      if (d.autoPlayDelay)         o.autoPlayDelay         = parseInt(d.autoPlayDelay);
      if (d.showAutoPlayButton)    o.showAutoPlayButton    = d.showAutoPlayButton === 'true';
      if (d.autoPlayButtonText)    o.autoPlayButtonText    = d.autoPlayButtonText;
      if (d.autoPlayPauseText)     o.autoPlayPauseText     = d.autoPlayPauseText;
      if (d.autoPlayButtonTheme)   o.autoPlayButtonTheme   = d.autoPlayButtonTheme;
      if (d.autoPlayButtonSize)    o.autoPlayButtonSize    = d.autoPlayButtonSize;
      if (d.autoPlayButtonFontSize)o.autoPlayButtonFontSize= d.autoPlayButtonFontSize;

      /* 重新開始 */
      if (d.restart)                 o.restart                 = d.restart !== 'false';
      if (d.restartButtonPadding)    o.restartButtonPadding    = d.restartButtonPadding;
      if (d.restartButtonFontSize)   o.restartButtonFontSize   = d.restartButtonFontSize;
      if (d.restartButtonFontWeight) o.restartButtonFontWeight = d.restartButtonFontWeight;
      if (d.restartButtonTitle)      o.restartButtonTitle      = d.restartButtonTitle;

      /* 版面 */
      if (d.contentPosition) o.contentPosition = d.contentPosition;

      /* 進度文字 */
      if (d.showProgress)     o.showProgress    = d.showProgress !== 'false';
      if (d.progressText)     o.progressText    = d.progressText;
      if (d.progressFontSize) o.progressFontSize= d.progressFontSize;
      if (d.progressPosition) o.progressPosition= d.progressPosition;

      /* 進度條 */
      if (d.showProgressBar)            o.showProgressBar           = d.showProgressBar === 'true';
      if (d.progressBarHeight)          o.progressBarHeight         = d.progressBarHeight;
      if (d.progressBarBgColor)         o.progressBarBgColor        = d.progressBarBgColor;
      if (d.progressBarGradient)        o.progressBarGradient       = d.progressBarGradient;
      if (d.progressBarBorderWidth)     o.progressBarBorderWidth    = d.progressBarBorderWidth;
      if (d.progressBarBorderColor)     o.progressBarBorderColor    = d.progressBarBorderColor;
      if (d.progressBarBorderRadius)    o.progressBarBorderRadius   = d.progressBarBorderRadius;
      if (d.progressBarPadding)         o.progressBarPadding        = d.progressBarPadding;
      if (d.progressBarTextFontSize)    o.progressBarTextFontSize   = d.progressBarTextFontSize;
      if (d.progressBarTextFontWeight)  o.progressBarTextFontWeight = d.progressBarTextFontWeight;
      if (d.progressBarTextColor)       o.progressBarTextColor      = d.progressBarTextColor;
      if (d.progressBarTextFormat)      o.progressBarTextFormat     = d.progressBarTextFormat;

      /* 滾動 */
      if (d.autoScroll)   o.autoScroll   = d.autoScroll !== 'false';
      if (d.scrollOffset) o.scrollOffset = parseInt(d.scrollOffset);

      /* Target */
      if (d.targetMode)         o.targetMode         = d.targetMode;
      if (d.targetClearOnReset) o.targetClearOnReset = d.targetClearOnReset !== 'false';

      container.stepTutorInstance = new StepTutor(container.id, o);
    });
  });

})();


(function () {
  'use strict';
  const BRAND = {
    lavender:'#C3A5E5', special:'#C8DD5A', warning:'#F08080',
    salmon  :'#E5C3B3', sky    :'#08A9D1', safe   :'#40C99A',
    vanilla :'#DBEDD8', yellow :'#DECA4B', focus  :'#A0CF72',
    info    :'#4285EB', stone  :'#95BDD7', indigo :'#7B6CF0',
    pink    :'#FFB3D9', orange :'#EDA109', shell  :'#C6C7BD',
    transparent:'transparent', none:'transparent',
  };
  const C = {
    bg:'#0C0D0C', bg1:'#141514', bg2:'#1C1D1C', bg3:'#252625',
    shell:'#C6C7BD', special:'#C8DD5A', safe:'#40C99A',
    warning:'#F08080', vanilla:'#DBEDD8', focus:'#A0CF72',
    stone:'#95BDD7', indigo:'#7B6CF0',
  };
  function _rgb(hex) {
    hex = hex.replace('#','');
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }
  function _rgba(hex, a) { const [r,g,b]=_rgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function _darken(hex,t) { const [r,g,b]=_rgb(hex),d=1-t; return `rgb(${Math.round(r*d)},${Math.round(g*d)},${Math.round(b*d)})`; }
  function _lighten(hex,t){ const [r,g,b]=_rgb(hex); return `rgb(${Math.round(r+(255-r)*t)},${Math.round(g+(255-g)*t)},${Math.round(b+(255-b)*t)})`; }
  function _lum(hex) { const [r,g,b]=_rgb(hex); return 0.299*r+0.587*g+0.114*b; }
  function _textOn(hex) { return _lum(hex)>145?'#0C0D0C':'#e8e9e4'; }

  function buildBg(colorKey, opacityStr) {
    const color = BRAND[colorKey] || (colorKey&&colorKey.startsWith('#') ? colorKey : null);
    if (!color || color==='transparent') return null;
    const op = parseFloat(opacityStr);
    if (!isNaN(op) && op!==1 && op>=0) {
      const [r,g,b] = _rgb(color);
      return `rgba(${r},${g},${b},${op})`;
    }
    return color;
  }
  function _themeVars(name, style) {
    const color = BRAND[name];
    if (!color) return {};
    if (style === 'filled') {
      return {
        '--qp-bg': color, '--qp-bg1':_darken(color,.10),
        '--qp-bg2':_darken(color,.18), '--qp-bg3':_darken(color,.28),
        '--qp-panel-border':'rgba(0,0,0,0.28)', '--qp-q-color':'#0a0b0a',
        '--qp-vanilla':'#0a0b0a', '--qp-inp-border':'rgba(0,0,0,0.22)',
        '--qp-focus':'rgba(0,0,0,0.55)', '--qp-inp-ok-bg':'rgba(0,0,0,0.12)',
        '--qp-inp-err-bg':'rgba(0,0,0,0.12)', '--qp-safe':'#0a5432',
        '--qp-warning':'#852020', '--qp-divider':'rgba(0,0,0,0.18)',
        '--qp-expl-color':'rgba(0,0,0,0.72)', '--qp-expl-bg':'rgba(0,0,0,0.10)',
        '--qp-stone':'rgba(0,0,0,0.42)', '--qp-ck-bg':'rgba(0,0,0,0.68)',
        '--qp-ck-fg':color, '--qp-rs-bg':'rgba(0,0,0,0.10)',
        '--qp-rs-fg':'rgba(0,0,0,0.48)', '--qp-rs-bd':'rgba(0,0,0,0.16)',
      };
    }
    return {
      '--qp-panel-border':_rgba(color,.52), '--qp-q-color':color,
      '--qp-inp-border':_rgba(color,.42), '--qp-focus':color,
      '--qp-divider':_rgba(color,.32), '--qp-expl-color':_rgba(color,.80),
      '--qp-expl-bg':`color-mix(in srgb,${color} 8%,#0C0D0C)`,
      '--qp-stone':_rgba(color,.52), '--qp-accent':color,
      '--qp-ck-bg':color, '--qp-ck-fg':C.bg,
      '--qp-rs-fg':_rgba(color,.60), '--qp-rs-bd':_rgba(color,.18),
    };
  }
  function syncCaption(wrapEl, innerEl, opts) {
    /* opts: { caption, captionPos, captionAlign, captionBg, captionColor,
               accentColor, borderWidth } */
    const text = opts.caption;

    /* 無文字 → 移除標籤並重置 innerEl margin */
    if (!text) {
      if (wrapEl._bxCap) { wrapEl._bxCap.remove(); wrapEl._bxCap = null; }
      if (wrapEl._bxCapRaf) { cancelAnimationFrame(wrapEl._bxCapRaf); wrapEl._bxCapRaf = null; }
      if (innerEl) { innerEl.style.marginTop = ''; innerEl.style.paddingLeft = ''; }
      return;
    }

    /* 建立或重用 caption 元素 */
    if (!wrapEl._bxCap) {
      const cp = document.createElement('div');
      cp.className = 'bx-cap';
      wrapEl.appendChild(cp);
      wrapEl._bxCap = cp;
    }
    const cp    = wrapEl._bxCap;
    cp.textContent = text;

    const bw    = opts.borderWidth || 1.5;
    const pos   = (opts.captionPos   || 'top').toLowerCase();
    const align = (opts.captionAlign || 'left').toLowerCase();
    const capBg = BRAND[opts.captionBg] || opts.captionBg || '#1e1f1e';
    const capCol= BRAND[opts.captionColor] || opts.captionColor
                  || opts.accentColor || C.shell;

    Object.assign(cp.style, {
      background : capBg,
      color      : capCol,
      fontSize   : '0.8rem',
      fontWeight : '600',
      border     : `${bw}px solid ${capCol}`,
      borderRadius: '3px',
      lineHeight : '1.4',
    });

    if (wrapEl._bxCapRaf) { cancelAnimationFrame(wrapEl._bxCapRaf); }

    if (pos === 'left') {
      Object.assign(cp.style, {
        writingMode : 'vertical-rl',
        transform   : 'rotate(180deg)',
        top         : `${-bw}px`,
        bottom      : `${-bw}px`,
        left        : `${-bw}px`,
        right       : 'auto',
        padding     : '8px 3px',
        display     : 'flex',
        alignItems  : 'center',
        justifyContent:'center',
        width       : 'auto',
        whiteSpace  : 'nowrap',
      });
      wrapEl._bxCapRaf = requestAnimationFrame(() => {
        wrapEl._bxCapRaf = null;
        if (!wrapEl._bxCap || !innerEl) return;
        const cw = wrapEl._bxCap.offsetWidth;
        if (cw > 0) innerEl.style.paddingLeft = Math.max(cw - bw + 4, 0) + 'px';
      });

    } else {
      /* top 模式 */
      const al = align==='center'
        ? { left:'50%',    right:'auto',   transform:'translateX(-50%)' }
        : align==='right'
        ? { left:'auto',   right:'8px',    transform:'none' }
        : { left:'8px',    right:'auto',   transform:'none' };

      Object.assign(cp.style, {
        writingMode  : '',
        display      : '',
        top          : `${-bw}px`,
        bottom       : 'auto',
        left         : al.left,
        right        : al.right,
        transform    : al.transform,
        padding      : '2px 7px',
        width        : 'auto',
        whiteSpace   : 'nowrap',
      });
      wrapEl._bxCapRaf = requestAnimationFrame(() => {
        wrapEl._bxCapRaf = null;
        if (!wrapEl._bxCap || !innerEl) return;
        const ch = wrapEl._bxCap.offsetHeight;
        if (ch > 0) innerEl.style.marginTop = Math.max(ch - bw + 2, 0) + 'px';
      });
    }
  }
  const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const ICON_RESET = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
  const STYLE_ID = 'box-components-v1';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = /* css */`

      /* ── caption 共用 ── */
      .bx-cap {
        position      : absolute;
        z-index       : 10;
        user-select   : none;
        pointer-events: none;
        box-sizing    : border-box;
      }

      /* ════ QuizPanel ════ */

      .qp-wrapper {
        display        : inline-block;
        vertical-align : top;
        font-family    : system-ui,'Segoe UI',sans-serif;
        font-size      : 1rem;
        position       : relative;
        overflow       : visible;              /* caption 可突出邊框 */
        border         : 1.5px solid var(--qp-panel-border, var(--qp-shell, #C6C7BD));
        border-radius  : 8px;
        box-sizing     : border-box;
      }
      .qp-panel {
        display        : flex;
        flex-direction : row;
        align-items    : stretch;
        background     : var(--qp-bg);
        border-radius  : 6.5px;               /* 8px − 1.5px border */
        overflow       : hidden;
        width          : 100%;
        min-height     : var(--qp-min-h);
        box-sizing     : border-box;
      }
      .qp-wrapper.qp-ratio .qp-question { flex: var(--qp-ratio-l) 1 0; }
      .qp-wrapper.qp-ratio .qp-right    { flex: var(--qp-ratio-r) 1 0; }

      .qp-question {
        flex       : 1 1 auto;
        min-width  : 0;
        padding    : 8px 12px;
        color      : var(--qp-q-color);
        font-size  : var(--qp-fs-q);
        line-height: 1.55;
        display    : flex;
        align-items: center;
        gap        : 6px;
        border-right: 2px dashed var(--qp-divider);
        word-break : break-word;
        box-sizing : border-box;
      }
      .qp-num {
        flex-shrink: 0;
        font-size  : var(--qp-fs-num);
        color      : var(--qp-stone);
        font-weight: 700;
        min-width  : 18px;
        align-self : flex-start;
        padding-top: 1px;
      }
      .qp-right {
        flex       : 0 0 var(--qp-right-w);
        min-width  : 0;
        display    : flex;
        flex-direction: column;
        padding    : 8px;
        gap        : 5px;
        background : var(--qp-bg1);
        box-sizing : border-box;
      }
      .qp-input {
        width        : 100%;
        background   : var(--qp-bg2);
        border       : 1.5px solid var(--qp-inp-border, var(--qp-stone));
        border-radius: 4px;
        color        : var(--qp-vanilla);
        font-size    : var(--qp-fs-inp);
        padding      : 4px 7px;
        outline      : none;
        box-sizing   : border-box;
        transition   : border-color .18s, background .18s;
        resize       : vertical;
        font-family  : inherit;
        line-height  : 1.4;
      }
      .qp-input::placeholder  { color: #55555a; }
      .qp-input:focus         { border-color: var(--qp-focus); }
      .qp-input.qp-correct    { border-color: var(--qp-safe);    background: var(--qp-inp-ok-bg,  #0b1a12); }
      .qp-input.qp-incorrect  { border-color: var(--qp-warning); background: var(--qp-inp-err-bg, #1c0b0b); }
      .qp-action-row {
        display    : flex;
        align-items: center;
        gap        : 5px;
        min-height : var(--qp-btn-size);
      }
      .qp-btn {
        flex           : 0 0 var(--qp-btn-size);
        width          : var(--qp-btn-size);
        height         : var(--qp-btn-size);
        padding        : 0;
        border         : none;
        border-radius  : 5px;
        cursor         : pointer;
        display        : flex;
        align-items    : center;
        justify-content: center;
        transition     : filter .14s, transform .1s;
        font-size      : var(--qp-fs-inp);
        font-family    : inherit;
        font-weight    : 600;
        line-height    : 1;
      }
      .qp-btn:hover  { filter: brightness(1.22); }
      .qp-btn:active { transform: scale(0.88); }
      .qp-btn-check  { background: var(--qp-ck-bg, var(--qp-accent)); color: var(--qp-ck-fg, #fff); }
      .qp-btn-reset  { background: var(--qp-rs-bg, var(--qp-bg3)); color: var(--qp-rs-fg, var(--qp-stone)); border: 1px solid var(--qp-rs-bd, #ffffff1a); }
      .qp-wrapper.qp-bstyle-text .qp-btn,
      .qp-wrapper.qp-bstyle-both .qp-btn { flex:1; width:auto; padding:0 7px; gap:4px; }
      .qp-btn-label { display:none; font-size:.82rem; letter-spacing:.04em; }
      .qp-wrapper.qp-bstyle-both .qp-btn-label,
      .qp-wrapper.qp-bstyle-text .qp-btn-label { display:inline; }
      .qp-result {
        flex:1 1 0; min-width:0; display:none; font-size:var(--qp-fs-res);
        font-weight:700; overflow:hidden; text-overflow:ellipsis;
        white-space:nowrap; line-height:var(--qp-btn-size);
      }
      .qp-result.qp-show      { display:block; }
      .qp-result.qp-correct   { color: var(--qp-safe); }
      .qp-result.qp-incorrect { color: var(--qp-warning); }
      .qp-explanation {
        display:none; font-size:var(--qp-fs-expl); color:var(--qp-expl-color);
        line-height:1.5; padding:5px 7px; background:var(--qp-expl-bg,#120d19);
        border-left:3px solid var(--qp-expl-color); border-radius:3px; word-break:break-word;
      }
      .qp-explanation.qp-show { display:block; }
      .qp-explanation code { background:var(--qp-bg2); padding:1px 5px; border-radius:3px; color:var(--qp-special,#C8DD5A); font-size:.9em; }
      .qp-reveal-btn {
        width:100%; padding:4px 0; background:var(--qp-bg3);
        border:1.5px dashed var(--qp-divider); border-radius:4px;
        color:var(--qp-stone); font-size:var(--qp-fs-res); cursor:pointer;
        font-family:inherit; transition:background .15s,color .15s;
      }
      .qp-reveal-btn:hover { background:var(--qp-bg2); color:var(--qp-shell); }

      /* ════ QuizStrip ════ */

      .qs-wrapper {
        font-family : system-ui,'Segoe UI',sans-serif;
        font-size   : 1rem;
        position    : relative;
        overflow    : visible;                /* caption 可突出邊框 */
        border      : 1.5px solid var(--qs-color);
        border-radius: 8px;
        box-sizing  : border-box;
      }
      .qs-box {
        display        : flex;
        flex-direction : row;
        align-items    : stretch;
        background     : var(--qs-bg, #0C0D0C);
        border-radius  : 6.5px;
        overflow       : hidden;
        min-height     : var(--qs-min-h);
        width          : 100%;
        box-sizing     : border-box;
      }
      .qs-box.qs-fixed { height:var(--qs-h); min-height:unset; align-items:stretch; }
      .qs-box.qs-right { flex-direction:row-reverse; }
      .qs-strip {
        flex:0 0 var(--qs-sw); width:var(--qs-sw); background:var(--qs-color);
        cursor:pointer; display:flex; flex-direction:column; align-items:center;
        justify-content:center; gap:4px; transition:filter .15s; position:relative;
        user-select:none; -webkit-tap-highlight-color:transparent;
      }
      .qs-strip:hover  { filter:brightness(1.22); }
      .qs-strip:active { filter:brightness(.80); }
      .qs-strip:focus-visible { outline:2px solid #fff; outline-offset:-3px; }
      .qs-dots { display:flex; flex-direction:column; gap:4px; pointer-events:none; }
      .qs-dot  { width:4px; height:4px; border-radius:50%; background:rgba(0,0,0,.40); transition:background .2s,transform .2s; }
      .qs-dot.active { background:rgba(255,255,255,.80); transform:scale(1.3); }
      .qs-body {
        flex:1 1 0; min-width:0; position:relative; overflow:hidden;
        background:var(--qs-body-bg,#0C0D0C); display:flex; flex-direction:column; justify-content:center;
      }
      .qs-box.qs-fixed .qs-body { overflow-y:auto; justify-content:flex-start; scrollbar-width:thin; scrollbar-color:var(--qs-color) transparent; }
      .qs-box.qs-fixed .qs-body::-webkit-scrollbar { width:4px; }
      .qs-box.qs-fixed .qs-body::-webkit-scrollbar-track { background:transparent; }
      .qs-box.qs-fixed .qs-body::-webkit-scrollbar-thumb { background:var(--qs-color); border-radius:2px; }
      .qs-slide { will-change:transform,opacity; }
      .qs-badge { position:absolute; right:6px; bottom:calc(var(--qs-ph,2px)+3px); font-size:.62rem; font-family:monospace; color:var(--qs-color); opacity:.50; pointer-events:none; letter-spacing:.04em; line-height:1; z-index:3; }
      .qs-box.qs-right .qs-badge { right:auto; left:6px; }
      .qs-progress {
        position:absolute; bottom:0; left:0; height:var(--qs-ph,2px); width:0%;
        background:var(--qs-color); pointer-events:none; will-change:width; z-index:2; transition:none;
      }
      .qs-box.qs-right .qs-progress { left:auto; right:0; }
      .qs-box.qs-paused .qs-progress { transition:none !important; }
      .qs-progress.qs-fuse { background:linear-gradient(to right,rgba(0,0,0,0) 0%,color-mix(in srgb,var(--qs-color) 28%,transparent) 100%); }
      .qs-progress.qs-fuse::after {
        content:''; position:absolute; right:calc(var(--qs-tip,7px)*-.5); top:50%; transform:translateY(-50%);
        width:var(--qs-tip,7px); height:var(--qs-tip,7px); border-radius:50%;
        background:radial-gradient(circle,#fff 0%,#fffbe0 30%,var(--qs-color) 65%,transparent 100%);
        box-shadow:0 0 calc(var(--qs-tip,7px)*1) calc(var(--qs-tip,7px)*.35) var(--qs-color),0 0 calc(var(--qs-tip,7px)*2.5) calc(var(--qs-tip,7px)*.5) var(--qs-color);
        animation:qs-fuse-spark 90ms ease-in-out infinite alternate; will-change:transform,opacity,box-shadow;
      }
      .qs-progress.qs-fuse-rtl { right:0; left:auto; background:linear-gradient(to left,rgba(0,0,0,0) 0%,color-mix(in srgb,var(--qs-color) 28%,transparent) 100%); }
      .qs-progress.qs-fuse-rtl::after { right:auto; left:calc(var(--qs-tip,7px)*-.5); }
      .qs-box.qs-paused .qs-progress::after { animation-play-state:paused !important; }
      @keyframes qs-fuse-spark {
        from { transform:translateY(-50%) scale(1); box-shadow:0 0 calc(var(--qs-tip,7px)*1) calc(var(--qs-tip,7px)*.35) var(--qs-color),0 0 calc(var(--qs-tip,7px)*2.5) calc(var(--qs-tip,7px)*.5) var(--qs-color); }
        to   { transform:translateY(-50%) scale(1.25); box-shadow:0 0 calc(var(--qs-tip,7px)*.6) calc(var(--qs-tip,7px)*.2) var(--qs-color),0 0 calc(var(--qs-tip,7px)*1.8) calc(var(--qs-tip,7px)*.35) var(--qs-color); opacity:.88; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════
     工具
  ══════════════════════════════════════════ */
  function gcfg(el, attr, key, fb, D) {
    if (el.hasAttribute(attr)) return el.getAttribute(attr);
    const G = (key in ({}) ? {} : (window[D]||{}));
    if (key in G) return G[key];
    return fb;
  }
  function _gcfg(el, attr, key, globalObj, fallback) {
    if (el.hasAttribute(attr)) return el.getAttribute(attr);
    const G = globalObj || {};
    if (key in G) return G[key];
    return fallback;
  }
  function parseRatio(s) {
    if (!s) return null;
    const [l,r] = String(s).split(':').map(Number);
    return (isFinite(l)&&isFinite(r)) ? [l,r] : null;
  }
  function md(t) {
    if (!t) return '';
    const PH='\x00BR\x00';
    return t
      .replace(/&lt;br\s*(\/)?&gt;/gi, PH)
      .replace(/<br\s*\/?>/gi, PH)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code>$1</code>')
      .replace(/\n/g,'<br>')
      .replace(new RegExp(PH,'g'),'<br>');
  }
  function mk(tag,cls,attrs) {
    const e=document.createElement(tag);
    if(cls) e.className=cls;
    if(attrs) for(const [k,v] of Object.entries(attrs)) {
      if(k==='html') e.innerHTML=v;
      else if(k==='text') e.textContent=v;
      else e.setAttribute(k,v);
    }
    return e;
  }

  /* ══════════════════════════════════════════
     群組（QuizPanel 用）
  ══════════════════════════════════════════ */
  const _groups={}, _timers={};
  function applyGroupNums(name) {
    const g=_groups[name];
    if(!g||g.noNumber) return;
    g.panels.sort((a,b)=>
      (a.$wrap.compareDocumentPosition(b.$wrap)&Node.DOCUMENT_POSITION_FOLLOWING)?-1:1
    );
    let n=g.start??1;
    for(const p of g.panels){ if(!p.o.skipNumber) p._applyAutoNum(n++); }
  }

  /* ══════════════════════════════════════════
     QuizPanel 預設值
  ══════════════════════════════════════════ */
  const QP_D = {
    checkIcon:ICON_CHECK, resetIcon:ICON_RESET,
    checkLabel:'核對答案', resetLabel:'重設',
    btnStyle:'icon', btnSize:'26px',
    placeholder:'請輸入答案…',
    correctMessage:'✓ 正確！', incorrectMsg:'✗ 錯誤',
    caseSensitive:false, matchMode:'exact',
    panelWidth:'620px', ratio:'1:1', rightWidth:null, minHeight:'80px',
    questionColor:C.shell, explColor:'#C3A5E5',
    accentColor:C.indigo, dividerColor:C.stone,
    animDuration:200, theme:'', themeStyle:'dark',
    fsQuestion:'0.96rem', fsNumber:'0.76rem', fsInput:'0.88rem',
    fsResult:'0.8rem', fsExplanation:'0.82rem',
  };

  /* ══════════════════════════════════════════
     QuizPanel 類別
  ══════════════════════════════════════════ */
  class QuizPanel {
    constructor(src) {
      this._src=src; this._autoNum=null; this._numEl=null;
      this._readCfg(); this._build(); this._bindEvents();
      if(this.o.group) this._registerGroup();
    }
    _readCfg() {
      const e=this._src, G=window.QuizPanelConfig||{};
      const r=(attr,key,fb)=>_gcfg(e,attr,key,G,fb!==undefined?fb:QP_D[key]);

      let ratioStr=null, rightWidth=null;
      if(e.hasAttribute('ratio'))       ratioStr  =e.getAttribute('ratio');
      else if(e.hasAttribute('right-width')) rightWidth=e.getAttribute('right-width');
      else if(G.ratio!=null)            ratioStr  =G.ratio;
      else if(G.rightWidth!=null)       rightWidth=G.rightWidth;
      else                              ratioStr  =QP_D.ratio;
      this.o={
        question    :e.getAttribute('question')   ||'（未設定題目）',
        answer      :e.getAttribute('answer')     ||'',
        explanation :e.getAttribute('explanation')||'',
        placeholder :r('placeholder',    'placeholder'),
        checkLabel  :r('check-label',    'checkLabel'),
        resetLabel  :r('reset-label',    'resetLabel'),
        checkIcon   :r('check-icon',     'checkIcon'),
        resetIcon   :r('reset-icon',     'resetIcon'),
        btnStyle    :r('btn-style',      'btnStyle'),
        btnSize     :r('btn-size',       'btnSize'),
        correctMsg  :r('correct-message','correctMessage'),
        incorrectMsg:r('incorrect-message','incorrectMsg'),
        caseSensitive:r('case-sensitive','caseSensitive',String(QP_D.caseSensitive))==='true',
        matchMode   :r('match-mode',     'matchMode'),
        panelWidth  :r('panel-width',    'panelWidth'),
        minHeight   :r('min-height',     'minHeight'),
        ratioStr, rightWidth,
        qColor      :r('question-color', 'questionColor'),
        eColor      :r('explanation-color','explColor'),
        accent      :r('accent-color',   'accentColor'),
        divider     :r('divider-color',  'dividerColor'),
        theme       :r('theme',          'theme'),
        themeStyle  :r('theme-style',    'themeStyle'),
        fsQ   :r('fs-question',   'fsQuestion'),   fsNum :r('fs-number','fsNumber'),
        fsInp :r('fs-input',      'fsInput'),       fsRes :r('fs-result','fsResult'),
        fsExpl:r('fs-explanation','fsExplanation'),
        showNum      :e.getAttribute('show-number')||'',
        inputType    :e.getAttribute('input-type') ||'text',
        inputRows    :parseInt(e.getAttribute('input-rows')||'2'),
        readonlyAnswer:(e.getAttribute('readonly-answer')||'false')==='true',
        group        :e.getAttribute('group')      ||'',
        groupStart   :e.hasAttribute('group-start')?parseInt(e.getAttribute('group-start'),10):null,
        groupNoNumber:e.hasAttribute('group-no-number'),
        skipNumber   :e.hasAttribute('skip-number'),
        /* ── 新增 ── */
        bgColor  :e.getAttribute('bg-color')     ||'',
        bgOpacity:e.getAttribute('bg-opacity')   ||'',
        caption      :e.getAttribute('caption')      ||'',
        captionPos   :e.getAttribute('caption-pos')  ||'top',
        captionAlign :e.getAttribute('caption-align')||'left',
        captionBg    :e.getAttribute('caption-bg')   ||'',
        captionColor :e.getAttribute('caption-color')||'',
      };
    }

    _build() {
      const o=this.o, ratio=parseRatio(o.ratioStr);

      this.$wrap=mk('div','qp-wrapper');
      if(ratio)                   this.$wrap.classList.add('qp-ratio');
      if(o.btnStyle==='text')     this.$wrap.classList.add('qp-bstyle-text');
      else if(o.btnStyle==='both')this.$wrap.classList.add('qp-bstyle-both');
      const isPercent=/^\d+(\.\d+)?%$/.test(String(o.panelWidth).trim());
      this.$wrap.style.display=isPercent?'block':'inline-block';
      this.$wrap.style.width=o.panelWidth;
      const vars={
        '--qp-bg':C.bg,'--qp-bg1':C.bg1,'--qp-bg2':C.bg2,'--qp-bg3':C.bg3,
        '--qp-shell':C.shell,'--qp-accent':o.accent,'--qp-divider':o.divider,
        '--qp-q-color':o.qColor,'--qp-expl-color':o.eColor,
        '--qp-safe':C.safe,'--qp-warning':C.warning,
        '--qp-special':'#C8DD5A','--qp-stone':C.stone,
        '--qp-focus':C.focus,'--qp-vanilla':C.vanilla,
        '--qp-min-h':o.minHeight,'--qp-anim':`${200}ms`,'--qp-btn-size':o.btnSize,
        '--qp-fs-q':o.fsQ,'--qp-fs-num':o.fsNum,'--qp-fs-inp':o.fsInp,
        '--qp-fs-res':o.fsRes,'--qp-fs-expl':o.fsExpl,
      };
      if(ratio){ vars['--qp-ratio-l']=String(ratio[0]); vars['--qp-ratio-r']=String(ratio[1]); }
      else { vars['--qp-right-w']=o.rightWidth||'220px'; }
      if(o.theme) Object.assign(vars,_themeVars(o.theme,o.themeStyle));
      const customBg=buildBg(o.bgColor,o.bgOpacity);
      if(customBg){ vars['--qp-bg']=customBg; }
      for(const [k,v] of Object.entries(vars)) this.$wrap.style.setProperty(k,v);
      this.$panel=mk('div','qp-panel',{role:'region','aria-label':'題目面板'});
      this.$question=mk('div','qp-question');
      if(o.showNum){ this._numEl=mk('span','qp-num',{text:o.showNum+'.'}); this.$question.appendChild(this._numEl); }
      this._qTextEl=mk('span'); this._qTextEl.innerHTML=md(o.question);
      this.$question.appendChild(this._qTextEl);
      this.$right=mk('div','qp-right');
      if(!o.readonlyAnswer){
        this.$input=(o.inputType==='textarea')
          ?mk('textarea','qp-input',{placeholder:o.placeholder,rows:String(o.inputRows),'aria-label':'答案輸入欄位'})
          :mk('input','qp-input',{type:'text',placeholder:o.placeholder,'aria-label':'答案輸入欄位'});
        this.$right.appendChild(this.$input);
        this.$actionRow=mk('div','qp-action-row');
        this.$btnCheck=this._makeBtn('check');
        this.$btnReset=this._makeBtn('reset');
        this.$result=mk('div','qp-result',{role:'status','aria-live':'polite'});
        this.$actionRow.append(this.$btnCheck,this.$btnReset,this.$result);
        this.$right.appendChild(this.$actionRow);
      } else {
        this.$revealBtn=mk('button','qp-reveal-btn',{type:'button',text:'▼ 顯示解說'});
        this.$right.appendChild(this.$revealBtn);
        this.$result=null; this.$input=null;
      }
      if(o.explanation){
        this.$expl=mk('div','qp-explanation'); this.$expl.innerHTML=md(o.explanation);
        this.$right.appendChild(this.$expl);
      } else { this.$expl=null; }
      this.$panel.append(this.$question,this.$right);
      this.$wrap.appendChild(this.$panel);
      this.$wrap.__qp=this;
      this._src.replaceWith(this.$wrap);
      if(o.caption){
        syncCaption(this.$wrap, this.$panel, {
          caption:o.caption, captionPos:o.captionPos,
          captionAlign:o.captionAlign, captionBg:o.captionBg,
          captionColor:o.captionColor, accentColor:o.accent,
          borderWidth:1.5,
        });
      }
    }

    _makeBtn(type){
      const o=this.o, icon=type==='check'?o.checkIcon:o.resetIcon;
      const lbl=type==='check'?o.checkLabel:o.resetLabel;
      const btn=mk('button',`qp-btn qp-btn-${type}`,{type:'button',title:lbl,'aria-label':lbl});
      if(o.btnStyle==='text'){ btn.textContent=lbl; }
      else if(o.btnStyle==='both'){ const i=mk('span'); i.innerHTML=icon; btn.append(i,mk('span','qp-btn-label',{text:lbl})); }
      else { btn.innerHTML=icon; }
      return btn;
    }

    _registerGroup(){
      const name=this.o.group;
      if(!_groups[name]) _groups[name]={panels:[],start:null,noNumber:false};
      const g=_groups[name];
      g.panels.push(this);
      if(this.o.groupStart!=null&&g.start==null) g.start=this.o.groupStart;
      if(this.o.groupNoNumber) g.noNumber=true;
      clearTimeout(_timers[name]);
      _timers[name]=setTimeout(()=>applyGroupNums(name),0);
    }
    _applyAutoNum(n){
      this._autoNum=n;
      if(this.o.showNum) return;
      if(!this._numEl){ this._numEl=mk('span','qp-num',{text:n+'.'}); this.$question.insertBefore(this._numEl,this._qTextEl); }
      else this._numEl.textContent=n+'.';
    }
    _match(u){
      const{answer,caseSensitive,matchMode}=this.o; if(!answer) return false;
      const n=s=>caseSensitive?s.trim():s.trim().toLowerCase(), ua=n(u);
      if(matchMode==='contains') return answer.split('|').some(a=>{const c=n(a);return c&&(c.includes(ua)||ua.includes(c));});
      if(matchMode==='regex') try{return new RegExp(n(answer),caseSensitive?'':'i').test(ua);}catch{return false;}
      return answer.split('|').map(a=>n(a)).includes(ua);
    }
    _bindEvents(){
      if(!this.o.readonlyAnswer){
        this.$btnCheck.addEventListener('click',()=>this.check());
        this.$btnReset.addEventListener('click',()=>this.reset());
        if(this.o.inputType!=='textarea') this.$input.addEventListener('keydown',e=>{if(e.key==='Enter')this.check();});
      } else if(this.$revealBtn){
        this.$revealBtn.addEventListener('click',()=>{
          if(!this.$expl) return;
          const show=!this.$expl.classList.contains('qp-show');
          this.$expl.classList.toggle('qp-show',show);
          this.$revealBtn.textContent=show?'▲ 隱藏解說':'▼ 顯示解說';
        });
      }
    }
    check(){
      if(!this.$input) return;
      const ua=this.$input.value, ok=this._match(ua);
      this.$input.classList.remove('qp-correct','qp-incorrect');
      this.$input.classList.add(ok?'qp-correct':'qp-incorrect');
      if(this.$result){ this.$result.className=`qp-result qp-show ${ok?'qp-correct':'qp-incorrect'}`; this.$result.textContent=ok?this.o.correctMsg:this.o.incorrectMsg; }
      if(this.$expl) this.$expl.classList.add('qp-show');
      this.$wrap.dispatchEvent(new CustomEvent('quiz-panel-check',{bubbles:true,detail:{answer:ua,correct:ok,expected:this.o.answer}}));
    }
    reset(){
      if(this.$input){this.$input.value='';this.$input.classList.remove('qp-correct','qp-incorrect');this.$input.focus();}
      if(this.$result){this.$result.className='qp-result';this.$result.textContent='';}
      if(this.$expl) this.$expl.classList.remove('qp-show');
      this.$wrap.dispatchEvent(new CustomEvent('quiz-panel-reset',{bubbles:true,detail:{}}));
    }
    getGroupNumber(){ return this._autoNum; }
    setQuestion(t){ this.o.question=t; this._qTextEl.innerHTML=md(t); }
    setAnswer(t){ this.o.answer=t; }
    setExplanation(t){ this.o.explanation=t; if(this.$expl) this.$expl.innerHTML=md(t); }

    static getGroup(n)        { return (_groups[n]?.panels||[]).slice(); }
    static resetGroup(n)      { QuizPanel.getGroup(n).forEach(p=>p.reset()); }
    static renumberGroup(n,s) { if(_groups[n]){_groups[n].start=s;applyGroupNums(n);} }
    static collectAnswers(opts={}){
      const{onlyAnswered=false,group:fg=null}=opts; const res=[]; let idx=0;
      document.querySelectorAll('.qp-wrapper').forEach(w=>{
        const p=w.__qp; if(!p) return;
        if(fg&&p.o.group!==fg) return;
        const ui=p.$input?p.$input.value:'';
        if(onlyAnswered&&!ui.trim()) return;
        const num=p._autoNum!=null?String(p._autoNum):(p.o.showNum||null);
        res.push({index:idx,number:num,group:p.o.group||null,question:p.o.question,
                  userInput:ui,expected:p.o.answer,correct:p.o.readonlyAnswer?null:p._match(ui)});
        idx++;
      });
      return res;
    }
    static collectAnswersJSON(opts={}){ return JSON.stringify(QuizPanel.collectAnswers(opts),null,2); }
  }
  const QS_D = {
    theme:'lavender', stripWidth:8, stripPosition:'left',
    showDots:false, showBadge:false,
    mode:'manual', carouselInterval:3000, loop:true,
    progressHeight:2, progressStyle:'bar', animMs:240,
    panelWidth:'620px', minHeight:'50px', height:'auto',
  };
  class QuizStrip {
    constructor(src){
      this._src=src; this._curIdx=0; this._carouselTid=null; this._levels=[];
      this._readCfg(); this._collectLevels(); this._build(); this._bindEvents();
      if(this.o.mode==='carousel') this._startCarousel();
    }
    _readCfg(){
      const e=this._src, G=window.QuizStripConfig||{};
      const r=(attr,key,fb)=>_gcfg(e,attr,key,G,fb!==undefined?fb:QS_D[key]);
      const themeKey=r('theme','theme');
      this.o={
        color        :BRAND[themeKey]||themeKey,
        stripWidth   :parseInt(r('strip-width','stripWidth')),
        stripPosition:r('strip-position','stripPosition')==='right'?'right':'left',
        showDots     :e.hasAttribute('show-dots')||((G.showDots===true)),
        showBadge    :e.hasAttribute('show-badge')||((G.showBadge===true)),
        mode         :r('mode','mode'),
        carouselInterval:Math.max(400,parseInt(r('carousel-interval','carouselInterval'))),
        loop         :!e.hasAttribute('no-loop')&&(G.loop!==false),
        progressHeight:Math.max(1,parseInt(r('progress-height','progressHeight'))),
        progressStyle:r('progress-style','progressStyle'),
        animMs       :parseInt(r('anim-ms','animMs')),
        panelWidth   :r('panel-width','panelWidth'),
        minHeight    :r('min-height','minHeight'),
        height       :r('height','height'),
        bgColor  :e.getAttribute('bg-color')     ||'',
        bgOpacity:e.getAttribute('bg-opacity')   ||'',
        caption      :e.getAttribute('caption')      ||'',
        captionPos   :e.getAttribute('caption-pos')  ||'top',
        captionAlign :e.getAttribute('caption-align')||'left',
        captionBg    :e.getAttribute('caption-bg')   ||'',
        captionColor :e.getAttribute('caption-color')||'',
      };
    }
    _collectLevels(){ this._levels=Array.from(this._src.querySelectorAll(':scope>[data-strip-level]')); }
    _build(){
      const o=this.o;
      this.$wrap=mk('div','qs-wrapper');
      const isPercent=/^\d+(\.\d+)?%$/.test(String(o.panelWidth).trim());
      this.$wrap.style.display=isPercent?'block':'inline-block';
      this.$wrap.style.width=o.panelWidth;
      const baseBg = buildBg(o.bgColor,o.bgOpacity) || '#0C0D0C';

      const vars={
        '--qs-color':o.color,'--qs-sw':o.stripWidth+'px',
        '--qs-min-h':o.minHeight,'--qs-ph':o.progressHeight+'px',
        '--qs-tip':Math.max(o.progressHeight*3,6)+'px',
        '--qs-bg':baseBg,'--qs-body-bg':baseBg,
      };
      if(o.height!=='auto') vars['--qs-h']=o.height;
      for(const [k,v] of Object.entries(vars)) this.$wrap.style.setProperty(k,v);

      this.$box=mk('div','qs-box'
        +(o.stripPosition==='right'?' qs-right':'')
        +(o.height!=='auto'?' qs-fixed':''));

      this.$strip=mk('div','qs-strip');
      this.$strip.tabIndex=0;
      this.$strip.setAttribute('role','button');
      this.$strip.setAttribute('aria-label','切換到下一層');
      this.$dots=mk('div','qs-dots');
      this.$dots.style.display=o.showDots?'':'none';
      this.$strip.appendChild(this.$dots);

      this.$body=mk('div','qs-body');
      this.$slide=mk('div','qs-slide');
      this.$body.appendChild(this.$slide);
      this.$badge=mk('div','qs-badge');
      this.$badge.style.display=o.showBadge?'':'none';
      this.$body.appendChild(this.$badge);
      this.$progress=mk('div','qs-progress'
        +(o.progressStyle==='fuse'?(o.stripPosition==='right'?' qs-fuse qs-fuse-rtl':' qs-fuse'):''));
      this.$body.appendChild(this.$progress);

      this.$box.append(this.$strip,this.$body);
      this.$wrap.appendChild(this.$box);

      this._levels.forEach((lv,i)=>{lv.style.display=i===0?'':'none'; this.$slide.appendChild(lv);});
      this._src.replaceWith(this.$wrap);
      this.$wrap.__qs=this;

      this._updateDots(); this._updateBadge();

      /* ── caption ── */
      if(o.caption){
        syncCaption(this.$wrap, this.$box, {
          caption:o.caption, captionPos:o.captionPos,
          captionAlign:o.captionAlign, captionBg:o.captionBg,
          captionColor:o.captionColor, accentColor:o.color,
          borderWidth:1.5,
        });
      }
    }
    _bindEvents(){
      this.$strip.addEventListener('click',()=>this.next());
      this.$strip.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();this.next();}
        if(e.key==='ArrowUp'){e.preventDefault();this.prev();}
        if(e.key==='ArrowDown'){e.preventDefault();this.next();}
      });
      if(this.o.mode==='carousel'){
        this.$box.addEventListener('mouseenter',()=>this._pauseCarousel());
        this.$box.addEventListener('mouseleave',()=>this._resumeCarousel());
      }
    }
    _updateDots(){
      this.$dots.innerHTML='';
      const count=Math.min(this._levels.length,8);
      for(let i=0;i<count;i++){
        const d=mk('span','qs-dot'+(i===this._curIdx?' active':''));
        this.$dots.appendChild(d);
      }
    }
    _updateBadge(){ if(this.o.showBadge){ const t=this._levels.length; this.$badge.textContent=t>1?`${this._curIdx+1}/${t}`:''; } }
    _loadContent(idx,animate){
      const ms=this.o.animMs;
      if(!animate||ms<=0){ this._levels.forEach((lv,i)=>{lv.style.display=i===idx?'':'none';}); this.$slide.style.cssText=''; return; }
      const fromRight=this.o.stripPosition==='right';
      const outX=fromRight?'110%':'-110%', inX=fromRight?'-110%':'110%';
      this.$slide.style.transition=`transform ${ms}ms ease,opacity ${ms}ms ease`;
      this.$slide.style.transform=`translateX(${outX})`; this.$slide.style.opacity='0';
      setTimeout(()=>{
        this._levels.forEach((lv,i)=>{lv.style.display=i===idx?'':'none';});
        this.$slide.style.transition='none'; this.$slide.style.transform=`translateX(${inX})`; this.$slide.style.opacity='0';
        void this.$slide.offsetWidth;
        this.$slide.style.transition=`transform ${ms}ms ease,opacity ${ms}ms ease`;
        this.$slide.style.transform='translateX(0)'; this.$slide.style.opacity='1';
      },ms);
    }
    _resetProgress(ms){
      const rtl=this.o.stripPosition==='right', p=this.$progress;
      p.style.transition='none'; p.style.width=rtl?'100%':'0%';
      void p.offsetWidth;
      p.style.transition=`width ${ms}ms linear`; p.style.width=rtl?'0%':'100%';
    }
    _startCarousel(){
      this._stopCarousel(); if(this._levels.length<2) return;
      const ms=this.o.carouselInterval; this._resetProgress(ms);
      this._carouselTid=setInterval(()=>{this.next();this._resetProgress(ms);},ms);
    }
    _stopCarousel(){ if(this._carouselTid){clearInterval(this._carouselTid);this._carouselTid=null;} }
    _pauseCarousel(){
      if(!this._carouselTid) return;
      this._stopCarousel(); this.$box.classList.add('qs-paused');
      const w=parseFloat(this.$progress.style.width)||0;
      this._pausedPct=w; this.$progress.style.transition='none'; this.$progress.style.width=w+'%';
    }
    _resumeCarousel(){
      if(this._carouselTid) return;
      this.$box.classList.remove('qs-paused');
      const rtl=this.o.stripPosition==='right', pct=this._pausedPct??(rtl?100:0);
      const remaining=rtl?Math.max(200,this.o.carouselInterval*(pct/100)):Math.max(200,this.o.carouselInterval*(1-pct/100));
      this.$progress.style.transition=`width ${remaining}ms linear`;
      this.$progress.style.width=rtl?'0%':'100%';
      this._carouselTid=setTimeout(()=>{this.next();this._startCarousel();},remaining);
    }
    goTo(idx,animate=true){
      const max=this._levels.length-1;
      idx=Math.max(0,Math.min(idx,max)); this._curIdx=idx;
      this._loadContent(idx,animate); this._updateDots(); this._updateBadge();
      this.$wrap.dispatchEvent(new CustomEvent('qs-change',{bubbles:true,detail:{level:idx,total:this._levels.length}}));
    }
    next(){
      const max=this._levels.length-1;
      if(this._curIdx>=max){ if(this.o.loop) this.goTo(0); else this._stopCarousel(); }
      else this.goTo(this._curIdx+1);
    }
    prev(){ if(this._curIdx<=0){ if(this.o.loop) this.goTo(this._levels.length-1); } else this.goTo(this._curIdx-1); }
    startCarousel(){ this._startCarousel(); }
    stopCarousel() { this._stopCarousel(); }
    get currentLevel(){ return this._curIdx; }
  }

  function initAll(root) {
    const r=root||document;
    r.querySelectorAll('[data-quiz-panel]').forEach(n=>{ if(!n._qpInit){n._qpInit=true;new QuizPanel(n);} });
    r.querySelectorAll('[data-quiz-strip]').forEach(n=>{ if(!n._qsInit){n._qsInit=true;new QuizStrip(n);} });
  }
  document.readyState==='loading'
    ?document.addEventListener('DOMContentLoaded',()=>initAll())
    :initAll();
  new MutationObserver(ms=>{
    for(const m of ms) for(const n of m.addedNodes){
      if(n.nodeType!==1) continue;
      if(n.matches?.('[data-quiz-panel]')&&!n._qpInit){n._qpInit=true;new QuizPanel(n);}
      if(n.matches?.('[data-quiz-strip]')&&!n._qsInit){n._qsInit=true;new QuizStrip(n);}
      n.querySelectorAll?.('[data-quiz-panel]').forEach(x=>{if(!x._qpInit){x._qpInit=true;new QuizPanel(x);}});
      n.querySelectorAll?.('[data-quiz-strip]').forEach(x=>{if(!x._qsInit){x._qsInit=true;new QuizStrip(x);}});
    }
  }).observe(document.body,{childList:true,subtree:true});

  window.QuizPanel=QuizPanel;
  window.QuizStrip=QuizStrip;
})();
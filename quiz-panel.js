/**
 * theme="colorName"       套用品牌色主題（見下表）
 * theme-style="dark"      dark（深色背景＋主題色文字，預設）
 *                         filled（主題色背景＋深色文字）
 *
 * 可用主題色名稱：
 *   lavender │ special │ warning │ salmon │ sky │ safe │ vanilla
 *   yellow   │ focus   │ info    │ stone  │ indigo │ pink │ orange │ shell
 *
 * 範例：
 *   <div data-quiz-panel theme="sky" ...>          → 深色背景＋sky藍文字
 *   <div data-quiz-panel theme="indigo" theme-style="filled" ...>
 *                                                  → indigo背景＋深色文字
 *
 * 全域套用（所有元件）：
 *   window.QuizPanelConfig = { theme: 'sky', themeStyle: 'dark' };
 *
 * ── 收合按鈕緊湊模式 ──────────────────────────────────────────────────────────
 *
 * init-small         布林屬性。收合狀態高度減半（適合橫向排列多題時）
 *                    全域：QuizPanelConfig.initSmall = true
 *
 * ── 字體大小（各部位）────────────────────────────────────────────────────────
 *
 * fs-trigger="1.2rem"      收合觸發器圖示
 * fs-question="0.96rem"    題目文字
 * fs-number="0.76rem"      題號
 * fs-input="0.88rem"       輸入欄
 * fs-result="0.8rem"       核對結果（inline）
 * fs-explanation="0.82rem" 解說文字
 *
 * 全域：QuizPanelConfig.fsTrigger / fsQuestion / fsNumber / fsInput / fsResult / fsExplanation
 *
 * ── 按鈕 ─────────────────────────────────────────────────────────────────────
 *
 * btn-style="icon"          icon（預設）│ text │ both
 * btn-size="30px"           按鈕邊長
 * check-icon / reset-icon   覆蓋圖示 HTML
 * check-label / reset-label aria-label 及 tooltip
 * correct-message / incorrect-message
 *
 * 全域：QuizPanelConfig.btnStyle / btnSize / checkIcon / resetIcon / checkLabel / resetLabel
 *
 * ── 欄寬 ─────────────────────────────────────────────────────────────────────
 *
 * ratio="1:1"          左:右比例（預設），與 right-width 擇一
 * right-width="220px"  固定右欄（設定後取消 ratio）
 *
 * ── 群組自動編號 ──────────────────────────────────────────────────────────────
 *
 * group="名稱"          群組，依 DOM 順序自動編號
 * group-start="N"       起始號（同群組第一個出現的值生效）
 * group-no-number       布林，整組停用編號
 * skip-number           布林，此題不佔序號、不顯示
 *
 * ── 其他屬性 ─────────────────────────────────────────────────────────────────
 *
 * question / answer / explanation / placeholder
 * case-sensitive / match-mode（exact│contains│regex）
 * show-number / input-type / input-rows / start-open / readonly-answer
 * question-color / explanation-color / accent-color / divider-color
 * panel-width / min-height / trigger-width / trigger-min-height
 * collapse-icon / expand-icon / anim-duration
 *
 * ── 事件（bubble）────────────────────────────────────────────────────────────
 *
 * quiz-panel-open / quiz-panel-close / quiz-panel-reset
 * quiz-panel-check  →  detail: { answer, correct, expected }
 *
 * ── 靜態 API ─────────────────────────────────────────────────────────────────
 *
 * QuizPanel.getGroup(name) / .resetGroup(name) / .renumberGroup(name, N)
 *
 * ── 實例 API（wrapper.__qp）──────────────────────────────────────────────────
 *
 * .open() / .close() / .check() / .reset() / .isOpen()
 * .setQuestion(t) / .setAnswer(t) / .setExplanation(t) / .getGroupNumber()
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     調色盤基底
  ══════════════════════════════════════════ */
  const C = {
    bg:'#0C0D0C', bg1:'#141514', bg2:'#1C1D1C', bg3:'#252625',
    shell:'#C6C7BD', lavender:'#C3A5E5', special:'#C8DD5A',
    warning:'#F08080', safe:'#40C99A', vanilla:'#DBEDD8',
    focus:'#A0CF72', stone:'#95BDD7', indigo:'#7B6CF0',
  };

  /* ══════════════════════════════════════════
     品牌色映射表
  ══════════════════════════════════════════ */
  const BRAND = {
    lavender:'#C3A5E5', special:'#C8DD5A', warning:'#F08080',
    salmon  :'#E5C3B3', sky    :'#08A9D1', safe   :'#40C99A',
    vanilla :'#DBEDD8', yellow :'#DECA4B', focus  :'#A0CF72',
    info    :'#4285EB', stone  :'#95BDD7', indigo :'#7B6CF0',
    pink    :'#FFB3D9', orange :'#EDA109', shell  :'#C6C7BD',
  };

  function _rgb(hex) {
    hex = hex.replace('#','');
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }
  function _rgba(hex, a) {
    const [r,g,b] = _rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  function _darken(hex, t) {           // t: 0-1 混入黑色比例
    const [r,g,b] = _rgb(hex), d=1-t;
    return `rgb(${Math.round(r*d)},${Math.round(g*d)},${Math.round(b*d)})`;
  }
  function _lighten(hex, t) {          // t: 0-1 混入白色比例
    const [r,g,b] = _rgb(hex);
    return `rgb(${Math.round(r+(255-r)*t)},${Math.round(g+(255-g)*t)},${Math.round(b+(255-b)*t)})`;
  }

  /* ══════════════════════════════════════════
     主題變數計算
  ══════════════════════════════════════════ */
  function _themeVars(name, style) {
    const color = BRAND[name];
    if (!color) return {};

    if (style === 'filled') {
      /*
       * 填滿樣式：主題色作為面板背景，深色文字
       * bg  = 主題色（題目區）
       * bg1 = 稍暗（右側面板）
       * bg2 = 更暗（輸入欄）
       * bg3 = 最暗（重設按鈕）
       */
      return {
        '--qp-bg'          : color,
        '--qp-bg1'         : _darken(color, 0.10),
        '--qp-bg2'         : _darken(color, 0.18),
        '--qp-bg3'         : _darken(color, 0.28),
        '--qp-panel-border': 'rgba(0,0,0,0.28)',
        /* 題目區 */
        '--qp-q-color'     : '#0a0b0a',
        /* 輸入 */
        '--qp-vanilla'     : '#0a0b0a',
        '--qp-inp-border'  : 'rgba(0,0,0,0.22)',
        '--qp-focus'       : 'rgba(0,0,0,0.55)',
        '--qp-inp-ok-bg'   : 'rgba(0,0,0,0.12)',
        '--qp-inp-err-bg'  : 'rgba(0,0,0,0.12)',
        /* 結果 */
        '--qp-safe'        : '#0a5432',
        '--qp-warning'     : '#852020',
        /* 分隔線 */
        '--qp-divider'     : 'rgba(0,0,0,0.18)',
        /* 解說 */
        '--qp-expl-color'  : 'rgba(0,0,0,0.72)',
        '--qp-expl-bg'     : 'rgba(0,0,0,0.10)',
        /* 題號 */
        '--qp-stone'       : 'rgba(0,0,0,0.42)',
        /* 觸發器 */
        '--qp-trig-bg'     : _darken(color, 0.10),
        '--qp-trig-border' : 'rgba(0,0,0,0.28)',
        '--qp-trig-color'  : '#0a0b0a',
        '--qp-trig-hbg'    : _lighten(color, 0.10),
        '--qp-trig-hborder': 'rgba(0,0,0,0.50)',
        '--qp-trig-hcolor' : '#000',
        /* 核對按鈕：深色底，主題色圖示 */
        '--qp-ck-bg'       : 'rgba(0,0,0,0.68)',
        '--qp-ck-fg'       : color,
        /* 重設按鈕 */
        '--qp-rs-bg'       : 'rgba(0,0,0,0.10)',
        '--qp-rs-fg'       : 'rgba(0,0,0,0.48)',
        '--qp-rs-bd'       : 'rgba(0,0,0,0.16)',
        /* 收合箭頭 */
        '--qp-col-fg'      : 'rgba(0,0,0,0.40)',
        '--qp-col-hfg'     : '#000',
        '--qp-col-hbg'     : _darken(color, 0.14),
      };
    } else {
      /*
       * 深色樣式（預設）：#0C0D0C 背景，主題色文字/邊框/強調
       */
      return {
        '--qp-panel-border': _rgba(color, 0.52),
        '--qp-q-color'     : color,
        '--qp-inp-border'  : _rgba(color, 0.42),
        '--qp-focus'       : color,
        '--qp-divider'     : _rgba(color, 0.32),
        '--qp-expl-color'  : _rgba(color, 0.80),
        '--qp-expl-bg'     : `color-mix(in srgb, ${color} 8%, #0C0D0C)`,
        '--qp-stone'       : _rgba(color, 0.52),
        '--qp-accent'      : color,
        /* 觸發器 */
        '--qp-trig-bg'     : C.bg1,
        '--qp-trig-border' : _rgba(color, 0.52),
        '--qp-trig-color'  : color,
        '--qp-trig-hbg'    : C.bg2,
        '--qp-trig-hborder': color,
        '--qp-trig-hcolor' : color,
        /* 核對按鈕：主題色底，深色圖示 */
        '--qp-ck-bg'       : color,
        '--qp-ck-fg'       : C.bg,
        /* 重設按鈕 */
        '--qp-rs-fg'       : _rgba(color, 0.60),
        '--qp-rs-bd'       : _rgba(color, 0.18),
        /* 收合箭頭 */
        '--qp-col-fg'      : _rgba(color, 0.48),
        '--qp-col-hfg'     : color,
      };
    }
  }

  /* ══════════════════════════════════════════
     SVG 圖示
  ══════════════════════════════════════════ */
  const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const ICON_RESET = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;

  /* ══════════════════════════════════════════
     全域樣式（只注入一次）
  ══════════════════════════════════════════ */
  const STYLE_ID = 'quiz-panel-style-v4';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = /* css */`
      .qp-wrapper {
        display      : inline-block;
        position     : relative;
        vertical-align: top;
        font-family  : system-ui, 'Segoe UI', sans-serif;
        font-size    : 1rem;
      }

      /* ── 收合觸發器 ── */
      .qp-trigger {
        display         : flex;
        align-items     : center;
        justify-content : center;
        background      : var(--qp-trig-bg,    var(--qp-bg1));
        border          : 2px solid var(--qp-trig-border, var(--qp-shell));
        border-radius   : 6px;
        cursor          : pointer;
        color           : var(--qp-trig-color,  var(--qp-shell));
        font-size       : var(--qp-fs-trig);
        user-select     : none;
        width           : var(--qp-trig-w);
        min-height      : var(--qp-trig-h);
        box-sizing      : border-box;
        transition      : background .18s, border-color .18s, color .18s;
      }
      .qp-trigger:hover,
      .qp-trigger:focus-visible {
        background   : var(--qp-trig-hbg,     var(--qp-bg2));
        border-color : var(--qp-trig-hborder,  var(--qp-accent));
        color        : var(--qp-trig-hcolor,   var(--qp-accent));
        outline      : none;
      }
      /* 緊湊：高度減半 */
      .qp-wrapper.qp-ctrig .qp-trigger {
        min-height: calc(var(--qp-trig-h) / 2);
      }

      /* ── 展開面板 ── */
      .qp-panel {
        display      : none;
        background   : var(--qp-bg);
        border       : 2px solid var(--qp-panel-border, var(--qp-shell));
        border-radius: 8px;
        overflow     : hidden;
        width        : var(--qp-panel-w);
        min-height   : var(--qp-min-h);
        box-sizing   : border-box;
      }
      .qp-panel.qp-open {
        display          : flex;
        flex-direction   : row;
        align-items      : stretch;
        animation        : qpFadeIn var(--qp-anim) ease;
        transform-origin : left center;
      }

      /* ── 題目區 ── */
      .qp-question {
        flex       : 1 1 auto;
        min-width  : 0;
        padding    : 12px 16px;
        color      : var(--qp-q-color);
        font-size  : var(--qp-fs-q);
        line-height: 1.7;
        display    : flex;
        align-items: center;
        gap        : 8px;
        border-right: 2px dashed var(--qp-divider);
        word-break : break-word;
        box-sizing : border-box;
      }
      .qp-wrapper.qp-ratio .qp-question { flex: var(--qp-ratio-l) 1 0; }

      .qp-num {
        flex-shrink: 0;
        font-size  : var(--qp-fs-num);
        color      : var(--qp-stone);
        font-weight: 700;
        min-width  : 18px;
        align-self : flex-start;
        padding-top: 2px;
      }

      /* ── 右側操作區 ── */
      .qp-right {
        flex       : 0 0 var(--qp-right-w);
        min-width  : 0;
        display    : flex;
        flex-direction: column;
        padding    : 10px;
        gap        : 6px;
        background : var(--qp-bg1);
        box-sizing : border-box;
      }
      .qp-wrapper.qp-ratio .qp-right { flex: var(--qp-ratio-r) 1 0; }

      /* ── 輸入欄 ── */
      .qp-input {
        width        : 100%;
        background   : var(--qp-bg2);
        border       : 1.5px solid var(--qp-inp-border, var(--qp-stone));
        border-radius: 4px;
        color        : var(--qp-vanilla);
        font-size    : var(--qp-fs-inp);
        padding      : 5px 8px;
        outline      : none;
        box-sizing   : border-box;
        transition   : border-color .18s, background .18s;
        resize       : vertical;
        font-family  : inherit;
        line-height  : 1.5;
      }
      .qp-input::placeholder { color: #55555a; }
      .qp-input:focus        { border-color: var(--qp-focus); }
      .qp-input.qp-correct   { border-color: var(--qp-safe);    background: var(--qp-inp-ok-bg,  #0b1a12); }
      .qp-input.qp-incorrect { border-color: var(--qp-warning); background: var(--qp-inp-err-bg, #1c0b0b); }

      /* ── 操作列（按鈕 ＋ 結果 同行）── */
      .qp-action-row {
        display    : flex;
        align-items: center;
        gap        : 6px;
        min-height : var(--qp-btn-size);
      }

      /* ── 按鈕 ── */
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

      .qp-btn-check {
        background: var(--qp-ck-bg,  var(--qp-accent));
        color     : var(--qp-ck-fg,  #fff);
      }
      .qp-btn-reset {
        background: var(--qp-rs-bg,  var(--qp-bg3));
        color     : var(--qp-rs-fg,  var(--qp-stone));
        border    : 1px solid var(--qp-rs-bd, #ffffff1a);
      }

      /* text / both 模式 */
      .qp-wrapper.qp-bstyle-text .qp-btn,
      .qp-wrapper.qp-bstyle-both .qp-btn {
        flex   : 1;
        width  : auto;
        padding: 0 8px;
        gap    : 5px;
      }
      .qp-btn-label { display: none; font-size: 0.82rem; letter-spacing: .04em; }
      .qp-wrapper.qp-bstyle-both .qp-btn-label { display: inline; }
      .qp-wrapper.qp-bstyle-text .qp-btn-label { display: inline; }

      /* ── 結果訊息（inline）── */
      .qp-result {
        flex         : 1 1 0;
        min-width    : 0;
        display      : none;
        font-size    : var(--qp-fs-res);
        font-weight  : 700;
        overflow     : hidden;
        text-overflow: ellipsis;
        white-space  : nowrap;
        line-height  : var(--qp-btn-size);
      }
      .qp-result.qp-show     { display: block; }
      .qp-result.qp-correct  { color: var(--qp-safe); }
      .qp-result.qp-incorrect{ color: var(--qp-warning); }

      /* ── 解說 ── */
      .qp-explanation {
        display    : none;
        font-size  : var(--qp-fs-expl);
        color      : var(--qp-expl-color);
        line-height: 1.6;
        padding    : 7px 9px;
        background : var(--qp-expl-bg, #120d19);
        border-left: 3px solid var(--qp-expl-color);
        border-radius: 3px;
        word-break : break-word;
      }
      .qp-explanation.qp-show { display: block; }
      .qp-explanation code {
        background   : var(--qp-bg2);
        padding      : 1px 5px;
        border-radius: 3px;
        color        : var(--qp-special, #C8DD5A);
        font-size    : 0.9em;
      }

      /* ── 收合箭頭 ── */
      .qp-collapse-btn {
        flex           : 0 0 26px;
        display        : flex;
        align-items    : center;
        justify-content: center;
        cursor         : pointer;
        color          : var(--qp-col-fg, var(--qp-stone));
        font-size      : 0.95rem;
        background     : var(--qp-bg1);
        border-left    : 1px solid #ffffff14;
        user-select    : none;
        transition     : background .18s, color .18s;
      }
      .qp-collapse-btn:hover,
      .qp-collapse-btn:focus-visible {
        background : var(--qp-col-hbg, var(--qp-bg2));
        color      : var(--qp-col-hfg, #C8DD5A);
        outline    : none;
      }

      /* ── readonly 顯示解說按鈕 ── */
      .qp-reveal-btn {
        width        : 100%;
        padding      : 6px 0;
        background   : var(--qp-bg3);
        border       : 1.5px dashed var(--qp-divider);
        border-radius: 4px;
        color        : var(--qp-stone);
        font-size    : var(--qp-fs-res);
        cursor       : pointer;
        font-family  : inherit;
        transition   : background .15s, color .15s;
      }
      .qp-reveal-btn:hover { background: var(--qp-bg2); color: var(--qp-shell); }

      /* ── 動畫 ── */
      @keyframes qpFadeIn {
        from { opacity: 0; transform: scaleX(0.9); }
        to   { opacity: 1; transform: scaleX(1); }
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════
     預設值
  ══════════════════════════════════════════ */
  const D = {
    collapseIcon:'▶', expandIcon:'◁',
    checkIcon   : ICON_CHECK, resetIcon: ICON_RESET,
    checkLabel  : '核對答案', resetLabel: '重設',
    btnStyle    : 'icon', btnSize: '30px',
    placeholder : '請輸入答案…',
    correctMessage: '✓ 正確！', incorrectMsg: '✗ 錯誤',
    caseSensitive: false, matchMode: 'exact',
    panelWidth  : '620px', ratio: '1:1', rightWidth: null,
    minHeight   : '96px',
    triggerWidth: '48px', triggerMinH: '100px',
    questionColor: C.shell, explColor: C.lavender,
    accentColor : C.indigo, dividerColor: C.stone,
    animDuration: 200,
    theme: '', themeStyle: 'dark', initSmall: false,
    fsTrigger:'1.2rem', fsQuestion:'0.96rem', fsNumber:'0.76rem',
    fsInput:'0.88rem', fsResult:'0.8rem', fsExplanation:'0.82rem',
  };

  /* ══════════════════════════════════════════
     群組登記
  ══════════════════════════════════════════ */
  const _groups = Object.create(null);
  const _timers = Object.create(null);

  function applyGroupNums(name) {
    const g = _groups[name];
    if (!g || g.noNumber) return;
    g.panels.sort((a,b) =>
      (a.$wrap.compareDocumentPosition(b.$wrap) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
    );
    let n = g.start ?? 1;
    for (const p of g.panels) { if (!p.o.skipNumber) p._applyAutoNum(n++); }
  }

  /* ══════════════════════════════════════════
     工具
  ══════════════════════════════════════════ */
  function gcfg(el, attr, key, fb) {
    if (el.hasAttribute(attr)) return el.getAttribute(attr);
    const G = window.QuizPanelConfig || {};
    if (key in G) return G[key];
    return fb !== undefined ? fb : D[key];
  }
  function parseRatio(s) {
    if (!s) return null;
    const [l,r] = String(s).split(':').map(Number);
    return (isFinite(l) && isFinite(r)) ? [l,r] : null;
  }
  function md(t) {
    if (!t) return '';
    // 先將屬性中手寫的 <br> / <br/> / <br /> 換成佔位符，
    // 跳脫 HTML 特殊字元後再還原，避免 < > 被轉成實體而失效。
    const PH = '\x00BR\x00';
    return t
      .replace(/<br\s*\/?>/gi, PH)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code>$1</code>')
      .replace(/\n/g,'<br>')
      .replace(new RegExp(PH,'g'),'<br>');
  }
  function mk(tag, cls, attrs) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (const [k,v] of Object.entries(attrs)) {
      if      (k==='html')  e.innerHTML   = v;
      else if (k==='text')  e.textContent = v;
      else if (k==='style') Object.assign(e.style, v);
      else                  e.setAttribute(k, v);
    }
    return e;
  }

  class QuizPanel {

    constructor(src) {
      this._src = src;
      this._isOpen = false;
      this._autoNum = null;
      this._numEl   = null;
      this._readCfg();
      this._build();
      this._bindEvents();
      if (this.o.group) this._registerGroup();
    }

    _readCfg() {
      const e = this._src;
      const G = window.QuizPanelConfig || {};
      const r = (attr, key, fb) => gcfg(e, attr, key, fb);

      let ratioStr=null, rightWidth=null;
      if      (e.hasAttribute('ratio'))       ratioStr  = e.getAttribute('ratio');
      else if (e.hasAttribute('right-width')) rightWidth= e.getAttribute('right-width');
      else if (G.ratio!=null)                 ratioStr  = G.ratio;
      else if (G.rightWidth!=null)            rightWidth= G.rightWidth;
      else                                    ratioStr  = D.ratio;

      const btnStyle = r('btn-style','btnStyle',D.btnStyle);

      this.o = {
        question   : e.getAttribute('question')    || '（未設定題目）',
        answer     : e.getAttribute('answer')      || '',
        explanation: e.getAttribute('explanation') || '',
        placeholder: r('placeholder',      'placeholder',   D.placeholder),
        checkLabel : r('check-label',      'checkLabel',    D.checkLabel),
        resetLabel : r('reset-label',      'resetLabel',    D.resetLabel),
        checkIcon  : r('check-icon',       'checkIcon',     D.checkIcon),
        resetIcon  : r('reset-icon',       'resetIcon',     D.resetIcon),
        btnStyle,
        btnSize    : r('btn-size',         'btnSize',       D.btnSize),
        correctMsg : r('correct-message',  'correctMessage',D.correctMessage),
        incorrectMsg:r('incorrect-message','incorrectMsg',  D.incorrectMsg),
        collapseIcon:r('collapse-icon',    'collapseIcon',  D.collapseIcon),
        expandIcon : r('expand-icon',      'expandIcon',    D.expandIcon),
        caseSensitive: r('case-sensitive','caseSensitive',String(D.caseSensitive))==='true',
        matchMode  : r('match-mode',       'matchMode',     D.matchMode),
        panelWidth : r('panel-width',      'panelWidth',    D.panelWidth),
        minHeight  : r('min-height',       'minHeight',     D.minHeight),
        triggerW   : r('trigger-width',    'triggerWidth',  D.triggerWidth),
        triggerH   : r('trigger-min-height','triggerMinH',  D.triggerMinH),
        animDur    : r('anim-duration',    'animDuration',  D.animDuration),
        ratioStr, rightWidth,
        qColor     : r('question-color',   'questionColor', D.questionColor),
        eColor     : r('explanation-color','explColor',     D.explColor),
        accent     : r('accent-color',     'accentColor',   D.accentColor),
        divider    : r('divider-color',    'dividerColor',  D.dividerColor),

        theme      : r('theme',            'theme',         D.theme),
        themeStyle : r('theme-style',      'themeStyle',    D.themeStyle),
        initSmall: e.hasAttribute('init-small') ||
                   (G.initSmall === true),

        fsTrig : r('fs-trigger',    'fsTrigger',    D.fsTrigger),
        fsQ    : r('fs-question',   'fsQuestion',   D.fsQuestion),
        fsNum  : r('fs-number',     'fsNumber',     D.fsNumber),
        fsInp  : r('fs-input',      'fsInput',      D.fsInput),
        fsRes  : r('fs-result',     'fsResult',     D.fsResult),
        fsExpl : r('fs-explanation','fsExplanation',D.fsExplanation),

        showNum      : e.getAttribute('show-number') || '',
        inputType    : e.getAttribute('input-type')  || 'text',
        inputRows    : parseInt(e.getAttribute('input-rows') || '2'),
        startOpen    : (e.getAttribute('start-open')     ||'false')==='true',
        readonlyAnswer:(e.getAttribute('readonly-answer')||'false')==='true',
        group        : e.getAttribute('group')        || '',
        groupStart   : e.hasAttribute('group-start')
                         ? parseInt(e.getAttribute('group-start'),10) : null,
        groupNoNumber: e.hasAttribute('group-no-number'),
        skipNumber   : e.hasAttribute('skip-number'),
      };
    }

    _build() {
      const o = this.o;
      const ratio = parseRatio(o.ratioStr);

      this.$wrap = mk('div','qp-wrapper');
      if (ratio)                      this.$wrap.classList.add('qp-ratio');
      if (o.btnStyle==='text')        this.$wrap.classList.add('qp-bstyle-text');
      else if (o.btnStyle==='both')   this.$wrap.classList.add('qp-bstyle-both');
      if (o.initSmall)                this.$wrap.classList.add('qp-ctrig');

      const v = [
        `--qp-bg:${C.bg}`,`--qp-bg1:${C.bg1}`,`--qp-bg2:${C.bg2}`,`--qp-bg3:${C.bg3}`,
        `--qp-shell:${C.shell}`,`--qp-accent:${o.accent}`,`--qp-divider:${o.divider}`,
        `--qp-q-color:${o.qColor}`,`--qp-expl-color:${o.eColor}`,
        `--qp-safe:${C.safe}`,`--qp-warning:${C.warning}`,
        `--qp-special:#C8DD5A`,`--qp-stone:${C.stone}`,
        `--qp-focus:${C.focus}`,`--qp-vanilla:${C.vanilla}`,
        `--qp-panel-w:${o.panelWidth}`,`--qp-min-h:${o.minHeight}`,
        `--qp-trig-w:${o.triggerW}`,`--qp-trig-h:${o.triggerH}`,
        `--qp-anim:${o.animDur}ms`,`--qp-btn-size:${o.btnSize}`,
        `--qp-fs-trig:${o.fsTrig}`,`--qp-fs-q:${o.fsQ}`,
        `--qp-fs-num:${o.fsNum}`,`--qp-fs-inp:${o.fsInp}`,
        `--qp-fs-res:${o.fsRes}`,`--qp-fs-expl:${o.fsExpl}`,
      ];
      if (ratio)        { v.push(`--qp-ratio-l:${ratio[0]}`,`--qp-ratio-r:${ratio[1]}`); }
      else if (o.rightWidth) { v.push(`--qp-right-w:${o.rightWidth}`); }
      else              { v.push(`--qp-right-w:220px`); }

      this.$wrap.style.cssText = v.join(';');

      if (o.theme) {
        const tv = _themeVars(o.theme, o.themeStyle);
        for (const [k, val] of Object.entries(tv)) {
          this.$wrap.style.setProperty(k, val);
        }
      }

      /* ── 觸發器 ── */
      this.$trigger = mk('div','qp-trigger',{
        role:'button', tabindex:'0',
        html: o.collapseIcon,
      });

      /* ── 面板 ── */
      this.$panel = mk('div','qp-panel',{
        role:'region','aria-label':'面板',
      });

      /* ── 題目區 ── */
      this.$question = mk('div','qp-question');
      if (o.showNum) {
        this._numEl = mk('span','qp-num',{text: o.showNum+'.'});
        this.$question.appendChild(this._numEl);
      }
      this._qTextEl = mk('span');
      this._qTextEl.innerHTML = md(o.question);
      this.$question.appendChild(this._qTextEl);

      this.$right = mk('div','qp-right');

      if (!o.readonlyAnswer) {
        this.$input = (o.inputType==='textarea')
          ? mk('textarea','qp-input',{
              placeholder:o.placeholder, rows:String(o.inputRows),
              'aria-label':'答案輸入欄位',
            })
          : mk('input','qp-input',{
              type:'text', placeholder:o.placeholder,
              'aria-label':'答案輸入欄位',
            });
        this.$right.appendChild(this.$input);

        this.$actionRow = mk('div','qp-action-row');
        this.$btnCheck  = this._makeBtn('check');
        this.$btnReset  = this._makeBtn('reset');
        this.$result    = mk('div','qp-result',{role:'status','aria-live':'polite'});
        this.$actionRow.appendChild(this.$btnCheck);
        this.$actionRow.appendChild(this.$btnReset);
        this.$actionRow.appendChild(this.$result);
        this.$right.appendChild(this.$actionRow);
      } else {
        this.$revealBtn = mk('button','qp-reveal-btn',{type:'button',text:'▼ 顯示解說'});
        this.$right.appendChild(this.$revealBtn);
        this.$result = null;
        this.$input  = null;
      }

      if (o.explanation) {
        this.$expl = mk('div','qp-explanation');
        this.$expl.innerHTML = md(o.explanation);
        this.$right.appendChild(this.$expl);
      } else { this.$expl = null; }

      this.$collapseBtn = mk('div','qp-collapse-btn',{
        role:'button', tabindex:'0',
        title:'收合','aria-label':'收合',
        html: o.expandIcon,
      });

      this.$panel.appendChild(this.$question);
      this.$panel.appendChild(this.$right);
      this.$panel.appendChild(this.$collapseBtn);
      this.$wrap.appendChild(this.$trigger);
      this.$wrap.appendChild(this.$panel);
      this.$wrap.__qp = this;
      this._src.replaceWith(this.$wrap);
      if (o.startOpen) this.open();
    }

    _makeBtn(type) {
      const o   = this.o;
      const icon = type==='check' ? o.checkIcon : o.resetIcon;
      const lbl  = type==='check' ? o.checkLabel : o.resetLabel;
      const btn  = mk('button',`qp-btn qp-btn-${type}`,{
        type:'button', title:lbl, 'aria-label':lbl,
      });
      if (o.btnStyle==='text') {
        btn.textContent = lbl;
      } else if (o.btnStyle==='both') {
        const ico = mk('span'); ico.innerHTML = icon;
        const txt = mk('span','qp-btn-label',{text:lbl});
        btn.appendChild(ico); btn.appendChild(txt);
      } else {
        btn.innerHTML = icon;   // icon（預設）
      }
      return btn;
    }

    _registerGroup() {
      const name = this.o.group;
      if (!_groups[name]) _groups[name]={panels:[],start:null,noNumber:false};
      const g = _groups[name];
      g.panels.push(this);
      if (this.o.groupStart!=null && g.start==null) g.start=this.o.groupStart;
      if (this.o.groupNoNumber) g.noNumber=true;
      clearTimeout(_timers[name]);
      _timers[name] = setTimeout(()=>applyGroupNums(name),0);
    }
    _applyAutoNum(n) {
      this._autoNum = n;
      if (this.o.showNum) return;
      if (!this._numEl) {
        this._numEl = mk('span','qp-num',{text:n+'.'});
        this.$question.insertBefore(this._numEl, this._qTextEl);
      } else { this._numEl.textContent = n+'.'; }
    }

    _match(u) {
      const {answer,caseSensitive,matchMode} = this.o;
      if (!answer) return false;
      const n = s=>caseSensitive?s.trim():s.trim().toLowerCase();
      const ua=n(u);
      if (matchMode==='contains')
        return answer.split('|').some(a=>{const c=n(a);return c&&(c.includes(ua)||ua.includes(c));});
      if (matchMode==='regex')
        try{return new RegExp(n(answer),caseSensitive?'':'i').test(ua);}catch{return false;}
      return answer.split('|').map(a=>n(a)).includes(ua);
    }

    _bindEvents() {
      this.$trigger.addEventListener('click',()=>this.open());
      this.$trigger.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();this.open();}
      });
      this.$collapseBtn.addEventListener('click',()=>this.close());
      this.$collapseBtn.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();this.close();}
      });
      if (!this.o.readonlyAnswer) {
        this.$btnCheck.addEventListener('click',()=>this.check());
        this.$btnReset.addEventListener('click',()=>this.reset());
        if (this.o.inputType!=='textarea')
          this.$input.addEventListener('keydown',e=>{if(e.key==='Enter')this.check();});
      } else if (this.$revealBtn) {
        this.$revealBtn.addEventListener('click',()=>{
          if(!this.$expl) return;
          const show=!this.$expl.classList.contains('qp-show');
          this.$expl.classList.toggle('qp-show',show);
          this.$revealBtn.textContent=show?'▲ 隱藏解說':'▼ 顯示解說';
        });
      }
    }

    /* ─ 公開 API ─────────────────────────── */
    open() {
      this.$trigger.style.display='none';
      this.$panel.classList.add('qp-open');
      this._isOpen=true;
      if(this.$input) setTimeout(()=>this.$input.focus(),50);
      this._emit('quiz-panel-open',{});
    }
    close() {
      this.$panel.classList.remove('qp-open');
      this.$trigger.style.display='';
      this._isOpen=false;
      this._emit('quiz-panel-close',{});
    }
    check() {
      if(!this.$input) return;
      const ua=this.$input.value, ok=this._match(ua);
      this.$input.classList.remove('qp-correct','qp-incorrect');
      this.$input.classList.add(ok?'qp-correct':'qp-incorrect');
      if(this.$result){
        this.$result.className=`qp-result qp-show ${ok?'qp-correct':'qp-incorrect'}`;
        this.$result.textContent=ok?this.o.correctMsg:this.o.incorrectMsg;
      }
      if(this.$expl) this.$expl.classList.add('qp-show');
      this._emit('quiz-panel-check',{answer:ua,correct:ok,expected:this.o.answer});
    }
    reset() {
      if(this.$input){this.$input.value='';this.$input.classList.remove('qp-correct','qp-incorrect');this.$input.focus();}
      if(this.$result){this.$result.className='qp-result';this.$result.textContent='';}
      if(this.$expl) this.$expl.classList.remove('qp-show');
      this._emit('quiz-panel-reset',{});
    }
    isOpen()         { return this._isOpen; }
    getGroupNumber() { return this._autoNum; }
    setQuestion(t)   { this.o.question=t; this._qTextEl.innerHTML=md(t); }
    setAnswer(t)     { this.o.answer=t; }
    setExplanation(t){ this.o.explanation=t; if(this.$expl) this.$expl.innerHTML=md(t); }
    _emit(name,detail){ this.$wrap.dispatchEvent(new CustomEvent(name,{bubbles:true,detail})); }

    static getGroup(name)        { return (_groups[name]?.panels||[]).slice(); }
    static resetGroup(name)      { QuizPanel.getGroup(name).forEach(p=>p.reset()); }
    static renumberGroup(name,n) { if(_groups[name]){_groups[name].start=n;applyGroupNums(name);} }

    static collectAnswers(options = {}) {
      const { onlyAnswered = false, group: filterGroup = null } = options;
      const results = [];
      let index = 0;

      document.querySelectorAll('.qp-wrapper').forEach(wrapper => {
        const p = wrapper.__qp;
        if (!p) return;
        if (filterGroup && p.o.group !== filterGroup) return;

        const userInput = p.$input ? p.$input.value : '';
        if (onlyAnswered && !userInput.trim()) return;

        const numLabel = p._autoNum != null
          ? String(p._autoNum)
          : (p.o.showNum || null);

        results.push({
          index,
          number   : numLabel,
          group    : p.o.group || null,
          question : p.o.question,
          userInput,
          expected : p.o.expected ?? p.o.answer,
          correct  : p.o.readonlyAnswer ? null : p._match(userInput),
          isOpen   : p.isOpen(),
        });
        index++;
      });

      return results;
    }

    static collectAnswersJSON(options = {}) {
      return JSON.stringify(QuizPanel.collectAnswers(options), null, 2);
    }
  }

  function initAll(root) {
    (root||document).querySelectorAll('[data-quiz-panel]').forEach(node=>{
      if(!node._qpInit){node._qpInit=true; new QuizPanel(node);}
    });
  }
  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',()=>initAll())
    : initAll();

  new MutationObserver(ms=>{
    for(const m of ms) for(const n of m.addedNodes){
      if(n.nodeType!==1) continue;
      if(n.matches?.('[data-quiz-panel]')&&!n._qpInit){n._qpInit=true;new QuizPanel(n);}
      n.querySelectorAll?.('[data-quiz-panel]').forEach(x=>{if(!x._qpInit){x._qpInit=true;new QuizPanel(x);}});
    }
  }).observe(document.body,{childList:true,subtree:true});

  window.QuizPanel = QuizPanel;
})();

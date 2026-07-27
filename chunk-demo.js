/**
 * chunk-demo.js  v3
 *
 * 新增屬性（v3）：
 *   show-dots       true|false          圓點顯示開關，預設 true
 *   width           CSS 寬度字串        整體元件寬度，例如 "600px" / "100%"
 *   dropdown-width  CSS 寬度字串        下拉選單固定寬度，例如 "320px"
 *   button-width    CSS 寬度字串        語塊按鈕最小寬度，例如 "140px"
 *   level-colors    逗號分隔色彩字串    Level 1,2,3 圓點與左側線條顏色
 *                   例：level-colors="#40C99A, #DECA4B, #C3A5E5"
 *   mask-mode       true|false          遮罩填空模式，預設 false
 *                   開啟後語塊按鈕初始顯示遮罩，使用者點選 Level 後才揭露
 *
 * data-config / ChunkDemoConfig 新增對應鍵：
 *   showDots        boolean  (預設 true)
 *   maskMode        boolean  (預設 false)
 *   maskColor       string   遮罩底色 (預設 '#252625')
 *   width           string   同屬性
 *   dropdownWidth   string   同屬性
 *   buttonWidth     string   同屬性
 *
 * 完整向下相容 v2 的 <cd-chunk>/<cd-level> 標籤結構。
 */

(function (win, doc) {
  'use strict';

  /* ═══════════════════════════════════════════
     全域樣式（只注入一次）
  ═══════════════════════════════════════════ */
  const CSS_ID = '__chunk-demo-v3__';
  if (!doc.getElementById(CSS_ID)) {
    const s = doc.createElement('style');
    s.id = CSS_ID;
    s.textContent = `
/* 資料載體元素永遠隱藏 */
cd-chunk, cd-level { display: none !important; }

chunk-demo { display: block; }

/* ── 句子框 ─────────────────────────────── */
.cd-bar {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 4px 8px; padding: 16px 22px;
  border-radius: 12px; border: 1px solid;
  font-size: 1.1rem; line-height: 2.2;
}

/* ── 語塊錨點（下拉定位容器）────────────── */
.cd-anchor { position: relative; display: inline-flex; }

/* ── 語塊按鈕 ───────────────────────────── */
.cd-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px 4px 9px;
  border-radius: 7px;
  border: 1.5px solid transparent;
  font-family: inherit; font-size: 0.95rem; line-height: 1.4;
  cursor: pointer;
  transition: filter .16s ease, box-shadow .16s ease;
  white-space: nowrap;
}
.cd-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.cd-btn:hover         { filter: brightness(1.2); }
.cd-btn.is-open       { box-shadow: 0 0 0 3px rgba(255,255,255,.12); filter: brightness(1.18); }

.cd-b-icon { font-size: .88em; }
.cd-b-text { font-weight: 500; }
.cd-b-arr  { font-size: .68em; opacity: .55; transition: transform .18s ease; margin-left: 1px; }
.cd-btn.is-open .cd-b-arr { transform: rotate(180deg); }

/* ── 遮罩模式（mask-mode）────────────────── */
/*
  is-masked 套用在 .cd-btn 上：
    - .cd-b-text 以深色背景 + color:transparent 遮蓋文字
    - 文字仍在 DOM 中（輔助技術可讀），視覺上不可見
    - 點選 Level 後 is-masked 移除，文字顯現
*/
.cd-btn.is-masked .cd-b-text {
  background   : var(--cd-mask-bg, #252625);
  color        : transparent;
  border-radius: 4px;
  padding      : 0 10px;
  min-width    : 48px;
  display      : inline-block;
  user-select  : none;
  transition   : none;
}
/* hover 時遮罩略微提亮，讓使用者知道可點擊 */
.cd-btn.is-masked:hover .cd-b-text {
  background: color-mix(in srgb, var(--cd-mask-bg, #252625) 80%, white);
}
/* 下拉開啟中，遮罩維持（直到選取 Level 才揭露）*/
.cd-btn.is-masked.is-open {
  box-shadow: 0 0 0 3px rgba(255,255,255,.12);
}

/* ── 下拉選單 ───────────────────────────── */
.cd-dd {
  position: absolute; top: calc(100% + 6px); left: 0;
  z-index: 9999; border: 1px solid; border-radius: 10px; overflow: hidden;
  box-shadow: 0 16px 44px rgba(0,0,0,.72);
  min-width: 240px; max-width: 420px;
  opacity: 0; transform: translateY(-5px) scale(.985);
  pointer-events: none;
  transition: opacity .17s ease, transform .17s ease;
}
.cd-dd.is-open { opacity: 1; transform: none; pointer-events: auto; }

/* 下拉標題（僅在 chunk.label 非空時渲染）*/
.cd-dd-head {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 13px 7px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.cd-h-lbl {
  font-size: .67rem; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  color: #95BDD7;
}

/* Level 列 */
.cd-lv {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  cursor: pointer; transition: background .12s; position: relative;
}
.cd-lv:last-child { border-bottom: none; }
.cd-lv:hover      { background: rgba(255,255,255,.04); }
.cd-lv.is-sel     { background: rgba(255,255,255,.07); }
.cd-lv.is-sel::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--lc, #C6C7BD); border-radius: 0 2px 2px 0;
}

/* 圓點（show-dots=false 時不渲染此元素，無需 CSS 隱藏）*/
.cd-lv-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--lc, #C6C7BD); flex-shrink: 0; margin-top: 5px;
}

.cd-lv-text { font-size: .91rem; line-height: 1.5; color: #9da09a; white-space: normal; }
.cd-lv.is-sel .cd-lv-text { color: #dde0d8; }

/* ── 整句預覽 ───────────────────────────── */
.cd-preview {
  margin-top: 9px; padding: 7px 12px;
  border-left: 3px solid var(--pvb, #C8DD5A);
  border-radius: 0 6px 6px 0;
  background: var(--pvbg, rgba(255,255,255,.035));
}
.cd-pv-text { font-size: .89rem; font-style: italic; color: var(--pvt, #7a8078); }
    `.trim();
    (doc.head || doc.documentElement).appendChild(s);
  }

  /* ═══════════════════════════════════════════
     預設值
  ═══════════════════════════════════════════ */
  const DEFAULTS = {
    themes: {
      shell:    { border: '#C6C7BD', text: '#C6C7BD', bg: 'rgba(198,199,189,.09)' },
      lavender: { border: '#C3A5E5', text: '#C3A5E5', bg: 'rgba(195,165,229,.09)' },
      special:  { border: '#C8DD5A', text: '#C8DD5A', bg: 'rgba(200,221,90,.09)'  },
      warning:  { border: '#F08080', text: '#F08080', bg: 'rgba(240,128,128,.09)' },
      salmon:   { border: '#E5C3B3', text: '#E5C3B3', bg: 'rgba(229,195,179,.09)' },
      sky:      { border: '#08A9D1', text: '#08A9D1', bg: 'rgba(8,169,209,.09)'   },
      safe:     { border: '#40C99A', text: '#40C99A', bg: 'rgba(64,201,154,.09)'  },
      vanilla:  { border: '#DBEDD8', text: '#DBEDD8', bg: 'rgba(219,237,216,.09)' },
      focus:    { border: '#A0CF72', text: '#A0CF72', bg: 'rgba(160,207,114,.09)' },
      yellow:   { border: '#DECA4B', text: '#DECA4B', bg: 'rgba(222,202,75,.09)'  },
      info:     { border: '#4285EB', text: '#4285EB', bg: 'rgba(66,133,235,.09)'  },
      stone:    { border: '#95BDD7', text: '#95BDD7', bg: 'rgba(149,189,215,.09)' },
      indigo:   { border: '#7B6CF0', text: '#7B6CF0', bg: 'rgba(123,108,240,.09)' },
      pink:     { border: '#FFB3D9', text: '#FFB3D9', bg: 'rgba(255,179,217,.09)' },
      orange:   { border: '#EDA109', text: '#EDA109', bg: 'rgba(237,161,9,.09)'   },
    },
    defaultTheme:       'special',
    chunkBorderWidth:   '1.5px',
    chunkBorderStyle:   'solid',
    levelDotColors:     { 1: '#40C99A', 2: '#DECA4B', 3: '#C3A5E5' },
    fixedTextColor:     '#C6C7BD',
    sentenceBg:         '#161816',
    sentenceBorder:     '#222422',
    dropdownBg:         '#1d1f1d',
    dropdownBorder:     '#2c2e2c',
    previewBorderColor: null,
    previewTextColor:   null,
    previewBg:          null,
    showPreview:        false,
    /* ── v3 新增 ──────────────────────────── */
    showDots:           true,
    maskMode:           false,
    maskColor:          '#252625',
    width:              null,
    dropdownWidth:      null,
    buttonWidth:        null,
  };

  /* ═══════════════════════════════════════════
     Web Component
  ═══════════════════════════════════════════ */
  class ChunkDemo extends HTMLElement {

    static get observedAttributes() {
      return [
        /* v2 */
        'sentence', 'chunks', 'show-preview',
        'theme', 'border-width', 'border-style', 'data-config',
        /* v3 新增 */
        'show-dots', 'width', 'dropdown-width', 'button-width',
        'level-colors', 'mask-mode',
      ];
    }

    constructor() {
      super();
      this._state    = [];
      this._chunks   = [];
      this._sent     = '';
      this._openId   = null;
      this._btns     = {};
      this._dds      = {};
      this._ready    = false;
      this._revealed = new Set();   /* v3: 已揭露的 chunk id（mask-mode 用）*/
      this._docClick = () => this._close();
      this._docKey   = e => { if (e.key === 'Escape') this._close(); };
    }

    connectedCallback() {
      doc.addEventListener('click',   this._docClick);
      doc.addEventListener('keydown', this._docKey);
      setTimeout(() => { this._ready = true; this._init(); }, 0);
    }

    disconnectedCallback() {
      doc.removeEventListener('click',   this._docClick);
      doc.removeEventListener('keydown', this._docKey);
    }

    attributeChangedCallback() {
      if (this.isConnected && this._ready) this._init();
    }

    /* ── 設定解析 ─────────────────────────── */
    _cfg() {
      const G = win.ChunkDemoConfig || {};
      let E = {};
      try { E = JSON.parse(this.getAttribute('data-config') || '{}'); } catch {}

      const cfg = {
        ...DEFAULTS, ...G, ...E,
        themes        : { ...DEFAULTS.themes,         ...(G.themes         || {}), ...(E.themes         || {}) },
        levelDotColors: { ...DEFAULTS.levelDotColors, ...(G.levelDotColors || {}), ...(E.levelDotColors || {}) },
      };

      /* 主題 */
      const name  = this.getAttribute('theme') || cfg.defaultTheme || 'special';
      cfg._theme  = cfg.themes[name] || cfg.themes.special || DEFAULTS.themes.special;

      /* v2 屬性覆蓋 */
      if (this.getAttribute('border-width')) cfg.chunkBorderWidth = this.getAttribute('border-width');
      if (this.getAttribute('border-style')) cfg.chunkBorderStyle = this.getAttribute('border-style');

      /* v3：level-colors 屬性 → 覆蓋 levelDotColors */
      const lcAttr = this.getAttribute('level-colors');
      if (lcAttr) {
        lcAttr.split(',').forEach((color, i) => {
          const c = color.trim();
          if (c) cfg.levelDotColors[i + 1] = c;
        });
      }

      /* v3：show-dots */
      const sdAttr = this.getAttribute('show-dots');
      if (sdAttr !== null) cfg.showDots = sdAttr !== 'false';

      /* v3：寬度屬性 */
      if (this.getAttribute('width'))          cfg.width         = this.getAttribute('width');
      if (this.getAttribute('dropdown-width')) cfg.dropdownWidth = this.getAttribute('dropdown-width');
      if (this.getAttribute('button-width'))   cfg.buttonWidth   = this.getAttribute('button-width');

      /* v3：mask-mode */
      const mmAttr = this.getAttribute('mask-mode');
      if (mmAttr !== null) cfg.maskMode = mmAttr === 'true';

      /* 衍生值 */
      cfg._pvColor   = cfg.previewBorderColor || cfg._theme.border;
      cfg._maskColor = cfg.maskColor || DEFAULTS.maskColor;

      return cfg;
    }

    /* ── 解析子元素 ───────────────────────── */
    _parseChildren(cdChunks) {
      return cdChunks.map((el, i) => {
        const rawId    = el.getAttribute('id');
        const cdLevels = Array.from(el.querySelectorAll('cd-level'));
        return {
          id          : rawId !== null ? parseInt(rawId) : i,
          icon        : el.getAttribute('icon')          || '',
          label       : el.getAttribute('label')         ?? '',
          currentLevel: parseInt(el.getAttribute('current-level') || '1'),
          levels      : cdLevels.map((lv, j) => ({
            level: parseInt(lv.getAttribute('level') || String(j + 1)),
            text : lv.innerHTML.trim(),
          })),
        };
      });
    }

    /* ── 初始化 ───────────────────────────── */
    _init() {
      const cdChunks = Array.from(this.querySelectorAll(':scope > cd-chunk'));
      let chunks;

      if (cdChunks.length > 0) {
        chunks = this._parseChildren(cdChunks);
      } else {
        try { chunks = JSON.parse(this.getAttribute('chunks') || '[]'); } catch { chunks = []; }
      }

      this._sent   = this.getAttribute('sentence') || '';
      this._chunks = chunks;

      const prev  = this._state;
      this._state = chunks.map(c => {
        const p = prev.find(s => s.id === c.id);
        return { id: c.id, level: p ? p.level : (c.currentLevel || 1) };
      });

      /* v3：重設揭露狀態（內容更換時全部重新遮罩）*/
      this._revealed = new Set();
      this._openId   = null;
      this._draw();
    }

    /* ── 渲染 ─────────────────────────────── */
    _draw() {
      const srcNodes = Array.from(this.querySelectorAll(':scope > cd-chunk'));
      this.innerHTML = '';
      this._btns     = {};
      this._dds      = {};
      srcNodes.forEach(n => this.appendChild(n));

      const cfg = this._cfg();

      /* v3：元件寬度 */
      if (cfg.width) {
        this.style.width = cfg.width;
      } else {
        this.style.removeProperty('width');
      }

      /* v3：遮罩背景色 CSS 變數 */
      if (cfg.maskMode) {
        this.style.setProperty('--cd-mask-bg', cfg._maskColor);
      } else {
        this.style.removeProperty('--cd-mask-bg');
      }

      /* 句子框 */
      const bar = doc.createElement('div');
      bar.className        = 'cd-bar';
      bar.style.background  = cfg.sentenceBg;
      bar.style.borderColor = cfg.sentenceBorder;

      this._sent.split(/(\{\d+\})/).forEach(part => {
        const m = part.match(/^\{(\d+)\}$/);
        if (m) {
          const chunk = this._chunks.find(c => c.id === +m[1]);
          if (chunk) bar.appendChild(this._mkAnchor(chunk, cfg));
        } else if (part) {
          const sp        = doc.createElement('span');
          sp.style.color  = cfg.fixedTextColor;
          sp.textContent  = part;
          bar.appendChild(sp);
        }
      });
      this.appendChild(bar);

      /* 整句預覽（選用）*/
      const showPrev =
        this.getAttribute('show-preview') === 'true' ||
        (this.getAttribute('show-preview') === null && cfg.showPreview);

      if (showPrev) {
        const pv = doc.createElement('div');
        pv.className = 'cd-preview';
        pv.style.setProperty('--pvb', cfg._pvColor);
        if (cfg.previewTextColor) pv.style.setProperty('--pvt',  cfg.previewTextColor);
        if (cfg.previewBg)        pv.style.setProperty('--pvbg', cfg.previewBg);

        const t       = doc.createElement('div');
        t.className   = 'cd-pv-text';
        t.innerHTML   = this._full();
        pv.appendChild(t);
        this.appendChild(pv);
      }
    }

    /* ── 建立語塊錨點（按鈕 + 下拉）────────── */
    _mkAnchor(chunk, cfg) {
      const st    = this._state.find(s => s.id === chunk.id) || { level: 1 };
      const lvNum = st.level;
      const lvD   = chunk.levels.find(l => l.level === lvNum) || chunk.levels[0];
      const th    = cfg._theme;
      const bw    = cfg.chunkBorderWidth || '1.5px';
      const bs    = cfg.chunkBorderStyle || 'solid';

      /* v3：判斷是否需要遮罩 */
      const isMasked = cfg.maskMode && !this._revealed.has(chunk.id);

      const anchor     = doc.createElement('div');
      anchor.className = 'cd-anchor';

      /* 按鈕 */
      const btn     = doc.createElement('button');
      btn.className = 'cd-btn' + (isMasked ? ' is-masked' : '');
      btn.style.cssText =
        `border-color:${th.border};border-width:${bw};border-style:${bs};` +
        `color:${th.text};background:${th.bg};`;

      /* v3：button-width */
      if (cfg.buttonWidth) btn.style.minWidth = cfg.buttonWidth;

      /* icon（選用）*/
      if (chunk.icon) {
        const ic     = doc.createElement('span');
        ic.className = 'cd-b-icon';
        ic.textContent = chunk.icon;
        btn.appendChild(ic);
      }

      /* 文字（遮罩時視覺隱藏，但仍在 DOM 供輔助技術讀取）*/
      const tx     = doc.createElement('span');
      tx.className = 'cd-b-text';
      tx.innerHTML  = lvD?.text ?? '—';
      btn.appendChild(tx);

      /* 箭頭指示器 */
      const arr    = doc.createElement('span');
      arr.className   = 'cd-b-arr';
      arr.textContent = '▾';
      arr.setAttribute('aria-hidden', 'true');
      btn.appendChild(arr);

      btn.addEventListener('click', e => { e.stopPropagation(); this._toggle(chunk.id); });
      this._btns[chunk.id] = btn;
      anchor.appendChild(btn);

      /* 下拉選單 */
      const dd = this._mkDD(chunk, cfg, lvNum);
      this._dds[chunk.id] = dd;
      anchor.appendChild(dd);

      return anchor;
    }

    /* ── 建立下拉選單 ─────────────────────── */
    _mkDD(chunk, cfg, currentLevel) {
      const dd     = doc.createElement('div');
      dd.className = 'cd-dd';
      dd.style.background  = cfg.dropdownBg;
      dd.style.borderColor = cfg.dropdownBorder;

      /* v3：dropdown-width */
      if (cfg.dropdownWidth) {
        dd.style.minWidth = cfg.dropdownWidth;
        dd.style.maxWidth = cfg.dropdownWidth;
      }

      /* 標題（label 非空才渲染）*/
      const lbl = (typeof chunk.label === 'string') ? chunk.label.trim() : '';
      if (lbl) {
        const hd     = doc.createElement('div');
        hd.className = 'cd-dd-head';
        if (chunk.icon) {
          const ic     = doc.createElement('span');
          ic.textContent = chunk.icon;
          hd.appendChild(ic);
        }
        const lb     = doc.createElement('span');
        lb.className = 'cd-h-lbl';
        lb.textContent = lbl;
        hd.appendChild(lb);
        dd.appendChild(hd);
      }

      /* Level 列 */
      chunk.levels.forEach(lv => {
        const dotC  = cfg.levelDotColors[lv.level] || '#C6C7BD';
        const isSel = lv.level === currentLevel;

        const row     = doc.createElement('div');
        row.className = 'cd-lv' + (isSel ? ' is-sel' : '');
        row.style.setProperty('--lc', dotC);

        /* v3：show-dots — false 時完全不渲染圓點元素 */
        if (cfg.showDots !== false) {
          const dot     = doc.createElement('span');
          dot.className = 'cd-lv-dot';
          row.appendChild(dot);
        }

        const text     = doc.createElement('div');
        text.className = 'cd-lv-text';
        text.innerHTML = lv.text;
        row.appendChild(text);

        row.addEventListener('click', e => { e.stopPropagation(); this._pick(chunk.id, lv.level); });
        dd.appendChild(row);
      });

      return dd;
    }

    /* ── 開關下拉 ─────────────────────────── */
    _toggle(id) {
      if (this._openId === id) { this._close(); return; }
      this._close();
      this._openId = id;
      this._btns[id]?.classList.add('is-open');
      const dd = this._dds[id];
      if (!dd) return;
      dd.classList.add('is-open');
      requestAnimationFrame(() => {
        const r       = dd.getBoundingClientRect();
        dd.style.left  = r.right > win.innerWidth - 8 ? 'auto' : '0';
        dd.style.right = r.right > win.innerWidth - 8 ? '0'    : 'auto';
      });
    }

    /* ── 關閉下拉 ─────────────────────────── */
    _close() {
      if (this._openId === null) return;
      this._btns[this._openId]?.classList.remove('is-open');
      this._dds[this._openId]?.classList.remove('is-open');
      this._openId = null;
    }

    /* ── 選取 Level ───────────────────────── */
    _pick(id, level) {
      const st = this._state.find(s => s.id === id);
      if (st) st.level = level;
      /* v3：選取後標記為已揭露（mask-mode 下移除遮罩）*/
      this._revealed.add(id);
      this._close();
      this._draw();
    }

    /* ── 組合整句 ─────────────────────────── */
    _full() {
      let result = this._sent;
      this._chunks.forEach(c => {
        const lvNum = (this._state.find(st => st.id === c.id) || {}).level || 1;
        const lvD   = c.levels.find(l => l.level === lvNum) || c.levels[0];
        result = result.replace(`{${c.id}}`, lvD?.text ?? '…');
      });
      return result;
    }
  }

  if (!customElements.get('chunk-demo')) {
    customElements.define('chunk-demo', ChunkDemo);
  }

}(window, document));

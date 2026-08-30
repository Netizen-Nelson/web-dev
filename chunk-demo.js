(function (win, doc) {
  'use strict';
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
  gap: 4px 8px; padding: 16px 22px 8px;
  border-radius: 12px; border: 1px solid;
  font-size: 1.1rem; line-height: 2.2;
}

/* ── 語塊錨點（下拉定位容器）────────────── */
.cd-anchor { position: relative; display: inline-flex; align-items: center; }

/*
  長語塊獨佔整行：
  cd-anchor-grp  = 錨點 + 緊接標點的包裝層（同為直接 flex 子項）
  cd-anchor--full 套用於 .cd-anchor 或 .cd-anchor-grp，讓其獨佔整行
*/
.cd-anchor-grp {
  display: inline-flex;
  align-items: center;
}
.cd-anchor--full {
  flex-basis: 100%;
}

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
.cd-btn.is-masked:hover .cd-b-text {
  background: color-mix(in srgb, var(--cd-mask-bg, #252625) 80%, white);
}
.cd-btn.is-masked.is-open {
  box-shadow: 0 0 0 3px rgba(255,255,255,.12);
}

/* ── 下拉選單 ───────────────────────────── */
.cd-dd {
  position: absolute;
  top: calc(100% + 6px); left: 0;
  z-index: 9999;
  border: 1px solid; border-radius: 10px; overflow: hidden;
  box-shadow: 0 16px 44px rgba(0,0,0,.72);
  min-width: 240px; max-width: 420px;
  /* 預設往下展開：起始稍高並縮小 */
  opacity: 0; transform: translateY(-5px) scale(.985);
  pointer-events: none;
  transition: opacity .17s ease, transform .17s ease;
}
/* 往上翻轉：起始稍低並縮小，動畫方向對調 */
.cd-dd.cd-dd--up {
  top: auto;
  transform: translateY(5px) scale(.985);
}
.cd-dd.is-open {
  opacity: 1; transform: none; pointer-events: auto;
}

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
  width: 3px; background: var(--sel-bar, var(--lc, #C6C7BD)); border-radius: 0 2px 2px 0;
}

/* 圓點（show-dots=false 時不渲染此元素）*/
.cd-lv-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--lc, #C6C7BD); flex-shrink: 0; margin-top: 5px;
}

.cd-lv-text { font-size: .91rem; line-height: 1.5; color: #9da09a; white-space: normal; }
.cd-lv.is-sel .cd-lv-text { color: #dde0d8; }

/* ── 整句預覽 ───────────────────────────── */
.cd-preview {
  margin-top: 1px; padding: 3px 6px;
  border-left: 3px solid var(--pvb, #C8DD5A);
  border-radius: 0 6px 6px 0;
  background: var(--pvbg, rgba(255,255,255,.035));
}
.cd-pv-text { font-size: .9rem; font-style: italic; color: var(--pvt, #7a8078); }

.cd-translation {
  margin-top: 1px; padding: 3px 6px;
  margin-left: var(--trl-indent, 0px);
  border-left: 3px solid var(--trlb, #C6C7BD);
  border-radius: 0 6px 6px 0;
  background: rgba(255,255,255,.025);
  transition: opacity .2s ease;
}
.cd-tr-text {
  font-size: .9rem; color: var(--trlc, #8C9088);
  letter-spacing: .01em; line-height: 1.25;
}

.cd-note {
  margin-top: 1px; padding: 3px 6px;
  margin-left: var(--note-indent, 0px);
  border-left: 3px solid var(--noteb, #C6C7BD);
  border-radius: 0 6px 6px 0;
  background: rgba(255,255,255,.018);
  transition: opacity .2s ease;
}
.cd-note-text {
  font-size: .85rem; color: var(--notec, #6e7270);
  letter-spacing: .02em; line-height: 1.3; font-style: italic;
}

/* ── 鎖定語塊（等待外部 ui-btn 解鎖）── */
.cd-btn.is-locked {
  opacity: 0.36;
  cursor: not-allowed;
}
.cd-btn.is-locked:hover { filter: none !important; }
.cd-btn.is-locked:active { transform: none !important; }
/* 鎖定時箭頭變鎖頭圖示（CSS 替換內容）*/
.cd-btn.is-locked .cd-b-arr {
  opacity: 1;
  font-style: normal;
}
    `.trim();
    (doc.head || doc.documentElement).appendChild(s);
  }

  /* ─────────────────────────────────────────────────────
     預設設定
  ───────────────────────────────────────────────────── */
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
    defaultTheme:     'special',
    chunkBorderWidth: '1.5px',
    chunkBorderStyle: 'solid',

    /* 圓點色彩：由 3 種擴充至 8 種 */
    levelDotColors: {
      1: '#40C99A',   /* safe    — 綠  */
      2: '#DECA4B',   /* yellow  — 黃  */
      3: '#C3A5E5',   /* lavender— 紫  */
      4: '#0ABDC6',   /* sky     — 青  */
      5: '#F08080',   /* warning — 紅  */
      6: '#EDA109',   /* orange  — 橘  */
      7: '#FFB3D9',   /* pink    — 粉  */
      8: '#95BDD7',   /* stone   — 藍灰 */
    },

    fixedTextColor:     '#C6C7BD',
    sentenceBg:         '#161816',
    sentenceBorder:     '#222422',
    dropdownBg:         '#1d1f1d',
    dropdownBorder:     '#2c2e2c',
    previewBorderColor: null,
    previewTextColor:   null,
    previewBg:          null,
    showPreview:        false,
    showDots:           true,
    maskMode:           false,
    maskColor:          '#252625',
    width:              null,
    dropdownWidth:      null,
    buttonWidth:        null,

    /*
      longChunkThreshold：
      按鈕原生寬（scrollWidth）佔句子框可用寬的比例超過此值時，
      自動對錨點加 .cd-anchor--full 使其獨佔整行。
      可透過 long-chunk-threshold="0.4" 屬性覆寫。
    */
    longChunkThreshold: 0.52,

    showTranslation:        false,
    translationColor:       '#8C9088',
    translationBorderColor: null,
    translationIndent:      0,

    showNote:        false,
    noteColor:       '#6e7270',
    noteBorderColor: null,
    noteIndent:      0,
  };

  /* ─────────────────────────────────────────────────────
     Custom Element
  ───────────────────────────────────────────────────── */
  class ChunkDemo extends HTMLElement {

    static get observedAttributes() {
      return [
        'sentence', 'chunks', 'show-preview',
        'theme', 'border-width', 'border-style', 'data-config',
        'show-dots', 'width', 'dropdown-width', 'button-width',
        'level-colors', 'mask-mode',
        'translation', 'show-translation', 'translation-indent',
        'note', 'show-note', 'note-indent',
        'long-chunk-threshold',
        'lock-chunks',
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
      this._revealed = new Set();
      this._ro       = null;
      this._locked   = new Set();   /* chunk id 集合，鎖定中的語塊無法開啟下拉 */
      this._docClick = () => this._close();
      this._docKey   = e => { if (e.key === 'Escape') this._close(); };
    }

    connectedCallback() {
      doc.addEventListener('click',   this._docClick);
      doc.addEventListener('keydown', this._docKey);

      /* ResizeObserver：元件寬度改變時重新判斷長語塊 */
      if (typeof ResizeObserver !== 'undefined') {
        this._ro = new ResizeObserver(() => {
          const bar = this.querySelector('.cd-bar');
          if (bar) this._checkLongBtns(bar);
        });
        this._ro.observe(this);
      }

      setTimeout(() => { this._ready = true; this._init(); }, 0);
    }

    disconnectedCallback() {
      doc.removeEventListener('click',   this._docClick);
      doc.removeEventListener('keydown', this._docKey);
      this._ro?.disconnect();
      this._ro = null;
    }

    attributeChangedCallback() {
      if (this.isConnected && this._ready) this._init();
    }

    /* ── 合併設定 ─────────────────────────── */
    _cfg() {
      const G = win.ChunkDemoConfig || {};
      let E = {};
      try { E = JSON.parse(this.getAttribute('data-config') || '{}'); } catch {}

      const cfg = {
        ...DEFAULTS, ...G, ...E,
        themes        : { ...DEFAULTS.themes,         ...(G.themes         || {}), ...(E.themes         || {}) },
        levelDotColors: { ...DEFAULTS.levelDotColors, ...(G.levelDotColors || {}), ...(E.levelDotColors || {}) },
      };

      const name  = this.getAttribute('theme') || cfg.defaultTheme || 'special';
      cfg._theme  = cfg.themes[name] || cfg.themes.special || DEFAULTS.themes.special;

      if (this.getAttribute('border-width')) cfg.chunkBorderWidth = this.getAttribute('border-width');
      if (this.getAttribute('border-style')) cfg.chunkBorderStyle = this.getAttribute('border-style');

      const lcAttr = this.getAttribute('level-colors');
      if (lcAttr) {
        lcAttr.split(',').forEach((color, i) => {
          const c = color.trim();
          if (c) cfg.levelDotColors[i + 1] = c;
        });
      }

      const sdAttr = this.getAttribute('show-dots');
      if (sdAttr !== null) cfg.showDots = sdAttr !== 'false';

      if (this.getAttribute('width'))          cfg.width         = this.getAttribute('width');
      if (this.getAttribute('dropdown-width')) cfg.dropdownWidth = this.getAttribute('dropdown-width');
      if (this.getAttribute('button-width'))   cfg.buttonWidth   = this.getAttribute('button-width');

      const mmAttr = this.getAttribute('mask-mode');
      if (mmAttr !== null) cfg.maskMode = mmAttr === 'true';

      const stAttr = this.getAttribute('show-translation');
      if (stAttr !== null) cfg.showTranslation = stAttr === 'true';

      const tiAttr = this.getAttribute('translation-indent');
      if (tiAttr !== null) cfg.translationIndent = parseFloat(tiAttr) || 0;

      const snAttr = this.getAttribute('show-note');
      if (snAttr !== null) cfg.showNote = snAttr === 'true';

      const niAttr = this.getAttribute('note-indent');
      if (niAttr !== null) cfg.noteIndent = parseFloat(niAttr) || 0;

      const lctAttr = this.getAttribute('long-chunk-threshold');
      if (lctAttr !== null) {
        const v = parseFloat(lctAttr);
        if (!isNaN(v)) cfg.longChunkThreshold = v;
      }

      /* 衍生值 */
      cfg._pvColor   = cfg.previewBorderColor || cfg._theme.border;
      cfg._maskColor = cfg.maskColor || DEFAULTS.maskColor;
      cfg._trColor   = cfg.translationBorderColor || cfg._theme.border;
      cfg._noteColor = cfg.noteBorderColor || cfg._theme.border;

      return cfg;
    }

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
            trans: lv.getAttribute('trans') ?? '',
          })),
        };
      });
    }

    _init() {
      const cdChunks = Array.from(this.querySelectorAll(':scope > cd-chunk'));
      let chunks;

      if (cdChunks.length > 0) {
        chunks = this._parseChildren(cdChunks);
      } else {
        try { chunks = JSON.parse(this.getAttribute('chunks') || '[]'); } catch { chunks = []; }
      }

      this._sent   = this.getAttribute('sentence')    || '';
      this._trans  = this.getAttribute('translation') || '';
      this._chunks = chunks;

      /* 重新解析鎖定清單（只在 _init 時重置，_draw 不重置）*/
      const lcAttrRaw = this.getAttribute('lock-chunks') || '';
      this._locked = new Set(
        lcAttrRaw.split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n))
      );

      const prev  = this._state;
      this._state = chunks.map(c => {
        const p = prev.find(s => s.id === c.id);
        return { id: c.id, level: p ? p.level : (c.currentLevel || 1) };
      });

      this._revealed = new Set();
      this._openId   = null;
      this._draw();
    }

    _draw() {
      const srcNodes = Array.from(this.querySelectorAll(':scope > cd-chunk'));
      this.innerHTML = '';
      this._btns     = {};
      this._dds      = {};
      srcNodes.forEach(n => this.appendChild(n));

      const cfg = this._cfg();

      if (cfg.width) {
        this.style.width = cfg.width;
      } else {
        this.style.removeProperty('width');
      }

      if (cfg.maskMode) {
        this.style.setProperty('--cd-mask-bg', cfg._maskColor);
      } else {
        this.style.removeProperty('--cd-mask-bg');
      }

      /* 句子框（含長語塊解析）*/
      const bar = this._buildBar(cfg);
      this.appendChild(bar);

      /* 長語塊判斷（需等 DOM 插入後才能取得正確寬度）*/
      requestAnimationFrame(() => this._checkLongBtns(bar, cfg));

      /* 整句預覽 */
      const showPrev =
        this.getAttribute('show-preview') === 'true' ||
        (this.getAttribute('show-preview') === null && cfg.showPreview);

      if (showPrev) {
        const pv = doc.createElement('div');
        pv.className = 'cd-preview';
        pv.style.setProperty('--pvb', cfg._pvColor);
        if (cfg.previewTextColor) pv.style.setProperty('--pvt',  cfg.previewTextColor);
        if (cfg.previewBg)        pv.style.setProperty('--pvbg', cfg.previewBg);
        const t     = doc.createElement('div');
        t.className = 'cd-pv-text';
        t.innerHTML = this._full();
        pv.appendChild(t);
        this.appendChild(pv);
      }

      /* 翻譯 */
      const showTrans =
        this.getAttribute('show-translation') === 'true' ||
        (this.getAttribute('show-translation') === null && cfg.showTranslation);

      if (showTrans && this._trans) {
        const tr = doc.createElement('div');
        tr.className = 'cd-translation';
        tr.style.setProperty('--trlb', cfg._trColor);
        if (cfg.translationColor)  tr.style.setProperty('--trlc', cfg.translationColor);
        if (cfg.translationIndent) tr.style.setProperty('--trl-indent', cfg.translationIndent + 'px');
        const tt     = doc.createElement('div');
        tt.className = 'cd-tr-text';
        tt.innerHTML = this._fullTrans();
        tr.appendChild(tt);
        this.appendChild(tr);
      }

      /* 備註 */
      const showNote =
        this.getAttribute('show-note') === 'true' ||
        (this.getAttribute('show-note') === null && cfg.showNote);
      const noteText = this.getAttribute('note') || '';
      if (showNote && noteText) {
        const nt = doc.createElement('div');
        nt.className = 'cd-note';
        nt.style.setProperty('--noteb', cfg._noteColor);
        if (cfg.noteColor)  nt.style.setProperty('--notec', cfg.noteColor);
        if (cfg.noteIndent) nt.style.setProperty('--note-indent', cfg.noteIndent + 'px');
        const ntx     = doc.createElement('div');
        ntx.className = 'cd-note-text';
        ntx.innerHTML = noteText;
        nt.appendChild(ntx);
        this.appendChild(nt);
      }
    }

    _buildBar(cfg) {
      const bar = doc.createElement('div');
      bar.className        = 'cd-bar';
      bar.style.background  = cfg.sentenceBg;
      bar.style.borderColor = cfg.sentenceBorder;

      const PUNCT_RE = /^([.,!?;:…\u3002\uff0c\uff01\uff1f\uff1b\uff1a]+)([\s\S]*)$/;

      const parts = this._sent.split(/(\{\d+\})/);

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const m    = part.match(/^\{(\d+)\}$/);

        if (m) {
          const chunk = this._chunks.find(c => c.id === +m[1]);
          if (!chunk) continue;

          const anchor   = this._mkAnchor(chunk, cfg);
          const nextPart = parts[i + 1] ?? '';
          const punctM   = PUNCT_RE.exec(nextPart);

          if (punctM) {
            const grp = doc.createElement('span');
            grp.className = 'cd-anchor-grp';
            grp.appendChild(anchor);
            const ps = doc.createElement('span');
            ps.style.color = cfg.fixedTextColor;
            ps.textContent = punctM[1];
            grp.appendChild(ps);
            bar.appendChild(grp);
            parts[i + 1] = punctM[2];
          } else {
            bar.appendChild(anchor);
          }

        } else if (part) {
          const sp = doc.createElement('span');
          sp.style.color = cfg.fixedTextColor;
          sp.textContent = part;
          bar.appendChild(sp);
        }
      }

      return bar;
    }

    _checkLongBtns(bar, cfg) {
      if (!cfg) cfg = this._cfg();
      const padH      = 44;   /* padding-left 22 + padding-right 22 */
      const barW      = bar.clientWidth - padH;
      if (barW <= 0) return;

      const threshold = cfg.longChunkThreshold ?? DEFAULTS.longChunkThreshold;

      bar.querySelectorAll(':scope > .cd-anchor, :scope > .cd-anchor-grp').forEach(el => {
        const btn = el.querySelector('.cd-btn');
        if (!btn) return;
        el.classList.toggle('cd-anchor--full', btn.scrollWidth > barW * threshold);
      });
    }

    _mkAnchor(chunk, cfg) {
      const st    = this._state.find(s => s.id === chunk.id) || { level: 1 };
      const lvNum = st.level;
      const lvD   = chunk.levels.find(l => l.level === lvNum) || chunk.levels[0];
      const th    = cfg._theme;
      const bw    = cfg.chunkBorderWidth || '1.5px';
      const bs    = cfg.chunkBorderStyle || 'solid';

      const isMasked  = cfg.maskMode && !this._revealed.has(chunk.id);
      const isLocked  = this._locked.has(chunk.id);

      const anchor     = doc.createElement('div');
      anchor.className = 'cd-anchor';

      const btn     = doc.createElement('button');
      btn.className = 'cd-btn' +
        (isMasked ? ' is-masked' : '') +
        (isLocked  ? ' is-locked'  : '');
      btn.style.cssText =
        `border-color:${th.border};border-width:${bw};border-style:${bs};` +
        `color:${th.text};background:${th.bg};`;

      if (cfg.buttonWidth) btn.style.minWidth = cfg.buttonWidth;

      if (chunk.icon) {
        const ic       = doc.createElement('span');
        ic.className   = 'cd-b-icon';
        ic.textContent = chunk.icon;
        btn.appendChild(ic);
      }

      const tx     = doc.createElement('span');
      tx.className = 'cd-b-text';
      tx.innerHTML = lvD?.text ?? '—';
      btn.appendChild(tx);

      const arr       = doc.createElement('span');
      arr.className   = 'cd-b-arr';
      arr.textContent = isLocked ? '🔒' : '▾';
      arr.setAttribute('aria-hidden', 'true');
      btn.appendChild(arr);

      btn.addEventListener('click', e => { e.stopPropagation(); this._toggle(chunk.id); });
      this._btns[chunk.id] = btn;
      anchor.appendChild(btn);

      const dd = this._mkDD(chunk, cfg, lvNum);
      this._dds[chunk.id] = dd;
      anchor.appendChild(dd);

      return anchor;
    }

    _mkDD(chunk, cfg, currentLevel) {
      const dd     = doc.createElement('div');
      dd.className = 'cd-dd';
      dd.style.background  = cfg.dropdownBg;
      dd.style.borderColor = cfg.dropdownBorder;

      if (cfg.dropdownWidth) {
        dd.style.minWidth = cfg.dropdownWidth;
        dd.style.maxWidth = cfg.dropdownWidth;
      }

      const lbl = (typeof chunk.label === 'string') ? chunk.label.trim() : '';
      if (lbl) {
        const hd     = doc.createElement('div');
        hd.className = 'cd-dd-head';
        if (chunk.icon) {
          const ic       = doc.createElement('span');
          ic.textContent = chunk.icon;
          hd.appendChild(ic);
        }
        const lb       = doc.createElement('span');
        lb.className   = 'cd-h-lbl';
        lb.textContent = lbl;
        hd.appendChild(lb);
        dd.appendChild(hd);
      }

      chunk.levels.forEach(lv => {
        const dotC  = cfg.levelDotColors[lv.level] || '#C6C7BD';
        const isSel = lv.level === currentLevel;

        const row     = doc.createElement('div');
        row.className = 'cd-lv' + (isSel ? ' is-sel' : '');
        row.style.setProperty('--lc', dotC);
        if (isSel) row.style.setProperty('--sel-bar', cfg._theme.border);

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

    _toggle(id) {
      if (this._locked.has(id)) return;
      if (this._openId === id) { this._close(); return; }
      this._close();
      this._openId = id;
      this._btns[id]?.classList.add('is-open');
      const dd = this._dds[id];
      if (!dd) return;

      const btn        = this._btns[id];
      const btnRect    = btn.getBoundingClientRect();
      const ddH        = dd.offsetHeight;
      const spaceBelow = win.innerHeight - btnRect.bottom;
      const spaceAbove = btnRect.top;

      if (spaceBelow < ddH + 8 && spaceAbove > ddH + 8) {
        dd.classList.add('cd-dd--up');
        dd.style.top    = 'auto';
        dd.style.bottom = 'calc(100% + 6px)';
      } else {
        dd.classList.remove('cd-dd--up');
        dd.style.top    = 'calc(100% + 6px)';
        dd.style.bottom = 'auto';
      }

      dd.classList.add('is-open');

      requestAnimationFrame(() => {
        if (!this._dds[id]) return;
        const r        = dd.getBoundingClientRect();
        dd.style.left  = r.right > win.innerWidth - 8 ? 'auto' : '0';
        dd.style.right = r.right > win.innerWidth - 8 ? '0'    : 'auto';
      });
    }

    _close() {
      if (this._openId === null) return;
      this._btns[this._openId]?.classList.remove('is-open');
      const dd = this._dds[this._openId];
      if (dd) {
        dd.classList.remove('is-open', 'cd-dd--up');
        dd.style.top    = '';
        dd.style.bottom = '';
        dd.style.left   = '';
        dd.style.right  = '';
      }
      this._openId = null;
    }

    _pick(id, level) {
      const st = this._state.find(s => s.id === id);
      if (st) st.level = level;
      this._revealed.add(id);
      this._close();
      this._draw();
    }

    _full() {
      let result = this._sent;
      this._chunks.forEach(c => {
        const lvNum = (this._state.find(st => st.id === c.id) || {}).level || 1;
        const lvD   = c.levels.find(l => l.level === lvNum) || c.levels[0];
        result = result.replace(`{${c.id}}`, lvD?.text ?? '…');
      });
      return result;
    }

    _fullTrans() {
      if (!this._trans) return '';
      let result = this._trans;
      this._chunks.forEach(c => {
        const lvNum = (this._state.find(st => st.id === c.id) || {}).level || 1;
        const lvD   = c.levels.find(l => l.level === lvNum) || c.levels[0];
        result = result.replace(`{${c.id}}`, lvD?.trans || lvD?.text || '…');
      });
      return result;
    }

    unlockChunk(id) {
      const n = parseInt(id, 10);
      if (!isNaN(n) && this._locked.has(n)) {
        this._locked.delete(n);
        this._draw();
      }
    }

    lockChunk(id) {
      const n = parseInt(id, 10);
      if (!isNaN(n) && !this._locked.has(n)) {
        /* 若該 chunk 的下拉正開著，先關閉 */
        if (this._openId === n) this._close();
        this._locked.add(n);
        this._draw();
      }
    }
  }

  if (!customElements.get('chunk-demo')) {
    customElements.define('chunk-demo', ChunkDemo);
  }

}(window, document));
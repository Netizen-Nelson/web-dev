(function (win, doc) {
  'use strict';

  const CSS_ID = '__chunk-demo-v2__';
  if (!doc.getElementById(CSS_ID)) {
    const s = doc.createElement('style');
    s.id = CSS_ID;
    s.textContent = `
/* Data-carrier elements — always hidden */
cd-chunk, cd-level { display: none !important; }

chunk-demo { display: block; }

/* ── Sentence bar ──────────────────────────── */
.cd-bar {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 4px 8px; padding: 16px 22px;
  border-radius: 12px; border: 1px solid;
  font-size: 1.1rem; line-height: 2.2;
}

/* ── Chunk anchor (dropdown scope) ─────────── */
.cd-anchor { position: relative; display: inline-flex; }

/* ── Chunk button ───────────────────────────── */
.cd-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px 4px 9px;
  border-radius: 7px;
  border: 1.5px solid transparent; /* layout placeholder; overridden by JS */
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
.cd-b-arr  { font-size: .68em; opacity: .6; transition: transform .18s; margin-left: 2px; }
.cd-btn.is-open .cd-b-arr { transform: rotate(180deg); }

/* ── Dropdown panel ─────────────────────────── */
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

/* Dropdown header — only rendered when chunk.label is non-empty */
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

/* Level rows: dot + text (no level label) */
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
.cd-lv-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--lc, #C6C7BD); flex-shrink: 0; margin-top: 5px;
}
.cd-lv-text { font-size: .91rem; line-height: 1.5; color: #9da09a; white-space: normal; }
.cd-lv.is-sel .cd-lv-text { color: #dde0d8; }

/* ── Full-sentence preview ──────────────────── */
/* --pvb / --pvt / --pvbg all set dynamically in _draw() */
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
    previewBorderColor: null,              /* null = auto-follow active theme color */
    previewTextColor:   null,              /* null = use CSS default (#7a8078) */
    previewBg:          null,              /* null = use CSS default (rgba(255,255,255,.035)) */
    showPreview:        false,
  };

  class ChunkDemo extends HTMLElement {
    static get observedAttributes() {
      return [
        'sentence', 'chunks', 'show-preview',
        'theme', 'border-width', 'border-style', 'data-config',
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
      this._ready    = false;   /* guards against premature attributeChangedCallback */
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

    _cfg() {
      const G = win.ChunkDemoConfig || {};
      let E = {};
      try { E = JSON.parse(this.getAttribute('data-config') || '{}'); } catch {}

      const cfg = {
        ...DEFAULTS, ...G, ...E,
        themes:         { ...DEFAULTS.themes,         ...(G.themes         || {}), ...(E.themes         || {}) },
        levelDotColors: { ...DEFAULTS.levelDotColors, ...(G.levelDotColors || {}), ...(E.levelDotColors || {}) },
      };

      /* Resolve active theme */
      const name = this.getAttribute('theme') || cfg.defaultTheme || 'special';
      cfg._theme = cfg.themes[name] || cfg.themes.special || DEFAULTS.themes.special;

      if (this.getAttribute('border-width')) cfg.chunkBorderWidth = this.getAttribute('border-width');
      if (this.getAttribute('border-style')) cfg.chunkBorderStyle = this.getAttribute('border-style');

      cfg._pvColor = cfg.previewBorderColor || cfg._theme.border;

      return cfg;
    }

    _parseChildren(cdChunks) {
      return cdChunks.map((el, i) => {
        const rawId   = el.getAttribute('id');
        const cdLevels = Array.from(el.querySelectorAll('cd-level'));
        return {
          id:           rawId !== null ? parseInt(rawId) : i,
          icon:         el.getAttribute('icon')          || '',
          label:        el.getAttribute('label')         ?? '',
          currentLevel: parseInt(el.getAttribute('current-level') || '1'),
          levels:       cdLevels.map((lv, j) => ({
            level: parseInt(lv.getAttribute('level') || String(j + 1)),
            text:  lv.innerHTML.trim(),      /* innerHTML: preserves any HTML tags inside */
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

      this._sent   = this.getAttribute('sentence') || '';
      this._chunks = chunks;

      const prev  = this._state;
      this._state = chunks.map(c => {
        const p = prev.find(s => s.id === c.id);
        return { id: c.id, level: p ? p.level : (c.currentLevel || 1) };
      });

      this._openId = null;
      this._draw();
    }

    _draw() {
 
      const srcNodes = Array.from(this.querySelectorAll(':scope > cd-chunk'));

      this.innerHTML = '';
      this._btns = {};
      this._dds  = {};

      srcNodes.forEach(n => this.appendChild(n));

      const cfg = this._cfg();

      const bar = doc.createElement('div');
      bar.className = 'cd-bar';
      bar.style.background  = cfg.sentenceBg;
      bar.style.borderColor = cfg.sentenceBorder;

      this._sent.split(/(\{\d+\})/).forEach(part => {
        const m = part.match(/^\{(\d+)\}$/);
        if (m) {
          const chunk = this._chunks.find(c => c.id === +m[1]);
          if (chunk) bar.appendChild(this._mkAnchor(chunk, cfg));
        } else if (part) {
          const sp = doc.createElement('span');
          sp.style.color = cfg.fixedTextColor;
          sp.textContent = part;
          bar.appendChild(sp);
        }
      });
      this.appendChild(bar);

      const showPrev =
        this.getAttribute('show-preview') === 'true' ||
        (this.getAttribute('show-preview') === null && cfg.showPreview);

      if (showPrev) {
        const pv = doc.createElement('div');
        pv.className = 'cd-preview';
        pv.style.setProperty('--pvb',  cfg._pvColor);
        if (cfg.previewTextColor) pv.style.setProperty('--pvt',  cfg.previewTextColor);
        if (cfg.previewBg)        pv.style.setProperty('--pvbg', cfg.previewBg);

        const t = doc.createElement('div');
        t.className = 'cd-pv-text';
        t.innerHTML = this._full();
        pv.appendChild(t);
        this.appendChild(pv);
      }
    }

    _mkAnchor(chunk, cfg) {
      const st    = this._state.find(s => s.id === chunk.id) || { level: 1 };
      const lvNum = st.level;
      const dotC  = cfg.levelDotColors[lvNum] || '#C6C7BD';
      const lvD   = chunk.levels.find(l => l.level === lvNum) || chunk.levels[0];
      const th    = cfg._theme;
      const bw    = cfg.chunkBorderWidth || '1.5px';
      const bs    = cfg.chunkBorderStyle || 'solid';

      const anchor = doc.createElement('div');
      anchor.className = 'cd-anchor';

      const btn = doc.createElement('button');
      btn.className = 'cd-btn';
      btn.style.cssText =
        `border-color:${th.border};border-width:${bw};border-style:${bs};` +
        `color:${th.text};background:${th.bg};`;

      if (chunk.icon) {
        const ic = doc.createElement('span');
        ic.className   = 'cd-b-icon';
        ic.textContent = chunk.icon;
        btn.appendChild(ic);
      }

      const tx = doc.createElement('span');
      tx.className = 'cd-b-text';
      tx.innerHTML = lvD?.text ?? '—';
      btn.appendChild(tx);

      btn.addEventListener('click', e => { e.stopPropagation(); this._toggle(chunk.id); });
      this._btns[chunk.id] = btn;
      anchor.appendChild(btn);

      const dd = this._mkDD(chunk, cfg, lvNum, dotC);
      this._dds[chunk.id] = dd;
      anchor.appendChild(dd);

      return anchor;
    }

    _mkDD(chunk, cfg, currentLevel, _dotC) {
      const dd = doc.createElement('div');
      dd.className = 'cd-dd';
      dd.style.background  = cfg.dropdownBg;
      dd.style.borderColor = cfg.dropdownBorder;

      const lbl = (typeof chunk.label === 'string') ? chunk.label.trim() : '';
      if (lbl) {
        const hd = doc.createElement('div');
        hd.className = 'cd-dd-head';
        if (chunk.icon) {
          const ic = doc.createElement('span');
          ic.textContent = chunk.icon;
          hd.appendChild(ic);
        }
        const lb = doc.createElement('span');
        lb.className   = 'cd-h-lbl';
        lb.textContent = lbl;
        hd.appendChild(lb);
        dd.appendChild(hd);
      }

      chunk.levels.forEach(lv => {
        const dotC  = cfg.levelDotColors[lv.level] || '#C6C7BD';
        const isSel = lv.level === currentLevel;

        const row = doc.createElement('div');
        row.className = 'cd-lv' + (isSel ? ' is-sel' : '');
        row.style.setProperty('--lc', dotC);

        const dot = doc.createElement('span');
        dot.className = 'cd-lv-dot';
        row.appendChild(dot);

        const text = doc.createElement('div');
        text.className = 'cd-lv-text';
        text.innerHTML = lv.text;            /* innerHTML: supports HTML in level text */
        row.appendChild(text);

        row.addEventListener('click', e => { e.stopPropagation(); this._pick(chunk.id, lv.level); });
        dd.appendChild(row);
      });

      return dd;
    }

    _toggle(id) {
      if (this._openId === id) { this._close(); return; }
      this._close();
      this._openId = id;
      this._btns[id]?.classList.add('is-open');
      const dd = this._dds[id];
      if (!dd) return;
      dd.classList.add('is-open');
      requestAnimationFrame(() => {
        const r = dd.getBoundingClientRect();
        dd.style.left  = r.right > win.innerWidth - 8 ? 'auto' : '0';
        dd.style.right = r.right > win.innerWidth - 8 ? '0'    : 'auto';
      });
    }

    _close() {
      if (this._openId === null) return;
      this._btns[this._openId]?.classList.remove('is-open');
      this._dds[this._openId]?.classList.remove('is-open');
      this._openId = null;
    }

    _pick(id, level) {
      const st = this._state.find(s => s.id === id);
      if (st) st.level = level;
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
  }

  if (!customElements.get('chunk-demo')) {
    customElements.define('chunk-demo', ChunkDemo);
  }

}(window, document));

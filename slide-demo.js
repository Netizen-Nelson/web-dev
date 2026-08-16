/**
 * slide-demo.js  v1.0
 *
 * 使用方式：
 *   <slide-demo
 *     theme="special"
 *     height="480px"
 *     progress-bar="true"
 *     progress-bar-size="3px"
 *     autoplay="5"
 *     autoplay-loop="false"
 *     thumbnails="true"
 *     thumbnails-position="bottom"
 *     show-controls="true"
 *     show-arrows="true"
 *     controls-position="bottom"
 *     controls-size="md"
 *     show-dots="true"
 *     show-notes="true"
 *     spacious="false"
 *     line-height="1.7"
 *   >
 *     <sd-slide layout="center" line-height="1.5">
 *       <slide-note>這裡是備忘稿，不會在主畫面出現</slide-note>
 *       <sd-eyebrow>眉標文字</sd-eyebrow>
 *       <sd-title>主標題</sd-title>
 *       <sd-subtitle>副標題</sd-subtitle>
 *     </sd-slide>
 *
 *     <sd-slide layout="sentence">
 *       <slide-note>備忘稿</slide-note>
 *       <sd-eyebrow>眉標</sd-eyebrow>
 *       <sd-title>標題</sd-title>
 *       <sd-body>任意 HTML 內容</sd-body>
 *     </sd-slide>
 *
 *     <sd-slide layout="split">
 *       <slide-note>備忘稿</slide-note>
 *       <sd-left>左欄內容</sd-left>
 *       <sd-right>右欄內容</sd-right>
 *     </sd-slide>
 *
 *     <sd-slide layout="blank">
 *       <!-- 完全自由 HTML -->
 *     </sd-slide>
 *   </slide-demo>
 *
 * 品牌色票（theme 屬性值）：
 *   shell | lavender | special | warning | salmon | sky | safe
 *   vanilla | yellow | focus | info | stone | indigo | pink | orange
 */

(function (win, doc) {
  'use strict';

  /* ══════════════════════════════════════════════════
     品牌色票
  ══════════════════════════════════════════════════ */
  const BRAND = {
    shell:    { border: '#C6C7BD', text: '#C6C7BD', bg: 'rgba(198,199,189,.08)', accent: '#C6C7BD' },
    lavender: { border: '#C3A5E5', text: '#C3A5E5', bg: 'rgba(195,165,229,.08)', accent: '#C3A5E5' },
    special:  { border: '#C8DD5A', text: '#C8DD5A', bg: 'rgba(200,221,90,.08)',  accent: '#C8DD5A' },
    warning:  { border: '#F08080', text: '#F08080', bg: 'rgba(240,128,128,.08)', accent: '#F08080' },
    salmon:   { border: '#E5C3B3', text: '#E5C3B3', bg: 'rgba(229,195,179,.08)', accent: '#E5C3B3' },
    sky:      { border: '#08A9D1', text: '#08A9D1', bg: 'rgba(8,169,209,.08)',   accent: '#08A9D1' },
    safe:     { border: '#40C99A', text: '#40C99A', bg: 'rgba(64,201,154,.08)',  accent: '#40C99A' },
    vanilla:  { border: '#DBEDD8', text: '#DBEDD8', bg: 'rgba(219,237,216,.08)', accent: '#DBEDD8' },
    yellow:   { border: '#DECA4B', text: '#DECA4B', bg: 'rgba(222,202,75,.08)',  accent: '#DECA4B' },
    focus:    { border: '#A0CF72', text: '#A0CF72', bg: 'rgba(160,207,114,.08)', accent: '#A0CF72' },
    info:     { border: '#4285EB', text: '#4285EB', bg: 'rgba(66,133,235,.08)',  accent: '#4285EB' },
    stone:    { border: '#95BDD7', text: '#95BDD7', bg: 'rgba(149,189,215,.08)', accent: '#95BDD7' },
    indigo:   { border: '#7B6CF0', text: '#7B6CF0', bg: 'rgba(123,108,240,.08)', accent: '#7B6CF0' },
    pink:     { border: '#FFB3D9', text: '#FFB3D9', bg: 'rgba(255,179,217,.08)', accent: '#FFB3D9' },
    orange:   { border: '#EDA109', text: '#EDA109', bg: 'rgba(237,161,9,.08)',   accent: '#EDA109' },
  };

  const DEFAULT_THEME = 'special';

  /* ══════════════════════════════════════════════════
     全域 CSS（只注入一次）
  ══════════════════════════════════════════════════ */
  const CSS_ID = '__slide-demo-v1__';
  if (!doc.getElementById(CSS_ID)) {
    const s = doc.createElement('style');
    s.id = CSS_ID;
    s.textContent = `
/* ── 資料標籤永遠隱藏 ─────────────────────────── */
sd-slide    { display: none !important; }
slide-note  { display: none !important; }
sd-eyebrow  { display: none !important; }
sd-title    { display: none !important; }
sd-subtitle { display: none !important; }
sd-body     { display: none !important; }
sd-left     { display: none !important; }
sd-right    { display: none !important; }

/* ── 元件根層 ─────────────────────────────────── */
slide-demo {
  display: block;
  font-family: 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif;
  font-size: 1.125rem;
  color: #C6C7BD;
  position: relative;
  user-select: none;
  --sd-stage-bg: #0C0D0C;
  --sd-notes-max-h: 130px;   /* 緊湊預設；spacious / notes-height 屬性可覆蓋 */
}

/* ── 進度條 ───────────────────────────────────── */
.sd-progress {
  width: 100%;
  background: rgba(255,255,255,.06);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.sd-progress-fill {
  height: 100%;
  width: 0%;
  transition: width .35s ease;
}

/* ── 主舞台 ───────────────────────────────────── */
.sd-stage {
  position: relative;
  width: 100%;
  background: #0C0D0C;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

/* ── Slide 內容渲染層 ─────────────────────────── */
.sd-frame {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 版型：center ─────────────────────────────── */
.sdl-center {
  align-items: center;
  justify-content: center;
  text-align: center;
}
.sdl-center .sd-eyebrow-el {
  margin-bottom: 10px;
}
.sdl-center .sd-title-el {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 10px;
}
.sdl-center .sd-subtitle-el {
  font-size: 1rem;
  opacity: .7;
  max-width: 680px;
}

/* ── 版型：sentence ───────────────────────────── */
.sdl-sentence {
  justify-content: center;
}
.sdl-sentence .sd-eyebrow-el {
  margin-bottom: 8px;
}
.sdl-sentence .sd-title-el {
  font-size: 1.45rem;
  font-weight: 700;
  margin-bottom: 14px;
}
.sdl-sentence .sd-body-el {
  width: 100%;
}

/* ── 版型：split ──────────────────────────────── */
.sdl-split {
  flex-direction: row !important;
  align-items: stretch;
  justify-content: stretch;
}
.sdl-split .sd-left-el,
.sdl-split .sd-right-el {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.sdl-split .sd-left-el {
  border-right: 1px solid rgba(255,255,255,.07);
}

/* ── 版型：blank ──────────────────────────────── */
.sdl-blank {
  align-items: stretch;
  justify-content: stretch;
}

/* ── 共用眉標 ─────────────────────────────────── */
.sd-eyebrow-el {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.65;
  flex-shrink: 0;
}

/* ── 備忘稿區 ─────────────────────────────────── */
.sd-notes-panel {
  background: #111211;
  border-top: 1px solid rgba(255,255,255,.07);
  overflow: hidden;            /* 不在 panel 本身產生卷軸 */
  flex-shrink: 0;
  transition: max-height .3s ease, opacity .3s ease;
  max-height: 0;
  opacity: 0;
  pointer-events: none;
  position: relative;
}
.sd-notes-panel.is-open {
  max-height: var(--sd-notes-max-h);
  opacity: 1;
  pointer-events: auto;
}
.sd-notes-inner {
  padding: 10px 18px 12px;
  font-size: 0.88rem;
  line-height: 1.65;
  color: rgba(198,199,189,.65);
  overflow-y: auto;            /* 卷軸只在 inner 顯示，不影響外層排版 */
  max-height: var(--sd-notes-max-h);
  box-sizing: border-box;
}
.sd-notes-label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(198,199,189,.35);
  margin-bottom: 5px;
}

/* ── 縮圖列 ───────────────────────────────────── */
.sd-thumbs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 4px;
  flex-shrink: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.15) transparent;
}
.sd-thumbs::-webkit-scrollbar { height: 4px; }
.sd-thumbs::-webkit-scrollbar-track { background: transparent; }
.sd-thumbs::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 2px; }

.sd-thumb {
  flex-shrink: 0;
  width: 88px;
  height: 52px;
  border-radius: 5px;
  border: 1.5px solid rgba(255,255,255,.1);
  background: #111;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color .18s, transform .18s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sd-thumb:hover {
  border-color: rgba(255,255,255,.35);
  transform: translateY(-1px);
}
.sd-thumb.is-active {
  border-width: 2px;
}
.sd-thumb-num {
  font-size: 0.65rem;
  font-weight: 700;
  opacity: .5;
  position: absolute;
  bottom: 3px;
  right: 5px;
  color: #C6C7BD;
}
.sd-thumb-label {
  font-size: 0.6rem;
  color: rgba(198,199,189,.55);
  padding: 4px 6px;
  line-height: 1.3;
  text-align: center;
  max-height: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* ── 控制列 ───────────────────────────────────── */
.sd-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
}

/* ── 箭頭按鈕 ─────────────────────────────────── */
.sd-arrow {
  border: none;
  border-radius: 50%;
  background: rgba(51,51,51,.85);
  color: #C6C7BD;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .18s, transform .18s, opacity .18s;
  flex-shrink: 0;
  line-height: 1;
}
.sd-arrow:hover:not(:disabled) {
  background: rgba(80,80,80,.95);
  transform: scale(1.08);
}
.sd-arrow:disabled {
  opacity: 0.25;
  cursor: default;
}

/* ── Dot 圓點 ─────────────────────────────────── */
.sd-dots {
  display: flex;
  align-items: center;
  gap: 7px;
}
.sd-dot {
  border-radius: 50%;
  background: rgba(198,199,189,.22);
  cursor: pointer;
  transition: all .25s;
  border: none;
  padding: 0;
  flex-shrink: 0;
}
.sd-dot.is-active {
  border-radius: 4px;
}
.sd-dot:hover:not(.is-active) {
  background: rgba(198,199,189,.45);
}

/* ── 備忘稿切換按鈕 ───────────────────────────── */
.sd-note-btn {
  border: none;
  background: rgba(51,51,51,.7);
  color: rgba(198,199,189,.55);
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .18s, color .18s;
  flex-shrink: 0;
}
.sd-note-btn:hover {
  background: rgba(80,80,80,.9);
  color: #C6C7BD;
}
.sd-note-btn.is-open {
  color: var(--sd-accent, #C8DD5A);
}

/* ── 自動播放指示 ─────────────────────────────── */
.sd-autoplay-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
}

/* ── 彩虹 Ring（background-clip 技術）─────────── */
/*
  .sd-rb-ring 插入在 .sd-stage 內部，inset:0。
  border-box 填彩虹 conic-gradient，
  padding-box 填底色覆蓋內部，
  只有邊框條帶露出七彩。border-width 控制粗細。
*/
.sd-rb-ring {
  position: absolute;
  inset: 0;
  border-radius: 9px;          /* 比 stage 少 1px，避免角落鋸齒 */
  border: 4px solid transparent; /* 粗細由 JS 覆蓋 */
  background:
    linear-gradient(var(--sd-stage-bg, #0C0D0C),
                    var(--sd-stage-bg, #0C0D0C)) padding-box,
    conic-gradient(
      #FF0000   0deg,
      #FF7F00  51deg,
      #FFEE00 103deg,
      #00CC44 154deg,
      #0055FF 206deg,
      #6600CC 257deg,
      #AA00DD 309deg,
      #FF0000 360deg
    ) border-box;
  z-index: 10;
  pointer-events: none;
  animation: sd-rb-ring-flash 0.45s ease-in-out infinite;
}
@keyframes sd-rb-ring-flash {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.1; }
}

/* ── 彩虹觸發按鈕 ─────────────────────────────── */
.sd-rainbow-btn {
  position: absolute;
  bottom: 6px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.18;
  line-height: 1;
  padding: 3px 5px;
  border-radius: 4px;
  transition: opacity .2s, transform .15s;
  color: #C6C7BD;
  user-select: none;
}
.sd-rainbow-btn:hover {
  opacity: 0.75;
  transform: scale(1.2);
}
.sd-rainbow-btn.is-firing {
  opacity: 1;
  animation: sd-rb-spin .6s linear infinite;
}
@keyframes sd-rb-spin {
  from { transform: rotate(0deg) scale(1.1); }
  to   { transform: rotate(360deg) scale(1.1); }
}

/* ── 備忘稿相對定位（供按鈕絕對定位用）────────── */
.sd-notes-panel { position: relative; }

/* ── 投影片切換動畫 ───────────────────────────── */
@keyframes sd-in-right {
  from { opacity: 0; transform: translateX(22px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes sd-in-left {
  from { opacity: 0; transform: translateX(-22px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes sd-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.sd-anim-right { animation: sd-in-right .28s cubic-bezier(.4,0,.2,1) both; }
.sd-anim-left  { animation: sd-in-left  .28s cubic-bezier(.4,0,.2,1) both; }
.sd-anim-fade  { animation: sd-fade-in  .2s  ease both; }

/* ── 緊湊 vs 寬鬆 padding / gap ──────────────── */
slide-demo:not([spacious]) .sd-frame          { padding: 18px 28px; gap: 12px; }
slide-demo:not([spacious]) .sd-controls       { padding: 6px 0; gap: 10px; }

slide-demo[spacious] .sd-frame               { padding: 32px 44px; gap: 20px; }
slide-demo[spacious] .sd-controls            { padding: 10px 0; gap: 14px; }
slide-demo[spacious]                         { --sd-notes-max-h: 180px; }

/* split 版型左右各自 padding */
slide-demo:not([spacious]) .sdl-split .sd-left-el,
slide-demo:not([spacious]) .sdl-split .sd-right-el { padding: 18px 22px; }

slide-demo[spacious] .sdl-split .sd-left-el,
slide-demo[spacious] .sdl-split .sd-right-el { padding: 28px 36px; }

/* ── 控制列尺寸：sm / md / lg ─────────────────── */
/* sm */
slide-demo[controls-size="sm"] .sd-arrow     { width: 28px; height: 28px; font-size: .9rem; }
slide-demo[controls-size="sm"] .sd-dot        { width: 6px;  height: 6px; }
slide-demo[controls-size="sm"] .sd-dot.is-active { width: 18px; }
slide-demo[controls-size="sm"] .sd-note-btn   { width: 26px; height: 26px; font-size: .8rem; }

/* md（預設） */
slide-demo:not([controls-size]) .sd-arrow,
slide-demo[controls-size="md"]  .sd-arrow    { width: 34px; height: 34px; font-size: 1.05rem; }
slide-demo:not([controls-size]) .sd-dot,
slide-demo[controls-size="md"]  .sd-dot      { width: 8px;  height: 8px; }
slide-demo:not([controls-size]) .sd-dot.is-active,
slide-demo[controls-size="md"]  .sd-dot.is-active { width: 22px; }
slide-demo:not([controls-size]) .sd-note-btn,
slide-demo[controls-size="md"]  .sd-note-btn { width: 32px; height: 32px; font-size: .95rem; }

/* lg */
slide-demo[controls-size="lg"] .sd-arrow     { width: 42px; height: 42px; font-size: 1.25rem; }
slide-demo[controls-size="lg"] .sd-dot        { width: 10px; height: 10px; }
slide-demo[controls-size="lg"] .sd-dot.is-active { width: 28px; }
slide-demo[controls-size="lg"] .sd-note-btn   { width: 40px; height: 40px; font-size: 1.1rem; }
    `.trim();
    (doc.head || doc.documentElement).appendChild(s);
  }

  /* ══════════════════════════════════════════════════
     Web Component
  ══════════════════════════════════════════════════ */
  class SlideDemo extends HTMLElement {

    constructor() {
      super();
      this._idx       = 0;       // 目前 slide 索引
      this._slides    = [];      // { el, note, layout, lineHeight, thumbLabel }
      this._timer     = null;    // autoplay timer
      this._rbTimer   = null;    // rainbow timer
      this._notesOpen = false;
      this._paused    = false;   // 滑鼠懸停暫停
      this._built     = false;
    }

    /* ── 屬性觀察 ─────────────────────────────── */
    static get observedAttributes() {
      return [
        'theme', 'height', 'width',
        'progress-bar', 'progress-bar-size',
        'autoplay', 'autoplay-loop',
        'thumbnails', 'thumbnails-position',
        'show-controls', 'show-arrows', 'show-dots', 'show-notes',
        'controls-position', 'controls-size',
        'spacious', 'line-height',
        'notes-gap', 'notes-height',
        'rainbow-duration', 'rainbow-brightness', 'rainbow-width',
      ];
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (this._built && oldVal !== newVal) this._rebuild();
    }

    connectedCallback() {
      this._parse();
      this._build();
      this._built = true;
      this._bindKeys();
      this._startAutoplay();
    }

    disconnectedCallback() {
      this._stopAutoplay();
      this._stopRainbow();
      doc.removeEventListener('keydown', this._keyHandler);
    }

    /* ══════════════════════════════════════════════
       解析子元素
    ══════════════════════════════════════════════ */
    _parse() {
      this._slides = [];
      const rawSlides = Array.from(this.querySelectorAll('sd-slide'));
      rawSlides.forEach((el, i) => {
        const noteEl    = el.querySelector('slide-note');
        const eyebrowEl = el.querySelector('sd-eyebrow');
        const titleEl   = el.querySelector('sd-title');
        const subtitleEl= el.querySelector('sd-subtitle');
        const bodyEl    = el.querySelector('sd-body');
        const leftEl    = el.querySelector('sd-left');
        const rightEl   = el.querySelector('sd-right');

        // 縮圖標籤：優先用 thumb-label 屬性，否則取 title 文字，再 fallback 序號
        const thumbLabel = el.getAttribute('thumb-label')
          || (titleEl ? titleEl.textContent.trim().slice(0, 30) : '')
          || String(i + 1);

        this._slides.push({
          layout:     el.getAttribute('layout') || 'center',
          lineHeight: el.getAttribute('line-height') || this.getAttribute('line-height') || '1.7',
          note:       noteEl    ? noteEl.innerHTML    : '',
          eyebrow:    eyebrowEl ? eyebrowEl.innerHTML : '',
          title:      titleEl   ? titleEl.innerHTML   : '',
          subtitle:   subtitleEl? subtitleEl.innerHTML: '',
          body:       bodyEl    ? bodyEl.innerHTML    : '',
          left:       leftEl    ? leftEl.innerHTML    : '',
          right:      rightEl   ? rightEl.innerHTML   : '',
          thumbLabel,
          raw:        el,   // 保留原始 el（供 blank 版型）
        });
      });
    }

    /* ══════════════════════════════════════════════
       建構 DOM
    ══════════════════════════════════════════════ */
    _build() {
      // 讀取設定
      const theme        = BRAND[this.getAttribute('theme')] || BRAND[DEFAULT_THEME];
      const height       = this.getAttribute('height') || '460px';
      const width        = this.getAttribute('width')  || '100%';
      const notesGap     = this.getAttribute('notes-gap') || '18px';
      const showProg     = this.getAttribute('progress-bar')    !== 'false';
      const progSize     = this.getAttribute('progress-bar-size') || '3px';
      const showCtrl     = this.getAttribute('show-controls')   !== 'false';
      const showArrows   = this.getAttribute('show-arrows')     !== 'false';
      const showDots     = this.getAttribute('show-dots')       !== 'false';
      const showNoteBtn  = this.getAttribute('show-notes')      !== 'false';
      const ctrlPos      = this.getAttribute('controls-position') || 'bottom';
      const showThumbs   = this.getAttribute('thumbnails')      === 'true';
      const thumbPos     = this.getAttribute('thumbnails-position') || 'bottom';

      // 清空
      this.innerHTML = '';
      this.style.setProperty('--sd-accent', theme.accent);
      this.style.width = width;
      // notes-height 屬性覆蓋預設值
      const notesHeight = this.getAttribute('notes-height');
      if (notesHeight) this.style.setProperty('--sd-notes-max-h', notesHeight);
      else this.style.removeProperty('--sd-notes-max-h'); // 還原讓 CSS 預設值生效

      // ── 進度條 ──────────────────────────────
      const progBar = doc.createElement('div');
      progBar.className = 'sd-progress';
      progBar.style.height = progSize;
      const progFill = doc.createElement('div');
      progFill.className = 'sd-progress-fill';
      progFill.style.background = theme.accent;
      progBar.appendChild(progFill);
      this._progFill = progFill;
      this._progBar  = progBar;
      if (!showProg) progBar.style.display = 'none';

      // ── 舞台 ────────────────────────────────
      const stage = doc.createElement('div');
      stage.className = 'sd-stage';
      stage.style.height = height;
      this._stage = stage;

      // ── 備忘稿區 ────────────────────────────
      const notesPanel = doc.createElement('div');
      notesPanel.className = 'sd-notes-panel';
      notesPanel.style.marginTop = notesGap;
      const notesLabel = doc.createElement('div');
      notesLabel.className = 'sd-notes-label';
      notesLabel.textContent = 'Speaker Notes';
      const notesInner = doc.createElement('div');
      notesInner.className = 'sd-notes-inner';
      // 彩虹按鈕
      const rbBtn = doc.createElement('button');
      rbBtn.className = 'sd-rainbow-btn';
      rbBtn.title = '彩虹框線動畫';
      rbBtn.innerHTML = '✦';
      rbBtn.addEventListener('click', () => this._triggerRainbow(rbBtn));
      this._rbBtn = rbBtn;
      notesPanel.appendChild(notesLabel);
      notesPanel.appendChild(notesInner);
      notesPanel.appendChild(rbBtn);
      this._notesPanel = notesPanel;
      this._notesInner = notesInner;

      // ── 縮圖列 ──────────────────────────────
      const thumbsEl = doc.createElement('div');
      thumbsEl.className = 'sd-thumbs';
      this._thumbsEl = thumbsEl;
      if (showThumbs) this._buildThumbs(theme);
      else thumbsEl.style.display = 'none';

      // ── 控制列 ──────────────────────────────
      const controls = doc.createElement('div');
      controls.className = 'sd-controls';
      if (!showCtrl) controls.style.display = 'none';

      // 左箭頭
      const prevBtn = doc.createElement('button');
      prevBtn.className = 'sd-arrow';
      prevBtn.innerHTML = '&#9664;';
      prevBtn.title = '上一張 (←)';
      if (!showArrows) prevBtn.style.display = 'none';
      prevBtn.addEventListener('click', () => this._go(this._idx - 1, 'left'));
      this._prevBtn = prevBtn;

      // Dots
      const dotsEl = doc.createElement('div');
      dotsEl.className = 'sd-dots';
      if (!showDots) dotsEl.style.display = 'none';
      this._dotsEl = dotsEl;
      this._buildDots(theme);

      // 右箭頭
      const nextBtn = doc.createElement('button');
      nextBtn.className = 'sd-arrow';
      nextBtn.innerHTML = '&#9654;';
      nextBtn.title = '下一張 (→ / Space)';
      if (!showArrows) nextBtn.style.display = 'none';
      nextBtn.addEventListener('click', () => this._go(this._idx + 1, 'right'));
      this._nextBtn = nextBtn;

      // 備忘稿按鈕
      const noteBtn = doc.createElement('button');
      noteBtn.className = 'sd-note-btn';
      noteBtn.innerHTML = '&#128203;';
      noteBtn.title = '備忘稿';
      if (!showNoteBtn) noteBtn.style.display = 'none';
      noteBtn.addEventListener('click', () => this._toggleNotes());
      this._noteBtn = noteBtn;

      controls.append(prevBtn, dotsEl, nextBtn, noteBtn);

      // ── 組合順序 ────────────────────────────
      const topItems    = [];
      const bottomItems = [];

      if (showProg)    topItems.push(progBar);
      if (ctrlPos === 'top')    topItems.push(controls);
      if (thumbPos === 'top')   topItems.push(thumbsEl);

      if (thumbPos === 'bottom') bottomItems.push(thumbsEl);
      if (ctrlPos === 'bottom')  bottomItems.push(controls);

      topItems.forEach(el => this.appendChild(el));
      this.appendChild(stage);
      this.appendChild(notesPanel);
      bottomItems.forEach(el => this.appendChild(el));

      // ── 滑鼠懸停暫停自動播放 ────────────────
      stage.addEventListener('mouseenter', () => { this._paused = true; });
      stage.addEventListener('mouseleave', () => { this._paused = false; });

      // ── 渲染第一張 ──────────────────────────
      this._render(0, null);
    }

    /* ══════════════════════════════════════════════
       建構縮圖
    ══════════════════════════════════════════════ */
    _buildThumbs(theme) {
      this._thumbsEl.innerHTML = '';
      this._thumbEls = [];
      this._slides.forEach((s, i) => {
        const t = doc.createElement('button');
        t.className = 'sd-thumb';
        if (i === this._idx) {
          t.classList.add('is-active');
          t.style.borderColor = theme ? theme.accent : '#C8DD5A';
        }
        const lbl = doc.createElement('div');
        lbl.className = 'sd-thumb-label';
        lbl.textContent = s.thumbLabel;
        const num = doc.createElement('span');
        num.className = 'sd-thumb-num';
        num.textContent = i + 1;
        t.appendChild(lbl);
        t.appendChild(num);
        t.addEventListener('click', () => this._go(i, i > this._idx ? 'right' : 'left'));
        this._thumbsEl.appendChild(t);
        this._thumbEls.push(t);
      });
    }

    /* ══════════════════════════════════════════════
       建構 Dots
    ══════════════════════════════════════════════ */
    _buildDots(theme) {
      this._dotsEl.innerHTML = '';
      this._dotEls = [];
      this._slides.forEach((_, i) => {
        const d = doc.createElement('button');
        d.className = 'sd-dot' + (i === this._idx ? ' is-active' : '');
        if (i === this._idx) {
          d.style.background = (theme || BRAND[DEFAULT_THEME]).accent;
          d.style.width = '';  // let CSS handle via .is-active
        }
        d.style.background = i === this._idx
          ? (theme || BRAND[DEFAULT_THEME]).accent
          : '';
        d.addEventListener('click', () => this._go(i, i > this._idx ? 'right' : 'left'));
        this._dotsEl.appendChild(d);
        this._dotEls.push(d);
      });
    }

    /* ══════════════════════════════════════════════
       渲染 Slide
    ══════════════════════════════════════════════ */
    _render(idx, direction) {
      const s     = this._slides[idx];
      const theme = BRAND[this.getAttribute('theme')] || BRAND[DEFAULT_THEME];
      if (!s) return;

      // 清空舞台
      this._stage.innerHTML = '';

      // Frame
      const frame = doc.createElement('div');
      frame.className = 'sd-frame sdl-' + s.layout;
      frame.style.lineHeight = s.lineHeight;
      frame.style.color = '#C6C7BD';

      // 套用動畫
      if (direction === 'right') frame.classList.add('sd-anim-right');
      else if (direction === 'left') frame.classList.add('sd-anim-left');
      else if (direction === 'fade') frame.classList.add('sd-anim-fade');

      // 依版型渲染
      switch (s.layout) {
        case 'center':
          this._renderCenter(frame, s, theme);
          break;
        case 'sentence':
          this._renderSentence(frame, s, theme);
          break;
        case 'split':
          this._renderSplit(frame, s, theme);
          break;
        case 'blank':
        default:
          this._renderBlank(frame, s);
          break;
      }

      this._stage.appendChild(frame);

      // 備忘稿內容
      this._notesInner.innerHTML = s.note || '<span style="opacity:.35;font-style:italic">（本張無備忘稿）</span>';

      // 進度條
      const pct = this._slides.length > 1
        ? ((idx + 1) / this._slides.length) * 100
        : 100;
      if (this._progFill) this._progFill.style.width = pct + '%';

      // 更新 dots
      this._dotEls && this._dotEls.forEach((d, i) => {
        const active = i === idx;
        d.classList.toggle('is-active', active);
        d.style.background = active ? theme.accent : '';
      });

      // 更新縮圖
      this._thumbEls && this._thumbEls.forEach((t, i) => {
        const active = i === idx;
        t.classList.toggle('is-active', active);
        t.style.borderColor = active ? theme.accent : '';
      });
      if (this._thumbEls && this._thumbEls[idx]) {
        this._thumbEls[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }

      // 箭頭
      if (this._prevBtn) this._prevBtn.disabled = idx === 0;
      if (this._nextBtn) this._nextBtn.disabled = idx === this._slides.length - 1;
    }

    /* ── 版型：center ─────────────────────────── */
    _renderCenter(frame, s, theme) {
      if (s.eyebrow) {
        const el = doc.createElement('div');
        el.className = 'sd-eyebrow-el';
        el.style.color = theme.accent;
        el.innerHTML = s.eyebrow;
        frame.appendChild(el);
      }
      if (s.title) {
        const el = doc.createElement('div');
        el.className = 'sd-title-el';
        el.style.color = theme.text;
        el.innerHTML = s.title;
        frame.appendChild(el);
      }
      if (s.subtitle) {
        const el = doc.createElement('div');
        el.className = 'sd-subtitle-el';
        el.innerHTML = s.subtitle;
        frame.appendChild(el);
      }
      if (s.body) {
        const el = doc.createElement('div');
        el.className = 'sd-body-el';
        el.innerHTML = s.body;
        frame.appendChild(el);
      }
    }

    /* ── 版型：sentence ───────────────────────── */
    _renderSentence(frame, s, theme) {
      if (s.eyebrow) {
        const el = doc.createElement('div');
        el.className = 'sd-eyebrow-el';
        el.style.color = theme.accent;
        el.innerHTML = s.eyebrow;
        frame.appendChild(el);
      }
      if (s.title) {
        const el = doc.createElement('div');
        el.className = 'sd-title-el';
        el.style.color = theme.text;
        el.innerHTML = s.title;
        frame.appendChild(el);
      }
      if (s.body) {
        const el = doc.createElement('div');
        el.className = 'sd-body-el';
        el.innerHTML = s.body;
        frame.appendChild(el);
      }
    }

    /* ── 版型：split ──────────────────────────── */
    _renderSplit(frame, s, theme) {
      const leftEl = doc.createElement('div');
      leftEl.className = 'sd-left-el';
      leftEl.innerHTML = s.left;
      const rightEl = doc.createElement('div');
      rightEl.className = 'sd-right-el';
      rightEl.innerHTML = s.right;
      frame.appendChild(leftEl);
      frame.appendChild(rightEl);
    }

    /* ── 版型：blank ──────────────────────────── */
    _renderBlank(frame, s) {
      // 直接複製原始 sd-slide 的內容（排除 slide-note）
      const clone = s.raw.cloneNode(true);
      clone.querySelectorAll('slide-note').forEach(n => n.remove());
      // 讓子元素顯示
      Array.from(clone.children).forEach(c => {
        c.style.display = '';
      });
      clone.style.display = 'contents';
      frame.appendChild(clone);
    }

    /* ══════════════════════════════════════════════
       導航
    ══════════════════════════════════════════════ */
    _go(idx, direction) {
      if (idx < 0 || idx >= this._slides.length || idx === this._idx) return;
      const prev = this._idx;
      this._idx = idx;
      this._render(idx, direction || (idx > prev ? 'right' : 'left'));

      // autoplay：跳到最後一張時停止（除非 loop）
      const loop = this.getAttribute('autoplay-loop') === 'true';
      if (idx === this._slides.length - 1 && !loop) {
        this._stopAutoplay();
      }
    }

    /* ══════════════════════════════════════════════
       彩虹框線動畫
    ══════════════════════════════════════════════ */
    _triggerRainbow(btn) {
      // 已在播放 → 提前停止
      if (this._rbTimer || this._rbRing) {
        this._stopRainbow(btn);
        return;
      }

      const duration   = parseFloat(this.getAttribute('rainbow-duration')   || '3');
      const brightness = parseFloat(this.getAttribute('rainbow-brightness')  || '1');
      const thickness  = this.getAttribute('rainbow-width') || '5px';

      // 隱藏進度條
      if (this._progBar) this._progBar.style.visibility = 'hidden';

      // 建立 ring 元素（插入 stage 內部最前面）
      const ring = doc.createElement('div');
      ring.className = 'sd-rb-ring';
      ring.style.borderWidth = thickness;
      if (brightness !== 1) ring.style.filter = `brightness(${brightness})`;
      this._stage.insertBefore(ring, this._stage.firstChild);
      this._rbRing = ring;

      if (btn) btn.classList.add('is-firing');

      this._rbTimer = setTimeout(() => this._stopRainbow(btn), duration * 1000);
    }

    _stopRainbow(btn) {
      if (this._rbTimer) { clearTimeout(this._rbTimer); this._rbTimer = null; }
      if (this._rbRing)  { this._rbRing.remove(); this._rbRing = null; }
      if (this._progBar) this._progBar.style.visibility = '';
      if (btn) btn.classList.remove('is-firing');
    }

    /* ══════════════════════════════════════════════
       備忘稿開關
    ══════════════════════════════════════════════ */
    _toggleNotes() {
      this._notesOpen = !this._notesOpen;
      this._notesPanel.classList.toggle('is-open', this._notesOpen);
      if (this._noteBtn) this._noteBtn.classList.toggle('is-open', this._notesOpen);
    }

    /* ══════════════════════════════════════════════
       自動播放
    ══════════════════════════════════════════════ */
    _startAutoplay() {
      const sec = parseFloat(this.getAttribute('autoplay') || '0');
      if (!sec || sec <= 0) return;
      this._stopAutoplay();
      this._timer = setInterval(() => {
        if (this._paused) return;
        const next = this._idx + 1;
        const loop = this.getAttribute('autoplay-loop') === 'true';
        if (next >= this._slides.length) {
          if (loop) this._go(0, 'right');
          else this._stopAutoplay();
        } else {
          this._go(next, 'right');
        }
      }, sec * 1000);
    }

    _stopAutoplay() {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
    }

    /* ══════════════════════════════════════════════
       鍵盤導航
    ══════════════════════════════════════════════ */
    _bindKeys() {
      this._keyHandler = (e) => {
        // 只在元件獲得焦點或無其他 input 聚焦時響應
        const active = doc.activeElement;
        const isInput = active && ['INPUT','TEXTAREA','SELECT'].includes(active.tagName);
        if (isInput) return;
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          this._go(this._idx + 1, 'right');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this._go(this._idx - 1, 'left');
        }
      };
      doc.addEventListener('keydown', this._keyHandler);
    }

    /* ══════════════════════════════════════════════
       重建（屬性變更時）
    ══════════════════════════════════════════════ */
    _rebuild() {
      const savedIdx = this._idx;
      this._stopAutoplay();
      this._stopRainbow(this._rbBtn);
      if (this._rbTimer) { clearTimeout(this._rbTimer); this._rbTimer = null; }
      this._parse();
      this._build();
      this._idx = Math.min(savedIdx, this._slides.length - 1);
      this._render(this._idx, null);
      this._startAutoplay();
    }

    /* ══════════════════════════════════════════════
       公開 API
    ══════════════════════════════════════════════ */
    next()    { this._go(this._idx + 1, 'right'); }
    prev()    { this._go(this._idx - 1, 'left'); }
    goTo(i)   { this._go(i, 'fade'); }
    rainbow() { this._triggerRainbow(this._rbBtn); }
    stopRainbow() { this._stopRainbow(this._rbBtn); }
  }

  /* ── 安全註冊 ─────────────────────────────────── */
  try {
    if (!customElements.get('slide-demo')) {
      customElements.define('slide-demo', SlideDemo);
    }
  } catch(e) {
    console.warn('[slide-demo] 元件註冊失敗：', e);
  }

}(window, document));

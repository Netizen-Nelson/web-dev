/**
 * answer-sheet.js — 答案卷 Web Component 套件 v3
 * ─────────────────────────────────────────────────
 *  <answer-sheet>  單選題答案卡
 *  <fill-sheet>    填空題答案卡
 *
 * 共用屬性：
 *   total, start-from, per-column, submit-url, submit-filename,
 *   answer-src, question-selector, theme, selected-color,
 *   hover-color, width, src
 *
 * <answer-sheet> 專用：options, option-case
 *
 * 全域預設（可選）：
 *   window.AnswerSheetConfig = { theme:'dark', selectedColor:'lavender', … }
 *
 * 公開 API（兩個元件皆有）：
 *   el.setAnswerKey({ "1":"a", … })
 *   el.getAnswers()
 *   el.reset()
 */
(function () {
  'use strict';

  /* ──────────────────────────── 品牌色盤 ─────────────────────────────── */
  const BRAND = {
    shell:    '#C6C7BD', lavender: '#C3A5E5', special:  '#C8DD5A',
    warning:  '#F08080', salmon:   '#E5C3B3', sky:      '#08A9D1',
    safe:     '#40C99A', vanilla:  '#DBEDD8', yellow:   '#DECA4B',
    focus:    '#A0CF72', info:     '#4285EB', stone:    '#95BDD7',
    indigo:   '#7B6CF0', pink:     '#FFB3D9', orange:   '#EDA109',
  };

  /* ──────────────────────────── 全域 CSS ─────────────────────────────── */
  const STYLE_ID = 'answer-sheet--styles';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
/* ── host ── */
answer-sheet, fill-sheet { display: block; }

/* ── 共用根容器 ── */
.sh-root {
  font-family: 'Courier New', Consolas, 'Liberation Mono', monospace;
  font-size: 1rem;
  border-radius: 8px;
  padding: 14px 16px 12px;
  box-sizing: border-box;
  user-select: none;
  position: relative;
  width: 100%;
  transition: background 0.25s, color 0.25s;
}
.sh-root *, .sh-root *::before, .sh-root *::after { box-sizing: border-box; }

/* ── 深色 ── */
.sh-dark  { background: #141614; color: #C6C7BD; border: 1px solid #252624; }
.sh-dark .sh-qnum        { color: #8A8B86; }   /* 原 #56574F，提高對比 */
.sh-dark .sh-qnum:hover  { color: #C6C7BD; }
.sh-dark .sh-divider     { background: #252624; }
.sh-dark .sh-footer      { border-top: 1px solid #252624; }
.sh-dark .sh-status      { color: #7A7B76; }   /* 原 #56574F */
.sh-dark .sh-btn-rst     { border-color: #3A3B37; color: #6A6B66; }
.sh-dark .sh-btn-rst:hover { border-color: #C6C7BD; color: #C6C7BD; }
.sh-dark .sh-result-bar  { background: #1A1B18; }
.sh-dark .sh-rb-skip     { color: #7A7B76; }   /* 原 #56574F */

/* ── 淺色 ── */
.sh-light { background: #ffffff; color: #111111; border: 1px solid #d6d6d6; }
.sh-light .sh-qnum       { color: #aaaaaa; }
.sh-light .sh-qnum:hover { color: #111111; }
.sh-light .sh-divider    { background: #e4e4e4; }
.sh-light .sh-footer     { border-top: 1px solid #eeeeee; }
.sh-light .sh-status     { color: #aaaaaa; }
.sh-light .sh-btn-rst    { border-color: #c0c0c0; color: #777777; }
.sh-light .sh-btn-rst:hover { border-color: #111; color: #111; }
.sh-light .sh-result-bar { background: #f5f5f5; }
.sh-light .sh-rb-skip    { color: #999999; }

/* ── 格線 ── */
.sh-grid {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 4px;
}
.sh-column { flex: 0 0 auto; display: flex; flex-direction: column; }
.sh-divider { width: 1px; flex: 0 0 1px; align-self: stretch; margin: 0 10px; }

/* ── 共用列 ── */
.sh-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  border-radius: 4px;
  white-space: nowrap;
  transition: background 0.22s, outline 0.22s;
}
.sh-row.sh-row-hl {
  background: rgba(8,169,209,.14);
  outline: 1px solid rgba(8,169,209,.30);
}

/* ── 題號 ── */
.sh-qnum {
  flex-shrink: 0;
  min-width: 2.4rem;
  text-align: right;
  padding-right: 6px;
  font-size: 1rem;
  cursor: pointer;
  line-height: 2rem;
  transition: color 0.15s;
}

/* ── 共用頁尾 ── */
.sh-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 9px;
}
.sh-status  { font-size: 1rem; }
.sh-actions { display: flex; gap: 7px; }

.sh-btn {
  padding: 5px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit;
  border: 1.5px solid;
  line-height: 1.4;
  transition: filter 0.15s, transform 0.1s;
}
.sh-btn:hover:not(:disabled)  { filter: brightness(1.2); }
.sh-btn:active:not(:disabled) { transform: scale(0.96); }
.sh-btn:disabled { opacity: 0.38; cursor: default; }
.sh-btn-sub {
  background: var(--sh-selected);
  border-color: var(--sh-selected);
  color: #0C0D0C;
  font-weight: 700;
}
.sh-btn-rst { background: transparent; }

/* ── 共用提示 ── */
.sh-alert {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 1rem;
  border: 1px solid transparent;
  min-height: 0; max-height: 0;
  overflow: hidden; opacity: 0;
  transition: max-height 0.25s, opacity 0.25s;
}
.sh-alert.sh-alert-show { min-height: 2.5rem; max-height: 5rem; opacity: 1; }
.sh-alert-w { background: rgba(240,128,128,.12); border-color: #F08080; color: #F08080; }
.sh-alert-s { background: rgba(64,201,154,.12);  border-color: #40C99A; color: #40C99A; }

/* ── 共用結果列 ── */
.sh-result-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  padding: 9px 14px;
  border-radius: 6px;
  font-size: 1rem;
}
.sh-rb-ok    { color: #40C99A; font-weight: 700; }
.sh-rb-err   { color: #F08080; font-weight: 700; }
.sh-rb-score { margin-left: auto; font-weight: 800; font-size: 1.1rem; }

/* ── 載入中 ── */
.sh-loading { padding: 20px 16px; font-size: 1rem; opacity: 0.45; }

/* ── 外部題目 highlight（注入到 document） ── */
.sh-q-hl {
  outline: 2px solid #08A9D1 !important;
  outline-offset: 3px;
  border-radius: 4px;
}

/* ══════════════════════════════════════════
   <answer-sheet> 單選題專用
   ══════════════════════════════════════════ */
.as-options { display: flex; gap: 5px; flex-shrink: 0; }

.as-opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem; height: 2rem;
  min-width: 1rem; min-height: 1rem;
  border-radius: 50%;
  border: 1.5px solid;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.13s, border-color 0.13s, color 0.13s, transform 0.1s;
}
.sh-dark  .as-opt { border-color: #5A5B57; color: #C6C7BD; }   /* 原 #3A3B37 */
.sh-light .as-opt { border-color: #b8b8b8; color: #222222; }

.sh-root:not(.sh-graded) .as-opt:hover {
  border-color: var(--sh-focus);
  color: var(--sh-focus);
  transform: scale(1.13);
}
.sh-graded .as-opt { cursor: default; }

.as-opt.as-sel   { background: var(--sh-selected) !important; border-color: var(--sh-selected) !important; color: #0C0D0C !important; }
.as-opt.as-g-ok  { background: #40C99A !important; border-color: #40C99A !important; color: #0C0D0C !important; }
.as-opt.as-g-err { background: #F08080 !important; border-color: #F08080 !important; color: #0C0D0C !important; }
.as-opt.as-g-hint { background: transparent !important; border: 2px dashed #40C99A !important; color: #40C99A !important; }

/* ══════════════════════════════════════════
   <fill-sheet> 填空題專用
   ══════════════════════════════════════════ */

/* 填空列允許換行，題號垂直置頂對齊 input */
.sh-row.fs-row { white-space: normal; align-items: flex-start; }

.fs-field {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 4px;
}

.fs-input {
  width: 100%;
  background: transparent;
  border: 1.5px solid;
  border-radius: 5px;
  padding: 5px 9px;
  font-size: 1rem;
  font-family: inherit;
  color: inherit;
  outline: none;
  min-width: 8rem;
  transition: border-color 0.15s, background 0.15s;
}
.sh-dark  .fs-input { border-color: #5A5B57; }   /* 原 #3A3B37 */
.sh-light .fs-input { border-color: #b8b8b8; }

/* hover（未批改、未聚焦）→ hover 色 */
.sh-root:not(.sh-graded) .fs-input:hover {
  border-color: var(--sh-focus);
}
/* focus → hover 色 */
.fs-input:focus { border-color: var(--sh-focus); }
/* 已填入值（等同圓圈選中）→ 選中色；批改後由 grade class 接管 */
.fs-input.fs-has-value:not(.fs-g-ok):not(.fs-g-err):not(.fs-g-skip) {
  border-color: var(--sh-selected);
}
.fs-input[readonly] { cursor: default; }

/* input 批改狀態 */
.fs-input.fs-g-ok   { border-color: #40C99A !important; background: rgba(64,201,154,.08) !important; }
.fs-input.fs-g-err  { border-color: #F08080 !important; background: rgba(240,128,128,.08) !important; }
.fs-input.fs-g-skip { border: 1.5px dashed #40C99A !important; }

/* 正確答案提示（input 下方） */
.fs-hint { font-size: 1rem; padding-left: 2px; color: #40C99A; line-height: 1.4; }
    `;
    document.head.appendChild(s);
  }

  /* ──────────────────────────── SheetBase ────────────────────────────── */
  class SheetBase extends HTMLElement {

    constructor() {
      super();
      this._uid    = 'sh' + Math.random().toString(36).slice(2, 9);
      this._ans    = {};
      this._key    = null;
      this._graded = false;
      this._cfg    = null;
      this._ql     = [];
      this._ready  = false;
      this._lastRb = null;
    }

    static get observedAttributes() {
      return [
        'src', 'total', 'answer-src', 'submit-url', 'submit-filename',
        'per-column', 'start-from', 'question-selector',
        'theme', 'selected-color', 'hover-color', 'width',
        'exam-id', 'note-1', 'note-2',
      ];
    }

    connectedCallback()        { this._boot(); }
    disconnectedCallback()     { this._teardownQL(); }
    attributeChangedCallback() { if (this._ready) this._boot(); }

    /* ── 公開 API ── */
    setAnswerKey(obj) { this._key = obj; }
    getAnswers()      { return { ...this._ans }; }
    reset()           { this._reset(); }

    /* ── 初始化（async 支援 fetch）── */
    async _boot() {
      this._ready = true;
      this._cfg   = this._parseCfg();
      this.innerHTML = '<div class="sh-loading">載入中…</div>';

      /* 1. 題目設定 JSON */
      if (this._cfg.src) {
        try {
          const r = await fetch(this._cfg.src);
          const d = await r.json();
          if (d.total)      this._cfg.total      = +d.total;
          if (d.options)    this._cfg.options     = +d.options;
          if (d.optionCase) this._cfg.optionCase  = d.optionCase;
          if (d.examId)     this._cfg.examId      = d.examId;   /* 後端可直接帶入試卷編號 */
        } catch (e) { console.warn('[SheetBase] src failed', e); }
      }

      /* 2. 答案金鑰 JSON */
      if (this._cfg.answerSrc && !this._key) {
        try {
          const r = await fetch(this._cfg.answerSrc);
          this._key = await r.json();
        } catch (e) { console.warn('[SheetBase] answer-src failed', e); }
      }

      /* 3. 初始化作答狀態（題號從 startFrom 開始）*/
      const n  = this._cfg.total || 0;
      const st = this._cfg.startFrom;
      const fresh = {};
      for (let i = st; i < st + n; i++) fresh[i] = this._ans[i] ?? null;
      this._ans = fresh;

      this._draw();
      this._bindQSel();
    }

    /* ── 設定合併（屬性 > 全域）── */
    _parseCfg() {
      const g = window.AnswerSheetConfig || {};
      const a = (k, def) => {
        const v = this.getAttribute(k);
        if (v !== null && v !== '') return v;
        const gk = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return g[gk] !== undefined ? g[gk] : def;
      };
      return {
        total:            +a('total', 0),
        options:          +a('options', 4),
        optionCase:        a('option-case', 'lower'),
        perColumn:        +a('per-column', 10),
        startFrom:        +a('start-from', 1),
        theme:             a('theme', 'dark'),
        selectedColor:     a('selected-color', 'lavender'),
        hoverColor:        a('hover-color', 'sky'),
        submitUrl:         a('submit-url', ''),
        submitFilename:    a('submit-filename', ''),
        questionSelector:  a('question-selector', ''),
        src:               a('src', ''),
        answerSrc:         a('answer-src', ''),
        width:             a('width', ''),
        examId:            a('exam-id',  ''),   /* 試卷編號，後端傳入或靜態設定 */
        note1:             a('note-1',   ''),   /* 備註欄 1（如作答者 ID）*/
        note2:             a('note-2',   ''),   /* 備註欄 2（如 session、班級等）*/
      };
    }

    /* ── 共用頁尾 HTML ── */
    _footerHtml() {
      return `
  <div class="sh-footer">
    <span class="sh-status" id="${this._uid}St"></span>
    <div class="sh-actions">
      <button class="sh-btn sh-btn-rst" id="${this._uid}Bt0">重設</button>
      <button class="sh-btn sh-btn-sub" id="${this._uid}Bt1">送出</button>
    </div>
  </div>
  <div class="sh-alert" id="${this._uid}Al"></div>
  <div class="sh-result-bar" id="${this._uid}Rb" style="display:none;"></div>`;
    }

    /* ── 綁定頁尾按鈕 ── */
    _bindFooter() {
      this.querySelector(`#${this._uid}Bt0`).addEventListener('click', () => this._reset());
      this.querySelector(`#${this._uid}Bt1`).addEventListener('click', () => this._submit());
    }

    /* ── 已作答計數 ── */
    _syncStatus() {
      const answered = Object.values(this._ans)
        .filter(v => v !== null && v !== '').length;
      const el = this.querySelector(`#${this._uid}St`);
      if (el) el.textContent = `已作答 ${answered} / ${this._cfg.total}`;
    }

    /* ── 共用格線建構（per-column + start-from）── */
    _buildGrid(rowFn, colMinW) {
      const c     = this._cfg;
      const n     = c.total;
      const st    = c.startFrom;
      const last  = st + n - 1;
      const cols  = Math.min(4, Math.max(1, Math.ceil(n / c.perColumn)));
      const perCo = c.perColumn;

      let html = '';
      for (let ci = 0; ci < cols; ci++) {
        if (ci > 0) html += '<div class="sh-divider"></div>';
        const s = st + ci * perCo;
        const e = Math.min(s + perCo - 1, last);
        let col = '';
        for (let q = s; q <= e; q++) col += rowFn(q);
        html += `<div class="sh-column" style="min-width:${colMinW};">${col}</div>`;
      }
      return html;
    }

    /* ── 送出 ── */
    async _submit() {
      const n   = this._cfg.total;
      const st  = this._cfg.startFrom;
      const answered = Object.values(this._ans)
        .filter(v => v !== null && v !== '').length;

      if (answered === 0) {
        this._toast('請至少作答一題再送出。', 'w');
        return;
      }

      const unanswered = [];
      for (let i = st; i < st + n; i++) {
        if (!this._ans[i]) unanswered.push(i);
      }

      const payload = {
        submittedAt: new Date().toISOString(),
        total: n, answered, unanswered,
        answers: { ...this._ans },
      };
      /* 試卷編號（後端傳入）*/
      if (this._cfg.examId)         payload.examId    = this._cfg.examId;
      /* 備註欄（可由頁面 JS 動態寫入，如登入者 ID、session 等）*/
      if (this._cfg.note1)          payload.note1     = this._cfg.note1;
      if (this._cfg.note2)          payload.note2     = this._cfg.note2;
      if (this._cfg.submitFilename) payload.filename  = this._cfg.submitFilename;

      const subBtn = this.querySelector(`#${this._uid}Bt1`);
      if (subBtn) subBtn.disabled = true;

      if (this._cfg.submitUrl) {
        try {
          const res = await fetch(this._cfg.submitUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json().catch(() => null);
          if (data?.answers && !this._key) this._key = data.answers;
        } catch (e) {
          this._toast('送出失敗：' + e.message, 'w');
          if (subBtn) subBtn.disabled = false;
          return;
        }
      }

      if (this._key) {
        this._grade();
      } else {
        this._toast('已送出。', 's');
      }
    }

    /* ── 批改（共用計分邏輯，子類提供 _isCorrectAnswer）── */
    _grade() {
      this._graded = true;
      const n  = this._cfg.total;
      const st = this._cfg.startFrom;
      let ok = 0, err = 0, skip = 0;

      for (let i = st; i < st + n; i++) {
        const u = this._ans[i];
        if (!u || u === '') skip++;
        else if (this._isCorrectAnswer(i)) ok++;
        else err++;
      }

      const pct  = n > 0 ? Math.round(ok / n * 100) : 0;
      const clr  = pct >= 60 ? '#40C99A' : '#F08080';
      this._lastRb = `
        <span class="sh-rb-ok">✓ 正確 ${ok}</span>
        <span class="sh-rb-err">✗ 錯誤 ${err}</span>
        <span class="sh-rb-skip">— 未作答 ${skip}</span>
        <span class="sh-rb-score" style="color:${clr};">得分 ${pct}%</span>`;

      this._draw();
      this._bindQSel();

      const rb = this.querySelector(`#${this._uid}Rb`);
      if (rb) { rb.style.display = 'flex'; rb.innerHTML = this._lastRb; }
    }

    /* 子類覆寫 */
    _isCorrectAnswer(/* q */) { return false; }
    _draw() {}

    /* ── 重設 ── */
    _reset() {
      this._graded = false;
      this._lastRb = null;
      const n  = this._cfg.total;
      const st = this._cfg.startFrom;
      this._ans = {};
      for (let i = st; i < st + n; i++) this._ans[i] = null;
      this._draw();
      this._bindQSel();
    }

    /* ── 捲動：元件 → 頁面題目 ── */
    _toQ(q) {
      const sel = this._cfg.questionSelector;
      if (!sel) return;
      const el = document.querySelector(`${sel}[data-q="${q}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('sh-q-hl');
      setTimeout(() => el.classList.remove('sh-q-hl'), 1600);
    }

    /* ── 捲動：頁面題目 → 元件列高亮 ── */
    _hlRow(q) {
      const row = this.querySelector(`#${this._uid}rw${q}`);
      if (!row) return;
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      row.classList.add('sh-row-hl');
      setTimeout(() => row.classList.remove('sh-row-hl'), 1600);
    }

    /* ── 頁面題目點擊綁定 ── */
    _bindQSel() {
      this._teardownQL();
      const sel = this._cfg.questionSelector;
      if (!sel) return;
      document.querySelectorAll(sel).forEach(el => {
        const q = +el.getAttribute('data-q');
        if (!q) return;
        const fn = () => this._hlRow(q);
        el.addEventListener('click', fn);
        this._ql.push({ el, fn });
      });
    }
    _teardownQL() {
      this._ql.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      this._ql = [];
    }

    /* ── Bootstrap-style 提示（替代 alert）── */
    _toast(msg, type) {
      const el = this.querySelector(`#${this._uid}Al`);
      if (!el) return;
      el.className = `sh-alert sh-alert-show sh-alert-${type}`;
      el.textContent = msg;
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => {
        el.className = 'sh-alert';
        el.textContent = '';
      }, 3500);
    }
  }

  /* ──────────────────────────── AnswerSheet ──────────────────────────── */
  class AnswerSheet extends SheetBase {

    static get observedAttributes() {
      return [...super.observedAttributes, 'options', 'option-case'];
    }

    /* 選項標籤（a b c d … 或 A B C D …）*/
    _labels() {
      const { options, optionCase } = this._cfg;
      return Array.from({ length: options }, (_, i) => {
        const c = String.fromCharCode(97 + i);
        return optionCase === 'upper' ? c.toUpperCase() : c;
      });
    }

    _draw() {
      this._teardownQL();
      const c      = this._cfg;
      const dark   = c.theme === 'dark';
      const selHex = BRAND[c.selectedColor] || BRAND.lavender;
      const hovHex = BRAND[c.hoverColor]    || BRAND.sky;
      const labels = this._labels();
      const wStyle = c.width ? `width:${c.width};` : '';

      /* 欄位最小寬度：題號 + 選項圓圈群 */
      const colMinW =
        `calc(2.4rem + 6px + ${c.options} * 2rem + ${c.options - 1} * 5px + 8px)`;

      const gridHtml = this._buildGrid(q => this._rowHtml(q, labels), colMinW);

      this.innerHTML = `
<div class="sh-root ${dark ? 'sh-dark' : 'sh-light'}${this._graded ? ' sh-graded' : ''}"
     style="--sh-selected:${selHex};--sh-focus:${hovHex};${wStyle}">
  <div class="sh-grid">${gridHtml}</div>
  ${this._footerHtml()}
</div>`;

      this._bindFooter();

      /* 圓圈點擊 */
      this.querySelectorAll('.as-opt').forEach(el =>
        el.addEventListener('click', () => {
          if (!this._graded) this._pick(+el.dataset.q, el.dataset.o);
        })
      );
      /* 題號點擊 → 捲到頁面題目 */
      this.querySelectorAll('.sh-qnum').forEach(el =>
        el.addEventListener('click', () => this._toQ(+el.dataset.q))
      );

      this._syncStatus();
      /* 批改後重繪時恢復結果列 */
      if (this._graded && this._lastRb) {
        const rb = this.querySelector(`#${this._uid}Rb`);
        if (rb) { rb.style.display = 'flex'; rb.innerHTML = this._lastRb; }
      }
    }

    _rowHtml(q, labels) {
      const sel  = this._ans[q];
      const opts = labels.map(l => {
        let cls = 'as-opt';
        if (sel === l) cls += ' as-sel';
        if (this._graded) {
          const g = this._gradeClass(q, l);
          if (g) cls += ' ' + g;
        }
        return `<span class="${cls}" data-q="${q}" data-o="${l}">${l}</span>`;
      }).join('');
      return `
<div class="sh-row" id="${this._uid}rw${q}" data-as-q="${q}">
  <span class="sh-qnum" data-q="${q}">${q}.</span>
  <span class="as-options">${opts}</span>
</div>`;
    }

    _gradeClass(q, opt) {
      if (!this._key) return '';
      const correct = this._key[q] ?? this._key[String(q)];
      const user    = this._ans[q];
      if (!user)           return opt === correct ? 'as-g-hint' : '';
      if (opt === correct) return 'as-g-ok';
      if (opt === user)    return 'as-g-err';
      return '';
    }

    _isCorrectAnswer(q) {
      if (!this._key) return false;
      const correct = this._key[q] ?? this._key[String(q)];
      return this._ans[q] === correct;
    }

    /* 選答（就地更新 DOM，不觸發整體重繪）*/
    _pick(q, opt) {
      this._ans[q] = (this._ans[q] === opt) ? null : opt;
      const row = this.querySelector(`#${this._uid}rw${q}`);
      if (row) {
        row.querySelectorAll('.as-opt').forEach(el =>
          el.classList.toggle('as-sel', el.dataset.o === this._ans[q])
        );
      }
      this._syncStatus();
    }
  }

  /* ──────────────────────────── FillSheet ────────────────────────────── */
  class FillSheet extends SheetBase {

    _draw() {
      this._teardownQL();
      const c      = this._cfg;
      const dark   = c.theme === 'dark';
      const selHex = BRAND[c.selectedColor] || BRAND.lavender;
      const hovHex = BRAND[c.hoverColor]    || BRAND.sky;
      const wStyle = c.width ? `width:${c.width};` : '';

      /* 填空欄位較窄（無多個圓圈），題號 + input 最小寬度 */
      const colMinW = 'calc(2.4rem + 6px + 9rem + 10px)';

      const gridHtml = this._buildGrid(q => this._rowHtml(q), colMinW);

      this.innerHTML = `
<div class="sh-root ${dark ? 'sh-dark' : 'sh-light'}${this._graded ? ' sh-graded' : ''}"
     style="--sh-selected:${selHex};--sh-focus:${hovHex};${wStyle}">
  <div class="sh-grid">${gridHtml}</div>
  ${this._footerHtml()}
</div>`;

      this._bindFooter();

      /* Input 即時同步到 this._ans，同步 fs-has-value class */
      this.querySelectorAll('.fs-input').forEach(el =>
        el.addEventListener('input', () => {
          this._ans[+el.dataset.q] = el.value || null;
          el.classList.toggle('fs-has-value', !!el.value);
          this._syncStatus();
        })
      );
      /* 題號點擊 → 捲到頁面題目 */
      this.querySelectorAll('.sh-qnum').forEach(el =>
        el.addEventListener('click', () => this._toQ(+el.dataset.q))
      );

      this._syncStatus();
      if (this._graded && this._lastRb) {
        const rb = this.querySelector(`#${this._uid}Rb`);
        if (rb) { rb.style.display = 'flex'; rb.innerHTML = this._lastRb; }
      }
    }

    _rowHtml(q) {
      const val  = this._escHtml(this._ans[q] || '');
      const info = this._graded ? this._gradeInfo(q) : null;
      /* fs-has-value 讓「已填入」狀態顯示選中色，與圓圈語意一致 */
      const hasVal = !!this._ans[q];
      const inpCls = 'fs-input'
        + (hasVal ? ' fs-has-value' : '')
        + (info   ? ' ' + info.cls  : '');
      const hint = info?.hint
        ? `<span class="fs-hint">${this._escHtml(info.hint)}</span>`
        : '';

      return `
<div class="sh-row fs-row" id="${this._uid}rw${q}" data-as-q="${q}">
  <span class="sh-qnum" data-q="${q}" style="line-height:2.4rem;">${q}.</span>
  <span class="fs-field">
    <input class="${inpCls}"
           data-q="${q}"
           type="text"
           value="${val}"
           autocomplete="off"
           spellcheck="false"
           ${this._graded ? 'readonly' : ''}>
    ${hint}
  </span>
</div>`;
    }

    /* 批改資訊：回傳 { cls, hint } 或 null */
    _gradeInfo(q) {
      if (!this._key) return null;
      const raw = this._key[q] ?? this._key[String(q)];
      if (raw == null) return null;

      const display = Array.isArray(raw) ? raw[0] : raw;
      const user    = (this._ans[q] || '').trim();

      if (!user)                     return { cls: 'fs-g-skip', hint: display };
      if (this._isCorrectAnswer(q))  return { cls: 'fs-g-ok',   hint: null };
      return { cls: 'fs-g-err', hint: `→ ${display}` };
    }

    /* 不分大小寫、trim；接受陣列（多個正解）*/
    _isCorrectAnswer(q) {
      if (!this._key) return false;
      const raw  = this._key[q] ?? this._key[String(q)];
      const user = (this._ans[q] || '').trim().toLowerCase();
      if (!raw || !user) return false;
      if (Array.isArray(raw)) return raw.some(k => k.trim().toLowerCase() === user);
      return raw.trim().toLowerCase() === user;
    }

    /* HTML 跳脫（防止 value 注入）*/
    _escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }

  /* ──────────────────────────── 注冊元件 ─────────────────────────────── */
  if (!customElements.get('answer-sheet')) customElements.define('answer-sheet', AnswerSheet);
  if (!customElements.get('fill-sheet'))   customElements.define('fill-sheet',   FillSheet);

})();

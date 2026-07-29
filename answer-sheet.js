/**
 * answer-sheet.js — 單選題答案卷 Web Component
 * -----------------------------------------------
 * 無 Shadow DOM，CSS+JS 合併，支援全域設定。
 *
 * 基本用法：
 *   <answer-sheet total="24" submit-url="/api/submit.php"
 *     question-selector=".question" selected-color="lavender"></answer-sheet>
 *
 * 全域預設 (可選)：
 *   window.AnswerSheetConfig = { theme:'dark', selectedColor:'lavender', ... }
 *
 * 公開 API：
 *   el.setAnswerKey({ "1":"a", "2":"b", ... })   // 設定正確答案
 *   el.getAnswers()                               // 取得目前作答 JSON
 *   el.reset()                                    // 重設
 */
(function () {
  'use strict';

  /* ── 品牌色盤 ─────────────────────────────────────────────────────────── */
  const BRAND = {
    shell:    '#C6C7BD',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#08A9D1',
    safe:     '#40C99A',
    vanilla:  '#DBEDD8',
    yellow:   '#DECA4B',
    focus:    '#A0CF72',
    info:     '#4285EB',
    stone:    '#95BDD7',
    indigo:   '#7B6CF0',
    pink:     '#FFB3D9',
    orange:   '#EDA109',
  };

  /* ── 全域 CSS（只注入一次）──────────────────────────────────────────────── */
  const STYLE_ID = 'answer-sheet--styles';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = /* css */`
/* ───── host ───── */
answer-sheet { display: block; }

/* ───── root container ───── */
.as-root {
  font-family: 'Courier New', Consolas, 'Liberation Mono', monospace;
  font-size: 1rem;          /* base = 16px */
  border-radius: 8px;
  padding: 14px 16px 12px;
  box-sizing: border-box;
  user-select: none;
  position: relative;
  transition: background 0.25s, color 0.25s;
  /* width可由屬性或外層CSS控制，預設 100% */
  width: 100%;
}
.as-root *, .as-root *::before, .as-root *::after { box-sizing: border-box; }

/* ── dark theme ── */
.as-dark {
  background: #141614;
  color: #C6C7BD;
  border: 1px solid #252624;
}
.as-dark .as-qnum           { color: #56574F; }
.as-dark .as-qnum:hover     { color: #C6C7BD; }
.as-dark .as-opt            { border-color: #3A3B37; color: #C6C7BD; }
.as-dark .as-divider        { background: #252624; }
.as-dark .as-footer         { border-top: 1px solid #252624; }
.as-dark .as-status         { color: #56574F; }
.as-dark .as-btn-rst        { border-color: #3A3B37; color: #6A6B66; }
.as-dark .as-btn-rst:hover  { border-color: #C6C7BD; color: #C6C7BD; }
.as-dark .as-result-bar     { background: #1A1B18; }
.as-dark .as-rb-skip        { color: #56574F; }

/* ── light theme ── */
.as-light {
  background: #ffffff;
  color: #111111;
  border: 1px solid #d6d6d6;
}
.as-light .as-qnum          { color: #aaaaaa; }
.as-light .as-qnum:hover    { color: #111111; }
.as-light .as-opt           { border-color: #b8b8b8; color: #222222; }
.as-light .as-divider       { background: #e4e4e4; }
.as-light .as-footer        { border-top: 1px solid #eeeeee; }
.as-light .as-status        { color: #aaaaaa; }
.as-light .as-btn-rst       { border-color: #c0c0c0; color: #777777; }
.as-light .as-btn-rst:hover { border-color: #111; color: #111; }
.as-light .as-result-bar    { background: #f5f5f5; }
.as-light .as-rb-skip       { color: #999999; }

/* ── grid ── */
.as-grid {
  display: flex;
  align-items: flex-start;
  gap: 0;
  /* 讓欄位不被壓縮；內容超出時顯示水平卷軸 */
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 4px;   /* 為卷軸留空間 */
}
.as-column {
  flex: 0 0 auto;        /* 絕不收縮 */
  display: flex;
  flex-direction: column;
  /* min-width 由 JS 依據選項數計算後以 inline style 注入 */
}
.as-divider {
  width: 1px;
  flex: 0 0 1px;
  align-self: stretch;
  margin: 0 10px;
}

/* ── row ── */
.as-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  border-radius: 4px;
  transition: background 0.22s, outline 0.22s;
  cursor: default;
  white-space: nowrap;   /* 防止圓圈換行 */
}
.as-row.as-row-hl {
  background: rgba(8, 169, 209, 0.14);
  outline: 1px solid rgba(8, 169, 209, 0.30);
}

/* ── question number ── */
.as-qnum {
  flex-shrink: 0;
  min-width: 2.4rem;      /* 足夠放 2 位數 + 句號 */
  text-align: right;
  padding-right: 6px;
  font-size: 1rem;         /* 16px */
  cursor: pointer;
  transition: color 0.15s;
  border-radius: 3px;
  line-height: 2rem;       /* 與圓圈同高 */
}

/* ── options wrapper ── */
.as-options {
  display: flex;
  gap: 5px;               /* 稍微加大間距避免貼合 */
  flex-shrink: 0;
}

/* ── single option circle ── */
.as-opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width:  2rem;            /* 32px = 2rem */
  height: 2rem;            /* 32px = 2rem */
  min-width:  1rem;        /* 最小 16px */
  min-height: 1rem;        /* 最小 16px */
  border-radius: 50%;
  border: 1.5px solid;
  cursor: pointer;
  font-size: 1rem;         /* 16px — 滿足最小字體要求 */
  font-weight: 700;
  letter-spacing: 0;
  background: transparent;
  transition: background 0.13s, border-color 0.13s, color 0.13s, transform 0.1s;
  line-height: 1;
  flex-shrink: 0;
}

/* hover (only when not graded) */
.as-root:not(.as-graded) .as-opt:hover {
  border-color: var(--as-hover);
  color: var(--as-hover);
  transform: scale(1.13);
}

/* selected */
.as-opt.as-sel {
  background: var(--as-selected) !important;
  border-color: var(--as-selected) !important;
  color: #0C0D0C !important;
}

/* graded — disable hover */
.as-graded .as-opt { cursor: default; }

/* grade result classes */
.as-opt.as-g-ok {
  background: #40C99A !important;
  border-color: #40C99A !important;
  color: #0C0D0C !important;
}
.as-opt.as-g-err {
  background: #F08080 !important;
  border-color: #F08080 !important;
  color: #0C0D0C !important;
}
.as-opt.as-g-hint {
  background: transparent !important;
  border: 2px dashed #40C99A !important;
  color: #40C99A !important;
}

/* ── footer ── */
.as-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 9px;
}
.as-status { font-size: 1rem; }
.as-actions { display: flex; gap: 7px; }

/* ── buttons ── */
.as-btn {
  padding: 5px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;         /* 16px */
  font-family: inherit;
  border: 1.5px solid;
  transition: filter 0.15s, transform 0.1s;
  line-height: 1.4;
}
.as-btn:hover:not(:disabled)   { filter: brightness(1.2); }
.as-btn:active:not(:disabled)  { transform: scale(0.96); }
.as-btn:disabled                { opacity: 0.38; cursor: default; }

.as-btn-sub {
  background: var(--as-selected);
  border-color: var(--as-selected);
  color: #0C0D0C;
  font-weight: 700;
}
.as-btn-rst { background: transparent; }

/* ── alert ── */
.as-alert {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 1rem;           /* 16px */
  border: 1px solid transparent;
  min-height: 0;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.25s, opacity 0.25s, padding 0.25s, margin 0.25s;
}
.as-alert.as-alert-show {
  min-height: 2.5rem;
  max-height: 5rem;
  opacity: 1;
  padding: 6px 12px;
}
.as-alert-w { background: rgba(240,128,128,.12); border-color: #F08080; color: #F08080; }
.as-alert-s { background: rgba(64,201,154,.12);  border-color: #40C99A; color: #40C99A; }

/* ── result bar ── */
.as-result-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  padding: 9px 14px;
  border-radius: 6px;
  font-size: 1rem;           /* 16px */
}
.as-rb-ok  { color: #40C99A; font-weight: 700; }
.as-rb-err { color: #F08080; font-weight: 700; }
.as-rb-score { margin-left: auto; font-weight: 800; font-size: 1.1rem; }

/* ── loading ── */
.as-loading {
  padding: 20px 16px;
  font-size: 1rem;           /* 16px */
  opacity: 0.45;
}

/* ── external question highlight ── */
.as-q-hl {
  outline: 2px solid #08A9D1 !important;
  outline-offset: 3px;
  border-radius: 4px;
}
    `;
    document.head.appendChild(s);
  }

  /* ── AnswerSheet 元件 ──────────────────────────────────────────────────── */
  class AnswerSheet extends HTMLElement {

    constructor() {
      super();
      this._uid  = 'as' + Math.random().toString(36).slice(2, 9);
      this._ans  = {};      // { 1: 'a' | null, … }
      this._key  = null;    // correct answer map
      this._graded  = false;
      this._cfg     = null;
      this._ql      = [];   // external question listeners
      this._ready   = false;
      this._lastRb  = null;
    }

    /* ── observed attributes ── */
    static get observedAttributes() {
      return [
        'src','total','answer-src','submit-url','submit-filename',
        'options','option-case','per-column','start-from',
        'question-selector','theme','selected-color','hover-color',
        'width',
      ];
    }

    connectedCallback()        { this._boot(); }
    disconnectedCallback()     { this._teardownQL(); }
    attributeChangedCallback() { if (this._ready) this._boot(); }

    /* ── public API ── */
    setAnswerKey(obj) { this._key = obj; }
    getAnswers()      { return { ...this._ans }; }
    reset()           { this._reset(); }

    /* ── boot (async to support fetch) ─────────────────────────────────── */
    async _boot() {
      this._ready = true;
      this._cfg = this._parseCfg();
      this.innerHTML = `<div class="as-loading">載入中…</div>`;

      /* 1. 取得題目設定 JSON */
      if (this._cfg.src) {
        try {
          const r    = await fetch(this._cfg.src);
          const data = await r.json();
          if (data.total)      this._cfg.total      = +data.total;
          if (data.options)    this._cfg.options     = +data.options;
          if (data.optionCase) this._cfg.optionCase  = data.optionCase;
        } catch (e) { console.warn('[AnswerSheet] src failed', e); }
      }

      /* 2. 取得答案金鑰 JSON */
      if (this._cfg.answerSrc && !this._key) {
        try {
          const r = await fetch(this._cfg.answerSrc);
          this._key = await r.json();
        } catch (e) { console.warn('[AnswerSheet] answer-src failed', e); }
      }

      /* 3. 初始化作答狀態（題號從 startFrom 開始）*/
      const n     = this._cfg.total || 0;
      const start = this._cfg.startFrom;
      const fresh = {};
      for (let i = start; i < start + n; i++) fresh[i] = this._ans[i] ?? null;
      this._ans = fresh;

      this._draw();
      this._bindQSel();
    }

    /* ── 合併設定（屬性 > 全域）──────────────────────────────────────── */
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
        theme:             a('theme', 'dark'),
        selectedColor:     a('selected-color', 'lavender'),
        hoverColor:        a('hover-color', 'sky'),
        submitUrl:         a('submit-url', ''),
        submitFilename:    a('submit-filename', ''),
        questionSelector:  a('question-selector', ''),
        src:               a('src', ''),
        answerSrc:         a('answer-src', ''),
        width:             a('width', ''),       /* e.g. "400px" "100%" "fit-content" */
        startFrom:        +a('start-from', 1),   /* 開始題號，預設 1 */
      };
    }

    /* ── 選項標籤 ── */
    _labels() {
      const { options, optionCase } = this._cfg;
      return Array.from({ length: options }, (_, i) => {
        const c = String.fromCharCode(97 + i);
        return optionCase === 'upper' ? c.toUpperCase() : c;
      });
    }

    /* ── 繪製整個元件 ─────────────────────────────────────────────────── */
    _draw() {
      this._teardownQL();
      const c       = this._cfg;
      const n       = c.total;
      const dark    = c.theme === 'dark';
      const selHex  = BRAND[c.selectedColor] || BRAND.lavender;
      const hovHex  = BRAND[c.hoverColor]    || BRAND.sky;
      const labels  = this._labels();

      /* 計算欄數：每欄 perColumn 題，最多 4 欄
         perCol 直接沿用使用者設定，不重新平均——
         最後一欄自動由 Math.min(s+perCol-1, n) 截斷即可 */
      const cols   = Math.min(4, Math.max(1, Math.ceil(n / c.perColumn)));
      const perCol = c.perColumn;
      const start  = c.startFrom;        /* 題號偏移 */
      const last   = start + n - 1;      /* 最後一題的題號 */

      /*
       * 每欄最小寬度計算：
       *  題號區：2.4rem + 6px padding-right
       *  選項區：options × 2rem + (options-1) × 5px 間距
       *  行左右 padding：8px
       */
      const colMinW = `calc(2.4rem + 6px + ${c.options} * 2rem + ${c.options - 1} * 5px + 8px)`;

      /* 建構欄位 HTML */
      let gridHtml = '';
      for (let ci = 0; ci < cols; ci++) {
        if (ci > 0) gridHtml += `<div class="as-divider"></div>`;
        const s = start + ci * perCol;
        const e = Math.min(s + perCol - 1, last);
        let colHtml = '';
        for (let q = s; q <= e; q++) colHtml += this._rowHtml(q, labels);
        gridHtml += `<div class="as-column" style="min-width:${colMinW};">${colHtml}</div>`;
      }

      /* width 屬性或 CSS 控制元件寬度 */
      const widthStyle = c.width ? `width:${c.width};` : '';

      this.innerHTML = /* html */`
<div class="as-root ${dark ? 'as-dark' : 'as-light'}${this._graded ? ' as-graded' : ''}"
     style="--as-selected:${selHex};--as-hover:${hovHex};${widthStyle}"
     id="${this._uid}R">
  <div class="as-grid">${gridHtml}</div>
  <div class="as-footer">
    <span class="as-status" id="${this._uid}St"></span>
    <div class="as-actions">
      <button class="as-btn as-btn-rst" id="${this._uid}Bt0">重設</button>
      <button class="as-btn as-btn-sub" id="${this._uid}Bt1">送出</button>
    </div>
  </div>
  <div class="as-alert" id="${this._uid}Al"></div>
  <div class="as-result-bar" id="${this._uid}Rb" style="display:none;"></div>
</div>`;

      /* 按鈕事件 */
      this.querySelector(`#${this._uid}Bt0`).addEventListener('click', () => this._reset());
      this.querySelector(`#${this._uid}Bt1`).addEventListener('click', () => this._submit());

      /* 選項圓圈事件 */
      this.querySelectorAll('.as-opt').forEach(el =>
        el.addEventListener('click', () => {
          if (!this._graded) this._pick(+el.dataset.q, el.dataset.o);
        })
      );

      /* 題號點擊 → 捲動到頁面題目 */
      this.querySelectorAll('.as-qnum').forEach(el =>
        el.addEventListener('click', () => this._toQ(+el.dataset.q))
      );

      this._syncStatus();

      /* 批改後重新繪製時恢復結果列 */
      if (this._graded && this._lastRb) {
        const rb = this.querySelector(`#${this._uid}Rb`);
        if (rb) { rb.style.display = 'flex'; rb.innerHTML = this._lastRb; }
      }
    }

    /* ── 單列 HTML ─────────────────────────────────────────────────────── */
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
<div class="as-row" id="${this._uid}rw${q}" data-as-q="${q}">
  <span class="as-qnum" data-q="${q}" title="跳到第 ${q} 題">${q}.</span>
  <span class="as-options">${opts}</span>
</div>`;
    }

    /* ── 批改樣式判斷 ── */
    _gradeClass(q, opt) {
      if (!this._key) return '';
      const correct = this._key[q] ?? this._key[String(q)];
      const user    = this._ans[q];
      if (!user)           return opt === correct ? 'as-g-hint' : '';
      if (opt === correct) return 'as-g-ok';
      if (opt === user)    return 'as-g-err';
      return '';
    }

    /* ── 選答案（直接更新 DOM，不重繪整體）─────────────────────────────── */
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

    _syncStatus() {
      const answered = Object.values(this._ans).filter(v => v !== null).length;
      const el = this.querySelector(`#${this._uid}St`);
      if (el) el.textContent = `已作答 ${answered} / ${this._cfg.total}`;
    }

    /* ── 送出 ──────────────────────────────────────────────────────────── */
    async _submit() {
      const n        = this._cfg.total;
      const answered = Object.values(this._ans).filter(v => v !== null).length;

      if (answered === 0) {
        this._toast('請至少作答一題再送出。', 'w');
        return;
      }

      const unanswered = [];
      const start = this._cfg.startFrom;
      for (let i = start; i < start + n; i++) if (!this._ans[i]) unanswered.push(i);

      const payload = {
        submittedAt: new Date().toISOString(),
        total: n, answered, unanswered,
        answers: { ...this._ans },
      };
      if (this._cfg.submitFilename) payload.filename = this._cfg.submitFilename;

      const subBtn = this.querySelector(`#${this._uid}Bt1`);
      if (subBtn) subBtn.disabled = true;

      /* 有設定後端才 POST */
      if (this._cfg.submitUrl) {
        try {
          const res  = await fetch(this._cfg.submitUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json().catch(() => null);
          /* 方案 B：後端 response 含 answers → 作為答案金鑰 */
          if (data?.answers && !this._key) this._key = data.answers;
        } catch (e) {
          this._toast('送出失敗：' + e.message, 'w');
          if (subBtn) subBtn.disabled = false;
          return;
        }
      }

      /* 批改 or 單純完成 */
      if (this._key) {
        this._grade();
      } else {
        this._toast('已送出。', 's');
        /* 避免重複送出 */
      }
    }

    /* ── 批改 ───────────────────────────────────────────────────────────── */
    _grade() {
      this._graded = true;
      const n = this._cfg.total;
      const start = this._cfg.startFrom;
      let ok = 0, err = 0, skip = 0;
      for (let i = start; i < start + n; i++) {
        const u = this._ans[i];
        const k = this._key[i] ?? this._key[String(i)];
        if (!u)          skip++;
        else if (u === k) ok++;
        else              err++;
      }
      const pct   = n > 0 ? Math.round(ok / n * 100) : 0;
      const clr   = pct >= 60 ? '#40C99A' : '#F08080';
      this._lastRb = /* html */`
        <span class="as-rb-ok">✓ 正確 ${ok}</span>
        <span class="as-rb-err">✗ 錯誤 ${err}</span>
        <span class="as-rb-skip">— 未作答 ${skip}</span>
        <span class="as-rb-score" style="color:${clr};">得分 ${pct}%</span>`;

      this._draw();
      this._bindQSel();

      const rb = this.querySelector(`#${this._uid}Rb`);
      if (rb) { rb.style.display = 'flex'; rb.innerHTML = this._lastRb; }
    }

    /* ── 重設 ───────────────────────────────────────────────────────────── */
    _reset() {
      this._graded = false;
      this._lastRb = null;
      const n = this._cfg.total;
      const start = this._cfg.startFrom;
      this._ans = {};
      for (let i = start; i < start + n; i++) this._ans[i] = null;
      this._draw();
      this._bindQSel();
    }

    /* ── 捲動到頁面題目 ── */
    _toQ(q) {
      const sel = this._cfg.questionSelector;
      if (!sel) return;
      const el = document.querySelector(`${sel}[data-q="${q}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('as-q-hl');
      setTimeout(() => el.classList.remove('as-q-hl'), 1600);
    }

    /* ── 高亮答案卡列 ── */
    _hlRow(q) {
      const row = this.querySelector(`#${this._uid}rw${q}`);
      if (!row) return;
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      row.classList.add('as-row-hl');
      setTimeout(() => row.classList.remove('as-row-hl'), 1600);
    }

    /* ── 綁定外部頁面題目點擊 ── */
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

    /* ── 訊息提示（替代 alert）── */
    _toast(msg, type) {
      const el = this.querySelector(`#${this._uid}Al`);
      if (!el) return;
      el.className = `as-alert as-alert-show as-alert-${type}`;
      el.textContent = msg;
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => {
        el.className = 'as-alert';
        el.textContent = '';
      }, 3500);
    }
  }

  if (!customElements.get('answer-sheet')) {
    customElements.define('answer-sheet', AnswerSheet);
  }
})();

class AnswerCard {
  static defaults = {
    /* 面板 */
    panelSide:          'right',      // 'right' | 'left'
    panelWidth:         '268px',      // 單欄寬度
    panelWidthTwoCol:   '450px',      // 雙欄寬度
    twoColumns:         false,
    panelPadding:       '14px',
    panelTitle:         '答案卡',
    panelTitleSize:     '0.95rem',

    /* 切換按鈕 */
    toggleOffsetTop:    '28vh',
    toggleSize:         '34px',

    /* 題目 */
    totalQuestions:     40,
    optionCount:        4,            // 2 ~ 5

    /* 圓圈 */
    circleSize:         '1.8rem',
    circleSizeTwoCol:   '1.4rem',
    borderWidth:        '2px',
    optionGap:          '12px',
    questionGap:        '6px',
    columnGap:          '8px',
    cellPaddingV:       '3px',
    cellPaddingH:       '3px',

    /* 字型 */
    fontSize:           '0.9rem',
    qNumFontSize:       '0.8rem',
    fontFamily:         'system-ui, sans-serif',

    /* 顏色：面板 */
    panelBg:            '#181918',
    headerBg:           '#0F100F',
    footerBg:           '#0F100F',
    dividerColor:       '#1A1B18',

    /* 顏色：文字 */
    titleColor:         '#C6C7BD',
    statsColor:         '#5A5B57',
    qNumColor:          '#4A4B47',
    qNumAnsweredColor:  '#C8DD5A',

    /* 顏色：圓圈 */
    circleBorderColor:  '#5E5E5C',
    circleTextColor:    '#6B6C68',
    hoverBg:            'rgba(195,165,229,0.10)',
    hoverBorder:        '#C3A5E5',
    hoverText:          '#C3A5E5',
    selectedBg:         '#C8DD5A',
    selectedBorder:     '#C8DD5A',
    selectedText:       '#0C0D0C',

    /* 顏色：Focus Ring */
    focusRingColor:     '#A0CF72',
    focusRingWidth:     '3px',
    focusRingOffset:    '3px',

    /* 顏色：切換按鈕 */
    toggleBg:           '#7B6CF0',
    toggleTextColor:    '#FFFFFF',
    progressTrack:      '#14150F',
    progressFill:       '#C8DD5A',

    /* 匯出按鈕 */
    exportLabel:        '匯出答案 JSON',
    exportFontSize:     '0.8rem',
    exportPadding:      '6px 12px',
    exportBg:           '#40C99A',
    exportHoverBg:      '#35B088',
    exportColor:        '#0C0D0C',
    exportFileName:     'answers',
    exportRadius:       '6px',

    /* 元資料（匯出 JSON 時固定輸出，即使為空字串） */
    note:               '',           // 自訂備註，可存放試卷 ID 等資訊
    memo:               '',           // 自訂備忘，可存放作答者 ID 等資訊

    /* 回呼 */
    onChange:           null,
  };

  static config(overrides) {
    Object.assign(AnswerCard.defaults, overrides);
  }

  constructor(opts = {}) {
    this.o       = { ...AnswerCard.defaults, ...opts };
    this.answers = {};
    this.isOpen  = false;
    this._id     = 'ac_' + Math.random().toString(36).slice(2, 8);
    this._init();
  }

  /* ── 面板有效寬度 ───────────────────────────────────────────── */
  _pw() {
    return this.o.twoColumns ? this.o.panelWidthTwoCol : this.o.panelWidth;
  }

  /* ══ CSS 生成 ══════════════════════════════════════════════════ */
  _css() {
    const o   = this.o;
    const id  = this._id;
    const s   = o.panelSide;
    const pw  = this._pw();
    const tx  = s === 'right' ? '100%' : '-100%';
    const tr  = s === 'right' ? '8px 0 0 8px' : '0 8px 8px 0';
    const sh  = s === 'right'
      ? '-6px 0 32px rgba(0,0,0,.75)'
      :  '6px 0 32px rgba(0,0,0,.75)';
    const cSz  = o.twoColumns ? o.circleSizeTwoCol : o.circleSize;
    const qnW  = o.twoColumns ? '1.25rem' : '1.8rem';
    const nRow = Math.ceil(o.totalQuestions / 2);

    /* 雙欄：直向填欄（左欄先填滿，右欄接續） */
    const gridCss = o.twoColumns
      ? `grid-template-columns:1fr 1fr;
         grid-auto-flow:column;
         grid-template-rows:repeat(${nRow},auto);
         column-gap:${o.columnGap};`
      : 'grid-template-columns:1fr;';

    return `
      /* ─ Panel ─────────────────────────────────── */
      #${id}-panel {
        position: fixed; top: 0; ${s}: 0;
        width: ${pw};
        height: 100vh; height: 100dvh;
        background: ${o.panelBg};
        display: flex; flex-direction: column;
        transform: translateX(${tx});
        transition: transform .3s cubic-bezier(.4,0,.2,1);
        z-index: 9000;
        font-family: ${o.fontFamily};
        box-shadow: ${sh};
      }
      #${id}-panel.ac-open { transform: translateX(0); }

      /* ─ Header ────────────────────────────────── */
      #${id}-hd {
        background: ${o.headerBg};
        padding: 12px ${o.panelPadding};
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid ${o.dividerColor};
        flex-shrink: 0;
      }
      #${id}-hd-t {
        font-size: ${o.panelTitleSize}; font-weight: 700;
        color: ${o.titleColor}; letter-spacing: .03em;
      }
      #${id}-hd-s {
        font-size: .7rem; color: ${o.statsColor};
        font-variant-numeric: tabular-nums;
      }

      /* ─ Scrollable body ──────────────────────── */
      #${id}-bd {
        flex: 1; overflow-y: auto;
        padding: ${o.panelPadding};
        scrollbar-width: thin;
        scrollbar-color: #1E1F1C transparent;
      }
      #${id}-bd::-webkit-scrollbar { width: 3px; }
      #${id}-bd::-webkit-scrollbar-thumb {
        background: #1E1F1C; border-radius: 2px;
      }

      /* ─ Grid ──────────────────────────────────── */
      #${id}-grid {
        display: grid;
        ${gridCss}
        row-gap: ${o.questionGap};
      }

      /* ─ Question row ──────────────────────────── */
      .${id}-qr {
        display: flex; align-items: center;
        gap: ${o.optionGap};
        padding: ${o.cellPaddingV} ${o.cellPaddingH};
      }
      .${id}-qn {
        font-size: ${o.qNumFontSize};
        color: ${o.qNumColor};
        min-width: ${qnW};
        text-align: right;
        flex-shrink: 0;
        user-select: none;
        transition: color .2s;
        font-variant-numeric: tabular-nums;
        line-height: 1;
      }
      .${id}-qn.ans { color: ${o.qNumAnsweredColor}; }

      /* ─ Option circles ────────────────────────── */
      .${id}-opts {
        display: flex; gap: ${o.optionGap}; align-items: center;
      }
      .${id}-c {
        width: ${cSz}; height: ${cSz};
        border-radius: 50%;
        border: ${o.borderWidth} solid ${o.circleBorderColor};
        display: flex; align-items: center; justify-content: center;
        font-size: ${o.fontSize}; font-weight: 700;
        color: ${o.circleTextColor};
        cursor: pointer; background: transparent;
        transition:
          background .13s,
          border-color .13s,
          color .13s,
          transform .1s;
        flex-shrink: 0; user-select: none;
        outline: none;
        -webkit-appearance: none; appearance: none;
        padding: 0;
        font-family: ${o.fontFamily};
        line-height: 1;
      }
      .${id}-c:hover {
        background: ${o.hoverBg};
        border-color: ${o.hoverBorder};
        color: ${o.hoverText};
        transform: scale(1.15);
      }
      .${id}-c:focus-visible {
        outline: ${o.focusRingWidth} solid ${o.focusRingColor};
        outline-offset: ${o.focusRingOffset};
      }
      .${id}-c.sel {
        background: ${o.selectedBg};
        border-color: ${o.selectedBorder};
        color: ${o.selectedText};
        transform: scale(1.08);
      }
      .${id}-c.sel:hover {
        opacity: .82;
        transform: scale(1.08);
      }

      /* ─ Footer ────────────────────────────────── */
      #${id}-ft {
        background: ${o.footerBg};
        padding: 10px ${o.panelPadding};
        border-top: 1px solid ${o.dividerColor};
        flex-shrink: 0;
      }
      #${id}-exp {
        width: 100%;
        padding: ${o.exportPadding};
        background: ${o.exportBg};
        color: ${o.exportColor};
        border: none;
        border-radius: ${o.exportRadius};
        font-size: ${o.exportFontSize};
        font-weight: 700;
        cursor: pointer;
        font-family: ${o.fontFamily};
        transition: background .15s, transform .1s;
        letter-spacing: .02em;
      }
      #${id}-exp:hover  { background: ${o.exportHoverBg}; transform: translateY(-1px); }
      #${id}-exp:active { transform: translateY(0); }

      /* ─ Toggle button ─────────────────────────── */
      #${id}-tog {
        position: fixed;
        top: ${o.toggleOffsetTop};
        ${s}: 0;
        width: ${o.toggleSize};
        background: ${o.toggleBg};
        border: none; border-radius: ${tr};
        cursor: pointer;
        display: flex; flex-direction: column; align-items: center;
        padding: 10px 0 8px; gap: 7px;
        z-index: 9001;
        transition: ${s} .3s cubic-bezier(.4,0,.2,1);
        box-shadow: ${s === 'right' ? '-2px' : '2px'} 0 12px rgba(0,0,0,.55);
        -webkit-appearance: none; appearance: none;
      }
      #${id}-tog.ac-open { ${s}: ${pw}; }

      #${id}-tog-arr {
        color: ${o.toggleTextColor};
        font-size: .85rem; line-height: 1;
      }
      #${id}-tog-trk {
        width: 5px; height: 50px;
        background: ${o.progressTrack};
        border-radius: 3px; overflow: hidden;
        position: relative;
      }
      #${id}-tog-fill {
        position: absolute; bottom: 0; left: 0;
        width: 100%; height: 0%;
        background: ${o.progressFill};
        border-radius: 3px;
        transition: height .35s ease;
      }
      #${id}-tog-pct {
        font-size: .55rem;
        color: ${o.toggleTextColor};
        opacity: .65; line-height: 1;
        font-weight: 700;
        font-family: ${o.fontFamily};
        font-variant-numeric: tabular-nums;
      }
    `;
  }

  /* ══ DOM ═══════════════════════════════════════════════════════ */
  _injectStyles() {
    const el = document.createElement('style');
    el.id = `${this._id}-styles`;
    el.textContent = this._css();
    document.head.appendChild(el);
  }

  _buildDOM() {
    const { o } = this;
    const id     = this._id;
    const labels = ['A','B','C','D','E'].slice(0, o.optionCount);
    const s      = o.panelSide;
    const closedArr = s === 'right' ? '◀' : '▶';

    /* Panel */
    const panel = document.createElement('div');
    panel.id = `${id}-panel`;

    /* Header */
    const hd  = document.createElement('div');  hd.id  = `${id}-hd`;
    const hdT = document.createElement('span'); hdT.id = `${id}-hd-t`; hdT.textContent = o.panelTitle;
    const hdS = document.createElement('span'); hdS.id = `${id}-hd-s`; hdS.textContent = `0 / ${o.totalQuestions}`;
    hd.append(hdT, hdS);

    /* Body */
    const bd   = document.createElement('div'); bd.id   = `${id}-bd`;
    const grid = document.createElement('div'); grid.id = `${id}-grid`;

    for (let q = 1; q <= o.totalQuestions; q++) {
      const row = document.createElement('div');
      row.className = `${id}-qr`; row.dataset.q = q;

      const qn = document.createElement('span');
      qn.className = `${id}-qn`; qn.textContent = q;

      const optsDiv = document.createElement('div'); optsDiv.className = `${id}-opts`;

      labels.forEach(lbl => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = `${id}-c`;
        btn.textContent = lbl; btn.dataset.q = q; btn.dataset.o = lbl;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-label', `第${q}題 ${lbl}`);
        btn.setAttribute('aria-checked', 'false');
        optsDiv.appendChild(btn);
      });

      row.append(qn, optsDiv);
      grid.appendChild(row);
    }
    bd.appendChild(grid);

    /* Footer */
    const ft  = document.createElement('div'); ft.id = `${id}-ft`;
    const exp = document.createElement('button');
    exp.type = 'button'; exp.id = `${id}-exp`; exp.textContent = o.exportLabel;
    ft.appendChild(exp);

    panel.append(hd, bd, ft);

    /* Toggle button */
    const tog  = document.createElement('button');
    tog.type = 'button'; tog.id = `${id}-tog`;
    tog.setAttribute('aria-label', '切換答案卡');

    const arr  = document.createElement('span'); arr.id  = `${id}-tog-arr`; arr.textContent = closedArr;
    const trk  = document.createElement('div');  trk.id  = `${id}-tog-trk`;
    const fill = document.createElement('div');  fill.id = `${id}-tog-fill`;
    const pct  = document.createElement('span'); pct.id  = `${id}-tog-pct`; pct.textContent = '0%';
    trk.appendChild(fill);
    tog.append(arr, trk, pct);

    /* Mount */
    document.body.append(panel, tog);

    /* Cache references */
    this._panel   = panel;
    this._toggle  = tog;
    this._statsEl = hdS;
    this._arrowEl = arr;
    this._fillEl  = fill;
    this._pctEl   = pct;
    this._expBtn  = exp;
  }

  _bindEvents() {
    const id = this._id;

    this._toggle.addEventListener('click', () => this.toggle());

    this._panel.querySelectorAll(`.${id}-c`).forEach(btn => {
      btn.addEventListener('click', () => this._pick(+btn.dataset.q, btn.dataset.o));
    });

    this._expBtn.addEventListener('click', () => this._export());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  /* ══ 核心邏輯 ══════════════════════════════════════════════════ */
  _pick(q, opt) {
    const id = this._id;

    /* 再次點擊同選項 → 取消 */
    if (this.answers[q] === opt) {
      delete this.answers[q];
    } else {
      this.answers[q] = opt;
    }

    const sel = this.answers[q];

    /* 更新圓圈狀態 */
    this._panel.querySelectorAll(`.${id}-c[data-q="${q}"]`).forEach(btn => {
      const on = sel === btn.dataset.o;
      btn.classList.toggle('sel', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });

    /* 題號顏色：已作答 → 亮色 */
    const qrow = this._panel.querySelector(`.${id}-qr[data-q="${q}"]`);
    qrow?.querySelector(`.${id}-qn`)?.classList.toggle('ans', !!sel);

    this._sync();
    this.o.onChange?.(q, sel ?? null, { ...this.answers });
  }

  _sync() {
    const cnt = Object.keys(this.answers).length;
    const tot = this.o.totalQuestions;
    const pct = tot > 0 ? Math.round((cnt / tot) * 100) : 0;
    this._statsEl.textContent = `${cnt} / ${tot}`;
    this._fillEl.style.height = pct + '%';
    this._pctEl.textContent   = pct + '%';
  }

  _export() {
    const answers = {};
    for (let q = 1; q <= this.o.totalQuestions; q++) answers[q] = this.answers[q] ?? null;

    /* note 與 memo 固定輸出，即使為空字串 */
    const payload = {
      note:    this.o.note,
      memo:    this.o.memo,
      answers: answers,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href:     url,
      download: (this.o.exportFileName || 'answers') + '.json',
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  _init() {
    this._injectStyles();
    this._buildDOM();
    this._bindEvents();
  }

  /* ══ Public API ════════════════════════════════════════════════ */

  /** 切換面板開關 */
  toggle() { this.isOpen ? this.close() : this.open(); }

  /** 展開面板 */
  open() {
    this.isOpen = true;
    this._panel.classList.add('ac-open');
    this._toggle.classList.add('ac-open');
    this._arrowEl.textContent = this.o.panelSide === 'right' ? '▶' : '◀';
  }

  /** 收合面板 */
  close() {
    this.isOpen = false;
    this._panel.classList.remove('ac-open');
    this._toggle.classList.remove('ac-open');
    this._arrowEl.textContent = this.o.panelSide === 'right' ? '◀' : '▶';
  }

  /**
   * 回傳所有題目的答案（未作答為 null）
   * @returns {{ [q: number]: string|null }}
   */
  getAnswers() {
    const out = {};
    for (let q = 1; q <= this.o.totalQuestions; q++) out[q] = this.answers[q] ?? null;
    return out;
  }

  /**
   * 批次載入預存答案
   * @param {{ [q: number|string]: string|null }} data
   */
  setAnswers(data) {
    Object.entries(data).forEach(([q, v]) => {
      if (v !== null && v !== undefined && v !== '') this._pick(+q, String(v));
    });
  }

  /**
   * 回傳作答統計
   * @returns {{ total: number, answered: number, unanswered: number, percentage: number }}
   */
  getSummary() {
    const answered = Object.keys(this.answers).length;
    const total    = this.o.totalQuestions;
    return {
      total,
      answered,
      unanswered:  total - answered,
      percentage:  Math.round((answered / total) * 100),
    };
  }

  /** 清除所有答案，還原至初始狀態 */
  reset() {
    const id = this._id;
    this.answers = {};
    this._panel.querySelectorAll(`.${id}-c`).forEach(b => {
      b.classList.remove('sel');
      b.setAttribute('aria-checked', 'false');
    });
    this._panel.querySelectorAll(`.${id}-qn`).forEach(n => n.classList.remove('ans'));
    this._sync();
  }

  destroy() {
    this._panel.remove();
    this._toggle.remove();
    document.getElementById(`${this._id}-styles`)?.remove();
  }
}

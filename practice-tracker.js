(function (win, doc) {
  'use strict';

  const CSS_ID = '__practice-tracker-v1__';

  const BRAND = {
    bg:       '#0C0D0C',
    shell:    '#C6C7BD',
    lavender: '#C3A5E5',
    sky:      '#62C8F0',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    ocean:    '#0ABDC6',
    safe:     '#20C21D',
    teal:     '#0DA591',
    vanilla:  '#DBEDD8',
    yellow:   '#DECA4B',
    special:  '#C8DD5A',
    info:     '#79B6FA',
    indigo:   '#9B72CF',
    pink:     '#FFB3D9',
    orange:   '#EDA109',
  };

  /* ── 預設設定 ─────────────────────────────────────────── */
  const DEFAULTS = {
    prefix:          'ex-',          // section id 前綴
    position:        'bottom-right', // bottom-right / bottom-left / top-right / top-left
    offsetX:         '24px',
    offsetY:         '24px',
    panelWidth:      '220px',
    zIndex:          '999',
    collapsed:       false,          // 預設是否收合
    cellSize:        '16px',
    cellGap:         '6px',
    cellRadius:      '4px',
    cellsPerRow:     5,
    colorDone:       BRAND.safe,
    colorPending:    '#2a2b2a',
    colorPanel:      '#1a1b1a',
    colorText:       BRAND.shell,
    colorComplete:   BRAND.special,
    title:           '練習進度',
    labelDone:       '完成',
    completeText:    '全部完成',
    completeSubText: '',
    animateCell:     true,
    animateDuration: '0.3s',
    eventName:       'pt:stage-complete', // 手動觸發的自定義事件名
    watchStepper:    true,                // 是否監聽 bps:complete
  };

  const CFG = Object.assign({}, DEFAULTS, win.PracticeTrackerConfig || {});

  /* ── CSS 注入（只注一次）──────────────────────────────── */
  if (!doc.getElementById(CSS_ID)) {
    const s = doc.createElement('style');
    s.id = CSS_ID;
    s.textContent = `
/* 語意標籤：預設區塊排版 */
practice-tracker,
pt-header, pt-title, pt-toggle,
pt-body, pt-grid, pt-cell,
pt-count, pt-complete, pt-complete-sub {
  display: block;
  box-sizing: border-box;
}

/* ── 面板外框 ────────────────────────────────────────────── */
practice-tracker {
  position: fixed;
  width: var(--pt-width, 220px);
  background: var(--pt-panel-bg, #1a1b1a);
  border: 1px solid rgba(198,199,189,0.15);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
  font-family: 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
  font-size: 0.85rem;
  color: var(--pt-text, #C6C7BD);
  overflow: hidden;
  z-index: var(--pt-z, 999);
  transition: border-color 0.4s ease;
}
practice-tracker.pt-complete-state {
  border-color: rgba(200,221,90,0.45);
}

/* ── 標題列 ──────────────────────────────────────────────── */
pt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px 8px;
  border-bottom: 1px solid rgba(198,199,189,0.1);
  cursor: pointer;
  user-select: none;
}
pt-title {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  opacity: 0.8;
  text-transform: uppercase;
}
pt-toggle {
  font-size: 1rem;
  line-height: 1;
  opacity: 0.45;
  width: 16px;
  text-align: center;
  transition: opacity 0.2s;
  font-family: monospace;
}
pt-header:hover pt-toggle { opacity: 0.85; }

/* ── 主體（可收合）──────────────────────────────────────── */
pt-body {
  padding: 10px 12px 12px;
  overflow: hidden;
  transition:
    max-height 0.28s cubic-bezier(.4,0,.2,1),
    opacity    0.22s ease,
    padding    0.25s ease;
}
practice-tracker.is-collapsed pt-body {
  max-height: 0 !important;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  pointer-events: none;
}

/* ── 格子陣列 ────────────────────────────────────────────── */
pt-grid {
  display: grid;
  grid-template-columns: repeat(var(--pt-cols, 5), var(--pt-cell, 16px));
  gap: var(--pt-gap, 6px);
  margin-bottom: 8px;
}
pt-cell {
  width: var(--pt-cell, 16px);
  height: var(--pt-cell, 16px);
  border-radius: var(--pt-radius, 4px);
  background: var(--pt-pending, #2a2b2a);
  transition:
    background var(--pt-anim, 0.3s) ease,
    transform  var(--pt-anim, 0.3s) cubic-bezier(.34,1.56,.64,1);
}
pt-cell.is-done {
  background: var(--pt-done, #20C21D);
}
pt-cell.pt-pop {
  transform: scale(1.4);
}

/* ── 進度文字 ────────────────────────────────────────────── */
pt-count {
  font-size: 0.76rem;
  opacity: 0.55;
  margin-top: 2px;
  transition: opacity 0.3s;
}
practice-tracker.pt-complete-state pt-count {
  opacity: 0.3;
}

/* ── 完成訊息 ────────────────────────────────────────────── */
pt-complete {
  display: none;
  padding: 0 12px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--pt-complete-color, #C8DD5A);
  letter-spacing: 0.02em;
  line-height: 1.5;
}
practice-tracker.pt-complete-state pt-complete {
  display: block;
}
pt-complete-sub {
  font-size: 0.73rem;
  font-weight: 400;
  opacity: 0.7;
  margin-top: 2px;
}
    `;
    doc.head.appendChild(s);
  }

  /* ── 工具：CSS 變數套用 ───────────────────────────────── */
  function applyCSSVars(el) {
    el.style.setProperty('--pt-width',          CFG.panelWidth);
    el.style.setProperty('--pt-panel-bg',        CFG.colorPanel);
    el.style.setProperty('--pt-text',            CFG.colorText);
    el.style.setProperty('--pt-z',               String(CFG.zIndex));
    el.style.setProperty('--pt-cell',            CFG.cellSize);
    el.style.setProperty('--pt-gap',             CFG.cellGap);
    el.style.setProperty('--pt-radius',          CFG.cellRadius);
    el.style.setProperty('--pt-cols',            String(CFG.cellsPerRow));
    el.style.setProperty('--pt-done',            CFG.colorDone);
    el.style.setProperty('--pt-pending',         CFG.colorPending);
    el.style.setProperty('--pt-complete-color',  CFG.colorComplete);
    el.style.setProperty('--pt-anim',            CFG.animateCell ? CFG.animateDuration : '0s');
  }

  /* ── 工具：定位 ──────────────────────────────────────── */
  function applyPosition(el) {
    const pos = CFG.position || 'bottom-right';
    el.style.top    = pos.includes('top')    ? CFG.offsetY : 'auto';
    el.style.bottom = pos.includes('bottom') ? CFG.offsetY : 'auto';
    el.style.left   = pos.includes('left')   ? CFG.offsetX : 'auto';
    el.style.right  = pos.includes('right')  ? CFG.offsetX : 'auto';
  }

  /* ── 主流程 ──────────────────────────────────────────── */
  function init() {
    const sections = Array.from(
      doc.querySelectorAll(`section[id^="${CFG.prefix}"]`)
    );
    if (!sections.length) return;

    const total  = sections.length;
    const doneSet = new Set();
    const cells   = {};

    /* 建立 DOM 結構 */
    const tracker = doc.createElement('practice-tracker');
    applyCSSVars(tracker);
    applyPosition(tracker);
    if (CFG.collapsed) tracker.classList.add('is-collapsed');

    /* 標題列 */
    const header   = doc.createElement('pt-header');
    const titleEl  = doc.createElement('pt-title');
    const toggleEl = doc.createElement('pt-toggle');
    titleEl.textContent  = CFG.title;
    toggleEl.textContent = CFG.collapsed ? '+' : '−';
    header.appendChild(titleEl);
    header.appendChild(toggleEl);

    /* 主體 */
    const body = doc.createElement('pt-body');
    body.style.maxHeight = '300px';

    /* 格子陣列 */
    const grid = doc.createElement('pt-grid');
    sections.forEach(sec => {
      const cell = doc.createElement('pt-cell');
      cell.setAttribute('data-id', sec.id);
      cell.title = sec.id;
      grid.appendChild(cell);
      cells[sec.id] = cell;
    });

    /* 進度計數 */
    const countEl = doc.createElement('pt-count');
    countEl.textContent = `0 / ${total} ${CFG.labelDone}`;

    body.appendChild(grid);
    body.appendChild(countEl);

    /* 完成訊息 */
    const completeEl = doc.createElement('pt-complete');
    completeEl.textContent = CFG.completeText;
    if (CFG.completeSubText) {
      const sub = doc.createElement('pt-complete-sub');
      sub.textContent = CFG.completeSubText;
      completeEl.appendChild(sub);
    }

    tracker.appendChild(header);
    tracker.appendChild(body);
    tracker.appendChild(completeEl);
    doc.body.appendChild(tracker);

    /* 收合切換 */
    header.addEventListener('click', () => {
      const nowCollapsed = tracker.classList.toggle('is-collapsed');
      toggleEl.textContent = nowCollapsed ? '+' : '−';
      if (!nowCollapsed) body.style.maxHeight = '300px';
    });

    /* ── markDone：標記某階段完成 ─────────────────────── */
    function markDone(sectionId) {
      if (doneSet.has(sectionId)) return;
      if (!cells[sectionId]) return;

      doneSet.add(sectionId);

      const cell = cells[sectionId];
      cell.classList.add('is-done');

      /* 彈跳動畫 */
      if (CFG.animateCell) {
        cell.classList.add('pt-pop');
        setTimeout(() => cell.classList.remove('pt-pop'),
          parseFloat(CFG.animateDuration) * 1000 + 50);
      }

      /* 更新計數 */
      countEl.textContent = `${doneSet.size} / ${total} ${CFG.labelDone}`;

      /* 全部完成 */
      if (doneSet.size === total) {
        tracker.classList.add('pt-complete-state');
      }
    }

    /* ── 監聽 bps:complete（bp-stepper）──────────────── */
    if (CFG.watchStepper) {
      doc.addEventListener('bps:complete', (e) => {
        const sec = e.target.closest(`section[id^="${CFG.prefix}"]`);
        if (sec) markDone(sec.id);
      });
    }

    /* ── 監聽自定義事件 pt:stage-complete ────────────── */
    doc.addEventListener(CFG.eventName, (e) => {
      const id = e.detail && e.detail.sectionId;
      if (id) markDone(id);
    });

    /* 公開 API */
    win.PracticeTracker = { markDone, total, doneSet };
  }

  /* ── DOM 就緒後啟動 ──────────────────────────────────── */
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);

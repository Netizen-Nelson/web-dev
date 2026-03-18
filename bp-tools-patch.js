(function waitForBpTools() {

  if (!customElements.get('info-region')) {
    if ((waitForBpTools._tries = (waitForBpTools._tries || 0) + 1) > 200) {
      console.error('[bp-tools-patch] 等待逾時，請確認 bp-tools.js 已正確載入。');
      return;
    }
    setTimeout(waitForBpTools, 50);
    return;
  }

  /* ═══════════════════════════════════════════════════════════
     A. BPTools 全域事件匯流排
  ═══════════════════════════════════════════════════════════ */
  window.BPTools = {
    _listeners: {},
    on(eventName, callback) {
      if (!this._listeners[eventName]) this._listeners[eventName] = [];
      this._listeners[eventName].push(callback);
    },
    emit(eventName, data = {}) {
      (this._listeners[eventName] || []).forEach(fn => fn(data));
    },
    off(eventName, callback) {
      if (!this._listeners[eventName]) return;
      this._listeners[eventName] =
        this._listeners[eventName].filter(fn => fn !== callback);
    },
  };

  /* ═══════════════════════════════════════════════════════════
     B. InfoRegion 擴充：分支路徑 + link 發事件
  ═══════════════════════════════════════════════════════════ */
  if (!customElements.get('ir-choice')) {
    customElements.define('ir-choice', class extends HTMLElement {});
  }

  const irProto = customElements.get('info-region').prototype;
  const _orig_ir_onActivated = irProto._onActivated;
  const _orig_ir_reset       = irProto.reset;

  irProto._onActivated = function () {
    this._applyBorderStyles();

    const choiceEls = Array.from(this.querySelectorAll(':scope > ir-choice'));
    if (choiceEls.length > 0) { this._renderChoices(choiceEls); return; }

    const linkName = this.getAttribute('link');
    if (linkName) BPTools.emit(linkName, { id: this.id });

    _orig_ir_onActivated.call(this);
  };

  irProto._renderChoices = function (choiceEls) {
    this.querySelector('.ir-choices-wrap')?.remove();
    const cfg        = window.InfoRegionConfig || {};
    const selfColor  = this.getAttribute('color') || cfg.defaultColor || 'sky';
    const alignAttr  = this.getAttribute('choice-align') || 'left';
    const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
    const wrap = document.createElement('div');
    wrap.className    = 'ir-choices-wrap';
    wrap.style.cssText =
      'display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;' +
      'justify-content:' + (justifyMap[alignAttr] || 'flex-start') + ';';

    choiceEls.forEach(choiceEl => {
      const target    = choiceEl.getAttribute('target');
      const colorName = choiceEl.getAttribute('color') || selfColor;
      const iconClass = choiceEl.getAttribute('icon') || null;
      const label     = choiceEl.textContent.trim();
      if (!target) { console.warn('[bp-tools-patch] <ir-choice> 缺少 target'); return; }

      const btn = document.createElement('button');
      btn.className = 'ir-btn ir-btn--' + colorName;
      if (iconClass) {
        const i = document.createElement('i');
        i.className = 'bi bi-' + iconClass;
        i.style.marginRight = '5px';
        btn.appendChild(i);
      }
      btn.appendChild(document.createTextNode(label));

      btn.addEventListener('click', () => {
        wrap.remove();
        const targetEl = document.getElementById(target);
        if (!targetEl) { console.warn('[bp-tools-patch] 找不到 target=' + target); return; }
        targetEl._activatedBy = this.id;
        document.querySelectorAll('info-region[active="true"]').forEach(el => {
          if (el !== targetEl && el._activatedBy) el.reset();
        });
        const selfEl = this;
        setTimeout(() => selfEl.reset(), 30);
        if (targetEl.getAttribute('active') === 'true') {
          targetEl.reset();
          setTimeout(() => targetEl.activate(), 60);
        } else {
          setTimeout(() => targetEl.activate(), 60);
        }
      });

      wrap.appendChild(btn);
    });
    this.appendChild(wrap);
  };

  irProto.reset = function () {
    _orig_ir_reset.call(this);
    this.querySelector('.ir-choices-wrap')?.remove();
  };

  /* ═══════════════════════════════════════════════════════════
     C. DualCell 擴充：on-link 訂閱解鎖遮罩
  ═══════════════════════════════════════════════════════════ */
  const dcProto = DualCell.prototype;
  const _orig_dc_createCell = dcProto.createCell;
  const _orig_dc_parseCol   = dcProto.parseCol;

  dcProto.parseCol = function (el) {
    const colData    = _orig_dc_parseCol.call(this, el);
    colData.unlockOn = el?.getAttribute('on-link') || null;
    return colData;
  };

  dcProto.createCell = function (colData, rowIdx, colIdx) {
    const cell = _orig_dc_createCell.call(this, colData, rowIdx, colIdx);
    if (colData.unlockOn) {
      BPTools.on(colData.unlockOn, () => {
        cell.querySelectorAll('.dc-overlay').forEach(ov => ov.remove());
        cell.querySelector('.dc-content')?.classList.remove('blurred');
        cell.classList.remove('has-overlay');
      });
    }
    return cell;
  };

  /* ═══════════════════════════════════════════════════════════
     D. WordFlip 擴充
        覆蓋 connectedCallback，在原本初始化完成後掛載新功能。
        使用 capture 階段攔截 click，確保在原本 handler 之前執行。
  ═══════════════════════════════════════════════════════════ */

  /* 群組註冊表：group 名稱 → Set<element> */
  const _wfGroups = new Map();

  /* 注入 locked 狀態的 CSS（只注入一次） */
  if (!document.getElementById('wf-patch-styles')) {
    const s = document.createElement('style');
    s.id = 'wf-patch-styles';
    s.textContent = `
      word-flip.wf-bp-locked {
        opacity        : 0.35;
        cursor         : not-allowed !important;
        pointer-events : none;
        border-bottom-style: dashed !important;
      }
    `;
    document.head.appendChild(s);
  }

  const wfProto = customElements.get('word-flip').prototype;
  const _orig_wf_connectedCallback = wfProto.connectedCallback;

  wfProto.connectedCallback = function () {
    /* 先讓原本的初始化跑完（建立 click handler、套樣式等） */
    _orig_wf_connectedCallback.call(this);
    /* 再掛載我們的擴充 */
    this._bpInit();
  };

  wfProto._bpInit = function () {
    const linkName  = this.getAttribute('link');
    const answerSrc = this.getAttribute('answer-src');
    const unlockOn  = this.getAttribute('unlock-on');
    const group     = this.getAttribute('group');

    /* ── answer-src：把外部元素的 innerHTML 存起來備用 ── */
    if (answerSrc) {
      const id   = answerSrc.startsWith('#') ? answerSrc.slice(1) : answerSrc;
      const srcEl = document.getElementById(id);
      if (srcEl) {
        this._bpAnswerHtml = srcEl.innerHTML;
      } else {
        console.warn('[bp-tools-patch] answer-src 找不到 id="' + id + '"');
      }
    }

    /* ── unlock-on：預設鎖定 ── */
    if (unlockOn) {
      this.classList.add('wf-bp-locked');
      BPTools.on(unlockOn, () => {
        this.classList.remove('wf-bp-locked');
      });
    }

    /* ── group：加入群組 ── */
    if (group) {
      if (!_wfGroups.has(group)) _wfGroups.set(group, new Set());
      _wfGroups.get(group).add(this);
    }

    /* ── capture 階段：在原本 handler 之前執行 ──
       處理 answer-src 內容注入、群組互斥邏輯。              */
    this.addEventListener('click', (e) => {

      /* answer-src：翻開前把 answer 屬性換成 HTML 內容。
         原本的 handler 會讀 answer 屬性顯示，所以要在它之前設好。
         但 answer 屬性只能放文字；HTML 版的換法在下方 bubble 階段。 */
      if (this._bpAnswerHtml && !this.classList.contains('wf-flipped')) {
        /* 暫時把屬性設成純文字佔位，真正的 HTML 替換在 bubble 階段 */
        this.setAttribute('answer', '▌');
      }

      /* group 互斥：準備翻開時，先關掉同組其他已展開的 */
      if (group && !this.classList.contains('wf-flipped') && _wfGroups.has(group)) {
        _wfGroups.get(group).forEach(el => {
          if (el !== this && el.classList.contains('wf-flipped')) {
            /* 直接觸發 click 讓它收合（原本的 handler 負責收合動作） */
            el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
      }

    }, true /* capture = true，比原本的 bubble handler 先跑 */);

    /* ── bubble 階段：在原本 handler 之後執行 ──
       處理 answer-src HTML 替換、link 發事件。              */
    this.addEventListener('click', () => {

      const isNowFlipped = this.classList.contains('wf-flipped');

      /* answer-src HTML 替換：翻開後把元素內容直接寫入 */
      if (this._bpAnswerHtml && isNowFlipped) {
        /* 找到原本 handler 插入的文字節點，替換成完整 HTML */
        this.innerHTML = this._bpAnswerHtml;
      }

      /* link：翻開時才發出事件，收合時不發 */
      if (linkName && isNowFlipped) {
        BPTools.emit(linkName, { id: this.id || null });
      }

    });
  };

})();

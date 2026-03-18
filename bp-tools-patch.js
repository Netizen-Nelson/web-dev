(function waitForBpTools() {

  if (!customElements.get('info-region')) {
    if ((waitForBpTools._tries = (waitForBpTools._tries || 0) + 1) > 200) {
      console.error('[bp-tools-patch] 等待逾時，請確認 bp-tools.js 已正確載入。');
      return;
    }
    setTimeout(waitForBpTools, 50);
    return;
  }
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
     B. InfoRegion 擴充
        1. 分支路徑（<ir-choice>）
        2. emit 屬性：啟動時向匯流排發出事件
  ═══════════════════════════════════════════════════════════ */

  if (!customElements.get('ir-choice')) {
    customElements.define('ir-choice', class extends HTMLElement {});
  }

  const irProto = customElements.get('info-region').prototype;
  const _orig_ir_onActivated = irProto._onActivated;
  const _orig_ir_reset       = irProto.reset;

  irProto._onActivated = function () {
    this._applyBorderStyles();

    /* ── 分支選項偵測 ── */
    const choiceEls = Array.from(this.querySelectorAll(':scope > ir-choice'));
    if (choiceEls.length > 0) {
      this._renderChoices(choiceEls);
      return;
    }

    /* ── 匯流排：啟動時發出 emit 屬性指定的事件 ── */
    const eventName = this.getAttribute('link');
    if (eventName) BPTools.emit(eventName, { id: this.id });

    /* 原本邏輯完整執行 */
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
     C. DualCell 擴充
        覆蓋 createCell()，在原本邏輯跑完後，
        偵測 unlock-on 屬性並向匯流排訂閱解鎖事件。

        unlock-on 屬性需加在 <dual-col> 或 [data-col] 上，
        解鎖動作：移除該格所有遮罩，取消 blur，回復正常顯示。
  ═══════════════════════════════════════════════════════════ */
  const dcProto = DualCell.prototype;
  const _orig_dc_createCell = dcProto.createCell;
  const _orig_dc_parseCol   = dcProto.parseCol;

  /* 先擴充 parseCol，讓它也把 unlock-on 屬性讀進 colData */
  dcProto.parseCol = function (el) {
    const colData = _orig_dc_parseCol.call(this, el);
    colData.unlockOn = el?.getAttribute('on-link') || null;
    return colData;
  };

  /* 再擴充 createCell，在 cell 建好後掛上匯流排訂閱 */
  dcProto.createCell = function (colData, rowIdx, colIdx) {
    const cell = _orig_dc_createCell.call(this, colData, rowIdx, colIdx);

    if (colData.unlockOn) {
      BPTools.on(colData.unlockOn, () => {
        /* 移除所有遮罩層 */
        cell.querySelectorAll('.dc-overlay').forEach(ov => ov.remove());
        /* 取消 blur */
        cell.querySelector('.dc-content')?.classList.remove('blurred');
        /* 移除 has-overlay 標記，恢復 hover 效果 */
        cell.classList.remove('has-overlay');
      });
    }

    return cell;
  };

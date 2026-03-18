(function waitForBpTools() {

  if (!customElements.get('info-region')) {
    if ((waitForBpTools._tries = (waitForBpTools._tries || 0) + 1) > 200) {
      console.error('[bp-tools-patch] 等待逾時，請確認 bp-tools.js 已正確載入。');
      return;
    }
    setTimeout(waitForBpTools, 50);
    return;
  }

  /* 1. 註冊 <ir-choice> 自訂標籤 */
  if (!customElements.get('ir-choice')) {
    customElements.define('ir-choice', class extends HTMLElement {});
  }

  /* 2. 取得 InfoRegion 原型 */
  const proto = customElements.get('info-region').prototype;

  /* 3. 保存原本的方法 */
  const _orig_onActivated = proto._onActivated;
  const _orig_reset       = proto.reset;

  /* 4. 覆蓋 _onActivated */
  proto._onActivated = function () {
    this._applyBorderStyles();

    const choiceEls = Array.from(
      this.querySelectorAll(':scope > ir-choice')
    );

    if (choiceEls.length > 0) {
      this._renderChoices(choiceEls);
      return;
    }

    _orig_onActivated.call(this);
  };

  /* 5. 新增 _renderChoices */
  proto._renderChoices = function (choiceEls) {

    this.querySelector('.ir-choices-wrap')?.remove();

    const cfg        = window.InfoRegionConfig || {};
    const selfColor  = this.getAttribute('color') || cfg.defaultColor || 'sky';
    const alignAttr  = this.getAttribute('choice-align') || 'left';
    const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

    const wrap = document.createElement('div');
    wrap.className    = 'ir-choices-wrap';
    wrap.style.cssText =
      'display:flex; flex-wrap:wrap; gap:8px; margin-top:16px;' +
      'justify-content:' + (justifyMap[alignAttr] || 'flex-start') + ';';

    choiceEls.forEach(choiceEl => {
      const target    = choiceEl.getAttribute('target');
      const colorName = choiceEl.getAttribute('color') || selfColor;
      const iconClass = choiceEl.getAttribute('icon')  || null;
      const label     = choiceEl.textContent.trim();

      if (!target) {
        console.warn('[bp-tools-patch] <ir-choice> 缺少 target 屬性：', choiceEl);
        return;
      }

      const btn = document.createElement('button');
      btn.className = 'ir-btn ir-btn--' + colorName;

      if (iconClass) {
        const icon     = document.createElement('i');
        icon.className = 'bi bi-' + iconClass;
        icon.style.marginRight = '5px';
        btn.appendChild(icon);
      }
      btn.appendChild(document.createTextNode(label));

      btn.addEventListener('click', () => {
        wrap.remove();

        const targetEl = document.getElementById(target);
        if (!targetEl) {
          console.warn('[bp-tools-patch] 找不到 target="' + target + '" 的元素');
          return;
        }

        targetEl._activatedBy = this.id;

        /* ── v1.3 核心修正 ────────────────────────────────────
           掃描頁面上所有 active 的 info-region，
           凡是帶有 _activatedBy（表示由選擇觸發的回饋區）
           且不是本次目標的，全部 reset 清掉。
           這樣不管之前按了幾個錯誤選項，殘留的都會被清除。 */
        document.querySelectorAll('info-region[active="true"]').forEach(el => {
          if (el !== targetEl && el._activatedBy) {
            el.reset();
          }
        });
        /* ───────────────────────────────────────────────────── */

        /* 把回饋區（自己）也收起來 */
        const selfEl = this;
        setTimeout(() => selfEl.reset(), 30);

        /* 目標若已是 active="true"，先 reset 再重新啟動 */
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

  /* 6. 擴充 reset() */
  proto.reset = function () {
    _orig_reset.call(this);
    this.querySelector('.ir-choices-wrap')?.remove();
  };

})();

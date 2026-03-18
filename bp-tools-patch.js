// 等 DOM 載入完畢，確保 bp-tools.js 已執行完畢
document.addEventListener('DOMContentLoaded', () => {

  // ── 第一步：註冊 <ir-choice> 自訂標籤 ───────────────────
  // 讓瀏覽器認識這個標籤，否則它會被當成未知元素跳過
  if (!customElements.get('ir-choice')) {
    customElements.define('ir-choice', class extends HTMLElement {});
  }

  // 取得 InfoRegion 類別的原型，後續所有修改都針對這個物件
  const proto = customElements.get('info-region').prototype;

  // ── 第二步：保存原本的 _onActivated，等一下還會用到 ───────
  // 這個動作很重要：就像把舊鑰匙複製一份備用，
  // 不是把舊的丟掉，而是在新邏輯裡仍然可以呼叫它
  const _original_onActivated = proto._onActivated;

  // ── 第三步：覆蓋 _onActivated，加入分支偵測 ───────────────
  proto._onActivated = function () {
    this._applyBorderStyles();

    const choiceEls = Array.from(
      this.querySelectorAll(':scope > ir-choice')
    );

    if (choiceEls.length > 0) {
      this._renderChoices(choiceEls);
      return;
    }
    _original_onActivated.call(this);
  };

  // ── 第四步：新增 _renderChoices 方法 ──────────────────────
  // 這個方法在原始碼裡完全不存在，純粹是新增的
  proto._renderChoices = function (choiceEls) {
    // 先清掉舊的（處理 reset 後重新 activate 的情況）
    this.querySelector('.ir-choices-wrap')?.remove();

    const cfg        = window.InfoRegionConfig;
    const selfColor  = this.getAttribute('color') || cfg.defaultColor;
    const alignAttr  = this.getAttribute('choice-align') || 'left';
    const justifyMap = {
      left   : 'flex-start',
      center : 'center',
      right  : 'flex-end',
    };

    const wrap = document.createElement('div');
    wrap.className    = 'ir-choices-wrap';
    wrap.style.cssText =
      `display:flex; flex-wrap:wrap; gap:8px; margin-top:16px;
       justify-content:${justifyMap[alignAttr] || 'flex-start'};`;

    choiceEls.forEach(choiceEl => {
      const target    = choiceEl.getAttribute('target');
      const colorName = choiceEl.getAttribute('color') || selfColor;
      const iconClass = choiceEl.getAttribute('icon')  || null;
      const label     = choiceEl.textContent.trim();

      if (!target) {
        console.warn('[IR Patch] <ir-choice> 缺少 target 屬性', choiceEl);
        return;
      }

      const btn = document.createElement('button');
      btn.className = `ir-btn ir-btn--${colorName}`;

      if (iconClass) {
        const icon = document.createElement('i');
        icon.className = `bi bi-${iconClass}`;
        btn.appendChild(icon);
      }
      btn.appendChild(document.createTextNode(' ' + label));

      btn.addEventListener('click', () => {
        wrap.remove(); // 防止重複點擊

        const targetEl = document.getElementById(target);
        if (!targetEl) {
          console.warn(`[IR Patch] 找不到 id="${target}" 的元素`);
          return;
        }

        // 記錄來源，為未來的「返回上一步」功能預留
        targetEl._activatedBy = this.id;
        targetEl.activate();
      });

      wrap.appendChild(btn);
    });

    this.appendChild(wrap);
  };

  // ── 第五步：擴充 reset()，加入選項按鈕的清理 ──────────────
  const _original_reset = proto.reset;

  proto.reset = function () {
    _original_reset.call(this);
    this.querySelector('.ir-choices-wrap')?.remove();
  };

  console.log('[bp-tools-patch] InfoRegion 分支功能已載入 ✓');
});

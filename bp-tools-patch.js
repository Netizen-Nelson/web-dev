/**
 * bp-tools-patch.js  v1.2
 * ─────────────────────────────────────────────────────────────
 * 為 bp-tools.js 新增 InfoRegion 分支路徑功能
 * 新增標籤：<ir-choice target="id" color="色名" icon="bi-類名">
 *
 * 載入順序（HTML 裡的順序必須正確）：
 *   <script src="bp-tools.js"></script>
 *   <script src="bp-tools-patch.js"></script>
 *
 * v1.2 修正：改用輪詢等待 bp-tools.js 載入，
 *           避免 CDN 遠端載入時的 DOMContentLoaded 時序問題。
 * ─────────────────────────────────────────────────────────────
 */
(function waitForBpTools() {

  /* bp-tools.js 尚未執行完畢，每 50ms 再試一次，最多等 10 秒 */
  if (!customElements.get('info-region')) {
    if ((waitForBpTools._tries = (waitForBpTools._tries || 0) + 1) > 200) {
      console.error('[bp-tools-patch] 等待逾時，請確認 bp-tools.js 已正確載入。');
      return;
    }
    setTimeout(waitForBpTools, 50);
    return;
  }

  /* ── bp-tools.js 已就緒，開始掛載補丁 ───────────────────── */

  /* 1. 註冊 <ir-choice> 自訂標籤 */
  if (!customElements.get('ir-choice')) {
    customElements.define('ir-choice', class extends HTMLElement {});
  }

  /* 2. 取得 InfoRegion 原型 */
  const proto = customElements.get('info-region').prototype;

  /* 3. 保存原本的方法 */
  const _orig_onActivated = proto._onActivated;
  const _orig_reset       = proto.reset;

  /* 4. 覆蓋 _onActivated：插入分支偵測 */
  proto._onActivated = function () {
    this._applyBorderStyles();

    const choiceEls = Array.from(
      this.querySelectorAll(':scope > ir-choice')
    );

    if (choiceEls.length > 0) {
      this._renderChoices(choiceEls);
      return;
    }

    /* 沒有選項：原本邏輯完整執行 */
    _orig_onActivated.call(this);
  };

  /* 5. 新增 _renderChoices 方法 */
  proto._renderChoices = function (choiceEls) {

    /* reset 後重新 activate 時，先清掉上一輪的按鈕 */
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

        /* 把回饋區（自己）收起來，避免畫面堆疊 */
        const selfEl = this;
        setTimeout(() => selfEl.reset(), 30);

        /* 目標若已是 active="true"（例如答錯重回題目）
           必須先 reset 讓屬性真正變化，再重新啟動         */
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

  /* 6. 擴充 reset()：補上選項按鈕的清理 */
  proto.reset = function () {
    _orig_reset.call(this);
    this.querySelector('.ir-choices-wrap')?.remove();
  };

})();

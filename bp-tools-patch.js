document.addEventListener('DOMContentLoaded', () => {
  if (!customElements.get('info-region')) {
    console.error('[bp-tools-patch] 找不到 info-region 元素，請確認 bp-tools.js 已在此檔案之前載入。');
    return;
  }

  /* ── 1. 註冊 <ir-choice> 自訂標籤 ────────────────────────── */
  if (!customElements.get('ir-choice')) {
    customElements.define('ir-choice', class extends HTMLElement {});
  }

  /* ── 2. 取得 InfoRegion 原型 ──────────────────────────────── */
  const proto = customElements.get('info-region').prototype;

  /* ── 3. 保存原本的方法（monkey-patch 的安全做法）────────────
     先把舊方法存起來，新方法裡在適當時機用 .call(this) 呼叫，
     確保原有功能百分之百保留，只是在前面插入新邏輯。          */
  const _orig_onActivated = proto._onActivated;
  const _orig_reset       = proto.reset;

  /* ── 4. 覆蓋 _onActivated：插入分支偵測 ─────────────────────
     偵測到 <ir-choice> 子元素就進選擇模式，
     否則完整交還給原本的邏輯。                                 */
  proto._onActivated = function () {
    this._applyBorderStyles();

    const choiceEls = Array.from(
      this.querySelectorAll(':scope > ir-choice')
    );

    if (choiceEls.length > 0) {
      this._renderChoices(choiceEls);
      return; /* 有選項就不走原本的自動觸發 / 倒數 */
    }

    /* 沒有選項：原本邏輯完整執行 */
    _orig_onActivated.call(this);
  };

  /* ── 5. 新增 _renderChoices 方法 ─────────────────────────── */
  proto._renderChoices = function (choiceEls) {

    /* reset 後重新 activate 時，先清掉上一輪的按鈕 */
    this.querySelector('.ir-choices-wrap')?.remove();

    const cfg        = window.InfoRegionConfig || {};
    const selfColor  = this.getAttribute('color') || cfg.defaultColor || 'sky';
    const alignAttr  = this.getAttribute('choice-align') || 'left';
    const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

    /* 按鈕容器 */
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

      /* 防呆：缺少 target 屬性就跳過並警告 */
      if (!target) {
        console.warn('[bp-tools-patch] <ir-choice> 缺少 target 屬性：', choiceEl);
        return;
      }

      /* 建立按鈕，沿用現有的 .ir-btn 樣式，無需新增 CSS */
      const btn = document.createElement('button');
      btn.className = 'ir-btn ir-btn--' + colorName;

      if (iconClass) {
        const icon    = document.createElement('i');
        icon.className = 'bi bi-' + iconClass;
        icon.style.marginRight = '5px';
        btn.appendChild(icon);
      }
      btn.appendChild(document.createTextNode(label));

      btn.addEventListener('click', () => {
        /* 立刻移除按鈕群，防止重複點擊 */
        wrap.remove();

        const targetEl = document.getElementById(target);
        if (!targetEl) {
          console.warn('[bp-tools-patch] 找不到 target="' + target + '" 的元素');
          return;
        }

        /* 記錄來源 id，為未來的「返回上一步」預留接口 */
        targetEl._activatedBy = this.id;

        /* ── 把「自己」（回饋區）也 reset，避免畫面堆疊 ──
           延遲 30ms 讓使用者能瞄到回饋文字後再消失        */
        const selfEl = this; /* 保存 this 供 setTimeout 使用 */
        setTimeout(() => selfEl.reset(), 30);

        /* ── 前往目標 ────────────────────────────────────
           關鍵：若目標已是 active="true"（例如答錯重回題目），
           直接 setAttribute 不會觸發 attributeChangedCallback，
           必須先 reset 讓它回到非 active 狀態，
           再用 setTimeout 給 CSS 動畫時間，然後重新啟動。   */
        if (targetEl.getAttribute('active') === 'true') {
          targetEl.reset();
          setTimeout(() => targetEl.activate(), 60);
        } else {
          /* 第一次到達這個目標，延遲與上面一致以保持節奏 */
          setTimeout(() => targetEl.activate(), 60);
        }
      });

      wrap.appendChild(btn);
    });

    this.appendChild(wrap);
  };

  /* ── 6. 擴充 reset()：補上選項按鈕的清理 ────────────────── */
  proto.reset = function () {
    /* 先執行原本的 reset（清倒數條、manual 按鈕等） */
    _orig_reset.call(this);
    /* 再清掉我們新增的選項按鈕 */
    this.querySelector('.ir-choices-wrap')?.remove();
  };

});

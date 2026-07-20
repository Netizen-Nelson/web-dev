/**
 * bp-stepper.js
 * 橫向步驟流程元件
 */

(function () {
  'use strict';

  const CSS = `
    .bp-stepper {
      display: flex;
      overflow-x: auto;
      align-items: center;
      gap: 24px;
      padding: 30px 10px;
      scrollbar-width: thin;
      --bp-stroke: 3px;
      --bp-color: #C3A5E5;
    }
    .bp-step {
      flex: 0 0 250px;
      border: var(--bp-stroke) solid var(--bp-color);
      border-radius: 12px;
      padding: 16px;
      position: relative;
      background: rgba(0,0,0,0.2);
    }
    /* 連接線 (::after) */
    .bp-step:not(:last-child)::after {
      content: '';
      position: absolute;
      right: -24px;
      top: 50%;
      width: 24px;
      height: var(--bp-stroke);
      background-color: var(--bp-color);
      transform: translateY(-50%);
    }
    /* 箭頭頭部 (::before) */
    .bp-step:not(:last-child)::before {
      content: '';
      position: absolute;
      right: -24px;
      top: 50%;
      transform: translateY(-50%);
      border-left: calc(var(--bp-stroke) * 3) solid var(--bp-color);
      border-top: calc(var(--bp-stroke) * 2) solid transparent;
      border-bottom: calc(var(--bp-stroke) * 2) solid transparent;
    }
  `;

  function injectCSS() {
    if (document.getElementById('bp-stepper-style')) return;
    const s = document.createElement('style');
    s.id = 'bp-stepper-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function init() {
    document.querySelectorAll('.bp-stepper').forEach(el => {
      // 讀取 data 屬性並轉為 CSS 變數
      if (el.dataset.stroke) el.style.setProperty('--bp-stroke', el.dataset.stroke);
      if (el.dataset.color) el.style.setProperty('--bp-color', el.dataset.color);
    });
  }

  // 暴露初始化方法，以備動態載入內容時使用
  window.BPStepper = { init };

  injectCSS();
  window.addEventListener('DOMContentLoaded', init);
})();
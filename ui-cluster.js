(function (global) {
  'use strict';

  /* ── 品牌色盤 ── */
  var BRAND = {
    shell:    '#C6C7BD',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#95c9de',
    ocean:    '#0ABDC6',
    safe:     '#20c21d',
    vanilla:  '#DBEDD8',
    yellow:   '#DECA4B',
    focus:    '#e0be79',
    info:     '#788cde',
    stone:    '#95BDD7',
    indigo:   '#9B72CF',
    pink:     '#FFB3D9',
    orange:   '#EDA109',
    teal:     '#0DA591'
  };

  var BG = '#0C0D0C';

  /* ----------------------------------------------------------------
   * 全域設定
   * ---------------------------------------------------------------- */
  var CFG = global.UiClusterConfig = Object.assign({
    theme:    'shell',   // 預設主題色
    size:     '72px',   // 主圓直徑
    nodeSize: '56px',   // 子圓直徑
    gap:      '24px',   // 子圓間距
    fontSize: '1rem'    // 標籤字體大小
  }, global.UiClusterConfig || {});

  /* ── 工具函式 ── */
  function resolveColor(v) {
    if (!v) return null;
    v = String(v).trim();
    return BRAND[v] || (/^#|^rgb/.test(v) ? v : null);
  }

  function hexRgba(hex, a) {
    a = Math.max(+a || 0, 0.76);
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function mk(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  function qsa(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  /* ── 重設 SVG 圖示 ── */
  var ICO_RESET = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"' +
    ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>' +
    '<path d="M3 3v5h5"/></svg>';

  /* ================================================================
   * CSS
   * ================================================================ */
  var CSS = [
    /* 隱藏原始標籤 */
    'ui-cluster,cluster-node,cluster-item{display:none}',

    /* ── 元件根容器 ── */
    '.uc-root{position:relative;display:inline-flex;flex-direction:column;align-items:center;' +
      'font-size:var(--uc-fs,1rem);line-height:1.4;font-family:inherit}',

    /* ── Stage 容器（橫向展開後的 flex 行） ── */
    '.uc-stage{display:flex;flex-direction:column;align-items:center;width:100%}',

    /* ── 子圓列（Stage 1 橫排） ── */
    '.uc-nodes{display:flex;flex-direction:row;align-items:flex-start;' +
      'gap:var(--uc-gap,24px);flex-wrap:wrap;justify-content:center}',

    /* ── 圓形基礎 ── */
    '.uc-circle{' +
      'border-radius:50%;display:inline-flex;align-items:center;justify-content:center;' +
      'cursor:pointer;position:relative;flex-shrink:0;' +
      'transition:transform .18s ease,filter .18s ease,box-shadow .18s ease;' +
      'box-shadow:0 0 0 2px var(--uc-clr),inset 0 0 0 9999px rgba(0,0,0,0.18)}',
    '.uc-circle:hover{transform:scale(1.08);filter:brightness(1.14);' +
      'box-shadow:0 0 0 3px var(--uc-clr),0 4px 18px rgba(0,0,0,0.35),inset 0 0 0 9999px rgba(0,0,0,0.12)}',
    '.uc-circle.done{cursor:default;box-shadow:0 0 0 2px var(--uc-clr),inset 0 0 0 9999px rgba(0,0,0,0.32)}',
    '.uc-circle.done:hover{transform:none;filter:none;' +
      'box-shadow:0 0 0 2px var(--uc-clr),inset 0 0 0 9999px rgba(0,0,0,0.32)}',

    /* ── 主圓 ── */
    '.uc-main-circle{' +
      'width:var(--uc-sz,72px);height:var(--uc-sz,72px);' +
      'background:var(--uc-clr);color:' + BG + '}',

    /* ── 主圓消失動畫 ── */
    '.uc-main-circle.burst{' +
      'animation:uc-burst .32s ease-out forwards}',
    '@keyframes uc-burst{' +
      '0%{transform:scale(1);opacity:1}' +
      '60%{transform:scale(1.22);opacity:0.6}' +
      '100%{transform:scale(0);opacity:0}}',

    /* ── 子圓 ── */
    '.uc-node-wrap{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.uc-node-circle{' +
      'width:var(--uc-nsz,56px);height:var(--uc-nsz,56px);' +
      'background:var(--uc-nclr,var(--uc-clr));color:' + BG + ';' +
      'opacity:0;transform:scale(0) translateY(-8px)}',
    '.uc-node-circle.appear{' +
      'animation:uc-appear .35s ease-out forwards}',
    '@keyframes uc-appear{' +
      '0%{opacity:0;transform:scale(0) translateY(-8px)}' +
      '70%{opacity:1;transform:scale(1.08) translateY(0)}' +
      '100%{opacity:1;transform:scale(1) translateY(0)}}',

    /* ── 數字標籤 ── */
    '.uc-num{font-size:calc(var(--uc-fs,1rem)*1.1);font-weight:700;line-height:1;letter-spacing:-0.02em}',
    '.uc-num-sm{font-size:calc(var(--uc-fs,1rem)*0.95);font-weight:700;line-height:1;letter-spacing:-0.02em}',

    /* ── 圓下方文字標籤 ── */
    '.uc-label{font-size:calc(var(--uc-fs,1rem)*0.78);color:var(--uc-clr);' +
      'font-weight:600;text-align:center;max-width:90px;word-break:break-word;opacity:0.9}',
    '.uc-label-sm{font-size:calc(var(--uc-fs,1rem)*0.72);color:var(--uc-nclr,var(--uc-clr));' +
      'font-weight:600;text-align:center;max-width:76px;word-break:break-word;opacity:0.88}',

    /* ── 內容展開區 ── */
    '.uc-content{' +
      'width:100%;max-height:0;overflow:hidden;opacity:0;' +
      'transition:max-height .32s ease,opacity .28s ease;' +
      'margin-top:0}',
    '.uc-content.open{max-height:1200px;opacity:1;margin-top:12px}',
    '.uc-content-inner{' +
      'border:1px solid var(--uc-nclr,var(--uc-clr));border-radius:8px;' +
      'overflow:hidden}',
    /* cluster-item 列 */
    '.uc-item{' +
      'padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);' +
      'color:#C6C7BD;font-size:var(--uc-fs,1rem);line-height:1.5}',
    '.uc-item:last-child{border-bottom:none}',
    '.uc-item:hover{background:rgba(255,255,255,0.04)}',

    /* ── 重設按鈕 ── */
    '.uc-reset{' +
      'position:absolute;top:0;right:0;' +
      'background:rgba(198,199,189,0.1);border:1px solid rgba(198,199,189,0.22);' +
      'border-radius:5px;padding:3px 8px;' +
      'color:rgba(198,199,189,0.7);cursor:pointer;' +
      'font-size:0.72rem;font-weight:600;letter-spacing:0.04em;' +
      'display:inline-flex;align-items:center;gap:5px;' +
      'transition:background .15s,color .15s,border-color .15s}',
    '.uc-reset:hover{background:rgba(198,199,189,0.18);color:#C6C7BD;border-color:rgba(198,199,189,0.4)}',

    /* ── 連接線：主圓到子圓列的視覺引導 ── */
    '.uc-connector{' +
      'width:2px;height:16px;background:var(--uc-clr);' +
      'opacity:0;margin:0 auto;' +
      'transition:opacity .25s ease .2s,height .3s ease .2s}',
    '.uc-connector.show{opacity:0.76}',

    /* ── 子圓到內容的連接線 ── */
    '.uc-node-connector{' +
      'width:2px;height:0;background:var(--uc-nclr,var(--uc-clr));' +
      'opacity:0;margin:0 auto;' +
      'transition:height .28s ease,opacity .25s ease}',
    '.uc-node-connector.show{height:12px;opacity:0.76}'

  ].join('\n');

  var _cssInj = false;
  function injectCSS() {
    if (_cssInj) return;
    _cssInj = true;
    var s = document.createElement('style');
    s.id = 'uc-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  injectCSS();

  /* ================================================================
   * UiCluster 主類別
   * ================================================================ */
  function UiCluster(el) {
    this.el      = el;
    this.color   = resolveColor(el.getAttribute('theme') || el.getAttribute('color') || CFG.theme) || BRAND.shell;
    this.size    = el.getAttribute('size')      || CFG.size;
    this.nodeSize= el.getAttribute('node-size') || CFG.nodeSize;
    this.gap     = el.getAttribute('gap')       || CFG.gap;
    this.fs      = el.getAttribute('font-size') || CFG.fontSize;
    this.label   = el.getAttribute('label')     || '';
    this.hasReset= el.hasAttribute('reset');
    this.root    = null;  // 渲染後的根 div
  }

  UiCluster.prototype.init = function () {
    this._render();
  };

  /* ----------------------------------------------------------------
   * _render：主渲染
   * ---------------------------------------------------------------- */
  UiCluster.prototype.render = UiCluster.prototype._render = function () {
    var self = this;

    /* 蒐集 cluster-node */
    var nodeEls = qsa(':scope > cluster-node', this.el);
    if (!nodeEls.length) return;

    /* 根容器 */
    var root = mk('div', 'uc-root');
    root.style.cssText = [
      '--uc-clr:'  + this.color,
      '--uc-sz:'   + this.size,
      '--uc-nsz:'  + this.nodeSize,
      '--uc-gap:'  + this.gap,
      '--uc-fs:'   + this.fs
    ].join(';');
    this.root = root;

    /* 重設按鈕 */
    if (this.hasReset) {
      var resetBtn = mk('button', 'uc-reset');
      resetBtn.innerHTML = ICO_RESET + '重設';
      resetBtn.addEventListener('click', function () { self._reset(); });
      root.appendChild(resetBtn);
    }

    /* 主圓 */
    var mainCircle = mk('div', 'uc-circle uc-main-circle');
    var mainNum    = mk('span', 'uc-num');
    mainNum.textContent = nodeEls.length;
    mainCircle.appendChild(mainNum);
    mainCircle.style.background = this.color;
    root.appendChild(mainCircle);

    /* 主圓下方標籤 */
    if (this.label) {
      var mainLabel = mk('div', 'uc-label');
      mainLabel.textContent = this.label;
      root.appendChild(mainLabel);
    }

    /* 連接線（主圓 → 子圓列，初始隱藏） */
    var connector = mk('div', 'uc-connector');
    root.appendChild(connector);

    /* Stage：子圓列容器（初始隱藏） */
    var stage   = mk('div', 'uc-stage');
    stage.style.display = 'none';
    var nodesRow = mk('div', 'uc-nodes');
    stage.appendChild(nodesRow);
    root.appendChild(stage);

    /* ── 主圓點擊：burst 動畫 → 展開子圓 ── */
    mainCircle.addEventListener('click', function () {
      if (mainCircle.classList.contains('burst')) return;

      /* 爆開動畫 */
      mainCircle.classList.add('burst');
      if (self.label) {
        var lbl = root.querySelector('.uc-label');
        if (lbl) { lbl.style.transition = 'opacity .2s'; lbl.style.opacity = '0'; }
      }

      setTimeout(function () {
        mainCircle.style.display = 'none';

        /* 顯示子圓列 */
        stage.style.display = 'flex';

        /* 連接線 */
        connector.classList.add('show');

        /* 依序動畫顯示子圓 */
        var nodeWraps = nodesRow.querySelectorAll('.uc-node-circle');
        nodeWraps.forEach(function (nc, i) {
          setTimeout(function () {
            nc.classList.add('appear');
          }, i * 80);
        });
      }, 280);
    });

    /* ── 建立子圓 ── */
    nodeEls.forEach(function (nodeEl) {
      var nodeColor = resolveColor(
        nodeEl.getAttribute('theme') || nodeEl.getAttribute('color')
      ) || self.color;
      var nodeLabel = nodeEl.getAttribute('label') || '';
      var items     = qsa(':scope > cluster-item', nodeEl);

      /* 子圓外層 wrap（圓 + label + connector + content） */
      var wrap = mk('div', 'uc-node-wrap');
      wrap.style.setProperty('--uc-nclr', nodeColor);

      /* 子圓 */
      var circle = mk('div', 'uc-circle uc-node-circle');
      circle.style.background = nodeColor;
      var num = mk('span', 'uc-num-sm');
      num.textContent = items.length;
      circle.appendChild(num);
      wrap.appendChild(circle);

      /* 子圓標籤 */
      if (nodeLabel) {
        var nlabel = mk('div', 'uc-label-sm');
        nlabel.textContent = nodeLabel;
        wrap.appendChild(nlabel);
      }

      /* 子圓 → 內容連接線 */
      var nodeConn = mk('div', 'uc-node-connector');
      wrap.appendChild(nodeConn);

      /* 內容展開區 */
      var content = mk('div', 'uc-content');
      var inner   = mk('div', 'uc-content-inner');
      inner.style.borderColor = hexRgba(nodeColor, 0.76);

      items.forEach(function (itemEl) {
        var row = mk('div', 'uc-item');
        row.innerHTML = itemEl.innerHTML;
        inner.appendChild(row);
      });

      content.appendChild(inner);
      wrap.appendChild(content);
      nodesRow.appendChild(wrap);

      /* ── 子圓點擊：展開內容 ── */
      circle.addEventListener('click', function () {
        if (circle.classList.contains('done')) return;
        if (!circle.classList.contains('appear')) return; /* 動畫未完成前不響應 */

        circle.classList.add('done');
        nodeConn.classList.add('show');
        content.classList.add('open');
      });
    });

    /* 插入頁面 */
    this.el.before(root);
    this.el.style.display = 'none';
  };

  /* ----------------------------------------------------------------
   * _reset：回到 Stage 0
   * ---------------------------------------------------------------- */
  UiCluster.prototype._reset = function () {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
    this.el.style.display = '';
    this._render();
  };

  /* ================================================================
   * Boot
   * ================================================================ */
  function boot() {
    document.querySelectorAll('ui-cluster').forEach(function (el) {
      if (!el._uc) {
        el._uc = true;
        new UiCluster(el).init();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.UiCluster = { init: boot, config: CFG, colors: BRAND };

})(window);

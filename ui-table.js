(function (global) {
  'use strict';

  var BRAND = {
    shell:    '#C6C7BD',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#0ABDC6',
    safe:     '#40C99A',
    vanilla:  '#DBEDD8',
    yellow:   '#DECA4B',
    focus:    '#A0CF72',
    info:     '#4285EB',
    stone:    '#95BDD7',
    indigo:   '#9B72CF',
    pink:     '#FFB3D9',
    orange:   '#EDA109',
    teal:     '#0DA591'
  };

  var BG = '#0C0D0C';

  /* 全域配置（可在引入前透過 window.UiTableConfig 覆寫） */
  var CFG = global.UiTableConfig = Object.assign({
    theme:         'shell',  // 預設主題色
    cellPadding:   '6px',   // 預設 cell 內距
    fontSize:      '1rem',  // 預設字體大小
    alertDuration: 2500     // alert 顯示時長（毫秒）
  }, global.UiTableConfig || {});

  var ICO = {
    'i-arrow-down':  icoP('M6 9 12 15 18 9'),
    'i-arrow-up':    icoP('M18 15 12 9 6 15'),
    'i-arrow-right': icoP('M9 18 15 12 9 6'),
    'i-arrow-left':  icoP('M15 18 9 12 15 6'),
    'i-check':       icoP('M20 6 9 17 4 12'),
    'i-expand':      icoP('M6 9 12 15 18 9'),
    'i-collapse':    icoP('M18 15 12 9 6 15'),
    'i-lock': [
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"',
      ' stroke="currentColor" stroke-width="2.5"',
      ' stroke-linecap="round" stroke-linejoin="round">',
      '<rect x="3" y="11" width="18" height="11" rx="2"/>',
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      '</svg>'
    ].join('')
  };

  function icoP(d) {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"' +
      ' stroke="currentColor" stroke-width="2.5"' +
      ' stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + d + '"/></svg>';
  }

  function resolveColor(v) {
    if (!v) return null;
    v = String(v).trim();
    return BRAND[v] || (/^#|^rgb/.test(v) ? v : null);
  }

  function hexRgba(hex, a) {
    /* 透明度最低 0.72（符合品牌規範） */
    a = Math.max(+a || 0, 0.72);
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function mkIco(name) {
    if (!name) return '';
    /* Bootstrap Icons：以 'bi-' 開頭 */
    if (/^bi-/.test(name)) {
      return '<span class="uit-ico">' +
        '<i class="bi ' + name + '" aria-hidden="true"></i>' +
        '</span>';
    }
    /* 內建 SVG 圖示 */
    return ICO[name] ? '<span class="uit-ico">' + ICO[name] + '</span>' : '';
  }

  function mk(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  function qsa(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function isSrcCol(el) {
    return el.hasAttribute('hidden') && el.hasAttribute('id');
  }

  function timedTrigger(showFn, hideFn, interval, duration) {
    function once() {
      showFn();
      setTimeout(hideFn, duration);
    }
    setTimeout(function () { once(); setInterval(once, interval); }, interval);
  }

  var CSS = [

    'ui-table,ui-group,ui-row,ui-col,cell-item{display:none}',
    '.uit-wrap{width:100%;box-sizing:border-box;position:relative;font-size:var(--uit-fs,1rem);line-height:1.5}',
    '.uit-scroll{overflow-x:auto;width:100%}',
    '.uit-group{margin-bottom:16px;border-radius:6px;overflow:hidden;border:1px solid var(--uit-tm20)}',

    /* Group header（點擊折疊） */
    '.uit-gh{display:flex;align-items:center;padding:10px 16px;cursor:pointer;user-select:none;gap:8px;background:var(--uit-tm15)}',
    '.uit-gtl{font-weight:700;color:var(--uit-tm);flex:1;font-size:var(--uit-fs)}',
    '.uit-gtr{font-size:calc(var(--uit-fs)*0.85);color:var(--uit-tm);opacity:.85}',
    '.uit-gtog{display:inline-flex;align-items:center;color:var(--uit-tm);transition:transform .28s ease;flex-shrink:0}',
    '.uit-group.collapsed .uit-gtog{transform:rotate(-90deg)}',

    /* Group body（折疊動畫） */
    '.uit-gb{overflow:hidden;max-height:9999px;transition:max-height .35s ease,opacity .28s ease;opacity:1}',
    '.uit-gb.collapsed{max-height:0!important;opacity:0}',

    /* ── ui-row ── */
    '.uit-row{display:grid;position:relative;box-sizing:border-box}',
    '.uit-row.uit-hidden{display:none!important}',

    /* ── ui-col ── */
    '.uit-col{position:relative;box-sizing:border-box;overflow:hidden;word-break:break-word;min-width:0}',
    '.uit-ci{display:flex;align-items:flex-start;gap:6px;min-width:0}',
    '.uit-ico{display:inline-flex;align-items:center;flex-shrink:0;margin-top:.1em}',
    '.uit-ct{flex:1;min-width:0;font-size:var(--uit-fs)}',

    /* expandable */
    '.uit-col.is-exp .uit-ct{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}',
    '.uit-col.is-exp.expanded .uit-ct{display:block;overflow:visible}',
    '.uit-etog{cursor:pointer;flex-shrink:0;display:inline-flex;align-items:center;opacity:.82;color:var(--uit-tm);margin-top:.15em;transition:opacity .2s}',
    '.uit-etog:hover{opacity:1}',

    /* show-next */
    '.uit-col.has-sn{cursor:pointer;transition:opacity .2s}',
    '.uit-col.has-sn:hover{opacity:.82}',

    /* ── 遮罩 ── */
    '.uit-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:10;gap:8px;font-weight:600;transition:opacity .3s ease;font-size:var(--uit-fs);border-radius:inherit}',
    '.uit-mask.unlockable{cursor:pointer}',
    '.uit-mask.unlockable:hover{filter:brightness(1.11)}',
    '.uit-mask.locked{cursor:not-allowed;opacity:.88}',
    '.uit-mask.revealed{opacity:0;pointer-events:none}',
    '.uit-mlock{display:inline-flex;align-items:center}',

    /* ── 輪播 ── */
    '.uit-car{position:relative;overflow:hidden;flex:1;font-size:var(--uit-fs)}',
    '.uit-car-item{width:100%;box-sizing:border-box}',

    /* ── 進度條 ── */
    '.uit-pb{height:3px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;margin-top:6px;flex-shrink:0}',
    '.uit-pf{height:100%;border-radius:2px;transform-origin:left center}',
    '@keyframes uit-prog{from{transform:scaleX(1)}to{transform:scaleX(0)}}',

    /* ── Alert ── */
    '.uit-alert-A{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:6px 12px;white-space:normal;text-align:center;opacity:0;transition:opacity .35s ease;pointer-events:none;font-weight:600;font-size:var(--uit-fs)}',
    '.uit-alert-A.vis{opacity:1}',
    '.uit-alert-ext{position:fixed;z-index:9999;pointer-events:none;padding:5px 14px;border-radius:6px;font-weight:600;line-height:1.5;white-space:nowrap;opacity:0;transition:opacity .35s ease;font-size:var(--uit-fs,1rem)}',
    '.uit-alert-ext.vis{opacity:1}',

    /* ── 固定欄 ── */
    '.uit-col.fix-l{position:sticky;left:0;z-index:5}',
    '.uit-col.fix-r{position:sticky;right:0;z-index:5}'

  ].join('\n');

  var _cssInj = false;
  function injectCSS() {
    if (_cssInj) return;
    _cssInj = true;
    var s = document.createElement('style');
    s.id = 'uit-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  injectCSS();

  /* ================================================================
   * UiTable 建構子
   * ================================================================ */
  function UiTable(el) {
    this.el     = el;
    this.theme  = el.getAttribute('theme') || CFG.theme;
    this.color  = resolveColor(this.theme) || BRAND.shell;
    this.src    = el.getAttribute('src');
    this.dataId = el.getAttribute('data-id');
    this.colN   = 0; // 欄數，由第一列決定

    /* 蒐集內容來源欄（hidden + id） */
    this.srcMap = {};
    var self = this;
    el.querySelectorAll('ui-col[id][hidden]').forEach(function (c) {
      self.srcMap[c.id] = c.innerHTML;
    });
  }

  /* ----------------------------------------------------------------
   * init：決定資料來源後啟動渲染
   * ---------------------------------------------------------------- */
  UiTable.prototype.init = function () {
    var self = this;
    if (this.src) {
      /* src 優先（與 data-id 互斥） */
      fetch(this.src)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (d) { self._fromJSON(d); })
        .catch(function (e) { console.error('[ui-table] src 載入失敗:', e); });
    } else if (this.dataId) {
      var d = global[this.dataId];
      if (!d) { console.error('[ui-table] data-id 找不到:', this.dataId); return; }
      this._fromJSON(d);
    } else {
      this._render();
    }
  };

  /* ----------------------------------------------------------------
   * _fromJSON：從 JSON 物件建立 DOM，再呼叫 _render
   * ---------------------------------------------------------------- */
  UiTable.prototype._fromJSON = function (data) {
    var self = this;
    if (data.fontSize) this.el.setAttribute('font-size', data.fontSize);
    this.el.innerHTML = '';
    (data.groups || []).forEach(function (gd) {
      var g = mk('ui-group');
      if (gd.titleLeft)   g.setAttribute('title-left',  gd.titleLeft);
      if (gd.titleRight)  g.setAttribute('title-right', gd.titleRight);
      if (gd.iniCollapse) g.setAttribute('ini-collapse', '');

      (gd.rows || []).forEach(function (rd) {
        var r = mk('ui-row');
        if (rd.hidden)      r.setAttribute('hidden',       '');
        if (rd.cellPadding) r.setAttribute('cell-padding', rd.cellPadding);
        if (rd.border)      r.setAttribute('border',       rd.border);
        if (rd.colWidths)   r.setAttribute('col-widths',   rd.colWidths);
        if (rd.colBorder)   r.setAttribute('col-border',   rd.colBorder);
        if (rd.fontSize)    r.setAttribute('font-size',    rd.fontSize);
        if (rd.lineHeight)  r.setAttribute('line-height',  rd.lineHeight);
        if (rd.textIndent)  r.setAttribute('text-indent',  rd.textIndent);

        (rd.cols || []).forEach(function (cd) {
          var c = mk('ui-col');
          if (cd.icon)              c.setAttribute('icon',              cd.icon);
          if (cd.width)             c.setAttribute('width',             cd.width);
          if (cd.fixed)             c.setAttribute('fixed',             cd.fixed);
          if (cd.showNext)          c.setAttribute('show-next',         'true');
          if (cd.expandable)        c.setAttribute('expandable',        '');
          if (cd.maskText)          c.setAttribute('mask-text',         cd.maskText);
          if (cd.maskColor)         c.setAttribute('mask-color',        cd.maskColor);
          if (cd.maskOrder != null) c.setAttribute('mask-order',        String(cd.maskOrder));
          if (cd.carouselInterval)  c.setAttribute('carousel-interval', String(cd.carouselInterval));
          if (cd.progressBar)       c.setAttribute('progress-bar',      '');
          if (cd.progressBarColor)  c.setAttribute('progress-bar-color', cd.progressBarColor);
          if (cd.alertMsg)          c.setAttribute('alert-msg',         cd.alertMsg);
          if (cd.alertColor)        c.setAttribute('alert-color',       cd.alertColor);
          if (cd.alertInterval)     c.setAttribute('alert-interval',    String(cd.alertInterval));
          if (cd.alertPos)          c.setAttribute('alert-pos',         cd.alertPos);

          if (cd.items && cd.items.length) {
            cd.items.forEach(function (it) {
              var ci = mk('cell-item');
              ci.innerHTML = it;
              c.appendChild(ci);
            });
          } else {
            c.innerHTML = cd.content || '';
          }
          r.appendChild(c);
        });
        g.appendChild(r);
      });
      self.el.appendChild(g);
    });
    this._render();
  };

  /* ----------------------------------------------------------------
   * _render：主渲染流程
   * ---------------------------------------------------------------- */
  UiTable.prototype._render = function () {
    this.colN = this._getColCount();

    var wrap = mk('div', 'uit-wrap');
    var c    = this.color;
    var fs   = this.el.getAttribute('font-size') || CFG.fontSize;
    wrap.style.cssText = [
      '--uit-tm:'   + c,
      '--uit-fs:'   + fs,
      '--uit-tm15:' + hexRgba(c, 0.15),
      '--uit-tm20:' + hexRgba(c, 0.20)
    ].join(';');

    var scroll = mk('div', 'uit-scroll');
    wrap.appendChild(scroll);

    var self   = this;
    var groups = qsa(':scope > ui-group', this.el);
    if (groups.length) {
      groups.forEach(function (g) { scroll.appendChild(self._renderGroup(g)); });
    } else {
      /* 無 group，直接渲染列 */
      var rows = qsa(':scope > ui-row', this.el);
      var rds  = this._renderRows(rows, scroll);
      this._bindSN(rds);
    }

    this.el.before(wrap);
    this.el.style.display = 'none';
  };

  /* ----------------------------------------------------------------
   * _getColCount：取第一個含有作用欄的 ui-row 的欄數
   * ---------------------------------------------------------------- */
  UiTable.prototype._getColCount = function () {
    var rows = qsa('ui-row', this.el);
    for (var i = 0; i < rows.length; i++) {
      var active = qsa(':scope > ui-col', rows[i]).filter(function (c) {
        return !isSrcCol(c);
      });
      if (active.length) return active.length;
    }
    return 0;
  };

  /* ----------------------------------------------------------------
   * _renderGroup：渲染 ui-group（含折疊）
   * ---------------------------------------------------------------- */
  UiTable.prototype._renderGroup = function (gEl) {
    var self = this;
    var div  = mk('div', 'uit-group');
    var tl   = gEl.getAttribute('title-left')  || '';
    var tr   = gEl.getAttribute('title-right') || '';
    var ini  = gEl.hasAttribute('ini-collapse');

    /* ── Header ── */
    var gh = mk('div', 'uit-gh');
    gh.style.background = hexRgba(this.color, 0.15);

    var gtl = mk('span', 'uit-gtl');
    gtl.textContent = tl;
    gtl.style.color = this.color;

    var gtr = mk('span', 'uit-gtr');
    gtr.textContent = tr;
    gtr.style.color = this.color;

    var gtog = mk('span', 'uit-gtog');
    gtog.innerHTML = ICO['i-arrow-down'] || '▾';
    gtog.style.color = this.color;

    gh.append(gtl, gtr, gtog);

    /* ── Body ── */
    var gb   = mk('div', 'uit-gb');
    var rows = qsa(':scope > ui-row', gEl);
    var rds  = this._renderRows(rows, gb);
    this._bindSN(rds);

    if (ini) {
      div.classList.add('collapsed');
      gb.classList.add('collapsed');
    }

    gh.addEventListener('click', function () {
      var c = div.classList.toggle('collapsed');
      gb.classList.toggle('collapsed', c);
    });

    div.append(gh, gb);
    return div;
  };

  /* ----------------------------------------------------------------
   * _renderRows：渲染多列，並在所有列完成後統一建立全域遮罩鏈
   *
   * ★ 修正重點：mask-order 的重複偵測與鏈結設定改在此層進行，
   *   以「容器（container）範圍」為基準，支援跨 <ui-row> 的順序解鎖。
   *   同一 ui-group（或無 group 時整個表格）內的 mask-order 為同一條鏈。
   * ---------------------------------------------------------------- */
  UiTable.prototype._renderRows = function (rowEls, container) {
    var self = this;
    var rds  = [];

    /* ── Step 1：跨列全域預計算 mask-order 出現次數 ── */
    var globalMoCount = {};
    rowEls.forEach(function (r) {
      qsa(':scope > ui-col', r)
        .filter(function (c) { return !isSrcCol(c); })
        .forEach(function (c) {
          var mo = parseInt(c.getAttribute('mask-order'));
          if (!isNaN(mo)) globalMoCount[mo] = (globalMoCount[mo] || 0) + 1;
        });
    });

    /* ── Step 2：渲染各列（將 globalMoCount 傳入，避免在列層重複計算） ── */
    rowEls.forEach(function (r) {
      var d = self._renderRow(r, globalMoCount);
      if (d) {
        rds.push({ el: d, src: r });
        container.appendChild(d);
      }
    });

    /* ── Step 3：在 container 範圍內蒐集所有有效的有序遮罩，排序後建鏈 ── */
    var masks = Array.from(
      container.querySelectorAll('.uit-mask[data-mask-order]')
    ).sort(function (a, b) {
      return +a.dataset.maskOrder - +b.dataset.maskOrder;
    });

    /* 連續性警告（方便開發除錯） */
    for (var i = 1; i < masks.length; i++) {
      var prev = +masks[i - 1].dataset.maskOrder;
      var curr = +masks[i].dataset.maskOrder;
      if (curr !== prev + 1) {
        console.warn('[ui-table] mask-order 不連續: ' + prev + ' → ' + curr);
      }
    }

    self._setupMaskChain(masks);
    return rds;
  };

  /* ----------------------------------------------------------------
   * _renderRow：渲染單列
   *   @param {Element} rowEl        — 原始 ui-row 元素
   *   @param {Object}  globalMoCount — 全域 mask-order 計數表（由 _renderRows 傳入）
   * ---------------------------------------------------------------- */
  UiTable.prototype._renderRow = function (rowEl, globalMoCount) {
    var self = this;

    /* 篩出作用欄（排除內容來源欄） */
    var active = qsa(':scope > ui-col', rowEl).filter(function (c) {
      return !isSrcCol(c);
    });
    if (!active.length) return null;

    /* ── 驗證 col-widths ── */
    var cw = rowEl.getAttribute('col-widths');
    if (cw) {
      var parts = cw.split(':');
      if (parts.length !== this.colN) {
        console.error(
          '[ui-table] col-widths="' + cw + '" 比例數(' + parts.length +
          ')與欄數(' + this.colN + ')不符，略過此列渲染。'
        );
        return null;
      }
    }

    var div = mk('div', 'uit-row');
    if (rowEl.hasAttribute('hidden')) div.classList.add('uit-hidden');

    /* Grid 欄寬 */
    var tpl = cw
      ? cw.split(':').map(function (v) { return parseFloat(v) + 'fr'; }).join(' ')
      : 'repeat(' + this.colN + ',1fr)';
    div.style.gridTemplateColumns = tpl;

    /* 邊框 */
    var bdr = rowEl.getAttribute('border');
    if (bdr) div.style.border = bdr + ' ' + this.color;

    var pad = rowEl.getAttribute('cell-padding') || CFG.cellPadding;

    /* 列層級文字樣式 */
    var rowStyle = {
      fontSize:   rowEl.getAttribute('font-size'),
      lineHeight: rowEl.getAttribute('line-height'),
      textIndent: rowEl.getAttribute('text-indent'),
      colBorder:  rowEl.getAttribute('col-border')
    };

    /* 渲染各欄，將 globalMoCount 傳入 _renderCol */
    var colTotal = active.length;
    active.forEach(function (colEl, idx) {
      var cd = self._renderCol(colEl, pad, rowStyle, globalMoCount);
      div.appendChild(cd);

      if (rowStyle.colBorder && idx < colTotal - 1) {
        cd.style.borderRight = rowStyle.colBorder + ' ' + self.color;
      }
    });

    /* ★ 不在此呼叫 _setupMaskChain，改由 _renderRows 統一全域處理 */
    return div;
  };

  /* ----------------------------------------------------------------
   * _setupMaskChain：依序解鎖遮罩陣列
   *
   * ★ 介面變更（v1.3.0）：
   *   原本接受 orderMap（{key: colDiv}），現在接受已排序的遮罩元素陣列。
   *   由 _renderRows 排序後傳入，責任更清晰。
   *
   * @param {Element[]} masks — 已按 mask-order 數值升冪排列的遮罩元素
   * ---------------------------------------------------------------- */
  UiTable.prototype._setupMaskChain = function (masks) {
    if (!masks.length) return;

    /* 遞迴解鎖：解鎖 idx 位置的遮罩，點擊後解鎖下一個 */
    function unlockAt(idx) {
      if (idx >= masks.length) return;
      var m = masks[idx];

      m.classList.remove('locked');
      m.classList.add('unlockable');
      var lk = m.querySelector('.uit-mlock');
      if (lk) lk.remove();

      m.addEventListener('click', function handler() {
        if (!m.classList.contains('unlockable')) return;
        m.classList.add('revealed');
        unlockAt(idx + 1); // 解鎖下一關
        m.removeEventListener('click', handler);
      });
    }

    unlockAt(0);
  };

  /* ----------------------------------------------------------------
   * _renderCol：渲染單欄
   *   @param {Element} colEl        — 原始 ui-col 元素
   *   @param {string}  pad          — cell 內距
   *   @param {Object}  rowStyle     — 列層級文字樣式
   *   @param {Object}  globalMoCount — 全域 mask-order 計數表
   * ---------------------------------------------------------------- */
  UiTable.prototype._renderCol = function (colEl, pad, rowStyle, globalMoCount) {
    var self = this;
    var div  = mk('div', 'uit-col');
    div.style.padding = pad;

    /* 欄寬 & 固定欄 */
    var w = colEl.getAttribute('width');
    if (w) div.style.width = w;
    var fx = colEl.getAttribute('fixed');
    if (fx === 'left')  { div.classList.add('fix-l'); div.style.background = BG; }
    if (fx === 'right') { div.classList.add('fix-r'); div.style.background = BG; }

    /* 功能旗標 */
    var hasMask  = colEl.hasAttribute('mask-text');
    var hasCar   = colEl.hasAttribute('carousel-interval');
    var hasExp   = colEl.hasAttribute('expandable');
    var hasAlert = colEl.hasAttribute('alert-msg');
    var hasSN    = colEl.hasAttribute('show-next');
    var hasMO    = colEl.hasAttribute('mask-order');

    /* ── 互斥警告 ── */
    if (hasMask  && hasExp)  console.warn('[ui-table] mask-text+expandable 互斥，expandable 已忽略。');
    if (hasMask  && hasCar)  console.warn('[ui-table] mask-text+carousel-interval 互斥，carousel-interval 已忽略。');
    if (hasAlert && hasCar)  console.warn('[ui-table] alert-msg+carousel-interval 互斥，carousel-interval 已忽略。');

    var useCar = hasCar && !hasMask && !hasAlert;
    var useExp = hasExp && !hasMask;

    if (hasSN) div.classList.add('has-sn');

    /* ── 內容區 (flex row) ── */
    var ci = mk('div', 'uit-ci');
    ci.style.color = this.color;

    /* 圖示（支援內建 SVG 及 Bootstrap Icons） */
    var ico = colEl.getAttribute('icon');
    if (ico) ci.insertAdjacentHTML('beforeend', mkIco(ico));

    if (useCar) {
      div.appendChild(ci);
      var items  = Array.from(colEl.querySelectorAll('cell-item'));
      var ms     = parseInt(colEl.getAttribute('carousel-interval')) || 3000;
      var hasPb  = colEl.hasAttribute('progress-bar');
      var pbClr  = resolveColor(colEl.getAttribute('progress-bar-color')) || this.color;
      this._setupCarousel(ci, div, items, ms, hasPb, pbClr);
    } else {
      var clone = colEl.cloneNode(true);
      clone.querySelectorAll('cell-item').forEach(function (c) { c.remove(); });
      var ct = mk('div', 'uit-ct');
      ct.innerHTML = clone.innerHTML.trim();
      if (rowStyle) {
        if (rowStyle.fontSize)   ct.style.fontSize   = rowStyle.fontSize;
        if (rowStyle.lineHeight) ct.style.lineHeight  = rowStyle.lineHeight;
        if (rowStyle.textIndent) ct.style.textIndent  = rowStyle.textIndent;
      }
      ci.appendChild(ct);

      if (useExp) {
        div.classList.add('is-exp');
        var tog = mk('span', 'uit-etog');
        tog.innerHTML = ICO['i-expand'] || '▾';
        ci.appendChild(tog);

        ;[ct, tog].forEach(function (t) {
          t.addEventListener('click', function (e) {
            e.stopPropagation();
            var exp = div.classList.toggle('expanded');
            tog.innerHTML = exp ? (ICO['i-collapse'] || '▴') : (ICO['i-expand'] || '▾');
          });
        });
      }

      div.appendChild(ci);
    }

    /* ── 遮罩層 ── */
    if (hasMask) {
      var mc = resolveColor(colEl.getAttribute('mask-color')) || this.color;
      var m  = mk('div', 'uit-mask');
      m.style.background = hexRgba(mc, 0.92);
      m.style.color = BG;

      var lbl = mk('span');
      lbl.textContent = colEl.getAttribute('mask-text');
      m.appendChild(lbl);

      if (hasMO) {
        var moVal = parseInt(colEl.getAttribute('mask-order'));
        var isDup = !isNaN(moVal) && globalMoCount && globalMoCount[moVal] > 1;

        if (isDup) {
          /* ★ 全域重複編號：兩者皆視為無序，直接可點擊 */
          console.error('[ui-table] mask-order="' + moVal + '" 重複，視為無序。');
          m.classList.add('unlockable');
          m.addEventListener('click', function () { m.classList.add('revealed'); });
        } else {
          /* ★ 合法有序：鎖定狀態，並打上 data-mask-order 供 _renderRows 的全域鏈掃描 */
          m.classList.add('locked');
          m.dataset.maskOrder = String(isNaN(moVal) ? 0 : moVal);
          var lockIcon = mk('span', 'uit-mlock');
          lockIcon.innerHTML = ICO['i-lock'] || '🔒';
          m.appendChild(lockIcon);
        }
      } else {
        /* 無順序：直接可點擊，單向揭開 */
        m.classList.add('unlockable');
        m.addEventListener('click', function () { m.classList.add('revealed'); });
      }

      div.appendChild(m);
    }

    /* ── Alert ── */
    if (hasAlert) this._setupAlert(div, colEl);

    return div;
  };

  /* ----------------------------------------------------------------
   * _setupCarousel：輪播（垂直由下往上捲入）
   * ---------------------------------------------------------------- */
  UiTable.prototype._setupCarousel = function (ci, colDiv, items, ms, hasPb, pbClr) {
    if (!items.length) return;

    var wrap = mk('div', 'uit-car');

    var curEl = mk('div', 'uit-car-item');
    curEl.innerHTML = items[0].innerHTML;
    wrap.appendChild(curEl);
    ci.appendChild(wrap);

    /* 進度條 */
    var pbFill = null;
    if (hasPb) {
      var pb = mk('div', 'uit-pb');
      var pf = mk('div', 'uit-pf');
      pf.style.background  = pbClr;
      pf.style.animation   = 'uit-prog ' + ms + 'ms linear infinite';
      pb.appendChild(pf);
      colDiv.appendChild(pb);
      pbFill = pf;
    }

    if (items.length <= 1) return;

    var idx = 0;
    var animating = false;

    setInterval(function () {
      if (animating) return;
      animating = true;

      idx = (idx + 1) % items.length;

      var h = wrap.offsetHeight || 24;
      wrap.style.height = h + 'px';

      var nxt = mk('div', 'uit-car-item');
      nxt.innerHTML = items[idx].innerHTML;
      nxt.style.cssText = [
        'position:absolute', 'top:0', 'left:0', 'width:100%',
        'transform:translateY(100%)',
        'transition:transform .4s ease'
      ].join(';');
      wrap.appendChild(nxt);

      var old = curEl;
      old.style.cssText = [
        'position:absolute', 'top:0', 'left:0', 'width:100%',
        'transition:transform .4s ease'
      ].join(';');

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          old.style.transform = 'translateY(-100%)';
          nxt.style.transform = 'translateY(0)';
        });
      });

      setTimeout(function () {
        old.remove();
        nxt.style.cssText = '';
        curEl = nxt;
        wrap.style.height = '';
        animating = false;

        if (pbFill) {
          pbFill.style.animation = 'none';
          void pbFill.offsetHeight;
          pbFill.style.animation = 'uit-prog ' + ms + 'ms linear infinite';
        }
      }, 440);
    }, ms);
  };

  /* ----------------------------------------------------------------
   * _setupAlert：週期性 alert 顯示
   * ---------------------------------------------------------------- */
  UiTable.prototype._setupAlert = function (colDiv, colEl) {
    var msg      = colEl.getAttribute('alert-msg') || '';
    var clr      = resolveColor(colEl.getAttribute('alert-color')) || this.color;
    var interval = parseInt(colEl.getAttribute('alert-interval'));
    var pos      = (colEl.getAttribute('alert-pos') || 'C').toUpperCase();

    if (!interval || !pos || !msg) {
      console.error('[ui-table] alert-msg 需要同時設定 alert-interval 與 alert-pos，已略過。');
      return;
    }

    var content = (this.srcMap[msg] !== undefined) ? this.srcMap[msg] : msg;
    var dur     = CFG.alertDuration;
    var bgStyle = 'background:' + hexRgba(clr, 0.92) + ';color:' + BG + ';';

    if (pos === 'A') {
      var al = mk('div', 'uit-alert-A');
      al.style.cssText = bgStyle;
      al.style.fontSize = CFG.fontSize;
      al.innerHTML = content;
      colDiv.style.position = 'relative';
      colDiv.appendChild(al);

      timedTrigger(
        function () { al.classList.add('vis'); },
        function () { al.classList.remove('vis'); },
        interval, dur
      );
    } else {
      var ext = mk('div', 'uit-alert-ext');
      ext.style.cssText = bgStyle + 'font-size:' + CFG.fontSize + ';';
      ext.innerHTML = content;
      document.body.appendChild(ext);

      timedTrigger(
        function () {
          var r = colDiv.getBoundingClientRect();
          if (pos === 'B') {
            ext.style.left = r.left + 'px';
            ext.style.top  = (r.top - (ext.offsetHeight || 34) - 6) + 'px';
          } else {
            ext.style.left = (r.right + 8) + 'px';
            ext.style.top  = (r.top + r.height / 2 - (ext.offsetHeight || 18) / 2) + 'px';
          }
          ext.classList.add('vis');
        },
        function () { ext.classList.remove('vis'); },
        interval, dur
      );
    }
  };

  /* ----------------------------------------------------------------
   * _bindSN：綁定 show-next 點擊事件
   * ---------------------------------------------------------------- */
  UiTable.prototype._bindSN = function (rds) {
    rds.forEach(function (rd, i) {
      var snCols = rd.el.querySelectorAll('.has-sn');
      if (!snCols.length) return;

      var nxt = rds[i + 1];
      if (!nxt) {
        console.warn('[ui-table] show-next 找不到下一列，已略過。');
        return;
      }

      snCols.forEach(function (c) {
        c.addEventListener('click', function () {
          nxt.el.classList.toggle('uit-hidden');
        });
      });
    });
  };

  /* ================================================================
   * 自動啟動
   * ================================================================ */
  function boot() {
    document.querySelectorAll('ui-table').forEach(function (el) {
      if (!el._uit) {
        el._uit = true;
        new UiTable(el).init();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.UiTable = { init: boot, config: CFG, colors: BRAND };

})(window);

(function (global) {
  'use strict';
  var BRAND = {
    shell:    '#C6C7BD', lavender: '#C3A5E5', sky:     '#62c8f0',
    warning:  '#F08080', salmon:   '#E5C3B3', ocean:   '#0ABDC6',
    safe:     '#20c21d', teal:     '#0DA591', vanilla: '#DBEDD8',
    yellow:   '#DECA4B', focus:    '#e0be79', info:    '#79B6FA',
    indigo:   '#9B72CF', pink:     '#FFB3D9', orange:  '#EDA109',
    special:  '#C8DD5A'
  };
  var BG = '#0C0D0C';

  function clr(v) {
    if (!v) return BRAND.shell;
    v = String(v).trim();
    return BRAND[v] || (/^#|^rgb/.test(v) ? v : BRAND.shell);
  }
  var CFG = global.UiReadingConfig = Object.assign({
    /* text-morph */
    morphTheme:     'sky',
    morphDuration:  380,        /* ms，淡出淡入時長 */
    morphLabelFrom: '← 還原',
    morphLabelTo:   '看升級版 →',

    /* margin-pin */
    pinTheme:  'yellow',
    pinMargin: 20,              /* px，標注框距視窗右邊 */
    pinWidth:  210,             /* px，標注框最大寬度 */

    /* read-pulse */
    pulseColor:   'teal',
    pulseSpeed:   2800,         /* ms，掃描線從頂到底的時間 */
    pulseWidth:   '3px',        /* 掃描線粗細 */
    pulseGap:     14,           /* px，左側留白（容納掃描線） */
    pulseTrigger: 'visible',    /* visible | click | hover */

    /* chalk-mark */
    chalkTheme:     'focus',
    chalkThickness: 2.5,           /* px，弧線粗細 */
    chalkDuration:  420,           /* ms，畫出 / 消除動畫時長 */

    /* read-progress */
    progressTheme:    'sky',       /* 進度條顏色 */
    progressHeight:   '3px',       /* 進度條粗細 */
    progressPosition: 'top'        /* top | bottom */
  }, global.UiReadingConfig || {});

  var CSS = [
    'text-morph,morph-from,morph-to{display:none}',
    'margin-pin,read-pulse,chalk-mark,col-pair,read-progress{display:none}',

    '.urm-morph{display:block}',

    '.urm-morph-body{' +
      'transition:opacity var(--urm-md,.38s) ease,' +
                 'transform var(--urm-md,.38s) ease}',

    '.urm-morph-body.urm-mo{opacity:0;transform:translateY(6px)}',

    '.urm-morph-ctrl{' +
      'display:flex;align-items:center;margin-top:10px;gap:8px}',

    '.urm-morph-badge{' +
      'display:inline-flex;align-items:center;gap:6px;' +
      'padding:4px 14px;border-radius:20px;font-size:.8rem;' +
      'font-weight:700;border:1.5px solid;cursor:pointer;' +
      'user-select:none;background:transparent;' +
      'transition:filter .2s ease,transform .12s ease}',
    '.urm-morph-badge:hover{filter:brightness(1.25)}',
    '.urm-morph-badge:active{transform:scale(.93)}',

    '.urm-morph-dot{' +
      'width:7px;height:7px;border-radius:50%;' +
      'background:currentColor;flex-shrink:0;' +
      'transition:background .3s ease}',

    '.urm-pin{' +
      'border-bottom:1.5px dashed;cursor:help;' +
      'display:inline;transition:opacity .15s ease}',
    '.urm-pin:hover{opacity:.8}',

    /* 標注框（全域唯一，fixed 定位） */
    '.urm-pannot{' +
      'position:fixed;z-index:9100;' +
      'padding:8px 14px;border-radius:9px;' +
      'font-size:.82rem;line-height:1.48;font-weight:500;' +
      'pointer-events:none;' +
      'opacity:0;transition:opacity .2s ease;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.55)}',
    '.urm-pannot.urm-pv{opacity:1}',

    /* 連接虛線（全域唯一，fixed 定位） */
    '.urm-pline{' +
      'position:fixed;z-index:9099;height:0;' +
      'border-top:1px dashed;pointer-events:none;' +
      'opacity:0;transition:opacity .2s ease}',
    '.urm-pline.urm-pv{opacity:.5}',

    '.urm-pulse{' +
      'position:relative;display:block;' +
      'padding-left:var(--urm-pg,14px)}',

    /* 掃描線 bar：position absolute，left 0（在 padding 區內） */
    '.urm-pbar{' +
      'position:absolute;left:0;top:0;' +
      'width:var(--urm-pw,3px);height:0;' +
      'border-radius:3px;pointer-events:none;' +
      'opacity:0;transition:opacity .3s ease}',

    /* 播放中：高度展開 */
    '.urm-pbar.urm-pa{' +
      'opacity:1;height:100%;' +
      'transition:height var(--urm-ps,2.8s) linear,opacity .3s ease}',

    /* 播放結束：淡出 */
    '.urm-pbar.urm-pd{' +
      'opacity:0;transition:opacity .9s ease .4s}',

    '.urm-chalk{' +
      'display:inline-block;position:relative;' +
      'vertical-align:baseline;cursor:crosshair;' +
      'transition:color .25s ease}',

    /* 弧線 SVG 容器（absolute，超出文字上方） */
    '.urm-chalk-svg{' +
      'position:absolute;overflow:visible;pointer-events:none}',

    /* 弧線路徑：transition 由 JS inline style 設定 */
    '.urm-chalk-path{fill:none;stroke-linecap:round}',

    '.urm-cp{' +
      'display:inline;position:relative;cursor:default;' +
      'transition:color .2s ease}',

    /* 小圓點：absolute，浮在文字正上方，不影響行高 */
    '.urm-cp-dot{' +
      'position:absolute;top:-8px;left:50%;' +
      'transform:translateX(-50%) scale(1);' +
      'width:5px;height:5px;border-radius:50%;' +
      'background:var(--urm-cp-c,#DECA4B);' +
      'opacity:.65;pointer-events:none;' +
      'transition:transform .22s ease,opacity .22s ease}',

    /* 亮起狀態：文字變色，圓點放大發光 */
    '.urm-cp.urm-cp-lit{color:var(--urm-cp-c)}',
    '.urm-cp.urm-cp-lit .urm-cp-dot{' +
      'transform:translateX(-50%) scale(2.2);opacity:1}'

  ].join('\n');

  (function () {
    if (document.getElementById('urm-css')) return;
    var s = document.createElement('style');
    s.id = 'urm-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  })();

  function initMorph(el) {
    if (el.dataset.urm) return;
    el.dataset.urm = '1';

    var fromEl = el.querySelector('morph-from');
    var toEl   = el.querySelector('morph-to');
    if (!fromEl || !toEl) {
      console.warn('[ui-reading] <text-morph> 缺少 <morph-from> 或 <morph-to>，已略過。');
      return;
    }

    var fromHTML = fromEl.innerHTML;
    var toHTML   = toEl.innerHTML;
    var theme    = el.getAttribute('theme')       || CFG.morphTheme;
    var dur      = +(el.getAttribute('duration')  || CFG.morphDuration);
    var lblFrom  = el.getAttribute('label-from')  || CFG.morphLabelFrom;
    var lblTo    = el.getAttribute('label-to')    || CFG.morphLabelTo;
    var c        = clr(theme);
    var cSafe    = clr('safe');
    var shown    = false; /* false = from, true = to */

    var wrap = document.createElement('div');
    wrap.className = 'urm-morph';
    wrap.style.setProperty('--urm-md', dur + 'ms');

    var body = document.createElement('div');
    body.className = 'urm-morph-body';
    body.innerHTML = fromHTML;

    var ctrl  = document.createElement('div');
    ctrl.className = 'urm-morph-ctrl';

    var badge = document.createElement('span');
    badge.className = 'urm-morph-badge';

    var dot = document.createElement('span');
    dot.className = 'urm-morph-dot';

    var lbl = document.createElement('span');

    badge.appendChild(dot);
    badge.appendChild(lbl);
    ctrl.appendChild(badge);
    wrap.appendChild(body);
    wrap.appendChild(ctrl);
    el.replaceWith(wrap);

    function syncBadge() {
      var c2 = shown ? cSafe : c;
      badge.style.color       = c2;
      badge.style.borderColor = c2;
      dot.style.background    = c2;
      lbl.textContent = shown ? lblFrom : lblTo;
    }
    syncBadge();

    /* 重新初始化巢狀元件（chalk-mark / margin-pin / read-pulse） */
    function reinitNested() {
      body.querySelectorAll('chalk-mark:not([data-urm])').forEach(initChalk);
      body.querySelectorAll('margin-pin:not([data-urm])').forEach(initPin);
      body.querySelectorAll('read-pulse:not([data-urm])').forEach(initPulse);
    }

    var busy = false;
    badge.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      body.classList.add('urm-mo');
      setTimeout(function () {
        shown = !shown;
        body.innerHTML = shown ? toHTML : fromHTML;
        reinitNested();
        syncBadge();
        body.classList.remove('urm-mo');
        setTimeout(function () { busy = false; }, dur + 50);
      }, dur);
    });
  }

  var _pa = null, _pl = null, _pt = null;

  function ensurePinDom() {
    if (_pa) return;
    _pa = document.createElement('div');
    _pa.className = 'urm-pannot';
    _pl = document.createElement('div');
    _pl.className = 'urm-pline';
    document.body.appendChild(_pa);
    document.body.appendChild(_pl);
  }

  function initPin(el) {
    if (el.dataset.urm) return;
    el.dataset.urm = '1';

    var note     = el.getAttribute('note') || '';
    var themeRaw = el.getAttribute('theme') || CFG.pinTheme;

    /* 解析 outline 變體：theme="yellow-outline" → isOutline=true, themeName="yellow" */
    var isOutline = themeRaw.slice(-8) === '-outline';
    var themeName = isOutline ? themeRaw.slice(0, -8) : themeRaw;
    var c = clr(themeName);

    var mark = document.createElement('span');
    mark.className = 'urm-pin';
    mark.style.borderBottomColor = c;
    mark.style.color = c;
    mark.innerHTML = el.innerHTML;
    el.replaceWith(mark);
    ensurePinDom();

    mark.addEventListener('mouseenter', function () {
      clearTimeout(_pt);
      var mr = mark.getBoundingClientRect();

      /* 標注框：fill（預設）或 outline */
      if (isOutline) {
        _pa.style.background = BG;
        _pa.style.color      = c;
        _pa.style.border     = '1.5px solid ' + c;
        _pa.style.boxShadow  = '0 4px 16px rgba(0,0,0,.45)';
      } else {
        _pa.style.background = c;
        _pa.style.color      = BG;
        _pa.style.border     = 'none';
        _pa.style.boxShadow  = '0 4px 16px rgba(0,0,0,.55)';
      }

      _pa.style.right    = CFG.pinMargin + 'px';
      _pa.style.left     = '';
      _pa.style.maxWidth = CFG.pinWidth + 'px';
      _pa.style.top      = Math.max(8, mr.top + mr.height / 2 - 20) + 'px';
      _pa.innerHTML      = note;   /* innerHTML 支援 <br> 等標籤 */
      _pa.classList.add('urm-pv');

      /* 等標注框渲染後再計算連接線位置 */
      requestAnimationFrame(function () {
        var ar  = _pa.getBoundingClientRect();
        var ly  = mr.top + mr.height / 2;
        var lx1 = mr.right + 5;
        var lx2 = ar.left  - 5;
        _pl.style.top         = ly + 'px';
        _pl.style.left        = lx1 + 'px';
        _pl.style.width       = Math.max(0, lx2 - lx1) + 'px';
        _pl.style.borderColor = c;
        if (lx2 > lx1) _pl.classList.add('urm-pv');
      });
    });

    mark.addEventListener('mouseleave', function () {
      _pt = setTimeout(function () {
        _pa.classList.remove('urm-pv');
        _pl.classList.remove('urm-pv');
      }, 90);
    });
  }

  function initPulse(el) {
    if (el.dataset.urm) return;
    el.dataset.urm = '1';

    var c       = clr(el.getAttribute('color')       || CFG.pulseColor);
    var speed   = +(el.getAttribute('speed')          || CFG.pulseSpeed);
    var pw      = el.getAttribute('pulse-width')      || CFG.pulseWidth;
    var gap     = +(el.getAttribute('gap')            || CFG.pulseGap);
    var trigger = el.getAttribute('trigger')          || CFG.pulseTrigger;
    var repeat  = el.hasAttribute('repeat');

    var wrap = document.createElement('div');
    wrap.className = 'urm-pulse';
    wrap.style.setProperty('--urm-ps', speed + 'ms');
    wrap.style.setProperty('--urm-pw', pw);
    wrap.style.setProperty('--urm-pg', gap + 'px');

    var bar = document.createElement('div');
    bar.className = 'urm-pbar';
    bar.style.background = c;
    wrap.appendChild(bar);

    /* 搬移子節點到 wrap（bar 已是第一個 absolute 子節點） */
    Array.from(el.childNodes).forEach(function (n) { wrap.appendChild(n); });
    el.replaceWith(wrap);

    var played = false, running = false;

    function pulse() {
      if (running) return;
      if (played && !repeat) return;
      played = running = true;

      bar.classList.remove('urm-pa', 'urm-pd');
      void bar.offsetHeight; /* force reflow，確保動畫重頭播放 */
      bar.classList.add('urm-pa');

      /* 掃完後淡出，再重置狀態 */
      setTimeout(function () {
        bar.classList.add('urm-pd');
        setTimeout(function () {
          bar.classList.remove('urm-pa', 'urm-pd');
          running = false;
        }, 1400);
      }, speed + 300);
    }

    if (trigger === 'visible') {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          setTimeout(pulse, 180); /* 短延遲讓視覺安頓後再出現 */
          if (!repeat) io.disconnect();
        });
      }, { threshold: 0.25 });
      io.observe(wrap);

    } else if (trigger === 'click') {
      wrap.style.cursor = 'pointer';
      wrap.addEventListener('click', pulse);

    } else if (trigger === 'hover') {
      wrap.addEventListener('mouseenter', pulse);
    }
  }
  
  function initChalk(el) {
    if (el.dataset.urm) return;
    el.dataset.urm = '1';

    var c         = clr(el.getAttribute('theme')     || CFG.chalkTheme);
    var thick     = +(el.getAttribute('thickness')   || CFG.chalkThickness);
    var dur       = +(el.getAttribute('duration')    || CFG.chalkDuration);
    var preActive = el.hasAttribute('active');

    /* ── wrap ── */
    var wrap = document.createElement('span');
    wrap.className = 'urm-chalk';
    wrap.innerHTML = el.innerHTML;
    el.replaceWith(wrap);

    var svgEl = null, chalkPath = null, isActive = false;

    function buildArc() {
      if (svgEl) { svgEl.remove(); svgEl = null; chalkPath = null; }

      var rect  = wrap.getBoundingClientRect();
      var w     = rect.width;
      var h     = rect.height;
      var lift  = Math.round(h * 0.6);  /* 弧頂距文字頂端的距離 */
      var pad   = 3;                    /* 左右超出文字的量 */
      var svgW  = w + pad * 2;
      var svgH  = lift + 6;

      svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.className = 'urm-chalk-svg';
      svgEl.style.cssText =
        'left:' + (-pad) + 'px;' +
        'top:' + (-svgH) + 'px;' +
        'width:' + svgW + 'px;' +
        'height:' + svgH + 'px';

      /* quadratic bezier：兩端點在 SVG 底部，頂點在頂部中央 */
      var x1 = pad,        y1 = svgH - 2;   /* 左端 */
      var cx = svgW / 2,   cy = 3;           /* 控制點（弧頂） */
      var x2 = svgW - pad, y2 = svgH - 2;   /* 右端 */
      var d  = 'M ' + x1 + ' ' + y1 +
               ' Q ' + cx + ' ' + cy +
               ' ' + x2 + ' ' + y2;

      chalkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      chalkPath.setAttribute('class', 'urm-chalk-path');
      chalkPath.setAttribute('d', d);
      chalkPath.setAttribute('stroke', c);
      chalkPath.setAttribute('stroke-width', thick);

      svgEl.appendChild(chalkPath);
      wrap.appendChild(svgEl);

      /* getTotalLength() 需要元素已在 DOM 中 */
      var len = chalkPath.getTotalLength();
      chalkPath.style.strokeDasharray  = len;
      chalkPath.style.strokeDashoffset = len; /* 隱藏起點 */
      chalkPath.style.transition =
        'stroke-dashoffset ' + dur + 'ms cubic-bezier(.3,0,.2,1)';

      return len;
    }

    /* ── 啟動：畫弧 ── */
    function activate() {
      isActive = true;
      wrap.style.color = c;
      buildArc();
      /* 等瀏覽器確認 dashoffset 初始值後再啟動 transition */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (chalkPath) chalkPath.style.strokeDashoffset = '0';
        });
      });
    }

    /* ── 停用：消弧 ── */
    function deactivate() {
      isActive = false;
      wrap.style.color = '';
      if (!chalkPath) return;
      var len = parseFloat(chalkPath.style.strokeDasharray);
      chalkPath.style.strokeDashoffset = len;
      var _svg = svgEl;
      setTimeout(function () { if (_svg) _svg.remove(); }, dur + 50);
      svgEl = null; chalkPath = null;
    }

    wrap.addEventListener('click', function () {
      isActive ? deactivate() : activate();
    });

    /* active 屬性：延一幀讓佈局完成後再計算寬高 */
    if (preActive) setTimeout(activate, 80);
  }

  var _cpPalette = [
    BRAND.yellow, BRAND.sky, BRAND.lavender, BRAND.ocean,
    BRAND.salmon, BRAND.teal, BRAND.focus,   BRAND.info,
    BRAND.pink,   BRAND.orange, BRAND.indigo, BRAND.vanilla
  ];
  var _cpPaletteIdx = 0;
  /* 群組登錄表：gid → { color, members[], label, _hasTheme } */
  var _cpGroups = {};

  function initColPairs() {
    var els = Array.from(
      document.querySelectorAll('col-pair:not([data-urm])')
    );
    if (!els.length) return;

    els.forEach(function (el) {
      var gid   = el.getAttribute('group') || '_nogroup';
      var theme = el.getAttribute('theme');
      var label = el.getAttribute('label') || '';
      if (!_cpGroups[gid]) {
        var c = theme
          ? clr(theme)
          : _cpPalette[_cpPaletteIdx++ % _cpPalette.length];
        _cpGroups[gid] = { color: c, members: [], label: label, _hasTheme: !!theme };
      }
      if (theme && !_cpGroups[gid]._hasTheme) {
        _cpGroups[gid].color = clr(theme);
        _cpGroups[gid]._hasTheme = true;
      }
      if (label && !_cpGroups[gid].label) _cpGroups[gid].label = label;
    });
    var registry = [];
    els.forEach(function (el) {
      el.dataset.urm = '1';
      var gid = el.getAttribute('group') || '_nogroup';
      var grp = _cpGroups[gid];
      var c   = grp.color;

      var wrap = document.createElement('span');
      wrap.className   = 'urm-cp';
      wrap.dataset.cpg = gid;
      wrap.style.setProperty('--urm-cp-c', c);
      if (grp.label) wrap.title = grp.label;
      wrap.innerHTML = el.innerHTML;
      var dot = document.createElement('span');
      dot.className = 'urm-cp-dot';
      wrap.insertBefore(dot, wrap.firstChild);

      el.replaceWith(wrap);
      grp.members.push(wrap);
      registry.push({ wrap: wrap, gid: gid });
    });
    registry.forEach(function (item) {
      var grp = _cpGroups[item.gid];
      item.wrap.addEventListener('mouseenter', function () {
        grp.members.forEach(function (m) { m.classList.add('urm-cp-lit'); });
      });
      item.wrap.addEventListener('mouseleave', function () {
        grp.members.forEach(function (m) { m.classList.remove('urm-cp-lit'); });
      });
    });
  }
  /* ================================================================
   * initProgress：容器閱讀進度條
   *
   * 用法：<read-progress target="#article" theme="sky">
   *
   * 屬性：
   *   target    CSS selector，要追蹤的容器（省略時追蹤父元素）
   *   theme     顏色名稱或 hex（預設 CFG.progressTheme）
   *   color     同 theme，兩者擇一
   *   height    進度條粗細，任意 CSS 長度（預設 CFG.progressHeight）
   *   position  top | bottom，固定在視窗上方或下方（預設 CFG.progressPosition）
   *
   * 計算邏輯（第二種：容器無自訂捲軸）：
   *   progress = (scrollY - containerTop) / (containerHeight - innerHeight)
   *   - scrollY < containerTop         → 0%（尚未進入）
   *   - containerBottom 進入視窗底部   → 100%（已讀完）
   * ================================================================ */
  function initProgress(el) {
    if (el.dataset.urm) return;
    el.dataset.urm = '1';

    /* ── 找目標容器 ── */
    var targetSel = el.getAttribute('target');
    var target    = targetSel
      ? document.querySelector(targetSel)
      : el.parentElement;
    if (!target) {
      console.warn('[ui-reading] <read-progress> 找不到 target：' + targetSel);
      return;
    }

    var c   = clr(el.getAttribute('theme') || el.getAttribute('color') || CFG.progressTheme);
    var h   = el.getAttribute('height')    || CFG.progressHeight;
    var pos = (el.getAttribute('position') || CFG.progressPosition) === 'bottom'
              ? 'bottom' : 'top';

    /* ── 建立固定進度條 ── */
    var bar = document.createElement('div');
    bar.style.cssText =
      'position:fixed;left:0;width:0%;' +
      'height:' + h + ';' +
      (pos === 'bottom' ? 'bottom:0;top:auto;' : 'top:0;bottom:auto;') +
      'background:' + c + ';' +
      'z-index:9200;pointer-events:none;' +
      'border-radius:0 2px 2px 0;' +
      'transition:width .12s linear';
    document.body.appendChild(bar);

    /* 隱藏原始標籤 */
    el.style.display = 'none';

    /* ── 量測（resize 時重算） ── */
    var cTop = 0, cH = 0;

    function measure() {
      var r = target.getBoundingClientRect();
      cTop  = r.top + window.pageYOffset;
      cH    = target.offsetHeight;
    }

    /* ── 更新進度 ── */
    function update() {
      var scrolled = window.pageYOffset - cTop;
      var total    = cH - window.innerHeight;
      var pct;
      if (total <= 0) {
        /* 容器比視窗矮：進入可視範圍即 100% */
        pct = window.pageYOffset + window.innerHeight >= cTop + cH ? 1 : 0;
      } else {
        pct = Math.min(1, Math.max(0, scrolled / total));
      }
      bar.style.width = (pct * 100).toFixed(2) + '%';
    }

    measure();
    update();
    window.addEventListener('scroll', update,  { passive: true });
    window.addEventListener('resize', function () { measure(); update(); }, { passive: true });
  }

  function boot() {
    document.querySelectorAll('text-morph:not([data-urm])').forEach(initMorph);
    document.querySelectorAll('margin-pin:not([data-urm])').forEach(initPin);
    document.querySelectorAll('read-pulse:not([data-urm])').forEach(initPulse);
    document.querySelectorAll('chalk-mark:not([data-urm])').forEach(initChalk);
    document.querySelectorAll('read-progress:not([data-urm])').forEach(initProgress);
    initColPairs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.UiReading = { init: boot, config: CFG, colors: BRAND };

})(window);
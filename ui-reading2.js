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

  function rgba(hexOrName, a) {
    var h = clr(hexOrName);
    var r = parseInt(h.slice(1, 3), 16);
    var g = parseInt(h.slice(3, 5), 16);
    var b = parseInt(h.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  var CFG = global.UiReading2Config = Object.assign({

    /* ── layer-switch ── */
    lsDim:            0.30,          /* 非匹配標記的透明度 */
    lsToggleStyle:    'pill',        /* pill | dot */
    lsTogglePosition: 'top',         /* top | bottom */
    lsMarkStyle:      'highlight',   /* highlight | underline | box */
    lsAnimate:        true,          /* 過渡動畫 */
    lsBodyDim:        false,         /* 啟動層時整體文字是否降透明 */
    lsBodyDimVal:     0.55,          /* body-dim 的透明度 */
    lsPalette: [                     /* 按鈕自動配色盤（未設 theme 時依序取用） */
      'ocean','yellow','lavender','salmon',
      'teal','focus','info','indigo','pink','sky'
    ],

    /* ── spotlight ── */
    spTheme:          'focus',       /* 聚光圈顏色色票 */
    spRing:           true,          /* 顯示聚光圈邊框 */
    spRingWidth:      '2px',
    spRingStyle:      'solid',       /* solid | dashed | dotted */
    spDim:            0.15,          /* 其他 spotlight 的透明度 */
    spTransition:     300,           /* 動畫毫秒 */
    spEscape:         true,          /* Escape 關閉 */
    spHint:           true,          /* 顯示提示圖示 */
    spHintIcon:       'bi-fullscreen'/* Bootstrap Icon class */

  }, global.UiReading2Config || {});

  var CSS = [
    'layer-switch,ls-text,ls-layer,ls-mark{display:none}',
    'spotlight{display:none}',
    /* ── layer-switch ───────────────────────────────────────────── */
    '.urm-ls{display:block}',

    '.urm-ls-ctrl{' +
      'display:flex;flex-wrap:wrap;gap:8px;' +
      'margin-bottom:14px;align-items:center}',

    '.urm-ls-btn{' +
      'display:inline-flex;align-items:center;gap:5px;' +
      'padding:4px 14px;border-radius:20px;' +
      'font-size:.78rem;font-weight:700;border:1.5px solid;' +
      'cursor:pointer;user-select:none;background:transparent;' +
      'transition:background .2s ease,color .2s ease}',
    '.urm-ls-btn:hover{filter:brightness(1.15)}',
    '.urm-ls-btn:active{transform:scale(.95)}',

    '.urm-ls-dot{' +
      'padding:0;width:14px;height:14px;border-radius:50%;' +
      'flex-shrink:0;border-width:2px}',

    '.urm-ls-body{display:block;line-height:1.8;' +
      'transition:opacity .22s ease}',

    '.urm-ls-mark{' +
      'display:inline;border-radius:3px;padding:1px 3px;cursor:default;' +
      'transition:' +
        'background .22s ease,' +
        'color .22s ease,' +
        'opacity .22s ease,' +
        'outline-color .22s ease,' +
        'text-decoration-color .22s ease}',

    /* mark-style: underline */
    '.urm-ls-mark-ul{' +
      'text-decoration:underline;text-underline-offset:3px;' +
      'text-decoration-thickness:2px;padding:0}',

    '.urm-ls-mark-box{' +
      'outline:1.5px solid transparent;border-radius:3px;padding:1px 3px}',

    '.urm-sp{' +
      'display:block;position:relative;cursor:pointer;' +
      'transition:opacity var(--urm-spt,.3s) ease}',

    '.urm-sp-ring{' +
      'position:absolute;inset:-6px;border-radius:10px;' +
      'pointer-events:none;opacity:0;' +
      'transition:opacity .25s ease}',
    '.urm-sp.urm-sp-active>.urm-sp-ring{opacity:1}',

    '.urm-sp-hint{' +
      'position:absolute;top:6px;right:6px;' +
      'width:18px;height:18px;border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-size:.65rem;opacity:.28;pointer-events:none;' +
      'transition:opacity .2s ease}',
    '.urm-sp:hover>.urm-sp-hint{opacity:.75}',

    '.urm-sp-overlay{' +
      'position:fixed;inset:0;z-index:8999;' +
      'background:rgba(0,0,0,0);pointer-events:none;' +
      'transition:background var(--urm-spt,.3s) ease}',
    '.urm-sp-overlay.urm-sp-ov{' +
      'background:rgba(0,0,0,.82);pointer-events:all}',

    'body.urm-sp-mode .urm-sp{z-index:9000}',

    'body.urm-sp-mode .urm-sp:not(.urm-sp-active){' +
      'opacity:var(--urm-sp-dim,.15)}',

    '[data-urm-ls-src]{display:none!important}'

  ].join('\n');

  (function () {
    if (document.getElementById('urm2-css')) return;
    var s = document.createElement('style');
    s.id = 'urm2-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  })();

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function tokenize(text, gran) {
    if (gran === 'char') return text.split('');
    return text.match(/\S+|\s+/g) || [];
  }

  function computeDiff(fromText, toText, gran) {
    var a = tokenize(fromText, gran);
    var b = tokenize(toText,   gran);
    var m = a.length, n = b.length;

    /* DP 表 */
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = new Array(n + 1).fill(0);
    }
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        dp[i][j] = (a[i - 1] === b[j - 1])
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    /* 回溯 */
    var ops = [], i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        ops.unshift({ t: 'eq',  v: a[i - 1] }); i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.unshift({ t: 'ins', v: b[j - 1] }); j--;
      } else {
        ops.unshift({ t: 'del', v: a[i - 1] }); i--;
      }
    }
    return ops;
  }

  /* ops → HTML（inline：del + ins 同時呈現） */
  function renderInline(ops, cDel, cIns, delStyle, markDel, highIns, insBg) {
    return ops.map(function (op) {
      if (op.t === 'eq') return escHtml(op.v);

      if (op.t === 'del') {
        if (!markDel || delStyle === 'hide') return '';
        var cls = 'urm-td-del' + (delStyle === 'fade' ? ' urm-td-fade' : '');
        return '<span class="' + cls + '" style="color:' + cDel + '">' +
               escHtml(op.v) + '</span>';
      }

      if (op.t === 'ins') {
        if (!highIns) return escHtml(op.v);
        return '<span class="urm-td-ins" style="' +
               'background:' + rgba(cIns, insBg) + ';color:' + cIns + '">' +
               escHtml(op.v) + '</span>';
      }
      return '';
    }).join('');
  }

  /* ops → HTML（FROM 面板：eq + del，隱藏 ins） */
  function renderFrom(ops, cDel, delStyle) {
    return ops.map(function (op) {
      if (op.t === 'eq')  return escHtml(op.v);
      if (op.t === 'ins') return '';
      if (delStyle === 'hide') return '';
      var cls = 'urm-td-del' + (delStyle === 'fade' ? ' urm-td-fade' : '');
      return '<span class="' + cls + '" style="color:' + cDel + '">' +
             escHtml(op.v) + '</span>';
    }).join('');
  }

  /* ops → HTML（TO 面板：eq + ins，隱藏 del） */
  function renderTo(ops, cIns, insBg) {
    return ops.map(function (op) {
      if (op.t === 'eq')  return escHtml(op.v);
      if (op.t === 'del') return '';
      return '<span class="urm-td-ins" style="' +
             'background:' + rgba(cIns, insBg) + ';color:' + cIns + '">' +
             escHtml(op.v) + '</span>';
    }).join('');
  }

  /* ════════════════════════════════════════════════════════════════
   * layer-switch
   *
   * <layer-switch default="c1" multi="false" target="#info-panel"
   *               mark-style="highlight" toggle-style="pill">
   *   <ls-text>
   *     <ls-mark layer="c1" note="#note-c1">Like their peers,</ls-mark>
   *     <ls-mark layer="c2">adults</ls-mark>
   *     <ls-mark layer="c3">caring for an aging spouse</ls-mark>
   *   </ls-text>
   *   <ls-layer name="c1" label="介系詞片語" source="#tip-c1" theme="ocean"></ls-layer>
   *   <ls-layer name="c2" label="主詞"       source="#tip-c2" theme="yellow"></ls-layer>
   *   <ls-layer name="c3" label="分詞片語"   source="#tip-c3" theme="lavender"></ls-layer>
   * </layer-switch>
   *
   * <!-- 說明來源 div（放頁面任何位置，JS 自動隱藏） -->
   * <div id="tip-c1"><strong>介系詞片語</strong><p>當副詞修飾主句…</p></div>
   * <div id="note-c1">這個介系詞片語的具體補充說明</div>
   *
   * <!-- 顯示目標 div（使用者自行設計樣式） -->
   * <div id="info-panel"></div>
   *
   * ────────────────────────────────────────────────────────────────
   * layer-switch 屬性：
   *   default           預設啟動的層名稱（高亮生效，但 target panel 不自動注入）
   *   target            全域說明面板 div id（可被 ls-layer 個別覆蓋）
   *   palette           按鈕自動配色，逗號分隔色票名稱（如 "ocean,yellow,teal"）
   *                     ls-layer 個別 theme 屬性可覆蓋對應位置的顏色
   *                     未設定時使用 CFG.lsPalette 的預設色盤
   *   multi             允許多層同時啟動 true | false（預設 false）
   *   toggle-style      pill（預設）| dot
   *   toggle-position   top（預設）| bottom
   *   mark-style        highlight（預設）| underline | box
   *   dim               非匹配標記的透明度 0–1（預設 0.30）
   *   body-dim          啟動時整體文字是否略微降透明 true | false（預設 false）
   *   body-dim-val      body-dim 的透明度（預設 0.55）
   *   animate           過渡動畫 true（預設）| false
   *
   * ls-layer 屬性：
   *   name              層識別碼（必填）
   *   label             toggle 按鈕文字
   *   source            點擊按鈕時注入說明面板的 div id（支援 "#id" 或 "id"）
   *                     來源 div 自動隱藏
   *   target            覆蓋全域 target，指定此層要注入的 div id
   *   theme             色票名稱或 hex
   *   icon              Bootstrap Icon class（選填）
   *   info              按鈕 title tooltip（選填）
   *
   * ls-mark 屬性：
   *   layer             空格分隔的層名稱（必填；可同時屬於多層）
   *   note              兩種格式：
   *                     "純文字"   → hover 時顯示 title tooltip（原有行為）
   *                     "#some-id" → hover 時將 div#some-id 的 innerHTML 注入
   *                                  該 mark 所屬層的 target；離開時還原層說明
   *                                  來源 div 自動隱藏
   *   weight            normal（預設）| bold
   *   size              覆蓋字級，任何 CSS font-size 值
   * ════════════════════════════════════════════════════════════════ */
  function initLayerSwitch(el) {
    if (el.dataset.urm) return;
    el.dataset.urm = '1';

    var textEl   = el.querySelector('ls-text');
    var layerEls = Array.from(el.querySelectorAll('ls-layer'));
    if (!textEl || !layerEls.length) {
      console.warn('[ui-reading2] <layer-switch> 缺少 <ls-text> 或 <ls-layer>，已略過。');
      return;
    }

    var defaultL   = el.getAttribute('default')           || '';
    var globalTgt  = (el.getAttribute('target') || '').replace(/^#/, '');
    var multi      = el.getAttribute('multi')             === 'true';
    var tStyle     = el.getAttribute('toggle-style')      || CFG.lsToggleStyle;
    var tPos       = el.getAttribute('toggle-position')   || CFG.lsTogglePosition;
    var markStyle  = el.getAttribute('mark-style')        || CFG.lsMarkStyle;
    var dimVal     = +(el.getAttribute('dim')             || CFG.lsDim);
    var bodyDim    = el.getAttribute('body-dim')          === 'true' || CFG.lsBodyDim;
    var bodyDimV   = +(el.getAttribute('body-dim-val')    || CFG.lsBodyDimVal);
    var animate    = el.getAttribute('animate')           !== 'false';

    /* palette：element 屬性 > CFG.lsPalette */
    var rawPalette = (el.getAttribute('palette') || '').split(',')
                       .map(function (s) { return s.trim(); })
                       .filter(Boolean);
    var palette  = rawPalette.length ? rawPalette : CFG.lsPalette;
    var palIdx   = 0;

    /* ── 建立層定義表 ── */
    var layers = {};
    layerEls.forEach(function (le) {
      var name = le.getAttribute('name');
      if (!name) return;

      var sourceId = (le.getAttribute('source') || '').replace(/^#/, '');
      var targetId = (le.getAttribute('target') || '').replace(/^#/, '') || globalTgt;

      /* theme 未設定時從 palette 依序取色 */
      var rawTheme = le.getAttribute('theme') || '';
      var color    = rawTheme
        ? clr(rawTheme)
        : clr(palette[palIdx++ % palette.length]);

      /* 標記來源 div → CSS 自動隱藏 */
      if (sourceId) {
        var srcEl = document.getElementById(sourceId);
        if (srcEl) srcEl.dataset.urmLsSrc = '1';
      }

      layers[name] = {
        label:    le.getAttribute('label') || name,
        sourceId: sourceId,
        targetId: targetId,
        color:    color,
        icon:     le.getAttribute('icon')  || '',
        info:     le.getAttribute('info')  || ''
      };
    });

    /* ── 將所有 target div 的初始內容清空（避免殘留舊 HTML） ── */
    var knownTargets = {};
    Object.keys(layers).forEach(function (n) {
      var tid = layers[n].targetId;
      if (tid) knownTargets[tid] = true;
    });
    Object.keys(knownTargets).forEach(function (tid) {
      var tgtEl = document.getElementById(tid);
      if (tgtEl && !defaultL) tgtEl.innerHTML = '';
    });

    /* ── 將 ls-mark 換成 span ── */
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = textEl.innerHTML;
    tempDiv.querySelectorAll('ls-mark').forEach(function (markEl) {
      var layerAttr = markEl.getAttribute('layer') || '';
      var rawNote   = markEl.getAttribute('note')  || '';
      var weight    = markEl.getAttribute('weight')|| 'normal';
      var size      = markEl.getAttribute('size')  || '';
      var noteIsId  = rawNote.charAt(0) === '#';

      var span = document.createElement('span');
      span.className      = 'urm-ls-mark';
      if (markStyle === 'underline') span.classList.add('urm-ls-mark-ul');
      if (markStyle === 'box')       span.classList.add('urm-ls-mark-box');
      span.dataset.layers = layerAttr.trim();

      if (noteIsId) {
        /* note="#id"：注入 target，存 id，自動隱藏來源 div */
        span.dataset.urmLsNote = rawNote.slice(1);
        var noteSrc = document.getElementById(rawNote.slice(1));
        if (noteSrc) noteSrc.dataset.urmLsSrc = '1';
      } else if (rawNote) {
        /* note="純文字"：維持原有 title tooltip */
        span.title = rawNote;
      }

      if (weight === 'bold') span.style.fontWeight = '700';
      if (size)              span.style.fontSize   = size;
      span.innerHTML = markEl.innerHTML;
      markEl.replaceWith(span);
    });

    /* ── 組裝 DOM ── */
    var wrap = document.createElement('div');
    wrap.className = 'urm-ls';
    if (!animate) wrap.style.cssText += 'transition:none';

    var ctrl = document.createElement('div');
    ctrl.className = 'urm-ls-ctrl';

    var body = document.createElement('div');
    body.className = 'urm-ls-body';
    body.innerHTML = tempDiv.innerHTML;

    var markSpans = Array.from(body.querySelectorAll('.urm-ls-mark'));

    /* ── 啟動層狀態 ── */
    var active = new Set();
    if (defaultL && layers[defaultL]) active.add(defaultL);

    /* ── 將 active 層的 source 注入對應 target ── */
    function injectTargets() {
      /* 先記錄哪些 target 要被寫入什麼（後啟動的層覆蓋先啟動的） */
      var toWrite = {};
      active.forEach(function (n) {
        var l = layers[n];
        if (l.sourceId && l.targetId) {
          var srcEl = document.getElementById(l.sourceId);
          if (srcEl) toWrite[l.targetId] = srcEl.innerHTML;
        }
      });

      /* 已知所有 target：有寫入就注入，沒有就清空 */
      Object.keys(knownTargets).forEach(function (tid) {
        var tgtEl = document.getElementById(tid);
        if (tgtEl) tgtEl.innerHTML = (tid in toWrite) ? toWrite[tid] : '';
      });
    }

    /* ── 更新標記高亮樣式；doInject=true 時才同步 target panel ── */
    function applyLayers(doInject) {
      var anyActive = active.size > 0;
      body.style.opacity = (bodyDim && anyActive) ? String(bodyDimV) : '';

      markSpans.forEach(function (span) {
        var spanLayers   = span.dataset.layers.split(/\s+/).filter(Boolean);
        var matchedLayer = spanLayers.find(function (l) { return active.has(l); });

        if (!anyActive) {
          span.style.opacity              = '';
          span.style.background           = '';
          span.style.color                = '';
          span.style.outlineColor         = 'transparent';
          if (markStyle === 'underline')
            span.style.textDecorationColor = 'currentColor';
          return;
        }

        if (matchedLayer) {
          var c = layers[matchedLayer].color;
          span.style.opacity = '1';
          if (markStyle === 'underline') {
            span.style.background           = '';
            span.style.color                = c;
            span.style.textDecorationColor  = c;
          } else if (markStyle === 'box') {
            span.style.background  = '';
            span.style.color       = c;
            span.style.outlineColor = c;
          } else {
            span.style.background = rgba(c, 0.26);
            span.style.color      = c;
          }
        } else {
          span.style.opacity              = dimVal;
          span.style.background           = '';
          span.style.color                = '';
          span.style.outlineColor         = 'transparent';
          if (markStyle === 'underline')
            span.style.textDecorationColor = 'transparent';
        }
      });

      if (doInject) injectTargets();
    }
    applyLayers(false);  /* 初始：只套高亮樣式，不注入 target panel */

    /* ── ls-mark note="#id"：hover 時暫時注入 note，離開時還原 ── */
    markSpans.forEach(function (span) {
      var noteId = span.dataset.urmLsNote;
      if (!noteId) return;

      /* 找出此 mark 所屬層的 target（取第一個有設定 target 的層） */
      function getTargetId() {
        var spanLayers = span.dataset.layers.split(/\s+/).filter(Boolean);
        for (var i = 0; i < spanLayers.length; i++) {
          var l = layers[spanLayers[i]];
          if (l && l.targetId) return l.targetId;
        }
        return globalTgt;
      }

      span.addEventListener('mouseenter', function () {
        var tid   = getTargetId();
        var noteSrc = document.getElementById(noteId);
        var tgtEl   = tid ? document.getElementById(tid) : null;
        if (noteSrc && tgtEl) tgtEl.innerHTML = noteSrc.innerHTML;
      });

      span.addEventListener('mouseleave', function () {
        /* 離開後還原此 target 目前 active 層的說明；若無 active 則清空 */
        var tid   = getTargetId();
        var tgtEl = tid ? document.getElementById(tid) : null;
        if (!tgtEl) return;
        var restored = false;
        active.forEach(function (n) {
          if (restored) return;
          var l = layers[n];
          if (l.targetId === tid && l.sourceId) {
            var srcEl = document.getElementById(l.sourceId);
            if (srcEl) { tgtEl.innerHTML = srcEl.innerHTML; restored = true; }
          }
        });
        if (!restored) tgtEl.innerHTML = '';
      });
    });

    /* ── Toggle 按鈕 ── */
    Object.keys(layers).forEach(function (name) {
      var layer = layers[name];
      var isDot = tStyle === 'dot';
      var btn   = document.createElement('span');
      btn.className   = 'urm-ls-btn' + (isDot ? ' urm-ls-dot' : '');
      btn.dataset.lsn = name;
      btn.style.color       = layer.color;
      btn.style.borderColor = layer.color;
      if (layer.info) btn.title = layer.info;

      if (!isDot) {
        if (layer.icon) {
          var ic = document.createElement('i');
          ic.className = layer.icon;
          ic.setAttribute('aria-hidden', 'true');
          btn.appendChild(ic);
        }
        btn.appendChild(document.createTextNode(layer.label));
      }

      function syncBtn(n, b) {
        if (active.has(n)) {
          b.style.background = layers[n].color;
          b.style.color      = BG;
        } else {
          b.style.background = 'transparent';
          b.style.color      = layers[n].color;
        }
      }
      syncBtn(name, btn);

      btn.addEventListener('click', function () {
        if (multi) {
          active.has(name) ? active.delete(name) : active.add(name);
        } else {
          if (active.has(name)) { active.clear(); }
          else                  { active.clear(); active.add(name); }
        }
        /* 同步所有按鈕 */
        ctrl.querySelectorAll('.urm-ls-btn').forEach(function (b) {
          var n = b.dataset.lsn;
          if (n && layers[n]) syncBtn(n, b);
        });
        applyLayers(true);  /* 使用者點擊後才注入 target panel */
      });

      ctrl.appendChild(btn);
    });

    if (tPos === 'bottom') {
      wrap.appendChild(body);
      wrap.appendChild(ctrl);
    } else {
      wrap.appendChild(ctrl);
      wrap.appendChild(body);
    }

    el.replaceWith(wrap);
  }

  /* ════════════════════════════════════════════════════════════════
   * spotlight
   *
   * <spotlight theme="focus" ring="true" dim="0.15">
   *   <p>任何內容…</p>
   * </spotlight>
   *
   * 屬性：
   *   theme           聚光圈顏色色票或 hex（預設 spTheme）
   *   ring            顯示聚光圈邊框 true（預設）| false
   *   ring-width      邊框粗細（預設 2px）
   *   ring-style      solid（預設）| dashed | dotted
   *   ring-radius     邊框圓角（預設 10px）
   *   ring-inset      邊框距元素邊緣的距離（預設 6px）
   *   dim             其他 spotlight 的透明度 0–1（預設 0.15）
   *   dim-bg          overlay 遮罩不透明度 0–1（預設 0.82）
   *   transition      動畫毫秒（預設 300）
   *   trigger         click（預設）| hover
   *   escape          Escape 鍵關閉 true（預設）| false
   *   hint            顯示提示圖示 true（預設）| false
   *   hint-icon       Bootstrap Icon class（預設 bi-fullscreen）
   *   hint-size       提示圖示尺寸 px（預設 18）
   *   padding         啟動時的內距（選填，覆蓋原本的 padding）
   *   active          有此屬性時頁面載入後自動啟動
   *
   * ★ spotlight 依賴 z-index 堆疊效果。
   *   若父容器有 transform / filter / will-change 等屬性建立新的
   *   stacking context，z-index 可能失效，視覺效果不如預期。
   * ════════════════════════════════════════════════════════════════ */
  var _spOverlay  = null;
  var _spAll      = [];
  var _spActive   = null;
  var _spEscBound = false;

  function ensureSpOverlay() {
    if (_spOverlay) return;
    _spOverlay = document.createElement('div');
    _spOverlay.className = 'urm-sp-overlay';
    document.body.appendChild(_spOverlay);
    _spOverlay.addEventListener('click', deactivateSp);
  }

  function activateSp(wrap) {
    if (_spActive === wrap) { deactivateSp(); return; }
    _spActive = wrap;
    /* 以啟動元素的 dim 設定控制所有未啟動元素的透明度 */
    var dim = parseFloat(wrap.dataset.spDim);
    document.body.style.setProperty('--urm-sp-dim', isNaN(dim) ? CFG.spDim : dim);
    document.body.classList.add('urm-sp-mode');
    _spAll.forEach(function (el) { el.classList.remove('urm-sp-active'); });
    wrap.classList.add('urm-sp-active');
    _spOverlay.classList.add('urm-sp-ov');
  }

  function deactivateSp() {
    if (!_spActive) return;
    _spActive = null;
    document.body.classList.remove('urm-sp-mode');
    document.body.style.removeProperty('--urm-sp-dim');
    _spAll.forEach(function (el) { el.classList.remove('urm-sp-active'); });
    _spOverlay.classList.remove('urm-sp-ov');
  }

  function initSpotlight(el) {
    if (el.dataset.urm) return;
    el.dataset.urm = '1';

    var theme      = el.getAttribute('theme')       || CFG.spTheme;
    var ring       = el.getAttribute('ring')        !== 'false';
    var ringW      = el.getAttribute('ring-width')  || CFG.spRingWidth;
    var rStyle     = el.getAttribute('ring-style')  || CFG.spRingStyle;
    var ringR      = el.getAttribute('ring-radius') || '10px';
    var ringInset  = el.getAttribute('ring-inset')  || '6px';
    var dim        = el.getAttribute('dim')         || String(CFG.spDim);
    var dimBg      = +(el.getAttribute('dim-bg')    || 0.82);
    var dur        = +(el.getAttribute('transition') || CFG.spTransition);
    var trigger    = el.getAttribute('trigger')     || 'click';
    var esc        = el.getAttribute('escape')      !== 'false';
    var hint       = el.getAttribute('hint')        !== 'false' && CFG.spHint;
    var hintIcon   = el.getAttribute('hint-icon')   || CFG.spHintIcon;
    var hintSize   = el.getAttribute('hint-size')   || '18';
    var padding    = el.getAttribute('padding')     || '';
    var preActive  = el.hasAttribute('active');
    var c          = clr(theme);

    var wrap = document.createElement('div');
    wrap.className   = 'urm-sp';
    wrap.dataset.spDim = dim;
    wrap.style.setProperty('--urm-spt', dur + 'ms');
    if (padding) wrap.style.padding = padding;
    wrap.innerHTML = el.innerHTML;

    /* 聚光圈邊框 */
    if (ring) {
      var ringEl = document.createElement('div');
      ringEl.className = 'urm-sp-ring';
      ringEl.style.cssText =
        'border:' + ringW + ' ' + rStyle + ' ' + c + ';' +
        'border-radius:' + ringR + ';' +
        'inset:-' + ringInset;
      wrap.appendChild(ringEl);
    }

    /* 提示圖示 */
    if (hint) {
      var hintEl = document.createElement('div');
      hintEl.className = 'urm-sp-hint';
      hintEl.style.cssText =
        'background:' + c + ';color:' + BG + ';' +
        'width:' + hintSize + 'px;height:' + hintSize + 'px';
      hintEl.innerHTML = '<i class="' + hintIcon + '" aria-hidden="true" ' +
                         'style="font-size:' + Math.round(+hintSize * 0.65) + 'px"></i>';
      wrap.appendChild(hintEl);
    }

    /* overlay 遮罩透明度 */
    if (_spOverlay) {
      _spOverlay.style.setProperty('--urm-sp-ovbg', 'rgba(0,0,0,' + dimBg + ')');
    }

    el.replaceWith(wrap);
    _spAll.push(wrap);
    ensureSpOverlay();

    /* overlay 背景色（每次初始化最後設定的會生效，建議全站統一） */
    _spOverlay.style.setProperty('--urm-sp-ovbg', 'rgba(0,0,0,' + dimBg + ')');

    /* Escape 鍵全域只綁一次 */
    if (esc && !_spEscBound) {
      _spEscBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && _spActive) deactivateSp();
      });
    }

    if (trigger === 'click') {
      wrap.addEventListener('click', function (e) {
        e.stopPropagation();
        activateSp(wrap);
      });
    } else if (trigger === 'hover') {
      wrap.addEventListener('mouseenter', function () { activateSp(wrap); });
      wrap.addEventListener('mouseleave', deactivateSp);
    }

    if (preActive) setTimeout(function () { activateSp(wrap); }, 120);
  }

  function boot() {
    document.querySelectorAll('layer-switch:not([data-urm])').forEach(initLayerSwitch);
    document.querySelectorAll('spotlight:not([data-urm])').forEach(initSpotlight);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.UiReading2 = { init: boot, config: CFG, colors: BRAND };

})(window);

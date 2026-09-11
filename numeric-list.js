/*!
 * NumericList v2.1.0
 * <ui-list> / <list-item> 自訂標籤元件 — 2026-09-11
 *
 * 全域設定：NumericList.setup({ key: value })
 * 手動渲染：NumericList.render(uiListEl)
 * 設定快照：NumericList.defaults
 *
 * <ui-list> 屬性：
 *   width="80%/360px"   width / min-width
 *   gap="8px"           項目間距（覆蓋 Config.rowGap）
 *   hover="#color"      hover 邊框色（覆蓋 Config.borderHoverColor）
 *
 * setup() 自動同步規則：
 *   設定 numberColor → 自動同步 themeColor（數字統一色）與 borderHoverColor
 *   可個別傳入 themeColor / borderHoverColor 覆蓋自動同步
 *   傳入 themeColor: null → 恢復 accentColors 循環
 */
(function (global) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
   *  全域設定
   * ═══════════════════════════════════════════════════════════════════ */
  var Config = {
    borderColor:        '#31332f',
    borderHoverColor:   '#95c9de',   /* hover 邊框（global） */
    borderActiveColor:  '#C3A5E5',
    numberColor:        '#95c9de',   /* CSS 用，JS 端以 themeColor 優先 */
    themeColor:         null,        /* 非 null 時，所有數字統一此色；null 則循環 accentColors */
    numberBg:           '#0d1b24',
    numberDivider:      '#1c2d38',
    textColor:          '#C6C7BD',
    backgroundColor:    '#0C0D0C',
    activeBackground:   '#10192a',

    accentColors: [
      '#95c9de',   /* sky     */
      '#C3A5E5',   /* lavender*/
      '#0ABDC6',   /* ocean   */
      '#b3de73',   /* special */
      '#DECA4B',   /* yellow  */
      '#E5C3B3',   /* salmon  */
      '#0DA591',   /* teal    */
      '#FFB3D9',   /* pink    */
      '#EDA109',   /* orange  */
      '#9B72CF',   /* indigo  */
    ],

    fontSize:       '1.125rem',
    numberFontSize: '3rem',
    numberMinWidth: '84px',
    borderRadius:   '6px',
    borderWidth:    '1px',
    rowGap:         '4px',          /* 全局預設 gap */
    lineHeight:     1.5,
    padV:           '16px',
    padH:           '24px',
    numberPad:      '16px 22px',
    lineGap:        '4px',
  };

  /* ═══════════════════════════════════════════════════════════════════
   *  WeakMap：儲存每個 <ui-list> 的解析資料
   * ═══════════════════════════════════════════════════════════════════ */
  var store = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;

  /* ═══════════════════════════════════════════════════════════════════
   *  CSS 注入
   *  hover / gap / active 邊框色以 CSS 自訂屬性 (--nl-*) 表達，
   *  fallback 使用 Config 當時的全局值，支援 per-list 屬性覆蓋。
   * ═══════════════════════════════════════════════════════════════════ */
  function buildCSS() {
    var c = Config;
    return (
      'ui-list{display:block}' +

      '.nl-list{' +
        'display:flex;flex-direction:column;' +
        'gap:var(--nl-gap,' + c.rowGap + ');' +   /* per-list gap 屬性在此生效 */
        'list-style:none;margin:0;padding:0' +
      '}' +

      '.nl-item{' +
        'display:flex;align-items:stretch;' +
        'border:' + c.borderWidth + ' solid ' + c.borderColor + ';' +
        'border-radius:' + c.borderRadius + ';overflow:hidden;' +
        'background:' + c.backgroundColor + ';' +
        'transition:border-color .18s ease,background .18s ease' +
      '}' +

      /* hover 邊框：per-list --nl-hover-color 優先，fallback 全局 borderHoverColor */
      '.nl-item:hover{' +
        'border-color:var(--nl-hover-color,' + c.borderHoverColor + ')' +
      '}' +

      '.nl-item--clickable{cursor:pointer}' +

      /* active 邊框：per-list --nl-active-color 優先 */
      '.nl-item--active{' +
        'border-color:var(--nl-active-color,' + c.borderActiveColor + ')!important;' +
        'background:' + c.activeBackground +
      '}' +

      '.nl-number{' +
        'display:flex;align-items:center;justify-content:center;' +
        'min-width:' + c.numberMinWidth + ';background:' + c.numberBg + ';' +
        'font-size:' + c.numberFontSize + ';font-weight:700;' +
        'padding:' + c.numberPad + ';' +
        'border-right:' + c.borderWidth + ' solid ' + c.numberDivider + ';' +
        'flex-shrink:0;line-height:1;user-select:none;font-variant-numeric:tabular-nums' +
      '}' +

      '.nl-content{' +
        'display:flex;flex-direction:column;justify-content:center;' +
        'padding:' + c.padV + ' ' + c.padH + ';gap:' + c.lineGap + ';flex:1;min-width:0;' +
        'font-size:' + c.fontSize + ';color:' + c.textColor + ';line-height:' + c.lineHeight +
      '}' +

      '.nl-content p,.nl-content li{margin:0;padding:0}' +
      '.nl-placeholder{color:#595a57;font-style:italic}'
    );
  }

  function injectCSS() {
    var el = document.getElementById('_nl_css');
    if (!el) {
      el = document.createElement('style');
      el.id = '_nl_css';
      document.head.appendChild(el);
    }
    el.textContent = buildCSS();
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  width 屬性解析
   *  "80%/360px" → width:80%; min-width:360px
   * ═══════════════════════════════════════════════════════════════════ */
  function applyWidth(el, attr) {
    if (!attr) { el.style.width = '100%'; return; }
    var parts = attr.split('/');
    el.style.width = parts[0].trim();
    if (parts[1]) el.style.minWidth = parts[1].trim();
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  per-list CSS 自訂屬性設置
   *  gap / hover / active 屬性寫入 ui-list 元素的 CSS 變數，
   *  讓 .nl-* 的 var(--nl-*) 取用，不影響其他清單。
   * ═══════════════════════════════════════════════════════════════════ */
  function applyListProps(listEl) {
    var gap    = listEl.getAttribute('gap');
    var hover  = listEl.getAttribute('hover');
    var active = listEl.getAttribute('active');

    if (gap)    listEl.style.setProperty('--nl-gap',          gap);
    if (hover)  listEl.style.setProperty('--nl-hover-color',  hover);
    /* active 顏色通常與 hover 一致；未設定時跟隨 hover */
    if (active) listEl.style.setProperty('--nl-active-color', active);
    else if (hover) listEl.style.setProperty('--nl-active-color', hover);
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  資料擷取
   * ═══════════════════════════════════════════════════════════════════ */
  function extractItems(listEl) {
    var items = listEl.querySelectorAll(':scope > list-item');
    return Array.prototype.map.call(items, function (item, i) {
      return {
        number : item.getAttribute('number') || String(i + 1),
        accent : item.getAttribute('accent') || null,
        source : item.getAttribute('source') || null,
        target : item.getAttribute('target') || null,
        html   : item.innerHTML.trim(),
      };
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  建立單一 <li>
   *
   *  數字顏色優先序：
   *    1. data.accent（list-item accent 屬性）
   *    2. Config.themeColor（theme 統一色，setup() 自動同步）
   *    3. Config.accentColors 循環（無 theme 時的彩色預設）
   * ═══════════════════════════════════════════════════════════════════ */
  function buildLi(data, idx, siblings) {
    var accent = data.accent
      || Config.themeColor
      || Config.accentColors[idx % Config.accentColors.length];

    var isClickable = !!(data.source && data.target);

    var li = document.createElement('li');
    li.className = 'nl-item' + (isClickable ? ' nl-item--clickable' : '');

    var numDiv = document.createElement('div');
    numDiv.className   = 'nl-number';
    numDiv.style.color = accent;
    numDiv.textContent = data.number;

    var body = document.createElement('div');
    body.className = 'nl-content';

    if (data.html) {
      body.innerHTML = data.html;
    } else if (isClickable) {
      body.innerHTML = '<span class="nl-placeholder">點擊載入內容</span>';
    }

    li.appendChild(numDiv);
    li.appendChild(body);

    if (isClickable) {
      li.addEventListener('click', function () {
        for (var j = 0; j < siblings.length; j++) {
          siblings[j].classList.remove('nl-item--active');
        }
        li.classList.add('nl-item--active');

        var srcEl = document.getElementById(data.source);
        var tgtEl = document.getElementById(data.target);
        if (srcEl && tgtEl) tgtEl.innerHTML = srcEl.innerHTML;
      });
    }

    return li;
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  渲染單一 <ui-list>
   * ═══════════════════════════════════════════════════════════════════ */
  function renderUIList(listEl) {
    var widthAttr;
    var itemData;

    var rawItems = listEl.querySelectorAll(':scope > list-item');
    if (rawItems.length) {
      widthAttr = listEl.getAttribute('width');
      itemData  = extractItems(listEl);
      if (store) store.set(listEl, { width: widthAttr, items: itemData });
    } else {
      var cached = store ? store.get(listEl) : null;
      if (!cached) return;
      widthAttr = cached.width;
      itemData  = cached.items;
    }

    for (var s = 0; s < itemData.length; s++) {
      if (itemData[s].source) {
        var srcEl = document.getElementById(itemData[s].source);
        if (srcEl) srcEl.style.display = 'none';
      }
    }

    var ol       = document.createElement('ol');
    ol.className = 'nl-list';
    var liEls    = [];

    for (var i = 0; i < itemData.length; i++) {
      var li = buildLi(itemData[i], i, liEls);
      liEls.push(li);
      ol.appendChild(li);
    }

    applyWidth(listEl, widthAttr);
    applyListProps(listEl);   /* gap / hover / active 屬性 → CSS 自訂屬性 */

    listEl.innerHTML = '';
    listEl.appendChild(ol);
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  公開 API
   * ═══════════════════════════════════════════════════════════════════ */
  var NumericList = {
    get defaults() { return Object.assign({}, Config); },

    /**
     * 覆蓋全域設定並重建 CSS。
     *
     * 自動同步規則（可個別傳入覆蓋）：
     *   opts.numberColor 有值，且未傳入 themeColor
     *     → Config.themeColor = opts.numberColor（數字統一色）
     *   opts.numberColor 或 opts.themeColor 有值，且未傳入 borderHoverColor
     *     → Config.borderHoverColor = theme 色（hover 跟 theme 走）
     *
     * 恢復循環色：setup({ themeColor: null })
     */
    setup: function (opts) {
      if (!opts || typeof opts !== 'object') { injectCSS(); return; }

      Object.assign(Config, opts);

      /* themeColor 自動同步 */
      if (opts.numberColor !== undefined && opts.themeColor === undefined) {
        Config.themeColor = opts.numberColor;
      }

      /* borderHoverColor 自動同步 */
      var themeChanged = opts.numberColor !== undefined || opts.themeColor !== undefined;
      if (themeChanged && opts.borderHoverColor === undefined) {
        Config.borderHoverColor = Config.themeColor || Config.numberColor;
      }

      /* borderActiveColor 同步（若未明確傳入） */
      if (themeChanged && opts.borderActiveColor === undefined) {
        Config.borderActiveColor = Config.themeColor || Config.numberColor;
      }

      injectCSS();
    },

    init: function () {
      injectCSS();
      var lists = document.querySelectorAll('ui-list');
      Array.prototype.forEach.call(lists, renderUIList);
    },

    render: function (el) {
      if (!el) return;
      injectCSS();
      renderUIList(el);
    },
  };

  global.NumericList = NumericList;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { NumericList.init(); });
  } else {
    NumericList.init();
  }

}(window));

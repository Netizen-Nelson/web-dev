class BrandColors {

  // ── 深色主題 ─────────────────────────────────────────────────
  static dark = {
    name:         'dark',
    bg:           '#0c0d0c',
    surface:      '#333333',
    shell:        '#c6c7bd',
    lavender:     '#C3A5E5',
    special:      '#C8DD5A',
    warning:      '#F08080',
    salmon:       '#E5C3B3',
    attention:    '#E5E5A6',
    sky:          '#04b5a3',
    safe:         '#81E6D9',
    brown:        '#d9b375',
    info:         '#90CDF4',
    pink:         '#FFB3D9',
    orange:       '#f69653',
    // 衍生（浮動面板用）
    floatBg:      '#1e1f1e',
    floatBg2:     '#242524',
    floatBg3:     '#2a2b2a',
    borderSubtle: 'rgba(198,199,189,0.15)',
    progressTrack:'#151615',
  };

  // ── 淺色主題 ─────────────────────────────────────────────────
  static light = {
    name:         'light',
    bg:           '#f4f4f0',
    surface:      '#e2e3dc',
    shell:        '#1e1f1e',
    lavender:     '#6B35B5',
    special:      '#5a6e00',
    warning:      '#b53030',
    salmon:       '#8B4A30',
    attention:    '#70700a',
    sky:          '#027a6c',
    safe:         '#1a7a6e',
    brown:        '#7a5010',
    info:         '#1a5fa0',
    pink:         '#b5005a',
    orange:       '#b54a00',
    floatBg:      '#ffffff',
    floatBg2:     '#f8f8f6',
    floatBg3:     '#f0f0ec',
    borderSubtle: 'rgba(30,31,30,0.12)',
    progressTrack:'#d5d6d0',
  };

  static #currentTheme = 'dark';

  static #varMap = {
    bg:           '--color-bg',
    surface:      '--color-surface',
    shell:        '--color-shell',
    lavender:     '--color-lavender',
    special:      '--color-special',
    warning:      '--color-warning',
    salmon:       '--color-salmon',
    attention:    '--color-attention',
    sky:          '--color-sky',
    safe:         '--color-safe',
    brown:        '--color-brown',
    info:         '--color-info',
    pink:         '--color-pink',
    orange:       '--color-orange',
    floatBg:      '--color-float-bg',
    floatBg2:     '--color-float-bg-2',
    floatBg3:     '--color-float-bg-3',
    borderSubtle: '--color-border-subtle',
    progressTrack:'--color-progress-track',
  };

  /** 取得目前主題名稱 */
  static get currentTheme() { return BrandColors.#currentTheme; }

  /** 取得目前主題物件 */
  static get current() { return BrandColors[BrandColors.#currentTheme]; }

  /**
   * 將指定主題寫入 :root CSS 變數，並更新 data-theme 屬性。
   * 所有使用 var(--color-*) 的元件會自動反映變更。
   * @param {'dark'|'light'} themeName
   */
  static applyTheme(themeName = 'dark') {
    const theme = BrandColors[themeName];
    if (!theme) { console.warn(`BrandColors.applyTheme：找不到主題 "${themeName}"`); return; }
    const root = document.documentElement;
    for (const [key, varName] of Object.entries(BrandColors.#varMap)) {
      if (theme[key]) root.style.setProperty(varName, theme[key]);
    }
    root.setAttribute('data-theme', themeName);
    BrandColors.#currentTheme = themeName;
  }

  /**
   * 取單一顏色值。
   * @param {string} colorKey  例如 'sky'
   * @param {'dark'|'light'} [themeName]  省略則用目前主題
   */
  static get(colorKey, themeName) {
    return BrandColors[themeName ?? BrandColors.#currentTheme]?.[colorKey];
  }

  /** 取整份主題物件的淺拷貝 */
  static getTheme(themeName) { return { ...BrandColors[themeName] }; }

  /**
   * 以色彩名稱（或 hex）解析出 hex 字串。
   * 找不到名稱時原值回傳，符合 resolveColor 常見用途。
   * @param {string|null} val
   * @param {'dark'|'light'} [themeName]
   */
  static resolve(val, themeName) {
    if (!val) return null;
    const theme = BrandColors[themeName ?? BrandColors.#currentTheme];
    return theme?.[val.toLowerCase()] ?? val;
  }

  /** 輸出 CSS 變數字串（可貼入 <style> :root 區塊）*/
  static toCSSVars(themeName = 'dark') {
    const theme = BrandColors[themeName];
    if (!theme) return '';
    return Object.entries(BrandColors.#varMap)
      .filter(([key]) => theme[key])
      .map(([key, varName]) => `  ${varName}: ${theme[key]};`)
      .join('\n');
  }
}

// 預設注入深色主題 CSS 變數
if (typeof document !== 'undefined') {
  const _inject = () => {
    BrandColors.applyTheme('dark');
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _inject, { once: true });
  } else {
    _inject();
  }
  window.BrandColors = BrandColors;
}

class DualCell {

  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`[dual-cell] 找不到容器: ${containerId}`);
      return;
    }

    const theme = options.theme || null;
    const tc    = theme ? DualCell.getThemeConfig(theme) : {};
    const R     = DualCell.resolveColor;

    this.options = {
      theme,
      cols:      parseInt(options.cols) || 2,
      colWidths: options.colWidths || null,
      cellMinHeight:     options.cellMinHeight   || '40px',
      cellPadding:       options.cellPadding     || '8px 12px',
      cellBgColor:       R(options.cellBgColor)  || tc.cellBgColor   || 'var(--color-surface, #333333)',
      hoverBgColor:      R(options.hoverBgColor) || tc.hoverBgColor  || '#404040',
      textColor:         R(options.textColor)    || tc.textColor     || 'var(--color-shell, #c6c7bd)',
      fontSize:          options.fontSize        || '1rem',
      cellAlignment:     options.cellAlignment   || 'left',
      verticalAlignment: options.verticalAlignment || 'middle',
      borderWidth:       options.borderWidth  || '1px',
      borderStyle:       options.borderStyle  || 'solid',
      borderColor:       R(options.borderColor) || tc.borderColor || 'var(--color-shell, #c6c7bd)',
      borderFollowTheme: options.borderFollowTheme || false,
      showMenuButton:               options.showMenuButton !== false,
      menuButtonPosition:           options.menuButtonPosition  || 'right',
      menuButtonColor:              R(options.menuButtonColor)  || tc.menuButtonColor || BrandColors.get('special'),
      menuButtonSize:               options.menuButtonSize      || '1.25rem',
      menuButtonIconPush:           options.menuButtonIconPush           || null,
      menuButtonIconPull:           options.menuButtonIconPull           || null,
      menuButtonIconCopy:           options.menuButtonIconCopy           || null,
      menuButtonIconSwap:           options.menuButtonIconSwap           || null,
      menuButtonIconClear:          options.menuButtonIconClear          || null,
      menuButtonIconToggle:         options.menuButtonIconToggle         || null,
      menuButtonIconToggleExpanded: options.menuButtonIconToggleExpanded || null,
      menuButtonIconPut:            options.menuButtonIconPut            || null,
      menuButtonIconShowNext:       options.menuButtonIconShowNext       || null,
      targetId: options.targetId || null,
      overlay1Text:  options.overlay1Text  || null,
      overlay1Color: R(options.overlay1Color) || tc.menuButtonColor || BrandColors.get('attention'),
      overlay2Text:  options.overlay2Text  || null,
      overlay2Color: R(options.overlay2Color) || tc.menuButtonColor || BrandColors.get('attention'),
      overlayInvert: options.overlayInvert || false,
      accentColor:   tc.menuButtonColor || R(options.menuButtonColor) || BrandColors.get('special'),
      groupTitleFontSize: options.groupTitleFontSize || '1.125rem',
      groupTitleColor:    R(options.groupTitleColor)   || tc.groupTitleColor   || '#1C1C1E',
      groupTitleBgColor:  R(options.groupTitleBgColor) || tc.groupTitleBgColor || BrandColors.get('special'),
      groupTitlePadding:  options.groupTitlePadding    || '10px 12px',
      groupIconSize:      options.groupIconSize        || '1rem',
      groupCollapsedIcon: options.groupCollapsedIcon   || null,
      groupExpandedIcon:  options.groupExpandedIcon    || null,
      carouselInterval:        parseInt(options.carouselInterval)   || 4000,
      carouselIndicator:       options.carouselIndicator       !== false,
      autoRevealInterval:      parseInt(options.autoRevealInterval) || 0,
      carouselIndicatorColor:  R(options.carouselIndicatorColor) || tc.menuButtonColor || BrandColors.get('special'),
      carouselIndicatorHeight: options.carouselIndicatorHeight || '3px',
      onCellClick:   options.onCellClick   || null,
      onMenuClick:   options.onMenuClick   || null,
      onContentPush: options.onContentPush || null,
      onContentPull: options.onContentPull || null,
    };

    this.targetElement  = this.options.targetId
      ? document.getElementById(this.options.targetId) : null;
    this.rows           = [];
    this._carouselCells = new Map();
    this.init();
  }

  // ── 主題配置（深色 + 淺色）──────────────────────────────────
  static getThemeConfig(name) {
    const mode = BrandColors.currentTheme;

    const D = {  // dark
      lavender:  { borderColor:'#C3A5E5', cellBgColor:'#2a2435', hoverBgColor:'#3d344a', textColor:'#e8dff5', menuButtonColor:'#C3A5E5', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#C3A5E5' },
      special:   { borderColor:'#C8DD5A', cellBgColor:'#2a2e23', hoverBgColor:'#3d4333', textColor:'#e8ead9', menuButtonColor:'#C8DD5A', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#C8DD5A' },
      warning:   { borderColor:'#F08080', cellBgColor:'#2e2422', hoverBgColor:'#443532', textColor:'#f5e8e6', menuButtonColor:'#F08080', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#F08080' },
      sky:       { borderColor:'#04b5a3', cellBgColor:'#1a2e2c', hoverBgColor:'#274440', textColor:'#d9f5f2', menuButtonColor:'#04b5a3', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#04b5a3' },
      safe:      { borderColor:'#81E6D9', cellBgColor:'#1f2e24', hoverBgColor:'#2d4335', textColor:'#e0f5e8', menuButtonColor:'#81E6D9', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#81E6D9' },
      info:      { borderColor:'#90CDF4', cellBgColor:'#1e2636', hoverBgColor:'#2d3a4d', textColor:'#e0ebf9', menuButtonColor:'#90CDF4', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#90CDF4' },
      salmon:    { borderColor:'#E5C3B3', cellBgColor:'#2e2824', hoverBgColor:'#443d36', textColor:'#f5ede8', menuButtonColor:'#E5C3B3', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#E5C3B3' },
      attention: { borderColor:'#E5E5A6', cellBgColor:'#2e2e22', hoverBgColor:'#434333', textColor:'#f5f5e0', menuButtonColor:'#E5E5A6', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#E5E5A6' },
      pink:      { borderColor:'#FFB3D9', cellBgColor:'#2e2228', hoverBgColor:'#44323d', textColor:'#ffe8f5', menuButtonColor:'#FFB3D9', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#FFB3D9' },
      orange:    { borderColor:'#f69653', cellBgColor:'#2e2519', hoverBgColor:'#443726', textColor:'#f5ebe0', menuButtonColor:'#f69653', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#f69653' },
      brown:     { borderColor:'#d9b375', cellBgColor:'#2b2621', hoverBgColor:'#3f3931', textColor:'#f2ebe3', menuButtonColor:'#d9b375', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#d9b375' },
      default:   { borderColor:'#c6c7bd', cellBgColor:'#333333', hoverBgColor:'#404040', textColor:'#c6c7bd', menuButtonColor:'#c6c7bd', groupTitleColor:'#1C1C1E', groupTitleBgColor:'#c6c7bd' },
    };

    const L = {  // light
      lavender:  { borderColor:'#6B35B5', cellBgColor:'#f2edf9', hoverBgColor:'#e5ddf2', textColor:'#2a1a4a', menuButtonColor:'#6B35B5', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#6B35B5' },
      special:   { borderColor:'#5a6e00', cellBgColor:'#f4f6e8', hoverBgColor:'#e8eccc', textColor:'#2a3000', menuButtonColor:'#5a6e00', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#5a6e00' },
      warning:   { borderColor:'#b53030', cellBgColor:'#faf0f0', hoverBgColor:'#f2e0e0', textColor:'#3a1010', menuButtonColor:'#b53030', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#b53030' },
      sky:       { borderColor:'#027a6c', cellBgColor:'#e8f7f5', hoverBgColor:'#d5f0ec', textColor:'#013830', menuButtonColor:'#027a6c', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#027a6c' },
      safe:      { borderColor:'#1a7a6e', cellBgColor:'#eaf7f4', hoverBgColor:'#d5f0ea', textColor:'#083830', menuButtonColor:'#1a7a6e', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#1a7a6e' },
      info:      { borderColor:'#1a5fa0', cellBgColor:'#eaf2fa', hoverBgColor:'#d5e8f5', textColor:'#0a2848', menuButtonColor:'#1a5fa0', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#1a5fa0' },
      salmon:    { borderColor:'#8B4A30', cellBgColor:'#faf2ee', hoverBgColor:'#f2e4dc', textColor:'#3a1808', menuButtonColor:'#8B4A30', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#8B4A30' },
      attention: { borderColor:'#70700a', cellBgColor:'#f8f8e8', hoverBgColor:'#eeeecb', textColor:'#303000', menuButtonColor:'#70700a', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#70700a' },
      pink:      { borderColor:'#b5005a', cellBgColor:'#faeef5', hoverBgColor:'#f2dde8', textColor:'#3a0020', menuButtonColor:'#b5005a', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#b5005a' },
      orange:    { borderColor:'#b54a00', cellBgColor:'#faf2ea', hoverBgColor:'#f2e4d5', textColor:'#3a1800', menuButtonColor:'#b54a00', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#b54a00' },
      brown:     { borderColor:'#7a5010', cellBgColor:'#f8f2e8', hoverBgColor:'#f0e6d0', textColor:'#2a1800', menuButtonColor:'#7a5010', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#7a5010' },
      default:   { borderColor:'#1e1f1e', cellBgColor:'#e2e3dc', hoverBgColor:'#d5d6d0', textColor:'#1e1f1e', menuButtonColor:'#1e1f1e', groupTitleColor:'#f4f4f0', groupTitleBgColor:'#1e1f1e' },
    };

    const map = mode === 'light' ? L : D;
    return map[name?.toLowerCase()] || map.default;
  }

  // ── 顏色解析（委派給 BrandColors）──────────────────────────
  static resolveColor(color) {
    if (!color) return null;
    // 相容舊名稱 area/region
    const alias = { area: 'surface', region: 'surface' };
    const key = alias[color.toLowerCase()] ?? color.toLowerCase();
    return BrandColors.resolve(key) ?? color;
  }

  init() { this.loadRows(); this.createStyles(); this.createTable(); }

  loadRows() {
    this.parseChildren(Array.from(this.container.children), this.rows, this.options.cols);
  }

  parseChildren(elements, targetArray, colsPerRow) {
    let colBuf = [];
    const flushBuf = () => {
      if (!colBuf.length) return;
      for (let i = 0; i < colBuf.length; i += colsPerRow)
        targetArray.push(this.parseRow(colBuf.slice(i, i + colsPerRow), null));
      colBuf = [];
    };
    for (const el of elements) {
      const tag = el.tagName;
      if (tag === 'DUAL-GROUP' || el.hasAttribute('data-group')) {
        flushBuf(); targetArray.push(this.parseGroup(el)); el.style.display = 'none';
      } else if (tag === 'DUAL-ROW' || el.hasAttribute('data-dual-row')) {
        flushBuf();
        const colEls = Array.from(el.querySelectorAll(':scope > dual-col, :scope > [data-col]'));
        targetArray.push(this.parseRow(colEls, el)); el.style.display = 'none';
      } else if (tag === 'DUAL-COL' || el.hasAttribute('data-col')) {
        colBuf.push(el); el.style.display = 'none';
      }
    }
    flushBuf();
  }

  parseGroup(element) {
    const g = {
      type:          'group',
      title:         element.getAttribute('title') || element.getAttribute('data-group') || '群組',
      titleIcon:     element.getAttribute('title-icon')         || null,
      titleRight:    element.getAttribute('title-right')        || null,
      titleRightIcon:element.getAttribute('title-right-icon')   || null,
      collapsed:     element.getAttribute('collapsed') === 'true',
      titleFontSize: element.getAttribute('title-font-size')    || this.options.groupTitleFontSize,
      titleColor:    DualCell.resolveColor(element.getAttribute('title-color'))    || this.options.groupTitleColor,
      titleBgColor:  DualCell.resolveColor(element.getAttribute('title-bg-color')) || this.options.groupTitleBgColor,
      titlePadding:  element.getAttribute('title-padding')      || null,
      collapsedIcon: element.getAttribute('collapsed-icon')     || this.options.groupCollapsedIcon,
      expandedIcon:  element.getAttribute('expanded-icon')      || this.options.groupExpandedIcon,
      rows: [],
    };
    this.parseChildren(Array.from(element.children), g.rows, this.options.cols);
    return g;
  }

  parseRow(colElements, rowEl) {
    const slotEl       = rowEl?.querySelector(':scope > dual-slot, :scope > [data-slot]');
    const rowColWidths = rowEl?.getAttribute('col-widths') || null;
    const cols         = colElements.map(el => this.parseCol(el));
    const flexVals     = this.computeFlexValues(cols.length, rowColWidths || this.options.colWidths);
    cols.forEach((col, i) => { if (!col.width) col.flex = flexVals[i]; });
    let slotContent = '', slotCols = null;
    if (slotEl) {
      const slotColEls = Array.from(slotEl.querySelectorAll(':scope > dual-col'));
      if (slotColEls.length >= 2) slotCols = slotColEls.map(c => c.innerHTML);
      else slotContent = slotEl.innerHTML;
    }
    return {
      type: 'row', cols, slotContent, slotCols,
      hidden:          rowEl?.hasAttribute('hidden')              || false,
      autoRevealDelay: parseInt(rowEl?.getAttribute('auto-reveal-delay')) || 0,
    };
  }

  parseCol(el) {
    if (!el) return this.emptyColData();
    const a = (k) => el.getAttribute(k) || null;
    const R = DualCell.resolveColor;
    const O = this.options;
    const ov1Text  = a('overlay-1-text')  ?? O.overlay1Text;
    const ov1Color = R(a('overlay-1-color')) || O.overlay1Color;
    const ov2Text  = a('overlay-2-text')  ?? O.overlay2Text;
    const ov2Color = R(a('overlay-2-color')) || O.overlay2Color;
    const ovInvert = el.hasAttribute('overlay-invert')
      ? el.getAttribute('overlay-invert') === 'true' : O.overlayInvert;
    const itemEls       = Array.from(el.querySelectorAll(':scope > dual-item, :scope > [data-item]'));
    const carouselItems = itemEls.length > 1 ? itemEls.map(i => i.innerHTML) : null;
    const ciInterval  = a('carousel-interval') !== null ? parseInt(a('carousel-interval')) : null;
    const ciIndicator = el.hasAttribute('carousel-indicator')
      ? el.getAttribute('carousel-indicator') !== 'false' : null;
    const ciColor  = R(a('carousel-indicator-color'));
    const ciHeight = a('carousel-indicator-height');
    return {
      content:     carouselItems ? carouselItems[0] : el.innerHTML,
      width:       a('width'), spanAll: el.getAttribute('span') === 'all',
      padding:     a('padding'), showMenu: el.getAttribute('show-menu') !== 'false',
      menuAction:  a('menu-action') || 'push', menuTarget: a('target'),
      cellId:      el.id || null,
      ov1Text, ov1Color, ov2Text, ov2Color, ovInvert,
      hasOverlay: !!(ov1Text || ov2Text),
      hoverSource: a('hover-source'), hoverTarget: a('hover-target'),
      carouselItems, carouselInterval: ciInterval,
      carouselIndicator: ciIndicator, carouselIndicatorColor: ciColor,
      carouselIndicatorHeight: ciHeight, flex: 1,
    };
  }

  emptyColData() {
    return {
      content:'', width:null, spanAll:false, padding:null,
      showMenu:true, menuAction:'push', menuTarget:null, cellId:null,
      ov1Text:null, ov1Color:null, ov2Text:null, ov2Color:null,
      ovInvert:false, hasOverlay:false, hoverSource:null, hoverTarget:null,
      carouselItems:null, carouselInterval:null, carouselIndicator:null,
      carouselIndicatorColor:null, carouselIndicatorHeight:null, flex:1,
    };
  }

  computeFlexValues(n, colWidthsStr) {
    if (!colWidthsStr) return Array(n).fill(1);
    const parts = colWidthsStr.split(':').map(Number);
    if (parts.length !== n || parts.some(isNaN)) return Array(n).fill(1);
    return parts;
  }

  createStyles() {
    const id  = this.container.id;
    const sId = `dc-styles-${id}`;
    if (document.getElementById(sId)) return;
    const o   = this.options;
    const bdr = `${o.borderWidth} ${o.borderStyle} ${o.borderColor}`;
    const va  = { top:'flex-start', middle:'center', bottom:'flex-end' }[o.verticalAlignment] || 'center';
    const style = document.createElement('style');
    style.id    = sId;
    style.textContent = `
      #${id} .dc-table{width:100%;color:${o.textColor};font-size:${o.fontSize}}
      #${id} .dc-row{display:flex;border:${bdr};border-bottom:none}
      #${id} .dc-row-container:last-child>.dc-row,
      #${id} .dc-group-content .dc-row-container:last-child>.dc-row{border-bottom:${bdr}}
      #${id} .dc-cell{
        min-height:${o.cellMinHeight};padding:${o.cellPadding};
        display:flex;align-items:${va};justify-content:space-between;
        position:relative;overflow:hidden;
        background:${o.cellBgColor};text-align:${o.cellAlignment};
        transition:background-color 0.2s}
      #${id} .dc-cell:not(:last-child){border-right:${bdr}}
      #${id} .dc-cell:hover{background:${o.hoverBgColor}}
      #${id} .dc-cell.has-overlay:hover{background:${o.cellBgColor}}
      #${id} .dc-content{flex:1;display:flex;align-items:${va};min-width:0;overflow:hidden;word-break:break-word}
      #${id} .dc-content.blurred{filter:blur(6px);user-select:none;pointer-events:none}
      #${id} .dc-revealed{animation:dc-reveal 0.25s ease}
      @keyframes dc-reveal{from{filter:blur(6px);opacity:.5}to{filter:blur(0);opacity:1}}
      #${id} .dc-menu-btn{
        background:none;border:none;color:${o.menuButtonColor};font-size:${o.menuButtonSize};
        cursor:pointer;padding:0 4px;margin-left:8px;flex-shrink:0;
        opacity:0.7;transition:opacity .2s,transform .2s;display:flex;align-items:center}
      #${id} .dc-menu-btn:hover{opacity:1;transform:scale(1.1)}
      #${id} .dc-menu-btn:active{transform:scale(.95)}
      #${id} .dc-menu-btn.pos-left{margin-left:0;margin-right:8px;order:-1}
      #${id} .dc-overlay{
        position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
        cursor:pointer;z-index:10;transition:opacity .15s}
      #${id} .dc-ov-dark{background:rgba(0,0,0,.76)}
      #${id} .dc-ov-dark:hover{background:rgba(0,0,0,.88)}
      #${id} .dc-ov-invert{background:${o.accentColor}}
      #${id} .dc-ov-invert:hover{filter:brightness(1.1)}
      #${id} .dc-ov-label{
        font-size:.875rem;font-weight:700;letter-spacing:1px;
        padding:6px 16px;border-radius:4px;border-width:2px;border-style:solid;
        background:rgba(0,0,0,.35)}
      #${id} .dc-ov-invert .dc-ov-label{background:rgba(0,0,0,.18);color:#1C1C1E;border-color:rgba(0,0,0,.4)}
      #${id} .dc-toggle{
        background:${o.cellBgColor};color:${o.textColor};padding:${o.cellPadding};
        border:${bdr};border-top:2px solid ${o.menuButtonColor};display:none}
      #${id} .dc-toggle.expanded{display:block;animation:dc-slide .25s ease}
      @keyframes dc-slide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      #${id} .dc-group-header{
        background:${o.groupTitleBgColor};color:${o.groupTitleColor};
        padding:${o.groupTitlePadding};font-size:${o.groupTitleFontSize};
        font-weight:700;cursor:pointer;user-select:none;
        display:flex;align-items:center;justify-content:space-between;gap:8px;
        border:${bdr};border-bottom:none;transition:opacity .2s}
      #${id} .dc-group-header:hover{opacity:.9}
      #${id} .dc-group-header:active{opacity:.8}
      #${id} .dc-group-title-l{flex:1}
      #${id} .dc-group-title-r{font-size:.8em;opacity:.85;flex-shrink:0}
      #${id} .dc-group-icon{font-size:${o.groupIconSize};flex-shrink:0;transition:transform .2s}
      #${id} .dc-group-content{overflow:hidden;transition:max-height .3s ease,opacity .3s ease}
      #${id} .dc-group-content.collapsed{max-height:0;opacity:0}
      #${id} .dc-group-content.expanded{max-height:10000px;opacity:1}
      @keyframes dc-car-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-12px)}}
      @keyframes dc-car-in {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      #${id} .dc-content.dc-car-exit {animation:dc-car-out .3s ease forwards;pointer-events:none}
      #${id} .dc-content.dc-car-enter{animation:dc-car-in  .38s ease forwards}
      #${id} .dc-progress-track{
        position:absolute;bottom:0;left:0;right:0;overflow:hidden;pointer-events:none;z-index:1}
      #${id} .dc-progress-bar{height:100%;width:100%}
      @keyframes dc-shrink{from{width:100%}to{width:0%}}
      @keyframes dc-row-reveal{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      #${id} .dc-reveal-row{animation:dc-row-reveal .35s ease forwards}
    `;
    document.head.appendChild(style);
  }

  createTable() {
    const table = document.createElement('div');
    table.className = 'dc-table';
    let rowIdx = 0;
    this.rows.forEach(item => {
      if (item.type === 'group') {
        table.appendChild(this.createGroup(item, rowIdx));
        rowIdx += item.rows.length;
      } else {
        table.appendChild(this.createRow(item, rowIdx++));
      }
    });
    this.setupTableEvents(table);
    this.container.appendChild(table);
    this._initCarousels();
    this._startAutoRevealInterval();
  }

  createGroup(groupData, startIdx) {
    const wrap   = document.createElement('div');
    wrap.className = 'dc-group';
    const header = document.createElement('div');
    header.className = 'dc-group-header';
    if (groupData.titleFontSize) header.style.fontSize   = groupData.titleFontSize;
    if (groupData.titleColor)    header.style.color      = groupData.titleColor;
    if (groupData.titleBgColor)  header.style.background = groupData.titleBgColor;
    if (groupData.titlePadding)  header.style.padding    = groupData.titlePadding;
    if (this.options.borderFollowTheme && groupData.titleBgColor)
      header.style.borderColor = groupData.titleBgColor;
    const initIcon = groupData.collapsed ? groupData.collapsedIcon : groupData.expandedIcon;
    if (initIcon) {
      const icon = document.createElement('i');
      icon.className = `bi ${initIcon} dc-group-icon`;
      header.appendChild(icon);
    }
    const tL = document.createElement('span');
    tL.className = 'dc-group-title-l';
    const iconHtml = groupData.titleIcon ? `<i class="bi ${groupData.titleIcon}" style="margin-right:6px"></i>` : '';
    tL.innerHTML = iconHtml + groupData.title;
    header.appendChild(tL);
    if (groupData.titleRight) {
      const tR = document.createElement('span');
      tR.className = 'dc-group-title-r';
      const rIconHtml = groupData.titleRightIcon ? `<i class="bi ${groupData.titleRightIcon}" style="margin-right:4px"></i>` : '';
      tR.innerHTML = rIconHtml + groupData.titleRight;
      header.appendChild(tR);
    }
    const content = document.createElement('div');
    content.className = `dc-group-content ${groupData.collapsed ? 'collapsed' : 'expanded'}`;
    groupData.rows.forEach((row, i) => {
      const rowEl = this.createRow(row, startIdx + i);
      if (this.options.borderFollowTheme && groupData.titleBgColor)
        this.applyGroupBorder(rowEl, groupData.titleBgColor);
      content.appendChild(rowEl);
    });
    header.addEventListener('click', () => {
      const nowCollapsed = content.classList.contains('collapsed');
      content.classList.toggle('collapsed', !nowCollapsed);
      content.classList.toggle('expanded',   nowCollapsed);
      const icon = header.querySelector('.dc-group-icon');
      if (icon) {
        const next = nowCollapsed ? groupData.expandedIcon : groupData.collapsedIcon;
        if (next) icon.className = `bi ${next} dc-group-icon`;
      }
    });
    wrap.appendChild(header);
    wrap.appendChild(content);
    return wrap;
  }

  applyGroupBorder(rowContainer, color) {
    const row    = rowContainer.querySelector('.dc-row');
    const toggle = rowContainer.querySelector('.dc-toggle');
    if (row) {
      row.style.borderColor = color;
      row.querySelectorAll('.dc-cell:not(:last-child)').forEach(c => { c.style.borderRightColor = color; });
    }
    if (toggle) { toggle.style.borderColor = color; toggle.style.borderTopColor = color; }
  }

  createRow(rowData, rowIdx) {
    const container = document.createElement('div');
    container.className = 'dc-row-container';
    if (rowData.hidden)          container.style.display = 'none';
    if (rowData.autoRevealDelay) container.dataset.autoRevealDelay = rowData.autoRevealDelay;
    const row = document.createElement('div');
    row.className    = 'dc-row';
    row.dataset.rowIdx = rowIdx;
    rowData.cols.forEach((colData, colIdx) => row.appendChild(this.createCell(colData, rowIdx, colIdx)));
    container.appendChild(row);
    if (rowData.slotCols) {
      const toggle = document.createElement('div');
      toggle.className = 'dc-toggle has-slot'; toggle.dataset.rowIdx = rowIdx;
      const bsRow = document.createElement('div'); bsRow.className = 'row';
      rowData.slotCols.forEach(html => {
        const col = document.createElement('div'); col.className = 'col';
        col.innerHTML = html; bsRow.appendChild(col);
      });
      toggle.appendChild(bsRow); container.appendChild(toggle);
    } else if (rowData.slotContent?.trim()) {
      const toggle = document.createElement('div');
      toggle.className = 'dc-toggle has-slot'; toggle.dataset.rowIdx = rowIdx;
      toggle.innerHTML = rowData.slotContent; container.appendChild(toggle);
    }
    return container;
  }

  createCell(colData, rowIdx, colIdx) {
    const cell = document.createElement('div');
    cell.className      = 'dc-cell';
    cell.dataset.rowIdx = rowIdx;
    cell.dataset.colIdx = colIdx;
    if (colData.cellId)  cell.id           = colData.cellId;
    if (colData.padding) cell.style.padding = colData.padding;
    if (colData.spanAll) {
      cell.style.cssText += ';flex:1 0 100%;border-right:none';
    } else if (colData.width) {
      cell.style.width = colData.width; cell.style.flex = 'none';
    } else {
      cell.style.flex = String(colData.flex || 1);
    }
    const contentDiv = document.createElement('div');
    contentDiv.className = 'dc-content';
    contentDiv.innerHTML = colData.content;
    if (this.options.menuButtonPosition === 'left') {
      if (this.options.showMenuButton && colData.showMenu)
        cell.appendChild(this.createMenuButton(colData, rowIdx, colIdx));
      cell.appendChild(contentDiv);
    } else {
      cell.appendChild(contentDiv);
      if (this.options.showMenuButton && colData.showMenu)
        cell.appendChild(this.createMenuButton(colData, rowIdx, colIdx));
    }
    if (colData.hasOverlay) {
      cell.classList.add('has-overlay');
      if (!colData.ovInvert) contentDiv.classList.add('blurred');
      if (colData.ov2Text) cell.appendChild(this.createOverlayEl(colData.ov2Text, colData.ov2Color, colData.ovInvert, 2));
      if (colData.ov1Text) cell.appendChild(this.createOverlayEl(colData.ov1Text, colData.ov1Color, colData.ovInvert, 1));
    }
    if (colData.carouselItems) {
      cell.classList.add('has-carousel');
      const track = document.createElement('div'); track.className = 'dc-progress-track';
      track.style.height = colData.carouselIndicatorHeight || this.options.carouselIndicatorHeight;
      const bar = document.createElement('div'); bar.className = 'dc-progress-bar';
      track.appendChild(bar); cell.appendChild(track);
      this._carouselCells.set(cell, colData);
    }
    return cell;
  }

  createOverlayEl(text, color, invert, layer) {
    const ov = document.createElement('div');
    ov.className     = `dc-overlay ${invert ? 'dc-ov-invert' : 'dc-ov-dark'}`;
    ov.dataset.layer = layer;
    const label = document.createElement('span');
    label.className = 'dc-ov-label'; label.textContent = text;
    if (!invert) { label.style.color = color; label.style.borderColor = color; }
    ov.appendChild(label);
    return ov;
  }

  createMenuButton(colData, rowIdx, colIdx) {
    const btn = document.createElement('button');
    btn.className      = 'dc-menu-btn';
    btn.dataset.action = colData.menuAction;
    btn.dataset.rowIdx = rowIdx;
    btn.dataset.colIdx = colIdx;
    if (this.options.menuButtonPosition === 'left') btn.classList.add('pos-left');
    if (colData.menuTarget) btn.dataset.target = colData.menuTarget;
    const ICONS  = { push:this.options.menuButtonIconPush, pull:this.options.menuButtonIconPull, copy:this.options.menuButtonIconCopy, swap:this.options.menuButtonIconSwap, clear:this.options.menuButtonIconClear, toggle:this.options.menuButtonIconToggle, put:this.options.menuButtonIconPut, 'show-next':this.options.menuButtonIconShowNext };
    const TITLES = { push:'推送到目標', pull:'從目標拉取', copy:'複製', swap:'與相鄰欄交換', clear:'清空', toggle:'展開/收合', put:'放置到指定儲存格', 'show-next':'展開下一列' };
    const icon = ICONS[colData.menuAction];
    if (icon) btn.innerHTML = `<i class="bi ${icon}"></i>`;
    btn.title = TITLES[colData.menuAction] || '';
    return btn;
  }

  _initCarousels() {
    this._carouselCells.forEach((colData, cellEl) => {
      if (cellEl.isConnected) this._startCarousel(cellEl, colData);
    });
  }

  _startCarousel(cellEl, colData) {
    const items    = colData.carouselItems;
    const interval = colData.carouselInterval ?? this.options.carouselInterval;
    const showInd  = colData.carouselIndicator !== null ? colData.carouselIndicator : this.options.carouselIndicator;
    const indColor  = colData.carouselIndicatorColor  || this.options.carouselIndicatorColor;
    const indHeight = colData.carouselIndicatorHeight || this.options.carouselIndicatorHeight;
    const contentEl = cellEl.querySelector('.dc-content');
    const trackEl   = cellEl.querySelector('.dc-progress-track');
    const barEl     = cellEl.querySelector('.dc-progress-bar');
    if (!showInd && trackEl) { trackEl.style.display = 'none'; }
    if (trackEl && indHeight) trackEl.style.height = indHeight;
    if (barEl)   barEl.style.background = indColor;
    let idx = 0;
    const restartBar = () => {
      if (!barEl || !showInd) return;
      barEl.style.animation = 'none';
      barEl.offsetHeight;
      barEl.style.animation = `dc-shrink ${interval}ms linear forwards`;
    };
    const advance = () => {
      contentEl.classList.add('dc-car-exit');
      setTimeout(() => {
        idx = (idx + 1) % items.length;
        contentEl.innerHTML = items[idx];
        contentEl.classList.remove('dc-car-exit');
        contentEl.classList.add('dc-car-enter');
        setTimeout(() => contentEl.classList.remove('dc-car-enter'), 400);
        restartBar();
        setTimeout(advance, interval);
      }, 300);
    };
    restartBar();
    setTimeout(advance, interval);
  }

  setupTableEvents(tableEl) {
    tableEl.addEventListener('click', (e) => {
      const overlay = e.target.closest('.dc-overlay');
      const btn     = e.target.closest('.dc-menu-btn');
      const cell    = e.target.closest('.dc-cell');
      if (overlay && cell) { e.stopPropagation(); this.handleOverlayClick(overlay, cell); return; }
      if (btn) {
        e.stopPropagation();
        const { action, rowIdx, colIdx, target } = btn.dataset;
        this.handleMenuAction(action, target || null, parseInt(rowIdx), parseInt(colIdx), btn);
        return;
      }
      if (cell && this.options.onCellClick)
        this.options.onCellClick(parseInt(cell.dataset.rowIdx), parseInt(cell.dataset.colIdx));
    });
    tableEl.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.dc-cell');
      if (!cell) return;
      if (e.relatedTarget?.closest('.dc-cell') === cell) return;
      const col = this.getColData(parseInt(cell.dataset.rowIdx), parseInt(cell.dataset.colIdx));
      if (!col?.hoverSource || !col?.hoverTarget) return;
      const src = document.getElementById(col.hoverSource);
      const tgt = document.getElementById(col.hoverTarget);
      if (src && tgt) tgt.innerHTML = src.innerHTML;
    });
  }

  handleOverlayClick(overlayEl, cellEl) {
    const layer      = parseInt(overlayEl.dataset.layer);
    const contentDiv = cellEl.querySelector('.dc-content');
    overlayEl.remove();
    if (layer === 1) {
      const layer2 = cellEl.querySelector('.dc-overlay[data-layer="2"]');
      if (!layer2) { contentDiv.classList.remove('blurred'); contentDiv.classList.add('dc-revealed'); cellEl.classList.remove('has-overlay'); }
    } else {
      contentDiv.classList.remove('blurred'); contentDiv.classList.add('dc-revealed'); cellEl.classList.remove('has-overlay');
    }
  }

  handleMenuAction(action, customTarget, rowIdx, colIdx, btnEl) {
    const cellEl     = this.container.querySelector(`.dc-cell[data-row-idx="${rowIdx}"][data-col-idx="${colIdx}"]`);
    const contentDiv = cellEl?.querySelector('.dc-content');
    if (!contentDiv) return;
    switch (action) {
      case 'copy':      this.copyToClipboard(contentDiv); break;
      case 'swap':      this.swapCols(rowIdx, colIdx); break;
      case 'clear':     if (confirm('確定清空？')) contentDiv.innerHTML = ''; break;
      case 'toggle':    this.toggleSlot(customTarget, rowIdx, colIdx, cellEl, btnEl); break;
      case 'put':       this.putToCell(customTarget, contentDiv); break;
      case 'show-next': {
        const rowContainer = cellEl.closest('.dc-row-container');
        const next = this._nextHiddenRow(rowContainer);
        if (next) this._showRow(next);
        break;
      }
      default: {
        const target = customTarget ? document.getElementById(customTarget) : this.targetElement;
        if (!target) { console.warn('[dual-cell] 找不到目標元素'); break; }
        if (action === 'push') { target.innerHTML = contentDiv.innerHTML; this.options.onContentPush?.(rowIdx, colIdx, contentDiv.innerHTML); }
        else if (action === 'pull') { contentDiv.innerHTML = target.innerHTML; this.options.onContentPull?.(rowIdx, colIdx, target.innerHTML); }
      }
    }
    this.options.onMenuClick?.(action, rowIdx, colIdx);
  }

  copyToClipboard(contentDiv) {
    const text = contentDiv.textContent || '';
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text).catch(err => console.error(err)); }
    else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  swapCols(rowIdx, colIdx) {
    const cells = Array.from(this.container.querySelectorAll(`.dc-row[data-row-idx="${rowIdx}"] .dc-cell`));
    if (cells.length < 2) return;
    const other = colIdx + 1 < cells.length ? colIdx + 1 : colIdx - 1;
    const cwA = cells[colIdx]?.querySelector('.dc-content');
    const cwB = cells[other ]?.querySelector('.dc-content');
    if (!cwA || !cwB) return;
    [cwA.innerHTML, cwB.innerHTML] = [cwB.innerHTML, cwA.innerHTML];
  }

  toggleSlot(customTarget, rowIdx, colIdx, cellEl, btnEl) {
    const rowContainer = cellEl.closest('.dc-row-container');
    if (!rowContainer) return;
    let tc = rowContainer.querySelector('.dc-toggle');
    if (!tc) { tc = document.createElement('div'); tc.className = 'dc-toggle'; tc.dataset.rowIdx = rowIdx; rowContainer.appendChild(tc); }
    const expanding = !tc.classList.contains('expanded');
    if (expanding && !tc.classList.contains('has-slot') && customTarget) {
      const src = document.getElementById(customTarget);
      if (src) tc.innerHTML = src.innerHTML;
    }
    tc.classList.toggle('expanded', expanding);
    if (btnEl) {
      const iE = this.options.menuButtonIconToggleExpanded;
      const iC = this.options.menuButtonIconToggle;
      if (expanding && iE) btnEl.innerHTML = `<i class="bi ${iE}"></i>`;
      if (!expanding && iC) btnEl.innerHTML = `<i class="bi ${iC}"></i>`;
    }
  }

  putToCell(targetCellId, sourceContentDiv) {
    if (!targetCellId) return;
    const tgtCell    = document.getElementById(targetCellId);
    const tgtContent = tgtCell?.querySelector('.dc-content');
    if (tgtContent) tgtContent.innerHTML = sourceContentDiv.innerHTML;
  }

  _showRow(rowContainer) {
    if (!rowContainer || rowContainer.style.display !== 'none') return;
    rowContainer.style.display = '';
    rowContainer.classList.add('dc-reveal-row');
    const delay = parseInt(rowContainer.dataset.autoRevealDelay) || 0;
    if (delay > 0) {
      setTimeout(() => {
        const next = this._nextHiddenRow(rowContainer);
        if (next) this._showRow(next);
      }, delay);
    }
  }

  _nextHiddenRow(fromContainer) {
    let el = fromContainer?.nextElementSibling;
    while (el) {
      if (el.classList.contains('dc-row-container') && el.style.display === 'none') return el;
      el = el.nextElementSibling;
    }
    return null;
  }

  _startAutoRevealInterval() {
    const interval = this.options.autoRevealInterval;
    if (!interval) return;
    const rows = Array.from(this.container.querySelectorAll('.dc-table .dc-row-container')).filter(r => r.style.display === 'none');
    rows.forEach((row, i) => {
      setTimeout(() => {
        if (row.style.display === 'none') { row.style.display = ''; row.classList.add('dc-reveal-row'); }
      }, interval * (i + 1));
    });
  }

  getColData(rowIdx, colIdx) {
    let cur = 0;
    for (const item of this.rows) {
      if (item.type === 'group') {
        const end = cur + item.rows.length;
        if (rowIdx < end) return item.rows[rowIdx - cur]?.cols?.[colIdx] ?? null;
        cur = end;
      } else { if (cur === rowIdx) return item.cols?.[colIdx] ?? null; cur++; }
    }
    return null;
  }
}

// ── DualCell Custom Elements ────────────────────────────────────
class DualCellElement extends HTMLElement {
  connectedCallback() { this.dualCellInstance = new DualCell(this.id, this._buildOptions()); }
  _buildOptions() {
    const opts = {};
    const boolAttrs = new Set(['show-menu-button','border-follow-theme','overlay-invert','carousel-indicator']);
    const MAP = {
      'theme':'theme','cols':'cols','col-widths':'colWidths',
      'cell-min-height':'cellMinHeight','cell-padding':'cellPadding',
      'cell-bg-color':'cellBgColor','hover-bg-color':'hoverBgColor',
      'text-color':'textColor','font-size':'fontSize',
      'cell-alignment':'cellAlignment','vertical-alignment':'verticalAlignment',
      'border-width':'borderWidth','border-color':'borderColor',
      'border-style':'borderStyle','border-follow-theme':'borderFollowTheme',
      'show-menu-button':'showMenuButton','menu-button-position':'menuButtonPosition',
      'menu-button-color':'menuButtonColor','menu-button-size':'menuButtonSize',
      'menu-button-icon-push':'menuButtonIconPush','menu-button-icon-pull':'menuButtonIconPull',
      'menu-button-icon-copy':'menuButtonIconCopy','menu-button-icon-swap':'menuButtonIconSwap',
      'menu-button-icon-clear':'menuButtonIconClear','menu-button-icon-toggle':'menuButtonIconToggle',
      'menu-button-icon-toggle-expanded':'menuButtonIconToggleExpanded',
      'menu-button-icon-put':'menuButtonIconPut','menu-button-icon-show-next':'menuButtonIconShowNext',
      'target-id':'targetId','auto-reveal-interval':'autoRevealInterval',
      'overlay-1-text':'overlay1Text','overlay-1-color':'overlay1Color',
      'overlay-2-text':'overlay2Text','overlay-2-color':'overlay2Color','overlay-invert':'overlayInvert',
      'carousel-interval':'carouselInterval','carousel-indicator':'carouselIndicator',
      'carousel-indicator-color':'carouselIndicatorColor','carousel-indicator-height':'carouselIndicatorHeight',
      'group-title-font-size':'groupTitleFontSize','group-title-color':'groupTitleColor',
      'group-title-bg-color':'groupTitleBgColor','group-title-padding':'groupTitlePadding',
      'group-icon-size':'groupIconSize','group-collapsed-icon':'groupCollapsedIcon',
      'group-expanded-icon':'groupExpandedIcon',
    };
    for (const [attr, key] of Object.entries(MAP)) {
      if (this.hasAttribute(attr)) {
        const v = this.getAttribute(attr);
        opts[key] = boolAttrs.has(attr) ? v !== 'false' : v;
      }
    }
    return opts;
  }
}
class DualGroupElement extends HTMLElement {}
class DualRowElement   extends HTMLElement {}
class DualColElement   extends HTMLElement {}
class DualSlotElement  extends HTMLElement {}
class DualItemElement  extends HTMLElement {}

// data-dual-cell 屬性自動初始化
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-dual-cell]').forEach(el => {
    const d = el.dataset, opt = {};
    const p  = (k, v) => { if (v !== undefined && v !== '') opt[k] = v; };
    const pb = (k, v) => { if (v !== undefined) opt[k] = v !== 'false'; };
    p('theme',d.theme); p('cols',d.cols); p('colWidths',d.colWidths);
    p('cellMinHeight',d.cellMinHeight); p('cellPadding',d.cellPadding);
    p('cellBgColor',d.cellBgColor); p('hoverBgColor',d.hoverBgColor);
    p('textColor',d.textColor); p('fontSize',d.fontSize);
    p('cellAlignment',d.cellAlignment); p('verticalAlignment',d.verticalAlignment);
    p('borderWidth',d.borderWidth); p('borderColor',d.borderColor); p('borderStyle',d.borderStyle);
    pb('borderFollowTheme',d.borderFollowTheme); pb('showMenuButton',d.showMenuButton);
    p('menuButtonPosition',d.menuButtonPosition);
    p('menuButtonColor',d.menuButtonColor); p('menuButtonSize',d.menuButtonSize);
    p('menuButtonIconPush',d.menuButtonIconPush); p('menuButtonIconPull',d.menuButtonIconPull);
    p('menuButtonIconCopy',d.menuButtonIconCopy); p('menuButtonIconSwap',d.menuButtonIconSwap);
    p('menuButtonIconClear',d.menuButtonIconClear); p('menuButtonIconToggle',d.menuButtonIconToggle);
    p('menuButtonIconToggleExpanded',d.menuButtonIconToggleExpanded);
    p('menuButtonIconPut',d.menuButtonIconPut); p('menuButtonIconShowNext',d.menuButtonIconShowNext);
    p('autoRevealInterval',d.autoRevealInterval); p('targetId',d.targetId);
    p('overlay1Text',d.overlay1Text); p('overlay1Color',d.overlay1Color);
    p('overlay2Text',d.overlay2Text); p('overlay2Color',d.overlay2Color);
    pb('overlayInvert',d.overlayInvert);
    p('carouselInterval',d.carouselInterval);
    pb('carouselIndicator',d.carouselIndicator);
    p('carouselIndicatorColor',d.carouselIndicatorColor); p('carouselIndicatorHeight',d.carouselIndicatorHeight);
    p('groupTitleFontSize',d.groupTitleFontSize); p('groupTitleColor',d.groupTitleColor);
    p('groupTitleBgColor',d.groupTitleBgColor); p('groupTitlePadding',d.groupTitlePadding);
    p('groupIconSize',d.groupIconSize);
    p('groupCollapsedIcon',d.groupCollapsedIcon); p('groupExpandedIcon',d.groupExpandedIcon);
    el.dualCellInstance = new DualCell(el.id, opt);
  });
});

(function () {
  'use strict';

  const cap     = s => s.charAt(0).toUpperCase() + s.slice(1);
  const addUnit = (val, unit) => {
    if (!val) return null;
    if (/[a-z%]$/i.test(String(val))) return String(val);
    return val + unit;
  };

  // 全域預設值（bgColor/textColor 使用 CSS 變數，自動跟隨主題）
  const defaults = {
    defaultColor:       'sky',
    animDuration:       500,
    horizontalAnimDur:  380,
    defaultInterval:    500,
    borderWidth:        4,
    borderAllWidth:     null,
    borderTopWidth:     null,
    borderRightWidth:   null,
    borderBottomWidth:  null,
    borderLeftWidth:    null,
    borderStyle:        'solid',
    borderTopStyle:     null,
    borderRightStyle:   null,
    borderBottomStyle:  null,
    borderLeftStyle:    null,
    borderRadius:       '0 6px 6px 0',
    bgColor:            'var(--color-surface, #333333)',
    textColor:          'var(--color-shell, #c6c7bd)',
    fontSize:           '1rem',
    padding:            '14px 18px 20px 20px',
    marginBottom:       '10px',
    countdownHeight:    3,
    countdownPosition:  'bottom',
    progressHeight:     4,
    progressPosition:   'bottom',
    progressTransition: 400,
    manualLabel:        '▶ 下一步',
    manualAlign:        'right',
    cascadeInterval:    0,
    btnWidth:           null, btnHeight:       null,
    btnFontSize:        null, btnPadding:      null,
    startBtnWidth:      null, startBtnHeight:  null,
    startBtnFontSize:   null, startBtnPadding: null,
    resetBtnWidth:      null, resetBtnHeight:  null,
    resetBtnFontSize:   null, resetBtnPadding: null,
  };

  window.InfoRegionConfig = Object.assign({}, defaults, window.InfoRegionConfig || {});

  let _stylesInjected = false;

  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const cfg = window.InfoRegionConfig;
    const vDur = cfg.animDuration + 'ms';
    const hDur = cfg.horizontalAnimDur + 'ms';

    // 顏色 variants：使用 CSS 變數，自動跟隨主題
    const colorKeys = ['shell','lavender','special','warning','salmon','attention','sky','safe','brown','info','pink','orange'];

    const irColorVariants = colorKeys.map(name =>
      `info-region[active="true"][color="${name}"] { border-left-color: var(--color-${name}); }`
    ).join('\n      ');

    const btnColorVariants = colorKeys.map(name => `
        .ir-btn--${name} { border-color: var(--color-${name}); color: var(--color-${name}); }
        .ir-btn--${name}:hover { filter: brightness(1.12); }
      `).join('\n      ');

    const css = `
      info-region {
        display: block; overflow: hidden; max-height: 0; opacity: 0;
        transform: translateY(10px); pointer-events: none; position: relative;
        border-left: ${cfg.borderWidth}px solid transparent;
        border-radius: ${cfg.borderRadius};
        font-size: ${cfg.fontSize}; line-height: 1.75;
        transition:
          max-height  ${vDur} cubic-bezier(.4,0,.2,1),
          opacity     ${vDur} ease,
          transform   ${vDur} ease;
      }
      info-region[active="true"] {
        max-height: 4000px; opacity: 1; transform: translateY(0);
        pointer-events: auto; margin-bottom: ${cfg.marginBottom};
        background: ${cfg.bgColor}; color: ${cfg.textColor};
        padding: ${cfg.padding};
        border-left-color: var(--color-sky);
      }
      ${irColorVariants}
      info-region-group[layout="horizontal"] info-region {
        max-height: none; overflow: visible;
        transform: translateX(-8px); padding: ${cfg.padding}; flex: 1;
        transition: opacity ${hDur} ease, transform ${hDur} ease;
        margin-bottom: 0;
      }
      info-region-group[layout="horizontal"] info-region[active="true"] {
        max-height: none; transform: translateX(0); margin-bottom: 0;
      }
      .ir-col { display: flex; flex-direction: column; }
      .ir-countdown-bar {
        position: absolute; left: 0; width: 100%;
        transform-origin: left center; transform: scaleX(1);
        pointer-events: none; border-radius: 0 2px 2px 0;
      }
      .ir-manual-wrap { display: flex; margin-top: 14px; }
      .ir-manual-btn { font-size: 0.85rem; padding: 6px 16px; animation: ir-manual-in 0.25s ease forwards; }
      @keyframes ir-manual-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      .ir-manual-btn.is-leaving { animation: ir-manual-out 0.18s ease forwards; }
      @keyframes ir-manual-out { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-4px)} }
      info-region-group { display: block; }
      .ir-controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
      .ir-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: var(--color-surface, #333333);
        border: 1px solid var(--color-border-subtle, rgba(198,199,189,0.4));
        border-radius: 6px; padding: 8px 20px;
        font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.9rem;
        line-height: 1; cursor: pointer;
        color: var(--color-shell, #c6c7bd);
        transition: background 0.2s, border-color 0.2s, color 0.2s, filter 0.2s;
        -webkit-user-select: none; user-select: none;
      }
      .ir-btn:hover { filter: brightness(1.1); }
      ${btnColorVariants}
      .ir-global-progress-wrap { display: flex; align-items: center; gap: 10px; }
      .ir-global-progress-track {
        flex: 1; position: relative; border-radius: 3px;
        background: var(--color-progress-track, #1e1f1e); overflow: hidden;
      }
      .ir-global-progress-bar {
        position: absolute; inset: 0; transform-origin: left center;
        transform: scaleX(0); border-radius: 3px;
      }
      .ir-global-percent {
        font-family: 'Space Mono', monospace; font-size: 0.72rem;
        min-width: 38px; text-align: right; opacity: 0;
        transition: opacity 0.3s ease; white-space: nowrap; letter-spacing: 0.03em;
      }
      info-region h1,info-region h2,info-region h3,
      info-region h4,info-region h5,info-region h6 { color: inherit; margin-bottom: 6px; }
      info-region p { margin-bottom: 4px; }
      info-region p:last-child { margin-bottom: 0; }
      info-region ul,info-region ol { padding-left: 18px; }
      info-region li { margin-bottom: 3px; }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'info-region-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ── InfoRegion ──────────────────────────────────────────────
  class InfoRegion extends HTMLElement {
    static get observedAttributes() {
      return [
        'active','color','border-width',
        'border-top-width','border-right-width','border-bottom-width','border-left-width',
        'border-style',
        'border-top-style','border-right-style','border-bottom-style','border-left-style',
      ];
    }
    connectedCallback() {
      injectStyles();
      if (this.getAttribute('active') === 'true') requestAnimationFrame(() => this._onActivated());
    }
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'active') { if (newVal === 'true' && oldVal !== 'true') this._onActivated(); }
      else if (this.getAttribute('active') === 'true') this._applyBorderStyles();
    }
    _onActivated() {
      this._applyBorderStyles();
      if (this.hasAttribute('manual') && this.getAttribute('next')) { this._insertManualButton(); return; }
      const parentGroup    = this.closest('info-region-group');
      const groupHasGlobal = parentGroup && parentGroup.hasAttribute('global-progress');
      const groupCascade   = parentGroup && parseInt(parentGroup.getAttribute('cascade-interval'), 10) > 0;
      if (groupCascade) return;
      if (this.hasAttribute('countdown') && !groupHasGlobal) this._startCountdown();
      else this._triggerNext(this._getInterval());
    }
    _applyBorderStyles() {
      const cfg       = window.InfoRegionConfig;
      const colorName = this.getAttribute('color') || cfg.defaultColor;
      const colorHex  = BrandColors.get(colorName) || BrandColors.get('sky');
      const attrAllW = this.getAttribute('border-width');
      const attrAllS = this.getAttribute('border-style');
      ['top','right','bottom','left'].forEach(side => {
        const C    = cap(side);
        const prop = 'border' + C;
        const attrW = this.getAttribute(`border-${side}-width`) != null
          ? this.getAttribute(`border-${side}-width`) : attrAllW;
        let cfgW = cfg[`border${C}Width`] != null ? cfg[`border${C}Width`]
          : cfg.borderAllWidth != null ? cfg.borderAllWidth
          : (side === 'left' ? cfg.borderWidth : 0);
        const w = attrW != null ? (parseInt(attrW, 10) || 0) : (parseInt(cfgW, 10) || 0);
        const attrS = this.getAttribute(`border-${side}-style`) != null
          ? this.getAttribute(`border-${side}-style`) : attrAllS;
        const s = attrS || cfg[`border${C}Style`] || cfg.borderStyle || 'solid';
        this.style[`${prop}Width`] = w + 'px';
        this.style[`${prop}Style`] = w > 0 ? s : 'none';
        this.style[`${prop}Color`] = w > 0 ? colorHex : 'transparent';
      });
    }
    _clearBorderStyles() {
      ['top','right','bottom','left'].forEach(side => {
        const prop = 'border' + cap(side);
        this.style[`${prop}Width`] = '';
        this.style[`${prop}Style`] = '';
        this.style[`${prop}Color`] = '';
      });
    }
    _insertManualButton() {
      if (this.querySelector('.ir-manual-wrap')) return;
      const cfg       = window.InfoRegionConfig;
      const label     = this.getAttribute('manual-label') || cfg.manualLabel;
      const colorName = this.getAttribute('manual-color') || this.getAttribute('color') || cfg.defaultColor;
      const align     = this.getAttribute('manual-align') || cfg.manualAlign;
      const justifyMap = { left:'flex-start', center:'center', right:'flex-end' };
      const wrap = document.createElement('div');
      wrap.className = 'ir-manual-wrap';
      wrap.style.justifyContent = justifyMap[align] || 'flex-end';
      const btn = document.createElement('button');
      btn.className = `ir-btn ir-manual-btn ir-btn--${colorName}`;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        btn.classList.add('is-leaving');
        btn.addEventListener('animationend', () => { wrap.remove(); this._triggerNext(0); }, { once: true });
      });
      wrap.appendChild(btn);
      this.appendChild(wrap);
    }
    _startCountdown() {
      const cfg       = window.InfoRegionConfig;
      const duration  = parseInt(this.getAttribute('countdown'), 10) || 2000;
      const position  = this.getAttribute('countdown-position') || cfg.countdownPosition;
      const height    = parseInt(this.getAttribute('countdown-height'), 10) || cfg.countdownHeight;
      const colorName = this.getAttribute('countdown-color') || this.getAttribute('color') || cfg.defaultColor;
      const colorHex  = BrandColors.get(colorName) || BrandColors.get('sky');
      const old = this.querySelector('.ir-countdown-bar');
      if (old) old.remove();
      const bar = document.createElement('div');
      bar.className = 'ir-countdown-bar';
      Object.assign(bar.style, { height: height + 'px', background: colorHex, [position]: '0', transition: `transform ${duration}ms linear` });
      this.appendChild(bar);
      requestAnimationFrame(() => { requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; }); });
      setTimeout(() => this._triggerNext(0), duration);
    }
    _triggerNext(delay) {
      const nextId = this.getAttribute('next');
      if (!nextId) return;
      setTimeout(() => {
        const el = document.getElementById(nextId);
        if (el) el.setAttribute('active', 'true');
        else console.warn(`[InfoRegion] 找不到 id="${nextId}" 的元素。`);
      }, delay);
    }
    _getInterval() { return parseInt(this.getAttribute('next-interval'), 10) || window.InfoRegionConfig.defaultInterval; }
    activate() { this.setAttribute('active', 'true'); }
    reset() {
      this.removeAttribute('active');
      this._clearBorderStyles();
      this.querySelector('.ir-countdown-bar')?.remove();
      this.querySelector('.ir-manual-wrap')?.remove();
    }
  }

  // ── InfoRegionGroup ─────────────────────────────────────────
  class InfoRegionGroup extends HTMLElement {
    constructor() { super(); this._progressBar = null; this._percentEl = null; this._observer = null; }
    connectedCallback() { injectStyles(); setTimeout(() => this._build(), 0); }
    disconnectedCallback() { if (this._observer) this._observer.disconnect(); }
    _getChildren() { return Array.from(this.querySelectorAll('info-region')); }
    _build() {
      this._setupLayout(); this._setupControls();
      if (this.hasAttribute('global-progress')) { this._setupGlobalProgress(); this._setupObserver(); }
      if (this.hasAttribute('auto-start')) setTimeout(() => this._start(), 0);
    }
    _setupLayout() {
      if (this.getAttribute('layout') !== 'horizontal') return;
      const children = Array.from(this.querySelectorAll(':scope > info-region'));
      if (children.length === 0) return;
      const colClass = this.getAttribute('col-class') || this._autoColClass(children.length);
      const gutter   = this.getAttribute('gutter') || 'g-3';
      const row      = document.createElement('div');
      row.className  = `row ${gutter} align-items-stretch`;
      children.forEach(child => {
        const col = document.createElement('div'); col.className = `ir-col ${colClass}`;
        this.removeChild(child); col.appendChild(child); row.appendChild(col);
      });
      this.appendChild(row);
    }
    _autoColClass(count) {
      if (count <= 2) return 'col-md-6 col-12';
      if (count === 3) return 'col-md-4 col-sm-6 col-12';
      if (count === 4) return 'col-md-3 col-sm-6 col-12';
      if (count === 6) return 'col-md-2 col-sm-4 col-12';
      return 'col-md col-sm-6 col-12';
    }
    _setupControls() {
      if (this.getAttribute('show-controls') === 'false') return;
      const startLabel = this.getAttribute('start-label') || '▶ 開始';
      const resetLabel = this.getAttribute('reset-label') || '↺ 重設';
      const startColor = this.getAttribute('start-color') || 'sky';
      const resetColor = this.getAttribute('reset-color') || 'warning';
      const div = document.createElement('div'); div.className = 'ir-controls';
      const startBtn = document.createElement('button');
      startBtn.className = `ir-btn ir-btn--${startColor}`; startBtn.textContent = startLabel;
      startBtn.addEventListener('click', () => this._start()); this._applyBtnStyles(startBtn, 'start');
      const resetBtn = document.createElement('button');
      resetBtn.className = `ir-btn ir-btn--${resetColor}`; resetBtn.textContent = resetLabel;
      resetBtn.addEventListener('click', () => this._reset()); this._applyBtnStyles(resetBtn, 'reset');
      div.append(startBtn, resetBtn); this.insertBefore(div, this.firstChild);
    }
    _applyBtnStyles(btn, prefix) {
      const cfg = window.InfoRegionConfig; const cfgPrefix = prefix + 'Btn';
      const resolve = (attr, cfgKey, fbAttr, fbCfgKey) => {
        const v = this.getAttribute(attr); if (v != null) return v;
        if (cfg[cfgKey] != null) return String(cfg[cfgKey]);
        if (fbAttr) { const fv = this.getAttribute(fbAttr); if (fv != null) return fv; }
        if (fbCfgKey && cfg[fbCfgKey] != null) return String(cfg[fbCfgKey]);
        return null;
      };
      const width    = resolve(`${prefix}-width`,`${cfgPrefix}Width`,'btn-width','btnWidth');
      const height   = resolve(`${prefix}-height`,`${cfgPrefix}Height`,'btn-height','btnHeight');
      const fontSize = resolve(`${prefix}-font-size`,`${cfgPrefix}FontSize`,'btn-font-size','btnFontSize');
      const padding  = resolve(`${prefix}-padding`,`${cfgPrefix}Padding`,'btn-padding','btnPadding');
      if (width)    btn.style.width    = addUnit(width,   'px');
      if (height)   btn.style.height   = addUnit(height,  'px');
      if (fontSize) btn.style.fontSize = addUnit(fontSize,'rem');
      if (padding)  btn.style.padding  = padding;
    }
    _setupGlobalProgress() {
      const cfg       = window.InfoRegionConfig;
      const position  = this.getAttribute('progress-position') || cfg.progressPosition;
      const height    = parseInt(this.getAttribute('progress-height'), 10) || cfg.progressHeight;
      const colorName = this.getAttribute('progress-color') || cfg.defaultColor;
      const colorHex  = BrandColors.get(colorName) || BrandColors.get('sky');
      const showPct   = this.hasAttribute('show-percent');
      const wrap = document.createElement('div');
      wrap.className = 'ir-global-progress-wrap';
      wrap.style[position === 'top' ? 'marginBottom' : 'marginTop'] = '12px';
      const track = document.createElement('div');
      track.className = 'ir-global-progress-track'; track.style.height = height + 'px';
      const bar = document.createElement('div');
      bar.className = 'ir-global-progress-bar'; bar.style.background = colorHex;
      track.appendChild(bar); this._progressBar = bar; wrap.appendChild(track);
      if (showPct) {
        const pct = document.createElement('span');
        pct.className = 'ir-global-percent'; pct.style.color = colorHex; pct.textContent = '0%';
        wrap.appendChild(pct); this._percentEl = pct;
      }
      if (position === 'top') {
        const controls = this.querySelector('.ir-controls');
        if (controls) controls.insertAdjacentElement('afterend', wrap); else this.insertBefore(wrap, this.firstChild);
      } else { this.appendChild(wrap); }
    }
    _setupObserver() {
      this._observer = new MutationObserver(() => this._updateProgress());
      this._getChildren().forEach(child => {
        this._observer.observe(child, { attributes: true, attributeFilter: ['active'] });
      });
    }
    _updateProgress() {
      if (!this._progressBar) return;
      const children  = this._getChildren();
      const total     = children.length;
      const activated = children.filter(el => el.getAttribute('active') === 'true').length;
      const ratio     = total > 0 ? activated / total : 0;
      this._progressBar.style.transform = `scaleX(${ratio})`;
      if (this._percentEl) {
        this._percentEl.textContent = Math.round(ratio * 100) + '%';
        if (ratio > 0) this._percentEl.style.opacity = '1';
      }
    }
    _start() {
      this._reset(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this._progressBar) {
            const cfg = window.InfoRegionConfig;
            this._progressBar.style.transition = `transform ${cfg.progressTransition}ms ease`;
          }
          const children = this._getChildren(); if (children.length === 0) return;
          const cascadeMs = parseInt(this.getAttribute('cascade-interval'), 10) || window.InfoRegionConfig.cascadeInterval;
          if (cascadeMs > 0) children.forEach((child, i) => setTimeout(() => child.activate(), i * cascadeMs));
          else children[0].activate();
        });
      });
    }
    _reset(reenableTransition = true) {
      this._getChildren().forEach(el => el.reset());
      if (this._progressBar) {
        this._progressBar.style.transition = 'none';
        this._progressBar.style.transform  = 'scaleX(0)';
        if (reenableTransition) {
          requestAnimationFrame(() => {
            if (this._progressBar) {
              const cfg = window.InfoRegionConfig;
              this._progressBar.style.transition = `transform ${cfg.progressTransition}ms ease`;
            }
          });
        }
      }
      if (this._percentEl) { this._percentEl.textContent = '0%'; this._percentEl.style.opacity = '0'; }
    }
    start() { this._start(); }
    reset() { this._reset(); }
  }

  customElements.define('info-region',       InfoRegion);
  customElements.define('info-region-group',  InfoRegionGroup);

  window.InfoRegion = {
    activate(id) {
      const el = document.getElementById(id);
      if (el && el.tagName === 'INFO-REGION') el.activate();
      else console.warn(`[InfoRegion.activate] 找不到 info-region#${id}`);
    },
    resetAll(scopeSelector = 'info-region') {
      document.querySelectorAll(scopeSelector).forEach(el => {
        if (el.tagName === 'INFO-REGION') el.reset();
      });
    },
    get colors() { return Object.keys(BrandColors.current).filter(k => !['name','bg','surface','floatBg','floatBg2','floatBg3','borderSubtle','progressTrack'].includes(k)); },
    get config()  { return Object.assign({}, window.InfoRegionConfig); },
  };

})();

function wfResolveColor(val) {
  if (!val) return null;
  return BrandColors.resolve(val) ?? val;
}

function wfContrastColor(hex) {
  if (!hex) return BrandColors.get('shell');
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.5 ? '#1a1a1a' : '#e8e8e0';
}

function wfAlphaColor(hex, alpha = 0.18) {
  if (!hex) return `rgba(51,51,51,${alpha})`;
  const c = hex.replace('#','');
  const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function wfRenderFix(val) {
  if (!val) return '';
  const m = val.match(/bi-([\w-]+)/);
  if (m) {
    const bi = 'bi-' + m[1];
    const before = val.slice(0, val.indexOf(bi));
    const after  = val.slice(val.indexOf(bi) + bi.length);
    return `${before}<i class="bi bi-${m[1]}"></i>${after}`;
  }
  return val;
}

// ── CSS 注入（使用 CSS 變數，自動跟隨主題）──────────────────────
(function injectWFStyles() {
  if (document.getElementById('word-flip-styles')) return;

  const css = `
/* ── Word Flip 私有變數（引用 BrandColors CSS 變數）── */
:root {
  --wf-bg-base:         var(--color-bg,        #0c0d0c);
  --wf-bg-fill:         var(--color-surface,   #333333);
  --wf-color-shell:     var(--color-shell,     #c6c7bd);
  --wf-color-lavender:  var(--color-lavender,  #C3A5E5);
  --wf-color-special:   var(--color-special,   #C8DD5A);
  --wf-color-warning:   var(--color-warning,   #F08080);
  --wf-color-salmon:    var(--color-salmon,    #E5C3B3);
  --wf-color-attention: var(--color-attention, #E5E5A6);
  --wf-color-sky:       var(--color-sky,       #04b5a3);
  --wf-color-safe:      var(--color-safe,      #81E6D9);
  --wf-color-brown:     var(--color-brown,     #d9b375);
  --wf-color-info:      var(--color-info,      #90CDF4);
  --wf-color-pink:      var(--color-pink,      #FFB3D9);
  --wf-color-orange:    var(--color-orange,    #f69653);
}

/* ════ word-flip 預設外觀 ════ */
word-flip {
  display: inline-block; position: relative; cursor: pointer;
  border-bottom: 2px dotted var(--wf-accent, var(--wf-color-lavender));
  color: var(--wf-accent, var(--wf-color-lavender));
  transition: all 0.25s ease; padding-bottom: 2px;
  -webkit-user-select: none; user-select: none;
  max-width: 100%; vertical-align: baseline;
}
word-flip:hover { border-bottom-style: solid; filter: brightness(1.15); }
word-flip.wf-flipped {
  display: inline-block; border-bottom-style: solid;
  background: var(--wf-accent-alpha, rgba(195,165,229,0.12));
  padding: 8px 12px; border-radius: 6px; border-bottom: none;
  border-left: 3px solid var(--wf-accent, var(--wf-color-lavender));
  line-height: 1.6; vertical-align: baseline;
}
word-flip.wf-animating { pointer-events: none; }
word-flip.wf-has-style { border-bottom: none; padding-bottom: 0; }

/* ════ Trigger Styles ════ */
word-flip.wf-style-underline { text-decoration: underline; text-decoration-style: dotted; text-decoration-thickness: 2px; text-underline-offset: 4px; }
word-flip.wf-style-underline:hover { text-decoration-style: solid; }
word-flip.wf-style-highlight { border-radius: 3px; padding: 1px 4px; }
word-flip.wf-style-highlight:hover { filter: brightness(1.12); }
word-flip.wf-style-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.78rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; line-height: 1.5; vertical-align: middle; }
word-flip.wf-style-badge:hover { filter: brightness(1.15); transform: translateY(-1px); }
word-flip.wf-style-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 0.85rem; font-weight: 500; padding: 3px 10px; border-radius: 4px; border-left: 3px solid; vertical-align: middle; }
word-flip.wf-style-tag:hover { filter: brightness(1.1); }
word-flip.wf-style-button { display: inline-flex; align-items: center; gap: 5px; font-size: 0.85rem; font-weight: 500; padding: 5px 14px; border-radius: 6px; vertical-align: middle; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
word-flip.wf-style-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.35); filter: brightness(1.08); }
word-flip.wf-style-button:active { transform: translateY(0); }
word-flip.wf-style-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem; padding: 2px 10px 2px 7px; border-radius: 999px; border: 1.5px solid; vertical-align: middle; font-weight: 500; }
word-flip.wf-style-pill::before { content: '●'; font-size: 0.6em; opacity: 0.7; }
word-flip.wf-style-pill:hover { filter: brightness(1.15); }
word-flip.wf-style-dotted { text-decoration: underline; text-decoration-style: dotted; text-decoration-thickness: 2px; text-underline-offset: 4px; }
word-flip.wf-style-dotted:hover { text-decoration-thickness: 3px; }
word-flip.wf-style-icon { display: inline-flex; align-items: center; gap: 5px; }
word-flip.wf-style-icon:hover { opacity: 0.8; }
word-flip.wf-active { opacity: 0.75; }

/* ════ 已讀標記 ════ */
word-flip.wf-read::after {
  content: ''; position: absolute; top: -4px; right: -4px;
  width: var(--wf-read-size, 6px); height: var(--wf-read-size, 6px);
  background: var(--wf-read-color, var(--wf-color-safe));
  border-radius: 50%; opacity: 0; transition: opacity 0.3s ease;
}
word-flip.wf-read.wf-show-mark::after { opacity: 1; }
word-flip.wf-read[data-read-mark="check"]::after { content: '✓'; background: none; color: var(--wf-read-color, var(--wf-color-safe)); font-size: calc(var(--wf-read-size, 6px) * 2); width: auto; height: auto; font-weight: bold; line-height: 1; }
word-flip.wf-read[data-read-mark="star"]::after  { content: '★'; background: none; color: var(--wf-read-color, var(--wf-color-safe)); font-size: calc(var(--wf-read-size, 6px) * 2); width: auto; height: auto; line-height: 1; }
word-flip.wf-read[data-read-mark="icon"]::after  { content: ''; background: none; width: auto; height: auto; font-family: 'bootstrap-icons'; color: var(--wf-read-color, var(--wf-color-safe)); font-size: calc(var(--wf-read-size, 6px) * 2); line-height: 1; }
word-flip.wf-read[data-read-mark="icon"][data-read-mark-icon]::after { content: attr(data-read-mark-icon-content); }

/* ════ word-trigger ════ */
word-trigger {
  display: inline; position: relative; cursor: pointer;
  border-bottom: 2px solid var(--wf-accent, var(--wf-color-special));
  color: var(--wf-accent, var(--wf-color-special));
  transition: all 0.25s ease; padding-bottom: 2px;
  font-weight: 500; -webkit-user-select: none; user-select: none;
}
word-trigger:hover { filter: brightness(1.2); transform: translateY(-1px); }
word-trigger.wf-active { background: var(--wf-accent-alpha, rgba(200,221,90,0.15)); padding: 2px 6px; border-radius: 3px; border-bottom: 2px solid var(--wf-accent, var(--wf-color-special)); }
word-trigger.wf-read::after { content: ''; position: absolute; top: -4px; right: -4px; width: var(--wf-read-size, 6px); height: var(--wf-read-size, 6px); background: var(--wf-read-color, var(--wf-color-safe)); border-radius: 50%; opacity: 0; transition: opacity 0.3s ease; }
word-trigger.wf-read.wf-show-mark::after { opacity: 1; }

/* ════ flip-cards / flip-card ════ */
flip-cards { display: block; margin: 32px 0; padding: 0; }
flip-card { display: block; position: relative; margin-bottom: 20px; perspective: 1200px; min-height: 120px; }
.wf-card-inner { position: relative; width: 100%; min-height: 120px; transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); transform-style: preserve-3d; }
flip-card.wf-flipped .wf-card-inner { transform: rotateY(180deg); }
card-front, card-back {
  display: block; position: absolute; width: 100%; min-height: 120px;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  background: var(--wf-bg-fill);
  border: 1px solid var(--wf-border-color, var(--color-border-subtle, rgba(198,199,189,0.2)));
  border-left: var(--wf-bar-width, 6px) solid var(--wf-accent, var(--wf-color-shell));
  padding: 20px 24px; border-radius: 0 8px 8px 0;
  color: var(--wf-color-shell); line-height: 1.7; box-sizing: border-box;
}
card-front { transform: rotateY(0deg); z-index: 2; }
card-back  { transform: rotateY(180deg); z-index: 1; }
card-front h1,card-front h2,card-front h3,card-front h4,card-front h5,card-front h6,
card-back  h1,card-back  h2,card-back  h3,card-back  h4,card-back  h5,card-back  h6 { margin: 0 0 12px; color: var(--wf-accent, var(--wf-color-shell)); font-weight: 600; }
card-front h4,card-back h4 { font-size: 1.15rem; }
card-front h5,card-back h5 { font-size: 1.05rem; }
card-front p,card-back p { margin: 0 0 12px; }
card-front p:last-child,card-back p:last-child { margin-bottom: 0; }
card-front ul,card-front ol,card-back ul,card-back ol { margin: 0 0 12px; padding-left: 24px; }
card-front li,card-back li { margin-bottom: 6px; }
card-front strong,card-back strong { color: var(--wf-color-special); font-weight: 600; }
card-front em,card-back em { color: var(--wf-color-lavender); font-style: normal; }
card-front code,card-back code { background: rgba(127,127,127,0.12); padding: 2px 6px; border-radius: 3px; font-size: 0.9em; color: var(--wf-color-sky); font-family: 'Courier New',monospace; }
card-front small,card-back small { font-size: 0.85rem; opacity: 0.8; }
flip-card:not(.wf-flipped) card-front { cursor: pointer; transition: all 0.3s ease; }
flip-card:not(.wf-flipped):hover card-front { transform: translateX(3px); box-shadow: -3px 0 12px rgba(0,0,0,0.3); }
flip-card.wf-flipped card-back { cursor: pointer; transition: all 0.3s ease; }
flip-card.wf-flipped:hover card-back { box-shadow: 0 4px 16px rgba(0,0,0,0.4); }

/* ════ data-color 對照 ════ */
word-flip[data-color="shell"],word-trigger[data-color="shell"]    { --wf-accent:var(--wf-color-shell);     --wf-accent-alpha:rgba(198,199,189,0.12); }
flip-card[data-color="shell"]    { --wf-accent:var(--wf-color-shell); }
word-flip[data-color="lavender"],word-trigger[data-color="lavender"] { --wf-accent:var(--wf-color-lavender); --wf-accent-alpha:rgba(195,165,229,0.12); }
flip-card[data-color="lavender"] { --wf-accent:var(--wf-color-lavender); }
word-flip[data-color="special"],word-trigger[data-color="special"]  { --wf-accent:var(--wf-color-special);  --wf-accent-alpha:rgba(200,221,90,0.12); }
flip-card[data-color="special"]  { --wf-accent:var(--wf-color-special); }
word-flip[data-color="warning"],word-trigger[data-color="warning"]  { --wf-accent:var(--wf-color-warning);  --wf-accent-alpha:rgba(240,128,128,0.12); }
flip-card[data-color="warning"]  { --wf-accent:var(--wf-color-warning); }
word-flip[data-color="salmon"],word-trigger[data-color="salmon"]   { --wf-accent:var(--wf-color-salmon);   --wf-accent-alpha:rgba(229,195,179,0.12); }
flip-card[data-color="salmon"]   { --wf-accent:var(--wf-color-salmon); }
word-flip[data-color="attention"],word-trigger[data-color="attention"]{ --wf-accent:var(--wf-color-attention);--wf-accent-alpha:rgba(229,229,166,0.12); }
flip-card[data-color="attention"] { --wf-accent:var(--wf-color-attention); }
word-flip[data-color="sky"],word-trigger[data-color="sky"]       { --wf-accent:var(--wf-color-sky);      --wf-accent-alpha:rgba(4,181,163,0.12); }
flip-card[data-color="sky"]      { --wf-accent:var(--wf-color-sky); }
word-flip[data-color="safe"],word-trigger[data-color="safe"]      { --wf-accent:var(--wf-color-safe);     --wf-accent-alpha:rgba(129,230,217,0.12); }
flip-card[data-color="safe"]     { --wf-accent:var(--wf-color-safe); }
word-flip[data-color="brown"],word-trigger[data-color="brown"]     { --wf-accent:var(--wf-color-brown);    --wf-accent-alpha:rgba(217,179,117,0.12); }
flip-card[data-color="brown"]    { --wf-accent:var(--wf-color-brown); }
word-flip[data-color="info"],word-trigger[data-color="info"]      { --wf-accent:var(--wf-color-info);     --wf-accent-alpha:rgba(144,205,244,0.12); }
flip-card[data-color="info"]     { --wf-accent:var(--wf-color-info); }
word-flip[data-color="pink"],word-trigger[data-color="pink"]      { --wf-accent:var(--wf-color-pink);     --wf-accent-alpha:rgba(255,179,217,0.12); }
flip-card[data-color="pink"]     { --wf-accent:var(--wf-color-pink); }
word-flip[data-color="orange"],word-trigger[data-color="orange"]    { --wf-accent:var(--wf-color-orange);   --wf-accent-alpha:rgba(246,150,83,0.12); }
flip-card[data-color="orange"]   { --wf-accent:var(--wf-color-orange); }

word-flip[data-read-mark-color="shell"]    ,word-trigger[data-read-mark-color="shell"]    { --wf-read-color:var(--wf-color-shell); }
word-flip[data-read-mark-color="lavender"] ,word-trigger[data-read-mark-color="lavender"] { --wf-read-color:var(--wf-color-lavender); }
word-flip[data-read-mark-color="special"]  ,word-trigger[data-read-mark-color="special"]  { --wf-read-color:var(--wf-color-special); }
word-flip[data-read-mark-color="warning"]  ,word-trigger[data-read-mark-color="warning"]  { --wf-read-color:var(--wf-color-warning); }
word-flip[data-read-mark-color="salmon"]   ,word-trigger[data-read-mark-color="salmon"]   { --wf-read-color:var(--wf-color-salmon); }
word-flip[data-read-mark-color="attention"],word-trigger[data-read-mark-color="attention"]{ --wf-read-color:var(--wf-color-attention); }
word-flip[data-read-mark-color="sky"]      ,word-trigger[data-read-mark-color="sky"]      { --wf-read-color:var(--wf-color-sky); }
word-flip[data-read-mark-color="safe"]     ,word-trigger[data-read-mark-color="safe"]     { --wf-read-color:var(--wf-color-safe); }
word-flip[data-read-mark-color="brown"]    ,word-trigger[data-read-mark-color="brown"]    { --wf-read-color:var(--wf-color-brown); }
word-flip[data-read-mark-color="info"]     ,word-trigger[data-read-mark-color="info"]     { --wf-read-color:var(--wf-color-info); }
word-flip[data-read-mark-color="pink"]     ,word-trigger[data-read-mark-color="pink"]     { --wf-read-color:var(--wf-color-pink); }
word-flip[data-read-mark-color="orange"]   ,word-trigger[data-read-mark-color="orange"]   { --wf-read-color:var(--wf-color-orange); }

/* ════ 浮動面板 ════ */
.wf-tooltip-box {
  position: fixed; z-index: 99999; max-width: 280px; min-width: 120px;
  background: var(--color-float-bg-3, #2a2b2a);
  border: 1px solid var(--wf-float-color, var(--color-shell, #c6c7bd));
  color: var(--color-shell, #c6c7bd);
  padding: 8px 12px; border-radius: 6px; font-size: 0.88rem; line-height: 1.7;
  box-shadow: 0 6px 24px rgba(0,0,0,0.55);
  pointer-events: none; opacity: 0; transform: translateY(6px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.wf-tooltip-box.wf-show { opacity: 1; transform: translateY(0); pointer-events: auto; }
.wf-tooltip-box::before { content: ''; position: absolute; bottom: 100%; left: 14px; border: 6px solid transparent; border-bottom-color: var(--wf-float-color, var(--color-shell,#c6c7bd)); }
.wf-tooltip-box.wf-above::before { bottom: auto; top: 100%; border-bottom-color: transparent; border-top-color: var(--wf-float-color, var(--color-shell,#c6c7bd)); }

.wf-popover-box {
  position: fixed; z-index: 99990; width: 320px; max-width: calc(100vw - 32px);
  background: var(--color-float-bg-2, #242524);
  border: 1px solid var(--wf-float-color, var(--color-shell,#c6c7bd));
  border-top: 3px solid var(--wf-float-color, var(--color-shell,#c6c7bd));
  color: var(--color-shell,#c6c7bd); border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.65);
  opacity: 0; transform: scale(0.95) translateY(6px); transform-origin: top left;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.wf-popover-box.wf-show { opacity: 1; transform: scale(1) translateY(0); }
.wf-popover-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 8px; border-bottom: 1px solid var(--color-border-subtle,rgba(198,199,189,0.12)); }
.wf-popover-title { font-size: 0.9rem; font-weight: 600; color: var(--wf-float-color, var(--color-shell,#c6c7bd)); }
.wf-popover-close { background: none; border: none; color: rgba(198,199,189,0.5); cursor: pointer; font-size: 1rem; line-height: 1; padding: 2px 4px; border-radius: 3px; transition: color 0.2s; }
.wf-popover-close:hover { color: var(--color-shell,#c6c7bd); }
.wf-popover-body { padding: 12px 14px 14px; font-size: 0.92rem; line-height: 1.8; }
.wf-popover-body strong { color: var(--color-special); }
.wf-popover-body em { color: var(--color-lavender); font-style: normal; }
.wf-popover-body code { background: rgba(127,127,127,0.12); padding: 1px 6px; border-radius: 3px; font-size: 0.88em; color: var(--color-sky); }
.wf-popover-body p { margin: 0 0 8px; } .wf-popover-body p:last-child { margin-bottom: 0; }

.wf-modal-overlay { position: fixed; inset: 0; z-index: 99980; background: rgba(12,13,12,0.82); display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; transition: opacity 0.28s ease; }
.wf-modal-overlay.wf-show { opacity: 1; }
.wf-modal-box {
  background: var(--color-float-bg, #1e1f1e);
  border: 1px solid var(--wf-float-color, var(--color-shell,#c6c7bd));
  border-top: 3px solid var(--wf-float-color, var(--color-shell,#c6c7bd));
  border-radius: 10px; width: 540px; max-width: 100%; max-height: 80vh;
  display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.75);
  transform: scale(0.94) translateY(16px); transition: transform 0.28s ease;
}
.wf-modal-overlay.wf-show .wf-modal-box { transform: scale(1) translateY(0); }
.wf-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 12px; border-bottom: 1px solid var(--color-border-subtle,rgba(198,199,189,0.12)); flex-shrink: 0; }
.wf-modal-title { font-size: 1rem; font-weight: 600; color: var(--wf-float-color,var(--color-shell,#c6c7bd)); display: flex; align-items: center; gap: 8px; }
.wf-modal-close { background: rgba(127,127,127,0.1); border: 1px solid var(--color-border-subtle,rgba(198,199,189,0.15)); color: rgba(198,199,189,0.6); cursor: pointer; width: 28px; height: 28px; border-radius: 5px; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.wf-modal-close:hover { background: rgba(127,127,127,0.2); color: var(--color-shell,#c6c7bd); }
.wf-modal-body { padding: 16px 18px 20px; overflow-y: auto; font-size: 0.95rem; line-height: 1.85; color: var(--color-shell,#c6c7bd); }
.wf-modal-body strong { color: var(--color-special); }
.wf-modal-body em { color: var(--color-lavender); font-style: normal; }
.wf-modal-body code { background: rgba(127,127,127,0.12); padding: 2px 7px; border-radius: 4px; font-size: 0.88em; color: var(--color-sky); }
.wf-modal-body p { margin: 0 0 10px; } .wf-modal-body p:last-child { margin-bottom: 0; }
.wf-modal-body h4,.wf-modal-body h5 { color: var(--wf-float-color,var(--color-shell,#c6c7bd)); margin: 14px 0 6px; }
.wf-modal-body ul,.wf-modal-body ol { padding-left: 20px; margin: 6px 0; }
.wf-modal-body li { margin: 4px 0; }

.wf-drawer-overlay { position: fixed; inset: 0; z-index: 99970; background: rgba(12,13,12,0.6); opacity: 0; transition: opacity 0.3s ease; }
.wf-drawer-overlay.wf-show { opacity: 1; }
.wf-drawer-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 99975;
  width: 360px; max-width: 92vw;
  background: var(--color-float-bg, #1e1f1e);
  border-left: 3px solid var(--wf-float-color, var(--color-shell,#c6c7bd));
  display: flex; flex-direction: column; box-shadow: -8px 0 40px rgba(0,0,0,0.6);
  transform: translateX(100%); transition: transform 0.32s cubic-bezier(.4,0,.2,1);
}
.wf-drawer-panel.wf-show { transform: translateX(0); }
.wf-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 14px; border-bottom: 1px solid var(--color-border-subtle,rgba(198,199,189,0.12)); flex-shrink: 0; }
.wf-drawer-title { font-size: 1rem; font-weight: 600; color: var(--wf-float-color,var(--color-shell,#c6c7bd)); display: flex; align-items: center; gap: 8px; }
.wf-drawer-close { background: rgba(127,127,127,0.1); border: 1px solid var(--color-border-subtle,rgba(198,199,189,0.15)); color: rgba(198,199,189,0.6); cursor: pointer; width: 28px; height: 28px; border-radius: 5px; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.wf-drawer-close:hover { background: rgba(127,127,127,0.2); color: var(--color-shell,#c6c7bd); }
.wf-drawer-body { padding: 16px 18px 24px; overflow-y: auto; flex: 1; font-size: 0.95rem; line-height: 1.85; color: var(--color-shell,#c6c7bd); }
.wf-drawer-body strong { color: var(--color-special); }
.wf-drawer-body em { color: var(--color-lavender); font-style: normal; }
.wf-drawer-body code { background: rgba(127,127,127,0.12); padding: 2px 7px; border-radius: 4px; font-size: 0.88em; color: var(--color-sky); }
.wf-drawer-body p { margin: 0 0 10px; } .wf-drawer-body p:last-child { margin-bottom: 0; }
.wf-esc-hint { font-size: 0.75rem; color: rgba(198,199,189,0.35); text-align: right; padding: 0 18px 10px; flex-shrink: 0; }

@media (max-width: 640px) {
  card-front,card-back { padding: 16px 18px; font-size: 0.95rem; }
  card-front h4,card-back h4 { font-size: 1.05rem; }
  flip-card { margin-bottom: 16px; }
}
  `;

  const style = document.createElement('style');
  style.id = 'word-flip-styles';
  style.textContent = css;
  document.head.appendChild(style);
})();

// ── 全域配置 ────────────────────────────────────────────────────
const WF_DEFAULT_CONFIG = {
  defaultColor: 'lavender', defaultAnimation: 'flip', autoFlipBack: 0,
  focusMode: false, readMark: 'dot', readMarkColor: 'safe',
  readMarkSize: 6, readMarkPosition: 'top-right', readMarkIcon: '',
  borderStyle: 'none', borderWidth: 1, barWidth: 6,
  mode: 'inline', triggerStyle: '', hoverTrigger: false, toggle: true,
  closeOnOverlay: true, title: '', prefix: '', postfix: '',
  icon: '', boxWidth: '', boxHeight: '', titleFontsize: '', bodyFontsize: '',
};

let WF_CONFIG = { ...WF_DEFAULT_CONFIG, ...(window.WF_INITIAL_CONFIG || {}) };

const wfActiveFloats = new Map();
function wfCloseAll(exceptEl) { wfActiveFloats.forEach((closeFn, el) => { if (el !== exceptEl) closeFn(); }); }

function wfPositionFloat(box, trigger, offset = 8) {
  const tr = trigger.getBoundingClientRect();
  const bw = box.offsetWidth || 300, bh = box.offsetHeight || 160;
  const vw = window.innerWidth, vh = window.innerHeight;
  let top = tr.bottom + offset, left = tr.left;
  if (left + bw > vw - 12) left = vw - bw - 12;
  if (left < 8) left = 8;
  const above = top + bh > vh - 12;
  if (above) { top = tr.top - bh - offset; box.classList.add('wf-above'); }
  else box.classList.remove('wf-above');
  box.style.top = top + 'px'; box.style.left = left + 'px';
}

function isHTMLContent(str) { return /<[^>]+>/.test(str); }
function replaceTemplateVariables(content, variables) {
  if (!content || !variables) return content;
  return content.replace(/\{\{([^:}]+):([^}]+)\}\}/g, (match, varName, defaultValue) => {
    const trimmedName = varName.trim(), trimmedDefault = defaultValue.trim();
    return variables.hasOwnProperty(trimmedName) ? variables[trimmedName] : trimmedDefault;
  });
}
function getContentFromSource(source, variables = null) {
  if (!source) return '';
  let content = '';
  if (isHTMLContent(source)) { content = source; }
  else {
    const id = source.startsWith('#') ? source.substring(1) : source;
    const element = document.getElementById(id);
    if (element) content = element.innerHTML;
    else { console.warn(`word-flip: 找不到 ID 為 "${id}" 的元素`); content = source; }
  }
  if (variables) content = replaceTemplateVariables(content, variables);
  return content;
}
function reinitializeEmbeddedComponents(container) {
  requestAnimationFrame(() => {
    container.querySelectorAll('extra-note').forEach(el => {
      if (el._initialized) { el.disconnectedCallback?.(); el._initialized = false; }
      el.connectedCallback?.();
    });
    container.querySelectorAll('word-flip, word-trigger').forEach(el => {
      if (!el._initialized) el.connectedCallback?.();
    });
    container.dispatchEvent(new CustomEvent('wf:content-loaded', { detail: { container }, bubbles: true }));
  });
}
function applyFontSizes(titleEl, bodyEl, titleFs, bodyFs) {
  if (titleEl && titleFs) titleEl.style.fontSize = titleFs;
  if (bodyEl  && bodyFs)  bodyEl.style.fontSize  = bodyFs;
}

// ── WordFlip 元件 ───────────────────────────────────────────────
class WordFlip extends HTMLElement {
  static get observedAttributes() {
    return ['data-content','data-color','mode','trigger-style','title','prefix','postfix','icon','box-width','box-height','title-fontsize','body-fontsize'];
  }
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;
    this._originalContent = this.innerHTML; this._flipped = false;
    this._flipTimeout = null; this._open = false; this._closeFloat = null;
    this._applyConfig(); this._applyTriggerStyle(); this._attachEvents();
  }
  attributeChangedCallback() { if (this._initialized) this._applyTriggerStyle(); }
  get _opt() {
    return {
      contentSource : this.getAttribute('data-content') || this.getAttribute('source') || '',
      color         : this.getAttribute('data-color') || WF_CONFIG.defaultColor,
      mode          : this.getAttribute('mode')          || WF_CONFIG.mode,
      triggerStyle  : this.getAttribute('trigger-style') || WF_CONFIG.triggerStyle,
      hoverTrigger  : this.hasAttribute('hover')          || WF_CONFIG.hoverTrigger,
      toggle        : this.getAttribute('toggle') !== 'false' && WF_CONFIG.toggle,
      closeOnOverlay: this.getAttribute('close-on-overlay') !== 'false' && WF_CONFIG.closeOnOverlay,
      title         : this.getAttribute('title')          || WF_CONFIG.title,
      prefix        : this.getAttribute('prefix')         ?? WF_CONFIG.prefix,
      postfix       : this.getAttribute('postfix')        ?? WF_CONFIG.postfix,
      icon          : this.getAttribute('icon')           || WF_CONFIG.icon,
      boxWidth      : this.getAttribute('box-width')      || WF_CONFIG.boxWidth,
      boxHeight     : this.getAttribute('box-height')     || WF_CONFIG.boxHeight,
      titleFontsize : this.getAttribute('title-fontsize') || WF_CONFIG.titleFontsize,
      bodyFontsize  : this.getAttribute('body-fontsize')  || WF_CONFIG.bodyFontsize,
      autoFlipBack  : parseInt(this.getAttribute('data-auto-back')) || WF_CONFIG.autoFlipBack || 0,
    };
  }
  _applyConfig() {
    if (!this.hasAttribute('data-color')) this.setAttribute('data-color', WF_CONFIG.defaultColor);
    if (!this.hasAttribute('data-auto-back') && WF_CONFIG.autoFlipBack > 0) this.setAttribute('data-auto-back', WF_CONFIG.autoFlipBack);
    const readMark      = this.getAttribute('data-read-mark')       || WF_CONFIG.readMark;
    const readMarkColor = this.getAttribute('data-read-mark-color') || WF_CONFIG.readMarkColor;
    const readMarkSize  = this.getAttribute('data-read-mark-size')  || WF_CONFIG.readMarkSize;
    const readMarkIcon  = this.getAttribute('data-read-mark-icon')  || WF_CONFIG.readMarkIcon;
    if (readMark !== 'none') {
      this.setAttribute('data-read-mark', readMark);
      this.setAttribute('data-read-mark-color', readMarkColor);
      this.style.setProperty('--wf-read-size', readMarkSize + 'px');
      if (readMark === 'icon' && readMarkIcon) { this.setAttribute('data-read-mark-icon', readMarkIcon); this._applyBootstrapIcon(readMarkIcon); }
    }
  }
  _applyTriggerStyle() {
    const { triggerStyle, color } = this._opt;
    if (!triggerStyle) return;
    const hex = wfResolveColor(color) || '#C3A5E5';
    this.classList.forEach(c => { if (c.startsWith('wf-style-')) this.classList.remove(c); });
    this.classList.add('wf-has-style'); this.classList.add(`wf-style-${triggerStyle}`);
    this.style.setProperty('--wf-float-color', hex);
    const ts = triggerStyle;
    if (ts === 'underline' || ts === 'dotted') { this.style.textDecorationColor = hex; this.style.color = hex; }
    else if (ts === 'highlight') { this.style.background = wfAlphaColor(hex, 0.28); this.style.color = hex; }
    else if (ts === 'badge') { this.style.background = wfAlphaColor(hex, 0.2); this.style.color = hex; this.style.border = `1px solid ${wfAlphaColor(hex, 0.45)}`; }
    else if (ts === 'tag') { this.style.background = wfAlphaColor(hex, 0.12); this.style.color = hex; this.style.borderLeftColor = hex; }
    else if (ts === 'button') { this.style.background = hex; this.style.color = wfContrastColor(hex); }
    else if (ts === 'pill') { this.style.color = hex; this.style.borderColor = wfAlphaColor(hex, 0.55); }
    else if (ts === 'icon') { this.style.color = hex; }
    const o = this._opt;
    if (o.prefix || o.postfix || o.icon) {
      const pfx = wfRenderFix(o.prefix), sfx = wfRenderFix(o.postfix);
      const iconHTML = o.icon ? `<i class="bi bi-${o.icon}" style="margin-right:4px"></i>` : '';
      if (!this._styledContent) {
        this._styledContent = this.innerHTML;
        this.innerHTML = iconHTML + pfx + this._styledContent + sfx;
        this._originalContent = this.innerHTML;
      }
    }
  }
  _attachEvents() {
    const o = this._opt;
    if (o.hoverTrigger && o.mode === 'tooltip') {
      this.addEventListener('mouseenter', () => this._handleShow());
      this.addEventListener('mouseleave', () => { if (this._closeFloat) this._closeFloat(); });
    } else {
      this.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._opt.mode === 'inline') { this._handleFlip(); }
        else {
          if (this._open && this._opt.toggle) { if (this._closeFloat) this._closeFloat(); }
          else { wfCloseAll(this); this._handleShow(); }
        }
      });
    }
  }
  _handleFlip() {
    if (this.classList.contains('wf-animating')) return;
    const o = this._opt;
    if (!o.contentSource) { console.warn('word-flip: data-content is required'); return; }
    if (!this._flipped) {
      const variables = {};
      const configAttrs = ['data-content','data-color','data-auto-back','data-read-mark','data-read-mark-color','data-read-mark-size','data-read-mark-icon'];
      Array.from(this.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') && !configAttrs.includes(attr.name))
          variables[attr.name.substring(5)] = attr.value;
      });
      const content = getContentFromSource(o.contentSource, variables);
      this._flipToBack(content);
    } else { this._flipToFront(); }
  }
  _flipToBack(content) {
    this.classList.add('wf-animating'); this.style.opacity = '0'; this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.innerHTML = content; this.classList.add('wf-flipped'); this._flipped = true;
      reinitializeEmbeddedComponents(this);
      setTimeout(() => {
        this.style.opacity = '1'; this.style.transform = 'scale(1)';
        this.classList.remove('wf-animating'); this._markAsRead();
        const autoBack = this._opt.autoFlipBack;
        if (autoBack > 0) this._flipTimeout = setTimeout(() => this._flipToFront(), autoBack * 1000);
      }, 50);
    }, 250);
  }
  _flipToFront() {
    if (this._flipTimeout) { clearTimeout(this._flipTimeout); this._flipTimeout = null; }
    this.classList.add('wf-animating'); this.style.opacity = '0'; this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.innerHTML = this._originalContent; this.classList.remove('wf-flipped'); this._flipped = false;
      setTimeout(() => { this.style.opacity = '1'; this.style.transform = 'scale(1)'; this.classList.remove('wf-animating'); }, 50);
    }, 250);
  }
  _handleShow() {
    const o = this._opt;
    const contentHTML = getContentFromSource(o.contentSource);
    if (!contentHTML) return;
    this._open = true; this.classList.add('wf-active');
    const color = wfResolveColor(o.color) || '#C3A5E5';
    const registerClose = (domFn) => {
      const closeFn = () => { domFn(); this._open = false; this.classList.remove('wf-active'); this._closeFloat = null; wfActiveFloats.delete(this); };
      this._closeFloat = closeFn; wfActiveFloats.set(this, closeFn);
    };
    switch (o.mode) {
      case 'tooltip': this._showTooltip(o, color, contentHTML, registerClose); break;
      case 'modal':   this._showModal  (o, color, contentHTML, registerClose); break;
      case 'drawer':  this._showDrawer (o, color, contentHTML, registerClose); break;
      default:        this._showPopover(o, color, contentHTML, registerClose); break;
    }
    this._markAsRead();
  }
  _showTooltip(o, color, contentHTML, registerClose) {
    const box = document.createElement('div');
    box.className = 'wf-tooltip-box'; box.style.setProperty('--wf-float-color', color);
    box.innerHTML = contentHTML;
    if (o.boxWidth)  { box.style.width = o.boxWidth; box.style.maxWidth = o.boxWidth; }
    if (o.boxHeight) { box.style.maxHeight = o.boxHeight; box.style.overflowY = 'auto'; }
    applyFontSizes(null, box, o.titleFontsize, o.bodyFontsize);
    document.body.appendChild(box);
    requestAnimationFrame(() => { wfPositionFloat(box, this, 6); box.classList.add('wf-show'); });
    const outside = (e) => { if (!box.contains(e.target) && e.target !== this) this._closeFloat?.(); };
    setTimeout(() => document.addEventListener('click', outside), 0);
    registerClose(() => { box.classList.remove('wf-show'); document.removeEventListener('click', outside); setTimeout(() => box.remove(), 220); });
    const rePos = () => wfPositionFloat(box, this, 6);
    window.addEventListener('resize', rePos, { once: true });
    window.addEventListener('scroll', rePos, { passive: true, once: true });
  }
  _showPopover(o, color, contentHTML, registerClose) {
    const box = document.createElement('div');
    box.className = 'wf-popover-box'; box.style.setProperty('--wf-float-color', color);
    const titleText = o.title || this.textContent.trim().slice(0, 30);
    box.innerHTML = `
      <div class="wf-popover-header">
        <span class="wf-popover-title">${titleText}</span>
        <button class="wf-popover-close" title="關閉">✕</button>
      </div>
      <div class="wf-popover-body">${contentHTML}</div>
    `;
    if (o.boxWidth) { box.style.width = o.boxWidth; box.style.maxWidth = o.boxWidth; }
    if (o.boxHeight) { const body = box.querySelector('.wf-popover-body'); body.style.maxHeight = o.boxHeight; body.style.overflowY = 'auto'; }
    applyFontSizes(box.querySelector('.wf-popover-title'), box.querySelector('.wf-popover-body'), o.titleFontsize, o.bodyFontsize);
    document.body.appendChild(box);
    requestAnimationFrame(() => { wfPositionFloat(box, this, 10); box.classList.add('wf-show'); });
    const outside = (e) => { if (!box.contains(e.target) && e.target !== this) this._closeFloat?.(); };
    setTimeout(() => document.addEventListener('click', outside), 0);
    registerClose(() => { box.classList.remove('wf-show'); document.removeEventListener('click', outside); setTimeout(() => box.remove(), 260); });
    box.querySelector('.wf-popover-close').addEventListener('click', (e) => { e.stopPropagation(); this._closeFloat?.(); });
  }
  _showModal(o, color, contentHTML, registerClose) {
    const overlay = document.createElement('div');
    overlay.className = 'wf-modal-overlay'; overlay.style.setProperty('--wf-float-color', color);
    const titleText = o.title || this.textContent.trim().slice(0, 40);
    const titleIcon = o.icon ? `<i class="bi bi-${o.icon}"></i>` : '';
    overlay.innerHTML = `
      <div class="wf-modal-box">
        <div class="wf-modal-header">
          <div class="wf-modal-title">${titleIcon}${titleText}</div>
          <button class="wf-modal-close" title="關閉（ESC）">✕</button>
        </div>
        <div class="wf-modal-body">${contentHTML}</div>
        <div class="wf-esc-hint">按 ESC 或點擊遮罩關閉</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const modalBox = overlay.querySelector('.wf-modal-box');
    if (o.boxWidth)  { modalBox.style.width = o.boxWidth; modalBox.style.maxWidth = o.boxWidth; }
    if (o.boxHeight) { modalBox.style.maxHeight = o.boxHeight; }
    applyFontSizes(overlay.querySelector('.wf-modal-title'), overlay.querySelector('.wf-modal-body'), o.titleFontsize, o.bodyFontsize);
    document.body.style.overflow = 'hidden';
    void overlay.offsetHeight; overlay.classList.add('wf-show');
    const keydown = (e) => { if (e.key === 'Escape') this._closeFloat?.(); };
    document.addEventListener('keydown', keydown);
    registerClose(() => { overlay.classList.remove('wf-show'); document.removeEventListener('keydown', keydown); document.body.style.overflow = ''; setTimeout(() => overlay.remove(), 300); });
    overlay.querySelector('.wf-modal-close').addEventListener('click', () => this._closeFloat?.());
    if (o.closeOnOverlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closeFloat?.(); });
  }
  _showDrawer(o, color, contentHTML, registerClose) {
    const overlay = document.createElement('div');
    overlay.className = 'wf-drawer-overlay'; overlay.style.setProperty('--wf-float-color', color);
    const panel = document.createElement('div');
    panel.className = 'wf-drawer-panel'; panel.style.setProperty('--wf-float-color', color);
    const titleText = o.title || this.textContent.trim().slice(0, 40);
    const titleIcon = o.icon ? `<i class="bi bi-${o.icon}"></i>` : '';
    panel.innerHTML = `
      <div class="wf-drawer-header">
        <div class="wf-drawer-title">${titleIcon}${titleText}</div>
        <button class="wf-drawer-close" title="關閉">✕</button>
      </div>
      <div class="wf-drawer-body">${contentHTML}</div>
      <div class="wf-esc-hint">按 ESC 關閉</div>
    `;
    document.body.appendChild(overlay); document.body.appendChild(panel);
    if (o.boxWidth) { panel.style.width = o.boxWidth; panel.style.maxWidth = o.boxWidth; }
    applyFontSizes(panel.querySelector('.wf-drawer-title'), panel.querySelector('.wf-drawer-body'), o.titleFontsize, o.bodyFontsize);
    document.body.style.overflow = 'hidden';
    void overlay.offsetHeight; void panel.offsetHeight;
    overlay.classList.add('wf-show'); panel.classList.add('wf-show');
    const keydown = (e) => { if (e.key === 'Escape') this._closeFloat?.(); };
    document.addEventListener('keydown', keydown);
    registerClose(() => { overlay.classList.remove('wf-show'); panel.classList.remove('wf-show'); document.removeEventListener('keydown', keydown); document.body.style.overflow = ''; setTimeout(() => { overlay.remove(); panel.remove(); }, 340); });
    panel.querySelector('.wf-drawer-close').addEventListener('click', () => this._closeFloat?.());
    if (o.closeOnOverlay) overlay.addEventListener('click', () => this._closeFloat?.());
  }
  _markAsRead() {
    const readMark = this.getAttribute('data-read-mark');
    if (readMark && readMark !== 'none') { this.classList.add('wf-read'); setTimeout(() => { this.classList.add('wf-show-mark'); }, 300); }
  }
  _applyBootstrapIcon(iconClass) {
    const iconMap = { 'bi-check-circle-fill':'\uf26b','bi-check-circle':'\uf26a','bi-check2-circle':'\uf272','bi-check':'\uf26d','bi-star-fill':'\uf586','bi-star':'\uf588','bi-bookmark-fill':'\uf26f','bi-bookmark':'\uf26e','bi-heart-fill':'\uf417','bi-heart':'\uf416','bi-lightbulb-fill':'\uf4a3','bi-lightbulb':'\uf4a2','bi-patch-check-fill':'\uf4f3','bi-patch-check':'\uf4f2' };
    this.setAttribute('data-read-mark-icon-content', iconMap[iconClass] || '\uf26b');
  }
  disconnectedCallback() { if (this._flipTimeout) clearTimeout(this._flipTimeout); if (this._closeFloat) this._closeFloat(); }
}

class WordTrigger extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return; this._initialized = true;
    this._applyConfig(); this.addEventListener('click', () => this._handleTrigger());
  }
  _applyConfig() {
    if (!this.hasAttribute('data-color')) this.setAttribute('data-color', WF_CONFIG.defaultColor);
    const readMark      = this.getAttribute('data-read-mark')       || WF_CONFIG.readMark;
    const readMarkColor = this.getAttribute('data-read-mark-color') || WF_CONFIG.readMarkColor;
    const readMarkSize  = this.getAttribute('data-read-mark-size')  || WF_CONFIG.readMarkSize;
    if (readMark !== 'none') { this.setAttribute('data-read-mark', readMark); this.setAttribute('data-read-mark-color', readMarkColor); this.style.setProperty('--wf-read-size', readMarkSize + 'px'); }
  }
  _handleTrigger() {
    const targetId = this.getAttribute('for');
    if (!targetId) { console.warn('word-trigger: "for" attribute is required'); return; }
    const target = document.getElementById(targetId);
    if (!target) { console.warn(`word-trigger: target "${targetId}" not found`); return; }
    if (target._flipToBack) { target._flipToBack(); this.classList.add('wf-active'); this._markAsRead(); }
  }
  _markAsRead() {
    const readMark = this.getAttribute('data-read-mark');
    if (readMark && readMark !== 'none') { this.classList.add('wf-read'); setTimeout(() => { this.classList.add('wf-show-mark'); }, 300); }
  }
}

class FlipCard extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return; this._initialized = true;
    this._flipped = false; this._flipTimeout = null; this._cardInner = null;
    this._applyConfig(); this._wrapContent();
    if (this.hasAttribute('data-click-to-flip')) {
      this.style.cursor = 'pointer';
      this.addEventListener('click', () => { this._flipped ? this._flipToFront() : this._flipToBack(); });
    }
  }
  _applyConfig() {
    if (!this.hasAttribute('data-color')) this.setAttribute('data-color', WF_CONFIG.defaultColor);
    const borderStyle = this.getAttribute('data-border-style') || WF_CONFIG.borderStyle;
    const borderWidth = this.getAttribute('data-border-width') || WF_CONFIG.borderWidth;
    const barWidth    = this.getAttribute('data-bar-width')    || WF_CONFIG.barWidth;
    if (borderStyle !== 'solid') this.setAttribute('data-border-style', borderStyle);
    this.style.setProperty('--wf-border-width', borderWidth + 'px');
    this.style.setProperty('--wf-bar-width',    barWidth    + 'px');
  }
  _wrapContent() {
    if (this.querySelector('.wf-card-inner')) return;
    const inner = document.createElement('div'); inner.className = 'wf-card-inner';
    while (this.firstChild) inner.appendChild(this.firstChild);
    this.appendChild(inner); this._cardInner = inner;
    reinitializeEmbeddedComponents(this);
  }
  _flipToBack() {
    if (this._flipped) return; this.classList.add('wf-flipped'); this._flipped = true;
    this.dispatchEvent(new CustomEvent('wf:flip-to-back', { bubbles: true }));
    const autoBack = parseInt(this.getAttribute('data-auto-back')) || WF_CONFIG.autoFlipBack;
    if (autoBack > 0) this._flipTimeout = setTimeout(() => this._flipToFront(), autoBack * 1000);
  }
  _flipToFront() {
    if (!this._flipped) return;
    if (this._flipTimeout) { clearTimeout(this._flipTimeout); this._flipTimeout = null; }
    this.classList.remove('wf-flipped'); this._flipped = false;
    document.querySelectorAll(`word-trigger[for="${this.id}"]`).forEach(t => t.classList.remove('wf-active'));
    this.dispatchEvent(new CustomEvent('wf:flip-to-front', { bubbles: true }));
  }
  disconnectedCallback() { if (this._flipTimeout) clearTimeout(this._flipTimeout); }
}

class FlipCards extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return; this._initialized = true;
    if (this.hasAttribute('data-show-controls')) {
      const controls = document.createElement('div');
      controls.className = 'wf-controls';
      controls.style.cssText = 'margin-bottom:16px;display:flex;gap:12px;';
      const btn = document.createElement('button');
      btn.textContent = '全部翻回';
      btn.style.cssText = 'padding:8px 16px;background:var(--color-surface,#333);color:var(--color-shell,#c6c7bd);border:1px solid var(--color-shell,#c6c7bd);border-radius:6px;cursor:pointer;';
      btn.addEventListener('click', () => this.querySelectorAll('flip-card').forEach(c => c._flipToFront?.()));
      controls.appendChild(btn); this.insertBefore(controls, this.firstChild);
    }
  }
}

class CardFront extends HTMLElement { connectedCallback() { if (!this._initialized) { this._initialized = true; reinitializeEmbeddedComponents(this); } } }
class CardBack  extends HTMLElement { connectedCallback() { if (!this._initialized) { this._initialized = true; reinitializeEmbeddedComponents(this); } } }

class WordFlipConfig extends HTMLElement {
  constructor() { super(); this._processConfig(); }
  connectedCallback() { this._processConfig(); this.style.display = 'none'; }
  _processConfig() {
    const attrs = {
      'default-color':'defaultColor','default-animation':'defaultAnimation','auto-flip-back':'autoFlipBack',
      'focus-mode':'focusMode','read-mark':'readMark','read-mark-color':'readMarkColor',
      'read-mark-size':'readMarkSize','read-mark-position':'readMarkPosition','read-mark-icon':'readMarkIcon',
      'border-style':'borderStyle','border-width':'borderWidth','bar-width':'barWidth',
      'mode':'mode','trigger-style':'triggerStyle','hover':'hoverTrigger','toggle':'toggle',
      'close-on-overlay':'closeOnOverlay','title':'title','prefix':'prefix','postfix':'postfix',
      'icon':'icon','box-width':'boxWidth','box-height':'boxHeight',
      'title-fontsize':'titleFontsize','body-fontsize':'bodyFontsize',
    };
    for (const [attr, key] of Object.entries(attrs)) {
      if (this.hasAttribute(attr)) {
        const val = this.getAttribute(attr);
        if (['focusMode','hoverTrigger','toggle','closeOnOverlay'].includes(key)) WF_CONFIG[key] = val !== 'false';
        else if (['autoFlipBack','readMarkSize','borderWidth','barWidth'].includes(key)) WF_CONFIG[key] = parseInt(val) || WF_DEFAULT_CONFIG[key];
        else WF_CONFIG[key] = val;
      }
    }
  }
}

[
  ['dual-cell',         DualCellElement],
  ['dual-group',        DualGroupElement],
  ['dual-row',          DualRowElement],
  ['dual-col',          DualColElement],
  ['dual-slot',         DualSlotElement],
  ['dual-item',         DualItemElement],
  ['word-flip-config',  WordFlipConfig],
  ['word-flip',         WordFlip],
  ['word-trigger',      WordTrigger],
  ['flip-card',         FlipCard],
  ['flip-cards',        FlipCards],
  ['card-front',        CardFront],
  ['card-back',         CardBack],
].forEach(([name, cls]) => {
  if (!customElements.get(name)) customElements.define(name, cls);
});

function processExistingConfigs() {
  document.querySelectorAll('word-flip-config').forEach(c => c._processConfig?.());
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processExistingConfigs);
} else {
  processExistingConfigs();
}

window.WordFlip = {
  config    : (options) => { Object.assign(WF_CONFIG, options); },
  getConfig : ()        => ({ ...WF_CONFIG }),
  resetConfig: ()       => { WF_CONFIG = { ...WF_DEFAULT_CONFIG }; },
  closeAll  : ()        => { wfCloseAll(null); },
  flipAll   : (front = true) => {
    document.querySelectorAll('flip-card').forEach(card => {
      if (front) card._flipToFront?.(); else card._flipToBack?.();
    });
  },
};

console.log('[bp-tools] BrandColors / DualCell / InfoRegion / WordFlip loaded.');
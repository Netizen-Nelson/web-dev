/*!
 * WeekCal v2.0.0
 * Week-strip calendar · click-to-inject content from source divs into a target div
 * No dependencies · CSS embedded · No shadow DOM · Global config system
 *
 * ── v2.0 新增：自訂元素 <week-cal> ─────────────────────────────────────────
 *
 *  宣告式用法：
 *    <week-cal theme="safe" locale="zh-TW" start-date="today" target="#board">
 *      <wc-day date="today"      source-id="d1" label="今天"></wc-day>
 *      <wc-day date="tomorrow"   source-id="d2"></wc-day>
 *      <wc-day date="2025-09-20" source-id="d3" disabled></wc-day>
 *    </week-cal>
 *
 *  <week-cal> 屬性（均可省略，省略時套用全域預設值）：
 *    theme           — dark|light|teal|ocean|indigo|warm|safe|sky|lavender|
 *                      salmon|special|pink|yellow（或自訂主題名）
 *    locale          — zh-TW | zh-CN | en
 *    start-date      — 任何接受的日期格式
 *    end-date        — 任何接受的日期格式
 *    width           — CSS 寬度（預設 100%）
 *    show-header     — 布林屬性，省略時套用預設值 true
 *    highlight-today — 布林屬性
 *    default-first   — 布林屬性
 *    animation       — fade | slide | none
 *    mode            — default | icon
 *    target          — 內容注入目標的 CSS 選擇器
 *    days            — JSON 陣列，替代 <wc-day> 子元素
 *
 *  <wc-day> 屬性：
 *    date      — 日期（必填），任何接受的格式
 *    source-id — 要注入的來源 div id
 *    label     — 覆蓋星期名稱（default 模式）或標籤文字（icon 模式）
 *    icon      — Bootstrap Icons 名稱（icon 模式）
 *    disabled  — 布林屬性，使儲存格不可互動
 *
 *  <week-cal> 事件：
 *    wc-select — CustomEvent，會冒泡，detail: { date, sourceId }
 *
 *  元素方法：
 *    el.select('YYYY-MM-DD') — 程式化選取日期
 *    el.getConfig()          — 檢視目前設定
 *    el.refresh()            — 重新掃描 <wc-day> 子元素並重新掛載
 *    el.destroy()            — 移除元件（元素本身留在 DOM 中）
 *
 * ── 接受的日期格式（startDate / endDate / days[].date）───────────────────────
 *   'YYYY-MM-DD' · 'today' · 'tomorrow' · 'yesterday'
 *   'next Monday' / 'last Sunday'（支援 3 字母縮寫，不區分大小寫）
 *
 * ── 顯示模式 ─────────────────────────────────────────────────────────────────
 *   mode: 'default'  星期名稱 + 日期數字圓圈（預設）
 *   mode: 'icon'     Bootstrap Icon + 標籤文字（首次使用時自動注入 CDN）
 *
 * ── 命令式 API（v1 完整保留）────────────────────────────────────────────────
 *   WeekCal.themes             讀取 / 擴充主題調色盤登錄
 *   WeekCal.configure(opts)    覆蓋全域預設值
 *   WeekCal.init(opts)         掛載實例
 *   WeekCal.select(sel, date)  程式化選取
 *   WeekCal.destroy(sel)       移除並還原來源 div
 *   WeekCal.getConfig(sel)     檢視目前設定
 */
((G, D) => {
  'use strict';

  const STYLE_ID = '__weekcal_v2__';

  // ── 地區語系資料 ────────────────────────────────────────────────────────────
  const LOCALE = {
    'zh-TW': {
      dow: ['周日','周一','周二','周三','周四','周五','周六'],
      ym:  (y, m) => `${y}年${m + 1}月`,
    },
    'zh-CN': {
      dow: ['周日','周一','周二','周三','周四','周五','周六'],
      ym:  (y, m) => `${y}年${m + 1}月`,
    },
    'en': {
      dow: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      ym:  (y, m) => ['January','February','March','April','May','June',
        'July','August','September','October','November','December'][m] + ' ' + y,
    },
  };

  // ── 星期名稱對照表（用於 next / last 解析）─────────────────────────────────
  const DOW_MAP = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
  };

  // ── 主題調色盤登錄 ──────────────────────────────────────────────────────────
  // 內建主題（品牌色盤）：
  //   dark    — 預設，warning / lavender / ocean 強調色，底色 #0C0D0C
  //   light   — 淺色背景，深紫選取色
  //   teal    — teal 今日，indigo 選取，sky 指示點
  //   ocean   — ocean 今日，lavender 選取，teal 指示點
  //   indigo  — indigo 今日，sky 選取，lavender 指示點
  //   warm    — orange 今日，salmon 選取，yellow 指示點
  //   safe    — safe 今日，vanilla 選取，special 指示點（v2.0 新增）
  //   sky     — sky 今日，lavender 選取，ocean 指示點（v2.0 新增）
  //   lavender— lavender 今日，indigo 選取，pink 指示點（v2.0 新增）
  //   salmon  — salmon 今日，orange 選取，yellow 指示點（v2.0 新增）
  //   special — special 今日，safe 選取，vanilla 指示點（v2.0 新增）
  //   pink    — pink 今日，lavender 選取，warning 指示點（v2.0 新增）
  //   yellow  — yellow 今日，orange 選取，special 指示點（v2.0 新增）
  // 使用方式：WeekCal.themes.myBrand = { calBg:'…', … }
  const THEMES = {
    // ── dark（預設）──────────────────────────────────────────────────────
    dark: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#E6374B',
      todayBg:      '#E6374B',
      todayText:    '#ffffff',
      selectedBg:   '#C3A5E5',
      selectedText: '#0C0D0C',
      indicator:    '#1CCAE8',
      cellHover:    'rgba(198,199,189,0.09)',
      headerText:   '#C6C7BD',
    },
    // ── light ─────────────────────────────────────────────────────────────
    light: {
      calBg:        '#F4F4F1',
      shell:        '#1A1B1A',
      dayNameColor: 'rgba(26,27,26,0.76)',
      todayDayName: '#E6374B',
      todayBg:      '#E6374B',
      todayText:    '#ffffff',
      selectedBg:   '#9B6FD4',
      selectedText: '#ffffff',
      indicator:    '#0DA591',
      cellHover:    'rgba(26,27,26,0.07)',
      headerText:   '#1A1B1A',
    },
    // ── teal ──────────────────────────────────────────────────────────────
    teal: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#0DA591',
      todayBg:      '#0DA591',
      todayText:    '#0C0D0C',
      selectedBg:   '#7849C9',
      selectedText: '#ffffff',
      indicator:    '#82C8E5',
      cellHover:    'rgba(13,165,145,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── ocean ─────────────────────────────────────────────────────────────
    ocean: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#1CCAE8',
      todayBg:      '#1CCAE8',
      todayText:    '#0C0D0C',
      selectedBg:   '#C3A5E5',
      selectedText: '#0C0D0C',
      indicator:    '#0DA591',
      cellHover:    'rgba(28,202,232,0.10)',
      headerText:   '#C6C7BD',
    },
    // ── indigo ────────────────────────────────────────────────────────────
    indigo: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#C3A5E5',
      todayBg:      '#7849C9',
      todayText:    '#ffffff',
      selectedBg:   '#82C8E5',
      selectedText: '#0C0D0C',
      indicator:    '#C3A5E5',
      cellHover:    'rgba(120,73,201,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── warm ──────────────────────────────────────────────────────────────
    warm: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#EDA109',
      todayBg:      '#EDA109',
      todayText:    '#0C0D0C',
      selectedBg:   '#E5C3B3',
      selectedText: '#0C0D0C',
      indicator:    '#E3D322',
      cellHover:    'rgba(237,161,9,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── safe（v2.0 新增）─────────────────────────────────────────────────
    safe: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#27AE60',
      todayBg:      '#27AE60',
      todayText:    '#ffffff',
      selectedBg:   '#DBEDD8',
      selectedText: '#0C0D0C',
      indicator:    '#B3DE73',
      cellHover:    'rgba(39,174,96,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── sky（v2.0 新增）──────────────────────────────────────────────────
    sky: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#82C8E5',
      todayBg:      '#82C8E5',
      todayText:    '#0C0D0C',
      selectedBg:   '#C3A5E5',
      selectedText: '#0C0D0C',
      indicator:    '#1CCAE8',
      cellHover:    'rgba(130,200,229,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── lavender（v2.0 新增）─────────────────────────────────────────────
    lavender: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#C3A5E5',
      todayBg:      '#C3A5E5',
      todayText:    '#0C0D0C',
      selectedBg:   '#7849C9',
      selectedText: '#ffffff',
      indicator:    '#FF91D7',
      cellHover:    'rgba(195,165,229,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── salmon（v2.0 新增）───────────────────────────────────────────────
    salmon: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#E5C3B3',
      todayBg:      '#E5C3B3',
      todayText:    '#0C0D0C',
      selectedBg:   '#EDA109',
      selectedText: '#0C0D0C',
      indicator:    '#E3D322',
      cellHover:    'rgba(229,195,179,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── special（v2.0 新增）──────────────────────────────────────────────
    special: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#B3DE73',
      todayBg:      '#B3DE73',
      todayText:    '#0C0D0C',
      selectedBg:   '#27AE60',
      selectedText: '#ffffff',
      indicator:    '#DBEDD8',
      cellHover:    'rgba(179,222,115,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── pink（v2.0 新增）─────────────────────────────────────────────────
    pink: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#FF91D7',
      todayBg:      '#FF91D7',
      todayText:    '#0C0D0C',
      selectedBg:   '#C3A5E5',
      selectedText: '#0C0D0C',
      indicator:    '#E6374B',
      cellHover:    'rgba(255,145,215,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── yellow（v2.0 新增）───────────────────────────────────────────────
    yellow: {
      calBg:        '#0C0D0C',
      shell:        '#C6C7BD',
      dayNameColor: 'rgba(198,199,189,0.76)',
      todayDayName: '#E3D322',
      todayBg:      '#E3D322',
      todayText:    '#0C0D0C',
      selectedBg:   '#EDA109',
      selectedText: '#0C0D0C',
      indicator:    '#B3DE73',
      cellHover:    'rgba(227,211,34,0.12)',
      headerText:   '#C6C7BD',
    },
    // ── aurora（漸層主題，v2.0 新增）────────────────────────────────────
    // CSS 自訂屬性可直接接受 gradient 字串，以下欄位皆對應 background: var(--wc-*)
    // 規則：
    //   calBg      → .wc-shell { background }      殼層底色，用漸層打底
    //   todayBg    → .wc-cell.wc-today .wc-nw      今日圓圈，lavender→indigo 漸層
    //   selectedBg → .wc-cell.wc-sel .wc-nw        選取圓圈，teal→ocean 漸層
    //   cellHover  → .wc-cell.wc-go:hover          游標懸停，半透明 lavender
    //   icon mode  → .wc-cell.wc-im.wc-today /
    //                .wc-cell.wc-im.wc-sel         整格背景，同樣吃漸層
    aurora: {
      calBg:        'linear-gradient(160deg, #0C0D1E 0%, #0D1525 60%, #091420 100%)',
      shell:        '#D4F0FF',
      dayNameColor: 'rgba(212,240,255,0.76)',
      todayDayName: '#FF91D7',
      todayBg:      'linear-gradient(135deg, #C3A5E5 0%, #7849C9 100%)',
      todayText:    '#ffffff',
      selectedBg:   'linear-gradient(135deg, #0DA591 0%, #1CCAE8 100%)',
      selectedText: '#0C0D0C',
      indicator:    '#FF91D7',
      cellHover:    'rgba(195,165,229,0.14)',
      headerText:   '#D4F0FF',
    },
  };

  // ── 全域預設值 ──────────────────────────────────────────────────────────────
  const DEF = {
    container:      null,
    target:         null,
    startDate:      'today',
    endDate:        null,
    locale:         'zh-TW',
    width:          '100%',
    showHeader:     true,
    highlightToday: true,
    defaultFirst:   true,
    animation:      'fade',
    theme:          'dark',
    mode:           'default',
    days:           [],
    colors:         {},
    onSelect:       null,
  };

  // ── 工具函式 ────────────────────────────────────────────────────────────────
  const pad    = n => String(n).padStart(2, '0');
  const toISO  = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nowISO = () => toISO(new Date());

  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  /**
   * 將彈性日期字串解析為本地 Date 物件。
   * 不區分大小寫。無法辨識時回傳 null（並輸出 console.warn）。
   */
  function parseSmartDate(s) {
    if (!s) return new Date();
    const str = String(s).trim().toLowerCase();

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, dd] = str.split('-').map(Number);
      return new Date(y, m - 1, dd);
    }

    if (str === 'today')     return new Date();
    if (str === 'tomorrow')  return addDays(new Date(), 1);
    if (str === 'yesterday') return addDays(new Date(), -1);

    const nextM = str.match(/^next\s+(\w+)$/);
    if (nextM) {
      const target = DOW_MAP[nextM[1]];
      if (target !== undefined) {
        let d = addDays(new Date(), 1);
        while (d.getDay() !== target) d = addDays(d, 1);
        return d;
      }
    }

    const lastM = str.match(/^last\s+(\w+)$/);
    if (lastM) {
      const target = DOW_MAP[lastM[1]];
      if (target !== undefined) {
        let d = addDays(new Date(), -1);
        while (d.getDay() !== target) d = addDays(d, -1);
        return d;
      }
    }

    console.warn('[WeekCal] 無法辨識的日期字串:', s);
    return null;
  }

  const mk = (tag, cls) => {
    const e = D.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };

  const resolve = s => typeof s === 'string' ? D.querySelector(s) : s;

  // 判斷一個值是否應「直接賦值」而非遞迴展開：
  //   - 陣列
  //   - DOM 節點（HTMLElement、Element 等）— 核心修正：
  //     傳入 container: this（WeekCalElement）時，若遞迴展開會把 HTMLElement
  //     攤平為普通 {}，導致 cEl.appendChild is not a function。
  //   - 函式
  const _isLeaf = v =>
    v === null ||
    typeof v !== 'object' ||
    Array.isArray(v) ||
    typeof v.nodeType === 'number' ||   // DOM Node（Element、Text 等）
    typeof v === 'function';

  function merge(target, ...srcs) {
    srcs.forEach(src => {
      if (!src || typeof src !== 'object') return;
      Object.keys(src).forEach(k => {
        const v = src[k];
        if (v != null && !_isLeaf(v)) {
          if (!target[k] || typeof target[k] !== 'object') target[k] = {};
          merge(target[k], v);
        } else {
          target[k] = v;
        }
      });
    });
    return target;
  }

  // ── CSS（每頁只注入一次；顏色透過各實例的 CSS 變數傳入）────────────────────
  function ensureCSS() {
    if (D.getElementById(STYLE_ID)) return;
    const s = D.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
week-cal{display:block}
.wc-wrap{display:block;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif;box-sizing:border-box}
.wc-wrap *,.wc-wrap *::before,.wc-wrap *::after{box-sizing:inherit}
.wc-shell{background:var(--wc-bg);border-radius:16px;padding:14px 16px}
.wc-header{display:flex;align-items:center;margin-bottom:16px;min-height:22px}
.wc-mlabel{font-size:15px;font-weight:500;color:var(--wc-ht);line-height:1.4;letter-spacing:.01em}
.wc-grid{display:grid;gap:4px}
.wc-cell{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:default;
  padding:6px 2px 11px;border-radius:10px;transition:background .15s;position:relative;
  min-width:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.wc-cell.wc-go{cursor:pointer}
.wc-cell.wc-go:hover{background:var(--wc-ch)}
.wc-dn{font-size:11px;color:var(--wc-dn);white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis;width:100%;text-align:center;line-height:1.4}
.wc-cell.wc-today .wc-dn{color:var(--wc-tdn);font-weight:600}
.wc-nw{width:34px;height:34px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;transition:background .15s;flex-shrink:0}
.wc-n{font-size:14px;font-weight:500;color:var(--wc-sh);line-height:1;transition:color .15s}
.wc-cell.wc-today .wc-nw{background:var(--wc-tb)}
.wc-cell.wc-today .wc-n{color:var(--wc-tt);font-weight:700}
.wc-cell.wc-sel:not(.wc-today) .wc-nw{background:var(--wc-sb)}
.wc-cell.wc-sel:not(.wc-today) .wc-n{color:var(--wc-st);font-weight:700}
.wc-dot{width:5px;height:5px;border-radius:50%;background:var(--wc-ind);position:absolute;
  bottom:3px;left:50%;transform:translateX(-50%);opacity:0;transition:opacity .15s}
.wc-cell.wc-has .wc-dot{opacity:1}
.wc-cell.wc-dis{opacity:.35;pointer-events:none}
.wc-cell.wc-im{padding:8px 2px 12px;gap:6px}
.wc-ic{font-size:20px;line-height:1;color:var(--wc-sh);transition:color .15s;display:block;text-align:center}
.wc-cell.wc-im.wc-today{background:var(--wc-tb)}
.wc-cell.wc-im.wc-today .wc-ic,.wc-cell.wc-im.wc-today .wc-dn{color:var(--wc-tt)}
.wc-cell.wc-im.wc-sel:not(.wc-today){background:var(--wc-sb)}
.wc-cell.wc-im.wc-sel:not(.wc-today) .wc-ic,.wc-cell.wc-im.wc-sel:not(.wc-today) .wc-dn{color:var(--wc-st)}
.wc-cell.wc-im.wc-go:hover:not(.wc-today):not(.wc-sel){background:var(--wc-ch)}`.trim();
    D.head.appendChild(s);
  }

  // ── Bootstrap Icons CDN（只在 mode='icon' 時注入一次）──────────────────────
  const BI_LINK_ID = '__wc_bi__';
  const BI_CDN     = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css';

  function ensureBootstrapIcons() {
    if (D.getElementById(BI_LINK_ID)) return;
    const link  = D.createElement('link');
    link.id     = BI_LINK_ID;
    link.rel    = 'stylesheet';
    link.href   = BI_CDN;
    D.head.appendChild(link);
  }

  function bsIconClass(icon) {
    if (!icon) return 'bi';
    const raw  = String(icon).trim().replace(/^bi\s+/, '');
    const name = raw.startsWith('bi-') ? raw : 'bi-' + raw;
    return 'bi ' + name;
  }

  function applyVars(el, c) {
    [
      ['--wc-bg',  c.calBg       ],
      ['--wc-sh',  c.shell       ],
      ['--wc-dn',  c.dayNameColor],
      ['--wc-tdn', c.todayDayName],
      ['--wc-tb',  c.todayBg    ],
      ['--wc-tt',  c.todayText  ],
      ['--wc-sb',  c.selectedBg ],
      ['--wc-st',  c.selectedText],
      ['--wc-ind', c.indicator  ],
      ['--wc-ch',  c.cellHover  ],
      ['--wc-ht',  c.headerText ],
    ].forEach(([k, v]) => el.style.setProperty(k, v));
  }

  // ── DOM 建構 ─────────────────────────────────────────────────────────────────
  function buildDOM(cfg, days, today) {
    const loc  = LOCALE[cfg.locale] || LOCALE['zh-TW'];
    const wrap = mk('div', 'wc-wrap');
    wrap.style.width = cfg.width;
    applyVars(wrap, cfg.colors);

    const shell = mk('div', 'wc-shell');
    wrap.appendChild(shell);

    if (cfg.showHeader && days.length) {
      const d0  = parseSmartDate(days[0].date);
      const hdr = mk('div', 'wc-header');
      const lbl = mk('span', 'wc-mlabel');
      lbl.textContent = d0 ? loc.ym(d0.getFullYear(), d0.getMonth()) : '';
      hdr.appendChild(lbl);
      shell.appendChild(hdr);
    }

    const grid = mk('div', 'wc-grid');
    grid.style.gridTemplateColumns = `repeat(${days.length}, 1fr)`;
    shell.appendChild(grid);

    const iconMode = cfg.mode === 'icon';

    days.forEach(dc => {
      const d = parseSmartDate(dc.date);
      if (!d) return;

      const isToday = cfg.highlightToday && dc.date === today;
      const hasSrc  = !!dc.sourceId;
      const dis     = !!dc.disabled;

      const cell = mk('div', 'wc-cell');
      if (isToday)        cell.classList.add('wc-today');
      if (hasSrc && !dis) cell.classList.add('wc-go', 'wc-has');
      if (dis)            cell.classList.add('wc-dis');
      cell.dataset.date = dc.date;
      cell.dataset.src  = dc.sourceId || '';

      if (iconMode) {
        cell.classList.add('wc-im');
        const ic = mk('i', bsIconClass(dc.icon) + ' wc-ic');
        const dn = mk('div', 'wc-dn');
        dn.textContent = dc.label || '';
        cell.append(ic, dn, mk('div', 'wc-dot'));
      } else {
        const dn = mk('div', 'wc-dn');
        dn.textContent = dc.label || loc.dow[d.getDay()];
        const nw = mk('div', 'wc-nw');
        const n  = mk('span', 'wc-n');
        n.textContent = d.getDate();
        nw.appendChild(n);
        cell.append(dn, nw, mk('div', 'wc-dot'));
      }

      grid.appendChild(cell);
    });

    return { wrap, grid };
  }

  // ── 內容注入 ─────────────────────────────────────────────────────────────────
  function inject(tEl, srcId, anim) {
    if (!tEl || !srcId) return;
    const src = D.getElementById(srcId);
    if (!src) { console.warn('[WeekCal] sourceId 找不到:', srcId); return; }

    const clone = src.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.removeProperty('display');

    const put = () => { tEl.innerHTML = ''; tEl.appendChild(clone); };

    if (anim === 'fade') {
      tEl.style.transition = 'opacity .15s ease';
      tEl.style.opacity    = '0';
      setTimeout(() => { put(); tEl.style.opacity = '1'; }, 160);
    } else if (anim === 'slide') {
      tEl.style.transition = 'opacity .2s ease, transform .2s ease';
      tEl.style.opacity    = '0';
      tEl.style.transform  = 'translateY(10px)';
      setTimeout(() => {
        put();
        tEl.style.opacity   = '1';
        tEl.style.transform = 'translateY(0)';
      }, 210);
    } else {
      put();
    }
  }

  // ── 選取邏輯 ─────────────────────────────────────────────────────────────────
  function doSelect(inst, date) {
    inst.wrap.querySelectorAll('.wc-cell').forEach(c => c.classList.remove('wc-sel'));
    const cell = inst.wrap.querySelector(`.wc-cell[data-date="${date}"]`);
    if (!cell) return;
    cell.classList.add('wc-sel');

    const srcId = cell.dataset.src;
    if (srcId) inject(inst.targetEl, srcId, inst.cfg.animation);
    if (typeof inst.cfg.onSelect === 'function') inst.cfg.onSelect(date, srcId || null);
  }

  // ── 實例登錄 ─────────────────────────────────────────────────────────────────
  const _store = new Map();

  // ── 公開 API ─────────────────────────────────────────────────────────────────
  const WeekCal = {

    /**
     * 主題調色盤登錄。
     * 新增自訂主題：WeekCal.themes.myBrand = { calBg: '…', … }
     * 讀取色值：WeekCal.themes.safe.todayBg
     */
    themes: THEMES,

    /**
     * 在任何 init() 之前覆蓋全域預設值。
     * @param {object} overrides
     */
    configure(overrides) {
      merge(DEF, overrides);
      return this;
    },

    /**
     * 掛載 WeekCal 實例。
     *
     * 格線日期解析優先順序：
     *   1. startDate + endDate → 範圍（最多 7 格）
     *   2. 只有 days[]（無 startDate/endDate）→ 依日期排序，最多 7 格
     *   3. 都沒有 → 從今天起 7 天
     *
     * 顏色解析：THEMES[theme] ← colors{} 局部覆蓋
     *
     * @param {object} options
     */
    init(options = {}) {
      const cfg = merge({}, DEF, options);

      const base = THEMES[cfg.theme] || THEMES.dark;
      cfg.colors = Object.assign({}, base, options.colors || {});

      const cEl = resolve(cfg.container);
      if (!cEl) {
        console.error('[WeekCal] container 找不到:', cfg.container);
        return this;
      }
      const tEl = cfg.target ? resolve(cfg.target) : null;

      const lookup = {};
      (cfg.days || []).forEach(d => {
        const parsed = parseSmartDate(d.date);
        if (!parsed) return;
        const dt = toISO(parsed);
        lookup[dt] = { ...d, date: dt };
      });

      let gridDates = [];

      if (cfg.startDate || cfg.endDate) {
        const start = parseSmartDate(cfg.startDate || 'today');
        if (!start) { console.error('[WeekCal] startDate 無效:', cfg.startDate); return this; }
        const end = cfg.endDate ? parseSmartDate(cfg.endDate) : addDays(start, 6);
        if (!end)   { console.error('[WeekCal] endDate 無效:', cfg.endDate);   return this; }
        for (let cur = new Date(start); cur <= end && gridDates.length < 7; cur = addDays(cur, 1))
          gridDates.push(toISO(cur));
      } else if (cfg.days && cfg.days.length) {
        gridDates = Object.keys(lookup).sort().slice(0, 7);
      } else {
        for (let i = 0; i < 7; i++) gridDates.push(toISO(addDays(new Date(), i)));
      }

      const days = gridDates.map(date => ({
        date, sourceId: null, disabled: false, ...(lookup[date] || {}),
      }));

      days.forEach(dc => {
        if (dc.sourceId) {
          const s = D.getElementById(dc.sourceId);
          if (s) s.style.display = 'none';
        }
      });

      ensureCSS();
      if (cfg.mode === 'icon') ensureBootstrapIcons();

      const { wrap, grid } = buildDOM(cfg, days, nowISO());
      cEl.innerHTML = '';
      cEl.appendChild(wrap);

      let inst;
      grid.addEventListener('click', e => {
        const cell = e.target.closest('.wc-cell.wc-go');
        if (cell && inst) doSelect(inst, cell.dataset.date);
      });
      inst = { cfg, days, wrap, targetEl: tEl, cEl };
      _store.set(cEl, inst);

      if (cfg.defaultFirst) {
        const first = days.find(d => d.sourceId);
        if (first) setTimeout(() => doSelect(inst, first.date), 50);
      }

      return this;
    },

    /**
     * 程式化選取日期。
     * @param {string|Element} containerSel
     * @param {string} date  ISO 字串 'YYYY-MM-DD'
     */
    select(containerSel, date) {
      const inst = _store.get(resolve(containerSel));
      if (inst) doSelect(inst, date);
      return this;
    },

    /**
     * 移除實例並還原隱藏的來源 div。
     * @param {string|Element} containerSel
     */
    destroy(containerSel) {
      const cEl  = resolve(containerSel);
      const inst = _store.get(cEl);
      if (!inst) return this;
      inst.days.forEach(dc => {
        if (dc.sourceId) {
          const s = D.getElementById(dc.sourceId);
          if (s) s.style.display = '';
        }
      });
      cEl.innerHTML = '';
      _store.delete(cEl);
      return this;
    },

    /**
     * 回傳已掛載實例的目前設定物件。
     * @param {string|Element} containerSel
     */
    getConfig(containerSel) {
      const inst = _store.get(resolve(containerSel));
      return inst ? inst.cfg : null;
    },
  };

  G.WeekCal = WeekCal;

  // ── 自訂元素 <week-cal> ──────────────────────────────────────────────────────
  // 需要 Custom Elements v1（所有現代瀏覽器均支援）
  // 建議在 <script defer> 或 </body> 前載入，確保 <wc-day> 子元素已解析完畢。
  if (!G.customElements) return;

  class WeekCalElement extends HTMLElement {

    // 宣告哪些 HTML 屬性的變更會觸發 attributeChangedCallback
    static get observedAttributes() {
      return [
        'theme', 'locale', 'start-date', 'end-date',
        'width', 'show-header', 'highlight-today', 'default-first',
        'animation', 'mode', 'target', 'days',
      ];
    }

    // ── 生命週期回呼 ─────────────────────────────────────────────────────────

    connectedCallback() {
      // setTimeout(0) 確保 <wc-day> 子元素（在 head 載入時可能尚未解析）已就緒
      this._mountTimer = setTimeout(() => {
        this._cachedDays = this._parseChildDays();
        this._wcMount();
      }, 0);
    }

    disconnectedCallback() {
      clearTimeout(this._mountTimer);
      this._wcUnmount();
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      // 屬性變更時重新掛載（初次連接尚未完成時略過）
      if (this._wcMounted) {
        this._wcUnmount();
        this._wcMount();
      }
    }

    // ── 內部輔助方法 ─────────────────────────────────────────────────────────

    /** 解析 <wc-day> 子元素，轉換為 days[] 設定陣列 */
    _parseChildDays() {
      const days = [];
      this.querySelectorAll('wc-day').forEach(el => {
        const day = {};
        if (el.hasAttribute('date'))      day.date     = el.getAttribute('date');
        if (el.hasAttribute('source-id')) day.sourceId = el.getAttribute('source-id');
        if (el.hasAttribute('label'))     day.label    = el.getAttribute('label');
        if (el.hasAttribute('icon'))      day.icon     = el.getAttribute('icon');
        if (el.hasAttribute('disabled'))  day.disabled = true;
        if (day.date) days.push(day);
      });
      return days;
    }

    /**
     * 讀取布林屬性。
     * - 屬性不存在 → undefined（使用全域預設值）
     * - 屬性存在且值為 'false' 或 '0' → false
     * - 其他情況 → true
     */
    _boolAttr(name) {
      if (!this.hasAttribute(name)) return undefined;
      const v = this.getAttribute(name);
      return v !== 'false' && v !== '0';
    }

    /** 讀取字串屬性；不存在時回傳 undefined（使用全域預設值）*/
    _strAttr(name) {
      return this.hasAttribute(name) ? this.getAttribute(name) : undefined;
    }

    /**
     * 取得 days 設定陣列。
     * 優先順序：days 屬性（JSON）> _cachedDays（來自 <wc-day> 子元素）> []
     */
    _getDays() {
      const attr = this.getAttribute('days');
      if (attr) {
        try { return JSON.parse(attr); }
        catch (e) { console.warn('[WeekCal] <week-cal days="..."> JSON 格式錯誤', e); }
      }
      return this._cachedDays || [];
    }

    /** 將 HTML 屬性組合成 WeekCal.init() 的 options 物件 */
    _buildOptions() {
      const days = this._getDays();
      const opts = {
        container:      this,
        theme:          this._strAttr('theme'),
        locale:         this._strAttr('locale'),
        startDate:      this._strAttr('start-date'),
        endDate:        this._strAttr('end-date'),
        width:          this._strAttr('width'),
        showHeader:     this._boolAttr('show-header'),
        highlightToday: this._boolAttr('highlight-today'),
        defaultFirst:   this._boolAttr('default-first'),
        animation:      this._strAttr('animation'),
        mode:           this._strAttr('mode'),
        target:         this._strAttr('target'),
        days:           days.length ? days : undefined,
        // 選取事件轉為 CustomEvent 發派
        onSelect: (date, srcId) => {
          this.dispatchEvent(new CustomEvent('wc-select', {
            bubbles:    true,
            cancelable: false,
            detail:     { date, sourceId: srcId },
          }));
        },
      };
      // 移除 undefined 值，讓 WeekCal.init 的 DEF merge 正確生效
      Object.keys(opts).forEach(k => opts[k] === undefined && delete opts[k]);
      return opts;
    }

    _wcMount() {
      WeekCal.init(this._buildOptions());
      this._wcMounted = true;
    }

    _wcUnmount() {
      WeekCal.destroy(this);
      this._wcMounted = false;
    }

    // ── 公開元素方法（鏡射 WeekCal API）─────────────────────────────────────

    /**
     * 程式化選取日期。
     * @param {string} date  ISO 字串 'YYYY-MM-DD'
     * @returns {this}
     */
    select(date) {
      WeekCal.select(this, date);
      return this;
    }

    /**
     * 回傳目前實例的設定物件。
     * @returns {object|null}
     */
    getConfig() {
      return WeekCal.getConfig(this);
    }

    /**
     * 重新掃描 <wc-day> 子元素並重新掛載。
     * 動態新增 / 移除 <wc-day> 後呼叫。
     * @returns {this}
     */
    refresh() {
      this._cachedDays = this._parseChildDays();
      if (this._wcMounted) {
        this._wcUnmount();
        this._wcMount();
      }
      return this;
    }

    /**
     * 移除元件（<week-cal> 標籤本身留在 DOM 中）。
     * @returns {this}
     */
    destroy() {
      clearTimeout(this._mountTimer);
      this._wcUnmount();
      return this;
    }
  }

  G.customElements.define('week-cal', WeekCalElement);

})(window, document);

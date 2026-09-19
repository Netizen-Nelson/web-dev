/*!
 * WeekCal v1.2.0
 * Week-strip calendar · click-to-inject content from source divs into a target div
 * No dependencies · CSS embedded · No shadow DOM · Global config system
 *
 * ── Accepted date formats (startDate / endDate / days[].date) ───────────────
 *   'YYYY-MM-DD'      ISO string
 *   'today'           current date
 *   'tomorrow'        today + 1 day
 *   'yesterday'       today - 1 day
 *   'next Monday'     next occurrence of that weekday after today
 *   'last Sunday'     last occurrence of that weekday before today
 *   (3-letter abbreviations accepted: 'next Mon', 'last Sun' — case-insensitive)
 *
 * ── Display modes ────────────────────────────────────────────────────────────
 *   mode: 'default'   weekday name + date number circle  (default)
 *   mode: 'icon'      Bootstrap Icon + short label text
 *                     Bootstrap Icons CDN auto-injected on first icon-mode init
 *                     days[].icon  — icon name, e.g. 'bi-calendar' or 'calendar'
 *                     days[].label — text shown below the icon
 *
 * ── Public API ───────────────────────────────────────────────────────────────
 *   WeekCal.themes                        read / extend theme palette registry
 *   WeekCal.configure(overrides)          override global defaults
 *   WeekCal.init(options)                 mount instance
 *   WeekCal.select(containerSel, date)    programmatic selection (ISO string)
 *   WeekCal.destroy(containerSel)         tear down, restore source divs
 *   WeekCal.getConfig(containerSel)       inspect current config
 */
((G, D) => {
  'use strict';

  const STYLE_ID = '__weekcal_v1__';

  // ── Locale data ─────────────────────────────────────────────────────────────
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

  // ── Weekday name map (for next / last parsing) ───────────────────────────────
  const DOW_MAP = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
  };

  // ── Theme palette registry ───────────────────────────────────────────────────
  // Built-in themes (brand palette):
  //   'dark'   — default, warning/lavender/ocean accents on #0C0D0C
  //   'light'  — light background (#F4F4F1), deep-purple selected
  //   'teal'   — teal today, indigo selected, sky indicator
  //   'ocean'  — ocean today, lavender selected, teal indicator
  //   'indigo' — indigo today, sky selected, lavender indicator
  //   'warm'   — orange today, salmon selected, yellow indicator
  // Access via WeekCal.themes; add custom themes the same way:
  //   WeekCal.themes.myBrand = { calBg: '…', … }
  //   WeekCal.init({ theme: 'myBrand', … })
  const THEMES = {
    // ── dark (default) ──────────────────────────────────────────────
    dark: {
      calBg:        '#0C0D0C',             // 底層背景色
      shell:        '#C6C7BD',             // shell
      dayNameColor: 'rgba(198,199,189,0.60)',
      todayDayName: '#E6374B',             // warning
      todayBg:      '#E6374B',             // warning
      todayText:    '#ffffff',
      selectedBg:   '#C3A5E5',             // lavender
      selectedText: '#0C0D0C',
      indicator:    '#1CCAE8',             // ocean
      cellHover:    'rgba(198,199,189,0.09)',
      headerText:   '#C6C7BD',             // shell
    },
    // ── light ────────────────────────────────────────────────────────
    light: {
      calBg:        '#F4F4F1',
      shell:        '#1A1B1A',
      dayNameColor: 'rgba(26,27,26,0.50)',
      todayDayName: '#E6374B',             // warning
      todayBg:      '#E6374B',             // warning
      todayText:    '#ffffff',
      selectedBg:   '#9B6FD4',             // lavender, darkened for light bg
      selectedText: '#ffffff',
      indicator:    '#0DA591',             // teal
      cellHover:    'rgba(26,27,26,0.07)',
      headerText:   '#1A1B1A',
    },
    // ── teal ─────────────────────────────────────────────────────────
    teal: {
      calBg:        '#0C0D0C',             // 底層背景色
      shell:        '#C6C7BD',             // shell
      dayNameColor: 'rgba(198,199,189,0.60)',
      todayDayName: '#0DA591',             // teal
      todayBg:      '#0DA591',             // teal
      todayText:    '#0C0D0C',
      selectedBg:   '#7849C9',             // indigo
      selectedText: '#ffffff',
      indicator:    '#82C8E5',             // sky
      cellHover:    'rgba(13,165,145,0.12)',
      headerText:   '#C6C7BD',             // shell
    },
    // ── ocean ────────────────────────────────────────────────────────
    ocean: {
      calBg:        '#0C0D0C',             // 底層背景色
      shell:        '#C6C7BD',             // shell
      dayNameColor: 'rgba(198,199,189,0.60)',
      todayDayName: '#1CCAE8',             // ocean
      todayBg:      '#1CCAE8',             // ocean
      todayText:    '#0C0D0C',
      selectedBg:   '#C3A5E5',             // lavender
      selectedText: '#0C0D0C',
      indicator:    '#0DA591',             // teal
      cellHover:    'rgba(28,202,232,0.10)',
      headerText:   '#C6C7BD',             // shell
    },
    // ── indigo ───────────────────────────────────────────────────────
    indigo: {
      calBg:        '#0C0D0C',             // 底層背景色
      shell:        '#C6C7BD',             // shell
      dayNameColor: 'rgba(198,199,189,0.60)',
      todayDayName: '#C3A5E5',             // lavender
      todayBg:      '#7849C9',             // indigo
      todayText:    '#ffffff',
      selectedBg:   '#82C8E5',             // sky
      selectedText: '#0C0D0C',
      indicator:    '#C3A5E5',             // lavender
      cellHover:    'rgba(120,73,201,0.12)',
      headerText:   '#C6C7BD',             // shell
    },
    // ── warm ─────────────────────────────────────────────────────────
    warm: {
      calBg:        '#0C0D0C',             // 底層背景色
      shell:        '#C6C7BD',             // shell
      dayNameColor: 'rgba(198,199,189,0.60)',
      todayDayName: '#EDA109',             // orange
      todayBg:      '#EDA109',             // orange
      todayText:    '#0C0D0C',
      selectedBg:   '#E5C3B3',             // salmon
      selectedText: '#0C0D0C',
      indicator:    '#E3D322',             // yellow
      cellHover:    'rgba(237,161,9,0.12)',
      headerText:   '#C6C7BD',             // shell
    },
  };

  // ── Global defaults ──────────────────────────────────────────────────────────
  const DEF = {
    container:      null,       // CSS selector | Element  — where the widget mounts
    target:         null,       // CSS selector | Element  — where content is injected
    startDate:      'today',    // any accepted date format
    endDate:        null,       // any accepted date format (default = startDate + 6 days)
    locale:         'zh-TW',    // 'zh-TW' | 'zh-CN' | 'en'
    width:          '100%',     // any CSS width: '320px' | '90%' | '100%' …
    showHeader:     true,
    highlightToday: true,
    defaultFirst:   true,       // auto-click first day with content on mount
    animation:      'fade',     // 'fade' | 'slide' | 'none'
    theme:          'dark',     // key in WeekCal.themes — default: 'dark'
    mode:           'default',  // 'default' = weekday+date  |  'icon' = Bootstrap Icon+label
    days:           [],         // [{ date, sourceId?, icon?, label?, disabled? }]
                                //   icon  — Bootstrap Icons name, e.g. 'bi-calendar' or 'calendar'
                                //   label — in 'default' mode: overrides weekday name
                                //           in 'icon' mode: text shown below the icon
    colors:         {},         // partial overrides applied on top of the chosen theme
    onSelect:       null,       // (date: string, sourceId: string|null) => void
  };

  // ── Utilities ────────────────────────────────────────────────────────────────
  const pad    = n => String(n).padStart(2, '0');
  const toISO  = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nowISO = () => toISO(new Date());

  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  /**
   * Parse a flexible date string into a local Date object.
   * Case-insensitive. Returns null (with console.warn) on unrecognised input.
   *
   * Supported:
   *   YYYY-MM-DD · today · tomorrow · yesterday
   *   next <weekday>  (full name or 3-letter abbreviation)
   *   last <weekday>  (full name or 3-letter abbreviation)
   */
  function parseSmartDate(s) {
    if (!s) return new Date();
    const str = String(s).trim().toLowerCase();

    // ISO date — avoids UTC timezone shift by using local constructor
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, dd] = str.split('-').map(Number);
      return new Date(y, m - 1, dd);
    }

    if (str === 'today')     return new Date();
    if (str === 'tomorrow')  return addDays(new Date(), 1);
    if (str === 'yesterday') return addDays(new Date(), -1);

    // next <weekday> — first matching weekday strictly after today
    const nextM = str.match(/^next\s+(\w+)$/);
    if (nextM) {
      const target = DOW_MAP[nextM[1]];
      if (target !== undefined) {
        let d = addDays(new Date(), 1);               // start from tomorrow
        while (d.getDay() !== target) d = addDays(d, 1);
        return d;
      }
    }

    // last <weekday> — first matching weekday strictly before today
    const lastM = str.match(/^last\s+(\w+)$/);
    if (lastM) {
      const target = DOW_MAP[lastM[1]];
      if (target !== undefined) {
        let d = addDays(new Date(), -1);              // start from yesterday
        while (d.getDay() !== target) d = addDays(d, -1);
        return d;
      }
    }

    console.warn('[WeekCal] Unrecognised date string:', s);
    return null;
  }

  const mk = (tag, cls) => {
    const e = D.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };

  const resolve = s => typeof s === 'string' ? D.querySelector(s) : s;

  function merge(target, ...srcs) {
    srcs.forEach(src => {
      if (!src || typeof src !== 'object') return;
      Object.keys(src).forEach(k => {
        if (src[k] != null && typeof src[k] === 'object' && !Array.isArray(src[k])) {
          if (!target[k] || typeof target[k] !== 'object') target[k] = {};
          merge(target[k], src[k]);
        } else {
          target[k] = src[k];
        }
      });
    });
    return target;
  }

  // ── CSS (injected once per page; colours live in per-instance CSS vars) ──────
  function ensureCSS() {
    if (D.getElementById(STYLE_ID)) return;
    const s = D.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
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

  // ── Bootstrap Icons CDN (injected once, only when mode='icon' is used) ────────
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

  // Normalise icon name → Bootstrap Icons class string
  // Accepts: 'bi-calendar', 'calendar', 'bi bi-calendar'  →  'bi bi-calendar'
  function bsIconClass(icon) {
    if (!icon) return 'bi';
    const raw  = String(icon).trim().replace(/^bi\s+/, '');  // strip 'bi ' prefix if given
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

  // ── DOM construction ─────────────────────────────────────────────────────────
  function buildDOM(cfg, days, today) {
    const loc  = LOCALE[cfg.locale] || LOCALE['zh-TW'];
    const wrap = mk('div', 'wc-wrap');
    wrap.style.width = cfg.width;
    applyVars(wrap, cfg.colors);

    const shell = mk('div', 'wc-shell');
    wrap.appendChild(shell);

    // Optional month/year header (derived from first day)
    if (cfg.showHeader && days.length) {
      const d0  = parseSmartDate(days[0].date);
      const hdr = mk('div', 'wc-header');
      const lbl = mk('span', 'wc-mlabel');
      lbl.textContent = d0 ? loc.ym(d0.getFullYear(), d0.getMonth()) : '';
      hdr.appendChild(lbl);
      shell.appendChild(hdr);
    }

    // Grid — N equally-wide columns, no empty padding cells
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
        // ── Icon mode ──────────────────────────────────────────────────────
        // Top: Bootstrap Icon  |  Bottom: label text  |  No date circle (.wc-nw)
        cell.classList.add('wc-im');

        const ic = mk('i', bsIconClass(dc.icon) + ' wc-ic');

        const dn = mk('div', 'wc-dn');
        dn.textContent = dc.label || '';

        cell.append(ic, dn, mk('div', 'wc-dot'));

      } else {
        // ── Default mode ───────────────────────────────────────────────────
        // Top: weekday name  |  Middle: date number circle  |  Dot at bottom
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

  // ── Content injection ────────────────────────────────────────────────────────
  function inject(tEl, srcId, anim) {
    if (!tEl || !srcId) return;
    const src = D.getElementById(srcId);
    if (!src) { console.warn('[WeekCal] sourceId not found:', srcId); return; }

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

  // ── Selection ────────────────────────────────────────────────────────────────
  function doSelect(inst, date) {
    inst.wrap.querySelectorAll('.wc-cell').forEach(c => c.classList.remove('wc-sel'));
    const cell = inst.wrap.querySelector(`.wc-cell[data-date="${date}"]`);
    if (!cell) return;
    cell.classList.add('wc-sel');

    const srcId = cell.dataset.src;
    if (srcId) inject(inst.targetEl, srcId, inst.cfg.animation);
    if (typeof inst.cfg.onSelect === 'function') inst.cfg.onSelect(date, srcId || null);
  }

  // ── Instance registry ────────────────────────────────────────────────────────
  const _store = new Map();

  // ── Public API ───────────────────────────────────────────────────────────────
  const WeekCal = {

    /**
     * Theme palette registry.
     * Built-in keys: 'dark' (default), 'light'
     * To add a custom theme:
     *   WeekCal.themes.ocean = { calBg: '#0D1F2D', shell: '#E0F0FF', … }
     *   WeekCal.init({ theme: 'ocean', … })
     * To read a value:
     *   WeekCal.themes.light.todayBg   // '#E6374B'
     */
    themes: THEMES,

    /**
     * Override global defaults before any init().
     * Same shape as the init() options object (including theme, colors, animation…).
     * @param {object} overrides
     */
    configure(overrides) {
      merge(DEF, overrides);
      return this;
    },

    /**
     * Mount a WeekCal instance.
     *
     * Grid date resolution order:
     *   1. startDate + endDate → range (all dates in range, max 7 cells)
     *   2. Only days[] (no startDate/endDate) → sorted dates from days[], max 7
     *   3. Neither → 7 days from today
     * days[] entries supply sourceId / label / disabled for matching dates.
     *
     * Colour resolution: THEMES[theme]  ←  colors{}  (partial overrides)
     *
     * @param {object} options
     */
    init(options = {}) {
      const cfg = merge({}, DEF, options);

      // Colour = theme base palette + partial overrides from options.colors
      const base = THEMES[cfg.theme] || THEMES.dark;
      cfg.colors = Object.assign({}, base, options.colors || {});

      const cEl = resolve(cfg.container);
      if (!cEl) {
        console.error('[WeekCal] container not found:', cfg.container);
        return this;
      }
      const tEl = cfg.target ? resolve(cfg.target) : null;

      // Build date (ISO) → metadata lookup from days[]
      // Natural-language dates in days[].date are resolved to ISO here
      const lookup = {};
      (cfg.days || []).forEach(d => {
        const parsed = parseSmartDate(d.date);
        if (!parsed) return;
        const dt = toISO(parsed);
        lookup[dt] = { ...d, date: dt };
      });

      // Determine which ISO dates appear in the grid
      let gridDates = [];

      if (cfg.startDate || cfg.endDate) {
        // Range mode
        const start = parseSmartDate(cfg.startDate || 'today');
        if (!start) { console.error('[WeekCal] Invalid startDate:', cfg.startDate); return this; }
        const end = cfg.endDate ? parseSmartDate(cfg.endDate) : addDays(start, 6);
        if (!end)   { console.error('[WeekCal] Invalid endDate:', cfg.endDate);   return this; }
        for (let cur = new Date(start); cur <= end && gridDates.length < 7; cur = addDays(cur, 1))
          gridDates.push(toISO(cur));
      } else if (cfg.days && cfg.days.length) {
        // Days-only mode: dates come from days[] entries, sorted ascending
        gridDates = Object.keys(lookup).sort().slice(0, 7);
      } else {
        // Fallback: 7 days from today
        for (let i = 0; i < 7; i++) gridDates.push(toISO(addDays(new Date(), i)));
      }

      // Final per-cell config (merge lookup metadata for matching dates)
      const days = gridDates.map(date => ({
        date, sourceId: null, disabled: false, ...(lookup[date] || {}),
      }));

      // Hide all source divs (restored by destroy())
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

      // Instance object referenced by the click closure via let
      let inst;
      grid.addEventListener('click', e => {
        const cell = e.target.closest('.wc-cell.wc-go');
        if (cell && inst) doSelect(inst, cell.dataset.date);
      });
      inst = { cfg, days, wrap, targetEl: tEl, cEl };
      _store.set(cEl, inst);

      // Auto-select first day with content
      if (cfg.defaultFirst) {
        const first = days.find(d => d.sourceId);
        if (first) setTimeout(() => doSelect(inst, first.date), 50);
      }

      return this;
    },

    /**
     * Programmatically select a date.
     * @param {string|Element} containerSel
     * @param {string} date  ISO string 'YYYY-MM-DD' (natural-language not supported here)
     */
    select(containerSel, date) {
      const inst = _store.get(resolve(containerSel));
      if (inst) doSelect(inst, date);
      return this;
    },

    /**
     * Destroy an instance and restore hidden source divs.
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
     * Return the live config object for a mounted instance.
     * @param {string|Element} containerSel
     */
    getConfig(containerSel) {
      const inst = _store.get(resolve(containerSel));
      return inst ? inst.cfg : null;
    },
  };

  G.WeekCal = WeekCal;

})(window, document);

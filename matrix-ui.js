/*!
 * matrix-ui.js  v1.0
 * Display-mode matrix / comparison table web component.
 * No shadow DOM. Compatible with bp-popnote.js.
 * Child tags: <matrix-header> <matrix-row> <matrix-cell> <matrix-col> <matrix-footer>
 */
(function () {
  'use strict';

  // ── Color Palette ─────────────────────────────────────────────────────────────

  const PALETTE = {
    safe:     '#40C99A',
    warning:  '#F08080',
    shell:    '#C6C7BD',
    yellow:   '#DECA4B',
    orange:   '#EDA109',
    sky:      '#0ABDC6',
    lavender: '#C3A5E5',
    vanilla:  '#DBEDD8',
    teal:     '#0DA591',
    special:  '#C8DD5A',
    indigo:   '#9B72CF',
    pink:     '#FFB3D9',
    stone:    '#95BDD7',
    info:     '#4285EB',
    focus:    '#A0CF72',
    salmon:   '#E5C3B3',
  };

  // ── Semantic Presets ──────────────────────────────────────────────────────────
  //
  // semantic="positive"  → green check
  // semantic="negative"  → red X
  // semantic="neutral"   → dash (grey)
  // semantic="warning"   → triangle exclamation (yellow)
  // semantic="star"      → star (orange)
  // semantic="info"      → info circle (sky)
  // semantic="thumb"     → thumbs-up (green)
  // semantic="blank"     → nothing displayed
  //
  // Override icon only:  icon="bi-hand-thumbs-up-fill"
  // Override color only: color="lavender"  (palette key or any CSS color)

  const SEMANTICS = {
    positive: { icon: 'bi-check-circle-fill',          color: PALETTE.safe     },
    negative:  { icon: 'bi-x-circle-fill',              color: PALETTE.warning  },
    neutral:   { icon: 'bi-dash-circle',                color: PALETTE.shell    },
    warning:   { icon: 'bi-exclamation-triangle-fill',  color: PALETTE.yellow   },
    star:      { icon: 'bi-star-fill',                  color: PALETTE.orange   },
    info:      { icon: 'bi-info-circle-fill',           color: PALETTE.sky      },
    thumb:     { icon: 'bi-hand-thumbs-up-fill',        color: PALETTE.safe     },
    blank:     { icon: '',                              color: 'transparent'    },
  };

  // ── Theme Definitions ─────────────────────────────────────────────────────────
  //
  // accent    → header / footer text, row-label text (use brand color directly)
  // headerBg  → header & footer row background (solid dark tint, no alpha)
  // border    → border line color (solid mid-tone of accent, no alpha)
  //
  // headerBg is a very slightly tinted version of the background (#0C0D0C).
  // border is roughly 55–65% brightness of the accent for contrast without glare.

  const THEMES = {
    shell:    { accent: PALETTE.shell,    headerBg: '#191A18', border: '#5A5B55' },
    vanilla:  { accent: PALETTE.vanilla,  headerBg: '#161A15', border: '#5A7858' },
    sky:      { accent: PALETTE.sky,      headerBg: '#091618', border: '#087A88' },
    lavender: { accent: PALETTE.lavender, headerBg: '#130E1A', border: '#7058A8' },
    teal:     { accent: PALETTE.teal,     headerBg: '#081613', border: '#0A7060' },
    special:  { accent: PALETTE.special,  headerBg: '#131608', border: '#7A8A2E' },
    indigo:   { accent: PALETTE.indigo,   headerBg: '#0E0A18', border: '#6248A0' },
    stone:    { accent: PALETTE.stone,    headerBg: '#0C1318', border: '#4E7890' },
    orange:   { accent: PALETTE.orange,   headerBg: '#181208', border: '#A87008' },
    pink:     { accent: PALETTE.pink,     headerBg: '#180D14', border: '#C870A0' },
    salmon:   { accent: PALETTE.salmon,   headerBg: '#17100C', border: '#A87060' },
    safe:     { accent: PALETTE.safe,     headerBg: '#0A1610', border: '#2A8060' },
    warning:  { accent: PALETTE.warning,  headerBg: '#180D0D', border: '#A84040' },
    yellow:   { accent: PALETTE.yellow,   headerBg: '#161308', border: '#A08828' },
    focus:    { accent: PALETTE.focus,    headerBg: '#0F1609', border: '#608038' },
    info:     { accent: PALETTE.info,     headerBg: '#0A0F18', border: '#2A5CB8' },
  };

  // ── CSS ───────────────────────────────────────────────────────────────────────

  const CSS = `
    matrix-ui { display: block; }

    .mxui-wrap {
      display: block;
      overflow-x: auto;
    }

    .mxui-table {
      border-collapse: collapse;
      width: 100%;
    }

    .mxui-th,
    .mxui-td {
      padding: 4px 10px;
      text-align: center;
      vertical-align: middle;
      box-sizing: border-box;
      line-height: 1.4;
    }

    .mxui-row-label {
      text-align: left;
      font-weight: 500;
      white-space: nowrap;
    }

    .mxui-header-row .mxui-th {
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .mxui-footer-row .mxui-td {
      font-weight: 600;
    }

    .mxui-icon-wrap {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .mxui-cell-label {
      font-size: 0.78em;
      line-height: 1.2;
      color: inherit;
    }

    /* Cells wired to bp-popnote get a subtle cursor hint */
    .mxui-td[data-popover-content],
    .mxui-td[data-popover-title],
    .mxui-td[data-popover-target] {
      cursor: pointer;
    }
  `;

  // ── Internal Helpers ──────────────────────────────────────────────────────────

  function injectCSS() {
    if (document.getElementById('matrix-ui-style')) return;
    const s = document.createElement('style');
    s.id = 'matrix-ui-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /**
   * Parse a border shorthand string like "1px solid" or "2px dashed".
   * Returns { width, style } or null if value is "none" / empty.
   */
  function parseBorder(val) {
    if (!val || val === 'none' || val === '0') return null;
    const parts = val.trim().split(/\s+/);
    return { width: parts[0] || '1px', style: parts[1] || 'solid' };
  }

  /** Assemble a CSS border value using parsed shorthand + theme color. */
  function bval(parsed, color) {
    if (!parsed) return '';
    return `${parsed.width} ${parsed.style} ${color}`;
  }

  /**
   * Copy every data-* attribute from a source element to a target element.
   * This lets bp-popnote.js pick up popovers defined on <matrix-cell>.
   */
  function forwardDataAttrs(src, target) {
    for (const attr of src.attributes) {
      if (attr.name.startsWith('data-')) {
        target.setAttribute(attr.name, attr.value);
      }
    }
  }

  /**
   * Build the visual content of a <matrix-cell> into a given <td>.
   * Handles icon + optional label rendering, or falls back to innerHTML.
   */
  function renderCell(cellEl, theme, iconSize, labelPos, td) {
    // Always forward data-* so bp-popnote events work on the rendered <td>
    forwardDataAttrs(cellEl, td);

    const semantic  = cellEl.getAttribute('semantic') || '';
    const iconAttr  = cellEl.getAttribute('icon')     || '';
    const label     = cellEl.getAttribute('label')    || '';
    const colorAttr = cellEl.getAttribute('color')    || '';

    // No semantic / icon attr → treat as raw HTML cell
    if (!semantic && !iconAttr) {
      td.innerHTML = cellEl.innerHTML;
      return;
    }

    const preset    = SEMANTICS[semantic] || {};
    const iconClass = iconAttr || preset.icon || '';
    const iconColor = colorAttr
      ? (PALETTE[colorAttr] || colorAttr)
      : (preset.color || theme.accent);

    const wrap = document.createElement('span');
    wrap.className = 'mxui-icon-wrap';

    if (label && labelPos === 'above') {
      const lbl = document.createElement('span');
      lbl.className = 'mxui-cell-label';
      lbl.textContent = label;
      wrap.appendChild(lbl);
    }

    if (iconClass) {
      const i = document.createElement('i');
      i.className = `bi ${iconClass}`;
      i.style.color     = iconColor;
      i.style.fontSize  = iconSize;
      i.style.display   = 'block';
      wrap.appendChild(i);
    }

    if (label && labelPos !== 'above') {
      const lbl = document.createElement('span');
      lbl.className = 'mxui-cell-label';
      lbl.textContent = label;
      wrap.appendChild(lbl);
    }

    td.appendChild(wrap);
  }

  // ── MatrixUI Custom Element ───────────────────────────────────────────────────

  class MatrixUI extends HTMLElement {
    connectedCallback() {
      // Defer render so that all child elements are fully parsed
      setTimeout(() => this._render(), 0);
    }

    _render() {
      // ── Config from attributes ──────────────────────────────
      const themeName  = this.getAttribute('theme')           || 'shell';
      const fontSize   = this.getAttribute('font-size')       || 'inherit';
      const iconSize   = this.getAttribute('icon-size')       || '1.1rem';
      const labelPos   = this.getAttribute('label-position')  || 'below';
      const rowLblW    = this.getAttribute('row-label-width') || '160px';
      const colW       = this.getAttribute('col-width')       || '';

      // Border controls
      // border        → outer wrap border
      // row-border    → horizontal dividers between data rows (and below header)
      // col-border    → vertical dividers between columns
      // header-border → separator between <thead> and <tbody> (defaults thicker)
      // footer-border → separator between <tbody> and <tfoot> (defaults thicker)
      const outerB = parseBorder(this.getAttribute('border')         || '1px solid');
      const rowB   = parseBorder(this.getAttribute('row-border')     || '1px solid');
      const colB   = parseBorder(this.getAttribute('col-border')     || 'none');
      const hdrB   = parseBorder(this.getAttribute('header-border')  || '2px solid');
      const ftrB   = parseBorder(this.getAttribute('footer-border')  || '2px solid');

      const theme = THEMES[themeName] || THEMES.shell;
      // accent-border="false" -> use theme.border (pre-darkened fallback); default uses accent
      const accentBorder = this.getAttribute('accent-border') !== 'false';
      const bc = accentBorder ? theme.accent : (theme.border || theme.accent);

      // ── Collect source elements ─────────────────────────────
      const headerEl      = this.querySelector(':scope > matrix-header');
      const footerEl      = this.querySelector(':scope > matrix-footer');
      const rowEls        = Array.from(this.querySelectorAll(':scope > matrix-row'));
      const headerCols    = headerEl
        ? Array.from(headerEl.querySelectorAll(':scope > matrix-col'))
        : [];
      const footerChildren = footerEl
        ? Array.from(footerEl.children)
        : [];

      const numCols    = headerCols.length;
      const hasFooter  = footerChildren.length > 0;

      // ── Outer wrapper ───────────────────────────────────────
      const wrap = document.createElement('div');
      wrap.className    = 'mxui-wrap';
      wrap.style.fontSize = fontSize;
      if (outerB) {
        wrap.style.border       = bval(outerB, bc);
        wrap.style.borderRadius = '4px';
        wrap.style.overflow     = 'hidden';
      }

      // ── <table> ─────────────────────────────────────────────
      const table = document.createElement('table');
      table.className = 'mxui-table';

      // <colgroup> for fixed widths
      const cg = document.createElement('colgroup');
      const firstCol = document.createElement('col');
      firstCol.style.width = rowLblW;
      cg.appendChild(firstCol);
      for (let i = 0; i < numCols; i++) {
        const c = document.createElement('col');
        if (colW) c.style.width = colW;
        cg.appendChild(c);
      }
      table.appendChild(cg);

      // ── <thead> ─────────────────────────────────────────────
      if (headerCols.length) {
        const thead = document.createElement('thead');
        const tr    = document.createElement('tr');
        tr.className   = 'mxui-header-row';
        tr.style.background = theme.headerBg;

        // Top-left corner cell (empty)
        const corner = document.createElement('th');
        corner.className     = 'mxui-th mxui-row-label';
        corner.style.color   = theme.accent;
        if (hdrB) corner.style.borderBottom = bval(hdrB, bc);
        tr.appendChild(corner);

        headerCols.forEach((col, i) => {
          const th = document.createElement('th');
          th.className  = 'mxui-th';
          th.style.color = theme.accent;
          th.innerHTML  = col.innerHTML;
          if (hdrB)                    th.style.borderBottom = bval(hdrB, bc);
          if (colB && i < numCols - 1) th.style.borderRight  = bval(colB, bc);
          tr.appendChild(th);
        });

        thead.appendChild(tr);
        table.appendChild(thead);
      }

      // ── <tbody> ─────────────────────────────────────────────
      const tbody = document.createElement('tbody');

      rowEls.forEach((rowEl, ri) => {
        const tr      = document.createElement('tr');
        tr.className  = 'mxui-data-row';
        const isLast  = ri === rowEls.length - 1;
        // Suppress bottom border on last body row when a footer follows
        // (footer provides its own top separator)
        const suppressBottom = isLast && hasFooter;

        // Row-label cell
        const lbl          = document.createElement('td');
        lbl.className      = 'mxui-td mxui-row-label';
        lbl.style.color    = theme.accent;
        lbl.innerHTML      = rowEl.getAttribute('label') || '';
        if (rowB && !suppressBottom) lbl.style.borderBottom = bval(rowB, bc);
        tr.appendChild(lbl);

        // Data cells
        const cellEls = Array.from(rowEl.querySelectorAll(':scope > matrix-cell'));
        for (let ci = 0; ci < numCols; ci++) {
          const td = document.createElement('td');
          td.className = 'mxui-td mxui-cell';
          if (rowB && !suppressBottom)      td.style.borderBottom = bval(rowB, bc);
          if (colB && ci < numCols - 1)     td.style.borderRight  = bval(colB, bc);
          if (cellEls[ci]) renderCell(cellEls[ci], theme, iconSize, labelPos, td);
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);

      // ── <tfoot> ─────────────────────────────────────────────
      if (hasFooter) {
        const tfoot = document.createElement('tfoot');
        const tr    = document.createElement('tr');
        tr.className        = 'mxui-footer-row';
        tr.style.background = theme.headerBg;

        // Footer row-label cell
        const ftLbl         = document.createElement('td');
        ftLbl.className     = 'mxui-td mxui-row-label';
        ftLbl.style.color   = theme.accent;
        ftLbl.innerHTML     = footerEl.getAttribute('label') || '';
        if (ftrB) ftLbl.style.borderTop = bval(ftrB, bc);
        tr.appendChild(ftLbl);

        footerChildren.forEach((child, i) => {
          const td         = document.createElement('td');
          td.className     = 'mxui-td';
          td.style.color   = theme.accent;
          if (ftrB)                            td.style.borderTop   = bval(ftrB, bc);
          if (colB && i < footerChildren.length - 1) td.style.borderRight = bval(colB, bc);

          const tag = child.tagName.toLowerCase();
          if (tag === 'matrix-cell') {
            renderCell(child, theme, iconSize, labelPos, td);
          } else {
            // matrix-col → render as plain HTML text
            td.innerHTML = child.innerHTML;
          }
          tr.appendChild(td);
        });

        tfoot.appendChild(tr);
        table.appendChild(tfoot);
      }

      wrap.appendChild(table);

      // ── Replace element content with rendered table ─────────
      this.innerHTML = '';
      this.appendChild(wrap);
    }
  }

  // ── Global Configuration API ──────────────────────────────────────────────────
  //
  // MatrixUIConfig.addTheme('myTheme', {
  //   accent: '#ffffff', headerBg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.4)'
  // });
  //
  // MatrixUIConfig.addSemantic('premium', {
  //   icon: 'bi-gem', color: '#C3A5E5'
  // });

  window.MatrixUIConfig = {
    addTheme(name, def) {
      if (name && def) THEMES[name] = def;
    },
    addSemantic(name, def) {
      if (name && def) SEMANTICS[name] = { icon: def.icon || '', color: def.color || PALETTE.shell };
    },
    themes:    THEMES,
    semantics: SEMANTICS,
  };

  // ── Register Custom Elements ──────────────────────────────────────────────────

  injectCSS();

  const TAGS = ['matrix-ui', 'matrix-header', 'matrix-row', 'matrix-cell', 'matrix-col', 'matrix-footer'];
  TAGS.forEach(tag => {
    if (customElements.get(tag)) return;
    customElements.define(tag,
      tag === 'matrix-ui' ? MatrixUI : class extends HTMLElement {}
    );
  });

})();

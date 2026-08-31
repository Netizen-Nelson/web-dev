(function () {
  'use strict';

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

  const SEMANTICS = {
    positive: { icon: 'bi-check-circle-fill',         color: PALETTE.safe     },
    negative:  { icon: 'bi-x-circle-fill',             color: PALETTE.warning  },
    neutral:   { icon: 'bi-dash-circle',               color: PALETTE.shell    },
    warning:   { icon: 'bi-exclamation-triangle-fill', color: PALETTE.yellow   },
    star:      { icon: 'bi-star-fill',                 color: PALETTE.orange   },
    info:      { icon: 'bi-info-circle-fill',          color: PALETTE.sky      },
    thumb:     { icon: 'bi-hand-thumbs-up-fill',       color: PALETTE.safe     },
    blank:     { icon: '',                             color: 'transparent'    },
  };

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

    /* ── Filled cell ─────────────────────────────────── */

    /*
     * Background and foreground are set inline (theme.accent / #0C0D0C).
     * This class exists as a styling hook for external overrides.
     * font-weight bump helps legibility on coloured backgrounds.
     */
    .mxui-cell--filled {
      font-weight: 600;
    }

    /* ── Corner ribbon ────────────────────────────────── */

    /*
     * .mxui-corner is a zero-size element with CSS border trick.
     * border-width and border-color are set inline per cell
     * so the size and colour are data-driven.
     */
    .mxui-corner {
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      pointer-events: none;
      z-index: 1;
    }

    /*
     * Optional Bootstrap icon centred within the triangle area.
     * font-size is set inline (scaled to corner-size * 0.42).
     */
    .mxui-corner-icon {
      position: absolute;
      top: 2px;
      right: 2px;
      line-height: 1;
      z-index: 2;
      pointer-events: none;
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
   * Inject a corner ribbon (triangle + optional icon) into a <td>.
   *
   * Prereq: td must already have position:relative and overflow:hidden
   * (set by renderCell before calling this).
   *
   * @param {HTMLElement} td
   * @param {string}  color        - resolved CSS colour for the triangle
   * @param {number}  size         - triangle leg length in px (default 30)
   * @param {string}  iconClass    - Bootstrap icon class, e.g. 'bi-star-fill'
   * @param {string}  iconColor    - resolved CSS colour for the icon
   */
  function injectCorner(td, color, size, iconClass, iconColor) {
    // Triangle
    const corner = document.createElement('span');
    corner.className = 'mxui-corner';
    corner.style.borderWidth = `0 ${size}px ${size}px 0`;
    corner.style.borderColor = `transparent ${color} transparent transparent`;
    td.appendChild(corner);

    // Optional icon centred in the triangle
    if (iconClass) {
      const ico = document.createElement('i');
      ico.className = `bi ${iconClass} mxui-corner-icon`;
      ico.style.color    = iconColor;
      ico.style.fontSize = Math.round(size * 0.42) + 'px';
      td.appendChild(ico);
    }
  }

  function renderCell(cellEl, theme, iconSize, labelPos, td) {
    forwardDataAttrs(cellEl, td);

    // ── Standard cell attributes ──────────────────────
    const semantic  = cellEl.getAttribute('semantic') || '';
    const iconAttr  = cellEl.getAttribute('icon')     || '';
    const label     = cellEl.getAttribute('label')    || '';
    const colorAttr = cellEl.getAttribute('color')    || '';

    // ── Filled: accent background, dark foreground ────
    // filled and corner are mutually exclusive; filled wins silently.
    const hasFilled = cellEl.hasAttribute('filled');

    if (hasFilled) {
      td.style.background = theme.accent;
      td.style.color      = '#0C0D0C';
      td.classList.add('mxui-cell--filled');
    }

    // ── Corner ribbon attributes ──────────────────────
    // Ignored when filled is present.
    const hasCorner       = !hasFilled && cellEl.hasAttribute('corner');
    const cornerSize      = parseInt(cellEl.getAttribute('corner-size')  || '30', 10);
    const cornerColorRaw  = cellEl.getAttribute('corner-color')          || '';
    const cornerIconClass = cellEl.getAttribute('corner-icon')           || '';
    const cornerIconRaw   = cellEl.getAttribute('corner-icon-color')     || '';

    const cornerColor     = cornerColorRaw
      ? (PALETTE[cornerColorRaw] || cornerColorRaw)
      : theme.accent;
    const cornerIconColor = cornerIconRaw
      ? (PALETTE[cornerIconRaw]  || cornerIconRaw)
      : '#0C0D0C';

    if (hasCorner) {
      td.style.position     = 'relative';
      td.style.overflow     = 'hidden';
      td.style.paddingRight = (cornerSize + 6) + 'px';
    }

    // ── Render cell content ───────────────────────────

    if (!semantic && !iconAttr) {
      // Plain HTML / text cell
      td.innerHTML = cellEl.innerHTML;
    } else {
      // Icon / semantic cell.
      // When filled, all icons are forced to #0C0D0C so they read cleanly
      // on the accent background regardless of semantic colour.
      const preset    = SEMANTICS[semantic] || {};
      const iconClass = iconAttr || preset.icon || '';
      const iconColor = hasFilled
        ? '#0C0D0C'
        : (colorAttr
            ? (PALETTE[colorAttr] || colorAttr)
            : (preset.color || theme.accent));

      const wrap = document.createElement('span');
      wrap.className = 'mxui-icon-wrap';

      if (label && labelPos === 'above') {
        const lbl = document.createElement('span');
        lbl.className   = 'mxui-cell-label';
        lbl.textContent = label;
        wrap.appendChild(lbl);
      }

      if (iconClass) {
        const i = document.createElement('i');
        i.className      = `bi ${iconClass}`;
        i.style.color    = iconColor;
        i.style.fontSize = iconSize;
        i.style.display  = 'block';
        wrap.appendChild(i);
      }

      if (label && labelPos !== 'above') {
        const lbl = document.createElement('span');
        lbl.className   = 'mxui-cell-label';
        lbl.textContent = label;
        wrap.appendChild(lbl);
      }

      td.appendChild(wrap);
    }

    // ── Inject corner on top of content ──────────────
    if (hasCorner) {
      injectCorner(td, cornerColor, cornerSize, cornerIconClass, cornerIconColor);
    }
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
      const outerB = parseBorder(this.getAttribute('border')         || '1px solid');
      const rowB   = parseBorder(this.getAttribute('row-border')     || '1px solid');
      const colB   = parseBorder(this.getAttribute('col-border')     || 'none');
      const hdrB   = parseBorder(this.getAttribute('header-border')  || '2px solid');
      const ftrB   = parseBorder(this.getAttribute('footer-border')  || '2px solid');

      const theme = THEMES[themeName] || THEMES.shell;
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
      wrap.className      = 'mxui-wrap';
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
        tr.className        = 'mxui-header-row';
        tr.style.background = theme.headerBg;

        // Top-left corner cell (empty)
        const corner = document.createElement('th');
        corner.className   = 'mxui-th mxui-row-label';
        corner.style.color = theme.accent;
        if (hdrB) corner.style.borderBottom = bval(hdrB, bc);
        tr.appendChild(corner);

        headerCols.forEach((col, i) => {
          const th = document.createElement('th');
          th.className   = 'mxui-th';
          th.style.color = theme.accent;
          th.innerHTML   = col.innerHTML;
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
        const suppressBottom = isLast && hasFooter;

        // Row-label cell
        const lbl       = document.createElement('td');
        lbl.className   = 'mxui-td mxui-row-label';
        lbl.style.color = theme.accent;
        lbl.innerHTML   = rowEl.getAttribute('label') || '';
        if (rowB && !suppressBottom) lbl.style.borderBottom = bval(rowB, bc);
        tr.appendChild(lbl);

        // Data cells
        const cellEls = Array.from(rowEl.querySelectorAll(':scope > matrix-cell'));
        for (let ci = 0; ci < numCols; ci++) {
          const td = document.createElement('td');
          td.className = 'mxui-td mxui-cell';
          if (rowB && !suppressBottom)  td.style.borderBottom = bval(rowB, bc);
          if (colB && ci < numCols - 1) td.style.borderRight  = bval(colB, bc);
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
        const ftLbl       = document.createElement('td');
        ftLbl.className   = 'mxui-td mxui-row-label';
        ftLbl.style.color = theme.accent;
        ftLbl.innerHTML   = footerEl.getAttribute('label') || '';
        if (ftrB) ftLbl.style.borderTop = bval(ftrB, bc);
        tr.appendChild(ftLbl);

        footerChildren.forEach((child, i) => {
          const td       = document.createElement('td');
          td.className   = 'mxui-td';
          td.style.color = theme.accent;
          if (ftrB)                                    td.style.borderTop   = bval(ftrB, bc);
          if (colB && i < footerChildren.length - 1)  td.style.borderRight = bval(colB, bc);

          const tag = child.tagName.toLowerCase();
          if (tag === 'matrix-cell') {
            renderCell(child, theme, iconSize, labelPos, td);
          } else {
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

  // ── Global Config API ─────────────────────────────────────────────────────────

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

  injectCSS();

  const TAGS = ['matrix-ui', 'matrix-header', 'matrix-row', 'matrix-cell', 'matrix-col', 'matrix-footer'];
  TAGS.forEach(tag => {
    if (customElements.get(tag)) return;
    customElements.define(tag,
      tag === 'matrix-ui' ? MatrixUI : class extends HTMLElement {}
    );
  });

})();

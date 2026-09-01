(function () {
  'use strict';

  const CSS = `
    [data-popover-title],
    [data-popover-content],
    [data-popover-target] {
      cursor: pointer;
      border-bottom-width: 1px;
      border-bottom-style: dashed;
      border-bottom-color: var(--xpop-hint-color, #C3A5E5);
      transition: border-color 0.2s, color 0.2s;
    }
    [data-popover-hint="false"] {
      border-bottom: none !important;
    }

    /* ── Floating popup ──────────────────────────────────────── */
    .xpop-container {
      position: fixed;
      z-index: 99999;
      max-width: var(--xpop-max-width, 560px);
      min-width: 220px;
      border-radius: 8px;
      border-width: 1px;
      border-style: var(--xpop-border-style, solid);
      border-color: var(--xpop-border-color, #C3A5E5);
      background: var(--xpop-bg, #130e1e);
      font-size: var(--xpop-font-size, 1rem);
      color: #c6c7bd;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35);
      pointer-events: auto;
      font-family: 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      opacity: 0;
      transform: scale(0.88);
      transform-origin: var(--xpop-origin, center bottom);
      transition: opacity 0.22s cubic-bezier(.4,0,.2,1),
                  transform 0.22s cubic-bezier(.4,0,.2,1);
    }
    .xpop-container.xpop-visible {
      opacity: 1;
      transform: scale(1);
    }
    .xpop-arrow {
      position: absolute;
      width: 0;
      height: 0;
      border: 8px solid transparent;
    }
    .xpop-container[data-placement="top"] .xpop-arrow {
      bottom: -16px; left: 50%;
      transform: translateX(-50%);
      border-top-color: var(--xpop-border-color, #C3A5E5);
    }
    .xpop-container[data-placement="bottom"] .xpop-arrow {
      top: -16px; left: 50%;
      transform: translateX(-50%);
      border-bottom-color: var(--xpop-border-color, #C3A5E5);
    }
    .xpop-container[data-placement="left"] .xpop-arrow {
      right: -16px; top: 50%;
      transform: translateY(-50%);
      border-left-color: var(--xpop-border-color, #C3A5E5);
    }
    .xpop-container[data-placement="right"] .xpop-arrow {
      left: -16px; top: 50%;
      transform: translateY(-50%);
      border-right-color: var(--xpop-border-color, #C3A5E5);
    }
    .xpop-arrow::after {
      content: '';
      position: absolute;
      width: 0; height: 0;
      border: 7px solid transparent;
    }
    .xpop-container[data-placement="top"] .xpop-arrow::after {
      bottom: 1px; left: -7px;
      border-top-color: var(--xpop-bg, #130e1e);
    }
    .xpop-container[data-placement="bottom"] .xpop-arrow::after {
      top: 1px; left: -7px;
      border-bottom-color: var(--xpop-bg, #130e1e);
    }
    .xpop-container[data-placement="left"] .xpop-arrow::after {
      right: 1px; top: -7px;
      border-left-color: var(--xpop-bg, #130e1e);
    }
    .xpop-container[data-placement="right"] .xpop-arrow::after {
      left: 1px; top: -7px;
      border-right-color: var(--xpop-bg, #130e1e);
    }

    /* ── Shared header / body / carousel ─────────────────────── */
    .xpop-header {
      padding: 10px 16px 8px;
      font-size: calc(var(--xpop-font-size, 1rem) * 1.05);
      font-weight: 700;
      color: var(--xpop-title-color, #C3A5E5);
      border-bottom: 1px solid var(--xpop-border-color, #C3A5E5);
      letter-spacing: 0.03em;
    }
    .xpop-header:empty { display: none; }
    .xpop-body { padding: 12px 16px 14px; }
    .xpop-carousel-track { width: 100%; }
    .xpop-carousel-track section {
      display: none;
      width: 100%;
      box-sizing: border-box;
      padding: 2px 0;
    }
    .xpop-carousel-track section.xpop-active { display: block; }
    .xpop-carousel-track section.xpop-anim-forward {
      animation: xpop-slide-forward 0.28s cubic-bezier(.4,0,.2,1) both;
    }
    .xpop-carousel-track section.xpop-anim-back {
      animation: xpop-slide-back 0.28s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes xpop-slide-forward {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes xpop-slide-back {
      from { opacity: 0; transform: translateY(-14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .xpop-carousel-track.xpop-crossfade section.xpop-anim-forward,
    .xpop-carousel-track.xpop-crossfade section.xpop-anim-back {
      animation: xpop-fadein 0.28s ease both;
    }
    @keyframes xpop-fadein {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .xpop-carousel-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 12px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .xpop-dots { display: flex; gap: 6px; align-items: center; }
    .xpop-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
      border: none; padding: 0;
    }
    .xpop-dot.xpop-dot-active {
      background: var(--xpop-title-color, #C3A5E5);
      transform: scale(1.3);
    }
    .xpop-nav { display: flex; align-items: center; gap: 8px; color: #c6c7bd; font-size: 0.88rem; }
    .xpop-nav-btn {
      background: none;
      border: 1px solid rgba(255,255,255,0.18);
      color: var(--xpop-title-color, #C3A5E5);
      border-radius: 4px;
      width: 26px; height: 26px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      transition: background 0.18s, border-color 0.18s;
      padding: 0; line-height: 1;
    }
    .xpop-nav-btn:hover {
      background: rgba(255,255,255,0.08);
      border-color: var(--xpop-title-color, #C3A5E5);
    }
    .xpop-nav-btn:disabled { opacity: 0.3; cursor: default; }
    .xpop-counter {
      min-width: 40px; text-align: center;
      opacity: 0.8; font-variant-numeric: tabular-nums;
    }
    .xpop-progress {
      height: 2px; background: rgba(255,255,255,0.08);
      position: relative; overflow: hidden;
    }
    .xpop-progress-bar {
      position: absolute; left: 0; top: 0;
      height: 100%; width: 0%;
      background: var(--xpop-title-color, #C3A5E5);
      transition: width linear;
    }

    .xpop-panel-wrap {
      border-radius: 8px;
      border-width: 1px;
      border-style: solid;
      border-color: var(--xpop-border-color, #C3A5E5);
      background: var(--xpop-bg, #130e1e);
      font-size: var(--xpop-font-size, 1rem);
      color: #c6c7bd;
      font-family: 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      animation: xpop-panel-in 0.28s cubic-bezier(.4,0,.2,1) both;
    }
    @keyframes xpop-panel-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .xpop-panel-source {
      padding: 9px 16px 4px;
      font-size: 0.76rem;
      color: var(--xpop-title-color, #C3A5E5);
      opacity: 0.78;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .xpop-panel-source::before {
      content: '';
      display: inline-block;
      width: 5px; height: 5px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
      opacity: 0.9;
    }

    /* Active trigger highlight in panel mode */
    [data-popover-title].xpop-panel-active,
    [data-popover-content].xpop-panel-active,
    [data-popover-target].xpop-panel-active {
      border-bottom-style: solid !important;
      color: var(--xpop-hint-color, #C3A5E5);
    }

    /* ── Bootstrap Modal theming ─────────────────────────────── */
    #xpop-bs-modal .modal-content {
      border-width: 1px;
      border-style: solid;
    }
    #xpop-bs-modal .modal-header {
      border-bottom-width: 1px;
      border-bottom-style: solid;
      align-items: center;
    }
    #xpop-bs-modal .modal-body {
      color: #C6C7BD;
      font-family: 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      overflow-y: auto;
    }

    /* ── Bootstrap Offcanvas theming ─────────────────────────── */
    #xpop-bs-offcanvas .offcanvas-header {
      border-bottom-width: 1px;
      border-bottom-style: solid;
      align-items: center;
    }
    #xpop-bs-offcanvas .offcanvas-body {
      color: #C6C7BD;
      font-family: 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      line-height: 1.6;
      overflow-y: auto;
    }

    /* ── Shared close button ─────────────────────────────────── */
    #xpop-bs-modal .btn-close,
    #xpop-bs-offcanvas .btn-close {
      opacity: 0.65;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    #xpop-bs-modal .btn-close:hover,
    #xpop-bs-offcanvas .btn-close:hover {
      opacity: 1;
    }
  `;

  const THEMES = {
    dark:      { bg: '#130e1e', titleColor: '#C3A5E5', borderColor: '#C3A5E5' },
    lavender:  { bg: '#130e1e', titleColor: '#C3A5E5', borderColor: '#C3A5E5' }, // alias
    sky:       { bg: '#071318', titleColor: '#62C8F0', borderColor: '#62C8F0' },
    ocean:     { bg: '#071518', titleColor: '#0ABDC6', borderColor: '#0ABDC6' },
    warning:   { bg: '#190d0d', titleColor: '#F08080', borderColor: '#F08080' },
    success:   { bg: '#091508', titleColor: '#20C21D', borderColor: '#20C21D' },
    safe:      { bg: '#091508', titleColor: '#20C21D', borderColor: '#20C21D' }, // alias
    special:   { bg: '#111605', titleColor: '#C8DD5A', borderColor: '#C8DD5A' },
    highlight: { bg: '#111605', titleColor: '#C8DD5A', borderColor: '#C8DD5A' }, // alias
    note:      { bg: '#161205', titleColor: '#DECA4B', borderColor: '#DECA4B' },
    yellow:    { bg: '#161205', titleColor: '#DECA4B', borderColor: '#DECA4B' }, // alias
    salmon:    { bg: '#180e0a', titleColor: '#E5C3B3', borderColor: '#E5C3B3' },
    pink:      { bg: '#180a12', titleColor: '#FFB3D9', borderColor: '#FFB3D9' },
    stone:     { bg: '#0d1620', titleColor: '#95BDD7', borderColor: '#95BDD7' },
    orange:    { bg: '#181005', titleColor: '#EDA109', borderColor: '#EDA109' },
    vanilla:   { bg: '#171815', titleColor: '#DBEDD8', borderColor: '#DBEDD8' },
    teal:      { bg: '#061412', titleColor: '#0DA591', borderColor: '#0DA591' },
    focus:     { bg: '#181408', titleColor: '#E0BE79', borderColor: '#E0BE79' },
    indigo:    { bg: '#0e0a18', titleColor: '#9B72CF', borderColor: '#9B72CF' },
    info:      { bg: '#08101a', titleColor: '#79B6FA', borderColor: '#79B6FA' },
  };

  let config = {
    theme:       'dark',
    maxWidth:    '560px',
    offset:      8,
    fontSize:    '1rem',
    borderStyle: 'solid',
    placement:   'top',
    carousel:    { animation: 'slide', interval: 3000 },
    panelTarget: null,
    _customThemes: {},
    // ── Modal / Offcanvas ─────────────────────────────────────
    // modal: false | 'dialog' | 'start' | 'end' | 'top' | 'bottom'
    // true is treated as 'dialog' for convenience
    modal:       false,
    modalSize:   '',      // CSS value: '480px', '80vw' … or Bootstrap keyword 'sm'|'lg'|'xl'
    modalStatic: false,   // true → clicking backdrop does NOT close
  };

  window.PopoverConfig = {
    set(opts) {
      if (opts.carousel) { Object.assign(config.carousel, opts.carousel); delete opts.carousel; }
      Object.assign(config, opts);
    },
    addTheme(name, def) { config._customThemes[name] = def; },
  };

  // ─── State ───────────────────────────────────────────────────────────────────
  let currentPop = null, currentTrigger = null, carouselState = null;
  let panelActiveTrigger = null, panelCarouselState = null;

  function getTheme(n)  { return config._customThemes[n] || THEMES[n] || THEMES.dark; }
  function ra(el, k, fb){ return el.dataset[k] !== undefined ? el.dataset[k] : fb; }

  function injectCSS() {
    if (document.getElementById('bp-popnote-style')) return;
    const s = document.createElement('style');
    s.id = 'bp-popnote-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function calcPosition(trigger, pop, placement, offset) {
    const tr = trigger.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const vw = window.innerWidth,  vh = window.innerHeight;
    const pos = {
      top:    { top: tr.top  - ph - offset,         left: tr.left + tr.width/2  - pw/2 },
      bottom: { top: tr.bottom + offset,             left: tr.left + tr.width/2  - pw/2 },
      left:   { top: tr.top  + tr.height/2 - ph/2,  left: tr.left - pw - offset        },
      right:  { top: tr.top  + tr.height/2 - ph/2,  left: tr.right + offset            },
    };
    let p = placement;
    if (p==='top'    && pos.top.top    < 8)         p = 'bottom';
    if (p==='bottom' && pos.bottom.top + ph > vh-8) p = 'top';
    if (p==='left'   && pos.left.left  < 8)         p = 'right';
    if (p==='right'  && pos.right.left + pw > vw-8) p = 'left';
    let { top, left } = pos[p];
    left = Math.max(8, Math.min(left, vw-pw-8));
    top  = Math.max(8, Math.min(top,  vh-ph-8));
    return { top, left, finalPlacement: p };
  }

  function originOf(p) {
    return ({top:'center bottom',bottom:'center top',left:'right center',right:'left center'})[p] || 'center bottom';
  }

  function extractContent(trigger) {
    const targetId = trigger.dataset.popoverTarget  || '';
    if (targetId) {
      const tpl = document.querySelector(targetId);
      if (tpl && tpl.content) {
        const d = document.createElement('div');
        d.appendChild(tpl.content.cloneNode(true));
        return d.innerHTML;
      }
      if (tpl) return tpl.innerHTML;
    }
    return trigger.dataset.popoverContent || '';
  }

  function buildContentDOM(html) {
    const tmp  = document.createElement('div');
    tmp.innerHTML = html;
    const secs = Array.from(tmp.querySelectorAll(':scope > section'));
    const isCarousel = secs.length > 1;

    const body = document.createElement('div');
    body.className = 'xpop-body';

    let progressEl = null, barEl = null;

    if (isCarousel) {
      const track = document.createElement('div');
      track.className = 'xpop-carousel-track';
      secs.forEach(sec => {
        const s = document.createElement('section');
        s.innerHTML = sec.innerHTML;
        track.appendChild(s);
      });
      body.appendChild(track);

      progressEl = document.createElement('div');
      progressEl.className = 'xpop-progress';
      const pb = document.createElement('div');
      pb.className = 'xpop-progress-bar';
      progressEl.appendChild(pb);

      const bar  = document.createElement('div');
      bar.className = 'xpop-carousel-bar';
      const dots = document.createElement('div');
      dots.className = 'xpop-dots';
      const nav  = document.createElement('div');
      nav.className = 'xpop-nav';
      const bp = document.createElement('button');
      bp.className = 'xpop-nav-btn'; bp.dataset.dir = '-1'; bp.innerHTML = '&#8593;';
      const bn = document.createElement('button');
      bn.className = 'xpop-nav-btn'; bn.dataset.dir = '1';  bn.innerHTML = '&#8595;';
      const ctr = document.createElement('span');
      ctr.className = 'xpop-counter';
      nav.appendChild(bp); nav.appendChild(ctr); nav.appendChild(bn);
      bar.appendChild(dots); bar.appendChild(nav);
      barEl = bar;
    } else {
      body.innerHTML = html;
    }

    return { isCarousel, body, progressEl, barEl };
  }

  function buildCarousel(sections, wrap, interval, animType) {
    const track    = wrap.querySelector('.xpop-carousel-track');
    const dotsWrap = wrap.querySelector('.xpop-dots');
    const btnPrev  = wrap.querySelector('.xpop-nav-btn[data-dir="-1"]');
    const btnNext  = wrap.querySelector('.xpop-nav-btn[data-dir="1"]');
    const counter  = wrap.querySelector('.xpop-counter');
    const pBar     = wrap.querySelector('.xpop-progress-bar');
    const total    = sections.length;
    let cur = 0, timer = null;

    if (animType === 'crossfade') track.classList.add('xpop-crossfade');

    sections.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'xpop-dot' + (i===0 ? ' xpop-dot-active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    });

    function syncUI() {
      dotsWrap.querySelectorAll('.xpop-dot').forEach((d, i) =>
        d.classList.toggle('xpop-dot-active', i===cur));
      if (counter) counter.textContent = `${cur+1} / ${total}`;
      if (btnPrev) btnPrev.disabled = cur === 0;
      if (btnNext) btnNext.disabled = cur === total-1;
    }

    function goTo(idx) {
      if (idx < 0 || idx >= total) return;
      const dir  = idx > cur ? 'forward' : 'back';
      const prev = cur;
      cur = idx;
      sections[prev].classList.remove('xpop-active', 'xpop-anim-forward', 'xpop-anim-back');
      const nxt = sections[cur];
      nxt.classList.remove('xpop-anim-forward', 'xpop-anim-back');
      void nxt.offsetWidth;
      nxt.classList.add('xpop-active', dir==='forward' ? 'xpop-anim-forward' : 'xpop-anim-back');
      syncUI();
      startProgress();
    }

    function startProgress() {
      clearTimeout(timer);
      if (pBar) { pBar.style.transition = 'none'; pBar.style.width = '0%'; void pBar.offsetWidth; }
      if (interval > 0) {
        if (pBar) { pBar.style.transition = `width ${interval}ms linear`; pBar.style.width = '100%'; }
        timer = setTimeout(() => goTo(cur < total-1 ? cur+1 : 0), interval);
      }
    }

    btnPrev && btnPrev.addEventListener('click', () => goTo(cur-1));
    btnNext && btnNext.addEventListener('click', () => goTo(cur+1));
    sections[0].classList.add('xpop-active');
    syncUI();
    startProgress();

    return { stop: () => clearTimeout(timer) };
  }

  // ─── Modal mode helpers ───────────────────────────────────────────────────────
  //
  // data-popover-modal values:
  //   'true' | 'dialog'            → Bootstrap Modal (centred dialog)
  //   'start' | 'end' | 'top' | 'bottom'  → Bootstrap Offcanvas (side panel)
  //   'false'                      → opt-out even when config.modal is set
  //   (attribute present, no value / empty string) → treated as 'dialog'
  //
  // Global:
  //   PopoverConfig.set({ modal: 'dialog' })   or   modal: 'end'
  //   modal: true  is treated as  modal: 'dialog'
  //
  // Per-trigger overrides (data attribute wins over config):
  //   data-popover-modal-size="600px"      – CSS value or 'sm'|'lg'|'xl' (dialog only)
  //   data-popover-modal-static="true"     – clicking backdrop does NOT close

  const OC_PLACEMENTS = ['start', 'end', 'top', 'bottom'];

  function getModalMode(trigger) {
    const attr = trigger.dataset.popoverModal;
    let val;

    if (attr !== undefined) {
      // Per-trigger attribute exists — it wins over global config
      val = (attr === '') ? 'dialog' : attr;
    } else if (config.modal) {
      val = config.modal;
    } else {
      return null; // not modal mode
    }

    if (val === 'false' || val === false)          return null;
    if (val === true || val === 'true' || val === 'dialog') return 'dialog';
    if (OC_PLACEMENTS.includes(val))               return val;
    return 'dialog'; // unknown value → safe default
  }

  // Lazy-init the shared Bootstrap Modal DOM element
  function ensureModal() {
    let el = document.getElementById('xpop-bs-modal');
    if (el) return el;

    el = document.createElement('div');
    el.className = 'modal fade';
    el.id = 'xpop-bs-modal';
    el.tabIndex = -1;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="modal-dialog modal-dialog-scrollable">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<span class="modal-title fw-bold fs-5"></span>' +
            '<button type="button" class="btn-close btn-close-white ms-auto"' +
              ' data-bs-dismiss="modal" aria-label="Close"></button>' +
          '</div>' +
          '<div class="modal-body"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  // Lazy-init the shared Bootstrap Offcanvas DOM element
  function ensureOffcanvas() {
    let el = document.getElementById('xpop-bs-offcanvas');
    if (el) return el;

    el = document.createElement('div');
    el.className = 'offcanvas';
    el.id = 'xpop-bs-offcanvas';
    el.tabIndex = -1;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="offcanvas-header">' +
        '<span class="offcanvas-title fw-bold fs-5"></span>' +
        '<button type="button" class="btn-close btn-close-white ms-auto"' +
          ' data-bs-dismiss="offcanvas" aria-label="Close"></button>' +
      '</div>' +
      '<div class="offcanvas-body"></div>';
    document.body.appendChild(el);
    return el;
  }

  // Apply theme colours as inline styles to a modal/offcanvas root and its header
  function applyThemeStyles(rootEl, headerEl, titleEl, theme) {
    rootEl.style.background   = theme.bg;
    rootEl.style.borderColor  = theme.borderColor;

    headerEl.style.background        = theme.bg;
    headerEl.style.borderBottomColor  = theme.borderColor;

    titleEl.style.color = theme.titleColor;
  }

  // Resolve Bootstrap named size → CSS class name (dialog only)
  const NAMED_SIZES = { sm: 'modal-sm', lg: 'modal-lg', xl: 'modal-xl' };

  function showModal(trigger) {
    const modalEl  = ensureModal();
    const theme    = getTheme(ra(trigger, 'popoverTheme',      config.theme));
    const title    = trigger.dataset.popoverTitle || '';
    const html     = extractContent(trigger);
    const rawSize  = ra(trigger, 'popoverModalSize',   config.modalSize);
    const isStatic = ra(trigger, 'popoverModalStatic', String(config.modalStatic)) === 'true';

    // Close any open Offcanvas first
    const ocEl = document.getElementById('xpop-bs-offcanvas');
    if (ocEl) {
      const ocInst = bootstrap.Offcanvas.getInstance(ocEl);
      if (ocInst) ocInst.hide();
    }

    // Populate content
    const content = modalEl.querySelector('.modal-content');
    const header  = modalEl.querySelector('.modal-header');
    const titleEl = modalEl.querySelector('.modal-title');
    const body    = modalEl.querySelector('.modal-body');

    applyThemeStyles(content, header, titleEl, theme);
    titleEl.innerHTML = title;
    body.innerHTML    = html;

    // Dialog size
    const dialog = modalEl.querySelector('.modal-dialog');
    dialog.className = 'modal-dialog modal-dialog-scrollable';
    dialog.style.maxWidth = '';

    if (NAMED_SIZES[rawSize]) {
      dialog.classList.add(NAMED_SIZES[rawSize]);
    } else if (rawSize) {
      dialog.style.maxWidth = rawSize;
    }

    // Dispose previous instance so backdrop option can change
    const prev = bootstrap.Modal.getInstance(modalEl);
    if (prev) prev.dispose();

    new bootstrap.Modal(modalEl, {
      backdrop: isStatic ? 'static' : true,
      keyboard: !isStatic,
    }).show();
  }

  function showOffcanvas(trigger, placement) {
    const ocEl    = ensureOffcanvas();
    const theme   = getTheme(ra(trigger, 'popoverTheme',      config.theme));
    const title   = trigger.dataset.popoverTitle || '';
    const html    = extractContent(trigger);
    const rawSize = ra(trigger, 'popoverModalSize',   config.modalSize);
    const isStatic = ra(trigger, 'popoverModalStatic', String(config.modalStatic)) === 'true';

    // Close any open Modal first
    const mEl = document.getElementById('xpop-bs-modal');
    if (mEl) {
      const mInst = bootstrap.Modal.getInstance(mEl);
      if (mInst) mInst.hide();
    }

    // Reset placement class — offcanvas-{start|end|top|bottom}
    ocEl.className = 'offcanvas offcanvas-' + placement;

    // Size: start/end → width, top/bottom → height
    ocEl.style.width  = '';
    ocEl.style.height = '';
    if (rawSize) {
      if (placement === 'start' || placement === 'end') {
        ocEl.style.width  = rawSize;
      } else {
        ocEl.style.height = rawSize;
      }
    }

    // Populate content
    const header  = ocEl.querySelector('.offcanvas-header');
    const titleEl = ocEl.querySelector('.offcanvas-title');
    const body    = ocEl.querySelector('.offcanvas-body');

    applyThemeStyles(ocEl, header, titleEl, theme);
    titleEl.innerHTML = title;
    body.innerHTML    = html;

    // Dispose previous instance so options can change
    const prev = bootstrap.Offcanvas.getInstance(ocEl);
    if (prev) prev.dispose();

    new bootstrap.Offcanvas(ocEl, {
      backdrop: true,
      keyboard: !isStatic,
      scroll:   false,
    }).show();
  }

  // ─── Panel mode ──────────────────────────────────────────────────────────────
  //
  // Usage A — per-trigger:
  //   <span data-popover-content="…" data-popover-panel="#notes-box">…</span>
  //
  // Usage B — global (all triggers go to the same panel):
  //   PopoverConfig.set({ panelTarget: '#notes-box' });
  //
  // Usage C — opt a single trigger out of the global panel:
  //   <span data-popover-content="…" data-popover-panel="false">…</span>
  //
  // Optional — custom source label (falls back to trigger text):
  //   data-popover-label="My label"

  function getPanelTargetEl(trigger) {
    const attr = trigger.dataset.popoverPanel;
    if (attr === 'false') return null;
    const selector = (attr !== undefined && attr !== '') ? attr : config.panelTarget;
    if (!selector) return null;
    try { return document.querySelector(selector) || null; } catch { return null; }
  }

  function clearPanel() {
    if (panelActiveTrigger) {
      panelActiveTrigger.classList.remove('xpop-panel-active');
      panelActiveTrigger = null;
    }
    if (panelCarouselState) { panelCarouselState.stop(); panelCarouselState = null; }
  }

  function renderToPanel(trigger, panelEl) {
    const same = panelActiveTrigger === trigger;
    clearPanel();
    if (same) { panelEl.innerHTML = ''; return; }   // second click → toggle off

    const themeName = ra(trigger, 'popoverTheme',       config.theme);
    const fontSize  = ra(trigger, 'popoverFontsize',    config.fontSize);
    const bStyle    = ra(trigger, 'popoverBorder',      config.borderStyle);
    const title     = trigger.dataset.popoverTitle      || '';
    const cInterval = parseInt(ra(trigger, 'popoverInterval',    config.carousel.interval), 10);
    const cAnim     = ra(trigger, 'popoverCarouselAnim',config.carousel.animation);
    const label     = trigger.dataset.popoverLabel      || trigger.textContent.trim().slice(0, 60);
    const theme     = getTheme(themeName);
    const html      = extractContent(trigger);

    trigger.style.setProperty('--xpop-hint-color', theme.borderColor);

    const { isCarousel, body, progressEl, barEl } = buildContentDOM(html);

    const wrap = document.createElement('div');
    wrap.className = 'xpop-panel-wrap';
    wrap.style.setProperty('--xpop-bg',           theme.bg);
    wrap.style.setProperty('--xpop-title-color',  theme.titleColor);
    wrap.style.setProperty('--xpop-border-color', theme.borderColor);
    wrap.style.setProperty('--xpop-font-size',    fontSize);
    wrap.style.borderStyle = bStyle;

    if (label) {
      const src = document.createElement('div');
      src.className = 'xpop-panel-source';
      src.textContent = label;
      wrap.appendChild(src);
    }

    const hdr = document.createElement('div');
    hdr.className = 'xpop-header';
    hdr.innerHTML = title;
    wrap.appendChild(hdr);
    wrap.appendChild(body);

    if (isCarousel) {
      wrap.appendChild(progressEl);
      wrap.appendChild(barEl);
    }

    panelEl.innerHTML = '';
    panelEl.appendChild(wrap);

    if (isCarousel) {
      panelCarouselState = buildCarousel(
        Array.from(wrap.querySelectorAll('.xpop-carousel-track section')),
        wrap, cInterval, cAnim
      );
    }

    trigger.classList.add('xpop-panel-active');
    panelActiveTrigger = trigger;
  }

  function createPopover(trigger) {
    const themeName = ra(trigger, 'popoverTheme',      config.theme);
    const placement = ra(trigger, 'popoverPlacement',  config.placement);
    const bStyle    = ra(trigger, 'popoverBorder',     config.borderStyle);
    const fontSize  = ra(trigger, 'popoverFontsize',   config.fontSize);
    const maxWidth  = ra(trigger, 'popoverMaxwidth',   config.maxWidth);
    const showArrow = ra(trigger, 'popoverArrow', 'true') !== 'false';
    const title     = trigger.dataset.popoverTitle     || '';
    const cInterval = parseInt(ra(trigger, 'popoverInterval',   config.carousel.interval), 10);
    const cAnim     = ra(trigger, 'popoverCarouselAnim', config.carousel.animation);
    const theme     = getTheme(themeName);
    const html      = extractContent(trigger);

    const { isCarousel, body, progressEl, barEl } = buildContentDOM(html);

    const pop = document.createElement('div');
    pop.className = 'xpop-container';
    pop.dataset.placement = placement;
    pop.style.setProperty('--xpop-bg',           theme.bg);
    pop.style.setProperty('--xpop-title-color',  theme.titleColor);
    pop.style.setProperty('--xpop-border-color', theme.borderColor);
    pop.style.setProperty('--xpop-font-size',    fontSize);
    pop.style.setProperty('--xpop-max-width',    maxWidth);
    pop.style.borderStyle = bStyle;
    trigger.style.setProperty('--xpop-hint-color', theme.borderColor);

    if (showArrow) {
      const a = document.createElement('div');
      a.className = 'xpop-arrow';
      pop.appendChild(a);
    }

    const hdr = document.createElement('div');
    hdr.className = 'xpop-header';
    hdr.innerHTML = title;
    pop.appendChild(hdr);
    pop.appendChild(body);
    if (isCarousel) {
      pop.appendChild(progressEl);
      pop.appendChild(barEl);
    }

    document.body.appendChild(pop);

    const offset = parseInt(ra(trigger, 'popoverOffset', config.offset), 10);
    const { top, left, finalPlacement } = calcPosition(trigger, pop, placement, offset);
    pop.dataset.placement = finalPlacement;
    pop.style.setProperty('--xpop-origin', originOf(finalPlacement));
    pop.style.top  = top  + 'px';
    pop.style.left = left + 'px';
    if (isCarousel) {
      carouselState = buildCarousel(
        Array.from(pop.querySelectorAll('.xpop-carousel-track section')),
        pop, cInterval, cAnim
      );
    }
    requestAnimationFrame(() => requestAnimationFrame(() => pop.classList.add('xpop-visible')));
    return pop;
  }

  function closePop() {
    if (!currentPop) return;
    if (carouselState) { carouselState.stop(); carouselState = null; }
    const pop = currentPop;
    pop.classList.remove('xpop-visible');
    setTimeout(() => pop.parentNode && pop.parentNode.removeChild(pop), 230);
    currentPop = currentTrigger = null;
  }

  // ─── Unified click handler ────────────────────────────────────────────────────

  document.addEventListener('click', function (e) {
    const trigger = e.target.closest(
      '[data-popover-title],[data-popover-content],[data-popover-target]'
    );

    if (trigger) {
      e.stopPropagation();

      // ① Modal / Offcanvas mode (highest priority)
      const modalMode = getModalMode(trigger);
      if (modalMode) {
        closePop();
        clearPanel();
        if (modalMode === 'dialog') {
          showModal(trigger);
        } else {
          showOffcanvas(trigger, modalMode);
        }
        return;
      }

      // ② Panel mode
      const panelEl = getPanelTargetEl(trigger);
      if (panelEl) {
        closePop();
        renderToPanel(trigger, panelEl);
        return;
      }

      // ③ Floating Popover (default)
      if (currentTrigger === trigger) { closePop(); return; }
      closePop();
      currentTrigger = trigger;
      currentPop = createPopover(trigger);
      return;
    }

    if (currentPop && currentPop.contains(e.target)) return;
    closePop();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });

  window.addEventListener('resize', function () {
    if (!currentPop || !currentTrigger) return;
    const p = currentTrigger.dataset.popoverPlacement || config.placement;
    const o = parseInt(ra(currentTrigger, 'popoverOffset', config.offset), 10);
    const { top, left, finalPlacement } = calcPosition(currentTrigger, currentPop, p, o);
    currentPop.dataset.placement = finalPlacement;
    currentPop.style.setProperty('--xpop-origin', originOf(finalPlacement));
    currentPop.style.top  = top  + 'px';
    currentPop.style.left = left + 'px';
  });

  injectCSS();
})();

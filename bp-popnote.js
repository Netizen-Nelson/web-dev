(function () {
  'use strict';

  // ─── CSS ────────────────────────────────────────────────────────────────────
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
      opacity: 0.7; font-variant-numeric: tabular-nums;
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

    /* ── Panel mode ──────────────────────────────────────────── */
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
      opacity: 0.62;
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
  `;

  // ─── Brand colour themes ─────────────────────────────────────────────────────
  //
  // Naming follows the user's personal palette:
  //   lavender #C3A5E5 · sky #08a9d1 · warning #F08080 · safe #40c99a
  //   special  #C8DD5A · yellow #DECA4B · salmon #E5C3B3 · pink #FFB3D9
  //   stone    #95BDD7 · orange #eda109 · vanilla #FDF6ED · info #5fafed
  //
  // Legacy aliases kept so existing markup continues to work unchanged.
  const THEMES = {
    // ── primary ─────────────────────────────────────────────
    dark:      { bg: '#130e1e', titleColor: '#C3A5E5', borderColor: '#C3A5E5' },
    lavender:  { bg: '#130e1e', titleColor: '#C3A5E5', borderColor: '#C3A5E5' }, // alias
    sky:       { bg: '#091522', titleColor: '#08a9d1', borderColor: '#08a9d1' },
    warning:   { bg: '#190d0d', titleColor: '#F08080', borderColor: '#F08080' },
    success:   { bg: '#0a160f', titleColor: '#40c99a', borderColor: '#40c99a' },
    safe:      { bg: '#0a160f', titleColor: '#40c99a', borderColor: '#40c99a' }, // alias
    special:   { bg: '#111605', titleColor: '#C8DD5A', borderColor: '#C8DD5A' },
    highlight: { bg: '#111605', titleColor: '#C8DD5A', borderColor: '#C8DD5A' }, // alias
    note:      { bg: '#161205', titleColor: '#DECA4B', borderColor: '#DECA4B' },
    yellow:    { bg: '#161205', titleColor: '#DECA4B', borderColor: '#DECA4B' }, // alias
    salmon:    { bg: '#180e0a', titleColor: '#E5C3B3', borderColor: '#E5C3B3' },
    pink:      { bg: '#180a12', titleColor: '#FFB3D9', borderColor: '#FFB3D9' },
    stone:     { bg: '#0d1620', titleColor: '#95BDD7', borderColor: '#95BDD7' },
    orange:    { bg: '#181005', titleColor: '#eda109', borderColor: '#eda109' },
    vanilla:   { bg: '#181614', titleColor: '#FDF6ED', borderColor: '#FDF6ED' },
    info:      { bg: '#0a1522', titleColor: '#5fafed', borderColor: '#5fafed' },
  };

  // ─── Global config ───────────────────────────────────────────────────────────
  let config = {
    theme:       'dark',
    maxWidth:    '560px',
    offset:      8,
    fontSize:    '1rem',
    borderStyle: 'solid',
    placement:   'top',
    carousel:    { animation: 'slide', interval: 3000 },
    // panelTarget: null  ← set to a CSS selector (e.g. '#my-notes') to enable
    //                      global panel mode for every trigger
    panelTarget: null,
    _customThemes: {},
  };

  window.PopoverConfig = {
    set(opts) {
      if (opts.carousel) { Object.assign(config.carousel, opts.carousel); delete opts.carousel; }
      Object.assign(config, opts);
    },
    addTheme(name, def) { config._customThemes[name] = def; },
  };

  // ─── State ───────────────────────────────────────────────────────────────────
  let currentPop = null, currentTrigger = null, carouselState = null; // floating popup
  let panelActiveTrigger = null, panelCarouselState = null;           // panel mode

  // ─── Utilities ───────────────────────────────────────────────────────────────
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

  // ─── Shared content extraction ───────────────────────────────────────────────
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

  // ─── Shared DOM builder (popup + panel) ─────────────────────────────────────
  // Returns { isCarousel, body, progressEl, barEl }
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

  // ─── Carousel engine ─────────────────────────────────────────────────────────
  // Works for both floating popup and panel — wrap is the common ancestor.
  // Returns { stop } so the caller can cancel the auto-advance timer.
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

    // Replace panel contents — replacing the node forces the animation to replay
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

  // ─── Floating popup mode ─────────────────────────────────────────────────────
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

  // ─── Event handling ──────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest(
      '[data-popover-title],[data-popover-content],[data-popover-target]'
    );

    if (trigger) {
      e.stopPropagation();
      const panelEl = getPanelTargetEl(trigger);

      if (panelEl) {
        // Panel mode — close any floating popup first
        closePop();
        renderToPanel(trigger, panelEl);
        return;
      }

      // Floating popup mode
      if (currentTrigger === trigger) { closePop(); return; }
      closePop();
      currentTrigger = trigger;
      currentPop = createPopover(trigger);
      return;
    }

    // Click outside — close popup
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

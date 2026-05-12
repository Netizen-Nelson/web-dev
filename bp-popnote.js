/**
 * bp-popnote.js
 * 自製 Popover 元件，無需任何外部依賴
 * 支援大塊 HTML、垂直輪播、九種主題
 * 使用方式：只需引入此單一 JS 檔案
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  //  注入 CSS
  // ─────────────────────────────────────────────
  const CSS = `
    /* ── 觸發元素提示樣式 ── */
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

    /* ── 主容器 ── */
    .xpop-container {
      position: fixed;
      z-index: 99999;
      max-width: var(--xpop-max-width, 560px);
      min-width: 220px;
      border-radius: 8px;
      border-width: 1px;
      border-style: var(--xpop-border-style, solid);
      border-color: var(--xpop-border-color, #C3A5E5);
      background: var(--xpop-bg, #240518);
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

    /* ── 箭頭 ── */
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
      border-top-color: var(--xpop-bg, #240518);
    }
    .xpop-container[data-placement="bottom"] .xpop-arrow::after {
      top: 1px; left: -7px;
      border-bottom-color: var(--xpop-bg, #240518);
    }
    .xpop-container[data-placement="left"] .xpop-arrow::after {
      right: 1px; top: -7px;
      border-left-color: var(--xpop-bg, #240518);
    }
    .xpop-container[data-placement="right"] .xpop-arrow::after {
      left: 1px; top: -7px;
      border-right-color: var(--xpop-bg, #240518);
    }

    /* ── 標題列 ── */
    .xpop-header {
      padding: 10px 16px 8px;
      font-size: calc(var(--xpop-font-size, 1rem) * 1.05);
      font-weight: 700;
      color: var(--xpop-title-color, #C3A5E5);
      border-bottom: 1px solid var(--xpop-border-color, #C3A5E5);
      letter-spacing: 0.03em;
    }
    .xpop-header:empty { display: none; }

    /* ── body ── */
    .xpop-body {
      padding: 12px 16px 14px;
    }

    /* ══════════════════════════════════════════
       輪播：display:none/block + CSS keyframe
       完全不用 translateY，無高度計算問題
    ══════════════════════════════════════════ */
    .xpop-carousel-track { width: 100%; }

    .xpop-carousel-track section {
      display: none;
      width: 100%;
      box-sizing: border-box;
      padding: 2px 0;
    }
    .xpop-carousel-track section.xpop-active {
      display: block;
    }
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

    /* ── 控制列 ── */
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
    .xpop-progress { height: 2px; background: rgba(255,255,255,0.08); position: relative; overflow: hidden; }
    .xpop-progress-bar {
      position: absolute; left: 0; top: 0;
      height: 100%; width: 0%;
      background: var(--xpop-title-color, #C3A5E5);
      transition: width linear;
    }
  `;

  // ─────────────────────────────────────────────
  //  主題
  // ─────────────────────────────────────────────
  const THEMES = {
    dark:      { bg: '#240518', titleColor: '#C3A5E5', borderColor: '#C3A5E5' },
    info:      { bg: '#0c1a2e', titleColor: '#08a9d1', borderColor: '#08a9d1' },
    warning:   { bg: '#1e0e0e', titleColor: '#F08080', borderColor: '#F08080' },
    success:   { bg: '#0a1e18', titleColor: '#40c99a', borderColor: '#40c99a' },
    highlight: { bg: '#1a1e04', titleColor: '#C8DD5A', borderColor: '#C8DD5A' },
    note:      { bg: '#1e1812', titleColor: '#DECA4B', borderColor: '#DECA4B' },
    pink:      { bg: '#1e0818', titleColor: '#FFB3D9', borderColor: '#FFB3D9' },
    salmon:    { bg: '#1e1210', titleColor: '#E5C3B3', borderColor: '#E5C3B3' },
    safe:      { bg: '#0c1826', titleColor: '#5fafed', borderColor: '#5fafed' },
  };

  // ─────────────────────────────────────────────
  //  全域設定
  // ─────────────────────────────────────────────
  let config = {
    theme: 'dark', maxWidth: '560px', offset: 8,
    fontSize: '1rem', borderStyle: 'solid',
    placement: 'top',
    carousel: { animation: 'slide', interval: 3000 },
    _customThemes: {},
  };

  window.PopoverConfig = {
    set(opts) {
      if (opts.carousel) { Object.assign(config.carousel, opts.carousel); delete opts.carousel; }
      Object.assign(config, opts);
    },
    addTheme(name, def) { config._customThemes[name] = def; },
  };

  // ─────────────────────────────────────────────
  //  狀態
  // ─────────────────────────────────────────────
  let currentPop = null, currentTrigger = null, carouselState = null;

  function getTheme(n) { return config._customThemes[n] || THEMES[n] || THEMES.dark; }
  function ra(el, k, fb) { return el.dataset[k] !== undefined ? el.dataset[k] : fb; }

  function injectCSS() {
    if (document.getElementById('bp-popnote-style')) return;
    const s = document.createElement('style');
    s.id = 'bp-popnote-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────
  //  定位
  // ─────────────────────────────────────────────
  function calcPosition(trigger, pop, placement, offset) {
    const tr = trigger.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const pos = {
      top:    { top: tr.top - ph - offset,            left: tr.left + tr.width/2 - pw/2 },
      bottom: { top: tr.bottom + offset,               left: tr.left + tr.width/2 - pw/2 },
      left:   { top: tr.top + tr.height/2 - ph/2,     left: tr.left - pw - offset },
      right:  { top: tr.top + tr.height/2 - ph/2,     left: tr.right + offset },
    };
    let p = placement;
    if (p==='top'    && pos.top.top < 8)              p = 'bottom';
    if (p==='bottom' && pos.bottom.top+ph > vh-8)     p = 'top';
    if (p==='left'   && pos.left.left < 8)            p = 'right';
    if (p==='right'  && pos.right.left+pw > vw-8)     p = 'left';
    let { top, left } = pos[p];
    left = Math.max(8, Math.min(left, vw-pw-8));
    top  = Math.max(8, Math.min(top,  vh-ph-8));
    return { top, left, finalPlacement: p };
  }

  function originOf(p) {
    return ({top:'center bottom',bottom:'center top',left:'right center',right:'left center'})[p] || 'center bottom';
  }

  // ─────────────────────────────────────────────
  //  輪播
  // ─────────────────────────────────────────────
  function buildCarousel(sections, pop, interval, animType) {
    const track    = pop.querySelector('.xpop-carousel-track');
    const dotsWrap = pop.querySelector('.xpop-dots');
    const btnPrev  = pop.querySelector('.xpop-nav-btn[data-dir="-1"]');
    const btnNext  = pop.querySelector('.xpop-nav-btn[data-dir="1"]');
    const counter  = pop.querySelector('.xpop-counter');
    const pBar     = pop.querySelector('.xpop-progress-bar');
    const total    = sections.length;
    let cur = 0, timer = null;

    if (animType === 'crossfade') track.classList.add('xpop-crossfade');

    // 點點
    sections.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'xpop-dot' + (i===0 ? ' xpop-dot-active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    });

    function syncUI() {
      dotsWrap.querySelectorAll('.xpop-dot').forEach((d,i) => d.classList.toggle('xpop-dot-active', i===cur));
      if (counter) counter.textContent = `${cur+1} / ${total}`;
      if (btnPrev) btnPrev.disabled = cur === 0;
      if (btnNext) btnNext.disabled = cur === total-1;
    }

    function goTo(idx) {
      if (idx < 0 || idx >= total) return;
      const dir = idx > cur ? 'forward' : 'back';
      const prev = cur;
      cur = idx;

      // 隱藏舊頁
      const old = sections[prev];
      old.classList.remove('xpop-active','xpop-anim-forward','xpop-anim-back');

      // 顯示新頁
      const nxt = sections[cur];
      nxt.classList.remove('xpop-anim-forward','xpop-anim-back');
      void nxt.offsetWidth; // reflow
      nxt.classList.add('xpop-active', dir==='forward' ? 'xpop-anim-forward' : 'xpop-anim-back');

      syncUI();
      startProgress();
    }

    function startProgress() {
      clearTimeout(timer);
      if (pBar) {
        pBar.style.transition = 'none';
        pBar.style.width = '0%';
        void pBar.offsetWidth;
      }
      if (interval > 0) {
        if (pBar) {
          pBar.style.transition = `width ${interval}ms linear`;
          pBar.style.width = '100%';
        }
        timer = setTimeout(() => goTo(cur < total-1 ? cur+1 : 0), interval);
      }
    }

    btnPrev && btnPrev.addEventListener('click', () => goTo(cur-1));
    btnNext && btnNext.addEventListener('click', () => goTo(cur+1));

    // 第一頁直接顯示（不加動畫）
    sections[0].classList.add('xpop-active');
    syncUI();
    startProgress();

    carouselState = { stop: () => clearTimeout(timer) };
  }

  // ─────────────────────────────────────────────
  //  建立 Popover
  // ─────────────────────────────────────────────
  function createPopover(trigger) {
    const themeName   = ra(trigger,'popoverTheme',       config.theme);
    const placement   = ra(trigger,'popoverPlacement',   config.placement);
    const borderStyle = ra(trigger,'popoverBorder',      config.borderStyle);
    const fontSize    = ra(trigger,'popoverFontsize',    config.fontSize);
    const maxWidth    = ra(trigger,'popoverMaxwidth',    config.maxWidth);
    const showArrow   = ra(trigger,'popoverArrow','true') !== 'false';
    const title       = trigger.dataset.popoverTitle   || '';
    const inlineCont  = trigger.dataset.popoverContent || '';
    const targetId    = trigger.dataset.popoverTarget  || '';
    const cInterval   = parseInt(ra(trigger,'popoverInterval', config.carousel.interval), 10);
    const cAnim       = ra(trigger,'popoverCarouselAnim', config.carousel.animation);

    const theme = getTheme(themeName);

    // 取內容
    let contentHTML = '';
    if (targetId) {
      const tpl = document.querySelector(targetId);
      if (tpl && tpl.content) {
        const d = document.createElement('div');
        d.appendChild(tpl.content.cloneNode(true));
        contentHTML = d.innerHTML;
      } else if (tpl) {
        contentHTML = tpl.innerHTML;
      }
    } else {
      contentHTML = inlineCont;
    }

    // 偵測輪播
    const tmp = document.createElement('div');
    tmp.innerHTML = contentHTML;
    const secs = Array.from(tmp.querySelectorAll(':scope > section'));
    const isCarousel = secs.length > 1;

    // 容器
    const pop = document.createElement('div');
    pop.className = 'xpop-container';
    pop.dataset.placement = placement;
    pop.style.setProperty('--xpop-bg',          theme.bg);
    pop.style.setProperty('--xpop-title-color', theme.titleColor);
    pop.style.setProperty('--xpop-border-color',theme.borderColor);
    pop.style.setProperty('--xpop-font-size',   fontSize);
    pop.style.setProperty('--xpop-max-width',   maxWidth);
    pop.style.borderStyle = borderStyle;
    trigger.style.setProperty('--xpop-hint-color', theme.borderColor);

    // 箭頭
    if (showArrow) {
      const a = document.createElement('div');
      a.className = 'xpop-arrow';
      pop.appendChild(a);
    }

    // 標題
    const hdr = document.createElement('div');
    hdr.className = 'xpop-header';
    hdr.innerHTML = title;
    pop.appendChild(hdr);

    // Body
    const body = document.createElement('div');
    body.className = 'xpop-body';

    if (isCarousel) {
      const track = document.createElement('div');
      track.className = 'xpop-carousel-track';
      secs.forEach(sec => {
        const s = document.createElement('section');
        s.innerHTML = sec.innerHTML;
        track.appendChild(s);
      });
      body.appendChild(track);
      pop.appendChild(body);

      // 進度條
      const prog = document.createElement('div');
      prog.className = 'xpop-progress';
      const pb = document.createElement('div');
      pb.className = 'xpop-progress-bar';
      prog.appendChild(pb);
      pop.appendChild(prog);

      // 控制列
      const bar = document.createElement('div');
      bar.className = 'xpop-carousel-bar';
      const dots = document.createElement('div');
      dots.className = 'xpop-dots';
      const nav = document.createElement('div');
      nav.className = 'xpop-nav';
      const bp = document.createElement('button');
      bp.className = 'xpop-nav-btn'; bp.dataset.dir = '-1'; bp.innerHTML = '&#8593;';
      const bn = document.createElement('button');
      bn.className = 'xpop-nav-btn'; bn.dataset.dir = '1'; bn.innerHTML = '&#8595;';
      const ctr = document.createElement('span');
      ctr.className = 'xpop-counter';
      nav.appendChild(bp); nav.appendChild(ctr); nav.appendChild(bn);
      bar.appendChild(dots); bar.appendChild(nav);
      pop.appendChild(bar);
    } else {
      body.innerHTML = contentHTML;
      pop.appendChild(body);
    }

    document.body.appendChild(pop);

    // 定位
    const offset = parseInt(ra(trigger,'popoverOffset', config.offset), 10);
    const { top, left, finalPlacement } = calcPosition(trigger, pop, placement, offset);
    pop.dataset.placement = finalPlacement;
    pop.style.setProperty('--xpop-origin', originOf(finalPlacement));
    pop.style.top  = top  + 'px';
    pop.style.left = left + 'px';

    // 啟動輪播
    if (isCarousel) {
      buildCarousel(
        Array.from(pop.querySelectorAll('.xpop-carousel-track section')),
        pop, cInterval, cAnim
      );
    }

    // 顯示動畫
    requestAnimationFrame(() => requestAnimationFrame(() => pop.classList.add('xpop-visible')));

    return pop;
  }

  // ─────────────────────────────────────────────
  //  關閉
  // ─────────────────────────────────────────────
  function closePop() {
    if (!currentPop) return;
    if (carouselState) { carouselState.stop(); carouselState = null; }
    const pop = currentPop;
    pop.classList.remove('xpop-visible');
    setTimeout(() => pop.parentNode && pop.parentNode.removeChild(pop), 230);
    currentPop = currentTrigger = null;
  }

  // ─────────────────────────────────────────────
  //  事件
  // ─────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    const trigger = e.target.closest('[data-popover-title],[data-popover-content],[data-popover-target]');
    if (trigger) {
      e.stopPropagation();
      if (currentTrigger === trigger) { closePop(); return; }
      closePop();
      currentTrigger = trigger;
      currentPop = createPopover(trigger);
      return;
    }
    if (currentPop && currentPop.contains(e.target)) return;
    closePop();
  });

  document.addEventListener('keydown', e => { if (e.key==='Escape') closePop(); });

  window.addEventListener('resize', function() {
    if (!currentPop || !currentTrigger) return;
    const p = currentTrigger.dataset.popoverPlacement || config.placement;
    const o = parseInt(ra(currentTrigger,'popoverOffset', config.offset), 10);
    const { top, left, finalPlacement } = calcPosition(currentTrigger, currentPop, p, o);
    currentPop.dataset.placement = finalPlacement;
    currentPop.style.setProperty('--xpop-origin', originOf(finalPlacement));
    currentPop.style.top  = top  + 'px';
    currentPop.style.left = left + 'px';
  });

  injectCSS();

})();

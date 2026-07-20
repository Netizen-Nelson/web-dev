(function () {
  'use strict';

  const BRAND = {
    bg:       '#0c0d0c',
    shell:    '#c6c7bd',
    lavender: '#C3A5E5',
    special:  '#C8DD5A',
    warning:  '#F08080',
    salmon:   '#E5C3B3',
    sky:      '#08a9d1',
    safe:     '#40c99a',
    yellow:   '#DECA4B',
    info:     '#5fafed',
    stone:    '#7090A8',
    pink:     '#FFB3D9',
    orange:   '#eda109',
  };

  const THEMES = {
    lavender: { color: BRAND.lavender, colorActive: BRAND.special,  colorDone: BRAND.safe,    titleColor: BRAND.lavender, badgeBg: 'rgba(195,165,229,0.15)' },
    sky:      { color: BRAND.sky,      colorActive: BRAND.info,     colorDone: BRAND.safe,    titleColor: BRAND.sky,      badgeBg: 'rgba(8,169,209,0.12)'   },
    safe:     { color: BRAND.safe,     colorActive: BRAND.yellow,   colorDone: BRAND.special, titleColor: BRAND.safe,     badgeBg: 'rgba(64,201,154,0.12)'  },
    special:  { color: BRAND.special,  colorActive: BRAND.yellow,   colorDone: BRAND.safe,    titleColor: BRAND.special,  badgeBg: 'rgba(200,221,90,0.12)'  },
    warning:  { color: BRAND.warning,  colorActive: BRAND.orange,   colorDone: BRAND.salmon,  titleColor: BRAND.warning,  badgeBg: 'rgba(240,128,128,0.12)' },
    salmon:   { color: BRAND.salmon,   colorActive: BRAND.pink,     colorDone: BRAND.safe,    titleColor: BRAND.salmon,   badgeBg: 'rgba(229,195,179,0.12)' },
    stone:    { color: BRAND.stone,    colorActive: BRAND.sky,      colorDone: BRAND.safe,    titleColor: BRAND.stone,    badgeBg: 'rgba(112,144,168,0.14)' },
    pink:     { color: BRAND.pink,     colorActive: BRAND.lavender, colorDone: BRAND.safe,    titleColor: BRAND.pink,     badgeBg: 'rgba(255,179,217,0.12)' },
    orange:   { color: BRAND.orange,   colorActive: BRAND.yellow,   colorDone: BRAND.safe,    titleColor: BRAND.orange,   badgeBg: 'rgba(237,161,9,0.12)'   },
    shell:    { color: BRAND.shell,    colorActive: BRAND.info,     colorDone: BRAND.safe,    titleColor: BRAND.shell,    badgeBg: 'rgba(198,199,189,0.13)' },
  };

  const defaults = {
    color:          BRAND.lavender,
    colorActive:    BRAND.special,
    colorDone:      BRAND.safe,
    colorError:     BRAND.warning,
    textColor:      BRAND.shell,
    titleColor:     BRAND.lavender,
    badgeBg:        'rgba(195,165,229,0.15)',
    cardBg:         'rgba(12,13,12,0.55)',
    cardBgActive:   'rgba(200,221,90,0.07)',
    cardBgDone:     'rgba(64,201,154,0.07)',
    cardBgError:    'rgba(240,128,128,0.07)',
    stroke:         '2px',
    radius:         '12px',
    cardWidth:      '220px',
    cardPadding:    '16px 18px',
    gap:            '36px',
    badgeSize:      '28px',
    fontSize:       '0.9rem',
    titleSize:      '1rem',
    badgeFontSize:  '0.82rem',
    connectorStyle: 'solid',
    arrowSize:      '6px',
    padTop:         '32px',
    padBottom:      '32px',
    padX:           '12px',
    theme:          null,
    autoNumber:     true,
  };

  function buildCSS() {
    return `
.bp-stepper {
  display: flex;
  overflow-x: auto;
  align-items: stretch;
  gap: var(--bps-gap);
  padding-top:    var(--bps-pad-top);
  padding-bottom: var(--bps-pad-bottom);
  padding-left:   var(--bps-pad-x);
  padding-right:  var(--bps-pad-x);
  scrollbar-width: thin;
  scrollbar-color: var(--bps-color) rgba(255,255,255,0.05);
  box-sizing: border-box;
  --bps-pad-top:        32px;
  --bps-pad-bottom:     32px;
  --bps-pad-x:          12px;
  --bps-color:          ${BRAND.lavender};
  --bps-color-active:   ${BRAND.special};
  --bps-color-done:     ${BRAND.safe};
  --bps-color-error:    ${BRAND.warning};
  --bps-text:           ${BRAND.shell};
  --bps-title:          ${BRAND.lavender};
  --bps-badge-bg:       rgba(195,165,229,0.15);
  --bps-card-bg:        rgba(12,13,12,0.55);
  --bps-card-bg-act:    rgba(200,221,90,0.07);
  --bps-card-bg-done:   rgba(64,201,154,0.07);
  --bps-card-bg-err:    rgba(240,128,128,0.07);
  --bps-stroke:         2px;
  --bps-radius:         12px;
  --bps-width:          220px;
  --bps-padding:        16px 18px;
  --bps-gap:            36px;
  --bps-badge-sz:       28px;
  --bps-fs:             0.9rem;
  --bps-title-fs:       1rem;
  --bps-badge-fs:       0.82rem;
  --bps-arrow:          6px;
}

.bp-step {
  flex: 0 0 var(--bps-width);
  border: var(--bps-stroke) solid var(--bps-color);
  border-radius: var(--bps-radius);
  padding: var(--bps-padding);
  position: relative;
  background: var(--bps-card-bg);
  color: var(--bps-text);
  font-size: var(--bps-fs);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color .28s, background .28s, box-shadow .28s, transform .18s;
  box-sizing: border-box;
}

.bp-step[data-state="active"] {
  border-color: var(--bps-color-active);
  background:   var(--bps-card-bg-act);
  box-shadow:   0 0 16px -5px var(--bps-color-active);
}
.bp-step[data-state="active"] .bp-step-badge {
  background:   var(--bps-color-active);
  border-color: var(--bps-color-active);
  color:        #0c0d0c;
}
.bp-step[data-state="active"] .bp-step-title { color: var(--bps-color-active); }

.bp-step[data-state="done"] {
  border-color: var(--bps-color-done);
  background:   var(--bps-card-bg-done);
}
.bp-step[data-state="done"] .bp-step-badge {
  background:   var(--bps-color-done);
  border-color: var(--bps-color-done);
  color:        #0c0d0c;
}
.bp-step[data-state="done"] .bp-step-title { color: var(--bps-color-done); }
.bp-step[data-state="done"] .bp-step-desc  { opacity: .65; }

.bp-step[data-state="error"] {
  border-color: var(--bps-color-error);
  background:   var(--bps-card-bg-err);
  box-shadow:   0 0 14px -5px var(--bps-color-error);
}
.bp-step[data-state="error"] .bp-step-badge {
  background:   var(--bps-color-error);
  border-color: var(--bps-color-error);
  color:        #0c0d0c;
}
.bp-step[data-state="error"] .bp-step-title { color: var(--bps-color-error); }

.bp-step-badge {
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  width:           var(--bps-badge-sz);
  height:          var(--bps-badge-sz);
  border-radius:   50%;
  border:          var(--bps-stroke) solid var(--bps-color);
  background:      var(--bps-badge-bg);
  font-size:       var(--bps-badge-fs);
  font-weight:     700;
  color:           var(--bps-color);
  flex-shrink:     0;
  margin-bottom:   4px;
  transition:      background .28s, color .28s, border-color .28s;
}

.bp-step-title {
  font-size:   var(--bps-title-fs);
  font-weight: 600;
  color:       var(--bps-title);
  line-height: 1.3;
  transition:  color .28s;
}

.bp-step-desc {
  font-size:   var(--bps-fs);
  color:       var(--bps-text);
  opacity:     .82;
  line-height: 1.55;
  transition:  opacity .28s;
}

.bp-step-icon {
  font-size:     1.4rem;
  line-height:   1;
  margin-bottom: 2px;
  user-select:   none;
}

.bp-step:not(:last-child)::after {
  content:          '';
  position:         absolute;
  right:            calc(-1 * var(--bps-gap));
  top:              50%;
  width:            var(--bps-gap);
  height:           var(--bps-stroke);
  background-color: var(--bps-color);
  transform:        translateY(-50%);
  z-index:          0;
  transition:       background-color .28s;
}
.bp-step:not(:last-child)::before {
  content:       '';
  position:      absolute;
  right:         calc(-1 * var(--bps-gap));
  top:           50%;
  transform:     translateY(-50%);
  border-left:   calc(var(--bps-arrow) * 1.5) solid var(--bps-color);
  border-top:    var(--bps-arrow) solid transparent;
  border-bottom: var(--bps-arrow) solid transparent;
  z-index:       1;
  transition:    border-left-color .28s;
}

.bp-step[data-state="done"]:not(:last-child)::after    { background-color:  var(--bps-color-done);   }
.bp-step[data-state="done"]:not(:last-child)::before   { border-left-color: var(--bps-color-done);   }
.bp-step[data-state="active"]:not(:last-child)::after  { background-color:  var(--bps-color-active); }
.bp-step[data-state="active"]:not(:last-child)::before { border-left-color: var(--bps-color-active); }
.bp-step[data-state="error"]:not(:last-child)::after   { background-color:  var(--bps-color-error);  }
.bp-step[data-state="error"]:not(:last-child)::before  { border-left-color: var(--bps-color-error);  }

.bp-stepper[data-connector="dashed"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color) 0, var(--bps-color) 6px, transparent 6px, transparent 13px);
}
.bp-stepper[data-connector="dashed"] .bp-step[data-state="done"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color-done) 0, var(--bps-color-done) 6px, transparent 6px, transparent 13px);
}
.bp-stepper[data-connector="dashed"] .bp-step[data-state="active"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color-active) 0, var(--bps-color-active) 6px, transparent 6px, transparent 13px);
}
.bp-stepper[data-connector="dashed"] .bp-step[data-state="error"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color-error) 0, var(--bps-color-error) 6px, transparent 6px, transparent 13px);
}

.bp-stepper[data-connector="dotted"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color) 0, var(--bps-color) 3px, transparent 3px, transparent 8px);
}
.bp-stepper[data-connector="dotted"] .bp-step[data-state="done"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color-done) 0, var(--bps-color-done) 3px, transparent 3px, transparent 8px);
}
.bp-stepper[data-connector="dotted"] .bp-step[data-state="active"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color-active) 0, var(--bps-color-active) 3px, transparent 3px, transparent 8px);
}
.bp-stepper[data-connector="dotted"] .bp-step[data-state="error"]:not(:last-child)::after {
  background: repeating-linear-gradient(to right, var(--bps-color-error) 0, var(--bps-color-error) 3px, transparent 3px, transparent 8px);
}

.bp-stepper[data-layout="vertical"] {
  flex-direction: column;
  overflow-x:     visible;
  overflow-y:     auto;
  align-items:    flex-start;
}
.bp-stepper[data-layout="vertical"] .bp-step {
  flex:      0 0 auto;
  width:     100%;
  max-width: var(--bps-width);
  min-width: 180px;
}

.bp-stepper[data-layout="vertical"] .bp-step:not(:last-child)::after {
  right:            auto;
  left:             calc(var(--bps-badge-sz) / 2 - var(--bps-stroke) / 2);
  top:              100%;
  width:            var(--bps-stroke);
  height:           var(--bps-gap);
  transform:        none;
  background-color: var(--bps-color);
}
.bp-stepper[data-layout="vertical"] .bp-step[data-state="done"]:not(:last-child)::after   { background-color: var(--bps-color-done);   }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="active"]:not(:last-child)::after { background-color: var(--bps-color-active); }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="error"]:not(:last-child)::after  { background-color: var(--bps-color-error);  }

.bp-stepper[data-layout="vertical"] .bp-step:not(:last-child)::before {
  right:         auto;
  left:          calc(var(--bps-badge-sz) / 2 - var(--bps-arrow));
  top:           auto;
  bottom:        calc(-1 * var(--bps-gap));
  transform:     none;
  border-left:   var(--bps-arrow) solid transparent;
  border-right:  var(--bps-arrow) solid transparent;
  border-top:    calc(var(--bps-arrow) * 1.5) solid var(--bps-color);
  border-bottom: none;
}
.bp-stepper[data-layout="vertical"] .bp-step[data-state="done"]:not(:last-child)::before   { border-top-color: var(--bps-color-done);   }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="active"]:not(:last-child)::before { border-top-color: var(--bps-color-active); }
.bp-stepper[data-layout="vertical"] .bp-step[data-state="error"]:not(:last-child)::before  { border-top-color: var(--bps-color-error);  }

.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom, var(--bps-color) 0, var(--bps-color) 6px, transparent 6px, transparent 13px);
}
.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step[data-state="done"]:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom, var(--bps-color-done) 0, var(--bps-color-done) 6px, transparent 6px, transparent 13px);
}
.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step[data-state="active"]:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom, var(--bps-color-active) 0, var(--bps-color-active) 6px, transparent 6px, transparent 13px);
}
.bp-stepper[data-layout="vertical"][data-connector="dashed"] .bp-step[data-state="error"]:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom, var(--bps-color-error) 0, var(--bps-color-error) 6px, transparent 6px, transparent 13px);
}

.bp-stepper[data-layout="vertical"][data-connector="dotted"] .bp-step:not(:last-child)::after {
  background: repeating-linear-gradient(to bottom, var(--bps-color) 0, var(--bps-color) 3px, transparent 3px, transparent 8px);
}

.bp-stepper[data-clickable="true"] .bp-step {
  cursor: pointer;
  user-select: none;
}
.bp-stepper[data-clickable="true"] .bp-step:not([data-state="active"]):hover {
  border-color: var(--bps-color);
  box-shadow:   0 0 12px -4px var(--bps-color);
  transform:    translateY(-2px);
}
.bp-stepper[data-layout="vertical"][data-clickable="true"] .bp-step:not([data-state="active"]):hover {
  transform: translateX(3px);
}
.bp-stepper[data-clickable="true"] .bp-step:focus-visible {
  outline:        2px solid var(--bps-color);
  outline-offset: 3px;
}
`;
  }

  const DATA_MAP = {
    color:         '--bps-color',
    colorActive:   '--bps-color-active',
    colorDone:     '--bps-color-done',
    colorError:    '--bps-color-error',
    textColor:     '--bps-text',
    titleColor:    '--bps-title',
    badgeBg:       '--bps-badge-bg',
    cardBg:        '--bps-card-bg',
    cardBgActive:  '--bps-card-bg-act',
    cardBgDone:    '--bps-card-bg-done',
    cardBgError:   '--bps-card-bg-err',
    stroke:        '--bps-stroke',
    radius:        '--bps-radius',
    cardWidth:     '--bps-width',
    cardPadding:   '--bps-padding',
    gap:           '--bps-gap',
    badgeSize:     '--bps-badge-sz',
    fontSize:      '--bps-fs',
    titleSize:     '--bps-title-fs',
    badgeFontSize: '--bps-badge-fs',
    arrowSize:     '--bps-arrow',
    padTop:        '--bps-pad-top',
    padBottom:     '--bps-pad-bottom',
    padX:          '--bps-pad-x',
  };

  function injectCSS() {
    if (document.getElementById('bp-stepper-style')) return;
    const s = document.createElement('style');
    s.id = 'bp-stepper-style';
    s.textContent = buildCSS();
    document.head.appendChild(s);
  }

  function initEl(el) {
    const cfg = Object.assign({}, defaults);
    const theme = el.dataset.theme || cfg.theme;
    if (theme && THEMES[theme]) Object.assign(cfg, THEMES[theme]);

    Object.entries(DATA_MAP).forEach(([key, cssVar]) => {
      const val = el.dataset[key] !== undefined ? el.dataset[key] : cfg[key];
      if (val) el.style.setProperty(cssVar, val);
    });

    if (!el.dataset.connector) {
      const cs = el.dataset.connectorStyle || cfg.connectorStyle;
      if (cs && cs !== 'solid') el.dataset.connector = cs;
    }

    const autoNum = el.dataset.autoNumber !== undefined
      ? el.dataset.autoNumber !== 'false'
      : cfg.autoNumber;

    if (autoNum) {
      el.querySelectorAll('.bp-step').forEach((step, i) => {
        if (step.querySelector('.bp-step-badge')) return;
        const badge = document.createElement('span');
        badge.className = 'bp-step-badge';
        badge.setAttribute('aria-hidden', 'true');
        const state = step.dataset.state;
        badge.textContent = state === 'done'  ? '✓'
                          : state === 'error' ? '!'
                          : String(i + 1);
        step.insertBefore(badge, step.firstChild);
      });
    }

    if (el.dataset.clickable === 'true') {
      el.querySelectorAll('.bp-step').forEach((step, i) => {
        step.setAttribute('tabindex', '0');
        step.addEventListener('click', () => setActive(el, i));
        step.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActive(el, i);
          }
        });
      });
    }
  }

  function init(root) {
    (root || document).querySelectorAll('.bp-stepper').forEach(initEl);
  }

  function setActive(el, index) {
    const steps = el.querySelectorAll('.bp-step');
    const prevIndex = [...steps].findIndex(s => s.dataset.state === 'active');

    if (index >= steps.length) {
      steps.forEach(step => {
        step.dataset.state = 'done';
        const badge = step.querySelector('.bp-step-badge');
        if (badge) badge.textContent = '✓';
      });
      el.dispatchEvent(new CustomEvent('bps:complete', {
        bubbles: true,
        detail: { el },
      }));
      return;
    }

    steps.forEach((step, i) => {
      const badge = step.querySelector('.bp-step-badge');
      if (i < index) {
        step.dataset.state = 'done';
        if (badge) badge.textContent = '✓';
      } else if (i === index) {
        step.dataset.state = 'active';
        if (badge) badge.textContent = String(i + 1);
      } else {
        delete step.dataset.state;
        if (badge) badge.textContent = String(i + 1);
      }
    });

    el.dispatchEvent(new CustomEvent('bps:change', {
      bubbles: true,
      detail: { index, prevIndex, el },
    }));
  }

  function setError(el, index) {
    const steps = el.querySelectorAll('.bp-step');
    if (!steps[index]) return;
    steps[index].dataset.state = 'error';
    const badge = steps[index].querySelector('.bp-step-badge');
    if (badge) badge.textContent = '!';
  }

  function resetStates(el) {
    el.querySelectorAll('.bp-step').forEach((step, i) => {
      delete step.dataset.state;
      const badge = step.querySelector('.bp-step-badge');
      if (badge) badge.textContent = String(i + 1);
    });
  }

  window.BPStepper = { defaults, BRAND, THEMES, init, setActive, setError, resetStates };

  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

})();

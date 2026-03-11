// ═══════════════════════════════════════════════════════════════
// word-flip.js  —  整合 extra-note 功能版本
// 新增：mode / trigger-style / hover / title / prefix / postfix /
//       icon / box-width / box-height / title-fontsize / body-fontsize
//       tooltip / popover / modal / drawer 顯示模式
// 保留：flip-card 系統 / word-trigger / read-mark / 模板變數
// ═══════════════════════════════════════════════════════════════

// ── 色彩工具函數 ──────────────────────────────────────────────
const WF_BRAND_COLORS = {
  shell: '#c6c7bd', lavender: '#C3A5E5', special: '#b9c971',
  warning: '#d98079', salmon: '#E5C3B3', attention: '#E5E5A6',
  sky: '#04b5a3', safe: '#73d192', brown: '#d9c5b2',
  info: '#6495e3', pink: '#FFB3D9', orange: '#f69653',
};

function wfResolveColor(val) {
  if (!val) return null;
  return WF_BRAND_COLORS[val.toLowerCase()] ?? val;
}

function wfContrastColor(hex) {
  if (!hex) return '#c6c7bd';
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

// ── CSS 注入 ──────────────────────────────────────────────────
(function injectStyles() {
  if (document.getElementById('word-flip-styles')) return;

  const css = `
/* ── Word Flip 私有變數前綴：--wf-  類別前綴：.wf- ── */
:root {
  --wf-bg-base:        #0c0d0c;
  --wf-bg-fill:        #333333;
  --wf-color-shell:    #c6c7bd;
  --wf-color-lavender: #C3A5E5;
  --wf-color-special:  #b9c971;
  --wf-color-warning:  #d98079;
  --wf-color-salmon:   #E5C3B3;
  --wf-color-attention:#E5E5A6;
  --wf-color-sky:      #04b5a3;
  --wf-color-safe:     #73d192;
  --wf-color-brown:    #d9c5b2;
  --wf-color-info:     #6495e3;
  --wf-color-pink:     #FFB3D9;
  --wf-color-orange:   #f69653;
}

/* ════ word-flip 預設外觀（mode=inline，無 trigger-style）════ */
word-flip {
  display: inline-block;
  position: relative;
  cursor: pointer;
  border-bottom: 2px dotted var(--wf-accent, var(--wf-color-lavender));
  color: var(--wf-accent, var(--wf-color-lavender));
  transition: all 0.25s ease;
  padding-bottom: 2px;
  -webkit-user-select: none;
  user-select: none;
  max-width: 100%;
  vertical-align: baseline;
}
word-flip:hover {
  border-bottom-style: solid;
  filter: brightness(1.15);
}
word-flip.wf-flipped {
  display: inline-block;
  border-bottom-style: solid;
  background: var(--wf-accent-alpha, rgba(195,165,229,0.12));
  padding: 8px 12px;
  border-radius: 6px;
  border-bottom: none;
  border-left: 3px solid var(--wf-accent, var(--wf-color-lavender));
  line-height: 1.6;
  vertical-align: baseline;
}
word-flip.wf-animating { pointer-events: none; }

/* 設有 trigger-style 時移除預設 border-bottom */
word-flip.wf-has-style {
  border-bottom: none;
  padding-bottom: 0;
}

/* ════ Trigger Style 類別 ════ */
word-flip.wf-style-underline {
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
word-flip.wf-style-underline:hover {
  text-decoration-style: solid;
}
word-flip.wf-style-highlight {
  border-radius: 3px;
  padding: 1px 4px;
}
word-flip.wf-style-highlight:hover { filter: brightness(1.12); }
word-flip.wf-style-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  line-height: 1.5;
  vertical-align: middle;
}
word-flip.wf-style-badge:hover { filter: brightness(1.15); transform: translateY(-1px); }
word-flip.wf-style-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 4px;
  border-left: 3px solid;
  vertical-align: middle;
}
word-flip.wf-style-tag:hover { filter: brightness(1.1); }
word-flip.wf-style-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 5px 14px;
  border-radius: 6px;
  vertical-align: middle;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}
word-flip.wf-style-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
  filter: brightness(1.08);
}
word-flip.wf-style-button:active { transform: translateY(0); }
word-flip.wf-style-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  padding: 2px 10px 2px 7px;
  border-radius: 999px;
  border: 1.5px solid;
  vertical-align: middle;
  font-weight: 500;
}
word-flip.wf-style-pill::before { content: '●'; font-size: 0.6em; opacity: 0.7; }
word-flip.wf-style-pill:hover { filter: brightness(1.15); }
word-flip.wf-style-dotted {
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
word-flip.wf-style-dotted:hover { text-decoration-thickness: 3px; }
word-flip.wf-style-icon {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
word-flip.wf-style-icon:hover { opacity: 0.8; }
word-flip.wf-active { opacity: 0.75; }

/* ════ 已讀標記 ════ */
word-flip.wf-read::after {
  content: '';
  position: absolute;
  top: -4px; right: -4px;
  width: var(--wf-read-size, 6px);
  height: var(--wf-read-size, 6px);
  background: var(--wf-read-color, var(--wf-color-safe));
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}
word-flip.wf-read.wf-show-mark::after { opacity: 1; }
word-flip.wf-read[data-read-mark="check"]::after {
  content: '✓'; background: none;
  color: var(--wf-read-color, var(--wf-color-safe));
  font-size: calc(var(--wf-read-size, 6px) * 2);
  width: auto; height: auto; font-weight: bold; line-height: 1;
}
word-flip.wf-read[data-read-mark="star"]::after {
  content: '★'; background: none;
  color: var(--wf-read-color, var(--wf-color-safe));
  font-size: calc(var(--wf-read-size, 6px) * 2);
  width: auto; height: auto; line-height: 1;
}
word-flip.wf-read[data-read-mark="icon"]::after {
  content: ''; background: none;
  width: auto; height: auto;
  font-family: 'bootstrap-icons';
  color: var(--wf-read-color, var(--wf-color-safe));
  font-size: calc(var(--wf-read-size, 6px) * 2); line-height: 1;
}
word-flip.wf-read[data-read-mark="icon"][data-read-mark-icon]::after {
  content: attr(data-read-mark-icon-content);
}

/* ════ word-trigger ════ */
word-trigger {
  display: inline; position: relative; cursor: pointer;
  border-bottom: 2px solid var(--wf-accent, var(--wf-color-special));
  color: var(--wf-accent, var(--wf-color-special));
  transition: all 0.25s ease; padding-bottom: 2px;
  font-weight: 500; -webkit-user-select: none; user-select: none;
}
word-trigger:hover { filter: brightness(1.2); transform: translateY(-1px); }
word-trigger.wf-active {
  background: var(--wf-accent-alpha, rgba(185,201,113,0.15));
  padding: 2px 6px; border-radius: 3px;
  border-bottom: 2px solid var(--wf-accent, var(--wf-color-special));
}
word-trigger.wf-read::after {
  content: ''; position: absolute; top: -4px; right: -4px;
  width: var(--wf-read-size, 6px); height: var(--wf-read-size, 6px);
  background: var(--wf-read-color, var(--wf-color-safe));
  border-radius: 50%; opacity: 0; transition: opacity 0.3s ease;
}
word-trigger.wf-read.wf-show-mark::after { opacity: 1; }

/* ════ flip-cards / flip-card / card-front / card-back ════ */
flip-cards { display: block; margin: 32px 0; padding: 0; }
flip-card {
  display: block; position: relative; margin-bottom: 20px;
  perspective: 1200px; min-height: 120px;
}
.wf-card-inner {
  position: relative; width: 100%; min-height: 120px;
  transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  transform-style: preserve-3d;
}
flip-card.wf-flipped .wf-card-inner { transform: rotateY(180deg); }
card-front, card-back {
  display: block; position: absolute; width: 100%; min-height: 120px;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  background: var(--wf-bg-fill);
  border: 1px solid var(--wf-border-color, rgba(198,199,189,0.2));
  border-left: var(--wf-bar-width, 6px) solid var(--wf-accent, var(--wf-color-shell));
  padding: 20px 24px; border-radius: 0 8px 8px 0;
  color: var(--wf-color-shell); line-height: 1.7; box-sizing: border-box;
}
card-front { transform: rotateY(0deg); z-index: 2; }
card-back  { transform: rotateY(180deg); z-index: 1; }
card-front h1,card-front h2,card-front h3,card-front h4,card-front h5,card-front h6,
card-back  h1,card-back  h2,card-back  h3,card-back  h4,card-back  h5,card-back  h6 {
  margin: 0 0 12px; color: var(--wf-accent, var(--wf-color-shell)); font-weight: 600;
}
card-front h4,card-back h4 { font-size: 1.15rem; }
card-front h5,card-back h5 { font-size: 1.05rem; }
card-front p,card-back p { margin: 0 0 12px; }
card-front p:last-child,card-back p:last-child { margin-bottom: 0; }
card-front ul,card-front ol,card-back ul,card-back ol { margin: 0 0 12px; padding-left: 24px; }
card-front li,card-back li { margin-bottom: 6px; }
card-front strong,card-back strong { color: var(--wf-color-special); font-weight: 600; }
card-front em,card-back em { color: var(--wf-color-lavender); font-style: normal; }
card-front code,card-back code {
  background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 3px;
  font-size: 0.9em; color: var(--wf-color-sky); font-family: 'Courier New',monospace;
}
card-front small,card-back small { font-size: 0.85rem; opacity: 0.8; }
flip-card:not(.wf-flipped) card-front { cursor: pointer; transition: all 0.3s ease; }
flip-card:not(.wf-flipped):hover card-front {
  transform: translateX(3px); box-shadow: -3px 0 12px rgba(0,0,0,0.3);
}
flip-card.wf-flipped card-back { cursor: pointer; transition: all 0.3s ease; }
flip-card.wf-flipped:hover card-back { box-shadow: 0 4px 16px rgba(0,0,0,0.4); }

/* ════ data-color 對照（word-flip / word-trigger / flip-card）════ */
word-flip[data-color="shell"],word-trigger[data-color="shell"]{ --wf-accent:var(--wf-color-shell);--wf-accent-alpha:rgba(198,199,189,0.12); }
flip-card[data-color="shell"]{ --wf-accent:var(--wf-color-shell); }
word-flip[data-color="lavender"],word-trigger[data-color="lavender"]{ --wf-accent:var(--wf-color-lavender);--wf-accent-alpha:rgba(195,165,229,0.12); }
flip-card[data-color="lavender"]{ --wf-accent:var(--wf-color-lavender); }
word-flip[data-color="special"],word-trigger[data-color="special"]{ --wf-accent:var(--wf-color-special);--wf-accent-alpha:rgba(185,201,113,0.12); }
flip-card[data-color="special"]{ --wf-accent:var(--wf-color-special); }
word-flip[data-color="warning"],word-trigger[data-color="warning"]{ --wf-accent:var(--wf-color-warning);--wf-accent-alpha:rgba(217,128,121,0.12); }
flip-card[data-color="warning"]{ --wf-accent:var(--wf-color-warning); }
word-flip[data-color="salmon"],word-trigger[data-color="salmon"]{ --wf-accent:var(--wf-color-salmon);--wf-accent-alpha:rgba(229,195,179,0.12); }
flip-card[data-color="salmon"]{ --wf-accent:var(--wf-color-salmon); }
word-flip[data-color="attention"],word-trigger[data-color="attention"]{ --wf-accent:var(--wf-color-attention);--wf-accent-alpha:rgba(229,229,166,0.12); }
flip-card[data-color="attention"]{ --wf-accent:var(--wf-color-attention); }
word-flip[data-color="sky"],word-trigger[data-color="sky"]{ --wf-accent:var(--wf-color-sky);--wf-accent-alpha:rgba(4,181,163,0.12); }
flip-card[data-color="sky"]{ --wf-accent:var(--wf-color-sky); }
word-flip[data-color="safe"],word-trigger[data-color="safe"]{ --wf-accent:var(--wf-color-safe);--wf-accent-alpha:rgba(115,209,146,0.12); }
flip-card[data-color="safe"]{ --wf-accent:var(--wf-color-safe); }
word-flip[data-color="brown"],word-trigger[data-color="brown"]{ --wf-accent:var(--wf-color-brown);--wf-accent-alpha:rgba(217,197,178,0.12); }
flip-card[data-color="brown"]{ --wf-accent:var(--wf-color-brown); }
word-flip[data-color="info"],word-trigger[data-color="info"]{ --wf-accent:var(--wf-color-info);--wf-accent-alpha:rgba(100,149,227,0.12); }
flip-card[data-color="info"]{ --wf-accent:var(--wf-color-info); }
word-flip[data-color="pink"],word-trigger[data-color="pink"]{ --wf-accent:var(--wf-color-pink);--wf-accent-alpha:rgba(255,179,217,0.12); }
flip-card[data-color="pink"]{ --wf-accent:var(--wf-color-pink); }
word-flip[data-color="orange"],word-trigger[data-color="orange"]{ --wf-accent:var(--wf-color-orange);--wf-accent-alpha:rgba(246,150,83,0.12); }
flip-card[data-color="orange"]{ --wf-accent:var(--wf-color-orange); }
word-flip[data-read-mark-color="shell"],word-trigger[data-read-mark-color="shell"]{ --wf-read-color:var(--wf-color-shell); }
word-flip[data-read-mark-color="lavender"],word-trigger[data-read-mark-color="lavender"]{ --wf-read-color:var(--wf-color-lavender); }
word-flip[data-read-mark-color="special"],word-trigger[data-read-mark-color="special"]{ --wf-read-color:var(--wf-color-special); }
word-flip[data-read-mark-color="warning"],word-trigger[data-read-mark-color="warning"]{ --wf-read-color:var(--wf-color-warning); }
word-flip[data-read-mark-color="salmon"],word-trigger[data-read-mark-color="salmon"]{ --wf-read-color:var(--wf-color-salmon); }
word-flip[data-read-mark-color="attention"],word-trigger[data-read-mark-color="attention"]{ --wf-read-color:var(--wf-color-attention); }
word-flip[data-read-mark-color="sky"],word-trigger[data-read-mark-color="sky"]{ --wf-read-color:var(--wf-color-sky); }
word-flip[data-read-mark-color="safe"],word-trigger[data-read-mark-color="safe"]{ --wf-read-color:var(--wf-color-safe); }
word-flip[data-read-mark-color="brown"],word-trigger[data-read-mark-color="brown"]{ --wf-read-color:var(--wf-color-brown); }
word-flip[data-read-mark-color="info"],word-trigger[data-read-mark-color="info"]{ --wf-read-color:var(--wf-color-info); }
word-flip[data-read-mark-color="pink"],word-trigger[data-read-mark-color="pink"]{ --wf-read-color:var(--wf-color-pink); }
word-flip[data-read-mark-color="orange"],word-trigger[data-read-mark-color="orange"]{ --wf-read-color:var(--wf-color-orange); }

/* ════ 顯示模式：tooltip ════ */
.wf-tooltip-box {
  position: fixed; z-index: 99999;
  max-width: 280px; min-width: 120px;
  background: #2a2b2a;
  border: 1px solid var(--wf-float-color, #c6c7bd);
  color: #c6c7bd; padding: 8px 12px; border-radius: 6px;
  font-size: 0.88rem; line-height: 1.7;
  box-shadow: 0 6px 24px rgba(0,0,0,0.55);
  pointer-events: none; opacity: 0; transform: translateY(6px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.wf-tooltip-box.wf-show { opacity: 1; transform: translateY(0); pointer-events: auto; }
.wf-tooltip-box::before {
  content: ''; position: absolute; bottom: 100%; left: 14px;
  border: 6px solid transparent;
  border-bottom-color: var(--wf-float-color, #c6c7bd);
}
.wf-tooltip-box.wf-above::before {
  bottom: auto; top: 100%;
  border-bottom-color: transparent;
  border-top-color: var(--wf-float-color, #c6c7bd);
}

/* ════ 顯示模式：popover ════ */
.wf-popover-box {
  position: fixed; z-index: 99990;
  width: 320px; max-width: calc(100vw - 32px);
  background: #242524;
  border: 1px solid var(--wf-float-color, #c6c7bd);
  border-top: 3px solid var(--wf-float-color, #c6c7bd);
  color: #c6c7bd; border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.65);
  opacity: 0; transform: scale(0.95) translateY(6px);
  transform-origin: top left;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.wf-popover-box.wf-show { opacity: 1; transform: scale(1) translateY(0); }
.wf-popover-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(198,199,189,0.12);
}
.wf-popover-title { font-size: 0.9rem; font-weight: 600; color: var(--wf-float-color, #c6c7bd); }
.wf-popover-close {
  background: none; border: none; color: rgba(198,199,189,0.5);
  cursor: pointer; font-size: 1rem; line-height: 1;
  padding: 2px 4px; border-radius: 3px; transition: color 0.2s;
}
.wf-popover-close:hover { color: #c6c7bd; }
.wf-popover-body { padding: 12px 14px 14px; font-size: 0.92rem; line-height: 1.8; }
.wf-popover-body strong { color: #b9c971; }
.wf-popover-body em { color: #C3A5E5; font-style: normal; }
.wf-popover-body code {
  background: rgba(255,255,255,0.07); padding: 1px 6px;
  border-radius: 3px; font-size: 0.88em; color: #04b5a3;
}
.wf-popover-body p { margin: 0 0 8px; }
.wf-popover-body p:last-child { margin-bottom: 0; }

/* ════ 顯示模式：modal ════ */
.wf-modal-overlay {
  position: fixed; inset: 0; z-index: 99980;
  background: rgba(12,13,12,0.82);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; opacity: 0; transition: opacity 0.28s ease;
}
.wf-modal-overlay.wf-show { opacity: 1; }
.wf-modal-box {
  background: #1e1f1e;
  border: 1px solid var(--wf-float-color, #c6c7bd);
  border-top: 3px solid var(--wf-float-color, #c6c7bd);
  border-radius: 10px; width: 540px; max-width: 100%; max-height: 80vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.75);
  transform: scale(0.94) translateY(16px); transition: transform 0.28s ease;
}
.wf-modal-overlay.wf-show .wf-modal-box { transform: scale(1) translateY(0); }
.wf-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(198,199,189,0.12); flex-shrink: 0;
}
.wf-modal-title {
  font-size: 1rem; font-weight: 600;
  color: var(--wf-float-color, #c6c7bd);
  display: flex; align-items: center; gap: 8px;
}
.wf-modal-close {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(198,199,189,0.15);
  color: rgba(198,199,189,0.6); cursor: pointer;
  width: 28px; height: 28px; border-radius: 5px; font-size: 0.9rem;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.wf-modal-close:hover { background: rgba(255,255,255,0.12); color: #c6c7bd; }
.wf-modal-body {
  padding: 16px 18px 20px; overflow-y: auto;
  font-size: 0.95rem; line-height: 1.85; color: #c6c7bd;
}
.wf-modal-body strong { color: #b9c971; }
.wf-modal-body em { color: #C3A5E5; font-style: normal; }
.wf-modal-body code {
  background: rgba(255,255,255,0.07); padding: 2px 7px;
  border-radius: 4px; font-size: 0.88em; color: #04b5a3;
}
.wf-modal-body p { margin: 0 0 10px; }
.wf-modal-body p:last-child { margin-bottom: 0; }
.wf-modal-body h4,.wf-modal-body h5 { color: var(--wf-float-color, #c6c7bd); margin: 14px 0 6px; }
.wf-modal-body ul,.wf-modal-body ol { padding-left: 20px; margin: 6px 0; }
.wf-modal-body li { margin: 4px 0; }

/* ════ 顯示模式：drawer ════ */
.wf-drawer-overlay {
  position: fixed; inset: 0; z-index: 99970;
  background: rgba(12,13,12,0.6);
  opacity: 0; transition: opacity 0.3s ease;
}
.wf-drawer-overlay.wf-show { opacity: 1; }
.wf-drawer-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 99975;
  width: 360px; max-width: 92vw;
  background: #1e1f1e;
  border-left: 3px solid var(--wf-float-color, #c6c7bd);
  display: flex; flex-direction: column;
  box-shadow: -8px 0 40px rgba(0,0,0,0.6);
  transform: translateX(100%);
  transition: transform 0.32s cubic-bezier(.4,0,.2,1);
}
.wf-drawer-panel.wf-show { transform: translateX(0); }
.wf-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 1px solid rgba(198,199,189,0.12); flex-shrink: 0;
}
.wf-drawer-title {
  font-size: 1rem; font-weight: 600;
  color: var(--wf-float-color, #c6c7bd);
  display: flex; align-items: center; gap: 8px;
}
.wf-drawer-close {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(198,199,189,0.15);
  color: rgba(198,199,189,0.6); cursor: pointer;
  width: 28px; height: 28px; border-radius: 5px;
  font-size: 0.9rem; display: flex; align-items: center;
  justify-content: center; transition: all 0.2s;
}
.wf-drawer-close:hover { background: rgba(255,255,255,0.12); color: #c6c7bd; }
.wf-drawer-body {
  padding: 16px 18px 24px; overflow-y: auto; flex: 1;
  font-size: 0.95rem; line-height: 1.85; color: #c6c7bd;
}
.wf-drawer-body strong { color: #b9c971; }
.wf-drawer-body em { color: #C3A5E5; font-style: normal; }
.wf-drawer-body code {
  background: rgba(255,255,255,0.07); padding: 2px 7px;
  border-radius: 4px; font-size: 0.88em; color: #04b5a3;
}
.wf-drawer-body p { margin: 0 0 10px; }
.wf-drawer-body p:last-child { margin-bottom: 0; }
.wf-esc-hint {
  font-size: 0.75rem; color: rgba(198,199,189,0.35);
  text-align: right; padding: 0 18px 10px; flex-shrink: 0;
}

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

// ═══════════════════════════════════════════════════════════════
// 全域配置
// ═══════════════════════════════════════════════════════════════
const WF_DEFAULT_CONFIG = {
  // 原有
  defaultColor      : 'lavender',
  defaultAnimation  : 'flip',
  autoFlipBack      : 0,
  focusMode         : false,
  readMark          : 'dot',
  readMarkColor     : 'safe',
  readMarkSize      : 6,
  readMarkPosition  : 'top-right',
  readMarkIcon      : '',
  borderStyle       : 'none',
  borderWidth       : 1,
  barWidth          : 6,
  // 新增（整合自 extra-note）
  mode              : 'inline',    // inline | tooltip | popover | modal | drawer
  triggerStyle      : '',          // '' | underline | highlight | badge | tag | button | pill | dotted | icon
  hoverTrigger      : false,       // true = hover 觸發（僅 tooltip 有效）
  toggle            : true,        // 再次點擊可關閉
  closeOnOverlay    : true,        // 點擊遮罩關閉（modal / drawer）
  title             : '',          // popover / modal / drawer 標題
  prefix            : '',          // 觸發器前綴（支援 bi-xxx）
  postfix           : '',          // 觸發器後綴
  icon              : '',          // 觸發器圖示（bi-xxx）
  boxWidth          : '',          // 彈出框寬度
  boxHeight         : '',          // 彈出框高度
  titleFontsize     : '',          // 標題字體大小
  bodyFontsize      : '',          // 內文字體大小
};

let WF_CONFIG = {
  ...WF_DEFAULT_CONFIG,
  ...(window.WF_INITIAL_CONFIG || {}),
};

// ═══════════════════════════════════════════════════════════════
// 浮動面板管理（同時只開一個 tooltip/popover）
// ═══════════════════════════════════════════════════════════════
const wfActiveFloats = new Map();

function wfCloseAll(exceptEl) {
  wfActiveFloats.forEach((closeFn, el) => {
    if (el !== exceptEl) closeFn();
  });
}

function wfPositionFloat(box, trigger, offset = 8) {
  const tr = trigger.getBoundingClientRect();
  const bw = box.offsetWidth  || 300;
  const bh = box.offsetHeight || 160;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top  = tr.bottom + offset;
  let left = tr.left;

  if (left + bw > vw - 12) left = vw - bw - 12;
  if (left < 8) left = 8;

  const above = top + bh > vh - 12;
  if (above) {
    top = tr.top - bh - offset;
    box.classList.add('wf-above');
  } else {
    box.classList.remove('wf-above');
  }

  box.style.top  = top  + 'px';
  box.style.left = left + 'px';
}

// ═══════════════════════════════════════════════════════════════
// 工具函數
// ═══════════════════════════════════════════════════════════════
function isHTMLContent(str) {
  return /<[^>]+>/.test(str);
}

function replaceTemplateVariables(content, variables) {
  if (!content || !variables) return content;
  return content.replace(/\{\{([^:}]+):([^}]+)\}\}/g, (match, varName, defaultValue) => {
    const trimmedName    = varName.trim();
    const trimmedDefault = defaultValue.trim();
    return variables.hasOwnProperty(trimmedName) ? variables[trimmedName] : trimmedDefault;
  });
}

function getContentFromSource(source, variables = null) {
  if (!source) return '';
  let content = '';
  if (isHTMLContent(source)) {
    content = source;
  } else {
    const id = source.startsWith('#') ? source.substring(1) : source;
    const element = document.getElementById(id);
    if (element) {
      content = element.innerHTML;
    } else {
      console.warn(`word-flip: 找不到 ID 為 "${id}" 的元素`);
      content = source;
    }
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

// ═══════════════════════════════════════════════════════════════
// word-flip 元件
// ═══════════════════════════════════════════════════════════════
class WordFlip extends HTMLElement {

  static get observedAttributes() {
    return [
      'data-content', 'data-color', 'mode', 'trigger-style',
      'title', 'prefix', 'postfix', 'icon',
      'box-width', 'box-height', 'title-fontsize', 'body-fontsize',
    ];
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this._originalContent = this.innerHTML;
    this._flipped         = false;
    this._flipTimeout     = null;
    this._open            = false;
    this._closeFloat      = null;

    this._applyConfig();
    this._applyTriggerStyle();
    this._attachEvents();
  }

  attributeChangedCallback() {
    if (this._initialized) {
      this._applyTriggerStyle();
    }
  }

  // ── 讀取當前選項 ───────────────────────────────────────────
  get _opt() {
    return {
      contentSource  : this.getAttribute('data-content') || this.getAttribute('source') || '',
      color          : this.getAttribute('data-color') || WF_CONFIG.defaultColor,
      mode           : this.getAttribute('mode')          || WF_CONFIG.mode,
      triggerStyle   : this.getAttribute('trigger-style') || WF_CONFIG.triggerStyle,
      hoverTrigger   : this.hasAttribute('hover')          || WF_CONFIG.hoverTrigger,
      toggle         : this.getAttribute('toggle') !== 'false' && WF_CONFIG.toggle,
      closeOnOverlay : this.getAttribute('close-on-overlay') !== 'false' && WF_CONFIG.closeOnOverlay,
      title          : this.getAttribute('title')          || WF_CONFIG.title,
      prefix         : this.getAttribute('prefix')         ?? WF_CONFIG.prefix,
      postfix        : this.getAttribute('postfix')        ?? WF_CONFIG.postfix,
      icon           : this.getAttribute('icon')           || WF_CONFIG.icon,
      boxWidth       : this.getAttribute('box-width')      || WF_CONFIG.boxWidth,
      boxHeight      : this.getAttribute('box-height')     || WF_CONFIG.boxHeight,
      titleFontsize  : this.getAttribute('title-fontsize') || WF_CONFIG.titleFontsize,
      bodyFontsize   : this.getAttribute('body-fontsize')  || WF_CONFIG.bodyFontsize,
      autoFlipBack   : parseInt(this.getAttribute('data-auto-back')) || WF_CONFIG.autoFlipBack || 0,
    };
  }

  // ── 套用全域配置預設值 ────────────────────────────────────
  _applyConfig() {
    if (!this.hasAttribute('data-color')) {
      this.setAttribute('data-color', WF_CONFIG.defaultColor);
    }
    if (!this.hasAttribute('data-auto-back') && WF_CONFIG.autoFlipBack > 0) {
      this.setAttribute('data-auto-back', WF_CONFIG.autoFlipBack);
    }

    const readMark      = this.getAttribute('data-read-mark')       || WF_CONFIG.readMark;
    const readMarkColor = this.getAttribute('data-read-mark-color') || WF_CONFIG.readMarkColor;
    const readMarkSize  = this.getAttribute('data-read-mark-size')  || WF_CONFIG.readMarkSize;
    const readMarkIcon  = this.getAttribute('data-read-mark-icon')  || WF_CONFIG.readMarkIcon;

    if (readMark !== 'none') {
      this.setAttribute('data-read-mark', readMark);
      this.setAttribute('data-read-mark-color', readMarkColor);
      this.style.setProperty('--wf-read-size', readMarkSize + 'px');
      if (readMark === 'icon' && readMarkIcon) {
        this.setAttribute('data-read-mark-icon', readMarkIcon);
        this._applyBootstrapIcon(readMarkIcon);
      }
    }
  }

  // ── 套用 trigger-style 的動態色彩 ────────────────────────
  _applyTriggerStyle() {
    const { triggerStyle, color } = this._opt;
    if (!triggerStyle) return;

    const hex = wfResolveColor(color) || '#C3A5E5';

    // 移除舊的 style 類別
    this.classList.forEach(c => { if (c.startsWith('wf-style-')) this.classList.remove(c); });
    this.classList.add('wf-has-style');
    this.classList.add(`wf-style-${triggerStyle}`);

    this.style.setProperty('--wf-float-color', hex);

    const ts = triggerStyle;
    if (ts === 'underline' || ts === 'dotted') {
      this.style.textDecorationColor = hex;
      this.style.color = hex;
    } else if (ts === 'highlight') {
      this.style.background = wfAlphaColor(hex, 0.28);
      this.style.color = hex;
    } else if (ts === 'badge') {
      this.style.background = wfAlphaColor(hex, 0.2);
      this.style.color = hex;
      this.style.border = `1px solid ${wfAlphaColor(hex, 0.45)}`;
    } else if (ts === 'tag') {
      this.style.background = wfAlphaColor(hex, 0.12);
      this.style.color = hex;
      this.style.borderLeftColor = hex;
    } else if (ts === 'button') {
      this.style.background = hex;
      this.style.color = wfContrastColor(hex);
    } else if (ts === 'pill') {
      this.style.color = hex;
      this.style.borderColor = wfAlphaColor(hex, 0.55);
    } else if (ts === 'icon') {
      this.style.color = hex;
    }

    // 組合 prefix / icon / postfix
    const o = this._opt;
    if (o.prefix || o.postfix || o.icon) {
      const pfx     = wfRenderFix(o.prefix);
      const sfx     = wfRenderFix(o.postfix);
      const iconHTML = o.icon ? `<i class="bi bi-${o.icon}" style="margin-right:4px"></i>` : '';
      // 只更新一次，避免覆蓋 _originalContent
      if (!this._styledContent) {
        this._styledContent = this.innerHTML;
        this.innerHTML = iconHTML + pfx + this._styledContent + sfx;
        this._originalContent = this.innerHTML;
      }
    }
  }

  // ── 綁定事件 ─────────────────────────────────────────────
  _attachEvents() {
    const o = this._opt;
    if (o.hoverTrigger && o.mode === 'tooltip') {
      this.addEventListener('mouseenter', () => this._handleShow());
      this.addEventListener('mouseleave', () => { if (this._closeFloat) this._closeFloat(); });
    } else {
      this.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = this._opt.mode;
        if (mode === 'inline') {
          this._handleFlip();
        } else {
          if (this._open && this._opt.toggle) {
            if (this._closeFloat) this._closeFloat();
          } else {
            wfCloseAll(this);
            this._handleShow();
          }
        }
      });
    }
  }

  // ── inline 模式：翻轉邏輯（原有行為）──────────────────────
  _handleFlip() {
    if (this.classList.contains('wf-animating')) return;

    const o = this._opt;
    if (!o.contentSource) {
      console.warn('word-flip: data-content is required');
      return;
    }

    if (!this._flipped) {
      const variables = {};
      const configAttrs = ['data-content','data-color','data-auto-back','data-read-mark',
                           'data-read-mark-color','data-read-mark-size','data-read-mark-icon'];
      Array.from(this.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') && !configAttrs.includes(attr.name)) {
          variables[attr.name.substring(5)] = attr.value;
        }
      });
      const content = getContentFromSource(o.contentSource, variables);
      this._flipToBack(content);
    } else {
      this._flipToFront();
    }
  }

  _flipToBack(content) {
    this.classList.add('wf-animating');
    this.style.opacity   = '0';
    this.style.transform = 'scale(0.95)';

    setTimeout(() => {
      this.innerHTML = content;
      this.classList.add('wf-flipped');
      this._flipped = true;
      reinitializeEmbeddedComponents(this);

      setTimeout(() => {
        this.style.opacity   = '1';
        this.style.transform = 'scale(1)';
        this.classList.remove('wf-animating');
        this._markAsRead();

        const autoBack = this._opt.autoFlipBack;
        if (autoBack > 0) {
          this._flipTimeout = setTimeout(() => this._flipToFront(), autoBack * 1000);
        }
      }, 50);
    }, 250);
  }

  _flipToFront() {
    if (this._flipTimeout) { clearTimeout(this._flipTimeout); this._flipTimeout = null; }
    this.classList.add('wf-animating');
    this.style.opacity   = '0';
    this.style.transform = 'scale(0.95)';

    setTimeout(() => {
      this.innerHTML = this._originalContent;
      this.classList.remove('wf-flipped');
      this._flipped = false;

      setTimeout(() => {
        this.style.opacity   = '1';
        this.style.transform = 'scale(1)';
        this.classList.remove('wf-animating');
      }, 50);
    }, 250);
  }

  // ── 非 inline 模式：顯示浮動面板 ──────────────────────────
  _handleShow() {
    const o           = this._opt;
    const contentHTML = getContentFromSource(o.contentSource);
    if (!contentHTML) return;

    this._open = true;
    this.classList.add('wf-active');

    const color = wfResolveColor(o.color) || '#C3A5E5';

    const registerClose = (domFn) => {
      const closeFn = () => {
        domFn();
        this._open = false;
        this.classList.remove('wf-active');
        this._closeFloat = null;
        wfActiveFloats.delete(this);
      };
      this._closeFloat = closeFn;
      wfActiveFloats.set(this, closeFn);
    };

    switch (o.mode) {
      case 'tooltip': this._showTooltip(o, color, contentHTML, registerClose); break;
      case 'modal':   this._showModal  (o, color, contentHTML, registerClose); break;
      case 'drawer':  this._showDrawer (o, color, contentHTML, registerClose); break;
      default:        this._showPopover(o, color, contentHTML, registerClose); break;
    }

    this._markAsRead();
  }

  // ── tooltip ───────────────────────────────────────────────
  _showTooltip(o, color, contentHTML, registerClose) {
    const box = document.createElement('div');
    box.className = 'wf-tooltip-box';
    box.style.setProperty('--wf-float-color', color);
    box.innerHTML = contentHTML;
    if (o.boxWidth)  { box.style.width = o.boxWidth; box.style.maxWidth = o.boxWidth; }
    if (o.boxHeight) { box.style.maxHeight = o.boxHeight; box.style.overflowY = 'auto'; }
    applyFontSizes(null, box, o.titleFontsize, o.bodyFontsize);
    document.body.appendChild(box);

    requestAnimationFrame(() => { wfPositionFloat(box, this, 6); box.classList.add('wf-show'); });

    const outside = (e) => { if (!box.contains(e.target) && e.target !== this) this._closeFloat?.(); };
    setTimeout(() => document.addEventListener('click', outside), 0);

    registerClose(() => {
      box.classList.remove('wf-show');
      document.removeEventListener('click', outside);
      setTimeout(() => box.remove(), 220);
    });

    const rePos = () => wfPositionFloat(box, this, 6);
    window.addEventListener('resize', rePos, { once: true });
    window.addEventListener('scroll', rePos, { passive: true, once: true });
  }

  // ── popover ───────────────────────────────────────────────
  _showPopover(o, color, contentHTML, registerClose) {
    const box = document.createElement('div');
    box.className = 'wf-popover-box';
    box.style.setProperty('--wf-float-color', color);

    const titleText = o.title || this.textContent.trim().slice(0, 30);
    box.innerHTML = `
      <div class="wf-popover-header">
        <span class="wf-popover-title">${titleText}</span>
        <button class="wf-popover-close" title="關閉">✕</button>
      </div>
      <div class="wf-popover-body">${contentHTML}</div>
    `;
    if (o.boxWidth) { box.style.width = o.boxWidth; box.style.maxWidth = o.boxWidth; }
    if (o.boxHeight) {
      const body = box.querySelector('.wf-popover-body');
      body.style.maxHeight = o.boxHeight; body.style.overflowY = 'auto';
    }
    applyFontSizes(box.querySelector('.wf-popover-title'), box.querySelector('.wf-popover-body'), o.titleFontsize, o.bodyFontsize);
    document.body.appendChild(box);

    requestAnimationFrame(() => { wfPositionFloat(box, this, 10); box.classList.add('wf-show'); });

    const outside = (e) => { if (!box.contains(e.target) && e.target !== this) this._closeFloat?.(); };
    setTimeout(() => document.addEventListener('click', outside), 0);

    registerClose(() => {
      box.classList.remove('wf-show');
      document.removeEventListener('click', outside);
      setTimeout(() => box.remove(), 260);
    });

    box.querySelector('.wf-popover-close').addEventListener('click', (e) => {
      e.stopPropagation(); this._closeFloat?.();
    });
  }

  // ── modal ─────────────────────────────────────────────────
  _showModal(o, color, contentHTML, registerClose) {
    const overlay = document.createElement('div');
    overlay.className = 'wf-modal-overlay';
    overlay.style.setProperty('--wf-float-color', color);

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

    void overlay.offsetHeight;
    overlay.classList.add('wf-show');

    const keydown = (e) => { if (e.key === 'Escape') this._closeFloat?.(); };
    document.addEventListener('keydown', keydown);

    registerClose(() => {
      overlay.classList.remove('wf-show');
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = '';
      setTimeout(() => overlay.remove(), 300);
    });

    overlay.querySelector('.wf-modal-close').addEventListener('click', () => this._closeFloat?.());
    if (o.closeOnOverlay) {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closeFloat?.(); });
    }
  }

  // ── drawer ────────────────────────────────────────────────
  _showDrawer(o, color, contentHTML, registerClose) {
    const overlay = document.createElement('div');
    overlay.className = 'wf-drawer-overlay';
    overlay.style.setProperty('--wf-float-color', color);

    const panel = document.createElement('div');
    panel.className = 'wf-drawer-panel';
    panel.style.setProperty('--wf-float-color', color);

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
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    if (o.boxWidth) { panel.style.width = o.boxWidth; panel.style.maxWidth = o.boxWidth; }
    applyFontSizes(panel.querySelector('.wf-drawer-title'), panel.querySelector('.wf-drawer-body'), o.titleFontsize, o.bodyFontsize);
    document.body.style.overflow = 'hidden';

    void overlay.offsetHeight; void panel.offsetHeight;
    overlay.classList.add('wf-show'); panel.classList.add('wf-show');

    const keydown = (e) => { if (e.key === 'Escape') this._closeFloat?.(); };
    document.addEventListener('keydown', keydown);

    registerClose(() => {
      overlay.classList.remove('wf-show'); panel.classList.remove('wf-show');
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = '';
      setTimeout(() => { overlay.remove(); panel.remove(); }, 340);
    });

    panel.querySelector('.wf-drawer-close').addEventListener('click', () => this._closeFloat?.());
    if (o.closeOnOverlay) { overlay.addEventListener('click', () => this._closeFloat?.()); }
  }

  // ── 已讀標記 ──────────────────────────────────────────────
  _markAsRead() {
    const readMark = this.getAttribute('data-read-mark');
    if (readMark && readMark !== 'none') {
      this.classList.add('wf-read');
      setTimeout(() => { this.classList.add('wf-show-mark'); }, 300);
    }
  }

  _applyBootstrapIcon(iconClass) {
    const iconMap = {
      'bi-check-circle-fill': '\uf26b', 'bi-check-circle': '\uf26a',
      'bi-check2-circle': '\uf272',     'bi-check': '\uf26d',
      'bi-star-fill': '\uf586',         'bi-star': '\uf588',
      'bi-bookmark-fill': '\uf26f',     'bi-bookmark': '\uf26e',
      'bi-heart-fill': '\uf417',        'bi-heart': '\uf416',
      'bi-lightbulb-fill': '\uf4a3',    'bi-lightbulb': '\uf4a2',
      'bi-patch-check-fill': '\uf4f3',  'bi-patch-check': '\uf4f2',
    };
    this.setAttribute('data-read-mark-icon-content', iconMap[iconClass] || '\uf26b');
  }

  disconnectedCallback() {
    if (this._flipTimeout)  clearTimeout(this._flipTimeout);
    if (this._closeFloat)   this._closeFloat();
  }
}

// ═══════════════════════════════════════════════════════════════
// word-trigger 元件（不變）
// ═══════════════════════════════════════════════════════════════
class WordTrigger extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;
    this._applyConfig();
    this.addEventListener('click', () => this._handleTrigger());
  }

  _applyConfig() {
    if (!this.hasAttribute('data-color')) this.setAttribute('data-color', WF_CONFIG.defaultColor);
    const readMark      = this.getAttribute('data-read-mark')       || WF_CONFIG.readMark;
    const readMarkColor = this.getAttribute('data-read-mark-color') || WF_CONFIG.readMarkColor;
    const readMarkSize  = this.getAttribute('data-read-mark-size')  || WF_CONFIG.readMarkSize;
    if (readMark !== 'none') {
      this.setAttribute('data-read-mark', readMark);
      this.setAttribute('data-read-mark-color', readMarkColor);
      this.style.setProperty('--wf-read-size', readMarkSize + 'px');
    }
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
    if (readMark && readMark !== 'none') {
      this.classList.add('wf-read');
      setTimeout(() => { this.classList.add('wf-show-mark'); }, 300);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// flip-card 元件（不變）
// ═══════════════════════════════════════════════════════════════
class FlipCard extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;
    this._flipped = false; this._flipTimeout = null; this._cardInner = null;
    this._applyConfig();
    this._wrapContent();
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
    const inner = document.createElement('div');
    inner.className = 'wf-card-inner';
    while (this.firstChild) inner.appendChild(this.firstChild);
    this.appendChild(inner);
    this._cardInner = inner;
    reinitializeEmbeddedComponents(this);
  }

  _flipToBack() {
    if (this._flipped) return;
    this.classList.add('wf-flipped'); this._flipped = true;
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

// ═══════════════════════════════════════════════════════════════
// 其他元件（不變）
// ═══════════════════════════════════════════════════════════════
class FlipCards extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;
    if (this.hasAttribute('data-show-controls')) {
      const controls = document.createElement('div');
      controls.className = 'wf-controls';
      controls.style.cssText = 'margin-bottom:16px;display:flex;gap:12px;';
      const btn = document.createElement('button');
      btn.textContent = '全部翻回';
      btn.style.cssText = 'padding:8px 16px;background:#333;color:#c6c7bd;border:1px solid #c6c7bd;border-radius:6px;cursor:pointer;';
      btn.addEventListener('click', () => this.querySelectorAll('flip-card').forEach(c => c._flipToFront?.()));
      controls.appendChild(btn);
      this.insertBefore(controls, this.firstChild);
    }
  }
}

class CardFront extends HTMLElement {
  connectedCallback() { if (!this._initialized) { this._initialized = true; reinitializeEmbeddedComponents(this); } }
}
class CardBack extends HTMLElement {
  connectedCallback() { if (!this._initialized) { this._initialized = true; reinitializeEmbeddedComponents(this); } }
}

// ═══════════════════════════════════════════════════════════════
// word-flip-config 元件（擴充新屬性）
// ═══════════════════════════════════════════════════════════════
class WordFlipConfig extends HTMLElement {
  constructor() { super(); this._processConfig(); }
  connectedCallback() { this._processConfig(); this.style.display = 'none'; }

  _processConfig() {
    const attrs = {
      'default-color'    : 'defaultColor',
      'default-animation': 'defaultAnimation',
      'auto-flip-back'   : 'autoFlipBack',
      'focus-mode'       : 'focusMode',
      'read-mark'        : 'readMark',
      'read-mark-color'  : 'readMarkColor',
      'read-mark-size'   : 'readMarkSize',
      'read-mark-position': 'readMarkPosition',
      'read-mark-icon'   : 'readMarkIcon',
      'border-style'     : 'borderStyle',
      'border-width'     : 'borderWidth',
      'bar-width'        : 'barWidth',
      // 新增
      'mode'             : 'mode',
      'trigger-style'    : 'triggerStyle',
      'hover'            : 'hoverTrigger',
      'toggle'           : 'toggle',
      'close-on-overlay' : 'closeOnOverlay',
      'title'            : 'title',
      'prefix'           : 'prefix',
      'postfix'          : 'postfix',
      'icon'             : 'icon',
      'box-width'        : 'boxWidth',
      'box-height'       : 'boxHeight',
      'title-fontsize'   : 'titleFontsize',
      'body-fontsize'    : 'bodyFontsize',
    };

    for (const [attr, key] of Object.entries(attrs)) {
      if (this.hasAttribute(attr)) {
        const val = this.getAttribute(attr);
        if (['focusMode','hoverTrigger','toggle','closeOnOverlay'].includes(key)) {
          WF_CONFIG[key] = val !== 'false';
        } else if (['autoFlipBack','readMarkSize','borderWidth','barWidth'].includes(key)) {
          WF_CONFIG[key] = parseInt(val) || WF_DEFAULT_CONFIG[key];
        } else {
          WF_CONFIG[key] = val;
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 註冊元件
// ═══════════════════════════════════════════════════════════════
customElements.define('word-flip-config', WordFlipConfig);

function processExistingConfigs() {
  document.querySelectorAll('word-flip-config').forEach(c => c._processConfig?.());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processExistingConfigs);
} else {
  processExistingConfigs();
}

customElements.define('word-flip',    WordFlip);
customElements.define('word-trigger', WordTrigger);
customElements.define('flip-card',    FlipCard);
customElements.define('flip-cards',   FlipCards);
customElements.define('card-front',   CardFront);
customElements.define('card-back',    CardBack);

// ═══════════════════════════════════════════════════════════════
// 全域 API
// ═══════════════════════════════════════════════════════════════
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

console.log('Word Flip Component loaded (with extra-note features)');

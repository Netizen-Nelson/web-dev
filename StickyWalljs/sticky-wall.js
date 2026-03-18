(function (global) {
  'use strict';

  const CFG = Object.assign({
    colors: [
      { name: 'Lavender', val: '#C3A5E5' },
      { name: 'Special',  val: '#C8DD5A' },
      { name: 'Salmon',   val: '#E5C3B3' },
      { name: 'Attention',val: '#E5E5A6' },
      { name: 'Sky',      val: '#04b5a3' },
      { name: 'Safe',     val: '#81E6D9' },
      { name: 'Brown',    val: '#d9b375' },
      { name: 'Info',     val: '#90CDF4' },
      { name: 'Pink',     val: '#FFB3D9' },
      { name: 'Orange',   val: '#f69653' },
      { name: 'Warning',  val: '#F08080' },
    ],
    defaultColor : '#C3A5E5',
    defaultWidth : 260,
    position     : 'fixed',
    storageKey   : 'stickywall_v1',
    zBase        : 8000,
    excludeTags  : ['INPUT','TEXTAREA','BUTTON','A','SELECT','LABEL','OPTION','SUMMARY'],
    excludeClass : 'sn-no-sticky',
  }, global.StickyNotesConfig || {});

  let zTop  = CFG.zBase;
  const pool = [];   /* 記憶體中所有 StickyNote 實例 */
  function injectStyles() {
    if (document.getElementById('sn-global-styles')) return;
    const el = document.createElement('style');
    el.id = 'sn-global-styles';
    el.textContent = `

article.sn-note {
  position          : ${CFG.position};
  width             : ${CFG.defaultWidth}px;
  min-width         : 180px;
  min-height        : 108px;
  background        : var(--sn-bg, #C3A5E5);
  border-radius     : 7px;
  box-shadow        : 3px 5px 20px rgba(0,0,0,.55),
                      0 0 0 1.5px rgba(0,0,0,.12);
  display           : flex;
  flex-direction    : column;
  font-family       : inherit;
  font-size         : .9rem;
  color             : #111;
  resize            : both;
  overflow          : hidden;
  transition        : box-shadow .18s, transform .12s;
  will-change       : transform;
}
article.sn-note:focus-within {
  box-shadow : 4px 7px 28px rgba(0,0,0,.7),
               0 0 0 2px var(--sn-bg, #C3A5E5);
}
article.sn-note.sn-collapsed {
  min-height : unset;
  resize     : horizontal;
}

/* ── 拖曳列（header） ── */
header.sn-header {
  display         : flex;
  align-items     : center;
  justify-content : space-between;
  padding         : 5px 7px;
  gap             : 5px;
  background      : rgba(0,0,0,.14);
  cursor          : move;
  flex-shrink     : 0;
  border-radius   : 7px 7px 0 0;
  user-select     : none;
}

/* ── 調色盤 ── */
.sn-palette {
  display   : flex;
  gap       : 3px;
  flex-wrap : wrap;
  flex      : 1;
}
.sn-dot {
  width         : 13px;
  height        : 13px;
  border-radius : 50%;
  cursor        : pointer;
  border        : 2px solid transparent;
  box-sizing    : border-box;
  flex-shrink   : 0;
  transition    : transform .14s, border-color .14s;
}
.sn-dot:hover       { transform: scale(1.4); }
.sn-dot.sn-active   { border-color: rgba(0,0,0,.65); transform: scale(1.25); }

/* ── 操作按鈕群 ── */
nav.sn-actions { display: flex; gap: 3px; flex-shrink: 0; }
button.sn-btn {
  background    : rgba(0,0,0,.18);
  border        : none;
  border-radius : 3px;
  color         : #111;
  cursor        : pointer;
  width         : 20px;
  height        : 20px;
  display       : flex;
  align-items   : center;
  justify-content: center;
  font-size     : .7rem;
  padding       : 0;
  line-height   : 1;
  transition    : background .14s, color .14s;
  flex-shrink   : 0;
}
button.sn-btn:hover        { background: rgba(0,0,0,.32); }
button.sn-del:hover        { background: #c0392b; color: #fff; }

/* ── 內容區（section） ── */
section.sn-body {
  flex       : 1;
  display    : flex;
  flex-direction: column;
  padding    : 8px;
  overflow   : hidden;
}
section.sn-body.sn-collapsed { display: none; }

/* ── textarea ── */
textarea.sn-text {
  flex        : 1;
  resize      : none;
  border      : none;
  background  : rgba(255,255,255,.28);
  border-radius: 4px;
  padding     : 6px 8px;
  font-size   : .88rem;
  color       : #111;
  font-family : inherit;
  outline     : none;
  min-height  : 72px;
  width       : 100%;
  box-sizing  : border-box;
  user-select : text;
  transition  : background .15s;
}
textarea.sn-text::placeholder { color: rgba(0,0,0,.38); }
textarea.sn-text:focus        { background: rgba(255,255,255,.44); }

/* ── 頁面層級提示：元件已就緒 ── */
[data-sticky-wall-hint]::after {
  content       : attr(data-sticky-wall-hint);
  position      : fixed;
  bottom        : 18px;
  left          : 50%;
  transform     : translateX(-50%);
  background    : rgba(12,13,12,.85);
  color         : #c6c7bd;
  border        : 1px solid #333;
  border-radius : 6px;
  padding       : 8px 18px;
  font-size     : .8rem;
  pointer-events: none;
  z-index       : 99999;
  opacity       : 0;
  animation     : sn-hint-fade 3.5s ease forwards;
}
@keyframes sn-hint-fade {
  0%   { opacity:0; transform:translateX(-50%) translateY(6px); }
  15%  { opacity:1; transform:translateX(-50%) translateY(0);   }
  75%  { opacity:1; }
  100% { opacity:0; }
}
    `;
    document.head.appendChild(el);
  }

  /* ═══════════════════════════════════════════════
     StickyNote 類別
  ═══════════════════════════════════════════════ */
  class StickyNote {
    constructor(opts = {}) {
      this.id    = opts.id    || ('sn_' + Date.now() + '_' + Math.random().toString(36).slice(2,5));
      this.color = opts.color || CFG.defaultColor;
      this.x     = opts.x    != null ? opts.x : 120;
      this.y     = opts.y    != null ? opts.y : 100;
      this._build(opts);
      this._makeDraggable();
      this._bindEvents();
      document.body.appendChild(this.el);
    }

    /* ── 建構語義化 HTML 結構 ── */
    _build(opts) {
      const collapsed  = !!opts.collapsed;
      const dotsHTML   = CFG.colors.map(c =>
        '<span class="sn-dot' + (c.val === this.color ? ' sn-active' : '') + '" ' +
        'data-val="' + c.val + '" ' +
        'style="background:' + c.val + '" ' +
        'title="' + c.name + '" ' +
        'role="radio" tabindex="0" ' +
        'aria-label="顏色：' + c.name + '"></span>'
      ).join('');

      /* article → header + section，語義完整 */
      this.el = document.createElement('article');
      this.el.className = 'sn-note' + (collapsed ? ' sn-collapsed' : '');
      this.el.setAttribute('role', 'note');
      this.el.setAttribute('aria-label', '便利貼');
      this.el.style.cssText =
        'left:' + this.x + 'px;' +
        'top:' + this.y + 'px;' +
        '--sn-bg:' + this.color + ';' +
        'z-index:' + (++zTop) + ';' +
        (opts.width  ? 'width:' + opts.width  + 'px;' : '') +
        (opts.height && !collapsed ? 'height:' + opts.height + 'px;' : '');

      this.el.innerHTML =
        '<header class="sn-header">' +
          '<div class="sn-palette" role="radiogroup" aria-label="便利貼顏色">' +
            dotsHTML +
          '</div>' +
          '<nav class="sn-actions" aria-label="操作">' +
            '<button class="sn-btn sn-min" title="收合 / 展開" aria-label="收合展開">─</button>' +
            '<button class="sn-btn sn-del" title="刪除便利貼"  aria-label="刪除">✕</button>' +
          '</nav>' +
        '</header>' +
        '<section class="sn-body' + (collapsed ? ' sn-collapsed' : '') + '">' +
          '<textarea class="sn-text" rows="7" ' +
            'placeholder="在此輸入備忘內容…">' +
            (opts.text ? opts.text : '') +
          '</textarea>' +
        '</section>';
    }

    /* ── 拖曳邏輯 ── */
    _makeDraggable() {
      const hdr = this.el.querySelector('header.sn-header');
      let ox, oy, ol, ot, active = false;

      hdr.addEventListener('mousedown', e => {
        if (e.target.closest('.sn-btn,.sn-dot')) return;
        e.preventDefault();
        active = true;
        ox = e.clientX;
        oy = e.clientY;
        ol = parseInt(this.el.style.left)  || 0;
        ot = parseInt(this.el.style.top)   || 0;
        this._front();
      });

      /* 用 document 監聽，滑鼠移出便利貼也不中斷 */
      const onMove = e => {
        if (!active) return;
        this.el.style.left = (ol + e.clientX - ox) + 'px';
        this.el.style.top  = (ot + e.clientY - oy) + 'px';
      };
      const onUp = () => {
        if (!active) return;
        active = false;
        StickyWall.save();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);

      /* 避免記憶體洩漏：便利貼刪除時可拆掉監聽 */
      this._cleanDrag = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      };
    }

    /* ── 事件綁定 ── */
    _bindEvents() {
      /* 調色盤點擊 */
      this.el.querySelectorAll('.sn-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          this.color = dot.dataset.val;
          this.el.style.setProperty('--sn-bg', this.color);
          this.el.querySelectorAll('.sn-dot').forEach(d => d.classList.remove('sn-active'));
          dot.classList.add('sn-active');
          StickyWall.save();
        });
        /* 鍵盤可操作 */
        dot.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dot.click(); }
        });
      });

      /* 收合 / 展開 */
      this.el.querySelector('.sn-min').addEventListener('click', () => {
        const body      = this.el.querySelector('section.sn-body');
        const nowCollapsed = body.classList.toggle('sn-collapsed');
        this.el.classList.toggle('sn-collapsed', nowCollapsed);
        StickyWall.save();
      });

      /* 刪除 */
      this.el.querySelector('.sn-del').addEventListener('click', () => {
        this._destroy();
      });

      /* 文字輸入 → 自動儲存 */
      this.el.querySelector('textarea.sn-text').addEventListener('input', () => {
        StickyWall.save();
      });

      /* 點擊便利貼本體 → 置頂 */
      this.el.addEventListener('mousedown', () => this._front());

      /* resize 結束 → 儲存（用 ResizeObserver） */
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => StickyWall.save());
        ro.observe(this.el);
        this._cleanResize = () => ro.disconnect();
      }
    }

    /* 置頂 */
    _front() { this.el.style.zIndex = ++zTop; }

    /* 完整銷毀 */
    _destroy() {
      if (this._cleanDrag)   this._cleanDrag();
      if (this._cleanResize) this._cleanResize();
      this.el.remove();
      const idx = pool.indexOf(this);
      if (idx > -1) pool.splice(idx, 1);
      StickyWall.save();
    }

    /* 取得序列化資料 */
    getData() {
      const body = this.el.querySelector('section.sn-body');
      return {
        id        : this.id,
        x         : parseInt(this.el.style.left)  || 0,
        y         : parseInt(this.el.style.top)   || 0,
        width     : this.el.offsetWidth,
        height    : this.el.offsetHeight,
        color     : this.color,
        text      : this.el.querySelector('textarea.sn-text').value,
        collapsed : body.classList.contains('sn-collapsed'),
      };
    }
  }

  /* ═══════════════════════════════════════════════
     StickyWall 管理器（公開 API）
  ═══════════════════════════════════════════════ */
  const StickyWall = {

    init() {
      injectStyles();
      this._restore();

      /* 雙擊建立 */
      document.addEventListener('dblclick', e => {
        const t = e.target;
        if (CFG.excludeTags.includes(t.tagName))        return;
        if (t.closest('.sn-note'))                       return;
        if (CFG.excludeClass && t.closest('.' + CFG.excludeClass)) return;

        let x = e.clientX - 12;
        let y = e.clientY - 12;
        if (CFG.position === 'absolute') {
          x += window.scrollX;
          y += window.scrollY;
        }
        const note = new StickyNote({ x, y });
        pool.push(note);
        note.el.querySelector('textarea.sn-text').focus();
        this.save();
        this._flashHint();
      });

      /* 第一次無便利貼時顯示提示 */
      this._initHint();
    },

    /* 儲存到 localStorage */
    save() {
      try {
        localStorage.setItem(CFG.storageKey, JSON.stringify(pool.map(n => n.getData())));
      } catch (_) { /* 隱私模式或空間不足時靜默失敗 */ }
    },

    /* 還原 */
    _restore() {
      try {
        const arr = JSON.parse(localStorage.getItem(CFG.storageKey) || '[]');
        arr.forEach(d => pool.push(new StickyNote(d)));
      } catch (_) {}
    },

    /* 清除全部 */
    clearAll() {
      pool.slice().forEach(n => n._destroy());
      this.save();
    },

    export() {
      return pool.map(n => n.getData());
    },

    import(arr) {
      if (!Array.isArray(arr)) return;
      arr.forEach(d => pool.push(new StickyNote(d)));
      this.save();
    },

    _initHint() {
      if (pool.length === 0) {
        document.body.setAttribute('data-sticky-wall-hint', '雙擊頁面任意空白處，即可建立便利貼 📌');
        setTimeout(() => document.body.removeAttribute('data-sticky-wall-hint'), 4000);
      }
    },
    _flashHint() {
      document.body.removeAttribute('data-sticky-wall-hint');
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StickyWall.init());
  } else {
    StickyWall.init();
  }

  global.StickyWall = StickyWall;
})(window);

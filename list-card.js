/**
 * list-card.js  v1.0
 * Web Component：<list-card> + <card-item>
 * 無 Shadow DOM，CSS + JS 單一檔案
 * ─────────────────────────────────────────
 * 使用方式：
 *   <list-card theme="default" divider-width="16px">
 *     <card-item>HTML 內容</card-item>
 *     <card-item data-text-source="some-div-id"></card-item>
 *     <card-item><p>第三張</p></card-item>
 *   </list-card>
 *
 * 全域設定：
 *   window.ListCardConfig = { theme: 'fill', dividerWidth: '24px', ... }
 */

;(function () {
  /* ════════════════════════════════════════
     0. 品牌色票
  ════════════════════════════════════════ */
  const BRAND = {
    bg      : '#0c0d0c',
    shell   : '#c6c7bd',
    lavender: '#C3A5E5',
    special : '#C8DD5A',
    warning : '#F08080',
    salmon  : '#E5C3B3',
    sky     : '#08a9d1',
    safe    : '#40c99a',
    vanilla : '#FDF6ED',
    yellow  : '#DECA4B',
    info    : '#5fafed',
    stone   : '#95BDD7',
    pink    : '#FFB3D9',
    orange  : '#eda109',
  }

  /* ════════════════════════════════════════
     1. 主題系統：每個品牌色自動生成 default / fill
     ────────────────────────────────────────
     命名規則：
       theme="special"       → default 變體（深底＋品牌色文字）
       theme="special-fill"  → fill 變體（品牌色底＋深色文字）

     別名：
       "default" → "shell"
       "fill"    → "shell-fill"
  ════════════════════════════════════════ */
  const BG = BRAND.bg   // #0c0d0c

  /* 排除 bg 本身，其餘色票全部產生主題 */
  const THEME_COLORS = (({ bg, ...rest }) => rest)(BRAND)

  function _mkTheme (color) {
    return {
      /* ── default：深底＋品牌色 ── */
      default: {
        containerBg    : BG,
        containerBorder: `1px solid ${color}`,
        itemBg         : BG,
        textColor      : color,
        dividerColor   : color,
        dividerHover   : BRAND.vanilla,   // 任何深底上都清晰
        dividerGlow    : color + '22',
      },
      /* ── fill：品牌色底＋深色 ── */
      fill: {
        containerBg    : color,
        containerBorder: `1px solid ${BG}`,
        itemBg         : color,
        textColor      : BG,
        dividerColor   : BG,
        dividerHover   : BG,              // glow 提供 hover 回饋
        dividerGlow    : BG + '22',
      },
    }
  }

  const THEMES = (() => {
    const map = {}
    Object.entries(THEME_COLORS).forEach(([name, color]) => {
      const pair = _mkTheme(color)
      map[name]              = pair.default
      map[`${name}-fill`]    = pair.fill
    })
    /* 向後相容別名 */
    map['default'] = map['shell']
    map['fill']    = map['shell-fill']
    return map
  })()

  /* ════════════════════════════════════════
     2. 全域預設值
  ════════════════════════════════════════ */
  const DEFAULT_CONFIG = {
    theme        : 'default',
    radius       : '6px',
    itemPadding  : '10px 14px',
    dividerWidth : '16px',
    animDuration : '280ms',
    animEasing   : 'ease-out',
  }

  function getGlobal () {
    return Object.assign({}, DEFAULT_CONFIG, window.ListCardConfig || {})
  }

  /* ════════════════════════════════════════
     3. 注入全域 CSS（只執行一次）
  ════════════════════════════════════════ */
  let _cssInjected = false
  function injectGlobalCSS () {
    if (_cssInjected) return
    _cssInjected = true
    const style = document.createElement('style')
    style.id = 'list-card-styles'
    style.textContent = `
/* ── list-card 容器 ── */
list-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
  font-family: system-ui, 'Segoe UI', sans-serif;
  font-size: 0.85rem;
  line-height: 1.5;
}

/* ── card-item ── */
card-item {
  display: none;          /* JS 控制顯示 */
  flex: 1;
  box-sizing: border-box;
  position: relative;
  min-width: 0;
  overflow: hidden;
  word-break: break-word;
}
card-item.lc-visible {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
card-item.lc-animate {
  animation: lcSlideIn var(--lc-anim-dur, 280ms) var(--lc-anim-ease, ease-out) forwards;
}

/* ── 虛線觸發器 ── */
.lc-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  transition: background 0.18s;
  gap: 0;
}
.lc-divider::before {
  content: '';
  display: block;
  width: 1px;
  height: 100%;
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  border-left: 2px dashed var(--lc-divider-color, #C3A5E5);
  transition: border-color 0.18s;
  pointer-events: none;
}
.lc-divider:hover::before {
  border-color: var(--lc-divider-hover, #C8DD5A);
}
.lc-divider:hover {
  background: var(--lc-divider-glow, #C3A5E533);
}
.lc-divider .lc-expand-hint {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 24px;
  border-radius: 3px;
  background: var(--lc-divider-color, #C3A5E5);
  opacity: 0.65;
  pointer-events: none;
  transition: background 0.18s, opacity 0.18s, height 0.18s;
  flex-shrink: 0;
}
.lc-divider:hover .lc-expand-hint {
  background: var(--lc-divider-hover, #C8DD5A);
  opacity: 1;
  height: 32px;
}

/* ── 動畫 ── */
@keyframes lcSlideIn {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ── 內容區 ── */
.lc-item-inner {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.lc-item-inner * {
  color: inherit;
}
`
    document.head.appendChild(style)
  }

  /* ════════════════════════════════════════
     4. <card-item> 元素
  ════════════════════════════════════════ */
  class CardItem extends HTMLElement {
    constructor () {
      super()
      this._originalHTML = null
    }

    connectedCallback () {
      // 儲存原始 innerHTML（僅首次）
      if (this._originalHTML === null) {
        this._originalHTML = this.innerHTML
      }
    }

    /** 套用樣式（由 list-card 呼叫） */
    applyTheme (theme, config) {
      const t       = THEMES[theme] || THEMES['shell']
      const padding = this.getAttribute('padding')    || config.itemPadding
      const bg      = this.getAttribute('bg')         || t.itemBg
      const align   = this.getAttribute('align')      || 'start'
      const fixedW  = this.getAttribute('data-width') || null
      const flex    = this.getAttribute('flex')       || '1'

      // data-width 優先：固定寬度，不參與彈性分配
      if (fixedW) {
        this.style.flex     = `0 0 ${fixedW}`
        this.style.width    = fixedW
        this.style.minWidth = fixedW
        this.style.maxWidth = fixedW
      } else {
        this.style.flex     = flex
        this.style.width    = ''
        this.style.minWidth = ''
        this.style.maxWidth = ''
      }

      this.style.background = bg
      this.style.color      = t.textColor
      this.style.padding    = padding
      this.style.alignItems = align === 'center' ? 'center'
                            : align === 'end'    ? 'flex-end'
                            : 'flex-start'
      // CSS 變數傳遞給子內容繼承
      this.style.setProperty('--lc-text', t.textColor)
    }

    /** 解析並渲染內容 */
    resolveContent () {
      const src = this.getAttribute('data-text-source')
      if (src) {
        const el = document.getElementById(src)
        if (el) {
          this.innerHTML = `<div class="lc-item-inner">${el.innerHTML}</div>`
        } else {
          console.warn(`[list-card] data-text-source: 找不到 id="${src}"，回退使用內部 HTML`)
          this.innerHTML = `<div class="lc-item-inner">${this._originalHTML || ''}</div>`
        }
      } else {
        // 避免重複包裝
        if (!this.querySelector('.lc-item-inner')) {
          const html = this.innerHTML
          this.innerHTML = `<div class="lc-item-inner">${html}</div>`
        }
      }
    }

    /** 重新同步 data-text-source */
    refreshSource () {
      this._originalHTML = this.innerHTML
      this.resolveContent()
    }
  }

  /* ════════════════════════════════════════
     5. <list-card> 元素
  ════════════════════════════════════════ */
  class ListCard extends HTMLElement {
    constructor () {
      super()
      this._items     = []
      this._dividers  = []
      this._expanded  = 1   // 目前顯示數量
      this._built     = false
    }

    connectedCallback () {
      injectGlobalCSS()
      // 等子元素就緒
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true })
      } else {
        // 微任務確保子元素已解析
        Promise.resolve().then(() => this._build())
      }
    }

    /* ── 設定讀取 ── */
    _cfg () {
      const g = getGlobal()
      return {
        theme       : this.getAttribute('theme')        || g.theme        || 'default',
        radius      : this.getAttribute('radius')       || g.radius       || '6px',
        dividerWidth: this.getAttribute('divider-width')|| g.dividerWidth || '16px',
        animDuration: g.animDuration,
        animEasing  : g.animEasing,
        itemPadding : g.itemPadding,
        expandInit  : parseInt(this.getAttribute('expand') || '1', 10) || 1,
      }
    }

    /* ── 初始建構 ── */
    _build () {
      if (this._built) return
      this._built = true

      const cfg = this._cfg()
      const t   = THEMES[cfg.theme] || THEMES['shell']

      /* 容器樣式 */
      const border = this.getAttribute('border') || t.containerBorder
      this.style.background = t.containerBg
      this.style.border     = border
      this.style.borderRadius = cfg.radius
      this.style.setProperty('--lc-divider-color', t.dividerColor)
      this.style.setProperty('--lc-divider-hover', t.dividerHover)
      this.style.setProperty('--lc-divider-glow',  t.dividerGlow)
      this.style.setProperty('--lc-anim-dur',       cfg.animDuration)
      this.style.setProperty('--lc-anim-ease',      cfg.animEasing)

      /* 收集所有 card-item */
      this._items = Array.from(this.querySelectorAll(':scope > card-item'))
      if (!this._items.length) return

      /* 初始化每個 item */
      this._items.forEach((item, i) => {
        item.applyTheme(cfg.theme, cfg)
        item.resolveContent()
        item.classList.remove('lc-visible', 'lc-animate')
      })

      /* 建構 DOM 結構：item + divider 交錯 */
      const fragment = document.createDocumentFragment()
      this._dividers = []

      this._items.forEach((item, i) => {
        fragment.appendChild(item)

        // 除了最後一個 item，每個後面加虛線
        if (i < this._items.length - 1) {
          const div = this._makeDivider(i, cfg)
          this._dividers.push(div)
          fragment.appendChild(div)
        } else {
          this._dividers.push(null) // 最後一個無虛線
        }
      })

      // 清空並重組
      this.innerHTML = ''
      this.appendChild(fragment)

      /* 套用初始展開數量 */
      this._expanded = Math.min(cfg.expandInit, this._items.length)
      this._render(false)

      /* 通知就緒 */
      this.dispatchEvent(new CustomEvent('card-ready', {
        bubbles: true,
        detail: { count: this._items.length, theme: cfg.theme }
      }))
    }

    /* ── 建立虛線觸發器 ── */
    _makeDivider (afterIndex, cfg) {
      const div = document.createElement('div')
      div.className = 'lc-divider'
      div.style.width = cfg.dividerWidth

      const hint = document.createElement('span')
      hint.className = 'lc-expand-hint'
      // hint 為純色塊長方形，無文字
      div.appendChild(hint)

      div.addEventListener('click', () => {
        // 只有「當前最後一個可見 item 的虛線」才有作用
        const lastVisibleIndex = this._expanded - 1
        if (afterIndex === lastVisibleIndex && this._expanded < this._items.length) {
          this._expanded++
          this._render(true)
          this.dispatchEvent(new CustomEvent('card-expand', {
            bubbles: true,
            detail: { index: this._expanded - 1, total: this._items.length }
          }))
        }
      })

      return div
    }

    /* ── 渲染可見狀態 ── */
    _render (animate) {
      this._items.forEach((item, i) => {
        const visible = i < this._expanded
        const wasVisible = item.classList.contains('lc-visible')

        if (visible) {
          item.classList.add('lc-visible')
          if (animate && !wasVisible) {
            item.classList.remove('lc-animate')
            void item.offsetWidth // reflow
            item.classList.add('lc-animate')
          }
        } else {
          item.classList.remove('lc-visible', 'lc-animate')
        }
      })

      // 虛線顯示邏輯
      this._dividers.forEach((div, i) => {
        if (!div) return
        const afterLastVisible = i === this._expanded - 1
        const hasNext = this._expanded < this._items.length

        if (i < this._expanded - 1) {
          // item 之間已展開的虛線：顯示但不可互動（灰化）
          div.style.display = 'flex'
          div.style.opacity = '0.35'
          div.style.cursor  = 'default'
          div.style.pointerEvents = 'none'
        } else if (afterLastVisible && hasNext) {
          // 當前最後一個 item 的虛線：可點擊
          div.style.display = 'flex'
          div.style.opacity = '1'
          div.style.cursor  = 'pointer'
          div.style.pointerEvents = 'auto'
        } else {
          // 後面的虛線（尚未展開到此）
          div.style.display = 'none'
        }
      })
    }

    /* ════════════════
       公開 API
    ═══════════════ */

    /** 展開至第 n 個 item（1-based） */
    expandTo (n) {
      this._expanded = Math.min(Math.max(1, n), this._items.length)
      this._render(true)
    }

    /** 展開全部 */
    expandAll () {
      this.expandTo(this._items.length)
    }

    /** 收回至第一個 */
    reset () {
      this.expandTo(1)
    }

    /** 動態切換主題 */
    setTheme (name) {
      const cfg = this._cfg()
      const theme = THEMES[name] || THEMES['shell']
      this.setAttribute('theme', name)

      this.style.background = theme.containerBg
      this.style.border     = theme.containerBorder
      this.style.setProperty('--lc-divider-color', theme.dividerColor)
      this.style.setProperty('--lc-divider-hover', theme.dividerHover)
      this.style.setProperty('--lc-divider-glow',  theme.dividerGlow)

      this._items.forEach(item => item.applyTheme(name, cfg))
    }

    /** 動態更新設定 */
    setConfig (obj) {
      window.ListCardConfig = Object.assign(getGlobal(), obj)
    }

    /** 回傳所有 card-item 陣列 */
    getItems () {
      return [...this._items]
    }

    /**
     * 重新同步 data-text-source
     * @param {number} [index] 省略則全部同步
     */
    refreshSource (index) {
      if (index !== undefined) {
        this._items[index]?.refreshSource()
      } else {
        this._items.forEach(item => item.refreshSource())
      }
    }
  }

  /* ════════════════════════════════════════
     6. 註冊自訂元素
  ════════════════════════════════════════ */
  if (!customElements.get('card-item')) {
    customElements.define('card-item', CardItem)
  }
  if (!customElements.get('list-card')) {
    customElements.define('list-card', ListCard)
  }

})()

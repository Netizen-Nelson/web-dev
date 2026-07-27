/**
 * <text-splitter> Web Component
 * 將文字（含 HTML 標籤）大約等分至多個目標區塊。
 *
 * 屬性：
 *   src          CSS 選擇器，指向隱藏容器（取 innerHTML）
 *   text         直接傳入 HTML 字串
 *   targets      逗號分隔的 CSS 選擇器，指定目標區塊（可任意散落頁面）
 *   mode         sentence | word | paragraph | delimiter（預設 sentence）
 *   delimiter    強制切割符號（預設 |||），出現在內容中時最優先
 *   balance      char（預設）：以字元數均衡分配
 *   trim-empty   true（預設）：忽略空白段落
 *   font-size    套用到所有目標區塊的字體大小（如 1.2rem）
 *   color        套用到所有目標區塊的文字色彩（如 #C6C7BD）
 *
 * 全域設定：
 *   TextSplitter.config({ mode, delimiter, trimEmpty, fontSize, color })
 *   TextSplitter.resetConfig()
 *
 * JS API（選取元素後）：
 *   el.split()            重新觸發分割
 *   el.setText(html)      以新內容覆蓋並觸發分割
 *   el.clearOverride()    清除 setText 覆蓋，回復原始來源
 */

(() => {
  'use strict';

  /* ═══════════════════════════════════════════
     全域預設設定
  ═══════════════════════════════════════════ */
  const DEFAULT_CONFIG = {
    mode      : 'sentence',
    delimiter : '|||',
    trimEmpty : true,
    balance   : 'char',
    fontSize  : null,
    color     : null,
  };

  let _cfg = { ...DEFAULT_CONFIG };

  /* ═══════════════════════════════════════════
     工具函式
  ═══════════════════════════════════════════ */

  /** 以句末標點切割純文字，回傳句子陣列 */
  function splitBySentence(text) {
    const result = [];
    let buf = '';
    const endMarks = new Set(['.', '!', '?', '。', '！', '？', '…']);

    for (let i = 0; i < text.length; i++) {
      buf += text[i];
      if (endMarks.has(text[i])) {
        // 吃掉後接空白
        while (i + 1 < text.length && /\s/.test(text[i + 1])) {
          i++;
          buf += text[i];
        }
        const s = buf.trim();
        if (s) result.push(s);
        buf = '';
      }
    }
    const tail = buf.trim();
    if (tail) result.push(tail);
    return result;
  }

  /** 以空白切詞（中文視每字為詞） */
  function splitByWord(text) {
    return text.split(/\s+/).filter(Boolean);
  }

  /** 取得字串的純文字長度（去除 HTML 標籤） */
  function plainLen(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').length || html.length;
  }

  /**
   * 將 html 字串陣列均衡分配成 n 組（按字元數）。
   * 回傳長度為 n 的字串陣列，每個元素為該組所有單元拼接的 HTML。
   */
  function distributeToN(units, n) {
    if (!n || n <= 0) return [];
    if (n === 1) return [units.join('')];
    if (!units.length) return Array(n).fill('');

    const lens   = units.map(plainLen);
    const total  = lens.reduce((a, b) => a + b, 0);
    const target = total / n;

    const groups    = [];
    let cur         = [];
    let curLen      = 0;
    let groupsLeft  = n;

    for (let i = 0; i < units.length; i++) {
      cur.push(units[i]);
      curLen += lens[i];
      const unitsLeft = units.length - i - 1;

      if (groupsLeft > 1 && curLen >= target && unitsLeft >= groupsLeft - 1) {
        groups.push(cur.join(''));
        cur        = [];
        curLen     = 0;
        groupsLeft--;
      }
    }
    if (cur.length) groups.push(cur.join(''));

    // 補齊尾端空組
    while (groups.length < n) groups.push('');
    return groups;
  }

  /**
   * 取得容器的頂層節點清單：
   *   - 元素節點 → { html: outerHTML, text: textContent, isBlock: true }
   *   - 文字節點 → { html: textContent, text: textContent, isBlock: false }
   */
  function getTopLevelUnits(container) {
    const units = [];
    container.childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        units.push({ html: node.outerHTML, text: node.textContent, isBlock: true });
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        units.push({ html: node.textContent, text: node.textContent, isBlock: false });
      }
    });
    return units;
  }

  /* ═══════════════════════════════════════════
     主分割函式
  ═══════════════════════════════════════════ */

  /**
   * @param {string}  html      原始 HTML 內容
   * @param {number}  n         目標分組數
   * @param {string}  mode      sentence | word | paragraph | delimiter
   * @param {string}  delim     強制切割符號
   * @param {boolean} trimEmpty 是否去空
   * @returns {string[]}        長度為 n（或 delimiter 數量）的 HTML 字串陣列
   */
  function splitContent(html, n, mode, delim, trimEmpty) {

    /* ── 最高優先：內容含分割符號 ────────────── */
    if (html.includes(delim)) {
      let parts = html.split(delim);
      if (trimEmpty) parts = parts.map(p => p.trim()).filter(Boolean);
      return parts;
    }

    /* ── delimiter 模式但無符號：全放第一區 ──── */
    if (mode === 'delimiter') {
      return [html, ...Array(n - 1).fill('')];
    }

    /* ── 解析 DOM，取頂層單元 ─────────────────── */
    const temp  = document.createElement('div');
    temp.innerHTML = html;
    const blocks  = getTopLevelUnits(temp);

    let units = [];

    /* ── paragraph：頂層元素各自為一單元 ─────── */
    if (mode === 'paragraph') {
      units = blocks.map(b => b.html);

      // 退化：無頂層元素 → 以雙換行切段
      if (!units.length) {
        units = html.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
      }
    }

    /* ── sentence：在頂層元素之間 / 純文字內切句 */
    else if (mode === 'sentence') {
      blocks.forEach(b => {
        const sents = splitBySentence(b.text);
        if (b.isBlock && sents.length <= 1) {
          // 整個 block 只有一句 → 保留完整 HTML
          units.push(b.html);
        } else if (b.isBlock && sents.length > 1) {
          // 多句 block：按句切出，但為保留標籤完整性，
          // 先推整個 block，再在分組時視為多個文字單元
          // 策略：輸出純文字句子（若需保留格式請用 delimiter 模式）
          sents.forEach(s => units.push(s));
        } else {
          // 純文字節點
          sents.forEach(s => units.push(s));
        }
      });

      // 若頂層完全空白，直接對整段 text 切句
      if (!units.length) {
        splitBySentence(temp.textContent).forEach(s => units.push(s));
      }
    }

    /* ── word：以詞為最小單元 ─────────────────── */
    else if (mode === 'word') {
      blocks.forEach(b => {
        splitByWord(b.text).forEach(w => units.push(w));
      });
      if (!units.length) {
        splitByWord(temp.textContent).forEach(w => units.push(w));
      }
    }

    if (trimEmpty) units = units.filter(u => u.trim());

    return distributeToN(units, n);
  }

  /* ═══════════════════════════════════════════
     Web Component
  ═══════════════════════════════════════════ */

  class TextSplitterElement extends HTMLElement {

    /* ── 生命週期 ─────────────────────────────── */

    connectedCallback() {
      this.style.display = 'none'; // 控制元件本身不可見

      const go = () => this.split();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', go, { once: true });
      } else {
        // 延遲一個 tick，確保 targets 已在 DOM 中
        setTimeout(go, 0);
      }
    }

    /* ── 取得來源 HTML ────────────────────────── */

    _getSourceHtml() {
      // 最高：setText() 覆蓋值
      if (this._override !== undefined) return this._override;

      // 其次：text 屬性
      const textAttr = this.getAttribute('text');
      if (textAttr !== null) return textAttr;

      // 再次：src 選擇器指向的隱藏容器
      const src = this.getAttribute('src');
      if (src) {
        const el = document.querySelector(src);
        if (el) return el.innerHTML;
      }

      return '';
    }

    /* ── 主分割方法（可公開呼叫） ────────────── */

    split() {
      const html = this._getSourceHtml();
      if (!html.trim()) return;

      const mode      = this.getAttribute('mode')      ?? _cfg.mode;
      const delim     = this.getAttribute('delimiter') ?? _cfg.delimiter;
      const trimEmpty = (this.getAttribute('trim-empty') ?? String(_cfg.trimEmpty)) !== 'false';
      const fontSize  = this.getAttribute('font-size') || _cfg.fontSize;
      const color     = this.getAttribute('color')     || _cfg.color;

      const targets = (this.getAttribute('targets') || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => document.querySelector(s))
        .filter(Boolean);

      if (!targets.length) return;

      const parts = splitContent(html, targets.length, mode, delim, trimEmpty);

      targets.forEach((el, i) => {
        el.innerHTML = parts[i] ?? '';
        if (fontSize) el.style.fontSize = fontSize;
        if (color)    el.style.color    = color;
      });

      // 分割完成事件
      this.dispatchEvent(new CustomEvent('text-split', {
        bubbles: true,
        detail : { parts, targetCount: targets.length },
      }));
    }

    /* ── 公開 JS API ──────────────────────────── */

    /** 以新的 HTML 覆蓋來源並立即重新分割 */
    setText(newHtml) {
      this._override = newHtml;
      this.split();
    }

    /** 清除 setText() 覆蓋，回復原始 src / text 屬性 */
    clearOverride() {
      delete this._override;
      this.split();
    }

    /* ── 靜態全域設定 ─────────────────────────── */

    static config(opts = {}) {
      Object.assign(_cfg, opts);
    }

    static resetConfig() {
      _cfg = { ...DEFAULT_CONFIG };
    }
  }

  /* ═══════════════════════════════════════════
     註冊
  ═══════════════════════════════════════════ */
  customElements.define('text-splitter', TextSplitterElement);

  // 全域存取點
  window.TextSplitter = TextSplitterElement;

})();

(() => {
  'use strict';
  const DEFAULT_CONFIG = {
    mode      : 'sentence',
    delimiter : '|||',
    trimEmpty : true,
    balance   : 'char',
    fontSize  : null,
    color     : null,
  };

  let _cfg = { ...DEFAULT_CONFIG };

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

  function splitByWord(text) {
    return text.split(/\s+/).filter(Boolean);
  }

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

  function splitContent(html, n, mode, delim, trimEmpty) {
    if (html.includes(delim)) {
      let parts = html.split(delim);
      if (trimEmpty) parts = parts.map(p => p.trim()).filter(Boolean);
      return parts;
    }

    if (mode === 'delimiter') {
      return [html, ...Array(n - 1).fill('')];
    }

    const temp  = document.createElement('div');
    temp.innerHTML = html;
    const blocks  = getTopLevelUnits(temp);

    let units = [];

    /* ── paragraph：頂層元素各自為一單元 ─────── */
    if (mode === 'paragraph') {
      units = blocks.map(b => b.html);

      if (!units.length) {
        units = html.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
      }
    }

    else if (mode === 'sentence') {
      blocks.forEach(b => {
        const sents = splitBySentence(b.text);
        if (b.isBlock && sents.length <= 1) {
          units.push(b.html);
        } else if (b.isBlock && sents.length > 1) {
          sents.forEach(s => units.push(s));
        } else {
          sents.forEach(s => units.push(s));
        }
      });

      if (!units.length) {
        splitBySentence(temp.textContent).forEach(s => units.push(s));
      }
    }

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

  class TextSplitterElement extends HTMLElement {

    connectedCallback() {
      this.style.display = 'none'; // 控制元件本身不可見

      const go = () => this.split();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', go, { once: true });
      } else {
        setTimeout(go, 0);
      }
    }

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

      this.dispatchEvent(new CustomEvent('text-split', {
        bubbles: true,
        detail : { parts, targetCount: targets.length },
      }));
    }
    
    setText(newHtml) {
      this._override = newHtml;
      this.split();
    }

    clearOverride() {
      delete this._override;
      this.split();
    }

    static config(opts = {}) {
      Object.assign(_cfg, opts);
    }

    static resetConfig() {
      _cfg = { ...DEFAULT_CONFIG };
    }
  }

  customElements.define('text-splitter', TextSplitterElement);
  window.TextSplitter = TextSplitterElement;
})();

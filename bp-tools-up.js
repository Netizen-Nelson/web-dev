/**
 * bp-tools-patch.js  v2.1
 * ─────────────────────────────────────────────────────────────
 * 【A】BPTools 全域事件匯流排（頂層宣告，任何時間都能安全使用）
 * 【B】InfoRegion 擴充：<ir-choice> 分支路徑 + link 發事件
 * 【C】DualCell 擴充：on-link 訂閱解鎖遮罩
 * 【D】WordFlip 擴充：link / answer-src / unlock-on / group
 * 【E】ir-challenge 輸入驗證元件
 * 【F】bp-slide 投影片元件（原 slider-show）
 *
 * 載入順序：
 *   <script src="bp-tools.js"></script>
 *   <script src="bp-tools-patch.js"></script>
 *
 * 頁面自訂訂閱寫法（避免 BPTools is not defined）：
 *   (function wait() {
 *     if (typeof BPTools === 'undefined') { setTimeout(wait, 50); return; }
 *     BPTools.on('my:event', () => { ... });
 *   })();
 *
 * changelog：
 *   v1.x  各項功能逐步新增
 *   v2.0  bp-slide 整合
 *   v2.1  BPTools 移至頂層；bp-slide connectedCallback 修正；
 *         word-flip 改用 data-content 屬性
 * ─────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════════
   A. BPTools 全域事件匯流排
      頂層立即宣告，確保 bp-slide / ir-challenge / word-flip
      在任何時間點都能安全呼叫 BPTools.emit() / BPTools.on()
═══════════════════════════════════════════════════════════════ */
window.BPTools = {
  _listeners : {},
  _fired     : new Set(),

  on(ev, fn) {
    (this._listeners[ev] = this._listeners[ev] || []).push(fn);
  },

  emit(ev, data = {}) {
    this._fired.add(ev);
    (this._listeners[ev] || []).forEach(fn => fn(data));
  },

  off(ev, fn) {
    if (!this._listeners[ev]) return;
    this._listeners[ev] = this._listeners[ev].filter(f => f !== fn);
  },
};

/* ═══════════════════════════════════════════════════════════════
   F. BpSlide（<bp-slide>）投影片元件
      頂層宣告，不依賴 bp-tools.js，可獨立運作。
      BrandColors / BPTools 不存在時自動降級。
═══════════════════════════════════════════════════════════════ */
class BpSlide extends HTMLElement {
  constructor() {
    super();
    this.currentPart = 1;
    this.currentSlideInPart = 0;
    this.partsData = {};
    this.isTransitioning = false;
    this.container = null;
    this._slideUnlocked = new Set();
    this._sliderLocked  = false;
  }

  static get observedAttributes() {
    return [
      'theme','height','current-part',
      'next-part-btn-text','prev-part-btn-text','finish-btn-text','restart-btn-text',
      'next-part-btn-position','show-part-indicator','part-transition',
      'auto-hide-nav','auto-show-part-buttons',
      'arrow-color','arrow-bg','dot-color','active-dot-color',
      'show-dots','show-arrows','loop','show-page-numbers',
      'update-header','update-title','header-template','title-template',
      'part-btn-color','part-btn-bg','part-btn-font-size','part-btn-padding','part-btn-border-radius',
      'show-finish','show-restart',
      'finish-btn-bg','finish-btn-color','restart-btn-bg','restart-btn-color',
      'fontcolor-subtitle','fontcolor-main','fontcolor-footer',
      'extra-note-hover-color','extra-note-prefix','extra-note-postfix',
      'spoiler-mode','spoiler-text','spoiler-color',
      'quiz-require-complete',
      'link','unlock-on',
    ];
  }

  connectedCallback() {
    this.render();
    this.analyzeParts();        /* 必須在 render() 後、updateDisplay() 前立刻執行 */
    this.setupEventListeners();
    this.setupExtraNotes();
    this.setupSpoilerMasks();
    this.setupQuizzes();
    this._setupBPTools();
    this.updateDisplay();       /* 同步呼叫，不用 setTimeout */
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;
    if (name === 'current-part') {
      this.currentPart = parseInt(newVal) || 1;
      this.currentSlideInPart = 0;
      this.updateDisplay();
    } else {
      this.render();
      this.analyzeParts();
      this.setupEventListeners();
    }
  }

  /* ── 顏色解析 ── */
  parseColor(val) {
    if (!val) return null;
    if (typeof BrandColors !== 'undefined') {
      const r = BrandColors.resolve(val);
      if (r) return r;
    }
    const map = {
      'bg':'#0c0d0c','background':'#0c0d0c',
      'surface':'#333333','fill':'#333333','region':'#333333',
      'shell':'#c6c7bd','lavender':'#C3A5E5','special':'#C8DD5A',
      'warning':'#F08080','salmon':'#E5C3B3','attention':'#E5E5A6',
      'sky':'#04b5a3','safe':'#81E6D9','brown':'#d9b375',
      'info':'#90CDF4','pink':'#FFB3D9','orange':'#f69653',
    };
    return map[val.toLowerCase()] ?? val;
  }

  getThemeColor() {
    const t = this.getAttribute('theme') || 'shell';
    return this.parseColor(t.replace('-outline','')) || this.parseColor('shell');
  }

  getContrastColor(hex) {
    if (!hex) return '#e0e0e0';
    if (typeof wfContrastColor !== 'undefined') return wfContrastColor(hex);
    const c = hex.replace('#','');
    const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    return (0.299*r+0.587*g+0.114*b)/255 > 0.5 ? '#1a1a1a' : '#e0e0e0';
  }

  /* ── BPTools 連動 ── */
  _bp() { return typeof BPTools !== 'undefined' ? BPTools : null; }

  _setupBPTools() {
    const bp = this._bp();
    if (!bp) return;
    const unlockOn = this.getAttribute('unlock-on');
    if (!unlockOn) return;
    this._sliderLocked = true;
    this._lockAllNav();
    if (bp._fired?.has(unlockOn)) {
      this._sliderLocked = false;
      this._unlockAllNav();
    } else {
      bp.on(unlockOn, () => {
        this._sliderLocked = false;
        this._unlockAllNav();
        this.checkQuizCompletion();
      });
    }
  }

  _lockAllNav() {
    ['prev-btn','next-btn','next-part-btn','prev-part-btn'].forEach(c => {
      const el = this.container?.querySelector('.'+c);
      if (el) el.disabled = true;
    });
  }

  _unlockAllNav() {
    ['prev-btn','prev-part-btn'].forEach(c => {
      const el = this.container?.querySelector('.'+c);
      if (el) el.disabled = false;
    });
  }

  _emitSlideEvents() {
    const bp    = this._bp();
    if (!bp) return;
    const slide = this.getCurrentPartSlides()[this.currentSlideInPart];
    const ev    = slide?.getAttribute('link');
    if (ev) bp.emit(ev, { sliderId:this.id||null, part:this.currentPart, slide:this.currentSlideInPart });
  }

  _checkSlideUnlock() {
    const bp      = this._bp();
    const slide   = this.getCurrentPartSlides()[this.currentSlideInPart];
    if (!slide) return;
    const unlockOn = slide.getAttribute('unlock-on');
    if (!unlockOn) return;
    if (this._slideUnlocked.has(unlockOn)) return;
    if (bp?._fired?.has(unlockOn)) { this._slideUnlocked.add(unlockOn); return; }
    this.disableNavigation();
    if (!bp) return;
    bp.on(unlockOn, () => {
      this._slideUnlocked.add(unlockOn);
      const cur = this.getCurrentPartSlides()[this.currentSlideInPart];
      if (cur === slide) this.enableNavigation();
    });
  }

  /* ── 解析分段 ── */
  analyzeParts() {
    const all = Array.from(this.querySelectorAll('[slide]'));
    this.partsData = {};
    all.forEach(s => {
      const p = parseInt(s.getAttribute('part')) || 1;
      (this.partsData[p] = this.partsData[p] || []).push(s);
    });
    all.forEach(s => s.style.display = 'none');
  }

  /* ── Extra Notes ── */
  setupExtraNotes() {
    const gPre  = this.getAttribute('extra-note-prefix')  || '';
    const gPost = this.getAttribute('extra-note-postfix') || '';
    this.querySelectorAll('extra-note').forEach(note => {
      const targetId = note.getAttribute('target');
      const source   = note.getAttribute('source');
      const pre  = note.getAttribute('prefix')  !== null ? note.getAttribute('prefix')  : gPre;
      const post = note.getAttribute('postfix') !== null ? note.getAttribute('postfix') : gPost;
      if (!targetId || !source) { console.warn('extra-note 需要 target 和 source'); return; }
      const span = document.createElement('span');
      span.className = 'extra-note-trigger'; span.style.display = 'inline';
      let preHTML = '';
      if (pre) {
        const m = pre.match(/bi-[\w-]+/);
        preHTML = m
          ? pre.slice(0,pre.indexOf(m[0])) + `<i class="bi ${m[0]}"></i>` + pre.slice(pre.indexOf(m[0])+m[0].length)
          : pre;
      }
      span.innerHTML = preHTML + note.innerHTML.trim() + post;
      span.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const tgt = document.getElementById(targetId);
        if (!tgt) return;
        const srcEl = document.getElementById(source);
        const div = document.createElement('div');
        div.className = 'extra-note-content';
        div.innerHTML = srcEl ? srcEl.innerHTML : source;
        tgt.innerHTML = ''; tgt.appendChild(div);
        setTimeout(() => div.classList.add('show'), 10);
      });
      note.parentNode.replaceChild(span, note);
    });
  }

  /* ── Spoiler Masks ── */
  setupSpoilerMasks() {
    const mode  = this.getAttribute('spoiler-mode');
    const text  = this.getAttribute('spoiler-text') || '點擊查看內容';
    const color = this.parseColor(this.getAttribute('spoiler-color')) || this.getThemeColor();
    if (mode === 'true' || mode === 'full')
      this.querySelectorAll('[slide]').forEach(s => this.applySpoilerMask(s, text, color));
    this.querySelectorAll('[spoiler]').forEach(d =>
      this.applySpoilerMask(d, d.getAttribute('spoiler') || text, color));
  }

  applySpoilerMask(el, text, color) {
    if (el.classList.contains('spoiler-masked')) return;
    el.classList.add('spoiler-masked'); el.style.position = 'relative';
    const mask = document.createElement('div');
    mask.className = 'spoiler-mask';
    Object.assign(mask.style, {
      position:'absolute',top:'0',left:'0',width:'100%',height:'100%',
      backgroundColor:color,display:'flex',alignItems:'center',
      justifyContent:'center',cursor:'pointer',zIndex:'100',
      transition:'opacity 0.3s ease',borderRadius:'8px',
    });
    const tc = document.createElement('div');
    Object.assign(tc.style, {
      textAlign:'center',padding:'20px',color:this.getContrastColor(color),
      fontSize:'1.2rem',fontWeight:'500',lineHeight:'1.6',
      display:'flex',alignItems:'center',justifyContent:'center',height:'100%',
    });
    tc.innerHTML = text; mask.appendChild(tc);
    mask.addEventListener('click', e => {
      e.stopPropagation(); mask.style.opacity = '0';
      setTimeout(() => { mask.remove(); el.classList.remove('spoiler-masked'); }, 300);
    });
    el.appendChild(mask);
  }

  /* ── Quiz 填空題 ── */
  setupQuizzes() {
    this.querySelectorAll('quiz').forEach((quiz, idx) => {
      const orig    = quiz.textContent;
      const answers = [...orig.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());
      if (!answers.length) return;
      const container = document.createElement('span');
      container.className = 'quiz-container' + (quiz.getAttribute('classname') ? ' '+quiz.getAttribute('classname') : '');
      container.dataset.quizId  = `quiz-${Date.now()}-${idx}`;
      container.dataset.answers = JSON.stringify(answers);
      let bi = 0;
      container.innerHTML = orig.replace(/\{\{([^}]+)\}\}/g, () =>
        `<span class="quiz-blank" contenteditable="true" data-blank-index="${bi++}" spellcheck="false"></span>`);
      container.querySelectorAll('.quiz-blank').forEach(blank => {
        blank.addEventListener('input', () => this.checkQuizCompletion());
        blank.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const next = blank.nextElementSibling?.classList.contains('quiz-blank')
            ? blank.nextElementSibling
            : container.querySelector('.quiz-blank:not([data-filled])');
          if (next) next.focus();
        });
      });
      quiz.parentNode.replaceChild(container, quiz);
    });
    this.checkQuizCompletion();
  }

  checkQuizCompletion() {
    if (this._sliderLocked) { this.disableNavigation(); return false; }
    if (this.getAttribute('quiz-require-complete') === 'false') { this.enableNavigation(); return true; }
    const slide = this.getCurrentPartSlides()[this.currentSlideInPart];
    if (!slide) return true;
    const qs = slide.querySelectorAll('.quiz-container');
    if (!qs.length) { this.enableNavigation(); return true; }
    let ok = true;
    qs.forEach(c => c.querySelectorAll('.quiz-blank').forEach(b => { if (!b.textContent.trim()) ok = false; }));
    if (ok) this.enableNavigation(); else this.disableNavigation();
    return ok;
  }

  disableNavigation() {
    ['next-btn','next-part-btn'].forEach(c => {
      const el = this.container?.querySelector('.'+c);
      if (el) el.disabled = true;
    });
  }

  enableNavigation() {
    if (this._sliderLocked) return;
    ['next-btn','next-part-btn'].forEach(c => {
      const el = this.container?.querySelector('.'+c);
      if (el) el.disabled = false;
    });
  }

  showQuizResults(prev) {
    const qs = prev.querySelectorAll('.quiz-container');
    if (!qs.length) return null;
    return Array.from(qs).map(c => {
      const answers = JSON.parse(c.dataset.answers);
      const blanks  = c.querySelectorAll('.quiz-blank');
      return answers.map((ans, i) => {
        const user = (blanks[i]?.textContent||'').trim();
        return { correctAnswer:ans, userAnswer:user, isCorrect:user.toLowerCase()===ans.toLowerCase() };
      });
    });
  }

  getTotalParts()       { return Object.keys(this.partsData).length; }
  getCurrentPartSlides(){ return this.partsData[this.currentPart] || []; }
  isLastSlideInPart()   { return this.currentSlideInPart >= this.getCurrentPartSlides().length-1; }
  isFirstSlideInPart()  { return this.currentSlideInPart === 0; }
  isLastPart()          { return this.currentPart >= this.getTotalParts(); }
  isFirstPart()         { return this.currentPart === 1; }

  getGlobalSlideIndex() {
    let n = 0;
    for (const p of Object.keys(this.partsData).sort((a,b)=>+a-+b)) {
      if (+p < this.currentPart) n += this.partsData[p].length;
      else if (+p === this.currentPart) { n += this.currentSlideInPart; break; }
    }
    return n;
  }

  jumpToGlobalSlide(gi) {
    let cur = 0;
    for (const p of Object.keys(this.partsData).sort((a,b)=>+a-+b)) {
      const len = this.partsData[p].length;
      if (gi < cur+len) { this.currentPart=+p; this.currentSlideInPart=gi-cur; this.updateDisplay(); return; }
      cur += len;
    }
  }

  prevSlide() {
    if (this.isTransitioning) return;
    if (this.currentSlideInPart > 0) { this.currentSlideInPart--; this.updateDisplay(); }
    else if (this.getAttribute('loop')==='true') {
      this.currentSlideInPart = this.getCurrentPartSlides().length-1; this.updateDisplay();
    }
  }

  nextSlide() {
    if (this.isTransitioning) return;
    const slides = this.getCurrentPartSlides();
    if (this.currentSlideInPart < slides.length-1) { this.currentSlideInPart++; this.updateDisplay(); }
    else if (this.getAttribute('loop')==='true') { this.currentSlideInPart=0; this.updateDisplay(); }
  }

  nextPart() {
    if (this.isTransitioning || this.currentPart >= this.getTotalParts()) return;
    this.isTransitioning = true;
    this._doTransition('out', () => {
      this.currentPart++; this.currentSlideInPart = 0; this.updateDisplay();
      this._doTransition('in', () => { this.isTransitioning = false; });
      const d = { part:this.currentPart, total:this.getTotalParts(), sliderId:this.id||null };
      this.dispatchEvent(new CustomEvent('part-changed', { detail:d }));
      this._bp()?.emit('bpslide:part-changed', d);
    });
  }

  prevPart() {
    if (this.isTransitioning || this.currentPart <= 1) return;
    this.isTransitioning = true;
    this._doTransition('out', () => {
      this.currentPart--; this.currentSlideInPart = 0; this.updateDisplay();
      this._doTransition('in', () => { this.isTransitioning = false; });
      this.dispatchEvent(new CustomEvent('part-changed', { detail:{ part:this.currentPart, total:this.getTotalParts() } }));
    });
  }

  restart() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this._doTransition('out', () => {
      this.currentPart=1; this.currentSlideInPart=0; this._slideUnlocked.clear();
      this.updateDisplay();
      this._doTransition('in', () => { this.isTransitioning=false; });
      this.dispatchEvent(new CustomEvent('restarted', { detail:{ part:1 } }));
      this._bp()?.emit('bpslide:restarted', { sliderId:this.id||null });
    });
  }

  _doTransition(dir, cb) {
    const sc   = this.container?.querySelector('.slides-container');
    if (!sc) { cb(); return; }
    const type = this.getAttribute('part-transition') || 'slide';
    sc.style.transition = 'none';
    if (type === 'fade') {
      if (dir === 'out') {
        sc.style.opacity='1';
        setTimeout(() => { sc.style.transition='opacity 0.5s ease-out'; sc.style.opacity='0'; setTimeout(cb,500); }, 10);
      } else {
        sc.style.opacity='0';
        setTimeout(() => { sc.style.transition='opacity 0.5s ease-in'; sc.style.opacity='1'; setTimeout(cb,500); }, 10);
      }
    } else if (type === 'slide') {
      const cls = dir==='out' ? 'slide-out' : 'slide-in';
      sc.classList.add(cls);
      setTimeout(() => { sc.classList.remove(cls); cb(); }, 500);
    } else cb();
  }

  updateDisplay() {
    const slides = this.getCurrentPartSlides();
    if (!slides.length) return;

    /* 填空結果 */
    if (this.currentSlideInPart > 0) {
      const prev = slides[this.currentSlideInPart-1];
      const curr = slides[this.currentSlideInPart];
      if (prev && curr) {
        const results = this.showQuizResults(prev);
        if (results?.length) {
          let rc = curr.querySelector('.quiz-results-auto');
          if (!rc) { rc=document.createElement('div'); rc.className='quiz-results-auto'; curr.insertBefore(rc,curr.firstChild); }
          rc.innerHTML = results.map(qr =>
            '<div class="quiz-result-group">' +
            qr.map((item,i) => `<div class="quiz-result-item ${item.isCorrect?'correct':'incorrect'}">
              <span class="quiz-result-icon">${item.isCorrect?'✓':'✗'}</span>
              <span class="quiz-result-label">第 ${i+1} 空：</span>
              <span class="quiz-result-user">你的答案：<strong>${item.userAnswer||'(未填)'}</strong></span>
              <span class="quiz-result-correct">正確答案：<strong>${item.correctAnswer}</strong></span>
            </div>`).join('') + '</div>'
          ).join('');
        }
      }
    }

    /* 顯示 / 隱藏 */
    slides.forEach((s,i) => s.style.display = i===this.currentSlideInPart ? 'block' : 'none');

    /* 小點 */
    const dots = this.container?.querySelector('.dots-container');
    if (dots) {
      dots.innerHTML = '';
      slides.forEach((_,i) => {
        const d = document.createElement('div');
        d.className = `dot ${i===this.currentSlideInPart?'active':''}`;
        d.addEventListener('click', () => { this.currentSlideInPart=i; this.updateDisplay(); });
        dots.appendChild(d);
      });
    }

    /* 頁碼 */
    const pnc    = this.container?.querySelector('.page-numbers-container');
    const showPn = this.getAttribute('show-page-numbers')==='true';
    if (pnc && showPn) {
      pnc.innerHTML = '';
      Array.from(this.querySelectorAll('[slide]')).forEach((_,i) => {
        const b = document.createElement('button');
        b.className = `page-number ${i===this.getGlobalSlideIndex()?'active':''}`;
        b.textContent = i+1;
        b.addEventListener('click', () => this.jumpToGlobalSlide(i));
        pnc.appendChild(b);
      });
      pnc.style.display = 'flex';
    } else if (pnc) pnc.style.display = 'none';

    /* Part 指示器 */
    const pi = this.container?.querySelector('.part-indicator');
    if (pi) {
      pi.textContent = `Part ${this.currentPart} / ${this.getTotalParts()}`;
      pi.style.display = this.getAttribute('show-part-indicator')!=='false' ? 'block' : 'none';
    }

    /* Part 按鈕 */
    const auto  = this.getAttribute('auto-show-part-buttons')==='true';
    const showF = this.getAttribute('show-finish')  !=='false';
    const showR = this.getAttribute('show-restart') !=='false';
    const nPB = this.container?.querySelector('.next-part-btn');
    const pPB = this.container?.querySelector('.prev-part-btn');
    const fPB = this.container?.querySelector('.finish-btn');
    const rPB = this.container?.querySelector('.restart-btn');
    if (nPB && pPB && fPB && rPB) {
      if (auto) {
        nPB.style.display = (!this.isLastSlideInPart() || this.isLastPart()) ? 'none' : 'flex';
        fPB.style.display = (this.isLastSlideInPart() && this.isLastPart() && showF) ? 'flex' : 'none';
        pPB.style.display = (this.isFirstSlideInPart() && !this.isFirstPart()) ? 'flex' : 'none';
        rPB.style.display = (this.isLastPart() && this.isLastSlideInPart() && showR) ? 'flex' : 'none';
      } else {
        [nPB,pPB,fPB,rPB].forEach(b => b.style.display='none');
      }
    }

    /* 上下頁按鈕 */
    const prevBtn = this.container?.querySelector('.prev-btn');
    const nextBtn = this.container?.querySelector('.next-btn');
    if (prevBtn && nextBtn) {
      const loop = this.getAttribute('loop')==='true';
      prevBtn.disabled = !loop && this.currentSlideInPart===0;
      nextBtn.disabled = !loop && this.isLastSlideInPart();
    }

    /* 頁頭更新 */
    if (this.getAttribute('update-header')==='true' || this.getAttribute('update-title')==='true') {
      const cur = slides[this.currentSlideInPart];
      if (cur) {
        const fill = tpl => (tpl||'')
          .replace('{part}',  this.currentPart)
          .replace('{slide}', this.currentSlideInPart+1)
          .replace('{total}', slides.length);
        if (this.getAttribute('update-header')==='true') {
          const h = document.querySelector('header h1, header .title');
          if (h) h.textContent = fill(this.getAttribute('header-template') || 'Part {part} - Slide {slide}');
        }
        if (this.getAttribute('update-title')==='true')
          document.title = fill(this.getAttribute('title-template') || 'Slide {slide} of {total}');
      }
    }

    this.checkQuizCompletion();
    this._emitSlideEvents();
    this._checkSlideUnlock();
  }

  setupEventListeners() {
    const Q = s => this.container?.querySelector(s);
    Q('.prev-btn')     ?.addEventListener('click', () => this.prevSlide());
    Q('.next-btn')     ?.addEventListener('click', () => this.nextSlide());
    Q('.next-part-btn')?.addEventListener('click', () => this.nextPart());
    Q('.prev-part-btn')?.addEventListener('click', () => this.prevPart());
    Q('.restart-btn')  ?.addEventListener('click', () => this.restart());
    Q('.finish-btn')   ?.addEventListener('click', () => {
      const d = { part:this.currentPart, total:this.getTotalParts(), sliderId:this.id||null };
      this.dispatchEvent(new CustomEvent('finished', { detail:d }));
      const link = this.getAttribute('link');
      if (link) this._bp()?.emit(link, d);
      this._bp()?.emit('bpslide:finished', d);
    });
    document.addEventListener('keydown', e => {
      if (e.key==='ArrowLeft')  this.prevSlide();
      if (e.key==='ArrowRight') this.nextSlide();
    });
  }

  render() {
    const h      = this.getAttribute('height') || '400px';
    const nPBT   = this.getAttribute('next-part-btn-text')  || '下一部分 →';
    const pPBT   = this.getAttribute('prev-part-btn-text')  || '← 上一部分';
    const finT   = this.getAttribute('finish-btn-text')     || '完成';
    const resT   = this.getAttribute('restart-btn-text')    || '重新開始';
    const nPBPos = this.getAttribute('next-part-btn-position') || 'center';
    const showDots   = this.getAttribute('show-dots')   !== 'false';
    const showArrows = this.getAttribute('show-arrows') !== 'false';
    const tc = this.getThemeColor();
    const p  = v => this.parseColor(v);
    const gc = v => this.getContrastColor(v);

    const vars = {
      '--theme-color'           : tc,
      '--arrow-color'           : p(this.getAttribute('arrow-color'))        || tc,
      '--arrow-bg'              : p(this.getAttribute('arrow-bg'))           || 'rgba(51,51,51,0.8)',
      '--dot-color'             : p(this.getAttribute('dot-color'))          || 'rgba(198,199,189,0.3)',
      '--active-dot-color'      : p(this.getAttribute('active-dot-color'))   || tc,
      '--part-btn-bg'           : p(this.getAttribute('part-btn-bg'))        || tc,
      '--part-btn-color'        : p(this.getAttribute('part-btn-color'))     || gc(tc),
      '--part-btn-font-size'    : this.getAttribute('part-btn-font-size')    || '0.9rem',
      '--part-btn-padding'      : this.getAttribute('part-btn-padding')      || '8px 16px',
      '--part-btn-border-radius': this.getAttribute('part-btn-border-radius')|| '6px',
      '--finish-btn-bg'         : p(this.getAttribute('finish-btn-bg'))      || tc,
      '--finish-btn-color'      : p(this.getAttribute('finish-btn-color'))   || gc(tc),
      '--restart-btn-bg'        : p(this.getAttribute('restart-btn-bg'))     || tc,
      '--restart-btn-color'     : p(this.getAttribute('restart-btn-color'))  || gc(tc),
      '--fontcolor-subtitle'    : p(this.getAttribute('fontcolor-subtitle')) || p('lavender'),
      '--fontcolor-main'        : p(this.getAttribute('fontcolor-main'))     || p('shell'),
      '--fontcolor-footer'      : p(this.getAttribute('fontcolor-footer'))   || p('sky'),
      '--extra-note-hover-color': p(this.getAttribute('extra-note-hover-color')) || p('special'),
      '--show-dots'             : showDots   ? 'flex' : 'none',
      '--show-arrows'           : showArrows ? 'flex' : 'none',
      '--part-btn-position'     : nPBPos,
    };
    Object.entries(vars).forEach(([k,v]) => this.style.setProperty(k,v));

    if (!document.getElementById('bp-slide-style')) {
      const s = document.createElement('style');
      s.id = 'bp-slide-style';
      s.textContent = `
        bp-slide{display:block;position:relative}
        extra-note{display:inline}
        bp-slide .slider-wrapper{position:relative;overflow-x:hidden;overflow-y:auto;word-wrap:break-word;overflow-wrap:break-word}
        bp-slide .slides-container{display:flex;transition:transform 0.3s ease-in-out;height:100%;overflow:hidden}
        bp-slide [slide]{min-width:100%;max-width:100%;flex-shrink:0;word-wrap:break-word;overflow-wrap:break-word;word-break:break-word;white-space:normal;overflow:hidden;box-sizing:border-box}
        bp-slide [slide] *{word-wrap:break-word;overflow-wrap:break-word;word-break:break-word}
        bp-slide .slide-content{display:flex;flex-direction:column;gap:20px;padding:30px;background:#333333;border-radius:8px;height:100%;box-sizing:border-box}
        bp-slide .slide-subtitle{font-size:1.2rem;color:var(--fontcolor-subtitle,#C3A5E5);font-weight:500;padding-bottom:10px;border-bottom:2px solid rgba(198,199,189,0.2)}
        bp-slide .slide-main{font-size:1.5rem;color:var(--fontcolor-main,#c6c7bd);line-height:1.6;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        bp-slide .slide-main p{margin-bottom:15px}
        bp-slide .slide-main p:last-child{margin-bottom:0}
        bp-slide .slide-footer{font-size:0.9rem;color:var(--fontcolor-footer,#04b5a3);padding-top:10px;border-top:1px solid rgba(198,199,189,0.13)}
        .extra-note-trigger{display:inline;text-decoration:underline;text-decoration-color:var(--theme-color,#c6c7bd);text-decoration-thickness:2px;text-underline-offset:3px;cursor:pointer;transition:all 0.3s;color:inherit}
        .extra-note-trigger:hover{text-decoration-color:var(--extra-note-hover-color,#C8DD5A);text-decoration-thickness:3px;color:var(--extra-note-hover-color,#C8DD5A)}
        .extra-note-content{background:#333333;padding:12px;color:#c6c7bd;line-height:1.75;opacity:0;transform:translateY(-10px);transition:all 0.5s ease}
        .extra-note-content.show{opacity:1;transform:translateY(0)}
        .extra-note-content strong{color:var(--color-special,#C8DD5A)}
        .spoiler-mask{backdrop-filter:blur(10px);user-select:none}
        .spoiler-mask:hover{opacity:0.95!important}
        .spoiler-mask:active{transform:scale(0.98)}
        .spoiler-masked{overflow:hidden}
        .quiz-container{display:inline;font-size:inherit;line-height:inherit}
        .quiz-blank{display:inline-block;min-width:60px;padding:2px 8px;margin:0 2px;background:rgba(51,51,51,0.6);border:none;border-bottom:2px solid var(--theme-color,#c6c7bd);color:#c6c7bd;font-size:inherit;font-family:inherit;outline:none;transition:all 0.2s;cursor:text}
        .quiz-blank:focus{background:rgba(51,51,51,0.9);box-shadow:0 2px 4px rgba(0,0,0,0.2)}
        .quiz-blank:empty::before{content:attr(placeholder);color:rgba(198,199,189,0.4)}
        .quiz-results-auto{background:transparent;padding:0;margin-bottom:20px;max-height:350px;overflow-y:auto}
        .quiz-results-auto::-webkit-scrollbar{width:8px}
        .quiz-results-auto::-webkit-scrollbar-track{background:rgba(51,51,51,0.3);border-radius:4px}
        .quiz-results-auto::-webkit-scrollbar-thumb{background:rgba(198,199,189,0.5);border-radius:4px}
        .quiz-result-group{margin-bottom:15px}
        .quiz-result-item{display:flex;align-items:center;gap:12px;padding:10px;margin:6px 0;border-radius:6px;font-size:0.95rem;flex-wrap:wrap}
        .quiz-result-item.correct{background:rgba(129,230,217,0.12)}
        .quiz-result-item.incorrect{background:rgba(240,128,128,0.12)}
        .quiz-result-icon{font-size:1.2rem;font-weight:600;min-width:20px}
        .quiz-result-item.correct .quiz-result-icon{color:var(--color-safe,#81E6D9)}
        .quiz-result-item.incorrect .quiz-result-icon{color:var(--color-warning,#F08080)}
        .quiz-result-label{color:rgba(198,199,189,0.7);font-weight:500}
        .quiz-result-user strong,.quiz-result-correct strong{color:var(--color-special,#C8DD5A);font-weight:600}
        bp-slide .page-numbers-container{display:none;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px;margin-top:8px;margin-bottom:4px;padding:0 10px}
        bp-slide .page-number{width:18px;height:18px;border:none;background:rgba(51,51,51,0.6);color:rgba(198,199,189,0.7);border-radius:3px;font-size:0.65rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;padding:0;user-select:none}
        bp-slide .page-number:hover{background:rgba(51,51,51,0.9);color:#c6c7bd;transform:scale(1.15)}
        bp-slide .page-number.active{background:var(--theme-color,#c6c7bd);color:#0c0d0c;font-weight:600;transform:scale(1.1)}
        bp-slide .controls{display:flex;justify-content:center;align-items:center;gap:15px;margin-top:4px}
        bp-slide .prev-btn,bp-slide .next-btn{background:var(--arrow-bg,rgba(51,51,51,0.8));border:none;color:var(--arrow-color,#c6c7bd);width:36px;height:36px;border-radius:50%;cursor:pointer;display:var(--show-arrows,flex);align-items:center;justify-content:center;font-size:1.2rem;transition:all 0.2s;user-select:none}
        bp-slide .prev-btn:hover:not(:disabled),bp-slide .next-btn:hover:not(:disabled){background:#333333;transform:scale(1.1)}
        bp-slide .prev-btn:disabled,bp-slide .next-btn:disabled{opacity:0.35;cursor:not-allowed}
        bp-slide .dots-container{display:var(--show-dots,flex);gap:8px}
        bp-slide .dot{width:8px;height:8px;border-radius:50%;background:var(--dot-color,rgba(198,199,189,0.3));cursor:pointer;transition:all 0.3s}
        bp-slide .dot.active{background:var(--active-dot-color,#c6c7bd);width:24px;border-radius:4px}
        bp-slide .part-indicator{position:absolute;top:10px;right:10px;background:rgba(51,51,51,0.85);color:var(--theme-color,#c6c7bd);padding:6px 12px;border-radius:6px;font-size:0.85rem;font-weight:500;z-index:10;backdrop-filter:blur(4px)}
        bp-slide .part-buttons{display:flex;justify-content:var(--part-btn-position,center);align-items:center;gap:12px;margin-top:20px;flex-wrap:wrap}
        bp-slide .next-part-btn,bp-slide .prev-part-btn,bp-slide .finish-btn,bp-slide .restart-btn{background:var(--part-btn-bg,#c6c7bd);color:var(--part-btn-color,#333333);border:none;padding:var(--part-btn-padding,8px 16px);border-radius:var(--part-btn-border-radius,6px);font-size:var(--part-btn-font-size,0.9rem);font-weight:500;cursor:pointer;transition:all 0.3s;display:none;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
        bp-slide .next-part-btn:hover,bp-slide .prev-part-btn:hover,bp-slide .finish-btn:hover,bp-slide .restart-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.3)}
        bp-slide .finish-btn{background:var(--finish-btn-bg);color:var(--finish-btn-color)}
        bp-slide .restart-btn{background:var(--restart-btn-bg);color:var(--restart-btn-color)}
        @keyframes slideOutLeft{from{transform:translateX(0);opacity:1}to{transform:translateX(-100%);opacity:0}}
        @keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        bp-slide .slide-out{animation:slideOutLeft 0.5s ease-out forwards}
        bp-slide .slide-in{animation:slideInRight 0.5s ease-out forwards}
      `;
      document.head.appendChild(s);
    }

    const slides = Array.from(this.querySelectorAll('[slide]'));
    this.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper'; wrapper.style.height = h;
    const pi = document.createElement('div'); pi.className = 'part-indicator';
    wrapper.appendChild(pi);
    const sc = document.createElement('div'); sc.className = 'slides-container';
    slides.forEach(s => sc.appendChild(s));
    wrapper.appendChild(sc); this.appendChild(wrapper);

    const pnc = document.createElement('div'); pnc.className = 'page-numbers-container';
    this.appendChild(pnc);

    const ctrl = document.createElement('div'); ctrl.className = 'controls';
    ctrl.innerHTML = '<button class="prev-btn">◀</button><div class="dots-container"></div><button class="next-btn">▶</button>';
    this.appendChild(ctrl);

    const pb = document.createElement('div'); pb.className = 'part-buttons';
    pb.innerHTML = `<button class="prev-part-btn">${pPBT}</button><button class="next-part-btn">${nPBT}</button><button class="finish-btn">${finT}</button><button class="restart-btn">${resT}</button>`;
    this.appendChild(pb);

    this.container = this;
  }
}

customElements.define('bp-slide', BpSlide);

/* ═══════════════════════════════════════════════════════════════
   B ~ E：等 bp-tools.js 就緒後掛載
═══════════════════════════════════════════════════════════════ */
(function waitForBpTools() {

  if (!customElements.get('info-region')) {
    if ((waitForBpTools._tries = (waitForBpTools._tries || 0) + 1) > 200) {
      console.error('[bp-tools-patch] 等待逾時，請確認 bp-tools.js 已在此檔案之前載入。');
      return;
    }
    setTimeout(waitForBpTools, 50);
    return;
  }

  /* ── B. InfoRegion：分支路徑 + link ── */
  if (!customElements.get('ir-choice'))
    customElements.define('ir-choice', class extends HTMLElement {});

  const irProto        = customElements.get('info-region').prototype;
  const _orig_ir_act   = irProto._onActivated;
  const _orig_ir_reset = irProto.reset;

  irProto._onActivated = function () {
    this._applyBorderStyles();
    const choices = Array.from(this.querySelectorAll(':scope > ir-choice'));
    if (choices.length) { this._renderChoices(choices); return; }
    const lk = this.getAttribute('link');
    if (lk) BPTools.emit(lk, { id: this.id });
    _orig_ir_act.call(this);
  };

  irProto._renderChoices = function (choices) {
    this.querySelector('.ir-choices-wrap')?.remove();
    const cfg       = window.InfoRegionConfig || {};
    const selfColor = this.getAttribute('color') || cfg.defaultColor || 'sky';
    const align     = this.getAttribute('choice-align') || 'left';
    const jMap      = { left:'flex-start', center:'center', right:'flex-end' };
    const wrap      = document.createElement('div');
    wrap.className  = 'ir-choices-wrap';
    wrap.style.cssText = `display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;justify-content:${jMap[align]||'flex-start'};`;
    choices.forEach(c => {
      const target = c.getAttribute('target');
      if (!target) { console.warn('[bp-tools-patch] <ir-choice> 缺少 target'); return; }
      const btn = document.createElement('button');
      btn.className = `ir-btn ir-btn--${c.getAttribute('color')||selfColor}`;
      const ic = c.getAttribute('icon');
      if (ic) { const i=document.createElement('i'); i.className=`bi bi-${ic}`; i.style.marginRight='5px'; btn.appendChild(i); }
      btn.appendChild(document.createTextNode(c.textContent.trim()));
      btn.addEventListener('click', () => {
        wrap.remove();
        const tgt = document.getElementById(target);
        if (!tgt) { console.warn('[bp-tools-patch] 找不到 target='+target); return; }
        tgt._activatedBy = this.id;
        document.querySelectorAll('info-region[active="true"]').forEach(el => {
          if (el !== tgt && el._activatedBy) el.reset();
        });
        const self = this;
        setTimeout(() => self.reset(), 30);
        if (tgt.getAttribute('active')==='true') { tgt.reset(); setTimeout(() => tgt.activate(), 60); }
        else setTimeout(() => tgt.activate(), 60);
      });
      wrap.appendChild(btn);
    });
    this.appendChild(wrap);
  };

  irProto.reset = function () {
    _orig_ir_reset.call(this);
    this.querySelector('.ir-choices-wrap')?.remove();
  };

  /* ── C. DualCell：on-link 解鎖遮罩 ── */
  const dcProto        = DualCell.prototype;
  const _orig_dc_cell  = dcProto.createCell;
  const _orig_dc_parse = dcProto.parseCol;

  dcProto.parseCol = function (el) {
    const d = _orig_dc_parse.call(this, el);
    d.unlockOn = el?.getAttribute('on-link') || null;
    return d;
  };

  dcProto.createCell = function (col, ri, ci) {
    const cell = _orig_dc_cell.call(this, col, ri, ci);
    if (col.unlockOn) {
      BPTools.on(col.unlockOn, () => {
        cell.querySelectorAll('.dc-overlay').forEach(o => o.remove());
        cell.querySelector('.dc-content')?.classList.remove('blurred');
        cell.classList.remove('has-overlay');
      });
    }
    return cell;
  };

  /* ── D. WordFlip 擴充 ── */
  const _wfGroups = new Map();

  if (!document.getElementById('wf-patch-styles')) {
    const s = document.createElement('style');
    s.id = 'wf-patch-styles';
    s.textContent = `word-flip.wf-bp-locked{opacity:.35;cursor:not-allowed!important;pointer-events:none;border-bottom-style:dashed!important}`;
    document.head.appendChild(s);
  }

  const wfProto     = customElements.get('word-flip').prototype;
  const _orig_wf_cb = wfProto.connectedCallback;

  wfProto.connectedCallback = function () { _orig_wf_cb.call(this); this._bpInit(); };

  wfProto._bpInit = function () {
    const link      = this.getAttribute('link');
    const answerSrc = this.getAttribute('answer-src');
    const unlockOn  = this.getAttribute('unlock-on');
    const group     = this.getAttribute('group');

    /* answer-src：從外部元素讀取 HTML */
    if (answerSrc) {
      const id = answerSrc.startsWith('#') ? answerSrc.slice(1) : answerSrc;
      const el = document.getElementById(id);
      if (el) this._bpAnswerHtml = el.innerHTML;
      else console.warn('[bp-tools-patch] answer-src 找不到 id="'+id+'"');
    }

    /* unlock-on：預設鎖定 */
    if (unlockOn) {
      this.classList.add('wf-bp-locked');
      BPTools.on(unlockOn, () => this.classList.remove('wf-bp-locked'));
    }

    /* group：互斥展開 */
    if (group) {
      if (!_wfGroups.has(group)) _wfGroups.set(group, new Set());
      _wfGroups.get(group).add(this);
    }

    /* capture 階段（在原本 handler 之前執行） */
    this.addEventListener('click', () => {
      /* answer-src：翻開前設佔位符，bubble 階段再替換 */
      if (this._bpAnswerHtml && !this.classList.contains('wf-flipped'))
        this.setAttribute('data-content', '▌');
      /* group 互斥 */
      if (group && !this.classList.contains('wf-flipped') && _wfGroups.has(group))
        _wfGroups.get(group).forEach(el => {
          if (el !== this && el.classList.contains('wf-flipped'))
            el.dispatchEvent(new MouseEvent('click', { bubbles:true }));
        });
    }, true);

    /* bubble 階段（在原本 handler 之後執行） */
    this.addEventListener('click', () => {
      const flipped = this.classList.contains('wf-flipped');
      /* answer-src：翻開後寫入完整 HTML */
      if (this._bpAnswerHtml && flipped) this.innerHTML = this._bpAnswerHtml;
      /* link：翻開時發事件 */
      if (link && flipped) BPTools.emit(link, { id: this.id || null });
    });
  };

  /* ── E. ir-challenge ── */
  if (!document.getElementById('ir-challenge-styles')) {
    const s = document.createElement('style');
    s.id = 'ir-challenge-styles';
    s.textContent = `
      ir-challenge{display:block;margin-top:12px}
      .irc-wrap{display:flex;gap:8px;align-items:stretch;flex-wrap:wrap}
      .irc-input{flex:1;min-width:160px;background:var(--color-float-bg-2,#242524);border:1.5px solid var(--irc-color,var(--color-sky,#04b5a3));border-radius:6px;color:var(--color-shell,#c6c7bd);padding:7px 12px;font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
      .irc-input:focus{box-shadow:0 0 0 3px rgba(var(--irc-rgb,4,181,163),.18)}
      .irc-input:disabled{opacity:.5;cursor:not-allowed}
      .irc-btn{background:transparent;border:1.5px solid var(--irc-color,var(--color-sky,#04b5a3));border-radius:6px;color:var(--irc-color,var(--color-sky,#04b5a3));font-family:inherit;cursor:pointer;white-space:nowrap;padding:7px 20px;transition:background .2s,color .2s,filter .2s;line-height:1}
      .irc-btn:hover:not(:disabled){background:var(--irc-color,var(--color-sky,#04b5a3));color:#111}
      .irc-btn:active:not(:disabled){filter:brightness(.9)}
      .irc-btn:disabled{opacity:.45;cursor:not-allowed}
      .irc-hint{margin-top:6px;font-size:.8rem;color:var(--color-border-subtle,rgba(198,199,189,.4));line-height:1.5}
      .irc-msg{margin-top:6px;font-size:.82rem;font-weight:500;min-height:1.2em;line-height:1.5;transition:opacity .2s}
      .irc-msg.irc-ok{color:var(--color-safe,#81E6D9)}
      .irc-msg.irc-error{color:var(--color-warning,#F08080)}
    `;
    document.head.appendChild(s);
  }

  function _hexToRgb(hex) {
    const c = (hex||'').replace('#','');
    if (c.length!==6) return '4,181,163';
    return parseInt(c.slice(0,2),16)+','+parseInt(c.slice(2,4),16)+','+parseInt(c.slice(4,6),16);
  }

  class IrChallenge extends HTMLElement {
    connectedCallback() { if (!this._built) { this._built=true; this._build(); } }
    _build() {
      const answers   = (this.getAttribute('answer')||'').split('|').map(s=>s.trim()).filter(Boolean);
      const link      = this.getAttribute('link');
      const colorName = this.getAttribute('color') || 'sky';
      const colorHex  = (typeof BrandColors!=='undefined' ? BrandColors.get(colorName) : null)
                        || '#04b5a3';
      this.style.setProperty('--irc-color', colorHex);
      this.style.setProperty('--irc-rgb',   _hexToRgb(colorHex));
      const fSize  = this.getAttribute('font-size')       || null;
      const bFSize = this.getAttribute('btn-font-size')   || fSize;
      const iFSize = this.getAttribute('input-font-size') || fSize;
      const bPad   = this.getAttribute('btn-padding')     || null;
      const caseSens = this.hasAttribute('case-sensitive');
      const wrap = document.createElement('div'); wrap.className='irc-wrap';
      const input= document.createElement('input');
      input.type='text'; input.className='irc-input';
      input.placeholder = this.getAttribute('placeholder')||'輸入答案…';
      if (iFSize) input.style.fontSize=iFSize;
      const btn=document.createElement('button'); btn.className='irc-btn';
      btn.textContent=this.getAttribute('btn-label')||'確認';
      if (bFSize) btn.style.fontSize=bFSize;
      if (bPad)   btn.style.padding=bPad;
      wrap.append(input,btn); this.appendChild(wrap);
      const hint=this.getAttribute('hint');
      if (hint) { const h=document.createElement('p'); h.className='irc-hint'; h.textContent=hint; this.appendChild(h); }
      const msg=document.createElement('p'); msg.className='irc-msg'; this.appendChild(msg);
      const verify=()=>{
        const val=input.value.trim();
        const ok=answers.some(a=>caseSens?val===a:val.toLowerCase()===a.toLowerCase());
        if (ok) {
          msg.className='irc-msg irc-ok'; msg.textContent='✓ 正確！';
          input.disabled=btn.disabled=true;
          if (link) BPTools.emit(link,{value:val});
        } else {
          msg.className='irc-msg irc-error'; msg.textContent='✗ 答案不正確，請再試一次。';
          input.select();
        }
      };
      btn.addEventListener('click',verify);
      input.addEventListener('keydown',e=>{ if(e.key==='Enter') verify(); });
      input.addEventListener('input',()=>{
        if(msg.classList.contains('irc-error')){ msg.className='irc-msg'; msg.textContent=''; }
      });
    }
  }

  if (!customElements.get('ir-challenge'))
    customElements.define('ir-challenge', IrChallenge);

  console.log('[bp-tools-patch] v2.1 載入完成 ✓');

})();

/* ═══════════════════════════════════════════════════════════════
   G. WordFlip 擴充樣式 + bp-notice 公告元件
   新增 style-type：
     card      浮起卡片，有陰影和色邊，點擊展開更大
     popover   游標右側浮出說明泡泡（hover 觸發）
     glow      發光文字，適合強調關鍵詞
     neon      霓虹邊框，適合標題區塊
     chip      小型圓角標籤，適合密集標記
     ribbon    左色帶標籤，適合分類標注
     announce  公告橫幅，整行展開
   bp-notice 公告元件：
     <bp-notice color icon dismissible sticky>內容</bp-notice>
═══════════════════════════════════════════════════════════════ */
(function injectExtendedStyles() {
  if (document.getElementById('wf-extended-styles')) return;
  const s = document.createElement('style');
  s.id = 'wf-extended-styles';
  s.textContent = `

  /* ── card ───────────────────────────────────────────────── */
  word-flip.wf-style-card {
    display        : inline-flex;
    align-items    : center;
    gap            : 6px;
    background     : var(--color-surface, #333333);
    border         : 1px solid var(--wf-accent, var(--wf-color-lavender));
    border-left    : 4px solid var(--wf-accent, var(--wf-color-lavender));
    border-radius  : 6px;
    padding        : 6px 12px;
    font-size      : .88rem;
    color          : var(--color-shell, #c6c7bd);
    cursor         : pointer;
    box-shadow     : 0 2px 8px rgba(0,0,0,.35);
    transition     : all .2s ease;
    vertical-align : middle;
    text-decoration: none !important;
    border-bottom  : 1px solid var(--wf-accent, var(--wf-color-lavender)) !important;
  }
  word-flip.wf-style-card:hover {
    transform  : translateY(-2px);
    box-shadow : 0 6px 18px rgba(0,0,0,.5);
    filter     : brightness(1.08);
  }
  word-flip.wf-style-card.wf-flipped {
    display        : block;
    padding        : 16px 20px;
    border-radius  : 8px;
    border-left    : 4px solid var(--wf-accent, var(--wf-color-lavender));
    background     : var(--color-float-bg-2, #242524);
    box-shadow     : 0 8px 28px rgba(0,0,0,.6);
    line-height    : 1.75;
    font-size      : .92rem;
    margin         : 8px 0;
    animation      : wf-card-open .22s ease;
    border-bottom  : 1px solid var(--wf-accent) !important;
  }
  @keyframes wf-card-open {
    from { opacity:.4; transform:translateY(-6px) scaleY(.92); }
    to   { opacity:1;  transform:translateY(0)    scaleY(1);   }
  }

  /* ── glow ───────────────────────────────────────────────── */
  word-flip.wf-style-glow {
    color          : var(--wf-accent, var(--wf-color-sky));
    text-shadow    : 0 0 8px var(--wf-accent, var(--wf-color-sky)),
                     0 0 20px var(--wf-accent, var(--wf-color-sky));
    border-bottom  : none !important;
    cursor         : pointer;
    transition     : text-shadow .2s, filter .2s;
    font-weight    : 600;
  }
  word-flip.wf-style-glow:hover {
    text-shadow : 0 0 12px var(--wf-accent, var(--wf-color-sky)),
                  0 0 32px var(--wf-accent, var(--wf-color-sky)),
                  0 0 60px var(--wf-accent, var(--wf-color-sky));
  }
  word-flip.wf-style-glow.wf-flipped {
    display        : inline-block;
    padding        : 8px 14px;
    border-radius  : 6px;
    background     : rgba(var(--wf-accent-rgb, 4,181,163), .1);
    border         : 1px solid var(--wf-accent, var(--wf-color-sky));
    line-height    : 1.7;
    font-weight    : 400;
    text-shadow    : none;
    vertical-align : baseline;
  }

  /* ── neon ───────────────────────────────────────────────── */
  word-flip.wf-style-neon {
    display        : inline-flex;
    align-items    : center;
    padding        : 4px 14px;
    border         : 2px solid var(--wf-accent, var(--wf-color-pink));
    border-radius  : 4px;
    color          : var(--wf-accent, var(--wf-color-pink));
    font-weight    : 700;
    letter-spacing : .08em;
    text-transform : uppercase;
    font-size      : .82rem;
    cursor         : pointer;
    box-shadow     : 0 0 6px var(--wf-accent, var(--wf-color-pink)),
                     inset 0 0 6px rgba(var(--wf-accent-rgb, 255,179,217),.08);
    text-shadow    : 0 0 6px var(--wf-accent, var(--wf-color-pink));
    transition     : all .2s;
    text-decoration: none !important;
    vertical-align : middle;
  }
  word-flip.wf-style-neon:hover {
    box-shadow  : 0 0 14px var(--wf-accent),
                  inset 0 0 14px rgba(var(--wf-accent-rgb,255,179,217),.15);
    text-shadow : 0 0 14px var(--wf-accent);
  }
  word-flip.wf-style-neon.wf-flipped {
    display        : block;
    text-transform : none;
    font-weight    : 400;
    letter-spacing : 0;
    font-size      : .9rem;
    padding        : 12px 18px;
    line-height    : 1.75;
    margin         : 8px 0;
    animation      : wf-card-open .22s ease;
  }

  /* ── chip ───────────────────────────────────────────────── */
  word-flip.wf-style-chip {
    display        : inline-flex;
    align-items    : center;
    gap            : 4px;
    padding        : 2px 8px;
    background     : rgba(var(--wf-accent-rgb, 195,165,229),.15);
    border         : 1px solid rgba(var(--wf-accent-rgb, 195,165,229),.4);
    border-radius  : 999px;
    font-size      : .75rem;
    font-weight    : 600;
    color          : var(--wf-accent, var(--wf-color-lavender));
    cursor         : pointer;
    transition     : all .18s;
    vertical-align : middle;
    text-decoration: none !important;
  }
  word-flip.wf-style-chip:hover {
    background : rgba(var(--wf-accent-rgb,195,165,229),.28);
    transform  : scale(1.08);
  }
  word-flip.wf-style-chip.wf-flipped {
    border-radius  : 8px;
    padding        : 10px 14px;
    font-size      : .85rem;
    font-weight    : 400;
    display        : inline-block;
    line-height    : 1.7;
    vertical-align : baseline;
  }

  /* ── ribbon ─────────────────────────────────────────────── */
  word-flip.wf-style-ribbon {
    display        : inline-flex;
    align-items    : center;
    gap            : 7px;
    padding        : 3px 12px 3px 10px;
    background     : linear-gradient(
      135deg,
      var(--wf-accent, var(--wf-color-brown)) 0%,
      rgba(var(--wf-accent-rgb,217,179,117),.7) 100%
    );
    color          : #111;
    font-size      : .8rem;
    font-weight    : 700;
    cursor         : pointer;
    clip-path      : polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
    transition     : filter .2s, transform .2s;
    text-decoration: none !important;
    vertical-align : middle;
  }
  word-flip.wf-style-ribbon:hover { filter:brightness(1.15); transform:scale(1.04); }
  word-flip.wf-style-ribbon.wf-flipped {
    clip-path      : none;
    border-radius  : 6px;
    padding        : 10px 16px;
    font-weight    : 400;
    font-size      : .88rem;
    color          : #111;
    display        : inline-block;
    line-height    : 1.75;
    vertical-align : baseline;
    animation      : wf-card-open .22s ease;
  }

  /* ── announce ────────────────────────────────────────────── */
  word-flip.wf-style-announce {
    display        : flex;
    align-items    : center;
    gap            : 10px;
    width          : 100%;
    padding        : 12px 18px;
    background     : rgba(var(--wf-accent-rgb,200,221,90),.1);
    border-left    : 5px solid var(--wf-accent, var(--wf-color-special));
    border-radius  : 0 6px 6px 0;
    font-size      : .92rem;
    font-weight    : 600;
    color          : var(--wf-accent, var(--wf-color-special));
    cursor         : pointer;
    transition     : background .2s;
    text-decoration: none !important;
    margin         : 6px 0;
    box-sizing     : border-box;
  }
  word-flip.wf-style-announce:hover {
    background : rgba(var(--wf-accent-rgb,200,221,90),.18);
  }
  word-flip.wf-style-announce::before {
    content     : '📢';
    font-size   : 1.1rem;
    flex-shrink : 0;
  }
  word-flip.wf-style-announce.wf-flipped {
    flex-direction : column;
    align-items    : flex-start;
    font-weight    : 400;
    color          : var(--color-shell, #c6c7bd);
    background     : var(--color-float-bg-2, #242524);
    border-left    : 5px solid var(--wf-accent, var(--wf-color-special));
    border-radius  : 0 8px 8px 0;
    padding        : 16px 20px;
    line-height    : 1.8;
    animation      : wf-card-open .22s ease;
  }
  word-flip.wf-style-announce.wf-flipped::before { display:none; }

  /* ── bp-notice 公告元件 ──────────────────────────────────── */
  bp-notice {
    display        : flex;
    align-items    : flex-start;
    gap            : 12px;
    padding        : var(--bpn-padding, 14px 18px);
    border-radius  : 8px;
    border-left    : 5px solid var(--bpn-color, var(--color-sky, #04b5a3));
    background     : var(--bpn-bg, rgba(4,181,163,.1));
    color          : var(--color-shell, #c6c7bd);
    font-size      : var(--bpn-font-size, .92rem);
    line-height    : 1.75;
    position       : relative;
    margin         : 8px 0;
    animation      : bpn-in .3s ease;
    box-sizing     : border-box;
    transition     : opacity .4s ease, transform .4s ease;
  }
  bp-notice[sticky] {
    position       : sticky;
    top            : 0;
    z-index        : 9000;
    border-radius  : 0;
    margin         : 0;
    border-left    : none;
    border-bottom  : 3px solid var(--bpn-color, var(--color-sky, #04b5a3));
  }
  bp-notice[hidden-notice] { display: none; }
  @keyframes bpn-in {
    from { opacity:0; transform:translateY(-6px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  .bpn-icon {
    font-size   : var(--bpn-icon-size, 1.2rem);
    flex-shrink : 0;
    margin-top  : 1px;
    color       : var(--bpn-color, var(--color-sky, #04b5a3));
  }
  .bpn-body        { flex: 1; }
  .bpn-body strong { color: var(--bpn-color, var(--color-sky, #04b5a3)); }
  .bpn-body ul, .bpn-body ol { padding-left: 18px; margin-top: 6px; }
  .bpn-body li     { margin-bottom: 4px; }
  .bpn-close {
    background    : none;
    border        : none;
    color         : #555;
    cursor        : pointer;
    font-size     : 1rem;
    line-height   : 1;
    padding       : 0 4px;
    flex-shrink   : 0;
    transition    : color .15s;
    align-self    : flex-start;
  }
  .bpn-close:hover { color: var(--bpn-color, var(--color-sky, #04b5a3)); }

  /* ── 燃燒引線軌道 ── */
  .bpn-fuse-track {
    position      : absolute;
    bottom        : 0;
    left          : 0;
    right         : 0;
    height        : 4px;
    background    : rgba(var(--bpn-rgb, 4,181,163), .15);
    border-radius : 0 0 8px 8px;
    overflow      : visible;
  }
  .bpn-fuse-burned {
    position      : absolute;
    top           : 0; right: 0;
    height        : 100%; width: 0%;
    background    : rgba(30,31,30,.6);
    transition    : width var(--bpn-fuse-dur, 5000ms) linear;
    border-radius : 0 0 8px 0;
  }
  .bpn-fuse-live {
    position      : absolute;
    top           : 0; left: 0;
    height        : 100%; width: 100%;
    background    : linear-gradient(90deg, rgba(var(--bpn-rgb,4,181,163),.08) 0%, rgba(var(--bpn-rgb,4,181,163),.55) 100%);
    transition    : width var(--bpn-fuse-dur, 5000ms) linear;
    border-radius : 0 0 0 8px;
  }
  .bpn-fuse-spark {
    position      : absolute;
    top: 50%; transform: translate(-50%,-50%);
    width: 10px; height: 10px;
    border-radius : 50%;
    background    : #fff;
    box-shadow    : 0 0 0 2px var(--bpn-color,#04b5a3), 0 0 6px 3px var(--bpn-color,#04b5a3), 0 0 14px 6px rgba(var(--bpn-rgb,4,181,163),.6);
    transition    : left var(--bpn-fuse-dur, 5000ms) linear;
    z-index       : 2;
    animation     : bpn-flicker .12s ease-in-out infinite alternate;
  }
  @keyframes bpn-flicker {
    from { box-shadow: 0 0 0 2px var(--bpn-color,#04b5a3), 0 0 6px 3px var(--bpn-color,#04b5a3), 0 0 14px 6px rgba(var(--bpn-rgb,4,181,163),.6); transform:translate(-50%,-50%) scale(1); }
    to   { box-shadow: 0 0 0 3px var(--bpn-color,#04b5a3), 0 0 10px 5px var(--bpn-color,#04b5a3), 0 0 22px 10px rgba(var(--bpn-rgb,4,181,163),.45); transform:translate(-50%,-50%) scale(1.25); }
  }
  .bpn-fuse-ember {
    position:absolute; top:50%;
    width:3px; height:3px; border-radius:50%;
    background:var(--bpn-color,#04b5a3);
    opacity:0; pointer-events:none;
    animation:bpn-ember var(--e-dur,.6s) ease-out var(--e-delay,0s) infinite;
  }
  @keyframes bpn-ember {
    0%   { opacity:.9; transform:translate(0,-50%) scale(1); }
    100% { opacity:0;  transform:translate(var(--e-tx,4px),calc(-50% + var(--e-ty,-8px))) scale(0); }
  }
  `;
  document.head.appendChild(s);

  /* ── bp-notice 自訂元素 ────────────────────────────────── */
  if (!customElements.get('bp-notice')) {
    customElements.define('bp-notice', class extends HTMLElement {
      connectedCallback() {
        if (this._built) return;
        this._built = true;

        /* ── 讀取所有屬性 ── */
        const colorName  = this.getAttribute('color')      || 'sky';
        const icon       = this.getAttribute('icon')       || null;
        const dismiss    = this.hasAttribute('dismissible');
        const linkEv     = this.getAttribute('link')       || null;
        const unlockOn   = this.getAttribute('unlock-on')  || null;
        const autoHideMs = parseInt(this.getAttribute('auto-hide')) || 0;
        const fontSize   = this.getAttribute('font-size')  || null;
        const iconSize   = this.getAttribute('icon-size')  || null;
        const padding    = this.getAttribute('padding')    || null;

        /* ── 品牌色解析 ── */
        const hex = (typeof BrandColors !== 'undefined')
          ? BrandColors.get(colorName)
          : ({ sky:'#04b5a3', lavender:'#C3A5E5', special:'#C8DD5A',
               warning:'#F08080', safe:'#81E6D9', info:'#90CDF4',
               orange:'#f69653', pink:'#FFB3D9', attention:'#E5E5A6',
               salmon:'#E5C3B3', brown:'#d9b375', shell:'#c6c7bd',
               brown:'#d9b375' }[colorName] || '#04b5a3');

        const c   = hex.replace('#','');
        const rgb = parseInt(c.slice(0,2),16)+','+parseInt(c.slice(2,4),16)+','+parseInt(c.slice(4,6),16);

        this.style.setProperty('--bpn-color', hex);
        this.style.setProperty('--bpn-bg',    `rgba(${rgb},.1)`);
        if (fontSize) this.style.setProperty('--bpn-font-size', fontSize);
        if (iconSize) this.style.setProperty('--bpn-icon-size', iconSize);
        if (padding)  this.style.setProperty('--bpn-padding',   padding);

        /* ── 保存原始 HTML 內容 ── */
        const body = this.innerHTML;
        this.innerHTML = '';

        /* ── 左側圖示 ── */
        if (icon) {
          const ic = document.createElement('i');
          ic.className = `bi bi-${icon} bpn-icon`;
          this.appendChild(ic);
        }

        /* ── 內文（支援完整 HTML + Bootstrap Icons）── */
        const bd = document.createElement('div');
        bd.className = 'bpn-body';
        bd.innerHTML = body;
        this.appendChild(bd);

        /* ── 關閉按鈕 ── */
        if (dismiss) {
          const btn = document.createElement('button');
          btn.className   = 'bpn-close';
          btn.innerHTML   = '✕';
          btn.title       = '關閉';
          btn.addEventListener('click', () => this._hide(linkEv));
          this.appendChild(btn);
        }

        /* ── 淡出輔助方法 ── */
        this._hide = (ev) => {
          this.style.opacity   = '0';
          this.style.transform = 'translateY(-6px)';
          setTimeout(() => this.setAttribute('hidden-notice',''), 420);
          if (ev) BPTools.emit(ev, { id: this.id || null });
        };

        /* ── 啟動燃燒引線動畫 ── */
        const startAutoHide = () => {
          if (!autoHideMs) return;

          /* CSS 變數傳入倒數時間 */
          this.style.setProperty('--bpn-fuse-dur', autoHideMs + 'ms');
          this.style.setProperty('--bpn-rgb', rgb);

          /* 建立引線容器 */
          const track  = document.createElement('div');
          track.className = 'bpn-fuse-track';

          const burned = document.createElement('div');
          burned.className = 'bpn-fuse-burned';

          const live   = document.createElement('div');
          live.className = 'bpn-fuse-live';

          const spark  = document.createElement('div');
          spark.className = 'bpn-fuse-spark';
          spark.style.left = '100%';   /* 從右端開始 */

          /* 三顆煙火粒子，隨機飛散 */
          const embers = [
            { tx:'-4px', ty:'-10px', dur:'.55s', delay:'0s'    },
            { tx:'6px',  ty:'-8px',  dur:'.7s',  delay:'.18s'  },
            { tx:'-2px', ty:'-14px', dur:'.62s', delay:'.35s'  },
          ];
          embers.forEach(e => {
            const em = document.createElement('div');
            em.className = 'bpn-fuse-ember';
            em.style.setProperty('--e-tx',    e.tx);
            em.style.setProperty('--e-ty',    e.ty);
            em.style.setProperty('--e-dur',   e.dur);
            em.style.setProperty('--e-delay', e.delay);
            spark.appendChild(em);
          });

          track.appendChild(burned);
          track.appendChild(live);
          track.appendChild(spark);
          this.appendChild(track);

          /* 下一幀啟動 transition，讓瀏覽器能偵測到變化 */
          requestAnimationFrame(() => requestAnimationFrame(() => {
            burned.style.width = '100%';   /* 灰燼從右往左擴大 */
            live.style.width   = '0%';     /* 引線從右往左縮短 */
            spark.style.left   = '0%';     /* 火花從右移到左 */
          }));

          setTimeout(() => this._hide(linkEv), autoHideMs);
        };

        /* ── unlock-on：等事件後才顯示，顯示後才開始 auto-hide 倒數 ── */
        if (unlockOn) {
          this.setAttribute('hidden-notice','');
          const show = () => {
            this.removeAttribute('hidden-notice');
            this.style.animation = 'bpn-in .3s ease';
            startAutoHide(); /* 顯示後才倒數 */
          };
          if (BPTools._fired?.has(unlockOn)) show();
          else BPTools.on(unlockOn, show);
        } else {
          /* 無 unlock-on：直接顯示，同時開始倒數 */
          startAutoHide();
        }
      }
    });
  }

})();

/* ═══════════════════════════════════════════════════════════════
   H. BpNote 便利貼元件（原 sticky-wall.js）
      雙擊頁面任意空白處建立便利貼，整合 BrandColors 品牌色 + BPTools 匯流排。

   全域設定（在 patch 載入前定義，選填）：
     window.StickyNotesConfig = {
       defaultColor : 'lavender',   // 品牌色名稱或 hex
       defaultWidth : 280,
       position     : 'fixed',      // 'fixed' | 'absolute'
       storageKey   : 'my_notes',
       excludeClass : 'no-sticky',
       fontSize     : '.9rem',      // 便利貼字體大小
       lineHeight   : '1.7',        // 便利貼行高
       link         : 'note:saved', // 新增 / 修改便利貼時發出的 BPTools 事件
     };

   公開 API：
     BpNote.save()        手動儲存
     BpNote.clearAll()    清除全部
     BpNote.export()      匯出 JSON 陣列
     BpNote.import(arr)   匯入 JSON 陣列（疊加）
     BpNote.disable()     暫停雙擊建立
     BpNote.enable()      恢復雙擊建立
═══════════════════════════════════════════════════════════════ */
(function initBpNote() {

  /* ── 設定合併：BrandColors 優先 ── */
  const _raw = Object.assign({
    defaultColor : 'lavender',
    defaultWidth : 260,
    position     : 'fixed',
    storageKey   : 'bpnote_v1',
    zBase        : 8000,
    excludeTags  : ['INPUT','TEXTAREA','BUTTON','A','SELECT','LABEL','OPTION','SUMMARY'],
    excludeClass : 'sn-no-sticky',
    fontSize     : '.9rem',
    lineHeight   : '1.7',
    link         : null,
  }, window.StickyNotesConfig || {});

  /* 色名解析：優先 BrandColors，再 fallback hex */
  function resolveColor(val) {
    if (!val) return '#C3A5E5';
    if (typeof BrandColors !== 'undefined') {
      const r = BrandColors.resolve(val);
      if (r) return r;
    }
    const map = {
      lavender:'#C3A5E5', special:'#C8DD5A', salmon:'#E5C3B3',
      attention:'#E5E5A6', sky:'#04b5a3', safe:'#81E6D9',
      brown:'#d9b375', info:'#90CDF4', pink:'#FFB3D9',
      orange:'#f69653', warning:'#F08080', shell:'#c6c7bd',
    };
    return map[val.toLowerCase()] ?? val;
  }

  /* 從 BrandColors 取調色盤，若不可用則用預設 */
  function buildPalette() {
    const names = ['lavender','special','salmon','attention','sky','safe','brown','info','pink','orange','warning'];
    return names.map(n => ({ name: n.charAt(0).toUpperCase()+n.slice(1), val: resolveColor(n) }));
  }

  const CFG = Object.assign(_raw, {
    colors       : _raw.colors || buildPalette(),
    defaultColor : resolveColor(_raw.defaultColor),
  });

  let zTop    = CFG.zBase;
  let enabled = true;
  const pool  = [];

  /* ── CSS 注入（單次）── */
  function injectStyles() {
    if (document.getElementById('bpnote-styles')) return;
    const s = document.createElement('style');
    s.id = 'bpnote-styles';
    s.textContent = `
article.sn-note {
  position      : ${CFG.position};
  width         : ${CFG.defaultWidth}px;
  min-width     : 180px; min-height: 108px;
  background    : var(--sn-bg, #C3A5E5);
  border-radius : 7px;
  box-shadow    : 3px 5px 20px rgba(0,0,0,.55), 0 0 0 1.5px rgba(0,0,0,.12);
  display       : flex; flex-direction: column;
  font-family   : inherit;
  font-size     : ${CFG.fontSize};
  line-height   : ${CFG.lineHeight};
  color         : #111;
  resize        : both; overflow: hidden;
  transition    : box-shadow .18s, transform .12s;
  will-change   : transform;
}
article.sn-note:focus-within {
  box-shadow : 4px 7px 28px rgba(0,0,0,.7), 0 0 0 2px var(--sn-bg,#C3A5E5);
}
article.sn-note.sn-collapsed { min-height:unset; resize:horizontal; }
header.sn-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:5px 7px; gap:5px; background:rgba(0,0,0,.14);
  cursor:move; flex-shrink:0; border-radius:7px 7px 0 0; user-select:none;
}
.sn-palette { display:flex; gap:3px; flex-wrap:wrap; flex:1; }
.sn-dot {
  width:13px; height:13px; border-radius:50%; cursor:pointer;
  border:2px solid transparent; box-sizing:border-box; flex-shrink:0;
  transition:transform .14s, border-color .14s;
}
.sn-dot:hover     { transform:scale(1.4); }
.sn-dot.sn-active { border-color:rgba(0,0,0,.65); transform:scale(1.25); }
nav.sn-actions { display:flex; gap:3px; flex-shrink:0; }
button.sn-btn {
  background:rgba(0,0,0,.18); border:none; border-radius:3px;
  color:#111; cursor:pointer; width:20px; height:20px;
  display:flex; align-items:center; justify-content:center;
  font-size:.7rem; padding:0; line-height:1;
  transition:background .14s, color .14s; flex-shrink:0;
}
button.sn-btn:hover { background:rgba(0,0,0,.32); }
button.sn-del:hover { background:#c0392b; color:#fff; }
section.sn-body {
  flex:1; display:flex; flex-direction:column; padding:8px; overflow:hidden;
}
section.sn-body.sn-collapsed { display:none; }
textarea.sn-text {
  flex:1; resize:none; border:none;
  background:rgba(255,255,255,.28); border-radius:4px;
  padding:6px 8px; font-size:inherit; color:#111;
  font-family:inherit; outline:none; min-height:72px;
  width:100%; box-sizing:border-box; user-select:text;
  line-height:inherit; transition:background .15s;
}
textarea.sn-text::placeholder { color:rgba(0,0,0,.38); }
textarea.sn-text:focus        { background:rgba(255,255,255,.44); }
[data-bpnote-hint]::after {
  content:attr(data-bpnote-hint);
  position:fixed; bottom:18px; left:50%; transform:translateX(-50%);
  background:rgba(12,13,12,.85); color:#c6c7bd;
  border:1px solid #333; border-radius:6px;
  padding:8px 18px; font-size:.8rem;
  pointer-events:none; z-index:99999; opacity:0;
  animation:sn-hint-fade 3.5s ease forwards;
}
@keyframes sn-hint-fade {
  0%  { opacity:0; transform:translateX(-50%) translateY(6px); }
  15% { opacity:1; transform:translateX(-50%) translateY(0);   }
  75% { opacity:1; }
  100%{ opacity:0; }
}
    `;
    document.head.appendChild(s);
  }

  /* ── StickyNote 類別 ── */
  class StickyNote {
    constructor(opts = {}) {
      this.id    = opts.id    || ('sn_' + Date.now() + '_' + Math.random().toString(36).slice(2,5));
      this.color = opts.color || CFG.defaultColor;
      this.x     = opts.x != null ? opts.x : 120;
      this.y     = opts.y != null ? opts.y : 100;
      this._build(opts);
      this._makeDraggable();
      this._bindEvents();
      document.body.appendChild(this.el);
    }

    _build(opts) {
      const collapsed = !!opts.collapsed;
      const dotsHTML  = CFG.colors.map(c =>
        `<span class="sn-dot${c.val===this.color?' sn-active':''}" data-val="${c.val}"
         style="background:${c.val}" title="${c.name}"
         role="radio" tabindex="0" aria-label="顏色：${c.name}"></span>`
      ).join('');

      this.el = document.createElement('article');
      this.el.className = 'sn-note' + (collapsed ? ' sn-collapsed' : '');
      this.el.setAttribute('role','note');
      this.el.setAttribute('aria-label','便利貼');
      this.el.style.cssText =
        `left:${this.x}px;top:${this.y}px;--sn-bg:${this.color};z-index:${++zTop};` +
        (opts.width  ? `width:${opts.width}px;`  : '') +
        (opts.height && !collapsed ? `height:${opts.height}px;` : '');

      this.el.innerHTML =
        `<header class="sn-header">
          <div class="sn-palette" role="radiogroup" aria-label="便利貼顏色">${dotsHTML}</div>
          <nav class="sn-actions" aria-label="操作">
            <button class="sn-btn sn-min" title="收合/展開" aria-label="收合展開">─</button>
            <button class="sn-btn sn-del" title="刪除"      aria-label="刪除">✕</button>
          </nav>
        </header>
        <section class="sn-body${collapsed?' sn-collapsed':''}">
          <textarea class="sn-text" rows="7" placeholder="在此輸入備忘內容…">${opts.text||''}</textarea>
        </section>`;
    }

    _makeDraggable() {
      const hdr = this.el.querySelector('header.sn-header');
      let ox, oy, ol, ot, active = false;
      hdr.addEventListener('mousedown', e => {
        if (e.target.closest('.sn-btn,.sn-dot')) return;
        e.preventDefault();
        active = true;
        ox = e.clientX; oy = e.clientY;
        ol = parseInt(this.el.style.left) || 0;
        ot = parseInt(this.el.style.top)  || 0;
        this._front();
      });
      const onMove = e => {
        if (!active) return;
        this.el.style.left = (ol + e.clientX - ox) + 'px';
        this.el.style.top  = (ot + e.clientY - oy) + 'px';
      };
      const onUp = () => {
        if (!active) return;
        active = false;
        BpNote.save();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
      this._cleanDrag = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      };
    }

    _bindEvents() {
      /* 調色盤 */
      this.el.querySelectorAll('.sn-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          this.color = dot.dataset.val;
          this.el.style.setProperty('--sn-bg', this.color);
          this.el.querySelectorAll('.sn-dot').forEach(d => d.classList.remove('sn-active'));
          dot.classList.add('sn-active');
          BpNote.save();
          _emit();
        });
        dot.addEventListener('keydown', e => {
          if (e.key==='Enter'||e.key===' ') { e.preventDefault(); dot.click(); }
        });
      });

      /* 收合 */
      this.el.querySelector('.sn-min').addEventListener('click', () => {
        const body = this.el.querySelector('section.sn-body');
        const now  = body.classList.toggle('sn-collapsed');
        this.el.classList.toggle('sn-collapsed', now);
        BpNote.save();
      });

      /* 刪除 */
      this.el.querySelector('.sn-del').addEventListener('click', () => this._destroy());

      /* 輸入 */
      this.el.querySelector('textarea.sn-text').addEventListener('input', () => {
        BpNote.save(); _emit();
      });

      /* 置頂 */
      this.el.addEventListener('mousedown', () => this._front());

      /* ResizeObserver */
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => BpNote.save());
        ro.observe(this.el);
        this._cleanResize = () => ro.disconnect();
      }
    }

    _front() { this.el.style.zIndex = ++zTop; }

    _destroy() {
      if (this._cleanDrag)   this._cleanDrag();
      if (this._cleanResize) this._cleanResize();
      this.el.remove();
      const i = pool.indexOf(this);
      if (i > -1) pool.splice(i, 1);
      BpNote.save();
      _emit();
    }

    getData() {
      const body = this.el.querySelector('section.sn-body');
      return {
        id       : this.id,
        x        : parseInt(this.el.style.left)  || 0,
        y        : parseInt(this.el.style.top)   || 0,
        width    : this.el.offsetWidth,
        height   : this.el.offsetHeight,
        color    : this.color,
        text     : this.el.querySelector('textarea.sn-text').value,
        collapsed: body.classList.contains('sn-collapsed'),
      };
    }
  }

  /* ── BPTools 事件輔助 ── */
  function _emit() {
    if (CFG.link && typeof BPTools !== 'undefined')
      BPTools.emit(CFG.link, { count: pool.length, notes: pool.map(n => n.getData()) });
  }

  /* ── BpNote 公開管理器 ── */
  window.BpNote = {
    save() {
      try { localStorage.setItem(CFG.storageKey, JSON.stringify(pool.map(n => n.getData()))); }
      catch (_) {}
    },
    clearAll() { pool.slice().forEach(n => n._destroy()); this.save(); },
    export()   { return pool.map(n => n.getData()); },
    import(arr){ if (!Array.isArray(arr)) return; arr.forEach(d => pool.push(new StickyNote(d))); this.save(); },
    disable()  { enabled = false; },
    enable()   { enabled = true;  },
    _restore() {
      try {
        const arr = JSON.parse(localStorage.getItem(CFG.storageKey) || '[]');
        arr.forEach(d => pool.push(new StickyNote(d)));
      } catch (_) {}
    },
    _init() {
      injectStyles();
      this._restore();

      document.addEventListener('dblclick', e => {
        if (!enabled) return;
        const t = e.target;
        if (CFG.excludeTags.includes(t.tagName))                    return;
        if (t.closest('.sn-note'))                                   return;
        if (CFG.excludeClass && t.closest('.' + CFG.excludeClass))  return;

        let x = e.clientX - 12, y = e.clientY - 12;
        if (CFG.position === 'absolute') { x += window.scrollX; y += window.scrollY; }

        const note = new StickyNote({ x, y });
        pool.push(note);
        note.el.querySelector('textarea.sn-text').focus();
        this.save();
        _emit();
        document.body.removeAttribute('data-bpnote-hint');
      });

      /* 首次提示 */
      if (pool.length === 0) {
        document.body.setAttribute('data-bpnote-hint', '雙擊頁面任意空白處，即可建立便利貼 📌');
        setTimeout(() => document.body.removeAttribute('data-bpnote-hint'), 4000);
      }
    },
  };

  /* ── 自動啟動 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BpNote._init());
  } else {
    BpNote._init();
  }

  /* 向後相容：保留 StickyWall 別名 */
  window.StickyWall = window.BpNote;

})();

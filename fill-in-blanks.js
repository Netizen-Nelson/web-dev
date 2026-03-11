class FillInBlanks extends HTMLElement {
  constructor() {
    super();
    this.currentQuestion = 0;
    this.score = 0;
    this.answeredQuestions = new Set();
    this.showHomepage = false;
    this.homepageHTML = '';
    this._initialized = false;
    this._instanceId = 'fib-' + Math.random().toString(36).substr(2, 9);
  }

  connectedCallback() {
    setTimeout(() => {
      this.parseHTMLQuestions();
      this._initialized = true;
      this.render();
      this.attachEvents();
    }, 0);
  }
  
  disconnectedCallback() {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
    }
  }

  static get observedAttributes() {
    return [
      'questions', 'theme', 'focusring-colorstart', 'focusring-colorend', 'button-size',
      'show-navigator', 'completion-message', 'show-completion', 'show-reset',
      'show-bottom-nav', 'bottom-nav-prev-text', 'bottom-nav-next-text',
      'progress-label', 'check-button-text',
      'blanks-per-row', 'blank-width', 'blank-height', 'show-blank-numbers',
      'bg-color', 'bg-secondary', 'bg-tertiary', 'text-color', 'text-secondary', 'text-muted',
      'correct-bg', 'correct-color', 'wrong-bg', 'wrong-color',
      'explanation-border', 'explanation-color',
      'bottom-nav-bg', 'bottom-nav-btn-bg', 'bottom-nav-btn-color', 'bottom-nav-btn-disabled-opacity',
      'blank-bg', 'blank-border', 'blank-text-color',
      'progress-font-size', 'stem-font-size', 'blank-font-size',
      'nav-label-font-size', 'nav-btn-font-size', 'bottom-nav-font-size',
      'instruction-font-size', 'explanation-font-size', 'feedback-font-size',
      'complete-score-font-size', 'complete-message-font-size',
      'container-padding', 'border-radius', 'blank-gap'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._initialized) return;
    
    if (name === 'questions' && oldValue !== newValue) {
      this.render();
      this.attachEvents();
    }
    if (name === 'show-navigator' && oldValue !== newValue) {
      this.render();
      this.attachEvents();
    }
  }

  getStyleConfig() {
    const themeColors = {
      shell: '#c6c7bd',
      lavender: '#C3A5E5',
      special: '#b9c971',
      warning: '#E5A6A6',
      salmon: '#E5C3B3',
      attention: '#E5E5A6',
      sky: '#8BC2CF',
      safe: '#84c498',
      brown: '#d9c5b2',
      info: '#6f99D6',
      pink: '#FFB3D9',
      orange: '#f69653'
    };
    
    const buttonSizes = {
      sm: { padding: '2px 6px', fontSize: '0.8rem' },
      regular: { padding: '4px 10px', fontSize: '0.9rem' },
      lg: { padding: '8px 16px', fontSize: '0.95rem' }
    };
    
    const theme = this.getAttribute('theme') || 'lavender';
    const themeColor = themeColors[theme] || themeColors.lavender;
    const startColor = this.getAttribute('focusring-colorstart') || 'sky';
    const endColor = this.getAttribute('focusring-colorend') || 'safe';
    const buttonSize = this.getAttribute('button-size') || 'regular';
    
    const getContrastColor = (hexColor) => {
      const hex = hexColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#1C1C1E' : '#E5E5E5';
    };
    
    return {
      themeColor: themeColor,
      focusStart: themeColors[startColor] || themeColors.sky,
      focusEnd: themeColors[endColor] || themeColors.safe,
      buttonPadding: buttonSizes[buttonSize]?.padding || buttonSizes.regular.padding,
      buttonFontSize: buttonSizes[buttonSize]?.fontSize || buttonSizes.regular.fontSize,
      
      bgColor: this.getAttribute('bg-color') || '#1C1C1E',
      bgSecondary: this.getAttribute('bg-secondary') || '#242426',
      bgTertiary: this.getAttribute('bg-tertiary') || '#2a2a2c',
      
      textColor: this.getAttribute('text-color') || '#E5E5E5',
      textSecondary: this.getAttribute('text-secondary') || '#c6c7bd',
      textMuted: this.getAttribute('text-muted') || '#888',
      
      correctBg: this.getAttribute('correct-bg') || '#1a3a1a',
      correctColor: this.getAttribute('correct-color') || '#84c498',
      wrongBg: this.getAttribute('wrong-bg') || '#3a1a1a',
      wrongColor: this.getAttribute('wrong-color') || '#E5A6A6',
      
      explanationBorder: this.getAttribute('explanation-border') || '#6f99D6',
      explanationColor: this.getAttribute('explanation-color') || '#d0d0d0',
      
      bottomNavBg: this.getAttribute('bottom-nav-bg') || 'rgba(36, 36, 38, 0.5)',
      bottomNavBtnBg: this.getAttribute('bottom-nav-btn-bg') === 'auto' || !this.getAttribute('bottom-nav-btn-bg') ? themeColor : this.getAttribute('bottom-nav-btn-bg'),
      bottomNavBtnColor: this.getAttribute('bottom-nav-btn-color') === 'auto' || !this.getAttribute('bottom-nav-btn-color') ? getContrastColor(themeColor) : this.getAttribute('bottom-nav-btn-color'),
      bottomNavBtnDisabledOpacity: this.getAttribute('bottom-nav-btn-disabled-opacity') || '0.3',
      
      blankBg: this.getAttribute('blank-bg') || '#3a3a3c',
      blankBorder: this.getAttribute('blank-border') || '#555',
      blankTextColor: this.getAttribute('blank-text-color') || '#E5E5E5',
      
      progressFontSize: this.getAttribute('progress-font-size') || '1rem',
      stemFontSize: this.getAttribute('stem-font-size') || '1.1rem',
      blankFontSize: this.getAttribute('blank-font-size') || '1rem',
      navLabelFontSize: this.getAttribute('nav-label-font-size') || '0.85rem',
      navBtnFontSize: this.getAttribute('nav-btn-font-size') || '0.85rem',
      bottomNavFontSize: this.getAttribute('bottom-nav-font-size') || '0.9rem',
      instructionFontSize: this.getAttribute('instruction-font-size') || '0.9rem',
      explanationFontSize: this.getAttribute('explanation-font-size') || '0.9rem',
      feedbackFontSize: this.getAttribute('feedback-font-size') || '0.95rem',
      completeScoreFontSize: this.getAttribute('complete-score-font-size') || '2.5rem',
      completeMessageFontSize: this.getAttribute('complete-message-font-size') || '1.2rem',
      
      containerPadding: this.getAttribute('container-padding') || '12px',
      borderRadius: this.getAttribute('border-radius') || '6px',
      blankGap: this.getAttribute('blank-gap') || '8px',
      
      blanksPerRow: parseInt(this.getAttribute('blanks-per-row')) || 6,
      blankWidth: this.getAttribute('blank-width') || '120px',
      blankHeight: this.getAttribute('blank-height') || '36px',
      showBlankNumbers: this.getAttribute('show-blank-numbers') !== 'false',
      
      progressLabel: this.getAttribute('progress-label') || '題目',
      checkButtonText: this.getAttribute('check-button-text') || '核對答案',
      bottomNavPrevText: this.getAttribute('bottom-nav-prev-text') || '◀ 上一題',
      bottomNavNextText: this.getAttribute('bottom-nav-next-text') || '下一題 ▶'
    };
  }

  parseHTMLQuestions() {
    const questionDivs = this.querySelectorAll('.question');
    
    if (questionDivs.length === 0) return;
    
    this.parsedQuestions = [];
    
    questionDivs.forEach(qDiv => {
      const stemEl = qDiv.querySelector('.stem');
      
      if (!stemEl) return;
      
      const children = Array.from(qDiv.children);
      const stemIndex = children.indexOf(stemEl);
      
      const instructions = [];
      const explanations = [];
      const slots = [];
      
      children.forEach((child, index) => {
        if (child.classList.contains('instruction')) {
          instructions.push({
            html: child.outerHTML,
            position: index < stemIndex ? 'before-stem' : 'after-stem'
          });
        }
        if (child.classList.contains('explanation')) {
          explanations.push({
            html: child.outerHTML,
            position: index < stemIndex ? 'before-stem' : 'after-stem'
          });
        }
        if (child.classList.contains('slot')) {
          slots.push({
            html: child.innerHTML,
            position: index < stemIndex ? 'before-stem' : 'after-stem'
          });
        }
      });
      
      const stemHTML = stemEl.innerHTML;
      const blanks = [];
      const regex = /\{\{([^}]+)\}\}/g;
      let match;
      
      while ((match = regex.exec(stemHTML)) !== null) {
        blanks.push({
          answer: match[1].trim(),
          placeholder: match[0]
        });
      }
      
      const question = {
        stemHTML: stemHTML,
        stemText: stemEl.textContent,
        blanks: blanks,
        instructions: instructions,
        explanations: explanations,
        slots: slots
      };
      
      this.parsedQuestions.push(question);
    });
  }

  getQuestions() {
    if (this.parsedQuestions && this.parsedQuestions.length > 0) {
      return this.parsedQuestions;
    }
    
    const questionsAttr = this.getAttribute('questions');
    if (questionsAttr) {
      try {
        return JSON.parse(questionsAttr);
      } catch (e) {
        console.error('Invalid questions JSON:', e);
      }
    }
    
    return [];
  }

  render() {
    const questions = this.getQuestions();
    const currentQ = questions[this.currentQuestion];
    const cfg = this.getStyleConfig();
    const showNavigator = this.getAttribute('show-navigator') !== 'false';
    const showBottomNav = this.getAttribute('show-bottom-nav') !== 'false';
    const completionMessage = this.getAttribute('completion-message') || '練習完成！';
    const showCompletion = this.getAttribute('show-completion') !== 'false';
    const showReset = this.getAttribute('show-reset') === 'true';

    const renderByPosition = (items, position) => {
      return items
        .filter(item => item.position === position)
        .map(item => item.html)
        .join('');
    };

    this.innerHTML = `
      <style>
        .fill-in-blanks.${this._instanceId} {
          font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: ${cfg.containerPadding};
          background: ${cfg.bgColor};
          border-radius: ${cfg.borderRadius};
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          color: ${cfg.textColor};
          user-select: none;
          touch-action: pan-y;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${cfg.themeColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-progress {
          font-size: ${cfg.progressFontSize};
          font-weight: 600;
          color: ${cfg.themeColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-navigator {
          background: ${cfg.bgSecondary};
          padding: 8px;
          border-radius: ${cfg.borderRadius};
          margin-bottom: 12px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
          transition: max-height 0.3s ease, opacity 0.3s ease;
          max-height: 200px;
          opacity: 1;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-navigator.hidden {
          max-height: 40px;
          opacity: 0.7;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-navigator.hidden .fib-nav-btn,
        .fill-in-blanks.${this._instanceId} .fib-navigator.hidden .fib-nav-label {
          display: none;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-nav-label {
          font-size: ${cfg.navLabelFontSize};
          color: ${cfg.textSecondary};
          margin-right: 4px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-nav-btn {
          min-width: 28px;
          height: 28px;
          padding: 3px 6px;
          background: ${cfg.bgColor};
          border: 1px solid #444;
          border-radius: 4px;
          color: ${cfg.textSecondary};
          cursor: pointer;
          font-size: ${cfg.navBtnFontSize};
          transition: all 0.2s;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-nav-btn:hover {
          background: #333;
          border-color: ${cfg.themeColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-nav-btn.current {
          background: ${cfg.themeColor};
          color: ${cfg.bgColor};
          border-color: ${cfg.themeColor};
          font-weight: 600;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-nav-btn.answered:not(.current) {
          background: #2d4a2d;
          border-color: #4a7c4a;
          color: ${cfg.correctColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-nav-toggle {
          margin-left: auto;
          padding: 3px 10px;
          background: #333;
          border: 1px solid #444;
          border-radius: 4px;
          color: ${cfg.textSecondary};
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-nav-toggle:hover {
          background: #444;
        }
        
        .fill-in-blanks.${this._instanceId} .instruction {
          background: ${cfg.bgSecondary};
          padding: 8px 12px;
          border-radius: ${cfg.borderRadius};
          margin-bottom: 10px;
          border-left: 3px solid ${cfg.themeColor};
          font-size: ${cfg.instructionFontSize};
          line-height: 1.5;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-stem {
          font-size: ${cfg.stemFontSize};
          font-weight: 600;
          margin-bottom: 16px;
          padding: 10px 12px;
          background: ${cfg.bgSecondary};
          border-radius: ${cfg.borderRadius};
          line-height: 1.8;
          color: ${cfg.textSecondary};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-stem-blank {
          display: inline-block;
          min-width: 30px;
          padding: 2px 8px;
          margin: 0 3px;
          border-bottom: 2px dashed ${cfg.themeColor};
          color: ${cfg.themeColor};
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 700;
          text-align: center;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-stem-blank:hover {
          background: ${cfg.bgTertiary};
          border-bottom-style: solid;
          transform: scale(1.05);
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blanks-container {
          background: ${cfg.bgSecondary};
          padding: 16px;
          border-radius: ${cfg.borderRadius};
          margin-bottom: 16px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blanks-grid {
          display: grid;
          grid-template-columns: repeat(${cfg.blanksPerRow}, 1fr);
          gap: ${cfg.blankGap};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blank-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blank-number {
          font-size: 0.75rem;
          color: ${cfg.textMuted};
          font-weight: 600;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blank-input {
          width: 100%;
          height: ${cfg.blankHeight};
          padding: 6px 8px;
          background: ${cfg.blankBg};
          border: 1px solid ${cfg.blankBorder};
          border-radius: 3px;
          font-size: ${cfg.blankFontSize};
          color: ${cfg.blankTextColor};
          text-align: center;
          font-family: inherit;
          transition: all 0.2s;
          outline: none;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blank-input:focus {
          border-color: ${cfg.themeColor};
          box-shadow: 0 0 0 2px ${cfg.themeColor}40;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blank-input.correct {
          background: ${cfg.correctBg};
          border-color: ${cfg.correctColor};
          color: ${cfg.correctColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blank-input.wrong {
          background: ${cfg.wrongBg};
          border-color: ${cfg.wrongColor};
          color: ${cfg.wrongColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-blank-input:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .fill-in-blanks.${this._instanceId} .explanation {
          background: ${cfg.bgTertiary};
          padding: 16px 20px;
          border-radius: ${cfg.borderRadius};
          margin-top: 12px;
          border: 1px dashed ${cfg.themeColor};
          font-size: ${cfg.explanationFontSize};
          line-height: 1.6;
          color: ${cfg.explanationColor};
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.4s ease, opacity 0.4s ease, margin-top 0.4s ease, padding 0.4s ease;
        }
        
        .fill-in-blanks.${this._instanceId} .explanation.show {
          max-height: 500px;
          opacity: 1;
          margin-top: 12px;
          padding: 16px 20px;
        }
        
        .fill-in-blanks.${this._instanceId} .slot {
          margin: 10px 0;
          padding: 10px;
          background: ${cfg.bgTertiary};
          border-radius: ${cfg.borderRadius};
          font-size: 0.9rem;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-feedback {
          padding: 0;
          border-radius: ${cfg.borderRadius};
          margin-bottom: 0;
          font-size: ${cfg.feedbackFontSize};
          text-align: center;
          font-weight: 500;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-feedback.show {
          padding: 10px;
          margin-bottom: 12px;
          max-height: 100px;
          opacity: 1;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-feedback.success {
          background: ${cfg.correctBg};
          color: ${cfg.correctColor};
          border: 2px solid ${cfg.correctColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-feedback.info {
          background: #2a2a3a;
          color: ${cfg.explanationBorder};
          border: 2px solid ${cfg.explanationBorder};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-button {
          padding: ${cfg.buttonPadding};
          border: none;
          border-radius: ${cfg.borderRadius};
          font-size: ${cfg.buttonFontSize};
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-button:focus {
          box-shadow: 0 0 0 3px ${cfg.focusStart}40,
                      0 0 0 6px ${cfg.focusEnd}20;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-button-primary {
          background: ${cfg.themeColor};
          color: ${cfg.bgColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-button-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${cfg.themeColor}40;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-button-secondary {
          background: #333;
          color: ${cfg.textColor};
        }
        
        .fill-in-blanks.${this._instanceId} .fib-button-secondary:hover:not(:disabled) {
          background: #444;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-complete {
          text-align: center;
          padding: 24px 12px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-complete-score {
          font-size: ${cfg.completeScoreFontSize};
          font-weight: 700;
          color: ${cfg.themeColor};
          margin-bottom: 12px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-complete-message {
          font-size: ${cfg.completeMessageFontSize};
          color: ${cfg.textSecondary};
          margin-bottom: 8px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-bottom-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding: 10px 12px;
          background: ${cfg.bottomNavBg};
          border-radius: ${cfg.borderRadius};
          gap: 12px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-bottom-nav-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          max-width: 300px;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-bottom-nav-center .fib-button {
          width: 100%;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-bottom-nav-btn {
          padding: 6px 14px;
          background: ${cfg.bottomNavBtnBg};
          color: ${cfg.bottomNavBtnColor};
          border: none;
          border-radius: ${cfg.borderRadius};
          font-size: ${cfg.bottomNavFontSize};
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-bottom-nav-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px ${cfg.themeColor}40;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-bottom-nav-btn:disabled {
          opacity: ${cfg.bottomNavBtnDisabledOpacity};
          cursor: not-allowed;
        }
        
        .fill-in-blanks.${this._instanceId} .fib-bottom-nav-progress {
          font-size: ${cfg.bottomNavFontSize};
          color: ${cfg.themeColor};
          font-weight: 600;
          white-space: nowrap;
        }
        
        @media (max-width: 600px) {
          .fill-in-blanks.${this._instanceId} {
            padding: 10px;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-stem {
            font-size: 1rem;
            padding: 8px 10px;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-blanks-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .fill-in-blanks.${this._instanceId} .fib-buttons {
            flex-direction: column;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-button {
            width: 100%;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-navigator {
            gap: 5px;
            padding: 6px;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-nav-btn {
            min-width: 26px;
            height: 26px;
            font-size: 0.8rem;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-bottom-nav {
            padding: 8px 10px;
            gap: 8px;
            flex-direction: column;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-bottom-nav-center {
            max-width: 100%;
            width: 100%;
          }
          
          .fill-in-blanks.${this._instanceId} .fib-bottom-nav-btn {
            padding: 5px 10px;
            font-size: 0.85rem;
            width: 100%;
          }
        }
      </style>
      
      <div class="fill-in-blanks ${this._instanceId}">
        ${showReset ? `
          <div style="text-align: right; margin-bottom: 12px;">
            <button class="fib-button fib-button-secondary" id="resetBtn" style="padding: 4px 12px; font-size: 0.85rem;">
              重置練習
            </button>
          </div>
        ` : ''}
        
        ${this.showHomepage && this.homepageHTML ? `
          <div class="fib-homepage">${this.homepageHTML}</div>
        ` : this.currentQuestion < questions.length ? `
          <div class="fib-header">
            <span class="fib-progress">${cfg.progressLabel} ${this.currentQuestion + 1}/${questions.length}</span>
          </div>
          
          ${showNavigator && questions.length > 1 ? `
            <div class="fib-navigator" id="navigator">
              <span class="fib-nav-label">快速跳轉：</span>
              ${questions.map((q, idx) => `
                <button class="fib-nav-btn ${idx === this.currentQuestion ? 'current' : ''} ${this.answeredQuestions.has(idx) ? 'answered' : ''}" 
                        data-question="${idx}">${idx + 1}</button>
              `).join('')}
              <button class="fib-nav-toggle" id="navToggle">隱藏</button>
            </div>
          ` : ''}
          
          ${currentQ.instructions && currentQ.instructions.length > 0 ? renderByPosition(currentQ.instructions, 'before-stem') : ''}
          ${currentQ.slots && currentQ.slots.length > 0 ? renderByPosition(currentQ.slots, 'before-stem') : ''}
          
          <div class="fib-stem">${this.renderStemWithBlanks(currentQ)}</div>
          
          ${currentQ.instructions && currentQ.instructions.length > 0 ? renderByPosition(currentQ.instructions, 'after-stem') : ''}
          ${currentQ.slots && currentQ.slots.length > 0 ? renderByPosition(currentQ.slots, 'after-stem') : ''}
          
          <div class="fib-blanks-container">
            <div class="fib-blanks-grid">
              ${currentQ.blanks.map((blank, idx) => `
                <div class="fib-blank-item">
                  ${cfg.showBlankNumbers ? `<div class="fib-blank-number">${idx + 1}</div>` : ''}
                  <input 
                    type="text" 
                    class="fib-blank-input" 
                    data-index="${idx}"
                    data-answer="${blank.answer}"
                    placeholder="${idx + 1}"
                  />
                </div>
              `).join('')}
            </div>
          </div>
          
          ${currentQ.explanations && currentQ.explanations.length > 0 ? renderByPosition(currentQ.explanations, 'after-stem') : ''}
          
          <div class="fib-feedback" id="feedback"></div>
          
          ${showBottomNav && questions.length > 1 ? `
            <div class="fib-bottom-nav">
              <button class="fib-bottom-nav-btn" id="prevBtn" ${this.currentQuestion === 0 ? 'disabled' : ''}>
                ${cfg.bottomNavPrevText}
              </button>
              <div class="fib-bottom-nav-center">
                <div style="display: flex; gap: 8px; width: 100%;">
                  <button class="fib-button fib-button-primary" id="checkBtn" style="flex: 1;">${cfg.checkButtonText}</button>
                  <button class="fib-button fib-button-secondary" id="showAnswerBtn" style="flex: 1;">顯示答案</button>
                </div>
                <div class="fib-bottom-nav-progress">${this.currentQuestion + 1} / ${questions.length}</div>
              </div>
              <button class="fib-bottom-nav-btn" id="nextBtnNav" ${this.currentQuestion >= questions.length - 1 || !this.answeredQuestions.has(this.currentQuestion) ? 'disabled' : ''}>
                ${cfg.bottomNavNextText}
              </button>
            </div>
          ` : `
            <div class="fib-buttons">
              <button class="fib-button fib-button-secondary" id="showAnswerBtn">顯示答案</button>
              <button class="fib-button fib-button-primary" id="checkBtn">${cfg.checkButtonText}</button>
              <button class="fib-button fib-button-secondary" id="nextBtn" disabled>下一題</button>
            </div>
          `}
        ` : showCompletion ? `
          <div class="fib-complete">
            <div class="fib-complete-score">${this.score} / ${questions.length * 10}</div>
            <div class="fib-complete-message">${completionMessage}</div>
            <div class="fib-buttons" style="justify-content: center; margin-top: 16px;">
              <button class="fib-button fib-button-primary" id="restartBtn">重新開始</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderStemWithBlanks(question) {
    let stemHTML = question.stemHTML;
    
    question.blanks.forEach((blank, idx) => {
      const blankElement = `<span class="fib-stem-blank" data-blank-index="${idx}">${idx + 1}</span>`;
      stemHTML = stemHTML.replace(blank.placeholder, blankElement);
    });
    
    return stemHTML;
  }

  attachEvents() {
    const questions = this.getQuestions();
    const showCompletion = this.getAttribute('show-completion') !== 'false';
    
    const resetBtn = this.querySelector('#resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.restart());
    }
    
    const startBtn = this.querySelector('#startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.showHomepage = false;
        this.render();
        this.attachEvents();
      });
      return;
    }
    
    if (this.currentQuestion >= questions.length) {
      if (showCompletion) {
        const restartBtn = this.querySelector('#restartBtn');
        if (restartBtn) {
          restartBtn.addEventListener('click', () => this.restart());
        }
      } else {
        this.currentQuestion = 0;
        this.render();
        this.attachEvents();
      }
      return;
    }
    
    const navBtns = this.querySelectorAll('.fib-nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetQuestion = parseInt(btn.dataset.question);
        this.jumpToQuestion(targetQuestion);
      });
    });
    
    const navToggle = this.querySelector('#navToggle');
    const navigator = this.querySelector('#navigator');
    if (navToggle && navigator) {
      navToggle.addEventListener('click', () => {
        navigator.classList.toggle('hidden');
        navToggle.textContent = navigator.classList.contains('hidden') ? '顯示' : '隱藏';
      });
    }
    
    const stemBlanks = this.querySelectorAll('.fib-stem-blank');
    const blankInputs = this.querySelectorAll('.fib-blank-input');
    
    stemBlanks.forEach(stemBlank => {
      stemBlank.addEventListener('click', () => {
        const blankIndex = parseInt(stemBlank.dataset.blankIndex);
        if (blankInputs[blankIndex]) {
          blankInputs[blankIndex].focus();
        }
      });
    });
    
    const checkBtn = this.querySelector('#checkBtn');
    const nextBtn = this.querySelector('#nextBtn');
    const feedback = this.querySelector('#feedback');
    
    let answered = false;
    
    checkBtn.addEventListener('click', () => {
      if (answered) return;
      
      answered = true;
      const currentQ = questions[this.currentQuestion];
      let correct = 0;
      let total = currentQ.blanks.length;
      
      blankInputs.forEach((input, idx) => {
        input.disabled = true;
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = input.dataset.answer.trim().toLowerCase();
        
        if (userAnswer === correctAnswer) {
          input.classList.add('correct');
          correct++;
        } else {
          input.classList.add('wrong');
        }
      });
      
      const points = Math.round((correct / total) * 10);
      this.score += points;
      
      this.answeredQuestions.add(this.currentQuestion);
      
      feedback.className = 'fib-feedback show ' + (correct === total ? 'success' : 'info');
      feedback.textContent = correct === total 
        ? `完全正確！獲得 ${points} 分`
        : `獲得 ${points} 分（${correct}/${total} 正確）`;
      
      const explanation = this.querySelector('.explanation');
      if (explanation) {
        explanation.classList.add('show');
      }
      
      checkBtn.disabled = true;
      if (nextBtn) {
        nextBtn.disabled = false;
      }
      
      const nextBtnNav = this.querySelector('#nextBtnNav');
      if (nextBtnNav && this.currentQuestion < questions.length - 1) {
        nextBtnNav.disabled = false;
      }
    });
    
    // 顯示答案按鈕事件
    const showAnswerBtn = this.querySelector('#showAnswerBtn');
    if (showAnswerBtn) {
      showAnswerBtn.addEventListener('click', () => {
        if (answered) return;
        
        answered = true;
        const currentQ = questions[this.currentQuestion];
        
        blankInputs.forEach((input, idx) => {
          input.disabled = true;
          const correctAnswer = input.dataset.answer;
          input.value = correctAnswer;
          input.classList.add('correct');
        });
        
        // 不計分
        this.answeredQuestions.add(this.currentQuestion);
        
        feedback.className = 'fib-feedback show info';
        feedback.textContent = '已顯示答案（不計分）';
        
        const explanation = this.querySelector('.explanation');
        if (explanation) {
          explanation.classList.add('show');
        }
        
        checkBtn.disabled = true;
        showAnswerBtn.disabled = true;
        if (nextBtn) {
          nextBtn.disabled = false;
        }
        
        const nextBtnNav = this.querySelector('#nextBtnNav');
        if (nextBtnNav && this.currentQuestion < questions.length - 1) {
          nextBtnNav.disabled = false;
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentQuestion++;
        this.render();
        this.attachEvents();
      });
    }
    
    const prevBtn = this.querySelector('#prevBtn');
    const nextBtnNav = this.querySelector('#nextBtnNav');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentQuestion > 0) {
          this.currentQuestion--;
          this.render();
          this.attachEvents();
        }
      });
    }
    
    if (nextBtnNav) {
      nextBtnNav.addEventListener('click', () => {
        if (this.currentQuestion < questions.length - 1) {
          this.currentQuestion++;
          this.render();
          this.attachEvents();
        }
      });
    }
    
    const container = this.querySelector('.fill-in-blanks');
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 80;
    
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const distance = touchStartX - touchEndX;
      
      if (Math.abs(distance) > minSwipeDistance) {
        if (distance > 0 && this.currentQuestion < questions.length - 1) {
          this.currentQuestion++;
          this.render();
          this.attachEvents();
        } else if (distance < 0 && this.currentQuestion > 0) {
          this.currentQuestion--;
          this.render();
          this.attachEvents();
        }
      }
    }, { passive: true });
    
    const keydownHandler = (e) => {
      if (e.key === 'ArrowLeft' && this.currentQuestion > 0) {
        e.preventDefault();
        this.currentQuestion--;
        this.render();
        this.attachEvents();
      } else if (e.key === 'ArrowRight' && this.currentQuestion < questions.length - 1) {
        e.preventDefault();
        this.currentQuestion++;
        this.render();
        this.attachEvents();
      }
    };
    
    document.addEventListener('keydown', keydownHandler);
    this._keydownHandler = keydownHandler;
  }

  jumpToQuestion(index) {
    const questions = this.getQuestions();
    if (index >= 0 && index < questions.length) {
      this.currentQuestion = index;
      this.render();
      this.attachEvents();
    }
  }

  restart() {
    this.currentQuestion = 0;
    this.score = 0;
    this.answeredQuestions.clear();
    if (this.homepageHTML) {
      this.showHomepage = true;
    }
    this.render();
    this.attachEvents();
  }
}

customElements.define('fill-in-blanks', FillInBlanks);

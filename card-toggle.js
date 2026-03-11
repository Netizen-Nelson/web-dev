class CardToggle extends HTMLElement {
    constructor() {
        super();
        this._originalContent = '';
        this._attempts = 0;
        this._inputId = '';
    }

    connectedCallback() {
        this._originalContent = this.innerHTML;
        
        if (!document.getElementById('card-toggle-styles')) {
            this._injectStyles();
        }
        
        this._initialize();
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.id = 'card-toggle-styles';
        style.textContent = `
            :root {
                --ct-bg-primary: #1C1C1E;
                --ct-bg-secondary: #242426;
                --ct-color-shell: #c6c7bd;
                --ct-color-lavender: #C3A5E5;
                --ct-color-special: #b9c971;
                --ct-color-warning: #E5A6A6;
                --ct-color-salmon: #E5C3B3;
                --ct-color-attention: #E5E5A6;
                --ct-color-sky: #04b5a3;
                --ct-color-safe: #84c498;
                --ct-color-brown: #d9c5b2;
                --ct-color-info: #6f99D6;
                --ct-color-pink: #FFB3D9;
                --ct-color-orange: #f69653;
                /* 預設動態顏色變數 */
                --ct-active-color: var(--ct-color-special);
            }

            card-toggle {
                display: block;
                position: relative;
                background-color: var(--ct-bg-secondary);
                border-radius: 8px;
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                overflow: hidden;
                border: 1px solid rgba(198, 199, 189, 0.2);
                color: var(--ct-color-shell);
                line-height: 1.8;
                font-size: 1rem;
            }

            card-toggle::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background-color: var(--ct-bg-primary);
                transition: all 0.3s ease;
            }

            card-toggle:hover::before {
                width: 8px;
            }

            card-toggle:hover {
                background-color: rgba(198, 199, 189, 0.03);
                transform: translateX(2px);
            }

            card-toggle[replaced] {
                cursor: default;
            }

            card-toggle[replaced]:hover {
                background-color: var(--ct-bg-secondary);
                transform: none;
            }

            card-toggle[replaced]::before {
                width: 4px;
            }

            card-toggle[dashed] {
                border-style: dashed;
                border-color: rgba(198, 199, 189, 0.5);
                border-width: 2px;
            }

            card-toggle[dashed][color="safe"] { border-color: rgba(132, 196, 152, 0.6); }
            card-toggle[dashed][color="warning"] { border-color: rgba(229, 166, 166, 0.6); }
            card-toggle[dashed][color="info"] { border-color: rgba(111, 153, 214, 0.6); }
            card-toggle[dashed][color="special"] { border-color: rgba(185, 201, 113, 0.6); }
            card-toggle[dashed][color="sky"] { border-color: rgba(4, 181, 163, 0.6); }
            card-toggle[dashed][color="lavender"] { border-color: rgba(195, 165, 229, 0.6); }
            card-toggle[dashed][color="attention"] { border-color: rgba(229, 229, 166, 0.6); }
            card-toggle[dashed][color="salmon"] { border-color: rgba(229, 195, 179, 0.6); }
            card-toggle[dashed][color="pink"] { border-color: rgba(255, 179, 217, 0.6); }
            card-toggle[dashed][color="orange"] { border-color: rgba(246, 150, 83, 0.6); }

            card-toggle[size="xsm"] {
                padding: 3px 6px;
                font-size: 0.9rem;
            }

            card-toggle[size="sm"] {
                padding: 6px 12px;
                font-size: 0.95rem;
            }

            card-toggle[size="lg"] {
                padding: 16px 20px;
                font-size: 1.1rem;
            }

            card-toggle[size="xlg"] {
                padding: 20px 24px;
                font-size: 1.2rem;
            }

            card-toggle[color="safe"]::before { background-color: var(--ct-color-safe); }
            card-toggle[color="safe"]:hover {
                background-color: rgba(132, 196, 152, 0.05);
                box-shadow: 0 0 0 1px rgba(132, 196, 152, 0.2);
            }

            card-toggle[color="warning"]::before { background-color: var(--ct-color-warning); }
            card-toggle[color="warning"]:hover {
                background-color: rgba(229, 166, 166, 0.05);
                box-shadow: 0 0 0 1px rgba(229, 166, 166, 0.2);
            }

            card-toggle[color="info"]::before { background-color: var(--ct-color-info); }
            card-toggle[color="info"]:hover {
                background-color: rgba(111, 153, 214, 0.05);
                box-shadow: 0 0 0 1px rgba(111, 153, 214, 0.2);
            }

            card-toggle[color="special"]::before { background-color: var(--ct-color-special); }
            card-toggle[color="special"]:hover {
                background-color: rgba(185, 201, 113, 0.05);
                box-shadow: 0 0 0 1px rgba(185, 201, 113, 0.2);
            }

            card-toggle[color="sky"]::before { background-color: var(--ct-color-sky); }
            card-toggle[color="sky"]:hover {
                background-color: rgba(4, 181, 163, 0.05);
                box-shadow: 0 0 0 1px rgba(4, 181, 163, 0.2);
            }

            card-toggle[color="lavender"]::before { background-color: var(--ct-color-lavender); }
            card-toggle[color="lavender"]:hover {
                background-color: rgba(195, 165, 229, 0.05);
                box-shadow: 0 0 0 1px rgba(195, 165, 229, 0.2);
            }

            card-toggle[color="attention"]::before { background-color: var(--ct-color-attention); }
            card-toggle[color="attention"]:hover {
                background-color: rgba(229, 229, 166, 0.05);
                box-shadow: 0 0 0 1px rgba(229, 229, 166, 0.2);
            }

            card-toggle[color="salmon"]::before { background-color: var(--ct-color-salmon); }
            card-toggle[color="salmon"]:hover {
                background-color: rgba(229, 195, 179, 0.05);
                box-shadow: 0 0 0 1px rgba(229, 195, 179, 0.2);
            }

            card-toggle[color="brown"]::before { background-color: var(--ct-color-brown); }
            card-toggle[color="brown"]:hover {
                background-color: rgba(217, 197, 178, 0.05);
                box-shadow: 0 0 0 1px rgba(217, 197, 178, 0.2);
            }

            card-toggle[color="shell"]::before { background-color: var(--ct-color-shell); }
            card-toggle[color="shell"]:hover {
                background-color: rgba(198, 199, 189, 0.05);
                box-shadow: 0 0 0 1px rgba(198, 199, 189, 0.2);
            }

            card-toggle[color="pink"]::before { background-color: var(--ct-color-pink); }
            card-toggle[color="pink"]:hover {
                background-color: rgba(255, 179, 217, 0.05);
                box-shadow: 0 0 0 1px rgba(255, 179, 217, 0.2);
            }

            card-toggle[color="orange"]::before { background-color: var(--ct-color-orange); }
            card-toggle[color="orange"]:hover {
                background-color: rgba(246, 150, 83, 0.05);
                box-shadow: 0 0 0 1px rgba(246, 150, 83, 0.2);
            }

            @keyframes ct-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes ct-slide-in {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes ct-shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }

            .ct-fade-in {
                animation: ct-fade-in 0.3s ease forwards;
            }

            .ct-slide-in {
                animation: ct-slide-in 0.3s ease forwards;
            }

            .ct-shake {
                animation: ct-shake 0.5s ease;
            }

            .ct-quiz-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid rgba(198, 199, 189, 0.2);
                border-radius: 6px;
                background-color: var(--ct-bg-primary);
                color: var(--ct-color-shell);
                font-size: 1rem;
                margin-top: 12px;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
            }

            .ct-quiz-input:focus {
                outline: none;
                border-color: var(--ct-color-special);
            }

            /* 按鈕基礎樣式 */
            .ct-quiz-button {
                padding: 10px 24px;
                border: none;
                border-radius: 6px;
                background-color: var(--ct-color-special);
                color: var(--ct-bg-primary);
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                margin-top: 12px;
                transition: all 0.3s ease;
            }

            .ct-quiz-button:hover {
                background-color: var(--ct-color-sky);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(4, 181, 163, 0.3);
            }

            .ct-quiz-button:active {
                transform: translateY(0);
            }

            .ct-reset-button {
                padding: 8px 16px;
                border: 1px solid var(--ct-color-lavender);
                border-radius: 6px;
                background-color: transparent;
                color: var(--ct-color-lavender);
                font-size: 0.9rem;
                cursor: pointer;
                margin-top: 12px;
                margin-left: 8px;
                transition: all 0.3s ease;
            }

            .ct-reset-button:hover {
                background-color: rgba(195, 165, 229, 0.1);
            }

            /* 尺寸相關的按鈕樣式 */
            card-toggle[size="xsm"] .ct-quiz-button {
                padding: 6px 12px;
                font-size: 0.85rem;
            }

            card-toggle[size="xsm"] .ct-reset-button {
                padding: 5px 10px;
                font-size: 0.8rem;
            }

            card-toggle[size="xsm"] .ct-quiz-input {
                padding: 8px 12px;
                font-size: 0.85rem;
            }

            card-toggle[size="sm"] .ct-quiz-button {
                padding: 8px 16px;
                font-size: 0.9rem;
            }

            card-toggle[size="sm"] .ct-reset-button {
                padding: 6px 12px;
                font-size: 0.85rem;
            }

            card-toggle[size="sm"] .ct-quiz-input {
                padding: 10px 14px;
                font-size: 0.9rem;
            }

            card-toggle[size="lg"] .ct-quiz-button {
                padding: 12px 28px;
                font-size: 1.05rem;
            }

            card-toggle[size="lg"] .ct-reset-button {
                padding: 9px 18px;
                font-size: 0.95rem;
            }

            card-toggle[size="lg"] .ct-quiz-input {
                padding: 14px 18px;
                font-size: 1.05rem;
            }

            card-toggle[size="xlg"] .ct-quiz-button {
                padding: 14px 32px;
                font-size: 1.1rem;
            }

            card-toggle[size="xlg"] .ct-reset-button {
                padding: 10px 20px;
                font-size: 1rem;
            }

            card-toggle[size="xlg"] .ct-quiz-input {
                padding: 16px 20px;
                font-size: 1.1rem;
            }

            .ct-error {
                color: var(--ct-color-warning);
                margin-top: 8px;
                font-size: 0.9rem;
            }

            .ct-success {
                color: var(--ct-color-safe);
                font-size: 1.1rem;
            }

            /* 群組容器樣式 */
            card-toggle-group {
                display: block;
                position: relative;
            }

            card-toggle-group[mode="slide"] {
                overflow: hidden;
            }

            card-toggle-group[mode="slide"] .ct-group-cards {
                display: flex;
                transition: transform 0.4s ease;
            }

            card-toggle-group[mode="slide"] card-toggle {
                flex-shrink: 0;
                width: 100%;
            }

            card-toggle-group[mode="stack"] card-toggle {
                display: block;
                margin-bottom: 16px;
            }

            /* 導航按鈕樣式 */
            .ct-nav-buttons {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-top: 16px;
            }

            .ct-nav-btn {
                padding: 8px 20px;
                border: 1px solid var(--ct-color-shell);
                border-radius: 6px;
                background-color: transparent;
                color: var(--ct-color-shell);
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.95rem;
            }

            .ct-nav-btn:hover:not(:disabled) {
                background-color: rgba(198, 199, 189, 0.1);
                border-color: var(--ct-active-color);
                color: var(--ct-active-color);
            }

            .ct-nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }

            /* 頁碼按鈕樣式 */
            .ct-page-buttons {
                display: flex;
                justify-content: center;
                gap: 6px;
                margin-top: 12px;
                flex-wrap: wrap;
            }

            .ct-page-btn {
                width: 32px;
                height: 32px;
                border: 1px solid rgba(198, 199, 189, 0.3);
                border-radius: 4px;
                background-color: transparent;
                color: var(--ct-color-shell);
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.85rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ct-page-btn:hover {
                background-color: rgba(198, 199, 189, 0.1);
                border-color: var(--ct-active-color);
            }

            .ct-page-btn.active {
                background-color: var(--ct-active-color);
                color: var(--ct-bg-primary);
                border-color: var(--ct-active-color);
                font-weight: 600;
            }

            /* 提示區域樣式 */
            .ct-hint-display {
                padding: 12px 16px;
                background-color: rgba(195, 165, 229, 0.1);
                border-left: 3px solid var(--ct-color-lavender);
                border-radius: 4px;
                margin-top: 12px;
                color: var(--ct-color-lavender);
                animation: ct-fade-in 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    _initialize() {
        if (!this.hasAttribute('replaced')) {
            this.addEventListener('click', (event) => this._handleClick(event));
        }

        if (this.hasAttribute('number')) {
            this._addNumber();
        }
    }

    _addNumber() {
        const number = this.getAttribute('number');
        const numberSize = this.getAttribute('number-size') || '0.8rem';
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'ct-number';
        numberSpan.textContent = number + '. ';
        numberSpan.style.opacity = '0.6';
        numberSpan.style.fontSize = numberSize;
        numberSpan.style.fontWeight = '600';
        numberSpan.style.marginRight = '4px';
        
        this.insertBefore(numberSpan, this.firstChild);
    }

    _handleClick(event) {
        if (this.hasAttribute('replaced')) {
            return;
        }

        const target = event.target;
        const interactiveElements = ['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'A'];
        if (interactiveElements.includes(target.tagName)) {
            return;
        }

        if (target.closest('input, button, textarea, select, a')) {
            return;
        }

        const sourceId = this.getAttribute('source');
        const content = this.getAttribute('content');
        const question = this.getAttribute('question');
        const animation = this.getAttribute('animation') || 'fade';

        let finalContent = '';

        if (question) {
            finalContent = this._generateQuizContent();
        } else if (sourceId) {
            const sourceElement = document.getElementById(sourceId);
            if (sourceElement) {
                const clonedElement = sourceElement.cloneNode(true);
                clonedElement.style.display = 'block';
                clonedElement.removeAttribute('id');
                finalContent = clonedElement.outerHTML;
            } else {
                finalContent = '<p style="color: var(--ct-color-warning);"><i class="bi bi-exclamation-triangle"></i> 找不到內容來源</p>';
            }
        } else if (content) {
            finalContent = content;
        } else {
            finalContent = '<p style="color: var(--ct-color-warning);"><i class="bi bi-exclamation-triangle"></i> 未設定內容</p>';
        }

        this._replace(finalContent, animation);
    }

    _generateQuizContent() {
        const question = this.getAttribute('question');
        const placeholder = this.getAttribute('placeholder') || '請輸入答案';
        const hint = this.getAttribute('hint');
        const hintTarget = this.getAttribute('hint-target');
        
        const hideSubmit = this.hasAttribute('hide-submit');
        const hideHint = this.hasAttribute('hide-hint');
        const hideReset = this.hasAttribute('hide-reset');
        
        const submitText = this.getAttribute('submit-text') || '提交答案';
        const hintText = this.getAttribute('hint-text') || '提示';
        const resetText = this.getAttribute('reset-text') || '重置';
        
        this._inputId = 'ct-input-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        let html = `<div class="ct-quiz-content">`;
        html += `<p>${question}</p>`;
        html += `<input type="text" id="${this._inputId}" class="ct-quiz-input" placeholder="${placeholder}">`;
        
        if (!hideSubmit) {
            html += `<button class="ct-quiz-button" onclick="this.closest('card-toggle')._verifyAnswer()">
                <i class="bi bi-check-circle"></i> ${submitText}
            </button>`;
        }
        
        if (hint && !hideHint) {
            if (hintTarget) {
                html += `<button class="ct-reset-button" onclick="this.closest('card-toggle')._showHint()">
                    <i class="bi bi-lightbulb"></i> ${hintText}
                </button>`;
            } else {
                html += `<button class="ct-reset-button" onclick="alert('提示：${hint}')">
                    <i class="bi bi-lightbulb"></i> ${hintText}
                </button>`;
            }
        }
        
        if (!hideReset) {
            html += `<button class="ct-reset-button" onclick="this.closest('card-toggle').reset()">
                <i class="bi bi-arrow-counterclockwise"></i> ${resetText}
            </button>`;
        }
        
        html += `</div>`;
        
        return html;
    }

    _showHint() {
        const hint = this.getAttribute('hint');
        const hintTarget = this.getAttribute('hint-target');
        
        if (!hintTarget) return;
        
        const targetElement = document.getElementById(hintTarget);
        if (!targetElement) {
            console.error(`找不到提示目標元素 #${hintTarget}`);
            return;
        }

        targetElement.innerHTML = '';
        
        const hintDiv = document.createElement('div');
        hintDiv.className = 'ct-hint-display';
        hintDiv.innerHTML = `<strong><i class="bi bi-lightbulb-fill"></i> 提示：</strong>${hint}`;
        
        targetElement.appendChild(hintDiv);
        
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    _replace(content, animation) {
        const colorAfter = this.getAttribute('color-after');
        
        if (animation === 'fade') {
            this.style.opacity = '0';
            setTimeout(() => {
                this.innerHTML = content;
                this.setAttribute('replaced', '');
                if (colorAfter) {
                    this.setAttribute('color', colorAfter);
                }
                this.style.opacity = '1';
            }, 300);
        } else if (animation === 'slide') {
            this.style.transform = 'translateX(-20px)';
            this.style.opacity = '0';
            setTimeout(() => {
                this.innerHTML = content;
                this.setAttribute('replaced', '');
                if (colorAfter) {
                    this.setAttribute('color', colorAfter);
                }
                this.style.transform = 'translateX(0)';
                this.style.opacity = '1';
            }, 300);
        } else {
            this.innerHTML = content;
            this.setAttribute('replaced', '');
            if (colorAfter) {
                this.setAttribute('color', colorAfter);
            }
        }
    }

    _verifyAnswer() {
        const correctAnswer = this.getAttribute('answer');
        const caseSensitive = this.hasAttribute('case-sensitive');
        const maxAttempts = parseInt(this.getAttribute('max-attempts')) || 999;
        const successMessage = this.getAttribute('success-message') || '答對了！';
        const errorMessage = this.getAttribute('error-message') || '答錯了，請再試一次';
        const successSource = this.getAttribute('success-source');
        const successColor = this.getAttribute('success-color') || 'safe';
        const autoNext = this.hasAttribute('auto-next');

        if (!correctAnswer) {
            console.error('需要設定 answer 屬性');
            return;
        }

        const inputElement = document.getElementById(this._inputId);
        if (!inputElement) {
            console.error('找不到輸入框');
            return;
        }

        let userAnswer = inputElement.value.trim();
        let isCorrect = false;

        if (caseSensitive) {
            isCorrect = userAnswer === correctAnswer;
        } else {
            isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        }

        this._attempts++;

        if (isCorrect) {
            this._handleCorrectAnswer(successSource, successMessage, successColor, autoNext);
        } else {
            if (this._attempts >= maxAttempts) {
                this._handleMaxAttempts(errorMessage);
            } else {
                this._handleWrongAnswer(errorMessage);
            }
        }
    }

    _handleCorrectAnswer(successSource, successMessage, successColor, autoNext) {
        let finalContent = '';

        if (successSource) {
            const sourceElement = document.getElementById(successSource);
            if (sourceElement) {
                const clonedElement = sourceElement.cloneNode(true);
                clonedElement.style.display = 'block';
                clonedElement.removeAttribute('id');
                finalContent = clonedElement.outerHTML;
            } else {
                finalContent = `<p class="ct-success"><i class="bi bi-check-circle-fill"></i> ${successMessage}</p>`;
            }
        } else {
            finalContent = `<p class="ct-success"><i class="bi bi-check-circle-fill"></i> ${successMessage}</p>`;
        }

        this.innerHTML = finalContent;
        this.setAttribute('replaced', '');
        this.setAttribute('color', successColor);
        this.classList.add('ct-fade-in');

        if (autoNext) {
            setTimeout(() => {
                const group = this.closest('card-toggle-group');
                if (group && group._goNext) {
                    group._goNext();
                }
            }, 1500);
        }
    }

    _handleWrongAnswer(errorMessage) {
        const existingError = this.querySelector('.ct-error');
        
        if (existingError) {
            existingError.innerHTML = `<i class="bi bi-x-circle"></i> ${errorMessage} (${this._attempts} 次嘗試)`;
        } else {
            const errorElement = document.createElement('p');
            errorElement.className = 'ct-error';
            errorElement.innerHTML = `<i class="bi bi-x-circle"></i> ${errorMessage} (${this._attempts} 次嘗試)`;
            this.querySelector('.ct-quiz-content').appendChild(errorElement);
        }

        this.classList.add('ct-shake');
        setTimeout(() => {
            this.classList.remove('ct-shake');
        }, 500);

        const inputElement = document.getElementById(this._inputId);
        if (inputElement) {
            inputElement.value = '';
            inputElement.focus();
        }
    }

    _handleMaxAttempts(errorMessage) {
        const finalContent = `
            <p style="color: var(--ct-color-warning); font-size: 1rem;">
                <i class="bi bi-x-circle-fill"></i> 已達嘗試上限
            </p>
            <p style="margin-top: 8px;">${errorMessage}</p>
        `;
        
        this.innerHTML = finalContent;
        this.setAttribute('replaced', '');
        this.setAttribute('color', 'warning');
    }

    reset() {
        const hintTarget = this.getAttribute('hint-target');
        if (hintTarget) {
            const targetElement = document.getElementById(hintTarget);
            if (targetElement) {
                targetElement.innerHTML = '';
            }
        }
        
        this.innerHTML = this._originalContent;
        this.removeAttribute('replaced');
        this._attempts = 0;
        this._initialize();
    }
}

// 群組元件
class CardToggleGroup extends HTMLElement {
    constructor() {
        super();
        this._currentIndex = 0;
        this._cards = [];
    }

    connectedCallback() {
        this._initialize();
    }

    _initialize() {
        const mode = this.getAttribute('mode') || 'stack';
        const theme = this.getAttribute('theme');
        
        // 處理 Theme 變數
        if (theme) {
            this.style.setProperty('--ct-active-color', `var(--ct-color-${theme})`);
        } else {
            // 回退到預設的 special 色彩
            this.style.setProperty('--ct-active-color', `var(--ct-color-special)`);
        }

        this._cards = Array.from(this.querySelectorAll('card-toggle'));
        
        if (mode === 'slide') {
            this._setupSlideMode();
        }
    }

    _setupSlideMode() {
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'ct-group-cards';
        
        this._cards.forEach(card => {
            cardsContainer.appendChild(card);
        });
        
        this.innerHTML = '';
        this.appendChild(cardsContainer);
        
        this._createNavigation();
        
        this._updateSlide();
    }

    _createNavigation() {
        const showPageButtons = this.hasAttribute('show-pages');
        const hideNavButtons = this.hasAttribute('hide-nav-buttons');
        
        if (!hideNavButtons) {
            const navDiv = document.createElement('div');
            navDiv.className = 'ct-nav-buttons';
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'ct-nav-btn';
            prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i> 上一張';
            prevBtn.onclick = () => this._goPrev();
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'ct-nav-btn';
            nextBtn.innerHTML = '下一張 <i class="bi bi-chevron-right"></i>';
            nextBtn.onclick = () => this._goNext();
            
            navDiv.appendChild(prevBtn);
            navDiv.appendChild(nextBtn);
            this.appendChild(navDiv);
            
            this._prevBtn = prevBtn;
            this._nextBtn = nextBtn;
        }
        
        if (showPageButtons) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'ct-page-buttons';
            
            this._cards.forEach((card, index) => {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'ct-page-btn';
                pageBtn.textContent = index + 1;
                pageBtn.onclick = () => this._goToPage(index);
                pageDiv.appendChild(pageBtn);
            });
            
            this.appendChild(pageDiv);
            this._pageButtons = Array.from(pageDiv.querySelectorAll('.ct-page-btn'));
        }
    }

    _updateSlide() {
        const cardsContainer = this.querySelector('.ct-group-cards');
        if (!cardsContainer) return;
        
        const offset = -this._currentIndex * 100;
        cardsContainer.style.transform = `translateX(${offset}%)`;
        
        if (this._prevBtn) {
            this._prevBtn.disabled = this._currentIndex === 0;
        }
        if (this._nextBtn) {
            this._nextBtn.disabled = this._currentIndex === this._cards.length - 1;
        }
        
        if (this._pageButtons) {
            this._pageButtons.forEach((btn, index) => {
                if (index === this._currentIndex) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    }

    _goPrev() {
        if (this._currentIndex > 0) {
            this._currentIndex--;
            this._updateSlide();
        }
    }

    _goNext() {
        if (this._currentIndex < this._cards.length - 1) {
            this._currentIndex++;
            this._updateSlide();
        }
    }

    _goToPage(index) {
        if (index >= 0 && index < this._cards.length) {
            this._currentIndex = index;
            this._updateSlide();
        }
    }
}

customElements.define('card-toggle', CardToggle);
customElements.define('card-toggle-group', CardToggleGroup);
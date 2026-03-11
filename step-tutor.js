class StepTutor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`找不到容器: ${containerId}`);
            return;
        }
        
        // 預設設定
        this.options = {
            stepBgColor: StepTutor.resolveColor(options.stepBgColor) || 'rgba(138, 161, 242, 0.1)',
            stepBorderColor: StepTutor.resolveColor(options.stepBorderColor) || '#8aa1f2',
            stepTextColor: StepTutor.resolveColor(options.stepTextColor) || '#F0F0F0',
            indicatorBgColor: StepTutor.resolveColor(options.indicatorBgColor) || null,
            indicatorTextColor: StepTutor.resolveColor(options.indicatorTextColor) || '#1C1C1E',
            highlightColor: StepTutor.resolveColor(options.highlightColor) || '#C3A5E5',
            
            stepPadding: options.stepPadding || '12px',
            stepMargin: options.stepMargin || '8px 0px',
            indicatorPadding: options.indicatorPadding || null,
            
            borderWidth: options.borderWidth || '2px',
            borderStyle: options.borderStyle || 'solid',
            borderPosition: options.borderPosition || 'left',
            borderSize: options.borderSize || '2px',
            
            showIndicator: options.showIndicator !== false,
            
            animationDuration: options.animationDuration || '0.3s',
            
            buttonText: options.buttonText || '顯示下一步',
            buttonCompleteText: options.buttonCompleteText || '所有步驟已顯示',
            buttonTheme: options.buttonTheme || 'special',
            buttonSize: options.buttonSize || 'large',
            
            // 重新開始按鈕
            restart: options.restart !== false,
            
            // 內容位置
            contentPosition: options.contentPosition || 'top',
            
            // 步驟指示器格式
            indicatorFormat: options.indicatorFormat || '步驟 {current}',
            showTotalSteps: options.showTotalSteps || true,
            
            // 進度顯示設定
            showProgress: options.showProgress !== false,
            progressText: options.progressText || '已顯示步驟 {current} / {total}',
            progressFontSize: options.progressFontSize || '0.875rem',
            progressPosition: options.progressPosition || 'bottom',
            
            // 進度條設定
            showProgressBar: options.showProgressBar || false,
            progressBarHeight: options.progressBarHeight || '20px',
            progressBarBgColor: StepTutor.resolveColor(options.progressBarBgColor) || '#242426',
            progressBarGradient: StepTutor.resolveGradient(options.progressBarGradient) || 'linear-gradient(90deg, #b9c971 0%, #8BC2CF 100%)',
            progressBarBorderWidth: options.progressBarBorderWidth || '2px',
            progressBarBorderColor: StepTutor.resolveColor(options.progressBarBorderColor) || '#c6c7bd',
            progressBarBorderRadius: options.progressBarBorderRadius || '4px',
            progressBarPadding: options.progressBarPadding || '6px 8px',
            
            // 進度條文字樣式
            progressBarTextFontSize: options.progressBarTextFontSize || '0.75rem',
            progressBarTextFontWeight: options.progressBarTextFontWeight || 'bold',
            progressBarTextColor: StepTutor.resolveColor(options.progressBarTextColor) || null,
            
            // 指示器樣式
            indicatorFontSize: options.indicatorFontSize || '0.8rem',
            indicatorBorderRadius: options.indicatorBorderRadius || '4px',
            indicatorMarginBottom: options.indicatorMarginBottom || '8px',
            
            // 重新開始按鈕樣式
            restartButtonPadding: options.restartButtonPadding || '6px 10px',
            restartButtonFontSize: options.restartButtonFontSize || '1.125rem',
            restartButtonFontWeight: options.restartButtonFontWeight || 'bold',
            
            // 自動滾動
            autoScroll: options.autoScroll !== true,
            scrollOffset: options.scrollOffset || 100,
            
            // Target 功能設定
            targetMode: options.targetMode || 'replace', // replace（替換）, append（追加）, prepend（前置）
            targetClearOnReset: options.targetClearOnReset !== false, // 重置時是否清空 target
            
            // 回調函數
            onStepRevealed: options.onStepRevealed || null,
            onAllRevealed: options.onAllRevealed || null,
            onReset: options.onReset || null
        };
        
        if (!this.options.indicatorBgColor) {
            this.options.indicatorBgColor = this.getThemeColor(this.options.buttonTheme);
        }
        
        this.currentStep = 0;
        this.totalSteps = 0;
        this.steps = [];
        this.button = null;
        this.progressDisplay = null;
        this.progressBar = null;
        this.progressBarFill = null;
        this.targetElements = new Map(); // 儲存 target 元素參考
        this.topSlot = null; // 進度列上方slot
        this.bottomSlot = null; // 進度列下方slot
        
        this.init();
    }
    
    init() {
        this.loadSlots();
        this.loadSteps();
        this.createStyles();
        this.createControls();
    }
    
    loadSlots() {
        // 載入進度列上方slot
        const topSlotElement = this.container.querySelector('[data-slot="progress-top"]');
        if (topSlotElement) {
            this.topSlot = topSlotElement.cloneNode(true);
            this.topSlot.removeAttribute('data-slot');
            topSlotElement.style.display = 'none';
        }
        
        // 載入進度列下方slot
        const bottomSlotElement = this.container.querySelector('[data-slot="progress-bottom"]');
        if (bottomSlotElement) {
            this.bottomSlot = bottomSlotElement.cloneNode(true);
            this.bottomSlot.removeAttribute('data-slot');
            bottomSlotElement.style.display = 'none';
        }
    }
    
    loadSteps() {
        const stepElements = this.container.querySelectorAll('[data-step]');
        this.totalSteps = stepElements.length;
        
        stepElements.forEach((element, index) => {
            const targetId = element.getAttribute('data-step-target') || null;
            const stepData = {
                index: index,
                number: parseInt(element.getAttribute('data-step')) || index + 1,
                content: element.innerHTML,
                indicator: element.getAttribute('data-step-indicator') || null,
                highlight: element.getAttribute('data-step-highlight') || null,
                target: targetId, // 新增：目標 div id
                targetElement: targetId ? document.getElementById(targetId) : null // 新增：目標元素參考
            };
            this.steps.push(stepData);
            element.style.display = 'none';
            
            if (stepData.targetElement) {
                this.targetElements.set(index, stepData.targetElement);
            }
        });
    }
    
    createControls() {
        // 建立控制容器
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'step-tutor-controls';
        
        // 創建步驟容器
        this.createStepContainer();
        
        // 創建按鈕
        this.createButton();
        
        // 根據 contentPosition 決定內容和控制區域的順序
        if (this.options.contentPosition === 'bottom') {
            if (this.options.progressPosition === 'top') {
                // 插入上方slot
                if (this.topSlot) {
                    controlsContainer.appendChild(this.topSlot.cloneNode(true));
                }
                
                if (this.options.showProgressBar) {
                    this.createProgressBar();
                    controlsContainer.appendChild(this.progressBar);
                }
                if (this.options.showProgress) {
                    this.createProgressDisplay();
                    controlsContainer.appendChild(this.progressDisplay);
                }
                
                // 插入下方slot
                if (this.bottomSlot) {
                    controlsContainer.appendChild(this.bottomSlot.cloneNode(true));
                }
                
                controlsContainer.appendChild(this.buttonWrapper);
            } else {
                controlsContainer.appendChild(this.buttonWrapper);
                
                // 插入上方slot
                if (this.topSlot) {
                    controlsContainer.appendChild(this.topSlot.cloneNode(true));
                }
                
                if (this.options.showProgress) {
                    this.createProgressDisplay();
                    controlsContainer.appendChild(this.progressDisplay);
                }
                if (this.options.showProgressBar) {
                    this.createProgressBar();
                    controlsContainer.appendChild(this.progressBar);
                }
                
                // 插入下方slot
                if (this.bottomSlot) {
                    controlsContainer.appendChild(this.bottomSlot.cloneNode(true));
                }
            }
            
            this.container.appendChild(controlsContainer);
            this.container.appendChild(this.stepContainer);
            
        } else {
            this.container.appendChild(this.stepContainer);
            
            if (this.options.progressPosition === 'top') {
                // 插入上方slot
                if (this.topSlot) {
                    controlsContainer.appendChild(this.topSlot.cloneNode(true));
                }
                
                if (this.options.showProgressBar) {
                    this.createProgressBar();
                    controlsContainer.appendChild(this.progressBar);
                }
                if (this.options.showProgress) {
                    this.createProgressDisplay();
                    controlsContainer.appendChild(this.progressDisplay);
                }
                
                // 插入下方slot
                if (this.bottomSlot) {
                    controlsContainer.appendChild(this.bottomSlot.cloneNode(true));
                }
                
                controlsContainer.appendChild(this.buttonWrapper);
            } else {
                controlsContainer.appendChild(this.buttonWrapper);
                
                // 插入上方slot
                if (this.topSlot) {
                    controlsContainer.appendChild(this.topSlot.cloneNode(true));
                }
                
                if (this.options.showProgress) {
                    this.createProgressDisplay();
                    controlsContainer.appendChild(this.progressDisplay);
                }
                if (this.options.showProgressBar) {
                    this.createProgressBar();
                    controlsContainer.appendChild(this.progressBar);
                }
                
                // 插入下方slot
                if (this.bottomSlot) {
                    controlsContainer.appendChild(this.bottomSlot.cloneNode(true));
                }
            }
            
            this.container.appendChild(controlsContainer);
        }
        
        if (this.options.showProgress) {
            this.updateProgressDisplay();
        }
        if (this.options.showProgressBar) {
            this.updateProgressBar();
        }
    }
    
    createStepContainer() {
        this.stepContainer = document.createElement('div');
        this.stepContainer.className = 'step-tutor-container';
        
        this.steps.forEach((step, index) => {
            // 只為沒有 target 的步驟創建元素
            if (!step.target) {
                const stepElement = document.createElement('div');
                stepElement.className = 'step-tutor-item';
                stepElement.setAttribute('data-step-index', index);
                
                if (this.options.showIndicator) {
                    const indicator = document.createElement('div');
                    indicator.className = 'step-tutor-indicator';
                    
                    let indicatorText = this.options.indicatorFormat.replace('{current}', step.number);
                    if (step.indicator) {
                        indicatorText = step.indicator;
                    }
                    if (this.options.showTotalSteps) {
                        indicatorText += ` / ${this.totalSteps}`;
                    }
                    
                    indicator.textContent = indicatorText;
                    stepElement.appendChild(indicator);
                }
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'step-tutor-content';
                contentDiv.innerHTML = step.content;
                
                if (step.highlight) {
                    contentDiv.classList.add('highlighted');
                    if (step.highlight !== 'true') {
                        contentDiv.style.setProperty('--highlight-color', step.highlight);
                    }
                }
                
                stepElement.appendChild(contentDiv);
                this.stepContainer.appendChild(stepElement);
            }
        });
    }
    
    createStyles() {
        const styleId = 'step-tutor-styles-' + this.container.id;
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        
        const borderStyles = this.getBorderStyles();
        const buttonStyles = this.getButtonStyles();
        
        style.textContent = `
            #${this.container.id} .step-tutor-container {
                display: flex;
                flex-direction: column;
                gap: 0px;
            }
            
            #${this.container.id} .step-tutor-item {
                background: ${this.options.stepBgColor};
                ${borderStyles}
                padding: ${this.options.stepPadding};
                margin: ${this.options.stepMargin};
                opacity: 0;
                max-height: 0;
                overflow: hidden;
                transition: opacity ${this.options.animationDuration}, 
                            max-height ${this.options.animationDuration};
            }
            
            #${this.container.id} .step-tutor-item.revealed {
                opacity: 1;
                max-height: 1600px;
            }
            
            #${this.container.id} .step-tutor-indicator {
                background: ${this.options.indicatorBgColor};
                color: ${this.options.indicatorTextColor};
                ${this.options.indicatorPadding ? `padding: ${this.options.indicatorPadding};` : ''}
                display: inline-block;
                margin-bottom: ${this.options.indicatorMarginBottom};
                font-size: ${this.options.indicatorFontSize}; 
                border-radius: ${this.options.indicatorBorderRadius};
            }
            
            #${this.container.id} .step-tutor-content {
                color: ${this.options.stepTextColor};
                line-height: 1.5;
            }
            
            #${this.container.id} .step-tutor-content.highlighted {
                background: ${this.options.highlightColor}20;
                border-left: 4px solid var(--highlight-color, ${this.options.highlightColor});
                padding: 6px 10px;
                margin: 4px 0px;
            }
            
            #${this.container.id} .step-tutor-controls {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-top: ${this.options.contentPosition === 'bottom' ? '0px' : '12px'};
                margin-bottom: ${this.options.contentPosition === 'bottom' ? '12px' : '0px'};
            }
            
            #${this.container.id} .step-tutor-button {
                ${buttonStyles}
            }
            
            #${this.container.id} .step-tutor-button:hover:not(:disabled) {
                opacity: 0.8;
            }
            
            #${this.container.id} .step-tutor-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            #${this.container.id} .step-tutor-restart-button {
                background: ${this.getThemeColor(this.options.buttonTheme)};
                color: #1C1C1E;
                border: none;
                padding: ${this.options.restartButtonPadding};
                font-size: ${this.options.restartButtonFontSize};
                font-weight: ${this.options.restartButtonFontWeight};
                cursor: pointer;
                transition: opacity 0.2s, transform 0.2s;
                line-height: 1;
            }
            
            #${this.container.id} .step-tutor-restart-button:hover {
                opacity: 0.8;
                transform: scale(1.05);
            }
            
            #${this.container.id} .step-tutor-restart-button:active {
                transform: scale(0.95);
            }
            
            #${this.container.id} .step-tutor-progress {
                color: ${this.options.stepTextColor};
                font-size: ${this.options.progressFontSize};
                text-align: center;
            }
            
            #${this.container.id} .step-tutor-progress-bar {
                background: ${this.options.progressBarBgColor};
                border: ${this.options.progressBarBorderWidth} solid ${this.options.progressBarBorderColor};
                ${this.options.progressBarHeight === 'auto' ? 'min-height: 24px;' : `height: ${this.options.progressBarHeight};`}
                padding: ${this.options.progressBarHeight === 'auto' ? this.options.progressBarPadding : '0'};
                border-radius: ${this.options.progressBarBorderRadius};
                overflow: hidden;
                position: relative;
                display: flex;
                align-items: center;
            }
            
            #${this.container.id} .step-tutor-progress-bar-fill {
                background: ${this.options.progressBarGradient};
                ${this.options.progressBarHeight === 'auto' ? 'position: absolute; top: 0; left: 0; bottom: 0;' : 'height: 100%;'}
                width: 0%;
                transition: width 0.3s ease;
            }
            
            #${this.container.id} .step-tutor-progress-bar-text {
                ${this.options.progressBarHeight === 'auto' ? 'position: relative;' : 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);'}
                color: ${this.options.progressBarTextColor || this.options.stepTextColor};
                font-size: ${this.options.progressBarTextFontSize};
                font-weight: ${this.options.progressBarTextFontWeight};
                pointer-events: none;
                z-index: 1;
                ${this.options.progressBarHeight === 'auto' ? 'width: 100%; text-align: center;' : ''}
            }
            
            /* Target 元素樣式 */
            .step-tutor-target-content {
                animation: stepTutorFadeIn ${this.options.animationDuration} ease;
            }
            
            @keyframes stepTutorFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    getBorderStyles() {
        const position = this.options.borderPosition;
        const width = this.options.borderSize;
        const style = this.options.borderStyle;
        const color = this.options.stepBorderColor;
        
        if (position === 'all') {
            return `border: ${width} ${style} ${color};`;
        }
        
        return `border-${position}: ${width} ${style} ${color};`;
    }
    
    getButtonStyles() {
        const themeColor = this.getThemeColor(this.options.buttonTheme);
        const sizes = {
            small: { padding: '6px 12px', fontSize: '0.875rem' },
            medium: { padding: '8px 16px', fontSize: '1rem' },
            large: { padding: '12px 24px', fontSize: '1.125rem' }
        };
        
        const size = sizes[this.options.buttonSize] || sizes.small;
        
        return `
            background: ${themeColor};
            color: #1C1C1E;
            border: none;
            padding: ${size.padding};
            font-size: ${size.fontSize};
            font-weight: bold;
            cursor: pointer;
            transition: opacity 0.2s;
        `;
    }
    
    getThemeColor(theme) {
        const colors = {
            shell: '#c6c7bd',
            lavender: '#C3A5E5',
            special: '#b9c971',
            warning: '#E5A6A6',
            salmon: '#E5C3B3',
            attention: '#E5E5A6',
            sky: '#8BC2CF',
            safe: '#73d192',
            brown: '#d9c5b2',
            info: '#6495e3',
            pink: '#FFB3D9',
            orange: '#f69653'
        };
        
        return colors[theme] || colors.special;
    }
    
    static resolveColor(value) {
        if (!value) return null;
        
        const colors = {
            shell: '#c6c7bd',
            lavender: '#C3A5E5',
            special: '#b9c971',
            warning: '#E5A6A6',
            salmon: '#E5C3B3',
            attention: '#E5E5A6',
            sky: '#8BC2CF',
            safe: '#73d192',
            brown: '#d9c5b2',
            info: '#6495e3',
            pink: '#FFB3D9',
        };
        
        return colors[value] || value;
    }
    
    static resolveGradient(value) {
        if (!value) return null;
        
        const gradients = {
            'special-sky': 'linear-gradient(90deg, #b9c971 0%, #8BC2CF 100%)',
            'lavender-pink': 'linear-gradient(90deg, #C3A5E5 0%, #FFB3D9 100%)',
            'warning-orange': 'linear-gradient(90deg, #E5A6A6 0%, #f69653 100%)',
            'safe-sky': 'linear-gradient(90deg, #84c498 0%, #8BC2CF 100%)'
        };
        
        return gradients[value] || value;
    }
    
    createButton() {
        // 創建按鈕容器
        this.buttonWrapper = document.createElement('div');
        this.buttonWrapper.className = 'step-tutor-button-wrapper';
        this.buttonWrapper.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        
        // 創建下一步按鈕
        this.button = document.createElement('button');
        this.button.className = 'step-tutor-button';
        this.button.textContent = this.options.buttonText;
        this.button.addEventListener('click', () => this.revealNext());
        
        this.buttonWrapper.appendChild(this.button);
        
        // 創建重新開始按鈕
        if (this.options.restart) {
            this.restartButton = document.createElement('button');
            this.restartButton.className = 'step-tutor-restart-button';
            this.restartButton.innerHTML = '↻';
            this.restartButton.style.display = 'none';
            this.restartButton.title = '重新開始';
            this.restartButton.addEventListener('click', () => this.reset());
            
            this.buttonWrapper.appendChild(this.restartButton);
        }
    }
    
    createProgressDisplay() {
        this.progressDisplay = document.createElement('div');
        this.progressDisplay.className = 'step-tutor-progress';
    }
    
    createProgressBar() {
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'step-tutor-progress-bar';
        
        this.progressBarFill = document.createElement('div');
        this.progressBarFill.className = 'step-tutor-progress-bar-fill';
        
        const progressText = document.createElement('div');
        progressText.className = 'step-tutor-progress-bar-text';
        progressText.textContent = '0%';
        
        this.progressBar.appendChild(this.progressBarFill);
        this.progressBar.appendChild(progressText);
    }
    
    updateProgressDisplay() {
        if (!this.progressDisplay) return;
        
        const text = this.options.progressText
            .replace('{current}', this.currentStep)
            .replace('{total}', this.totalSteps);
        
        this.progressDisplay.textContent = text;
    }
    
    updateProgressBar() {
        if (!this.progressBar || !this.progressBarFill) return;
        
        const percentage = this.totalSteps > 0 ? Math.round((this.currentStep / this.totalSteps) * 100) : 0;
        this.progressBarFill.style.width = percentage + '%';
        
        const textElement = this.progressBar.querySelector('.step-tutor-progress-bar-text');
        if (textElement) {
            textElement.textContent = percentage + '%';
        }
    }
    
    revealNext() {
        if (this.currentStep >= this.totalSteps) return;
        
        const step = this.steps[this.currentStep];
        
        if (step.target && step.targetElement) {
            this.revealToTarget(step);
        } else {
            const stepElement = this.stepContainer.querySelector(`[data-step-index="${this.currentStep}"]`);
            if (stepElement) {
                stepElement.classList.add('revealed');
                
                if (this.options.autoScroll) {
                    setTimeout(() => {
                        const elementPosition = stepElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - this.options.scrollOffset;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 100);
                }
            }
        }
        
        this.currentStep++;
        
        if (this.options.showProgress) {
            this.updateProgressDisplay();
        }
        if (this.options.showProgressBar) {
            this.updateProgressBar();
        }
        
        if (this.options.onStepRevealed) {
            this.options.onStepRevealed(this.currentStep, this.totalSteps);
        }
        
        if (this.currentStep >= this.totalSteps) {
            this.button.textContent = this.options.buttonCompleteText;
            this.button.disabled = true;
            
            if (this.options.restart && this.restartButton) {
                this.restartButton.style.display = 'inline-block';
            }
            
            if (this.options.onAllRevealed) {
                this.options.onAllRevealed();
            }
        }
    }
    
    revealToTarget(step) {
        if (!step.targetElement) return;
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'step-tutor-target-content';
        contentWrapper.setAttribute('data-step-index', step.index);
        
        if (this.options.showIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'step-tutor-indicator';
            indicator.style.cssText = `
                background: ${this.options.indicatorBgColor};
                color: ${this.options.indicatorTextColor};
                ${this.options.indicatorPadding ? `padding: ${this.options.indicatorPadding};` : 'padding: 4px 8px;'}
                display: inline-block;
                margin-bottom: 8px;
                font-weight: bold;
                font-size: 0.875rem;
                border-radius: 4px;
            `;
            
            let indicatorText = this.options.indicatorFormat.replace('{current}', step.number);
            if (step.indicator) {
                indicatorText = step.indicator;
            }
            if (this.options.showTotalSteps) {
                indicatorText += ` / ${this.totalSteps}`;
            }
            
            indicator.textContent = indicatorText;
            contentWrapper.appendChild(indicator);
        }
        
        // 創建內容元素
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = step.content;
        contentDiv.style.cssText = `
            color: ${this.options.stepTextColor};
            line-height: 1.5;
        `;
        
        if (step.highlight) {
            contentDiv.style.cssText += `
                background: ${this.options.highlightColor}20;
                border-left: 4px solid ${step.highlight !== 'true' ? step.highlight : this.options.highlightColor};
                padding: 6px 10px;
                margin: 4px 0px;
            `;
        }
        
        contentWrapper.appendChild(contentDiv);
        
        // 根據 targetMode 決定如何添加內容
        switch (this.options.targetMode) {
            case 'append':
                step.targetElement.appendChild(contentWrapper);
                break;
            case 'prepend':
                step.targetElement.insertBefore(contentWrapper, step.targetElement.firstChild);
                break;
            case 'replace':
            default:
                step.targetElement.innerHTML = '';
                step.targetElement.appendChild(contentWrapper);
                break;
        }
        
        if (this.options.autoScroll) {
            setTimeout(() => {
                const elementPosition = step.targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - this.options.scrollOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    revealAll() {
        while (this.currentStep < this.totalSteps) {
            const step = this.steps[this.currentStep];
            
            if (step.target && step.targetElement) {
                this.revealToTarget(step);
            } else {
                const stepElement = this.stepContainer.querySelector(`[data-step-index="${this.currentStep}"]`);
                if (stepElement) {
                    stepElement.classList.add('revealed');
                }
            }
            this.currentStep++;
        }
        
        if (this.options.showProgress) {
            this.updateProgressDisplay();
        }
        if (this.options.showProgressBar) {
            this.updateProgressBar();
        }
        
        this.button.textContent = this.options.buttonCompleteText;
        this.button.disabled = true;
        
        if (this.options.restart && this.restartButton) {
            this.restartButton.style.display = 'inline-block';
        }
        
        if (this.options.onAllRevealed) {
            this.options.onAllRevealed();
        }
    }
    
    reset() {
        this.currentStep = 0;
        
        const allSteps = this.stepContainer.querySelectorAll('.step-tutor-item');
        allSteps.forEach(step => step.classList.remove('revealed'));
        
        if (this.options.targetClearOnReset) {
            this.targetElements.forEach(targetElement => {
                const targetContents = targetElement.querySelectorAll('.step-tutor-target-content');
                targetContents.forEach(content => content.remove());
            });
        }
        
        if (this.options.showProgress) {
            this.updateProgressDisplay();
        }
        if (this.options.showProgressBar) {
            this.updateProgressBar();
        }
        
        this.button.textContent = this.options.buttonText;
        this.button.disabled = false;
        
        if (this.options.restart && this.restartButton) {
            this.restartButton.style.display = 'none';
        }
        
        if (this.options.onReset) {
            this.options.onReset();
        }
    }
    
    goToStep(stepNumber) {
        this.reset();
        for (let i = 0; i < stepNumber && i < this.totalSteps; i++) {
            this.revealNext();
        }
    }
    
    destroy() {
        if (this.stepContainer) {
            this.stepContainer.remove();
        }
        if (this.button) {
            this.button.remove();
        }
        if (this.progressDisplay) {
            this.progressDisplay.remove();
        }
        if (this.progressBar) {
            this.progressBar.remove();
        }
        
        this.targetElements.forEach(targetElement => {
            const targetContents = targetElement.querySelectorAll('.step-tutor-target-content');
            targetContents.forEach(content => content.remove());
        });
        
        const styleId = 'step-tutor-styles-' + this.container.id;
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
            styleElement.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const autoInitContainers = document.querySelectorAll('[data-step-tutor]');
    
    autoInitContainers.forEach(container => {
        const options = {};
        const dataAttrs = container.dataset;
        
        if (dataAttrs.stepBgColor) options.stepBgColor = dataAttrs.stepBgColor;
        if (dataAttrs.stepBorderColor) options.stepBorderColor = dataAttrs.stepBorderColor;
        if (dataAttrs.stepTextColor) options.stepTextColor = dataAttrs.stepTextColor;
        if (dataAttrs.indicatorBgColor) options.indicatorBgColor = dataAttrs.indicatorBgColor;
        if (dataAttrs.indicatorTextColor) options.indicatorTextColor = dataAttrs.indicatorTextColor;
        if (dataAttrs.highlightColor) options.highlightColor = dataAttrs.highlightColor;
        
        if (dataAttrs.stepPadding) options.stepPadding = dataAttrs.stepPadding;
        if (dataAttrs.stepMargin) options.stepMargin = dataAttrs.stepMargin;
        if (dataAttrs.indicatorPadding) options.indicatorPadding = dataAttrs.indicatorPadding;
        
        if (dataAttrs.borderWidth) options.borderWidth = dataAttrs.borderWidth;
        if (dataAttrs.borderStyle) options.borderStyle = dataAttrs.borderStyle;
        if (dataAttrs.borderPosition) options.borderPosition = dataAttrs.borderPosition;
        if (dataAttrs.borderSize) options.borderSize = dataAttrs.borderSize;
        if (!dataAttrs.borderSize && dataAttrs.borderWidth) options.borderSize = dataAttrs.borderWidth;
        
        if (dataAttrs.showIndicator) options.showIndicator = dataAttrs.showIndicator !== 'false';
        
        if (dataAttrs.buttonText) options.buttonText = dataAttrs.buttonText;
        if (dataAttrs.buttonCompleteText) options.buttonCompleteText = dataAttrs.buttonCompleteText;
        if (dataAttrs.buttonTheme) options.buttonTheme = dataAttrs.buttonTheme;
        if (dataAttrs.buttonSize) options.buttonSize = dataAttrs.buttonSize;
        
        if (dataAttrs.restart) options.restart = dataAttrs.restart !== 'false';
        
        if (dataAttrs.contentPosition) options.contentPosition = dataAttrs.contentPosition;
        
        if (dataAttrs.indicatorFormat) options.indicatorFormat = dataAttrs.indicatorFormat;
        if (dataAttrs.showTotalSteps) options.showTotalSteps = dataAttrs.showTotalSteps === 'true';
        
        if (dataAttrs.showProgress) options.showProgress = dataAttrs.showProgress !== 'false';
        if (dataAttrs.progressText) options.progressText = dataAttrs.progressText;
        if (dataAttrs.progressFontSize) options.progressFontSize = dataAttrs.progressFontSize;
        if (dataAttrs.progressPosition) options.progressPosition = dataAttrs.progressPosition;
        
        if (dataAttrs.showProgressBar) options.showProgressBar = dataAttrs.showProgressBar === 'true';
        if (dataAttrs.progressBarHeight) options.progressBarHeight = dataAttrs.progressBarHeight;
        if (dataAttrs.progressBarBgColor) options.progressBarBgColor = dataAttrs.progressBarBgColor;
        if (dataAttrs.progressBarGradient) options.progressBarGradient = dataAttrs.progressBarGradient;
        if (dataAttrs.progressBarBorderWidth) options.progressBarBorderWidth = dataAttrs.progressBarBorderWidth;
        if (dataAttrs.progressBarBorderColor) options.progressBarBorderColor = dataAttrs.progressBarBorderColor;
        if (dataAttrs.progressBarBorderRadius) options.progressBarBorderRadius = dataAttrs.progressBarBorderRadius;
        if (dataAttrs.progressBarPadding) options.progressBarPadding = dataAttrs.progressBarPadding;
        
        if (dataAttrs.progressBarTextFontSize) options.progressBarTextFontSize = dataAttrs.progressBarTextFontSize;
        if (dataAttrs.progressBarTextFontWeight) options.progressBarTextFontWeight = dataAttrs.progressBarTextFontWeight;
        if (dataAttrs.progressBarTextColor) options.progressBarTextColor = dataAttrs.progressBarTextColor;
        
        if (dataAttrs.indicatorFontSize) options.indicatorFontSize = dataAttrs.indicatorFontSize;
        if (dataAttrs.indicatorBorderRadius) options.indicatorBorderRadius = dataAttrs.indicatorBorderRadius;
        if (dataAttrs.indicatorMarginBottom) options.indicatorMarginBottom = dataAttrs.indicatorMarginBottom;
        
        if (dataAttrs.restartButtonPadding) options.restartButtonPadding = dataAttrs.restartButtonPadding;
        if (dataAttrs.restartButtonFontSize) options.restartButtonFontSize = dataAttrs.restartButtonFontSize;
        if (dataAttrs.restartButtonFontWeight) options.restartButtonFontWeight = dataAttrs.restartButtonFontWeight;
        
        if (dataAttrs.autoScroll) options.autoScroll = dataAttrs.autoScroll !== 'false';
        
        if (dataAttrs.targetMode) options.targetMode = dataAttrs.targetMode;
        if (dataAttrs.targetClearOnReset) options.targetClearOnReset = dataAttrs.targetClearOnReset !== 'false';
        
        container.stepTutorInstance = new StepTutor(container.id, options);
    });
});
class CardBadge extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isCollapsed = false;
    this.currentCount = 0;
    this.rotateIndex = 0; // 輪播索引
    this.autoRotateTimer = null; // 自動輪播計時器
  }

  static get observedAttributes() {
    return [
      'type', 'value', 'text', 'icon', 
      'theme', 'outline', 'size', 'font-size', 'padding',
      'clickable', 'action', 'data-filter',
      'source', 'target', 'toggle-target', 'removeself',
      'format', 'warning-days',
      'alert-message', 'alert-type', 'alert-duration', 'alert-position', 'alert-source',
      'hover-effect', 'focus-color', 'disabled',
      'font-control', 'font-step',
      'count', 'max-count', 'show-zero', 'dot-mode', 'count-animate',
      'href', 'href-target',
      'copy-html'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'count' && oldValue !== newValue) {
      const oldCount = parseInt(oldValue) || 0;
      const newCount = parseInt(newValue) || 0;
      this.currentCount = newCount;
      
      if (this.getAttribute('count-animate') !== 'false') {
        this.animateCountChange(oldCount, newCount);
      } else {
        this.render();
      }
    } else {
      this.render();
    }
  }

  getBrandColors() {
    return {
      'background': '#1C1C1E',
      'fill': '#242426',
      'shell': '#c6c7bd',
      'lavender': '#C3A5E5',
      'special': '#b9c971',
      'warning': '#E5A6A6',
      'salmon': '#E5C3B3',
      'attention': '#E5E5A6',
      'sky': '#04b5a3',
      'safe': '#84c498',
      'brown': '#d9b375',
      'info': '#6f99D6',
      'pink': '#FFB3D9',
      'orange': '#f69653'
    };
  }

  parseColor(colorValue) {
    if (!colorValue) return null;
    const brandColors = this.getBrandColors();
    return brandColors[colorValue.toLowerCase()] || colorValue;
  }

  getContrastColor(bgColor) {
    if (!bgColor) return '#e0e0e0';
    
    let color = this.parseColor(bgColor);
    color = color.replace('#', '');
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1C1C1E' : '#e0e0e0';
  }

  hexToRgba(hex, alpha = 1) {
    if (!hex) return null;
    
    hex = this.parseColor(hex);
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getInheritedTheme() {
    let parent = this.parentElement;
    while (parent) {
      if (parent.tagName === 'CARD-V3') {
        return parent.getAttribute('theme') || 'shell';
      }
      parent = parent.parentElement;
    }
    return 'shell';
  }

  // 解析主題（支援 -outline 後綴）
  parseTheme() {
    const themeAttr = this.getAttribute('theme') || this.getInheritedTheme();
    
    // 檢查是否有 -outline 後綴
    if (themeAttr.endsWith('-outline')) {
      const colorName = themeAttr.replace('-outline', '');
      return {
        color: this.parseColor(colorName),
        isOutline: true
      };
    }
    
    return {
      color: this.parseColor(themeAttr),
      isOutline: false
    };
  }

  // 取得主題色
  getThemeColor() {
    const theme = this.getAttribute('theme') || this.getInheritedTheme();
    // 移除可能的 -outline 後綴
    const cleanTheme = theme.replace('-outline', '');
    return this.parseColor(cleanTheme);
  }

  // 格式化數量顯示
  formatCount(count) {
    const maxCount = parseInt(this.getAttribute('max-count')) || 99;
    
    if (count > maxCount) {
      return `${maxCount}+`;
    }
    
    return count.toString();
  }

  // 判斷是否為數量型 badge
  isCountBadge() {
    return this.hasAttribute('count');
  }

  // 判斷是否為小紅點模式
  isDotMode() {
    return this.getAttribute('dot-mode') === 'true';
  }

  // 數量變化動畫
  animateCountChange(oldCount, newCount) {
    const badge = this.shadowRoot.querySelector('.badge');
    if (!badge) {
      this.render();
      return;
    }

    // 添加動畫類
    badge.classList.add('count-change');
    
    // 更新內容
    this.render();
    
    // 移除動畫類
    setTimeout(() => {
      const newBadge = this.shadowRoot.querySelector('.badge');
      if (newBadge) {
        newBadge.classList.remove('count-change');
      }
    }, 300);
  }

  // 格式化日期
  formatDate(dateString, format = 'YYYY-MM-DD') {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (format === 'MM/DD') return `${month}/${day}`;
    if (format === 'MM-DD') return `${month}-${day}`;
    
    return `${year}-${month}-${day}`;
  }

  // 格式化時間
  formatTime(timeString) {
    const date = new Date(`2000-01-01T${timeString}`);
    if (isNaN(date.getTime())) return timeString;

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }

  // 格式化日期時間
  formatDateTime(datetimeString, format = 'MM/DD HH:mm') {
    const date = new Date(datetimeString);
    if (isNaN(date.getTime())) return datetimeString;

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (format === 'MM/DD HH:mm') return `${month}/${day} ${hours}:${minutes}`;
    
    return `${month}/${day} ${hours}:${minutes}`;
  }

  // 計算截止日期
  formatDeadline(dateString) {
    const deadline = new Date(dateString);
    const now = new Date();
    
    if (isNaN(deadline.getTime())) return dateString;

    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const warningDays = parseInt(this.getAttribute('warning-days')) || 3;

    if (diffDays < 0) {
      return { text: `已逾期 ${Math.abs(diffDays)} 天`, isWarning: true, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: '今天到期', isWarning: true, isOverdue: false };
    } else if (diffDays === 1) {
      return { text: '明天到期', isWarning: true, isOverdue: false };
    } else if (diffDays <= warningDays) {
      return { text: `還剩 ${diffDays} 天`, isWarning: true, isOverdue: false };
    } else {
      return { text: `還剩 ${diffDays} 天`, isWarning: false, isOverdue: false };
    }
  }

  // 取得顯示內容
  getDisplayContent() {
    const action = this.getAttribute('action');
    
    // 處理 rotate-self 和 rotate-self-auto 模式
    if (action === 'rotate-self' || action === 'rotate-self-auto') {
      const items = this.getBadgeItems();
      if (items.length > 0) {
        const currentItem = items[this.rotateIndex];
        
        // 優先使用 badge-item 的 text 屬性，否則使用 textContent
        const itemText = currentItem.getAttribute('text') || currentItem.textContent || '';
        const itemIcon = currentItem.getAttribute('icon') || '';
        
        // 優先使用 badge-item 的 theme 屬性，否則使用 card-badge 的 theme
        const itemTheme = currentItem.getAttribute('theme');
        const finalTheme = itemTheme ? this.parseColor(itemTheme) : this.getThemeColor();
        
        return {
          icon: itemIcon,
          text: itemText.trim(),
          theme: finalTheme
        };
      }
    }

    const type = this.getAttribute('type');
    const value = this.getAttribute('value');
    const text = this.getAttribute('text');
    const icon = this.getAttribute('icon');
    const format = this.getAttribute('format');

    // 處理數量型 badge
    if (this.isCountBadge()) {
      const count = parseInt(this.getAttribute('count')) || 0;
      const showZero = this.getAttribute('show-zero') === 'true';
      const dotMode = this.isDotMode();

      // 如果數量為 0 且不顯示 0
      if (count === 0 && !showZero) {
        return null;
      }

      // 小紅點模式
      if (dotMode) {
        return {
          icon: '',
          text: '',
          theme: this.getThemeColor(),
          isCountBadge: true,
          isDot: true,
          count: count
        };
      }

      // 數字模式
      return {
        icon: icon || '',
        text: this.formatCount(count),
        theme: this.getThemeColor(),
        isCountBadge: true,
        isDot: false,
        count: count
      };
    }

    // 處理格式化類型
    if (type && value) {
      switch(type) {
        case 'date':
          return {
            icon: icon || '',
            text: this.formatDate(value, format),
            theme: this.getThemeColor()
          };
        case 'time':
          return {
            icon: icon || '',
            text: this.formatTime(value),
            theme: this.getThemeColor()
          };
        case 'datetime':
          return {
            icon: icon || '',
            text: this.formatDateTime(value, format),
            theme: this.getThemeColor()
          };
        case 'deadline':
          const deadlineInfo = this.formatDeadline(value);
          const deadlineTheme = deadlineInfo.isOverdue ? 
            this.parseColor('warning') : 
            (deadlineInfo.isWarning ? this.parseColor('attention') : this.getThemeColor());
          return {
            icon: icon || (deadlineInfo.isOverdue ? '⚠️' : '📅'),
            text: deadlineInfo.text,
            theme: deadlineTheme
          };
      }
    }

    // 一般顯示
    return {
      icon: icon || '',
      text: text || '',
      theme: this.getThemeColor()
    };
  }

  // 取得尺寸樣式
  getSizeStyles() {
    const size = this.getAttribute('size') || 'md';
    const customFontSize = this.getAttribute('font-size');
    const customPadding = this.getAttribute('padding');

    const sizePresets = {
      'xs': { fontSize: '0.558rem', padding: '1px 6px', width: '8px', height: '8px' },
      'sm': { fontSize: '0.713rem', padding: '2px 8px', width: '10px', height: '10px' },
      'md': { fontSize: '0.838rem', padding: '3px 10px', width: '10px', height: '10px' },
	  're': { fontSize: '1.01rem', padding: '4px 10px', width: '12px', height: '12px' },
      'lg': { fontSize: '1.363rem', padding: '6px 12px', width: '14px', height: '14px' },
      'xl': { fontSize: '1.758rem', padding: '8px 14px', width: '16px', height: '16px' }
    };

    const preset = sizePresets[size] || sizePresets['re'];

    return {
      fontSize: customFontSize || preset.fontSize,
      padding: customPadding || preset.padding,
      width: preset.width,
      height: preset.height
    };
  }

  // 顯示頁面提示
  showPageAlert(message, type = 'info', duration = 4000, position = 'top') {
    const existingAlert = document.querySelector('.card-badge-page-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    const brandColors = this.getBrandColors();
    const alertColors = {
      'info': brandColors.info,
      'success': brandColors.safe,
      'warning': brandColors.attention,
      'danger': brandColors.warning
    };

    const alertDiv = document.createElement('div');
    alertDiv.className = `card-badge-page-alert alert-${type}`;
    
    const bgColor = alertColors[type] || brandColors.info;
    const textColor = this.getContrastColor(bgColor);
    
    const positionStyles = {
      'top': 'top: 20px; left: 50%; transform: translateX(-50%);',
      'top-left': 'top: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'bottom': 'bottom: 20px; left: 50%; transform: translateX(-50%);',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;'
    };
    
    alertDiv.style.cssText = `
      position: fixed;
      ${positionStyles[position] || positionStyles['top']}
      z-index: 10000;
      background: ${bgColor};
      color: ${textColor};
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      font-size: 1rem;
      animation: slideInDown 0.3s ease-out;
      max-width: 90%;
      word-wrap: break-word;
    `;
    
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      alertDiv.style.animation = 'slideOutUp 0.3s ease-out';
      setTimeout(() => {
        alertDiv.remove();
        style.remove();
      }, 300);
    }, duration);
  }

  updateCollapseIndicator() {
    const iconElement = this.shadowRoot.querySelector('.badge i, .badge .icon');
    if (iconElement) {
      if (this.isCollapsed) {
        iconElement.style.transform = 'rotate(0deg)';
      } else {
        iconElement.style.transform = 'rotate(180deg)';
      }
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventHandlers();
    
    const action = this.getAttribute('action');
    if (action === 'rotate-self-auto') {
      this.startAutoRotate();
    }
  }

  disconnectedCallback() {
    this.stopAutoRotate();
  }

  getBadgeItems() {
    return Array.from(this.querySelectorAll('badge-item'));
  }

  parseInterval(intervalStr) {
    if (!intervalStr) return 3000;
    
    const match = intervalStr.match(/^(\d+(?:\.\d+)?)(s|m)?$/i);
    if (!match) return 3000;
    
    const value = parseFloat(match[1]);
    const unit = (match[2] || 's').toLowerCase();
    
    if (unit === 'm') {
      return value * 60 * 1000;
    } else {
      return value * 1000;
    }
  }

  startAutoRotate() {
    const action = this.getAttribute('action');
    if (action !== 'rotate-self-auto') return;
    
    const interval = this.parseInterval(this.getAttribute('interval'));
    
    this.stopAutoRotate();
    
    this.autoRotateTimer = setInterval(() => {
      this.performRotateSelf(true); // true 表示自動模式
    }, interval);
  }

  stopAutoRotate() {
    if (this.autoRotateTimer) {
      clearInterval(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
  }

  performRotateContent() {
    const target = this.getAttribute('target');
    if (!target) {
      console.warn('Card-Badge: rotate-content 模式需要指定 target 屬性');
      return;
    }

    const targetEl = document.getElementById(target);
    if (!targetEl) {
      console.warn(`Card-Badge: 找不到目標元素 #${target}`);
      return;
    }

    const items = this.getBadgeItems();
    if (items.length === 0) {
      console.warn('Card-Badge: 沒有找到 badge-item 子元素');
      return;
    }

    targetEl.innerHTML = '';

    const currentItem = items[this.rotateIndex];
    
    targetEl.innerHTML = currentItem.innerHTML;

    this.rotateIndex = (this.rotateIndex + 1) % items.length;

    this.dispatchEvent(new CustomEvent('badge-rotate', {
      bubbles: true,
      detail: {
        mode: 'content',
        currentIndex: this.rotateIndex,
        totalItems: items.length,
        targetId: target
      }
    }));
  }

  performRotateSelf(isAuto = false) {
    const items = this.getBadgeItems();
    if (items.length === 0) {
      console.warn('Card-Badge: 沒有找到 badge-item 子元素');
      return;
    }

    this.rotateIndex = (this.rotateIndex + 1) % items.length;
    this.render();

    if (!isAuto) {
      this.expandCurrentItem();
    }
	
    this.dispatchEvent(new CustomEvent('badge-rotate', {
      bubbles: true,
      detail: {
        mode: 'self',
        isAuto: isAuto,
        currentIndex: this.rotateIndex,
        totalItems: items.length
      }
    }));
  }

  expandCurrentItem() {
    const target = this.getAttribute('target');
    if (!target) return;

    const targetEl = document.getElementById(target);
    if (!targetEl) {
      console.warn(`Card-Badge: 找不到目標元素 #${target}`);
      return;
    }

    const items = this.getBadgeItems();
    if (items.length === 0) return;

    const currentItem = items[this.rotateIndex];
    
    // 清空並填入內容
    targetEl.innerHTML = '';
    targetEl.innerHTML = currentItem.innerHTML;

    // 觸發展開事件
    this.dispatchEvent(new CustomEvent('badge-expand', {
      bubbles: true,
      detail: {
        currentIndex: this.rotateIndex,
        totalItems: items.length,
        targetId: target
      }
    }));
  }

  setupEventHandlers() {
    const clickable = this.getAttribute('clickable') === 'true';
    const action = this.getAttribute('action');
    const filterValue = this.getAttribute('data-filter');
    const source = this.getAttribute('source');
    const target = this.getAttribute('target');
    const toggleTarget = this.getAttribute('toggle-target');
    const removeSelf = this.getAttribute('removeself') === 'true';
    const fontControl = this.getAttribute('font-control');
    const disabled = this.getAttribute('disabled') === 'true';
    const href = this.getAttribute('href');

    if (disabled) return;

    if (clickable || action || filterValue || toggleTarget || fontControl || href) {
      this.setAttribute('tabindex', '0');
      this.style.cursor = 'pointer';

      const handleClick = () => {
        if (disabled) return;

        // 處理連結
        if (href) {
          const hrefTarget = this.getAttribute('href-target') || '_self';
          window.open(href, hrefTarget);
        }

        // 處理輪播
        if (action === 'rotate-content') {
          this.performRotateContent();
          return;
        }

        if (action === 'rotate-self') {
          this.performRotateSelf();
          return;
        }

        if (action === 'rotate-self-auto') {
          // 點擊時展開當前項目到目標區域
          this.expandCurrentItem();
          return;
        }

        // 處理 toggle
        if (toggleTarget) {
          const targetElement = document.getElementById(toggleTarget);
          if (targetElement) {
            this.isCollapsed = !this.isCollapsed;
            targetElement.dataset.cardBadgeCollapsed = this.isCollapsed;
            
            if (this.isCollapsed) {
              targetElement.style.transition = 'all 0.3s ease';
              targetElement.style.height = targetElement.scrollHeight + 'px';
              
              requestAnimationFrame(() => {
                targetElement.style.height = '0';
                targetElement.style.opacity = '0';
              });
              
              setTimeout(() => {
                targetElement.style.display = 'none';
              }, 300);
            } else {
              targetElement.style.display = '';
              targetElement.style.height = '0';
              targetElement.style.opacity = '0';
              
              requestAnimationFrame(() => {
                targetElement.style.height = targetElement.scrollHeight + 'px';
                targetElement.style.opacity = '1';
              });
              
              setTimeout(() => {
                targetElement.style.height = '';
              }, 300);
            }
            
            this.updateCollapseIndicator();
          }
        }

        // 處理過濾
        if (action === 'filter' && filterValue) {
          const filterables = document.querySelectorAll('[data-filter-group]');
          filterables.forEach(item => {
            const itemFilters = item.getAttribute('data-filter-group').split(',').map(f => f.trim());
            
            if (filterValue === 'all' || itemFilters.includes(filterValue)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        }

        if (action === 'copy') {
          const copyHtml = this.getAttribute('copy-html') === 'true';
          let contentToCopy = this.getAttribute('text') || '';
          
          // 從 source 取得內容
          if (source) {
            const sourceEl = document.getElementById(source);
            if (sourceEl) {
              if (sourceEl.tagName === 'INPUT' || sourceEl.tagName === 'TEXTAREA') {
                contentToCopy = sourceEl.value;
              } else {
                // 根據 copy-html 屬性決定取 innerHTML 或 textContent
                contentToCopy = copyHtml ? sourceEl.innerHTML : (sourceEl.textContent || sourceEl.innerText);
              }
            }
          }
          
          // 寫入 target
          if (target) {
            const targetEl = document.getElementById(target);
            if (targetEl) {
              if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA') {
                targetEl.value = contentToCopy;
              } else {
                // 根據 copy-html 屬性決定用 innerHTML 或 textContent
                if (copyHtml) {
                  targetEl.innerHTML = contentToCopy;
                } else {
                  targetEl.textContent = contentToCopy;
                }
              }
            }
          }

          // 複製到剪貼簿（永遠是純文字，因為 navigator.clipboard.writeText 不支援 HTML）
          if (contentToCopy) {
            const textForClipboard = copyHtml ? 
              (new DOMParser().parseFromString(contentToCopy, 'text/html')).body.textContent || '' : 
              contentToCopy;
              
            navigator.clipboard.writeText(textForClipboard).then(() => {
              //this.showPageAlert('已複製', 'success', 2000, 'top');
            }).catch(err => {
              console.error('複製失敗：', err);
            });
          }
        }

        // 處理移除自身
        if (removeSelf) {
          this.style.transition = 'all 0.3s ease';
          this.style.opacity = '0';
          this.style.transform = 'scale(0.8)';
          setTimeout(() => {
            this.remove();
          }, 300);
        }

        // 處理字體控制
        if (fontControl) {
          const targetEl = document.getElementById(fontControl);
          if (targetEl) {
            const currentSize = parseFloat(window.getComputedStyle(targetEl).fontSize);
            const step = parseFloat(this.getAttribute('font-step')) || 2;
            const actionType = this.getAttribute('action');
            
            let newSize = currentSize;
            if (actionType === 'font-increase') {
              newSize = Math.min(currentSize + step, 32);
            } else if (actionType === 'font-decrease') {
              newSize = Math.max(currentSize - step, 12);
            } else if (actionType === 'font-reset') {
              targetEl.style.fontSize = '';
              return;
            }
            
            targetEl.style.fontSize = newSize + 'px';
          }
        }

        // 處理提示訊息
        let finalAlertMessage = this.getAttribute('alert-message');
        const alertSource = this.getAttribute('alert-source');
        
        if (alertSource && !finalAlertMessage) {
          const sourceEl = document.getElementById(alertSource);
          if (sourceEl) {
            finalAlertMessage = sourceEl.textContent || sourceEl.innerText || sourceEl.value || '';
          } else {
            console.warn(`Card-Badge: 找不到 alert-source 元素 #${alertSource}`);
          }
        }

        if (finalAlertMessage) {
          const alertType = this.getAttribute('alert-type') || 'info';
          const alertDuration = this.hasAttribute('alert-duration') 
            ? parseInt(this.getAttribute('alert-duration')) 
            : 4000;
          const alertPosition = this.getAttribute('alert-position') || 'top';
          this.showPageAlert(finalAlertMessage, alertType, alertDuration, alertPosition);
        }
        
        // 觸發自訂事件
        this.dispatchEvent(new CustomEvent('badge-click', {
          bubbles: true,
          detail: {
            action: action,
            filter: filterValue,
            source: source,
            target: target,
            toggleTarget: toggleTarget,
            fontControl: fontControl,
            isCollapsed: this.isCollapsed,
            type: this.getAttribute('type'),
            value: this.getAttribute('value'),
            text: this.getAttribute('text'),
            count: this.currentCount,
            href: href,
            alertMessage: finalAlertMessage
          }
        }));
      };

      this.addEventListener('click', handleClick);
      
      // 添加鍵盤支援
      this.addEventListener('keydown', (e) => {
        if (disabled) return;
        
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      });
    }
  }

  // 渲染圖示
  renderIcon(iconValue) {
    if (!iconValue) return '';
    
    // 判斷是否為 Bootstrap Icons（以 bi- 開頭）
    if (iconValue.startsWith('bi-')) {
      // Bootstrap Icons 格式
      return `<i class="bi ${iconValue}"></i>`;
    } else {
      // Emoji 或其他文字
      return `<span class="icon">${iconValue}</span>`;
    }
  }

  // 取得 hover 效果樣式
  getHoverEffect() {
    const hoverEffect = this.getAttribute('hover-effect') || 'lift';
    const clickable = this.getAttribute('clickable') === 'true';
    const toggleTarget = this.getAttribute('toggle-target');
    
    if (!clickable && !toggleTarget) return '';

    const effects = {
      'lift': `
        card-badge:hover .badge {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        card-badge:active .badge {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `,
      'scale': `
        card-badge:hover .badge {
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }
        card-badge:active .badge {
          transform: scale(1.02);
        }
      `,
      'glow': `
        card-badge:hover .badge {
          box-shadow: 0 0 20px var(--glow-color);
          filter: brightness(1.15);
        }
        card-badge:active .badge {
          filter: brightness(1.05);
        }
      `,
      'pulse': `
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        card-badge:hover .badge {
          animation: badge-pulse 0.6s ease-in-out;
        }
      `,
      'rotate': `
        card-badge:hover .badge {
          transform: rotate(2deg) translateY(-2px);
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.35);
        }
        card-badge:active .badge {
          transform: rotate(0deg);
        }
      `,
      'none': ''
    };

    return effects[hoverEffect] || effects.lift;
  }

  render() {
    const content = this.getDisplayContent();
    
    // 如果內容為 null（數量為 0 且不顯示），隱藏整個元件
    if (content === null) {
      this.style.display = 'none';
      return;
    } else {
      this.style.display = '';
    }

    const themeInfo = this.parseTheme();
    const manualOutline = this.getAttribute('outline') === 'true';
    const sizeStyles = this.getSizeStyles();
    const clickable = this.getAttribute('clickable') === 'true';
    const toggleTarget = this.getAttribute('toggle-target');
    const fontControl = this.getAttribute('font-control');
    const disabled = this.getAttribute('disabled') === 'true';
    const focusColor = this.parseColor(this.getAttribute('focus-color')) || content.theme;

    // 判斷是否使用外框樣式（theme 包含 -outline 或 outline 屬性為 true）
    const isOutline = themeInfo.isOutline || manualOutline;

    let bgColor, textColor, borderStyle;
    
    if (disabled) {
      bgColor = 'rgba(100, 100, 100, 0.2)';
      textColor = 'rgba(200, 200, 200, 0.5)';
      borderStyle = '1px solid rgba(150, 150, 150, 0.3)';
    } else if (isOutline) {
      bgColor = this.hexToRgba(content.theme, 0.1);
      textColor = content.theme;
      borderStyle = `1px solid ${content.theme}`;
    } else {
      bgColor = content.theme;
      textColor = this.getContrastColor(content.theme);
      borderStyle = 'none';
    }

    const hoverStyles = disabled ? '' : this.getHoverEffect();
    const useBootstrapIcons = content.icon && content.icon.startsWith('bi-');
    const isDotMode = content.isDot;
    const dotStyles = isDotMode ? `
      width: ${sizeStyles.width};
      height: ${sizeStyles.height};
      padding: 0px;
      border-radius: 50%;
      min-width: ${sizeStyles.width};
      min-height: ${sizeStyles.height};
    ` : '';

    this.shadowRoot.innerHTML = `
      <style>
        ${useBootstrapIcons ? '@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");' : ''}
        
        :host {
          display: inline-block;
          vertical-align: middle;
          --glow-color: ${this.hexToRgba(content.theme, 0.5)};
        }
        
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: ${sizeStyles.padding};
          background: ${bgColor};
          color: ${textColor};
          border: ${borderStyle};
          border-radius: 12px;
          font-size: ${sizeStyles.fontSize};
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          margin: 4px;
          user-select: none;
          ${dotStyles}
          ${disabled ? 'opacity: 0.6; cursor: not-allowed;' : ''}
        }

        .badge.count-change {
          animation: count-pop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes count-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        ${hoverStyles}

        ${(clickable || toggleTarget || fontControl) && !disabled ? `
          card-badge:focus {
            outline: none;
          }
          
          card-badge:focus .badge {
            box-shadow: 0 0 0 3px ${this.hexToRgba(focusColor, 0.3)};
            transform: translateY(-1px);
          }
          
          card-badge:focus:not(:focus-visible) .badge {
            box-shadow: none;
            transform: none;
          }
        ` : ''}

        ${disabled ? `
          .badge * {
            pointer-events: none;
          }
        ` : ''}

        .icon {
          display: inline-block;
          line-height: 1;
          transition: transform 0.3s ease;
        }

        .badge i {
          display: inline-block;
          line-height: 1;
          transition: transform 0.3s ease;
        }

        .text {
          display: inline-block;
          line-height: 1;
        }
      </style>
      
      <div class="badge">
        ${!isDotMode ? this.renderIcon(content.icon) : ''}
        ${!isDotMode && content.text ? `<span class="text">${content.text}</span>` : ''}
      </div>
    `;

    if (toggleTarget && !disabled) {
      const targetElement = document.getElementById(toggleTarget);
      if (targetElement) {
        this.isCollapsed = targetElement.dataset.cardBadgeCollapsed === 'true';
        
        if (this.isCollapsed) {
          targetElement.style.display = 'none';
          targetElement.style.height = '0';
          targetElement.style.opacity = '0';
        }
        
        this.updateCollapseIndicator();
      }
    }
  }
}

class BadgeItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.style.display = 'none';
  }
}

customElements.define('card-badge', CardBadge);
customElements.define('badge-item', BadgeItem);
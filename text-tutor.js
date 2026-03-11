class TextTutor extends HTMLElement {
  constructor() {
    super();
    this.notes = {};
    this.currentActiveNote = null;
  }

  static get observedAttributes() {
    return [
      'width', 'col-size', 'font-size', 'border-width',
      'theme', 'show-indicators', 'show-controls',
      'enable-highlight', 'panel-visible', 'view-mode',
      'inline-style'
    ];
  }

  getThemes() {
    return {
      shell: {
        '--primary-color': '#c6c7bd',
        '--accent-color': '#5a5b54',
        '--body-bg': '#f4f6f9',
        '--article-bg': '#fafafa',
        '--panel-bg': '#c6c7bd',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#e8e9e0',
        '--note-hover': '#d8d9d0',
        '--note-active': '#c8c9c0',
        '--highlight-color': '#fff700',
        '--border-color': '#c6c7bd',
        '--indicator-color': '#5a5b54',
        '--note-title-color': '#2c3e50',
        '--note-content-bg': '#f5f6f0',
        '--note-border': '#5a5b54',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#5a5b54',
        '--btn-hover-bg': '#5a5b54',
        '--btn-hover-text': '#ffffff'
      },
      lavender: {
        '--primary-color': '#C3A5E5',
        '--accent-color': '#7d4fb8',
        '--body-bg': '#f5f0fa',
        '--article-bg': '#faf7fd',
        '--panel-bg': '#C3A5E5',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#e8ddf5',
        '--note-hover': '#d8cde5',
        '--note-active': '#c8bdd5',
        '--highlight-color': '#fff700',
        '--border-color': '#C3A5E5',
        '--indicator-color': '#7d4fb8',
        '--note-title-color': '#5d3a88',
        '--note-content-bg': '#f5f0fa',
        '--note-border': '#7d4fb8',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#7d4fb8',
        '--btn-hover-bg': '#7d4fb8',
        '--btn-hover-text': '#ffffff'
      },
      special: {
        '--primary-color': '#b9c971',
        '--accent-color': '#7a8a3a',
        '--body-bg': '#f5f7ed',
        '--article-bg': '#fafcf5',
        '--panel-bg': '#b9c971',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#e5ecc9',
        '--note-hover': '#d5dcb9',
        '--note-active': '#c5cca9',
        '--highlight-color': '#fff700',
        '--border-color': '#b9c971',
        '--indicator-color': '#7a8a3a',
        '--note-title-color': '#4a5a2a',
        '--note-content-bg': '#f0f4e5',
        '--note-border': '#7a8a3a',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#7a8a3a',
        '--btn-hover-bg': '#7a8a3a',
        '--btn-hover-text': '#ffffff'
      },
      warning: {
        '--primary-color': '#E5A6A6',
        '--accent-color': '#c65656',
        '--body-bg': '#fdf0f0',
        '--article-bg': '#fef8f8',
        '--panel-bg': '#E5A6A6',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#f5d9d9',
        '--note-hover': '#e5c9c9',
        '--note-active': '#d5b9b9',
        '--highlight-color': '#fff700',
        '--border-color': '#E5A6A6',
        '--indicator-color': '#c65656',
        '--note-title-color': '#a63636',
        '--note-content-bg': '#fef0f0',
        '--note-border': '#c65656',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#c65656',
        '--btn-hover-bg': '#c65656',
        '--btn-hover-text': '#ffffff'
      },
      salmon: {
        '--primary-color': '#E5C3B3',
        '--accent-color': '#c67d5d',
        '--body-bg': '#fdf7f4',
        '--article-bg': '#fefbf9',
        '--panel-bg': '#E5C3B3',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#f5e5d9',
        '--note-hover': '#e5d5c9',
        '--note-active': '#d5c5b9',
        '--highlight-color': '#fff700',
        '--border-color': '#E5C3B3',
        '--indicator-color': '#c67d5d',
        '--note-title-color': '#a65d3d',
        '--note-content-bg': '#fef5f0',
        '--note-border': '#c67d5d',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#c67d5d',
        '--btn-hover-bg': '#c67d5d',
        '--btn-hover-text': '#ffffff'
      },
      attention: {
        '--primary-color': '#E5E5A6',
        '--accent-color': '#b8b856',
        '--body-bg': '#fdfdf0',
        '--article-bg': '#fefef8',
        '--panel-bg': '#E5E5A6',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#f5f5d9',
        '--note-hover': '#e5e5c9',
        '--note-active': '#d5d5b9',
        '--highlight-color': '#fff700',
        '--border-color': '#E5E5A6',
        '--indicator-color': '#b8b856',
        '--note-title-color': '#888836',
        '--note-content-bg': '#fefef0',
        '--note-border': '#b8b856',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#b8b856',
        '--btn-hover-bg': '#b8b856',
        '--btn-hover-text': '#ffffff'
      },
      sky: {
        '--primary-color': '#8BC2CF',
        '--accent-color': '#4a8a9f',
        '--body-bg': '#f0f7f9',
        '--article-bg': '#f8fcfd',
        '--panel-bg': '#8BC2CF',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#d5e9ed',
        '--note-hover': '#c5d9dd',
        '--note-active': '#b5c9cd',
        '--highlight-color': '#fff700',
        '--border-color': '#8BC2CF',
        '--indicator-color': '#4a8a9f',
        '--note-title-color': '#2a5a6f',
        '--note-content-bg': '#f0f8fa',
        '--note-border': '#4a8a9f',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#4a8a9f',
        '--btn-hover-bg': '#4a8a9f',
        '--btn-hover-text': '#ffffff'
      },
      safe: {
        '--primary-color': '#84c498',
        '--accent-color': '#4a8a5a',
        '--body-bg': '#f0f9f4',
        '--article-bg': '#f8fdf9',
        '--panel-bg': '#84c498',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#d5eddd',
        '--note-hover': '#c5ddcd',
        '--note-active': '#b5cdbd',
        '--highlight-color': '#fff700',
        '--border-color': '#84c498',
        '--indicator-color': '#4a8a5a',
        '--note-title-color': '#2a5a3a',
        '--note-content-bg': '#f0faf4',
        '--note-border': '#4a8a5a',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#4a8a5a',
        '--btn-hover-bg': '#4a8a5a',
        '--btn-hover-text': '#ffffff'
      },
      brown: {
        '--primary-color': '#d9c5b2',
        '--accent-color': '#a68762',
        '--body-bg': '#f9f7f4',
        '--article-bg': '#fdfbf9',
        '--panel-bg': '#d9c5b2',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#efe5d9',
        '--note-hover': '#dfd5c9',
        '--note-active': '#cfc5b9',
        '--highlight-color': '#fff700',
        '--border-color': '#d9c5b2',
        '--indicator-color': '#a68762',
        '--note-title-color': '#765742',
        '--note-content-bg': '#faf6f0',
        '--note-border': '#a68762',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#a68762',
        '--btn-hover-bg': '#a68762',
        '--btn-hover-text': '#ffffff'
      },
      info: {
        '--primary-color': '#6f99D6',
        '--accent-color': '#3a5fa8',
        '--body-bg': '#f0f4fb',
        '--article-bg': '#f8fafd',
        '--panel-bg': '#6f99D6',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#d5e0f0',
        '--note-hover': '#c5d0e0',
        '--note-active': '#b5c0d0',
        '--highlight-color': '#fff700',
        '--border-color': '#6f99D6',
        '--indicator-color': '#3a5fa8',
        '--note-title-color': '#2a4f88',
        '--note-content-bg': '#f0f5fb',
        '--note-border': '#3a5fa8',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#3a5fa8',
        '--btn-hover-bg': '#3a5fa8',
        '--btn-hover-text': '#ffffff'
      },
      pink: {
        '--primary-color': '#FFB3D9',
        '--accent-color': '#d966a8',
        '--body-bg': '#fff5fb',
        '--article-bg': '#fffafd',
        '--panel-bg': '#FFB3D9',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#ffe0f0',
        '--note-hover': '#ffd0e0',
        '--note-active': '#ffc0d0',
        '--highlight-color': '#fff700',
        '--border-color': '#FFB3D9',
        '--indicator-color': '#d966a8',
        '--note-title-color': '#a93678',
        '--note-content-bg': '#fff5fb',
        '--note-border': '#d966a8',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#d966a8',
        '--btn-hover-bg': '#d966a8',
        '--btn-hover-text': '#ffffff'
      },
      orange: {
        '--primary-color': '#f69653',
        '--accent-color': '#c66523',
        '--body-bg': '#fef6f0',
        '--article-bg': '#fffbf8',
        '--panel-bg': '#f69653',
        '--panel-text': '#1C1C1E',
        '--article-text': '#1C1C1E',
        '--note-bg': '#fde5d5',
        '--note-hover': '#edd5c5',
        '--note-active': '#ddc5b5',
        '--highlight-color': '#fff700',
        '--border-color': '#f69653',
        '--indicator-color': '#c66523',
        '--note-title-color': '#964513',
        '--note-content-bg': '#fef5ed',
        '--note-border': '#c66523',
        '--btn-text': '#1C1C1E',
        '--btn-border': '#c66523',
        '--btn-hover-bg': '#c66523',
        '--btn-hover-text': '#ffffff'
      },
      background: {
        '--primary-color': '#1C1C1E',
        '--accent-color': '#84c498',
        '--body-bg': '#0d0d0d',
        '--article-bg': '#1C1C1E',
        '--panel-bg': '#242426',
        '--panel-text': '#e0e0e0',
        '--article-text': '#e0e0e0',
        '--note-bg': '#2d2d2f',
        '--note-hover': '#3d3d3f',
        '--note-active': '#4d4d4f',
        '--highlight-color': '#ffd700',
        '--border-color': '#3a3a3c',
        '--indicator-color': '#84c498',
        '--note-title-color': '#84c498',
        '--note-content-bg': '#1a1a1c',
        '--note-border': '#84c498',
        '--btn-text': '#e0e0e0',
        '--btn-border': '#84c498',
        '--btn-hover-bg': '#84c498',
        '--btn-hover-text': '#1C1C1E'
      },
      fill: {
        '--primary-color': '#242426',
        '--accent-color': '#84c498',
        '--body-bg': '#1C1C1E',
        '--article-bg': '#242426',
        '--panel-bg': '#2d2d2f',
        '--panel-text': '#e0e0e0',
        '--article-text': '#e0e0e0',
        '--note-bg': '#353537',
        '--note-hover': '#454547',
        '--note-active': '#555557',
        '--highlight-color': '#ffd700',
        '--border-color': '#3a3a3c',
        '--indicator-color': '#84c498',
        '--note-title-color': '#84c498',
        '--note-content-bg': '#1f1f21',
        '--note-border': '#84c498',
        '--btn-text': '#e0e0e0',
        '--btn-border': '#84c498',
        '--btn-hover-bg': '#84c498',
        '--btn-hover-text': '#1C1C1E'
      }
    };
  }

  // 解析 col-size 比例
  parseColSize(colSize) {
    const match = colSize.match(/^(\d+):(\d+)$/);
    if (!match) return { left: 66.67, right: 33.33 };
    
    const left = parseInt(match[1]);
    const right = parseInt(match[2]);
    const total = left + right;
    
    return {
      left: (left / total) * 100,
      right: (right / total) * 100
    };
  }

  // 應用主題
  applyTheme(themeName) {
    const themes = this.getThemes();
    const theme = themes[themeName] || themes.fill;
    
    Object.keys(theme).forEach(key => {
      this.style.setProperty(key, theme[key]);
    });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.loadNotes();
    this.bindNoteEvents();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'theme':
        this.applyTheme(newValue);
        this.dispatchEvent(new CustomEvent('theme-changed', {
          detail: { theme: newValue }
        }));
        break;
      case 'width':
      case 'col-size':
      case 'font-size':
      case 'border-width':
        this.updateStyles();
        break;
      case 'panel-visible':
        this.updatePanelVisibility();
        break;
      case 'view-mode':
        this.updateViewMode();
        break;
      case 'inline-style':
        this.updateInlineStyle();
        break;
    }
  }

  updateStyles() {
    const width = this.getAttribute('width') || '100%';
    const colSize = this.getAttribute('col-size') || '2:1';
    const fontSize = this.getAttribute('font-size') || '1.1rem';
    const borderWidth = this.getAttribute('border-width') || '2px';
    
    this.style.width = width;
    this.style.setProperty('--font-size', fontSize);
    this.style.setProperty('--border-width', borderWidth);
    
    const cols = this.parseColSize(colSize);
    this.style.setProperty('--left-width', `${cols.left}%`);
    this.style.setProperty('--right-width', `${cols.right}%`);
  }

  updatePanelVisibility() {
    const visible = this.getAttribute('panel-visible') !== 'false';
    const rightColumn = this.querySelector('.right-column');
    const leftColumn = this.querySelector('.left-column');
    
    if (rightColumn && leftColumn) {
      if (visible) {
        rightColumn.style.display = '';
        leftColumn.classList.remove('full-width');
      } else {
        rightColumn.style.display = 'none';
        leftColumn.classList.add('full-width');
      }
    }
  }

  updateViewMode() {
    const mode = this.getAttribute('view-mode') || 'detail';
    const panel = this.querySelector('.annotation-panel');
    const rightColumn = this.querySelector('.right-column');
    const leftColumn = this.querySelector('.left-column');
    
    if (!panel) return;

    // 清除所有展開的 inline 註解和 hover 註解
    this.querySelectorAll('.inline-note-expanded').forEach(el => el.remove());
    this.querySelectorAll('.inline-note-hover').forEach(el => el.remove());
    this.querySelectorAll('.text-note').forEach(el => el.classList.remove('active', 'expanded'));

    if (mode === 'inline' || mode === 'interlinear') {
      // inline 和 interlinear 模式：隱藏右側面板，左欄全寬
      if (rightColumn) rightColumn.classList.add('hidden');
      if (leftColumn) leftColumn.classList.add('full-width');
      
      panel.innerHTML = `
        <div class="default-message">
          ${mode === 'inline' ? '點擊文章中的標註文字展開註解' : '註解顯示在標註文字下方'}
        </div>
      `;
    } else {
      // detail 和 list 模式：顯示右側面板
      if (rightColumn) rightColumn.classList.remove('hidden');
      if (leftColumn) leftColumn.classList.remove('full-width');
      
      if (mode === 'list') {
        this.renderListView();
      } else {
        // detail 模式
        panel.innerHTML = `
          <div class="default-message">
            點擊文章中的標註文字來查看註解
          </div>
        `;
      }
    }

    this.dispatchEvent(new CustomEvent('viewmode-changed', {
      detail: { mode }
    }));
  }

  updateInlineStyle() {
    const inlineStyle = this.getAttribute('inline-style') || 'compact';
    // 觸發樣式更新
    this.style.setProperty('--inline-style', inlineStyle);
  }

  renderListView() {
    const panel = this.querySelector('.annotation-panel');
    if (!panel) return;

    const noteElements = this.querySelectorAll('.text-note');
    
    if (noteElements.length === 0) {
      panel.innerHTML = `
        <div class="default-message">
          此文章沒有註解
        </div>
      `;
      return;
    }

    let listHTML = '<div class="notes-list">';
    
    noteElements.forEach((element, index) => {
      const noteKey = element.getAttribute('data-note');
      const note = this.notes[noteKey];
      const noteId = `note-item-${this.id || 'default'}-${index}`;
      
      // 為每個 text-note 添加 id 以便跳轉
      element.setAttribute('data-note-index', index);
      
      if (note) {
        listHTML += `
          <div class="note-list-item" data-note-index="${index}">
            <div class="note-list-number">${index + 1}</div>
            <div class="note-list-content">
              <div class="note-list-title">${note.title || element.textContent}</div>
              <div class="note-list-preview">${this.getTextPreview(note.content)}</div>
            </div>
          </div>
        `;
      }
    });
    
    listHTML += '</div>';
    panel.innerHTML = listHTML;

    // 綁定列表項目點擊事件
    panel.querySelectorAll('.note-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const noteIndex = parseInt(item.getAttribute('data-note-index'));
        this.scrollToNote(noteIndex);
      });
    });
  }

  getTextPreview(content, maxLength = 80) {
    // 移除 HTML 標籤
    const text = content.replace(/<[^>]*>/g, '');
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  scrollToNote(noteIndex) {
    const noteElement = this.querySelector(`[data-note-index="${noteIndex}"]`);
    if (!noteElement) return;

    // 清除其他 active 狀態
    this.querySelectorAll('.text-note').forEach(el => el.classList.remove('active'));
    
    // 添加 active 狀態
    noteElement.classList.add('active');
    
    // 滾動到該元素
    noteElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });

    // 高亮列表項目
    const listItems = this.querySelectorAll('.note-list-item');
    listItems.forEach(item => item.classList.remove('highlight'));
    const listItem = this.querySelector(`.note-list-item[data-note-index="${noteIndex}"]`);
    if (listItem) {
      listItem.classList.add('highlight');
      setTimeout(() => listItem.classList.remove('highlight'), 2000);
    }

    // 觸發事件
    this.dispatchEvent(new CustomEvent('note-scrolled', {
      detail: { index: noteIndex }
    }));
  }

  render() {
    // 獲取屬性
    const width = this.getAttribute('width') || '100%';
    const colSize = this.getAttribute('col-size') || '2:1';
    const fontSize = this.getAttribute('font-size') || '1.1rem';
    const borderWidth = this.getAttribute('border-width') || '2px';
    const theme = this.getAttribute('theme') || 'classic';
    const showControls = this.getAttribute('show-controls') !== 'false';
    const panelVisible = this.getAttribute('panel-visible') !== 'false';
    
    // 計算欄位比例
    const cols = this.parseColSize(colSize);
    
    // 應用主題
    this.applyTheme(theme);
    
    // 設定樣式變數
    this.style.width = width;
    this.style.setProperty('--font-size', fontSize);
    this.style.setProperty('--border-width', borderWidth);
    this.style.setProperty('--left-width', `${cols.left}%`);
    this.style.setProperty('--right-width', `${cols.right}%`);
    this.style.display = 'block';
    this.style.margin = '0 auto';
    
    // 創建樣式
    if (!document.getElementById('text-tutor-styles')) {
      const style = document.createElement('style');
      style.id = 'text-tutor-styles';
      style.textContent = this.getStyles();
      document.head.appendChild(style);
    }

    // 創建結構
    const container = document.createElement('div');
    container.className = 'tt-container';
    
    const leftColumn = document.createElement('div');
    leftColumn.className = 'left-column';
    
    const rightColumn = document.createElement('div');
    rightColumn.className = 'right-column';
    if (!panelVisible) {
      rightColumn.style.display = 'none';
    }
    
    const annotationPanel = document.createElement('div');
    annotationPanel.id = `annotation-panel-${this.id || 'default'}`;
    annotationPanel.className = 'annotation-panel';
    annotationPanel.innerHTML = `
      <div class="default-message">
        點擊文章中的標註文字來查看註解
      </div>
    `;
    
    rightColumn.appendChild(annotationPanel);
    
    // 處理 slot 內容
    const contentSlot = this.querySelector('[slot="content"]');
    if (contentSlot) {
      leftColumn.appendChild(contentSlot.cloneNode(true));
      contentSlot.remove();
    }
    
    // 控制面板
    if (showControls) {
      const controlPanel = this.createControlPanel();
      leftColumn.appendChild(controlPanel);
    }
    
    container.appendChild(leftColumn);
    container.appendChild(rightColumn);
    
    this.appendChild(container);
  }

  getStyles() {
    return `
      text-tutor {
        font-family: 'Georgia', serif;
        display: block;
        position: relative;
      }

      text-tutor .tt-container {
        display: flex;
        width: 100%;
        min-height: 400px;
        background-color: var(--body-bg);
      }

      text-tutor .left-column {
        width: var(--left-width);
        background-color: var(--article-bg);
        padding: 30px;
        overflow-y: auto;
        color: var(--article-text);
        border-right: var(--border-width) solid var(--border-color);
      }

      text-tutor .left-column.full-width {
        width: 100%;
        border-right: none;
      }

      text-tutor .right-column {
        width: var(--right-width);
        min-width: 300px;
        background-color: var(--panel-bg);
        color: var(--panel-text);
        padding: 20px;
        overflow-y: auto;
      }

      text-tutor .right-column.hidden {
        display: none;
      }

      text-tutor .title {
        color: var(--article-text);
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 30px;
        border-bottom: 4px solid var(--accent-color);
        padding-bottom: 15px;
      }

      text-tutor .section-title {
        color: var(--article-text);
        font-size: 1.8rem;
        font-weight: 600;
        margin-top: 40px;
        margin-bottom: 20px;
        border-left: 6px solid var(--accent-color);
        padding-left: 20px;
      }

      text-tutor .paragraph {
        font-size: var(--font-size);
        line-height: 1.8;
        margin-bottom: 25px;
        text-align: justify;
        padding: 10px;
        color: var(--article-text);
      }

      text-tutor .text-note {
        background-color: var(--note-bg);
        padding: 2px 4px;
        margin: 0 1px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        position: relative;
        border-radius: 2px;
      }

      text-tutor .text-note:hover {
        background-color: var(--note-hover);
      }

      text-tutor .text-note.active {
        background-color: var(--note-active);
        border-bottom: 2px solid var(--accent-color);
      }

      text-tutor .text-note.has-indicator::after {
        content: '';
        position: absolute;
        top: -4px;
        right: -4px;
        width: 8px;
        height: 8px;
        background-color: var(--indicator-color);
        border-radius: 50%;
        border: 1px solid var(--article-bg);
      }

      text-tutor .highlighted {
        background-color: var(--highlight-color);
        padding: 2px 0;
        cursor: pointer;
      }

      text-tutor .annotation-panel {
        width: 100%;
      }

      text-tutor .annotation-title {
        color: var(--note-title-color);
        font-size: calc(var(--font-size) * 1.36);
        font-weight: bold;
        margin-bottom: 20px;
        border-bottom: 2px solid var(--note-border);
        padding-bottom: 10px;
      }

      text-tutor .annotation-content {
        font-size: calc(var(--font-size) * 0.91);
        line-height: 1.6;
        background-color: var(--note-content-bg);
        padding: 16px;
        border-left: 4px solid var(--note-border);
        border-radius: 4px;
        color: var(--article-text);
      }

      text-tutor .annotation-content h1,
      text-tutor .annotation-content h2,
      text-tutor .annotation-content h3,
      text-tutor .annotation-content h4,
      text-tutor .annotation-content h5,
      text-tutor .annotation-content h6 {
        color: var(--note-title-color);
        margin-top: 20px;
        margin-bottom: 12px;
      }

      text-tutor .annotation-content img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        margin: 12px 0;
      }

      text-tutor .annotation-content ul,
      text-tutor .annotation-content ol {
        margin-left: 20px;
        margin-bottom: 12px;
      }

      text-tutor .default-message {
        color: #bdc3c7;
        font-style: italic;
        text-align: center;
        margin-top: 50px;
      }

      text-tutor .control-panel {
        background-color: var(--panel-bg);
        color: var(--panel-text);
        padding: 0;
        margin-top: 40px;
        width: 100%;
        border-radius: 8px;
        overflow: hidden;
      }

      text-tutor .control-panel-header {
        padding: 20px 30px;
        cursor: pointer;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
      }

      text-tutor .control-panel-header:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      text-tutor .control-panel-content {
        padding: 30px;
        display: block;
      }

      text-tutor .control-panel-content.collapsed {
        display: none;
      }

      text-tutor .collapse-icon {
        font-size: 1.2rem;
        transition: transform 0.3s ease;
      }

      text-tutor .collapse-icon.collapsed {
        transform: rotate(-90deg);
      }

      text-tutor .control-panel h4 {
        margin: 0 0 15px 0;
        font-size: 1.1rem;
        color: var(--note-title-color);
        font-weight: 600;
      }

      text-tutor .control-section {
        margin-bottom: 20px;
      }

      text-tutor .theme-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 10px;
      }

      text-tutor .theme-btn {
        padding: 8px 16px;
        border: 2px solid var(--btn-border);
        background-color: transparent;
        color: var(--btn-text);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        font-weight: 600;
      }

      text-tutor .theme-btn:hover {
        background-color: var(--btn-hover-bg);
        color: var(--btn-hover-text);
        border-color: var(--btn-hover-bg);
      }

      text-tutor .theme-btn.active {
        background-color: var(--btn-hover-bg);
        color: var(--btn-hover-text);
        border-color: var(--btn-hover-bg);
      }

      text-tutor .font-size-controls {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 10px;
      }

      text-tutor .font-btn {
        padding: 8px 16px;
        border: 2px solid var(--btn-border);
        background-color: transparent;
        color: var(--btn-text);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
        min-width: 40px;
        font-weight: 600;
      }

      text-tutor .font-btn:hover {
        background-color: var(--btn-hover-bg);
        color: var(--btn-hover-text);
        border-color: var(--btn-hover-bg);
      }

      text-tutor .font-size-display {
        padding: 8px 16px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        font-weight: bold;
      }

      text-tutor .checkbox-control {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }

      text-tutor .checkbox-control input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      text-tutor .checkbox-control label {
        cursor: pointer;
        user-select: none;
      }

      /* Inline 模式樣式 */
      text-tutor .inline-note-expanded {
        background-color: var(--note-content-bg);
        border-left: 6px solid var(--note-border);
        border-radius: 6px;
        padding: 20px 24px;
        margin: 16px 0;
        margin-left: 20px;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      text-tutor .inline-note-hover {
        background-color: var(--note-content-bg);
        border-left: 6px solid var(--note-border);
        border-radius: 6px;
        padding: 20px 24px;
        margin: 16px 0;
        margin-left: 20px;
        opacity: 0;
        transition: opacity 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      text-tutor .inline-note-hover.visible {
        opacity: 1;
      }

      text-tutor .inline-note-hover.hiding {
        opacity: 0;
      }

      text-tutor .inline-note-title {
        font-size: calc(var(--font-size) * 1.2);
        font-weight: 600;
        color: var(--note-title-color);
        margin-bottom: 12px;
      }

      text-tutor .inline-note-content {
        font-size: calc(var(--font-size) * 0.95);
        line-height: 1.7;
        color: var(--article-text);
      }

      text-tutor .inline-note-content h1,
      text-tutor .inline-note-content h2,
      text-tutor .inline-note-content h3,
      text-tutor .inline-note-content h4,
      text-tutor .inline-note-content h5,
      text-tutor .inline-note-content h6 {
        color: var(--note-title-color);
        margin-top: 16px;
        margin-bottom: 8px;
      }

      text-tutor .inline-note-content ul,
      text-tutor .inline-note-content ol {
        margin-left: 24px;
        margin-bottom: 12px;
      }

      text-tutor .inline-note-content img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        margin: 12px 0;
      }

      text-tutor .text-note.expanded {
        background-color: var(--note-active);
        border-bottom: 2px solid var(--note-border);
        font-weight: 600;
      }

      /* Interlinear 模式樣式 */
      text-tutor .interlinear-wrapper {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        vertical-align: baseline;
        line-height: 1;
      }

      text-tutor .interlinear-text {
        font-size: calc(var(--font-size) * 0.7);
        color: var(--note-title-color);
        line-height: 1.2;
        display: block;
        text-align: center;
        font-weight: 500;
        margin-bottom: 2px;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      text-tutor .interlinear-original {
        display: inline-block;
        line-height: 1.8;
      }

      /* 當在 interlinear 模式時，調整段落行高 */
      text-tutor[view-mode="interlinear"] .paragraph {
        line-height: 2.4;
      }

      text-tutor[view-mode="interlinear"] .text-note {
        background-color: transparent;
        padding: 0;
        margin: 0 2px;
        cursor: default;
      }

      text-tutor[view-mode="interlinear"] .text-note:hover {
        background-color: transparent;
      }

      /* List 模式樣式 */
      text-tutor .notes-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      text-tutor .note-list-item {
        display: flex;
        gap: 12px;
        padding: 16px;
        background-color: var(--note-content-bg);
        border-left: 4px solid var(--note-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      text-tutor .note-list-item:hover {
        background-color: var(--note-hover);
        transform: translateX(4px);
      }

      text-tutor .note-list-item.highlight {
        background-color: var(--note-active);
        border-left-width: 6px;
      }

      text-tutor .note-list-number {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--note-border);
        color: var(--btn-hover-text);
        border-radius: 50%;
        font-weight: bold;
        font-size: 0.9rem;
      }

      text-tutor .note-list-content {
        flex: 1;
        min-width: 0;
      }

      text-tutor .note-list-title {
        font-weight: 600;
        color: var(--note-title-color);
        margin-bottom: 6px;
        font-size: 1.05rem;
      }

      text-tutor .note-list-preview {
        color: var(--article-text);
        font-size: 0.9rem;
        line-height: 1.5;
        opacity: 0.85;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    `;
  }

  createControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'control-panel';
    
    const showIndicators = this.getAttribute('show-indicators') !== 'false';
    const enableHighlight = this.getAttribute('enable-highlight') !== 'false';
    
    panel.innerHTML = `
      <div class="control-panel-header">
        <span>控制面板</span>
        <span class="collapse-icon">▼</span>
      </div>
      <div class="control-panel-content">
        <div class="control-section">
          <h4>主題配色</h4>
          <div class="theme-buttons">
            <button class="theme-btn" data-theme="shell">Shell</button>
            <button class="theme-btn" data-theme="lavender">Lavender</button>
            <button class="theme-btn" data-theme="special">Special</button>
            <button class="theme-btn" data-theme="warning">Warning</button>
            <button class="theme-btn" data-theme="salmon">Salmon</button>
            <button class="theme-btn" data-theme="attention">Attention</button>
            <button class="theme-btn" data-theme="sky">Sky</button>
            <button class="theme-btn" data-theme="safe">Safe</button>
            <button class="theme-btn" data-theme="brown">Brown</button>
            <button class="theme-btn" data-theme="info">Info</button>
            <button class="theme-btn" data-theme="pink">Pink</button>
            <button class="theme-btn" data-theme="orange">Orange</button>
            <button class="theme-btn" data-theme="background">Background</button>
            <button class="theme-btn" data-theme="fill">Fill</button>
          </div>
        </div>

        <div class="control-section">
          <h4>字體大小</h4>
          <div class="font-size-controls">
            <button class="font-btn" data-action="decrease">-</button>
            <span class="font-size-display">${this.getAttribute('font-size') || '1.1rem'}</span>
            <button class="font-btn" data-action="increase">+</button>
            <button class="font-btn" data-action="reset">重置</button>
          </div>
        </div>

        <div class="control-section">
          <h4>顯示選項</h4>
          <div class="checkbox-control">
            <input type="checkbox" id="show-indicators-${this.id || 'default'}" ${showIndicators ? 'checked' : ''}>
            <label for="show-indicators-${this.id || 'default'}">顯示註解指示器</label>
          </div>
          <div class="checkbox-control">
            <input type="checkbox" id="enable-highlight-${this.id || 'default'}" ${enableHighlight ? 'checked' : ''}>
            <label for="enable-highlight-${this.id || 'default'}">啟用文字標示</label>
          </div>
          <div class="checkbox-control">
            <input type="checkbox" id="panel-visible-${this.id || 'default'}" ${this.getAttribute('panel-visible') !== 'false' ? 'checked' : ''}>
            <label for="panel-visible-${this.id || 'default'}">顯示註解面板</label>
          </div>
        </div>

        <div class="control-section">
          <h4>視圖模式</h4>
          <div class="theme-buttons">
            <button class="theme-btn view-mode-btn" data-mode="detail">詳細模式</button>
            <button class="theme-btn view-mode-btn" data-mode="list">列表模式</button>
            <button class="theme-btn view-mode-btn" data-mode="inline">展開模式</button>
            <button class="theme-btn view-mode-btn" data-mode="interlinear">雙行模式</button>
          </div>
        </div>
      </div>
    `;
    
    return panel;
  }

  setupEventListeners() {
    // 控制面板收合
    const header = this.querySelector('.control-panel-header');
    if (header) {
      header.addEventListener('click', () => {
        const content = this.querySelector('.control-panel-content');
        const icon = this.querySelector('.collapse-icon');
        content.classList.toggle('collapsed');
        icon.classList.toggle('collapsed');
      });
    }

    // 主題切換
    this.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        this.setTheme(theme);
        
        // 更新按鈕狀態
        this.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 字體大小控制
    this.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const display = this.querySelector('.font-size-display');
        const current = parseFloat(this.getAttribute('font-size') || '1.1');
        
        let newSize;
        if (action === 'increase') {
          newSize = `${(current + 0.1).toFixed(1)}rem`;
        } else if (action === 'decrease') {
          newSize = `${Math.max(0.8, current - 0.1).toFixed(1)}rem`;
        } else if (action === 'reset') {
          newSize = '1.1rem';
        }
        
        if (newSize) {
          this.setFontSize(newSize);
          display.textContent = newSize;
        }
      });
    });

    // 指示器切換
    const indicatorCheckbox = this.querySelector(`#show-indicators-${this.id || 'default'}`);
    if (indicatorCheckbox) {
      indicatorCheckbox.addEventListener('change', (e) => {
        this.showIndicators(e.target.checked);
      });
    }

    // 標示功能切換
    const highlightCheckbox = this.querySelector(`#enable-highlight-${this.id || 'default'}`);
    if (highlightCheckbox) {
      highlightCheckbox.addEventListener('change', (e) => {
        this.setAttribute('enable-highlight', e.target.checked);
      });
    }

    // 面板顯示切換
    const panelCheckbox = this.querySelector(`#panel-visible-${this.id || 'default'}`);
    if (panelCheckbox) {
      panelCheckbox.addEventListener('change', (e) => {
        this.setAttribute('panel-visible', e.target.checked);
      });
    }

    // 視圖模式切換
    this.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.setViewMode(mode);
        
        // 更新按鈕狀態
        this.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 文字標示功能
    if (this.getAttribute('enable-highlight') !== 'false') {
      this.setupHighlightFeature();
    }
  }

  setupHighlightFeature() {
    this.addEventListener('mouseup', (e) => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 0 && e.target.closest('.left-column')) {
        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer.parentElement;
        
        if (parentElement && parentElement.classList.contains('highlighted')) {
          // 移除標示
          const textNode = document.createTextNode(parentElement.textContent);
          parentElement.parentNode.replaceChild(textNode, parentElement);
          
          this.dispatchEvent(new CustomEvent('highlight-removed', {
            detail: { text: selectedText }
          }));
        } else {
          // 添加標示
          if (range.startContainer === range.endContainer && 
              range.startContainer.nodeType === Node.TEXT_NODE) {
            try {
              const span = document.createElement('span');
              span.className = 'highlighted';
              range.surroundContents(span);
              
              span.addEventListener('click', (e) => {
                e.stopPropagation();
                const textNode = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(textNode, span);
              });
              
              this.dispatchEvent(new CustomEvent('text-highlighted', {
                detail: { text: selectedText }
              }));
            } catch (e) {
              console.log('無法標示跨元素的選取內容');
            }
          }
        }
        
        selection.removeAllRanges();
      }
    });
  }

  loadNotes() {
    // 從 JSON slot 載入註解
    const jsonSlot = this.querySelector('script[slot="annotations"]');
    if (jsonSlot) {
      try {
        const data = JSON.parse(jsonSlot.textContent);
        Object.keys(data).forEach(key => {
          this.notes[key] = data[key];
        });
        jsonSlot.remove();
      } catch (e) {
        console.error('註解 JSON 解析失敗:', e);
      }
    }

    // 處理所有 text-note 元素
    this.querySelectorAll('.text-note').forEach(element => {
      const noteKey = element.getAttribute('data-note');
      if (!noteKey) return;

      // 檢查是否為元素 ID
      const sourceElement = document.getElementById(noteKey);
      if (sourceElement) {
        // 複製 HTML 內容
        this.notes[noteKey] = {
          title: element.textContent,
          content: sourceElement.innerHTML
        };
        // 隱藏原始元素（如果還沒隱藏）
        sourceElement.style.display = 'none';
      } else if (!this.notes[noteKey]) {
        // 純文字註解
        this.notes[noteKey] = {
          title: element.textContent,
          content: noteKey
        };
      }
      
      // Interlinear 模式：直接添加註解文字
      const viewMode = this.getAttribute('view-mode');
      if (viewMode === 'interlinear') {
        this.applyInterlinearNote(element);
      }
    });

    this.updateIndicators();
  }

  applyInterlinearNote(element) {
    const noteKey = element.getAttribute('data-note');
    const note = this.notes[noteKey];
    
    if (!note || element.querySelector('.interlinear-text')) return;
    
    // 取得註解文字（移除 HTML 標籤）
    const noteText = this.getTextPreview(note.content, 60);
    
    // 創建 interlinear 註解元素
    const interlinearSpan = document.createElement('span');
    interlinearSpan.className = 'interlinear-text';
    interlinearSpan.textContent = noteText;
    
    // 將原始文字包裝
    const originalText = element.textContent;
    element.textContent = '';
    
    const wrapper = document.createElement('span');
    wrapper.className = 'interlinear-wrapper';
    
    const originalSpan = document.createElement('span');
    originalSpan.className = 'interlinear-original';
    originalSpan.textContent = originalText;
    
    wrapper.appendChild(interlinearSpan);
    wrapper.appendChild(originalSpan);
    element.appendChild(wrapper);
  }

  bindNoteEvents() {
    const viewMode = this.getAttribute('view-mode') || 'detail';
    
    this.querySelectorAll('.text-note').forEach(element => {
      if (viewMode === 'inline') {
        // Inline 模式：使用 hover 事件
        element.addEventListener('mouseenter', (e) => {
          this.showInlineNote(element);
        });
        
        element.addEventListener('mouseleave', (e) => {
          // 檢查滑鼠是否移動到註解框內
          const relatedTarget = e.relatedTarget;
          const inlineNote = element.parentElement.querySelector('.inline-note-hover');
          if (inlineNote && inlineNote.contains(relatedTarget)) {
            return; // 滑鼠在註解框內，不隱藏
          }
          this.hideInlineNote(element);
        });
      } else {
        // 其他模式：使用點擊事件
        element.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleNoteClick(element);
        });
      }
    });
  }

  handleNoteClick(element) {
    const noteKey = element.getAttribute('data-note');
    const note = this.notes[noteKey];
    
    if (!note) return;

    const viewMode = this.getAttribute('view-mode') || 'detail';
    
    if (viewMode === 'inline') {
      // Inline 模式：不處理點擊（改用 hover）
      return;
    } else if (viewMode === 'interlinear') {
      // Interlinear 模式：不做任何事（註解已經顯示）
      return;
    } else if (viewMode === 'list') {
      // List 模式：滾動到列表項並高亮
      this.querySelectorAll('.text-note').forEach(el => el.classList.remove('active'));
      element.classList.add('active');
      this.currentActiveNote = element;
      
      const noteIndex = parseInt(element.getAttribute('data-note-index'));
      const listItem = this.querySelector(`.note-list-item[data-note-index="${noteIndex}"]`);
      
      if (listItem) {
        listItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // 高亮效果
        const listItems = this.querySelectorAll('.note-list-item');
        listItems.forEach(item => item.classList.remove('highlight'));
        listItem.classList.add('highlight');
        setTimeout(() => listItem.classList.remove('highlight'), 2000);
      }
    } else {
      // Detail 模式：更新右側面板顯示詳細內容
      this.querySelectorAll('.text-note').forEach(el => el.classList.remove('active'));
      element.classList.add('active');
      this.currentActiveNote = element;
      
      const panel = this.querySelector('.annotation-panel');
      if (panel) {
        panel.innerHTML = `
          <div class="annotation-title">${note.title || element.textContent}</div>
          <div class="annotation-content">${note.content}</div>
        `;
      }
    }

    this.dispatchEvent(new CustomEvent('note-click', {
      detail: { key: noteKey, note: note }
    }));
  }

  toggleInlineNote(element, note) {
    const isExpanded = element.classList.contains('expanded');
    
    if (isExpanded) {
      // 摺疊
      const expandedNote = element.parentElement.querySelector('.inline-note-expanded');
      if (expandedNote) {
        expandedNote.style.maxHeight = expandedNote.scrollHeight + 'px';
        setTimeout(() => {
          expandedNote.style.maxHeight = '0';
        }, 10);
        setTimeout(() => {
          expandedNote.remove();
        }, 300);
      }
      element.classList.remove('expanded', 'active');
    } else {
      // 展開：先摺疊其他同段落的註解
      const paragraph = element.closest('.paragraph, .section-title, .title');
      if (paragraph) {
        const existingExpanded = paragraph.nextElementSibling;
        if (existingExpanded && existingExpanded.classList.contains('inline-note-expanded')) {
          existingExpanded.style.maxHeight = '0';
          setTimeout(() => existingExpanded.remove(), 300);
        }
        paragraph.querySelectorAll('.text-note.expanded').forEach(otherNote => {
          otherNote.classList.remove('expanded', 'active');
        });
      }
      
      // 展開新註解
      element.classList.add('expanded', 'active');
      
      const expandedDiv = document.createElement('div');
      expandedDiv.className = 'inline-note-expanded';
      expandedDiv.innerHTML = `
        <div class="inline-note-title">💡 ${note.title || element.textContent}</div>
        <div class="inline-note-content">${note.content}</div>
      `;
      
      // 插入到段落後面
      const targetParagraph = element.closest('.paragraph, .section-title, .title');
      if (targetParagraph) {
        targetParagraph.insertAdjacentElement('afterend', expandedDiv);
        
        // 展開動畫
        expandedDiv.style.maxHeight = '0';
        setTimeout(() => {
          expandedDiv.style.maxHeight = expandedDiv.scrollHeight + 'px';
        }, 10);
        setTimeout(() => {
          expandedDiv.style.maxHeight = 'none';
        }, 300);
      }
    }
  }

  showInlineNote(element) {
    const noteKey = element.getAttribute('data-note');
    const note = this.notes[noteKey];
    if (!note) return;

    // 移除其他 hover 註解
    this.querySelectorAll('.inline-note-hover').forEach(el => el.remove());
    
    // 創建 hover 註解框
    const hoverDiv = document.createElement('div');
    hoverDiv.className = 'inline-note-hover';
    hoverDiv.innerHTML = `
      <div class="inline-note-title">💡 ${note.title || element.textContent}</div>
      <div class="inline-note-content">${note.content}</div>
    `;
    
    // 當滑鼠離開註解框時隱藏
    hoverDiv.addEventListener('mouseleave', () => {
      hoverDiv.classList.add('hiding');
      setTimeout(() => hoverDiv.remove(), 200);
    });
    
    // 插入到段落後面
    const targetParagraph = element.closest('.paragraph, .section-title, .title');
    if (targetParagraph) {
      targetParagraph.insertAdjacentElement('afterend', hoverDiv);
      
      // 淡入動畫
      setTimeout(() => {
        hoverDiv.classList.add('visible');
      }, 10);
    }
    
    element.classList.add('active');
  }

  hideInlineNote(element) {
    // 延遲隱藏，給使用者時間移動到註解框
    setTimeout(() => {
      const hoverNote = element.parentElement.querySelector('.inline-note-hover');
      if (hoverNote && !hoverNote.matches(':hover')) {
        hoverNote.classList.add('hiding');
        setTimeout(() => hoverNote.remove(), 200);
      }
      element.classList.remove('active');
    }, 100);
  }

  updateIndicators() {
    const showIndicators = this.getAttribute('show-indicators') !== 'false';
    
    this.querySelectorAll('.text-note').forEach(element => {
      if (showIndicators) {
        element.classList.add('has-indicator');
      } else {
        element.classList.remove('has-indicator');
      }
    });
  }

  // === 公開 API ===
  
  addNote(key, content) {
    this.notes[key] = {
      title: key,
      content: content
    };
    this.updateIndicators();
  }

  addNoteFromElement(key, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      this.notes[key] = {
        title: key,
        content: element.innerHTML
      };
      element.style.display = 'none';
      this.updateIndicators();
    }
  }

  removeNote(key) {
    delete this.notes[key];
    this.updateIndicators();
  }

  getNote(key) {
    return this.notes[key];
  }

  getAllNotes() {
    return { ...this.notes };
  }

  exportNotes() {
    return JSON.stringify(this.notes, null, 2);
  }

  importNotes(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      this.notes = { ...data };
      this.updateIndicators();
    } catch (e) {
      console.error('匯入註解失敗:', e);
    }
  }

  clearAllNotes() {
    this.notes = {};
    this.updateIndicators();
  }

  setTheme(theme) {
    this.setAttribute('theme', theme);
  }

  setFontSize(size) {
    this.setAttribute('font-size', size);
  }

  setWidth(width) {
    this.setAttribute('width', width);
  }

  setColSize(colSize) {
    this.setAttribute('col-size', colSize);
    this.dispatchEvent(new CustomEvent('colsize-changed', {
      detail: { colSize }
    }));
  }

  setBorderWidth(width) {
    this.setAttribute('border-width', width);
  }

  showPanel() {
    this.setAttribute('panel-visible', 'true');
    this.dispatchEvent(new CustomEvent('panel-toggled', {
      detail: { visible: true }
    }));
  }

  hidePanel() {
    this.setAttribute('panel-visible', 'false');
    this.dispatchEvent(new CustomEvent('panel-toggled', {
      detail: { visible: false }
    }));
  }

  togglePanel() {
    const visible = this.getAttribute('panel-visible') !== 'false';
    this.setAttribute('panel-visible', visible ? 'false' : 'true');
    this.dispatchEvent(new CustomEvent('panel-toggled', {
      detail: { visible: !visible }
    }));
  }

  showIndicators(show) {
    this.setAttribute('show-indicators', show);
    this.updateIndicators();
  }

  showControls(show) {
    this.setAttribute('show-controls', show);
  }

  setViewMode(mode) {
    this.setAttribute('view-mode', mode);
  }

  getViewMode() {
    return this.getAttribute('view-mode') || 'detail';
  }
}

customElements.define('text-tutor', TextTutor);

// ========== 字體大小控制元件 ==========
class FontSizeControl extends HTMLElement {
    constructor() {
        super();
        this.targetId = null;
        this.step = 0.1; // 預設調整幅度（rem）
        this.currentSize = null;
    }

    connectedCallback() {
        // 取得屬性
        this.targetId = this.getAttribute('target-id');
        const stepAttr = this.getAttribute('step');
        if (stepAttr) {
            this.step = parseFloat(stepAttr);
        }

        // 渲染元件
        this.render();

        // 綁定事件
        this.querySelector('.font-decrease').addEventListener('click', () => this.decreaseFont());
        this.querySelector('.font-increase').addEventListener('click', () => this.increaseFont());

        // 初始化目標元素的字體大小
        this.initTargetSize();
    }

    initTargetSize() {
        const target = document.getElementById(this.targetId);
        if (target) {
            const computed = window.getComputedStyle(target);
            const currentSize = computed.fontSize;
            // 轉換為 rem
            const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
            this.currentSize = parseFloat(currentSize) / rootFontSize;
        }
    }

    decreaseFont() {
        const target = document.getElementById(this.targetId);
        if (!target) {
            console.error('找不到目標元素：' + this.targetId);
            return;
        }

        if (this.currentSize === null) {
            this.initTargetSize();
        }

        this.currentSize -= this.step;
        
        // 設定最小值為 0.5rem
        if (this.currentSize < 0.5) {
            this.currentSize = 0.5;
        }

        target.style.fontSize = this.currentSize + 'rem';
    }

    increaseFont() {
        const target = document.getElementById(this.targetId);
        if (!target) {
            console.error('找不到目標元素：' + this.targetId);
            return;
        }

        if (this.currentSize === null) {
            this.initTargetSize();
        }

        this.currentSize += this.step;
        
        // 設定最大值為 3rem
        if (this.currentSize > 3) {
            this.currentSize = 3;
        }

        target.style.fontSize = this.currentSize + 'rem';
    }

    render() {
        this.innerHTML = `
            <style>
                .font-size-control-wrapper {
                    display: inline-flex;
                    gap: 4px;
                    align-items: center;
                }

                .font-control-btn {
                    width: 24px;
                    height: 24px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.875rem;
                    font-weight: bold;
                    transition: all 0.2s ease;
                    padding: 0px;
                }

                .font-control-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .font-control-btn:active {
                    transform: scale(0.95);
                }

                .font-decrease {
                    background-color: #d98079;
                    color: #0c0d0c;
                }

                .font-decrease:hover {
                    background-color: #e59089;
                }

                .font-increase {
                    background-color: #04b5a3;
                    color: #0c0d0c;
                }

                .font-increase:hover {
                    background-color: #05c5b3;
                }

                .font-control-icon {
                    font-size: 1rem;
                    line-height: 1;
                }
            </style>
            <div class="font-size-control-wrapper">
                <button class="font-control-btn font-decrease" title="縮小字體">
                    <span class="font-control-icon">−</span>
                </button>
                <button class="font-control-btn font-increase" title="放大字體">
                    <span class="font-control-icon">+</span>
                </button>
            </div>
        `;
    }
}

// ========== 深色/日間模式切換元件 ==========
class ThemeToggle extends HTMLElement {
    constructor() {
        super();
        this.targetId = null;
        this.isDark = true; // 預設為深色模式
        this.darkTheme = {
            background: '#0c0d0c',
            text: '#c6c7bd',
            cardBg: '#333333'
        };
        this.lightTheme = {
            background: '#f5f5f0',
            text: '#2c2c2c',
            cardBg: '#ffffff'
        };
    }

    connectedCallback() {
        // 取得屬性
        this.targetId = this.getAttribute('target-id');

        // 從 localStorage 讀取使用者偏好
        const savedTheme = localStorage.getItem('theme-preference');
        if (savedTheme === 'light') {
            this.isDark = false;
        }

        // 渲染元件
        this.render();

        // 綁定事件
        this.querySelector('.theme-toggle-btn').addEventListener('click', () => this.toggleTheme());

        // 初始化主題
        this.applyTheme();
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        this.applyTheme();
        this.updateIcon();

        // 儲存使用者偏好
        localStorage.setItem('theme-preference', this.isDark ? 'dark' : 'light');
    }

    applyTheme() {
        const theme = this.isDark ? this.darkTheme : this.lightTheme;
        
        // 更新 body 背景和文字顏色
        document.body.style.backgroundColor = theme.background;
        document.body.style.color = theme.text;

        // 更新目標元素內的卡片背景
        if (this.targetId) {
            const target = document.getElementById(this.targetId);
            if (target) {
                const cards = target.querySelectorAll('div[style*="background-color"]');
                cards.forEach(card => {
                    if (card.style.backgroundColor) {
                        card.style.backgroundColor = theme.cardBg;
                    }
                });
            }
        }
    }

    updateIcon() {
        const icon = this.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = this.isDark ? '☀' : '🌙';
        }
        const btn = this.querySelector('.theme-toggle-btn');
        if (btn) {
            btn.title = this.isDark ? '切換至日間模式' : '切換至深色模式';
        }
    }

    render() {
        this.innerHTML = `
            <style>
                .theme-toggle-wrapper {
                    display: inline-flex;
                    align-items: center;
                }

                .theme-toggle-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    padding: 0px;
                    background-color: #b9c971;
                    color: #0c0d0c;
                }

                .theme-toggle-btn:hover {
                    transform: rotate(180deg) scale(1.1);
                    box-shadow: 0 2px 12px rgba(185, 201, 113, 0.4);
                }

                .theme-toggle-btn:active {
                    transform: rotate(180deg) scale(0.95);
                }

                .theme-icon {
                    font-size: 1.125rem;
                    line-height: 1;
                }
            </style>
            <div class="theme-toggle-wrapper">
                <button class="theme-toggle-btn" title="${this.isDark ? '切換至日間模式' : '切換至深色模式'}">
                    <span class="theme-icon">${this.isDark ? '☀' : '🌙'}</span>
                </button>
            </div>
        `;
    }
}

customElements.define('font-size-control', FontSizeControl);
customElements.define('theme-toggle', ThemeToggle);
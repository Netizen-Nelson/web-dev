// ========== Grid Table Web Component ==========
// 使用方式：
// <grid-table theme="safe">
//   <grid-table-group title="基本設定">
//     <grid-table-item type="text" label="名稱" name="username"></grid-table-item>
//   </grid-table-group>
// </grid-table>

// ========== 預設常數配置 ==========
const GRID_TABLE_DEFAULTS = {
    // 尺寸常數
    VERTICAL_LABEL_WIDTH: 40,
    DEFAULT_RATIO: [3, 7],
    GROUP_HEADER_HEIGHT: 32,
    TEXTAREA_ROWS_DEFAULT: 9,
    
    // 間距常數
    CELL_PADDING_V: 8,
    CELL_PADDING_H: 12,
    GROUP_MARGIN_BOTTOM: 16,
    GROUP_SPACING: 12,
    
    // 邊框常數
    BORDER_WIDTH: 1,
    BORDER_STYLE: 'solid',
    INPUT_BORDER_WIDTH: 1,
    INPUT_BORDER_STYLE: 'solid',
    
    // 字體常數
    LABEL_FONT_SIZE: 0.875,
    INPUT_FONT_SIZE: 0.875,
    GROUP_TITLE_FONT_SIZE: 1,
    VERTICAL_LABEL_FONT_SIZE: 0.875,
    
    // 圓角常數
    INPUT_BORDER_RADIUS: 4,
    GROUP_BORDER_RADIUS: 6,
    
    // 折疊圖示常數
    TOGGLE_ICON_SIZE: 8,
    TOGGLE_ICON_MARGIN: 8,
    
    // 預設主題
    THEMES: {
        default: {
            // 基礎色
            bgBase: '#0c0d0c',
            bgArea: '#333333',
            textMain: '#c6c7bd',
            
            // 功能色
            lavender: '#C3A5E5',
            special: '#b9c971',
            warning: '#d98079',
            salmon: '#E5C3B3',
            attention: '#E5E5A6',
            sky: '#04b5a3',
            safe: '#73d192',
            brown: '#d9c5b2',
            info: '#6495e3',
            pink: '#FFB3D9',
            orange: '#f69653',
            
            // 衍生色
            borderColor: '#555555',
            borderColorLight: '#444444',
            groupHeaderBg: '#2a2a2a',
            inputBg: '#333333',
            inputBorder: '#555555',
            inputFocus: '#b9c971'
        },
        
        // 明亮主題：經典白底
        'classic-daytime': {
            bgBase: '#f5f5f5',
            bgArea: '#ffffff',
            textMain: '#2c2c2c',
            
            lavender: '#9b6fd9',
            special: '#7a9d3f',
            warning: '#c94f47',
            salmon: '#d4a68f',
            attention: '#d9d946',
            sky: '#0389a0',
            safe: '#4fb56e',
            brown: '#b89670',
            info: '#4a7bc8',
            pink: '#e889c2',
            orange: '#e67a3a',
            
            borderColor: '#d0d0d0',
            borderColorLight: '#e5e5e5',
            groupHeaderBg: '#f8f8f8',
            inputBg: '#ffffff',
            inputBorder: '#c0c0c0',
            inputFocus: '#7a9d3f'
        },
        
        // 明亮主題：淡紫色調
        'lavender-daytime': {
            bgBase: '#f8f6fb',
            bgArea: '#ffffff',
            textMain: '#3d3347',
            
            lavender: '#9b6fd9',
            special: '#8b7ea8',
            warning: '#d66b6b',
            salmon: '#d4a68f',
            attention: '#d9d946',
            sky: '#6ba8d9',
            safe: '#6bc98d',
            brown: '#b89670',
            info: '#6b8bd9',
            pink: '#d96bb8',
            orange: '#d9996b',
            
            borderColor: '#d8d0e3',
            borderColorLight: '#ebe6f2',
            groupHeaderBg: '#f3eff8',
            inputBg: '#ffffff',
            inputBorder: '#c8bdd9',
            inputFocus: '#9b6fd9'
        },
        
        // 明亮主題：天空藍調
        'sky-daytime': {
            bgBase: '#f0f7fb',
            bgArea: '#ffffff',
            textMain: '#2d4052',
            
            lavender: '#8ba3d9',
            special: '#5b9abd',
            warning: '#d97a6b',
            salmon: '#d4a68f',
            attention: '#d9ce6b',
            sky: '#3d9cbd',
            safe: '#5bc98d',
            brown: '#b89670',
            info: '#4a8bd9',
            pink: '#d96bb8',
            orange: '#d9996b',
            
            borderColor: '#c5dce8',
            borderColorLight: '#e0eef5',
            groupHeaderBg: '#e8f4f9',
            inputBg: '#ffffff',
            inputBorder: '#b5d4e5',
            inputFocus: '#3d9cbd'
        },
        
        // 明亮主題：自然綠色調
        'nature-daytime': {
            bgBase: '#f5faf6',
            bgArea: '#ffffff',
            textMain: '#2d4033',
            
            lavender: '#9ba8d9',
            special: '#6b9d5b',
            warning: '#d97a6b',
            salmon: '#d4a68f',
            attention: '#d9ce6b',
            sky: '#5bacbd',
            safe: '#5bc98d',
            brown: '#a88f6b',
            info: '#5b8bd9',
            pink: '#d96bb8',
            orange: '#d9996b',
            
            borderColor: '#cfe5d3',
            borderColorLight: '#e5f2e8',
            groupHeaderBg: '#edf7ef',
            inputBg: '#ffffff',
            inputBorder: '#bfd9c5',
            inputFocus: '#6b9d5b'
        },
        
        // 明亮主題：暖色調
        'warm-daytime': {
            bgBase: '#faf7f3',
            bgArea: '#ffffff',
            textMain: '#3d362d',
            
            lavender: '#b89dd9',
            special: '#b89d5b',
            warning: '#d9756b',
            salmon: '#d9a68f',
            attention: '#d9c96b',
            sky: '#6bacbd',
            safe: '#7bc98d',
            brown: '#b8936b',
            info: '#6b9bd9',
            pink: '#d98bb8',
            orange: '#d9996b',
            
            borderColor: '#e5ddd0',
            borderColorLight: '#f0ebe3',
            groupHeaderBg: '#f5f0e8',
            inputBg: '#ffffff',
            inputBorder: '#d9ccb5',
            inputFocus: '#b89d5b'
        },
        
        // 明亮主題：柔和粉色
        'soft-pink-daytime': {
            bgBase: '#fdf8fa',
            bgArea: '#ffffff',
            textMain: '#3d2d35',
            
            lavender: '#d99bc8',
            special: '#d9a38f',
            warning: '#d96b6b',
            salmon: '#d9b89d',
            attention: '#d9c98f',
            sky: '#8fb8d9',
            safe: '#8fc9a3',
            brown: '#b8936b',
            info: '#9bb8d9',
            pink: '#d98bb8',
            orange: '#d9a68f',
            
            borderColor: '#f0d9e3',
            borderColorLight: '#f7ebf0',
            groupHeaderBg: '#faf0f5',
            inputBg: '#ffffff',
            inputBorder: '#e8ccd9',
            inputFocus: '#d99bc8'
        }
    }
};

// 全局配置
let GRID_TABLE_GLOBAL_CONFIG = JSON.parse(JSON.stringify(GRID_TABLE_DEFAULTS));

// ========== 基礎樣式注入 ==========
const GRID_TABLE_BASE_STYLES = `
    grid-table {
        display: block;
        width: 100%;
    }
    
    grid-table-group,
    grid-table-item {
        display: none;
    }
    
    .grid-table-container {
        width: 100%;
    }
    
    .grid-group {
        overflow: hidden;
    }
    
    .grid-group-header {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
    }
    
    .grid-group-header:hover {
        background-color: #353535;
    }
    
    .toggle-icon {
        width: 0;
        height: 0;
        transition: transform 0.2s ease;
    }
    
    .toggle-icon.expanded {
        transform: rotate(0deg);
    }
    
    .toggle-icon.collapsed {
        transform: rotate(0deg);
    }
    
    .group-header-icon {
        margin-right: 8px;
    }
    
    .group-title {
        font-weight: 600;
    }
    
    .grid-group-body {
        overflow: hidden;
        transition: max-height 0.3s ease;
    }
    
    .grid-group-body.collapsed {
        max-height: 0 !important;
        border: none !important;
    }
    
    .grid-row-container {
        display: flex;
        position: relative;
    }
    
    .vertical-label {
        display: flex;
        align-items: center;
        justify-content: center;
        writing-mode: vertical-rl;
        text-orientation: upright;
        letter-spacing: 0.1em;
    }
    
    .grid-rows {
        flex: 1;
    }
    
    .grid-row {
        display: flex;
    }
    
    .grid-row:last-child {
        border-bottom: none !important;
    }
    
    .grid-cell-label {
        display: flex;
        align-items: center;
    }
    
    .label-icon {
        margin-right: 6px;
    }
    
    .grid-cell-input {
        flex: 1;
        display: flex;
        align-items: center;
    }
    
    .input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        position: relative;
    }
    
    .input-left-icon,
    .input-right-icon {
        position: absolute;
        pointer-events: none;
    }
    
    .input-left-icon {
        left: 10px;
    }
    
    .input-right-icon {
        right: 10px;
    }
    
    .grid-input,
    .grid-textarea {
        width: 100%;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
    }
    
    .grid-input.has-left-icon {
        padding-left: 32px;
    }
    
    .grid-input.has-right-icon {
        padding-right: 32px;
    }
    
    .grid-input.has-menu-button {
        padding-right: 40px;
    }
    
    .grid-menu-button {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        transition: background-color 0.2s;
    }
    
    .grid-menu-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }
    
    .grid-menu-button i {
        font-size: 1rem;
        pointer-events: none;
    }
    
    .grid-textarea {
        resize: vertical;
        min-height: 60px;
    }
    
    .grid-input::placeholder,
    .grid-textarea::placeholder {
        color: #777777;
    }
    
    .grid-input:read-only,
    .grid-textarea:read-only {
        cursor: not-allowed;
        opacity: 0.7;
    }
`;

// 注入基礎樣式
if (!document.getElementById('grid-table-base-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'grid-table-base-styles';
    styleElement.textContent = GRID_TABLE_BASE_STYLES;
    document.head.appendChild(styleElement);
}

// ========== Grid Table Item 元件 ==========
class GridTableItem extends HTMLElement {
    constructor() {
        super();
    }
    
    getConfig() {
        return {
            type: this.getAttribute('type') || 'text',
            label: this.getAttribute('label') || '',
            name: this.getAttribute('name') || '',
            placeholder: this.getAttribute('placeholder') || '',
            readonly: this.hasAttribute('readonly'),
            rows: parseInt(this.getAttribute('rows')) || null,
            labelIcon: this.getAttribute('label-icon') || null,
            leftIcon: this.getAttribute('left-icon') || null,
            rightIcon: this.getAttribute('right-icon') || null,
            rightIconColor: this.getAttribute('right-icon-color') || null,
            menuButton: this.hasAttribute('menu-button'),
            menuCallback: this.getAttribute('menu-callback') || null,
            menuClicked: this.getAttribute('menu-clicked') || null,
            menuSource: this.getAttribute('menu-source') || null
        };
    }
}

// ========== Grid Table Group 元件 ==========
class GridTableGroup extends HTMLElement {
    constructor() {
        super();
    }
    
    getConfig() {
        const items = Array.from(this.querySelectorAll('grid-table-item')).map(item => item.getConfig());
        
        return {
            type: 'group',
            title: this.getAttribute('title') || '未命名群組',
            collapsible: !this.hasAttribute('no-collapse'),
            collapsed: this.hasAttribute('collapsed'),
            verticalLabel: this.getAttribute('vertical-label') || null,
            verticalLabelColor: this.getAttribute('vertical-label-color') || null,
            icon: this.getAttribute('icon') || null,
            autoNumber: this.hasAttribute('auto-number'),
            items: items
        };
    }
}

// ========== Grid Table 主元件 ==========
class GridTable extends HTMLElement {
    constructor() {
        super();
        this.config = {};
        this.data = [];
        this.fields = new Map();
        this.groups = new Map();
        this.styleElement = null;
    }

    connectedCallback() {
        setTimeout(() => {
            this.init();
        }, 0);
    }

    init() {
        if (this.classList.contains('grid-table-initialized')) {
            return;
        }

        // 讀取群組資料
        const groups = Array.from(this.querySelectorAll(':scope > grid-table-group'));
        this.data = groups.map(group => group.getConfig());
        
        // 讀取配置
        this.config = this.getConfigFromAttributes();
        
        // 渲染
        this.render();
        this.classList.add('grid-table-initialized');
    }

    getConfigFromAttributes() {
        let config = JSON.parse(JSON.stringify(GRID_TABLE_GLOBAL_CONFIG));
        
        // 讀取 theme
        const themeName = this.getAttribute('theme');
        if (themeName) {
            if (config.THEMES[themeName]) {
                config.THEME = config.THEMES[themeName];
            } else {
                // 嘗試使用主題中的顏色
                const themeColor = config.THEMES.default[themeName];
                if (themeColor) {
                    config.THEME = { ...config.THEMES.default, inputFocus: themeColor };
                }
            }
        } else {
            config.THEME = config.THEMES.default;
        }
        
        // 讀取比例設定
        if (this.hasAttribute('ratio')) {
            const ratio = this.getAttribute('ratio').split(':').map(Number);
            if (ratio.length === 2) {
                config.DEFAULT_RATIO = ratio;
            }
        }
        
        // 讀取尺寸設定
        if (this.hasAttribute('vertical-label-width')) {
            config.VERTICAL_LABEL_WIDTH = parseInt(this.getAttribute('vertical-label-width'));
        }
        if (this.hasAttribute('group-header-height')) {
            config.GROUP_HEADER_HEIGHT = parseInt(this.getAttribute('group-header-height'));
        }
        if (this.hasAttribute('textarea-rows')) {
            config.TEXTAREA_ROWS_DEFAULT = parseInt(this.getAttribute('textarea-rows'));
        }
        
        // 讀取間距設定
        if (this.hasAttribute('cell-padding-v')) {
            config.CELL_PADDING_V = parseInt(this.getAttribute('cell-padding-v'));
        }
        if (this.hasAttribute('cell-padding-h')) {
            config.CELL_PADDING_H = parseInt(this.getAttribute('cell-padding-h'));
        }
        if (this.hasAttribute('group-margin-bottom')) {
            config.GROUP_MARGIN_BOTTOM = parseInt(this.getAttribute('group-margin-bottom'));
        }
        if (this.hasAttribute('group-spacing')) {
            config.GROUP_SPACING = parseInt(this.getAttribute('group-spacing'));
        }
        
        // 讀取邊框設定
        if (this.hasAttribute('border-width')) {
            config.BORDER_WIDTH = parseInt(this.getAttribute('border-width'));
        }
        if (this.hasAttribute('border-style')) {
            config.BORDER_STYLE = this.getAttribute('border-style');
        }
        if (this.hasAttribute('input-border-width')) {
            config.INPUT_BORDER_WIDTH = parseInt(this.getAttribute('input-border-width'));
        }
        if (this.hasAttribute('input-border-style')) {
            config.INPUT_BORDER_STYLE = this.getAttribute('input-border-style');
        }
        
        // 讀取字體設定
        if (this.hasAttribute('label-font-size')) {
            config.LABEL_FONT_SIZE = parseFloat(this.getAttribute('label-font-size'));
        }
        if (this.hasAttribute('input-font-size')) {
            config.INPUT_FONT_SIZE = parseFloat(this.getAttribute('input-font-size'));
        }
        if (this.hasAttribute('group-title-font-size')) {
            config.GROUP_TITLE_FONT_SIZE = parseFloat(this.getAttribute('group-title-font-size'));
        }
        if (this.hasAttribute('vertical-label-font-size')) {
            config.VERTICAL_LABEL_FONT_SIZE = parseFloat(this.getAttribute('vertical-label-font-size'));
        }
        
        // 讀取圓角設定
        if (this.hasAttribute('input-border-radius')) {
            config.INPUT_BORDER_RADIUS = parseInt(this.getAttribute('input-border-radius'));
        }
        if (this.hasAttribute('group-border-radius')) {
            config.GROUP_BORDER_RADIUS = parseInt(this.getAttribute('group-border-radius'));
        }
        
        return config;
    }

    render() {
        // 清空（但保留原始標籤）
        const originalContent = Array.from(this.querySelectorAll(':scope > grid-table-group'));
        
        this.innerHTML = '';
        this.fields.clear();
        this.groups.clear();
        
        // 重新加入原始標籤（隱藏）
        originalContent.forEach(el => this.appendChild(el));
        
        const container = document.createElement('div');
        container.className = 'grid-table-container';
        
        this.data.forEach((group, groupIndex) => {
            if (group.type === 'group') {
                const groupElement = this.createGroup(group, groupIndex);
                container.appendChild(groupElement);
            }
        });
        
        this.appendChild(container);
        this.applyStyles();
    }

    createGroup(group, groupIndex) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'grid-group';
        this.groups.set(group.title, groupDiv);
        
        // 群組標頭
        const collapsible = group.collapsible !== false;
        const collapsed = group.collapsed === true;
        
        const header = document.createElement('div');
        header.className = 'grid-group-header';
        
        if (collapsible) {
            const toggleIcon = document.createElement('div');
            toggleIcon.className = `toggle-icon ${collapsed ? 'collapsed' : 'expanded'}`;
            header.appendChild(toggleIcon);
        }
        
        if (group.icon) {
            const icon = document.createElement('i');
            icon.className = `bi ${group.icon} group-header-icon`;
            header.appendChild(icon);
        }
        
        const title = document.createElement('span');
        title.className = 'group-title';
        title.textContent = group.title;
        header.appendChild(title);
        
        groupDiv.appendChild(header);
        
        // 群組內容
        const body = document.createElement('div');
        body.className = `grid-group-body ${collapsed ? 'collapsed' : ''}`;
        
        const rowContainer = document.createElement('div');
        rowContainer.className = 'grid-row-container';
        
        // 垂直標籤
        if (group.verticalLabel) {
            const verticalLabel = document.createElement('div');
            verticalLabel.className = 'vertical-label';
            verticalLabel.textContent = group.verticalLabel;
            
            if (group.verticalLabelColor) {
                const color = this.config.THEME[group.verticalLabelColor] || group.verticalLabelColor;
                verticalLabel.style.color = color;
            }
            
            rowContainer.appendChild(verticalLabel);
        }
        
        // 行容器
        const rowsDiv = document.createElement('div');
        rowsDiv.className = 'grid-rows';
        
        (group.items || []).forEach((item, itemIndex) => {
            const row = this.createRow(item, group, groupIndex, itemIndex);
            rowsDiv.appendChild(row);
        });
        
        rowContainer.appendChild(rowsDiv);
        body.appendChild(rowContainer);
        groupDiv.appendChild(body);
        
        // 折疊事件
        if (collapsible) {
            header.addEventListener('click', () => {
                this.toggleGroup(group.title);
            });
        }
        
        return groupDiv;
    }

    createRow(item, group, groupIndex, itemIndex) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        
        const ratio = this.config.DEFAULT_RATIO;
        const totalRatio = ratio[0] + ratio[1];
        const labelWidth = (ratio[0] / totalRatio * 100) + '%';
        const inputWidth = (ratio[1] / totalRatio * 100) + '%';
        
        // 標籤欄位
        const labelCell = document.createElement('div');
        labelCell.className = 'grid-cell-label';
        labelCell.style.width = labelWidth;
        
        if (item.labelIcon) {
            const icon = document.createElement('i');
            icon.className = `bi ${item.labelIcon} label-icon`;
            labelCell.appendChild(icon);
        }
        
        const labelText = document.createElement('span');
        // 支援自動編號
        let labelContent = item.label;
        if (group.autoNumber) {
            labelContent = `${itemIndex + 1}. ${labelContent}`;
        }
        // 支援 <br> 換行
        labelText.innerHTML = labelContent;
        labelCell.appendChild(labelText);
        
        row.appendChild(labelCell);
        
        // 輸入欄位
        const inputCell = document.createElement('div');
        inputCell.className = 'grid-cell-input';
        inputCell.style.width = inputWidth;
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper';
        
        // 左側圖示
        if (item.leftIcon) {
            const leftIcon = document.createElement('i');
            leftIcon.className = `bi ${item.leftIcon} input-left-icon`;
            inputWrapper.appendChild(leftIcon);
        }
        
        // 輸入框
        let input;
        if (item.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'grid-textarea';
            const rows = item.rows || this.config.TEXTAREA_ROWS_DEFAULT;
            input.rows = rows;
        } else {
            input = document.createElement('input');
            input.className = 'grid-input';
            input.type = 'text';
            
            if (item.leftIcon) {
                input.classList.add('has-left-icon');
            }
            if (item.rightIcon) {
                input.classList.add('has-right-icon');
            }
            if (item.menuButton) {
                input.classList.add('has-menu-button');
            }
        }
        
        if (item.placeholder) {
            input.placeholder = item.placeholder;
        }
        
        if (item.readonly) {
            input.readOnly = true;
        }
        
        if (item.name) {
            this.fields.set(item.name, input);
        }
        
        inputWrapper.appendChild(input);
        
        // 漢堡按鈕（在右側圖示之前）
        if (item.menuButton) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'grid-menu-button';
            menuBtn.type = 'button';
            menuBtn.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';
            
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 優先使用 menu-clicked + menu-source
                if (item.menuClicked) {
                    const targetDiv = document.getElementById(item.menuClicked);
                    if (targetDiv) {
                        targetDiv.innerHTML = item.menuSource || '';
                        // 可選：捲動到目標區域
                        targetDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        console.error(`找不到 ID 為 "${item.menuClicked}" 的元素`);
                    }
                }
                // 否則使用 menu-callback
                else if (item.menuCallback) {
                    if (typeof window[item.menuCallback] === 'function') {
                        window[item.menuCallback](item.name, input.value, item);
                    }
                }
            });
            
            inputWrapper.appendChild(menuBtn);
        }
        
        // 右側圖示
        if (item.rightIcon) {
            const rightIcon = document.createElement('i');
            rightIcon.className = `bi ${item.rightIcon} input-right-icon`;
            
            if (item.rightIconColor) {
                const color = this.config.THEME[item.rightIconColor] || item.rightIconColor;
                rightIcon.style.color = color;
            }
            
            inputWrapper.appendChild(rightIcon);
        }
        
        inputCell.appendChild(inputWrapper);
        row.appendChild(inputCell);
        
        return row;
    }

    applyStyles() {
        if (this.styleElement) {
            this.styleElement.remove();
        }
        
        const theme = this.config.THEME;
        this.styleElement = document.createElement('style');
        
        const uniqueClass = `grid-table-${this.id || Math.random().toString(36).substr(2, 9)}`;
        this.classList.add(uniqueClass);
        
        this.styleElement.textContent = `
            .${uniqueClass} .grid-group {
                margin-bottom: ${this.config.GROUP_MARGIN_BOTTOM}px;
                border-radius: ${this.config.GROUP_BORDER_RADIUS}px;
            }
            
            .${uniqueClass} .grid-group-header {
                height: ${this.config.GROUP_HEADER_HEIGHT}px;
                padding: 0 ${this.config.CELL_PADDING_H}px;
                background-color: ${theme.groupHeaderBg};
                border: ${this.config.BORDER_WIDTH}px ${this.config.BORDER_STYLE} ${theme.borderColor};
            }
            
            .${uniqueClass} .grid-group-body {
                border: ${this.config.BORDER_WIDTH}px ${this.config.BORDER_STYLE} ${theme.borderColor};
                border-top: none;
            }
            
            .${uniqueClass} .vertical-label {
                width: ${this.config.VERTICAL_LABEL_WIDTH}px;
                font-size: ${this.config.VERTICAL_LABEL_FONT_SIZE}rem;
                background-color: ${theme.groupHeaderBg};
                border-right: ${this.config.BORDER_WIDTH}px ${this.config.BORDER_STYLE} ${theme.borderColor};
                padding: ${this.config.CELL_PADDING_V}px 0;
            }
            
            .${uniqueClass} .grid-cell-label {
                padding: ${this.config.CELL_PADDING_V}px ${this.config.CELL_PADDING_H}px;
                background-color: ${theme.groupHeaderBg};
                border-right: ${this.config.BORDER_WIDTH}px ${this.config.BORDER_STYLE} ${theme.borderColor};
                font-size: ${this.config.LABEL_FONT_SIZE}rem;
            }
            
            .${uniqueClass} .grid-cell-input {
                padding: ${this.config.CELL_PADDING_V}px ${this.config.CELL_PADDING_H}px;
                background-color: ${theme.bgArea};
            }
            
            .${uniqueClass} .grid-input,
            .${uniqueClass} .grid-textarea {
                background-color: ${theme.inputBg};
                color: ${theme.textMain};
                border: ${this.config.INPUT_BORDER_WIDTH}px ${this.config.INPUT_BORDER_STYLE} ${theme.inputBorder};
                border-radius: ${this.config.INPUT_BORDER_RADIUS}px;
                font-size: ${this.config.INPUT_FONT_SIZE}rem;
                padding: 6px 8px;
            }
            
            .${uniqueClass} .grid-input:focus,
            .${uniqueClass} .grid-textarea:focus {
                border-color: ${theme.inputFocus};
            }
            
            .${uniqueClass} .grid-input:read-only,
            .${uniqueClass} .grid-textarea:read-only {
                background-color: ${theme.groupHeaderBg};
            }
            
            .${uniqueClass} .grid-input.has-left-icon {
                padding-left: 32px;
            }
            
            .${uniqueClass} .grid-input.has-right-icon {
                padding-right: 32px;
            }
            
            .${uniqueClass} .grid-input.has-menu-button {
                padding-right: 40px;
            }
            
            .${uniqueClass} .grid-menu-button {
                color: ${theme.textMain};
            }
            
            .${uniqueClass} .grid-menu-button:hover {
                background-color: ${theme.borderColorLight};
            }
            
            .${uniqueClass} .toggle-icon.expanded {
                border-left: ${this.config.TOGGLE_ICON_SIZE / 1.6}px solid transparent;
                border-right: ${this.config.TOGGLE_ICON_SIZE / 1.6}px solid transparent;
                border-top: ${this.config.TOGGLE_ICON_SIZE}px solid ${theme.textMain};
                margin-right: ${this.config.TOGGLE_ICON_MARGIN}px;
            }
            
            .${uniqueClass} .toggle-icon.collapsed {
                border-top: ${this.config.TOGGLE_ICON_SIZE / 1.6}px solid transparent;
                border-bottom: ${this.config.TOGGLE_ICON_SIZE / 1.6}px solid transparent;
                border-left: ${this.config.TOGGLE_ICON_SIZE}px solid ${theme.textMain};
                margin-right: ${this.config.TOGGLE_ICON_MARGIN}px;
            }
            
            .${uniqueClass} .grid-row {
                border-bottom: ${this.config.BORDER_WIDTH}px ${this.config.BORDER_STYLE} ${theme.borderColorLight};
            }
            
            .${uniqueClass} .group-title {
                font-size: ${this.config.GROUP_TITLE_FONT_SIZE}rem;
            }
            
            .${uniqueClass} .label-icon,
            .${uniqueClass} .input-left-icon,
            .${uniqueClass} .input-right-icon {
                font-size: ${this.config.LABEL_FONT_SIZE}rem;
            }
            
            .${uniqueClass} .group-header-icon {
                font-size: ${this.config.GROUP_TITLE_FONT_SIZE}rem;
            }
        `;
        
        this.appendChild(this.styleElement);
    }

    // ========== API 方法 ==========
    
    getValue(fieldName) {
        const field = this.fields.get(fieldName);
        return field ? field.value : null;
    }

    setValue(fieldName, value) {
        const field = this.fields.get(fieldName);
        if (field) {
            field.value = value;
        }
    }

    getAllValues() {
        const values = {};
        this.fields.forEach((field, name) => {
            values[name] = field.value;
        });
        return values;
    }

    setAllValues(values) {
        Object.keys(values).forEach(name => {
            this.setValue(name, values[name]);
        });
    }

    toggleGroup(groupTitle) {
        const groupDiv = this.groups.get(groupTitle);
        if (!groupDiv) return;
        
        const header = groupDiv.querySelector('.grid-group-header');
        const body = groupDiv.querySelector('.grid-group-body');
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (body.classList.contains('collapsed')) {
            body.classList.remove('collapsed');
            if (toggleIcon) {
                toggleIcon.classList.remove('collapsed');
                toggleIcon.classList.add('expanded');
            }
        } else {
            body.classList.add('collapsed');
            if (toggleIcon) {
                toggleIcon.classList.remove('expanded');
                toggleIcon.classList.add('collapsed');
            }
        }
    }

    expandGroup(groupTitle) {
        const groupDiv = this.groups.get(groupTitle);
        if (!groupDiv) return;
        
        const body = groupDiv.querySelector('.grid-group-body');
        const toggleIcon = groupDiv.querySelector('.toggle-icon');
        
        body.classList.remove('collapsed');
        if (toggleIcon) {
            toggleIcon.classList.remove('collapsed');
            toggleIcon.classList.add('expanded');
        }
    }

    collapseGroup(groupTitle) {
        const groupDiv = this.groups.get(groupTitle);
        if (!groupDiv) return;
        
        const body = groupDiv.querySelector('.grid-group-body');
        const toggleIcon = groupDiv.querySelector('.toggle-icon');
        
        body.classList.add('collapsed');
        if (toggleIcon) {
            toggleIcon.classList.remove('expanded');
            toggleIcon.classList.add('collapsed');
        }
    }

    destroy() {
        if (this.styleElement) {
            this.styleElement.remove();
        }
        this.innerHTML = '';
        this.fields.clear();
        this.groups.clear();
    }

    // ========== 靜態方法：設定全局配置 ==========
    static setGlobalConfig(config) {
        GRID_TABLE_GLOBAL_CONFIG = JSON.parse(JSON.stringify(GRID_TABLE_DEFAULTS));
        
        if (config.themes) {
            GRID_TABLE_GLOBAL_CONFIG.THEMES = { ...GRID_TABLE_DEFAULTS.THEMES, ...config.themes };
        }
        
        const configKeys = [
            'ratio', 'verticalLabelWidth', 'groupHeaderHeight', 'textareaRows',
            'cellPaddingV', 'cellPaddingH', 'groupMarginBottom', 'groupSpacing',
            'borderWidth', 'borderStyle', 'inputBorderWidth', 'inputBorderStyle',
            'labelFontSize', 'inputFontSize', 'groupTitleFontSize', 'verticalLabelFontSize',
            'inputBorderRadius', 'groupBorderRadius'
        ];
        
        configKeys.forEach(key => {
            const upperKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
            if (config[key] !== undefined) {
                GRID_TABLE_GLOBAL_CONFIG[upperKey] = config[key];
            }
        });
    }
}

// 註冊自訂元素
customElements.define('grid-table', GridTable);
customElements.define('grid-table-group', GridTableGroup);
customElements.define('grid-table-item', GridTableItem);

<?php /* guide.php — 答案卷元件系統使用說明 */ ?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>答案卷元件系統 — 使用說明</title>
<style>
/* ════════════════════════════════════
   Variables & Reset
   ════════════════════════════════════ */
:root {
  --bg:      #0C0D0C;
  --panel:   #141614;
  --panel2:  #1B1C19;
  --border:  #252624;
  --shell:   #C6C7BD;
  --dim:     #6A6B66;
  --lav:     #C3A5E5;
  --sky:     #08A9D1;
  --safe:    #40C99A;
  --warn:    #F08080;
  --special: #C8DD5A;
  --yellow:  #DECA4B;
  --focus:   #A0CF72;
  --orange:  #EDA109;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
html { font-size:18px; scroll-behavior:smooth; }
body {
  background:var(--bg);
  color:var(--shell);
  font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
  font-size:1rem;
  line-height:1.75;
}

/* ════════════════════════════════════
   Layout
   ════════════════════════════════════ */
.site-header {
  background:var(--panel);
  border-bottom:1px solid var(--border);
  padding:14px 32px;
  display:flex;
  align-items:center;
  gap:20px;
  position:sticky;
  top:0;
  z-index:200;
}
.site-logo {
  font-size:1.1rem;
  font-weight:700;
  color:var(--special);
  white-space:nowrap;
}
.site-version {
  background:rgba(200,221,90,.15);
  border:1px solid var(--special);
  color:var(--special);
  font-size:0.78rem;
  padding:2px 8px;
  border-radius:4px;
  font-weight:700;
}
.header-links {
  margin-left:auto;
  display:flex;
  gap:20px;
}
.header-links a {
  color:var(--dim);
  text-decoration:none;
  font-size:0.88rem;
  transition:color .15s;
}
.header-links a:hover { color:var(--shell); }

.layout {
  display:grid;
  grid-template-columns:260px 1fr;
  min-height:calc(100vh - 57px);
}

/* ════════════════════════════════════
   Sidebar TOC
   ════════════════════════════════════ */
.toc {
  background:var(--panel);
  border-right:1px solid var(--border);
  position:sticky;
  top:57px;
  height:calc(100vh - 57px);
  overflow-y:auto;
  padding:20px 0;
}
.toc-group {
  margin-bottom:8px;
}
.toc-cat {
  font-size:0.7rem;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--dim);
  padding:6px 20px 4px;
}
.toc a {
  display:block;
  padding:5px 20px;
  color:var(--dim);
  text-decoration:none;
  font-size:0.9rem;
  border-left:2px solid transparent;
  transition:color .15s, border-color .15s, background .15s;
}
.toc a:hover  { color:var(--shell); background:rgba(255,255,255,.03); }
.toc a.active { color:var(--sky); border-color:var(--sky); }

/* ════════════════════════════════════
   Content
   ════════════════════════════════════ */
.content {
  padding:40px 56px 80px;
  max-width:900px;
}

/* Section headings */
.doc-section {
  margin-bottom:60px;
  scroll-margin-top:80px;
}
h2 {
  font-size:1.5rem;
  font-weight:700;
  color:var(--special);
  margin-bottom:20px;
  padding-bottom:10px;
  border-bottom:1px solid var(--border);
  display:flex;
  align-items:center;
  gap:10px;
}
h2 .h-icon { opacity:.7; }
h3 {
  font-size:1.1rem;
  font-weight:700;
  color:var(--lav);
  margin:28px 0 12px;
}
h4 {
  font-size:1rem;
  font-weight:700;
  color:var(--sky);
  margin:20px 0 8px;
}

p { margin-bottom:14px; }
p:last-child { margin-bottom:0; }

a { color:var(--sky); text-decoration:none; }
a:hover { text-decoration:underline; }

/* Inline code */
code {
  font-family:'Courier New',Consolas,monospace;
  font-size:0.88rem;
  background:var(--panel2);
  border:1px solid var(--border);
  border-radius:4px;
  padding:1px 6px;
  color:var(--focus);
}

/* ════════════════════════════════════
   Code blocks
   ════════════════════════════════════ */
.code-wrap {
  position:relative;
  margin:14px 0 20px;
}
.code-lang {
  position:absolute;
  top:0; left:0;
  font-size:0.72rem;
  font-weight:700;
  background:var(--border);
  color:var(--dim);
  padding:3px 10px;
  border-radius:6px 0 6px 0;
  letter-spacing:.06em;
  text-transform:uppercase;
  user-select:none;
}
.code-copy-btn {
  position:absolute;
  top:6px; right:8px;
  background:transparent;
  border:1px solid var(--border);
  color:var(--dim);
  font-size:0.78rem;
  padding:3px 10px;
  border-radius:4px;
  cursor:pointer;
  transition:color .15s, border-color .15s;
}
.code-copy-btn:hover { color:var(--shell); border-color:var(--dim); }

pre {
  background:var(--panel2);
  border:1px solid var(--border);
  border-radius:7px;
  padding:22px 18px 18px;
  font-family:'Courier New',Consolas,monospace;
  font-size:0.85rem;
  line-height:1.7;
  overflow-x:auto;
  white-space:pre;
  tab-size:2;
  color:var(--shell);
}
/* Syntax highlight classes (applied by JS) */
pre .kw  { color:var(--lav); }      /* keywords            */
pre .tag { color:var(--orange); }   /* HTML tag names      */
pre .at  { color:var(--sky); }      /* HTML attributes     */
pre .str { color:var(--focus); }    /* strings             */
pre .cmt { color:var(--dim); }      /* comments            */
pre .num { color:var(--yellow); }   /* numbers             */
pre .fn  { color:var(--safe); }     /* function names      */
pre .var { color:var(--lav); font-style:italic; } /* variables */

/* ════════════════════════════════════
   Tables
   ════════════════════════════════════ */
.attr-table {
  width:100%;
  border-collapse:collapse;
  margin:14px 0 24px;
  font-size:0.9rem;
}
.attr-table th {
  background:var(--panel2);
  border:1px solid var(--border);
  padding:9px 12px;
  text-align:left;
  color:var(--dim);
  font-weight:700;
  white-space:nowrap;
}
.attr-table td {
  border:1px solid var(--border);
  padding:9px 12px;
  vertical-align:top;
}
.attr-table tr:hover td { background:rgba(255,255,255,.02); }
.attr-name  { color:var(--sky); font-family:'Courier New',monospace; font-size:0.88rem; white-space:nowrap; }
.attr-type  { color:var(--dim); font-size:0.85rem; white-space:nowrap; }
.attr-def   { color:var(--yellow); font-family:'Courier New',monospace; font-size:0.85rem; }
.attr-req   { color:var(--warn); font-size:0.8rem; font-weight:700; }

/* ════════════════════════════════════
   Callouts
   ════════════════════════════════════ */
.callout {
  border-left:3px solid;
  border-radius:0 6px 6px 0;
  padding:14px 18px;
  margin:16px 0 20px;
  font-size:0.95rem;
}
.callout p { margin-bottom:8px; }
.callout p:last-child { margin-bottom:0; }
.callout-tip  { border-color:var(--safe);    background:rgba(64,201,154,.08); }
.callout-warn { border-color:var(--warn);    background:rgba(240,128,128,.08); }
.callout-info { border-color:var(--sky);     background:rgba(8,169,209,.08); }
.callout-note { border-color:var(--yellow);  background:rgba(222,202,75,.06); }
.callout-icon { font-size:1rem; margin-right:6px; }

/* ════════════════════════════════════
   Color swatches
   ════════════════════════════════════ */
.color-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));
  gap:10px;
  margin:14px 0;
}
.color-item {
  display:flex;
  align-items:center;
  gap:10px;
  background:var(--panel2);
  border:1px solid var(--border);
  border-radius:6px;
  padding:8px 12px;
}
.color-swatch {
  width:28px;
  height:28px;
  border-radius:50%;
  flex-shrink:0;
}
.color-name  { font-family:'Courier New',monospace; font-size:0.88rem; color:var(--shell); }
.color-hex   { font-size:0.8rem; color:var(--dim); }

/* ════════════════════════════════════
   Attribute badge
   ════════════════════════════════════ */
.badge {
  display:inline-block;
  font-size:0.72rem;
  padding:1px 7px;
  border-radius:3px;
  font-weight:700;
  vertical-align:middle;
  margin-left:4px;
}
.badge-req  { background:rgba(240,128,128,.2); color:var(--warn); border:1px solid var(--warn); }
.badge-opt  { background:rgba(106,107,102,.2); color:var(--dim);  border:1px solid var(--border); }

/* ════════════════════════════════════
   Flow diagram (text-based)
   ════════════════════════════════════ */
.flow {
  background:var(--panel2);
  border:1px solid var(--border);
  border-radius:7px;
  padding:20px 24px;
  font-family:'Courier New',monospace;
  font-size:0.85rem;
  line-height:1.9;
  margin:14px 0 20px;
  white-space:pre;
  overflow-x:auto;
}
.flow .fl-sky    { color:var(--sky); }
.flow .fl-lav    { color:var(--lav); }
.flow .fl-safe   { color:var(--safe); }
.flow .fl-yellow { color:var(--yellow); }
.flow .fl-dim    { color:var(--dim); }

/* ════════════════════════════════════
   Toast
   ════════════════════════════════════ */
#toast {
  position:fixed;
  bottom:24px; right:24px;
  background:var(--panel);
  border:1px solid var(--safe);
  color:var(--safe);
  padding:9px 18px;
  border-radius:6px;
  font-size:1rem;
  z-index:9999;
  opacity:0;
  transform:translateY(60px);
  transition:opacity .25s, transform .25s;
  pointer-events:none;
}
#toast.show { opacity:1; transform:translateY(0); }
</style>
</head>
<body>

<!-- ══════════════════ HEADER ══════════════════ -->
<header class="site-header">
  <span class="site-logo">📋 答案卷元件系統</span>
  <span class="site-version">v3</span>
  <nav class="header-links">
    <a href="#install">安裝</a>
    <a href="#answer-sheet">選擇題</a>
    <a href="#fill-sheet">填空題</a>
    <a href="#backend">後端</a>
    <a href="#full-example">完整範例</a>
  </nav>
</header>

<div class="layout">

<!-- ══════════════════ TOC ══════════════════ -->
<nav class="toc" id="toc">
  <div class="toc-group">
    <div class="toc-cat">入門</div>
    <a href="#overview">系統概覽</a>
    <a href="#install">安裝與引入</a>
  </div>
  <div class="toc-group">
    <div class="toc-cat">前端元件</div>
    <a href="#answer-sheet">&lt;answer-sheet&gt;</a>
    <a href="#fill-sheet">&lt;fill-sheet&gt;</a>
    <a href="#bidirectional">雙向連動</a>
    <a href="#grading">批改功能</a>
    <a href="#global-config">全域設定</a>
    <a href="#public-api">公開 API</a>
    <a href="#brand-colors">品牌色盤</a>
  </div>
  <div class="toc-group">
    <div class="toc-cat">資料格式</div>
    <a href="#json-format">試卷 JSON 格式</a>
    <a href="#payload">POST Payload</a>
  </div>
  <div class="toc-group">
    <div class="toc-cat">後端</div>
    <a href="#backend">submit-answer.php</a>
    <a href="#editor">exam-editor.php</a>
  </div>
  <div class="toc-group">
    <div class="toc-cat">範例</div>
    <a href="#full-example">完整整合範例</a>
  </div>
</nav>

<!-- ══════════════════ CONTENT ══════════════════ -->
<main class="content">

<!-- ─────────────────── 系統概覽 ─────────────────── -->
<section class="doc-section" id="overview">
<h2><span class="h-icon">🗺</span> 系統概覽</h2>

<p>本系統由三個獨立部分組成，可單獨使用，也可完整整合。</p>

<div class="flow"><span class="fl-lav">前端元件（answer-sheet.js）</span>
  ├─ &lt;answer-sheet&gt;  選擇題答案卡（單選，圓圈選項）
  └─ &lt;fill-sheet&gt;   填空題答案卡（文字輸入框）

<span class="fl-yellow">資料</span>
  ├─ exam.json      試卷設定（由編輯器產生）
  └─ answers.json   答案金鑰（選擇性，用於批改）

<span class="fl-safe">後端（PHP）</span>
  ├─ submit-answer.php   接收並儲存作答結果
  └─ exam-editor.php     試卷視覺化編輯器（產生 exam.json）</div>

<h3>檔案清單</h3>
<table class="attr-table">
  <tr><th>檔案</th><th>說明</th></tr>
  <tr><td class="attr-name">answer-sheet.js</td><td>前端 Web Component 套件（含 CSS，無外部依賴）</td></tr>
  <tr><td class="attr-name">submit-answer.php</td><td>後端接收答案提交，寫入 MySQL</td></tr>
  <tr><td class="attr-name">exam-editor.php</td><td>視覺化試卷編輯器，產生 exam.json</td></tr>
  <tr><td class="attr-name">exam.json</td><td>試卷定義（由編輯器匯出，前端元件讀取）</td></tr>
</table>
</section>

<!-- ─────────────────── 安裝 ─────────────────── -->
<section class="doc-section" id="install">
<h2><span class="h-icon">⚡</span> 安裝與引入</h2>

<p>將 <code>answer-sheet.js</code> 放在網站目錄，以 <code>&lt;script&gt;</code> 引入即可，無需 npm、無需打包工具。</p>

<div class="code-wrap">
  <span class="code-lang">HTML</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="html">&lt;!-- 放在 &lt;/body&gt; 前或 &lt;head&gt; 內 --&gt;
&lt;script src="answer-sheet.js"&gt;&lt;/script&gt;

&lt;!-- 之後就可以直接使用兩個元件 --&gt;
&lt;answer-sheet total="20"&gt;&lt;/answer-sheet&gt;
&lt;fill-sheet   total="5" start-from="21"&gt;&lt;/fill-sheet&gt;</pre>
</div>

<div class="callout callout-info">
  <p><span class="callout-icon">ℹ️</span>元件使用原生 Web Components 標準（Custom Elements v1），無 Shadow DOM，CSS 直接注入 <code>&lt;head&gt;</code>。相容所有現代瀏覽器（Chrome 67+、Firefox 63+、Safari 12.1+）。</p>
</div>
</section>

<!-- ─────────────────── answer-sheet ─────────────────── -->
<section class="doc-section" id="answer-sheet">
<h2><span class="h-icon">⭕</span> &lt;answer-sheet&gt; 選擇題元件</h2>

<p>渲染圓圈選項的單選題答案卡。支援多欄排列、雙向連動、批改顯示。</p>

<h3>最小用法</h3>
<div class="code-wrap">
  <span class="code-lang">HTML</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="html">&lt;answer-sheet
  total="24"
  submit-url="/submit-answer.php"&gt;
&lt;/answer-sheet&gt;</pre>
</div>

<h3>完整屬性</h3>
<table class="attr-table">
  <thead>
    <tr><th>屬性</th><th>型別</th><th>預設值</th><th>說明</th></tr>
  </thead>
  <tbody>
    <tr>
      <td class="attr-name">total <span class="badge badge-req">必填</span></td>
      <td class="attr-type">number</td>
      <td class="attr-def">—</td>
      <td>題目總數</td>
    </tr>
    <tr>
      <td class="attr-name">start-from</td>
      <td class="attr-type">number</td>
      <td class="attr-def">1</td>
      <td>起始題號。多個元件並排時用於銜接題號（如第二區塊從 21 開始）</td>
    </tr>
    <tr>
      <td class="attr-name">options</td>
      <td class="attr-type">number</td>
      <td class="attr-def">4</td>
      <td>每題選項數量，範圍 2–6</td>
    </tr>
    <tr>
      <td class="attr-name">option-case</td>
      <td class="attr-type">string</td>
      <td class="attr-def">lower</td>
      <td><code>lower</code> → a b c d　／　<code>upper</code> → A B C D</td>
    </tr>
    <tr>
      <td class="attr-name">per-column</td>
      <td class="attr-type">number</td>
      <td class="attr-def">10</td>
      <td>每欄最多顯示幾題，系統自動計算欄數（最多 4 欄）</td>
    </tr>
    <tr>
      <td class="attr-name">submit-url</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>POST 目標。留空則不送出，只觸發本地批改</td>
    </tr>
    <tr>
      <td class="attr-name">submit-filename</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>加入 payload 的 <code>filename</code> 欄位，供後端辨識</td>
    </tr>
    <tr>
      <td class="attr-name">answer-src</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>答案金鑰 JSON 的 URL，送出後自動本地批改</td>
    </tr>
    <tr>
      <td class="attr-name">src</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>從後端 JSON 讀取題目設定（<code>total</code>、<code>options</code>、<code>examId</code>）</td>
    </tr>
    <tr>
      <td class="attr-name">question-selector</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>頁面題目的 CSS 選擇器，用於雙向捲動連動</td>
    </tr>
    <tr>
      <td class="attr-name">theme</td>
      <td class="attr-type">string</td>
      <td class="attr-def">dark</td>
      <td><code>dark</code> 或 <code>light</code></td>
    </tr>
    <tr>
      <td class="attr-name">selected-color</td>
      <td class="attr-type">string</td>
      <td class="attr-def">lavender</td>
      <td>已選中圓圈的填色（品牌色名，詳見<a href="#brand-colors">色盤</a>）</td>
    </tr>
    <tr>
      <td class="attr-name">hover-color</td>
      <td class="attr-type">string</td>
      <td class="attr-def">sky</td>
      <td>滑鼠懸停及 focus 的邊框色（品牌色名）</td>
    </tr>
    <tr>
      <td class="attr-name">width</td>
      <td class="attr-type">string</td>
      <td class="attr-def">100%</td>
      <td>元件寬度，可用任何 CSS 值：<code>420px</code>、<code>fit-content</code> 等</td>
    </tr>
    <tr>
      <td class="attr-name">exam-id</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>試卷編號，加入 POST payload；也可從 <code>src</code> JSON 的 <code>examId</code> 自動帶入</td>
    </tr>
    <tr>
      <td class="attr-name">note-1</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>備註欄 1，加入 POST payload（建議存作答者 ID）</td>
    </tr>
    <tr>
      <td class="attr-name">note-2</td>
      <td class="attr-type">string</td>
      <td class="attr-def">—</td>
      <td>備註欄 2，加入 POST payload（建議存班級、session 等）</td>
    </tr>
  </tbody>
</table>

<h3>多欄佈局說明</h3>
<p>欄數由 <code>per-column</code> 和 <code>total</code> 自動計算，最多 4 欄：</p>

<div class="code-wrap">
  <span class="code-lang">範例</span>
<pre>total="24"  per-column="12"  →  2 欄（各 12 題）
total="24"  per-column="10"  →  3 欄（10、10、4 題）
total="24"  per-column="18"  →  2 欄（18、6 題）
total="40"  per-column="10"  →  4 欄（各 10 題）</pre>
</div>
</section>

<!-- ─────────────────── fill-sheet ─────────────────── -->
<section class="doc-section" id="fill-sheet">
<h2><span class="h-icon">✏️</span> &lt;fill-sheet&gt; 填空題元件</h2>

<p>每題顯示一個文字輸入框。所有屬性與 <code>&lt;answer-sheet&gt;</code> 相同，除了以下兩個不適用：<code>options</code>、<code>option-case</code>。</p>

<h3>基本用法</h3>
<div class="code-wrap">
  <span class="code-lang">HTML</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="html">&lt;fill-sheet
  total="6"
  start-from="25"
  submit-url="/submit-answer.php"
  answer-src="/answers-fill.json"
  theme="dark"
  selected-color="sky"
  hover-color="focus"&gt;
&lt;/fill-sheet&gt;</pre>
</div>

<h3>輸入框色彩語意</h3>
<table class="attr-table">
  <tr><th>狀態</th><th>視覺</th></tr>
  <tr><td>空白（未填）</td><td>灰色邊框</td></tr>
  <tr><td>滑鼠懸停</td><td>邊框變為 <code>hover-color</code></td></tr>
  <tr><td>已填入文字</td><td>邊框變為 <code>selected-color</code>（等同圓圈選中）</td></tr>
  <tr><td>批改：正確</td><td>綠色邊框 + 淡綠背景</td></tr>
  <tr><td>批改：錯誤</td><td>紅色邊框 + 正確答案顯示於框下方</td></tr>
  <tr><td>批改：未作答</td><td>虛線綠色邊框 + 正確答案提示</td></tr>
</table>

<h3>填空題答案金鑰格式</h3>
<p>支援單一正解（字串）或多個可接受的答案（陣列），比對時不分大小寫並忽略前後空白。</p>
<div class="code-wrap">
  <span class="code-lang">JSON</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="json">{
  "25": ["supply chains", "supply chain"],
  "26": "families",
  "27": "biodiversity",
  "28": "infrastructure"
}</pre>
</div>
</section>

<!-- ─────────────────── 雙向連動 ─────────────────── -->
<section class="doc-section" id="bidirectional">
<h2><span class="h-icon">↕</span> 雙向連動</h2>

<p>元件可與頁面上的題目內容相互連動：點擊題號 → 捲動到頁面題目；點擊頁面題目 → 答案卡對應列高亮。</p>

<h3>設定方式</h3>
<p>在頁面題目元素上加入 <code>data-q="題號"</code>，並在元件設定 <code>question-selector</code>。</p>

<div class="code-wrap">
  <span class="code-lang">HTML</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="html">&lt;!-- 頁面題目：加上 data-q 屬性 --&gt;
&lt;div class="question" data-q="1"&gt;
  &lt;p&gt;1. What does the word "enumerate" mean?&lt;/p&gt;
&lt;/div&gt;

&lt;div class="question" data-q="2"&gt;
  &lt;p&gt;2. Which word is a synonym for "meticulous"?&lt;/p&gt;
&lt;/div&gt;

&lt;!-- 元件：設定 question-selector --&gt;
&lt;answer-sheet
  total="24"
  question-selector=".question"&gt;
&lt;/answer-sheet&gt;</pre>
</div>

<div class="callout callout-note">
  <p><span class="callout-icon">📌</span><code>question-selector</code> 支援任何合法的 CSS 選擇器，如 <code>".q-item"</code>、<code>"article.question"</code>、<code>"[data-type='q']"</code> 等。元件會自動找到帶有 <code>data-q="N"</code> 的匹配元素。</p>
</div>
</section>

<!-- ─────────────────── 批改功能 ─────────────────── -->
<section class="doc-section" id="grading">
<h2><span class="h-icon">✅</span> 批改功能</h2>

<p>送出答案後，元件支援三種批改方式，優先順序如下：</p>

<h3>方案 A：預載答案金鑰（answer-src）</h3>
<p>元件初始化時從 <code>answer-src</code> URL 取得答案金鑰，送出成功後立即在前端比對。</p>
<div class="code-wrap">
  <span class="code-lang">HTML</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="html">&lt;answer-sheet
  total="24"
  submit-url="/submit-answer.php"
  answer-src="/answers-mcq.json"&gt;
&lt;/answer-sheet&gt;</pre>
</div>

<h3>方案 B：後端 POST 回傳答案金鑰</h3>
<p>後端在接收 POST 後，將答案金鑰包含在 response JSON 中回傳，元件自動取得並批改。</p>
<div class="code-wrap">
  <span class="code-lang">後端 PHP Response</span>
<pre data-lang="php">&lt;?php
// submit-answer.php 中的 getAnswerKey() 實作範例
function getAnswerKey(string $examId): ?array {
    $keys = [
        'exam-001' =&gt; ['1'=&gt;'b','2'=&gt;'b','3'=&gt;'c', /* ... */],
    ];
    return $keys[$examId] ?? null;
}

$key = getAnswerKey($examId);
if ($key !== null) {
    jsonOut(['ok'=&gt;true, 'id'=&gt;$insertId, 'answers'=&gt;$key]);
}</pre>
</div>

<h3>方案 C：JavaScript 呼叫 setAnswerKey()</h3>
<p>在頁面 JS 中取得答案金鑰後，呼叫元件的公開方法。</p>
<div class="code-wrap">
  <span class="code-lang">JavaScript</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="js">const sheet = document.querySelector('answer-sheet');
sheet.setAnswerKey({
  "1": "b", "2": "b", "3": "c", "4": "b",
  "5": "b", "6": "b"  // ...
});</pre>
</div>

<h3>批改顯示（選擇題）</h3>
<table class="attr-table">
  <tr><th>狀態</th><th>視覺</th></tr>
  <tr><td>答對</td><td>圓圈填滿 safe 綠色</td></tr>
  <tr><td>答錯</td><td>使用者選項填 warning 紅色；正確選項填 safe 綠色</td></tr>
  <tr><td>未作答</td><td>正確選項顯示綠色虛線邊框</td></tr>
</table>

<div class="callout callout-warn">
  <p><span class="callout-icon">⚠️</span>如果沒有設定 <code>answer-src</code>、後端也沒回傳 <code>answers</code>、也沒呼叫 <code>setAnswerKey()</code>，送出後不會批改，只顯示「已送出」提示。</p>
</div>
</section>

<!-- ─────────────────── 全域設定 ─────────────────── -->
<section class="doc-section" id="global-config">
<h2><span class="h-icon">⚙️</span> 全域設定</h2>

<p>在引入 <code>answer-sheet.js</code> 之前設定 <code>window.AnswerSheetConfig</code>，作為所有元件的預設值。HTML 屬性優先於全域設定。</p>

<div class="code-wrap">
  <span class="code-lang">JavaScript</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="js">window.AnswerSheetConfig = {
  // 主題與外觀
  theme:         'dark',       // 'dark' | 'light'
  selectedColor: 'lavender',   // 品牌色名
  hoverColor:    'sky',        // 品牌色名

  // 排版
  perColumn: 10,               // 每欄題數
  options:   4,                // MCQ 選項數
  optionCase:'lower',          // 'lower' | 'upper'

  // 後端
  submitUrl:     '/submit-answer.php',
  submitFilename:'quiz_result',
};</pre>
</div>
</section>

<!-- ─────────────────── 公開 API ─────────────────── -->
<section class="doc-section" id="public-api">
<h2><span class="h-icon">🔌</span> 公開 API</h2>

<p>兩個元件均提供以下三個 JavaScript 方法：</p>

<table class="attr-table">
  <thead><tr><th>方法</th><th>說明</th><th>回傳值</th></tr></thead>
  <tbody>
    <tr>
      <td class="attr-name">setAnswerKey(obj)</td>
      <td>設定答案金鑰，送出後觸發批改。<code>obj</code> 格式：<code>{ "1":"b", "2":"a" }</code>；填空題支援陣列值</td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td class="attr-name">getAnswers()</td>
      <td>取得目前所有作答，未作答題目值為 <code>null</code></td>
      <td><code>Object</code></td>
    </tr>
    <tr>
      <td class="attr-name">reset()</td>
      <td>清除所有作答與批改結果，恢復初始狀態</td>
      <td><code>undefined</code></td>
    </tr>
  </tbody>
</table>

<div class="code-wrap">
  <span class="code-lang">JavaScript</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="js">const sheet = document.getElementById('mySheet');
const fill  = document.getElementById('myFill');

// 在登入後動態設定作答者資訊
sheet.setAttribute('note-1', currentUser.id);
sheet.setAttribute('note-2', currentUser.class);
fill.setAttribute('note-1',  currentUser.id);
fill.setAttribute('note-2',  currentUser.class);

// 從後端取得答案金鑰後批改
fetch('/api/answer-key?exam=' + examId)
  .then(r =&gt; r.json())
  .then(data =&gt; {
    sheet.setAnswerKey(data.mcq);
    fill.setAnswerKey(data.fill);
  });

// 檢視目前作答
console.log(sheet.getAnswers());
// → { "1":"b", "2":null, "3":"c", ... }

// 重設
document.getElementById('restartBtn')
  .addEventListener('click', () =&gt; {
    sheet.reset();
    fill.reset();
  });</pre>
</div>
</section>

<!-- ─────────────────── 品牌色盤 ─────────────────── -->
<section class="doc-section" id="brand-colors">
<h2><span class="h-icon">🎨</span> 品牌色盤</h2>

<p><code>selected-color</code> 和 <code>hover-color</code> 接受以下品牌色名稱：</p>

<div class="color-grid">
  <div class="color-item"><div class="color-swatch" style="background:#C6C7BD"></div><div><div class="color-name">shell</div><div class="color-hex">#C6C7BD</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#C3A5E5"></div><div><div class="color-name">lavender</div><div class="color-hex">#C3A5E5</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#C8DD5A"></div><div><div class="color-name">special</div><div class="color-hex">#C8DD5A</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#F08080"></div><div><div class="color-name">warning</div><div class="color-hex">#F08080</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#E5C3B3"></div><div><div class="color-name">salmon</div><div class="color-hex">#E5C3B3</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#08A9D1"></div><div><div class="color-name">sky</div><div class="color-hex">#08A9D1</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#40C99A"></div><div><div class="color-name">safe</div><div class="color-hex">#40C99A</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#DBEDD8"></div><div><div class="color-name">vanilla</div><div class="color-hex">#DBEDD8</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#DECA4B"></div><div><div class="color-name">yellow</div><div class="color-hex">#DECA4B</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#A0CF72"></div><div><div class="color-name">focus</div><div class="color-hex">#A0CF72</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#4285EB"></div><div><div class="color-name">info</div><div class="color-hex">#4285EB</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#95BDD7"></div><div><div class="color-name">stone</div><div class="color-hex">#95BDD7</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#7B6CF0"></div><div><div class="color-name">indigo</div><div class="color-hex">#7B6CF0</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#FFB3D9"></div><div><div class="color-name">pink</div><div class="color-hex">#FFB3D9</div></div></div>
  <div class="color-item"><div class="color-swatch" style="background:#EDA109"></div><div><div class="color-name">orange</div><div class="color-hex">#EDA109</div></div></div>
</div>
</section>

<!-- ─────────────────── JSON 格式 ─────────────────── -->
<section class="doc-section" id="json-format">
<h2><span class="h-icon">📄</span> 試卷 JSON 格式</h2>

<p>由 <code>exam-editor.php</code> 匯出，供前端元件的 <code>src</code> 屬性讀取，也可用於還原編輯器狀態。</p>

<div class="code-wrap">
  <span class="code-lang">JSON</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="json">{
  "examId": "exam-001",
  "title": "IELTS Listening Test",
  "totalQuestions": 30,
  "createdAt": "2026-07-29T10:00:00.000Z",
  "sections": [
    {
      "type": "mcq",
      "startFrom": 1,
      "count": 20,
      "options": 4,
      "optionCase": "lower",
      "questions": [
        {
          "no": 1,
          "text": "What does the word 'enumerate' mean?",
          "choices": [
            "estimate roughly",
            "list one by one",
            "measure precisely",
            "ignore completely"
          ]
        }
      ]
    },
    {
      "type": "fill",
      "startFrom": 21,
      "count": 10,
      "questions": [
        {
          "no": 21,
          "text": "Urban farming can reduce reliance on long ___."
        }
      ]
    }
  ]
}</pre>
</div>

<h3>sections 陣列欄位說明</h3>
<table class="attr-table">
  <thead><tr><th>欄位</th><th>說明</th></tr></thead>
  <tbody>
    <tr><td class="attr-name">type</td><td><code>"mcq"</code> 選擇題 ／ <code>"fill"</code> 填空題</td></tr>
    <tr><td class="attr-name">startFrom</td><td>本區段第一題的題號（由編輯器自動計算）</td></tr>
    <tr><td class="attr-name">count</td><td>本區段的題目數量，對應元件的 <code>total</code> 屬性</td></tr>
    <tr><td class="attr-name">options</td><td>選項數量（僅 mcq）</td></tr>
    <tr><td class="attr-name">optionCase</td><td><code>"lower"</code> 或 <code>"upper"</code>（僅 mcq）</td></tr>
    <tr><td class="attr-name">questions</td><td>題目內容陣列，元件不會讀取（僅供頁面渲染和編輯器使用）</td></tr>
  </tbody>
</table>

<div class="callout callout-note">
  <p><span class="callout-icon">📌</span>前端元件（<code>&lt;answer-sheet&gt;</code> / <code>&lt;fill-sheet&gt;</code>）從 <code>src</code> 讀取的欄位只有 <code>total</code>（對應 <code>count</code>）、<code>options</code>、<code>optionCase</code>、<code>examId</code>。題目內容的渲染由頁面 HTML 負責，元件只處理作答與批改。</p>
</div>
</section>

<!-- ─────────────────── POST Payload ─────────────────── -->
<section class="doc-section" id="payload">
<h2><span class="h-icon">📤</span> POST Payload 格式</h2>

<p>元件送出時，以 <code>Content-Type: application/json</code> POST 到 <code>submit-url</code>。</p>

<div class="code-wrap">
  <span class="code-lang">JSON</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="json">{
  "examId":      "exam-001",
  "note1":       "user_12345",
  "note2":       "class_B",
  "filename":    "quiz_result",
  "submittedAt": "2026-07-29T10:00:00.000Z",
  "total":       24,
  "answered":    22,
  "unanswered":  [3, 15],
  "answers": {
    "1":  "b",
    "2":  "a",
    "3":  null,
    "4":  "c"
  }
}</pre>
</div>

<table class="attr-table">
  <thead><tr><th>欄位</th><th>說明</th></tr></thead>
  <tbody>
    <tr><td class="attr-name">examId</td><td>試卷編號（若有設定）</td></tr>
    <tr><td class="attr-name">note1 / note2</td><td>備註欄，可存作答者 ID、班級等（若有設定）</td></tr>
    <tr><td class="attr-name">filename</td><td>元件的 <code>submit-filename</code> 屬性值（若有設定）</td></tr>
    <tr><td class="attr-name">submittedAt</td><td>前端作答完成時間（ISO 8601 字串，含時區）</td></tr>
    <tr><td class="attr-name">total</td><td>題目總數</td></tr>
    <tr><td class="attr-name">answered</td><td>已作答題數</td></tr>
    <tr><td class="attr-name">unanswered</td><td>未作答的題號陣列</td></tr>
    <tr><td class="attr-name">answers</td><td>完整作答結果，鍵為題號字串，值為選項或文字，未作答為 <code>null</code></td></tr>
  </tbody>
</table>
</section>

<!-- ─────────────────── 後端 ─────────────────── -->
<section class="doc-section" id="backend">
<h2><span class="h-icon">🐘</span> 後端：submit-answer.php</h2>

<h3>初始設定</h3>
<p>開啟 <code>submit-answer.php</code>，修改頂端兩個常數與資料庫連線資訊：</p>

<div class="code-wrap">
  <span class="code-lang">PHP</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="php">// ① 修改資料表前綴與名稱
const TABLE_PREFIX = 'myapp_';             // 依專案修改
const TABLE_NAME   = 'answer_submissions'; // 實際表名 = myapp_answer_submissions

// ② 修改資料庫連線
$pdo = new PDO(
    'mysql:host=localhost;dbname=YOUR_DB;charset=utf8mb4',
    'YOUR_USER',
    'YOUR_PASSWORD',
    [ /* options */ ]
);
$pdo-&gt;exec("SET time_zone = '+08:00'");</pre>
</div>

<h3>createAnswerTable() — 自動建表</h3>
<p>只需傳入 PDO 物件，函式會以 <code>CREATE TABLE IF NOT EXISTS</code> 建立資料表，可在任何初始化點呼叫：</p>

<div class="code-wrap">
  <span class="code-lang">PHP</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="php">// 在 submit-answer.php 主流程中自動呼叫
createAnswerTable(getPdo());

// 或在獨立的 setup.php 中一次性執行
require 'submit-answer.php';
createAnswerTable(getPdo());
echo "資料表已建立";</pre>
</div>

<h3>回傳格式</h3>
<div class="code-wrap">
  <span class="code-lang">JSON Response</span>
<pre data-lang="json">// 成功（無批改）
{ "ok": true, "id": 123 }

// 成功（含答案金鑰，前端自動批改）
{ "ok": true, "id": 123, "answers": { "1":"b", "2":"c" } }

// 失敗
{ "ok": false, "error": "Database error" }</pre>
</div>

<h3>資料表欄位說明</h3>
<table class="attr-table">
  <thead><tr><th>欄位</th><th>類型</th><th>說明</th></tr></thead>
  <tbody>
    <tr><td class="attr-name">id</td><td>INT AUTO</td><td>主鍵，自動遞增</td></tr>
    <tr><td class="attr-name">exam_id</td><td>VARCHAR(100)</td><td>試卷編號</td></tr>
    <tr><td class="attr-name">note1</td><td>VARCHAR(255)</td><td>備註欄 1（作答者 ID 等）</td></tr>
    <tr><td class="attr-name">note2</td><td>VARCHAR(255)</td><td>備註欄 2（班級、session 等）</td></tr>
    <tr><td class="attr-name">filename</td><td>VARCHAR(100)</td><td>前端帶入的 filename</td></tr>
    <tr><td class="attr-name">submitted_at</td><td>DATETIME</td><td>前端作答時間（+08:00）</td></tr>
    <tr><td class="attr-name">total / answered</td><td>SMALLINT</td><td>總題數 / 已作答數</td></tr>
    <tr><td class="attr-name">unanswered</td><td>JSON</td><td>未作答題號陣列</td></tr>
    <tr><td class="attr-name">answers</td><td>JSON</td><td>完整作答結果</td></tr>
    <tr><td class="attr-name">ip</td><td>VARCHAR(45)</td><td>提交者 IP</td></tr>
    <tr><td class="attr-name">created_at</td><td>DATETIME</td><td>伺服器收到時間</td></tr>
  </tbody>
</table>
</section>

<!-- ─────────────────── 編輯器 ─────────────────── -->
<section class="doc-section" id="editor">
<h2><span class="h-icon">✏️</span> 試卷編輯器：exam-editor.php</h2>

<p>在瀏覽器中開啟 <code>exam-editor.php</code>，不需要資料庫，編輯狀態自動儲存於 localStorage。</p>

<h3>工作流程</h3>
<div class="flow">1. 在頂部輸入 <span class="fl-yellow">試卷編號</span> 與 <span class="fl-yellow">標題</span>

2. 左側點擊「＋ 選擇題區」或「＋ 填空題區」新增區段
   └─ ↑↓ 按鈕調整區段順序（題號自動重新計算）
   └─ ✕ 刪除整個區段

3. 右側編輯選中區段的題目
   ├─ 選擇題：可設定選項數（2–6）與大/小寫
   └─ 填空題：題目文字中用 ___ 標示空格

4. 點擊「👁 預覽試卷」確認整體呈現

5. 點擊「⬇ 匯出 JSON」
   ├─ 「試卷 JSON」tab：複製或下載 .json 檔（部署到伺服器）
   └─ 「嵌入 HTML」tab：複製元件 HTML 標籤貼入頁面

6. 需要繼續編輯時，點擊「匯入 JSON」貼入已匯出的 JSON</div>

<h3>嵌入 HTML 範例（編輯器自動生成）</h3>
<div class="code-wrap">
  <span class="code-lang">HTML</span>
<pre data-lang="html">&lt;!-- 試卷：IELTS Listening Test --&gt;
&lt;script src="answer-sheet.js"&gt;&lt;/script&gt;

&lt;!-- 第 1 區段：選擇題 Q1–Q20 --&gt;
&lt;answer-sheet
  src="exam-001.json"
  start-from="1"
  total="20"
  options="4"
  option-case="lower"
  per-column="10"
  submit-url="/submit-answer.php"
  exam-id="exam-001"
  note-1=""
  note-2=""
  theme="dark"&gt;
&lt;/answer-sheet&gt;

&lt;!-- 第 2 區段：填空題 Q21–Q30 --&gt;
&lt;fill-sheet
  src="exam-001.json"
  start-from="21"
  total="10"
  per-column="10"
  submit-url="/submit-answer.php"
  exam-id="exam-001"
  note-1=""
  note-2=""
  theme="dark"&gt;
&lt;/fill-sheet&gt;</pre>
</div>
</section>

<!-- ─────────────────── 完整範例 ─────────────────── -->
<section class="doc-section" id="full-example">
<h2><span class="h-icon">🚀</span> 完整整合範例</h2>

<p>一個含 8 題選擇題 + 4 題填空題的完整試卷頁，整合雙向連動、動態設定作答者 ID 與批改。</p>

<div class="code-wrap">
  <span class="code-lang">HTML — exam-page.html</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="html">&lt;!DOCTYPE html&gt;
&lt;html lang="zh-TW"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;title&gt;IELTS Practice Test&lt;/title&gt;
  &lt;script src="answer-sheet.js"&gt;&lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;

&lt;!-- ── 頁面題目（選擇題）── --&gt;
&lt;div class="q-item" data-q="1"&gt;
  &lt;p&gt;1. The word "enumerate" is closest in meaning to:&lt;/p&gt;
  &lt;p&gt;a) estimate  b) list one by one  c) measure  d) ignore&lt;/p&gt;
&lt;/div&gt;
&lt;!-- ... Q2–Q8 ... --&gt;

&lt;!-- ── 頁面題目（填空題）── --&gt;
&lt;div class="fill-item" data-q="9"&gt;
  &lt;p&gt;9. Urban farming can reduce _____ on long supply chains.&lt;/p&gt;
&lt;/div&gt;
&lt;!-- ... Q10–Q12 ... --&gt;

&lt;hr&gt;

&lt;!-- ── 選擇題答案卡 ── --&gt;
&lt;answer-sheet
  id="mcqSheet"
  total="8"
  per-column="8"
  submit-url="/submit-answer.php"
  exam-id="practice-01"
  answer-src="/answers-mcq.json"
  question-selector=".q-item"
  selected-color="lavender"
  hover-color="sky"
  theme="dark"
  width="100%"&gt;
&lt;/answer-sheet&gt;

&lt;!-- ── 填空題答案卡 ── --&gt;
&lt;fill-sheet
  id="fillSheet"
  total="4"
  start-from="9"
  submit-url="/submit-answer.php"
  exam-id="practice-01"
  answer-src="/answers-fill.json"
  question-selector=".fill-item"
  selected-color="sky"
  hover-color="focus"
  theme="dark"
  width="100%"&gt;
&lt;/fill-sheet&gt;

&lt;script&gt;
  // 登入後動態設定作答者 ID
  const userId = sessionStorage.getItem('userId') || '';
  document.getElementById('mcqSheet').setAttribute('note-1', userId);
  document.getElementById('fillSheet').setAttribute('note-1', userId);
&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</pre>
</div>

<div class="code-wrap">
  <span class="code-lang">JSON — answers-mcq.json</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="json">{
  "1": "b",
  "2": "b",
  "3": "c",
  "4": "b",
  "5": "b",
  "6": "b",
  "7": "c",
  "8": "c"
}</pre>
</div>

<div class="code-wrap">
  <span class="code-lang">JSON — answers-fill.json</span>
  <button class="code-copy-btn" onclick="copyCode(this)">複製</button>
<pre data-lang="json">{
  "9":  ["reliance", "dependence"],
  "10": "families",
  "11": "biodiversity",
  "12": "infrastructure"
}</pre>
</div>

<h3>快速部署清單</h3>
<table class="attr-table">
  <thead><tr><th>#</th><th>步驟</th><th>檔案</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>上傳元件</td><td><code>answer-sheet.js</code></td></tr>
    <tr><td>2</td><td>設定 DB 連線並上傳後端</td><td><code>submit-answer.php</code></td></tr>
    <tr><td>3</td><td>用編輯器設計試卷，匯出 JSON</td><td><code>exam-editor.php</code> → <code>exam.json</code></td></tr>
    <tr><td>4</td><td>準備答案金鑰 JSON（可選）</td><td><code>answers-mcq.json</code>、<code>answers-fill.json</code></td></tr>
    <tr><td>5</td><td>貼入編輯器產生的嵌入 HTML</td><td>你的試卷頁面</td></tr>
    <tr><td>6</td><td>測試送出並確認 DB 有資料</td><td>—</td></tr>
  </tbody>
</table>

<div class="callout callout-tip">
  <p><span class="callout-icon">💡</span>首次測試可省略 <code>submit-url</code>，搭配 <code>answer-src</code> 或 <code>setAnswerKey()</code> 直接在前端驗證批改功能，確認無誤後再接入後端。</p>
</div>
</section>

</main>
</div>

<div id="toast"></div>

<script>
/* ─── TOC active state ─── */
const allSections = document.querySelectorAll('.doc-section');
const allLinks    = document.querySelectorAll('.toc a');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      allLinks.forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.toc a[href="#${e.target.id}"]`);
      if (a) a.classList.add('active');
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });
allSections.forEach(s => io.observe(s));

/* ─── Copy code ─── */
function copyCode(btn) {
  const pre = btn.closest('.code-wrap').querySelector('pre');
  navigator.clipboard.writeText(pre.textContent.trim())
    .then(() => {
      btn.textContent = '✓ 已複製';
      setTimeout(() => btn.textContent = '複製', 2000);
    });
}

/* ─── Toast ─── */
let _tt;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ─── Syntax highlight ─── */
function highlight(pre) {
  const lang = pre.dataset.lang || '';
  let src = pre.textContent;

  // Escape HTML first
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  if (lang === 'html') {
    src = esc(src);
    src = src.replace(/(\/\/[^\n]*)/g, '<span class="cmt">$1</span>');
    src = src.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="cmt">$1</span>');
    src = src.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tag">$2</span>');
    src = src.replace(/\b([\w-]+)(=)/g, '<span class="at">$1</span>$2');
    src = src.replace(/(&quot;[^&]*?&quot;)/g, '<span class="str">$1</span>');
  } else if (lang === 'json') {
    src = esc(src);
    src = src.replace(/(&quot;[\w-]+&quot;)(\s*:)/g, '<span class="at">$1</span>$2');
    src = src.replace(/:\s*(&quot;[^&]*?&quot;)/g, ': <span class="str">$1</span>');
    src = src.replace(/:\s*(\d+)/g, ': <span class="num">$1</span>');
    src = src.replace(/:\s*(null|true|false)/g, ': <span class="kw">$1</span>');
  } else if (lang === 'php') {
    src = esc(src);
    src = src.replace(/(\/\/[^\n]*)/g, '<span class="cmt">$1</span>');
    src = src.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="cmt">$1</span>');
    src = src.replace(/\b(function|const|return|if|else|try|catch|new|array|null|true|false|static|require|echo)\b/g, '<span class="kw">$1</span>');
    src = src.replace(/(\$[\w]+)/g, '<span class="var">$1</span>');
    src = src.replace(/(&#x27;[^&#]*?&#x27;|&quot;[^&]*?&quot;)/g, '<span class="str">$1</span>');
  } else if (lang === 'js') {
    src = esc(src);
    src = src.replace(/(\/\/[^\n]*)/g, '<span class="cmt">$1</span>');
    src = src.replace(/\b(const|let|var|function|return|if|else|new|null|true|false|async|await|class)\b/g, '<span class="kw">$1</span>');
    src = src.replace(/(&#x27;[^&#]*?&#x27;|&quot;[^&]*?&quot;|`[^`]*?`)/g, '<span class="str">$1</span>');
  }

  pre.innerHTML = src;
}

document.querySelectorAll('pre[data-lang]').forEach(highlight);
</script>
</body>
</html>

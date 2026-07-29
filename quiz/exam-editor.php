<?php
/**
 * exam-editor.php
 * 試卷視覺編輯器
 * ─────────────────────────────────────────────────────────
 * 後台工具（無 AOP）
 * 支援選擇題 + 填空題穿插編排，匯出前端元件可讀 JSON
 */
?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>試卷視覺編輯器</title>
<style>
/* ─── 後台變數 ─── */
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

/* ─── Reset ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ─── Base（後台最小字體 18px）─── */
html { font-size: 18px; }
body {
  background: var(--bg);
  color: var(--shell);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ─── Header ─── */
.hdr {
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 300;
}
.hdr-logo {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--special);
  white-space: nowrap;
  flex-shrink: 0;
}
.hdr-sep {
  width: 1px;
  height: 24px;
  background: var(--border);
  flex-shrink: 0;
}
.hdr-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.hdr-field label { color: var(--dim); white-space: nowrap; }
.hdr-field input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--shell);
  padding: 5px 10px;
  font-size: 1rem;
  font-family: inherit;
  width: 160px;
}
.hdr-field input:focus { outline: none; border-color: var(--sky); }
.hdr-field input.wide   { width: 220px; }
.hdr-spacer { flex: 1; }

/* ─── Buttons ─── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 6px;
  border: 1.5px solid;
  cursor: pointer;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;
  transition: filter 0.15s, transform 0.1s;
  line-height: 1.2;
}
.btn:hover:not(:disabled)  { filter: brightness(1.25); }
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn:disabled              { opacity: 0.35; cursor: default; }

.btn-ghost   { background: transparent; border-color: var(--border); color: var(--shell); }
.btn-lav     { background: rgba(195,165,229,.14); border-color: var(--lav);     color: var(--lav); }
.btn-sky     { background: rgba(8,169,209,.14);   border-color: var(--sky);     color: var(--sky); }
.btn-safe    { background: rgba(64,201,154,.14);  border-color: var(--safe);    color: var(--safe); }
.btn-warn    { background: rgba(240,128,128,.14); border-color: var(--warn);    color: var(--warn); }
.btn-special { background: rgba(200,221,90,.14);  border-color: var(--special); color: var(--special); }
.btn-sm { padding: 4px 12px; font-size: 0.88rem; }

/* ─── Layout ─── */
.main {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  overflow: hidden;
}

/* ─── Sidebar ─── */
.sidebar {
  background: var(--panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 65px;
  height: calc(100vh - 65px);
  overflow-y: auto;
}
.sb-hdr {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sb-hdr-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--dim);
}
.sb-total {
  font-weight: 700;
  color: var(--special);
}
.sb-add-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 12px 10px;
  border-bottom: 1px solid var(--border);
}
.sb-add-row .btn {
  justify-content: center;
  font-size: 0.88rem;
  padding: 6px 8px;
}
.sec-list {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}
.sec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 7px;
  border: 1.5px solid var(--border);
  background: var(--panel2);
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.sec-item:hover { border-color: var(--dim); }
.sec-item.active   { border-color: var(--lav); background: rgba(195,165,229,.08); }
.sec-item.active.fill { border-color: var(--sky); background: rgba(8,169,209,.08); }
.sec-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 3px;
  flex-shrink: 0;
  white-space: nowrap;
}
.badge-mcq  { background: rgba(195,165,229,.2); color: var(--lav); }
.badge-fill { background: rgba(8,169,209,.2);   color: var(--sky); }
.sec-info { flex: 1; min-width: 0; }
.sec-name  { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sec-range { font-size: 0.8rem; color: var(--dim); margin-top: 2px; }
.sec-ctrl  { display: flex; gap: 2px; flex-shrink: 0; }
.ico {
  width: 28px; height: 28px;
  background: transparent;
  border: none;
  color: var(--dim);
  cursor: pointer;
  border-radius: 4px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .15s, background .15s;
  flex-shrink: 0;
}
.ico:hover          { color: var(--shell); background: rgba(255,255,255,.07); }
.ico:disabled       { opacity: 0.2; cursor: default; }
.ico.del:hover      { color: var(--warn); }

/* ─── Editor ─── */
.editor {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: calc(100vh - 65px);
}
.ed-toolbar {
  padding: 14px 24px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--panel2);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 100;
}
.ed-sec-title {
  font-size: 1.05rem;
  font-weight: 700;
  flex-shrink: 0;
}
.mcq-cfg {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.mcq-cfg label { color: var(--dim); }
.mcq-cfg select,
.mcq-cfg input[type=number] {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--shell);
  padding: 5px 9px;
  font-size: 1rem;
  font-family: inherit;
}
.mcq-cfg select:focus,
.mcq-cfg input:focus { outline: 1px solid var(--sky); border-color: var(--sky); }

.ed-body {
  flex: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ed-foot {
  padding: 12px 24px 24px;
  border-top: 1px solid var(--border);
}

/* ─── Empty states ─── */
.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--dim);
}
.empty .ei { font-size: 2.5rem; margin-bottom: 12px; opacity: .4; }
.empty p { font-size: 0.9rem; }

/* ─── Question card ─── */
.q-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 18px;
  transition: border-color .15s;
  position: relative;
}
.q-card:hover { border-color: var(--dim); }
.q-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}
.q-no {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: var(--dim);
  flex-shrink: 0;
  padding-top: 6px;
  min-width: 2.6rem;
}
.q-textarea {
  flex: 1;
  background: var(--panel2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--shell);
  font-family: inherit;
  font-size: 1rem;
  padding: 8px 10px;
  resize: vertical;
  line-height: 1.55;
  width: 100%;
}
.q-textarea:focus { outline: none; border-color: var(--sky); }
.q-del-btn {
  position: absolute;
  top: 12px; right: 12px;
}

/* MCQ choices grid */
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-left: calc(2.6rem + 10px);
}
.ch-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ch-lbl {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: var(--dim);
  flex-shrink: 0;
  width: 1.5rem;
}
.ch-input {
  flex: 1;
  background: var(--panel2);
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--shell);
  font-family: inherit;
  font-size: 1rem;
  padding: 5px 9px;
}
.ch-input:focus { outline: none; border-color: var(--lav); }

/* ─── Modals ─── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.78);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px 40px;
  overflow-y: auto;
}
.modal {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  width: 100%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  max-height: 86vh;
}
.modal-hdr {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

/* ─── Preview ─── */
.preview-paper {
  background: var(--panel2);
  border-radius: 8px;
  padding: 28px 36px;
  max-width: 740px;
  margin: 0 auto;
}
.pv-title {
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  color: var(--special);
  margin-bottom: 4px;
}
.pv-meta {
  text-align: center;
  color: var(--dim);
  font-size: 0.88rem;
  margin-bottom: 28px;
}
.pv-sec-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: var(--dim);
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
  margin: 24px 0 14px;
}
.pv-sec-label:first-of-type { margin-top: 0; }
.pv-q {
  padding: 12px 14px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 12px;
}
.pv-q-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.pv-qno {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: var(--dim);
  flex-shrink: 0;
  padding-top: 2px;
  min-width: 2.6rem;
}
.pv-qtext { font-size: 1rem; line-height: 1.6; flex: 1; }
.pv-choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 20px;
  margin-top: 8px;
  padding-left: calc(2.6rem + 10px);
}
.pv-ch { display: flex; gap: 6px; color: var(--shell); opacity: .85; }
.pv-ch-lbl { font-family: 'Courier New', monospace; font-weight: 700; color: var(--dim); flex-shrink: 0; }
.pv-blank {
  display: inline-block;
  border-bottom: 1.5px solid var(--sky);
  min-width: 100px;
  color: var(--sky);
  margin: 0 3px;
  opacity: .55;
  vertical-align: bottom;
}

/* ─── Export / code ─── */
.exp-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 14px;
}
.exp-tab {
  padding: 8px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: var(--dim);
  font-size: 1rem;
  transition: color .15s, border-color .15s;
}
.exp-tab.on { color: var(--sky); border-color: var(--sky); }

.code-wrap {
  position: relative;
}
.code-copy {
  position: absolute;
  top: 8px; right: 8px;
  z-index: 2;
}
.code-block {
  background: #080908;
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--focus);
  white-space: pre;
  overflow: auto;
  max-height: 58vh;
  line-height: 1.65;
  tab-size: 2;
}
.code-dl-row {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

/* ─── Import textarea ─── */
.import-ta {
  width: 100%;
  background: var(--panel2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--shell);
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  padding: 12px;
  resize: vertical;
  line-height: 1.55;
  margin-top: 10px;
}
.import-ta:focus { outline: 1px solid var(--sky); border-color: var(--sky); }

/* ─── Toast ─── */
.toast {
  position: fixed;
  bottom: 28px; right: 28px;
  background: var(--panel);
  border: 1px solid var(--safe);
  color: var(--safe);
  padding: 10px 20px;
  border-radius: 7px;
  font-size: 1rem;
  z-index: 2000;
  transform: translateY(80px);
  opacity: 0;
  transition: transform .25s, opacity .25s;
  pointer-events: none;
}
.toast.show { transform: translateY(0); opacity: 1; }
</style>
</head>
<body>

<!-- ════════════════════════ HEADER ════════════════════════ -->
<header class="hdr">
  <div class="hdr-logo">📋 試卷視覺編輯器</div>
  <div class="hdr-sep"></div>

  <div class="hdr-field">
    <label>試卷編號</label>
    <input type="text" id="inExamId" placeholder="exam-001"
           oninput="X.exam.examId=this.value;autoSave()">
  </div>

  <div class="hdr-field">
    <label>標題</label>
    <input type="text" id="inExamTitle" class="wide" placeholder="試卷標題"
           oninput="X.exam.title=this.value;autoSave()">
  </div>

  <div class="hdr-spacer"></div>

  <button class="btn btn-ghost" onclick="doImport()">匯入 JSON</button>
  <button class="btn btn-sky"   onclick="doPreview()">👁 預覽試卷</button>
  <button class="btn btn-special" onclick="doExport()">⬇ 匯出 JSON</button>
</header>

<!-- ════════════════════════ MAIN ════════════════════════ -->
<div class="main">

  <!-- ── Sidebar ── -->
  <aside class="sidebar">
    <div class="sb-hdr">
      <span class="sb-hdr-label">試卷區段</span>
      <span class="sb-total" id="sbTotal">共 0 題</span>
    </div>

    <div class="sb-add-row">
      <button class="btn btn-lav" onclick="addSection('mcq')">＋ 選擇題區</button>
      <button class="btn btn-sky" onclick="addSection('fill')">＋ 填空題區</button>
    </div>

    <div class="sec-list" id="secList"></div>
  </aside>

  <!-- ── Editor ── -->
  <div class="editor" id="editor">
    <div class="ed-toolbar" id="edToolbar">
      <span style="color:var(--dim);">← 從左側新增或選擇區段</span>
    </div>
    <div class="ed-body" id="edBody">
      <div class="empty">
        <div class="ei">✏️</div>
        <p>點擊左側「＋ 選擇題區」或「＋ 填空題區」新增第一個題目區段</p>
      </div>
    </div>
    <div class="ed-foot" id="edFoot" style="display:none">
      <button class="btn btn-ghost" id="addQBtn" onclick="addQuestion()">＋ 新增題目</button>
    </div>
  </div>

</div>

<!-- ════════════ PREVIEW MODAL ════════════ -->
<div class="overlay" id="mPreview" style="display:none"
     onclick="if(event.target===this)closeModal('mPreview')">
  <div class="modal">
    <div class="modal-hdr">
      <span>👁 試卷預覽</span>
      <button class="btn btn-ghost btn-sm" onclick="closeModal('mPreview')">關閉</button>
    </div>
    <div class="modal-body" id="previewBody"></div>
  </div>
</div>

<!-- ════════════ EXPORT MODAL ════════════ -->
<div class="overlay" id="mExport" style="display:none"
     onclick="if(event.target===this)closeModal('mExport')">
  <div class="modal">
    <div class="modal-hdr">
      <span>⬇ 匯出</span>
      <button class="btn btn-ghost btn-sm" onclick="closeModal('mExport')">關閉</button>
    </div>
    <div class="modal-body">
      <div class="exp-tabs">
        <div class="exp-tab on"  id="etab-json"  onclick="switchExpTab('json')">試卷 JSON</div>
        <div class="exp-tab"     id="etab-embed" onclick="switchExpTab('embed')">嵌入 HTML</div>
      </div>
      <div class="code-wrap">
        <button class="btn btn-ghost btn-sm code-copy" onclick="copyCode()">複製</button>
        <pre class="code-block" id="expCode"></pre>
      </div>
      <div class="code-dl-row">
        <button class="btn btn-safe btn-sm" onclick="downloadJson()">⬇ 下載 .json</button>
      </div>
    </div>
  </div>
</div>

<!-- ════════════ IMPORT MODAL ════════════ -->
<div class="overlay" id="mImport" style="display:none"
     onclick="if(event.target===this)closeModal('mImport')">
  <div class="modal" style="max-width:720px">
    <div class="modal-hdr">
      <span>匯入 JSON</span>
      <button class="btn btn-ghost btn-sm" onclick="closeModal('mImport')">關閉</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--dim);font-size:0.9rem;">貼入先前匯出的試卷 JSON，將覆蓋目前編輯內容。</p>
      <textarea class="import-ta" id="importTA" rows="18"
                placeholder='{"examId":"","title":"","sections":[...]}'></textarea>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-ghost" onclick="closeModal('mImport')">取消</button>
        <button class="btn btn-safe"  onclick="confirmImport()">確認匯入</button>
      </div>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<!-- ════════════════════════ SCRIPT ════════════════════════ -->
<script>
/* ────────────────────────────────────────────────────────
   State
   ──────────────────────────────────────────────────────── */
const LS_KEY = 'exam_editor_v1';
let selIdx   = null;   // 目前選中的 section index
let expTab   = 'json'; // 匯出 tab

/** 全域試卷狀態（短名 X = Exam 縮寫，方便 inline handlers）*/
const X = {
  exam: { examId: '', title: '', sections: [] }
};

/* ────────────────────────────────────────────────────────
   UID / 工廠
   ──────────────────────────────────────────────────────── */
let _seq = 0;
const uid = () => 'u' + (++_seq) + Math.random().toString(36).slice(2,5);

const mkMcqSec  = () => ({ id:uid(), type:'mcq', options:4, optionCase:'lower', questions:[] });
const mkFillSec = () => ({ id:uid(), type:'fill', questions:[] });
const mkMcqQ    = n  => ({ id:uid(), text:'', choices: Array.from({length:n}, ()=>'') });
const mkFillQ   = () => ({ id:uid(), text:'' });

/* ────────────────────────────────────────────────────────
   計算輔助
   ──────────────────────────────────────────────────────── */
function startFrom(i) {
  let n = 1;
  for (let j = 0; j < i; j++) n += X.exam.sections[j].questions.length;
  return n;
}
const totalQ = () => X.exam.sections.reduce((s, sec) => s + sec.questions.length, 0);

function qRange(i) {
  const sec = X.exam.sections[i];
  if (!sec.questions.length) return '（尚無題目）';
  const s = startFrom(i);
  return `Q${s}–Q${s + sec.questions.length - 1}（${sec.questions.length} 題）`;
}

function labels(count, cas) {
  return Array.from({length:count}, (_, i) => {
    const c = String.fromCharCode(97 + i);
    return cas === 'upper' ? c.toUpperCase() : c;
  });
}

/* ────────────────────────────────────────────────────────
   Render
   ──────────────────────────────────────────────────────── */
function render() { renderSidebar(); renderEditor(); autoSave(); }

function renderSidebar() {
  document.getElementById('sbTotal').textContent = `共 ${totalQ()} 題`;
  const secs = X.exam.sections;
  document.getElementById('secList').innerHTML = secs.map((sec, i) => `
    <div class="sec-item${i===selIdx?' active':''}${sec.type==='fill'?' fill':''}"
         onclick="selectSec(${i})">
      <span class="sec-badge ${sec.type==='mcq'?'badge-mcq':'badge-fill'}">
        ${sec.type==='mcq'?'選擇':'填空'}
      </span>
      <div class="sec-info">
        <div class="sec-name">第 ${i+1} 區段</div>
        <div class="sec-range">${qRange(i)}</div>
      </div>
      <div class="sec-ctrl">
        <button class="ico" onclick="event.stopPropagation();moveSec(${i},-1)"
                ${i===0?'disabled':''} title="上移">↑</button>
        <button class="ico" onclick="event.stopPropagation();moveSec(${i},1)"
                ${i===secs.length-1?'disabled':''} title="下移">↓</button>
        <button class="ico del" onclick="event.stopPropagation();delSec(${i})"
                title="刪除區段">✕</button>
      </div>
    </div>`).join('');
}

function renderEditor() {
  const toolbar = document.getElementById('edToolbar');
  const body    = document.getElementById('edBody');
  const foot    = document.getElementById('edFoot');

  if (selIdx === null || selIdx >= X.exam.sections.length) {
    toolbar.innerHTML = `<span style="color:var(--dim);">← 從左側新增或選擇區段</span>`;
    body.innerHTML = `<div class="empty"><div class="ei">✏️</div>
      <p>點擊左側「＋ 選擇題區」或「＋ 填空題區」新增第一個題目區段</p></div>`;
    foot.style.display = 'none';
    return;
  }

  const sec   = X.exam.sections[selIdx];
  const sf    = startFrom(selIdx);
  const isMcq = sec.type === 'mcq';

  /* toolbar */
  if (isMcq) {
    toolbar.innerHTML = `
      <span class="ed-sec-title" style="color:var(--lav);">第 ${selIdx+1} 區段：選擇題</span>
      <div class="mcq-cfg">
        <label>選項數</label>
        <input type="number" min="2" max="6" value="${sec.options}" style="width:64px"
               onchange="changeOpts(${selIdx}, +this.value)">
        <label>字母</label>
        <select onchange="setProp(${selIdx},'optionCase',this.value)">
          <option value="lower"${sec.optionCase==='lower'?' selected':''}>小寫 a b c d</option>
          <option value="upper"${sec.optionCase==='upper'?' selected':''}>大寫 A B C D</option>
        </select>
      </div>`;
  } else {
    toolbar.innerHTML = `
      <span class="ed-sec-title" style="color:var(--sky);">第 ${selIdx+1} 區段：填空題</span>
      <span style="color:var(--dim);font-size:0.88rem;">空格位置請在題目中填入 ___ 或 ______</span>`;
  }

  /* question cards */
  if (!sec.questions.length) {
    body.innerHTML = `<div class="empty" style="padding:40px 0">
      <p style="color:var(--dim);">此區段尚無題目，點擊下方「新增題目」開始</p></div>`;
  } else {
    body.innerHTML = sec.questions.map((q, qi) => {
      const no = sf + qi;
      if (isMcq) {
        const lbls = labels(sec.options, sec.optionCase);
        const chHtml = lbls.map((l, ci) => `
          <div class="ch-row">
            <span class="ch-lbl">${l}.</span>
            <input class="ch-input" type="text"
                   value="${ea(q.choices[ci]||'')}"
                   placeholder="選項 ${l}"
                   oninput="updChoice(${selIdx},${qi},${ci},this.value)">
          </div>`).join('');
        return `
          <div class="q-card">
            <button class="ico del q-del-btn" onclick="delQ(${selIdx},${qi})" title="刪除">✕</button>
            <div class="q-top">
              <span class="q-no">Q${no}.</span>
              <textarea class="q-textarea" rows="2"
                        placeholder="題目文字（支援換行）"
                        oninput="updQText(${selIdx},${qi},this.value)">${eh(q.text)}</textarea>
            </div>
            <div class="choices">${chHtml}</div>
          </div>`;
      } else {
        return `
          <div class="q-card">
            <button class="ico del q-del-btn" onclick="delQ(${selIdx},${qi})" title="刪除">✕</button>
            <div class="q-top">
              <span class="q-no">Q${no}.</span>
              <textarea class="q-textarea" rows="2"
                        placeholder="題目文字，空格位置用 ___ 標示"
                        oninput="updQText(${selIdx},${qi},this.value)">${eh(q.text)}</textarea>
            </div>
          </div>`;
      }
    }).join('');
  }

  foot.style.display = '';
  document.getElementById('addQBtn').textContent =
    isMcq ? '＋ 新增選擇題' : '＋ 新增填空題';
}

/* ────────────────────────────────────────────────────────
   Actions
   ──────────────────────────────────────────────────────── */
function addSection(type) {
  X.exam.sections.push(type === 'mcq' ? mkMcqSec() : mkFillSec());
  selIdx = X.exam.sections.length - 1;
  render();
  toast(`已新增${type==='mcq'?'選擇題':'填空題'}區段`);
}

function selectSec(i) { selIdx = i; render(); }

function moveSec(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= X.exam.sections.length) return;
  [X.exam.sections[i], X.exam.sections[j]] = [X.exam.sections[j], X.exam.sections[i]];
  if (selIdx === i) selIdx = j;
  else if (selIdx === j) selIdx = i;
  render();
}

function delSec(i) {
  if (!confirm(`確定刪除第 ${i+1} 區段（${qRange(i)}）？此操作無法復原。`)) return;
  X.exam.sections.splice(i, 1);
  if (selIdx >= X.exam.sections.length) selIdx = X.exam.sections.length - 1;
  if (selIdx < 0) selIdx = null;
  render();
}

function addQuestion() {
  if (selIdx === null) return;
  const sec = X.exam.sections[selIdx];
  sec.questions.push(sec.type === 'mcq' ? mkMcqQ(sec.options) : mkFillQ());
  render();
  setTimeout(() => {
    const b = document.getElementById('edBody');
    b.scrollTop = b.scrollHeight;
  }, 50);
}

function delQ(si, qi) {
  X.exam.sections[si].questions.splice(qi, 1);
  render();
}

function updQText(si, qi, v) {
  X.exam.sections[si].questions[qi].text = v;
  document.getElementById('sbTotal').textContent = `共 ${totalQ()} 題`;
  // Refresh sidebar ranges
  document.querySelectorAll('.sec-range').forEach((el, i) => {
    el.textContent = qRange(i);
  });
  autoSave();
}

function updChoice(si, qi, ci, v) {
  X.exam.sections[si].questions[qi].choices[ci] = v;
  autoSave();
}

function setProp(si, key, val) {
  X.exam.sections[si][key] = val;
  render();
}

function changeOpts(si, n) {
  n = Math.max(2, Math.min(6, n || 4));
  X.exam.sections[si].options = n;
  X.exam.sections[si].questions.forEach(q => {
    while (q.choices.length < n) q.choices.push('');
    q.choices = q.choices.slice(0, n);
  });
  render();
}

/* ────────────────────────────────────────────────────────
   JSON 生成
   ──────────────────────────────────────────────────────── */
function buildJson() {
  const sections = X.exam.sections.map((sec, i) => {
    const sf   = startFrom(i);
    const base = { type: sec.type, startFrom: sf, count: sec.questions.length };
    if (sec.type === 'mcq') {
      base.options    = sec.options;
      base.optionCase = sec.optionCase;
    }
    base.questions = sec.questions.map((q, qi) => {
      const o = { no: sf + qi, text: q.text };
      if (sec.type === 'mcq') o.choices = [...q.choices];
      return o;
    });
    return base;
  });

  return {
    examId:         X.exam.examId  || '',
    title:          X.exam.title   || '',
    totalQuestions: totalQ(),
    createdAt:      new Date().toISOString(),
    sections,
  };
}

function buildEmbed() {
  const j    = buildJson();
  const file = (j.examId || 'exam') + '.json';
  const url  = '/submit-answer.php';

  const lines = [
    `<!-- ──────────────────────────────────────────── -->`,
    `<!-- 試卷：${j.title || j.examId || '（未命名）'} -->`,
    `<!-- 共 ${j.totalQuestions} 題，${j.sections.length} 個區段 -->`,
    `<!-- ──────────────────────────────────────────── -->`,
    ``,
    `<script src="answer-sheet.js"><\/script>`,
    ``,
  ];

  j.sections.forEach((sec, idx) => {
    const tag  = sec.type === 'mcq' ? 'answer-sheet' : 'fill-sheet';
    const end  = sec.startFrom + sec.count - 1;
    lines.push(`<!-- 第 ${idx+1} 區段：${sec.type==='mcq'?'選擇題':'填空題'} Q${sec.startFrom}–Q${end} -->`);
    lines.push(`<${tag}`);
    lines.push(`  src="${file}"`);
    lines.push(`  start-from="${sec.startFrom}"`);
    lines.push(`  total="${sec.count}"`);
    if (sec.type === 'mcq') {
      lines.push(`  options="${sec.options}"`);
      lines.push(`  option-case="${sec.optionCase}"`);
    }
    lines.push(`  per-column="10"`);
    lines.push(`  submit-url="${url}"`);
    if (j.examId) lines.push(`  exam-id="${j.examId}"`);
    lines.push(`  note-1=""`)
    lines.push(`  note-2=""`);
    lines.push(`  theme="dark"`);
    lines.push(`  selected-color="lavender"`);
    lines.push(`  hover-color="sky"`);
    lines.push(`  question-selector=".q-item"`);
    lines.push(`></${tag}>`);
    lines.push(``);
  });

  return lines.join('\n');
}

/* ────────────────────────────────────────────────────────
   預覽
   ──────────────────────────────────────────────────────── */
function doPreview() {
  const j = buildJson();
  let html = `<div class="preview-paper">`;
  html += `<div class="pv-title">${eh(j.title||'（未命名試卷）')}</div>`;
  if (j.examId || j.totalQuestions) {
    html += `<div class="pv-meta">`;
    if (j.examId) html += `試卷編號：${eh(j.examId)}&nbsp;&nbsp;`;
    html += `共 ${j.totalQuestions} 題</div>`;
  }

  j.sections.forEach((sec, si) => {
    const end  = sec.startFrom + sec.count - 1;
    const type = sec.type === 'mcq' ? '選擇題' : '填空題';
    html += `<div class="pv-sec-label">
      第 ${si+1} 區段 — ${type}
      Q${sec.startFrom}–Q${end}（${sec.count} 題）
    </div>`;

    if (!sec.questions.length) {
      html += `<p style="color:var(--dim);font-size:0.88rem;padding:4px 0 12px">（尚無題目）</p>`;
    }

    sec.questions.forEach(q => {
      const qtext = q.text
        ? eh(q.text).replace(/_{2,}/g, `<span class="pv-blank">&nbsp;&nbsp;&nbsp;&nbsp;</span>`)
        : `<em style="opacity:.35">（未填題目）</em>`;
      html += `<div class="pv-q"><div class="pv-q-row">
        <span class="pv-qno">Q${q.no}.</span>
        <span class="pv-qtext">${qtext}</span>
      </div>`;
      if (sec.type === 'mcq') {
        const lbls = labels(sec.options, sec.optionCase);
        html += `<div class="pv-choices">`;
        lbls.forEach((l, ci) => {
          const ch = q.choices[ci];
          html += `<div class="pv-ch">
            <span class="pv-ch-lbl">${l})</span>
            <span>${ch ? eh(ch) : `<em style="opacity:.3">（空白）</em>`}</span>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    });
  });

  html += `</div>`;
  document.getElementById('previewBody').innerHTML = html;
  document.getElementById('mPreview').style.display = 'flex';
}

/* ────────────────────────────────────────────────────────
   匯出
   ──────────────────────────────────────────────────────── */
let _expJson = '';

function doExport() {
  expTab = 'json';
  ['json','embed'].forEach(t => {
    document.getElementById('etab-'+t).classList.toggle('on', t===expTab);
  });
  refreshExpCode();
  document.getElementById('mExport').style.display = 'flex';
}

function switchExpTab(t) {
  expTab = t;
  ['json','embed'].forEach(k => {
    document.getElementById('etab-'+k).classList.toggle('on', k===t);
  });
  refreshExpCode();
}

function refreshExpCode() {
  _expJson = JSON.stringify(buildJson(), null, 2);
  document.getElementById('expCode').textContent =
    expTab === 'json' ? _expJson : buildEmbed();
}

function copyCode() {
  navigator.clipboard.writeText(document.getElementById('expCode').textContent)
    .then(() => toast('已複製到剪貼板'));
}

function downloadJson() {
  const j    = buildJson();
  const name = (j.examId || 'exam') + '.json';
  const blob = new Blob([JSON.stringify(j, null, 2)], {type:'application/json'});
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`已下載 ${name}`);
}

/* ────────────────────────────────────────────────────────
   匯入
   ──────────────────────────────────────────────────────── */
function doImport() {
  document.getElementById('importTA').value = '';
  document.getElementById('mImport').style.display = 'flex';
}

function confirmImport() {
  const raw = document.getElementById('importTA').value.trim();
  if (!raw) return;
  try {
    const j = JSON.parse(raw);
    if (!Array.isArray(j.sections)) throw new Error('缺少 sections 陣列');

    X.exam.examId = j.examId || '';
    X.exam.title  = j.title  || '';
    X.exam.sections = j.sections.map(sec => {
      const base = {
        id:   uid(),
        type: sec.type || 'mcq',
        questions: (sec.questions || []).map(q => {
          const o = { id: uid(), text: q.text || '' };
          if (sec.type !== 'fill') o.choices = (q.choices || []).map(c => c || '');
          return o;
        }),
      };
      if (sec.type !== 'fill') {
        base.options    = sec.options    || 4;
        base.optionCase = sec.optionCase || 'lower';
      }
      return base;
    });

    document.getElementById('inExamId').value    = X.exam.examId;
    document.getElementById('inExamTitle').value = X.exam.title;
    selIdx = X.exam.sections.length > 0 ? 0 : null;
    closeModal('mImport');
    render();
    toast('匯入成功');
  } catch(e) {
    alert('JSON 格式有誤：' + e.message);
  }
}

/* ────────────────────────────────────────────────────────
   Modal / Toast
   ──────────────────────────────────────────────────────── */
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

let _toastT;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ────────────────────────────────────────────────────────
   String utils
   ──────────────────────────────────────────────────────── */
const eh = s => String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ea = s => String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/* ────────────────────────────────────────────────────────
   LocalStorage 自動儲存 / 還原
   ──────────────────────────────────────────────────────── */
function autoSave() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ exam: X.exam, selIdx })); }
  catch(e) {}
}

function loadSaved() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    if (!d.exam || !Array.isArray(d.exam.sections)) return;
    X.exam = d.exam;
    selIdx = d.selIdx ?? null;
    document.getElementById('inExamId').value    = X.exam.examId || '';
    document.getElementById('inExamTitle').value = X.exam.title  || '';
  } catch(e) {}
}

/* ────────────────────────────────────────────────────────
   Init
   ──────────────────────────────────────────────────────── */
loadSaved();
render();
</script>
</body>
</html>

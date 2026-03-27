<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>icon-btn 元件展示</title>

  <!-- Bootstrap Icons CDN -->
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0c0d0c;
      color: #c6c7bd;
      font-family: 'Segoe UI', 'Noto Sans TC', sans-serif;
      font-size: 1rem;
      padding: 40px 20px;
    }

    h1 { color: #C3A5E5; font-size: 1.5rem; margin-bottom: 8px; }
    h2 { color: #04b5a3; font-size: 1.1rem; margin: 32px 0 12px; border-bottom: 1px solid #333; padding-bottom: 6px; }
    p  { color: #9a9b93; font-size: .9rem; margin-bottom: 16px; line-height: 1.7; }

    .card {
      background: #1a1b1a;
      border: 1px solid #2e2e2e;
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
    }

    code {
      display: block;
      background: #222322;
      border: 1px solid #383938;
      border-radius: 6px;
      padding: 16px;
      font-size: .82rem;
      color: #C8DD5A;
      line-height: 1.7;
      overflow-x: auto;
      white-space: pre;
      margin-top: 16px;
    }

    .demo-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }

    .label {
      font-size: .78rem;
      color: #7090A8;
      min-width: 80px;
    }
  </style>
</head>
<body>

<!-- ══════════════════════════════════════════════
     全域配置（整個頁面只需一個）
     api-url 指向 icon-btn-api.php 的路徑
════════════════════════════════════════════════ -->
<icon-btn-cfg
  api-url="icon-btn-api.php"
  default-theme="sky"
  default-font-size="1rem">
</icon-btn-cfg>


<h1>⚡ icon-btn 元件展示</h1>
<p>點擊按鈕後會透過 AJAX 更新資料庫，數字來自伺服器回傳。重新整理後仍保留您的選擇狀態（localStorage）。</p>


<!-- ── 展示 1：單一文章 ── -->
<h2>展示一：文章反應（id = article-42）</h2>
<div class="card">
  <div class="demo-row">
    <span class="label">Sky 主題</span>

    <?php
      /* 從資料庫撈取初始數量（示意，實際依您的資料庫邏輯） */
      // $total_heart = (int)($counts['bi-heart']       ?? 0);
      // $total_fire  = (int)($counts['bi-fire']        ?? 0);
      // $total_laugh = (int)($counts['bi-emoji-laugh'] ?? 0);
      $total_heart = 18;
      $total_fire  = 7;
      $total_laugh = 4;
    ?>

    <icon-btn id="article-42" theme="sky" default-font-size="1rem">
      <btn-item icon="bi-heart"       text="喜愛"  value="<?php echo $total_heart ?>"></btn-item>
      <btn-item icon="bi-fire"        text="熱門"  value="<?php echo $total_fire ?>"></btn-item>
      <btn-item icon="bi-emoji-laugh" text="有趣"  value="<?php echo $total_laugh ?>"></btn-item>
    </icon-btn>
  </div>

  <code>&lt;icon-btn id="article-42" theme="sky"&gt;
  &lt;btn-item icon="bi-heart"       text="喜愛"  value="&lt;?php echo $total_heart ?&gt;"&gt;&lt;/btn-item&gt;
  &lt;btn-item icon="bi-fire"        text="熱門"  value="&lt;?php echo $total_fire ?&gt;"&gt;&lt;/btn-item&gt;
  &lt;btn-item icon="bi-emoji-laugh" text="有趣"  value="&lt;?php echo $total_laugh ?&gt;"&gt;&lt;/btn-item&gt;
&lt;/icon-btn&gt;</code>
</div>


<!-- ── 展示 2：各色主題 ── -->
<h2>展示二：主題色彩一覽</h2>
<div class="card">
  <div class="demo-row">
    <span class="label">sky</span>
    <icon-btn id="demo-sky" theme="sky">
      <btn-item icon="bi-hand-thumbs-up" text="讚" value="3"></btn-item>
    </icon-btn>
  </div>
  <div class="demo-row">
    <span class="label">lavender</span>
    <icon-btn id="demo-lavender" theme="lavender">
      <btn-item icon="bi-star" text="收藏" value="11"></btn-item>
    </icon-btn>
  </div>
  <div class="demo-row">
    <span class="label">special</span>
    <icon-btn id="demo-special" theme="special">
      <btn-item icon="bi-lightning" text="精選" value="2"></btn-item>
    </icon-btn>
  </div>
  <div class="demo-row">
    <span class="label">warning</span>
    <icon-btn id="demo-warning" theme="warning">
      <btn-item icon="bi-exclamation-triangle" text="需注意" value="1"></btn-item>
    </icon-btn>
  </div>
  <div class="demo-row">
    <span class="label">orange</span>
    <icon-btn id="demo-orange" theme="orange">
      <btn-item icon="bi-cup-hot" text="請喝茶" value="5"></btn-item>
    </icon-btn>
  </div>
  <div class="demo-row">
    <span class="label">pink</span>
    <icon-btn id="demo-pink" theme="pink">
      <btn-item icon="bi-flower1" text="可愛" value="8"></btn-item>
    </icon-btn>
  </div>
</div>


<!-- ── 展示 3：6 個按鈕上限 ── -->
<h2>展示三：最多 6 個反應</h2>
<div class="card">
  <icon-btn id="article-99" theme="yellow" default-font-size=".95rem">
    <btn-item icon="bi-heart-fill"       text="喜愛"   value="22"></btn-item>
    <btn-item icon="bi-hand-thumbs-up"   text="讚"     value="15"></btn-item>
    <btn-item icon="bi-emoji-laughing"   text="有趣"   value="9"></btn-item>
    <btn-item icon="bi-emoji-surprise"   text="驚訝"   value="3"></btn-item>
    <btn-item icon="bi-emoji-frown"      text="難過"   value="1"></btn-item>
    <btn-item icon="bi-hand-thumbs-down" text="不喜歡" value="0"></btn-item>
  </icon-btn>
</div>


<!-- ── 展示 4：純圖示（無文字）── -->
<h2>展示四：純圖示（不填 text）</h2>
<div class="card">
  <icon-btn id="article-7" theme="salmon">
    <btn-item icon="bi-heart"            value="6"></btn-item>
    <btn-item icon="bi-bookmark"         value="2"></btn-item>
    <btn-item icon="bi-share"            value="1"></btn-item>
  </icon-btn>
</div>


<!-- ── icon-btn.js（放在 </body> 前） ── -->
<script src="icon-btn.js"></script>
</body>
</html>

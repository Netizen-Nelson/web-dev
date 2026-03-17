(function (G) {
    'use strict';
    var Config = {
        uploadUrl : 'upload_audio.php',
        apiUrl    : 'practice_api.php',
        maxMb     : 35,
        autoInit  : true,
        // ── 色彩主題 ─────────────────────────────────────────────
        theme: {
            accent  : 'var(--lavender,#C3A5E5)', 
            correct : 'var(--safe,#81E6D9)',        // 上傳成功色
            wrong   : 'var(--warning,#F08080)',     // 錯誤色
            hint    : 'var(--attention,#E5E5A6)',   // 提示左邊框
            submit  : 'var(--lavender,#C3A5E5)',    // 送出按鈕背景
        },
    };

    // ── CSS 注入 ─────────────────────────────────────────────────
    var _cssEl = null;
    function injectCSS() {
        if (!_cssEl) {
            _cssEl = document.createElement('style');
            _cssEl.id = 'bp-record-styles';
            document.head.appendChild(_cssEl);
        }
        var t = Config.theme;
        _cssEl.textContent = [
            '.bp-record{font-size:1rem;}',

            /* 題目 */
            '.bp-record-question{color:var(--shell,#c6c7bd);line-height:1.75;',
            'font-size:.95rem;margin-bottom:14px;}',

            /* 提示文字 */
            '.bp-record-hint{font-size:.8rem;color:var(--shell-dim,#888);',
            'margin-bottom:12px;padding:6px 10px;',
            'border-left:2px solid ' + t.hint + ';',
            'background:rgba(229,229,166,.07);}',

            /* 上傳區域 */
            '.bp-record-zone{',
            'border:2px dashed var(--card-border,#3a3b3a);',
            'border-radius:8px;padding:24px 20px;text-align:center;',
            'cursor:pointer;transition:border-color .2s,background .2s;',
            'margin-bottom:12px;}',
            '.bp-record-zone:hover,.bp-record-zone.drag-over{',
            'border-color:' + t.accent + ';',
            'background:rgba(195,165,229,.05);}',
            '.bp-record-zone.has-file{',
            'border-color:' + t.correct + ';',
            'background:rgba(129,230,217,.04);}',
            '.bp-record-zone.error{',
            'border-color:' + t.wrong + ';',
            'background:rgba(240,128,128,.04);}',
            '.bp-record-zone input[type="file"]{display:none;}',

            /* 上傳區域圖示 */
            '.bp-record-icon{font-size:1.8rem;',
            'color:var(--shell-dim,#888);margin-bottom:8px;}',
            '.bp-record-zone.has-file .bp-record-icon{color:' + t.correct + ';}',
            '.bp-record-zone.error .bp-record-icon{color:' + t.wrong + ';}',

            /* 上傳區域文字 */
            '.bp-record-label{font-size:.85rem;color:var(--shell-dim,#888);}',
            '.bp-record-zone.has-file .bp-record-label{color:' + t.correct + ';}',
            '.bp-record-zone.error .bp-record-label{color:' + t.wrong + ';}',
            '.bp-record-filename{font-size:.78rem;',
            'color:var(--lavender,#C3A5E5);margin-top:4px;',
            'font-family:monospace;word-break:break-all;}',
            '.bp-record-filesize{font-size:.72rem;',
            'color:var(--shell-dim,#888);margin-top:2px;}',
            '.bp-record-formatlabel{font-size:.72rem;',
            'color:var(--shell-dim,#555);margin-top:6px;}',

            /* 進度條 */
            '.bp-record-progress{',
            'height:3px;border-radius:2px;',
            'background:var(--card-border,#3a3b3a);',
            'margin-bottom:10px;overflow:hidden;display:none;}',
            '.bp-record-progress.show{display:block;}',
            '.bp-record-progress-bar{',
            'height:100%;width:0%;',
            'background:' + t.accent + ';',
            'transition:width .2s;}',

            /* 已上傳播放列 */
            '.bp-record-uploaded{',
            'background:rgba(129,230,217,.06);',
            'border:1px solid ' + t.correct + ';',
            'border-radius:6px;padding:10px 14px;',
            'margin-bottom:12px;display:none;}',
            '.bp-record-uploaded.show{display:block;}',
            '.bp-record-uploaded-label{',
            'font-size:.75rem;color:' + t.correct + ';',
            'font-weight:600;margin-bottom:6px;}',
            '.bp-record-uploaded audio{',
            'width:100%;height:36px;',
            'outline:none;display:block;}',

            /* 按鈕 */
            '.bp-record-submit{',
            'background:' + t.submit + ';color:#0c0d0c;',
            'border:none;border-radius:6px;padding:8px 20px;',
            'font-size:.85rem;font-weight:700;cursor:pointer;',
            'transition:opacity .2s;}',
            '.bp-record-submit:disabled{opacity:.35;cursor:default;}',

            '.bp-record-retry{',
            'background:none;border:1px solid var(--card-border,#3a3b3a);',
            'color:var(--shell-dim,#888);border-radius:6px;',
            'padding:7px 18px;font-size:.82rem;cursor:pointer;',
            'margin-left:8px;transition:border-color .15s,color .15s;}',
            '.bp-record-retry:hover{border-color:' + t.accent + ';color:' + t.accent + ';}',

            /* 狀態訊息 */
            '.bp-record-msg{',
            'font-size:.82rem;margin-bottom:8px;padding:6px 10px;',
            'border-radius:5px;line-height:1.5;}',
            '.bp-record-msg.ok{',
            'background:rgba(129,230,217,.1);',
            'border:1px solid ' + t.correct + ';color:' + t.correct + ';}',
            '.bp-record-msg.err{',
            'background:rgba(240,128,128,.1);',
            'border:1px solid ' + t.wrong + ';color:' + t.wrong + ';}',
        ].join('');
    }

    // ── 工具 ─────────────────────────────────────────────────────
    function renderQuestion(html) {
        if (G.RichInput && typeof G.RichInput.render === 'function') {
            return G.RichInput.render(html);
        }
        return html || '';
    }

    function formatBytes(bytes) {
        if (bytes < 1024)       return bytes + ' B';
        if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
        return (bytes/1024/1024).toFixed(1) + ' MB';
    }

    // ── BpRecordWidget ───────────────────────────────────────────
    function BpRecordWidget(el) {
        this.el         = el;
        this.payload    = {};
        this._file      = null;      // 目前選取的 File 物件
        this._uploaded  = null;      // { filename, url } 上傳成功後
        this._uploading = false;
        this._parse();
        this._render();
    }

    BpRecordWidget.prototype._parse = function () {
        try {
            this.payload = JSON.parse(this.el.getAttribute('data-payload') || '{}');
        } catch (e) {
            this.payload = {};
        }
        var el = this.el;
        this._uploadUrl  = el.getAttribute('data-upload-url') || Config.uploadUrl;
        this._apiUrl     = el.getAttribute('data-api-url')    || Config.apiUrl;
        this._maxMb      = parseFloat(el.getAttribute('data-max-mb') || Config.maxMb);
        this._practiceId = parseInt(el.getAttribute('data-practice-id') || '0', 10);
        this._unitId     = parseInt(el.getAttribute('data-unit-id')     || '0', 10);
        this._sectionId  = parseInt(el.getAttribute('data-section-id') || '0', 10);
    };

    BpRecordWidget.prototype._btnConfig = function () {
        var p  = this.payload;
        var el = this.el;
        return {
            submitText : p.submitText   || el.getAttribute('data-submit-text')   || '上傳錄音',
            retryText  : p.retryText    || el.getAttribute('data-retry-text')    || '↺ 重新上傳',
            btnSize    : p.btnSize      || el.getAttribute('data-btn-size')      || '',
            btnPadding : p.btnPadding   || el.getAttribute('data-btn-padding')   || '',
            btnFontSize: p.btnFontSize  || el.getAttribute('data-btn-font-size') || '',
        };
    };

    BpRecordWidget.prototype._styleBtn = function (btn, cfg) {
        if (cfg.btnPadding)  btn.style.padding  = cfg.btnPadding;
        if (cfg.btnFontSize) btn.style.fontSize = cfg.btnFontSize;
        if (cfg.btnSize === 'sm') {
            if (!cfg.btnPadding)  btn.style.padding  = '5px 14px';
            if (!cfg.btnFontSize) btn.style.fontSize = '.78rem';
        } else if (cfg.btnSize === 'lg') {
            if (!cfg.btnPadding)  btn.style.padding  = '11px 28px';
            if (!cfg.btnFontSize) btn.style.fontSize = '1rem';
        }
    };

    BpRecordWidget.prototype._render = function () {
        injectCSS();
        var p   = this.payload;
        var el  = this.el;
        var self = this;
        el.innerHTML = '';
        el.className = (el.className + ' bp-record').trim();

        // 題目
        if (p.question) {
            var qDiv = document.createElement('div');
            qDiv.className = 'bp-record-question';
            qDiv.innerHTML = renderQuestion(p.question);
            el.appendChild(qDiv);
        }

        // 提示
        if (p.hint) {
            var hDiv = document.createElement('div');
            hDiv.className = 'bp-record-hint';
            hDiv.innerHTML = '<i class="bi bi-lightbulb me-1"></i>' + renderQuestion(p.hint);
            el.appendChild(hDiv);
        }

        // 上傳區域
        var zone = document.createElement('div');
        zone.className = 'bp-record-zone';
        zone.innerHTML =
            '<div class="bp-record-icon"><i class="bi bi-mic-fill"></i></div>' +
            '<div class="bp-record-label">點擊選擇音訊檔案，或拖曳至此</div>' +
            '<div class="bp-record-filename" id="bp-rec-name-' + el.id + '"></div>' +
            '<div class="bp-record-filesize" id="bp-rec-size-' + el.id + '"></div>' +
            '<div class="bp-record-formatlabel">支援 MP3、M4A、WAV、OGG、AAC（上限 ' + this._maxMb + ' MB）</div>' +
            '<input type="file" id="bp-rec-input-' + el.id + '" accept="audio/*">';
        this._zone = zone;
        el.appendChild(zone);

        var fileInput = zone.querySelector('input[type="file"]');
        this._fileInput = fileInput;

        // 點擊開啟選檔
        zone.addEventListener('click', function (e) {
            if (e.target === fileInput) return;
            fileInput.click();
        });

        // 選檔
        fileInput.addEventListener('change', function () {
            if (fileInput.files && fileInput.files[0]) {
                self._onFileChosen(fileInput.files[0]);
            }
        });

        // 拖曳
        zone.addEventListener('dragover', function (e) {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', function () {
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', function (e) {
            e.preventDefault();
            zone.classList.remove('drag-over');
            var file = e.dataTransfer.files[0];
            if (file) self._onFileChosen(file);
        });

        // 進度條
        var prog = document.createElement('div');
        prog.className = 'bp-record-progress';
        prog.innerHTML = '<div class="bp-record-progress-bar"></div>';
        this._progress    = prog;
        this._progressBar = prog.querySelector('.bp-record-progress-bar');
        el.appendChild(prog);

        // 已上傳預覽列
        var uploaded = document.createElement('div');
        uploaded.className = 'bp-record-uploaded';
        uploaded.innerHTML =
            '<div class="bp-record-uploaded-label">' +
            '<i class="bi bi-check-circle-fill me-1"></i>已上傳，教師將批改後回饋</div>' +
            '<audio controls preload="metadata"></audio>';
        this._uploadedRow   = uploaded;
        this._uploadedAudio = uploaded.querySelector('audio');
        el.appendChild(uploaded);

        // 狀態訊息
        var msg = document.createElement('div');
        msg.className   = 'bp-record-msg';
        msg.style.display = 'none';
        this._msg = msg;
        el.appendChild(msg);

        // 按鈕列
        var cfg    = this._btnConfig();
        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:4px;';

        var submitBtn = document.createElement('button');
        submitBtn.type      = 'button';
        submitBtn.className = 'bp-record-submit';
        submitBtn.disabled  = true;
        submitBtn.innerHTML = '<i class="bi bi-upload me-2"></i>' + cfg.submitText;
        this._styleBtn(submitBtn, cfg);
        submitBtn.addEventListener('click', function () { self._onUpload(); });
        this._submitBtn = submitBtn;
        btnRow.appendChild(submitBtn);

        var retryBtn = document.createElement('button');
        retryBtn.type      = 'button';
        retryBtn.className = 'bp-record-retry';
        retryBtn.style.display = 'none';
        retryBtn.innerHTML = cfg.retryText;
        this._styleBtn(retryBtn, cfg);
        retryBtn.addEventListener('click', function () { self._onRetry(); });
        this._retryBtn = retryBtn;
        btnRow.appendChild(retryBtn);

        el.appendChild(btnRow);
    };

    // 選取檔案後驗證並更新 UI
    BpRecordWidget.prototype._onFileChosen = function (file) {
        var maxBytes = this._maxMb * 1024 * 1024;

        // 重置狀態
        this._zone.classList.remove('has-file', 'error');
        this._showMsg('', '');

        // 驗證大小
        if (file.size > maxBytes) {
            this._zone.classList.add('error');
            this._zone.querySelector('.bp-record-icon i').className = 'bi bi-exclamation-circle-fill';
            this._zone.querySelector('.bp-record-label').textContent = '檔案超過 ' + this._maxMb + ' MB 上限';
            this._submitBtn.disabled = true;
            return;
        }

        // 驗證類型（粗略，後端仍做 finfo 驗證）
        if (file.type && !file.type.startsWith('audio/')) {
            this._zone.classList.add('error');
            this._zone.querySelector('.bp-record-icon i').className = 'bi bi-exclamation-circle-fill';
            this._zone.querySelector('.bp-record-label').textContent = '請選擇音訊檔案';
            this._submitBtn.disabled = true;
            return;
        }

        this._file = file;
        this._zone.classList.add('has-file');
        this._zone.querySelector('.bp-record-icon i').className = 'bi bi-file-earmark-music-fill';
        this._zone.querySelector('.bp-record-label').textContent = '已選擇檔案';

        var nameEl = this._zone.querySelector('[id^="bp-rec-name"]');
        var sizeEl = this._zone.querySelector('[id^="bp-rec-size"]');
        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = formatBytes(file.size);

        this._submitBtn.disabled = false;
    };

    // 上傳
    BpRecordWidget.prototype._onUpload = function () {
        if (!this._file || this._uploading) return;
        this._uploading     = true;
        this._submitBtn.disabled = true;

        // 顯示進度條
        this._progress.classList.add('show');
        this._progressBar.style.width = '0%';

        var self = this;
        var fd   = new FormData();
        fd.append('audio', this._file);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', this._uploadUrl);

        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var pct = Math.round(e.loaded / e.total * 90);
                self._progressBar.style.width = pct + '%';
            }
        });

        xhr.addEventListener('load', function () {
            self._progressBar.style.width = '100%';
            setTimeout(function () {
                self._progress.classList.remove('show');
                self._progressBar.style.width = '0%';
            }, 400);

            var data;
            try { data = JSON.parse(xhr.responseText); } catch (e) { data = { ok: false }; }

            self._uploading = false;

            if (!data.ok) {
                self._onUploadError(data.error || '上傳失敗，請稍後再試。');
                return;
            }

            // 上傳成功
            self._uploaded = { filename: data.filename, url: data.url };
            self._uploadedAudio.src = data.url;
            self._uploadedRow.classList.add('show');
            self._retryBtn.style.display = '';
            self._submitBtn.style.display = 'none';
            self._showMsg('<i class="bi bi-check-circle-fill me-1"></i>上傳成功！等待教師批改。', 'ok');

            // 隱藏上傳區
            self._zone.style.display = 'none';

            // 事件
            self.el.dispatchEvent(new CustomEvent('bp:answered', {
                bubbles: true,
                detail : {
                    practiceId : self._practiceId,
                    filename   : data.filename,
                    url        : data.url,
                }
            }));

            // API 送出
            if (self._practiceId && self._apiUrl) {
                fetch(self._apiUrl + '?action=submit', {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({
                        practice_id  : self._practiceId,
                        unit_id      : self._unitId,
                        section_id   : self._sectionId,
                        practice_type: 'audio',
                        response     : data.filename,
                        is_correct   : null,
                    })
                }).catch(function () {});
            }
        });

        xhr.addEventListener('error', function () {
            self._uploading = false;
            self._progress.classList.remove('show');
            self._onUploadError('網路錯誤，請稍後再試。');
        });

        xhr.send(fd);
    };

    BpRecordWidget.prototype._onUploadError = function (msg) {
        this._zone.classList.remove('has-file');
        this._zone.classList.add('error');
        this._zone.querySelector('.bp-record-icon i').className = 'bi bi-exclamation-circle-fill';
        this._zone.querySelector('.bp-record-label').textContent = '上傳失敗';
        this._submitBtn.disabled = false;
        this._showMsg('<i class="bi bi-x-circle-fill me-1"></i>' + msg, 'err');
    };

    // 重新上傳
    BpRecordWidget.prototype._onRetry = function () {
        this._file      = null;
        this._uploaded  = null;
        this._uploading = false;

        // 重置 zone
        this._zone.style.display       = '';
        this._zone.className           = 'bp-record-zone';
        this._zone.querySelector('.bp-record-icon i').className = 'bi bi-mic-fill';
        this._zone.querySelector('.bp-record-label').textContent = '點擊選擇音訊檔案，或拖曳至此';
        var nameEl = this._zone.querySelector('[id^="bp-rec-name"]');
        var sizeEl = this._zone.querySelector('[id^="bp-rec-size"]');
        if (nameEl) nameEl.textContent = '';
        if (sizeEl) sizeEl.textContent = '';
        this._fileInput.value = '';

        // 重置上傳列
        this._uploadedRow.classList.remove('show');
        this._uploadedAudio.src = '';

        // 重置按鈕
        this._submitBtn.disabled     = true;
        this._submitBtn.style.display = '';
        this._retryBtn.style.display  = 'none';

        this._showMsg('', '');
    };

    // 顯示狀態訊息
    BpRecordWidget.prototype._showMsg = function (html, type) {
        var msg = this._msg;
        if (!html) { msg.style.display = 'none'; return; }
        msg.className   = 'bp-record-msg ' + type;
        msg.innerHTML   = html;
        msg.style.display = '';
    };

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('[data-bp="record"]:not([data-bp-init])').forEach(function (el) {
            if (!el.id) el.id = 'bp-rec-' + Math.random().toString(36).slice(2, 7);
            el.setAttribute('data-bp-init', '1');
            el._bpRecord = new BpRecordWidget(el);
        });
    }

    // ── 掛載全域 ─────────────────────────────────────────────────
    G.BpRecord = {
        config     : Config,
        init       : initAll,
        _reCSS     : function () { if (_cssEl) injectCSS(); },
        getInstance: function (el) { return el && el._bpRecord ? el._bpRecord : null; },
    };

    if (Config.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

})(window);

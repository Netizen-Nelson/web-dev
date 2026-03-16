// ================================================================
// bp-invite.js — 邀請碼輸入元件
//
// 掛載方式：
//   <bp-invite
//     digits="8"
//     verify-url="verify_invite.php"
//     redirect="/dashboard"
//     charset="ABCDEFGHJKMNPQRSTUVWXYZ23456789">
//   </bp-invite>
//
// 屬性：
//   digits        {number}  格數（預設 8）
//   verify-url    {string}  AJAX 驗證端點（預設 verify_invite.php）
//   redirect      {string}  成功後跳轉 URL（不設則只觸發事件）
//   charset       {string}  允許字元（預設排除 0 O 1 I L）
//   auto-submit             輸入滿格後自動送出（預設開啟）
//   placeholder   {string}  未輸入時的格子顯示字元（預設 ·）
//
// 回饋文字（全部可覆蓋）：
//   msg-verifying {string}  驗證中
//   msg-success   {string}  成功
//   msg-invalid   {string}  代碼無效
//   msg-used      {string}  已被使用
//   msg-expired   {string}  已過期
//   msg-error     {string}  網路錯誤
//
// 後端回傳 JSON 格式：
//   { "ok": true }
//   { "ok": false, "reason": "invalid|used|expired|<自訂文字>" }
//
// 事件：
//   bp:invite-success  → detail: { code, data }   驗證成功
//   bp:invite-fail     → detail: { code, reason }  驗證失敗
//
// 全域設定：
//   BpInvite.config.theme.accent = '#C3A5E5';
//
// 引入 bp-theme.js 後自動跟隨主題。
// ================================================================

(function (G) {
    'use strict';

    // ── 全域設定 ─────────────────────────────────────────────────
    var Config = {
        autoInit   : true,
        verifyUrl  : 'verify_invite.php',
        defaultCharset: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
        theme: {
            accent      : 'var(--lavender,#C3A5E5)',
            correct     : 'var(--safe,#81E6D9)',
            wrong       : 'var(--warning,#F08080)',
            bg          : 'var(--input-bg,#111211)',
            border      : 'var(--input-border,#3a3b3a)',
            text        : 'var(--shell,#c6c7bd)',
            submitBg    : 'var(--lavender,#C3A5E5)',
        },
    };

    // ── CSS 注入 ─────────────────────────────────────────────────
    var _cssEl = null;
    function injectCSS() {
        if (!_cssEl) {
            _cssEl = document.createElement('style');
            _cssEl.id = 'bp-invite-styles';
            document.head.appendChild(_cssEl);
        }
        var t = Config.theme;
        _cssEl.textContent = [
            'bp-invite{display:block;}',

            /* 格子列 */
            '.bpi-digits{display:flex;gap:8px;justify-content:center;margin-bottom:14px;flex-wrap:wrap;}',

            /* 單格 input */
            '.bpi-digit{',
            'width:44px;height:52px;',
            'text-align:center;font-size:1.4rem;font-weight:700;',
            'letter-spacing:0;text-transform:uppercase;',
            'background:' + t.bg + ';',
            'border:2px solid ' + t.border + ';',
            'border-radius:8px;',
            'color:' + t.text + ';',
            'outline:none;',
            'caret-color:' + t.accent + ';',
            'transition:border-color .15s,background .15s,color .15s;',
            '-webkit-appearance:none;}',

            '.bpi-digit:focus{border-color:' + t.accent + ';',
            'background:rgba(195,165,229,.06);}',

            /* 狀態：全格填滿待送出 */
            '.bpi-digits.filled .bpi-digit{border-color:' + t.accent + ';}',

            /* 狀態：驗證中 */
            '.bpi-digits.verifying .bpi-digit{',
            'border-color:' + t.accent + ';opacity:.6;pointer-events:none;}',

            /* 狀態：成功 */
            '.bpi-digits.success .bpi-digit{',
            'border-color:' + t.correct + ';',
            'background:rgba(129,230,217,.08);',
            'color:' + t.correct + ';}',

            /* 狀態：失敗 */
            '.bpi-digits.fail .bpi-digit{',
            'border-color:' + t.wrong + ';',
            'background:rgba(240,128,128,.07);',
            'color:' + t.wrong + ';}',

            /* 搖晃動畫（失敗時）*/
            '@keyframes bpi-shake{',
            '0%,100%{transform:translateX(0)}',
            '20%{transform:translateX(-6px)}',
            '40%{transform:translateX(6px)}',
            '60%{transform:translateX(-4px)}',
            '80%{transform:translateX(4px)}}',
            '.bpi-digits.shake{animation:bpi-shake .35s ease;}',

            /* 成功打勾動畫 */
            '@keyframes bpi-pop{',
            '0%{transform:scale(.5);opacity:0}',
            '70%{transform:scale(1.15)}',
            '100%{transform:scale(1);opacity:1}}',
            '.bpi-success-icon{animation:bpi-pop .3s ease forwards;}',

            /* 回饋訊息列 */
            '.bpi-msg{',
            'text-align:center;font-size:.85rem;',
            'min-height:1.4em;margin-bottom:10px;',
            'transition:color .2s;}',
            '.bpi-msg.ok{color:' + t.correct + ';}',
            '.bpi-msg.fail{color:' + t.wrong + ';}',
            '.bpi-msg.info{color:' + t.accent + ';}',

            /* 送出按鈕（auto-submit 關閉時才顯示）*/
            '.bpi-submit{',
            'display:block;width:100%;',
            'background:' + t.submitBg + ';color:#0c0d0c;',
            'border:none;border-radius:8px;',
            'padding:10px 0;font-size:.92rem;font-weight:700;',
            'cursor:pointer;transition:opacity .2s;margin-top:4px;}',
            '.bpi-submit:disabled{opacity:.35;cursor:default;}',
        ].join('');
    }

    // ── BpInviteWidget ───────────────────────────────────────────
    function BpInviteWidget(el) {
        this.el          = el;
        this._inputs     = [];
        this._verifying  = false;
        this._done       = false;
        this._parse();
        this._render();
    }

    BpInviteWidget.prototype._parse = function () {
        var el = this.el;
        this._digits     = Math.max(1, parseInt(el.getAttribute('digits')      || '8', 10));
        this._verifyUrl  = el.getAttribute('verify-url')   || Config.verifyUrl;
        this._redirect   = el.getAttribute('redirect')     || '';
        this._charset    = (el.getAttribute('charset')     || Config.defaultCharset).toUpperCase();
        this._autoSubmit = !el.hasAttribute('no-auto-submit');
        this._ph         = el.getAttribute('placeholder')  || '·';

        // 回饋文字
        this._msgs = {
            verifying: el.getAttribute('msg-verifying') || '驗證中…',
            success  : el.getAttribute('msg-success')   || '✓ 邀請碼有效，正在加入…',
            invalid  : el.getAttribute('msg-invalid')   || '找不到此邀請碼，請確認後重試。',
            used     : el.getAttribute('msg-used')      || '此邀請碼已被使用。',
            expired  : el.getAttribute('msg-expired')   || '此邀請碼已過期。',
            error    : el.getAttribute('msg-error')     || '網路錯誤，請稍後再試。',
        };
    };

    BpInviteWidget.prototype._render = function () {
        injectCSS();
        var el   = this.el;
        var self = this;
        el.innerHTML = '';

        // 格子列
        var row = document.createElement('div');
        row.className = 'bpi-digits';
        this._row = row;

        for (var i = 0; i < this._digits; i++) {
            var input = document.createElement('input');
            input.type         = 'text';
            input.maxLength    = 1;
            input.className    = 'bpi-digit';
            input.inputMode    = 'text';
            input.autocomplete = 'off';
            input.spellcheck   = false;
            input.setAttribute('placeholder', this._ph);
            input.setAttribute('data-idx', i);
            this._inputs.push(input);
            row.appendChild(input);
        }
        el.appendChild(row);

        // 回饋訊息
        var msg = document.createElement('div');
        msg.className = 'bpi-msg';
        this._msgEl = msg;
        el.appendChild(msg);

        // 手動送出按鈕（auto-submit 關閉時才顯示）
        if (!this._autoSubmit) {
            var btn = document.createElement('button');
            btn.type      = 'button';
            btn.className = 'bpi-submit';
            btn.disabled  = true;
            btn.textContent = '確認邀請碼';
            btn.addEventListener('click', function () { self._submit(); });
            this._submitBtn = btn;
            el.appendChild(btn);
        }

        this._bindEvents();
    };

    BpInviteWidget.prototype._bindEvents = function () {
        var self   = this;
        var inputs = this._inputs;

        inputs.forEach(function (input, idx) {

            // keydown：Backspace、方向鍵
            input.addEventListener('keydown', function (e) {
                if (self._done) return;
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    if (input.value) {
                        input.value = '';
                        self._onChanged();
                    } else if (idx > 0) {
                        inputs[idx - 1].value = '';
                        inputs[idx - 1].focus();
                        self._onChanged();
                    }
                } else if (e.key === 'ArrowLeft' && idx > 0) {
                    inputs[idx - 1].focus();
                } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                }
            });

            // input：字元輸入
            input.addEventListener('input', function () {
                if (self._done) { input.value = ''; return; }

                // 過濾並轉大寫
                var raw     = input.value.toUpperCase();
                var allowed = '';
                for (var i = 0; i < raw.length; i++) {
                    if (self._charset.indexOf(raw[i]) !== -1) {
                        allowed += raw[i];
                    }
                }

                if (!allowed) { input.value = ''; return; }

                // 只取第一個有效字元（防止 IME 殘留）
                input.value = allowed[0];
                self._onChanged();

                // 跳下一格
                if (idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                } else if (self._autoSubmit) {
                    self._tryAutoSubmit();
                }
            });

            // paste：整串代碼貼上分配
            input.addEventListener('paste', function (e) {
                e.preventDefault();
                if (self._done) return;
                var text = (e.clipboardData || G.clipboardData).getData('text');
                var clean = '';
                for (var i = 0; i < text.length; i++) {
                    var ch = text[i].toUpperCase();
                    if (self._charset.indexOf(ch) !== -1) clean += ch;
                }
                clean = clean.slice(0, self._digits);
                for (var j = 0; j < clean.length; j++) {
                    if (inputs[j]) inputs[j].value = clean[j];
                }
                // 聚焦到第一個空格或最後一格
                var nextEmpty = inputs.slice(clean.length).find(function (inp) { return !inp.value; });
                if (nextEmpty) nextEmpty.focus();
                else if (inputs[inputs.length - 1]) inputs[inputs.length - 1].focus();

                self._onChanged();
                if (self._autoSubmit) self._tryAutoSubmit();
            });
        });
    };

    // 取得目前輸入的代碼
    BpInviteWidget.prototype._getCode = function () {
        return this._inputs.map(function (inp) { return inp.value; }).join('');
    };

    // 是否全格填滿
    BpInviteWidget.prototype._isFull = function () {
        return this._getCode().length === this._digits;
    };

    // 輸入變更時更新狀態
    BpInviteWidget.prototype._onChanged = function () {
        var full = this._isFull();
        this._row.classList.toggle('filled', full);
        // 清除先前的失敗狀態
        this._row.classList.remove('fail', 'shake');
        this._showMsg('', '');
        if (this._submitBtn) this._submitBtn.disabled = !full;
    };

    // 嘗試自動送出（等所有 input 事件處理完再檢查）
    BpInviteWidget.prototype._tryAutoSubmit = function () {
        var self = this;
        setTimeout(function () {
            if (self._isFull() && !self._verifying && !self._done) {
                self._submit();
            }
        }, 80);
    };

    // 送出驗證
    BpInviteWidget.prototype._submit = function () {
        if (this._verifying || this._done) return;
        var code = this._getCode();
        if (code.length !== this._digits) return;

        this._verifying = true;
        this._row.classList.add('verifying');
        this._row.classList.remove('filled', 'fail', 'shake');
        this._showMsg(this._msgs.verifying, 'info');
        if (this._submitBtn) this._submitBtn.disabled = true;

        var self = this;
        fetch(this._verifyUrl, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ code: code }),
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            self._verifying = false;
            self._row.classList.remove('verifying');

            if (data.ok) {
                self._onSuccess(code, data);
            } else {
                self._onFail(code, data.reason || 'invalid');
            }
        })
        .catch(function () {
            self._verifying = false;
            self._row.classList.remove('verifying');
            self._onFail(code, 'error');
        });
    };

    // 驗證成功
    BpInviteWidget.prototype._onSuccess = function (code, data) {
        this._done = true;
        this._row.classList.add('success');
        this._showMsg(
            '<i class="bi bi-check-circle-fill bpi-success-icon me-1"></i>' + this._msgs.success,
            'ok'
        );

        // 鎖定輸入
        this._inputs.forEach(function (inp) { inp.disabled = true; });

        // 事件
        this.el.dispatchEvent(new CustomEvent('bp:invite-success', {
            bubbles: true,
            detail : { code: code, data: data },
        }));

        // 跳轉
        var self = this;
        if (this._redirect) {
            setTimeout(function () {
                G.location.href = self._redirect;
            }, 900);
        }
    };

    // 驗證失敗
    BpInviteWidget.prototype._onFail = function (code, reason) {
        // 選取回饋文字
        var msgMap = {
            invalid : this._msgs.invalid,
            used    : this._msgs.used,
            expired : this._msgs.expired,
            error   : this._msgs.error,
        };
        var text = msgMap[reason] || reason;  // reason 可以是後端自訂文字

        this._row.classList.add('fail');
        this._showMsg('<i class="bi bi-x-circle-fill me-1"></i>' + text, 'fail');

        // 搖晃動畫
        var row = this._row;
        row.classList.add('shake');
        setTimeout(function () { row.classList.remove('shake'); }, 400);

        // 清空輸入，聚焦第一格
        this._inputs.forEach(function (inp) { inp.value = ''; inp.disabled = false; });
        this._inputs[0].focus();
        this._onChanged();

        // 事件
        this.el.dispatchEvent(new CustomEvent('bp:invite-fail', {
            bubbles: true,
            detail : { code: code, reason: reason },
        }));
    };

    // 顯示訊息
    BpInviteWidget.prototype._showMsg = function (html, type) {
        this._msgEl.innerHTML   = html;
        this._msgEl.className   = 'bpi-msg' + (type ? ' ' + type : '');
    };

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('bp-invite:not([data-bp-init])').forEach(function (el) {
            el.setAttribute('data-bp-init', '1');
            el._bpInvite = new BpInviteWidget(el);
        });
    }

    // ── 全域 API ─────────────────────────────────────────────────
    G.BpInvite = {
        config     : Config,
        init       : initAll,
        _reCSS     : function () { if (_cssEl) injectCSS(); },
        getInstance: function (el) { return el && el._bpInvite ? el._bpInvite : null; },
    };

    if (Config.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

})(window);

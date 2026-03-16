// ================================================================
// bp-thread.js — 討論串元件
//
// 兩種使用模式：
//
// ── 模式一：純前端（子節點定義初始內容）────────────────────────
//   <bp-thread thread-id="local-1" current-user-id="1"
//              current-user-name="Nelson" current-user-role="teacher">
//     <bp-post id="1" user-name="Amy" role="student"
//              time="2026-03-16 14:22">
//       這個搭配詞我不太懂…
//     </bp-post>
//     <bp-post id="2" parent-id="1" user-name="Nelson" role="teacher"
//              time="2026-03-16 15:01">
//       好問題，hold 強調正式主持…
//     </bp-post>
//   </bp-thread>
//
// ── 模式二：API 模式（從後端拉取，回覆送到後端）─────────────────
//   <bp-thread
//     thread-id="section-42"
//     api-url="thread_api.php"
//     current-user-id="1"
//     current-user-name="Nelson"
//     current-user-avatar="https://..."
//     current-user-role="teacher">
//   </bp-thread>
//
// bp-thread 屬性：
//   thread-id            {string}  討論串唯一識別 *必填
//   api-url              {string}  後端 API 端點（不設則為純前端模式）
//   current-user-id      {string}  目前登入使用者 id
//   current-user-name    {string}  目前登入使用者顯示名稱
//   current-user-avatar  {string}  目前登入使用者頭像 URL
//   current-user-role    {string}  student | teacher | admin
//   placeholder          {string}  輸入框提示文字
//   readonly                       有此屬性則不顯示輸入框
//   max-depth            {number}  最大回覆層數（預設 2）
//
// bp-post 屬性（純前端模式子節點）：
//   id          {string}  貼文唯一識別
//   parent-id   {string}  回覆目標 id（不設則為頂層貼文）
//   user-name   {string}  顯示名稱
//   user-id     {string}  使用者 id（可選）
//   role        {string}  student | teacher | admin
//   avatar      {string}  頭像 URL
//   time        {string}  時間字串（YYYY-MM-DD HH:mm）
//
// API 格式：
//   GET  api-url?action=list&thread_id=xxx
//        → { "ok": true, "posts": [ {id, parent_id, user_id, user_name,
//            user_avatar, role, content, created_at} ] }
//   POST api-url?action=post
//        body: { thread_id, parent_id, content }
//        → { "ok": true, "post": { ...新貼文物件 } }
//
// 全域 API：
//   BpThread.init()
//   BpThread.getInstance(el)
//   BpThread.config.theme.*
//
// 事件（bubbles）：
//   bp:thread-post  → detail: { threadId, post }
// ================================================================

(function (G) {
    'use strict';

    // ── 全域設定 ─────────────────────────────────────────────────
    var Config = {
        autoInit: true,
        theme: {
            accent      : 'var(--lavender,#C3A5E5)',
            teacherBorder: 'var(--lavender,#C3A5E5)',
            studentBorder: 'var(--card-border,#2e2f2e)',
            bg          : 'var(--area,#1a1b1a)',
            postBg      : 'var(--area2,#2a2b2a)',
            replyBg     : 'var(--area,#1a1b1a)',
            text        : 'var(--shell,#c6c7bd)',
            textDim     : 'var(--shell-dim,#888)',
            inputBg     : 'var(--input-bg,#111211)',
            inputBorder : 'var(--input-border,#3a3b3a)',
            submitBg    : 'var(--lavender,#C3A5E5)',
            replyLine   : 'var(--card-border,#2e2f2e)',
            teacherTag  : 'var(--lavender,#C3A5E5)',
            timeColor   : 'var(--shell-dim,#888)',
        },
    };

    // ── CSS 注入 ─────────────────────────────────────────────────
    var _cssEl = null;
    function injectCSS() {
        if (!_cssEl) {
            _cssEl = document.createElement('style');
            _cssEl.id = 'bp-thread-styles';
            document.head.appendChild(_cssEl);
        }
        var t = Config.theme;
        _cssEl.textContent = [
            /* ── 外框 ── */
            '.bpt-wrap{font-size:1rem;color:' + t.text + ';}',

            /* ── 貼文列表 ── */
            '.bpt-list{display:flex;flex-direction:column;gap:10px;margin-bottom:14px;}',

            /* ── 單則貼文 ── */
            '.bpt-post{',
            'background:' + t.postBg + ';',
            'border:1px solid ' + t.studentBorder + ';',
            'border-left:3px solid ' + t.studentBorder + ';',
            'border-radius:7px;padding:12px 14px;',
            'transition:border-color .15s;}',

            '.bpt-post.role-teacher{border-left-color:' + t.teacherBorder + ';}',
            '.bpt-post.role-admin{border-left-color:' + t.teacherBorder + ';}',

            /* ── 貼文頭部 ── */
            '.bpt-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}',

            '.bpt-avatar{',
            'width:28px;height:28px;border-radius:50%;',
            'object-fit:cover;flex-shrink:0;',
            'border:1px solid ' + t.studentBorder + ';}',

            '.bpt-post.role-teacher .bpt-avatar,',
            '.bpt-post.role-admin .bpt-avatar{border-color:' + t.teacherBorder + ';}',

            '.bpt-avatar-placeholder{',
            'width:28px;height:28px;border-radius:50%;',
            'background:' + t.postBg + ';',
            'border:1px solid ' + t.studentBorder + ';',
            'display:flex;align-items:center;justify-content:center;',
            'flex-shrink:0;font-size:.75rem;font-weight:700;',
            'color:' + t.textDim + ';}',

            '.bpt-post.role-teacher .bpt-avatar-placeholder,',
            '.bpt-post.role-admin .bpt-avatar-placeholder{',
            'border-color:' + t.teacherBorder + ';',
            'color:' + t.teacherBorder + ';}',

            '.bpt-name{font-size:.85rem;font-weight:600;color:' + t.text + ';}',

            '.bpt-tag{',
            'font-size:.65rem;font-weight:700;',
            'padding:1px 6px;border-radius:8px;',
            'background:rgba(195,165,229,.15);',
            'color:' + t.teacherTag + ';',
            'margin-left:4px;vertical-align:middle;}',

            '.bpt-time{',
            'font-size:.72rem;color:' + t.timeColor + ';',
            'margin-left:auto;cursor:default;}',

            /* ── 貼文內容 ── */
            '.bpt-body{',
            'font-size:.88rem;line-height:1.7;',
            'color:' + t.text + ';',
            'word-break:break-word;white-space:pre-wrap;}',

            /* ── 回覆按鈕 ── */
            '.bpt-actions{margin-top:8px;display:flex;gap:10px;}',

            '.bpt-reply-btn{',
            'background:none;border:none;',
            'font-size:.75rem;color:' + t.textDim + ';',
            'cursor:pointer;padding:2px 0;',
            'transition:color .15s;display:flex;',
            'align-items:center;gap:4px;}',
            '.bpt-reply-btn:hover{color:' + t.accent + ';}',

            /* ── 第二層回覆區 ── */
            '.bpt-replies{',
            'margin-top:10px;',
            'margin-left:16px;',
            'padding-left:14px;',
            'border-left:1px solid ' + t.replyLine + ';',
            'display:flex;flex-direction:column;gap:8px;}',

            '.bpt-replies .bpt-post{',
            'background:' + t.replyBg + ';',
            'font-size:.9em;}',

            /* ── 回覆輸入框（行內）── */
            '.bpt-inline-form{',
            'margin-top:8px;',
            'display:flex;flex-direction:column;gap:7px;}',

            '.bpt-inline-form textarea{',
            'background:' + t.inputBg + ';',
            'border:1px solid ' + t.inputBorder + ';',
            'border-radius:6px;',
            'color:' + t.text + ';',
            'font-size:.85rem;',
            'padding:8px 10px;',
            'resize:vertical;',
            'line-height:1.6;',
            'font-family:inherit;',
            'outline:none;',
            'transition:border-color .15s;}',

            '.bpt-inline-form textarea:focus{border-color:' + t.accent + ';',
            'box-shadow:0 0 0 2px rgba(195,165,229,.15);}',

            '.bpt-inline-btns{display:flex;gap:8px;align-items:center;}',

            '.bpt-send-btn{',
            'background:' + t.submitBg + ';color:#0c0d0c;',
            'border:none;border-radius:5px;',
            'padding:5px 14px;font-size:.8rem;font-weight:700;',
            'cursor:pointer;transition:opacity .15s;}',
            '.bpt-send-btn:disabled{opacity:.35;cursor:default;}',

            '.bpt-cancel-btn{',
            'background:none;',
            'border:1px solid ' + t.inputBorder + ';',
            'color:' + t.textDim + ';',
            'border-radius:5px;',
            'padding:5px 12px;font-size:.8rem;',
            'cursor:pointer;transition:border-color .15s,color .15s;}',
            '.bpt-cancel-btn:hover{border-color:' + t.accent + ';color:' + t.accent + ';}',

            /* ── 主輸入框（串底部）── */
            '.bpt-main-form{',
            'border-top:1px solid ' + t.replyLine + ';',
            'padding-top:14px;',
            'display:flex;flex-direction:column;gap:8px;}',

            '.bpt-main-form textarea{',
            'background:' + t.inputBg + ';',
            'border:1px solid ' + t.inputBorder + ';',
            'border-radius:7px;',
            'color:' + t.text + ';',
            'font-size:.88rem;',
            'padding:10px 12px;',
            'resize:vertical;',
            'line-height:1.65;',
            'font-family:inherit;',
            'outline:none;',
            'transition:border-color .15s;}',

            '.bpt-main-form textarea:focus{border-color:' + t.accent + ';',
            'box-shadow:0 0 0 2px rgba(195,165,229,.15);}',

            '.bpt-main-form .bpt-send-btn{align-self:flex-start;}',

            /* ── 空狀態 ── */
            '.bpt-empty{',
            'text-align:center;padding:28px 0;',
            'font-size:.85rem;color:' + t.textDim + ';}',

            /* ── 載入中 ── */
            '.bpt-loading{',
            'text-align:center;padding:20px;',
            'font-size:.82rem;color:' + t.textDim + ';}',

            /* ── 錯誤 ── */
            '.bpt-error{',
            'font-size:.82rem;color:var(--warning,#F08080);',
            'padding:8px 0;}',
        ].join('');
    }

    // ── 時間格式化 ───────────────────────────────────────────────
    function formatTime(timeStr) {
        if (!timeStr) return '';
        var d = new Date(timeStr.replace(' ', 'T'));
        if (isNaN(d.getTime())) return timeStr;
        var now   = new Date();
        var diff  = Math.floor((now - d) / 1000);
        if (diff <  60)  return '剛剛';
        if (diff < 3600) return Math.floor(diff / 60) + ' 分鐘前';
        if (diff < 86400) return Math.floor(diff / 3600) + ' 小時前';
        if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
        // 超過一週顯示日期
        return d.getFullYear() + '-'
            + String(d.getMonth() + 1).padStart(2, '0') + '-'
            + String(d.getDate()).padStart(2, '0');
    }

    function fullTime(timeStr) {
        if (!timeStr) return '';
        return timeStr.replace('T', ' ').slice(0, 16);
    }

    // ── 頭像 HTML ────────────────────────────────────────────────
    function avatarHTML(post) {
        if (post.avatar || post.user_avatar) {
            var src = post.avatar || post.user_avatar;
            return '<img class="bpt-avatar" src="' + escAttr(src) + '" alt="">';
        }
        var name = post.user_name || post.userName || '?';
        return '<div class="bpt-avatar-placeholder">'
            + escHtml(name.charAt(0).toUpperCase())
            + '</div>';
    }

    // ── HTML 跳脫 ────────────────────────────────────────────────
    function escHtml(s) {
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function escAttr(s) {
        return String(s).replace(/"/g, '&quot;');
    }

    // ── rich-input 整合輔助 ──────────────────────────────────────

    /**
     * 建立輸入區：若 RichInput 已載入則用 rich-input 元件，否則用 textarea
     * @param {number} rows      預設行數（textarea 用）
     * @param {string} ph        placeholder
     * @param {string} name      rich-input 的 name 屬性（不影響功能，只用於識別）
     * @returns {{ el, getValue, clear, focus }}
     */
    function makeInput(rows, ph, name) {
        if (G.RichInput && typeof G.RichInput.init === 'function') {
            // rich-input 模式
            var ri = document.createElement('rich-input');
            ri.setAttribute('name',        name || 'thread-input');
            ri.setAttribute('placeholder', ph);
            ri.setAttribute('height',      rows <= 3 ? 80 : 160);
            // 初始化延遲到插入 DOM 後
            return {
                el: ri,
                getValue: function () {
                    var inst = G.RichInput.getInstance(ri);
                    return inst ? inst.getValue().trim() : '';
                },
                clear: function () {
                    var inst = G.RichInput.getInstance(ri);
                    if (inst) inst.clear();
                },
                focus: function () {
                    var editor = ri.querySelector('.ri-editor');
                    if (editor) editor.focus();
                },
                initAfterInsert: function () {
                    G.RichInput.init();
                },
            };
        } else {
            // 純 textarea 模式
            var ta = document.createElement('textarea');
            ta.rows        = rows;
            ta.placeholder = ph;
            return {
                el: ta,
                getValue: function () { return ta.value.trim(); },
                clear:    function () { ta.value = ''; },
                focus:    function () { ta.focus(); },
                initAfterInsert: function () {},
            };
        }
    }

    // ── BpThreadWidget ───────────────────────────────────────────
    function BpThreadWidget(el) {
        this.el         = el;
        this._threadId  = el.getAttribute('thread-id') || ('t-' + Math.random().toString(36).slice(2,7));
        this._apiUrl    = el.getAttribute('api-url') || '';
        this._readonly  = el.hasAttribute('readonly');
        this._maxDepth  = parseInt(el.getAttribute('max-depth') || '2', 10);
        this._ph        = el.getAttribute('placeholder') || '輸入回覆…';
        this._posts     = [];   // 扁平陣列，統一格式
        this._nextId    = 1000; // 純前端模式的暫用 id

        // 目前使用者
        this._me = {
            id    : el.getAttribute('current-user-id')     || '0',
            name  : el.getAttribute('current-user-name')   || '訪客',
            avatar: el.getAttribute('current-user-avatar') || '',
            role  : el.getAttribute('current-user-role')   || 'student',
        };

        this._init();
    }

    BpThreadWidget.prototype._init = function () {
        injectCSS();
        var el = this.el;

        // 收集子節點 bp-post（純前端模式）
        var staticPosts = [];
        Array.from(el.querySelectorAll('bp-post')).forEach(function (p) {
            staticPosts.push({
                id        : p.getAttribute('id') || String(Date.now()),
                parent_id : p.getAttribute('parent-id') || null,
                user_id   : p.getAttribute('user-id') || '0',
                user_name : p.getAttribute('user-name') || '匿名',
                avatar    : p.getAttribute('avatar') || '',
                role      : p.getAttribute('role') || 'student',
                content   : p.innerHTML.trim(),
                created_at: p.getAttribute('time') || '',
            });
        });

        el.innerHTML = '';
        el.className = (el.className + ' bpt-wrap').trim();

        // 貼文列表容器
        var list = document.createElement('div');
        list.className = 'bpt-list';
        this._listEl = list;
        el.appendChild(list);

        // 主輸入框
        if (!this._readonly) {
            this._buildMainForm();
        }

        if (this._apiUrl) {
            this._fetchPosts();
        } else {
            this._posts = staticPosts;
            this._render();
        }
    };

    // 從 API 拉取貼文
    BpThreadWidget.prototype._fetchPosts = function () {
        var self = this;
        this._listEl.innerHTML = '<div class="bpt-loading"><i class="bi bi-hourglass-split me-2"></i>載入中…</div>';
        fetch(this._apiUrl + '?action=list&thread_id=' + encodeURIComponent(this._threadId))
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.ok) {
                self._posts = data.posts || [];
                self._render();
            } else {
                self._listEl.innerHTML = '<div class="bpt-error"><i class="bi bi-exclamation-circle me-1"></i>載入失敗：' + escHtml(data.error || '請稍後再試') + '</div>';
            }
        })
        .catch(function () {
            self._listEl.innerHTML = '<div class="bpt-error"><i class="bi bi-wifi-off me-1"></i>網路錯誤，請稍後再試。</div>';
        });
    };

    // 渲染所有貼文
    BpThreadWidget.prototype._render = function () {
        var self  = this;
        var list  = this._listEl;
        list.innerHTML = '';

        // 找頂層貼文
        var topPosts = this._posts.filter(function (p) {
            return !p.parent_id || p.parent_id === '0' || p.parent_id === 0;
        });

        if (topPosts.length === 0) {
            list.innerHTML = '<div class="bpt-empty"><i class="bi bi-chat-dots" style="font-size:1.6rem;display:block;margin-bottom:8px;"></i>尚無留言，來第一個發言吧！</div>';
            return;
        }

        topPosts.forEach(function (post) {
            var postEl = self._buildPost(post, 1);
            list.appendChild(postEl);
        });
    };

    // 建立單則貼文
    BpThreadWidget.prototype._buildPost = function (post, depth) {
        var self = this;
        var role = post.role || 'student';

        var wrap = document.createElement('div');
        wrap.className = 'bpt-post role-' + role;
        wrap.setAttribute('data-post-id', post.id);

        // 頭部
        var head = document.createElement('div');
        head.className = 'bpt-head';

        var tagHTML = (role === 'teacher' || role === 'admin')
            ? '<span class="bpt-tag">教師</span>' : '';

        var timeStr = post.created_at || post.time || '';
        var timeHTML = timeStr
            ? '<span class="bpt-time" title="' + escAttr(fullTime(timeStr)) + '">'
              + formatTime(timeStr) + '</span>'
            : '';

        head.innerHTML = avatarHTML(post)
            + '<span class="bpt-name">' + escHtml(post.user_name || '匿名') + tagHTML + '</span>'
            + timeHTML;
        wrap.appendChild(head);

        // 內容
        var body = document.createElement('div');
        body.className = 'bpt-body';
        // content 可以是純文字或 HTML（純前端模式保留 innerHTML）
        body.innerHTML = post.content || '';
        wrap.appendChild(body);

        // 動作列（回覆按鈕）
        if (!this._readonly && depth < this._maxDepth) {
            var actions = document.createElement('div');
            actions.className = 'bpt-actions';
            var replyBtn = document.createElement('button');
            replyBtn.type = 'button';
            replyBtn.className = 'bpt-reply-btn';
            replyBtn.innerHTML = '<i class="bi bi-reply"></i> 回覆';
            replyBtn.addEventListener('click', function () {
                self._toggleInlineForm(wrap, post.id);
            });
            actions.appendChild(replyBtn);
            wrap.appendChild(actions);
        }

        // 子回覆
        var children = this._posts.filter(function (p) {
            return String(p.parent_id) === String(post.id);
        });
        if (children.length > 0) {
            var replies = document.createElement('div');
            replies.className = 'bpt-replies';
            children.forEach(function (child) {
                replies.appendChild(self._buildPost(child, depth + 1));
            });
            wrap.appendChild(replies);
        }

        return wrap;
    };

    // 行內回覆表單（toggle）
    BpThreadWidget.prototype._toggleInlineForm = function (postEl, parentId) {
        var self = this;

        // 若已有表單則移除（toggle）
        var existing = postEl.querySelector('.bpt-inline-form');
        if (existing) { existing.remove(); return; }

        // 關閉同串其他行內表單
        var allForms = this.el.querySelectorAll('.bpt-inline-form');
        allForms.forEach(function (f) { f.remove(); });

        var form = document.createElement('div');
        form.className = 'bpt-inline-form';

        var inp = makeInput(3, this._ph, 'reply-' + parentId);
        form.appendChild(inp.el);

        var btnRow = document.createElement('div');
        btnRow.className = 'bpt-inline-btns';

        var sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.className = 'bpt-send-btn';
        sendBtn.textContent = '送出回覆';
        sendBtn.addEventListener('click', function () {
            var content = inp.getValue();
            if (!content) return;
            sendBtn.disabled = true;
            self._submitPost(content, parentId, function () {
                form.remove();
            }, function () {
                sendBtn.disabled = false;
            });
        });

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'bpt-cancel-btn';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', function () { form.remove(); });

        btnRow.appendChild(sendBtn);
        btnRow.appendChild(cancelBtn);
        form.appendChild(btnRow);

        postEl.appendChild(form);
        inp.initAfterInsert();
        inp.focus();
    };

    // 主輸入框（串底部）
    BpThreadWidget.prototype._buildMainForm = function () {
        var self = this;
        var form = document.createElement('div');
        form.className = 'bpt-main-form';

        var inp = makeInput(9, '輸入留言…', 'thread-main-' + this._threadId);
        form.appendChild(inp.el);

        var sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.className = 'bpt-send-btn';
        sendBtn.innerHTML = '<i class="bi bi-send me-1"></i>發送';
        sendBtn.addEventListener('click', function () {
            var content = inp.getValue();
            if (!content) return;
            sendBtn.disabled = true;
            self._submitPost(content, null, function () {
                inp.clear();
                sendBtn.disabled = false;
            }, function () {
                sendBtn.disabled = false;
            });
        });

        form.appendChild(sendBtn);
        this.el.appendChild(form);
        inp.initAfterInsert();
    };

    // 送出貼文（API 或純前端）
    BpThreadWidget.prototype._submitPost = function (content, parentId, onSuccess, onError) {
        var self = this;
        var now  = new Date();
        var pad  = function (n) { return String(n).padStart(2, '0'); };
        var timeStr = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate())
                    + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

        var newPost = {
            id        : String(++self._nextId),
            parent_id : parentId || null,
            user_id   : self._me.id,
            user_name : self._me.name,
            avatar    : self._me.avatar,
            role      : self._me.role,
            content   : escHtml(content),
            created_at: timeStr,
        };

        if (self._apiUrl) {
            fetch(self._apiUrl + '?action=post', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({
                    thread_id : self._threadId,
                    parent_id : parentId || null,
                    content   : content,
                }),
            })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.ok) {
                    // 用後端回傳的完整貼文物件
                    self._posts.push(data.post || newPost);
                    self._render();
                    self.el.dispatchEvent(new CustomEvent('bp:thread-post', {
                        bubbles: true,
                        detail : { threadId: self._threadId, post: data.post || newPost },
                    }));
                    onSuccess();
                } else {
                    onError();
                }
            })
            .catch(function () { onError(); });
        } else {
            // 純前端模式：直接加入記憶體
            self._posts.push(newPost);
            self._render();
            self.el.dispatchEvent(new CustomEvent('bp:thread-post', {
                bubbles: true,
                detail : { threadId: self._threadId, post: newPost },
            }));
            onSuccess();
        }
    };

    // 公開方法：匯出目前討論串的 JSON 快照
    BpThreadWidget.prototype.exportJSON = function () {
        return JSON.parse(JSON.stringify(this._posts));
    };

    // 公開方法：重新從 API 拉取（API 模式用）
    BpThreadWidget.prototype.refresh = function () {
        if (this._apiUrl) this._fetchPosts();
    };

    // ── 自動初始化 ───────────────────────────────────────────────
    function initAll() {
        document.querySelectorAll('bp-thread:not([data-bp-init])').forEach(function (el) {
            el.setAttribute('data-bp-init', '1');
            el._bpThread = new BpThreadWidget(el);
        });
    }

    // ── 全域 API ─────────────────────────────────────────────────
    G.BpThread = {
        config     : Config,
        init       : initAll,
        _reCSS     : function () { if (_cssEl) injectCSS(); },
        getInstance: function (el) {
            if (typeof el === 'string') el = document.getElementById(el);
            return (el && el._bpThread) ? el._bpThread : null;
        },
    };

    if (Config.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

})(window);

(function (G) {
  'use strict';
  function deepMerge(target) {
    for (var i=1;i<arguments.length;i++) {
      var src=arguments[i];
      if (!src||typeof src!=='object') continue;
      Object.keys(src).forEach(function(k){
        if (src[k]!==null&&!Array.isArray(src[k])&&typeof src[k]==='object') {
          if (typeof target[k]!=='object'||target[k]===null) target[k]={};
          deepMerge(target[k],src[k]);
        } else if (src[k]!==undefined) target[k]=src[k];
      });
    }
    return target;
  }

  function scaleRem(val,factor) {
    var m=String(val).match(/^([\d.]+)(rem|em|px)$/);
    if (!m||factor===1) return val;
    return (parseFloat(m[1])*factor).toFixed(3)+m[2];
  }

  var _THEMES = {
    default: { accent:'#C8DD5A', accentText:'#0c0d0c', progressBg:'#C8DD5A', triggerColor:'#C8DD5A',
               panelBg:'#0e0f0e', panelBorder:'#1e1f1e', headerColor:'#c6c7bd', toastBorder:'#1e1f1e' },
    ocean:   { accent:'#04b5a3', accentText:'#0c0d0c', progressBg:'#81E6D9', triggerColor:'#04b5a3',
               panelBg:'#080f0e', panelBorder:'#0e2020', headerColor:'#81E6D9', toastBorder:'#0e2020' },
    ember:   { accent:'#f69653', accentText:'#0c0d0c', progressBg:'#d9b375', triggerColor:'#f69653',
               panelBg:'#0f0a06', panelBorder:'#2a1808', headerColor:'#d9b375', toastBorder:'#2a1808' },
    violet:  { accent:'#C3A5E5', accentText:'#0c0d0c', progressBg:'#FFB3D9', triggerColor:'#C3A5E5',
               panelBg:'#0c0810', panelBorder:'#1e1430', headerColor:'#FFB3D9', toastBorder:'#1e1430' },
    nature:  { accent:'#C8DD5A', accentText:'#0c0d0c', progressBg:'#81E6D9', triggerColor:'#81E6D9',
               panelBg:'#080e08', panelBorder:'#0e2010', headerColor:'#C8DD5A', toastBorder:'#0e2010' },
    blood:   { accent:'#F08080', accentText:'#0c0d0c', progressBg:'#E5C3B3', triggerColor:'#F08080',
               panelBg:'#0f0808', panelBorder:'#2a1010', headerColor:'#E5C3B3', toastBorder:'#2a1010' },
  };

  // ── Rarity config ─────────────────────────────────────────────────
  var RARITIES = {
    common:    { label:'普通', color:'#c6c7bd', glow:'rgba(198,199,189,.22)' },
    rare:      { label:'稀有', color:'#90CDF4', glow:'rgba(144,205,244,.30)' },
    epic:      { label:'史詩', color:'#C3A5E5', glow:'rgba(195,165,229,.30)' },
    legendary: { label:'傳說', color:'#C8DD5A', glow:'rgba(200,221,90,.36)'  },
  };

  // ── Defaults ──────────────────────────────────────────────────────
  var _D = {
    showList: true,
    panelSide: 'right',
    panelWidth: 280,
    triggerPos: 'bottom-left',
    triggerSize: 46,
    toastWidth: 270,
    toastPosition: 'top-right',
    toastDuration: { common: 3200, rare: 3200, epic: 3200, legendary: 4500 },
    rarityLabels: { common:'普通', rare:'稀有', epic:'史詩', legendary:'傳說' },
    achievements: [],
    onUnlock: null,
    themeName: 'default',
    scale: 1,
    typography: {
      panelTitle:  '0.86rem',
      panelItem:   '0.80rem',
      panelDesc:   '0.70rem',
      panelMeta:   '0.63rem',
      toastTitle:  '0.86rem',
      toastDesc:   '0.70rem',
      toastEyebrow:'0.62rem',
      progressLabel:'0.66rem',
    },
  };

  // ╔═══════════════════════════════════════════════════════╗
  // ║  AchievementSystem                                    ║
  // ╚═══════════════════════════════════════════════════════╝
  function AchievementSystem(options) {
    options = options || {};
    var name      = options.themeName || (G.AchievementConfig&&G.AchievementConfig.themeName) || 'default';
    var themeData = AchievementSystem.themes[name] || AchievementSystem.themes['default'];

    this.cfg = deepMerge({}, _D, themeData ? { _themeData: themeData } : {}, G.AchievementConfig||{}, options);
    this._theme = deepMerge({}, _THEMES['default'], themeData||{});
    this.cfg.themeName = name;

    this._achievements = (options.achievements||[]).map(function(a){ return Object.assign({},a,{_unlocked:false,_unlockedAt:null}); });
    this._map = {};
    this._achievements.forEach(function(a){ this._map[a.id]=a; }, this);
    this._panelOpen = false;

    AchievementSystem._injectCSS();
    var self = this;
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ self._mount(); });
    else this._mount();
  }

  AchievementSystem.themes = _THEMES;
  AchievementSystem.registerTheme = function(name,cfg) { AchievementSystem.themes[name]=cfg; };

  // ── API ────────────────────────────────────────────────────────────
  AchievementSystem.prototype.check = function(ctx) {
    var newly=[], self=this;
    this._achievements.forEach(function(a){
      if (a._unlocked) return;
      var met=false;
      try { if (typeof a.condition==='function') met=!!a.condition(ctx); } catch(_){}
      if (met) { self._doUnlock(a,ctx); newly.push(a.id); }
    });
    if (newly.length) this._refreshPanel();
    return newly;
  };

  AchievementSystem.prototype.unlock = function(id) {
    var a=this._map[id]; if(a&&!a._unlocked){ this._doUnlock(a,{}); this._refreshPanel(); }
  };

  AchievementSystem.prototype.isUnlocked  = function(id) { return !!(this._map[id]&&this._map[id]._unlocked); };
  AchievementSystem.prototype.getAll      = function()   { return this._achievements.map(function(a){return Object.assign({},a);}); };
  AchievementSystem.prototype.getUnlocked = function()   { return this._achievements.filter(function(a){return a._unlocked;}).map(function(a){return Object.assign({},a);}); };
  AchievementSystem.prototype.showPanel   = function()   { this._panelOpen=true;  this._syncPanel(); };
  AchievementSystem.prototype.hidePanel   = function()   { this._panelOpen=false; this._syncPanel(); };
  AchievementSystem.prototype.togglePanel = function()   { this._panelOpen=!this._panelOpen; this._syncPanel(); };

  AchievementSystem.prototype.setShowList = function(v) { this.cfg.showList=!!v; this._refreshPanel(); };

  AchievementSystem.prototype.setPanelWidth = function(px) {
    this.cfg.panelWidth = px;
    if (this._panelEl) this._panelEl.style.width = px + 'px';
  };

  AchievementSystem.prototype.setTheme = function(name) {
    var t=AchievementSystem.themes[name];
    if (!t) { console.warn('AchievementSystem: unknown theme "'+name+'"'); return; }
    this._theme = deepMerge({}, _THEMES['default'], t);
    this.cfg.themeName=name;
    this._refreshPanel();
    if (this._triggerEl) {
      this._triggerEl.style.color=this._theme.triggerColor;
      this._triggerEl.style.borderColor=this._theme.panelBorder;
    }
  };

  AchievementSystem.prototype.setScale = function(s) { this.cfg.scale=s; this._refreshPanel(); };
  AchievementSystem.prototype.setTypography = function(t) { deepMerge(this.cfg.typography,t); this._refreshPanel(); };

  /**
   * Export all achievement states as a plain object (JSON-serialisable).
   * Shape:
   *   {
   *     version:      1,
   *     exportedAt:  "2026-03-14T10:00:00.000Z",
   *     themeName:   "ocean",
   *     achievements: [
   *       { id, title, rarity, unlocked, unlockedAt }
   *     ]
   *   }
   * Usage:
   *   var json = JSON.stringify(ach.exportState());
   *   // POST to PHP: fetch('/save.php', { method:'POST', body: json })
   */
  AchievementSystem.prototype.exportState = function() {
    return {
      version:      1,
      exportedAt:   new Date().toISOString(),
      themeName:    this.cfg.themeName,
      achievements: this._achievements.map(function(a) {
        return {
          id:         a.id,
          title:      a.title,
          rarity:     a.rarity || 'common',
          unlocked:   !!a._unlocked,
          unlockedAt: a._unlockedAt ? a._unlockedAt.toISOString() : null,
        };
      }),
    };
  };

  /**
   * Restore a previously exported state.
   * Silently restores unlocked/unlockedAt without re-triggering toasts or onUnlock.
   * @param {Object} state  — output of exportState() or parsed PHP response
   */
  AchievementSystem.prototype.importState = function(state) {
    if (!state || !Array.isArray(state.achievements)) return;
    var self = this;
    state.achievements.forEach(function(saved) {
      var a = self._map[saved.id];
      if (!a) return;
      a._unlocked   = !!saved.unlocked;
      a._unlockedAt = saved.unlockedAt ? new Date(saved.unlockedAt) : null;
    });
    this._refreshPanel();
  };

  AchievementSystem.prototype.destroy = function() {
    if(this._triggerEl)this._triggerEl.remove();
    if(this._panelEl)this._panelEl.remove();
    if(this._toastEl)this._toastEl.remove();
  };

  // ── Helpers ────────────────────────────────────────────────────────
  AchievementSystem.prototype._fs = function(key) {
    var v=this.cfg.typography&&this.cfg.typography[key]||_D.typography[key];
    return scaleRem(v, this.cfg.scale||1);
  };

  // Rarity helper: merges static colour/glow with configurable label
  AchievementSystem.prototype._r = function(rarityKey) {
    var base   = RARITIES[rarityKey] || RARITIES.common;
    var labels = (this.cfg.rarityLabels) || _D.rarityLabels;
    return { label: labels[rarityKey] || base.label, color: base.color, glow: base.glow };
  };

  AchievementSystem.prototype._mount = function() {
    this._buildToasts();
    this._buildTrigger();
    this._buildPanel();
  };

  AchievementSystem.prototype._doUnlock = function(a, ctx) {
    a._unlocked=true; a._unlockedAt=new Date();
    this._showToast(a);
    if (this.cfg.onUnlock) this.cfg.onUnlock(Object.assign({},a), ctx);
  };

  // ── Trigger ────────────────────────────────────────────────────────
  AchievementSystem.prototype._buildTrigger = function() {
    var pos  = this.cfg.triggerPos  || 'bottom-left';
    var size = (this.cfg.triggerSize || 46) + 'px';
    var el   = document.createElement('button');
    el.id = 'ach-trigger';
    el.className = 'ach-trigger ach-trigger--' + pos;
    el.setAttribute('aria-label','成就系統');
    el.setAttribute('title','成就');
    el.style.color  = this._theme.triggerColor;
    el.style.width  = size;
    el.style.height = size;
    el.innerHTML = '<i class="bi bi-award-fill ach-trigger-icon"></i>'
      + '<span class="ach-trigger-badge" id="ach-badge" style="background:'+this._theme.accent+';color:'+this._theme.accentText+'">0</span>';
    var self = this;
    el.addEventListener('click', function(){ self.togglePanel(); });
    document.body.appendChild(el);
    this._triggerEl = el;
  };

  // ── Panel ──────────────────────────────────────────────────────────
  AchievementSystem.prototype._buildPanel = function() {
    var side  = this.cfg.panelSide === 'left' ? 'left' : 'right';
    var width = (this.cfg.panelWidth || 280) + 'px';
    var el    = document.createElement('aside');
    el.id = 'ach-panel';
    el.className = 'ach-panel ach-panel--' + side;
    el.style.width = width;
    el.setAttribute('role','dialog'); el.setAttribute('aria-modal','false'); el.setAttribute('aria-label','成就清單');
    var self=this;
    document.addEventListener('click',function(e){
      if (self._panelOpen&&self._panelEl&&!self._panelEl.contains(e.target)&&!(self._triggerEl&&self._triggerEl.contains(e.target)))
        self.hidePanel();
    });
    document.body.appendChild(el);
    this._panelEl=el;
    this._refreshPanel();
  };

  AchievementSystem.prototype._refreshPanel = function() {
    if (!this._panelEl) return;
    var th=this._theme;
    var total=this._achievements.length;
    var ul=this._achievements.filter(function(a){return a._unlocked;}).length;
    var pct=total?Math.round(ul/total*100):0;

    var badge=document.getElementById('ach-badge');
    if (badge) { badge.textContent=ul; badge.style.background=th.accent; badge.style.color=th.accentText; }
    if (this._triggerEl) { if(ul>0)this._triggerEl.classList.add('has-items'); }

    this._panelEl.style.background = th.panelBg;
    this._panelEl.style.borderColor = th.panelBorder;

    var self=this;
    this._panelEl.innerHTML=''
      +'<header class="ach-panel-hdr" style="border-color:'+th.panelBorder+'">'
        +'<span class="ach-panel-title" style="color:'+th.headerColor+';font-size:'+this._fs('panelTitle')+'">'
          +'<i class="bi bi-award-fill" style="color:'+th.accent+'"></i> 成就</span>'
        +'<div class="ach-panel-controls">'
          +'<button class="ach-icon-btn" id="ach-toggle-list" title="'+(this.cfg.showList?'隱藏清單':'顯示清單')+'">'
            +'<i class="bi '+(this.cfg.showList?'bi-eye':'bi-eye-slash')+'"></i></button>'
          +'<button class="ach-icon-btn" id="ach-close-btn" title="關閉"><i class="bi bi-x-lg"></i></button>'
        +'</div>'
      +'</header>'
      +'<div class="ach-progress-track" style="background:'+th.panelBorder+'">'
        +'<div class="ach-progress-fill" style="width:'+pct+'%;background:'+th.progressBg+'"></div>'
      +'</div>'
      +'<div class="ach-prog-label" style="font-size:'+this._fs('progressLabel')+'">'
        +'<span style="color:'+th.accent+'">'+ul+'</span>'
        +'<span style="color:#5a5b58"> / '+total+'</span>'
        +'<span class="ach-prog-pct" style="color:'+th.accent+'">'+pct+'%</span>'
      +'</div>'
      +(this.cfg.showList ? this._renderList() : '<div class="ach-hidden-msg"><i class="bi bi-eye-slash"></i><span>成就清單已隱藏</span></div>');

    var closeBtn=document.getElementById('ach-close-btn');
    if (closeBtn) closeBtn.addEventListener('click',function(){ self.hidePanel(); });
    var toggleBtn=document.getElementById('ach-toggle-list');
    if (toggleBtn) toggleBtn.addEventListener('click',function(){ self.setShowList(!self.cfg.showList); });
  };

  AchievementSystem.prototype._renderList = function() {
    if (!this._achievements.length) return '<div class="ach-empty">尚無成就設定</div>';
    var ul=this._achievements.filter(function(a){return  a._unlocked;});
    var lk=this._achievements.filter(function(a){return !a._unlocked;});
    var th=this._theme, self=this;
    var html='<div class="ach-list-wrap">';
    if (ul.length) {
      html+='<div class="ach-group-hdr" style="font-size:'+this._fs('panelMeta')+'">'
        +'<i class="bi bi-check-circle-fill" style="color:'+th.accent+'"></i> 已解鎖（'+ul.length+'）</div>';
      ul.forEach(function(a){ html+=self._renderItem(a); });
    }
    if (lk.length) {
      html+='<div class="ach-group-hdr" style="font-size:'+this._fs('panelMeta')+';margin-top:4px">'
        +'<i class="bi bi-lock-fill" style="color:#5a5b58"></i> 未解鎖（'+lk.length+'）</div>';
      lk.forEach(function(a){ html+=self._renderItem(a); });
    }
    return html+'</div>';
  };

  AchievementSystem.prototype._renderItem = function(a) {
    var r=this._r(a.rarity||'common');
    if (!a._unlocked&&a.secret)
      return '<div class="ach-item ach-item--secret">'
        +'<div class="ach-item-icon" style="border-color:#181918;color:#1e1f1e"><i class="bi bi-question-lg"></i></div>'
        +'<div class="ach-item-body"><div class="ach-item-title" style="color:#4a4b48;font-size:'+this._fs('panelItem')+'">??? 隱藏成就</div></div>'
        +'</div>';
    var isSpoiler=!a._unlocked&&!!a.spoiler;
    var icon  = isSpoiler?'bi-shield-lock-fill':(a.icon||'bi-award');
    var title = isSpoiler?'???':(a.title||a.id);
    var desc  = isSpoiler?'達成後揭曉…':(a.desc||'');
    var lockIcon= !a._unlocked?'<i class="bi bi-lock-fill" style="font-size:.55rem;color:#5a5b58;margin-left:3px"></i>':'';
    return '<div class="ach-item '+(a._unlocked?'ach-item--unlocked':'ach-item--locked')+'" data-id="'+a.id+'" role="listitem">'
      +'<div class="ach-item-icon" style="border-color:'+(a._unlocked?r.color:'#242524')+';'
        +'color:'+(a._unlocked?r.color:'#5a5b58')+';'
        +'box-shadow:'+(a._unlocked?'0 0 12px '+r.glow:'none')+'"><i class="bi '+icon+'"></i></div>'
      +'<div class="ach-item-body">'
        +'<div class="ach-item-title" style="color:'+(a._unlocked?'#c6c7bd':'#7a7b78')+';font-size:'+this._fs('panelItem')+'">'+title+lockIcon+'</div>'
        +(desc?'<div class="ach-item-desc" style="color:'+(a._unlocked?'#8a8b88':'#5a5b58')+';font-size:'+this._fs('panelDesc')+'">'+desc+'</div>':'')
        +'<div class="ach-item-meta" style="font-size:'+this._fs('panelMeta')+'">'
          +'<span class="ach-rarity" style="color:'+r.color+'">'+r.label+'</span>'
          +(a._unlocked&&a._unlockedAt?'<span class="ach-time">'+this._fmtTime(a._unlockedAt)+'</span>':'')
          +(a.reward&&a._unlocked?(function(){var b=parseInt(a.reward);var c=(!isNaN(b)&&b<0)?'#F08080':'#C8DD5A';return '<span class="ach-reward" style="color:'+c+'"><i class="bi bi-gift-fill"></i> '+a.reward+'</span>';}()):'')

        +'</div>'
      +'</div>'
      +'</div>';
  };

  // ── Toast ──────────────────────────────────────────────────────────
  AchievementSystem.prototype._buildToasts = function() {
    var el  = document.createElement('div');
    el.id   = 'ach-toasts';
    el.className = 'ach-toasts';
    // Apply toastWidth and toastPosition via inline style
    var w   = (this.cfg.toastWidth || 270) + 'px';
    var pos = this.cfg.toastPosition || 'top-right';
    el.style.width = w;
    // Position mapping
    var posMap = {
      'top-right':    'top:60px;right:16px;bottom:auto;left:auto;',
      'top-left':     'top:60px;left:16px;bottom:auto;right:auto;',
      'bottom-right': 'bottom:80px;right:16px;top:auto;left:auto;',
      'bottom-left':  'bottom:80px;left:16px;top:auto;right:auto;',
    };
    el.style.cssText += posMap[pos] || posMap['top-right'];
    document.body.appendChild(el);
    this._toastEl = el;
  };

  AchievementSystem.prototype._showToast = function(a) {
    if (!this._toastEl) return;
    var r  = this._r(a.rarity || 'common'), th = this._theme;
    var toast = document.createElement('div');
    toast.className = 'ach-toast';
    toast.style.borderLeftColor = r.color;
    toast.style.background      = th.panelBg;
    toast.style.borderColor     = th.toastBorder;
    toast.style.borderLeftColor = r.color;
    toast.innerHTML = ''
      + '<div class="ach-toast-icon" style="color:'+r.color+';border-color:'+r.color+'">'
        + '<i class="bi '+(a.icon||'bi-award-fill')+'"></i></div>'
      + '<div class="ach-toast-body">'
        + '<div class="ach-toast-eyebrow" style="font-size:'+this._fs('toastEyebrow')+'">'
          + '<span>成就解鎖</span><span class="ach-toast-rarity" style="color:'+r.color+'">'+r.label+'</span></div>'
        + '<div class="ach-toast-title" style="color:'+r.color+';font-size:'+this._fs('toastTitle')+'">'+(a.title||a.id)+'</div>'
        + (a.desc   ? '<div class="ach-toast-desc"   style="font-size:'+this._fs('toastDesc')+'">'+a.desc+'</div>'   : '')
        + (a.reward ? '<div class="ach-toast-reward" style="font-size:'+this._fs('toastDesc')+';color:'+(parseInt(a.reward)<0?'#F08080':'#C8DD5A')+'"><i class="bi bi-gift-fill"></i> '+a.reward+'</div>' : '')
      + '</div>';
    this._toastEl.appendChild(toast);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ toast.classList.add('ach-toast--show'); }); });
    // toastDuration: per-rarity map or single number
    var durCfg = this.cfg.toastDuration;
    var dur;
    if (typeof durCfg === 'number') {
      dur = durCfg;
    } else {
      var map = deepMerge({}, _D.toastDuration, durCfg || {});
      dur = map[a.rarity || 'common'] || 3200;
    }
    setTimeout(function(){
      toast.classList.remove('ach-toast--show');
      setTimeout(function(){ toast.remove(); }, 420);
    }, dur);
  };

  AchievementSystem.prototype._syncPanel = function() {
    if (!this._panelEl) return;
    if (this._panelOpen) this._panelEl.classList.add('ach-panel--open');
    else this._panelEl.classList.remove('ach-panel--open');
    this._refreshPanel();
  };

  AchievementSystem.prototype._fmtTime = function(d) {
    return d.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  };

  // ── Static CSS ─────────────────────────────────────────────────────
  AchievementSystem._injectCSS = function() {
    if (document.getElementById('ach-core-css')) return;
    var s=document.createElement('style'); s.id='ach-core-css';
    s.textContent=''
      +'.ach-trigger{position:fixed;z-index:900;width:46px;height:46px;border-radius:50%;'
        +'background:#0e0f0e;border:1.5px solid #222322;font-size:1.2rem;'
        +'display:flex;align-items:center;justify-content:center;cursor:pointer;'
        +'box-shadow:0 4px 18px rgba(0,0,0,.7);transition:border-color .2s,box-shadow .2s;padding:0;}'
      +'.ach-trigger:hover,.ach-trigger.has-items{border-color:currentColor;box-shadow:0 4px 22px rgba(200,221,90,.28);}'
      +'.ach-trigger--bottom-left{bottom:24px;left:24px;}'
      +'.ach-trigger--bottom-right{bottom:24px;right:24px;}'
      +'.ach-trigger--top-left{top:64px;left:24px;}'
      +'.ach-trigger-badge{position:absolute;top:-5px;right:-5px;'
        +'font-size:.58rem;font-weight:800;min-width:16px;height:16px;padding:0 3px;'
        +'border-radius:8px;display:flex;align-items:center;justify-content:center;'
        +'font-family:\'Exo 2\',monospace;border:1.5px solid #0c0d0c;transition:transform .2s;}'
      +'.ach-panel{position:fixed;top:0;bottom:0;width:280px;z-index:850;'
        +'display:flex;flex-direction:column;overflow:hidden;'
        +'transition:transform .3s cubic-bezier(.4,0,.2,1);}'
      +'.ach-panel--right{right:0;border-left:1px solid;transform:translateX(100%);}'
      +'.ach-panel--left{left:0;border-right:1px solid;transform:translateX(-100%);}'
      +'.ach-panel--open{transform:translateX(0);box-shadow:-8px 0 40px rgba(0,0,0,.7);}'
      +'.ach-panel--left.ach-panel--open{box-shadow:8px 0 40px rgba(0,0,0,.7);}'
      +'.ach-panel-hdr{padding:13px 14px 10px;border-bottom:1px solid;'
        +'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}'
      +'.ach-panel-title{font-weight:700;font-family:\'Exo 2\',sans-serif;display:flex;align-items:center;gap:7px;}'
      +'.ach-panel-controls{display:flex;align-items:center;gap:4px;}'
      +'.ach-icon-btn{background:none;border:none;color:#3a3b38;cursor:pointer;font-size:.82rem;'
        +'padding:3px 6px;border-radius:4px;transition:color .15s,background .15s;display:flex;align-items:center;}'
      +'.ach-icon-btn:hover{color:#c6c7bd;background:#181918;}'
      +'.ach-progress-track{height:2px;flex-shrink:0;}'
      +'.ach-progress-fill{height:100%;transition:width .6s ease;border-radius:0 1px 1px 0;}'
      +'.ach-prog-label{padding:5px 14px 6px;font-family:\'Share Tech Mono\',monospace;'
        +'display:flex;align-items:center;gap:6px;flex-shrink:0;}'
      +'.ach-prog-pct{margin-left:auto;font-weight:700;}'
      +'.ach-group-hdr{padding:7px 14px 4px;color:#6a6b68;text-transform:uppercase;letter-spacing:.1em;'
        +'font-family:\'Share Tech Mono\',monospace;display:flex;align-items:center;gap:6px;'
        +'border-top:1px solid #131413;flex-shrink:0;}'
      +'.ach-list-wrap{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1a1b1a transparent;padding-bottom:16px;}'
      +'.ach-item{display:flex;align-items:flex-start;gap:10px;padding:9px 14px;border-bottom:1px solid #111211;transition:background .15s;}'
      +'.ach-item:hover{background:#111211;}'
      +'.ach-item--locked{opacity:.44;}.ach-item--secret{opacity:.15;}.ach-item--unlocked{opacity:1;}'
      +'.ach-item-icon{width:34px;height:34px;border-radius:7px;border:1.5px solid;flex-shrink:0;'
        +'display:flex;align-items:center;justify-content:center;font-size:.95rem;'
        +'background:#0c0d0c;transition:box-shadow .25s;}'
      +'.ach-item-body{flex:1;min-width:0;}'
      +'.ach-item-title{font-weight:700;font-family:\'Exo 2\',sans-serif;'
        +'display:flex;align-items:center;gap:4px;margin-bottom:2px;line-height:1.3;}'
      +'.ach-item-desc{line-height:1.4;font-family:\'Share Tech Mono\',monospace;margin-bottom:4px;}'
      +'.ach-item-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}'
      +'.ach-rarity{font-family:\'Share Tech Mono\',monospace;text-transform:uppercase;letter-spacing:.08em;}'
      +'.ach-time{color:#5a5b58;font-family:\'Share Tech Mono\',monospace;}'
      +'.ach-reward{color:#C8DD5A;display:flex;align-items:center;gap:3px;font-family:\'Exo 2\',sans-serif;}'
      +'.ach-hidden-msg{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;'
        +'color:#4a4b48;font-family:\'Share Tech Mono\',monospace;flex-direction:column;padding:32px 16px;}'
      +'.ach-empty{padding:28px 16px;color:#4a4b48;text-align:center;font-family:\'Share Tech Mono\',monospace;}'
      +'.ach-toasts{position:fixed;top:60px;right:16px;z-index:9990;'
        +'display:flex;flex-direction:column;gap:8px;pointer-events:none;width:270px;}'
      +'.ach-toast{border:1px solid;border-left:3px solid;padding:10px 12px;'
        +'border-radius:0 8px 8px 0;display:flex;align-items:flex-start;gap:10px;'
        +'box-shadow:0 8px 36px rgba(0,0,0,.85);'
        +'opacity:0;transform:translateX(16px);transition:opacity .35s ease,transform .35s ease;pointer-events:auto;}'
      +'.ach-toast.ach-toast--show{opacity:1;transform:translateX(0);}'
      +'.ach-toast-icon{width:34px;height:34px;border-radius:7px;border:1.5px solid;'
        +'display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;background:#0c0d0c;}'
      +'.ach-toast-body{flex:1;min-width:0;}'
      +'.ach-toast-eyebrow{display:flex;align-items:center;justify-content:space-between;'
        +'color:#6a6b68;text-transform:uppercase;letter-spacing:.1em;font-family:\'Share Tech Mono\',monospace;margin-bottom:2px;}'
      +'.ach-toast-rarity{font-weight:700;}'
      +'.ach-toast-title{font-weight:700;font-family:\'Exo 2\',sans-serif;line-height:1.2;}'
      +'.ach-toast-desc{color:#8a8b88;margin-top:2px;line-height:1.3;font-family:\'Share Tech Mono\',monospace;}'
      +'.ach-toast-reward{color:#C8DD5A;margin-top:4px;display:flex;align-items:center;gap:4px;font-family:\'Exo 2\',sans-serif;}';
    document.head.appendChild(s);
  };

  G.AchievementSystem = AchievementSystem;

  // ╔═══════════════════════════════════════════════════════════════════╗
  // ║  Declarative HTML API                                             ║
  // ║                                                                   ║
  // ║  <ach-system                                                      ║
  // ║    theme="ocean"                                                  ║
  // ║    show-list                          (boolean attr, presence=true)║
  // ║    hide-list                          (boolean attr)              ║
  // ║    trigger-pos="bottom-left"                                      ║
  // ║    panel-side="right"                                             ║
  // ║    scale="1.1"                                                    ║
  // ║    var="ach">                         (global var name, default "ach")
  // ║                                                                   ║
  // ║    <ach-item                                                      ║
  // ║      id="my-ach"                                                  ║
  // ║      icon="bi-star-fill"                                          ║
  // ║      title="成就名稱"                                              ║
  // ║      rarity="rare"                                                ║
  // ║      reward="+ 1 點"                                              ║
  // ║      spoiler                          (boolean attr)              ║
  // ║      secret>                          (boolean attr)              ║
  // ║      成就描述文字放在內容裡。                                        ║
  // ║    </ach-item>                                                    ║
  // ║                                                                   ║
  // ║  </ach-system>                                                    ║
  // ║                                                                   ║
  // ║  Unlock from any element:                                         ║
  // ║    <button data-ach-unlock="my-ach">完成</button>                 ║
  // ║    <button data-ach-unlock="a1,a2,a3">批次解鎖</button>           ║
  // ║                                                                   ║
  // ║  Or from JS (the instance is stored in the var you specify):      ║
  // ║    ach.unlock('my-ach');                                          ║
  // ╚═══════════════════════════════════════════════════════════════════╝
  function _parseBool(el, attr) {
    return el.hasAttribute(attr);
  }

  function _parseAchItems(container) {
    var items = container.querySelectorAll('ach-item');
    var result = [];
    items.forEach(function(el) {
      var a = {
        id:      el.getAttribute('id')     || ('ach-' + Math.random().toString(36).slice(2,7)),
        icon:    el.getAttribute('icon')   || 'bi-award-fill',
        title:   el.getAttribute('title')  || '未命名成就',
        rarity:  el.getAttribute('rarity') || 'common',
        desc:    el.textContent.trim(),
        reward:  el.getAttribute('reward') || undefined,
        spoiler: _parseBool(el, 'spoiler'),
        secret:  _parseBool(el, 'secret'),
        // Manual achievements: condition always false, unlock via .unlock(id)
        condition: function() { return false; },
      };
      // Pass reward flag for onUnlock handler convenience
      if (a.reward) a._reward = true;
      result.push(a);
    });
    return result;
  }

  function _initDeclarative() {
    var containers = document.querySelectorAll('ach-system');
    containers.forEach(function(el) {
      // Hide the raw tag content
      el.style.display = 'none';

      // Parse options from attributes
      var showList = !_parseBool(el, 'hide-list');

      // toastDuration: accepts single number "3000" or per-rarity JSON '{"legendary":5000}'
      var toastDurRaw = el.getAttribute('toast-duration');
      var toastDur;
      if (toastDurRaw) {
        var parsed = parseFloat(toastDurRaw);
        toastDur = isNaN(parsed) ? JSON.parse(toastDurRaw) : parsed;
      }

      // rarityLabels: JSON string '{"common":"C","rare":"R","epic":"E","legendary":"L"}'
      var rarityRaw = el.getAttribute('rarity-labels');
      var rarityLabels = rarityRaw ? JSON.parse(rarityRaw) : undefined;

      var opts = {
        themeName:     el.getAttribute('theme')          || 'default',
        showList:      showList,
        triggerPos:    el.getAttribute('trigger-pos')    || 'bottom-left',
        panelSide:     el.getAttribute('panel-side')     || 'right',
        panelWidth:    parseInt(el.getAttribute('panel-width'))    || 280,
        triggerSize:   parseInt(el.getAttribute('trigger-size'))   || 46,
        toastWidth:    parseInt(el.getAttribute('toast-width'))    || 270,
        toastPosition: el.getAttribute('toast-position') || 'top-right',
        scale:         parseFloat(el.getAttribute('scale'))        || 1,
        achievements:  _parseAchItems(el),
      };
      if (toastDur    !== undefined) opts.toastDuration  = toastDur;
      if (rarityLabels !== undefined) opts.rarityLabels  = rarityLabels;

      // onUnlock: reward handling built-in
      opts.onUnlock = function(a) {
        if (a._reward && a.reward) {
          var bonus = parseInt(a.reward);
          if (!isNaN(bonus) && bonus !== 0) {
            // Dispatch a custom event so host page can react
            document.dispatchEvent(new CustomEvent('ach:reward', {
              detail: { id: a.id, bonus: bonus, achievement: a }
            }));
          }
        }
        // Dispatch generic unlock event
        document.dispatchEvent(new CustomEvent('ach:unlock', {
          detail: { id: a.id, achievement: a }
        }));
      };

      var instance = new AchievementSystem(opts);

      // Expose instance as global var (default: "ach", customisable via var="myAch")
      var varName = el.getAttribute('var') || 'ach';
      G[varName] = instance;

      // Expose on element itself too
      el._achInstance = instance;
    });

    // Wire up data-ach-unlock triggers (works for dynamically added ones too via delegation)
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-ach-unlock]');
      if (!btn) return;
      var ids = btn.getAttribute('data-ach-unlock')
        .split(',').map(function(s){ return s.trim(); }).filter(Boolean);
      var containers = document.querySelectorAll('ach-system');
      ids.forEach(function(id) {
        containers.forEach(function(el) {
          if (el._achInstance) el._achInstance.unlock(id);
        });
      });
    });

    // Init ach-quiz elements
    _initQuiz();
    // Init ach-choice elements
    _initChoice();
  }

  // ── ach-quiz CSS (injected once) ──────────────────────────────────
  function _injectQuizCSS() {
    if (document.getElementById('ach-quiz-css')) return;
    var s = document.createElement('style');
    s.id = 'ach-quiz-css';
    s.textContent = ''
      +'.ach-quiz{display:flex;flex-direction:column;gap:8px;padding:16px 18px;'
        +'border-radius:10px;border:1px solid;margin:8px 0;}'
      +'.ach-quiz--done .ach-quiz-input{opacity:.5;}'
      +'.ach-quiz-question{font-size:.85rem;line-height:1.55;font-family:\'Exo 2\',sans-serif;}'
      +'.ach-quiz-hint{font-size:.7rem;font-family:\'Share Tech Mono\',monospace;'
        +'opacity:.7;margin-top:-4px;}'
      +'.ach-quiz-row{display:flex;gap:8px;align-items:center;}'
      +'.ach-quiz-input{'
        +'flex:1;background:#0c0d0c;border:1.5px solid;border-radius:6px;'
        +'padding:7px 11px;font-size:.82rem;font-family:\'Exo 2\',sans-serif;'
        +'color:#c6c7bd;outline:none;transition:border-color .18s,box-shadow .18s;}'
      +'.ach-quiz-input:focus{box-shadow:0 0 0 2px;}'
      +'.ach-quiz-input:disabled{cursor:not-allowed;}'
      +'.ach-quiz-btn{'
        +'display:inline-flex;align-items:center;gap:6px;'
        +'padding:7px 14px;border-radius:6px;border:1.5px solid;'
        +'font-size:.8rem;font-weight:700;font-family:\'Exo 2\',sans-serif;'
        +'cursor:pointer;transition:filter .15s,transform .1s;white-space:nowrap;'
        +'background:#0c0d0c;}'
      +'.ach-quiz-btn:hover:not(:disabled){filter:brightness(1.25);}'
      +'.ach-quiz-btn:active:not(:disabled){transform:scale(.96);}'
      +'.ach-quiz-btn:disabled{opacity:.4;cursor:not-allowed;}'
      +'.ach-quiz-feedback{'
        +'font-size:.75rem;font-family:\'Share Tech Mono\',monospace;'
        +'display:flex;align-items:center;gap:5px;min-height:1.2em;'
        +'transition:opacity .2s;}'
      +'.ach-quiz-feedback i{font-size:.8rem;}';
    document.head.appendChild(s);
  }

  // ── Resolve ach instance for a quiz element ───────────────────────
  // Priority: var attr on quiz → var attr on nearest ach-system → 'ach'
  function _resolveInstance(quizEl) {
    var varName = quizEl.getAttribute('var');
    if (varName && G[varName]) return G[varName];
    var sys = quizEl.closest('ach-system');
    if (sys && sys._achInstance) return sys._achInstance;
    // Walk up DOM to find any ach-system ancestor
    var parent = quizEl.parentElement;
    while (parent) {
      if (parent.tagName && parent.tagName.toLowerCase() === 'ach-system' && parent._achInstance)
        return parent._achInstance;
      parent = parent.parentElement;
    }
    // Fall back to default global 'ach'
    return G['ach'] || null;
  }

  // ── Build one quiz element ────────────────────────────────────────
  function _buildQuiz(el) {
    /*
     * Attributes:
     *   question      the question text (or use element text content)
     *   answer        single correct answer
     *   answers       comma-separated list of accepted answers
     *   ach-id        achievement id to unlock on correct answer
     *   placeholder   input placeholder  (default '輸入答案')
     *   btn-text      button label       (default '核對')
     *   hint          hint shown below question
     *   case-sensitive  boolean attr, default false
     *   var           override ach instance global var name
     */
    // <ach-question> 子元素優先（支援 HTML 題幹），次選 question 屬性
    var qChildEl      = el.querySelector('ach-question');
    var questionHTML  = qChildEl ? qChildEl.innerHTML : null;
    var questionText  = el.getAttribute('question') || '';
    var achId         = el.getAttribute('ach-id')      || '';
    var placeholder   = el.getAttribute('placeholder') || '輸入答案';
    var btnText       = el.getAttribute('btn-text')    || '核對';
    var hint          = el.getAttribute('hint')        || '';
    var caseSensitive = _parseBool(el, 'case-sensitive');

    // Build accepted answers list
    var raw = el.getAttribute('answers') || el.getAttribute('answer') || '';
    var accepted = raw.split(',').map(function(s){ return s.trim(); }).filter(Boolean);

    // Get theme colours from linked instance
    var instance = _resolveInstance(el);
    var th = (instance && instance._theme) ? instance._theme : _THEMES['default'];
    var accent      = th.accent      || '#C8DD5A';
    var panelBorder = th.panelBorder || '#1e1f1e';
    var panelBg     = th.panelBg     || '#0e0f0e';
    var headerColor = th.headerColor || '#c6c7bd';

    // Build wrapper div that replaces the tag
    var wrap = document.createElement('div');
    wrap.className = 'ach-quiz';
    wrap.style.cssText = 'background:'+panelBg+';border-color:'+panelBorder+';';

    // Question（HTML 題幹用 div+innerHTML，純文字用 p+textContent）
    var qEl = document.createElement(questionHTML ? 'div' : 'p');
    qEl.className = 'ach-quiz-question';
    qEl.style.color = headerColor;
    if (questionHTML) qEl.innerHTML = questionHTML;
    else              qEl.textContent = questionText;
    wrap.appendChild(qEl);

    // Hint
    if (hint) {
      var hEl = document.createElement('p');
      hEl.className = 'ach-quiz-hint';
      hEl.style.color = accent;
      hEl.textContent = hint;
      wrap.appendChild(hEl);
    }

    // Input + button row
    var row = document.createElement('div');
    row.className = 'ach-quiz-row';

    var input = document.createElement('input');
    input.className = 'ach-quiz-input';
    input.type = 'text';
    input.placeholder = placeholder;
    input.setAttribute('autocomplete', 'off');
    input.style.borderColor = panelBorder;
    input.style.setProperty('--focus-color', accent + '55');
    // Focus glow using inline style trick
    input.addEventListener('focus',  function(){ this.style.borderColor=accent; this.style.boxShadow='0 0 0 2px '+accent+'33'; });
    input.addEventListener('blur',   function(){ this.style.borderColor=panelBorder; this.style.boxShadow=''; });

    var btn = document.createElement('button');
    btn.className = 'ach-quiz-btn';
    btn.style.cssText = 'color:'+accent+';border-color:'+accent+';';
    btn.innerHTML = '<i class="bi bi-check2"></i>' + btnText;

    row.appendChild(input);
    row.appendChild(btn);
    wrap.appendChild(row);

    // Feedback line
    var fb = document.createElement('div');
    fb.className = 'ach-quiz-feedback';
    wrap.appendChild(fb);

    // Check logic
    function doCheck() {
      if (btn.disabled) return;
      var val = input.value.trim();
      if (!val) return;

      var compare = caseSensitive
        ? function(a, b){ return a === b; }
        : function(a, b){ return a.toLowerCase() === b.toLowerCase(); };

      var correct = accepted.some(function(ans){ return compare(val, ans); });

      if (correct) {
        // Success state
        fb.innerHTML = '<i class="bi bi-check-circle-fill" style="color:'+accent+'"></i>'
          + '<span style="color:'+accent+'">正確！</span>';
        input.disabled = true;
        btn.disabled   = true;
        wrap.classList.add('ach-quiz--done');
        wrap.style.borderColor = accent;
        if (instance && achId) instance.unlock(achId);
        // Dispatch event
        document.dispatchEvent(new CustomEvent('ach:quiz-correct', {
          detail: { achId: achId, value: val, element: wrap }
        }));
      } else {
        // Wrong state
        fb.innerHTML = '<i class="bi bi-x-circle-fill" style="color:#F08080"></i>'
          + '<span style="color:#F08080">再試試看</span>';
        input.style.borderColor = '#F08080';
        setTimeout(function(){
          input.style.borderColor = panelBorder;
          fb.innerHTML = '';
        }, 1400);
        document.dispatchEvent(new CustomEvent('ach:quiz-wrong', {
          detail: { achId: achId, value: val, element: wrap }
        }));
      }
    }

    btn.addEventListener('click', doCheck);
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter') doCheck();
    });

    // Replace the original tag in DOM
    el.parentNode.replaceChild(wrap, el);
  }

  // ── Init all ach-quiz elements ────────────────────────────────────
  function _initQuiz() {
    _injectQuizCSS();
    // Collect first (replaceChild invalidates live NodeList)
    var quizEls = Array.prototype.slice.call(document.querySelectorAll('ach-quiz'));
    quizEls.forEach(function(el) { _buildQuiz(el); });
  }

  // ╔═══════════════════════════════════════════════════════════════════╗
  // ║  ach-choice  ——  單選 / 多選題元件                                 ║
  // ║                                                                   ║
  // ║  <ach-choice                                                      ║
  // ║    question="題目文字"                                             ║
  // ║    type="single"          single（預設）或 multi                   ║
  // ║    ach-id="achievement-id"                                        ║
  // ║    hint="提示文字"                                                 ║
  // ║    btn-text="確認"                                                 ║
  // ║    var="ach">             覆蓋成就系統實例的全域變數名稱             ║
  // ║                                                                   ║
  // ║    <ach-option correct>正確選項文字</ach-option>                   ║
  // ║    <ach-option>錯誤選項文字</ach-option>                           ║
  // ║  </ach-choice>                                                    ║
  // ╚═══════════════════════════════════════════════════════════════════╝

  function _injectChoiceCSS() {
    if (document.getElementById('ach-choice-css')) return;
    var s = document.createElement('style');
    s.id = 'ach-choice-css';
    s.textContent = ''
      + '.ach-choice{'
        + 'display:flex;flex-direction:column;gap:10px;'
        + 'padding:16px 18px;border-radius:10px;border:1px solid;margin:8px 0;}'
      + '.ach-choice-question{'
        + 'font-size:.85rem;line-height:1.55;font-family:\'Exo 2\',sans-serif;}'
      + '.ach-choice-hint{'
        + 'font-size:.7rem;font-family:\'Share Tech Mono\',monospace;'
        + 'opacity:.7;margin-top:-4px;}'
      + '.ach-choice-type{'
        + 'font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;'
        + 'font-family:\'Share Tech Mono\',monospace;opacity:.5;margin-top:-6px;}'
      + '.ach-choice-options{'
        + 'display:flex;flex-direction:column;gap:7px;}'
      + '.ach-choice-option{'
        + 'display:flex;align-items:center;gap:10px;'
        + 'padding:9px 13px;border-radius:7px;border:1.5px solid;'
        + 'cursor:pointer;transition:background .15s,border-color .15s,color .15s;'
        + 'font-size:.84rem;line-height:1.45;'
        + 'font-family:\'Exo 2\',sans-serif;user-select:none;}'
      + '.ach-choice-option:hover:not(.is-disabled){'
        + 'filter:brightness(1.18);}'
      + '.ach-choice-option.is-selected{'
        + 'border-width:2px;}'
      + '.ach-choice-option.is-disabled{cursor:default;}'
      + '.ach-choice-marker{'
        + 'width:18px;height:18px;border-radius:50%;border:1.5px solid;'
        + 'flex-shrink:0;display:flex;align-items:center;justify-content:center;'
        + 'font-size:.65rem;transition:background .15s,border-color .15s;}'
      + '.ach-choice-option.is-multi .ach-choice-marker{'
        + 'border-radius:4px;}'
      + '.ach-choice-marker-inner{'
        + 'width:8px;height:8px;border-radius:50%;'
        + 'transform:scale(0);transition:transform .15s;}'
      + '.ach-choice-option.is-multi .ach-choice-marker-inner{'
        + 'border-radius:2px;}'
      + '.ach-choice-option.is-selected .ach-choice-marker-inner{'
        + 'transform:scale(1);}'
      + '.ach-choice-option-text{flex:1;}'
      + '.ach-choice-option.reveal-correct{'
        + 'border-color:#81E6D9 !important;color:#81E6D9 !important;}'
      + '.ach-choice-option.reveal-correct .ach-choice-marker{'
        + 'border-color:#81E6D9;background:rgba(129,230,217,.15);}'
      + '.ach-choice-option.reveal-correct .ach-choice-marker-inner{'
        + 'background:#81E6D9;transform:scale(1);}'
      + '.ach-choice-option.reveal-wrong{'
        + 'border-color:#F08080 !important;color:#F08080 !important;'
        + 'opacity:.6;}'
      + '.ach-choice-option.reveal-wrong .ach-choice-marker{'
        + 'border-color:#F08080;}'
      + '.ach-choice-footer{'
        + 'display:flex;align-items:center;gap:10px;margin-top:2px;}'
      + '.ach-choice-btn{'
        + 'display:inline-flex;align-items:center;gap:6px;'
        + 'padding:7px 16px;border-radius:6px;border:1.5px solid;'
        + 'font-size:.8rem;font-weight:700;font-family:\'Exo 2\',sans-serif;'
        + 'cursor:pointer;transition:filter .15s,transform .1s;white-space:nowrap;'
        + 'background:#0c0d0c;}'
      + '.ach-choice-btn:hover:not(:disabled){filter:brightness(1.25);}'
      + '.ach-choice-btn:active:not(:disabled){transform:scale(.96);}'
      + '.ach-choice-btn:disabled{opacity:.4;cursor:not-allowed;}'
      + '.ach-choice-feedback{'
        + 'font-size:.75rem;font-family:\'Share Tech Mono\',monospace;'
        + 'display:flex;align-items:center;gap:5px;min-height:1.2em;'
        + 'transition:opacity .2s;flex:1;}'
      + '.ach-choice--done .ach-choice-option{pointer-events:none;}';
    document.head.appendChild(s);
  }

  function _buildChoice(el) {
    // <ach-question> 子元素優先（支援 HTML 題幹），次選 question 屬性
    var qChildEl      = el.querySelector('ach-question');
    var questionHTML  = qChildEl ? qChildEl.innerHTML : null;
    var questionText  = el.getAttribute('question') || '';
    var type      = el.getAttribute('type') === 'multi' ? 'multi' : 'single';
    var achId     = el.getAttribute('ach-id')     || '';
    var hint      = el.getAttribute('hint')       || '';
    var btnText   = el.getAttribute('btn-text')   || '確認';
    var isMulti   = type === 'multi';

    // Parse options（ach-option 的 innerHTML 保留 HTML 格式）
    var optEls = Array.prototype.slice.call(el.querySelectorAll('ach-option'));
    var options = optEls.map(function(o) {
      return {
        html:    o.innerHTML,
        correct: o.hasAttribute('correct'),
      };
    });

    // Resolve instance and theme
    var instance = _resolveInstance(el);
    var th = (instance && instance._theme) ? instance._theme : _THEMES['default'];
    var accent      = th.accent      || '#C8DD5A';
    var panelBorder = th.panelBorder || '#1e1f1e';
    var panelBg     = th.panelBg     || '#0e0f0e';
    var headerColor = th.headerColor || '#c6c7bd';

    // Build wrapper
    var wrap = document.createElement('div');
    wrap.className = 'ach-choice';
    wrap.style.cssText = 'background:' + panelBg + ';border-color:' + panelBorder + ';';

    // Question（HTML 題幹用 div+innerHTML，純文字用 p+textContent）
    var qEl = document.createElement(questionHTML ? 'div' : 'p');
    qEl.className = 'ach-choice-question';
    qEl.style.color = headerColor;
    if (questionHTML) qEl.innerHTML = questionHTML;
    else              qEl.textContent = questionText;
    wrap.appendChild(qEl);

    // Type badge
    var typeEl = document.createElement('p');
    typeEl.className = 'ach-choice-type';
    typeEl.style.color = accent;
    typeEl.textContent = isMulti ? '多選題　可選多個選項' : '單選題　選出一個答案';
    wrap.appendChild(typeEl);

    // Hint
    if (hint) {
      var hEl = document.createElement('p');
      hEl.className = 'ach-choice-hint';
      hEl.style.color = accent;
      hEl.textContent = hint;
      wrap.appendChild(hEl);
    }

    // Options
    var optionsWrap = document.createElement('div');
    optionsWrap.className = 'ach-choice-options';

    var selectedSet = {};   // index => true

    var optDivs = options.map(function(opt, idx) {
      var div = document.createElement('div');
      div.className = 'ach-choice-option' + (isMulti ? ' is-multi' : '');
      div.style.cssText = 'border-color:' + panelBorder + ';color:#8a8b88;background:' + panelBg + ';';

      // Marker (circle or square)
      var marker = document.createElement('div');
      marker.className = 'ach-choice-marker';
      marker.style.cssText = 'border-color:' + panelBorder + ';';
      var inner = document.createElement('div');
      inner.className = 'ach-choice-marker-inner';
      inner.style.background = accent;
      marker.appendChild(inner);
      div.appendChild(marker);

      // Text
      var txt = document.createElement('span');
      txt.className = 'ach-choice-option-text';
      txt.innerHTML = opt.html;
      div.appendChild(txt);

      div.addEventListener('click', function() {
        if (div.classList.contains('is-disabled')) return;

        if (isMulti) {
          if (selectedSet[idx]) {
            delete selectedSet[idx];
            div.classList.remove('is-selected');
            div.style.borderColor = panelBorder;
            div.style.color = '#8a8b88';
            marker.style.borderColor = panelBorder;
          } else {
            selectedSet[idx] = true;
            div.classList.add('is-selected');
            div.style.borderColor = accent;
            div.style.color = headerColor;
            marker.style.borderColor = accent;
          }
        } else {
          // Single: deselect all others
          optDivs.forEach(function(d, i) {
            delete selectedSet[i];
            d.classList.remove('is-selected');
            d.style.borderColor = panelBorder;
            d.style.color = '#8a8b88';
            d.querySelector('.ach-choice-marker').style.borderColor = panelBorder;
          });
          selectedSet[idx] = true;
          div.classList.add('is-selected');
          div.style.borderColor = accent;
          div.style.color = headerColor;
          marker.style.borderColor = accent;
        }

        // Enable confirm button when at least one selected
        if (Object.keys(selectedSet).length > 0) {
          confirmBtn.disabled = false;
        }
      });

      optionsWrap.appendChild(div);
      return div;
    });

    wrap.appendChild(optionsWrap);

    // Footer: button + feedback
    var footer = document.createElement('div');
    footer.className = 'ach-choice-footer';

    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'ach-choice-btn';
    confirmBtn.style.cssText = 'color:' + accent + ';border-color:' + accent + ';';
    confirmBtn.innerHTML = '<i class="bi bi-check2"></i>' + btnText;
    confirmBtn.disabled = true;

    var fb = document.createElement('div');
    fb.className = 'ach-choice-feedback';

    footer.appendChild(confirmBtn);
    footer.appendChild(fb);
    wrap.appendChild(footer);

    // Confirm logic
    confirmBtn.addEventListener('click', function() {
      if (confirmBtn.disabled) return;

      var correctIndices = {};
      options.forEach(function(opt, i) { if (opt.correct) correctIndices[i] = true; });

      var selectedKeys   = Object.keys(selectedSet).map(Number);
      var correctKeys    = Object.keys(correctIndices).map(Number);

      var isCorrect =
        selectedKeys.length === correctKeys.length &&
        selectedKeys.every(function(k) { return correctIndices[k]; });

      optDivs.forEach(function(d) { d.classList.add('is-disabled'); });
      confirmBtn.disabled = true;
      wrap.classList.add('ach-choice--done');

      if (isCorrect) {
        optDivs.forEach(function(d, i) {
          if (correctIndices[i]) {
            d.classList.remove('is-selected');
            d.classList.add('reveal-correct');
            d.style.cssText = '';
          } else {
            d.style.opacity = '.3';
          }
        });
        fb.innerHTML = '<i class="bi bi-check-circle-fill" style="color:' + accent + '"></i>'
          + '<span style="color:' + accent + '">正確！</span>';
        wrap.style.borderColor = accent;
        if (instance && achId) instance.unlock(achId);
        document.dispatchEvent(new CustomEvent('ach:choice-correct', {
          detail: { achId: achId, selected: selectedKeys, element: wrap }
        }));
      } else {
        optDivs.forEach(function(d, i) {
          if (correctIndices[i]) {
            d.classList.remove('is-selected');
            d.classList.add('reveal-correct');
            d.style.cssText = '';
          } else if (selectedSet[i]) {
            d.classList.remove('is-selected');
            d.classList.add('reveal-wrong');
            d.style.cssText = '';
          } else {
            d.style.opacity = '.3';
          }
        });
        fb.innerHTML = '<i class="bi bi-x-circle-fill" style="color:#F08080"></i>'
          + '<span style="color:#F08080">再試試看，綠色是正確答案</span>';
        wrap.style.borderColor = '#F08080';

        setTimeout(function() {
          wrap.classList.remove('ach-choice--done');
          wrap.style.borderColor = panelBorder;
          fb.innerHTML = '';
          optDivs.forEach(function(d, i) {
            d.classList.remove('is-disabled', 'reveal-correct', 'reveal-wrong');
            d.style.cssText = 'border-color:' + panelBorder + ';color:#8a8b88;background:' + panelBg + ';';
            if (selectedSet[i]) {
              d.classList.add('is-selected');
              d.style.borderColor = accent;
              d.style.color = headerColor;
              d.querySelector('.ach-choice-marker').style.borderColor = accent;
            } else {
              d.querySelector('.ach-choice-marker').style.borderColor = panelBorder;
            }
          });
          confirmBtn.disabled = false;
        }, 2000);
        document.dispatchEvent(new CustomEvent('ach:choice-wrong', {
          detail: { achId: achId, selected: selectedKeys, element: wrap }
        }));
      }
    });

    el.parentNode.replaceChild(wrap, el);
  }

  function _initChoice() {
    _injectChoiceCSS();
    var choiceEls = Array.prototype.slice.call(document.querySelectorAll('ach-choice'));
    choiceEls.forEach(function(el) { _buildChoice(el); });
  }

  function _initQuiz() {
    _injectQuizCSS();
    var quizEls = Array.prototype.slice.call(document.querySelectorAll('ach-quiz'));
    quizEls.forEach(function(el) { _buildQuiz(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initDeclarative);
  } else {
    _initDeclarative();
  }
})(window);

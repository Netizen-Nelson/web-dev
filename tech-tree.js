(function (G) {
  'use strict';

  function deepMerge(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src || typeof src !== 'object') continue;
      Object.keys(src).forEach(function(k) {
        if (src[k] !== null && !Array.isArray(src[k]) && typeof src[k] === 'object') {
          if (typeof target[k] !== 'object' || target[k] === null) target[k] = {};
          deepMerge(target[k], src[k]);
        } else if (src[k] !== undefined) {
          target[k] = src[k];
        }
      });
    }
    return target;
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function(k){ el.setAttribute(k, String(attrs[k])); });
    return el;
  }

  function scaleRem(val, factor) {
    var m = String(val).match(/^([\d.]+)(rem|em|px)$/);
    if (!m || factor === 1) return val;
    return (parseFloat(m[1]) * factor).toFixed(3) + m[2];
  }

  // ── Defaults ─────────────────────────────────────────────────────────
  var _D = {
    nodeSize: 64, nodeGap: 52, padding: 44,
    dotRadius: 4, dotCount: 3, lineWidth: 1.5, cornerRadius: 8,
    scale: 1,
    hoverScale:      1.08,
    tooltipMaxWidth: '260px',
    typography: {
      nodeLabel:    '0.74rem',
      nodeBadge:    '0.62rem',
      tooltipTitle: '0.92rem',
      tooltipDesc:  '0.80rem',
      tooltipMeta:  '0.70rem',
      headerTitle:  '0.94rem',
      headerSub:    '0.72rem',
      footer:       '0.64rem',
    },
    showLabels: true, showTooltip: true, showScrews: true,
    title: null, subtitle: null, footer: null,
    themeName: 'default',
    theme: { screwColor:'#3a3b38', labelColor:'#7a7b78', lineColor:'#3a3b38',
             wrapperBg:'#1a1b1a', wrapperBorder:'1px solid #2e2f2e' },
    states: {
      unlocked:  { bg:'linear-gradient(145deg,#2a2a14,#1a1a0c)', border:'#E5E5A6', icon:'#E5E5A6', dot:'#E5E5A6', shadow:'rgba(229,229,166,.35)', indicator:'#E5E5A6' },
      available: { bg:'linear-gradient(145deg,#0e1e2a,#081420)', border:'#90CDF4', icon:'#90CDF4', dot:'#90CDF4', shadow:'rgba(144,205,244,.40)', indicator:'#90CDF4', pulse:'rgba(144,205,244,.65)' },
      locked:    { bg:'linear-gradient(145deg,#1c1d1c,#141514)', border:'#4a4b48', icon:'#7a7b78', dot:'#3a3b38', shadow:'rgba(0,0,0,.4)',          indicator:'#3a3b38' },
      empty:     { bg:'linear-gradient(145deg,#181918,#101110)', border:'#222322', icon:'#3a3b38', dot:'#222322', shadow:'rgba(0,0,0,.3)',          indicator:'#1a1b18' },
      disabled:  { bg:'#0e0f0e',                                 border:'#181918', icon:'#303130', dot:'#181918', shadow:'none',                   indicator:'#141514' },
    },
    onNodeClick: null, onNodeHover: null,
  };

  // ── Built-in themes ───────────────────────────────────────────────────
  var _THEMES = {
    default: {
      theme: { lineColor:'#3a3b38', labelColor:'#7a7b78', screwColor:'#3a3b38', wrapperBg:'#1a1b1a', wrapperBorder:'1px solid #2e2f2e' },
      states: {
        unlocked:  { bg:'linear-gradient(145deg,#2a2a14,#1a1a0c)', border:'#E5E5A6', icon:'#E5E5A6', dot:'#E5E5A6', shadow:'rgba(229,229,166,.35)', indicator:'#E5E5A6' },
        available: { bg:'linear-gradient(145deg,#0e1e2a,#081420)', border:'#90CDF4', icon:'#90CDF4', dot:'#90CDF4', shadow:'rgba(144,205,244,.40)', indicator:'#90CDF4', pulse:'rgba(144,205,244,.65)' },
      },
    },
    ocean: {
      theme: { lineColor:'#1a3030', labelColor:'#5a8888', screwColor:'#1a3030', wrapperBg:'#0e1a1a', wrapperBorder:'1px solid #1a3030' },
      states: {
        unlocked:  { bg:'linear-gradient(145deg,#0a2828,#061818)', border:'#81E6D9', icon:'#81E6D9', dot:'#81E6D9', shadow:'rgba(129,230,217,.35)', indicator:'#81E6D9' },
        available: { bg:'linear-gradient(145deg,#061e1e,#041414)', border:'#04b5a3', icon:'#04b5a3', dot:'#04b5a3', shadow:'rgba(4,181,163,.45)',   indicator:'#04b5a3', pulse:'rgba(4,181,163,.6)' },
      },
    },
    ember: {
      theme: { lineColor:'#3a2818', labelColor:'#9a7848', screwColor:'#3a2818', wrapperBg:'#1a1208', wrapperBorder:'1px solid #3a2818' },
      states: {
        unlocked:  { bg:'linear-gradient(145deg,#2a1a08,#1a1004)', border:'#d9b375', icon:'#d9b375', dot:'#d9b375', shadow:'rgba(217,179,117,.35)', indicator:'#d9b375' },
        available: { bg:'linear-gradient(145deg,#2a1408,#1a0c04)', border:'#f69653', icon:'#f69653', dot:'#f69653', shadow:'rgba(246,150,83,.45)',  indicator:'#f69653', pulse:'rgba(246,150,83,.6)' },
      },
    },
    violet: {
      theme: { lineColor:'#2a1e38', labelColor:'#7a6098', screwColor:'#2a1e38', wrapperBg:'#130f1c', wrapperBorder:'1px solid #2a1e38' },
      states: {
        unlocked:  { bg:'linear-gradient(145deg,#1e1430,#14102a)', border:'#FFB3D9', icon:'#FFB3D9', dot:'#FFB3D9', shadow:'rgba(255,179,217,.30)', indicator:'#FFB3D9' },
        available: { bg:'linear-gradient(145deg,#1a1230,#100e28)', border:'#C3A5E5', icon:'#C3A5E5', dot:'#C3A5E5', shadow:'rgba(195,165,229,.40)', indicator:'#C3A5E5', pulse:'rgba(195,165,229,.6)' },
      },
    },
    nature: {
      theme: { lineColor:'#1e3020', labelColor:'#5e8060', screwColor:'#1e3020', wrapperBg:'#0e180e', wrapperBorder:'1px solid #1e3020' },
      states: {
        unlocked:  { bg:'linear-gradient(145deg,#1a2e10,#101e08)', border:'#C8DD5A', icon:'#C8DD5A', dot:'#C8DD5A', shadow:'rgba(200,221,90,.35)',  indicator:'#C8DD5A' },
        available: { bg:'linear-gradient(145deg,#0a2018,#061410)', border:'#81E6D9', icon:'#81E6D9', dot:'#81E6D9', shadow:'rgba(129,230,217,.40)', indicator:'#81E6D9', pulse:'rgba(129,230,217,.6)' },
      },
    },
    blood: {
      theme: { lineColor:'#3a1818', labelColor:'#9a5858', screwColor:'#3a1818', wrapperBg:'#180a0a', wrapperBorder:'1px solid #3a1818' },
      states: {
        unlocked:  { bg:'linear-gradient(145deg,#2a1414,#1a0c0c)', border:'#E5C3B3', icon:'#E5C3B3', dot:'#E5C3B3', shadow:'rgba(229,195,179,.30)', indicator:'#E5C3B3' },
        available: { bg:'linear-gradient(145deg,#2a0e0e,#1a0808)', border:'#F08080', icon:'#F08080', dot:'#F08080', shadow:'rgba(240,128,128,.45)',  indicator:'#F08080', pulse:'rgba(240,128,128,.6)' },
      },
    },
  };

  // ╔═══════════════════════════════════════════════════════╗
  // ║  TechTree                                             ║
  // ╚═══════════════════════════════════════════════════════╝
  function TechTree(selector, options) {
    options = options || {};
    this.mountEl = typeof selector === 'string'
      ? document.querySelector(selector) : selector;
    if (!this.mountEl) throw new Error('TechTree: "' + selector + '" not found');

    var attrCfg = {};
    try { var r = this.mountEl.getAttribute('data-tt-config'); if (r) attrCfg = JSON.parse(r); } catch(_) {}

    var name      = options.themeName || attrCfg.themeName || (G.TechTreeConfig && G.TechTreeConfig.themeName) || 'default';
    var themeData = TechTree.themes[name] || TechTree.themes['default'];

    this.cfg = deepMerge({}, _D, themeData, G.TechTreeConfig || {}, attrCfg, options);
    this.cfg.themeName = name;
    this._nodes   = (options.nodes || []).map(function(n){ return Object.assign({},n); });
    this._edges   = (options.edges || []).map(function(e){ return Object.assign({},e); });
    this._nodeMap = {};
    this._nodes.forEach(function(n){ this._nodeMap[n.id]=n; }, this);
    TechTree._injectCSS();
    this._initTooltip();
    this.render();
  }

  TechTree.themes = _THEMES;
  TechTree.registerTheme = function(name, cfg) { TechTree.themes[name] = cfg; };

  // ── API ────────────────────────────────────────────────────────────
  TechTree.prototype.render        = function()         { this.mountEl.innerHTML=''; this._buildDOM(); };
  TechTree.prototype.setTheme      = function(name)     { var t=TechTree.themes[name]; if(!t){console.warn('TechTree: unknown theme "'+name+'"'); return;} deepMerge(this.cfg, t); this.cfg.themeName=name; this.render(); };
  TechTree.prototype.setScale      = function(s)        { this.cfg.scale=s; this.render(); };
  TechTree.prototype.setTypography = function(t)        { deepMerge(this.cfg.typography, t); this.render(); };
  TechTree.prototype.setNodeState  = function(id,st)    { var n=this._nodeMap[id]; if(n){n.state=st; this.render();} };
  TechTree.prototype.updateNode    = function(id,props) { var n=this._nodeMap[id]; if(n){Object.assign(n,props); this.render();} };
  TechTree.prototype.setEdgeState  = function(f,t,st)   { var e=this._edges.find(function(e){return e.from===f&&e.to===t;}); if(e){e.state=st; this.render();} };
  TechTree.prototype.batchUpdate   = function(fn)       { fn(this._nodeMap, this._edges); this.render(); };
  TechTree.prototype.getNode       = function(id)       { var n=this._nodeMap[id]; return n?Object.assign({},n):null; };
  TechTree.prototype.getNodesByState = function(st)     { return this._nodes.filter(function(n){return n.state===st;}).map(function(n){return Object.assign({},n);}); };
  TechTree.prototype.destroy       = function()         { this.mountEl.innerHTML=''; };

  /**
   * Export current tree state as a plain object (JSON-serialisable).
   * Shape:
   *   {
   *     version:    1,
   *     exportedAt: "2026-03-14T10:00:00.000Z",
   *     themeName:  "ocean",
   *     nodes: [ { id, state } ],
   *     edges: [ { from, to, state, dotsFilled } ]
   *   }
   * Usage:
   *   var json = JSON.stringify(tree.exportState());
   */
  TechTree.prototype.exportState = function() {
    return {
      version:    1,
      exportedAt: new Date().toISOString(),
      themeName:  this.cfg.themeName,
      nodes: this._nodes.map(function(n) {
        return { id: n.id, state: n.state || 'locked' };
      }),
      edges: this._edges.map(function(e) {
        return { from: e.from, to: e.to, state: e.state || 'locked',
                 dotsFilled: e.dotsFilled !== undefined ? e.dotsFilled : null };
      }),
    };
  };

  /**
   * Restore a previously exported state. Re-renders after import.
   * @param {Object} state  — output of exportState() or parsed PHP response
   */
  TechTree.prototype.importState = function(state) {
    if (!state) return;
    var self = this;
    if (Array.isArray(state.nodes)) {
      state.nodes.forEach(function(saved) {
        var n = self._nodeMap[saved.id];
        if (n) n.state = saved.state;
      });
    }
    if (Array.isArray(state.edges)) {
      state.edges.forEach(function(saved) {
        var e = self._edges.find(function(e){ return e.from===saved.from && e.to===saved.to; });
        if (!e) return;
        e.state = saved.state;
        if (saved.dotsFilled !== null && saved.dotsFilled !== undefined)
          e.dotsFilled = saved.dotsFilled;
      });
    }
    if (state.themeName) this.setTheme(state.themeName);
    else this.render();
  };

  // ── Helpers ────────────────────────────────────────────────────────
  TechTree.prototype._sc = function(v) { return v * (this.cfg.scale||1); };
  TechTree.prototype._fs = function(key) {
    var v = this.cfg.typography && this.cfg.typography[key] || _D.typography[key];
    return scaleRem(v, this.cfg.scale||1);
  };

  // ── Build DOM ──────────────────────────────────────────────────────
  TechTree.prototype._buildDOM = function() {
    var sc    = this._sc.bind(this);
    var pad   = sc(this.cfg.padding);
    var nSz   = sc(this.cfg.nodeSize);
    var nGap  = sc(this.cfg.nodeGap);
    var lblH  = this.cfg.showLabels ? sc(26) : 0;
    var maxC=0, maxR=0;
    this._nodes.forEach(function(n){ maxC=Math.max(maxC,n.col||0); maxR=Math.max(maxR,n.row||0); });
    var W = pad*2 + (maxC+1)*nSz + maxC*nGap;
    var H = pad*2 + (maxR+1)*nSz + maxR*nGap + lblH;

    var wrap = document.createElement('article');
    wrap.className='tt-wrap';
    wrap.setAttribute('role','region');
    wrap.setAttribute('aria-label', this.cfg.title||'科技樹');
    wrap.style.background = this.cfg.theme.wrapperBg||'#1a1b1a';
    wrap.style.border     = this.cfg.theme.wrapperBorder||'1px solid #2e2f2e';

    if (this.cfg.title || this.cfg.subtitle) {
      var hdr=document.createElement('header'); hdr.className='tt-hdr';
      if (this.cfg.title) {
        var h=document.createElement('h3'); h.className='tt-hdr-title';
        h.style.fontSize=this._fs('headerTitle'); h.textContent=this.cfg.title; hdr.appendChild(h);
      }
      if (this.cfg.subtitle) {
        var p=document.createElement('p'); p.className='tt-hdr-sub';
        p.style.fontSize=this._fs('headerSub'); p.textContent=this.cfg.subtitle; hdr.appendChild(p);
      }
      wrap.appendChild(hdr);
    }

    var board=document.createElement('div'); board.className='tt-board';
    board.style.width=W+'px'; board.style.height=H+'px';

    if (this.cfg.showScrews) {
      var screwC=this.cfg.theme.screwColor||'#3a3b38';
      [['a',8,8],['b',8,W-18],['c',H-18,8],['d',H-18,W-18]].forEach(function(p){
        var s=document.createElement('div'); s.className='tt-screw'; s.setAttribute('aria-hidden','true');
        s.style.cssText='top:'+p[1]+'px;left:'+p[2]+'px;';
        s.innerHTML='<svg width="10" height="10" aria-hidden="true">'
          +'<circle cx="5" cy="5" r="4.5" fill="url(#ttsg'+p[0]+')" stroke="'+screwC+'" stroke-width="0.8"/>'
          +'<line x1="2.5" y1="5" x2="7.5" y2="5" stroke="'+screwC+'" stroke-width="1"/>'
          +'<line x1="5" y1="2.5" x2="5" y2="7.5" stroke="'+screwC+'" stroke-width="1"/>'
          +'<defs><radialGradient id="ttsg'+p[0]+'" cx="35%" cy="35%">'
          +'<stop offset="0%" stop-color="#3a3b38"/><stop offset="100%" stop-color="#1a1b18"/>'
          +'</radialGradient></defs></svg>';
        board.appendChild(s);
      });
    }

    var svg=svgEl('svg',{width:W,height:H,class:'tt-svg','aria-hidden':'true'});
    var self=this;
    this._edges.forEach(function(e){ self._drawEdge(svg,e); });
    board.appendChild(svg);
    this._nodes.forEach(function(n){ board.appendChild(self._makeNode(n)); });
    wrap.appendChild(board);

    if (this.cfg.footer) {
      var ft=document.createElement('footer'); ft.className='tt-footer';
      ft.style.fontSize=this._fs('footer'); ft.textContent=this.cfg.footer; wrap.appendChild(ft);
    }
    this.mountEl.appendChild(wrap);
  };

  TechTree.prototype._pos = function(n) {
    var pad=this._sc(this.cfg.padding), nSz=this._sc(this.cfg.nodeSize), nGap=this._sc(this.cfg.nodeGap);
    var col=n.col||0, row=n.row||0;
    var cx=pad+col*(nSz+nGap)+nSz/2, cy=pad+row*(nSz+nGap)+nSz/2;
    var sz=nSz*(n.size||1);
    return {x:cx-sz/2,y:cy-sz/2,cx:cx,cy:cy,sz:sz};
  };

  TechTree.prototype._drawEdge = function(svg, edge) {
    var fn=this._nodeMap[edge.from], tn=this._nodeMap[edge.to];
    if (!fn||!tn) return;
    var fp=this._pos(fn), tp=this._pos(tn);
    var state=edge.state||'locked';
    var sc=this.cfg.states[state]||this.cfg.states.locked;
    var lineColor=this.cfg.theme.lineColor||'#3a3b38';
    var g=svgEl('g',{class:'tt-edge tt-edge--'+state,'data-from':edge.from,'data-to':edge.to});
    g.appendChild(svgEl('line',{x1:fp.cx,y1:fp.cy,x2:tp.cx,y2:tp.cy,
      stroke:lineColor,'stroke-width':this._sc(this.cfg.lineWidth),'stroke-linecap':'round'}));
    var tot=edge.dotCount||this.cfg.dotCount;
    var filled=edge.dotsFilled!==undefined?edge.dotsFilled:
      state==='unlocked'?tot:state==='available'?Math.ceil(tot/2):0;
    for (var i=1;i<=tot;i++) {
      var t=i/(tot+1);
      g.appendChild(svgEl('circle',{
        cx:fp.cx+(tp.cx-fp.cx)*t, cy:fp.cy+(tp.cy-fp.cy)*t,
        r:this._sc(this.cfg.dotRadius),
        fill:i<=filled?sc.dot:'#232423',
        class:'tt-dot'+(i<=filled?' tt-dot--on':''),
      }));
    }
    if (edge.label) {
      var tx=svgEl('text',{x:(fp.cx+tp.cx)/2,y:(fp.cy+tp.cy)/2-7,
        'text-anchor':'middle',fill:'#3a3b38','font-size':'9','font-family':'monospace'});
      tx.textContent=edge.label; g.appendChild(tx);
    }
    svg.appendChild(g);
  };

  TechTree.prototype._makeNode = function(node) {
    var pos=this._pos(node), state=node.state||'locked';
    var sc=this.cfg.states[state]||this.cfg.states.locked;
    var sz=pos.sz, cr=this._sc(this.cfg.cornerRadius)*(node.size||1);

    var wrap=document.createElement('div');
    wrap.className='tt-node-wrap';
    wrap.style.cssText='position:absolute;left:'+pos.x+'px;top:'+pos.y+'px;';

    var el=document.createElement('div');
    el.className='tt-node tt-node--'+state;
    el.setAttribute('data-id',node.id);
    el.setAttribute('data-state',state);
    el.setAttribute('role',state==='disabled'?'img':'button');
    el.setAttribute('tabindex',(state==='disabled'||state==='locked')?'-1':'0');
    el.setAttribute('aria-label',[node.label,node.tooltip].filter(Boolean).join('：')||node.id);
    if (state==='locked'||state==='disabled') el.setAttribute('aria-disabled','true');
    el.style.cssText='width:'+sz+'px;height:'+sz+'px;border-radius:'+cr+'px;'
      +'background:'+sc.bg+';border:2px solid '+sc.border+';'
      +'box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 16px '+sc.shadow+';'
      +'display:flex;align-items:center;justify-content:center;position:relative;'
      +'cursor:'+(state==='available'?'pointer':state==='unlocked'?'default':'not-allowed')+';'
      +'transition:filter .15s,transform .15s;user-select:none;';

    if (node.icon) {
      var ic=document.createElement('i'); ic.className='bi '+node.icon;
      ic.style.cssText='font-size:'+Math.round(sz*.42)+'px;color:'+sc.icon+';pointer-events:none;';
      el.appendChild(ic);
    } else {
      var fb=document.createElement('span');
      fb.style.cssText='font-size:'+Math.round(sz*.34)+'px;color:'+sc.icon
        +';pointer-events:none;font-family:\'Exo 2\',monospace;font-weight:700;';
      fb.textContent=(node.label||node.id).slice(0,1); el.appendChild(fb);
    }

    var ind=document.createElement('span'); ind.className='tt-indicator'; ind.setAttribute('aria-hidden','true');
    ind.style.cssText='position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;'
      +'background:'+sc.indicator+';box-shadow:0 0 6px '+sc.indicator+'90;';
    el.appendChild(ind);

    if (node.level!==undefined) {
      var lv=document.createElement('span'); lv.className='tt-lvbadge';
      lv.textContent=node.level; lv.setAttribute('aria-label','等級 '+node.level);
      lv.style.cssText='position:absolute;top:-8px;left:-8px;background:'+sc.border+';color:#0c0d0c;'
        +'font-size:'+this._fs('nodeBadge')+';font-weight:800;min-width:16px;height:16px;padding:0 3px;'
        +'border-radius:8px;display:flex;align-items:center;justify-content:center;'
        +'border:1.5px solid #0c0d0c;font-family:\'Exo 2\',monospace;';
      el.appendChild(lv);
    }

    if (node.badge) {
      var bg2=document.createElement('span'); bg2.className='tt-custbadge'; bg2.textContent=node.badge;
      bg2.setAttribute('aria-hidden','true');
      bg2.style.cssText='position:absolute;bottom:-9px;right:-9px;background:#C8DD5A;color:#0c0d0c;'
        +'font-size:'+this._fs('nodeBadge')+';font-weight:800;padding:1px 4px;border-radius:3px;'
        +'text-transform:uppercase;letter-spacing:.04em;font-family:\'Exo 2\',monospace;';
      el.appendChild(bg2);
    }

    wrap.appendChild(el);

    if (this.cfg.showLabels && node.label) {
      var lbl=document.createElement('div'); lbl.className='tt-label'; lbl.textContent=node.label;
      lbl.setAttribute('aria-hidden','true');
      var lblCol=(state==='unlocked'||state==='available')?sc.icon:(this.cfg.theme.labelColor||'#6a6b68');
      lbl.style.cssText='position:absolute;top:'+(sz+5)+'px;left:50%;transform:translateX(-50%);'
        +'font-size:'+this._fs('nodeLabel')+';color:'+lblCol+';'
        +'white-space:nowrap;pointer-events:none;text-align:center;'
        +'max-width:'+(sz+36)+'px;overflow:hidden;text-overflow:ellipsis;'
        +'font-family:\'Share Tech Mono\',monospace;';
      wrap.appendChild(lbl);
    }

    this._bindNodeEvents(el, node);
    return wrap;
  };

  TechTree.prototype._bindNodeEvents = function(el, node) {
    var state=node.state||'locked', self=this;
    if (state==='disabled') return;
    el.addEventListener('mouseenter',function(e){
      if (state==='available'){ el.style.filter='brightness(1.35)'; el.style.transform='scale('+self.cfg.hoverScale+')'; el.style.zIndex='10'; }
      else if (state==='unlocked'){ el.style.filter='brightness(1.12)'; el.style.zIndex='5'; }
      if (self.cfg.showTooltip) self._showTT(node,e);
      if (self.cfg.onNodeHover) self.cfg.onNodeHover(node,e,self);
    });
    el.addEventListener('mousemove',function(e){ self._moveTT(e); });
    el.addEventListener('mouseleave',function(){ el.style.filter=''; el.style.transform=''; el.style.zIndex=''; self._hideTT(); });
    if (state!=='locked') {
      var handler=function(e){ if (self.cfg.onNodeClick) self.cfg.onNodeClick(node,e,self); };
      el.addEventListener('click',handler);
      el.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();handler(e);} });
    }
  };

  TechTree.prototype._initTooltip = function() {
    var t=document.getElementById('tt-global-tooltip');
    if (!t) {
      t=document.createElement('div'); t.id='tt-global-tooltip'; t.setAttribute('role','tooltip');
      t.style.cssText='position:fixed;display:none;z-index:9999;background:#111211;'
        +'border:1px solid #2a2b28;color:#c6c7bd;padding:10px 14px;border-radius:8px;'
        +'max-width:'+(this.cfg.tooltipMaxWidth||'260px')+';pointer-events:none;box-shadow:0 8px 32px rgba(0,0,0,.75);'
        +'line-height:1.5;font-family:\'Exo 2\',\'Segoe UI\',sans-serif;';
      document.body.appendChild(t);
    }
    this._tt=t;
  };

  TechTree.prototype._showTT = function(node,e) {
    if (!this._tt) return;
    var LABELS={unlocked:'已解鎖',available:'可解鎖',locked:'鎖定',empty:'空節點',disabled:'停用'};
    var st=node.state||'locked', sc=this.cfg.states[st]||this.cfg.states.locked, col=sc.indicator||'#3a3b38';
    var h='';
    if (node.label) h+='<strong style="color:#c6c7bd;font-size:'+this._fs('tooltipTitle')+'">'+node.label+'</strong>';
    if (node.level!==undefined) h+=' <span style="color:'+col+';font-size:'+this._fs('tooltipMeta')+';font-family:\'Share Tech Mono\',monospace">Lv.'+node.level+'</span>';
    if (node.tooltip) h+='<br><span style="color:#9a9b98;font-size:'+this._fs('tooltipDesc')+';margin-top:3px;display:block">'+node.tooltip+'</span>';
    if (node.cost!==undefined) h+='<br><span style="color:#C8DD5A;font-size:'+this._fs('tooltipMeta')+'">⬡ 消耗：'+node.cost+' 點</span>';
    if (node.requires) h+='<br><span style="color:#F08080;font-size:'+this._fs('tooltipMeta')+'">▸ 需要：'+node.requires+'</span>';
    h+='<br><span style="display:inline-flex;align-items:center;gap:5px;margin-top:4px">'
      +'<span style="width:6px;height:6px;border-radius:50%;background:'+col+';box-shadow:0 0 5px '+col+'88;display:inline-block"></span>'
      +'<span style="font-size:'+this._fs('tooltipMeta')+';color:#6a6b68;font-family:\'Share Tech Mono\',monospace;text-transform:uppercase">'+(LABELS[st]||st)+'</span></span>';
    this._tt.innerHTML=h; this._tt.style.display='block'; this._moveTT(e);
  };

  TechTree.prototype._moveTT = function(e) {
    if (!this._tt||this._tt.style.display==='none') return;
    var x=e.clientX+16,y=e.clientY-8,tw=this._tt.offsetWidth,vw=window.innerWidth;
    this._tt.style.left=(x+tw>vw-10?x-tw-32:x)+'px'; this._tt.style.top=Math.max(8,y)+'px';
  };

  TechTree.prototype._hideTT = function() { if(this._tt)this._tt.style.display='none'; };

  TechTree._injectCSS = function() {
    if (document.getElementById('tt-core-css')) return;
    var s=document.createElement('style'); s.id='tt-core-css';
    s.textContent='.tt-wrap{display:inline-block;border-radius:16px;padding:14px;'
      +'box-shadow:0 12px 48px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.03),inset 0 -1px 0 rgba(0,0,0,.4);}'
      +'.tt-hdr{padding:2px 4px 10px;border-bottom:1px solid #1e1f1e;margin-bottom:12px;}'
      +'.tt-hdr-title{color:#c6c7bd;font-weight:700;font-family:\'Exo 2\',sans-serif;margin:0;}'
      +'.tt-hdr-sub{color:#5a5b58;margin:3px 0 0;font-family:\'Share Tech Mono\',monospace;}'
      +'.tt-board{position:relative;border-radius:10px;overflow:visible;'
      +'background:radial-gradient(ellipse at 50% 30%,#1c1d1c 0%,#131413 100%);'
      +'box-shadow:inset 0 0 70px rgba(0,0,0,.5);}'
      +'.tt-svg{position:absolute;top:0;left:0;pointer-events:none;overflow:visible;}'
      +'.tt-screw{position:absolute;width:10px;height:10px;z-index:2;}'
      +'.tt-node-wrap{position:absolute;z-index:1;}'
      +'.tt-node{position:relative;}'
      +'.tt-node--available{animation:tt-pulse 2.2s ease-in-out infinite;}'
      +'@keyframes tt-pulse{0%,100%{filter:none}50%{filter:brightness(1.18)}}'
      +'.tt-node--unlocked{animation:tt-glow 3.5s ease-in-out infinite;}'
      +'@keyframes tt-glow{0%,100%{filter:none}50%{filter:brightness(1.08)}}'
      +'.tt-node:not([aria-disabled]):focus-visible{outline:2px solid #90CDF4;outline-offset:3px;border-radius:10px;}'
      +'.tt-footer{padding:7px 4px 2px;color:#4a4b48;'
      +'font-family:\'Share Tech Mono\',monospace;border-top:1px solid #1a1b1a;margin-top:10px;}';
    document.head.appendChild(s);
  };

  G.TechTree = TechTree;
})(window);

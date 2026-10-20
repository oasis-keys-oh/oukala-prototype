/* Bundle runtime (CL-15, CL-37, CL-39). Not a feature module: src/build.py inlines it ahead of platform.js in every build.
   window.BUNDLE
     split           true in the split build (index.html with assets/), false in full.html
     ready           true once every bundle has run; the window event "app:ready" fires once at that moment
     get(name)       on-demand data already loaded (or embedded in full.html), else undefined
     data(name)      Promise of on-demand data; the split build fetches assets/data/<name>.<hash>.json once
     need(name)      true when loaded; else fetches it and re-renders the current screen when it arrives
     lazy(name,{screens,use})  register a consumer: use(data) runs when the data arrives (at once when embedded);
                     opening one of the screens fetches the data and re-renders that screen when it lands
   The build calls the underscore functions in this order: _core() after the core files, _mod(i) before module i of
   src/modules.json, _shell() after the modules, then screens3.js (the boot), then _done() at the end of the last bundle; with
   two bundles (docs/bundle.md), _first() ends the first one and the second one ends with _done(). */
(function(){
"use strict";
var B=window.BUNDLE=window.BUNDLE||{};
var CFG=window.__BUNDLE_CFG||{};try{delete window.__BUNDLE_CFG}catch(e){window.__BUNDLE_CFG=undefined}
B.split=!!CFG.split;B.ready=false;B.m=-1;
var files=CFG.files||{},embedded=CFG.embedded||{},REST=CFG.rest||null,TWO=B.split&&!!REST;  // TWO: a second bundle loads after first paint
var lazy={},loaded={},pending={},needed={},waiting=null,touched=false,fired=false,restAsked=false,restFailed=false;
var regs=[],AFTER=1e9;

function view(){return document.getElementById("view")}
function cur(){try{return S.screen}catch(e){return null}}
function rerender(){try{render()}catch(e){console.error("bundle: render",e)}}
function hasScreen(id){try{return typeof _R[id]==="function"}catch(e){return false}}

/* ---------- on-demand data (CL-39) ---------- */
function deliver(n){var L=lazy[n]||{screens:[],use:[]};L.use.forEach(function(f){try{f(loaded[n])}catch(e){console.error("bundle: data "+n,e)}});
 if(B.ready&&(needed[n]||L.screens.indexOf(cur())>=0))rerender()}
B.get=function(n){if(!(n in loaded)&&n in embedded){loaded[n]=embedded[n];delete embedded[n]}return loaded[n]};
B.data=function(n){if(B.get(n)!==undefined)return Promise.resolve(loaded[n]);
 if(!files[n])return Promise.reject(new Error("bundle: no data named "+n));
 return pending[n]||(pending[n]=fetch(files[n]).then(function(r){if(!r.ok)throw new Error("bundle: "+files[n]+" "+r.status);return r.json()})
  .then(function(d){loaded[n]=d;delete pending[n];deliver(n);return d},function(e){delete pending[n];console.error(e);throw e}))};
B.lazy=function(n,o){o=o||{};var L=lazy[n]=lazy[n]||{screens:[],use:[]};(o.screens||[]).forEach(function(s){if(L.screens.indexOf(s)<0)L.screens.push(s)});
 if(o.use)L.use.push(o.use);
 if(B.get(n)!==undefined){if(o.use)try{o.use(loaded[n])}catch(e){console.error("bundle: data "+n,e)}}
 else if(L.screens.indexOf(cur())>=0)B.data(n).catch(function(){})};
/* need(name): true when the data is here; otherwise starts the fetch and re-renders the current screen when it lands */
B.need=function(n){if(B.get(n)!==undefined)return true;if(!needed[n]){needed[n]=1;B.data(n).catch(function(){})}return false};
function fetchFor(s){for(var n in lazy)if(lazy[n].screens.indexOf(s)>=0&&B.get(n)===undefined)B.data(n).catch(function(){})}

/* ---------- registries keep the single-bundle order (CL-15) ----------
   In the split build, modules of the second bundle run after the first-paint bundle. Their push and unshift calls on these
   registries are logged with the module's place in src/modules.json; at app:ready each registry is rebuilt by replaying the
   calls in module order, so it matches full.html (nav order, search order, first matching answer). A registry that changed
   any other way is left as loaded, with a console warning. */
var REGS={SCREENS:function(){return SCREENS},SEARCHX:function(){return SEARCHX},ASKX:function(){return ASKX}};
function tagRegistries(){Object.keys(REGS).forEach(function(k){var a;try{a=REGS[k]()}catch(e){return}if(!Array.isArray(a))return;
 var R={k:k,a:a,base:a.slice(),ops:[]};
 ["push","unshift"].forEach(function(op){var f=Array.prototype[op];Object.defineProperty(a,op,{configurable:true,writable:true,enumerable:false,value:function(){
  R.ops.push({m:B.m,s:R.ops.length,op:op,items:Array.prototype.slice.call(arguments)});return f.apply(this,arguments)}})});
 regs.push(R)})}
function replay(base,ops){var x=base.slice();ops.forEach(function(o){Array.prototype[o.op].apply(x,o.items)});return x}
function sortRegistries(){regs.forEach(function(R){var a=R.a;delete a.push;delete a.unshift;
 var now=replay(R.base,R.ops);if(now.length!==a.length||now.some(function(x,i){return x!==a[i]})){console.warn("bundle: "+R.k+" changed outside push and unshift; kept in load order");return}
 var full=replay(R.base,R.ops.slice().sort(function(x,y){return(x.m-y.m)||(x.s-y.s)}));a.length=0;Array.prototype.push.apply(a,full)});regs=[]}

/* ---------- a screen that is not loaded yet waits for it (CL-15) ---------- */
var WAIT_HTML='<div class="screen"><section class="card glass" role="status" aria-live="polite" data-bundle-wait><h3>Opening this screen</h3><p class="muted">The rest of the workspace is still loading. This screen opens by itself in a moment.</p></section></div>';
var FAIL_HTML='<div class="screen"><section class="card glass" role="alert" data-bundle-wait><h3>This screen did not load</h3><p class="muted">The second part of the workspace could not be fetched. Reload the page to try again.</p></section></div>';
function guardRender(s){if(B.ready||hasScreen(s))return;var v=view();if(!v)return;waiting=s;v.innerHTML=restFailed?FAIL_HTML:WAIT_HTML}

B._mod=function(i){B.m=i};
B._core=function(){
 if(window.HOOKS&&HOOKS.on){
  HOOKS.on("beforeGo",function(s){fetchFor(s)},{id:"bundle.data",order:-1000});
  HOOKS.on("afterRender",function(s){fetchFor(s);if(TWO)guardRender(s)},{id:"bundle.wait",order:100000})}
 if(TWO)tagRegistries()};

/* ---------- CL-37: one app:ready event replaces the old 30 second renderNav delay (mod_zz_perf) ----------
   Until app:ready the first renderNav runs and later calls are folded into one call at app:ready. */
var navPend=false;
B._shell=function(){B.m=AFTER;var rn=window.renderNav;if(typeof rn!=="function")return;var first=true;
 window.renderNav=function(){if(B.ready||first){first=false;return rn.apply(this,arguments)}navPend=true};
 if(TWO){var h0="";try{h0=decodeURIComponent((location.hash||"").slice(1).replace(/^\//,"").split("?")[0])}catch(e){}
  if(h0&&window.HOOKS){var off=HOOKS.on("beforeRender",function(){off();var h=window.NAVX&&NAVX.resolveAlias?(NAVX.resolveAlias(h0)||h0):h0;
   if(!hasScreen(h)&&/^[\w-]+$/.test(h)){try{S.screen=h}catch(e){}}},{id:"bundle.deeplink",order:-100000})}}};

B._first=function(){if(!B.split||!REST)return;
 ["pointerdown","keydown"].forEach(function(t){document.addEventListener(t,function(){touched=true},{capture:true,once:true})});
 var load=function(){if(restAsked)return;restAsked=true;var s=document.createElement("script");s.src=REST;
  s.onerror=function(){restFailed=true;console.error("bundle: could not load "+REST);if(waiting&&cur()===waiting){var v=view();if(v)v.innerHTML=FAIL_HTML}};
  document.body.appendChild(s)};
 requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(load,0)})});setTimeout(load,1500)};

B._done=function(){if(fired)return;fired=true;B.m=AFTER;
 if(TWO)sortRegistries();
 B.ready=true;
 if(TWO){var s=cur();
  if(waiting&&s===waiting){waiting=null;if(!hasScreen(s)){try{S.screen="home"}catch(e){}}rerender()}
  else if(!touched){rerender()}
  else{navPend=false;try{window.renderNav()}catch(e){console.error("renderNav",e)}}}
 if(navPend){navPend=false;try{window.renderNav()}catch(e){console.error("renderNav",e)}}
 try{window.dispatchEvent(new CustomEvent("app:ready",{detail:{split:B.split}}))}catch(e){console.error("bundle: app:ready",e)}};
})();

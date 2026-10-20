/* ===== mod_s_router: one delegated event router (backlog CL-36). Global: window.ROUTER. No screen, no CSS.
   One document listener per event type replaces a document listener per module. A route is keyed by a selector, usually a
   data attribute; a module-wide dispatcher (one handler that tests many attributes itself) registers without one.
     ROUTER.on(type, selector, fn, {id})   fn(e, el) when e.target.closest(selector) matches; el is that element
     ROUTER.on(type, fn, {id})             fn(e, e.target) for every event of that type (a module dispatcher)
     ROUTER.list(type?)                    the routes in order: [{type, sel, id}]
     ROUTER.types()                        the event types that have a document listener
   Every on() returns an off function; the same id replaces an earlier route of that type.
   Behavior is the one the separate listeners had: routes run in registration order, `this` is document,
   e.stopImmediatePropagation() also stops the routes after it, and a route that throws is reported without stopping the others.
   Listed first in modules.json, so its listeners sit after the core files' listeners and before every module's own, the place
   the modules' listeners had. Bubble phase only: a capture or passive listener stays a plain addEventListener. ===== */
(function(){"use strict";
const W=window,D=document;if(W.ROUTER)return;
const RT={};const TYPES=[];
const report=x=>{try{if(W.reportError)W.reportError(x);else setTimeout(()=>{throw x},0)}catch(y){console.error(x)}};
function dispatch(ev){const L=RT[ev.type];if(!L||!L.length)return;const t=ev.target;
 let stop=false;const own=Object.prototype.hasOwnProperty.call(ev,"stopImmediatePropagation");const sip=ev.stopImmediatePropagation;
 ev.stopImmediatePropagation=function(){stop=true;return sip.apply(this,arguments)};
 try{for(const r of L.slice()){if(stop)break;if(r.off)continue;let el=t;
   if(r.sel){el=null;try{el=t&&t.closest?t.closest(r.sel):null}catch(x){report(x)}if(!el)continue}
   try{r.fn.call(D,ev,el)}catch(x){report(x)}}}
 finally{if(!own)delete ev.stopImmediatePropagation}}
function on(type,sel,fn,o){if(typeof sel==="function"){o=fn;fn=sel;sel=null}o=o||{};
 if(typeof type!=="string"||typeof fn!=="function")throw new TypeError("ROUTER.on(type, selector, fn)");
 let L=RT[type];if(!L){L=RT[type]=[];TYPES.push(type);D.addEventListener(type,dispatch)}
 if(o.id){const i=L.findIndex(r=>r.id===o.id);if(i>=0){L[i].off=true;L.splice(i,1)}}
 const r={sel:sel||null,fn,id:o.id||null,off:false};L.push(r);
 return()=>{r.off=true;const i=L.indexOf(r);if(i>=0)L.splice(i,1)}}
W.ROUTER={on,list:type=>(type?[type]:TYPES).flatMap(t=>(RT[t]||[]).map(r=>({type:t,sel:r.sel,id:r.id}))),types:()=>TYPES.slice()};
})();

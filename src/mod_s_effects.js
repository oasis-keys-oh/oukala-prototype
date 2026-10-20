/* ============ mod_s_effects.js: reduced effects (CL-30, window.EFFECTS) ============
   Glass (backdrop-filter) costs frames: measured in headless Chromium it halves the scroll frame rate on the heaviest screens
   (docs/css-tokens.md, CL-30). Omar decision 2026-10-20: turn it off automatically on slow devices and when the system asks for
   reduced motion or reduced transparency, plus a preference toggle. Fast machines look unchanged.
   Modes (kept with U.store under "falconaire.effects"): "auto" (default), "full" (always glass), "reduced" (never glass).
   Auto reduces when any of these holds: prefers-reduced-motion, prefers-reduced-transparency, the in-app Motion preference set to
   Reduce motion, 2 or fewer processor cores,
   2 GB of memory or less, or a median frame time above SLOW_MS over the first second measured after load.
   The root class fx-reduced switches every backdrop-filter off (mod_s_effects.css). */
(function(){
const W=window,D=document,R=D.documentElement;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const KEY="falconaire.effects",MODES=["auto","full","reduced"];
const SLOW_MS=28; /* median frame time above this (under about 36 frames a second) counts as a slow device */
const FX=W.EFFECTS=W.EFFECTS||{};
let mode=G(()=>U.store.get(KEY,"auto"),"auto");if(MODES.indexOf(mode)<0)mode="auto";
let measured=null;
const mq=q=>G(()=>W.matchMedia(q),null);
const MQ={motion:mq("(prefers-reduced-motion: reduce)"),transparency:mq("(prefers-reduced-transparency: reduce)")};
function hints(){const n=W.navigator||{},c=+n.hardwareConcurrency||0,m=+n.deviceMemory||0,r=[];
 if(c&&c<=2)r.push("this device reports "+c+" processor core"+(c===1?"":"s"));if(m&&m<=2)r.push("this device reports "+m+" GB of memory");return r}
FX.reasons=()=>{const r=[];if(MQ.motion&&MQ.motion.matches)r.push("the system asks for reduced motion");if(MQ.transparency&&MQ.transparency.matches)r.push("the system asks for reduced transparency");
 if(R.getAttribute("data-motion")==="reduced")r.push("your Motion preference is Reduce motion");
 hints().forEach(h=>r.push(h));if(measured&&measured.slow)r.push("frames took "+measured.median.toFixed(1)+" ms at the median in the first second after load");return r};
FX.mode=()=>mode;
FX.reduced=()=>mode==="reduced"||(mode==="auto"&&FX.reasons().length>0);
FX.apply=()=>{const on=FX.reduced();R.classList.toggle("fx-reduced",on);R.setAttribute("data-fx",on?"reduced":"full");return on};
FX.set=m=>{if(MODES.indexOf(m)<0)return mode;mode=m;G(()=>U.store.set(KEY,m));FX.apply();G(()=>W.audit&&audit("Visual effects set to "+m,FX.reduced()?"glass off":"glass on"));return mode};
FX.measured=()=>measured;
FX.SLOW_MS=SLOW_MS;
/* frame times over ms milliseconds (requestAnimationFrame). A hidden page gives no frames, so nothing is decided then. */
FX.measure=(ms,o)=>new Promise(res=>{o=o||{};ms=ms||1000;if(D.hidden){res(null);return}const t=[];let t0=0;
 const f=ts=>{if(D.hidden){res(null);return}if(!t0)t0=ts;t.push(ts);if(ts-t0<ms)W.requestAnimationFrame(f);else{
  const d=t.slice(1).map((x,k)=>x-t[k]).sort((a,b)=>a-b);if(d.length<5){res(null);return}
  const r={median:d[d.length>>1],p95:d[Math.floor(d.length*.95)],frames:d.length,slow:d[d.length>>1]>SLOW_MS,ms:Math.round(ts-t0)};
  if(!o.dry){measured=r;FX.apply()}res(r)}};
 W.requestAnimationFrame(f)});
[MQ.motion,MQ.transparency].forEach(m=>{if(m&&m.addEventListener)m.addEventListener("change",FX.apply)});
/* the in-app Motion preference (ui.js applyPrefs sets data-motion on the root) counts like the system setting */
G(()=>new MutationObserver(()=>FX.apply()).observe(R,{attributes:true,attributeFilter:["data-motion"]}));
FX.apply();
/* one second of frame times once the page has loaded and settled; auto mode only. "Settled" means three idle periods of 40 ms
   or more (requestIdleCallback), so the shell's own start-up work is not read as a slow device; after 8 seconds it measures anyway. */
FX.whenIdle=(n,max)=>new Promise(res=>{n=n||3;max=max||8000;const t0=Date.now();const ric=W.requestIdleCallback||(f=>setTimeout(()=>f({timeRemaining:()=>50}),200));
 const step=()=>{if(Date.now()-t0>max){res(false);return}ric(d=>{if(d.timeRemaining()>=40&&--n<=0){res(true);return}step()},{timeout:1000})};step()});
/* a slow first second is confirmed by a second one after the next idle period, so one busy burst does not turn glass off */
const start=()=>setTimeout(()=>{if(mode!=="auto")return;FX.whenIdle().then(()=>FX.measure(1000,{dry:true})).then(r=>{if(mode!=="auto"||!r)return;if(!r.slow){measured=r;FX.apply();return}
 FX.whenIdle().then(()=>{if(mode==="auto")FX.measure(1000)})})},500);
if(D.readyState==="complete")start();else W.addEventListener("load",start,{once:true});
})();

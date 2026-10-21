/* ===== Round 16, Agent J: Metrics, "What is the start now?"
   Interpretation: the owner is asking where each metric starts and what its value is now. Every metric now states Start (first value in its history and the month it was taken),
   Now (current value, as of the prototype date), Change since start (direction aware) and Gap to target. The Metrics landing explains this, and the
   remediation controls that said "Start automatically" and "Run now" say what they start: the fix attached to the metric. window.MX ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const H=U.esc;
const MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ASOF={y:2026,m:9,d:6};/* Oct 6, 2026: the prototype date used across screens */
const asOf=U.fmtDate(U.TODAY_ISO,{year:"numeric"});
function monthAt(n,i){let m=ASOF.m-(n-1-i),y=ASOF.y;while(m<0){m+=12;y--}return MN[m]+" "+y}
function base(m){const tr=Array.isArray(m.tr)?m.tr:[];if(m.base&&m.base.v!=null)return Object.assign({explicit:true},calc(m,m.base.v,m.base.at||"Baseline"));
 if(tr.length<2)return {none:true,now:m.cur};return calc(m,tr[0],monthAt(tr.length,0))}
function calc(m,s,at){const d=m.cur-s,pct=s?d/Math.abs(s)*100:0;const flat=Math.abs(pct)<1;const better=m.dir==="max"?d>0:d<0;return {start:s,startAt:at,now:m.cur,nowAt:asOf,delta:d,pct,flat,better:!flat&&better,worse:!flat&&!better,gap:m.cur-m.tgt,meets:m.dir==="max"?m.cur>=m.tgt:m.cur<=m.tgt}}
const sign=v=>(v>0?"+":v<0?"−":"")+Math.abs(v);
function fmtDelta(m,b){if(b.none)return "No history";const dv=Math.abs(b.delta);const s=m.u==="%"?(Math.round(dv*100)/100)+" pts":m.u==="idx"?dv.toFixed(2):String(G(()=>mfmt(m,dv),Math.round(dv*100)/100));return (b.delta>0?"+":b.delta<0?"−":"")+s+" ("+(b.pct>0?"+":b.pct<0?"−":"")+Math.abs(Math.round(b.pct*10)/10)+"%)"}
function stripHTML(m,b){if(b.none)return `<span class="mx-sn mx-flat">No history yet. Start is set at the first reading.</span>`;
 const cls=b.flat?"flat":b.better?"good":"bad";return `<span class="mx-sn small" title="Start ${H(G(()=>mfmt(m,b.start),b.start))} in ${H(b.startAt)}. Now ${H(G(()=>mfmt(m),m.cur))} as of ${asOf}."><span class="muted">Start</span> <b>${H(G(()=>mfmt(m,b.start),b.start))}</b> <span class="muted">${H(b.startAt)}</span> <span class="muted">→ Now</span> <b>${H(G(()=>mfmt(m),m.cur))}</b> <b class="mx-d ${cls}">${H(fmtDelta(m,b))}</b></span>`}
function boxHTML(m){const b=base(m);if(b.none)return `<div class="mx-box muted small">Start: no history yet. Now: ${H(G(()=>mfmt(m),m.cur))} as of ${asOf}.</div>`;const cls=b.flat?"flat":b.better?"good":"bad";
 return `<div class="mx-box" aria-label="Baseline"><div><small>Start</small><b>${H(G(()=>mfmt(m,b.start),b.start))}</b><small>${H(b.startAt)}</small></div><div><small>Now</small><b>${H(G(()=>mfmt(m),m.cur))}</b><small>as of ${asOf}</small></div><div><small>Change since start</small><b class="mx-d ${cls}">${H(fmtDelta(m,b))}</b><small>${b.flat?"Flat":b.better?"Better":"Worse"}</small></div><div><small>Gap to target</small><b class="mx-d ${b.meets?"good":"bad"}">${b.meets?"Meets target":H(G(()=>mfmt(m,Math.abs(b.gap)),Math.abs(b.gap)))+(m.dir==="max"?" below":" above")}</b><small>target ${H(G(()=>mfmt(m,m.tgt),m.tgt))}</small></div></div>`}
/* wrap the shared popovers so every metric shows the same four numbers */
/* PR-32 B2: the metric comes from metricOf (ui.js), so a tenant-aware screen under another tenant shows that tenant's start and now */
const MO=id=>typeof W.metricOf==="function"?W.metricOf(id):METRICS[id];
const _kb=W.kpiBox;if(typeof _kb==="function")W.kpiBox=function(id){const h=_kb.apply(this,arguments);const m=MO(id);return m?h.replace('<div class="formula">',()=>boxHTML(m)+'<div class="formula">'):h};
const _mb=W.metricBody;if(typeof _mb==="function")W.metricBody=function(id){const h=_mb.apply(this,arguments);const m=MO(id);return m?h.replace(/(<div class="formula"[^>]*>)/,(x)=>boxHTML(m)+x):h};
function summary(){const ids=Object.keys(METRICS);let imp=0,wor=0,flat=0,none=0,meets=0;ids.forEach(k=>{const b=base(METRICS[k]);if(b.none)none++;else{if(b.better)imp++;else if(b.worse)wor++;else flat++;if(b.meets)meets++}});return {n:ids.length,imp,wor,flat,none,meets}}
function landing(){const s=summary();const n=s.n-s.none;
 return `<section class="card glass mx-land" aria-label="How to read the baseline"><div class="cardhead"><div><h3>Baseline: start and now</h3><span class="muted small">Every metric below shows where it started and where it is now. This is a read-only comparison; it starts nothing.</span></div></div>
 <div class="mx-def"><div><b>Start</b><span>The first value in the metric's history and the month it was taken. It is the baseline that improvement is judged against.</span></div><div><b>Now</b><span>The latest value, as of ${asOf}. This is the number on every dashboard and in every report.</span></div><div><b>Change since start</b><span>Now minus Start, with its percent. Green means better in the direction the metric wants (up for coverage, down for cost or age); red means worse.</span></div><div><b>Auto-remediate</b><span>The switch on each card runs the attached procedure or agent by itself when the metric goes off trend. Run remediation now runs it immediately. Neither changes how the metric is measured.</span></div></div>
 <div class="mx-sum" role="group" aria-label="Change since start"><div class="tile"><span class="lbl">Better than start</span><span class="big num">${s.imp}</span><span class="muted small">of ${n} with history</span></div><div class="tile"><span class="lbl">Worse than start</span><span class="big num">${s.wor}</span><span class="muted small">needs a look</span></div><div class="tile"><span class="lbl">Flat (within 1%)</span><span class="big num">${s.flat}</span><span class="muted small">no real movement</span></div><div class="tile"><span class="lbl">Meet their target now</span><span class="big num">${s.meets}</span><span class="muted small">of ${n}</span></div></div></section>`}
function enhance(){if(S.screen!=="metrics")return;const v=document.getElementById("view");if(!v)return;
 const hero=v.querySelector(".hero");if(hero&&!v.querySelector(".mx-land"))hero.insertAdjacentHTML("afterend",landing());
 v.querySelectorAll(".mcard").forEach(c=>{const id=(c.id||"").replace(/^m-/,"");const m=METRICS[id];if(!m||c.querySelector(".mx-sn"))return;const n=c.querySelector(".mc-n");if(n)n.insertAdjacentHTML("beforeend",stripHTML(m,base(m)));
  const lb=c.querySelector(".mc-c .switch+.small,.mc-c label .small");if(lb&&/Start automatically/.test(lb.textContent)){lb.textContent="Auto-remediate when off trend";lb.title="When this metric goes off trend, the attached procedure or agent runs by itself. Measurement is not affected."}
  const rn=c.querySelector("[data-runrem]");if(rn&&/Run now/.test(rn.textContent)){rn.textContent="Run remediation now";rn.title="Runs the attached procedure or agent immediately. Measurement is not affected."}})}
const _ca=W.coreAfter;W.coreAfter=function(){const r=_ca&&_ca.apply(this,arguments);try{enhance()}catch(e){console.error("r16j metrics",e)}return r};
W.MX={base,summary,asOf,monthAt};
})();

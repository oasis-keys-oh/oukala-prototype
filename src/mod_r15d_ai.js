/* Round 15, Agent D. Honest AI confidence and voice.
   - aiChip: a percentage is shown only when it has a stated basis or is unique on the screen; otherwise the chip shows the evidence count.
     Every chip is labeled as a model estimate and the popover says what the number is based on.
   - Home "Needs you": evidence comes from the record (invoice checks, linked records), not a constant 90%.
   - Home "Insights": facts and deltas as chips, no advice sentences. */
(function(){
const W=window;const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;
/* ---------- aiChip ---------- */
const _ai=W.aiChip||(typeof aiChip==="function"?aiChip:null);
const seen={};let pending=false;
function batch(){if(pending)return;pending=true;(window.queueMicrotask||setTimeout)(()=>{for(const k in seen)delete seen[k];pending=false})}
function chip(o){
 o=o||{};const id=pid();batch();
 const model=o.model||"AI",pct=o.conf?Math.round(o.conf*100):null;
 const key=model+"|"+pct;let showNum=false;
 if(pct!=null){seen[key]=(seen[key]||0)+1;showNum=!!o.basis||seen[key]===1&&!o.dup}
 const srcN=(o.src&&o.src.length)||0;
 const label=pct==null?(srcN?srcN+" source"+(srcN===1?"":"s"):"draft"):showNum?"est. "+pct+"%"+(o.basis&&o.basis.n?" · "+o.basis.n+" "+(o.basis.label||"cases"):""):(srcN?srcN+" source"+(srcN===1?"":"s"):"estimate");
 const basisTxt=pct==null?"Not scored":o.basis?"Model estimate "+pct+"%, measured on "+(o.basis.n||"?")+" "+(o.basis.label||"cases")+(o.basis.set?" ("+o.basis.set+")":""):showNum?"Model estimate "+pct+"%. Not calibrated against a test set, so treat it as a rough signal.":"Model estimate. The same number appeared on other items on this screen, so it is not shown; the evidence count is.";
 return `<button class="aichip r15d-ai" popovertarget="${id}" title="AI output, model estimate">${ico("sparkle")}${E(model)} · ${E(label)}</button>
<div popover id="${id}" class="pop glass"><div class="eyebrow">AI output · model estimate</div><h3>${E(o.title||"Where this came from")}</h3><p class="muted">${E(o.note||"Generated from the records listed below, within the access of the person viewing it.")}</p>
<dl class="kv"><dt>Model</dt><dd>${E(model)}${o.verify?` · checked by ${E(o.verify)}`:""}</dd><dt>Confidence</dt><dd>${E(basisTxt)}</dd><dt>Evidence</dt><dd>${srcN?srcN+" source"+(srcN===1?"":"s")+" listed below":"No sources listed"}${o.fresh?" · data as of "+E(o.fresh):""}</dd><dt>Data lineage</dt><dd><ul class="steps">${(o.src&&o.src.length?o.src:["Not recorded"]).map(x=>`<li>${E(x)}</li>`).join("")}</ul></dd><dt>Guardrails</dt><dd><ul class="steps">${(o.guards||["Reads only what you can read","Cannot execute payments","Every action is audited"]).concat(["Model calls go only through the AI gateway (simulated in this prototype)","Stays inside one tenant (isolation is simulated)"]).map(x=>`<li>${E(x)}</li>`).join("")}</ul></dd></dl>
<div class="row"><button class="btn" popovertarget="${id}" popovertargetaction="hide">Close</button><button class="btn quiet" data-go="r15d_agents">Open agent registry</button></div></div>`}
if(_ai){W.aiChip=chip;try{aiChip=chip}catch(e){}}
R15D.aiChip=chip;

/* ---------- Home: Needs you, with evidence from the record ---------- */
function evidence(n){
 const go=n.go||[];
 if(go[0]==="inv"){const i=G(()=>INVOICES.find(x=>x.id===go[1]),null);if(i){const ok=i.checks.filter(c=>c[1]==="good").length;
  return {conf:i.conf,basis:{n:i.checks.length,label:"invoice checks ("+ok+" pass)"},src:i.checks.map(c=>c[0]+": "+(c[1]==="good"?"pass":"fail")),title:"Invoice Advisor recommendation: "+i.rec,note:"The advisor weighs six checks. The estimate comes from how many pass and how often past recommendations of this kind were overridden."}}}
 if(go[0]==="trace"){const p=G(()=>PATHS[go[1]],null);return {src:(p?p.steps.length:0)?["Trace path with "+p.steps.length+" linked records"]:["Linked record"],title:"Why this needs you"}}
 if(go[0]==="metrics"){const m=G(()=>METRICS[go[1]],null);return {src:m?["Metric "+m.n,(m.tr||[]).length+" data points"]:["Metric history"],title:"Why this needs you"}}
 if(go[0]==="fo"){return {src:["Meeting transcript","Action filed by First Officer"],title:"Why this needs you"}}
 return {src:["Open record in your scope"],title:"Why this needs you"}}
const _needs=G(()=>BLK.needs,null);
if(_needs){BLK.needs=P=>`<section class="card glass"><div class="cardhead"><h3>Needs you</h3><span class="muted small">Ranked by money and time at stake</span></div><div class="needs">${P.needs.map(n=>{const ev=evidence(n);return `<div class="need"><div class="ico ${n.ic}">${ico(n.ic==="bad"?"warn":n.ic==="good"?"check":n.ic==="warn"?"bolt":"info")}</div><div><b data-role="story">${E(n.t)}</b><span class="muted" data-role="story">${E(n.d)}</span></div><div class="act">${chip(ev)}<button class="btn primary" data-needgo="${n.go.join("|")}">${E(n.a)}</button></div></div>`}).join("")}</div></section>`}

/* ---------- Home: Insights as facts, not advice ---------- */
const pill=(t,c)=>`<span class="pill ${c||"mute"}" data-role="metric">${E(t)}</span>`;
if(G(()=>BLK.insights,null)){
 BLK.insights=P=>{
  const m=id=>G(()=>METRICS[id],null),f=id=>{const x=m(id);return x?mfmt(x):"n/a"};
  const ov=m("m_override"),cy=m("m_cycle"),kb=m("m_kb");
  const rows=[
   ["bad","Lumen: common thread",[pill("9 days late","bad"),pill("beta Nov 4 to Nov 13","warn"),pill("+$45,000 over commitment","bad")],"m_vendor","Search indexer delivery; Vendor services commitment; Taxonomy pilot risk (40%)"],
   ["warn","Lumen holds overridden",[pill("4 of 6 holds","warn"),pill("override rate "+f("m_override"),ov&&ov.cur>ov.tgt?"warn":"good")],"m_override","Finance approver decisions against the advisor, last 90 days"],
   ["good","Invoice cycle time",[pill("5.4 to "+f("m_cycle"),"good"),pill("8 weeks","mute")],"m_cycle","Weekly average from invoice received to paid"],
   ["info","Failover runbook age",[pill("14 months","warn"),pill("knowledge freshness "+f("m_kb"),kb&&kb.cur<kb.tgt?"warn":"good"),pill("refresh draft waiting","info")],"m_kb","Runbook last reviewed before the Northwind move"]];
  return `<section class="card glass"><div class="cardhead"><h3>What changed</h3><span class="muted small">Computed from metric history; open the formula for each</span></div><div class="feed">${rows.map(i=>`<div class="fi"><i class="dot ${i[0]==="info"?"mute":i[0]}"></i><div style="flex:1;min-width:0"><b data-role="story">${i[1]}</b><div class="row r15d-facts" style="margin-top:6px;gap:6px">${i[2].join("")}${fchip(i[3])}</div><div class="muted small" data-role="story">${i[4]}</div></div></div>`).join("")}</div></section>`}
}
/* ---------- the dock and chat chips repeat one number: use the same rule ---------- */
})();

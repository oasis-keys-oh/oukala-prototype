/* ===== Round 16, Agent J: converts pill and chip selectors to PICKER across the product.
   1. Executive trace: record pills become one picker over every record in the trace graph plus every project in LISTS.projects().
   2. Every group of 8 or more toggle chips on any screen is upgraded after render (PICKER.upgrade); the original buttons stay in the DOM, hidden, so their handlers keep working.
   Pills remain for small fixed sets (7 or fewer). ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
/* a project that is not in the trace graph yet gets a node generated from its registry record, linked under the portfolio */
function ensureTraceNode(id){if(!W.NODES||!W.EDGES||N(id))return;const p=W.LISTS&&LISTS.project(id);if(!p)return;
 const st=p.status||(p.paid&&p.bac&&p.paid/p.bac>1?"bad":"good");
 NODES.push({id:p.id,t:"proj",n:p.n||p.short||p.id,s:st==="bad"||st==="warn"?st:"good",c:"confirmed",owner:p.owner||"Portfolio office",story:`${p.n||p.id} is a registered project${p.pct!=null?` and ${p.pct}% complete`:""}${p.bac?`, with $${p.bac}K budget at completion`:""}. Its place in the strategy is shown through the portfolio it belongs to.`,a:{Sponsor:p.sponsor||p.owner||"",Health:st==="good"?"On track":st==="warn"?"Watch":"Needs action"}});
 EDGES.push(["P1",p.id,"contains"]);if(W.LISTS)LISTS.invalidate("traceRecords")}
function tracePicker(){const hero=document.querySelector("#view .hero");if(!hero||!W.PICKER||!W.LISTS)return;const old=hero.querySelector(".recchips");if(!old||!old.querySelector("[data-rec-pick]")||hero.querySelector(".pk2[data-pk2=trace_rec]"))return;
 const wrap=document.createElement("div");wrap.className="pk2-up tr-pick";
 wrap.innerHTML=PICKER.html({id:"trace_rec",label:"Trace record",noun:"records",source:LISTS.adapter("traceRecords",{consumer:"Executive trace · record"}),value:S.rec,recent:"trace_records",height:320,
  onPick:v=>{if(!v)return;ensureTraceNode(v);S.rec=v;S.flowSel=null;G(()=>audit("picked trace record",v));render()}});
 old.parentElement.insertBefore(wrap,old);old.style.display="none";old.dataset.pkUp="1"}
function after(){try{if(S.screen==="trace")tracePicker();if(W.PICKER)PICKER.upgrade()}catch(e){console.error("r16j sites",e)}}
const _ca=W.coreAfter;W.coreAfter=function(){const r=_ca&&_ca.apply(this,arguments);after();return r};
W.R16J_SITES={ensureTraceNode};
})();

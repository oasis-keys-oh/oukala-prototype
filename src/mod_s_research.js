/* ===== mod_s_research: material weakness research run on a 10-K, phase A (backlog PR-96). Global: window.RSR.
   The presenter loads a filing and watches a step log; each disclosed weakness ends in one of three outcomes: found and mapped,
   found and needs data (each source with its reason), or not disclosed in this filing. Phase A is a simulated replay on a
   fictional filing with no review step (Omar 2026-11-09, option B); the spec's step 6 (human review) returns in phase B.
   Event stream: the run's results (steps, sections, items, outcomes) are built only from events (RSR.TYPES); the filing text
   panel shows the filing the run started on, which the guard also checks every quote against. The replay is one timed source of those events; a live back
   end (phase B) emits the same events into RSR.emit and the screen does not change. Every event that cites the filing carries
   a quote and a page, and RSR.emit refuses one whose quote is not in the filing at that page, so the run cannot invent a weakness.
     RSR.filing(variant)  RSR.events(variant)  RSR.run(variant,{delay})  RSR.emit(ev)  RSR.on(fn)  RSR.state()  RSR.reset()
   Placement: a card on Issues and findings (grc_find) for the core company, no new business screen. Text is fictional; the
   registrant name comes from data. Labels: fictional (filing text), modeled (mapping), simulated (run and tests). Prefix: rsr-. ===== */
(function(){
"use strict";
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=s=>U.esc(s==null?"":String(s));
const org=()=>G(()=>DATA.tenantInfo("core").org,null)||"The registrant";
const core=()=>!W.DATA||DATA.tenant()==="core";

/* ---------- the fictional filing (vault: Atlantic Logistics Sample 10-K Excerpt). Pages as printed in the excerpt. ---------- */
const P58A="Management's report on internal control over financial reporting. Management assessed the effectiveness of our internal control over financial reporting as of December 31, 2025. Based on that assessment, management concluded that our internal control over financial reporting was not effective because of the material weaknesses described below.\n\nMaterial weakness 1: manual journal entries. We did not design and maintain effective controls over the review and approval of manual journal entries in our general ledger. Role assignments in the ledger allowed members of the finance operations team to create and post manual entries without an independent review.";
const P59A="Material weakness 2: user access reviews. We did not operate effective user access reviews for our transportation management system and the billing interface that feeds revenue. Quarterly reviews were completed for one of the four quarters, and we could not determine how long terminated users kept access.\n\nAreas where controls were effective. Management concluded that our controls over revenue cut-off and over fuel and spare parts inventory were designed and operating effectively as of December 31, 2025.\n\nRemediation. We have begun removing the ability to post entries from users who prepare them, and we are scheduling quarterly access reviews with documented evidence. We expect these steps to be tested for operating effectiveness over several quarters. We cannot assure that they will remediate the weaknesses.";
const P58B="Management concluded that our internal control over financial reporting was effective as of December 31, 2025. We identified no material weaknesses.";
function filing(variant){const b=variant==="b";
 const pages=[
  {page:14,section:"Item 1A. Risk Factors",text:"We have identified material weaknesses in our internal control over financial reporting. If we do not remediate them, or if we identify additional weaknesses, we may not report our financial results accurately or on time, and investors may lose confidence in our reported information."},
  {page:31,section:"Item 7. Management's Discussion and Analysis",text:"During the fourth quarter we began remediation work on the control matters described in Item 9A. We did not restate any previously issued financial statements as a result of these matters. Revenue for the year was $2.41 billion (fictional figure)."},
  {page:58,section:"Item 9A. Controls and Procedures",text:b?P58B:P58A}];
 if(!b)pages.push({page:59,section:"Item 9A. Controls and Procedures",text:P59A});
 pages.push({page:60,section:"Report of Independent Registered Public Accounting Firm",text:"Harlow Quinn LLP (fictional firm). In our opinion, because of the effect of the material weaknesses described in Management's report, the Company has not maintained effective internal control over financial reporting as of December 31, 2025, based on the criteria the Company adopted. The material weaknesses relate to the review of manual journal entries and to user access reviews for the transportation management system and the billing interface. This report does not affect our opinion on the consolidated financial statements."});
 return {variant:b?"b":"a",registrant:org()+", Inc.",title:"Annual report on Form 10-K for the fiscal year ended December 31, 2025",
  note:b?"Variant B: the Item 9A body states effective controls and no material weakness.":"As written in the fictional excerpt.",pages}}
const pageOf=(f,n)=>f.pages.find(p=>p.page===n)||null;
const has=(f,n,q)=>{const p=pageOf(f,n);return !!(p&&q&&p.text.indexOf(q)>=0)};

/* ---------- what the run looks for. Extraction reads Item 9A (management's report); the auditor's report corroborates. ---------- */
const CHECKS=[
 {id:"mw_je",kind:"weakness",title:"Material weakness 1: manual journal entries",area:"General ledger: manual journal entries",
  q:[58,"We did not design and maintain effective controls over the review and approval of manual journal entries in our general ledger."],
  cq:[60,"The material weaknesses relate to the review of manual journal entries"],
  gap:"Design gap",cause:[58,"Role assignments in the ledger allowed members of the finance operations team to create and post manual entries without an independent review."],
  map:{process:"Financial close and journal entry posting",control:"Independent review and approval of manual entries",metric:"Share of manual entries with an independent approver"},
  test:"Read the ledger pack for manual entries posted by the person who prepared them.",needs:[]},
 {id:"mw_uar",kind:"weakness",title:"Material weakness 2: user access reviews",area:"Transportation management system and billing interface",
  q:[59,"We did not operate effective user access reviews for our transportation management system and the billing interface that feeds revenue."],
  cq:[60,"user access reviews for the transportation management system and the billing interface"],
  gap:"Operating gap",cause:[59,"Quarterly reviews were completed for one of the four quarters, and we could not determine how long terminated users kept access."],
  map:{process:"Access governance for the transportation management system and billing interface",control:"Quarterly access review with evidence",metric:"Access reviews completed on time"},
  test:"Cannot test without connected data.",
  needs:[{source:"Access review records",reason:"needed to test: whether each quarterly review was completed with evidence"},
   {source:"User lists for the transportation management system and the billing interface",reason:"needed to test: who holds access today"},
   {source:"Leaver list from the HR system",reason:"needed to test: how long terminated users kept access"}]},
 {id:"ok_cut",kind:"effective",title:"Revenue cut-off and inventory controls",area:"Revenue cut-off; fuel and spare parts inventory",
  q:[59,"our controls over revenue cut-off and over fuel and spare parts inventory were designed and operating effectively"]},
 {id:"ok_none",kind:"effective",title:"Material weaknesses in internal control over financial reporting",area:"Internal control over financial reporting",
  q:[58,"We identified no material weaknesses."]}];

/* ---------- the event stream (one schema for the replay and a live back end) ---------- */
const TYPES={
 "run.started":"A run begins on a filing",
 "step":"A step changes status (running, done)",
 "section.found":"A section of the filing was located",
 "item.extracted":"A disclosed weakness, with its quote and page",
 "item.classified":"Design or operating gap, with the cause quoted",
 "item.mapped":"Candidate process, control and metric (modeled)",
 "item.tested":"A check against connected data (simulated in phase A)",
 "data.requested":"A data source the run needs, with the reason",
 "check.not_disclosed":"An area where the filing discloses no weakness, with its quote",
 "run.finished":"The run ends with its outcome counts"};
const STEPS=[
 {n:1,spec:1,name:"Load the filing",kind:"human"},
 {n:2,spec:2,name:"Find the sections",kind:"robot"},
 {n:3,spec:3,name:"Extract disclosed weaknesses",kind:"agent"},
 {n:4,spec:4,name:"Classify each weakness",kind:"agent"},
 {n:5,spec:5,name:"Map to candidate records",kind:"agent"},
 {n:6,spec:7,name:"Test what can be tested",kind:"robot"},
 {n:7,spec:8,name:"Name what is missing",kind:"agent"}];
const SECTIONS=["Item 1A. Risk Factors","Item 7. Management's Discussion and Analysis","Item 9A. Controls and Procedures","Report of Independent Registered Public Accounting Firm"];

/* the replay script: derived from the filing text, so a check whose quote is absent produces no item */
function events(variant){const f=filing(variant);const out=[];const run="RUN-"+f.variant.toUpperCase();
 const ev=(type,o)=>out.push(Object.assign({run,type,source:"replay",label:"simulated"},o));
 const step=(n,status,note)=>{const s=STEPS.find(x=>x.n===n);ev("step",{step:n,name:s.name,kind:s.kind,status,note:note||""})};
 ev("run.started",{filing:{registrant:f.registrant,title:f.title,variant:f.variant},label:"fictional"});
 step(1,"running");step(1,"done","Fictional filing loaded"+(f.variant==="b"?" (variant B)":""));
 step(2,"running");
 SECTIONS.forEach(sec=>{const ps=f.pages.filter(p=>p.section===sec).map(p=>p.page);if(ps.length)ev("section.found",{step:2,section:sec,pages:ps})});
 step(2,"done",SECTIONS.length+" sections located");
 step(3,"running");
 const found=CHECKS.filter(c=>c.kind==="weakness"&&has(f,c.q[0],c.q[1]));
 const sec=n=>(pageOf(f,n)||{}).section||"";
 found.forEach(c=>ev("item.extracted",{step:3,item:c.id,kind:"weakness",title:c.title,area:c.area,quote:c.q[1],page:c.q[0],section:sec(c.q[0]),
  corroboration:has(f,c.cq[0],c.cq[1])?{quote:c.cq[1],page:c.cq[0],section:sec(c.cq[0])}:null,label:"fictional"}));
 CHECKS.filter(c=>c.kind==="effective"&&has(f,c.q[0],c.q[1])).forEach(c=>ev("check.not_disclosed",{step:3,item:c.id,kind:"effective",title:c.title,area:c.area,quote:c.q[1],page:c.q[0],section:sec(c.q[0]),label:"fictional"}));
 step(3,"done",found.length?found.length+" weaknesses disclosed in Item 9A":"No material weakness disclosed in Item 9A");
 step(4,"running");found.forEach(c=>ev("item.classified",{step:4,item:c.id,gap:c.gap,quote:c.cause[1],page:c.cause[0],section:sec(c.cause[0]),label:"fictional"}));step(4,"done");
 step(5,"running");found.forEach(c=>ev("item.mapped",{step:5,item:c.id,mapping:c.map,label:"modeled"}));step(5,"done",found.length?"":"Nothing to map");
 step(6,"running");found.forEach(c=>ev("item.tested",{step:6,item:c.id,result:c.needs.length?"blocked":"checked",note:c.test,label:"simulated"}));step(6,"done",found.length?"":"Nothing to test");
 step(7,"running");found.forEach(c=>c.needs.forEach(d=>ev("data.requested",{step:7,item:c.id,source:d.source,reason:d.reason,label:"hypothesis"})));step(7,"done",found.some(c=>c.needs.length)?"":"No data sources needed");
 const mapped=found.filter(c=>!c.needs.length).length,needs=found.length-mapped,nd=out.filter(e=>e.type==="check.not_disclosed").length;
 ev("run.finished",{outcomes:{found_mapped:mapped,found_needs_data:needs,not_disclosed:nd}});
 return out.map((e,i)=>Object.assign({seq:i+1},e))}

/* ---------- the filing's own structure, which every quoted event is checked against ----------
   Item 9A states each weakness as a paragraph headed "Material weakness N: topic." and states effective areas in its own
   paragraphs. An item's title must be one of those headings, its quotes must sit in that paragraph, its area must use the
   paragraph's words, and its classification must match the verb the filing uses (did not design, did not operate). A "not
   disclosed" check must quote an Item 9A paragraph that states controls are effective and is not a weakness paragraph. */
const IT9A=/^Item 9A/;const AUD=/^Report of Independent/;
const norm=t=>String(t||"").toLowerCase().replace(/\bthe\b/g," ").replace(/\s+/g," ").trim();
const paras=(f,pg)=>{const p=pageOf(f,pg);return p?p.text.split("\n\n").map(t=>({page:pg,section:p.section,text:t})):[]};
const paraOf=(f,pg,q)=>paras(f,pg).find(x=>q&&x.text.indexOf(q)>=0)||null;
const HEAD=/^(Material weakness \d+: [^.]+)\./;
const weaknessParas=f=>f.pages.filter(p=>IT9A.test(p.section)).flatMap(p=>paras(f,p.page)).filter(x=>HEAD.test(x.text));
const isEffective=x=>!!x&&IT9A.test(x.section)&&!HEAD.test(x.text)&&/\beffective/.test(x.text)&&!/not effective/.test(x.text);
const areaOk=(area,text)=>{const parts=norm(area).split(/[:;]| and /).map(t=>t.trim()).filter(Boolean);return parts.length>0&&parts.every(t=>norm(text).indexOf(t)>=0)};
const GAPV={"Design gap":/did not design/,"Operating gap":/did not operate/};
function verifyQuoted(f,ev){const x=paraOf(f,ev.page,ev.quote);if(!x)return "quote not found on page "+ev.page;
 if(ev.section&&ev.section!==x.section)return "section "+ev.section+" is not the section of page "+ev.page;
 if(ev.type==="item.extracted"){if(ev.kind!=="weakness")return "an extracted item must be a weakness";
  const h=HEAD.exec(x.text);if(!h||!IT9A.test(x.section))return "quote is not in a weakness the filing states in Item 9A";
  if(ev.title!==h[1])return "title \""+ev.title+"\" is not the filing's heading \""+h[1]+"\"";
  if(!areaOk(ev.area,x.text))return "area \""+ev.area+"\" is not in the quoted passage";
  if(ev.corroboration){const c=paraOf(f,ev.corroboration.page,ev.corroboration.quote);if(!c||!AUD.test(c.section))return "corroboration is not in the auditor's report"}}
 if(ev.type==="item.classified"){const it=ST.items[ev.item];const own=it&&paraOf(f,it.page,it.quote);if(!own||own.text!==x.text)return "cause is not quoted from the item's own passage";
  if(!GAPV[ev.gap]||!GAPV[ev.gap].test(x.text))return "classification "+ev.gap+" does not match what the filing says"}
 if(ev.type==="check.not_disclosed"){if(ev.kind!=="effective")return "a not disclosed check must cite an effectiveness statement";
  if(!isEffective(x))return "quote is not an Item 9A statement that controls are effective";
  if(!areaOk(ev.area,x.text))return "area \""+ev.area+"\" is not in the quoted statement"}
 return ""}
const tally=s=>({found_mapped:s.order.filter(id=>!s.items[id].needs.length).length,found_needs_data:s.order.filter(id=>s.items[id].needs.length).length,not_disclosed:s.clear.length});

/* ---------- state: reduced from events only ---------- */
const blank=()=>({run:null,filing:null,variant:null,steps:STEPS.map(s=>({n:s.n,name:s.name,kind:s.kind,status:"waiting",note:""})),sections:[],items:{},order:[],clear:[],needs:[],finished:null,count:0,errors:[],last:""});
let ST=blank(),FIL=null,TOK=0;const SUBS=[];
const QUOTED=["item.extracted","item.classified","check.not_disclosed"];
const ITEMEV=["item.classified","item.mapped","item.tested","data.requested"];
/* the guard: nothing reaches the screen unless the filing supports it */
function verify(ev){if(!ev||!TYPES[ev.type])return "unknown event type "+(ev&&ev.type);
 if(ev.type==="run.started"){if(!ev.filing||(ev.filing.variant!=="a"&&ev.filing.variant!=="b"))return "unknown filing";return ""}
 if(!ST.run)return "no run started";
 const f=FIL||filing(ST.variant);
 if(ITEMEV.indexOf(ev.type)>=0&&!ST.items[ev.item])return "event for an item that was never extracted: "+ev.item;
 if(QUOTED.indexOf(ev.type)>=0){const w=verifyQuoted(f,ev);if(w)return w}
 if(ev.type==="item.extracted"&&ST.order.some(id=>id!==ev.item&&ST.items[id].title===ev.title))return "weakness already extracted under another id";
 if(ev.type==="data.requested"&&(!ev.source||!/^needed to test: ./.test(ev.reason||"")))return "a data source needs its reason";
 if(ev.type==="run.finished"){const t=tally(ST);if(JSON.stringify(ev.outcomes)!==JSON.stringify(t))return "outcome counts "+JSON.stringify(ev.outcomes)+" do not match the verified items "+JSON.stringify(t)}
 return ""}
function reduce(ev){let s=ST;
 if(ev.type==="run.started"){ST=s=blank();s.run=ev.run;s.variant=ev.filing.variant;s.filing=ev.filing;FIL=filing(s.variant)}
 s.count++;
 switch(ev.type){
 case"step":{const x=s.steps.find(t=>t.n===ev.step);if(x){x.status=ev.status;if(ev.note)x.note=ev.note;s.last="Step "+x.n+", "+x.name+": "+(ev.status==="done"?(ev.note||"done"):ev.status)}break}
 case"section.found":if(!s.sections.some(x=>x.section===ev.section))s.sections.push({section:ev.section,pages:ev.pages});break;
 case"item.extracted":{const prev=s.items[ev.item];s.items[ev.item]=Object.assign({needs:[]},prev||{},{id:ev.item,title:ev.title,area:ev.area,quote:ev.quote,page:ev.page,section:ev.section,corroboration:ev.corroboration});
  if(!prev)s.order.push(ev.item);s.last="Found: "+ev.title;break}
 case"item.classified":Object.assign(s.items[ev.item],{gap:ev.gap,cause:{quote:ev.quote,page:ev.page,section:ev.section}});break;
 case"item.mapped":s.items[ev.item].mapping=ev.mapping;break;
 case"item.tested":s.items[ev.item].test={result:ev.result,note:ev.note};break;
 case"data.requested":{const it=s.items[ev.item];if(it.needs.some(d=>d.source===ev.source))break;const d={item:ev.item,source:ev.source,reason:ev.reason};it.needs.push(d);s.needs.push(d);break}
 case"check.not_disclosed":if(!s.clear.some(c=>c.id===ev.item))s.clear.push({id:ev.item,title:ev.title,area:ev.area,quote:ev.quote,page:ev.page,section:ev.section});break;
 case"run.finished":s.finished=tally(s);s.last="Run finished";break}}
let evReg=false;
function emit(ev){const why=verify(ev);if(why){ST.errors.push(why);paint();throw new Error("RSR refused an event: "+why)}
 reduce(ev);SUBS.slice().forEach(fn=>{try{fn(ev,ST)}catch(e){console.error("rsr subscriber",e)}});
 G(()=>{if(!W.EVENTS)return;if(!evReg){evReg=true;Object.keys(TYPES).forEach(t=>EVENTS.register({id:"research."+t,label:TYPES[t],module:"mod_s_research",owner:"",fields:[{name:"run",type:"string"},{name:"step",type:"number"},{name:"item",type:"string"},{name:"quote",type:"string"},{name:"page",type:"number"},{name:"label",type:"string"}]}))}
  EVENTS.emit("research."+ev.type,{run:ev.run,step:ev.step||0,item:ev.item||"",quote:ev.quote||"",page:ev.page||0,label:ev.label},{source:"mod_s_research"})});
 paint();return ev}
function reset(){TOK++;ST=blank();FIL=null;paint()}
/* the replay source: same events a live back end would send, on a timer (delay 0 plays them at once). Leaving the screen or
   changing tenant cancels a run that has not finished. */
function run(variant,o){o=o||{};reset();const tok=TOK;const list=events(variant);
 const delay=o.delay==null?420:+o.delay;
 if(!delay){list.forEach(emit);return ST}
 let i=0;const next=()=>{if(tok!==TOK||i>=list.length)return;try{emit(list[i++])}catch(e){return}if(i<list.length)setTimeout(next,delay)};next();return ST}
const running=()=>!!ST.run&&!ST.finished&&!ST.errors.length;

/* ---------- the card on Issues and findings ---------- */
const KINDP=k=>`<span class="pill ${k==="agent"?"info":k==="robot"?"mute":"good"}" title="${E(G(()=>STEPMODE.MODES[k].desc,""))}">${E(G(()=>STEPMODE.label(k),k))}</span>`;
const LAB={fictional:"Fictional",modeled:"Modeled",simulated:"Simulated",hypothesis:"Hypothesis"};
const lab=k=>`<span class="pill mute rsr-lab" data-rsr-label="${E(k)}">${E(LAB[k]||k)}</span>`;
const cite=(quote,page,section)=>`<blockquote class="rsr-q" data-rsr-quote data-rsr-page="${E(page)}">${E(quote)}<cite>${E(section||"")}, page ${E(page)}</cite></blockquote>`;
const BANNER=where=>`<div class="rsr-banner" role="note" data-rsr-banner="${where}"><b>Simulated.</b> A scripted replay on a fictional filing${ST.filing?" ("+E(ST.filing.registrant)+")":""}. No model runs, nothing is fetched and no system is connected. Fictional registrant and auditor; every figure is fictional.</div>`;
const OUT={mapped:["Found and mapped","good"],needs:["Found, needs data","warn"],clear:["Not disclosed in this filing","mute"]};
function itemHTML(it){const o=it.needs.length?"needs":"mapped";const done=!!ST.finished;
 return `<article class="rsr-item" data-rsr-item="${E(it.id)}" data-rsr-outcome="${done?o:""}"><div class="rsr-ih"><b>${E(it.title)}</b>${done?`<span class="pill ${OUT[o][1]}">${E(OUT[o][0])}</span>`:`<span class="pill mute">In progress</span>`}</div>
 <p class="small muted">Area: ${E(it.area)} ${lab("fictional")}</p>${cite(it.quote,it.page,it.section)}${it.corroboration?`<p class="small muted">Auditor's report agrees:</p>${cite(it.corroboration.quote,it.corroboration.page,it.corroboration.section)}`:""}
 ${it.gap?`<p class="small"><b>${E(it.gap)}.</b> Cause as the filing states it:</p>${cite(it.cause.quote,it.cause.page,it.cause.section)}`:""}
 ${it.mapping?`<dl class="rsr-map"><div><dt>Process</dt><dd>${E(it.mapping.process)}</dd></div><div><dt>Control</dt><dd>${E(it.mapping.control)}</dd></div><div><dt>Metric</dt><dd>${E(it.mapping.metric)}</dd></div></dl><p class="small muted">Candidate mapping ${lab("modeled")} Illustrative; the process, control and metric records are not connected yet.</p>`:""}
 ${it.test?`<p class="small" data-rsr-test="${E(it.test.result)}"><b>${it.test.result==="checked"?"Checked against the ledger pack":"Not tested: needs connected data"}.</b> ${E(it.test.note)} ${lab("simulated")}</p>`:""}
 ${it.needs.length?`<div class="rsr-needs"><b class="small">Data sources to connect</b> ${lab("hypothesis")}<ul>${it.needs.map(d=>`<li data-rsr-need><b>${E(d.source)}</b>: ${E(d.reason)}</li>`).join("")}</ul></div>`:""}</article>`}
function cardHTML(){const s=ST;const live=running();
 const steps=`<ol class="rsr-steps" aria-label="Run steps">${s.steps.map(t=>`<li class="rsr-st rsr-${t.status}" data-rsr-step="${t.n}" data-rsr-status="${t.status}"><span class="rsr-sn">${t.n}</span><span class="rsr-sname">${E(t.name)}</span>${KINDP(t.kind)}<span class="small muted">${E(t.status==="done"?(t.note||"Done"):t.status==="running"?"Running":"Waiting")}</span>${t.n===2&&s.sections.length?`<span class="small muted rsr-secs">${s.sections.map(x=>E(x.section)+" (page"+(x.pages.length>1?"s ":" ")+x.pages.join(", ")+")").join("; ")}</span>`:""}</li>`).join("")}</ol>
  <p class="small muted rsr-norev">No review step in this simulated run. On a real filing a person confirms or edits every item before a buyer sees the result.</p>`;
 const f=s.finished;
 const counts=f?`<div class="rsr-counts" data-rsr-counts role="group" aria-label="Outcome counts">${[["Found and mapped",f.found_mapped],["Found, needs data",f.found_needs_data],["Not disclosed in this filing",f.not_disclosed]].map(([l,v])=>`<div><span class="rsr-cv">${E(v)}</span><span class="small muted">${E(l)}</span></div>`).join("")}<div>${lab("simulated")}<span class="small muted">Counts from this simulated run</span></div></div>${BANNER("results")}`:"";
 const items=s.order.map(id=>itemHTML(s.items[id])).join("");
 const clear=s.clear.map(c=>`<article class="rsr-item" data-rsr-item="${E(c.id)}" data-rsr-outcome="clear"><div class="rsr-ih"><b>${E(c.title)}</b><span class="pill ${OUT.clear[1]}">${E(OUT.clear[0])}</span></div><p class="small muted">Area: ${E(c.area)} ${lab("fictional")} The filing states these controls are effective, so the run reports no weakness here.</p>${cite(c.quote,c.page,c.section)}</article>`).join("");
 const none=f&&!s.order.length?`<p class="rsr-none" data-rsr-none>No material weakness is disclosed in this filing. The run lists no mapping and asks for no data.</p>`:"";
 const doc=FIL?`<details class="rsr-doc"><summary>Read the filing text (${E(FIL.registrant)}, fictional)</summary>${FIL.pages.map(p=>`<section class="rsr-page" data-rsr-filing-page="${p.page}"><h4>${E(p.section)}, page ${p.page}</h4>${p.text.split("\n\n").map(t=>`<p>${E(t)}</p>`).join("")}</section>`).join("")}</details>`:"";
 return `<section class="card glass rsr" data-rsr-card><div class="cardhead"><div><h3>Material weakness research on a 10-K</h3><span class="muted small">Reads a filing step by step. Each weakness ends found and mapped, found and needs data, or not disclosed.</span></div></div>
 ${BANNER("top")}<p class="rsr-live small muted" aria-live="polite" data-rsr-live>${E(s.last)}</p>
 <div class="row rsr-act"><button type="button" class="btn primary" data-rsr-run="a"${live?" disabled":""}>Run on the fictional 10-K</button><button type="button" class="btn" data-rsr-run="b"${live?" disabled":""}>Run on variant B (no weakness)</button>${s.run?`<button type="button" class="btn" data-rsr-reset>Clear</button>`:""}</div>
 ${s.errors.length?`<p class="rsr-none" role="alert" data-rsr-error>The run stopped: an event did not match the filing (${E(s.errors[0])}). Nothing unverified is shown.</p>`:""}${s.run?steps+counts+none+`<div class="rsr-items">${items}${clear}</div>`+doc:`<p class="small muted">Step 1 is yours: choose a filing. The run then plays straight through.</p>`}</section>`}
/* repaint the card; keep keyboard focus on the same control, and announce only the newest line (rsr-live) */
function paint(){const el=G(()=>document.querySelector("#view [data-rsr-card]"),null);if(!el)return;
 const a=document.activeElement;const key=a&&el.contains(a)?(a.dataset.rsrRun?'[data-rsr-run="'+a.dataset.rsrRun+'"]':a.hasAttribute("data-rsr-reset")?"[data-rsr-reset]":a.tagName==="SUMMARY"?".rsr-doc summary":null):null;
 const open=!!el.querySelector(".rsr-doc[open]");el.outerHTML=cardHTML();
 const nu=document.querySelector("#view [data-rsr-card]");if(!nu)return;if(open){const d=nu.querySelector(".rsr-doc");if(d)d.open=true}
 if(key){const t=nu.querySelector(key);if(t&&!t.disabled)t.focus({preventScroll:true});else{const h=nu.querySelector("h3");if(h){h.tabIndex=-1;h.focus({preventScroll:true})}}}}
/* place the card after the hero of Issues and findings (core company only; other tenants have no filing) */
const base=G(()=>_R.grc_find,null);
if(base)_R.grc_find=function(){const h=base.apply(this,arguments);if(!core())return h;const i=h.indexOf("</section>");return i<0?h+cardHTML():h.slice(0,i+10)+cardHTML()+h.slice(i+10)};
ROUTER.on("click","[data-rsr-run]",(e,el)=>{run(el.dataset.rsrRun)},{id:"rsr-run"});
ROUTER.on("click","[data-rsr-reset]",()=>reset(),{id:"rsr-reset"});
G(()=>HOOKS.on("tenantChange",()=>reset(),{id:"rsr-tenant"}));
G(()=>HOOKS.on("beforeGo",scr=>{if(scr!=="grc_find"&&running())reset()},{id:"rsr-leave"}));

W.RSR={TYPES,STEPS,filing,events,run,emit,reset,state:()=>ST,on:fn=>{SUBS.push(fn);return()=>{const i=SUBS.indexOf(fn);if(i>=0)SUBS.splice(i,1)}},card:cardHTML};
})();

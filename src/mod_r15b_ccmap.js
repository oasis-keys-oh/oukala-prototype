/* ===== Round 15, Agent B: Cost center mapping (cost center <-> org unit <-> budget owner <-> GL segment).
   Screen bud_ccmap. API window.CCMAP. Entities: cost_center (extended), cost_center_map (new). ===== */
(function(){
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tryv=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const K=()=>window.BUDX||null;
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const D$=n=>"$"+Math.round(n).toLocaleString("en-US"),C$=n=>n>=1e6?"$"+(n/1e6).toFixed(2).replace(/0$/,"").replace(/\.$/,"")+"M":n>=1e3?"$"+Math.round(n/1e3)+"K":"$"+Math.round(n);
const sg=v=>(v>0?"+":v<0?"−":"")+C$(Math.abs(v));
/* ---- seed: the ERP cost center list as the translation table ---- */
const SEED=[
 {code:"CC-4411",name:"Editorial",gl:"01.4411",owner:"Elena Marsh",units:["Editorial"],st:"Active",note:"Standards editing and publishing."},
 {code:"CC-4450",name:"Standards Development",gl:"01.4450",owner:"Noor Haddad",units:[],st:"Active",note:"Technical committees. The org chart has no matching unit yet."},
 {code:"CC-4412",name:"Data Office",gl:"01.4412",owner:"Anil Mehta",units:["Data and analytics"],st:"Active",note:""},
 {code:"CC-4430",name:"Finance and Legal Operations",gl:"01.4430",owner:"Marcus Reid",units:["Finance","Legal and compliance"],st:"Active",note:"One ERP cost center covers two org units."},
 {code:"CC-4420",name:"IT Operations",gl:"01.4420",owner:"Casey Rowan",units:["Platform engineering","Service desk and operations","Architecture","Security","Change and release","Technology"],st:"Active",note:"Six org units share one cost center, so spend cannot be split by team."},
 {code:"CC-4460",name:"Membership and Sales",gl:"",owner:"",units:[],st:"Active",note:"No owner, no GL segment and no org unit on file."},
 {code:"CC-4400",name:"Executive office",gl:"01.4400",owner:"Catherine Doyle",units:["Executive office"],st:"Active",note:""},
 {code:"CC-4435",name:"People operations",gl:"",owner:"Joanna Pierce",units:["People operations"],st:"Active",note:"GL segment not yet created in the ERP."},
 {code:"CC-4425",name:"Portfolio office",gl:"01.4425",owner:"Maya Ortiz",units:["Portfolio and delivery"],st:"Active",note:"Projects carry their own budget lines under other cost centers."}];
const TEAMU={"PMO":"Portfolio and delivery","Platform team":"Platform engineering","Data team":"Data and analytics","Service desk":"Service desk and operations","Ops team":"Platform engineering","Editors":"Editorial","Change management":"Change and release","Editorial":"Editorial","Finance":"Finance","Security":"Security","Architecture":"Architecture"};
const S_=S.ccmap=Object.assign({rows:SEED.map(r=>({...r,units:r.units.slice()})),log:[]},S.ccmap||{});
const rows=()=>S_.rows;
const staff=()=>tryv(()=>ORGX.staff,[])||[];
const unitList=()=>[...new Set(staff().map(p=>p.unit))].sort();
const headcount=u=>staff().filter(p=>p.unit===u).length;
const byCode=c=>rows().find(r=>r.code===c)||null;
const DEPTS=()=>K()?K().DEPTS:[];
const ccOfDept=d=>{const x=DEPTS().find(z=>z[0]===d);return x?x[2]:null};
const deptOfCC=c=>{const x=DEPTS().find(z=>z[2]===c);return x?x[0]:null};
const allLines=()=>K()?K().B().lines:[];
const linesOf=code=>allLines().filter(l=>ccOfDept(l.dept)===code);
const ccOfLine=l=>byCode(ccOfDept(l.dept));
const unitOfPerson=n=>{const p=staff().find(x=>x.n===n);if(p)return p.unit;const d=tryv(()=>who(n),null);return d&&TEAMU[d.team]||null};
const ccsOfUnit=u=>rows().filter(r=>r.units.includes(u));
const ccOfPerson=n=>{const u=unitOfPerson(n);if(!u)return null;return ccsOfUnit(u)[0]||null};
const isMapped=r=>!!(r.units.length&&r.owner&&r.gl);
const rel=r=>!r.units.length?"Unmapped":r.units.length===1?"One to one":"Many to one";
const tot=a=>({appr:sum(a,l=>l.appr),comm:sum(a,l=>l.comm),act:sum(a,l=>l.act),fcst:sum(a,l=>l.fcst)});
function coverage(){const L=allLines(),t=tot(L),mapped=tot(L.filter(l=>{const r=ccOfLine(l);return r&&isMapped(r)}));
 const un=unitList(),withCC=un.filter(u=>ccsOfUnit(u).length),one=rows().filter(r=>r.units.length===1&&r.owner&&r.gl).length;
 const shared=tot(L.filter(l=>{const r=ccOfLine(l);return r&&r.units.length>1})).appr;
 return {shared,sharedPct:t.appr?Math.round(100*shared/t.appr):0,total:t.appr,mapped:mapped.appr,pct:t.appr?Math.round(1000*mapped.appr/t.appr)/10:100,ccs:rows().length,ccMapped:rows().filter(isMapped).length,units:un.length,unitsCC:withCC.length,unitPct:un.length?Math.round(100*withCC.length/un.length):100,one,onePct:rows().length?Math.round(100*one/rows().length):100}}
function gaps(){const g=[],un=unitList();
 rows().forEach(r=>{const L=linesOf(r.code),a=sum(L,l=>l.appr);
  if(!r.units.length)g.push({sev:a?"bad":"warn",kind:"No org unit",cc:r.code,msg:r.code+" "+r.name+" is not tied to any org chart unit"+(a?"; "+C$(a)+" of approved budget cannot roll up to an org chart owner":""),fix:"Pick the org unit that answers for this spend."});
  if(!r.owner)g.push({sev:a?"bad":"warn",kind:"No budget owner",cc:r.code,msg:r.code+" "+r.name+" has no named budget owner",fix:"Name an owner; the unit head is the default."});
  if(!r.gl)g.push({sev:"warn",kind:"No GL segment",cc:r.code,msg:r.code+" "+r.name+" has no general ledger segment, so actuals cannot post to it",fix:"Create the segment in the ERP and enter it here."});
  if(r.units.length>1)g.push({sev:"info",kind:"Many to one",cc:r.code,msg:r.units.length+" org units share "+r.code+" ("+r.units.join(", ")+")",fix:"Accept as a translation, or split the cost center by unit."});
  if(!L.length&&r.units.length)g.push({sev:"info",kind:"No budget lines",cc:r.code,msg:r.code+" "+r.name+" has no budget lines in this fiscal year",fix:"Confirm the cost center is still needed."})});
 un.forEach(u=>{const c=ccsOfUnit(u);if(!c.length)g.push({sev:"warn",kind:"Org unit without cost center",unit:u,msg:u+" ("+headcount(u)+" people) has no cost center",fix:"Map it to an existing cost center or request a new one."});
  else if(c.length>1)g.push({sev:"warn",kind:"One to many",unit:u,msg:u+" appears under "+c.map(x=>x.code).join(" and "),fix:"Choose a primary cost center."})});
 const o={bad:0,warn:1,info:2};return g.sort((a,b)=>o[a.sev]-o[b.sev])}
function syncMetrics(){const c=coverage(),set=(id,v)=>{const m=window.METRICS&&METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(0,7).concat([v])};set("m_cc_cov",c.pct);set("m_cc_units",c.unitPct);set("m_cc_one",c.onePct);return c}
/* ---- helpers ---- */
const pch=n=>n?(window.pchip?pchip(n,{size:22}):H(n)):`<span class="pill bad">No owner</span>`;
const stat=(l,v,sub,cls)=>`<div class="stat ${cls==="bad"?"crit":""}"><small>${l}</small><span class="num" data-role="metric">${v}</span><em style="${cls==="warn"?"color:var(--warn-f)":cls==="good"?"color:var(--good-f)":cls==="bad"?"color:var(--bad-f)":""}">${sub}</em></div>`;
const sevPill=s=>`<span class="pill ${s==="bad"?"bad":s==="warn"?"warn":"info"}">${s==="bad"?"Blocks roll-up":s==="warn"?"Fix soon":"Accepted or info"}</span>`;
function csv(name,head,rowsA){const q=v=>{v=String(v==null?"":v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
 const txt=[head.map(q).join(",")].concat(rowsA.map(r=>r.map(q).join(","))).join("\n");const b=new Blob([txt],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name+".csv";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
window.R15B=Object.assign(window.R15B||{},{csv});
/* ---- screen ---- */
function mapTable(){const R=rows();
 return `<div class="tscroll"><table class="ccm-t"><thead><tr><th>Cost center</th><th>GL segment</th><th>Budget owner</th><th>Org chart units</th><th>Relation</th><th>Approved</th><th>Lines</th><th></th></tr></thead><tbody>${R.map(r=>{const L=linesOf(r.code),a=sum(L,l=>l.appr);
  return `<tr><td><b>${H(r.code)}</b><span class="sub">${H(r.name)}</span></td><td>${r.gl?`<span class="tok">${H(r.gl)}</span>`:`<span class="pill warn">Missing</span>`}</td><td>${pch(r.owner)}</td>
  <td class="ccm-u">${r.units.length?r.units.map(u=>`<button type="button" class="pill mute ccm-un" data-ccm-unit="${H(u)}" title="${headcount(u)} people. Open the org chart">${H(u)}</button>`).join(" "):`<span class="pill bad">None</span>`}</td>
  <td><span class="pill ${r.units.length===1?"good":r.units.length?"warn":"bad"}">${rel(r)}</span></td><td class="tabular">${a?D$(a):'<span class="muted">None</span>'}</td><td class="tabular">${L.length}</td>
  <td><button class="btn" data-ccm-edit="${H(r.code)}">Edit</button></td></tr>`}).join("")}</tbody></table></div>`}
function gapList(){const G=gaps();if(!G.length)return `<p class="muted">No gaps. Every cost center has an org unit, an owner and a GL segment.</p>`;
 return `<div class="tscroll"><table><thead><tr><th>Gap</th><th>What</th><th>Suggested fix</th><th>Severity</th><th></th></tr></thead><tbody>${G.map(g=>`<tr><td><b>${H(g.kind)}</b></td><td style="white-space:normal;min-width:260px">${H(g.msg)}</td><td style="white-space:normal;min-width:220px" class="muted">${H(g.fix)}</td><td>${sevPill(g.sev)}</td><td>${g.cc?`<button class="btn" data-ccm-edit="${H(g.cc)}">Fix</button>`:`<button class="btn" data-ccm-new="${H(g.unit||"")}">Map</button>`}</td></tr>`).join("")}</tbody></table></div>`}
function rollup(){const T=tot(allLines());
 const byOwner={};rows().forEach(r=>{const k=r.owner||"No owner";const o=byOwner[k]=byOwner[k]||{owner:r.owner,ccs:[],a:0,f:0,x:0};const t=tot(linesOf(r.code));o.ccs.push(r.code);o.a+=t.appr;o.f+=t.fcst;o.x+=t.act});
 const own=Object.values(byOwner).sort((a,b)=>b.a-a.a);
 const unitRows=unitList().map(u=>{const cs=ccsOfUnit(u);const t=tot(cs.flatMap(c=>linesOf(c.code)));const shared=cs.some(c=>c.units.length>1);return {u,cs,t,shared,hc:headcount(u)}}).sort((a,b)=>b.t.appr-a.t.appr);
 const unmapped=tot(allLines().filter(l=>{const r=ccOfLine(l);return !r||!r.units.length}));
 return `${card("By budget owner","Approved, forecast and actual for every cost center an owner answers for. Owners come from the org chart.",`<div class="tscroll"><table><thead><tr><th>Owner</th><th>Title and unit</th><th>Cost centers</th><th>Approved</th><th>Forecast</th><th>Variance</th></tr></thead><tbody>${own.map(o=>{const rec=tryv(()=>ORGX.person(o.owner),null);return `<tr><td>${pch(o.owner)}</td><td class="muted">${H(rec?[rec.title,rec.unit].filter(Boolean).join(" · "):"Not on the org chart")}</td><td>${o.ccs.map(c=>`<span class="tok">${H(c)}</span>`).join(" ")}</td><td class="tabular">${o.a?D$(o.a):"None"}</td><td class="tabular">${o.f?D$(o.f):"None"}</td><td class="tabular ${o.f-o.a>0?"bud-bad":""}">${o.a?sg(o.f-o.a):"None"}</td></tr>`}).join("")}</tbody></table></div>`)}
 ${card("By org chart unit","Budget that rolls up to each unit. A unit that shares a cost center shows the shared total and cannot be split.",`<div class="tscroll"><table><thead><tr><th>Org unit</th><th>People</th><th>Cost center</th><th>Approved</th><th>Forecast</th><th>Note</th></tr></thead><tbody>${unitRows.map(x=>`<tr><td><button type="button" class="bd-n" data-ccm-unit="${H(x.u)}"><b>${H(x.u)}</b></button></td><td class="tabular">${x.hc}</td><td>${x.cs.length?x.cs.map(c=>`<span class="tok">${H(c.code)}</span>`).join(" "):`<span class="pill warn">None</span>`}</td><td class="tabular">${x.t.appr?D$(x.t.appr):"None"}</td><td class="tabular">${x.t.fcst?D$(x.t.fcst):"None"}</td><td>${x.shared?`<span class="pill warn">Shared cost center</span>`:!x.cs.length?`<span class="pill warn">Unmapped</span>`:""}</td></tr>`).join("")}<tr class="ccm-tot"><td colspan="3"><b>Not tied to an org unit</b></td><td class="tabular">${D$(unmapped.appr)}</td><td class="tabular">${D$(unmapped.fcst)}</td><td>${unmapped.appr?`<span class="pill bad">${Math.round(100*unmapped.appr/T.appr)}% of approved</span>`:""}</td></tr></tbody></table></div>`)}`}
function procPane(){const p=tryv(()=>PROCLIB.list().find(x=>x.id==="cost_center_change"),null);let steps=(PROC.defs.bud_ccmap||{}).steps||[];if(!Array.isArray(steps))steps=[];
 return `<p class="small muted">Owner <b>${H((p&&p.owner)||"Victor Amaya")}</b> · backup <b>${H((p&&p.backup)||"Avery Chen")}</b> · every step is editable in the process library.</p><ol class="ccm-steps">${steps.map((s,i)=>`<li><i>${i+1}</i><div><b>${H(s.n)}</b> <span class="pill mute">${H(s.who||"")}</span><div class="small muted">${H(s.d||"")}</div><div class="small muted">${H(s.owner||"")} · ${H(s.sla||"")}</div></div></li>`).join("")}</ol><div class="row"><button class="btn" data-ccm-proc>Open in the process library</button></div>`}
function view(){const c=syncMetrics(),G=gaps(),open=G.filter(x=>x.sev!=="info").length;
 return `<div class="screen">${hero("Budgets · cost center mapping","Cost centers map to the org chart",`<b>${c.pct}%</b> of approved budget (${C$(c.mapped)} of ${C$(c.total)}) sits on a cost center that has an org unit, an owner and a GL segment, but <b>${c.sharedPct}%</b> (${C$(c.shared)}) is on cost centers shared by several org units. ${c.ccMapped} of ${c.ccs} cost centers are fully mapped and ${c.unitsCC} of ${c.units} org units have a cost center.`,`<div class="row">${fchip("m_cc_cov")}${fchip("m_cc_units")}<button class="btn primary" data-ccm-new="">Add a cost center</button><button class="btn" data-ccm-csv>Export CSV</button></div>`)}${lensNote()}
 <div class="statrow ccm-stats">${stat("Budget on mapped cost centers",c.pct+"%",C$(c.mapped)+" of "+C$(c.total),c.pct>=95?"good":c.pct>=80?"warn":"bad")}${stat("Cost centers fully mapped",c.ccMapped+" of "+c.ccs,"Org unit, owner and GL segment",c.ccMapped===c.ccs?"good":"warn")}${stat("Budget on shared cost centers",c.sharedPct+"%",C$(c.shared)+" cannot be split by org unit",c.sharedPct>25?"warn":"good")}${stat("Org units with a cost center",c.unitsCC+" of "+c.units,c.units-c.unitsCC+" without",c.unitsCC===c.units?"good":"warn")}${stat("Open gaps",String(open),G.length-open+" accepted or informational",open?"warn":"good")}</div>
 ${views("ccm",["Mapping","Gaps ("+open+")","Roll-up to the org chart","Change process"],[
  card("Cost center, org unit, owner and GL segment","The translation table. A cost center can cover several org units (many to one); both directions are shown as gaps when they break roll-up.",mapTable(),`<span class="row"><button class="btn" data-ccm-new="">Add</button></span>`),
  card("Gaps","Unmapped, ownerless and shared cost centers, with the budget they affect.",gapList()),
  rollup(),
  card("How a cost center change is made","Request, check, finance review, controller approval, ERP update and budget re-roll. Edits on this screen follow the same record.",procPane())])}</div>`}
REG("bud_ccmap","Cost center mapping","portfolio","M3 6h7v5H3zM14 6h7v5h-7zM3 15h7v4H3zM14 15h7v4h-7zM10 8.5h4M6.5 11v4M17.5 11v4",view);
/* ---- editing ---- */
function ccForm(code,pre){const r=code?byCode(code):null;const U=unitList();
 openForm({id:"ccm_edit",title:r?"Edit cost center "+r.code:"Add a cost center",story:"Maps one ERP cost center to org chart units, a named budget owner and a GL segment. Changes are recorded and budget lines re-roll to the new owner at once. Approval follows the cost center change process.",submit:r?"Save mapping":"Add cost center",
  fields:[{section:"Cost center"},{k:"code",label:"Code",type:"text",req:true,ph:"CC-4470",help:r?"The code comes from the ERP and cannot be changed here.":"Use the code created in the ERP."},{k:"name",label:"Name",type:"text",req:true},{k:"gl",label:"GL segment",type:"text",ph:"01.4470",help:"From the ERP chart of accounts. Leave empty only while it is being created."},
   {section:"Who and where"},{k:"owner",label:"Budget owner",type:"people",me:false,req:true,help:"A named person on the org chart."},{k:"units",label:"Org chart units it covers",type:"multi",opts:U.map(u=>[u,u+" ("+headcount(u)+")"]),help:"More than one unit is a many-to-one translation and is shown as a gap."},{k:"note",label:"Note",type:"text"}],
  defaults:r?{code:r.code,name:r.name,gl:r.gl,owner:r.owner,units:r.units.slice(),note:r.note}:{units:pre?[pre]:[]},
  live:v=>{const rr={units:v.units||[],owner:v.owner,gl:v.gl};const own=v.owner?unitOfPerson(v.owner):null;return `<div class="rem"><div class="ico">${ico(isMapped(rr)?"check":"info")}</div><div><b>${isMapped(rr)?"Fully mapped":"Not fully mapped yet"}: ${rel(rr).toLowerCase()}</b><div class="small muted">${(rr.units.length>1?rr.units.length+" org units share this cost center. ":"")+(!rr.units.length?"Pick an org unit. ":"")+(!v.gl?"GL segment is empty. ":"")+(own&&rr.units.length&&!rr.units.includes(own)?"The owner sits in "+own+", outside the mapped units. ":"")}</div></div></div>`},
  onSubmit:v=>{const code2=String(v.code||"").trim().toUpperCase();if(!/^CC-\d{3,5}$/.test(code2))return {close:false,toast:"Use the ERP code, for example CC-4470.",audit:"rejected cost center code"};
   if(!r&&byCode(code2))return {close:false,toast:code2+" already exists. Edit it instead.",audit:"rejected duplicate cost center"};
   const rec=r||{code:code2,st:"Active"};Object.assign(rec,{name:v.name,gl:String(v.gl||"").trim(),owner:v.owner||"",units:(v.units||[]).slice(),note:v.note||""});if(!r)S_.rows.push(rec);
   S_.log.push({d:"2026-10-11",code:rec.code,by:PICK_ME(),what:r?"Mapping edited":"Cost center added"});tryv(()=>window.STORE&&STORE.put&&STORE.put("cost_center_map",{id:rec.code,...rec}));
   tryv(()=>window.ORGX&&ORGX.bump&&ORGX.bump());syncMetrics();render();return {toast:rec.code+" saved. "+(isMapped(rec)?"Fully mapped.":"Still has a gap."),audit:"cost center "+rec.code+" "+(r?"edited":"added")}}})}
const PICK_ME=()=>window.PICK?PICK.me():"Casey Rowan";
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-ccm-edit]")){ccForm(t.dataset.ccmEdit);return}
 if(t=e.target.closest("[data-ccm-new]")){ccForm(null,t.dataset.ccmNew||"");return}
 if(t=e.target.closest("[data-ccm-unit]")){const u=t.dataset.ccmUnit;if(window.OS)tryv(()=>{OS.q=u});go("org_chart");return}
 if(t=e.target.closest("[data-ccm-proc]")){go("plat_proc");return}
 if(t=e.target.closest("[data-ccm-csv]")){csv("cost-center-mapping",["Cost center","Name","GL segment","Budget owner","Org units","Relation","Approved","Forecast","Lines"],rows().map(r=>{const L=linesOf(r.code),x=tot(L);return [r.code,r.name,r.gl,r.owner,r.units.join("; "),rel(r),x.appr,x.fcst,L.length]}));return}});
/* ---- public API ---- */
window.CCMAP={rows:()=>rows().map(r=>({...r,units:r.units.slice()})),byCode,ccOfDept,ccOfLine,ccOfPerson,unitOfPerson,unitList,linesOf,coverage,gaps,isMapped,rel,sync:syncMetrics,edit:ccForm,ownerOfLine:l=>{const r=ccOfLine(l);return r?r.owner:""},unitsOfLine:l=>{const r=ccOfLine(l);return r?r.units.slice():[]}};
/* ---- metrics, process model, data model, interconnectivity, ownership ---- */
const MR=(ref,title)=>({kind:"sop",ref,title,agent:"",auto:false,state:"idle",prog:""});
Object.assign(METRICS,{
 m_cc_cov:{n:"Budget on mapped cost centers",f:"Σ approved budget on lines whose cost center has an org unit, a budget owner and a GL segment ÷ Σ approved budget × 100",u:"%",cur:100,tgt:95,badAt:75,dir:"max",max:100,tr:[70,72,74,78,80,82,84,86],owner:"Victor Amaya",use:["Cost center mapping","All budget lines"],rem:MR("SOP-CC1","Map or remap the cost center")},
 m_cc_units:{n:"Org units with a cost center",f:"Org chart units that appear in at least one cost center mapping ÷ all org chart units × 100",u:"%",cur:100,tgt:100,badAt:70,dir:"max",max:100,tr:[60,62,66,68,70,74,76,78],owner:"Victor Amaya",use:["Cost center mapping"],rem:MR("SOP-CC1","Map or remap the cost center")},
 m_cc_one:{n:"Cost centers mapped one to one",f:"Cost centers with exactly one org unit, an owner and a GL segment ÷ all cost centers × 100",u:"%",cur:50,tgt:70,badAt:30,dir:"max",max:100,tr:[30,32,34,36,40,44,48,50],owner:"Avery Chen",use:["Cost center mapping"],rem:MR("SOP-CC2","Split a shared cost center by org unit")}});
if(typeof PROC!=="undefined")PROC.reg("bud_ccmap",{title:"Change a cost center",std:["tbm"],steps:[
 {n:"Request the change",d:"The cost center owner or a unit head asks to add, merge, split or remap a cost center, with the org unit, owner and GL segment.",who:"human",owner:"Budget owner",sla:"1 day",in:"Org change or new spend",out:"Change request"},
 {n:"Check the mapping",d:"Rules check for unmapped units, missing owners, missing GL segments and many-to-one sharing.",who:"robot",owner:"Mapping rules",sla:"Instant",in:"Change request",out:"Gap list"},
 {n:"Finance review",d:"Finance confirms the code, the GL segment and the effect on open budget lines and forecasts.",who:"human",owner:"Victor Amaya",sla:"3 days",in:"Gap list",out:"Finance opinion"},
 {n:"Controller approval",d:"The controller approves the change before the ERP and the mapping change.",who:"gate",owner:"Avery Chen",sla:"2 days",in:"Finance opinion",out:"Approved change"},
 {n:"Update the ERP and the mapping",d:"The ERP segment is created or changed and the mapping table is updated on the same day.",who:"robot",owner:"Finance systems",sla:"Same day",in:"Approved change",out:"Updated mapping"},
 {n:"Re-roll budget lines",d:"Budget lines, forecasts and actuals re-roll to the new org chart owner; owners are told.",who:"robot",owner:"Finance systems",sla:"Same day",in:"Updated mapping",out:"Re-rolled lines, audit entry"}]});
const W={};
function wire(){try{syncMetrics();
 if(window.ORGX&&ORGX.domains&&!W.dom){if(!ORGX.domains.some(d=>d.id==="costcenter")){const d={id:"costcenter",label:"Cost center master data and mapping",aliases:["cost center","cost centers","cost centre","gl segment","org mapping","chargeback mapping"],ownerId:"victor-amaya",backupId:"avery-chen"};if(ORGX.addDomain)ORGX.addDomain(d);else ORGX.domains.push(d)}tryv(()=>ORGX.bump&&ORGX.bump());W.dom=1}
 if(!W.ent&&window.ATLAS&&ATLAS.addEntity&&window.COVER&&COVER.recs){
  const fld=(k,label,type,cls,req,au,ref)=>({k,label,type,authority:au||"platform",classification:cls||"internal",req:!!req,ref});
  const add=(key,label,scr,ent,how,n,path)=>{if(!COVER.recs.some(x=>x.key===key))COVER.recs.push({key,label,scr:[scr],mod:scr,n,ent,how,path:path||key})};
  const d1={id:"cost_center",label:"Cost center",domain:"fin",source:"Budgets",ownerApp:"bud_ccmap",ownerMod:"bud_ccmap",status:"proposed",note:"The ERP is the authority for the code and GL segment; "+BRAND.name+" holds the mapping to the org chart and the budget owner.",
   fields:[fld("code","Code","string","internal",1,"external"),fld("name","Name","string","internal",0,"external"),fld("owner","Owner","ref","personal",0,"platform","person"),fld("parent","Parent","ref","internal",0,"platform","cost_center"),fld("status","Status","enum","internal",0,"platform"),fld("gl_segment","GL segment","string","internal",1,"external"),fld("org_unit","Primary org unit","ref","internal",1,"platform","organization_unit"),fld("budget_owner","Budget owner","ref","personal",1,"platform","person")],
   decision:"Extend, not new: cost_center already exists as a seed entity. Added the GL segment, the primary org unit and the budget owner so budget lines roll up to the org chart.",searched:"cost_center, organization_unit, cost_allocation, budget_line, person"};
  const d2={id:"cost_center_map",label:"Cost center mapping",domain:"fin",source:"Budgets",ownerApp:"bud_ccmap",ownerMod:"bud_ccmap",status:"proposed",note:"One row per cost center and org unit pair. Holds the translation between the ERP and the org chart, so many-to-one and unmapped cases are visible.",
   fields:[fld("cost_center","Cost center","ref","internal",1,"platform","cost_center"),fld("org_unit","Org unit","ref","internal",1,"platform","organization_unit"),fld("relation","Relation","enum","internal",1),fld("budget_owner","Budget owner","ref","personal",1,"platform","person"),fld("gl_segment","GL segment","string","internal",1,"external"),fld("share_pct","Share of the cost center","number","internal"),fld("effective_from","Effective from","date","internal"),fld("status","Mapping status","enum","internal"),fld("change_ref","Change request","ref","internal",0,"platform","approval")],
   decision:"New, thin. cost_center holds the ERP record and organization_unit holds the org chart; neither can express a many-to-many translation with a share and an effective date. Owner and unit are referenced, never copied.",searched:"cost_center, organization_unit, cost_allocation, budget_line, person, approval"};
  let r1=null,r2=null;try{r1=ATLAS.addEntity(d1)}catch(e){}try{r2=ATLAS.addEntity(d2)}catch(e){}
  if(!(r1&&r1.ok)&&window.DATAMODEL)tryv(()=>DATAMODEL.register("cost_center",{label:d1.label,source:d1.source,domain:"fin",fields:d1.fields.map(f=>({k:f.k,label:f.label,type:f.type==="string"?"string":f.type,authority:f.authority,classification:f.classification,ref:f.ref}))}));
  window.CCMAP.decisions=[{entity:"cost_center",decision:d1.decision,searched:d1.searched,warnings:(r1&&r1.warnings)||[]},{entity:"cost_center_map",decision:d2.decision,searched:d2.searched,warnings:(r2&&r2.warnings)||[]},{entity:"organization_unit",decision:"Reuse: the org chart unit is referenced by name, not copied."},{entity:"person",decision:"Reuse: budget owners are person references."}];
  add("CCMAP","Cost center mapping","bud_ccmap","cost_center_map","new",rows().length,"S.ccmap.rows");add("CCMAP_CC","Cost centers","bud_ccmap","cost_center","ext",rows().length,"S.ccmap.rows");W.ent=1}
 if(!W.mod&&W.ent&&window.MODMAP&&MODMAP.addModule&&tryv(()=>MODMAP.modules.some(m=>m.id==="bud_over")&&MODMAP.modules.some(m=>m.id==="org_chart"),false)){
  const band=tryv(()=>MODMAP.modules.find(m=>m.id==="bud_over").band,"fin");
  const r=MODMAP.addModule({id:"bud_ccmap",name:"Cost center mapping",sn:"Cost center mapping",band,own:"Victor Amaya",proposed:false,r:["cost_center","organization_unit","budget_line","person"],w:["cost_center","cost_center_map","audit_event"],
   flows:[{dir:"pull",other:"org_chart",data:"Org units, managers and headcount",entity:"organization_unit",mode:"api",trig:"Mapping opened or edited"},{dir:"pull",other:"bud_over",data:"Budget lines by cost center",entity:"budget_line",mode:"api",trig:"Coverage calculated"},
    {dir:"push",other:"bud_over",data:"Budget owner and org unit for every line",entity:"cost_center",mode:"api",trig:"Mapping saved"},{dir:"push",other:"org_chart",data:"Budget that rolls up to each unit and owner",entity:"budget_line",mode:"api",trig:"Mapping saved"},{dir:"push",other:"adm_audit",data:"Mapping change audit events",entity:"audit_event",mode:"event",trig:"Any mapping change"}]});
  if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=1}
 if(!W.proc&&W.mod&&window.PROCLIB&&PROCLIB.addProcess){const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o}),s0=PROC.defs.bud_ccmap.steps;
  const r=PROCLIB.addProcess({id:"cost_center_change",name:"Change a cost center (add, merge, split, remap)",module:"bud_ccmap",family:"fin",owner:"Victor Amaya",backup:"Avery Chen",trigger:"An org change, a new funded initiative or a gap found in the mapping",std:["tbm"],
   steps:s0.map(s=>st(s.n,s.d+(s.n==="Request the change"?" RACI: Responsible requesting owner, Accountable controller, Consulted finance, Informed budget owners.":""),s.who,s.owner,s.sla,s.in,s.out)),
   inputs:["Org chart","Cost center list from the ERP","Budget lines"],outputs:["Updated mapping","Re-rolled budget lines","Audit entry"],entities:["cost_center","cost_center_map","organization_unit","budget_line"],metrics:["m_cc_cov","m_cc_units","m_cc_one"],model:"cmmi"});
  if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=1;window.CCMAP.procWarn=r&&r.warnings}
 if(window.NAVX&&NAVX.add&&!W.nav){NAVX.add("bud_ccmap",{group:"money",label:"Cost center mapping",hint:"Which cost centers match the org chart, and where the gaps are",sub:"Budgets and funding",kw:"cost center cost centre mapping org chart gl segment owner unit translation chargeback gap coverage"});W.nav=1}
 }catch(e){console.error("ccmap wire",e)}
 if(W.mod&&W.proc&&!W.ref&&window.MODMAP&&MODMAP.refresh){W.ref=1;tryv(()=>MODMAP.refresh())}}
window.CCMAP.wire=wire;window.CCMAP.wireState=W;[500,1800,4000,8000].forEach(t=>setTimeout(wire,t));
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>[{g:"Budgets",t:"Cost center mapping",m:"Cost centers, org units, owners and GL segments",c:"--accent",f:()=>go("bud_ccmap"),k:"cost center mapping org chart gl segment gap coverage translation"}].concat(rows().map(r=>({g:"Cost centers",t:r.code+" "+r.name,m:rel(r)+(r.owner?" · "+r.owner:""),c:"--accent",f:()=>go("bud_ccmap"),k:r.code+" "+r.name+" "+r.units.join(" ")+" "+r.owner+" cost center"}))));
if(typeof ASKX!=="undefined")ASKX.push(q=>{const t=String(q||"").toLowerCase();if(/cost cent(er|re)s?.*(org|map|align|chart|gl)|(org|map|align).*cost cent(er|re)/.test(t)||/gl segment/.test(t)){const c=coverage();go("bud_ccmap");say(q,{t:"<b>"+c.pct+"%</b> of approved budget is on a fully mapped cost center. "+c.ccMapped+" of "+c.ccs+" cost centers have an org unit, owner and GL segment; "+(c.units-c.unitsCC)+" org units have no cost center.",steps:["Read the cost center mapping","Opened Cost center mapping"]});return true}return false});
})();

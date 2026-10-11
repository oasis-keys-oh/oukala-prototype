/* mod_r16m_d_guides.js (Round 16, Agent M). Process guides, level 1 to 5, generated lazily from the PROCLIB record.
   Only reviews and edits are stored (process_guide); content is regenerated from the record and cached in memory per record hash. */
(function(){
"use strict";
const W=window,R=W.R16M;if(!R)return;
const {G,H,arr,ST,X}=R;
const P=(t,c,title)=>`<span class="pill ${c||"mute"}"${title?` title="${H(title)}"`:""}>${H(t)}</span>`;
const people=n=>typeof pchip==="function"&&n&&!/@/.test(n)?pchip(n):H(n||"");
const card_=(t,s,b,r)=>typeof card==="function"?card(t,s,b,r):`<section class="card"><h3>${H(t)}</h3>${b}</section>`;
const TODAY=G(()=>FIN.TODAY,"2026-10-11");
const GD=R.guides={};
const LV=[["L1","Purpose and scope","Why the process exists, who owns it, what starts it and what it produces."],["L2","Process map","The steps in order, with who does each and the hand-offs."],["L3","Procedure","For each step: inputs, outputs, SLA, controls and decisions."],["L4","Work instructions","What the person or agent does at each step, in order, with the check that proves it."],["L5","Records and references","Records read and written, metrics, standards, related processes and exceptions."]];
const hash=s=>{let h=5381;s=String(s);for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return(h>>>0).toString(36)};
const KIND={human:"A person does this step",auto:"The system does this step",agent:"An agent prepares this step and a person confirms",gate:"A group decides at this step"};
const INSTR={human:["Open the work item and read the input.","Do the work described for the step.","Record the output and attach evidence.","Hand off to the next step."],auto:["The system runs the step when the input arrives.","Check the run log for errors.","Escalate to the owner group if the step fails twice."],agent:["The agent drafts the output from the input.","Review the draft and correct it.","Confirm the output; the confirmation is recorded."],gate:["Open the approval request.","Review the evidence and the risk.","Approve, reject or return with a reason.","The decision and approver are recorded."]};
const entName=e=>G(()=>PLAT.ent(e).label||PLAT.ent(e).name,null)||String(e).replace(/_/g," ");
const entOk=e=>!!G(()=>PLAT.ent(e),null)||!!G(()=>ATLAS.get&&ATLAS.get(e),null);
const metOk=k=>!!G(()=>METRICS.get?METRICS.get(k):(window.MET&&MET[k]),null)||!!G(()=>fchip(k),"");
const procOk=id=>!!G(()=>PROCLIB.get(id),null);
const screenOk=id=>!!id&&(G(()=>(window.SCREENS||[]).some(s=>s[0]===id),false)||G(()=>!!REGISTRY[id],false)||true);
function neighbors(p){const out={up:[],dn:[]};G(()=>{const nb=MODMAP.neighbors(p.module)||{push:[],pull:[]};nb.pull.forEach(m=>{const q=PROCLIB.primary(m);if(q&&q!==p.id)out.up.push(q)});nb.push.forEach(m=>{const q=PROCLIB.primary(m);if(q&&q!==p.id)out.dn.push(q)})});return out}
/* build the generated content and the related-object list */
GD.related=function(id){const p=PROCLIB.get(id);if(!p)return[];const r=[];
 (p.entities.w||[]).forEach(e=>r.push({t:"entity",id:e,l:entName(e),how:"writes"}));(p.entities.r||[]).filter(e=>!(p.entities.w||[]).includes(e)).forEach(e=>r.push({t:"entity",id:e,l:entName(e),how:"reads"}));
 arr(p.metrics).forEach(k=>r.push({t:"metric",id:k,l:G(()=>METRICS.get(k).n,k),how:"measured by"}));
 if(p.module)r.push({t:"module",id:p.module,l:G(()=>MODMAP.get(p.module).name,p.module),how:"module"});
 const nb=neighbors(p);nb.up.forEach(q=>r.push({t:"process",id:q,l:G(()=>PROCLIB.get(q).name,q),how:"upstream"}));nb.dn.forEach(q=>r.push({t:"process",id:q,l:G(()=>PROCLIB.get(q).name,q),how:"downstream"}));
 if(p.owner)r.push({t:"person",id:p.owner,l:p.owner,how:"owner"});if(p.backup)r.push({t:"person",id:p.backup,l:p.backup,how:"backup"});
 const own=G(()=>PROCLIB.get(id),null);G(()=>{const kb=KCSX&&KCSX.forProcess?KCSX.forProcess(id):[];arr(kb).slice(0,3).forEach(a=>r.push({t:"article",id:a.id,l:a.title||a.id,how:"article"}))});
 return r};
GD.generate=function(id){const p=PROCLIB.get(id);if(!p)return null;const steps=arr(p.stepsList);const rel=GD.related(id);
 const rec=hash(JSON.stringify([p.name,p.owner,p.backup,p.level,steps.map(s=>[s.n,s.who,s.owner,s.in,s.out,s.sla]),p.entities,p.metrics,p.trigger]));
 const L1={purpose:p.title||p.name,trigger:p.trigger,owner:p.owner,backup:p.backup||"",family:p.familyName,module:p.module,outputs:steps.length?steps[steps.length-1].out||"":"",maturity:p.level,target:p.target};
 const L2=steps.map((s,i)=>({n:i+1,step:s.n,kind:s.who||"human",owner:s.owner||p.owner,to:steps[i+1]?steps[i+1].n:"End of process"}));
 const L3=steps.map((s,i)=>({n:i+1,step:s.n,summary:s.d||"",in:s.in||"Output of the previous step",out:s.out||"Result recorded",sla:s.sla||"",kind:s.who||"human",control:(s.who==="gate"?"Approval by group; approver is not the requester":s.who==="agent"?"Human confirmation before the result is used":"Evidence attached to the work item")}));
 const L4=steps.map((s,i)=>({n:i+1,step:s.n,actions:(INSTR[s.who||"human"]||INSTR.human).slice(),check:"Done when: "+(s.out||"the result")+" is recorded"}));
 const L5={entities:rel.filter(x=>x.t==="entity"),metrics:rel.filter(x=>x.t==="metric"),standards:G(()=>arr(PROCLIB_STD&&PROCLIB_STD[id]),[]),exceptions:["Input missing or invalid: return to the previous step with a reason.","Owner unavailable: the backup owner acts, the substitution is logged.","SLA breached: escalate to the owner group at the next reminder."]};
 return{id,rec,hash:rec,L1,L2,L3,L4,L5,related:rel,steps:steps.length}};
const cache=new Map();
GD.get=function(id){const p=PROCLIB.get(id);if(!p)return null;let g=cache.get(id);if(!g){g=GD.generate(id);cache.set(id,g)}return g};
GD.clearCache=()=>cache.clear();
/* stored review state and edits */
const rowOf=id=>ST.get("process_guide","PG-"+id);
GD.state=function(id){const r=rowOf(id);const g=GD.get(id);if(!r)return{status:"Generated from record",reviewer:"",reviewed_at:"",edits:{},stale:false,stored:false};
 const edits=(()=>{try{return JSON.parse(r.edits||"{}")}catch(e){return{}}})();const stale=r.record_hash&&g&&r.record_hash!==g.rec;
 return{status:stale&&(r.status==="Reviewed"||r.status==="Edited"||r.status==="Under review")?"Out of date":r.status,reviewer:r.reviewer||"",reviewed_at:r.reviewed_at||"",edits,stale,stored:true}};
GD.reviewerFor=id=>{const p=PROCLIB.get(id);const fam=p&&p.family;return (p&&p.owner&&!/^\W*$/.test(p.owner)&&G(()=>R.groups.every(g=>g.n!==p.owner),true)?p.owner:"Maya Ortiz")};
function save(id,patch){const g=GD.get(id);const prev=rowOf(id);const links=g.related.length;const gaps=GD.check(id).gaps.length;
 ST.put("process_guide",Object.assign({id:"PG-"+id,process:id,status:"Generated from record",reviewer:GD.reviewerFor(id),record_hash:g.rec,generated_at:TODAY,edits:"{}"},prev||{},patch,{link_gaps:gaps,links}));R.syncMetrics()}
/* both-way link checks */
GD.check=function(id){const g=GD.get(id),gaps=[];if(!g)return{gaps:[{kind:"process",msg:"Process not found"}],ok:0,total:0};let ok=0,total=0;
 g.related.forEach(x=>{total++;const good=x.t==="entity"?entOk(x.id):x.t==="metric"?metOk(x.id):x.t==="process"?procOk(x.id):true;if(good)ok++;else gaps.push({kind:x.t,id:x.id,msg:x.t+" "+x.l+" is referenced but not found"})});
 total++;if(g.related.some(x=>x.t==="entity"))ok++;else gaps.push({kind:"entity",id:"",msg:"No record type is linked"});
 total++;if(g.related.some(x=>x.t==="metric"))ok++;else gaps.push({kind:"metric",id:"",msg:"No metric measures this process"});
 total++;if(g.related.some(x=>x.t==="module"))ok++;else gaps.push({kind:"module",id:"",msg:"Process is not placed on the module map"});
 total++;if(g.related.some(x=>x.t==="process"))ok++;else gaps.push({kind:"process",id:"",msg:"No upstream or downstream process is linked"});
 total++;if(g.related.some(x=>x.t==="person"&&x.how==="backup"))ok++;else gaps.push({kind:"person",id:"",msg:"No named backup owner"});
 return{gaps,ok,total}};
/* reverse links: which guides mention an object */
GD.guidesFor=function(type,oid){const res=[];G(()=>PROCLIB.list()).forEach(p=>{const g=cache.get(p.id);if(g&&g.related.some(x=>x.t===type&&x.id===oid))res.push(p.id)});return res};
/* viewer HTML */
function section(id,lv,g,st){const k="L"+lv;const ed=st.edits[k];const body=(()=>{switch(lv){
 case 1:return`<dl class="r16m-dl"><dt>Purpose</dt><dd>${H(g.L1.purpose)}</dd><dt>Starts when</dt><dd>${H(g.L1.trigger)}</dd><dt>Owner</dt><dd>${people(g.L1.owner)} ${g.L1.backup?`, backup ${people(g.L1.backup)}`:`<span class="muted">no backup named</span>`}</dd><dt>Family</dt><dd>${H(g.L1.family)}</dd><dt>Produces</dt><dd>${H(g.L1.outputs||"Recorded result")}</dd><dt>Maturity</dt><dd>Level ${H(g.L1.maturity)} now, target ${H(g.L1.target)}</dd></dl>`;
 case 2:return`<div class="tscroll"><table class="r16m-t"><thead><tr><th>#</th><th>Step</th><th>Kind</th><th>Group or role</th><th>Hands off to</th></tr></thead><tbody>${g.L2.map(s=>`<tr><td>${s.n}</td><td><b>${H(s.step)}</b></td><td>${P(s.kind,s.kind==="gate"?"warn":"mute")}</td><td>${H(s.owner)}</td><td>${H(s.to)}</td></tr>`).join("")}</tbody></table></div>`;
 case 3:return`<div class="tscroll"><table class="r16m-t"><thead><tr><th>#</th><th>Step</th><th>Input</th><th>Output</th><th>SLA</th><th>Control</th></tr></thead><tbody>${g.L3.map(s=>`<tr><td>${s.n}</td><td><b>${H(s.step)}</b><div class="small muted">${H(s.summary)}</div></td><td class="small">${H(s.in)}</td><td class="small">${H(s.out)}</td><td class="small">${H(s.sla||"none")}</td><td class="small">${H(s.control)}</td></tr>`).join("")}</tbody></table></div>`;
 case 4:return g.L4.map(s=>`<div class="r16m-wi"><b>${s.n}. ${H(s.step)}</b><ol>${s.actions.map(a=>`<li>${H(a)}</li>`).join("")}</ol><div class="small muted">${H(s.check)}</div></div>`).join("");
 case 5:return`<div class="r16m-lnk">${g.related.map(x=>`<button class="btn quiet" ${x.t==="metric"?`data-link="metric:${H(x.id)}"`:x.t==="person"?`data-link="person:${H(x.id)}"`:`data-link="${H(x.t)}:${H(x.id)}"`}>${H(x.l)} <small class="muted">${H(x.how)}</small></button>`).join("")||'<span class="muted">No links</span>'}</div><h5 style="margin:12px 0 4px">Exceptions</h5><ul>${g.L5.exceptions.map(e=>`<li>${H(e)}</li>`).join("")}</ul>`}})();
 return `<section class="r16m-sec" data-guide-sec="${k}"><div class="row sp"><h4>${LV[lv-1][0]} ${LV[lv-1][1]}</h4><button class="btn quiet" data-r16m-gedit="${H(id)}|${k}">${ed?"Edit note":"Add a note"}</button></div><p class="small muted">${H(LV[lv-1][2])}</p>${body}${ed?`<div class="r16m-note" style="margin-top:8px"><b>Reviewer note</b><div>${H(ed)}</div></div>`:""}</section>`}
GD.html=function(id){const g=GD.get(id);if(!g)return`<div class="muted">No process ${H(id)}</div>`;const st=GD.state(id);const ck=GD.check(id);const p=PROCLIB.get(id);const rev=st.reviewer||GD.reviewerFor(id);
 return `<div class="r16m-stack"><div class="eyebrow">Process guide · Levels 1 to 5</div><h2 style="margin:0">${H(p.name)}</h2><div class="row" style="gap:8px;flex-wrap:wrap">${P(st.status,st.status==="Reviewed"?"good":st.status==="Out of date"?"bad":st.status==="Generated from record"?"info":"warn")}${P("Reviewer: "+rev)}${st.reviewed_at?P("Reviewed "+st.reviewed_at):""}${P(ck.gaps.length?ck.gaps.length+" link gaps":"All links resolve",ck.gaps.length?"warn":"good")}<button class="btn quiet" data-link="process:${H(id)}">Open the process</button></div>
 ${st.stale?`<div class="r16m-note warn">The process record changed after the last review. Regenerate and review again.</div>`:""}
 <p class="small muted">Generated from the process record. Content is rebuilt from the record each time; your notes and review state are kept.</p>
 ${[1,2,3,4,5].map(n=>section(id,n,g,st)).join("")}
 ${ck.gaps.length?`<section class="r16m-sec"><h4>Link gaps</h4>${ck.gaps.map(x=>`<div class="r16m-gr"><span class="r16m-sev warn">gap</span><span>${H(x.msg)}</span></div>`).join("")}</section>`:""}
 <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-r16m-greview="${H(id)}">Mark as reviewed</button><button class="btn" data-r16m-gsub="${H(id)}">Send for review</button><button class="btn" data-r16m-gregen="${H(id)}">Regenerate from record</button></div></div>`};
GD.open=function(id){const g=GD.get(id);if(!g){toast("Process not found","warn");return}if(!rowOf(id))save(id,{});openDrawer(GD.html(id))};
/* inject a guide strip into process drawers */
function strip(){document.querySelectorAll("[data-pl-page]").forEach(pg=>{if(pg.querySelector("[data-r16m-gstrip]"))return;const id=pg.dataset.plPage;const h=pg.querySelector("h2");if(!h)return;const st=GD.state(id);h.insertAdjacentHTML("afterend",`<div class="row" data-r16m-gstrip style="gap:8px;margin:6px 0"><button class="btn quiet" data-r16m-gopen="${H(id)}">Process guide (levels 1 to 5)</button>${P(st.status,st.status==="Reviewed"?"good":"info")}</div>`)})}
try{new MutationObserver(()=>{clearTimeout(strip._t);strip._t=setTimeout(strip,80)}).observe(document.body,{childList:true,subtree:true})}catch(e){}
/* screen */
function rowsAll(){return G(()=>PROCLIB.list(),[]).map(p=>{const r=ST.get("process_guide","PG-"+p.id);const g=cache.get(p.id);const stale=r&&g&&r.record_hash&&r.record_hash!==g.rec;const status=r?(stale&&r.status!=="Generated from record"?"Out of date":r.status):"Not generated";return{id:p.id,name:p.name,family:p.familyName,module:p.module||"",owner:p.owner,status,reviewer:r?r.reviewer:"",gaps:r&&r.link_gaps!=null?r.link_gaps:"",links:r&&r.links!=null?r.links:"",steps:p.steps}})}
const FAC=["status","family"];
function listTab(){const rows=rowsAll();const cnt=s=>rows.filter(r=>r.status===s).length;
 const kp=typeof kpiRow==="function"?kpiRow([["Processes",String(rows.length),"each has a guide",{keep:true}],["Generated",String(rows.length-cnt("Not generated")),"on first open or in bulk",{keep:true}],["Reviewed",String(cnt("Reviewed")),"by a named reviewer",{metric:"m_r16m_guide_cov",keep:true}],["Under review or edited",String(cnt("Under review")+cnt("Edited")),"",{keep:true}],["Out of date",String(cnt("Out of date")),"record changed",{cls:cnt("Out of date")?"warn":"",keep:true}]]):"";
 return `<div class="r16m-stack">${kp}${card_("Process guides","Open a guide to generate it. Each guide runs from purpose to work instructions and links to every related object.",btHTML({id:"r16m_guides",h:420,rowH:44,key:"id",exportName:"process-guides",facets:FAC,cols:[{k:"name",label:"Process",wrap:1,fmt:r=>`<b>${H(r.name)}</b><div class="small muted">${H(r.id)}</div>`,val:r=>r.name},{k:"family",label:"Family"},{k:"status",label:"Guide status",fmt:r=>P(r.status,r.status==="Reviewed"?"good":r.status==="Out of date"?"bad":r.status==="Not generated"?"mute":"info")},{k:"reviewer",label:"Reviewer",fmt:r=>r.reviewer?people(r.reviewer):""},{k:"owner",label:"Process owner",fmt:r=>people(r.owner)},{k:"steps",label:"Steps",cls:"num"},{k:"links",label:"Links",cls:"num"},{k:"gaps",label:"Gaps",cls:"num"}],rows,open:id=>GD.open(id)}),`<button class="btn" data-r16m-gbulk>Generate the next 25</button>`)}</div>`}
function checkTab(){const rows=rowsAll().filter(r=>r.status!=="Not generated");const all=rows.map(r=>({r,c:GD.check(r.id)}));const gaps=[];all.forEach(x=>x.c.gaps.forEach(g=>gaps.push({pid:x.r.id,pname:x.r.name,kind:g.kind,msg:g.msg})));
 return `<div class="r16m-stack">${card_("Link checker","Checks that every record type, metric, module, process and person a guide mentions exists, and that each guide has the minimum links. Only generated guides are checked.",`<div class="row" style="gap:8px;margin-bottom:12px"><button class="btn primary" data-r16m-gcheck>Check all generated guides</button><span class="small muted">${rows.length} guides checked, ${gaps.length} gaps</span></div>${gaps.length?btHTML({id:"r16m_gaps",h:340,rowH:44,key:"k",exportName:"guide-link-gaps",facets:["kind"],cols:[{k:"pname",label:"Process",fmt:r=>`<b>${H(r.pname)}</b>`},{k:"kind",label:"Missing"},{k:"msg",label:"Gap",wrap:1}],rows:gaps.map((g,i)=>Object.assign({k:g.pid+i},g)),open:k=>{const g=gaps.find((x,i)=>x.pid+i===k);if(g)GD.open(g.pid)}}):`<div class="r16m-note ok">${rows.length?"No gaps in the generated guides.":"Generate guides first, then check."}</div>`}`)}
 ${card_("Why links matter","A reader moves from a guide to the record type, the metric, the module and the neighboring processes, and back. The strip at the top of every process page opens its guide.",`<p class="small muted">Both-way links: a process page shows its guide; a guide links each object; an object page lists the guides that mention it once those guides are generated.</p>`)}</div>`}
function levelsTab(){return `<div class="r16m-stack">${card_("What each level contains","Structured content generated from the process record. Free text is limited to reviewer notes.",`<div class="tscroll"><table class="r16m-t"><thead><tr><th>Level</th><th>Name</th><th>Contents</th><th>Source in the record</th></tr></thead><tbody>${LV.map((l,i)=>`<tr><td><b>${l[0]}</b></td><td>${l[1]}</td><td class="small">${l[2]}</td><td class="small">${["Title, trigger, owner, family, maturity","Steps, kinds, owner groups","Step inputs, outputs, SLA, controls","Step kind templates","Entities, metrics, links, exceptions"][i]}</td></tr>`).join("")}</tbody></table></div>`)}
 ${card_("Review states","",`<div class="row" style="gap:8px;flex-wrap:wrap">${["Generated from record","Edited","Under review","Reviewed","Out of date"].map(s=>P(s,s==="Reviewed"?"good":s==="Out of date"?"bad":"info")).join("")}</div><p class="small muted" style="margin-top:8px">A reviewed guide becomes out of date when its process record changes. A named reviewer is set from the process owner or the knowledge steward.</p>`)}</div>`}
REG("r16m_guides","Process guides","platform","M5 4h11l3 3v13H5zM8 10h8M8 14h8M8 18h5",()=>{
 if(!R.ensure())return R.waitScreen();R.syncMetrics();const rows=rowsAll();const rev=rows.filter(r=>r.status==="Reviewed").length;
 return `<div class="screen">${hero("Platform · Knowledge","A guide for every process, from purpose to work instructions",`${rows.length} processes, ${rows.filter(r=>r.status!=="Not generated").length} guides generated, ${rev} reviewed. Guides are rebuilt from the process record and link to every related object.`,`<div class="row" style="gap:8px;flex-wrap:wrap">${typeof fchip==="function"?fchip("m_r16m_guide_cov"):""}<button class="btn" data-go="plat_proc">Process library</button></div>`)}${typeof lensNote==="function"?lensNote():""}
 ${views("r16m_guides",["Guides","Link checker","Levels and states"],[listTab(),checkTab(),levelsTab()])}${typeof procCard==="function"?procCard("r16m_guides"):""}</div>`});
/* actions */
document.addEventListener("click",e=>{const c=e.target.closest("[data-r16m-gopen],[data-r16m-gbulk],[data-r16m-gcheck],[data-r16m-greview],[data-r16m-gsub],[data-r16m-gregen],[data-r16m-gedit]");if(!c)return;const d=c.dataset;
 if(d.r16mGopen){GD.open(d.r16mGopen);return}
 if(d.r16mGbulk!==undefined){const todo=rowsAll().filter(r=>r.status==="Not generated").slice(0,25);todo.forEach(r=>{GD.get(r.id);if(!rowOf(r.id))save(r.id,{})});toast(todo.length+" guides generated from the records","good");render();return}
 if(d.r16mGcheck!==undefined){let n=0;rowsAll().filter(r=>r.status!=="Not generated").forEach(r=>{const ck=GD.check(r.id);save(r.id,{});n+=ck.gaps.length});toast("Checked; "+n+" gaps","info");render();return}
 if(d.r16mGreview){const id=d.r16mGreview,me=R.me(),rv=GD.state(id).reviewer||GD.reviewerFor(id);if(me!==rv&&me!=="Casey Rowan"){toast("Only the named reviewer ("+rv+") can mark this reviewed","warn");return}
   save(id,{status:"Reviewed",reviewer:rv,reviewed_at:TODAY,record_hash:GD.get(id).rec});R.ev("knowledge.guide_reviewed",{process:id,reviewer:rv},[{name:"process",type:"ref",ref:"process"},{name:"reviewer",type:"ref",ref:"person"}]);toast("Marked as reviewed","good");render();openDrawer(GD.html(id));return}
 if(d.r16mGsub){save(d.r16mGsub,{status:"Under review"});toast("Sent to "+GD.reviewerFor(d.r16mGsub),"good");render();openDrawer(GD.html(d.r16mGsub));return}
 if(d.r16mGregen){cache.delete(d.r16mGregen);GD.get(d.r16mGregen);save(d.r16mGregen,{status:"Generated from record",reviewed_at:"",record_hash:GD.get(d.r16mGregen).rec});toast("Regenerated from the record","good");openDrawer(GD.html(d.r16mGregen));return}
 if(d.r16mGedit){const [id,k]=d.r16mGedit.split("|");const st=GD.state(id);const v=window.prompt?window.prompt("Note for "+k,st.edits[k]||""):null;if(v==null)return;const ed=Object.assign({},st.edits);if(v)ed[k]=v;else delete ed[k];save(id,{edits:JSON.stringify(ed),status:"Edited",record_hash:GD.get(id).rec});openDrawer(GD.html(id))}});
G(()=>NAVX.add("r16m_guides",{group:"plat",label:"Process guides",hint:"Levels 1 to 5 guide for every process, linked to records, metrics and neighbors",sub:"Generated, reviewed, link-checked",kw:"process guide level 1 2 3 4 5 procedure work instruction knowledge base sop documentation reviewer link checker"}));
if(W.SEARCHX)SEARCHX.push(()=>[{g:"Platform",t:"Process guides",m:"Level 1 to 5 guides",c:"--accent",f:()=>go("r16m_guides"),k:"process guide level work instruction knowledge"}]);
if(W.ASKX)ASKX.push(q=>{const l=String(q||"").toLowerCase();if(/(process guide|level 1|work instruction|l1 to l5|documentation for (each|every) process)/.test(l)){go("r16m_guides");say(q,{t:"Every process has a level 1 to 5 guide generated from its record: purpose, map, procedure, work instructions, and linked records. Guides carry a named reviewer and a link checker lists gaps.",steps:["Opened Process guides"]});return true}return false});
})();

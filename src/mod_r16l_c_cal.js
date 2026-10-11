/* mod_r16l_c_cal.js (Round 16, Agent L). Resilience screen part 2: Exercise calendar (bc_cal).
   Schedules exercises inside approved change windows, reads freezes, open changes and maintenance windows from the change module,
   creates the change record through ITSMX.createChange, records results (RTO and RPO achieved vs target) and raises findings in the
   GRC register (window.GRCX). */
(function(){
"use strict";
const BX=window.BCX;if(!BX||!BX.h)return;
const h=BX.h,H=h.H,G=h.G,pill=h.pill,ME=h.ME,nm=h.nm;
const arr=x=>Array.isArray(x)?x:[];
const D=BX.D,UI=BX.ui,days=BX.days,date=BX.date,mins=BX.mins,TODAY=BX.TODAY;
UI.calM=UI.calM||TODAY.slice(0,7);UI.calF=UI.calF||"all";
const MONN=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const exTitle=e=>e.title||((BX.app(BX.exApp(e))||{}).n||(BX.plan(e.planId)||{}).n||e.id);

/* next clear date for an application and exercise type */
function suggest(appId,type,after){const a=BX.app(appId);if(!a)return null;const wins=type==="live"?a.pol.wins.filter(w=>(BX.winOf(w)||{}).live):["CW-C"];
 const start=Math.max(type==="live"?a.pol.notice:3,after||0);
 for(let n=start;n<260;n++){const d=BX.addD(TODAY,n);for(const w of wins){const x={app:appId,type,date:d,win:w,id:"_s"};const c=BX.conflicts(x);if(!c.some(k=>k[0]==="bad"||k[0]==="warn"))return{date:d,win:w}}}return null}
BX.suggest=suggest;

/* ------------------------------------------------------------------ change record ------------------------------------------------------------------ */
BX.raiseChange=function(id){const e=BX.ex(id);if(!e)return false;if(e.chg){toast(e.chg+" already exists for "+e.id,"info");return false}
 const a=BX.app(BX.exApp(e));const w=BX.winOf(e.win)||BX.winOf("CW-B");const sop=D().sops.find(s=>s.plan===e.planId);
 const cis=(arr(e.cis).length?e.cis:BX.ciSet(a.id).filter(s=>s.via==="direct").map(s=>s.id)).map(i=>(BX.ci(i)||{}).name).filter(Boolean);
 if(!window.ITSMX||!ITSMX.createChange){toast("The change module is not available","warn");return false}
 const r=ITSMX.createChange({title:"Resilience exercise "+e.id+": "+exTitle(e),svc:a.svc?a.n:undefined,cis,type:"Normal",start:e.date,end:e.date,win:w.n+": "+w.from+" to "+w.to,
  just:"Required by the "+a.pol.n+" policy ("+BX.TYPEN[a.pol.type]+" every "+a.pol.months+" months). Scenario: "+e.scn,impl:sop?sop.steps.map((s,i)=>(i+1)+". "+s[0]+": "+s[1]).join("\n"):"Follow the recovery workflow of plan "+e.planId+".",
  back:"Fail back to the primary site. Stop the exercise and fail back if "+mins(a.rtoT*1.5)+" elapse without recovery.",test:"Smoke tests in the recovery plan; RTO and RPO are measured.",own:e.fac,source:"Resilience exercise "+e.id,grp:"Ops team"});
 if(!r.ok){toast(r.error||"Could not create the change","warn");return false}
 e.chg=r.id;h.ev("bcdr.change_requested","Exercise change record created",{record:e.id,actor:ME(),detail:r.id});h.done("Created change record for exercise",e.id+" "+r.id);toast("Change "+r.id+" created through the change module. It follows the normal approval path.","good");return r.id};

/* ------------------------------------------------------------------ findings in the GRC register ------------------------------------------------------------------ */
function raiseFinding(e,t,sev,desc){const X=window.GRCX;if(!X||!X.findings)return"";const a=BX.app(BX.exApp(e))||{own:"Sam Patel",bak:"Tom Becker"};
 const n=X.findings.reduce((m,f)=>{const r=/^FND-(\d+)$/.exec(f.id);return r?Math.max(m,+r[1]):m},100)+1;const id="FND-"+n;
 const f={id,t,src:"Self-identified",sref:e.id,sev,own:a.own,bak:a.bak,due:BX.addD(TODAY,sev==="High"?30:60),st:"Open",ctl:"GC-203",risk:"GR-111",vend:"",steps:[{n:"Agree the fix and owner",own:a.own,due:BX.addD(TODAY,14),done:false},{n:"Apply the fix and re-test in the next window",own:a.bak,due:BX.addD(TODAY,sev==="High"?30:60),done:false}],opened:TODAY,debt:"",desc:desc||""};
 if(sev==="High"||sev==="Critical")f.debt=G(()=>{const r=DEBT.add({type:"bypass",title:"Finding "+id+": "+t,sev,owner:a.own,source:"manual",steward:"Compliance lead",principal:6,fix:"Close finding "+id});return typeof r==="string"?r:(r&&r.id)||"yes"},"yes");
 X.findings.unshift(f);G(()=>X.put("finding",f));h.ev("bcdr.finding_raised","Resilience finding raised",{record:id,actor:ME(),detail:t});return id}

/* ------------------------------------------------------------------ forms ------------------------------------------------------------------ */
function schedForm(pre){pre=pre||{};const apps=BX.apps().slice().sort((a,b)=>a.tier-b.tier);const a0=BX.app(pre.app)||apps[0];const o0=BX.obligation(a0.id);const sg=suggest(a0.id,o0.type);
 openForm({id:"bc_sched",title:"Schedule an exercise",story:"The exercise is checked live against approved change windows, freezes, open changes and other exercises. A live failover also creates a change record through the change module.",submit:"Schedule exercise",
  fields:[{k:"app",label:"Application",type:"select",opts:apps.map(a=>[a.id,a.n+" ("+BX.tierLabel(a.tier)+")"]),req:true},{k:"type",label:"Exercise type",type:"chips",opts:[["live","Live failover"],["tabletop","Tabletop"],["review","Documented review"]]},{k:"date",label:"Date",type:"date",req:true},{k:"win",label:"Approved window",type:"select",opts:D().wins.map(w=>[w.id,w.n+" ("+w.dows.map(i=>DOWN[i]).join(", ")+" "+w.from+" to "+w.to+")"])},{k:"fac",label:"Facilitator",type:"people",req:true},{k:"fbak",label:"Backup facilitator",type:"people",req:true},{k:"scn",label:"Scenario and objectives",type:"longtext",wide:true,req:true}],
  defaults:Object.assign({app:a0.id,type:o0.type,date:sg?sg.date:BX.addD(TODAY,30),win:sg?sg.win:"CW-B",fac:a0.own,fbak:a0.bak,scn:"Recover "+a0.n+" to the objectives in the "+a0.pol.n+" policy."},pre),
  live:v=>{const a=BX.app(v.app);if(!a)return"";const o=BX.obligation(a.id);const c=BX.conflicts({app:v.app,type:v.type,date:v.date,win:v.win,id:"_new"});const s2=c.some(k=>k[0]==="bad")?suggest(a.id,v.type):null;
   return `<div class="story"><b>${H(a.n)}</b> is ${H(BX.tierLabel(a.tier))}: ${H(o.typeName.toLowerCase())} due ${H(date(o.due))} (${H(o.status.toLowerCase())}). Targets: RTO ${H(mins(a.rtoT))}, RPO ${H(mins(a.rpoT))}.</div>${v.type!==o.type?`<div class="bc-warn warn"><b>Policy asks for ${H(o.typeName.toLowerCase())}</b>; ${H(v.type)} will not clear the obligation.</div>`:""}${c.map(k=>`<div class="bc-warn ${k[0]}">${H(k[1])}</div>`).join("")||'<div class="bc-warn good">No conflicts: inside an approved window, no freeze, no open change on the same CI.</div>'}${s2?`<div class="bc-warn info">Next clear date: <b>${H(date(s2.date))}</b> in ${H((BX.winOf(s2.win)||{}).n)}.</div>`:""}`},
  onSubmit:v=>{const c=BX.conflicts({app:v.app,type:v.type,date:v.date,win:v.win,id:"_new"});if(c.some(k=>k[0]==="bad")){toast("Resolve the blocking conflict or choose another date","warn");return}
   if(nm(v.fac)===nm(v.fbak)){toast("The backup facilitator must be a different person","warn");return}
   const a=BX.app(v.app);const pl=BX.planOf(v.app);const mx=D().ex.reduce((m,x)=>{const r=/^EX-\d{4}-(\d+)$/.exec(x.id);return r?Math.max(m,+r[1]):m},0);const id="EX-"+TODAY.slice(0,4)+"-"+String(mx+1).padStart(3,"0");
   const e={id,planId:pl?pl.id:"",app:v.app,type:v.type,title:"",date:v.date,win:v.type==="live"?v.win:(v.win||"CW-C"),status:"Planned",chg:"",fac:nm(v.fac),fbak:nm(v.fbak),grp:a.pol.grp,parts:[],cis:[],scn:v.scn,res:null,notes:""};
   D().ex.push(e);h.ev("bcdr.exercise_scheduled","Exercise scheduled",{record:id,actor:ME(),detail:a.n+" "+v.type+" "+v.date});
   h.notify([e.fac,e.fbak].concat(BX.groupMembers(e.grp)),"Exercise "+id+" scheduled for "+date(e.date),id,"bcdr.exercise_scheduled");
   let ch="";if(v.type==="live")ch=BX.raiseChange(id)||"";h.done("Scheduled exercise",id+" "+a.n);toast(id+" scheduled"+(ch?" with change "+ch:""),"good");closeDrawer()}})}
BX.schedForm=schedForm;

function completeForm(id){const e=BX.ex(id);if(!e)return;const a=BX.app(BX.exApp(e))||{rtoT:0,rpoT:0,n:"",own:"Sam Patel"};
 openForm({id:"bc_done",title:"Record the result of "+e.id,story:"Enter the recovery time and data loss you measured. A missed target raises a finding in Issues and findings automatically, owned by the application owner.",submit:"Record result",
  fields:[{k:"on",label:"Completed on",type:"date",req:true},{k:"rtoA",label:"Recovery time achieved (minutes)",type:"number",req:true,help:"Target "+mins(a.rtoT)},{k:"rpoA",label:"Data loss, recovery point achieved (minutes)",type:"number",req:true,help:"Target "+mins(a.rpoT)},{k:"est",label:"This was an estimate from a tabletop",type:"toggle"},{k:"lessons",label:"What did we learn?",type:"longtext",wide:true},{k:"extra",label:"Another finding to raise (optional)",type:"text",wide:true,ph:"For example: runbook step 4 names a retired server"},{k:"sev",label:"Severity of that finding",type:"chips",opts:["High","Medium","Low"]}],
  defaults:{on:e.date<=TODAY?e.date:TODAY,rtoA:Math.round(a.rtoT*0.9),rpoA:Math.round(a.rpoT*0.8),est:e.type!=="live",sev:"Medium"},
  live:v=>{const mr=+v.rtoA>a.rtoT,mp=+v.rpoA>a.rpoT;return `<div class="bc-warn ${mr?"bad":"good"}">Recovery time ${H(mins(+v.rtoA))} against ${H(mins(a.rtoT))}: <b>${mr?"missed by "+H(mins(+v.rtoA-a.rtoT)):"met"}</b></div><div class="bc-warn ${mp?"bad":"good"}">Recovery point ${H(mins(+v.rpoA))} against ${H(mins(a.rpoT))}: <b>${mp?"missed":"met"}</b></div>${mr||mp?'<p class="story">A finding will be logged and a re-test will be required within the tier\'s re-test period.</p>':""}`},
  onSubmit:v=>{const mr=+v.rtoA>a.rtoT,mp=+v.rpoA>a.rpoT;const f=[];
   e.res={rtoA:+v.rtoA,rpoA:+v.rpoA,est:!!v.est,findings:[],lessons:v.lessons||"",doneOn:v.on};e.status="Completed";e.date=v.on;
   if(mr)e.res.findings.push(raiseFinding(e,a.n+" "+e.type+" recovery took "+mins(+v.rtoA)+" against a "+mins(a.rtoT)+" target","High","Measured in "+e.id+". "+(v.lessons||"")));
   else if(mp)e.res.findings.push(raiseFinding(e,a.n+" lost "+mins(+v.rpoA)+" of data against a "+mins(a.rpoT)+" recovery point","High","Measured in "+e.id+"."));
   if(v.extra)e.res.findings.push(raiseFinding(e,v.extra,v.sev||"Medium","Raised after "+e.id+"."));
   e.res.findings=e.res.findings.filter(Boolean);e.review={grp:e.grp,st:"Pending review"};
   h.ev("bcdr.exercise_completed","Exercise completed",{record:e.id,actor:ME(),detail:(mr||mp?"targets missed":"targets met")});
   h.notify(BX.groupMembers(e.grp),e.id+" completed: "+(mr||mp?"targets missed":"targets met")+". Review is pending with "+BX.groupName(e.grp),e.id,"bcdr.exercise_completed");
   h.done("Recorded exercise result",e.id+" RTO "+v.rtoA+" RPO "+v.rpoA);toast(e.id+" completed"+(e.res.findings.length?"; "+e.res.findings.join(", ")+" logged":""),mr||mp?"warn":"good");closeDrawer()}})}
BX.completeForm=completeForm;
BX.startEx=id=>{const e=BX.ex(id);if(!e||e.status!=="Planned")return false;e.status="In progress";h.ev("bcdr.exercise_started","Exercise started",{record:id,actor:ME(),detail:exTitle(e)});h.done("Started exercise",id);toast(id+" is in progress","info");return true};
BX.cancelEx=id=>{const e=BX.ex(id);if(!e||e.status==="Completed")return false;e.status="Cancelled";h.done("Cancelled exercise",id);toast(id+" cancelled","info");return true};
BX.reviewEx=id=>{const e=BX.ex(id);if(!e)return false;e.review={grp:e.grp,st:"Reviewed",by:ME(),on:TODAY};h.ev("bcdr.exercise_reviewed","Exercise reviewed",{record:id,actor:ME(),detail:BX.groupName(e.grp)});h.done("Reviewed exercise results",id);toast(id+" reviewed by "+BX.groupName(e.grp),"good");return true};
BX.moveEx=(id,d)=>{const e=BX.ex(id);if(!e)return false;e.date=d;h.done("Rescheduled exercise",id+" to "+d);return true};

/* ------------------------------------------------------------------ the screen ------------------------------------------------------------------ */
const tone=e=>e.status==="Completed"?"done":e.status==="In progress"?"prog":e.status==="Cancelled"?"x":"plan";
function monthGrid(){const [y,m]=UI.calM.split("-").map(Number);const first=new Date(y,m-1,1);const start=new Date(y,m-1,1-first.getDay());const exs=BX.exs().filter(e=>e.status!=="Cancelled");const fz=BX.freezes();let cells="";
 for(let i=0;i<42;i++){const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);const s=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");const cur=d.getMonth()===m-1;const f=fz.find(x=>s>=x.from&&s<=x.to);const es=exs.filter(e=>e.date===s);
  cells+=`<div class="bc-day${cur?"":" off"}${s===TODAY?" td":""}${f?" frz "+f.kind:""}${[0,6].includes(d.getDay())?" we":""}" title="${H(f?f.kind+" freeze: "+f.n:"")}"><span class="bc-dn">${d.getDate()}</span>${f&&cur?`<span class="bc-fz">${H(f.kind)}</span>`:""}${es.slice(0,3).map(e=>{const c=BX.conflictsOf(e).some(x=>x[0]==="bad");return `<button class="bc-ev ${tone(e)}${c?" bad":""}" data-rsh-open="${H(e.id)}" title="${H(e.id+" "+exTitle(e)+" · "+BX.TYPEN[e.type]+(c?" · conflict":""))}" aria-label="${H(e.id)}"><span class="bc-evt">${c?"! ":""}${H((BX.app(BX.exApp(e))||{n:exTitle(e)}).n.slice(0,16))}</span></button>`}).join("")}${es.length>3?`<span class="small muted">+${es.length-3} more</span>`:""}</div>`}
 const prev=new Date(y,m-2,1),next=new Date(y,m,1);const ym=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
 return `<div class="row sp"><div class="row"><button class="btn" data-bc-cal="${ym(prev)}" aria-label="Previous month">‹</button><b class="bc-mn">${MONN[m-1]} ${y}</b><button class="btn" data-bc-cal="${ym(next)}" aria-label="Next month">›</button><button class="btn quiet" data-bc-cal="${TODAY.slice(0,7)}">Today</button></div><button class="btn primary" data-bc-act="sched">Schedule an exercise</button></div>
 <div class="bc-cal"><div class="bc-dh">${DOWN.map(x=>`<span>${x}</span>`).join("")}</div><div class="bc-grid">${cells}</div></div>${legend([["Planned","--info-f"],["In progress","--warn-f"],["Completed","--good"],["Conflict with a blackout, window or change","--bad"],["Blackout or restricted period (from the change module)","--bad-f"]])}`}

function windowsPane(){const w=D().wins,fz=BX.freezes();const mw=arr(G(()=>S.obs.wins,[]));const chg=BX.openChanges().filter(c=>c.start>=TODAY).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,10);
 const used=[...new Set(arr(G(()=>ITSMX.changes,[])).map(c=>c.win).filter(Boolean))];
 return `<div class="bc-two">${card("Approved change windows","Live exercises may only start inside these windows. They match the window values on change records, listed below the table.",h.tbl([{h:"Window",f:x=>`<b>${H(x.n)}</b><br><span class="small muted">${H(x.src)}</span>`},{h:"Days",f:x=>x.dows.map(i=>DOWN[i]).join(", ")},{h:"Hours",f:x=>x.from+" to "+x.to},{h:"Live failover",f:x=>x.live?pill("Allowed","good"):pill("Not allowed","mute")},{h:"Tiers",f:x=>D().tiers.filter(t=>t.wins.includes(x.id)).map(t=>"T"+t.t).join(" ")}],w)+`<p class="small muted">Window values in use on change records: ${used.map(H).join("; ")||"none"}.</p>`)}
  ${card("Freeze and blackout periods","Read from the change module. A blackout blocks live exercises; a restricted period allows Standard changes only, so a live failover (a Normal change) is flagged.",h.tbl([{h:"Period",f:x=>`<b>${H(x.n)}</b><br><span class="small muted">${H(x.why)}</span>`},{h:"Kind",f:x=>pill(x.kind,x.kind==="Blackout"?"bad":"warn")},{h:"From",f:x=>date(x.from)},{h:"To",f:x=>date(x.to)},{h:"Exercises inside",f:x=>{const n=BX.exs().filter(e=>e.status!=="Completed"&&e.status!=="Cancelled"&&e.date>=x.from&&e.date<=x.to);return n.length?n.map(e=>h.lk(e.id,e.id)).join(" "):"-"}}],fz)+`<button class="btn" data-bc-go="itsm_chg">Open Changes</button>`)}</div>
 <div class="bc-two">${card("Open changes that could collide","The next scheduled changes. An exercise on the same CI the same day is a blocking conflict.",h.tbl([{h:"Change",f:c=>h.dl("change",c.id,c.id)+"<br>"+H(c.t)},{h:"Service",f:c=>H(c.svc)},{h:"When",f:c=>date(c.start)+(c.end&&c.end!==c.start?" to "+date(c.end):"")},{h:"Status",f:c=>pill(c.st,"mute")}],chg))}
  ${card("Maintenance windows","Recurring windows from Event management that suppress alerts for their CIs. They are shown as information on an exercise that overlaps.",h.tbl([{h:"Window",f:x=>`<b>${H(x.n)}</b><br><span class="small muted">${H(x.why||"")}</span>`},{h:"Kind",f:x=>H(x.kind)},{h:"CIs",f:x=>arr(x.cis).map(i=>h.dl("ci",i,(BX.ci(i)||{name:i}).name)).join(", ")},{h:"Mode",f:x=>H(x.mode)}],mw))}</div>`}

function bars(e){const a=BX.app(BX.exApp(e));if(!a||!e.res)return"-";const f=(v,t)=>{const max=Math.max(v,t)*1.25||1;return `<span class="bc-rt" role="img" aria-label="${mins(v)} against ${mins(t)}"><i class="${v<=t?"ok":"miss"}" style="width:${Math.min(100,v/max*100)}%"></i><b style="left:${t/max*100}%"></b></span>`};
 return `<div class="bc-rtr"><span class="small">RTO ${mins(e.res.rtoA)}${e.res.est?" (est.)":""} / ${mins(a.rtoT)}</span>${f(e.res.rtoA,a.rtoT)}<span class="small">RPO ${mins(e.res.rpoA)} / ${mins(a.rpoT)}</span>${f(e.res.rpoA,a.rpoT)}</div>`}
function resultsPane(){const done=BX.exs().filter(e=>e.status==="Completed"&&e.res).sort((a,b)=>b.date.localeCompare(a.date));
 const fnd=id=>G(()=>GRCX.findings.find(f=>f.id===id),null);
 return card("Exercise results","Achieved against target for every completed exercise. Findings became records in Issues and findings; remediation owners come from each finding's plan.",h.tbl([{h:"Exercise",f:e=>h.lk(e.id,e.id)+"<br>"+H(exTitle(e))},{h:"Type",f:e=>H(BX.TYPEN[e.type])},{h:"Date",f:e=>date(e.date)},{h:"Result",f:e=>bars(e)},{h:"Targets",f:e=>{const p=BX.passed(e);return p?(p.rto&&p.rpo?pill("Met","good"):pill("Missed","bad")):"-"}},{h:"Findings and remediation owners",f:e=>arr(e.res.findings).map(id=>{const f=fnd(id);return `<div>${h.lk(id,id)} ${f?pill(f.st,f.st==="Closed"?"good":"warn")+" "+h.ppl(f.own)+" <span class='small muted'>due "+H(date(f.due))+"</span>":""}</div>`}).join("")||'<span class="muted">None</span>'},{h:"Review",f:e=>e.review?pill(e.review.st,e.review.st==="Reviewed"?"good":"warn"):"-"}],done),fchip("m_bc_rto_att"))}

function schedulePane(){const ex=BX.exs().filter(e=>UI.calF==="all"||e.status===UI.calF).sort((a,b)=>a.date.localeCompare(b.date));
 const prop=BX.obligations().filter(o=>(o.status==="Overdue"||o.status==="Due soon"||o.status==="Scheduled late")&&!(o.sched&&o.sched.status!=="Completed"&&o.status==="Scheduled")).sort((a,b)=>a.tier-b.tier||a.due.localeCompare(b.due));
 return `${card("Exercises due that need a date","Computed from the tier policy. The suggested date is the first approved window that clears freezes, notice periods and open changes.",prop.length?h.tbl([{h:"Application",f:o=>h.appLk(o.app.id)+" "+h.tierPill(o.tier)},{h:"Needed",f:o=>H(o.typeName)},{h:"Due",f:o=>date(o.due)+" "+h.stPill(o.status)},{h:"First clear window",f:o=>{const s=suggest(o.app.id,o.type);return s?`<b>${H(date(s.date))}</b> <span class="small muted">${H((BX.winOf(s.win)||{}).n)}</span>`:"-"}},{h:"",f:o=>{const s=suggest(o.app.id,o.type);return `<button class="btn sm primary" data-bc-act="sched" data-app="${o.app.id}" ${s?`data-date="${s.date}" data-win="${s.win}"`:""}>Schedule</button>`}}],prop):'<p class="muted">Every application has its required exercise scheduled or current.</p>')}
 ${card("All exercises","Planned, in progress and completed. Overdue means the application's obligation is past due.",`<div class="row" style="gap:8px;margin-bottom:10px">${h.chips([["all","All"],["Planned","Planned"],["In progress","In progress"],["Completed","Completed"],["Cancelled","Cancelled"]],UI.calF,"data-bc-calf")}</div>`+h.tbl([{h:"Exercise",f:e=>h.lk(e.id,e.id)+"<br>"+H(exTitle(e))},{h:"Application",f:e=>BX.exApp(e)?h.appLk(BX.exApp(e)):"Enterprise"},{h:"Type",f:e=>H(BX.TYPEN[e.type])},{h:"Date and window",f:e=>date(e.date)+"<br><span class='small muted'>"+H((BX.winOf(e.win)||{n:""}).n)+"</span>"},{h:"Status",f:e=>{const o=BX.exApp(e)&&BX.obligation(BX.exApp(e));return h.stPill(e.status)+(e.status==="Planned"&&o&&o.due<e.date&&o.sched===e?" "+pill("after due date","warn"):"")}},{h:"Conflicts",f:e=>{const c=BX.conflictsOf(e);return c.length?c.slice(0,2).map(x=>`<div class="bc-cf ${x[0]}">${H(x[1])}</div>`).join(""):(e.status==="Completed"||e.status==="Cancelled"?"-":pill("None","good"))}},{h:"Change record",f:e=>e.chg?h.dl("change",e.chg,e.chg):e.type==="live"&&e.status==="Planned"?`<button class="btn sm" data-bc-act="mkchg" data-id="${e.id}">Create change</button>`:"-"},{h:"Facilitator",f:e=>h.ppl(e.fac)+" "+h.bk(e.fbak)}],ex))}`}

function calScreen(){const R=BX.sync();const ex=BX.exs();const conf=ex.filter(e=>BX.conflictsOf(e).some(c=>c[0]==="bad"));
 return `<div class="screen bc">${h.hero("Exercise calendar",`<b>${ex.filter(e=>e.status==="Planned").length}</b> exercises are planned and <b>${ex.filter(e=>e.status==="In progress").length}</b> in progress. <b>${conf.length}</b> ${conf.length===1?"has":"have"} a blocking conflict${conf.length?": "+conf.map(e=>e.id).join(", "):""}. Live failovers are placed inside approved change windows and each creates a change record.`,`<div class="row">${h.fwChip()}<button class="btn primary" data-bc-act="sched">Schedule an exercise</button><button class="btn" data-bc-go="itsm_chg">Open Changes</button></div>`)}${lensNote()}
 ${kpiRow([["Planned",ex.filter(e=>e.status==="Planned").length,"next 90 days"],["In progress",ex.filter(e=>e.status==="In progress").length,"running now"],["Completed this year",ex.filter(e=>e.status==="Completed"&&e.date>=TODAY.slice(0,4)+"-01-01").length,"since January"],["Blocking conflicts",conf.length,"freeze, window or change",{keep:true}],["Overdue exercises",R.overdue,"past the policy due date",{metric:"m_bc_ex_comp",keep:true}],["Targets met",R.rto+"%","recovery time, last exercise",{metric:"m_bc_rto_att"}]])}
 ${views("bc_cal",["Calendar","Schedule","Windows","Results"],[card("Exercise calendar","Exercises sit on their date. Shaded days are blackout or restricted periods from the change module; a red exercise has a blocking conflict.",monthGrid()),schedulePane(),windowsPane(),resultsPane()])}
 ${procCard("bc_cal")}</div>`}

REG("bc_cal","Exercise calendar","platform",BX.IC.cal,calScreen);
document.addEventListener("click",e=>{
 const c=e.target.closest("[data-bc-cal]");if(c){UI.calM=c.dataset.bcCal;render();return}
 const f=e.target.closest("[data-bc-calf]");if(f){UI.calF=f.dataset.bcCalf;render();return}
 const a=e.target.closest("[data-bc-act]");if(!a)return;const act=a.dataset.bcAct;
 if(act==="sched"){const pre={};if(a.dataset.app)pre.app=a.dataset.app;if(a.dataset.date)pre.date=a.dataset.date;if(a.dataset.win)pre.win=a.dataset.win;if(a.dataset.app){const o=BX.obligation(a.dataset.app);pre.type=o.type;const ap=BX.app(a.dataset.app);pre.fac=ap.own;pre.fbak=ap.bak;pre.scn="Recover "+ap.n+" to the objectives in the "+ap.pol.n+" policy."}schedForm(pre)}
 else if(act==="mkchg")BX.raiseChange(a.dataset.id);
});
})();

/* mod_plat_debt: the technical debt ledger. Debt is a first-class entity (debt_item). Detectors scan the live registry and the citizen app gate;
   manual items and exceptions are seeded. Exposes window.DEBT for the citizen app gate. Screen: plat_debt. */
(function(){
S.debt=S.debt||{ov:{},manual:null,tasks:[],rev:0,trace:{kind:"entity",id:"invoice"},hrs:32,ceil:null,taskDone:{}};
const E=esc,D=S.debt;
/* PR-32 B9 tenant rows (R16 to R18): Meridian reads S.debt (its seeded manual items, exceptions and tasks) and the registry detectors as before.
   Another tenant sees only its own rows: its tech_debt tasks (DATA.get, part task), the items the gate detectors find on its own builds and
   the items added in this session. The Meridian registry detectors, seeds, debt metrics and the monthly trend are Meridian only. */
const TCORE=()=>!window.DATA||DATA.tenant()==="core";
const TPARTS=new WeakMap();
const TROWS=(e,part)=>{const all=DATA.get(e);let m=TPARTS.get(all);if(!m){m={};TPARTS.set(all,m)}return m[part]||(m[part]=all.filter(r=>r.part===part))};
const TGAP=w=>`<p class="muted small" data-tenant-gap="1">No data in this sample company yet${w?": "+U.esc(w):""}.</p>`;
const fchipT=id=>TCORE()?fchip(id):"";
const kpT=o=>{if(TCORE()||!o)return o;const c=Object.assign({},o);delete c.metric;return c};
const MAN=()=>{if(TCORE()){seed();return D.manual}D.mt=D.mt||{};const t=DATA.tenant();return D.mt[t]||(D.mt[t]=[])};
const TASKS=()=>TCORE()?D.tasks:TROWS("tech_debt","task");
const TODAY=U.TODAY_ISO,T0=new Date(TODAY+"T12:00:00").getTime(),DAY=864e5,RATE=95;
const iso=n=>new Date(T0+n*DAY).toISOString().slice(0,10);
const days=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/DAY);
const fD=s=>s?new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"None";
const hash=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%9973;return h};
const r1=n=>Math.round(n*10)/10;
const pill_=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
const SEVP={Critical:"bad",High:"bad",Medium:"warn",Low:"mute"},SEVW={Critical:4,High:3,Medium:2,Low:1};
const STP={open:"warn",accepted:"info",progress:"info",resolved:"good"},STL={open:"Open",accepted:"Accepted with expiry",progress:"In progress",resolved:"Resolved"};
const nm=id=>{const a=PLAT.app(id);if(a)return a.n;const g=window.GATE&&GATE.app&&GATE.app(id);return g?g.n:id};
const entL=id=>{const e=PLAT.ent(id);return e?e.label:id};
/* ---------- debt types: interest = apps x changes a month x extra hours per change + chance of an incident x hours it costs ---------- */
const TY={
 dup_entity:{n:"Duplicate entity",cad:1,hrs:0.75,p:.05,inc:16,pr:40,steps:["Pick the entity to keep (the one with the most readers and a named owner).","Map the duplicate's fields to it and write a migration with a rollback.","Switch each affected app to read and write the kept entity.","Retire the duplicate and close this item."],blocks:"Promotion of any app that reads either entity to the next tier."},
 dup_proc:{n:"Duplicate process",cad:1,hrs:1,p:.04,inc:20,pr:32,steps:["Compare the two processes step by step and note the differences.","Keep the platform process; add the missing step as an option on it.","Point the app at the platform process through the workflow service.","Retire the copy and close this item."],blocks:"Certification of the app that runs the copy."},
 bypass:{n:"Bypassed core service",cad:1,hrs:0.5,p:.05,inc:12,pr:12,steps:["Find the custom code that does the job of the core service.","Replace it with the platform call (see the core services catalog).","Remove the custom code and its secrets.","Re-run the conformance gate."],blocks:"Enterprise certification."},
 unreg:{n:"Unregistered field",cad:1,hrs:0.75,p:.03,inc:10,pr:14,steps:["Propose the missing entity or field with an owner and steward.","Run the reuse check; reuse an existing field where one fits.","Migrate the data and point apps at the registered field.","Remove the workaround."],blocks:"Reporting that needs one number for the same thing."},
 nonowner:{n:"Non-owner write",cad:1,hrs:0.5,p:.08,inc:14,pr:8,steps:["Name the entity owner and agree the write path.","Route the write through the owner's API so validation and audit apply.","Remove direct writes from the app.","Close this item."],blocks:"Data trust score for the entity."},
 expired:{n:"Expired exception",cad:1,hrs:1,p:.15,inc:24,pr:16,steps:["Decide: fix, extend with a new approval, or decommission.","If fixing, create the project or demand from this item.","If extending, the data council approves a new expiry.","Close the exception."],blocks:"Every promotion for the app; shows on the board pack."},
 orphan:{n:"Orphan app",cad:1,hrs:0.5,p:.2,inc:30,pr:6,steps:["Find a new support owner in the builder's team.","If nobody accepts within 14 days, move the app to sunset.","Record the owner in the manifest.","Close this item."],blocks:"Certification; a failing app with no owner cannot be fixed."},
 stale_conn:{n:"Stale connector",cad:2,hrs:0.5,p:.12,inc:18,pr:10,steps:["Check the last successful run and the error in the sync log.","Fix credentials or the mapping, then replay missed data.","Add an alert for freshness against the agreement.","Close this item."],blocks:"Anything that reads fields the connector supplies."},
 dep_api:{n:"Deprecated API use",cad:1,hrs:0.5,p:.1,inc:20,pr:8,steps:["List callers of the deprecated API from the gateway log.","Move each to the replacement call.","Confirm no calls in 14 days.","Close this item before the retirement date."],blocks:"The next platform release."},
 no_class:{n:"Missing classification",cad:1,hrs:0.25,p:.1,inc:40,pr:16,steps:["Sample the fields and let the Registry Agent propose a label.","The steward confirms or corrects each label.","Masking rules start applying to the field.","Close this item."],blocks:"Any app that reads the field, and sharing outside the organization."},
 unmapped:{n:"Unmapped authority",cad:1,hrs:0.5,p:.06,inc:12,pr:12,steps:["Declare which system is authoritative for each field.","Add the mapping and a freshness expectation in the fabric.","Turn on reconciliation for shared fields.","Close this item."],blocks:"Trust score and field masking for the entity."},
 ooc:{n:"Citizen app out of conformance",cad:1,hrs:0.75,p:.08,inc:16,pr:10,steps:["Open the conformance gate and read each failing check.","Fix with the hint shown, or request an exception with an expiry.","Re-run the gate.","Close this item."],blocks:"Promotion from sandbox to review to certified."}
};
const TYK=Object.keys(TY);
const interest=(t,napps)=>{const y=TY[t];const n=Math.max(1,napps);return{h:r1(n*y.cad*y.hrs+y.p*y.inc),formula:`${n} app${n>1?"s":""} × ${y.cad} changes a month × ${y.hrs} h extra + ${Math.round(y.p*100)}% chance × ${y.inc} h incident`}};
const SLA={Critical:30,High:60,Medium:120,Low:180};
/* ---------- ceilings per tier ---------- */
const CEIL0={personal:{h:8,high:0,exc:30},team:{h:24,high:0,exc:90},enterprise:{h:40,high:0,exc:180}};
const ceil=()=>D.ceil||(D.ceil=JSON.parse(JSON.stringify(CEIL0)));
/* ---------- seeds ---------- */
function seed(){
 if(D.manual)return;
 const m=(id,type,title,sev,ents,apps,owner,steward,ago,pr,st,extra)=>Object.assign({id,type,title,sev,source:"manual",ents,apps,owner,steward,created:iso(-ago),principal:pr,status:st||"open",fix:"",note:""},extra||{});
 D.manual=[
  m("DB-M01","bypass","Releases screen sends its own email instead of the notification service","Medium",[],["itsm_rel"],"Release manager","Platform lead",58,12),
  m("DB-M02","bypass","Vendor management builds its own spreadsheet exports instead of the reporting service","Low",["invoice"],["bud_ven"],"Procurement lead","Platform lead",97,8),
  m("DB-M03","stale_conn","HRIS connector last synced 9 days ago; the agreement is daily","High",["person","time_off"],["svc_oncall","ppl_org"],"Integration lead","Head of People Operations",9,10),
  m("DB-M04","dep_api","Three scripted rules still call the query API that retires Dec 14","Medium",["automation_rule"],["itom_run"],"Operations lead","Platform lead",41,6,"progress"),
  m("DB-M05","no_class","Free-text fields on request items may hold personal data and carry no label","High",["request_item","catalog_item"],["svc_cat"],"Service desk manager","Data council chair",122,16),
  m("DB-M06","unreg","Team leads track certification expiry in spreadsheets, not in skill claims","Medium",["skill_claim"],["svc_skills"],"Head of People Operations","Head of People Operations",150,14),
  m("DB-M07","stale_conn","Lumen search index refresh fails on every second Sunday","Medium",["knowledge_article"],["svc_cat"],"Integration lead","Knowledge manager",33,8),
  /* exceptions: an override of the no-duplicate rule with an owner and an expiry */
  m("DB-E01","dup_entity","Budget workbook copy kept for the audit committee until the budget line entity exists","Medium",["invoice"],["bud_over"],"Finance controller","Finance controller",70,20,"accepted",{source:"exception",exp:"2026-12-15",reason:"Audit committee wants last year's workbook unchanged until year end.",owner2:"Avery Chen"}),
  m("DB-E02","dup_entity","Legacy SolarWinds node list kept as a CSV until discovery cutover","Low",["config_item"],["itom_cmdb"],"Operations lead","Configuration manager",88,10,"accepted",{source:"exception",exp:"2026-10-31",reason:"Discovery cutover is planned for the weekend of Oct 24.",owner2:"Sam Patel"}),
  m("DB-E03","dup_entity","Contract clause tags in the analyzer duplicate repository tags","Medium",["contract_line"],["ppm_sow"],"Contract analyzer","Finance controller",126,14,"accepted",{source:"exception",exp:"2026-09-30",reason:"Needed for the Q3 renewal review.",owner2:"Maya Ortiz"}),
  m("DB-E04","dup_entity","Conference planner keeps its own traveler list","Low",["person"],["ca_travel"],"Priya Shah","Head of People Operations",44,6,"accepted",{source:"exception",exp:"2026-11-20",reason:"Travelers include external speakers who are not in the directory.",owner2:"Priya Shah"}),
  m("DB-E05","nonowner","On-call swap helper writes shifts directly","Medium",["oncall_shift"],["ca_oncall_swap"],"Sam Patel","Operations lead",52,8,"accepted",{source:"exception",exp:"2026-09-15",reason:"Interim until the swap API ships.",owner2:"Sam Patel"})
 ];
}
/* ---------- detectors ---------- */
const WORK=[
 ["budget_line",["bud_over","inv","ppm_proj"],"Budget numbers are typed into invoices, projects and the cost views","Finance controller"],
 ["vendor",["bud_ven","inv","ppm_sow"],"Vendor is free text on invoices, contracts and tickets","Procurement lead"],
 ["notification",["svc_cat","itsm_chg","itsm_rel"],"Each module sends its own messages","Platform lead"],
 ["audit_event",["itsm_inc","itsm_chg","ppm_proj"],"Each module keeps its own audit trail","Security lead"],
 ["application",["exe_apps","itom_cmdb"],"Applications are CI subtypes, so citizen apps have no home","Enterprise architect"]];
function detect(){
 const out=[],applied=S.plat.applied||{};
 const mk=(id,type,title,sev,ents,apps,owner,steward,pr,extra)=>{const ageDays=20+hash(id)%190;const o=Object.assign({id,type,title,sev,source:"auto",ents:ents||[],apps:apps||[],owner,steward,created:iso(-ageDays),principal:pr,status:"open",fix:"",note:""},extra||{});return o};
 if(TCORE()){PLAT.FIXES.forEach(f=>{
  const e0=PLAT.ent(f.ents[0]);const isProc=f.id==="fx_approval";
  const it=mk("DB-"+f.id.replace("fx_","FX-").toUpperCase(),isProc?"dup_proc":"dup_entity",f.debt+" ("+f.ents.map(entL).join(", ")+")",f.risk==="High"?"High":f.risk==="Medium"?"Medium":"Low",f.ents.filter(x=>PLAT.ent(x)),f.apps,(e0&&e0.owner)||"Platform team",(e0&&e0.steward)||"Platform lead",parseInt(f.effort)*8,{fixId:f.id,fix:"Registry fix: "+f.t,plan:f.plan});
  if(applied[f.id]){it.status="resolved";it.closedBy="Registry fix applied";it.closed=TODAY}
  out.push(it)});
 const seen={};
 PLAT.nonOwnerWrites().forEach(w=>{const id="DB-NO-"+w.ent+"-"+w.app;if(seen[id])return;seen[id]=1;const e=PLAT.ent(w.ent);
  const fx=PLAT.FIXES.find(f=>f.ents.includes(w.ent)&&applied[f.id]);
  const it=mk(id,"nonowner",nm(w.app)+" writes "+entL(w.ent)+", which "+w.owner+" owns",(e&&(e.cls==="restricted"||e.cls==="personal"))?"High":"Medium",[w.ent],[w.app],w.mod,(e&&e.steward)||"Platform lead",8);
  if(fx){it.status="resolved";it.closedBy="Closed with "+fx.t;it.closed=TODAY}out.push(it)});
 PLAT.multiWriters().forEach(w=>{if(PLAT.FIXES.some(f=>f.ents.includes(w.ent)))return;const e=PLAT.ent(w.ent);
  out.push(mk("DB-MW-"+w.ent,"nonowner",w.apps.length+" apps write "+entL(w.ent)+": "+w.apps.map(nm).join(", "),"Medium",[w.ent],w.apps,e.owner,e.steward,10))});
 const byEnt={};PLAT.fieldsAll().forEach(f=>{if(f.auth==="external"&&f.trust<.8){(byEnt[f.ent]=byEnt[f.ent]||[]).push(f)}});
 Object.keys(byEnt).sort((a,b)=>byEnt[b].length-byEnt[a].length).slice(0,5).forEach(k=>{const e=PLAT.ent(k),n=byEnt[k].length;
  out.push(mk("DB-UA-"+k,"unmapped",n+" external field"+(n>1?"s":"")+" on "+e.label+" have a trust score under 80% and no reconciliation rule","Medium",[k],e.readers.slice(0,4),e.owner,e.steward,Math.min(18,Math.round(n*1.5)+4)))});
 WORK.forEach(w=>{const exists=PLAT.entities().some(e=>e.id===w[0]);const prop=(S.plat.proposals||[]).find(p=>p.id===w[0]);
  const it=mk("DB-PL-"+w[0],"unreg","Workaround: "+w[0].replace(/_/g," ")+" is not an entity yet. "+w[2],"Medium",[],w[1],w[3],"Data council chair",24,{fix:prop?"Proposal submitted":"Propose the entity in the registry"});
  if(exists){it.status="resolved";it.closedBy="Entity now in the registry";it.closed=TODAY}else if(prop)it.status="progress";
  out.push(it)});
 }
 /* citizen apps from the gate */
 if(window.GATE&&GATE.apps){GATE.apps().forEach(a=>{
  if(a.status==="idea"||a.status==="sunset")return;const base="DB-CA-"+a.id.replace("ca_","");
  if(!a.owner)out.push(mk(base+"-orphan","orphan",a.n+" has no support owner","High",[],[a.id],"Platform team","Platform lead",6,{fix:"Find an owner or sunset the app"}));
  const wv=c=>GATE.waived&&GATE.waived(a.id,c);
  (a.newEnts||[]).filter(n=>n.dupOf&&!wv("nodup")).forEach(n=>out.push(mk(base+"-dup-"+n.id,"dup_entity",a.n+" wants its own "+n.id.replace(/_/g," ")+", which duplicates "+n.dupOf,"High",[],[a.id],"Platform team",(PLAT.ent(String(n.dupOf).split(" ")[0])||{}).steward||"Data council chair",12,{fix:"Reuse "+n.dupOf})));
  if(a.dupProc&&!wv("noproc")){const pd=PROC.defs[a.dupProc];out.push(mk(base+"-proc","dup_proc",a.n+" re-implements an existing process: "+(pd?pd.title:a.dupProc),"Medium",[],[a.id],"Platform team","Process governance lead",16,{fix:"Use the platform workflow"}))}
  if(a.m&&(a.m.ownNotify||a.m.ownReport)&&!wv("notify"))out.push(mk(base+"-bypass","bypass",a.n+" builds its own "+(a.m.ownNotify&&a.m.ownReport?"notifications and reports":a.m.ownNotify?"notifications":"reports")+" instead of the core services","Medium",[],[a.id],"Platform team","Platform lead",12,{fix:"Call the notification and reporting services"}));
  (a.writes||[]).forEach(en=>{const e=PLAT.ent(en);if(e&&!wv("nowrite"))out.push(mk(base+"-nw-"+en,"nonowner",a.n+" writes "+e.label+", which "+e.owner+" owns","Medium",[en],[a.id],e.owner,e.steward,8,{fix:"Route writes through the owner's API"}))});
  if(a.m&&a.m.labels===false&&!wv("labels"))out.push(mk(base+"-cls","no_class",a.n+" stores data with no classification labels","High",[],[a.id],"Platform team","Data council chair",8,{fix:"Add classification labels to the manifest"}));
  const c=GATE.conformance(a.id);
  if(c.fails>0&&!out.some(x=>x.apps[0]===a.id&&x.source==="auto"&&x.type==="ooc"))out.push(mk(base+"-ooc","ooc",a.n+" fails "+c.fails+" conformance check"+(c.fails>1?"s":""),a.tier==="enterprise"?"High":"Medium",[],[a.id],"Platform team","Platform lead",c.fails*4,{fix:"Open the conformance gate"}));
 })}
 return out;
}
let _cache=null,_key="";
function build(){
 seed();
 const key=[D.rev,Object.keys(S.plat.applied||{}).join(),(S.plat.proposals||[]).length,window.GATE&&GATE.rev?GATE.rev():0,MAN().length,window.GATE&&GATE.apps?GATE.apps().length:0,TCORE()?"":DATA.tenant()+DATA.version].join("|");
 if(_cache&&key===_key)return _cache;
 const all=MAN().map(x=>Object.assign({},x)).concat(detect());
 all.forEach(it=>{
  const o=D.ov[it.id]||{};
  if(o.st)it.status=o.st;if(o.exp)it.exp=o.exp;if(o.assignee)it.assignee=o.assignee;if(o.owner)it.owner=o.owner;if(o.note)it.note=o.note;if(o.reason)it.reason=o.reason;
  if(o.st==="resolved"){it.closedBy=o.closedBy||"Marked resolved";it.closed=o.closed||TODAY}
  if(it.source==="exception"&&it.exp&&it.exp<TODAY&&it.status!=="resolved"){it.baseType=it.type;it.type="expired";it.status="open";it.sev=it.sev==="Low"?"Medium":"High";it.title="Expired: "+it.title}
  if(it.source!=="exception"&&it.status==="accepted"&&it.exp&&it.exp<TODAY){it.status="open";it.note=(it.note?it.note+" ":"")+"The acceptance expired on "+fD(it.exp)+"."}
  const apps=Array.from(new Set((it.apps||[]).concat([])));const iv=interest(it.type,apps.length);
  it.interest=iv.h;it.iformula=iv.formula;it.money=Math.round(iv.h*RATE);
  it.due=it.due||(it.source==="exception"&&it.exp)||iso(days(TODAY,it.created)+SLA[it.sev]);
  if(it.status==="resolved")it.interest=0;
  it.age=Math.max(0,days(it.created,TODAY));
 });
 _cache=all;_key=key;return all;
}
const live=()=>build().filter(x=>x.status!=="resolved");
const find=id=>build().find(x=>x.id===id);
function bump(){D.rev++;_cache=null}
/* ---------- public API ---------- */
function scoreApp(appId){
 const g=window.GATE&&GATE.app&&GATE.app(appId);const tier=(g&&g.tier)||"team";const c=ceil()[tier]||CEIL0.team;
 const its=live().filter(x=>x.apps.includes(appId)&&x.status!=="accepted");
 const all=live().filter(x=>x.apps.includes(appId));
 const pr=its.reduce((a,x)=>a+x.principal,0),hi=its.filter(x=>SEVW[x.sev]>=3).length,exp=all.filter(x=>x.source==="exception").length;
 const score=Math.max(0,Math.round(100-100*pr/(2*c.h)-18*hi));
 const blocks=[];if(pr>c.h)blocks.push("Principal "+pr+" h is over the "+tier+" ceiling of "+c.h+" h");if(hi>c.high)blocks.push(hi+" high or critical item"+(hi>1?"s":"")+" open (ceiling "+c.high+")");
 return{open:all.length,counted:its.length,principal:pr,high:hi,exceptions:exp,interest:r1(all.reduce((a,x)=>a+x.interest,0)),score,tier,ceiling:c,over:blocks.length>0,blocks};
}
const DEBT=window.DEBT={TYPES:TY,
 items(){return build()},
 open(){return live()},
 byApp(id){return live().filter(x=>x.apps.includes(id))},
 score:scoreApp,
 add(it){
  seed();if(!it||!it.title)return null;const id=it.id||"DB-U"+String(MAN().length+1).padStart(2,"0");
  const type=TY[it.type]?it.type:(TYK.find(k=>TY[k].n.toLowerCase()===String(it.type||"").toLowerCase())||"ooc");
  MAN().push(Object.assign({id,type,title:it.title,sev:it.sev||"Medium",source:it.source||"manual",ents:it.ents||[],apps:it.apps||[],owner:it.owner||"Platform team",steward:it.steward||"Platform lead",created:TODAY,principal:it.principal||8,status:it.status||(it.exp?"accepted":"open"),fix:it.fix||"",note:it.note||""},it.exp?{exp:it.exp}:{},it.reason?{reason:it.reason}:{},it.owner2?{owner2:it.owner2}:{},{id}));
  bump();audit("Debt item added",id+" "+it.title);return id},
 byId:find,ceilings:ceil,today:TODAY,rate:RATE,fD,days,
 totals(){const l=live();return{n:l.length,principal:l.reduce((a,x)=>a+x.principal,0),interest:r1(l.reduce((a,x)=>a+x.interest,0))}}
};
/* ---------- tasks for expired exceptions ---------- */
function ensureTasks(){
 const _tt=window.toast;window.toast=function(){};try{ensureTasks0()}finally{window.toast=_tt}}
function ensureTasks0(){
 build().filter(x=>x.type==="expired"&&x.status!=="resolved").forEach(x=>{
  if(D.taskDone[x.id])return;D.taskDone[x.id]=1;
  const t={id:"DT-"+(TASKS().length+1),item:x.id,title:"Fix or decommission: "+x.title.replace(/^Expired: /,""),due:iso(14),owner:x.owner,kind:"Fix or decommission"};
  TASKS().push(t);try{if(window.addDemand)addDemand({title:t.title,reason:"Exception "+x.id+" expired on "+fD(x.exp),source:"Debt ledger",cost:Math.max(5,Math.round(x.principal*RATE/1000)),kind:"Platform build",pm:"Casey Rowan"})}catch(e){}
  audit("Task created for expired exception",x.id+" "+t.title)})
}
/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_debt_open:{n:"Open debt principal",f:"Σ effort to fix (hours) of every open or in-progress debt item, plus accepted items past their expiry",u:"h",cur:300,tgt:150,badAt:400,dir:"min",max:600,tr:[190,205,230,250,265,282,296,300],owner:"Platform team",use:["Technical debt ledger"],rem:{kind:"agent",ref:"AG-DEBT1",title:"Plan the paydown",agent:"Registry Agent",auto:false,state:"idle",prog:"Orders items by interest per hour of effort and drafts the sprint plan"}},
 m_debt_int:{n:"Monthly debt interest",f:"Σ (affected apps × changes a month × extra hours per change + chance of incident × incident hours) over open items",u:"h",cur:60,tgt:30,badAt:80,dir:"min",max:140,tr:[34,38,42,46,50,54,58,60],owner:"Platform team",use:["Technical debt ledger","Citizen apps"],rem:{kind:"sop",ref:"SOP-720",title:"Pay the highest interest first",agent:"Registry Agent",auto:false,state:"idle",prog:"Ranks items by interest per hour to fix"}},
 m_debt_exp:{n:"Exceptions past expiry",f:"Count of approved exceptions whose expiry date is before today and are not resolved",u:"",cur:2,tgt:0,badAt:3,dir:"min",max:8,tr:[0,0,1,0,1,1,2,2],owner:"Data council",use:["Technical debt ledger"],rem:{kind:"sop",ref:"SOP-721",title:"Fix, extend or decommission",agent:"Registry Agent",auto:true,state:"idle",prog:"Creates a fix or decommission task the day an exception expires"}},
 m_debt_age:{n:"Median age of open debt",f:"Median of (today − created date) in days over open items",u:"d",cur:80,tgt:60,badAt:120,dir:"min",max:200,tr:[40,48,55,60,66,70,76,80],owner:"Platform team",use:["Technical debt ledger"],rem:{kind:"kb",ref:"KB0720",title:"Review the oldest five each sprint",agent:"Registry Agent",auto:false,state:"idle",prog:"Surfaces the five oldest items at sprint planning"}}
});
function median(a){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:Math.round((s[m-1]+s[m])/2)}
function syncMetrics(){if(!TCORE())return;const l=live(),t=DEBT.totals();METRICS.m_debt_open.cur=t.principal;METRICS.m_debt_int.cur=t.interest;METRICS.m_debt_exp.cur=l.filter(x=>x.type==="expired").length;METRICS.m_debt_age.cur=median(l.map(x=>x.age))}
/* ---------- helpers for charts ---------- */
function bars(rows,fmt){const mx=Math.max(1,...rows.map(r=>r[1]));return rows.length?`<div class="debt-bars">${rows.map(r=>`<div class="debt-bar"><span class="small">${E(r[0])}</span><div class="debt-track"><i style="width:${Math.round(100*r[1]/mx)}%"></i></div><b>${fmt?fmt(r[1]):r[1]}</b></div>`).join("")}</div>`:`<p class="muted small">Nothing here.</p>`}
function sevPill(s){return pill_(s,SEVP[s])}
function stPill(it){return pill_(STL[it.status],STP[it.status])}
function typePill(t){return `<span class="pill info">${E(TY[t].n)}</span>`}
function whoChip(n){return window.pchip&&DIR.some(d=>d.name===n)?pchip(n):E(n)}
function cdown(exp){const d=days(TODAY,exp);return d<0?pill_("Expired "+(-d)+" d ago","bad"):d<=30?pill_(d+" days left","warn"):pill_(d+" days left","good")}
/* ---------- screen ---------- */
function debtScreen(){
 seed();ensureTasks();syncMetrics();
 const l=live(),t=DEBT.totals(),all=build();
 const exps=all.filter(x=>x.source==="exception"||x.type==="expired");
 const expired=l.filter(x=>x.type==="expired"),soon=exps.filter(x=>x.status!=="resolved"&&x.type!=="expired"&&x.exp&&days(TODAY,x.exp)<=30);
 const hi=l.filter(x=>SEVW[x.sev]>=3).length,autoN=all.filter(x=>x.source==="auto").length,closed=all.filter(x=>x.status==="resolved").length;
 const hero_=hero("Platform · Technical debt ledger","Track, trace and pay down the debt before it compounds",
  `<b data-role="metric">${l.length}</b> debt items are open with <b data-role="metric">${t.principal} hours</b> of work to fix. They cost about <b data-role="metric">${t.interest} hours a month</b> in rework and risk, roughly <b data-role="metric">${money(Math.round(t.interest*RATE))}</b>. <b data-role="metric">${expired.length}</b> exceptions have expired and ${soon.length} more expire within 30 days. ${autoN} items were found by detectors scanning the registry; ${closed} closed when a registry fix was applied.`,
  `<div class="row">${fchipT("m_debt_open")}${fchipT("m_debt_int")}${fchipT("m_debt_exp")}${fchipT("m_debt_age")}<button class="btn primary" data-debt-newexc>Request an exception</button></div>`);
 const kp=kpiRow([["Open items",l.length,hi+" high or critical",{cls:hi?"bad":"good",keep:true}],["Principal",t.principal+" h","effort to fix everything",kpT({metric:"m_debt_open"})],["Monthly interest",t.interest+" h",money(Math.round(t.interest*RATE))+" a month",kpT({metric:"m_debt_int"})],["Expired exceptions",expired.length,soon.length+" more within 30 days",kpT({cls:expired.length?"bad":"good",keep:true,metric:"m_debt_exp"})],["Median age",median(l.map(x=>x.age))+" d","oldest "+Math.max(0,...l.map(x=>x.age))+" d",kpT({metric:"m_debt_age"})]]);
 /* trend: eight months, last point is live */
 const allPr=all.reduce((a,x)=>a+x.principal,0),curve=[.46,.53,.6,.68,.77,.85,.93],tr=curve.map(c=>Math.round(allPr*c)).concat([t.principal]);
 const mons=["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"];
 const trend=lineChart(mons,[{vals:tr,color:col("--accent"),area:true}],{w:620,h:230,max:Math.max(50,Math.ceil(Math.max(...tr)/50)*50),alt:"Debt principal in hours over the last eight months"});
 const byType=TYK.map(k=>[TY[k].n,l.filter(x=>x.type===k).reduce((a,x)=>a+x.principal,0)]).filter(r=>r[1]).sort((a,b)=>b[1]-a[1]);
 const ow={};l.forEach(x=>ow[x.owner]=(ow[x.owner]||0)+x.principal);const byOwner=Object.keys(ow).map(k=>[k,ow[k]]).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const oldest=l.slice().sort((a,b)=>b.age-a.age).slice(0,5).map(x=>`<button class="debt-li" data-debt-open="${E(x.id)}"><span class="debt-li-t">${E(x.title)}</span><span class="small muted">${x.age} days old · ${E(x.owner)} · ${x.principal} h</span></button>`).join("");
 const expList=exps.filter(x=>x.status!=="resolved").sort((a,b)=>(a.exp||"").localeCompare(b.exp||"")).slice(0,5).map(x=>`<button class="debt-li" data-debt-open="${E(x.id)}"><span class="debt-li-t">${E(x.title.replace(/^Expired: /,""))}</span><span class="row small" style="gap:8px">${cdown(x.exp)}<span class="muted">expires ${fD(x.exp)}</span></span></button>`).join("");
 const tRows=()=>TASKS().map(tk=>`<div class="debt-li" style="cursor:default"><span class="debt-li-t">${E(tk.title)}</span><span class="small muted">${E(tk.id)} · ${E(tk.kind)} · due ${fD(tk.due)} · ${tk.owner?ownerChip(tk.owner,{role:"Owner"}):""}</span></div>`).join("");
 const pane0=`${kp}${TCORE()?"":(all.length?"":TGAP("debt items"))+`<div style="margin:8px 0 14px">${card("Fix and decommission tasks","Open tasks to fix or retire debt in this company",tRows()||TGAP("debt tasks"))}</div>`}${legend([["Debt principal in hours","--accent"]])}<div class="grid g2" style="gap:16px;margin-top:8px">${card("Debt over the last 8 months","Principal in hours. The last point is live: applying a registry fix lowers it.",TCORE()?trend:TGAP("monthly debt snapshots"),aiChip({model:"Registry Agent",conf:.88,title:"Trend and detectors",note:"Detectors scan the registry on every render. Earlier months come from the monthly snapshots the ledger keeps.",src:["Platform registry","Citizen app gate","Exceptions","Manual items"],guards:["Read-only on the registry","Cannot close an item without a linked fix or a human","Every change is audited"]}))}${card("Where the principal sits, by type","Hours to fix, largest first",bars(byType,v=>v+" h"))}</div>
  <div class="grid g2" style="gap:16px;margin-top:14px">${card("By owner","Hours to fix, by owning team",bars(byOwner,v=>v+" h"))}${card("Oldest items","Open the oldest first; age is days since detection",`<div class="debt-list">${oldest}</div>`)}</div>
  <div style="margin-top:14px">${card("Exceptions expiring next","An exception overrides the no-duplicate rule for a limited time",`<div class="debt-list">${expList||"<p class='muted small'>No exceptions.</p>"}</div>`)}</div>`;
 const led=btHTML({id:"debt_led",cols:[
  {k:"id",label:"ID",fmt:r=>`<b>${E(r.id)}</b>`,val:r=>r.id,w:110},
  {k:"title",label:"Debt item",fmt:r=>`<b>${E(r.title)}</b><div class="muted small">${E(r.apps.slice(0,3).map(nm).join(", "))}${r.apps.length>3?" +"+(r.apps.length-3):""}</div>`,val:r=>r.title,wrap:true,w:340},
  {k:"type",label:"Type",fmt:r=>typePill(r.type),val:r=>TY[r.type].n},
  {k:"sev",label:"Severity",fmt:r=>sevPill(r.sev),val:r=>SEVW[r.sev]},
  {k:"source",label:"Source",fmt:r=>r.source==="auto"?"Detected":r.source==="exception"?"Exception":"Manual",val:r=>r.source},
  {k:"owner",label:"Owner",fmt:r=>E(r.owner),val:r=>r.owner,wrap:true},
  {k:"interest",label:"Interest a month",fmt:r=>r.interest?r.interest+" h":"None",val:r=>r.interest},
  {k:"principal",label:"Principal",fmt:r=>r.principal+" h",val:r=>r.principal},
  {k:"status",label:"Status",fmt:r=>stPill(r),val:r=>STL[r.status]},
  {k:"due",label:"Due or expiry",fmt:r=>fD(r.due),val:r=>r.due}
 ],rows:()=>build(),key:"id",h:520,rowH:60,facets:["type","sev","status","owner","source"],groupBy:["owner","type","sev","status"],exportName:"debt-ledger",open:id=>drawer(id)});
 const pane1=`<p class="muted small">Every item has an owner, a steward, interest and principal. Select a row for lineage, remediation steps and actions. Interest is what the item costs each month; principal is the effort to remove it.</p>${legend([["High or critical","--bad-f"],["Medium","--warn-f"],["Low or closed","--good-f"]])}${led}`;
 /* exceptions */
 const exRows=exps.slice().sort((a,b)=>(a.exp||"").localeCompare(b.exp||"")).map(x=>`<tr><td><b>${E(x.title.replace(/^Expired: /,""))}</b><div class="muted small">${E(x.id)} · ${E((x.apps||[]).map(nm).join(", "))}</div></td><td>${whoChip(x.owner2||x.owner)}</td><td class="small">${E(x.reason||"")}</td><td>${E(fD(x.exp))}</td><td>${x.status==="resolved"?pill_("Closed","good"):cdown(x.exp)}</td><td><button class="btn quiet" data-debt-open="${E(x.id)}">Open</button></td></tr>`).join("");
 const taskRows=tRows();
 const pane2=`<div class="dnote" data-role="story" style="margin-bottom:12px"><b>${exps.filter(x=>x.status!=="resolved").length}</b> exceptions are active. The rule is no duplicate data and no second writer. An exception is allowed only with an owner, a reason and an expiry. On the expiry date the item turns into an expired exception and a fix or decommission task is created automatically.</div>
  <div class="row" style="gap:8px;margin-bottom:12px"><button class="btn primary" data-debt-newexc>Request an exception</button>${whyPop("Exceptions are shown to everyone because they are the places where the platform rule is not being followed.")}</div>
  ${kpiRow([["Active",exps.filter(x=>x.status!=="resolved"&&x.type!=="expired").length,"within their expiry"],["Expired",expired.length,"need a decision",{cls:expired.length?"bad":"good",keep:true}],["Expiring in 30 days",soon.length,"plan the fix now"],["Tasks created",TASKS().length,"fix or decommission"]])}
  <div class="tscroll"><table><thead><tr><th>Exception</th><th>Owner</th><th>Reason</th><th>Expires</th><th>Countdown</th><th></th></tr></thead><tbody>${exRows}</tbody></table></div>
  <div style="margin-top:14px">${card("Fix and decommission tasks","Created automatically when an exception expires",taskRows||"<p class='muted small'>No expired exceptions yet.</p>")}</div>`;
 /* trace */
 const pane3=`<p class="muted small">Pick an entity or an app and see every debt item that touches it, who owns the fix, and who is affected.</p><div data-debt-trace>${traceHTML()}</div>`;
 const pane4=`<div data-debt-burn>${burnHTML()}</div>`;
 const pane5=policyHTML();
 return `<div class="screen">${hero_}${lensNote()}${views("debt",["Overview","Ledger","Exceptions","Trace","Burn-down","Policy"],[pane0,pane1,pane2,pane3,pane4,pane5])}${procCard("plat_debt")}</div>`;
}
/* ---------- drawer with lineage ---------- */
function drawer(id){
 const x=find(id);if(!x)return;const y=TY[x.type];
 const created={dup_entity:"Two entities that record the same thing, found by the registry duplicate scan or declared in an app manifest.",dup_proc:"A second copy of a process that the platform already runs.",nonowner:"An app writes an entity whose owner is another module, so validation and audit are skipped.",expired:"An exception reached its expiry date and nobody closed it.",orphan:"The person who supported the app left or never accepted ownership.",ooc:"The conformance gate ran and found failing checks.",bypass:"A team built a service the platform already provides.",unreg:"A concept the model does not have yet, so teams keep it in text or spreadsheets.",stale_conn:"A connector missed its freshness agreement.",dep_api:"Callers were not moved before the API was deprecated.",no_class:"Fields were added without a classification label.",unmapped:"Authority for the field was never declared."}[x.type];
 const src=x.source==="auto"?aiChip({model:"Registry Agent",conf:.9,title:"Detected automatically",note:"A detector found this item by scanning the live registry and the citizen app gate.",src:["Platform registry","Who reads and writes","Citizen app gate"],guards:["Read-only scan","A human closes accepted items","Audited"]}):x.source==="exception"?pill_("Exception","info"):pill_("Added by a person","mute");
 const linked=lrHTML({id:"debt_dr_"+x.id.replace(/\W/g,"_"),limit:5,groups:[{key:"e",label:"Entities",rows:x.ents.map(e=>({id:e,t:entL(e),sub:(PLAT.ent(e)||{}).owner||"",tag:"entity",go:()=>go("plat_reg")}))},{key:"a",label:"Apps",rows:x.apps.map(a=>({id:a,t:nm(a),sub:(window.GATE&&GATE.app&&GATE.app(a))?"Citizen app":"Platform module",tag:"app",go:()=>{if(window.GATE&&GATE.app&&GATE.app(a))go("plat_gate")}}))}].filter(g=>g.rows.length)});
 const closedNote=x.status==="resolved"?`<div class="story" style="margin:10px 0"><b>Closed.</b> ${E(x.closedBy||"")} on ${fD(x.closed)}.</div>`:"";
 const acts=x.status==="resolved"?`<button class="btn quiet" data-debt-act="reopen" data-id="${E(x.id)}">Reopen</button>`:`<button class="btn" data-debt-act="accept" data-id="${E(x.id)}">Accept with expiry</button><button class="btn" data-debt-act="assign" data-id="${E(x.id)}">Assign</button><button class="btn" data-debt-act="demand" data-id="${E(x.id)}">Create project or demand</button><button class="btn primary" data-debt-act="resolve" data-id="${E(x.id)}">Mark resolved</button>`;
 openDrawer(`<div class="dfullgrid"><div><div class="eyebrow">${E(x.id)} · debt item</div><h2 style="margin:4px 0 8px;padding-right:60px">${E(x.title)}</h2>
  <div class="row" style="gap:8px;flex-wrap:wrap">${typePill(x.type)}${sevPill(x.sev)}${stPill(x)}${src}</div>${closedNote}
  <dl class="kv" style="margin-top:12px"><dt>Owner</dt><dd>${x.owner?ownerChip(x.owner,{role:"Owner"}):""}</dd><dt>Steward</dt><dd>${E(x.steward)}</dd>${x.assignee?`<dt>Assigned to</dt><dd>${whoChip(x.assignee)}</dd>`:""}<dt>Created</dt><dd>${fD(x.created)} (${x.age} days ago)</dd><dt>${x.source==="exception"?"Expires":"Due"}</dt><dd>${fD(x.exp||x.due)}</dd><dt>Principal</dt><dd><span data-role="metric">${x.principal} h</span> to fix</dd><dt>Interest</dt><dd><span data-role="metric">${x.interest} h a month</span> (${money(x.money)}). <span class="muted small">${E(x.iformula)}</span></dd><dt>Linked fix</dt><dd>${E(x.fix||"None yet")}${x.fixId?` <button class="btn quiet" data-debt-go="plat_reg">Open registry</button>`:""}</dd></dl>
  ${x.reason?`<h3>Reason given</h3><p class="small">${E(x.reason)}</p>`:""}${x.note?`<p class="small muted">${E(x.note)}</p>`:""}
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">${acts}</div></div>
  <div><h3>Lineage</h3><div class="debt-lin"><div><b>What created it</b><p class="small">${E(created)}</p></div><div><b>Where it lives</b><p class="small">${x.ents.length?x.ents.map(e=>`<code>${E(e)}</code>`).join(" "):"No registered entity"}${x.apps.length?" in "+E(x.apps.map(nm).join(", ")):""}.</p></div><div><b>What it blocks</b><p class="small">${E(y.blocks)}</p></div></div>
  <h3>Remediation steps</h3><ol class="small debt-steps">${y.steps.map(s=>`<li>${E(s)}</li>`).join("")}</ol>${x.plan?`<div class="story small"><b>Registry plan.</b> ${E(x.plan)}</div>`:""}
  <h3>Linked records</h3>${linked}</div></div>`);
}
/* ---------- trace ---------- */
function traceOpts(){const k=D.trace.kind;
 if(k==="entity")return PLAT.entities().map(e=>[e.id,e.label]);
 const apps=PLAT.APPS.map(a=>[a.id,a.n]);const ca=window.GATE&&GATE.apps?GATE.apps().map(a=>[a.id,a.n+" (citizen)"]):[];return apps.concat(ca)}
function traceHTML(){
 const tr=D.trace,opts=traceOpts();if(!opts.some(o=>o[0]===tr.id))tr.id=opts[0][0];
 const its=build().filter(x=>tr.kind==="entity"?x.ents.includes(tr.id):x.apps.includes(tr.id));const open=its.filter(x=>x.status!=="resolved");
 let aff=[],blast="";
 if(tr.kind==="entity"){const e=PLAT.ent(tr.id);aff=[{key:"w",label:"Apps that write it",rows:e.writers.map(a=>({id:a,t:nm(a),sub:"Writer",tag:"write"}))},{key:"r",label:"Apps that read it",rows:e.readers.map(a=>({id:a,t:nm(a),sub:"Reader",tag:"read"}))}];
  if(window.GATE&&GATE.apps){const ca=GATE.apps().filter(a=>(a.reads||[]).includes(tr.id)||(a.writes||[]).includes(tr.id));aff.push({key:"c",label:"Citizen apps using it",rows:ca.map(a=>({id:a.id,t:a.n,sub:a.tier+" tier, "+a.status,tag:"citizen"}))})}}
 else{const a=PLAT.app(tr.id)||(window.GATE&&GATE.app&&GATE.app(tr.id));const rd=(a&&a.reads)||[],wr=(a&&a.writes)||[];aff=[{key:"w",label:"Entities it writes",rows:wr.map(e=>({id:e,t:entL(e),sub:(PLAT.ent(e)||{}).owner||"",tag:"write"}))},{key:"r",label:"Entities it reads",rows:rd.map(e=>({id:e,t:entL(e),sub:(PLAT.ent(e)||{}).owner||"",tag:"read"}))}]}
 aff=aff.filter(g=>g.rows.length);
 try{if(window.LINKS&&LINKS.blast&&tr.kind==="entity"){const b=LINKS.blast(tr.id);const arr=Array.isArray(b)?b:(b&&(b.nodes||b.items||b.affected))||[];if(arr.length){aff.push({key:"b",label:"Blast radius from the links graph",rows:arr.slice(0,200).map((n,i)=>({id:"b"+i,t:String(n.label||n.n||n.title||n.id||n),sub:String(n.type||n.kind||""),tag:"blast"}))});blast=`<p class="small muted">Blast radius comes from the links module: ${arr.length} connected records.</p>`}}}catch(e){}
 const people={};its.forEach(x=>{people[x.owner]=1;people[x.steward]=1});
 const sel=`<div class="grid g2" style="gap:12px;align-items:end"><div class="fld"><span class="flab">Trace by</span><div class="fchips"><button class="chip" aria-pressed="${tr.kind==="entity"}" data-debt-tk="entity">Entity</button><button class="chip" aria-pressed="${tr.kind==="app"}" data-debt-tk="app">App</button></div></div><label class="fld"><span class="flab">${tr.kind==="entity"?"Entity":"App"}</span><select class="fin" data-debt-tsel>${opts.map(o=>`<option value="${E(o[0])}" ${o[0]===tr.id?"selected":""}>${E(o[1])}</option>`).join("")}</select></label></div>`;
 const list=its.length?`<div class="debt-list">${its.map(x=>`<button class="debt-li" data-debt-open="${E(x.id)}"><span class="debt-li-t">${E(x.title)}</span><span class="row small" style="gap:8px;flex-wrap:wrap">${typePill(x.type)}${sevPill(x.sev)}${stPill(x)}<span class="muted">${x.principal} h · ${E(x.owner)}</span></span></button>`).join("")}</div>`:`<p class="muted small">No debt items touch this ${tr.kind}. That is the goal.</p>`;
 return `${sel}<div class="dnote" data-role="story" style="margin:12px 0"><b>${open.length}</b> open debt item${open.length===1?"":"s"} touch ${E((opts.find(o=>o[0]===tr.id)||[0,tr.id])[1])}, worth <b>${open.reduce((a,x)=>a+x.principal,0)} hours</b> and about ${r1(open.reduce((a,x)=>a+x.interest,0))} hours a month. ${Object.keys(people).length} owners and stewards would be involved in fixing them.</div>${blast}
  <div class="grid g2" style="gap:16px;align-items:start">${card("Debt items touching this "+tr.kind,its.length+" total, "+open.length+" open",list)}${card("Who and what is affected","Owners, readers and writers",aff.length?lrHTML({id:"debt_tr_"+tr.kind+tr.id,groups:aff,limit:6}):"<p class='muted small'>No registered readers or writers.</p>")}</div>`;
}
/* ---------- burn-down ---------- */
const QS=["Q4 2026","Q1 2027","Q2 2027","Q3 2027"],SPR=[5,6,6,6];
function burnHTML(){
 const l=live().slice().sort((a,b)=>(SEVW[b.sev]*b.interest/Math.max(1,b.principal))-(SEVW[a.sev]*a.interest/Math.max(1,a.principal)));
 const hrs=D.hrs,total=l.reduce((a,x)=>a+x.principal,0),capQ=SPR.map(s=>s*hrs);
 let cum=0;const fin=l.map(x=>{cum+=x.principal;let q=-1,c=0;for(let i=0;i<4;i++){c+=capQ[i];if(cum<=c){q=i;break}}return{x,q}});
 const rem=[total];let c=0;capQ.forEach(cq=>{c+=cq;rem.push(Math.max(0,total-c))});
 const intLeft=[l.reduce((a,x)=>a+x.interest,0)];for(let i=0;i<4;i++)intLeft.push(r1(fin.filter(f=>f.q===-1||f.q>i).reduce((a,f)=>a+f.x.interest,0)));
 const totalCap=capQ.reduce((a,b)=>a+b,0),sprintsNeeded=hrs>0?Math.ceil(total/hrs):Infinity;
 const done=sprintsNeeded===Infinity?"never":sprintsNeeded<=0?"now":fD(iso(sprintsNeeded*14));
 const wait=r1(fin.reduce((a,f)=>a+f.x.interest*((f.q<0?5:f.q+1)*3),0));
 const ch=lineChart(["Now"].concat(QS),[{vals:rem,color:col("--accent"),area:true}],{w:620,h:220,max:Math.max(50,Math.ceil(total/50)*50),alt:"Remaining principal in hours by quarter"});
 const rows=QS.map((q,i)=>{const its=fin.filter(f=>f.q===i);return`<tr><td><b>${q}</b></td><td>${SPR[i]}</td><td>${capQ[i]} h</td><td class="small">${its.length?its.slice(0,4).map(f=>E(f.x.id)).join(", ")+(its.length>4?" +"+(its.length-4):""):"None finish here"}</td><td>${its.length}</td><td>${rem[i+1]} h</td><td>${intLeft[i+1]} h</td></tr>`}).join("");
 return `<div class="grid g2" style="gap:16px;align-items:start"><div>${card("What if: hours per sprint for debt","Platform team time reserved for paydown. Two-week sprints. Move the slider to see when the ledger reaches zero.",`<label class="fld"><span class="flab">Hours per sprint: <b data-role="metric">${hrs} h</b> (about ${Math.round(hrs/160*100)}% of a 4 person team)</span><input type="range" min="0" max="120" step="4" value="${hrs}" data-debt-hrs aria-label="Hours per sprint for debt paydown"></label>`)}
  ${kpiRow([["Debt-free by",done,sprintsNeeded===Infinity?"no capacity reserved":sprintsNeeded+" sprints"],["Capacity in 4 quarters",totalCap+" h","of "+total+" h principal"],["Cost of waiting",wait+" h","interest paid before each item is fixed"]])}</div>
  ${card("Remaining principal by quarter","Items are fixed in order of severity-weighted interest per hour of effort",ch)}</div>
  <div class="tscroll" style="margin-top:14px"><table><thead><tr><th>Quarter</th><th>Sprints</th><th>Capacity</th><th>Items finishing</th><th>Count</th><th>Principal left</th><th>Interest left a month</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="small muted">Plan built by the Registry Agent ${aiChip({model:"Registry Agent",conf:.82,title:"Paydown plan",note:"Orders open items by severity weight × monthly interest ÷ hours to fix, then fills quarterly capacity. A person approves the plan in sprint planning.",src:["Debt ledger","Platform team capacity"],guards:["Draft only","Sprint commitment stays with the team lead"]})}</p>`;
}
/* ---------- policy ---------- */
function policyHTML(){
 const c=ceil();const pol={policy_id:"debt-budget",effect:"forbid",principal:{type:"CitizenApp"},action:"promote",resource:{type:"CitizenApp",id:"?resource"},conditions:[{any:[{"gt":["resource.debt.principal_hours","ceiling[resource.tier].hours"]},{"gt":["resource.debt.high_items","ceiling[resource.tier].high"]},{"gt":["resource.debt.expired_exceptions",0]}]}],ceiling:{personal:c.personal,team:c.team,enterprise:c.enterprise},obligation:"Create fix tasks and notify the support owner"};
 const rows=["personal","team","enterprise"].map(k=>`<tr><td><b>${k[0].toUpperCase()+k.slice(1)}</b></td><td>${c[k].h} h</td><td>${c[k].high}</td><td>${c[k].exc} days</td><td class="small">${{personal:"Cannot request team tier until under the ceiling.",team:"Cannot go to review or enterprise tier; new features pause.",enterprise:"Certification is suspended and the app moves to sunset review."}[k]}</td></tr>`).join("");
 const apps=window.GATE&&GATE.apps?GATE.apps().filter(a=>a.status!=="sunset"):[];
 const st=apps.map(a=>{const s=DEBT.score(a.id),c2=s.ceiling;return`<tr><td><b>${E(a.n)}</b><div class="muted small">${E(a.tier)} tier, ${E(a.status)}</div></td><td>${s.principal} h of ${c2.h} h</td><td>${s.high}</td><td>${s.exceptions}</td><td>${s.over?pill_("Blocks promotion","bad"):pill_("Within budget","good")}</td></tr>`}).join("");
 return `<div class="dnote" data-role="story" style="margin-bottom:12px">Every citizen app has a <b>debt budget</b> set by its tier. An app over its budget cannot be promoted, cannot add new data, and is flagged on the board pack. The rule is written as a policy in the same readable shape the platform uses for all access rules, which stays compatible with OPA (Open Policy Agent) and Cedar.</div>
 <div class="row" style="gap:8px;margin-bottom:12px"><button class="btn primary" data-debt-ceil>Edit ceilings</button>${typeof stdChip==="function"&&window.STD&&STD.cobit?stdChip("cobit","Debt budgets follow the COBIT principle of managing risk against an agreed appetite."):""}</div>
 <div class="grid g2" style="gap:16px;align-items:start">${card("Debt ceiling per tier","What each tier may carry before promotion is blocked",`<div class="tscroll"><table><thead><tr><th>Tier</th><th>Principal ceiling</th><th>High items</th><th>Longest exception</th><th>What happens above it</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
 ${card("The policy as readable JSON","principal, action, resource, conditions",`<pre class="debt-code" tabindex="0">${E(JSON.stringify(pol,null,2))}</pre>`)}</div>
 <div style="margin-top:14px">${card("What blocks promotion today","Live from the ledger and the citizen app gate",apps.length?`<div class="tscroll"><table><thead><tr><th>Citizen app</th><th>Principal against ceiling</th><th>High items</th><th>Exceptions</th><th>Result</th></tr></thead><tbody>${st}</tbody></table></div>`:"<p class='muted small'>The citizen app gate is not loaded.</p>")}</div>`;
}
/* ---------- forms and events ---------- */
function reopenScreen(){bump();syncMetrics();render()}
function newExc(preset){
 preset=preset||{};
 const apps=PLAT.APPS.map(a=>[a.id,a.n]).concat(window.GATE&&GATE.apps?GATE.apps().map(a=>[a.id,a.n+" (citizen)"]):[]);
 openForm({id:"debt_exc",title:"Request an exception to the no-duplicate rule",submit:"Submit exception",
  story:"An exception lets an app keep its own copy or its own write path for a limited time. It creates a debt item with an owner and an expiry. When the date passes, a fix or decommission task is created for you automatically.",
  fields:[{section:"What you want to keep"},{k:"title",label:"What is the exception",type:"text",req:true,ph:"Own traveler list in the travel planner"},{k:"type",label:"Kind of debt",type:"select",opts:TYK.map(k=>[k,TY[k].n])},{k:"app",label:"App",type:"select",opts:apps},{k:"ent",label:"Entity it duplicates or writes",type:"select",opts:[["","None"]].concat(PLAT.entities().map(e=>[e.id,e.label]))},
   {section:"Accountability"},{k:"owner",label:"Owner who answers for it",type:"people",req:true},{k:"exp",label:"Expires on",type:"date",req:true,help:"Tier limit applies: personal 30 days, team 90, enterprise 180."},{k:"reason",label:"Why the platform entity does not fit",type:"longtext",req:true},{k:"ctrl",label:"Compensating control",type:"text",ph:"Weekly reconciliation by the owner"},{k:"sev",label:"Severity",type:"chips",opts:["Low","Medium","High"]}],
  defaults:Object.assign({type:"dup_entity",app:apps[0][0],ent:"",sev:"Medium",exp:iso(60)},preset),
  live:v=>{const ap=v.app,n=1,iv=interest(v.type||"dup_entity",n);const g=window.GATE&&GATE.app&&GATE.app(ap);const tier=(g&&g.tier)||"team";const lim=ceil()[tier].exc;const d=v.exp?days(TODAY,v.exp):0;const over=d>lim;const hit=v.ent?"":"";return `<div class="story"><b>What happens next.</b> A ${E(TY[v.type||"dup_entity"].n.toLowerCase())} item is added to the ledger as accepted with an expiry. Estimated interest: <b>${iv.h} h a month</b> (${E(iv.formula)}). ${v.exp?`Expires in ${d} days. ${over?`<b>This is longer than the ${tier} tier limit of ${lim} days; the data council must approve.</b>`:`Within the ${tier} tier limit of ${lim} days.`}`:""}</div>`},
  onSubmit:v=>{const id=DEBT.add({type:v.type,title:v.title,sev:v.sev||"Medium",source:"exception",ents:v.ent?[v.ent]:[],apps:[v.app],owner:nm(v.app),owner2:v.owner,steward:v.ent?(PLAT.ent(v.ent)||{}).steward:"Data council chair",principal:12,exp:v.exp,reason:v.reason+(v.ctrl?" Control: "+v.ctrl:""),status:"accepted",fix:"Exception until "+fD(v.exp)});
   audit("Exception requested",id+" "+v.title+" until "+v.exp);toast("Exception added: "+id,"good");closeDrawer();reopenScreen()}});
}
function actForm(act,id){
 const x=find(id);if(!x)return;
 if(act==="accept")openForm({id:"debt_acc",title:"Accept this debt for a limited time",submit:"Accept with expiry",story:"The item stays in the ledger but stops counting as overdue until the expiry date. When it expires it reopens and a task is created.",fields:[{k:"exp",label:"Accepted until",type:"date",req:true},{k:"who",label:"Accepted by",type:"people",req:true},{k:"why",label:"Reason",type:"longtext",req:true}],defaults:{exp:iso(90)},
  onSubmit:v=>{D.ov[id]=Object.assign(D.ov[id]||{},{st:"accepted",exp:v.exp,reason:v.why,note:"Accepted by "+v.who});bump();audit("Debt accepted",id+" until "+v.exp);toast("Accepted until "+fD(v.exp),"good");closeDrawer();reopenScreen()}});
 if(act==="assign")openForm({id:"debt_as",title:"Assign this debt item",submit:"Assign",story:"Assign to a team first. An individual is fine when they claim it or there is a reason. The assignee sees it in Person 360.",fields:[{k:"who",label:"Assign to",type:"people",req:true},{k:"why",label:"Reason",type:"text",ph:"Knows the integration"},{k:"go",label:"Start work now",type:"toggle"}],
  onSubmit:v=>{D.ov[id]=Object.assign(D.ov[id]||{},{assignee:v.who});if(v.go&&x.status==="open")D.ov[id].st="progress";bump();audit("Debt assigned",id+" to "+v.who);toast("Assigned to "+v.who,"good");closeDrawer();reopenScreen()}});
 if(act==="demand")openForm({id:"debt_dm",title:"Create a project or demand",submit:"Create",story:"Creates a demand record in Portfolio so the fix is funded and scheduled. The debt item moves to in progress and links to it.",fields:[{k:"kind",label:"Create as",type:"chips",opts:["Demand","Project"]},{k:"title",label:"Title",type:"text",req:true},{k:"cost",label:"Estimated cost",type:"money"}],defaults:{kind:"Demand",title:"Pay down: "+x.title,cost:x.principal*RATE},
  onSubmit:v=>{let ref="DT-"+(TASKS().length+1);try{if(window.addDemand){const r=addDemand({title:v.title,reason:"Debt item "+id,source:"Debt ledger",cost:Math.max(1,Math.round((v.cost||0)/1000)),kind:"Platform build",pm:"Casey Rowan"});if(r&&r.id)ref=r.id}}catch(e){}
   TASKS().push({id:ref,item:id,title:v.title,due:iso(30),owner:x.owner,kind:v.kind});D.ov[id]=Object.assign(D.ov[id]||{},{st:"progress",note:v.kind+" "+ref+" created"});bump();audit("Debt demand created",id+" "+ref);toast(v.kind+" created: "+ref,"good");closeDrawer();reopenScreen()}});
 if(act==="resolve")openForm({id:"debt_rs",title:"Mark resolved",submit:"Mark resolved",story:"Closes the item and removes its interest from the ledger. Evidence is kept in the audit trail.",fields:[{k:"how",label:"How was it resolved",type:"select",opts:["Fixed in the registry","Fixed in the app","Merged into the platform entity","App decommissioned","Not debt after review"]},{k:"ev",label:"Evidence",type:"text",ph:"Pull request, change record or link"}],
  onSubmit:v=>{D.ov[id]=Object.assign(D.ov[id]||{},{st:"resolved",closedBy:v.how,closed:TODAY});bump();audit("Debt resolved",id+" "+v.how);toast("Resolved: "+id,"good");closeDrawer();reopenScreen()}});
 if(act==="reopen"){delete D.ov[id];bump();audit("Debt reopened",id);toast("Reopened");closeDrawer();reopenScreen()}
}
document.addEventListener("click",e=>{
 let t=e.target.closest("[data-debt-open]");if(t){drawer(t.dataset.debtOpen);return}
 t=e.target.closest("[data-debt-act]");if(t){actForm(t.dataset.debtAct,t.dataset.id);return}
 t=e.target.closest("[data-debt-newexc]");if(t){newExc();return}
 t=e.target.closest("[data-debt-go]");if(t){closeDrawer();go(t.dataset.debtGo);return}
 t=e.target.closest("[data-debt-tk]");if(t){D.trace.kind=t.dataset.debtTk;D.trace.id=traceOpts()[0][0];const p=document.querySelector("[data-debt-trace]");if(p)p.innerHTML=traceHTML();return}
 t=e.target.closest("[data-debt-ceil]");if(t){const c=ceil();openForm({id:"debt_ceil",title:"Edit debt ceilings",submit:"Save ceilings",story:"Ceilings apply the next time an app is checked at the gate. Changes are audited and the data council is notified.",
   fields:[{section:"Principal ceiling in hours"},{k:"p",label:"Personal",type:"number"},{k:"t",label:"Team",type:"number"},{k:"e",label:"Enterprise",type:"number"},{section:"Longest exception in days"},{k:"xp",label:"Personal",type:"number"},{k:"xt",label:"Team",type:"number"},{k:"xe",label:"Enterprise",type:"number"}],
   defaults:{p:c.personal.h,t:c.team.h,e:c.enterprise.h,xp:c.personal.exc,xt:c.team.exc,xe:c.enterprise.exc},
   onSubmit:v=>{c.personal.h=+v.p;c.team.h=+v.t;c.enterprise.h=+v.e;c.personal.exc=+v.xp;c.team.exc=+v.xt;c.enterprise.exc=+v.xe;audit("Debt ceilings changed",JSON.stringify(v));toast("Ceilings saved","good");closeDrawer();reopenScreen()}})}
});
document.addEventListener("change",e=>{const t=e.target.closest("[data-debt-tsel]");if(t){D.trace.id=t.value;const p=document.querySelector("[data-debt-trace]");if(p)p.innerHTML=traceHTML()}});
document.addEventListener("input",e=>{const t=e.target.closest("[data-debt-hrs]");if(t){D.hrs=+t.value;const p=document.querySelector("[data-debt-burn]");if(p)p.innerHTML=burnHTML();const n=document.querySelector("[data-debt-hrs]");if(n)n.focus()}});
/* ---------- screen, process, search, chat ---------- */
REG("plat_debt","Technical debt ledger","platform","M4 20h16M6 20V10M12 20V4M18 20v-6M4 8l4 2 4-5 6 5",debtScreen);
DATA.screen("plat_debt",{mode:"data",entities:["tech_debt","builds"]});
PROC.reg("plat_debt",{title:"How technical debt is found, owned and paid down",std:["cobit","togaf"],steps:[
 {n:"Detect",d:"Detectors scan the registry, who reads and writes, connectors and the citizen app gate. Nothing is typed in.",who:"robot",owner:"Platform",out:"Debt items"},
 {n:"Classify and price",d:"The Registry Agent sets type, severity, interest and principal using the published formula.",who:"agent",owner:"Registry Agent",out:"Priced item"},
 {n:"Assign",d:"Routed to the owning team; an individual claims it or is assigned with a reason.",who:"human",owner:"Entity owner",sla:"2 days",out:"Owner"},
 {n:"Accept or schedule",d:"Accept with an expiry, or create a demand or project. Exceptions longer than the tier limit need the data council.",who:"gate",owner:"Data council",sla:"5 days",out:"Decision"},
 {n:"Fix and verify",d:"Apply the registry fix or change the app. The detector confirms the cause is gone and closes the item.",who:"robot",owner:"Platform",out:"Closed item"}]});
SEARCHX.push(()=>{const o=[{g:"Platform",t:"Technical debt ledger",m:"Items, exceptions, burn-down",c:"--bad-f",f:()=>go("plat_debt"),k:"technical debt ledger exceptions interest principal burn down"}];
 build().filter(x=>x.status!=="resolved").slice(0,80).forEach(x=>o.push({g:"Debt items",t:x.id+" "+x.title,m:x.sev,c:"--warn-f",f:()=>{go("plat_debt");setTimeout(()=>drawer(x.id),150)},k:x.type+" "+x.owner+" debt"}));return o});
ASKX.push(q=>{const t=q.toLowerCase();
 if(/(how much|total|show|open).*(tech(nical)? debt|debt ledger)|tech(nical)? debt|debt ledger/.test(t)){syncMetrics();const d=DEBT.totals(),ex=live().filter(x=>x.type==="expired").length;go("plat_debt");say(q,{t:"We carry "+d.n+" open debt items: "+d.principal+" hours to fix and about "+d.interest+" hours a month of interest ("+money(Math.round(d.interest*RATE))+"). "+ex+" exceptions have expired.",steps:["Opened the technical debt ledger","Totals come from the live detectors"]});return true}
 return false});
})();

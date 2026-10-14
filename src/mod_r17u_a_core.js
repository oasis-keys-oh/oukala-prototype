/* ===== Round 17, Agent U, part A: shared core for the Benefits tool (bud_ben) and Dashboards (r17u_dash).
   State (S.r17u, persisted with STORE.track), group approvals (reuse of the approval groups registry APG), the benefits model
   (register extension, computed checkpoints, needs-attention rules, net benefit and payback), metrics, and the Feature Contract wiring.
   Screens are in mod_r17u_b_ben.js (benefits) and mod_r17u_c_dsrc.js + mod_r17u_d_dash.js (dashboards). ===== */
(function(){
"use strict";
const W=window;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=x=>Array.isArray(x)?x:[];
const U=W.R17U=W.R17U||{};U.G=G;U.H=H;U.arr=arr;
/* ---------------- dates and numbers ---------------- */
const TODAY="2026-10-06",TD=Date.UTC(2026,9,6);
const dd=s=>new Date(s+"T00:00:00Z");
const iso=d=>new Date(d).toISOString().slice(0,10);
const addDays=(s,n)=>iso(dd(s).getTime()+n*864e5);
const daysTo=s=>Math.round((dd(s)-TD)/864e5);
const fmtD=s=>s?dd(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}):"";
const nf=(n,d)=>(+n||0).toLocaleString("en-US",{maximumFractionDigits:d==null?0:d,minimumFractionDigits:d||0});
const usd=n=>{n=Math.round(+n||0);const a=Math.abs(n);return (n<0?"-":"")+"$"+(a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e4?nf(a/1e3,0)+"K":nf(a))};
const usdF=n=>(Math.round(+n||0)<0?"-":"")+"$"+nf(Math.abs(Math.round(+n||0)));
U.TODAY=TODAY;U.dd=dd;U.iso=iso;U.addDays=addDays;U.daysTo=daysTo;U.fmtD=fmtD;U.nf=nf;U.usd=usd;U.usdF=usdF;
U.me=()=>G(()=>INBOX.me(),"Casey Rowan");
U.now=()=>"2026-10-06 "+new Date().toTimeString().slice(0,5);
const csvq=v=>{v=String(v==null?"":v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
U.csv=rows=>rows.map(r=>r.map(csvq).join(",")).join("\r\n");
U.download=(name,text,type)=>{try{const b=new Blob([text],{type:type||"text/csv;charset=utf-8"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},500);return true}catch(e){return false}};
U.audit=(a,d)=>G(()=>audit(a,d),0);
U.emit=(id,p)=>G(()=>W.EVENTS&&EVENTS.emit&&EVENTS.emit(id,p||{},{source:"r17u",actor:U.me()}));
const isHuman=n=>!!n&&G(()=>DIR.some(d=>d.name===n&&d.kind==="human"),false);
U.isHuman=isHuman;

/* ---------------- state ---------------- */
const X=S.r17u=S.r17u||{};
X.ben=X.ben||{x:{},log:[],chg:[],seq:1,hz:3};
X.appr=X.appr||{items:[],seq:1};
X.dash=X.dash||{items:null,def:{},F:{range:"90d",owner:"",pf:""},seq:1,sched:{},runs:[],last:{}};
X.ui=X.ui||{};   /* not persisted: edit mode, undo stack, selections */
G(()=>{if(W.STORE&&STORE.track){STORE.track("r17u.ben");STORE.track("r17u.appr");STORE.track("r17u.dash")}});

/* ================================================================ group approvals (reuse of APG) ================================================================ */
/* kind -> {group id, how to apply when approved, how to describe}. Every approval goes to a GROUP, never a person. */
const KINDS={};U.apprKinds=KINDS;
function groupInfo(kind){const k=KINDS[kind];if(!k)return null;
 if(k.apg){const g=G(()=>APG.get(k.apg),null);if(g)return {id:g.id,name:g.name,members:g.members.slice(),quorum:g.quorum||{mode:"any",n:1},qtext:G(()=>APG.quorumText(g),"1 of "+g.members.length)}}
 const d=G(()=>DASHX.D.group,null);if(d)return {id:"dash_gov",name:d.name,members:d.members.slice(),quorum:{mode:"any",n:1},qtext:"1 of "+d.members.length};
 return {id:"none",name:"Approver group",members:[],quorum:{mode:"any",n:1},qtext:"1"}}
U.groupInfo=groupInfo;
function needed(gi){return gi.quorum&&gi.quorum.mode==="nofm"?(gi.quorum.n||1):1}
function propose(kind,subject,payload,note,by){
 const gi=groupInfo(kind);if(!gi)return null;by=by||U.me();
 const rec={id:"GA-"+(X.appr.seq++),kind,subject,group:gi.name,gid:gi.id,need:needed(gi),by,at:U.now(),status:"pending",votes:[],payload:payload||{},note:note||""};
 X.appr.items.unshift(rec);U.audit("sent to approver group",rec.id+" "+kind+" · "+gi.name+" · "+subject);
 U.emit(KINDS[kind].evt+".proposed",{id:rec.id,group:gi.name});return rec}
function canVote(rec,who){const gi=groupInfo(rec.kind);who=who||U.me();
 if(rec.status!=="pending")return {ok:false,why:"Already "+rec.status};
 if(!gi.members.includes(who))return {ok:false,why:"Only members of "+gi.name+" can decide. Switch role to a member ("+gi.members.slice(0,3).join(", ")+") to try it."};
 if(rec.by===who)return {ok:false,why:"You proposed this; another member of "+gi.name+" must decide (separation of duties)."};
 if(rec.votes.some(v=>v.by===who))return {ok:false,why:"You already decided on this one."};
 return {ok:true,why:""}}
function vote(id,ok,note){const rec=X.appr.items.find(x=>x.id===id);if(!rec)return {ok:false,why:"Not found"};
 const c=canVote(rec);if(!c.ok){G(()=>toast(c.why,"bad"));U.audit("denied: group decision",id+" "+U.me());return c}
 const who=U.me();rec.votes.push({by:who,ok:!!ok,at:U.now(),note:note||""});
 G(()=>APG.record(rec.gid,who,ok?"approve":"reject",rec.id,note||rec.subject));
 if(!ok){rec.status="rejected";U.audit("rejected by group",rec.id+" "+who);U.emit(KINDS[rec.kind].evt+".decided",{id:rec.id,decision:"rejected"});G(()=>toast("Rejected. The proposer is told.","good"));return {ok:true}}
 const yes=rec.votes.filter(v=>v.ok).length;
 if(yes>=rec.need){rec.status="approved";rec.decidedAt=U.now();G(()=>KINDS[rec.kind].apply(rec));U.audit("approved by group",rec.id+" "+rec.group+" ("+yes+" of "+rec.need+")");U.emit(KINDS[rec.kind].evt+".decided",{id:rec.id,decision:"approved"});G(()=>toast("Approved by "+rec.group+". The change is now live.","good"))}
 else{U.audit("group vote recorded",rec.id+" "+yes+" of "+rec.need);G(()=>toast("Your approval is recorded ("+yes+" of "+rec.need+"). Waiting for another member.","good"))}
 return {ok:true}}
U.gapp={propose,vote,canVote,items:kind=>X.appr.items.filter(x=>!kind||x.kind===kind),pending:kind=>X.appr.items.filter(x=>x.status==="pending"&&(!kind||x.kind===kind)),info:groupInfo};

/* ================================================================ benefits model ================================================================ */
const B=()=>G(()=>BUDX.B(),{ben:[],lines:[]});
const PJ=id=>G(()=>PROJ.find(p=>p.id===id),null);
const PRG=G(()=>BUDX.PRG,{});
const TYPES=["Cost saving","Cost avoidance","Revenue","Risk reduction","Productivity"];
const TYC={"Cost saving":"--s3","Cost avoidance":"--e4","Revenue":"--w1","Risk reduction":"--u3","Productivity":"--p4"};
const CURQ=1,NQ=8;
const qStart=i=>iso(Date.UTC(2026,6+3*i,1));
const qEnd=i=>iso(Date.UTC(2026,9+3*i,1)-864e5);
const qLab=i=>"Q"+(i%4+1)+" FY"+(27+Math.floor(i/4));
const qMon=i=>["Jul to Sep","Oct to Dec","Jan to Mar","Apr to Jun"][i%4]+" "+(2026+Math.floor((i+2)/4));
const qOf=s=>{const d=dd(s),m=(d.getUTCFullYear()-2026)*12+d.getUTCMonth()-6;return Math.floor(m/3)};
const annual=b=>b.drv.hrs?b.drv.hrs*b.drv.rate:b.drv.pr?b.drv.pr*b.drv.imp:(b.drv.amt||0);
const planQ=(b,q)=>q<b.start?0:(q<b.start+2?.5:1)*annual(b)/4;
const frac=q=>{const a=dd(qStart(q)).getTime(),e=dd(qEnd(q)).getTime()+864e5;return Math.min(1,Math.max(0,(TD-a)/(e-a)))};
Object.assign(U,{TYPES,TYC,CURQ,NQ,qStart,qEnd,qLab,qMon,qOf,annual,planQ,frac,PJ,PRG});
/* extension record per benefit (the register itself stays in S.bud.ben so every other screen keeps working) */
const SEED={
 "BEN-1":{kind:"Productivity",backup:"Marcus Webb",base:{v:23,u:"days to publish a standard",src:"Time study of 14 standards"},tgt:{v:15,u:"days to publish a standard"},msrc:{t:"manual",r:"Time study of recent standards, editorial timesheets"},line:"PR1-LAB",last:null,ownerP:"Elena Marsh"},
 "BEN-2":{kind:"Cost saving",backup:"Sam Patel",base:{v:142000,u:"$ a year, legacy host and licences",src:"Hosting invoices, FY26"},tgt:{v:0,u:"$ a year, legacy host and licences"},msrc:{t:"field",r:"invoice.amount"},line:"PR1-CLD",last:"2026-09-30"},
 "BEN-3":{kind:"Revenue",backup:"",base:{v:8400,u:"titles sold a year",src:"Sales forecast model, seed"},tgt:{v:8600,u:"titles sold a year"},msrc:{t:"manual",r:"Sales forecast model: titles sold, net margin"},line:"PR1-VEN",last:null},
 "BEN-4":{kind:"Productivity",backup:"Jordan Lee",base:{v:430,u:"hours a month on reconciliation",src:"Analyst timesheet sample, Aug 2026"},tgt:{v:30,u:"hours a month on reconciliation"},msrc:{t:"manual",r:"Analyst timesheet sample"},line:"PR2-LAB",last:null},
 "BEN-5":{kind:"Risk reduction",backup:"",base:null,tgt:{v:2,u:"publication corrections a year"},msrc:{t:"manual",r:"Publication correction log"},line:"PR2-VEN",last:null},
 "BEN-6":{kind:"Risk reduction",backup:"Sam Patel",base:{v:5.5,u:"Tier 1 downtime hours a year",src:"Outage log, FY26"},tgt:{v:1,u:"Tier 1 downtime hours a year"},msrc:{t:"metric",r:"m_avail"},line:"PR3-CLD",last:null},
 "BEN-7":{kind:"Productivity",backup:"Nia Brooks",base:{v:7.4,u:"hours to restore, priority 2",src:"Incident records, seed"},tgt:{v:6.2,u:"hours to restore, priority 2"},msrc:{t:"metric",r:"m_itsm_mttr"},line:"PR3-LAB",last:"2026-07-02"},
 "BEN-8":{kind:"Productivity",backup:"Priya Shah",base:null,tgt:{v:1.4,u:"hours a week searching per person"},msrc:{t:"manual",r:"Legal and finance search log"},line:"PR4-LAB",last:null},
 "BEN-9":{kind:"Cost avoidance",backup:"Camille Ortega",base:{v:6,u:"unreviewed auto-renewals a year",src:"Renewal tracker"},tgt:{v:0,u:"unreviewed auto-renewals a year"},msrc:{t:"metric",r:"m_renew"},line:"PR4-VEN",last:"2026-08-14"},
 "BEN-10":{kind:"Cost saving",backup:"Avery Chen",base:{v:96000,u:"$ a year, LegacyDocs support",src:"Contract CT-109"},tgt:{v:0,u:"$ a year, LegacyDocs support"},msrc:{t:"field",r:"invoice.amount"},line:"PR4-LIC",last:null}};
const ROLEP={"Chief Editor":"Elena Marsh"};
function ext(b){const e=X.ben.x[b.id];if(e)return e;const s=SEED[b.id]||{kind:b.ty==="Productivity hours"?"Productivity":b.ty,backup:"",base:null,tgt:null,msrc:{t:"manual",r:""},line:"",last:null};
 return X.ben.x[b.id]=JSON.parse(JSON.stringify(s))}
/* seed every record once, so the persisted snapshot is stable */
function seedAll(){B().ben.forEach(b=>ext(b))}
seedAll();
const kindOf=b=>ext(b).kind||"Cost avoidance";
const ownerP=b=>{const e=ext(b);if(e.ownerP&&isHuman(e.ownerP))return e.ownerP;if(isHuman(b.own))return b.own;return ROLEP[b.own]||""};
const startD=b=>ext(b).start||qStart(b.start);
const endD=b=>ext(b).end||iso(Date.UTC(2026,6+3*b.start+36,1)-864e5);
const lastMeas=b=>{const l=X.ben.log.filter(x=>x.ben===b.id).map(x=>x.date).sort().pop();const e=ext(b);return [l,e.last].filter(Boolean).sort().pop()||null};
const resolves=m=>{if(!m||!m.r)return null;if(m.t==="metric")return !!G(()=>METRICS[m.r],null);if(m.t==="field"){const p=m.r.split(".");return !!G(()=>DATAMODEL.fields(p[0]).some(f=>f.k===p[1]),false)}return null};
Object.assign(U,{ext,kindOf,ownerP,startD,endD,lastMeas,resolves});
/* checkpoints: one per benefit per quarter with a plan. Status is computed, never typed in. */
function checkpoints(b){const out=[];
 for(let q=0;q<NQ;q++){const plan=planQ(b,q);if(plan<=0)continue;const real=b.real[q];const due=qEnd(q);let st,why,kind;
  if(q<CURQ){kind="Closed";if(real==null){st="Missed";why="No measurement recorded for a closed quarter"}else{const r=real/plan;st=r>=.9?"On track":r>=.75?"At risk":"Missed";why=Math.round(r*100)+"% of the "+usd(plan)+" planned"}}
  else if(q===CURQ){kind="Current";const f=frac(q),pt=plan*f;if(real==null){const d=daysTo(due);st=d>30?"On track":"At risk";why=d>30?"Not due until "+fmtD(due)+"; "+d+" days left":"Due in "+d+" days and nothing recorded"}else{const r=real/Math.max(pt,1);st=r>=.9?"On track":r>=.75?"At risk":"Missed";why=usd(real)+" recorded against "+usd(pt)+" planned to date ("+Math.round(f*100)+"% of the quarter)"}}
  else{kind="Forecast";st=b.conf>=.65?"On track":"At risk";why="Forecast "+usd(plan*b.conf)+" = "+usd(plan)+" planned × "+Math.round(b.conf*100)+"% confidence"}
  out.push({q,lab:qLab(q),mon:qMon(q),due,plan,real:real==null?null:real,st,why,kind})}
 return out}
U.checkpoints=checkpoints;
const STC={"On track":"good","At risk":"warn","Missed":"bad"};U.STC=STC;
/* status of one benefit = worst of its closed and current checkpoints, else its next forecast checkpoint */
function bStatus(b){const c=checkpoints(b);if(!c.length)return ["Not started","mute"];const cur=c.filter(x=>x.kind!=="Forecast");const pool=cur.length?cur:c.slice(0,1);
 const rank={"On track":0,"At risk":1,"Missed":2};const w=pool.reduce((a,x)=>rank[x.st]>rank[a.st]?x:a,pool[0]);return [w.st,STC[w.st]]}
U.bStatus=bStatus;
/* needs attention */
function flagsOf(b){const f=[],e=ext(b),own=ownerP(b);
 if(!own)f.push({k:"owner",t:"Owner is a team or role ("+b.own+"), not a named person",fix:"Name a person as owner"});
 if(!e.backup)f.push({k:"backup",t:"No backup named",fix:"Name a backup who is a different person"});
 else if(e.backup===own||e.backup===b.own)f.push({k:"backup",t:"Backup is the same as the owner",fix:"Name a different person"});
 else if(!isHuman(e.backup))f.push({k:"backup",t:"Backup is not a named employee ("+e.backup+")",fix:"Name an employee"});
 if(!e.base||e.base.v==null||e.base.v==="")f.push({k:"baseline",t:"No baseline recorded",fix:"Record the value before the initiative"});
 const sd=startD(b);if(daysTo(sd)<=0){const l=lastMeas(b)||sd,age=-daysTo(l);if(age>90)f.push({k:"meas",t:"No measurement in "+age+" days"+(lastMeas(b)?"":" since the start"),fix:"Record an actual"})}
 if(!e.line||!G(()=>B().lines.some(l=>l.id===e.line),false))f.push({k:"line",t:"Not linked to a budget line",fix:"Link the funding line"});
 return f}
U.flagsOf=flagsOf;
U.attention=()=>B().ben.map(b=>({b,f:flagsOf(b)})).filter(x=>x.f.length);
/* totals: planned to date = closed quarters + the current quarter prorated by days elapsed. Realized = everything recorded up to the current quarter. */
function toDate(list){list=list||B().ben;let plan=0,real=0,cq=0;
 list.forEach(b=>{for(let q=0;q<=CURQ;q++){const p=planQ(b,q);plan+=q<CURQ?p:p*frac(q);real+=b.real[q]||0}cq+=b.real[CURQ]||0});
 return {plan,real,cq,pct:plan?Math.round(real/plan*100):100}}
U.benToDate=()=>toDate();U.toDate=toDate;
/* cumulative series for the timeline chart */
function series(list){list=list||B().ben;const plan=[],adj=[],real=[];let cp=0,ca=0,cr=0;
 for(let q=0;q<NQ;q++){const p=list.reduce((a,b)=>a+planQ(b,q),0);cp+=p;plan.push(cp);
  if(q<=CURQ){cr+=list.reduce((a,b)=>a+(b.real[q]||0),0);real.push(cr);ca+=q<CURQ?list.reduce((a,b)=>a+(b.real[q]||0),0):Math.max(list.reduce((a,b)=>a+(b.real[q]||0),0),list.reduce((a,b)=>a+planQ(b,q)*b.conf,0));adj.push(ca)}
  else{ca+=list.reduce((a,b)=>a+planQ(b,q)*b.conf,0);adj.push(ca);real.push(null)}}
 return {plan,adj,real}}
U.series=series;
/* money: linked budget line, project cost, net benefit and payback (computed) */
function lineOf(b){const id=ext(b).line;return G(()=>B().lines.find(l=>l.id===id),null)}
function initiative(pid,hz){hz=hz||X.ben.hz||3;const lines=B().lines.filter(l=>l.p===pid),bs=B().ben.filter(b=>b.p===pid);
 const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),cost=sum(lines,l=>l.fcst),funded=sum(lines,l=>l.appr),act=sum(lines,l=>l.act);
 const nq=4*hz;let plan=0,adj=0;const cum=[];let c=0;
 for(let q=0;q<Math.max(nq,20);q++){const p=sum(bs,b=>planQ(b,q)),a=sum(bs,b=>planQ(b,q)*b.conf);if(q<nq){plan+=p;adj+=a}c+=a;cum.push(c)}
 let pb=null;for(let q=0;q<cum.length;q++){if(cum[q]>=cost&&cost>0){const prev=q?cum[q-1]:0,fr=(cost-prev)/Math.max(1,cum[q]-prev);pb=(q+fr)*3;break}}
 const net=adj-cost;return {pid,name:G(()=>PJ(pid).short,pid),cost,funded,act,plan,adj,net,roi:cost?net/cost:null,payback:pb,hz,nb:bs.length,over:cost>funded}}
U.initiative=initiative;
U.payDate=m=>m==null?"beyond five years":fmtD(iso(Date.UTC(2026,6,1)+Math.round(m*30.4375)*864e5));
function totalsNet(hz){const ps=[...new Set(B().ben.map(b=>b.p))].map(p=>initiative(p,hz));const s=f=>ps.reduce((a,x)=>a+f(x),0);return {ps,cost:s(x=>x.cost),adj:s(x=>x.adj),plan:s(x=>x.plan),net:s(x=>x.net)}}
U.totalsNet=totalsNet;
/* realization by dimension */
function groupBy(dim){const m=new Map();
 B().ben.forEach(b=>{const key=dim==="owner"?(ownerP(b)||b.own):dim==="portfolio"?(PRG[b.p]||b.p):dim==="type"?kindOf(b):b.p;
  const r=m.get(key)||{key,n:0,ann:0,plan:0,real:0,risk:0,fc:0};r.n++;r.ann+=annual(b);const t=toDate([b]);r.plan+=t.plan;r.real+=t.real;
  r.risk+=[1,2,3,4].reduce((a,i)=>a+planQ(b,i),0)*(1-b.conf);r.fc+=[2,3,4,5].reduce((a,i)=>a+planQ(b,i)*b.conf,0);m.set(key,r)});
 return [...m.values()].sort((a,b)=>b.ann-a.ann)}
U.groupBy=groupBy;

/* ---------- approval kinds ---------- */
KINDS.ben_target={apg:"apg_portfolio_board",evt:"benefit.target_change",apply(rec){const p=rec.payload,b=B().ben.find(x=>x.id===p.ben);if(!b)return;const e=ext(b);
  if(p.tgt!=null&&p.tgt!==""){e.tgt=Object.assign({},e.tgt||{u:""},{v:+p.tgt})}
  if(p.annual&&+p.annual>0){const a=+p.annual;if(b.drv.hrs)b.drv.hrs=Math.round(a/b.drv.rate);else if(b.drv.pr)b.drv.imp=Math.round(a/b.drv.pr);else b.drv.amt=Math.round(a)}
  e.tgtLog=(e.tgtLog||[]);e.tgtLog.push({at:U.now(),by:rec.by,group:rec.group,why:rec.note});U.syncMetrics()}};
KINDS.dash_publish={evt:"dashboard.publish",apply(rec){G(()=>U.dashApplyPublish&&U.dashApplyPublish(rec))}};

/* ---------- record an actual (writes the register and the log, totals update at once) ---------- */
U.recordActual=function(o){const b=B().ben.find(x=>x.id===o.ben);if(!b)return {ok:false,why:"Unknown benefit"};const amt=+o.amount;if(!(amt>0))return {ok:false,why:"Enter an amount above zero"};
 const q=+o.q,date=o.date||TODAY;if(date>TODAY)return {ok:false,why:"The measurement date is in the future"};
 b.real[q]=(b.real[q]||0)+amt;if(o.conf!=null&&o.conf!==""&&!isNaN(+o.conf))b.conf=Math.min(1,Math.max(.1,+o.conf));
 if(o.ev)b.ev=o.ev+(o.how?" ("+o.how+")":"");
 const rec={id:"BA-"+(X.ben.seq++),ben:b.id,q,date,amount:amt,how:o.how||"",ev:o.ev||"",by:U.me()};X.ben.log.unshift(rec);
 G(()=>{if(W.STORE&&STORE.put){STORE.define&&STORE.define("benefit_actual",ENT_DEFS().benefit_actual);STORE.put("benefit_actual",{id:rec.id,benefit:b.id,quarter:qLab(q),measured_on:date,amount:amt,method:rec.how,evidence:rec.ev,recorded_by:rec.by})}});
 U.syncMetrics();U.audit("recorded benefit actual",b.id+" "+qLab(q)+" "+usd(amt));U.emit("benefit.actual_recorded",{id:rec.id,benefit:b.id,amount:amt});
 return {ok:true,rec,b}};

/* ================================================================ metrics ================================================================ */
const OWN={ben:["Maya Ortiz","Priya Shah"],dash:["Jordan Lee","Maya Ortiz"]};U.OWN=OWN;
const M0=(id,n,f,u,cur,tgt,bad,dir,mx,own,rem,use)=>{if(typeof METRICS==="undefined"||METRICS[id])return;METRICS[id]={n,f,u,cur,tgt,badAt:bad,dir,max:mx,tr:[0,1,2,3,4,5,6,7].map(i=>Math.round((cur+(dir==="max"?-1:1)*(7-i)*mx*.01)*10)/10),owner:own,use:use||["Benefits realization"],rem}};
const REM=(t,a,p,ref)=>({kind:"sop",ref:ref||"SOP-BEN-01",title:t,agent:a||"Benefits Agent",auto:false,state:"idle",prog:p||"Lists the records that pull this figure down and who owns them"});
M0("m_ben_cover","Benefits with owner, backup and baseline","Benefits with a named person as owner, a different named backup and a recorded baseline ÷ Benefits × 100","%",50,100,60,"max",100,OWN.ben[0],REM("Name an owner, a backup and record a baseline for each flagged benefit"),["Benefits realization"]);
M0("m_ben_attn","Benefits needing attention","Benefits with at least one flag: no owner or backup, no baseline, no budget line link, or no measurement in 90 days","",7,0,5,"min",10,OWN.ben[0],REM("Work the Needs attention list in order of annual value"),["Benefits realization"]);
M0("m_ben_chk","Benefit checkpoints on track","Checkpoints in closed and current quarters with status On track ÷ Checkpoints in closed and current quarters × 100 (status is computed from recorded actuals against plan)","%",50,90,60,"max",100,OWN.ben[0],REM("Ask owners of at-risk checkpoints for a recovery step"),["Benefits realization"]);
M0("m_ben_net","Net benefit, risk adjusted","Σ over initiatives of (planned benefit × confidence over the horizon − forecast cost of the funded budget lines)","$K",0,0,0,"max",3000,OWN.ben[0],REM("Re-test the drivers of the weakest initiative"),["Benefits realization"]);
M0("m_dash_bound","Dashboard tiles bound to a governed source","Tiles whose source is a certified metric or a registry measure with an owner ÷ all tiles on published dashboards × 100","%",100,100,90,"max",100,OWN.dash[0],REM("Rebind a tile to a metric or registry measure","Portfolio Agent",null,"SOP-DASH-01"),["Dashboards"]);
M0("m_dash_owned","Dashboards with an owner and a different backup","Published dashboards with a named person as owner and another named person as backup ÷ published dashboards × 100","%",100,100,80,"max",100,OWN.dash[0],REM("Name a backup for each dashboard without one","Portfolio Agent",null,"SOP-DASH-02"),["Dashboards"]);
M0("m_dash_pubq","Dashboard publications waiting on the group","Dashboard publications sent to the approver group and not yet decided","pubs",1,0,3,"min",6,OWN.dash[0],REM("Nudge the approver group","Portfolio Agent",null,"SOP-DASH-03"),["Dashboards"]);
U.syncMetrics=function(){if(typeof METRICS==="undefined")return;
 const bs=B().ben,n=bs.length||1;
 const cov=bs.filter(b=>{const f=flagsOf(b).map(x=>x.k);return !f.includes("owner")&&!f.includes("backup")&&!f.includes("baseline")}).length;
 const at=U.attention().length;
 let ok=0,tot=0;bs.forEach(b=>checkpoints(b).filter(c=>c.kind!=="Forecast").forEach(c=>{tot++;if(c.st==="On track")ok++}));
 const t=totalsNet(X.ben.hz||3),td=toDate();
 const set=(id,v,f)=>{const m=METRICS[id];if(!m)return;m.cur=v;if(f)m.f=f;m.tr[m.tr.length-1]=v};
 set("m_ben_cover",Math.round(cov/n*100),"Benefits with a named owner, a different named backup and a baseline ("+cov+" of "+bs.length+") ÷ Benefits × 100");
 set("m_ben_attn",at,"Benefits with at least one flag ("+at+" of "+bs.length+"): no owner or backup, no baseline, no budget line, or no measurement in 90 days");
 set("m_ben_chk",tot?Math.round(ok/tot*100):100,"Checkpoints in closed and current quarters on track ("+ok+" of "+tot+"); status computed from recorded actuals against plan");
 set("m_ben_net",Math.round(t.net/1e3),"Σ over initiatives of planned benefit × confidence over "+(X.ben.hz||3)+" years ("+usd(t.adj)+") − forecast cost of funded lines ("+usd(t.cost)+") = "+usd(t.net));
 const m=METRICS.m_benefit;if(m){m.cur=td.pct;m.f="Benefits recorded to date ("+usd(td.real)+") ÷ Benefits planned to date ("+usd(td.plan)+"): closed quarters plus the current quarter prorated by days elapsed";m.tr[m.tr.length-1]=td.pct}
 G(()=>U.syncDashMetrics&&U.syncDashMetrics())};
U.syncMetrics();

/* ================================================================ Feature Contract: entities, process, links, owners ================================================================ */
const F=(k,l,t,c,a)=>[k,l,t,c||"internal",a||"platform"];
const ENT_DEFS=()=>({
 benefit_actual:{label:"Benefit actual",domain:"fin",fields:[{k:"benefit",label:"Benefit",type:"ref"},{k:"quarter",label:"Quarter",type:"string"},{k:"measured_on",label:"Measured on",type:"date"},{k:"amount",label:"Amount",type:"number"},{k:"method",label:"Method",type:"string"},{k:"evidence",label:"Evidence",type:"string"},{k:"recorded_by",label:"Recorded by",type:"string"}]}});
const BEN_EXT=[F("backup","Backup","ref","personal"),F("baseline_value","Baseline value","number"),F("baseline_unit","Baseline unit","string"),F("target_value","Target value","number"),F("measure_source","Measure source (metric or field)","string"),F("start_date","Start date","date"),F("end_date","End date","date"),F("budget_line","Budget line","ref"),F("benefit_kind","Benefit type","enum")];
const DASH_EXT=[F("backup","Backup","ref","personal"),F("status","Status","enum"),F("version","Version","number"),F("default_for","Default for persona or role","string"),F("shared_with","Shared with groups","string"),F("published_by_group","Approver group","string"),F("template","Template","string")];
function extendEntity(id,fields){const t=G(()=>DATAMODEL.tables[id],null);if(!t||!t.fields)return false;let n=0;fields.forEach(f=>{if(t.fields.some(x=>x.k===f[0]))return;t.fields.push({k:f[0],label:f[1],type:f[2],authority:f[4],classification:f[3],ext:true,extBy:"Round 17, benefits and dashboards"});n++});return true}
const BEN_SPEC={key:"r17u_ben",name:"Benefits realization",screen:"bud_ben",
 ent:[{id:"benefit_checkpoint",label:"Benefit checkpoint",how:"new",n:60,note:"Integration decision: new and thin, referencing benefit. A checkpoint is a quarter's planned amount, the recorded actual and a computed status (on track, at risk, missed). Nothing parallel exists: benefit holds the register line, approval holds decisions. Status is derived, never stored by hand.",fields:[F("benefit","Benefit","ref"),F("quarter","Quarter","string"),F("due","Due date","date"),F("planned","Planned amount","number"),F("actual","Recorded actual","number"),F("status","Status (computed)","enum")]},
  {id:"benefit_actual",label:"Benefit actual",how:"new",n:20,note:"Integration decision: new and thin, referencing benefit. An actual is one dated measurement with its method and evidence, so the audit trail shows who recorded what and when. The register keeps only the running total per quarter.",fields:F2([["benefit","Benefit","ref"],["quarter","Quarter","string"],["measured_on","Measured on","date"],["amount","Amount","number"],["method","Method","string"],["evidence","Evidence","string"],["recorded_by","Recorded by","ref","personal"]])}],
 mod:{id:"bud_ben",sn:"Benefits realization",band:"str",own:OWN.ben[0],r:["benefit","project","budget_line","demand_request","objective","person"],w:["benefit","benefit_checkpoint","benefit_actual","approval"],
  flows:[["pull","bud_over","Funding line approved, committed, forecast","budget_line","api","Screen opened"],["pull","ppm_proj","Project cost and delivery status","project","api","Screen opened"],["pull","strat_exec","Goal to funded work","objective","api","Screen opened"],["push","inbox","Target changes for the Portfolio board","approval","event","Target change proposed"],["push","exe_dash","Realized benefit and net benefit","benefit","batch","Daily"],["push","r17q_value","Measured benefit for the value case","benefit","api","Actual recorded"],["push","plat_debt","Benefits without owner, backup or baseline","debt_item","batch","Weekly"]]},
 proc:{id:"benefits_realization",name:"Benefits realization",owner:OWN.ben[0],backup:OWN.ben[1],trigger:"A funded initiative has a business case, or a checkpoint quarter closes",steps:[
  ["Register","Each funded initiative lists its benefits with type, baseline, target, measure source, owner and a different backup.","human",OWN.ben[0],"2 weeks","Business case","Benefit record"],
  ["Link funding","The benefit is tied to the budget line that pays for the work, so net benefit and payback use real cost.","human",OWN.ben[0],"1 week","Benefit record","Linked benefit"],
  ["Measure","The owner records the actual for each quarter with method and evidence; totals and checkpoints update at once.","human","Benefit owner","Quarter end + 10 days","Linked benefit","Recorded actual"],
  ["Compute checkpoints","Status per quarter is computed from actual against plan; the register flags missing owners, backups, baselines and measurements older than 90 days.","auto","Automatic","Instant","Recorded actual","Checkpoint status"],
  ["Review target changes","A change to a target or planned amount is decided by the Portfolio board group; the proposer cannot decide.","gate","Portfolio board","1 week","Change request","Approved target"],
  ["Report","Realized and net benefit flow to the executive dashboard and the value case.","auto","Automatic","Daily","Checkpoint status","Reported value"]],
  inputs:["Business case","Budget lines"],outputs:["Realized benefit","Net benefit and payback"],entities:["benefit","benefit_checkpoint","benefit_actual","budget_line","approval"],metrics:["m_ben_cover","m_ben_attn","m_ben_chk","m_ben_net","m_benefit"]}};
function F2(a){return a.map(x=>F(x[0],x[1],x[2],x[3],x[4]))}
const DASH_SPEC={key:"r17u_dash",name:"Dashboards",screen:"r17u_dash",
 ent:[{id:"dashboard_tile",label:"Dashboard tile",how:"new",n:30,note:"Integration decision: new and thin, referencing dashboard. A tile is one bound view (metric card, trend, bar, table, list or ring) with its source, size and position. dashboard_layout stores how a person arranges an existing screen; it cannot hold a tile bound to a metric or a registry measure.",fields:F2([["dashboard","Dashboard","ref"],["tile_type","Tile type","enum"],["source","Source (metric or registry measure)","string"],["width","Width (of 12)","number"],["height","Height rows","number"],["position","Position","number"],["title","Title","string"]])}],
 mod:{id:"r17u_dash",sn:"Dashboards",band:"str",own:OWN.dash[0],r:["dashboard","metric_definition","incident","change_request","project","budget_line","benefit","business_service","person"],w:["dashboard","dashboard_tile","report_schedule","approval"],
  flows:[["pull","r15_sem","Governed measures","metric_definition","api","Tile rendered"],["pull","itsm_inc","Incidents for service desk tiles","incident","api","Tile rendered"],["pull","bud_over","Budget lines for finance tiles","budget_line","api","Tile rendered"],["pull","bud_ben","Benefits for value tiles","benefit","api","Tile rendered"],["push","inbox","Publication approvals for the dashboard group","approval","event","Dashboard sent for publication"],["push","exe_dash","Published dashboards for the leadership view","dashboard","api","Dashboard published"],["push","adm_audit","Layout, publish and delivery events","dashboard","event","Any change"]]},
 proc:{id:"dashboard_publication",name:"Build and publish a dashboard",owner:OWN.dash[0],backup:OWN.dash[1],trigger:"A person builds a dashboard from a template or from scratch and wants others to use it",steps:[
  ["Pick a source","Each tile is bound to a governed metric or a registry measure; the formula and owner are shown on the tile.","human","Dashboard builder","Same day","Metric dictionary","Bound tile"],
  ["Arrange","Tiles are added, resized and reordered with the keyboard or by dragging; every change can be undone.","human","Dashboard builder","Same day","Bound tile","Draft dashboard"],
  ["Share","The owner shares the dashboard to groups; sharing alone does not make it a default.","human",OWN.dash[0],"Same day","Draft dashboard","Shared dashboard"],
  ["Review","The dashboard governance group sees the tiles, sources and who the default is for.","gate","Dashboard governance group","2 working days","Shared dashboard","Reviewed dashboard"],
  ["Publish","One group member other than the proposer approves; the dashboard becomes the default for the chosen persona.","gate","Dashboard governance group","1 working day","Reviewed dashboard","Published default"],
  ["Deliver","A schedule sends a snapshot to a group or people (simulated in this prototype and labeled).","auto","Automatic","Per schedule","Published default","Delivered snapshot"]],
  inputs:["Metric dictionary","Registries"],outputs:["Published dashboard","Scheduled delivery"],entities:["dashboard","dashboard_tile","report_schedule","approval"],metrics:["m_dash_bound","m_dash_owned","m_dash_pubq"]}};
U.specs=[BEN_SPEC,DASH_SPEC];
const PSX=a=>({n:a[0],d:a[1],who:a[2],owner:a[3],sla:a[4],in:a[5],out:a[6]});
G(()=>PROC.reg("bud_ben",{title:"Benefits realization",std:["tbm","pmbok"],steps:BEN_SPEC.proc.steps.map(PSX)}));
G(()=>PROC.reg("r17u_dash",{title:"Build and publish a dashboard",std:["cobit","dmbok"],steps:DASH_SPEC.proc.steps.map(PSX)}));
const WS={};
function wire(){
 if(!(W.R15F3&&R15F3.wire)){return}
 try{
  if(!WS.ext&&W.DATAMODEL&&DATAMODEL.tables.benefit&&DATAMODEL.tables.dashboard){extendEntity("benefit",BEN_EXT);extendEntity("dashboard",DASH_EXT);
   G(()=>{if(W.COVER&&COVER.recs){[["BEN_EXT","Benefit register extension (owner, backup, baseline, target, measure source)","bud_ben","benefit","extend","r17u.ben.x"],["DSH_EXT","Dashboard library (owner, backup, status, default, sharing)","r17u_dash","dashboard","extend","r17u.dash.items"],["DSH_SCH","Dashboard delivery schedules (simulated)","r17u_dash","report_schedule","direct","r17u.dash.sched"]].forEach(x=>{if(!COVER.recs.some(r=>r.key===x[0]))COVER.recs.push({key:x[0],label:x[1],scr:[x[2]],mod:x[2],n:10,ent:x[3],how:x[4],path:x[5]})});if(COVER.compute)COVER.compute()}});
   WS.ext=1}
  U.specs.forEach(sp=>{const w=R15F3.wire(sp);WS[sp.key]=w});
  G(()=>["benefit_checkpoint","benefit_actual","dashboard_tile"].forEach(id=>{if(W.OWNX&&OWNX.assign){const o=id.startsWith("dash")?OWN.dash:OWN.ben;OWNX.assign("entity",id,o[0],o[1],"Round 17 entity")}}));
  G(()=>["benefit","dashboard"].forEach(id=>{}));
 }catch(e){console.error("r17u wire",e)}}
[2200,5200,9800].forEach(t=>setTimeout(()=>{wire();G(()=>CONTRACT.refresh&&CONTRACT.refresh())},t));
/* events and permissions */
const EVD=[["benefit.actual_recorded","Benefit actual recorded","bud_ben",["id","benefit","amount"]],["benefit.target_change.proposed","Benefit target change proposed","bud_ben",["id","group"]],["benefit.target_change.decided","Benefit target change decided","bud_ben",["id","decision"]],["dashboard.publish.proposed","Dashboard sent for publication","r17u_dash",["id","group"]],["dashboard.publish.decided","Dashboard publication decided","r17u_dash",["id","decision"]],["dashboard.delivery_simulated","Dashboard delivery run (simulated)","r17u_dash",["dashboard","recipients"]]];
function regEv(){G(()=>EVD.forEach(d=>R15F3.regEvent({id:d[0],label:d[1],module:d[2],fields:d[3].map(n=>({name:n,type:"string"})),owner:OWN.ben[0]})))}
[3500,8000,14000].forEach(t=>setTimeout(regEv,t));
function ensurePerm(){try{if(!(W.PERM&&PERM.state&&PERM.addRule))return;["r17u_dash"].forEach(id=>{if(!PERM.state.rules.some(r=>r.res==="screen:"+id))PERM.addRule({name:"Open "+id,effect:"allow",sub:{roles:["*","!vendor_guest"]},res:"screen:"+id,act:["read"],when:"",why:"Dashboards read aggregate figures from registries the viewer can already open; restricted rows are not shown.",tier:"screen",kind:"seed",owner:OWN.dash[0],reviewed:G(()=>TODAY,null)})})}catch(e){}}
[4000,9000,16000].forEach(t=>setTimeout(ensurePerm,t));

/* ---------------- navigation, search, chat ---------------- */
function nav(){
 G(()=>{const R15=W.R15=W.R15||{};R15.alias=R15.alias||{};R15.hidden=R15.hidden||{};R15.names=R15.names||{};
  const f=(R15.families||[]).find(x=>x.id==="exe_dash");
  if(f&&!f.views.some(v=>v[0]==="r17u_dash")){f.views.unshift(["r17u_dash","Build and view"]);if(!f.views.some(v=>v[0]==="r16j_dash"))f.views.push(["r16j_dash","Charts and defaults"]);
   R15.famOf=R15.famOf||{};["r17u_dash","r16j_dash"].forEach(id=>{R15.famOf[id]=f;R15.hidden[id]=1;R15.names[id]="Dashboards: "+(id==="r17u_dash"?"Build and view":"Charts and defaults")})}});
 G(()=>{if(NAVX.add&&!nav.d){NAVX.add("r17u_dash",{group:"strat",label:"Dashboards",hint:"Build, share and publish dashboards from live metrics and registries",sub:"Dashboards",kw:"dashboard dashboards builder viewer tiles library template gallery executive service desk finance resilience agents delivery schedule share publish default filter drill print full screen"});nav.d=1}});
 G(()=>{NAVX.alias=NAVX.alias||{};NAVX.alias["dashboards"]="r17u_dash";NAVX.alias["dashboard builder"]="r17u_dash"})}
nav();setTimeout(nav,900);setTimeout(nav,3500);
/* the sidebar "Dashboards" entry (family exe_dash) lands on the builder; the Leadership view stays one click away in the view switcher */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-nav="exe_dash"]');if(!b||b.closest(".r15-fam")||b.closest("#view"))return;if(b.dataset.r17uSkip)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();go("r17u_dash")},true);
SEARCHX.push(()=>{const o=[{g:"Go to",t:"Dashboards",m:"Build, share and publish dashboards",c:"--accent",f:()=>go("r17u_dash"),k:"dashboard dashboards builder viewer tiles template gallery executive service desk finance resilience delivery"},{g:"Go to",t:"Track benefits",m:"Register, timeline, checkpoints, net benefit and payback",c:"--s3",f:()=>go("bud_ben"),k:"benefits realization track register checkpoints net benefit payback baseline target owner backup"}];
 G(()=>(X.dash.items||[]).forEach(d=>o.push({g:"Dashboards",t:d.name,m:d.tiles.length+" tiles · "+d.status,c:"--p4",f:()=>{X.ui.sel=d.id;go("r17u_dash")},k:"dashboard "+d.name+" "+(d.tpl||"")})),0);
 G(()=>U.attention().forEach(x=>o.push({g:"Benefits needing attention",t:x.b.id+" "+x.b.n,m:x.f.map(y=>y.t).join("; "),c:"--warn-f",f:()=>{S.v.budb=5;go("bud_ben")},k:"benefit attention "+x.b.id+" "+x.b.n})),0);
 return o});
ASKX.push(q=>{const t=String(q||"").toLowerCase();
 if(/benefit/.test(t)&&/(attention|missing|no owner|no backup|no baseline|stale|overdue)/.test(t)){const a=U.attention();S.v.budb=5;go("bud_ben");say(q,{t:`${a.length} of ${B().ben.length} benefits need attention: ${a.slice(0,4).map(x=>x.b.id+" ("+x.f.map(y=>y.k).join(", ")+")").join("; ")}${a.length>4?"; and more":""}.`,steps:["Read the benefits register","Applied the five attention rules"]});return true}
 if(/(net benefit|payback)/.test(t)){const T=totalsNet(X.ben.hz||3);S.v.budb=3;go("bud_ben");say(q,{t:`Computed, risk adjusted: ${usd(T.adj)} of benefit over ${X.ben.hz||3} years against ${usd(T.cost)} of forecast cost is ${usd(T.net)} net. Payback per initiative is on the Net benefit and payback tab.`,steps:["Read benefits and linked budget lines","Computed net benefit and payback"]});return true}
 if(/(checkpoint|realization|realisation)/.test(t)&&/benefit/.test(t)){const d=toDate();S.v.budb=2;go("bud_ben");say(q,{t:`Recorded benefit to date is ${usd(d.real)} against ${usd(d.plan)} planned to date (${d.pct}%). Checkpoint status is computed from recorded actuals.`,steps:["Computed checkpoints from the register"]});return true}
 if(/dashboard/.test(t)&&/(build|builder|new|template|publish|schedule|share|default|library|open|show)/.test(t)){go("r17u_dash");say(q,{t:"Opened Dashboards: pick one from the library, or start from a template.",steps:["Opened the dashboard builder"]});return true}
 return false});
})();

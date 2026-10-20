
/* ---------------- processes, coverage and per-step targets ---------------- */
const CLS=[["incident","Incident and problem"],["request","Request fulfillment"],["change","Change enablement"],["release","Release and deployment"],["onboarding","Onboarding"],["access","Access management"],["vendor","Vendor and contract"],["delivery","Project and portfolio delivery"],["risk","Risk and issue handling"],["knowledge","Knowledge"],["service","Service portfolio"],["oncall","On-call and skills"],["gov","Executive and governance"],["other","Other"]];
const CLSN=Object.fromEntries(CLS);
const CLSRX=[["onboarding",/onboard|hire|joiner|leaver|offboard/i],["access",/access|identity|entra|iam/i],["risk",/risk|raid/i],["incident",/incident|restore|major|outage|problem|itom|event/i],["change",/change|enablement|cab/i],["release",/release|train|sprint|agile|deploy/i],["request",/request|catalog|fulfil|portal|order|purchase/i],["vendor",/sow|contract|vendor|procure|invoice|supplier|renewal/i],["knowledge",/kcs|knowledge|article/i],["oncall",/on-?call|skills|rota/i],["service",/svc_360|service portfolio|impact/i],["gov",/exe_|board|strategy|maturity|tbm|cost transparency|agreement|sla/i],["delivery",/plan|wbs|schedule|ims|port|demand|ppm|proj|budget|capacity|resource/i]];
const clsOf=txt=>{for(const [c,rx] of CLSRX)if(rx.test(txt))return c;return "other"};
const NEED0={incident:["SLA","OLA","XLA"],request:["SLA","OLA","XLA"],change:["SLA","XLA"],release:["OLA"],onboarding:["SLA","XLA"],access:["SLA","OLA"],vendor:["UC","OLA"],delivery:["OLA"],risk:["OLA"],knowledge:["OLA","XLA"],service:["SLA"],oncall:["OLA"],gov:[],other:[]};
const needOf=(cls,tier)=>{const base=(SL.need&&SL.need[cls])||NEED0[cls]||[];const ti=+String(tier).replace(/\D/g,"")||1;return ti===1?base:ti===2?base.filter(x=>x!=="XLA"):base.slice(0,1)};
const parseH=t=>{if(!t)return null;const m=/(\d+(?:\.\d+)?)\s*(min|minute|minutes|h|hr|hours?|business days?|days?|weeks?)/i.exec(String(t));if(!m)return null;const n=+m[1],u=m[2].toLowerCase();return u.startsWith("min")?n/60:u.startsWith("business")?n*9:u.startsWith("d")?n*24:u.startsWith("w")?n*40:n};
const WHON={human:"Person",agent:"AI agent",auto:"Automatic",gate:"Approval gate",wait:"Waiting",system:"System"};
function entities(){const out=[];const seen={};
 Object.keys(PROC.defs||{}).forEach(k=>{const d=PROC.defs[k];const steps=(SL.procEdit&&SL.procEdit[k])||S.proc&&S.proc[k]||d.steps||[];out.push({key:"p:"+k,id:k,src:"Screen process",title:d.title||k,cls:clsOf(k+" "+(d.title||"")),steps:steps.map((s,i)=>({n:s.n,who:s.who||"human",owner:s.owner||"",txt:s.sla||"",h:parseH(s.sla)}))})});
 if(window.WFX&&WFX.defs)WFX.defs.forEach(w=>out.push({key:"w:"+w.id,id:w.id,src:"Workflow",title:w.name||w.id,cls:clsOf(w.id+" "+(w.name||"")+" "+(w.kind||"")+" "+(w.service||"")),svc:w.service,steps:(w.steps||[]).map(s=>({n:s.n,who:s.type||"human",owner:s.owner||s.team||"",txt:s.sla||(s.olaHrs!=null?hrsStr(s.olaHrs):""),h:s.olaHrs!=null?+s.olaHrs:parseH(s.sla)}))}));
 return out}
const TIERS=()=>Array.from(new Set(SVCREG.map(s=>s.tier))).sort();
const tierOk=(ag,tier)=>{const a=ag.act;if(a.tiers&&a.tiers.length)return a.tiers.includes(tier);if(a.svcs&&a.svcs.length)return a.svcs.some(n=>{const s=SVCREG.find(x=>x.n===n);return s&&s.tier===tier});return true};
const svcOk=(ag,svc)=>!ag.act.svcs.length||ag.act.svcs.includes(svc)||false;
function cover(cls,pred){const need=pred.need;const have={};live().concat(AGS().filter(a=>agStatus(a)==="Scheduled")).forEach(a=>{if(a.proc!==cls&&!(a.procs&&a.procs.includes(cls)))return;if(!pred.ok(a))return;(have[a.ty]=have[a.ty]||[]).push(a)});
 const missing=need.filter(t=>!have[t]||!have[t].some(a=>agStatus(a)!=="Scheduled"));const planned=missing.filter(t=>have[t]);const real=missing.filter(t=>!have[t]);const att=[];Object.values(have).flat().forEach(a=>{const r=evalAg(a);if(r.pctAtt!=null&&agStatus(a)!=="Scheduled")att.push(r.pctAtt)});
 return {need,have,missing:real,planned,state:!need.length?"na":!real.length?"ok":real.length===need.length?"gap":"part",att:att.length?att.reduce((a,b)=>a+b,0)/att.length:null}}
function covMatrix(){const by=SL.cov.by;const key="CM|"+SL.v+"|"+by+"|"+(SCALE.on?1:0)+"|"+(window.WFX?WFX.defs.length:0)+"|"+Object.keys(PROC.defs).length+"|"+JSON.stringify(SL.need||{});if(CACHE.has(key))return CACHE.get(key);
 let rows=[],cols=[],cell;
 if(by==="process"){rows=entities().map(e=>({k:e.key,t:e.title,cls:e.cls,e,sub:CLSN[e.cls]+" · "+e.src}));cols=TIERS().map(t=>({k:t,t}));cell=(r,c)=>cover(r.cls,{need:needOf(r.cls,c.k),ok:a=>tierOk(a,c.k)})}
 else{rows=SVCREG.map(s=>({k:s.id,t:s.n,s,sub:s.tier+" · owner "+s.owner}));cols=CLS.filter(c=>(NEED0[c[0]]||[]).length).map(c=>({k:c[0],t:c[1]}));cell=(r,c)=>cover(c.k,{need:needOf(c.k,r.s.tier),ok:a=>svcOk(a,r.s.n)&&tierOk(a,r.s.tier)})}
 let need=0,got=0,gaps=0,part=0,full=0;const R=rows.map(r=>{const cs=cols.map(c=>{const x=cell(r,c);need+=x.need.length;got+=x.need.length-x.missing.length;if(x.state==="gap")gaps++;if(x.state==="part")part++;if(x.state==="ok")full++;return x});return {r,cs}});
 const out={by,rows:R,cols,need,got,gaps,part,full,pct:need?got/need*100:100};CACHE.set(key,out);return out}
/* which agreements touch a process entity, with the end to end budget */
const agsForCls=cls=>live().filter(a=>a.proc===cls||(a.procs||[]).includes(cls));
function stepRows(e){const ags=agsForCls(e.cls);const bud=ags.filter(a=>a.kind==="duration"&&(a.ty==="SLA"||a.ty==="UC")).sort((a,b)=>b.target.hours-a.target.hours)[0];
 const W8={human:3,agent:1,auto:.3,gate:2,wait:1,system:.3};const fixed=e.steps.reduce((a,s,i)=>a+((SL.stepT[e.key+"|"+i]!=null?SL.stepT[e.key+"|"+i]:s.h)||0),0);const open=e.steps.filter((s,i)=>(SL.stepT[e.key+"|"+i]!=null?SL.stepT[e.key+"|"+i]:s.h)==null);const wsum=open.reduce((a,s)=>a+(W8[s.who]||1),0);const room=bud?Math.max(0,bud.target.hours-fixed):0;
 const rs=e.steps.map((s,i)=>{const k=e.key+"|"+i;let tg=SL.stepT[k]!=null?SL.stepT[k]:s.h;let src=SL.stepT[k]!=null?"Set here":s.h!=null?"From the process":"Not set";if(tg==null&&bud&&wsum){tg=Math.round(room*(W8[s.who]||1)/wsum*4)/4;src="Proposed"}const r=RNG("stp|"+k)();const rel=ags.filter(a=>a.kind==="duration"&&a.ty!=="XLA").map(a=>evalAg(a).val).filter(v=>v!=null);const base=rel.length?rel.reduce((a,b)=>a+b,0)/rel.length:90;
  const n=Math.round(12+r*60);const att=tg==null?null:Math.max(55,Math.min(100,base+(r-.5)*22-(s.who==="human"?2:0)+(s.who==="auto"?4:0)));return {i,k,n:s.n,who:s.who,owner:s.owner,tgt:tg,txt:s.txt,att,cnt:n,tgtSrc:src}});
 const sum=rs.reduce((a,x)=>a+(x.tgt||0),0);return {rows:rs,bud,sum}}

/* ---------------- clock simulator ---------------- */
function simulate(ag,o){const cal=calOf(ag.sch);const tgt=ag.target.hours||1;const st=o.startT;const pauses=o.pauses||[];const cells=[];let run=0,t=st,due=null,pausedWall=0;const warn=(ag.warn||[]).map(w=>({p:w.p,a:w.a,ch:w.ch,t:null}));
 const inPause=x=>pauses.some(p=>x>=st+p.at*HR&&x<st+(p.at+p.len)*HR);
 for(let n=0;n<600;n++){const t1=t+HR;const ps=inPause(t+HR/2);const open=isOpen(t+HR/2,cal);const add=ps?0:workBetween(t,t1,cal);cells.push({t,c:ps?"pause":open?"run":"off"});if(ps)pausedWall++;
  const before=run;run+=add;warn.forEach(w=>{const th=tgt*w.p/100;if(w.t==null&&add>0&&before<th-1e-9&&run>=th-1e-9)w.t=t+(th-before)/add*HR});
  if(due==null&&add>0&&before<tgt-1e-9&&run>=tgt-1e-9)due=t+(tgt-before)/add*HR;
  t=t1;if(due!=null&&t>due+Math.max(4,Math.min(30,tgt*.2))*HR)break}
 if(due==null)due=t;
 return {cells,due,warn,end:t,tgt,paused:pausedWall,span:t-st}}

/* ---------------- vendor credits ---------------- */
function creditFor(ag){const c=ag.contract;if(!c)return null;const r=evalAg(ag);let pctC=0,why="";
 if(ag.msp){const sh=Math.max(0,ag.goal-(r.val==null?ag.goal:r.val));pctC=Math.min(c.cap,Math.floor(sh)*c.pct);why=r.val==null?"No data":`Result ${pct1(r.val)} against goal ${ag.goal}%: ${r1(sh)} points short, ${c.pct}% per point, capped at ${c.cap}%`}
 else{const m=r.br;pctC=Math.min(c.cap,m*c.pct);why=`${m} missed in 30 days at ${c.pct}% each, capped at ${c.cap}%`}
 return {ag,c,r,pctC,amt:Math.round(c.fee*pctC/100),why}}
const credits=()=>AGS().filter(a=>a.contract&&(agStatus(a)==="Active"||agStatus(a)==="Retiring")).map(creditFor).filter(Boolean);

/* ---------------- metrics ---------------- */
Object.assign(METRICS,{
 m_agr_att:{n:"Agreement attainment",f:"Σ clocks that stopped inside their target ÷ Σ clocks that stopped, across active SLAs, OLAs and underpinning contracts, last 30 days × 100",u:"%",cur:92,tgt:95,badAt:88,dir:"max",max:100,tr:[94,93.6,93.4,93,92.8,92.4,92.2,92],owner:"Service desk",use:["SLAs, OLAs and XLAs"],rem:{kind:"agent",ref:"SOP-212",title:"Rebalance queues before a breach",agent:"Triage Agent",auto:false,state:"idle",prog:"Reassigns at-risk records and pages owners at 75% elapsed"}},
 m_agr_cov:{n:"Agreement coverage of processes",f:"Σ required agreement types that exist ÷ Σ required agreement types, for every process and service tier, where required types follow the coverage policy (Tier 1 needs SLA, OLA and XLA where the process calls for them) × 100",u:"%",cur:60,tgt:85,badAt:50,dir:"max",max:100,tr:[48,50,52,54,56,58,59,60],owner:"Service level manager",use:["SLAs, OLAs and XLAs"],rem:{kind:"sop",ref:"SOP-230",title:"Close an agreement gap",agent:"Resource Agent",auto:false,state:"idle",prog:"Drafts the missing agreement from similar processes for the owner to approve"}},
 m_agr_risk:{n:"Clocks at risk",f:"Running or paused clocks at 75% or more of target elapsed (or already past it) ÷ all running or paused clocks × 100",u:"%",cur:9,tgt:5,badAt:15,dir:"min",max:30,tr:[6,7,6,8,7,9,8,9],owner:"Service desk",use:["SLAs, OLAs and XLAs"],rem:{kind:"agent",ref:"SOP-213",title:"Swarm at-risk clocks",agent:"Triage Agent",auto:false,state:"idle",prog:"Finds the next free qualified person and offers to reassign"}},
 m_xla_score:{n:"Experience score",f:"Average over active XLAs of (average survey score ÷ 5 × 100, or the percent favorable, 4 or 5 out of 5), last 30 days",u:"%",cur:82,tgt:85,badAt:75,dir:"max",max:100,tr:[84,84,83,83,82,82,82,82],owner:"Service desk",use:["SLAs, OLAs and XLAs"],rem:{kind:"kb",ref:"KB0160",title:"Read the unfavorable comments weekly",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Summarizes comments by theme and proposes fixes"}},
 m_agr_credit:{n:"Vendor credits due",f:"Σ over underpinning contracts of monthly fee × credit percent earned, where credit percent = per-miss or per-point rate × misses or shortfall, capped by the contract clause",u:"$",cur:3400,tgt:0,badAt:8000,dir:"min",max:20000,tr:[0,1900,0,1900,3800,1900,3000,3400],owner:"Vendor manager",use:["SLAs, OLAs and XLAs"],rem:{kind:"sop",ref:"SOP-231",title:"Claim a service credit",agent:"Contract Agent",auto:false,state:"idle",prog:"Prepares the credit claim with the evidence and sends it for approval"}}});
function syncM(){const t=totals(),cm=covMatrix(),cr=credits();const set=(id,v)=>{const m=METRICS[id];m.cur=Math.round(v*10)/10;if(m.tr&&m.tr[m.tr.length-1]!==m.cur)m.tr=m.tr.slice(1).concat(m.cur)};set("m_agr_att",t.att);set("m_agr_cov",cm.pct);const run=t.open;set("m_agr_risk",run?t.risk.length/run*100:0);if(t.xla!=null)set("m_xla_score",t.xla);set("m_agr_credit",cr.reduce((a,x)=>a+(SL.credits[x.ag.id]==="waived"?0:x.amt),0))}

/* Round 17, Agent Q. Value realized and How it was built: engine and wiring.
   Layer A: figures computed live from the prototype's own registries (nothing typed in).
   Layer B: a business case model the viewer edits (every input is labeled illustrative until the viewer changes it).
   This file holds the figures, the model, the metrics, and the Feature Contract wiring (process, data model, owner and backup,
   module map, navigation, search, chat, permissions). Screens are in mod_r17q_c_value.js and mod_r17q_d_thinking.js. */
(function(){
"use strict";
const W=window;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const Q=W.R17Q=W.R17Q||{};
const arr=x=>Array.isArray(x)?x:[];
const OWN={value:["Avery Chen","Maya Ortiz"],think:["Maya Ortiz","Priya Shah"]};
Q.own=OWN;
/* ---------------- state ---------------- */
const ST=S.r17q=S.r17q||{inp:{},mins:6,scn:[],hydrated:false,cmpA:"__cur",cmpB:"",range:40,tab:0,q:"",round:"",more:25,nm:"",tv:0};
Q.st=ST;

/* ---------------- formatting ---------------- */
const nf=(n,d)=>(+n||0).toLocaleString("en-US",{maximumFractionDigits:d==null?0:d,minimumFractionDigits:d||0});
const usd=n=>{n=Math.round(+n||0);const a=Math.abs(n);return (n<0?"-":"")+"$"+(a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e4?nf(a/1e3,0)+"K":nf(a))};
const usdF=n=>(Math.round(+n||0)<0?"-":"")+"$"+nf(Math.abs(Math.round(+n||0)));
const pct=(n,d)=>nf(n,d==null?0:d)+"%";
Q.fmt={nf,usd,usdF,pct};

/* ================================================================ LAYER B: the model ================================================================ */
/* Every default is illustrative. kind "org" describes the viewer's organization, "eff" what the platform changes, "fin" cost and finance. */
const INPUTS=[
 {k:"users",g:"org",l:"Users on the platform",u:"people",d:2500,min:50,max:100000,st:50,h:"Everyone who requests, approves or works in the platform."},
 {k:"req",g:"org",l:"Tickets and requests per month",u:"per month",d:6000,min:0,max:1e6,st:100,h:"Incidents, service requests, changes and catalog orders."},
 {k:"rate",g:"org",l:"Loaded hourly cost",u:"$ per hour",d:65,min:10,max:500,st:1,h:"Salary, benefits and overhead for an hour of staff time."},
 {k:"appr",g:"org",l:"Approvals per month",u:"per month",d:900,min:0,max:1e5,st:25,h:"Every decision that waits on a person or group."},
 {k:"days",g:"org",l:"Approval cycle today",u:"days",d:5,min:0.1,max:60,st:0.5,h:"Average calendar days from request to decision."},
 {k:"tools",g:"org",l:"Tools in the current stack",u:"tools",d:14,min:0,max:200,st:1,h:"Separate tools for tickets, approvals, projects, knowledge and reporting."},
 {k:"toolc",g:"org",l:"Annual cost per tool",u:"$ per year",d:48000,min:0,max:5e6,st:1000,h:"Licenses and support, averaged across the stack."},
 {k:"audit",g:"org",l:"Audit preparation",u:"hours per year",d:1200,min:0,max:1e5,st:50,h:"Time spent collecting evidence for audits and reviews."},
 {k:"outh",g:"org",l:"Outage hours per year",u:"hours",d:10,min:0,max:1000,st:1,h:"Hours of unplanned service loss."},
 {k:"outc",g:"org",l:"Cost per outage hour",u:"$ per hour",d:30000,min:0,max:5e6,st:1000,h:"Lost work, penalties and recovery effort per hour."},
 {k:"mreq",g:"eff",l:"Minutes saved per ticket or request",u:"minutes",d:5,min:0,max:120,st:1,h:"Handling time removed by routing, templates and agents."},
 {k:"mapp",g:"eff",l:"Minutes saved per approval",u:"minutes",d:12,min:0,max:240,st:1,h:"Chasing, status checks and re-keying removed."},
 {k:"pcyc",g:"eff",l:"Approval cycle reduction",u:"percent",d:60,min:0,max:95,st:5,h:"Share of the cycle removed by group routing and reminders."},
 {k:"ptool",g:"eff",l:"Tools retired",u:"percent of stack",d:25,min:0,max:100,st:5,h:"Share of current tools that the platform replaces."},
 {k:"paud",g:"eff",l:"Audit preparation reduction",u:"percent",d:35,min:0,max:95,st:5,h:"Share of evidence gathering done by the platform."},
 {k:"pout",g:"eff",l:"Outage hours avoided",u:"percent",d:20,min:0,max:95,st:5,h:"Share of outage hours prevented by tested continuity plans."},
 {k:"price",g:"fin",l:"Platform cost per user (unpriced: enter your quote)",u:"$ per user per year",d:0,min:0,max:5000,st:5,h:"Unpriced placeholder. No platform price exists yet; enter the quote you hold. Until you do, the model counts no platform cost.",unpriced:true},
 {k:"impl",g:"fin",l:"One-time implementation cost",u:"$",d:450000,min:0,max:1e8,st:10000,h:"Replace with your quote."},
 {k:"adopt",g:"fin",l:"Benefit realized in year 1",u:"percent",d:60,min:0,max:100,st:5,h:"Adoption ramp: later years realize 100 percent."},
 {k:"disc",g:"fin",l:"Discount rate",u:"percent",d:10,min:0,max:40,st:0.5,h:"Your cost of capital."},
 {k:"yrs",g:"fin",l:"Years in the model",u:"years",d:3,min:1,max:10,st:1,h:"The NPV and ROI cover this many years."}];
const GROUPS=[["org","Your organization","What you run today"],["eff","What the platform changes","Effect assumptions: the main source of uncertainty"],["fin","Cost and finance","Price, ramp and discounting"]];
Q.INPUTS=INPUTS;Q.GROUPS=GROUPS;
const defs=()=>{const o={};INPUTS.forEach(i=>o[i.k]=i.d);return o};
const clampIn=(i,v)=>{v=+v;if(!isFinite(v))v=i.d;return Math.min(i.max,Math.max(i.min,v))};
function inputs(src){const o={};INPUTS.forEach(i=>{const v=(src||ST.inp)[i.k];o[i.k]=v==null||v===""?i.d:clampIn(i,v)});return o}
function edited(src){return INPUTS.filter(i=>{const v=(src||ST.inp)[i.k];return v!=null&&v!==""&&+v!==i.d})}
Q.inputs=inputs;Q.edited=edited;

/* model(inputs, mult): mult scales the effect assumptions (low and high cases) and the cost assumptions. */
function model(I,em,cm){
 em=em==null?1:em;cm=cm==null?1:cm;
 const cap=(v,m)=>Math.min(m,v*em);
 const mreq=I.mreq*em,mapp=I.mapp*em,pcyc=cap(I.pcyc,95),ptool=cap(I.ptool,100),paud=cap(I.paud,95),pout=cap(I.pout,95);
 const price=I.price*cm,impl=I.impl*cm;
 const hReq=I.req*12*mreq/60,hApp=I.appr*12*mapp/60,hAud=I.audit*paud/100,H=hReq+hApp+hAud;
 const lab=H*I.rate,tools=I.tools*ptool/100*I.toolc,out=I.outh*pout/100*I.outc;
 const full=lab+tools+out,lic=I.users*price;
 const yrs=Math.max(1,Math.round(I.yrs)),r=I.disc/100,rows=[];let cum=-impl,pb=null,npv=-impl,sb=0,sc=impl;
 for(let t=1;t<=yrs;t++){const ramp=t===1?I.adopt/100:1,b=full*ramp,c=lic,net=b-c,df=1/Math.pow(1+r,t),pv=net*df;
  if(pb==null&&net>0&&cum+net>=0)pb=12*(t-1)+12*(-cum)/net;
  cum+=net;npv+=pv;sb+=b;sc+=c;rows.push({t,ramp,b,c,net,cum,df,pv})}
 if(pb==null&&cum>=0&&impl===0)pb=0;
 const roi=sc>0?(sb-sc)/sc:null;
 const cyc=I.days*(1-pcyc/100),waitAvoided=I.appr*12*I.days*pcyc/100;
 return {I,em,cm,mreq,mapp,pcyc,ptool,paud,pout,price,impl,hReq,hApp,hAud,H,lab,tools,out,full,lic,yrs,r,rows,npv,sb,sc,roi,pb,cyc,waitAvoided,benefit1:rows[0]?rows[0].b:0}}
Q.model=model;

/* Formula lines: formula string and the same formula with the viewer's numbers substituted. */
function lines(M){
 const I=M.I,f=nf,u=usdF;
 return [
 {id:"hReq",l:"Hours returned from tickets and requests",fm:"tickets per month × 12 × minutes saved ÷ 60",sub:`${f(I.req)} × 12 × ${f(M.mreq,1)} ÷ 60`,v:M.hReq,t:"h"},
 {id:"hApp",l:"Hours returned from approvals",fm:"approvals per month × 12 × minutes saved ÷ 60",sub:`${f(I.appr)} × 12 × ${f(M.mapp,1)} ÷ 60`,v:M.hApp,t:"h"},
 {id:"hAud",l:"Hours returned from audit preparation",fm:"audit hours per year × reduction",sub:`${f(I.audit)} × ${f(M.paud,1)}%`,v:M.hAud,t:"h"},
 {id:"H",l:"Annual hours returned",fm:"sum of the three lines above",sub:`${f(M.hReq)} + ${f(M.hApp)} + ${f(M.hAud)}`,v:M.H,t:"h",strong:1},
 {id:"lab",l:"Value of hours returned",fm:"annual hours returned × loaded hourly cost",sub:`${f(M.H)} × ${u(I.rate)}`,v:M.lab,t:"$"},
 {id:"tools",l:"Tool consolidation savings",fm:"tools × share retired × annual cost per tool",sub:`${f(I.tools)} × ${f(M.ptool,1)}% × ${u(I.toolc)}`,v:M.tools,t:"$"},
 {id:"out",l:"Avoided outage cost",fm:"outage hours × share avoided × cost per outage hour",sub:`${f(I.outh)} × ${f(M.pout,1)}% × ${u(I.outc)}`,v:M.out,t:"$"},
 {id:"full",l:"Annual benefit at full adoption",fm:"value of hours + tool savings + avoided outage cost",sub:`${u(M.lab)} + ${u(M.tools)} + ${u(M.out)}`,v:M.full,t:"$",strong:1},
 {id:"lic",l:"Annual platform cost",fm:"users × your quoted cost per user",sub:M.price?`${f(I.users)} × ${u(M.price)}`:"Unpriced: enter your quote",v:M.lic,t:"$"},
 {id:"npv",l:`${M.yrs}-year net present value`,fm:"−implementation + Σ (benefit − platform cost) ÷ (1 + rate) ^ year",sub:`−${u(M.impl)} + `+M.rows.map(r=>`(${u(r.b)} − ${u(r.c)}) ÷ ${(1+M.r).toFixed(3)}^${r.t}`).join(" + "),v:M.npv,t:"$",strong:1},
 {id:"roi",l:`${M.yrs}-year return on investment`,fm:"(total benefit − total cost) ÷ total cost",sub:`(${u(M.sb)} − ${u(M.sc)}) ÷ ${u(M.sc)}`,v:M.roi==null?null:M.roi*100,t:"%",strong:1},
 {id:"pb",l:"Payback period",fm:"months until cumulative benefit minus cost passes the implementation cost",sub:M.pb==null?`cumulative after ${M.yrs} years: ${u(M.rows.length?M.rows[M.rows.length-1].cum:0)}`:`${u(M.impl)} recovered by month ${f(M.pb,1)}`,v:M.pb,t:"mo",strong:1},
 {id:"cyc",l:"Approval cycle after",fm:"cycle today × (1 − reduction); not converted to dollars",sub:`${f(I.days,1)} × (1 − ${f(M.pcyc,1)}%)`,v:M.cyc,t:"d"},
 {id:"wait",l:"Approval waiting days avoided per year",fm:"approvals per month × 12 × cycle today × reduction; not converted to dollars",sub:`${f(I.appr)} × 12 × ${f(I.days,1)} × ${f(M.pcyc,1)}%`,v:M.waitAvoided,t:"d"}]}
Q.lines=lines;
const fmtV=(l)=>l.v==null?(l.id==="pb"?"Not within "+"the model years":"Not defined"):l.t==="$"?usdF(l.v):l.t==="h"?nf(l.v)+" h":l.t==="%"?nf(l.v)+"%":l.t==="mo"?nf(l.v,1)+" months":nf(l.v,1)+" days";
Q.fmtLine=fmtV;
/* sensitivity: low, base, high */
function sens(I,range){const r=Math.max(0,Math.min(90,range))/100;return {low:model(I,1-r,1+r/2),base:model(I,1,1),high:model(I,1+r,1-r/2),range:r*100}}
Q.sens=sens;

/* ================================================================ LAYER A: this tenant ================================================================ */
/* Each figure: id (METRICS id), label, v (number), disp, unit, sub, formula, source (registry), go (screen), tone, n (sample size), kind. */
let AC=null,ACK="";
const sigA=()=>[ST.mins,G(()=>AGENTS_STATE.clock(),""),G(()=>Object.keys(METRICS).length,0),G(()=>DEBT.totals().n,0),G(()=>(S.flw&&S.flw.apx&&S.flw.apx.items||[]).filter(x=>x.st!=="pending").length,0),G(()=>COVER.recs.length,0),G(()=>CONTRACT.stats().features,0)].join("|");
function tenant(force){
 const k=sigA();if(AC&&ACK===k&&!force)return AC;
 const out=[];const add=o=>out.push(Object.assign({kind:"data",tone:"good"},o));
 /* 1 agent runs and hours returned */
 const rows=G(()=>AGENTS_STATE.rows().filter(r=>r.enabled),[]);
 const runs=rows.reduce((s,r)=>s+arr(r.act).reduce((a,b)=>a+b,0),0),nAg=rows.length,logged=G(()=>AGENTRT.runs.length,0);
 const hrs=runs*ST.mins/60,rate=G(()=>DEBT.rate,95);
 add({id:"m_val_runs",key:"runs",l:"Agent runs per day",v:runs,disp:nf(runs),sub:`${nAg} enabled agents; ${nf(logged)} runs in the run log (demo seed)`,formula:"Σ runs per day over enabled agents, from each agent's 24-hour activity profile",source:"AGENTS_STATE (agent registry)",go:"r15d_agents",n:nAg,tone:"info"});
 add({id:"m_val_hours",key:"hours",kind:"mixed",l:"Hours returned per day",v:hrs,disp:nf(hrs,1)+" h",sub:`${usdF(hrs*rate)} per day at ${usdF(rate)} per hour (debt ledger rate); about ${nf(hrs*21)} h a month`,formula:"agent runs per day × minutes saved per run ÷ 60. Runs are measured; minutes per run is an editable assumption",source:"AGENTS_STATE × assumption (minutes per run)",go:"r15d_agents",n:nAg,tone:"good",assume:{k:"mins",v:ST.mins,u:"minutes per run"}});
 /* 2 approvals */
 G(()=>INBOX.items(),0);
 const ax=G(()=>S.flw.apx.items,[]),done=ax.filter(x=>x.st!=="pending"&&x.st!=="info"&&x.turn!=null),inSla=done.filter(x=>x.turn<=x.sla);
 const med=a=>{a=a.slice().sort((x,y)=>x-y);const n=a.length;return n?(n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2):null};
 const turn=med(done.map(x=>x.turn)),ist=G(()=>INBOX.stats(),{});
 add({id:"m_val_sla",key:"sla",l:"Approvals decided inside SLA",v:done.length?100*inSla.length/done.length:null,disp:done.length?pct(100*inSla.length/done.length):"No data",sub:`${inSla.length} of ${done.length} decided records; ${nf(ist.overdue||0)} of ${nf(ist.queue||0)} queued items are past due`,formula:"decided approvals with turnaround ≤ SLA hours ÷ decided approvals × 100",source:"Approvals inbox records (S.flw.apx.items), INBOX.stats",go:"flw_appr",n:done.length,tone:done.length&&inSla.length===done.length?"good":"warn",small:done.length<30});
 add({id:"m_val_cycle",key:"cycle",l:"Median approval cycle",v:turn,disp:turn==null?"No data":nf(turn,1)+" h",sub:`median of ${done.length} decided records; calendar hours from request to decision`,formula:"median of (decision time − request time) over decided approvals",source:"Approvals inbox records (S.flw.apx.items)",go:"flw_appr",n:done.length,tone:"info",small:done.length<30});
 /* 3 approvals routed to groups */
 const ap=G(()=>INBOX.items().filter(x=>x.kind==="approval"),[]),grp=ap.filter(x=>x.apg),gps=G(()=>APG.groups(),[]);
 const withCrit=gps.filter(g=>g.quorum&&g.quorum.mode&&arr(g.scope).length&&g.backup);
 add({id:"m_val_groups",key:"groups",l:"Approvals routed to a group",v:ap.length?100*grp.length/ap.length:null,disp:ap.length?pct(100*grp.length/ap.length):"No data",sub:`${grp.length} of ${ap.length} open approvals; ${withCrit.length} of ${gps.length} groups have a quorum rule, scope and backup`,formula:"open approvals with an approver group ÷ open approvals × 100",source:"INBOX approvals, APG approval groups",go:"r16h_groups",n:ap.length,tone:"info"});
 /* 4 process ownership */
 const pl=G(()=>PROCLIB.list(),[]),cov=pl.filter(p=>p.owner&&p.backup&&p.named);
 add({id:"m_val_owner",key:"owner",l:"Processes with owner and backup",v:pl.length?100*cov.length/pl.length:null,disp:pl.length?pct(100*cov.length/pl.length):"No data",sub:`${cov.length} of ${pl.length} processes name a human owner and a backup`,formula:"processes with a named owner and a backup ÷ all processes × 100",source:"PROCLIB (process library)",go:"plat_proc",n:pl.length,tone:pl.length&&cov.length/pl.length>.9?"good":"warn"});
 /* 5 untraced metrics */
 const zc=G(()=>ZLINK.audit().checks.find(c=>c.id==="d_metric_untraced"),null);
 const un=zc?zc.bad:null,tot=zc?zc.total:null;
 add({id:"m_val_traced",key:"traced",l:"Metrics traced to a source field",v:tot?100*(tot-un)/tot:null,disp:tot?pct(100*(tot-un)/tot,1):"No data",sub:`${nf(un)} of ${nf(tot)} metrics untraced now; 63 untraced at the start of Round 16 (status doc, not live)`,formula:"metrics with at least one traced source field ÷ all metrics × 100",source:"ZLINK connectivity audit, ATLAS metric lineage",go:"zl_conn",n:tot,tone:"good"});
 /* 6 spend traced to goals (R16 strategy to execution) */
 const sx=G(()=>SXSUM(),null);
 add({id:"m_val_spend",key:"spend",l:"Funded dollars tied to a goal",v:sx?sx.cover:null,disp:sx?pct(sx.cover,1):"No data",sub:sx?`${usd(sx.trAppr)} of ${usd(sx.total)} funded; ${usd(sx.orAppr)} untraced across ${sx.nOrphan} project${sx.nOrphan===1?"":"s"}`:"Strategy to execution is not loaded",formula:"approved dollars of funded work that reach a goal through a capability and roadmap item ÷ all funded dollars × 100",source:"Strategy to execution (EXE, MAT, BUDX registries)",go:"strat_exec",n:sx?sx.nFunded:0,tone:sx&&sx.cover>=90?"good":"warn"});
 /* 7 consolidated screens */
 const fam=G(()=>R15.families,[]),views=fam.reduce((s,f)=>s+f.views.length,0);
 add({id:"m_val_merged",key:"merged",l:"Screens folded into shared families",v:views-fam.length,disp:nf(views-fam.length),sub:`${views} former screens now live in ${fam.length} families; ${Object.keys(G(()=>R15.hidden,{})).length} ids hidden or aliased`,formula:"Σ (views in a merge family − 1) over all merge families",source:"R15.families (reuse and merge registry)",go:"nav_studio",n:fam.length,tone:"info"});
 const recs=G(()=>COVER.recs,[]),reuse=recs.filter(r=>r.how!=="new");
 add({id:"m_val_reuse",key:"reuse",l:"Record sets that reuse or extend an entity",v:recs.length?100*reuse.length/recs.length:null,disp:recs.length?pct(100*reuse.length/recs.length):"No data",sub:`${reuse.length} of ${recs.length} record sets reuse, alias, derive or extend; ${recs.length-reuse.length} are new`,formula:"record sets whose integration decision is not 'new' ÷ all record sets × 100",source:"COVER.recs (data coverage register)",go:"plat_data",n:recs.length,tone:"info"});
 /* 8 contract */
 const cs=G(()=>CONTRACT.stats(),null);
 add({id:"m_val_contract",key:"contract",l:"Features with the full Feature Contract",v:cs?cs.fullPct:null,disp:cs?pct(cs.fullPct):"No data",sub:cs?`${cs.fullContract} of ${cs.features} features meet all four rules; ${cs.waivers} waivers; ${cs.openGaps} open gaps`:"",formula:"features that pass process, data, metrics and links rules ÷ all features × 100",source:"CONTRACT.stats (Feature contract matrix)",go:"plat_contract",n:cs?cs.features:0,tone:cs&&cs.fullPct>=80?"good":"warn"});
 /* 9 connectivity */
 const zs=G(()=>ZLINK.score(),null);
 add({id:"m_val_zlink",key:"zlink",l:"Connectivity score",v:zs,disp:zs==null?"No data":nf(zs),sub:"Weighted checks across data, process, workflow, ownership and search links",formula:"weighted share of passing connectivity checks, 0 to 100",source:"ZLINK.score (Connections and gaps)",go:"zl_conn",n:G(()=>ZLINK.audit().checks.length,0),tone:zs>=90?"good":"warn"});
 /* 10 continuity */
 const ob=G(()=>BCX.obligations(),[]),cur=ob.filter(o=>o.status==="Current"),od=ob.filter(o=>/Overdue/.test(o.status)),sch=ob.filter(o=>/Scheduled|In progress|Due soon/.test(o.status));
 add({id:"m_val_exercise",key:"exercise",l:"Continuity exercises current",v:ob.length?100*cur.length/ob.length:null,disp:ob.length?`${cur.length} of ${ob.length}`:"No data",sub:`${od.length} overdue, ${sch.length} scheduled or in progress; exercises run inside change windows`,formula:"applications whose last exercise is inside its tier cadence ÷ applications owing an exercise × 100",source:"BCX.obligations (Resilience exercise calendar)",go:"bc_cal",n:ob.length,tone:od.length?"warn":"good"});
 /* 11 controls */
 const cl=G(()=>GRCX.controls,[]),ct=cl.filter(c=>G(()=>GRCX.testCurrent(c),false)),ex=G(()=>GRCX.exceptions.filter(GRCX.excOpen),[]);
 add({id:"m_val_controls",key:"controls",l:"Controls with a current test",v:cl.length?100*ct.length/cl.length:null,disp:cl.length?`${ct.length} of ${cl.length}`:"No data",sub:`${ex.length} open exceptions or acceptances`,formula:"controls tested and not yet due for retest ÷ all controls × 100",source:"GRCX.controls, GRCX.testCurrent (Controls and testing)",go:"grc_ctl",n:cl.length,tone:cl.length&&ct.length/cl.length>.8?"good":"warn"});
 /* 12 cost of governance gaps */
 const dt=G(()=>DEBT.totals(),null),wv=G(()=>CONTRACT.waivers().length,0),dm=dt?dt.interest*rate:0;
 add({id:"m_val_gapcost",key:"gapcost",l:"Cost of open governance gaps",v:dt?dm*12:null,disp:dt?usd(dm*12)+" a year":"No data",sub:dt?`${nf(dt.n)} priced debt items cost ${nf(dt.interest,1)} h a month at ${usdF(rate)} per hour; ${usd(dt.principal*rate)} to fix; ${wv} open waivers not priced`:"",formula:"Σ monthly interest hours over open debt items × 12 × loaded hourly rate",source:"DEBT ledger (Technical debt)",go:"plat_debt",n:dt?dt.n:0,tone:"warn"});
 AC=out;ACK=k;
 /* keep each metric card in step with the live figure */
 out.forEach(f=>{const m=METRICS[f.id];if(m&&f.v!=null&&isFinite(f.v)){m.cur=Math.round(f.v*10)/10}});
 return out}
Q.tenant=tenant;
/* business case coverage: share of model inputs the viewer replaced with their own number (this session) */
Q.coverage=()=>{const e=edited().length;return Math.round(100*e/INPUTS.length)};

/* ================================================================ metrics ================================================================ */
const M0=(id,n,f,u,cur,tgt,bad,dir,mx,own,rem,use)=>{if(typeof METRICS==="undefined"||METRICS[id])return;METRICS[id]={n,f,u,cur,tgt,badAt:bad,dir,max:mx,tr:[0,1,2,3,4,5,6,7].map(i=>Math.round((cur+(dir==="max"?-1:1)*(7-i)*mx*.012)*10)/10),owner:own,use:use||["Value realized"],rem}};
const REM=(t,a,p)=>({kind:"sop",ref:"SOP-VAL-01",title:t,agent:a||"Portfolio Agent",auto:false,state:"idle",prog:p||"Lists the records that pull this figure down and who owns them"});
function metrics(){
 const o=OWN.value[0];
 M0("m_val_hours","Hours returned","Agent runs per day × minutes saved per run ÷ 60 (runs from the agent registry; minutes per run is an editable assumption)","h",37,50,20,"max",120,o,REM("Review agents with low runs or low acceptance"));
 M0("m_val_cover","Business case coverage","Model inputs replaced with your own number ÷ all model inputs × 100 (this session)","%",0,80,20,"max",100,o,REM("Replace illustrative inputs with finance data before sharing a case"));
 M0("m_val_runs","Agent runs per day","Σ runs per day over enabled agents, from each agent's 24-hour activity profile","",411,450,300,"max",800,o,REM("Check agents that are paused or off shift"));
 M0("m_val_sla","Approvals decided inside SLA","Decided approvals with turnaround at or under SLA hours ÷ Approvals decided × 100","%",100,90,70,"max",100,o,REM("Nudge approver groups at half of SLA"));
 M0("m_val_cycle","Median approval cycle","Median of (decision time − request time) over decided approvals","h",7,16,30,"min",48,o,REM("Review stages that hold approvals longest"));
 M0("m_val_groups","Approvals routed to a group","Open approvals with an approver group ÷ Open approvals × 100","%",90,100,80,"max",100,o,REM("Bind each unrouted approval path to an approval group"));
 M0("m_val_owner","Processes with owner and backup","Processes with a named owner and a backup ÷ Processes × 100","%",89,100,80,"max",100,o,REM("Assign a backup to each process without one"));
 M0("m_val_traced","Metrics traced to a source field","Metrics with a traced source field ÷ Metrics × 100","%",99,100,90,"max",100,o,REM("Map each untraced metric term to an entity field"));
 M0("m_val_spend","Funded dollars tied to a goal","Approved dollars of funded work that reach a goal ÷ approved dollars of funded work × 100","%",97,100,85,"max",100,o,REM("Map orphan projects to a goal or stop them"));
 M0("m_val_merged","Screens folded into shared families","Σ (views in a merge family − 1) over merge families","",26,30,10,"max",60,o,REM("Merge the next duplicate screen family"));
 M0("m_val_reuse","Record sets that reuse or extend an entity","Record sets whose integration decision is not new ÷ Record sets × 100","%",47,60,30,"max",100,o,REM("Revisit new entities that duplicate an existing one"));
 M0("m_val_contract","Features with the full Feature Contract","Features that pass all four rules ÷ Features × 100","%",60,80,40,"max",100,o,REM("Close the gaps listed on the Feature contract screen"));
 M0("m_val_zlink","Connectivity score","Weighted share of passing connectivity checks, 0 to 100","",92,95,85,"max",100,o,REM("Fix the highest-weight finding on Connections and gaps"));
 M0("m_val_exercise","Continuity exercises current","Applications whose last exercise is inside its tier cadence ÷ Applications owing an exercise × 100","%",39,100,50,"max",100,o,REM("Schedule the overdue exercises inside the next change window"));
 M0("m_val_controls","Controls with a current test","Controls tested and not yet due for retest ÷ Controls × 100","%",17,90,50,"max",100,o,REM("Assign the due tests to testers"));
 M0("m_val_gapcost","Cost of open governance gaps ($ a year)","Σ monthly interest hours over open debt items × 12 × loaded hourly rate","$",224000,100000,300000,"min",500000,o,REM("Pay down the highest-interest debt items first"));
 /* thinking screen */
 M0("m_val_evidence","Product evidence tiles with a live source","Evidence tiles whose count is read from a registry ÷ All evidence tiles × 100","%",92,100,70,"max",100,OWN.think[0],REM("Link each static tile to a registry","Portfolio Agent","Lists tiles that show a typed number"),["How it was built"]);
 M0("m_val_decisions","Decisions with a stated reason","Decisions with a reason recorded in the log ÷ Decisions in the log × 100","%",2,50,10,"max",100,OWN.think[0],REM("Add the reason when a decision is logged","Portfolio Agent","Lists decisions logged without a reason"),["How it was built"]);
}
metrics();

/* ================================================================ data model, process, links (Feature Contract) ================================================================ */
const fld=(k,label,type,cls,ref)=>Object.assign({k,label,type,authority:"platform",classification:cls||"internal"},ref?{ref}:{});
const ENTS=()=>[
 {id:"value_assumption",label:"Value assumption",domain:"gov",source:"Automatic",ownerApp:"Automatic",ownerMod:"r17q_value",status:"live",steward:OWN.value[0],note:"Integration decision: new and thin. No existing entity holds an editable model input with a default, a range and an illustrative or own-data tag. The input owner is a person reference; money inputs are not copied from budget lines.",fields:[fld("key","Key","string"),fld("label","Label","string"),fld("unit","Unit","string"),fld("default_value","Illustrative default","number"),fld("value","Current value","number"),fld("tag","Tag (illustrative or own data)","enum"),fld("owner","Owner","ref","internal","person"),fld("backup","Backup","ref","internal","person")]},
 {id:"value_scenario",label:"Value scenario",domain:"gov",source:"Automatic",ownerApp:"Automatic",ownerMod:"r17q_value",status:"live",steward:OWN.value[0],note:"Integration decision: new and thin, referencing scenario. The financial scenario record holds a budget envelope; a value scenario holds a saved set of model inputs and the results computed from them, and can be compared with another saved scenario.",fields:[fld("name","Name","string"),fld("inputs","Inputs (JSON)","text"),fld("results","Results (JSON)","text"),fld("scenario","Related financial scenario","ref","internal","scenario"),fld("owner","Owner","ref","internal","person"),fld("backup","Backup","ref","internal","person"),fld("created","Created","date")]}];
const PSX=a=>({n:a[0],d:a[1],who:a[2],owner:a[3],sla:a[4],in:a[5],out:a[6]});
const PROCS=[
 {id:"r17q.value",name:"Quantify and share the value of the platform",screen:"r17q_value",owner:OWN.value[0],bak:OWN.value[1],trigger:"A prospect or sponsor asks what the platform is worth, or a published default changes",std:["tbm","cobit"],metrics:["m_val_hours","m_val_cover","m_val_gapcost"],entities:["value_assumption","value_scenario"],steps:[
  ["Read the tenant figures","Figures are computed from the registries; none are typed in.","robot","Robot","Instant","Registries","Layer A figures"],
  ["Enter your assumptions","The viewer replaces illustrative inputs with their own numbers.","human","Avery Chen","1 hour","Layer A figures","Layer B inputs"],
  ["Compute the model","Every formula is shown with the substituted numbers; low, base and high cases are drawn.","robot","Robot","Instant","Layer B inputs","Results and sensitivity"],
  ["Review the case","Finance reviews inputs marked illustrative before the case is shared.","human","Maya Ortiz","3 days","Results","Reviewed case"],
  ["Approve published defaults","A change to the default inputs is decided by a group.","gate","Portfolio board","1 week","Reviewed case","Published defaults"]]},
 {id:"r17q.thinking",name:"Explain how the product was designed",screen:"r17q_thinking",owner:OWN.think[0],bak:OWN.think[1],trigger:"A round closes, or a decision is added to the decisions log",std:["togaf","dmbok"],metrics:["m_val_evidence","m_val_decisions"],entities:["meeting_decision"],steps:[
  ["Log the decision","Each decision is written with its date, reason and consequence.","human","Maya Ortiz","Same day","Round work","Decision record"],
  ["Parse the log","The decisions log is read into the decisions table at build time.","robot","Robot","Instant","Decisions log","Decisions table"],
  ["Refresh the evidence","Counts are read live from the registries.","robot","Robot","Instant","Registries","Evidence tiles"],
  ["Review the narrative","The owner checks principles and timeline against the log.","human","Priya Shah","1 week","Decisions table","Reviewed page"],
  ["Approve changes to principles","A change to a standing principle is decided by a group.","gate","Portfolio board","1 week","Reviewed page","Published principles"]]}];
Q.PROCS=PROCS;
PROCS.forEach(p=>G(()=>PROC.reg(p.screen,{title:p.name,std:p.std,steps:p.steps.map(PSX)})));
const MODDEF={
 r17q_value:{name:"Value realized",r:["agent_run","person","approval","contract_line"],w:["value_assumption","value_scenario"]},
 r17q_thinking:{name:"How it was built",r:["meeting_decision","process_definition","person"],w:[]}};
function ensurePerm(){try{if(!(W.PERM&&PERM.state&&PERM.addRule))return;let n=0;["r17q_value","r17q_thinking"].forEach(id=>{if(!PERM.state.rules.some(r=>r.res==="screen:"+id)){PERM.addRule({name:"Open "+id,effect:"allow",sub:{roles:["*","!vendor_guest"]},res:"screen:"+id,act:["read"],when:"",why:"Value and design rationale pages show aggregate counts only; no restricted records are read.",tier:"screen",kind:"seed",owner:OWN.value[0],reviewed:G(()=>TODAY,null)});n++}});W_.perm=1;return n}catch(e){}}
Q.ensurePerm=ensurePerm;
const W_={ent:0,mod:0,flow:0,proc:0,own:0,rec:0,evt:0,nav:0,perm:0,tries:0};
Q.wireState=W_;
function wire(){W_.tries++;
 try{if(!W_.ent&&W.ATLAS&&ATLAS.addEntity){let ok=true;ENTS().forEach(d=>{try{const r=ATLAS.addEntity(d);if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});W_.ent=ok?1:0}}catch(e){}
 try{if(!W_.mod&&W.MODMAP&&MODMAP.addModule){let ok=true;Object.keys(MODDEF).forEach(id=>{const o=MODDEF[id],P=PROCS.find(p=>p.screen===id);const r=MODMAP.addModule({id,name:o.name,sn:o.name,band:"str",own:P.owner,r:o.r.filter(x=>G(()=>DATAMODEL.tables[x],0)||/^value_/.test(x)),w:o.w,proposed:false,flows:[]});if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false});W_.mod=ok?1:0}}catch(e){}
 try{if(W_.mod&&!W_.flow&&W.MODMAP&&MODMAP.addFlows){const f=(from,to,data,entity,mode,trig)=>({from,to,data,entity,mode,trig});
  const r=MODMAP.addFlows([f("r15d_agents","r17q_value","Agent runs per day","agent_run","api","Daily"),f("flw_appr","r17q_value","Decided approvals and SLA","approval","api","Approval decided"),f("plat_proc","r17q_value","Process owner and backup coverage","process_definition","api","Daily"),f("plat_debt","r17q_value","Priced technical debt","debt_item","api","Daily"),f("strat_exec","r17q_value","Funded dollars tied to goals","objective","api","Daily"),f("plat_contract","r17q_value","Feature Contract coverage","process_definition","api","Daily"),
   f("r17q_value","exe_dash","Hours returned and business case","value_scenario","batch","Daily"),f("r17q_value","inbox","Review requests for illustrative inputs","value_assumption","event","Scenario saved"),
   f("r15d_agents","r17q_thinking","Agent registry counts","agent_run","api","Daily"),f("plat_contract","r17q_thinking","Feature Contract coverage","process_definition","api","Daily"),f("r16g_perm","r17q_thinking","Permission rule counts","process_definition","api","Daily"),f("r17q_thinking","plat_contract","Principles checked by the Feature Contract","process_definition","human","Round closes"),f("r17q_thinking","kcs_home","Thesis and principles as knowledge","process_definition","human","Page reviewed")]);
  if(r&&r.ok!==false)W_.flow=1}}catch(e){}
 try{if(W_.mod&&W_.ent&&!W_.proc&&W.PROCLIB&&PROCLIB.addProcess){let ok=true;PROCS.forEach(p=>{try{const r=PROCLIB.addProcess({id:p.id,name:p.name,module:p.screen,family:"Strategy and performance",owner:p.owner,trigger:p.trigger,steps:p.steps.map(PSX),inputs:[p.steps[0][5]],outputs:[p.steps[p.steps.length-1][6]],entities:p.entities,metrics:p.metrics,model:"cmmi",target:3,std:p.std});if(r&&r.ok===false&&!(r.warnings||[]).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});W_.proc=ok?1:0}}catch(e){}
 try{if(W_.proc&&!W_.own&&W.OWNX&&OWNX.assign){let ok=true;PROCS.forEach(p=>{const a=OWNX.assign("process",p.id,p.owner,p.bak);if(!a||!a.ok)ok=false;OWNX.assign("module",p.screen,p.owner,p.bak);OWNX.assign("process",p.screen,p.owner,p.bak)});W_.own=ok?1:0}}catch(e){}
 try{if(!W_.rec&&W.COVER&&Array.isArray(COVER.recs)){[["VAL_ASM","Value assumptions","r17q_value","value_assumption","new",()=>INPUTS.length],["VAL_SCN","Value scenarios","r17q_value","value_scenario","new",()=>ST.scn.length],["VAL_AGT","Agent runs read for hours returned","r17q_value","agent_run","direct",()=>G(()=>AGENTRT.runs.length,1)],
   ["THK_DEC","Product decisions log","r17q_thinking","meeting_decision","alias",()=>arr(G(()=>R17Q_DATA.decisions,[])).length],["THK_PRC","Process library counts","r17q_thinking","process_definition","direct",()=>G(()=>PROCLIB.stats().processes,1)]].forEach(x=>{if(!COVER.recs.some(r=>r.key===x[0]))COVER.recs.push({key:x[0],label:x[1],scr:[x[2]],mod:x[2],n:G(x[5],1),ent:x[3],how:x[4],path:"R17Q"})});W_.rec=1}}catch(e){}
 try{if(!W_.evt&&W.EVENTS&&EVENTS.register){[["value.scenario_saved","Value scenario saved","r17q_value"],["value.assumption_changed","Value assumption changed","r17q_value"]].forEach(e=>{try{EVENTS.register({id:e[0],label:e[1],module:e[2],fields:[{name:"scenario",type:"string"},{name:"actor",type:"string"},{name:"detail",type:"string"}],owner:OWN.value[0]})}catch(x){}});W_.evt=1}}catch(e){}
 ensurePerm();
 if(!(W_.ent&&W_.mod&&W_.flow&&W_.proc&&W_.own&&W_.rec&&W_.evt&&W_.perm)||W_.tries<8)if(W_.tries<22)setTimeout(wire,900)}
setTimeout(wire,1500);[4000,9000,16000].forEach(t=>setTimeout(ensurePerm,t));

/* ---------------- navigation, aliases, search, chat ---------------- */
function nav(){
 if(W.NAVX&&NAVX.add&&!W_.nav){NAVX.add("r17q_value",{group:"strat",label:"Value realized",hint:"What the platform is worth: figures from this tenant's data and an editable business case",sub:"Value",kw:"value roi business case npv payback hours returned savings quantify worth benefit assumptions scenario model cost"});
  NAVX.add("r17q_thinking",{group:"strat",label:"How it was built",hint:"The thesis, design principles, rounds, decisions and evidence behind the product",sub:"Design rationale",kw:"thesis principles design decisions rounds timeline evidence why built thought process rationale not built"});W_.nav=1}
 const R15=W.R15=W.R15||{};R15.alias=R15.alias||{};R15.hidden=R15.hidden||{};
 R15.alias.value={to:"r17q_value"};R15.alias.thinking={to:"r17q_thinking"};R15.hidden.value=1;R15.hidden.thinking=1;
 if(R15.names){R15.names.r17q_value="Value realized";R15.names.r17q_thinking="How it was built"}
 G(()=>{NAVX.alias=NAVX.alias||{};NAVX.alias["value"]="r17q_value";NAVX.alias["value realized"]="r17q_value";NAVX.alias["thinking"]="r17q_thinking";NAVX.alias["how it was built"]="r17q_thinking"})}
nav();setTimeout(nav,900);
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>{const o=[{g:"Go to",t:"Value realized",m:"Figures from this tenant's data and an editable business case",c:"--accent",f:()=>go("r17q_value"),k:"value roi business case npv payback hours returned worth savings r17q"},{g:"Go to",t:"How it was built",m:"Thesis, principles, rounds, decisions, evidence",c:"--accent",f:()=>go("r17q_thinking"),k:"thesis principles design decisions rounds timeline evidence why thought process r17q"}];
 G(()=>(AC||[]).forEach(f=>o.push({g:"Value figures",t:f.l,m:f.disp,c:"--good-f",f:()=>{S.v.r17qv=0;go("r17q_value")},k:"value "+f.key+" "+f.source+" "+f.formula})),0);
 G(()=>ST.scn.forEach(s=>o.push({g:"Value scenarios",t:s.name,m:"Saved business case scenario",c:"--info-f",f:()=>{S.v.r17qv=2;go("r17q_value")},k:"value scenario "+s.name})),0);
 G(()=>arr(R17Q_DATA.decisions).forEach(d=>o.push({g:"Product decisions",t:d.decision.slice(0,90),m:d.date+" "+d.round,c:"--p4",f:()=>{ST.q=d.id;S.v.r17qt=2;go("r17q_thinking")},k:"decision "+d.id+" "+d.full})),0);
 return o});
if(typeof ASKX!=="undefined")ASKX.push(q=>{const t=String(q||"").toLowerCase();
 if(/(what is|what's|how much).*(platform|oukala|this|product).*(worth|value)|value realized|business case|payback|roi of|hours returned|npv/.test(t)){
  const T=tenant(),h=T.find(x=>x.key==="hours"),M=model(inputs());S.v.r17qv=/business case|payback|roi|npv/.test(t)?1:0;go("r17q_value");
  say(q,{t:`<b>Measured from this tenant:</b> ${h?h.disp:""} returned per day. <b>Modeled, illustrative inputs:</b> ${usdF(M.npv)} ${M.yrs}-year net present value, payback ${M.pb==null?"not within the model":nf(M.pb,1)+" months"}. The model is not a measured result.`,steps:["Read the agent registry and approval records","Computed the business case from the current inputs"]});return true}
 if(/(how was|how is) (this|the product|it) (built|designed)|design principles|why was this built|thesis|what (did you|we) choose not to build/.test(t)){S.v.r17qt=/not to build|not build/.test(t)?4:0;go("r17q_thinking");say(q,{t:"Opened How it was built: thesis, design principles, rounds, decisions and evidence.",steps:["Opened the design rationale"]});return true}
 return false});
Q.audit=(a,d)=>G(()=>audit(a,d),0);
})();

/* ============ PPM data: demand, integrated master schedule, capacity, product log ============ */
/* Work calendar: Monday to Friday, no holidays modeled. A "work day number" (wdn) counts work days from Jul 1, 2026. */
const WD=[];(function(){const d=new Date(Date.UTC(2026,6,1)),end=Date.UTC(2028,0,1);while(d.getTime()<end){const g=d.getUTCDay();if(g!==0&&g!==6)WD.push(d.getTime());d.setUTCDate(d.getUTCDate()+1)}})();
const DAYMS=864e5,CAL0=Date.UTC(2026,6,1);
const wdOf=iso=>{const t=Date.parse(iso+"T00:00:00Z");let lo=0,hi=WD.length-1;while(lo<hi){const m=(lo+hi)>>1;if(WD[m]<t)lo=m+1;else hi=m}return lo};
const dateOf=w=>new Date(WD[Math.max(0,Math.min(WD.length-1,w))]);
const fmtD=(w,y)=>dateOf(w).toLocaleDateString("en-US",{month:"short",day:"numeric",...(y?{year:"numeric"}:{}),timeZone:"UTC"});
const xday=w=>(WD[Math.max(0,Math.min(WD.length-1,w))]-CAL0)/DAYMS;
const TODAY=wdOf("2026-10-06");

const PROJ=[
 {id:"PR1",n:"Codification Platform Upgrade",short:"Codification",c:"--p4",owner:"Priya Shah",bac:1200,paid:740,rec:"PR1"},
 {id:"PR2",n:"Taxonomy Data Hub",short:"Taxonomy",c:"--s3",owner:"Dev Rao",bac:860,paid:770,rec:"PR2"},
 {id:"PR3",n:"Portal Resilience",short:"Portal",c:"--e4",owner:"Tom Becker",bac:310,paid:120,rec:"S1"},
 {id:"PR4",n:"Contract Repository Refresh",short:"Contracts",c:"--u3",owner:"Maya Ortiz",bac:540,paid:60,rec:"R1"}];
const CAP={"Platform team":8,"Data team":6,"Lumen (vendor)":5,"Ops team":5,"Editors":4,"Architecture":3};
/* Task fields: dur = current work days, bdur = baseline work days, pred = [id] or [[id,lag]], snet = start no earlier than, pct = percent complete, res = [[resource,FTE]] */
/* ============ Tasks, WBS and the planning engine ============
 TASKS holds the schedulable lines only: work lines and milestones (the leaves of the WBS). Summary lines live in SUMS and are
 never scheduled as work: their dates, percent complete, cost and work are rolled up from their children (see rollup()).
 Each project has an outline OUTL[projectId]: the ordered list of line ids (summaries and tasks) with an outline level `lv`.
 A line is the child of the nearest earlier line with a lower level. WBS codes (1, 1.1, 1.1.1) are derived from that order.
 Task fields: id p n dur bdur pred[] ms pct own res[[team,FTE]] asg[[name,units%]] ven note
   pred entries: "id" (finish to start) or [id,lagWorkDays,"FS"|"SS"|"FF"|"SF"]
   ct,cd constraint type and ISO date (snet kept for older code), dl deadline (ISO)
   as,af actual start and finish (work day numbers), bs,bf frozen baseline start and finish (work day numbers, exclusive finish)
   cost,ac budget and actual cost in $K, dv deliverable, acc acceptance criteria, d description, st status override */
const SUMS=[],OUTL={},TASKS=[];
const XT={on:false,m:new Map(),sm:new Map(),pm:new Map(),tasks:[],sums:[],proj:[],outl:{}};  /* generated enterprise-scale plans (SCALE.on) */
const IDX={v:-1};
const TMAP={m:new Map(),n:-1},SMAP={m:new Map(),n:-1};
let TVER=1;
const wbsTouch=()=>{TVER++;TMAP.n=-1;SMAP.n=-1;IDX.v=-1};
const TASK=id=>{if(TMAP.n!==TASKS.length){TMAP.m=new Map(TASKS.map(t=>[t.id,t]));TMAP.n=TASKS.length}let t=TMAP.m.get(id);if(!t&&XT.on){t=XT.m.get(id)}return t};
const SUMOF=id=>{if(SMAP.n!==SUMS.length){SMAP.m=new Map(SUMS.map(t=>[t.id,t]));SMAP.n=SUMS.length}return SMAP.m.get(id)||(XT.on?XT.sm.get(id):undefined)};
const LINE=id=>TASK(id)||SUMOF(id);
const predId=p=>Array.isArray(p)?p[0]:p, predLag=p=>Array.isArray(p)?(p[1]||0):0, predType=p=>Array.isArray(p)?(p[2]||"FS"):"FS";
const mkPred=(id,type,lag)=>(!type||type==="FS")&&!lag?id:[id,lag||0,type||"FS"];
const PTYPES=[["FS","Finish to start"],["SS","Start to start"],["FF","Finish to finish"],["SF","Start to finish"]];
const CTYPES=[["ASAP","As soon as possible"],["SNET","Start no earlier than"],["SNLT","Start no later than"],["FNET","Finish no earlier than"],["FNLT","Finish no later than"],["MSO","Must start on"],["MFO","Must finish on"]];
const conOf=t=>t.ct&&t.ct!=="ASAP"&&t.cd?[t.ct,t.cd]:t.snet?["SNET",t.snet]:["ASAP",null];
const isoOf=w=>dateOf(w).toISOString().slice(0,10);
/* Critical path method with all four link types, lags, constraints, deadlines and actual dates.
   Finish is exclusive (ef = es + duration); a milestone has es = ef. opts.noAct ignores actual dates (used for the baseline). */
function cpm(durOf,list,o){list=list||TASKS;o=o||{};const n=list.length,ix=new Map();for(let i=0;i<n;i++)ix.set(list[i].id,i);
 const pr=new Array(n),sc=new Array(n);for(let i=0;i<n;i++){pr[i]=[];sc[i]=[]}
 for(let i=0;i<n;i++){const t=list[i];(t.pred||[]).forEach(p=>{const j=ix.get(predId(p));if(j==null||j===i)return;const ty=predType(p),lag=predLag(p);pr[i].push([j,ty,lag]);sc[j].push([i,ty,lag])})}
 const deg=pr.map(a=>a.length),q=[];for(let i=0;i<n;i++)if(!deg[i])q.push(i);const order=[];
 for(let h=0;h<q.length;h++){const i=q[h];order.push(i);sc[i].forEach(([s])=>{if(--deg[s]===0)q.push(s)})}
 const cyc=[];if(order.length<n){for(let i=0;i<n;i++)if(deg[i]>0){cyc.push(list[i].id);order.push(i)}}
 const es=new Array(n),ef=new Array(n),dd=new Array(n),drv=new Array(n);
 for(const i of order){const t=list[i];let d=durOf(t),s=0,dr=null;
  pr[i].forEach(([j,ty,lag])=>{if(ef[j]==null)return;const v=ty==="FS"?ef[j]+lag:ty==="SS"?es[j]+lag:ty==="FF"?ef[j]+lag-d:es[j]+lag-d;if(v>s){s=v;dr=list[j].id}});
  const [ct,cd]=conOf(t);if(cd){const w=wdOf(cd);if(ct==="SNET")s=Math.max(s,w);else if(ct==="FNET")s=Math.max(s,d?w+1-d:w);else if(ct==="MSO")s=w;else if(ct==="MFO")s=d?w+1-d:w}
  let e=s+d;
  if(!o.noAct){if(t.as!=null&&(t.pct>0||t.af!=null))s=t.as;
   if(t.ms){if(t.af!=null)s=t.af;e=s}else if(t.af!=null){e=t.af+1;if(e<=s)e=s+1}else e=s+d}
  es[i]=s;ef[i]=e;dd[i]=e-s;drv[i]=dr}
 const pe={};for(let i=0;i<n;i++){const t=list[i];pe[t.p]=Math.max(pe[t.p]||0,ef[i])}
 const ls=new Array(n),lf=new Array(n),fl=new Array(n),ff=new Array(n);
 for(let k=order.length-1;k>=0;k--){const i=order[k],t=list[i],d=dd[i];let L=pe[t.p],F=Infinity;
  sc[i].forEach(([s,ty,lag])=>{if(ls[s]==null)return;let v,f;if(ty==="FS"){v=ls[s]-lag;f=es[s]-lag-ef[i]}else if(ty==="SS"){v=ls[s]-lag+d;f=es[s]-lag-es[i]}else if(ty==="FF"){v=lf[s]-lag;f=ef[s]-lag-ef[i]}else{v=lf[s]-lag+d;f=ef[s]-lag-es[i]}if(v<L)L=v;if(f<F)F=f});
  if(t.dl){const w=wdOf(t.dl);L=Math.min(L,d||t.ms?(t.ms?w:w+1):w+1)}
  const [ct,cd]=conOf(t);if(cd){const w=wdOf(cd);if(ct==="SNLT"||ct==="MSO")L=Math.min(L,w+d);else if(ct==="FNLT"||ct==="MFO")L=Math.min(L,t.ms?w:w+1)}
  lf[i]=L;ls[i]=L-d;fl[i]=ls[i]-es[i];ff[i]=F===Infinity?Math.max(0,pe[t.p]-ef[i]):Math.max(0,F)}
 const R={};for(let i=0;i<n;i++){const t=list[i];R[t.id]={es:es[i],ef:ef[i],d:dd[i],lf:lf[i],ls:ls[i],fl:fl[i],ffl:ff[i],drv:drv[i],succ:sc[i].map(x=>list[x[0]].id),lnk:sc[i].map(x=>[list[x[0]].id,x[1],x[2]])}}
 return {R,pe,cyc,list}}
const planDur=(ch,extra)=>t=>Math.max(t.ms?0:1,t.dur+(ch[t.id]||0)+(extra[t.id]||0));
/* Baseline: durations are the baseline durations, actual dates are ignored, frozen baseline dates (bs, bf) win once "set baseline" was used */
const BCM=new Map();
function baseCalc(list){list=list||TASKS;const key=TVER+":"+list.length+":"+(list.length>600?"big":list.reduce((a,t,i)=>a+((t.bdur!=null?t.bdur:t.dur)+1)*(i+3)+(t.bs!=null?t.bs:0),0));const hit=BCM.get(list);if(hit&&hit.key===key)return hit.v;
 const b=cpm(t=>t.ms?0:Math.max(1,t.bdur!=null?t.bdur:t.dur),list,{noAct:true});
 list.forEach(t=>{if(t.bs!=null&&t.bf!=null&&b.R[t.id]){b.R[t.id].es=t.bs;b.R[t.id].ef=t.bf;b.R[t.id].d=t.bf-t.bs}});
 const pe={};list.forEach(t=>{pe[t.p]=Math.max(pe[t.p]||0,b.R[t.id].ef)});b.pe=pe;BCM.set(list,{key,v:b});return b}
const BASE={get R(){return baseCalc().R},set R(v){},get pe(){return baseCalc().pe},set pe(v){}};
/* What-if changes to durations, in work days. Positive slips the task, negative crashes it. */
const IMS_SCEN=[["now","Current plan",{}],["lumen5","Lumen slips 5 more work days",{p1_3:5}],["lumen10","Lumen slips 10 more work days",{p1_3:10}],["crash","Add two Lumen engineers to the indexer",{p1_3:-4}],["uat","Editor testing takes twice as long",{p1_6:12}]];
const PC={};
function plan(scen,list){const ch=(IMS_SCEN.find(s=>s[0]===scen)||IMS_SCEN[0])[2];const extra=S.imsSlip||{};list=list||TASKS;
 const key=scen+"|"+JSON.stringify(extra)+"|"+TVER+"|"+list.length+"|"+list.reduce((a,t,i)=>a+(t.dur+1)*(i+3)+(t.pct||0)+(t.as!=null?t.as:0)+(t.af!=null?t.af*2:0),0);
 const hit=PC[scen+"@"+(list===TASKS?"c":"u")];if(hit&&hit.key===key&&hit.l===list)return hit.P;
 const P=cpm(planDur(ch,extra),list);P.scen=scen;PC[scen+"@"+(list===TASKS?"c":"u")]={key,l:list,P};return P}
const projFin=(P,id)=>{let m=0;for(const t of PTASKS(id)){const r=P.R[t.id];if(r&&r.ef>m)m=r.ef}return m};
const PTASKS=id=>{const c=PTC;if(c.v!==TVER||c.n!==TASKS.length){c.m=new Map();TASKS.forEach(t=>{(c.m.get(t.p)||c.m.set(t.p,[]).get(t.p)).push(t)});c.v=TVER;c.n=TASKS.length}return c.m.get(id)||(XT.on&&XT.pm.get(id))||[]};
const PTC={v:-1,n:-1,m:new Map()};
/* Work (hours) and cost helpers */
const HRS=8;
const workOf=t=>{if(t.ms)return 0;const f=(t.res||[]).reduce((a,r)=>a+r[1],0);if(f)return f*t.dur*HRS;const u=(t.asg||[]).reduce((a,r)=>a+r[1],0)/100;return (u||.25)*t.dur*HRS};
/* Earned value, weighted by effort (work days x FTE). Milestones carry no effort. */
function evm(P,id){let pv=0,ev=0,tot=0;const B=baseCalc(P.list||TASKS).R;PTASKS(id).forEach(t=>{if(t.ms)return;const fte=t.res.reduce((a,r)=>a+r[1],0)||1,w=fte*t.dur;const b=B[t.id],pp=Math.max(0,Math.min(1,(TODAY-b.es)/Math.max(1,b.ef-b.es)));tot+=w;pv+=w*pp;ev+=w*(t.pct/100)});return {pv:pv/tot,ev:ev/tot,spi:pv?ev/pv:1}}

/* ---- Seed WBS text. One line per WBS element: TAG|id|name|days|predecessors|percent|owner|team FTE|people units%|options
   TAG = S (summary), T (task) or M (milestone) followed by the outline level. Predecessors: id[:FS|SS|FF|SF][+lag]. Options use ~ between key=value pairs. ---- */
const WBS_SEED={
PR1:`
S1|-|Initiation and governance||||Priya Shah|||d=Mobilize the project, fund it and set up governance.
M2|p1_10|Project kickoff|0||100|Priya Shah||Priya Shah:100|dv=Kickoff deck and draft charter~acc=Sponsor and PMO attended
T2|p1_11|Charter and business case|3|p1_10|100|Priya Shah||Priya Shah:60,Maya Ortiz:20|dv=Signed project charter~acc=Charter signed by the CIO and Chief Editor
T2|p1_12|Steering committee, RACI and RAID log setup|4|p1_11|100|Maya Ortiz||Maya Ortiz:40,PMO Agent:50|dv=Governance calendar, RACI, RAID log
T2|p1_13|Lumen SOW-4 statement of work and onboarding|5|p1_11|100|Maya Ortiz||Contract Analyst Agent:60,Maya Ortiz:30|ven=V1~dv=Signed SOW-4 and vendor access~acc=Obligations loaded into the contract register
M2|p1_14|Funding approved by the steering committee|0|p1_12,p1_13|100|Omar Hamid||Omar Hamid:5|dv=Funding decision minute
S1|-|Requirements and design||||Priya Shah|||d=Agree what the platform must do and how it will be built.
T2|p1_1|Requirements and design|20|p1_11|100|Priya Shah|Architecture:2,Editors:1|Priya Shah:50,Jordan Lee:50,Chief Editor:30|snet=2026-07-06~dv=Approved requirements and design baseline~acc=Design review board approval, traceability matrix complete
S2|-|Editorial requirements||||Chief Editor
T3|p1_15|Editor workshops: authoring and review|6|p1_11|100|Chief Editor||Chief Editor:50,First Officer:30|dv=Workshop notes and journey maps
T3|p1_16|Requirements catalog and traceability matrix|8|p1_15|100|Priya Shah||Priya Shah:50,Knowledge Curator:60|dv=Requirements catalog v1.0
T3|p1_17|Service levels and non-functional requirements|5|p1_16|100|Jordan Lee||Jordan Lee:40|dv=Availability, performance and retention targets
S2|-|Architecture and security design||||Jordan Lee
T3|p1_18|Solution architecture decision records|5|p1_16|100|Jordan Lee||Jordan Lee:60|dv=Architecture decision records ADR-01 to ADR-09
T3|p1_19|Entra ID access model and security review|5|p1_18|100|Rina Okafor||Rina Okafor:40|dv=Access model and threat model
M2|p1_20|Design gate G1: baseline approved|0|p1_1,p1_17,p1_18|100|Omar Hamid||Omar Hamid:5|dv=Gate G1 record~acc=No open severity 1 design risks
S1|-|Build||||Priya Shah|||d=Build the platform, the search indexer and the content migration.
S2|-|Core platform||||Sam Patel
T3|p1_2|Core platform build|45|p1_1,p1_14,p1_20|100|Priya Shah|Platform team:7|Sam Patel:100,Elise Park:100,Priya Shah:30|dv=Codification Platform release candidate 0.9~acc=All build stories accepted, no open severity 1 defects
T3|p1_21|Azure environments and CI/CD pipeline|10|p1_20|100|Sam Patel||Sam Patel:60,Contoso Cloud Operations:40|dv=Dev, test and production environments
S3|-|Authoring workflow||||Priya Shah
T4|p1_22|Authoring workflow configuration|15|p1_21|100|Priya Shah||Priya Shah:40,Elise Park:50
T4|p1_48|Reviewer routing rules|6|p1_22|100|Priya Shah||Priya Shah:30,Chief Editor:20
T4|p1_49|Redline and comparison view|8|p1_22|100|Elise Park||Elise Park:60
S3|-|Citation and versioning||||Sam Patel
T4|p1_23|Version and citation engine|20|p1_21|100|Sam Patel||Sam Patel:70
T4|p1_50|Citation link checker|6|p1_23|100|Test Agent||Test Agent:100|dv=Automated link checker with nightly report
T3|p1_24|Role based access with Entra ID groups|8|p1_19,p1_21|100|Rina Okafor||Rina Okafor:30,Sam Patel:30
M3|p1_25|Core build complete|0|p1_2,p1_22,p1_23,p1_24,p1_48,p1_49,p1_50|100|Priya Shah||Priya Shah:2|dv=Core build acceptance record
S2|-|Search and indexing (Lumen)||||Marco Ellis
T3|p1_26|Relevance corpus preparation|15|p1_20|100|Chief Editor||Chief Editor:30,Knowledge Curator:60,Marco Ellis:20|dv=Labeled relevance corpus, 2,400 queries
T3|p1_3|Search indexer (Lumen)|59|p1_1,p1_13|70|Lumen|Lumen (vendor):4|Marco Ellis:100,Lumen Search Services:50|bdur=52~ven=V1~dv=Search indexer v1 with relevance targets~acc=SOW-4 milestone 3: precision at 10 of 0.82 or better~note=Seven work days late: Lumen staff were pulled onto another client incident in September.~lnk=SOW-4 milestone 3
S3|-|Relevance tuning||||Marco Ellis
T4|p1_27|Index performance harness|10|p1_26|100|Elise Park||Elise Park:40,Test Agent:80
T4|p1_28|Relevance tuning pass 1|10|p1_27|100|Marco Ellis||Marco Ellis:30,Chief Editor:20
T4|p1_46|Query log analysis|5|p1_28|100|Knowledge Curator||Knowledge Curator:80
T4|p1_47|Editor relevance panel review|4|p1_46|100|Chief Editor||Chief Editor:40
T4|p1_29|Relevance tuning pass 2|12|p1_28|85|Marco Ellis||Marco Ellis:30
M3|p1_30|Indexer accepted by Meridian|0|p1_3,p1_29|0|Priya Shah||Priya Shah:2|dv=Signed indexer acceptance certificate~acc=Precision at 10 of 0.82 or better on the held-out query set
S2|-|Content migration||||Sam Patel
T3|p1_31|Migration mapping and cleanup rules|8|p1_20|100|Knowledge Curator||Knowledge Curator:80,Chief Editor:20
T3|p1_7|Content migration|30|p1_2,p1_31|0|Priya Shah|Platform team:4,Editors:1|Sam Patel:60,Knowledge Curator:100|dv=Migrated standards corpus, 18,400 documents~acc=99.5 percent of documents reconciled by count and checksum~note=Starts as the platform build closes. The Platform team has not yet released the people.
T3|p1_32|Migration dry run and reconciliation (wave 1)|5|p1_7:SS+20|0|Knowledge Curator||Knowledge Curator:80,Test Agent:60
S1|-|Integration, test and beta||||Priya Shah|||d=Prove the whole platform works together and release the beta to editors.
S2|-|Test preparation and inputs||||Elise Park
M3|p1_37|Taxonomy schema v1 received from Taxonomy Data Hub|0|p2_18|100|Dev Rao||Dev Rao:2|dv=Taxonomy schema v1 (from PR2)
T3|p1_33|Test plan and automation scripts|10|p1_24|100|Elise Park||Elise Park:100,Test Agent:80|dv=Master test plan and regression suite
T2|p1_4|Integration and test|15|p1_2,p1_3,p1_25,p1_33,p1_37|0|Priya Shah|Platform team:7,Editors:1|Sam Patel:100,Elise Park:100,Test Agent:100|dv=Integration test report~acc=Pass rate 98 percent or better, no open severity 1 or 2 defects
S2|-|Quality gates||||Elise Park
T3|p1_34|Security penetration test|8|p1_30|0|Rina Okafor||Rina Okafor:60,Northwind Managed Services:40
T3|p1_35|Accessibility audit (WCAG 2.1 AA)|6|p1_30|0|Elise Park||Elise Park:60,Test Agent:50
T3|p1_36|Portal failover verification (with Portal team)|2|p1_30,p3_20|0|Sam Patel||Sam Patel:60,Ravi Menon:60|note=Waits for the Portal failover rehearsal in PR3 (Portal Resilience).
M2|p1_5|Beta release|0|p1_4,p1_34,p1_35,p1_36|0|Priya Shah||Priya Shah:5|dv=Beta build released to 40 editors~acc=Integration test exit criteria met~note=Beta is 7 work days late because the indexer is.
S1|-|Acceptance and transition||||Chief Editor|||d=Editors accept the platform and the organization is ready to run it.
T2|p1_6|Editor acceptance testing|12|p1_5|0|Chief Editor|Editors:4|Chief Editor:60,Nia Brooks:20|dv=Signed acceptance certificate~acc=All priority 1 editorial journeys pass
M2|p1_42|UAT sign-off by the Chief Editor|0|p1_6|0|Chief Editor||Chief Editor:2
S2|-|Readiness and training||||Nia Brooks
T3|p1_38|Training materials and editor guides|6|p1_5|0|Nia Brooks||Nia Brooks:50,Knowledge Curator:60
T3|p1_39|Editor training sessions|5|p1_38|0|Nia Brooks||Nia Brooks:60,Chief Editor:30
T3|p1_40|Communications and change plan|6|p1_5|0|Nia Brooks||Nia Brooks:30
T3|p1_41|Support readiness: service desk handover|8|p1_5|0|Knowledge Curator||Knowledge Curator:60,Northwind Managed Services:30|dv=Knowledge articles and routing rules for the service desk
S1|-|Cutover and go live||||Priya Shah|||d=Rehearse, approve and cut over to the new platform.
T2|p1_43|Cutover runbook|5|p1_5|0|Sam Patel||Sam Patel:50,Ravi Menon:30
T2|p1_44|Change approval for the cutover window|2|p1_43|0|Nia Brooks||Nia Brooks:60,Change Risk Agent:80|dv=Approved change record
T2|p1_8|Cutover rehearsal|8|p1_6,p1_7,p1_32,p1_39,p1_44|0|Priya Shah|Platform team:4,Ops team:2|Sam Patel:100,Ravi Menon:100,Nia Brooks:30|dv=Rehearsal report with timings~acc=Cutover completes inside the 6 hour window
M2|p1_45|Go or no-go decision by the steering committee|0|p1_8,p1_41|0|Omar Hamid||Omar Hamid:5
M2|p1_9|Go live|0|p1_8,p1_45|0|Priya Shah||Priya Shah:5|dv=Production release of Codification Platform~acc=Rehearsal passed, rollback tested, steering committee approval
`,
PR2:`
S1|-|Initiation and governance||||Dev Rao|||d=Fund the work and sign the vendor statement of work.
T2|p2_11|Business case and funding approval|5||100|Dev Rao||Dev Rao:60,Avery Chen:20|snet=2026-07-27
M2|p2_10|Project kickoff|0|p2_11|100|Dev Rao||Dev Rao:10|snet=2026-08-03
T2|p2_12|Data governance council charter|5|p2_10|100|Dev Rao||Dev Rao:30,Maya Ortiz:20|dv=Council charter and decision rights
T2|p2_13|Lumen SOW-4 contracting and security review|10|p2_11|100|Maya Ortiz||Contract Analyst Agent:70,Maya Ortiz:30,Rina Okafor:20|ven=V1~dv=Signed SOW-4
M2|p2_14|Funding and SOW-4 signed|0|p2_12,p2_13|100|Omar Hamid||Omar Hamid:5
S1|-|Design and data modeling||||Dev Rao|||d=Design the canonical taxonomy model that every system will share.
T2|p2_1|Data model design|25|p2_10|100|Dev Rao|Architecture:1,Data team:2|Dev Rao:50,Jordan Lee:50,Hana Koval:40|snet=2026-08-03~dv=Canonical taxonomy data model~acc=Approved by the data governance council
S2|-|Canonical model workstreams||||Dev Rao
T3|p2_15|Entity inventory and source mapping|10|p2_10|100|Dev Rao||Dev Rao:30,Knowledge Curator:60
T3|p2_16|Reference data and code lists|8|p2_15|100|Jordan Lee||Jordan Lee:40
T3|p2_17|Lineage and stewardship model|6|p2_16|100|Dev Rao||Dev Rao:40
M2|p2_18|Taxonomy schema v1 published|0|p2_1,p2_17|100|Dev Rao||Dev Rao:5|dv=Schema v1 published to the catalog~acc=Feeds Codification integration test (PR1) and Taxonomy engineering
T2|p2_19|Data privacy impact assessment|5|p2_18|100|Rina Okafor||Rina Okafor:50
S1|-|Pipeline and platform build||||Dev Rao|||d=Land source data, clean it and run it through the pipeline.
S2|-|Landing zone and tooling||||Sam Patel
T3|p2_20|Azure Data Factory environment and landing zone|8|p2_18|100|Sam Patel||Sam Patel:40,Contoso Cloud Operations:50
T3|p2_21|Access, secrets and network controls|5|p2_20,p2_19|100|Rina Okafor||Rina Okafor:50
T3|p2_35|Metadata catalog in Microsoft Purview|10|p2_20|100|Hana Koval||Hana Koval:50,Knowledge Curator:40
S2|-|Source connectors||||Dev Rao
T3|p2_22|Codification Platform connector|10|p2_20|100|Dev Rao||Dev Rao:40,Hana Koval:50
T3|p2_23|Contract Repository connector|10|p2_20|100|Dev Rao||Dev Rao:40,Test Agent:50
T3|p2_36|Source system access requests|3|p2_20|100|Rina Okafor||Rina Okafor:40
T3|p2_24|Lease subledger extract (ERP)|8|p2_21|40|Hana Koval||Hana Koval:60|note=Waiting on a read-only ERP account from Finance.
S2|-|Pipeline||||Dev Rao
T3|p2_3|Pipeline build|45|p2_1|48|Dev Rao|Data team:4|Dev Rao:70,Hana Koval:50,Sam Patel:30|dv=Production data pipeline~acc=Pipeline processes the full corpus nightly inside 4 hours
S3|-|Data quality||||Test Agent
T4|p2_25|Data quality rules and profiling|12|p2_20|100|Test Agent||Test Agent:100,Dev Rao:20
T4|p2_34|Quality scorecard in Power BI|6|p2_25|15|Dev Rao||Dev Rao:30,Knowledge Curator:40
T4|p2_26|Entity resolution and matching (AI assisted)|13|p2_25|10|Knowledge Curator||Knowledge Curator:100,Hana Koval:40|dv=Entity matching model with measured precision
S1|-|Taxonomy engineering (Lumen SOW-4)||||Dev Rao|||d=Lumen builds the taxonomy once its engineers finish the Codification search indexer.
M2|p2_27|Lumen team released from the search indexer|0|p1_3|0|Marco Ellis||Marco Ellis:2|dv=Lumen staffing confirmation~note=Feeds from the Codification indexer. This is the link that carries the delay between projects.
T2|p2_2|Taxonomy engineering (Lumen SOW-4)|20|p2_1,p1_3,p2_27|0|Lumen|Lumen (vendor):4|Hana Koval:100,Lumen Search Services:50|ven=V1~dv=Taxonomy v1 with 6,200 controlled terms~acc=SOW-4 milestone 4: curated terms pass editor review~note=Starts when the same Lumen staff finish the search indexer.~lnk=SOW-4 milestone 4
T2|p2_28|Synonym and ontology curation (Editors)|10|p2_27|0|Chief Editor||Chief Editor:30,Knowledge Curator:60
T2|p2_29|Taxonomy review with the Chief Editor|5|p2_28|0|Chief Editor||Chief Editor:40
T2|p2_37|Taxonomy change control board setup|4|p2_27|0|Dev Rao||Dev Rao:40,Maya Ortiz:20|dv=Change control procedure and board roster
S1|-|Test, readiness and pilot||||Dev Rao|||d=Prove the hub with a small group of real users before wider release.
T2|p2_30|Test data and scripts|8|p2_22,p2_23|35|Test Agent||Test Agent:100,Dev Rao:20
T2|p2_31|Performance and volume test|6|p2_26,p2_30|0|Sam Patel||Sam Patel:50,Test Agent:80
T2|p2_32|Pilot user training and runbook|6|p2_31|0|Knowledge Curator||Knowledge Curator:60,Nia Brooks:30
T2|p2_4|Pilot readiness test|6|p2_2,p2_3,p2_29,p2_32|0|Dev Rao|Data team:3,Platform team:1|Dev Rao:60,Test Agent:100,Hana Koval:50|dv=Pilot readiness report~acc=Exit criteria met for data quality and performance
M2|p2_33|Pilot go or no-go|0|p2_4|0|Omar Hamid||Omar Hamid:3
M2|p2_5|Pilot|0|p2_4,p2_33|0|Dev Rao||Dev Rao:5|snet=2026-12-02~dv=Pilot start with 15 editors~note=Committed date. The pilot cannot start before Dec 2.
`,
PR3:`
S1|-|Containment and analysis||||Tom Becker|||d=Stabilize the Portal after the Sev 2 outage and find the root cause.
M2|p3_10|Sev 2 incident declared|0||100|Tom Becker||Tom Becker:10|snet=2026-09-08~dv=Incident record INC1
S2|-|Immediate response||||Sam Patel
T3|p3_11|Manual failover workaround in place|3|p3_10|100|Sam Patel||Sam Patel:70,Ravi Menon:60|dv=Interim failover procedure
T3|p3_12|Incident timeline and evidence collection|3|p3_10|100|Triage Agent||Triage Agent:80,Tom Becker:30|dv=Evidence pack and timeline
T3|p3_42|Customer notice and status page updates|2|p3_10|100|Tom Becker||Tom Becker:30,Northwind Managed Services:40
T3|p3_43|Azure support case and vendor findings|5|p3_10|100|Ravi Menon||Ravi Menon:40,Contoso Cloud Operations:40|dv=Vendor findings letter
S2|-|Analysis||||Tom Becker
T3|p3_13|Problem record opened with known error|1|p3_11,p3_12|100|Tom Becker||Tom Becker:60|dv=Problem record and known error
T3|p3_44|Portal dependency map check against the CMDB|3|p3_13|100|Triage Agent||Triage Agent:70,Jordan Lee:20
T3|p3_45|Blameless review workshop|2|p3_13|100|Tom Becker||Tom Becker:50,Nia Brooks:30
T3|p3_1|Root cause review|10|p3_13|100|Tom Becker|Ops team:2|Tom Becker:60,Sam Patel:40,Ravi Menon:40|snet=2026-09-14~dv=Root cause report~acc=Blameless review held, causes agreed by the service owner
S1|-|Failover redesign and remediation||||Tom Becker|||d=Design, approve and prove a tested failover for the Portal.
S2|-|Redesign||||Tom Becker
T3|p3_2|Failover redesign|20|p3_1|30|Tom Becker|Ops team:2,Architecture:1|Tom Becker:50,Jordan Lee:30,Ravi Menon:60|dv=Approved failover design~acc=Design review board approval
S3|-|Traffic routing||||Jordan Lee
T4|p3_14|Traffic routing options analysis|5|p3_1|100|Jordan Lee||Jordan Lee:60
T4|p3_36|Proof of concept in the staging region|6|p3_14|15|Ravi Menon||Ravi Menon:80,Contoso Cloud Operations:40
T4|p3_37|Load test of the standby region|4|p3_36|0|Test Agent||Test Agent:100,Ravi Menon:30
T4|p3_46|Dry run in staging|2|p3_37|0|Sam Patel||Sam Patel:50
S3|-|Standby capacity and cost||||Avery Chen
T4|p3_15|Warm standby capacity and cost model|4|p3_14|25|Sam Patel||Sam Patel:50,Avery Chen:20
T4|p3_38|Cost approval from Finance|2|p3_15|0|Avery Chen||Avery Chen:30
S3|-|Data replication||||Jordan Lee
T4|p3_47|Replication design for content and search index|5|p3_14|0|Jordan Lee||Jordan Lee:50,Marco Ellis:20
T4|p3_48|Replication lag monitoring|3|p3_47|0|Contoso Cloud Operations||Contoso Cloud Operations:50
T3|p3_16|Change request and CAB pre-approval|3|p3_14|20|Nia Brooks||Nia Brooks:50,Change Risk Agent:80|dv=CAB-approved change record
T3|p3_39|Security review of the failover path|3|p3_14|0|Rina Okafor||Rina Okafor:50
S2|-|Runbook and monitoring||||Sam Patel
T3|p3_3|Runbook RB-031 refresh|10|p3_1|30|Ops Agent|Ops team:1|Triage Agent:50,Sam Patel:20|dv=Runbook RB-031 v3~acc=Walked through by on-call engineers
T3|p3_17|Synthetic monitoring for failover health|8|p3_1|50|Sam Patel||Sam Patel:50,Contoso Cloud Operations:40
T3|p3_40|Alert tuning and dashboards|5|p3_17|0|Contoso Cloud Operations||Contoso Cloud Operations:60
T3|p3_18|On-call escalation and paging update|3|p3_3:SS+7|0|Tom Becker||Tom Becker:40
T3|p3_49|Service desk script for Portal outages|3|p3_3|0|Knowledge Curator||Knowledge Curator:60,Northwind Managed Services:30
S1|-|Verification and closure||||Tom Becker|||d=Prove the failover works and close the problem record.
T2|p3_41|Rehearsal plan and communications|3|p3_16|0|Tom Becker||Tom Becker:40,Nia Brooks:30
T2|p3_4|Failover rehearsal|5|p3_2,p3_3,p3_16,p3_17,p3_18,p3_41,p3_39,p3_37,p3_40,p3_46,p3_48|0|Tom Becker|Ops team:3|Tom Becker:60,Sam Patel:100,Ravi Menon:100|dv=Rehearsal results~acc=Failover completes inside 15 minutes with no data loss
M2|p3_20|Failover rehearsal passed|0|p3_4|0|Tom Becker||Tom Becker:2|dv=Rehearsal pass record~note=Feeds the Codification beta failover verification (PR1).
M2|p3_21|Problem review board sign-off|0|p3_20|0|Tom Becker||Tom Becker:2
M2|p3_5|Sev 2 problem closed|0|p3_4,p3_20,p3_21|0|Tom Becker||Tom Becker:5|dv=Closed problem record and updated known error database
`,
PR4:`
S1|-|Initiation and governance||||Maya Ortiz|||d=Make the case, fund the first phase and set up governance.
T2|p4_10|Business case and legal requirements|5||100|Maya Ortiz||Maya Ortiz:50,Avery Chen:20|snet=2026-09-21
M2|p4_11|Project kickoff|0|p4_10|100|Maya Ortiz||Maya Ortiz:10
T2|p4_12|Charter, RACI and steering cadence|3|p4_11|100|Maya Ortiz||Maya Ortiz:50,PMO Agent:40
T2|p4_13|Stakeholder interviews: Legal, Procurement, Finance|5|p4_11|100|Maya Ortiz||Maya Ortiz:50,First Officer:40
T2|p4_14|Contract inventory and data quality scan|8|p4_11|75|Contract Analyst Agent||Contract Analyst Agent:100,Knowledge Curator:30|dv=Inventory of 6,900 contracts with data quality score
M2|p4_15|Funding released for phase 1|0|p4_12|100|Omar Hamid||Omar Hamid:3
S1|-|Vendor selection||||Maya Ortiz|||d=Choose the replacement repository product and sign the contract.
T2|p4_1|Vendor selection|20|p4_12,p4_13,p4_15|35|Maya Ortiz|Architecture:1|Maya Ortiz:50,Contract Analyst Agent:40|snet=2026-10-05~dv=Selection recommendation and scoring~acc=Steering committee approval~fx=18
S2|-|Evaluation||||Maya Ortiz
T3|p4_16|Evaluation criteria and scoring model|5|p4_13|20|Maya Ortiz||Maya Ortiz:30,Jordan Lee:20
T3|p4_17|Vendor demonstrations and reference checks|8|p4_16|0|Jordan Lee||Jordan Lee:40,Maya Ortiz:30
T3|p4_18|Security and privacy review of finalists|6|p4_16|0|Rina Okafor||Rina Okafor:50
T3|p4_19|Commercial negotiation and contract terms|5|p4_17,p4_18|0|Maya Ortiz||Maya Ortiz:40,Contract Analyst Agent:60
M2|p4_20|Vendor selected and contract signed|0|p4_1,p4_19|0|Omar Hamid||Omar Hamid:3|dv=Executed contract and order form
S1|-|Migration design||||Maya Ortiz|||d=Design the target repository, the migration waves and the integrations.
T2|p4_2|Migration design|25|p4_1,p4_20|0|Maya Ortiz|Architecture:1,Platform team:1|Maya Ortiz:30,Jordan Lee:50|dv=Migration design document~acc=Design authority approval
S2|-|Design components||||Jordan Lee
T3|p4_21|Target metadata and retention model|10|p4_20,p4_14|0|Jordan Lee||Jordan Lee:50,Knowledge Curator:40
T3|p4_22|Integration design: Codification, M365, Entra ID|8|p4_20|0|Jordan Lee||Jordan Lee:50,Sam Patel:30
T3|p4_23|Migration approach and wave plan|8|p4_21|0|Maya Ortiz||Maya Ortiz:30,Contract Analyst Agent:50
T3|p4_24|Records retention and legal hold design|6|p4_21|0|Avery Chen||Avery Chen:30,Contract Analyst Agent:40
T3|p4_37|Obligation and renewal alert model|5|p4_21|0|Contract Analyst Agent||Contract Analyst Agent:80,Maya Ortiz:20|dv=Alert rules for renewals and notice periods
T3|p4_25|Design authority review|3|p4_22,p4_23,p4_24|0|Omar Hamid||Omar Hamid:20,Jordan Lee:30
M2|p4_26|Design approved|0|p4_2,p4_25|0|Omar Hamid||Omar Hamid:3
S1|-|Build and migrate||||Maya Ortiz|||d=Stand up the new repository and move the contracts in waves.
T2|p4_3|Build and migrate|40|p4_2,p4_26|0|Maya Ortiz|Platform team:3|Sam Patel:100,Maya Ortiz:20|dv=New repository populated and validated~acc=Reconciliation shows 100 percent of active contracts migrated
S2|-|Environment||||Sam Patel
T3|p4_27|Azure environment build|10|p4_26|0|Contoso Cloud Operations||Contoso Cloud Operations:80,Sam Patel:30
T3|p4_28|Integrations and single sign-on|8|p4_27|0|Sam Patel||Sam Patel:50,Rina Okafor:30
S2|-|Migration waves||||Maya Ortiz
T3|p4_38|Metadata extraction model tuning|6|p4_26|0|Contract Analyst Agent||Contract Analyst Agent:100,Test Agent:40
T3|p4_29|Wave 1: active contracts|12|p4_27,p4_38|0|Contract Analyst Agent||Contract Analyst Agent:100,Knowledge Curator:40
T3|p4_30|Wave 2: archive and amendments|12|p4_29|0|Contract Analyst Agent||Contract Analyst Agent:100
T3|p4_31|Reconciliation and validation|5|p4_30|0|Test Agent||Test Agent:100,Avery Chen:30
S2|-|Acceptance and readiness||||Maya Ortiz
T3|p4_32|User acceptance testing (Legal and Procurement)|6|p4_29|0|Maya Ortiz||Maya Ortiz:40,Avery Chen:30
T3|p4_33|Training for Legal and Procurement|5|p4_32|0|Nia Brooks||Nia Brooks:50
T3|p4_35|Communications to contract owners|3|p4_32|0|Nia Brooks||Nia Brooks:30,First Officer:40
T3|p4_36|Service desk handover and knowledge articles|4|p4_32|0|Knowledge Curator||Knowledge Curator:70,Northwind Managed Services:30
M3|p4_34|Cutover readiness review passed|0|p4_31,p4_33,p4_28|0|Omar Hamid||Omar Hamid:3
S1|-|Cutover and decommission||||Maya Ortiz|||d=Switch over in a maintenance window and retire the old system.
T2|p4_4|Maintenance window cutover|3|p4_3,p4_34|0|Maya Ortiz|Platform team:4,Ops team:2|Sam Patel:100,Ravi Menon:100,Contoso Cloud Operations:50|snet=2027-01-11~dv=Cutover record~acc=Cutover inside the approved window, rollback not needed
S2|-|Decommission||||Maya Ortiz
T3|p4_5|Decommission legacy|15|p4_4|0|Maya Ortiz|Platform team:1|Sam Patel:40,Contoso Cloud Operations:30|dv=Decommission certificate and archived data export
`};

/* ---- Build TASKS, SUMS and OUTL from the seed text ---- */
const ANCHOR={PR1:"p1_9",PR2:"p2_5",PR3:"p3_5",PR4:"p4_5"};
(function(){
 const parsePred=s=>(s||"").split(",").map(x=>x.trim()).filter(Boolean).map(x=>{const m=/^([\w]+)(?::(FS|SS|FF|SF))?(?:([+-]\d+))?$/.exec(x);if(!m)return x;return mkPred(m[1],m[2],m[3]?+m[3]:0)});
 const parseKV=s=>{const o={};(s||"").split("~").forEach(x=>{const i=x.indexOf("=");if(i>0)o[x.slice(0,i).trim()]=x.slice(i+1).trim()});return o};
 const parsePairs=(s,f)=>(s||"").split(",").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.lastIndexOf(":");return [x.slice(0,i),f(x.slice(i+1))]});
 PROJ.forEach(pj=>{const txt=WBS_SEED[pj.id];if(!txt)return;const out=[],pn=pj.id.replace("PR","");let sn=0;
  txt.trim().split("\n").forEach(L=>{L=L.trim();if(!L)return;const c=L.split("|"),tag=c[0],kind=tag[0],lv=+tag.slice(1),o=parseKV(c[9]);
   if(kind==="S"){const id=`p${pn}_s${++sn}`;const s={id,p:pj.id,n:c[2],lv,sum:1,own:c[6]||pj.owner};if(o.d)s.d=o.d;if(o.note)s.note=o.note;SUMS.push(s);out.push(s);return}
   const t={id:c[1],p:pj.id,n:c[2],dur:kind==="M"?0:+c[3],pred:parsePred(c[4]),pct:+c[5]||0,own:c[6]||pj.owner,res:parsePairs(c[7],Number),asg:parsePairs(c[8],Number),lv};
   if(kind==="M")t.ms=1;
   if(o.snet)t.snet=o.snet;if(o.ct){const [a,b]=o.ct.split(":");t.ct=a;t.cd=b}if(o.dl)t.dl=o.dl;if(o.bdur)t.bdur=+o.bdur;if(o.ven)t.ven=o.ven;
   ["note","dv","acc","d","lnk","st"].forEach(k=>{if(o[k])t[k]=o[k]});if(o.fx)t.fx=+o.fx;if(o.dev==="0")t.nodev=1;
   TASKS.push(t);out.push(t)});
  OUTL[pj.id]=out});
 /* keep the final line of each project last in TASKS, as older modules assume */
 Object.keys(ANCHOR).forEach(p=>{const i=TASKS.findIndex(t=>t.id===ANCHOR[p]);if(i<0)return;const a=TASKS.splice(i,1)[0];let last=-1;TASKS.forEach((t,j)=>{if(t.p===p)last=j});TASKS.splice(last+1,0,a)});
 /* group TASKS by project, in project order, so TASKS reads like the older flat list */
 const order=PROJ.map(p=>p.id);TASKS.sort((a,b)=>order.indexOf(a.p)-order.indexOf(b.p));
 /* actual dates from the plan: finished and started work starts on its planned day, with small believable differences where nothing depends on them */
 const P0=cpm(t=>t.ms?0:Math.max(1,t.dur),TASKS,{noAct:true});const drives=new Set();Object.values(P0.R).forEach(r=>{if(r.drv)drives.add(r.drv)});
 const rnd=RNG0("actuals");
 TASKS.forEach(t=>{const r=P0.R[t.id];if(t.ms){if(t.pct===100){t.as=t.af=r.es}return}
  if(t.pct>0){t.as=r.es;if(t.pct===100){t.af=r.ef-1;const safe=!drives.has(t.id)&&r.ffl>=3&&!t.nodev&&!/^p[1-4]_([1-9])$/.test(t.id);
   if(safe&&t.dur>=4){const x=rnd();if(x<.25){t.af=r.ef-2}else if(x<.4){t.af=r.ef}else if(x<.55&&r.ffl>=4){t.as=r.es+1}else if(x<.65&&r.ffl>=5){t.af=r.ef+1}}}}});
 /* budget and actual cost in $K, from effort, scaled to each project's approved budget and paid to date */
 PROJ.forEach(p=>{const ts=TASKS.filter(t=>t.p===p.id&&!t.ms);if(!ts.length)return;const w=ts.map(t=>Math.max(6,workOf(t))*(t.ven?1.6:1)),tot=w.reduce((a,b)=>a+b,0),fxT=ts.reduce((a,t)=>a+(t.fx||0),0),r=RNG0("cost"+p.id);let acc=0;
  ts.forEach((t,i)=>{t.cost=Math.round(((p.bac-fxT)*w[i]/tot+(t.fx||0))*10)/10;acc+=t.cost});const big=ts.reduce((a,t)=>t.cost>a.cost?t:a,ts[0]);big.cost=Math.round((big.cost+p.bac-acc)*10)/10;
  const raw=ts.map(t=>t.cost*(t.pct/100)*(.75+r()*.6));const rs=raw.reduce((a,b)=>a+b,0)||1,k=p.paid/rs;let ac=0;ts.forEach((t,i)=>{t.ac=Math.round(raw[i]*k*10)/10;ac+=t.ac});
  const bg=ts.reduce((a,t)=>(t.ac>a.ac?t:a),ts[0]);if(bg.ac>0)bg.ac=Math.round((bg.ac+p.paid-ac)*10)/10;p._cost=1});
 TASKS.forEach(t=>{if(t.cost==null)t.cost=0;if(t.ac==null)t.ac=0;t.bcost=t.cost});
})();
function RNG0(seed){let s=0;for(const c of String(seed))s=(s*31+c.charCodeAt(0))>>>0;if(!s)s=1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}

/* ---- Outline index: WBS codes, parents, children ---- */
function indexOutline(arr){const stack=[],cnt=[];arr.forEach(it=>{if(it.sum)it.kids=[]});
 arr.forEach((it,i)=>{let lv=Math.max(1,Math.min(it.lv||1,stack.length+1));while(lv>1&&!stack[lv-2].sum)lv--;it.lv=lv;stack.length=lv;cnt.length=lv;cnt[lv-1]=(cnt[lv-1]||0)+1;
  const par=lv>1?stack[lv-2]:null;it.parent=par?par.id:null;it.wbs=cnt.join(".");if(par)par.kids.push(it.id);stack[lv-1]=it;it.oi=i})}
function wbsIdx(){const n=TASKS.length+SUMS.length;if(IDX.v===TVER&&IDX.n===n&&IDX.x===XT.on)return IDX;
 const ts=new Set(TASKS),ss=new Set(SUMS),inO=new Set();
 Object.keys(OUTL).forEach(p=>{OUTL[p]=OUTL[p].filter(x=>x.sum?ss.has(x):ts.has(x));OUTL[p].forEach(x=>inO.add(x))});
 TASKS.forEach(t=>{if(!inO.has(t)){(OUTL[t.p]||(OUTL[t.p]=[])).push(t);t.lv=t.lv||1}});
 SUMS.forEach(s=>{if(!inO.has(s)){(OUTL[s.p]||(OUTL[s.p]=[])).push(s)}});
 Object.keys(OUTL).forEach(p=>{if(!PROJ.some(x=>x.id===p)&&!OUTL[p].length)delete OUTL[p];else indexOutline(OUTL[p])});
 const map=new Map();Object.values(OUTL).forEach(a=>a.forEach(x=>map.set(x.id,x)));
 if(XT.on)Object.values(XT.outl).forEach(a=>a.forEach(x=>map.set(x.id,x)));
 PROJ.forEach(p=>{if(!p._cost)costInit(p)});
 IDX.v=TVER;IDX.n=n;IDX.x=XT.on;IDX.map=map;return IDX}
function costInit(p){p._cost=1;const ts=TASKS.filter(t=>t.p===p.id&&!t.ms);if(!ts.length||ts.some(t=>t.cost))return;const w=ts.map(t=>Math.max(6,workOf(t))),tot=w.reduce((a,b)=>a+b,0);ts.forEach((t,i)=>{t.cost=Math.round(p.bac*w[i]/tot*10)/10;t.bcost=t.cost;t.ac=Math.round(t.cost*(t.pct/100)*10)/10})}
const wbsOutline=pid=>{wbsIdx();return OUTL[pid]||(XT.on?XT.outl[pid]:null)||[]};
const wbsLn=id=>{wbsIdx();return IDX.map.get(id)||LINE(id)};
const wbsKids=id=>{const s=wbsLn(id);return s&&s.kids?s.kids.map(wbsLn).filter(Boolean):[]};
const descOf=id=>{const s=wbsLn(id);if(!s)return[];const arr=wbsOutline(s.p),out=[];for(let i=s.oi+1;i<arr.length&&arr[i].lv>s.lv;i++)out.push(arr[i]);return out};
const ancOf=id=>{const out=[];let s=wbsLn(id);while(s&&s.parent){s=wbsLn(s.parent);if(s)out.push(s)}return out};
const projOf=id=>PROJ.find(p=>p.id===id)||XT.proj.find(p=>p.id===id);
/* ---- Roll-up: every summary line takes its dates, percent complete, cost and work from its children ---- */
function rollup(P){if(P._rs&&P._rs.v===TVER)return P._rs;wbsIdx();const B=baseCalc(P.list||TASKS),R=P.R,S={},PJ={};
 const mk=()=>({es:Infinity,ef:-Infinity,bes:Infinity,bef:-Infinity,cost:0,ac:0,work:0,w:0,pw:0,fl:Infinity,crit:false,n:0,nd:0,as:Infinity,af:-Infinity,pv:0,ev:0,ms:0,msd:0,msl:0,late:0});
 const add=(a,b)=>{a.es=Math.min(a.es,b.es);a.ef=Math.max(a.ef,b.ef);a.bes=Math.min(a.bes,b.bes);a.bef=Math.max(a.bef,b.bef);a.cost+=b.cost;a.ac+=b.ac;a.work+=b.work;a.w+=b.w;a.pw+=b.pw;a.fl=Math.min(a.fl,b.fl);a.crit=a.crit||b.crit;a.n+=b.n;a.nd+=b.nd;a.as=Math.min(a.as,b.as);a.af=Math.max(a.af,b.af);a.pv+=b.pv;a.ev+=b.ev;a.ms+=b.ms;a.msd+=b.msd;a.msl+=b.msl;a.late+=b.late};
 const fin=a=>{a.pct=a.w?Math.round(a.pw/a.w):0;a.d=a.ef-a.es;a.done=a.n>0&&a.nd===a.n;return a};
 const projs=new Set();Object.keys(OUTL).forEach(p=>projs.add(p));if(XT.on)Object.keys(XT.outl).forEach(p=>projs.add(p));
 projs.forEach(pid=>{const arr=wbsOutline(pid),acc={},top=mk();
  for(let i=arr.length-1;i>=0;i--){const it=arr[i];let a;
   if(it.sum){a=acc[it.id]||mk();fin(a);S[it.id]=a}
   else{const r=R[it.id],b=B.R[it.id];if(!r||!b)continue;a=mk();const wk=workOf(it),w=wk>0?wk:Math.max(1,it.dur||1);const pp=it.ms?(b.es<=TODAY?1:0):Math.max(0,Math.min(1,(TODAY-b.es)/Math.max(1,b.ef-b.es)));
    a.es=r.es;a.ef=r.ef;a.bes=b.es;a.bef=b.ef;a.cost=it.cost||0;a.ac=it.ac||0;a.work=wk;a.w=w;a.pw=(it.pct||0)*w;a.fl=it.pct<100?r.fl:Infinity;a.crit=r.fl<=0&&it.pct<100;a.n=1;a.nd=it.pct>=100?1:0;
    a.as=it.as!=null?it.as:Infinity;a.af=it.af!=null?it.af:-Infinity;a.pv=(it.cost||0)*pp;a.ev=(it.cost||0)*(it.pct||0)/100;
    if(it.ms){a.ms=1;a.msd=b.es<=TODAY?1:0;a.msl=r.es>b.es?1:0}a.late=(r.ef>b.ef&&!it.ms)||(it.ms&&r.es>b.es)?1:0;fin(a);S[it.id]=a}
   if(it.parent){const pa=acc[it.parent]||(acc[it.parent]=mk());add(pa,a)}else add(top,a)}
  PJ[pid]=fin(top)});
 P._rs={v:TVER,S,PJ};return P._rs}
/* ---- Status and small derived values ---- */
function lineStat(t,P){const r=P.R[t.id],b=baseCalc(P.list||TASKS).R[t.id];if(!r||!b)return {k:"mute",t:"Not scheduled"};if(t.st)return {k:t.st==="Complete"?"good":t.st==="Late"?"bad":"info",t:t.st};
 if(t.pct>=100)return {k:"good",t:"Complete"};const slip=t.ms?r.es-b.es:r.ef-b.ef;const pl=t.ms?(b.es<=TODAY?100:0):Math.max(0,Math.min(100,(TODAY-b.es)/Math.max(1,b.ef-b.es)*100));
 if(slip>0&&r.fl<=0)return {k:"bad",t:"Late"};if(slip>0||pl-(t.pct||0)>25)return {k:"warn",t:"At risk"};if(!t.ms&&t.pct===0&&r.es<TODAY)return {k:"warn",t:"Should have started"};if(!t.pct&&r.es>=TODAY)return {k:"mute",t:"Not started"};return {k:"good",t:"On track"}}
function sumStat(a){if(!a||!a.n)return {k:"mute",t:"Empty"};if(a.done)return {k:"good",t:"Complete"};const slip=a.ef-a.bef;if(slip>5)return {k:"bad",t:"Late"};if(slip>0)return {k:"warn",t:"At risk"};return {k:"good",t:"On track"}}
const resKind=n=>{const r=window.who&&who(n);return r?r.kind:"human"};
const asgOf=t=>{const o=[];(t.asg||[]).forEach(a=>o.push({n:a[0],u:a[1],pool:false}));(t.res||[]).forEach(r=>o.push({n:r[0],u:Math.round(r[1]*100),pool:true}));return o};
const taskKinds=t=>{const k=new Set();asgOf(t).forEach(a=>k.add(resKind(a.n)));if(!k.size&&t.own&&!t.ms)k.add(resKind(t.own));return k};
const wkday=w=>dateOf(w).toLocaleDateString("en-US",{weekday:"short",timeZone:"UTC"});
const fullD=w=>dateOf(w).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
/* ---- Mutations: every one bumps the version so plan(), baseline and roll-ups refresh ---- */
const nextId=(p,sum)=>{const n=String(p).replace(/\D/g,"")||"9";let m=sum?0:99;const re=sum?new RegExp("^p"+n+"_s(\\d+)$"):new RegExp("^p"+n+"_(\\d+)$");TASKS.concat(SUMS,XT.tasks,XT.sums).forEach(x=>{const k=re.exec(x.id);if(k&&+k[1]>m)m=+k[1]});return sum?`p${n}_s${m+1}`:`p${n}_${m+1}`};
const blockOf=id=>{const it=wbsLn(id);if(!it)return[];return [it].concat(descOf(id))};
function arrOf(p){wbsIdx();return OUTL[p]||(XT.outl[p])}
const WBSOP={
 /* insert a task, milestone or summary after the given line (as a child when the line is a summary) */
 add(p,spec,afterId){wbsIdx();const arr=arrOf(p);if(!arr)return null;const after=afterId?wbsLn(afterId):null;let at=arr.length,lv=1;
  if(after&&after.p===p){const blk=blockOf(after.id);if(after.sum){at=arr.indexOf(blk[blk.length-1])+1;lv=after.lv+1}else{at=arr.indexOf(after)+1;lv=after.lv}}
  const sum=spec.kind==="sum",id=nextId(p,sum);let it;
  if(sum){it={id,p,n:spec.n||"New summary",lv,sum:1,own:spec.own||(projOf(p)||{}).owner};SUMS.push(it)}
  else{const ms=spec.kind==="ms";it={id,p,n:spec.n||(ms?"New milestone":"New task"),dur:ms?0:Math.max(1,+spec.dur||1),pred:spec.pred||[],pct:+spec.pct||0,own:spec.own||(projOf(p)||{}).owner,res:spec.res||[],asg:spec.asg||[],lv,cost:+spec.cost||0,bcost:+spec.cost||0,ac:0};if(ms)it.ms=1;["dv","acc","d","note","ven","snet","ct","cd","dl","st"].forEach(k=>{if(spec[k])it[k]=spec[k]});TASKS.push(it)}
  arr.splice(at,0,it);wbsTouch();wbsIdx();return it},
 del(id){const it=wbsLn(id);if(!it)return 0;const blk=blockOf(id),ids=new Set(blk.map(x=>x.id)),arr=arrOf(it.p);blk.forEach(x=>{if(x.sum){const i=SUMS.indexOf(x);if(i>=0)SUMS.splice(i,1)}else{const i=TASKS.indexOf(x);if(i>=0)TASKS.splice(i,1)}const j=arr.indexOf(x);if(j>=0)arr.splice(j,1)});
  TASKS.concat(XT.tasks).forEach(t=>{if(t.pred&&t.pred.some(q=>ids.has(predId(q))))t.pred=t.pred.filter(q=>!ids.has(predId(q)))});wbsTouch();return blk.length},
 indent(id){const it=wbsLn(id);if(!it)return {ok:0,why:"Line not found"};const arr=arrOf(it.p),i=arr.indexOf(it);if(i<1)return {ok:0,why:"The first line cannot be indented"};const prev=arr[i-1];if(it.lv>prev.lv)return {ok:0,why:"Already one level below the line above"};
  if(!prev.sum){if(prev.ms)return {ok:0,why:"A milestone cannot contain tasks"};const lk=TASKS.concat(XT.tasks).some(t=>(t.pred||[]).some(q=>predId(q)===prev.id))||(prev.pred||[]).length;if(lk||SEEDLOCK.has(prev.id))return {ok:0,why:prev.n+" has links, so it cannot become a summary. Remove its links or use Insert summary."};
   const k=TASKS.indexOf(prev);if(k>=0)TASKS.splice(k,1);const s={id:prev.id,p:prev.p,n:prev.n,lv:prev.lv,sum:1,own:prev.own,note:prev.note};SUMS.push(s);arr[i-1]=s}
  blockOf(id).forEach(x=>x.lv++);wbsTouch();return {ok:1}},
 outdent(id){const it=wbsLn(id);if(!it)return {ok:0,why:"Line not found"};if(it.lv<=1)return {ok:0,why:"Already at the top level"};const arr=arrOf(it.p),par=wbsLn(it.parent),blk=blockOf(id);
  const pb=blockOf(par.id),endIdx=arr.indexOf(pb[pb.length-1]),last=blk[blk.length-1];
  if(arr.indexOf(last)<endIdx){blk.forEach(x=>{const j=arr.indexOf(x);arr.splice(j,1)});const e2=arr.indexOf(pb.filter(x=>!blk.includes(x)).pop());arr.splice(e2+1,0,...blk)}
  blk.forEach(x=>x.lv--);wbsTouch();return {ok:1}},
 /* move a line (with its children) before another line of the same project; beforeId null = end */
 move(id,beforeId){const it=wbsLn(id);if(!it)return {ok:0,why:"Line not found"};const arr=arrOf(it.p),blk=blockOf(id);if(beforeId){const t=wbsLn(beforeId);if(!t||t.p!==it.p)return {ok:0,why:"Lines can only move inside their own project"};if(blk.includes(t))return {ok:0,why:"A line cannot move inside itself"}}
  const lvT=beforeId?wbsLn(beforeId).lv:1,shift=lvT-it.lv;blk.forEach(x=>{const j=arr.indexOf(x);arr.splice(j,1)});const at=beforeId?arr.indexOf(wbsLn(beforeId)):arr.length;arr.splice(at,0,...blk);blk.forEach(x=>x.lv=Math.max(1,x.lv+shift));wbsTouch();return {ok:1}},
 step(id,dir){const it=wbsLn(id);if(!it)return {ok:0};const arr=arrOf(it.p),blk=blockOf(id),i=arr.indexOf(it);if(dir<0){let j=i-1;while(j>=0&&arr[j].lv>it.lv)j--;if(j<0)return {ok:0,why:"Already first"};return WBSOP.move(id,arr[j].id)}
  const e=i+blk.length;if(e>=arr.length)return {ok:0,why:"Already last"};const nx=arr[e];const nb=blockOf(nx.id);const after=arr[e+nb.length];return WBSOP.move(id,after?after.id:null)},
 /* link: add a predecessor to b (the successor). Returns {ok,why}. */
 link(aId,bId,type,lag){if(aId===bId)return {ok:0,why:"A task cannot wait for itself"};const a=TASK(aId),b=TASK(bId);if(!a||!b)return {ok:0,why:"Links connect tasks and milestones, not summary lines"};
  if(dependsOn(aId,bId))return {ok:0,why:"That link would make a loop: "+a.n+" already waits for "+b.n};b.pred=(b.pred||[]).filter(q=>predId(q)!==aId);b.pred.push(mkPred(aId,type,lag));wbsTouch();return {ok:1}},
 unlink(aId,bId){const b=TASK(bId);if(!b)return;b.pred=(b.pred||[]).filter(q=>predId(q)!==aId);wbsTouch()},
 setPreds(id,list){const t=TASK(id);if(!t)return {ok:0};for(const q of list){if(dependsOn(predId(q),id))return {ok:0,why:"Loop through "+(TASK(predId(q))||{}).n}}t.pred=list;wbsTouch();return {ok:1}},
 baseline(scope){const P=plan("now");let n=0;const tl=scope?TASKS.concat(XT.tasks).filter(scope):TASKS;tl.forEach(t=>{const r=P.R[t.id];if(!r)return;t.bs=r.es;t.bf=r.ef;t.bdur=Math.max(t.ms?0:1,r.d);t.bcost=t.cost||0;n++});wbsTouch();return n},
 field(id,k,v){const t=TASK(id),s=t||SUMOF(id);if(!s)return {ok:0};
  if(k==="n"){s.n=String(v).trim()||s.n}
  else if(!t){if(k==="own")s.own=v}
  else if(k==="dur"){const d=Math.max(t.ms?0:1,Math.round(+v));if(isNaN(d))return {ok:0,why:"Duration must be a number of work days"};if(t.ms&&d>0){t.ms=0}t.dur=d;if(d===0){t.ms=1}}
  else if(k==="pct"){const p=Math.max(0,Math.min(100,Math.round(+v)));if(isNaN(p))return {ok:0,why:"Percent complete is a number from 0 to 100"};const r=plan("now").R[id];t.pct=p;if(p>0&&t.as==null&&r)t.as=Math.min(r.es,TODAY);if(p===100){if(t.af==null&&r)t.af=Math.max(t.as!=null?t.as:r.es,Math.min(r.ef-1,TODAY))}else{delete t.af;if(p===0)delete t.as}}
  else if(k==="start"||k==="finish"){const w=wdOf(v);t.ct=k==="start"?"SNET":"FNET";t.cd=isoOf(w);delete t.snet}
  else if(k==="as"){if(v)t.as=wdOf(v);else delete t.as;if(v&&!t.pct)t.pct=1}
  else if(k==="af"){if(v){t.af=wdOf(v);t.pct=100;if(t.as==null)t.as=t.af}else delete t.af}
  else if(k==="cost"){t.cost=Math.max(0,+v||0)}
  else if(k==="ac"){t.ac=Math.max(0,+v||0)}
  else t[k]=v;wbsTouch();return {ok:1}}
};
const SEEDLOCK=new Set(["p1_1","p1_2","p1_3","p1_4","p1_5","p1_6","p1_7","p1_8","p1_9","p2_1","p2_2","p2_3","p2_4","p2_5","p3_1","p3_2","p3_3","p3_4","p3_5","p4_1","p4_2","p4_3","p4_4","p4_5"]);
function dependsOn(aId,bId){/* does a (transitively) wait for b? */const seen=new Set(),st=[aId];while(st.length){const x=st.pop();if(x===bId)return true;if(seen.has(x))continue;seen.add(x);const t=TASK(x);if(t)(t.pred||[]).forEach(q=>st.push(predId(q)))}return false}
/* ---- Resource usage by week: work (hours) per resource ---- */
function weekIdx(w){return Math.floor((w-0)/5)}
function wbsUsage(P,list,opts){opts=opts||{};const wk0=Math.floor(TODAY/5)-4,N=opts.weeks||16,M={};const pools=opts.pools===false?false:true;
 list.forEach(t=>{if(t.ms||t.pct>=100&&!opts.all)return;const r=P.R[t.id];if(!r||r.ef<=r.es)return;const asg=asgOf(t).filter(a=>pools||!a.pool);asg.forEach(a=>{const row=M[a.n]||(M[a.n]={n:a.n,pool:a.pool,wk:new Array(N).fill(0),tot:0});
   for(let w=r.es;w<r.ef;w++){const k=Math.floor(w/5)-wk0;if(k>=0&&k<N){const h=a.u/100*HRS;row.wk[k]+=h;row.tot+=h}}})});
 return {rows:Object.values(M),wk0,N}}
const weekLabel=k=>fmtD(Math.max(0,k)*5);
/* ---- Seeded plans for named users and the public contract ---- */
const PPMX={
 addTasks(projectId,items,opts){opts=opts||{};const pj=PROJ.find(p=>p.id===projectId);if(!pj)return[];wbsIdx();let after=null;
  if(opts.phase){const lastSum=[...(OUTL[projectId]||[])].reverse().find(x=>x.sum&&x.n===opts.phase);const s=lastSum||WBSOP.add(projectId,{kind:"sum",n:opts.phase,own:opts.own||pj.owner},null);after=s.id}
  const ids=[];items.forEach((x,i)=>{const pred=(x.pred||[]).map(q=>{const a=Array.isArray(q)?q[0]:q;const ref=typeof a==="string"&&a[0]==="@"?ids[+a.slice(1)]:a;return Array.isArray(q)?[ref,q[1]||0,q[2]||"FS"]:ref}).filter(Boolean);
   const res=(x.res||[]).map(r=>Array.isArray(r)?r:[r,1]);const it=WBSOP.add(projectId,{kind:x.ms?"ms":"task",n:x.n,dur:x.dur||(x.ms?0:5),pred,own:x.own||pj.owner,res,asg:x.asg||[],pct:x.pct||0,cost:x.cost||0,dv:x.dv,note:x.note,ven:x.ven,snet:x.snet},after);after=it.id;ids.push(it.id)});
  if(opts.phase&&ids.length){/* tasks sit under the phase summary */}audit("generated WBS lines",projectId+" · "+ids.length+" lines"+(opts.source?" from "+opts.source:""));return ids},
 wbsOf(projectId){wbsIdx();const P=plan("now",ulist());const rs=rollup(P);return wbsOutline(projectId).map(it=>{const a=it.sum?rs.S[it.id]:null,r=it.sum?null:P.R[it.id];return {id:it.id,wbs:it.wbs,n:it.n,lv:it.lv,sum:!!it.sum,ms:!!it.ms,parent:it.parent,own:it.own,start:a?a.es:r&&r.es,finish:a?a.ef:r&&r.ef,pct:a?a.pct:it.pct,cost:a?a.cost:it.cost,pred:(it.pred||[]).map(predId)}})},
 tasksOf(arg){const f=typeof arg==="string"?{p:arg}:(arg||{});return (XT.on?TASKS.concat(XT.tasks):TASKS).filter(t=>(!f.p||t.p===f.p)&&(!f.own||t.own===f.own)&&(!f.ms||!!t.ms===f.ms)&&(!f.open||t.pct<100)&&(!f.who||(t.asg||[]).some(a=>a[0]===f.who)||t.own===f.who))},
 projects(){return PROJ.concat(XT.proj)},
 shiftTask(id,days){const t=TASK(id)||XT.m.get(id);if(!t||t.ms)return {ok:0,why:"Task not found"};t.dur=Math.max(1,(t.dur||1)+(+days||0));wbsTouch();return {ok:1,dur:t.dur}},
 plan,rollup,WBSOP
};
window.PPMX=PPMX;

/* ---- Enterprise scale: generated plans for the extra projects (SCALE.on). Core projects never depend on them. ---- */
Object.defineProperty(XT,"on",{get(){if(typeof SCALE!=="undefined"&&SCALE.on&&!XT.built&&!XT._b){XT._b=1;try{buildXT()}finally{XT._b=0}}return !!(typeof SCALE!=="undefined"&&SCALE.on&&XT.built)}});
XT.list=function(){const k=TVER+":"+TASKS.length+":"+XT.tasks.length;if(XT._k!==k){XT._l=TASKS.concat(XT.tasks);XT._k=k}return XT._l};
const ulist=()=>XT.on?XT.list():TASKS;
const UPROJ=()=>XT.on?PROJ.concat(XT.proj):PROJ;
function ensureScale(){if(typeof SCALE==="undefined"||!SCALE.on)return false;if(!XT.built)buildXT();return true}
function buildXT(){if(XT.built)return;const gp=SCALE.projects(),r=RNG0("xt");const rr=(a,b)=>a+Math.floor(r()*(b-a+1)),pick=a=>a[Math.floor(r()*a.length)];
 const COL=["--p1","--p2","--p3","--p5","--s2","--s4","--e1","--e3","--u1","--u4","--w2","--w3"];
 let _pp=null;const people=()=>_pp||(_pp=DIR.filter(d=>d.kind==="human").map(d=>d.name)),AIS=["Test Agent","Knowledge Curator","PMO Agent","Triage Agent","Change Risk Agent","Contract Analyst Agent"],CON=["Marco Ellis","Hana Koval","Ravi Menon","Elise Park"],MSPS=["Lumen Search Services","Northwind Managed Services","Contoso Cloud Operations"];
 const core=["p1_5","p1_9","p2_5","p3_5","p4_4"];
 const PH=[["Plan and design",["Scope and requirements","Architecture and vendor options","Business case and funding"]],["Build and test",["Core build","Integration","Quality and security"]],["Deploy and adopt",["Readiness and training","Cutover","Hypercare and handover"]]];
 const NAMES=[["Workshops","Requirements catalog","Process mapping","Design review","Vendor demo","Solution design","Data mapping","Risk assessment","Funding paper","Security review"],["Configure platform","Build integrations","Develop reports","Migrate data","Unit tests","System test","Performance test","Penetration test","Accessibility test","Environment setup"],["Training plan","Train the trainers","User training","Cutover runbook","Dress rehearsal","Go live support","Knowledge articles","Handover to operations","Benefits review","Lessons learned"]];
 const TPL=[{ph:PH,nm:NAMES},
  {ph:[["Discovery",["Research and framing","Backlog shaping","Funding and approach"]],["Delivery sprints",["Sprints 1 to 3","Sprints 4 to 6","Hardening"]],["Release and adopt",["Release readiness","Rollout","Stabilize and handover"]]],nm:[["User interviews","Journey mapping","Backlog refinement","Prototype","Architecture spike","Roadmap and release plan","Funding paper","Team onboarding"],["Sprint planning","Build features","Integrate services","Sprint review","Regression test","Performance tuning","Security scan","Defect burn down"],["Release candidate","Training sessions","Communications","Phased rollout","Support handoff","Retrospective","Benefits review"]]},
  {ph:[["Assess",["Inventory and baseline","Gap analysis","Remediation plan"]],["Remediate",["Controls and policy","Technical fixes","Evidence collection"]],["Attest",["Internal review","External audit","Close findings"]]],nm:[["Asset inventory","Control mapping","Interview owners","Gap register","Risk scoring","Plan approval","Scope agreement"],["Update policy","Patch systems","Configure controls","Collect evidence","Test control","Train staff","Document procedure"],["Pre audit review","Auditor walkthrough","Fix findings","Management response","Sign off","Archive evidence"]]},
  {ph:[["Design",["Requirements","Target architecture","Vendor selection"]],["Build and migrate",["Foundation","Data migration","Parallel run"]],["Cutover",["Dress rehearsal","Go live","Decommission old"]]],nm:[["Requirements workshop","Capacity model","Network design","Vendor demos","Reference check","Contract negotiation","Design authority"],["Provision environment","Build pipelines","Migrate data","Reconcile data","Parallel run","Fix defects","Failover test"],["Rehearsal one","Rehearsal two","Cutover weekend","Hypercare","Decommission","Close out"]]}];
 gp.forEach((g,gi)=>{const T=TPL[gi%TPL.length],PH=T.ph,NAMES=T.nm;const id=g.id,pj={id,n:g.n.trim(),short:g.short,c:COL[gi%COL.length],owner:g.owner,bac:g.bac,paid:Math.round(g.bac*g.pct/100*(.7+r()*.5)),rec:null,gen:1,status:g.status,team:g.team};XT.proj.push(pj);
  const total=rr(8,40),perPh=[Math.round(total*.3),Math.round(total*.42)];perPh.push(total-perPh[0]-perPh[1]);const out=[];let sn=0,tn=0,prevGate=null,first=true;const gates=[];
  PH.forEach((ph,pi)=>{const s={id:`${id}_s${++sn}`,p:id,n:ph[0],lv:1,sum:1,own:g.owner};XT.sums.push(s);out.push(s);
   const ws=Math.max(1,Math.min(3,Math.round(perPh[pi]/5))),per=Math.max(2,Math.round(perPh[pi]/ws));let made=0,lastLeaf=prevGate;
   for(let w=0;w<ws;w++){const sub={id:`${id}_s${++sn}`,p:id,n:ph[1][w],lv:2,sum:1,own:pick(people())};XT.sums.push(sub);out.push(sub);let prev=w===0?prevGate:(lastLeaf);let n=w===ws-1?perPh[pi]-made:per;
    for(let k=0;k<Math.max(1,n);k++){const nm=pick(NAMES[pi]);const t={id:`${id}_${++tn}`,p:id,n:nm,dur:rr(3,22),pred:[],pct:0,own:pick(people()),res:[],asg:[],lv:3};
     if(prev&&(k>0||r()<.85))t.pred.push(prev);else if(prev)t.pred.push(prev);
     if(first){t.ct="SNET";t.cd=isoOf(rr(0,110));first=false}
     if(pi===1&&k===0&&r()<.28){const og=gp[rr(0,Math.max(0,gi-1))];const gt=gi>0?(XT.gate[og.id]||null):null;if(gt&&og.id!==id)t.pred.push(gt);else if(r()<.4)t.pred.push(pick(core))}
     if(k>0&&r()<.2&&out.length>2){const pv=out[out.length-2];if(pv&&!pv.sum&&pv.p===id)t.pred.push(pv.id)}
     const na=rr(1,2);const pool=r()<.12?AIS:r()<.1?CON:r()<.06?MSPS:people();for(let a=0;a<na;a++){const nme=pick(pool);if(!t.asg.some(x=>x[0]===nme))t.asg.push([nme,pick([25,50,50,100])])}
     if(r()<.22)t.bdur=Math.max(2,t.dur-rr(1,5));XT.tasks.push(t);out.push(t);prev=t.id;lastLeaf=t.id;made++}
   }
   const gate={id:`${id}_${++tn}`,p:id,n:pi===2?"Go live":ph[0]+" gate",dur:0,ms:1,pred:[lastLeaf],pct:0,own:g.owner,res:[],asg:[],lv:pi===2?1:1};
   if(pi<2){gate.lv=2;/* the gate sits inside its phase */}XT.tasks.push(gate);out.push(gate);prevGate=gate.id;gates.push(gate.id);if(pi===0)(XT.gate||(XT.gate={}))[id]=gate.id});
  XT.outl[id]=out});
 /* schedule once to set believable progress, costs and actual dates */
 const all=TASKS.concat(XT.tasks),P0=cpm(t=>t.ms?0:Math.max(1,t.dur),all,{noAct:true});
 XT.proj.forEach(pj=>{const ts=XT.tasks.filter(t=>t.p===pj.id&&!t.ms),w=ts.reduce((a,t)=>a+t.dur,0)||1,rr2=RNG0("p"+pj.id);let paidRaw=0;
  ts.forEach(t=>{const x=P0.R[t.id];t.cost=Math.round(pj.bac*t.dur/w*10)/10;t.bcost=t.cost;if(x.ef<=TODAY-2)t.pct=100;else if(x.es<TODAY){t.pct=Math.max(5,Math.min(95,Math.round((TODAY-x.es)/Math.max(1,x.ef-x.es)*100+(rr2()-.5)*30)))}else t.pct=0;
   if(t.pct>0){t.as=x.es;if(t.pct===100)t.af=x.ef-1}t.ac=Math.round(t.cost*t.pct/100*(.8+rr2()*.5)*10)/10;paidRaw+=t.ac});
  XT.tasks.filter(t=>t.p===pj.id&&t.ms).forEach(t=>{const x=P0.R[t.id];t.cost=0;t.ac=0;t.bcost=0;if(x.es<=TODAY-2){t.pct=100;t.as=t.af=x.es}});pj.paid=Math.round(paidRaw)});
 XT.m=new Map(XT.tasks.map(t=>[t.id,t]));XT.sm=new Map(XT.sums.map(t=>[t.id,t]));XT.pm=new Map();XT.tasks.forEach(t=>{(XT.pm.get(t.p)||XT.pm.set(t.p,[]).get(t.p)).push(t)});
 Object.values(XT.outl).forEach(a=>indexOutline(a));XT.built=true;IDX.v=-1;TVER++}

/* ---- Metrics added by the WBS and schedule work. Current values are refreshed by syncWbsMetrics() in screens4.js ---- */
Object.assign(METRICS,{
 m_wbs_cmp:{n:"WBS completeness",f:"Work lines with an owner, a duration, a predecessor, a resource and a confirmed deliverable ÷ All work lines (milestones need a predecessor and a deliverable) × 100",u:"%",cur:61,tgt:80,badAt:55,dir:"max",max:100,tr:[48,50,53,55,57,58,60,61],owner:"PMO",use:["WBS and task sheet","Master schedule"],rem:{kind:"sop",ref:"SOP-212",title:"Complete a WBS before baselining",agent:"PMO Agent",auto:false,state:"idle",prog:"Drafts missing deliverables and resources, then asks the project manager to confirm"}},
 m_schedvar:{n:"Schedule variance",f:"Forecast finish − Baseline finish, in work days, averaged over active projects (positive means late)",u:" days",cur:2,tgt:2,badAt:6,dir:"min",max:15,tr:[0,0,1,1,2,2,2,2],owner:"PMO",use:["WBS and task sheet","Master schedule","Project plan"],rem:{kind:"sop",ref:"SOP-208",title:"Recover a slipped milestone",agent:"PMO Agent",auto:true,state:"running",prog:"Step 2 of 5: re-baselining the indexer work with Lumen"}},
 m_mshit:{n:"Milestone hit rate",f:"Milestones finished on or before their baseline date ÷ Milestones whose baseline date has passed × 100",u:"%",cur:100,tgt:85,badAt:70,dir:"max",max:100,tr:[100,100,100,100,100,100,100,100],owner:"PMO",use:["WBS and task sheet","Master schedule"],rem:{kind:"kb",ref:"KB-122",title:"Replan a late milestone",agent:"PMO Agent",auto:false,state:"idle",prog:"Drafts a recovery plan when a milestone is missed"}}});

/* Resource load by month (Jul 2026 to Mar 2027), as a share of capacity. Funded demand adds load. */
const MONTHS=[["Jul",2026,6],["Aug",2026,7],["Sep",2026,8],["Oct",2026,9],["Nov",2026,10],["Dec",2026,11],["Jan",2027,0],["Feb",2027,1],["Mar",2027,2]];
function load(P,extra){const grid={};Object.keys(CAP).forEach(r=>grid[r]=MONTHS.map(()=>0));
 MONTHS.forEach(([,y,m],mi)=>{const a=WD.findIndex(t=>{const d=new Date(t);return d.getUTCFullYear()===y&&d.getUTCMonth()===m}),b=WD.findIndex(t=>{const d=new Date(t);return d.getUTCFullYear()===(m===11?y+1:y)&&d.getUTCMonth()===((m+1)%12)});const n=b-a;
  TASKS.forEach(t=>{const r=P.R[t.id];if(t.ms||t.pct===100&&r.ef<=a)return;const s=Math.max(a,r.es),e=Math.min(b,r.ef);if(e>s)t.res.forEach(([rn,f])=>grid[rn][mi]+=f*(e-s)/n)});
  (extra||[]).forEach(d=>d.res.forEach(([rn,f])=>{if(mi>=d.m0&&mi<d.m0+d.mo)grid[rn][mi]+=f}))});
 Object.keys(grid).forEach(r=>grid[r]=grid[r].map(v=>v/CAP[r]));return grid}

/* Demand and prioritization */
const DSTAGES=["Submitted","Screening","Scoring","Review board"];
const DEMAND=[
 {id:"D1",n:"Public comment portal",who:"Editorial",sp:"Chief Editor",cost:420,ben:1100,strat:5,risk:2,urg:3,pm:14,st:3,res:[["Platform team",4]],m0:6,mo:5,why:"Lets stakeholders comment on drafts online. A regulator expects it before the Q2 comment window.",obj:"O1"},
 {id:"D2",n:"Reviewer workload dashboard",who:"Editorial",sp:"Chief Editor",cost:120,ben:340,strat:3,risk:1,urg:2,pm:4,st:2,res:[["Data team",1]],m0:6,mo:3,why:"Shows who is overloaded with reviews so deadlines stop slipping.",obj:"O1",dup:"D10"},
 {id:"D3",n:"Retire the legacy lease subledger",who:"Finance",sp:"CFO",cost:680,ben:910,strat:4,risk:5,urg:4,pm:22,st:3,res:[["Platform team",2],["Architecture",1]],m0:3,mo:6,why:"The old subledger cannot support the ASC 842 amendment effective Jan 1, 2027.",obj:"O2",kg:"std1"},
 {id:"D4",n:"Mobile app for editors",who:"Editorial",sp:"Chief Editor",cost:540,ben:480,strat:2,risk:1,urg:1,pm:16,st:1,res:[["Platform team",3]],m0:7,mo:6,why:"Lets editors approve changes from a phone.",obj:"O1"},
 {id:"D5",n:"Vendor risk scorecards",who:"Procurement",sp:"CFO",cost:210,ben:600,strat:4,risk:4,urg:3,pm:7,st:2,res:[["Data team",2]],m0:4,mo:3,why:"Turns the vendor index into a monthly scorecard before renewals.",obj:"O2"},
 {id:"D6",n:"AI drafting assistant for standards",who:"Editorial",sp:"CEO office",cost:350,ben:1400,strat:5,risk:2,urg:3,pm:10,st:2,res:[["Platform team",2],["Data team",1]],m0:5,mo:5,why:"Drafts first versions of standards from approved source text, with every sentence cited.",obj:"O1"},
 {id:"D7",n:"Disaster recovery for the Portal",who:"IT operations",sp:"CIO",cost:460,ben:800,strat:4,risk:5,urg:5,pm:12,st:3,res:[["Ops team",2],["Architecture",1]],m0:3,mo:5,why:"The Sev 2 incident showed there is no tested failover. Tier 1 availability depends on it.",obj:"O2"},
 {id:"D8",n:"Data warehouse consolidation",who:"Data office",sp:"CIO",cost:900,ben:1200,strat:3,risk:3,urg:2,pm:30,st:0,res:[["Data team",3]],m0:6,mo:9,why:"Merges three warehouses into one. Large, and it overlaps the Taxonomy Data Hub.",obj:"O2"},
 {id:"D9",n:"Meeting room AV refresh",who:"Facilities",sp:"COO",cost:160,ben:90,strat:1,risk:1,urg:2,pm:3,st:0,res:[["Ops team",1]],m0:5,mo:2,why:"Replaces ageing cameras and displays in four rooms.",obj:null},
 {id:"D10",n:"Standards publishing analytics",who:"Editorial",sp:"Chief Editor",cost:130,ben:310,strat:3,risk:1,urg:2,pm:4,st:0,res:[["Data team",1]],m0:6,mo:3,why:"Tracks how long each standard takes from draft to publication.",obj:"O1",dup:"D2"}];
const DW0={s:.35,f:.25,r:.2,u:.2};
function dscore(d,w){const roi=d.ben/d.cost,fin=Math.min(5,roi*2),sum=w.s+w.f+w.r+w.u||1;return Math.round((w.s*d.strat+w.f*fin+w.r*d.risk+w.u*d.urg)/sum/5*100)}
function rank(w,env,cap){const L=DEMAND.filter(d=>!(S.merged||{})[d.id]).map(d=>({...d,roi:d.ben/d.cost,score:dscore(d,w)})).sort((a,b)=>b.score-a.score);let c=0,p=0,cut=false;L.forEach(d=>{if(!cut&&c+d.cost<=env&&p+d.pm<=cap){c+=d.cost;p+=d.pm;d.fund=true}else{cut=true;d.fund=false}});L.spent=c;L.pms=p;return L}

/* Metrics defined once, used across PPM screens */
Object.assign(METRICS,{
 m_prio:{n:"Priority score",f:"(0.35 × Strategic fit + 0.25 × Financial return + 0.20 × Risk reduction + 0.20 × Urgency) ÷ 5 × 100",u:"",cur:68,tgt:60,badAt:45,dir:"max",max:100,tr:[61,63,64,66,67,67,68,68],owner:"Portfolio office",use:["Demand and priorities"],rem:{kind:"sop",ref:"SOP-301",title:"Re-score demand after a strategy change",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Re-scores the queue and lists items that moved"}},
 m_spi:{n:"Schedule performance index",f:"Earned value ÷ Planned value",u:"",cur:.91,tgt:.95,badAt:.85,dir:"max",max:1.2,tr:[1.02,1.0,.98,.96,.94,.93,.92,.91],owner:"PMO",use:["Master schedule","Project plan","Home"],rem:{kind:"sop",ref:"SOP-208",title:"Recover a slipped milestone",agent:"PMO Agent",auto:true,state:"running",prog:"Step 2 of 5: re-baselining the indexer work with Lumen"}},
 m_ontime:{n:"Milestones on time",f:"Milestones met by the baseline date ÷ Milestones due to date",u:"%",cur:78,tgt:85,badAt:70,dir:"max",max:100,tr:[92,90,88,85,83,80,79,78],owner:"PMO",use:["Master schedule"],rem:{kind:"kb",ref:"KB-122",title:"Replan a late milestone",agent:"PMO Agent",auto:false,state:"idle",prog:"Drafts a recovery plan when a milestone slips"}},
 m_util:{n:"Resource utilization",f:"Assigned FTE ÷ Available FTE, per team per month",u:"%",cur:92,tgt:85,badAt:105,dir:"min",max:130,tr:[78,81,84,88,91,93,94,92],owner:"Resource office",use:["Demand and priorities","Master schedule"],rem:{kind:"sop",ref:"SOP-315",title:"Level an overloaded team",agent:"Resource Agent",auto:false,state:"idle",prog:"Proposes moves that clear the overload without moving a milestone"}},
 m_intake:{n:"Demand decision time",f:"Date decided − Date submitted, in days",u:" days",cur:19,tgt:14,badAt:21,dir:"min",max:40,tr:[24,23,22,21,20,20,19,19],owner:"Portfolio office",use:["Demand and priorities"],rem:{kind:"agent",ref:"Portfolio Agent",title:"Nudge stalled reviews",agent:"Portfolio Agent",auto:true,state:"running",prog:"Reminded 2 sponsors about scores due this week"}}});

/* Product log: every update and every piece of feedback, kept for future releases */
const VERS=[["v1","2026-10-06","Prototype v1","Executive trace, invoice approval, First Officer, AI Control Tower."],["v2","2026-10-06","Oukala v2","Liquid glass shell, personas, process-flow trace, ledger and rule builder, calendars, Control Tower, metrics, knowledge graph."],["v3","2026-10-06","PPM and product log","Demand and priorities, integrated master schedule, project plans, Project Online coverage, this log."],["v4","2026-10-06","Everything on the feature list","Drag and drop, intake, contract ingestion, projects and RAID, vault graph, ITSM, ITOM, budgets, executive views, workflow, knowledge, people, admin."]];
const LOG0=[
 ["F01","Design","Shell","Floating, collapsible glass sidebar like Apple's menu, with a subtle background graphic.","Done","v2"],
 ["F02","Design","Shell","User profile and preferences.","Done","v2"],
 ["F03","Design","Visual","Liquid glass, floating layers, strong color contrast, hover effects everywhere, subtle animation, no text boxes or visible text boundaries.","Done","v2"],
 ["F04","Design","Visual","Use the supplied color palette. Name the app Oukala.","Done","v2"],
 ["F05","Design","Trace","Trace the business process like the Codification Publishing Flow, in a modern vector style, keeping the interactivity.","Done","v2"],
 ["F06","Design","Trace","\"How to read this\" was unreadable and inconsistent.","Done","v2"],
 ["F07","Design","Table","Fix the inconsistent fonts and make the table less boring.","Done","v2"],
 ["F08","Design","Table","Clicking away from a row should close the drawer. The drawer should be floating liquid glass.","Done","v2"],
 ["F09","Design","Dashboard","Dashboard was mediocre. Needs richer visuals.","Done","v2"],
 ["F10","Feature","Invoices","Show a ledger: contract total, paid to date, this invoice, what we should pay, remaining, and performance on time, quality and expectation.","Done","v2"],
 ["F11","Clarity","Invoices","Make the link between an invoice and the executive trace obvious.","Done","v2"],
 ["F12","Feature","Invoices","Show how to define auto-approval rules.","Done","v2"],
 ["F13","Feature","First Officer","Agents should handle meetings automatically. The screen is for after-the-fact review. Needs robust calendar views.","Done","v2"],
 ["F14","Design","Control Tower","The AI Control Tower was boring. Look at Salesforce and ServiceNow for inspiration.","Done","v2"],
 ["F15","Feature","Knowledge graph","Traverse a file system or other source to link knowledge such as GAAP, with the same impact analysis as a changed CI.","Done","v2"],
 ["F16","Principle","Everywhere","Every field is either part of the story or a metric. Metrics are defined once, show their formula, and name what happens when off trend.","Done","v2"],
 ["F17","Principle","Everywhere","Persona-based, hyper-contextual content. Adaptive to skill level, device and accessibility.","Done","v2"],
 ["F18","Principle","Everywhere","Track and audit every action. Trends become research for future feature requests.","In progress","v3"],
 ["F19","Principle","Everywhere","Chat can control everything. AI actions always show lineage and guardrails.","In progress","v3"],
 ["F20","Feature","Portfolio","Expand project and portfolio management: integrated master schedule across projects, Gantt charts, project plans, full Microsoft Project Online features, demand and prioritization.","In progress","v3"],
 ["F21","Process","Product log","Track every update, including design feedback, for future releases.","In progress","v3"],
 ["F22","Question","Research","Why does the data-model research matter in a prototype? It informs the real data model, so it is not a screen. Answered in chat.","Done","v2"],
 ["F23","Idea","Visual","Offer to get outside UI and UX guidance (ChatGPT) if the visuals need it. Not needed yet.","Open","—"],
 ["F24","Feature","Demand","Drag and drop priorities, with a reason captured for every override.","Done","v4"],
 ["F25","Feature","Platform","Drag and drop everywhere it makes sense: demand gates, assignments, change calendar, release trains, workflow canvas, budget transfers, risk heat map, room bookings.","Done","v4"],
 ["F26","Feature","Demand","Show how intake works, with a real form, duplicate check and live score preview.","Done","v4"],
 ["F27","Feature","Demand","Hover detail on how a priority score is calculated.","Done","v4"],
 ["F28","Feature","Demand","A funded request automatically becomes a project with tasks and a place on the master schedule.","Done","v4"],
 ["F29","Feature","Demand","Ingest a contract and extract milestones, agreements, SLAs, deliverables, budget and invoice schedule.","Done","v4"],
 ["F30","Bug","Visual","Spacing: tiles touched the cards below them in the impact report.","Done","v4"],
 ["F31","Feature","Schedule","Filter project schedules by project, assign project managers and individuals, see milestone progress and a RAID log.","Done","v4"],
 ["F32","Feature","Knowledge","Knowledge graph should feel like Obsidian. Rebuilt from the GAAP vault as a force graph with local graph, backlinks and stubs.","Done","v4"],
 ["F33","Feature","Service","Show ITSM components: incidents, problems, changes, releases, major incidents, catalog, SLAs, on-call, assets.","Done","v4"],
 ["F34","Feature","Finance","Show budgets overall, financial model, vendors and contracts, benefits and delegation of authority.","Done","v4"],
 ["F35","Feature","Executive","Show executive views: CEO, CFO, CIO, COO and Board, strategy alignment, risk heat map with Monte Carlo, application portfolio, board pack.","Done","v4"],
 ["F36","Feature","Platform","Build initial feature prototypes with forms for everything on the feature list.","Done","v4"],
 ["F37","Idea","Platform","The vault graph should read the live Obsidian vault instead of a snapshot. Needs the desktop connector.","Open","—"],
 ["F38","Idea","Demand","Contract ingestion should read real PDF and Word files through a document service.","Open","—"]];
const LOGKEY="oukala.log.v3";
let LOGX=[];try{LOGX=JSON.parse(localStorage.getItem(LOGKEY)||"[]")}catch(e){}

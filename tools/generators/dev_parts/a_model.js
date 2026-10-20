/* ===== Oukala DevOps and master maps (module devops) =====
   Screens: dev_pipe (Delivery pipeline), itom_dev (Environments and DORA), plat_map (Master process flow), plat_data (Master data model).
   One integrated flow: work item > commit > pull request > build > test > security scan > artifact > change gate > deploy > verify > release closed.
   The change gate decides, from evidence on the run, whether the change is a standard change (auto\u2011approved), a normal change (CAB) or an emergency change. */
(function(){
const H=esc,N0=n=>Math.round(n).toLocaleString("en-US"),P1=n=>(Math.round(n*10)/10).toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});
const D=S.dev=S.dev||{ver:0,sel:null,trace:"REL-2611",pol:null,frz:[],ov:{},rb:[],cabLog:[],envF:"All",runQ:""};
const TODAY="2026-10-06",NOWT="2026-10-06 13:30";
const pad=n=>String(n).padStart(2,"0");
const dn=s=>Math.round(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/864e5);
const dfrom=n=>{const d=new Date(n*864e5);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())};
const addD=(s,k)=>dfrom(dn(s)+k);
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fd=s=>s?MON[+s.slice(5,7)-1]+" "+(+s.slice(8,10)):"";
const sum=(a,f)=>a.reduce((x,y)=>x+(f?f(y):y),0);
const med=a=>{if(!a.length)return 0;const b=a.slice().sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const who_=()=>(S.persona&&PERSONAS&&PERSONAS[S.persona]?PERSONAS[S.persona].n:"Omar Hamid");
const STG=[["wi","Work item","Backlog item or project task"],["cm","Commit","Code committed with the work item id"],["pr","Pull request","Review and merge"],["bd","Build","Compile and package"],["ts","Test","Automated test suite"],["sc","Security scan","Dependencies, code and secrets"],["ar","Artifact","Signed, versioned package"],["gt","Change gate","Standard, normal or emergency change"],["dp","Deploy","Release to the target environment"],["vf","Verify","Service level check after deploy"],["rr","Release closed","Release and change records closed"]];
const ENVS=["Development","Test","Staging","Production"];
const DEVS=["Zoe Hart","Ravi Menon","Dev Rao","Marco Ellis","Sam Patel","Priya Shah","Jordan Lee"];
const STC={d:["Done","good"],r:["Running","info"],f:["Failed","bad"],w:["Waiting","warn"],p:["Not started","mute"],s:["Skipped","mute"]};
/* ---------- gate policy ---------- */
const defPol=()=>({test:95,cov:80,crit:0,high:2,risk:"Low",budget:10,freeze:true,tpl:true,clash:true,rbk:true,schema:false,fullAuto:true});
D.pol=D.pol||defPol();
D.frz=D.frz||[];
const FRZ0=[{id:"fz1",n:"Financial close freeze",from:"2026-11-16",to:"2026-11-20",kind:"Blackout"},{id:"fz2",n:"Thanksgiving reduced staffing",from:"2026-11-25",to:"2026-11-27",kind:"Restricted"},{id:"fz3",n:"Year-end freeze",from:"2026-12-21",to:"2027-01-04",kind:"Blackout"}];
const FRZ=()=>FRZ0.concat(D.frz);
const frzOn=(d,pol)=>FRZ().find(f=>d>=f.from&&d<=f.to&&(f.kind==="Blackout"||(pol&&pol.strict)));
const RLX=()=>window.RELX||{releases:[],gates:()=>[],clashes:()=>[],dora:()=>({n:0,df:0,cfr:0,ttr:0,lt:0}),trains:[]};
const svcByName=n=>SVCREG.find(s=>s.n===n||s.id===n)||SVCREG[0];
const svcN=id=>(SVCREG.find(s=>s.id===id)||{n:id}).n;
const sloLeft=sid=>{try{return window.OBSX&&OBSX.sloLeft?OBSX.sloLeft(sid):null}catch(e){return null}};
/* ---------- standard change templates the pipeline can use ---------- */
const TPLS=[{id:"STD-APP",n:"Application release, no schema change",by:"Nia Brooks",at:"2026-06-03",scope:"Stateless application or content deployment, tested, rollback by redeploying the previous artifact.",maxRisk:"Low"},{id:"STD-CFG",n:"Configuration change from source control",by:"Nia Brooks",at:"2026-06-03",scope:"Feature flags and configuration values stored in source control.",maxRisk:"Low"},{id:"STD-DB",n:"Schema migration, backward compatible",by:"Jordan Lee",at:"2026-08-12",scope:"Additive schema changes only, tested on a production copy.",maxRisk:"Medium"}];
/* ---------- run model ---------- */
const R_=seed=>RNG("dev"+seed);
const hex=r=>{let s="";for(let i=0;i<7;i++)s+="0123456789abcdef"[Math.floor(r()*16)];return s};
const RISKN={Low:1,Medium:2,High:3};
function mkRun(i,o){const r=R_(i+"|"+(o.rel||""));const rel=o.rel||"";
 const dev=DEVS[Math.floor(r()*DEVS.length)],risk=o.risk||(o.out==="wait"?"Medium":r()<.68?"Low":r()<.78?"High":"Medium"),hot=!!o.hot;
 const total=Math.round(300+r()*2200),good=o.out==="testfail"?.9+r()*.04:.965+r()*.034;
 const bo=o.out;const run={id:"PL-"+String(o.n||i).padStart(4,"0"),rel,svc:o.svc,svcId:svcByName(o.svc).id,env:o.env||"Production",tgt:o.env||"Production",br:hot?"hotfix/"+hex(r).slice(0,4):(r()<.5?"main":"release/"+(o.ver||"2.9")),sha:hex(r),dev,story:o.story||"ST-"+Math.round(1000+r()*8000),proj:o.proj||"",
  date:o.date,time:pad(8+Math.floor(r()*9))+":"+pad(Math.floor(r()*60)),risk,hot,schema:o.schema!=null?o.schema:r()<.12,
  tests:{total,pass:Math.round(total*good),cov:Math.round(76+r()*18)},scan:{crit:bo==="scanfail"?1+Math.floor(r()*2):0,high:bo==="scanfail"?2+Math.floor(r()*4):Math.floor(r()*r()*3),med:Math.floor(r()*9)},
  rbk:o.rbk!=null?o.rbk:r()<.95,dur:Math.round(14+r()*40),lt:o.lt||Math.round(6+r()*60),ttr:o.ttr||0,out:o.out||"ok",chg:o.chg||"",appr:o.appr||"",prn:Math.round(100+r()*900),path:"",ver:o.ver||"",files:Math.round(2+r()*40),loc:Math.round(20+r()*900)};
 return run}
/* stage states for a run from its outcome */
function stages(run,gate){const o=run.out,a=Array(11).fill("p");const upto=k=>{for(let i=0;i<k;i++)a[i]="d"};
 if(o==="ok"){upto(11)}
 else if(o==="testfail"){upto(4);a[4]="f"}
 else if(o==="scanfail"){upto(5);a[5]="f"}
 else if(o==="buildfail"){upto(3);a[3]="f"}
 else if(o==="wait"){upto(7);a[7]="w"}
 else if(o==="ready"){upto(8);a[8]="p"}
 else if(o==="dpfail"){upto(8);a[8]="f"}
 else if(o==="vffail"){upto(9);a[9]="f"}
 else if(o==="blocked"){upto(7);a[7]="f"}
 else if(typeof o==="number"){upto(o);if(o<11)a[o]="r"}
 if(run.out==="ok"&&run.sk){run.sk.forEach(i=>a[i]="s")}
 return a}
const RLS_OUT={"Planning":2,"In development":3,"In test":4,"Readiness review":"wait","Scheduled":"ready","Deployed":"ok","Rolled back":"vffail"};
let RC=null,RCK="";
function RUNS(){const key=(SCALE.on?"S":"D")+"|"+RLX().releases.length;if(RC&&RCK===key)return RC;RCK=key;const out=[];let n=4100;
 const rel=RLX().releases;
 rel.forEach((r,ix)=>{const rr=R_(r.id),hot=r.ty==="Hotfix",o=RLS_OUT[r.st]!=null?RLS_OUT[r.st]:3,date=r.act||r.date||TODAY,major=r.ty==="Major";
  const std=!hot&&!major&&rr()<.55;
  const run=mkRun(ix,{n:n++,rel:r.id,svc:r.svc,ver:r.ver,date,out:o,hot,story:(r.feats&&r.feats[0])||"",proj:r.proj,lt:r.lt,ttr:r.ttr,risk:o==="wait"?"Medium":hot?"Medium":major?(rr()<.5?"High":"Medium"):std?"Low":"Medium",schema:major?true:(std?false:rr()<.3),chg:(r.chg||[])[0]||""});
  if(r.st==="Rolled back"){run.out="vffail"}
  if(r.st==="Deployed"&&r.fail){run.out="ok";run.failed=true}
  out.push(run);
  if(r.st==="Deployed"||r.st==="Rolled back"){const k=1+Math.floor(rr()*2);for(let j=0;j<k;j++){const p=mkRun(ix*7+j+3,{n:n++,rel:r.id,svc:r.svc,ver:r.ver,date:addD(date,-(1+Math.floor(rr()*8))),out:rr()<.82?"ok":rr()<.5?"testfail":"scanfail",env:rr()<.5?"Staging":"Test",story:(r.feats&&r.feats[0])||"",proj:r.proj,lt:r.lt});p.tgt=p.env;if(p.out==="ok")p.sk=[7]; if(p.out==="testfail"){p.tests.pass=Math.round(p.tests.total*.9)}if(p.out==="scanfail"){p.scan.crit=1}out.push(p)}}});
 const extra=SCALE.on?900:96,sv=SVCREG;
 for(let i=0;i<extra;i++){const rr=R_("x"+i),s=sv[Math.floor(rr()*sv.length)],d=addD(TODAY,-Math.floor(rr()*34)),x=rr(),oc=x<.74?"ok":x<.82?"testfail":x<.88?"scanfail":x<.92?"buildfail":x<.96?"wait":3,env=rr()<.55?"Test":rr()<.6?"Staging":"Production";
  const run=mkRun(9000+i,{n:n++,svc:s.n,date:d,out:oc,env,story:"",lt:Math.round(4+rr()*50)});
  if(env!=="Production"){run.sk=[7]}
  if(env==="Production"&&oc==="ok"&&rr()<.2){run.hot=true;run.br="hotfix/"+run.sha.slice(0,4)}
  out.push(run)}
 out.forEach(run=>{if(D.ov[run.id])Object.assign(run,D.ov[run.id]);if(run.env!=="Production"&&run.out==="ok"){run.sk=[7]}});
 out.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 RC=out;return out}
const runOf=id=>RUNS().find(r=>r.id===id);
/* ---------- the change gate ---------- */
function gate(run,pol){pol=pol||D.pol;const rel=run.rel?(RLX().releases.find(x=>x.id===run.rel)||null):null,cl=run.rel?RLX().clashes(run.rel):[],hardCl=cl.filter(c=>c.k==="hard"),fz=frzOn(run.date,pol),sl=sloLeft(run.svcId);
 const tp=Math.round(run.tests.pass/run.tests.total*1000)/10,tpl=!run.schema?TPLS[0]:(run.risk!=="High"?TPLS[2]:null);
 const crit=[
  {k:"test",l:"Tests pass rate",need:"at least "+pol.test+"%",val:tp+"%",ok:tp>=pol.test,hard:true,fix:"Fix failing tests or quarantine flaky ones"},
  {k:"cov",l:"Code coverage",need:"at least "+pol.cov+"%",val:run.tests.cov+"%",ok:run.tests.cov>=pol.cov,fix:"Add tests for the changed files"},
  {k:"crit",l:"Critical vulnerabilities",need:"at most "+pol.crit,val:String(run.scan.crit),ok:run.scan.crit<=pol.crit,hard:true,fix:"Upgrade the dependency or add a documented exception"},
  {k:"high",l:"High vulnerabilities",need:"at most "+pol.high,val:String(run.scan.high),ok:run.scan.high<=pol.high,fix:"Triage with the security team"},
  {k:"risk",l:"Change risk",need:pol.risk+" or lower",val:run.risk,ok:RISKN[run.risk]<=RISKN[pol.risk],fix:"Risk is scored from files changed, service tier and change history"},
  {k:"schema",l:"Database schema change",need:pol.schema?"allowed if backward compatible":"none",val:run.schema?"Yes":"None",ok:pol.schema||!run.schema,fix:"A schema change needs review by the data architect"},
  {k:"tpl",l:"Matches a pre-approved standard change",need:"a template that covers this change",val:tpl?tpl.id:"No match",ok:!pol.tpl||!!tpl,fix:"Propose a new standard change template"},
  {k:"freeze",l:"Deployment freeze",need:"none on "+fd(run.date),val:fz?fz.n:"None",ok:!pol.freeze||!fz,fix:"Move the date or get an exception from the CIO"},
  {k:"clash",l:"Clash with other changes and releases",need:"no hard clash",val:hardCl.length?hardCl[0].n:cl.length?cl.length+" soft":"None",ok:!pol.clash||!hardCl.length,fix:"Open the release clash view and resolve"},
  {k:"slo",l:"Service error budget",need:"more than "+pol.budget+"% left",val:sl==null?"Not measured":sl<=0?"Spent":Math.round(sl)+"% left",ok:sl==null||sl>pol.budget,fix:"Spend effort on reliability work first"},
  {k:"rbk",l:"Rollback ready",need:pol.rbk?"previous artifact kept and tested":"not required",val:run.rbk?"Yes":"No",ok:!pol.rbk||run.rbk,fix:"Rehearse the rollback"}];
 const bad=crit.filter(c=>!c.ok),hard=bad.filter(c=>c.hard);let path,dec,why;
 if(run.hot){path="Emergency";dec="Emergency CAB (two of three), then review after the fix";why="Hotfix branch. The emergency path skips the normal queue but still creates a change record and needs two approvers within one hour."}
 else if(hard.length){path="None";dec="Blocked before the gate: "+hard.map(c=>c.l.toLowerCase()).join(", ");why="The pipeline stops here. Nothing is sent to the CAB until the build is healthy."}
 else if(!bad.length&&pol.fullAuto){path="Standard";dec="Auto-approved under "+(tpl?tpl.id:"STD-APP");why="Every criterion is met and a pre-approved template covers it, so no one needs to approve this deploy."}
 else{path="Normal";dec="Needs CAB approval";why=bad.length?"Not eligible for auto-approval because of: "+bad.map(c=>c.l.toLowerCase()).join(", ")+".":"Auto-approval is switched off in the policy."}
 return {crit,bad,path,dec,why,tpl,fz,clash:cl,pct:Math.round((crit.length-bad.length)/crit.length*100)}}
const GC=new Map();let GCV=-1;
const gateOf=run=>{if(GCV!==D.ver){GC.clear();GCV=D.ver}let g=GC.get(run.id);if(!g){g=gate(run);GC.set(run.id,g)}return g};
const stOf=run=>{if(run._st&&run._v===D.ver)return run._st;const s=run.stg||stages(run);return s};
/* status of a run for lists */
function resOf(run){if(run.rolled)return["Rolled back","bad"];const o=run.out;if(run.stg){const s=run.stg;if(s.includes("f"))return["Failed","bad"];if(s[7]==="w")return["Waiting for change approval","warn"];if(s.every(x=>x==="d"||x==="s"))return["Succeeded","good"];if(s.includes("r"))return["Running","info"];return["Ready to deploy","info"]}
 if(o==="ok")return run.failed?["Succeeded, later failed","warn"]:["Succeeded","good"];if(o==="wait")return["Waiting for change approval","warn"];if(o==="ready")return["Ready to deploy","info"];if(o==="testfail")return["Tests failed","bad"];if(o==="scanfail")return["Security scan failed","bad"];if(o==="buildfail")return["Build failed","bad"];if(o==="dpfail")return["Deploy failed","bad"];if(o==="vffail")return["Rolled back after verify","bad"];if(o==="blocked")return["Blocked at gate","bad"];return["Running","info"]}
const stgArr=run=>run.stg||stages(run);
const isProdDone=run=>run.env==="Production"&&(run.out==="ok"||run.out==="vffail"||run.out==="dpfail")&&!run.stg||(run.stg&&run.stg[8]==="d");
/* ---------- DORA from runs ---------- */
function dora(svc){const from=addD(TODAY,-30),prev=addD(TODAY,-60),prod=RUNS().filter(r=>r.env==="Production"&&(r.out==="ok"||r.out==="vffail"||r.out==="dpfail"||(r.stg&&r.stg[8]==="d"))&&(!svc||r.svc===svc));
 const cur=prod.filter(r=>r.date>from&&r.date<=TODAY),old=prod.filter(r=>r.date>prev&&r.date<=from);
 const f=x=>{const bad=x.filter(r=>r.out==="vffail"||r.out==="dpfail"||r.failed||r.rolled);const rw=x.filter(r=>r.hot||r.br.indexOf("hotfix")===0);return {n:x.length,df:x.length/(30/7),lt:med(x.map(r=>r.lt)),cfr:x.length?bad.length/x.length*100:0,ttr:bad.length?sum(bad,r=>r.ttr||2+(R_(r.id)()*5))/bad.length:0,rw:x.length?rw.length/x.length*100:0,bad:bad.length}};
 return {cur:f(cur),prev:f(old),runs:cur}}
const BAND=(m,v)=>{const T={df:[[7,"Elite"],[1,"High"],[.25,"Medium"],[0,"Low"]],lt:[[24,"Elite"],[168,"High"],[720,"Medium"],[1e9,"Low"]],cfr:[[5,"Elite"],[10,"High"],[15,"Medium"],[1e9,"Low"]],ttr:[[1,"Elite"],[24,"High"],[168,"Medium"],[1e9,"Low"]]}[m];if(m==="df"){for(const t of T)if(v>=t[0])return t[1]}else{for(const t of T)if(v<=t[0])return t[1]}return"Low"};
const BCL={Elite:"good",High:"info",Medium:"warn",Low:"bad"};
/* ---------- metrics (standard framework) ---------- */
const MU=(f,tr,own,use,agent,ref,title,prog,auto)=>({f,tr,owner:own,use,rem:{kind:"agent",ref,title,agent,auto:!!auto,state:"idle",prog}});
Object.assign(METRICS,{
 m_dora_df:Object.assign({n:"Deployment frequency",u:" per week",cur:3,tgt:7,badAt:1,dir:"max",max:14},MU("Production deployments in the last 30 days ÷ (30 ÷ 7). A deployment counts when the deploy stage finished, whether or not verify passed",[1.6,1.9,2.2,2.4,2.7,2.8,3,3],"Release manager",["Delivery pipeline","Environments and DORA"],"Release Agent","RB-DF","Batch smaller changes","Finds releases that bundle many features and proposes smaller slices")),
 m_dora_lead:Object.assign({n:"Lead time for changes",u:" h",cur:64,tgt:24,badAt:168,dir:"min",max:240},MU("Median of (production deploy time − first commit time) in hours, for production deployments in the last 30 days",[120,110,98,90,82,75,70,64],"Release manager",["Delivery pipeline","Where is my change"],"Release Agent","RB-LT","Find the slowest stage","Shows which pipeline stage holds work longest and proposes an automation")),
 m_dora_cfr:Object.assign({n:"Change failure rate",u:"%",cur:15.4,tgt:10,badAt:20,dir:"min",max:40},MU("Production deployments that caused a rollback, hotfix or incident ÷ production deployments, last 30 days",[24,22,21,19,18,17,16,15.4],"Change manager",["Delivery pipeline","Change and release"],"Change Risk Agent","RB-CFR","Raise the bar on risky releases","Proposes stricter gate criteria for the service types that fail most")),
 m_dora_ttr:Object.assign({n:"Time to restore service",u:" h",cur:5.3,tgt:1,badAt:24,dir:"min",max:48},MU("Average hours from a failed deployment to service restored, for production deployments that failed in the last 30 days",[9,8.6,8,7.2,6.4,6,5.6,5.3],"Ops team",["Delivery pipeline","Rollback"],"Ops Agent","RB-TTR","Automate rollback","Moves rollback from a manual runbook to an automatic step after a failed verify")),
 m_dora_rework:Object.assign({n:"Deployment rework rate",u:"%",cur:9,tgt:5,badAt:15,dir:"min",max:30},MU("Unplanned deployments (hotfixes and redeploys after a failure) ÷ all production deployments, last 30 days. The fifth DORA metric",[14,13,12.5,12,11,10.4,9.6,9],"Release manager",["Delivery pipeline"],"Release Agent","RB-RW","Reduce hotfix volume","Looks for the root cause of hotfixes in test coverage gaps")),
 m_gate_auto:Object.assign({n:"Changes approved by the gate automatically",u:"%",cur:58,tgt:70,badAt:35,dir:"max",max:100},MU("Production changes approved under a standard change template without a person ÷ all production changes, last 30 days",[22,28,34,40,46,51,55,58],"Change manager",["Delivery pipeline","Gate policy"],"Change Risk Agent","RB-GA","Propose a new standard change template","Finds repeated normal changes that always succeed and drafts a template for CAB review",true)),
 m_chg_succ:Object.assign({n:"Change success rate",u:"%",cur:92,tgt:95,badAt:85,dir:"max",max:100},MU("Changes closed with outcome successful ÷ changes closed, last 30 days, standard and normal together",[88,89,90,90,91,91,92,92],"Change manager",["Delivery pipeline","Changes"],"Change Risk Agent","RB-CS","Review failed changes","Summarizes common causes of failed changes"))});
/* map a few tabs' headline values to current data */
function syncMetrics(){const d=dora(),c=d.cur;[["m_dora_df",c.df],["m_dora_lead",c.lt],["m_dora_cfr",c.cfr],["m_dora_ttr",c.ttr],["m_dora_rework",c.rw]].forEach(a=>{if(METRICS[a[0]]&&a[1])METRICS[a[0]].cur=Math.round(a[1]*10)/10});
 const pr=RUNS().filter(r=>r.env==="Production"&&r.date>addD(TODAY,-30)&&r.out==="ok"),auto=pr.filter(r=>gateOf(r).path==="Standard");if(pr.length)METRICS.m_gate_auto.cur=Math.round(auto.length/pr.length*100)}

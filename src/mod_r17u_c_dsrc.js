/* ===== Round 17, Agent U, part C: dashboard data layer. Sources (registries), measures (formula, owner, backup), filters,
   tile computation, templates. Every tile is bound to a governed metric (METRICS) or to a registry measure defined here;
   nothing is typed in. Filters (time range, owner, portfolio) change the rows before any measure is computed. ===== */
(function(){
"use strict";
const W=window,U=W.R17U;if(!U)return;
const {G,H,usd,nf,TODAY,addDays,dd,iso}=U;
const D=U.D={};
const TD=dd(TODAY).getTime();
/* ---------------- filters ---------------- */
const RANGES=[["30d","Last 30 days"],["qtd","This quarter (Q2 FY27)"],["90d","Last 90 days"],["fytd","Fiscal year to date"],["12m","Last 12 months"],["all","All time"]];
const rangeStart=r=>({"30d":addDays(TODAY,-30),"qtd":"2026-10-01","90d":addDays(TODAY,-90),"fytd":"2026-07-01","12m":addDays(TODAY,-365),"all":null})[r]||null;
D.RANGES=RANGES;D.rangeStart=rangeStart;
D.PFS=()=>[["PR1","PR1 Standards"],["PR2","PR2 Taxonomy"],["PR3","PR3 Portal"],["PR4","PR4 Contracts"]];
const svcPf=n=>{const s=G(()=>SVCREG.find(x=>x.n===n),null);return s&&s.proj&&s.proj[0]||""};
const parseDue=s=>{const m=/([A-Z][a-z]{2}) (\d+)/.exec(s||"");if(!m)return null;const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[1]);return iso(Date.UTC(mo>=6?2026:2027,mo,+m[2]))};
/* ---------------- sources ---------------- */
/* each source: rows(F) -> normalized rows {id,t,owner,pf,date,...}; filters says which of range, owner, pf it can honor (the tile says so when it cannot) */
const SRC={
 incidents:{n:"Incidents",ent:"incident",scr:"itsm_inc",owner:"Tom Becker",backup:"Nia Brooks",filters:{range:1,owner:1,pf:1},path:"ITSMX.incidents",
  raw:()=>G(()=>ITSMX.incidents,[]).map(i=>({id:i.id,t:i.t,owner:i.own||"",pf:svcPf(i.svc),date:iso(TD-(i.age||0)*36e5),svc:i.svc,grp:i.grp,st:i.st,age:i.age||0,open:!/resolved|closed|canceled/i.test(i.st||""),go:()=>go("itsm_inc",i.id)})),dims:["svc","grp","owner","st","pf"],cols:[["id","Incident"],["t","Summary"],["owner","Owner"],["st","State"],["age","Age (h)"]]},
 changes:{n:"Changes",ent:"change_request",scr:"itsm_chg",owner:"Sam Patel",backup:"Nia Brooks",filters:{range:1,owner:1,pf:1},path:"ITSMX.changes",
  raw:()=>G(()=>ITSMX.changes,[]).map(c=>({id:c.id,t:c.t,owner:c.own||c.req||"",pf:svcPf(c.svc),date:c.start||TODAY,svc:c.svc,type:c.type,st:c.st,go:()=>go("itsm_chg",c.id)})),dims:["type","svc","st","owner","pf"],cols:[["id","Change"],["t","Summary"],["owner","Owner"],["type","Type"],["st","State"]]},
 budget:{n:"Budget lines",ent:"budget_line",scr:"bud_over",owner:"Avery Chen",backup:"Maya Ortiz",filters:{range:0,owner:1,pf:1},path:"BUDX.B().lines",
  raw:()=>G(()=>BUDX.B().lines,[]).map(l=>({id:l.id,t:l.n,owner:l.own,pf:l.p,date:null,cat:l.cat,appr:l.appr,comm:l.comm,act:l.act,fcst:l.fcst,over:l.fcst>l.appr,var:l.fcst-l.appr,go:()=>go("bud_over")})),dims:["cat","pf","owner"],cols:[["id","Line"],["t","Description"],["owner","Owner"],["appr","Approved"],["fcst","Forecast"]]},
 benefits:{n:"Benefits",ent:"benefit",scr:"bud_ben",owner:"Maya Ortiz",backup:"Priya Shah",filters:{range:0,owner:1,pf:1},path:"S.bud.ben + R17U",
  raw:()=>G(()=>BUDX.B().ben,[]).map(b=>{const t=U.toDate([b]);return {id:b.id,t:b.n,owner:U.ownerP(b)||b.own,pf:b.p,date:U.startD(b),kind:U.kindOf(b),ann:U.annual(b),plan:t.plan,real:t.real,conf:b.conf,flag:U.flagsOf(b).length>0,status:U.bStatus(b)[0],go:()=>{S.v.budb=1;go("bud_ben")}}}),dims:["owner","pf","kind","status"],cols:[["id","Benefit"],["t","Name"],["owner","Owner"],["ann","Annual"],["status","Status"]]},
 services:{n:"Services",ent:"business_service",scr:"svc_360",owner:"Sam Patel",backup:"Tom Becker",filters:{range:0,owner:1,pf:1},path:"SVCREG",
  raw:()=>G(()=>SVCREG,[]).map(s=>({id:s.id,t:s.n,owner:s.owner,pf:(s.proj||[])[0]||"",date:null,tier:s.tier,avail:s.avail,tgt:s.tgt,below:s.avail<s.tgt,cost:s.cost,users:s.users,go:()=>go("svc_360",s.id)})),dims:["tier","owner","pf"],cols:[["t","Service"],["owner","Owner"],["tier","Tier"],["avail","Availability %"],["tgt","Target %"]]},
 demand:{n:"Demand requests",ent:"demand_request",scr:"port",owner:"Maya Ortiz",backup:"Priya Shah",filters:{range:0,owner:1,pf:0},path:"DEMAND",
  raw:()=>G(()=>DEMAND,[]).map(d=>({id:d.id,t:d.n,owner:d.sp||d.who,pf:"",date:null,dept:d.who,cost:d.cost*1e3,ben:d.ben*1e3,fund:!!d.fund,st:d.fund?"Funded":"Not funded",go:()=>go("port")})),dims:["dept","owner","st"],cols:[["id","Request"],["t","Name"],["owner","Sponsor"],["cost","Cost"],["st","Funding"]]},
 agents:{n:"AI agents",ent:"agent_run",scr:"r15d_agents",owner:"Jordan Lee",backup:"Maya Ortiz",filters:{range:0,owner:1,pf:0},path:"AGENTS_STATE.rows()",
  raw:()=>G(()=>AGENTS_STATE.rows(),[]).map(a=>({id:a.id,t:a.display||a.name,owner:a.sponsor||"",pf:"",date:null,state:a.state,runs:a.runsToday||0,spend:a.spend||0,enabled:!!a.enabled,working:a.state==="working",model:a.model,go:()=>go("r15d_agents")})),dims:["state","owner","model"],cols:[["t","Agent"],["owner","Human sponsor"],["state","State"],["runs","Runs today"],["spend","Spend today"]]},
 invoices:{n:"Invoices",ent:"invoice",scr:"inv",owner:"Avery Chen",backup:"Maya Ortiz",filters:{range:1,owner:0,pf:0},path:"INVOICES",
  raw:()=>G(()=>INVOICES,[]).map(i=>({id:i.id,t:i.vendor,owner:"",pf:"",date:parseDue(i.due),vendor:i.vendor,amt:i.amt,rec:i.rec,go:()=>go("inv",i.id)})),dims:["vendor","rec"],cols:[["id","Invoice"],["t","Vendor"],["amt","Amount"],["rec","Recommendation"],["date","Due"]]},
 projects:{n:"Projects",ent:"project",scr:"ppm_proj",owner:"Maya Ortiz",backup:"Priya Shah",filters:{range:0,owner:1,pf:1},path:"PROJ",
  raw:()=>G(()=>PROJ,[]).map(p=>({id:p.id,t:p.n,owner:p.owner,pf:p.id,date:null,bac:p.bac*1e3,paid:p.paid*1e3,go:()=>go("ppm_proj",p.id)})),dims:["owner","pf"],cols:[["id","Project"],["t","Name"],["owner","Owner"],["bac","Budget at completion"],["paid","Paid"]]}};
D.SRC=SRC;
/* PR-32 B3: under a tenant other than core every source reads that tenant's rows through DATA (same normalized fields), source and
   template owners are not carried over from the core sample (a tenant names its own), the portfolio filter lists its projects and
   governed metrics come from metricOf. Under core the sources read the registries exactly as before. */
const tBen=b=>{const real=(Array.isArray(b.real)?b.real:[]).reduce((a,x)=>a+(+(x&&(x.v!=null?x.v:x.amt))||0),0),ann=+((b.drv||{}).amt)||0;return{ann,real,plan:Math.round(ann*(+b.conf||0))}};
const TRAW={
 incidents:()=>DATA.get("incidents").map(i=>({id:i.id,t:i.t,owner:i.own||"",pf:"",date:iso(TD-(+i.age||0)*36e5),svc:i.svc,grp:i.grp,st:i.st,age:+i.age||0,open:!/resolved|closed|canceled/i.test(i.st||""),go:()=>go("itsm_inc")})),
 changes:()=>DATA.get("changes").filter(c=>TREAD.partOf("changes",c)!=="cab").map(c=>({id:c.id,t:c.t,owner:c.own||c.req||"",pf:c.proj||"",date:c.start||TODAY,svc:c.svc,type:c.type,st:c.st,go:()=>go("itsm_chg")})),
 budget:()=>DATA.get("budget_lines").map(l=>({id:l.id,t:l.n,owner:l.own,pf:l.p,date:null,cat:l.cat,appr:l.appr,comm:l.comm,act:l.act,fcst:l.fcst,over:l.fcst>l.appr,var:l.fcst-l.appr,go:()=>go("tn_projects")})),
 benefits:()=>DATA.get("benefits").map(b=>{const x=tBen(b);return{id:b.id,t:b.n,owner:b.own||"",pf:b.p,date:null,kind:b.ty||"",ann:x.ann,plan:x.plan,real:x.real,conf:b.conf,flag:!b.bak||b.bak===b.own||!b.ev,status:x.real?"Recording":"Not started",go:()=>go("bud_ben")}}),
 services:()=>TREAD.rows("services","service").map(v=>({id:v.id,t:v.n,owner:v.owner,pf:(v.proj||[])[0]||"",date:null,tier:v.tier,avail:v.avail,tgt:v.tgt,below:v.avail<v.tgt,cost:v.cost,users:v.users,go:()=>go("svc_360")})),
 demand:()=>DATA.get("demand").map(d=>({id:d.id,t:d.n,owner:d.sp||d.who,pf:"",date:null,dept:d.who,cost:(+d.cost||0)*1e3,ben:(+d.ben||0)*1e3,fund:!!d.fund,st:d.fund?"Funded":"Not funded",go:()=>go("port")})),
 agents:()=>TREAD.rows("agents","agent").map(a=>({id:a.id,t:a.n,owner:a.owner||"",pf:"",date:null,state:a.st||"",runs:+a.runs||0,spend:+a.spend||0,enabled:a.st!=="off"&&a.st!=="stopped",working:a.st==="running",model:a.model||"",go:()=>go("r15d_agents")})),
 invoices:()=>DATA.get("invoices").map(i=>({id:i.id,t:i.vendor,owner:"",pf:i.p||"",date:parseDue(i.due),vendor:i.vendor,amt:i.amt,rec:i.rec,go:()=>go("tn_projects")})),
 projects:()=>DATA.get("projects").map(p=>({id:p.id,t:p.n,owner:p.owner,pf:p.id,date:null,bac:(+p.bac||0)*1e3,paid:(+p.paid||0)*1e3,go:()=>go("tn_projects")}))};
Object.keys(SRC).forEach(k=>{const s0=SRC[k],raw=s0.raw,o=s0.owner,b=s0.backup;s0.raw=()=>TREAD.core()||!TRAW[k]?raw():TRAW[k]();
 Object.defineProperty(s0,"owner",{configurable:true,enumerable:true,get(){return TREAD.core()?o:""},set(v){}});Object.defineProperty(s0,"backup",{configurable:true,enumerable:true,get(){return TREAD.core()?b:""},set(v){}})});
const _pfs=D.PFS;D.PFS=()=>TREAD.core()?_pfs():DATA.get("projects").map(p=>[p.id,p.id+" "+(p.short||p.n)]);
let MEMO={};D.clear=()=>{MEMO={}};
const fk=F=>(F.range||"")+"|"+(F.owner||"")+"|"+(F.pf||"")+(TREAD.core()?"":"|"+DATA.tenant());
function rowsOf(id,F){const k=id+"|"+fk(F);if(MEMO[k])return MEMO[k];const s=SRC[id];if(!s)return [];let r=s.raw();const st=rangeStart(F.range);
 if(F.owner&&s.filters.owner)r=r.filter(x=>x.owner===F.owner);
 if(F.pf&&s.filters.pf)r=r.filter(x=>x.pf===F.pf);
 if(st&&s.filters.range)r=r.filter(x=>!x.date||x.date>=st);
 return MEMO[k]=r}
D.rowsOf=rowsOf;
/* ---------------- measures ---------------- */
const cnt=(rs,f)=>rs.filter(f||(()=>true)).length,sm=(rs,k,f)=>rs.filter(f||(()=>true)).reduce((a,r)=>a+(+r[k]||0),0),av=(rs,k,f)=>{const a=rs.filter(f||(()=>true));return a.length?a.reduce((s,r)=>s+(+r[k]||0),0)/a.length:0};
const money=v=>usd(v),int=v=>nf(v),pct=v=>nf(v,1)+"%",hrs=v=>nf(v,1)+" h";
const M=D.M={
 inc_open:{n:"Open incidents",src:"incidents",f:"Count of incidents whose state is not resolved, closed or canceled",fmt:int,calc:r=>cnt(r,x=>x.open),where:x=>x.open,dated:1},
 inc_total:{n:"Incidents in the period",src:"incidents",f:"Count of incidents opened in the selected time range",fmt:int,calc:r=>r.length,where:()=>true,dated:1},
 inc_age:{n:"Average age of open incidents",src:"incidents",f:"Σ hours open ÷ open incidents",fmt:hrs,calc:r=>av(r,"age",x=>x.open),where:x=>x.open},
 chg_total:{n:"Changes in the period",src:"changes",f:"Count of change requests with a start date in the selected time range",fmt:int,calc:r=>r.length,where:()=>true,dated:1},
 chg_emerg:{n:"Emergency changes",src:"changes",f:"Count of changes of type Emergency",fmt:int,calc:r=>cnt(r,x=>x.type==="Emergency"),where:x=>x.type==="Emergency",dated:1},
 bud_appr:{n:"Approved budget",src:"budget",f:"Σ approved amount of budget lines",fmt:money,calc:r=>sm(r,"appr"),where:()=>true},
 bud_act:{n:"Actual spend",src:"budget",f:"Σ posted actuals of budget lines",fmt:money,calc:r=>sm(r,"act"),where:()=>true},
 bud_fcst:{n:"Forecast at completion",src:"budget",f:"Σ forecast of budget lines",fmt:money,calc:r=>sm(r,"fcst"),where:()=>true},
 bud_var:{n:"Forecast over approved",src:"budget",f:"(Σ forecast − Σ approved) ÷ Σ approved × 100",fmt:pct,calc:r=>{const a=sm(r,"appr");return a?(sm(r,"fcst")-a)/a*100:0},where:x=>x.over,tgt:0,dir:"min",bad:10},
 bud_over:{n:"Lines forecast above approval",src:"budget",f:"Count of budget lines where forecast is above approved",fmt:int,calc:r=>cnt(r,x=>x.over),where:x=>x.over},
 ben_ann:{n:"Annual benefit once running",src:"benefits",f:"Σ planned annual benefit (driver × rate or amount)",fmt:money,calc:r=>sm(r,"ann"),where:()=>true},
 ben_real:{n:"Benefit recorded to date",src:"benefits",f:"Σ recorded actuals through the current quarter",fmt:money,calc:r=>sm(r,"real"),where:()=>true},
 ben_pct:{n:"Realization",src:"benefits",f:"Σ recorded to date ÷ Σ planned to date × 100",fmt:pct,calc:r=>{const p=sm(r,"plan");return p?sm(r,"real")/p*100:100},where:()=>true,tgt:90,dir:"max",bad:75,max:120},
 ben_attn:{n:"Benefits needing attention",src:"benefits",f:"Count of benefits with a flag: owner, backup, baseline, funding line or measurement",fmt:int,calc:r=>cnt(r,x=>x.flag),where:x=>x.flag},
 svc_avail:{n:"Average service availability",src:"services",f:"Σ availability ÷ services",fmt:v=>nf(v,2)+"%",calc:r=>av(r,"avail"),where:()=>true,tgt:99.9,dir:"max",bad:99,max:100,min:98},
 svc_below:{n:"Services below target",src:"services",f:"Count of services whose availability is under its target",fmt:int,calc:r=>cnt(r,x=>x.below),where:x=>x.below},
 svc_t1:{n:"Tier 1 services",src:"services",f:"Count of services of tier 1",fmt:int,calc:r=>cnt(r,x=>x.tier==="Tier 1"),where:x=>x.tier==="Tier 1"},
 dem_n:{n:"Demand requests",src:"demand",f:"Count of demand requests",fmt:int,calc:r=>r.length,where:()=>true},
 dem_cost:{n:"Cost of unfunded demand",src:"demand",f:"Σ cost of requests that are not funded",fmt:money,calc:r=>sm(r,"cost",x=>!x.fund),where:x=>!x.fund},
 ag_n:{n:"Agents enabled",src:"agents",f:"Count of registered agents that are enabled",fmt:int,calc:r=>cnt(r,x=>x.enabled),where:x=>x.enabled},
 ag_working:{n:"Agents working now",src:"agents",f:"Count of agents whose state is working at the simulated clock",fmt:int,calc:r=>cnt(r,x=>x.working),where:x=>x.working},
 ag_runs:{n:"Agent runs today",src:"agents",f:"Σ runs today over agents",fmt:int,calc:r=>sm(r,"runs"),where:()=>true},
 ag_spend:{n:"Agent spend today",src:"agents",f:"Σ model spend today over agents",fmt:v=>"$"+nf(v,2),calc:r=>sm(r,"spend"),where:()=>true},
 inv_amt:{n:"Invoices awaiting a decision",src:"invoices",f:"Σ amount of invoices in the queue",fmt:money,calc:r=>sm(r,"amt"),where:()=>true,dated:1},
 prj_bac:{n:"Budget at completion",src:"projects",f:"Σ budget at completion of projects",fmt:money,calc:r=>sm(r,"bac"),where:()=>true},
 prj_pct:{n:"Paid against budget",src:"projects",f:"Σ paid ÷ Σ budget at completion × 100",fmt:pct,calc:r=>{const b=sm(r,"bac");return b?sm(r,"paid")/b*100:0},where:()=>true}};
Object.keys(M).forEach(k=>M[k].id=k);
const DIMN={svc:"Service",grp:"Team",owner:"Owner",st:"State",pf:"Portfolio",type:"Type",cat:"Category",kind:"Type",status:"Status",tier:"Tier",dept:"Department",state:"State",model:"Model",vendor:"Vendor",rec:"Recommendation"};
D.DIMN=DIMN;
/* ---------------- tile computation ---------------- */
const mget=id=>G(()=>typeof metricOf==="function"?metricOf(id):METRICS[id],null);
function metricOwner(id){const o=G(()=>OWNX.get("metric",id),null),m=mget(id)||{};return {owner:o&&o.ownerName||m.owner||"",backup:o&&o.backupName||""}}
function note(src,F){const s=SRC[src],a=[];if(!s)return a;
 if(F.range&&F.range!=="all"&&!s.filters.range)a.push("time range does not apply");if(F.owner&&!s.filters.owner)a.push("owner filter does not apply");if(F.pf&&!s.filters.pf)a.push("portfolio filter does not apply");return a}
D.note=note;
function metricSeries(m,F){const n={"30d":3,"qtd":3,"90d":5,"fytd":6,"12m":8,"all":8}[F.range]||8;return (m.tr||[]).slice(-n)}
function dateSeries(meas,F){const rs=rowsOf(meas.src,Object.assign({},F,{range:"all"})).filter(r=>r.date),st=rangeStart(F.range)||addDays(TODAY,-84),span=Math.max(7,Math.round((TD-dd(st).getTime())/864e5)),N=8,step=span/N,out=[];
 for(let i=0;i<N;i++){const a=addDays(TODAY,-Math.round(span-i*step)),b=addDays(TODAY,-Math.round(span-(i+1)*step));out.push(meas.calc(rs.filter(r=>r.date>a&&r.date<=b)))}return out}
/* tile -> {kind, ...} ; bind: {k:"metric",id} | {k:"measure",id,by,top} | {k:"list",src,top,where} */
function compute(t,F){const b=t.bind||{};
 if(b.k==="metric"){const m=mget(b.id);if(!m)return {err:"Metric "+b.id+" is not defined"};const own=metricOwner(b.id);
  const bad=m.dir==="min"?m.cur>=m.badAt:m.cur<=m.badAt,good=m.dir==="min"?m.cur<=m.tgt:m.cur>=m.tgt;
  return {kind:"metric",id:b.id,title:m.n,value:m.cur,disp:nf(m.cur,m.cur%1?1:0)+(m.u&&m.u!=="pts"&&m.u!=="K"?(/^[%]/.test(m.u)?m.u:" "+m.u):m.u==="%"?"%":m.u==="K"?"K":""),tgt:m.tgt,tone:good?"good":bad?"bad":"warn",series:metricSeries(m,F),max:m.max||100,src:"Metric dictionary: "+m.n,ent:"metric_definition",formula:m.f,owner:own.owner,backup:own.backup,fresh:"Metric snapshot as of "+window.U.fmtDate(window.U.todayDate(),{year:"numeric"}),notes:["time range sets the trend window; owner and portfolio do not apply to a company-wide metric"],rows:null,scr:(m.use&&m.use[0])||"metrics",unit:m.u}}
 if(b.k==="measure"){const m=M[b.id];if(!m)return {err:"Measure "+b.id+" is not defined"};const s=SRC[m.src],rs=rowsOf(m.src,F),v=m.calc(rs),ns=note(m.src,F);
  let tone="";if(m.tgt!=null){const bad=m.dir==="min"?v>=m.bad:v<=m.bad,good=m.dir==="min"?v<=m.tgt:v>=m.tgt;tone=good?"good":bad?"bad":"warn"}
  const out={kind:"measure",id:b.id,title:m.n,value:v,disp:m.fmt(v),tgt:m.tgt,tone,max:m.max||100,src:s.n+" ("+s.path+")",ent:s.ent,formula:m.f+". Filters applied before the calculation.",owner:s.owner,backup:s.backup,fresh:"Live: computed from the registry when the tile renders ("+rs.length+" rows after filters)",notes:ns,rows:rs.filter(m.where||(()=>true)),allRows:rs,srcId:m.src,scr:s.scr,unit:""};
  if(b.by&&s.dims.includes(b.by)){const g=new Map();rs.forEach(r=>{const k=String(r[b.by]==null||r[b.by]===""?"None":r[b.by]);(g.get(k)||g.set(k,[]).get(k)).push(r)});
   out.bars=[...g.entries()].map(([k,a])=>({k,v:m.calc(a),n:a.length})).filter(x=>isFinite(x.v)).sort((x,y)=>y.v-x.v).slice(0,b.top||6);out.by=b.by}
  if(m.dated)out.series=dateSeries(m,F);
  return out}
 if(b.k==="list"){const s=SRC[b.src];if(!s)return {err:"Source "+b.src+" is not defined"};let rs=rowsOf(b.src,F);
  const w=D.WHERE[b.where||""];if(w)rs=rs.filter(w[b.src]||(()=>true));
  const sk=b.sort||(b.src==="incidents"?"age":b.src==="budget"?"var":b.src==="benefits"?"ann":b.src==="agents"?"runs":b.src==="demand"?"cost":b.src==="projects"?"bac":b.src==="invoices"?"amt":null);
  if(sk)rs=rs.slice().sort((x,y)=>(+y[sk]||0)-(+x[sk]||0));
  return {kind:"list",title:s.n,srcLabel:s.n,cols:s.cols,rows:rs.slice(0,b.top||6),total:rs.length,src:s.n+" ("+s.path+")",ent:s.ent,formula:"Rows of "+s.n+(w?" where "+w.label:"")+", after the filters, largest first by "+(sk||"registry order")+".",owner:s.owner,backup:s.backup,fresh:"Live: computed from the registry when the tile renders",notes:note(b.src,F),allRows:rs,srcId:b.src,scr:s.scr}}
 return {err:"This tile has no source"}}
D.WHERE={"":null,open:{label:"open",incidents:r=>r.open,budget:r=>r.over},over:{label:"forecast above approval",budget:r=>r.over},flag:{label:"flagged",benefits:r=>r.flag},below:{label:"below target",services:r=>r.below}};
D.compute=compute;
/* ---------------- catalog for the tile form ---------------- */
D.metricOpts=()=>Object.keys(METRICS).map(k=>[k,METRICS[k].n+" ("+k+")",(METRICS[k].owner||"")]);
D.measureOpts=()=>Object.keys(M).map(k=>[k,M[k].n+" · "+SRC[M[k].src].n]);
D.dimsOf=id=>{const m=M[id];return m?SRC[m.src].dims:[]};
D.listOpts=()=>Object.keys(SRC).map(k=>[k,SRC[k].n]);
/* owners that exist across registries (humans only), for the owner filter */
D.owners=()=>{if(!TREAD.core()){const s=new Set();Object.keys(SRC).forEach(k=>{if(SRC[k].filters.owner)SRC[k].raw().forEach(r=>{if(r.owner&&TREAD.people().some(x=>x.name===r.owner&&x.kind==="human"))s.add(r.owner)})});return [...s].sort()}if(D._own)return D._own;const s=new Set();Object.keys(SRC).forEach(k=>{if(!SRC[k].filters.owner)return;SRC[k].raw().forEach(r=>{if(r.owner&&U.isHuman(r.owner))s.add(r.owner)})});return D._own=[...s].sort()};
setTimeout(()=>{D._own=null},4000);
/* ---------------- templates (each is built from live registries and metrics; a tile whose metric is missing is skipped) ---------------- */
const T=(type,bind,title,w,h)=>({type,bind,title:title||"",w:w||4,h:h||2});
const mt=(type,id,w,h,title)=>T(type,{k:"metric",id},title,w,h),ms=(type,id,w,h,by,top,title)=>T(type,{k:"measure",id,by,top},title,w,h),ls=(src,w,h,where,top,title)=>T("list",{k:"list",src,where,top},title,w,h),tb=(src,w,h,where,top,title)=>T("table",{k:"list",src,where,top},title,w,h);
const bcIds=()=>Object.keys(METRICS).filter(k=>/^m_(bc|oc)_/.test(k)).slice(0,3);
D.TEMPLATES=[
 {id:"exec",name:"Executive",persona:"exec",owner:"Casey Rowan",backup:"Maya Ortiz",desc:"Delivery, financial and operating health, benefit realization and where the forecast is over.",tiles:()=>[mt("ring","m_delivery",3,2),mt("ring","m_fin",3,2),mt("ring","m_ops",3,2),ms("card","ben_pct",3,2),mt("trend","m_burn",6,2),ms("bar","bud_fcst",6,2,"pf"),ls("demand",6,2,"",5,"Demand requests by cost"),tb("projects",6,2,"",4)]},
 {id:"svc",name:"Service desk",persona:"ops",owner:"Tom Becker",backup:"Nia Brooks",desc:"Open incidents, who holds them, service level and restore time, and emergency changes.",tiles:()=>[ms("card","inc_open",3,2),ms("card","inc_age",3,2),ms("card","chg_emerg",3,2),ms("card","svc_below",3,2),ms("bar","inc_open",6,2,"svc"),mt("trend","m_itsm_sla",6,2),ls("incidents",12,3,"open",8,"Open incidents, oldest first"),ms("bar","inc_open",6,2,"grp",6)]},
 {id:"fin",name:"Finance",persona:"fin",owner:"Avery Chen",backup:"Maya Ortiz",desc:"Approved, actual and forecast spend, lines over approval, invoices in the queue and benefit return.",tiles:()=>[ms("card","bud_appr",3,2),ms("card","bud_fcst",3,2),ms("card","bud_var",3,2),ms("card","inv_amt",3,2),ms("bar","bud_fcst",6,2,"cat"),ms("bar","bud_over",6,2,"pf"),tb("budget",12,3,"over",8,"Budget lines forecast above approval"),mt("trend","m_burn",6,2),mt("trend","m_cycle",6,2)]},
 {id:"res",name:"Resilience",persona:"",owner:"Rina Okafor",backup:"Sam Patel",desc:"Service availability against target, Tier 1 coverage and continuity metrics.",tiles:()=>[ms("card","svc_avail",3,2),ms("card","svc_below",3,2),ms("card","svc_t1",3,2),mt("ring","m_avail",3,2)].concat(bcIds().map(id=>mt("card",id,4,2))).concat([ms("bar","svc_avail",6,2,"tier"),tb("services",6,3,"below",8,"Services below target"),mt("trend","m_dora_ttr",6,2)])},
 {id:"ag",name:"AI agents",persona:"",owner:"Jordan Lee",backup:"Maya Ortiz",desc:"Agents enabled and working, runs and spend today, and the human sponsor behind each agent.",tiles:()=>[ms("card","ag_n",3,2),ms("card","ag_working",3,2),ms("card","ag_runs",3,2),ms("card","ag_spend",3,2),ms("bar","ag_runs",6,2,"owner",8,"Runs today by human sponsor"),ms("bar","ag_runs",6,2,"state",6,"Runs today by state"),tb("agents",12,3,"",8,"Agents by runs today"),mt("ring","m_guard",3,2),mt("trend","m_aispend",9,2)]},
 {id:"del",name:"Delivery",persona:"pm",owner:"Priya Shah",backup:"Dev Rao",desc:"Project budget use, schedule performance, change volume and the benefits each project must deliver.",tiles:()=>[ms("card","prj_pct",3,2),ms("card","prj_bac",3,2),ms("card","ben_ann",3,2),ms("card","ben_attn",3,2),mt("trend","m_spi",6,2),mt("trend","m_mshit",6,2),ms("bar","chg_total",6,2,"svc",6),ms("bar","ben_ann",6,2,"pf"),tb("benefits",12,3,"flag",8,"Benefits needing attention")]}];
D.tileObj=(x,i)=>Object.assign({id:"t"+(i+1)},x);
D.TEMPLATES.forEach(t=>{const o=t.owner,b=t.backup;Object.defineProperty(t,"owner",{configurable:true,enumerable:true,get(){return TREAD.core()?o:""},set(v){}});Object.defineProperty(t,"backup",{configurable:true,enumerable:true,get(){return TREAD.core()?b:""},set(v){}})});
D.build=tpl=>tpl.tiles().filter(t=>t.bind.k!=="metric"||mget(t.bind.id)).map(D.tileObj);
/* a tile with an owner (human), a formula and a source is "governed" */
D.governed=t=>{const c=compute(t,{range:"all",owner:"",pf:""});return !c.err&&!!c.owner&&!!c.formula&&!!c.src};
})();

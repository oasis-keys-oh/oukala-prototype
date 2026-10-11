/* mod_zsearch.js (Round 14, Agent D): complete search. Typed result groups with counts and expanders,
   family chips, ranking (exact title > id > alias > body), synonyms, highlight, preview with key fields,
   record openers that select the record, extra providers, and a coverage metric on the search settings screen.
   Plugs into mod_nav.js through NAVX.ext {sources, refresh, preview, studioTop} and NAVX.int. */
(function(){
const W=window;
const NI=()=>W.NAVX&&NAVX.int;
const G=f=>{try{return f()}catch(e){return undefined}};
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>String(s==null?"":s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const FAMS=[["all","All"],["money","Money"],["work","Work"],["service","Service"],["people","People"],["know","Knowledge"],["gov","Governance"],["data","Data"],["process","Process"],["metric","Metrics"],["screen","Screens"],["action","Actions"]];
const FAMNAME={money:"Money and contracts",work:"Projects and delivery",service:"Service and operations",people:"People and organization",know:"Knowledge",gov:"Governance and meetings",data:"Data and integration",process:"Processes",metric:"Metrics",screen:"Screens",action:"Actions",other:"Other"};
const PRI=new Set(["Budget lines","Purchase orders","Invoices","Vendors","Contracts","Incidents","Changes","Problems","Projects","Risks","Demand requests","Meetings","Policies","Knowledge articles","People","Service requests","Configuration items","Services"]);
const PRIOR={money:60,work:60,service:60,people:50,gov:50,know:45,process:20,screen:12,metric:10,data:0,action:5,other:0};
const FAMORD=["money","work","service","people","gov","know","process","data","metric","screen","action","other"];
/* raw group -> label | family | aliases (aliases make a group findable by what people call it) */
const GT=`budget line|Budget lines|money|budget cost spend funding line item allocation approved
budget lines|Budget lines|money|budget cost spend funding line item allocation approved
budget requests|Budget requests|money|budget request funding request ask intake new money
purchase orders|Purchase orders|money|po purchase order procurement order commitment
invoice|Invoices|money|invoice bill ap payable payment pay
invoices|Invoices|money|invoice bill ap payable payment pay
contract|Contracts|money|contract agreement sow msa renewal terms
contracts|Contracts|money|contract agreement sow msa renewal terms
vendors|Vendors|money|vendor supplier provider partner scorecard
reserve entries|Reserve entries|money|reserve contingency management reserve draw release budget
cost centers|Cost centers|money|cost center department budget owner finance
approval authority|Approval authority|money|delegation of authority doa approve limit threshold budget
benefits|Benefits|money|benefit value realization roi savings
contract changes|Contract changes|money|contract change order amendment sow
agreements|Agreements|money|sla ola agreement service level underpinning
terms playbook|Contract terms|money|clause contract terms playbook negotiation
licensing|License meters|money|license subscription quota meter cost
licenses|Licenses|money|license subscription seat renewal cost
scaling steps|Scaling steps|money|capacity scaling cost step
consumers|Cost consumers|money|showback chargeback cost allocation consumer tbm
finance|Finance|money|finance budget funding reserve color money forecast cost
objective|Strategic objectives|work|objective strategy okr goal
strategy|Strategic objectives|work|objective strategy okr goal
portfolio|Portfolios|work|portfolio program investment
project|Projects|work|project program delivery
projects|Projects|work|project program delivery
wbs lines|WBS lines|work|task wbs milestone work breakdown plan schedule
demand|Demand requests|work|demand request idea intake proposal
raid log|RAID log|work|raid risk issue assumption dependency
risk|Risks|work|risk register raid threat
risks|Risks|work|risk register raid threat
stories|Stories|work|story user story backlog sprint task
features|Features|work|feature epic backlog
epics|Epics|work|epic initiative backlog
increments|Increments|work|increment pi program increment release train
teams|Agile teams|work|team squad scrum train
releases|Releases|work|release package deploy version
pipeline runs|Pipeline runs|work|pipeline build deploy ci cd run
modules in flight|Modules in flight|work|module build idea blueprint
applications|Applications|work|application app system portfolio
scenarios|Scenarios|work|scenario what if plan
executive|Executive views|work|executive board dashboard
resource requests|Resource requests|work|resource request capacity staffing fte headcount hire
citizen apps|Citizen apps|work|citizen app low code app
debt items|Debt items|work|debt waiver technical debt
feature contract|Contract rules|work|feature contract rule
incident|Incidents|service|incident outage broken down ticket
incidents|Incidents|service|incident outage broken down ticket inc
major incident|Major incidents|service|major incident war room outage
incident priority|Priority policy|service|incident priority impact urgency
problems|Problems|service|problem root cause rca prb
known errors|Known errors|service|known error workaround ke
changes|Changes|service|change chg cab release request
change templates|Change templates|service|change template standard change
change freezes|Change freezes|service|change freeze blackout window
approval policies|Change approval rules|service|approval policy change cab rule
requests|Service requests|service|request ritm ticket order catalog
service catalog|Service catalog|service|catalog request order laptop access software
service offerings|Service offerings|service|offering service catalog price
services|Services|service|service business service tier
service|Services|service|service business service tier
configuration items|Configuration items|service|ci cmdb configuration item asset server
configuration item|Configuration items|service|ci cmdb configuration item
assets|Hardware assets|service|asset laptop hardware device warranty
alerts|Alerts|service|alert event monitoring
alert rules|Alert rules|service|alert rule threshold monitoring
automation rules|Automation rules|service|automation rule remediation auto
standard changes and runbooks|Runbooks|service|runbook sop standard change procedure
slos|SLOs|service|slo service level objective availability
dashboards|Dashboards|service|dashboard observability tiles
synthetic checks|Synthetic checks|service|synthetic check probe monitoring uptime
operations|Operations views|service|operations cmdb discovery
notification templates|Notification templates|service|notification template message email
on-call rotas|On-call rotas|service|on call rota pager schedule rotation
people|People|people|person employee staff colleague
ai agents|AI agents|people|agent ai bot automation
contractors|Contractors|people|contractor vendor staff
providers|Providers|people|provider msp vendor
people and teams|Org and team views|people|org chart team reporting
ownership and gaps|Ownership by domain|people|owner ownership accountable domain backup raci
accountability domains|Accountability domains|people|owner ownership accountable domain responsible who owns
org teams|Teams|people|team department unit group
security|Access and security|people|access permission security role
who can see this|Visibility|people|permission access visibility classification
skills|Skills|people|skill expertise qualified
rooms|Rooms|people|room booking meeting space
courses|Courses|people|course training learning
goals|Goals|people|goal performance okr review
approvals|Approvals|people|approval approve pending decision sign off
inbox|Inbox items|people|inbox needs you task action pending
forums|Forums|gov|forum committee board series meeting
meeting|Meetings|gov|meeting minutes agenda
meetings|Meetings|gov|meeting minutes agenda
meeting actions|Meeting actions|gov|action item follow up task meeting
meeting decisions|Meeting decisions|gov|decision meeting minutes resolution
decisions|Decisions|gov|decision log resolution
policy|Policies|gov|policy rule standard
control|Controls|gov|control audit compliance
compliance|Controls|gov|control audit compliance soc iso
assessments|Assessments|gov|assessment questionnaire risk review
maturity models|Maturity models|gov|maturity model capability level
capabilities|Capabilities|gov|capability maturity level
decision rules|Decision rules|gov|decision rule dmn table
ai gateway|AI models|gov|ai model gateway llm guardrail
knowledge|Knowledge articles|know|article kb how to guide
knowledge articles|Knowledge articles|know|article kb how to guide
knowledge items|Knowledge items|know|article runbook kb guide
prompts|Prompts|know|prompt ai template
ai test suites|AI test suites|know|test suite ai evaluation
agent skills|Agent skills|know|skill agent ability
standard|Standards|know|standard reference
paragraph|Standard paragraphs|know|paragraph clause
procedure|Procedures|know|procedure sop steps
configuration item (knowledge)|Knowledge CIs|know|ci
data element|Data elements|know|data element field
report|Reports|know|report
source file|Source files|know|file document source
chat threads|Chat threads|know|chat thread conversation
data entity|Data entities|data|entity table data model schema
data entities|Data entities|data|entity table data model schema
data:field|Fields|data|field column attribute data model
data model tables|Data model tables|data|table data model schema
proposed entities|Proposed entities|data|proposed entity data model
data connections|Data connections|data|data connection reader writer lineage integration
integration fabric|Integrations|data|integration connector api sync
data model coverage|Data model coverage|data|coverage data model
data model gaps|Data model gaps|data|gap data model
chart data sources|Chart data sources|data|chart data source dataset
metric calculations|Metric calculations|data|metric calculation lineage formula
visuals|Visuals|data|chart visual graph
chart types|Chart types|data|chart type graph
process|Processes|process|process procedure flow steps sop
draw a process|Process drawings|process|process draw diagram bpmn
workflows|Workflows|process|workflow automation flow
process areas|Process areas|process|process area flow
journeys|Journeys|process|journey map experience
decision points|Decision points|process|decision point gate approval step
actions|Actions|action|action do create new
platform|Platform tools|action|platform chat agent tool
automation|Automation views|action|automation rule
admin|Admin|action|admin setting studio
order guides|Order guides|service|order guide bundle new hire onboarding request
orders|Orders|service|order guide order request
chat tools|Chat tools|action|chat tool ask agent
agent tools|Agent tools|action|agent tool
mcp tools|MCP tools|action|mcp tool integration
funding colors|Funding colors|money|color of money fund restricted unrestricted grant donor
funding gates|Funding gates|money|funding gate stage g0 g1 g2 g3 g4 g5 approval project funding
finance exceptions|Finance exceptions|money|exception unfunded mismatch variance mapping violation
allocation drivers|Allocation drivers|money|allocation driver showback headcount usage
finance evidence|Finance evidence|money|evidence source
finance decisions|Finance decisions|money|decision open
finance risks|Finance risks|money|risk
forecast entries|Forecast entries|money|forecast projection reforecast variance budget
audit events|Audit events|gov|audit trail log event action history
allocations|Allocations|people|allocation capacity fte team workload
agenda items|Agenda items|gov|agenda item meeting topic
meeting minutes|Meeting minutes|gov|minutes notes meeting published`;
const GMAP={};GT.split("\n").forEach(l=>{const p=l.split("|");GMAP[p[0]]=[p[1],p[2],p[3]]});
const FAMOF=(label)=>{for(const k in GMAP){if(GMAP[k][0]===label)return GMAP[k][1]}return"other"};
const ALIASOF={};Object.keys(GMAP).forEach(k=>{const v=GMAP[k];ALIASOF[v[0]]=((ALIASOF[v[0]]||"")+" "+v[2]).trim()});
/* synonyms: a query word also matches these (one way) */
const SY={cost:["budget"],costs:["budget"],spend:["budget"],spending:["budget"],funding:["budget"],fund:["budget"],money:["budget"],financial:["budget"],
 po:["purchase order"],pos:["purchase order"],"purchase":["po"],inv:["invoice"],ap:["invoice"],bill:["invoice"],bills:["invoice"],supplier:["vendor"],suppliers:["vendor"],
 inc:["incident"],chg:["change"],prb:["problem"],ritm:["request"],req:["request"],reqs:["request"],ticket:["incident","request"],tickets:["incident","request"],
 kb:["knowledge","article"],ci:["configuration item"],cis:["configuration item"],cmdb:["configuration item"],sow:["statement of work","contract"],msa:["contract"],
 raid:["risk"],risk:["raid"],sla:["agreement","service level"],ola:["agreement"],okr:["objective"],okrs:["objective"],
 laptop:["asset","hardware"],device:["asset"],onboarding:["onboard","new hire","joiner"],joiner:["onboarding"],leaver:["offboarding"],
 owner:["own","owns"],owns:["owner","own"],contingency:["reserve"],reserve:["contingency"],approve:["approval"],approval:["approve"],approvals:["approve"],
 runbook:["standard change","sop"],sop:["runbook"],outage:["incident"],broken:["incident"],slow:["incident"],agent:["ai"],agents:["ai"],
 task:["wbs","story"],tasks:["wbs","story"],milestone:["wbs"],policy:["policies"],policies:["policy"],decision:["decide"],forecast:["projection"],
 fiscal:["fy"],timesheet:["allocation","capacity"],timesheets:["allocation","capacity"],person:["people"],staff:["people"],employee:["people"],team:["teams"],domain:["domains"],hr:["people"],hire:["onboarding"]};
const q1=(s,r)=>(r||document).querySelector(s),qa=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));

/* ---------- classification of an index item ---------- */
let KIND=null;
function kindOf(name){if(!KIND){KIND={};(G(()=>DIR)||[]).forEach(d=>{KIND[d.name]=d.kind})}return KIND[name]}
function zinfo(it){if(it._z)return it._z;
 let raw=it.g||"",lab,fam;
 if(!raw){if(it.ty==="screen"){lab="Screens";fam="screen"}
  else if(it.ty==="action"){lab="Actions";fam="action"}
  else if(it.ty==="metric"){lab="Metrics";fam="metric"}
  else if(it.ty==="person"){const k=kindOf(it.t);lab=k==="ai"?"AI agents":k==="contractor"?"Contractors":k==="msp"?"Providers":"People";fam="people"}
  else if(it.ty==="process"){lab="Processes";fam="process"}
  else if(it.ty==="data"){lab=/^Field/.test(it.m)?"Fields":"Data entities";fam="data"}
  else{raw=String(it.m||"").split(" · ")[0]}}
 if(!lab&&(raw||"").toLowerCase()==="finance"){const p1=String(it.m||"").split(" · ")[1]||"";const FM={"Screen":["Screens","screen"],"Color of money":["Funding colors","money"],"Funding gate":["Funding gates","money"],"Exception":["Finance exceptions","money"],"Allocation driver":["Allocation drivers","money"],"Decision":["Finance decisions","money"],"Risk":["Finance risks","money"],"Budget line":["Budget lines","money"]};const fm=FM[p1]||(/^Funding gate/.test(p1)?FM["Funding gate"]:null)||(/^(V-|VENDOR|INFERENCE|ASSUMPTION)/.test(p1)?["Finance evidence","money"]:["Finance","money"]);lab=fm[0];fam=fm[1]}
 if(!lab){const key=(raw||"").toLowerCase();const g=GMAP[key]||(it.ty==="knowledge"&&GMAP[key+" (knowledge)"]);
  if(g){lab=g[0];fam=g[1]}else{lab=raw||"Records";fam=it.ty==="knowledge"?"know":it.ty==="data"?"data":it.ty==="process"?"process":"other"}}
 const al=" "+norm(ALIASOF[lab]||"")+" ";
 const tl=" "+norm(it.t)+" ";
 const hb=" "+norm((it.m||"")+" "+(it.k||"")+" "+(it.ac||"")).slice(0,900)+" ";
 const id=String(it.t).split(" ")[0].toLowerCase();
 return(it._z={lab,fam,al,tl,hb,id,gk:lab.toLowerCase()})}

/* ---------- query -> tokens with alternatives ---------- */
function parseQuery(raw){let q=String(raw||"").trim(),scope=null,owner=null;
 let m=q.match(/^in:\s*([a-z]+)\s*(.*)$/i)||q.match(/^(.*?)\s+in:\s*([a-z]+)$/i);
 if(m){const first=/^in:/i.test(q);const key=(first?m[1]:m[2]).toLowerCase(),rest=first?m[2]:m[1];const fm=FAMALIAS[key];if(fm){scope=fm;q=rest}}
 const om=q.match(/^(?:who\s+(?:owns|is\s+responsible\s+for|runs|manages|is\s+accountable\s+for|looks\s+after)|who\s+is\s+the\s+owner\s+of|owner\s+of|owners?\s+for)\s+(?:the\s+)?(.+)$/i);
 if(om){owner=om[1].trim();q=owner}
 return{q,scope,owner}}
const FAMALIAS={money:"money",budget:"money",budgets:"money",finance:"money",contracts:"money",work:"work",projects:"work",delivery:"work",service:"service",tickets:"service",ops:"service",people:"people",person:"people",users:"people",agents:"people",team:"people",teams:"people",know:"know",knowledge:"know",kb:"know",gov:"gov",governance:"gov",meetings:"gov",data:"data",entity:"data",entities:"data",field:"data",fields:"data",table:"data",tables:"data",process:"process",processes:"process",flow:"process",metric:"metric",metrics:"metric",kpi:"metric",screen:"screen",screens:"screen",module:"screen",modules:"screen",action:"action",actions:"action",record:"all",records:"all",all:"all"};
function tokenize(q){const ni=NI();const base=ni.toks(q,false).map(norm).join(" ").split(" ").filter(Boolean);const out=[];
 base.forEach(t=>{const alts=[{a:t,syn:false}];ni.alts(t).forEach(x=>{const n=norm(x);if(n&&n!==t)alts.push({a:n,syn:/\s/.test(n)||!!(SY[t]&&SY[t].indexOf(x)>=0)||x!==t&&t.indexOf(x)!==0&&x.indexOf(t)!==0})});if(/[^aeiou]y$/.test(t)&&t.length>3)alts.push({a:t.slice(0,-1)+"ies",syn:false});(SY[t]||[]).forEach(x=>{if(!alts.some(y=>y.a===x))alts.push({a:norm(x),syn:true})});out.push({t,alts})});
 return out}

/* ---------- scoring ---------- */
function scoreIt(it,T,qn,P){const z=zinfo(it);let sc=0;
 for(let i=0;i<T.length;i++){let best=0;const al=T[i].alts;
  for(let j=0;j<al.length;j++){const a=al[j].a,pen=al[j].syn?5:0,short=a.length<=2;let s=0;
   const sp=" "+a;let p=z.tl.indexOf(sp);
   if(p>=0&&(!short||z.tl.indexOf(sp+" ")>=0))s=p===0?38:30;
   else if(!short&&a.length>=3&&z.tl.indexOf(a)>=0)s=14;
   if(s<18&&z.al.indexOf(sp)>=0&&(!short||z.al.indexOf(sp+" ")>=0))s=Math.max(s,18);
   if(s<9){p=z.hb.indexOf(sp);if(p>=0&&(!short||z.hb.indexOf(sp+" ")>=0))s=Math.max(s,9);else if(a.length>=4&&z.hb.indexOf(a)>=0)s=Math.max(s,5)}
   s-=s?pen:0;if(s>best)best=s}
  if(!best)return 0;sc+=best}
 const tn=z.tl.trim();
 if(tn===qn)sc+=1000;
 else if(/\d/.test(qn)&&(qn===norm(z.id)||qn===norm((it.key||"").slice((it.key||"").indexOf(":")+1))))sc+=900;
 else if(tn.indexOf(qn)===0)sc+=120;else if(tn.indexOf(qn)>0&&(" "+tn).indexOf(" "+qn)>=0)sc+=70;
 if(z.al.indexOf(" "+qn+" ")>=0||ALIASOF[z.lab]&&norm(ALIASOF[z.lab]).indexOf(qn)===0)sc+=30;
 if(z.lab.toLowerCase().indexOf(qn)===0)sc+=40;
 sc-=Math.min(14,it.t.length/12);
 const bs=P.hs.get(it.key)||P.hs.get(it.tl);if(bs)sc+=10+bs*.4;if(P.fav.has(it.key)||P.fav.has(it.tl))sc+=30;
 return sc}

function search(raw,opt){opt=opt||{};const ni=NI();const t0=performance.now();const pq=parseQuery(raw);const out={raw,q:pq.q,scope:pq.scope,owner:pq.owner,groups:[],fams:{},total:0,fixed:null,ms:0,T:[]};
 const qn=norm(pq.q);if(!qn)return out;let T=tokenize(pq.q);if(!T.length)return out;out.T=T;
 const P=ni.pref();const items=ni.IDX.items,N=items.length;const gm={};
 const run=(T2,pen)=>{for(let i=0;i<N;i++){const it=items[i];const s=scoreIt(it,T2,qn,P);if(s>0){const z=zinfo(it);let g=gm[z.lab];if(!g)g=gm[z.lab]={lab:z.lab,fam:z.fam,n:0,items:[],best:0};g.n++;const v=s-pen;g.items.push({it,sc:v});if(v>g.best)g.best=v;if(g.items.length>600){g.items.sort((a,b)=>b.sc-a.sc);g.items.length=300}}}};
 run(T,0);let total=0;for(const k in gm)total+=gm[k].n;
 if(total<5){const T2=T.map(x=>{const f=ni.fixTok(x.t);if(f&&f!==x.t){const a=tokenize(f)[0];return a||x}return x});if(T2.some((x,i)=>x!==T[i])){for(const k in gm)delete gm[k];run(T2,22);out.fixed=T2.map(x=>x.t).join(" ");out.T=T2;total=0;for(const k in gm)total+=gm[k].n;if(!total)out.fixed=null}}
 const arr=Object.keys(gm).map(k=>gm[k]);arr.forEach(g=>g.items.sort((a,b)=>b.sc-a.sc));
 arr.forEach(g=>{const al=norm(ALIASOF[g.lab]||"");const intent=PRIOR[g.fam]>=40&&(g.lab.toLowerCase().split(" ").some(w=>w.indexOf(qn)===0)||(" "+al+" ").indexOf(" "+qn+" ")>=0||(" "+al+" ").indexOf(" "+qn)>=0&&qn.length>=4);g.rank=Math.min(g.best,140)+(PRIOR[g.fam]||0)+(intent?300:0)+(intent&&PRI.has(g.lab)?70:0)+Math.min(20,Math.log2(g.n+1)*4)});
 arr.sort((a,b)=>b.rank-a.rank||FAMORD.indexOf(a.fam)-FAMORD.indexOf(b.fam));
 out.groups=arr;out.total=total;arr.forEach(g=>{out.fams[g.fam]=(out.fams[g.fam]||0)+g.n});
 /* owners of a domain: "who owns budget" */
 if(pq.owner&&W.ORGX&&ORGX.byDomain){const d=G(()=>ORGX.byDomain(pq.owner));if(d&&d.owner){const rows=[];const mk=(p,role)=>{if(!p||!p.name)return;const it=ni.mkItem("person",p.name,"Owner of "+d.label+" · "+(p.title||"")+(role?" · "+role:""),"--p4",()=>G(()=>person360(p.name)),(d.aliases||[]).join(" "),"person:"+p.name,{g:"Owners"});it._z={lab:"Owners",fam:"people",al:" ",tl:" "+norm(p.name)+" ",hb:" ",id:"",gk:"owners"};rows.push({it,sc:5000})};
   mk(d.owner,"owner");if(d.backup&&d.backup.name)mk(d.backup,"backup");
   if(rows.length){const g={lab:"Owners",fam:"people",n:rows.length,items:rows,best:5000};out.groups.unshift(g);out.fams.people=(out.fams.people||0)+rows.length;out.total+=rows.length;out.ownerDomain=d}}}
 out.ms=Math.round((performance.now()-t0)*10)/10;ni.IDX.lastMs=out.ms;return out}

/* ---------- row model, openers, display bits ---------- */
const STATUS=/^(open|closed|done|approved|pending|published|draft|live|on|off|active|retired|in progress|in test|in review|investigating|resolved|new|hold|held|rejected|declined|submitted|deferred|paused|running|sev \d|p[1-4]|awaiting approval|fulfilling|deployed|certified|sandbox|updating|online|idea|blueprint|emergency|normal|standard|mitigating|scoring|funding decision|invoice ahead of receipt)\b/i;
const MONEY=/\$[\d,.]+[KMB]?(?: [a-z]+)?/;
function parts(it){const z=zinfo(it);let p=String(it.m||"").split(" · ");if(p.length&&(p[0]===it.g||p[0]===z.lab||GMAP[p[0].toLowerCase()]&&GMAP[p[0].toLowerCase()][0]===z.lab))p=p.slice(1);return p.filter(Boolean)}
function bits(it){const p=parts(it);let status="",amount="";const rest=[];p.forEach(x=>{const m=x.match(MONEY);if(m&&!amount)amount=m[0].replace(/ (approved|a year)$/i,x=>x);else if(!status&&STATUS.test(x))status=x;else rest.push(x)});return{status,amount,sub:rest.join(" · ")}}
function openerFor(it){const z=zinfo(it);const id=String(it.t).split(" ")[0];const b=W.BUDX;
 try{
  if(z.lab==="Purchase orders"&&W.BD&&/^PO-/.test(id))return()=>{go("bud_ven");S.v.budx=4;setTimeout(()=>BD.open("po",id,{reset:true}),90)};
  if(z.lab==="Reserve entries"&&W.BD)return()=>{go("bud_over");S.v.budv=4;setTimeout(()=>BD.open("led",id,{reset:true}),90)};
  if(z.lab==="Cost centers"&&W.BD&&it.zid)return()=>{go("bud_over");setTimeout(()=>BD.open("dept",it.zid,{reset:true}),90)};
  if(z.lab==="Contracts"&&W.BD&&/^CT-/.test(id))return()=>{go("bud_ven");S.v.budx=1;setTimeout(()=>BD.open("ct",id,{reset:true}),90)};
  if(z.lab==="Vendors"&&W.BD&&b){const v=b.B().vend.find(x=>x.n===it.t);if(v)return()=>{go("bud_ven");S.v.budx=0;setTimeout(()=>BD.open("vend",v.id,{reset:true}),90)}}
 }catch(e){}
 return it.f}

/* ---------- state for the palette ---------- */
const ZX={open:{},groups:{},lastRes:null};
function chipsHTML(res,scope){const ni=NI();const cnt=res?res.fams:null;const gs=/^g:/.test(scope)?scope.slice(2):null;
 let h=FAMS.map(f=>{const n=f[0]==="all"?(res?res.total:null):(cnt?cnt[f[0]]||0:null);const off=res&&n===0&&f[0]!=="all";return`<button type="button" class="chip nx-chip zs-chip${off?" zs-off":""}" data-nx-scope="${f[0]}" aria-pressed="${f[0]===scope}">${f[1]}<em>${n==null||n===0?"":n>999?"999+":n}</em></button>`}).join("");
 if(gs)h+=`<button type="button" class="chip nx-chip zs-chip zs-gpill" data-nx-scope="all" aria-pressed="true" title="Clear this filter">${E(gs)} <b aria-hidden="true">×</b></button>`;
 return h}
function syncScopes(){const ni=NI();const S2=ni.SCOPES;S2.length=0;FAMS.forEach(f=>S2.push([f[0],f[1]]))}
const mark2=(txt,terms)=>{let s=String(txt);if(!terms.length)return E(s);const low=s.toLowerCase();const sp=[];terms.forEach(t=>{if(t.length<2)return;let from=0,p;while((p=low.indexOf(t,from))>=0&&sp.length<12){sp.push([p,p+t.length]);from=p+t.length;if(sp.length>=12)break}});
 if(!sp.length)return E(s);sp.sort((a,b)=>a[0]-b[0]);let o="",pos=0;sp.forEach(x=>{if(x[0]<pos)return;o+=E(s.slice(pos,x[0]))+"<mark>"+E(s.slice(x[0],x[1]))+"</mark>";pos=x[1]});return o+E(s.slice(pos))};
function termsOf(res){const t=[];res.T.forEach(x=>x.alts.forEach(a=>{if(!a.syn&&a.a.length>=2&&t.indexOf(a.a)<0)t.push(a.a)}));return t.sort((a,b)=>b.length-a.length)}
function rowHTML(r,i,terms){const ni=NI();const it=r.it;const z=zinfo(it);const b=bits(it);
 const ic=it.ty==="screen"&&it.sid&&ni.screenRow(it.sid)?IC(ni.screenRow(it.sid)[2]):ni.SVG(ni.TYICO[it.ty]||ni.ICO.doc,18,1.8);
 const fav=r.fav?`<span class="nx-ofav" title="Favorite">${ni.SVG(ni.ICO.star,13,1.8)}</span>`:"";
 const sub=b.sub||(it.ty==="person"?"":z.lab);
 return`<li role="option" id="nxo${i}" class="nx-opt zs-opt" data-nx-i="${i}" data-ty="${it.ty}" data-zs-g="${E(z.lab)}" aria-selected="${i===ni.PAL.sel}"><span class="nx-oi" style="--c:var(${it.c||ni.TYCOL[it.ty]||"--accent"})">${ic}</span><span class="nx-otx"><b>${mark2(it.t,terms)}</b><small>${mark2(sub,terms)}</small></span>${fav}<span class="zs-meta">${b.status?`<span class="zs-st">${E(b.status)}</span>`:""}${b.amount?`<span class="zs-amt num">${E(b.amount)}</span>`:""}</span></li>`}

function refresh(soft){const ni=NI();const PAL=ni.PAL;const ul=q1("#nxPalList");if(!ul)return false;syncScopes();
 const chipBox=q1("#nxPal .nx-chips");const raw=PAL.q;
 if(!raw.trim()||(PAL.describe&&(PAL.scope==="screen"||PAL.scope==="all"))){if(chipBox&&!PAL.describe){chipBox.innerHTML=chipsHTML(null,PAL.scope)}return false}
 if(PAL.describe&&PAL.scope!=="screen"&&PAL.scope!=="all")PAL.describe=false;const pq0=parseQuery(raw);let scope=PAL.scope;if(pq0.scope&&scope==="all")scope=pq0.scope;
 const res=search(raw,{});ZX.lastRes=res;PAL.res={q:res.q,scope:"all",tokens:res.T.map(x=>x.t),by:{},total:res.total,fixed:res.fixed,ms:res.ms,counts:{}};
 const P=ni.pref();const terms=termsOf(res);const nav=[];let h="";
 if(chipBox)chipBox.innerHTML=chipsHTML(res,scope);
 let gs=res.groups;
 if(/^g:/.test(scope))gs=gs.filter(g=>g.lab===scope.slice(2));else if(scope!=="all")gs=gs.filter(g=>g.fam===scope);
 const single=/^g:/.test(scope);const famMode=scope!=="all"&&!single;
 const MAXG=scope==="all"?8:99;const showAllGroups=!!ZX.open.__groups;
 gs.forEach((g,gi)=>{if(scope==="all"&&gi>=MAXG&&!showAllGroups)return;
  const exp=ZX.groups[g.lab]||0;let lim=single?50+exp:famMode?(exp?g.n:5):(exp?Math.min(g.n,100):(gi<2?4:3));lim=Math.min(lim,g.items.length);
  const more=g.n>lim;
  h+=`<li class="nx-grp eyebrow zs-grp" role="presentation" data-fam="${g.fam}"><span class="zs-gname">${E(g.lab)}</span><em>${g.n.toLocaleString("en-US")}</em>${!single&&g.n>lim?`<button type="button" class="nx-seeall" data-zs-all="${E(g.lab)}">Show all ${g.n.toLocaleString("en-US")}</button>`:""}${!single&&exp&&g.n<=lim?`<button type="button" class="nx-seeall" data-zs-fewer="${E(g.lab)}">Show fewer</button>`:""}${scope==="all"&&g.n>3&&!exp?`<button type="button" class="nx-seeall" data-nx-scope="g:${E(g.lab)}">Only this type</button>`:""}</li>`;
  g.items.slice(0,lim).forEach(x=>{const it=x.it;const row={ty:it.ty,t:it.t,m:it.m,c:it.c,f:openerFor(it),key:it.key,sid:it.sid,src:"search",fav:P.fav.has(it.key)||P.fav.has(it.tl),sc:Math.round(x.sc),k:it.k,g:it.g,it};const i=nav.length;nav.push(row);h+=rowHTML(row,i,terms)});
  if(single&&g.n>lim)h+=`<li class="nx-moreli" role="presentation"><button type="button" class="btn quiet" data-zs-more="${E(g.lab)}">Show 25 more of ${g.n.toLocaleString("en-US")}</button></li>`});
 if(scope==="all"&&gs.length>MAXG&&!showAllGroups)h+=`<li class="nx-moreli" role="presentation"><button type="button" class="btn quiet" data-zs-groups>Show ${gs.length-MAXG} more result types</button></li>`;
 if(scope==="all"&&showAllGroups&&gs.length>MAXG)h+=`<li class="nx-moreli" role="presentation"><button type="button" class="btn quiet" data-zs-groups>Show fewer result types</button></li>`;
 const i=nav.length;nav.push({ty:"ask",t:"Ask Oukala: "+raw.trim(),m:"Ctrl+Enter from anywhere in this list",f:()=>ni.askFrom(raw)});
 h+=`<li class="nx-grp eyebrow" role="presentation">Not what you meant?</li><li role="option" id="nxo${i}" class="nx-opt nx-ask" data-nx-i="${i}" data-ty="ask" aria-selected="${i===PAL.sel}"><span class="nx-oi" style="--c:var(--accent)">${ni.SVG(ni.ICO.ai,18,1.8)}</span><span class="nx-otx"><b>Ask Oukala: ${E(raw.trim())}</b><small>Get an answer in chat instead of a list</small></span><em class="nx-obadge">Ctrl ↵</em></li>`;
 const zero=!gs.length&&!(ni.IDX.building&&!ni.IDX.built);
 if(zero){PAL.zero=true;const alt=suggest(res);h=`<li class="nx-zero" role="presentation"><b>No match for “${E(raw.trim())}”${scope!=="all"?" in this type":""}.</b><span>${scope!=="all"?"Try All types, fewer words, or ask Oukala.":"Try fewer words, another spelling, or ask Oukala. Press Enter to ask."}</span>${alt.length?`<span class="zs-sugg">Try: ${alt.map(a=>`<button type="button" class="chip" data-zs-try="${E(a)}">${E(a)}</button>`).join("")}</span>`:""}</li>`+h;PAL.sel=nav.length-1}else PAL.zero=false;
 if(res.fixed)h=`<li class="nx-fixed" role="presentation">Showing results for <b>${E(res.fixed)}</b></li>`+h;
 if(res.ownerDomain)h=`<li class="nx-fixed" role="presentation">Accountability domain: <b>${E(res.ownerDomain.label)}</b>. Owner and backup first, then everything about it.</li>`+h;
 PAL.rows=nav;if(PAL.sel>=nav.length)PAL.sel=0;ul.innerHTML=h;
 const note=q1("#nxPalNote");if(note){if(single||famMode){note.hidden=false;note.textContent="Showing only "+(single?scope.slice(2):FAMNAME[scope]||scope)+". Press Backspace on an empty box or pick All to widen."}else note.hidden=true}
 const stat=q1("#nxPalStat");if(stat){const p=[];if(ni.IDX.building)p.push("Indexing "+ni.IDX.done+" of "+ni.IDX.total);else if(ni.IDX.items.length)p.push(ni.IDX.items.length.toLocaleString("en-US")+" items indexed");p.push(res.total.toLocaleString("en-US")+" matches in "+res.groups.length+" types, "+res.ms+" ms");stat.textContent=p.join(" · ")}
 if(nav.length){const sel=Math.min(PAL.sel,nav.length-1);PAL.sel=sel;const cur=q1(`[data-nx-i="${sel}"]`,ul);if(cur){cur.setAttribute("aria-selected","true");const inp=q1("#nxPalIn");if(inp)inp.setAttribute("aria-activedescendant",cur.id)}}
 const ft=q1("#nxPal .nx-pfoot");if(ft&&!ft.querySelector(".zs-hint")){const sp=document.createElement("span");sp.className="zs-hint";sp.innerHTML="<kbd>→</kbd> show all of this type";const ref=ft.querySelector(".nx-pstat");ft.insertBefore(sp,ref)}
 ni.drawPrev();return true}
function suggest(res){const out=[];const t=res.T.map(x=>x.t);const rawq=res.q.toLowerCase();["budget","vendor","invoice","contract","incident","change","project","risk","policy","meeting"].forEach(w=>{if(out.length<4&&(rawq.indexOf(w.slice(0,3))>=0))out.push(w)});if(!out.length)["budget","vendor","incident","approval"].forEach(w=>out.push(w));return out.slice(0,4)}

/* ---------- preview: key fields for the highlighted result ---------- */
function fm(n){return typeof W.money==="function"?W.money(n):"$"+Math.round(n).toLocaleString("en-US")}
function fieldsFor(it){const z=zinfo(it);const id=String(it.t).split(" ")[0];const b=W.BUDX;const f=[];
 try{
  if(z.lab==="Budget lines"&&b){const l=b.LN(id);if(l){f.push(["Approved",fm(l.appr)],["Committed",fm(l.comm)],["Actual",fm(l.act)],["Forecast",fm(l.fcst)],["Variance",(l.fcst-l.appr>=0?"+":"-")+fm(Math.abs(l.fcst-l.appr))],["Owner",l.own],["Category",l.cat],["Project",G(()=>b.PJ(l.p).short)||l.p])}}
  else if(z.lab==="Purchase orders"&&b){const p=b.B().po.find(x=>x.id===id);if(p)f.push(["Vendor",G(()=>b.VID(p.v).n)||p.v],["Ordered",fm(p.ord)],["Received",fm(p.rec)],["Invoiced",fm(p.inv)],["Paid",fm(p.paid)],["Match",G(()=>b.m3(p)[0])||p.st],["Budget line",p.line],["Raised by",p.rBy||p.cBy])}
  else if(z.lab==="Contracts"&&b){const c=b.B().con.find(x=>x.id===id);if(c)f.push(["Vendor",G(()=>b.VID(c.v).n)||c.v],["Type",c.ty],["Total value",fm(c.tcv)],["Annual",fm(c.ann)],["Ends",c.e],["Auto renew",c.auto?"Yes":"No"],["Owner",c.own])}
  else if(z.lab==="Vendors"&&b){const v=b.B().vend.find(x=>x.n===it.t);if(v)f.push(["Category",v.cat],["Risk",v.risk],["Owner",v.own],["Contact",v.con],["Scorecard",G(()=>b.vScore(v).sc.toFixed(2))])}
  else if(z.lab==="Reserve entries"&&b){const e=b.B().led.find(x=>x.id===id);if(e)f.push(["Type",e.t],["Amount",fm(e.amt)],["Status",e.st],["Date",e.d],["Requested by",e.req],["Approver",e.apr],["Project",e.p||"Portfolio"])}
  else if(z.lab==="Invoices"){const i=(W.INVOICES||[]).find(x=>x.id===id);if(i)f.push(["Vendor",i.vendor],["Amount",fm(i.amt)],["Due",i.due],["Advisor",i.rec],["Contract",i.contract])}
  else if(z.lab==="Incidents"&&W.ITSMX){const r=G(()=>ITSMX.getIncident(id));if(r)f.push(["Priority",r.pri||r.priority],["State",r.st||r.state],["Service",r.svc||r.service],["Assigned to",r.who||r.assignee||r.own],["Opened",r.opened||r.od])}
  else if(z.lab==="Changes"&&W.ITSMX){const r=G(()=>ITSMX.getChange(id));if(r)f.push(["Type",r.type||r.kind],["State",r.st||r.state],["Risk",r.risk],["Service",r.svc||r.service],["Requested by",r.req||r.requester])}
  else if(z.lab==="Problems"&&W.ITSMX){const r=G(()=>ITSMX.getProblem(id));if(r)f.push(["State",r.st||r.state],["Service",r.svc||r.service],["Owner",r.own||r.owner])}
  else if(z.lab==="Demand requests"||z.lab==="Demand"){const d=(W.DEMAND||[]).find(x=>x.id===id);if(d)f.push(["Requester",d.who],["Sponsor",d.sp],["Cost",fm(d.cost*1000)],["Benefit",fm(d.ben*1000)],["Strategic fit",d.strat+" of 5"])}
  else if(z.lab==="Projects"){const p=(W.PROJ||[]).find(x=>x.n===it.t||x.id===id);if(p)f.push(["Owner",p.owner],["Budget at completion",fm(p.bac*1000)],["Paid",fm(p.paid*1000)])}
  else if(z.lab==="Cost centers"&&it.zid&&b){const d=b.DEPTS.find(x=>x[0]===it.zid);if(d)f.push(["Department",d[1]],["Cost center",d[2]],["People",d[3]])}
 }catch(e){}
 return f.filter(x=>x[1]!=null&&x[1]!=="")}
const DONE_TY={record:1,knowledge:1,data:0,process:0,person:0,metric:0};
function preview(box,r){const ni=NI();const it=r.it;if(!it||r.ty==="ask"||r.ty==="query"||r.ty==="action")return false;
 if(it.ty==="person"&&!it.g)return false;if(it.ty==="metric"||(it.ty==="process"&&!it.g)||(it.ty==="data"&&!it.g))return false;
 const z=zinfo(it);const b=bits(it);const fields=fieldsFor(it);const s=ni.st();
 const en=ni.entryOf(r);const isFav=en&&s.fav.some(f=>f.id===en.id);const hist=s.hist.find(h=>h.title===r.t);
 const res=ZX.lastRes;const why=[];if(res){const tn=z.tl,tt=res.T.map(x=>x.t);const inT=tt.every(t=>x_in(tn,t)),inA=tt.some(t=>z.al.indexOf(" "+t)>=0);why.push(inT?"Matched in the title":inA?"Matched by type or alias ("+z.lab+")":"Matched in details");if(res.T.some(x=>x.alts.some(a=>a.syn&&(tn.indexOf(" "+a.a)>=0||z.hb.indexOf(" "+a.a)>=0||z.al.indexOf(" "+a.a)>=0))))why.push("synonym used")}
 const head=`<div class="nx-pv-h"><span class="nx-oi big" style="--c:var(${it.c||ni.TYCOL[it.ty]||"--accent"})">${ni.SVG(ni.TYICO[it.ty]||ni.ICO.doc,22,1.8)}</span><div><div class="eyebrow">${E(z.lab)} · ${E(FAMNAME[z.fam]||"")}</div><h3>${mark2(it.t,res?termsOf(res):[])}</h3></div></div>`;
 const pills=`<div class="zs-pv-pills">${b.status?`<span class="pill info">${E(b.status)}</span>`:""}${b.amount?`<span class="pill metric num">${E(b.amount)}</span>`:""}${b.sub&&!fields.length?`<span class="muted small">${E(b.sub)}</span>`:""}</div>`;
 const kv=fields.length?`<dl class="kv zs-kv">${fields.map(x=>`<dt>${E(x[0])}</dt><dd>${E(x[1])}</dd>`).join("")}</dl>`:(b.sub?`<dl class="kv zs-kv"><dt>Details</dt><dd>${E(b.sub)}</dd>${hist?`<dt>History</dt><dd>Opened before${hist.n>1?", "+hist.n+" visits":""}</dd>`:""}</dl>`:"");
 const kw=it.k?`<p class="muted small zs-kw">${E(String(it.k).replace(/\s+/g," ").slice(0,200))}</p>`:"";
 const acts=`<div class="nx-pv-a"><button type="button" class="btn primary" data-nx-pact="open">Open <kbd>↵</kbd></button>${en?`<button type="button" class="btn" data-nx-pact="star" aria-pressed="${!!isFav}">${isFav?"Unstar":"Star"}</button>`:""}<button type="button" class="btn quiet" data-nx-pact="ask">Ask Oukala</button></div>`;
 box.innerHTML=head+pills+kv+kw+(why.length?`<p class="zs-why small muted">${E(why.join(", "))}</p>`:"")+acts;return true}
function x_in(tn,t){return tn.indexOf(" "+t)>=0}

/* ---------- events: expanders, try-links ---------- */
document.addEventListener("click",e=>{const t=e.target;let b;const ni=NI();if(!ni)return;
 if((b=t.closest("[data-zs-all]"))){e.preventDefault();ZX.groups[b.dataset.zsAll]=1;ni.refreshPal();return}
 if((b=t.closest("[data-zs-fewer]"))){e.preventDefault();delete ZX.groups[b.dataset.zsFewer];ni.refreshPal();return}
 if((b=t.closest("[data-zs-more]"))){e.preventDefault();ZX.groups[b.dataset.zsMore]=(ZX.groups[b.dataset.zsMore]||0)+25;ni.refreshPal();return}
 if(t.closest("[data-zs-groups]")){e.preventDefault();ZX.open.__groups=!ZX.open.__groups;ni.refreshPal();return}
 if((b=t.closest("[data-zs-try]"))){e.preventDefault();const i=q1("#nxPalIn");if(i){i.value=b.dataset.zsTry;ni.PAL.q=i.value;ni.PAL.sel=0;ni.refreshPal();i.focus()}return}
 if(t.closest("[data-zs-rerun]")){e.preventDefault();render();return}
},true);
document.addEventListener("keydown",e=>{const t=e.target;if(!t||t.id!=="nxPalIn"||e.ctrlKey||e.metaKey||e.altKey)return;const ni=NI();if(!ni)return;
 if((e.key==="ArrowRight"||e.key==="ArrowLeft")&&t.selectionStart===t.value.length&&t.selectionEnd===t.value.length){const r=ni.PAL.rows[ni.PAL.sel];if(!r||!r.it||!ZX.lastRes)return;const lab=zinfo(r.it).lab;const g=ZX.lastRes.groups.find(x=>x.lab===lab);if(!g)return;
  if(e.key==="ArrowRight"&&g.n>3&&!ZX.groups[lab]){e.preventDefault();ZX.groups[lab]=1;ni.refreshPal()}else if(e.key==="ArrowLeft"&&ZX.groups[lab]){e.preventDefault();delete ZX.groups[lab];ni.refreshPal()}}},true);
document.addEventListener("input",e=>{if(e.target&&e.target.id==="nxPalIn"){ZX.groups={};ZX.open={}}},true);

/* ---------- extra providers: record types that had no search yet ---------- */
function extraSources(){const ni=NI();const L=[];const mk=(g,t,m,c,f,k,key,x)=>ni.mkItem("record",t,g+" · "+m,c,f,k,key,Object.assign({g},x||{}));
 L.push(["Reserve entries",()=>{const b=W.BUDX;if(!b)return[];return b.B().led.map(e=>mk("Reserve entries",e.id+" "+(e.t==="open"?"Opening reserve":e.amt<0?"Reserve draw":"Reserve entry"),e.st+" · "+fm(Math.abs(e.amt)),"--w1",()=>{go("bud_over");S.v.budv=4;setTimeout(()=>BD.open("led",e.id,{reset:true}),90)},(e.why||"")+" "+(e.req||"")+" "+(e.apr||"")+" "+(e.p||"")+" reserve contingency management reserve","led:"+e.id))},"prov"]);
 L.push(["Cost centers",()=>{const b=W.BUDX;if(!b)return[];return b.DEPTS.map(d=>{const t=b.T(b.B().lines.filter(l=>l.dept===d[0]));return mk("Cost centers",d[1]+" "+d[2],fm(t.appr)+" approved · "+d[3]+" people","--w1",()=>{go("bud_over");setTimeout(()=>BD.open("dept",d[0],{reset:true}),90)},"cost center department "+d[0]+" "+d[2],"dept:"+d[0],{zid:d[0]})})},"prov"]);
 L.push(["Approval authority",()=>{const b=W.BUDX;if(!b)return[];return b.B().doa.map(t=>mk("Approval authority",t.id+" "+t.role,"Up to "+fm(t.max),"--s3",()=>go("bud_doa"),"delegation of authority approval limit who approves "+t.role,"doa:"+t.id))},"prov"]);
 L.push(["Accountability domains",()=>{if(!(W.ORGX&&ORGX.domains))return[];return ORGX.domains.map(d=>{const r=G(()=>ORGX.byDomain(d.id))||d;const on=(r.owner&&r.owner.name)||"",bn=(r.backup&&r.backup.name)||"";return mk("Accountability domains",d.label,"Owner "+on+(bn?" · backup "+bn:""),"--p4",()=>{if(on)person360(on);else go("own_gaps")},(d.aliases||[]).join(" ")+" owner who owns accountable "+on+" "+bn,"domain:"+d.id)})},"prov"]);
 L.push(["Forecast entries",()=>{const b=W.BUDX;if(!b)return[];return b.B().lines.map(l=>{const v=l.fcst-l.appr;return mk("Forecast entries",l.id+" forecast",(v>0?"Over by ":v<0?"Under by ":"On budget")+(v?fm(Math.abs(v)):"")+" · "+fm(l.fcst),"--w1",()=>{go("bud_over");S.v.budv=3;setTimeout(()=>BD.open("line",l.id,{reset:true,foc:"fcst"}),90)},l.n+" "+l.cat+" "+l.own+" forecast reforecast variance","fc:"+l.id)})},"prov"]);
 L.push(["Audit events",()=>(G(()=>AUDIT)||[]).slice(0,120).map((a,i)=>mk("Audit events",a.a,a.p+" · "+a.t,"--s3",()=>{go("loop")},(a.d||"")+" "+a.s+" audit trail","aud:"+i))]);
 L.push(["Allocations",()=>{const o=[];Object.keys(G(()=>CAP)||{}).forEach(k=>{if(typeof CAP[k]==="number")o.push(mk("Allocations",k+" allocation",CAP[k]+" people","--p4",()=>go("ppl_cap"),"capacity allocation fte team "+k,"alloc:"+k))});return o}]);
 L.push(["Agenda items",()=>{const o=[];const om=m=>()=>{const x=(NAVX.index.items||[]).find(y=>y.g==="Meetings"&&y.t.indexOf(m.t)===0);if(x&&x.f)x.f();else go("meet_hub")};(G(()=>MEETINGS)||[]).forEach(m=>(m.agenda||[]).forEach(a=>{if(o.length<500)o.push(mk("Agenda items",a.t,m.t+" · "+(a.own||"")+" · "+a.min+" min","--e4",om(m),(a.note||"")+" agenda","ag:"+a.id))}));return o},"prov"]);
 L.push(["Meeting minutes",()=>(G(()=>MEETINGS)||[]).filter(m=>m.minutes&&m.minutes.st).slice(0,150).map(m=>mk("Meeting minutes",m.t+" minutes",m.minutes.st+" · by "+m.minutes.by,"--e4",()=>{const x=(NAVX.index.items||[]).find(y=>y.g==="Meetings"&&y.t.indexOf(m.t)===0);if(x&&x.f)x.f();else go("meet_hub")},(m.sum||"")+" minutes notes","min:"+m.id))]);
 L.push(["Org teams",()=>{const m={};(G(()=>DIR)||[]).forEach(d=>{if(!d.team||d.kind==="ai")return;(m[d.team]=m[d.team]||[]).push(d)});return Object.keys(m).map(k=>mk("Org teams",k,m[k].length+" people · "+m[k].slice(0,2).map(x=>x.name).join(", "),"--p4",()=>{go("org_chart")},m[k].map(x=>x.name+" "+x.role).join(" ")+" team department","team:"+k))},"prov"]);
 L.push(["Decision points",()=>{const o=[];const defs=G(()=>PROC.defs)||{};Object.keys(defs).forEach(k=>{const d=defs[k];(d.steps||[]).forEach((s,i)=>{if(o.length<900&&(s.who==="gate"||/decid|approv|review/i.test(s.n||""))&&s.n)o.push(mk("Decision points",s.n,(d.title||k)+" · step "+(i+1),"--s3",()=>{const p=G(()=>PROCLIB.get(k));if(p)PROCLIB.open(k);else go(k)},(s.d||"")+" "+(d.title||"")+" decision point gate approve","dp:"+k+"."+i))})});return o},"prov"]);
 return L}

/* ---------- coverage: entity types versus providers ---------- */
const ENTMAP={incident:["Incidents"],change_request:["Changes"],request_item:["Service requests"],project:["Projects"],project_task:["WBS lines"],cmdb_ci:["Configuration items"],business_service:["Services"],invoice:["Invoices"],person:["People","AI agents"],wbs_line:["WBS lines"],service_offering:["Service offerings"],core_company:["Vendors"],ast_contract:["Contracts"],problem_record:["Problems"],change_approval_policy:["Change approval rules"],incident_priority_policy:["Priority policy"],maturity_capability:["Capabilities"],alert_event:["Alerts"],alert_rule:["Alert rules"],maintenance_window:["Change freezes"],automation_rule:["Automation rules"],standard_change:["Runbooks","Change templates"],slo:["SLOs"],synthetic_check:["Synthetic checks"],dashboard:["Dashboards"],oncall_shift:["On-call rotas"],skill_claim:["Skills"],knowledge_article:["Knowledge articles","Knowledge items"],agent_skill:["Agent skills"],ai_model:["AI models"],conversation_thread:["Chat threads"],policy:["Policies"],control:["Controls"],connector:["Integrations"],mapping:["Data connections"],app_manifest:["Citizen apps"],license:["Licenses","License meters"],debt_item:["Debt items"],data_asset:["Data entities"],metric_definition:["Metrics"],process_definition:["Processes"],objective:["Strategic objectives"],application:["Applications"],scenario:["Scenarios"],resource_request:["Resource requests"],decision:["Decisions","Meeting decisions"],action_item:["Meeting actions"],budget_line:["Budget lines"],budget_adjustment:["Reserve entries"],purchase_order:["Purchase orders"],doa_rule:["Approval authority"],benefit:["Benefits"],cost_center:["Cost centers"],approval:["Approvals"],notification:["Notification templates"],workflow_definition:["Workflows"],decision_table:["Decision rules"],assessment:["Assessments"],oncall_rota:["On-call rotas"],organization_unit:["Teams","Org teams"],forum:["Forums"],meeting:["Meetings"],course:["Courses"],room:["Rooms"],journey_map:["Journeys"],demand_request:["Demand requests"],raid_item:["RAID log","Risks"],release:["Releases"],user_story:["Stories"],feature:["Features"],sla_definition:["Agreements"],contract:["Contracts"],contract_change:["Contract changes"],catalog_item:["Service catalog"],asset:["Hardware assets"],scaling_step:["Scaling steps"],cost_allocation:["Cost consumers"],decision_rule:["Decision rules"],budget_request:["Budget requests"],meeting_series:["Forums"],meeting_action:["Meeting actions"],meeting_decision:["Meeting decisions"],process_drawing:["Process drawings"],fin_color:["Funding colors"],fin_color_balance:["Funding colors"],fin_gate:["Funding gates"],fin_project_funding:["Funding gates"],fin_exception:["Finance exceptions"],fin_allocation_driver:["Allocation drivers"],fin_funding_line:["Budget lines"],forecast_entry:["Forecast entries"],audit_event:["Audit events"],allocation:["Allocations"],agenda_item:["Agenda items"],meeting_note:["Meeting minutes"],skill:["Skills"],order_guide_part:["Order guides"],guide_order:["Orders"],ownership_assignment:["Accountability domains","Ownership by domain"],ownership_exception:["Ownership by domain"],inbox_item:["Inbox items"],contract_finding:["Contract terms"],role:["Access and security"],reporting_line:["Org and team views"],automation_opportunity:["Platform tools"]};
function coverage(){const ni=NI();const labs={};ni.IDX.items.forEach(it=>{labs[zinfo(it).lab]=(labs[zinfo(it).lab]||0)+1});
 const ents=G(()=>PLAT.entities())||[];const cov=[],gaps=[];
 ents.forEach(e=>{const m=ENTMAP[e.id]||[];const hit=m.filter(l=>labs[l]);if(hit.length)cov.push({e,hit});else gaps.push(e)});
 const unclass=Object.keys(labs).filter(l=>FAMOF(l)==="other"&&l!=="Records"&&!/^(Screens|Metrics|Processes|Fields|Data entities|Actions)$/.test(l));
 const t=ni.tel();const live=t.searches?Math.round(t.zero/Math.max(1,t.searches)*1000)/10:0;
 const probe=probeRun();
 return{total:ents.length,covered:cov.length,pct:ents.length?Math.round(cov.length/ents.length*1000)/10:0,gaps,cov,unclass,labs,live,searches:t.searches,probe}}
const PROBES=["budget","forecast","vendor","invoice","contract","incident","change","release","risk","policy","laptop","onboarding","project","milestone","demand","request","approval","decision","meeting","cost","spend","funding","PO","purchase order","reserve","owner","agent","metric","entity","process","runbook","journey","team","people","knowledge","service","asset","license","compliance","security"];
function probeRun(){const ni=NI();if(!ni.IDX.built)return{n:0,zero:[],screens:[],rate:0,single:[]};const zero=[],so=[],single=[];PROBES.forEach(q=>{const r=search(q);if(!r.total)zero.push(q);else{const ks=r.groups.map(g=>g.fam);if(ks.every(k=>k==="screen"||k==="action"))so.push(q);if(r.groups.length<2)single.push(q)}});
 return{n:PROBES.length,zero,screens:so,single,rate:Math.round(zero.length/PROBES.length*1000)/10}}
G(()=>Object.assign(METRICS,{m_search_cov:{n:"Search coverage",f:"Entity types with at least one searchable record type ÷ entity types in the data model",u:"%",cur:60,tgt:80,badAt:40,dir:"max",max:100,tr:[41,44,47,50,52,55,58,60],owner:"Platform owner",use:["Navigation and search"],rem:{kind:"sop",ref:"SOP-NAV-02",title:"Add a SEARCHX provider for the entity type",agent:"Navigation Agent",auto:false,state:"idle",prog:"Lists entity types with no provider and drafts the provider stub"}},
 m_search_probe_zero:{n:"Standard queries with no result",f:"Standard queries returning zero results ÷ standard queries run (40 common business words)",u:"%",cur:0,tgt:2,badAt:10,dir:"min",max:30,tr:[12,10,8,6,5,3,2,0],owner:"Platform owner",use:["Navigation and search"],rem:{kind:"sop",ref:"SOP-NAV-02",title:"Add keywords or a provider",agent:"Navigation Agent",auto:false,state:"idle",prog:"Proposes keywords for words that find nothing"}}}));
const DOMN={fin:"Finance and contracts",cmdb:"Configuration management",agree:"Agreements",gov:"Governance",know:"Knowledge and AI",plat:"Platform",ops:"Operations",people:"People",service:"Service",portfolio:"Portfolio",agile:"Agile delivery",money:"Funding"};
function studioTop(){const ni=NI();if(!ni.IDX.built){try{ni.refreshPal&&0}catch(e){}return`<div class="card glass zs-cov"><div class="cardhead"><div><h3>Search coverage</h3><span class="muted small">Open search once so the index builds, then reload this screen.</span></div></div></div>`}
 const c=coverage();const M=G(()=>METRICS)||{};if(M.m_search_cov){M.m_search_cov.cur=c.pct;M.m_search_cov.tr=M.m_search_cov.tr.slice(0,-1).concat([c.pct])}if(M.m_search_probe_zero){M.m_search_probe_zero.cur=c.probe.rate;M.m_search_probe_zero.tr=M.m_search_probe_zero.tr.slice(0,-1).concat([c.probe.rate])}
 const byDom={};c.gaps.forEach(e=>{(byDom[e.domain]=byDom[e.domain]||[]).push(e)});
 const gapList=Object.keys(byDom).sort().map(d=>`<div class="zs-gapdom"><b>${E(DOMN[d]||d)}</b><span class="muted small">${byDom[d].length}</span><div class="zs-gaplist">${byDom[d].map(e=>`<span class="pill mute" title="${E(e.owner||"")}">${E(e.label)}</span>`).join("")}</div></div>`).join("");
 const st=(l,v,s,cls)=>`<div class="stat ${cls||""}"><small>${E(l)}</small><span class="num" data-role="metric">${v}</span><em>${E(s)}</em></div>`;
 return`<div class="card glass zs-cov"><div class="cardhead"><div><h3>Search coverage</h3><span class="muted small">Which entity types can be found as real records, how often searches come back empty, and what is still missing.</span></div><div class="row">${G(()=>fchip("m_search_cov"))||""}${G(()=>fchip("m_search_probe_zero"))||""}<button class="btn quiet" type="button" data-zs-rerun>Recompute</button></div></div>
 <div class="statrow">${st("Entity types with a provider",c.pct+"%",c.covered+" of "+c.total+" in the data model",c.pct<60?"crit":"")}${st("Standard queries with no result",c.probe.rate+"%",c.probe.zero.length+" of "+c.probe.n+" common words",c.probe.zero.length?"crit":"")}${st("Your searches with no result",c.live+"%",c.searches?c.searches+" searches on this device":"No searches on this device yet")}${st("Result types indexed",Object.keys(c.labs).length,c.unclass.length?c.unclass.length+" not classified":"all classified")}</div>
 <div class="grid g2" style="align-items:start;margin-top:12px"><div><div class="eyebrow">Gaps: entity types with no searchable records (${c.gaps.length})</div>${gapList||'<p class="muted small">None.</p>'}</div>
 <div><div class="eyebrow">Standard queries</div><p class="small"><b>No result:</b> ${c.probe.zero.length?c.probe.zero.map(q=>`<span class="pill warn">${E(q)}</span>`).join(" "):'<span class="muted">none</span>'}</p><p class="small"><b>Screens or actions only:</b> ${c.probe.screens.length?c.probe.screens.map(q=>`<span class="pill warn">${E(q)}</span>`).join(" "):'<span class="muted">none</span>'}</p><p class="small"><b>One result type only:</b> ${c.probe.single.length?c.probe.single.map(q=>`<span class="pill mute">${E(q)}</span>`).join(" "):'<span class="muted">none</span>'}</p>${c.unclass.length?`<p class="small"><b>Unclassified groups:</b> ${c.unclass.map(q=>`<span class="pill warn">${E(q)}</span>`).join(" ")}</p>`:""}</div></div></div>`}

/* ---------- install into NAVX ---------- */
function install(){if(!W.NAVX)return false;NAVX.ext=Object.assign(NAVX.ext||{},{sources:extraSources,refresh,preview,studioTop});NAVX.zsearch={search,coverage,zinfo,parseQuery,tokenize,probe:probeRun,PROBES,ENTMAP,GMAP,fieldsFor,openerFor,ZX};return true}
install();
})();

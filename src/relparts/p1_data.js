/* ============ Releases, Sprints and backlogs, Release trains and increments (module rel) ============ */
(function(){
S.rel=S.rel||{};const R=S.rel;
Object.entries({sel:"REL-2611",kt:"tm_alpha",bl:"team",bt:"tm_alpha",ct:"tm_alpha",pit:"26.4",part:"art1",selFt:null,selEp:null,tab:{},gate:{},lt:"sprint"}).forEach(([k,v])=>{if(R[k]===undefined)R[k]=v});
const TODAYI="2026-10-06",CURSP="26.4.1";
const addD=(iso,n)=>{const d=new Date(iso+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const dif=(a,b)=>Math.round((Date.parse(a+"T00:00:00Z")-Date.parse(b+"T00:00:00Z"))/864e5);
const fd=iso=>iso?new Date(iso+"T00:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}):"";
const fdy=iso=>iso?new Date(iso+"T00:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}):"";
const wk=iso=>{const g=new Date(iso+"T00:00:00Z").getUTCDay();return g!==0&&g!==6};
const pct=(a,b)=>b?Math.round(a/b*100):0;
const sum=(a,f)=>a.reduce((x,y)=>x+(f?f(y):y),0);
const med=a=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const rnd1=n=>Math.round(n*10)/10;
const goSafe=(id,arg)=>{if(typeof SCREENS!=="undefined"&&SCREENS.some(s=>s[0]===id))go(id,arg);else toast("That screen is not in this build yet","warn")};

/* ---------- people we need that the directory does not have yet (guarded) ---------- */
[["Anita Cole","Developer","Platform team",["C#",".NET","Azure Functions","API design"],"--p4"],["Luis Ortega","Developer","Platform team",["TypeScript","React","Accessibility"],"--p2"],["Mei Tan","Developer","Platform team",["Python","Search relevance","Testing"],"--u3"],["Zoe Hart","Developer","Platform team",["TypeScript","Editor UX","Playwright"],"--s3"],["Ben Alvarez","QA analyst","Platform team",["Manual testing","UAT coordination","Test design"],"--w1"],["Isla Reid","UX designer and business analyst","Editors",["UX research","Business analysis","Story writing"],"--p5"],["Kofi Mensah","Data engineer","Data team",["Azure Data Factory","SQL","Taxonomy"],"--s4"],["Tessa Lin","Data engineer","Data team",["Python","Pipelines","Data quality"],"--u4"],["Viktor Sokol","Developer","Platform team",["Integration","Java","Connectors"],"--e4"],["Amara Diallo","Developer","Platform team",["Document processing","Python","OCR"],"--p6"],["Hannah Lowe","Scrum master","PMO",["Scrum","Facilitation","SAFe"],"--p3"],["Marcus Webb","Scrum master","PMO",["Scrum","Kanban","Coaching"],"--u3"],["Leila Haddad","Communications lead","PMO",["Communications","Publishing","Stakeholder messaging"],"--w3"],["Owen Pryce","Organizational change manager","Change management",["OCM","Prosci ADKAR","Adoption"],"--s3"],["Grace Whitfield","Training lead","Editors",["Learning design","Training delivery","Documentation"],"--p4"]].forEach(a=>{if(!who(a[0]))DIR.push({id:a[0].toLowerCase().replace(/[^a-z0-9]+/g,"-"),name:a[0],kind:"human",role:a[1],team:a[2],org:"Meridian Standards Foundation",skills:a[3],loc:"Remote",hrs:40,rate:0,c:a[4],email:a[0].toLowerCase().replace(/ /g,".")+"@meridian.example",mgr:"Maya Ortiz",tenure:2})});

/* ---------- program increments and iterations ---------- */
function mkPI(id,start,st){const its=[];let s=start;for(let i=1;i<=5;i++){its.push({id:id+"."+i,n:i<5?"Iteration "+i:"Innovation and planning",from:s,to:addD(s,11),ip:i===5,pi:id});s=addD(s,14)}return {id,n:"PI "+id,from:start,to:its[4].to,st,its}}
const PIS=[mkPI("26.2","2026-05-04","Closed"),mkPI("26.3","2026-07-20","Closed"),mkPI("26.4","2026-09-28","Executing"),mkPI("27.1","2026-12-07","Planning")];
const SPR=[].concat(...PIS.map(p=>p.its));
const spOf=id=>SPR.find(s=>s.id===id);
const sprDay=sp=>{let n=0;for(let d=sp.from;d<=sp.to&&d<=TODAYI;d=addD(d,1))if(wk(d))n++;return n};
const piOf=id=>PIS.find(p=>p.id===id);
const PASTSP=["26.2.3","26.2.4","26.3.1","26.3.2","26.3.3","26.3.4"];

/* ---------- agile release trains and teams ---------- */
const ARTS=[{id:"art1",n:"Codification and Portal train",rte:"Priya Shah",pm:"Chief Editor",arch:"Jordan Lee",proj:["PR1","PR3"],obj:["Modernize standards publishing","Reduce operating risk"],std:"Ten-week increments of four two-week iterations plus one innovation and planning iteration."},
 {id:"art2",n:"Data and Contracts train",rte:"Dev Rao",pm:"Maya Ortiz",arch:"Jordan Lee",proj:["PR2","PR4"],obj:["Modernize standards publishing","Protect revenue through contract discipline"],std:"Same cadence as the Codification train so the two trains plan on the same days."}];
const M=(n,role,al,o)=>Object.assign({n,role,al,pto:0},o||{});
const TEAM=[
 {id:"tm_alpha",n:"Platform Alpha",art:"art1",po:"Priya Shah",sm:"Hannah Lowe",hpp:7.5,tr:.02,bias:-0.04,over:1.0,mem:[M("Anita Cole","Developer",100),M("Luis Ortega","Developer",100),M("Mei Tan","Developer",80),M("Sam Patel","DevOps engineer",40),M("Elise Park","QA automation",100),M("Test Agent","Automated test runner",100),M("Ben Alvarez","QA analyst",100,{pto:3})],ag:["Pull requests get a first review within 4 working hours.","No story starts without the definition of ready.","Automated tests ship with the code, not after it.","Standup is 15 minutes at 9:30 Eastern; blockers go to the board first."]},
 {id:"tm_search",n:"Search and Indexing (Lumen)",art:"art1",po:"Jordan Lee",sm:"Marcus Webb",hpp:7.5,tr:-.01,bias:-0.12,over:1.06,mem:[M("Marco Ellis","Lead engineer",100),M("Hana Koval","Taxonomy engineer",60),M("Lumen Search Services","Managed search operations",50),M("Mei Tan","Developer",20),M("Test Agent","Automated test runner",20)],ag:["Vendor staff and employees share one board and one definition of done.","Index builds are announced on the board a day ahead.","Relevance changes need before and after numbers in the pull request."]},
 {id:"tm_editor",n:"Editor Experience",art:"art1",po:"Chief Editor",sm:"Hannah Lowe",hpp:7.5,tr:.03,bias:.05,over:.95,mem:[M("Zoe Hart","Developer",100),M("Luis Ortega","Developer",0),M("Isla Reid","UX designer and analyst",100),M("Knowledge Curator","Content drafting agent",100),M("Chief Editor","Acceptance tester",20)],ag:["Every story has an editor named as the acceptance tester.","Screens are reviewed with two editors before build.","Accessibility checks run on every pull request."]},
 {id:"tm_portal",n:"Portal Reliability",art:"art1",po:"Tom Becker",sm:"Hannah Lowe",hpp:7.5,tr:.0,bias:-.08,over:1.14,mem:[M("Ravi Menon","Site reliability engineer",100),M("Sam Patel","DevOps engineer",60),M("Contoso Cloud Operations","Managed Azure operations",50),M("Triage Agent","Incident triage agent",50),M("Rina Okafor","Security reviewer",20)],ag:["Every change has a rollback rehearsed in staging.","On-call load is counted in capacity.","Incidents interrupt the sprint only at severity 1 or 2."]},
 {id:"tm_tax",n:"Taxonomy Data",art:"art2",po:"Dev Rao",sm:"Marcus Webb",hpp:7.5,tr:.02,bias:0,over:1.0,mem:[M("Kofi Mensah","Data engineer",100),M("Tessa Lin","Data engineer",100),M("Hana Koval","Taxonomy engineer",40),M("Test Agent","Automated test runner",30)],ag:["Data quality rules ship with every pipeline change.","Lumen taxonomy work starts only after the indexer handoff.","Pipelines are re-runnable by anyone on the team."]},
 {id:"tm_con",n:"Contracts and Integration",art:"art2",po:"Maya Ortiz",sm:"Marcus Webb",hpp:7.5,tr:.04,bias:.03,over:.92,mem:[M("Viktor Sokol","Developer",100),M("Amara Diallo","Developer",100),M("Jordan Lee","Integration architect",30),M("Contract Analyst Agent","Contract analysis agent",100),M("Northwind Managed Services","Managed endpoint and migration support",30)],ag:["Legal reviews contract-facing stories before sprint planning.","Data migrations are rehearsed twice before cutover.","Integration contracts are versioned and published."]}];
const tmOf=id=>TEAM.find(t=>t.id===id);
const tmName=id=>(tmOf(id)||{n:id||"None"}).n;
const KF={human:1,contractor:1,ai:.5,msp:.6};
const memCap=(m,pto)=>{const k=who(m.n)||{kind:"human"};return (m.al/100)*(10-(pto==null?m.pto:pto))*6*(KF[k.kind]||1)};
const capOf=(t,sp)=>Math.round(sum(t.mem,m=>memCap(m,sp===CURSP||!sp?m.pto:0))/t.hpp);
TEAM.forEach(t=>{const r=RNG("vel"+t.id),cap=capOf(t,"x");t.cap=cap;t.vel=PASTSP.map((s,i)=>Math.round(cap*(.8+.08*r()+t.tr*i+(i===3?-.05:0))));});

/* ---------- portfolio epics, capabilities, features ---------- */
const EPICS=[{id:"EP1",n:"Modernize standards publishing",kind:"Business epic",obj:"Modernize standards publishing",proj:["PR1","PR2"],ben:"Editors publish a standard in days, not weeks, and readers find it faster.",inv:2060,own:"Omar Hamid"},
 {id:"EP2",n:"Reduce operating risk",kind:"Business epic",obj:"Reduce operating risk",proj:["PR3"],ben:"No severity 1 outage from known causes; a rehearsed failover.",inv:310,own:"Tom Becker"},
 {id:"EP3",n:"Protect revenue through contract discipline",kind:"Business epic",obj:"Protect revenue through contract discipline",proj:["PR4"],ben:"Renewals and obligations are tracked, with fewer missed dates.",inv:540,own:"Maya Ortiz"},
 {id:"EP4",n:"Engineering excellence",kind:"Enabler epic",obj:"Reduce operating risk",proj:[],ben:"Every release can be built, tested and deployed through one automated pipeline.",inv:240,own:"Jordan Lee"}];
const CAPS=[{id:"CB1",n:"Editorial authoring",ep:"EP1",mat:"Application delivery, level 2 to 3"},{id:"CB2",n:"Search and discovery",ep:"EP1",mat:"Search operations, level 2 to 3"},{id:"CB3",n:"Resilient operations",ep:"EP2",mat:"Service continuity, level 2 to 3"},{id:"CB4",n:"Release and change flow",ep:"EP4",mat:"Release management, level 2 to 3"},{id:"CB5",n:"Data and taxonomy services",ep:"EP1",mat:"Data management, level 2 to 3"},{id:"CB6",n:"Delivery automation",ep:"EP4",mat:"DevOps, level 2 to 3"},{id:"CB7",n:"Contract lifecycle",ep:"EP3",mat:"Contract management, level 1 to 2"}];
const FS=["Funnel","Analyzing","Backlog","Implementing","Validating","Deploying","Releasing","Done"];
const F=(id,t,kind,ep,cap,art,pi,st,tms,svc,proj,rel,w,p,wsjf,o)=>Object.assign({id,t,kind,ep,cap,art,pi,st,tms,svc,proj,rel,w,p,bv:wsjf[0],tc:wsjf[1],rr:wsjf[2],js:wsjf[3],plan:[],dep:[]},o||{});
const FEAT=[
 F("FT-001","Editor workspace prototype","Feature","EP1","CB1","art1","26.3","Done",["tm_alpha","tm_editor"],"Codification Platform","PR1","REL-2602",.7,1,[8,5,3,8]),
 F("FT-002","Portal read replica","Enabler","EP2","CB3","art1","26.3","Done",["tm_portal"],"Codification Portal","PR3","REL-2601",.6,1,[5,8,13,5]),
 F("FT-003","Search schema v2","Feature","EP1","CB2","art1","26.3","Done",["tm_search"],"Search and indexing","PR1","REL-2606",.6,1,[8,5,5,8]),
 F("FT-004","Entra ID sign-in for editors","Enabler","EP2","CB4","art1","26.3","Done",["tm_alpha"],"Identity (Entra ID)","PR1","REL-2602",.4,1,[3,8,8,3]),
 F("FT-005","Taxonomy data model","Feature","EP1","CB5","art2","26.3","Done",["tm_tax"],"Data platform","PR2","REL-2603",.6,1,[8,5,5,5]),
 F("FT-006","Vendor selection for contract repository","Feature","EP3","CB7","art2","26.3","Done",["tm_con"],"Contract Repository","PR4","",.3,1,[3,5,3,3]),
 F("FT-101","Editor workspace redesign","Feature","EP1","CB1","art1","26.4","Implementing",["tm_alpha","tm_editor"],"Codification Platform","PR1","REL-2611",1.3,.4,[13,8,5,13],{own:"Chief Editor"}),
 F("FT-102","Redline and compare view","Feature","EP1","CB1","art1","26.4","Implementing",["tm_editor"],"Codification Platform","PR1","REL-2611",.8,.3,[8,5,3,8],{own:"Chief Editor"}),
 F("FT-103","Lumen search indexer 2.4","Feature","EP1","CB2","art1","26.4","Validating",["tm_search"],"Search and indexing","PR1","REL-2609",1.0,.8,[13,13,8,8],{own:"Jordan Lee"}),
 F("FT-104","Publishing pipeline automation","Enabler","EP4","CB6","art1","26.4","Implementing",["tm_alpha","tm_portal"],"Codification Platform","PR1","REL-2611",.9,.45,[5,8,13,8],{own:"Jordan Lee"}),
 F("FT-105","Standards API 2.3.1 batch fix","Feature","EP2","CB4","art1","26.4","Releasing",["tm_alpha"],"Codification Platform","","REL-2608",.4,.9,[5,13,8,3],{own:"Priya Shah"}),
 F("FT-106","Content migration tooling","Enabler","EP1","CB1","art1","26.4","Implementing",["tm_alpha"],"Codification Platform","PR1","REL-2611",.8,.25,[8,5,8,13],{own:"Priya Shah"}),
 F("FT-107","Beta feature flags and telemetry","Enabler","EP4","CB6","art1","26.4","Implementing",["tm_alpha"],"Codification Platform","PR1","REL-2611",.5,.2,[3,8,8,5],{own:"Jordan Lee"}),
 F("FT-131","Portal standby failover (RB-031 v8)","Enabler","EP2","CB3","art1","26.4","Validating",["tm_portal"],"Codification Portal","PR3","REL-2610",.9,.7,[8,13,13,8],{own:"Tom Becker"}),
 F("FT-132","Autoscale and capacity alerts","Enabler","EP2","CB3","art1","26.4","Implementing",["tm_portal"],"Codification Portal","PR3","REL-2617",.7,.35,[5,8,13,5],{own:"Tom Becker"}),
 F("FT-133","Reader accessibility fixes","Feature","EP2","CB1","art1","26.4","Implementing",["tm_editor"],"Codification Portal","","REL-2607",.6,.4,[5,5,8,5],{own:"Chief Editor"}),
 F("FT-201","Taxonomy pipeline v1","Feature","EP1","CB5","art2","26.4","Implementing",["tm_tax"],"Data platform","PR2","REL-2612",1.2,.45,[13,13,8,13],{own:"Dev Rao"}),
 F("FT-202","Taxonomy API connection pool hardening","Enabler","EP2","CB5","art2","26.4","Validating",["tm_tax"],"Data platform","PR2","REL-2612",.5,.8,[3,13,13,3],{own:"Dev Rao"}),
 F("FT-203","Lakehouse reporting views","Feature","EP1","CB5","art2","26.4","Backlog",["tm_tax"],"Data platform","PR2","",.6,.1,[8,3,3,8],{own:"Dev Rao"}),
 F("FT-241","Contract obligation tracker","Feature","EP3","CB7","art2","26.4","Backlog",["tm_con"],"Contract Repository","PR4","REL-2616",1.0,.1,[13,5,5,13],{own:"Maya Ortiz"}),
 F("FT-242","Renewal alerts","Feature","EP3","CB7","art2","26.4","Backlog",["tm_con"],"Contract Repository","PR4","REL-2616",.6,.05,[8,5,3,5],{own:"Maya Ortiz"}),
 F("FT-243","Storage tier migration","Enabler","EP3","CB7","art2","26.4","Implementing",["tm_con"],"Contract Repository","PR4","REL-2613",.8,.5,[3,8,13,8],{own:"Maya Ortiz"}),
 F("FT-244","ERP posting-lock connector","Enabler","EP3","CB4","art2","26.4","Analyzing",["tm_con"],"Lease subledger (ERP)","","REL-2614",.4,.1,[5,13,8,3],{own:"Avery Chen"}),
 F("FT-245","Integration hub connector 2.2","Feature","EP3","CB4","art2","26.4","Implementing",["tm_con"],"Integration hub","PR4","REL-2618",.5,.4,[3,5,5,5],{own:"Jordan Lee"}),
 F("FT-901","CI test automation suite","Enabler","EP4","CB6","art1","26.4","Implementing",["tm_alpha","tm_search"],"Codification Platform","","",.7,.5,[5,8,13,8],{own:"Jordan Lee"}),
 F("FT-902","Security scanning in the pipeline","Enabler","EP4","CB6","art1","26.4","Backlog",["tm_alpha"],"Codification Platform","","",.4,.15,[3,5,13,5],{own:"Rina Okafor"}),
 F("FT-301","Public API licensing portal","Feature","EP1","CB4","art1","27.1","Analyzing",["tm_alpha","tm_portal"],"Codification Portal","","",0,0,[13,3,5,13],{own:"Chief Editor"}),
 F("FT-302","AI-assisted standards drafting","Feature","EP1","CB1","art1","27.1","Funnel",["tm_editor"],"Codification Platform","","",0,0,[13,3,8,13],{own:"Chief Editor"}),
 F("FT-303","Multilingual reader","Feature","EP1","CB1","art1","27.1","Funnel",["tm_editor"],"Codification Portal","","",0,0,[8,2,3,13],{own:"Chief Editor"})];
const ftOf=id=>FEAT.find(f=>f.id===id);
const wsjf=f=>rnd1((f.bv+f.tc+f.rr)/f.js);
FEAT.forEach(f=>{f.own=f.own||"Priya Shah"});

/* ---------- stories (about 1,500), defects, enablers ---------- */
const POOL={tm_alpha:["editor save flow","standard compare panel","publishing queue","workspace layout","document locking","autosave","comment threads","draft versioning","bulk edit","template picker"],tm_search:["indexer batch size","relevance weighting","synonym handling","index rebuild job","query suggestions","result highlighting","facet counts","stemming rules","crawl scheduler","index health endpoint"],tm_editor:["redline view","reader navigation","table of contents","cross reference links","print stylesheet","keyboard navigation","screen reader labels","citation export","side-by-side view","glossary tooltips"],tm_portal:["load balancer idle timeout","standby failover","autoscale rule","connection pool alert","health probe","cache purge","CDN rules","status page feed","runbook RB-031","backup restore test"],tm_tax:["taxonomy loader","term mapping","batch concurrency cap","pipeline retry","lineage capture","API connection pool","schema validation","data quality rule","reference data sync","pilot dashboard"],tm_con:["obligation extractor","renewal reminder","storage tier job","ERP posting lock check","connector retry","document viewer","clause tagging","contract import","audit export","access review feed"]};
const VERB=["Add","Improve","Show","Support","Simplify","Automate","Validate","Export","Filter","Log"],ENV=["Refactor","Add tests for","Instrument","Upgrade a dependency of","Document","Add an alert for"],DEFC=["not saving after a timeout","showing stale data","failing for long titles","returning 502 errors under load","wrong after a locale change","duplicated on retry","slow with 500 items","missing for read-only users"],CTX=["for editors","for readers","for administrators","in the beta","for the nightly batch","on mobile","for vendors","in the audit view","for large standards","with keyboard only"];
const REPOS={tm_alpha:"codification-platform",tm_search:"search-indexer",tm_editor:"editor-ui",tm_portal:"portal-infra",tm_tax:"taxonomy-pipeline",tm_con:"contract-repo"};
const FIBS=[1,2,3,5,8,13,21];
let STORY=[],PRS=[],_seq=0;
const dev=t=>t.mem;
function pickAs(t,r,ty){const arr=t.mem.filter(m=>{const k=(who(m.n)||{kind:"human"}).kind;if(k==="ai")return ty==="Enabler"&&r()<.55;if(k==="msp")return ty==="Enabler"&&r()<.4;return true});const ws=arr.map(m=>m.al*(who(m.n)&&who(m.n).kind==="contractor"?.9:1)+1),tot=sum(ws);let x=r()*tot,i=0;while(i<arr.length-1&&x>ws[i]){x-=ws[i];i++}return (arr[i]||t.mem[0]).n}
function mkStory(t,r,o){const n=++_seq;const x=r(),ty=x<.62?"Story":x<.84?"Defect":x<.98?"Enabler":"Spike";const obj=POOL[t.id][Math.floor(r()*10)];const tt=ty==="Defect"?"Fix "+obj+" "+DEFC[Math.floor(r()*DEFC.length)]:ty==="Enabler"||ty==="Spike"?(ty==="Spike"?"Spike: options for "+obj:ENV[Math.floor(r()*6)]+" "+obj):VERB[Math.floor(r()*10)]+" "+obj+" "+CTX[Math.floor(r()*CTX.length)];
 const pts=ty==="Defect"?FIBS[Math.min(4,Math.floor(r()*r()*5.5))]:ty==="Spike"?[2,3,5][Math.floor(r()*3)]:FIBS[Math.min(5,Math.floor(r()*r()*7.5)+(r()<.3?1:0))];
 return Object.assign({id:"ST-"+(1000+n),t:tt,ty,cat:ty==="Story"?"Enhancement":ty==="Defect"?"Defect":"Enabler",tm:t.id,ft:null,sp:null,st:"To do",pts,as:null,rk:n,sev:ty==="Defect"?(r()<.08?1:r()<.25?2:r()<.65?3:4):0,esc:false,found:ty==="Defect"?(r()<.55?"Test":r()<.7?"UAT":r()<.9?"Review":"Production"):"",ac:2+Math.floor(r()*3),acm:0,pr:null,ta:{n:0,p:0},tm_:{n:0,p:0},ct:"",dd:"",cy:0,sd:null,rd:null,td:null,dn:null,ad:null,blk:false,rdy:true,dor:true},o||{})}
function tests(s,r,full,frac){const hasAuto=s.ty!=="Spike";const na=hasAuto?2+Math.floor(r()*9):0,nm=s.cat==="Enhancement"?1+Math.floor(r()*4):s.ty==="Defect"?1:0;s.ta={n:na,p:full?na:Math.round(na*frac)};s.tm_={n:nm,p:full?nm:Math.round(nm*frac*.85)};s.acm=full?s.ac:Math.round(s.ac*frac*.9)}
function gen(){
 STORY=[];PRS=[];_seq=0;const r=RNG("rel-stories");let prn=0;const prRepo=t=>REPOS[t.id];
 const mkPR=(s,t,state,age,rr)=>{if(s.ty==="Spike"&&r()<.7)return;const au=s.as&&(who(s.as)||{}).kind!=="msp"?s.as:t.mem[0].n;const rv=t.mem.filter(m=>m.n!==au&&(who(m.n)||{}).kind!=="ai"&&(who(m.n)||{}).kind!=="msp").map(m=>m.n);const pr={id:"#"+(4100+(++prn)),t:s.t,repo:prRepo(t),tm:t.id,au,rv:rv.slice(0,r()<.5?1:2).concat(r()<.3?["Test Agent"]:[]),st:state,ck:state==="Merged"?"passing":r()<.2?"failing":r()<.25?"running":"passing",age,ln:Math.round(20+r()*r()*900),sid:s.id,rvh:Math.round((1+r()*r()*20)*10)/10,op:addD(TODAYI,-age),mg:state==="Merged"?s.dd||addD(TODAYI,-Math.max(0,age-2)):""};s.pr=pr.id;PRS.push(pr)};
 TEAM.forEach(t=>{const fts=FEAT.filter(f=>f.tms.includes(t.id));const wts=fts.map(f=>f.w+.05);const pickF=(allowNull,pn)=>{if(allowNull&&r()<pn)return null;const live=fts.filter((f,i)=>wts[i]>.05+0);let x=r()*sum(live,f=>f.w+.05),i=0;while(i<live.length-1&&x>live[i].w+.05){x-=live[i].w+.05;i++}return live[i]};
  /* completed work in past sprints */
  PASTSP.forEach((spid,i)=>{const sp=spOf(spid);let acc=0,guard=0;while(acc<t.vel[i]&&guard++<80){const s=mkStory(t,r);const f=pickF(true,.14);const past=fts.filter(x=>x.pi==="26.3"||x.st==="Done");const ff=(f&&(r()<.5||!past.length))?f:(past.length&&r()<.6?past[Math.floor(r()*past.length)]:f);s.ft=ff?ff.id:null;s.sp=spid;s.st="Done";s.as=pickAs(t,r,s.ty);tests(s,r,true,1);s.dd=addD(sp.from,Math.floor(r()*11));if(!wk(s.dd))s.dd=addD(s.dd,2);s.cy=Math.max(1,Math.round(s.pts*(.7+r()*.6)+(t.id==="tm_search"?2:0)));s.ct=addD(s.dd,-s.cy-Math.floor(r()*6));if(s.ty==="Defect"&&s.found==="Production"){s.esc=true}
    mkPR(s,t,"Merged",s.cy+1,r);acc+=s.pts;STORY.push(s)}});
  /* open work: rank by feature priority, fill sprints */
  const nOpen=Math.round(134+r()*30);const open=[];for(let i=0;i<nOpen;i++){const s=mkStory(t,r);const f=pickF(true,.3);s.ft=f?f.id:null;open.push(s)}
  open.sort((a,b)=>{const fa=a.ft?wsjf(ftOf(a.ft)):0,fb=b.ft?wsjf(ftOf(b.ft)):0;return fb-fa||a.rk-b.rk});
  const caps=[Math.round(capOf(t,CURSP)*t.over),Math.round(t.cap*.95),Math.round(t.cap*.75)];let k=0;
  ["26.4.1","26.4.2","26.4.3"].forEach((spid,si)=>{let acc=0;while(k<open.length&&acc+open[k].pts<=caps[si]){const s=open[k++];s.sp=spid;acc+=s.pts;if(si===0){s.as=pickAs(t,r,s.ty)}}});
  const cur=open.filter(s=>s.sp==="26.4.1");const prog=.62+t.bias;
  cur.forEach(s=>{const x=r(),pD=.4+t.bias,pTe=.13,pR=.14,pI=.17,pT=1-pD-pTe-pR-pI;if(x<pT){s.st="To do"}else if(x<pT+pI){s.st="In progress";s.sd=1+Math.floor(r()*5)}else if(x<pT+pI+pR){s.st="In review";s.sd=1+Math.floor(r()*4);s.rd=Math.min(7,s.sd+1+Math.floor(r()*2))}else if(x<pT+pI+pR+pTe){s.st="Testing";s.sd=1+Math.floor(r()*3);s.rd=s.sd+1;s.td=Math.min(7,s.rd+1+Math.floor(r()*2))}else{s.st="Done";s.sd=1+Math.floor(r()*3);s.rd=s.sd+1;s.td=s.rd+(r()<.5?0:1);s.dn=Math.min(7,s.td+1+Math.floor(r()*2));s.dd=addD("2026-09-28",s.dn>5?s.dn+1:s.dn-1)}
   if(r()<.1&&s.st!=="Done")s.ad=2+Math.floor(r()*4);if(s.st==="To do"&&r()<.12)s.blk=true;if(s.st==="In progress"&&r()<.1)s.blk=true;
   const fr={"To do":0,"In progress":.3,"In review":.7,"Testing":.9,"Done":1}[s.st];tests(s,r,s.st==="Done",fr);if(s.st==="Done"||s.st==="Testing"&&r()<.7)s.acm=s.ac;
   if(s.st==="In progress")mkPR(s,t,r()<.4?"Draft":"Open",Math.floor(r()*3),r);else if(s.st==="In review")mkPR(s,t,r()<.25?"Changes requested":"Open",1+Math.floor(r()*5),r);else if(s.st==="Testing")mkPR(s,t,r()<.7?"Merged":"Approved",1+Math.floor(r()*3),r);else if(s.st==="Done")mkPR(s,t,"Merged",2+Math.floor(r()*3),r);
   if(s.st==="Done"){s.cy=Math.max(1,s.dn-s.sd+1);s.ct=addD("2026-09-28",-Math.floor(r()*14))}});
  open.slice(k).forEach(s=>{s.sp=null;s.ct=addD(TODAYI,-Math.floor(r()*120));s.dor=r()<.55;s.rdy=s.dor});
  open.filter(s=>s.sp==="26.4.2"||s.sp==="26.4.3").forEach(s=>{s.ct=addD(TODAYI,-Math.floor(r()*60));s.dor=r()<.92});
  open.forEach(s=>{STORY.push(s)});
 });
 /* normalize ids and ranks per team backlog */
 TEAM.forEach(t=>{STORY.filter(s=>s.tm===t.id&&s.st!=="Done").sort((a,b)=>a.rk-b.rk).forEach((s,i)=>{s.rk=i+1})});
 /* pad up to 1,500 with older backlog items */
 let guard=0;while(STORY.length<1500&&guard++<400){const t=TEAM[guard%TEAM.length],s=mkStory(t,r);s.sp=null;s.rk=999+guard;s.ct=addD(TODAYI,-60-Math.floor(r()*200));s.dor=false;s.rdy=false;STORY.push(s)}
 STORY.forEach((s,i)=>{s.id="ST-"+(1001+i)});
}
gen();
const sOf=id=>STORY.find(s=>s.id===id);
let EXTRA=null;
function stories(){if(typeof SCALE!=="undefined"&&SCALE.on){if(!EXTRA){const r=RNG("rel-extra");EXTRA=[];for(let i=0;i<3500;i++){const t=TEAM[i%6],s=mkStory(t,r);s.id="ST-"+(5001+i);const f=FEAT.filter(x=>x.tms.includes(t.id));s.ft=f.length?f[Math.floor(r()*f.length)].id:null;s.sp=r()<.6?PASTSP[Math.floor(r()*6)]:null;if(s.sp){s.st="Done";s.as=pickAs(t,r,s.ty);s.dd=addD(spOf(s.sp).from,3);s.cy=2+Math.floor(r()*8);s.acm=s.ac;s.ta={n:4,p:4}}s.ct=addD(TODAYI,-Math.floor(r()*300));EXTRA.push(s)}}return STORY.concat(EXTRA)}return STORY}


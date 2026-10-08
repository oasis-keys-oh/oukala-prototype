/* ===== mod_people: people, work, training, rooms, journeys, forums (prefix ppl) ===== */
(function(){
const st=S.ppl=S.ppl||{};
/* ---------- time helpers (work calendar from data2.js) ---------- */
const TODAY_ISO="2026-10-06",WK0=wdOf("2026-10-05"),NW=8;
const WL=[...Array(NW)].map((_,i)=>fmtD(WK0+5*i));
const D0=Date.UTC(2026,9,5);const dISO=d=>new Date(Date.UTC(2026,9,d)).toISOString().slice(0,10);
const dFmt=iso=>new Date(iso+"T00:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
const dTs=iso=>Date.parse(iso+"T00:00:00Z");const addD=(iso,n)=>new Date(dTs(iso)+n*864e5).toISOString().slice(0,10);
const addM=(iso,m)=>{const d=new Date(dTs(iso));d.setUTCMonth(d.getUTCMonth()+m);return d.toISOString().slice(0,10)};
const daysTo=iso=>Math.round((dTs(iso)-dTs(TODAY_ISO))/864e5);
const hh=h=>{const H=Math.floor(h),m=Math.round((h-H)*60);return (H%12||12)+(m?":"+String(m).padStart(2,"0"):"")+(H<12?" am":" pm")};
const DOWN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dowOf=d=>DOWN[new Date(Date.UTC(2026,9,d)).getUTCDay()];
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967295};
const nowT=()=>new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
const ini=n=>n.split(" ").map(x=>x[0]).join("").slice(0,2);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TEAMS=Object.keys(CAP);
const SKILLS=[["si","Search and indexing"],["dm","Data modeling"],["tx","Taxonomy"],["cf","Cloud and failover"],["ia","Integration and APIs"],["ir","Incident response"],["er","Editorial review"],["sa","Security architecture"],["pm","Project management"],["vc","Vendor and contracts"]];
const SK=Object.fromEntries(SKILLS);
/* ---------- people ---------- */
const ROSTER=[
["cd","Catherine Doyle","Chief executive","Leadership",null,1,"employee","pm3 vc2",60],
["oh","Omar Hamid","Chief information officer","Leadership","cd",1,"employee","pm3 sa2 vc3",70],
["mr","Marcus Reid","Chief financial officer","Finance","cd",1,"employee","vc3 pm2",60],
["ac","Avery Chen","Controller","Finance","mr",1,"employee","vc3 pm2",80],
["em","Elena Marsh","Chief Editor","Editors","cd",1,"employee","er3 tx2 pm2",40],
["mo","Maya Ortiz","Portfolio lead","PMO","oh",1,"employee","pm3 vc2",30],
["ps","Priya Shah","Project manager","PMO","mo",1,"employee","pm3 si2 vc2",20],
["dr","Dev Rao","Project manager","PMO","mo",1,"employee","pm3 dm2 tx2",20],
["nb","Nia Brooks","Change manager","PMO","mo",1,"employee","pm2 ir2 ia1",60],
["jl","Jordan Lee","Chief architect","Architecture","oh",1,"employee","sa3 dm3 ia3 cf2",25],
["rk","Rina Kovacs","Solutions architect","Architecture","jl",1,"employee","dm3 tx2 ia2",10],
["aw","Aaron Whitfield","Security architect","Architecture","jl",1,"employee","sa3 cf2 ir2",10],
["sp","Sam Patel","Platform engineering lead","Platform team","oh",1,"employee","cf3 ia3 si2 sa1",25],
["lm","Leah Moss","Platform engineer","Platform team","sp",1,"employee","ia3 si2 cf2",10],
["bi","Ben Ito","Platform engineer","Platform team","sp",1,"employee","cf3 ia2",10],
["cr","Carla Reyes","Platform engineer","Platform team","sp",1,"employee","ia3 dm1 si1",10],
["dv","Dmitri Volkov","Platform engineer","Platform team","sp",1,"employee","cf2 sa2 ia2",10],
["hs","Hana Sato","Platform engineer","Platform team","sp",.8,"employee","si3 ia2 tx1",10],
["gn","Greg Nolan","Platform engineer","Platform team","sp",1,"employee","cf2 ir2 ia1",10],
["tw","Tess Whitaker","Platform engineer","Platform team","sp",1,"employee","ia2 dm2 si1",10],
["am","Anil Mehta","Data engineering lead","Data team","oh",1,"employee","dm3 tx3 ia2",25],
["yt","Yuki Tanaka","Data engineer","Data team","am",1,"employee","dm3 tx2",10],
["rd","Rosa Delgado","Data engineer","Data team","am",1,"employee","dm2 ia2 si1",10],
["cw","Chen Wei","Data engineer","Data team","am",1,"employee","dm3 tx3",10],
["fa","Femi Adeyemi","Data analyst","Data team","am",.8,"employee","dm2 tx1 er1",10],
["lb","Lucas Brandt","Data engineer","Data team","am",1,"employee","dm2 ia2 cf1",10],
["tb","Tom Becker","Service desk lead","Ops team","oh",1,"employee","ir3 cf2 pm2",25],
["id","Ines Duarte","Operations engineer","Ops team","tb",1,"employee","cf3 ir3",10],
["km","Kofi Mensah","AV and operations technician","Ops team","tb",1,"employee","ir2 cf1 ia1",10],
["pg","Paula Grant","Operations engineer","Ops team","tb",1,"employee","ir3 cf2 sa1",10],
["wh","Wes Hartley","Service desk analyst","Ops team","tb",1,"employee","ir2",10],
["nh","Noor Haddad","Standards editor","Editors","em",1,"employee","er3 tx2",10],
["pc","Pierce Caldwell","Standards editor","Editors","em",1,"employee","er3 tx1",10],
["if","Isla Fenn","Associate editor","Editors","em",1,"employee","er2 tx2",10],
["mk","Marta Kessler","Lumen delivery lead","Lumen (vendor)","mo",1,"vendor","si3 pm2 ia2",0],
["jb","Joel Bakker","Search engineer (Lumen)","Lumen (vendor)","mk",1,"vendor","si3 tx1",0],
["pn","Priyanka Nair","Search engineer (Lumen)","Lumen (vendor)","mk",1,"vendor","si3 ia2 tx2",0],
["sl","Sven Lindqvist","Relevance engineer (Lumen)","Lumen (vendor)","mk",1,"vendor","si2 dm2 tx3",0],
["ao","Amara Okoye","Taxonomy engineer (Lumen)","Lumen (vendor)","mk",1,"vendor","tx3 dm2 si1",0]];
const LEADS={"Platform team":"sp","Data team":"am","Ops team":"tb","Editors":"em","Architecture":"jl","Lumen (vendor)":"mk"};
function seedPeople(){return ROSTER.map(r=>({id:r[0],n:r[1],role:r[2],team:r[3],mgr:r[4],fte:r[5],type:r[6],sk:Object.fromEntries(r[7].split(" ").map(x=>[x.slice(0,2),+x[2]])),bau:r[8],kind:"human",start:"2021-03-01",c:["--p4","--s3","--u3","--e4","--w1","--p2","--s2","--u2"][Math.floor(hash(r[0])*8)]}))}
/* agents: tier 1 assistive (suggests and drafts), tier 2 supervised (acts after a person approves), tier 3 autonomous within limits */
const TIERS={1:{n:"Tier 1 · Assistive",s:"Suggests and drafts. A person does the work.",c:"--story-f",ic:"T1"},2:{n:"Tier 2 · Supervised",s:"Acts, but a person approves each step.",c:"--u3",ic:"T2"},3:{n:"Tier 3 · Autonomous within limits",s:"Acts alone inside spend, data and action limits.",c:"--w1",ic:"T3"}};
const KILLS=[["run","One run"],["agent","This agent"],["capability","Its capability"],["provider","Its model provider"],["tenant","Everything at Meridian"]];
const MODELS=["Claude Sonnet","Claude Haiku","GPT (OpenAI)","Gemini (Google)"];
function seedAgents(){const A=(id,n,tier,model,owner,scope,cap,base,kill,guards,does)=>({id,n,tier,model,owner,scope,cap,base,kill,guards,does,kind:"agent",c:TIERS[tier].c});
 return [A("fo","First Officer",3,"Claude Sonnet","mo",["meetings","minutes","records"],40,30,"agent",["No external email without approval","Redacts personal data","Files only records with confidence 85% or higher"],"Joins meetings, takes notes, files decisions and actions."),
 A("ia","Invoice Advisor",1,"GPT (OpenAI)","ac",["finance","invoices"],30,14,"capability",["Cannot execute payments","Reads only approver-scoped data"],"Scores invoices and recommends approve, hold or reject."),
 A("kc","Knowledge Curator",1,"Gemini (Google)","tb",["knowledge","docs"],40,24,"agent",["Drafts only, the owner publishes","Must cite a source"],"Finds stale articles and drafts refreshes."),
 A("tq","Test Agent",2,"Claude Sonnet","sp",["testing","platform"],60,38,"agent",["Sandbox only","A second model validates results"],"Runs regression and flow checks."),
 A("pa","Personal assistant",1,"Claude Sonnet","oh",["personal","calendar"],20,9,"agent",["Acts as Omar, never above Omar"],"Handles Omar's calendar and task nudges."),
 A("oa","Ops Agent",2,"Claude Sonnet","tb",["ops","runbooks","incidents"],30,22,"agent",["Runs only approved runbooks","Cannot change production without a change record"],"Runs runbook steps such as RB-031 failover."),
 A("pm","PMO Agent",2,"Claude Sonnet","mo",["schedule","projects","reports"],30,17,"agent",["Cannot move a baseline date","Re-plans are drafts for the project manager"],"Re-plans slipped work and drafts status reports."),
 A("ra","Resource Agent",2,"Claude Haiku","mo",["capacity","people"],20,6,"agent",["Proposes moves, never changes leave","Cannot see pay or performance data"],"Levels overloaded teams and ranks candidates."),
 A("rs","Room Scheduler",3,"Claude Haiku","tb",["rooms","av","calendar"],50,21,"capability",["Books only bookable rooms","Never cancels an executive booking","Raises AV tickets, cannot close them"],"Moves bookings to fix conflicts and raises AV tickets."),
 A("lc","Learning Coach",1,"Claude Sonnet","nb",["training","people"],30,11,"agent",["Drafts nudges, a person sends escalations","No performance data"],"Drafts reminders and suggests learning paths."),
 A("fc","Forecast Agent",2,"Gemini (Google)","ac",["finance","forecast"],25,12,"agent",["Reforecasts are drafts","Cannot post journal entries"],"Drafts reforecasts from actuals.")]}
/* ---------- allocation: built from the same master schedule tasks as the Master schedule screen ---------- */
function seedAlloc(people){const A={};people.forEach(p=>{A[p.id]=[...Array(NW)].map(()=>({}))});
 const P=plan("now");const byTeam={};people.forEach(p=>{(byTeam[p.team]=byTeam[p.team]||[]).push(p)});const tot={};people.forEach(p=>tot[p.id]=p.bau*NW);
 const order=TASKS.filter(t=>!t.ms&&t.pct<100).sort((a,b)=>P.R[a.id].es-P.R[b.id].es);
 order.forEach(t=>{const r=P.R[t.id];t.res.forEach(([rn,f])=>{const mem=(byTeam[rn]||[]).slice();if(!mem.length)return;const n=Math.min(mem.length,Math.ceil(f*1.5));mem.sort((x,y)=>(tot[x.id]-tot[y.id])||(hash(t.id+x.id)-hash(t.id+y.id)));
  mem.slice(0,n).forEach(p=>{for(let w=0;w<NW;w++){const a=WK0+5*w,ov=Math.max(0,Math.min(r.ef,a+5)-Math.max(r.es,a));if(ov>0){const v=Math.round(f/n*ov/5*85);A[p.id][w][t.p]=(A[p.id][w][t.p]||0)+v;tot[p.id]+=v}}})})});
 const hand={ps:{PR1:50,PR3:10},dr:{PR2:50,PR4:10},mo:{PR4:25,PR1:10},nb:{PR3:20},ac:{PR1:10},tb:{PR3:10}};
 people.forEach(p=>{for(let w=0;w<NW;w++){const h=hand[p.id];if(h)Object.entries(h).forEach(([k,v])=>A[p.id][w][k]=(A[p.id][w][k]||0)+v);if(p.bau)A[p.id][w].BAU=p.bau}});return A}
function seedWork(){const W=(id,t,h,w0,n,tag,risk,pr,src,owner)=>({id,t,h,w0,n,tag,risk,pr,src,owner:owner||null});
 return [W("W1","Update runbook RB-031 for failover",8,0,2,"runbooks","med","PR3","Task p3_3",null),W("W2","Review Lumen SOW-4 change order",5,0,1,"vendor","high","PR2","Task p2_2",null),
 W("W3","Prepare Architecture Review Board pre-read for the Taxonomy hub",6,1,1,"docs","low","PR2","Task p2_1",null),W("W4","Triage Portal latency alerts (Sev 2 follow-up)",10,0,2,"incidents","med","PR3","INC1",null),
 W("W5","Write editor acceptance test scripts",12,1,2,"docs","low","PR1","Task p1_6",null),W("W6","Spot check taxonomy mapping output",8,2,3,"schedule","low","PR2","Task p2_3",null),
 W("W7","Run migration design workshop prep",10,3,2,"docs","med","PR4","Task p4_2",null),W("W8","Follow up with staff who have not finished security training",4,0,2,"training","low",null,"Training",null),
 W("W9","Clean up stale knowledge articles",6,1,2,"knowledge","low",null,"Knowledge",null),W("W10","Reforecast Vendor services after the Lumen slip",6,0,1,"finance","med","PR1","Budget B2",null),
 W("W11","Portal Sev 2 incident command",24,0,2,"incidents","med","PR3","INC1","tb"),W("W12","Hosting tier change risk review",6,0,1,"ops","med","PR3","Change request","aw"),
 W("W13","Beta defect triage",10,0,3,"platform","low","PR1","Task p1_4","sp"),W("W14","Contract Repository vendor demos",8,0,2,"vendor","med","PR4","Task p4_1","jl"),
 W("W15","Cutover rehearsal scripts",8,1,3,"ops","low","PR1","Task p1_8","id"),W("W16","Support the SOW-4 negotiation",6,0,2,"vendor","high","PR2","SOW-4","ps"),W("W17","Failover runbook walkthrough with the vendor",18,0,2,"runbooks","med","PR3","Task p3_3","pg"),W("W18","Sev 2 customer communications",16,0,2,"incidents","med","PR3","INC1","wh"),W("W19","Beta defect backlog",20,0,3,"platform","low","PR1","Task p1_4","gn"),W("W20","Write rollback test for the Contract Repository connector",16,0,2,"platform","med","PR4","CAB action A2","rk")]}
/* ---------- leave ---------- */
function seedLeave(){const L=(id,who,from,to,type,sta,note)=>({id,who,from,to,type,st:sta,note});
 return [L("LV1","lm","2026-10-19","2026-10-23","Vacation","approved","Booked in July"),L("LV2","id","2026-10-12","2026-10-16","Vacation","approved","Family trip"),L("LV3","gn","2026-10-14","2026-10-14","Sick day","approved",""),
 L("LV4","bi","2026-10-26","2026-10-30","Vacation","pending","Wedding abroad. The week Platform is already over capacity."),L("LV5","rd","2026-11-02","2026-11-06","Vacation","pending","Pilot readiness is the following month."),
 L("LV6","nh","2026-11-16","2026-11-20","Vacation","pending","Falls inside editor acceptance testing, which needs all four editors."),L("LV7","yt","2026-11-23","2026-11-27","Vacation","approved","Thanksgiving week")]}
/* ---------- state init ---------- */
st.people=st.people||seedPeople();st.agents=st.agents||seedAgents();st.alloc=st.alloc||seedAlloc(st.people);st.work=st.work||seedWork();st.leave=st.leave||seedLeave();
st.open=st.open||{cd:1,oh:1};st.week=st.week||0;st.sel=st.sel||null;st.reassign=st.reassign||[];st.capTeam=st.capTeam||"Platform team";st.find=st.find||null;st.capDrag=null;
const H=id=>st.people.find(p=>p.id===id),AG=id=>st.agents.find(a=>a.id===id),ENT=id=>H(id)||AG(id);
const nameOf=id=>{const e=ENT(id);return e?e.n:"Unassigned"};
/* ---------- utilization (workload as a share of capacity) ---------- */
function allocTot(id,w){const a=st.alloc[id];return a&&a[w]?Object.values(a[w]).reduce((x,y)=>x+y,0):0}
function leaveFrac(id,w){const a=WK0+5*w;let d=0;st.leave.filter(l=>l.who===id&&l.st==="approved").forEach(l=>{const s=wdOf(l.from),e=wdOf(l.to);d+=Math.max(0,Math.min(e,a+4)-Math.max(s,a)+1)});return Math.min(1,d/5)}
const slots=i=>Math.max(1,Math.round(i.h/3));
function itemsOf(id,w){return st.work.filter(i=>i.owner===id&&(w==null||(w>=i.w0&&w<i.w0+i.n)))}
function util(e,w,extra){w=w||0;if(e.kind==="agent"){const s=itemsOf(e.id,w).reduce((a,i)=>a+slots(i),0)+(extra?slots(extra):0);return (e.base+s)/e.cap*100}
 const lf=leaveFrac(e.id,w);if(lf>=1)return null;const raw=allocTot(e.id,w)+itemsOf(e.id,w).reduce((a,i)=>a+i.h/(40*e.fte)*100,0)+(extra&&w>=extra.w0&&w<extra.w0+extra.n?extra.h/(40*e.fte)*100:0);return raw/(1-lf)}
const uCol=u=>u==null?"--faint":u>100?"--bad-f":u>85?"--warn-f":u>=40?"--good-f":"--p6";
const uCls=u=>u==null?"mute":u>100?"bad":u>85?"warn":u>=40?"good":"info";
const pctT=u=>u==null?"On leave":Math.round(u)+"%";
const humans=()=>st.people;
function teamUtil(team,w){const m=st.people.filter(p=>p.team===team);const vals=m.map(p=>util(p,w)).filter(v=>v!=null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}
const overloaded=w=>st.people.filter(p=>{const u=util(p,w||0);return u!=null&&u>100});
function updMetrics(){const ppl=st.people.filter(p=>p.type!=="vendor"||true),ov=overloaded(0).length;METRICS.m_wload.cur=Math.round(ov/ppl.length*100);
 const ag=st.agents,tot=ag.reduce((a,x)=>a+x.base,0);METRICS.m_agentauto.cur=88;
 const rm=roomUtil();METRICS.m_roomu.cur=Math.round(rm.pct);const tc=trainStat();METRICS.m_trainc.cur=Math.round(tc.pct);const ac=actStat();METRICS.m_actdone.cur=Math.round(ac)}

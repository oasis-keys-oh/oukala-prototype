
/* ================================================================================================
   people v5 (prefix pp2): Org chart with four kinds of worker, Performance management, Resource planning
   across all work types, Journey maps tied to workflows. Built on the shared directory (DIR) and the
   work providers (WORK), so everything here shows up in Person 360.
   ================================================================================================ */
(function(){
const st=S.pp2=S.pp2||{};
const E=esc;
const WHOC={n:-1,d:null,m:null};
function who(n){if(!n)return null;if(WHOC.n!==DIR.length||WHOC.d!==DIR[0]){const m=new Map();for(let i=DIR.length-1;i>=0;i--){const d=DIR[i];m.set(d.id,d);m.set(d.name,d)}WHOC.m=m;WHOC.n=DIR.length;WHOC.d=DIR[0]}const k=(typeof ALIAS!=="undefined"&&ALIAS[n])||n;const r=WHOC.m.get(k);return r&&(r.name===k||r.id===k)?r:null}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hs=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,1540483477);h^=h>>>15;h=Math.imul(h^(h>>>16),2246822507);h^=h>>>13;return (h>>>0)/4294967295};
const fmt=n=>Math.round(n).toLocaleString("en-US");
const f1=n=>(Math.round(n*10)/10).toLocaleString("en-US");
const med=a=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const pctOf=(arr,v)=>{if(!arr.length)return 50;let b=0;arr.forEach(x=>{if(x<v)b++;else if(x===v)b+=.5});return Math.round(b/arr.length*100)};
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const first=n=>String(n||"").split(" ")[0];
const stat=(l,v,sub,cls)=>`<div class="stat ${cls||""}"><small>${l}</small><span class="num" data-role="metric">${v}</span><em>${sub||""}</em></div>`;
const bar=(p,c)=>`<div class="loadbar"><u style="width:${clamp(p,0,100)}%;background:var(${c||"--accent"})"></u></div>`;
const kindOf=n=>{const r=who(n);return r?r.kind:"human"};
function csv(name,rows){const t=rows.map(r=>r.map(v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"').join(",")).join("\n");try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/csv"}));a.download=name+".csv";a.click();toast("Exported "+(rows.length-1)+" rows","good")}catch(e){toast("Export is not available here","warn")}audit("exported csv",name+" · "+(rows.length-1)+" rows")}
st.tab=st.tab||{};const ACT={};
st.org=st.org||{open:{},depth:2,more:{},sel:null,q:"",zoom:1,week:0,wq:null,audit:[],tmView:""};
function tabsBar(scr,labels){const cur=clamp(st.tab[scr]||0,0,labels.length-1);return `<div class="pp2-tabs vsw glass" role="tablist" aria-label="Sections">${labels.map((l,i)=>`<button type="button" role="tab" aria-selected="${i===cur}" data-pp2-tab="${scr}:${i}">${l}</button>`).join("")}</div>`}
const tabIdx=(scr,n)=>clamp(st.tab[scr]||0,0,n-1);
const nameBtn=n=>pchip(n);
const ptag=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
const uCls=u=>u==null?"mute":u>1.0001?"bad":u>.85?"warn":u>=.5?"good":"info";
const uCol=u=>u==null?"--faint":u>1.0001?"--bad-f":u>.85?"--warn-f":u>=.5?"--good-f":"--p6";
const pc=u=>u==null?"n/a":Math.round(u*100)+"%";
const bump=()=>{st.ver=(st.ver||0)+1};
const bumpMv=()=>{st.mv=(st.mv||0)+1;PMC.clear();TAC.clear()};

/* ---------- standards added for this module ---------- */
Object.assign(STD,{
 okr:{n:"OKRs",by:"Intel, Google, John Doerr",d:"Objectives and key results: a few ambitious objectives, each with 3 to 5 measurable key results, scored 0.0 to 1.0 and checked in weekly or monthly. Kept separate from pay so people aim high."},
 ninebox:{n:"9-box talent grid",by:"McKinsey, GE (common practice)",d:"Plots performance against potential in a 3 by 3 grid to structure calibration, development and succession talks. It is a conversation tool, not a score."},
 hr:{n:"Performance management practice",by:"SHRM, CIPD",d:"Goal setting, continuous feedback, structured reviews, calibration for fairness, development planning and succession. Evidence is gathered all year, not at review time."},
 f360:{n:"360-degree feedback",by:"Industry practice",d:"Feedback from manager, peers, reports and partners, aggregated only when at least three people respond so individuals stay anonymous."},
 tt:{n:"Team Topologies",by:"Skelton and Pais",d:"Four team types (stream-aligned, platform, enabling, complicated-subsystem) and three interaction modes (collaboration, X-as-a-service, facilitating)."},
 bp:{n:"Service blueprint",by:"G. Lynn Shostack, Nielsen Norman Group",d:"A journey map plus lanes for front stage, back stage and support processes, split by the line of interaction and the line of visibility."},
 cjm:{n:"Journey mapping",by:"Industry practice",d:"Stages across the top, then actions, touchpoints, emotions, pain points and opportunities for one persona."},
 capplan:{n:"Capacity and demand planning",by:"ITIL, PMI, Planview, Kantata practice",d:"Match the supply of hours and skills to demand across every kind of work, then level, add, borrow or defer."}
});

/* ---------- directory growth: the rest of Atlantic, so the org chart looks like an organization ---------- */
const ROSTER_TEXT_PLACEHOLDER=0;
/*ROSTER*/
const SKN={si:"Search and indexing",dm:"Data modeling",tx:"Taxonomy",cf:"Cloud and failover",ia:"Integration and APIs",ir:"Incident response",er:"Editorial review",sa:"Security architecture",pm:"Project management",vc:"Vendor and contracts"};
const COLS=["--p4","--s3","--u3","--e4","--w1","--p2","--s2","--u2"];
const MGR={"Casey Rowan":"Catherine Doyle","Avery Chen":"Marcus Reid","Chief Editor":"Catherine Doyle"};
const ACCT={"First Officer":"Maya Ortiz","Invoice Advisor":"Avery Chen","Knowledge Curator":"Tom Becker","Test Agent":"Sam Patel","Triage Agent":"Tom Becker","PMO Agent":"Maya Ortiz","Change Risk Agent":"Nia Brooks","Contract Analyst Agent":"Avery Chen","Ops Agent":"Tom Becker","Resource Agent":"Maya Ortiz","Room Scheduler":"Tom Becker","Learning Coach":"Nia Brooks","Forecast Agent":"Avery Chen","Personal assistant":"Casey Rowan"};
const ATIER={"First Officer":3,"Invoice Advisor":1,"Knowledge Curator":1,"Test Agent":2,"Triage Agent":2,"PMO Agent":2,"Change Risk Agent":2,"Contract Analyst Agent":1,"Ops Agent":2,"Resource Agent":2,"Room Scheduler":3,"Learning Coach":1,"Forecast Agent":2,"Personal assistant":1};
const SPON={"Marco Ellis":"Priya Shah","Hana Koval":"Dev Rao","Ravi Menon":"Sam Patel","Elise Park":"Priya Shah","Lumen Search Services":"Maya Ortiz","Northwind Managed Services":"Tom Becker","Contoso Cloud Operations":"Sam Patel","Marta Kessler":"Maya Ortiz"};
const MSPH={"Lumen Search Services":120,"Northwind Managed Services":420,"Contoso Cloud Operations":240};
const ROLEOV={};
const ROOT="Catherine Doyle";
function seedDir(){if(window.__pp2Dir)return;window.__pp2Dir=1;
 const idn={};ROSTER0.forEach(r=>idn[r[0]]=r[1]);idn.em="Chief Editor";
 const mk=(o)=>{if(who(o.name)&&who(o.name).name===o.name)return;DIR.push(Object.assign({id:slug(o.name),org:o.kind==="human"?"Atlantic Systems":"",skills:[],loc:"Remote",hrs:40,rate:0,c:COLS[Math.floor(hs(o.name)*COLS.length)],tenure:1+Math.floor(hs(o.name+"t")*9),email:slug(o.name).replace(/-/g,".")+(o.kind==="human"?"@atlantic.example":"@lumen.example")},o))};
 ROSTER0.forEach(r=>{const nm=r[1];const vend=r[6]==="vendor";const mg=r[4]?idn[r[4]]:null;
  if(nm==="Elena Marsh")return;
  if(who(nm)&&who(nm).name===nm){if(mg&&!MGR[nm]&&!who(nm).mgr)MGR[nm]=mg;return}
  const sk=r[7].split(" ").map(x=>SKN[x.slice(0,2)]).filter(Boolean);
  if(vend){mk({name:nm,kind:"contractor",role:r[2],team:r[3],org:"Lumen Search Services",skills:sk,rate:Math.round(115+hs(nm)*45),contract:"SOW-4",end:"2027-03-31",mgr:mg,hrs:40*r[5],loc:["Austin, TX","Remote","Prague (remote)","Chicago, IL"][Math.floor(hs(nm)*4)]});if(mg)MGR[nm]=mg}
  else{mk({name:nm,kind:"human",role:r[2],team:r[3],skills:sk,mgr:mg,hrs:Math.round(40*r[5]),loc:["Norwalk, CT","Remote","Washington, DC","Chicago, IL"][Math.floor(hs(nm)*4)]});if(mg)MGR[nm]=mg}});
 const X=[["Maribel Cruz","Service desk analyst","Service desk","Tom Becker",["ITIL 4","Incident management"]],["Owen Fraser","Service desk analyst","Service desk","Tom Becker",["ITIL 4","ServiceNow"]],["Priti Joshi","Tier 2 support analyst","Service desk","Tom Becker",["Incident management","Intune"]],["Gabe Lindholm","Service desk analyst","Service desk","Tom Becker",["Endpoint management","ITIL 4"]],
  ["Imran Sheikh","Security analyst","Security","Rina Okafor",["Defender","NIST CSF"]],["Colette Brandt","Identity engineer","Security","Rina Okafor",["Entra ID","Access reviews"]],
  ["Noelle Park","Accounts payable lead","Finance","Avery Chen",["Accounting","Invoice approval"]],["Victor Amaya","Financial analyst","Finance","Avery Chen",["Budgeting","ASC 842"]],
  ["Hollis Grey","Release coordinator","Change management","Nia Brooks",["Release coordination","CAB facilitation"]]];
 X.forEach(x=>{mk({name:x[0],kind:"human",role:x[1],team:x[2],skills:x[4],mgr:x[3]});MGR[x[0]]=x[3]});
 [["Ops Agent","Runbook execution agent",["Runbooks","Failover","Diagnostics"]],["Resource Agent","Capacity and leveling agent",["Capacity","Leveling","Skills matching"]],["Room Scheduler","Rooms and AV scheduling agent",["Rooms","Calendar"]],["Learning Coach","Training nudges agent",["Training","Reminders"]],["Forecast Agent","Financial reforecast agent",["Reforecast","Actuals"]],["Personal assistant","Personal assistant agent for the CIO",["Calendar","Tasks"]]].forEach(a=>mk({name:a[0],kind:"ai",role:a[1],team:"AI agents",skills:a[2],hrs:168}));
 const cd=who(ROOT);if(cd){cd.mgr=null}
}
seedDir();
const TEAMMGR=t=>{const x=TEAMS.find(y=>y.n===t);return x?x.mgr:null};
const FAMOF={"Service desk":"desk","Ops team":"ops","Platform team":"plat","Data team":"data","Editors":"edit","Architecture":"arch","PMO":"pmo","Finance":"fin","Security":"sec","Change management":"chg","Lumen (vendor)":"vend","AI agents":"ai","Leadership":"lead"};
const famOf=r=>FAMOF[r.team]||"plat";
function rfam(r){if(r.kind==="ai")return "AI agent";if(r.kind==="msp")return "Managed service provider";if(r.kind==="contractor")return "Contractor";const x=r.role||"";if(/chief (executive|information|financial)/i.test(x))return "Executive";if(/project manager|change manager|release/i.test(x))return "Project and change manager";if(/lead|manager|controller|director|chief/i.test(x))return "Manager or lead";if(/desk|support|coordinator|technician|operations/i.test(x))return "Service and support";if(/editor/i.test(x))return "Editor";if(/engineer|architect|developer|devops/i.test(x))return "Engineer or architect";return "Specialist"}
const ROLEFAMS=["Executive","Manager or lead","Project and change manager","Engineer or architect","Service and support","Editor","Specialist","Contractor","AI agent","Managed service provider"];
const TGT0={"Executive":[.5,.75],"Manager or lead":[.6,.85],"Project and change manager":[.7,.9],"Engineer or architect":[.7,.88],"Service and support":[.75,.92],"Editor":[.7,.88],"Specialist":[.7,.88],"Contractor":[.8,.95],"AI agent":[.4,.8],"Managed service provider":[.7,.92]};
const levelOf=r=>{if(r.kind!=="human")return r.kind==="ai"?"Agent":r.kind==="msp"?"Provider":"Contract";const x=r.role||"";if(/chief (executive|information|financial)/i.test(x))return "Exec";if(/chief|director|head/i.test(x))return "M3";if(/lead|manager|controller/i.test(x)&&!/project manager|change manager/i.test(x))return "M1";if(/senior|architect|principal|lead/i.test(x))return "IC4";if(/associate|analyst|coordinator|technician/i.test(x))return "IC2";return "IC3"};
const lvRank={IC2:2,IC3:3,IC4:4,IC5:5,M1:4,M2:5,M3:6,Exec:7};

/* ---------- hierarchy: managers, accountable humans for agents, sponsors for contractors and providers ---------- */
let HXK="",HXV=null;
function parentOf(r){if(r.name===ROOT)return null;let p=MGR[r.name];if(!p){if(r.kind==="ai")p=ACCT[r.name];else if(r.kind==="contractor"||r.kind==="msp")p=SPON[r.name]||r.mgr;else p=r.mgr}
 if(!p||p===r.name||!who(p)){p=(r.team&&TEAMMGR(r.team))||"Casey Rowan";if(p===r.name||!who(p))p="Casey Rowan"}
 return who(p).name}
function scaleOverlay(){/* in Enterprise mode: group generated people under team leads so spans stay realistic */
 Object.keys(ROLEOV).forEach(k=>{if(who(k)&&who(k).generated)delete ROLEOV[k]});Object.keys(MGR).forEach(k=>{if(who(k)&&who(k).generated)delete MGR[k]});
 const byTeam={};DIR.filter(d=>d.generated&&d.kind==="human").forEach(d=>(byTeam[d.team]=byTeam[d.team]||[]).push(d));
 Object.entries(byTeam).forEach(([t,L])=>{const tm=TEAMMGR(t)||"Casey Rowan";for(let i=0;i<L.length;i+=9){const lead=L[i];ROLEOV[lead.name]="Team lead, "+lead.role.toLowerCase();MGR[lead.name]=tm;for(let j=i+1;j<Math.min(L.length,i+9);j++)MGR[L[j].name]=lead.name}});
 DIR.filter(d=>d.generated&&d.kind!=="human").forEach(d=>{const L=byTeam[d.team]||[];if(L.length){const lead=L[Math.floor(hs(d.name)*L.length/9)*9]||L[0];MGR[d.name]=lead.name}})}
let SCK=-1;
function HX(){const k=DIR.length+"|"+(st.hv||0);if(HXV&&HXK===k)return HXV;
 if(SCK!==DIR.length){SCK=DIR.length;if(SCALE.on||DIR.some(d=>d.generated))scaleOverlay()}
 const par=new Map(),kids=new Map();DIR.forEach(r=>{const p=parentOf(r);par.set(r.name,p);if(p)(kids.get(p)||kids.set(p,[]).get(p)).push(r.name)});
 const rk=n=>{const r=who(n);return (r.kind==="human"?0:r.kind==="contractor"?1:r.kind==="msp"?2:3)*1e4+(kids.get(n)?0:1)*5e3};
 kids.forEach((l,k)=>l.sort((a,b)=>rk(a)-rk(b)||a.localeCompare(b)));
 const size=new Map(),depth=new Map(),seen=new Set();
 const walk=(n,d)=>{if(seen.has(n))return 0;seen.add(n);depth.set(n,d);let s=0;(kids.get(n)||[]).forEach(c=>{s+=1+walk(c,d+1)});size.set(n,s);return s};
 walk(ROOT,0);
 DIR.forEach(r=>{if(!seen.has(r.name)){/* orphan: attach to CIO */const p="Casey Rowan";par.set(r.name,p);(kids.get(p)||kids.set(p,[]).get(p)).push(r.name);walk(r.name,2)}});
 /* recompute sizes bottom-up for attached orphans */
 const comp=n=>{let s=0;(kids.get(n)||[]).forEach(c=>{s+=1+comp(c)});size.set(n,s);return s};comp(ROOT);
 HXV={par,kids,size,depth};HXK=k;return HXV}
const kidsOf=n=>HX().kids.get(n)||[];
const roleOf=r=>ROLEOV[r.name]||r.role;
const acctOf=n=>{const r=who(n);return r?HX().par.get(r.name):null};
const kindMix=n=>{const m={human:0,ai:0,contractor:0,msp:0};const walk=x=>kidsOf(x).forEach(c=>{m[kindOf(c)]++;walk(c)});walk(n);return m};
const teamList=()=>{const s=new Set();DIR.forEach(d=>{if(d.team)s.add(d.team)});const base=TEAMS.map(t=>t.n).filter(t=>s.has(t));[...s].forEach(t=>{if(!base.includes(t))base.push(t)});return base};
const VAC0=[{id:"V01",title:"Senior platform engineer",team:"Platform team",mgr:"Sam Patel",kind:"human",status:"Interviewing",opened:"2026-08-24",skills:["Azure","Kubernetes"],loaded:182000},{id:"V02",title:"Service desk analyst, Tier 1",team:"Service desk",mgr:"Tom Becker",kind:"human",status:"Offer out",opened:"2026-08-03",skills:["ITIL 4","Incident management"],loaded:88000},{id:"V03",title:"Data engineer",team:"Data team",mgr:"Dev Rao",kind:"human",status:"Open",opened:"2026-09-21",skills:["Data engineering","Azure Data Factory"],loaded:164000},{id:"V04",title:"Security analyst",team:"Security",mgr:"Rina Okafor",kind:"human",status:"Sourcing",opened:"2026-09-30",skills:["Defender","NIST CSF"],loaded:150000},{id:"V05",title:"Standards editor",team:"Editors",mgr:"Chief Editor",kind:"human",status:"Interviewing",opened:"2026-09-08",skills:["Standards writing","Editorial review"],loaded:122000},{id:"V06",title:"Taxonomy engineer (contractor)",team:"Lumen (vendor)",mgr:"Marta Kessler",kind:"contractor",status:"Open",opened:"2026-10-01",skills:["Taxonomy","Python"],loaded:156000}];
st.vac=st.vac||VAC0;

/* ---------- time model: 52 weeks from Mon Oct 5 2026 ---------- */
const NWK=52,WEEK0="2026-10-05",T0=Date.parse(WEEK0+"T00:00:00Z"),DAY=864e5;
const WK=[...Array(NWK)].map((_,i)=>{const d=new Date(T0+i*7*DAY),th=new Date(T0+(i*7+3)*DAY);const mi=Math.min(11,(th.getUTCFullYear()-2026)*12+th.getUTCMonth()-9);return {i,iso:d.toISOString().slice(0,10),lab:d.toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),mi,mon:th.toLocaleDateString("en-US",{month:"short",timeZone:"UTC"})}});
const MONTHS=[...Array(12)].map((_,m)=>{const ws=WK.filter(w=>w.mi===m);return {m,lab:(ws[0]||{mon:"?"}).mon,w0:ws.length?ws[0].i:0,w1:ws.length?ws[ws.length-1].i:0}});
const wkOfIso=iso=>Math.floor((Date.parse(iso+"T00:00:00Z")-T0)/(7*DAY));
const wkOfMs=ms=>Math.floor((ms-T0)/(7*DAY));
const isoOfWk=w=>new Date(T0+w*7*DAY).toISOString().slice(0,10);
const WT=[["proj","Project work","--p4"],["inc","Incidents and problems","--bad-f"],["req","Requests and fulfillment","--s3"],["chg","Changes and releases","--u3"],["oncall","On-call","--e4"],["bau","Operational (BAU)","--w1"],["mtg","Meetings","--p6"],["train","Training","--u1"]];
const WTK=WT.map(x=>x[0]);
const FAMP={desk:{inc:.2,req:.3,chg:.02,bau:.14,mtg:.07,train:.04},ops:{inc:.14,req:.08,chg:.12,bau:.22,mtg:.08,train:.03},plat:{inc:.06,req:.05,chg:.1,bau:.12,mtg:.1,train:.03},data:{inc:.03,req:.04,chg:.03,bau:.15,mtg:.1,train:.03},edit:{inc:0,req:.04,chg:0,bau:.42,mtg:.1,train:.03},arch:{inc:.02,req:.04,chg:.06,bau:.12,mtg:.18,train:.03},pmo:{inc:0,req:.05,chg:.04,bau:.18,mtg:.24,train:.02},fin:{inc:0,req:.08,chg:0,bau:.52,mtg:.08,train:.03},sec:{inc:.1,req:.12,chg:.06,bau:.22,mtg:.08,train:.04},chg:{inc:.02,req:.06,chg:.28,bau:.14,mtg:.14,train:.03},vend:{inc:.05,req:.04,chg:.04,bau:.1,mtg:.1,train:.02},lead:{inc:0,req:.02,chg:.02,bau:.2,mtg:.4,train:.02},ai:{}};
/* project hours per person per week come from the schedule engine for named people and from a generated portfolio for the rest */
let SRC=null,SRCK="";const PMC=new Map(),TAC=new Map();
function src(){const k=[st.ver||0,DIR.length,SCALE.on?1:0,TASKS.length].join("|");if(SRC&&SRCK===k)return SRC;SRCK=k;PMC.clear();TAC.clear();SRC=buildSrc();return SRC}
function addArr(m,name,w0,w1,h){let a=m.get(name);if(!a){a=new Float32Array(NWK);m.set(name,a)}for(let w=Math.max(0,w0);w<=Math.min(NWK-1,w1);w++)a[w]+=h}
function buildSrc(){const s0={pto:new Map(),hol:new Float32Array(NWK),proj:new Map(),incOwn:new Map(),chgOwn:new Map(),reqWith:new Map(),mtg:new Map(),teamInc:new Map(),rel:new Map(),t:0};const t0=performance.now();
 (window.HOLIDAYS||[]).forEach(h=>{const w=wkOfIso(h.d),dow=new Date(h.d+"T00:00:00Z").getUTCDay();if(w>=0&&w<NWK&&dow>0&&dow<6)s0.hol[w]+=8});
 try{(window.OCX&&OCX.allPto()||[]).forEach(p=>{if(p.st==="denied")return;(s0.pto.get(p.who)||s0.pto.set(p.who,[]).get(p.who)).push(p)})}catch(e){}
 try{const X=S.itsm||{};(X.inc||[]).filter(i=>!/Resolved|Closed/.test(i.st)).forEach(i=>{const w=i.maj?9:i.urg<=2?5:3;if(i.own)s0.incOwn.set(i.own,(s0.incOwn.get(i.own)||0)+w);(i.swarm||[]).forEach(x=>{if(x!==i.own)s0.incOwn.set(x,(s0.incOwn.get(x)||0)+w*.4)});s0.teamInc.set(i.grp,(s0.teamInc.get(i.grp)||0)+1)});
  (X.chg||[]).filter(c=>!c.hist&&!/Closed|Cancel/.test(c.st||"")&&c.own).forEach(c=>s0.chgOwn.set(c.own,(s0.chgOwn.get(c.own)||0)+1))}catch(e){}
 try{(window.REQREG||[]).forEach(r=>{if(!r.done&&r.withK==="person"&&r.withN)s0.reqWith.set(r.withN,(s0.reqWith.get(r.withN)||0)+1)})}catch(e){}
 try{MEETINGS.forEach(m=>(m.att||[]).forEach(a=>{if(who(a))s0.mtg.set(who(a).name,(s0.mtg.get(who(a).name)||0)+(m.e-m.s))}))}catch(e){}
 try{(window.RELX&&RELX.releases||[]).forEach(r=>{if(!r.rm||!r.date)return;const w=wkOfIso(r.date);if(w>=-1&&w<NWK)addArr(s0.rel,who(r.rm)?who(r.rm).name:r.rm,w-1,w,5)})}catch(e){}
 projectLoad(s0);s0.t=performance.now()-t0;return s0}
function projectLoad(s0){const WK0=wdOf(WEEK0);let tasks=[],P=null;
 try{tasks=(window.PPMX?PPMX.tasksOf({}):TASKS).filter(t=>!t.ms&&t.pct<100);P=PPMX.plan("now",PPMX.tasksOf({}))}catch(e){try{tasks=TASKS.filter(t=>!t.ms&&t.pct<100);P=plan("now")}catch(e2){return}}
 const members={};DIR.forEach(d=>{if(d.team&&d.kind!=="msp"&&d.kind!=="ai")(members[d.team]=members[d.team]||[]).push(d.name)});const tot=new Map();
 tasks.forEach(t=>{const r=P.R[t.id];if(!r)return;const w0=Math.floor((r.es-WK0)/5),w1=Math.floor((r.ef-1-WK0)/5);if(w1<0||w0>=NWK)return;
  const put=(nm,fte)=>{for(let w=Math.max(0,w0);w<=Math.min(NWK-1,w1);w++){const a=WK0+5*w,ov=Math.max(0,Math.min(r.ef,a+5)-Math.max(r.es,a));if(ov>0){let ar=s0.proj.get(nm);if(!ar){ar=new Float32Array(NWK);s0.proj.set(nm,ar)}ar[w]+=fte*40*ov/5}}};
  const res=t.res||[],asg=t.asg||[];
  res.forEach(([rn,f])=>{if(who(rn)&&who(rn).name===rn&&!members[rn]){put(rn,f);return}const mem=(members[rn]||[]).slice();if(!mem.length){if(who(rn))put(who(rn).name,f);return}const n=Math.min(mem.length,Math.max(1,Math.ceil(f*1.5)));mem.sort((x,y)=>((tot.get(x)||0)-(tot.get(y)||0))||(hs(t.id+x)-hs(t.id+y)));mem.slice(0,n).forEach(nm=>{put(nm,f/n);tot.set(nm,(tot.get(nm)||0)+f/n)})});
  asg.forEach(([nm,u])=>{if(who(nm))put(who(nm).name,u/100)});
  if(!res.length&&!asg.length&&t.own&&who(t.own))put(who(t.own).name,.2)})}

/* the generated portfolio gives everyone else something to do; deterministic per person */
function genProj(r){const a=new Float32Array(NWK);const n=hs(r.name+"pn")<.32?2:1;const projs=PROJ.concat(SCALE.on?SCALE.projects():[]);
 for(let k=0;k<n;k++){const w0=Math.floor(hs(r.name+"s"+k)*30)-12,len=6+Math.floor(hs(r.name+"l"+k)*26),h=10+hs(r.name+"h"+k)*20;if(hs(r.name+"x"+k)<.06)continue;for(let w=Math.max(0,w0);w<Math.min(NWK,w0+len);w++)a[w]+=h}return a}
function buildPM(name){const r=who(name)||{name,kind:"human",hrs:40,team:"",skills:[]};const S0=SRC;const fam=famOf(r);const FP=FAMP[fam]||FAMP.plat;
 const base=r.kind==="msp"?(MSPH[r.name]||160):(r.hrs||40);const cap=new Float32Array(NWK),pto=new Float32Array(NWK),tot=new Float32Array(NWK),util=new Float32Array(NWK);const T={};WTK.forEach(k=>T[k]=new Float32Array(NWK));
 const endW=r.kind==="contractor"&&r.end?wkOfIso(r.end):999;const vf=.88+.24*hs(r.name+"f");const pp=S0.pto.get(r.name)||[];const isMgr=kidsOf(r.name).filter(c=>kindOf(c)==="human").length>0;
 const pj=S0.proj.get(r.name)||((r.generated||!S0.proj.size||(r.kind!=="ai"&&r.kind!=="msp"&&!S0.proj.has(r.name)&&hs(r.name+"gp")<.55))?genProj(r):null);
 const adj=(st.cap&&st.cap.adj&&st.cap.adj[r.name])||null;
 for(let w=0;w<NWK;w++){const mon=T0+w*7*DAY;let off=r.kind==="human"?S0.hol[w]:0;
  pp.forEach(p=>{const a=Math.max(Date.parse(p.from+"T00:00:00Z"),mon),b=Math.min(Date.parse(p.to+"T00:00:00Z"),mon+4*DAY);if(b>=a){const days=Math.round((b-a)/DAY)+1;off+=days*8*base/40}});
  off=Math.min(base,off);pto[w]=off;cap[w]=w>endW?0:Math.max(0,base-off);const pf=1-.7*off/base;
  if(r.kind==="ai"){const u=clamp(.3+hs(r.name)*.38+w*.0035,.2,.95);const tt=u*base;const key=/triage|incident|ops/i.test(r.name)?"inc":/invoice|contract|request/i.test(r.name)?"req":/first|room|personal|learn/i.test(r.name)?"mtg":/test|change|risk/i.test(r.name)?"chg":"bau";T[key][w]=tt*.6;T.bau[w]+=tt*.2;T.proj[w]=tt*.2;if(key==="bau")T.bau[w]+=tt*.6;continue}
  if(r.kind==="msp"){const u=clamp(.62+hs(r.name)*.24+.08*Math.sin(w/6+hs(r.name)*6),.4,1.1);T.inc[w]=base*u*.3;T.req[w]=base*u*.4;T.chg[w]=base*u*.1;T.bau[w]=base*u*.2;continue}
  const dec=w>=11&&w<=13?.8:1;const surge=1+clamp(S0.teamInc.get(r.team)||0,0,6)*.1*Math.max(0,1-w/6);
  T.proj[w]=(pj?pj[w]:0)*dec*pf*(w>endW?1:1)+(adj?adj[w]:0);
  T.inc[w]=base*FP.inc*vf*surge*pf+(w===0?(S0.incOwn.get(r.name)||0):w===1?(S0.incOwn.get(r.name)||0)*.6:w===2?(S0.incOwn.get(r.name)||0)*.25:0);
  T.req[w]=base*FP.req*vf*pf+(w<2?(S0.reqWith.get(r.name)||0)*1.5:0);
  T.chg[w]=base*FP.chg*vf*pf+((S0.chgOwn.get(r.name)||0)*(w<3?3:0))+((S0.rel.get(r.name)||[])[w]||0);
  const rot=["desk","ops","plat","sec"].includes(fam)&&r.kind!=="msp"&&(Math.floor(hs(r.name+"oc")*6)+w)%8===0;T.oncall[w]=rot?10:0;
  if(window.OCX&&!r.generated&&r.kind!=="ai"){try{const sh=OCX.shiftsOf(r.name);let hh=0;sh.forEach(x=>{const a=Math.max(x.from,mon),b=Math.min(x.to,mon+7*DAY);if(b>a)hh+=(b-a)/36e5});if(hh)T.oncall[w]=hh*.1}catch(e){}}
  const finEnd=fam==="fin"&&(w%4===3||w===12||w===13)?1.2:1;T.bau[w]=base*FP.bau*vf*pf*finEnd;
  const mt=base*FP.mtg*vf+(isMgr?base*.1:0);T.mtg[w]=w===0&&S0.mtg.has(r.name)?Math.max(mt,S0.mtg.get(r.name)+mt*.5):mt;
  T.train[w]=base*FP.train*(w===4||w===5?1.7:1)}
 if(r.kind==="human"||r.kind==="contractor"){for(let w=0;w<NWK;w++){T.proj[w]=Math.min(T.proj[w]*.7,base*(.45+.3*hs(r.name+"pc")));["inc","req","chg","bau","mtg","train"].forEach(k=>T[k][w]*=.84)}}
 ((st.org&&st.org.wq)||[]).forEach(it=>{if(it.owner!==r.name)return;for(let w=Math.max(0,it.w0);w<it.w0+it.n&&w<NWK;w++)T[it.type||"bau"][w]+=it.h});
 ((st.cap&&st.cap.ov)||[]).forEach(o=>{if(o.owner===r.name&&o.w>=0&&o.w<NWK&&T[o.type])T[o.type][o.w]=Math.max(0,T[o.type][o.w]+o.h)});
 for(let w=0;w<NWK;w++){let s=0;WTK.forEach(k=>s+=T[k][w]);tot[w]=s;util[w]=cap[w]>.5?s/cap[w]:(s>.5?9.99:0)}
 return {r,base,cap,pto,T,tot,util,fam}}
function PM(name){src();let m=PMC.get(name);if(!m){m=buildPM(name);PMC.set(name,m)}return m}
const KINDSET=["human","ai","contractor","msp"];
function agg(names,key){src();const k=key||null;if(k&&TAC.has(k))return TAC.get(k);const A={cap:new Float32Array(NWK),tot:new Float32Array(NWK),pto:new Float32Array(NWK),T:{},n:names.length};WTK.forEach(x=>A.T[x]=new Float32Array(NWK));
 names.forEach(n=>{const m=PM(n);for(let w=0;w<NWK;w++){A.cap[w]+=m.cap[w];A.tot[w]+=m.tot[w];A.pto[w]+=m.pto[w]}WTK.forEach(x=>{const a=A.T[x],b=m.T[x];for(let w=0;w<NWK;w++)a[w]+=b[w]})});
 /* placeholder roles from approved resource requests count as demand with no capacity */
 (st.cap&&st.cap.reqs||[]).forEach(q=>{if(q.status==="Approved"||q.status==="Resource manager"){if(names.length&&q.team&&who(names[0])&&!names.some(n=>who(n)&&who(n).team===q.team))return;const w0=Math.max(0,wkOfIso(q.from)),w1=Math.min(NWK-1,wkOfIso(q.to));if(q.status==="Approved"&&q.fulfilled)return;for(let w=w0;w<=w1;w++){A.T.proj[w]+=q.fte*40;A.tot[w]+=q.fte*40}}});
 A.util=new Float32Array(NWK);for(let w=0;w<NWK;w++)A.util[w]=A.cap[w]>.5?A.tot[w]/A.cap[w]:(A.tot[w]>.5?9.99:0);if(k)TAC.set(k,A);return A}
const namesOf=(team,kinds)=>DIR.filter(d=>(!team||d.team===team)&&(!kinds||kinds.includes(d.kind))).map(d=>d.name);
const teamAgg=(team,kinds)=>agg(namesOf(team,kinds),"t:"+(team||"*")+"|"+(kinds||KINDSET).join(",")+"|"+DIR.length+"|"+(st.mv||0));
const avgU=(a,w0,w1)=>{let c=0,t=0;for(let w=w0;w<=Math.min(w1,NWK-1);w++){c+=a.cap[w];t+=a.tot[w]}return c>.5?t/c:0};
function ovStats(names,w0,w1){let pw=0,over=0,people=0;names.forEach(n=>{const m=PM(n);let o=0;for(let w=w0;w<=w1;w++){pw++;if(m.util[w]>1.0001&&m.cap[w]>.5){over++;o++}}if(o)people++});return {pw,over,people}}

/* ---------- metrics: every number here has a formula, a target, an owner and a remediation ---------- */
const RM=(kind,ref,title,agent,prog,auto)=>({kind,ref,title,agent,auto:!!auto,state:auto?"running":"idle",prog});
function MX(id,n,f,u,cur,tgt,badAt,dir,max,owner,use,rem){const sp=Math.abs(tgt-badAt)||Math.abs(cur)*.05||1;const tr=[...Array(8)].map((_,i)=>+(cur+(7-i)*(dir==="max"?1:-1)*sp*.09*(1+Math.sin(i*1.7+id.length)*.5)).toFixed(2));tr[7]=cur;METRICS[id]={n,f,u,cur,tgt,badAt,dir,max,tr,owner,use,rem}}
const U1=["Org chart and workload"],U2=["Resource planning"],U3=["Performance management"],U4=["Journey maps"];
MX("m_pp_util","Planned utilization, next 12 weeks","Demand hours (project, incident, request, change, on-call, operational, meetings, training) ÷ available hours (contract hours − PTO − holidays), all people in scope, weeks 1 to 12","%",86,88,100,"min",130,"Resource office",U2.concat(U1),RM("sop","SOP-315","Level an overloaded team","Resource Agent","Proposes moves, contractors, agent offload or deferrals that bring each person under 100%"));
MX("m_pp_over","Over-allocated person-weeks","Person-weeks with demand above 100% of available hours ÷ all person-weeks in the next 12 weeks × 100","%",6,3,8,"min",25,"Resource office",U2,RM("sop","SOP-316","Clear an over-allocation","Resource Agent","Ranks four fixes per overloaded person: move, add a contractor, offload to an agent, defer"));
MX("m_pp_gap","Unstaffed demand","Demand hours with no named person (placeholder roles, ended contracts) ÷ 40 hours = full-time equivalents (FTE), next 12 weeks","FTE",3.2,2,5,"min",12,"Resource office",U2,RM("kb","KB-340","Fill a placeholder role","Resource Agent","Matches skills and availability across employees, contractors, agents and providers"));
MX("m_pp_rr","Resource requests answered in 5 days","Resource requests with a decision within 5 working days ÷ requests decided × 100","%",78,85,65,"max",100,"Resource office",U2,RM("sop","SOP-317","Speed up resource decisions","Resource Agent","Drafts the recommendation so the resource manager only confirms",true));
MX("m_pf_idx","Performance index","Weighted mean of peer percentiles for tickets resolved (15%), reopen rate (10%), SLA attainment (20%), project tasks on time (20%), story velocity (10%), approvals turnaround (10%), knowledge contributions (5%), XLA score (10%). Evidence for a conversation, never a rating","",62,55,40,"max",100,"People office",U3,RM("kb","KB-701","Read the performance evidence fairly","Review Coach","Shows each metric against peers with workload and on-call adjustments"));
MX("m_pf_revdone","Review completion","Manager reviews submitted ÷ reviews due this cycle × 100","%",58,90,60,"max",100,"People office",U3,RM("agent","Review Coach","Nudge managers with drafts to confirm","Review Coach","Drafts an evidence summary for each pending review; the manager writes the rating",true));
MX("m_pf_calspread","Calibration spread between managers","Standard deviation of each manager's average rating, across managers with 4 or more reports (rating scale 1 to 5)","",.34,.3,.5,"min",1,"People office",U3,RM("sop","SOP-702","Run a calibration session","Review Coach","Lists managers whose average rating is more than one deviation from the organization"));
MX("m_pf_align","Goals aligned to strategy","Individual goals linked to a team goal that links to a strategic objective ÷ all individual goals × 100","%",81,90,70,"max",100,"Strategy office",U3,RM("sop","SOP-703","Link orphan goals","Review Coach","Suggests the closest team goal for each unlinked goal"));
MX("m_pf_tix","Tickets resolved per FTE-week","Incidents and requests resolved ÷ FTE weeks worked, last 12 weeks","",9.4,9,6,"max",20,"Service desk",U3,RM("kb","KB-710","Raise first-contact resolution","Triage Agent","Routes known issues to knowledge and runbooks first"));
MX("m_pf_reopen","Reopen rate","Tickets reopened within 7 days ÷ tickets resolved × 100","%",5.1,5,9,"min",20,"Service desk",U3,RM("kb","KB-711","Close tickets with a verified fix","Triage Agent","Adds a verification step before closure"));
MX("m_pf_sla","SLA attainment","Tickets and tasks resolved within the service level target ÷ tickets and tasks with a target × 100","%",93,95,88,"max",100,"Service desk",U3,RM("sop","SOP-208","Recover a breaching queue","PMO Agent","Re-ranks the queue by time to breach"));
MX("m_pf_ontime","Project tasks on time","Tasks finished by their baseline finish ÷ tasks finished × 100","%",81,85,70,"max",100,"PMO",U3,RM("kb","KB-122","Replan a late task","PMO Agent","Proposes a new finish date and flags the dependent tasks"));
MX("m_pf_vel","Story velocity","Story points accepted per sprint, 3 sprint average (people on an agile release train only)","pts",21,20,14,"max",50,"Release office",U3,RM("kb","KB-720","Stabilize velocity","Test Agent","Looks for carry-over and unplanned work"));
MX("m_pf_appr","Approvals turnaround","Median hours from approval request to decision, last 12 weeks","h",9,8,18,"min",48,"Process office",U3,RM("agent","Review Coach","Remind approvers before the target","Review Coach","Sends a nudge at 75% of the approval target",true));
MX("m_pf_kb","Knowledge contributions","Articles written or improved and reused ≥ 3 times, per person per quarter","",1.6,2,.5,"max",6,"Knowledge office",U3,RM("agent","Knowledge Curator","Draft an article from a resolved ticket","Knowledge Curator","Turns a resolved ticket into a draft the owner publishes"));
MX("m_pf_xla","Experience (XLA) score","Mean of the 1 to 5 experience score people give after their work with this person or team, last 90 days","",4.1,4.2,3.6,"max",5,"Experience office",U3,RM("sop","SOP-612","Fix the lowest experience moment","Portfolio Agent","Raises the lowest-scoring moment as demand"));
MX("m_pf_ag_acc","Agent work accepted without rework","Agent tasks accepted without a human edit ÷ agent tasks completed × 100","%",88,90,75,"max",100,"AI governance",U3,RM("sop","SOP-540","Review an agent's tier and guardrails","Test Agent","Replays 50 recent tasks and proposes a tier change"));
MX("m_pf_ag_esc","Agent escalation rate","Tasks the agent handed to a person ÷ tasks the agent started × 100","%",14,15,30,"min",50,"AI governance",U3,RM("sop","SOP-541","Reduce unneeded escalations","Test Agent","Finds escalations that matched a known pattern"));
MX("m_pf_ag_cost","Cost per agent task","Model and tool spend ÷ tasks completed, last 30 days","$",.42,.5,1,"min",2,"AI governance",U3,RM("sop","SOP-542","Cut cost per task","Test Agent","Tries a smaller model on the cheapest 20% of tasks"));
MX("m_pf_ag_guard","Guardrail violations","Actions blocked or redacted by the AI gateway ÷ actions attempted × 1000","",1.2,2,5,"min",10,"AI governance",U3,RM("sop","SOP-543","Tighten a guardrail","Test Agent","Replays the blocked actions against a tighter rule"));
MX("m_pf_ct_acc","Deliverables accepted first time","Contractor deliverables accepted without rework ÷ deliverables submitted × 100","%",84,90,70,"max",100,"Vendor management",U3,RM("sop","SOP-410","Raise a deliverable quality issue","Contract Analyst Agent","Cites the acceptance criteria in the SOW"));
MX("m_pf_ct_rate","Rate card variance","(Billed rate − rate card rate) ÷ rate card rate × 100, per contractor","%",2.4,0,10,"min",25,"Vendor management",U3,RM("sop","SOP-411","Correct a billed rate","Invoice Advisor","Holds the invoice line and asks for a corrected rate"));
MX("m_pf_msp_sla","Provider SLA attainment","Tickets resolved inside the contracted service level ÷ tickets resolved × 100","%",94,95,90,"max",100,"Vendor management",U3,RM("sop","SOP-412","Escalate a provider service miss","Contract Analyst Agent","Calculates the service credit due under the contract"));
MX("m_pf_msp_cred","Service credits claimed","Credits due under the contract for missed service levels, last quarter","$",4200,0,12000,"min",30000,"Vendor management",U3,RM("sop","SOP-413","Claim a service credit","Contract Analyst Agent","Drafts the credit claim with the missed tickets attached"));
MX("m_jr_auto","Journey automation coverage","Journey boxes whose fulfillment is rule-automated or agentic ÷ all journey boxes × 100","%",38,55,30,"max",100,"Experience office",U4,RM("sop","SOP-615","Make a box agentic","Portfolio Agent","Assesses knowledge, tools and approvals the box needs, then raises demand"));
MX("m_jr_xla","Journey experience score","Mean of the box experience scores (1 frustrated, 3 neutral, 5 delighted) across the stages of all journeys, weighted by volume","",3.4,3.9,3.1,"max",5,"Experience office",U4,RM("sop","SOP-612","Fix the lowest stage of a journey","Portfolio Agent","Raises the lowest-scoring pain point as a demand request"));
MX("m_jr_cov","Boxes linked to a process","Journey boxes linked to at least one workflow or process ÷ all journey boxes × 100","%",64,90,50,"max",100,"Experience office",U4,RM("sop","SOP-616","Link a box to its workflow","Portfolio Agent","Suggests the closest workflow by name, owner and service"));

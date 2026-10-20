/* ============ kit2: round 8 shared foundation (loaded after kit.js, before screens) ============
   Exposes: RNG, DIR/who/avatar/pchip/person360, WORK providers, TEAMS, multiPick (mp*), bigTable (bt*),
   linkedRecords (lr*), drawer full screen, tableFix, DATAMODEL, STD/stdChip, PROC/procCard, SCALE, legend.
   Read MODULE_GUIDE.md section "kit2" for usage. */
(function(){
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const RNG=seed=>{let s=0;for(const c of String(seed))s=(s*31+c.charCodeAt(0))>>>0;if(!s)s=1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}};
window.RNG=RNG;
S.k2=S.k2||{};S.mp=S.mp||{};S.mpSel=S.mpSel||{};S.bt=S.bt||{};S.lr=S.lr||{};S.proc=S.proc||{};S.scale=S.scale||false;

/* ---------------- directory: people, AI agents, contractors, managed service providers ---------------- */
const KINDS={human:"Employee",ai:"AI agent",contractor:"Contractor",msp:"Managed service provider"};
window.KINDS=KINDS;
const TEAMS=[
 {id:"pmo",n:"PMO",mgr:"Maya Ortiz"},{id:"plat",n:"Platform team",mgr:"Priya Shah"},{id:"data",n:"Data team",mgr:"Dev Rao"},
 {id:"arch",n:"Architecture",mgr:"Jordan Lee"},{id:"ops",n:"Ops team",mgr:"Sam Patel"},{id:"edit",n:"Editors",mgr:"Chief Editor"},
 {id:"desk",n:"Service desk",mgr:"Tom Becker"},{id:"fin",n:"Finance",mgr:"Avery Chen"},{id:"chg",n:"Change management",mgr:"Nia Brooks"},
 {id:"sec",n:"Security",mgr:"Rina Okafor"},{id:"lumen",n:"Lumen (vendor)",mgr:"Marco Ellis"},{id:"agents",n:"AI agents",mgr:"Maya Ortiz"}];
const D=(name,kind,role,team,o)=>Object.assign({id:name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),name,kind,role,team,org:kind==="human"?"Meridian Standards Foundation":"",skills:[],loc:"Remote",hrs:40,rate:0},o||{});
const DIR=[
 D("Maya Ortiz","human","Portfolio lead","PMO",{c:"--p4",email:"maya.ortiz@meridian.example",skills:["Portfolio management","PMP","Vendor management","Risk"],loc:"Washington, DC",mgr:"Casey Rowan",tenure:7}),
 D("Priya Shah","human","Project manager","Platform team",{c:"--s3",email:"priya.shah@meridian.example",skills:["PMP","Agile delivery","Release planning","Stakeholder management"],loc:"Norwalk, CT",mgr:"Maya Ortiz",tenure:5}),
 D("Dev Rao","human","Project manager","Data team",{c:"--u3",email:"dev.rao@meridian.example",skills:["Data engineering","PMP","Azure Data Factory","Taxonomy"],loc:"Chicago, IL",mgr:"Maya Ortiz",tenure:4}),
 D("Tom Becker","human","Service desk lead","Service desk",{c:"--e4",email:"tom.becker@meridian.example",skills:["ITIL 4","Incident management","ServiceNow","Major incident command"],loc:"Norwalk, CT",mgr:"Sam Patel",tenure:9}),
 D("Avery Chen","human","Controller","Finance",{c:"--w1",email:"avery.chen@meridian.example",skills:["Accounting","Standard 842","Invoice approval","Budgeting"],loc:"Norwalk, CT",mgr:"Casey Rowan",tenure:6}),
 D("Jordan Lee","human","Architect","Architecture",{c:"--p2",email:"jordan.lee@meridian.example",skills:["Enterprise architecture","Azure","Integration","TOGAF"],loc:"Remote",mgr:"Casey Rowan",tenure:8}),
 D("Sam Patel","human","Platform engineer","Ops team",{c:"--s2",email:"sam.patel@meridian.example",skills:["Azure","Kubernetes","Terraform","On-call","Observability"],loc:"Remote",mgr:"Casey Rowan",tenure:5}),
 D("Nia Brooks","human","Change manager","Change management",{c:"--u2",email:"nia.brooks@meridian.example",skills:["ITIL 4 Change","CAB facilitation","Risk assessment","Release coordination"],loc:"Norwalk, CT",mgr:"Sam Patel",tenure:3}),
 D("Chief Editor","human","Chief editor","Editors",{c:"--p3",email:"chief.editor@meridian.example",skills:["Standards writing","Editorial review","Standards","Acceptance testing"],loc:"Norwalk, CT",mgr:"Casey Rowan",tenure:12}),
 D("Rina Okafor","human","Security lead","Security",{c:"--e3",email:"rina.okafor@meridian.example",skills:["Entra ID","Defender","NIST CSF","Access reviews","CISSP"],loc:"Remote",mgr:"Casey Rowan",tenure:4}),
 D("Casey Rowan","human","Chief information officer","PMO",{c:"--p1",email:"casey.rowan@meridian.example",skills:["Executive sponsor","Portfolio","Strategy"],loc:"Norwalk, CT",tenure:6}),
 D("Marco Ellis","contractor","Lead engineer, search indexer","Lumen (vendor)",{org:"Lumen Search Services",c:"--w2",email:"marco.ellis@lumen.example",skills:["Search indexing","Elasticsearch","Java","Relevance tuning"],loc:"Austin, TX",rate:165,contract:"SOW-4",end:"2027-03-31",hrs:40}),
 D("Hana Koval","contractor","Taxonomy engineer","Lumen (vendor)",{org:"Lumen Search Services",c:"--w3",email:"hana.koval@lumen.example",skills:["Taxonomy","Python","NLP","Ontology"],loc:"Prague (remote)",rate:150,contract:"SOW-4",end:"2027-03-31"}),
 D("Ravi Menon","contractor","Site reliability engineer","Ops team",{org:"Northwind Staffing",c:"--w4",email:"ravi.menon@northwind.example",skills:["Azure","Observability","On-call","Terraform"],loc:"Remote",rate:140,contract:"PO-7712",end:"2027-01-29"}),
 D("Elise Park","contractor","QA automation contractor","Platform team",{org:"Northwind Staffing",c:"--w1",email:"elise.park@northwind.example",skills:["Test automation","Playwright","API testing"],loc:"Remote",rate:110,contract:"PO-7713",end:"2026-12-18"}),
 D("Lumen Search Services","msp","Managed service provider: search and indexing","Lumen (vendor)",{org:"Lumen Search Services",c:"--w2",skills:["Search operations","Indexing","Relevance"],loc:"Austin, TX",contract:"MSA-2025-LUM",sla:"Tier 2 search support, 24x5",rate:0}),
 D("Northwind Managed Services","msp","Managed service provider: service desk and endpoint","Service desk",{org:"Northwind Managed Services",c:"--e4",skills:["Tier 1 service desk","Endpoint management","Intune","Patching"],loc:"Phoenix, AZ",contract:"MSA-2024-NWD",sla:"Tier 1 desk 7am to 7pm ET, 15 minute response",rate:0}),
 D("Contoso Cloud Operations","msp","Managed service provider: Azure operations","Ops team",{org:"Contoso Cloud Operations",c:"--s3",skills:["Azure operations","Backup and restore","Monitoring","FinOps"],loc:"Seattle, WA",contract:"MSA-2026-CON",sla:"Tier 1 platform monitoring 24x7",rate:0}),
 D("First Officer","ai","Meetings and follow-up agent","AI agents",{c:"--u3",agent:"fo",skills:["Meetings","Transcripts","Action items"],hrs:168}),
 D("Invoice Advisor","ai","Invoice review agent","AI agents",{c:"--w1",agent:"ia",skills:["Invoices","Purchase orders","Contracts"],hrs:168}),
 D("Knowledge Curator","ai","Knowledge drafting agent","AI agents",{c:"--s3",agent:"kc",skills:["Articles","Search index"],hrs:168}),
 D("Test Agent","ai","Quality and testing agent","AI agents",{c:"--p4",agent:"tq",skills:["Test runner","Sandbox"],hrs:168}),
 D("Triage Agent","ai","Incident triage agent","AI agents",{c:"--e4",skills:["Incident classification","Routing","Similar incidents"],hrs:168}),
 D("PMO Agent","ai","Schedule and portfolio agent","AI agents",{c:"--p2",skills:["Critical path","Forecasting","Status drafting"],hrs:168}),
 D("Change Risk Agent","ai","Change risk scoring agent","AI agents",{c:"--u2",skills:["Change risk","Collision detection","CMDB impact"],hrs:168}),
 D("Contract Analyst Agent","ai","Contract and SOW analysis agent","AI agents",{c:"--w3",skills:["Clause extraction","Playbook matching","Obligation tracking"],hrs:168})
];
const ALIAS={"Lumen":"Lumen Search Services","Lumen (vendor)":"Lumen Search Services","Northwind":"Northwind Managed Services","Service desk":"Northwind Managed Services","Maya":"Maya Ortiz","Priya":"Priya Shah"};
window.DIR=DIR;window.TEAMS=TEAMS;
const who=n=>{if(!n)return null;const k=ALIAS[n]||n;return DIR.find(d=>d.name===k||d.id===k)||null};
window.who=who;
/* make every module see the added people in forms (PEOPLE is the kit's assignable list) */
[["Chief Editor","Chief editor","--p3"],["Rina Okafor","Security lead","--e3"],["Marco Ellis","Contractor, Lumen","--w2"],["Hana Koval","Contractor, Lumen","--w3"],["Ravi Menon","Contractor, Northwind","--w4"],["Triage Agent","AI agent","--e4"],["PMO Agent","AI agent","--p2"],["Northwind Managed Services","Managed service provider","--e4"]].forEach(p=>{if(!PEOPLE.some(x=>x[0]===p[0]))PEOPLE.push(p)});

/* ---------------- avatars (illustrated, deterministic, no external images) ---------------- */
const SKIN=["#f3d2b8","#e8b894","#d39e78","#b97d56","#8d5a3a","#6b4128"],HAIR=["#2b2118","#4a3222","#6b4a2e","#8a6a3d","#b89455","#1d1a1a","#7d7d86","#a0502d"],BG=["#cfe3ea","#e1d6ee","#f2dfc6","#d3ead7","#f0d3d6","#d5dcf2","#e8e3c6","#cdebe6"],SHIRT=["#2f6b86","#6a4c93","#c9703a","#3f8a5a","#a8434f","#3d56a0","#8a7a2f","#2c7f78"];
function avSVG(r,size){const rnd=RNG(r.name);const pick=a=>a[Math.floor(rnd()*a.length)];const bg=pick(BG),sh=pick(SHIRT),skin=pick(SKIN),hair=pick(HAIR),style=Math.floor(rnd()*6),gl=rnd()<.28;const s=size;
 if(r.kind==="ai"){const c1=["#6a5acd","#2f9e9a","#c86b3c","#4d7cc9","#9a4fa3","#3c9a5f"][Math.floor(rnd()*6)];return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><rect width="64" height="64" fill="${bg}"/><circle cx="32" cy="34" r="22" fill="${c1}" opacity=".18"/><line x1="32" y1="9" x2="32" y2="17" stroke="${c1}" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="8" r="3.4" fill="${c1}"/><rect x="14" y="17" width="36" height="30" rx="12" fill="${c1}"/><rect x="19" y="24" width="26" height="16" rx="8" fill="#0f1a24" opacity=".85"/><circle cx="26.5" cy="32" r="3.2" fill="#9ff3e7"/><circle cx="37.5" cy="32" r="3.2" fill="#9ff3e7"/><rect x="22" y="49" width="20" height="9" rx="4.5" fill="${c1}" opacity=".8"/><rect x="9" y="27" width="4" height="12" rx="2" fill="${c1}"/><rect x="51" y="27" width="4" height="12" rx="2" fill="${c1}"/></svg>`}
 if(r.kind==="msp"){const m=r.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("");const c1=["#2f6b86","#6a4c93","#c9703a","#3f8a5a","#a8434f"][Math.floor(rnd()*5)];return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><rect width="64" height="64" rx="16" fill="${c1}"/><path d="M0 44c14-8 26 6 40-2s16-10 24-6v28H0z" fill="#fff" opacity=".13"/><circle cx="46" cy="16" r="7" fill="#fff" opacity=".2"/><text x="32" y="40" text-anchor="middle" font-size="24" font-weight="800" fill="#fff" font-family="Hanken Grotesk,system-ui,sans-serif">${H(m)}</text></svg>`}
 const hairPaths=[`<path d="M19 27c0-9 5-14 13-14s13 5 13 14c-3-5-7-7-13-7s-10 2-13 7z" fill="${hair}"/>`,`<path d="M18 29c-1-10 5-17 14-17s15 7 14 17c-2-6-6-9-11-10-4 3-10 6-17 10z" fill="${hair}"/>`,`<path d="M17 38c-2-14 3-26 15-26s17 12 15 26c-1 4-3 5-5 5V28c-5-1-10-4-12-8-2 4-6 7-10 8v15c-2 0-3-1-3-5z" fill="${hair}"/>`,`<circle cx="32" cy="11" r="6" fill="${hair}"/><path d="M19 27c0-9 5-13 13-13s13 4 13 13c-3-5-7-7-13-7s-10 2-13 7z" fill="${hair}"/>`,`<g fill="${hair}"><circle cx="21" cy="21" r="6"/><circle cx="29" cy="15" r="7"/><circle cx="38" cy="16" r="7"/><circle cx="44" cy="23" r="6"/></g>`,`<path d="M22 38c0 7 4 10 10 10s10-3 10-10c-3 3-6 4-10 4s-7-1-10-4z" fill="${hair}"/>`];
 let g=`<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><rect width="64" height="64" fill="${bg}"/>`;
 if(style===2)g+=hairPaths[2].replace(/<path/,'<path transform="translate(0 3)"');
 g+=`<path d="M8 64c0-12 10-17 24-17s24 5 24 17z" fill="${sh}"/><rect x="28" y="38" width="8" height="10" rx="3" fill="${skin}"/><ellipse cx="32" cy="28" rx="12.5" ry="14" fill="${skin}"/>`;
 if(style!==2)g+=hairPaths[style];else g+=`<path d="M19 27c0-9 5-14 13-14s13 5 13 14c-3-5-7-7-13-7s-10 2-13 7z" fill="${hair}"/>`;
 g+=`<circle cx="27.4" cy="28.5" r="1.5" fill="#1d1a1a"/><circle cx="36.6" cy="28.5" r="1.5" fill="#1d1a1a"/><path d="M28 34.5c2.5 2 5.5 2 8 0" stroke="#7a3b2b" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
 if(gl)g+=`<g fill="none" stroke="#2b2b33" stroke-width="1.3"><circle cx="27.4" cy="28.5" r="3.8"/><circle cx="36.6" cy="28.5" r="3.8"/><path d="M31.2 28.5h1.6"/></g>`;
 if(r.kind==="contractor")g+=`<path d="M19 22c1-8 6-11 13-11s12 3 13 11z" fill="#f2b233"/><rect x="17.5" y="21" width="29" height="3.2" rx="1.6" fill="#e39b12"/><rect x="29.5" y="10.5" width="5" height="5" rx="1.5" fill="#e39b12"/>`;
 return g+"</svg>"}
function avatar(name,o){o=o||{};const r=typeof name==="object"?name:(who(name)||{name:String(name||"?"),kind:"human"});const s=o.size||36;const k=r.kind||"human";
 const badge=k==="ai"?"AI":k==="contractor"?"C":k==="msp"?"M":"";
 return `<span class="avx k-${k}" style="width:${s}px;height:${s}px" title="${H(r.name)}${k!=="human"?" · "+KINDS[k]:""}">${avSVG(r,s)}${badge&&s>=28?`<b class="kb">${badge}</b>`:""}</span>`}
window.avatar=avatar;
const kindPill=k=>`<span class="kindpill ${k}"><i></i>${KINDS[k]}</span>`;
window.kindPill=kindPill;
function pchip(name,o){o=o||{};const r=who(name);return `<button type="button" class="pchipx" data-person="${H(r?r.name:name)}">${avatar(name,{size:o.size||26})}<span>${H(r?r.name:name)}${o.role&&r?` <small>${H(r.role)}</small>`:""}</span></button>`}
window.pchip=pchip;

/* ---------------- work providers: every module registers what it assigns to a person ---------------- */
const WORK=[];window.WORK=WORK;
/* provider: {kind:"Incidents", tag:"INC", fn:(name,rec)=>[{id,t,sub,due:"Oct 9",st:"warn|bad|good|mute",hrs:2,go:()=>go("itsm_inc",id)}]} */
WORK.push({kind:"Project tasks",tag:"TASK",fn:(n,r)=>TASKS.filter(t=>t.own===n||(t.res||[]).some(x=>x[0]===n||(r&&r.kind!=="human"&&x[0]===r.team))).filter(t=>t.pct<100).map(t=>({id:t.id,t:t.n,sub:(PROJ.find(p=>p.id===t.p)||{}).n+" · "+t.pct+"% done",due:"",st:t.pct>0?"info":"mute",hrs:t.ms?0:6,go:()=>go("plan",t.p)}))});
WORK.push({kind:"Projects led",tag:"PROJ",fn:n=>PROJ.filter(p=>p.owner===n).map(p=>({id:p.id,t:p.n,sub:"Project manager",st:"info",hrs:8,go:()=>go("plan",p.id)}))});
WORK.push({kind:"Meetings this week",tag:"MTG",fn:n=>MEETINGS.filter(m=>(m.att||m.who||[]).some&&(m.att||m.who||[]).includes&&(m.att||m.who||[]).includes(n)).slice(0,8).map(m=>({id:m.id,t:m.t,sub:"Oct "+m.d,st:"mute",hrs:1,go:()=>go("fo",m.id)}))});
WORK.push({kind:"Invoices to approve",tag:"INV",fn:n=>INVOICES.filter(i=>i.st!=="paid"&&(n==="Avery Chen"||n==="Casey Rowan")).slice(0,4).map(i=>({id:i.id,t:i.id+" "+(i.v||i.vendor||""),sub:"Awaiting approval",st:"warn",hrs:1,go:()=>go("inv",i.id)}))});
const workFor=n=>{const out=[];WORK.forEach(w=>{let rows=[];try{rows=w.fn(n,who(n))||[]}catch(e){}if(rows.length)out.push({kind:w.kind,tag:w.tag,rows})});return out};
window.workFor=workFor;
function workload(n){const r=who(n)||{};const w=workFor(n);const hrs=w.reduce((a,g)=>a+g.rows.reduce((b,x)=>b+(x.hrs||1),0),0);const cap=r.hrs||40;const base=r.kind==="ai"?20:r.kind==="msp"?0:4;const pct=r.kind==="msp"?Math.round(52+RNG(n)()*38):Math.round((hrs+base)/cap*100);return {hrs,cap,pct,items:w.reduce((a,g)=>a+g.rows.length,0)}}
window.workload=workload;
const P360_TABS=[];window.P360_TABS=P360_TABS;

/* ---------------- drawer: expand to full screen ---------------- */
const _od=window.openDrawer;
window.openDrawer=function(html){_od(html);const d=document.getElementById("drawer");if(!d)return;if(!d.querySelector(".dexpand")){const b=document.createElement("button");b.type="button";b.className="btn quiet dexpand";b.setAttribute("data-dexpand","");d.insertBefore(b,d.firstChild.nextSibling)}
 d.classList.toggle("dfull",!!S.k2.dfull);const b=d.querySelector(".dexpand");if(b)b.textContent=S.k2.dfull?"Exit full screen":"Full screen"};
document.addEventListener("click",e=>{const b=e.target.closest("[data-dexpand]");if(!b)return;S.k2.dfull=!S.k2.dfull;const d=document.getElementById("drawer");d.classList.toggle("dfull",S.k2.dfull);b.textContent=S.k2.dfull?"Exit full screen":"Full screen";audit("drawer full screen",S.k2.dfull?"on":"off")});

/* ---------------- person 360 ---------------- */
function person360(name){const r=who(name);if(!r){toast("No profile for "+name,"warn");return}
 const wl=workload(r.name),W=workFor(r.name);const rnd=RNG(r.name+"perf");const mgr=r.mgr?who(r.mgr):null;const team=TEAMS.find(t=>t.n===r.team);
 const peers=DIR.filter(d=>d.kind===r.kind&&d.team===r.team&&d.name!==r.name).map(d=>({d,w:workload(d.name)})).sort((a,b)=>a.w.pct-b.w.pct);
 const verdict=r.kind==="msp"?(wl.pct>85?["bad","Near contract capacity: expect queue growth; raise a change order or shift work"]:["good","Within contracted capacity"]):wl.pct<75?["good",`Yes, about ${Math.round((75-wl.pct)/100*r.hrs)} hours a week of room`]:wl.pct<=95?["warn","Borderline: take new work only if something moves"]:["bad","No: already above sustainable load"+(peers[0]?`; ${peers[0].d.name} is at ${peers[0].w.pct}%`:"")];
 const stat=(l,v,sub,cls)=>`<div class="stat ${cls||""}"><small>${l}</small><span class="num" data-role="metric">${v}</span><em>${sub}</em></div>`;
 const perf=[["On-time delivery",Math.round(80+rnd()*18),"items finished by due date ÷ items finished"],["Quality (rework free)",Math.round(78+rnd()*20),"items accepted first time ÷ items delivered"],["SLA and OLA adherence",Math.round(84+rnd()*14),"items within target time ÷ items with a target"],["Collaboration",Math.round(70+rnd()*26),"peer feedback score, last 4 quarters"]];
 const peerAvg=[88,90,91,82];
 const pb=(l,v,f,i)=>`<div style="margin:12px 0"><div class="row sp"><b>${l}</b><span class="num" data-role="metric">${v}%</span></div><div class="loadbar"><u style="width:${v}%;background:${v>=peerAvg[i]?"var(--good-f)":v>=peerAvg[i]-6?"var(--warn-f)":"var(--bad-f)"}"></u></div><div class="row sp muted small"><span>${f}</span><span>peer median ${peerAvg[i]}%</span></div></div>`;
 const lrg=W.map(g=>({key:g.kind,label:g.kind,rows:g.rows.map(x=>({id:x.id,t:x.t,sub:x.sub,tag:x.due||x.tag||"",st:x.st,go:x.go}))}));
 const own=r.kind==="human"?"":r.kind==="ai"?"Owner: "+((AGENTS.find(a=>a.id===r.agent)||{}).owner||"PMO"):"Contract "+(r.contract||"");
 const tabs=["Overview","On their plate","Performance"].concat(P360_TABS.map(t=>t.label));const panes=[
  `<div class="p360grid">${stat("Load",wl.pct+"%",wl.hrs+" of "+wl.cap+" hours a week",wl.pct>95?"crit":"")}${stat("Open items",wl.items,"across "+W.length+" areas")}${stat("Skills",r.skills.length,"in the skills database")}${stat(r.kind==="human"?"Next time off":r.kind==="ai"?"Autonomy":"Contract ends",r.kind==="human"?"Nov 24":r.kind==="ai"?((AGENTS.find(a=>a.id===r.agent)||{}).auto!=null?AUTO_LEVELS[Math.max(0,(AGENTS.find(a=>a.id===r.agent)||{}).auto)]||"Suggest":"Act with approval"):(r.end?new Date(r.end+"T00:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}):"Open"),r.kind==="human"?"approved PTO, 3 days":r.kind==="ai"?"set in AI Control Tower":r.contract||"")}</div>
   <div class="row" style="margin:8px 0"><span class="pill ${verdict[0]}">${verdict[0]==="good"?"Can take more":verdict[0]==="warn"?"Borderline":"At capacity"}</span><span class="muted">${verdict[1]}</span></div>
   <div class="loadbar" style="margin:8px 0 18px"><u style="width:${Math.min(100,wl.pct)}%;background:${wl.pct>95?"var(--bad-f)":wl.pct>75?"var(--warn-f)":"var(--good-f)"}"></u></div>
   <div class="eyebrow">Skills</div><div class="row" style="margin:8px 0 14px">${r.skills.map(s=>`<span class="pill info">${H(s)}</span>`).join("")||'<span class="muted">None recorded</span>'}</div>
   <dl class="kv"><dt>Type</dt><dd>${kindPill(r.kind)}</dd><dt>Role</dt><dd>${H(r.role)}</dd><dt>Team</dt><dd>${H(r.team||"")}</dd>${r.org&&r.kind!=="human"?`<dt>Organization</dt><dd>${H(r.org)}</dd>`:""}${mgr?`<dt>Reports to</dt><dd>${window.ownerChip?ownerChip(mgr.name,{role:"Manager"}):pchip(mgr.name)}</dd>`:""}${r.contract?`<dt>Contract</dt><dd>${H(r.contract)}${r.sla?" · "+H(r.sla):""}</dd>`:""}${r.rate?`<dt>Rate</dt><dd class="num">$${r.rate} an hour</dd>`:""}${r.loc?`<dt>Location</dt><dd>${H(r.loc)}</dd>`:""}${r.email?`<dt>Email</dt><dd>${H(r.email)}</dd>`:""}${own?`<dt>Accountable</dt><dd>${r.kind==="ai"&&window.ownerChip?ownerChip((AGENTS.find(a=>a.id===r.agent)||{}).owner||"PMO",{role:"Sponsor"}):H(own)}</dd>`:""}</dl>
   <div class="row" style="margin-top:14px"><button class="btn primary" data-person-assign="${H(r.name)}">Assign work</button><button class="btn" data-own-msg="person:${H(r.name)}">Message</button><button class="btn" data-person-ask="${H(r.name)}">Ask Oukala about ${H(r.name.split(" ")[0])}</button></div>`,
  `${lrHTML({id:"p360-"+r.id,groups:lrg,limit:6,search:true,empty:"Nothing assigned right now."})}`,
  `<div class="row" style="margin:0 0 6px"><span class="pill ${perf[0][1]>=88?"good":"warn"}" data-role="metric">On-time delivery ${perf[0][1]}% vs peer median 88% (${perf[0][1]-88>=0?"+":""}${perf[0][1]-88} pts)</span>${r.kind==="ai"?'<span class="pill mute">+ guardrail hits, cost per task</span>':""}</div>${perf.map((p,i)=>pb(p[0],p[1],p[2],i)).join("")}<p class="muted small">Baselines come from the peer median for the same role and team over four quarters. Reviews and goals live in Org chart and workload.</p>`
 ].concat(P360_TABS.map(t=>{try{return t.fn(r)}catch(e){return ""}}));
 openDrawer(`<div class="p360h">${avatar(r,{size:76})}<div><h2>${H(r.name)}</h2><div class="p360kv"><span>${H(r.role)}</span>${r.team?`<span>${H(r.team)}</span>`:""}${kindPill(r.kind)}</div></div></div>${views("p360",tabs,panes)}`);audit("opened person 360",r.name)}
window.person360=person360;
document.addEventListener("click",e=>{const p=e.target.closest("[data-person]");if(p&&!p.closest("[data-owner]")){e.stopPropagation();person360(p.dataset.person);return}
 const a=e.target.closest("[data-person-assign]");if(a){const n=a.dataset.personAssign;openForm({id:"k2_assign",title:"Assign work to "+n,story:"Creates a task in the chosen project and notifies "+n+". Their load updates immediately.",submit:"Assign",fields:[{k:"proj",label:"Project",type:"select",opts:PROJ.map(p=>[p.id,p.n]),req:true},{k:"t",label:"Task",type:"text",req:true,ph:"What needs doing"},{k:"hrs",label:"Hours a week",type:"number",min:1,max:40}],live:v=>{const w=workload(n);const add=+v.hrs||0;const np=Math.round((w.hrs+add+4)/w.cap*100);return `<p class="story">${H(n)} goes from <b>${w.pct}%</b> to <b>${np}%</b> load.${np>95?" That is above a sustainable level.":""}</p>`},onSubmit:v=>{TASKS.push({id:"k2_"+Date.now(),p:v.proj,n:v.t,dur:5,pred:[],pct:0,own:n,res:[]});audit("assigned work",n+": "+v.t);toast("Assigned to "+n,"good");closeDrawer();render()}});return}
 const q=e.target.closest("[data-person-ask]");if(q){const n=q.dataset.personAsk;const c=document.getElementById("chatOpen");if(c)c.checked=true;const i=document.getElementById("chatq");if(i){i.value="What is on "+n+"'s plate and can they take more?";i.focus()}}});

/* ---------------- multi-select picker ---------------- */
/* mpHTML({id,label,opts:[{v,l,sub,grp,c}],all:"All projects",def:[values]|null,max}) ; mpGet(id,opts?) -> array of selected values ([] never; all selected means every value) */
const MPOPT={};window.MPOPT=MPOPT;
function mpGet(id){const o=(MPOPT[id]||{}).opts||[];const sel=S.mpSel[id];if(!sel)return o.map(x=>x.v);return o.map(x=>x.v).filter(v=>sel.includes(v))}
function mpHTML(c){MPOPT[c.id]=c;const o=c.opts;const sel=mpGet(c.id);const all=sel.length===o.length;const st=S.mp[c.id]||{};
 const lab=all?(c.all||"All"):sel.length===0?"None":sel.length<=2?sel.map(v=>(o.find(x=>x.v===v)||{}).l).join(", "):sel.length+" of "+o.length;
 return `<details class="mp" data-mp="${H(c.id)}" ${st.open?"open":""}><summary><span class="muted small">${H(c.label||"")}</span><span class="mpl">${H(lab)}</span><span class="mpn">${sel.length}</span></summary><div class="mpp glass" role="listbox" aria-label="${H(c.label||"Select")}"><input type="search" placeholder="Search ${o.length} items" data-mp-q="${H(c.id)}" value="${H(st.q||"")}" aria-label="Search"><div class="mpq"><button type="button" class="btn quiet" data-mp-all="${H(c.id)}">Select all</button><button type="button" class="btn quiet" data-mp-none="${H(c.id)}">Clear</button><button type="button" class="btn quiet" data-mp-inv="${H(c.id)}">Invert</button></div><div class="mpl2">${mpList(c.id)}</div><div class="mpf"><span>${sel.length} selected</span><span>Showing ${mpVis(c.id).length}</span></div></div></details>`}
function mpVis(id){const c=MPOPT[id],q=((S.mp[id]||{}).q||"").toLowerCase();return c.opts.filter(x=>!q||(x.l+" "+(x.sub||"")+" "+(x.grp||"")).toLowerCase().includes(q))}
function mpList(id){const sel=new Set(mpGet(id));const v=mpVis(id).slice(0,200);let g="",out="";v.forEach(x=>{if(x.grp&&x.grp!==g){g=x.grp;out+=`<div class="eyebrow" style="padding:8px 10px 2px">${H(g)}</div>`}out+=`<button type="button" class="mpo" role="option" aria-pressed="${sel.has(x.v)}" data-mp-opt="${H(id)}" data-v="${H(x.v)}"><i>✓</i><span>${H(x.l)}${x.sub?` <small>${H(x.sub)}</small>`:""}</span></button>`});return out||'<span class="muted small" style="padding:8px">No matches</span>'}
function mpSet(id,vals){S.mpSel[id]=vals;const c=MPOPT[id];if(c&&c.onChange)c.onChange(mpGet(id));S.mp[id]=Object.assign(S.mp[id]||{},{open:true});render()}
window.mpHTML=mpHTML;window.mpGet=mpGet;window.mpSet=mpSet;
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-mp-opt]")){const id=t.dataset.mpOpt,v=t.dataset.v,cur=mpGet(id);mpSet(id,cur.includes(v)?cur.filter(x=>x!==v):cur.concat(v));return}
 if(t=e.target.closest("[data-mp-all]")){mpSet(t.dataset.mpAll,MPOPT[t.dataset.mpAll].opts.map(x=>x.v));return}
 if(t=e.target.closest("[data-mp-none]")){mpSet(t.dataset.mpNone,[]);return}
 if(t=e.target.closest("[data-mp-inv]")){const id=t.dataset.mpInv,cur=mpGet(id);mpSet(id,MPOPT[id].opts.map(x=>x.v).filter(v=>!cur.includes(v)));return}
 if(!e.target.closest("details.mp")){let any=false;document.querySelectorAll("details.mp[open]").forEach(d=>{d.open=false;if(S.mp[d.dataset.mp])S.mp[d.dataset.mp].open=false;any=true})}});
document.addEventListener("input",e=>{const t=e.target.closest("[data-mp-q]");if(!t)return;const id=t.dataset.mpQ;S.mp[id]=Object.assign(S.mp[id]||{},{q:t.value,open:true});const l=t.closest(".mpp").querySelector(".mpl2");l.innerHTML=mpList(id);t.closest(".mpp").querySelector(".mpf span:last-child").textContent="Showing "+mpVis(id).length});
document.addEventListener("toggle",e=>{const d=e.target;if(d.matches&&d.matches("details.mp")){S.mp[d.dataset.mp]=Object.assign(S.mp[d.dataset.mp]||{},{open:d.open})}},true);

/* ---------------- big table: sort, search, facets, grouping, virtual scrolling ---------------- */
/* btHTML({id,cols:[{k,label,fmt:r=>html,val:r=>value,wrap,w}],rows:[...]|()=>[...],key:"id",h:520,rowH:40,group:"k"|null,facets:["k"],open:rowId=>{},exportName:"cis"}) */
const BTC={};window.BTC=BTC;
const btRows=id=>{const c=BTC[id];return typeof c.rows==="function"?c.rows():c.rows};
function btFilter(id){const c=BTC[id],st=S.bt[id]=S.bt[id]||{q:"",sort:null,f:{}};let rows=btRows(id);const q=(st.q||"").toLowerCase();
 Object.entries(st.f||{}).forEach(([k,set])=>{if(set&&set.length){const col=c.cols.find(x=>x.k===k);rows=rows.filter(r=>set.includes(String((col&&col.val?col.val(r):r[k])??"")))}});
 if(q)rows=rows.filter(r=>c.cols.some(col=>String(col.val?col.val(r):r[col.k]??"").toLowerCase().includes(q)));
 if(st.sort){const col=c.cols.find(x=>x.k===st.sort.k);const g=r=>col&&col.val?col.val(r):r[st.sort.k];rows=rows.slice().sort((a,b)=>{const x=g(a),y=g(b);return(typeof x==="number"&&typeof y==="number"?x-y:String(x??"").localeCompare(String(y??""),undefined,{numeric:true}))*st.sort.d})}
 return rows}
function btFlat(id,rows){const c=BTC[id],st=S.bt[id];const gk=st.group!==undefined?st.group:c.group;if(!gk)return rows.map(r=>({r}));const col=c.cols.find(x=>x.k===gk);const m=new Map();rows.forEach(r=>{const k=String((col&&col.val?col.val(r):r[gk])??"None");(m.get(k)||m.set(k,[]).get(k)).push(r)});const out=[];[...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).forEach(([k,v])=>{out.push({g:k,n:v.length});v.forEach(r=>out.push({r}))});return out}
function btBody(id){const c=BTC[id],st=S.bt[id],rows=btFilter(id),flat=btFlat(id,rows),rh=c.rowH||40,h=c.h||520;const sc=document.querySelector(`[data-bt-scroll="${id}"]`);const top=sc?sc.scrollTop:0;const start=Math.max(0,Math.floor(top/rh)-8),end=Math.min(flat.length,start+Math.ceil(h/rh)+16);
 let b="";if(start>0)b+=`<tr style="height:${start*rh}px"><td colspan="${c.cols.length}" style="padding:0;border:0"></td></tr>`;
 for(let i=start;i<end;i++){const x=flat[i];if(x.g!==undefined){b+=`<tr class="grp" style="height:${rh}px"><td colspan="${c.cols.length}">${H(x.g)} <span class="muted">· ${x.n}</span></td></tr>`;continue}const r=x.r;b+=`<tr data-bt-row="${H(id)}" data-id="${H(r[c.key||"id"])}" style="height:${rh}px" tabindex="0">${c.cols.map(col=>`<td class="${col.wrap?"wrap":""} ${col.cls||""}">${col.fmt?col.fmt(r):H(r[col.k])}</td>`).join("")}</tr>`}
 if(end<flat.length)b+=`<tr style="height:${(flat.length-end)*rh}px"><td colspan="${c.cols.length}" style="padding:0;border:0"></td></tr>`;
 if(!flat.length)b=`<tr><td colspan="${c.cols.length}" class="wrap muted" style="padding:24px">No matches. Clear a filter or search to see more.</td></tr>`;
 return {b,n:rows.length,total:btRows(id).length}}
function btHTML(c){BTC[c.id]=c;const st=S.bt[c.id]=S.bt[c.id]||{q:"",sort:c.sort||null,f:{},group:undefined};const {b,n,total}=btBody(c.id);
 const facets=(c.facets||[]).map(k=>{const col=c.cols.find(x=>x.k===k);const vals=[...new Set(btRows(c.id).map(r=>String((col&&col.val?col.val(r):r[k])??"")))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));const fid="bt-"+c.id+"-"+k;MPOPT[fid]={id:fid,label:col?col.label:k,opts:vals.map(v=>({v,l:v||"None"})),all:"All",onChange:sel=>{S.bt[c.id].f[k]=sel.length===vals.length?[]:sel;S.bt[c.id].facetSync=1}};if(st.f[k]&&st.f[k].length&&!S.mpSel[fid])S.mpSel[fid]=st.f[k];return mpHTML(MPOPT[fid])}).join("");
 const gsel=c.groupBy&&c.groupBy.length?`<label class="muted small">Group by <select data-bt-group="${H(c.id)}"><option value="">None</option>${c.groupBy.map(k=>{const col=c.cols.find(x=>x.k===k);return `<option value="${H(k)}" ${(st.group!==undefined?st.group:c.group)===k?"selected":""}>${H(col?col.label:k)}</option>`}).join("")}</select></label>`:"";
 return `<div class="bt" data-bt="${H(c.id)}"><div class="bt-bar"><input type="search" placeholder="Search ${total.toLocaleString("en-US")} rows" value="${H(st.q)}" data-bt-q="${H(c.id)}" aria-label="Search table">${facets}${gsel}${c.exportName?`<button class="btn quiet" data-bt-export="${H(c.id)}">Export CSV</button>`:""}</div><div class="bt-scroll" data-bt-scroll="${H(c.id)}" style="--bt-h:${c.h||520}px"><table><thead><tr>${c.cols.map(col=>`<th data-bt-sort="${H(c.id)}" data-k="${H(col.k)}" scope="col" aria-sort="${st.sort&&st.sort.k===col.k?(st.sort.d>0?"ascending":"descending"):"none"}">${H(col.label)}<span class="sar">${st.sort&&st.sort.k===col.k?(st.sort.d>0?"▲":"▼"):""}</span></th>`).join("")}</tr></thead><tbody>${b}</tbody></table></div><div class="bt-foot"><span data-bt-count>${n.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} rows</span><span>Scroll for more · rows are drawn as you scroll</span></div></div>`}
function btRefresh(id){const root=document.querySelector(`[data-bt="${id}"]`);if(!root)return;const {b,n,total}=btBody(id);root.querySelector("tbody").innerHTML=b;root.querySelector("[data-bt-count]").textContent=n.toLocaleString("en-US")+" of "+total.toLocaleString("en-US")+" rows";root.querySelectorAll("th[data-bt-sort]").forEach(th=>{const st=S.bt[id];const on=st.sort&&st.sort.k===th.dataset.k;th.querySelector(".sar").textContent=on?(st.sort.d>0?"▲":"▼"):"";th.setAttribute("aria-sort",on?(st.sort.d>0?"ascending":"descending"):"none")})}
window.btHTML=btHTML;window.btRefresh=btRefresh;
document.addEventListener("scroll",e=>{const t=e.target;if(t&&t.dataset&&t.dataset.btScroll){cancelAnimationFrame(t._r);t._r=requestAnimationFrame(()=>{const root=t.closest("[data-bt]");const id=t.dataset.btScroll,st=S.bt[id],c=BTC[id];const rh=c.rowH||40;const rows=btFlat(id,btFilter(id));const start=Math.max(0,Math.floor(t.scrollTop/rh)-8);if(Math.abs(start-(t._s||0))>=4||start===0){t._s=start;const {b}=btBody(id);root.querySelector("tbody").innerHTML=b}})}},true);
document.addEventListener("input",e=>{const t=e.target.closest("[data-bt-q]");if(!t)return;const id=t.dataset.btQ;S.bt[id].q=t.value;const sc=document.querySelector(`[data-bt-scroll="${id}"]`);if(sc)sc.scrollTop=0;btRefresh(id)});
document.addEventListener("change",e=>{const g=e.target.closest("[data-bt-group]");if(g){S.bt[g.dataset.btGroup].group=g.value||null;btRefresh(g.dataset.btGroup)}});
document.addEventListener("click",e=>{let t;if(t=e.target.closest("[data-bt-sort]")){const id=t.dataset.btSort,k=t.dataset.k,st=S.bt[id];st.sort=st.sort&&st.sort.k===k?{k,d:-st.sort.d}:{k,d:1};btRefresh(id);return}
 if(t=e.target.closest("[data-bt-row]")){const c=BTC[t.dataset.btRow];if(c&&c.open)c.open(t.dataset.id);return}
 if(t=e.target.closest("[data-bt-export]")){const id=t.dataset.btExport,c=BTC[id],rows=btFilter(id);const csv=[c.cols.map(x=>x.label)].concat(rows.map(r=>c.cols.map(x=>x.val?x.val(r):r[x.k]))).map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n");try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=(c.exportName||id)+".csv";a.click();toast("Exported "+rows.length+" rows","good")}catch(err){toast("Export is not available here","warn")}audit("exported table",id+" · "+rows.length+" rows")}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"){const t=e.target.closest&&e.target.closest("[data-bt-row]");if(t){const c=BTC[t.dataset.btRow];if(c&&c.open)c.open(t.dataset.id)}}});
/* a facet change must refresh rows, since mpSet re-renders the whole screen the table is rebuilt from state */

/* ---------------- linked records: grouped accordions that stay usable at hundreds of rows ---------------- */
/* lrHTML({id,groups:[{key,label,rows:[{id,t,sub,tag,st,go:fn}]}],limit:6,search:true,empty}) */
const LRG={};window.LRG=LRG;
function lrHTML(c){LRG[c.id]=c;const st=S.lr[c.id]=S.lr[c.id]||{q:"",open:{},more:{}};const q=(st.q||"").toLowerCase();const total=c.groups.reduce((a,g)=>a+g.rows.length,0);
 const body=c.groups.map(g=>{let rows=g.rows;if(q)rows=rows.filter(r=>(r.t+" "+(r.sub||"")+" "+(r.id||"")).toLowerCase().includes(q));const lim=(st.more[g.key]||0)+(c.limit||6);const shown=rows.slice(0,lim);
  if(!rows.length&&q)return"";return `<details ${st.open[g.key]!==false&&(rows.length<=12||st.open[g.key])?"open":""} data-lr-d="${H(c.id)}" data-key="${H(g.key)}"><summary><span class="lrl">${H(g.label)}</span><span class="cnt">${rows.length}${q&&rows.length!==g.rows.length?" of "+g.rows.length:""}</span></summary><div class="lrb">${shown.map((r,i)=>`<button class="lri" data-lr-go="${H(c.id)}" data-g="${H(g.key)}" data-i="${g.rows.indexOf(r)}"><i class="lrd ${r.st||"mute"}" aria-hidden="true"></i><b>${H(r.t)}</b>${r.tag?`<em class="lrt">${H(r.tag)}</em>`:""}<small>${H(r.sub||"")}</small></button>`).join("")}${rows.length>shown.length?`<button class="btn quiet" data-lr-more="${H(c.id)}" data-key="${H(g.key)}">${rows.length-shown.length<=25?"Show the last "+(rows.length-shown.length):"Show 25 more ("+(rows.length-shown.length)+" left)"}</button>`:""}</div></details>`}).join("");
 return `<div class="lr" data-lr="${H(c.id)}">${c.search!==false&&total>6?`<input type="search" class="txtin" placeholder="Search ${total} linked records" value="${H(st.q)}" data-lr-q="${H(c.id)}" aria-label="Search linked records">`:""}${body||`<p class="muted">${H(c.empty||"No linked records.")}</p>`}</div>`}
window.lrHTML=lrHTML;
function lrRefresh(id){const root=document.querySelector(`[data-lr="${id}"]`);if(!root)return;const c=LRG[id];const tmp=document.createElement("div");tmp.innerHTML=lrHTML(c);const keep=root.querySelector("[data-lr-q]");root.replaceWith(tmp.firstElementChild);const n=document.querySelector(`[data-lr-q="${id}"]`);if(n&&keep&&document.activeElement===keep){n.focus();n.setSelectionRange(n.value.length,n.value.length)}}
document.addEventListener("input",e=>{const t=e.target.closest("[data-lr-q]");if(!t)return;S.lr[t.dataset.lrQ].q=t.value;const id=t.dataset.lrQ;const root=document.querySelector(`[data-lr="${id}"]`);const c=LRG[id];const tmp=document.createElement("div");tmp.innerHTML=lrHTML(c);const keep=t.value;root.replaceWith(tmp.firstElementChild);const n=document.querySelector(`[data-lr-q="${id}"]`);if(n){n.focus();n.setSelectionRange(keep.length,keep.length)}});
document.addEventListener("click",e=>{let t;if(t=e.target.closest("[data-lr-more]")){const id=t.dataset.lrMore,k=t.dataset.key;S.lr[id].more[k]=(S.lr[id].more[k]||0)+25;lrRefresh(id);return}
 if(t=e.target.closest("[data-lr-go]")){const c=LRG[t.dataset.lrGo];const g=c.groups.find(x=>x.key===t.dataset.g);const r=g&&g.rows[+t.dataset.i];if(r&&r.go)r.go()}});
document.addEventListener("toggle",e=>{const d=e.target;if(d.matches&&d.matches("details[data-lr-d]")){const st=S.lr[d.dataset.lrD];if(st)st.open[d.dataset.key]=d.open}},true);

/* ---------------- data model registry: SLAs, workflows, visualizations all read real fields from here ---------------- */
const DATAMODEL={tables:{},_v:0,_cv:-1,_c:0,cnt(){if(this._cv!==this._v){this._cv=this._v;this._c=Object.keys(this.tables).length}return this._c},register(t,def){this._v++;const cur=this.tables[t]||{label:def.label||t,fields:[],source:def.source||""};cur.label=def.label||cur.label;cur.source=def.source||cur.source;(def.fields||[]).forEach(f=>{const i=cur.fields.findIndex(x=>x.k===f.k);i>=0?cur.fields[i]=f:cur.fields.push(f)});this.tables[t]=cur;return cur},list(){return Object.entries(this.tables).map(([k,v])=>({k,label:v.label,n:v.fields.length}))},fields(t){return(this.tables[t]||{fields:[]}).fields}};
window.DATAMODEL=DATAMODEL;
const F=(k,label,type,o)=>Object.assign({k,label,type:type||"string"},o||{});
DATAMODEL.register("incident",{label:"Incident",source:"ITSM",fields:[F("number","Number"),F("short_description","Short description"),F("service","Service","ref"),F("ci","Configuration item","ref"),F("impact","Impact","enum",{opts:["1 - Service down","2 - Major degradation","3 - Minor degradation","4 - Single user"]}),F("urgency","Urgency","enum",{opts:["1 - Critical","2 - High","3 - Medium","4 - Low"]}),F("priority","Priority","enum",{calc:"from impact and urgency",opts:["P1","P2","P3","P4"]}),F("state","State","enum",{opts:["New","In progress","On hold","Resolved","Closed"]}),F("assignment_group","Assignment group","ref"),F("opened_at","Opened","datetime"),F("resolved_at","Resolved","datetime"),F("business_duration","Business time to resolve","duration"),F("sla_due","SLA due","datetime"),F("caller","Caller","ref")]});
DATAMODEL.register("change_request",{label:"Change request",source:"ITSM",fields:[F("number","Number"),F("type","Type","enum",{opts:["Standard","Normal","Emergency"]}),F("risk","Risk","enum",{opts:["Low","Moderate","High"]}),F("state","State","enum",{opts:["New","Assess","Authorize","Scheduled","Implement","Review","Closed"]}),F("service","Service","ref"),F("ci","Configuration item","ref"),F("start_date","Planned start","datetime"),F("end_date","Planned end","datetime"),F("assignment_group","Assignment group","ref"),F("approval","Approval","enum",{opts:["Not requested","Requested","Approved","Rejected"]})]});
DATAMODEL.register("request_item",{label:"Request item",source:"Service catalog",fields:[F("number","Number"),F("cat_item","Catalog item","ref"),F("offering","Service offering","ref"),F("requested_for","Requested for","ref"),F("opened_by","Opened by","ref"),F("state","State","enum",{opts:["Submitted","Approval","Fulfillment","Delivered","Closed","Cancelled"]}),F("price","Price","currency"),F("due_date","Due","datetime"),F("stage","Stage","string")]});
DATAMODEL.register("project",{label:"Project",source:"PPM",fields:[F("id","Project ID"),F("name","Name"),F("manager","Project manager","ref"),F("status","Status","enum",{opts:["On track","Watch","Needs action"]}),F("start","Start","date"),F("finish","Finish","date"),F("baseline_finish","Baseline finish","date"),F("percent_complete","Percent complete","percent"),F("budget","Budget at completion","currency"),F("actual_cost","Actual cost","currency"),F("spi","Schedule performance index","number"),F("cpi","Cost performance index","number")]});
DATAMODEL.register("project_task",{label:"Project task (WBS line)",source:"PPM",fields:[F("wbs","WBS code"),F("name","Task name"),F("planned_start","Planned start","date"),F("planned_finish","Planned finish","date"),F("actual_start","Actual start","date"),F("actual_finish","Actual finish","date"),F("duration","Duration (work days)","number"),F("percent_complete","Percent complete","percent"),F("predecessors","Predecessors","string"),F("owner","Owner","ref"),F("float","Total float","number"),F("milestone","Milestone","boolean")]});
DATAMODEL.register("config_item",{label:"Configuration item",source:"CMDB",fields:[F("name","Name"),F("class","Class","enum"),F("environment","Environment","enum",{opts:["Production","Test","Dev","DR"]}),F("operational_status","Operational status","enum",{opts:["Operational","Degraded","Non-operational","Retired"]}),F("owned_by","Owned by","ref"),F("support_group","Support group","ref"),F("business_criticality","Business criticality","enum",{opts:["1 - Mission critical","2 - Somewhat critical","3 - Less critical","4 - Not critical"]}),F("uptime_30d","Uptime, last 30 days","percent"),F("last_discovered","Last discovered","datetime")]});
DATAMODEL.register("business_service",{label:"Business service",source:"CMDB",fields:[F("name","Name"),F("service_owner","Service owner","ref"),F("tier","Tier","enum",{opts:["Tier 1","Tier 2","Tier 3"]}),F("availability_30d","Availability, last 30 days","percent"),F("monthly_cost","Monthly cost","currency"),F("users","Active users","number"),F("maturity","Maturity level","number")]});
DATAMODEL.register("invoice",{label:"Invoice",source:"Finance",fields:[F("id","Invoice number"),F("vendor","Vendor","ref"),F("amount","Amount","currency"),F("status","Status","enum"),F("due","Due date","date"),F("po","Purchase order","ref"),F("accepted_work","Accepted work","currency"),F("paid_to_date","Paid to date","currency")]});
DATAMODEL.register("person",{label:"Person, agent or provider",source:"Directory",fields:[F("name","Name"),F("kind","Type","enum",{opts:Object.values(KINDS)}),F("role","Role"),F("team","Team","ref"),F("manager","Manager","ref"),F("hours","Contracted hours","number"),F("load","Load","percent"),F("skills","Skills","list")]});
DATAMODEL.register("contract_line",{label:"Contract line (clause, commitment, outcome)",source:"Contract analyzer",fields:[F("clause","Clause"),F("type","Type","enum",{opts:["Deliverable","Milestone","SLA","Payment","Term","Liability","Assumption","Termination","Data protection"]}),F("measure","Measure"),F("target","Target"),F("due","Due","date"),F("playbook","Playbook match","enum",{opts:["Standard","Variance","Not in playbook"]}),F("owner","Owner","ref")]});

/* ---------------- standards registry ---------------- */
const STD={
 itil5:{n:"ITIL 5",by:"PeopleCert",d:"The service management framework: practices, value streams and a digital product and service view."},
 itil4:{n:"ITIL 4",by:"PeopleCert",d:"34 management practices around the service value system and the four dimensions."},
 tbm:{n:"TBM Taxonomy",by:"TBM Council",d:"Technology Business Management: cost pools, resource towers, solutions and consumers so spend can be traced from the ledger to the business."},
 csdm:{n:"CSDM 5",by:"ServiceNow",d:"open service data model: foundation, design, build, manage technical services and sell/consume domains."},
 pmbok:{n:"PMBOK",by:"PMI",d:"Project management performance domains and processes; PMP vocabulary for WBS, baselines, earned value and risk."},
 safe:{n:"SAFe",by:"Scaled Agile",d:"Scaled Agile Framework: agile release trains, program increments, features, enablers and the system demo."},
 cobit:{n:"COBIT 2019",by:"ISACA",d:"Governance and management objectives for enterprise IT."},
 iso20k:{n:"ISO/IEC 20000",by:"ISO",d:"Service management system requirements."},
 iso27k:{n:"ISO/IEC 27001",by:"ISO",d:"Information security management system."},
 nist:{n:"NIST CSF 2.0",by:"NIST",d:"Govern, identify, protect, detect, respond, recover."},
 cmmi:{n:"CMMI",by:"ISACA",d:"Capability maturity levels 1 to 5 across process areas."},
 togaf:{n:"TOGAF",by:"The Open Group",d:"Enterprise architecture method and content framework."},
 dmbok:{n:"DAMA-DMBOK",by:"DAMA",d:"Data management knowledge areas and maturity."},
 kcs:{n:"KCS v6",by:"Consortium for Service Innovation",d:"Knowledge-centered service: capture, structure, reuse, improve."},
 xla:{n:"Experience level agreements",by:"Industry practice",d:"Targets for how people feel about service, alongside SLAs and OLAs."},
 devops:{n:"DORA metrics",by:"DORA",d:"Deployment frequency, lead time for changes, change failure rate, time to restore."},
 bpmn:{n:"BPMN 2.0 and DMN",by:"OMG",d:"Process and decision notation."}
};
window.STD=STD;
window.stdChip=(key,detail)=>{const s=STD[key];if(!s)return"";const id=pid();return `<button class="stdchip" popovertarget="${id}">${H(s.n)}</button><div popover id="${id}" class="pop glass"><div class="eyebrow">Industry standard</div><h3>${H(s.n)}</h3><p class="muted">${H(s.d)}</p>${detail?`<p class="story">${H(detail)}</p>`:""}<div class="row"><span class="pill mute">${H(s.by)}</span><button class="btn" popovertarget="${id}" popovertargetaction="hide">Close</button></div></div>`};

/* ---------------- process strips: every screen shows the process behind it; admins can edit ---------------- */
const PROC={defs:{},reg(screen,def){this.defs[screen]=def}};window.PROC=PROC;
window.procCard=function(screen,opts){opts=opts||{};const d=PROC.defs[screen];if(!d)return"";const ed=S.proc[screen]||d.steps;
 return card(d.title||"How this works","Each step is done by a human, a robot (a fixed rule that runs when its trigger fires) or an AI agent, or is an approval gate, and each says how it decides: by fixed rules, by AI reasoning, or by human judgment. Select a step for owner, timing and, for gates, the approval paths."+(d.std?" Aligned to "+d.std.map(k=>STD[k]?STD[k].n:k).join(", ")+".":""),`<div class="proc" data-proc="${H(screen)}">${ed.map((s,i)=>`<button class="ps ${s.who||"human"} sm-${STEPMODE.of(s.who)}" data-proc-step="${H(screen)}:${i}"><span class="who">${STEPMODE.label(s.who)}</span><b>${H(s.n)}</b><small>${H(s.d||"")}</small>${PROC.modeTag(s)}${(s.who||"human")==="gate"?PROC.fork(screen,s):""}</button>`).join("")}</div>`,`<div class="row"><button class="btn quiet" data-proc-edit="${H(screen)}">Add a step</button><button class="btn quiet" data-nav="flw_design">Open in Workflow designer</button></div>`)};
document.addEventListener("click",e=>{let t;if(t=e.target.closest("[data-proc-step]")){const [sc,i]=t.dataset.procStep.split(":");const d=PROC.defs[sc],st=(S.proc[sc]||d.steps)[+i];openDrawer(PROC.stepHTML(sc,st));return}
 if(t=e.target.closest("[data-proc-edit]")){const sc=t.dataset.procEdit;openForm({id:"k2_proc",title:"Add a process step",story:"Adds a step to this process. Admins can also draw it in the Workflow designer.",submit:"Add step",fields:[{k:"n",label:"Step name",type:"text",req:true},{k:"d",label:"What happens",type:"longtext"},{k:"who",label:"Done by",type:"chips",opts:STEPMODE.kinds().concat(["gate"]).map(k=>[k,STEPMODE.label(k)])}],defaults:{who:"human"},onSubmit:v=>{const d=PROC.defs[sc];S.proc[sc]=(S.proc[sc]||d.steps.slice()).concat([{n:v.n,d:v.d,who:v.who||"human"}]);audit("edited process",sc+": added "+v.n);toast("Step added","good");closeDrawer();render()}})}});

/* ---------------- legend helper ---------------- */
window.legend=items=>`<div class="legend" role="note">${items.map(i=>`<span><i style="background:var(${i[1]})"></i>${H(i[0])}</span>`).join("")}</div>`;

/* ---------------- table safety: wrap tables so columns scroll instead of squeezing; id tokens never break ---------------- */
let tfq=0;
function tableFix(){tfq=0;document.querySelectorAll("#view table,#drawer table").forEach(t=>{if(t.closest(".tscroll,.bt-scroll"))return;const p=t.parentElement;if(!p)return;const ox=getComputedStyle(p).overflowX;if(ox==="auto"||ox==="scroll")return;const w=document.createElement("div");w.className="tscroll";p.insertBefore(w,t);w.appendChild(t)});
 /* R16 Agent I: id tokens are monospace per COLUMN, never per cell: a column is an id column when most of its cells are single identifier-like tokens; plain words and numbers never are, so no column mixes families */
 const NUM=/^[\s$€£+\-−~≈≤≥<>(]*\d[\d.,]*\s*(%|[KMBkmb]|ms|s|h|d|min|x|pts?)?\)?$|^\d+(\.\d+)+$|^[\d/.:-]+$/;
 document.querySelectorAll("#view table,#drawer table").forEach(t=>{const cols={};[...t.tBodies].forEach(b=>[...b.rows].forEach(r=>{if(r.cells.length<2)return;[...r.cells].forEach((td,ci)=>{if(td.colSpan>1||td.tagName!=="TD")return;const x=td.textContent.trim();if(x)(cols[ci]=cols[ci]||[]).push([td,x])})}));
  Object.values(cols).forEach(list=>{const one=list.filter(([td,x])=>td.children.length===0&&x.length<=26&&!/\s/.test(x)&&!NUM.test(x));const idl=one.some(([td,x])=>(/[\d_\-.\/:@#]/.test(x)&&/[A-Za-z]/.test(x))||(/^[A-Z][A-Z0-9]+$/.test(x)&&x.length>=6));
   const auto=idl&&one.length>=Math.max(2,list.length*0.6);const vote=list.filter(([td])=>(td.classList.contains("tok")&&!td.dataset.tokauto)||td.dataset.tokoff).length;const want=vote>0?vote>=list.length*0.6:auto;
   list.forEach(([td,x])=>{if(want){if(!td.classList.contains("tok")){td.classList.add("tok");td.dataset.tokauto="1";delete td.dataset.tokoff}}else if(td.classList.contains("tok")){td.classList.remove("tok");if(!td.dataset.tokauto)td.dataset.tokoff="1";delete td.dataset.tokauto}})})})}
new MutationObserver(()=>{if(!tfq)tfq=requestAnimationFrame(tableFix)}).observe(document.documentElement,{childList:true,subtree:true});

/* ---------------- scale: switch to enterprise volumes ---------------- */
/* Data volume removed: SCALE stays as an inert stub so older call sites keep working. The app always runs on the sample data set. */
const SCALE={on:false,built:false,n:{projects:0,cis:0,tickets:0,people:0,assets:0,incidents:0,changes:0,demand:0,raid:0},set(){this.on=false},build(){},projects(){return[]},cis(){return[]},tickets(){return[]},incidents(){return[]},changes(){return[]},demand(){return[]},raid(){return[]},assets(){return[]}};
window.SCALE=SCALE;
/* Data volume switch removed: the app always runs on the sample data set. */


/* ---------------- shared service and CI registry (one graph every module uses) ----------------
   SVCREG: business and technical services. CIREG: configuration items. CIEDGE: [from,to,type] meaning "from depends on to" ("runs on", "uses", "connects to").
   impactOf(id) walks everything that depends on a CI or service and returns affected services, users, projects, objectives and cost at risk.
   Modules may push more items (keep ids unique) but should not rename these. */
const SVCREG=[
 {id:"svc_cod",n:"Standards Platform",tier:"Tier 1",owner:"Priya Shah",processOwner:"Chief Editor",sme:["Jordan Lee","Sam Patel"],users:420,avail:99.62,tgt:99.9,cost:48200,obj:["Modernize standards publishing"],proj:["PR1"],maturity:2,offerings:["Editor workspace","Publishing pipeline","Standards API"],deps:["svc_search","svc_data","svc_id","svc_net"]},
 {id:"svc_portal",n:"Standards Portal",tier:"Tier 1",owner:"Tom Becker",processOwner:"Maya Ortiz",sme:["Sam Patel"],users:180000,avail:99.58,tgt:99.9,cost:31400,obj:["Reduce operating risk","Modernize standards publishing"],proj:["PR3","PR1"],maturity:3,offerings:["Public reader site","Subscriber access","API licensing"],deps:["svc_cod","svc_search","svc_id","svc_net"]},
 {id:"svc_search",n:"Search and indexing",tier:"Tier 1",owner:"Marco Ellis",processOwner:"Priya Shah",sme:["Hana Koval","Jordan Lee"],users:180420,avail:99.1,tgt:99.5,cost:22600,obj:["Modernize standards publishing"],proj:["PR1","PR2"],maturity:2,offerings:["Public search","Editor search","Related content"],deps:["svc_data","svc_net"]},
 {id:"svc_cr",n:"Contract Repository",tier:"Tier 2",owner:"Maya Ortiz",processOwner:"Avery Chen",sme:["Jordan Lee"],users:60,avail:99.4,tgt:99.5,cost:9800,obj:["Protect revenue through contract discipline"],proj:["PR4"],maturity:1,offerings:["Contract storage","Obligation tracking","Renewal alerts"],deps:["svc_id","svc_m365"]},
 {id:"svc_erp",n:"Lease subledger (ERP)",tier:"Tier 2",owner:"Avery Chen",processOwner:"Avery Chen",sme:["Jordan Lee"],users:34,avail:99.7,tgt:99.5,cost:12900,obj:["Protect revenue through contract discipline"],proj:[],maturity:3,offerings:["Lease accounting","Month-end close"],deps:["svc_id","svc_int","svc_data"]},
 {id:"svc_fin",n:"Finance systems",tier:"Tier 2",owner:"Avery Chen",processOwner:"Avery Chen",sme:["Sam Patel"],users:48,avail:99.8,tgt:99.5,cost:17700,obj:["Protect revenue through contract discipline"],proj:[],maturity:3,offerings:["Accounts payable","Invoice approval","Reporting"],deps:["svc_erp","svc_id","svc_int"]},
 {id:"svc_id",n:"Identity (Entra ID)",tier:"Tier 1",owner:"Rina Okafor",processOwner:"Rina Okafor",sme:["Sam Patel"],users:640,avail:99.95,tgt:99.9,cost:8400,obj:["Reduce operating risk"],proj:[],maturity:3,offerings:["Sign-in and MFA","Access reviews","Privileged access"],deps:["svc_net"]},
 {id:"svc_m365",n:"Email and collaboration (M365)",tier:"Tier 1",owner:"Sam Patel",processOwner:"Tom Becker",sme:["Rina Okafor"],users:640,avail:99.93,tgt:99.9,cost:26500,obj:["Reduce operating risk"],proj:[],maturity:4,offerings:["Email","Teams","SharePoint","OneDrive"],deps:["svc_id","svc_net"]},
 {id:"svc_data",n:"Data platform",tier:"Tier 2",owner:"Dev Rao",processOwner:"Dev Rao",sme:["Hana Koval","Jordan Lee"],users:75,avail:99.3,tgt:99.5,cost:34800,obj:["Modernize standards publishing"],proj:["PR2"],maturity:2,offerings:["Pipelines","Lakehouse","Reporting"],deps:["svc_id","svc_net"]},
 {id:"svc_net",n:"Network and VPN",tier:"Tier 1",owner:"Sam Patel",processOwner:"Sam Patel",sme:["Ravi Menon"],users:640,avail:99.9,tgt:99.9,cost:15200,obj:["Reduce operating risk"],proj:["PR3"],maturity:3,offerings:["Site network","Remote access","Wi-Fi"],deps:[]},
 {id:"svc_end",n:"Endpoint management (Intune)",tier:"Tier 2",owner:"Northwind Managed Services",processOwner:"Tom Becker",sme:["Sam Patel"],users:640,avail:99.6,tgt:99.5,cost:11300,obj:["Reduce operating risk"],proj:[],maturity:3,offerings:["Laptop provisioning","Patching","Mobile devices"],deps:["svc_id","svc_net"]},
 {id:"svc_int",n:"Integration hub",tier:"Tier 2",owner:"Jordan Lee",processOwner:"Jordan Lee",sme:["Sam Patel"],users:12,avail:99.5,tgt:99.5,cost:7600,obj:["Protect revenue through contract discipline"],proj:["PR4"],maturity:2,offerings:["API gateway","Event bus","Connectors"],deps:["svc_id","svc_net"]},
 {id:"svc_desk",n:"Service desk",tier:"Tier 2",owner:"Tom Becker",processOwner:"Tom Becker",sme:["Nia Brooks"],users:640,avail:99.7,tgt:99.5,cost:28400,obj:["Reduce operating risk"],proj:[],maturity:3,offerings:["Incident handling","Requests","Knowledge"],deps:["svc_id","svc_m365"]}
];
const _cr=RNG("ciseed");const CIREG=[],CIEDGE=[];
const _mk=(id,n,cls,svc,env,o)=>{CIREG.push(Object.assign({id,name:n,class:cls,svc,env:env||"Production",status:"Operational",owner:(SVCREG.find(s=>s.id===svc)||{}).owner||"Sam Patel",crit:(SVCREG.find(s=>s.id===svc)||{}).tier==="Tier 1"?"1 - Mission critical":"2 - Somewhat critical",uptime:+(99.2+_cr()*.79).toFixed(2),ip:"10."+(10+Math.floor(_cr()*20))+"."+Math.floor(_cr()*250)+"."+(2+Math.floor(_cr()*250)),disc:"Oct 6"},o||{}))};
const _e=(a,b,t)=>CIEDGE.push([a,b,t||"depends on"]);
/* shared infrastructure */
_mk("ci_az","Azure East US 2 subscription","Cloud subscription","svc_net");_mk("ci_fw","Edge firewall pair","Network device","svc_net");_mk("ci_dns","Azure DNS","Cloud resource","svc_net");_mk("ci_vpn","VPN gateway","Network device","svc_net");_mk("ci_tenant","Entra ID tenant","Cloud resource","svc_id");_mk("ci_ca","Conditional access policies","Application","svc_id");_mk("ci_mfa","MFA service","Application","svc_id");
_e("ci_vpn","ci_fw","runs behind");_e("ci_fw","ci_az","connects to");_e("ci_dns","ci_az","runs on");_e("ci_ca","ci_tenant","runs on");_e("ci_mfa","ci_tenant","runs on");
const per=(svc,key,items)=>items.forEach((it,i)=>{_mk("ci_"+key+i,it[0],it[1],svc,it[2]||"Production",it[3]);});
per("svc_cod","cod",[["codif-app-01","Virtual machine"],["codif-app-02","Virtual machine"],["codif-sql-prd","Database"],["codif-lb","Load balancer"],["standards-platform","Application"],["codif-blob","Storage"]]);
per("svc_portal","por",[["portal-web-01","Virtual machine"],["portal-web-02","Virtual machine"],["portal-cdn","Cloud resource"],["portal-waf","Network device"],["standards-portal","Application"]]);
per("svc_search","sea",[["lumen-indexer-01","Virtual machine",null,{status:"Degraded"}],["lumen-indexer-02","Virtual machine"],["search-cluster","Application"],["search-index-store","Storage"],["search-api","Application"]]);
per("svc_cr","cr",[["contract-app","Application"],["contract-sql","Database"],["contract-blob","Storage"]]);
per("svc_erp","erp",[["erp-app-01","Virtual machine"],["erp-sql-01","Database"],["lease-subledger","Application"]]);
per("svc_fin","fin",[["ap-app","Application"],["fin-reporting","Application"]]);
per("svc_m365","m36",[["Exchange Online tenant","Cloud resource"],["Teams","Application"],["SharePoint Online","Application"]]);
per("svc_data","dat",[["lakehouse-prod","Cloud resource"],["adf-pipelines","Application"],["synapse-sql","Database"],["data-gateway","Virtual machine"]]);
per("svc_end","end",[["Intune tenant","Cloud resource"],["Autopilot profiles","Application"]]);
per("svc_int","int",[["apim-gateway","Application"],["service-bus","Cloud resource"],["logic-connectors","Application"]]);
per("svc_desk","dsk",[["Service desk phone system","Application"],["Oukala service desk","Application"]]);
const first=(svc)=>CIREG.filter(c=>c.svc===svc);
/* edges: app -> database -> storage; app -> shared infra */
[["ci_cod0","ci_cod2"],["ci_cod1","ci_cod2"],["ci_cod4","ci_cod0"],["ci_cod4","ci_cod1"],["ci_cod3","ci_cod0"],["ci_cod3","ci_cod1"],["ci_cod2","ci_cod5"],["ci_cod0","ci_az"],["ci_cod1","ci_az"],["ci_cod4","ci_tenant","uses"],
 ["ci_por4","ci_por0"],["ci_por4","ci_por1"],["ci_por0","ci_por3"],["ci_por1","ci_por3"],["ci_por4","ci_por2","uses"],["ci_por4","ci_cod4","uses"],["ci_por4","ci_sea4","uses"],["ci_por3","ci_az"],["ci_por4","ci_tenant","uses"],
 ["ci_sea4","ci_sea2"],["ci_sea2","ci_sea0"],["ci_sea2","ci_sea1"],["ci_sea2","ci_sea3"],["ci_sea0","ci_az"],["ci_sea1","ci_az"],["ci_sea2","ci_dat0","uses"],
 ["ci_cr0","ci_cr1"],["ci_cr1","ci_cr2"],["ci_cr0","ci_tenant","uses"],["ci_cr0","ci_m360","uses"],
 ["ci_erp2","ci_erp0"],["ci_erp0","ci_erp1"],["ci_erp0","ci_az"],["ci_erp2","ci_int0","uses"],
 ["ci_fin0","ci_erp2","uses"],["ci_fin1","ci_fin0"],["ci_fin0","ci_tenant","uses"],
 ["ci_m361","ci_m360"],["ci_m362","ci_m360"],["ci_m360","ci_tenant","uses"],
 ["ci_dat1","ci_dat0"],["ci_dat2","ci_dat0"],["ci_dat3","ci_dat1","uses"],["ci_dat0","ci_az"],
 ["ci_end1","ci_end0"],["ci_end0","ci_tenant","uses"],["ci_int0","ci_int1"],["ci_int2","ci_int0"],["ci_int0","ci_tenant","uses"],
 ["ci_dsk1","ci_dsk0","uses"],["ci_dsk1","ci_tenant","uses"]].forEach(x=>{if(CIREG.some(c=>c.id===x[0])&&CIREG.some(c=>c.id===x[1]))_e(x[0],x[1],x[2]||"runs on")});
window.SVCREG=SVCREG;window.CIREG=CIREG;window.CIEDGE=CIEDGE;
const svcOf=id=>SVCREG.find(s=>s.id===id||s.n===id);window.svcOf=svcOf;
/* everything that depends on `id` (a CI id or service id), walking edges backwards, plus service-to-service dependencies */
window.impactOf=function(id){const dependents={};CIEDGE.forEach(([a,b])=>{(dependents[b]=dependents[b]||[]).push(a)});SVCREG.forEach(s=>s.deps.forEach(d=>{(dependents[d]=dependents[d]||[]).push(s.id)}));
 CIREG.forEach(c=>{(dependents[c.svc]=dependents[c.svc]||[]);});
 const seen=new Set([id]),order=[],q=[[id,0]];const startSvc=CIREG.find(c=>c.id===id)?CIREG.find(c=>c.id===id).svc:null;if(startSvc&&SVCREG.some(s=>s.id===startSvc)){(dependents[id]=dependents[id]||[]).push(startSvc)}
 while(q.length){const [n,d]=q.shift();(dependents[n]||[]).forEach(m=>{if(!seen.has(m)){seen.add(m);order.push({id:m,depth:d+1,via:n});q.push([m,d+1])}})}
 const svcs=SVCREG.filter(s=>seen.has(s.id)||s.id===id).map(s=>Object.assign({},s,{depth:(order.find(o=>o.id===s.id)||{depth:0}).depth}));const cis=CIREG.filter(c=>seen.has(c.id));
 const users=svcs.reduce((a,s)=>Math.max(a,s.users),0);const cost=svcs.reduce((a,s)=>a+s.cost,0);const proj=[...new Set(svcs.flatMap(s=>s.proj))];const obj=[...new Set(svcs.flatMap(s=>s.obj))];
 return {id,order,services:svcs,cis,users,cost,projects:proj,objectives:obj,tier1:svcs.filter(s=>s.tier==="Tier 1").length}};
/* contract: impact analysis UI is registered by the Service 360 module; everyone else just calls openImpact({type,id,service,ci}) */
window.openImpact=window.openImpact||function(t){const s=t&&(t.ci||t.service||t.id);const r=impactOf((CIREG.find(c=>c.id===s||c.name===s)||svcOf(s)||{}).id||s);toast("Impact: "+r.services.length+" services, "+r.users.toLocaleString("en-US")+" users","info")};


/* ---------------- workflow registry (contract shared by Workflow designer, Service catalog, Journey maps, SLAs) ----------------
   WFX.reg({id,name,kind:"request|incident|change|onboarding|approval|release|contract|purchase",service,owner,steps:[{id,n,type:"human|agent|auto|gate|wait",owner,team,sla,olaHrs,cost,in:[],out:[],cond:"expression text",next:[ids],requesterVisible:true,system:""}],visibleToRequester:[ids],std:["itil5"]})
   WFX.get(id), WFX.defs (array). Re-registering the same id replaces it. */
window.WFX={defs:[],reg(d){const i=this.defs.findIndex(x=>x.id===d.id);i>=0?this.defs[i]=d:this.defs.push(d);return d},get(id){return this.defs.find(x=>x.id===id)}};
/* contracts defined by other modules (always guard calls): addDemand({title,reason,source,cost,service,kind}) by PPM; PPMX.addTasks(projectId,[{n,dur,pred,own}]) by WBS; openImpact by Service 360; PERSON/WORK providers by every assigning module. */

/* ---------------- navigation: group parent link, ordering, captions ---------------- */
window.NAVP={portfolio:"exe_dash"};
window.NAVORD={portfolio:["exe_strat","exe_mat","port","trace","ims","plan","ppm_wbs","ppm_proj","ppm_raid","dev_pipe","ppm_sow","inv","bud_over","bud_model","bud_ven","bud_ben","bud_doa","exe_risk","exe_apps","exe_scen","exe_board"]};
window.NAVSUB={portfolio:{exe_strat:"Strategy and maturity",port:"Demand and delivery",inv:"Money and contracts",exe_risk:"Executive views"}};
window.NAVGRP={dev_pipe:"portfolio",port:"portfolio",ims:"portfolio",plan:"portfolio",log:"platform",home:"platform"};
document.addEventListener("click",e=>{const g=e.target.closest(".gparent");if(g){e.preventDefault()}},true);
})();


/* ================= CORE FIX (round 8): shared helpers added after the foundation ================= */
(function(){
const esc=x=>String(x==null?"":x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* kpi(label,value,sub,{cls,metric,go}) : one tile style everywhere; metric = METRICS id adds an fchip */
window.kpi=function(label,val,sub,o){o=o||{};const zero=(val===0||val==="0"||val==="$0")&&!o.keep;
 const chip=o.metric&&typeof METRICS!=="undefined"&&METRICS[o.metric]&&window.fchip?fchip(o.metric,"ƒ"):"";
 return `<div class="stat ${esc(o.cls||"")}${zero?" zero":""}"><small><span>${esc(label)}</span>${chip}</small><span class="num" data-role="metric">${val}</span>${sub?`<em>${sub}</em>`:""}</div>`};
window.kpiRow=function(items){return `<div class="statrow">${items.map(i=>kpi(i[0],i[1],i[2],i[3])).join("")}</div>`};
/* metrics: every metric gets a unit and a remediation so the standard framework is complete */
window.normMetrics=function(){if(typeof METRICS==="undefined")return;for(const id in METRICS){const m=METRICS[id];if(!m)continue;
  if(!m.u){const nm=(m.n+" "+m.f).toLowerCase();m.u=/%|percent|rate|share|coverage|ratio|÷/.test(nm)&&m.max<=100?"%":/hour|time to|mttr|latency/.test(nm)?"h":/day/.test(nm)?"days":m.max<=1?"idx":"pts"}
  if(!m.rem&&!m._remFilled){m._remFilled=1;m.rem={kind:"sop",ref:"SOP-MET-"+(Object.keys(METRICS).indexOf(id)+1),title:"Review "+m.n+" and assign a corrective action",agent:"Metrics Agent",auto:false,state:"standby",prog:"Standing by. When "+m.n+" crosses its threshold, the owner ("+(m.owner||"metric owner")+") is asked to approve the first step."}}}};
if(typeof METRICS!=="undefined"){const fix={m_ops:["SOP-231","Restore operational health score","Ops Agent"],m_vendor:["SOP-244","Run a vendor performance review","Vendor Agent"],m_mttr:["SOP-118","Cut time to resolve: swarm and escalate","Ops Agent"],m_aispend:["SOP-309","Throttle agents nearing the daily cap","Cost Guard Agent"],m_yield:["SOP-172","Recover missed meeting actions","Meeting Agent"]};
 for(const k in fix){const m=METRICS[k];if(m&&!m.rem)m.rem={kind:"sop",ref:fix[k][0],title:fix[k][1],agent:fix[k][2],auto:false,state:"standby",prog:"Standing by. Starts when the metric crosses its threshold."}}}
/* scale generators sized for enterprise volumes */
/* popovers open next to the chip that opened them */
let anchor=null;
document.addEventListener("click",e=>{const b=e.target.closest("[popovertarget]");if(!b){return}const t=document.getElementById(b.getAttribute("popovertarget"));if(!t||!t.classList.contains("pop")||t.id==="profilePop")return;if(b.matches(".fchip,.ringcard button,.navhelp,.chip,.mcard button")||b.closest(".hero")){anchor={id:t.id,r:b.getBoundingClientRect()}}},true);
document.addEventListener("toggle",e=>{const p=e.target;if(!p.classList||!p.classList.contains("pop"))return;if(e.newState==="closed"){p.classList.remove("anch");["left","top","right","bottom"].forEach(k=>p.style[k]="");return}
 if(!anchor||anchor.id!==p.id)return;const r=anchor.r;anchor=null;p.classList.add("anch");const vw=innerWidth,vh=innerHeight,w=Math.min(520,vw-32);p.style.width=w+"px";const h=Math.min(p.offsetHeight,vh*.78);let left=Math.max(16,Math.min(r.left,vw-w-16)),top=r.bottom+8;if(top+h>vh-16)top=r.top-h-8>16?r.top-h-8:Math.max(16,vh-h-16);p.style.left=left+"px";p.style.top=top+"px";p.style.right="auto";p.style.bottom="auto"},true);
/* nav help popover */
function navHelp(){if(document.getElementById("navHelp"))return;const d=document.createElement("div");d.id="navHelp";d.setAttribute("popover","");d.className="pop glass";d.innerHTML=`<div class="eyebrow">Navigation</div><h3>How to read this menu</h3><div class="navleg">
<div><i style="background:var(--glass2);box-shadow:inset 3px 0 0 var(--accent)"></i><span><b>Highlighted row</b> is the screen you are on.</span></div>
<div><i style="background:var(--accent-soft,var(--glass2))"></i><span><b>Groups</b> are named for what you are trying to do, such as <i>Fix and support services</i> or <i>Money and contracts</i>. Open one to see its screens; only one group stays open.</span></div>
<div><i style="background:var(--glass2)"></i><span><b>Plain label</b> on top, the module's <b>formal name</b> underneath in small type. Hover for both.</span></div>
<div><i style="background:var(--warn-s,var(--glass2))"></i><span><b>Star</b> any row (it appears when you hover) to pin it under <b>Favorites</b>. Drag favorites to reorder and use the pencil to rename.</span></div>
<div><i style="background:var(--bad-s);"></i><span><b>Red count</b> is work waiting on you (approvals, alerts).</span></div></div>
<p class="muted small"><b>Not sure where to go?</b> Describe the task in the box at the top of the menu. Press <b>/</b> or <b>Ctrl or Cmd + K</b> to search everything, and use <b>History</b> in the top bar to get back to where you were.</p><div class="row"><button class="btn" popovertarget="navHelp" popovertargetaction="hide">Close</button></div>`;document.body.appendChild(d)}
navHelp();
/* after each render: tablist semantics, hero toggle, scroll cues */
function cues(el){if(!el)return;const r=el.scrollWidth>el.clientWidth+4;el.classList.toggle("sc-r",r&&el.scrollLeft+el.clientWidth<el.scrollWidth-4);el.classList.toggle("sc-l",r&&el.scrollLeft>4)}
function scan(){document.querySelectorAll(".vsw,.tscroll,.bt-scroll,.flowscroll").forEach(cues)}
window.coreAfter=function(){document.querySelectorAll("#view .views").forEach(v=>{const sw=v.querySelector(":scope>.vsw");if(!sw||sw.dataset.a11y)return;sw.dataset.a11y=1;sw.setAttribute("role","tablist");const ins=[...v.querySelectorAll(":scope>input")];[...sw.children].forEach((l,i)=>{l.setAttribute("role","tab");const on=ins[i]&&ins[i].checked;l.setAttribute("aria-selected",String(!!on));if(on&&sw.scrollWidth>sw.clientWidth)l.scrollIntoView({inline:"center",block:"nearest"})})});
 document.querySelectorAll("#view .hero").forEach(h=>{if(h.dataset.ht)return;h.dataset.ht=1;const st=h.querySelector(".story"),hh=h.querySelector("h1");if(!st)return;if(st.scrollHeight>st.clientHeight+3||(hh&&hh.scrollHeight>hh.clientHeight+3)){const b=document.createElement("button");b.type="button";b.className="herotog";b.textContent="Read more";b.setAttribute("aria-expanded","false");h.insertBefore(b,st.nextSibling)}});
 requestAnimationFrame(scan)};
document.addEventListener("click",e=>{const b=e.target.closest(".herotog");if(!b)return;const h=b.closest(".hero");const o=h.classList.toggle("open");b.textContent=o?"Show less":"Read more";b.setAttribute("aria-expanded",String(o))});
document.addEventListener("change",e=>{const i=e.target;if(!i.matches||!i.matches(".views>input"))return;const v=i.closest(".views"),sw=v.querySelector(":scope>.vsw"),ins=[...v.querySelectorAll(":scope>input")];[...sw.children].forEach((l,k)=>l.setAttribute("aria-selected",String(ins[k]===i)));const l=sw.children[ins.indexOf(i)];if(l)l.scrollIntoView({inline:"center",block:"nearest"});requestAnimationFrame(scan)});
document.addEventListener("scroll",e=>{const t=e.target;if(t&&t.classList&&(t.classList.contains("vsw")||t.classList.contains("tscroll")||t.classList.contains("bt-scroll")||t.classList.contains("flowscroll")))cues(t)},true);
new ResizeObserver(()=>requestAnimationFrame(scan)).observe(document.documentElement);
/* Ask Oukala button hides while scrolling down */
let ly=0,ft;addEventListener("scroll",()=>{const f=document.getElementById("chxOrb")||document.querySelector(".fab");if(!f)return;const y=scrollY;if(y>ly+8&&y>200)f.classList.add("fab-hide");else if(y<ly-8)f.classList.remove("fab-hide");ly=y;clearTimeout(ft);ft=setTimeout(()=>f.classList.remove("fab-hide"),1400)},{passive:true});
/* responsive: short search placeholder on phones, auto-collapse sidebar on narrow desktops */
function resp(){const q=document.getElementById("q");if(q){const small=matchMedia("(max-width:520px)").matches;if(!q.dataset.ph)q.dataset.ph=q.placeholder;q.placeholder=small?"Search":q.dataset.ph}}
resp();matchMedia("(max-width:520px)").addEventListener("change",resp);
const mq=matchMedia("(min-width:701px) and (max-width:1100px) and (min-height:501px)");const rc=()=>{const c=document.getElementById("railCollapse");if(c&&mq.matches&&!c.checked){c.checked=true;c.dispatchEvent(new Event("change"))}};
mq.addEventListener("change",()=>{if(mq.matches)rc()});setTimeout(rc,300);
})();

/* ---------------- round 9: drawer controls live in one header bar, never over content ---------------- */
(function(){const _od2=window.openDrawer;window.openDrawer=function(html){_od2(html);const d=document.getElementById("drawer");if(!d)return;
 let bar=d.querySelector(":scope>.dctl");if(!bar){bar=document.createElement("div");bar.className="dctl";d.insertBefore(bar,d.firstChild)}
 const ex=d.querySelector(":scope>.dexpand"),cl=d.querySelector(":scope>.closebtn");if(ex)bar.appendChild(ex);if(cl)bar.appendChild(cl)};
 document.addEventListener("click",e=>{const b=e.target.closest("[data-dexpand-fish]");if(!b)return;const d=document.getElementById("drawer");if(!d)return;S.k2.dfull=true;d.classList.add("dfull");const x=d.querySelector(".dexpand");if(x)x.textContent="Exit full screen";b.closest("[data-itsm-fishbox]")?.scrollIntoView({block:"start"})})})();


/* ---------------- round 9: how each step decides (deterministic, AI reasoning, human judgment) and approval paths ---------------- */
(function(){
 const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));const pchip=(...a)=>(window.pchip?window.pchip(...a):H(a[0]));
 const MODES={det:{n:"Deterministic",d:"Fixed rules: the same input always gives the same result. Fully testable.",ic:"=" },ai:{n:"AI reasoning",d:"Probabilistic: judges from evidence and shows a confidence score, lineage and guardrails.",ic:"~"},hum:{n:"Human judgment",d:"A person decides using context, experience and accountability.",ic:"●"},mix:{n:"Rules, then judgment",d:"Rules decide the clear cases; AI or a person decides the rest.",ic:"≈"}};
 PROC.modes=MODES;
 PROC.modeOf=s=>s.mode&&MODES[s.mode]?s.mode:({auto:"det",agent:"ai",human:"hum",gate:"mix"})[s.who||"human"]||"hum";
 PROC.modeTag=s=>{const m=PROC.modeOf(s),M=MODES[m];return `<span class="pmode ${m}" title="${H(M.d)}"><i aria-hidden="true">${M.ic}</i>${M.n}</span>`};
 const POL={
  chg:{name:"Change approval",unit:"Change risk",pre:["It matches a pre-approved standard change template","Risk score is low","Not inside a change freeze window","No conflicting change on the same service"],ai:["Risk is low to medium","Rollback plan and test evidence are attached","AI confidence is at least {conf}%","Past success rate for this change type is above 95%"],hum:["Risk is high or the change touches a critical service","It falls in a freeze window","AI confidence is below {conf}% or evidence is missing","Segregation of duties or regulatory scope applies"]},
  inv:{name:"Invoice approval",unit:"Invoice value",pre:["It matches the purchase order and receipt (three-way match)","Amount is within the tolerance of {amt1}","Vendor is approved and not on hold"],ai:["Amount is up to {amt2}","Coding or tax needs interpretation","AI confidence is at least {conf}%","No policy exception"],hum:["Amount is above {amt2}","No purchase order, or the vendor is new","AI confidence is below {conf}%","Possible duplicate, fraud signal or approver conflict"]},
  bud:{name:"Spend and budget approval",unit:"Amount",pre:["Spend is inside an approved budget line and the delegation limit of {amt1}","Standard category with a preferred vendor"],ai:["Amount is up to {amt2}","Forecast impact is within contingency","AI confidence is at least {conf}%","No cross-department funding"],hum:["Amount is above {amt2}","It needs new funding or moves money between lines","AI confidence is below {conf}%","Strategic, regulated or related-party spend"]},
  req:{name:"Request approval",unit:"Request cost",pre:["The item is a standard catalog item","Requester is entitled by role and cost is within {amt1}"],ai:["Item is non-standard but low risk","Cost is up to {amt2}","AI confidence is at least {conf}%"],hum:["Cost is above {amt2}","Access to sensitive data or systems","AI confidence is below {conf}%","Manager or owner has set manual approval"]},
  gen:{name:"Approval",unit:"Impact",pre:["It meets every rule in the policy","Value is within the delegated limit of {amt1}","Low risk"],ai:["Medium impact, up to {amt2}","The evidence supports the decision","AI confidence is at least {conf}%"],hum:["Impact is above {amt2}","High risk or a policy exception","AI confidence is below {conf}%","Anyone affected has objected"]}};
 PROC.policyFor=screen=>{const k=/chg|change|rel_|release/.test(screen)?"chg":/inv|ap_|payable|bill/.test(screen)?"inv":/bud|fin|tbm|doa|spend|forecast|sow|ven/.test(screen)?"bud":/req|catalog|access|onboard|dem/.test(screen)?"req":"gen";
  const o=(S.proc.policy||{})[screen];const base=Object.assign({amt1:5000,amt2:50000,conf:85},o||{});return Object.assign({key:k},POL[k],base)};
 const money=n=>"$"+(n>=1000?(n/1000)+"K":n);
 const fill=(t,P)=>t.replace("{amt1}",money(P.amt1)).replace("{amt2}",money(P.amt2)).replace(/\{conf\}/g,P.conf);
 PROC.route=(P,amt,risk,conf)=>{if(risk==="low"&&amt<=P.amt1)return "pre";if(risk!=="high"&&amt<=P.amt2&&conf>=P.conf)return "ai";return "hum"};
 const PN={pre:"Pre-approved",ai:"AI-reasoned approval",hum:"Human approval"},PD={pre:"Deterministic rules approve it at once. Audited, no waiting.",ai:"An AI agent reviews the evidence and approves with a confidence score. A person can overrule it.",hum:"A named approver decides. The AI prepares a recommendation first."};
 PROC.fork=(screen,s)=>`<span class="pfork" aria-label="Three approval paths"><i class="pre">Pre</i><i class="ai">AI</i><i class="hum">Human</i></span>`;
 PROC.pathsHTML=screen=>{const P=PROC.policyFor(screen);const col=k=>({pre:P.pre,ai:P.ai,hum:P.hum})[k];
  return `<div class="eyebrow" style="margin-top:16px">Approval paths · ${H(P.name)}</div><p class="muted small">Which path a request takes depends on these factors. Admins can change the limits in the Workflow designer.</p><div class="paths">${["pre","ai","hum"].map(k=>`<div class="path ${k}"><div class="ph"><span class="pmode ${k==="pre"?"det":k==="ai"?"ai":"hum"}"><i aria-hidden="true">${k==="pre"?"=":k==="ai"?"~":"●"}</i>${PN[k]}</span></div><p class="small muted">${PD[k]}</p><div class="small"><b>${k==="pre"?"When all of these are true":k==="ai"?"When these factors are met":"When any of these is true"}</b></div><ul>${col(k).map(x=>`<li>${H(fill(x,P))}</li>`).join("")}</ul></div>`).join("")}</div>
  <div class="eyebrow" style="margin-top:16px">Try it</div><div class="row path-sim" data-psim="${H(screen)}"><label class="small">${H(P.unit)}<select class="fin" data-ps="amt"><option value="${P.amt1}">Up to ${money(P.amt1)}</option><option value="${P.amt2}" selected>Up to ${money(P.amt2)}</option><option value="1e9">Above ${money(P.amt2)}</option></select></label><label class="small">Risk<select class="fin" data-ps="risk"><option value="low">Low</option><option value="med" selected>Medium</option><option value="high">High</option></select></label><label class="small">AI confidence<select class="fin" data-ps="conf"><option value="95">95%</option><option value="${P.conf}" selected>${P.conf}%</option><option value="60">60%</option></select></label><span class="pill info" data-ps-out>${PN[PROC.route(P,P.amt2,"med",P.conf)]}</span></div>`};
 document.addEventListener("change",e=>{const sim=e.target.closest&&e.target.closest("[data-psim]");if(!sim)return;const P=PROC.policyFor(sim.dataset.psim),g=k=>sim.querySelector(`[data-ps="${k}"]`).value;const r=PROC.route(P,+g("amt"),g("risk"),+g("conf"));const o=sim.querySelector("[data-ps-out]");o.textContent=PN[r];o.className="pill "+(r==="pre"?"good":r==="ai"?"info":"warn")});
 PROC.stepHTML=(sc,st)=>{const m=PROC.modeOf(st),M=MODES[m];return `<div class="row"><span class="pill info">${STEPMODE.label(st.who)}</span>${PROC.modeTag(st)}</div><h2 style="font-size:28px;margin:12px 0 6px">${H(st.n)}</h2><p class="story" data-role="story">${H(st.d||"")}</p><p class="small muted"><b>How it decides:</b> ${H(M.d)}</p><dl class="kv"><dt>Owner</dt><dd>${st.owner?ownerChip(st.owner,{role:"Owner",record:"process:"+sc}):"Process owner"}</dd><dt>Target time</dt><dd class="num">${H(st.sla||"Set by the SLA")}</dd><dt>Inputs</dt><dd>${H(st.in||"Record from the previous step")}</dd><dt>Outputs</dt><dd>${H(st.out||"Updated record and next step")}</dd></dl>${(st.who||"human")==="gate"?PROC.pathsHTML(sc):""}<div class="row" style="margin-top:14px"><button class="btn" data-nav="flw_design">Edit in Workflow designer</button></div>`};
})();

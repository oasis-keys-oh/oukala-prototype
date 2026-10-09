/* mod_plat_gate: citizen app manifest registry, lifecycle and conformance gate (plat_gate) and the platform MCP server (plat_mcp).
   Reads window.PLAT and window.DEBT; exposes window.GATE and window.MCPX. */
(function(){
S.gate=S.gate||{apps:null,ran:{},waive:{},sel:null,sim:{role:"citizen_team",action:"read",ent:"project",app:"ca_budget",route:"gateway",conn:"dropbox"},con:{tool:"check_reuse",args:{}},conOut:null,mcpLog:[],clients:{},rev:0,qc:{name:"Budget tracker",needs:"budget table"},tier:"team"};
const G=S.gate,E=esc;
const TODAY="2026-10-06",T0=new Date(TODAY+"T12:00:00").getTime(),DAY=864e5;
const iso=n=>new Date(T0+n*DAY).toISOString().slice(0,10);
const days=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/DAY);
const fD=s=>s?new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"None";
const pill_=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
const hash=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%9973;return h};
const TI={personal:0,team:1,enterprise:2},TIERS=["personal","team","enterprise"];
const ST=["idea","sandbox","review","certified","sunset"],STP={idea:"mute",sandbox:"info",review:"warn",certified:"good",sunset:"mute"};
const cap=s=>s?s[0].toUpperCase()+s.slice(1):"";
const entL=id=>{const e=PLAT.ent(id);return e?e.label:id};
const whoChip=n=>window.pchip&&window.DIR&&DIR.some(d=>d.name===n)?pchip(n):E(n);
/* ---------- connectors (fallback list; the fabric module's list is used when present) ---------- */
const CONN0=[
 {id:"m365",name:"Microsoft 365 (Graph)",status:"healthy",approved:true,owner:"Platform lead",last:"4 min ago"},
 {id:"entra",name:"Entra ID",status:"healthy",approved:true,owner:"Security lead",last:"2 min ago"},
 {id:"lumen",name:"Lumen search and indexing",status:"healthy",approved:true,owner:"Integration lead",last:"11 min ago"},
 {id:"codif",name:"Codification Platform",status:"healthy",approved:true,owner:"Integration lead",last:"7 min ago"},
 {id:"contract",name:"Contract Repository",status:"healthy",approved:true,owner:"Finance controller",last:"20 min ago"},
 {id:"lease",name:"Lease subledger (ERP)",status:"degraded",approved:true,owner:"Finance controller",last:"26 hours ago"},
 {id:"hris",name:"HRIS",status:"stale",approved:true,owner:"Head of People Operations",last:"9 days ago"},
 {id:"azure",name:"Azure Monitor",status:"healthy",approved:true,owner:"Operations lead",last:"1 min ago"},
 {id:"dropbox",name:"Personal file sync",status:"not approved",approved:false,owner:"None",last:"Never"},
 {id:"nocode",name:"No-code automation service",status:"project only",approved:false,owner:"Integration lead",last:"Never"}];
function conns(){try{if(window.FAB&&Array.isArray(FAB.connectors)&&FAB.connectors.length)return FAB.connectors.map(x=>({id:x.id||x.name,name:x.n||x.name||x.label||x.id,status:x.status||x.health||"unknown",approved:x.approved!==false&&x.scope!=="project",owner:x.owner||"",last:x.last||x.lastSync||x.lastRun||""}))}catch(e){}return CONN0}
/* ---------- apps ---------- */
const MOK={manifest:true,ownAuth:false,ownNotify:false,ownReport:false,secrets:false,labels:true,audit:true,a11y:"pass"};
function seedApps(){
 const a=(o)=>Object.assign({reads:[],writes:[],newEnts:[],connectors:[],ai:[],classes:["internal"],cost:0,sunset:"",users:5,ttfa:9,m:Object.assign({},MOK),dupProc:"",purpose:""},o);
 return[
 a({id:"ca_comments",n:"Standards comment tracker",purpose:"Editors log public comments on exposure drafts and track each response to closure.",tier:"team",builder:"Chief Editor",owner:"Chief Editor",status:"certified",reads:["person","project"],newEnts:[{id:"comment_thread",why:"Threads on exposure drafts",approved:true}],connectors:["m365"],ai:[{model:"Claude Haiku",gw:true,cap:50,use:"Summarize themes in comments"}],cost:64,aiCost:22,sunset:"2027-12-31",users:22,ttfa:11,created:"2026-05-12"}),
 a({id:"ca_travel",n:"Conference travel planner",purpose:"Plan trips to standards conferences and track what each trip costs.",tier:"personal",builder:"Priya Shah",owner:"Priya Shah",status:"sandbox",reads:["person","project","invoice"],newEnts:[{id:"traveler_list",why:"External speakers are not in the directory",dupOf:"person"}],ai:[{model:"Claude Haiku",gw:true,cap:40,use:"Draft itineraries"}],classes:["internal","personal"],cost:38,aiCost:19,users:4,ttfa:7,m:Object.assign({},MOK,{labels:"partial"}),created:"2026-08-20"}),
 a({id:"ca_vendor_onb",n:"Vendor onboarding checklist",purpose:"Walk a new vendor through onboarding steps: contract signed, security review, payment details.",tier:"team",builder:"Avery Chen",owner:"Avery Chen",status:"review",reads:["contract","invoice"],newEnts:[{id:"vendor_checklist",why:"Track onboarding steps for new vendors",dupOf:"vendor (planned)"}],dupProc:"ppl_org",connectors:["m365"],classes:["confidential"],cost:45,users:9,ttfa:14,m:Object.assign({},MOK,{ownNotify:true,a11y:"warn"}),sunset:"2027-06-30",created:"2026-09-02"}),
 a({id:"ca_budget",n:"Budget tracker",purpose:"Track budget against actual spend for the editorial programs.",tier:"team",builder:"Dev Rao",owner:"Dev Rao",status:"review",reads:["invoice","project"],newEnts:[{id:"budget_table",why:"Track budget against actual spend",dupOf:"budget_line (planned)"}],ai:[{model:"External model, direct API",gw:false,cap:0,use:"Explain variances"}],classes:["confidential"],cost:120,aiCost:61,users:14,ttfa:18,m:Object.assign({},MOK,{ownAuth:true,ownReport:true,secrets:true,labels:false,audit:false,a11y:"warn"}),created:"2026-09-14"}),
 a({id:"ca_renewals",n:"Member renewal reminders",purpose:"Remind members before their subscription renews and log who responded.",tier:"team",builder:"Maya Ortiz",owner:"Maya Ortiz",status:"certified",reads:["person"],connectors:["m365"],classes:["internal","personal"],cost:22,sunset:"2028-06-30",users:6,ttfa:8,created:"2026-06-03"}),
 a({id:"ca_styleguide",n:"Style guide search",purpose:"Search the style guide and past rulings with cited answers.",tier:"enterprise",builder:"Chief Editor",owner:"Jordan Lee",status:"certified",reads:["person"],connectors:["lumen"],ai:[{model:"Claude Sonnet",gw:true,cap:400,use:"Answer questions with citations"}],cost:210,aiCost:150,sunset:"2028-12-31",users:310,ttfa:12,created:"2026-03-18"}),
 a({id:"ca_oncall_swap",n:"On-call swap helper",purpose:"Let engineers swap on-call shifts without emailing the manager.",tier:"personal",builder:"Sam Patel",owner:"Sam Patel",status:"sandbox",reads:["person","oncall_shift"],writes:["oncall_shift"],cost:6,users:3,ttfa:5,m:Object.assign({},MOK,{audit:false}),sunset:"2027-03-31",created:"2026-07-28"}),
 a({id:"ca_lease",n:"Lease expiry watcher",purpose:"Warn facilities when a lease is 180 days from expiry.",tier:"team",builder:"Jules Martin (left Aug 29)",owner:"",status:"certified",reads:["contract"],connectors:["lease"],cost:15,users:4,ttfa:10,created:"2026-04-22"}),
 a({id:"ca_ballot",n:"Ballot summary assistant",purpose:"Summarize ballot comments for committee chairs.",tier:"personal",builder:"Nia Brooks",owner:"Nia Brooks",status:"sandbox",reads:["project"],ai:[{model:"External model, direct API",gw:false,cap:0,use:"Summarize ballots"}],classes:["confidential"],cost:74,aiCost:70,users:2,ttfa:16,m:Object.assign({},MOK,{secrets:true,labels:"partial"}),created:"2026-09-21"}),
 a({id:"ca_laptops",n:"Laptop refresh tracker",purpose:"List laptops due for refresh and who has been told.",tier:"team",builder:"Tom Becker",owner:"Tom Becker",status:"review",reads:["asset","person"],newEnts:[{id:"device_inventory",why:"List of laptops due for refresh",dupOf:"asset"}],cost:12,users:7,ttfa:9,m:Object.assign({},MOK,{ownReport:true}),sunset:"2027-09-30",created:"2026-09-09"}),
 a({id:"ca_roomkit",n:"Meeting room booker",purpose:"Book meeting rooms. Replaced by the Microsoft 365 room finder.",tier:"personal",builder:"Rina Okafor",owner:"Rina Okafor",status:"sunset",cost:9,sunset:"2026-10-31",users:11,ttfa:6,created:"2026-02-10"}),
 a({id:"ca_digest",n:"Exposure draft digest",purpose:"Weekly digest of new exposure drafts for committee members.",tier:"personal",builder:"Priya Shah",owner:"Priya Shah",status:"idea",cost:0,users:0,ttfa:0,created:"2026-10-02"})
 ];
}
const apps=()=>G.apps||(G.apps=seedApps());
const app=id=>apps().find(a=>a.id===id);
G.waive=G.waive||{};if(!G.seeded){G.seeded=1;G.waive["ca_travel:nodup"]={exp:"2026-11-20",item:"DB-E04"};G.waive["ca_oncall_swap:nowrite"]={exp:"2026-09-15",item:"DB-E05"};G.ran=Object.assign({ca_comments:1,ca_renewals:1,ca_styleguide:1},G.ran)}
const bump=()=>{G.rev++};
/* ---------- the conformance checks ---------- */
const R=(r,ev,fix)=>({r,ev,fix:fix||""});
const CHECKS=[
 {id:"manifest",n:"Declared manifest",rule:"Every app publishes oukala.app.json: purpose, entities, connectors, AI use and data classes.",t:"personal",run:a=>a.m.manifest?R("pass","Manifest found and valid against schema 1.0."):R("fail","No manifest in the repository.","Generate one with the new app wizard or the SDK command oukala init.")},
 {id:"nodup",n:"No duplicate entities",rule:"A new entity may not duplicate a registered or planned entity.",t:"team",run:a=>{const d=(a.newEnts||[]).filter(n=>n.dupOf),nw=(a.newEnts||[]).filter(n=>!n.dupOf&&!n.approved);return d.length?R("fail",d.map(n=>n.id+" duplicates "+n.dupOf).join("; ")+".","Reuse "+d[0].dupOf+" or request an exception with an expiry."):nw.length?R("warn",nw.map(n=>n.id).join(", ")+" is new and needs data council approval.","Submit it as an entity proposal in the registry."):R("pass",(a.newEnts||[]).length?"All new entities are approved additions.":"Uses registered entities only.")}},
 {id:"noproc",n:"Reuses existing processes",rule:"If the platform already runs the process, the app calls it instead of copying it.",t:"team",run:a=>{if(!a.dupProc)return R("pass","No overlap with a registered process.");const d=PROC.defs[a.dupProc];return R("fail","Overlaps with: "+(d?d.title:a.dupProc)+".","Start that workflow through the workflow service and add the missing step as an option.")}},
 {id:"nowrite",n:"Writes only through owners",rule:"A citizen app never writes a canonical entity directly; it calls the owner's API.",t:"personal",run:a=>{const w=(a.writes||[]).filter(e=>PLAT.ent(e));return w.length?R("fail","Writes "+w.map(entL).join(", ")+" directly.","Call the owner API so validation and audit apply, or request an exception."):R("pass","No direct writes to canonical entities.")}},
 {id:"auth",n:"Uses platform sign-in and access rules",rule:"Role and attribute rules (RBAC and ABAC) come from the platform. No app-level user tables or logins.",t:"team",run:a=>a.m.ownAuth?R("fail","The app has its own login and user list.","Switch to platform sign-in; roles come from Entra ID groups."):R("pass","Platform sign-in; access rules evaluated by the policy engine.")},
 {id:"notify",n:"Uses core notifications and reporting",rule:"Messages go through the notification service and reports through the reporting service.",t:"team",run:a=>a.m.ownNotify&&a.m.ownReport?R("fail","Custom email sender and custom report exports.","Call notify.send and reports.publish."):a.m.ownNotify?R("fail","Custom email sender found.","Call notify.send; subscriptions and quiet hours then apply."):a.m.ownReport?R("warn","Custom report export found.","Publish through reports.publish so permissions follow the data."):R("pass","Notifications and reports use platform services.")},
 {id:"secrets",n:"No secrets in code",rule:"Keys and passwords live in the secret store, never in the repository.",t:"personal",run:a=>a.m.secrets?R("fail","An API key was found in the source and in one config file.","Rotate the key, move it to the secret store, then re-scan."):R("pass","Secret scan clean (0 findings).")},
 {id:"labels",n:"Classification labels present",rule:"Every stored field carries a classification label so masking and retention apply.",t:"team",run:a=>a.m.labels===false?R("fail","No classification labels in the manifest.","Run the Registry Agent label proposal and accept or edit each label."):a.m.labels==="partial"?R("warn","Labels missing on some fields that hold personal data.","Label the remaining fields; personal data defaults to restricted."):R("pass","All fields labeled.")},
 {id:"audit",n:"Audit hooks",rule:"Create, change and delete events go to the audit service.",t:"team",run:a=>a.m.audit?R("pass","Audit events flow to the audit service."):R("warn","No audit calls on write paths.","Add audit.log to each write handler.")},
 {id:"a11y",n:"Accessibility basics",rule:"Keyboard use, labels, contrast and focus order pass the automated checks.",t:"enterprise",run:a=>a.m.a11y==="pass"?R("pass","Automated checks pass (0 serious issues)."):R("warn","3 form fields have no label; one low-contrast button.","Add labels and use the platform button styles.")},
 {id:"aigw",n:"AI calls use the gateway with a spend cap",rule:"Every model call goes through the AI gateway, with guardrails and a monthly cap.",t:"personal",run:a=>{if(!(a.ai||[]).length)return R("pass","No AI use declared.");const d=a.ai.filter(x=>!x.gw);if(d.length)return R("fail",d[0].model+" is called directly, outside the gateway.","Route through the gateway; guardrails, logging and the cap then apply.");const nc=a.ai.filter(x=>!x.cap);return nc.length?R("warn","No monthly cap on "+nc[0].model+".","Set a cap in the manifest."):R("pass","All calls routed through the gateway; cap "+money(a.ai.reduce((s,x)=>s+x.cap,0))+" a month.")}},
 {id:"owner",n:"Support owner named",rule:"A named person is accountable for fixes, access reviews and retirement.",t:"team",run:a=>a.owner?R("pass","Support owner: "+a.owner+"."):R("fail","No support owner. Builder: "+a.builder+".","Name an owner from the builder's team or sunset the app.")},
 {id:"sunset",n:"Sunset date set",rule:"Every app has a review or sunset date so it cannot outlive its owner.",t:"team",run:a=>a.sunset?R("pass","Review or sunset on "+fD(a.sunset)+"."):R("warn","No sunset date.","Set a date within 18 months in the manifest.")}
];
function conformance(id){
 const a=app(id);if(!a)return{rows:[],pass:0,warn:0,fail:0,fails:0,score:0};
 const rows=CHECKS.map(c=>{let x=c.run(a);const w=G.waive[id+":"+c.id];if(x.r==="fail"&&w){if(w.exp>=TODAY){x=R("warn",x.ev+" Waived until "+fD(w.exp)+" by exception "+w.item+".",x.fix)}else x=R("fail",x.ev+" The waiver "+w.item+" expired on "+fD(w.exp)+".",x.fix)}return Object.assign({id:c.id,n:c.n,rule:c.rule,t:c.t},x)});
 const pass=rows.filter(r=>r.r==="pass").length,warn=rows.filter(r=>r.r==="warn").length,fail=rows.filter(r=>r.r==="fail").length;
 return{rows,pass,warn,fail,fails:fail,score:Math.round(100*(pass+.5*warn)/rows.length)};
}
const reuseScore=a=>{const ex=new Set((a.reads||[]).concat(a.writes||[])).size,nw=(a.newEnts||[]).length;return ex+nw===0?100:Math.round(100*ex/(ex+nw))};
const debtOf=id=>window.DEBT?DEBT.score(id):{score:100,principal:0,open:0,over:false,blocks:[],high:0,exceptions:0,ceiling:{h:24,high:0,exc:90},tier:"team"};
function decide(id){
 const a=app(id),c=conformance(id),d=debtOf(id);
 const certified=a.status==="certified",target=certified?TIERS[TI[a.tier]+1]:a.tier;
 const label=a.status==="sunset"?"Retired":a.status==="idea"?"Start a sandbox":certified?(target?"Promote to the "+target+" tier":"Already at the top tier"):a.status==="sandbox"?"Move from sandbox to review":"Certify at the "+a.tier+" tier";
 const need=target||a.tier;const blockers=c.rows.filter(r=>r.r==="fail"&&TI[r.t]<=TI[need]);
 const adv=c.rows.filter(r=>r.r==="warn");
 const why=blockers.map(r=>r.n+": "+r.ev);if(d.over)d.blocks.forEach(b=>why.push("Debt budget: "+b));
 return{pass:!!target&&!why.length&&a.status!=="sunset"&&a.status!=="idea",label,target:target||null,blockers,why,adv,c,d};
}
/* ---------- manifest ---------- */
function manifestOf(a){
 return{oukala_manifest:"1.0",app:{id:a.id,name:a.n,tier:a.tier,status:a.status,builder:a.builder,support_owner:a.owner||null,review_or_sunset:a.sunset||null},purpose:a.purpose||"",
  data:{reads:a.reads||[],writes:a.writes||[],new_entities:(a.newEnts||[]).map(n=>({id:n.id,reason:n.why||"",duplicate_of:n.dupOf||null}))},data_classes:a.classes||[],connectors:(a.connectors||[]).map(c=>(conns().find(x=>x.id===c)||{name:c}).name),
  ai:(a.ai||[]).map(x=>({model:x.model,route:x.gw?"ai_gateway":"direct",monthly_cap_usd:x.cap||null,purpose:x.use||""})),
  services:{auth:a.m.ownAuth?"custom":"platform",notifications:a.m.ownNotify?"custom":"platform",reporting:a.m.ownReport?"custom":"platform",audit:!!a.m.audit}};
}
/* ---------- reuse-first check ---------- */
const STOP=new Set("how the and for with from that this app new our are who what when into your you have has was will can its their per not all any one two".split(" "));
const SYN={onboard:"joins",onboarding:"joins",joining:"joins",hire:"joins",approve:"approval",approvals:"approval",approver:"approval",ticket:"incident",tickets:"incident",roster:"oncall",shifts:"oncall",swap:"oncall"};
const tok=s=>(s||"").toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3&&!STOP.has(w));
function procMatches(text){
 const want=new Map();tok(text).forEach(w=>{want.set(w,1);if(SYN[w])want.set(SYN[w],2)});const out=[];
 Object.keys(PROC.defs).forEach(k=>{const d=PROC.defs[k];if(!d||!d.title||k.indexOf("plat_")===0)return;const have=new Set(tok(d.title+" "+(d.steps||[]).map(s=>s.n).join(" ")));let n=0;want.forEach((wt,w)=>{if(have.has(w))n+=wt});if(n>=2)out.push({id:k,title:d.title,n})});
 return out.sort((a,b)=>b.n-a.n).slice(0,2);
}
function reuseReport(name,purpose,newText,needs){
 const items=[],terms=String(newText||"").split(/[,;\n]/).map(s=>s.trim()).filter(Boolean),text=(name||"")+" "+(purpose||"")+" "+terms.join(" ");
 let dup=false;
 terms.forEach(tm=>{const hits=PLAT.reuseCheck(tm,"");
  if(!hits.length){items.push({lvl:"good",t:"“"+tm+"” looks new",d:"No close match in the registry. It still goes to the data council as an entity proposal."});return}
  const pl=hits.find(h=>h.kind==="planned"),ex=hits.find(h=>h.kind==="existing");dup=true;
  if(pl){const e2=PLAT.entities().filter(e=>hits.some(h=>h.kind==="existing"&&h.id===e.id)).map(e=>e.label);items.push({lvl:"bad",t:"You are about to create a second "+pl.label.toLowerCase(),d:"Reuse "+pl.id+" (planned)"+(e2.length?" and use the existing "+e2.join(", ")+" fields in the meantime":"")+". "+Math.round(pl.sc*100)+"% match on name and purpose."})}
  else items.push({lvl:"bad",t:"“"+tm+"” duplicates "+ex.label,d:"Reuse "+ex.id+" (owned by "+((PLAT.ent(ex.id)||{}).owner||"the platform")+"). "+Math.round(ex.sc*100)+"% match."})});
 if(/budget|spend|forecast/i.test(text)){const f=PLAT.fieldsAll().filter(x=>(x.ent==="invoice"||x.ent==="project")&&/budget|cost|amount|paid|po/.test(x.k)).slice(0,6);if(f.length)items.push({lvl:"warn",t:"Budget numbers already exist",d:"Use invoice and project fields instead: "+f.map(x=>x.entLabel+" "+x.label.toLowerCase()).join(", ")+". Access rules then return the real number for each viewer."})}
 procMatches(text).forEach(p=>{items.push({lvl:"bad",t:"A process already exists: "+p.title,d:"Start it through the workflow service rather than building a second one (screen "+p.id+")."});dup=true});
 (needs||[]).forEach(id=>{const e=PLAT.ent(id);if(!e)return;items.push({lvl:["restricted","personal"].includes(e.cls)?"warn":"good",t:"Reads "+e.label,d:"Owner "+e.owner+", steward "+e.steward+", highest class "+e.cls+"."+(["restricted","personal"].includes(e.cls)?" Personal and restricted fields are masked unless the viewer needs them.":"")})});
 return{items,dup};
}
function reuseHTML(rep){return rep.items.length?`<div class="gate-rr">${rep.items.map(i=>`<div class="gate-rrow ${i.lvl}"><span class="pill ${i.lvl==="bad"?"bad":i.lvl==="warn"?"warn":"good"}">${i.lvl==="bad"?"Reuse first":i.lvl==="warn"?"Check":"Clear"}</span><div><b>${E(i.t)}</b><div class="small muted">${E(i.d)}</div></div></div>`).join("")}</div>`:`<p class="small muted">Describe what the app stores and the check runs as you type.</p>`}
/* ---------- public GATE ---------- */
const GATE=window.GATE={waived:(id,c)=>{const w=G.waive[id+":"+c];return !!(w&&w.exp>=TODAY)},apps,app,conformance,decide,manifest:manifestOf,CHECKS,TIERS,rev:()=>G.rev,reuseReport,conns,
 reuse:reuseScore,debt:id=>debtOf(id).score};
/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_gate_reuse:{n:"Citizen app reuse rate",f:"Registry entities used by citizen apps ÷ (registry entities used + new entities requested) × 100",u:"%",cur:80,tgt:85,badAt:65,dir:"max",max:100,tr:[60,64,66,70,72,76,78,80],owner:"Platform team",use:["Citizen apps"],rem:{kind:"agent",ref:"AG-GATE1",title:"Suggest the registry entity at design time",agent:"Registry Agent",auto:false,state:"idle",prog:"Runs the reuse check as the builder types and links the entity"}},
 m_gate_conf:{n:"Average conformance score",f:"Σ (passes + 0.5 × warnings) ÷ checks run, averaged over live citizen apps",u:"%",cur:75,tgt:85,badAt:65,dir:"max",max:100,tr:[58,60,64,66,69,71,73,75],owner:"Platform team",use:["Citizen apps"],rem:{kind:"kb",ref:"KB0730",title:"Fix hints for each gate check",agent:"Registry Agent",auto:false,state:"idle",prog:"Drafts the fix as a pull request for the builder to review"}},
 m_gate_dup:{n:"Duplicate rate",f:"Live citizen apps requesting a duplicate entity or copying a process ÷ live citizen apps × 100",u:"%",cur:40,tgt:10,badAt:35,dir:"min",max:100,tr:[55,52,50,48,46,44,42,40],owner:"Data council",use:["Citizen apps","Debt ledger"],rem:{kind:"sop",ref:"SOP-730",title:"Reuse before you build",agent:"Registry Agent",auto:false,state:"idle",prog:"Blocks the manifest and offers the entity to reuse"}},
 m_mcp_cov:{n:"Builds that checked for reuse first",f:"Citizen apps whose first design step was a check_reuse call ÷ citizen apps created × 100",u:"%",cur:58,tgt:90,badAt:50,dir:"max",max:100,tr:[10,18,26,34,40,46,52,58],owner:"Platform team",use:["AI and coding clients"],rem:{kind:"agent",ref:"AG-MCP1",title:"Make the reuse check the first tool call",agent:"Registry Agent",auto:false,state:"idle",prog:"Adds the platform contract file to each coding client"}}
});
function liveApps(){return apps().filter(a=>a.status!=="sunset"&&a.status!=="idea")}
function syncMetrics(){const L=liveApps();if(!L.length)return;METRICS.m_gate_reuse.cur=Math.round(L.reduce((s,a)=>s+reuseScore(a),0)/L.length);METRICS.m_gate_conf.cur=Math.round(L.reduce((s,a)=>s+conformance(a.id).score,0)/L.length);METRICS.m_gate_dup.cur=Math.round(100*L.filter(a=>(a.newEnts||[]).some(n=>n.dupOf)||a.dupProc).length/L.length)}
/* ---------- policies (OPA and Cedar compatible shape) ---------- */
const ROLES=[
 {id:"citizen_personal",n:"Citizen app, personal tier",kind:"app",tier:"personal"},
 {id:"citizen_team",n:"Citizen app, team tier",kind:"app",tier:"team"},
 {id:"citizen_enterprise",n:"Citizen app, enterprise tier",kind:"app",tier:"enterprise"},
 {id:"editor",n:"Editor",kind:"human",domains:["people"]},
 {id:"controller",n:"Finance controller",kind:"human",domains:["fin","portfolio"]},
 {id:"hr_partner",n:"HR partner",kind:"human",domains:["people"],ntk:true},
 {id:"ai_agent",n:"AI agent (First Officer)",kind:"agent",domains:["service","ops"]},
 {id:"platform_admin",n:"Platform administrator",kind:"human",domains:["*"],ntk:true,admin:true}];
const ACTIONS=[["read","Read"],["write","Write"],["create_entity","Create an entity"],["call_model","Call an AI model"],["promote","Promote an app"],["use_connector","Use a connector"]];
const HI=c=>PLAT.CLS_ORDER.indexOf(c);
const isApp=r=>r.kind==="app";
const POL=[
 {id:"citizen-read-internal",effect:"permit",plain:"Citizen apps may read public and internal entities. Confidential entities need the team tier or higher, and every read is audited.",
  json:{effect:"permit",principal:{type:"CitizenApp"},action:["read"],resource:{type:"Entity"},conditions:[{any:[{in:["resource.classification",["public","internal"]]},{all:[{eq:["resource.classification","confidential"]},{in:["principal.tier",["team","enterprise"]]}]}]}],obligations:["audit"]},
  cedar:'permit (principal is CitizenApp, action == Action::"read", resource is Entity)\n when { resource.classification in ["public","internal"] ||\n  (resource.classification == "confidential" && principal.tier != "personal") };',
  hit:c=>isApp(c.role)&&c.action==="read"&&(HI(c.cls)<=1||(c.cls==="confidential"&&c.role.tier!=="personal"))},
 {id:"mask-personal-restricted",effect:"permit",plain:"Reading an entity that holds personal or restricted fields returns those fields masked unless the viewer has a need to know.",
  json:{effect:"permit",principal:{type:"Any"},action:["read"],resource:{type:"Field",where:"classification in [restricted, personal]"},conditions:[{eq:["principal.need_to_know",false]}],obligations:[{mask:"resource.value",as:"•••• hidden"}]},
  cedar:'permit (principal, action == Action::"read", resource is Field)\n when { resource.classification in ["restricted","personal"] && !principal.needToKnow }\n obligation mask("hidden");',
  hit:()=>false,mask:true},
 {id:"no-second-writer",effect:"forbid",plain:"A citizen app may never write an entity directly. Writes go through the owner module's API so validation and audit apply.",
  json:{effect:"forbid",principal:{type:"CitizenApp"},action:["write"],resource:{type:"Entity"},conditions:[{ne:["resource.owner","principal.app"]}],unless:[{active:"exception"}]},
  cedar:'forbid (principal is CitizenApp, action == Action::"write", resource is Entity)\n unless { resource.owner == principal.app || context.exceptionActive };',
  hit:c=>isApp(c.role)&&c.action==="write"},
 {id:"no-duplicate-entity",effect:"forbid",plain:"Creating an entity that matches a registered or planned entity is denied unless an exception with an expiry exists.",
  json:{effect:"forbid",principal:{type:"Any"},action:["create_entity"],resource:{type:"Entity"},conditions:[{gte:["reuse_check.match",0.6]}],unless:[{active:"exception",max_days:"tier limit"}]},
  cedar:'forbid (principal, action == Action::"create_entity", resource is Entity)\n when { context.reuseMatch >= 0.6 } unless { context.exceptionActive };',
  hit:c=>c.action==="create_entity"},
 {id:"ai-via-gateway",effect:"forbid",plain:"Every model call must go through the AI gateway, which applies guardrails, logging and the monthly spend cap.",
  json:{effect:"forbid",principal:{type:"Any"},action:["call_model"],resource:{type:"Model"},conditions:[{ne:["context.route","ai_gateway"]}]},
  cedar:'forbid (principal, action == Action::"call_model", resource)\n when { context.route != "ai_gateway" };',
  hit:c=>c.action==="call_model"&&c.route!=="gateway"},
 {id:"personal-tier-no-sensitive",effect:"forbid",plain:"A personal-tier app may not touch restricted or personal data in any way.",
  json:{effect:"forbid",principal:{type:"CitizenApp",tier:"personal"},action:["read","write","call_model"],resource:{type:"Entity",where:"classification in [restricted, personal]"}},
  cedar:'forbid (principal is CitizenApp, action in [Action::"read",Action::"write",Action::"call_model"], resource is Entity)\n when { principal.tier == "personal" && resource.classification in ["restricted","personal"] };',
  hit:c=>isApp(c.role)&&c.role.tier==="personal"&&["read","write","call_model"].includes(c.action)&&HI(c.cls)>=3},
 {id:"debt-ceiling",effect:"forbid",plain:"An app cannot be promoted while its debt is over the ceiling for its tier or it fails a required conformance check.",
  json:{effect:"forbid",principal:{type:"Any"},action:["promote"],resource:{type:"CitizenApp"},conditions:[{any:[{gt:["resource.debt.principal_hours","ceiling[resource.tier]"]},{gt:["resource.conformance.required_failures",0]}]}]},
  cedar:'forbid (principal, action == Action::"promote", resource is CitizenApp)\n when { resource.debtHours > resource.ceiling || resource.requiredFailures > 0 };',
  hit:c=>{if(c.action!=="promote"||!c.app)return false;const d=decide(c.app.id);return !d.pass}},
 {id:"approved-connectors-only",effect:"forbid",plain:"Only enterprise-approved connectors may be used. Project-only and unapproved connectors are denied for citizen apps.",
  json:{effect:"forbid",principal:{type:"CitizenApp"},action:["use_connector"],resource:{type:"Connector"},conditions:[{eq:["resource.approved",false]}]},
  cedar:'forbid (principal is CitizenApp, action == Action::"use_connector", resource is Connector)\n when { resource.approved == false };',
  hit:c=>isApp(c.role)&&c.action==="use_connector"&&c.conn&&!c.conn.approved}
];
function simulate(s){
 const role=ROLES.find(r=>r.id===s.role),ent=PLAT.ent(s.ent)||PLAT.entities()[0],a=app(s.app),cn=conns().find(c=>c.id===s.conn)||conns()[0];
 const ctx={role,action:s.action,ent,cls:ent.cls,route:s.route,app:a,conn:cn};
 const forbid=POL.find(p=>p.effect==="forbid"&&p.hit(ctx));
 if(forbid)return{allow:false,by:forbid,why:"A forbid rule matched, and forbid always wins.",ent,masked:[]};
 const permit=POL.find(p=>p.effect==="permit"&&!p.mask&&p.hit(ctx));
 let by=permit,allow=!!permit,why=permit?"A permit rule matched and no forbid rule did.":"";
 if(!allow){
  const dom=ent.domain,owns=role.admin||(role.domains||[]).includes(dom);
  if(role.kind!=="app"&&["read","write","call_model","use_connector","create_entity","promote"].includes(s.action)){
   const ok=s.action==="read"?(owns||HI(ent.cls)<=1):s.action==="write"?owns:s.action==="call_model"?HI(ent.cls)<=2||role.admin:s.action==="use_connector"?true:role.admin;
   if(ok){allow=true;by={id:"rbac-baseline",effect:"permit",plain:"Inherited from Security and access: role "+role.n+" "+(owns?"owns the "+PLAT.DOM[dom].n+" domain":"may read internal data")+"."};why="Baseline role rule matched and no forbid rule did."}
  }
  if(!allow&&role.kind==="app"&&s.action==="call_model"&&HI(ent.cls)<=2&&role.tier!=="personal"||(!allow&&role.kind==="app"&&s.action==="call_model"&&role.tier==="personal"&&HI(ent.cls)<=1)){allow=true;by={id:"gateway-allow",effect:"permit",plain:"Citizen apps may call approved models through the gateway for data up to confidential."};why="Gateway route is allowed for this data class."}
  if(!allow&&role.kind==="app"&&s.action==="use_connector"&&cn.approved){allow=true;by={id:"connector-allow",effect:"permit",plain:"Approved connectors are open to team and enterprise apps."};why="Connector is approved."}
  if(!allow&&role.kind==="app"&&s.action==="promote"&&a){allow=true;by={id:"promote-allow",effect:"permit",plain:"Promotion is allowed once the gate passes and the debt budget holds."};why="Gate passes and debt is within the ceiling."}
 }
 if(!allow&&!by){by={id:"default-deny",effect:"deny",plain:"No rule permits this, and the platform denies by default."};why="Default deny."}
 const sens=ent.fields.map(f=>Object.assign({f},PLAT.fieldMeta(ent.id,f))).filter(x=>x.cls==="restricted"||x.cls==="personal");
 const masked=(allow&&s.action==="read"&&!role.ntk)?sens.slice(0,8):[];
 const shown=(allow&&s.action==="read")?(role.ntk?sens.slice(0,8):[]):[];
 return{allow,by,why,ent,masked,shown,sens:sens.length};
}
/* ---------- core services ---------- */
const SERVICES=[
 {id:"reporting",n:"Reporting",owner:"Platform lead",call:"reports.publish({ dataset: 'invoice', view: 'by_vendor', audience: 'role:controller' })",lim:"50 saved reports per app; 1M rows per run; permissions follow the data",why:"Access rules decide what each viewer sees, so a citizen app never copies a number."},
 {id:"notifications",n:"Notifications",owner:"Platform lead",call:"notify.send({ to: 'user:omar', template: 'renewal_due', channel: 'auto' })",lim:"2,000 messages a day per app; quiet hours and subscriptions applied",why:"One preference center for every person. No app sends its own email."},
 {id:"database",n:"Database",owner:"Data council chair",call:"db.entity('invoice').query({ where: { status: 'open' }, limit: 100 })",lim:"Team tier: 10 own tables, 1M rows total; reads of canonical entities are unlimited within rate",why:"Canonical entities come from the registry. Only approved new entities get tables."},
 {id:"auth",n:"Sign-in and access (RBAC and ABAC)",owner:"Security lead",call:"auth.can(user, 'read', 'invoice', { field: 'amount' })",lim:"Evaluated in under 20 ms; roles come from Entra ID groups",why:"No app keeps a user table. Attribute rules mask personal and restricted fields."},
 {id:"audit",n:"Audit",owner:"Security lead",call:"audit.log({ action: 'renewal_sent', subject: member.id })",lim:"Retained 7 years; tamper evident; searchable by subject",why:"One trail that auditors can query, instead of one per app."},
 {id:"search",n:"Search",owner:"Integration lead",call:"search.query({ q: 'ballot comments', scope: ['knowledge','exposure_drafts'] })",lim:"Lumen index; results filtered by the viewer's access",why:"Search respects permissions because it runs inside the platform."},
 {id:"files",n:"Files",owner:"Records manager",call:"files.put({ path: 'trips/2026/agenda.pdf', class: 'internal' })",lim:"Team tier: 20 GB; antivirus scan; retention by class",why:"Classification and retention are applied once, not by each app."},
 {id:"workflow",n:"Workflow",owner:"Process governance lead",call:"flow.start('onboarding', { subject: 'vendor:acme' })",lim:"Approvals, timers and tasks; 500 running instances per app",why:"Existing processes are started, not rebuilt. Approval paths stay consistent."},
 {id:"aigw",n:"AI gateway",owner:"AI governance",call:"ai.complete({ task: 'summarize', input: text, maxUsd: 0.05 })",lim:"Monthly cap per app; approved models only; prompt and output logged",why:"Guardrails, cost and data rules apply to every model call."}];
/* ---------- tier definitions ---------- */
const TIERDEF={
 personal:{n:"Personal",who:"One builder, up to 5 users",allows:"Read internal data. Own sandbox tables. AI through the gateway.",limits:"No restricted or personal data. No writes to canonical entities. No connectors beyond Microsoft 365 personal scope. AI cap $50 a month.",req:"Manifest, no secrets in code, AI through the gateway, no direct writes.",ttl:"Review every 90 days",debt:"8 h, no high items"},
 team:{n:"Team",who:"A team, up to 50 users",allows:"Read confidential data. Approved connectors. Approved new entities. Notifications and reporting.",limits:"No writes to canonical entities except through owner APIs. AI cap $200 a month. No customer-facing use.",req:"All personal checks plus no duplicate entities or processes, platform sign-in, core services, labels, audit hooks, support owner and sunset date.",ttl:"Review every 6 months",debt:"24 h, no high items"},
 enterprise:{n:"Enterprise",who:"Whole organization, thousands of users",allows:"Run on shared production capacity. Offer an API. Write through owner APIs after approval.",limits:"Availability target 99.5%. Change control applies. AI cap $1,000 a month.",req:"All team checks plus accessibility pass, security review, backup and restore test, named backup owner.",ttl:"Review every 12 months",debt:"40 h, no high items"}
};
/* ---------- helpers ---------- */
const scorePill=n=>pill_(n+"%",n>=80?"good":n>=60?"warn":"bad");
const stPill=s=>pill_(cap(s),STP[s]);
const tierPill=t=>`<span class="pill info">${cap(t)}</span>`;
function bars(rows,fmt){const mx=Math.max(1,...rows.map(r=>r[1]));return `<div class="debt-bars">${rows.map(r=>`<div class="debt-bar"><span class="small">${E(r[0])}</span><div class="debt-track"><i style="width:${Math.round(100*r[1]/mx)}%"></i></div><b>${fmt?fmt(r[1]):r[1]}</b></div>`).join("")}</div>`}
const aiLine=a=>(a.ai||[]).length?(a.ai||[]).map(x=>`${E(x.model)}${x.gw?"":" (direct)"}`).join(", "):"None";
/* ---------- plat_gate screen ---------- */
function gateScreen(){
 syncMetrics();const L=liveApps(),all=apps();
 const reuseAvg=METRICS.m_gate_reuse.cur,confAvg=METRICS.m_gate_conf.cur,dupRate=METRICS.m_gate_dup.cur;
 const aiSpend=all.reduce((s,a)=>s+(a.aiCost||0),0),ttfa=Math.round(all.filter(a=>a.ttfa).reduce((s,a)=>s+a.ttfa,0)/Math.max(1,all.filter(a=>a.ttfa).length));
 const orph=all.filter(a=>!a.owner&&a.status!=="sunset").length,blocked=L.filter(a=>!decide(a.id).pass&&a.status!=="certified").length;
 const hero_=hero("Platform · Citizen apps","Build fast on the platform, never beside it",
  `<b data-role="metric">${all.length}</b> citizen apps are registered: <b data-role="metric">${all.filter(a=>a.status==="certified").length}</b> certified, ${all.filter(a=>a.status==="review").length} in review and ${all.filter(a=>a.status==="sandbox").length} in sandbox. Reuse is <b data-role="metric">${reuseAvg}%</b> and <b data-role="metric">${dupRate}%</b> of live apps still ask for a duplicate entity or process. ${orph?orph+" app has no support owner. ":""}Apps are checked against the same registry, policies and core services, so they cannot create a second budget or a second onboarding process.`,
  `<div class="row">${fchip("m_gate_reuse")}${fchip("m_gate_conf")}${fchip("m_gate_dup")}${stdChip("togaf","Citizen apps follow the architecture principle of reuse before build, enforced by a manifest and a gate.")}<button class="btn primary" data-gate-new>New citizen app</button></div>`);
 const kp=kpiRow([["Citizen apps",all.length,all.filter(a=>a.status==="certified").length+" certified"],["Reuse",reuseAvg+"%","of entities already in the registry",{metric:"m_gate_reuse"}],["Duplicates",dupRate+"%","wanting a second copy",{cls:dupRate>20?"bad":"good",keep:true,metric:"m_gate_dup"}],["Conformance",confAvg+"%","12 checks per app",{metric:"m_gate_conf"}],["First app",ttfa+" d","from training to sandbox"],["AI spend",money(aiSpend),"a month, all through the gateway"]]);
 const matrix=`<div class="tscroll"><table><thead><tr><th>Tier</th>${ST.map(s=>`<th>${cap(s)}</th>`).join("")}</tr></thead><tbody>${TIERS.map(t=>`<tr><td><b>${cap(t)}</b></td>${ST.map(s=>{const n=all.filter(a=>a.tier===t&&a.status===s).length;return `<td>${n?`<span class="pill ${STP[s]}">${n}</span>`:'<span class="muted">0</span>'}</td>`}).join("")}</tr>`).join("")}</tbody></table></div>`;
 const aiRows=all.filter(a=>a.aiCost).sort((a,b)=>b.aiCost-a.aiCost).map(a=>[a.n,a.aiCost]);
 const attn=all.filter(a=>a.status!=="sunset"&&a.status!=="idea").map(a=>({a,d:decide(a.id)})).filter(x=>!x.a.owner||x.d.c.fails>0).sort((x,y)=>y.d.c.fails-x.d.c.fails).slice(0,5).map(x=>`<button class="debt-li" data-gate-open="${E(x.a.id)}"><span class="debt-li-t">${E(x.a.n)}</span><span class="small muted">${x.a.owner?"":"No support owner. "}${x.d.c.fails} failing check${x.d.c.fails===1?"":"s"} · ${cap(x.a.tier)} tier · ${cap(x.a.status)}</span></button>`).join("");
 const pane0=`${kp}<div class="grid g2" style="gap:16px">${card("Apps by tier and status","Number of apps in each cell; color shows the status",matrix+legend([["Certified","--good-f"],["In review","--warn-f"],["Sandbox","--info-f"]]))}${card("AI spend by app","Monthly cost of model calls, all routed through the AI gateway unless noted",bars(aiRows,v=>money(v)),aiChip({model:"AI gateway",title:"Spend data",note:"Spend comes from the gateway meter, not from the apps.",src:["AI gateway meter","App manifests"],guards:["Per-app monthly cap","Approved models only","Prompts and outputs logged"]}))}</div>
  <div style="margin-top:14px">${card("Needs attention","Apps with a failing gate check or no support owner. "+blocked+" cannot move forward today.",`<div class="debt-list">${attn||"<p class='muted small'>Every live app passes.</p>"}</div>`)}</div>
  <div class="story" style="margin-top:14px" data-role="story"><b>Why this matters.</b> Citizen developers build with AI tools in hours. Without a gate each app grows its own tables and logins, and the enterprise inherits the debt. Here every app declares what it uses, the gate checks it, and the debt ledger prices anything it leaves behind. ${whyPop("A citizen app that reuses the platform costs the enterprise almost nothing to keep. One that copies data costs rework every month.")}</div>`;
 const apt=btHTML({id:"gate_apps",cols:[
  {k:"n",label:"App",fmt:r=>`<b>${E(r.n)}</b><div class="muted small">${E(r.purpose)}</div>`,val:r=>r.n,wrap:true,w:300},
  {k:"tier",label:"Tier",fmt:r=>tierPill(r.tier),val:r=>TI[r.tier]},
  {k:"status",label:"Status",fmt:r=>stPill(r.status),val:r=>ST.indexOf(r.status)},
  {k:"builder",label:"Builder",fmt:r=>E(r.builder),val:r=>r.builder,wrap:true},
  {k:"owner",label:"Support owner",fmt:r=>r.owner?E(r.owner):pill_("None","bad"),val:r=>r.owner||"",wrap:true},
  {k:"reuse",label:"Reuse",fmt:r=>scorePill(reuseScore(r)),val:r=>reuseScore(r)},
  {k:"debt",label:"Debt score",fmt:r=>scorePill(debtOf(r.id).score),val:r=>debtOf(r.id).score},
  {k:"conf",label:"Conformance",fmt:r=>scorePill(conformance(r.id).score),val:r=>conformance(r.id).score},
  {k:"ents",label:"Entities used",fmt:r=>new Set((r.reads||[]).concat(r.writes||[])).size,val:r=>new Set((r.reads||[]).concat(r.writes||[])).size},
  {k:"nw",label:"New entities",fmt:r=>(r.newEnts||[]).length?pill_((r.newEnts||[]).length+(r.newEnts.some(n=>n.dupOf)?" duplicate":""),r.newEnts.some(n=>n.dupOf)?"bad":"mute"):"0",val:r=>(r.newEnts||[]).length},
  {k:"conn",label:"Connectors",fmt:r=>E((r.connectors||[]).map(c=>(conns().find(x=>x.id===c)||{name:c}).name).join(", ")||"None"),val:r=>(r.connectors||[]).length,wrap:true},
  {k:"ai",label:"AI models",fmt:r=>aiLine(r),val:r=>(r.ai||[]).length,wrap:true},
  {k:"cost",label:"Cost a month",fmt:r=>money(r.cost),val:r=>r.cost},
  {k:"sunset",label:"Sunset date",fmt:r=>r.sunset?fD(r.sunset):"Not set",val:r=>r.sunset||"9999"}
 ],rows:()=>apps(),key:"id",h:480,rowH:64,facets:["tier","status","builder"],groupBy:["tier","status","builder"],exportName:"citizen-apps",open:id=>appDrawer(id)});
 const pane1=`<p class="muted small">The manifest registry. Every citizen app declares what it reads, writes, connects to and spends. Select a row for its manifest, checks and debt.</p>${apt}`;
 const q=G.qc;
 const pane2=`<div class="grid g2" style="gap:16px;align-items:start">${card("Can I build this?","Type what you want to build. The reuse-first check runs against the live registry and the existing processes.",`<div class="grid" style="gap:10px"><label class="fld"><span class="flab">What are you building</span><input class="fin" data-gate-qc="name" value="${E(q.name)}" placeholder="Budget tracker"></label><label class="fld"><span class="flab">New tables or lists you think you need</span><input class="fin" data-gate-qc="needs" value="${E(q.needs)}" placeholder="budget table, vendor list"></label></div><div data-gate-qcout style="margin-top:12px">${reuseHTML(reuseReport(q.name,q.name,q.needs,[]))}</div>`)}
  ${card("The journey of a new app","Five steps, with the gate before any promotion",`<ol class="small debt-steps"><li><b>Describe</b>: purpose, data, connectors, AI use.</li><li><b>Reuse first</b>: the check proposes existing entities, fields and processes.</li><li><b>Manifest</b>: produced for you; your coding tool can also generate it through the MCP server.</li><li><b>Sandbox</b>: build with real read access and no write access.</li><li><b>Gate</b>: 12 checks, then review and certification.</li></ol><div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" data-gate-new>Open the new app wizard</button><button class="btn quiet" data-gate-new="budget">Try it with a budget tracker</button></div>`)}</div>`;
 const pane3=gateTab();
 const tierRows=TIERS.map(t=>{const d=TIERDEF[t];return `<section class="card glass gate-tier"><div class="row" style="justify-content:space-between;gap:8px"><h3 style="margin:0">${d.n} tier</h3>${tierPill(t)}</div><p class="small muted" style="margin:4px 0 10px">${E(d.who)}</p><dl class="kv"><dt>Allowed</dt><dd>${E(d.allows)}</dd><dt>Limits</dt><dd>${E(d.limits)}</dd><dt>To get here</dt><dd>${E(d.req)}</dd><dt>Debt budget</dt><dd>${E(d.debt)}</dd><dt>Review</dt><dd>${E(d.ttl)}</dd><dt>Apps</dt><dd>${apps().filter(a=>a.tier===t&&a.status!=="sunset").length}</dd></dl></section>`}).join("");
 const chkRows=CHECKS.map(c=>`<tr><td><b>${E(c.n)}</b></td><td class="small">${E(c.rule)}</td>${TIERS.map(t=>`<td>${TI[t]>=TI[c.t]?pill_("Blocks","bad"):pill_("Advisory","mute")}</td>`).join("")}</tr>`).join("");
 const pane4=`<p class="muted small">Tiers match how far an app can reach. Moving up a tier turns advisory checks into blocking ones and tightens the debt budget.</p><div class="grid g3 gate-tiers" style="gap:14px">${tierRows}</div><div style="margin-top:14px">${card("Which check blocks which tier","A failing check blocks promotion into any tier marked Blocks",`<div class="tscroll"><table><thead><tr><th>Check</th><th>Rule</th>${TIERS.map(t=>`<th>${cap(t)}</th>`).join("")}</tr></thead><tbody>${chkRows}</tbody></table></div>`)}</div>`;
 const pane5=policiesTab();
 const svc=SERVICES.map(s=>`<section class="card glass gate-svc"><div class="row" style="justify-content:space-between;gap:8px"><h3 style="margin:0">${E(s.n)}</h3><span class="pill bad">Never rebuild</span></div><p class="small" style="margin:6px 0">${E(s.why)}</p><pre class="gate-code" tabindex="0">${E(s.call)}</pre><dl class="kv" style="margin-top:8px"><dt>Limits</dt><dd>${E(s.lim)}</dd><dt>Owner</dt><dd>${E(s.owner)}</dd></dl></section>`).join("");
 const pane6=`<div class="dnote" data-role="story" style="margin-bottom:12px">These nine services are the reason a citizen app stays small. If your app does any of these jobs itself, the gate fails it and the debt ledger records a bypassed core service. ${aiChip({model:"Registry Agent",conf:.9,title:"Service detection",note:"The linter finds custom code that does a core service's job by matching imports and call patterns.",src:["Repository scan","App manifests"],guards:["Read-only","Findings become debt items"]})}</div><div class="grid g3 gate-svcs" style="gap:14px">${svc}</div>`;
 return `<div class="screen">${hero_}${lensNote()}${views("gate",["Overview","Apps","New app","Conformance gate","Certification tiers","Policies","Core services"],[pane0,pane1,pane2,pane3,pane4,pane5,pane6])}${procCard("plat_gate")}</div>`;
}
/* ---------- conformance gate tab ---------- */
function gateRows(id){
 const a=app(id),d=decide(id),c=d.c;const ran=G.ran[id];
 if(!ran)return `<div class="story">Not run yet for ${E(a.n)}. Select Run the gate to lint the manifest and the repository.</div>`;
 const ic={pass:"pass",warn:"warn",fail:"fail"};
 const rows=c.rows.map(r=>`<tr class="gate-r ${r.r}"><td>${pill_(r.r==="pass"?"Pass":r.r==="warn"?"Warn":"Fail",r.r==="pass"?"good":r.r==="warn"?"warn":"bad")}</td><td><b>${E(r.n)}</b><div class="small muted">${E(r.rule)}</div><div class="small muted">Blocks from the ${r.t} tier</div></td><td class="small">${E(r.ev)}</td><td class="small">${E(r.fix||"None needed")}${r.r==="fail"?`<div style="margin-top:6px"><button class="btn quiet" data-gate-exc="${E(id+":"+r.id)}">Request an exception</button></div>`:""}</td></tr>`).join("");
 const dec=`<div class="gate-dec ${d.pass?"ok":"no"}"><div><div class="eyebrow">Gate decision</div><h3 style="margin:2px 0">${d.pass?"Pass: "+E(d.label):d.target||a.status==="certified"||a.status==="review"||a.status==="sandbox"?"Blocked: "+E(d.label):E(d.label)}</h3><p class="small" style="margin:0">${d.pass?"All required checks pass and the debt budget holds.":d.why.length?E(d.why.slice(0,4).join(" · ")):"Nothing to promote."}</p></div><div class="row" style="gap:8px;flex-wrap:wrap">${d.pass?`<button class="btn primary" data-gate-promote="${E(id)}">${E(d.label)}</button>`:""}${aiChip({model:"Conformance linter",conf:.95,title:"Linter output",note:"Deterministic checks. The Registry Agent only drafts the fix hints.",src:["Manifest","Repository scan","Registry","Debt ledger"],guards:["Read-only on the repository","Decision is policy, not opinion"]})}${whyPop("The gate decision comes from the debt-ceiling policy and the required checks for the target tier.")}</div></div>`;
 return `${dec}${kpiRow([["Pass",c.pass,"of 12 checks",{cls:"good",keep:true}],["Warn",c.warn,"advisory or waived",{keep:true}],["Fail",c.fail,"fix or request an exception",{cls:c.fail?"bad":"good",keep:true}],["Conformance",c.score+"%","passes + half of warnings"],["Debt score",d.d.score+"%",d.d.principal+" h of "+d.d.ceiling.h+" h"]])}<div class="tscroll"><table class="gate-tbl"><thead><tr><th>Result</th><th>Check and rule</th><th>Evidence</th><th>Fix hint</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function gateTab(){
 if(!G.sel||!app(G.sel))G.sel="ca_budget";
 const a=app(G.sel);
 return `<p class="muted small">A runnable linter. Pick an app and run the 12 checks. Each row shows the rule, the evidence found and a fix hint. The result decides promotion between tiers.</p>
 <div class="grid g2" style="gap:12px;align-items:end;margin-bottom:12px"><label class="fld"><span class="flab">App</span><select class="fin" data-gate-sel>${apps().map(x=>`<option value="${E(x.id)}" ${x.id===G.sel?"selected":""}>${E(x.n)} (${x.tier}, ${x.status})</option>`).join("")}</select></label><div class="row" style="gap:8px"><button class="btn primary" data-gate-run>Run the gate</button><button class="btn quiet" data-gate-open="${E(G.sel)}">Open the app</button></div></div>
 ${legend([["Pass","--good-f"],["Warn","--warn-f"],["Fail","--bad-f"]])}<div data-gate-out>${gateRows(G.sel)}</div>`;
}
/* ---------- policies tab ---------- */
function simHTML(){
 const s=G.sim,res=simulate(s),role=ROLES.find(r=>r.id===s.role);
 const maskRows=res.masked.length?res.masked.map(m=>`<tr><td>${E(m.f.label)}</td><td>${pill_(m.cls,"bad")}</td><td>${pill_("Masked","warn")}</td><td class="muted small">•••• hidden</td></tr>`).join(""):"";
 const shownRows=(res.shown||[]).map(m=>`<tr><td>${E(m.f.label)}</td><td>${pill_(m.cls,"bad")}</td><td>${pill_("Visible","good")}</td><td class="small">Need to know: ${E(role.n)}</td></tr>`).join("");
 return `<div class="gate-dec ${res.allow?"ok":"no"}"><div><div class="eyebrow">Decision</div><h3 style="margin:2px 0">${res.allow?"Allow":"Deny"}: ${E(role.n)} to ${E((ACTIONS.find(x=>x[0]===s.action)||[0,s.action])[1].toLowerCase())} ${E(res.ent.label)}</h3><p class="small" style="margin:0">Decided by <b>${E(res.by.id)}</b>. ${E(res.why)} ${E(res.by.plain)}</p></div></div>
 ${maskRows||shownRows?`<h3 style="margin:14px 0 6px">Field masking on ${E(res.ent.label)}</h3><div class="tscroll"><table><thead><tr><th>Field</th><th>Class</th><th>Result</th><th>Note</th></tr></thead><tbody>${shownRows}${maskRows}</tbody></table></div>`:s.action==="read"&&res.allow?`<p class="small muted">${res.sens?"":"No personal or restricted fields on this entity, so nothing is masked."}</p>`:""}`;
}
function policiesTab(){
 const s=G.sim;
 const list=POL.map(p=>`<section class="card glass gate-pol"><div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><h3 style="margin:0">${E(p.id)}</h3>${pill_(p.effect==="forbid"?"Forbid":"Permit",p.effect==="forbid"?"bad":"good")}</div><p class="small" style="margin:6px 0">${E(p.plain)}</p><pre class="gate-code" tabindex="0">${E(JSON.stringify(p.json,null,2))}</pre><details class="small"><summary>Same rule in Cedar style</summary><pre class="gate-code" tabindex="0">${E(p.cedar)}</pre></details></section>`).join("");
 return `<div class="dnote" data-role="story" style="margin-bottom:12px">Eight policies shape what any app, person or AI agent may do. They are written natively in the platform, with <b>principal, action, resource and conditions</b>, so they can be exported to OPA (Open Policy Agent) or Cedar without rewriting. Role rules inherit from <button class="btn quiet" data-gate-go="adm_sec">Security and access</button>. ${typeof stdChip==="function"&&window.STD&&STD.nist?stdChip("nist","Policies follow attribute based access control as described in NIST SP 800-162."):""}</div>
 ${card("Policy simulator","Pick who is asking, what they want to do and to what. The first forbid rule that matches wins, otherwise a permit, otherwise deny.",`<div class="grid g2" style="gap:12px"><label class="fld"><span class="flab">Principal (role)</span><select class="fin" data-gate-sim="role">${ROLES.map(r=>`<option value="${r.id}" ${r.id===s.role?"selected":""}>${E(r.n)}</option>`).join("")}</select></label><label class="fld"><span class="flab">Action</span><select class="fin" data-gate-sim="action">${ACTIONS.map(a=>`<option value="${a[0]}" ${a[0]===s.action?"selected":""}>${a[1]}</option>`).join("")}</select></label><label class="fld"><span class="flab">Resource (entity)</span><select class="fin" data-gate-sim="ent">${PLAT.entities().map(e=>`<option value="${E(e.id)}" ${e.id===s.ent?"selected":""}>${E(e.label)} (${e.cls})</option>`).join("")}</select></label>
  <label class="fld"><span class="flab">App (used when promoting)</span><select class="fin" data-gate-sim="app">${apps().map(a=>`<option value="${a.id}" ${a.id===s.app?"selected":""}>${E(a.n)}</option>`).join("")}</select></label>
  <label class="fld"><span class="flab">Route (used for AI calls)</span><select class="fin" data-gate-sim="route"><option value="gateway" ${s.route==="gateway"?"selected":""}>AI gateway</option><option value="direct" ${s.route==="direct"?"selected":""}>Direct to provider</option></select></label>
  <label class="fld"><span class="flab">Connector (used for connector access)</span><select class="fin" data-gate-sim="conn">${conns().map(c=>`<option value="${E(c.id)}" ${c.id===s.conn?"selected":""}>${E(c.name)}${c.approved?"":" (not approved)"}</option>`).join("")}</select></label></div><div data-gate-simout style="margin-top:14px">${simHTML()}</div>`)}
 <h3 style="margin:18px 0 8px">The policies</h3><div class="grid g2 gate-pols" style="gap:14px;align-items:start">${list}</div>`;
}
/* ---------- app drawer ---------- */
function appDrawer(id){
 const a=app(id);if(!a)return;const d=decide(id),c=d.c,dbt=debtOf(id),its=window.DEBT?DEBT.byApp(id):[];
 const man=JSON.stringify(manifestOf(a),null,2);
 const aiBlock=(a.ai||[]).length?`<h3>AI use</h3>${a.ai.map(x=>`<div class="row" style="gap:8px;flex-wrap:wrap;margin:4px 0">${aiChip({model:x.model,title:"AI use in "+a.n,note:x.use+". "+(x.gw?"Routed through the AI gateway.":"Called directly, outside the gateway: the gate fails this."),src:["App manifest","AI gateway meter"],guards:x.gw?["Approved model","Monthly cap "+money(x.cap),"Prompts logged"]:["No guardrails apply","Not allowed beyond the personal tier"]})}<span class="small">${E(x.use)}</span>${x.gw?pill_("Gateway","good"):pill_("Direct","bad")}</div>`).join("")}`:"";
 const linked=lrHTML({id:"gate_dr_"+id,limit:5,groups:[{key:"r",label:"Entities it reads",rows:(a.reads||[]).map(e=>({id:e,t:entL(e),sub:(PLAT.ent(e)||{}).owner||"",tag:"read",go:()=>go("plat_reg")}))},{key:"w",label:"Entities it writes",rows:(a.writes||[]).map(e=>({id:e,t:entL(e),sub:"Direct write",tag:"write",go:()=>go("plat_reg")}))},{key:"n",label:"New entities requested",rows:(a.newEnts||[]).map(n=>({id:n.id,t:n.id.replace(/_/g," "),sub:n.dupOf?"Duplicates "+n.dupOf:"Approved addition",tag:n.dupOf?"duplicate":"new"}))},{key:"d",label:"Debt items",rows:its.map(x=>({id:x.id,t:x.title,sub:x.sev+", "+x.principal+" h",tag:x.type,go:()=>go("plat_debt")}))}].filter(g=>g.rows.length)});
 openDrawer(`<div class="dfullgrid"><div><div class="eyebrow">Citizen app · ${E(a.id)}</div><h2 style="margin:4px 0 8px;padding-right:60px">${E(a.n)}</h2><p class="small">${E(a.purpose)}</p>
  <div class="row" style="gap:8px;flex-wrap:wrap">${tierPill(a.tier)}${stPill(a.status)}${a.owner?"":pill_("No support owner","bad")}</div>
  <dl class="kv" style="margin-top:12px"><dt>Builder</dt><dd>${whoChip(a.builder)}</dd><dt>Support owner</dt><dd>${a.owner?whoChip(a.owner):"None named"}</dd><dt>Users</dt><dd>${a.users}</dd><dt>Cost a month</dt><dd>${money(a.cost)}${a.aiCost?" (AI "+money(a.aiCost)+")":""}</dd><dt>Sunset</dt><dd>${a.sunset?fD(a.sunset):"Not set"}</dd><dt>Reuse</dt><dd><span data-role="metric">${reuseScore(a)}%</span></dd><dt>Conformance</dt><dd><span data-role="metric">${c.score}%</span> (${c.pass} pass, ${c.warn} warn, ${c.fail} fail)</dd><dt>Debt score</dt><dd><span data-role="metric">${dbt.score}%</span>, ${dbt.principal} h against a ${dbt.ceiling.h} h ceiling</dd></dl>
  <div class="story small" style="margin:10px 0"><b>${d.pass?"Gate passes.":"Gate blocks."}</b> ${E(d.label)}${d.pass?" is allowed.":": "+E(d.why.slice(0,3).join(" · ")||"nothing to promote")}</div>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-gate-rundrawer="${E(id)}">Run the gate</button>${d.pass?`<button class="btn" data-gate-promote="${E(id)}">${E(d.label)}</button>`:""}<button class="btn" data-gate-assign="${E(id)}">${a.owner?"Change owner":"Name an owner"}</button>${a.status!=="sunset"?`<button class="btn quiet" data-gate-sunset="${E(id)}">Sunset</button>`:""}</div>${aiBlock}</div>
  <div><h3>Manifest</h3><pre class="gate-code" tabindex="0">${E(man)}</pre><h3>Linked records</h3>${linked}</div></div>`);
}
/* ---------- new app wizard ---------- */
function wizard(pre){
 pre=pre||{};
 const ents=PLAT.entities().map(e=>[e.id,e.label+" · "+e.owner]);
 const conOpts=conns().map(c=>[c.id,c.name+(c.approved?"":" (not approved)")]);
 const mk=v=>{const reads=v.needs||[];return{id:"ca_new",n:v.name||"New app",purpose:v.purpose||"",tier:v.tier||"personal",status:"sandbox",builder:v.builder||"Omar Hamid",owner:v.owner||"",reads,writes:[],newEnts:String(v.newEnts||"").split(/[,;]/).map(s=>s.trim()).filter(Boolean).map(s=>({id:s.toLowerCase().replace(/[^a-z0-9]+/g,"_"),why:v.purpose||""})),connectors:v.conns||[],ai:v.ai?[{model:v.model||"Claude Haiku",gw:v.model!=="Other provider, direct",cap:+v.cap||0,use:v.aiuse||"Assist the user"}]:[],classes:v.classes&&v.classes.length?v.classes:["internal"],sunset:v.sunset||"",m:Object.assign({},MOK)}};
 openForm({id:"gate_new",title:"New citizen app",submit:"Create in sandbox",
  story:"Describe the app. The reuse-first check runs as you type and tells you what to reuse. The manifest is produced from your answers; your coding tool can use the same manifest through the MCP server. The app starts in the sandbox with read access only.",
  fields:[{section:"Purpose"},{k:"name",label:"App name",type:"text",req:true,ph:"Budget tracker"},{k:"purpose",label:"What does it do and for whom",type:"longtext",req:true,ph:"Track budget against actual spend for the editorial programs"},{k:"tier",label:"Starting tier",type:"chips",opts:[["personal","Personal"],["team","Team"],["enterprise","Enterprise"]]},{k:"builder",label:"Builder",type:"people",req:true},{k:"owner",label:"Support owner",type:"people",help:"Can be the builder. Required before review."},
   {section:"Data it needs"},{k:"needs",label:"Existing data it reads (from the registry)",type:"multi",opts:ents,help:"Pick from the real registry. Access rules return only what each viewer may see."},{k:"newEnts",label:"New tables or lists you want to create",type:"text",ph:"budget table, vendor list",help:"Leave empty if the registry already covers it."},{k:"classes",label:"Data classes stored",type:"multi",opts:PLAT.CLS_ORDER.map(c=>[c,cap(c)])},
   {section:"Connections and AI"},{k:"conns",label:"Connectors",type:"multi",opts:conOpts},{k:"ai",label:"Uses an AI model",type:"toggle"},{k:"model",label:"Model",type:"select",opts:["Claude Haiku","Claude Sonnet","Embedding model","Other provider, direct"],show:v=>v.ai},{k:"aiuse",label:"What the model does",type:"text",show:v=>v.ai},{k:"cap",label:"Monthly AI cap",type:"money",show:v=>v.ai},{k:"sunset",label:"Review or sunset date",type:"date"}],
  defaults:Object.assign({tier:"personal",builder:"Omar Hamid",needs:[],classes:["internal"],sunset:iso(365)},pre),
  live:v=>{const m=mk(v),rep=reuseReport(v.name,v.purpose,v.newEnts,v.needs||[]);return `<div class="gate-live"><div class="eyebrow">Reuse-first check</div>${reuseHTML(rep)}${rep.dup?`<div class="story small"><b>The gate would fail this app</b> on duplicate entities or processes. You can still create the sandbox, but promotion needs a reuse or an exception.</div>`:""}${v.ai&&v.model==="Other provider, direct"?`<div class="story small"><b>Direct model calls are not allowed.</b> The gateway is the only route beyond the personal tier.</div>`:""}<div class="eyebrow" style="margin-top:12px">Manifest preview</div><pre class="gate-code" tabindex="0">${E(JSON.stringify(manifestOf(m),null,2))}</pre></div>`},
  onSubmit:v=>{const m=mk(v);const id="ca_"+(v.name||"app").toLowerCase().replace(/[^a-z0-9]+/g,"_").slice(0,20);
   m.newEnts=m.newEnts.map(n=>{const h=PLAT.reuseCheck(n.id.replace(/_/g," "),"")[0];return h&&h.sc>=.5?Object.assign(n,{dupOf:h.id+(h.kind==="planned"?" (planned)":"")}):n});
   m.id=id+(app(id)?"_"+(apps().length+1):"");m.users=1;m.cost=0;m.ttfa=1;m.created=TODAY;m.dupProc=(procMatches((v.name||"")+" "+(v.purpose||""))[0]||{}).id||"";if(m.dupProc&&!/onboard|approv|incident|release|sla|slo|on-call|oncall|cmdb|request/i.test((v.name||"")+(v.purpose||"")))m.dupProc="";
   m.builder=v.builder||"Omar Hamid";apps().push(m);bump();audit("Citizen app created",m.n+" ("+m.tier+") in sandbox");toast("Created in sandbox: "+m.n,"good");closeDrawer();render();setTimeout(()=>appDrawer(m.id),200)}});
}
/* ---------- plat_gate events ---------- */
document.addEventListener("click",e=>{
 let t=e.target.closest("[data-gate-open]");if(t){appDrawer(t.dataset.gateOpen);return}
 t=e.target.closest("[data-gate-new]");if(t){wizard(t.dataset.gateNew==="budget"?{name:"Budget tracker",purpose:"Track budget against actual spend for the editorial programs",newEnts:"budget table",needs:["invoice","project"],builder:"Dev Rao"}:{});return}
 t=e.target.closest("[data-gate-run]");if(t){G.ran[G.sel]=1;const c=conformance(G.sel);const o=document.querySelector("[data-gate-out]");if(o)o.innerHTML=gateRows(G.sel);audit("Gate run",app(G.sel).n+": "+c.pass+" pass, "+c.warn+" warn, "+c.fail+" fail");toast("Gate: "+c.pass+" pass, "+c.warn+" warn, "+c.fail+" fail",c.fail?"warn":"good");return}
 t=e.target.closest("[data-gate-rundrawer]");if(t){G.sel=t.dataset.gateRundrawer;G.ran[G.sel]=1;S.v.gate=3;closeDrawer();render();toast("Gate run for "+app(G.sel).n);return}
 t=e.target.closest("[data-gate-promote]");if(t){const id=t.dataset.gatePromote,a=app(id),d=decide(id);if(!d.pass){toast("The gate blocks this","warn");return}
  if(a.status==="certified"&&d.target){a.tier=d.target}else a.status=a.status==="sandbox"?"review":"certified";bump();audit("Citizen app promoted",a.n+" now "+a.tier+" tier, "+a.status);toast(a.n+": "+a.tier+" tier, "+a.status,"good");closeDrawer();render();return}
 t=e.target.closest("[data-gate-exc]");if(t){const [aid,cid]=t.dataset.gateExc.split(":"),a=app(aid),ck=CHECKS.find(c=>c.id===cid);const typ={nodup:"dup_entity",noproc:"dup_proc",nowrite:"nonowner",notify:"bypass",auth:"bypass",labels:"no_class",owner:"orphan",secrets:"ooc",manifest:"ooc",aigw:"bypass",sunset:"ooc",audit:"ooc",a11y:"ooc"}[cid]||"ooc";
  openForm({id:"gate_exc",title:"Request an exception for “"+ck.n+"”",submit:"Submit exception",story:"The check is waived until the expiry and a debt item is created with an owner. When it expires, the check fails again and a fix or decommission task is created.",
   fields:[{k:"reason",label:"Why can this not be fixed now",type:"longtext",req:true},{k:"owner",label:"Owner who answers for it",type:"people",req:true},{k:"exp",label:"Expires on",type:"date",req:true},{k:"ctrl",label:"Compensating control",type:"text",ph:"Weekly review by the owner"}],defaults:{owner:a.owner||a.builder,exp:iso(({personal:30,team:90,enterprise:180})[a.tier])},
   live:v=>{const lim=(window.DEBT?DEBT.ceilings()[a.tier].exc:90),d=v.exp?days(TODAY,v.exp):0;return `<div class="story"><b>What happens next.</b> A debt item is added to the ledger and the check is waived for ${d} days. ${d>lim?`<b>The ${a.tier} tier allows ${lim} days; the data council must approve longer.</b>`:`Within the ${a.tier} tier limit of ${lim} days.`}</div>`},
   onSubmit:v=>{const did=window.DEBT?DEBT.add({type:typ,title:a.n+": exception for “"+ck.n+"”",sev:"Medium",source:"exception",apps:[aid],ents:[],owner:a.n,owner2:v.owner,steward:"Data council chair",principal:12,exp:v.exp,reason:v.reason+(v.ctrl?" Control: "+v.ctrl:""),status:"accepted",fix:"Exception until "+fD(v.exp)}):"DB-X";
    G.waive[aid+":"+cid]={exp:v.exp,item:did};bump();audit("Gate exception requested",aid+" "+cid+" "+did);toast("Exception "+did+" created; check waived","good");closeDrawer();const o=document.querySelector("[data-gate-out]");if(o)o.innerHTML=gateRows(G.sel);render()}});return}
 t=e.target.closest("[data-gate-assign]");if(t){const id=t.dataset.gateAssign,a=app(id);openForm({id:"gate_own",title:"Name a support owner",submit:"Save",story:"The support owner is accountable for fixes, access reviews and retirement. The orphan app debt item closes when an owner is named.",fields:[{k:"who",label:"Support owner",type:"people",req:true}],onSubmit:v=>{a.owner=v.who;bump();audit("Support owner set",a.n+" "+v.who);toast("Owner set: "+v.who,"good");closeDrawer();render()}});return}
 t=e.target.closest("[data-gate-sunset]");if(t){const id=t.dataset.gateSunset,a=app(id);openForm({id:"gate_sun",title:"Sunset "+a.n,submit:"Schedule sunset",story:"The app moves to sunset: no new users, data is archived by retention class, and its debt items close at the end date.",fields:[{k:"d",label:"Shut down on",type:"date",req:true},{k:"why",label:"Reason",type:"text"}],defaults:{d:iso(30)},onSubmit:v=>{a.status="sunset";a.sunset=v.d;bump();audit("Citizen app sunset",a.n+" on "+v.d);toast("Sunset scheduled","good");closeDrawer();render()}});return}
 t=e.target.closest("[data-gate-go]");if(t){go(t.dataset.gateGo);return}
});
document.addEventListener("change",e=>{
 let t=e.target.closest("[data-gate-sel]");if(t){G.sel=t.value;const o=document.querySelector("[data-gate-out]");if(o)o.innerHTML=gateRows(G.sel);return}
 t=e.target.closest("[data-gate-sim]");if(t){G.sim[t.dataset.gateSim]=t.value;const o=document.querySelector("[data-gate-simout]");if(o)o.innerHTML=simHTML();audit("Policy simulated",JSON.stringify(G.sim));return}
});
document.addEventListener("input",e=>{const t=e.target.closest("[data-gate-qc]");if(t){G.qc[t.dataset.gateQc]=t.value;const o=document.querySelector("[data-gate-qcout]");if(o)o.innerHTML=reuseHTML(reuseReport(G.qc.name,G.qc.name,G.qc.needs,[]))}});
REG("plat_gate","Citizen apps","platform","M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z",gateScreen);
PROC.reg("plat_gate",{title:"How a citizen app goes from idea to certified",std:["togaf","iso27k"],steps:[
 {n:"Describe and reuse check",d:"The builder (or their coding tool) states the purpose; the reuse-first check offers existing entities and processes.",who:"auto",owner:"Platform",out:"Reuse report"},
 {n:"Draft the manifest",d:"The Registry Agent drafts the manifest with labels and a support owner; the builder edits it.",who:"agent",owner:"Registry Agent",out:"Manifest"},
 {n:"Build in the sandbox",d:"Read access to real entities, no writes. The builder works with a coding tool.",who:"human",owner:"Builder",out:"Working app"},
 {n:"Conformance gate",d:"12 checks and the debt budget decide promotion. Failures can request an exception with an expiry.",who:"gate",owner:"Platform team",sla:"1 day",out:"Pass or blocked"},
 {n:"Certify and review",d:"The data council approves tier changes; reviews recur by tier and sunset dates keep the portfolio clean.",who:"human",owner:"Data council",sla:"5 days",out:"Certified app"}]});
SEARCHX.push(()=>{const o=[{g:"Platform",t:"Citizen apps",m:"Manifests, gate, tiers, policies",c:"--p4",f:()=>go("plat_gate"),k:"citizen apps gate conformance tiers policies core services"},{g:"Platform",t:"AI and coding clients (MCP server)",m:"Tools, console, clients",c:"--p4",f:()=>go("plat_mcp"),k:"mcp model context protocol ai coding clients cursor claude perplexity"}];
 apps().forEach(a=>o.push({g:"Citizen apps",t:a.n,m:cap(a.tier)+" · "+a.status,c:"--p4",f:()=>{go("plat_gate");setTimeout(()=>appDrawer(a.id),150)},k:a.purpose+" "+a.builder}));return o});
ASKX.push(q=>{const t=q.toLowerCase();let m;
 if(m=t.match(/can i (?:build|make|create)(?: a| an| the)? (.+?)\??$/)){const nm=m[1].replace(/[?.]/g,"").trim();const rep=reuseReport(nm,nm,nm,[]);G.qc.name=nm[0].toUpperCase()+nm.slice(1);G.qc.needs=nm;S.v.gate=2;go("plat_gate");say(q,{t:rep.dup?"Not as a new build. "+rep.items.filter(i=>i.lvl==="bad"||i.lvl==="warn").slice(0,2).map(i=>i.t+". "+i.d).join(" "):"Yes. Nothing in the registry duplicates it. Start a sandbox and the gate will check the rest.",steps:["Ran the reuse-first check against the registry and processes","Opened the new app tab"]});return true}
 if(/(open|show|list).*(citizen app|citizen dev)|citizen apps/.test(t)){go("plat_gate");say(q,{t:apps().length+" citizen apps are registered; "+apps().filter(a=>a.status==="certified").length+" are certified. "+METRICS.m_gate_dup.cur+"% of live apps ask for a duplicate.",steps:["Opened Citizen apps"]});return true}
 if(/\bmcp\b|coding (tool|client)|ai client/.test(t)){go("plat_mcp");say(q,{t:"The platform MCP server proposes "+8+" tools so coding tools can find what to reuse.",steps:["Opened AI and coding clients"]});return true}
 return false});

/* ====================================================================================================================
   plat_mcp: the platform MCP server
   ==================================================================================================================== */
const TOOLS=[
 {n:"search_registry",d:"Find entities, fields, planned entities and processes by words.",write:false,ex:{query:"invoice",kind:"any",limit:5},
  in:{type:"object",required:["query"],properties:{query:{type:"string",description:"Words to look for"},kind:{type:"string",enum:["any","entity","field","planned","process"],default:"any"},limit:{type:"integer",default:8,maximum:25}}},
  out:{type:"object",properties:{total:{type:"integer"},results:{type:"array",items:{type:"object",properties:{kind:{type:"string"},id:{type:"string"},label:{type:"string"},owner:{type:"string"},score:{type:"number"}}}}}}},
 {n:"get_entity",d:"Return one entity: owner, steward, fields with class and authority, readers, writers and status.",write:false,ex:{id:"invoice"},
  in:{type:"object",required:["id"],properties:{id:{type:"string",description:"Entity id from search_registry"},include_fields:{type:"boolean",default:true}}},
  out:{type:"object",properties:{id:{type:"string"},label:{type:"string"},owner:{type:"string"},steward:{type:"string"},classification:{type:"string"},status:{type:"string",enum:["canonical","duplicate","fixed"]},readers:{type:"array",items:{type:"string"}},writers:{type:"array",items:{type:"string"}},fields:{type:"array",items:{type:"object"}}}}},
 {n:"check_reuse",d:"Before building: what already exists that could be reused, and which process to call instead.",write:false,ex:{name:"Budget tracker",purpose:"track budget against actual spend",fields:"budget, amount, owner"},
  in:{type:"object",required:["name"],properties:{name:{type:"string"},purpose:{type:"string"},fields:{type:"string",description:"Comma separated field names"}}},
  out:{type:"object",properties:{verdict:{type:"string",enum:["reuse","extend","new_allowed"]},entities:{type:"array",items:{type:"object"}},processes:{type:"array",items:{type:"object"}},guidance:{type:"string"}}}},
 {n:"get_policy",d:"Evaluate whether a role may do an action on an entity, and which rule decided.",write:false,ex:{role:"citizen_team",action:"write",entity:"invoice"},
  in:{type:"object",required:["role","action","entity"],properties:{role:{type:"string",enum:ROLES.map(r=>r.id)},action:{type:"string",enum:ACTIONS.map(a=>a[0])},entity:{type:"string"}}},
  out:{type:"object",properties:{decision:{type:"string",enum:["allow","deny"]},deciding_policy:{type:"string"},reason:{type:"string"},masked_fields:{type:"array",items:{type:"string"}}}}},
 {n:"validate_manifest",d:"Lint a manifest (or a registered app) against the 12 gate checks without promoting it.",write:false,ex:{app_id:"ca_budget"},
  in:{type:"object",properties:{app_id:{type:"string",description:"A registered citizen app"},manifest:{type:"object",description:"Or a manifest document"}},anyOf:[{required:["app_id"]},{required:["manifest"]}]},
  out:{type:"object",properties:{score:{type:"integer"},passed:{type:"integer"},failed:{type:"integer"},promotable:{type:"boolean"},checks:{type:"array",items:{type:"object"}}}}},
 {n:"request_exception",d:"Ask for a time-limited exception to a failing check. Creates a debt item; a human approves.",write:true,ex:{app_id:"ca_budget",check_id:"nodup",reason:"Audit committee needs the old workbook",expires:"2026-12-15"},
  in:{type:"object",required:["app_id","check_id","reason","expires"],properties:{app_id:{type:"string"},check_id:{type:"string",enum:CHECKS.map(c=>c.id)},reason:{type:"string"},expires:{type:"string",format:"date"}}},
  out:{type:"object",properties:{debt_id:{type:"string"},status:{type:"string",enum:["pending_approval"]},max_days:{type:"integer"}}}},
 {n:"list_connectors",d:"Approved and project-only connectors, health and owner.",write:false,ex:{approved_only:true},
  in:{type:"object",properties:{approved_only:{type:"boolean",default:false}}},
  out:{type:"object",properties:{connectors:{type:"array",items:{type:"object",properties:{id:{type:"string"},name:{type:"string"},status:{type:"string"},approved:{type:"boolean"},owner:{type:"string"},last_sync:{type:"string"}}}}}}},
 {n:"run_conformance",d:"Run the gate for an app and return every check with evidence and fix hints.",write:false,ex:{app_id:"ca_budget"},
  in:{type:"object",required:["app_id"],properties:{app_id:{type:"string"}}},
  out:{type:"object",properties:{app_id:{type:"string"},decision:{type:"string"},checks:{type:"array",items:{type:"object",properties:{id:{type:"string"},result:{type:"string",enum:["pass","warn","fail"]},evidence:{type:"string"},fix:{type:"string"}}}}}}}
];
const IMPL={
 search_registry(a){const q=String(a.query||"").toLowerCase(),ws=q.split(/[^a-z0-9]+/).filter(w=>w.length>1),lim=Math.min(25,+a.limit||8),kind=a.kind||"any",res=[];
  const sc=txt=>{txt=txt.toLowerCase();let n=0;ws.forEach(w=>{if(txt.indexOf(w)>=0)n++});return ws.length?n/ws.length:0};
  if(kind==="any"||kind==="entity")PLAT.entities().forEach(e=>{const s=sc(e.id+" "+e.label);if(s>0)res.push({kind:"entity",id:e.id,label:e.label,owner:e.owner,score:r2(s+.01)})});
  if(kind==="any"||kind==="field")PLAT.fieldsAll().forEach(f=>{const s=sc(f.k+" "+f.label);if(s>0&&s===1)res.push({kind:"field",id:f.ent+"."+f.k,label:f.entLabel+": "+f.label,owner:f.owner,score:r2(s*.8)})});
  if(kind==="any"||kind==="planned")PLAT.PLANNED.forEach(p=>{const s=sc(p[0]+" "+p[2]);if(s>0)res.push({kind:"planned",id:p[0],label:p[2],owner:p[3],score:r2(s*.9)})});
  if(kind==="any"||kind==="process")Object.keys(PROC.defs).forEach(k=>{const s=sc(PROC.defs[k].title||"");if(s>0)res.push({kind:"process",id:k,label:PROC.defs[k].title,owner:"Process owner",score:r2(s*.7)})});
  res.sort((x,y)=>y.score-x.score);return{total:res.length,results:res.slice(0,lim)}},
 get_entity(a){const e=PLAT.ent(a.id);if(!e)throw new Error("Unknown entity: "+a.id+". Use search_registry to find an id.");
  return{id:e.id,label:e.label,owner:e.owner,steward:e.steward,domain:e.domain,classification:e.cls,retention:e.ret,status:e.status,readers:e.readers,writers:e.writers,field_count:e.nf,fields:a.include_fields===false?undefined:e.fields.slice(0,12).map(f=>{const m=PLAT.fieldMeta(e.id,f);return{k:f.k,type:f.type||"string",class:m.cls,authority:m.auth,freshness:m.fresh}})}},
 check_reuse(a){if(!a.name)throw new Error("name is required");const rep=reuseReport(a.name,a.purpose||"",a.name,[]);let hits=PLAT.reuseCheck(a.name,"");if(!hits.length)hits=PLAT.reuseCheck(a.name,(a.fields||"")+" "+(a.purpose||""));const procs=procMatches(a.name+" "+(a.purpose||""));
  const verdict=hits.some(h=>h.sc>=.6)||procs.length?"reuse":hits.length?"extend":"new_allowed";
  return{verdict,entities:hits.map(h=>({id:h.id,label:h.label,kind:h.kind,match:r2(h.sc)})),processes:procs.map(p=>({id:p.id,title:p.title})),guidance:rep.items.filter(i=>i.lvl!=="good").map(i=>i.t+". "+i.d).join(" ")||"No close match. Propose the entity and cite this check."}},
 get_policy(a){const ent=PLAT.ent(a.entity);if(!ent)throw new Error("Unknown entity: "+a.entity);if(!ROLES.some(r=>r.id===a.role))throw new Error("Unknown role: "+a.role);const r=simulate({role:a.role,action:a.action,ent:a.entity,app:G.sim.app,route:"gateway",conn:"m365"});
  return{decision:r.allow?"allow":"deny",deciding_policy:r.by.id,reason:r.why+" "+r.by.plain,masked_fields:r.masked.map(m=>m.f.k)}},
 validate_manifest(a){let ap=a.app_id?app(a.app_id):null;if(!ap&&a.manifest){const m=a.manifest,d=m.data||{};ap={id:"adhoc",n:(m.app||{}).name||"Ad hoc manifest",tier:(m.app||{}).tier||"personal",status:"sandbox",builder:(m.app||{}).builder||"",owner:(m.app||{}).support_owner||"",reads:d.reads||[],writes:d.writes||[],newEnts:(d.new_entities||[]).map(n=>({id:n.id,why:n.reason,dupOf:n.duplicate_of})),ai:(m.ai||[]).map(x=>({model:x.model,gw:x.route==="ai_gateway",cap:x.monthly_cap_usd||0})),sunset:(m.app||{}).review_or_sunset||"",classes:m.data_classes||[],m:Object.assign({},MOK,{ownAuth:(m.services||{}).auth==="custom",ownNotify:(m.services||{}).notifications==="custom",ownReport:(m.services||{}).reporting==="custom",audit:(m.services||{}).audit!==false,labels:(m.data_classes||[]).length?true:false})};G.apps.push(ap);try{var c=conformance("adhoc")}finally{G.apps.pop()}return{score:c.score,passed:c.pass,failed:c.fail,promotable:c.fail===0,checks:c.rows.map(x=>({id:x.id,result:x.r,evidence:x.ev}))}}
  if(!ap)throw new Error("Provide app_id or manifest. Known apps: "+apps().map(x=>x.id).join(", "));const d=decide(ap.id);return{score:d.c.score,passed:d.c.pass,failed:d.c.fail,promotable:d.pass,checks:d.c.rows.map(x=>({id:x.id,result:x.r,evidence:x.ev}))}},
 request_exception(a){const ap=app(a.app_id),ck=CHECKS.find(c=>c.id===a.check_id);if(!ap)throw new Error("Unknown app: "+a.app_id);if(!ck)throw new Error("Unknown check: "+a.check_id);if(!/^\d{4}-\d{2}-\d{2}$/.test(a.expires||""))throw new Error("expires must be YYYY-MM-DD");
  const lim=window.DEBT?DEBT.ceilings()[ap.tier].exc:90,d=days(TODAY,a.expires);if(d<=0)throw new Error("expires must be in the future");
  const id=window.DEBT?DEBT.add({type:"ooc",title:ap.n+": exception requested for “"+ck.n+"” (via MCP)",sev:"Medium",source:"exception",apps:[ap.id],owner:ap.n,owner2:ap.builder,steward:"Data council chair",principal:12,exp:a.expires,reason:String(a.reason||""),status:"open",fix:"Pending approval by the data council"}):"DB-X";
  bump();return{debt_id:id,status:"pending_approval",max_days:lim,note:d>lim?"Requested "+d+" days exceeds the "+ap.tier+" limit of "+lim+" days; the data council must approve.":"Within the tier limit. A human approves before the check is waived."}},
 list_connectors(a){const c=conns().filter(x=>!a.approved_only||x.approved);return{connectors:c.map(x=>({id:x.id,name:x.name,status:x.status,approved:x.approved,owner:x.owner,last_sync:x.last}))}},
 run_conformance(a){const ap=app(a.app_id);if(!ap)throw new Error("Unknown app: "+a.app_id+". Known: "+apps().map(x=>x.id).join(", "));const d=decide(ap.id);return{app_id:ap.id,decision:d.pass?"pass: "+d.label:"blocked: "+d.label,checks:d.c.rows.map(x=>({id:x.id,result:x.r,evidence:x.ev,fix:x.fix}))}}
};
function r2(n){return Math.round(n*100)/100}
const MCPX=window.MCPX={tools:TOOLS,call(name,args){const f=IMPL[name];if(!f)throw new Error("Unknown tool: "+name);return f(args||{})}};
/* ---------- clients ---------- */
const CLIENTS=[
 {id:"claude",n:"Claude (chat and Cowork)",kind:"Frontier model client",st:"connected",users:38,calls:[210,260,310,340,390,420,455],scopes:["read","check","validate"],top:"check_reuse",auth:"OAuth 2.1 with the user's own identity",note:"Answers “can I build this?” with live registry results."},
 {id:"claudecode",n:"Claude Code",kind:"Coding agent in terminal and IDE",st:"connected",users:21,calls:[120,150,190,240,310,360,410],scopes:["read","check","validate","exception"],top:"validate_manifest",auth:"Device sign-in; token per developer, 8 hours",note:"Reads PLATFORM.md first, then calls the tools while it writes code."},
 {id:"copilot",n:"GitHub Copilot in VS Code",kind:"IDE assistant",st:"pilot",users:9,calls:[10,22,36,60,84,96,120],scopes:["read","check"],top:"search_registry",auth:"Device sign-in; read-only",note:"Pilot with the citizen developer cohort."},
 {id:"cursor",n:"Cursor",kind:"IDE assistant",st:"pilot",users:6,calls:[4,12,18,30,41,52,66],scopes:["read","check","validate"],top:"get_entity",auth:"Device sign-in; token per developer",note:"Uses the contract file as project rules."},
 {id:"perplexity",n:"Perplexity",kind:"Research assistant",st:"roadmap",users:0,calls:[0,0,0,0,0,0,0],scopes:[],top:"None yet",auth:"Not planned before Q1 2027; read-only scopes only",note:"Would answer “what exists” questions for non-builders. Not connected."}];
const SCOPES={read:"Read the registry (search_registry, get_entity, list_connectors, get_policy)",check:"Run reuse checks (check_reuse)",validate:"Lint manifests (validate_manifest, run_conformance)",exception:"Request an exception (request_exception), always needs a human approval"};
const cl=c=>{const o=G.clients[c.id];return o?Object.assign({},c,{scopes:o.scopes}):c};
function contractMd(){
 const s=PLAT.stats();const du=window.DEBT?DEBT.totals():{n:0,principal:0};
 return `# PLATFORM.md  (read this first)\nOukala platform contract v0.3 (draft), Meridian Standards Foundation\n\n## The rule\nDo not create data, processes or services that the platform already has.\nCall the MCP server before you design anything.\n\n## Order of work\n1. search_registry: what exists? (${s.n} entities, ${s.nf.toLocaleString()} fields)\n2. check_reuse: reuse an entity or call an existing process\n3. get_entity: read owner, steward, class and authority\n4. Write oukala.app.json (manifest)\n5. validate_manifest and run_conformance until nothing fails\n6. request_exception only with a human owner and an expiry\n\n## You must\n- use platform sign-in and access rules (RBAC and ABAC); no user tables\n- send messages with notify, reports with reports, audit with audit\n- route every model call through the AI gateway with a monthly cap\n- label every stored field with a classification\n- keep secrets in the secret store\n\n## You must not\n- create an entity that matches a registered or planned one (${s.planned} planned entities are listed)\n- write a canonical entity directly; call the owner's API\n- use unapproved connectors\n\n## Debt budget\nOpen platform debt today: ${du.n} items, ${du.principal} hours. Your app's budget by tier: personal 8 h, team 24 h, enterprise 40 h.\n\n## Tiers\npersonal (1 builder), team (up to 50 users), enterprise (everyone)\n`;
}
function contractJson(){const s=PLAT.stats();return JSON.stringify({contract:"oukala.platform",version:"0.3.0-draft",server:{name:"oukala-platform",transport:["streamable-http"],url:"https://oukala.meridian.example/mcp",auth:"oauth2.1"},registry:{entities:s.n,fields:s.nf,planned:s.planned,open_duplicates:s.dups},first_call:"check_reuse",tools:TOOLS.map(t=>({name:t.n,write:t.write})),rules:CHECKS.map(c=>({id:c.id,blocks_from_tier:c.t})),tiers:Object.keys(TIERDEF).map(k=>({id:k,debt_budget_hours:window.DEBT?DEBT.ceilings()[k].h:null})),core_services:SERVICES.map(x=>x.id)},null,2)}
/* ---------- MCP screen ---------- */
function totals7(){return[0,1,2,3,4,5,6].map(i=>CLIENTS.reduce((s,c)=>s+c.calls[i],0))}
function mcpScreen(){
 const t7=totals7(),sum=t7.reduce((a,b)=>a+b,0),cons=CLIENTS.filter(c=>c.st==="connected").length,pil=CLIENTS.filter(c=>c.st==="pilot").length;
 const hero_=hero("AI and coding clients · MCP server","Let AI tools discover what exists before they build",
  `The platform's MCP (Model Context Protocol) server lets frontier models and coding tools ask what the registry already has. <b data-role="metric">${TOOLS.length}</b> tools are proposed (a proposed first set, not final); <b data-role="metric">${cons}</b> clients are connected, ${pil} are in pilot, and Perplexity is on the roadmap. <b data-role="metric">${sum.toLocaleString()}</b> calls came in over the last 7 days, and every call runs with the caller's own access.`,
  `<div class="row">${fchip("m_mcp_cov")}${fchip("m_gate_reuse")}<button class="btn primary" data-mcp-tab="1">Try a tool</button></div>`);
 const kp=kpiRow([["Proposed tools",TOOLS.length,"1 can write, with approval"],["Clients",cons+pil,cons+" connected, "+pil+" pilot, 1 roadmap"],["Calls in 7 days",sum.toLocaleString(),"all audited"],["Reuse check first",METRICS.m_mcp_cov.cur+"%","of new builds",{metric:"m_mcp_cov"}],["Writes needing approval",1,"request_exception only"]]);
 const ch=lineChart(["Sep 30","Oct 1","Oct 2","Oct 3","Oct 4","Oct 5","Oct 6"],[{vals:t7,color:col("--accent"),area:true}],{w:620,h:220,max:Math.ceil(Math.max(...t7)/200)*200,alt:"MCP calls per day over the last 7 days"});
 const byTool=[["check_reuse",.34],["search_registry",.27],["get_entity",.16],["validate_manifest",.1],["run_conformance",.06],["get_policy",.04],["list_connectors",.02],["request_exception",.01]].map(r=>[r[0],Math.round(r[1]*sum)]);
 const pane0=`${kp}<div class="grid g2" style="gap:16px">${card("Calls per day","All clients together",ch,aiChip({model:"MCP server",title:"Call volume",note:"Counts come from the server log. Each call is tied to a person and a client.",src:["MCP server log","Identity provider"],guards:["Runs with the caller's access","Rate limited per user","Every call audited"]}))}${card("Calls by tool, last 7 days","check_reuse should lead: it is the first call a builder makes",bars(byTool,v=>v.toLocaleString()))}</div>
  <div class="grid g2" style="gap:16px;margin-top:14px">${card("Guardrails","What the server will not do",`<ul class="small" style="margin:0;padding-left:18px;display:grid;gap:6px"><li>Every tool runs as the signed-in person, so masking and access rules apply.</li><li>Only <code>request_exception</code> writes, and it only creates a pending debt item.</li><li>Tool descriptions and results are data to the client, never instructions to the server.</li><li>Rate limit: 60 calls a minute per user; larger scans use the typed API.</li></ul>`)}${card("Why a coding tool needs this","The failure it prevents",`<div class="story small" data-role="story">A builder asks a coding tool for “a budget tracker”. Without the server the tool invents a budget table. With it, <b>check_reuse</b> returns <code>budget_line</code> (planned) and the invoice and project budget fields, so the tool builds on them. That one call is the cheapest debt control the platform has.</div>`)}</div>`;
 const tl=TOOLS.map(t=>`<section class="card glass mcp-tool"><div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><h3 style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:15px">${E(t.n)}</h3><div class="row" style="gap:6px">${pill_("Proposed","warn")}${pill_(t.write?"Writes":"Read only",t.write?"bad":"good")}</div></div><p class="small" style="margin:6px 0">${E(t.d)}</p><details class="small"><summary>Input schema</summary><pre class="gate-code" tabindex="0">${E(JSON.stringify(t.in,null,2))}</pre></details><details class="small"><summary>Output schema</summary><pre class="gate-code" tabindex="0">${E(JSON.stringify(t.out,null,2))}</pre></details><div class="row" style="margin-top:8px"><button class="btn quiet" data-mcp-try="${t.n}">Try it</button></div></section>`).join("");
 const pane1=`<div class="dnote" data-role="story" style="margin-bottom:12px"><b>Proposed set.</b> These ${TOOLS.length} are the first tools to expose; the list is not final. Each has a typed input and output so a model can call it without guessing. ${typeof stdChip==="function"&&window.STD&&STD.devops?stdChip("devops","Tools put platform guardrails into the developer workflow."):""}</div><div class="grid g2 mcp-tools" style="gap:14px;align-items:start">${tl}</div>`;
 const pane2=consoleTab();
 const cc=CLIENTS.map(cl).map(c=>{const sum=c.calls.reduce((a,b)=>a+b,0);return `<section class="card glass mcp-client"><div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><div><h3 style="margin:0">${E(c.n)}</h3><div class="small muted">${E(c.kind)}</div></div>${pill_(c.st==="connected"?"Connected":c.st==="pilot"?"Pilot":"Roadmap",c.st==="connected"?"good":c.st==="pilot"?"warn":"mute")}</div><p class="small" style="margin:8px 0">${E(c.note)}</p><div class="mcp-spark">${c.calls.some(Boolean)?spark(c.calls,160,34,col("--accent")):'<span class="muted small">No calls yet</span>'}<div class="small"><b>${sum.toLocaleString()}</b> calls in 7 days<br><span class="muted">${c.users} users · most used ${E(c.top)}</span></div></div><div class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0">${c.scopes.length?c.scopes.map(s=>pill_(s,s==="exception"?"warn":"info")).join(""):pill_("No access","mute")}</div><p class="small muted" style="margin:0 0 8px">${E(c.auth)}</p><button class="btn quiet" data-mcp-perm="${c.id}" ${c.st==="roadmap"?"disabled":""}>Edit permissions</button></section>`}).join("");
 const pane3=`<p class="muted small">Who is connected and what each client may do. Permissions are scopes; the person's own access still applies on every call.</p>${legend([["Calls per day (last 7 days)","--accent"]])}<div class="grid g3 mcp-clients" style="gap:14px">${cc}</div>`;
 const md=contractMd(),js=contractJson();
 const pane4=`<div class="dnote" data-role="story" style="margin-bottom:12px">A coding agent reads <b>PLATFORM.md</b> first. It is generated from the live registry, so the counts and rules are never stale. <b>contract.json</b> is the machine readable twin that tools can validate against. ${aiChip({model:"Registry Agent",conf:.9,title:"Contract file",note:"Regenerated whenever the registry, policies or tool list changes. A person approves the version bump.",src:["Platform registry","Policies","Tool list","Debt ledger"],guards:["Draft until approved","Versioned","Signed when published"]})}</div><div class="grid g2" style="gap:16px;align-items:start">${card("PLATFORM.md","Version 0.3 (draft) · "+md.length+" characters",`<pre class="gate-code" tabindex="0">${E(md)}</pre><div class="row" style="margin-top:8px"><button class="btn quiet" data-mcp-copy="md">Copy</button></div>`)}${card("contract.json","Same facts, machine readable",`<pre class="gate-code" tabindex="0">${E(js)}</pre><div class="row" style="margin-top:8px"><button class="btn quiet" data-mcp-copy="json">Copy</button></div>`)}</div>`;
 const pane5=`<div class="grid g2" style="gap:16px;align-items:start">${card("The linter","The same 12 checks as the gate, on the builder's machine (proposed names)",`<pre class="gate-code" tabindex="0">${E("# in the repository\nnpx @oukala/lint --manifest oukala.app.json\n\n# pre-commit hook\noukala lint --staged\n\n# CI step (fails the build on a blocking check)\noukala gate --tier team --fail-on blocking")}</pre><p class="small muted">Output matches the Conformance gate tab, row for row, so there are no surprises at review.</p>`)}
  ${card("The SDK","Typed calls to the core services",`<pre class="gate-code" tabindex="0">${E("import { oukala } from '@oukala/sdk'\n\nconst rows = await oukala.db.entity('invoice')\n  .query({ where: { status: 'open' } })\nawait oukala.notify.send({ to: user, template: 'renewal_due' })\nawait oukala.audit.log({ action: 'renewal_sent' })")}</pre><p class="small muted">Every call carries the user's identity, so access rules and masking apply without extra code.</p>`)}</div>
  <div class="grid g3" style="gap:14px;margin-top:14px">${card("Versioning","Contract and tools","<p class='small'>Semantic versions. Removing a tool or field is a major version with a 90 day overlap. Clients see the version in every response.</p>")}${card("Typed API","For scans too large for MCP","<p class='small'>The same operations are available as a REST and GraphQL API with OpenAPI and schema files, for build servers and bulk jobs.</p>")}${card("Not in scope yet","Gaps","<p class='small'>Perplexity connection, write tools beyond exceptions, and a hosted copy of the contract for clients outside Meridian.</p>")}</div>`;
 return `<div class="screen">${hero_}${lensNote()}${views("mcp",["Overview","Tools","Try it","Clients","Contract file","SDK and linter"],[pane0,pane1,pane2,pane3,pane4,pane5])}${procCard("plat_mcp")}</div>`;
}
/* ---------- console ---------- */
function fieldHTML(tool,k,def){
 const p=tool.in.properties[k],v=def!==undefined?def:"",nm="data-mcp-arg=\""+k+"\"";
 const lab=k.replace(/_/g," ")+(tool.in.required&&tool.in.required.includes(k)?" (required)":"");
 if(k==="app_id"||(k==="entity"&&0))return `<label class="fld"><span class="flab">${E(lab)}</span><select class="fin" ${nm}>${apps().map(a=>`<option value="${E(a.id)}" ${a.id===v?"selected":""}>${E(a.n)}</option>`).join("")}</select></label>`;
 if(p.enum)return `<label class="fld"><span class="flab">${E(lab)}</span><select class="fin" ${nm}>${p.enum.map(o=>`<option ${String(o)===String(v)?"selected":""}>${E(o)}</option>`).join("")}</select></label>`;
 if(p.type==="boolean")return `<label class="fld"><span class="flab">${E(lab)}</span><select class="fin" ${nm}><option value="true" ${v===true?"selected":""}>true</option><option value="false" ${v===false?"selected":""}>false</option></select></label>`;
 if(p.type==="object")return `<label class="fld"><span class="flab">${E(lab)}</span><span class="small muted">Leave empty to use app_id.</span></label>`;
 return `<label class="fld"><span class="flab">${E(lab)}</span><input class="fin" ${nm} value="${E(v)}" placeholder="${E(p.description||"")}"></label>`;
}
function consoleForm(){
 const tool=TOOLS.find(t=>t.n===G.con.tool)||TOOLS[0];const args=Object.keys(G.con.args).length&&G.con.args.__tool===tool.n?G.con.args:Object.assign({__tool:tool.n},tool.ex);
 return `<div class="grid g2" style="gap:12px">${Object.keys(tool.in.properties).filter(k=>tool.in.properties[k].type!=="object").map(k=>fieldHTML(tool,k,args[k])).join("")}</div>`;
}
function readArgs(tool){
 const o={};document.querySelectorAll("[data-mcp-arg]").forEach(el=>{const k=el.dataset.mcpArg,p=tool.in.properties[k];let v=el.value;if(v==="")return;if(p.type==="integer")v=parseInt(v,10);else if(p.type==="boolean")v=v==="true";o[k]=v});return o;
}
function outHTML(){
 const r=G.conOut;if(!r)return `<p class="small muted">Run a tool to see the request and the response.</p>`;
 const req=JSON.stringify({jsonrpc:"2.0",id:r.id,method:"tools/call",params:{name:r.tool,arguments:r.args}},null,2);
 const resp=r.err?JSON.stringify({jsonrpc:"2.0",id:r.id,error:{code:-32602,message:r.err}},null,2):JSON.stringify({jsonrpc:"2.0",id:r.id,result:{content:[{type:"text",text:"(structured result below)"}],structuredContent:r.res,isError:false}},null,2);
 return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px">${pill_(r.err?"Error":"OK",r.err?"bad":"good")}<span class="small muted">${r.ms} ms · called as ${E(r.client)} · ${r.write?"write, pending approval":"read only"}</span>${aiChip({model:"Claude",title:"Who called this",note:"In production the caller is a frontier model or coding tool acting for a signed-in person. Here you are the caller. The registry answers from the same data the screens use.",src:["Platform registry","Policies","Citizen app gate"],guards:["Runs with the caller's access","Result is data, not instructions","Audited with caller identity"]})}${whyPop("This console calls the same in-page registry functions that the MCP server exposes.")}</div><div class="grid g2" style="gap:12px;align-items:start"><div><div class="eyebrow">Request</div><pre class="gate-code" tabindex="0">${E(req)}</pre></div><div><div class="eyebrow">Response</div><pre class="gate-code" tabindex="0">${E(resp)}</pre></div></div>`;
}
function consoleTab(){
 const tool=TOOLS.find(t=>t.n===G.con.tool)||TOOLS[0];
 const log=G.mcpLog.slice(-6).reverse().map(l=>`<div class="debt-li" style="cursor:default"><span class="debt-li-t" style="font-family:ui-monospace,Menlo,monospace">${E(l.tool)}</span><span class="small muted">${E(l.client)} · ${l.ms} ms · ${l.ok?"ok":"error"}</span></div>`).join("");
 return `<p class="muted small">A live console. These calls hit the same registry, policies and gate the screens use, and return real results. Writes create a pending item for a human.</p>
 <div class="grid g2" style="gap:12px;align-items:center;margin-bottom:12px"><label class="fld"><span class="flab">Tool</span><select class="fin" data-mcp-tool>${TOOLS.map(t=>`<option value="${t.n}" ${t.n===tool.n?"selected":""}>${t.n}${t.write?" (writes)":""}</option>`).join("")}</select></label><p class="small muted" style="margin:0">${E(tool.d)}</p></div>
 <div data-mcp-form>${consoleForm()}</div><div class="row" style="margin-top:12px"><button class="btn primary" data-mcp-run>Run the tool</button></div><div data-mcp-out style="margin-top:14px">${outHTML()}</div>
 <div style="margin-top:14px">${card("Recent calls from this console","Newest first",log||"<p class='small muted'>No calls yet.</p>")}</div>`;
}
document.addEventListener("click",e=>{
 let t=e.target.closest("[data-mcp-run]");if(t){const tool=TOOLS.find(x=>x.n===G.con.tool)||TOOLS[0];const args=readArgs(tool);G.con.args=Object.assign({__tool:tool.n},args);const id=G.mcpLog.length+1,t0=performance.now();let res=null,err=null;
  try{res=MCPX.call(tool.n,args)}catch(x){err=x.message}
  const ms=Math.max(1,Math.round(performance.now()-t0));G.conOut={id,tool:tool.n,args,res,err,ms,client:"Try-it console (you)",write:tool.write};G.mcpLog.push({tool:tool.n,client:"Try-it console (you)",ms,ok:!err});
  audit("MCP call",tool.n+" "+JSON.stringify(args).slice(0,100));const o=document.querySelector("[data-mcp-out]");if(o)o.innerHTML=outHTML();if(tool.write&&!err){toast("Exception requested: "+res.debt_id,"good")}else toast(err?"Tool returned an error":"Tool returned a result",err?"warn":"good");return}
 t=e.target.closest("[data-mcp-try]");if(t){G.con.tool=t.dataset.mcpTry;G.con.args={};G.conOut=null;S.v.mcp=2;render();return}
 t=e.target.closest("[data-mcp-tab]");if(t){S.v.mcp=+t.dataset.mcpTab;render();return}
 t=e.target.closest("[data-mcp-copy]");if(t){const txt=t.dataset.mcpCopy==="md"?contractMd():contractJson();try{navigator.clipboard.writeText(txt).then(()=>toast("Copied","good"),()=>toast("Copy blocked by the browser","warn"))}catch(x){toast("Copy blocked by the browser","warn")}return}
 t=e.target.closest("[data-mcp-perm]");if(t){const c=CLIENTS.find(x=>x.id===t.dataset.mcpPerm);openForm({id:"mcp_perm",title:"Permissions for "+c.n,submit:"Save permissions",story:"Scopes limit which tools this client may call. The person's own access still applies. Changes are audited and take effect on the next call.",fields:[{k:"scopes",label:"Scopes",type:"multi",opts:Object.keys(SCOPES).map(k=>[k,SCOPES[k]]),help:"The exception scope can only create a pending item; a human approves."}],defaults:{scopes:cl(c).scopes},
   onSubmit:v=>{G.clients[c.id]={scopes:v.scopes||[]};audit("MCP permissions changed",c.n+": "+(v.scopes||[]).join(", "));toast("Permissions saved","good");closeDrawer();render()}});return}
});
document.addEventListener("change",e=>{const t=e.target.closest("[data-mcp-tool]");if(t){G.con.tool=t.value;G.con.args={};G.conOut=null;const f=document.querySelector("[data-mcp-form]");if(f)f.innerHTML=consoleForm();const o=document.querySelector("[data-mcp-out]");if(o)o.innerHTML=outHTML()}});
REG("plat_mcp","AI and coding clients","ai","M5 8h14v9H5zM9 8V5h6v3M9 13h.01M15 13h.01M3 12v2M21 12v2",mcpScreen);
PROC.reg("plat_mcp",{title:"How an AI or coding client uses the platform",std:["togaf","nist"],steps:[
 {n:"Connect and sign in",d:"The client connects with the signed-in person's identity. Scopes limit the tools it can call.",who:"gate",owner:"Security lead",out:"Scoped token"},
 {n:"Read the contract",d:"The client reads PLATFORM.md and contract.json, generated from the live registry.",who:"auto",owner:"Platform",out:"Rules in context"},
 {n:"Check for reuse",d:"check_reuse and search_registry return entities, fields and processes to reuse.",who:"agent",owner:"Coding agent",out:"Reuse report"},
 {n:"Validate the manifest",d:"validate_manifest and run_conformance lint the app before a person reviews it.",who:"agent",owner:"Coding agent",out:"Conformance result"},
 {n:"Request an exception",d:"Only if reuse is impossible. A person approves; the exception gets an owner and an expiry.",who:"human",owner:"Data council",sla:"3 days",out:"Pending debt item"}]});
SEARCHX.push(()=>TOOLS.map(t=>({g:"MCP tools",t:t.n,m:t.write?"Writes":"Read only",c:"--p4",f:()=>{go("plat_mcp");G.con.tool=t.n;G.con.args={};S.v.mcp=2;setTimeout(render,50)},k:"mcp tool "+t.d})));
})();

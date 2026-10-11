(function(){
/* ===== Service experience module (round 8): catalog, fulfillment workflows, requests, portal, assets, notifications =====
   Removed from this file (now owned by other builders): svc_sla (mod_sla.js) and svc_oncall (mod_oncall.js). v4 code lives in git history.
   Shared contracts used: WFX.reg (workflow registry), REQREG (requests per service), TBMX (cost per offering, guarded), WORK (Person 360), SVCREG. */
const E=esc;
const NOW=Date.UTC(2026,9,6,11,0); /* Tue Oct 6 2026, 11:00 */
const HR=36e5,DAY=864e5;
const MD=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const pad=n=>String(n).padStart(2,"0");
const ms=iso=>{const m=/^(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+))?/.exec(iso);return Date.UTC(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0))};
const fdt=t=>{const d=new Date(t);return DN[d.getUTCDay()]+" "+MD[d.getUTCMonth()]+" "+d.getUTCDate()+", "+pad(d.getUTCHours())+":"+pad(d.getUTCMinutes())};
const fd=t=>{const d=new Date(typeof t==="string"?ms(t):t);return MD[d.getUTCMonth()]+" "+d.getUTCDate()};
const fdy=t=>{const d=new Date(typeof t==="string"?ms(t):t);return MD[d.getUTCMonth()]+" "+d.getUTCDate()+", "+d.getUTCFullYear()};
const iso=t=>new Date(t).toISOString().slice(0,10);
const hh=h=>h<1?Math.round(h*60)+" min":h<48?(Math.round(h*10)/10)+" h":(Math.round(h/24*10)/10)+" d";
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const sum=(a,f)=>a.reduce((s,x)=>s+(f?f(x):x),0);
const uniq=a=>[...new Set(a)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pc=(n,d)=>d?Math.round(n/d*1000)/10:0;
const N=n=>Number(n).toLocaleString("en-US");
const wh=(n,o)=>pchip(n,o);
const av=(n,s)=>avatar(n,{size:s||28});
const who$=n=>n?wh(n):`<span class="pill bad">Unassigned</span>`;
const isAI=n=>{const r=who(n);return r&&r.kind==="ai"};
const kindOf=n=>{const r=who(n);return r?r.kind:"human"};

/* ---- state ---- */
S.svc=S.svc||{};
const V=Object.assign({cat:null,catTab:0,flow:"wf_laptop",flowView:"gantt",flowReq:false,reqSel:null,pItem:null,pView:"customer",pCat:"All",pQ:"",pForm:{},pSec:0,pFor:"Priya Shah",pOther:false,reqQ:"",board:"all",tplSel:"T1",logF:"All",assetTab:0,dsg:null,capSel:null,amode:"admin",revLook:null},S.svc);
S.svc=V;
const ME="Priya Shah";

/* ---- metrics ---- */
const M0=(id,o)=>{if(!METRICS[id])METRICS[id]=o};
Object.assign(METRICS,{
 m_svc_ftime:{n:"Fulfillment time",f:"Median of (request closed time − request submitted time), in business days, for requests delivered in the last 30 days, excluding time paused for approvals and requester waits",u:" d",cur:4.6,tgt:5,badAt:8,dir:"min",max:12,tr:[5.4,5.2,5.1,5,4.9,4.8,4.7,4.6],owner:"Service desk",use:["Service catalog","Requests and fulfillment"],rem:{kind:"agent",ref:"SOP-218",title:"Chase the slowest step on each open request",agent:"Triage Agent",auto:false,state:"idle",prog:"Finds the step that is furthest over its operational target and nudges its team"}},
 m_svc_fta:{n:"First-time approval rate",f:"Requests approved with no rework (no more information requested, no resubmission) ÷ requests that reached a final approval decision × 100",u:"%",cur:86,tgt:90,badAt:75,dir:"max",max:100,tr:[82,83,84,85,84,85,86,86],owner:"Service owners",use:["Service catalog","Requests and fulfillment"],rem:{kind:"kb",ref:"KB0122",title:"Add guidance and examples to the forms that bounce most",agent:"Knowledge Curator",auto:false,state:"idle",prog:"Finds the questions that approvers most often send back and drafts help text"}},
 m_svc_cpr:{n:"Cost per request",f:"Σ process cost of every executed fulfillment step (labor, system and vendor handling, excluding the price of the thing ordered) ÷ requests delivered, last 30 days",u:"$",cur:101,tgt:95,badAt:140,dir:"min",max:200,tr:[74,72,70,68,66,64,62,61],owner:"Service desk",use:["Service catalog","Requests and fulfillment"],rem:{kind:"agent",ref:"SOP-305",title:"Automate the costliest manual step",agent:"PMO Agent",auto:false,state:"idle",prog:"Ranks steps by cost × volume × rework and drafts an automation proposal"}},
 m_svc_xla:{n:"Request experience (XLA)",f:"Average of the 1 to 5 rating requesters give after delivery ('How easy was it to get what you needed?') over the last 30 days; goal is an experience level of 4.3 or higher",u:" / 5",cur:4.31,tgt:4.3,badAt:3.8,dir:"max",max:5,tr:[4.1,4.15,4.2,4.2,4.25,4.28,4.3,4.31],owner:"Service desk",use:["Service catalog","Self-service portal"],rem:{kind:"sop",ref:"SOP-410",title:"Call back anyone who rated 2 or lower",agent:"First Officer",auto:false,state:"idle",prog:"Drafts the follow-up message and books a call for the service owner"}},
 m_licrisk:{n:"Licence true-up exposure",f:"Σ over titles of max(0, assigned − entitled) × list price per licence ÷ annual software spend × 100",u:"%",cur:3.4,tgt:1,badAt:5,dir:"min",max:10,tr:[1.2,1.4,1.9,2.2,2.8,3,3.3,3.4],owner:"IT asset management",use:["Assets and software licences"],rem:{kind:"agent",ref:"SOP-340",title:"Reclaim licences unused for 90 days",agent:"Invoice Advisor",auto:false,state:"idle",prog:"Lists inactive assignments, notifies users, then removes the licence"}},
 m_astacc:{n:"Asset record accuracy",f:"Devices whose inventory record matches Intune and the last physical check ÷ devices in inventory × 100",u:"%",cur:97.2,tgt:98,badAt:93,dir:"max",max:100,tr:[95.1,95.6,96,96.4,96.6,96.9,97,97.2],owner:"IT asset management",use:["Assets and software licences"],rem:{kind:"agent",ref:"SOP-352",title:"Reconcile devices that Intune reports and inventory does not",agent:"Test Agent",auto:false,state:"idle",prog:"Compares Intune serial numbers with inventory and opens a task per mismatch"}},
 m_notifdel:{n:"Notification delivery rate",f:"Notifications delivered ÷ (delivered + failed), excluding ones suppressed by dedupe, throttling or quiet hours, last 24 hours × 100",u:"%",cur:96.4,tgt:98,badAt:93,dir:"max",max:100,tr:[98.1,97.9,97.5,97.2,96.9,96.8,96.6,96.4],owner:"Platform team",use:["Notification engine"],rem:{kind:"sop",ref:"SOP-405",title:"Fall back to a second channel when one fails",agent:"Triage Agent",auto:false,state:"idle",prog:"Retries transient failures and switches permanent failures to Teams"}}
});
M0("m_fulfil",{n:"Fulfillment on time",f:"Requested items delivered on or before the SLA due date ÷ requested items delivered, last 30 days × 100",u:"%",cur:88,tgt:90,badAt:80,dir:"max",max:100,tr:[91,90,89,90,88,87,88,88],owner:"Service desk",use:["Requests and fulfillment"],rem:{kind:"sop",ref:"SOP-218",title:"Chase stalled approvals and tasks",agent:"Triage Agent",auto:false,state:"idle",prog:"Nudges approvers after 1 business day and reassigns idle tasks"}});
M0("m_slaatt",{n:"SLA attainment",f:"Σ tickets and requests closed inside their SLA target ÷ Σ tickets and requests closed, over the last 30 days, weighted by volume",u:"%",cur:94,tgt:95,badAt:90,dir:"max",max:100,tr:[96.1,95.4,95.8,94.9,95.2,94.6,94.3,94],owner:"Service desk",use:["Requests and fulfillment"],rem:{kind:"agent",ref:"SOP-212",title:"Rebalance queues before a breach",agent:"Triage Agent",auto:false,state:"idle",prog:"Reassigns at-risk work and pings owners at 75% elapsed"}});

/* ---- data model fields (SLA/XLA definitions, workflow parameters and the visualization builder read these) ---- */
(function(){const F=(k,label,type,o)=>Object.assign({k,label,type:type||"string"},o||{});
 DATAMODEL.register("catalog_item",{label:"Catalog item",source:"Service catalog",fields:[F("number","Item id"),F("name","Name"),F("service","Service","ref"),F("offering","Service offering","ref"),F("category","Category","enum"),F("price","Price (showback)","money"),F("approvals_required","Approvals required","number"),F("fulfillment_flow","Fulfillment workflow","ref"),F("sla_hours","SLA target (hours)","number"),F("visible_to","Visible to","enum",{opts:["Everyone","Employees","Managers","Contractors"]})]});
 DATAMODEL.register("request_item",{label:"Request item",source:"Service catalog",fields:[F("service_offering","Service offering","ref"),F("requested_for","Requested for","ref"),F("opened_by","Requested by","ref"),F("lifecycle_state","Lifecycle state","enum",{opts:["pending","approved","fulfilling","deployed","decommissioned","rejected"]}),F("worker_type","Worker type","enum",{opts:["Employee","Contractor"]}),F("region","Region","enum",{opts:["US","EU"]}),F("role_level","Role level","enum",{opts:["Staff","Senior","Manager","Executive"]}),F("security_tier","Security tier","enum",{opts:["Standard","Elevated","Privileged"]}),F("process_cost","Process cost","money"),F("cycle_hours","Cycle time (hours)","number"),F("xla_rating","Experience rating","number")]});
 DATAMODEL.register("fulfillment_step",{label:"Fulfillment step",source:"Service catalog",fields:[F("step","Step"),F("type","Type","enum",{opts:["human","agent","auto","gate","wait","sub"]}),F("assignment_group","Assignment group","ref"),F("assigned_to","Assigned to","ref"),F("target_hours","Operational target (hours)","number"),F("elapsed_hours","Elapsed (hours)","number"),F("step_cost","Step cost","money"),F("rework","Rework","boolean")]});
 DATAMODEL.register("asset",{label:"Hardware asset",source:"Assets",fields:[F("asset_tag","Asset tag"),F("model","Model"),F("class","Class","enum",{opts:["Laptop","Phone","Monitor","Dock","Network","AV"]}),F("lifecycle","Lifecycle state","enum",{opts:["Ordered","Received","In stock","Deployed","In repair","Retired","Decommissioned"]}),F("assigned_to","Assigned to","ref"),F("purchase_cost","Purchase cost","money"),F("warranty_end","Warranty ends","date"),F("intune_compliant","Intune compliant","boolean"),F("request","Source request","ref")]});
})();

/* ---- people groups: ITIL says assign to a team first. Individuals are claimed or assigned with a reason ---- */
const GRPS={
 "Service desk":{lead:"Tom Becker",members:["Tom Becker","Northwind Managed Services","Nia Brooks","Triage Agent"],d:"Tier 1 desk, receiving and hand-over"},
 "Endpoint team":{lead:"Sam Patel",members:["Sam Patel","Northwind Managed Services","Ravi Menon","Test Agent"],d:"Intune, Autopilot, imaging and delivery"},
 "Identity team":{lead:"Rina Okafor",members:["Rina Okafor","Jordan Lee","Triage Agent"],d:"Entra ID accounts, groups, access reviews"},
 "Security":{lead:"Rina Okafor",members:["Rina Okafor","Change Risk Agent"],d:"Baselines, Defender, third-party risk"},
 "Procurement":{lead:"Avery Chen",members:["Avery Chen","Invoice Advisor"],d:"Purchase orders, vendors, receiving paperwork"},
 "Finance":{lead:"Avery Chen",members:["Avery Chen","Invoice Advisor"],d:"Budget checks, vendor master, cost centers"},
 "Facilities":{lead:"Nia Brooks",members:["Nia Brooks","Elise Park"],d:"Badges, desks, rooms and AV"},
 "People team":{lead:"Nia Brooks",members:["Nia Brooks","First Officer"],d:"HR records, orientation, training"},
 "Data team":{lead:"Dev Rao",members:["Dev Rao","Hana Koval"],d:"Reports and data products"},
 "PMO":{lead:"Maya Ortiz",members:["Maya Ortiz","Priya Shah","PMO Agent"],d:"Intake, portfolio and project setup"},
 "Architecture":{lead:"Jordan Lee",members:["Jordan Lee"],d:"Design review and service models"},
 "Platform team":{lead:"Priya Shah",members:["Priya Shah","Sam Patel","Elise Park"],d:"Platform and release engineering"},
 "AI governance":{lead:"Jordan Lee",members:["Jordan Lee","Contract Analyst Agent","Knowledge Curator"],d:"Agent registry, token budgets and guardrails"},
 "Integration team":{lead:"Jordan Lee",members:["Jordan Lee","Sam Patel"],d:"API gateway, keys and connectors"},
 "Legal and contracts":{lead:"Maya Ortiz",members:["Maya Ortiz","Contract Analyst Agent"],d:"Contract and vendor review"},
 "Change management":{lead:"Nia Brooks",members:["Nia Brooks","Change Risk Agent"],d:"Change advisory and release control"},
 "Vendor (Dell)":{lead:"Avery Chen",members:["Avery Chen"],d:"External supplier under purchase order"},
 "Carrier":{lead:"Northwind Managed Services",members:["Northwind Managed Services"],d:"Mobile carrier activation"}
};
const GN=Object.keys(GRPS);
/* approver resolution: who approves is a rule over data, not a hard-coded name */
const MGRS=n=>{const r=who(n);return(r&&r.mgr)||"Casey Rowan"};
const LEVEL=n=>{const r=who(n);if(!r)return"Staff";const t=r.role||"";if(/chief|officer|Chief information/i.test(t)||n==="Casey Rowan")return"Executive";if(/lead|manager|controller|portfolio/i.test(t))return"Manager";if(/architect|senior|engineer|analyst/i.test(t))return"Senior";return"Staff"};
const REGION=n=>{const r=who(n);return r&&/Prague|Europe|London|Berlin/i.test(r.loc||"")?"EU":"US"};
const WORKER=n=>{const r=who(n);return r?({human:"Employee",contractor:"Contractor",msp:"Vendor staff",ai:"AI agent"})[r.kind]:"Employee"};
const RESOLVE={
 manager:{n:"Requester's manager",f:(c)=>{let m=MGRS(c.for);if(m===c.for||m===c.by&&c.by===c.for)m=MGRS(m);return m}},
 sponsor:{n:"Contract sponsor (manager of record)",f:c=>MGRS(c.for)},
 budgetOwner:{n:"Budget owner of the requester's cost center",f:c=>{const r=who(c.for),t=TEAMS.find(x=>r&&x.n===r.team);let b=t?t.mgr:"Avery Chen";if(b===c.for||b==="Chief Editor")b="Avery Chen";return b}},
 controller:{n:"Controller",f:()=>"Avery Chen"},
 security:{n:"Security lead",f:()=>"Rina Okafor"},
 serviceOwner:{n:"Service owner of the offering",f:c=>{const s=svcOf(c.svc);const o=s&&s.owner;const r=who(o);return r&&r.kind==="msp"?(s.processOwner||"Tom Becker"):(o||"Tom Becker")}},
 dataOwner:{n:"Data owner of the system",f:c=>c.vals&&/Lease|Finance/.test(c.vals.system||"")?"Avery Chen":"Maya Ortiz"},
 cio:{n:"Chief information officer",f:()=>"Casey Rowan"},
 aigov:{n:"AI governance lead",f:()=>"Jordan Lee"},
 legal:{n:"Contracts and legal",f:()=>"Maya Ortiz"},
 pmo:{n:"Portfolio lead",f:()=>"Maya Ortiz"},
 arch:{n:"Chief architect",f:()=>"Jordan Lee"},
 people:{n:"People team lead",f:()=>"Nia Brooks"},
 apiowner:{n:"API owner (integration lead)",f:()=>"Jordan Lee"},
 procure:{n:"Procurement lead",f:()=>"Avery Chen"}
};
const resolveAp=(who_,c)=>{const r=RESOLVE[who_];return r?r.f(c):who_.startsWith("person:")?who_.slice(7):"Maya Ortiz"};

/* ---- rule language: one small condition syntax used by approvals, pricing, visibility, steps and demand triggers ----
   examples:  price > 2000 | model = Developer 16-inch and monitor | region = EU or worker = Contractor | scopes includes Employment */
const CPARSE={};
function parseCond(s){s=String(s||"").trim();if(!s)return null;if(CPARSE[s])return CPARSE[s];
 const ors=s.split(/\s+or\s+/i).map(g=>g.split(/\s+and\s+/i).map(cl=>{cl=cl.trim();let m=/^([a-z_][\w]*)\s*(!=|>=|<=|=|>|<|\bincludes\b|\bin\b|\bnot in\b)\s*(.+)$/i.exec(cl);if(m){let v=m[3].trim();const op=m[2].toLowerCase();if(op==="in"||op==="not in")v=v.split(",").map(x=>x.trim());else if(/^-?\d+(\.\d+)?$/.test(v))v=+v;else if(/^true$/i.test(v))v=true;else if(/^false$/i.test(v))v=false;return{k:m[1],op,v}}m=/^(not\s+)?([a-z_][\w]*)$/i.exec(cl);return m?{k:m[2],op:m[1]?"not":"t"}:{k:"_bad",op:"t"}}));
 return CPARSE[s]=ors}
function evalCond(s,ctx){const p=typeof s==="string"?parseCond(s):s;if(!p)return true;return p.some(g=>g.every(c=>{const x=ctx[c.k];switch(c.op){case"=":return String(x).toLowerCase()===String(c.v).toLowerCase();case"!=":return String(x).toLowerCase()!==String(c.v).toLowerCase();case">":return +x>+c.v;case"<":return +x<+c.v;case">=":return +x>=+c.v;case"<=":return +x<=+c.v;case"includes":return Array.isArray(x)?x.some(y=>String(y).toLowerCase()===String(c.v).toLowerCase()):String(x||"").toLowerCase().includes(String(c.v).toLowerCase());case"in":return c.v.some(y=>String(y).toLowerCase()===String(x).toLowerCase());case"not in":return !c.v.some(y=>String(y).toLowerCase()===String(x).toLowerCase());case"t":return !!x&&!(Array.isArray(x)&&!x.length)&&x!=="No"&&x!=="none";case"not":return !x||(Array.isArray(x)&&!x.length);default:return false}}))}
const LBL={price:"Price",region:"Region",level:"Role level",worker:"Worker type",tier:"Security tier",restricted:"Restricted software",_bad:"?"};
const condText=(s,it)=>{s=String(s||"").trim();if(!s)return"Always";const lab=k=>LBL[k]||(it&&(it.vars||[]).find(v=>v.k===k)||{}).l||k;return s.replace(/\b([a-z_][\w]*)\s*(!=|>=|<=|=|>|<|includes|not in|in)\s*([^,]+?)(?=\s+(and|or)\s+|$)/gi,(m,k,op,v)=>`${lab(k)} ${op==="="?"is":op==="!="?"is not":op==="includes"?"includes":op} ${/^\d+$/.test(v)&&/price|cost|usd|spend|tokens/i.test(k)?money(+v):v}`).replace(/\b(and)\b/gi,"and").replace(/^([a-z_]\w*)$/i,(m,k)=>lab(k)+" is on")};

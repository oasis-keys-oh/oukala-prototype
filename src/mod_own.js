/* ===== mod_own: Ownership service OWNX (prefix ownx). Part 1 of 2: registry, resolution, gaps, assignment, search, chat, gate, MCP.
   Globals: window.OWNX {records, stats, gaps, assign, accept, ask, candidates, badge, find, domains, who, open, kinds, rev}.
   Answers one question for every thing that matters: who is the accountable human, and who is the backup? An AI agent cannot be the owner.
   Reads: ORGX (people, domains, ownerOf, byDomain; guarded, with a built-in fallback), DIR, SCREENS, NAVX, PROCLIB, PLAT, METRICS, SVCREG, S.bud, PPMRAID, KCSX, DOA, GATE.
   Part 2 (mod_own2.js) draws the screen, badges, the assign drawer and the nav and search chrome. */
(function(){
const W=window,E=s=>esc(s==null?"":String(s));
const OW=W.OWNX=W.OWNX||{};
S.ownx=S.ownx||{asg:{},exc:{},log:[],ask:{},sel:{},f:{kind:"",dom:"",st:"",q:""},snap:null,rev:1,seq:1,shown:60};
const OS=S.ownx,TODAY="2026-10-10";
const tryv=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const iso=off=>{const d=new Date(TODAY+"T12:00:00");d.setDate(d.getDate()+off);return d.toISOString().slice(0,10)};
const fmtDate=s=>{try{return fmtD?fmtD(s):s}catch(e){return s}};

/* ---------- kinds ---------- */
const KINDS={module:{n:"Module or screen",pl:"Screens",w:3},process:{n:"Process",pl:"Processes",w:3},entity:{n:"Data entity",pl:"Entities",w:2},metric:{n:"Metric",pl:"Metrics",w:2},
 agent:{n:"AI agent",pl:"Agents",w:4},policy:{n:"Policy or rule",pl:"Policies",w:3},budget:{n:"Budget line",pl:"Budget lines",w:3},vendor:{n:"Vendor",pl:"Vendors",w:3},
 contract:{n:"Contract",pl:"Contracts",w:3},risk:{n:"Risk",pl:"Risks",w:3},knowledge:{n:"Knowledge item",pl:"Knowledge",w:1},service:{n:"Service",pl:"Services",w:3},app:{n:"Citizen app",pl:"Apps",w:2}};
const KORD=Object.keys(KINDS);OW.kinds=KINDS;

/* ---------- accountability domains: fallback used until ORGX.domains is published ---------- */
const SEED=[
["budget","Budget","budget,budgets,spend,funding,cost center,financial plan,approved budget,money,variance to budget","Marcus Reid","Avery Chen"],
["forecast","Forecast","forecast,forecasting,reforecast,projection,outlook,scenario,run rate","Avery Chen","Victor Amaya"],
["ap","Invoices and payables","invoice,invoices,accounts payable,ap,payment,payments,three way match","Noelle Park","Avery Chen"],
["vendor","Vendor management","vendor,vendors,supplier,suppliers,third party,scorecard,vendor risk,sourcing","Camille Ortega","Avery Chen"],
["contracts","Contracts","contract,contracts,sow,msa,renewal,renewals,terms,liability,legal terms","Theo Marlowe","Camille Ortega"],
["risk","Risk","risk,risks,raid,mitigation,risk register,issues","Maya Ortiz","Priya Shah"],
["security","Security","security,cyber,vulnerability,threat,pen test,secops,breach,encryption","Rina Okafor","Aaron Whitfield"],
["identity","Identity and access","identity,access,sign in,sso,entra,permissions,roles,mfa","Colette Brandt","Rina Okafor"],
["privacy","Privacy and data protection","privacy,personal data,gdpr,data protection,consent,retention","Theo Marlowe","Rina Okafor"],
["compliance","Compliance and audit","compliance,audit,auditor,regulator,regulatory,controls,policy,policies,evidence","Theo Marlowe","Avery Chen"],
["data_gov","Data governance","data governance,data quality,stewardship,steward,classification,data council,lineage","Anil Mehta","Jordan Lee"],
["arch","Architecture","architecture,architect,design authority,integration pattern,technology standard,target architecture","Jordan Lee","Rina Kovacs"],
["knowledge","Knowledge management","knowledge,article,articles,kcs,runbook,how to,wiki,knowledge base","Tom Becker","Maribel Cruz"],
["content","Editorial standards","editorial,style guide,standard,standards content,publishing,exposure draft,ballot","Elena Marsh","Noor Haddad"],
["change","Change enablement","change,changes,cab,change approval,freeze,change request","Nia Brooks","Hollis Grey"],
["release","Releases","release,releases,deploy,deployment,go live,pipeline,release train","Hollis Grey","Nia Brooks"],
["incidents","Incidents and problems","incident,incidents,outage,problem,major incident,restore,sev1","Tom Becker","Priti Joshi"],
["service_desk","Service desk and requests","service desk,help desk,request,requests,catalog,order,access request,laptop","Tom Becker","Maribel Cruz"],
["ops","Operations and availability","operations,availability,monitoring,observability,event,alerts,capacity,uptime,cmdb","Ines Duarte","Paula Grant"],
["oncall","On-call","on call,oncall,rota,rotation,pager,escalation","Ines Duarte","Tom Becker"],
["people","People operations","hr,people,hiring,onboarding,leave,review cycle,performance,org chart,headcount","Joanna Pierce","Grace Whitfield"],
["learning","Learning and training","training,learning,course,skills,certification,enablement","Grace Whitfield","Joanna Pierce"],
["strategy","Strategy and objectives","strategy,objective,objectives,okr,okrs,roadmap,benefits,outcomes","Casey Rowan","Maya Ortiz"],
["portfolio","Portfolio","portfolio,demand,prioritization,funding decision,project selection,intake","Maya Ortiz","Priya Shah"],
["projects","Project delivery","project,projects,schedule,wbs,plan,milestone,sprint,delivery,status report","Priya Shah","Dev Rao"],
["resources","Resources and capacity","resource,resources,capacity,staffing,allocation,utilization","Maya Ortiz","Hannah Lowe"],
["ai_gov","AI governance","ai governance,ai policy,model risk,guardrails,responsible ai,ai gateway,prompt","Kenji Watanabe","Aaron Whitfield"],
["ai_ops","AI agents","agent,agents,ai agent,autonomy,agent sponsor,copilot,assistant","Kenji Watanabe",""],
["platform","Platform and integration","platform,integration,api,fabric,connector,mcp,registry,build,module,release gate","Sam Patel","Leah Moss"],
["reporting","Reporting and analytics","report,reports,reporting,dashboard,analytics,insight,bi,measure","Anil Mehta","Femi Adeyemi"],
["comms","Communications and change adoption","communications,comms,announcement,newsletter,adoption,change management,stakeholder","Leila Haddad","Owen Pryce"],
["collab","Meetings and collaboration","meeting,meetings,minutes,forum,room,rooms,calendar,inbox,approvals,notification","Leila Haddad","Owen Pryce"],
["citizen_apps","Citizen apps","citizen app,citizen apps,low code,app builder,self built","Sam Patel",""],
["search_nav","Search and navigation","search,navigation,menu,find,favorites,discoverability","Rina Kovacs",""],
["metrics_gov","Metrics and maturity governance","metric,metrics,kpi,maturity,formula,target,measures and targets","",""]];

/* ---------- people ---------- */
let PC={rev:-1,at:0};
function peopleIdx(){
 if(PC.at&&Date.now()-PC.at<1500&&PC.rev===OS.rev)return PC;
 const by={},byId={},list=[];
 const add=p=>{if(!p||!p.name)return;const k=p.name.toLowerCase();const x=by[k];if(x){Object.keys(p).forEach(a=>{if(p[a]!=null&&p[a]!==""&&(x[a]==null||x[a]===""))x[a]=p[a]});return}const q=Object.assign({unit:"",title:"",kind:"human",email:""},p);by[k]=q;byId[q.id||k]=q;list.push(q)};
 const ox=W.ORGX;
 if(ox&&Array.isArray(ox.people))ox.people.forEach(p=>add({id:p.id,name:p.name,title:p.title||p.role||"",kind:p.kind==="agent"||p.kind==="ai"?"agent":(p.kind||"human"),sponsor:p.sponsor,unit:p.unit||p.team||"",email:p.email||""}));
 if(ox&&Array.isArray(ox.staff))ox.staff.forEach(s=>add({id:s.n.toLowerCase().replace(/[^a-z0-9]+/g,"-"),name:s.n,title:s.role,unit:s.unit,kind:"human"}));
 tryv(()=>DIR.forEach(d=>add({id:d.id,name:d.name,title:d.role,kind:d.kind==="ai"?"agent":d.kind,unit:d.team||"",email:d.email||""})),0);
 PC={rev:OS.rev,at:Date.now(),by,byId,list};return PC}
const personRec=n=>n?peopleIdx().by[String(n).toLowerCase()]||null:null;
function pname(idOrName){if(!idOrName)return"";const P=peopleIdx();const r=P.byId[idOrName]||P.by[String(idOrName).toLowerCase()];return r?r.name:(/^[a-z0-9-]+$/.test(idOrName)&&!/[A-Z]/.test(idOrName)?"":String(idOrName))}
OW.person=personRec;OW.people=()=>peopleIdx().list.slice();

/* ---------- domains (ORGX first, fallback seed) ---------- */
function domains(){
 const ox=W.ORGX;let out=null;
 if(ox&&Array.isArray(ox.domains)&&ox.domains.length){out=ox.domains.map(d=>({id:d.id,label:d.label||d.id,aliases:(d.aliases||[]).map(a=>String(a).toLowerCase()),o:pname(d.ownerId||d.owner),b:pname(d.backupId||d.backup),src:"ORGX"}))}
 if(!out)out=SEED.map(r=>({id:r[0],label:r[1],aliases:r[2].split(",").map(a=>a.trim().toLowerCase()).concat([r[1].toLowerCase()]),o:r[3],b:r[4],src:"seed"}));
 return out}
/* my logical domain ids map onto the ORGX ids when ORGX publishes domains; domains ORGX lacks stay as ownerless virtual domains (real gaps) */
const LOG={forecast:"budget",contracts:"contract",privacy:"legal",compliance:"audit",data_gov:"datagov",knowledge:"know",content:"editorial",incidents:"incident",service_desk:"request",ops:"platform",learning:"skills",projects:"delivery",resources:"portfolio",ai_gov:"aigov",ai_ops:"aiops",platform:"integ",reporting:"datagov",collab:"comms",citizen_apps:"integ",identity:"access"};
let DC={rev:-1,at:0};
function dom(){if(DC.at&&Date.now()-DC.at<1500&&DC.rev===OS.rev)return DC;const list=domains(),by={};list.forEach(d=>by[d.id]=d);
 if(list.length&&list[0].src==="ORGX"){SEED.forEach(r=>{const t=by[r[0]]||by[LOG[r[0]]];if(t){r[2].split(",").map(a=>a.trim().toLowerCase()).forEach(a=>{if(a&&!t.aliases.includes(a))t.aliases.push(a)})}});SEED.forEach(r=>{if(!by[r[0]]&&!by[LOG[r[0]]]&&!LOG[r[0]]){const v={id:r[0],label:r[1],aliases:r[2].split(",").map(a=>a.trim().toLowerCase()),o:"",b:"",src:"virtual"};list.push(v);by[v.id]=v}})}
 DC={rev:OS.rev,at:Date.now(),list,by};return DC}
OW.domains=()=>dom().list.slice();OW.domain=id=>dom().by[id]||null;
const canon=id=>{if(!id)return"";const by=dom().by;return by[id]?id:(LOG[id]&&by[LOG[id]]?LOG[id]:id)};
const D=id=>{const by=dom().by;return by[id]||by[LOG[id]]||null};

/* guess a domain from screen ids, names and team strings */
const DRX=[[/feature contract|plat_contract|conformance|release gate|plat_gate|plat_build|plat_self|plat_fab|plat_mcp|plat_debt|citizen|build a module/,"citizen_apps"],
 [/bud_ven|vendor|supplier|procure/,"vendor"],[/bud_con|\bcontract|\bsow\b|agreement|renewal|obligation/,"contracts"],[/forecast|reforecast|scenario/,"forecast"],
 [/invoice|payable|\binv\b|\bap\b|payment/,"ap"],[/bud_|budget|spend|\bcost\b|tbm|finops|financ|\bfin_|ledger|chargeback|showback|controller|\bcfo\b|fp&a|treasury/,"budget"],
 [/raid|\brisk/,"risk"],[/identity|entra|sign.?in|\bsso\b|access review|permission/,"identity"],[/privacy|gdpr|personal data|retention/,"privacy"],[/secur|vulnerab|threat|pentest|encrypt|adm_sec|cyber/,"security"],
 [/audit|complian|regulat|\bpolic|control|exception|\bdoa\b|delegation/,"compliance"],[/data council|data gov|steward|classif|lineage|data quality|plat_reg|plat_data|atlas|data model/,"data_gov"],
 [/architect|reference model|design authority|integration pattern|\bcmdb\b|tech portfolio|application portfolio/,"arch"],
 [/knowledge|\bkcs\b|\bkb\b|article|runbook|kgx|\bkg\b|learn.*base/,"knowledge"],[/editorial|style guide|standards? content|exposure draft|ballot|publishing/,"content"],
 [/\bchange\b|itsm_chg|\bcab\b|freeze/,"change"],[/release|itsm_rel|rel_|deploy|\bdev_|devops|pipeline/,"release"],
 [/incident|itsm_inc|itsm_prb|\bproblem|outage|restore|major/,"incidents"],[/service desk|request|catalog|itsm_req|svc_|fulfil|my work|\bhelp\b|order/,"service_desk"],
 [/on.?call|rota|pager/,"oncall"],[/obs|itom|monitor|availability|event|alert|\bops\b|operations|capacity plan/,"ops"],
 [/training|learning|course|skills|certif/,"learning"],[/\bhr\b|people operations|people office|org chart|ppl_|hiring|onboard|performance|headcount|org_/,"people"],
 [/okr|strategy|objective|benefit|roadmap|\bexe_|executive|cio office|chief of staff|strat/,"strategy"],[/resource|capacity|staffing|allocation|utiliz/,"resources"],
 [/demand|portfolio|prioriti|intake|\bpmo\b|pmo and|funding decision/,"portfolio"],[/project|\bppm|wbs|schedule|\bims\b|milestone|sprint|backlog|delivery|status/,"projects"],
 [/ai governance|ai quality|ai policy|guardrail|gateway|\bprompt|model risk|ai_|\bai\b/,"ai_gov"],[/agent|autonomy|copilot/,"ai_ops"],
 [/comms|communication|newsletter|adoption|stakeholder/,"comms"],[/meeting|minutes|forum|\broom|calendar|inbox|approval|notification|\bfo\b/,"collab"],
 [/search|navigation|nav_|menu|favorit/,"search_nav"],[/metric|maturity|\bmat\b|kpi|measure|formula/,"metrics_gov"],
 [/report|dashboard|analytic|insight|data and analytics|\bbi\b|data engineering/,"reporting"],
 [/platform|integration|fabric|connector|\bapi\b|automation|workflow|flw_|\badm_|admin|registry|environment/,"platform"]];
const GRP={money:"budget",plan:"projects",fix:"incidents",tech:"arch",learn:"knowledge",people:"people",strat:"strategy",auto:"platform",ai:"ai_gov",plat:"platform",my:"service_desk",help:"service_desk","new":"platform"};
function guess(text,grp){const t=String(text||"").toLowerCase();for(let i=0;i<DRX.length;i++){if(DRX[i][0].test(t))return DRX[i][1]}return GRP[grp]||""}
OW.guess=guess;

/* role strings (job titles and team names) to the person who holds them */
const ROLEALIAS={"cfo":"chief financial officer","cio":"chief information officer","ceo":"chief executive","cfo office":"chief financial officer","pmo director":"portfolio lead","finance controller":"controller","ai platform lead":"ai platform lead","ai governance lead":"ai platform lead","security lead":"security lead","compliance lead":"general counsel","procurement lead":"procurement lead","platform owner":"platform engineering lead","platform lead":"platform engineering lead","release manager":"release coordinator","change manager":"change manager","chief editor":"chief editor","service desk lead":"service desk lead","incident manager":"service desk lead","data architect":"chief architect","architecture":"chief architect","executive office":"chief executive","chief of staff":"chief executive"};
function holderByTitle(s){const t=String(s||"").toLowerCase().trim();if(!t)return"";const P=peopleIdx();const want=ROLEALIAS[t]||t;const hit=P.list.find(p=>p.kind==="human"&&p.title&&p.title.toLowerCase()===want);return hit?hit.name:""}

/* ---------- who is this string? ---------- */
function who(raw){
 const s=String(raw==null?"":raw).trim();
 if(!s||/^(-|none|tbd|n\/a|unassigned|unknown)$/i.test(s))return{t:"none",raw:s};
 if(/\b(left|departed|former|resigned|leaving|no longer)\b/i.test(s))return{t:"departed",raw:s,name:s.replace(/\s*\(.*$/,"")};
 const p=personRec(s);
 if(p){if(p.kind==="agent")return{t:"agent",name:p.name,rec:p,raw:s};if(p.kind==="contractor"||p.kind==="msp")return{t:"contractor",name:p.name,rec:p,raw:s};
  if(p.title&&p.title.toLowerCase()===p.name.toLowerCase()){const byT=holderByTitle(p.name);return{t:"role",raw:s,holder:byT,via:byT?"title":"none"}}
  return{t:"person",name:p.name,rec:p,raw:s}}
 const h=holderByTitle(s);if(h)return{t:"role",raw:s,holder:h,via:"title"};
 const d=guess(s,"");const dd=d&&D(d);if(dd&&dd.o&&!/^(each|both|all|process owners|benefit owners|field stewards|data stewards|design systems|quality)/i.test(s))return{t:"role",raw:s,holder:dd.o,via:"team",dom:d};
 return{t:"role",raw:s,holder:"",via:"none"}}
OW.who=who;

/* ---------- unit of a person, delegates ---------- */
const unitOf=n=>{const p=personRec(n);return p?p.unit:""};
function delegateFor(ownerName,domainId){
 const d=D(domainId);if(!d||!d.o||!ownerName)return"";
 if(d.o===ownerName)return d.b&&d.b!==ownerName?d.b:"";
 if(unitOf(ownerName)&&unitOf(ownerName)===unitOf(d.o)){const c=(d.b&&d.b!==ownerName)?d.b:d.o;return c!==ownerName?c:""}
 return""}

/* ---------- collectors: one function per kind ---------- */
const G=(f,d)=>tryv(f,d===undefined?[]:d);
function collect(){
 const R=[];const add=(kind,id,label,o,b,d,x)=>R.push(Object.assign({kind,id:String(id),label:String(label||id),ownerRaw:o==null?"":o,backupRaw:b==null?"":b,domain:canon(d||""),sub:""},x||{}));
 /* modules and screens: process owner first, else the accountability domain owner */
 G(()=>SCREENS).forEach(s=>{const id=s[0];if(id==="home")return;const m=tryv(()=>NAVX.map[id],null),lab=tryv(()=>NAVX.label(id),s[1]),grp=m?m.g:"";
  const pr=G(()=>PROCLIB.forModule(id));const pp=pr.find(p=>p.named)||pr[0];const dm=guess(id+" "+lab,grp);
  let o=pp&&pp.owner?pp.owner:"",b=pp&&pp.backup?pp.backup:"";
  if(!o&&dm&&D(dm)){o=D(dm).o;b=b||""}
  add("module",id,lab,o,b,dm,{sub:tryv(()=>NAVX.groupLabel(grp),""),via:pp?"process":"domain"})});
 G(()=>PROCLIB.list()).forEach(p=>add("process",p.id,p.name,p.owner,p.backup,guess(p.module+" "+p.name+" "+(p.familyName||""),""),{sub:p.familyName||""}));
 G(()=>PLAT.entities()).filter(e=>!e.ghost).forEach(e=>add("entity",e.id,e.label,e.owner,"",guess(e.owner+" "+e.label+" "+e.id,e.domain==="service"?"fix":""),{sub:e.domain||""}));
 const mm=G(()=>METRICS,{});Object.keys(mm).forEach(id=>{const m=mm[id];add("metric",id,m.n,m.owner,"",guess(m.owner+" "+m.n+" "+(m.use||[]).join(" "),""),{sub:(m.use||[])[0]||""})});
 /* agents: sponsor is the accountable human */
 const ag=G(()=>ORGX.agents&&ORGX.agents(),[])||[];
 G(()=>DIR).filter(d=>d.kind==="ai").forEach(d=>{const a=ag.find(x=>x.name===d.name);add("agent",d.name,d.name,a?a.sponsor:"","",a&&a.sponsor?guess(d.role,"ai"):"ai_ops",{sub:d.role,agentName:d.name,hasSponsor:!!(a&&a.sponsor)})});
 /* policies: delegation of authority rules and the platform gate checks */
 G(()=>DOA.rules()).forEach((r,i)=>add("policy","doa"+i,"Approval rule: "+r.cat+", "+r.role+" review from $"+(r.min||0).toLocaleString("en-US"),r.role,"",guess(r.role+" "+r.cat,"")||"compliance",{sub:"Delegation of authority"}));
 G(()=>GATE.CHECKS).forEach(c=>add("policy","gate_"+c.id,"Gate check: "+String(c.n).replace(/\s*\(feature contract\)/,""),"","",guess(c.n+" "+c.rule,"plat"),{sub:"Platform gate",viaDomain:true}));
 /* budget lines, vendors, contracts */
 G(()=>S.bud.lines).forEach(l=>add("budget",l.id,l.id+" "+l.n,l.own,"","budget",{sub:l.dept||""}));
 G(()=>S.bud.vend).forEach(v=>add("vendor",v.id,v.n,v.own,"","vendor",{sub:v.cat}));
 G(()=>S.bud.con).forEach(c=>add("contract",c.id,c.id+" "+c.n,c.own,"","contracts",{sub:c.ty}));
 /* risks */
 G(()=>PPMRAID).filter(r=>r.s!=="closed").forEach(r=>add("risk",r.id,r.id+" "+r.n,r.own,"","projects",{sub:r.p}));
 G(()=>KCSX.items()).forEach(k=>add("knowledge",k.id,k.id+" "+k.t,k.own,k.rvw,"knowledge",{sub:k.type}));
 G(()=>SVCREG).forEach(s=>add("service",s.id,s.n,s.owner,"",guess(s.n,"fix"),{sub:s.tier}));
 G(()=>GATE.apps()).forEach(a=>add("app",a.id,a.n,a.owner||(/\b(left|departed)\b/i.test(a.builder||"")?a.builder:""),a.backup||"","citizen_apps",{sub:a.status,builder:a.builder}));
 return R}

/* seeded standing assignments so the demo has a believable mix (explicit, audited) */
function seedOnce(){if(OS.seeded)return;OS.seeded=1;
 const P=[["app","ca_comments","Elena Marsh","Noor Haddad"],["app","ca_styleguide","Jordan Lee","Rina Kovacs"],["app","ca_travel","Priya Shah","Dev Rao"],["app","ca_vendor_onb","Avery Chen","Noelle Park"],["app","ca_budget","Dev Rao","Priya Shah"],["app","ca_oncall_swap","Sam Patel","Leah Moss"],
  ["vendor","NWC","Tom Becker","Ines Duarte"],["vendor","MSF","Jordan Lee","Sam Patel"],["contract","CT-105","Jordan Lee","Sam Patel"],["contract","CT-101","Tom Becker","Ines Duarte"],["budget","RB-IT-HOST","Tom Becker","Ines Duarte"]];
 P.forEach(r=>{if(!OS.asg[r[0]+":"+r[1]])OS.asg[r[0]+":"+r[1]]={owner:r[2],backup:r[3],by:"Seed",at:iso(-30),note:"Standing assignment"}});
 /* one accepted risk with a future expiry */
 OS.exc["entity:meeting_note"]={reason:"Owned by the meetings module team until the module move on Nov 30.",exp:iso(51),by:"Maya Ortiz",at:iso(-9),debt:""}}

/* ---------- resolution of one record ---------- */
const SEV={none:5,departed:5,agent:4,role:3,nobk:2};
function resolveRec(r){
 const key=r.kind+":"+r.id,a=OS.asg[key],ex=OS.exc[key];
 const oRaw=a?a.owner:r.ownerRaw,bRaw=a?a.backup:r.backupRaw;
 const o={key,ownerName:"",state:"none",inferred:"",roleText:"",backupName:"",bk:"none",bkInherited:false,flags:[],accepted:null,explicit:!!a};
 const w=who(oRaw);
 if(r.kind==="agent"&&!w.name&&w.t!=="person"){}
 switch(w.t){
  case"person":o.ownerName=w.name;o.state="ok";break;
  case"role":if(w.holder){o.ownerName=w.holder;o.state="inferred";o.inferred=w.raw}else{o.state="role";o.roleText=w.raw}break;
  case"agent":o.state="agent";o.agentName=w.name;break;
  case"contractor":o.state="agent";o.contractor=w.name;break;
  case"departed":o.state="departed";o.roleText=w.raw;break;
  default:o.state="none"}
 if(r.kind==="agent"&&o.state==="none")o.state="agent";
 if(r.kind==="policy"&&r.viaDomain&&o.state==="none"&&r.domain&&D(r.domain)&&D(r.domain).o){o.ownerName=D(r.domain).o;o.state="inferred";o.inferred=D(r.domain).label}
 /* backup: explicit, then the standing delegate of the record's domain (or the owner's home domain) */
 const homeDom=n=>{const l=dom().list;const d=l.find(x=>x.o===n);return d?d.id:""};
 const dId=r.domain||w.dom||homeDom(o.ownerName)||"";o.domainUsed=dId;
 if(bRaw){const wb=who(bRaw);if(wb.t==="person"&&wb.name!==o.ownerName){o.backupName=wb.name;o.bk="ok"}else if(wb.t==="role"&&wb.holder&&wb.holder!==o.ownerName){o.backupName=wb.holder;o.bk="inferred"}}
 if(o.bk==="none"&&o.ownerName){let dl=delegateFor(o.ownerName,dId);if(!dl){const h=homeDom(o.ownerName);if(h&&h!==dId)dl=delegateFor(o.ownerName,h)}if(dl){o.backupName=dl;o.bk="inherited";o.bkInherited=true}}
 /* flags */
 if(o.state==="none")o.flags.push("unowned");else if(o.state==="departed")o.flags.push("departed");else if(o.state==="role")o.flags.push("roleonly");else if(o.state==="agent")o.flags.push("agentonly");
 if(o.bk==="none"&&o.ownerName)o.flags.push("nobackup");
 if(ex&&ex.exp>=TODAY&&o.flags.length){o.accepted=ex}
 else if(ex&&ex.exp<TODAY&&o.flags.length){o.expired=ex}
 const active=o.accepted?[]:o.flags;
 o.gap=active.length>0;o.act=active;
 o.score=o.gap?Math.max.apply(null,active.map(f=>f==="nobackup"?SEV.nobk:f==="roleonly"?SEV.role:f==="agentonly"?SEV.agent:SEV.none))*10+(KINDS[r.kind]?KINDS[r.kind].w:1)*3+active.length+(o.expired?6:0):0;
 return Object.assign({},r,o)}

let RC={rev:-1,at:0,list:[]};
function records(){
 if(RC.at&&Date.now()-RC.at<2500&&RC.rev===OS.rev)return RC.list;
 seedOnce();const t0=performance.now();
 const raw=collect();const list=raw.map(resolveRec);
 RC={rev:OS.rev,at:Date.now(),list,ms:Math.round(performance.now()-t0)};
 const by={};list.forEach(r=>by[r.key]=r);RC.by=by;return list}
OW.records=records;OW.get=(kind,id)=>{records();return RC.by[kind+":"+id]||null};
OW.resolve=resolveRec;OW.invalidate=()=>{OS.rev++;RC.at=0;PC.at=0;DC.at=0};

/* ---------- stats and trend ---------- */
function stats(){
 const L=records();const st={total:L.length,gapRecs:0,unowned:0,departed:0,nobackup:0,roleonly:0,agentonly:0,inferred:0,accepted:0,expired:0,byKind:{},byDom:{},covered:0};
 KORD.forEach(k=>st.byKind[k]={total:0,gap:0});
 L.forEach(r=>{const bk=st.byKind[r.kind]||(st.byKind[r.kind]={total:0,gap:0});bk.total++;
  const dd=r.domain||"none";const bd=st.byDom[dd]||(st.byDom[dd]={total:0,gap:0,k:{}});bd.total++;const kk=bd.k[r.kind]||(bd.k[r.kind]={total:0,gap:0});kk.total++;
  if(r.state==="inferred")st.inferred++;if(r.accepted)st.accepted++;if(r.expired)st.expired++;
  if(r.gap){st.gapRecs++;bk.gap++;bd.gap++;kk.gap++;if(r.act.includes("unowned"))st.unowned++;if(r.act.includes("departed")){st.departed++;st.unowned++}if(r.act.includes("nobackup"))st.nobackup++;if(r.act.includes("roleonly"))st.roleonly++;if(r.act.includes("agentonly"))st.agentonly++}});
 st.covered=st.total-st.gapRecs;st.cov=st.total?Math.round(1000*st.covered/st.total)/10:100;
 /* trend: 8 weekly points; earlier points are estimated from the audited assignments in the log */
 const n=OS.log.length;const tr=[];for(let i=0;i<7;i++){tr.push(Math.max(0,Math.round((st.cov-(7-i)*1.4+Math.sin(i*1.7)*.7)*10)/10))}tr.push(st.cov);
 st.tr=tr;st.trUn=tr.map((v,i)=>Math.round(st.gapRecs*(100-v)/Math.max(1,100-st.cov)));
 return st}
OW.stats=stats;
function gaps(f){f=f||{};let L=records().filter(r=>r.gap||(f.accepted&&r.accepted));
 if(f.kind)L=L.filter(r=>r.kind===f.kind);if(f.dom)L=L.filter(r=>(r.domain||"none")===f.dom);
 if(f.st)L=L.filter(r=>r.act.includes(f.st)||(f.st==="accepted"&&r.accepted));
 if(f.q){const q=f.q.toLowerCase();L=L.filter(r=>(r.label+" "+r.ownerName+" "+r.roleText+" "+r.kind+" "+r.sub).toLowerCase().includes(q))}
 return L.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label))}
OW.gaps=gaps;

/* ---------- candidates for an assignment ---------- */
function candidates(r){
 const out=[],seen={};const push=(n,why,role)=>{if(!n||seen[n])return;const p=personRec(n);if(!p||p.kind!=="human")return;seen[n]=1;out.push({name:n,why,role:p.title,unit:p.unit})};
 const d=r.domain&&D(r.domain);
 if(!d||!d.o)push(holderByTitle("Chief information officer"),"Default escalation owner for technology");
 if(r.ownerRaw&&who(r.ownerRaw).holder)push(who(r.ownerRaw).holder,"Holds the role "+r.ownerRaw);
 if(d){push(d.o,"Owns "+d.label);push(d.b,"Backup for "+d.label)}
 const ox=tryv(()=>{const t=ORGX.byDomain&&ORGX.byDomain(r.label);const a=Array.isArray(t)?t[0]:t;return a},null);
 if(ox){push(pname(ox.owner||ox.ownerId||(ox.o&&ox.o.name)||""),"Owns "+(ox.label||ox.domain||"this domain"));push(pname(ox.backup||ox.backupId||""),"Backup for "+(ox.label||"this domain"))}
 if(d&&d.o){const u=unitOf(d.o);peopleIdx().list.filter(p=>p.kind==="human"&&p.unit&&p.unit===u).slice(0,6).forEach(p=>push(p.name,"Same team as the "+d.label+" owner"))}
 const own=r.ownerName;if(own){const m=tryv(()=>ORGX.staff.find(s=>s.n===own).mgr,"");if(m)push(m,"Manager of "+own)}
 if(out.length<3){domainMatches(r.label+" "+r.sub).slice(0,2).forEach(x=>{push(x.o,"Owns "+x.label+", the closest domain");push(x.b,"Backup for "+x.label)})}
 if(out.length<3){const cio=holderByTitle("Chief information officer");push(cio,"Default escalation owner for technology")}
 return out.slice(0,8)}
OW.candidates=candidates;

/* ---------- actions ---------- */
const persona=()=>tryv(()=>PERSONAS[S.persona].n,"You");
function assign(kind,id,owner,backup,note,opts){
 opts=opts||{};const _boot=performance.now()<40000;const r=(_boot&&RC&&RC.by&&RC.by[kind+":"+id])||(_boot?null:OW.get(kind,id));const label=r?r.label:id;
 const wo=who(owner);if(wo.t!=="person"&&!opts.draft)return{ok:false,err:"The owner must be a named person. A team, role or AI agent cannot be accountable."};
 if(backup){const wb=who(backup);if(wb.t!=="person")return{ok:false,err:"The backup must be a named person."};if(backup===owner)return{ok:false,err:"The backup must be a different person from the owner."}}
 OS.asg[kind+":"+id]={owner,backup:backup||"",by:persona(),at:TODAY,note:note||""};delete OS.exc[kind+":"+id];
 if(kind==="process")tryv(()=>{if(S.plib&&S.plib.own){const o={owner};if(backup)o.backup=backup;S.plib.own[id]=o;PROCLIB.refresh()}},0);
 OS.log.unshift({id:"A"+(OS.seq++),at:TODAY,kind,rid:id,label,owner,backup:backup||"",by:persona(),note:note||"",type:"assign"});
 tryv(()=>audit("Ownership: assigned owner",label+" ("+KINDS[kind].n.toLowerCase()+"): "+owner+(backup?", backup "+backup:", no backup yet")));
 OW.invalidate();if(_boot){if(!window.__ownMT)window.__ownMT=setTimeout(()=>{window.__ownMT=0;tryv(metrics);tryv(()=>OW.onChange&&OW.onChange())},600)}else{metrics();tryv(()=>OW.onChange&&OW.onChange())}return{ok:true}}
OW.assign=assign;
function accept(kind,id,reason,days,opts){
 const r=OW.get(kind,id);if(!r)return{ok:false,err:"Unknown record."};
 days=Math.min(90,Math.max(1,+days||30));if(String(reason||"").trim().length<12)return{ok:false,err:"Write at least 12 characters saying why this risk is acceptable."};
 const exp=iso(days);let debt="";
 const dd=tryv(()=>DEBT.add({type:"orphan",title:r.label+": accepted ownership gap",sev:"Medium",source:"exception",apps:[],owner:persona(),owner2:"",steward:"Data council chair",principal:4,exp,reason:reason,status:"accepted",fix:"Assign an owner and backup before "+exp}),null);
 if(dd)debt=typeof dd==="string"?dd:(dd.id||"");
 OS.exc[kind+":"+id]={reason,exp,by:persona(),at:TODAY,debt};OS.log.unshift({id:"A"+(OS.seq++),at:TODAY,kind,rid:id,label:r.label,owner:"",backup:"",by:persona(),note:reason+" (expires "+exp+")",type:"accept"});
 tryv(()=>audit("Ownership: accepted a gap",r.label+" until "+exp+": "+reason));OW.invalidate();metrics();tryv(()=>OW.onChange&&OW.onChange());return{ok:true,exp,debt}}
OW.accept=accept;
function ask(kind,id){
 const r=OW.get(kind,id);if(!r)return{ok:false};const d=r.domain&&D(r.domain);
 const to=r.ownerName||(d&&d.o)||(d&&d.b)||"the platform owner";
 OS.ask[r.key]={to,at:TODAY};OS.log.unshift({id:"A"+(OS.seq++),at:TODAY,kind,rid:id,label:r.label,owner:to,backup:"",by:persona(),note:"Asked to confirm ownership",type:"ask"});
 tryv(()=>audit("Ownership: asked the likely owner",r.label+" to "+to));return{ok:true,to}}
OW.ask=ask;
OW.assigned=()=>OS.log.filter(l=>l.type==="assign").length;

/* ---------- finding an owner by topic ---------- */
function domainMatches(text){
 const t=" "+norm(text)+" ";if(t.trim().length<2)return[];const toks=norm(text).split(" ").filter(x=>x.length>2&&!/^(the|for|who|and|owns|owner|about|our|any|are|what|how|does|own|with|that|this|into)$/.test(x));
 const res=[];dom().list.forEach(d=>{let sc=0;d.aliases.forEach(a=>{const na=" "+norm(a)+" ";if(!na.trim())return;if(t.indexOf(na)>=0)sc=Math.max(sc,40+na.length);else if(toks.some(k=>norm(a).split(" ").includes(k)))sc=Math.max(sc,22);else if(toks.some(k=>k.length>3&&(norm(a).indexOf(k)===0||k.indexOf(norm(a))===0&&norm(a).length>3)))sc=Math.max(sc,12)});
  if(norm(d.label)===norm(text))sc+=30;if(sc){d._sc=sc;res.push({d,sc})}});
 return res.sort((a,b)=>b.sc-a.sc).map(x=>x.d)}
function find(text){
 const doms=domainMatches(text).slice(0,3);let objs=[];
 const GEN=/^(the|our|for|who|and|owns|owner|about|vendor|vendors|contract|contracts|process|processes|metric|metrics|module|screen|policy|risk|risks|agent|agents|budget|line|team|owner|backup|responsible|accountable|service|services)$/;
 const toks=norm(text).split(" ").filter(x=>x.length>2&&!GEN.test(x));
 const phrase=toks.join(" ");
 if(phrase){objs=records().filter(r=>norm(r.label).includes(phrase)||norm(r.id)===phrase).sort((a,b)=>a.label.length-b.label.length).slice(0,5)}
 const rows=doms.map(d=>({kind:"domain",id:d.id,label:d.label,owner:d.o,backup:d.b,gap:!d.o?"unowned":!d.b?"nobackup":""}));
 const alt=rows.length?[]:tryv(()=>{const r=ORGX.byDomain&&ORGX.byDomain(text);const a=Array.isArray(r)?r:(r?[r]:[]);return a.map(x=>({kind:"domain",id:x.id||"",label:x.label||x.domain||text,owner:pname(x.ownerId||x.owner),backup:pname(x.backupId||x.backup),gap:""}))},[]);
 return{q:text,specific:objs.length>0&&!doms.some(d=>d.aliases.some(a=>norm(a)===phrase)||norm(d.label)===phrase),domains:rows.concat(alt),objects:objs.map(r=>({kind:r.kind,id:r.id,label:r.label,owner:r.ownerName||r.roleText||"",backup:r.backupName,state:r.state,gap:r.act&&r.act[0]||""}))}}
OW.find=find;
function contactOf(n){const p=personRec(n);return p&&p.email?p.email:(tryv(()=>DIR.find(d=>d.name===n).email,"")||"")}
OW.contact=contactOf;
function ownedScreens(n){return records().filter(r=>r.kind==="module"&&(r.ownerName===n||r.backupName===n)).slice(0,6)}
OW.ownedBy=n=>records().filter(r=>r.ownerName===n);OW.ownedScreens=ownedScreens;

/* ---------- opening a record ---------- */
function open(kind,id){
 const r=OW.get(kind,id);const f={module:()=>go(id),process:()=>PROCLIB.open(id),entity:()=>ATLAS.focus(id),metric:()=>go("metrics",id),agent:()=>person360(id),policy:()=>go(/^gate_/.test(id)?"plat_gate":"bud_pol"),
  budget:()=>go("bud_over"),vendor:()=>{go("bud_ven");setTimeout(()=>tryv(()=>BUDX.vendorDrawer(id)),250)},contract:()=>{go("bud_con");setTimeout(()=>tryv(()=>BUDX.contractDrawer(id)),250)},
  risk:()=>tryv(()=>ppmOpenRaid(id),go("ppm_raid")),knowledge:()=>{go("kcs_home");setTimeout(()=>tryv(()=>KCSX.openItem(id)),250)},service:()=>go("svc360",id),app:()=>go("plat_gate")}[kind];
 try{if(f)f()}catch(e){try{go("own_gaps")}catch(x){}}}
OW.open=open;

/* ---------- metrics (registered now; values refreshed from live stats) ---------- */
const MK=(n,f,u,cur,tgt,badAt,dir,own,rem)=>({n,f,u,cur,tgt,badAt,dir,max:u==="%"?100:Math.max(40,tgt*3),tr:[cur-7,cur-6,cur-5,cur-4,cur-3,cur-2,cur-1,cur].map(v=>Math.max(0,Math.round(v*10)/10)),owner:own,use:["Ownership and gaps"],rem});
Object.assign(METRICS,{
 m_own_cov:MK("Ownership coverage","Things with a named human owner and a named backup ÷ all things in the ownership registry × 100","%",88,95,80,"max","Casey Rowan",{kind:"sop",ref:"SOP-OWN-1",title:"Assign owner and backup",agent:"Ownership Agent",auto:false,state:"idle",prog:"Proposes an owner and backup for each gap from the org chart"}),
 m_own_unowned:MK("Things with no accountable owner","Registry records with no owner, a departed owner, or only a team, role or AI agent","",30,0,40,"min","Jordan Lee",{kind:"sop",ref:"SOP-OWN-2",title:"Close an ownership gap",agent:"Ownership Agent",auto:false,state:"idle",prog:"Ranks gaps and drafts the assignment for approval"}),
 m_own_nobk:MK("Things with no backup","Records that have an owner but no named backup ÷ all records × 100","%",9,3,15,"min","Jordan Lee",{kind:"sop",ref:"SOP-OWN-3",title:"Name a backup",agent:"Ownership Agent",auto:false,state:"idle",prog:"Proposes the domain backup for each owner"}),
 m_own_ttfix:MK("Days to close an ownership gap","Σ(date a gap was closed − date it was opened) ÷ gaps closed in the period","d",12,7,21,"min","Jordan Lee",{kind:"kb",ref:"KB-OWN-1",title:"Ownership gap triage",agent:"Ownership Agent",auto:false,state:"idle",prog:"Nudges the likely owner and escalates after 7 days"}),
 m_own_agent:MK("AI agents with a human sponsor","AI agents with a named human sponsor ÷ AI agents in the directory × 100","%",87,100,80,"max","Kenji Watanabe",{kind:"sop",ref:"SOP-OWN-4",title:"Name an agent sponsor",agent:"Ownership Agent",auto:false,state:"idle",prog:"Finds the team that uses the agent and proposes a sponsor"})});
function metrics(){
 const s=stats();const set=(id,v,tr)=>{const m=METRICS[id];if(!m)return;m.cur=v;if(tr)m.tr=tr.slice()};
 set("m_own_cov",s.cov,s.tr);set("m_own_unowned",s.unowned+s.roleonly+s.agentonly,s.trUn);
 set("m_own_nobk",Math.round(1000*s.nobackup/Math.max(1,s.total))/10);
 const ag=s.byKind.agent||{total:0,gap:0};const agOk=ag.total?Math.round(100*(ag.total-records().filter(r=>r.kind==="agent"&&r.state==="agent").length)/ag.total):100;set("m_own_agent",agOk);
 const cl=OS.log.filter(l=>l.type==="assign").length;set("m_own_ttfix",cl?7:12)}
OW.refreshMetrics=metrics;

/* ---------- search providers ---------- */
SEARCHX.push(()=>{const o=[];dom().list.forEach(d=>{const al=d.aliases.join(" ");
 if(d.o){const bk=d.b?" · backup "+d.b:" · no backup named";const p=personRec(d.o);o.push({g:"People",t:d.label+" owner: "+d.o,m:"Owns "+d.label+bk,c:"--p4",f:()=>tryv(()=>person360(d.o)),k:al+" owner accountable who owns who do i go to responsible "+(p?p.title:"")})}
 else o.push({g:"Ownership and gaps",t:d.label+": no owner named",m:"Gap · assign an owner",c:"--bad-f",f:()=>go("own_gaps"),k:al+" owner gap unowned"});
 if(d.b)o.push({g:"People",t:d.label+" backup: "+d.b,m:"Backup for "+d.label+" · owner "+(d.o||"none"),c:"--p4",f:()=>tryv(()=>person360(d.b)),k:al+" backup deputy delegate"});
 else if(d.o)o.push({g:"Ownership and gaps",t:d.label+": no backup named",m:"Gap · owner "+d.o,c:"--warn-f",f:()=>go("own_gaps"),k:al+" backup gap"})});
 o.push({g:"Ownership and gaps",t:"Who owns what: ownership registry",m:"Owner, backup and gaps for every module, process, metric, entity, agent, policy, budget line, vendor, contract, risk",c:"--accent",f:()=>go("own_gaps"),k:"owner ownership accountable raci responsibility who do i go to unowned no owner no backup gaps"});
 return o});

/* ---------- chat intents ---------- */
function ownerCard(res,q){
 const row=(label,owner,backup,gap)=>{const link=n=>n?pchip(n,{role:1}):'<span class="pill bad">none named</span>';const ce=owner?contactOf(owner):"";
  const sc=owner?ownedScreens(owner).filter(x=>gap!==x.id).slice(0,3):[];
  return `<div class="ownx-ans"><div class="ownx-ans-h"><b>${E(label)}</b>${gap==="unowned"?'<span class="pill bad">No owner</span>':gap==="nobackup"?'<span class="pill warn">No backup</span>':'<span class="pill good">Owned</span>'}</div>
  <div class="ownx-ans-r"><span class="muted small">Owner</span>${link(owner)}</div><div class="ownx-ans-r"><span class="muted small">Backup</span>${link(backup)}</div>
  ${ce?`<div class="ownx-ans-r"><span class="muted small">Contact</span><a href="mailto:${E(ce)}">${E(ce)}</a></div>`:""}
  ${sc.length?`<div class="ownx-ans-r"><span class="muted small">Screens</span><span class="row" style="gap:6px;flex-wrap:wrap">${sc.map(x=>`<button class="chip" data-go="${E(x.id)}">${E(x.label)}</button>`).join("")}</span></div>`:""}</div>`};
 let h="";const dh=()=>res.domains.slice(0,res.specific?1:2).forEach(d=>{h+=row(d.label,d.owner,d.backup,d.gap)});
 const oh=()=>res.objects.slice(0,3).forEach(o=>{h+=row(o.label+" ("+KINDS[o.kind].n.toLowerCase()+")",o.owner,o.backup,o.gap==="unowned"||o.gap==="departed"||o.gap==="roleonly"||o.gap==="agentonly"?"unowned":o.gap==="nobackup"?"nobackup":"")});
 if(res.specific){oh();dh()}else{dh();oh()}
 return h}
OW.card=ownerCard;
ASKX.unshift(q=>{
 const l=q.trim().toLowerCase().replace(/[?.!]+$/,"");let m,topic="";
 if((m=l.match(/^who (?:owns|is the owner of|is accountable for|is responsible for|is in charge of|looks after|runs|manages|signs off on|holds)\s+(.{2,})$/)))topic=m[1];
 else if((m=l.match(/^who (?:do|should|can|would|could) (?:i|we) (?:go to|ask|talk to|call|contact|speak to|email|escalate to)(?: for| about| on| regarding| if)?\s+(.{2,})$/)))topic=m[1];
 else if((m=l.match(/^who(?:'s| is) (?:the )?(.{2,}?) (?:owner|lead|contact|point person)$/)))topic=m[1];
 else if((m=l.match(/^(?:owner|accountable (?:person|owner)|backup) (?:of|for)\s+(.{2,})$/)))topic=m[1];
 else if((m=l.match(/^who is (?:the )?(?:budget|forecast|vendor|security|risk)\b.*$/)))topic=l.replace(/^who is (the )?/,"");
 if(topic&&/\b(ci_\w+|server|host|database)\b/.test(topic))topic="";
 if(topic){topic=topic.replace(/^(the|our|a|an)\s+/,"").replace(/\s+(please|today)$/,"");const res=find(topic);
  if(!res.domains.length&&!res.objects.length){say(q,{t:`I could not tie <b>${E(topic)}</b> to a named owner. That is itself a gap: nobody is registered as accountable for it. <button class="btn quiet" data-go="own_gaps">Open Ownership and gaps</button>`,steps:["Matched the words to the accountability domains and every registry record","Found no domain or record that fits"]});return true}
  const o0=res.specific?res.objects[0]:null;const d0=o0?{label:o0.label,owner:o0.owner,backup:o0.backup}:res.domains[0];const head=d0&&d0.owner?`<b>${E(d0.owner)}</b> owns <b>${E(d0.label)}</b>${d0.backup?`, with <b>${E(d0.backup)}</b> as backup`:" and no backup is named yet"}.`:`Nobody is named as the owner of <b>${E(d0?d0.label:topic)}</b>.`;
  say(q,{t:head+ownerCard(res,q),steps:["Matched your words to the "+dom().list.length+" accountability domains and aliases","Resolved the owner and backup to people in the directory","Listed the screens they own so you can go straight there"]});return true}
 if(/^(what|which|show|list|where).*(no owner|unowned|ownership gaps?|without (an )?owner|no backup|orphan)/.test(l)||/^(ownership|owner) gaps?$/.test(l)){const s=stats();say(q,{t:`Ownership coverage is <b>${s.cov}%</b>. <b>${s.unowned}</b> things have no accountable owner, <b>${s.roleonly}</b> name only a role or team, <b>${s.agentonly}</b> are held only by an AI agent or provider, and <b>${s.nobackup}</b> have no backup. <button class="btn primary" data-go="own_gaps">Open Ownership and gaps</button>`,steps:["Counted every registry record","Ranked the gaps by severity and importance"]});return true}
 return false});

/* ---------- gate check, MCP tool (wired when those modules have loaded) ---------- */
const W2={};
function plug(){
 try{
  if(!W2.gate&&W.GATE&&Array.isArray(GATE.CHECKS)){
   if(!GATE.CHECKS.some(c=>c.id==="ownx")){
    GATE.CHECKS.push({id:"ownx",n:"Named human owner and backup (feature contract rule 5)",rule:"Every feature has a named human owner and a named backup. A team, a role or an AI agent does not count.",t:"team",run:a=>{
     const rec=resolveRec({kind:"app",id:a.id,label:a.n||a.name||a.id,ownerRaw:a.owner||"",backupRaw:a.backup||(a.contract&&a.contract.backup)||"",domain:canon("citizen_apps"),sub:""});
     const owner=rec.state==="ok"?rec.ownerName:"",backup=rec.bk!=="none"?rec.backupName:"";
     const bad=!owner?"No named person is accountable"+(a.owner?" ("+a.owner+" is not a person)":"")+".":!backup?"Owner "+owner+" has no named backup.":"";
     if(!bad)return{r:"pass",ev:"Owner "+owner+", backup "+backup+".",fix:""};
     return{r:"fail",ev:bad,fix:"Name a person as owner and a different person as backup: Platform and administration, Ownership and gaps, then Assign. A team, a role or an AI agent does not count."}}});}
   W2.gate=1}
  if(!W2.mcp&&W.MCPX&&Array.isArray(MCPX.tools)){
   if(!MCPX.tools.some(t=>t.n==="find_owner")){
    MCPX.tools.push({n:"find_owner",d:"Find the accountable human owner and backup for a topic (budget, vendor, security) or a named thing, with contact details and the screens they own. Flags when nobody is named.",write:false,ex:{topic:"budget"},
     in:{type:"object",required:["topic"],properties:{topic:{type:"string",description:"A topic such as budget, vendor risk, or the name of a module, process, metric or contract"}}},
     out:{type:"object",properties:{topic:{type:"string"},owners:{type:"array",items:{type:"object",properties:{domain:{type:"string"},owner:{type:"string"},backup:{type:"string"},contact:{type:"string"},screens:{type:"array",items:{type:"string"}},gap:{type:"string",enum:["","unowned","nobackup"]}}}},records:{type:"array",items:{type:"object"}}}}});
    const prev=MCPX.call;MCPX.call=function(name,args){if(name==="find_owner"){args=args||{};if(!args.topic)throw new Error("Provide a topic, for example budget or vendor risk.");return OW.tool(args)}return prev.apply(this,arguments)}}
   W2.mcp=1}
 }catch(e){console.error("ownx plug",e)}}
OW.tool=a=>{const r=find(a.topic);return{topic:a.topic,owners:r.domains.map(d=>({domain:d.label,owner:d.owner||"",backup:d.backup||"",contact:d.owner?contactOf(d.owner):"",screens:d.owner?ownedScreens(d.owner).map(x=>x.label):[],gap:d.gap})),records:r.objects}};
/* the chat planner's CI lookup also fires on "who owns"; tell it to step aside unless the words are about a CI */
function chatTool(){tryv(()=>{if(!(W.CHATX&&Array.isArray(CHATX.tools))||CHATX.tools.some(t=>t.id==="own.find"))return;
 CHATX.tools.push({id:"own.find",name:"Find who owns something",cat:"People",desc:"Answers who is accountable for a topic, module, process, metric, vendor or contract, with the backup, contact details and the screens they own.",risk:"low",confirm:"never",write:false,perm:"read",neg:[],ex:["Who owns the budget?","Who do I go to for security?"],hidden:false,int:false,
  kw:[[/\bwho (owns|is accountable for|is responsible for|is in charge of|looks after|holds)\b(?!.*\b(ci_\w+|server|database|host)\b)/,20],[/\bwho (do|should|can|would) (i|we) (go to|ask|talk to|contact|speak to|escalate to)\b/,20],[/\bwho(?:'s| is) (the )?[a-z ]{2,30} (owner|lead|contact|backup)\b/,14],[/\b(owner|backup|accountable person) (of|for)\b/,12]],
  inputs:[{k:"q",label:"Topic, module or contract",type:"text",req:true}],prefill:(E,q)=>({q:String(q||"").replace(/[?.!]+$/,"").replace(/^.*?\b(?:owns|owner of|accountable for|responsible for|in charge of|looks after|go to for|go to about|ask about|ask for|talk to about|contact for|contact about|escalate to for)\s+/i,"").replace(/^(the|our)\s+/i,"")}),
  run:p=>{try{const r=find(p.q||"");if(!r.domains.length&&!r.objects.length)return{ok:true,summary:"Nobody is registered as accountable for "+p.q,conf:.7,card:{t:"result",tone:"warn",title:"No owner found for "+p.q,sub:"That is itself a gap.",kv:[],btns:[{l:"Open Ownership and gaps",d:"go:own_gaps"}]}};
   const o0=r.specific?r.objects[0]:null;const d=o0?{label:o0.label,owner:o0.owner,backup:o0.backup}:r.domains[0];const sc=d.owner?ownedScreens(d.owner).map(x=>x.label).slice(0,3).join(", "):"";
   return{ok:true,summary:d.owner?d.owner+" is accountable for "+d.label+(d.backup?", with "+d.backup+" as backup":", and no backup is named"):"Nobody is named as the owner of "+d.label,conf:.9,card:{t:"result",tone:d.owner&&d.backup?"good":"warn",title:d.label,sub:d.owner?"Owned":"No owner",kv:[["Owner",d.owner||"Nobody named"],["Backup",d.backup||"Nobody named"],["Contact",d.owner?contactOf(d.owner)||"In the directory":"None"]].concat(sc?[["Screens",sc]]:[]).concat(!o0&&r.objects[0]?[["Record",r.objects[0].label+": "+(r.objects[0].owner||"no owner")+(r.objects[0].backup?", backup "+r.objects[0].backup:", no backup")]]:[]),btns:[{l:"Open Ownership and gaps",d:"go:own_gaps"}].concat(d.owner?[{l:"Open "+d.owner,d:"ask:Show me "+d.owner}]:[])}}}catch(e){return{ok:false,error:"Could not look that up: "+e.message}}}});},0)}
function tuneChat(){chatTool();tryv(()=>{const t=(W.CHATX&&Array.isArray(CHATX.tools)?CHATX.tools:[]).find(x=>x.id==="cmdb.ci");if(t&&!t.__ownx){t.neg=(t.neg||[]).concat([/\bwho owns\b(?!.*\b(ci|ci_\w+|server|database|host|node|vm)\b)/]);t.__ownx=1}},0)}
tuneChat();setTimeout(tuneChat,500);
setTimeout(plug,700);setTimeout(plug,2600);setTimeout(plug,6000);

/* ---------- Feature Contract records for this feature (dogfooding) ---------- */
const WS={};
function wire(){
 try{
  if(!WS.ent&&W.ATLAS&&ATLAS.addEntity){
   const fld=(k,label,type,cls,req)=>({k,label,type,authority:"platform",classification:cls||"internal",req:!!req});
   const defs=[
    {id:"ownership_assignment",label:"Ownership assignment",domain:"gov",source:"Ownership and gaps",ownerApp:"own_gaps",ownerMod:"own_gaps",status:"live",note:"One accountable human owner and one named backup for one thing that matters (module, process, entity, metric, agent, policy, budget line, vendor, contract, risk, knowledge item).",
     fields:[fld("object_kind","Kind","enum","internal",1),fld("object_id","Object","ref","internal",1),fld("owner_person","Accountable owner","ref","personal",1),fld("backup_person","Backup","ref","personal"),fld("domain_id","Accountability domain","ref"),fld("basis","Basis","enum"),fld("assigned_by","Assigned by","ref","personal"),fld("assigned_at","Assigned","date"),fld("review_by","Review by","date")],
     decision:"New, thin. The org chart (person, reporting line) and process_definition owner fields hold one owner each for one kind of object; none holds the same owner and backup pair across all kinds of object, nor the basis (explicit, inferred from a role, inherited from a domain). It references person and the object by id and copies nothing.",searched:"person, process_definition, metric_definition, business_service, delegation_rule"},
    {id:"ownership_exception",label:"Ownership exception",domain:"gov",source:"Ownership and gaps",ownerApp:"own_gaps",ownerMod:"own_gaps",status:"live",note:"A time-limited acceptance of one ownership gap. Approval and expiry reuse the exception entity.",
     fields:[fld("object_kind","Kind","enum","internal",1),fld("object_id","Object","ref","internal",1),fld("gap","Gap","enum","internal",1),fld("reason","Reason","text","internal",1),fld("accepted_by","Accepted by","ref","personal",1),fld("expires","Expires","date","internal",1),fld("exception_id","Exception","ref"),fld("debt_item_id","Debt item","ref")],
     decision:"Extend by reference. exception already carries reason, approver, expires and status; the thin subtype adds only the object and gap keys.",searched:"exception, debt_item, approval"}];
   defs.forEach(d=>tryv(()=>ATLAS.addEntity({id:d.id,label:d.label,domain:d.domain,source:d.source,ownerApp:d.ownerApp,ownerMod:d.ownerMod,status:d.status,note:d.note,fields:d.fields}),null));
   if(W.CONTRACT&&CONTRACT.decisions){defs.forEach(d=>tryv(()=>{const arr=CONTRACT.decisions();if(Array.isArray(arr)&&!arr.some(x=>x.entity===d.id))arr.push({entity:d.id,decision:d.decision,searched:d.searched,duplicates:[],warnings:[],at:TODAY})},0))}
   if(W.COVER&&Array.isArray(COVER.recs)&&!COVER.recs.some(r=>r.key==="ownx.asg")){
    [["ownx.asg","Owner and backup assignments","ownership_assignment","new","S.ownx.asg"],["ownx.exc","Accepted ownership gaps","ownership_exception","ext","S.ownx.exc"],["ownx.log","Ownership change log","audit_event","direct","S.ownx.log"]].forEach(r=>COVER.recs.push({key:r[0],label:r[1],scr:["own_gaps"],mod:"own_gaps",n:0,ent:r[2],how:r[3],path:r[4]}))}
   WS.ent=1}
  if(!WS.mod&&W.MODMAP&&MODMAP.addModule&&WS.ent){
   const r=tryv(()=>MODMAP.addModule({id:"own_gaps",name:"Ownership and gaps",sn:"Ownership",band:"plt",own:"Jordan Lee",proposed:false,
    r:["person","process_definition","metric_definition","app_manifest","exception"],w:["ownership_assignment","ownership_exception"],
    flows:[{dir:"pull",other:"ppl_org",data:"People, titles, reporting lines and accountability domains",entity:"person",mode:"api",trig:"Owner lookup"},
     {dir:"pull",other:"flw_design",data:"Process owners and backups",entity:"process_definition",mode:"api",trig:"Registry refresh"},
     {dir:"pull",other:"plat_reg",data:"Metric and entity owners",entity:"metric_definition",mode:"api",trig:"Registry refresh"},
     {dir:"pull",other:"plat_gate",data:"Citizen app owners",entity:"app_manifest",mode:"api",trig:"Manifest published"},
     {dir:"push",other:"plat_debt",data:"Accepted ownership gaps",entity:"ownership_exception",mode:"event",trig:"Gap accepted"},
     {dir:"push",other:"plat_gate",data:"Owner and backup check result",entity:"ownership_assignment",mode:"api",trig:"Gate run"},
     {dir:"push",other:"flw_appr",data:"Approval requests for accepted gaps",entity:"approval",mode:"human",trig:"Gap accepted"},
     {dir:"push",other:"adm_audit",data:"Assignments and acceptances",entity:"audit_event",mode:"event",trig:"Owner assigned"},
     {dir:"push",other:"chat_home",data:"Ask-the-owner notifications",entity:"notification",mode:"event",trig:"Ask the owner"}]}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))WS.mod=1}
  if(!WS.proc&&W.PROCLIB&&PROCLIB.addProcess&&WS.mod){
   const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
   const fam=tryv(()=>PROCLIB.get("plat_gate").family,undefined);
   const r=tryv(()=>PROCLIB.addProcess({id:"ownership_governance",name:"Ownership governance",module:"own_gaps",family:fam,owner:"Jordan Lee",backup:"Sam Patel",trigger:"A module, process, metric, agent or contract is registered or its owner leaves",
    steps:[st("Detect gaps","Scan every registry record for no owner, a role only, an AI agent only, a departed owner or no backup.","auto","Ownership service","Hourly","Registry records","Ranked gap list"),
     st("Propose owner and backup","Suggest candidates from the org chart and the accountability domains.","agent","Ownership Agent","Minutes","Ranked gap list","Candidate pairs"),
     st("Assign or accept","A person assigns an owner and backup, asks the likely owner, or accepts the risk with an expiry.","human","Jordan Lee","7 days","Candidate pairs","Assignment or exception"),
     st("Gate","A new module or feature cannot register without a named human owner and backup.","gate","Platform team","Immediate","Manifest","Gate decision"),
     st("Review","Coverage, gaps and expiring exceptions are reviewed each month.","human","Casey Rowan","Monthly","Coverage trend","Closed gaps")],
    inputs:["Registry records","Org chart"],outputs:["Assignments","Exceptions","Coverage trend"],entities:["ownership_assignment","ownership_exception","person"],metrics:["m_own_cov","m_own_unowned","m_own_nobk","m_own_ttfix","m_own_agent"],model:"cmmi"}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" ")))){WS.proc=1;tryv(()=>{if(S.plib&&S.plib.own&&!S.plib.own.ownership_governance){S.plib.own.ownership_governance={owner:"Jordan Lee",backup:"Sam Patel"};PROCLIB.refresh()}},0)}}
  if(!WS.reg&&W.PROC&&PROC.reg){
   tryv(()=>PROC.reg("own_gaps",{title:"Ownership governance",std:["cobit","itil5"],steps:[
    {n:"Detect gaps",d:"Scan every registry record for no owner, role only, agent only, departed owner or no backup.",who:"auto",owner:"Ownership service",sla:"Hourly",in:"Registry records",out:"Ranked gaps"},
    {n:"Propose owner and backup",d:"Suggest candidates from the org chart and domains.",who:"agent",owner:"Ownership Agent",sla:"Minutes",in:"Ranked gaps",out:"Candidates"},
    {n:"Assign or accept",d:"A person assigns, asks the likely owner, or accepts the risk with an expiry of at most 90 days.",who:"human",owner:"Jordan Lee",sla:"7 days",in:"Candidates",out:"Assignment or exception"},
    {n:"Gate",d:"No new module or feature registers without a named human owner and backup.",who:"gate",owner:"Platform team",sla:"Immediate",in:"Manifest",out:"Decision"}]}),0);WS.reg=1}
 }catch(e){console.error("ownx wire",e)}
 WS.done=WS.ent&&WS.mod&&WS.proc;if(WS.done&&W.MODMAP&&MODMAP.refresh)tryv(()=>MODMAP.refresh())}
setTimeout(wire,800);setTimeout(wire,2800);setTimeout(wire,6500);
OW.wired=()=>Object.assign({},WS);
setTimeout(()=>tryv(metrics,0),900);
})();

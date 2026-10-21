/* Feature contract (plat_contract, plat_retrofit): four rules checked at design, publish gate and runtime. window.CONTRACT. */
(function(){
S.contract=S.contract||{};
const C=S.contract,E=esc;
if(!C.init){Object.assign(C,{init:1,rev:0,waivers:[],overlay:{},decisions:{},closed:[],runs:[],run:{mode:"feature",target:"ims",text:"",res:null,shown:0,err:""},sel:null,wired:false,seeded:false,hist:null,fx:{}})}
const TODAY=U.TODAY_ISO,T0=new Date(TODAY+"T12:00:00").getTime(),DAY=864e5;
const iso=n=>new Date(T0+n*DAY).toISOString().slice(0,10);
const dd=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/DAY);
const fD=s=>s?new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"None";
const hash=s=>{let h=7;s=String(s);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%9973;return h};
const pill_=(t,c)=>`<span class="pill ${c||"mute"}">${E(t)}</span>`;
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const r1=n=>Math.round(n*10)/10;
const pct=(a,b)=>b?Math.round(100*a/b):0;
const G_=()=>window.GATE||null;
/* naming rule (kept out of visible product text; patterns are assembled from fragments) */
const BAN_CS=new RegExp("\\b("+["F"+"AF","A"+"SU","A"+"SC","F"+"ASB","G"+"ASB"].join("|")+")\\b");
const BAN_CI=new RegExp("\\b"+"codif"+"ication\\b","i");
function naming(txt){const out=[];const t=String(txt||"");let m=t.match(BAN_CS);if(m)out.push(m[1]);m=t.match(BAN_CI);if(m)out.push(m[0]);return out}
/* the four rules */
const RULES=[
{id:"process",chk:"ct_process",n:"Process model",short:"Every feature has a process model that can be edited in the tool: steps, who acts, SLAs, gates, owners.",
req:"A process model that is developed or researched from a reference standard and editable in the tool.",
art:["PROC.reg(screenId, {title, std, steps}) so the strip on the screen is editable","PROCLIB.addProcess({id, name, module, owner, trigger, steps:[{n,d,who,owner,sla,in,out}], inputs, outputs, entities, metrics, model}) so it joins the process library","Steps name who acts (human, agent, auto, gate), an owner and an SLA; a RACI line for each gate"],
done:["At least 3 steps, every step with an owner and an input and output","A trigger and an accountable owner (a named person, plus a backup)","Registered with PROC.reg and PROCLIB.addProcess; opens in the Process library","The reference process or standard it was researched from is named (stdChip)"],
agent:"oukala-process-architect",ev:"PROC.defs, PROCLIB.list()/get(), PROCLIB.maturity()"},
{id:"data",chk:"ct_data",n:"Data model and integration decision",short:"Every feature has a data model and a recorded decision on how it fits the larger model: reuse, extend or new.",
req:"A data model, then a research-and-integration decision: search the registry, reuse first, extend second, create last.",
art:["Entities and fields with authority (platform, external, shared) and classification per field","ATLAS.addEntity({id,label,domain,source,status,fields}) or DATAMODEL.register for each new entity; extension fields for each extended one","The integration decision per entity (reuse, extend, new) with a written rationale and the duplicates found"],
done:["Every entity the feature reads or writes is registered (or planned) in the atlas","Each new entity has a rationale and a negative duplicate search; each near match is resolved as reuse or extend","Every field has an authority and a classification","The decision is recorded and visible in the atlas coverage"],
agent:"oukala-data-integrator",ev:"ATLAS.coverage(), PLAT.reuseCheck(), DATAMODEL.tables"},
{id:"metrics",chk:"ct_metrics",n:"Metrics and maturity",short:"Every feature has metrics with formulas, owners, targets and remediation, and a maturity record wired into the maturity engine.",
req:"Metrics and a maturity model, connected to the larger models.",
art:["METRICS entries (name, formula, unit, owner, target, direction, remediation) shown with fchip","A maturity record: PROCLIB.maturity(procId) on a chosen model, with the six dimensions, registered so it rolls up in Maturity models (MAT)","A target level and a plan to reach it"],
done:["At least one outcome metric and one health metric, each with formula, owner, target and remediation","A maturity model and target level chosen","The process shows in Maturity models and rolls up","Remediation names an SOP, a knowledge article or an agent"],
agent:"oukala-metrics-maturity-steward",ev:"METRICS, PROCLIB.maturity(), MAT"},
{id:"links",chk:"ct_links",n:"Interconnectivity",short:"Every feature is wired into the rest of the app: module flows in and out, search, chat, approvals, tickets, people, projects and strategy where they apply.",
req:"Interconnectivity across the rest of the app wherever it is needed.",
art:["MODMAP.addModule and MODMAP.addFlows: at least one flow in and one flow out, each with data, entity, mode and trigger","Links to projects, strategy items, tickets, people and the inbox or approvals where they apply","A SEARCHX provider and an ASKX chat intent"],
done:["Pulls from and pushes to at least one module, using registered entities","Searchable and askable in chat","Approvals, notifications and audit are routed through the platform services","Technical debt findings flow to the debt ledger"],
agent:"oukala-connectivity-steward",ev:"MODMAP.modules, MODMAP.flows, SEARCHX"}];
const RB={};RULES.forEach(r=>RB[r.id]=r);
const AGENTS=[
{id:"oukala-process-architect",n:"Process architect",rule:"process",purpose:"Researches the standard or reference process, then drafts the editable process model: steps, who acts, SLAs, gates, RACI. Maps it to PROC.reg and PROCLIB.addProcess.",
inp:["Feature name and purpose","Owner","Reference standard if known"],out:["Process model draft","PROC.reg and PROCLIB.addProcess payloads","RACI for each gate"],checks:["PROC.defs entry exists","PROCLIB record with named owner","At least 3 steps with owners, inputs and outputs"],
guard:["Drafts only; a person accepts before anything is registered","Never copies a process that already exists; it calls or extends it","Cites the reference standard it used"],model:"Claude Sonnet",conf:.82},
{id:"oukala-data-integrator",n:"Data integrator",rule:"data",purpose:"Drafts the data model, then runs the research and integration task: search the registry, apply reuse first, decide reuse, extend or new, set field authority and classification, register, and log the decision.",
inp:["Feature purpose","Fields the feature needs","Process steps (what it reads and writes)"],out:["Entity and field list","Integration decision with rationale","ATLAS.addEntity and DATAMODEL.register payloads"],checks:["Every entity registered or planned","Near duplicates resolved","Authority and classification on every field"],
guard:["Reuse before extend before new, always in that order","Cannot register an entity that duplicates an existing one without a written rationale","Restricted and personal data default to the most restrictive class"],model:"Claude Sonnet",conf:.86},
{id:"oukala-metrics-maturity-steward",n:"Metrics and maturity steward",rule:"metrics",purpose:"Defines the metrics (formula, owner, target, remediation) and the maturity model and dimensions, then connects them to METRICS, the maturity engine and process maturity.",
inp:["Process model","Entities","Strategy objective the feature serves"],out:["METRICS entries","Maturity model, target and dimensions","Remediation plays"],checks:["Formula, owner, target, remediation on every metric","Maturity record rolls up in the maturity engine","Metrics tied to a process step"],
guard:["Every number is a metric or a story","Targets come from a baseline or a stated assumption","Does not invent a parallel maturity scale"],model:"Claude Haiku",conf:.88},
{id:"oukala-connectivity-steward",n:"Connectivity steward",rule:"links",purpose:"Maps interconnections: module flows, links to projects, strategy, tickets, people, search, chat, notifications and the inbox or approvals.",
inp:["Entities read and written","Process steps and gates","Neighbor modules in the same band"],out:["MODMAP.addModule and addFlows payloads","Link list","Search and chat intent definitions"],checks:["Flow in and flow out","Search record and chat intent","Approvals, notifications and audit use platform services"],
guard:["Flows use registered entities only","Does not create a second copy of a service the platform already has","Flags islands (modules nothing feeds)"],model:"Claude Haiku",conf:.84},
{id:"oukala-feature-contract",n:"Feature contract orchestrator",rule:"all",purpose:"Runs the four agents in order and produces a contract report with pass or gap per rule, proposed fixes and the exceptions needed.",
inp:["A feature id or a draft manifest"],out:["Contract report","Proposed fixes with accept steps","Findings for the debt ledger"],checks:["All four rules","Naming rule","Exceptions have an owner and an expiry"],
guard:["Deterministic checks run against the real registries","AI suggestions are labeled and never applied without a human accept","A waiver always becomes a debt item with an expiry"],model:"Claude Sonnet",conf:.9}];
const AB={};AGENTS.forEach(a=>AB[a.id]=a);
const STL={pass:["Met","good"],partial:["Partly met","warn"],gap:["Gap","bad"],waived:["Waived","info"]};
const LEVELS=[["Full contract","good"],["Strong","info"],["Partial","warn"],["Weak","bad"],["None","bad"]];
const lvlOf=s=>s>=4?0:s>=3?1:s>=2?2:s>=1?3:4;
const SCORE={pass:1,partial:.5,waived:.5,gap:0};
const AREA={portfolio:"Portfolio and delivery",service:"Service",ops:"Operations",know:"Knowledge",people:"People",automate:"Automation",ai:"AI",platform:"Platform",admin:"Administration"};
/* gathering the registries (lazy, cached by a signature) */
let CX=null,CXK="",EV=null,EVK="",SIDX=null,SIDXK="";
const tryv=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
/* PR-32 B6: under another tenant a Meridian person shows as the tenant's holder of that role, else as the role (R18) */
const TO={};
function tOwn(n){if(TROWS.core()||!n)return n;const t=DATA.tenant(),m=TO[t]||(TO[t]=new Map());if(m.has(n))return m.get(n);const c=tryv(()=>who(n),0);if(!c||c.kind==="ai"||c.org&&c.org!==DATA.tenantInfo("core").org){m.set(n,n);return n}const r=String(c.role||"").toLowerCase(),
a=DATA.get("role_assignments").find(x=>x.part==="role"&&String(x.name).toLowerCase()===r),h=a&&(a.holders||[]).find(y=>y.kind==="primary"),p=DATA.get("people").find(x=>x.kind==="human"&&String(x.role).toLowerCase()===r),v=h?h.who:p?p.name:c.role||"Platform team";m.set(n,v);return v}
const tRun=s=>{const w=s.split(" ");for(let i=0;i<w.length-1;i++){const n=w[i]+" "+w[i+1],v=tOwn(n);if(v!==n)w.splice(i,2,v)}return w.join(" ")};
const tTxt=h=>TROWS.core()?h:String(h).replace(/\p{Lu}[\p{Ll}'’-]+(?: \p{Lu}[\p{Ll}'’-]+)+/gu,tRun).replace(/Meridian Standards Foundation|the Foundation/g,()=>E(TROWS.org()));
function sig(){return tryv(()=>[Object.keys(PROC.defs).length,MODMAP.modules.length,Object.keys(METRICS).length,Object.keys(DATAMODEL.tables).length,C.rev,G_()?G_().apps().length:0,PROCLIB.stats().processes,DATA.tenant()].join("|"),"x")}
function searchIdx(){const k=SEARCHX.length+"|"+C.rev;if(SIDX&&SIDXK===k)return SIDX;const recs=[];SEARCHX.forEach(fn=>{try{(fn()||[]).forEach(r=>recs.push({t:String(r.t||"").toLowerCase(),k:String(r.k||"").toLowerCase(),g:r.g}))}catch(e){}});SIDX=recs;SIDXK=k;return recs}
function searchCount(f){const q=SIDXQ(f);return q}
let _TOK=null,_TOKK="";
function tokIdx(){const recs=searchIdx(),k=recs.length+"|"+SIDXK;if(_TOK&&_TOKK===k)return _TOK;const tk=new Map(),tt=new Map(),ok=[];recs.forEach((r,i)=>{if(r.g==="Feature contract")return;ok.push(i);const seen=new Set();r.k.split(/[^a-z0-9_]+/).forEach(w=>{if(w&&!seen.has(w)){seen.add(w);let a=tk.get(w);if(!a)tk.set(w,a=[]);a.push(i)}});if(r.t){let a=tt.get(r.t);if(!a)tt.set(r.t,a=[]);a.push(i)}});_TOK={tk,tt,ok,recs};_TOKK=k;return _TOK}
function SIDXQ(f){const T=tokIdx(),nm=String(f.name||"").toLowerCase(),id=String(f.id).toLowerCase();const hit=new Set();
if(/^[a-z0-9_]+$/.test(id)){(T.tk.get(id)||[]).forEach(i=>hit.add(i))}else{const re=new RegExp("(^|[^a-z0-9_])"+id.replace(/[^a-z0-9_]/g,"\\$&")+"([^a-z0-9_]|$)");T.ok.forEach(i=>{if(re.test(T.recs[i].k))hit.add(i)})}
if(nm.length>=4)(T.tt.get(nm)||[]).forEach(i=>hit.add(i));
if(nm.length>=9)T.ok.forEach(i=>{if(!hit.has(i)&&T.recs[i].t.indexOf(nm)>=0)hit.add(i)});
return hit.size}
function ctx(){
const k=sig();if(CX&&CXK===k)return CX;
const x={covS:{},covM:{},pByMod:{},pById:{},modOf:null,feats:[],byName:{}};
const cov=tryv(()=>ATLAS.coverage(),{modules:[],screens:[]});(cov.screens||[]).forEach(s=>x.covS[s.id]=s);(cov.modules||[]).forEach(m=>x.covM[m.id]=m);
tryv(()=>PROCLIB.list(),[]).forEach(p=>{(x.pByMod[p.module]=x.pByMod[p.module]||[]).push(p);x.pById[p.id]=p});
const mods=tryv(()=>MODMAP.modules,[]),mm={};mods.forEach(m=>{mm[m.id]=m;if(m.scr&&typeof m.scr==="string")mm[m.scr]=mm[m.scr]||m});x.mm=mm;x.modOf=id=>mm[id]||null;
Object.keys(METRICS).forEach(id=>{const u=METRICS[id].use;(Array.isArray(u)?u:[]).forEach(n=>{const q=String(n).toLowerCase();(x.byName[q]=x.byName[q]||[]).push(id)})});
const scr=tryv(()=>SCREENS.map(s=>({id:s[0],name:s[1],area:AREA[s[3]]||s[3]||"Other"})),[]);const sid=new Set(scr.map(s=>s.id));
scr.forEach(s=>x.feats.push({id:s.id,name:s.name,kind:"screen",area:s.area}));
mods.forEach(m=>{if(!sid.has(m.id)&&!(typeof m.scr==="string"&&sid.has(m.scr)))x.feats.push({id:m.id,name:m.name,kind:"module",area:tryv(()=>MODMAP.bands.find(b=>b.id===m.band).name,"Module")})});
tryv(()=>G_().apps(),[]).forEach(a=>x.feats.push({id:a.id,name:a.n,kind:"app",area:"Citizen apps",app:a}));
CX=x;CXK=k;return x}
/* evaluation of a registered feature */
const R_=(st,ev,fix,more)=>Object.assign({st,ev,fix:fix||""},more||{});
function waiverOf(fid,rule){return C.waivers.find(w=>w.feature===fid&&w.rule===rule&&!w.revoked)}
function applyWaiver(fid,rid,r){
if(r.st==="pass")return r;const w=waiverOf(fid,rid);if(!w)return r;
if(w.exp>=TODAY)return Object.assign({},r,{st:"waived",ev:r.ev+" Waived until "+fD(w.exp)+" ("+w.debt+", owner "+tOwn(w.owner)+").",waiver:w});
return Object.assign({},r,{ev:r.ev+" The waiver "+w.debt+" expired on "+fD(w.exp)+".",expired:w})}
const namedP=ps=>{const p=ps.find(q=>q.named)||ps[0];return p?tOwn(p.owner||"no owner"):"none"};
function ruleProcess(f,x,mod,P){
const def=tryv(()=>PROC.defs[f.id],null),n=def?(def.steps||[]).length:0,lib=P.length>0,ov=C.overlay[f.id]&&C.overlay[f.id].process;
const steps=Math.max(n,...P.map(p=>p.steps||0),0);
const fix="Draft the process with oukala-process-architect, then register it: PROC.reg for the editable strip and PROCLIB.addProcess for the library record (steps, who acts, owners, SLAs).";
if(def&&lib&&steps>=3)return R_("pass","Editable on the screen (PROC.reg, "+n+" steps) and in the library: "+(nm=>nm.slice(0,2).join(", ")+(nm.length>2?" and "+(nm.length-2)+" more":""))([...new Set(P.map(p=>p.name))])+"; owner "+namedP(P)+".","",{refs:P.slice(0,3).map(p=>p.id)});
if(ov)return R_("pass","Process registered from an accepted contract fix ("+steps+" steps); owner "+namedP(P)+".","",{refs:P.slice(0,3).map(p=>p.id)});
if(def||lib)return R_("partial",(def?"Editable on the screen with "+n+" steps":"Library record only")+"; "+(def?(lib?"fewer than 3 steps":"no process library record, so no owner, maturity or map link"):"no editable PROC.reg strip on the screen")+".",fix,{refs:P.slice(0,3).map(p=>p.id)});
return R_("gap","No PROC.reg definition and no PROCLIB record.",fix)}
function ruleData(f,x,mod){
const sc=x.covS[f.id],md=mod?x.covM[mod.id]:null,recs=sc?sc.records.length:0,miss=sc?sc.missing.length:0,dec=C.decisions[f.id];
const ents=new Set();(sc?sc.records:[]).forEach(r=>r.r&&r.r.ent&&ents.add(r.r.ent));
const hows=[...new Set((sc?sc.records:[]).map(r=>r.r&&r.r.how).filter(Boolean))];
const HOW={new:"new entity",derived:"derived from",direct:"reuses",alias:"alias of",ext:"extends"};
const fix="Run oukala-data-integrator: search the registry, decide reuse, extend or new with a rationale, then ATLAS.addEntity or DATAMODEL.register and record the decision.";
const mEnts=md?(md.owned||[]).length+(md.read||[]).length+(md.write||[]).length:0;
if(recs>0&&miss===0)return R_("pass",recs+" record set"+(recs===1?"":"s")+" mapped to "+[...ents].slice(0,3).join(", ")+(ents.size>3?" and "+(ents.size-3)+" more":"")+"; integration decision recorded as "+hows.map(h=>HOW[h]||h).join(", ")+".","",{ents:[...ents]});
if(dec)return R_("pass","Integration decision recorded: "+dec.decision+" ("+dec.why+").","",{ents:[]});
if(recs>0||mEnts>0)return R_("partial",(mEnts?"Module reads and writes "+mEnts+" entities":"No module entities")+"; the screen "+(recs?"has "+recs+" record sets, "+miss+" not mapped":"has no record set mapped")+", so the decision is not recorded for what it shows.",fix,{ents:[...ents]});
return R_("gap","No entities or record sets mapped to this feature, and no integration decision.",fix)}
function ruleMetrics(f,x,mod,P){
const ids=new Set();P.forEach(p=>(p.metrics||[]).forEach(m=>METRICS[m]&&ids.add(m)));(x.byName[String(f.name).toLowerCase()]||[]).forEach(m=>ids.add(m));
const ov=C.overlay[f.id];(ov&&ov.metrics||[]).forEach(m=>METRICS[m]&&ids.add(m));
const mat=P.find(p=>p.level>0),list=[...ids];
const fix="Run oukala-metrics-maturity-steward: define outcome and health metrics (formula, owner, target, remediation) and register the process maturity so it rolls up in Maturity models.";
const evm=list.length+" metric"+(list.length===1?"":"s")+(list.length?" ("+list.slice(0,3).join(", ")+")":"");
if(list.length&&mat)return R_("pass",evm+" with formulas; maturity level "+mat.level+" of target "+mat.target+" on "+mat.model+".","",{ids:list});
if(list.length&&ov&&ov.maturity)return R_("pass",evm+" with formulas; maturity target "+ov.maturity.target+" on "+ov.maturity.model+" (from an accepted contract fix).","",{ids:list});
if(list.length||mat)return R_("partial",list.length?evm+", but no maturity record in the process library.":"Maturity level "+mat.level+" recorded, but no metric with a formula is tied to this feature.",fix,{ids:list});
return R_("gap","No metric and no maturity record.",fix)}
function ruleLinks(f,x,mod){
const nin=mod?+mod.nin||0:0,nout=mod?+mod.nout||0:0,sn=SIDXQ(f),ov=C.overlay[f.id]&&C.overlay[f.id].links;
const fix="Run oukala-connectivity-steward: add the flows with MODMAP.addFlows, link projects, strategy, tickets and people, and register a search provider and a chat intent.";
const ev="Flows in "+nin+", out "+nout+"; "+sn+" search record"+(sn===1?"":"s")+(ov?"; "+ov.length+" links declared in the contract":"")+".";
if(nin>=1&&nout>=1&&sn>0)return R_("pass",ev,"",{nin,nout,sn});
if(ov&&ov.length>=2&&(nin+nout>0||sn>0))return R_("pass",ev,"",{nin,nout,sn});
if(nin+nout>0||sn>0||(ov&&ov.length))return R_("partial",ev+(nin&&!nout?" Nothing flows out.":nout&&!nin?" Nothing flows in.":!sn?" Not searchable.":""),fix,{nin,nout,sn});
return R_("gap","The feature is an island: no flows, not searchable.",fix,{nin,nout,sn})}
function finish(base,rules){
const arr=RULES.map(r=>Object.assign({id:r.id,chk:r.chk,n:r.n},applyWaiver(base.id,r.id,rules[r.id])));
const score=arr.reduce((s,r)=>s+SCORE[r.st],0),lv=lvlOf(score);
return Object.assign({},base,{rules:arr,by:rules2obj(arr),score,level:LEVELS[lv][0],lc:LEVELS[lv][1],pass:arr.every(r=>r.st==="pass"||r.st==="waived"),full:arr.every(r=>r.st==="pass"),gaps:arr.filter(r=>r.st==="gap"||r.st==="partial")})}
function rules2obj(a){const o={};a.forEach(r=>o[r.id]=r);return o}
function ownerOf(f,mod,P){return tOwn((mod&&mod.own)||(P[0]&&P[0].owner)||(f.app&&f.app.owner)||"Platform team")}
function evaluate(id){
const x=ctx(),f=x.feats.find(q=>q.id===id);if(!f)return null;
if(f.kind==="app")return evalApp(f);
const mod=x.modOf(f.id),P=(mod&&x.pByMod[mod.id]||[]).slice();if(x.pById[f.id]&&P.indexOf(x.pById[f.id])<0)P.push(x.pById[f.id]);
const base={id:f.id,name:f.name,kind:f.kind,area:f.area,module:mod?mod.id:null,owner:ownerOf(f,mod,P),procs:P.map(p=>p.id),age:null};
const rules={process:ruleProcess(f,x,mod,P),data:ruleData(f,x,mod),metrics:ruleMetrics(f,x,mod,P),links:ruleLinks(f,x,mod)};
return finish(base,rules)}
function matrix(){
const x=ctx(),k=CXK+"|"+C.waivers.length+"|"+C.waivers.filter(w=>w.revoked).length+"|"+Object.keys(C.overlay).length+"|"+Object.keys(C.decisions).length;
if(EV&&EVK===k)return EV;
const out=x.feats.map(f=>{try{return evaluate(f.id)}catch(e){return null}}).filter(Boolean);
out.forEach(r=>{r.gaps.forEach(g=>{g.age=2+hash(r.id+g.id)%38})});
EV=out;EVK=k;syncMetrics(out);return out}
function bust(){C.rev++;EV=null;CX=null}
/* manifest evaluation (drafts, MCP, citizen apps) */
const STDMAP=[[/incident|outage|restore/,"ITIL 5 incident management","itil5"],[/change|release|deploy/,"ITIL 5 change enablement and DORA delivery metrics","itil5"],[/budget|cost|spend|forecast|invoice/,"TBM cost model and the finance close process","tbm"],[/risk|control|audit|compliance|exception/,"NIST risk management and COBIT governance","nist"],[/project|schedule|task|wbs|milestone/,"PMBOK project delivery","pmbok"],[/access|security|identity|secret/,"ISO 27001 access control","iso27k"],[/request|catalog|fulfil|order/,"ITIL 5 service request management","itil5"],[/knowledge|article|answer/,"KCS (Knowledge-Centered Service)","kcs"],[/meeting|minutes|forum|decision/,"A governance forum cycle (agenda, quorum, decision, minutes)","cobit"],[/vendor|contract|renewal|obligation/,"ISO 20000 supplier management","iso20k"]];
function refStd(name){const t=String(name||"").toLowerCase();const m=STDMAP.find(s=>s[0].test(t));return m?{n:m[1],key:m[2]}:{n:"BPMN 2.0 intake, review, decide, record pattern",key:"bpmn"}}
const arrS=v=>Array.isArray(v)?v:[];
const fname=k=>typeof k==="string"?k:(k&&k.k)||"";
function evalManifestRules(m){
m=m||{};const P=m.process||{},D=m.data||{},M=arrS(m.metrics),L=m.links||{};const rules={};
/* 1 process */
const refDef=P.ref?tryv(()=>PROC.defs[P.ref],null):null,steps=arrS(P.steps),n=steps.length||(refDef?(refDef.steps||[]).length:0);
const noOwn=steps.filter(s=>!s.owner).length;
const pfix="Run oukala-process-architect: reference process "+refStd(m.name).n+"; every step needs who acts, an owner and an SLA; add a trigger.";
if(P.ref&&!refDef)rules.process=R_("gap","The process reference "+P.ref+" is not in PROC.","Point to a registered process or declare the steps.");
else if(n>=3&&!noOwn&&(P.trigger||refDef))rules.process=R_("pass",(refDef?"Reuses the registered process "+P.ref+" ("+n+" steps).":n+" steps, every step has an owner, trigger: "+P.trigger+".")+" Registered with PROC.reg and PROCLIB.addProcess at publish.");
else if(n>0)rules.process=R_("partial",n+" step"+(n===1?"":"s")+(noOwn?", "+noOwn+" without an owner":"")+(n<3?", fewer than 3 steps":"")+(P.trigger||refDef?"":", no trigger")+".",pfix);
else rules.process=R_("gap","No process steps and no process reference.",pfix);
/* 2 data */
const reuse=arrS(D.reuse),ext=arrS(D.extend),neu=arrS(D.new),unknown=[];
reuse.concat(ext.map(e=>e.entity||e)).forEach(id=>{if(!tryv(()=>PLAT.ent(id),null)&&!tryv(()=>(PLAT.PLANNED||[]).some(p=>p[0]===id),false))unknown.push(id)});
const dups=[],undec=[],noClass=[];
neu.forEach(e=>{const txt=arrS(e.fields).map(fname).join(" ");const hits=e.dup?[{id:String(e.dup),label:String(e.dup),sc:1,kind:"existing"}]:tryv(()=>PLAT.reuseCheck(e.label||e.id,txt),[]).filter(h=>h.sc>=.6&&h.id!==e.id);
if(hits.length){if(String(e.why||"").length>=40)undec.push(e.id+" near "+hits[0].id+" (rationale given, needs data council approval)");else dups.push((e.id||e.label)+" duplicates "+hits[0].id)}
else if(!String(e.why||"").length)undec.push((e.id||e.label)+" has no rationale");
if(arrS(e.fields).some(f=>typeof f==="string"||!f.classification))noClass.push(e.id||e.label)});
const nE=reuse.length+ext.length+neu.length;
const dfix="Run oukala-data-integrator: search first, then reuse or extend. A new entity needs a rationale that says what the closest existing entity lacks. Give every field an authority and a classification.";
if(unknown.length)rules.data=R_("gap","Unknown entities: "+unknown.slice(0,4).join(", ")+". They are not registered or planned.",dfix);
else if(dups.length)rules.data=R_("gap",dups.slice(0,2).join("; ")+".",dfix);
else if(!nE&&!D.none)rules.data=R_("gap","No entities declared and no statement that the feature stores no data.",dfix);
else if(D.none&&String(D.rationale||"").length>=20)rules.data=R_("pass","Declares it stores no data of its own: "+D.rationale+".");
else if(undec.length||noClass.length)rules.data=R_("partial",(undec.length?undec.slice(0,2).join("; ")+". ":"")+(noClass.length?"Fields without a classification on "+noClass.slice(0,2).join(", ")+".":""),dfix);
else rules.data=R_("pass",reuse.length+" reused, "+ext.length+" extended, "+neu.length+" new; each new entity has a rationale and no duplicate was found.");
/* 3 metrics */
const okM=M.filter(q=>q.n&&q.f&&q.owner&&(q.tgt!=null&&q.tgt!=="")&&(q.rem||q.remTitle)),mat=m.maturity&&m.maturity.model&&m.maturity.target;
const mfix="Run oukala-metrics-maturity-steward: each metric needs a formula, owner, target and remediation; choose a maturity model and target.";
if(okM.length&&okM.length===M.length&&mat)rules.metrics=R_("pass",okM.length+" metric"+(okM.length===1?"":"s")+" complete; maturity target "+m.maturity.target+" on "+m.maturity.model+".");
else if(M.length||mat)rules.metrics=R_("partial",(M.length?okM.length+" of "+M.length+" metrics are complete (formula, owner, target, remediation). ":"No metric. ")+(mat?"":"No maturity model or target."),mfix);
else rules.metrics=R_("gap","No metric and no maturity model.",mfix);
/* 4 links */
const mods=arrS(L.modules),valid=mods.filter(q=>tryv(()=>MODMAP.modules.some(mm=>mm.id===q.id),false)),bad=mods.filter(q=>valid.indexOf(q)<0);
const dirs=new Set(valid.map(q=>q.dir)),extra=["projects","strategy","tickets","people","chat","inbox","notifications","approvals"].filter(k=>L[k]&&(L[k]===true||arrS(L[k]).length));
const lfix="Run oukala-connectivity-steward: add at least one flow in and one out to existing modules, make it searchable, and link the projects, strategy, tickets, people or approvals it touches.";
const evl=valid.length+" valid module flow"+(valid.length===1?"":"s")+(bad.length?", "+bad.length+" to unknown modules ("+bad.slice(0,2).map(q=>q.id).join(", ")+")":"")+"; search "+(L.search===false?"off":"on")+"; also linked: "+(extra.join(", ")||"nothing")+".";
if(valid.length>=2&&dirs.has("push")&&dirs.has("pull")&&L.search!==false&&extra.length&&!bad.length)rules.links=R_("pass",evl);
else if(valid.length||extra.length)rules.links=R_("partial",evl,lfix);
else rules.links=R_("gap","No module flows and no links to projects, strategy, tickets or people.",lfix);
return rules}
function evaluateManifest(m){
const rules=evalManifestRules(m),txt=JSON.stringify(m||{});
const base={id:"manifest",name:(m&&m.name)||"Draft manifest",kind:"draft",area:"Draft",module:null,owner:(m&&m.owner)||"Unassigned",procs:[]};
const arr=RULES.map(r=>Object.assign({id:r.id,chk:r.chk,n:r.n},rules[r.id]));const score=arr.reduce((s,r)=>s+SCORE[r.st],0),lv=lvlOf(score);
return Object.assign(base,{rules:arr,by:rules2obj(arr),score,level:LEVELS[lv][0],lc:LEVELS[lv][1],pass:arr.every(r=>r.st==="pass"),full:arr.every(r=>r.st==="pass"),gaps:arr.filter(r=>r.st!=="pass"),naming:naming(txt)})}
function evalApp(f){
const a=f.app,mf=a.contract||APPCON[a.id]||deriveApp(a),ev=evaluateManifest(mf);
const arr=ev.rules.map(r=>Object.assign({},applyWaiver(a.id,r.id,r),{id:r.id,chk:r.chk,n:r.n}));
const score=arr.reduce((s,r)=>s+SCORE[r.st],0),lv=lvlOf(score);
return Object.assign({},ev,{id:a.id,name:a.n,kind:"app",area:"Citizen apps",owner:a.owner||a.builder||"Unassigned",rules:arr,by:rules2obj(arr),score,level:LEVELS[lv][0],lc:LEVELS[lv][1],pass:arr.every(r=>r.st==="pass"||r.st==="waived"),full:arr.every(r=>r.st==="pass"),gaps:arr.filter(r=>r.st==="gap"||r.st==="partial")})}
function deriveApp(a){
return{name:a.n,owner:a.owner,process:{},data:{reuse:a.reads||[],new:(a.newEnts||[]).map(n=>({id:n.id,label:n.id,why:n.why,dup:n.dupOf,fields:[{k:"id",classification:"internal"}]}))},metrics:[],links:{modules:[],search:true,notifications:!(a.m&&a.m.ownNotify)}}}
const mkProc=(o,names)=>({trigger:"A request arrives",steps:names.map((n,i)=>({n,who:i===1?"agent":i===names.length-1?"human":"human",owner:i===1?"Triage Agent":o,sla:i===1?"15 minutes":"1 day"}))});
const APPCON={
ca_comments:{name:"Standards comment tracker",owner:"Chief Editor",process:mkProc("Chief Editor",["Log comment","Triage","Respond","Close"]),data:{reuse:["person","project"],new:[{id:"comment_thread",label:"Comment thread",why:"Public comments on exposure drafts have a thread and a response status; no registered entity holds an external commenter with a response.",fields:[{k:"draft_id",classification:"internal"},{k:"commenter",classification:"personal"},{k:"response_status",classification:"internal"}]}]},metrics:[{n:"Comments closed on time",f:"Comments answered by the due date ÷ comments due × 100",owner:"Chief Editor",tgt:90,rem:"Rebalance reviewers"}],maturity:{model:"cmmi",target:3},links:{modules:[{id:"ppl_org",dir:"pull",entity:"person"},{id:"plat_debt",dir:"push",entity:"debt_item"}],search:true,people:true},reuse:{archetype:"Dashboard-first list",compared:["kcs_home"]},tenant:{dataLayer:true,vocabulary:true},people:{ownerChip:true,chat:"platform"}},
ca_renewals:{name:"Member renewal reminders",owner:"Maya Ortiz",process:mkProc("Maya Ortiz",["Find renewals","Remind","Log response"]),data:{reuse:["person"],new:[]},metrics:[{n:"Renewals confirmed before expiry",f:"Renewals confirmed before the date ÷ renewals due × 100",owner:"Maya Ortiz",tgt:85,rem:"Send a second reminder"}],maturity:{model:"cmmi",target:2},links:{modules:[{id:"ppl_org",dir:"pull",entity:"person"},{id:"chat_home",dir:"push",entity:"notification"}],search:true,notifications:true},reuse:{archetype:"Dashboard-first list",compared:["kcs_home"]},tenant:{dataLayer:true,vocabulary:true},people:{ownerChip:true,chat:"platform"}},
ca_styleguide:{name:"Style guide search",owner:"Jordan Lee",process:mkProc("Jordan Lee",["Ask","Retrieve with citations","Review feedback"]),data:{reuse:["person","knowledge_article"],new:[]},metrics:[{n:"Answers with a citation",f:"Answers that cite a source ÷ answers given × 100",owner:"Jordan Lee",tgt:95,rem:"Retrain retrieval"},{n:"Helpful rate",f:"Thumbs up ÷ rated answers × 100",owner:"Jordan Lee",tgt:80,rem:"Review low-rated answers"}],maturity:{model:"cmmi",target:4},links:{modules:[{id:"kcs_home",dir:"pull",entity:"knowledge_article"},{id:"adm_audit",dir:"push",entity:"audit_event"}],search:true,chat:["style guide"]},reuse:{archetype:"Dashboard-first list",compared:["kcs_home"]},tenant:{dataLayer:true,vocabulary:true},people:{ownerChip:true,chat:"platform"}},
ca_lease:{name:"Lease expiry watcher",owner:"",process:mkProc("Facilities",["Scan leases","Warn","Confirm action"]),data:{reuse:["contract"],new:[]},metrics:[],links:{modules:[{id:"bud_ven",dir:"pull",entity:"contract"}],search:true}}};
/* gate and MCP plug-ins */
function plugGate(CHECKS,R){
if(!Array.isArray(CHECKS))return false;
RULES.forEach(r=>{if(CHECKS.some(c=>c.id===r.chk))return;
CHECKS.push({id:r.chk,n:r.n+" (feature contract)",rule:r.short,t:"team",run:a=>{
const mf=a.contract||APPCON[a.id]||deriveApp(a),rl=evaluateManifest(mf).by[r.id],wv=applyWaiver(a.id,r.id,rl);
if(wv.st==="pass")return R("pass",wv.ev);if(wv.st==="waived")return R("warn",wv.ev,wv.fix);return R("fail",(wv.st==="partial"?"Partly met. ":"")+wv.ev,wv.fix)}})});
FRULES.forEach(r=>{if(CHECKS.some(c=>c.id===r.chk))return;
CHECKS.push({id:r.chk,n:r.n+" (feature contract)",rule:r.short+" ("+r.rules+")",t:"team",run:a=>{
const mf=a.contract||APPCON[a.id]||deriveApp(a),rl=fManifest(mf)[r.id],wv=applyWaiver(a.id,r.id,rl);
if(wv.st==="pass")return R("pass",wv.ev);if(wv.st==="waived")return R("warn",wv.ev,wv.fix);return R("fail",(wv.st==="partial"?"Partly met. ":"")+wv.ev,wv.fix)}})});
return true}
function runTool(a){
a=a||{};let t=a.manifest&&typeof a.manifest==="object"?a.manifest:a.feature_id;
if(!t)throw new Error("Provide feature_id or manifest. Try a screen id such as ims, or a citizen app id such as ca_budget.");
if(typeof t==="string"&&!ctx().feats.some(f=>f.id===t))throw new Error("Unknown feature: "+t+". Use a screen id, a module id or a citizen app id.");
const res=run(t,{via:"MCP tool run_feature_contract"});
return{feature:res.ev.name,verdict:res.verdict,score:res.ev.score,level:res.ev.level,promotable:res.ev.pass&&!res.ev.naming.length,
rules:res.ev.rules.map(r=>({rule:r.id,check:r.chk,result:r.st,evidence:r.ev,fix:r.fix})),foundation:tryv(()=>foundation(typeof t==="string"?t:t).rules.map(r=>({rule:r.id,check:r.chk,result:r.st,evidence:r.ev,fix:r.fix})),[]),naming_violations:res.ev.naming,
agents:res.steps.map(s=>({agent:s.agent,calls:s.calls.length,findings:s.findings.length,proposals:s.props.length})),
next_actions:res.steps.flatMap(s=>s.props.map(p=>p.title+" ("+p.kind+")")).slice(0,8)}}
function plugMcp(TOOLS,IMPL){
if(!Array.isArray(TOOLS)||!IMPL||TOOLS.some(t=>t.n==="run_feature_contract"))return false;
TOOLS.push({n:"run_feature_contract",d:"Run the four Feature contract agents' checks on a feature or a draft manifest: process model, data model with integration decision, metrics and maturity, interconnectivity. Returns pass or gap per rule with fixes.",write:false,ex:{feature_id:"ims"},
in:{type:"object",properties:{feature_id:{type:"string",description:"A screen id, module id or citizen app id, for example ims or ca_budget"},manifest:{type:"object",description:"Or a draft contract manifest: {name, process, data, metrics, maturity, links}"}},anyOf:[{required:["feature_id"]},{required:["manifest"]}]},
out:{type:"object",properties:{verdict:{type:"string"},score:{type:"number"},level:{type:"string"},promotable:{type:"boolean"},rules:{type:"array",items:{type:"object",properties:{rule:{type:"string"},check:{type:"string"},result:{type:"string",enum:["pass","partial","gap","waived"]},evidence:{type:"string"},fix:{type:"string"}}}},naming_violations:{type:"array",items:{type:"string"}},next_actions:{type:"array",items:{type:"string"}}}}});
IMPL.run_feature_contract=runTool;return true}
function fromDraft(d){
try{const dt=d.data||{},pr=d.proc||{},conns=d.conns||[],sec=d.sec||{};
return{name:d.name,purpose:d.purpose,owner:d.owner,
process:{ref:pr.tpl||undefined,trigger:pr.trigger,steps:arrS(pr.steps).map(s=>({n:s.n,who:s.who,owner:s.owner,sla:s.sla}))},
data:{reuse:arrS(dt.reuse),extend:arrS(dt.ext).map(x=>({entity:x.ent,add:arrS(x.add).map(f=>f.k)})),new:arrS(dt.neu).map(n=>({id:n.id,label:n.label,why:n.why,fields:arrS(n.fields).map(f=>({k:f.k,classification:f.classification,authority:f.authority}))}))},
metrics:arrS(d.metrics).map(q=>({n:q.n,f:q.f,owner:q.owner,tgt:q.tgt,rem:q.remTitle})),maturity:d.mat?{model:d.mat.model,target:d.mat.target}:undefined,
reuse:{archetype:d.arch||"Dashboard-first list",compared:arrS(d.compared).length?arrS(d.compared):["Registry search in Build a module"]},tenant:{dataLayer:true,vocabulary:true},people:{ownerChip:true,chat:"platform"},
links:{modules:conns.map(c=>({id:c.other,dir:c.dir,entity:c.entity})),search:true,notifications:!!sec.notify,approvals:arrS(pr.steps).some(s=>s.who==="gate"),inbox:arrS(pr.steps).some(s=>s.who==="gate")}}}catch(e){return{}}}
/* metrics */
const MEMBER=(id,n,f,u,cur,tgt,badAt,dir,max,tr,rem)=>({n,f,u,cur,tgt,badAt,dir,max,tr,owner:"Platform team",use:["Feature contract"],rem});
Object.assign(METRICS,{
m_contract_cov:MEMBER("m_contract_cov","Contract coverage","Σ over features of (rules met + 0.5 × rules partly met or waived) ÷ (4 rules × features) × 100","%",50,85,40,"max",100,[28,33,38,42,45,47,49,50],{kind:"agent",ref:"AG-CT1",title:"Draft the missing process, data, metric or link records for the lowest-scoring features",agent:"Feature contract orchestrator",auto:false,state:"idle",prog:"Runs the four design agents on the worst offenders and proposes fixes for a person to accept"}),
m_contract_full:MEMBER("m_contract_full","Features at full contract","Features with all four rules met ÷ all features × 100","%",20,60,10,"max",100,[6,8,11,13,15,17,19,20],{kind:"sop",ref:"SOP-CT2",title:"Retrofit sweep: close one rule per feature per sprint",agent:"Platform team",auto:false,state:"idle",prog:"Owners work their list on the Dashboard tab"}),
m_contract_gaps:MEMBER("m_contract_gaps","Open contract gaps","Count of (feature, rule) pairs that are not met and not waived","",120,40,160,"min",300,[210,196,180,166,150,138,128,120],{kind:"agent",ref:"AG-CT3",title:"Open a pull request that adds the missing records",agent:"Feature contract orchestrator",auto:false,state:"idle",prog:"Proposes the fix; the owner reviews and accepts"}),
m_contract_waivers:MEMBER("m_contract_waivers","Active contract waivers","Waivers not revoked and not yet expired","",2,3,8,"min",20,[0,0,1,1,2,2,2,2],{kind:"sop",ref:"SOP-CT4",title:"Review waivers 30 days before they expire",agent:"Data council",auto:false,state:"idle",prog:"Each waiver is a debt item with an owner and an expiry"}),
m_contract_ttc:MEMBER("m_contract_ttc","Average time to close a gap","Σ (date closed − date opened) ÷ gaps closed in the last 90 days","d",11,10,21,"min",30,[19,17,16,14,13,12,12,11],{kind:"kb",ref:"KB0742",title:"How to close a contract gap in one sitting",agent:"Feature contract orchestrator",auto:false,state:"idle",prog:"Drafts the fix; closing needs the owner's accept"})});
function ensureHist(cov){
if(!C.hist){C.hist=[0.52,0.58,0.65,0.71,0.78,0.85,0.92].map(q=>Math.round(cov*q))}
return C.hist.concat([cov])}
function seedClosed(){if(C.closed.length)return;[["inv","metrics",6],["ppm_proj","links",9],["itsm_inc","process",4],["svc_cat","data",14],["bud_over","metrics",11],["tower","links",8],["itsm_chg","process",19],["kcs_home","data",13],["port","metrics",15]].forEach((c,i)=>C.closed.push({feature:c[0],rule:c[1],days:c[2],at:iso(-5-i*7)}))}
function stats(){
const mx=matrix(),n=mx.length||1;seedClosed();
const sum=mx.reduce((s,r)=>s+r.score,0),cov=Math.round(100*sum/(4*n)),full=mx.filter(r=>r.full).length;
const gaps=mx.reduce((s,r)=>s+r.gaps.length,0),wv=C.waivers.filter(w=>!w.revoked&&w.exp>=TODAY).length;
const cl=C.closed.slice(0,40),ttc=cl.length?r1(cl.reduce((s,c)=>s+c.days,0)/cl.length):0;
const lv=[0,0,0,0,0];mx.forEach(r=>lv[lvlOf(r.score)]++);
const rule={};RULES.forEach(q=>{rule[q.id]={pass:0,partial:0,gap:0,waived:0};mx.forEach(r=>rule[q.id][r.by[q.id].st]++)});
return{features:mx.length,coveragePct:cov,fullContract:full,fullPct:pct(full,mx.length),openGaps:gaps,waivers:wv,avgDaysToClose:ttc,levels:lv,rule,trend:ensureHist(cov),meets:mx.filter(r=>r.pass).length}}
function syncMetrics(mx){
try{const n=mx.length||1,sum=mx.reduce((s,r)=>s+r.score,0),cov=Math.round(100*sum/(4*n)),full=mx.filter(r=>r.full).length,gaps=mx.reduce((s,r)=>s+r.gaps.length,0);
seedClosed();const cl=C.closed.slice(0,40);
const set=(id,v)=>{const m=METRICS[id];m.cur=v;m.tr=m.tr.slice(0,7).concat([v])};
METRICS.m_contract_cov.tr=ensureHist(cov).slice(-8);METRICS.m_contract_cov.cur=cov;
set("m_contract_full",pct(full,n));set("m_contract_gaps",gaps);set("m_contract_waivers",C.waivers.filter(w=>!w.revoked&&w.exp>=TODAY).length);set("m_contract_ttc",cl.length?r1(cl.reduce((s,c)=>s+c.days,0)/cl.length):0);
METRICS.m_contract_gaps.max=Math.max(300,gaps*2)}catch(e){}}
/* the agent run */
const WHO_T={human:"Human",robot:"Robot",agent:"Agent",gate:"Approval gate"};WHO_T.auto=WHO_T.robot;
function templateSteps(name,owner){
const o=owner||"Feature owner";
return[{n:"Intake",who:"human",owner:o,sla:"Same day",d:"A request or event starts the work."},{n:"Triage and classify",who:"agent",owner:"Triage Agent",sla:"15 minutes",d:"An agent proposes the class and the route."},{n:"Review and decide",who:"gate",owner:o,sla:"2 days",d:"A person approves, rejects or sends back."},{n:"Do the work",who:"human",owner:o,sla:"5 days",d:"The accountable team completes it."},{n:"Record and measure",who:"robot",owner:"Platform",sla:"Immediate",d:"The result is audited and feeds the metrics."}]}
function pickLinks(ev){
const x=ctx(),mod=ev.module?x.modOf(ev.module):null,out=[];
const add=(id,dir,entity,why)=>{if(tryv(()=>MODMAP.modules.some(m=>m.id===id),false)&&!out.some(o=>o.id===id))out.push({id,dir,entity,why})};
if(mod){tryv(()=>MODMAP.modules.filter(m=>m.band===mod.band&&m.id!==mod.id).slice(0,2),[]).forEach((m,i)=>add(m.id,i?"push":"pull",(m.w&&m.w[0])||(m.r&&m.r[0])||"person","Same band, shares records"))}
add("plat_debt","push","debt_item","Findings become technical debt");add("flw_appr","push","approval","Gates raise approvals in the inbox");add("adm_audit","push","audit_event","Every change is audited");add("ppl_org","pull","person","People and teams");
return out.slice(0,4)}
function stepFor(agent,ev,manifest){
const r=ev.by[agent.rule],st={agent:agent.id,name:agent.n,rule:agent.rule,calls:[],findings:[],props:[],status:r?r.st:"pass"};
const nm=ev.name,std=refStd(nm),own=ev.owner;
if(agent.rule==="process"){
st.calls=["Research: reference process for “"+nm+"” is "+std.n,manifest?"Read process.steps and process.ref from the manifest":"PROC.defs[\""+ev.id+"\"] and PROCLIB.list() for module "+(ev.module||"none"),"Check: steps, owners, inputs and outputs, trigger"];
st.findings.push({lvl:r.st==="pass"?"good":r.st==="waived"?"info":"bad",t:r.ev});
if(r.st!=="pass"&&r.st!=="waived"){st.props.push({id:"p_process",rule:"process",kind:"ai",title:"Register a process for "+nm+", based on "+std.n,detail:"Five steps with who acts, owners, SLAs and a human gate. Saved with PROC.reg (editable on the screen) and PROCLIB.addProcess (library, maturity, map link).",conf:.78,payload:{steps:templateSteps(nm,own),std:std.key,trigger:"A request or event for "+nm.toLowerCase()}}) }}
if(agent.rule==="data"){
const hits=tryv(()=>PLAT.reuseCheck(nm,""),[]).slice(0,3);
st.calls=["Search the registry for “"+nm+"”: "+(hits.length?hits.map(h=>h.id+" ("+Math.round(h.sc*100)+"%)").join(", "):"no close match"),manifest?"Check each declared entity in PLAT and the planned list":"ATLAS.coverage(): record sets for the screen and entities for the module","Check: authority and classification on every field"];
st.findings.push({lvl:r.st==="pass"?"good":r.st==="waived"?"info":"bad",t:r.ev});
if(r.st!=="pass"&&r.st!=="waived"){const top=hits[0];const dec=top&&top.sc>=.6?"reuse":top?"extend":"new";
st.props.push({id:"p_data",rule:"data",kind:"ai",title:"Record the decision: "+dec+(top?" "+top.id:" (a new entity)"),detail:dec==="reuse"?"“"+top.id+"” already holds this concept ("+Math.round(top.sc*100)+"% match). Use it; add no entity.":dec==="extend"?"“"+top.id+"” covers part of it. Add the missing fields there and keep one owner.":"Nothing close in the registry. Propose a thin entity, reuse person, project and business_service by reference, and classify every field.",conf:.8,payload:{decision:dec,entity:top?top.id:"",why:dec==="new"?"Registry search found no entity with this concept; reuses person and project by reference.":"Closest registry match "+(top?top.id:"")+" at "+(top?Math.round(top.sc*100):0)+"%."}})}}
if(agent.rule==="metrics"){
st.calls=["Read metrics tied to the process","PROCLIB.maturity(): level, target, six dimensions","Check: formula, owner, target and remediation on each metric"];
st.findings.push({lvl:r.st==="pass"?"good":r.st==="waived"?"info":"bad",t:r.ev});
if(r.st!=="pass"&&r.st!=="waived"){const base=slug(nm).slice(0,18);
st.props.push({id:"p_metrics",rule:"metrics",kind:"ai",title:"Add an outcome metric and a health metric, target level 3",detail:"Cycle time and on-time rate, each with a formula, owner and a remediation play; maturity on the process capability model (cmmi) with target level 3.",conf:.84,payload:{metrics:[{id:"m_"+base+"_cycle",n:nm+" cycle time",f:"Σ (completed − started) ÷ items completed",u:"h",owner:own,tgt:48,dir:"min",rem:"Rebalance the queue"},{id:"m_"+base+"_ontime",n:nm+" on-time rate",f:"Items done by the due date ÷ items due × 100",u:"%",owner:own,tgt:90,dir:"max",rem:"Review late items weekly"}],maturity:{model:"cmmi",target:3}}})}}
if(agent.rule==="links"){
const pk=pickLinks(ev);
st.calls=["MODMAP.neighbors(\""+(ev.module||"none")+"\") and flows in and out","Search index: records that name the feature","Check: approvals, notifications and audit use platform services"];
st.findings.push({lvl:r.st==="pass"?"good":r.st==="waived"?"info":"bad",t:r.ev});
if(r.st!=="pass"&&r.st!=="waived"){st.props.push({id:"p_links",rule:"links",kind:"ai",title:"Wire "+pk.length+" links: "+pk.map(p=>p.id).join(", "),detail:pk.map(p=>(p.dir==="pull"?"Pull "+p.entity+" from ":"Push "+p.entity+" to ")+p.id+" ("+p.why+")").join("; ")+". Also register a search record and a chat intent.",conf:.8,payload:{links:pk}})}}
return st}
function run(target,opts){
opts=opts||{};const isM=target&&typeof target==="object";
const ev=isM?evaluateManifest(target):(evaluate(target)||evaluateManifest({name:String(target)}));
if(!ev.naming)ev.naming=naming(ev.name+" "+(isM?(target.purpose||""):""));
const steps=AGENTS.slice(0,4).map(a=>stepFor(a,ev,isM));
const open=ev.rules.filter(r=>r.st!=="pass"&&r.st!=="waived");
const verdict=ev.pass&&!ev.naming.length?"Ready to publish: all four rules are met"+(ev.rules.some(r=>r.st==="waived")?" (some by waiver)":"")+".":"Blocked: "+open.length+" rule"+(open.length===1?"":"s")+" not met"+(ev.naming.length?"; naming rule violated ("+ev.naming.join(", ")+")":"")+".";
const orch={agent:"oukala-feature-contract",name:AB["oukala-feature-contract"].n,rule:"all",calls:["Collected the four agent results","Scored "+ev.score+" of 4 ("+ev.level+")","Naming rule lint: "+(ev.naming.length?ev.naming.join(", "):"clean")],findings:[{lvl:ev.pass?"good":"bad",t:verdict}],props:[],status:ev.pass?"pass":"gap"};
const res={ev,steps:steps.concat([orch]),verdict,at:TODAY,target:isM?"manifest":target,via:opts.via||"Run on a feature"};
if(!opts.quiet){const sum={};res.steps.forEach(s=>sum[s.agent]=[s.findings.length,s.props.length]);C.runs.unshift({at:TODAY,feature:ev.name,score:ev.score,via:res.via,id:isM?"manifest":target,sum});C.runs.length=Math.min(C.runs.length,30)}
return res}
function reportText(res){
const ev=res.ev;return"# Feature contract report: "+ev.name+"\nResult: "+ev.score+" of 4 ("+ev.level+"). "+res.verdict+"\n\n"+ev.rules.map(r=>"- "+r.n+": "+STL[r.st][0].toUpperCase()+". "+r.ev+(r.st!=="pass"&&r.fix?" Fix: "+r.fix:"")).join("\n")+"\n\nNaming rule: "+(ev.naming.length?"violated ("+ev.naming.join(", ")+")":"clean")+"\n"}
/* applying an accepted proposal */
function applyProposal(res,p){
const ev=res.ev;
if(res.target==="manifest"){
let m;try{m=JSON.parse(C.run.text)}catch(e){toast("The manifest is not valid JSON","warn");return false}
const pl=p.payload;
if(p.rule==="process"){m.process=Object.assign({},m.process,{trigger:pl.trigger,steps:pl.steps.map(s=>({n:s.n,who:s.who,owner:s.owner,sla:s.sla}))})}
if(p.rule==="data"){m.data=Object.assign({},m.data);if(pl.decision==="reuse"||pl.decision==="extend"){const e=pl.entity||"person";m.data.new=arrS(m.data.new).filter(n=>!(n.dup||tryv(()=>PLAT.reuseCheck(n.label||n.id,arrS(n.fields).map(fname).join(" ")),[]).some(h=>h.sc>=.6)));if(pl.decision==="reuse")m.data.reuse=[...new Set(arrS(m.data.reuse).concat(e))];else m.data.extend=arrS(m.data.extend).concat({entity:e,add:["new_field"]})}else if(!arrS(m.data.new).length)m.data.new=[{id:slug(m.name||"feature"),label:m.name,why:pl.why,fields:[{k:"id",classification:"internal",authority:"platform"}]}];m.data.rationale=pl.why}
if(p.rule==="metrics"){m.metrics=arrS(m.metrics).filter(q=>q.f&&q.owner).concat(pl.metrics.map(q=>({n:q.n,f:q.f,owner:q.owner,tgt:q.tgt,rem:q.rem})));m.maturity=pl.maturity}
if(p.rule==="links"){m.links=Object.assign({},m.links);m.links.modules=arrS(m.links.modules).concat(pl.links.map(l=>({id:l.id,dir:l.dir,entity:l.entity})));m.links.search=true;m.links.approvals=true;m.links.notifications=true}
C.run.text=JSON.stringify(m,null,2);return true}
const id=ev.id,ov=C.overlay[id]=C.overlay[id]||{},pl=p.payload,x=ctx();
if(p.rule==="process"){
const mod=ev.module&&x.modOf(ev.module);
if(!tryv(()=>PROC.defs[id],null))tryv(()=>PROC.reg(id,{title:ev.name+" process",std:[pl.std],steps:pl.steps.map(s=>({n:s.n,d:s.d,who:s.who,owner:s.owner,sla:s.sla}))}));
if(mod&&window.PROCLIB&&PROCLIB.addProcess&&!x.pByMod[mod.id]){const r=tryv(()=>PROCLIB.addProcess({id:id+"_flow",name:ev.name+" process",module:mod.id,family:mod.band,owner:ev.owner,trigger:pl.trigger,steps:pl.steps.map((s,i)=>Object.assign({},s,{in:i?pl.steps[i-1].n:pl.trigger,out:s.n})),inputs:[pl.trigger],outputs:[pl.steps[pl.steps.length-1].n],entities:(mod.r||[]).concat(mod.w||[]).slice(0,4),metrics:ov.metrics||[],model:"cmmi"}),null);if(r&&!r.ok)toast("Process library: "+(r.warnings||[])[0],"warn")}
ov.process=true}
if(p.rule==="data"){C.decisions[id]={decision:pl.decision,entity:pl.entity,why:pl.why,by:"Accepted by the owner",at:TODAY}}
if(p.rule==="metrics"){pl.metrics.forEach(q=>{if(!METRICS[q.id])METRICS[q.id]={n:q.n,f:q.f,u:q.u,cur:0,tgt:q.tgt,badAt:q.dir==="min"?Math.round(q.tgt*1.5):Math.round(q.tgt*.6),dir:q.dir,max:Math.max(100,q.tgt*2),tr:[0,0,0,0,0,0,0,0],owner:q.owner,use:[ev.name],rem:{kind:"sop",ref:"SOP-"+slug(ev.id).slice(0,6).toUpperCase(),title:q.rem,agent:"Feature contract orchestrator",auto:false,state:"idle",prog:"Added by an accepted contract fix. First reading after go-live."}}});ov.metrics=(ov.metrics||[]).concat(pl.metrics.map(q=>q.id));ov.maturity=pl.maturity}
if(p.rule==="links"){ov.links=(ov.links||[]).concat(pl.links)}
C.closed.unshift({feature:id,rule:p.rule,days:2+hash(id+p.rule)%38,at:TODAY});
bust();audit("Contract fix accepted",ev.name+": "+p.title);return true}
/* samples */
const SAMPLE_GOOD={name:"Facilities work orders",purpose:"Staff report a repair; an agent triages it, a manager approves spend, the facilities team completes it.",owner:"Rina Okafor",
process:{trigger:"A staff member reports a repair in the portal",steps:[{n:"Report",who:"human",owner:"Requester",sla:"Same day"},{n:"Triage",who:"agent",owner:"Triage Agent",sla:"15 minutes"},{n:"Approve spend",who:"gate",owner:"Facilities manager",sla:"1 day"},{n:"Repair",who:"human",owner:"Facilities team",sla:"3 days"}]},
data:{reuse:["person","business_service"],extend:[{entity:"request_item",add:["facilities_category"]}],new:[{id:"repair_visit",label:"Repair visit",why:"No registered entity records a contractor visit to a building with arrival window, parts used and sign-off; request_item stops at fulfilment.",fields:[{k:"arrival_window",classification:"internal",authority:"platform"},{k:"parts_used",classification:"internal",authority:"platform"},{k:"signed_off_by",classification:"personal",authority:"platform"}]}]},
metrics:[{n:"Repair cycle time",f:"Σ (completed − reported) ÷ repairs completed",owner:"Rina Okafor",tgt:72,rem:"Rebalance the facilities queue"},{n:"Triage by agent rate",f:"Reports triaged by the agent without a person ÷ all reports × 100",owner:"Rina Okafor",tgt:70,rem:"Retrain the Triage Agent on misrouted reports"}],maturity:{model:"cmmi",target:3},
links:{modules:[{id:"ppl_org",dir:"pull",entity:"person"},{id:"bud_over",dir:"push",entity:"cost_allocation"},{id:"chat_home",dir:"push",entity:"notification"}],search:true,approvals:true,notifications:true,tickets:["facilities queue"]}};
const SAMPLE_BAD={name:"Grant tracker",purpose:"Track grant applications from outside funders.",owner:"Avery Chen",
process:{steps:[{n:"Apply",who:"human"},{n:"Review",who:"human"}]},
data:{reuse:["person"],new:[{id:"person_record",label:"Person",fields:["name","email","role"]}]},
metrics:[{n:"Grants awarded",f:"Awards ÷ applications"}],links:{modules:[{id:"ppm_proj",dir:"pull",entity:"project"}]}};
/* UI pieces */
const st_=r=>`<span class="pill ${STL[r.st][1]}" title="${E(r.n+": "+r.ev)}">${STL[r.st][0]}</span>`;
const lvPill=ev=>pill_(ev.level,ev.lc);
const featSel=cur=>{const x=ctx();const g={screen:[],module:[],app:[]};x.feats.forEach(f=>g[f.kind].push(f));return[["screen","Screens"],["module","Modules without a screen"],["app","Citizen apps"]].filter(k=>g[k[0]].length).map(k=>`<optgroup label="${k[1]}">${g[k[0]].map(f=>`<option value="${E(f.id)}" ${f.id===cur?"selected":""}>${E(f.name)} (${E(f.id)})</option>`).join("")}</optgroup>`).join("")};
const SHORTFIX={process:"Register steps and owners with the process architect",data:"Record the reuse, extend or new decision with the data integrator",metrics:"Add formula, target and maturity with the metrics steward",links:"Add flows, search and chat with the connectivity steward"};
function gapRows(){const mx=matrix(),o=[];mx.forEach(r=>r.gaps.forEach(g=>o.push({id:r.id+":"+g.id,fid:r.id,feature:r.name,kind:r.kind,rule:g.n,rid:g.id,state:STL[g.st][0],owner:r.owner,age:g.age,fix:SHORTFIX[g.id]+(g.st==="partial"?" (finish the partial record)":"")})));return o}
function distBar(s){const t=s.features||1;return`<div class="ct-dist" role="img" aria-label="${LEVELS.map((l,i)=>l[0]+" "+s.levels[i]).join(", ")}">${LEVELS.map((l,i)=>s.levels[i]?`<i class="ct-l${i}" style="flex:${s.levels[i]}" title="${l[0]}: ${s.levels[i]}"></i>`:"").join("")}</div>
 <div class="legend" role="note">${LEVELS.map((l,i)=>`<span><i class="ct-sw ct-l${i}"></i>${l[0]} ${s.levels[i]}</span>`).join("")}</div>`}
function ruleBars(s){const t=s.features||1;return`<div class="ct-bars">${RULES.map(r=>{const q=s.rule[r.id];return`<div class="ct-bar"><span class="ct-bl"><b>${E(r.n)}</b></span><span class="ct-track" role="img" aria-label="${U.esc(r.n)}: ${q.pass} met, ${q.partial} partly, ${q.gap} gap, ${q.waived} waived"><i class="ct-s-pass" style="width:${100*q.pass/t}%"></i><i class="ct-s-partial" style="width:${100*q.partial/t}%"></i><i class="ct-s-waived" style="width:${100*q.waived/t}%"></i><i class="ct-s-gap" style="width:${100*q.gap/t}%"></i></span><span class="ct-bn num">${Math.round(100*(q.pass+q.partial*.5+q.waived*.5)/t)}%</span></div>`}).join("")}</div>
 <div class="legend" role="note"><span><i class="ct-sw ct-s-pass"></i>Met</span><span><i class="ct-sw ct-s-partial"></i>Partly met</span><span><i class="ct-sw ct-s-waived"></i>Waived</span><span><i class="ct-sw ct-s-gap"></i>Gap</span></div>`}
function trendSvg(h){const w=320,ht=96,p=10,mx=100,pts=h.map((v,i)=>[p+i*(w-2*p)/(h.length-1),ht-p-(v/mx)*(ht-2*p)]);const tg=ht-p-(85/mx)*(ht-2*p);
return`<svg class="ct-trend" viewBox="0 0 ${w} ${ht}" role="img" aria-label="Contract coverage by week: ${h.join(", ")} percent, target 85"><line x1="${p}" x2="${w-p}" y1="${tg}" y2="${tg}" class="ct-tg"/><polyline points="${pts.map(q=>q.join(",")).join(" ")}" class="ct-ln"/>${pts.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="${i===pts.length-1?4:2.5}" class="ct-dt"/>`).join("")}<text x="${w-p}" y="${tg-4}" text-anchor="end" class="ct-tx">Target 85%</text></svg>
 <div class="legend" role="note"><span><i class="ct-sw ct-s-line"></i>Coverage percent, weekly</span><span><i class="ct-sw ct-s-tg"></i>Target</span></div><p class="small muted" style="margin:6px 0 0">Earlier weeks are modeled for this demo; from now on a point is recorded each time the matrix is evaluated at the weekly close.</p>`}
function dashPane(){
const s=stats(),mx=matrix(),worst=mx.slice().sort((a,b)=>a.score-b.score||(a.kind==="screen"?-1:1)||a.name.localeCompare(b.name)).slice(0,8);
const gaps=gapRows(),owners={};gaps.forEach(g=>{(owners[g.owner]=owners[g.owner]||[]).push(g)});
const ol=Object.keys(owners).sort((a,b)=>owners[b].length-owners[a].length).slice(0,10);
const kp=typeof kpiRow==="function"?kpiRow([["Contract coverage",s.coveragePct+"%","of 4 rules across "+s.features+" features",{metric:"m_contract_cov",keep:true}],["Features at full contract",s.fullContract,s.fullPct+"% meet all four rules",{metric:"m_contract_full",keep:true}],["Open contract gaps",s.openGaps,"not met and not waived",{metric:"m_contract_gaps",keep:true}],["Active waivers",s.waivers,"each is a debt item with an expiry",{metric:"m_contract_waivers",keep:true}],["Average days to close",s.avgDaysToClose+" d","last 90 days",{metric:"m_contract_ttc",keep:true}]]):"";
const lr=typeof lrHTML==="function"?lrHTML({id:"ct_owners",limit:4,search:true,groups:ol.map(o=>({key:o,label:o+" ("+owners[o].length+" gaps)",rows:owners[o].map(g=>({id:g.id,t:g.feature+": "+g.rule,sub:g.state+" · open "+g.age+" days · "+g.fix,tag:g.state,st:g.state==="Gap"?"bad":"warn",go:()=>openFeature(g.fid)}))}))}):"";
return`${kp}
 <div class="grid g2" style="gap:16px;align-items:start">${card("Where the platform stands","Each feature scores 0 to 4: one point per rule met, half a point for a rule partly met or waived.",`<p class="small" data-role="story" style="margin:0">${s.fullContract} of ${s.features} features meet all four rules. Outright passes by rule: ${RULES.map(r=>r.n.split(" and ")[0].toLowerCase()+" "+s.rule[r.id].pass).join(", ")}.</p>${distBar(s)}`)}
 ${card("Coverage by rule","Share of features meeting each rule, with partly met and waived counted as half.",ruleBars(s))}</div>
 <div class="grid g2" style="gap:16px;align-items:start;margin-top:16px">${card("Trend","Contract coverage across the platform",trendSvg(s.trend))}
 ${card("Worst offenders","Lowest scores first. Open one to see the evidence and run the agents on it.",`<div class="ct-wl">${worst.map(r=>`<button type="button" class="ct-wrow" data-ct-open="${E(r.id)}"><span class="ct-wn"><b>${E(r.name)}</b><span class="small muted">${E(r.area)} · ${E(r.owner)}</span></span><span class="ct-dots" aria-label="${r.rules.map(q=>q.n+" "+STL[q.st][0]).join(", ")}">${r.rules.map(q=>`<i class="ct-d ct-s-${q.st}" title="${E(q.n+": "+STL[q.st][0])}"></i>`).join("")}</span><span class="num">${r.score}/4</span></button>`).join("")}</div><div class="legend" role="note"><span><i class="ct-sw ct-s-pass"></i>Met</span><span><i class="ct-sw ct-s-partial"></i>Partly met</span><span><i class="ct-sw ct-s-waived"></i>Waived</span><span><i class="ct-sw ct-s-gap"></i>Gap</span></div><p class="small muted" style="margin:6px 0 0">The four dots are, in order: process, data, metrics, links.</p>`)}</div>
 <div style="margin-top:16px">${card("Owner worklist","Who has gaps to close, grouped by accountable owner. Open a row for the evidence.",lr||"<p class='muted small'>No gaps.</p>")}</div>
 <div style="margin-top:16px">${card("Backlog of gaps with remediation","Every rule that is not met, on every feature. Filter by rule, state or owner.",typeof btHTML==="function"?btHTML({id:"ct_gaps",key:"id",h:420,rowH:56,facets:["rule","state","owner"],exportName:"contract-gaps",sort:{k:"age",d:-1},cols:[{k:"feature",label:"Feature",wrap:true,fmt:r=>`<b>${E(r.feature)}</b><div class="small muted">${E(r.kind)}</div>`},{k:"rule",label:"Rule",wrap:true},{k:"state",label:"State",fmt:r=>pill_(r.state,r.state==="Gap"?"bad":"warn")},{k:"owner",label:"Owner",wrap:true},{k:"age",label:"Open (days)"},{k:"fix",label:"Remediation",wrap:true,fmt:r=>`<span class="small">${E(r.fix)}</span>`}],rows:gapRows,open:id=>openFeature(id.split(":")[0])}):"")}</div>`}
function matrixPane(){
const rows=()=>matrix().map(r=>({id:r.id,name:r.name,kind:r.kind,area:r.area,owner:r.owner,process:r.by.process.st,data:r.by.data.st,metrics:r.by.metrics.st,links:r.by.links.st,score:r.score,level:r.level,lc:r.lc}));
const cell=k=>r=>`<span class="pill ${STL[r[k]][1]}">${STL[r[k]][0]}</span>`;
return`<p class="muted small">The retrofit matrix. One row for every screen, every module without a screen, and every citizen app. Open a row to drill into a feature page with evidence and fixes.</p>
 ${typeof btHTML==="function"?btHTML({id:"ct_mx",key:"id",h:560,rowH:46,facets:["kind","area","level","owner"],groupBy:["kind","area","level"],exportName:"feature-contract-matrix",sort:{k:"score",d:1},
cols:[{k:"name",label:"Feature",wrap:true,fmt:r=>`<b>${E(r.name)}</b> <span class="small muted">${E(r.id)}</span>`},{k:"process",label:"1 Process",fmt:cell("process"),val:r=>r.process},{k:"data",label:"2 Data",fmt:cell("data"),val:r=>r.data},{k:"metrics",label:"3 Metrics",fmt:cell("metrics"),val:r=>r.metrics},{k:"links",label:"4 Links",fmt:cell("links"),val:r=>r.links},{k:"score",label:"Score",fmt:r=>`<span class="num">${r.score}/4</span>`},{k:"level",label:"Level",fmt:r=>pill_(r.level,r.lc)},{k:"kind",label:"Kind"},{k:"area",label:"Area",wrap:true},{k:"owner",label:"Owner",wrap:true}],rows,open:openFeature}):""}
 <div class="legend" role="note"><span><i class="ct-sw ct-s-pass"></i>Met</span><span><i class="ct-sw ct-s-partial"></i>Partly met</span><span><i class="ct-sw ct-s-waived"></i>Waived by exception</span><span><i class="ct-sw ct-s-gap"></i>Gap</span></div>`}
function exampleFor(rid){const mx=matrix();const f=mx.find(r=>r.kind==="screen"&&r.by[rid].st==="pass"&&r.full)||mx.find(r=>r.by[rid].st==="pass");return f?{f,r:f.by[rid]}:null}
function decisionsCard(){
if(!C.entDecisions.length)return"";
return card("Integration decisions recorded for this screen's own records","The Feature contract follows its own rule 2: it searched the registry first and recorded why each entity is thin, new or by reference.",C.entDecisions.map(d=>`<div class="ct-ex" style="margin-bottom:8px"><b>${E(d.entity)}</b><div class="small">${E(d.decision)}</div><div class="small muted">Searched: ${E(d.searched)}. ${d.duplicates.length} possible duplicate field${d.duplicates.length===1?"":"s"} reviewed.</div><button class="btn quiet" data-ct-ent="${E(d.entity)}">Open in the atlas</button></div>`).join(""))}
function rulesPane(){
const s=stats();
return`<p class="muted small">The platform's standing rules for everything we build, in plain language. Each rule names the exact artifacts, a definition of done, and the evidence the platform checks by itself. The examples are real features, read live from the registries.</p>
 <div class="grid g2" style="gap:16px;align-items:stretch">${RULES.map((r,i)=>{const ex=exampleFor(r.id),q=s.rule[r.id];return`<section class="card glass ct-rule"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><div><div class="eyebrow">Rule ${i+1}</div><h3 style="margin:2px 0 0">${E(r.n)}</h3></div>${pill_(q.pass+" of "+s.features+" met","info")}</div>
  <p class="small" data-role="story"><b>${E(r.req)}</b></p>
  <h4 class="ct-h4">Required artifacts</h4><ul class="ct-ul">${r.art.map(a=>`<li>${E(a)}</li>`).join("")}</ul>
  <h4 class="ct-h4">Definition of done</h4><ul class="ct-ul ct-chk">${r.done.map(a=>`<li>${E(a)}</li>`).join("")}</ul>
  <h4 class="ct-h4">Evidence the platform checks</h4><p class="small">${E(r.ev)}. Gate check <code>${r.chk}</code> blocks publishing from the team tier up.</p>
  ${ex?`<h4 class="ct-h4">A real example</h4><div class="ct-ex"><b>${E(ex.f.name)}</b><div class="small muted">${E(ex.r.ev)}</div><button class="btn quiet" data-ct-open="${E(ex.f.id)}">Open this feature</button></div>`:""}
  <div class="row" style="gap:8px;margin-top:auto"><button class="btn" data-ct-agent="${E(r.agent)}">Agent: ${E(AB[r.agent].n)}</button></div></section>`}).join("")}</div>
 ${decisionsCard()}
 ${card("The naming rule","Applies to everything written for this product, including prompts, seed data and agent output.",`<p class="small">This is a standalone product that may be shown to peers of the first customer. The sample customer is Meridian Standards Foundation, with the Standards Portal and Standards Platform as sample systems. The names of the first customer's source bodies and the retired standards vocabulary must never appear in new text. The contract report lints every draft and fails the run when it finds one. Other organizations' processes arrive later as process content.</p>`)}`}
function agentCard(a){
const runs=C.runs.slice(0,3).map(r=>`<li><span>${E(r.feature)}</span><span class="small muted">${fD(r.at)} · ${r.sum&&r.sum[a.id]?r.sum[a.id][0]+" findings, "+r.sum[a.id][1]+" proposals":"ran"}</span></li>`).join("")||"<li class='muted small'>No runs yet.</li>";
return`<section class="card glass ct-ag" id="ct-ag-${E(a.id)}"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><div><div class="eyebrow">${a.rule==="all"?"Orchestrator":"Rule "+(RULES.findIndex(r=>r.id===a.rule)+1)}</div><h3 style="margin:2px 0 0">${E(a.n)}</h3><code class="small">${E(a.id)}</code></div><div>${typeof aiChip==="function"?aiChip({model:a.model,conf:a.conf,title:a.n,note:"Design-time sub-agent definition in agents/"+a.id+".md and the same logic as a runtime check here. In this prototype the drafts come from rule-based templates standing in for the model; the checks are deterministic."}):""}</div></div>
 <p class="small">${E(a.purpose)}</p>
 <div class="ct-io"><div><h4 class="ct-h4">Inputs</h4><ul class="ct-ul">${a.inp.map(x=>`<li>${E(x)}</li>`).join("")}</ul></div><div><h4 class="ct-h4">Outputs</h4><ul class="ct-ul">${a.out.map(x=>`<li>${E(x)}</li>`).join("")}</ul></div></div>
 <h4 class="ct-h4">What it checks</h4><ul class="ct-ul ct-chk">${a.checks.map(x=>`<li>${E(x)}</li>`).join("")}</ul>
 <h4 class="ct-h4">Guardrails ${typeof whyPop==="function"?whyPop("These limits are in the agent definition file and enforced again at the gate, so a vibe-coded app cannot skip them."):""}</h4><ul class="ct-ul">${a.guard.map(x=>`<li>${E(x)}</li>`).join("")}</ul>
 <h4 class="ct-h4">Last runs</h4><ul class="ct-runs">${runs}</ul>
 <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn sm" data-stp-agent="${E(a.n)}">Agent definition</button><span class="small muted">Task, prompts, tier, budget, confidence floor, kill switch, sponsor and trigger (simulated)</span></div></section>`}
function agentsPane(){
return`<p class="muted small">One definition, three forms. The same four agents exist as Claude Code sub-agent files that a builder or vibe-coding session calls (agents folder), as a skill that orchestrates them (skills folder), and as the runtime checks in this screen, in the gate and in the MCP tool. Their drafts are labeled as AI output and a person always accepts.</p>
 <div class="grid g2" style="gap:16px;align-items:stretch">${AGENTS.map(agentCard).join("")}</div>`}
function stepHTML(s,i,res){
const done=i<C.run.shown,cur=i===C.run.shown;
if(!done)return`<div class="ct-step ${cur?"cur":"wait"}"><span class="ct-n">${i+1}</span><div><b>${E(s.name)}</b><div class="small muted">${cur?"Working...":"Waiting"}</div></div></div>`;
const a=AB[s.agent];
return`<div class="ct-step done"><span class="ct-n">${i+1}</span><div class="ct-sb"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${E(s.name)}</b><span class="ct-sh">${s.rule!=="all"?`<span class="pill ${STL[s.status][1]}">${STL[s.status][0]}</span>`:pill_(res.ev.pass?"Ready":"Blocked",res.ev.pass?"good":"bad")} ${a&&typeof aiChip==="function"?aiChip({model:a.model,conf:a.conf,title:a.n,note:"Draft proposals are AI-style suggestions. Findings are deterministic checks against the registries."}):""}</span></div>
 <ul class="ct-calls">${s.calls.map(c=>`<li><code>${E(c)}</code></li>`).join("")}</ul>
 ${s.findings.map(f=>`<div class="ct-find ${f.lvl}"><span class="pill ${f.lvl==="good"?"good":f.lvl==="info"?"info":"bad"}">${f.lvl==="good"?"Check passed":f.lvl==="info"?"Waived":"Finding"}</span><span class="small">${E(f.t)}</span></div>`).join("")}
 ${s.props.map((p,j)=>`<div class="ct-prop"><div class="row" style="gap:8px;flex-wrap:wrap">${pill_("AI-suggested draft","metric")}<b class="small">${E(p.title)}</b><span class="small muted">confidence ${Math.round(p.conf*100)}%</span></div><p class="small muted" style="margin:4px 0 8px">${E(p.detail)}</p>${p.accepted?pill_("Accepted","good"):`<button class="btn primary" data-ct-accept="${i}:${j}">Accept and apply</button><button class="btn quiet" data-ct-skip="${i}:${j}">Not now</button>`}</div>`).join("")}</div></div>`}
function runOut(){
const res=C.run.res;if(!res)return`<p class="small muted">Pick a feature or paste a draft manifest, then run the agents. Each agent reads the real registries, then the orchestrator scores the four rules.</p>`;
const all=C.run.shown>=res.steps.length,ev=res.ev;
const rep=all?`<div class="ct-report glass"><div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><div><div class="eyebrow">Contract report</div><h3 style="margin:2px 0">${E(ev.name)}: ${ev.score} of 4 · ${E(ev.level)}</h3></div><div class="row" style="gap:8px">${pill_(ev.pass?"Ready to publish":"Blocked",ev.pass?"good":"bad")}${pill_(ev.naming.length?"Naming rule violated":"Naming rule clean",ev.naming.length?"bad":"good")}</div></div>
  <p class="small" data-role="story">${E(res.verdict)}</p>
  <div class="ct-rrs">${ev.rules.map(r=>`<div class="ct-rr"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${E(r.n)}</b>${st_(r)}</div><div class="small">${E(r.ev)}</div>${r.st==="pass"||r.st==="waived"?"":`<div class="small muted"><b>Fix.</b> ${E(r.fix)}</div>`}</div>`).join("")}</div>
  <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn" data-ct-copy>Copy the report</button>${res.target!=="manifest"?`<button class="btn" data-ct-open="${E(ev.id)}">Open the feature page</button><button class="btn" data-ct-waive="${E(ev.id)}">Request a waiver</button>`:`<button class="btn" data-ct-act="mcp">Show the MCP call</button>`}</div></div>`:"";
return`<div class="ct-steps">${res.steps.map((s,i)=>stepHTML(s,i,res)).join("")}</div>${rep}`}
function runPane(){
const R=C.run,man=R.mode==="manifest";
return`<p class="muted small">Run the design agents on a feature that exists, or on a draft manifest before anything is built. The checks are deterministic and read the real registries. Suggested fixes are AI-style drafts and are only applied when a person accepts them.</p>
 <div class="grid ct-run" style="gap:16px;align-items:start">
 <section class="card glass"><div class="eyebrow">Input</div><div class="row" style="gap:8px;margin:8px 0 12px;flex-wrap:wrap"><button type="button" class="chip" aria-pressed="${!man}" data-ct-mode="feature">A registered feature</button><button type="button" class="chip" aria-pressed="${man}" data-ct-mode="manifest">A draft manifest</button></div>
  ${man?`<label class="fld"><span class="flab">Contract manifest (JSON)</span><textarea class="fin ct-ta" rows="16" data-ct-text spellcheck="false" aria-label="Contract manifest as JSON">${E(R.text)}</textarea></label><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn quiet" data-ct-act="good">Load a complete sample</button><button class="btn quiet" data-ct-act="bad">Load a draft with gaps</button></div>${R.err?`<p class="small" style="color:var(--bad)">${E(R.err)}</p>`:""}`
:`<label class="fld"><span class="flab">Feature</span><select class="fin" data-ct-target aria-label="Feature">${featSel(R.target)}</select></label><p class="small muted">Screens, modules without a screen and citizen apps. The matrix tab lists them all.</p>`}
  <div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" data-ct-act="run">Run the agents</button></div>
  <div class="small muted" style="margin-top:10px">Same call as the MCP tool <code>run_feature_contract</code>. ${typeof whyPop==="function"?whyPop("A vibe-coding client calls the tool with a feature id or a manifest and gets this same report back as data."):""}</div></section>
 <section class="card glass"><div class="eyebrow">Agents in order</div><div data-ct-runout style="margin-top:8px">${runOut()}</div></section></div>`}
function wvCard(w){const days=dd(TODAY,w.exp),st=w.revoked?["Revoked","mute"]:days<0?["Expired","bad"]:days<=30?["Expires in "+days+" days","warn"]:["Active","good"];
return`<div class="ct-wv"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${E(w.name)}</b>${pill_(st[0],st[1])}</div><div class="small">${E(RB[w.rule].n)} · until ${fD(w.exp)} · ${E(w.debt)} · owner ${typeof pchip==="function"&&window.DIR&&DIR.some(d=>d.name===w.owner)?pchip(w.owner):E(w.owner)}</div><div class="small muted">${E(w.reason)}</div>${w.revoked?"":`<div class="row" style="gap:8px;margin-top:6px"><button class="btn quiet" data-ct-revoke="${E(w.id)}">Revoke</button><button class="btn quiet" data-ct-open="${E(w.feature)}">Open feature</button></div>`}</div>`}
function excPane(){
const live=C.waivers.filter(w=>!w.revoked),act=live.filter(w=>w.exp>=TODAY),soon=act.filter(w=>dd(TODAY,w.exp)<=30),exp=live.filter(w=>w.exp<TODAY);
return`<p class="muted small">A waiver is the only way to ship a feature that does not meet a rule. It names the rule, the reason, an owner and an expiry (90 days at most), and it becomes a technical debt item through the debt ledger. When it expires the check fails again.</p>
 ${typeof kpiRow==="function"?kpiRow([["Active waivers",act.length,"not yet expired",{metric:"m_contract_waivers",keep:true}],["Expiring in 30 days",soon.length,"review before they lapse",{keep:true}],["Expired",exp.length,"check fails again",{keep:true}]]):""}
 <div class="row" style="gap:8px;margin:12px 0"><button class="btn primary" data-ct-waive="">Request a waiver</button></div>
 ${card("Waivers","Newest first",C.waivers.length?`<div class="ct-wvs">${C.waivers.slice().reverse().map(wvCard).join("")}</div>`:`<p class="small muted">No waivers. Every feature that has gaps is blocked at the gate until it is fixed.</p>`)}
 ${card("What an exception looks like","Same path for people and for coding agents",`<ol class="ct-ul"><li>Feature, rule, reason: why the rule cannot be met now and what control covers the risk.</li><li>An accountable owner and an expiry of at most 90 days.</li><li>A debt item is created with <code>DEBT.add</code> (type exception, status accepted, expiry set).</li><li>The check shows Waived until the expiry, then Gap again. The metric Active contract waivers counts it.</li></ol>`)}`}
function enfPane(){
const gate=tryv(()=>G_().CHECKS.some(c=>c.id==="ct_process"),false),mcp=tryv(()=>MCPX.tools.some(t=>t.n==="run_feature_contract"),false),dbt=tryv(()=>typeof DEBT.add==="function",false);
const ok=b=>b?pill_("Live","good"):pill_("Not connected","warn");
const rows=[["Design time","Claude Code sub-agents","agents/oukala-process-architect.md, oukala-data-integrator.md, oukala-metrics-maturity-steward.md, oukala-connectivity-steward.md","A builder or vibe-coding session calls them while it designs; they search the registries first.",pill_("Files in the repo","info")],
["Design time","Skill oukala-feature-contract","skills/oukala-feature-contract/SKILL.md","Orchestrates the four agents, fills the checklist and produces the contract report.",pill_("Files in the repo","info")],
["Design time","MCP tool run_feature_contract","AI and coding clients screen","The coding client calls the same checks on a draft manifest before it writes code.",ok(mcp)],
["Publish gate","Conformance checks ct_process, ct_data, ct_metrics, ct_links","Citizen apps screen","Block certification from the team tier up. Personal apps see them as advice.",ok(gate)],
["Publish gate","Build a module review step","Build a module screen","The same four checks run on the draft; Register stays disabled until they pass or an exception is raised.",ok(gate)],
["Publish gate","Waivers","This screen, Exceptions tab","A waiver with an expiry replaces a failure for up to 90 days and becomes a debt item.",ok(dbt)],
["Runtime","Retrofit matrix","Matrix tab","Every screen, module and citizen app is re-scored from the live registries whenever they change.",pill_("Live","good")],
["Runtime","Metrics m_contract_*","Metrics screen","Coverage, full-contract share, open gaps, waivers and time to close, each with a formula and remediation.",pill_("Live","good")],
["Runtime","Findings to the debt ledger","Technical debt screen","Stale gaps are sent to the debt ledger as findings with an owner.",ok(dbt)]];
const pushed=Object.keys(C.pushed||{}).length;
return`<p class="muted small">Where each check runs. The same four rules are enforced three times so a feature cannot skip them by choosing a different path in.</p>
 <div class="tscroll"><table><thead><tr><th>Stage</th><th>Check</th><th>Where</th><th>What it does</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${E(r[0])}</b></td><td>${E(r[1])}</td><td class="small">${E(r[2])}</td><td class="small">${E(r[3])}</td><td>${r[4]}</td></tr>`).join("")}</tbody></table></div>
 <div style="margin-top:14px">${card("Send stale gaps to the debt ledger","Gaps open for 21 days or more become debt findings (contract_finding) so they are owned and priced.",`<div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn primary" data-ct-act="push">Send stale gaps to Technical debt</button><span class="small muted">${pushed} already sent. Each is sent once.</span></div>`)}</div>`}
/* feature drawer */
function openFeature(id){
const ev=evaluate(id);if(!ev){toast("Unknown feature","warn");return}
C.sel=id;const dec=C.decisions[id];
const act=ev.kind==="screen"?`<button class="btn" data-ct-go="${E(id)}">Open the screen</button>`:ev.kind==="module"?`<button class="btn" data-ct-map="${E(id)}">Show on the map</button>`:`<button class="btn" data-ct-go="plat_gate">Open Citizen apps</button>`;
const body=`<div class="eyebrow">Feature contract · ${E(ev.kind)}</div><h2 style="margin:2px 0 4px">${E(ev.name)}</h2>
 <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">${lvPill(ev)}${pill_(ev.score+" of 4","metric")}${pill_(ev.area,"mute")}<span class="small muted">Owner ${typeof pchip==="function"&&window.DIR&&DIR.some(d=>d.name===ev.owner)?pchip(ev.owner):E(ev.owner)}</span></div>
 <div class="dfullgrid">${ev.rules.map((r,i)=>`<section class="card glass ct-fr"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${i+1}. ${E(r.n)}</b>${st_(r)}</div><p class="small" style="margin:6px 0">${E(r.ev)}</p>${r.st!=="pass"&&r.st!=="waived"?`<p class="small"><b>Fix.</b> ${E(r.fix)}</p>`:""}${r.st==="gap"||r.st==="partial"?`<button class="btn quiet" data-ct-waive="${E(id)}:${r.id}">Request a waiver</button>`:""}${r.refs&&r.refs[0]&&r.id==="process"?`<button class="btn quiet" data-ct-proc="${E(r.refs[0])}">Open the process</button>`:""}${r.ents&&r.ents[0]&&r.id==="data"?`<button class="btn quiet" data-ct-ent="${E(r.ents[0])}">Open in the atlas</button>`:""}</section>`).join("")}</div>
 ${foundationBlock(id)}
 ${dec?`<div class="ct-ex" style="margin-top:12px"><b>Integration decision</b><div class="small">${E(dec.decision)}${dec.entity?" "+E(dec.entity):""}. ${E(dec.why)}</div></div>`:""}
 <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn primary" data-ct-run="${E(id)}">Run the agents on this</button>${act}</div>`;
openDrawer(tTxt(body))}
/* screen */
function screenFn(){
if(!C.wired)wire();
const s=stats(),worst=s.features-s.fullContract;
const story=`<b>${s.fullContract} of ${s.features}</b> screens, modules and citizen apps meet all four rules today; <b>${s.openGaps}</b> rule gaps are open and <b>${s.waivers}</b> are waived. Every new feature must bring a process model, a data model with an integration decision, metrics with a maturity record, and its connections to the rest of the app. The same checks run when you design (agents), when you publish (gate and MCP) and while it runs (this matrix).`;
const extra=`<div class="row">${typeof fchip==="function"?fchip("m_contract_cov")+fchip("m_contract_full")+fchip("m_contract_gaps"):""}<button class="btn primary" data-ct-tab="4">Run on a feature</button></div>`;
return tTxt(`<div class="screen">${hero("Platform","Every feature carries its process, data, metrics and connections",story,extra)}${lensNote()}${views("contract",["Dashboard","Matrix","The four rules","Agents","Run on a feature","Exceptions","Enforcement"],[dashPane(),matrixPane(),rulesPane(),agentsPane(),runPane(),excPane(),enfPane()])}${procCard("plat_contract")}</div>`)}
REG("plat_contract","Feature contract","platform","M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM8.5 12l2.5 2.5 4.5-5",screenFn);
PROC.reg("plat_contract",{title:"How a feature earns its place in the platform",std:["togaf","cmmi","dmbok"],steps:[
{n:"Propose the feature",d:"The builder (a person or a coding agent) names the feature, its owner and its purpose, and searches the registry before designing anything.",who:"human",owner:"Feature owner",sla:"1 day",in:"Idea",out:"Draft manifest"},
{n:"Design agents run",d:"The process architect, data integrator, metrics and maturity steward and connectivity steward each draft their part. Fixes are suggestions; a person accepts.",who:"agent",owner:"Feature contract orchestrator",sla:"15 minutes",in:"Draft manifest",out:"Contract report and fixes"},
{n:"Gate",d:"Checks ct_process, ct_data, ct_metrics and ct_links run with the other conformance checks. Failing blocks from the team tier up; an exception needs an owner and an expiry.",who:"gate",owner:"Platform team",sla:"1 day",in:"Contract report",out:"Pass, blocked or waived"},
{n:"Publish",d:"Entities, process, metrics and module flows are registered in one step. Findings and waivers become debt items.",who:"robot",owner:"Robot",sla:"Immediate",in:"Gate decision",out:"Registered feature"},
{n:"Review",d:"The matrix re-scores the feature as the registries change. Owners close gaps from the worklist; waivers are reviewed 30 days before they expire.",who:"human",owner:"Feature owner",sla:"Each quarter",in:"Matrix result",out:"Closed gaps or renewed waiver"}]});
/* registering the contract's own records (deferred until the other modules have loaded) */
const W=(C.w=C.w||{ent:false,mod:false,proc:false,seed:false});
C.entDecisions=C.entDecisions||[];
function wire(){
try{
if(!W.ent&&window.ATLAS&&ATLAS.addEntity){
const fld=(k,label,type,cls,req)=>({k,label,type,authority:"platform",classification:cls||"internal",req:!!req});
const defs=[
{id:"contract_finding",label:"Contract finding",domain:"plat",source:"Feature contract",ownerApp:"plat_contract",ownerMod:"plat_contract",status:"live",note:"One observation that a feature does not meet one of the four rules. Thin record; a stale finding links to a debt item rather than copying it.",
fields:[fld("feature_id","Feature","ref","internal",1),fld("feature_kind","Kind","enum"),fld("rule_id","Rule","enum","internal",1),fld("state","State","enum","internal",1),fld("evidence","Evidence","text"),fld("remediation","Remediation","text"),fld("owner","Owner","ref","personal"),fld("opened_at","Opened","date"),fld("closed_at","Closed","date"),fld("debt_item_id","Debt item","ref")],
decision:"New, thin. debt_item prices and tracks remediation work; a finding is an observation that may never become debt, and carries feature and rule keys that debt_item has no field for. It references debt_item by id instead of copying severity or effort.",
searched:"debt_item, exception, audit_event, app_manifest"},
{id:"contract_waiver",label:"Contract waiver",domain:"gov",source:"Feature contract",ownerApp:"plat_contract",ownerMod:"plat_contract",status:"live",note:"A time-limited waiver of one contract rule for one feature. Approval and expiry reuse the exception entity.",
fields:[fld("feature_id","Feature","ref","internal",1),fld("rule_id","Rule","enum","internal",1),fld("reason","Reason","text","internal",1),fld("owner","Owner","ref","personal",1),fld("approver","Approver","ref","personal"),fld("expires","Expires","date","internal",1),fld("exception_id","Exception","ref"),fld("debt_item_id","Debt item","ref"),fld("status","Status","enum")],
decision:"Extend by reference. exception already carries kind, reason, approver, expires and status, so the approval lifecycle is reused through exception_id. A thin subtype adds only the contract keys (feature and rule) that exception does not have.",
searched:"exception, approval, debt_item"}];
defs.forEach(d=>{const r=tryv(()=>ATLAS.addEntity({id:d.id,label:d.label,domain:d.domain,source:d.source,ownerApp:d.ownerApp,ownerMod:d.ownerMod,status:d.status,note:d.note,fields:d.fields}),null);
if(r&&r.ok!==false)C.entDecisions.push({entity:d.id,decision:d.decision,searched:d.searched,duplicates:(r.duplicates||[]).map(x=>x.existing),warnings:r.warnings||[],at:TODAY})});
C.decisions.plat_contract={decision:"new thin entities, reusing exception and debt_item by reference",entity:"contract_finding, contract_waiver",why:"The registry search found exception and debt_item, which cover approval and remediation; only the feature and rule keys were missing.",by:"Platform lead",at:TODAY};
W.ent=true}
if(!W.mod&&window.MODMAP&&MODMAP.addModule&&(!window.ATLAS||W.ent)){
const r=tryv(()=>MODMAP.addModule({id:"plat_contract",name:"Feature contract",sn:"Feature contract",band:"plt",own:"Platform lead",proposed:false,
r:["process_definition","metric_definition","maturity_capability","debt_item","app_manifest","exception"],w:["contract_finding","contract_waiver"],
flows:[{dir:"pull",other:"flw_design",data:"Process definitions and steps",entity:"process_definition",mode:"api",trig:"Contract evaluated"},
{dir:"pull",other:"plat_reg",data:"Entity and metric definitions",entity:"metric_definition",mode:"api",trig:"Contract evaluated"},
{dir:"pull",other:"exe_mat",data:"Process maturity records",entity:"maturity_capability",mode:"api",trig:"Contract evaluated"},
{dir:"pull",other:"plat_gate",data:"Module and app manifests",entity:"app_manifest",mode:"api",trig:"Manifest published"},
{dir:"pull",other:"ppl_org",data:"Owners and teams",entity:"person",mode:"api",trig:"Owner lookup"},
{dir:"push",other:"plat_debt",data:"Contract findings for stale gaps",entity:"contract_finding",mode:"event",trig:"Gap open 21 days"},
{dir:"push",other:"plat_gate",data:"Contract check results and waivers",entity:"contract_waiver",mode:"api",trig:"Gate run"},
{dir:"push",other:"flw_appr",data:"Waiver approval requests",entity:"approval",mode:"human",trig:"Waiver requested"},
{dir:"push",other:"adm_audit",data:"Contract decisions and accepted fixes",entity:"audit_event",mode:"event",trig:"Fix accepted"},
{dir:"push",other:"chat_home",data:"Gap and expiry notifications to owners",entity:"notification",mode:"event",trig:"Waiver within 30 days of expiry"}]}),null);
if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=true}
if(!W.proc&&window.PROCLIB&&PROCLIB.addProcess&&W.mod){
const own=tryv(()=>PROCLIB.get("plat_gate").owner,"")||"Platform lead";
const st=(n,d,who,owner,sla,i,o)=>({n,d,who,owner,sla,in:i,out:o});
const r=tryv(()=>PROCLIB.addProcess({id:"feature_contract",name:"Feature contract",module:"plat_contract",family:tryv(()=>PROCLIB.get("plat_gate").family,undefined),owner:own,trigger:"A person or coding agent proposes a feature",
steps:[st("Propose feature","Name the feature, owner and purpose; search the registry first.","human",own,"1 day","Idea","Draft manifest"),st("Design agents run","Process, data, metrics and connectivity agents draft their parts.","agent","Feature contract orchestrator","15 minutes","Draft manifest","Contract report"),st("Gate","Checks ct_process, ct_data, ct_metrics and ct_links decide; an exception needs an owner and an expiry.","gate","Platform team","1 day","Contract report","Gate decision"),st("Publish","Entities, process, metrics and flows are registered together.","robot","Platform","Immediate","Gate decision","Registered feature"),st("Review","The matrix re-scores the feature; owners close gaps.","human",own,"Each quarter","Matrix result","Closed gaps")],
inputs:["Draft manifest"],outputs:["Registered feature","Contract report"],entities:["contract_finding","contract_waiver","process_definition","metric_definition"],metrics:["m_contract_cov","m_contract_full","m_contract_gaps","m_contract_waivers","m_contract_ttc"],model:"cmmi"}),null);
if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=true}
if(!W.seed&&W.mod){
if(!C.waivers.length){
const mx=matrix().filter(r=>r.kind!=="app"&&r.by.links.st==="gap");
const mk=(r,rule,off,reason,own)=>{const f=r;const exp=iso(off);const debt=tryv(()=>DEBT.add({type:"ooc",title:f.name+": contract waiver for "+RB[rule].n,sev:"Medium",source:"exception",apps:[],owner:f.owner,owner2:own,steward:"Data council chair",principal:8,exp,reason,status:"accepted",fix:"Waived until "+exp}),"DB-X");C.waivers.push({id:"w"+(C.waivers.length+1),feature:f.id,name:f.name,rule,reason,owner:own,exp,debt,at:iso(-20)})};
if(mx[0])mk(mx[0],"links",24,"The feeding module is being rebuilt in November; flows will be added with that release.","Priya Shah");
if(mx[1])mk(mx[1],"links",71,"Read-only reference screen; no downstream consumers until the Q1 reporting release.","Dev Rao")}
if(!C.runs.length){[["Invoice approval","inv",3,iso(-3),"Run on a feature"],["Facilities work orders","manifest",4,iso(-5),"MCP tool run_feature_contract"],["Budget tracker","ca_budget",1.5,iso(-9),"Build a module review"],["Grant tracker","manifest",1,iso(-12),"MCP tool run_feature_contract"]].forEach(q=>{const sum={};AGENTS.forEach((a,i)=>sum[a.id]=[1+(i%2),q[2]>=4?0:1]);C.runs.push({at:q[3],feature:q[0],id:q[1],score:q[2],via:q[4],sum})})}
W.seed=true;bust()}
}catch(e){console.error("contract wire",e)}
C.wired=W.ent&&W.mod&&W.proc&&W.seed;
if(C.wired&&window.MODMAP&&MODMAP.refresh)tryv(()=>MODMAP.refresh())}
setTimeout(wire,600);setTimeout(wire,2500);
/* events */
let TM=null;
const reduced=()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}};
function paintRun(){const o=document.querySelector("[data-ct-runout]");if(o)o.innerHTML=tTxt(runOut())}
function startRun(){
const R=C.run;let t=R.mode==="manifest"?null:R.target;R.err="";
if(R.mode==="manifest"){try{t=JSON.parse(R.text||"")}catch(e){R.err="That is not valid JSON: "+e.message;render();return}if(!t||typeof t!=="object"){R.err="The manifest must be a JSON object.";render();return}}
else if(!t){toast("Pick a feature first","warn");return}
R.res=run(t);R.shown=0;clearInterval(TM);
audit("Feature contract run",R.res.ev.name+": "+R.res.ev.score+" of 4");
if(reduced()){R.shown=R.res.steps.length;paintRun();return}
paintRun();TM=setInterval(()=>{R.shown++;paintRun();if(R.shown>=R.res.steps.length){clearInterval(TM);toast(R.res.ev.pass?"Contract met":"Contract: "+R.res.ev.gaps.length+" gap"+(R.res.ev.gaps.length===1?"":"s"),R.res.ev.pass?"good":"warn")}},520)}
function waiveForm(pre){
const mx=matrix(),ids=mx.filter(r=>r.gaps.length);let [fid,rid]=String(pre||"").split(":");
openForm({id:"ct_waive",title:"Request a contract waiver",story:"A waiver lets a feature ship without one rule for a limited time. It becomes a debt item with an owner and an expiry, and the check fails again when it lapses.",submit:"Request waiver",
fields:[{section:"What is waived"},{k:"feature",label:"Feature",type:"select",req:true,opts:ids.map(r=>[r.id,r.name+" ("+r.kind+")"])},{k:"rule",label:"Rule",type:"chips",req:true,opts:RULES.map(r=>[r.id,r.n])},{section:"Why and who"},{k:"reason",label:"Why the rule cannot be met now, and what covers the risk",type:"longtext",req:true,help:"Name the control that covers the risk while the rule is open."},{k:"owner",label:"Owner who answers for it",type:"people",req:true},{k:"exp",label:"Expires",type:"date",req:true,help:"90 days at most."}],
defaults:{feature:fid||(ids[0]||{}).id,rule:rid||"links",exp:iso(60)},
live:v=>{const d=v.exp?dd(TODAY,v.exp):0;const r=ids.find(q=>q.id===v.feature);const st=r&&v.rule?r.by[v.rule].st:"";return`<p class="story small">${st==="pass"?"That rule is already met, so no waiver is needed. ":""}${d>90?"<b>"+d+" days is over the 90 day limit.</b> Choose an earlier date. ":d>0?"Waived for <b>"+d+" days</b>, then the check fails again. ":""}A debt item is created with this expiry.</p>`},
onSubmit:v=>{const r=ids.find(q=>q.id===v.feature);if(!r){toast("Pick a feature with a gap","warn");return}const d=dd(TODAY,v.exp);if(d<=0||d>90){toast("The expiry must be within 90 days from today","warn");return}if(r.by[v.rule].st==="pass"){toast("That rule is already met","warn");return}
const debt=tryv(()=>DEBT.add({type:"ooc",title:r.name+": contract waiver for "+RB[v.rule].n,sev:"Medium",source:"exception",apps:r.kind==="app"?[r.id]:[],owner:r.owner,owner2:v.owner,steward:"Data council chair",principal:8,exp:v.exp,reason:v.reason,status:"accepted",fix:"Waived until "+v.exp}),"DB-X");
C.waivers.push({id:"w"+(C.waivers.length+1),feature:r.id,name:r.name,rule:v.rule,reason:v.reason,owner:v.owner,exp:v.exp,debt,at:TODAY});bust();audit("Contract waiver requested",r.name+": "+RB[v.rule].n+" until "+v.exp+" ("+debt+")");toast("Waiver recorded as "+debt,"good");closeDrawer();render()}})}
function sendFindings(){
C.pushed=C.pushed||{};let n=0;
gapRows().filter(g=>g.age>=21&&!C.pushed[g.id]).slice(0,12).forEach(g=>{const id=tryv(()=>DEBT.add({type:"ooc",title:g.feature+": contract rule not met ("+g.rule+")",sev:"Medium",source:"contract",apps:g.kind==="app"?[g.fid]:[],owner:g.owner,steward:"Platform lead",principal:4,fix:g.fix,note:"Sent by the Feature contract after "+g.age+" days open."}),null);if(id){C.pushed[g.id]=id;n++}});
audit("Contract findings sent to Technical debt",n+" findings");toast(n?n+" findings sent to the debt ledger":"Nothing new to send","good");render()}
document.addEventListener("click",e=>{
let t;
if(t=e.target.closest("[data-ct-tab]")){S.v.contract=+t.dataset.ctTab;render();return}
if(t=e.target.closest("[data-ct-open]")){closeDrawer&&0;openFeature(t.dataset.ctOpen);return}
if(t=e.target.closest("[data-ct-go]")){closeDrawer();go(t.dataset.ctGo);return}
if(t=e.target.closest("[data-ct-map]")){closeDrawer();if(window.MODMAP&&MODMAP.select)MODMAP.select(t.dataset.ctMap,"proc");else go("plat_map");return}
if(t=e.target.closest("[data-ct-proc]")){closeDrawer();if(window.PROCLIB&&PROCLIB.open)PROCLIB.open(t.dataset.ctProc);return}
if(t=e.target.closest("[data-ct-ent]")){closeDrawer();if(window.ATLAS&&ATLAS.focus)ATLAS.focus(t.dataset.ctEnt);else go("plat_data");return}
if(t=e.target.closest("[data-ct-agent]")){const el=document.getElementById("ct-ag-"+t.dataset.ctAgent);S.v.contract=3;render();setTimeout(()=>{const q=document.getElementById("ct-ag-"+t.dataset.ctAgent);if(q)q.scrollIntoView({behavior:"smooth",block:"center"})},80);return}
if(t=e.target.closest("[data-ct-run]")){closeDrawer();C.run.mode="feature";C.run.target=t.dataset.ctRun;S.v.contract=4;render();setTimeout(startRun,60);return}
if(t=e.target.closest("[data-ct-mode]")){C.run.mode=t.dataset.ctMode;if(C.run.mode==="manifest"&&!C.run.text)C.run.text=JSON.stringify(SAMPLE_BAD,null,2);C.run.res=null;render();return}
if(t=e.target.closest("[data-ct-waive]")){closeDrawer();waiveForm(t.dataset.ctWaive);return}
if(t=e.target.closest("[data-ct-revoke]")){const w=C.waivers.find(q=>q.id===t.dataset.ctRevoke);if(w){w.revoked=true;bust();audit("Contract waiver revoked",w.name+": "+RB[w.rule].n);toast("Waiver revoked; the rule applies again","good");render()}return}
if(t=e.target.closest("[data-ct-skip]")){const [i,j]=t.dataset.ctSkip.split(":").map(Number);const p=C.run.res&&C.run.res.steps[i].props[j];if(p){p.skipped=true;t.closest(".ct-prop").remove();toast("Left as a suggestion","good")}return}
if(t=e.target.closest("[data-ct-accept]")){const [i,j]=t.dataset.ctAccept.split(":").map(Number),res=C.run.res,p=res&&res.steps[i].props[j];if(!p)return;
if(!applyProposal(res,p))return;p.accepted=true;
let tgt=res.target==="manifest"?null:res.target;if(res.target==="manifest"){try{tgt=JSON.parse(C.run.text)}catch(x){return}}
const acc=res.steps.flatMap(s=>s.props.filter(q=>q.accepted).map(q=>q.title));const nr=run(tgt,{quiet:true,via:res.via});C.run.res=nr;C.run.shown=nr.steps.length;C.run.acc=(C.run.acc||[]).concat(p.title);
toast(res.target==="manifest"?"Applied to the manifest. Re-checked.":"Applied to the registries. Re-checked.","good");render();return}
if(t=e.target.closest("[data-ct-copy]")){const txt=C.run.res?reportText(C.run.res):"";try{navigator.clipboard.writeText(txt).then(()=>toast("Report copied","good"),()=>toast("Copy blocked by the browser","warn"))}catch(x){toast("Copy blocked by the browser","warn")}return}
if(t=e.target.closest("[data-ct-act]")){const a=t.dataset.ctAct;
if(a==="run")startRun();
else if(a==="good"){C.run.text=JSON.stringify(SAMPLE_GOOD,null,2);C.run.res=null;render()}
else if(a==="bad"){C.run.text=JSON.stringify(SAMPLE_BAD,null,2);C.run.res=null;render()}
else if(a==="push")sendFindings();
else if(a==="mcp"){S.v.mcp=2;go("plat_mcp");try{S.gate.con.tool="run_feature_contract";S.gate.con.args={};S.gate.conOut=null;render()}catch(x){}}
return}
});
document.addEventListener("input",e=>{const t=e.target.closest("[data-ct-text]");if(t)C.run.text=t.value});
document.addEventListener("change",e=>{const t=e.target.closest("[data-ct-target]");if(t){C.run.target=t.value;C.run.res=null;paintRun()}});
/* search and chat */
SEARCHX.push(()=>{const o=[{g:"Platform",t:"Feature contract",m:"Four rules, retrofit matrix, agents",c:"--p4",f:()=>{S.v.contract=0;go("plat_contract")},k:"feature contract rules process model data model metrics maturity interconnectivity retrofit gate agents skills"}];
RULES.forEach((r,i)=>o.push({g:"Feature contract",t:"Rule "+(i+1)+": "+r.n,m:"Feature contract",c:"--p4",f:()=>{S.v.contract=2;go("plat_contract")},k:r.short+" "+r.chk}));
AGENTS.forEach(a=>o.push({g:"Feature contract",t:a.n+" (agent)",m:a.id,c:"--p4",f:()=>{S.v.contract=3;go("plat_contract")},k:a.purpose+" "+a.id}));
o.push({g:"Feature contract",t:"Contract waivers and exceptions",m:"Expiry via the debt ledger",c:"--p4",f:()=>{S.v.contract=5;go("plat_contract")},k:"waiver exception contract expiry debt"});
o.push({g:"Feature contract",t:"Run the feature contract on a feature or manifest",m:"Agents in sequence",c:"--p4",f:()=>{S.v.contract=4;go("plat_contract")},k:"run agents check manifest contract report mcp run_feature_contract"});
return o});
function findFeature(q){const x=ctx(),t=String(q||"").toLowerCase().replace(/[?.!]/g,"").replace(/\b(the|a|an|screen|module|feature|app)\b/g,"").trim();if(!t)return null;
return x.feats.find(f=>f.id.toLowerCase()===t)||x.feats.find(f=>f.name.toLowerCase()===t)||x.feats.find(f=>f.name.toLowerCase().indexOf(t)>=0)||x.feats.find(f=>t.indexOf(f.name.toLowerCase())>=0&&f.name.length>=5)||null}
ASKX.push(q=>{
const t=q.toLowerCase();let m;
if((m=t.match(/(?:run|check|evaluate|test)\s+(?:the\s+)?(?:feature\s+)?contract\s+(?:on|for)\s+(.+)$/))||(m=t.match(/(?:does|is)\s+(.+?)\s+(?:meet|pass|comply with|follow)\s+(?:the\s+)?(?:feature\s+)?contract/))){
const f=findFeature(m[1]);if(!f){say(q,{t:"I could not find a feature called “"+E(m[1])+"”. Try a screen name such as Master schedule or a citizen app such as Budget tracker.",steps:["Searched screens, modules and citizen apps"]});return true}
C.run.mode="feature";C.run.target=f.id;S.v.contract=4;go("plat_contract");setTimeout(startRun,120);const ev=evaluate(f.id);
say(q,{t:"<b>"+E(f.name)+"</b> scores "+ev.score+" of 4 ("+E(ev.level)+"). "+(ev.gaps.length?"Open: "+ev.gaps.map(g=>E(g.n)).join(", ")+".":"All four rules are met.")+" I opened the agents run so you can accept fixes.",steps:["Looked up the feature","Evaluated the four rules against the registries","Opened Run on a feature"]});return true}
if(/(which|what|list|show).*(feature|screen|module|app).*(fail|miss|gap|worst|non.?compliant|below).*contract|worst.*contract|contract.*(worst|offenders)/.test(t)){
const w=matrix().slice().sort((a,b)=>a.score-b.score).slice(0,5);S.v.contract=0;go("plat_contract");
say(q,{t:"Lowest contract scores: "+w.map(r=>E(r.name)+" ("+r.score+"/4)").join(", ")+".",steps:["Scored every screen, module and citizen app","Opened the Feature contract dashboard"]});return true}
if(/contract.*(waiver|exception)|(waiver|exception).*contract/.test(t)){S.v.contract=5;go("plat_contract");const s=stats();say(q,{t:s.waivers+" contract waiver"+(s.waivers===1?" is":"s are")+" active. Each is a debt item with an owner and an expiry of at most 90 days.",steps:["Opened Exceptions"]});return true}
if(/(four|4) rules|build rules|feature contract rules|standing rules/.test(t)){S.v.contract=2;go("plat_contract");say(q,{t:"Every feature must have: <b>1.</b> an editable process model, <b>2.</b> a data model with a recorded reuse, extend or new decision, <b>3.</b> metrics with a maturity record, <b>4.</b> interconnectivity with the rest of the app. The gate and the MCP tool enforce them.",steps:["Opened The four rules"]});return true}
if(/feature contract|contract (coverage|compliance|gaps|matrix|status)|retrofit/.test(t)){const s=stats();S.v.contract=0;go("plat_contract");say(q,{t:"Contract coverage is "+s.coveragePct+"%: "+s.fullContract+" of "+s.features+" features meet all four rules, with "+s.openGaps+" open gaps and "+s.waivers+" waivers.",steps:["Opened the Feature contract dashboard"]});return true}
return false});
/* CL-59: foundation checks ct_reuse, ct_tenant, ct_people (Platform rules Part 3, decision 3) ---------- Rules 6 to 8 of the contract. */
const FRULES=[
{id:"reuse",chk:"ct_reuse",n:"Reuse of screens and components",rules:"R1 to R4, R7",short:"The screen declares its archetype, records which existing screen it was compared with, shows its process through the designer and uses the shared components."},
{id:"tenant",chk:"ct_tenant",n:"Tenant-aware by construction",rules:"R16 to R20",short:"The screen reads its records through the tenant data layer (DATA) and uses tenant vocabulary, so every tenant sees its own data and no other."},
{id:"people",chk:"ct_people",n:"People, chat and step conventions",rules:"R13, R13a, R21",short:"Owners render through ownerChip, conversations use the one platform chat, and every step is human, robot or agent."}];
const FB={};FRULES.forEach(r=>FB[r.id]=r);
const ARCH=["Dashboard-first list","Record detail drawer","360 view","Board","Designer canvas","Intake form","Approval inbox","Report"];
C.decl=C.decl||{};
function declare(id,o){if(!id||!o)return null;const a=o.archetype&&ARCH.find(x=>x.toLowerCase()===String(o.archetype).toLowerCase());
if(o.archetype&&!a)throw new Error("Unknown archetype "+o.archetype+". Use one of: "+ARCH.join(", ")+", or propose a new one for review.");
C.decl[id]=Object.assign({},C.decl[id]||{},a?{archetype:a}:{},o.compared?{compared:arrS(o.compared).filter(Boolean)}:{},o.note!=null?{note:String(o.note)}:{},{by:o.by||"Platform lead",at:TODAY});
bust();return C.decl[id]}
const FX=()=>window.SRCFACTS||{files:{},screens:{}};
function factsOf(id){const F=FX();const file=F.screens[id]||tryv(()=>SCRMAP_DATA.screens[id].f,null);return{file,x:file?F.files[file]||null:null}}
const LEGACY=/^(auto|automatic|fn|function)$/i;
function fScreen(id){
const d=C.decl[id]||{},fc=factsOf(id),x=fc.x,src=fc.file?" ("+fc.file+")":"";
const proc=!!tryv(()=>PROC.defs[id],null),cmp=arrS(d.compared);
/* ct_reuse */
const ru=(d.archetype?"Archetype: "+d.archetype:"No archetype declared")+"; "+(cmp.length?"compared with "+cmp.slice(0,3).join(", "):"no comparison with an existing screen recorded")+"; "+(proc?"its process strip opens the workflow designer":"no PROC.reg, so no process strip that opens the designer")+(x?"; the file that registers it"+src+" makes "+x.shared+" shared component call"+(x.shared===1?"":"s")+" and builds "+x.table+" table"+(x.table===1?"":"s")+" by hand":"; no source facts for it")+".";
const rfix="Declare the archetype and the screen it was compared with (CONTRACT.declare or the Declare button), register PROC.reg so procCard opens the designer, and use btHTML, views and openForm instead of hand-built tables and tabs.";
const reuse=d.archetype&&cmp.length&&proc?R_("pass",ru):(d.archetype||proc||(x&&x.shared>0))?R_("partial",ru,rfix):R_("gap",ru,rfix);
/* ct_tenant */
const mode=tryv(()=>DATA.screenMode(id),"core"),tu="Tenant mode "+mode+(mode==="data"?" (reads through DATA)":mode==="tenant"?" (follows the tenant through SCN or TENANT, not yet DATA)":" (shows the core sample tenant under every tenant)")+(x?"; the file"+src+" has "+x.dget+" DATA reads and "+x.dterm+" vocabulary lookups":"")+".";
const tfix="Read records with DATA.get, declare the screen with DATA.screen(id,{mode:\"data\",entities}), and take industry nouns from DATA.term.";
const tenant=mode==="data"?R_("pass",tu):(mode==="tenant"||(x&&(x.dget>0||x.dterm>0)))?R_("partial",tu,tfix):R_("gap",tu,tfix);
/* ct_people */
let people;const pfix="Render every owner, backup, approver, assignee, sponsor, requester and reviewer with ownerChip (pairs with ownerChip.pair), open conversations through CHATADDR, and use STEPMODE for step kinds (human, robot, agent).";
if(!x)people=R_("partial","No source facts for the file that registers this screen, so owner rendering was not measured.",pfix);
else{const chips=x.chip+x.pchip,pu=x.chip+" ownerChip and "+x.pchip+" person chip calls, "+x.plain+" plain-text owner field"+(x.plain===1?"":"s")+" and "+x.legacy+" legacy step kind"+(x.legacy===1?"":"s")+" in "+fc.file+".";
people=!x.plain&&!x.legacy?R_("pass",pu):chips>0?R_("partial",pu,pfix):R_("gap",pu,pfix)}
return{reuse,tenant,people}}
function fManifest(m){
m=m||{};const ru=m.reuse||{},te=m.tenant||{},pe=m.people||{},steps=arrS(m.process&&m.process.steps);
const arch=ru.archetype&&ARCH.some(a=>a.toLowerCase()===String(ru.archetype).toLowerCase()),cmp=arrS(ru.compared);
const reuse=arch&&cmp.length?R_("pass","Archetype "+ru.archetype+"; compared with "+cmp.slice(0,3).join(", ")+"."):arch||cmp.length?R_("partial",(arch?"Archetype "+ru.archetype+", but no comparison recorded.":"A comparison is recorded, but no archetype from the pattern library is declared."),"Declare reuse.archetype (one of "+ARCH.join(", ")+") and reuse.compared (the screens it was compared with)."):R_("gap","No archetype and no comparison with existing screens in the manifest.","Add a reuse section: {archetype, compared:[screen ids]}.");
const tenant=te.dataLayer&&te.vocabulary!==false?R_("pass","Reads through the tenant data layer"+(te.vocabulary?" and uses tenant vocabulary":"")+"."):te.dataLayer?R_("partial","Reads through the tenant data layer, but declares hard-coded vocabulary.","Take industry nouns from DATA.term."):R_("gap","No statement that the app reads through the tenant data layer.","Add tenant:{dataLayer:true, vocabulary:true}; reads go through DATA.get.");
const bad=steps.filter(s=>LEGACY.test(String(s.who||""))).length,own=pe.ownerChip===true,chat=pe.chat==null||pe.chat==="platform";
const pu=(own?"Owners render through ownerChip":"No statement that owners render through ownerChip")+"; "+(chat?"chat uses the platform service":"declares its own chat or comment box")+"; "+(bad?bad+" step"+(bad===1?"":"s")+" use a retired kind (Automatic or Function)":"every step is human, robot, agent or a gate")+".";
const people=own&&chat&&!bad?R_("pass",pu):(own||chat)&&!(bad&&!own)?R_("partial",pu,"Set people:{ownerChip:true, chat:\"platform\"} and make every step human, robot or agent."):R_("gap",pu,"Set people:{ownerChip:true, chat:\"platform\"} and make every step human, robot or agent.");
return{reuse,tenant,people}}
function foundation(id){
const x=ctx(),f=typeof id==="object"&&id?null:x.feats.find(q=>q.id===id);
let raw;if(!f)raw=fManifest(id);else if(f.kind==="app"){const a=f.app;raw=fManifest(a.contract||APPCON[a.id]||deriveApp(a))}else if(f.kind==="screen")raw=fScreen(f.id);else return null;
const fid=f?f.id:"manifest";const arr=FRULES.map(r=>Object.assign({id:r.id,chk:r.chk,n:r.n,rules:r.rules},applyWaiver(fid,r.id,raw[r.id])));
return{id:fid,name:f?f.name:(id&&id.name)||"Draft manifest",kind:f?f.kind:"draft",rules:arr,by:rules2obj(arr),pass:arr.every(r=>r.st==="pass"||r.st==="waived"),
blocks:f&&f.kind==="app"?["team","enterprise"].indexOf(f.app.tier)>=0||f.app.status==="certified":f?false:true}}
let FMX=null,FMXK="";
function foundationMatrix(){ctx();const k=CXK+"|"+Object.keys(C.decl).length+"|"+C.waivers.length+"|"+tryv(()=>DATA.screens().filter(s=>s.mode!=="core").length,0);
if(FMX&&FMXK===k)return FMX;FMX=ctx().feats.filter(f=>f.kind!=="module").map(f=>{try{const r=foundation(f.id);return r?Object.assign(r,{area:f.area,file:f.kind==="screen"?factsOf(f.id).file||"":""}):null}catch(e){return null}}).filter(Boolean);FMXK=k;return FMX}
function foundationStats(){const mx=foundationMatrix().filter(r=>r.kind==="screen");const o={screens:mx.length,all:mx.filter(r=>r.pass).length};
FRULES.forEach(r=>{o[r.id]={pass:0,partial:0,gap:0,waived:0};mx.forEach(x=>o[r.id][x.by[r.id].st]++)});return o}
function foundationBlock(id){const fv=tryv(()=>foundation(id),null);if(!fv)return"";
return`<h3 class="ct-h4" style="margin-top:14px">Foundation checks (rules 6 to 8)</h3><p class="small muted">${fv.kind==="app"?"These block promotion from the team tier up.":"Reported in the retrofit matrix; existing screens are scored, not blocked, and no compliance date is set yet."}</p>
 <div class="dfullgrid">${fv.rules.map((r,i)=>`<section class="card glass ct-fr"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${i+6}. ${E(r.n)}</b>${pill_(STL[r.st][0],STL[r.st][1])}</div><p class="small muted" style="margin:2px 0">${E(r.chk)} · ${E(r.rules)}</p><p class="small" style="margin:6px 0">${E(r.ev)}</p>${r.st!=="pass"&&r.st!=="waived"?`<p class="small"><b>Fix.</b> ${E(r.fix)}</p>`:""}${r.id==="reuse"&&fv.kind==="screen"?`<button class="btn quiet" data-ct-decl="${E(id)}">Declare archetype and comparison</button>`:""}${r.st==="gap"||r.st==="partial"?`<button class="btn quiet" data-ct-waive="${E(id)}:${r.id}">Request a waiver</button>`:""}</section>`).join("")}</div>`}
function declareForm(id){const nm=tryv(()=>SCREENS.find(s=>s[0]===id)[1],id),d=C.decl[id]||{};
openForm({id:"ct_decl",title:"Declare archetype: "+nm,story:"Rule R2: every screen is an instance of a named archetype, and R3: a new screen says which existing screen it was compared with. The retrofit matrix re-scores the screen as soon as you save.",submit:"Save the declaration",
fields:[{k:"archetype",label:"Archetype",type:"select",req:true,opts:ARCH,help:"From the screen pattern library. If none fits, propose a new archetype for review instead of building a one-off."},
{k:"compared",label:"Compared with",type:"multi",req:true,opts:tryv(()=>SCREENS.filter(s=>s[0]!==id).map(s=>[s[0],s[1]]),[]),help:"The existing screens this one was compared with before it was kept as its own screen."},
{k:"note",label:"Why it is its own screen",type:"longtext",ph:"What the compared screens could not show as a tab, filter or drawer"}],
defaults:{archetype:d.archetype||"",compared:d.compared||[],note:d.note||""},
onSubmit:v=>{try{declare(id,{archetype:v.archetype,compared:v.compared,note:v.note,by:tryv(()=>S.user||PERSONAS[S.persona].name,"Platform lead")})}catch(e){toast(e.message,"bad");return}
audit("Declared screen archetype",nm+": "+v.archetype);toast("Declaration saved; the matrix re-scored "+nm,"good");closeDrawer();render()}})}
function retrofitFn(){
if(!C.wired)wire();
const s=foundationStats(),mx=foundationMatrix(),apps=mx.filter(r=>r.kind==="app"),blocked=apps.filter(r=>r.blocks&&!r.pass).length;
const story=`<b>${s.all} of ${s.screens}</b> screens pass all three foundation checks today. ${s.reuse.pass} declare an archetype and a comparison, ${s.tenant.pass} read through the tenant data layer and ${s.people.pass} render owners only through the owner chip. Existing screens are scored here first; no compliance date is set (decision 7).${TROWS.core()?"":" Scores are platform facts; owners are people of "+E(TROWS.org())+"."} New and changed citizen apps are blocked from the team tier up when a check fails (${blocked} of ${apps.length} apps are blocked today).`;
const kp=typeof kpiRow==="function"?kpiRow([["Screens scored",s.screens,"every registered screen",{keep:true}],["Pass all three",s.all,s.screens?Math.round(100*s.all/s.screens)+"% of screens":"",{keep:true}],["ct_reuse met",s.reuse.pass,s.reuse.partial+" partly met, "+s.reuse.gap+" gaps",{keep:true}],["ct_tenant met",s.tenant.pass,s.tenant.partial+" partly met, "+s.tenant.gap+" gaps",{keep:true}],["ct_people met",s.people.pass,s.people.partial+" partly met, "+s.people.gap+" gaps",{keep:true}],["Apps blocked",blocked,"team tier and up",{keep:true}]]):"";
const cell=k=>r=>`<span class="pill ${STL[r[k]][1]}">${STL[r[k]][0]}</span>`;
const rows=()=>foundationMatrix().map(r=>({id:r.id,name:r.name,kind:r.kind==="app"?"Citizen app":"Screen",area:r.area,file:r.file||"",reuse:r.by.reuse.st,tenant:r.by.tenant.st,people:r.by.people.st,met:r.rules.filter(x=>x.st==="pass"||x.st==="waived").length,gate:r.kind==="app"?(r.blocks?(r.pass?"Passes":"Blocked"):"Advice only (personal tier)"):"Reported, not blocked"}));
const tbl=typeof btHTML==="function"?btHTML({id:"ct_retro",key:"id",h:560,rowH:46,facets:["kind","area","reuse","tenant","people","gate"],groupBy:["kind","area"],exportName:"retrofit-matrix",sort:{k:"met",d:1},
cols:[{k:"name",label:"Screen or app",wrap:true,fmt:r=>`<b>${E(r.name)}</b> <span class="small muted">${E(r.id)}</span>`},{k:"reuse",label:"6 Reuse",fmt:cell("reuse"),val:r=>r.reuse},{k:"tenant",label:"7 Tenant",fmt:cell("tenant"),val:r=>r.tenant},{k:"people",label:"8 People",fmt:cell("people"),val:r=>r.people},{k:"met",label:"Met",fmt:r=>`<span class="num">${r.met}/3</span>`},{k:"gate",label:"Gate",wrap:true},{k:"file",label:"Source file",wrap:true},{k:"area",label:"Area",wrap:true}],rows,open:id=>openFeature(id)}):"";
const how=card("How each check is scored","Evidence is read from the live registries and from the source facts file; open a row for the evidence on one screen",`<div class="grid g3" style="gap:12px">${FRULES.map((r,i)=>`<section class="ct-ex"><b>${i+6}. ${E(r.n)}</b><div class="small muted">${E(r.chk)} · ${E(r.rules)}</div><p class="small" style="margin:6px 0 0">${E(r.short)}</p></section>`).join("")}</div><p class="small muted" style="margin-top:10px">Met: every part holds. Partly met: some evidence (for example a process strip, shared components, a tenant mode of "tenant", or owner chips beside plain-text owners). Gap: none. Source facts come from <code>src/mod_s_facts.js</code>, generated by <code>tools/lint/facts.js</code> (prototype fact for the build it was generated from).</p>`);
const extra=`<div class="row"><button class="btn" data-ct-go="plat_contract">Open the Feature contract</button><button class="btn quiet" data-ct-go="plat_gate">Open Citizen apps</button></div>`;
return tTxt(`<div class="screen">${hero("Platform","Retrofit matrix: reuse, tenant and people checks on every screen",story,extra)}${lensNote()}${kp}<div style="margin-top:16px">${card("Every screen and citizen app","Facets filter by check and state; open a row for evidence and fixes",tbl+`<div class="legend" role="note"><span><i class="ct-sw ct-s-pass"></i>Met</span><span><i class="ct-sw ct-s-partial"></i>Partly met</span><span><i class="ct-sw ct-s-waived"></i>Waived by exception</span><span><i class="ct-sw ct-s-gap"></i>Gap</span></div>`)}</div><div style="margin-top:16px">${how}</div>${procCard("plat_retrofit")}</div>`)}
REG("plat_retrofit","Retrofit matrix","platform","M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14",retrofitFn);TROWS.mode(["plat_contract","plat_retrofit"],["role_assignments","people"]);
PROC.reg("plat_retrofit",{title:"How an existing screen is brought onto the foundation",std:["cmmi","togaf"],steps:[
{n:"Score",d:"The matrix scores every screen on reuse, tenant and people from the registries and the source facts.",who:"robot",owner:"Platform lead",sla:"On every change",in:"Registries, source facts",out:"Scores per screen"},
{n:"Declare",d:"The screen owner declares the archetype and the screen it was compared with.",who:"human",owner:"Screen owner",sla:"5 days",in:"Gap on ct_reuse",out:"Declaration"},
{n:"Migrate",d:"Reads move to DATA, owners to ownerChip, step kinds to STEPMODE.",who:"human",owner:"Screen owner",sla:"Per sprint",in:"Gap on ct_tenant or ct_people",out:"Changed screen"},
{n:"Gate",d:"New and changed citizen apps are blocked from the team tier up until the three checks pass or a waiver with an expiry is approved.",who:"gate",owner:"Platform team",sla:"1 day",in:"Scores",out:"Pass, blocked or waived"}]});
tryv(()=>NAVX.add("plat_retrofit",{group:"plat",label:"Retrofit matrix",hint:"Reuse, tenant and people checks on every screen",sub:"Retrofit matrix",kw:"retrofit matrix foundation checks ct_reuse ct_tenant ct_people archetype tenant aware owner chip step modes compliance"}));
SEARCHX.push(()=>[{g:"Platform",t:"Retrofit matrix",m:"Reuse, tenant and people checks",c:"--p4",f:()=>go("plat_retrofit"),k:"retrofit matrix foundation checks ct_reuse ct_tenant ct_people archetype tenant owner chip"}]);
ASKX.push(q=>{const t=q.toLowerCase();if(!/retrofit|foundation check|ct_reuse|ct_tenant|ct_people|(which|how many) screens.*(tenant|archetype|owner chip)/.test(t))return false;
const s=foundationStats();go("plat_retrofit");say(q,{t:"<b>"+s.all+" of "+s.screens+"</b> screens pass all three foundation checks. Reuse: "+s.reuse.pass+" met; tenant: "+s.tenant.pass+" met; people: "+s.people.pass+" met. No compliance date is set yet.",steps:["Scored every screen","Opened the Retrofit matrix"]});return true});
ROUTER.on("click",e=>{const t=e.target.closest&&e.target.closest("[data-ct-decl]");if(!t)return;declareForm(t.dataset.ctDecl)});
/* public API */
window.CONTRACT={rules:RULES,agents:AGENTS,evaluate,matrix,run,stats,evaluateManifest,fromDraft,plugGate,plugMcp,runTool,naming,features:()=>ctx().feats.slice(),decisions:()=>C.entDecisions.slice(),waivers:()=>C.waivers.slice(),refresh:bust,sample:{good:SAMPLE_GOOD,bad:SAMPLE_BAD},
foundationRules:FRULES,tenantText:tTxt,archetypes:ARCH,declare,declarations:()=>Object.assign({},C.decl),foundation,foundationMatrix,foundationStats};
})();

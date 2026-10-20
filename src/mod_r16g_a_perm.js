/* ===== mod_r16g_a_perm: ONE global nested permission model (window.PERM).
   Three nested scopes: (1) table/entity, screen, section, action; (2) row (condition expressions on record fields);
   (3) attribute/field (write, read, masked, hidden). Deny by default for sensitive classes. Rules are data (S.r16g.rules / S.r16g.fields),
   edited on the Permissions screen, persisted through STORE, announced on EVENTS (permission.changed, access.denied, data.revealed).
   Evaluator API: PERM.can(user, action, resource, record?)  PERM.fields(user, entity, record?)  PERM.rows(user, entity).
   `user` may be a persona key, a person name, a principal object, or null for the current viewer. Pure: only PERM.enforce/require log.
   GUARD (mod_r15f3_iam) stays as the capability layer; GUARD.can/require are re-pointed here so legacy callers get the nested decision too. */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const E=U.esc;
const TODAY="2026-10-06";
const P=S.r16g=S.r16g||{rules:[],fields:[],hist:[],log:[],enforce:true,seedVer:0,sim:"",nx:{r:1,f:1,l:1,c:1}};
const SEEDVER=3;

/* ---------------- roles, personas, groups, permission sets ---------------- */
const ROLES=[
 {id:"employee",n:"Employee",adm:"",d:"Baseline for anyone on the payroll: own records, service portal, knowledge."},
 {id:"new_hire",n:"New hire",adm:"",d:"Employee in the first 90 days: first-week plan and onboarding tasks."},
 {id:"people_manager",n:"People manager",adm:"",d:"Holds direct reports; sees performance, PTO and access of the reporting chain only."},
 {id:"hr",n:"People Operations",adm:"",d:"HR partners: performance, pay, PTO and lifecycle for everyone, every reveal is logged."},
 {id:"executive",n:"Executive",adm:"exec",d:"CIO and executive office: decisions, budgets and reports."},
 {id:"finance_approver",n:"Finance approver",adm:"finance",d:"Controller and AP: invoices, budgets, funding decisions."},
 {id:"portfolio_lead",n:"Portfolio lead",adm:"portfolio",d:"Chooses and tracks the portfolio; ranks budget requests."},
 {id:"project_manager",n:"Project manager",adm:"pm",d:"Delivers projects; raises budget requests; sees staffing load."},
 {id:"service_desk",n:"Service desk",adm:"desk",d:"Frontline operations: incidents, requests, knowledge. No people, pay or budget data."},
 {id:"change_manager",n:"Change manager",adm:"change",d:"Runs the change advisory board and release calendar."},
 {id:"architect",n:"Architect",adm:"arch",d:"Data model, integrations, technology records."},
 {id:"platform_admin",n:"Platform admin",adm:"admin",d:"Configures the platform; has no business-data authority by default."},
 {id:"security",n:"Security",adm:"",d:"Security lead and analysts: access reviews and permission changes."},
 {id:"auditor",n:"Auditor",adm:"audit",d:"Read-only evidence; restricted data stays masked."},
 {id:"board_member",n:"Board member",adm:"",d:"Reads the board pack and oversight dashboards."},
 {id:"vendor_guest",n:"Vendor guest",adm:"guest",d:"External; sees only what is shared with the vendor."},
 {id:"ai_agent",n:"AI agent service",adm:"agent",d:"Service identity; every write needs a named human approver."}];
const PERSONA_ROLES={exec:["executive","people_manager","employee"],fin:["finance_approver","employee"],pm:["project_manager","employee"],ops:["service_desk","employee"],portfolio:["portfolio_lead","people_manager","employee"],change:["change_manager","employee"],arch:["architect","employee"],admin:["platform_admin","employee"],audit:["auditor"],board:["board_member"],guest:["vendor_guest"],emp:["employee"],newhire:["new_hire","employee"]};
const PERSONA_USER={exec:"Casey Rowan",fin:"Avery Chen",pm:"Priya Shah",ops:"Tom Becker",portfolio:"Maya Ortiz",change:"Nia Brooks",arch:"Jordan Lee",admin:"Sam Patel",audit:"Rina Okafor",board:"Board member",guest:"Vendor guest",emp:"Casey Rowan",newhire:"Rosa Delgado"};
const ROLES_ONLY={emp:1,newhire:1,audit:1,board:1,guest:1};
const ADM2ROLE={exec:"executive",finance:"finance_approver",portfolio:"portfolio_lead",pm:"project_manager",desk:"service_desk",change:"change_manager",arch:"architect",admin:"platform_admin",audit:"auditor",guest:"vendor_guest",agent:"ai_agent"};
const SET2ROLE={"PS-HR":"hr","PS-AP":"finance_approver","PS-BUD":"finance_approver","PS-AUD":"auditor","PS-MGR":"people_manager","PS-CFG":"platform_admin"};
/* approver groups: approvals route to a GROUP, never a person */
const GROUPS=[
 {id:"GRP-BUD",n:"Budget approvers (delegation of authority)",roles:["finance_approver","executive"],users:["Avery Chen","Marcus Reid","Casey Rowan"],sets:["PS-BUD"],owner:"Avery Chen"},
 {id:"GRP-FINREV",n:"Finance review group",roles:["finance_approver","executive"],users:["Avery Chen","Victor Amaya"],sets:[],owner:"Avery Chen"},
 {id:"GRP-ARCH",n:"Architecture and security review group",roles:["architect","security","executive"],users:["Jordan Lee","Rina Okafor"],sets:[],owner:"Jordan Lee"},
 {id:"GRP-PORT",n:"Portfolio council",roles:["portfolio_lead","executive"],users:["Maya Ortiz","Casey Rowan"],sets:[],owner:"Maya Ortiz"},
 {id:"GRP-AP",n:"Payables approvers",roles:["finance_approver"],users:["Avery Chen","Noelle Park","Dana Whitfield"],sets:["PS-AP"],owner:"Avery Chen"},
 {id:"GRP-CAB",n:"Change advisory board",roles:["change_manager","architect","executive"],users:["Nia Brooks","Jordan Lee"],sets:[],owner:"Nia Brooks"},
 {id:"GRP-SEC",n:"Security approvers",roles:["security","platform_admin"],users:["Rina Okafor","Colette Brandt","Sam Patel"],sets:["PS-CFG"],owner:"Rina Okafor"},
 {id:"GRP-HR",n:"People Operations",roles:["hr"],users:["Joanna Pierce","Grace Whitfield"],sets:["PS-HR"],owner:"Joanna Pierce"},
 {id:"GRP-MGR",n:"People managers (reporting chain)",roles:["people_manager","hr"],users:[],sets:["PS-MGR"],owner:"Joanna Pierce"},
 {id:"GRP-GEN",n:"Approvers (any approval authority)",roles:["finance_approver","executive","portfolio_lead","change_manager","architect","platform_admin","security","hr","people_manager"],users:[],sets:[],owner:"Rina Okafor"}];
/* PR-20: budget requests, changes, invoices and catalog approvals resolve through ONE source, APG.route (mod_r16h_c_groups).
   These entries are adapters: they return the legacy GRP-* id of the group APG routes to, so old callers keep working. */
const routeOf=(res,r)=>G(()=>W.APG&&APG.route?APG.route(res==="approval"&&r&&r.kind?r.kind:res,r||{}):null,null);
const viaRoute=(res,fb)=>r=>{const ro=routeOf(res,r);return ro?ro.legacy:fb(r)};
const APPROVER_OF={budget_request:viaRoute("budget_request",r=>({cnc:"GRP-PORT",val:"GRP-PORT",fin:"GRP-FINREV",arc:"GRP-ARCH",dec:"GRP-BUD"}[r&&r.stage]||"GRP-BUD")),budget_line:()=>"GRP-BUD",budget_adjustment:()=>"GRP-BUD",invoice:viaRoute("invoice",()=>"GRP-AP"),payment:viaRoute("payment",()=>"GRP-AP"),change_request:viaRoute("change_request",()=>"GRP-CAB"),pto_request:()=>"GRP-MGR",timesheet:()=>"GRP-MGR",access_review:()=>"GRP-SEC",access_request:()=>"GRP-SEC",permission_change:()=>"GRP-SEC",approval:r=>{const ro=r&&r.kind?routeOf("approval",r):null;return ro?ro.legacy:"GRP-GEN"}};
const SETS_EXTRA=[{id:"PS-MGR",n:"People manager",caps:["view"],d:"Performance, PTO and access of your direct reports only.",owner:"Joanna Pierce",risk:"med"}];

/* ---------------- classifications ---------------- */
const CLS=["public","internal","personal","confidential","restricted"];
const rank=c=>Math.max(0,CLS.indexOf(c||"internal"));
const SENS_ENT=/^(person$|budget_|invoice|payment|compensation|benefit|pto_|perf_|access_|permission|field_rule|payroll|contract_line|ast_contract|bank|salary|timesheet|requisition|purchase_order|sod_|cost_rate|approval$)/;
const RESTR_ENT=/^(compensation|benefit|pto_|perf_|payroll|salary|bank|cost_rate)/;
const _ec={};let _ecN=-1;
function entityClass(e){const t=G(()=>DATAMODEL.tables,{});const n=Object.keys(t).length;if(n!==_ecN){_ecN=n;Object.keys(_ec).forEach(k=>delete _ec[k])}
 if(_ec[e])return _ec[e];let m=1;const tb=t[e];if(tb)(tb.fields||[]).forEach(f=>{const r=rank(f.classification||f.cls);if(r>m)m=r});
 if(SENS_ENT.test(e)&&m<3)m=3;if(RESTR_ENT.test(e))m=4;return _ec[e]=CLS[m]}
const entSensitive=e=>rank(entityClass(e))>=3;
/* synthetic attribute catalog for entities whose screens show fields not in the data model */
const FIELDS={
 person:[["name","Name","internal"],["title","Title","internal"],["team","Team","internal"],["manager","Manager","internal"],["email","Email","personal"],["location","Location","personal"],["skills","Skills","internal"],["load","Workload percent","confidential"],["rating","Performance rating","restricted"],["goals","Goals and review notes","restricted"],["salary","Base salary","restricted"],["bonus","Bonus target","restricted"],["grade","Pay grade","restricted"],["rate","Cost rate","confidential"],["pto_balance","PTO balance","restricted"],["pto_reason","Time-off reason","restricted"],["access_roles","Access roles","confidential"],["health","Health and leave type","restricted"]],
 budget_request:[["title","Title","internal"],["requester","Requester","internal"],["amount","Amount","confidential"],["cost_center","Cost center","internal"],["score","Value score","internal"],["stage","Stage","internal"],["decision_note","Decision note","confidential"]],
 invoice:[["number","Invoice number","internal"],["vendor","Vendor","internal"],["amount","Amount","confidential"],["bank_account","Bank account","restricted"],["advisor_note","Advisor note","confidential"]]};
const entFields=e=>{const t=G(()=>DATAMODEL.tables[e],null);const base=t?(t.fields||[]).map(f=>[f.k,f.label||f.k,f.classification||f.cls||"internal"]):[];const ex=FIELDS[e]||[];const exk=new Set(ex.map(f=>f[0]));return ex.concat(base.filter(f=>!exk.has(f[0])))};
const MODE=["hidden","masked","read","write"];const mrank=m=>Math.max(0,MODE.indexOf(m));

/* ---------------- people graph ---------------- */
const DIRN=()=>G(()=>DIR,[]);
let _g=null,_gn=-1;
function graph(){const d=DIRN();if(_g&&_gn===d.length)return _g;const by={},kids={};d.forEach(x=>{by[x.name]=x;if(x.mgr)(kids[x.mgr]=kids[x.mgr]||[]).push(x.name)});_g={by,kids};_gn=d.length;return _g}
function reportsOf(n,deep){const g=graph();const out=[];const walk=(x,d0)=>(g.kids[x]||[]).forEach(k=>{if(out.indexOf(k)<0){out.push(k);if(deep)walk(k,d0+1)}});walk(n,0);return out}
const upOf=n=>{const g=graph();const o=[];let x=g.by[n];let c=0;while(x&&x.mgr&&c++<12){o.push(x.mgr);x=g.by[x.mgr]}return o};

/* ---------------- principals ---------------- */
const CLEAR={executive:3,finance_approver:3,hr:3,auditor:3,platform_admin:3,security:3,portfolio_lead:2,project_manager:2,service_desk:2,change_manager:2,architect:2,employee:1,new_hire:1,people_manager:2,board_member:2,vendor_guest:0,ai_agent:1};
function finish(p){p.roles=[...new Set(p.roles)];
 const sets=G(()=>GUARD.state.grants.filter(g=>g.person===p.user&&!g.revoked&&(!g.exp||g.exp>=TODAY)).map(g=>g.set),[]);
 if(!p.rolesOnly||p.id==="__user__")sets.forEach(s=>{if(SET2ROLE[s])p.roles.push(SET2ROLE[s])});p.sets=sets;p.roles=[...new Set(p.roles)];
 p.groups=GROUPS.filter(g=>g.roles.some(r=>p.roles.indexOf(r)>=0)&&(g.id!=="GRP-HR"||p.roles.indexOf("hr")>=0)||(!p.rolesOnly&&g.users.indexOf(p.user)>=0&&p.persona!=="emp")||g.sets.some(s=>sets.indexOf(s)>=0)).map(g=>g.id);
 const me=graph().by[p.user];p.unit=me?me.team:"";p.costCenters=me?[me.team]:[];p.vendor=p.roles.indexOf("vendor_guest")>=0?"Lumen":"";
 p.clearance=Math.max.apply(null,p.roles.map(r=>CLEAR[r]==null?1:CLEAR[r]));p.name=p.user;
 const mgr=p.roles.indexOf("people_manager")>=0;p.reports=mgr?reportsOf(p.user,false):[];p.chain=mgr?reportsOf(p.user,true):[];
 return p}
const _pc={};
function principalFor(key){if(_pc[key]&&_pc[key].v===P.nx.c)return _pc[key].p;const roles=(PERSONA_ROLES[key]||["employee"]).slice();const p=finish({id:key,persona:key,user:PERSONA_USER[key]||"Casey Rowan",roles,rolesOnly:!!ROLES_ONLY[key]});_pc[key]={v:P.nx.c,p};return p}
const EXTRA={"Dana Whitfield":{team:"Finance",role:"AP lead",roles:["finance_approver"]}};
const TITLE_ROLES=[[/controller|ap lead|accounts payable|finance and budget|chief financial|procurement/i,"finance_approver"],[/architect/i,"architect"],[/service desk|support analyst|operations engineer|av and operations/i,"service_desk"],[/project manager|scrum master/i,"project_manager"],[/portfolio lead/i,"portfolio_lead"],[/change manager|release coordinator/i,"change_manager"],[/chief executive|chief information|general counsel/i,"executive"],[/people operations|training lead/i,"hr"],[/security/i,"security"],[/platform engineer|identity engineer/i,"platform_admin"]];
function principalOfUser(name){const g=graph().by[name]||EXTRA[name];const roles=[];
 const rid=G(()=>GUARD.roleOf(name).id,"guest");
 if(rid!=="guest"&&ADM2ROLE[rid])roles.push(ADM2ROLE[rid]);
 if(EXTRA[name])EXTRA[name].roles.forEach(r=>roles.push(r));
 if(g&&!roles.length){const t=(g.role||"")+" "+(g.team||"");TITLE_ROLES.forEach(x=>{if(x[0].test(t))roles.push(x[1])})}
 if(g&&/people operations/i.test(g.team||"")&&roles.indexOf("hr")<0)roles.push("hr");
 if(g&&/security/i.test(g.team||"")&&roles.indexOf("security")<0)roles.push("security");
 if(g)roles.push("employee");else if(!roles.length)roles.push("vendor_guest");
 const mgr=reportsOf(name,false).length>0&&roles.some(r=>r==="executive"||r==="portfolio_lead");if(mgr)roles.push("people_manager");
 return finish({id:"__user__",persona:"",user:name,roles,rolesOnly:false})}
let _ovr=null;
function current(){if(_ovr)return _ovr;const a=G(()=>GUARD.state.actAs,"");if(a)return principalOfUser(a);return principalFor(G(()=>S.persona,"exec"))}
function resolveUser(u){if(!u)return current();if(typeof u==="object"&&u.roles)return u;if(PERSONA_ROLES[u])return principalFor(u);return principalOfUser(String(u))}
function as(u,fn){const prev=_ovr;_ovr=resolveUser(u);try{return fn(_ovr)}finally{_ovr=prev}}

/* ---------------- expression language (rows) ---------------- */
const UNK={unk:1};
function tok(src){const t=[];let i=0;const s=String(src);while(i<s.length){const c=s[i];if(/\s/.test(c)){i++;continue}
  if(c==="'"||c==='"'){let j=i+1;while(j<s.length&&s[j]!==c)j++;t.push({t:"s",v:s.slice(i+1,j)});i=j+1;continue}
  const m=/^(\d+(\.\d+)?)/.exec(s.slice(i));if(m){t.push({t:"n",v:+m[1]});i+=m[1].length;continue}
  const id=/^[A-Za-z_][\w.]*/.exec(s.slice(i));if(id){const w=id[0];t.push({t:/^(and|or|not|in|true|false|null)$/.test(w)?"k":"i",v:w});i+=w.length;continue}
  const op=/^(&&|\|\||==|!=|<=|>=|<|>|!|\(|\)|,|\[|\])/.exec(s.slice(i));if(op){t.push({t:"o",v:op[1]});i+=op[1].length;continue}
  throw new Error("Unexpected "+c+" at "+i)}return t}
const _ast={};
function parse(src){if(_ast[src])return _ast[src];const t=tok(src);let p=0;const pk=()=>t[p],nx=()=>t[p++];
 const isOp=v=>pk()&&((pk().t==="o"||pk().t==="k")&&pk().v===v);
 function or(){let l=and();while(isOp("||")||isOp("or")){nx();l={o:"or",l,r:and()}}return l}
 function and(){let l=nt();while(isOp("&&")||isOp("and")){nx();l={o:"and",l,r:nt()}}return l}
 function nt(){if(isOp("!")||isOp("not")){nx();return{o:"not",e:nt()}}return cmp()}
 function cmp(){let l=atom();if(pk()&&pk().t==="o"&&/^(==|!=|<=|>=|<|>)$/.test(pk().v)){const op=nx().v;return{o:op,l,r:atom()}}if(isOp("in")){nx();return{o:"in",l,r:atom()}}return l}
 function atom(){const x=nx();if(!x)throw new Error("Unexpected end");if(x.t==="s"||x.t==="n")return{o:"lit",v:x.v};if(x.t==="k"){if(x.v==="true")return{o:"lit",v:true};if(x.v==="false")return{o:"lit",v:false};if(x.v==="null")return{o:"lit",v:null}}
  if(x.v==="("){const e=or();nx();return e}
  if(x.v==="["){const a=[];while(pk()&&pk().v!=="]"){a.push(atom());if(isOp(","))nx()}nx();return{o:"arr",a}}
  if(x.t==="i"){if(isOp("(")){nx();const a=[];while(pk()&&pk().v!==")"){a.push(or());if(isOp(","))nx()}nx();return{o:"call",f:x.v,a}}return{o:"path",v:x.v}}
  throw new Error("Bad token "+x.v)}
 const ast=or();if(p<t.length)throw new Error("Trailing input");return _ast[src]=ast}
const subj=r=>r?(r.person||r.employee||r.owner||r.requester||""):"";
const BUILTIN={
 own:(env)=>{const r=env.record;if(!r)return UNK;const u=env.user.user;return !!u&&(r.person===u||r.employee===u||r.owner===u||r.requester===u||r.createdBy===u)},
 directReport:(env)=>{const r=env.record;if(!r)return UNK;return env.user.reports.indexOf(subj(r))>=0},
 inChain:(env)=>{const r=env.record;if(!r)return UNK;return env.user.chain.indexOf(subj(r))>=0},
 sameUnit:(env)=>{const r=env.record;if(!r)return UNK;return !!env.user.unit&&r.orgUnit===env.user.unit},
 inGroup:(env,g)=>env.user.groups.indexOf(g)>=0,
 hasRole:(env,r)=>env.user.roles.indexOf(r)>=0,
 hasSet:(env,s)=>env.user.sets.indexOf(s)>=0,
 cleared:(env)=>{const r=env.record;if(!r)return UNK;const need={public:0,internal:1,personal:1,confidential:2,restricted:3}[r.classification||"internal"];return env.user.clearance>=need}};
function ev(n,env){switch(n.o){
 case"lit":return n.v;case"arr":return n.a.map(x=>ev(x,env));
 case"path":{const p=n.v.split(".");const root=p[0];let v;if(root==="record"){if(!env.record)return UNK;v=env.record}else if(root==="user")v=env.user;else if(root==="ctx")v=env.ctx||{};else return UNK;for(let i=1;i<p.length;i++){if(v==null)return null;v=v[p[i]]}return v===undefined?null:v}
 case"call":{const f=BUILTIN[n.f];if(!f)return UNK;return f.apply(null,[env].concat(n.a.map(x=>ev(x,env))))}
 case"not":{const v=ev(n.e,env);return v===UNK?UNK:!v}
 case"and":{const a=ev(n.l,env),b=ev(n.r,env);if(a===false||b===false)return false;if(a===UNK||b===UNK)return UNK;return !!(a&&b)}
 case"or":{const a=ev(n.l,env),b=ev(n.r,env);if(a===true||b===true)return true;if(a===UNK||b===UNK)return UNK;return !!(a||b)}
 case"in":{const a=ev(n.l,env),b=ev(n.r,env);if(a===UNK||b===UNK)return UNK;return Array.isArray(b)?b.indexOf(a)>=0:String(b).indexOf(a)>=0}
 default:{const a=ev(n.l,env),b=ev(n.r,env);if(a===UNK||b===UNK)return UNK;switch(n.o){case"==":return a===b;case"!=":return a!==b;case"<":return a<b;case">":return a>b;case"<=":return a<=b;case">=":return a>=b}}}}
function evalWhen(src,user,record,ctx){if(!src||!String(src).trim())return true;try{const v=ev(parse(src),{user,record,ctx});return v===UNK?UNK:!!v}catch(e){return UNK}}
function checkExpr(src){try{parse(src);return{ok:true}}catch(e){return{ok:false,err:e.message}}}

/* ---------------- records ---------------- */
function recordOf(entity,ref){if(ref&&typeof ref==="object")return ref;if(ref==null||ref==="")return null;
 if(entity==="person"||/^(compensation_record|pto_|perf_|timesheet)/.test(entity)){const x=graph().by[ref];return{id:ref,person:ref,employee:ref,owner:ref,orgUnit:x?x.team:"",costCenter:x?x.team:"",classification:"restricted",manager:x?x.mgr:""}}
 if(entity==="budget_request"){const r=G(()=>BUDREQ.requests().find(q=>q.id===ref),null);return r?{id:r.id,requester:r.req,owner:r.req,stage:r.st,amount:r.amt,named:G(()=>BUDREQ.rev(r.st,r).name,""),costCenter:r.cc||r.dept||"",classification:"confidential",project:r.proj}:{id:ref,classification:"confidential"}}
 if(entity==="change_request"){const c=G(()=>ITSMX.getChange(ref),null);return c?{id:c.id,requester:c.req||"",owner:c.own||"",service:c.svc||"",classification:"internal"}:{id:ref}}
 if(entity==="invoice"){const i=G(()=>INVOICES.find(x=>x.id===ref),null);return i?{id:i.id,vendor:i.vendor,owner:i.owner||"",amount:i.amt,classification:"confidential"}:{id:ref,classification:"confidential"}}
 return{id:ref}}

/* ---------------- resources and matching ---------------- */
const kindOf=r=>/^screen:/.test(r)?"screen":/^section:/.test(r)?"section":"entity";
function resMatch(pat,res){if(pat==="*")return true;if(pat===res)return true;if(/^class:/.test(pat))return kindOf(res)==="entity"&&entityClass(res)===pat.slice(6);
 if(/^kind:/.test(pat))return kindOf(res)===pat.slice(5);
 if(pat.slice(-1)==="*")return res.indexOf(pat.slice(0,-1))===0;if(/,/.test(pat))return pat.split(",").indexOf(res)>=0;return false}
function subMatch(user,sub){if(!sub)return false;const rs=sub.roles||[];
 if(rs.length){const neg=rs.filter(x=>x[0]==="!").map(x=>x.slice(1));if(neg.some(r=>user.roles.indexOf(r)>=0))return false;const pos=rs.filter(x=>x[0]!=="!");if(pos.indexOf("*")>=0)return true;if(pos.some(r=>user.roles.indexOf(r)>=0))return true}
 if((sub.groups||[]).some(g=>user.groups.indexOf(g)>=0))return true;if((sub.sets||[]).some(s=>user.sets.indexOf(s)>=0))return true;if((sub.users||[]).indexOf(user.user)>=0&&!user.rolesOnly)return true;return false}
const normAct=(a,kind)=>kind!=="entity"&&(a==="open"||a==="view")?"read":a;

/* ---------------- the decision ---------------- */
function groupMember(user,gid){return user.groups.indexOf(gid)>=0}
function baseline(user,action,res,kind){
 const guest=user.roles.length===1&&user.roles[0]==="vendor_guest";
 if(kind==="screen"){if(P.rules.some(r=>r.res===res&&r.effect!=="deny"))return{ok:false,why:"Screen is limited to the roles named in its rules; none of "+user.user+"'s roles is listed",def:true};return{ok:!guest,why:guest?"Vendor guests only open screens that are shared with them":"No rule for this screen; open to signed-in staff (listed under Gaps)",def:true}}
 if(kind==="section")return{ok:false,why:"Sections are deny by default",def:true};
 const cls=entityClass(res);
 if(action==="read")return rank(cls)<3&&!guest?{ok:true,why:"Default: "+cls+" data is readable by staff",def:true}:{ok:false,why:"Deny by default: "+cls+" data needs an explicit rule",def:true};
 if(action==="create"||action==="update"){const canEdit=user.roles.some(r=>/^(service_desk|project_manager|portfolio_lead|change_manager|architect|platform_admin|executive|finance_approver|hr|security|employee)$/.test(r));return rank(cls)<3&&canEdit&&!guest?{ok:true,why:"Default: staff may "+action+" "+cls+" records",def:true}:{ok:false,why:"Deny by default: "+action+" on "+cls+" data needs an explicit rule",def:true}}
 return{ok:false,why:"Deny by default: "+action+" needs an explicit rule",def:true}}
function decide(user,action,res,rec,opt){opt=opt||{};const kind=kindOf(res);const act=normAct(action,kind);
 const rules=P.rules.filter(r=>r.enabled!==false&&(r.res===res||resMatch(r.res,res))&&(r.act.indexOf(act)>=0||r.act.indexOf("*")>=0)&&subMatch(user,r.sub));
 const trace=[];let cond=false;const conds=[];
 for(const r of rules){if(r.effect!=="deny"||(r.exc&&r.exc.indexOf(res)>=0))continue;const v=evalWhen(r.when,user,rec);if(v===true){trace.push({k:"rule",v:r.id,t:r.name},{k:"scope",v:r.when?"row":kind});return{ok:false,effect:"deny",rule:r,trace,why:r.why||r.name,scope:r.when?"row":kind,res,action:act,user:user.user}}}
 let hit=null;
 for(const r of rules){if(r.effect==="deny")continue;const v=evalWhen(r.when,user,rec);if(v===true){if(!hit||(!r.when&&hit.when))hit=r}else if(v===UNK){cond=true;conds.push(r);if(!hit)hit=hit||null}}
 let out;
 if(hit){const role=ROLES.find(x=>(hit.sub.roles||[]).indexOf(x.id)>=0&&user.roles.indexOf(x.id)>=0);trace.push({k:"role",v:role?role.n:"matched subject"},{k:"rule",v:hit.id,t:hit.name},{k:"scope",v:hit.when?"row":kind});out={ok:true,effect:"allow",rule:hit,why:hit.why||hit.name,scope:hit.when?"row":kind}}
 else if(cond){const r0=conds[0];trace.push({k:"rule",v:r0.id,t:r0.name},{k:"scope",v:"row (needs a record)"});out={ok:true,cond:true,effect:"allow",rule:r0,rules:conds,why:"Allowed on rows where "+conds.map(c=>c.when).join(" or "),scope:"row"}}
 else{const b=baseline(user,act,res,kind);trace.push({k:"default",v:b.ok?"baseline allow":"deny by default"});if(entSensitive(res)&&kind==="entity")trace.push({k:"class",v:entityClass(res)});out={ok:b.ok,effect:b.ok?"allow":"deny",def:true,why:b.why,scope:kind,trace}}
 out.trace=out.trace||trace;out.res=res;out.action=act;out.user=user.user;out.persona=user.persona;
 if(out.ok&&act==="approve"&&kind==="entity"&&APPROVER_OF[res]){const gid=APPROVER_OF[res](rec);const g=GROUPS.find(x=>x.id===gid);out.group=gid;
  /* PR-20: on a known record of a routed kind, the one group model decides (APG): requester never approves own, actor must be a member */
  const ro=rec&&(rec.requester||rec.apg||rec.stage||rec.kind)?routeOf(res,rec):null;
  if(ro&&!user.rolesOnly){out.apg=ro.id;out.trace.push({k:"group",v:ro.name});const c=G(()=>APG.check(user.user,res==="approval"?rec.kind:res,rec),{ok:true});
   if(!c.ok){out.ok=false;out.effect="deny";out.why=c.why;out.scope=c.rule==="sod"?"sod":"group"}}
  else{out.trace.push({k:"group",v:g?g.n:gid});
   if(g&&!groupMember(user,gid)){out.ok=false;out.effect="deny";out.why="Approvals for "+res.replace(/_/g," ")+" are decided by "+g.n+"; "+user.user+" is not a member";out.scope="group"}}}
 return out}
function can(u,action,res,rec){const user=resolveUser(u);const r=typeof rec==="string"||typeof rec==="number"?recordOf(kindOf(res)==="entity"?res:"person",rec):rec;
 const d=decide(user,action,res,r);return P.enforce?d:Object.assign({},d,{ok:true,off:true})}
/* sections of a person record read the person entity row condition */
const secRec=(sec,ref)=>ref?recordOf("person",ref):null;

/* ---------------- audit / events ---------------- */
const stamp=()=>new Date().toLocaleTimeString("en-US",{hour12:false});
function emit(id,pl){G(()=>W.EVENTS&&EVENTS.emit(id,pl,{source:"Permissions",actor:pl.actor||""}))}
function note(entry){entry.id="L-"+String(P.nx.l++).padStart(4,"0");entry.t=stamp();P.log.unshift(entry);if(P.log.length>400)P.log.length=400;persist();return entry}
const _dd={};
function logDenial(user,d,extra){const k=user.user+"|"+d.action+"|"+d.res+"|"+((extra&&extra.rec)||"");const now=Date.now();if(_dd[k]&&now-_dd[k]<1500)return;_dd[k]=now;
 const e=note({type:"deny",who:user.user,persona:user.persona,action:d.action,res:d.res,rec:(extra&&extra.rec)||"",rule:d.rule?d.rule.id:"default",why:d.why,scope:d.scope});
 G(()=>audit("Denied: "+d.action+" "+d.res,user.user+" · "+d.why));emit("access.denied",{actor:user.user,action:d.action,resource:d.res,rule:e.rule,scope:d.scope});return e}
const _rv={};
function logReveal(user,res,rec,what){const k=user.user+"|"+res+"|"+rec+"|"+what;const now=Date.now();if(_rv[k]&&now-_rv[k]<8000)return;_rv[k]=now;
 note({type:"reveal",who:user.user,persona:user.persona,action:"reveal",res,rec:rec||"",rule:"",why:what,scope:"field"});G(()=>audit("Sensitive reveal",user.user+" · "+what+(rec?" · "+rec:"")));emit("data.revealed",{actor:user.user,resource:res,record:rec||"",what})}
/* enforcement entry point: logs the denial and returns a boolean */
function enforce(action,res,rec,label){const user=current();const r=typeof rec==="string"?recordOf(kindOf(res)==="entity"?res:"person",rec):rec;const d=can(user,action,res,r);
 if(d.ok||d.off){if(action==="reveal"||(d.ok&&/^section:person\.(pay|performance|pto|reviews)/.test(res)))logReveal(user,res,typeof rec==="string"?rec:(r&&r.id)||"",label||action+" "+res);return true}
 logDenial(user,d,{rec:typeof rec==="string"?rec:(r&&r.id)||""});return false}
function deniedDrawer(action,res,rec,label){const user=current();const d=can(user,action,res,typeof rec==="string"?recordOf("person",rec):rec);
 const chips=(d.trace||[]).map(t=>`<span class="pm-chip ${t.k}"><small>${E(t.k)}</small>${E(t.t?t.v+" · "+t.t:t.v)}</span>`).join("");
 G(()=>openDrawer(`<div class="pm-den"><div class="eyebrow">Not permitted</div><h2>${E(label||(action+" "+res.replace(/^(screen|section):/,"").replace(/_/g," ")))}</h2><p>${E(d.why||"Your role does not allow this.")}</p><div class="pm-chips">${chips}</div><dl class="pm-kv"><dt>Acting as</dt><dd>${E(user.user)}${user.persona?" · "+E(G(()=>PERSONAS[user.persona].n,user.persona)):""}</dd><dt>Action</dt><dd>${E(d.action)} on ${E(res)}</dd>${d.group?`<dt>Approver group</dt><dd>${E((GROUPS.find(g=>g.id===d.group)||{}).n||d.group)}</dd>`:""}</dl><div class="pm-act"><button class="btn primary" data-pm-explain="${E(user.user)}|${E(action)}|${E(res)}">See how this was decided</button><button class="btn quiet" data-pm-reqperm>Request access</button></div><p class="muted small">This denial is in the audit trail and counted on the Permissions screen.</p></div>`));return false}
function require_(action,res,rec,label){if(enforce(action,res,rec,label))return true;deniedDrawer(action,res,rec,label);return false}

/* ---------------- fields and rows ---------------- */
function fields(u,entity,rec){const user=resolveUser(u);const r=typeof rec==="string"?recordOf(entity,rec):rec;
 const rd=decide(user,"read",entity,r);const up=decide(user,"update",entity,r);const out={};
 entFields(entity).forEach(f=>{const k=f[0],cls=f[2];let base="hidden";
  if(rd.ok){const rk=rank(cls);base=rk>=4?"hidden":rk===3?"masked":"read";if(base==="read"&&up.ok&&(!up.cond||r)&&entity!=="person")base="write"}
  let top=base,bot="write",why=rd.ok?"class "+cls:rd.why,rid="";
  P.fields.forEach(fr=>{if(fr.enabled===false||fr.entity!==entity||!(fr.field==="*"||fr.field===k||(fr.field.slice(-1)==="*"&&k.indexOf(fr.field.slice(0,-1))===0))||!subMatch(user,fr.sub))return;
   if(evalWhen(fr.when,user,r)!==true)return;const cap=fr.effect==="deny"||(!fr.effect&&(fr.mode==="hidden"||fr.mode==="masked"));
   if(cap){if(mrank(fr.mode)<mrank(bot)){bot=fr.mode;why=fr.name||fr.id;rid=fr.id}}
   else if(rd.ok&&mrank(fr.mode)>mrank(top)){top=fr.mode;why=fr.name||fr.id;rid=fr.id}});
  const fin=mrank(top)<mrank(bot)?top:bot;out[k]={mode:fin,label:f[1],cls,why,rule:rid}});
 return out}
function fieldMode(u,entity,field,rec){const f=fields(u,entity,rec)[field];return f?f.mode:"read"}
function maskValue(v,cls){if(v==null)return v;const s=String(v);if(/^\$/.test(s))return"$•••,•••";return"••••••"}
function maskRecord(u,entity,rec){const f=fields(u,entity,rec);const o={};Object.keys(rec||{}).forEach(k=>{const m=f[k]?f[k].mode:"read";if(m==="hidden")return;o[k]=m==="masked"?maskValue(rec[k]):rec[k]});return o}
function rows(u,entity){const user=resolveUser(u);const d=decide(user,"read",entity,null);
 if(!d.ok)return{mode:"none",exprs:[],test:()=>false,text:"No rows",rules:[]};
 const rs=P.rules.filter(r=>r.enabled!==false&&(r.res===entity||resMatch(r.res,entity))&&(r.act.indexOf("read")>=0||r.act.indexOf("*")>=0)&&subMatch(user,r.sub));
 const allows=rs.filter(r=>r.effect!=="deny"),denies=rs.filter(r=>r.effect==="deny"&&r.when);
 const open=allows.some(r=>!r.when)||(d.def&&d.ok);
 const test=rec=>{if(denies.some(r=>evalWhen(r.when,user,rec)===true))return false;if(open)return true;return allows.some(r=>evalWhen(r.when,user,rec)===true)};
 return{mode:open&&!denies.length?"all":"conditional",exprs:open?[]:allows.map(r=>r.when),text:open?(denies.length?"All rows except where "+denies.map(r=>r.when).join(" or "):"All rows"):"Rows where "+allows.map(r=>r.when).join(" or "),test,rules:rs.map(r=>r.id)}}

/* ---------------- seed: rules are data ---------------- */
let _n=0;const rid=()=>"PR-"+String(++_n).padStart(3,"0");
const STAFFB=["*","!vendor_guest"],STAFF=["*","!vendor_guest","!board_member"];
function A(name,roles,res,act,when,why,extra){return Object.assign({id:rid(),name,effect:"allow",sub:{roles},res,act,when:when||"",why:why||name,enabled:true,owner:"Rina Okafor",reviewed:null,created:"2026-10-11",kind:"seed"},extra||{})}
function D(name,roles,res,act,when,why,extra){return Object.assign(A(name,roles,res,act,when,why),{effect:"deny"},extra||{})}
function seedRules(){_n=0;const R=[];
 const ALLACT=["read","create","update","delete","approve","reveal"];
 /* ---- screens ---- */
 const scr=(id,roles,name)=>R.push(A(name||("Open "+id),roles,"screen:"+id,["read"],"","Screen access: "+id,{tier:"screen"}));
 const ids=s=>s.split(/\s+/).filter(Boolean);
 scr("home",["*"]);ids("metrics org_chart trace loop").forEach(i=>scr(i,STAFFB));
 ids("fo inbox meet_hub meet_act meet_dec meet_series flw_appr kcs_viz kcs_home kcs_gap kcs_skills svc_skills ppl_jrny ppl_train r15_time r15_rpt r15_mobile chat_home vault").forEach(i=>scr(i,STAFF));
 ids("svc_portal kcs_ask svc_guides").forEach(i=>scr(i,["*"]));
 ids("svc_cat svc_req").forEach(i=>scr(i,STAFF));
 ids("svc_cat svc_req").forEach(i=>scr(i,["*"]));
 scr("r15d_firstweek",["new_hire","employee","hr","platform_admin"]);
 scr("kcs_edit",["service_desk","architect","platform_admin","change_manager","project_manager","portfolio_lead","hr","executive"]);
 const OPSR=["service_desk","change_manager","architect","platform_admin","project_manager","portfolio_lead","executive","auditor"];
 ids("itsm_home itsm_inc itsm_prb itsm_mi obs_std svc_oncall svc_sla").forEach(i=>scr(i,OPSR));
 scr("itsm_chg",["change_manager","architect","platform_admin","executive","service_desk","auditor","project_manager"]);
 scr("itsm_rel",["change_manager","architect","platform_admin","executive","project_manager","portfolio_lead","auditor"]);
 ids("kg dev_pipe exe_apps itom_cmdb itom_model itom_graph itom_disc itom_health itom_evt obs_dash itom_slo svc_asset svc_360 itom_dev itom_run").forEach(i=>scr(i,["service_desk","architect","platform_admin","change_manager","executive","project_manager","auditor","portfolio_lead"]));
 ids("ims plan ppm_proj ppm_raid ppm_wbs agile_board agile_art").forEach(i=>scr(i,["portfolio_lead","project_manager","executive","architect","finance_approver","auditor","platform_admin","change_manager"]));
 scr("port",["portfolio_lead","project_manager","executive","finance_approver","auditor","board_member"],"Open Demand and priorities");
 ids("ppl_org ppl_meet").forEach(()=>{});
 scr("ppl_cap",["portfolio_lead","project_manager","executive","hr"]);
 /* money: only finance and executive roles see approvals; others read where needed */
 ids("inv fin_color fin_spend fin_gates fin_alloc fin_rules fin_model fin_budget bud_model bud_ccmap itom_fin r15_p2p").forEach(i=>scr(i,["finance_approver","executive","auditor"]));
 ids("bud_over bud_lines bud_doa bud_ven bud_ben tbm_model").forEach(i=>scr(i,["finance_approver","executive","auditor","portfolio_lead"]));
 scr("bud_req",["finance_approver","executive","portfolio_lead","project_manager","architect","auditor","board_member"],"Open Budget requests");
 scr("ppm_sow",["portfolio_lead","project_manager","finance_approver","executive","auditor"]);
 scr("dec_cov",["executive","board_member","auditor"]);
 ids("exe_dash exe_strat exe_scen exe_mat").forEach(i=>scr(i,["executive","board_member","portfolio_lead","finance_approver","auditor"]));
 scr("exe_board",["executive","board_member","auditor"]);scr("exe_risk",["executive","board_member","auditor","platform_admin","security"]);
 scr("r15d_evidence",["auditor","board_member","platform_admin","executive","security"]);
 ids("grc_home grc_risk grc_ctl grc_find grc_pol grc_aud grc_ven grc_exc").forEach(i=>scr(i,["auditor","executive","platform_admin","security","board_member"]));
 scr("adm_audit",["auditor","platform_admin","executive","security"]);
 ids("tower adm_gate").forEach(i=>scr(i,["platform_admin","architect","executive","auditor","board_member"]));
 ids("kcs_prompt kcs_test plat_mcp r15d_agents ai_runtime").forEach(i=>scr(i,["platform_admin","architect","executive","auditor"]));
 ids("flw_design flw_asmt flw_dmn flw_bpmn flw_agent flw_hub svc_notify draw_studio").forEach(i=>scr(i,["platform_admin","architect","change_manager","executive","service_desk"]));
 ids("adm_studio adm_env plat_map nav_studio own_gaps plat_build plat_contract plat_proc plat_reg r15d_facts rec_shell plat_self zevt log plat_store wf_runs r15_sem zl_conn").forEach(i=>scr(i,["platform_admin","architect","executive","auditor"]));
 ids("plat_data plat_data_old plat_fab plat_dmap plat_pmap plat_debt plat_gate").forEach(i=>scr(i,["platform_admin","architect","executive","auditor","project_manager"]));
 scr("adm_meter",["platform_admin","finance_approver","executive"]);
 scr("adm_sec",["platform_admin","security","auditor","executive"]);scr("r15_iam",["platform_admin","security","auditor","executive"]);
 scr("r16g_perm",["platform_admin","security","auditor","executive"],"Open Permissions");
 /* people: pay, PTO and performance are not open to the whole organization */
 scr("ppl_perf",["hr","people_manager"],"Open Performance management (people managers and People Operations)");
 scr("ppl_av",["hr","people_manager","project_manager"]);scr("ppl_org",STAFF);scr("ppl_meet",STAFF);
 R.push(D("Vendor guests see no internal screens",["vendor_guest"],"screen:*",["read"],"","Vendors only reach the portal, knowledge answers and shared items",{tier:"screen",exc:["screen:home","screen:svc_portal","screen:kcs_ask","screen:svc_guides","screen:svc_cat","screen:svc_req"]}));
 /* ---- sections: person drawer and org chart ---- */
 const sec=(id,roles,when,name)=>R.push(A(name||("See "+id),roles,"section:"+id,["read"],when,name,{tier:"section"}));
 const CHAIN="own() or directReport() or inChain()";
 sec("person.performance",["employee"],"own()","Employees read their own performance");sec("person.performance",["people_manager"],"directReport() or inChain()","Managers read the reporting chain");sec("person.performance",["hr"],"","People Operations reads all performance");
 sec("person.reviews",["employee"],"own()","Employees read their own reviews");sec("person.reviews",["people_manager"],"directReport() or inChain()","Managers read the reporting chain");sec("person.reviews",["hr"],"","People Operations reads all reviews");
 sec("person.pay",["employee"],"own()","Employees read their own pay");sec("person.pay",["hr"],"","People Operations reads pay; reveal is logged");
 sec("person.pto",["employee"],"own()","Employees read their own PTO");sec("person.pto",["people_manager"],"directReport() or inChain()","Managers read PTO of the reporting chain");sec("person.pto",["hr"],"","People Operations reads all PTO");
 sec("person.access",["employee"],"own()","Employees read their own access");sec("person.access",["people_manager"],"directReport() or inChain()","Managers read access of the reporting chain");sec("person.access",["hr","security","platform_admin","auditor"],"","Security, People Operations and audit read access");
 sec("person.lifecycle",["hr","executive","platform_admin"],"","Lifecycle actions: hire, move, leave");
 sec("person.time",["employee"],"own()","Employees read their own time");sec("person.time",["people_manager","project_manager","portfolio_lead","hr"],"","Time is read by managers and project managers");
 sec("person.overview",STAFF,"","Everyone on staff sees the overview");sec("person.plate",STAFF,"");sec("person.owns",STAFF,"");sec("person.skills",STAFF,"");sec("person.agents",STAFF,"");sec("person.contracts",STAFF,"");sec("person.capacity",STAFF,"");
 sec("org.lifecycle",["hr","executive","platform_admin"],"","Lifecycle tab on the org chart");sec("org.vacancies",["hr","executive","portfolio_lead","platform_admin"],"","Vacancies");sec("org.sync",["hr","platform_admin","executive"],"","Directory sync");
 R.push(A("Org and report tabs are open to staff",STAFF,"section:org.*",["read"],"","Other org chart tabs",{tier:"section"}));
 /* ---- entities ---- */
 R.push(A("Staff read person records (attributes are field-ruled)",["*","!vendor_guest"],"person",["read"],"","Names, titles and teams are not secret; restricted attributes are field-ruled"));
 R.push(A("Board members read names only",["board_member"],"person",["read"],"","Reads leadership names; attributes stay hidden"));
 R.push(A("People Operations edits person records",["hr"],"person",["create","update"],"","Lifecycle edits"));
 R.push(A("Managers update their reports' goals",["people_manager"],"person",["update"],"directReport()","Managers edit goals of direct reports"));
 R.push(A("Own pay record",["employee"],"compensation_record",["read","reveal"],"own()","See your own pay"));
 R.push(A("People Operations pay",["hr"],"compensation_record",["read","reveal","update"],"","HR reads and edits pay; every reveal is logged"));
 R.push(A("Own PTO",["employee"],"pto_balance,pto_request",["read","create"],"own()","See and request your own PTO"));
 R.push(A("Chain PTO",["people_manager"],"pto_balance,pto_request",["read"],"directReport() or inChain()","Managers read PTO of the chain"));
 R.push(A("Managers decide PTO",["people_manager"],"pto_request",["approve"],"directReport()","Direct manager decides; group People managers"));
 R.push(A("People Operations PTO",["hr"],"pto_balance,pto_request",["read","approve","update"],"","HR reads and decides PTO"));
 R.push(A("Own feedback",["employee"],"perf_feedback",["read"],"own()","Read feedback about you"));
 R.push(A("Give feedback",STAFF,"perf_feedback",["create"],"","Anyone may write feedback (read-back stays restricted)"));
 R.push(A("Chain feedback",["people_manager"],"perf_feedback",["read","update"],"directReport() or inChain()","Managers read and edit the chain"));
 R.push(A("HR feedback",["hr"],"perf_feedback",["read","update"],"","HR reads all feedback"));
 R.push(A("Finance reads budgets",["finance_approver","executive","auditor","board_member"],"budget_request,budget_line,budget_adjustment",["read"],"","Finance, executive, audit and board read budget records"));
 R.push(A("Portfolio reads budgets",["portfolio_lead"],"budget_request,budget_line,budget_adjustment",["read"],"","Portfolio council needs the asks"));
 R.push(A("Requesters read their own asks",["project_manager","architect","employee"],"budget_request",["read","update"],"own()","Requester sees and edits own request"));
 R.push(A("Raise a budget request",["project_manager","architect","portfolio_lead","finance_approver","executive","platform_admin"],"budget_request",["create"],"","Intake"));
 R.push(A("Decide budget requests",["finance_approver","executive","portfolio_lead","architect"],"budget_request",["approve"],"","Decisions go to the stage group"));
 R.push(A("Finance edits budget lines",["finance_approver","executive"],"budget_line,budget_adjustment",["create","update"],"","Reforecast and PO changes"));
 R.push(A("Budget approvers decide lines",["finance_approver","executive"],"budget_line,budget_adjustment",["approve"],"","Delegation of authority"));
 R.push(A("Finance and audit read invoices",["finance_approver","executive","auditor"],"invoice,payment",["read"],"","Payables"));
 R.push(A("Project managers read invoices on their projects",["project_manager"],"invoice",["read"],"record.owner == user.name","Row rule: own projects only"));
 R.push(A("Payables approve",["finance_approver"],"invoice,payment",["approve","update"],"","Payables group"));
 R.push(A("Contracts",["finance_approver","executive","auditor","portfolio_lead","project_manager"],"contract_line,ast_contract",["read"],"","Commercial records"));
 R.push(A("Vendor reads its own contract lines",["vendor_guest"],"contract_line,ast_contract",["read"],"record.vendor == user.vendor","Row rule: shared with the vendor"));
 R.push(A("Operations records",["service_desk","change_manager","architect","platform_admin","project_manager","executive","auditor"],"incident,problem_record,change_request,request_item",["read","create","update"],"","Service operations"));
 R.push(A("Change decisions",["change_manager","architect","executive"],"change_request",["approve"],"","Advisory board"));
 R.push(A("Vendors see their own requests",["vendor_guest"],"request_item,incident",["read","create"],"own()","Row rule: own items"));
 R.push(A("Access reviews",["platform_admin","security","auditor","executive"],"access_review,access_request",["read"],"","Security records"));
 R.push(A("Security decides access",["security","platform_admin"],"access_review,access_request",["approve","update"],"","Security group"));
 R.push(A("Permission model is read by admins",["platform_admin","security","auditor","executive"],"permission,permission_rule,field_rule,role_permission_map",["read"],"","Meta"));
 R.push(A("Permission model is changed through a request",["platform_admin","security"],"permission,permission_rule,field_rule,role_permission_map",["create","update","delete"],"","Changes need Security group approval"));
 R.push(A("Permission change approvals",["security","platform_admin"],"permission_change",["approve","create"],"","Security group"));
 R.push(D("Read-only roles cannot write",["auditor","board_member"],"*",["create","update","delete","approve"],"","Read-only by design"));
 R.push(A("Approvers decide inbox items",["finance_approver","executive","portfolio_lead","change_manager","architect","platform_admin","security","hr","people_manager"],"approval,requisition,po,report",["approve"],"","Approval authority; the group on the item decides"));
 R.push(A("Managers and PMs approve time",["people_manager","project_manager","hr","portfolio_lead"],"timesheet",["approve","read"],"","Time approval"));
 R.push(A("Cost rates for finance and planning",["finance_approver","executive","portfolio_lead","hr","auditor"],"cost_rate",["reveal","read"],"","Cost rates are confidential; reveal is logged"));
 R.push(D("Service desk: no people, pay or budget data",["service_desk"],"compensation_record,benefit_enrollment,pto_balance,pto_request,perf_feedback,payroll_run,cost_rate",["read","reveal","update","approve"],"not own()","Frontline persona: restricted people data only if it is yours"));
 R.push(D("Service desk cannot decide money",["service_desk"],"budget_request,budget_line,budget_adjustment,invoice,payment",["approve","update","create"],"","No budget or payment authority"));
 /* ---- reveal ---- */
 R.push(A("Reveal restricted attributes under audit",["hr","auditor"],"person",["reveal"],"","Every reveal is logged"));
 R.push(D("AI agents write only with a named approver",["ai_agent"],"*",["approve","delete"],"","Agents cannot approve or delete"));
 return R.filter(Boolean)}
function seedFields(){let n=0;const f=(entity,field,roles,mode,when,name)=>({id:"FR-"+String(++n).padStart(3,"0"),entity,field,sub:{roles},mode,when:when||"",name,enabled:true,owner:"Rina Okafor",reviewed:null,created:"2026-10-11"});
 const o=[];
 o.push(f("person","*",["hr"],"write","","People Operations edits person attributes"),f("person","rating",["employee"],"read","own()","Own rating"),f("person","rating",["people_manager"],"read","directReport() or inChain()","Chain rating"),f("person","rating",["hr"],"read","","HR rating"),f("person","goals",["employee"],"read","own()","Own goals"),f("person","goals",["people_manager"],"write","directReport()","Manager edits direct reports' goals"),f("person","goals",["hr"],"read","","HR goals"));
 o.push(f("person","salary",["employee"],"read","own()","Own salary"),f("person","salary",["hr"],"read","","HR salary"),f("person","bonus",["employee"],"read","own()","Own bonus"),f("person","bonus",["hr"],"read","","HR bonus"),f("person","grade",["employee"],"read","own()","Own grade"),f("person","grade",["hr"],"read","","HR grade"),Object.assign(f("person","grade",["people_manager"],"masked","not own()","Managers see a band only"),{effect:"allow"}));
 o.push(f("person","pto_balance",["employee"],"read","own()","Own PTO balance"),f("person","pto_balance",["people_manager"],"read","directReport() or inChain()","Chain PTO balance"),f("person","pto_balance",["hr"],"read","","HR PTO balance"),f("person","pto_reason",["hr"],"read","","HR sees reasons"),f("person","pto_reason",["employee"],"read","own()","Own reason"));
 o.push(f("person","health",["hr"],"read","","HR only"),f("person","load",["employee"],"read","own()","Own load"),f("person","load",["people_manager","project_manager","portfolio_lead","hr","executive"],"read","","Staffing needs workload"));
 o.push(f("person","rate",["finance_approver","executive","portfolio_lead","hr"],"read","","Cost rate for finance and resource planning"),f("person","rate",["employee"],"read","own()","Own rate"));
 o.push(f("person","access_roles",["employee"],"read","own()","Own access"),f("person","access_roles",["people_manager"],"read","directReport() or inChain()","Chain access"),f("person","access_roles",["hr","security","platform_admin","auditor"],"read","","Security, HR, audit read access"));
 o.push(f("person","email",["vendor_guest"],"hidden","","Vendors do not see staff email"),f("person","location",["vendor_guest"],"hidden","","Vendors do not see staff location"));
 o.push(f("person","email",STAFF,"read","","Staff read email"),f("person","location",STAFF,"read","","Staff read location"),f("person","name",STAFFB,"read","","Names are open"),f("person","title",STAFFB,"read","",""),f("person","team",STAFFB,"read","",""),f("person","manager",STAFFB,"read","",""),f("person","skills",STAFF,"read","",""));
 o.push(f("budget_request","amount",["finance_approver","executive","portfolio_lead","auditor","board_member"],"read","","Amount is confidential"),f("budget_request","amount",["project_manager","architect","employee"],"read","own()","Requester sees own amount"),f("budget_request","decision_note",["finance_approver","executive","portfolio_lead","auditor"],"read","","Decision notes"));
 o.push(f("invoice","amount",["finance_approver","executive","auditor"],"read","","Amount"),f("invoice","amount",["project_manager"],"read","record.owner == user.name","Own project invoices"),f("invoice","bank_account",["finance_approver"],"masked","not hasSet('PS-AP')","Bank account masked unless the Payables approver set is held"),f("invoice","bank_account",["finance_approver"],"read","hasSet('PS-AP')","Payables permission set reveals"));
 return o}
function reseed(){P.rules=seedRules();P.fields=seedFields();P.seedVer=SEEDVER;P.nx.c++}
if(!P.rules.length||P.seedVer!==SEEDVER)reseed();
SETS_EXTRA.forEach(s=>G(()=>{const a=GUARD.sets();if(!a.some(x=>x.id===s.id))a.push(s)}));
/* legacy GUARD callers map onto nested actions */
const LEGACY={"approval.decide":["approve","approval"],"budget.edit":["update","budget_line"],"comp.reveal":["reveal","cost_rate"],"timesheet.approve":["approve","timesheet"],"req.approve":["approve","requisition"],"payment.release":["approve","payment"],"role.assign":["approve","access_request"],"access.review":["approve","access_review"],"report.certify":["approve","approval"]};

/* ---------------- persistence and changes ---------------- */
let _pt=0;
function persist(){clearTimeout(_pt);_pt=setTimeout(()=>{G(()=>{if(W.STORE&&STORE.put)STORE.put("perm_state",{id:"main",json:JSON.stringify({ver:SEEDVER,rules:P.rules,fields:P.fields,hist:P.hist.slice(0,200),log:P.log.slice(0,150)})})})},300)}
function restore(){G(()=>{const r=STORE.get("perm_state","main");if(!r||!r.json)return;const v=JSON.parse(r.json);if(v.ver!==SEEDVER)return;P.rules=v.rules;P.fields=v.fields;P.hist=v.hist||[];P.log=v.log||[];P.nx.c++})}
G(()=>{if(W.STORE&&STORE.ready&&STORE.ready.then)STORE.ready.then(()=>{restore();[0].forEach(()=>{try{W.render&&S.screen==="r16g_perm"&&render()}catch(e){}})})});
function history(kind,id,summary,before,after){const h={id:"CH-"+String(P.hist.length+1).padStart(3,"0"),t:TODAY+" "+stamp(),by:current().user,kind,target:id,summary,before:before||"",after:after||"",status:"applied"};P.hist.unshift(h);P.nx.c++;persist();
 G(()=>audit("Permission changed",summary));emit("permission.changed",{actor:h.by,target:id,kind,summary});return h}
function addRule(r,fieldRule){const arr=fieldRule?P.fields:P.rules;const o=Object.assign({id:fieldRule?"FR-"+String(900+P.nx.f++):"PR-"+String(900+P.nx.r++),enabled:true,effect:"allow",kind:"custom",owner:current().user,reviewed:null,created:TODAY},r);arr.unshift(o);history(fieldRule?"field rule":"rule",o.id,"Added "+(fieldRule?"field ":"")+"rule "+o.id+": "+(o.name||""),"",JSON.stringify(o));return o}
function updateRule(id,patch){const a=P.rules.find(r=>r.id===id)||P.fields.find(r=>r.id===id);if(!a)return null;const b=JSON.stringify(a);Object.assign(a,patch);a.reviewed=null;history(/^FR/.test(id)?"field rule":"rule",id,"Changed "+id+": "+Object.keys(patch).join(", "),b,JSON.stringify(a));return a}
function removeRule(id){const i=P.rules.findIndex(r=>r.id===id);const j=P.fields.findIndex(r=>r.id===id);const a=i>=0?P.rules.splice(i,1)[0]:j>=0?P.fields.splice(j,1)[0]:null;if(a)history("rule",id,"Removed "+id+": "+(a.name||""),JSON.stringify(a),"");return a}
function review(id){const a=P.rules.find(r=>r.id===id)||P.fields.find(r=>r.id===id);if(a){a.reviewed=TODAY;history("review",id,"Reviewed "+id,"","");}return a}

/* ---------------- coverage ---------------- */
function allEntities(){return Object.keys(G(()=>DATAMODEL.tables,{}))}
function coverage(){const ents=allEntities();const nr=e=>P.rules.filter(r=>r.res===e||(r.res.indexOf(",")>0&&r.res.split(",").indexOf(e)>=0)||(r.res!=="*"&&resMatch(r.res,e))).length;
 const noRule=ents.filter(e=>!P.rules.some(r=>r.res===e||(r.res.indexOf(",")>0&&r.res.split(",").indexOf(e)>=0)));
 const sensNoRule=noRule.filter(entSensitive);const scrs=G(()=>SCREENS.map(s=>s[0]),[]);
 const unguarded=scrs.filter(s=>!P.rules.some(r=>r.res==="screen:"+s));
 const unrev=P.rules.concat(P.fields).filter(r=>r.enabled!==false&&!r.reviewed);
 const guarded=ents.length-noRule.length;const pct=Math.round(100*((scrs.length-unguarded.length)+guarded)/Math.max(1,scrs.length+ents.length));
 return{ents:ents.length,entsWithRule:guarded,noRule,sensNoRule,screens:scrs.length,unguarded,unreviewed:unrev,pct,denied:P.log.filter(l=>l.type==="deny").length,reveals:P.log.filter(l=>l.type==="reveal").length}}

function principalOfRoles(roles){return finish({id:"__role__",persona:"",user:"(role probe)",roles:roles.slice(),rolesOnly:true})}
W.PERM={extraUsers:EXTRA,principalOfRoles,state:P,roles:ROLES,groups:GROUPS,personaRoles:PERSONA_ROLES,personaUser:PERSONA_USER,approverOf:APPROVER_OF,legacy:LEGACY,fieldsCatalog:entFields,
 can,decide:(u,a,r,rec)=>decide(resolveUser(u),a,r,typeof rec==="string"?recordOf("person",rec):rec),fields,fieldMode,rows,maskRecord,maskValue,enforce,require:require_,deniedDrawer,as,principal:current,principalFor,principalOfUser,resolveUser,recordOf,
 evalWhen:(src,u,rec)=>evalWhen(src,resolveUser(u),rec),checkExpr,entityClass,entSensitive,allEntities,coverage,addRule,updateRule,removeRule,review,reseed,history,logReveal,logDenial,note,emit,kindOf,reportsOf,upOf,graph,
 screen:(u,id)=>can(u,"read","screen:"+id),section:(u,id,subjectName)=>can(u,"read","section:"+id,subjectName?recordOf("person",subjectName):null),
 enforceOn:v=>{if(v!==undefined)P.enforce=!!v;return P.enforce},SEEDVER};

/* GUARD facade: the capability layer AND the nested model must both allow */
G(()=>{const old=W.GUARD;if(!old||old.__perm)return;const oc=old.can,or=old.require;
 const nested=(user,action,res)=>{const m=LEGACY[action];if(!m)return null;const pu=user&&user!==current().user?principalOfUser(user):current();const d=decide(pu,m[0],m[1],null);return d.ok||d.cond?null:d};
 old.can=function(user,action,res){const r=oc.apply(this,arguments);if(!r.ok||r.off)return r;const d=nested(user,action,res);if(!d)return r;return{ok:false,rule:"permission",who:r.who,role:r.role,missing:[],why:d.why,nested:d}};
 old.require=function(action,res){const r=old.can(null,action,res);if(r.ok||r.off)return true;if(r.rule==="permission"){logDenial(current(),r.nested,{rec:(res&&res.label)||""});deniedDrawer(LEGACY[action][0],LEGACY[action][1],null,(old.actions[action]||{}).n);return false}return or.apply(this,arguments)};
 old.__perm=1;old.perm=W.PERM});
/* every persona acts as its own user in legacy code too */
G(()=>{const R=W.R15F3;if(R&&R.PERSONA_USER)Object.keys(PERSONA_USER).forEach(k=>{if(!/^(emp|newhire|board|guest|audit)$/.test(k)||!R.PERSONA_USER[k])R.PERSONA_USER[k]=PERSONA_USER[k]})});
[2500,6000,11000].forEach(t=>setTimeout(()=>{G(()=>{[["permission.changed","Permission rule changed",["actor","target","kind","summary"]],["data.revealed","Sensitive data revealed",["actor","resource","record","what"]],["access.denied","Access denied by permission model",["actor","action","resource","rule","scope"]]].forEach(d=>{if(!W.EVENTS||(EVENTS.catalog&&EVENTS.catalog.has&&EVENTS.catalog.has(d[0]))&&d[0]!=="permission.changed")return;EVENTS.register({id:d[0],label:d[1],module:"r16g_perm",fields:d[2].map(n=>({name:n,type:"string"})),owner:"Rina Okafor"})})})},t));
})();

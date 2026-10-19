/* ===== Round 17, Agent S, part A: window.RULES, the configurable rules engine.
   Rule types: client (run in a form while a person edits), business (run on the record store), notify (who is told, when), uiaction (buttons), choice (drop-down value sets).
   Conditions are a tree (field, operator, value or another field, AND/OR groups) that compiles to the same expression grammar as the approval-rule conditions (APPR.cond):
   field == 'x' && amount >= 5000. A script step is only a sandboxed expression (no eval, no Function, whitelisted functions, field references only).
   API: RULES.register(body,meta) / get / list / evaluate(opts) / run(opts) / test(ruleId, recId) / expr.parse|validate|eval / entities / govern / kill / log.
   Runtime hooks: kit.js submitForm (beforeForm, afterForm), RECSHELL applyEdit (recEdit, recDone), STORE.put wrapper (store), form field change (delegated), schedule (runSchedule) and event subscriptions. ===== */
(function(){
"use strict";
const W=window,DOC=document;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const H=s=>(typeof esc==="function"?esc(s==null?"":String(s)):String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])));
const arr=x=>Array.isArray(x)?x:[];
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const ME=()=>G(()=>typeof INBOX.me==="function"?INBOX.me():INBOX.me,"")||"Casey Rowan";
const isoDay=t=>new Date(t==null?Date.now():t).toISOString().slice(0,10);
const R=W.RULES=W.RULES||{};
const MAXD=4,RATE_N=40,RATE_MS=5000;
/* ---------- state ---------- */
const D=R.data={rules:[],log:[],errors:[],digest:[],seen:{},kill:{all:false,types:{},by:"",at:0,reason:""},appr:[],seq:100,lseq:1,booted:false,cfg:{showApplied:true,quiet:{from:"22:00",to:"07:00"}}};
const RT={depth:0,stack:[],hold:null,inForm:0,subs:[],lastTick:0};
R.rt=RT;
const TYPES={client:{label:"Client rule",short:"Client",blurb:"Runs in the form while a person edits"},business:{label:"Business rule",short:"Business",blurb:"Runs on the record store when data is saved, changed, deleted or on a schedule"},notify:{label:"Notification rule",short:"Notification",blurb:"Decides who is told, when, and whether it waits for a digest"},uiaction:{label:"UI action",short:"UI action",blurb:"A button or menu item on a form or list"},choice:{label:"Choice list",short:"Choice list",blurb:"A drop-down value set, optionally dependent on another field"}};
const TRIG={client:[["load","When the form opens"],["change","When a field changes"],["submit","When the person saves"],["cell","When a cell is edited in a record or list"],["click","When a button is clicked"]],
 business:[["before_save","Before save"],["after_save","After save"],["delete","On delete"],["status_change","On status change"],["schedule","On a schedule"],["event","When an event is raised"]],
 notify:[["after_save","When a record is saved"],["status_change","When the status changes"],["event","When an event is raised"],["schedule","On a schedule"]],
 uiaction:[["click","When the button is clicked"]],choice:[["lookup","When a drop-down is filled"]]};
R.TYPES=TYPES;R.TRIG=TRIG;
const trigLabel=(t,k)=>{const x=arr(TRIG[t]).find(a=>a[0]===k);return x?x[1]:k||""};
R.trigLabel=trigLabel;
/* ======================================================================
   1. SAFE EXPRESSION EVALUATOR (no eval, no Function; whitelisted names only)
   ====================================================================== */
const FN_DOC={len:"len(text): length",lower:"lower(text)",upper:"upper(text)",trim:"trim(text)",contains:"contains(text, part)",startsWith:"startsWith(text, part)",isBlank:"isBlank(value): empty or missing",
 round:"round(number, digits)",floor:"floor(number)",ceil:"ceil(number)",min:"min(a, b)",max:"max(a, b)",abs:"abs(number)",number:"number(text)",concat:"concat(a, b, ...)",
 today:"today(): today as YYYY-MM-DD",addDays:"addDays(date, days)",addHours:"addHours(timestamp or date, hours): date and time text",daysBetween:"daysBetween(from, to)",
 slaHours:"slaHours(priority): response target in hours, from the SLA table",hasRole:"hasRole(role): the viewer holds this role",inGroup:"inGroup(group): the viewer is in this group",
 iff:"iff(test, a, b)",coalesce:"coalesce(a, b)",changed:"changed(field): the field differs from its stored value",wasValue:"wasValue(field): the stored value"};
const SLA_H={1:4,2:8,3:24,4:72};
R.slaHours=p=>SLA_H[+p]||72;
const FNS={len:a=>String(a[0]==null?"":a[0]).length,lower:a=>String(a[0]==null?"":a[0]).toLowerCase(),upper:a=>String(a[0]==null?"":a[0]).toUpperCase(),trim:a=>String(a[0]==null?"":a[0]).trim(),
 contains:a=>String(a[0]==null?"":a[0]).toLowerCase().indexOf(String(a[1]==null?"":a[1]).toLowerCase())>=0,startsWith:a=>String(a[0]==null?"":a[0]).toLowerCase().indexOf(String(a[1]==null?"":a[1]).toLowerCase())===0,
 isBlank:a=>a[0]==null||a[0]===""||(Array.isArray(a[0])&&!a[0].length),round:a=>{const d=Math.pow(10,+a[1]||0);return Math.round((+a[0]||0)*d)/d},floor:a=>Math.floor(+a[0]||0),ceil:a=>Math.ceil(+a[0]||0),
 min:a=>Math.min(+a[0],+a[1]),max:a=>Math.max(+a[0],+a[1]),abs:a=>Math.abs(+a[0]||0),number:a=>{const n=parseFloat(String(a[0]).replace(/[^0-9.\-]/g,""));return isNaN(n)?0:n},
 concat:a=>a.map(x=>x==null?"":x).join(""),today:()=>isoDay(),
 addDays:a=>{const d=new Date((a[0]||isoDay())+"T12:00:00Z");if(isNaN(d))return "";d.setUTCDate(d.getUTCDate()+(+a[1]||0));return d.toISOString().slice(0,10)},
 addHours:a=>{const t=typeof a[0]==="number"?a[0]:(a[0]?new Date(String(a[0]).length<=10?a[0]+"T09:00:00Z":a[0]).getTime():Date.now());const d=new Date((isNaN(t)?Date.now():t)+(+a[1]||0)*36e5);return d.toISOString().slice(0,16).replace("T"," ")},
 daysBetween:a=>{const x=new Date(a[0]),y=new Date(a[1]);return isNaN(x)||isNaN(y)?0:Math.round((y-x)/864e5)},
 slaHours:a=>SLA_H[+a[0]]||72,iff:a=>a[0]?a[1]:a[2],coalesce:a=>a[0]!=null&&a[0]!==""?a[0]:a[1]};
const CTXFN=["hasRole","inGroup","changed","wasValue"];
const SPECIAL=["user","isNew","trigger","today","role","viewer"];
function tok(s){const t=[];let i=0;
 while(i<s.length){const c=s[i];if(/\s/.test(c)){i++;continue}
  if(/[0-9]/.test(c)||(c==="."&&/[0-9]/.test(s[i+1]||""))){let j=i+1;while(j<s.length&&/[0-9.]/.test(s[j]))j++;t.push({k:"n",v:parseFloat(s.slice(i,j)),p:i});i=j;continue}
  if(c==="'"||c==='"'){let j=i+1,o="";while(j<s.length&&s[j]!==c){if(s[j]==="\\"&&j+1<s.length)j++;o+=s[j];j++}if(j>=s.length)throw {msg:"This text is missing its closing quote",pos:i};t.push({k:"s",v:o,p:i});i=j+1;continue}
  const two=s.slice(i,i+2);if(["==","!=",">=","<=","&&","||"].indexOf(two)>=0){t.push({k:"op",v:two,p:i});i+=2;continue}
  if("><!+-*/%".indexOf(c)>=0){t.push({k:"op",v:c,p:i});i++;continue}
  if("()[],".indexOf(c)>=0){t.push({k:c,p:i});i++;continue}
  if(/[A-Za-z_]/.test(c)){let j=i+1;while(j<s.length&&/[A-Za-z0-9_.]/.test(s[j]))j++;const w=s.slice(i,j),lw=w.toLowerCase();
   if(lw==="and")t.push({k:"op",v:"&&",p:i});else if(lw==="or")t.push({k:"op",v:"||",p:i});else if(lw==="not")t.push({k:"op",v:"!",p:i});
   else if(lw==="in"||lw==="contains"||lw==="startswith"||lw==="endswith")t.push({k:"op",v:lw,p:i});else if(lw==="true"||lw==="false")t.push({k:"b",v:lw==="true",p:i});else if(lw==="null")t.push({k:"z",p:i});
   else t.push({k:"id",v:w,p:i});i=j;continue}
  throw {msg:"Unexpected character '"+c+"'",pos:i}}
 return t}
function parse(t,src){let p=0;const pk=()=>t[p],nx=()=>t[p++];const end=()=>src.length;
 const fail=(m,tk)=>{throw {msg:m,pos:tk?tk.p:end()}};
 function prim(){const a=nx();if(!a)fail("The expression ends too early");
  if(a.k==="n"||a.k==="s"||a.k==="b")return{t:"lit",v:a.v};if(a.k==="z")return{t:"lit",v:null};
  if(a.k==="("){const e=or();const c=nx();if(!c||c.k!==")")fail("A closing bracket is missing",c||a);return e}
  if(a.k==="["){const L=[];while(pk()&&pk().k!=="]"){L.push(add());if(pk()&&pk().k===",")nx()}if(!nx())fail("A closing ] is missing",a);return{t:"list",v:L}}
  if(a.k==="id"){if(pk()&&pk().k==="("){nx();const args=[];while(pk()&&pk().k!==")"){args.push(or());if(pk()&&pk().k===",")nx();else if(pk()&&pk().k!==")")fail("Separate values with commas",pk())}if(!nx())fail("A closing bracket is missing after "+a.v,a);return{t:"call",n:a.v,args,p:a.p}}return{t:"id",v:a.v,p:a.p}}
  fail("Unexpected '"+(a.v!=null?a.v:a.k)+"'",a)}
 function unary(){const a=pk();if(a&&a.k==="op"&&a.v==="-"){nx();return{t:"neg",e:unary()}}return prim()}
 function mul(){let l=unary();while(pk()&&pk().k==="op"&&"*/%".indexOf(pk().v)>=0){const o=nx().v;l={t:"bin",o,l,r:unary()}}return l}
 function add(){let l=mul();while(pk()&&pk().k==="op"&&(pk().v==="+"||pk().v==="-")){const o=nx().v;l={t:"bin",o,l,r:mul()}}return l}
 function cmp(){let l=add();while(pk()&&pk().k==="op"&&["==","!=",">","<",">=","<=","in","contains","startswith","endswith"].indexOf(pk().v)>=0){const o=nx().v;l={t:"cmp",o,l,r:add()}}return l}
 function not(){const a=pk();if(a&&a.k==="op"&&a.v==="!"){nx();return{t:"not",e:not()}}return cmp()}
 function and(){let l=not();while(pk()&&pk().k==="op"&&pk().v==="&&"){nx();l={t:"and",l,r:not()}}return l}
 function or(){let l=and();while(pk()&&pk().k==="op"&&pk().v==="||"){nx();l={t:"or",l,r:and()}}return l}
 const e=or();if(p<t.length)fail("Unexpected '"+(t[p].v!=null?t[p].v:t[p].k)+"'",t[p]);return e}
const CC=new Map();
function compile(src){src=String(src==null?"":src);if(CC.has(src))return CC.get(src);if(src.length>600)throw {msg:"The expression is longer than 600 characters",pos:600};const ast=parse(tok(src),src);if(CC.size>400)CC.clear();CC.set(src,ast);return ast}
const getF=(rec,path)=>{if(rec==null)return undefined;if(Object.prototype.hasOwnProperty.call(rec,path))return rec[path];const lp=String(path).toLowerCase();const kk=Object.keys(rec).find(x=>x.toLowerCase()===lp);return kk!==undefined?rec[kk]:undefined};
const blank=v=>v==null||v===""||(Array.isArray(v)&&!v.length);
const eq=(x,y)=>{if(blank(x)&&blank(y))return true;if(typeof x==="boolean"||typeof y==="boolean")return String(x).toLowerCase()===String(y).toLowerCase();
 if(typeof x==="number"||typeof y==="number"){const a=parseFloat(x),b=parseFloat(y);return !isNaN(a)&&!isNaN(b)&&a===b}return String(x==null?"":x).toLowerCase()===String(y==null?"":y).toLowerCase()};
function ev(a,c,steps){if(++steps.n>600)throw {msg:"The expression is too complex to run (over 600 steps)",pos:0};
 switch(a.t){case"lit":return a.v;case"list":return a.v.map(x=>ev(x,c,steps));case"neg":return -(+ev(a.e,c,steps)||0);
  case"id":{const n=a.v;
   if(n==="today")return isoDay();if(n==="user")return c.user;if(n==="isNew")return !!c.isNew;if(n==="trigger")return c.trigger;if(n==="role"||n==="viewer")return c.role;
   if(/^(old|prev|was)\./i.test(n))return getF(c.old,n.replace(/^[a-z]+\./i,""));return getF(c.rec,n)}
  case"not":return !ev(a.e,c,steps);case"and":return !!(ev(a.l,c,steps)&&ev(a.r,c,steps));case"or":return !!(ev(a.l,c,steps)||ev(a.r,c,steps));
  case"bin":{const l=ev(a.l,c,steps),r=ev(a.r,c,steps);switch(a.o){case"+":return (typeof l==="string"||typeof r==="string")&&(isNaN(parseFloat(l))||isNaN(parseFloat(r)))?String(l==null?"":l)+String(r==null?"":r):(+l||0)+(+r||0);case"-":return (+l||0)-(+r||0);case"*":return (+l||0)*(+r||0);case"/":return +r?(+l||0)/(+r):0;case"%":return +r?(+l||0)%(+r):0}return null}
  case"call":{const n=a.n;const args=a.args.map(x=>ev(x,c,steps));
   if(FNS[n])return FNS[n](args);
   if(n==="hasRole")return c.fn.hasRole(String(args[0]));if(n==="inGroup")return c.fn.inGroup(String(args[0]));
   if(n==="changed")return !eq(getF(c.rec,String(args[0])),getF(c.old,String(args[0])))&&!(blank(getF(c.old,String(args[0])))&&c.isNew&&blank(getF(c.rec,String(args[0]))));
   if(n==="wasValue")return getF(c.old,String(args[0]));
   throw {msg:"'"+n+"' is not an allowed function. Allowed: "+Object.keys(FN_DOC).join(", "),pos:a.p}}
  case"cmp":{const l=ev(a.l,c,steps),r=ev(a.r,c,steps);
   switch(a.o){case"==":return eq(l,r);case"!=":return !eq(l,r);case">":return parseFloat(l)>parseFloat(r)||(typeof l==="string"&&typeof r==="string"&&isNaN(parseFloat(l))&&l>r);case"<":return parseFloat(l)<parseFloat(r)||(typeof l==="string"&&typeof r==="string"&&isNaN(parseFloat(l))&&l<r);
    case">=":return parseFloat(l)>=parseFloat(r)||(typeof l==="string"&&typeof r==="string"&&isNaN(parseFloat(l))&&l>=r);case"<=":return parseFloat(l)<=parseFloat(r)||(typeof l==="string"&&typeof r==="string"&&isNaN(parseFloat(l))&&l<=r);
    case"in":return Array.isArray(r)&&r.some(x=>eq(x,l));
    case"contains":return Array.isArray(l)?l.some(x=>eq(x,r)):String(l==null?"":l).toLowerCase().indexOf(String(r==null?"":r).toLowerCase())>=0;
    case"startswith":return String(l==null?"":l).toLowerCase().indexOf(String(r==null?"":r).toLowerCase())===0;
    case"endswith":{const s=String(l==null?"":l).toLowerCase(),e=String(r==null?"":r).toLowerCase();return e===""||s.slice(-e.length)===e}}}}
 return false}
function collect(a,o){if(!a)return o;if(a.t==="id")o.ids.push(a);else if(a.t==="call"){o.calls.push(a);a.args.forEach(x=>collect(x,o))}else if(a.l||a.r||a.e||a.v){["l","r","e"].forEach(k=>a[k]&&collect(a[k],o));if(a.t==="list")a.v.forEach(x=>collect(x,o))}return o}
const E={compile,FN_DOC,
 /* validate(src, fieldKeys): {ok, err, pos, unknown[], calls[]} for inline error display */
 validate(src,keys){src=String(src==null?"":src);if(!src.trim())return{ok:true,empty:true,unknown:[],calls:[]};
  try{const ast=compile(src);const o=collect(ast,{ids:[],calls:[]});const lk=new Set(arr(keys).map(k=>String(k).toLowerCase()));
   const unknown=[...new Set(o.ids.map(i=>i.v).filter(n=>!/^(old|prev|was)\./i.test(n)&&SPECIAL.indexOf(n)<0&&lk.size&&!lk.has(n.toLowerCase())))];
   const prevs=[...new Set(o.ids.map(i=>i.v).filter(n=>/^(old|prev|was)\./i.test(n)).map(n=>n.replace(/^[a-z]+\./i,"")).filter(n=>lk.size&&!lk.has(n.toLowerCase())))];
   const badFn=o.calls.filter(c=>!FNS[c.n]&&CTXFN.indexOf(c.n)<0);
   if(badFn.length)return{ok:false,err:"'"+badFn[0].n+"' is not an allowed function. Allowed: "+Object.keys(FN_DOC).join(", "),pos:badFn[0].p,unknown:[],calls:[]};
   if(unknown.length||prevs.length)return{ok:false,err:"Unknown field "+(unknown.concat(prevs)).map(u=>"'"+u+"'").join(", ")+". Use a field from this table.",pos:0,unknown:unknown.concat(prevs),calls:o.calls.map(c=>c.n)};
   return{ok:true,unknown:[],calls:o.calls.map(c=>c.n)}}catch(e){return{ok:false,err:e&&e.msg?e.msg:String(e&&e.message||e),pos:e&&e.pos!=null?e.pos:0,unknown:[],calls:[]}}},
 /* eval(src, ctx): ctx = {rec, old, user, isNew, trigger, role, fn:{hasRole,inGroup}} ; throws {msg,pos} */
 eval(src,c){c=c||{};c.rec=c.rec||{};c.old=c.old||{};c.fn=c.fn||viewerFns();if(c.user==null)c.user=ME();const ast=compile(src);return ev(ast,c,{n:0})},
 test(src,c){try{return{ok:true,v:E.eval(src,c)}}catch(e){return{ok:false,err:e&&e.msg?e.msg:String(e&&e.message||e),pos:e&&e.pos}}}};
R.expr=E;
/* viewer helpers used by hasRole() and scope checks */
function principal(){return G(()=>PERM.principal(),null)}
function viewerFns(){const p=principal();const roles=arr(p&&p.roles);const groups=arr(p&&p.groups);
 return{hasRole:r=>roles.indexOf(r)>=0,inGroup:g=>groups.indexOf(g)>=0||G(()=>APG.isMember(g,ME()),false)}}
R.viewer=()=>{const p=principal();return{user:ME(),roles:arr(p&&p.roles),groups:arr(p&&p.groups),persona:G(()=>S.persona,"")}};

/* ======================================================================
   2. ENTITY CATALOG: the live field lists, records, setters and form bindings
   ====================================================================== */
const ENT={};R.ents=ENT;
const NUM=(v,d)=>{const n=parseFloat(v);return isNaN(n)?(d==null?0:d):n};
const F=(k,label,type,o)=>Object.assign({k,label,type:type||"text"},o||{});
const URG=[["1","Critical"],["2","High"],["3","Medium"],["4","Low"]];
function addEntity(def){def.fields=def.fields||[];def.byK={};def.fields.forEach(f=>def.byK[f.k]=f);ENT[def.id]=def;return def}
R.addEntity=addEntity;
const incRaw=id=>G(()=>ITSMX.getIncident(id),null);
const chgRaw=id=>G(()=>ITSMX.getChange(id),null);
const incPri=i=>i.ovr?i.ovr.p:(i._c?i._c.p:(i.urg?+i.urg:3));
const openTasks=c=>c&&c.proj?G(()=>TASKS.filter(t=>t.p===c.proj&&NUM(t.pct)<100&&!t.sum).length,0):0;
const rx=(o,r)=>Object.assign({},o,r&&r._rules||{});
addEntity({id:"incident",label:"Incident",table:"incident",rsh:"incident",forms:["itsm_inc"],
 fields:[F("id","Number"),F("title","Short description"),F("description","Description","longtext"),F("service","Service","choice",{src:"services"}),F("category","Category","choice"),F("team","Assignment team","choice",{src:"teams"}),F("urgency","Urgency","number",{opts:URG}),F("priority","Priority (1 is highest)","number",{opts:[["1","P1"],["2","P2"],["3","P3"],["4","P4"]]}),
  F("users_affected","Users affected","number"),F("function_lost","Function lost (%)","number"),F("revenue_at_risk","Revenue at risk per hour","number"),F("major","Major incident","bool"),F("state","State","choice",{opts:["New","In progress","On hold","Resolved","Closed"].map(x=>[x,x])}),F("owner","Assigned to","person"),F("caller","Caller","person"),F("due","Response due","date"),F("age_hours","Hours open","number")],
 list:()=>arr(G(()=>ITSMX.incidents,[])).map(i=>i.id),get:incRaw,idOf:r=>r.id,
 flat:i=>rx({id:i.id,title:i.t,description:i.d,service:i.svc,category:i.cat,team:i.grp,owner:i.own||"",state:i.st,urgency:NUM(i.urg,3),priority:incPri(i),users_affected:NUM(i.ua),function_lost:NUM(i.deg),revenue_at_risk:NUM(i.txh),major:!!i.maj,caller:i.caller,due:i.slaDue||"",age_hours:NUM(i.age)},i),
 setters:{title:(r,v)=>{r.t=v},category:(r,v)=>{r.cat=v},team:(r,v)=>{r.grp=v},owner:(r,v)=>{r.own=v},major:(r,v)=>{r.maj=!!v},state:(r,v)=>{r.st=v},description:(r,v)=>{r.d=v}},
 hook:"_rules"});
addEntity({id:"change",label:"Change",table:"change_request",rsh:"change",forms:["itsm_chg","itsm_out"],
 fields:[F("id","Number"),F("title","Short description"),F("type","Type","choice",{opts:["Standard","Normal","Emergency"].map(x=>[x,x])}),F("service","Service","choice",{src:"services"}),F("environment","Environment","choice"),F("cost","Cost","number"),F("state","State","choice",{opts:["Draft","Assess","Authorize","Scheduled","Implement","Review","Closed"].map(x=>[x,x])}),F("new_state","State after this save","choice"),
  F("start","Planned start","date"),F("end","Planned end","date"),F("owner","Implementer","person"),F("requester","Requested by","person"),F("project","Project"),F("open_tasks","Open tasks on the linked project","number"),F("outcome","Outcome","choice",{opts:["Successful","Successful with issues","Failed"].map(x=>[x,x])}),F("caused_incident","Caused an incident","bool"),F("group","Requesting group","choice",{src:"teams"})],
 list:()=>arr(G(()=>ITSMX.changes,[])).map(c=>c.id),get:chgRaw,idOf:r=>r.id,
 flat:c=>rx({id:c.id,title:c.t,type:c.type,service:c.svc,environment:c.env,cost:NUM(c.cost),state:c.st,new_state:c.st,start:c.start,end:c.end,owner:c.own,requester:c.req,project:c.proj||"",open_tasks:openTasks(c),outcome:c.out||"",group:c.grp||""},c),
 setters:{title:(r,v)=>{r.t=v},owner:(r,v)=>{r.own=v},cost:(r,v)=>{r.cost=+v||0},environment:(r,v)=>{r.env=v}},hook:"_rules"});
addEntity({id:"ci",label:"Configuration item",table:"config_item",rsh:"",forms:["itom_ret"],
 fields:[F("id","ID"),F("name","Name"),F("class","Class","choice"),F("service","Service","choice",{src:"services"}),F("environment","Environment","choice"),F("status","Status","choice"),F("lifecycle","Lifecycle","choice",{opts:["Planned","Operational","Retired"].map(x=>[x,x])}),F("owner","Owner","person"),F("group","Support group","choice",{src:"teams"}),F("criticality","Criticality","choice"),F("dependents","Dependent items","number"),F("reason","Reason given","choice"),F("acknowledged","Risk acknowledged","bool")],
 list:()=>arr(G(()=>CMDBX.all(),[])).map(c=>c.id),get:id=>G(()=>CMDBX.all().find(c=>c.id===id),null),idOf:r=>r.id,
 flat:c=>rx({id:c.id,name:c.name,class:c.class,service:G(()=>svName(c.svc),c.svc||""),environment:c.env,status:c.status,lifecycle:c.life,owner:c.owner||"",group:c.grp||"",criticality:c.crit||"",dependents:G(()=>CMDBX.impact(c.id).cis,0)},c),
 setters:{owner:(r,v)=>{r.owner=v},status:(r,v)=>{r.status=v},lifecycle:(r,v)=>{r.life=v}},hook:"_rules"});
const vend=id=>arr(G(()=>S.bud.vend,[])).find(x=>x.id===id||x.n===id)||null;
addEntity({id:"contract",label:"Contract",table:"contract_line",rsh:"contract",forms:[],
 fields:[F("id","Contract"),F("name","Name"),F("type","Type"),F("vendor","Vendor"),F("vendor_assessed","Vendor has a security review","bool"),F("security_review","Latest security review","date"),F("vendor_risk","Vendor risk","choice",{opts:["Low","Medium","High"].map(x=>[x,x])}),F("total_value","Total contract value","number"),F("annual_value","Annual value","number"),F("renewal","Renewal date","date"),F("owner","Contract owner","person"),F("approval_state","Approval state","choice")],
 list:()=>arr(G(()=>S.bud.con,[])).map(c=>c.id),get:id=>arr(G(()=>S.bud.con,[])).find(x=>x.id===id)||null,idOf:r=>r.id,
 flat:c=>{const v=vend(c.v)||{};const tp=G(()=>GRCX.vendorInfo(c.v),null);return rx({id:c.id,name:c.n,type:c.ty,vendor:v.n||c.v,vendor_assessed:!!(tp&&tp.last),security_review:tp&&tp.last||"",vendor_risk:v.risk||"",total_value:NUM(c.tcv),annual_value:NUM(c.ann),renewal:c.rn,owner:c.own||"",approval_state:c.approval||"In term"},c)},
 setters:{owner:(r,v)=>{r.own=v},renewal:(r,v)=>{r.rn=v}},recKeys:{own:"owner",rn:"renewal"},hook:"_rules"});
addEntity({id:"vendor",label:"Vendor",table:"vendor",rsh:"vendor",forms:[],
 fields:[F("id","Vendor"),F("name","Name"),F("category","Category"),F("risk","Risk","choice",{opts:["Low","Medium","High"].map(x=>[x,x])}),F("assessed","Has a security review","bool"),F("owner","Relationship owner","person")],
 list:()=>arr(G(()=>S.bud.vend,[])).map(v=>v.id),get:vend,idOf:r=>r.id,flat:v=>rx({id:v.id,name:v.n,category:v.cat,risk:v.risk,assessed:!!G(()=>GRCX.vendorInfo(v.id).last,false),owner:v.own||""},v),setters:{owner:(r,v)=>{r.own=v}},recKeys:{own:"owner"},hook:"_rules"});
/* approvals waiting in the inbox: a read-only virtual entity for scheduled rules (escalation, reminders) */
addEntity({id:"approval",label:"Approval waiting",table:"approval",rsh:"",forms:[],virtual:true,
 fields:[F("id","Item"),F("title","What needs approving"),F("category","Category"),F("requester","Requested by","person"),F("age_hours","Hours waiting","number"),F("hours_to_due","Hours until due","number"),F("risk","Risk","choice",{opts:["low","med","high"].map(x=>[x,x])}),F("source","Source")],
 list:()=>arr(G(()=>INBOX.items(),[])).filter(x=>x.kind==="approval").map(x=>x.id),get:id=>arr(G(()=>INBOX.items(),[])).find(x=>x.id===id)||null,idOf:r=>r.id,
 flat:x=>({id:x.id,title:x.title,category:x.cat,requester:x.req,age_hours:Math.round(NUM(x.ageH)*10)/10,hours_to_due:Math.round(NUM(x.dueH)*10)/10,risk:x.risk,source:x.src}),setters:{},hook:null});
/* every other record shell entity: generic fields discovered from its first record */
function genericEntities(){const sh=W.RECSHELL;if(!sh||!sh.adapters)return;Object.keys(sh.adapters).forEach(e=>{if(ENT[e]||ENT["_g_"+e])return;const a=sh.adapters[e];
 const first=G(()=>{const ids=arr(a.list&&a.list());return ids.length?sh.get(e,ids[0]):null},null);const fl=first?arr(first.fields).map(f=>F(f.k,f.l)):[];
 const g=addEntity({id:e,label:a.label||e,table:e,rsh:e,forms:[],generic:true,fields:[F("id","ID"),F("title","Title"),F("status","Status"),F("owner","Owner","person")].concat(fl.filter(f=>["id","title","status","owner"].indexOf(f.k)<0)),
  list:()=>arr(G(()=>a.list(),[])),get:id=>G(()=>sh.get(e,id),null),idOf:r=>r.id,flat:r=>{const o={id:r.id,title:r.title,status:r.status,owner:r.owner};arr(r.fields).forEach(f=>{o[f.k]=f.v});return o},setters:{},hook:null})})}
R.entities=()=>{genericEntities();return Object.keys(ENT).map(k=>ENT[k])};
R.entity=id=>{genericEntities();return ENT[id]||null};
/* choices for a field: its own opts, a LISTS source, or a live scan of the records */
R.fieldChoices=(entity,k)=>{const e=R.entity(entity),f=e&&e.byK[k];if(!f)return[];if(f.opts)return f.opts.map(o=>Array.isArray(o)?o:[o,o]);
 if(f.src&&W.LISTS&&G(()=>LISTS.meta(f.src),null)){return G(()=>LISTS.get(f.src).map(o=>[o.v,o.l]),[])}
 const s=new Set();arr(G(()=>e.list(),[])).slice(0,300).forEach(id=>{const r=G(()=>e.get(id),null);if(r){const v=G(()=>e.flat(r)[k],null);if(v!=null&&v!==""&&typeof v!=="object")s.add(String(v))}});return [...s].sort().slice(0,60).map(x=>[x,x])};
R.fieldList=entity=>{const e=R.entity(entity);if(e)return e.fields.slice();
 return arr(G(()=>DATAMODEL.fields(entity),[])).map(f=>F(f.k,f.label||f.k,/number|percent|money/.test(f.type)?"number":/bool/.test(f.type)?"bool":/date/.test(f.type)?"date":/ref/.test(f.type)?"person":"text",f.opts?{opts:f.opts.map(o=>Array.isArray(o)?o:[o,o])}:{}))};
/* viewer pseudo fields every entity offers */
R.VIEWER=[F("viewer_role","The person's role","viewer"),F("viewer_group","The person's group","viewer"),F("isNew","This is a new record","bool")];
/* flat record for an entity id (live) */
R.flatOf=(entity,id)=>{const e=R.entity(entity);if(!e)return null;const raw=G(()=>e.get(id),null);return raw?e.flat(raw):null};
R.rawOf=(entity,id)=>{const e=R.entity(entity);return e?G(()=>e.get(id),null):null};
function setRaw(entity,id,k,v){const e=R.entity(entity);if(!e)return false;const raw=G(()=>e.get(id),null);if(!raw)return false;
 if(e.setters&&e.setters[k]){e.setters[k](raw,v);return true}
 if(e.hook){raw[e.hook]=raw[e.hook]||{};raw[e.hook][k]=v;return true}return false}
R.setRaw=setRaw;

/* ---------- form bindings: the OF()/openForm submit and field-change path ---------- */
const FORMS={};R.forms=FORMS;
function bindForm(fid,def){FORMS[fid]=Object.assign({fid},def);const e=ENT[def.entity];if(e&&e.forms.indexOf(fid)<0)e.forms.push(fid);return FORMS[fid]}
R.bindForm=bindForm;
const unesc=s=>String(s==null?"":s).replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'");
bindForm("itsm_inc",{entity:"incident",mode:"create",map:{title:"title",desc:"description",svc:"service",cat:"category",grp:"team",urg:"urgency",ua:"users_affected",deg:"function_lost",txh:"revenue_at_risk",maj:"major",own:"owner",caller:"caller",ci:"ci"},nums:["urgency","users_affected","function_lost","revenue_at_risk"]});
bindForm("itsm_chg",{entity:"change",mode:"auto",map:{t:"title",type:"type",svc:"service",env:"environment",cost:"cost",start:"start",end:"end",own:"owner",grp:"group"},nums:["cost"],rec:spec=>{const m=/^Edit (CHG\d+)/.exec(unesc(spec.title));return m?m[1]:null}});
bindForm("itsm_out",{entity:"change",mode:"close",map:{out:"outcome",caused:"caused_incident"},nums:[],rec:spec=>{const m=/(CHG\d+)/.exec(unesc(spec.title));return m?m[1]:null},newState:"Closed"});
bindForm("itom_ret",{entity:"ci",mode:"retire",map:{why:"reason",ack:"acknowledged"},nums:[],rec:spec=>{const nm=unesc(spec.title).replace(/^Retire\s+/,"");const c=G(()=>CMDBX.all().find(x=>x.name===nm),null);return c?c.id:null},newState:"Retired",stateKey:"lifecycle"});
const toNum=(v)=>v===""||v==null?v:(isNaN(parseFloat(v))?v:parseFloat(v));
function formFlat(fid,vals,spec){const b=FORMS[fid];if(!b)return null;const e=R.entity(b.entity);let base={},isNew=b.mode==="create",id=null;
 if(b.rec){id=b.rec(spec);if(id){const raw=G(()=>e.get(id),null);if(raw)base=e.flat(raw);isNew=false}}
 const old=clone(base);const rec=clone(base);
 Object.keys(b.map).forEach(fk=>{if(!(fk in vals))return;let v=vals[fk];const ek=b.map[fk];const f=e.byK[ek];
  if(f&&f.type==="number")v=toNum(v);else if(f&&f.type==="bool")v=!!v;rec[ek]=v});
 if(b.newState){rec[b.stateKey||"state"]=b.newState;rec.new_state=b.newState}
 return{rec,old,id,isNew,entity:b.entity,b}}
R.formFlat=formFlat;
function backToForm(fid,st,changes){const b=FORMS[fid];if(!b)return false;const inv={};Object.keys(b.map).forEach(fk=>inv[b.map[fk]]=fk);let any=false;
 changes.forEach(c=>{const fk=inv[c.f];if(fk!=null&&String(st.vals[fk])!==String(c.to)){st.vals[fk]=c.to;any=true}});return any}

/* ======================================================================
   3. CONDITION TREE: compile, preview in plain words, count matches
   ====================================================================== */
const OPS={
 text:[["is","is"],["isnot","is not"],["in","is one of"],["contains","contains"],["starts","starts with"],["empty","is empty"],["notempty","is not empty"],["changed","has changed"],["changedto","changed to"]],
 number:[["is","is"],["isnot","is not"],["gt","is greater than"],["ge","is at least"],["lt","is less than"],["le","is at most"],["in","is one of"],["empty","is empty"],["notempty","is not empty"],["changed","has changed"]],
 bool:[["is","is"],["changed","has changed"]],
 choice:[["is","is"],["isnot","is not"],["in","is one of"],["nin","is none of"],["empty","is empty"],["notempty","is not empty"],["changed","has changed"],["changedto","changed to"]],
 date:[["is","is"],["lt","is before"],["gt","is after"],["empty","is empty"],["notempty","is not empty"],["changed","has changed"]],
 person:[["is","is"],["isnot","is not"],["empty","is empty"],["notempty","is not empty"],["changed","has changed"]],
 viewer:[["hasrole","has the role"],["lacksrole","does not have the role"],["ingroup","is in the group"],["notingroup","is not in the group"]]};
OPS.longtext=OPS.text;
R.OPS=OPS;
const NOVAL=["empty","notempty","changed"];
R.noValueOp=o=>NOVAL.indexOf(o)>=0;
const opLabel=(t,o)=>{const x=arr(OPS[t]||OPS.text).find(a=>a[0]===o);return x?x[1]:o};
function lit(v,f){if(v===true||v===false)return String(v);if(f&&f.type==="bool")return /^(true|yes|1|on)$/i.test(String(v))?"true":"false";
 if(f&&f.type==="number"&&v!==""&&!isNaN(parseFloat(v)))return String(parseFloat(v));return "'"+String(v==null?"":v).replace(/\\/g,"\\\\").replace(/'/g,"\\'")+"'"}
function leafExpr(n,fl){const f=fl[n.f]||{type:"text"};const k=n.f;
 if(f.type==="viewer"){const v=lit(n.v);return n.op==="hasrole"?`hasRole(${v})`:n.op==="lacksrole"?`!hasRole(${v})`:n.op==="ingroup"?`inGroup(${v})`:`!inGroup(${v})`}
 const rhs=n.vk==="field"?String(n.v||"").replace(/[^A-Za-z0-9_.]/g,""):lit(n.v,f);
 switch(n.op){case"is":return `${k} == ${rhs}`;case"isnot":return `${k} != ${rhs}`;case"gt":return `${k} > ${rhs}`;case"ge":return `${k} >= ${rhs}`;case"lt":return `${k} < ${rhs}`;case"le":return `${k} <= ${rhs}`;
  case"in":case"nin":{const parts=String(n.v==null?"":n.v).split(",").map(s=>s.trim()).filter(Boolean).map(s=>lit(s,f));const e=`${k} in [${parts.join(", ")}]`;return n.op==="nin"?`!(${e})`:e}
  case"contains":return `${k} contains ${rhs}`;case"starts":return `${k} startswith ${rhs}`;case"empty":return `isBlank(${k})`;case"notempty":return `!isBlank(${k})`;case"changed":return `changed('${k}')`;case"changedto":return `(changed('${k}') && ${k} == ${rhs})`}
 return "true"}
function treeExpr(t,fl,top){if(!t)return "";if(t.t==="c"){if(!t.f)return "";return leafExpr(t,fl)}
 const parts=arr(t.items).map(x=>treeExpr(x,fl)).filter(Boolean);if(!parts.length)return "";if(parts.length===1)return parts[0];
 const s=parts.join(t.op==="or"?" || ":" && ");return top?s:"("+s+")"}
R.condExpr=(tree,entity)=>{const fl={};R.fieldList(entity).concat(R.VIEWER).forEach(f=>fl[f.k]=f);return treeExpr(tree,fl,true)};
function fieldLabel(entity,k){const f=(R.fieldList(entity).concat(R.VIEWER)).find(x=>x.k===k);return f?f.label:k}
function valLabel(entity,n){if(n.vk==="field")return fieldLabel(entity,n.v);const f=R.fieldList(entity).find(x=>x.k===n.f);
 if(f&&f.opts){const parts=String(n.v==null?"":n.v).split(",").map(s=>s.trim());return parts.map(p=>{const o=f.opts.find(a=>String(Array.isArray(a)?a[0]:a)===p);return o?(Array.isArray(o)?o[1]:o):p}).join(" or ")}
 if(f&&f.type==="bool")return /^(true|yes|1|on)$/i.test(String(n.v))?"yes":"no";return String(n.v==null?"":n.v)}
function plain(t,entity,top){if(!t)return "";if(t.t==="c"){if(!t.f)return "";const f=(R.fieldList(entity).concat(R.VIEWER)).find(x=>x.k===t.f)||{type:"text"};
  const lb=fieldLabel(entity,t.f);const ol=opLabel(f.type,t.op);return NOVAL.indexOf(t.op)>=0?`${lb} ${ol}`:f.type==="viewer"?`the person ${ol.replace(/^has the role/,"has the role").replace(/^is in the group/,"is in the group")} ${t.v}`:`${lb} ${ol} ${valLabel(entity,t)}`}
 const parts=arr(t.items).map(x=>plain(x,entity)).filter(Boolean);if(!parts.length)return "";if(parts.length===1)return parts[0];
 const s=parts.join(t.op==="or"?" or ":" and ");return top?s:"("+s+")"}
R.condPlain=(tree,entity)=>plain(tree,entity,true);
R.leafList=(t,o)=>{o=o||[];if(!t)return o;if(t.t==="c")o.push(t);else arr(t.items).forEach(x=>R.leafList(x,o));return o};
/* run the condition and the optional script on one record; returns {ok, err, leaves:[{leaf,ok,actual}]} */
function evalWhen(body,ctx,wantTrace){const e=body.entity;const fl={};R.fieldList(e).concat(R.VIEWER).forEach(f=>fl[f.k]=f);
 const expr=treeExpr(body.when,fl,true);const script=String(body.script||"").trim();const out={ok:true,expr,script,leaves:[]};
 try{
  if(expr)out.ok=!!E.eval(expr,ctx);
  if(out.ok&&script){const v=E.eval(script,ctx);out.ok=!!v;out.scriptValue=v}
  if(wantTrace){R.leafList(body.when).forEach(l=>{if(!l.f)return;const ex=leafExpr(l,fl);let ok=null;try{ok=!!E.eval(ex,ctx)}catch(x){}
   const f=fl[l.f]||{};const actual=f.type==="viewer"?"":(ctx.rec?ctx.rec[l.f]:undefined);out.leaves.push({leaf:l,ok,actual,label:fieldLabel(e,l.f),text:plain(l,e)})})}
 }catch(x){out.ok=false;out.err=x&&x.msg?x.msg:String(x&&x.message||x)}
 return out}
R.evalWhen=evalWhen;
/* how many current records match: {n, m, ids[], sample} */
R.countMatches=(body,limit)=>{const e=R.entity(body.entity);if(!e)return{n:null,m:null,ids:[],note:"This table has no live records in the prototype store"};
 const ids=arr(G(()=>e.list(),[]));const out={n:0,m:ids.length,ids:[],err:null};let n=0;
 for(const id of ids.slice(0,limit||800)){const raw=G(()=>e.get(id),null);if(!raw)continue;let flat;try{flat=e.flat(raw)}catch(x){continue}
  const r=evalWhen(body,{rec:flat,old:flat,user:ME(),isNew:false,trigger:"count",role:"",fn:viewerFns()});if(r.err){out.err=r.err;break}if(r.ok){n++;if(out.ids.length<6)out.ids.push(id)}}
 out.n=n;return out};

/* ======================================================================
   4. ACTIONS (each one says exactly what it will change; the same code runs live or dry)
   ====================================================================== */
const tpl=(s,rec)=>String(s==null?"":s).replace(/\{([A-Za-z0-9_.]+)\}/g,(m,k)=>{const v=getF(rec||{},k);return v==null||v===""?"(blank)":String(v)});
R.tpl=tpl;
const GROUPS_PERM=()=>arr(G(()=>PERM.groups,[]));
function groupMembers(ref){const g=G(()=>APG.get(ref),null);if(g)return{name:g.name,members:arr(g.members)};
 const p=G(()=>PERM.groups.find(x=>x.id===ref||x.n===ref),null);if(p)return{name:p.n,members:arr(p.users)};
 const byN=G(()=>APG.byName(ref),null);if(byN)return{name:byN.name,members:arr(byN.members)};return{name:ref,members:[]}}
R.groupMembers=groupMembers;
function groupOpts(){const a=G(()=>APG.groups().map(g=>["apg:"+g.id,g.name]),[]);return a}
R.groupOpts=()=>G(()=>APG.groups().map(g=>[g.id,g.name]),[]);
function nowHM(){const d=new Date();return d.getHours()*60+d.getMinutes()}
const hm=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(s||""));return m?(+m[1])*60+(+m[2]):null};
function inQuiet(q){if(!q||!q.from||!q.to)return false;const a=hm(q.from),b=hm(q.to),n=nowHM();if(a==null||b==null)return false;return a<=b?(n>=a&&n<b):(n>=a||n<b)}
R.inQuiet=inQuiet;
/* deliver(spec,rec,rule,dry) -> {state:'sent'|'digest'|'held'|'suppressed', to:[], title, body, why} */
function deliver(sp,rec,rule,dry){
 const who=sp.who||"group",ref=sp.ref||"";let to=[],toName="";
 if(who==="group"||who==="approver_group"){const g=groupMembers(ref);to=g.members;toName=g.name+(who==="approver_group"?" (approver group)":" group")}
 else if(who==="person"){to=[tpl(ref,rec)];toName=to[0]}
 else if(who==="owner"){const n=getF(rec,"owner")||getF(rec,"own")||"";to=n?[n]:[];toName=n?n+" (record owner)":"The record owner (none set)"}
 else if(who==="role"){toName="Everyone with the role "+ref;to=[]}
 else if(who==="requester"){const n=getF(rec,"requester")||getF(rec,"caller")||"";to=n?[n]:[];toName=n?n+" (requester)":"The requester (none set)"}
 const title=tpl(sp.title||"Notice",rec),body=tpl(sp.body||"",rec);
 const key=(rule?rule.id:"adhoc")+"|"+title+"|"+(rec&&rec.id||"");const mins=+sp.dedupeMin||0;
 const o={state:"sent",to,toName,title,body,key,mode:sp.mode||"immediate",kind:sp.kind||"info"};
 if(mins>0&&D.seen[key]&&Date.now()-D.seen[key]<mins*60000){o.state="suppressed";o.why="Same notice sent within "+mins+" minutes (de-duplicated)";return o}
 const q=sp.quiet===true?D.cfg.quiet:(sp.quiet&&sp.quiet.from?sp.quiet:null);
 if(o.mode==="digest"){o.state="digest";o.why="Waits for the daily digest";if(!dry){D.digest.unshift({ts:Date.now(),title,body,to:toName,rule:rule&&rule.id,rec:rec&&rec.id});if(D.digest.length>200)D.digest.length=200;D.seen[key]=Date.now()}return o}
 if(q&&inQuiet(q)){o.state="held";o.why="Quiet hours "+q.from+" to "+q.to+": held for the digest";if(!dry){D.digest.unshift({ts:Date.now(),title,body,to:toName,rule:rule&&rule.id,rec:rec&&rec.id,held:true});D.seen[key]=Date.now()}return o}
 if(!dry){D.seen[key]=Date.now();
  G(()=>R17N.notify({kind:o.kind==="bad"?"bad":o.kind==="warn"?"warn":"info",title,body:"To "+toName+(to.length?" ("+to.length+(to.length===1?" person":" people")+")":"")+(body?". "+body:""),key:"r17s|"+key,life:7000,
   actions:[{label:"Open rules",fn:()=>G(()=>go("r17s_rules"))}]}));
  G(()=>EVENTS.emit("rule.notification_sent",{rule:rule&&rule.id,to:toName,title,record:rec&&rec.id||""},{source:"r17s_rules",actor:ME()}))}
 return o}
R.deliver=deliver;
const FIELDOPTS=(c)=>R.fieldList(c.entity).map(f=>[f.k,f.label]);
/* action registry. run(c,a): c={rec,old,entity,rule,dry,res,fx,form} */
const ACT={};R.ACT=ACT;
const defAct=(id,o)=>{ACT[id]=Object.assign({id},o)};
const fname=(c,k)=>fieldLabel(c.entity,k);
const setV=(c,k,v,why)=>{const from=getF(c.rec,k);if(eq(from,v)&&!(from==null&&v!=null&&v!==""))return false;c.rec[k]=v;c.res.changes.push({f:k,label:fname(c,k),from,to:v,rule:c.rule.id,why});
 const f=R.fieldList(c.entity).find(x=>x.k===k);if(c.fx&&!c.dry){c.fx.set=c.fx.set||{};c.fx.set[k]=v}return true};
function valOf(c,a){const raw=a.value;if(a.mode==="expr"){const r=E.test(String(raw||""),{rec:c.rec,old:c.old,isNew:c.isNew,trigger:c.trigger,user:ME()});if(!r.ok)throw {msg:"Value expression: "+r.err};return r.v}
 const f=R.fieldList(c.entity).find(x=>x.k===a.field);const t=tpl(raw,c.rec);if(f&&f.type==="number"&&t!==""&&!isNaN(parseFloat(t)))return parseFloat(t);if(f&&f.type==="bool")return /^(true|yes|1|on)$/i.test(t);return t}
const fieldSel=(label)=>({k:"field",label:label||"Field",type:"field",req:true});
const msgKinds=[["info","Information"],["warn","Warning"],["bad","Error"],["good","Success"]];
const client={
 show_field:{label:"Show a field",group:"Show and hide",fields:[fieldSel()],sum:(a,e)=>"Shows "+fieldLabel(e,a.field)+" on the form",run:(c,a)=>{c.fx.show[a.field]=1;delete c.fx.hide[a.field];c.res.effects.push({k:"show",text:"Shows the field "+fname(c,a.field)})}},
 hide_field:{label:"Hide a field",group:"Show and hide",fields:[fieldSel()],sum:(a,e)=>"Hides "+fieldLabel(e,a.field)+" from the form",run:(c,a)=>{c.fx.hide[a.field]=1;delete c.fx.show[a.field];c.res.effects.push({k:"hide",text:"Hides the field "+fname(c,a.field)})}},
 mandatory:{label:"Make a field required",group:"Required and read-only",fields:[fieldSel()],sum:(a,e)=>"Makes "+fieldLabel(e,a.field)+" required before saving",run:(c,a)=>{c.fx.req[a.field]=1;c.res.effects.push({k:"req",text:"Makes "+fname(c,a.field)+" required"})}},
 optional:{label:"Make a field optional",group:"Required and read-only",fields:[fieldSel()],sum:(a,e)=>"Makes "+fieldLabel(e,a.field)+" optional",run:(c,a)=>{delete c.fx.req[a.field];c.fx.opt[a.field]=1;c.res.effects.push({k:"opt",text:"Makes "+fname(c,a.field)+" optional"})}},
 readonly:{label:"Make a field read-only",group:"Required and read-only",fields:[fieldSel()],sum:(a,e)=>"Locks "+fieldLabel(e,a.field)+" so it cannot be edited",run:(c,a)=>{c.fx.ro[a.field]=1;c.res.effects.push({k:"ro",text:"Locks "+fname(c,a.field)})}},
 editable:{label:"Make a field editable",group:"Required and read-only",fields:[fieldSel()],sum:(a,e)=>"Unlocks "+fieldLabel(e,a.field),run:(c,a)=>{delete c.fx.ro[a.field];c.res.effects.push({k:"rw",text:"Unlocks "+fname(c,a.field)})}},
 set_value:{label:"Set a field value",group:"Values",fields:[fieldSel(),{k:"mode",label:"Value is",type:"select",opts:[["text","A fixed value"],["expr","Calculated (expression)"]]},{k:"value",label:"Value",type:"text",ph:"For example High, or today()"}],
  sum:(a,e)=>"Sets "+fieldLabel(e,a.field)+" to "+(a.mode==="expr"?"the result of "+a.value:"'"+(a.value||"")+"'"),run:(c,a)=>{const v=valOf(c,a);setV(c,a.field,v)}},
 set_choices:{label:"Set the choices of a drop-down from another field",group:"Values",fields:[fieldSel("Drop-down to fill"),{k:"parent",label:"Narrow by this field",type:"field",req:true},{k:"list",label:"Choice list",type:"choicelist",req:true}],
  sum:(a,e)=>"Fills "+fieldLabel(e,a.field)+" from the choice list "+(R.get(a.list)?R.get(a.list).live&&R.get(a.list).live.name||R.get(a.list).body.name:a.list||"?")+", narrowed by "+fieldLabel(e,a.parent),
  run:(c,a)=>{const vals=R.choices(a.list,getF(c.rec,a.parent));if(!vals.length)return;c.fx.choices[a.field]={values:vals,parent:a.parent,parentValue:getF(c.rec,a.parent),list:a.list};c.res.effects.push({k:"choices",text:"Offers "+vals.length+" choices in "+fname(c,a.field)+" for "+fname(c,a.parent)+" = "+(getF(c.rec,a.parent)||"(none)")})}},
 message:{label:"Show a message or field note",group:"Messages",fields:[{k:"kind",label:"Style",type:"select",opts:msgKinds},{k:"where",label:"Where",type:"select",opts:[["banner","Banner at the top of the form"],["field","Note under a field"]]},{k:"field",label:"Field (for a note)",type:"field"},{k:"text",label:"Message",type:"longtext",req:true,ph:"Plain words; use {field} to insert a value"}],
  sum:(a,e)=>(a.where==="field"&&a.field?"Shows a note under "+fieldLabel(e,a.field):"Shows a banner")+": \""+(a.text||"")+"\"",run:(c,a)=>{const m={kind:a.kind||"info",text:tpl(a.text,c.rec),field:a.where==="field"?a.field:"",rule:c.rule.id};c.res.msgs.push(m);if(m.field)c.fx.notes.push(m);else c.fx.banners.push(m)}},
 validate_block:{label:"Validate and block the save",group:"Validate",fields:[{k:"field",label:"Field to mark (optional)",type:"field"},{k:"text",label:"Message shown to the person",type:"longtext",req:true,ph:"Say what to fix"}],
  sum:(a,e)=>"Blocks saving with the message \""+(a.text||"")+"\"",run:(c,a)=>{const m={kind:"bad",text:tpl(a.text,c.rec),field:a.field||"",rule:c.rule.id};c.res.msgs.push(m);if(c.trigger==="submit"||c.trigger==="cell"||c.trigger==="before_save"||c.trigger==="status_change"||c.trigger==="delete"||c.trigger==="click"){if(!c.res.blocked)c.res.blocked={rule:c.rule.id,name:c.rule.name,text:m.text,field:m.field}}else{c.fx.errors[m.field||"_"]=m.text;c.fx.banners.push(m)}}},
 confirm:{label:"Ask the person to confirm first",group:"Validate",fields:[{k:"text",label:"Question",type:"longtext",req:true,ph:"Are you sure?"},{k:"label",label:"Confirm button",type:"text",ph:"Yes, continue"}],
  sum:(a,e)=>"Asks \""+(a.text||"")+"\" before the save goes through",run:(c,a)=>{if(c.confirmed&&c.confirmed[c.rule.id])return;if(!c.res.confirm)c.res.confirm={rule:c.rule.id,name:c.rule.name,text:tpl(a.text,c.rec),label:a.label||"Yes, continue"};c.res.msgs.push({kind:"warn",text:"Asks first: "+tpl(a.text,c.rec),field:"",rule:c.rule.id})}}};
const business={
 set_field:{label:"Set a field",group:"Change the record",fields:[fieldSel(),{k:"mode",label:"Value is",type:"select",opts:[["text","A fixed value"],["expr","Calculated (expression)"]]},{k:"value",label:"Value",type:"text",ph:"For example Escalated, or addHours(today(), slaHours(priority))"}],
  sum:(a,e)=>"Sets "+fieldLabel(e,a.field)+" to "+(a.mode==="expr"?"the result of "+a.value:"'"+(a.value||"")+"'"),run:(c,a)=>{const v=valOf(c,a);setV(c,a.field,v)}},
 validate_abort:{label:"Validate and stop the save",group:"Change the record",fields:[{k:"text",label:"Message shown to the person",type:"longtext",req:true,ph:"Say what has to happen first"}],
  sum:(a,e)=>"Stops the save with \""+(a.text||"")+"\"",run:(c,a)=>{const m={kind:"bad",text:tpl(a.text,c.rec),field:"",rule:c.rule.id};c.res.msgs.push(m);if(!c.res.blocked)c.res.blocked={rule:c.rule.id,name:c.rule.name,text:m.text,field:""}}},
 notify:{label:"Notify a group or person",group:"Tell people",fields:[{k:"who",label:"Who",type:"select",opts:[["group","A group"],["approver_group","An approver group"],["person","A person"],["owner","The record owner"],["requester","The requester"]]},{k:"ref",label:"Group or person",type:"recipient"},{k:"title",label:"Title",type:"text",req:true,ph:"Use {field} to insert a value"},{k:"body",label:"Details",type:"longtext"},{k:"mode",label:"Delivery",type:"select",opts:[["immediate","Immediately"],["digest","In the daily digest"]]},{k:"quiet",label:"Respect quiet hours",type:"toggle"},{k:"dedupeMin",label:"Do not repeat within (minutes)",type:"number",ph:"0"},{k:"kind",label:"Style",type:"select",opts:msgKinds}],
  sum:(a,e)=>{const g=a.who==="group"||a.who==="approver_group"?groupMembers(a.ref).name:a.who==="person"?a.ref:a.who==="owner"?"the record owner":"the requester";return "Notifies "+g+(a.mode==="digest"?" in the daily digest":" right away")+": \""+(a.title||"")+"\""+(+a.dedupeMin?", not repeated within "+a.dedupeMin+" minutes":"")},
  run:(c,a)=>{const r=deliver(a,c.rec,c.rule,c.dry);c.res.notifs.push(Object.assign({rule:c.rule.id},r))}},
 create_task:{label:"Create a task",group:"Create work",fields:[{k:"title",label:"Task",type:"text",req:true},{k:"assignee",label:"Assign to",type:"recipient1"},{k:"dueDays",label:"Due in (days)",type:"number",ph:"3"}],
  sum:(a,e)=>"Creates the task \""+(a.title||"")+"\" for "+(a.assignee||"the record owner")+" due in "+(a.dueDays||3)+" days",
  run:(c,a)=>{const title=tpl(a.title,c.rec),who=a.assignee&&a.assignee!=="owner"?a.assignee:(getF(c.rec,"owner")||ME()),due=FNS.addDays([isoDay(),+a.dueDays||3]);const id="TSK-R"+(D.seq++);
   if(!c.dry)G(()=>STORE.put("project_task",{id,wbs:"R."+D.seq,name:title,owner:who,planned_finish:due,percent_complete:0}));c.res.effects.push({k:"task",text:"Creates task "+id+" \""+title+"\" for "+who+", due "+due,id})}},
 create_record:{label:"Create a record",group:"Create work",fields:[{k:"entity",label:"Table",type:"table",req:true},{k:"pairs",label:"Field values",type:"longtext",ph:"name=Follow-up for {id}, owner=Tom Becker"}],
  sum:(a,e)=>"Creates a record in "+(a.entity||"?")+" with "+(a.pairs||"no values"),run:(c,a)=>{const o={};String(a.pairs||"").split(",").forEach(p=>{const i=p.indexOf("=");if(i>0)o[p.slice(0,i).trim()]=tpl(p.slice(i+1).trim(),c.rec)});o.id=o.id||("R-"+(D.seq++));
   if(!c.dry)G(()=>STORE.put(a.entity,o));c.res.effects.push({k:"record",text:"Creates "+a.entity+" "+o.id+" ("+Object.keys(o).filter(k=>k!=="id").map(k=>k+"="+o[k]).join(", ")+")"})}},
 start_workflow:{label:"Start a workflow",group:"Start other work",fields:[{k:"flow",label:"Workflow",type:"flow",req:true}],
  sum:(a,e)=>"Starts the workflow "+flowName(a.flow)+" with this record",run:(c,a)=>{let r=null;if(!c.dry)r=G(()=>FLOWX.start(a.flow,Object.assign({},c.rec)),null);c.res.effects.push({k:"flow",text:(c.dry?"Would start ":"Started ")+"the workflow "+flowName(a.flow)+(r&&r.id?" ("+r.id+")":"")})}},
 call_approval:{label:"Ask a group to approve",group:"Start other work",fields:[{k:"group",label:"Approver group",type:"group",req:true},{k:"text",label:"What is being approved",type:"text",req:true}],
  sum:(a,e)=>"Sends an approval request to "+groupMembers(a.group).name+": \""+(a.text||"")+"\"",run:(c,a)=>{const g=groupMembers(a.group),text=tpl(a.text,c.rec);
   if(!c.dry){const id=R.requestApproval({kind:"action",group:a.group,text,rule:c.rule.id,rec:c.rec.id});c.res.effects.push({k:"approval",text:"Sent approval "+id+" to "+g.name+": "+text})}else c.res.effects.push({k:"approval",text:"Would send an approval to "+g.name+" ("+g.members.length+" people): "+text})}},
 raise_event:{label:"Raise an event",group:"Start other work",fields:[{k:"event",label:"Event id",type:"event",req:true},{k:"detail",label:"Detail",type:"text"}],
  sum:(a,e)=>"Raises the event "+(a.event||"?")+" on the event bus",run:(c,a)=>{if(!c.dry)G(()=>EVENTS.emit(a.event,{record:c.rec.id||"",entity:c.entity,detail:tpl(a.detail,c.rec),rule:c.rule.id},{source:"r17s_rules",actor:ME()}));c.res.effects.push({k:"event",text:(c.dry?"Would raise ":"Raised ")+"the event "+a.event})}},
 call_agent:{label:"Call an AI agent",group:"Start other work",fields:[{k:"agent",label:"Agent",type:"agent",req:true},{k:"goal",label:"What it should do",type:"text",req:true}],
  sum:(a,e)=>"Asks "+(a.agent||"an agent")+" to: "+(a.goal||"")+" (the agent gateway applies its tier rules)",run:(c,a)=>{let r=null;const goal=tpl(a.goal,c.rec);if(!c.dry)r=G(()=>AGENTRT.execute({agent:a.agent,goal,input:{record:c.rec.id},instance:c.rec.id||"",step:"rule "+c.rule.id}),null);
   c.res.effects.push({k:"agent",text:c.dry?"Would ask "+a.agent+" to "+goal+" (tier rules, budget cap and sponsor gate still apply)":(r?(r.ok?a.agent+" ran: "+(r.needsApproval?"waiting for its sponsor":"completed")+" ("+r.runId+")":a.agent+" was blocked: "+r.why):"Agent runtime not available")})}},
 add_audit:{label:"Add an audit entry",group:"Record keeping",fields:[{k:"text",label:"Audit text",type:"text",req:true}],sum:(a,e)=>"Writes an audit entry: \""+(a.text||"")+"\"",run:(c,a)=>{const t=tpl(a.text,c.rec);if(!c.dry)G(()=>audit("Rule: "+c.rule.name,t));c.res.effects.push({k:"audit",text:"Audit entry: "+t})}}};
const uiOnly={open_screen:{label:"Open a screen",group:"Navigate",fields:[{k:"screen",label:"Screen id",type:"text",ph:"itsm_mi"}],sum:(a)=>"Opens the screen "+(a.screen||"?"),run:(c,a)=>{if(!c.dry)G(()=>go(a.screen));c.res.effects.push({k:"go",text:(c.dry?"Would open ":"Opened ")+"the screen "+a.screen})}}};
Object.keys(client).forEach(k=>defAct(k,Object.assign({kind:"client"},client[k])));
Object.keys(business).forEach(k=>defAct(k,Object.assign({kind:"business"},business[k])));
Object.keys(uiOnly).forEach(k=>defAct(k,Object.assign({kind:"ui"},uiOnly[k])));
function flowName(id){return G(()=>FLOWX.flows().find(f=>f.id===id).name,id||"?")}
R.flowName=flowName;
/* which action ids a rule type may use */
R.actionIds=type=>type==="client"?Object.keys(client):type==="business"?Object.keys(business):type==="uiaction"?["set_value","message","confirm","notify","create_task","start_workflow","call_approval","raise_event","open_screen","add_audit"]:[];
R.actionSummary=(a,entity)=>{const d=ACT[a.t];return d?G(()=>d.sum(a,entity),d.label):a.t};
R.newAction=t=>{const d=ACT[t];const a={t};if(d)d.fields.forEach(f=>{if(f.k==="mode")a.mode="text";if(f.k==="kind")a.kind="info";if(f.k==="where")a.where="banner";if(f.k==="who")a.who="group"});return a};

/* approvals raised by rules (to a group): small internal queue, decided by a group member other than the requester */
R.requestApproval=function(o){const id="RAP-"+(1000+D.seq++);const g=groupMembers(o.group);
 D.appr.unshift({id,kind:o.kind||"activation",group:o.group,groupName:g.name,text:o.text,rule:o.rule||"",rec:o.rec||"",by:ME(),at:Date.now(),state:"pending",decisions:[],ver:o.ver||0});
 G(()=>audit("Rules: approval requested",id+" to "+g.name+": "+o.text));G(()=>EVENTS.emit("approval.requested",{item:id,group:g.name,source:"rules"},{source:"r17s_rules",actor:ME()}));
 G(()=>R17N.notify({kind:"approval",title:"Approval needed: "+o.text,body:"Sent to "+g.name+". "+g.members.length+" people can decide.",key:"r17s|"+id,actions:[{label:"Review",primary:true,fn:()=>{S.v.r17sv=6;go("r17s_rules")}}]}));
 persist();return id};

/* ======================================================================
   5. RULE STORE: bodies, versions, live snapshots, persistence
   ====================================================================== */
const blankBody=(type,entity)=>({name:"",desc:"",type,entity:entity||"incident",trigger:arr(TRIG[type])[0]?TRIG[type][0][0]:"",watch:[],event:"",schedule:"daily",once:true,form:"",order:100,stop:false,
 when:{t:"g",op:"and",items:[]},script:"",then:[],else:[],scope:{kind:"all",roles:[],groups:[]},window:{from:"",to:""},owner:"",backup:"",
 deliver:{who:"group",ref:"",title:"",body:"",mode:"immediate",quiet:true,dedupeMin:30,kind:"info"},ui:{label:"",place:"form",roles:[],confirm:""},choice:{field:"",kind:"static",parent:"",values:[],map:{}}});
R.blankBody=blankBody;
R.normBody=b=>Object.assign(blankBody(b&&b.type,b&&b.entity),clone(b||{}),{});
const byId=id=>D.rules.find(r=>r.id===id)||null;
R.get=byId;R.list=()=>D.rules.slice();
function newId(){return "RUL-"+(D.seq++)}
function addHist(r,note,approved,by){r.hist.unshift({v:r.ver,at:Date.now(),by:by||ME(),note:note||"",body:clone(r.body),approved:!!approved});if(r.hist.length>25)r.hist.length=25}
R.register=function(body,meta){meta=meta||{};const b=R.normBody(body);const r={id:meta.id||newId(),status:meta.status||"draft",ver:1,liveVer:0,body:b,live:null,hist:[],rt:{fired:0,failed:0,evaluated:0,last:0,tested:0,testOk:null,tripped:false,stamps:[],lastErr:""},created:Date.now(),createdBy:meta.by||ME(),dirty:true};
 if(meta.live){r.live=clone(b);r.liveVer=1;r.status="active";r.dirty=false;r.approvedBy=meta.approvedBy||"Platform governance board"}
 addHist(r,meta.note||"Created",!!meta.live,meta.by);D.rules.push(r);if(meta.live)reindex();persist();return r};
R.save=function(id,body,note){const r=byId(id);if(!r)return null;const nb=R.normBody(body);if(JSON.stringify(nb)===JSON.stringify(r.body))return r;r.body=nb;r.ver++;r.dirty=true;r.rt.tested=0;r.rt.testOk=null;if(r.status==="pending"){r.status=r.live?"active":"draft"}
 addHist(r,note||"Edited",false);G(()=>audit("Rule edited",r.id+" v"+r.ver+": "+nb.name));persist();return r};
R.retire=function(id,why){const r=byId(id);if(!r)return null;r.status="retired";r.live=null;addHist(r,"Retired"+(why?": "+why:""),false);reindex();G(()=>audit("Rule retired",r.id+" "+r.body.name));G(()=>EVENTS.emit("rule.retired",{rule:r.id},{source:"r17s_rules",actor:ME()}));persist();return r};
R.rollback=function(id,ver){const r=byId(id);if(!r)return{ok:false,why:"Unknown rule"};const h=r.hist.find(x=>x.v===ver);if(!h)return{ok:false,why:"No such version"};
 r.body=R.normBody(h.body);r.ver++;let msg="Restored version "+ver+" as a new draft version "+r.ver+". It goes live after approval.";
 if(h.approved&&r.live){r.live=clone(r.body);r.liveVer=r.ver;r.dirty=false;msg="Version "+ver+" was already approved, so it is live again as version "+r.ver+"."}else r.dirty=true;
 addHist(r,"Rolled back to v"+ver,!!(h.approved&&r.live));reindex();G(()=>audit("Rule rolled back",r.id+" to v"+ver));G(()=>EVENTS.emit("rule.rolled_back",{rule:r.id,version:ver},{source:"r17s_rules",actor:ME()}));persist();return{ok:true,msg}};
/* ---- permissions ---- */
const MAKER=["platform_admin","architect","change_manager","service_desk","security","executive","project_manager","portfolio_lead"];
const ACTIVATOR=["platform_admin","architect","change_manager","executive","security"];
const KILLER=["platform_admin","executive","security"];
R.roleSets={create:MAKER,edit:MAKER,activate:ACTIVATOR,kill:KILLER};
R.can=function(action){const p=principal();const roles=arr(p&&p.roles);const need=R.roleSets[action]||[];
 let ok=need.some(r=>roles.indexOf(r)>=0);let via="role";
 try{if(W.PERM&&PERM.can){const d=PERM.can(null,action==="activate"?"approve":action==="kill"?"update":action==="create"?"create":"update","rule_definition");if(d&&d.ok===false&&!d.off&&!d.def){ok=false;via="permission"}}}catch(e){}
 return{ok,need,via,roles}};
/* ---- governance: activation needs a group approval ---- */
R.problems=function(r){const b=r.body,p=[];if(!b.name.trim())p.push("Give the rule a name");if(!b.owner)p.push("Name an owner");if(!b.backup)p.push("Name a backup");else if(b.backup===b.owner)p.push("The backup must be a different person from the owner");
 const dm=new Set(G(()=>DIR.filter(d=>d.kind==="human").map(d=>d.name),[]));if(b.owner&&dm.size&&!dm.has(b.owner))p.push("The owner must be a person in the directory");if(b.backup&&dm.size&&!dm.has(b.backup))p.push("The backup must be a person in the directory");
 if(b.type!=="choice"&&b.type!=="notify"&&!b.then.length&&!b.else.length)p.push("Add at least one action");
 if(b.type==="notify"&&(!b.deliver.ref&&b.deliver.who!=="owner"&&b.deliver.who!=="requester"))p.push("Choose who is notified");
 if(b.type==="choice"&&!(arr(b.choice.values).length||Object.keys(b.choice.map||{}).length))p.push("Add the choices");
 const keys=R.fieldList(b.entity).map(f=>f.k);const sc=E.validate(b.script,keys);if(!sc.ok)p.push("Script: "+sc.err);
 const cy=R.cycles().filter(c=>c.rules.indexOf(r.id)>=0);if(cy.length)p.push("Loop risk: "+cy[0].text);
 return p};
R.requestActivation=function(id){const r=byId(id);if(!r)return{ok:false,why:"Unknown rule"};const can=R.can("activate");if(!can.ok)return{ok:false,why:"Your role cannot request activation. It needs one of: "+can.need.join(", ")};
 const pr=R.problems(r);if(pr.length)return{ok:false,why:pr[0],all:pr};if(!r.rt.tested)return{ok:false,why:"Run a test on a record first. Untested rules cannot be activated.",all:["Run a test on a record first"]};
 if(r.appr&&byAppr(r.appr)&&byAppr(r.appr).state==="pending")return{ok:false,why:"An approval is already waiting for the Platform governance board"};
 const gid=R.govGroup();const aid=R.requestApproval({kind:"activation",group:gid,text:"Activate rule "+r.id+" v"+r.ver+": "+r.body.name,rule:r.id,ver:r.ver});r.appr=aid;r.status="pending";addHist(r,"Activation requested (approval "+aid+")",false);persist();return{ok:true,id:aid}};
const byAppr=id=>D.appr.find(a=>a.id===id)||null;R.approval=byAppr;
R.govGroup=()=>G(()=>APG.get("apg_platform")?"apg_platform":APG.groups()[0].id,"apg_platform");
R.decide=function(aid,by,dec,note){const a=byAppr(aid);if(!a||a.state!=="pending")return{ok:false,why:"That approval is not waiting"};
 const g=groupMembers(a.group);if(g.members.indexOf(by)<0)return{ok:false,why:by+" is not in "+g.name};if(by===a.by)return{ok:false,why:"Separation of duties: the person who asked cannot decide"};
 a.decisions.push({by,dec,note:note||"",at:Date.now()});G(()=>APG.record(a.group,by,dec==="approve"?"approved":"rejected",a.id,note||""));
 const q=G(()=>APG.get(a.group).quorum,{mode:"any",n:1});const need=q.mode==="nofm"?Math.max(1,q.n||2):1;const yes=a.decisions.filter(d=>d.dec==="approve").length;
 let out={ok:true,state:"pending",need,yes};
 if(dec==="reject"){a.state="rejected";out.state="rejected"}else if(yes>=need){a.state="approved";out.state="approved"}
 const r=byId(a.rule);
 if(r&&a.kind==="activation"&&a.state==="approved"){r.live=clone(r.body);r.liveVer=r.ver;r.status="active";r.dirty=false;r.approvedBy=g.name;const h=r.hist.find(x=>x.v===a.ver);if(h){h.approved=true;h.by=h.by}addHist(r,"Activated by "+g.name+" ("+a.decisions.map(d=>d.by).join(", ")+")",true,by);reindex();
  G(()=>audit("Rule activated",r.id+" v"+r.ver+" by "+g.name));G(()=>EVENTS.emit("rule.activated",{rule:r.id,version:r.ver,group:g.name},{source:"r17s_rules",actor:by}));
  G(()=>R17N.notify({kind:"good",title:"Rule live: "+r.body.name,body:"Approved by "+g.name+". Owner "+r.body.owner+", backup "+r.body.backup+".",key:"r17s|act|"+r.id}))}
 else if(r&&a.kind==="activation"&&a.state==="rejected"){r.status=r.live?"active":"draft";addHist(r,"Activation rejected by "+by+(note?": "+note:""),false,by);G(()=>audit("Rule activation rejected",r.id))}
 persist();return out};
R.approveNow=(rid,by)=>{const r=byId(rid);if(!r||!r.appr)return{ok:false,why:"No approval pending"};let out;const a=byAppr(r.appr);const mem=groupMembers(a.group).members.filter(m=>m!==a.by);
 for(const m of mem){out=R.decide(r.appr,by&&mem.indexOf(by)>=0&&!out?by:m,"approve","");if(!out.ok||out.state!=="pending")break}return out};
/* ---- kill switch ---- */
R.kill={get:()=>D.kill,isOff:t=>D.kill.all||(t&&D.kill.types[t]),set(scope,on,reason){const c=R.can("kill");if(!c.ok)return{ok:false,why:"Your role cannot use the kill switch. It needs one of: "+c.need.join(", ")};
  if(scope==="all")D.kill.all=!!on;else D.kill.types[scope]=!!on;D.kill.by=ME();D.kill.at=Date.now();D.kill.reason=reason||D.kill.reason||"";
  G(()=>audit("Rules kill switch",(on?"Disabled ":"Enabled ")+(scope==="all"?"all rules":TYPES[scope].label+"s")+(reason?": "+reason:"")));G(()=>EVENTS.emit("rule.kill_switch",{scope,on:!!on,reason:reason||""},{source:"r17s_rules",actor:ME()}));
  G(()=>R17N.notify({kind:on?"warn":"good",title:on?"Rules switched off: "+(scope==="all"?"all rules":TYPES[scope].label+"s"):"Rules switched on: "+(scope==="all"?"all rules":TYPES[scope].label+"s"),body:on?"Records save without these rules until an authorized person turns them back on.":"",key:"r17s|kill|"+scope+on,life:6000}));
  persist();return{ok:true}}};

/* ---------- persistence (entity store; quiet until the Atlas entities are registered) ---------- */
let pT=0;
function persist(){clearTimeout(pT);pT=setTimeout(doPersist,400)}
const sig=o=>{try{return JSON.stringify(o)}catch(e){return ""}};
function doPersist(){const S_=W.STORE;if(!R.ready||!S_||!S_.put)return;try{
 const stv=sig({kill:D.kill,appr:D.appr,digest:D.digest.slice(0,50),seq:D.seq,cfg:D.cfg});
 if(D._ps!==stv){D._ps=stv;S_.put("rule",{id:"RUL-STATE",kind:"state",name:"Rules engine state",entity:"",type:"",trigger:"",status:"",owner:"",backup:"",version:1,body:stv})}
 D.rules.forEach(r=>{const bodyJ=sig({body:r.body,live:r.live,liveVer:r.liveVer,hist:r.hist,rt:Object.assign({},r.rt,{stamps:[]}),appr:r.appr||"",approvedBy:r.approvedBy||"",dirty:r.dirty,created:r.created,createdBy:r.createdBy});
  const h=r.status+"|"+r.ver+"|"+bodyJ.length+"|"+(r.rt.tested||0)+"|"+(r.appr||"");if(r._ph===h)return;r._ph=h;const b=r.body;
  if(b.type==="choice"){S_.put("choice_list",{id:r.id,name:b.name,field:b.choice.field,kind:b.choice.kind,parent_field:b.choice.parent,entity_ref:b.entity,status:r.status,owner:b.owner,backup:b.backup,version:r.ver,body:bodyJ})}
  else{S_.put("rule",{id:r.id,kind:"rule",name:b.name,entity:b.entity,type:b.type,trigger:b.trigger,status:r.status,owner:b.owner,backup:b.backup,version:r.ver,body:bodyJ});
   arr(b.then).concat(arr(b.else)).forEach((a,i)=>{S_.put("rule_action",{id:r.id+"#"+(i+1),rule:r.id,seq:i+1,branch:i<arr(b.then).length?"then":"else",action:a.t,summary:R.actionSummary(a,b.entity).slice(0,200)})})}})}catch(e){}}
R.persist=persist;
function hydrate(){const S_=W.STORE;if(!S_||!S_.all)return;try{
 const take=(x)=>{let j;try{j=JSON.parse(x.body)}catch(e){return}
  if(x.id==="RUL-STATE"){if(j.kill)D.kill=Object.assign(D.kill,j.kill);if(j.appr)D.appr=j.appr;if(j.seq)D.seq=Math.max(D.seq,j.seq);if(j.cfg)Object.assign(D.cfg,j.cfg);if(j.digest)D.digest=j.digest;return}
  const cur=byId(x.id);
  if(cur){if((x.version||1)>cur.ver||(x.version===cur.ver&&JSON.stringify(j.body)!==JSON.stringify(cur.body))){cur.body=R.normBody(j.body);cur.live=j.live;cur.liveVer=j.liveVer;cur.hist=j.hist;cur.ver=x.version;cur.status=x.status;cur.rt=Object.assign(cur.rt,j.rt);cur.appr=j.appr;cur.approvedBy=j.approvedBy;cur.dirty=j.dirty}}
  else{D.rules.push({id:x.id,status:x.status,ver:x.version,liveVer:j.liveVer,body:R.normBody(j.body),live:j.live,hist:j.hist,rt:Object.assign({fired:0,failed:0,evaluated:0,last:0,tested:0,testOk:null,tripped:false,stamps:[],lastErr:""},j.rt),appr:j.appr,approvedBy:j.approvedBy,dirty:j.dirty,created:j.created,createdBy:j.createdBy});const n=parseInt(String(x.id).replace(/\D/g,""),10);if(n>=D.seq&&n<9000)D.seq=n+1}};
 arr(S_.all("rule")).forEach(take);arr(S_.all("choice_list")).forEach(take);
 reindex()}catch(e){}}
R.hydrate=hydrate;

/* ======================================================================
   6. THE RUNNER: select rules, guard loops, evaluate, run actions, log
   ====================================================================== */
const IDX={};
function reindex(){Object.keys(IDX).forEach(k=>delete IDX[k]);D.rules.forEach(r=>{if(!r.live||r.status==="retired"||r.status==="draft")return;const b=r.live;if(b.type==="choice")return;const k=b.entity+"|"+b.trigger;(IDX[k]=IDX[k]||[]).push(r)});
 Object.keys(IDX).forEach(k=>IDX[k].sort((a,b)=>(a.live.order||100)-(b.live.order||100)));IDX._n=D.rules.length;resub()}
R.reindex=reindex;
const hasRulesFor=(entity,trigs)=>trigs.some(t=>(IDX[entity+"|"+t]||[]).length||(IDX["*|"+t]||[]).length);
function scopeOk(b){const s=b.scope||{kind:"all"};if(!s.kind||s.kind==="all")return true;const v=R.viewer();
 if(s.kind==="roles")return arr(s.roles).some(r=>v.roles.indexOf(r)>=0);
 if(s.kind==="groups")return arr(s.groups).some(g=>v.groups.indexOf(g)>=0||G(()=>APG.isMember(g,v.user),false));return true}
function windowOk(b){const w=b.window||{};const t=isoDay();if(w.from&&t<w.from)return false;if(w.to&&t>w.to)return false;return true}
R.scopeOk=scopeOk;R.windowOk=windowOk;
function logFire(r,b,o,info){const e=Object.assign({id:"FR-"+(D.lseq++),ts:Date.now(),rule:r.id,name:b.name,type:b.type,entity:b.entity,trigger:b.trigger,rec:o.id||(o.rec&&o.rec.id)||"",src:o.source||"",dry:!!o.dry,outcome:"fired",detail:"",changes:[],ver:r.liveVer||r.ver},info);
 D.log.unshift(e);if(D.log.length>400)D.log.length=400;
 if(!o.dry){G(()=>{if(e.outcome==="error"||e.outcome==="blocked"||e.outcome==="loop"){STORE.put("rule_firing",{id:e.id,rule:r.id,outcome:e.outcome,entity:b.entity,record:e.rec,detail:String(e.detail).slice(0,200),at:e.ts})}})}
 return e}
function logErr(r,b,o,msg,kind){const e=logFire(r||{id:"-",ver:0,rt:{}},b||{name:"(engine)",type:"",entity:"",trigger:""},o||{},{outcome:kind||"error",detail:msg});D.errors.unshift({ts:Date.now(),rule:r&&r.id,msg,kind:kind||"error"});if(D.errors.length>100)D.errors.length=100;
 if(r&&r.rt){r.rt.failed++;r.rt.lastErr=msg}G(()=>EVENTS.emit(kind==="loop"?"rule.loop_stopped":"rule.failed",{rule:r&&r.id,message:msg},{source:"r17s_rules",actor:ME()}));return e}
const newRes=()=>({fired:[],checked:0,blocked:null,confirm:null,msgs:[],notifs:[],changes:[],effects:[],errors:[],trace:[],stopped:null,killed:false});
const newFx=()=>({show:{},hide:{},req:{},opt:{},ro:{},choices:{},notes:[],banners:[],errors:{},set:{}});
R.newFx=newFx;
/* run(o): o={entity,trigger,types[],rec,old,id,isNew,source,dry,form,confirmed,rules[](explicit bodies for tests),only(ruleId),fx,field} */
function run(o){const res=newRes();o.rec=o.rec||{};o.old=o.old||{};res.fx=o.fx||newFx();
 const types=o.types||["client","business","notify","uiaction"];
 let list=[];
 if(o.rules){list=o.rules.map(x=>x.body&&x.id?{r:x,b:x.body}:{r:{id:x.id||"TEST",ver:0,rt:{},body:x},b:x}).sort((a,b)=>(a.b.order||100)-(b.b.order||100))}
 else{(IDX[o.entity+"|"+o.trigger]||[]).concat(IDX["*|"+o.trigger]||[]).forEach(r=>list.push({r,b:r.live}));if(o.only)list=list.filter(x=>x.r.id===o.only)}
 if(o.rules)list=list.filter(x=>x.b.trigger===o.trigger);
 list=list.filter(x=>types.indexOf(x.b.type)>=0);
 if(!o.dry&&(D.kill.all)){res.killed=true;return res}
 for(const it of list){const r=it.r,b=it.b;
  if(!o.dry&&D.kill.types[b.type]){res.killed=true;continue}
  if(!o.dry&&r.rt&&r.rt.tripped){continue}
  if(!o.noscope&&!scopeOk(b)){if(o.dry)res.trace.push({rule:r.id,name:b.name,matched:false,why:"Outside the rule's scope for the current viewer"});continue}
  if(!o.noscope&&!windowOk(b)){if(o.dry)res.trace.push({rule:r.id,name:b.name,matched:false,why:"Outside the activation window"});continue}
  if(b.trigger==="change"&&o.field&&arr(b.watch).length&&b.watch.indexOf(o.field)<0)continue;
  if(b.form&&o.form&&arr(b.form.split(/[\s,]+/)).filter(Boolean).length&&b.form.split(/[\s,]+/).indexOf(o.form)<0)continue;
  const key=r.id+"|"+o.entity+":"+(o.id||o.rec.id||"new");
  if(RT.stack.indexOf(key)>=0){res.errors.push("Cycle: "+r.id+" runs again on the same record");logErr(r,b,o,"Cycle detected: rule "+r.id+" ("+b.name+") was about to run again on "+(o.id||"the same record")+" while already running. Path: "+RT.stack.concat(key).join(" > "),"loop");continue}
  if(RT.depth>=MAXD){res.errors.push("Depth");logErr(r,b,o,"Loop guard: maximum depth "+MAXD+" reached at rule "+r.id+". Path: "+RT.stack.join(" > "),"loop");continue}
  if(!o.dry&&r.rt&&o.source!=="schedule"){const t=Date.now();r.rt.stamps=(r.rt.stamps||[]).filter(x=>t-x<RATE_MS);r.rt.stamps.push(t);if(r.rt.stamps.length>RATE_N){r.rt.tripped=true;logErr(r,b,o,"Loop guard suspended rule "+r.id+": it fired more than "+RATE_N+" times in "+RATE_MS/1000+" seconds. An owner must reset it on the Governance tab.","loop");G(()=>R17N.notify({kind:"warn",title:"Rule suspended by the loop guard",body:b.name+". Owner "+b.owner+" has been told.",key:"r17s|trip|"+r.id}));continue}}
  RT.depth++;RT.stack.push(key);let fired=false;
  try{
   res.checked++;if(!o.dry&&r.rt)r.rt.evaluated++;
   const ctx={rec:o.rec,old:o.old,user:ME(),isNew:!!o.isNew,trigger:o.trigger,role:G(()=>R.viewer().roles[0],""),fn:viewerFns()};
   const w=evalWhen(b,ctx,o.dry||o.explain);
   if(w.err){res.errors.push(r.id+": "+w.err);logErr(r,b,o,"Condition failed: "+w.err);continue}
   if(o.dry||o.explain)res.trace.push({rule:r.id,name:b.name,type:b.type,matched:w.ok,expr:w.expr,script:w.script,leaves:w.leaves,trigger:o.trigger});
   /* once per record for scheduled rules */
   const onceKey=b.trigger==="schedule"&&b.once!==false?r.id+"|"+(o.rec.id||""):null;
   if(w.ok&&onceKey&&!o.dry&&D.seen[onceKey]&&Date.now()-D.seen[onceKey]<864e5){if(o.dry)res.trace[res.trace.length-1].why="Already handled in the last 24 hours";continue}
   const acts=w.ok?b.then:b.else;if(!arr(acts).length&&b.type!=="notify")continue;
   const before=res.changes.length,nmsg=res.msgs.length,nn=res.notifs.length,ne=res.effects.length;
   const c={rec:o.rec,old:o.old,entity:o.entity,rule:{id:r.id,name:b.name},dry:!!o.dry,res,fx:res.fx,isNew:!!o.isNew,trigger:o.trigger,confirmed:o.confirmed,form:o.form};
   if(b.type==="notify"){if(w.ok){const nr=deliver(Object.assign({},b.deliver,{quiet:b.deliver.quiet?true:false}),o.rec,{id:r.id},!!o.dry);res.notifs.push(Object.assign({rule:r.id},nr))}else continue}
   else for(const a of acts){const d=ACT[a.t];if(!d){res.errors.push("Unknown action "+a.t);continue}
    try{d.run(c,a)}catch(x){const m=(x&&x.msg)||String(x&&x.message||x);res.errors.push(r.id+": "+m);logErr(r,b,o,"Action '"+d.label+"' failed: "+m);}
    if(res.blocked&&res.blocked.rule===r.id)break}
   fired=true;
   if(onceKey&&!o.dry)D.seen[onceKey]=Date.now();
   const info={detail:(w.ok?"Condition met":"Condition not met, else actions ran")+(res.blocked&&res.blocked.rule===r.id?". Save blocked: "+res.blocked.text:""),changes:res.changes.slice(before).map(x=>({f:x.f,label:x.label,from:x.from,to:x.to})),
    outcome:res.blocked&&res.blocked.rule===r.id?"blocked":res.confirm&&res.confirm.rule===r.id?"asked":"fired",msgs:res.msgs.slice(nmsg).length,notifs:res.notifs.slice(nn).length,effects:res.effects.slice(ne).map(x=>x.text)};
   if(!o.dry&&r.rt){r.rt.fired++;r.rt.last=Date.now()}
   res.fired.push({rule:r.id,name:b.name,type:b.type,matched:w.ok,outcome:info.outcome});
   if(!(o.silentLog)&&!(o.trigger==="load"&&o.source==="form"&&!info.changes.length&&info.outcome==="fired"&&b.type==="client"&&!o.dry&&false))logFire(r,b,o,info);
   if(!o.dry&&info.outcome==="blocked")G(()=>EVENTS.emit("rule.blocked",{rule:r.id,record:o.rec.id||"",message:res.blocked.text},{source:"r17s_rules",actor:ME()}));
   if(b.stop&&w.ok){res.stopped=r.id;break}
   if(res.blocked&&b.type!=="client")break;
  }catch(x){const m=(x&&x.msg)||String(x&&x.message||x);res.errors.push(r.id+": "+m);logErr(r,b,o,m)}
  finally{RT.depth--;RT.stack.pop()}}
 return res}
R.run=run;R.evaluate=run;
/* ---- scheduled and event rules ---- */
R.runSchedule=function(opts){opts=opts||{};const out={checked:0,fired:0,records:0,notified:0};
 D.rules.forEach(r=>{if(!r.live||r.status!=="active")return;const b=r.live;if(b.trigger!=="schedule"||(b.type!=="business"&&b.type!=="notify"))return;if(D.kill.all||D.kill.types[b.type])return;
  const e=R.entity(b.entity);if(!e)return;arr(G(()=>e.list(),[])).slice(0,600).forEach(id=>{const raw=G(()=>e.get(id),null);if(!raw)return;out.records++;
   const rec=e.flat(raw);const res=run({entity:b.entity,trigger:"schedule",rec,old:rec,id,isNew:false,source:"schedule",only:r.id,types:[b.type],noscope:true});out.checked+=res.checked;out.fired+=res.fired.length;out.notified+=res.notifs.filter(n=>n.state==="sent").length;
   if(res.changes.length&&!opts.dry)res.changes.forEach(ch=>setRaw(b.entity,id,ch.f,ch.to))})});
 G(()=>audit("Rules: scheduled run",out.records+" records checked, "+out.fired+" rules fired"));return out};
function resub(){RT.subs.forEach(f=>{try{f()}catch(e){}});RT.subs=[];
 D.rules.forEach(r=>{if(!r.live||r.status!=="active")return;const b=r.live;if(b.trigger!=="event"||!b.event)return;
  const un=G(()=>EVENTS.on(b.event,(ev,payload)=>{if(RT.depth>=MAXD)return;payload=payload||{};const e=R.entity(b.entity);let rec=Object.assign({},payload);
   const id=payload.record||payload.id||"";if(e&&id){const f=R.flatOf(b.entity,id);if(f)rec=Object.assign({},f,payload,{id})}
   const res=run({entity:b.entity,trigger:"event",rec,old:rec,id,isNew:false,source:"event "+b.event,only:r.id,types:[b.type],noscope:true});
   if(res.changes.length&&id)res.changes.forEach(ch=>setRaw(b.entity,id,ch.f,ch.to))}),null);if(un)RT.subs.push(un)})}
/* ---- the store wrapper: business rules run on any STORE write for entities that have rules ---- */
function wrapStore(){const S_=W.STORE;if(!S_||S_.__r17s||!S_.put)return;S_.__r17s=1;const put=S_.put.bind(S_);
 S_.put=function(en,rec,opt){if(RT.hold&&RT.hold===en+":"+(rec&&rec.id))return put(en,rec,opt);
  if(!rec||typeof rec!=="object"||en==="rule"||en==="rule_firing"||!hasRulesFor(en,["before_save","after_save","status_change"]))return put(en,rec,opt);
  const prev=G(()=>S_.get(en,rec.id),null);const isNew=!prev;const flat=Object.assign({},prev||{},rec);const old=Object.assign({},prev||{});
  const b=run({entity:en,trigger:"before_save",rec:flat,old,id:rec.id,isNew,source:"store",types:["business"]});
  if(b.blocked){G(()=>toast(b.blocked.text,"warn"));return null}
  b.changes.forEach(ch=>{rec[ch.f]=ch.to});
  if(prev&&prev.status!==undefined&&rec.status!==undefined&&String(prev.status)!==String(rec.status))run({entity:en,trigger:"status_change",rec:flat,old,id:rec.id,isNew,source:"store",types:["business","notify"]}).changes.forEach(ch=>{rec[ch.f]=ch.to});
  const out=put(en,rec,opt);
  if(out!=null)run({entity:en,trigger:"after_save",rec:Object.assign({},flat),old,id:rec.id,isNew,source:"store",types:["business","notify"]});
  return out}}
R.wrapStore=wrapStore;
/* ---- test: a dry-run on a real record without committing ----
   spec: {entity, trigger | "__save", ruleId (one rule) | omitted (every active rule on the table), recId | rec, overrides{}, useDraft, isNew, newState} */
function mergeInto(out,r,t){out.checked+=r.checked;out.fired=out.fired.concat(r.fired);out.msgs=out.msgs.concat(r.msgs);out.notifs=out.notifs.concat(r.notifs);out.effects=out.effects.concat(r.effects);out.errors=out.errors.concat(r.errors);out.changes=out.changes.concat(r.changes);
 r.trace.forEach(x=>out.trace.push(Object.assign({},x,{trigger:x.trigger||t})));if(r.blocked&&!out.blocked)out.blocked=Object.assign({at:t},r.blocked);if(r.confirm&&!out.confirm)out.confirm=r.confirm;if(r.stopped&&!out.stopped)out.stopped=r.stopped}
R.test=function(spec){spec=spec||{};const e=R.entity(spec.entity);let rec=spec.rec,old=spec.old;
 if(!rec&&spec.recId&&e){const raw=G(()=>e.get(spec.recId),null);if(raw){rec=e.flat(raw);old=clone(rec)}}
 rec=clone(rec||{});old=clone(old||rec);Object.keys(spec.overrides||{}).forEach(k=>{rec[k]=spec.overrides[k]});const before=clone(rec);
 let pool;if(spec.ruleId){const r=byId(spec.ruleId);pool=r?[{id:r.id,ver:r.ver,rt:r.rt,body:(spec.useDraft||!r.live)?r.body:r.live}]:[]}
 else pool=D.rules.filter(r=>r.live&&r.status==="active"&&r.live.entity===spec.entity&&r.live.type!=="choice").map(r=>({id:r.id,ver:r.liveVer,rt:r.rt,body:r.live}));
 const trigs=spec.trigger==="__save"?["load","submit","before_save","after_save"].concat(spec.newState?["status_change"]:[]):[spec.trigger||(pool[0]&&pool[0].body.trigger)||"after_save"];
 const out=newRes();out.fx=newFx();
 trigs.forEach(t=>{const r1=run({entity:spec.entity,trigger:t,rec,old,id:rec.id||spec.recId||"",isNew:!!spec.isNew,source:"test",dry:true,rules:pool,noscope:true,explain:true,fx:out.fx,types:spec.types});mergeInto(out,r1,t)});
 out.before=before;out.after=rec;out.trigs=trigs;out.diff=[];Object.keys(Object.assign({},before,rec)).forEach(k=>{if(JSON.stringify(before[k])!==JSON.stringify(rec[k]))out.diff.push({f:k,label:fieldLabel(spec.entity,k),from:before[k],to:rec[k]})});
 out.pool=pool.map(x=>x.id);
 if(spec.ruleId&&spec.mark!==false){const r=byId(spec.ruleId);if(r&&out.checked>0){r.rt.tested=Date.now();r.rt.testOk=!out.errors.length;persist()}}
 return out};

/* ======================================================================
   7. CHOICE LISTS (backed by LISTS and PICKER) and cycle detection
   ====================================================================== */
R.choices=function(listId,parentValue){const r=byId(listId);if(!r)return[];const b=r.live||r.body;if(!b||b.type!=="choice")return[];const c=b.choice;
 if(c.kind==="dependent"){const m=c.map||{};const k=Object.keys(m).find(x=>String(x).toLowerCase()===String(parentValue==null?"":parentValue).toLowerCase());return k?arr(m[k]).slice():(parentValue==null||parentValue===""?[]:arr(m["*"]))}
 return arr(c.values).slice()};
R.choiceAll=listId=>{const r=byId(listId);if(!r)return[];const b=r.live||r.body;const c=b.choice;if(c.kind==="dependent"){const s=new Set();Object.keys(c.map||{}).forEach(k=>arr(c.map[k]).forEach(v=>s.add(v)));return [...s]}return arr(c.values)};
function regLists(){if(!W.LISTS||!LISTS.register)return;D.rules.forEach(r=>{if(r.body.type!=="choice")return;const id="r17s_"+r.id;if(LISTS.meta(id))return;
 LISTS.register(id,{label:r.body.name,source:"Choice list "+r.id+" (Rules and scripts)",screen:"r17s_rules",raw:()=>R.choiceAll(r.id).map(v=>({v})),version:()=>String(r.ver)+"|"+r.liveVer,id:x=>x.v,label:x=>x.v,sub:()=>"",grp:()=>"",owner:r.body.owner||"",backup:r.body.backup||""})})}
R.regLists=regLists;
/* static cycle check: a rule that raises an event or writes a field another active rule listens to, in a ring */
R.cycles=function(){const nodes=D.rules.filter(r=>(r.live||r.status!=="retired")&&r.body.type==="business"||r.body.type==="notify");const edges={};
 const prod=r=>{const b=r.live||r.body,ev=[],fl=[];arr(b.then).concat(arr(b.else)).forEach(a=>{if(a.t==="raise_event"&&a.event)ev.push("event:"+a.event);if(a.t==="set_field"&&a.field)fl.push("field:"+b.entity+"."+a.field);if(a.t==="create_record"&&a.entity)fl.push("table:"+a.entity)});return ev.concat(fl)};
 const cons=r=>{const b=r.live||r.body,o=[];if(b.trigger==="event"&&b.event)o.push("event:"+b.event);if(b.trigger==="before_save"||b.trigger==="after_save"||b.trigger==="status_change"){R.leafList(b.when).forEach(l=>{if(l.f)o.push("field:"+b.entity+"."+l.f)});o.push("table:"+b.entity)}return o};
 nodes.forEach(r=>{edges[r.id]=[];const p=prod(r);nodes.forEach(q=>{if(q.id===r.id){const b=r.live||r.body;const guarded=R.leafList(b.when).some(l=>l.op==='empty'||l.op==='changed');if(guarded||!prod(r).some(x=>cons(r).indexOf(x)>=0))return}if(cons(q).some(c=>p.indexOf(c)>=0))edges[r.id].push(q.id)})});
 const out=[],seen=new Set();
 const dfs=(start,cur,path)=>{(edges[cur]||[]).forEach(n=>{if(n===start){const key=path.slice().sort().join(",");if(!seen.has(key)){seen.add(key);out.push({rules:path.slice(),text:path.concat(start).join(" to ")+" can trigger each other"})}}else if(path.indexOf(n)<0&&path.length<6)dfs(start,n,path.concat(n))})};
 nodes.forEach(r=>dfs(r.id,r.id,[r.id]));return out};

/* ---------- metrics numbers (computed live) ---------- */
R.stats=function(){const act=D.rules.filter(r=>r.status==="active"),all=D.rules.filter(r=>r.status!=="retired");
 const hum=new Set(G(()=>DIR.filter(d=>d.kind==="human").map(d=>d.name),[]));const okOwn=r=>r.body.owner&&r.body.backup&&r.body.owner!==r.body.backup&&(!hum.size||(hum.has(r.body.owner)&&hum.has(r.body.backup)));
 const wk=Date.now()-7*864e5;const dayAgo=Date.now()-864e5;const real=D.log.filter(l=>!l.dry);
 const by={},byT={};all.forEach(r=>{by[r.body.type]=(by[r.body.type]||0)+1;byT[r.body.trigger]=(byT[r.body.trigger]||0)+1});
 return{total:all.length,active:act.length,pending:all.filter(r=>r.status==="pending").length,draft:all.filter(r=>r.status==="draft").length,retired:D.rules.length-all.length,
  withOwner:all.filter(okOwn).length,noOwner:all.filter(r=>!okOwn(r)),untested:act.filter(r=>!r.rt.tested).length,untestedList:act.filter(r=>!r.rt.tested),
  failWeek:real.filter(l=>(l.outcome==="error"||l.outcome==="loop")&&l.ts>wk).length,firedDay:real.filter(l=>(l.outcome==="fired"||l.outcome==="blocked"||l.outcome==="asked")&&l.ts>dayAgo).length,firedAll:real.filter(l=>l.outcome==="fired"||l.outcome==="blocked"||l.outcome==="asked").length,
  byType:by,byTrigger:byT,tripped:D.rules.filter(r=>r.rt.tripped).length,cycles:R.cycles().length,digest:D.digest.length}};

/* ======================================================================
   8. HOOK: forms (kit.js submitForm), field changes, record shell edits
   ====================================================================== */
const FX={};R.fx=FX;/* per open form: current effects */
function openFid(){const f=DOC.querySelector("[data-form]");return f?f.getAttribute("data-form"):null}
function applyFx(fid,fx,spec,st){if(!spec||!fx)return false;let changed=false;const b=FORMS[fid];if(!b)return false;const inv={};Object.keys(b.map).forEach(fk=>inv[b.map[fk]]=fk);
 /* set values */
 Object.keys(fx.set||{}).forEach(ek=>{const fk=inv[ek];if(fk!=null&&String(st.vals[fk])!==String(fx.set[ek])){st.vals[fk]=fx.set[ek];changed=true}});
 const prev=spec.__r17s||(spec.__r17s={orig:{},sig:""});
 spec.fields.forEach(f=>{if(f.section||!f.k)return;const ek=b.map[f.k];if(!ek)return;
  if(!(f.k in prev.orig))prev.orig[f.k]={show:f.show,req:f.req,opts:Object.getOwnPropertyDescriptor(f,"opts")};
  const o=prev.orig[f.k];
  /* hidden / shown */
  const hid=!!fx.hide[ek]&&!fx.show[ek];f.show=hid?(()=>false):o.show;
  /* required */
  if(fx.req[ek]&&!fx.opt[ek])f.req=true;else if(fx.opt[ek])f.req=false;else f.req=o.req;
  /* choices */
  const ch=fx.choices[ek];if(ch){const cur=st.vals[f.k];let vals=ch.values.slice();Object.defineProperty(f,"opts",{configurable:true,enumerable:true,value:vals.map(v=>[v,v])});if(cur&&vals.indexOf(cur)<0){st.vals[f.k]="";changed=true}}
  else if(o.opts){try{Object.defineProperty(f,"opts",o.opts)}catch(e){}}});
 const sig=JSON.stringify([fx.hide,fx.show,fx.req,fx.opt,fx.ro,Object.keys(fx.choices).map(k=>[k,fx.choices[k].values]),fx.notes.map(n=>n.text),fx.banners.map(n=>n.text),fx.errors]);
 const sigChanged=sig!==prev.sig;prev.sig=sig;return changed||sigChanged}
function paintFx(fid){const fx=FX[fid];const root=DOC.querySelector('[data-form="'+fid+'"]');if(!root)return;
 const spec=G(()=>FORMSPEC[fid],null);const b=FORMS[fid];if(!b||!fx)return;
 root.querySelectorAll(".r17s-note,.r17s-banners,.r17s-uiact,.r17s-badge").forEach(n=>n.remove());
 /* read-only */
 spec.fields.forEach(f=>{const ek=b.map[f.k];if(!ek)return;root.querySelectorAll('[data-fk="'+fid+':'+f.k+'"]').forEach(el=>{if(fx.ro[ek]){el.setAttribute("disabled","");el.setAttribute("aria-readonly","true");el.closest(".fld")&&el.closest(".fld").classList.add("r17s-ro")}else{el.removeAttribute("disabled");el.removeAttribute("aria-readonly")}});
  const fld=root.querySelector('[data-fk="'+fid+':'+f.k+'"]');const box=fld&&fld.closest(".fld");if(box){
   if(!fx.ro[ek])box.classList.remove("r17s-ro");
   fx.notes.filter(n=>n.field===ek).forEach(n=>{const d=DOC.createElement("small");d.className="r17s-note r17s-"+n.kind;d.textContent=n.text;box.appendChild(d)});
   if(fx.errors[ek]){const d=DOC.createElement("small");d.className="r17s-note r17s-bad";d.textContent=fx.errors[ek];box.appendChild(d);box.classList.add("bad")}
   if(fx.req[ek]&&!fx.opt[ek]&&!box.querySelector(".r17s-badge")&&!(f.req)){}
  }});
 if(fx.banners.length){const d=DOC.createElement("div");d.className="r17s-banners";d.setAttribute("role","status");d.innerHTML=fx.banners.map(m=>`<div class="r17s-banner r17s-${m.kind}"><b>${m.kind==="bad"?"Fix before saving":m.kind==="warn"?"Check":m.kind==="good"?"Done":"Note"}</b> ${H(m.text)}${m.rule?` <span class="r17s-rid">${H(m.rule)}</span>`:""}</div>`).join("");const body=root.querySelector(".fbody");if(body)body.insertBefore(d,body.firstChild)}
 uiButtons(fid,root)}
/* run client rules for the open form and repaint only when something changed */
function clientPass(fid,trigger,field){const b=FORMS[fid];if(!b)return null;const st=G(()=>FORMST[fid],null),spec=G(()=>FORMSPEC[fid],null);if(!st||!spec)return null;
 if(!hasRulesFor(b.entity,["load","change","submit"])&&!FX[fid])return null;
 const ff=formFlat(fid,st.vals,spec);if(!ff)return null;
 const fx=newFx();const res=run({entity:b.entity,trigger,types:["client"],rec:ff.rec,old:ff.old,id:ff.id||"",isNew:ff.isNew,source:"form",form:fid,field,fx});
 /* a set_value leaves its change in rec; copy to fx.set so applyFx writes it into the form */
 res.changes.forEach(ch=>{fx.set[ch.f]=ch.to});
 return{res,fx,spec,st}}
let busy=false;
function formChanged(fid,trigger,field,keepRefresh){if(busy)return;busy=true;try{const cp=clientPass(fid,trigger,field);if(!cp){return}
  /* persistent effects: keep the union of rules evaluated on load and on change; recompute from scratch, a "load" pass first then the change pass */
  let fx=cp.fx;if(trigger!=="load"){const lp=clientPass(fid,"load");if(lp){const m=lp.fx;["show","hide","req","opt","ro"].forEach(k=>Object.keys(m[k]).forEach(x=>{if(!(x in fx[k]))fx[k][x]=m[k][x]}));Object.keys(m.choices).forEach(k=>{if(!fx.choices[k])fx.choices[k]=m.choices[k]});m.notes.forEach(n=>fx.notes.push(n));m.banners.forEach(n=>fx.banners.push(n));Object.keys(m.errors).forEach(k=>fx.errors[k]=m.errors[k])}}
  /* a field changed on the form means "change" rules also evaluate on top of load state */
  FX[fid]=fx;const ch=applyFx(fid,fx,cp.spec,cp.st);
  if(ch&&!keepRefresh){G(()=>refreshForm(fid))}
  paintFx(fid)}finally{busy=false}}
let tm=0,lastSnap={};
function snap(fid){const st=G(()=>FORMST[fid],null);return st?JSON.stringify(st.vals):""}
function afterUser(){clearTimeout(tm);tm=setTimeout(()=>{const fid=openFid();if(!fid||!FORMS[fid])return;const s=snap(fid);if(lastSnap[fid]===s)return;
  const prev=lastSnap[fid]?JSON.parse(lastSnap[fid]):{};const cur=JSON.parse(s);const keys=Object.keys(cur).filter(k=>JSON.stringify(cur[k])!==JSON.stringify(prev[k]));lastSnap[fid]=s;
  const b=FORMS[fid];const ek=keys.map(k=>b.map[k]).filter(Boolean);formChanged(fid,"change",ek[0]||"");lastSnap[fid]=snap(fid)},40)}
["input","change","click"].forEach(t=>DOC.addEventListener(t,e=>{if(e.target.closest&&(e.target.closest("[data-form]")||e.target.closest(".pk2-pop")||e.target.closest("[data-pk2]")))afterUser()},true));
/* openForm: on-load rules */
(function(){const orig=W.openForm||(typeof openForm==="function"?openForm:null);if(!orig||orig.__r17s)return;
 const wrapped=function(spec,init){const r=orig.apply(this,arguments);try{const fid=spec&&spec.id;if(fid&&FORMS[fid]){delete FX[fid];if(spec.__r17s)delete spec.__r17s;lastSnap[fid]="";setTimeout(()=>{formChanged(fid,"load","");lastSnap[fid]=snap(fid)},0)}}catch(e){console.error("rules onload",e)}return r};
 wrapped.__r17s=1;try{openForm=wrapped}catch(e){W.openForm=wrapped}})();
(function(){const orig=typeof refreshForm==="function"?refreshForm:null;if(!orig||orig.__r17s)return;
 const w=function(fid){const r=orig.apply(this,arguments);try{if(FORMS[fid]&&FX[fid]){const spec=FORMSPEC[fid];paintFx(fid)}}catch(e){}return r};w.__r17s=1;try{refreshForm=w}catch(e){}})();
/* UI actions injected into the open form */
function uiButtons(fid,root){const b=FORMS[fid];if(!b)return;const list=[];D.rules.forEach(r=>{if(!r.live||r.status!=="active"||r.live.type!=="uiaction"||r.live.entity!==b.entity)return;if(D.kill.all||D.kill.types.uiaction)return;if(!scopeOk(r.live))return;
  const ui=r.live.ui||{};if(ui.place&&ui.place!=="form")return;if(arr(ui.roles).length&&!arr(ui.roles).some(x=>R.viewer().roles.indexOf(x)>=0))return;
  const st=FORMST[fid],ff=formFlat(fid,st.vals,FORMSPEC[fid]);const w=evalWhen(r.live,{rec:ff.rec,old:ff.old,user:ME(),isNew:ff.isNew,trigger:"click",role:"",fn:viewerFns()});if(w.ok)list.push(r)});
 if(!list.length)return;const act=root.querySelector(".fact");if(!act)return;const d=DOC.createElement("div");d.className="r17s-uiact";d.innerHTML=`<span class="small muted">Actions from rules</span>`+list.map(r=>`<button type="button" class="btn" data-r17s-ui="${H(r.id)}" data-r17s-fid="${H(fid)}" title="${H(r.live.desc||r.live.name)}">${H(r.live.ui.label||r.live.name)}</button>`).join("");act.parentNode.insertBefore(d,act)}
DOC.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r17s-ui]");if(!t)return;e.preventDefault();const r=byId(t.dataset.r17sUi),fid=t.dataset.r17sFid;if(!r||!r.live)return;
 const st=FORMST[fid],spec=FORMSPEC[fid],ff=formFlat(fid,st.vals,spec);
 const go_=(confirmed)=>{const res=run({entity:ff.entity,trigger:"click",types:["uiaction"],rec:ff.rec,old:ff.old,id:ff.id||"",isNew:ff.isNew,source:"button",only:r.id,form:fid,confirmed:confirmed?{[r.id]:1}:null});
  if(res.confirm&&!confirmed){askConfirm(res.confirm,()=>go_(true));return}
  if(res.blocked){toast(res.blocked.text,"warn");return}
  if(res.changes.length&&backToForm(fid,st,res.changes))G(()=>refreshForm(fid));res.msgs.forEach(m=>G(()=>R17N.notify({kind:m.kind==="bad"?"bad":m.kind==="warn"?"warn":"info",title:m.text,key:"r17s|ui|"+r.id+m.text})));appliedNote(res)};
 go_(false)});
/* confirm dialog: our own small modal (accessible, keyboard) */
function askConfirm(c,yes,no){const old=DOC.getElementById("r17s-confirm");if(old)old.remove();const d=DOC.createElement("div");d.id="r17s-confirm";d.className="r17s-confirm";d.setAttribute("role","alertdialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-labelledby","r17s-ct");
 d.innerHTML=`<div class="r17s-cbox glass"><div class="eyebrow">Rule asks first</div><h3 id="r17s-ct">${H(c.text)}</h3><p class="small muted">From the rule ${H(c.name||c.rule)}. Nothing has been saved yet.</p><div class="row" style="gap:8px;justify-content:flex-end"><button type="button" class="btn quiet" data-r17s-no>Go back</button><button type="button" class="btn primary" data-r17s-yes>${H(c.label||"Yes, continue")}</button></div></div>`;
 DOC.body.appendChild(d);const close=()=>{d.remove()};
 d.querySelector("[data-r17s-yes]").addEventListener("click",()=>{close();yes&&yes()});d.querySelector("[data-r17s-no]").addEventListener("click",()=>{close();no&&no()});
 d.addEventListener("keydown",e=>{if(e.key==="Escape"){close();no&&no()}});setTimeout(()=>{const y=d.querySelector("[data-r17s-no]");y&&y.focus()},30)}
R.askConfirm=askConfirm;
function appliedNote(res){if(!D.cfg.showApplied)return;const n=res.fired.filter(f=>f.matched);if(!n.length)return;
 const ch=res.changes.length,ms=res.notifs.length;
 G(()=>R17N.notify({kind:"info",title:"Rule applied: "+n.map(f=>f.name).slice(0,2).join("; ")+(n.length>2?" +"+(n.length-2):""),body:(ch?ch+" field"+(ch===1?"":"s")+" set. ":"")+(ms?ms+" notification"+(ms===1?"":"s")+". ":"")+"Details in the firing log.",compact:false,key:"r17s|applied|"+n.map(f=>f.rule).join(),life:4500,actions:[{label:"Firing log",fn:()=>{S.v.r17sv=4;go("r17s_rules")}}]}))}
/* ---- kit.js submitForm hooks ---- */
R.beforeForm=function(fid,spec,st){const b=FORMS[fid];if(!b||D.kill.all&&false)return true;
 try{if(!hasRulesFor(b.entity,["submit","before_save","status_change","load","change"])&&!FX[fid])return true;
  const ff=formFlat(fid,st.vals,spec);if(!ff)return true;st._r17ids=new Set(G(()=>R.entity(b.entity).list(),[]));st._r17pre=ff;
  const conf=st._r17conf||(st._r17conf={});
  /* 1. client rules on submit (validate, confirm, required) */
  const cr=run({entity:b.entity,trigger:"submit",types:["client"],rec:ff.rec,old:ff.old,id:ff.id||"",isNew:ff.isNew,source:"form",form:fid,confirmed:conf});
  /* required-by-rule fields */
  const fx0=FX[fid];if(fx0){const miss=[];spec.fields.forEach(f=>{const ek=b.map[f.k];if(!ek||f.section)return;if(fx0.req[ek]&&!fx0.opt[ek]){const v=st.vals[f.k];if(v==null||v===""||(Array.isArray(v)&&!v.length))miss.push(f)}});
   if(miss.length){miss.forEach(f=>{st.err[f.k]="Required by a rule: this field must be filled before saving"});G(()=>refreshForm(fid));const rr=cr.fired.length?cr.fired[0].name:"A rule";G(()=>R17N.notify({kind:"warn",title:"Cannot save yet",body:miss.map(f=>f.label).join(", ")+" must be filled in. Required by the rule \""+(ruleReq(fid)||rr)+"\".",key:"r17s|req|"+fid,life:6000}));
    logBlock(fid,b,ff,miss);return false}}
  if(cr.blocked){showBlock(fid,st,cr.blocked,cr);return false}
  if(cr.confirm){askConfirm(cr.confirm,()=>{conf[cr.confirm.rule]=1;submitForm(fid)});return false}
  /* 2. business rules before save (and status change when the form closes or retires the record) */
  const trig=["before_save"].concat(b.newState?["status_change"]:[]);let changed=[];
  for(const tr of trig){const br=run({entity:b.entity,trigger:tr,types:["business"],rec:ff.rec,old:ff.old,id:ff.id||"",isNew:ff.isNew,source:"form",form:fid,confirmed:conf});
   if(br.blocked){showBlock(fid,st,br.blocked,br);return false}
   if(br.confirm){askConfirm(br.confirm,()=>{conf[br.confirm.rule]=1;submitForm(fid)});return false}
   changed=changed.concat(br.changes)}
  if(changed.length&&backToForm(fid,st,changed))G(()=>refreshForm(fid));
  return true}catch(e){console.error("rules beforeForm",e);return true}};
function ruleReq(fid){const ids=Object.keys(D.log).length?null:null;const r=D.rules.find(x=>x.live&&x.status==="active"&&x.live.type==="client"&&x.live.entity===FORMS[fid].entity&&arr(x.live.then).some(a=>a.t==="mandatory"));return r?r.live.name:""}
function logBlock(fid,b,ff,miss){const r=D.rules.find(x=>x.live&&x.status==="active"&&x.live.type==="client"&&x.live.entity===b.entity&&arr(x.live.then).some(a=>a.t==="mandatory"));if(!r)return;
 logFire(r,r.live,{rec:ff.rec,id:ff.id,source:"form",dry:false},{outcome:"blocked",detail:"Save stopped: "+miss.map(f=>f.label).join(", ")+" required by this rule",changes:[]});r.rt.fired++;r.rt.last=Date.now()}
function showBlock(fid,st,bl,res){const b=FORMS[fid];if(bl.field){const inv={};Object.keys(b.map).forEach(fk=>inv[b.map[fk]]=fk);const fk=inv[bl.field];if(fk)st.err[fk]=bl.text}
 G(()=>refreshForm(fid));const root=DOC.querySelector('[data-form="'+fid+'"]');
 if(root){root.querySelectorAll(".r17s-banners-blk").forEach(n=>n.remove());const d=DOC.createElement("div");d.className="r17s-banners r17s-banners-blk";d.setAttribute("role","alert");d.innerHTML=`<div class="r17s-banner r17s-bad"><b>Not saved</b> ${H(bl.text)} <span class="r17s-rid">${H(bl.rule)}</span></div>`;const body=root.querySelector(".fbody");if(body)body.insertBefore(d,body.firstChild);d.scrollIntoView&&d.scrollIntoView({block:"nearest"})}
 G(()=>R17N.notify({kind:"bad",title:"Not saved",body:bl.text,key:"r17s|blk|"+bl.rule+bl.text,life:7000}))}
R.afterForm=function(fid,spec,st,res){const b=FORMS[fid];if(!b||!st._r17pre)return;
 try{const e=R.entity(b.entity);let id=st._r17pre.id;
  if(!id&&res&&res.audit&&/^[A-Z]{2,4}\d+$/.test(String(res.audit)))id=res.audit;
  if(!id&&st._r17ids){const nw=arr(G(()=>e.list(),[])).filter(x=>!st._r17ids.has(x));if(nw.length)id=nw[0]}
  let rec,old=st._r17pre.old;const raw=id?G(()=>e.get(id),null):null;
  if(raw){rec=e.flat(raw)}else{rec=clone(st._r17pre.rec)}
  if(b.newState&&!raw)rec[b.stateKey||"state"]=b.newState;
  const isNew=st._r17pre.isNew;
  const tr=["after_save"];if(b.newState){tr.push("status_change")}
  let all=null;
  tr.forEach(t=>{if(t==="status_change"&&b.newState&&String(rec[b.stateKey||"state"])!==String(b.newState)&&!(raw&&String(old[b.stateKey||"state"])!==String(rec[b.stateKey||"state"])))return;
   const rr=run({entity:b.entity,trigger:t,types:["business","notify"],rec,old,id,isNew,source:"form",form:fid});
   rr.changes.forEach(ch=>{if(id)setRaw(b.entity,id,ch.f,ch.to)});all=all?mergeRes(all,rr):rr});
  if(all)appliedNote(all);
  delete st._r17pre;delete st._r17ids;delete FX[fid]
 }catch(e){console.error("rules afterForm",e)}};
function mergeRes(a,b){a.fired=a.fired.concat(b.fired);a.changes=a.changes.concat(b.changes);a.notifs=a.notifs.concat(b.notifs);a.msgs=a.msgs.concat(b.msgs);a.effects=a.effects.concat(b.effects);return a}
/* ---- record shell (RECSHELL.applyEdit) hooks ---- */
const RSK={incident:{own:"owner",svc:"service",grp:"team",cat:"category",ua:"users_affected",maj:"major"},change:{own:"owner",cost:"cost",env:"environment",type:"type",svc:"service"},contract:{own:"owner",rn:"renewal"},vendor:{own:"owner"}};
function recKey(entity,k){const e=ENT[entity];return (RSK[entity]&&RSK[entity][k])||(e&&e.recKeys&&e.recKeys[k])||(k==="owner"?"owner":k)}
R.recEdit=function(entity,id,k,v,from){try{const e=R.entity(entity);if(!e)return null;if(!hasRulesFor(entity,["cell","before_save","status_change"])&&!hasRulesFor("*",["cell","before_save"]))return null;
  const ek=recKey(entity,k);const rec=R.flatOf(entity,id)||{id};const old=clone(rec);const num=e.byK[ek]&&e.byK[ek].type==="number";rec[ek]=num?toNum(v):v;
  const trg=["cell","before_save"].concat(k==="status"?["status_change"]:[]);let blocked=null,newV=v,confirm=null;
  for(const tr of trg){const res=run({entity,trigger:tr,types:tr==="cell"?["client"]:["business"],rec,old,id,isNew:false,source:"record page",field:ek});
   if(res.blocked){blocked=res.blocked;break}
   if(res.confirm&&!confirm)confirm=res.confirm;
   res.changes.forEach(ch=>{if(ch.f===ek)newV=ch.to})}
  if(blocked){G(()=>R17N.notify({kind:"bad",title:"Not saved",body:blocked.text,key:"r17s|blk|"+blocked.rule+blocked.text,life:7000}));return{block:blocked.text}}
  RT.hold=entity+":"+id;
  return{v:newV,rec,old,ek,confirm}}catch(x){console.error("rules recEdit",x);return null}};
R.recDone=function(entity,id,k,v,pre){try{if(!pre)return;RT.hold=null;const rec=R.flatOf(entity,id)||pre.rec;if(rec&&pre.ek&&rec[pre.ek]===undefined)rec[pre.ek]=v;
  const trg=["after_save"].concat(k==="status"?["status_change"]:[]);let all=null;
  trg.forEach(t=>{const rr=run({entity,trigger:t,types:["business","notify"],rec,old:pre.old,id,isNew:false,source:"record page",field:pre.ek});rr.changes.forEach(ch=>setRaw(entity,id,ch.f,ch.to));all=all?mergeRes(all,rr):rr});
  if(all)appliedNote(all)}catch(x){console.error("rules recDone",x)}};
/* ---- public helpers for other modules ---- */
R.firing=()=>D.log;R.errors=()=>D.errors;R.digest=()=>D.digest;R.clearLog=()=>{D.log.length=0;D.errors.length=0};
R.resetTrip=id=>{const r=byId(id);if(r){r.rt.tripped=false;r.rt.stamps=[];G(()=>audit("Rule loop guard reset",id))}};
R.tick=()=>{const t=Date.now();if(t-RT.lastTick<5000)return;RT.lastTick=t};
/* boot */
function boot(){if(D.booted)return;D.booted=true;wrapStore();genericEntities();hydrate();regLists();reindex()}
R.boot=boot;
if(W.STORE&&STORE.onHydrate)G(()=>STORE.onHydrate(()=>{hydrate();regLists()}));
})();

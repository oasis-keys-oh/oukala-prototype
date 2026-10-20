/* mod_r15e_roles.js (Round 15, Agent E). Role registry with holders, default backup owners, gate steps as real approval
   records in the inbox, and decision.* events from approve/reject/defer decisions. window.R15E; applied by mod_zlink boot (phaseA). */
(function(){
"use strict";
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const arr=x=>Array.isArray(x)?x:[];
const lc=s=>String(s==null?"":s).toLowerCase();
const norm=s=>lc(s).replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const toks=s=>norm(s).split(" ").filter(w=>w.length>2);
const uniq=a=>[...new Set(a)];
const TODAY=U.TODAY_ISO;
const addD=(d,n)=>{const t=new Date(d+"T00:00:00Z");t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
const R=S.r15e=S.r15e||{roles:[],bak:{},gate:[],ver:0,applied:{}};let R15E_ADPS={};
const ABBR={ceo:"chief executive",cio:"chief information",cfo:"chief financial",coo:"chief operating",cto:"chief technology",pmo:"portfolio project management",hr:"people",cmdb:"configuration",tbm:"technology business management",kcs:"knowledge"};
const expand=t=>norm(t).split(" ").map(w=>ABBR[w]||w).join(" ");
const RUNTIME=["automatic","robot","anyone","any user","any admin","workflow engine","inbox","claude","claude sonnet","requester","sponsor","implementer","approvers","approver","the executive","subject matter expert","drawing studio","process library","discovery sources","organizer","secretary","carrier","approver rule","policy"];
const isPerson=n=>!!n&&G(()=>DIR.some(d=>d.name===n&&d.kind!=="ai"),false);
const dirOf=n=>G(()=>DIR.find(d=>d.name===n),null);
/* ---------- role registry ---------- */
const idx=()=>{if(!R._m||R._mv!==R.ver){R._m=new Map();R.roles.forEach(r=>{R._m.set(norm(r.name),r);arr(r.aliases).forEach(a=>R._m.set(norm(a),r))});R._mv=R.ver}return R._m};
const ROLES={
 list:()=>R.roles,version:()=>R.ver,
 get:id=>R.roles.find(r=>r.id===id)||null,
 find(text){return idx().get(norm(String(text||"").replace(/^the\s+/i,"")))||null},
 /* holders effective on a date (default: today), primary first */
 holders(role,date){const r=typeof role==="string"?ROLES.find(role):role;if(!r)return[];date=date||TODAY;
  return r.holders.filter(h=>h.from<=date&&(!h.to||h.to>=date)).sort((a,b)=>({primary:0,delegate:1,backup:2,agent:3}[a.kind]-({primary:0,delegate:1,backup:2,agent:3}[b.kind])))},
 resolve(text,date){const r=ROLES.find(text);if(!r)return null;const h=ROLES.holders(r,date);return h.length?{role:r,holder:h[0].who,holders:h,runtime:!!r.runtime}:(r.runtime?{role:r,holder:"",holders:[],runtime:true}:null)},
 holderOf(text,date){const x=ROLES.resolve(text,date);return x?x.holder:""},
 add(o){const ex=ROLES.find(o.name);if(ex){o.holders&&o.holders.forEach(h=>{if(!ex.holders.some(x=>x.who===h.who&&x.kind===h.kind))ex.holders.push(h)});(o.aliases||[]).forEach(a=>{if(!ex.aliases.includes(a))ex.aliases.push(a)});R.ver++;return ex}
  const r=Object.assign({id:"role:"+norm(o.name).replace(/ /g,"-"),name:"",aliases:[],holders:[],tier:"",basis:"registered"},o);R.roles.push(r);R.ver++;return r},
 assign(roleId,who,opt){const r=ROLES.get(roleId);if(!r)return null;opt=opt||{};const from=opt.from||TODAY;
  r.holders.forEach(h=>{if(h.kind===(opt.kind||"primary")&&!h.to&&(opt.kind||"primary")==="primary")h.to=addD(from,-1)});
  r.holders.push({who,kind:opt.kind||"primary",from,to:opt.to||null,basis:opt.basis||"assigned",confirmed:true});R.ver++;
  G(()=>window.EVENTS&&window.EVENTS.emit("role.assigned",{role:r.name,holder:who,from:opt.prev||""},{source:"Role registry",actor:G(()=>S.persona&&PERSONAS[S.persona].name,"")}));return r},
 gaps:()=>R.roles.filter(r=>!r.runtime&&!ROLES.holders(r).length)
};
function seedRoles(){if(R.applied.roles)return;R.applied.roles=1;
 arr(G(()=>ORGX.domains,[])).forEach(d=>{const o=G(()=>ORGX.person(d.ownerId),null),b=G(()=>ORGX.person(d.backupId),null);if(!o)return;
  ROLES.add({name:d.label+" owner",aliases:arr(d.aliases).concat([d.label]),tier:"domain",basis:"ORGX accountability domain",holders:[{who:o.name,kind:"primary",from:"2026-01-01",to:null,basis:"ORGX",confirmed:true}].concat(b?[{who:b.name,kind:"backup",from:"2026-01-01",to:null,basis:"ORGX",confirmed:true}]:[])})});
 arr(G(()=>ORGX.people,[])).forEach(p=>{if(p.kind==="agent"||!p.title)return;ROLES.add({name:p.title,aliases:[expand(p.title)],tier:"title",basis:"Directory title",holders:[{who:p.name,kind:"primary",from:"2026-01-01",to:null,basis:"Directory",confirmed:true}]})});
 RUNTIME.forEach(t=>{const r=ROLES.add({name:t,tier:"runtime",basis:"Resolved at run time",holders:[]});r.runtime=true})}
const SYS_RX=/engine|index|orion|fabric|automation|owning module|history|openers|tracking|builder|graph|ingestion|oukala|navigation/i;
const AGENT_RX=/advisor|analyst|agent|assistant|curator|copilot/i;
function infer(text,ctx){const base=String(text).replace(/\b(office|team|teams|group|groups|lead)\s*$/i,"").trim();
 const tries=uniq([text,base]).filter(Boolean);let cand=[];
 const doms=arr(G(()=>ORGX.domains,[])),people=arr(G(()=>ORGX.people,[]));
 tries.forEach(tx=>{const w=toks(expand(tx));if(!w.length)return;
  doms.forEach(d=>{const hay=new Set(toks([d.label].concat(d.aliases||[]).join(" ")));let c=0;w.forEach(x=>{if(hay.has(x))c++});const s=c/w.length;const o=s>=.34?G(()=>ORGX.person(d.ownerId),null):null;if(o)cand.push({who:o.name,s:s*0.98,conf:Math.round(s*100),via:"domain "+d.label+(s<.5?" (partial match)":"")})});
  people.forEach(p=>{if(p.kind==="agent")return;const hay=new Set(toks(p.title));let c=0;w.forEach(x=>{if(hay.has(x))c++});const s=c/w.length;if(s>=.5)cand.push({who:p.name,s,conf:Math.round(s*100),via:"title "+p.title})})});
 cand.sort((a,b)=>b.s-a.s);if(cand.length&&cand[0].s>=.5)return cand[0];if(cand.length&&cand[0].s>=.34)return cand[0];
 if(SYS_RX.test(text))return{who:"",sys:true,conf:90,via:"system component"};
 if(AGENT_RX.test(text))return{who:"Kenji Watanabe",agent:true,conf:60,via:"AI agent, sponsor is the AI governance lead"};
 if(ctx&&ctx.fallback)return{who:ctx.fallback,conf:40,via:ctx.fvia||"owner of the workflow's service"};
 const pl=personOf("platform owner");return pl?{who:pl,conf:30,via:"defaulted to the platform owner, steward to confirm"}:null}
function roleFromContext(from){const fid=String(from).split("/")[0];const f=G(()=>FLOWX.flows().find(x=>x.id===fid),null);if(!f)return null;
 const own=G(()=>window.who&&who(f.owner)&&f.owner,"")||(isPerson(f.owner)?f.owner:"");
 const svc=G(()=>SVCREG.find(s=>s.n===f.service||s.id===f.service),null);
 if(svc&&isPerson(svc.owner))return{fallback:svc.owner,fvia:"owner of the "+svc.n+" service"};
 if(own)return{fallback:own,fvia:"workflow owner"};
 const mgr=dirOf(own);return mgr&&mgr.mgr?{fallback:mgr.mgr,fvia:"manager of the workflow owner"}:null}
function applyRoles(){seedRoles();const dl=G(()=>ZLINK.deadLinks().out,[]).filter(d=>d.kind==="actor"||d.kind==="person");let n=0,left=[];
 const seen=new Map();dl.forEach(d=>{const k=norm(d.ref);if(!k)return;if(!seen.has(k))seen.set(k,{text:d.ref,from:d.from,n:0});seen.get(k).n++});
 seen.forEach(v=>{if(ROLES.find(v.text))return;if(/^(the )?(outgoing |new )?(manager|requester|assignee|approver|recipient)\b/i.test(v.text)){const r=ROLES.add({name:v.text,tier:"runtime",basis:"Resolved from the record at run time",holders:[]});r.runtime=true;n++;return}const x=infer(v.text,roleFromContext(v.from));
  if(x&&x.sys){const r=ROLES.add({name:v.text,tier:"system",basis:"System component, resolved at run time",holders:[]});r.runtime=true;n++}
  else if(x){ROLES.add({name:v.text,tier:x.agent?"agent role":"workflow role",basis:"Inferred from workflow text, steward to confirm ("+x.via+", "+x.conf+"%)",holders:[{who:x.who,kind:x.agent?"agent":"primary",from:"2026-01-01",to:null,basis:"inferred: "+x.via,conf:x.conf,confirmed:false}]});n++}else left.push(v.text)});
 R.roleLeft=left;return n}
/* ---------- default backup owners ---------- */
function personOf(text){if(!text)return "";if(isPerson(text))return text;const r=ROLES.holderOf(text);if(r&&isPerson(r))return r;
 const d=G(()=>ORGX.byDomain(text),null);if(d){const o=G(()=>ORGX.person(d.ownerId||(d.d&&d.d.ownerId)),null);if(o)return o.name}return ""}
function backupFor(p){const owner=personOf(p.owner);if(!owner)return null;
 const dom=G(()=>ORGX.byDomain(p.name),null)||G(()=>ORGX.byDomain(p.module||""),null);
 const dd=dom&&(dom.d||dom);if(dd&&dd.backupId){const b=G(()=>ORGX.person(dd.backupId),null);if(b&&b.name!==owner)return{owner,backup:b.name,via:"Backup of the "+dd.label+" accountability domain (ORGX)"}}
 const me=dirOf(owner);if(me&&me.mgr&&me.mgr!==owner)return{owner,backup:me.mgr,via:"Manager of the owner (ORGX reporting line)"};
 const peer=DIR.find(d=>d.kind==="human"&&d.team===(me&&me.team)&&d.name!==owner);return peer?{owner,backup:peer.name,via:"Peer on the same team"}:null}
function applyBackups(){if(!S.plib)return 0;let n=0,miss=0;
 arr(G(()=>PROCLIB.list(),[])).forEach(p=>{if(p.backup&&!R.bak[p.id])return;const prev=R.bak[p.id];if(prev&&p.backup)return;const d=backupFor(p);if(!d){miss++;return}
  R.bak[p.id]={proc:p.id,name:p.name,owner:d.owner,backup:d.backup,via:d.via,state:"defaulted",at:TODAY,due:addD(TODAY,30)};
  const o=S.plib.own[p.id]=S.plib.own[p.id]||{};o.backup=d.backup;n++});
 if(n)G(()=>PROCLIB.refresh());R.bakMiss=miss;return n}
function applyOwners(){if(!S.plib)return 0;R.own=R.own||{};let n=0;
 arr(G(()=>PROCLIB.list(),[])).forEach(p=>{if(p.named!==false&&p.named!==undefined)return;if(R.own[p.id])return;const h=personOf(p.owner);if(!h)return;
  R.own[p.id]={proc:p.id,name:p.name,role:p.owner,owner:h,state:"defaulted",at:TODAY,due:addD(TODAY,30),via:"Holder of the "+p.owner+" role (role registry)"};
  const o=S.plib.own[p.id]=S.plib.own[p.id]||{};o.owner=h;n++});if(n)G(()=>PROCLIB.refresh());return n}
function acceptBackup(id){const b=R.bak[id];if(!b)return;b.state="accepted";b.by=G(()=>PERSONAS[S.persona].name,"Casey Rowan");b.on=TODAY;audit("Backup owner accepted",b.name+": "+b.backup);toast("Backup accepted","good");render()}
function overrideBackup(id,who){const b=R.bak[id];if(!b||!who||who===b.owner)return false;b.backup=who;b.state="overridden";b.via="Chosen by a person";b.on=TODAY;const o=S.plib.own[id]=S.plib.own[id]||{};o.backup=who;G(()=>PROCLIB.refresh());audit("Backup owner overridden",b.name+": "+who);return true}
function backupBadge(id){const b=R.bak[id];if(!b)return"";return b.state==="defaulted"?` <span class="pill warn" title="${esc(b.via)}. Confirm by ${b.due}.">Defaulted</span>`:b.state==="accepted"?` <span class="pill good">Accepted</span>`:` <span class="pill info">Overridden</span>`}
/* ---------- gate steps as approval records ---------- */
const grpOf=h=>h<0?"Overdue":h<=24?"Due today":h<=24*7?"This week":"Later";
function mkItem(o){const it=Object.assign({kind:"approval",cat:"Gate",ic:"gate",title:"",req:"",ageH:12,slaH:72,dueH:72,amt:null,risk:"low",why:"",ai:null,guard:"",ev:[],extra:"",can:{approve:true,reject:true,delegate:false},blk:"",rec:"",needNote:false,vendor:"",sim:false,openLabel:"Open the screen",open:()=>{}},o);
 it.group=grpOf(it.dueH);it.urgent=it.dueH<0||it.risk==="high"||it.dueH<4;it.sc=(it.urgent?0:1)*1e6+Math.max(-48,it.dueH)+100;return it}
const slaH=t=>{t=String(t||"");let m;if(/instant|auto/i.test(t))return 4;if((m=/(\d+)\s*(working )?days?/i.exec(t)))return +m[1]*24;if(/week/i.test(t))return 120;if(/month/i.test(t))return 480;if(/quarter/i.test(t))return 1200;if(/steering|board|committee/i.test(t))return 168;return 72};
function gateScreens(){const scr=new Set(SCREENS.map(s=>s[0]));return Object.keys(G(()=>PROC.defs,{})).filter(k=>scr.has(k)&&arr(PROC.defs[k].steps).some(s=>s.who==="gate"))}
function seedGates(){const have=new Set(Object.keys(G(()=>INBOX.adapters,{})).filter(k=>k!=="gate_rec"));let n=0;
 const ADPS=R15E_ADPS={inv:"inv",itsm_chg:"chg",svc_cat:"cat",svc_req:"cat",itsm_rel:"rel",plat_gate:"gapp",plat_atlas:"ent",exe_mat:"mat",ppm_sow:"sow",plat_fab:"fab",plat_debt:"debt",bud_req:"budreq",flw_appr:"flow",meet_hub:"meet",meet_act:"meet",meet_dec:"meet"};
 gateScreens().forEach(k=>{if(ADPS[k]&&have.has(ADPS[k]))return;if(R.gate.some(g=>g.screen===k))return;const d=PROC.defs[k];arr(d.steps).forEach((s,i)=>{if(s.who!=="gate")return;
  const scr=SCREENS.find(x=>x[0]===k);R.gate.push({id:"GT-"+k.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10)+"-"+(i+1),screen:k,screenName:scr?scr[1]:k,step:s.n,stepNo:i+1,title:d.title||s.n,approver:s.owner||"Process owner",in:s.in||"",out:s.out||"",sla:s.sla||"",state:"pending",at:TODAY,entity:"approval",req:G(()=>PROCLIB.get(k).owner,"")||"Process owner"});n++})});return n}
const gateCovered=k=>R.gate.some(g=>g.screen===k);
function holderName(g){return personOf(g.approver)||personOf(g.req)||g.approver}
const ME=()=>G(()=>INBOX.me(),"Casey Rowan");
function gateList(me){return R.gate.filter(g=>g.state==="pending"&&holderName(g)===me&&(!personOf(g.approver)||personOf(g.approver)!==personOf(g.req))).slice(0,8).map(g=>mkItem({id:"gt:"+g.id,src:"gate_rec",sid:g.id,kind:"approval",cat:"Process gate",ic:"gate",title:g.step+" ("+g.screenName+")",req:g.req,dueH:slaH(g.sla),slaH:slaH(g.sla),
  why:"You hold the "+g.approver+" role for this gate. Input: "+(g.in||"not stated")+". Result if approved: "+(g.out||"not stated")+".",guard:"Separation of duties: the requester cannot approve. The decision is recorded as an approval record and published as a decision event.",
  ev:[["Screen",g.screenName,""],["Gate step",g.step,""],["SLA",g.sla||"","" ],["Record",g.id,""]],openLabel:"Open "+g.screenName,open:()=>go(g.screen)}))}
function decideGate(it,verdict,note){const g=R.gate.find(x=>x.id===it.sid);if(!g)return{ok:false,why:"Gate record not found"};g.state=verdict;g.by=ME();g.on=TODAY;g.note=note||"";
 audit("Gate "+verdict,g.screenName+": "+g.step);G(()=>window.EVENTS&&window.EVENTS.emit("gate.passed",{screen:g.screen,step:g.step,recordId:g.id,actor:ME()},{source:"Gate approvals",actor:ME()}));return{ok:true}}
function registerGateAdapter(){const A=G(()=>INBOX.adapters,null);if(!A||A.gate_rec)return false;
 A.gate_rec={key:"gate_rec",label:"Process gate approvals",mod:"Process gates (approval records)",fn:"R15E.gates",wired:true,list:gateList,approve:(it,note)=>decideGate(it,"approved",note),reject:(it,why)=>decideGate(it,"rejected",why)};return true}
/* ---------- decision events ---------- */
let inAdp=0,wrapped=false;
const actorNow=()=>G(()=>ME(),"");
function emitDecision(kind,it,extra){G(()=>window.EVENTS&&window.EVENTS.emit("decision."+kind,Object.assign({kind:it.cat||"approval",recordId:it.sid||it.id,amount:it.amt==null?0:it.amt,actor:actorNow(),module:it.src||""},extra||{}),{source:it.src||"inbox",actor:actorNow()}))}
function wrapAdapters(){const A=G(()=>INBOX.adapters,{});Object.keys(A).forEach(k=>{const a=A[k];if(!a||a.__r15e)return;a.__r15e=1;
 [["approve","approved"],["reject","rejected"],["delegate","delegated"]].forEach(([m,ev])=>{const f=a[m];if(typeof f!=="function")return;
  a[m]=function(it){inAdp++;let r;try{r=f.apply(this,arguments)}finally{inAdp--}if(r&&r.ok!==false)emitDecision(ev,it,m==="delegate"?{from:actorNow(),to:arguments[1]}:m==="reject"?{reason:String(arguments[1]||"")}:{});return r}})})}
function wrapAudit(){if(wrapped||typeof window.audit!=="function")return;wrapped=true;const o=window.audit;
 const w=function(action,detail){const r=o.apply(this,arguments);try{if(inAdp)return r;const a=String(action||"");
  let ev=null;if(/^inbox: snoozed/i.test(a))ev="deferred";else if(/^(approved|approve)\b/i.test(a))ev="approved";else if(/^(rejected|declined|reject)\b/i.test(a))ev="rejected";else if(/^(deferred|held|postponed|snoozed)\b/i.test(a))ev="deferred";
  if(ev&&!/^inbox:/i.test(a)||ev==="deferred"){const m=/\b([A-Z]{2,6}-?\d{2,6})\b/.exec(a+" "+(detail||""));G(()=>window.EVENTS&&window.EVENTS.emit("decision."+ev,{kind:"audit",recordId:m?m[1]:"",amount:0,actor:actorNow(),module:"audit",detail:String(detail||"").slice(0,120)},{source:"Audit trail",actor:actorNow()}))}}catch(e){}return r};
 w.__r15e=1;Object.keys(o).forEach(k=>{w[k]=o[k]});window.audit=w}
/* ---------- phases called by mod_zlink.fixAll ---------- */
function phaseA(){if(R.applied.A)return 0;R.applied.A=1;wrapAudit();return applyRoles()}
let _rk="";
function refresh(){const k=[G(()=>PROCLIB.list().length,0),G(()=>Object.keys(DATAMODEL.tables).length,0),G(()=>Object.keys(PROC.defs).length,0),G(()=>Object.keys(METRICS).length,0),G(()=>FLOWX.flows().length,0)].join(",");if(k===_rk)return 0;_rk=k;
 let n=G(()=>applyRoles(),0);n+=phaseB();n+=G(()=>R15E.refreshData(),0);return n}
function phaseB(){const a=applyOwners()+applyBackups(),g=seedGates();registerGateAdapter();wrapAdapters();G(()=>window.INBOX&&INBOX.refresh&&INBOX.refresh());return a+g}
wrapAudit();
function ensureRole(text){text=String(text||"").trim();if(!text)return"";const ex=ROLES.holderOf(text);if(ex)return ex;const f=ROLES.find(text);if(f&&f.runtime)return"";
 if(/^(the )?(manager|assignment group manager|requester|assignee|approver|recipient|person|owner|person on call|affected owners)\b/i.test(text)||/ of the (person|request|record)/i.test(text)){const r=ROLES.add({name:text,tier:"runtime",basis:"Resolved from the record at run time",holders:[]});r.runtime=true;return""}
 const x=infer(text,null);if(x&&x.sys){const r=ROLES.add({name:text,tier:"system",basis:"System component, resolved at run time",holders:[]});r.runtime=true;return""}
 if(x&&x.who){ROLES.add({name:text,tier:x.agent?"agent role":"notification audience",basis:"Inferred from audience text, steward to confirm ("+x.via+", "+x.conf+"%)",holders:[{who:x.who,kind:x.agent?"agent":"primary",from:"2026-01-01",to:null,basis:"inferred: "+x.via,conf:x.conf,confirmed:false}]});return x.who}return""}
window.R15E=Object.assign(window.R15E||{},{refresh,ensureRole,gateAdapter:k=>{const a=R15E_ADPS[k];return !!a&&G(()=>!!INBOX.adapters[a],false)},roles:ROLES,state:R,phaseA,phaseB,backups:()=>Object.values(R.bak),acceptBackup,overrideBackup,backupBadge,gates:()=>R.gate,gateCovered,gateScreens,gateHolder:g=>holderName(g),personOf,wrapAdapters,backupFor,
 acceptAll:()=>{Object.keys(R.bak).forEach(k=>{if(R.bak[k].state==="defaulted"){R.bak[k].state="accepted";R.bak[k].on=TODAY}});render()}});
})();

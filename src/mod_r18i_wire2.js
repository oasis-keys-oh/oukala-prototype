/* ===== Round 18, I: Feature Contract wiring for r18_spend (Enterprise spend) and r18_levels (Views by level): process models, reuse-first data model,
   metrics, module map, owner AND backup, events, permissions, nav, search and Ask. Idempotent; retried until the registries exist. ===== */
(function(){
"use strict";
const W=window;const R18=W.R18;if(!R18)return;
const {G,arr}=R18;
const OWN={spend:["Avery Chen","Maya Ortiz"],lvl:["Jordan Lee","Priya Shah"]};
/* new personas reuse the existing roles: executives are executive + people manager, the director is a portfolio lead */
G(()=>{if(W.PERM&&PERM.personaRoles){const X=["executive","people_manager","employee"];["cfo","coo","cto"].forEach(k=>{PERM.personaRoles[k]=X.slice()});PERM.personaRoles.dir=["portfolio_lead","people_manager","employee"];
 Object.assign(PERM.personaUser,{cfo:"Marcus Reid",coo:"Victor Amaya",cto:"Carla Reyes",dir:"Priya Shah"})}});
const PSX=s=>({n:s[0],d:s[1],who:s[2],owner:s[3],sla:s[4],in:s[5],out:s[6]});
const PROCS=[
 {id:"r18_spend_view",screen:"r18_spend",name:"How enterprise spend is shown by executive and domain",owner:OWN.spend,steps:[
  ["Read the budget lines","Approved, committed, actual and forecast come from the one budget; nothing is copied.","auto","Automatic","Instant","Budget lines","Spend by cost center"],
  ["Place each cost center in one domain","Every cost center belongs to exactly one domain, so no dollar is counted twice.","auto","Automatic","Instant","Spend by cost center","Spend by domain"],
  ["Roll domains up to the owning executive","Each domain has one executive owner. An executive who owns several domains sees each one and the combined total.","auto","Automatic","Instant","Spend by domain","Spend by executive"],
  ["Allocate shared IT costs","Cloud and licences can be allocated to consuming domains by headcount. The view states whether allocation is on.","human","Finance owner","Monthly","Spend by domain","Allocated spend"],
  ["Review forecast against approved","The executive opens the domain with the largest overrun and asks its owner to act.","human","Executive","Monthly","Allocated spend","Assigned action"],
  ["Change a domain owner","Reassigning a domain updates every view and is written to the audit trail.","gate","Finance owner","As needed","Assigned action","Updated ownership"]]},
 {id:"r18_levels_view",screen:"r18_levels",name:"How views scale with the level of a role",owner:OWN.lvl,steps:[
  ["Place the role at a level","Each role is an executive, director, manager, specialist or contributor.","auto","Automatic","Instant","Role","Level"],
  ["Choose the home","Executives get a headline view; others get working views for their part.","auto","Automatic","Instant","Level","Home"],
  ["Drill down","Any level can open what is below it; the nested permission model decides what is allowed.","human","Any role","Any","Home","Detail"]]}];
const M={
 m_spend_var:{n:"Enterprise forecast against approved",f:"(Forecast − approved) ÷ approved × 100, across all domains, shared IT costs allocated",u:"%",cur:0,tgt:0,badAt:6,dir:"min",max:15,tr:[1,1.4,2,2.6,3.1,3.8,4.4,5],owner:OWN.spend[0],use:["Enterprise spend"],rem:{kind:"sop",ref:"SOP-R18-9",title:"Ask the owner of the largest overrun to reforecast",agent:"Forecast Agent",auto:false,state:"idle",prog:"Lists domains over approved"}},
 m_spend_unowned:{n:"Domains without an executive owner",f:"Domains with no executive owner assigned",u:"",cur:0,tgt:0,badAt:1,dir:"min",max:6,tr:[1,1,1,0,0,0,0,0],owner:OWN.spend[0],use:["Enterprise spend"],rem:{kind:"sop",ref:"SOP-R18-10",title:"Assign an executive owner to the domain",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists the domains"}}};
function syncM(){try{if(typeof METRICS==="undefined")return;const s=R18.spend.stats();const a=METRICS.m_spend_var;if(a){a.cur=+s.v.toFixed(1);a.tr=a.tr.slice(0,-1).concat([a.cur])}const b=METRICS.m_spend_unowned;if(b){b.cur=s.unowned;b.tr=b.tr.slice(0,-1).concat([b.cur])}}catch(e){}}
G(()=>{if(typeof METRICS!=="undefined"){Object.keys(M).forEach(k=>{if(!METRICS[k])METRICS[k]=M[k]});syncM()}});
const MODS=[
 {id:"r18_spend",name:"Enterprise spend",sn:"Enterprise spend",own:OWN.spend[0],r:["cost_center","budget_line","person"],w:[],flows:[["pull","tbm_model","IT cost depth and unit cost","budget_line","api","Open"]]},
 {id:"r18_levels",name:"Views by level",sn:"Views by level",own:OWN.lvl[0],r:["person"],w:[],flows:[]}];
const S_={proc:0,mods:{},pl:0,own:0,evt:0,nav:0,perm:0,tries:0,fl:0};
const exists=t=>!!G(()=>DATAMODEL.tables[t],null)||!!G(()=>PLAT.ent(t),null);
const NAVS=[["r18_spend","money","Enterprise spend","Where the money goes, by executive and domain","Spend","spend money budget executive domain cfo cto multiple domains showback forecast enterprise cost"],
 ["r18_levels","lens","Views by level","What each level of the org sees and can do","Lenses","level executive director manager contributor simple view access org chart"]];
function nav(){if(S_.nav||!(W.NAVX&&NAVX.add))return;try{NAVS.forEach(n=>NAVX.add(n[0],{group:n[1],label:n[2],hint:n[3],sub:n[4],kw:n[5]}));S_.nav=1;NAVS.forEach((n,i)=>{if(NAVX.map[n[0]])NAVX.map[n[0]].o=i-90});G(()=>NAVX.int&&NAVX.int.IDX&&(NAVX.int.IDX.dirty=true))}catch(e){}}
function perm(){try{if(S_.perm||!(W.PERM&&PERM.state&&PERM.addRule))return;[["r18_spend","Open Enterprise spend"],["r18_levels","Open Views by level"]].forEach(x=>{if(!PERM.state.rules.some(r=>r.res==="screen:"+x[0]))PERM.addRule({name:x[1],effect:"allow",sub:{roles:["*","!vendor_guest"]},res:"screen:"+x[0],act:["read"],when:"",why:"Anyone signed in may read; spend detail follows each person's scope.",tier:"screen",kind:"seed",owner:OWN.spend[0],reviewed:G(()=>R18.TODAY,null)})});S_.perm=1}catch(e){}}
function wire(){S_.tries++;
 try{if(!S_.proc&&W.PROC&&PROC.reg){PROCS.forEach(p=>PROC.reg(p.screen,{title:p.name,std:["itil5","cobit"],steps:p.steps.map(PSX)}));S_.proc=1}}catch(e){}
 try{if(W.MODMAP&&MODMAP.addModule){const ids=new Set(MODMAP.modules.map(m=>m.id));MODS.forEach(m=>{if(S_.mods[m.id])return;const fl=m.flows.filter(f=>ids.has(f[1])).map(f=>({dir:f[0],other:f[1],data:f[2],entity:f[3],mode:f[4],trig:f[5]}));const r=MODMAP.addModule({id:m.id,name:m.name,sn:m.sn,band:"plt",own:m.own,proposed:false,r:m.r.filter(exists),w:[],flows:fl});if(r&&(r.ok!==false||arr(r.warnings).some(w=>/already exists/.test(w))))S_.mods[m.id]=1})}}catch(e){}
 try{if(Object.keys(S_.mods).length===MODS.length&&!S_.pl&&W.PROCLIB&&PROCLIB.addProcess){let ok=true;PROCS.forEach(p=>{try{const r=PROCLIB.addProcess({id:p.id,name:p.name,module:p.screen,family:G(()=>PROCLIB.get("plat_gate").family,undefined),owner:p.owner[0],backup:p.owner[1],trigger:p.steps[0][1],steps:p.steps.map(PSX),inputs:[p.steps[0][5]],outputs:[p.steps[p.steps.length-1][6]],entities:["budget_line","cost_center"].filter(exists),metrics:p.screen==="r18_spend"?Object.keys(M):[],model:"cmmi",target:3,std:["itil5","cobit"]});if(!(r&&(r.ok!==false||arr(r.warnings).some(w=>/already exists/.test(w)))))ok=false}catch(e){ok=false}});S_.pl=ok?1:0}}catch(e){}
 try{if(S_.pl&&!S_.own&&W.OWNX&&OWNX.assign){PROCS.forEach(p=>{OWNX.assign("process",p.id,p.owner[0],p.owner[1]);OWNX.assign("process",p.screen,p.owner[0],p.owner[1]);OWNX.assign("module",p.screen,p.owner[0],p.owner[1])});Object.keys(M).forEach(m=>OWNX.assign("metric",m,OWN.spend[0],OWN.spend[1]));S_.own=1}}catch(e){}
 try{if(Object.keys(S_.mods).length===MODS.length&&W.MODMAP&&MODMAP.refresh&&!S_.fl){S_.fl=1;MODMAP.refresh()}}catch(e){}
 try{if(!S_.evt&&W.EVENTS&&EVENTS.register){[["spend.owner_changed","Domain owner changed"]].forEach(e=>EVENTS.register({id:e[0],label:e[1],module:"r18_spend",fields:[{name:"domain",type:"string"},{name:"owner",type:"string"},{name:"actor",type:"string"}],owner:OWN.spend[0]}));S_.evt=1}}catch(e){}
 perm();nav();syncM();
 if(S_.tries<24&&!(S_.proc&&S_.pl&&S_.own&&S_.evt&&S_.perm&&S_.nav))setTimeout(wire,900)}
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>NAVS.map(n=>({g:"Go to",t:n[2],m:n[3],c:"--accent",f:()=>G(()=>go(n[0])),k:n[5]})));
if(typeof ASKX!=="undefined")ASKX.push(q=>{const t=String(q||"").toLowerCase();
 if(/(cto|owns? (both|several|multiple)|multiple domains).*(spend|cost|money)|spend.*(domain|executive)|where.*money goes/.test(t)){const s=G(()=>R18.spend.stats(),null);if(s){const m=s.execs.filter(e=>e.rows.length>1).map(e=>e.exec+" owns "+e.rows.map(r=>r.dom).join(" and "));return{title:"Enterprise spend",body:"Forecast "+R18.usd(s.F)+" against "+R18.usd(s.A)+" approved. "+(m.length?m.join("; ")+", shown separately and combined. ":"")+"Each cost center sits in one domain, so nothing is counted twice.",go:"r18_spend",label:"Open Enterprise spend"}}}
 return null});
setTimeout(wire,1700);setInterval(syncM,15000);
})();

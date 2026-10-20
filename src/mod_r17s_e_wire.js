/* ===== Round 17, Agent S, part E: Feature Contract wiring for r17s_rules (process model, data model with reuse-first decisions, metrics with maturity,
   module map, nav, ownership, search, Ask intents, events, permission rules). Idempotent; retried until the registries exist. Sets RULES.ready so persistence starts. ===== */
(function(){
"use strict";
const W=window;const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const R=W.RULES;if(!R||!R.UI)return;
const OWN=["Tom Becker","Nia Brooks"];
const arr=x=>Array.isArray(x)?x:[];
const SCR="r17s_rules";
const PSX=s=>({n:s[0],d:s[1],who:s[2],owner:s[3],sla:s[4],in:s[5],out:s[6]});
const STEPS=[
 ["Describe the need","The requester says which table, which moment and what should happen, in plain words. A template from the Library can be the start.","human","Rule author","1 day","Need","Draft rule"],
 ["Build in the editor","When, If, Then, Else. Every action says what it changes. The script step accepts one sandboxed expression only.","human","Rule author","1 day","Draft rule","Complete draft with an owner and a different backup"],
 ["Test on a real record","A dry run shows before and after, the rules that fired in order, messages, blocked saves and notifications. Nothing is saved.","human","Rule author","1 hour","Complete draft","Test result"],
 ["Approve activation","The request goes to the Platform governance board (a group). The author cannot approve their own rule.","gate","Platform governance board","2 working days","Test result","Approved version"],
 ["Run and watch","The approved version runs in the form or on save. Firings, failures and loop stops are logged. A kill switch stops all rules or one type.","robot","Robot","Instant","Approved version","Firing log"],
 ["Change with a new version","An edit makes a new draft. The live version keeps running until the new one is approved. Rollback goes to a prior approved version.","human","Rule owner","As needed","Firing log","New version"],
 ["Retire","The owner retires a rule that is no longer needed. It stays in the history and the audit trail.","human","Rule owner","As needed","Rule","Retired rule"]];
const PROC={id:"r17s_rule_lifecycle",name:"How a rule is built, tested, approved and retired",screen:SCR};
try{G(()=>window.PROC&&window.PROC.reg&&window.PROC.reg(SCR,{title:PROC.name,std:["itil5","cobit"],steps:STEPS.map(PSX)}))}catch(e){}

const fld=(k,label,type,cls)=>({k,label,type,authority:"platform",classification:cls||"internal"});
const exists=t=>!!G(()=>DATAMODEL.tables[t],null);
function ENTS(){return[
 {id:"rule_definition",label:"Rule",domain:"plat",source:"Rules and scripts",ownerApp:SCR,ownerMod:SCR,status:"live",steward:OWN[0],
  note:"Integration decision: new. approval_rule (reused for the approval condition grammar) only decides who approves; a rule here also changes forms, sets fields, blocks saves and notifies. Same condition expression grammar, so the two stay compatible. Closest: approval_rule.",
  fields:[fld("id","Rule ID","string"),fld("kind","Kind (client, business, notify, uiaction, choice)","enum"),fld("name","Name","string"),fld("entity","Table","string"),fld("type","Type","enum"),fld("trigger","Trigger","enum"),fld("status","Status","enum"),fld("owner","Owner","ref","internal"),fld("backup","Backup","ref","internal"),fld("version","Version","number"),fld("body","Definition","text")]},
 {id:"rule_action",label:"Rule action",domain:"plat",source:"Rules and scripts",ownerApp:SCR,ownerMod:SCR,status:"live",steward:OWN[0],
  note:"Integration decision: new and thin. An ordered step of a rule (then or else). Reused: the approval, notification and workflow components are called, not copied. Closest: flow_step.",
  fields:[fld("id","Action ID","string"),fld("rule","Rule","ref"),fld("seq","Order","number"),fld("branch","Then or else","enum"),fld("action","Action","enum"),fld("summary","What it changes","string")]},
 {id:"rule_firing",label:"Rule firing",domain:"plat",source:"Rules and scripts",ownerApp:SCR,ownerMod:SCR,status:"live",steward:OWN[1],
  note:"Integration decision: extend audit_event. Firings of real saves are kept for the failure view; dry runs are never stored. Closest: audit_event.",
  fields:[fld("id","Firing ID","string"),fld("rule","Rule","ref"),fld("outcome","Outcome","enum"),fld("entity","Table","string"),fld("record","Record","string"),fld("detail","Detail","string"),fld("at","At","date")]},
 {id:"choice_list",label:"Choice list",domain:"plat",source:"Rules and scripts",ownerApp:SCR,ownerMod:SCR,status:"live",steward:OWN[0],
  note:"Integration decision: reuse lists. Every choice list is registered in the shared list registry (LISTS) so a picker can use it; this entity keeps the versioned definition, owner and backup and the parent field for dependent lists. Closest: the list registry.",
  fields:[fld("id","List ID","string"),fld("name","Name","string"),fld("field","Fills field","string"),fld("kind","Static or dependent","enum"),fld("parent_field","Parent field","string"),fld("entity_ref","Table","string"),fld("status","Status","enum"),fld("owner","Owner","ref"),fld("backup","Backup","ref"),fld("version","Version","number"),fld("body","Values","text")]}]}

const M={
 m_rules_owned:{n:"Rules with owner and backup",f:"Rules not retired that name a human owner and a different human backup from the directory ÷ rules not retired × 100 (from the rule store)",u:"%",cur:100,tgt:100,badAt:90,dir:"max",max:100,tr:[100,100,92,92,100,100,100,100],owner:OWN[0],use:["Rules and scripts"],rem:{kind:"sop",ref:"SOP-R17S-1",title:"Name a backup who is a different person",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists rules missing an owner or a backup"}},
 m_rules_failed:{n:"Rule failures per week",f:"Real firings in the last 7 days with outcome error or loop stopped (dry runs excluded), from the firing log",u:" per week",cur:0,tgt:0,badAt:5,dir:"min",max:20,tr:[3,2,2,1,1,0,0,0],owner:OWN[1],use:["Rules and scripts"],rem:{kind:"sop",ref:"SOP-R17S-2",title:"Fix or retire the rule that fails most often",agent:"Ops Agent",auto:false,state:"idle",prog:"Names the failing rule and its last error"}},
 m_rules_fired:{n:"Rules fired per day",f:"Real firings in the last 24 hours with outcome fired, blocked or asked (dry runs excluded), from the firing log",u:" per day",cur:0,tgt:10,badAt:0,dir:"max",max:60,tr:[2,3,3,5,4,6,6,7],owner:OWN[0],use:["Rules and scripts"],rem:{kind:"sop",ref:"SOP-R17S-3",title:"Review active rules that never fire",agent:"Ops Agent",auto:false,state:"idle",prog:"Lists active rules with zero firings in 30 days"}},
 m_rules_untested:{n:"Rules untested",f:"Active rules that have never had a dry-run test recorded",u:"",cur:0,tgt:0,badAt:3,dir:"min",max:10,tr:[4,4,3,3,3,2,2,2],owner:OWN[1],use:["Rules and scripts"],rem:{kind:"sop",ref:"SOP-R17S-4",title:"Test the rule on a real record",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists untested active rules"}}};
function syncMetrics(){try{if(typeof METRICS==="undefined")return;const s=R.stats();const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=+(+v).toFixed(1);m.tr=m.tr.slice(0,-1).concat([m.cur])};
 set("m_rules_owned",s.total?Math.round(100*s.withOwner/s.total):100);set("m_rules_failed",s.failWeek);set("m_rules_fired",s.firedDay);set("m_rules_untested",s.untested)}catch(e){}}
R.syncMetrics=syncMetrics;
G(()=>{if(typeof METRICS!=="undefined"){Object.keys(M).forEach(k=>{if(!METRICS[k])METRICS[k]=M[k]});syncMetrics()}});

const EV=[["rule.fired","Rule fired"],["rule.blocked","Rule blocked a save"],["rule.failed","Rule failed"],["rule.loop_stopped","Rule loop stopped"],["rule.activated","Rule activated"],["rule.retired","Rule retired"],["rule.rolled_back","Rule rolled back"],["rule.kill_switch","Rule kill switch changed"],["rule.notification_sent","Rule notification sent"],["approval.escalated","Approval escalated"],["incident.major_declared","Major incident declared"],["approval.requested","Approval requested"]];
const FLOWS=[["pull","inbox","Approvals past their due time","approval","batch","Schedule"],["push","inbox","Notices from notification rules","notification","event","Rule fires"],["push","adm_audit","Activation, rollback, kill switch","audit_event","event","Rule changed"],["pull","plat_gate","Governance group members","approval_group","api","Activation requested"]];
const W_={ent:0,mod:0,flow:0,proc:0,own:0,evt:0,nav:0,perm:0,tries:0,lists:0};
function ensurePerm(){try{if(!(W.PERM&&PERM.state&&PERM.addRule))return;
 if(!PERM.state.rules.some(r=>r.res==="screen:"+SCR))PERM.addRule({name:"Open Rules and scripts",effect:"allow",sub:{roles:["*","!vendor_guest"]},res:"screen:"+SCR,act:["read"],when:"",why:"Anyone may read rules; changing them needs a maker role and activation needs a group approval.",tier:"screen",kind:"seed",owner:OWN[0],reviewed:G(()=>TODAY,null)});
 [["create","Create rules",R.roleSets.create],["update","Edit rules",R.roleSets.edit],["approve","Activate rules",R.roleSets.activate]].forEach(x=>{if(!PERM.state.rules.some(r=>r.res==="entity:rule_definition"&&r.act&&r.act[0]===x[0]))PERM.addRule({name:x[1],effect:"allow",sub:{roles:arr(x[2])},res:"entity:rule_definition",act:[x[0]],when:"",why:x[1]+" is limited to these roles. Activation also needs an approval from the governance group.",tier:"entity",kind:"seed",owner:OWN[0],reviewed:G(()=>TODAY,null)})});W_.perm=1}catch(e){}}
function wire(){W_.tries++;
 try{if(!W_.ent&&W.ATLAS&&ATLAS.addEntity){let ok=true;ENTS().forEach(d=>{try{const r=ATLAS.addEntity(d);if(r&&r.ok===false&&!arr(r.warnings).some(w=>/already exists/.test(w)))ok=false}catch(e){ok=false}});W_.ent=ok?1:0;if(ok){R.ready=true;G(()=>R.persist())}}}catch(e){}
 try{if(!W_.mod&&W.MODMAP&&MODMAP.addModule){const ids=new Set(MODMAP.modules.map(m=>m.id));const fl=FLOWS.filter(f=>ids.has(f[1])).map(f=>({dir:f[0],other:f[1],data:f[2],entity:f[3],mode:f[4],trig:f[5]}));
  const r=MODMAP.addModule({id:SCR,name:"Rules and scripts",sn:"Rules and scripts",band:"plt",own:OWN[0],proposed:false,r:["approval","person","audit_event"].filter(exists),w:["rule_definition","rule_action","rule_firing","choice_list"],flows:fl});
  if(r&&(r.ok!==false||arr(r.warnings).some(w=>/already exists/.test(w))))W_.mod=1}}catch(e){}
 try{if(W_.mod&&!W_.proc&&W.PROCLIB&&PROCLIB.addProcess){const r=PROCLIB.addProcess({id:PROC.id,name:PROC.name,module:SCR,family:G(()=>PROCLIB.get("plat_gate").family,undefined),owner:OWN[0],backup:OWN[1],trigger:"A need for a form behavior, an automatic action, a notice or a drop-down",steps:STEPS.map(PSX),inputs:["Need"],outputs:["Approved, running rule"],entities:["rule_definition","rule_action","rule_firing","choice_list","approval"],metrics:Object.keys(M),model:"cmmi",target:3,std:["itil5","cobit"]});
  if(r&&(r.ok!==false||arr(r.warnings).some(w=>/already exists/.test(w))))W_.proc=1}}catch(e){}
 try{if(W_.proc&&!W_.own&&W.OWNX&&OWNX.assign){OWNX.assign("process",PROC.id,OWN[0],OWN[1]);OWNX.assign("process",SCR,OWN[0],OWN[1]);OWNX.assign("module",SCR,OWN[0],OWN[1]);["rule_definition","rule_action","rule_firing","choice_list"].forEach(e=>OWNX.assign("entity",e,OWN[0],OWN[1]));Object.keys(M).forEach(m=>OWNX.assign("metric",m,M[m].owner,OWN[0]===M[m].owner?OWN[1]:OWN[0]));W_.own=1}}catch(e){}
 try{if(W_.ent&&W_.mod&&W.MODMAP&&MODMAP.refresh&&!W_.fl){W_.fl=1;MODMAP.refresh()}}catch(e){}
 try{if(!W_.evt&&W.EVENTS&&EVENTS.register){EV.forEach(e=>{try{EVENTS.register({id:e[0],label:e[1],module:SCR,fields:[{name:"rule",type:"string"},{name:"record",type:"string"},{name:"actor",type:"string"}],owner:OWN[0]})}catch(x){}});W_.evt=1}}catch(e){}
 try{if(W_.ent&&W.COVER&&Array.isArray(COVER.recs)&&!W_.rec){[["RUL_DEF","Rules","rule_definition",()=>R.data.rules.length],["RUL_FIR","Rule firings","rule_firing",()=>R.data.log.length],["RUL_CHO","Choice lists","choice_list",()=>R.data.rules.filter(r=>r.body.type==="choice").length]].forEach(x=>{if(!COVER.recs.some(r=>r.key===x[0]))COVER.recs.push({key:x[0],label:x[1],scr:[SCR],mod:SCR,n:G(x[3],1),ent:x[2],how:"new",path:"RULES"})});W_.rec=1}}catch(e){}
 try{G(()=>R.regLists());W_.lists=1}catch(e){}
 ensurePerm();syncMetrics();
 if(!(W_.ent&&W_.mod&&W_.proc&&W_.own&&W_.evt&&W_.perm)||W_.tries<6)if(W_.tries<22)setTimeout(wire,900);else if(!R.ready){R.ready=true}}
setTimeout(wire,1400);[4000,9000,16000].forEach(t=>setTimeout(ensurePerm,t));setInterval(syncMetrics,15000);
R.wireState=W_;

/* ---------------- navigation, aliases, search, Ask ---------------- */
function nav(){
 if(W.NAVX&&NAVX.add&&!W_.nav){NAVX.add(SCR,{group:"plat",label:"Rules and scripts",hint:"Configure form behavior, save actions, notifications, UI actions and drop-down choices without code",sub:"Build and connect",kw:"rules scripts business rule client script on save on click notification ui action choice list drop down dependent condition servicenow validate mandatory hide show set value kill switch"});W_.nav=1}
 const R15=W.R15=W.R15||{};R15.alias=R15.alias||{};R15.hidden=R15.hidden||{};R15.alias.rules={to:SCR};R15.hidden.rules=1;if(R15.names)R15.names[SCR]="Rules and scripts";
 G(()=>{NAVX.alias=NAVX.alias||{};NAVX.alias["rules"]=SCR;NAVX.alias["rules and scripts"]=SCR;NAVX.alias["business rules"]=SCR})}
nav();setTimeout(nav,900);
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>{const o=[{g:"Go to",t:"Rules and scripts",m:"Form behavior, save actions, notifications, UI actions, choice lists",c:"--accent",f:()=>G(()=>go(SCR)),k:"rules scripts business client notification ui action choice list r17s"}];
 G(()=>R.data.rules.forEach(r=>o.push({g:"Rules",t:r.id+" "+r.body.name,m:R.TYPES[r.body.type].short+" · "+R.UI.entLabel(r.body.entity)+" · "+r.status,c:"--info-f",f:()=>{R.UI.openRule(r.id)},k:"rule "+r.id+" "+r.body.name+" "+r.body.entity+" "+r.body.trigger+" "+(r.body.owner||"")})));return o});
if(typeof ASKX!=="undefined")ASKX.push(q=>{const t=String(q||"").toLowerCase();
 let m=t.match(/what rules (apply|run|exist) (to|on|for) (\w[\w ]*)/);
 if(m){const w=m[3].replace(/s\b/,"").trim();const ents=R.entities();const e=ents.find(x=>(x.id+" "+x.label).toLowerCase().indexOf(w)>=0);const list=R.data.rules.filter(r=>e&&r.body.entity===e.id&&r.status!=="retired");
  R.UI.st.fe=e?e.id:"";S.v.r17sv=1;G(()=>go(SCR));
  say(q,{t:e?`<b>${list.length}</b> rules apply to ${e.label}: ${list.slice(0,8).map(r=>r.id+" "+r.body.name).join("; ")||"none"}.`:"I could not match that to a table. Opened the rule list so you can pick one.",steps:["Read the rule store","Filtered by table"]});return true}
 if(/(create|add|build|write|configure|set up) (a |an |new )?(business |client |notification )?rule|in-app rule|on save action|on click action|client script|business rule/.test(t)){S.v.r17sv=2;G(()=>R.UI.newRule("client"));say(q,{t:"Opened the rule editor with a new draft. Choose the table and the moment, add a condition and the actions, test it on a record, then request activation.",steps:["Opened Rules and scripts"]});return true}
 return false});
})();

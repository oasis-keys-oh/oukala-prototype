// PR-25 and PR-27: the agent runtime honors the AI Control Tower kill switch, and a gated run is decided only by the sponsor
// (or a member of the approver group the sponsor delegates to). Runs are simulated; no model is called.
// Usage: node tools/tests/fixes_runtime.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.AGENTRT&&AGENTRT.registry().length&&typeof S!=="undefined"&&Array.isArray(S.agents),null,{timeout:60000});await p.waitForTimeout(600);
let fail=0;const ok=(v,m)=>{console.log((v?'ok   ':'FAIL ')+m);if(!v)fail++};
/* ---- PR-25: tower kill switch ---- */
const pick=await p.evaluate(()=>{const a=S.agents.find(x=>x.st==="running"&&AGENTRT.registry().some(r=>r.name===x.n&&r.lifecycle==="active"));return a?{id:a.id,n:a.n}:null});
ok(!!pick,'an active registered agent is in the AI Control Tower'+(pick?' ('+pick.n+')':''));
if(pick){
 await p.evaluate(a=>{go('tower');S.ct.scope='agent';S.ct.target=a.id;S.ct.reason='Fixes test: stop this agent';S.ct.armed=true;render()},pick);
 await p.evaluate(()=>document.getElementById('fire').click());/* the confirm button sits in a tab; a DOM click reaches the same handlers */await p.waitForTimeout(200);
 const k=await p.evaluate(a=>{const c=STORE.get("agent_control","agent:"+a.n);const r=AGENTRT.execute({agent:a.n,goal:"Fixes test after the tower kill switch",step:"fixes test"});
  const ev=STORE.all("agent_event").filter(e=>e.agent===a.n&&e.kind==="control"&&/^Kill switch from the AI Control Tower/.test(e.detail));return {c,r,ev:ev.length,last:ev.length?ev[ev.length-1].detail:""}},pick);
 ok(k.c&&k.c.paused&&k.c.kind==="kill"&&k.c.origin==="tower"&&k.c.simulated===true,'tower kill switch writes a runtime control (kill, origin tower, simulated)');
 ok(k.r&&k.r.blocked&&/AI Control Tower kill switch/.test(k.r.why),'the next run is refused with the reason: '+(k.r&&k.r.why));
 ok(k.ev>0,'the audit trail records the control: '+k.last);
 await p.evaluate(id=>{go('tower');const b=document.querySelector(`[data-restore="${id}"]`);if(b)b.click()},pick.id);await p.waitForTimeout(200);
 const r=await p.evaluate(a=>{const c=STORE.get("agent_control","agent:"+a.n);const x=AGENTRT.execute({agent:a.n,goal:"Fixes test after restore",step:"fixes test"});return {c,x}},pick);
 ok(r.c&&!r.c.paused,'restore in the tower clears the tower control');
 ok(!(r.x.blocked&&r.x.by==="control"),'after restore the run is not blocked by a control ('+(r.x.blocked?r.x.why:'ran')+')');
 /* a runtime control set elsewhere is not cleared by the tower */
 const keep=await p.evaluate(a=>{AGENTRT.setControl("agent",a.n,true,"pause","Fixes test: runtime pause");AGENTRT.towerSync();const c=STORE.get("agent_control","agent:"+a.n);AGENTRT.setControl("agent",a.n,false);return c&&c.paused},pick);
 ok(keep,'a pause set in the runtime is not cleared by the tower sync');
}
/* ---- PR-27: sponsor decides the gate ---- */
const g=await p.evaluate(()=>{const R=AGENTRT;const L=R.registry().filter(r=>r.lifecycle==="active"&&r.sponsor&&r.backup&&r.sponsor!==r.backup);
 let res=null,ag=null;for(const r of L){STORE.patch("agent_registry",r.name,{tier:2});const x=R.execute({agent:r.name,goal:"Fixes test: sponsor gate",step:"fixes test"});STORE.patch("agent_registry",r.name,{tier:r.tier});if(x.ok&&x.needsApproval){res=x;ag=r;break}}
 if(!res)return {none:true};const id=res.runId;
 const other=DIR.find(d=>d.kind==="human"&&d.name!==ag.sponsor&&d.name!==ag.backup).name;
 const a1=R.gate(id,"Approved",other,"not the sponsor");const st1=STORE.get("agent_run",id).state;
 const a2=R.gate(id,"Approved",ag.sponsor+" (recorded by "+other+")","on behalf");const st2=STORE.get("agent_run",id).state;
 const cd=R.canDecide(id,other);
 /* delegation: sponsor delegates to an approver group the other person belongs to */
 const grp=(APG.groups()||[]).find(x=>(x.members||[]).length&&!(x.members||[]).includes(ag.sponsor));const mem=grp?grp.members[0]:null;
 const d0=R.delegate(ag.name,grp&&grp.id,other);const d1=R.delegate(ag.name,grp&&grp.id,ag.sponsor);
 const a3=mem?R.gate(id,"Approved",mem,"delegated"):null;const st3=STORE.get("agent_run",id).state;R.delegate(ag.name,null,ag.sponsor);
 const x2=R.execute({agent:ag.name,goal:"Fixes test: sponsor gate 2",step:"fixes test"});let a4=null,st4=null;
 if(x2.ok&&x2.needsApproval){a4=R.gate(x2.runId,"Approved",ag.sponsor,"sponsor");st4=STORE.get("agent_run",x2.runId).state}
 const refusedEv=STORE.all("agent_event").some(e=>e.agent===ag.name&&/decision refused/.test(e.detail));
 return {agent:ag.name,sponsor:ag.sponsor,other,a1,st1,a2,st2,cd,d0,d1,grp:grp&&grp.id,mem,a3,st3,a4,st4,refusedEv}});
if(g.none){ok(false,'no gated run could be produced')}else{
 ok(g.a1===false&&g.st1==="awaiting approval",'a non-sponsor ('+g.other+') cannot decide '+g.agent+'\'s gated run');
 ok(g.a2===false&&g.st2==="awaiting approval",'recording on behalf of the sponsor does not get around it');
 ok(g.cd&&g.cd.ok===false&&/sponsor/.test(g.cd.why),'the refusal says why: '+(g.cd&&g.cd.why));
 ok(g.refusedEv,'the refusal is in the agent audit trail');
 ok(g.d0&&g.d0.ok===false,'only the sponsor can delegate gate decisions');
 if(g.grp){ok(g.d1&&g.d1.ok,'the sponsor delegates to approver group '+g.grp);ok(g.a3===true&&g.st3==="approved",'a member of the delegated group ('+g.mem+') decides')}
 if(g.a4!==null)ok(g.a4===true&&g.st4==="approved",'the sponsor ('+g.sponsor+') decides');
}
ok(errs.length===0,'no page errors');if(errs.length)console.log(errs.slice(0,5));
console.log(fail?'RUNTIME FAIL ('+fail+')':'RUNTIME PASS');await b.close();process.exit(fail?1:0)})();

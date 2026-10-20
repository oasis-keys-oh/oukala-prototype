// Steps test (CL-58, CL-73, CL-74, PH-10 VibeCheck, DC-01 typing queue).
// Opens the workflow designer and VibeCheck; asserts no visible "Automatic" or "Function" step label, the who picker offers
// exactly human, robot, agent and approval gate, robot and agent steps show a trigger, the agent definition card opens,
// the build bar close control sits top right, and Next while a message types is queued instead of firing twice.
// Usage: node tools/tests/steps.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);
const fails=[];const ok=(c,m)=>{if(!c)fails.push(m)};
const RETIRED=/\b(Automatic|Function|Agentic|Deterministic)\b/;
const textOf=sel=>p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent).join(" | "),sel);
const drawerCard=()=>p.evaluate(()=>{const d=document.getElementById('drawer');return !!(d&&d.querySelector('[data-stp-card]'))});
const closeDrawer=()=>p.evaluate(()=>{const d=document.getElementById('drawer');if(d){try{d.hidePopover&&d.hidePopover()}catch(e){}d.removeAttribute('open')}});

/* 1. workflow designer */
await p.evaluate(()=>FLOWX.open("wf_inv","AG1"));await p.waitForTimeout(700);
const modes=await p.evaluate(()=>[...document.querySelectorAll('[data-wfd-mode]')].map(b=>b.dataset.wfdMode));
ok(JSON.stringify(modes)===JSON.stringify(["human","robot","agent","gate"]),'designer picker is human, robot, agent, gate: got '+modes);
const dlab=await textOf('.wfd-pal,.wfd-nt,.wfd-seg3,.wfd-legend,.wfd-ibody .eyebrow');
ok(!RETIRED.test(dlab),'designer shows a retired step label: '+(dlab.match(RETIRED)||[])[0]);
const agTrig=await p.evaluate(()=>{const n=document.querySelector('[data-wfd-node="AG1"] .wfd-ntr');return n?n.textContent:""});
ok(/Process step is reached|Schedule|Metric|Event|Record/.test(agTrig),'designer agent step shows its trigger: '+agTrig);
const robTrig=await p.evaluate(()=>{const n=document.querySelector('[data-wfd-node="A1"] .wfd-ntr');return n?n.textContent:""});
ok(robTrig.length>0,'designer robot step shows its trigger');
const trigOpts=await p.evaluate(()=>{const s=document.querySelector('[data-wfd-set="p.trig.type"]');return s?[...s.options].map(o=>o.value):[]});
ok(trigOpts.length===5&&trigOpts.includes("metric"),'designer trigger choices come from TRIGGERS.list(): '+trigOpts);
await p.evaluate(()=>{const b=document.querySelector('.wfd-ibody [data-stp-agent]');if(b)b.click()});await p.waitForTimeout(500);
ok(await drawerCard(),'agent definition card opens from a designer agent step');
const card=await textOf('#drawer [data-stp-card]');
for(const w of ["Task","Tier","Budget","Confidence floor","Kill switch","Human sponsor","Trigger","Prompts, versioned","Guidelines","Simulated"])ok(card.includes(w),'agent card shows '+w);
await closeDrawer();

/* 2. process diagram and module map labels */
const pd=await p.evaluate(()=>{const L=PROCLIB.list();const x=L.find(q=>(PROCLIB.get(q.id).stepsList||[]).some(s=>/^(auto|robot)$/.test(s.who)))||L[0];const d=document.createElement('div');d.innerHTML=R17PD.card(x.id);return d.textContent});
ok(!RETIRED.test(pd),'process diagram shows a retired step label');ok(/Robot/.test(pd),'process diagram legend says Robot');

/* 3. VibeCheck (studio) */
await p.evaluate(()=>{go("studio")});await p.waitForTimeout(400);
await p.evaluate(()=>{STUDIO.fast=true;STUDIO.auto=true;STUDIO.start("cal")});
await p.waitForFunction(()=>STUDIO.B&&STUDIO.B.steps&&STUDIO.B.steps.length>3&&STUDIO.built,null,{timeout:30000}).catch(()=>fails.push('studio never built the process'));
await p.evaluate(()=>{STUDIO.auto=false});await p.waitForTimeout(500);
/* make one person step an agent through the same call the picker uses, then open it in the step panel */
await p.evaluate(()=>{STUDIO.view="flow";let i=STUDIO.B.steps.findIndex(s=>s.who==="agent");if(i<0){i=STUDIO.B.steps.findIndex(s=>s.who==="human"&&!s.base);STUDIO.x.setWho(String(i),"agent")}STUDIO.view="flow";STUDIO.sel=String(i);STUDIO.x.render()});
await p.evaluate(()=>{const b=document.querySelector('[data-stu-zoom="0"]');if(b)b.click()});await p.waitForTimeout(500);
const seg=await p.evaluate(()=>[...document.querySelectorAll('.stu-seg button')].map(b=>b.textContent.trim()));
ok(JSON.stringify(seg)===JSON.stringify(["Human","Robot","Agent","Approval gate"]),'studio picker is Human, Robot, Agent, Approval gate: got '+seg);
const slab=await textOf('.stu-lab,.stu-nd small,.stu-seg,.stu-ks,.stu-insp .stu-eb');
ok(!RETIRED.test(slab),'studio shows a retired step label: '+(slab.match(RETIRED)||[])[0]);
const kinds=await p.evaluate(()=>[...new Set(STUDIO.B.steps.map(s=>s.who))]);
ok(kinds.every(k=>["human","robot","agent","gate"].includes(k)),'studio steps hold canonical kinds: '+kinds);
const strig=await p.evaluate(()=>STUDIO.B.steps.filter(s=>s.who==="robot"||s.who==="agent").every(s=>s.trig&&TRIGGERS.get(s.trig.type)));
ok(strig,'every studio robot and agent step has a trigger');
ok(await p.evaluate(()=>!!document.querySelector('.stu-nd.g .stu-ntr')),'studio agent step card shows its trigger');
ok(await p.evaluate(()=>!!document.querySelector('.stu-insp [data-stu-trig]')),'studio step panel offers the trigger choice');
await p.evaluate(()=>{const b=document.querySelector('.stu-insp [data-stp-agent]');if(b)b.click()});await p.waitForTimeout(500);
ok(await drawerCard(),'agent definition card opens from a studio agent step');await closeDrawer();

/* 4. PH-10: build bar close control sits top right of the bar */
const pos=await p.evaluate(()=>{const s=document.getElementById('stuStrip');if(!s)return null;const x=s.querySelector('[data-stu-exit]'),r=s.getBoundingClientRect(),q=x.getBoundingClientRect(),o=[...s.children].filter(c=>c!==x).map(c=>c.getBoundingClientRect());
 return{right:Math.round(r.right-q.right),top:Math.round(q.top-r.top),rightmost:o.every(b=>b.right<=q.left+1||b.top>=q.bottom)}});
if(pos){ok(pos.right<=16&&pos.top<=12,'build bar close is not top right: '+JSON.stringify(pos));ok(pos.rightmost,'build bar close is not the rightmost control')}
else fails.push('build bar not found');

/* 5. DC-01: Next while a message is typing is queued, not fired twice */
await p.evaluate(()=>{STUDIO.fast=false;STUDIO.auto=false;STUDIO.start("ret")});await p.waitForTimeout(700);
const q0=await p.evaluate(()=>({i:STUDIO.i,typing:!!STUDIO.typing,busy:STUDIO.isBusy()}));
await p.evaluate(()=>{STUDIO.next();STUDIO.next();const b=document.querySelector('[data-stu-nx]');if(b)b.click()});
const q1=await p.evaluate(()=>STUDIO.i);
ok(q0.busy,'studio was not typing when Next was pressed (test setup)');ok(q1===q0.i,'Next while typing fired at once: '+q0.i+' to '+q1);
await p.waitForFunction(i=>STUDIO.i===i+1,q0.i,{timeout:15000}).catch(()=>fails.push('queued Next never ran'));
await p.waitForTimeout(2500);const q2=await p.evaluate(()=>STUDIO.i);
ok(q2===q0.i+1,'queued Next ran more than once: '+q0.i+' to '+q2);
await p.evaluate(()=>{STUDIO.fast=true});

/* 6. agent registry */
await p.evaluate(()=>go("agent_defs"));await p.waitForTimeout(300);
ok(await p.evaluate(()=>document.querySelectorAll('#view [data-stp-agent]').length>3),'agent registry lists agents');
await p.evaluate(()=>document.querySelector('#view [data-stp-agent]').click());await p.waitForTimeout(500);ok(await drawerCard(),'agent card opens from the registry');await closeDrawer();
ok(await p.evaluate(()=>STEPKIT.robotTest({task:"List instruments due in 14 days and notify the owner"}).robot&&!STEPKIT.robotTest({task:"Draft a summary and recommend a fix"}).robot),'could-be-a-robot rule');
await p.evaluate(()=>{go("plat_contract")});await p.waitForTimeout(300);

ok(errs.length===0,'page errors: '+errs.slice(0,3).join(' / '));
console.log('steps',fails.length?'FAIL\n - '+fails.join('\n - '):'ok');await b.close();process.exit(fails.length?1:0)})();

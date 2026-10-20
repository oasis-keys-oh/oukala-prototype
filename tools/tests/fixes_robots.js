// CL-78 robot directory (R23): every robot step resolves to a robot record with a human sponsor and a different human backup,
// and ownerChip for a robot carries the sponsor without the caller passing one. Directory entries are prototype data (simulated).
// Usage: node tools/tests/fixes_robots.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>window.OWNERX&&OWNERX.robots&&window.PROCLIB&&window.STEPKIT&&STEPKIT.robotFor,null,{timeout:60000});await p.waitForTimeout(1200);
let fail=0;const ok=(v,m)=>{console.log((v?'ok   ':'FAIL ')+m);if(!v)fail++};
const r=await p.evaluate(()=>{const hum=n=>{const x=who(n);return !!(x&&x.kind!=="ai")};let steps=0;const bad=[];
 PROCLIB.list().forEach(P=>{const g=PROCLIB.get(P.id);(g.stepsList||[]).forEach(s=>{if(STEPMODE.of(s.who)!=="robot")return;steps++;const rb=STEPKIT.robotFor(s,{process:P.id});
  if(!rb||!hum(rb.sponsor)||!hum(rb.backup)||rb.sponsor===rb.backup)bad.push(P.id+":"+(s.n||"")+" -> "+JSON.stringify(rb&&{n:rb.name,s:rb.sponsor,b:rb.backup}))})});
 const R=OWNERX.robots();const named=R.find(x=>!/ robot$/.test(x.name))||R[0];
 const box=document.createElement("div");box.innerHTML=ownerChip(named.name);const el=box.firstElementChild;
 const box2=document.createElement("div");box2.innerHTML=ownerChip(R[0].name,{kind:"robot"});const el2=box2.firstElementChild;
 const loose=STEPKIT.robotFor({n:"Send the reminder",who:"robot",owner:"Automatic"},{processName:"Ad hoc test"});
 const chipHtml=STEPKIT.ownerChip({n:"Match",who:"fn",owner:"Automatic"},{process:R[0].processes[0]});
 return {steps,bad,robots:R.length,named:named.name,kind:el&&el.dataset.ownerKind,sp:el&&el.dataset.ownerSponsor,sp2:el2&&el2.dataset.ownerSponsor,bk2:el2&&el2.dataset.ownerBackup,
  loose:loose&&{n:loose.name,s:loose.sponsor,b:loose.backup,ok:hum(loose.sponsor)&&hum(loose.backup)&&loose.sponsor!==loose.backup},stepChip:/data-owner-kind="robot"/.test(chipHtml)&&/data-owner-sponsor="/.test(chipHtml)}});
ok(r.steps>0&&r.bad.length===0,r.steps+' robot steps resolve to '+r.robots+' robot records, each with a human sponsor and a different human backup'+(r.bad.length?' ('+r.bad.length+' bad: '+r.bad.slice(0,3).join('; ')+')':''));
ok(r.kind==='robot'&&!!r.sp,'ownerChip("'+r.named+'") with no options is a robot chip with sponsor '+r.sp);
ok(!!r.sp2&&!!r.bk2,'ownerChip(robot,{kind:"robot"}) carries sponsor and backup without the caller passing them');
ok(r.loose&&r.loose.ok,'a robot step outside the library still resolves: '+JSON.stringify(r.loose));
ok(r.stepChip,'STEPKIT.ownerChip renders a robot step as a robot chip with its sponsor');
/* the popover shows sponsor and backup */
await p.evaluate(n=>{go('home');const d=document.createElement('div');d.id='cl78';d.innerHTML=ownerChip(n);document.body.appendChild(d) /* outside #view so a settling re-render cannot remove it */},r.named);
await p.click('#cl78 [data-owner]');await p.waitForTimeout(150);
const pop=await p.evaluate(()=>{const x=document.querySelector('.own-pop');return x?x.innerText:''});
ok(/Human sponsor/.test(pop)&&/Backup/.test(pop)&&!/No sponsor/.test(pop),'the robot card shows the human sponsor and backup');
ok(errs.length===0,'no page errors');if(errs.length)console.log(errs.slice(0,5));
console.log(fail?'ROBOTS FAIL ('+fail+')':'ROBOTS PASS');await b.close();process.exit(fail?1:0)})();

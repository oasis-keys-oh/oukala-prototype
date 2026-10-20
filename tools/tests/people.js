// People and chat addressing test (CL-53 owner chip, CL-54 chat addresses, PH-10 chat close control, PH-05 COO persona).
// Usage: node tools/tests/people.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const fails=[];const errs=[];
async function page(w,scheme){const p=await (await b.newContext({viewport:{width:w,height:900},colorScheme:scheme})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);return p}

// 1. owner chip, popover actions, addresses, visibility, persona switcher (desktop, light)
const p=await page(1440,'light');
const r=await p.evaluate(async()=>{const f=[];const ok=(c,m)=>{if(!c)f.push(m)};const W=ms=>new Promise(r=>setTimeout(r,ms));
 const box=document.createElement('div');box.id='pplTest';document.body.appendChild(box);
 box.innerHTML=ownerChip('Maya Ortiz',{record:'project:PR1',role:'Owner'})+ownerChip('Platform team')+ownerChip('Invoice Advisor')+pchip('Sam Patel')
  +'<span id="pa">'+ownerChip.pair('Sam Patel','')+'</span><span id="pb">'+ownerChip.pair('Sam Patel','Sam Patel')+'</span><span id="pc">'+ownerChip.pair('Sam Patel','Jordan Lee')+'</span>';
 const chips=box.querySelectorAll('[data-owner]');const chip=chips[0];
 ok(chip.dataset.owner==='Maya Ortiz'&&chip.dataset.ownerRec==='project:PR1'&&chip.dataset.ownerRole==='Owner','ownerChip keeps data-owner, data-owner-rec, data-owner-role');
 ok(chip.dataset.ownerAddr==='person:Maya Ortiz','person chip carries a CHATADDR person address');
 ok(chips[1].dataset.ownerKind==='team'&&chips[1].dataset.ownerAddr==='team:plat','team chip resolves to team:plat');
 ok(chips[2].dataset.ownerKind==='agent','agent chip kind');
 // the three actions
 chip.click();await W(150);let pop=document.querySelector('.own-pop');ok(pop&&pop.matches(':popover-open'),'popover opens on click');
 const labels=pop?[...pop.querySelectorAll('.own-acts [data-own-act]')].map(b=>b.textContent.trim()):[];
 ok(['Person 360','Message','Open chat on this record'].every(x=>labels.includes(x)),'popover has Person 360, Message, Open chat on this record: '+labels.join(', '));
 const x=pop&&pop.querySelector('.own-x');if(x){const pr=pop.getBoundingClientRect(),xr=x.getBoundingClientRect();ok(pr.right-xr.right<24&&xr.top-pr.top<24&&getComputedStyle(x).position==='static','popover close control top right, in flow')}
 ok(!/—/.test(pop?pop.textContent:''),'no em dash in popover');
 // Message keeps the record on the person thread
 pop.querySelector('[data-own-act=msg]').click();await W(200);let t=CHATX.cur();
 ok(t.addr==='person:Maya Ortiz','Message opens the person thread');ok(t.ctx.rec&&t.ctx.rec.type==='project'&&t.ctx.rec.id==='PR1','record context kept on the thread');
 const id1=t.id;CHATADDR.open('person:Maya Ortiz');ok(CHATX.cur().id===id1,'one thread per address: reopen');
 CHATX.handle('Can you review the plan?');await W(50);t=CHATX.cur();const last=t.msgs[t.msgs.length-1];ok(last&&/Simulated/.test(last.t),'person message is labeled simulated');
 // Open chat on this record
 chip.click();await W(150);document.querySelector('.own-pop [data-own-act=rec]').click();await W(150);ok(CHATX.cur().addr==='record:project:PR1','Open chat on this record opens the record thread');
 // Person 360
 chip.click();await W(150);document.querySelector('.own-pop [data-own-act=p360]').click();await W(250);
 ok(/Maya Ortiz/.test((document.querySelector('#drawer h2')||{}).textContent||''),'Person 360 opens from the popover');
 ok(!document.querySelector('.own-pop'),'popover closes after an action');try{closeDrawer()}catch(e){}await W(100);
 // plain person chip keeps its old click
 box.querySelector('.pchipx[data-person="Sam Patel"]:not([data-owner])').click();await W(250);
 ok(/Sam Patel/.test((document.querySelector('#drawer h2')||{}).textContent||'')&&!document.querySelector('.own-pop'),'plain [data-person] chip still opens Person 360');try{closeDrawer()}catch(e){}await W(100);
 // team page with Message group
 chips[1].click();await W(250);const mg=document.querySelector('#drawer [data-own-msg="team:plat"]');ok(mg&&/Message group/.test(mg.textContent),'team chip opens its page with Message group');
 if(mg){mg.click();await W(200);ok(CHATX.cur().addr==='team:plat','Message group opens the team thread')}
 // agent card with the human sponsor
 chips[2].click();await W(150);pop=document.querySelector('.own-pop');const txt=pop?pop.textContent:'';
 ok(/Human sponsor/.test(txt)&&pop.querySelector('.own-kv [data-owner]'),'agent card shows the human sponsor');if(pop)pop.querySelector('.own-x').click();await W(50);
 // No backup badge
 ok(document.querySelector('#pa .own-nob')&&document.querySelector('#pb .own-nob')&&!document.querySelector('#pc .own-nob'),'No backup badge when missing or equal to owner only');
 // every address type
 const types={'function:it-service':'IT service function','process:inv':'Process','agent:Invoice Advisor':'Invoice Advisor','record:incident:INC0412':'incident INC0412'};
 Object.keys(types).forEach(a=>{const th=CHATADDR.open(a);ok(th&&th.addr===a&&th.title.indexOf(types[a])>=0,'address '+a+' opens a thread titled '+(th&&th.title))});
 ok(CHATADDR.open('nonsense')===null,'invalid address refused');
 // visibility follows the record (simulated PERM check)
 const can=PERM.can;PERM.can=(u,a,res,rec)=>res==='secret_rec'?{ok:false,why:'Restricted test record'}:can(u,a,res,rec);
 const before=CHATX.cur().id;const blocked=CHATADDR.open('record:secret_rec:S1');ok(blocked===null&&CHATX.cur().id===before,'record thread blocked when the record is not readable');
 const th=CHATX.findAddress('person:Maya Ortiz');th.ctx.rec={type:'secret_rec',id:'S1'};ok(!CHATX.canSee(th)&&CHATX.access(th).simulated,'thread hidden when its record is not readable (simulated check)');
 CHATX.drawThreads();ok(!document.querySelector('#chxThreads [data-cx-th="open:'+th.id+'"]'),'hidden thread not listed');
 th.ctx.rec={type:'project',id:'PR1'};PERM.can=can;
 return f});
fails.push(...r);await p.context().close();

if(errs.length)fails.push('page errors: '+errs.slice(0,3).join(' | '));
console.log('people and chat addressing',fails.length?'FAIL\n  '+fails.join('\n  '):'ok');await b.close();process.exit(fails.length?1:0)})();

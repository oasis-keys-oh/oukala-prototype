const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file:///home/claude/oukala/build_out/full.html',{waitUntil:'load'});await p.waitForTimeout(8000);
await p.click('#stuPill');await p.waitForTimeout(800);
await p.evaluate(()=>{STUDIO.spd=.12;STUDIO.start('ret')});
let lastI=-9,stuck=0;const stops=[];
for(let k=0;k<400;k++){await p.waitForTimeout(350);
 const s=await p.evaluate(()=>({i:STUDIO.i,n:STUDIO.beats.length,pub:!!STUDIO.published,wait:STUDIO.wait,pulse:[...document.querySelectorAll('.stu-pulse')].map(e=>e.tagName+(e.dataset&&Object.keys(e.dataset)[0]||'')+':'+e.innerText.slice(0,18))}));
 if(s.pub){console.log('published at beat',s.i);break}
 if(s.i===lastI)stuck++;else{stuck=0;lastI=s.i}
 if(stuck===6){stops.push(s.i+' '+JSON.stringify(s.pulse));
  // act like a person
  await p.evaluate(()=>{const v=STUDIO.beats[STUDIO.i].view;const q=s=>document.querySelector(s);
   const click=e=>e&&e.click();
   if(v==='agents')click(q('#stuCanvas [data-r26-agents]'));
   if(v==='perm')click(q('#stuCanvas [data-r26-comp]'));
   if(v==='test'){const e=q('#stuCanvas [data-r26-run]');if(e&&!e.disabled)click(e)}
   if(v==='ux'){const e=q('#stuCanvas [data-r26-run]');if(e&&!e.disabled)click(e)}
   if(v==='approve'){click(q('#stuCanvas [data-stu-agree]'))}
  });await p.waitForTimeout(400);
  for(let j=0;j<4;j++){const done=await p.evaluate(()=>{const q=s=>document.querySelector(s);for(const s of ['#stuCanvas [data-r26-fixall]','#stuCanvas [data-r26-fixux]','#stuCanvas [data-r26-submit]','#stuCanvas [data-stu-pub]']){const e=q(s);if(e&&!e.disabled){e.click();return s}}return null});if(!done)break;await p.waitForTimeout(1200)}
  await p.evaluate(()=>{const c=document.querySelector('#sugs .chip');if(c)c.click()});stuck=0}}
console.log('stops',stops.join('\n'));console.log('errors',JSON.stringify(errs));await b.close()})()

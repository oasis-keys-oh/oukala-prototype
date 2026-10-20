const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:1000}})).newPage();const e=[];p.on('pageerror',x=>e.push('PE '+x.message));p.on('console',m=>m.type()==='error'&&e.push(m.text()));
const D='out_ppm/shots/';await p.goto('file://'+process.cwd()+'/out_ppm/full.html');await p.waitForTimeout(400);
await p.evaluate(()=>{go('port');S.v.port=3;render()});await p.waitForTimeout(300);await p.screenshot({path:D+'c0.png'});
await p.click('[data-ppm-sample]');await p.waitForTimeout(3600);await p.evaluate(()=>window.scrollTo(0,330));await p.screenshot({path:D+'c1.png'});
await p.click('.ppm-f');await p.waitForTimeout(400);await p.screenshot({path:D+'c2.png'});
await p.click('[data-ppm-create]');await p.waitForTimeout(500);await p.screenshot({path:D+'c3.png'});
await p.evaluate(()=>document.querySelector('[data-fsubmit="ppm_ctcreate"]').click());await p.waitForTimeout(500);
console.log('proj',await p.evaluate(()=>PROJ.map(x=>x.id+':'+x.owner).join(',')+' tasks '+TASKS.length));
await p.waitForTimeout(300);await p.evaluate(()=>{go('ppm_proj')});await p.waitForTimeout(400);await p.screenshot({path:D+'t1.png'});
await p.evaluate(()=>{S.v.ppmv=1;render()});await p.waitForTimeout(300);await p.screenshot({path:D+'t2.png'});
await p.evaluate(()=>{S.ppm.sel='all';S.v.ppmv=2;render()});await p.waitForTimeout(300);await p.screenshot({path:D+'t3.png',fullPage:false});
// drag person to PM slot
const pool=await p.$$('.ppm-plist .ppm-p');const slot=await p.$('[data-dnd="pm:PR2"]');await pool[3].scrollIntoViewIfNeeded();const a=await pool[3].boundingBox(),z=await slot.boundingBox();console.log('bb',!!a,!!z,pool.length);
await p.mouse.move(a.x+20,a.y+10);await p.mouse.down();await p.mouse.move(a.x+60,a.y-10,{steps:4});await p.mouse.move(z.x+30,z.y+20,{steps:14});await p.mouse.up();await p.waitForTimeout(500);
console.log('PR2 pm',await p.evaluate(()=>PROJ.find(x=>x.id==='PR2').owner));
await p.evaluate(()=>{go('ppm_raid')});await p.waitForTimeout(400);await p.screenshot({path:D+'r1.png'});
await p.evaluate(()=>{S.v.raid=2;render()});await p.waitForTimeout(300);await p.screenshot({path:D+'r2.png'});
await p.evaluate(()=>{S.v.raid=1;render()});await p.waitForTimeout(300);await p.screenshot({path:D+'r3.png'});
// fund flow
await p.evaluate(()=>{go('port');S.v.port=0;render();demandDrawer('D1')});await p.waitForTimeout(400);
await p.evaluate(()=>{const b=document.querySelector('[data-dapp="D1:Approved"]');b&&b.click()});await p.waitForTimeout(500);await p.screenshot({path:D+'f1.png'});
await p.evaluate(()=>document.querySelector('[data-fsubmit="ppm_fund"]').click());await p.waitForTimeout(700);
console.log('after fund',await p.evaluate(()=>PROJ.map(x=>x.id).join(',')+' screen '+S.screen+' conv '+JSON.stringify(S.conv)));
console.log(e);await b.close()})()

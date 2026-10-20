const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:1000}})).newPage();const e=[];p.on('pageerror',x=>e.push('PE '+x.message));p.on('console',m=>m.type()==='error'&&e.push(m.text()));
const D='out_ppm/shots/';await p.goto('file://'+process.cwd()+'/out_ppm/full.html');await p.waitForTimeout(400);
await p.evaluate(()=>go('port'));await p.waitForTimeout(400);
// hover score
await p.evaluate(()=>window.scrollTo(0,520));await p.waitForTimeout(200);
const sc=await p.$$('.drow.vd .sc');await sc[1].hover();await p.waitForTimeout(250);await p.screenshot({path:D+'p1.png'});
// drag row 5 to position 1
const rows=await p.$$('.drow.vd');const bb1=await rows[4].boundingBox(),bb0=await rows[0].boundingBox();
await p.mouse.move(bb1.x+60,bb1.y+20);await p.mouse.down();await p.mouse.move(bb1.x+60,bb1.y-30,{steps:5});await p.mouse.move(bb0.x+60,bb0.y+4,{steps:12});await p.mouse.up();await p.waitForTimeout(500);await p.screenshot({path:D+'p2.png'});
console.log('form open:',await p.evaluate(()=>!!document.querySelector('[data-form="ppm_reorder"]')));
await p.evaluate(()=>{document.querySelector('[data-fchip^="ppm_reorder:reason:"]').click()});await p.waitForTimeout(100);
await p.evaluate(()=>document.querySelector('[data-fsubmit="ppm_reorder"]').click());await p.waitForTimeout(500);
console.log('order manual:',await p.evaluate(()=>!!S.order&&Object.keys(S.ovr).length));await p.evaluate(()=>window.scrollTo(0,480));await p.screenshot({path:D+'p3.png'});
// intake
await p.evaluate(()=>{S.v.port=2;render()});await p.waitForTimeout(200);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:D+'p4.png'});
await p.evaluate(()=>document.querySelector('[data-ppm-mail]').click());await p.waitForTimeout(500);await p.screenshot({path:D+'p5.png'});
console.log(e);await b.close()})()

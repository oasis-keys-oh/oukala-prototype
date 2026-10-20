const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const dark=process.argv.includes('--dark');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
const sh=async n=>{await p.waitForTimeout(400);await p.screenshot({path:'b12_shots/'+n+(dark?'_d':'')+'.png'})};
await p.evaluate(()=>{S.v.budv=0;go('bud_over')});await sh('s1_over');
await p.click('#view .stat[data-bd="m:fcst"]');await sh('s2_m_fcst');
// click line in drawer
await p.click('#drawer [data-bd="line:PR1-CLD"]');await sh('s3_line');
await p.click('#drawer [data-bd="line:PR1-CLD:act"]').catch(()=>{});await sh('s3b_line_act');
const tx=await p.$('#drawer [data-bd^="txn:"]');if(tx){await tx.click();await sh('s4_txn')}
await p.click('#drawer [data-bd-back]');await sh('s5_back');
console.log(await p.evaluate(()=>document.querySelector('#drawer .bd-crumb').innerText));
await p.keyboard.press('Escape');await p.waitForTimeout(300);
await p.evaluate(()=>{S.v.budv=1;go('bud_over')});await sh('s6_proj');
await p.evaluate(()=>{S.v.budv=2;go('bud_over')});await p.click('#view [data-bd="cat:Cloud"]');await sh('s7_cat');
await p.evaluate(()=>{S.v.budv=4;go('bud_over')});await sh('s8_res');
await p.click('#view [data-bd="led:RL-04"]');await sh('s9_led');
console.log(errs);await b.close()})();

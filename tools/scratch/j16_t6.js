const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push(m.text()));await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:240000});await p.waitForTimeout(1500);
await p.evaluate(()=>{go('obs_dash')});await p.waitForTimeout(500);await p.evaluate(()=>DASHX.startEdit());await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('[data-dl="add"]').click());await p.waitForTimeout(700);
console.log('lib rows',await p.evaluate(()=>document.querySelectorAll('.dl-lib .pk2-row,.dl-lib [role=option]').length));
await p.screenshot({path:dir+'/j_e2.png'});
await p.keyboard.type('viz');await p.waitForTimeout(300);
console.log('lib filtered',await p.evaluate(()=>[...document.querySelectorAll('.dl-lib [role=option]')].slice(0,3).map(x=>x.textContent.trim().slice(0,40))));
await p.evaluate(()=>{const o=document.querySelector('.dl-lib [role=option]');o&&o.click()});await p.waitForTimeout(600);

await p.evaluate(()=>go('adm_studio'));await p.waitForTimeout(500);
await p.click('label:has-text("Tables and forms")');await p.waitForTimeout(900);
await p.screenshot({path:dir+'/j_a1.png',fullPage:false});
await p.evaluate(()=>window.scrollTo(0,0));
console.log(errs);await b.close()})();
function D_(){return null}

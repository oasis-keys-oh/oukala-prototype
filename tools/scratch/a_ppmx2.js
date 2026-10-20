const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>go('ppm_wbs'));await p.waitForTimeout(500);
const h0=await p.evaluate(()=>document.querySelector('#view').innerText.match(/\d+ lines across[^.]*/)[0]);
await p.evaluate(()=>{PPMX.addTasks('PR3',[{n:'AUDITTASK_ONE',dur:2,own:'Sam Patel'}]);go('ppm_wbs')});await p.waitForTimeout(500);
const h1=await p.evaluate(()=>document.querySelector('#view').innerText.match(/\d+ lines across[^.]*/)[0]);
console.log(h0,'|',h1);
console.log(await p.evaluate(()=>{const t=PPMX.tasksOf('PR3');return JSON.stringify(t.slice(-2).map(x=>({id:x.id,n:x.n,wbs:x.wbs,lv:x.lv,p:x.p})))}));
// search for it in wbs sheet
await p.evaluate(()=>{const i=[...document.querySelectorAll('#view input[type=search],#view input.fin')].find(e=>e.checkVisibility());i.value='AUDITTASK';i.dispatchEvent(new Event('input',{bubbles:true}))});await p.waitForTimeout(500);
console.log(await p.evaluate(()=>document.querySelector('#view').innerText.includes('AUDITTASK_ONE')));
await p.screenshot({path:'aud/wbs_add.png'});
console.log(errs);await b.close()})();

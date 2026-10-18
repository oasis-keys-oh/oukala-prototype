const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push('console: '+m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:180000});await p.waitForTimeout(800);
console.log('--- personas');
const keys=await p.evaluate(()=>Object.keys(PERSONAS));
for(const k of []){const r=await p.evaluate(k=>{NAVX.persona.set(k);const v=document.getElementById('view');const nav=document.getElementById('nav');return {k,home:v.innerText.length,h1:(v.querySelector('h1')||{}).textContent,groups:[...nav.querySelectorAll(':scope > details.navgd')].length,more:!!nav.querySelector('.r15d-more'),pins:nav.querySelectorAll('.r15d-pin').length,who:document.querySelector('.whoami b').textContent,btn:document.querySelector('#r15dVasBtn b').textContent}},k);console.log(JSON.stringify(r))}
await p.evaluate(()=>NAVX.persona.set('exec'));
console.log('--- ask');
const qs=['How many agents are working?','Who can approve a $120,000 invoice?','I am new, what should I do on my first day?','Who owns the Schedule performance index?','Status of INV-20433','Status of Invoice Advisor','What is the schedule performance index?','How do I fail over the portal?','Who owns the Invoice approval process?','zzqx blorp wibble','Verify the audit chain'];
for(const q of qs){await p.evaluate(q=>{CHATX.handle(q)},q);await p.waitForTimeout(2500);const t=await p.evaluate(()=>{const m=[...document.querySelectorAll('#chatDock .cx-m.ai:not(.think)')];const last=m[m.length-1];return last?last.innerText.replace(/\s+/g,' ').slice(0,420):'NOMSG'});console.log('Q:',q,'\n  A:',t)}
console.log('errors',errs.length,errs.slice(0,8));await b.close()})();

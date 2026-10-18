const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
// usage: node b15/suite.js OUTDIR [--dark] [--phone]
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const dark=a.includes('--dark'),phone=a.includes('--phone');const tag=(dark?'dark':'light')+(phone?'-phone':'');
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource/.test(m.text())&&errs.push('console: '+m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:240000});await p.waitForTimeout(3500);
await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),dark?'dark':'light');
const shot=async(n)=>{const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);await p.screenshot({path:path.join(dir,'shots','s15-'+n+'-'+tag+'.png')});console.log(n,tag,'overflowX',ox)};
const sleep=ms=>p.waitForTimeout(ms);const ev=(f,x)=>p.evaluate(f,x).catch(e=>errs.push('eval '+e.message));
await ev(()=>go('bud_over'));await sleep(600);await shot('home');
await ev(()=>{const e=[...document.querySelectorAll('h3')].find(h=>/differs from the approved/.test(h.textContent));e.scrollIntoView({block:'start'});window.scrollBy(0,-100)});await sleep(300);await shot('variance');
await ev(()=>go('bud_lines'));await sleep(600);await shot('lines');
await ev(()=>{document.querySelector('[data-bl-scale]').click()});await sleep(1200);
await ev(()=>{const g=document.querySelector('[data-bl-group]');g.value='cc';g.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('.bl-bar').scrollIntoView({block:'start'});window.scrollBy(0,-90)});await sleep(500);await shot('lines-ent-grouped');
console.log('ent rows',await p.evaluate(()=>BUDLINES.rows().length),'tbody trs',await p.evaluate(()=>document.querySelectorAll('.bl-t tbody tr').length));
await ev(()=>{const s=document.querySelector('[data-bl-scale]');if(s.checked)s.click()});await sleep(500);
await ev(()=>go('bud_over'));await sleep(500);await ev(()=>document.querySelector('[data-bud-req-new]').click());await sleep(900);await shot('form');
await ev(()=>document.querySelector('#drawer .pk-btn').click());await sleep(300);await shot('form-pick');
await ev(()=>{const i=document.querySelector('#drawer .pk-q');i.value='pri';i.dispatchEvent(new Event('input',{bubbles:true}))});await sleep(300);await shot('form-pick-filtered');
await ev(()=>{try{document.querySelector('#drawer').hidePopover()}catch(e){}});
for(const [i,n] of [[0,'map'],[1,'gaps'],[2,'rollup'],[3,'proc']]){await ev(()=>go('bud_ccmap'));await sleep(500);await ev(k=>{document.querySelector('#v-ccm-'+k).click()},i);await sleep(400);await ev(()=>{const e=document.querySelector('.views');e.scrollIntoView({block:'start'});window.scrollBy(0,-90)});await sleep(200);await shot('cc-'+n)}
await ev(()=>{go('bud_ccmap')});await sleep(400);await ev(()=>CCMAP.edit('CC-4460'));await sleep(800);await shot('cc-edit');
await ev(()=>{try{document.querySelector('#drawer').hidePopover()}catch(e){}});
await ev(()=>go('svc_cat'));await sleep(500);
console.log('errors:',errs.length?errs:'none');await b.close()})();

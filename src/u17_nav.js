const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
for(const label of process.argv[3].split(',')){
 await p.evaluate(()=>go('home'));await p.waitForTimeout(400);
 const els=await p.evaluate(l=>[...document.querySelectorAll('a,button,[role=button],[data-nav],[data-go]')].filter(e=>(e.innerText||'').trim().split('\n')[0].trim()===l).map(e=>({tag:e.tagName,cls:e.className,nav:e.dataset.nav||e.dataset.go||'',vis:!!e.offsetWidth,inNav:!!e.closest('#nav')})),label);
 console.log(label,JSON.stringify(els));
 const loc=p.locator('#nav').getByText(label,{exact:true}).first();
 const s0=await p.evaluate(()=>S.screen);
 try{await loc.click({timeout:3000});}catch(e){console.log('click fail',e.message.slice(0,80))}
 await p.waitForTimeout(500);console.log(label,'->',s0,'=>',await p.evaluate(()=>S.screen));
}
await b.close()})();

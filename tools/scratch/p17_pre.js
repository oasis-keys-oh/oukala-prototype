const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const ids=process.argv[3].split(',');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load'});await p.waitForTimeout(500);
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(350);await p.screenshot({path:'r17_shots/pre_'+id+'.png'});
 const info=await p.evaluate(()=>[...document.querySelectorAll('#view .card')].slice(0,12).map(c=>{const h=c.querySelector('h2,h3,.ct,.card-t,header');return (h?h.textContent.trim():'?').slice(0,50)}));console.log(id,JSON.stringify(info));}
await b.close()})();

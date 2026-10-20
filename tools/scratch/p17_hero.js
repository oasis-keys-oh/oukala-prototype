const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const ids=process.argv[3].split(',');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load'});await p.waitForTimeout(500);
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(250);
 const info=await p.evaluate(()=>{const h=document.querySelector('#view .hero');const t=h?h.innerText.replace(/\s+/g,' ').slice(0,330):'NOHERO';const tabs=[...document.querySelectorAll('#view [data-views] [role=tab], #view .vtabs label, #view .tabs label')].slice(0,12).map(x=>x.textContent.trim());return {t,tabs,cards:[...document.querySelectorAll('#view .card')].length}});console.log('##',id,JSON.stringify(info));}
await b.close()})();

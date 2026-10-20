const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_itsm/full.html'));await p.waitForTimeout(500);
await p.evaluate(()=>go('itsm_chg'));await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const d=[...document.querySelectorAll('.itsm-day')].find(x=>x.dataset.dnd==='day:2026-10-06');const cs=getComputedStyle(d);return {w:d.getBoundingClientRect().width,html:d.outerHTML.slice(0,600),disp:cs.display,pos:cs.position,cls:d.className}});
console.log(JSON.stringify(r,null,1));await b.close()})();

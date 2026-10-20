const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
const r=await p.evaluate(()=>SCREENS.map(x=>x[0]+':'+x[3]).join(' '));
console.log(r);
const t=await p.evaluate(()=>{go('itom_cmdb');return [...document.querySelectorAll('[role=tab],.tab,.tabs button,.tabs>*')].slice(0,20).map(e=>e.className+'|'+e.textContent.trim().slice(0,25))});console.log(t);
await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve('out_f3_15/full.html'),{timeout:240000,waitUntil:'domcontentloaded'});await p.waitForTimeout(4000);
await p.evaluate(()=>go("r15_mobile"));await p.waitForTimeout(600);
console.log(await p.evaluate(()=>{const o=[];document.querySelectorAll('body *').forEach(e=>{const s=getComputedStyle(e);if((s.position==='fixed'||s.position==='sticky')&&e.offsetHeight>0&&!e.closest('.r3m'))o.push(e.tagName+'#'+e.id+'.'+String(e.className).slice(0,50)+' '+Math.round(e.getBoundingClientRect().top)+' '+e.offsetHeight)});const c=document.querySelector('#view').previousElementSibling;return o.join('\n')+'\nCRUMB:'+[...document.querySelectorAll('.crumbs,.crumb,.pagehead,[class*=crumb]')].map(e=>e.tagName+'.'+e.className).join('|')}));
await b.close()})();

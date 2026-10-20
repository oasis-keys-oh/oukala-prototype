const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('out_atlas','full.html'));await p.waitForTimeout(600);await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const v=document.querySelector('[data-at-vp]');return JSON.stringify({cam:S.atlas.cam,auto:S.atlas.auto,w:v.clientWidth,h:v.clientHeight})}));await b.close()})();

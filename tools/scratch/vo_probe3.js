const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
const r=await p.evaluate(()=>{go('plat_data');const v=document.querySelector('#view .vsw');return v.outerHTML.slice(0,900)+' || css input: '+JSON.stringify([...document.querySelectorAll('.vsw input')].map(i=>{const cs=getComputedStyle(i);return [cs.position,cs.opacity,cs.width,cs.clip]}).slice(0,1))});console.log(r);
await b.close()})();

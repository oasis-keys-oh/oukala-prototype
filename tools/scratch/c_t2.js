const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>SCALE.set(true));
for(let i=0;i<3;i++)console.log(await p.evaluate(async()=>{const t=performance.now();go('home');const a=performance.now()-t;const t2=performance.now();render();return [Math.round(a),Math.round(performance.now()-t2)]}));
await p.evaluate(()=>{SCALE.set(false);go('kg')});await p.waitForTimeout(500);
console.log(await p.evaluate(()=>[...document.querySelectorAll('#view *')].filter(e=>e.getBoundingClientRect().right>1445).slice(0,6).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right))));
await b.close()})();

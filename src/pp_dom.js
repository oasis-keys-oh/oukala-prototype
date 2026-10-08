const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{SCALE.set(true);go('home')});await p.waitForTimeout(300);
console.log(await p.evaluate(()=>{S.pp2.tab.ppl_org=1;let t=performance.now();go('ppl_org');const a=performance.now()-t;t=performance.now();document.body.offsetHeight;const l=performance.now()-t;return {go:a,layoutAfter:l,nodes:document.querySelectorAll('#view *').length,cards:document.querySelectorAll('.pp2-node').length}}));await b.close()})();

const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>Object.keys(METRICS).length));
// stray KPI tiles first tab: .stat elements without fchip inside and without a fchip in the same statrow neighbors -> count tile text numbers
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));let tot=0,wf=0;const worst=[];
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(50);
 const r=await p.evaluate(()=>{const t=[...document.querySelectorAll('#view .stat')].filter(e=>e.checkVisibility());return {n:t.length,f:t.filter(e=>e.querySelector('.fchip')).length}});tot+=r.n;wf+=r.f;if(r.n>3&&r.f===0)worst.push(id+':'+r.n)}
console.log('visible stat tiles',tot,'with fchip',wf,'screens with >3 tiles and none linked:',worst.length,worst.join(' '));
await b.close()})();

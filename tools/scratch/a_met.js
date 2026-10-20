const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const ks=Object.keys(METRICS);const m=METRICS[ks[0]];const miss={};ks.forEach(k=>Object.keys(m).forEach(f=>{if(METRICS[k][f]==null||METRICS[k][f]==='')(miss[f]=miss[f]||[]).push(k)}));return JSON.stringify({fields:Object.keys(m),sample:m,miss})}));
// fchip usage by screen across all tabs: count distinct fchips and metrics referenced
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const zero=[];
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(60);const n=await p.evaluate(()=>document.querySelectorAll('#view .fchip').length);if(n===0)zero.push(id)}
console.log('screens with zero fchips anywhere:',zero.join(','));
await b.close()})();

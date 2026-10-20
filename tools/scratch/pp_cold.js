const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{SCALE.set(true);go('home')});await p.waitForTimeout(300);
for(const [s,t] of [['ppl_org',1],['ppl_cap',0],['ppl_cap',1],['ppl_perf',0],['ppl_perf',1],['ppl_org',0],['ppl_org',3]]){console.log(s,t,await p.evaluate(([s,t])=>{S.pp2.tab[s]=t;const a=performance.now();go(s);return Math.round(performance.now()-a)},[s,t]))}
await p.screenshot({path:'out_fix_people/shots/cold.png'});await b.close()})();

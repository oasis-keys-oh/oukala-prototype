const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
await p.goto('file://'+process.cwd()+'/out_a/full.html');await p.waitForTimeout(900);const agg={};
for(const id of await p.evaluate(()=>SCREENS.map(s=>s[0]))){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(60);
 const r=await p.evaluate(()=>[...document.querySelectorAll('#view .fkpi')].filter(e=>e.checkVisibility()).map(e=>{const pr=e.parentElement;const w=pr.getBoundingClientRect().width;const ov=e.getBoundingClientRect().right>pr.getBoundingClientRect().right+2;return (pr.className||pr.tagName)+'|'+(pr.parentElement.className||'')+(ov?' OVERFLOW':'')}));
 r.forEach(v=>{agg[v]=(agg[v]||0)+1;})}
Object.entries(agg).sort((x,y)=>y[1]-x[1]).forEach(([k,n])=>console.log(n,k));await b.close()})();

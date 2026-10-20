const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
await p.goto('file://'+process.cwd()+'/out_a/full.html');await p.waitForTimeout(900);const agg={};
for(const id of await p.evaluate(()=>SCREENS.map(s=>s[0]))){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(60);
 const r=await p.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>e.checkVisibility()).map(e=>{const c=getComputedStyle(e);return c.fontSize+'|'+e.tagName+'.'+e.className+'|'+(e.closest('table')?.className||'')}).filter(x=>/^(13\.5|13|12)px\|TD|^12\.5px\|BUTTON|^14px/.test(x)),'#view td,#view .chip,#view .tile *');
 r.forEach(v=>{agg[v]=(agg[v]||0)+1})}
Object.entries(agg).sort((x,y)=>y[1]-x[1]).slice(0,25).forEach(([k,n])=>console.log(n,k));await b.close()})();

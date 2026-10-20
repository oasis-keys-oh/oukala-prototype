const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const agg={};
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const o=[];document.querySelectorAll('#view *').forEach(e=>{const cs=getComputedStyle(e);const ox=cs.overflowX,oy=cs.overflowY;if(/auto|scroll/.test(ox+oy)){o.push((e.tagName.toLowerCase()+'.'+(typeof e.className==='string'?e.className.trim().split(/\s+/).join('.'):'')).slice(0,80)+' '+ox[0]+oy[0])}});return o});
 r.forEach(k=>{agg[k]=(agg[k]||0)+1})}
Object.entries(agg).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(v,k));await b.close()})();

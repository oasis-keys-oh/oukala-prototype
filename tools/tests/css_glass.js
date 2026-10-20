// CL-30 measure only (prototype fact): frame time with and without backdrop-filter on the screens with the most glass.
// Usage: node tools/tests/css_glass.js <build dir> [screen ids, comma separated]
// For each screen: counts elements whose computed backdrop-filter is not none, then scrolls the page down and up for
// 240 animation frames and records the time between frames (median, p95, frames over 20 ms), first as built, then with
// backdrop-filter switched off by an injected style. Three rounds each, alternating. Headless Chromium, software
// compositing: real GPUs are faster, so read the ratio, not the absolute numbers.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=process.argv[2]||'build_out';let ids=process.argv[3]?process.argv[3].split(','):null;
 const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
 await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(900);
 const count=()=>p.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (s.backdropFilter&&s.backdropFilter!=='none')&&e.getClientRects().length}).length);
 if(!ids){const all=await p.evaluate(()=>SCREENS.map(s=>s[0]));const n=[];
  for(const id of all){await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(150);n.push([id,await count()])}
  n.sort((a,b)=>b[1]-a[1]);console.log('most glass:',n.slice(0,8).map(x=>x.join(' ')).join(', '));ids=n.slice(0,3).map(x=>x[0])}
 const run=()=>p.evaluate(()=>new Promise(res=>{const se=document.scrollingElement;const max=Math.max(1,se.scrollHeight-innerHeight);const t=[];let i=0;
  const f=ts=>{t.push(ts);se.scrollTop=max*(i<120?i/120:(240-i)/120);if(++i<=240)requestAnimationFrame(f);else{const d=t.slice(1).map((x,k)=>x-t[k]).sort((a,b)=>a-b);
   res({med:d[d.length>>1],p95:d[Math.floor(d.length*.95)],long:d.filter(x=>x>20).length,total:t[t.length-1]-t[0]})}};requestAnimationFrame(f)}));
 const OFF='*,*::before,*::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}';
 for(const id of ids){await p.evaluate(i=>{try{go(i)}catch(e){}},id);await p.waitForTimeout(600);const g=await count();const R={on:[],off:[]};
  for(let k=0;k<3;k++){R.on.push(await run());const h=await p.addStyleTag({content:OFF});await p.waitForTimeout(100);R.off.push(await run());await h.evaluate(e=>e.remove());await p.waitForTimeout(100)}
  const md=a=>a.map(x=>x.med).sort((x,y)=>x-y)[1],pp=a=>a.map(x=>x.p95).sort((x,y)=>x-y)[1],lg=a=>a.map(x=>x.long).sort((x,y)=>x-y)[1],tt=a=>a.map(x=>x.total).sort((x,y)=>x-y)[1];
  console.log(JSON.stringify({screen:id,glassElements:g,with:{medianMs:+md(R.on).toFixed(1),p95Ms:+pp(R.on).toFixed(1),framesOver20ms:lg(R.on),totalMs:Math.round(tt(R.on))},without:{medianMs:+md(R.off).toFixed(1),p95Ms:+pp(R.off).toFixed(1),framesOver20ms:lg(R.off),totalMs:Math.round(tt(R.off))}}))}
 await b.close()})();

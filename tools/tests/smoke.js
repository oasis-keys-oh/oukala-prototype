// CL-03 smoke test: open every registered screen; fail on thrown errors, blank views, or page-level horizontal scroll.
// Usage: node tools/tests/smoke.js <dir containing full.html> [--phone]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const phone=process.argv.includes('--phone');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));console.log(ids.length,'screens');let bad=0;
for(const id of ids){const n0=errs.length;await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(120);
 const r=await p.evaluate(()=>({ox:document.documentElement.scrollWidth>innerWidth+1,len:document.querySelector('#view').innerHTML.length}));
 if(r.len<400||errs.length>n0||(r.ox&&!phone)){bad++;console.log('!!',id,JSON.stringify(r),errs.slice(n0))}}
console.log('screens',ids.length,'flagged',bad,'total errors',errs.length);await b.close();process.exit(bad||errs.length?1:0)})();

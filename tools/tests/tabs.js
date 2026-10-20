// CL-03 tab test: every demo scenario x every Experience journeys tab. Fails on thrown errors or blank views.
// Usage: node tools/tests/tabs.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);
const scns=await p.evaluate(()=>Object.keys(SCN.list));let n=0,bad=0;console.log('scenarios',scns.join(','));
for(const k of scns){await p.evaluate(k=>SCN.set(k),k);await p.waitForTimeout(300);
 for(let t=0;t<9;t++){const n0=errs.length;
  await p.evaluate(t=>{S.pp2.tab.ppl_jrny=t;go('ppl_jrny')},t).catch(e=>errs.push(k+' tab '+t+': '+e.message));await p.waitForTimeout(150);
  const len=await p.evaluate(()=>document.querySelector('#view').innerHTML.length);n++;
  if(len<400||errs.length>n0){bad++;console.log('!!',k,'tab',t,'len',len,errs.slice(n0))}}}
console.log('combinations',n,'flagged',bad,'errors',errs.length);await b.close();process.exit(bad||errs.length?1:0)})();

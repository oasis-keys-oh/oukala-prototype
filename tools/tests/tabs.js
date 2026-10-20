// CL-03 tab test: every demo scenario x every Experience journeys tab (JX.TABS, ten since DC-24). Fails on thrown errors or blank views.
// Usage: node tools/tests/tabs.js <dir containing full.html | URL of a deployed site (JM-10)>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const arg=process.argv[2]||'build_out',remote=/^https?:\/\//.test(arg);const dir=remote?arg:path.resolve(arg);
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
if(!remote)await p.route(/^https?:/,r=>r.abort());
await p.goto(remote?dir:'file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(800);
if(remote)console.log('target',dir);
const scns=await p.evaluate(()=>Object.keys(SCN.list));let n=0,bad=0;console.log("scenarios",scns.join(","));
const NT=await p.evaluate(()=>window.JX&&JX.TABS?JX.TABS.length:9);console.log("tabs",NT);
for(const k of scns){await p.evaluate(k=>SCN.set(k),k);await p.waitForTimeout(300);
 for(let t=0;t<NT;t++){const n0=errs.length;
  await p.evaluate(t=>{S.pp2.tab.ppl_jrny=t;go('ppl_jrny')},t).catch(e=>errs.push(k+' tab '+t+': '+e.message));await p.waitForTimeout(150);
  const len=await p.evaluate(()=>document.querySelector('#view').innerHTML.length);n++;
  if(len<400||errs.length>n0){bad++;console.log('!!',k,'tab',t,'len',len,errs.slice(n0))}}}
console.log('combinations',n,'flagged',bad,'errors',errs.length);await b.close();process.exit(bad||errs.length?1:0)})();

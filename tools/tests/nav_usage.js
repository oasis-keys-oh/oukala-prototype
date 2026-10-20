// PR-16 usage test: screen opens are counted from real navigation only (seeded history adds nothing), kept in this browser
// across a reload, and shown on the Screen map (row and details drawer) and on the Usage tab of Navigation and search with the
// label "this browser only (prototype fact)".
// Usage: node tools/tests/nav_usage.js <dir containing full.html>
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];let bad=0;const fail=m=>{bad++;console.log('FAIL',m)};
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource|CORS policy|URL scheme "file" is not supported/.test(m.text())&&errs.push('console: '+m.text().slice(0,300)));
await p.route(/^https?:/,r=>r.abort());
const load=async()=>{await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.USAGE&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(500)};
await load();
await p.evaluate(()=>USAGE.reset());
const seq=['inv','itsm_inc','inv','ims','inv'];
for(const id of seq){await p.evaluate(id=>go(id),id);await p.waitForTimeout(60)}
let u=await p.evaluate(()=>({inv:USAGE.get('inv').n,inc:USAGE.get('itsm_inc').n,ims:USAGE.get('ims').n,seedN:NAVX.hist.list().filter(h=>h.seed).map(h=>h.n||0)}));
if(u.inv!==3||u.inc!==1||u.ims!==1)fail('counts after navigation '+JSON.stringify(u));
if(u.seedN.some(n=>n>0))fail('seeded history rows still carry visit counts '+JSON.stringify(u.seedN));
await p.evaluate(()=>{go('home');USAGE.flush&&USAGE.flush()});await p.waitForTimeout(600);
await load();
u=await p.evaluate(()=>USAGE.get('inv').n);if(u!==3)fail('count not kept across a reload: inv '+u);
await p.evaluate(()=>go('scr_map'));await p.waitForTimeout(400);
const row=await p.evaluate(()=>{const r=document.querySelector('#view [data-scm-row="inv"] .us-n');return r?{t:r.textContent,title:r.title}:null});
if(!row||row.t!=='3 opens'||!/this browser only \(prototype fact\)/.test(row.title))fail('Screen map row for inv: '+JSON.stringify(row));
await p.evaluate(()=>{const b=document.querySelector('#view [data-scm-open="inv"]');if(b)b.click()});await p.waitForTimeout(300);
const dd=await p.evaluate(()=>{const d=document.querySelector('#drawer [data-us-dd="inv"]');return d?d.textContent:null});
if(!dd||!/^3 opens/.test(dd)||!/this browser only \(prototype fact\)/.test(dd))fail('Screen map details drawer: '+dd);
await p.evaluate(()=>{closeDrawer();S.v.nav_v=4;go('nav_studio')});await p.waitForTimeout(300);
const pan=await p.evaluate(()=>{const t=document.querySelector('#view .us-panel');return t?t.textContent.replace(/\s+/g,' '):null});
if(!pan||!/this browser only \(prototype fact\)/.test(pan)||!/Approve invoices/.test(pan))fail('Usage panel: '+(pan||'missing').slice(0,200));
console.log('usage counts',JSON.stringify({inv:3,itsm_inc:1,ims:1}),'| row',row&&row.t,'| drawer',dd&&dd.slice(0,60),'| failures',bad,'| errors',errs.length?errs.slice(0,3):'none');
await b.close();process.exit(bad||errs.length?1:0)})();

// node c15_eval.js OUT "js (async ok; return value printed)" [--w 1440] [--dark] [--screen id]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]);const g=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:+g('--w',1440),height:+g('--h',900)},colorScheme:a.includes('--dark')?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());if(m.type()==='log'&&a.includes('--logs'))console.log('LOG',m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/'+g('--file','full.html')+(g('--hash','')),{waitUntil:'domcontentloaded'});await p.waitForTimeout(900);
if(a.includes('--screen')){await p.evaluate(i=>go(i),g('--screen'));await p.waitForTimeout(500)}
const r=await p.evaluate(`(async()=>{${a[1]}})()`);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));console.log('errs',errs.length,errs.slice(0,3));await b.close()})();

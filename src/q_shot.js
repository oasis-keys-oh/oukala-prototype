// node q_shot.js OUT screenId width [--dark] [--name x] [--eval js] [--full] [--wait ms]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),id=a[1],w=+a[2];const dark=a.includes('--dark');const nm=a.includes('--name')?a[a.indexOf('--name')+1]:id;
const ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:null;const full=a.includes('--full');const wait=a.includes('--wait')?+a[a.indexOf('--wait')+1]:600;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:w,height:w<600?850:1000},colorScheme:dark?'dark':'light',deviceScaleFactor:1});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:240000});
await p.waitForFunction(()=>window.PERM&&window.NAVX&&document.querySelector('#view'),null,{timeout:240000});await p.waitForTimeout(1200);
if(dark)await p.evaluate(()=>{try{document.documentElement.setAttribute('data-theme','dark')}catch(e){}});
await p.evaluate(i=>go(i),id);await p.waitForTimeout(wait);
if(ev){await p.evaluate(ev);await p.waitForTimeout(500)}
const ov=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,v:(document.querySelector('#view')||{}).scrollWidth}));
fs.mkdirSync('r17_shots',{recursive:true});const f='r17_shots/q_'+nm+'_'+w+(dark?'_dark':'')+'.png';
await p.screenshot({path:f,fullPage:full});console.log(f,JSON.stringify(ov),errs.slice(0,6));await b.close()})();

// node wshot.js OUT screen W [--dark] [--eval js]... [--full] [--h H] [--name n] [--scale]  (evals run in order, 700ms wait after each)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),id=a[1],w=+a[2];const dark=a.includes('--dark');const evs=[];a.forEach((x,i)=>{if(x==='--eval')evs.push(a[i+1])});const full=a.includes('--full');
const name=a.includes('--name')?a[a.indexOf('--name')+1]:id+'-'+w+(dark?'-dark':'');
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:w,height:a.includes('--h')?+a[a.indexOf('--h')+1]:1000},colorScheme:dark?'dark':'light',deviceScaleFactor:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push('console '+m.text()));
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(500);if(a.includes('--scale'))await p.evaluate(()=>SCALE.set(true));await p.evaluate(i=>go(i),id);await p.waitForTimeout(900);
for(const ev of evs){await p.evaluate(ev);await p.waitForTimeout(800)}
const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
const f=path.join(dir,'shots',name+'.png');await p.screenshot({path:f,fullPage:full});console.log(f,'errors:',errs,'overflowX:',ox);await b.close()})();

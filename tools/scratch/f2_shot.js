// node f2_shot.js OUT "screen1,screen2" WIDTH [--dark] [--eval js] [--full] [--h N] [--tag name]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),ids=a[1].split(','),w=+a[2],dark=a.includes('--dark'),full=a.includes('--full');
const ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:null,h=a.includes('--h')?+a[a.indexOf('--h')+1]:900,tag=a.includes('--tag')?a[a.indexOf('--tag')+1]:'';
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
for(const id of ids){const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|fonts/.test(m.text()))errs.push('C:'+m.text())});
await p.goto('file://'+path.join(dir,'full.html'),{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(1200);
if(dark)await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')});
await p.evaluate(i=>go(i),id);await p.waitForTimeout(700);if(ev){await p.evaluate(ev);await p.waitForTimeout(500)}
const f=path.join(dir,'shots',(tag||id)+'-'+w+(dark?'-dark':'')+'.png');await p.screenshot({path:f,fullPage:full});console.log(f,errs.slice(0,4));await p.close()}
await b.close()})();

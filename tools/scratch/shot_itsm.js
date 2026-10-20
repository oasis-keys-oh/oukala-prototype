// Usage: NODE_PATH=$(npm root -g) node shot.js OUTDIR screen1,screen2 [--phone] [--dark] [--full] [--eval "js run after render"]
// Loads OUTDIR/full.html, opens each screen with go(id), writes OUTDIR/shots/<id>[-phone][-dark].png, prints console errors and horizontal overflow.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),ids=(a[1]||'home').split(',');const phone=a.includes('--phone'),dark=a.includes('--dark'),full=a.includes('--full');const ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:null;
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(500);
for(const id of ids){await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(1100);
 if(ev){await p.evaluate(ev).catch(e=>errs.push('eval: '+e.message));await p.waitForTimeout(1100)}
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await p.screenshot({path:path.join(dir,'shots',id+(phone?'-phone':'')+(dark?'-dark':'')+'.png'),fullPage:full});console.log(id,'overflowX:',ox)}
console.log('errors:',errs.length?errs:'none');await b.close()})();

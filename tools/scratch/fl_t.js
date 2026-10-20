const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]),w=+a[1],h=+(a[2]||1000),out=a[3],pre=a[4]||'',ev=a[5]||'',dark=a.includes('--dark'),full=a.includes('--full');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.addStyleTag({content:'*{animation:none!important;transition:none!important}.orb{display:none!important}'});await p.waitForTimeout(500);if(pre){await p.evaluate(pre);await p.waitForTimeout(200)}
const t0=Date.now();if(ev){const r=await p.evaluate(ev);if(r!==undefined)console.log('RET',JSON.stringify(r).slice(0,1500))}await p.waitForTimeout(600);console.log('ms',Date.now()-t0);
if(out)await p.screenshot({path:dir+'/shots/'+out+'.png',fullPage:full});console.log(errs.slice(0,5));await b.close()})();

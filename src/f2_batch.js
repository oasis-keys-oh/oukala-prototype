// node f2_batch.js OUT WIDTH light|dark|both  "name=js;name=js..."  (js evaluated after load; name = screenshot name)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),w=+a[1],themes=a[2]==='both'?['light','dark']:[a[2]];const steps=a[3].split(';;').map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)]});const h=+(a[4]||900),full=a[5]==='full';
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const th of themes){const c=await b.newContext({viewport:{width:w,height:h},colorScheme:th});await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());const p=await c.newPage();p.setDefaultTimeout(240000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|fonts|Failed to load/.test(m.text()))errs.push('C:'+m.text().slice(0,160))});
await p.goto('file://'+path.join(dir,'full.html'),{waitUntil:'domcontentloaded',timeout:240000});await p.waitForTimeout(4000);
if(th==='dark')await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')});
for(const [n,js] of steps){try{await p.evaluate(js)}catch(e){errs.push('EVAL '+n+' '+e.message.slice(0,100))}await p.waitForTimeout(900);const f=path.join(dir,'shots',n+'-'+w+(th==='dark'?'-dark':'')+'.png');await p.screenshot({path:f,fullPage:full});console.log(f)}
console.log(th,'ERRS',errs.slice(0,8));await c.close()}
await b.close()})();

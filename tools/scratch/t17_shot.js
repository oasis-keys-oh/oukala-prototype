// node t17_shot.js OUT tag [--eval "js"]  -> before/after org chart shots
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),tag=a[1];const ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:'';
fs.mkdirSync(dir+'/shots',{recursive:true});const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const cfg of [{w:1440,h:900,dark:false},{w:1440,h:900,dark:true},{w:400,h:860,dark:false}]){
const c=await b.newContext({viewport:{width:cfg.w,height:cfg.h},colorScheme:cfg.dark?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.AGENTRT&&AGENTRT.booted,null,{timeout:120000}).catch(()=>{});
await p.evaluate(()=>{S.org.tab='chart';S.org.mode='both';S.org.outline=window.innerWidth<700;S.org.k=0;go('org_chart')});await p.waitForTimeout(1800);
if(ev){await p.evaluate(ev);await p.waitForTimeout(1200)}
const f=dir+'/shots/org-'+tag+'-'+cfg.w+(cfg.dark?'-dark':'')+'.png';await p.screenshot({path:f,fullPage:cfg.w<700});console.log(f,errs.slice(0,3));await c.close()}
await b.close()})();

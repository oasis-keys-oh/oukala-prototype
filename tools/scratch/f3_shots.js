const {chromium}=require('playwright');const path=require('path');
const groups=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));const dir=path.resolve('out_f3_15');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
for(const g of groups){const c=await b.newContext({viewport:{width:g.w,height:g.h||900},colorScheme:g.dark?'dark':'light'});const p=await c.newPage();
p.on('pageerror',e=>errs.push(g.w+' PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(g.w+' C '+m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{timeout:240000,waitUntil:'domcontentloaded'});await p.waitForTimeout(4000);
if(g.dark)await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
for(const j of g.jobs){await p.evaluate(s=>go(s),j.screen);await p.waitForTimeout(250);
 if(j.pre){await p.evaluate(j.pre);await p.waitForTimeout(350)}
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await p.screenshot({path:dir+'/shots/'+j.name+'.png',fullPage:!!j.full});console.log(j.name,'overflowX',ox)}
await c.close()}
console.log('ERRS',JSON.stringify(errs));await b.close()})();

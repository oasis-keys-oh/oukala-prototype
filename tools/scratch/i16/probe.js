const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+process.argv[2]+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const o={};o.body=document.body.className;o.top=(document.querySelector('header,#top,.topbar,.rail')||{}).outerHTML?.slice(0,3500);return o});
console.log(JSON.stringify(r,null,1));console.log(errs.slice(0,5));await b.close()})();

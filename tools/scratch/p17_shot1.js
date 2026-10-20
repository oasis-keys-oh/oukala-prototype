const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const code=process.argv[3];const out=process.argv[4];const phone=process.argv.includes('--phone');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load/.test(m.text()))console.log('console:',m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load'});await p.waitForTimeout(2200);
const r=await p.evaluate("(async()=>{"+code+"})()");await p.waitForTimeout(+process.env.WAIT||1200);console.log(typeof r==='string'?r:JSON.stringify(r));await p.screenshot({path:out});await b.close()})();

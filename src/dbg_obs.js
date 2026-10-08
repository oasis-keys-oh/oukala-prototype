const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]),ids=process.argv[3].split(',');const ev=process.argv[4];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message,(e.stack||'').split('\n').slice(0,6).join('\n')));p.on('console',m=>m.type()==='error'&&console.log('console:',m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);
for(const id of ids){await p.evaluate(i=>go(i),id).catch(e=>console.log(id,e.message,(e.stack||'').split('\n').slice(0,6).join('\n')));await p.waitForTimeout(300);
if(ev)await p.evaluate(ev).catch(e=>console.log('eval',e.message,(e.stack||'').split('\n').slice(0,6).join('\n')));}
await b.close()})();

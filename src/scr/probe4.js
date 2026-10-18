const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.route(/^https?:/,r=>r.abort());
let t=Date.now();await p.goto('file://'+path.resolve('scr/base.html'));console.log('load',Date.now()-t);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
for(const id of ids.slice(0,12)){t=Date.now();await p.evaluate(i=>go(i),id);console.log(id,Date.now()-t)}
await b.close()})();

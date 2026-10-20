const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(150000);await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+path.resolve('out_g14/full.html'));await p.waitForTimeout(6000);
console.log(await p.evaluate(async()=>{const o={};o.who=JSON.stringify(who('Chief Editor')||null).slice(0,200);o.dirEM=JSON.stringify(DIR.filter(d=>/Elena|Editor/.test(d.name)).map(d=>d.name+'|'+d.role));
 person360('Chief Editor');await new Promise(r=>setTimeout(r,500));const d=document.getElementById('drawer');o.open=d.matches(':popover-open');o.txt=d.innerText.slice(0,160);closeDrawer();
 person360('the CEO');await new Promise(r=>setTimeout(r,500));o.txt2=d.innerText.slice(0,160);o.open2=d.matches(':popover-open');o.ceo=JSON.stringify(DIR.filter(x=>/CEO|Chief exec|Catherine/.test(x.name+x.role)).map(x=>x.name+'|'+x.role));return o}));await b.close()})();

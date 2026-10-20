const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const o={n:CHATX.tools.length,cats:{}};CHATX.tools.forEach(t=>{o.cats[t.cat]=(o.cats[t.cat]||0)+1});o.keys=Object.keys(CHATX).join(',');return o});
console.log(JSON.stringify(r));console.log(errs);await b.close()})();

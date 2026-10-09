const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1300,height:900}})).newPage();
p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});p.on('pageerror',e=>console.log('ERR',e.message,e.stack&&e.stack.split("\n").slice(0,4).join("|")));
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
const id=process.argv[3];
const r=await p.evaluate(id=>{try{const f=REG.fns&&REG.fns[id];return typeof REG}catch(e){return e.message}},id);
await p.evaluate(i=>go(i),id);await p.waitForTimeout(500);
console.log(await p.evaluate(()=>document.querySelector('#view').innerText.slice(0,300)));
await b.close()})();

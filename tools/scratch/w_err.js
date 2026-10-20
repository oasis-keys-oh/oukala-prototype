const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('E',e.message));p.on('console',m=>console.log('C',m.text().slice(0,300)));
await p.goto('file://'+path.resolve(process.argv[2]+'/full.html'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{try{return String(REG_get?1:0)}catch(e){}try{const r=SCREENS||0;return 1}catch(e){return e.message}}));
console.log(await p.evaluate(()=>{try{go('ppm_wbs');return document.querySelector('#view,main,.view')?.innerHTML.length}catch(e){return e.stack}}));
await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1300,height:900}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const r={};r.s=!!SCREENS.find(x=>x[0]==="plat_dmap");try{go("plat_dmap")}catch(e){r.err=e.message+"|"+e.stack.split("\n").slice(0,6).join("|")}r.len=document.querySelector("#view").innerHTML.length;return JSON.stringify(r)}));
await b.close()})();

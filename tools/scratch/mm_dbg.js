const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:900}});
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(700);
await p.evaluate(()=>go('plat_map'));await p.waitForTimeout(900);
console.log(await p.evaluate(()=>{const vp=document.querySelector('[data-mm-vp]');return JSON.stringify({v:S.mm.view,w:vp.clientWidth,h:vp.clientHeight,tr:document.querySelector('[data-mm-world]').style.transform,ins:document.querySelector('[data-mm-insp]').clientWidth})}));
await b.close()})();

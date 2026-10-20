const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1300,height:900}})).newPage();
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>go("plat_dmap"));await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{const o=[];document.querySelectorAll('.plk-elg *,.plk-canvas,.plk-main,.plk-split').forEach(e=>{const r=e.getBoundingClientRect();if(r.height>60||e.matches('.plk-canvas,.plk-main,.plk-split'))o.push(e.tagName+"."+(e.getAttribute('class')||"")+" "+Math.round(r.x)+","+Math.round(r.y)+" "+Math.round(r.width)+"x"+Math.round(r.height))});return o.join("\n")}));
await b.close()})();

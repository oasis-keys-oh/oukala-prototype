const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
await p.goto('file://'+process.cwd()+'/out_a/full.html');await p.waitForTimeout(900);
await p.evaluate(()=>{go('bud_over');document.getElementById('lens').checked=true});await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const e=document.querySelector('.fkpi .fk-n');const c=getComputedStyle(e);const f=e.parentElement;return [c.whiteSpace,c.display,c.width,getComputedStyle(f).display,e.parentElement.parentElement.getBoundingClientRect().width,e.scrollWidth,e.getBoundingClientRect().width,getComputedStyle(e.parentElement.parentElement).whiteSpace]}));
await b.close()})();

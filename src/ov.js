const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:400,height:820}})).newPage();
await p.goto('file://'+process.cwd()+'/full.html');
for(const id of ['tower','kg']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(300);
console.log(id,await p.evaluate(()=>{const o=[];document.querySelectorAll('#view *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>innerWidth+2&&!e.closest('.flowscroll,.weekgrid,[style*="overflow:auto"],.tbl,svg'))o.push(e.tagName+'.'+e.className+' '+Math.round(r.right))});return o.slice(0,8)}))}
await b.close()})();

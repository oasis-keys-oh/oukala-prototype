const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(500);
await p.evaluate(s=>go(s),process.argv[3]);await p.waitForTimeout(1500);
const n=+process.argv[4];await p.evaluate(n=>document.querySelectorAll('.views > .vsw label')[n].click(),n);await p.waitForTimeout(1500);
console.log(errs,JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('.views > .panes > .pane')].map(e=>[getComputedStyle(e).display,Math.round(e.getBoundingClientRect().height),e.children.length,e.innerText.slice(0,80)]))));await b.close()})();

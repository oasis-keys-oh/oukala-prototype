const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
console.log(await p.evaluate(()=>SCREENS.filter(s=>/viz|chart|dash|report|view/i.test(s[0]+s[1])).map(s=>s.slice(0,3).join(':')).join(' | ')));
await p.evaluate(()=>go('viz'));await p.waitForTimeout(800);
console.log(await p.evaluate(()=>[...document.querySelectorAll('#view [role=tab], #view .vsw button')].map(b=>b.textContent.trim()+':'+(b.dataset.vizTab||b.dataset.viz||Object.keys(b.dataset).join('/'))).join(' | ')));
await p.screenshot({path:'out_s14/d3.png'});console.log(errs);await b.close()})();

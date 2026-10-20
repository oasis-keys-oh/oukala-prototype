const {chromium}=require('playwright');const path=require('path');const dir=path.resolve('out_people');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1800}})).newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);await p.evaluate(()=>go('ppl_cap'));await p.waitForTimeout(600);
const z=await p.locator('[data-ppl-zone="PR2"]').first().boundingBox();const c=await p.locator('[data-ppl-chip="bi:3:PR1"]').first().boundingBox();console.log(z,c);
console.log(await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&e.outerHTML.slice(0,120)},[z.x+z.width/2,z.y+z.height/2]));
await p.mouse.move(c.x+5,c.y+5);await p.mouse.down();await p.mouse.move(c.x+20,c.y+20,{steps:3});await p.mouse.move(z.x+z.width/2,z.y+z.height/2,{steps:10});
console.log(await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e.className+' '+e.tagName},[z.x+z.width/2,z.y+z.height/2]));console.log(await p.evaluate(()=>{const r=document.querySelector('[data-ppl-zone=PR2]').getBoundingClientRect();const g=document.querySelector('.ppl-ghost');return [r.y,getComputedStyle(g).position,g.getBoundingClientRect().y]}));console.log(await p.evaluate(()=>[scrollY,document.querySelector('.ppl-ghost')&&document.querySelector('.ppl-ghost').innerText]));
await p.mouse.up();await p.waitForTimeout(300);console.log(await p.evaluate(()=>JSON.stringify(S.ppl.alloc.bi[3])));await b.close()})();

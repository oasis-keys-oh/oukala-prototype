const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_rel');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:400,height:850}})).newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>go('itsm_rel'));await p.waitForTimeout(400);
for(const sel of ['[data-rel-new]','[data-rel-planform]']){const el=await p.$(sel);console.log(sel,!!el);if(el){await el.click();await p.waitForTimeout(400);console.log(' fields',await p.evaluate(()=>document.querySelectorAll('.drawer input,.drawer select,.drawer textarea,[class*=form] input').length),'hscroll',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2));await p.screenshot({path:'out_rel/shots/ph-'+sel.replace(/\W/g,'')+'.png'});await p.keyboard.press('Escape');await p.waitForTimeout(200)}}
// release drawer
const row=await p.$('[data-rel-rel]');console.log('row',!!row);if(row){await row.click();await p.waitForTimeout(500);await p.screenshot({path:'out_rel/shots/ph-reldrawer.png'});console.log('hscroll',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))}
console.log(errs.slice(0,10).join('\n')||'no errors');await b.close()})();

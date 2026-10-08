const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_rel');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1300,height:900},colorScheme:'dark'})).newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(500);
for(const s of ['itsm_rel','agile_board','agile_art']){await p.evaluate(i=>go(i),s);await p.waitForTimeout(400)}
// click hero buttons
for(const [s,sel] of [['itsm_rel','[data-rel-newrel]'],['agile_board','[data-rel-newstory]'],['agile_board','[data-rel-plan]'],['agile_board','[data-rel-estimate]'],['agile_art','[data-rel-newpi]']]){
 await p.evaluate(i=>go(i),s);await p.waitForTimeout(300);
 const el=await p.$(sel);console.log(s,sel,!!el);
 if(el){await el.click();await p.waitForTimeout(400);const n=await p.evaluate(()=>document.querySelectorAll('.modal,.drawer,dialog[open],.overlay').length);console.log(' open',n);await p.screenshot({path:'out_rel/shots/form-'+sel.replace(/\W/g,'')+'.png'});await p.keyboard.press('Escape');await p.waitForTimeout(200)}}
console.log(errs.slice(0,15).join('\n')||'no errors');await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const errs=[];
for(const [vw,vh,scheme,tag] of [[1440,900,'dark','d'],[1440,900,'light','l'],[400,860,'dark','p']]){
 const c=await b.newContext({viewport:{width:vw,height:vh},colorScheme:scheme});const p=await c.newPage();
 p.on('pageerror',e=>errs.push(tag+' PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console '+m.text().slice(0,120))});
 await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(2500);
 const shot=async n=>{await p.waitForTimeout(500);await p.screenshot({path:`shots_u17/${n}_${tag}.png`,fullPage:false})};
 await p.evaluate(()=>go('bud_ben'));await shot('ben1');
 await p.evaluate(()=>{S.v.bud_ben=2;render()});await shot('ben2');
 await p.evaluate(()=>{S.v.bud_ben=1;render();document.querySelector('[data-r17u-ben],tr[data-ben]')});
 await p.evaluate(()=>{R17U.openBen&&R17U.openBen('BEN-3')});await shot('ben3');await p.evaluate(()=>closeDrawer());
 await p.evaluate(()=>go('r17u_dash'));await shot('dash1');
 await p.evaluate(()=>{S.r17u.ui.edit=true;render()});await shot('dash2');
 await p.evaluate(()=>{S.r17u.ui.edit=false;S.v.r17ud=0;render();const b=document.querySelector('[data-r17u-drill]');b&&b.click()});await shot('dash3');
 await c.close()}
console.log(errs.length?errs.join('\n'):'no console errors');await b.close()})();

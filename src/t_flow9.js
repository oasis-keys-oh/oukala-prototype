const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:1500}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.resolve('out_itsm/full.html'));await p.waitForTimeout(600);const W=ms=>p.waitForTimeout(ms),sd='out_itsm/shots/';
await p.evaluate(()=>{S.v.itsm_prb=1;go('itsm_prb')});await W(400);
// drag a leaf to another bone
const leaf=p.locator('[data-itsm-leaf] text').first(),zone=p.locator('[data-itsm-bone="Vendor"]');
const lb=await leaf.boundingBox(),zb=await zone.boundingBox();
await p.mouse.move(lb.x+lb.width/2,lb.y+lb.height/2);await p.mouse.down();await p.mouse.move(zb.x+zb.width/2,zb.y+zb.height/2,{steps:8});await p.mouse.up();await W(300);
console.log('vendor leaves',await p.evaluate(()=>S.itsm.prb[0].fish.Vendor.length));
await p.locator('[data-itsm-a="fxadd"]').first().click();await W(300);await p.screenshot({path:sd+'f_cause.png'});
// calc & forms
await p.evaluate(()=>{try{closeDrawer()}catch(e){}});
for(const [scr,tab,sel] of [['itsm_inc',0,'[data-itsm-a="new"]'],['itsm_chg',0,'[data-itsm-a="cnew"]'],['itsm_prb',0,'[data-itsm-a="pnew"]'],['itsm_chg',4,'[data-itsm-a="apnew"]'],['itsm_chg',4,'[data-itsm-a="apedit"]']]){
 await p.evaluate(([s,t])=>{try{closeDrawer()}catch(e){}S.v[s]=t;go(s)},[scr,tab]);await W(400);await p.locator(sel).first().click();await W(500);await p.screenshot({path:sd+'form_'+scr+tab+'_'+sel.replace(/\W/g,'').slice(-6)+'.png'})}
// open drawers
for(const [fn,id] of [['incDrawer','x'],['chgDrawer','x']]){}
await p.evaluate(()=>{try{closeDrawer()}catch(e){}S.v.itsm_chg=0;go('itsm_chg')});await W(300);
await p.locator('[data-itsm-a="chgo"]').first().click().catch(()=>{});await W(400);
await p.evaluate(()=>{document.querySelector('#drawer')});
console.log('errors:',errs.length?errs:'none');await b.close()})();

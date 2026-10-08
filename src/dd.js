const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>m.type()==='error'&&console.log('CE',m.text()));
await p.goto('file://'+path.resolve('out_itsm/full.html'));await p.waitForTimeout(600);const W=ms=>p.waitForTimeout(ms);
async function sub(id,vals,pre){await p.evaluate(([id,v])=>{Object.assign(FORMST[id].vals,v);refreshForm(id)},[id,vals]);await W(250);await p.locator(`[data-fsubmit="${id}"]`).click();await W(500);const e=await p.evaluate(()=>[...document.querySelectorAll('.ferr')].map(x=>x.textContent));console.log(id,'errs',e)}
// incident
await p.evaluate(()=>go('itsm_inc'));await W(300);await p.locator('[data-itsm-a="new"]').first().click();await W(400);
await sub('itsm_inc',{caller:'Lena Park (Board)',svc:'Search and indexing',title:'Search blank for board',desc:'Cannot open search',grp:'Data team',ua:30,deg:60,urg:'2',cat:'Application'});
console.log('inc',await p.evaluate(()=>S.itsm.inc[0].id+' P'+(S.itsm.inc[0]._c&&S.itsm.inc[0]._c.p)+' '+S.itsm.inc[0].grp+' own='+S.itsm.inc[0].own));
// direct assign needs reason
await p.evaluate(()=>closeDrawer());await p.locator('[data-itsm-a="new"]').first().click();await W(400);
await sub('itsm_inc',{caller:'X (Y)',svc:'Search and indexing',title:'t',desc:'d',grp:'Data team',own:'Jordan Lee',cat:'Application'});
// change
await p.evaluate(()=>{closeDrawer();S.v.itsm_chg=0;go('itsm_chg')});await W(300);await p.locator('[data-itsm-a="cnew"]').first().click();await W(400);
const ci=await p.evaluate(()=>CIREG.find(c=>c.svc==='svc_portal').id);
await sub('itsm_chg',{type:'Normal',t:'Test change',svc:'Codification Portal',cis:[ci],just:'j',impl:'i',back:'b',start:'2026-11-18',end:'2026-11-18',cost:5000,submit_now:true});
console.log('chg',await p.evaluate(()=>{const c=S.itsm.chg[0];return JSON.stringify({tr:c.tr,cost:c.cost,type:c.type,svc:c.svc,cis:c.cis,env:c.env,grp:c.grp})+c.id+' '+c.st+' stages='+c.stages.map(s=>s.n+':'+s.ap.map(a=>a.w).join('/')).join(' | ')}));
await p.screenshot({path:'out_itsm/shots/d_chg.png'});
// approve first

// policy edit
await p.evaluate(()=>{closeDrawer();S.v.itsm_chg=4;go('itsm_chg')});await W(300);await p.locator('[data-itsm-a="apedit"]').first().click();await W(400);
await p.locator('[data-fsubmit="itsm_ap"]').click();await W(400);console.log('apol',await p.evaluate(()=>S.itsm.apol.length));
await p.locator('[data-itsm-a="apnew"]').first().click();await W(300);await sub('itsm_ap',{n:'Test pol',type:['Normal'],by:['role:Security'],quorum:'all',sla:12});
console.log('apol',await p.evaluate(()=>S.itsm.apol.length));
// problem
await p.evaluate(()=>{closeDrawer();S.v.itsm_prb=0;go('itsm_prb')});await W(300);await p.locator('[data-itsm-a="pnew"]').first().click();await W(400);
await sub('itsm_prb',{t:'New problem x',svc:'Data platform',owner:'Tom Becker',pr:'3'});
console.log('prb',await p.evaluate(()=>S.itsm.prb[0].id));
// drawers
await p.evaluate(()=>{closeDrawer();go('itsm_inc')});await W(300);await p.evaluate(()=>document.body.insertAdjacentHTML('beforeend','<button id=tmpb data-itsm-a=open data-id=INC0412></button>'));await p.evaluate(()=>document.querySelector('#tmpb').click());await W(400);await p.screenshot({path:'out_itsm/shots/d_inc.png'});
await p.evaluate(()=>{closeDrawer();document.body.insertAdjacentHTML('beforeend','<button id=tmpc data-itsm-a=chgo data-id=CHG0312></button>')});await p.evaluate(()=>document.querySelector('#tmpc').click());await W(400);await p.screenshot({path:'out_itsm/shots/d_chg312.png'});
await p.evaluate(()=>{closeDrawer();document.body.insertAdjacentHTML('beforeend','<button id=tmpd data-itsm-a=prbo data-id=PRB0010></button>')});await p.evaluate(()=>document.querySelector('#tmpd').click());await W(400);await p.screenshot({path:'out_itsm/shots/d_prb.png'});
await p.evaluate(()=>{closeDrawer();go('itsm_mi');S.v.itsm_mi=1;render()});await W(400);await p.screenshot({path:'out_itsm/shots/mi1.png'});
await b.close()})();

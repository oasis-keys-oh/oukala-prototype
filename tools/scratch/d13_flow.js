const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_d13');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const mk=async(o)=>{const c=await b.newContext(o);const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&p.errs.push('console: '+m.text()));await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(7000);return p};
const p=await mk({viewport:{width:1440,height:900}});
const sh=async(n)=>{await p.waitForTimeout(450);await p.screenshot({path:dir+'/shots/'+n+'.png'})};
await p.evaluate(()=>{go('bud_req')});await sh('d_funnel');
for(const t of [1,2,3,4]){await p.evaluate(t=>{S.v.budreq=t;render()},t);await sh('d_tab'+t)}
await p.evaluate(()=>{S.v.budreq=0;render();BUDREQ.openReq('BR-0101')});await sh('d_req');
// request form
await p.evaluate(()=>{closeDrawer();BUDREQ.openForm({t:'Search relevance tuning',amt:60000,c_Labor:40000,c_Vendor:20000,type:'New initiative'})});await sh('d_form');
console.log(await p.evaluate(()=>document.querySelector('.br-live')?document.querySelector('.br-live').innerText.slice(0,500):'no live'));
// invalid submit: sponsor AI
const bad=await p.evaluate(()=>{const n=BUDREQ.requests().length;return n});
// submit through API validation by clicking submit
await p.click('text=Submit request').catch(e=>console.log('click',e.message));await sh('d_form_err');
console.log('after submit count',await p.evaluate(()=>BUDREQ.requests().length),'was',bad);
// inbox
const r=await p.evaluate(()=>{const it=INBOX.items().find(i=>i.src==='budreq'&&i.sid==='BR-0101');const d=INBOX.decide(it.id,'approve',{note:'ok'});INBOX.flush();return {d:d&&d.ok,st:BUDREQ.requests().find(x=>x.id==='BR-0101').st,lines:BUDX.B().led.slice(-1)[0],resBal:BUDX.resBal()}});
console.log(JSON.stringify(r));
await p.evaluate(()=>{const r=BUDREQ.decide('BR-0108','Approve','fine','Maya Ortiz');return r});
console.log(await p.evaluate(()=>JSON.stringify([BUDREQ.decide('BR-0102','Approve','x','Casey Rowan'),BUDREQ.decide('BR-0114','Approve','x','Avery Chen'),BUDREQ.stats().conv,BUDREQ.requests().find(x=>x.id==='BR-0114').st])));
await p.evaluate(()=>{go('bud_req')});await sh('d_after');
await p.evaluate(()=>{go('bud_over')});await sh('d_budgets');
console.log('errors',p.errs);
const ph=await mk({viewport:{width:400,height:820}});
for(const t of [0,2,3]){await ph.evaluate(t=>{go('bud_req');S.v.budreq=t;render()},t);await ph.waitForTimeout(400);console.log('phone tab',t,'overflow',await ph.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));await ph.screenshot({path:dir+'/shots/d_ph'+t+'.png'})}
const dk=await mk({viewport:{width:1440,height:900},colorScheme:'dark'});await dk.evaluate(()=>go('bud_req'));await dk.waitForTimeout(500);await dk.screenshot({path:dir+'/shots/d_dark.png'});
console.log('phone/dark errs',ph.errs,dk.errs);await b.close()})();

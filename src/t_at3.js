const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+path.resolve('out_atlas','full.html'));await p.waitForTimeout(600);
const q=async(js,a)=>{try{return await p.evaluate(js,a)}catch(e){return 'ERR '+e.message.slice(0,200)}};const w=ms=>p.waitForTimeout(ms);
await q(()=>go('plat_reg'));await w(600);await q(()=>document.querySelector('[data-bt-row]').click());await w(700);
console.log('link',await q(()=>{const l=document.querySelector('#drawer [data-atlas-go]');return l?l.dataset.atlasGo:'none'}));
await q(()=>document.querySelector('#drawer [data-atlas-go]').click());await w(1200);console.log('after',await q(()=>[S.screen,S.atlas.sel,S.v.atlas]));
// ask
await q(()=>{window.__s=null;window.say=(qq,r)=>{window.__s=r.t}});
for(const t of ['show the data model','how is delivery health calculated','where is incident used']){const r=await q(t=>{for(const f of ASKX){if(f(t))return window.__s||'handled'}return 'none'},t);console.log(t,'=>',String(r).slice(0,90))}
await b.close();
const c2=await (await chromium.launch({executablePath:'/opt/pw-browsers/chromium'})).newContext({viewport:{width:400,height:850}});const p2=await c2.newPage();
await p2.goto('file://'+path.resolve('out_atlas','full.html'));await p2.waitForTimeout(600);await p2.evaluate(()=>go('plat_data'));await p2.waitForTimeout(500);
await p2.evaluate(()=>{document.querySelector('.at-vpbox').scrollIntoView({block:'start'})});await p2.waitForTimeout(300);await p2.screenshot({path:'out_atlas/shots/at_ph_diag.png'});
await p2.evaluate(()=>{document.querySelector('.at-pd summary').click()});await p2.waitForTimeout(200);await p2.evaluate(()=>document.querySelector('.at-pr').click());await p2.waitForTimeout(1200);await p2.screenshot({path:'out_atlas/shots/at_ph_sel.png'});
await p2.evaluate(()=>{S.v.atlas=1;render()});await p2.waitForTimeout(600);await p2.evaluate(()=>window.scrollTo(0,900));await p2.waitForTimeout(300);await p2.screenshot({path:'out_atlas/shots/at_ph_lin.png'});
console.log('ph overflow',await p2.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),errs);process.exit(0)})();

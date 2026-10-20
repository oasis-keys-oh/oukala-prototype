const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'out_oncall');fs.mkdirSync(dir+'/shots',{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
const shot=async n=>{await p.screenshot({path:dir+'/shots/'+n+'.png',fullPage:true})};
const ev=async(js)=>{try{return await p.evaluate(js)}catch(e){errs.push('eval '+js.slice(0,50)+': '+e.message)}};
await ev("go('svc_oncall')");await p.waitForTimeout(300);
for(let i=0;i<6;i++){await ev(`S.v.svc_ocv=${i};render()`);await p.waitForTimeout(200);await shot('oc_t'+i)}
// weekly calendar and DND
await ev("S.v.svc_ocv=1;OC=S.oc;S.oc.rota='R2';S.oc.map='week';S.oc.tier='All';render()");await p.waitForTimeout(300);await shot('oc_week');
const chips=await p.$$('.oc-wcell .oc-chip');console.log('chips',chips.length);
const info=await ev(`(()=>{const a=[...document.querySelectorAll('.oc-wcell')];return a.slice(0,16).map(x=>x.dataset.dnd+':'+x.querySelectorAll('.oc-chip').length).join(' | ')})()`);console.log(info);
const before=await ev("S.oc.ov.length");
const c1=await p.$('[data-dnd="R2|Primary|1"] .oc-chip'),c2=await p.$('[data-dnd="R2|Primary|3"]');
if(c1&&c2){const a=await c1.boundingBox(),d=await c2.boundingBox();await p.mouse.move(a.x+30,a.y+10);await p.mouse.down();await p.mouse.move(a.x+60,a.y+30,{steps:4});await p.mouse.move(d.x+40,d.y+20,{steps:8});await p.mouse.up();await p.waitForTimeout(400)}
console.log('overrides before/after',before,await ev("S.oc.ov.length"));await shot('oc_week_after');
await ev("S.oc.map='daily';render()");await p.waitForTimeout(200);await shot('oc_daily');
await ev("S.oc.map='month';render()");await p.waitForTimeout(200);await shot('oc_month');
await ev("S.oc.map='hourly';S.oc.rota='R3';render()");await p.waitForTimeout(200);await p.click('[data-oc-cell]');await p.waitForTimeout(300);await shot('oc_cell');
const forms=["OCX.rotaForm()","OCX.overrideForm()","OCX.swapForm()","OCX.handoverForm('R2')","OCX.escLevelForm()","OCX.ruleForm(1)","OCX.rotaForm('R3')"];
await ev("closeDrawer()");
for(const f of forms){await ev("go('svc_oncall');"+f);await p.waitForTimeout(300);await shot('oc_f_'+f.replace(/\W/g,''));}
await ev("closeDrawer();OCX.rotaDrawer('R2')");await p.waitForTimeout(300);await shot('oc_drawer');
for(let i=0;i<7;i++){await ev(`closeDrawer();go('svc_skills');S.v.svc_skv=${i};render()`);await p.waitForTimeout(250);await shot('sk_t'+i)}
await ev("closeDrawer();OCX.claimForm();");await p.waitForTimeout(250);await shot('sk_f_claim');
await ev("closeDrawer();OCX.skillDrawer('azure')");await p.waitForTimeout(250);await shot('sk_drawer');
await ev("closeDrawer();person360('Sam Patel')");await p.waitForTimeout(300);await p.click('text=Skills and on-call').catch(()=>{});await p.waitForTimeout(300);await shot('p360');
await ev("closeDrawer();SCALE.set(true)");await p.waitForTimeout(600);
for(const s of ['svc_oncall','svc_skills']){const t0=Date.now();await ev(`go('${s}')`);await p.waitForTimeout(300);console.log(s,'scale ms',Date.now()-t0);await shot('scale_'+s)}
for(let i=0;i<6;i++){const t0=Date.now();await ev(`go('svc_oncall');S.v.svc_ocv=${i};render()`);console.log('oc tab',i,Date.now()-t0,'ms')}
for(let i=0;i<7;i++){const t0=Date.now();await ev(`go('svc_skills');S.v.svc_skv=${i};render()`);console.log('sk tab',i,Date.now()-t0,'ms')}
console.log('errors:',errs.length?errs:'none');await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto('file://'+path.resolve('out_atlas','full.html'));await p.waitForTimeout(600);
const t0=await p.evaluate(()=>{const t=performance.now();go('plat_data');return performance.now()-t});console.log('first render ms',Math.round(t0));
await p.waitForTimeout(500);
const q=async(js)=>{try{return await p.evaluate(js)}catch(e){return 'ERR '+e.message.slice(0,150)}};
const w=ms=>p.waitForTimeout(ms);
console.log('cam',await q(()=>JSON.stringify(S.atlas.cam)),'lod',await q(()=>document.querySelector('[data-at-vp]').dataset.lod));
// domain click
await q(()=>document.querySelector('[data-at-dom-go="ops"]').click());await w(900);console.log('dom ops',await q(()=>[S.atlas.dom,!!document.querySelector('.at-insp:not([hidden])'),document.querySelector('.at-bcn').textContent]));
await q(()=>document.querySelector('[data-at-ent="alert_event"]').click());await w(900);console.log('ent',await q(()=>[S.atlas.sel,document.querySelector('.at-bcn').textContent,document.querySelectorAll('.at-tab').length]));
for(const tb of ['conn','used','metrics','lineage']){await q(t=>document.querySelector('[data-at-itab="'+t+'"]').click(),tb);}
await q(()=>document.querySelector('[data-at-itab="fields"]').click());await w(200);
await q(()=>document.querySelector('[data-at-fld]').click());await w(500);console.log('fld',await q(()=>[JSON.stringify(S.atlas.fld),document.querySelector('.at-bcn').textContent]));
await q(()=>document.querySelector('[data-at-bc="back"]').click());await w(300);console.log('back',await q(()=>[S.atlas.sel,JSON.stringify(S.atlas.fld)]));
// search
await q(()=>{const i=document.querySelector('[data-at-q]');i.value='incident';i.dispatchEvent(new Event('input',{bubbles:true}))});await w(300);console.log('search results',await q(()=>document.querySelectorAll('[data-at-sr] .at-sri').length));
await q(()=>document.querySelector('[data-at-sr] .at-sri').click());await w(800);console.log('picked',await q(()=>S.atlas.sel));
for(const o of ['authority','class','metrics','status','domain']){await q(o=>document.querySelector('[data-at-ov="'+o+'"]').click(),o)}
// trace
await q(()=>ATLAS.traceMetric('m_delivery'));await w(1200);console.log('trace',await q(()=>[S.atlas.trace,S.v.atlas,document.querySelectorAll('.at-ent.tr').length,!!document.querySelector('.at-token')]));
// lineage
await q(()=>{S.v.atlas=1;render()});await w(500);
console.log('lin',await q(()=>[document.querySelectorAll('.at-lg').length,document.querySelectorAll('.at-lo').length,document.querySelectorAll('.at-lq').length]));
await q(()=>ATLAS.lineage('m_itsm_sla'));await w(500);console.log('lin2',await q(()=>[document.querySelector('.at-lhm h3').textContent,document.querySelectorAll('.at-lq').length]));
// find a metric with gaps
const gm=await q(()=>LIN.all().find(t=>t.gaps.length&&t.id!=='m_delivery').id);console.log('gap metric',gm);
await q(g=>ATLAS.lineage(g),gm);await w(500);
const before=await q(g=>LIN.trace(g).pct,gm);
await q(()=>document.querySelector('[data-at-lmap]').click());await w(600);console.log('form',await q(()=>!!document.querySelector('#drawer [data-form], #drawer form, #drawer .frm, #drawer input')));
await q(()=>{const d=document.querySelector('#drawer');const s=d.querySelector('select');console.log;return s?s.options.length:0}).then(x=>console.log('opts',x));
// click trace button
await q(()=>{closeDrawer()});await w(200);
await q(g=>document.querySelector('[data-at-trace="'+g+'"]').click(),gm);await w(900);console.log('trace btn',await q(()=>[S.v.atlas,S.atlas.trace]));
// domain map
await q(()=>{S.v.atlas=2;render()});await w(400);await q(()=>document.querySelector('[data-at-pair]').click());await w(300);await q(()=>document.querySelector('[data-at-pairgo]').click());await w(1200);console.log('pairgo',await q(()=>[S.v.atlas,S.screen,document.querySelectorAll('.at-ent:not(.dim)').length,JSON.stringify(S.atlas.cam)]));
// old tab
await q(()=>{S.v.atlas=3;render()});await w(400);console.log('old',await q(()=>[!!document.querySelector('.at-old .views'),document.querySelectorAll('.at-old [data-er-t]').length]));
// registry drawer link
await q(()=>go('plat_reg'));await w(500);
console.log('reg',await q(()=>{const b=document.querySelector('[data-reg-ent],[data-ent]');return b?b.outerHTML.slice(0,100):'none'}));
// search / ask
console.log('searchx',await q(()=>SEARCHX.reduce((a,f)=>{try{return a+f().filter(x=>x.g==='Metric calculations'||x.g==='Data diagram tables').length}catch(e){return a}},0)));
// SCALE
await q(()=>{go('plat_data');S.v.atlas=0;SCALE.set(true)});await w(900);console.log('scale',await q(()=>[!!document.querySelector('.at-ent'),document.querySelector('.at-ent .at-eo')&&document.querySelector('.at-ent .at-eo').textContent]));
// phone bottom sheet
console.log('errors',errs.slice(0,8));await b.close()})();

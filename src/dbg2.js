const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_itsm/full.html'));await p.waitForTimeout(500);
for(const [s,t] of [['itsm_inc',1],['itsm_prb',1],['itsm_chg',0],['itsm_rel',0],['itsm_rel',1],['itsm_mi',0]]){await p.evaluate(([s,t])=>{S.v[s]=t;go(s)},[s,t]);await p.waitForTimeout(500);
console.log(s,t,await p.evaluate(()=>[...document.querySelectorAll('[data-dnd]')].map(l=>l.dataset.dndScope+'|'+l.dataset.dnd+'|'+l.querySelectorAll(':scope > [data-dnd-id]').length).slice(0,30).join('  ')))}
await b.close()})();

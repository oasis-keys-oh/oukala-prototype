// PR-31: where does a builder see lint and gate results in the product?
const {open}=require('./lib');const path=require('path');
(async()=>{const {b,p}=await open({persona:'arch'});
 for(const id of ['showroom','plat_contract','plat_gate','scr_map']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(400);
  const t=await p.evaluate(()=>document.body.innerText);const l=t.split('\n').filter(x=>/lint|check passed|checks pass|failed|gate/i.test(x)).slice(0,8);console.log('##',id,l)}
 const ex=await p.evaluate(()=>{const o={};try{o.exp=typeof EXP!=='undefined'&&EXP.lint?JSON.stringify(EXP.lint()).slice(0,300):'no EXP.lint'}catch(e){o.exp=e.message}try{o.show=typeof SHOW!=='undefined'&&SHOW.lint?JSON.stringify(SHOW.lint()).slice(0,300):'no SHOW.lint'}catch(e){o.show=e.message}return o});console.log(ex);
 await p.evaluate(()=>go('plat_contract'));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const l=[...document.querySelectorAll('#view .vsw label,#view [role=tab]')].find(x=>/Enforcement/.test(x.textContent));if(!l)return 'none';l.click();return 'ok'});await p.waitForTimeout(500);
 console.log('Enforcement tab:',await p.evaluate(()=>document.querySelector('#view').innerText.replace(/\s+/g,' ').slice(0,900)));
 await p.screenshot({path:path.join(__dirname,'shots/architect/plat_contract-enforcement.jpg'),type:'jpeg',quality:45});
 await p.evaluate(()=>go('flw_design'));await p.waitForTimeout(400);await p.screenshot({path:path.join(__dirname,'shots/architect/flw_design-light-top.jpg'),type:'jpeg',quality:45});
 await b.close()})();

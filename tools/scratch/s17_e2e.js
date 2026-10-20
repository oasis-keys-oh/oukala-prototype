const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
await p.route(/^https?:/,r=>r.abort());const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/out_s17/full.html');await p.waitForTimeout(3500);
const L=(k,v)=>console.log(k,typeof v==='string'?v:JSON.stringify(v));
L('fns',await p.evaluate(()=>[typeof incForm,typeof window.RULES.UI.newRule,typeof chgForm,typeof FORMST]));
// 1. create a rule in the editor via UI
await p.evaluate(()=>{go('r17s_rules');window.RULES.UI.newRule('client')});await p.waitForTimeout(600);
await p.fill('[data-r17s-in="name"]','E2E hide urgency note');
// entity incident default? set condition and action by clicking
await p.selectOption('[data-r17s-in="trigger"]','change');await p.waitForTimeout(200);await p.click('[data-r17s-watch="urgency"]');await p.waitForTimeout(200);
await p.click('[data-r17s-addc="when"]');await p.waitForTimeout(200);
await p.selectOption('[data-r17s-in="when.items.0.f"]','urgency');await p.waitForTimeout(200);
await p.selectOption('[data-r17s-in="when.items.0.op"]','is');
await p.waitForTimeout(150);
L('valctl',await p.evaluate(()=>document.querySelector('[data-r17s-in="when.items.0.v"]')?.outerHTML.slice(0,200)));
await p.selectOption('[data-r17s-in="when.items.0.v"]',{index:1});
await p.selectOption('[data-r17s-addsel="then"]','message');await p.waitForTimeout(200);
await p.fill('[data-r17s-in="then.0.text"]','E2E: low urgency note shown');
L('draft',await p.evaluate(()=>JSON.stringify(window.RULES.UI.st.draft.when)+JSON.stringify(window.RULES.UI.st.draft.then)));
L('prev',await p.evaluate(()=>document.getElementById('r17s-prev').innerText.slice(0,400)));
await p.evaluate(()=>{const d=window.RULES.UI.st.draft;d.owner='Tom Becker';d.backup='Nia Brooks';window.RULES.UI.paintEditor()});await p.waitForTimeout(200);
await p.click('[data-r17s-save]');await p.waitForTimeout(400);
L('saved',await p.evaluate(()=>window.RULES.UI.st.sel));
await p.click('[data-r17s-totest]');await p.waitForTimeout(600);
L('test',await p.evaluate(()=>document.getElementById('r17s-tres').innerText.slice(0,300)));
const id=await p.evaluate(()=>window.RULES.UI.st.sel);
await p.evaluate(()=>{S.v.r17sv=2;render()});await p.waitForTimeout(400);
await p.click('[data-r17s-activate]');await p.waitForTimeout(400);
L('status after request',await p.evaluate(id=>window.RULES.get(id).status,id));
// approve as other group member
const ap=await p.evaluate(()=>window.RULES.data.appr.map(a=>({id:a.id,by:a.by,st:a.state})));L('appr',ap);
const r=await p.evaluate(id=>{const a=window.RULES.data.appr.find(x=>x.rule===id);const g=window.RULES.govGroup();const ms=APG.get(g).members.filter(n=>n!==a.by).slice(0,2);return ms.map(n=>JSON.stringify(window.RULES.decide(a.id,n,'approve'))).join(' ')},id);L('decide',r);
L('status after',await p.evaluate(id=>window.RULES.get(id).status,id));
// 2. trigger on real form
await p.evaluate(()=>{go('itsm_inc')});await p.waitForTimeout(500);await p.click('[data-itsm-a="new"]');await p.waitForTimeout(700);
L('form open',await p.evaluate(()=>!!document.querySelector('[data-fk^="itsm_inc:"]')));
await p.click('[data-fchip="itsm_inc:urg:1"]').catch(e=>L('clickerr',e.message.slice(0,100)));await p.waitForTimeout(500);
L('banner',await p.evaluate(()=>[...document.querySelectorAll('.r17s-banner,.r17s-note')].map(x=>x.innerText)));
L('ERRS',errs.slice(0,8));await b.close()})();

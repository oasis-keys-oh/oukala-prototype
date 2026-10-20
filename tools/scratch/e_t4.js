const {chromium}=require('playwright');const D='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+D+'/full.html');await p.waitForTimeout(900);
await p.evaluate(()=>go('metrics'));await p.waitForTimeout(800);
await p.click('#view .hero .ownx-badge');await p.waitForTimeout(500);await p.screenshot({path:D+'/shots/e_drawer.png'});
console.log('before',await p.evaluate(()=>JSON.stringify(OWNX.get('module','metrics').act)));
await p.click('[data-ownx-save]');await p.waitForTimeout(700);
console.log('after',await p.evaluate(()=>JSON.stringify([OWNX.get('module','metrics').act,OWNX.stats().cov,S.ownx.log[0],document.querySelector('#view .hero .ownx-slot')&&document.querySelector('#view .hero .ownx-slot').innerText])));
// gaps tab
await p.evaluate(()=>{S.v=S.v||{};S.v.ownx_v=1;go('own_gaps')});await p.waitForTimeout(800);await p.screenshot({path:D+'/shots/e_gaps.png'});
await p.evaluate(()=>{S.v.ownx_v=2;render()});await p.waitForTimeout(600);await p.screenshot({path:D+'/shots/e_heat.png'});
await p.evaluate(()=>{S.v.ownx_v=3;render()});await p.waitForTimeout(600);await p.screenshot({path:D+'/shots/e_people.png'});
await p.evaluate(()=>{S.v.ownx_v=4;render()});await p.waitForTimeout(600);await p.screenshot({path:D+'/shots/e_act.png'});
// accept flow
console.log('acc',await p.evaluate(()=>{const g=OWNX.gaps()[3];return JSON.stringify([g.key,OWNX.accept(g.kind,g.id,'Retiring this next month so no owner needed',30)])}));
// popover owner row
await p.evaluate(()=>go('own_gaps'));await p.waitForTimeout(600);
await p.evaluate(()=>{const b=document.querySelector('.fchip[data-k]');b.click()});await p.waitForTimeout(500);
console.log('popover row',await p.evaluate(()=>!!document.querySelector('.pop:popover-open [data-ownx-prow]')));
await p.screenshot({path:D+'/shots/e_pop.png'});
// gate check + mcp
console.log('gate',await p.evaluate(()=>JSON.stringify(GATE.CHECKS.filter(c=>c.id==='ownx').length)+JSON.stringify(GATE.apps().slice(0,12).map(a=>[a.id,GATE.conformance(a.id).rows?.find(r=>r.id==='ownx')?.r]))));
console.log('mcp',await p.evaluate(()=>JSON.stringify(MCPX.call('find_owner',{topic:'budget'})).slice(0,420)+ ' tools:'+MCPX.tools.some(t=>t.n==='find_owner')));
console.log('contract',await p.evaluate(()=>{try{const r=CONTRACT.evaluate('own_gaps');return JSON.stringify([r.score,r.rules.map(x=>x.id+':'+x.st)])}catch(e){return e.message}}));
console.log('wired',await p.evaluate(()=>JSON.stringify(OWNX.wired())));
console.log('errors',errs);await b.close()})();

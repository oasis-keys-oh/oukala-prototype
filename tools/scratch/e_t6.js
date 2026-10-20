const {chromium}=require('playwright');const D='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+D+'/full.html');await p.waitForTimeout(900);
await p.evaluate(()=>go('plat_data'));await p.waitForTimeout(1800);
console.log(await p.evaluate(()=>{const eh=[...document.querySelectorAll('.at-eh[data-at-ent]')].map(x=>x.dataset.atEnt);const g=OWNX.gaps({kind:'entity'}).map(r=>r.id);return JSON.stringify({eh:eh.length,gaps:g.length,overlap:eh.filter(x=>g.includes(x)).length,sample:g.slice(0,5),dots:document.querySelectorAll('.ownx-dot').length})}));
await p.evaluate(()=>{const g=OWNX.gaps({kind:'entity'}).map(r=>r.id);const b=document.querySelector('.at-eh[data-at-ent="'+g[0]+'"]');if(b)b.scrollIntoView()});await p.waitForTimeout(700);
await p.screenshot({path:D+'/shots/e_atlas.png'});
console.log('errors',errs);await b.close()})();

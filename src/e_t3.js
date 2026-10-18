const {chromium}=require('playwright');const D='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+D+'/full.html');await p.waitForTimeout(900);
await p.evaluate(()=>ask("who owns the Lumen vendor"));await p.waitForTimeout(2500);await p.screenshot({path:D+'/shots/e_chat.png'});
// screen badges
for(const id of ['metrics','nav_studio','plat_build','bud_over']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(900);
 console.log(id,await p.evaluate(()=>[...document.querySelectorAll('#view .hero .ownx-slot, #view .mcard .ownx-slot')].slice(0,3).map(x=>x.innerText)));
 await p.screenshot({path:D+'/shots/e_scr_'+id+'.png'});}
console.log('nav dots',await p.evaluate(()=>[document.querySelectorAll('.ownx-ndot').length,[...document.querySelectorAll('.ownx-gn')].map(x=>x.textContent)]));
console.log('errors',errs);await b.close()})();

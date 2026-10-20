const {chromium}=require('playwright');const D='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+D+'/full.html');await p.waitForTimeout(900);
// 1 palette: type budget in Not sure box
await p.fill('#nxFind','budget').catch(async e=>{errs.push('nxFind '+e.message)});await p.press('#nxFind','Enter');await p.waitForTimeout(900);
await p.screenshot({path:D+'/shots/e_pal_describe.png'});
console.log('describe chips:',await p.evaluate(()=>document.querySelector('.ownx-pal')?document.querySelector('.ownx-pal').innerText.replace(/\n/g,' | '):'NONE'));
await p.keyboard.press('Escape');await p.waitForTimeout(200);
// 2 global search
await p.keyboard.press('Control+k');await p.waitForTimeout(300);await p.keyboard.type('budget');await p.waitForTimeout(900);
await p.screenshot({path:D+'/shots/e_pal_global.png'});
console.log('global people rows:',await p.evaluate(()=>[...document.querySelectorAll('#nxPalList .nx-opt[data-ty=person]')].map(x=>x.innerText.replace(/\n/g,' / ')).slice(0,6)));
await p.keyboard.press('Escape');
// 3 chat
await p.evaluate(()=>ask("who owns the budget?"));await p.waitForTimeout(900);
await p.screenshot({path:D+'/shots/e_chat.png'});
console.log('errors',errs);await b.close()})();

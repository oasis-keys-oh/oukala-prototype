const {chromium}=require('playwright');const D='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+D+'/full.html');await p.waitForTimeout(900);
for(const q of ["who owns the budget?","who do I go to for security?","who owns forecast","who is the vendor management owner","what has no owner","who owns the Lumen vendor","who owns ci_web01","who owns data governance","who do I go to for a contract renewal"]){
 await p.evaluate(q=>ask(q),q);await p.waitForTimeout(2200);
 console.log(q,'=>',await p.evaluate(()=>{const t=CHATX.cur();const m=[...t.msgs].reverse().find(x=>x.ai);return (m&&m.t||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,200)+' | cards:'+((m&&m.cards)||[]).length+' screen:'+S.screen}));
}
await p.evaluate(()=>ask("who owns the budget?"));await p.waitForTimeout(900);
await p.screenshot({path:D+'/shots/e_chat.png'});
console.log('errors',errs);await b.close()})();

const {chromium}=require('playwright');const D='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/out_e13';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+D+'/full.html');await p.waitForTimeout(900);
await p.evaluate(()=>NAVX.ensureIndex(true));await p.waitForTimeout(4000);
for(const q of ['budget','vendor','risk','security','forecast','who owns budget','owner','privacy','contract renewal','data governance','incident','release','training','agent']){
 const r=await p.evaluate(q=>{const x=NAVX.search(q,{limit:40});return x.results.filter(y=>y.type==='person').slice(0,3).map(y=>y.title+' / '+y.meta)},q);console.log(q,'=>',JSON.stringify(r))}
await p.evaluate(()=>go('plat_atlas'));await p.waitForTimeout(1500);
console.log('atlas dots',await p.evaluate(()=>document.querySelectorAll('.ownx-dot').length));
await p.screenshot({path:D+'/shots/e_atlas.png'});
await p.evaluate(()=>PROCLIB.open('ownership_governance'));await p.waitForTimeout(900);await p.screenshot({path:D+'/shots/e_proc.png'});
console.log('errors',errs);await b.close()})();

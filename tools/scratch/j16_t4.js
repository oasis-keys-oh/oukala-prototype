const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'out_j16');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const dark of [false,true]){
const p=await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:240000});await p.waitForTimeout(1500);
const sfx=dark?'d':'';
// find a dashboard screen with tiles
const scr=await p.evaluate(()=>{for(const id of ['obs_dash','exe_home','strat_exec','exe_board']){try{go(id);}catch(e){}
 const n=document.querySelectorAll('#view .screen .card').length;if(n>=3)return id}return S.screen});
await p.waitForTimeout(800);
console.log('screen',scr,await p.evaluate(()=>document.querySelectorAll('#view .card').length));
await p.screenshot({path:dir+'/j_d_a'+sfx+'.png'});
const has=await p.evaluate(()=>!!document.querySelector('[data-dl="edit"],[data-dl-edit],.dl-cust'));
console.log('customize btn',has, await p.evaluate(()=>(document.querySelector('#r16Pha')||{}).innerHTML?.slice(0,200)));
await p.evaluate(()=>DASHX.startEdit());await p.waitForTimeout(600);
console.log('edit',await p.evaluate(()=>({tiles:document.querySelectorAll('.dl-tile,[data-dl-key]').length,bar:!!document.querySelector('.dl-bar')})));
await p.screenshot({path:dir+'/j_d_b'+sfx+'.png'});
const r=await p.evaluate(()=>{const k=Object.keys(DASHX).length;const scr=S.screen;const t=document.querySelector('[data-dl-key]');
 const key=t&&t.dataset.dlKey;const before=[...document.querySelectorAll('[data-dl-key]')].map(x=>x.dataset.dlKey);
 const btn=document.querySelector('[data-dl="save"]');btn&&btn.click();
 return {k,key,n:before.length,saved:!!btn}});
console.log(JSON.stringify(r));await p.waitForTimeout(500);
console.log('eff',await p.evaluate(()=>JSON.stringify(DASHX.effective(S.screen)).slice(0,200)));
console.log('pub',await p.evaluate(()=>{try{const r=DASHX.publish(S.screen,'everyone');return JSON.stringify(r).slice(0,200)}catch(e){return 'ERR '+e.message}}));
await p.evaluate(()=>go('r16j_dash'));await p.waitForTimeout(600);
console.log('score',await p.evaluate(()=>{try{return JSON.stringify(CONTRACT.evaluate('r16j_dash')).slice(0,300)}catch(e){return 'ERR '+e.message}}));
console.log('zl',await p.evaluate(()=>{try{return JSON.stringify(window.CONN&&CONN.score&&CONN.score())}catch(e){return 'x'}}));
// Metrics landing
await p.evaluate(()=>go('metrics'));await p.waitForTimeout(800);
console.log('metrics',await p.evaluate(()=>({scr:S.screen,sn:document.querySelectorAll('.mx-sn').length,land:!!document.querySelector('.mx-land,.mx-card')})));
await p.screenshot({path:dir+'/j_m'+sfx+'.png'});
// Admin studio
await p.evaluate(()=>{go('adm_studio')});await p.waitForTimeout(800);
console.log('adm',await p.evaluate(()=>S.screen));
console.log(errs.slice(0,6));await p.close()}
await b.close()})();

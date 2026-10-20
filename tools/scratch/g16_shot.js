const {chromium}=require('playwright');
(async()=>{const dir=process.argv[2];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const theme of ['light','dark']){const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:theme});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:170000});
await p.waitForFunction(()=>window.PERM&&window.NAVX&&NAVX.persona&&document.querySelector('#nav')&&document.querySelector('#view'),null,{timeout:170000});await p.waitForTimeout(1500);
if(theme==='dark')await p.evaluate(()=>{document.documentElement.dataset.theme='dark';try{PREF.theme='dark'}catch(e){}});
const shots=[
 ['perm_matrix',async()=>{await p.evaluate(()=>{NAVX.persona.set('admin');S.v.pmperm=0;go('r16g_perm')})}],
 ['perm_rules',async()=>{await p.evaluate(()=>{S.v.pmperm=1;render()})}],
 ['perm_fields',async()=>{await p.evaluate(()=>{S.v.pmperm=2;PERM_UI.ent='person';render()})}],
 ['perm_sim',async()=>{await p.evaluate(()=>{S.v.pmperm=3;PERM_UI.sim='ops';render()})}],
 ['perm_explain',async()=>{await p.evaluate(()=>{S.v.pmperm=4;PERM_UI.exUser='Dana Whitfield';PERM_UI.exRes='budget_request';PERM_UI.exAct='approve';render()})}],
 ['perm_cov',async()=>{await p.evaluate(()=>{S.v.pmperm=6;render()})}],
 ['ops_denied',async()=>{await p.evaluate(()=>{NAVX.persona.set('ops');go('ppl_perf')})}],
 ['ops_drawer',async()=>{await p.evaluate(()=>{go('org_chart');person360('Priya Shah')})}],
 ['ops_org',async()=>{await p.evaluate(()=>{closeDrawer();go('org_chart')})}],
 ['exec_drawer',async()=>{await p.evaluate(()=>{NAVX.persona.set('exec');go('org_chart');person360('Priya Shah')})}],
];
for(const [n,f] of shots){await f();await p.waitForTimeout(700);await p.screenshot({path:'/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/r16_shots/g_'+n+'_'+theme+'.png'})}
console.log(theme,'errors',errs.length,errs.slice(0,5));await c.close()}
await b.close()})();

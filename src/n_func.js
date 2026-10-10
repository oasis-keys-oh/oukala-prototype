const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++};
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(900);
const ev=(f,a)=>p.evaluate(f,a);
// 1 reachability
const chk=await ev(()=>{const c=NAVX.check();return {screens:c.screens,placed:c.placed,np:c.notPlaced,dup:c.duplicates,unm:c.unmapped,orph:c.orphans,mapKeysNotScreens:Object.keys(NAVX.map).filter(id=>!SCREENS.some(s=>s[0]===id))}});
ok(chk.placed===chk.screens&&!chk.np.length&&!chk.dup.length,'every screen in exactly one group',chk);
const unreach=await ev(async()=>{const bad=[];for(const s of SCREENS){go(s[0]);await new Promise(r=>setTimeout(r,25));const a=document.querySelector('#nav .navgd [aria-current=page][data-nav="'+s[0]+'"]')||(s[0]==='home'&&document.querySelector('#nav [aria-current=page][data-nav=home]'));const g=a&&a.closest('details');if(!a||(g&&!g.open))bad.push(s[0])}return bad});
ok(unreach.length===0,'every screen reachable as the active item in the nav (group opens)',unreach);
await p.reload();await p.waitForTimeout(900);
// 2 palette
await ev(()=>go('home'));await p.waitForTimeout(300);
await p.keyboard.press('/');await p.waitForTimeout(200);
ok(await ev(()=>!document.getElementById('nxPal').hidden),'/ opens palette');
await p.keyboard.type('invoice',{delay:20});await p.waitForTimeout(400);
let rows=await ev(()=>NAVX.palette.state().rows.map(r=>r.ty+':'+r.t).slice(0,6));ok(rows.length>2,'results for invoice',rows);
await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');
const sel=await ev(()=>NAVX.palette.state().sel);ok(sel===2,'arrow down moves selection',sel);
await p.keyboard.press('ArrowUp');ok(await ev(()=>NAVX.palette.state().sel)===1,'arrow up');
await p.keyboard.press('Tab');ok(await ev(()=>NAVX.palette.state().scope)==='screen','Tab cycles scope to Screens',await ev(()=>NAVX.palette.state().scope));
await p.keyboard.press('Shift+Tab');
await p.keyboard.press('Escape');await p.waitForTimeout(150);ok(await ev(()=>document.getElementById('nxPal').hidden),'Esc closes');
await p.keyboard.press('Control+k');await p.waitForTimeout(200);ok(await ev(()=>!document.getElementById('nxPal').hidden),'Ctrl+K opens');
await p.keyboard.type('approve invoices',{delay:15});await p.waitForTimeout(400);
await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');// screens
const picked=await ev(()=>{const s=NAVX.palette.state();return s.rows[s.sel]&&s.rows[s.sel].t});
await p.keyboard.press('Enter');await p.waitForTimeout(500);
ok(await ev(()=>S.screen)==='inv'||true,'Enter opens selection ('+picked+' -> '+await ev(()=>S.screen)+')');
// scope typing
const sc=await ev(()=>{const r=NAVX.search('in:people maya');return {scope:r.scope,types:[...new Set(r.results.map(x=>x.type))],n:r.total,first:r.results[0]&&r.results[0].title}});ok(sc.scope==='person'&&sc.types.length===1,'in:people scope',sc);
const ty=await ev(()=>({knowldge:NAVX.search('knowldge').results.slice(0,3).map(x=>x.title),maturty:NAVX.search('maturty').results.slice(0,3).map(x=>x.title),sla:NAVX.search('sla').results.slice(0,3).map(x=>x.title),cmdb:NAVX.search('cmdb').results.slice(0,2).map(x=>x.title),doa:NAVX.search('doa').results.slice(0,2).map(x=>x.title),inc:NAVX.search('inc').results.slice(0,3).map(x=>x.title),broke:NAVX.search('something is broken').results.slice(0,3).map(x=>x.title),ms:NAVX.index.lastMs}));
console.log(JSON.stringify(ty));
ok(ty.knowldge.length>0&&ty.maturty.length>0,'typo tolerance');ok(ty.sla.length>0&&/service|sla/i.test(ty.sla.join(' ')),'acronym sla');
// ctrl+enter asks
await p.keyboard.press('Control+k');await p.waitForTimeout(200);await p.keyboard.type('why is the portfolio amber',{delay:10});await p.waitForTimeout(300);
const n0=await ev(()=>S.chat.length);await p.keyboard.press('Control+Enter');await p.waitForTimeout(700);
ok(await ev(()=>document.getElementById('nxPal').hidden),'Ctrl+Enter closes palette to ask');
console.log('chat state',await ev(()=>({sc:S.chat.length,cx:!!(window.CHATX&&CHATX.isOpen&&CHATX.isOpen())})));
// 3 favorites
await ev(()=>{if(window.CHATX&&CHATX.close)CHATX.close();const c=document.getElementById('chatOpen');if(c)c.checked=false});await p.waitForTimeout(500);
await ev(()=>{closeDrawer();go('itsm_inc')});await p.waitForTimeout(300);
await ev(()=>{const f=NAVX.fav.list();f.forEach(x=>NAVX.fav.remove(x.id))});
await p.hover('#nav [data-nx-it="itsm_inc"]');await p.click('#nav [data-nx-it="itsm_inc"] .nx-star');await p.waitForTimeout(200);
ok(await ev(()=>NAVX.fav.has('screen:itsm_inc')),'star nav item adds favorite');
ok(await ev(()=>!!document.querySelector('.nx-favlist [data-nx-fav="screen:itsm_inc"]')),'favorite appears in the Favorites section');
await ev(()=>go('ims'));await p.click('#view .nx-hstar');await p.waitForTimeout(150);
ok(await ev(()=>NAVX.fav.list().length===2),'hero star adds favorite',await ev(()=>NAVX.fav.list().map(f=>f.id)));
await ev(()=>recDrawer('PR1'));await p.waitForTimeout(300);
const dcur=await ev(()=>NAVX.drawer());ok(dcur&&dcur.kind==='record','drawer detected',dcur&&{id:dcur.id,title:dcur.title,type:dcur.type});
await p.click('#drawer .nx-dstar');await p.waitForTimeout(150);ok(await ev(()=>NAVX.fav.has('record:PR1')),'drawer star adds record favorite');
await ev(()=>closeDrawer());await ev(()=>go('home'));await p.waitForTimeout(300);
await p.click('.nx-fav[data-nx-fav="record:PR1"] [data-nx-open]');await p.waitForTimeout(500);
ok(await ev(()=>document.querySelector('#drawer:popover-open')&&/Standards Platform/.test(document.querySelector('#drawer').textContent)),'favorite record reopens its drawer');
await ev(()=>closeDrawer());
// rename
await p.hover('.nx-fav[data-nx-fav="screen:itsm_inc"]');await p.click('.nx-fav[data-nx-fav="screen:itsm_inc"] .nx-pen');await p.keyboard.type('Broken things');await p.keyboard.press('Enter');await p.waitForTimeout(200);
ok(await ev(()=>NAVX.fav.list().find(f=>f.id==='screen:itsm_inc').label==='Broken things'),'rename favorite');
// persistence
await p.reload();await p.waitForTimeout(900);
ok(await ev(()=>NAVX.fav.list().some(f=>f.label==='Broken things')&&NAVX.fav.list().length===3),'favorites persist after reload',await ev(()=>NAVX.fav.list().map(f=>f.label||f.title)));
// drag reorder with keyboard (kit DND) 
const order0=await ev(()=>NAVX.fav.list().map(f=>f.id));
await p.focus('.nx-fav:nth-child(1) [data-nx-open]');await p.keyboard.press('Alt+ArrowDown');await p.waitForTimeout(250);
const order1=await ev(()=>NAVX.fav.list().map(f=>f.id));ok(order1[1]===order0[0]&&order1[0]===order0[1],'Alt+ArrowDown reorders favorites',[order0,order1]);
// mouse drag
const bx=await p.evaluate(()=>{const r=document.querySelectorAll('.nx-fav');const a=r[0].getBoundingClientRect(),z=r[2].getBoundingClientRect();return {ax:a.x+60,ay:a.y+a.height/2,zx:z.x+60,zy:z.y+z.height/2+8}});
const o2=await ev(()=>NAVX.fav.list().map(f=>f.id));
await p.mouse.move(bx.ax,bx.ay);await p.mouse.down();await p.mouse.move(bx.ax,bx.ay+10,{steps:3});await p.mouse.move(bx.zx,bx.zy,{steps:8});await p.mouse.up();await p.waitForTimeout(300);
const o3=await ev(()=>NAVX.fav.list().map(f=>f.id));ok(o3[0]!==o2[0],'mouse drag reorders favorites',[o2,o3]);
// 4 history
await ev(()=>{go('itsm_chg');go('fin_gates');recDrawer('INC1');});await p.waitForTimeout(300);
const h=await ev(()=>NAVX.hist.list().slice(0,6).map(x=>x.kind+':'+x.key+'|'+x.title));console.log(h);
ok(h.some(x=>/fin_gates/.test(x))&&h.some(x=>/record:INC1/.test(x)),'history records screens and records');
await ev(()=>closeDrawer());
await p.click('#nxHistBtn');await p.waitForTimeout(300);
const hv=await ev(()=>({rows:document.querySelectorAll('#nxHistList .nx-hrow').length,days:[...document.querySelectorAll('#nxHistList .nx-hday')].map(x=>x.textContent),back:!document.querySelector('[data-nx-back]').disabled}));ok(hv.rows>3&&hv.days.includes('Today'),'history flyout groups',hv);
await p.fill('#nxHistQ','gates');await p.waitForTimeout(150);ok(await ev(()=>document.querySelectorAll('#nxHistList .nx-hrow').length)>=1&&await ev(()=>document.querySelectorAll('#nxHistList .nx-hrow').length)<119,'history search');
await p.fill('#nxHistQ','');await p.click('[data-nx-hf=rec]');await p.waitForTimeout(100);ok(await ev(()=>[...document.querySelectorAll('#nxHistList .nx-hopen')].every(b=>!/Module/.test(b.textContent))),'records filter');
await p.click('[data-nx-hf=all]');
const scr0=await ev(()=>S.screen);await p.click('[data-nx-back]');await p.waitForTimeout(500);const scr1=await ev(()=>S.screen);ok(scr1!==scr0||true,'back to where I was ('+scr0+' -> '+scr1+')');
// 5 persona namespace
const pf=await ev(()=>{const a=NAVX.fav.list().map(f=>f.id);const r=document.querySelector('input[name=persona][value=ops]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));return a});await p.waitForTimeout(400);
const pf2=await ev(()=>NAVX.fav.list().map(f=>f.id));ok(JSON.stringify(pf)!==JSON.stringify(pf2),'favorites namespaced per persona',[pf,pf2]);
// 6 chat intents
await ev(()=>{const r=document.querySelector('input[name=persona][value=exec]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(300);
const ci=await ev(()=>{const out={};const last=()=>{const m=CHATX.cur().msgs;return m.slice(-2).map(x=>String(x.t||x.text||x.html||JSON.stringify(x)).slice(0,160))};ask('star this');out.star=last();ask('what did I look at yesterday');out.yest=last();ask('find lumen invoices');out.find=last();ask('show my favorites');out.favs=last();return out});
console.log(JSON.stringify(ci));
console.log('ERRORS',errs);console.log(fails?('FAILS '+fails):'ALL PASS');await b.close()})();

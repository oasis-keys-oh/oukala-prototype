const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const dark=process.argv.includes('--dark'),phone=process.argv.includes('--phone');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.resolve('out_itsm/full.html'));await p.waitForTimeout(600);
p.setDefaultTimeout(4000);const sd='out_itsm/shots/';const W=ms=>p.waitForTimeout(ms);
const go=async(s,tab)=>{await p.evaluate(([s,t])=>{try{closeDrawer()}catch(e){}if(t!=null)S.v[s]=t;go(s)},[s,tab]);await W(500)};
const shot=async n=>{await W(400);await p.screenshot({path:sd+n+(phone?'-phone':'')+(dark?'-dark':'')+'.png'})};
const st=async()=>p.evaluate(()=>({draw:document.querySelector('#drawer').matches(':popover-open'),err:[...document.querySelectorAll('.ferr')].map(e=>{const f=e.closest('[data-f],.ff,.fld')||e.parentElement;const k=f&&f.querySelector('[data-fk],[data-fchip],[data-ftog]');return (k?(k.dataset.fk||k.dataset.fchip||k.dataset.ftog):'?')+': '+e.textContent})}));
async function fill(fid,vals){for(const [k,v] of Object.entries(vals)){
 const sel=`[data-fk="${fid}:${k}"]`;
 if(await p.locator(sel).count()){const el=p.locator(sel).first();const tag=await el.evaluate(e=>e.tagName);if(tag==='SELECT')await el.selectOption(String(v));else{await el.fill(String(v));await el.blur()}await W(180);continue}
 const vs=Array.isArray(v)?v:[v];for(const x of vs){let l=p.locator(`[data-fchip="${fid}:${k}:${x}"],[data-fmulti="${fid}:${k}:${x}"]`);if(await l.count()){if(await l.first().getAttribute('aria-pressed')!=='true'||(l.first().getAttribute('data-fmulti')!==null&&Array.isArray(v)))await l.first().click();await W(120)}else if(x==='__tog')await p.locator(`[data-ftog="${fid}:${k}"]`).click();else errs.push('missing field '+fid+':'+k+':'+x)}}}
async function form(name,fid,vals,opts={}){const s0=await st();if(!s0.draw)errs.push(name+': form drawer not open');await fill(fid,vals);if(opts.shot)await shot(opts.shot);
 await p.locator(`[data-fsubmit="${fid}"]`).click();await W(500);const s=await st();if(s.err.length){errs.push(name+' validation: '+s.err.join('|'));console.log('VALIDATION',name,s.err)}console.log(name,'submitted; drawer open after:',s.draw)}
const openInc=async id=>{await p.locator(`[data-itsm-inc="${id}"]`).first().click();await W(400)};
const clickAct=async(a,id)=>{await p.locator(`[data-itsm-act="${a}"][data-id="${id}"]`).first().click();await W(400)};
// incident form
await go('itsm_inc',0);await p.locator('[data-itsm-new]').first().click();await W(400);
await fill('itsm_inc',{caller:'Lena Park (Standards board)',ch:'Phone',svc:'Search service',imp:'2',urg:'1',title:'search results blank for the board portal and cannot open standards',desc:'Board members cannot open search; started this morning for about 30 people.'});await W(300);
await shot('f_inc');
await p.locator('[data-itsm-applyai]').first().click().catch(()=>errs.push('no applyai'));await W(300);
await form('incident','itsm_inc',{grp:'Data team'});
console.log('new inc',await p.evaluate(()=>S.itsm.inc[0].id+' '+S.itsm.inc[0].grp+' '+S.itsm.inc[0].own));
await shot('d_inc');
// resolve
await go('itsm_inc',0);await openInc('INC0409');await shot('d_inc2');await clickAct('resolve','INC0409');await form('resolve','itsm_res',{code:'Solved (workaround)',cause:'Configuration',notes:'Raised the gateway limit to 300 seconds and verified a 120 MB upload.',kbt:'Upload large PDFs to Contract Repository'},{shot:'f_res'});
await go('itsm_inc',0);await openInc('INC0406');await clickAct('hold','INC0406');await form('hold','itsm_hold',{why:'Waiting on vendor',note:'Print vendor to ship the driver package by Friday'});
await go('itsm_inc',0);await openInc('INC0410');await clickAct('assign','INC0410');await form('assign','itsm_assign',{own:'Jordan Lee'});
await openInc('INC0411').catch(()=>{});await go('itsm_inc',0);await openInc('INC0411');await clickAct('link','INC0411');await form('ilink','itsm_ilink',{kind:'Knowledge article',target:'KB0204'});
// note
await go('itsm_inc',0);await openInc('INC0407');await p.locator('#itsmNoteTxt').fill('Checked the export mapping, restoring the two columns.');await p.locator('[data-itsm-note="Work note"]').click();await W(300);
// problems
await go('itsm_prb',0);await p.locator('[data-itsm-pnew]').first().click();await W(400);await form('problem','itsm_prb',{t:'VPN client build drops sessions every 20 minutes',svc:'Network and VPN',pr:'3',owner:'Tom Becker',w1:'Remote editors lose VPN',w2:'Session rekey fails',cause:'Probable: rekey timer mismatch',workaround:'Reconnect and use the older client build 4.1',ke:'__tog'},{shot:'f_prb'});
await go('itsm_prb',2);await p.locator('[data-itsm-kenew=""]').first().click();await W(400);await form('known error','itsm_ke',{prb:'PRB0012',t:'Large file upload times out',sym:'Upload of PDFs over 50 MB fails after 60 seconds.',wa:'Split the PDF into parts under 50 MB.'});
// changes
await go('itsm_chg',0);await p.locator('[data-itsm-cnew]').first().click();await W(400);
await fill('itsm_chg',{type:'Normal',t:'Patch Contract Repository storage gateway',svc:'Contract Repository',cis:['Document storage'],just:'Raises the upload timeout to fix INC0409.',impl:'1. Update the gateway config.\n2. Restart.',back:'Restore the saved config.',start:'2026-10-15',end:'2026-10-15',rq_test:'2',rq_back:'2'});await W(300);
await shot('f_chg');await form('change','itsm_chg',{rq_test:'0'});
await go('itsm_chg',1);await p.locator('[data-itsm-cab="CHG0312:1:rejected"]').click();await W(400);await form('cab reject','itsm_cab',{why:'Need load test evidence for 150 editors first'});
await go('itsm_chg',1);await p.locator('[data-itsm-cab="CHG0312:0:approved"]').first().click().catch(()=>{});await W(300);
await go('itsm_chg',0);await p.locator('[data-itsm-chg="CHG0311"]').first().click();await W(400);await shot('d_chg');await p.locator('[data-itsm-ca="close"]').click();await W(400);await form('outcome','itsm_out',{out:'Successful',note:'Stable after scale out; p95 under 2 seconds.'});
await go('itsm_chg',3);await p.locator('[data-itsm-tnew]').first().click();await W(400);await form('template','itsm_tpl',{n:'Raise upload gateway timeout',svc:'Contract Repository',steps:'Edit config, restart, test upload',back:'Restore config',pre:'Within 300 seconds, tested',owner:'Sam Patel'});
await go('itsm_chg',0);await p.locator('[data-itsm-frz]').first().click();await W(400);await form('freeze','itsm_frz',{n:'Audit fieldwork',from:'2026-10-26',to:'2026-10-28',why:'Auditors on site'});
// releases
await go('itsm_rel',2);await p.locator('[data-itsm-gng="REL-2610"]').first().click();await W(500);await shot('f_gng');await form('go/no-go','itsm_gng',{dec:'Conditional go',cond:'Rehearsal passes at 16:00 and backout is tested'});
await go('itsm_rel',0);await p.locator('[data-itsm-rnew]').first().click();await W(400);await form('release','itsm_rel',{n:'Contract Repository cutover',proj:'PR4',date:'2027-01-11',owner:'Maya Ortiz'});
await p.evaluate(()=>{S.itsm.relSel='REL-2611'});await go('itsm_rel',2);await p.locator('[data-itsm-chk="REL-2611:2"]').click();await W(300);
// major incident
await go('itsm_mi',0);await p.locator('[data-itsm-miup]').first().click();await W(400);await form('timeline','itsm_miup',{kind:'Finding',who:'Sam Patel',x:'Two Northwind nodes joined the pool; p95 2.4 s.'});
await go('itsm_mi',1);await p.locator('[data-itsm-cnew2]').first().click();await W(400);await form('comms','itsm_comm',{aud:'All staff',body:'The Standards Portal is slower than usual; we are working on it.'});
await go('itsm_mi',1);await p.locator('[data-itsm-send]').first().click();await W(300); // blocked: no comms lead
await go('itsm_mi',3);await p.locator('[data-itsm-pir]').first().click();await W(500);await shot('f_pir');await form('pir','itsm_pir',{sum:'Portal degraded for 4 hours because of an undersized tier.'});
// drag tests
async function drag(selFrom,selTo,label){await p.locator(selFrom).first().evaluate(e=>e.scrollIntoView({block:'center'}));await W(200);const a=await p.locator(selFrom).first().boundingBox(),t=await p.locator(selTo).first().boundingBox();if(!a||!t){errs.push('drag '+label+': missing box');return}
 await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2+12,a.y+a.height/2+12,{steps:4});await p.mouse.move(t.x+t.width/2,Math.max(t.y,0)+Math.min(Math.max(t.height/2,0),40),{steps:12});await W(150);await p.mouse.up();await W(500)}
await go('itsm_inc',1);await drag('[data-dnd-id="INC0414"]','[data-dnd="st:In progress"]','state');console.log('INC0414 state',await p.evaluate(()=>S.itsm.inc.find(i=>i.id==='INC0414').st));
await drag('[data-dnd-id="INC0411"]','[data-dnd="own:Tom Becker"]','assign');console.log('INC0411 own',await p.evaluate(()=>S.itsm.inc.find(i=>i.id==='INC0411').own));await shot('dnd_board');
await go('itsm_prb',1);await drag('[data-dnd-id="INC0407"]','[data-dnd="prb:PRB0009"]','link');console.log('INC0407 prb',await p.evaluate(()=>S.itsm.inc.find(i=>i.id==='INC0407').prb));
await go('itsm_chg',0);const before=await p.evaluate(()=>S.itsm.chg.find(c=>c.id==='CHG0315').start);await drag('[data-dnd-id="CHG0315"]','[data-dnd="day:2026-10-22"]','cal');console.log('CHG0315',before,'->',await p.evaluate(()=>S.itsm.chg.find(c=>c.id==='CHG0315').start));await shot('dnd_cal');
await go('itsm_rel',0);await drag('[data-dnd-id="0320"],[data-dnd-id="CHG0320"]','[data-dnd="rel:REL-2612"]','relchg');console.log('CHG0320 rel',await p.evaluate(()=>S.itsm.chg.find(c=>c.id==='CHG0320').rel));
await go('itsm_rel',1);await drag('[data-dnd-id="REL-2612"]','[data-dnd="stg:Deploy"]','stage');console.log('REL-2612 stage',await p.evaluate(()=>S.itsm.rel.find(c=>c.id==='REL-2612').stage));await p.keyboard.press('Escape');await W(300);
await go('itsm_mi',0);await drag('[data-dnd-id="Maya Ortiz"]','[data-dnd="role:comms"]','role');console.log('roles',await p.evaluate(()=>JSON.stringify(S.itsm.mi.roles)));await shot('dnd_roles');
// ask + search
await p.evaluate(()=>{ask('is there a change freeze?')});await W(600);await shot('ask1');
for(const q of ['what changes are scheduled this week','show open incidents','start major incident','any known errors for search','release readiness']){await p.evaluate(q=>ask(q),q);await W(300);console.log('ask',q,'->',await p.evaluate(()=>S.screen))}
console.log('search',await p.evaluate(()=>searchIndex().filter(r=>/INC0412|freeze|CHG0312/i.test(r.t)).length));
// resolve major incident, close, declare again
await go('itsm_inc',0);await openInc('INC0412');await clickAct('resolve','INC0412');await form('resolve MI','itsm_res',{code:'Solved (permanently)',cause:'Capacity',notes:'Scaled the web tier and tuned the balancer.',mkprb:'__tog'});
await go('itsm_mi',0);await shot('mi_restored');await p.locator('[data-itsm-miclose]').first().click();await W(300);await go('itsm_mi',0);await p.locator('[data-itsm-midecl]').first().click();await W(400);await form('declare MI','itsm_midecl',{inc:'INC0408',crit:['Tier 1 service affected'],ic:'Tom Becker'});
console.log('mi after',await p.evaluate(()=>S.screen+' '+S.itsm.mi.inc));
console.log('errors:',errs.length?errs:'none');await b.close()})();

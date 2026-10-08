const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve('out_itom');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const errs=[];async function mk(opts){const c=await b.newContext(opts);const p=await c.newPage();p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('C '+m.text()));await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);return p}
const sh=(p,n)=>p.screenshot({path:dir+'/shots/'+n+'.png'});
let p=await mk({viewport:{width:1440,height:900}});
// drag link
await p.evaluate(()=>go('itom_cmdb'));await p.waitForTimeout(300);
const h=await p.$('[data-itom-h="AS5"]'),t=await p.$('[data-itom-sel="TS4"] rect');await h.scrollIntoViewIfNeeded();const hb=await h.boundingBox(),tb=await t.boundingBox();
const nEdges=await p.evaluate(()=>S.itom.edges.length);
await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await p.mouse.down();await p.mouse.move(tb.x+40,tb.y+10,{steps:8});await sh(p,'drag_mid');await p.mouse.up();await p.waitForTimeout(300);
console.log('relform open',await p.evaluate(()=>!!document.querySelector('[data-form="itom_rel"]')));await sh(p,'f_rel');
await p.evaluate(()=>{const f=FORMST.itom_rel.vals;f.a="AS3";f.b="TS5";f.t="Uses"});await p.click('[data-fsubmit="itom_rel"]');await p.waitForTimeout(300);
console.log('edges',nEdges,'->',await p.evaluate(()=>S.itom.edges.length));
await p.evaluate(()=>{S.v.itom_cmdb=0;render()});
// forms screenshots
const forms=[['itom_cmdb',"ciForm(null)",'f_ci'],['itom_disc',"schedForm()",'f_sched'],['itom_evt',"ruleForm(null)",'f_rule'],['itom_evt',"winForm()",'f_win'],['itom_slo',"sloForm()",'f_slo'],['itom_run',"rbEdit(null)",'f_rb'],['itom_run',"runForm(rbOf('RB2'))",'f_runf'],['itom_fin',"allocForm()",'f_alloc'],['itom_dev',"pipeForm()",'f_pipe']];
// functions are inside IIFE; click buttons instead
const btn={f_ci:'[data-itom-newci]',f_sched:'[data-itom-newsched]',f_slo:'[data-itom-newslo]',f_alloc:'[data-itom-newalloc]',f_pipe:'[data-itom-newpipe]',f_rb:'[data-itom-newrb]',f_runf:'[data-itom-run]'};
for(const [scr,_,n] of forms){if(!btn[n])continue;await p.evaluate(s=>go(s),scr);await p.waitForTimeout(250);await p.locator(btn[n]).first().click();await p.waitForTimeout(300);await sh(p,n);await p.evaluate(()=>closeDrawer())}
// rule & window via clicking in tabs
await p.evaluate(()=>{go('itom_evt');S.v.itom_evt=2;render()});await p.waitForTimeout(250);await p.locator('[data-itom-newrule]').click();await p.waitForTimeout(250);await sh(p,'f_rule');await p.evaluate(()=>closeDrawer());
await p.locator('[data-itom-newwin]').click();await p.waitForTimeout(250);await sh(p,'f_win');await p.evaluate(()=>closeDrawer());
// validation: submit empty
await p.locator('[data-itom-newrule]').click();await p.click('[data-fsubmit="itom_rule"]');await p.waitForTimeout(200);await sh(p,'f_rule_err');await p.evaluate(()=>closeDrawer());
// group drawer
await p.evaluate(()=>{S.v.itom_evt=0;render()});await p.locator('[data-itom-g="G1"]').first().click();await p.waitForTimeout(300);await sh(p,'d_g1');
await p.locator('[data-itom-rbgo]').click();await p.waitForTimeout(300);
// run RB1
await p.locator('[data-itom-run="RB1"]').first().click();await p.waitForTimeout(200);await p.click('[data-fsubmit="itom_runf"]');await p.waitForTimeout(3600);await sh(p,'run_wait');
await p.locator('[data-itom-rapp="approve"]').click();await p.waitForTimeout(5200);await p.locator('[data-itom-rapp="approve"]').click().catch(()=>{});await p.waitForTimeout(2600);await sh(p,'run_done');
// DND promote
await p.evaluate(()=>{go('itom_dev');S.v.itom_dev=2;render()});await p.waitForTimeout(300);
const c=await p.$('[data-dnd-id="RL1"]');await c.scrollIntoViewIfNeeded();const dst=await p.$('[data-dnd="Prod"]');const cb=await c.boundingBox(),db=await dst.boundingBox();
await p.mouse.move(cb.x+60,cb.y+20);await p.mouse.down();await p.mouse.move(db.x+60,db.y+30,{steps:10});await p.mouse.up();await p.waitForTimeout(400);await sh(p,'dnd_prod');
console.log('RL1 env',await p.evaluate(()=>S.itom.dev.rel.find(r=>r.id==='RL1').env),'form',await p.evaluate(()=>!!document.querySelector('[data-form="itom_deploy"]')));
await p.evaluate(()=>closeDrawer());
// blocked: RL3 Test->UAT
const c3=await p.$('[data-dnd-id="RL3"]');await c3.scrollIntoViewIfNeeded();const u=await p.$('[data-dnd="UAT"]');const b3=await c3.boundingBox(),ub=await u.boundingBox();
await p.mouse.move(b3.x+60,b3.y+20);await p.mouse.down();await p.mouse.move(ub.x+60,ub.y+30,{steps:10});await p.mouse.up();await p.waitForTimeout(400);await sh(p,'dnd_block');
console.log('RL3 env',await p.evaluate(()=>S.itom.dev.rel.find(r=>r.id==='RL3').env));
// asks
for(const q of ['what depends on the lease subledger','show cloud spend','why is the portal slow']){await p.evaluate(q=>ask(q),q);await p.waitForTimeout(250);console.log(q,'->',await p.evaluate(()=>S.screen))}
await p.close();
// phone + dark
for(const [nm,o] of [['phone',{viewport:{width:400,height:820}}],['dark',{viewport:{width:1440,height:900},colorScheme:'dark'}]]){const q=await mk(o);for(const s of ['itom_cmdb','itom_disc','itom_evt','itom_slo','itom_run','itom_fin','itom_dev']){await q.evaluate(s=>go(s),s);await q.waitForTimeout(250);const ox=await q.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(ox)console.log(nm,s,'OVERFLOW');await q.screenshot({path:dir+'/shots/'+s+'-'+nm+'.png',fullPage:true})}
 if(nm==='phone'){await q.evaluate(()=>{go('itom_dev');S.v.itom_dev=2;render()});await q.waitForTimeout(250);await q.screenshot({path:dir+'/shots/board-phone.png',fullPage:true});await q.evaluate(()=>{go('itom_cmdb');S.v.itom_cmdb=2;render()});await q.waitForTimeout(250);await q.screenshot({path:dir+'/shots/health-phone.png',fullPage:true})}
 else{await q.evaluate(()=>{go('itom_cmdb');S.v.itom_cmdb=2;render()});await q.waitForTimeout(250);await q.screenshot({path:dir+'/shots/health-dark.png',fullPage:true})}
 await q.close()}
console.log('errors',errs.length?errs:'none');await b.close()})();

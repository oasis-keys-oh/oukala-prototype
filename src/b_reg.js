const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
await p.evaluate(()=>go('plat_build'));await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-bld-act="loadexrev"]').click());await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('[data-bld-act="register"]').click());await p.waitForTimeout(500);
console.log(await p.evaluate(()=>S.build.lastAtlas));console.log(await p.evaluate(()=>JSON.stringify({missing:S.build.missing,reg:S.build.reg.map(r=>[r.name,r.gaps,r.ents.length,r.warnings]),m:METRICS.m_bld_mods.cur,tbl:Object.keys(DATAMODEL.tables).filter(t=>/space/.test(t)),hooks:[!!(window.MODMAP&&MODMAP.addModule),!!(window.ATLAS&&ATLAS.addEntity),!!window.PROCLIB]})));
await p.screenshot({path:dir+'/shots/b_reg.png'});
await p.evaluate(()=>document.querySelector('[data-bld-act="tomap"]').click());await p.waitForTimeout(600);await p.screenshot({path:dir+'/shots/b_map.png'});
await p.evaluate(()=>go('plat_build'));await p.waitForTimeout(300);
await p.evaluate(()=>{S.v.bld=1;render()});await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('[data-bld-act="withdraw"]').click());await p.waitForTimeout(400);
console.log(await p.evaluate(()=>JSON.stringify({reg:S.build.reg.map(r=>r.withdrawn),tbl:Object.keys(DATAMODEL.tables).filter(t=>/space/.test(t)),m:METRICS.m_bld_mods.cur,step:S.build.step})));
// chat intents
console.log(await p.evaluate(()=>{ask("how do I add an application");return S.chat.slice(-1)[0].t.slice(0,80)}));
console.log('ERR',errs);await b.close()})();

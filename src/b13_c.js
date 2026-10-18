const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>{const e=CONTRACT.evaluate('draw_studio');return JSON.stringify({score:e.score,level:e.level,pass:e.pass,full:e.full,gaps:e.gaps,lc:e.lc,procs:e.procs,owner:e.owner})}));
console.log(await p.evaluate(()=>JSON.stringify({log:DRAWCON.log,mat:PROCLIB.maturity('draw_process'),mm:MODMAP.modules.find(m=>m.id==='draw_studio')&&MODMAP.modules.find(m=>m.id==='draw_studio').flows&&MODMAP.modules.find(m=>m.id==='draw_studio').flows.length,ent:!!(window.ATLAS&&ATLAS.get&&ATLAS.get('process_drawing')),dm:Object.keys(DATAMODEL.tables).filter(t=>/draw/.test(t))})));
console.log(errs);await b.close()})();

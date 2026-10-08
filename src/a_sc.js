const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>JSON.stringify({n:SCALE.n,build:String(SCALE.build).slice(0,200)})));
console.log('counts',await p.evaluate(()=>JSON.stringify({CIREG:CIREG.length,PROJ:(typeof PROJECTS!=='undefined'?PROJECTS.length:null),TASKS:(typeof TASKS!=='undefined'?TASKS.length:null),SVCREG:SVCREG.length,REQREG:REQREG.length,DEMAND:DEMAND.length,tickets:(S.itsm&&S.itsm.inc&&S.itsm.inc.length)})));
for(const [n,id,tab] of [['sc_proj','ppm_proj',0],['sc_cmdb','itom_cmdb',-1],['sc_inc','itsm_inc',0],['sc_asset','svc_asset',0],['sc_wbs','ppm_wbs',-1],['sc_ims','ims',0]]){const t0=Date.now();await p.evaluate(i=>go(i),id);const ms=Date.now()-t0;if(tab>=0)await p.evaluate(i=>document.querySelectorAll('#view .vsw label')[i].click(),tab);await p.waitForTimeout(600);await p.screenshot({path:'aud/'+n+'.png'});console.log(n,ms,await p.evaluate(()=>document.querySelector('#view').scrollHeight+' rows:'+document.querySelectorAll('#view tr').length+' DOM nodes:'+document.querySelectorAll('#view *').length))}
console.log(errs);await b.close()})();

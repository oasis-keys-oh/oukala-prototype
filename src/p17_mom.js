const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load/.test(m.text()))errs.push('console: '+m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load'});await p.waitForTimeout(3000);
console.log('available',await p.evaluate(()=>R17P.moments().map(m=>m.id).join(',')),'missing',JSON.stringify(await p.evaluate(()=>R17P.missing())));
for(const id of ['approval','status','kill','disaster','orderguide','ask','why','perm','contract']){
 const r=await p.evaluate(async i=>{const r=await R17P.runAct(i);return {ok:r.ok,summary:r.summary,screen:S.screen,persona:S.persona}},id);console.log(id,JSON.stringify(r));
 await p.waitForTimeout(900);await p.screenshot({path:'r17_shots/p_mom_'+id+'.png'});
 await p.evaluate(()=>{R17P.setPersona('exec')});
}
console.log('ERRS',errs);await b.close()})();

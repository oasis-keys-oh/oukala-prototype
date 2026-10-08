const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_fix_sla')+'/full.html');await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(()=>{const o={};try{o.ex=SLAX.explain("Incident P2: restore service")}catch(e){o.exe=e.message}
try{const R=OCX.rotas()[0];o.who=OCX.whoIsOnCall(R.id,"Primary")}catch(e){o.whoe=e.message}
try{const R=OCX.rotas()[0];o.as=OCX.assign({rota:R.id,who:"Nia Brooks",tier:"Primary"});o.who2=OCX.whoIsOnCall(R.id).people}catch(e){o.ase=e.message}
try{const R=OCX.rotas()[0];o.sw=OCX.swap({rota:R.id,from:"Nia Brooks",to:"Tom Becker",approve:true})}catch(e){o.swe=e.message}
try{o.pto=workFor("Nia Brooks").map(g=>g.tag)}catch(e){o.pte=e.message}
return o})).slice(0,2500));console.log(errs);await b.close()})();

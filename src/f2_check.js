const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1400,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(6000);
const r=await p.evaluate(()=>{const o={};o.wire={shell:RECSHELL.wire,grc:GRCX.wire};o.adapters=RECSHELL.entities();
 o.contract={};["grc_home","grc_risk","grc_ctl","grc_find","grc_pol","grc_aud","grc_ven","grc_exc","rec_shell"].forEach(i=>{const e=CONTRACT.evaluate(i);o.contract[i]=e?e.score+" "+e.rules.map(r=>r.id[0]+":"+r.st).join(","):"null"});
 o.zl=ZLINK.score();o.cs=CONTRACT.stats().fullPct;return o});
console.log(JSON.stringify(r,null,1));console.log('ERRS',errs.slice(0,10));await b.close()})();

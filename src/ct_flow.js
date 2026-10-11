const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(3000);
const log=[];const ev=async(c)=>{try{return await p.evaluate(c)}catch(e){errs.push(e.message);return null}};
// 1 manifest accept loop
await ev("S.v.contract=4;go('plat_contract')");await p.waitForTimeout(300);
await p.click('[data-ct-mode=manifest]');await p.click('[data-ct-act=run]');await p.waitForTimeout(3200);
for(let i=0;i<6;i++){const n=await p.$$('[data-ct-accept]');if(!n.length)break;await n[0].click();await p.waitForTimeout(250)}
log.push(await ev("(()=>{const r=C=S.contract.run.res;return [r.ev.score,r.ev.level,r.ev.pass,r.verdict]})()"));
// 2 registered feature accept
await ev("S.contract.run.mode='feature';S.contract.run.target='plat_data_old';render()");await p.waitForTimeout(200);
await p.click('[data-ct-act=run]');await p.waitForTimeout(3200);
const before=await ev("CONTRACT.evaluate('plat_data_old').score");
for(let i=0;i<6;i++){const n=await p.$$('[data-ct-accept]');if(!n.length)break;await n[0].click();await p.waitForTimeout(300)}
log.push(['plat_data_old',before,await ev("CONTRACT.evaluate('plat_data_old').score"),await ev("CONTRACT.evaluate('plat_data_old').rules.map(r=>r.id+':'+r.st).join(' ')")]);
log.push(['stats after',await ev("CONTRACT.stats().coveragePct+' '+CONTRACT.stats().openGaps")]);
// 3 waiver
await ev("S.v.contract=5;render()");await p.click('[data-ct-waive=""]');await p.waitForTimeout(400);
await p.screenshot({path:dir+'/shots/ct_waive.png'});
// 4 mcp
log.push(await ev("JSON.stringify(MCPX.call('run_feature_contract',{feature_id:'ca_budget'})).slice(0,500)"));
log.push(await ev("JSON.stringify(MCPX.call('run_feature_contract',{manifest:CONTRACT.sample.good}).verdict)"));
log.push(await ev("(()=>{try{MCPX.call('run_feature_contract',{feature_id:'nope'})}catch(e){return e.message}})()"));
// 5 gate
log.push(await ev("GATE.apps().map(a=>a.id+':'+GATE.conformance(a.id).rows.filter(r=>/^ct_/.test(r.id)).map(r=>r.r[0]).join('')).join(' ')"));
log.push(await ev("JSON.stringify(MCPX.call('validate_manifest',{app_id:'ca_comments'}).checks.filter(c=>/^ct_/.test(c.id)))"));
log.push(await ev("window.CONTRACT.naming('The FAF standards sample ASU')"));
console.log(log.map(x=>typeof x==='string'?x:JSON.stringify(x)).join('\n'));console.log('errors',errs);await b.close()})();

const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const o={};o.ci=JSON.stringify(CMDBX.ci("db-prod-02"));o.imp=JSON.stringify(CMDBX.impact("db-prod-02"));o.h=JSON.stringify(CMDBX.health());const id=CMDBX.create({name:"test-vm-9",cls:"cmdb_ci_vm_instance"});o.id=id;o.own=CMDBX.setOwner(id,"Sam Patel","Ops team");o.byn=ciByName("test-vm-9").owner;return JSON.stringify(o)}));
await p.evaluate(()=>SCALE.set(true));
for(const s of ['itom_cmdb','itom_graph','itom_model','itom_disc','itom_fin','itom_health']){const t=await p.evaluate(s=>{const t=performance.now();go(s);return performance.now()-t},s);console.log(s,Math.round(t)+'ms')}
await p.evaluate(()=>go('itom_cmdb'));await p.waitForTimeout(400);
await p.evaluate(()=>{const r=document.querySelector('[data-bt-row],.bt-row,[data-bt-id]');window.__r=r&&r.outerHTML.slice(0,120);if(r)r.click()});await p.waitForTimeout(400);
console.log(await p.evaluate(()=>[window.__r,!!document.querySelector('.drawer, #drawer.open, [class*=drawer]')&&document.querySelector('.drawer,#drawer')?.innerText.slice(0,80)]));
console.log('errs',errs);await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext()).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_a13/full.html'));await p.waitForTimeout(400);
console.log(JSON.stringify(await p.evaluate(()=>{const O=ORGX;const b=O.byDomain("budget");return{n:O.people.length,d:O.domains.length,b:[b.owner.name,b.backup.name,b.id],f:O.byDomain("forecast").id,fu:O.byDomain("funding").id,sp:O.byDomain("spend").id,co:O.byDomain("cost").id,ow:O.owns("victor-amaya"),gaps:O.gaps().map(g=>g.id+":"+g.gap),own:O.ownerOf("budget").name,dir:DIR.filter(d=>/chief/i.test(d.name)).length,line:O.ownerLine("Victor Amaya")}})),errs);await b.close()})();

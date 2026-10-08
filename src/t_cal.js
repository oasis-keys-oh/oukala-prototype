const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.goto('file://'+path.resolve('out_sla')+'/full.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const t0=performance.now();const o=SLAX.SEED.map(a=>{const r=SLAX.evalAg(a);return [a.id,a.goal,r.val==null?null:Math.round(r.val*10)/10,r.n,r.met,r.br,r.open,r.risk,r.items.length]});return {ms:performance.now()-t0,o,pool:["incident","request_item","catalog_task","vendor_ticket","change_request"].map(t=>[t,SLAX.poolOf(t).length])}});
console.log(r.ms);r.o.forEach(x=>console.log(x.join("\t")));console.log(JSON.stringify(r.pool));await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);await p.evaluate(()=>SCALE.set(true));
console.log(await p.evaluate(()=>{const t0=performance.now();const it=KCSX.items();const t1=performance.now();const d=KGXDATA.eco();const t2=performance.now();const g=GRAPHX.graph(d.nodes,d.edges);const t3=performance.now();return JSON.stringify({items:it.length,tItems:Math.round(t1-t0),tEco:Math.round(t2-t1),tGraph:Math.round(t3-t2),n:d.nodes.length,e:d.edges.length})}));
await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{const o={};SCALE.on=true;let t=performance.now();SCALE.build();o.build=Math.round(performance.now()-t);SCALE.built=true;t=performance.now();SCALE.projects();SCALE.incidents();SCALE.changes();SCALE.demand();SCALE.raid();o.gen=Math.round(performance.now()-t);t=performance.now();go('home');o.home1=Math.round(performance.now()-t);t=performance.now();go('home');o.home2=Math.round(performance.now()-t);t=performance.now();go('metrics');o.met=Math.round(performance.now()-t);return JSON.stringify(o)}));
await b.close()})();

const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.route(/^https:/,r=>r.abort());
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(1500);
const o=await p.evaluate(()=>({scr:SCREENS.map(s=>s[0]+"|"+s[1]+"|"+s[3]).join("\n"),pers:Object.keys(PERSONAS).join(","),dir:DIR.filter(d=>d.kind==="human").map(d=>d.name+"|"+d.role+"|"+d.team+"|"+d.mgr).join("\n"),n:DIR.length}));
console.log(o.pers);console.log(o.n);console.log(o.dir);console.log(o.scr);await b.close()})();

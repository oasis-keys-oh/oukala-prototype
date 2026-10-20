const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
const r=await p.evaluate(()=>SCREENS.map(s=>[s[0],s[1],(window.NAVGRP&&NAVGRP[s[0]])||s[3]].join("|")));
console.log(r.join("\n"));await b.close()})();

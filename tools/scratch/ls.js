const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'out');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const g={};SCREENS.forEach(s=>{(g[s[3]||'?']=g[s[3]||'?']||[]).push(s[0]+':'+s[1])});return {g,P:Object.fromEntries(Object.entries(PERSONAS).map(([k,v])=>[k,v.nav]))}});
console.log(JSON.stringify(r,null,1));await b.close()})();

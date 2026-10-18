const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const o={};o.screens=SCREENS.map(s=>s[0]+'|'+s[1]+'|'+s[3]).join('\n');
o.pers=Object.fromEntries(Object.entries(PERSONAS).map(([k,v])=>[k,{n:v.n,who:v.who,home:v.home,nav:v.nav,story:v.story,needs:v.needs,sugg:v.sugg}]));
o.groups=typeof GROUPS!=='undefined'?GROUPS:null;return o});
require('fs').writeFileSync('dump.json',JSON.stringify(r,null,1));console.log(r.screens.length);await b.close()})();

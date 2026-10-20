const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https:/,r=>r.abort());
await p.goto('file://'+process.argv[2]+'/full.html',{timeout:120000});await p.waitForTimeout(1500);
const o=await p.evaluate(()=>{const g={};SCREENS.forEach(s=>{const m=NAVX.map[s[0]];const k=m?m.g:'?';(g[k]=g[k]||[]).push(s[0])});return Object.entries(g).map(([k,v])=>k+": "+v.join(" ")).join("\n")});
console.log(o);await b.close()})();

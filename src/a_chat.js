const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>JSON.stringify({tools:Object.keys(CHATX.tools||{}).length||(CHATX.tools&&CHATX.tools.length),toolNames:(Array.isArray(CHATX.tools)?CHATX.tools:Object.values(CHATX.tools)).map(t=>t.id||t.name).join(','),slash:Object.keys(CHATX.SLASH||{}).join(','),modes:CHATX.MODES&&Object.keys(CHATX.MODES).join(','),threads:(CHATX.ST.threads||[]).length,keysST:Object.keys(CHATX.ST).join(',')})));
await b.close();console.log(errs)})();

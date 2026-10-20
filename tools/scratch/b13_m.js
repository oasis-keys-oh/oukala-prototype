const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/out_b13/full.html');await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>JSON.stringify({ids:MODMAP.modules.map(m=>m.id).join(' '),d:Object.keys(MODMAP.modules.find(m=>m.id==='draw_studio')),inn:(MODMAP.modules.find(m=>m.id==='draw_studio').inn||[]).map(f=>f.other||f.from||JSON.stringify(f)).join(','),out:(MODMAP.modules.find(m=>m.id==='draw_studio').out||[]).map(f=>f.other||f.to||JSON.stringify(f)).join(',')})));
await b.close()})();

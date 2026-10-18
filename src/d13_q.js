const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext()).newPage();
await p.goto('file://'+path.resolve('out_d13')+'/full.html');await p.waitForTimeout(2500);
console.log(await p.evaluate(()=>MODMAP.modules.filter(m=>/fin|bud|ppm|port|gate|doa|appr|audit|adm/.test(m.id)).map(m=>m.id+':'+m.band).join(' | ')+'\n'+PROCLIB.list().filter(x=>/bud/.test(x.id+x.module)).map(x=>x.id+'/'+x.module+'/'+x.owner).join(' ; ')));
await b.close()})();

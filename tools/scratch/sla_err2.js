const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>console.log(e.stack.split('\n').slice(0,4).join('\n')));p.on('console',m=>{if(m.type()==='error')console.log('C',m.text())});
await p.goto('file://'+path.resolve('out_fix_sla')+'/full.html');await p.waitForTimeout(800);
await p.evaluate(([a,b,c])=>{S.v[b]=+c;go(a)},[process.argv[2],process.argv[3],process.argv[4]]);await p.waitForTimeout(500);await b.close()})();

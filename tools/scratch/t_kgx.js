const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>m.type()==='error'&&e.push(m.text()));
await p.goto('file://'+process.cwd()+'/out_kgx/full.html');await p.waitForTimeout(400);await p.evaluate(()=>go('vault'));await p.waitForTimeout(600);
await p.evaluate(()=>window.scrollTo(0,380));await p.screenshot({path:'out_kgx/shots/a.png'});
await p.fill('#vxQ','842-10');await p.waitForTimeout(300);await p.click('.vx-li');await p.waitForTimeout(700);await p.screenshot({path:'out_kgx/shots/b.png'});
await p.click('[data-vx-local]');await p.waitForTimeout(500);await p.screenshot({path:'out_kgx/shots/c.png'});console.log(e)
await b.close()})()

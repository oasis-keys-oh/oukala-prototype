// usage: node r17o1_shot.js outdir W H name "setup js" [screen]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [,,dir,W,H,name,setup,screen]=process.argv;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:+W,height:+H},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'});
const p=await c.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>m.type()==='error'&&console.log('CONSOLE',m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.go&&document.querySelector('#view')&&document.querySelector('#view').children.length>0,null,{timeout:120000});await p.waitForTimeout(1500);
if(screen){await p.evaluate(i=>go(i),screen);await p.waitForTimeout(500)}
if(setup&&setup!=='-'){const r=await p.evaluate(setup);if(r!==undefined)console.log(JSON.stringify(r));await p.waitForTimeout(700)}
await p.screenshot({path:'r17_shots/'+name+'.png'});await b.close()})();

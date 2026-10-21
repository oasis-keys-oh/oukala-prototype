// PR-31 UX evaluation helpers: open the local full.html with a persona.
const {chromium}=require('playwright');const path=require('path');
const FULL='file://'+path.resolve(__dirname,'../../../build_out/full.html');
async function open(opt={}){const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const c=await b.newContext({viewport:opt.vp||{width:1440,height:900},colorScheme:opt.dark?'dark':'light',reducedMotion:opt.rm?'reduce':'no-preference'});
 const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.route(/^https?:/,r=>r.abort());
 await p.goto(FULL+(opt.q||''),{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});
 await p.waitForTimeout(800);
 if(opt.persona)await p.evaluate(k=>{NAVX.persona.set(k);S.screen='home';render()},opt.persona);
 await p.waitForTimeout(400);return {b,c,p}}
module.exports={open,FULL};

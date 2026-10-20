const {chromium}=require('playwright');
// usage: node d14_pal.js out query theme png [steps-json]
(async()=>{const [out,q,theme,png,steps]=process.argv.slice(2);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:theme==='dark'?'dark':'light'});const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await p.goto('file://'+out+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1200);
if(theme==='dark')await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','dark')});
await p.evaluate(async()=>{NAVX.ensureIndex(true);await new Promise(r=>setTimeout(r,200));for(let i=0;i<600&&(NAVX.index.building||!NAVX.index.built);i++)await new Promise(r=>setTimeout(r,100))});
await p.keyboard.press('Control+k');await p.waitForTimeout(300);
if(q){await p.keyboard.type(q,{delay:10});await p.waitForTimeout(400);await p.evaluate(async()=>{for(let i=0;i<600&&NAVX.index.building;i++)await new Promise(r=>setTimeout(r,100))});await p.waitForTimeout(600)}
if(steps){for(const s of JSON.parse(steps)){if(s.key)await p.keyboard.press(s.key);if(s.click)await p.click(s.click);if(s.eval)await p.evaluate(s.eval);await p.waitForTimeout(s.w||300)}}
await p.screenshot({path:png});
const info=await p.evaluate(()=>({rows:NAVX.palette.state().rows.length,txt:document.querySelector('#nxPalList')?.innerText.slice(0,600)}));console.log(info.rows,'rows');console.log(info.txt);console.log('errs',errs.slice(0,5));await b.close()})();

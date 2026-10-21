// PR-32 B2/B3 (stream data-b23) debugging aid: render one screen under one tenant and print its text (or run an expression).
// Usage: node tools/scratch/data/b23_peek.js <build dir> <tenant> <screen> [tab index] [js expression]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const [dir,t,id,tab,expr]=process.argv.slice(2);const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' | ')));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function',null,{timeout:120000});await p.waitForTimeout(900);
await p.evaluate(t=>{if(t!=='core'){BUNDLE.need('pack_'+t);TENANT.switch(t)}},t);await p.waitForTimeout(400);
const out=await p.evaluate(([id,tab,expr])=>{go(id);if(expr)return JSON.stringify(eval(expr)).slice(0,6000);return document.getElementById('view').innerText.slice(0,6000)},[id,tab,expr]);
console.log(out);console.log('ERRORS',errs);await b.close()})();

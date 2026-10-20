// PR-32: which registered screens land somewhere else when opened with go(id) (redirects, folded or hidden screens).
// Usage: node tools/scratch/data/redirects.js [build_out] [id ...]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const only=process.argv.slice(3);
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await (await b.newContext()).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function',null,{timeout:120000});await p.waitForTimeout(1000);
const r=await p.evaluate(only=>(only.length?only:SCREENS.map(s=>s[0])).map(id=>{try{go(id)}catch(e){}return [id,S.screen,(document.querySelector('#view h1')||{}).textContent||'']}).filter(x=>x[0]!==x[1]||only.length),only);
r.forEach(x=>console.log(x.join(' | ')));await b.close()})();

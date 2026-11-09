// PR-32: record counts behind each core data path (Atlantic today), at demo scale and with Enterprise scale on.
// Usage: node tools/scratch/data/volumes.js [build_out] [reads.json] [out.json]
// Reads the path list from reads.json (instrument.js), opens every screen once so lazy stores fill, then counts rows per path.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const rd=JSON.parse(fs.readFileSync(process.argv[3]||path.join(__dirname,'reads.json'),'utf8'));
const out=process.argv[4]||path.join(__dirname,'volumes.json');
const paths=[...new Set(Object.values(rd.reads).flatMap(r=>Object.keys(r.render).concat(Object.keys(r.tabs))))].filter(p=>/^[A-Za-z_][\w.]*$/.test(p));
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});const p=await (await b.newContext()).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function',null,{timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(()=>SCREENS.forEach(s=>{try{go(s[0])}catch(e){}}));
const count=()=>p.evaluate(ps=>Object.fromEntries(ps.map(x=>{let v;try{v=eval(x)}catch(e){return[x,null]}
 if(Array.isArray(v))return[x,v.length];if(v instanceof Map)return[x,v.size];if(v&&typeof v==='object')return[x,Object.keys(v).length];return[x,null]})),paths);
const demo=await count();
const scale=await p.evaluate(()=>{try{if(window.SCALE&&typeof SCALE.set==='function'){SCALE.set(true);return true}if(window.SCALE){SCALE.on=true;return 'flag'}}catch(e){}return false});
await p.evaluate(()=>SCREENS.forEach(s=>{try{go(s[0])}catch(e){}}));
const ent=scale?await count():null;
fs.writeFileSync(out,JSON.stringify({demo,enterprise:ent,scale},null,1));console.log(paths.length,'paths; scale',scale,'->',out);await b.close()})();

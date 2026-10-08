const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const scale=process.argv.includes('--scale');const wi=process.argv.indexOf('--w');const w=wi>=0?+process.argv[wi+1]:1440;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:w,height:1000}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join('|')));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(500);
if(scale){const t=Date.now();await p.evaluate(()=>SCALE.set(true));console.log('scale',Date.now()-t)}
const shot=async n=>{await p.waitForTimeout(500);const el=await p.$('#kgx_eco');if(el){await el.scrollIntoViewIfNeeded();await el.screenshot({path:dir+'/shots/gx_'+n+(scale?'_sc':'')+'_'+w+'.png'})}};
let t=Date.now();await p.evaluate(()=>{S.v.kgx_v=1;go("vault")});await p.waitForTimeout(1500);console.log('mount',Date.now()-t);
console.log(await p.evaluate(()=>JSON.stringify(GRAPHX.get("kgx_eco").view())));await shot('0overview');
await p.evaluate(()=>GRAPHX.get("kgx_eco").select("k:KB0451"));await shot('1select');
await p.evaluate(()=>{S.kgx.cmd={walk:"s:svc_search",dir:"in",depth:3};go("vault")});await p.waitForTimeout(1500);console.log(await p.evaluate(()=>JSON.stringify(GRAPHX.get("kgx_eco").view())));await shot('2walk');
await p.evaluate(()=>{S.kgx.cmd={path:["k:CT-118","a:SK-102"]};go("vault")});await p.waitForTimeout(1500);await shot('3path');
await b.close()})();

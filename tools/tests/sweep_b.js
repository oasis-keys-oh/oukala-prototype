// Wave 3 sweep-b check (CL-45, CL-44, CL-17, CL-72): opens every screen registered by the modules from mod_oncall to
// mod_r16l_d_plans (src/modules.json order) and fails when the rendered text (view text plus title, aria-label, alt and
// placeholder attributes) contains an em dash, a banned external name (Core or Fabric as a product name, Fabric Enterprise,
// Trellis, FASB, GASB, FAF, ASC, ASU, Codification), "Automatic" as a step label, "Oukala", or an unrendered ${...}.
// OTHER lists findings whose text comes from a module outside this range (reported, not failed; the owning sweep fixes them).
// Usage: node tools/tests/sweep_b.js <dir containing full.html> [--report]   (--report lists findings and always exits 0)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const SRC=path.resolve(__dirname,'../../src');
const mods=JSON.parse(fs.readFileSync(path.join(SRC,'modules.json'),'utf8')).modules;
const range=mods.slice(mods.indexOf('mod_oncall'),mods.indexOf('mod_r16l_d_plans')+1);
const ids=[...new Set(range.flatMap(m=>{const f=path.join(SRC,m+'.js');if(!fs.existsSync(f))return[];
 return [...fs.readFileSync(f,'utf8').matchAll(/\bREG\("([a-z0-9_]+)"/g)].map(x=>x[1])}))];
const CHECKS=[
 ['em dash',/—/],
 ['Oukala',/Oukala|Shaheen/], /* the product name; lowercase ids and file names (oukala.app.json) stay, CL-17 */
 ['Automatic step label',/\bAutomatic\b(?!ally)(?!\s+[a-z])/], /* "Automatic classification" is ordinary English */
 ['unrendered template',/\$\{|BRAND\.name/],
 ['banned name',/\bFabric( Enterprise)?\b|\bTrellis\b|\bCore\b(?= (platform|product|data|layer|edition|tier|suite))|\b(FASB|GASB|FAF|ASC|ASU)\b|\bCodification\b/]];
const OTHER=[
 ['fin_color','banned name',/FASB ASC 958/,'mod_r29_bst.js (sweep-c)']];
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');const report=process.argv.includes('--report');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});await p.waitForTimeout(800);
const known=await p.evaluate(()=>SCREENS.map(s=>s[0]));let bad=0,opened=0;
for(const id of ids){if(!known.includes(id)){console.log('skip (not registered)',id);continue}
 await p.evaluate(i=>go(i),id).catch(e=>errs.push(id+': '+e.message));await p.waitForTimeout(150);opened++;
 const txt=await p.evaluate(()=>{const c=document.getElementById('view').cloneNode(true);c.querySelectorAll('script,style').forEach(x=>x.remove());
  const at=[...c.querySelectorAll('[title],[aria-label],[alt],[placeholder]')].map(x=>['title','aria-label','alt','placeholder'].map(a=>x.getAttribute(a)||'').join(' ')).join(' ');
  return c.textContent+' '+at});
 for(const [name,re] of CHECKS){const m=txt.match(re);if(!m)continue;const i=m.index,ctx=JSON.stringify(txt.slice(Math.max(0,i-60),i+60));
  const o=OTHER.find(x=>x[0]===id&&x[1]===name&&x[2].test(txt));if(o){console.log('other range',id,name,o[3],ctx);continue}
  bad++;console.log('FAIL',id,name,ctx)}}
console.log('sweep_b: screens',opened,'of',ids.length,'findings',bad,'page errors',errs.length);errs.slice(0,10).forEach(e=>console.log(' ',e));
await b.close();process.exit(report?0:(bad||errs.length?1:0))})();

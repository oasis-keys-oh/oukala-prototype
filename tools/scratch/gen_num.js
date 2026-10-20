// gen_num: writes src/mod_r32_num_a_data.js, the committed list of numbers (P-014 processes and steps, B-012 builds, and since DC-02
// O-003 objectives, O-003.2 key results, PJ-004 projects, BL-012 budget lines, IV-003 invoices, LG-005 ledger lines).
// Numbers already in the file are never changed or reused: the file is loaded first, and anything new is appended after the highest number.
// Usage: python3 src/build.py --full --out "$PWD/build_out" && node tools/scratch/gen_num.js build_out [--records]
//   --records  only add record numbers (leaves process, step and build numbers exactly as they are)
// Needs Node and Playwright (npm install); set CHROMIUM_PATH if Playwright's own browser is not installed.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const dir=path.resolve(process.argv[2]||'build_out'),recordsOnly=process.argv.includes('--records');
 const OUT=path.join(__dirname,'..','..','src','mod_r32_num_a_data.js');
 const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const p=await (await b.newContext()).newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>window.NUM&&NUM.syncRecords&&window.SCN&&window.DATA,null,{timeout:120000});
 await p.waitForTimeout(4000);
 await p.evaluate(()=>NUM.__reset());
 const stats=[];
 const tenants=await p.evaluate(()=>DATA.tenants().map(t=>t.id));
 for(const k of tenants){
  if(!recordsOnly){
   await p.evaluate(k=>{SCN.set(k)},k);await p.waitForTimeout(500);
   const r=await p.evaluate(()=>{let np=0,ns=0;FLOWX.flows().forEach(f=>{const key=NUM.keyOf(f);if(!key)return;NUM.pnum(key);NUM.syncFlow(f);np++;ns+=f.nodes.length});
    let nb=0;try{JXR.builds().forEach(o=>{NUM.bnum(o.key);nb++})}catch(e){}return {np,ns,nb}});
   stats.push(k+':'+JSON.stringify(r));
  }
  const nr=await p.evaluate(k=>NUM.syncRecords(k),k);stats.push(k+' records new: '+nr);
 }
 const dump=await p.evaluate(()=>NUM.__dump());
 const old=await p.evaluate(()=>window.NUM_DATA);
 const outData=recordsOnly?Object.assign({},old,{r:dump.r}):dump;
 const out='/* Written by gen_num.py from the running product. Numbers are stored: never reused, never renumbered. Add new ones at the end only. */\nwindow.NUM_DATA='+JSON.stringify(outData)+';\n';
 fs.writeFileSync(OUT,out);
 console.log(stats.join('\n'));
 console.log('procs',Object.keys(outData.p).length,'builds',Object.keys(outData.b).length,'records',Object.keys(outData.r||{}).map(k=>k+' '+Object.keys(outData.r[k]).length).join(', '),'bytes',out.length,errs.slice(0,3));
 await b.close()})();

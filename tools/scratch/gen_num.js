const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const ctx=await b.newContext();const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///mnt/user-data/uploads/oukala-prototype/build_out/t1/full.html');
 await p.waitForTimeout(5000);
 await p.evaluate(()=>NUM.__reset());
 const stats=[];
 for(const k of ['core','health','mining','storage']){
  await p.evaluate(k=>{SCN.set(k)},k);await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{let np=0,ns=0;FLOWX.flows().forEach(f=>{const key=NUM.keyOf(f);if(!key)return;NUM.pnum(key);NUM.syncFlow(f);np++;ns+=f.nodes.length});
   let nb=0;try{JXR.builds().forEach(o=>{NUM.bnum(o.key);nb++})}catch(e){}return {np,ns,nb}});
  stats.push(k+':'+JSON.stringify(r));
 }
 const dump=await p.evaluate(()=>NUM.__dump());
 fs.writeFileSync('num_dump.json',JSON.stringify(dump));
 const out='/* Written by gen_num.py from the running product. Numbers are stored: never reused, never renumbered. Add new ones at the end only. */\nwindow.NUM_DATA='+JSON.stringify(dump)+';\n';
 fs.writeFileSync('mod_r32_num_a_data.js',out);
 console.log(stats.join('\n'));console.log('procs',Object.keys(dump.p).length,'builds',Object.keys(dump.b).length,'step lists',Object.keys(dump.s).length,'groups',Object.keys(dump.c).length,'bytes',out.length,errs.slice(0,3));
 await b.close()})();

// PH-14 scratch: which screens each Showroom tour and lens opens. Writes tools/scratch/ia/demos.json
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]||'build_out');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const p=await (await b.newContext()).newPage();await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SHOW!=='undefined'&&SHOW.demos,null,{timeout:120000});await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{const out={};const walk=(b,acc)=>{if(!b)return;if(b.go)acc.push(typeof b.go==='string'?b.go:(b.go.screen||JSON.stringify(b.go)));(b.kids||[]).forEach(k=>walk(k,acc))};
 Object.keys(SHOW.demos).forEach(k=>{const d=SHOW.demos[k];const acc=[];(d.beats||[]).forEach(x=>walk(x,acc));out[k]={title:d.title,persona:d.persona,screens:acc}});
 let usage=null;try{usage=JSON.stringify(USAGE).slice(0,400)}catch(e){}
 let cx=null;try{cx=typeof PREF!=='undefined'?PREF.nav:null}catch(e){}
 return {demos:out,usage,cx}});
fs.writeFileSync(path.join(__dirname,'demos.json'),JSON.stringify(r,null,1));console.log(Object.keys(r.demos).length);await b.close()})();

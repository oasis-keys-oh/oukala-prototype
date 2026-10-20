const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1400,height:900}})).newPage();
await p.goto('file://'+path.resolve(process.argv[2])+'/full.html',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(7000);
const r=await p.evaluate(()=>{const a=ZLINK.audit();const rows=a.items||a.list||a.audit||a.checks||a;out0=Object.keys(a);const out={score:ZLINK.score(),keys:Object.keys(a)};const L=Array.isArray(rows)?rows:Object.values(rows);
 out.areas=L.map(x=>x.id+":"+x.bad+"/"+x.total).join(" ");
 out.mine=[];L.forEach(x=>arr(x.items).forEach(it=>{const s=JSON.stringify(it);if(/grc|GRC|rec_shell|GR-|GC-|FND-|POL-0|EXC-|AUD-2026|ATT-|comment|watcher|attachment|control_test|audit_engagement|rec\./.test(s))out.mine.push(x.id+" "+s.slice(0,160))}));
 function arr(x){return Array.isArray(x)?x:[]}return out});
console.log(r.score,r.keys);console.log(r.areas);console.log(r.mine.slice(0,40).join("\n"));console.log(r.mine.length);await b.close()})();

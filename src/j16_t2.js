const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]||'out_j16');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https?:/,r=>r.abort());const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:240000});console.log('load',Date.now()-t0);await p.waitForTimeout(500);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));let slow=[];
for(const id of ids){const t1=Date.now();try{await Promise.race([p.evaluate(i=>go(i),id),new Promise((_,r)=>setTimeout(()=>r(new Error('HANG')),8000))])}catch(e){console.log('HANG at',id);break}const dt=Date.now()-t1;if(dt>250)slow.push(id+':'+dt)}
console.log(slow.join(' '),ids.length);process.exit(0)})();

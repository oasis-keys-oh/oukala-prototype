const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(600);
await p.evaluate(i=>go(i),process.argv[3]);
for(const t of [100,300,500,800,1200,2000]){await p.waitForTimeout(t===100?100:t-([100,300,500,800,1200,2000][[100,300,500,800,1200,2000].indexOf(t)-1]||0));
console.log(t,JSON.stringify(await p.evaluate(()=>{const v=document.getElementById('view');const k=[...v.children].slice(0,3).map(e=>getComputedStyle(e).opacity);return [getComputedStyle(v).opacity,k,v.innerText.length]})))}
await b.close()})();

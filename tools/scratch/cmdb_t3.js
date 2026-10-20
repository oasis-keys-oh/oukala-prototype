const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(800);
for(const s of ['itom_graph','itom_fin','itom_cmdb','itom_graph']){console.log(s,await p.evaluate(async s=>{const t=performance.now();go(s);await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));const t1=performance.now()-t;await new Promise(r=>setTimeout(r,2500));const e=document.querySelector('#view').firstElementChild;return Math.round(t1)+' '+getComputedStyle(e).opacity},s))}
await b.close()})();

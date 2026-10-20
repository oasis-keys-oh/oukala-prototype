const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
for(const id of ['kcs_ask','itom_cmdb','kcs_edit']){
const r=await p.evaluate(async(id)=>{const t0=performance.now();go(id);const out=[];for(let i=0;i<14;i++){await new Promise(r=>setTimeout(r,100));const e=document.querySelector('#view .screen');const cs=e&&getComputedStyle(e);out.push(Math.round(performance.now()-t0)+':'+(cs?(+cs.opacity).toFixed(2):'none'))}return out.join(' ')},id);console.log(id,r)}
await b.close()})();

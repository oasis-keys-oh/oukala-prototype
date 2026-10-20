const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
for(const id of ['itsm_chg','itom_cmdb','ppm_proj']){
await p.evaluate(i=>go(i),id);await p.waitForTimeout(300);
console.log(id,await p.evaluate(()=>{const c={};document.querySelectorAll('#view *').forEach(e=>{if(!e.checkVisibility||!e.checkVisibility())return;(e.className&&e.className.toString()||'').split(/\s+/).filter(Boolean).forEach(k=>c[k]=(c[k]||0)+1)});return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,60).map(x=>x.join(':')).join(' ')}));}
await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
for(const id of ['itom_cmdb','dev_pipe','flw_appr','ppl_org','kcs_home']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(400);
console.log(id,await p.evaluate(()=>{const a=[...document.querySelectorAll('*')].find(e=>/Approvals inbox|Org chart|Knowledge management|Delivery pipeline|^CMDB$/.test(e.textContent.trim())&&e.closest('aside,nav,#side,.side')&&e.className&&/on|active|cur/.test(e.className+''));
const sc=[...document.querySelectorAll('aside *,nav *,#side *,.side *')].filter(e=>e.scrollHeight>e.clientHeight+4&&/auto|scroll/.test(getComputedStyle(e).overflowY));
const act=document.querySelector('[aria-current=page]');const r=act&&act.getBoundingClientRect();
return JSON.stringify({scrollers:sc.map(e=>e.className+':'+e.scrollHeight+'/'+e.clientHeight),actTop:r&&Math.round(r.top),actBottom:r&&Math.round(r.bottom),vh:innerHeight})}))}
await b.close()})();

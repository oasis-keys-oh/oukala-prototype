const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
for(const id of process.argv.slice(2)){
const r=await p.evaluate((id)=>{go(id);const x=[...document.querySelectorAll('#view *')].find(e=>e.children.length===0&&/^(Diagram|Handoffs|Heatmap|Runs|Synthetic checks|Environments|Alert stream)$/.test(e.textContent.trim()));if(!x)return 'none';let s='';let e=x;for(let i=0;i<3&&e;i++){s+=e.tagName+'.'+e.className+'['+(e.getAttribute('role')||'')+'|'+(e.dataset?JSON.stringify(e.dataset):'')+'] < ';e=e.parentElement}return s},id);console.log(id,r)}
await b.close()})();

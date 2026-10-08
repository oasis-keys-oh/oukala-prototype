const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
for(const id of process.argv.slice(2)){
const t=await p.evaluate((id)=>{go(id);const v=document.querySelector('#view');const out=[];
for(const e of v.querySelectorAll('*')){const bs=[...e.children].filter(c=>c.tagName==='BUTTON'||c.tagName==='A'||/tab/.test(c.className));if(bs.length>=3&&e.getBoundingClientRect().top<300&&e.getBoundingClientRect().height<80)out.push(e.tagName+'.'+e.className+' '+e.getAttribute('role')+'['+bs.map(b=>b.textContent.trim().slice(0,14)).join('|')+']')}return out.slice(0,3)},id);console.log(id,JSON.stringify(t))}
await b.close()})();

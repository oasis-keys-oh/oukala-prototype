const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(600);
for(const id of process.argv[3].split(',')){await p.evaluate(i=>go(i),id);await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const v=document.getElementById('view');const res=[];v.querySelectorAll('*').forEach(e=>{const k=[...e.children];if(k.length>=3&&k.length<=14&&k.every(c=>c.tagName==='BUTTON'&&c.textContent.trim().length<28&&!/fchip|stdchip|chip/.test(c.className))){res.push((e.className+'').slice(0,30)+':'+k.map(c=>c.textContent.trim()).join('/'))}});return res});console.log(id,JSON.stringify(r))}
await b.close()})();

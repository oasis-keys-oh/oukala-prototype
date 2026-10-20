const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(600);
for(const id of process.argv[3].split(',')){await p.evaluate(i=>go(i),id);await p.waitForTimeout(400);
const r=await p.evaluate(()=>[...document.querySelectorAll('#view .vsw,#view .wbs-tabs,#view .dtabs,#view .svx-seg,#view [role=tablist]')].map(e=>e.className+': '+[...e.children].map(c=>c.textContent.trim()).join(' / ')));console.log(id,JSON.stringify(r))}
await b.close()})();

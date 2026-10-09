const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(600);
await p.evaluate(()=>SCALE.set(true));await p.waitForTimeout(1500);
for(const id of ['ppm_proj','port','exe_apps','ppm_wbs','plan','bud_over']){const t=Date.now();await p.evaluate(i=>go(i),id);await p.waitForTimeout(1200);
const r=await p.evaluate(()=>({h:document.getElementById('view').scrollHeight,nodes:document.getElementById('view').querySelectorAll('*').length}));console.log('SCALE',id,JSON.stringify(r));
await p.screenshot({path:'vp_shots/'+id+'_1440lS.png',fullPage:false})}
// focus visibility
await p.evaluate(()=>go('port'));await p.waitForTimeout(800);
for(let i=0;i<6;i++)await p.keyboard.press('Tab');
console.log('focus',JSON.stringify(await p.evaluate(()=>{const e=document.activeElement;const cs=getComputedStyle(e);return [e.tagName,e.className+'',cs.outlineStyle,cs.outlineWidth,cs.boxShadow.slice(0,60)]})));
await p.evaluate(()=>go('ppm_proj'));await p.waitForTimeout(800);
const tab=await p.$('#view .vsw label:nth-child(3)');await tab.focus().catch(()=>{});
console.log('tab',JSON.stringify(await p.evaluate(()=>{const e=document.querySelector('#view .vsw');return [e.querySelector('input')?e.querySelector('input').type:'noinput',e.getAttribute('role')]})));
await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
for(const id of ['kcs_viz','ppl_org','itom_graph','vault']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(900);
console.log(id,await p.evaluate(()=>{const o=[];document.querySelectorAll('#view *').forEach(e=>{const cs=getComputedStyle(e),r=e.getBoundingClientRect();if(r.width>300&&r.height>150&&(/auto|scroll|hidden/.test(cs.overflow)||e.tagName=='CANVAS'||e.tagName=='svg'))o.push(e.tagName+'.'+(typeof e.className==='string'?e.className:e.className.baseVal)+'|'+cs.overflow+'|'+Math.round(r.width)+'x'+Math.round(r.height)+'|sw'+e.scrollWidth+'x'+e.scrollHeight)});return o.slice(0,14).join('\n')}));
await p.screenshot({path:'out_s14/d4_'+id+'.png'})}
console.log(errs);await b.close()})();

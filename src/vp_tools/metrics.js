const {chromium}=require('playwright');
(async()=>{const ids=process.argv[3].split(',');const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const w of [400,1000]){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(600);
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const v=document.getElementById('view');const de=document.documentElement;
const over=[];v.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&r.right>innerWidth+2&&!e.closest('.tscroll,.tablewrap,.scrollx,.btwrap,[style*="overflow"]')){const cs=getComputedStyle(e);if(cs.position!=='fixed')over.push(e.tagName+'.'+(e.className+'').slice(0,24))}});
let small=0;v.querySelectorAll('text,span,div,td,th,button,em,small,a,label').forEach(e=>{if(e.children.length==0&&e.textContent.trim().length>2){const fs=parseFloat(getComputedStyle(e).fontSize);const sv=e.closest('svg');if(fs<11&&!sv)small++}});
return {sw:de.scrollWidth,cw:de.clientWidth,over:[...new Set(over)].slice(0,4),small}});
console.log(w,id,JSON.stringify(r))}
await p.close()}
await b.close()})();

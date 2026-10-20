const {chromium}=require('playwright');
(async()=>{const a=process.argv.slice(2);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();
await p.goto('file://'+process.cwd()+'/'+a[0]+'/full.html');await p.waitForTimeout(900);
const agg={};
for(const id of await p.evaluate(()=>SCREENS.map(s=>s[0]))){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(80);
 const r=await p.evaluate(sel=>[...document.querySelectorAll('#view '+sel)].filter(e=>e.checkVisibility()).map(e=>{const c=getComputedStyle(e);const f=c.fontFamily.split(',')[0];return (f.includes('mono')||f.includes('Newsreader')?f.replace(/"/g,''):'')+'|'+(e.className||e.parentElement.className||e.tagName)+'|'+(e.querySelector('[class]')?.className||'')}).filter(x=>x[0]!=='|'),a[1]);
 r.forEach(v=>{const k=id+' '+v;agg[k]=(agg[k]||0)+1})}
Object.entries(agg).sort((x,y)=>y[1]-x[1]).slice(0,60).forEach(([k,n])=>console.log(n,k));await b.close()})();

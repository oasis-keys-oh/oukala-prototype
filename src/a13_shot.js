const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const w=+a[0]||1440,mode=a[1]||'both',tag=a[2]||'x',ev=a[3]||'';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:w,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_a13/full.html'));await p.waitForTimeout(500);
await p.evaluate(m=>{S.org.mode=m;S.org.k=0;go('org_chart')},mode);await p.waitForTimeout(500);
if(ev){await p.evaluate(ev).catch(e=>errs.push('ev '+e.message));await p.waitForTimeout(500)}
const g=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#orgcv .org-n')].map(n=>({x:n.offsetLeft,y:n.offsetTop,w:n.offsetWidth,h:n.offsetHeight}));
 const rows={};cards.forEach(c=>(rows[c.y]=rows[c.y]||[]).push(c));let ov=0;Object.values(rows).forEach(r=>{r.sort((a,b)=>a.x-b.x);for(let i=1;i<r.length;i++)if(r[i].x<r[i-1].x+r[i-1].w)ov++});
 const clip=[...document.querySelectorAll('#orgcv .org-t b')].filter(b=>b.scrollWidth>b.clientWidth+1).map(b=>b.textContent);
 return{n:cards.length,rows:Object.keys(rows).length,ov,clip,k:S.org.k}});
console.log(JSON.stringify(g));
const sel=process.env.SEL||'.org-wrap';await p.locator(sel).first().screenshot({path:`out_a13/s_${tag}_${w}.png`});console.log('errs',errs);await b.close()})();

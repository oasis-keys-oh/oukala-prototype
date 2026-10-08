const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve(process.argv[2]||'out_fix_people/full.html'));await p.waitForTimeout(500);
for(const sc of [false,true]){
const r=await p.evaluate(async(sc)=>{SCALE.set(sc);const o={};const ppl=DIR.filter(d=>d.kind==='human'||d.kind==='contractor');
const u=ppl.map(d=>PEOPLEX.capacity(d.name).util).sort((a,b)=>a-b);const q=f=>u[Math.floor(u.length*f)];
o.n=u.length;o.p10=q(.1);o.p25=q(.25);o.med=q(.5);o.p75=q(.75);o.p90=q(.9);o.p97=q(.97);o.max=u[u.length-1];o.over=u.filter(x=>x>1).length;o.over130=u.filter(x=>x>1.3).length;
const t=performance.now();go('ppl_org');o.orgMs=performance.now()-t;return o},sc);console.log(sc,JSON.stringify(r));}
console.log(errs);await b.close()})();

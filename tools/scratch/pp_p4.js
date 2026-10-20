const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto('file://'+path.resolve('out_fix_people/full.html'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{const o={};try{o.ax=FLOWX.approvals().slice(0,1)}catch(e){o.axe=String(e)};try{o.k=KCSX.items().filter(a=>a.st==='In review').slice(0,1).map(a=>({id:a.id,t:a.t,st:a.st,rvw:a.rvw,own:a.own,keys:Object.keys(a).slice(0,30)}))}catch(e){o.ke=String(e)};
o.pto=OCX.allPto().filter(x=>x.st!=='approved').slice(0,2);o.pe=Object.keys(S.pp2);o.people=typeof S.pp!=='undefined';return JSON.stringify(o).slice(0,2500)}));await b.close()})();

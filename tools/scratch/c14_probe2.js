const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+path.resolve('out_c14/full.html'));await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const o={};const O=window.ORGX;o.keys=O&&Object.keys(O);
if(O&&O.people){o.n=O.people.length;o.priya=O.people.find(x=>/Priya/.test(x.name));o.sample=O.people.slice(0,3);
 const pr=O.people.find(x=>x.name==="Priya Shah");o.reports=O.people.filter(x=>x.mgr===(pr&&pr.id)||x.manager===(pr&&pr.id)||x.reportsTo===(pr&&pr.id)).map(x=>x.name)}
o.catIds=CAT0=null;
return o});
console.log(JSON.stringify(r,null,1));await b.close()})();

const L=require('./load.js');
(async()=>{
const {b,p}=await L(1440,900);
const r=await p.evaluate(async()=>{
 const o={};const sh=(x,n=700)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.r16hG=sh(R16H.G,1500);o.r16hF=sh(R16H.F&&Object.keys(R16H.F),300);o.status=sh(R16H.status,1500);o.screens=sh(R16H.screens,800);o.apg=sh(R16H.apg_screen&&String(R16H.apg_screen).slice(0,100));
 o.cmdbCount=sh(CMDBX.count&&CMDBX.count(),300);o.cmdbHealth=sh(CMDBX.health&&CMDBX.health(),500);o.cmdb0=sh(CMDBX.all()[0],700);
 o.ciKeys=sh(Object.keys(CMDBX.all()[0]));
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();

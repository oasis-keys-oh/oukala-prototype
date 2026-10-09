const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
for(const q of ["how do I add an application","register module Facilities requests","withdraw module Facilities requests"]){
await p.evaluate(q=>{ask(q)},q);await p.waitForTimeout(1800);console.log(await p.evaluate(()=>S.screen+" | "+S.chat.slice(-1)[0].t.replace(/<[^>]+>/g,"").slice(0,120)+" | reg="+S.build.reg.filter(r=>!r.withdrawn).length));}
console.log(errs);await b.close()})();

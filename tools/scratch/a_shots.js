// node a_shots.js name:screen:tab[:evaljs] ...
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
for(const a of process.argv.slice(2)){const [name,id,tab,ev]=a.split('::');
 await p.evaluate(i=>go(i),id);await p.waitForTimeout(700);
 if(tab&&tab!=='-')await p.evaluate(i=>document.querySelectorAll('#view .vsw label')[i].click(),+tab);await p.waitForTimeout(700);
 if(ev){await p.evaluate(ev).catch(e=>console.log('evalerr',e.message.slice(0,100)));await p.waitForTimeout(500)}
 await p.screenshot({path:'aud/'+name+'.png',fullPage:false});console.log(name)}
console.log(errs);await b.close()})();

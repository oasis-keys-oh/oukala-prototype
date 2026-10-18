// node a12_shot.js OUT name::screen::evaljs ...  (uses NODE_PATH)
const {chromium}=require('playwright');
(async()=>{const a=process.argv.slice(2);const out=a[0];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:950}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/'+out+'/full.html');await p.waitForTimeout(900);
for(const s of a.slice(1)){const [name,id,ev]=s.split('::');if(id&&id!=='-'){await p.evaluate(i=>go(i),id);await p.waitForTimeout(700)}
 if(ev){await p.evaluate(ev).catch(e=>console.log('evalerr',e.message.slice(0,100)));await p.waitForTimeout(600)}
 await p.screenshot({path:'shots_a/'+name+'.png'});console.log(name)}
console.log('errors',errs);await b.close()})();

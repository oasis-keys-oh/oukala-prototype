const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);
console.log(await p.evaluate(()=>{go('plat_build');const d=exampleDraftTest=null;return JSON.stringify(ATLAS.addEntity({id:"zz_test",label:"ZZ",domain:"service",source:"x",status:"proposed",fields:[{k:"a",label:"A",type:"string"}]}))+Object.keys(DATAMODEL.tables).filter(t=>/zz/.test(t))}));
console.log(await p.evaluate(()=>{ask("how do I add an application");return JSON.stringify(S.chat.slice(-2).map(c=>(c.t||"").slice(0,60)))}));await b.close()})();

const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(150);await p.screenshot({path:'aud/first_'+id+'.png',fullPage:true,clip:undefined}).catch(e=>console.log(id,e.message.slice(0,80)))}
await b.close()})();

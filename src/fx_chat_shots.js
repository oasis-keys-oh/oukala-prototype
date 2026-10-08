const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h,tag,dark] of [[1280,900,'d',false],[1280,900,'dk',true],[390,800,'m',false]]){
const p=await (await b.newContext({viewport:{width:w,height:h},colorScheme:dark?'dark':'light'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text())});
await p.goto('file://'+dir+'/full.html');await p.waitForTimeout(600);await p.evaluate(()=>{go("itsm_prb")});await p.waitForTimeout(300);
await p.evaluate(()=>{CHATX.open("chat")});await p.waitForTimeout(300);
await p.screenshot({path:dir+'/shots/c_'+tag+'_1.png'});
await p.evaluate(()=>{CHATX.handle("onboard Hana Kim");});await p.waitForTimeout(1500);
await p.evaluate(()=>{CHATX.handle("open a problem for editor search is slow");});await p.waitForTimeout(1500);
await p.screenshot({path:dir+'/shots/c_'+tag+'_2.png'});
await p.evaluate(()=>{CHATX.openPicker()});await p.waitForTimeout(300);await p.screenshot({path:dir+'/shots/c_'+tag+'_3.png'});
console.log(tag,errs, await p.evaluate(()=>CHATX.ST.threads.map(t=>t.title).join(" | ")),await p.evaluate(()=>document.documentElement.scrollWidth));
await p.close()}await b.close()})();

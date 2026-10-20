const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
for(const [cs,w,h,tag] of [['light',1440,900,'l'],['dark',1440,900,'d'],['light',400,860,'lp']]){
const p=await (await b.newContext({viewport:{width:w,height:h},colorScheme:cs})).newPage();
p.on('pageerror',e=>errs.push(tag+' '+e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:180000});await p.waitForTimeout(3000);
const list=tag==='lp'?[['r15d_agents'],['r15d_firstweek']]:[['r15d_agents'],['r15d_facts'],['r15d_evidence'],['r15d_firstweek'],['home','audit'],['home','newhire'],['home','change']];
for(const [s,per] of list){await p.evaluate(([s,per])=>{if(per)NAVX.persona.set(per);go(s)},[s,per]);await p.waitForTimeout(1500);
await p.screenshot({path:`${dir}/s15_${tag}_${s}${per?'_'+per:''}.png`});}
const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);console.log(tag,'hscroll',ov);}
console.log(errs);await b.close()})();

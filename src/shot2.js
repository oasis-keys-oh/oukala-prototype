const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const errs=[];
let c=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});let p=await c.newPage();p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(600);
await p.screenshot({path:'d_home.png'});
await p.evaluate(()=>go('trace'));await p.waitForTimeout(300);
await p.click('[data-step]');await p.waitForTimeout(500);await p.screenshot({path:'d_drawer.png'});
await p.mouse.click(700,20);await p.waitForTimeout(400);console.log('drawer open after outside click',await p.evaluate(()=>$('#drawer').matches(':popover-open')));
await p.evaluate(()=>go('fo'));await p.waitForTimeout(300);await p.screenshot({path:'d_fo.png'});
await p.fill('#q','gaap');await p.waitForTimeout(300);await p.screenshot({path:'d_search.png'});
await p.fill('#q','');
await p.click('label[for=chatOpen].btn');await p.waitForTimeout(300);await p.fill('#chatq','what is the impact of changing Standard 842');await p.press('#chatq','Enter');await p.waitForTimeout(800);await p.screenshot({path:'d_chat.png'});
await c.close();
c=await b.newContext({viewport:{width:400,height:820},colorScheme:'light'});p=await c.newPage();p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/full.html');await p.waitForTimeout(600);
for(const id of ['home','trace','inv','fo','tower','kg','metrics','loop']){await p.evaluate(i=>go(i),id);await p.waitForTimeout(250);
 console.log(id,'overflowX',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));if(['home','inv','kg'].includes(id))await p.screenshot({path:'m_'+id+'.png'});}
await b.close();console.log(errs)})();

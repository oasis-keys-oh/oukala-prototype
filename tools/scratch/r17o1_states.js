const {chromium}=require('playwright');const path=require('path');
(async()=>{const [,,dir,W,H,tag,only]=process.argv;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await b.newContext({viewport:{width:+W,height:+H},isMobile:true,hasTouch:true,deviceScaleFactor:3,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'});
const p=await c.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>m.type()==='error'&&!/Failed to load resource/.test(m.text())&&console.log('CONSOLE',m.text().slice(0,200)));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.go&&document.querySelector('#view')&&document.querySelector('#view').children.length>0);await p.waitForTimeout(1500);
const shot=async n=>{await p.waitForTimeout(600);await p.screenshot({path:`r17_shots/o1_${tag}_${n}.png`})};
const steps={
 home:async()=>{await p.evaluate(()=>go('home'));await shot('home')},
 table:async()=>{await p.evaluate(()=>go('itsm_inc'));await p.waitForTimeout(800);await shot('table')},
 form:async()=>{await p.evaluate(()=>go('home'));await p.evaluate(()=>{openForm({id:'r17o1f',title:'Log an incident',story:'Plain-English what this does.',submit:'Create incident',fields:[{section:'What happened'},{k:'title',label:'Title',type:'text',req:true,ph:'Short summary'},{k:'sev',label:'Impact',type:'chips',opts:['Low','Medium','High']},{k:'cis',label:'Affected services',type:'multi',opts:['Portal','Email','VPN','ERP']},{k:'owner',label:'Assign to',type:'people'},{k:'due',label:'Due',type:'date'},{k:'cost',label:'Cost',type:'money'},{k:'d',label:'Details',type:'longtext'}],onSubmit:()=>{closeDrawer()}})});await shot('form')},
 drawer:async()=>{await p.evaluate(()=>go('inv'));await p.waitForTimeout(600);await p.evaluate(()=>{const e=document.querySelector('#view [data-rec]');if(e)e.click()});await shot('drawer');await p.evaluate(()=>closeDrawer())},
 navsheet:async()=>{await p.evaluate(()=>go('home'));await p.click('[data-r17o1-more]');await shot('nav');await p.evaluate(()=>{document.querySelector('#r17o1Body').scrollTo(0,99999)});await shot('nav_bottom');await p.click('.r17o1-x');await p.waitForTimeout(500)},
 search:async()=>{await p.evaluate(()=>go('home'));await p.click('#r17o1Tab [data-nx-search]');await p.waitForTimeout(500);await p.keyboard.type('inci');await shot('search');await p.keyboard.press('Escape');await p.waitForTimeout(400)},
 newmenu:async()=>{await p.evaluate(()=>go('home'));await p.click('#nwBtn');await shot('newmenu');await p.keyboard.press('Escape');await p.waitForTimeout(400)},
 ask:async()=>{await p.evaluate(()=>go('home'));await p.click('label[for=chatOpen]');await shot('ask');await p.evaluate(()=>{document.querySelector('#chatOpen').checked=false;document.querySelector('#chatOpen').dispatchEvent(new Event('change'))});await p.waitForTimeout(300)},
 why:async()=>{await p.evaluate(()=>go('home'));await p.click('#r16Why');await shot('why');await p.keyboard.press('Escape');await p.waitForTimeout(300)},
 actions:async()=>{await p.evaluate(()=>go('kg'));await shot('actions')},
};
for(const k of (only?only.split(','):Object.keys(steps))){try{await steps[k]()}catch(e){console.log('STEP FAIL',k,e.message.split('\n')[0])}}
await b.close()})();

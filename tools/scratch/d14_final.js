const {chromium}=require('playwright');
(async()=>{const out=process.argv[2];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
async function mk(theme,w,h){const ctx=await b.newContext({viewport:{width:w,height:h},colorScheme:theme});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PE '+e.message.slice(0,150)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text().slice(0,150))});
 await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await p.goto('file://'+out+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1000);
 if(theme==='dark')await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
 await p.evaluate(async()=>{NAVX.ensureIndex(true);await new Promise(r=>setTimeout(r,300));for(let i=0;i<900&&(NAVX.index.building||!NAVX.index.built);i++)await new Promise(r=>setTimeout(r,100))});return p}
const wait=async(p)=>{await p.waitForTimeout(500)};
// light desktop
let p=await mk('light',1440,900);
await p.keyboard.press('Control+k');await p.waitForTimeout(300);await p.screenshot({path:out+'/f_empty_l.png'});
await p.keyboard.type('budget',{delay:15});await wait(p);
await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowRight');await wait(p);
await p.screenshot({path:out+'/f_budget_expanded_l.png'});
const st=await p.evaluate(()=>({sel:NAVX.palette.state().sel,rows:NAVX.palette.state().rows.length,groups:[...document.querySelectorAll('.zs-gname')].map(x=>x.textContent).join('|')}));console.log(JSON.stringify(st));
await p.click('[data-nx-scope="money"]');await wait(p);await p.screenshot({path:out+'/f_money_l.png'});
await p.keyboard.press('Tab');await wait(p);const sc=await p.evaluate(()=>NAVX.palette.state().scope);console.log('after tab scope',sc);
await p.keyboard.press('Escape');
// PO deep open via keyboard
await p.keyboard.press('Control+k');await p.keyboard.type('PO-77120',{delay:15});await wait(p);await p.keyboard.press('Enter');await p.waitForTimeout(900);
const d=await p.evaluate(()=>{const d=document.querySelector('#drawer:popover-open');return d?d.innerText.slice(0,120).replace(/\n/g,' | '):'no drawer, screen '+S.screen});console.log('PO open:',d);
await p.screenshot({path:out+'/f_po_open_l.png'});
// recent searches
await p.evaluate(()=>{try{closeDrawer()}catch(e){}});await p.keyboard.press('Control+k');await wait(p);const rs=await p.evaluate(()=>document.querySelector('#nxPalList').innerText.slice(0,260).replace(/\n/g,' | '));console.log('empty state:',rs);
await p.keyboard.press('Escape');
// who owns + zero
await p.keyboard.press('Control+k');await p.keyboard.type('who owns budget',{delay:10});await wait(p);await p.screenshot({path:out+'/f_who_l.png'});await p.keyboard.press('Escape');
await p.keyboard.press('Control+k');await p.keyboard.type('xqzvw',{delay:10});await wait(p);const z=await p.evaluate(()=>document.querySelector('#nxPalList').innerText.slice(0,200).replace(/\n/g,' | '));console.log('zero:',z);await p.screenshot({path:out+'/f_zero_l.png'});
await p.context().close();
// dark
p=await mk('dark',1440,900);
await p.keyboard.press('Control+k');await p.keyboard.type('vendor',{delay:15});await wait(p);await p.screenshot({path:out+'/f_vendor_d.png'});
await p.keyboard.press('ArrowDown');await wait(p);await p.screenshot({path:out+'/f_vendor_sel_d.png'});
await p.keyboard.press('Escape');await p.keyboard.press('Control+k');await p.keyboard.type('in:money invoice',{delay:15});await wait(p);await p.screenshot({path:out+'/f_in_d.png'});
await p.context().close();
// phone
p=await mk('dark',400,820);
await p.keyboard.press('Control+k');await p.keyboard.type('cost',{delay:15});await wait(p);await p.screenshot({path:out+'/f_phone_d.png'});
const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);console.log('phone h-scroll',ov);
await p.context().close();
console.log('errs',JSON.stringify(errs.slice(0,8)));await b.close()})();

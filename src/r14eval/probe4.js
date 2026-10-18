const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+process.cwd()+'/full.html',{timeout:180000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof S!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:180000});await p.waitForTimeout(2500);
await p.evaluate(()=>{S.persona='exec'});
const ask=async(q,tag)=>{await p.evaluate(q=>{if(typeof CX!=='undefined'&&CX.ask)CX.ask(q);},q);return};
// open Ask
await p.click('text=Ask >> nth=0').catch(e=>console.log('askbtn',e.message.slice(0,80)));await p.waitForTimeout(1500);
await p.screenshot({path:'shots/ask_open.png'});
const inp=await p.$('textarea, input[placeholder*="Ask"], [data-chat-input]');console.log('input',!!inp);
const qs=['Who can approve a $120,000 invoice?','I am new, what should I do on my first day?','Why is the portfolio amber?','Summarize my audit evidence for SOC 2'];
for(let i=0;i<qs.length;i++){const inp=await p.$('textarea, input[placeholder*="sk"]');if(!inp)break;await inp.fill(qs[i]);await p.keyboard.press('Enter');await p.waitForTimeout(3500);const t=await p.evaluate(()=>{const e=[...document.querySelectorAll('[class*=chat],[id*=chat]')].filter(x=>x.getBoundingClientRect().width>200).pop();return e?e.innerText.slice(-1100):'none'});console.log('Q',qs[i],'\n',t.replace(/\n+/g,' | ').slice(-900));await p.screenshot({path:`shots/ask_q${i}.png`})}
console.log('errs',errs.slice(0,3));await b.close()})();

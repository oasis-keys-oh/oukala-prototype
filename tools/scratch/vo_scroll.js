const {chromium}=require('playwright');const path=require('path');
// ID TAB Y name
const [ID,TAB,Y,NAME]=process.argv.slice(2);const W=+process.env.W||1440;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext({viewport:{width:W,height:+process.env.H||1000}})).newPage();
await p.goto('file://'+path.resolve('review_build/full.html'));await p.waitForTimeout(800);
await p.evaluate(i=>go(i),ID);await p.waitForTimeout(700);
if(TAB&&TAB!=='-'){await p.evaluate(t=>{const bs=[...document.querySelectorAll('#view .vsw label,#view button,#view [role=tab]')].filter(b=>b.textContent.trim().startsWith(t));bs[0]&&bs[0].click()},TAB);await p.waitForTimeout(900)}
const ys=Y.split(',');let i=0;for(const y of ys){await p.evaluate(y=>window.scrollTo(0,+y),y);await p.waitForTimeout(1200);await p.screenshot({path:`vo/shots/${NAME}_${i++}.png`})}
await b.close()})();

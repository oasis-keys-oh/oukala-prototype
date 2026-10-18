const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+path.resolve(process.argv[2])+'/full.html');await p.waitForTimeout(700);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
for(const id of ids){const r=await p.evaluate(i=>{try{go(i)}catch(e){return 'ERR'};const t=document.querySelector('#view').innerText.replace(/\s+/g,' ');const m=[];const re=/.{40}\b(agents?)\b.{40}/gi;let x;while((x=re.exec(t))&&m.length<40){if(/\d/.test(x[0])&&/(\d+\s+(AI\s+)?agents?|agents?\s+(running|working|live|active|enabled|on shift)|of \d+ agents?|working|running)/i.test(x[0]))m.push(x[0])}return m},id);
 if(r&&r.length)console.log('##',id,'\n  '+r.slice(0,6).join('\n  '))}
await b.close()})();

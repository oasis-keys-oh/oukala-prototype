const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
for(const id of ids){await p.evaluate(i=>go(i),id);await p.waitForTimeout(80);
 const labs=await p.evaluate(()=>{const v=document.querySelector('#view .vsw');return v?[...v.querySelectorAll('label')].map(l=>l.textContent.trim()):[]});
 const save=async(name)=>{const t=await p.evaluate(()=>{const v=document.querySelector('#view');const hidden=new Set();return v.innerText});fs.writeFileSync(`aud/txt/${id}__${name.replace(/[^A-Za-z0-9]+/g,'_')}.txt`,t)};
 await save('0first');
 for(let i=0;i<labs.length;i++){await p.evaluate(i=>{const l=document.querySelectorAll('#view .vsw label')[i];l.click()},i);await p.waitForTimeout(60);await save(i+'_'+labs[i])}
}
await b.close()})();

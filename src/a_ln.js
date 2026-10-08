const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | ')));
await p.goto('file://'+process.cwd()+'/review_build/full.html');await p.waitForTimeout(800);
for(const id of ['bud_over','bud_model','bud_ven','bud_ben','bud_doa']){await p.evaluate(i=>go(i),id);console.log(id);
 const n=await p.evaluate(()=>[...document.querySelectorAll('#view button,#view tr,#view .vsw label')].length);
 for(let k=0;k<n;k++){const t=await p.evaluate(k=>{const el=[...document.querySelectorAll('#view button,#view tr,#view .vsw label')][k];if(!el||!el.checkVisibility())return '';const s0=S.screen;try{el.click()}catch(e){return 'EXC '+e.message}const d=document.getElementById('drawer');if(d&&d.matches(':popover-open')){d.hidePopover()}return ''},k);if(t)console.log(id,k,t)}}
await b.close()})();

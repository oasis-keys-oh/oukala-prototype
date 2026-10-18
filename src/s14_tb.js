const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--hide-scrollbars']});
for(const dark of [true,false]){const p=await (await b.newContext({viewport:{width:1440,height:900},colorScheme:dark?'dark':'light'})).newPage();
await p.goto('file://'+path.resolve('out_s14/full.html'),{waitUntil:'commit',timeout:90000});await p.waitForTimeout(6000);
if(dark)await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
await p.evaluate(()=>go('bud_req'));await p.waitForTimeout(900);
await p.evaluate(()=>{const e=document.querySelector('.tscroll.sc-r');if(e)e.scrollIntoView({block:'center'})});await p.waitForTimeout(300);
await p.screenshot({path:'out_s14/zs_tbl_'+(dark?'d':'l')+'.png'});}
await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),w=+a[1]||1300,dark=a.includes('--dark');const only=a.includes('--tabs')?a[a.indexOf('--tabs')+1].split(',').map(Number):[0,1,2,3,4,5,6,7];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:1000},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(600);
for(const i of only){await p.evaluate(i=>{S.v.fab=i;go('plat_fab')},i);await p.waitForTimeout(500);await p.evaluate(()=>{const v=document.querySelector('#view');if(v)v.scrollTop=0;window.scrollTo(0,0)});
 await p.screenshot({path:path.join(dir,'shots','fab-t'+i+'-'+w+(dark?'-dark':'')+'.png'),fullPage:true});}
console.log('errors',errs);await b.close()})();

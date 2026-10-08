// usage: node adm_shot.js OUT screen:tab,screen:tab [--phone] [--dark] [--eval js]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),items=a[1].split(',');const phone=a.includes('--phone'),dark=a.includes('--dark');const ev=a.includes('--eval')?a[a.indexOf('--eval')+1]:null;
fs.mkdirSync(path.join(dir,'shots'),{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('console: '+m.text()));
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(600);
for(const it of items){const [id,tab]=it.split(':');await p.evaluate(([i,t])=>{S.v[i]=+t;go(i)},[id,tab||0]).catch(e=>errs.push(id+": "+e.message));await p.waitForTimeout(1300);
 if(ev){await p.evaluate(ev).catch(e=>errs.push('eval: '+e.message));await p.waitForTimeout(400)}
 const ox=await p.evaluate(()=>{const w=document.documentElement.clientWidth;const bad=[];document.querySelectorAll('#view *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>w+2&&!e.closest('.tablewrap,.adm-diff,[popover]'))bad.push((e.className||e.tagName).toString().slice(0,40))});return [document.documentElement.scrollWidth>innerWidth+1,[...new Set(bad)].slice(0,6)]});
 const f=path.join(dir,'shots',id+'-'+(tab||0)+(phone?'-phone':'')+(dark?'-dark':'')+'.png');await p.screenshot({path:f,fullPage:true});console.log(id,tab,'overflowX:',JSON.stringify(ox))}
console.log('errors:',errs.length?errs:'none');await b.close()})();

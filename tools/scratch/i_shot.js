// usage: node i_shot.js OUT name [--phone] [--dark] [--w N] [--eval js] ; evals run in order separated by ;;
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),name=a[1];const phone=a.includes('--phone'),dark=a.includes('--dark');const wi=a.indexOf('--w');const W=wi>=0?+a[wi+1]:(phone?400:1440);const ev=a.includes('--eval')?a[a.indexOf('--eval')+1].split(';;'):[];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const c=await b.newContext({viewport:{width:W,height:phone?820:900},colorScheme:dark?'dark':'light',hasTouch:phone});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());else if(m.text().startsWith('PR:'))console.log(m.text())});
await p.goto('file://'+path.join(dir,'full.html'));await p.waitForTimeout(900);
for(const e of ev){try{const r=await p.evaluate(e);if(r!==undefined)console.log(typeof r==='string'?r:JSON.stringify(r))}catch(x){errs.push('eval: '+x.message)}await p.waitForTimeout(450)}
require('fs').mkdirSync(path.join(dir,'shots'),{recursive:true});await p.screenshot({path:path.join(dir,'shots',name+'.png'),fullPage:a.includes('--full')});
console.log('overflowX',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));console.log('errors:',errs.length?errs:'none');await b.close()})();

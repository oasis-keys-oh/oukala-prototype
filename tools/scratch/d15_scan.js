// visit r15d screens + personas, collect errors, screenshots
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const dark=process.argv.includes('--dark');const ph=process.argv.includes('--phone');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:ph?{width:400,height:820}:{width:1440,height:900},colorScheme:dark?'dark':'light'})).newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/ERR_FAILED/.test(m.text())&&errs.push('console: '+m.text()));
await p.route(/fonts\.g/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:180000});await p.waitForTimeout(800);
if(dark)await p.evaluate(()=>{PREF.theme='dark';applyPrefs()});
const tag=(dark?'d':'l')+(ph?'p':'');
const shots=(process.argv.find(a=>a.startsWith('--s='))||'--s=r15d_agents,r15d_facts,r15d_evidence,r15d_firstweek').slice(4).split(',');
for(const s of shots){const [id,persona]=s.split('@');await p.evaluate(([id,pe])=>{if(pe)NAVX.persona.set(pe);go(id)},[id,persona]);await p.waitForTimeout(500);
 await p.evaluate(()=>{document.getElementById('inbxBanners')&&(document.getElementById('inbxBanners').innerHTML='')});
 const ox=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await p.screenshot({path:dir+'/d15_'+tag+'_'+id+(persona?'_'+persona:'')+'.png'});console.log(id,persona||'','overflowX',ox)}
console.log('errors',errs.length,errs.slice(0,6));await b.close()})();

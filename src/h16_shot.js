// node h16_shot.js OUT screen [--dark] [--w 1440] [--tab n] [--eval js] [--name x] [--wait ms] [--full]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2),dir=path.resolve(a[0]),scr=a[1];const g=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:+g('--w',1440),height:+g('--h',900)},colorScheme:a.includes('--dark')?'dark':'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(+g('--wait',4500));
if(a.includes('--dark'))await p.evaluate(()=>{document.documentElement.dataset.theme='dark'});
await p.evaluate(`(async()=>{${g('--pre','')}})()`);
await p.evaluate(i=>go(i),scr);await p.waitForTimeout(600);
if(a.includes('--tab')){await p.evaluate(t=>{const k=Object.keys(S.v||{}).find(x=>/^(r16.*_tabs|r16g_tabs|r16r_tabs|r16s_tabs|r16c_tabs)$/.test(x));},0);}
const ev=g('--eval','');if(ev){const r=await p.evaluate(`(async()=>{${ev}})()`);if(r!==undefined)console.log(typeof r==='string'?r:JSON.stringify(r,null,1));await p.waitForTimeout(600)}
const nm=g('--name',scr+(a.includes('--dark')?'_d':'_l')+(a.includes('--w')?'_'+g('--w'):''));
console.log('errs',errs.length,errs.slice(0,6));try{await p.screenshot({path:dir+'/shots/'+nm+'.png',fullPage:a.includes('--full'),timeout:120000});console.log('shot',nm)}catch(e){console.log('shot failed',e.message.slice(0,80))}await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const only=(process.argv[3]||'').split(',').filter(Boolean);const phone=process.argv.includes('--phone');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:phone?{width:400,height:820}:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load resource/.test(m.text()))errs.push('console: '+m.text())});
await p.route(/^https?:/,r=>r.abort());const t0=Date.now();await p.goto('file://'+dir+'/full.html',{waitUntil:'load',timeout:120000});console.log('load',Date.now()-t0);await p.waitForTimeout(1500);
const sfx=phone?'ph_':'';
const ids=await p.evaluate(()=>R17P.STORIES.map(s=>s.id));
for(const id of ids){if(only.length&&!only.includes(id))continue;
 const n=await p.evaluate(i=>{R17P.start(i,0);return R17P.st.stops.length},id);
 for(let k=0;k<n;k++){ if(k>0){await p.keyboard.press('ArrowRight')}
  await p.waitForTimeout(1300);
  const info=await p.evaluate(()=>{const st=R17P.st,sp=st.stops[st.i];const sp_=document.getElementById('r17pSpot');const r=sp_?sp_.getBoundingClientRect():null;const bar=document.getElementById('r17pBar').getBoundingClientRect();
   return {i:st.i,head:sp.head,screen:S.screen,spot:sp_&&sp_.classList.contains('on'),tgt:!!R17P.resolveTarget(sp.sel),sel:sp.sel,bar:[Math.round(bar.left),Math.round(bar.top),Math.round(bar.width),Math.round(bar.height)],proof:[...document.querySelectorAll('.r17p-proof')].map(x=>x.textContent.replace(/\s+/g,' ').slice(0,70)),ox:document.documentElement.scrollWidth>innerWidth+1,den:!!document.querySelector('#view [data-perm-denied]')}});
  console.log(id,k+1,JSON.stringify(info));
  await p.screenshot({path:`r17_shots/p_${sfx}${id}_${k+1}.png`});}
 await p.evaluate(()=>R17P.exit());await p.waitForTimeout(300);}
console.log('ERRORS',errs.length,errs.slice(0,8));await b.close()})();

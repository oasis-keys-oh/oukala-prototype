// CL-30 before and after (prototype fact): scroll frame time on the three heaviest glass screens with the visual effects
// preference at Full (glass as built) and at Reduced (the fx-reduced rule in mod_s_effects.css), through EFFECTS.set.
// Same method as tools/tests/css_glass.js: 240 animation frames scrolling down and up, three rounds each, alternating, median round.
// Usage: node tools/tests/product2_glass.js <build dir> [screen ids, comma separated]   (report only; not part of npm test)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=process.argv[2]||'build_out';const ids=(process.argv[3]||'r18_access,orgassist,org_chart').split(',');
 const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
 const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();await p.route(/^https?:/,r=>r.abort());
 await p.goto('file://'+path.resolve(dir)+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view')&&window.EFFECTS,null,{timeout:120000});await p.waitForTimeout(3000);
 const count=()=>p.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return s.backdropFilter&&s.backdropFilter!=='none'&&e.getClientRects().length}).length);
 const run=()=>p.evaluate(()=>new Promise(res=>{const se=document.scrollingElement;const max=Math.max(1,se.scrollHeight-innerHeight);const t=[];let i=0;
  const f=ts=>{t.push(ts);se.scrollTop=max*(i<120?i/120:(240-i)/120);if(++i<=240)requestAnimationFrame(f);else{const d=t.slice(1).map((x,k)=>x-t[k]).sort((a,b)=>a-b);
   res({med:d[d.length>>1],p95:d[Math.floor(d.length*.95)],long:d.filter(x=>x>20).length})}};requestAnimationFrame(f)}));
 const mid=(a,k)=>a.map(x=>x[k]).sort((x,y)=>x-y)[1];
 console.log('auto decision on this run:',JSON.stringify(await p.evaluate(()=>({mode:EFFECTS.mode(),reduced:EFFECTS.reduced(),measured:EFFECTS.measured(),reasons:EFFECTS.reasons()}))));
 for(const id of ids){await p.evaluate(i=>{EFFECTS.set('full');try{go(i)}catch(e){}},id);await p.waitForTimeout(700);const R={full:[],reduced:[]},n={};
  n.full=await count();await p.evaluate(()=>EFFECTS.set('reduced'));await p.waitForTimeout(100);n.reduced=await count();
  for(let k=0;k<3;k++){await p.evaluate(()=>EFFECTS.set('full'));await p.waitForTimeout(150);R.full.push(await run());await p.evaluate(()=>EFFECTS.set('reduced'));await p.waitForTimeout(150);R.reduced.push(await run())}
  console.log(JSON.stringify({screen:id,glassElements:n,full:{medianMs:+mid(R.full,'med').toFixed(1),p95Ms:+mid(R.full,'p95').toFixed(1),framesOver20ms:mid(R.full,'long')},reduced:{medianMs:+mid(R.reduced,'med').toFixed(1),p95Ms:+mid(R.reduced,'p95').toFixed(1),framesOver20ms:mid(R.reduced,'long')}}))}
 await p.evaluate(()=>EFFECTS.set('auto'));await b.close()})();

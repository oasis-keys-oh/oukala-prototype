// Usage: NODE_PATH=$(npm root -g) node whyscan.js OUTDIR [--light] [--n 40] [--only a,b] [--w 1440]
// Measures the "Why am I seeing this" control and the star on many screens. They must sit in the page-header actions slot:
// the same offset from the top and right edge of #view, the same size, exactly one per screen, star flush right of it,
// and never overlapping the page title. Prints every deviation and a summary.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const a=process.argv.slice(2);const dir=path.resolve(a[0]);const light=a.includes('--light');const w=a.includes('--w')?+a[a.indexOf('--w')+1]:1440;
const n=a.includes('--n')?+a[a.indexOf('--n')+1]:40;const only=a.includes('--only')?a[a.indexOf('--only')+1].split(','):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:w,height:900},colorScheme:light?'light':'dark'});const p=await c.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1000);
let ids=only||await p.evaluate(()=>SCREENS.map(s=>s[0]));if(!only){const step=Math.max(1,Math.floor(ids.length/n));ids=ids.filter((_,i)=>i%step===0).slice(0,n)}
const rows=[];let bad=0;
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.mouse.move(2,2);await p.waitForTimeout(450);
 const m=await p.evaluate(()=>{const v=document.querySelector('#view');if(!v)return{missing:true,count:0,stars:0,old:0,noview:true};const vr=v.getBoundingClientRect(),btn=document.querySelector('#r16Why'),st=document.querySelector('#r16Pha .r16-star');
  const count=[...v.querySelectorAll('button,a,summary')].filter(x=>/why am i seeing/i.test(x.textContent)).length;const stars=v.querySelectorAll('.nx-hstar').length;
  const old=[...document.querySelectorAll('.chip[popovertarget]')].filter(x=>/why am i seeing/i.test(x.textContent)&&x.id!=='r16Why').length;
  if(!btn||!st)return{missing:true,count,stars,old};const r=btn.getBoundingClientRect(),s=st.getBoundingClientRect();const pha=document.querySelector('#r16Pha').getBoundingClientRect();
  const h1=v.querySelector('h1');const hr=h1?h1.getBoundingClientRect():null;const ov=hr?Math.max(0,Math.min(r.right,hr.right)-Math.max(r.left,hr.left))*Math.max(0,Math.min(r.bottom,hr.bottom)-Math.max(r.top,hr.top)):0;
  const ovS=hr?Math.max(0,Math.min(s.right,hr.right)-Math.max(s.left,hr.left))*Math.max(0,Math.min(s.bottom,hr.bottom)-Math.max(s.top,hr.top)):0;
  return{count,stars,old,top:+(r.top-vr.top).toFixed(1),right:+(vr.right-s.right).toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),sw:+s.width.toFixed(1),sh:+s.height.toFixed(1),gap:+(s.left-r.right).toFixed(1),ov:Math.round(ov+ovS),vis:r.width>0&&getComputedStyle(btn).visibility!=='hidden',aria:btn.getAttribute('aria-haspopup')}});
 rows.push([id,m])}
const ref=rows.find(r=>!r[1].missing)[1];const dev=[];
rows.forEach(([id,m])=>{const issues=[];if(m.missing)issues.push(m.noview?'no #view (custom shell)':'slot missing');else{
 if(m.count!==1)issues.push('why controls '+m.count);if(m.old)issues.push('ad hoc chip '+m.old);if(m.stars)issues.push('extra header star '+m.stars);
 for(const k of ['top','right','w','h','sw','sh','gap']){if(Math.abs(m[k]-ref[k])>0.6)issues.push(k+' '+m[k]+' vs '+ref[k])}
 if(m.ov>0)issues.push('overlaps title '+m.ov+'px2');if(!m.vis)issues.push('not visible');if(m.aria!=='dialog')issues.push('no aria-haspopup')}
 if(issues.length){bad++;dev.push(id+': '+issues.join('; '))}});
console.log('screens measured',rows.length,light?'light':'dark',w+'px');console.log('reference position (top,right,w,h,star,gap):',ref.top,ref.right,ref.w,ref.h,ref.sw+'x'+ref.sh,ref.gap);
dev.forEach(d=>console.log('DEV',d));console.log('screens with deviations',bad,'page errors',errs.length);await b.close()})();

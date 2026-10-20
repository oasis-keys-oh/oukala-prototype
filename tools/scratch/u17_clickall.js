// usage: node u17_clickall.js OUTDIR screen1,screen2 [--phone] [--tabs]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const scr=process.argv[3].split(',');const phone=process.argv.includes('--phone');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:phone?{width:400,height:860}:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>m.type()==='error'&&!/fonts|ERR_FAILED/.test(m.text())&&errs.push('console: '+m.text()));
p.on('dialog',d=>d.dismiss().catch(()=>{}));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(800);
const FP=()=>p.evaluate(()=>{let h=0;const s=document.body.innerHTML+location.hash;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h+':'+s.length});
const out={};
for(const id of scr){
 // tabs
 const ntabs=await p.evaluate(i=>{go(i);return document.querySelectorAll('#view .tabs [role=tab], #view .views > input[type=radio]').length},id);
 const tabCount=Math.max(ntabs,1);
 for(let tab=0;tab<tabCount;tab++){
  await p.evaluate(i=>go(i),id);await p.waitForTimeout(250);
  if(ntabs){await p.evaluate(t=>{const r=document.querySelectorAll('#view .views > input[type=radio]');if(r[t]){r[t].click()}},tab);await p.waitForTimeout(150)}
  const sel='#view button:not([disabled]), #view select, #view [role=button], #view .chip, #view a[href], #view input[type=checkbox]';
  const n=await p.locator(sel).count();
  for(let i=0;i<n;i++){
   await p.evaluate(([i,id,tab,ntabs])=>{closeDrawer&&closeDrawer();go(id);if(ntabs){const r=document.querySelectorAll('#view .views > input[type=radio]');if(r[tab])r[tab].click()}},[i,id,tab,ntabs]).catch(()=>{});await p.waitForTimeout(120);
   const loc=p.locator(sel).nth(i);
   const info=await loc.evaluate(e=>({tag:e.tagName,txt:(e.innerText||e.getAttribute('aria-label')||e.title||e.value||'').trim().slice(0,40),vis:!!(e.offsetWidth||e.offsetHeight),attrs:[...e.attributes].map(a=>a.name).filter(n=>n.startsWith('data-')).join(' ')})).catch(()=>null);
   if(!info||!info.vis)continue;
   const f0=await FP();const ne=errs.length;
   try{
    if(info.tag==='SELECT'){const o=await loc.evaluate(e=>[...e.options].map(o=>o.value));const cur=await loc.inputValue();const nv=o.find(v=>v!==cur);if(nv===undefined){out[id+'#'+tab+'#'+i]='single-option select '+info.txt;continue}await loc.selectOption(nv,{timeout:2000})}
    else await loc.click({timeout:2000,force:true});
   }catch(e){out[id+'#'+tab+'#'+i]='CLICKFAIL '+info.tag+' '+info.txt+' '+e.message.slice(0,50);continue}
   await p.waitForTimeout(180);const f1=await FP();
   if(f0===f1)out[id+'#'+tab+'#'+i]='NOOP '+info.tag+' "'+info.txt+'" '+info.attrs;
   if(errs.length>ne)out[id+'#'+tab+'#'+i+'err']=errs.slice(ne).join('|');
  }
 }
}
for(const k in out)console.log(k,out[k]);
console.log('noops/issues',Object.keys(out).length,'errors',errs.length);await b.close()})();

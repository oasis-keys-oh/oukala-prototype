// usage: node u17_fast.js OUTDIR screen ; fast in-page click-all via el.click(), fingerprint compare
const {chromium}=require('playwright');const path=require('path');
(async()=>{const dir=path.resolve(process.argv[2]);const id=process.argv[3];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(2500);
const NTV=+(process.argv[4]||1),KEY=process.argv[5]||'';const res=await p.evaluate(async ([id,NT,process_key])=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const fp=()=>{const s=(document.querySelector('#view')||document.body).innerHTML+"|"+(document.querySelector('#drawer,.drawer,[data-drawer]')||{innerHTML:""}).innerHTML+"|"+document.querySelectorAll('.toast').length+"|"+document.body.className+"|"+(document.querySelector('.r17u-pv')?1:0)+"|"+JSON.stringify(S.v||{});let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h};
 const SEL='#view button:not([disabled]), #view select, #view [role=button], #view .chip, #view input[type=checkbox], #view a[href]';
 const reset=async tab=>{try{closeDrawer()}catch(e){};document.querySelectorAll('.r17u-pv').forEach(x=>x.remove());document.body.classList.remove('r17u-pvon');try{S.r17u.ui.edit=false;S.r17u.ui.full=false}catch(e){};go(id);if(process_key)S.v[process_key]=tab;render();await sleep(60)};
 const ntabs=NT;const out={total:0,noop:[],ok:0};
 for(let tab=0;tab<ntabs;tab++){await reset(tab);const n=document.querySelectorAll(SEL).length;
  for(let i=0;i<n;i++){await reset(tab);const el=document.querySelectorAll(SEL)[i];if(!el||!(el.offsetWidth||el.offsetHeight))continue;
   const desc=(el.innerText||el.getAttribute('aria-label')||el.title||'').trim().slice(0,40)+" ["+[...el.attributes].map(a=>a.name).filter(n=>n.startsWith('data-')).join(' ')+"]";
   const f0=fp();
   if(el.tagName==='SELECT'){const nv=[...el.options].map(o=>o.value).find(v=>v!==el.value);if(nv===undefined){out.noop.push("t"+tab+" "+desc+" (single option)");continue}el.value=nv;el.dispatchEvent(new Event('change',{bubbles:true}))}else el.click();
   await sleep(70);out.total++;
   if(fp()===f0)out.noop.push("t"+tab+" "+desc);else out.ok++}}
 return out},[id,NTV,KEY]);
console.log(id,JSON.stringify(res,null,1));console.log(errs.length?errs.join('\n'):'no page errors');await b.close()})();

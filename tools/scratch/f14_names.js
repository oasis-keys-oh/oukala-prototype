const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const dir=path.resolve(process.argv[2]);const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route(/^https?:/,r=>r.abort());await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));const out={};let tot=0;
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const bad=[];document.querySelectorAll('#view button,#view a[href],#view input:not([type=hidden]),#view select,#view textarea,#view [role=button],#view [role=tab],#view [role=switch],#view [role=checkbox]').forEach(e=>{if(e.offsetParent===null&&getComputedStyle(e).position!=='fixed')return;
  let n=(e.getAttribute('aria-label')||'').trim();if(!n&&e.getAttribute('aria-labelledby'))n=e.getAttribute('aria-labelledby').split(' ').map(i=>(document.getElementById(i)||{}).textContent||'').join(' ').trim();
  if(!n)n=(e.innerText||e.textContent||'').trim();if(!n)n=(e.getAttribute('title')||'').trim();
  if(!n&&e.id){const l=document.querySelector('label[for="'+e.id+'"]');if(l)n=(l.innerText||'').trim()}
  if(!n){const l=e.closest('label');if(l)n=(l.innerText||l.textContent||'').trim()}
  if(!n&&e.tagName==='INPUT'&&e.placeholder)n=e.placeholder;if(!n&&e.querySelector('img[alt]'))n=e.querySelector('img[alt]').alt;
  if(!n)bad.push(e.tagName+'.'+e.className.toString().slice(0,22)+(e.type?'['+e.type+']':''))});return bad});
 if(r.length){out[id]=r;tot+=r.length}}
fs.writeFileSync('aud14/names.json',JSON.stringify(out,null,1));console.log('unnamed controls',tot,'on',Object.keys(out).length,'screens');
const g={};Object.values(out).flat().forEach(k=>g[k]=(g[k]||0)+1);console.log(JSON.stringify(Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,15)));await b.close()})();

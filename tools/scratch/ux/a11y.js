// PR-31: focused WCAG 2.2 checks: skip link on focus, dialog focus handling, table rows by keyboard, reduced motion, aria-current, live toasts, 200% zoom.
const {open}=require('./lib');const path=require('path');const SH=path.join(__dirname,'shots');
const A=()=>{const e=document.activeElement;return e.tagName+' '+(e.getAttribute('aria-label')||e.innerText||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,40)+(e.closest('[role=dialog],dialog,:popover-open')?' (in dialog)':'')};
(async()=>{
 {const {b,p}=await open({persona:'emp'});
  await p.evaluate(()=>document.querySelector('a[href="#view"]').focus());const sk=await p.evaluate(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();const s=getComputedStyle(e);return {rect:[r.x,r.y,r.width,r.height].map(Math.round),clip:s.clip,clipPath:s.clipPath,opacity:s.opacity,pos:s.position}});console.log('skip link focused:',JSON.stringify(sk));
  await p.screenshot({path:SH+'/employee/a11y-skiplink-focused.jpg',type:'jpeg',quality:45,clip:{x:0,y:0,width:700,height:200}});
  const cur=await p.evaluate(()=>[...document.querySelectorAll('.rail [aria-current]')].map(e=>e.innerText.trim()+'='+e.getAttribute('aria-current')));console.log('aria-current in rail:',cur);
  const live=await p.evaluate(()=>[...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map(e=>e.tagName+'#'+e.id+' '+(e.getAttribute('aria-live')||e.getAttribute('role'))+' tabindex='+e.getAttribute('tabindex')).slice(0,8));console.log('live regions:',live);
  // toast focusable?
  const toast=await p.evaluate(()=>{const t=[...document.querySelectorAll('[role=status]')].find(x=>/CHG0312/.test(x.innerText));return t?{tab:t.tabIndex,auto:!!t.closest('[popover]'),persists:true,actions:[...t.querySelectorAll('button')].map(b=>b.innerText.trim())}:null});console.log('CAB toast:',JSON.stringify(toast));
  await p.waitForTimeout(8000);console.log('toast still there after 8 s:',await p.evaluate(()=>[...document.querySelectorAll('[role=status]')].some(x=>/CHG0312/.test(x.innerText)&&x.offsetParent!==null)));
  // retrofit rows
  await p.evaluate(()=>NAVX.persona.set('arch'));await p.evaluate(()=>go('plat_retrofit'));await p.waitForTimeout(500);
  const rows=await p.evaluate(()=>{const r=[...document.querySelectorAll('#view tbody tr')].slice(0,3);return r.map(x=>({tab:x.tabIndex,role:x.getAttribute('role'),attrs:[...x.attributes].map(a=>a.name).join(','),btn:!!x.querySelector('button,a')}))});console.log('retrofit rows:',JSON.stringify(rows));
  // byc dialog
  await p.evaluate(()=>NAVX.persona.set('admin'));await p.evaluate(()=>go('showroom'));await p.waitForTimeout(400);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#view button')].find(x=>x.innerText.trim()==='Bring your company');b.focus();b.click()});await p.waitForTimeout(600);
  console.log('after open, focus:',await p.evaluate(A));const seq=[];for(let i=0;i<12;i++){await p.keyboard.press('Tab');seq.push(await p.evaluate(A))}console.log('Tab in dialog:',seq);
  await p.keyboard.press('Escape');await p.waitForTimeout(300);console.log('after Esc, focus:',await p.evaluate(A),'dialog open:',await p.evaluate(()=>!!document.querySelector('[role=dialog]:popover-open,dialog[open]')));
  const fk=await p.evaluate(()=>{const b=[...document.querySelectorAll('#view button')].find(x=>x.innerText.trim()==='Bring your company');b.click();return new Promise(r=>setTimeout(()=>{const i=[...document.querySelectorAll('input[name=fk],textarea[name=fk],[name=fk]')].filter(e=>e.offsetParent);r(i.map(e=>({tag:e.tagName,id:e.id,ph:e.placeholder,val:e.value,labels:e.labels?e.labels.length:0,aria:e.getAttribute('aria-label'),req:e.required,ariaReq:e.getAttribute('aria-required')})))},500))});console.log('byc fields:',JSON.stringify(fk));
  // submit empty
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Build my company');b&&b.click()});await p.waitForTimeout(500);
  console.log('empty submit result:',await p.evaluate(()=>{const d=document.querySelector(':popover-open,dialog[open]');return d?d.innerText.replace(/\s+/g,' ').slice(0,400):'closed'}),'invalid:',await p.evaluate(()=>[...document.querySelectorAll('[aria-invalid=true]')].length));
  await p.screenshot({path:SH+'/platform-admin/task-byc-empty-submit.jpg',type:'jpeg',quality:45});
  await b.close()}
 {const {b,p}=await open({persona:'emp',rm:true});
  const an=await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>(a.animationName||a.constructor.name)+' '+(a.effect&&a.effect.target&&a.effect.target.className||'').toString().slice(0,40)).slice(0,10));console.log('running animations with reduced motion:',an.length,an);
  await b.close()}
 {const {b,p}=await open({persona:'emp',vp:{width:720,height:450}});// 1440 at 200% zoom
  await p.evaluate(()=>go('svc_portal'));await p.waitForTimeout(400);console.log('720px (200% zoom) overflow:',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
  await p.screenshot({path:SH+'/employee/a11y-zoom200-portal.jpg',type:'jpeg',quality:45});await b.close()}
})();

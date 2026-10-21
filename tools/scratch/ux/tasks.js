// PR-31: task attempts. Clicks through order, report a problem, Bring your company, Run on a feature, guest search.
const {open}=require('./lib');const path=require('path');const SH=path.join(__dirname,'shots');
const T=(p)=>p.evaluate(()=>document.querySelector('#view').innerText.replace(/\s+/g,' '));
const clickText=async(p,re,scope)=>p.evaluate(([src,scope])=>{const re=new RegExp(src,'i');const els=[...document.querySelectorAll((scope||'')+' button,'+(scope||'')+' a,'+(scope||'')+' [role=button],'+(scope||'')+' summary')].filter(e=>e.offsetParent!==null);const e=els.find(x=>re.test((x.innerText||x.getAttribute('aria-label')||'').trim()));if(!e)return 'NOT FOUND '+src;e.click();return 'clicked: '+(e.innerText||e.getAttribute('aria-label')).trim().slice(0,60)},[re.source,scope]);
(async()=>{const task=process.argv[2];
 if(task==='order'){const {b,p}=await open({persona:'emp'});await p.evaluate(()=>go('svc_portal'));await p.waitForTimeout(400);
  const t=await T(p);console.log('problem words in portal:',(t.match(/[^.]{0,60}(broken|problem|incident|not working|report an issue)[^.]{0,60}/gi)||[]).slice(0,6));
  console.log(await clickText(p,/Laptop/,'#view'));await p.waitForTimeout(500);await p.screenshot({path:SH+'/employee/task-order-1.jpg',type:'jpeg',quality:45});
  const d=await p.evaluate(()=>{const o=document.querySelector('#drawer:popover-open, .drawer.open, [role=dialog]:popover-open, dialog[open]');return o?o.innerText.replace(/\s+/g,' ').slice(0,900):'no dialog; view: '+document.querySelector('#view').innerText.replace(/\s+/g,' ').slice(0,300)});console.log('after Laptop:',d);
  console.log(await clickText(p,/^(Order|Submit|Request|Place order|Order now|Add to cart|Continue)/));await p.waitForTimeout(500);
  await p.screenshot({path:SH+'/employee/task-order-2.jpg',type:'jpeg',quality:45});
  console.log('after submit:',await p.evaluate(()=>{const o=document.querySelector('#drawer:popover-open,[role=dialog]:popover-open,dialog[open]');return (o?o.innerText:document.querySelector('#view').innerText).replace(/\s+/g,' ').slice(0,600)}));
  console.log('toasts:',await p.evaluate(()=>[...document.querySelectorAll('.toast,[role=status]')].map(e=>e.innerText.replace(/\s+/g,' ').slice(0,120)).slice(0,4)));
  // report a problem via chat
  await p.evaluate(()=>go('home'));await b.close()}
 if(task==='problem'){const {b,p}=await open({persona:'emp'});await p.evaluate(()=>go('svc_portal'));await p.waitForTimeout(400);
  console.log(await clickText(p,/broken|problem|issue|incident|something is wrong/i,'#view'));await p.waitForTimeout(500);
  await p.screenshot({path:SH+'/employee/task-problem-1.jpg',type:'jpeg',quality:45});
  console.log(await p.evaluate(()=>{const o=document.querySelector('#drawer:popover-open,[role=dialog]:popover-open,dialog[open]');return (o?'DIALOG '+o.innerText:'VIEW '+document.querySelector('#view').innerText).replace(/\s+/g,' ').slice(0,700)}));
  // the portal top tabs
  console.log('portal tabs:',await p.evaluate(()=>[...document.querySelectorAll('.r16i-top a, .r16i-top button, [class*=portal] nav a,[class*=portal] nav button')].map(e=>e.innerText.trim()).slice(0,10)));
  await b.close()}
 if(task==='byc'){const {b,p}=await open({persona:'admin'});await p.evaluate(()=>go('showroom'));await p.waitForTimeout(400);
  console.log(await clickText(p,/^Bring your company$/,'#view'));await p.waitForTimeout(600);await p.screenshot({path:SH+'/platform-admin/task-byc-1.jpg',type:'jpeg',quality:45});
  console.log(await p.evaluate(()=>{const o=document.querySelector(':popover-open,dialog[open]');return (o?'DIALOG '+o.innerText:'VIEW '+document.querySelector('#view').innerText).replace(/\s+/g,' ').slice(0,900)}));
  const f=await p.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(e=>e.offsetParent).map(e=>e.tagName+' '+(e.getAttribute('aria-label')||e.placeholder||e.name||'')+' labelled='+!!(e.labels&&e.labels.length)).slice(0,12));console.log('fields:',f);
  await b.close()}
 if(task==='contract'){const {b,p}=await open({persona:'arch'});await p.evaluate(()=>go('plat_contract'));await p.waitForTimeout(400);
  console.log(await clickText(p,/^Run on a feature$/,'#view .hero, #view'));await p.waitForTimeout(600);await p.screenshot({path:SH+'/architect/task-contract-run.jpg',type:'jpeg',quality:45});
  console.log(await p.evaluate(()=>document.querySelector('#view').innerText.replace(/\s+/g,' ').slice(0,200)));
  await p.evaluate(()=>go('plat_gate'));await p.waitForTimeout(400);await p.screenshot({path:SH+'/architect/task-gate.jpg',type:'jpeg',quality:45,fullPage:false});
  await p.evaluate(()=>go('plat_retrofit'));await p.waitForTimeout(400);console.log(await clickText(p,/Decision rule coverage/,'#view'));await p.waitForTimeout(500);
  await p.screenshot({path:SH+'/architect/task-retrofit-row.jpg',type:'jpeg',quality:45});
  console.log('row open:',await p.evaluate(()=>{const o=document.querySelector('#drawer:popover-open,[role=dialog]:popover-open');return o?o.innerText.replace(/\s+/g,' ').slice(0,600):'no drawer'}));
  await b.close()}
 if(task==='guest'){const {b,p}=await open({persona:'guest'});
  console.log('rail:',await p.evaluate(()=>document.querySelector('.rail').innerText.replace(/\s+/g,' ')));
  await p.evaluate(()=>document.querySelector('#nxPalIn')&&0);await p.keyboard.press('/');await p.keyboard.type('invoice');await p.waitForTimeout(600);
  console.log('search:',await p.evaluate(()=>(document.querySelector('#nxPalList')||{}).innerText?.replace(/\s+/g,' ').slice(0,500)));
  await p.screenshot({path:SH+'/vendor-guest/task-search-invoice.jpg',type:'jpeg',quality:45});await p.keyboard.press('Escape');
  await p.evaluate(()=>go('home'));await p.waitForTimeout(300);await p.screenshot({path:SH+'/vendor-guest/home-full.jpg',type:'jpeg',quality:45,fullPage:true});
  console.log('home:',(await T(p)).slice(0,1500));await b.close()}
})();

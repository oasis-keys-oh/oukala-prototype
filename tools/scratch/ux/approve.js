// PR-31: try the approve task end to end: persona, screen, optional tab name; count clicks; record what changed.
// Usage: node approve.js <persona> <screen> [tab text] [tenant]
const L=require('./lib');const path=require('path');(async()=>{const [k,id,tab,ten]=process.argv.slice(2);const {b,p,errs}=await L.open();
await L.setup(p,k,ten||undefined);await L.goto(p,id);let clicks=0;const dir=path.join(__dirname,'shots',k);
if(tab){const ok=await p.evaluate(t=>{const c=[...document.querySelectorAll('#view [role=tab],#view button,#view a')].find(e=>e.innerText.trim().toLowerCase()===t.toLowerCase());if(!c)return false;c.setAttribute('data-ux-tab','1');return true},tab);
 if(ok){await p.click('[data-ux-tab="1"]');clicks++;await p.waitForTimeout(700)}else console.log('tab not found',tab)}
const find=()=>p.evaluate(()=>{const c=[...document.querySelectorAll('#view button,#view [role=button],#drawer button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0});
 const dis=c.filter(e=>e.disabled&&/^(approve|release|accept)/i.test((e.innerText||'').trim())).map(e=>e.title).slice(0,2);const m=c.filter(e=>!e.disabled).filter(e=>/^(approve|release|accept|sign|record go)/i.test((e.innerText||'').trim()));document.querySelectorAll('[data-ux-a]').forEach(e=>e.removeAttribute('data-ux-a'));if(m[0])m[0].setAttribute('data-ux-a','1');
 return {dis,n:m.length,labels:[...new Set(m.map(e=>e.innerText.trim().slice(0,40)))].slice(0,8),ctx:m[0]?(m[0].closest('tr,li,article,.card,section')||m[0].parentElement).innerText.replace(/\s+/g,' ').slice(0,260):''}});
let f=await find();console.log('approve controls',JSON.stringify(f));
if(!f.n){/* open first row */const ok=await p.evaluate(()=>{const r=document.querySelector('#view tbody tr');if(!r)return false;r.setAttribute('data-ux-row','1');return true});if(ok){await p.click('[data-ux-row="1"]');clicks++;await p.waitForTimeout(800);f=await find();console.log('after row',JSON.stringify(f))}}
if(f.n){const before=await p.evaluate(()=>document.querySelector('#view').innerText);await p.click('[data-ux-a="1"]');clicks++;await p.waitForTimeout(900);
 const dlg=await p.evaluate(()=>[...document.querySelectorAll('dialog[open],[role=dialog],[role=alertdialog]')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.innerText.replace(/\s+/g,' ').slice(0,400)));
 const toast=await p.evaluate(()=>[...document.querySelectorAll('[role=status],[aria-live],.toast')].map(e=>e.innerText.trim()).filter(Boolean).join(' / ').slice(0,300));
 const after=await p.evaluate(()=>document.querySelector('#view').innerText);
 console.log('clicks',clicks,'dialog',JSON.stringify(dlg),'toast',toast,'view changed',before!==after,'len',before.length,'->',after.length);
 await L.shot(p,dir,(ten||'core')+'_approve_'+id+(tab?'_'+tab.replace(/\W+/g,''):''))}
console.log('errors',errs);await b.close()})();

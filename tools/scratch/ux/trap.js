// PR-31: does Tab leave the top bar search? Also checks Escape and Shift+Tab, and the rail flyouts by keyboard.
const {open}=require('./lib');
const A=()=>{const e=document.activeElement;return e.tagName+' '+(e.getAttribute('aria-label')||e.innerText||'').trim().slice(0,40)+' expanded='+e.getAttribute('aria-expanded')};
(async()=>{const {b,p}=await open({persona:'emp'});
 await p.evaluate(()=>document.querySelector('.topbar input[role=combobox], input[role=combobox]').focus());console.log('focus',await p.evaluate(A));
 for(let i=0;i<3;i++){await p.keyboard.press('Tab');console.log('Tab ->',await p.evaluate(A))}
 await p.keyboard.press('Shift+Tab');console.log('Shift+Tab ->',await p.evaluate(A));
 await p.keyboard.press('Escape');console.log('Esc ->',await p.evaluate(A));await p.keyboard.press('Tab');console.log('Esc then Tab ->',await p.evaluate(A));
 const info=await p.evaluate(()=>{const i=document.querySelector('input[role=combobox]');return {html:i.outerHTML.slice(0,300),popover:!!document.querySelector(':popover-open'),open:[...document.querySelectorAll(':popover-open')].map(e=>e.id+'.'+e.className)}});console.log(info);
 // rail flyout by keyboard
 await p.evaluate(()=>{const s=[...document.querySelectorAll('.rail summary')].find(x=>/Ask or request/.test(x.textContent));s.focus()});
 await p.keyboard.press('Enter');await p.waitForTimeout(300);
 console.log('after Enter on Ask or request:',await p.evaluate(A),await p.evaluate(()=>[...document.querySelectorAll('details[open]')].map(d=>d.innerText.replace(/\s+/g,' ').slice(0,200))));
 await p.keyboard.press('ArrowDown');console.log('ArrowDown ->',await p.evaluate(A));await p.keyboard.press('Tab');console.log('Tab ->',await p.evaluate(A));
 await p.keyboard.press('Escape');console.log('Esc ->',await p.evaluate(A),await p.evaluate(()=>document.querySelectorAll('details[open]').length));
 await b.close()})();

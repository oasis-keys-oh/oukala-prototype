// PR-31: reproduce the Tab loop on the top bar search.
const {open}=require('./lib');
(async()=>{const {b,p}=await open({persona:'emp'});
 await p.evaluate(()=>[...document.querySelectorAll('.rail button')].pop().focus());
 for(let i=0;i<4;i++){await p.keyboard.press('Tab');await p.waitForTimeout(150);console.log(await p.evaluate(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();return e.id+' '+e.className+' '+e.getAttribute('aria-label')+' rect='+[r.x,r.y,r.width,r.height].map(Math.round)+' palOpen='+!!document.querySelector('#nxPal:popover-open, .nx-pal:popover-open')+' open='+[...document.querySelectorAll(':popover-open')].map(x=>x.id).join(',')}))}
 await p.keyboard.press('Escape');await p.waitForTimeout(150);await p.keyboard.press('Tab');console.log('after Esc+Tab',await p.evaluate(()=>document.activeElement.id+' '+document.activeElement.getAttribute('aria-label')));
 await p.keyboard.press('Shift+Tab');console.log('Shift+Tab',await p.evaluate(()=>document.activeElement.id+' '+document.activeElement.getAttribute('aria-label')));
 await p.screenshot({path:__dirname+'/shots/employee/kb-search-tab-loop.jpg',type:'jpeg',quality:45});
 await b.close()})();

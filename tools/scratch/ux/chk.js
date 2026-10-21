// PR-31: is there a "report a problem" path in the portal?
const {open}=require('./lib');(async()=>{const {b,p}=await open({persona:'emp'});await p.evaluate(()=>go('svc_portal'));await p.waitForTimeout(400);
const t=await p.evaluate(()=>document.body.innerText);const hits=t.split('\n').filter(l=>/broken|problem|incident|not working|issue|fix|help/i.test(l));console.log(hits.slice(0,30));
console.log('items:',await p.evaluate(()=>[...document.querySelectorAll('#view h3,#view h4,#view b')].map(e=>e.innerText.trim()).filter(Boolean).slice(0,60).join(' | ')));
console.log('chat intent:',await p.evaluate(()=>{try{return typeof ASKX!=='undefined'?Object.keys(ASKX).slice(0,10):'no ASKX'}catch(e){return e.message}}));
await b.close()})();

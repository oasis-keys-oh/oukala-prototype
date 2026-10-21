// PR-31: inspect the approve buttons in the My approvals drawer for one persona
const L=require('./lib');(async()=>{const k=process.argv[2]||'pm';const {b,p}=await L.open();await L.setup(p,k);await L.goto(p,'flw_appr');
await p.evaluate(()=>{const r=[...document.querySelectorAll('#view tbody tr')].find(x=>x.getBoundingClientRect().height>0);r&&r.click()});await p.waitForTimeout(900);
console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('#drawer button')].filter(e=>/^(Approve|Reject|Return|Delegate)/.test(e.innerText.trim())).map(e=>({t:e.innerText.trim(),disabled:e.disabled,aria:e.getAttribute('aria-disabled'),title:e.title,cls:e.className,op:getComputedStyle(e).opacity,cursor:getComputedStyle(e).cursor}))),null,1));
await b.close()})();

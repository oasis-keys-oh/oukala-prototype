const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+path.resolve('out/full.html'));await p.waitForTimeout(600);
const qs=["I need a new laptop","show the budget","add a new request","read this contract","what risks are open on Codification","who can see the Lumen contract","show open incidents","what is waiting for my approval","show the stubs in the vault","board view","who is on call","show cloud spend","who is overloaded","how do I fail over the portal","what depends on the lease subledger"];
for(const q of qs){const r=await p.evaluate(q=>{S.chat=[];ask(q);return {s:S.screen,last:(S.chat[S.chat.length-1]||{}).t}},q);console.log(q.padEnd(40),'->',r.s,'|',(r.last||'').replace(/<[^>]+>/g,'').slice(0,70))}
// metric ids duplicates
console.log(await p.evaluate(()=>Object.keys(METRICS).length));console.log(e);await b.close()})()

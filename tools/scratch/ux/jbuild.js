// PR-31: the JM-13 purview bar on the Journey maps Build tab, for a department head (ops) and a contributor (pm, emp).
const {open}=require('./lib');const path=require('path');
(async()=>{for(const k of ['ops','pm','emp']){const {b,p}=await open({persona:k});await p.evaluate(()=>go('ppl_jrny'));await p.waitForTimeout(500);
 const labels=await p.evaluate(()=>[...document.querySelectorAll('#view .vsw label,#view [role=tab]')].map(l=>l.textContent.trim()));
 const hit=await p.evaluate(()=>{const l=[...document.querySelectorAll('#view .vsw label,#view [role=tab]')].find(x=>/build/i.test(x.textContent));if(!l)return 'no Build tab';l.click();return 'clicked '+l.textContent.trim()});
 await p.waitForTimeout(600);const bar=await p.evaluate(()=>{const e=document.querySelector('.jb-pv');return e?e.innerText.replace(/\s+/g,' '):'no purview bar'});
 console.log('\n##',k,'tabs:',labels.slice(0,10).join(' | '),'\n',hit,'\n',bar);
 await p.screenshot({path:path.join(__dirname,'shots',k==='ops'?'dept-head-ops':k==='pm'?'contributor-pm':'employee','journey-build-tab.jpg'),type:'jpeg',quality:45});await b.close()}})();

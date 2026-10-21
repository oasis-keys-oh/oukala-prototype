// PR-31: which CSS rule paints the low-contrast dark-mode text? Reports the element classes and the custom properties that resolve to it.
const {open}=require('./lib');
(async()=>{const {b,p}=await open({persona:'admin',dark:true});await p.evaluate(()=>go('plat_gate'));await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const want=['rgb(107, 64, 0)','rgb(44, 102, 118)','rgb(122, 63, 122)','rgb(77, 90, 96)','rgb(156, 20, 36)','rgb(11, 100, 117)'];const out={};
  [...document.querySelectorAll('#view *')].forEach(e=>{const c=getComputedStyle(e).color;if(want.includes(c)&&!out[c])out[c]=e.tagName+'.'+String(e.className).slice(0,50)+' "'+e.textContent.trim().slice(0,30)+'"'});
  const rs=getComputedStyle(document.documentElement);const toks={};for(const s of document.styleSheets){let rules;try{rules=s.cssRules}catch(e){continue}for(const r of rules){if(r.style)for(const n of r.style){if(n.startsWith('--')){const v=rs.getPropertyValue(n).trim();if(v)toks[n]=v}}}}
  const probe=document.createElement('span');document.body.appendChild(probe);const hits={};
  for(const n in toks){probe.style.color='var('+n+')';const c=getComputedStyle(probe).color;if(want.includes(c))(hits[c]=hits[c]||[]).push(n)}
  probe.remove();return {out,hits:Object.fromEntries(Object.entries(hits).map(([k,v])=>[k,v.slice(0,8)])),dark:matchMedia('(prefers-color-scheme: dark)').matches}});
 console.log(JSON.stringify(r,null,1));await b.close()})();

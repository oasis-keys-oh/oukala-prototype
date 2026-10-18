const L=require('./load.js');
(async()=>{
const {b,p}=await L(1440,900);
const r=await p.evaluate(async()=>{
 const names=new Set();
 for(const ss of document.styleSheets){let rules;try{rules=ss.cssRules}catch(e){continue}
  for(const r of rules){if(r.style&&r.selectorText&&/^(:root|html|body)/.test(r.selectorText)){for(const n of r.style)if(n.startsWith('--'))names.add(n)}
   if(r.cssRules){for(const q of r.cssRules){if(q.style&&q.selectorText&&/^(:root|html)/.test(q.selectorText))for(const n of q.style)if(n.startsWith('--'))names.add(n)}}}}
 const out={light:{},dark:{}};
 const get=()=>{const cs=getComputedStyle(document.documentElement);const o={};names.forEach(n=>o[n]=cs.getPropertyValue(n).trim());return o};
 const th=document.documentElement.getAttribute('data-theme');out.curTheme=th;
 document.documentElement.setAttribute('data-theme','light');await new Promise(r=>setTimeout(r,100));out.light=get();
 document.documentElement.setAttribute('data-theme','dark');await new Promise(r=>setTimeout(r,100));out.dark=get();
 out.n=names.size;
 const cs=getComputedStyle(document.body);out.bodyFont=cs.fontFamily+' '+cs.fontSize+' '+cs.lineHeight;
 return out});
require('fs').writeFileSync('tokens.json',JSON.stringify(r,null,1));
const keys=Object.keys(r.light);console.log(r.n,r.curTheme,r.bodyFont);
for(const k of keys){const l=r.light[k],d=r.dark[k];console.log(k,'|',l,l===d?'':'| '+d)}
await b.close()})();

const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.route(/^https?:/,r=>r.abort());p.setDefaultTimeout(60000);await p.goto('file://'+path.resolve('scr/base.html'));await p.waitForTimeout(800);
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));console.log(ids.length);
const attrs={};
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});console.error(id);
 const r=await p.evaluate(()=>{const o={};document.querySelectorAll('#view [data-go],#view [data-open],#view button,#view a,#view [role=button],#view [tabindex]').forEach(e=>{for(const a of e.attributes){if(a.name.startsWith('data-')){const k=a.name;o[k]=(o[k]||0)+1}}});return o});
 for(const k in r){attrs[k]=attrs[k]||{n:0,s:0};attrs[k].n+=r[k];attrs[k].s++}}
console.log(Object.entries(attrs).sort((a,b)=>b[1].n-a[1].n).slice(0,150).map(([k,v])=>k+' '+v.n+' /'+v.s).join('\n'));await b.close()})();

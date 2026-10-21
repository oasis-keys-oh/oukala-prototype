// PR-31 probe: unnamed controls, keyboard focus, rail flyout and the lens chip for one persona and screen
const L=require('./lib');(async()=>{const {b,p}=await L.open();const k=process.argv[2]||'pm',id=process.argv[3]||'ppm_proj';
await L.setup(p,k);await L.goto(p,id);
console.log(JSON.stringify(await p.evaluate(()=>{const v=document.querySelector('#view');const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
 const nn=[...v.querySelectorAll('button,[role=button],a[href],[onclick]')].filter(vis).filter(b=>!(b.innerText||'').trim()&&!b.getAttribute('aria-label')&&!b.getAttribute('title'));
 const lens=[...document.querySelectorAll('button')].find(b=>/Lens/.test(b.innerText));
 return {noName:nn.slice(0,6).map(e=>e.outerHTML.slice(0,200)),lens:lens&&lens.outerHTML.slice(0,300),persona:S.persona,lensVal:typeof PREF!=='undefined'&&(PREF.lens||S.lens)}}),null,1));
/* keyboard: tab 15 times from top and record focus */
await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();window.scrollTo(0,0)});const f=[];
for(let i=0;i<18;i++){await p.keyboard.press('Tab');f.push(await p.evaluate(()=>{const a=document.activeElement;const s=getComputedStyle(a);return (a.innerText||a.getAttribute('aria-label')||a.id||a.tagName).trim().slice(0,30)+' ['+(s.outlineStyle!=='none'&&s.outlineWidth!=='0px'?'outline':s.boxShadow!=='none'?'shadow':'NONE')+']'}))}
console.log('TAB ORDER:',f.join(' > '));await b.close()})();

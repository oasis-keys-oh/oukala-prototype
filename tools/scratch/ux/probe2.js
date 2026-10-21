const {open}=require('./lib');(async()=>{const {b,p}=await open({persona:'emp'});
const r=await p.evaluate(()=>{const q=s=>[...document.querySelectorAll(s)];
 return {title:document.title,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,themeAttrs:[...document.documentElement.attributes].map(a=>a.name+'='+a.value.slice(0,40)),
 landmarks:q('header,nav,main,aside,footer,[role=main],[role=navigation],[role=banner]').map(e=>e.tagName+'#'+e.id+'.'+e.className.toString().slice(0,30)+' role='+e.getAttribute('role')+' label='+e.getAttribute('aria-label')),
 skip:q('a[href^="#"]').slice(0,5).map(a=>a.textContent.trim().slice(0,40)+' '+a.getAttribute('href')),
 h1:q('h1').map(h=>h.textContent.trim().slice(0,60)),
 h2:q('#view h2').slice(0,8).map(h=>h.textContent.trim().slice(0,60)),
 viewText:document.querySelector('#view').innerText.slice(0,2500),
 rail:(document.querySelector('nav')||{}).innerText?.slice(0,800),
 topbar:(document.querySelector('header')||document.querySelector('.topbar')||{}).innerText?.slice(0,500),
 themeBtns:q('button').filter(b=>/theme|dark|light/i.test(b.textContent+b.getAttribute('aria-label')+b.title)).map(b=>b.outerHTML.slice(0,200))}});
console.log(JSON.stringify(r,null,1));console.log(p.errs);await b.close()})();

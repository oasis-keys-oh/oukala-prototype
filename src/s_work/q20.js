 const nav=document.querySelector('aside.rail nav');
 const res=[];
 nav.querySelectorAll('details.navgd').forEach(d=>{const sm=d.querySelector('summary');const items=[...d.querySelectorAll('[data-go]')].map(b=>b.getAttribute('data-go'));const subs=[...d.querySelectorAll('.navsub,.nav-sub,h4,.navh,[class*=sub]')].map(x=>x.textContent.trim().slice(0,40));res.push({g:sm.textContent.trim().replace(/\s+/g,' ').slice(0,60),n:items.length,items,subs:[...new Set(subs)].slice(0,12),cls:d.className})});
 const more=nav.querySelector('details.r15d-more');
 return JSON.stringify({res,html:nav.querySelector('details.navgd').outerHTML.slice(0,1800)});

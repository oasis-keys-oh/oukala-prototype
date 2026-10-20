 const nav=document.querySelector('aside.rail nav');const res=[];
 nav.querySelectorAll('details[data-ng]').forEach(d=>{const gl=d.querySelector('.nx-gl').textContent;const gid=d.getAttribute('data-ng');let sub='';const items=[];
  [...d.children].forEach(ch=>{if(ch.tagName==='SUMMARY')return;if(ch.classList.contains('navit')){const b=ch.querySelector('[data-nav]');items.push({id:ch.getAttribute('data-nx-it'),l:ch.querySelector('.nx-l').textContent.trim(),h:(ch.querySelector('.nx-h')||{textContent:''}).textContent.trim(),sub})}else{sub=ch.textContent.trim().slice(0,50)}});
  res.push({gid,gl,n:items.length,items})});
 return JSON.stringify(res);

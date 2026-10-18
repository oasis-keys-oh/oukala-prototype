 const res={};const sl=ms=>new Promise(r=>setTimeout(r,ms));
 for(const k of Object.keys(PERSONAS)){
  NAVX.persona.set(k);go('home');await sl(350);
  const v=document.querySelector('#view');
  const pins=[...document.querySelectorAll('aside.rail .r15d-pins .navit')].length;
  const vis=[...new Set([...document.querySelectorAll('aside.rail [data-nav]')].map(b=>b.getAttribute('data-nav')))].length;
  const portal=document.documentElement.className+'|'+document.body.getAttribute('data-layout')+'|'+document.body.className;
  res[k]={secs:[...v.querySelectorAll('.cardhead h3')].map(x=>x.textContent.trim()).slice(0,8),pins,vis,landing:location.hash,portal};
 }
 NAVX.persona.set("exec");
 return JSON.stringify(res);

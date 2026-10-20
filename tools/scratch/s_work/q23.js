 const o={};o.r15d=Object.keys(R15D).join(',');o.persona=typeof NAVX.persona==='function'?'fn':Object.keys(NAVX.persona||{}).join(',');
 const res={};
 const sl=ms=>new Promise(r=>setTimeout(r,ms));
 for(const k of ['exec','fin','audit','guest','emp','newhire']){
  try{ if(R15D.setPersona)R15D.setPersona(k);else if(window.setPersona)setPersona(k);else S.persona=k; }catch(e){res[k]='err '+e.message}
  go('home');await sl(400);
  const v=document.querySelector('#view');res[k]={p:S.persona,h1:(v.querySelector('h1')||{}).textContent,cards:v.querySelectorAll('.card').length,eyebrow:(v.querySelector('.eyebrow')||{}).textContent,portalLayout:document.body.className,secs:[...v.querySelectorAll('.cardhead h3,h2')].map(x=>x.textContent.trim()).slice(0,10),rail:document.querySelectorAll('aside.rail .navit').length}
 }
 o.res=res;
 try{R15D.setPersona('exec')}catch(e){}
 return JSON.stringify(o);

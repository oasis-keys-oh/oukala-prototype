 const sl=ms=>new Promise(r=>setTimeout(r,ms));
 const out=[];const ids=SCREENS.map(s=>s[0]);
 const pk=Object.keys(PERSONAS);
 for(const id of ids){
  try{go(id)}catch(e){}
  await sl(120);
  const v=document.querySelector('#view');
  const g=(NAVX.map[id]||{});
  const mod=MODMAP.modules.find(m=>m.scr===id||m.id===id);
  const eb=v&&v.querySelector('.eyebrow');const tag=v&&v.querySelector('.r15-tag');const story=v&&v.querySelector('.hero .story');
  const prim=v&&[...v.querySelectorAll('.btn.primary')].find(b=>b.offsetParent!==null&&!/Why|Read more/.test(b.textContent));
  const ownm=eb&&/Owner\s+([A-Z][^\n]*)/.exec(eb.textContent);
  let own=null;try{own=OWNX.ownedScreens?null:null}catch(e){}
  let ow=null;try{const rec=OWNX.records().find(r=>r.kind==='module'&&r.id===id);ow=rec&&{o:rec.ownerName,b:rec.backupName}}catch(e){}
  const pers=pk.filter(p=>{try{return PERM.can(p,'read','screen:'+id).ok}catch(e){return false}});
  out.push({id,label:NAVX.label(id),g:g.g,formal:NAVX.hint(id),tag:tag&&tag.textContent.trim().slice(0,160),story:story&&story.textContent.trim().slice(0,200),prim:prim&&prim.textContent.trim().slice(0,40),own:ownm&&ownm[1].trim().slice(0,40),ow,r:mod?(mod.r||[]).slice(0,6):null,w:mod?(mod.w||[]).slice(0,6):null,pers:pers.length,persList:pers.length<13?pers:'all',st:(PROC.defs&&PROC.defs[id])?PROC.defs[id].steps.length:0});
 }
 go('home');
 return out;

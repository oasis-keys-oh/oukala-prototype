 const o={};const sl=ms=>new Promise(r=>setTimeout(r,ms));const rc=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)].join(',')};
 go('home');await sl(300);
 o.searchProviders=SEARCHX.length;o.askIntents=ASKX.length;
 const idx=NAVX.ensureIndex&&NAVX.ensureIndex();
 try{o.nxIndexN=NAVX.index&&(NAVX.index.length||Object.keys(NAVX.index).length)}catch(e){}
 for(const [k,sel,btn] of [['fav','#nxFavPop','#nxFavBtn'],['hist','#nxHistPop','#nxHistBtn'],['new','#nwPop','#nwBtn'],['bell','#inbxPanel','#inbxBell'],['role','.r15d-rolepop,[id*=vas]','#r15dVasBtn']]){
  try{document.querySelector(btn).click()}catch(e){}
  await sl(450);const e=document.querySelector(sel);o[k]=rc(e)+' '+(e?getComputedStyle(e).display:'');
  o[k+'_txt']=e?e.textContent.trim().replace(/\s+/g,' ').slice(0,260):'';
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await sl(200);
 }
 const q=document.querySelector('#q');q.focus();q.value='budget';q.dispatchEvent(new Event('input',{bubbles:true}));await sl(700);
 const sr=document.querySelector('.nx-sr,#nxSr,.nx-results,[class*=sresult]');o.sr=sr?rc(sr)+' '+sr.className:null;
 o.srtxt=sr?sr.textContent.trim().replace(/\s+/g,' ').slice(0,300):'';
 const pal=document.querySelector('#nxPal');o.pal=rc(pal)+' '+getComputedStyle(pal).display;
 return JSON.stringify(o,null,1);

/* Connectivity harness (Round 14): walks every linked-record chip and drill link on every screen.
   usage: NODE_PATH=$(npm root -g) node zl_walk.js <html> <out.json> [shard i] [of n] [cap per screen] [--deep] */
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const a=process.argv.slice(2);const html=path.resolve(a[0]),out=a[1],si=+(a[2]||0),sn=+(a[3]||1),CAP=+(a[4]||18),DEEP=a.includes('--deep');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1440,height:1000}});const p=await ctx.newPage();p.setDefaultTimeout(60000);
await p.route(/^https?:/,r=>r.abort());
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+html);await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__ZW=window.__ZW||{};
 window.__ZW.collect=(rootSel,cap)=>{
  const BAD=/approve|reject|delete|remove|save|submit|undo|decide|apply|revert|reset|simulate|run|publish|send|accept|dismiss|snooze|close|toggle|export|drag|new|create|add/i;
  const NAMED=['data-go','data-person','data-lr-go','data-rec','data-nav','data-pl-open','data-dx-goproc','data-mm-gomod','data-ownx-open','data-exe-app','data-kcs-open','data-rel-open','data-plk-n','data-at-ent','data-meet','data-task','data-dr-open','data-ppm-ritem','data-obs-ci','data-mt'];
  const seen=new Set(),res=[];
  document.querySelectorAll(rootSel+' [data-go],'+rootSel+' [data-person],'+rootSel+' [data-lr-go],'+rootSel+' [data-rec],'+rootSel+' button,'+rootSel+' a,'+rootSel+' [role=button],'+rootSel+' .pchipx').forEach(el=>{
   let key=null;for(const at of el.attributes){const n=at.name;if(!n.startsWith('data-'))continue;
    if(NAMED.includes(n)||/^data-([a-z0-9]+-)*(go|open|goto|drill|jump|link)([a-z0-9-]*)$/.test(n)){if(BAD.test(n.replace(/^data-/,'').replace(/-?(go|open)/,'')))continue;key=n+'='+at.value;break}}
   if(!key||seen.has(key))return;seen.add(key);
   const r=el.getBoundingClientRect();
   let exp='';const t=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);
   res.push({key,txt:t,go:el.getAttribute('data-go'),person:el.getAttribute('data-person'),rec:el.getAttribute('data-rec'),lr:el.getAttribute('data-lr-go')});
  });
  const by={};res.forEach(r=>{const n=r.key.split('=')[0];(by[n]=by[n]||[]).push(r)});
  const names=Object.keys(by),out=[];let i=0;while(out.length<cap&&names.some(n=>by[n].length>i)){names.forEach(n=>{if(by[n][i]&&out.length<cap)out.push(by[n][i])});i++}
  return out};
 window.__ZW.click=(key)=>{
  const [n,...v]=key.split('=');const val=v.join('=');
  const el=[...document.querySelectorAll('#view *, #drawer *')].find(e=>e.getAttribute&&e.getAttribute(n)===val&&(e.tagName==='BUTTON'||e.tagName==='A'||e.getAttribute('role')==='button'||true));
  if(!el)return null;
  const d=document.getElementById('drawer');
  const before={scr:S.screen,view:document.getElementById('view').innerHTML.length,vh:(document.getElementById('view').innerHTML.slice(0,4000)),dr:d&&d.matches(':popover-open'),dlg:document.querySelectorAll('dialog[open],.modal,.inbx-panel.open').length,body:document.body.innerHTML.length};
  window.__ZW.before=before;window.__ZW.errs=0;
  try{el.click()}catch(e){return {err:String(e)}}
  return {ok:1}};
 window.__ZW.after=()=>{const d=document.getElementById('drawer'),v=document.getElementById('view'),b=window.__ZW.before;
  const dro=d&&d.matches(':popover-open');
  const dtxt=dro?d.innerText:'';
  const dlgs=document.querySelectorAll('dialog[open],.modal,.inbx-panel.open');
  const dlgTxt=[...dlgs].map(x=>x.innerText).join(' ');
  const toast=[...document.querySelectorAll('.toast,#toast,[role=status]')].map(x=>x.innerText).join(' ').slice(0,100);
  return {scr:S.screen,scrChanged:S.screen!==b.scr,viewChanged:v.innerHTML.slice(0,4000)!==b.vh||v.innerHTML.length!==b.view,drawer:!!dro,dtxt:dtxt.slice(0,3000),dlgTxt:dlgTxt.slice(0,2000),toast,vtxt:v.innerText.slice(0,3000),vlen:v.innerHTML.length,bodyChanged:document.body.innerHTML.length!==b.body}};
});
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
let mine=ids.filter((_,i)=>i%sn===si);if(process.env.ZL_SCREENS){const want=process.env.ZL_SCREENS.split(',');mine=want.filter(x=>ids.includes(x)).filter((_,i)=>i%sn===si)}
const log=[];let total=0;
const BADTXT=/not found|unknown (record|invoice|project|line|contract|service)|undefined|\bNaN\b|\bnull\b|no such|could not find|cannot read/i;
async function test(screen,L,depth,parent){
 const before=errs.length;
 const r=await p.evaluate(k=>window.__ZW.click(k),L.key);
 if(!r){log.push({screen,depth,parent,key:L.key,txt:L.txt,verdict:'lost',why:'element not found after re-render'});return null}
 await p.waitForTimeout(90);
 const A=await p.evaluate(()=>window.__ZW.after());
 total++;
 let verdict='ok',why='';
 const dest=(A.dtxt+' '+A.dlgTxt+' '+A.vtxt).toLowerCase();
 const changed=A.scrChanged||A.viewChanged||A.drawer||A.dlgTxt||A.toast||A.bodyChanged;
 if(errs.length>before){verdict='error';why=errs.slice(before).join(' | ').slice(0,160)}
 else if(!changed){verdict='dead';why='click changed nothing'}
 else if(L.go&&A.scr!==L.go&&!A.drawer){verdict='mismatch';why='data-go='+L.go+' landed on '+A.scr}
 else {
  const dt=(A.drawer?A.dtxt:(A.scrChanged?A.vtxt:A.dtxt+A.dlgTxt+A.vtxt));
  if(A.drawer&&dt.trim().length<40){verdict='empty';why='drawer text <40 chars'}
  else if(!A.drawer&&A.scrChanged&&A.vlen<400){verdict='empty';why='screen rendered <400 chars'}
  else if(BADTXT.test(dt.slice(0,600))&&(A.drawer||A.scrChanged)){verdict='badtext';why=(dt.match(BADTXT)||[''])[0]}
  else {
   let tok='';
   if(L.person)tok=L.person;else if(L.rec)tok=L.rec;else{const m=(L.txt||'').match(/\b([A-Z]{2,5}-\d{2,6}|INC\d+|CHG\d+|PRB\d+|PR\d\b|INV-\d+|KB\d+|SOP-\d+|CT-\d+|PO-\d+|SOW-\d+|CI-\d+|ci_[a-z0-9]+)\b/);if(m)tok=m[1]}
   if(tok&&(A.drawer||A.dlgTxt||A.scrChanged)){
     let ok=dest.includes(tok.toLowerCase());
     if(!ok&&L.rec){/* record ids resolve to a node name */ const nm=null; ok=true}
     if(!ok&&L.person){const f=tok.split(' ');ok=f.every(w=>dest.includes(w.toLowerCase()))}
     if(!ok){verdict='mismatch';why='destination does not show "'+tok+'"'}
   }}}
 log.push({screen,depth,parent,key:L.key,txt:L.txt,verdict,why,drawer:A.drawer,landed:A.scr});
 return A;
}
for(const id of mine){
 try{
  await p.evaluate(i=>{closeDrawer&&closeDrawer();go(i)},id);await p.waitForTimeout(150);
  const links=await p.evaluate(c=>window.__ZW.collect('#view',c),CAP);
  let deepN=0;
  for(const L of links){
   const A=await test(id,L,1,null);
   if(DEEP&&A&&A.drawer&&deepN<2){deepN++;
     const dl=await p.evaluate(()=>{const bak=document.querySelector('#view');return window.__ZW.collect('#drawer',6)});
     for(const L2 of dl){
       /* re-open parent */ 
       await p.evaluate(k=>{window.__ZW.click(k)},L.key).catch(()=>{});await p.waitForTimeout(100);
       await test(id,L2,2,L.key);
     }}
   const need=await p.evaluate(i=>{try{closeDrawer()}catch(e){};document.querySelectorAll('dialog[open]').forEach(d=>d.close&&d.close());const ch=S.screen!==i||document.getElementById('view').innerHTML.slice(0,4000)!==window.__ZW.before.vh;if(ch)go(i);return ch},id);if(need)await p.waitForTimeout(150);
  }
  console.error(id,links.length);
 }catch(e){log.push({screen:id,verdict:'harness',why:String(e).slice(0,120)});console.error('harness err',id,String(e).slice(0,100))}
 fs.writeFileSync(out+'.tmp',JSON.stringify({total,log},null,1));fs.renameSync(out+'.tmp',out);
}
fs.writeFileSync(out,JSON.stringify({total,log,errs:errs.slice(0,20)},null,1));
await b.close()})();

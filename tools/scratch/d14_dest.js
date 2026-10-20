const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const out=process.argv[2];const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await p.goto('file://'+out+'/full.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
await p.evaluate(async()=>{NAVX.ensureIndex(true);await new Promise(r=>setTimeout(r,200));for(let i=0;i<600&&(NAVX.index.building||!NAVX.index.built);i++)await new Promise(r=>setTimeout(r,100))});
const groups=await p.evaluate(()=>{const m={};NAVX.index.items.forEach((x,i)=>{const g=x.g||(x.ty+':'+((x.m||'').split(' · ')[0]));if(x.ty==='metric'||x.ty==='action')return;(m[g]=m[g]||[]).push(i)});return Object.entries(m).map(([g,a])=>[g,a.length,a.slice(0,2).concat(a.length>3?[a[a.length-1]]:[])])});
const res=[];
for(const [g,n,idxs] of groups){for(const i of idxs){
 await p.evaluate(()=>{try{closeDrawer()}catch(e){};document.querySelectorAll('[popover]:popover-open').forEach(x=>{try{x.hidePopover()}catch(e){}})});
 await p.evaluate(()=>{go('home')});await p.waitForTimeout(120);
 const r=await p.evaluate(async(i)=>{const it=NAVX.index.items[i];let err=null;try{it.f()}catch(e){err=String(e)}await new Promise(r=>setTimeout(r,650));
  const txt=[...document.querySelectorAll('#drawer:popover-open,#view,.drawer.open,[popover]:popover-open')].map(e=>e.innerText||'').join(' \n ');
  const dr=document.querySelector('#drawer:popover-open');const dt=dr?dr.innerText:'';
  const words=it.t.replace(/[^A-Za-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>=3);
  const lowT=txt.toLowerCase();const hit=words.filter(w=>lowT.includes(w.toLowerCase())).length;
  const empty=/(^|\n)\s*(No |Nothing |Select a |Pick a )[^\n]{0,60}/i.exec(dr?dt:(document.querySelector('#view')||{innerText:''}).innerText);
  return {t:it.t,screen:S.screen,drawer:!!dr,dlen:dt.length,vlen:(document.querySelector('#view')||{innerText:''}).innerText.length,hit,nw:words.length,err,empty:empty?empty[0].trim():null}},i);
 res.push({g,n,...r})}}
fs.writeFileSync(out+'/dest.json',JSON.stringify(res,null,1));
const bad=res.filter(r=>r.err||(r.nw&&r.hit===0)||(r.drawer&&r.dlen<60));
console.log('groups',groups.length,'checked',res.length,'bad',bad.length);bad.forEach(r=>console.log(r.g,'|',r.t.slice(0,50),'|scr',r.screen,'dr',r.drawer,r.dlen,'hit',r.hit+'/'+r.nw,r.err||'',r.empty||''));
console.log('errs',errs.slice(0,8));await b.close()})();

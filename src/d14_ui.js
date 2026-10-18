const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const out=process.argv[2];const Q=(process.argv[3]||"budget,vendor,invoice,contract,incident,change,project,risk,policy,laptop,onboarding,demand,approval,decision,meeting,forecast,reserve,PO,knowledge,runbook,agent,team,journey,cost center,agenda").split(',');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];
p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());await p.goto('file://'+out+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1200);
await p.evaluate(async()=>{NAVX.ensureIndex(true);await new Promise(r=>setTimeout(r,200));for(let i=0;i<900&&(NAVX.index.building||!NAVX.index.built);i++)await new Promise(r=>setTimeout(r,100))});
const res=[];
for(const q of Q){
 const rows=await p.evaluate(async(q)=>{NAVX.palette.open({q});await new Promise(r=>setTimeout(r,500));const P=NAVX.palette.state();const seen={};const out=[];P.rows.forEach((r,i)=>{if(!r.it)return;const g=r.it.g||r.ty;if(seen[g]>=1)return;seen[g]=1;if(r.ty==='ask'||r.ty==='screen'||r.ty==='metric'||r.ty==='action')return;out.push(i)});NAVX.palette.close();return out.slice(0,9)},q);
 for(const i of rows){
  const r=await p.evaluate(async({q,i})=>{try{closeDrawer()}catch(e){}go('home');await new Promise(r=>setTimeout(r,100));NAVX.palette.open({q});await new Promise(r=>setTimeout(r,450));const P=NAVX.palette.state();const row=P.rows[i];if(!row){return {skip:1}}const t=row.t,g=(row.it&&row.it.g)||row.ty;let err=null;NAVX.palette.close();try{row.f()}catch(e){err=String(e).slice(0,80)}await new Promise(r=>setTimeout(r,800));
   const dr=document.querySelector('#drawer:popover-open');const dt=dr?dr.innerText:'';const vt=(document.querySelector('#view')||{innerText:''}).innerText;const txt=(dt+' '+vt).toLowerCase();
   const words=t.replace(/[^A-Za-z0-9 -]/g,' ').split(/\s+/).filter(w=>w.length>=3);const hit=words.filter(w=>txt.includes(w.toLowerCase())).length;const idm=t.match(/^[A-Z]{1,6}-?\d{2,}/);const idok=idm?txt.includes(idm[0].toLowerCase()):null;
   const drawerOk=!!dr&&dt.length>80;return {q,t:t.slice(0,48),g,screen:S.screen,drawer:!!dr,dlen:dt.length,hit,nw:words.length,idok,err,sel:null}},{q,i});
  if(!r.skip)res.push(r)}}
fs.writeFileSync(out+'/ui.json',JSON.stringify(res,null,1));
const bad=res.filter(r=>r.err||(r.nw&&r.hit===0)||r.idok===false);
console.log('checked',res.length,'bad',bad.length);bad.forEach(r=>console.log(r.q,'|',r.g,'|',r.t,'|',r.screen,'drawer',r.drawer,r.dlen,'hit',r.hit+'/'+r.nw,'id',r.idok,r.err||''));
console.log('errs',errs.slice(0,6));await b.close()})();

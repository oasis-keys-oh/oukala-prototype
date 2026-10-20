/* Static chip scan (Round 14): visits every screen, reads every linked-record attribute and checks the target exists.
   usage: node zl_scan.js <html> <out.json> [shard i] [of n] */
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const a=process.argv.slice(2);const html=path.resolve(a[0]),out=a[1],si=+(a[2]||0),sn=+(a[3]||1);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();p.setDefaultTimeout(120000);await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+html);await p.waitForTimeout(6000);
const ids=(await p.evaluate(()=>SCREENS.map(s=>s[0]))).filter((_,i)=>i%sn===si);
const res={screens:0,chips:0,dead:[],byAttr:{}};
for(const id of ids){await p.evaluate(i=>go(i),id).catch(()=>{});await p.waitForTimeout(120);
 const r=await p.evaluate(()=>{const SC=new Set(SCREENS.map(s=>s[0]));const has=(f,d)=>{try{return !!f()}catch(e){return d}};
  const dirN=new Set(DIR.map(d=>d.name));const svc=new Set(SVCREG.map(s=>s.id));const mm=new Set(MODMAP.modules.map(m=>m.id));const pl=new Set(PROCLIB.list().map(p=>p.id));
  const out=[],cnt={};
  document.querySelectorAll('#view *').forEach(el=>{for(const at of el.attributes){const n=at.name,v=at.value;if(!n.startsWith('data-')||!v)continue;let ok=null;
   if(n==='data-go'){const [s,arg]=v.split(':');ok=SC.has(s);if(ok&&arg){if(s==='metrics')ok=!!METRICS[arg];else if(s==='inv')ok=INVOICES.some(i=>i.id===arg);else if(s==='trace')ok=has(()=>N(arg),false)}}
   else if(n==='data-nav')ok=SC.has(v);
   else if(n==='data-person')ok=dirN.has(v)||has(()=>who(v),false);
   else if(n==='data-rec')ok=has(()=>N(v),false)||has(()=>KGN.some(x=>x.id===v),false);
   else if(n==='data-s360-open')ok=svc.has(v)||SVCREG.some(s=>s.n===v);
   else if(n==='data-mm-gomod')ok=mm.has(v);
   else if(n==='data-pl-open'||n==='data-dx-goproc'){const v0=v.split('|')[0];ok=pl.has(v0)||has(()=>PROC.defs[v0],false)}
   if(ok===null)continue;cnt[n]=(cnt[n]||0)+1;if(!ok)out.push({attr:n,val:v,txt:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,50)})}});
  return {out,cnt}});
 res.screens++;for(const k in r.cnt){res.chips+=r.cnt[k];res.byAttr[k]=(res.byAttr[k]||0)+r.cnt[k]}
 const seen=new Set();r.out.forEach(d=>{const k=id+d.attr+d.val;if(!seen.has(k)){seen.add(k);res.dead.push(Object.assign({screen:id},d))}});
 console.error(id,r.out.length)}
fs.writeFileSync(out,JSON.stringify(res,null,1));console.log('screens',res.screens,'chips',res.chips,'dead',res.dead.length,JSON.stringify(res.byAttr));await b.close()})();

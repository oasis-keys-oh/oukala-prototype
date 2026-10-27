// PR-32 measurement harness (read-only audit, docs/data/). Not a test; changes no product code.
// Usage: node tools/scratch/data/instrument.js [build_out] [out.json]
// Opens build_out/full.html under the core tenant, wraps the Atlantic sample data in place with read trackers
// (array index getters and method wrappers, object property accessors), opens every registered screen with go(id),
// clicks up to 8 tabs per screen, and records which data globals were read and which DATA entities were asked for.
// Phases: "render" = inside the screen's registered render function; "after" = afterRender hooks and timers until settle;
// "tabs" = while its tabs were clicked. Reads made inside DATA.get are kept apart ("viaData"), so a screen that reads
// through the data layer is not counted as a direct reader of the global behind it.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{
const dir=path.resolve(process.argv[2]||'build_out');const out=process.argv[3]||path.join(__dirname,'reads.json');
const b=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message.slice(0,200)));
await p.route(/^https?:/,r=>r.abort());
await p.goto('file://'+dir+'/full.html',{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForFunction(()=>typeof SCREENS!=='undefined'&&typeof go==='function'&&document.querySelector('#view'),null,{timeout:120000});
await p.waitForTimeout(1500);
// settle lazy registries by opening every screen once before instrumenting (process and workflow registries grow on first render)
const ids=await p.evaluate(()=>SCREENS.map(s=>s[0]));
for(const id of ids){await p.evaluate(i=>{try{go(i)}catch(e){}},id);}
await p.evaluate(()=>go('home'));await p.waitForTimeout(800);
const inst=await p.evaluate(()=>{
 const T=window.__TRK={cur:null,phase:null,inR:0,inWork:0,viaData:0,reads:{},ents:{},seen:new WeakMap(),paths:[]};
 const rec=path=>{if(!T.cur||!T.inR||S.screen!==T.cur)return;/* a tab that navigates away renders another screen: not this one's read */const r=T.reads[T.cur]||(T.reads[T.cur]={render:{},tabs:{},callers:{}});
  if(T.inWork){const wk=r.work||(r.work={});wk[path]=(wk[path]||0)+1;return}const k=T.phase==='tabs'?'tabs':'render';const n=r[k][path]=(r[k][path]||0)+1;
  // caller frames: the first frame in full.html after the tracker; sampled (reads 1 to 12, then every 40th)
  const tot=(r.callers[path]||(r.callers[path]={n:0,lines:{}}));tot.n++;
  if(tot.n<=12||tot.n%40===0){const st=(new Error().stack||'').split('\n');for(let i=2;i<st.length;i++){const m=/full\.html:(\d+):\d+/.exec(st[i]);if(m){tot.lines[m[1]]=(tot.lines[m[1]]||0)+1;break}}}};
 const isPlain=o=>o&&typeof o==='object'&&!(o instanceof Node)&&!(o instanceof Window)&&(Object.getPrototypeOf(o)===Object.prototype||Array.isArray(o));
 const METH=['map','filter','forEach','find','findIndex','findLast','reduce','reduceRight','some','every','slice','concat','indexOf','includes','join','flatMap','flat','entries','keys','values','sort','at','lastIndexOf','toSorted'];
 const wrapArr=(a,path)=>{if(!Array.isArray(a)||T.seen.has(a)||Object.isFrozen(a))return;T.seen.set(a,path);T.paths.push(path);
  METH.forEach(m=>{const f=Array.prototype[m];if(!f)return;Object.defineProperty(a,m,{configurable:true,writable:true,enumerable:false,value:function(){rec(path);return f.apply(this,arguments)}})});
  Object.defineProperty(a,Symbol.iterator,{configurable:true,writable:true,enumerable:false,value:function(){rec(path);return Array.prototype.values.call(this)}});
  const n=Math.min(a.length,4000);for(let i=0;i<n;i++){let v=a[i];wrapRec(v,path);try{Object.defineProperty(a,i,{configurable:true,enumerable:true,get(){rec(path);return v},set(x){v=x}})}catch(e){}}};
 // record fields: which keys of a row a screen reads (first level only)
 const recF=(path,k)=>{if(!T.cur||!T.inR||T.inWork||S.screen!==T.cur)return;const r=T.reads[T.cur]||(T.reads[T.cur]={render:{},tabs:{},callers:{}});const f=r.fields||(r.fields={});const m=f[path]||(f[path]={});m[k]=(m[k]||0)+1};
 const wrapRec=(o,path)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.getPrototypeOf(o)!==Object.prototype||T.seen.has(o)||Object.isFrozen(o))return;T.seen.set(o,path);
  Object.keys(o).forEach(k=>{const d=Object.getOwnPropertyDescriptor(o,k);if(!d||!d.configurable||!('value' in d)||typeof d.value==='function')return;let v=d.value;
   try{Object.defineProperty(o,k,{configurable:true,enumerable:d.enumerable,get(){recF(path,k);return v},set(x){v=x}})}catch(e){}})};
 const wrapObj=(o,path,collapse)=>{if(!isPlain(o)||Array.isArray(o)||T.seen.has(o)||Object.isFrozen(o))return;T.seen.set(o,path);T.paths.push(path);
  Object.keys(o).forEach(k=>{const d=Object.getOwnPropertyDescriptor(o,k);if(!d||!d.configurable||!('value' in d))return;let v=d.value;
   const sub=collapse?path:path+'.'+k;if(collapse)wrapRec(v,path);
   if(!collapse&&v&&typeof v==='object'){if(Array.isArray(v))wrapArr(v,sub);}
   if(typeof v==='function')return;
   try{Object.defineProperty(o,k,{configurable:true,enumerable:d.enumerable,get(){rec(sub);return v},set(x){v=x;if(x&&typeof x==='object'&&Array.isArray(x)&&!collapse)wrapArr(x,sub)}})}catch(e){}})};
 // dict of records (most values are objects of the same kind) collapses to one path; a namespace keeps one path per member
 const looksDict=o=>{const ks=Object.keys(o);if(ks.length<6)return false;const objs=ks.filter(k=>o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k]));return objs.length/ks.length>0.7};
 const root=(name,val)=>{if(!val||typeof val!=='object')return;if(Array.isArray(val)){if(val.length)wrapArr(val,name);return}
  if(!isPlain(val)){// namespace with functions (e.g. window.ITSM): its array members only
   Object.keys(val).forEach(k=>{let v;try{v=val[k]}catch(e){return}if(Array.isArray(v)&&v.length&&v.some(x=>x&&typeof x==='object'))wrapArr(v,name+'.'+k);
    else if(isPlain(v)&&!Array.isArray(v)&&looksDict(v))wrapObj(v,name+'.'+k,true)});return}
  if(looksDict(val))wrapObj(val,name,true);else{wrapObj(val,name,false);
   Object.keys(val).forEach(k=>{const d=Object.getOwnPropertyDescriptor(val,k);/* already wrapped: read nested arrays of plain namespaces through the getter once */
    let v;try{v=val[k]}catch(e){return}if(isPlain(v)&&!Array.isArray(v)){if(looksDict(v))wrapObj(v,name+'.'+k,true);else Object.keys(v).forEach(k2=>{let w;try{w=v[k2]}catch(e){return}if(Array.isArray(w)&&w.length&&w.some(x=>x&&typeof x==='object'))wrapArr(w,name+'.'+k+'.'+k2)})}})}};
 // 1. lexical consts of the core files (data.js, data2.js, kit.js, kit2.js, screens*.js): not on window, reachable by name
 const LEX=['METRICS','NODES','EDGES','INVOICES','RULES','MEETINGS','EXTRACTED','TRANSCRIPT','AGENTS','SPEND30','LIVEEVENTS','PROV_SHARE','PERSONAS','AUDIT','TRENDS','KGN','KGE','KSCEN','TREE','STEPS','FLOW','LANES','PATHS',
  'WD','PROJ','CAP','SUMS','XT','IDX','TMAP','PTYPES','CTYPES','BASE','IMS_SCEN','PC','PTC','WBS_SEED','ANCHOR','PPMX','DEMAND','DW0','VERS','LOG0','LOGX','MONTHS',
  'PEOPLE','TEAMS','DIR','WORK','DATAMODEL','PROC','SCALE','SVCREG','CIREG','CIEDGE','COV','FILESLOT','LST'];
 const done=new Set();LEX.forEach(n=>{try{const v=eval(n);root(n,v);done.add(n)}catch(e){}});
 // 2. S (app state): its data members (S.bud, S.exe, S.itsm and so on)
 Object.keys(S).forEach(k=>{const v=S[k];if(v&&typeof v==='object'){if(Array.isArray(v)){if(v.length&&v.some(x=>x&&typeof x==='object'))wrapArr(v,'S.'+k)}
  else if(isPlain(v)){if(looksDict(v))wrapObj(v,'S.'+k,true);else Object.keys(v).forEach(k2=>{const w=v[k2];if(Array.isArray(w)&&w.length&&w.some(x=>x&&typeof x==='object'))wrapArr(w,'S.'+k+'.'+k2);
   else if(isPlain(w)&&!Array.isArray(w)&&looksDict(w))wrapObj(w,'S.'+k+'.'+k2,true)})}}});
 // 3. window globals that hold data (module stores): upper-case names with array or object members holding records
 const SKIP=/^(DATA|U|HOOKS|STEPMODE|TRIGGERS|CHATADDR|SEARCHX|NAVX|SHOW|SCN|TENANT|TENANT_PACKS|IDENT|SCRMAP_DATA|BUNDLE|ROUTER|STN|__TRK|BRAND|ICON|PREF|USAGE|SRCH|JX|JXR|JYX|WFX|ZLINK|THREAD|NUM|GUARD|APG|AGENTRT|OWNERX|STEPKIT|PROCLIB|MODMAP|ATLAS|REG)$/;
 Object.getOwnPropertyNames(window).forEach(n=>{if(!/^[A-Z][A-Z0-9_]{1,}$/.test(n)||SKIP.test(n)||done.has(n))return;let v;try{v=window[n]}catch(e){return}
  if(!v||typeof v!=='object'||v instanceof Node)return;try{root(n,v)}catch(e){}});
 // 4. namespaces kept out of SKIP above but holding records: WFX.defs, JYX.JY.list, ODX, MODMAP
 try{wrapArr(WFX.defs,'WFX.defs')}catch(e){}try{wrapArr(JYX.JY.list,'JYX.JY.list')}catch(e){}try{wrapArr(MODMAP.modules||[],'MODMAP.modules')}catch(e){}
 // DATA.get: entity asked for, and reads inside it kept apart
 const g0=DATA.get;DATA.get=function(ent){const r=T.cur&&T.inR&&S.screen===T.cur&&(T.ents[T.cur]||(T.ents[T.cur]={}));if(r)r[ent]=(r[ent]||0)+1;T.viaData++;try{return g0.apply(this,arguments)}finally{T.viaData--}};
 // the person work index (kit2 WORK providers behind workFor, used by owner chips and load badges): reads inside a provider go to bucket "work"
 try{WORK.forEach(w=>{const f=w.fn;if(typeof f!=='function'||f.__trk)return;const g=function(){T.inWork++;try{return f.apply(this,arguments)}finally{T.inWork--}};g.__trk=1;w.fn=g})}catch(e){}
 // render functions: phase "render" while the screen's own function runs
 T.wrapR=()=>{Object.keys(_R).forEach(id=>{const f=_R[id];if(!f||f.__trk)return;const w=function(){T.inR++;try{return f.apply(this,arguments)}finally{T.inR--}};w.__trk=1;_R[id]=w})};T.wrapR();
 return {paths:T.paths.length,sample:T.paths.slice(0,400)};
});
console.log('instrumented',inst.paths,'paths');
const res={};const tabsSeen={};
for(const id of ids){
 await p.evaluate(i=>{__TRK.wrapR();__TRK.cur=i;__TRK.phase='render';try{go(i)}catch(e){console.error(e)}},id).catch(e=>errs.push(id+': '+e.message));
 await p.waitForTimeout(150);
 const tabs=await p.evaluate(()=>{__TRK.wrapR();__TRK.phase='tabs';const v=document.querySelector('#view');return [...v.querySelectorAll('[role=tab]')].slice(0,8).map((t,i)=>{t.setAttribute('data-trk-tab',i);return (t.textContent||'').trim().slice(0,40)})});
 tabsSeen[id]=tabs;
 for(let i=0;i<tabs.length;i++){await p.evaluate(([i,id])=>{const t=document.querySelector('#view [data-trk-tab="'+i+'"]');if(t&&S.screen===id)try{t.click()}catch(e){}},[i,id]);await p.waitForTimeout(60);
  await p.evaluate(id=>{if(S.screen!==id){const c=__TRK.cur;__TRK.cur=null;try{go(id)}catch(e){}__TRK.cur=c};document.querySelectorAll('#view [role=tab]').forEach((t,j)=>t.setAttribute('data-trk-tab',j))},id)}
 await p.evaluate(()=>{__TRK.phase=null;__TRK.cur=null;try{closeDrawer()}catch(e){}});
}
const data=await p.evaluate(()=>({reads:__TRK.reads,ents:__TRK.ents,paths:__TRK.paths,
 modes:Object.fromEntries(SCREENS.map(s=>[s[0],DATA.screenMode(s[0])])),names:Object.fromEntries(SCREENS.map(s=>[s[0],s[1]])),
 files:Object.fromEntries(SCREENS.map(s=>[s[0],((window.SCRMAP_DATA||{}).screens||{})[s[0]]||null])),
 dataScreens:DATA.screens().filter(s=>s.mode!=='core').map(s=>({id:s.id,mode:s.mode,entities:s.entities||[]})),
 entities:DATA.entities().map(e=>e.entity),
 tenants:DATA.tenants().map(t=>t.id),
 counts:Object.fromEntries(DATA.tenants().map(t=>[t.id,Object.fromEntries(DATA.entities().map(e=>[e.entity,DATA.get(e.entity,{tenant:t.id}).length]))])),
 terms:Object.fromEntries(DATA.tenants().map(t=>[t.id,DATA.terms(t.id)]))}));
data.tabs=tabsSeen;
// line -> source file map for full.html: module markers from build.py, core files located by their first line
const html=fs.readFileSync(path.join(dir,'full.html'),'utf8').split('\n');const marks=[];
const src=path.resolve(__dirname,'../../../src');
['platform.js','data.js','data2.js','ui.js','kit.js','kit2.js','screens1.js','screens2.js','screens4.js','screens3.js'].forEach(f=>{const first=fs.readFileSync(path.join(src,f),'utf8').split('\n').find(l=>l.trim().length>20);const i=html.findIndex(l=>l===first);if(i>=0)marks.push([i+1,f])});
html.forEach((l,i)=>{const m=/^\/\* ===== (mod_[A-Za-z0-9_]+) ===== \*\/$/.exec(l);if(m)marks.push([i+2,m[1]+'.js'])});
marks.sort((a,b)=>a[0]-b[0]);data.lineMap=marks;data.errors=errs;
fs.writeFileSync(out,JSON.stringify(data,null,1));console.log('screens',ids.length,'errors',errs.length,'->',out);await b.close()})();

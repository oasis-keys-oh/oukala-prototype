/* ===== Round 15, Agent F1, part A: window.STORE (durable entity store + hash-chained event log) and the Entity store screen.
   API: STORE.get(entity,id) put(entity,rec,opt) patch(entity,id,partial) all(entity) delete(entity,id) subscribe(entity|"*",fn)
   log (append-only, hash-chained) define(entity,spec) track(path) onHydrate(fn) export() import(obj) reset() meter() status()
   Backends in order: IndexedDB, localStorage, memory. Every access is wrapped in try/catch. ===== */
(function(){
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const NOW=()=>Date.now();
const actor=()=>G(()=>INBOX.me(),null)||G(()=>PERSONAS[S.persona].n,"System");
function h53(str,seed){let h1=0xdeadbeef^(seed||0),h2=0x41c6ce57^(seed||0);for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(16).padStart(14,"0")}
/* ---------- tagged JSON (keeps Set, Map, Date across a reload) ---------- */
function ser(v){return JSON.stringify(v,function(k,x){if(x instanceof Set)return{$set:[...x]};if(x instanceof Map)return{$map:[...x]};if(this[k] instanceof Date)return{$d:this[k].toISOString()};return x})}
function rev(k,x){if(x&&typeof x==="object"){if(x.$set)return new Set(x.$set);if(x.$map)return new Map(x.$map);if(x.$d)return new Date(x.$d)}return x}
function deser(s){return JSON.parse(s,rev)}
/* ---------- state ---------- */
const M={};            /* entity -> Map(id -> rec) */
const SUBS={};         /* entity|"*" -> [fn] */
const LOG=[];          /* append-only; hash chained */
const WARN=[];         /* visible schema warnings */
let SEQ=0,BACKEND="memory",DB=null,READY=false,LASTHASH="0",HYD=[],BYTES=0;
const Q={rec:[],log:[]};let flushT=0;
const META=new Set(["id","createdBy","createdAt","updatedBy","updatedAt","v","_by"]);
/* ---------- persistence backends ---------- */
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function idbOpen(){return new Promise((res,rej)=>{try{if(typeof indexedDB==="undefined")return rej(new Error("no idb"));const r=indexedDB.open("oukala-store",1);r.onupgradeneeded=()=>{const d=r.result;["rec","log","kv"].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:n==="log"?"seq":"k"})})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error("blocked"));setTimeout(()=>rej(new Error("idb timeout")),20000)}catch(e){rej(e)}})}
function idbAll(store){return new Promise((res,rej)=>{try{const tx=DB.transaction(store,"readonly"),rq=tx.objectStore(store).getAll();rq.onsuccess=()=>res(rq.result||[]);rq.onerror=()=>rej(rq.error)}catch(e){rej(e)}})}
function lsSave(){/* localStorage fallback: one JSON blob, trimmed log */
 try{const recs=[];Object.keys(M).forEach(en=>M[en].forEach((r,id)=>recs.push([en,id,r])));const blob=ser({recs,log:LOG.slice(-300),seq:SEQ});if(!lsSet("oukala-store:v1",blob)){lsSet("oukala-store:v1",ser({recs:recs.filter(x=>x[0]!=="app_state_snapshot"||false),log:[],seq:SEQ}))}}catch(e){}}
function flush(){flushT=0;
 if(BACKEND==="indexeddb"&&DB){const rs=Q.rec.splice(0),ls=Q.log.splice(0);if(!rs.length&&!ls.length)return;
  try{const tx=DB.transaction(["rec","log"],"readwrite");const sr=tx.objectStore("rec"),sl=tx.objectStore("log");rs.forEach(o=>{if(o.del)sr.delete(o.k);else sr.put({k:o.k,e:o.e,id:o.id,j:o.j})});ls.forEach(l=>sl.put(l));
   if(LOG.length>4200){const cut=LOG[LOG.length-4000].seq;sl.delete(IDBKeyRange.upperBound(cut-1));LOG.splice(0,LOG.length-4000)}
   tx.onerror=()=>{degrade("IndexedDB write failed")}}catch(e){degrade(String(e&&e.message||e))}}
 else if(BACKEND==="localstorage"){Q.rec.length=0;Q.log.length=0;lsSave()}}
function degrade(why){WARN.unshift({t:NOW(),entity:"(store)",msg:"Storage fell back from "+BACKEND+": "+why});if(BACKEND==="indexeddb"){BACKEND="localstorage";lsSave()}else BACKEND="memory";notify("*",{op:"backend",entity:"(store)"})}
function sched(){if(!flushT)flushT=setTimeout(flush,60)}
function persistRec(en,id,rec,del){const k=en+"|"+id;if(BACKEND==="indexeddb"){Q.rec.push(del?{k,del:1}:{k,e:en,id,j:ser(rec)})}else if(BACKEND==="localstorage"){Q.rec.push(1)}sched()}
/* ---------- schema (ATLAS / DATAMODEL entity definitions) ---------- */
const OPEN_OK=new Set();
function schema(en){const t=G(()=>DATAMODEL.tables[en],null);if(!t||!t.fields||!t.fields.length)return null;const m=new Map();t.fields.forEach(f=>m.set(f.k,f));return m}
function checkType(f,v){if(v==null)return true;const t=f.type;
 if(t==="number")return typeof v==="number"&&isFinite(v);
 if(t==="boolean")return typeof v==="boolean";
 if(t==="enum"&&Array.isArray(f.opts)&&f.opts.length)return f.opts.some(o=>String(o)===String(v)||(Array.isArray(o)&&o[0]===v));
 return true}
function warn(en,id,msg){WARN.unshift({t:NOW(),entity:en,id,msg});if(WARN.length>200)WARN.length=200;G(()=>toast("Store: "+msg,"warn"));G(()=>console.warn("STORE",en,id,msg))}
/* ---------- events and subscribers ---------- */
function notify(en,ev){[en,"*"].forEach(k=>(SUBS[k]||[]).slice().forEach(fn=>{try{fn(ev)}catch(e){console.error("STORE subscriber",e)}}))}
function appendLog(op,en,id,keys,extra){const e={seq:++SEQ,t:NOW(),op,entity:en,id,by:actor(),keys:keys||[],prev:LASTHASH};if(extra)e.note=extra;e.hash=h53(e.prev+"|"+e.seq+"|"+op+"|"+en+"|"+id+"|"+e.keys.join(",")+"|"+e.by+"|"+e.t);LASTHASH=e.hash;LOG.push(e);if(BACKEND==="indexeddb")Q.log.push(e);else if(BACKEND==="localstorage")Q.rec.push(1);if(LOG.length>4600)LOG.splice(0,LOG.length-4000);return e}
/* ---------- the API ---------- */
function ent(en){return M[en]||(M[en]=new Map())}
const STORE={
 get backend(){return BACKEND},warnings:WARN,log:LOG,
 get(en,id){return ent(en).get(String(id))||null},
 all(en){return en?[...ent(en).values()]:Object.keys(M)},
 count(en){return ent(en).size},
 entities(){return Object.keys(M).filter(k=>M[k].size)},
 put(en,rec,opt){opt=opt||{};if(!en||!rec||typeof rec!=="object"){warn(en,"","put needs an entity name and a record object");return null}
  const sc=schema(en);let id=rec.id!=null?String(rec.id):(en.slice(0,3).toUpperCase()+"-"+(1000+SEQ+1));
  const prev=ent(en).get(id),out={},rej=[];
  Object.keys(rec).forEach(k=>{if(META.has(k))return;const v=rec[k];if(sc){const f=sc.get(k);if(!f){rej.push(k);return}if(!checkType(f,v)){rej.push(k+" (expected "+f.type+")");return}}if(typeof v!=="function")out[k]=v});
  if(rej.length){warn(en,id,en+": rejected "+rej.length+" unknown or invalid field"+(rej.length>1?"s":"")+" ("+rej.slice(0,4).join(", ")+")");if(opt.strict)return null}
  if(!sc&&!OPEN_OK.has(en)){OPEN_OK.add(en);WARN.unshift({t:NOW(),entity:en,id,msg:"'"+en+"' has no ATLAS definition yet; stored without field checks. Define it with STORE.define."})}
  const t=NOW(),a=opt.by||actor();
  out.id=id;out.createdBy=prev?prev.createdBy:(rec.createdBy&&opt.keepAudit?rec.createdBy:a);out.createdAt=prev?prev.createdAt:(rec.createdAt&&opt.keepAudit?rec.createdAt:t);out.updatedBy=a;out.updatedAt=t;out.v=(prev?prev.v||0:0)+1;
  ent(en).set(id,out);persistRec(en,id,out);
  const changed=prev?Object.keys(out).filter(k=>!META.has(k)&&ser(out[k])!==ser(prev[k])):Object.keys(out).filter(k=>!META.has(k));
  if(!opt.silent){appendLog(prev?"update":"create",en,id,changed.slice(0,12));notify(en,{op:prev?"update":"create",entity:en,id,rec:out,prev})}
  return out},
 patch(en,id,part,opt){const p=ent(en).get(String(id));if(!p){warn(en,id,"patch: no such record");return null}return STORE.put(en,Object.assign({},p,part,{id:p.id}),opt)},
 delete(en,id,opt){id=String(id);const p=ent(en).get(id);if(!p)return false;ent(en).delete(id);persistRec(en,id,null,true);appendLog("delete",en,id,[]);notify(en,{op:"delete",entity:en,id,prev:p});return true},
 subscribe(en,fn){(SUBS[en]||(SUBS[en]=[])).push(fn);return()=>{const a=SUBS[en];const i=a.indexOf(fn);if(i>=0)a.splice(i,1)}},
 /* run fn once now for existing records and once the store has finished loading */
 onHydrate(fn){if(READY)try{fn()}catch(e){console.error(e)}else HYD.push(fn)},
 define(en,spec){/* spec {label,domain,fields:[{k,label,type,opts}],note,steward}; goes through ATLAS.addEntity (proposed), falls back to DATAMODEL.register */
  if(DATAMODEL.tables[en])return{ok:true,id:en,existing:true};
  let r=null;try{r=window.ATLAS&&ATLAS.addEntity?ATLAS.addEntity(Object.assign({id:en,status:"proposed",source:"Entity store"},spec)):null}catch(e){r=null}
  if(!r||r.ok===false||!DATAMODEL.tables[en]){DATAMODEL.register(en,{label:spec.label||en,source:spec.source||"Entity store",fields:(spec.fields||[]).map(f=>({k:f.k,label:f.label||f.k,type:f.type||"string",opts:f.opts}))});if(DATAMODEL.tables[en])DATAMODEL.tables[en].status="proposed"}
  return r||{ok:true,id:en}},
 export(){const o={format:"oukala-store/1",exportedAt:new Date().toISOString(),by:actor(),entities:{},log:LOG.slice(-1000)};Object.keys(M).forEach(en=>{if(M[en].size)o.entities[en]=[...M[en].values()]});return o},
 import(o,opt){opt=opt||{};if(!o||o.format!=="oukala-store/1"||!o.entities)return{ok:false,why:"Not an "+BRAND.name+" store export (format oukala-store/1)"};let n=0,bad=0;Object.keys(o.entities).forEach(en=>o.entities[en].forEach(r=>{const x=STORE.put(en,r,{keepAudit:true,silent:true});if(x){n++;persistRec(en,x.id,x)}else bad++}));appendLog("import","(store)","",[n+" records"]);flush();notify("*",{op:"import"});return{ok:true,n,bad}},
 reset(){/* wipe every persisted byte and reload from seed data */
  try{localStorage.removeItem("oukala-store:v1")}catch(e){}
  const done=()=>{try{location.reload()}catch(e){}};
  try{if(DB){DB.close()}const rq=indexedDB.deleteDatabase("oukala-store");rq.onsuccess=rq.onerror=rq.onblocked=done;setTimeout(done,1500)}catch(e){done()}},
 meter(){let n=0;Object.keys(M).forEach(en=>M[en].forEach(r=>{try{n+=ser(r).length}catch(e){}}));return{bytes:n,records:Object.keys(M).reduce((a,k)=>a+M[k].size,0),entities:STORE.entities().length,log:LOG.length,backend:BACKEND}},
 verify(){/* walk the hash chain */let prev=null,bad=null;for(let i=0;i<LOG.length;i++){const e=LOG[i];if(prev!==null&&e.prev!==prev){bad=e.seq;break}const hh=h53(e.prev+"|"+e.seq+"|"+e.op+"|"+e.entity+"|"+e.id+"|"+e.keys.join(",")+"|"+e.by+"|"+e.t);if(hh!==e.hash){bad=e.seq;break}prev=e.hash}return{ok:bad==null,badAt:bad,n:LOG.length}},
 _h53:h53,_ser:ser,_deser:deser
};
window.STORE=STORE;
/* ---------- slices of app state kept across reloads ---------- */
const TRACK=[];const TRK={};let RESTORING=false,SCAN_T=0;
const DEF_PATHS=["bud.lines","bud.led","bud.doa","bud.crules","bud.po","bud.con","bud.vend","bud.ben","bud.mp","bud.cp","bud.run","bud.alloc","bud.envelope","bud.pol","bud.rate","br.rules","br.reqs","flw.apx","flw.W","flw.dmn","flw.bps","flw.wfs","flw.asm","ownx.asg","ownx.exc","ownx.log","ownx.rev","draw.docs","draw.saved","draw.log","org.lines","org.log","inbox.hist","inbox.dele","inbox.prefs","inbox.pol","agents","itsm.chg","itsm.prb","itsm.req","itsm.ke","adm.roles","adm.pol","adm.flags","adm.env","fin.decs","fin.reviews","fin.log","ppl.reassign","ppl.leave","ppl.bk","ppl.acts","ppl.decs","proc"];
function pathRef(p){const a=p.split(".");let par=S;for(let i=0;i<a.length-1;i++){par=par&&par[a[i]];if(par==null)return null}return{par,key:a[a.length-1]}}
function setInPlace(par,key,val){const cur=par[key];if(Array.isArray(cur)&&Array.isArray(val)){cur.length=0;val.forEach(x=>cur.push(x))}else if(cur&&val&&typeof cur==="object"&&typeof val==="object"&&!(cur instanceof Set)&&!(cur instanceof Map)&&!Array.isArray(cur)&&!Array.isArray(val)){Object.keys(cur).forEach(k=>{if(!(k in val))delete cur[k]});Object.keys(val).forEach(k=>{cur[k]=val[k]})}else par[key]=val}
STORE.track=function(p){if(TRK[p])return;const r=pathRef(p);TRK[p]={path:p,last:null,base:null,ok:!!r,err:""};TRACK.push(p)};
STORE.tracked=()=>TRACK.map(p=>Object.assign({},TRK[p]));
function snap(p){const r=pathRef(p);if(!r||!(r.key in r.par))return null;try{return ser(r.par[r.key])}catch(e){TRK[p].err="not serializable";return null}}
function scan(){if(!READY||RESTORING)return;
 TRACK.forEach(p=>{const t=TRK[p];const s=snap(p);if(s==null||s===t.last)return;t.last=s;t.n=(t.n||0)+1;
  STORE.put("app_state_snapshot",{id:p,path:p,json:s,seed_hash:t.base,bytes:s.length,saved_at:new Date().toISOString()},{silent:t.n===1&&!t.dirtyAtStart})})}
function hydrate(){RESTORING=true;let n=0,stale=0;
 TRACK.forEach(p=>{const t=TRK[p],s=snap(p);t.base=s==null?"":h53(s);t.last=s;t.dirtyAtStart=false;
  const rec=STORE.get("app_state_snapshot",p);if(!rec)return;
  if(rec.seed_hash!==t.base){t.stale=true;stale++;return}
  try{const val=deser(rec.json),r=pathRef(p);if(r){setInPlace(r.par,r.key,val);t.last=rec.json;t.restored=true;n++}}catch(e){t.err=String(e&&e.message||e)}});
 RESTORING=false;STORE.restoredCount=n;STORE.staleCount=stale;return n}
/* ---------- boot ---------- */
function loadFrom(recs,logs){recs.forEach(o=>{try{const r=deser(o.j),m=ent(o.e);if(!m.has(o.id))m.set(o.id,r)}catch(e){}});logs.sort((a,b)=>a.seq-b.seq).forEach(l=>{LOG.push(l);SEQ=Math.max(SEQ,l.seq);LASTHASH=l.hash})}
function finish(){READY=true;
 DEF_PATHS.forEach(p=>STORE.track(p));
 let n=0;try{n=hydrate()}catch(e){console.error("hydrate",e)}
 HYD.splice(0).forEach(fn=>{try{fn()}catch(e){console.error(e)}});
 if(!SCAN_T)SCAN_T=setInterval(scan,1200);
 window.addEventListener("pagehide",()=>{try{scan();flush()}catch(e){}});document.addEventListener("visibilitychange",()=>{if(document.hidden){try{scan();flush()}catch(e){}}});
 notify("*",{op:"ready"});
 if(n){G(()=>{if(window.INBOX&&INBOX.refresh)INBOX.refresh()});G(()=>{if(window.ATLAS&&ATLAS.bump)ATLAS.bump()})}
 if(n||STORE.get("entity_promotion","_")==null){try{render()}catch(e){}}}
STORE.ready=new Promise(res=>{
 const go2=()=>{
  idbOpen().then(db=>{DB=db;BACKEND="indexeddb";return Promise.all([idbAll("rec"),idbAll("log")])}).then(([r,l])=>{loadFrom(r,l);if(!r.length){const raw=lsGet("oukala-store:v1");if(raw){try{const o=deser(raw);(o.recs||[]).forEach(x=>{if(!ent(x[0]).has(x[1])){ent(x[0]).set(x[1],x[2]);persistRec(x[0],x[1],x[2])}});(o.log||[]).forEach(l=>{if(l.seq>SEQ){LOG.push(l);SEQ=l.seq;LASTHASH=l.hash;Q.log.push(l)}});sched()}catch(e){}}}finish();res(true)}).catch(err=>{
   const raw=lsGet("oukala-store:v1");let ok=false;
   if(raw!==null||lsSet("oukala-probe","1")){BACKEND="localstorage";try{if(raw){const o=deser(raw);(o.recs||[]).forEach(x=>{ent(x[0]).set(x[1],x[2])});(o.log||[]).forEach(l=>{LOG.push(l);SEQ=Math.max(SEQ,l.seq);LASTHASH=l.hash});SEQ=Math.max(SEQ,o.seq||0)}ok=true}catch(e){}}
   if(!ok)BACKEND="memory";WARN.unshift({t:NOW(),entity:"(store)",msg:"IndexedDB unavailable ("+G(()=>err.message,"error")+"); using "+BACKEND});finish();res(true)})};
 /* boot after the other modules have registered their screens and state */
 if(document.readyState==="complete")setTimeout(go2,50);else window.addEventListener("load",()=>setTimeout(go2,50))});
STORE.isReady=()=>READY;
STORE.flush=flush;STORE.scan=scan;
/* org and other cross-module changes: other agents call STORE.orgChange(kind,subject,detail) when a person, unit or owner changes,
   and STORE.replay("org_change",fn) at load to re-apply what was saved (fn gets each record, oldest first). */
STORE.orgChange=function(kind,subject,detail,payload){STORE.define("org_change",{label:"Org change",domain:"plat",steward:"Org designer",note:"Integration decision: new. Org edits made in the prototype (move, new role, owner change) are kept as an ordered list of changes that the org model replays on load.",fields:[{k:"kind",label:"Kind",type:"string"},{k:"subject",label:"Subject",type:"string"},{k:"detail",label:"Detail",type:"text"},{k:"payload",label:"Payload (JSON)",type:"text"},{k:"seq",label:"Order",type:"number"}]});
 return STORE.put("org_change",{id:"OC-"+(Date.now().toString(36))+"-"+(SEQ+1),kind,subject:String(subject||""),detail:String(detail||""),payload:payload==null?"":(typeof payload==="string"?payload:ser(payload)),seq:SEQ+1})};
STORE.replay=function(entity,fn){STORE.onHydrate(()=>{STORE.all(entity).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).forEach(r=>{try{fn(r)}catch(e){console.error("replay",entity,e)}})})};
/* ================================================================== registrations (Feature Contract) */
const AU={authority:"platform",classification:"internal"};
const F=(k,label,type,o)=>Object.assign({k,label,type:type||"string"},AU,o||{});
const ENTS=[
 {id:"app_state_snapshot",label:"App state snapshot",note:"Integration decision: reuse. Module state already lives in the S slices of each owning module; the store keeps only a tagged JSON copy per slice path, keyed by path and guarded by a seed hash. It never defines a second copy of budget, approval or ownership data.",fields:[F("path","Slice path"),F("json","Serialized slice","text"),F("seed_hash","Hash of the seed it was saved against"),F("bytes","Size in bytes","number"),F("saved_at","Saved at","datetime")]},
 {id:"entity_promotion",label:"Entity promotion decision",note:"Integration decision: new. The atlas keeps only a live or proposed flag. This records who approved a proposed entity, the council owner and backup, the metrics that will prove it, and the reason.",fields:[F("entity_id","Entity"),F("decision","Decision","enum",{opts:["approved","returned"]}),F("council_owner","Council owner","reference"),F("backup_owner","Backup owner","reference"),F("metrics","Metrics (ids)","text"),F("rationale","Rationale","text"),F("decided_by","Decided by","reference"),F("decided_at","Decided at","datetime")]},
 {id:"store_event",label:"Store event",note:"Integration decision: new. The audit view of the platform shows user actions; this is the append-only, hash-chained log of every record write in the entity store. It complements audit_event and does not replace it.",fields:[F("seq","Sequence","number"),F("op","Operation"),F("entity","Entity"),F("record_id","Record id"),F("keys","Changed fields","text"),F("actor","Actor","reference"),F("hash","Hash"),F("prev_hash","Previous hash")]}];
const MET={
 m_store_cov:{n:"Entities backed by the store",f:"Entities with at least one persisted record ÷ entities approved as live × 100",u:"%",cur:0,tgt:40,badAt:5,dir:"max",max:100,tr:[0,0,0,0,0,0,0,0],owner:"Data architect",use:["Entity store"],rem:{kind:"sop",ref:"SOP-STORE-1",title:"Move a module's records onto the store",agent:"Registry Agent",auto:false,state:"idle",prog:"Lists modules whose state still lives only in memory"}},
 m_store_prom:{n:"Proposed entities waiting for promotion",f:"Entities with status Proposed ÷ all entities × 100",u:"%",cur:0,tgt:20,badAt:50,dir:"min",max:100,tr:[44,44,43,43,43,42,42,42],owner:"Data council chair",use:["Entity store"],rem:{kind:"sop",ref:"SOP-STORE-2",title:"Review proposed entities",agent:"Registry Agent",auto:false,state:"idle",prog:"Orders proposed entities by the number of modules that depend on them"}},
 m_store_integ:{n:"Change log chain integrity",f:"Log entries whose hash and previous-hash link verify ÷ all log entries × 100",u:"%",cur:100,tgt:100,badAt:99,dir:"max",max:100,tr:[100,100,100,100,100,100,100,100],owner:"Data architect",use:["Entity store"],rem:{kind:"sop",ref:"SOP-STORE-3",title:"Investigate a broken chain",agent:"Registry Agent",auto:false,state:"idle",prog:"Shows the first sequence number that does not verify"}}};
Object.keys(MET).forEach(k=>{if(!METRICS[k])METRICS[k]=MET[k]});
const PSTEPS=[{n:"A module writes a record",d:"The owning module calls STORE.put with an entity name and a record. Unknown fields are rejected with a visible warning.",who:"robot",owner:"Module owner",sla:"Instant",in:"Record",out:"Validated record"},
 {n:"Stamp and persist",d:"createdBy, updatedBy, timestamps and version are set; the record is written to IndexedDB (localStorage or memory as fallback).",who:"robot",owner:"Entity store",sla:"Instant",in:"Validated record",out:"Persisted record"},
 {n:"Append to the change log",d:"One hash-chained entry per write. The chain is verified on demand from the log tab.",who:"robot",owner:"Entity store",sla:"Instant",in:"Persisted record",out:"Log entry"},
 {n:"Promote a proposed entity",d:"The data council reviews fields, authority and classification, names an owner, a backup and metrics, then approves.",who:"gate",owner:"Data council chair",sla:"5 days",in:"Proposed entity",out:"Live entity and a promotion record"},
 {n:"Export, import or reset",d:"Administrators export the store as JSON, import a snapshot, or reset the demo data.",who:"human",owner:"Platform admin",sla:"On demand",in:"Request",out:"Snapshot or clean state"}];
PROC.reg("plat_store",{title:"How a record is stored, logged and promoted",std:["dmbok","cobit"],steps:PSTEPS});
function tryReg(CON,spec){let again=false;
 if(!CON.done.ent){if(window.ATLAS&&ATLAS.addEntity&&window.PLAT&&window.COVER){spec.ents.forEach(e=>{if(DATAMODEL.tables[e.id])return;ATLAS.addEntity({id:e.id,label:e.label,domain:"plat",source:spec.name,status:"proposed",ownerApp:spec.name,ownerMod:spec.id,steward:spec.owner,note:e.note,fields:e.fields.map(f=>Object.assign({},f))})});CON.done.ent=1}else again=true}
 if(!CON.done.mm){if(window.MODMAP&&MODMAP.addModule&&MODMAP.modules&&MODMAP.modules.length){const ids=new Set(MODMAP.modules.map(m=>m.id));const fl=spec.flows.filter(f=>ids.has(f[0])).map(f=>({dir:f[1],other:f[0],data:f[2],entity:f[3],mode:f[4],trig:f[5]}));try{MODMAP.addModule({id:spec.id,name:spec.name,sn:spec.sn||spec.name,band:"plt",own:spec.owner,proposed:false,r:spec.reads,w:spec.writes,flows:fl})}catch(e){CON.err=String(e)}CON.done.mm=1}else again=true}
 if(!CON.done.pl){if(window.PROCLIB&&PROCLIB.addProcess&&CON.done.mm){try{PROCLIB.addProcess({id:spec.pid,name:spec.pname,module:spec.id,family:"gov",owner:spec.owner,trigger:spec.trigger,steps:PROC.defs[spec.id].steps.map(s=>Object.assign({},s)),inputs:spec.inputs,outputs:spec.outputs,entities:spec.ents.map(e=>e.id),metrics:spec.metrics,model:"cmmi",std:["bpmn","itil4"]})}catch(e){CON.err=String(e)}CON.done.pl=1}else again=true}
 if(!CON.done.nv){try{if(window.NAVX&&NAVX.add){NAVX.add(spec.id,{group:spec.navGroup||"plat",label:spec.name,hint:spec.hint,sub:spec.sub,kw:spec.kw});CON.done.nv=1}}catch(e){}}
 if(again&&(CON.tries=(CON.tries||0)+1)<40)setTimeout(()=>tryReg(CON,spec),900);
 else if(again&&!CON.done.ent&&window.DATAMODEL){spec.ents.forEach(e=>{if(!DATAMODEL.tables[e.id])DATAMODEL.register(e.id,{label:e.label,source:spec.name,fields:e.fields.map(f=>({k:f.k,label:f.label,type:f.type}))})});CON.done.ent=2}}
const SPEC={id:"plat_store",pid:"store_process",pname:"Store, log and promote a record",name:"Entity store",sn:"Entity store",owner:"Data architect",backup:"Data council chair",ents:ENTS,reads:["person","audit_event"],writes:["app_state_snapshot","entity_promotion","store_event"],metrics:["m_store_cov","m_store_prom","m_store_integ"],
 trigger:"A module saves a record, or the data council reviews a proposed entity.",inputs:["Records from modules","Proposed entities"],outputs:["Persisted records","Hash-chained change log","Promotion decisions"],
 flows:[["plat_data","pull","Entity definitions to validate against","entity","api","A module writes a record"],["plat_data","push","Promotion decisions and record counts","entity_promotion","event","Entity approved"],["adm_audit","push","Hash-chained store events","store_event","event","Any record write"],["bud_over","push","Budget edits","app_state_snapshot","event","Budget changed"],["inbox","push","Approval decisions","app_state_snapshot","event","Approval decided"],["org_chart","push","Ownership and org changes","app_state_snapshot","event","Owner changed"]],
 hint:"Persisted records, change log, promote proposed entities",sub:"Records, log, promotion",kw:"store persistence indexeddb entity records log reset export import promote proposed",navGroup:"plat"};
function addRecs(list){try{if(!(window.COVER&&Array.isArray(COVER.recs)))return false;list.forEach(x=>{if(!COVER.recs.some(r=>r.key===x[0]))COVER.recs.push({key:x[0],label:x[1],scr:[x[2]],mod:x[2],n:x[3]||1,ent:x[4],how:x[5]||"new",path:x[6]||x[0]})});return true}catch(e){return false}}
window.R15F1=window.R15F1||{};R15F1.addRecs=addRecs;R15F1.tryReg=tryReg;R15F1.F=F;R15F1.H=H;
const CON1=window.R15CON1={done:{}};
function boot(){tryReg(CON1,SPEC);addRecs([["STORE_SNAP","Persisted state slices","plat_store",1,"app_state_snapshot","new","STORE app_state_snapshot"],["STORE_PROMO","Entity promotion decisions","plat_store",1,"entity_promotion","new","STORE entity_promotion"],["STORE_LOG","Store change log","plat_store",1,"store_event","new","STORE.log"]]);syncMetrics()}
window.addEventListener("load",()=>setTimeout(boot,900));if(document.readyState==="complete")setTimeout(boot,900);
function syncMetrics(){try{const tb=DATAMODEL.tables,ids=Object.keys(tb);const pmap={};G(()=>PLAT.entities().forEach(e=>pmap[e.id]=e),0);const prop=ids.filter(i=>tb[i].status==="proposed"||(pmap[i]&&pmap[i].proposed)).length;const live=ids.length-prop;const used=STORE.entities().filter(e=>tb[e]).length;
 const set=(id,v)=>{const m=METRICS[id];if(!m)return;m.cur=v;m.tr=m.tr.slice(0,-1).concat([v])};set("m_store_cov",live?Math.round(used*100/Math.max(1,live)):0);set("m_store_prom",ids.length?Math.round(prop*100/ids.length):0);const v=STORE.verify();set("m_store_integ",v.ok?100:Math.round(100*(v.badAt-1)/Math.max(1,v.n)))}catch(e){}}
/* ================================================================== promotion of proposed entities */
function ctxEntities(){const tb=DATAMODEL.tables,pr={},pm={};G(()=>STORE.all("entity_promotion").forEach(p=>pr[p.entity_id]=p),0);G(()=>PLAT.entities().forEach(e=>pm[e.id]=e),0);
 return Object.keys(tb).map(id=>{const t=tb[id],p=pr[id],pe=pm[id]||{};return{id,label:t.label||id,domain:t.domain||pe.domain||"",source:t.source||"",nf:(t.fields||[]).length,status:(t.status||pe.status)==="proposed"||pe.proposed?"proposed":"live",records:STORE.count(id),steward:t.steward||pe.steward||"",council:p?p.council_owner:"",backup:p?p.backup_owner:"",metrics:p?String(p.metrics||"").split(",").filter(Boolean).length:0,decided:p?p.decided_at:"",mod:t.ownerMod||""}})}
function applyPromotions(){STORE.all("entity_promotion").forEach(p=>{if(p.decision==="approved"&&G(()=>DATAMODEL.tables[p.entity_id].status,"")==="proposed")G(()=>COVER.approve(p.entity_id,true),0)})}
STORE.onHydrate(()=>{setTimeout(()=>{applyPromotions();syncMetrics()},1200)});
function metricOpts(){return Object.keys(METRICS).slice(0,400).map(k=>[k,k+" · "+METRICS[k].n])}
function promote(id){const t=DATAMODEL.tables[id];if(!t)return;const deps=G(()=>MODMAP.modules.filter(m=>(m.r||[]).includes(id)||(m.w||[]).includes(id)).map(m=>m.sn||m.name),[]);
 openForm({id:"r15_promote",title:"Promote "+(t.label||id)+" to live",story:"Approval makes the entity live in the atlas. It needs a named council owner, a backup, and at least one metric that will show the entity is healthy. The decision is stored and re-applied after every reload."+(deps.length?" Used by: "+deps.slice(0,6).join(", ")+".":""),submit:"Approve and make live",
  fields:[{section:"Accountability"},{k:"owner",label:"Council owner",type:"people",req:true,help:"A named human, never an agent"},{k:"backup",label:"Backup owner",type:"people",req:true},{section:"Evidence"},{k:"metrics",label:"Metrics that prove it works",type:"multi",opts:metricOpts(),req:true},{k:"why",label:"Rationale",type:"longtext",req:true,ph:"Fields reviewed, authority and classification confirmed, reuse check done"}],
  defaults:{owner:t.steward&&G(()=>who(t.steward),null)?t.steward:""},
  onSubmit:v=>{if(!v.owner||!v.backup||v.owner===v.backup){toast("Owner and a different backup are required","warn");return false}
   if(!(v.metrics||[]).length){toast("Choose at least one metric","warn");return false}
   if(G(()=>window.COVER&&COVER.approve(id,true),false)===false&&DATAMODEL.tables[id].status==="proposed")DATAMODEL.tables[id].status="live";
   STORE.put("entity_promotion",{id,entity_id:id,decision:"approved",council_owner:v.owner,backup_owner:v.backup,metrics:(v.metrics||[]).join(","),rationale:v.why,decided_by:actor(),decided_at:new Date().toISOString()});
   audit("Entity promoted to live",(t.label||id)+" · owner "+v.owner);toast((t.label||id)+" is live","good");syncMetrics();closeDrawer();render()}})}
STORE.promote=promote;
/* ================================================================== screen */
const when=t=>t?new Date(t).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}):"";
function fmtB(n){return n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB"}
let EST=null;G(()=>{if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(e=>{EST=e;if(S.screen==="plat_store")render()})},0);
const SS=S.r15store=S.r15store||{tab:0};
function screen(){syncMetrics();
 const ents=ctxEntities(),prop=ents.filter(e=>e.status==="proposed"),live=ents.length-prop.length,m=STORE.meter(),v=STORE.verify();
 const kp=typeof kpiRow==="function"?kpiRow([["Entities",String(ents.length),live+" live"],["Proposed",String(prop.length),"waiting for promotion",{cls:prop.length>20?"warn":""}],["Stored records",String(m.records),m.entities+" entities with data"],["Change log",String(m.log),v.ok?"chain verified":"chain broken at "+v.badAt,{cls:v.ok?"":"bad"}],["Backend",m.backend,fmtB(m.bytes)+" in records"]]):"";
 const entTbl=btHTML({id:"r15_ents",h:480,rowH:44,key:"id",exportName:"entities",facets:["domain","status"],cols:[{k:"id",label:"Entity",fmt:r=>`<b>${H(r.label)}</b> <span class="muted small">${H(r.id)}</span>`,val:r=>r.label},{k:"domain",label:"Domain"},{k:"status",label:"Status",fmt:r=>`<span class="pill ${r.status==="live"?"good":"warn"}">${r.status==="live"?"Approved":"Proposed"}</span>`,val:r=>r.status},{k:"nf",label:"Fields",val:r=>r.nf},{k:"records",label:"Records",val:r=>r.records,fmt:r=>r.records?`<b>${r.records}</b>`:`<span class="muted">0</span>`},{k:"council",label:"Council owner",fmt:r=>r.council?pchip(r.council):`<span class="muted">${r.status==="live"?"Seed":"None"}</span>`,val:r=>r.council},{k:"metrics",label:"Metrics",val:r=>r.metrics},{k:"source",label:"Source"}],rows:ents,open:id=>openEntity(id)});
 const pq=btHTML({id:"r15_prom",h:420,rowH:52,key:"id",exportName:"proposed-entities",facets:["domain"],cols:[{k:"id",label:"Proposed entity",fmt:r=>`<b>${H(r.label)}</b> <span class="muted small">${H(r.id)}</span>`,val:r=>r.label},{k:"domain",label:"Domain"},{k:"nf",label:"Fields",val:r=>r.nf},{k:"steward",label:"Steward"},{k:"act",label:"",fmt:r=>`<button class="btn primary" data-r15-promote="${H(r.id)}">Review and promote</button>`}],rows:prop,open:id=>openEntity(id)});
 const logRows=LOG.slice(-1500).reverse();
 const logTbl=btHTML({id:"r15_log",h:460,rowH:40,key:"seq",exportName:"store-log",facets:["op","entity"],cols:[{k:"seq",label:"Seq",val:r=>r.seq},{k:"t",label:"Time",fmt:r=>when(r.t),val:r=>r.t},{k:"op",label:"Op",fmt:r=>`<span class="pill ${r.op==="delete"?"bad":r.op==="create"?"good":"info"}">${r.op}</span>`},{k:"entity",label:"Entity"},{k:"id",label:"Record"},{k:"by",label:"Actor"},{k:"keys",label:"Changed",fmt:r=>H((r.keys||[]).join(", ")),val:r=>(r.keys||[]).join(",")},{k:"hash",label:"Hash",fmt:r=>`<code class="small">${r.hash.slice(0,8)}</code>`}],rows:logRows,open:()=>{}});
 const wr=WARN.slice(0,8).map(w=>`<tr><td class="small">${when(w.t)}</td><td>${H(w.entity)}</td><td class="small">${H(w.msg)}</td></tr>`).join("");
 const tr=STORE.tracked();const trRows=tr.map(t=>`<tr><td><code>${H(t.path)}</code></td><td>${t.restored?`<span class="pill good">restored</span>`:t.stale?`<span class="pill warn">seed changed, ignored</span>`:!t.ok?`<span class="pill mute">not present</span>`:t.n?`<span class="pill info">saved ${t.n}x</span>`:`<span class="pill mute">unchanged</span>`}</td><td class="num">${t.last?fmtB(t.last.length):"-"}</td></tr>`).join("");
 const est=EST?`${fmtB(EST.usage||0)} of ${fmtB(EST.quota||0)} browser quota`:"quota unknown";
 const stor=`<div class="r15-two">${card("Storage meter","Records, log and quota",`<div class="statrow"><div class="stat"><small>Records</small><span class="num">${fmtB(m.bytes)}</span><em>${m.records} records</em></div><div class="stat"><small>Browser</small><span class="num">${EST?Math.round(EST.usage*100/Math.max(1,EST.quota)*100)/100+"%":"n/a"}</span><em>${est}</em></div></div><div class="r15-meter" role="img" aria-label="Quota used"><i style="width:${EST?Math.max(1,Math.min(100,EST.usage*100/EST.quota)):2}%"></i></div><div class="row r15-actions"><button class="btn" data-r15-export>Export JSON</button><label class="btn">Import JSON<input type="file" accept="application/json" data-r15-import hidden></label><button class="btn danger" data-r15-reset>Reset demo data</button></div>`)}${card("Tracked state slices",tr.length+" paths, "+STORE.restoredCount+" restored after the last load",`<div class="tscroll r15-sl"><table><thead><tr><th>Path</th><th>State</th><th>Size</th></tr></thead><tbody>${trRows}</tbody></table></div>`)}</div>${card("Schema warnings","Unknown fields are rejected, never stored",wr?`<div class="tscroll"><table><thead><tr><th>When</th><th>Entity</th><th>Message</th></tr></thead><tbody>${wr}</tbody></table></div>`:`<p class="muted">No warnings.</p>`)}`;
 const tabs=views("r15store",["Entities","Promote ("+prop.length+")","Change log","Storage"],[card("All entities","Atlas definition, status, stored records and accountable owner",entTbl),card("Proposed entities","Each needs a council owner, a backup and at least one metric",pq),card("Change log","Append-only, hash-chained"+(v.ok?"":" · BROKEN"),`<div class="row r15-actions"><button class="btn" data-r15-verify>Verify chain</button><span class="pill ${v.ok?"good":"bad"}">${v.ok?"verified "+v.n+" entries":"broken at seq "+v.badAt}</span></div>${logTbl}`),stor]);
 return `<div class="screen r15-screen">${hero("Platform","Entity store",`<b data-role="metric">${m.records}</b> persisted records in <b data-role="metric">${m.entities}</b> entities on <b data-role="metric">${m.backend}</b>; <b data-role="metric">${prop.length}</b> of <b data-role="metric">${ents.length}</b> entities are still proposed.`,`<div class="row">${fchip("m_store_cov")}${fchip("m_store_prom")}${fchip("m_store_integ")}</div>`)}${lensNote()}${kp}${tabs}${procCard("plat_store")}</div>`}
REG("plat_store","Entity store","platform","M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",screen);
function openEntity(id){const t=DATAMODEL.tables[id];if(!t)return;const recs=STORE.all(id).slice(0,8);const pr=STORE.get("entity_promotion",id);
 openDrawer(`<div class="r15-dr"><h2>${H(t.label||id)}</h2><div class="row"><span class="pill ${t.status==="proposed"?"warn":"good"}">${t.status==="proposed"?"Proposed":"Approved"}</span><span class="pill mute">${(t.fields||[]).length} fields</span><span class="pill info">${STORE.count(id)} records</span></div>
 ${pr?`<dl class="kv"><dt>Council owner</dt><dd>${pchip(pr.council_owner)}</dd><dt>Backup</dt><dd>${pchip(pr.backup_owner)}</dd><dt>Metrics</dt><dd>${H(pr.metrics)}</dd><dt>Decided</dt><dd>${H(pr.decided_by)} · ${when(Date.parse(pr.decided_at))}</dd></dl>`:""}
 ${t.status==="proposed"?`<button class="btn primary" data-r15-promote="${H(id)}">Review and promote</button>`:""}
 <div class="eyebrow" style="margin-top:14px">Fields</div><div class="tscroll"><table><thead><tr><th>Field</th><th>Type</th><th>Authority</th><th>Class</th></tr></thead><tbody>${(t.fields||[]).slice(0,60).map(f=>`<tr><td>${H(f.label||f.k)} <span class="muted small">${H(f.k)}</span></td><td>${H(f.type||"")}</td><td>${H(f.authority||"")}</td><td>${H(f.classification||"")}</td></tr>`).join("")}</tbody></table></div>
 ${recs.length?`<div class="eyebrow" style="margin-top:14px">Latest records</div>${recs.map(r=>`<div class="small r15-rec"><b>${H(r.id)}</b> v${r.v} · ${H(r.updatedBy)} · ${when(r.updatedAt)}</div>`).join("")}`:""}</div>`)}
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-r15-promote]")){promote(t.dataset.r15Promote);return}
 if(t=e.target.closest("[data-r15-export]")){const b=new Blob([JSON.stringify(STORE.export(),null,1)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="oukala-store-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);audit("Exported the entity store");return}
 if(t=e.target.closest("[data-r15-reset]")){if(confirm("Reset demo data? All saved edits, workflow runs and agent runs in this browser are erased and the seed data is reloaded.")){audit("Reset demo data");STORE.reset()}return}
 if(t=e.target.closest("[data-r15-verify]")){const v=STORE.verify();toast(v.ok?"Chain verified: "+v.n+" entries":"Chain broken at sequence "+v.badAt,v.ok?"good":"bad");syncMetrics();render();return}});
document.addEventListener("change",e=>{const t=e.target.closest&&e.target.closest("[data-r15-import]");if(!t||!t.files[0])return;const fr=new FileReader();fr.onload=()=>{try{const r=STORE.import(JSON.parse(fr.result));toast(r.ok?"Imported "+r.n+" records":r.why,r.ok?"good":"warn");audit("Imported a store snapshot");render()}catch(x){toast("Not valid JSON","warn")}};fr.readAsText(t.files[0])});
SEARCHX.push(()=>[{g:"Go to",t:"Entity store",m:STORE.meter().records+" records",c:"--accent",f:()=>go("plat_store"),k:"entity store persistence records log reset export import promote proposed entities"}].concat(G(()=>ctxEntities().filter(e=>e.status==="proposed").slice(0,40).map(e=>({g:"Proposed entities",t:e.label,m:"Promote to live",c:"--warn-f",f:()=>promote(e.id),k:e.id+" proposed promote entity"})),[])));
ASKX.push(q=>{const t=q.toLowerCase();if(/(how many|which|list).*(proposed|unapproved).*entit|entit.*(proposed|waiting)/.test(t)){const p=ctxEntities().filter(e=>e.status==="proposed");go("plat_store");say(q,{t:p.length+" entities are proposed: "+p.slice(0,6).map(e=>e.label).join(", ")+(p.length>6?" and "+(p.length-6)+" more":"")+".",steps:["Read the atlas","Opened the Entity store"]});return true}
 if(/(reset|clear).*(demo|saved|store)|store (size|usage)|how much (data|storage)/.test(t)){const m=STORE.meter();go("plat_store");say(q,{t:m.records+" records, "+fmtB(m.bytes)+", backend "+m.backend+", "+m.log+" log entries.",steps:["Read the entity store"]});return true}return false});
})();

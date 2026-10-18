/* ===== Round 16, Agent J: window.LISTS, the single registry accessor per entity list.
   Every picker, filter and form reads its options from LISTS.<entity>() so a list is defined in exactly one place.
   LISTS.projects() / people() / teams() / vendors() / costCenters() / cis() / services() / entities() / tables() / metrics() / processes() / changes() / incidents() / demand()
   LISTS.get(entity) -> [{v,l,sub,grp,raw}] (memoized, invalidated by a cheap version key); LISTS.find(entity,id); LISTS.adapter(entity) -> async-ready adapter for PICKER
   LISTS.use(entity,consumer) records which control reads which list (shown on the List registry tab and in docs/SCALE_AUDIT_R16.md) ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const REGL={},CONS={},CACHE={};
function register(id,def){REGL[id]=Object.assign({id,label:id,owner:"Platform data office",backup:"Architecture",version:()=>"1"},def);delete CACHE[id];return REGL[id]}
/* version keys are cheap: lengths and flags only, never a deep scan */
const sc=()=>G(()=>!!(W.SCALE&&SCALE.on),false);
register("projects",{label:"Projects",source:"PROJ (data2.js) plus SCALE.projects() in Enterprise mode",screen:"ppm_proj",
 raw:()=>{const base=G(()=>PROJ.slice(),[]);if(!sc())return base;const seen=new Set(base.map(p=>p.id));const out=base;G(()=>SCALE.projects()).forEach(p=>{if(!seen.has(p.id)){seen.add(p.id);out.push(p)}});return out},
 version:()=>G(()=>PROJ.length,0)+"|"+sc()+"|"+G(()=>SCALE.n.projects,0)+"|"+G(()=>SCALE._pj&&SCALE._pj.length,0),
 id:p=>p.id,label:p=>p.id+" "+(p.n||p.short||""),sub:p=>[p.owner,p.status==="bad"?"Needs action":p.status==="warn"?"Watch":p.status==="good"?"On track":""].filter(Boolean).join(" · "),grp:p=>p.team||(/^PR\d/.test(p.id)?"Core programs":"Enterprise")});
register("people",{label:"People",source:"DIR (data2.js); contractors and managed services included",screen:"org_chart",
 raw:()=>G(()=>DIR.filter(d=>d.kind!=="ai"&&d.kind!=="agent"),[]),version:()=>G(()=>DIR.length,0)+"",
 id:d=>d.name,label:d=>d.name,sub:d=>[d.role,d.team].filter(Boolean).join(" · "),grp:d=>d.team||"Other"});
register("teams",{label:"Teams",source:"TEAMS (data2.js)",screen:"ppl_org",raw:()=>G(()=>TEAMS.slice(),[]),version:()=>G(()=>TEAMS.length,0)+"",
 id:t=>t.n,label:t=>t.n,sub:t=>t.mgr?"Lead "+t.mgr:"",grp:()=>""});
register("vendors",{label:"Vendors",source:"BUDX.B().vend (budget vendor register)",screen:"bud_ven",
 raw:()=>G(()=>BUDX.B().vend,[]),version:()=>G(()=>BUDX.B().vend.length,0)+"",id:v=>v.id,label:v=>v.n,sub:v=>[v.cat,v.risk&&v.risk+" risk"].filter(Boolean).join(" · "),grp:v=>v.cat||""});
register("costCenters",{label:"Cost centers",source:"BUDX.DEPTS (budget departments, mapped by CCMAP)",screen:"bud_over",
 raw:()=>G(()=>BUDX.DEPTS.slice(),[]),version:()=>G(()=>BUDX.DEPTS.length,0)+"",id:d=>d[2]||d[0],label:d=>d[2]+" "+d[1],sub:d=>d[3]!=null?d[3]+" people":"",grp:()=>""});
register("cis",{label:"Configuration items",source:"CMDBX.all() (CIREG) plus SCALE.cis() in Enterprise mode",screen:"itom_cmdb",
 raw:()=>{const a=G(()=>CMDBX.all?CMDBX.all():[],[]);if(a.length)return a;return sc()?G(()=>SCALE.cis(),[]):[]},version:()=>G(()=>CMDBX.count?CMDBX.count():0,0)+"|"+sc(),
 id:c=>c.id,label:c=>c.name||c.id,sub:c=>[c.class||c.cls,c.env].filter(Boolean).join(" · "),grp:c=>c.class||c.cls||"Other"});
register("services",{label:"Services",source:"SVCREG (service registry)",screen:"svc_cat",raw:()=>G(()=>SVCREG.slice(),[]),version:()=>G(()=>SVCREG.length,0)+"",
 id:s=>s.id,label:s=>s.n,sub:s=>[s.tier,s.owner].filter(Boolean).join(" · "),grp:s=>s.tier||""});
register("tables",{label:"Tables",source:"DATAMODEL.tables plus PLAT.entities() (Atlas)",screen:"adm_studio",
 raw:()=>{const m=new Map();G(()=>Object.keys(DATAMODEL.tables)).forEach(k=>{const t=DATAMODEL.tables[k];m.set(k,{id:k,label:t.label||k,module:modOf(k,t),fields:t.fields||[],source:t.source||"",cls:topCls(t)})});
  G(()=>PLAT.entities()).forEach(e=>{if(!m.has(e.id))m.set(e.id,{id:e.id,label:e.label||e.id,module:e.domain||"other",fields:e.fields||[],source:e.owner||"",cls:topCls(e)})});return [...m.values()]},
 version:()=>G(()=>DATAMODEL.cnt(),0)+"|"+G(()=>PLAT.entities().length,0),id:t=>t.id,label:t=>t.label,sub:t=>t.id+" · "+t.fields.length+" fields",grp:t=>MODN[t.module]||t.module});
W.LISTS_MODN=null;
const MODN={portfolio:"Portfolio",fin:"Finance",money:"Money",service:"Service",people:"People",ppl:"People",gov:"Governance",plat:"Platform",know:"Knowledge",sec:"Security",ops:"Operations",met:"Metrics",other:"Other"};
const topCls=t=>{const o={};(t.fields||[]).forEach(f=>{const c=f.classification||f.cls;if(c)o[c]=(o[c]||0)+1});const rank=["restricted","confidential","personal","internal"];for(const r of rank)if(o[r])return r;return "internal"};
const modOf=(k,t)=>t.module||t.mod||t.domain||G(()=>PLAT.domOf(k),null)||G(()=>(PLAT.ent(k)||{}).domain,null)||"other";
register("entities",{label:"Entities",source:"ATLAS registry (same records as tables)",screen:"plat_atlas",raw:()=>LISTS.tables(),version:()=>LISTS.ver("tables"),
 id:t=>t.id,label:t=>t.label,sub:t=>t.id,grp:t=>MODN[t.module]||t.module});
register("fields",{label:"Fields",source:"Fields of a table (DATAMODEL.fields)",screen:"adm_studio",raw:()=>[],version:()=>"1",id:f=>f.k,label:f=>f.label,sub:f=>f.type,grp:()=>""});
register("metrics",{label:"Metrics",source:"METRICS (single metric dictionary)",screen:"metrics",
 raw:()=>G(()=>Object.keys(METRICS).map(k=>Object.assign({id:k},METRICS[k])),[]),version:()=>G(()=>Object.keys(METRICS).length,0)+"",id:m=>m.id,label:m=>m.n||m.id,sub:m=>m.owner||"",grp:m=>m.owner||"Unowned"});
register("processes",{label:"Processes",source:"PROCLIB.list()",screen:"plat_proc",raw:()=>G(()=>PROCLIB.list(),[]),version:()=>G(()=>PROCLIB.list().length,0)+"",
 id:p=>p.id,label:p=>p.name||p.id,sub:p=>p.owner||"",grp:p=>p.familyName||p.family||""});
register("changes",{label:"Changes",source:"ITSMX.changes",screen:"itsm_chg",raw:()=>G(()=>ITSMX.changes,[]),version:()=>G(()=>ITSMX.changes.length,0)+"",
 id:c=>c.id,label:c=>c.id+" "+(c.t||c.title||c.n||""),sub:c=>[c.st||c.state,c.service||c.svc].filter(Boolean).join(" · "),grp:c=>c.st||c.state||""});
register("incidents",{label:"Incidents",source:"ITSMX.incidents",screen:"itsm_inc",raw:()=>G(()=>ITSMX.incidents,[]),version:()=>G(()=>ITSMX.incidents.length,0)+"",
 id:c=>c.id,label:c=>c.id+" "+(c.t||c.title||c.n||""),sub:c=>[c.st||c.state,c.service||c.svc].filter(Boolean).join(" · "),grp:c=>c.st||c.state||""});
register("demand",{label:"Demand requests",source:"DEMAND (+ SCALE.demand() in Enterprise mode)",screen:"port",raw:()=>G(()=>DEMAND.concat(sc()&&SCALE.demand?SCALE.demand():[]),[]),version:()=>G(()=>DEMAND.length,0)+"|"+sc(),
 id:d=>d.id,label:d=>d.id+" "+(d.n||d.t||""),sub:d=>d.owner||"",grp:()=>""});
register("traceRecords",{label:"Trace records",source:"NODES graph (data.js) plus LISTS.projects()",screen:"trace",
 raw:()=>{const have=new Set(G(()=>NODES.map(n=>n.id),[]));const out=G(()=>NODES.map(n=>({id:n.id,n:n.n,t:n.t,owner:n.owner,s:n.s})),[]);G(()=>rows("projects")).forEach(p=>{if(!have.has(p.id))out.push({id:p.id,n:p.n||p.short,t:"proj",owner:p.owner,s:p.status||"good",fromRegistry:1})});return out},version:()=>G(()=>NODES.length,0)+"|"+ver("projects"),
 id:n=>n.id,label:n=>n.n,sub:n=>n.owner||"",grp:n=>G(()=>TYPES[n.t][0],n.t)});

function ver(id){const d=REGL[id];return d?G(()=>d.version(),"x"):"x"}
function rows(id){const d=REGL[id];if(!d)return [];const c=CACHE[id],v=ver(id);if(c&&c.v===v)return c.raw;const raw=G(()=>d.raw(),[]);CACHE[id]={v,raw};return raw}
function get(id){const d=REGL[id];if(!d)return [];const v=ver(id),c=CACHE[id];if(c&&c.v===v&&c.opts)return c.opts;
 const raw=rows(id);const opts=raw.map(r=>({v:String(d.id(r)),l:String(d.label(r)),sub:G(()=>d.sub(r),"")||"",grp:G(()=>d.grp(r),"")||"",raw:r}));CACHE[id].opts=opts;return opts}
function find(id,key){const o=get(id);const c=CACHE[id]||(CACHE[id]={});if(!c.idx||c.idxN!==o.length){c.idx=new Map(o.map(x=>[x.v,x]));c.idxN=o.length}return c.idx.get(String(key))||null}
function use(entity,consumer){(CONS[entity]=CONS[entity]||new Set()).add(consumer)}
function adapter(entity,opts){opts=opts||{};use(entity,opts.consumer||"adhoc");
 return {entity,count:()=>opts.filter?get(entity).filter(opts.filter).length:get(entity).length,all:()=>get(entity),
  query:({q,offset,limit,filter})=>{let a=get(entity);if(opts.filter)a=a.filter(opts.filter);if(filter)a=a.filter(filter);if(q){const t=q.toLowerCase().split(/\s+/).filter(Boolean);a=a.filter(x=>{x._h=x._h||(x.l+" "+x.sub+" "+x.grp+" "+x.v).toLowerCase();return t.every(w=>x._h.includes(w))});
   a=a.map(x=>[x,x.l.toLowerCase().startsWith(q.toLowerCase())?0:x.v.toLowerCase()===q.toLowerCase()?0:1]).sort((p,r)=>p[1]-r[1]).map(p=>p[0])}
   return {rows:limit?a.slice(offset||0,(offset||0)+limit):a,total:a.length}},
  resolve:ids=>ids.map(i=>find(entity,i)||{v:i,l:i,sub:"",grp:""})}}
const L=W.LISTS={register,get,find,adapter,use,ver,rows,
 defs:()=>Object.values(REGL),consumers:id=>[...(CONS[id]||[])],meta:id=>REGL[id],
 invalidate:id=>{if(id)delete CACHE[id];else Object.keys(CACHE).forEach(k=>delete CACHE[k])}};
Object.keys(REGL).forEach(id=>{L[id]=()=>rows(id)});
L.fields=t=>{const r=find("tables",t);return r?r.raw.fields.map(f=>Object.assign({},f,{table:t})):[]};
/* a project record by id: the one lookup every screen should use */
L.project=id=>{const o=find("projects",id);return o?o.raw:null};
L.projectOpts=()=>get("projects");
})();

/* ===== Round 16, Agent J: Admin studio at scale. window.ADMX
   Replaces the four object pills with a table picker over every table (LISTS.tables()), and adds the "Tables and forms" tab:
   explorer (module, classification, owner, forms filters; recent and starred), fields (search, type, required, classification, forms and views that use them),
   form designer with a field picker that traverses references (project.manager.team), bulk operations, and a coverage view
   (tables with no form, fields on no form). Forms are stored as form_definition records (STORE when present). ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const X=S.admx=S.admx||{sub:"fields",table:"project",form:null,f:{mod:"",cls:"",owner:"",cov:""},q:"",ftype:"",fcls:"",freq:false,fsel:{},fn:25,forms:null,seeded:false,cov:{sel:{},n:30,q:""},fp:null,msg:""};
const MODS={portfolio:"Portfolio",fin:"Finance",money:"Money",service:"Service",people:"People",ppl:"People",gov:"Governance",plat:"Platform",know:"Knowledge",sec:"Security",ops:"Operations",met:"Metrics",other:"Other"};
const CLS=["restricted","confidential","personal","internal"];
const TYPEMAP={string:"text",text:"longtext",json:"longtext",date:"date",datetime:"date",currency:"money",money:"money",number:"number",num:"number",percent:"number",duration:"number",bool:"toggle",boolean:"toggle",list:"multi",enum:"select",choice:"select",select:"select",person:"people"};
const uiType=f=>{const t=(f.type||"string").split(":")[0];if(t==="ref")return /person|user|people/.test(f.ref||(f.type||"").split(":")[1]||"")?"people":"select";return TYPEMAP[t]||"text"};
const refOf=f=>f.ref||((f.type||"").indexOf("ref:")===0?f.type.split(":")[1]:"")||"";
const isRef=f=>(f.type||"").split(":")[0]==="ref"&&!!refOf(f);
/* ---------- table registry (derived from the one list) ---------- */
let TC=null;
function ownerMap(){const m=new Map();G(()=>PLAT.entities()).forEach(e=>m.set(e.id,e.steward||e.owner||""));G(()=>ATLAS.coverage().modules).forEach(md=>(md.owned||[]).forEach(id=>{if(!m.get(id))m.set(id,md.owner||"")}));return m}
function tables(){const v=LISTS.ver("tables")+"|"+(X.forms?X.forms.length:0)+"|"+X.fv;if(TC&&TC.v===v)return TC.a;
 const om=ownerMap(),fb=formsByTable();const a=LISTS.tables().map(t=>{const fs=fb.get(t.id)||[];return {id:t.id,label:t.label,module:t.module,modName:MODS[t.module]||t.module||"Other",fields:t.fields||[],cls:t.cls,owner:om.get(t.id)||t.source||"Unassigned",forms:fs}});
 TC={v,a,idx:new Map(a.map(t=>[t.id,t]))};return a}
const tbl=id=>{tables();return TC.idx.get(id)||null};
function formsByTable(){seed();const m=new Map();X.forms.forEach(f=>{(m.get(f.table)||m.set(f.table,[]).get(f.table)).push(f)});return m}
/* ---------- forms (form_definition records) ---------- */
X.fv=X.fv||0;
function seed(){if(X.forms)return;X.forms=[];const mods=G(()=>ATLAS.coverage().modules,[]);const seen=new Set();
 mods.forEach(md=>(md.owned||[]).forEach(id=>{const t=LISTS.find("tables",id);if(!t||seen.has(id))return;seen.add(id);const fs=t.raw.fields.slice(0,8);
  X.forms.push({id:"FRM-"+md.id+"-"+id,name:(md.sn||md.name)+" form",table:id,screen:md.screen,owner:md.owner||"Platform data office",sections:[{id:"s1",name:"Details",paths:fs.map(f=>f.k)}],seed:1,version:1})}));
 /* the four editable objects keep their Admin layouts as forms */
 try{const A=S.adm;const map={Incident:"incident",Project:"project","Demand request":"demand_request",Contract:"contract"};Object.keys(map).forEach(o=>{if(!A.layout||!A.layout[o])return;const id=map[o];if(!LISTS.find("tables",id))return;X.forms=X.forms.filter(f=>f.table!==id);X.forms.push({id:"FRM-adm-"+id,name:o+" form (Admin studio layout)",table:id,screen:"adm_studio",owner:"Platform admin",sections:A.layout[o].map(s=>({id:s.id,name:s.name,paths:s.keys.slice()})),seed:1,version:1})})}catch(e){}
 X.fv++}
function saveForm(f){f.version=(f.version||1)+0;X.fv++;TC=null;G(()=>{if(W.STORE&&STORE.put){STORE.define&&STORE.define("form_definition",{label:"Form definition",domain:"plat",fields:[{k:"table",label:"Table",type:"ref"},{k:"name",label:"Name",type:"string"},{k:"sections",label:"Sections",type:"json"},{k:"owner",label:"Owner",type:"string"}]});STORE.put("form_definition",{id:f.id,table:f.table,name:f.name,sections:JSON.stringify(f.sections),owner:f.owner})}});
 G(()=>W.EVENTS&&EVENTS.emit("form.changed",{form:f.id,table:f.table},{source:"adm_studio",actor:G(()=>INBOX.me(),"")}))}
const track=(a,b,c)=>G(()=>W.ADM_TRACK&&ADM_TRACK(a,b,c));
function newForm(table,name){seed();const t=tbl(table);const f={id:"FRM-u"+(X.forms.length+1)+"-"+table,name:name||(t.label+" form"),table,screen:"adm_studio",owner:G(()=>INBOX.me(),"Casey Rowan"),sections:[{id:"s1",name:"Details",paths:t.fields.slice(0,6).map(x=>x.k)}],version:1};X.forms.push(f);X.form=f.id;saveForm(f);track("Form",table+"."+f.name,[["+","  form "+f.name+" created on "+table]]);return f}
/* ---------- bridge to the classic Fields, Layout and List tabs ---------- */
const keyOf=id=>{const t=LISTS.find("tables",id);if(!t)return id;const same=LISTS.get("tables").filter(x=>x.raw.label===t.raw.label).length;return same>1?t.raw.label+" ("+id+")":t.raw.label};
function ensure(o){const A=S.adm;if(!o||!A)return;A.fields=A.fields||{};if(A.fields[o]&&A.layout&&A.layout[o]&&A.cols&&A.cols[o])return;
 const t=LISTS.get("tables").find(x=>keyOf(x.v)===o);if(!t)return;
 const fs=t.raw.fields.map(f=>({k:f.k,label:f.label||f.k,type:uiType(f),req:!!f.req,def:"",opts:(f.opts||[]).slice(),rule:"",vis:[],help:f.refBy&&!/assistant/i.test(f.refBy)?f.refBy:"",sys:true}));
 A.fields[o]=A.fields[o]||fs;A.layout=A.layout||{};A.cols=A.cols||{};A.savedViews=A.savedViews||{};
 if(!A.layout[o]){const ks=fs.map(f=>f.k);A.layout[o]=[{id:"s1",name:"Identity",keys:ks.slice(0,6)},{id:"s2",name:"Details",keys:ks.slice(6,12)},{id:"s3",name:"More",keys:ks.slice(12)}].filter(s=>s.keys.length)}
 if(!A.cols[o])A.cols[o]={on:fs.slice(0,5).map(f=>f.k),sort:fs[0]?fs[0].k:"",dir:"asc",group:""};if(!A.savedViews[o])A.savedViews[o]=[]}
/* ---------- the picker that replaces the four object pills ---------- */
function picker(){const A=S.adm;const cur=LISTS.get("tables").find(x=>keyOf(x.v)===A.obj);
 return `<div class="admx-pick">${PICKER.html({id:"admx_obj",label:"Table",noun:"tables",source:LISTS.adapter("tables",{consumer:"Admin studio · table picker"}),value:cur?cur.v:"",recent:"admin_tables",height:360,onPick:v=>{if(!v)return;const o=keyOf(v);ensure(o);A.obj=o;X.table=v;G(()=>delete FORMST.admprev);render()}})}<span class="muted small">${LISTS.get("tables").length} tables. Type to search, star the ones you edit often. <button type="button" class="btn quiet" data-admx="goto:${H(cur?cur.v:"project")}">Open in Tables and forms</button></span></div>`}
/* ---------- filters and explorer ---------- */
function filtered(){const f=X.f;return tables().filter(t=>(!f.mod||t.module===f.mod)&&(!f.cls||t.cls===f.cls)&&(!f.owner||t.owner===f.owner)&&(!f.cov||(f.cov==="no"?!t.forms.length:t.forms.length>0)))}
function explorerAdapter(){const ts=filtered(),c={};ts.forEach(t=>{c[t.modName]=(c[t.modName]||0)+1});const rows=ts.map(t=>({v:t.id,l:t.label,sub:t.id+" · "+t.fields.length+" fields · "+(t.forms.length?t.forms.length+" form"+(t.forms.length>1?"s":""):"no form"),grp:t.modName+" ("+c[t.modName]+")"}));return PICKER.adapter(rows)}
function counts(){const c={};filtered().forEach(t=>{c[t.modName]=(c[t.modName]||0)+1});return c}
const owners=()=>[...new Set(tables().map(t=>t.owner))].sort();
const modsList=()=>[...new Set(tables().map(t=>t.module))].map(m=>[m,MODS[m]||m]).sort((a,b)=>a[1].localeCompare(b[1]));
function filtersHTML(){const f=X.f;const sel=(k,label,opts)=>`<label class="admx-f"><span class="muted small">${label}</span><select class="fin" data-admx-in="f.${k}"><option value="">All</option>${opts.map(o=>`<option value="${H(o[0])}" ${f[k]===o[0]?"selected":""}>${H(o[1])}</option>`).join("")}</select></label>`;
 return `<div class="admx-filters">${sel("mod","Module",modsList())}${sel("cls","Classification",CLS.map(c=>[c,c[0].toUpperCase()+c.slice(1)]))}${sel("owner","Owner",owners().map(o=>[o,o]))}${sel("cov","Forms",[["with","Has a form"],["no","No form"]])}</div>`}
function stats(){const ts=tables();let nf=0,fieldsAll=0,fieldsNo=0;ts.forEach(t=>{const used=usedSet(t);if(!t.forms.length)nf++;fieldsAll+=t.fields.length;t.fields.forEach(f=>{if(!used.has(f.k))fieldsNo++})});return {tables:ts.length,noForm:nf,fields:fieldsAll,fieldsNoForm:fieldsNo,forms:(X.forms||[]).length}}
function usedSet(t){const s=new Set();t.forms.forEach(fm=>fm.sections.forEach(sc=>sc.paths.forEach(p=>s.add(p.split(".")[0]))));return s}
const pillc=c=>`<span class="pill ${c==="restricted"?"bad":c==="confidential"?"warn":c==="personal"?"info":"mute"}">${H(c||"internal")}</span>`;
/* ---------- fields ---------- */
function fieldsView(t){const used=new Map();t.forms.forEach(fm=>fm.sections.forEach(sc=>sc.paths.forEach(p=>{const k=p.split(".")[0];(used.get(k)||used.set(k,new Set()).get(k)).add(fm.name)})));
 const q=X.q.trim().toLowerCase();let rows=t.fields.filter(f=>(!q||(f.label+" "+f.k).toLowerCase().includes(q))&&(!X.ftype||uiType(f)===X.ftype)&&(!X.fcls||(f.classification||f.cls||"internal")===X.fcls)&&(!X.freq||f.req));
 const total=rows.length,show=rows.slice(0,X.fn);const nsel=Object.keys(X.fsel).filter(k=>X.fsel[k]).length;
 const types=[...new Set(t.fields.map(uiType))].sort();
 return `<div class="admx-bar"><input type="search" class="fin admx-q" data-admx-in="q" placeholder="Search ${t.fields.length} fields" value="${H(X.q)}" aria-label="Search fields"><select class="fin" data-admx-in="ftype" aria-label="Type"><option value="">All types</option>${types.map(x=>`<option ${X.ftype===x?"selected":""}>${x}</option>`).join("")}</select><select class="fin" data-admx-in="fcls" aria-label="Classification"><option value="">All classifications</option>${CLS.map(c=>`<option ${X.fcls===c?"selected":""}>${c}</option>`).join("")}</select><label class="admx-chk"><input type="checkbox" data-admx-in="freq" ${X.freq?"checked":""}> Required only</label></div>
 ${nsel?`<div class="admx-bulk" role="toolbar" aria-label="Bulk actions"><b>${nsel} selected</b><button class="btn" data-admx="bulk:req">Mark required</button><button class="btn" data-admx="bulk:optional">Mark optional</button><select class="fin" data-admx-in="bulkcls" aria-label="Set classification"><option value="">Set classification…</option>${CLS.map(c=>`<option>${c}</option>`).join("")}</select><button class="btn primary" data-admx="bulk:form">Add to form…</button><button class="btn quiet" data-admx="bulk:clear">Clear</button></div>`:""}
 <div class="tablewrap" style="max-height:none"><table class="adm-tbl admx-tbl"><thead><tr><th style="width:34px"><input type="checkbox" data-admx="selall" aria-label="Select all shown"></th><th>Field</th><th>Type</th><th>Required</th><th>Classification</th><th>Used on forms</th></tr></thead><tbody>
 ${show.map(f=>{const u=used.get(f.k);return `<tr><td><input type="checkbox" data-admx-fsel="${H(f.k)}" ${X.fsel[f.k]?"checked":""} aria-label="Select ${H(f.label||f.k)}"></td><td><b>${H(f.label||f.k)}</b><div class="muted small"><code>${H(f.k)}</code>${isRef(f)?` · refers to <button class="linklike" data-admx="goto:${H(refOf(f))}">${H(refOf(f))}</button>`:""}</div></td><td>${H(uiType(f))}${isRef(f)?" (reference)":""}</td><td>${f.req?'<span class="pill warn">Required</span>':'<span class="muted">Optional</span>'}</td><td>${pillc(f.classification||f.cls)}</td><td>${u?[...u].slice(0,2).map(n=>`<span class="pill info">${H(n)}</span>`).join(" ")+(u.size>2?` <span class="muted small">+${u.size-2}</span>`:""):'<span class="pill mute">On no form</span>'}</td></tr>`}).join("")||`<tr><td colspan="6" class="muted">No fields match.</td></tr>`}
 </tbody></table></div><div class="admx-more muted small">Showing ${show.length} of ${total}${total>show.length?` <button class="btn quiet" data-admx="more">Show 25 more</button>`:""}</div>`}
/* ---------- form designer with the reference-traversing field picker ---------- */
function pathInfo(root,path){const out=[];let t=tbl(root),ok=true;const parts=path.split(".");parts.forEach((k,i)=>{if(!t){ok=false;return}const f=t.fields.find(x=>x.k===k);if(!f){ok=false;out.push(k);t=null;return}out.push(f.label||f.k);t=isRef(f)&&i<parts.length-1?tbl(refOf(f)):null});return {label:out.join(" › "),ok}}
function leafOf(root,path){let t=tbl(root),f=null;path.split(".").forEach(k=>{if(!t)return;f=t.fields.find(x=>x.k===k)||null;t=f&&isRef(f)?tbl(refOf(f)):null});return f}
function fpHTML(t,form){const fp=X.fp;if(!fp)return "";const trail=[t.id].concat(fp.hops.map(h=>h.target));const cur=tbl(trail[trail.length-1]);if(!cur)return "";
 const prefix=fp.hops.map(h=>h.k);const opts=[];cur.fields.forEach(f=>{opts.push({v:f.k,l:(f.label||f.k)+(isRef(f)?" (reference)":""),sub:uiType(f)+" · "+(f.classification||f.cls||"internal")+((form&&hasPath(form,prefix.concat(f.k).join(".")))?" · already on this form":""),grp:isRef(f)?"References":"Fields"});
  if(isRef(f)&&prefix.length<2&&tbl(refOf(f)))opts.push({v:f.k+">",l:(f.label||f.k)+" › traverse into "+(tbl(refOf(f))||{}).label,sub:"Pick a field of "+refOf(f)+" (reached through "+(f.label||f.k)+")",grp:"Traverse a reference"})});
 const crumbs=[`<button class="linklike" data-admx="fpup:0">${H(t.label)}</button>`].concat(fp.hops.map((h,i)=>`<button class="linklike" data-admx="fpup:${i+1}">${H(h.label)}</button>`));
 return `<div class="admx-fp card"><div class="cardhead"><div><h4>Add a field to ${H(form?form.name:"the form")}</h4><div class="admx-crumb" aria-label="Reference path">${crumbs.join(' <span aria-hidden="true">›</span> ')}</div></div><button class="btn quiet" data-admx="fpclose">Close</button></div>${PICKER.html({id:"admx_fp",inline:true,label:"Fields of "+cur.label,noun:"fields",source:opts,height:260,recent:"admx_fp_"+cur.id,onPick:v=>{if(!v)return;if(v.endsWith(">")){const k=v.slice(0,-1),f=cur.fields.find(x=>x.k===k);X.fp.hops.push({k,label:f.label||f.k,target:refOf(f)});render();return}addPath(form,prefix.concat(v).join("."),fp.section)}})}<p class="muted small">A reference field leads to another table. Traverse it to add, for example, ${H(t.id)}.manager.team. Depth is limited to three tables.</p></div>`}
function hasPath(form,p){return form.sections.some(s=>s.paths.includes(p))}
function addPath(form,p,secId){if(!form)return;if(hasPath(form,p)){G(()=>toast("Already on the form","info"));return}const sec=form.sections.find(s=>s.id===secId)||form.sections[0];sec.paths.push(p);saveForm(form);track("Form layout",form.table,[["+","  "+form.name+" › "+sec.name+": "+p]]);G(()=>toast("Added "+pathInfo(form.table,p).label,"good"));render()}
function formsView(t){seed();const fl=t.forms;let form=fl.find(f=>f.id===X.form)||fl[0]||null;if(form)X.form=form.id;
 const head=`<div class="admx-bar">${fl.length?`<select class="fin" data-admx-in="form" aria-label="Form">${fl.map(f=>`<option value="${H(f.id)}" ${form&&f.id===form.id?"selected":""}>${H(f.name)}</option>`).join("")}</select>`:'<span class="pill warn">This table has no form</span>'}<button class="btn primary" data-admx="newform:${H(t.id)}">${fl.length?"New form":"Create a form"}</button>${form?`<button class="btn" data-admx="addsec">Add a section</button><span class="muted small">Owner ${H(form.owner)} · version ${form.version||1}${form.screen?` · used by ${H(form.screen)}`:""}</span>`:""}</div>`;
 if(!form)return head+`<p class="muted">Tables without a form cannot be edited from a screen. Create one, or use bulk create on the Coverage view.</p>`;
 const secs=form.sections.map((s,si)=>`<div class="admx-sec"><div class="admx-sech"><b>${H(s.name)}</b><span class="adm-acts"><button class="btn quiet" data-admx="fpopen:${H(s.id)}">Add field</button><button class="btn quiet" data-admx="secdel:${H(s.id)}" ${form.sections.length<2?"disabled":""}>Remove section</button></span></div>
  ${s.paths.map((p,pi)=>{const pi_=pathInfo(form.table,p),lf=leafOf(form.table,p);return `<div class="admx-fr ${pi_.ok?"":"bad"}"><span class="admx-fl"><b>${H(pi_.label)}</b><code class="muted small">${H(form.table+"."+p)}</code></span><span class="pill mute">${lf?H(uiType(lf)):"?"}</span>${lf&&(lf.classification||lf.cls)&&(lf.classification||lf.cls)!=="internal"?pillc(lf.classification||lf.cls):""}${p.indexOf(".")>0?'<span class="pill info">via reference</span>':""}<span class="adm-acts"><button class="btn quiet" data-admx="mv:${H(s.id)}:${pi}:-1" aria-label="Move up" ${pi?"":"disabled"}>↑</button><button class="btn quiet" data-admx="mv:${H(s.id)}:${pi}:1" aria-label="Move down" ${pi<s.paths.length-1?"":"disabled"}>↓</button><button class="btn quiet" data-admx="rm:${H(s.id)}:${pi}" aria-label="Remove ${H(pi_.label)}">Remove</button></span></div>`}).join("")||'<div class="muted small admx-empty">No fields in this section</div>'}</div>`).join("");
 return head+`<div class="admx-fd">${secs}</div>${fpHTML(t,form)}`}
/* ---------- coverage ---------- */
function coverView(){const st=stats();const ts=tables().filter(t=>!t.forms.length);const q=X.cov.q.trim().toLowerCase();const rows=ts.filter(t=>!q||(t.label+" "+t.id).toLowerCase().includes(q));const show=rows.slice(0,X.cov.n);const nsel=Object.keys(X.cov.sel).filter(k=>X.cov.sel[k]).length;
 const withForm=tables().filter(t=>t.forms.length).map(t=>({t,orph:t.fields.length-[...usedSet(t)].filter(k=>t.fields.some(f=>f.k===k)).length})).filter(x=>x.orph>0).sort((a,b)=>b.orph-a.orph).slice(0,8);
 return `<div class="statrow admx-kpis">${[["Tables",st.tables,st.forms+" forms"],["Tables with no form",st.noForm,Math.round(st.noForm/Math.max(1,st.tables)*100)+"% of tables"],["Fields",st.fields,"all tables"],["Fields on no form",st.fieldsNoForm,Math.round(st.fieldsNoForm/Math.max(1,st.fields)*100)+"% of fields"]].map(k=>`<div class="tile glass"><span class="lbl">${k[0]}</span><span class="big num">${k[1].toLocaleString("en-US")}</span><span class="muted small">${k[2]}</span></div>`).join("")}</div>
 <div class="grid g2" style="align-items:start"><div class="card glass"><div class="cardhead"><div><h4>Tables with no form (${rows.length})</h4><span class="muted small">Select tables, then create a default form for each in one step.</span></div></div>
 <div class="admx-bar"><input type="search" class="fin admx-q" data-admx-in="cov.q" placeholder="Search tables" value="${H(X.cov.q)}" aria-label="Search tables with no form"><button class="btn primary" data-admx="covbulk" ${nsel?"":"disabled"}>Create default form for ${nsel||"selected"}</button><button class="btn" data-admx="covall">Select all ${Math.min(rows.length,200)} shown in search</button></div>
 <div class="admx-cov">${show.map(t=>`<label class="admx-cr"><input type="checkbox" data-admx-csel="${H(t.id)}" ${X.cov.sel[t.id]?"checked":""}><span><b>${H(t.label)}</b><small class="muted">${H(t.modName)} · ${t.fields.length} fields · owner ${H(t.owner)}</small></span><button class="btn quiet" data-admx="goto:${H(t.id)}:forms">Open</button></label>`).join("")||'<p class="muted">Every table has a form.</p>'}</div>${rows.length>show.length?`<div class="admx-more"><button class="btn quiet" data-admx="covmore">Show 30 more</button> <span class="muted small">Showing ${show.length} of ${rows.length}</span></div>`:""}</div>
 <div class="card glass"><div class="cardhead"><div><h4>Most fields on no form</h4><span class="muted small">Tables that have a form but leave fields off it.</span></div></div>${withForm.map(x=>`<div class="adm-line"><span><b>${H(x.t.label)}</b><br><span class="muted small">${H(x.t.modName)} · ${x.t.forms.length} form${x.t.forms.length>1?"s":""}</span></span><span class="row"><span class="pill warn">${x.orph} of ${x.t.fields.length} on no form</span><button class="btn quiet" data-admx="goto:${H(x.t.id)}:fields">Open</button></span></div>`).join("")||'<p class="muted">Every field is on a form.</p>'}</div></div>`}
/* ---------- the tab ---------- */
function tab(){seed();const t=tbl(X.table)||tables()[0];if(!t)return "";X.table=t.id;
 const sub=X.sub;const subs=[["fields","Fields"],["forms","Form designer"],["coverage","Coverage"]];
 const body=sub==="fields"?fieldsView(t):sub==="forms"?formsView(t):coverView();
 const detail=sub==="coverage"?"":`<div class="admx-th"><div><h3>${H(t.label)}</h3><div class="muted small"><code>${H(t.id)}</code> · ${H(t.modName)} · owner ${H(t.owner)} · ${t.fields.length} fields · ${t.forms.length} form${t.forms.length===1?"":"s"}</div></div><div class="row">${pillc(t.cls)}<button class="btn" data-admx="classic:${H(t.id)}">Edit in Fields, Layout and List views</button></div></div>`;
 return `<div class="admx"><div class="admx-left card glass"><div class="cardhead"><div><h3>Tables</h3><span class="muted small">${filtered().length} of ${tables().length}</span></div></div>${filtersHTML()}${PICKER.html({id:"admx_tbl",inline:true,label:"Tables",noun:"tables",source:explorerAdapter(),value:t.id,recent:"admin_tables",height:420,onPick:v=>{if(!v)return;X.table=v;X.fp=null;X.fsel={};X.fn=25;render()}})}</div>
 <div class="admx-right card glass"><div class="admx-subs" role="tablist" aria-label="Table views">${subs.map(s=>`<button class="chip" role="tab" data-admx="sub:${s[0]}" aria-pressed="${sub===s[0]}" aria-selected="${sub===s[0]}">${s[1]}</button>`).join("")}</div>${detail}${body}</div></div>`}
/* ---------- events ---------- */
function sel(){return Object.keys(X.fsel).filter(k=>X.fsel[k])}
document.addEventListener("click",e=>{const el=e.target.closest("[data-admx]");if(!el)return;const [a,x,y,z]=el.dataset.admx.split(":");const t=tbl(X.table);
 switch(a){
 case "sub":X.sub=x;X.fp=null;return render();
 case "goto":if(tbl(x)){X.table=x;if(y)X.sub=y;X.fp=null;X.fsel={};X.fn=25}if(S.screen!=="adm_studio")go("adm_studio");S.v.adm_studio=5;return render();
 case "classic":{const o=keyOf(x);ensure(o);S.adm.obj=o;S.v.adm_studio=0;return render()}
 case "more":X.fn+=25;return render();
 case "selall":{const q=X.q.trim().toLowerCase();t.fields.filter(f=>(!q||(f.label+" "+f.k).toLowerCase().includes(q))).slice(0,X.fn).forEach(f=>X.fsel[f.k]=el.checked);return render()}
 case "bulk":{const keys=sel();if(y==="clear"){X.fsel={};return render()}
  if(y==="req"||y==="optional"){t.fields.forEach(f=>{if(keys.includes(f.k))f.req=y==="req"});track("Field",t.id,[["~","  "+keys.length+" fields marked "+(y==="req"?"required":"optional")]]);toast(keys.length+" fields marked "+(y==="req"?"required":"optional"),"good");X.fsel={};return render()}
  if(y==="form"){seed();let form=t.forms[0]||newForm(t.id);keys.forEach(k=>{if(!hasPath(form,k))form.sections[0].paths.push(k)});saveForm(form);track("Form layout",t.id,[["+","  "+keys.length+" fields added to "+form.name]]);toast(keys.length+" fields added to "+form.name,"good");X.fsel={};X.sub="forms";X.form=form.id;return render()}return}
 case "newform":newForm(x);X.sub="forms";toast("Form created","good");return render();
 case "addsec":{const f=t.forms.find(q=>q.id===X.form);if(!f)return;const n=f.sections.length+1;f.sections.push({id:"s"+Date.now()%100000,name:"Section "+n,paths:[]});saveForm(f);return render()}
 case "secdel":{const f=t.forms.find(q=>q.id===X.form);if(!f||f.sections.length<2)return;f.sections=f.sections.filter(s=>s.id!==x);saveForm(f);return render()}
 case "mv":{const f=t.forms.find(q=>q.id===X.form),s=f.sections.find(q=>q.id===x),i=+y,j=i+ +z;if(j<0||j>=s.paths.length)return;[s.paths[i],s.paths[j]]=[s.paths[j],s.paths[i]];saveForm(f);return render()}
 case "rm":{const f=t.forms.find(q=>q.id===X.form),s=f.sections.find(q=>q.id===x);const p=s.paths.splice(+y,1)[0];saveForm(f);track("Form layout",t.id,[["-","  "+f.name+": "+p+" removed"]]);return render()}
 case "fpopen":X.fp={hops:[],section:x};return render();
 case "fpclose":X.fp=null;return render();
 case "fpup":X.fp.hops=X.fp.hops.slice(0,+x);return render();
 case "covmore":X.cov.n+=30;return render();
 case "covall":{const q=X.cov.q.trim().toLowerCase();tables().filter(t=>!t.forms.length&&(!q||(t.label+" "+t.id).toLowerCase().includes(q))).slice(0,200).forEach(t=>X.cov.sel[t.id]=true);return render()}
 case "covbulk":{const ids=Object.keys(X.cov.sel).filter(k=>X.cov.sel[k]);ids.forEach(id=>{if(!(tbl(id)||{forms:[1]}).forms.length)newForm(id)});X.cov.sel={};X.msg=ids.length+" default forms created";TC=null;toast(ids.length+" default forms created, captured in the draft package","good");return render()}
 }});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset&&t.dataset.admxFsel!=null){X.fsel[t.dataset.admxFsel]=t.checked;return render()}
 if(t.dataset&&t.dataset.admxCsel!=null){X.cov.sel[t.dataset.admxCsel]=t.checked;return render()}
 const k=t.dataset&&t.dataset.admxIn;if(!k)return;
 if(k.indexOf("f.")===0){X.f[k.slice(2)]=t.value;return render()}
 if(k==="cov.q")return;if(k==="q")return;
 if(k==="freq"){X.freq=t.checked;return render()}
 if(k==="bulkcls"){if(!t.value)return;const tb=tbl(X.table),keys=sel();tb.fields.forEach(f=>{if(keys.includes(f.k))f.classification=t.value});track("Field",tb.id,[["~","  "+keys.length+" fields classified "+t.value]]);G(()=>toast(keys.length+" fields set to "+t.value,"good"));X.fsel={};TC=null;return render()}
 if(k==="form"){X.form=t.value;return render()}
 X[k]=t.value;X.fn=25;render()});
let qt;document.addEventListener("input",e=>{const t=e.target;const k=t.dataset&&t.dataset.admxIn;if(k!=="q"&&k!=="cov.q")return;clearTimeout(qt);qt=setTimeout(()=>{if(k==="q")X.q=t.value;else X.cov.q=t.value;X.fn=25;const pos=t.selectionStart;render();const n=document.querySelector(`[data-admx-in="${k}"]`);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},180)});
W.ADMX={tab,picker,ensure,keyOf,stats,tables,forms:()=>{seed();return X.forms},tbl,addPath:(table,p)=>{seed();const t=tbl(table);const f=t.forms[0]||newForm(table);addPath(f,p)},pathInfo,state:X};
})();

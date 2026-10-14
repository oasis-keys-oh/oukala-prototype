/* ===== Round 17, Agent S, part D: the no-code Editor (When, If, Then, Else, order, scope, script, ownership) and the Test tab (dry run on a real record, nothing committed). ===== */
(function(){
"use strict";
const W=window,DOC=document;const R=W.RULES;const UI=R&&R.UI;if(!R||!UI)return;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const H=s=>esc(s==null?"":String(s));
const arr=x=>Array.isArray(x)?x:[];
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const D=R.data,U=UI.st;
const pill=(t,c)=>`<span class="pill ${c||"mute"}">${H(t)}</span>`;
const T=UI.tst=UI.tst||{ruleId:"",entity:"incident",trigger:"__save",recId:"",isNew:false,over:{},useDraft:false,res:null,flat:null};
const getP=(o,p)=>String(p).split(".").reduce((a,k)=>a==null?a:a[k],o);
const setP=(o,p,v)=>{const ks=String(p).split(".");let a=o;for(let i=0;i<ks.length-1;i++){if(a[ks[i]]==null)a[ks[i]]=/^\d+$/.test(ks[i+1])?[]:{};a=a[ks[i]]}a[ks[ks.length-1]]=v};
const humans=()=>G(()=>DIR.filter(d=>d.kind==="human").map(d=>d.name),[]);
const roleOpts=()=>G(()=>PERM.roles.map(r=>[r.id,r.n]),[]);
const permGroups=()=>G(()=>PERM.groups.map(g=>[g.id,g.n]),[]);
const entOpts=()=>R.entities().map(e=>[e.id,e.label]);
const fieldsOf=(ent,viewer)=>R.fieldList(ent).concat(viewer?R.VIEWER:[]);
const sel=(attr,val,opts,extra)=>`<select class="fin" ${attr} ${extra||""}>${opts.map(o=>{const a=Array.isArray(o)?o:[o,o];return `<option value="${H(a[0])}" ${String(a[0])===String(val==null?"":val)?"selected":""}>${H(a[1])}</option>`}).join("")}</select>`;
const inp=(path,val,o)=>{o=o||{};return `<input class="fin" type="${o.type||"text"}" data-r17s-in="${H(path)}" ${o.num?'data-t="num"':""} value="${H(val)}" ${o.ph?`placeholder="${H(o.ph)}"`:""} ${o.list?`list="${o.list}"`:""} ${o.min!=null?`min="${o.min}"`:""}>`};
const lab=(t,body,cls)=>`<label class="r17s-fl ${cls||""}"><span class="small muted">${H(t)}</span>${body}</label>`;
const people=()=>`<datalist id="r17s-people">${humans().slice(0,400).map(n=>`<option value="${H(n)}">`).join("")}</datalist>`;

/* ---------------- load / new / save ---------------- */
UI.loadDraft=id=>{const r=R.get(id);if(!r)return;U.sel=id;U.draft=clone(r.body);U.dirty=false;U.count=null};
UI.newRule=(type,body)=>{const b=R.normBody(body||R.blankBody(type,"incident"));if(!body){b.type=type;b.trigger=(R.TRIG[type]||[[""]])[0][0]}
 if(!b.owner){const me=G(()=>INBOX.me(),"");if(humans().indexOf(me)>=0)b.owner=me}b.backup=b.backup===b.owner?"":b.backup;U.sel="";U.draft=b;U.dirty=true;U.count=null;S.v.r17sv=2;go("r17s_rules")};
function problems(){const b=U.draft;if(!b)return[];const r={id:U.sel||"NEW",body:b,rt:{tested:1}};const p=R.problems(Object.assign(r,{}));
 /* actions that point at fields not in this table */
 const keys=new Set(R.fieldList(b.entity).map(f=>f.k));
 arr(b.then).concat(arr(b.else)).forEach((a,i)=>{const d=R.ACT[a.t];if(!d)return;d.fields.forEach(f=>{if(f.type==="field"&&a[f.k]&&!keys.has(a[f.k])&&R.entity(b.entity))p.push("An action uses the field '"+a[f.k]+"', which is not in "+UI.entLabel(b.entity));if(f.req&&f.type!=="toggle"&&(a[f.k]==null||a[f.k]===""))p.push("Action "+(i+1)+" ("+d.label+"): "+f.label+" is needed")})});
 R.leafList(b.when).forEach(l=>{if(l.f&&!keys.has(l.f)&&!R.VIEWER.some(v=>v.k===l.f)&&R.entity(b.entity))p.push("The condition uses '"+l.f+"', which is not in "+UI.entLabel(b.entity));if(l.f&&!R.noValueOp(l.op)&&(l.v===""||l.v==null))p.push("A condition on "+l.f+" has no value")});
 if(b.trigger==="event"&&!b.event)p.push("Choose the event that triggers this rule");
 if(b.trigger==="change"&&!arr(b.watch).length&&b.type==="client")p.push("Choose which fields to watch (or the rule never runs on a change)");
 return [...new Set(p)]}
function saveDraft(){const b=U.draft;if(!b)return;const c=R.can(U.sel?"edit":"create");if(!c.ok){toast("Your role cannot "+(U.sel?"edit":"create")+" rules. It needs one of: "+c.need.join(", "),"warn");return}
 if(!b.name.trim()){toast("Give the rule a name first","warn");return}
 if(!U.sel){const r=R.register(b,{note:"Created"});U.sel=r.id;toast("Saved as draft "+r.id,"good")}else{const r=R.save(U.sel,b,"Edited in the Editor");toast("Saved as version "+(r?r.ver:"")+(r&&r.live?". The live version keeps running until the change is approved.":""),"good")}
 R.regLists();U.dirty=false;UI.loadDraft(U.sel);render()}

/* ---------------- condition builder ---------------- */
function valueCtl(leaf,path,ent){const f=fieldsOf(ent,true).find(x=>x.k===leaf.f)||{type:"text"};if(R.noValueOp(leaf.op))return `<span class="small muted">no value needed</span>`;
 if(leaf.vk==="field")return sel(`data-r17s-in="${path}.v"`,leaf.v,[["","Choose a field"]].concat(R.fieldList(ent).filter(x=>x.k!==leaf.f).map(x=>[x.k,x.label])));
 if(f.type==="viewer"){return leaf.op==="hasrole"||leaf.op==="lacksrole"?sel(`data-r17s-in="${path}.v"`,leaf.v,[["","Choose a role"]].concat(roleOpts())):sel(`data-r17s-in="${path}.v"`,leaf.v,[["","Choose a group"]].concat(permGroups()))}
 if(f.type==="bool")return sel(`data-r17s-in="${path}.v"`,leaf.v||"true",[["true","Yes"],["false","No"]]);
 if(leaf.op==="in"||leaf.op==="nin")return inp(path+".v",leaf.v,{ph:"Separate values with commas"});
 if(f.type==="number"&&!f.opts)return inp(path+".v",leaf.v,{type:"number"});
 if(f.type==="date")return inp(path+".v",leaf.v,{type:"date"});
 if(f.type==="person")return inp(path+".v",leaf.v,{list:"r17s-people",ph:"Type a name"});
 if(f.type==="choice"||f.opts){const ch=R.fieldChoices(ent,leaf.f);const has=ch.some(c=>String(c[0])===String(leaf.v));return sel(`data-r17s-in="${path}.v"`,leaf.v,[["","Choose a value"]].concat(ch).concat(!has&&leaf.v!==""&&leaf.v!=null?[[leaf.v,leaf.v]]:[]))}
 return inp(path+".v",leaf.v)}
function condHTML(n,path,ent,depth){
 if(n.t==="g"){return `<div class="r17s-grp d${Math.min(depth,2)}"><div class="r17s-grph"><span class="small muted">Match</span>${sel(`data-r17s-in="${path}.op" data-struct`,n.op,[["and","all of these (AND)"],["or","any of these (OR)"]])}<button type="button" class="btn sm" data-r17s-addc="${path}">Add condition</button><button type="button" class="btn sm quiet" data-r17s-addg="${path}">Add group</button>${depth>0?`<button type="button" class="btn sm quiet" data-r17s-rmc="${path}" aria-label="Remove this group">Remove group</button>`:""}</div>
   ${arr(n.items).length?arr(n.items).map((c,i)=>condHTML(c,path+".items."+i,ent,depth+1)).join(""):`<p class="small muted r17s-none">No conditions: the rule applies to every record.</p>`}</div>`}
 const fl=fieldsOf(ent,true);const f=fl.find(x=>x.k===n.f)||{type:"text"};const ops=R.OPS[f.type]||R.OPS.text;
 return `<div class="r17s-cond"><label class="r17s-cf"><span class="small muted">Field</span>${sel(`data-r17s-in="${path}.f" data-struct`,n.f,[["","Choose a field"]].concat(fl.map(x=>[x.k,x.label])))}</label>
  <label class="r17s-cf"><span class="small muted">Is</span>${sel(`data-r17s-in="${path}.op" data-struct`,n.op,ops)}</label>
  <label class="r17s-cf r17s-cv"><span class="small muted">Value</span>${valueCtl(n,path,ent)}</label>
  ${f.type!=="viewer"&&!R.noValueOp(n.op)?`<label class="r17s-cx small"><input type="checkbox" data-r17s-in="${path}.vk" data-t="vk" data-struct ${n.vk==="field"?"checked":""}> Compare with another field</label>`:""}
  <button type="button" class="btn sm quiet" data-r17s-rmc="${path}" aria-label="Remove this condition">Remove</button></div>`}

/* ---------------- actions ---------------- */
function actField(a,f,path,ent){const v=a[f.k];const at=`data-r17s-in="${path}.${f.k}"`;
 switch(f.type){
  case"field":return lab(f.label,sel(at,v,[["","Choose a field"]].concat(R.fieldList(ent).map(x=>[x.k,x.label]))));
  case"select":return lab(f.label,sel(at+" data-struct",v==null?(f.opts[0]||[""])[0]:v,f.opts));
  case"longtext":return lab(f.label,`<textarea class="fin" rows="2" ${at} placeholder="${H(f.ph||"")}">${H(v)}</textarea>`,"wide");
  case"number":return lab(f.label,inp(path+"."+f.k,v,{type:"number",num:1,ph:f.ph}));
  case"toggle":return `<label class="r17s-cx small"><input type="checkbox" ${at} data-t="bool" ${v?"checked":""}> ${H(f.label)}</label>`;
  case"choicelist":return lab(f.label,sel(at+" data-struct",v,[["","Choose a choice list"]].concat(D.rules.filter(r=>r.body.type==="choice").map(r=>[r.id,r.body.name]))));
  case"recipient":return a.who==="owner"||a.who==="requester"?"":a.who==="person"?lab(f.label,inp(path+"."+f.k,v,{list:"r17s-people",ph:"Type a name"})):lab(f.label,sel(at,v,[["","Choose a group"]].concat(R.groupOpts())));
  case"recipient1":return lab(f.label,inp(path+"."+f.k,v,{list:"r17s-people",ph:"owner, or type a name"}));
  case"table":return lab(f.label,inp(path+"."+f.k,v,{list:"r17s-tables",ph:"For example project_task"}));
  case"flow":return lab(f.label,sel(at,v,[["","Choose a workflow"]].concat(G(()=>FLOWX.flows().slice(0,80).map(x=>[x.id,x.name]),[]))));
  case"group":return lab(f.label,sel(at,v,[["","Choose a group"]].concat(R.groupOpts())));
  case"event":return lab(f.label,inp(path+"."+f.k,v,{list:"r17s-events",ph:"For example incident.major_declared"}));
  case"agent":return lab(f.label,sel(at,v,[["","Choose an agent"]].concat(G(()=>AGENTS_STATE.list().map(x=>[x.name,x.display||x.name]),[]))));
  default:return lab(f.label,inp(path+"."+f.k,v,{ph:f.ph}))}}
function actHTML(list,branch,ent,type){const ids=R.actionIds(type);
 return arr(list).map((a,i)=>{const d=R.ACT[a.t];const path=branch+"."+i;if(!d)return `<div class="r17s-act"><p>Unknown action ${H(a.t)}</p></div>`;
  const opts=ids.map(id=>[id,R.ACT[id].label]);
  return `<div class="r17s-act"><div class="r17s-acth"><span class="r17s-n num">${i+1}</span>${sel(`data-r17s-in="${path}.t" data-struct data-act`,a.t,opts)}<span class="r17s-mv"><button type="button" class="btn sm quiet" data-r17s-mv="${branch}:${i}:-1" ${i?"":"disabled"} aria-label="Move up">Up</button><button type="button" class="btn sm quiet" data-r17s-mv="${branch}:${i}:1" ${i<list.length-1?"":"disabled"} aria-label="Move down">Down</button><button type="button" class="btn sm quiet" data-r17s-rma="${branch}:${i}" aria-label="Remove action ${i+1}">Remove</button></span></div>
   <p class="r17s-sum"><b>This will:</b> ${H(R.actionSummary(a,ent))}</p><div class="r17s-af">${d.fields.map(f=>actField(a,f,path,ent)).join("")}</div></div>`}).join("")}
function addAct(branch,ent,type){const ids=R.actionIds(type);const groups={};ids.forEach(id=>{const g=R.ACT[id].group;(groups[g]=groups[g]||[]).push(id)});
 return `<div class="r17s-addact"><select class="fin" data-r17s-addsel="${branch}" aria-label="Choose an action to add"><option value="">Add an action…</option>${Object.keys(groups).map(g=>`<optgroup label="${H(g)}">${groups[g].map(id=>`<option value="${id}">${H(R.ACT[id].label)}</option>`).join("")}</optgroup>`).join("")}</select></div>`}

/* ---------------- sections ---------------- */
function entPick(){const live=R.entities().map(e=>[e.id,e.label,e.fields.length+" fields, live records",e.generic?"Record pages (live)":"Live: forms and records"]);
 const have=new Set(live.map(x=>x[0]));const other=G(()=>LISTS.get("tables").filter(t=>!have.has(t.v)).slice(0,1500).map(t=>[t.v,t.l,t.sub,"Other tables (rule stored; runs on entity store writes)"]),[]);
 return typeof PICKER!=="undefined"?PICKER.html({id:"r17s_ent",label:"Table",source:live.concat(other),value:U.draft.entity,placeholder:"Choose a table",noun:"tables",onPick:v=>{if(v&&v!==U.draft.entity){U.draft.entity=v;U.draft.when={t:"g",op:"and",items:[]};U.draft.watch=[];U.dirty=true;U.count=null;paint()}}}):sel('data-r17s-in="entity" data-struct',U.draft.entity,entOpts())}
function ppick(id,label,val,path){return typeof PICKER!=="undefined"?PICKER.html({id,label,source:"people",value:val,placeholder:"Choose a person",none:"Nobody yet",noun:"people",onPick:v=>{setP(U.draft,path,v||"");U.dirty=true;paintPrev()}}):inp(path,val,{list:"r17s-people"})}
function trigExtra(b){let h="";const ent=b.entity;
 if(b.type==="client"&&b.trigger==="change"){h+=lab("Watch these fields",`<div class="fchips r17s-wchips">${R.fieldList(ent).map(f=>`<button type="button" class="chip" data-r17s-watch="${H(f.k)}" aria-pressed="${arr(b.watch).indexOf(f.k)>=0}">${H(f.label)}</button>`).join("")}</div>`,"wide")}
 if(b.trigger==="event")h+=lab("Event",inp("event",b.event,{list:"r17s-events",ph:"For example approval.escalated"}));
 if(b.trigger==="schedule")h+=lab("How often",sel('data-r17s-in="schedule"',b.schedule,[["hourly","Every hour"],["daily","Every day"],["weekly","Every week"]]))+`<label class="r17s-cx small"><input type="checkbox" data-r17s-in="once" data-t="bool" ${b.once!==false?"checked":""}> Act once per record per day (no repeats)</label>`;
 if(b.type==="client")h+=lab("Only on this form (optional form id)",inp("form",b.form,{ph:"For example itsm_inc"}));
 if(b.type==="uiaction")h+=lab("Button label",inp("ui.label",b.ui.label,{ph:"Page the service owners"}))+lab("Shown on",sel('data-r17s-in="ui.place"',b.ui.place,[["form","A form"],["list","A list (row menu)"],["menu","The context menu"]]))+lab("Only for these roles (leave empty for everyone)",`<div class="fchips">${roleOpts().map(r=>`<button type="button" class="chip" data-r17s-uirole="${H(r[0])}" aria-pressed="${arr(b.ui.roles).indexOf(r[0])>=0}">${H(r[1])}</button>`).join("")}</div>`,"wide");
 return h}
function notifyHTML(b){const d=b.deliver;return `<section class="card glass r17s-c"><div class="cardhead"><div><h3>Then: send a notification</h3><span class="muted small">Who is told, how, and when. Uses the notification layer and respects quiet hours and de-duplication.</span></div></div>
  <div class="r17s-af">${lab("Who",sel('data-r17s-in="deliver.who" data-struct',d.who,[["group","A group"],["approver_group","An approver group"],["person","A person"],["owner","The record owner"],["requester","The requester"]]))}
  ${d.who==="group"||d.who==="approver_group"?lab("Group",sel('data-r17s-in="deliver.ref"',d.ref,[["","Choose a group"]].concat(R.groupOpts()))):d.who==="person"?lab("Person",inp("deliver.ref",d.ref,{list:"r17s-people"})):""}
  ${lab("Title",inp("deliver.title",d.title,{ph:"Use {field} to insert a value"}))}${lab("Details",`<textarea class="fin" rows="2" data-r17s-in="deliver.body">${H(d.body)}</textarea>`,"wide")}
  ${lab("Delivery",sel('data-r17s-in="deliver.mode"',d.mode,[["immediate","Immediately"],["digest","In the daily digest"]]))}${lab("Style",sel('data-r17s-in="deliver.kind"',d.kind,[["info","Information"],["warn","Warning"],["bad","Urgent"]]))}
  ${lab("Do not repeat within (minutes)",inp("deliver.dedupeMin",d.dedupeMin,{type:"number",num:1}))}<label class="r17s-cx small"><input type="checkbox" data-r17s-in="deliver.quiet" data-t="bool" ${d.quiet?"checked":""}> Hold during quiet hours (${H(D.cfg.quiet.from)} to ${H(D.cfg.quiet.to)})</label></div></section>`}
function choiceHTML(b){const c=b.choice;const body=c.kind==="dependent"
  ?`<div class="r17s-map">${Object.keys(c.map||{}).map((k,i)=>`<div class="r17s-mrow"><label class="r17s-cf"><span class="small muted">When ${H(c.parent||"the parent field")} is</span><input class="fin" type="text" value="${H(k)}" data-r17s-mk="${H(k)}"></label><label class="r17s-cf r17s-cv"><span class="small muted">Offer these choices (one per line)</span><textarea class="fin" rows="3" data-r17s-mv2="${H(k)}">${H(arr(c.map[k]).join("\n"))}</textarea></label><button type="button" class="btn sm quiet" data-r17s-mrm="${H(k)}">Remove</button></div>`).join("")}<button type="button" class="btn sm" data-r17s-madd>Add a parent value</button></div>`
  :lab("Choices (one per line)",`<textarea class="fin" rows="6" data-r17s-vals>${H(arr(c.values).join("\n"))}</textarea>`,"wide");
 const pv=R.choiceAll(U.sel||"__none");const used=D.rules.filter(r=>r.body.type==="client"&&arr(r.body.then).concat(arr(r.body.else)).some(a=>a.t==="set_choices"&&a.list===U.sel)).map(r=>r.id);
 return `<section class="card glass r17s-c"><div class="cardhead"><div><h3>Choices</h3><span class="muted small">A value set for a drop-down. It is registered in the shared list registry (LISTS) so any picker can use it; one owner, versioned, approved like any rule.</span></div></div>
  <div class="r17s-af">${lab("Fills this field",sel('data-r17s-in="choice.field"',c.field,[["","Choose a field"]].concat(R.fieldList(b.entity).map(f=>[f.k,f.label]))))}${lab("Kind",sel('data-r17s-in="choice.kind" data-struct',c.kind,[["static","One list for everyone"],["dependent","Depends on another field"]]))}
  ${c.kind==="dependent"?lab("Depends on",sel('data-r17s-in="choice.parent" data-struct',c.parent,[["","Choose a field"]].concat(R.fieldList(b.entity).map(f=>[f.k,f.label])))):""}</div>${body}
  <p class="small muted">${U.sel?`In the list registry as <code>r17s_${H(U.sel)}</code>. Used by ${used.length?used.map(H).join(", "):"no client rule yet"}.`:"Save the list to register it."}</p></section>`}
function scopeHTML(b){const s=b.scope;return `<section class="card glass r17s-c"><div class="cardhead"><div><h3>Order, scope and window</h3><span class="muted small">Lower order runs first on a table. Scope uses the same roles and groups as the Permissions model.</span></div></div>
  <div class="r17s-af">${b.type==="choice"?"":lab("Order",inp("order",b.order,{type:"number",num:1,min:1}))}${b.type==="choice"||b.type==="uiaction"?"":`<label class="r17s-cx small"><input type="checkbox" data-r17s-in="stop" data-t="bool" ${b.stop?"checked":""}> Stop processing more rules after this one fires</label>`}
  ${lab("Applies to",sel('data-r17s-in="scope.kind" data-struct',s.kind,[["all","All users"],["roles","These roles"],["groups","These groups"]]))}
  ${s.kind==="roles"?lab("Roles",`<div class="fchips">${roleOpts().map(r=>`<button type="button" class="chip" data-r17s-sc="roles:${H(r[0])}" aria-pressed="${arr(s.roles).indexOf(r[0])>=0}">${H(r[1])}</button>`).join("")}</div>`,"wide"):s.kind==="groups"?lab("Groups",`<div class="fchips">${permGroups().map(r=>`<button type="button" class="chip" data-r17s-sc="groups:${H(r[0])}" aria-pressed="${arr(s.groups).indexOf(r[0])>=0}">${H(r[1])}</button>`).join("")}</div>`,"wide"):""}
  ${lab("Active from",inp("window.from",b.window.from,{type:"date"}))}${lab("Active until",inp("window.to",b.window.to,{type:"date"}))}</div></section>`}
function scriptHTML(b){const keys=R.fieldList(b.entity).map(f=>f.k);const v=R.expr.validate(b.script,keys);
 return `<section class="card glass r17s-c"><div class="cardhead"><div><h3>Script step (optional)</h3><span class="muted small">A single expression that must also be true. It cannot run code: only the functions and fields listed here.</span></div></div>
  <textarea class="fin r17s-script" rows="2" data-r17s-in="script" spellcheck="false" placeholder="For example: users_affected * 2 > 100 and not isBlank(service)" aria-describedby="r17s-serr">${H(b.script)}</textarea>
  <div id="r17s-serr" class="r17s-serr ${v.ok?"ok":"bad"}" role="status">${b.script.trim()?(v.ok?"Valid. It uses "+(v.calls.length?v.calls.join(", ")+" and ":"")+"fields of "+H(UI.entLabel(b.entity))+".":`${H(v.err)}${v.pos!=null&&!v.unknown.length?" (at character "+(v.pos+1)+")":""}`):"No script. The condition above is enough for most rules."}</div>
  <div class="fchips r17s-fchips" aria-label="Insert a field">${R.fieldList(b.entity).slice(0,14).map(f=>`<button type="button" class="chip" data-r17s-ins="${H(f.k)}" title="${H(f.label)}">${H(f.k)}</button>`).join("")}</div></section>`}
function whenHTML(b){return `<section class="card glass r17s-c"><div class="cardhead"><div><h3>When</h3><span class="muted small">The table and the moment the rule looks at a record.</span></div></div>
  <div class="r17s-af">${lab("Type",sel('data-r17s-in="type" data-struct',b.type,Object.keys(R.TYPES).map(t=>[t,R.TYPES[t].label+" · "+R.TYPES[t].blurb])),"wide")}
  <div class="r17s-fl">${entPick()}</div>
  ${b.type==="choice"?"":lab("Trigger",sel('data-r17s-in="trigger" data-struct',b.trigger,R.TRIG[b.type]||[]))}${trigExtra(b)}</div></section>`}
function ifHTML(b){return `<section class="card glass r17s-c"><div class="cardhead"><div><h3>If</h3><span class="muted small">Pick a field, an operator and a value or another field. Add groups for AND/OR.</span></div></div>
  ${condHTML(b.when,"when",b.entity,0)}<div id="r17s-prev-plain" class="r17s-plain"></div></section>`}
function editorForm(){const b=U.draft;const pr=problems();const r=U.sel?R.get(U.sel):null;const ct=R.can(U.sel?"edit":"create");
 const head=`<div class="r17s-edhead"><label class="r17s-fl"><span class="small muted">Rule</span><select class="fin" data-r17s-pick>${[["","New rule (not saved)"]].concat(D.rules.map(x=>[x.id,x.id+" · "+x.body.name])).map(o=>`<option value="${H(o[0])}" ${o[0]===U.sel?"selected":""}>${H(o[1])}</option>`).join("")}</select></label>
  <div class="r17s-edst">${r?UI.stPill(r)+" "+pill("version "+r.ver,"info")+(r.live?" "+pill("live version "+r.liveVer,"good"):""):pill("Not saved yet","info")}${U.dirty?" "+pill("Unsaved edits","warn"):""}</div></div>`;
 const basics=`<section class="card glass r17s-c"><div class="cardhead"><div><h3>Name and owner</h3><span class="muted small">Every rule has one accountable person and a different named backup.</span></div></div><div class="r17s-af">${lab("Name",inp("name",b.name,{ph:"Say what it does, in plain words"}),"wide")}${lab("Description",`<textarea class="fin" rows="2" data-r17s-in="desc" placeholder="Why this rule exists">${H(b.desc)}</textarea>`,"wide")}<div class="r17s-fl">${ppick("r17s_own","Owner",b.owner,"owner")}</div><div class="r17s-fl">${ppick("r17s_bak","Backup",b.backup,"backup")}</div></div></section>`;
 let mid="";
 if(b.type==="choice")mid=choiceHTML(b);
 else if(b.type==="notify")mid=ifHTML(b)+notifyHTML(b);
 else{mid=ifHTML(b)+`<section class="card glass r17s-c"><div class="cardhead"><div><h3>Then</h3><span class="muted small">Actions run in order. Each one says exactly what it will change.</span></div></div>${actHTML(b.then,"then",b.entity,b.type)}${addAct("then",b.entity,b.type)}</section>`+
  `<section class="card glass r17s-c"><div class="cardhead"><div><h3>Else</h3><span class="muted small">Optional. Runs when the condition is not met.</span></div></div>${arr(b.else).length?actHTML(b.else,"else",b.entity,b.type):`<p class="small muted">No else actions.</p>`}${addAct("else",b.entity,b.type)}</section>`}
 const foot=`<div class="r17s-edfoot"><button type="button" class="btn primary" data-r17s-save ${ct.ok?"":"disabled"}>${U.sel?"Save as a new version":"Save draft"}</button><button type="button" class="btn" data-r17s-totest ${U.sel?"":"disabled"}>Test this rule</button><button type="button" class="btn" data-r17s-activate ${U.sel&&R.can("activate").ok?"":"disabled"}>Request activation</button><button type="button" class="btn quiet" data-r17s-discard>Discard edits</button><button type="button" class="btn quiet danger" data-r17s-retire ${U.sel&&r&&r.status!=="retired"&&R.can("edit").ok?"":"disabled"}>Retire</button>${ct.ok?"":`<span class="small muted">Your role cannot ${U.sel?"edit":"create"} rules.</span>`}</div>`;
 return `${head}<div class="r17s-edgrid"><div class="r17s-edmain">${basics}${whenHTML(b)}${mid}${b.type==="choice"?"":scriptHTML(b)}${scopeHTML(b)}${foot}</div><aside class="r17s-edside"><div class="card glass r17s-c r17s-sticky" id="r17s-prev"></div></aside></div>
  ${people()}<datalist id="r17s-tables">${G(()=>Object.keys(DATAMODEL.tables).slice(0,400).map(k=>`<option value="${H(k)}">`).join(""),"")}</datalist><datalist id="r17s-events">${G(()=>EVENTS.list().slice(0,300).map(e=>`<option value="${H(e.id)}">`).join(""),"")}</datalist>`}
function prevHTML(){const b=U.draft;if(!b)return "";const pr=problems();const r=U.sel?R.get(U.sel):null;
 const acts=arr(b.then).map((a,i)=>`<li>${H(R.actionSummary(a,b.entity))}</li>`).join("");const els=arr(b.else).map(a=>`<li>${H(R.actionSummary(a,b.entity))}</li>`).join("");
 const cp=R.condPlain(b.when,b.entity);const cnt=U.count;
 let plain=`<p class="r17s-sentence"><b>${H(R.trigLabel(b.type,b.trigger))}</b> on <b>${H(UI.entLabel(b.entity))}</b>${cp?", if <b>"+H(cp)+"</b>":""}${b.script.trim()?" and the script is true":""}, ${b.type==="notify"?`notify <b>${H(b.deliver.who==="owner"?"the record owner":b.deliver.who==="requester"?"the requester":(b.deliver.who==="person"?b.deliver.ref:R.groupMembers(b.deliver.ref).name)||"nobody yet")}</b> ${b.deliver.mode==="digest"?"in the digest":"at once"}${b.deliver.quiet?", not during quiet hours":""}.`:b.type==="choice"?"offer the choices below.":`then:</p><ol class="r17s-ol">${acts||"<li class=muted>no action yet</li>"}</ol>${els?`<p>Otherwise:</p><ol class="r17s-ol">${els}</ol>`:""}`}${b.type==="notify"||b.type==="choice"?"</p>":""}`;
 const ex=R.condExpr(b.when,b.entity);
 let match=`<p class="small muted">Counting…</p>`;if(b.type!=="choice"){if(cnt){match=cnt.m==null?`<p class="small muted">${H(cnt.note||"No live records for this table.")}</p>`:cnt.err?`<p class="small r17s-bad">${H(cnt.err)}</p>`:`<p><b class="num" data-role="metric">${cnt.n}</b> of <b class="num" data-role="metric">${cnt.m}</b> current ${H(UI.entLabel(b.entity)).toLowerCase()} records match the condition${cnt.ids.length?` <span class="small muted">(for example ${cnt.ids.map(H).join(", ")})</span>`:""}.</p>`}}else match="";
 return `<h3>Preview</h3>${plain}${ex?`<p class="small muted">Expression: <code>${H(ex)}</code></p>`:""}${match}
  <h4 class="r17s-h4">Before it can go live</h4>${pr.length?`<ul class="r17s-ul r17s-bad">${pr.map(p=>`<li>${H(p)}</li>`).join("")}</ul>`:`<p class="small">No problems found.</p>`}
  <ul class="r17s-ul small"><li>${r&&r.rt.tested?pill("Tested "+new Date(r.rt.tested).toLocaleDateString(),"good"):pill("Not tested","warn")} A test on a record is needed.</li><li>${pill("Group approval","info")} Sent to ${H(G(()=>APG.get(R.govGroup()).name,"the governance board"))}.</li><li>${R.can("activate").ok?pill("You can request activation","good"):pill("Your role cannot request activation","mute")}</li></ul>`}
function empty(){return `<div class="r17s-stack"><section class="card glass r17s-c"><div class="cardhead"><div><h3>Editor</h3><span class="muted small">Open a rule from the Rules tab, or start a new one.</span></div></div><div class="row r17s-newrow">${Object.keys(R.TYPES).map(t=>`<button type="button" class="btn" data-r17s-new="${t}">New ${H(R.TYPES[t].label.toLowerCase())}</button>`).join("")}</div><p class="small muted">Or pick a ready-made template from the Library tab.</p></section></div>`}
UI.editor=()=>{setTimeout(paintPrev,0);return `<div id="r17s-ed" class="r17s-ed">${U.draft?editorForm():empty()}</div>`};
function paint(){const el=DOC.getElementById("r17s-ed");if(!el)return;const y=window.scrollY;el.innerHTML=U.draft?editorForm():empty();paintPrev();window.scrollTo(0,y)}
let ct=0;
function paintPrev(){const el=DOC.getElementById("r17s-prev");if(!el||!U.draft)return;el.innerHTML=prevHTML();clearTimeout(ct);ct=setTimeout(()=>{if(!U.draft)return;U.count=R.countMatches(U.draft,600);const e2=DOC.getElementById("r17s-prev");if(e2)e2.innerHTML=prevHTML();const sv=DOC.getElementById("r17s-serr");const b=U.draft;if(sv&&DOC.activeElement&&DOC.activeElement.dataset&&DOC.activeElement.dataset.r17sIn==="script"){const v=R.expr.validate(b.script,R.fieldList(b.entity).map(f=>f.k));sv.className="r17s-serr "+(v.ok?"ok":"bad");sv.textContent=b.script.trim()?(v.ok?"Valid.":v.err+(v.pos!=null&&!v.unknown.length?" (at character "+(v.pos+1)+")":"")):"No script."}},280)}
UI.paintEditor=paint;

/* ---------------- editor events ---------------- */
function coerce(t,v,el){if(t==="num")return v===""?"":+v;if(t==="bool")return !!el.checked;if(t==="vk")return el.checked?"field":"value";return v}
function onIn(el,final){if(!U.draft)return;const p=el.dataset.r17sIn;let v=coerce(el.dataset.t,el.value,el);
 if(p==="type"){const b=U.draft;b.type=v;b.trigger=(R.TRIG[v]||[[""]])[0][0];const ok=new Set(R.actionIds(v));b.then=arr(b.then).filter(a=>ok.has(a.t));b.else=arr(b.else).filter(a=>ok.has(a.t));U.dirty=true;paint();return}
 if(/\.t$/.test(p)&&el.hasAttribute("data-act")){const idx=p.replace(/\.t$/,"");setP(U.draft,idx,R.newAction(v));U.dirty=true;paint();return}
 if(/\.f$/.test(p)&&/^when/.test(p)){const leaf=getP(U.draft,p.replace(/\.f$/,""));leaf.f=v;const f=fieldsOf(U.draft.entity,true).find(x=>x.k===v)||{type:"text"};const ops=R.OPS[f.type]||R.OPS.text;if(!ops.some(o=>o[0]===leaf.op))leaf.op=ops[0][0];leaf.v="";U.dirty=true;paint();return}
 if(/^when.*\.op$/.test(p)&&!/items\.\d+\.op$/.test(p)===false&&false){}
 setP(U.draft,p,v);U.dirty=true;
 if(el.hasAttribute("data-struct")){if(p==="trigger")U.draft.watch=U.draft.watch||[];paint();return}
 paintPrev()}
DOC.addEventListener("input",e=>{const el=e.target;if(!el.matches||!el.matches("[data-r17s-in]"))return;if(el.tagName==="SELECT"||el.type==="checkbox")return;onIn(el,false)});
DOC.addEventListener("change",e=>{const el=e.target;if(!el.matches)return;
 if(el.matches("[data-r17s-in]")){if(el.tagName==="SELECT"||el.type==="checkbox")onIn(el,true);return}
 if(el.matches("[data-r17s-pick]")){if(el.value)UI.loadDraft(el.value);else{U.sel="";U.draft=R.normBody(R.blankBody("client","incident"));U.dirty=true}paint();return}
 if(el.matches("[data-r17s-addsel]")){const br=el.dataset.r17sAddsel;if(el.value&&U.draft){U.draft[br]=arr(U.draft[br]);U.draft[br].push(R.newAction(el.value));U.dirty=true;paint()}return}
 if(el.matches("[data-r17s-vals]")){U.draft.choice.values=el.value.split("\n").map(x=>x.trim()).filter(Boolean);U.dirty=true;paintPrev();return}
 if(el.matches("[data-r17s-mv2]")){const k=el.dataset.r17sMv2;U.draft.choice.map[k]=el.value.split("\n").map(x=>x.trim()).filter(Boolean);U.dirty=true;return}
 if(el.matches("[data-r17s-mk]")){const k=el.dataset.r17sMk,m=U.draft.choice.map;if(el.value&&el.value!==k){const nm={};Object.keys(m).forEach(x=>{nm[x===k?el.value:x]=m[x]});U.draft.choice.map=nm;U.dirty=true;paint()}}});
DOC.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r17s-addc],[data-r17s-addg],[data-r17s-rmc],[data-r17s-mv],[data-r17s-rma],[data-r17s-watch],[data-r17s-uirole],[data-r17s-sc],[data-r17s-ins],[data-r17s-save],[data-r17s-discard],[data-r17s-totest],[data-r17s-activate],[data-r17s-retire],[data-r17s-madd],[data-r17s-mrm],[data-r17s-runtest],[data-r17s-mark]");if(!t)return;const d=t.dataset;const b=U.draft;
 if(d.r17sAddc!=null&&b){const g=getP(b,d.r17sAddc);g.items.push({t:"c",f:"",op:"is",v:"",vk:"value"});U.dirty=true;paint();return}
 if(d.r17sAddg!=null&&b){const g=getP(b,d.r17sAddg);g.items.push({t:"g",op:"and",items:[]});U.dirty=true;paint();return}
 if(d.r17sRmc!=null&&b){const ks=d.r17sRmc.split(".");const idx=+ks.pop();ks.pop();const par=getP(b,ks.join("."));par.items.splice(idx,1);U.dirty=true;paint();return}
 if(d.r17sMv&&b){const [br,i,dl]=d.r17sMv.split(":");const l=b[br],j=+i+ +dl;if(j<0||j>=l.length)return;const x=l.splice(+i,1)[0];l.splice(j,0,x);U.dirty=true;paint();return}
 if(d.r17sRma&&b){const [br,i]=d.r17sRma.split(":");b[br].splice(+i,1);U.dirty=true;paint();return}
 if(d.r17sWatch&&b){const w=b.watch=arr(b.watch);const i=w.indexOf(d.r17sWatch);if(i>=0)w.splice(i,1);else w.push(d.r17sWatch);U.dirty=true;paint();return}
 if(d.r17sUirole&&b){const w=b.ui.roles=arr(b.ui.roles);const i=w.indexOf(d.r17sUirole);if(i>=0)w.splice(i,1);else w.push(d.r17sUirole);U.dirty=true;paint();return}
 if(d.r17sSc&&b){const [k,v]=d.r17sSc.split(":");const w=b.scope[k]=arr(b.scope[k]);const i=w.indexOf(v);if(i>=0)w.splice(i,1);else w.push(v);U.dirty=true;paint();return}
 if(d.r17sIns&&b){const ta=DOC.querySelector('[data-r17s-in="script"]');if(ta){const s=ta.selectionStart==null?ta.value.length:ta.selectionStart;ta.value=ta.value.slice(0,s)+d.r17sIns+ta.value.slice(s);b.script=ta.value;U.dirty=true;ta.focus();ta.setSelectionRange(s+d.r17sIns.length,s+d.r17sIns.length);paintPrev()}return}
 if(d.r17sMadd!=null&&b){let k="New value",n=1;while(b.choice.map[k])k="New value "+(++n);b.choice.map[k]=[];U.dirty=true;paint();return}
 if(d.r17sMrm&&b){delete b.choice.map[d.r17sMrm];U.dirty=true;paint();return}
 if(d.r17sSave!=null){saveDraft();return}
 if(d.r17sDiscard!=null){if(U.sel)UI.loadDraft(U.sel);else{U.draft=null}U.dirty=false;paint();return}
 if(d.r17sTotest!=null){if(U.dirty){toast("Save your edits first, or tick 'Use the draft' on the Test tab","info")}T.ruleId=U.sel;const r=R.get(U.sel);T.entity=r.body.entity;T.trigger=r.body.trigger;T.useDraft=false;T.recId="";T.over={};T.res=null;autoPick(r);runTest();S.v.r17sv=3;render();return}
 if(d.r17sActivate!=null){const x=R.requestActivation(U.sel);if(!x.ok){toast(x.why,"warn");return}toast("Sent to the Platform governance board for approval","good");S.v.r17sv=6;render();return}
 if(d.r17sRetire!=null){if(confirm("Retire this rule? It stops running right away and stays in the history.")){R.retire(U.sel,"Retired from the Editor");UI.loadDraft(U.sel);render()}return}
 if(d.r17sRuntest!=null){runTest();paintTest();return}
 if(d.r17sMark!=null){return}});

/* ---------------- Test tab ---------------- */
function recList(ent){const e=R.entity(ent);if(!e)return[];return arr(G(()=>e.list(),[])).slice(0,500).map(id=>{const f=R.flatOf(ent,id)||{};return [id,id+" "+(f.title||f.name||""),f.state||f.status||f.category||"",""]})}
function autoPick(r){const b=r?r.body:null;const e=R.entity(T.entity);if(!e)return;const ids=arr(G(()=>e.list(),[]));if(!ids.length)return;
 let pick=ids[0];if(b){const c=R.countMatches(b,600);if(c.ids&&c.ids.length)pick=c.ids[0]}T.recId=pick;loadFlat()}
function loadFlat(){T.flat=T.recId?R.flatOf(T.entity,T.recId):null;T.over={}}
function runTest(){const ent=T.entity;const spec={entity:ent,trigger:T.trigger,ruleId:T.ruleId||undefined,isNew:T.isNew,useDraft:T.useDraft&&T.ruleId===U.sel&&!!U.draft,overrides:T.over,newState:T.trigger==="__save"&&/change|ci/.test(ent)?undefined:undefined};
 if(spec.useDraft&&U.draft){const r=R.get(U.sel);spec.rules=null}
 if(T.recId)spec.recId=T.recId;else spec.rec=Object.assign({id:"SAMPLE"},T.over);
 if(spec.useDraft){const r=R.get(U.sel);const saved=r.body;r.body=clone(U.draft);try{T.res=R.test(spec)}finally{r.body=saved}}else T.res=R.test(spec);
 T.res.spec=spec}
function trigOpts(){const o=[["__save","Whole save (open, save, after save)"]];const seen={};Object.keys(R.TRIG).forEach(t=>R.TRIG[t].forEach(x=>{if(!seen[x[0]]&&x[0]!=="lookup"){seen[x[0]]=1;o.push(x)}}));return o}
function fval(v){return v===undefined||v===""||v===null?"(blank)":typeof v==="boolean"?(v?"Yes":"No"):String(v)}
function resultHTML(res){if(!res)return `<p class="muted">Choose what to test and press Run. Nothing is saved, no notification is sent, no workflow starts.</p>`;
 const fired=res.fired.filter(f=>f.matched).length;
 const verdict=`<div class="r17s-verdict ${res.blocked?"bad":res.errors.length?"warn":"ok"}"><b>${res.checked}</b> rule${res.checked===1?"":"s"} checked, <b>${fired}</b> fired. ${res.blocked?`<b>The save would be blocked:</b> ${H(res.blocked.text)}`:res.confirm?`The person would be asked: ${H(res.confirm.text)}`:"The save would go through."} ${res.errors.length?`<span class="r17s-bad">${res.errors.length} error(s).</span>`:""} <span class="muted small">Nothing was written.</span></div>`;
 const rows=Object.keys(Object.assign({},res.before,res.after)).filter(k=>k!=="id"||true).slice(0,60);
 const ba=`<div class="tscroll"><table class="tbl r17s-tbl"><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>${res.diff.length?res.diff.map(d=>`<tr class="r17s-chg"><td data-label="Field"><b>${H(d.label||d.f)}</b></td><td data-label="Before">${H(fval(d.from))}</td><td data-label="After"><b>${H(fval(d.to))}</b></td></tr>`).join(""):`<tr><td colspan="3" class="muted">No field value changes.</td></tr>`}</tbody></table></div>`;
 const order=res.trace.map((x,i)=>`<li class="r17s-tr ${x.matched?"hit":"miss"}"><div><span class="num">${i+1}</span> ${x.matched?pill("Fired","good"):pill("Did not match","mute")} <b>${H(x.name)}</b> <span class="small muted">${H(x.rule)} · ${H(R.trigLabel(x.type,x.trigger)||x.trigger)}</span></div>${x.why?`<div class="small muted">${H(x.why)}</div>`:""}${arr(x.leaves).map(l=>`<div class="small r17s-leaf">${l.ok?"✓":"✗"} ${H(l.text)}${l.actual!==undefined&&l.actual!==""?` <span class="muted">(value is ${H(fval(l.actual))})</span>`:""}</div>`).join("")}${x.script?`<div class="small r17s-leaf">Script <code>${H(x.script)}</code></div>`:""}</li>`).join("");
 const msgs=res.msgs.map(m=>`<div class="r17s-banner r17s-${m.kind}"><b>${m.kind==="bad"?"Not saved":m.kind==="warn"?"Check":"Note"}</b> ${H(m.text)} <span class="r17s-rid">${H(m.rule)}</span></div>`).join("");
 const nots=res.notifs.length?`<div class="tscroll"><table class="tbl r17s-tbl"><thead><tr><th>Notice</th><th>To</th><th>What would happen</th></tr></thead><tbody>${res.notifs.map(n=>`<tr><td data-label="Notice"><b>${H(n.title)}</b><div class="small muted">${H(n.body||"")}</div></td><td data-label="To">${H(n.toName)}${n.to.length?` <span class="small muted">${n.to.length} ${n.to.length===1?"person":"people"}</span>`:""}</td><td data-label="What would happen">${pill(n.state==="sent"?"Sent at once":n.state==="digest"?"Goes to the digest":n.state==="held"?"Held for quiet hours":"Suppressed",n.state==="sent"?"good":"warn")}<div class="small muted">${H(n.why||"")}</div></td></tr>`).join("")}</tbody></table></div>`:"";
 const fx=res.effects.length?`<ul class="r17s-ul">${res.effects.map(x=>`<li>${H(x.text)}</li>`).join("")}</ul>`:"";
 const fxc=res.fx;const ui=[];if(fxc){Object.keys(fxc.hide).forEach(k=>ui.push("Hides "+k));Object.keys(fxc.show).forEach(k=>ui.push("Shows "+k));Object.keys(fxc.req).forEach(k=>ui.push("Requires "+k));Object.keys(fxc.ro).forEach(k=>ui.push("Locks "+k));Object.keys(fxc.choices).forEach(k=>ui.push("Offers "+fxc.choices[k].values.length+" choices in "+k))}
 return `${verdict}<h4 class="r17s-h4">Before and after</h4>${ba}<h4 class="r17s-h4">Rules in the order they ran</h4>${order?`<ol class="r17s-trace">${order}</ol>`:`<p class="muted">No active rule applies to this table and trigger.</p>`}
  ${msgs?`<h4 class="r17s-h4">Messages the person would see</h4>${msgs}`:""}${ui.length?`<h4 class="r17s-h4">Form changes</h4><ul class="r17s-ul">${ui.map(x=>`<li>${H(x)}</li>`).join("")}</ul>`:""}${nots?`<h4 class="r17s-h4">Notifications</h4>${nots}`:""}${fx?`<h4 class="r17s-h4">Other effects (not run)</h4>${fx}`:""}`}
function testBody(){const e=R.entity(T.entity);const live=!!e;const rules=D.rules.filter(r=>r.body.type!=="choice");
 const ruleSel=sel('data-r17s-tr',T.ruleId,[["","Every active rule on this table, in order"]].concat(rules.map(r=>[r.id,r.id+" · "+r.body.name+(r.live?"":" (draft)")])));
 const entSel=sel('data-r17s-te',T.entity,R.entities().map(x=>[x.id,x.label]),T.ruleId?"disabled":"");
 const recPick=typeof PICKER!=="undefined"&&live?PICKER.html({id:"r17s_trec",label:"Record",source:recList(T.entity),value:T.recId,placeholder:"Choose a real record",noun:"records",none:"A sample (type values below)",onPick:v=>{T.recId=v||"";loadFlat();paintTest()}}):"";
 const ov=(T.flat||{id:"SAMPLE"});const keys=R.fieldList(T.entity).map(f=>f.k).filter(k=>k!=="id").slice(0,16);
 const ovs=`<details class="r17s-ov"${Object.keys(T.over).length?" open":""}><summary>Try different values (what if)</summary><div class="r17s-af">${keys.map(k=>{const f=R.fieldList(T.entity).find(x=>x.k===k);const cur=T.over[k]!==undefined?T.over[k]:ov[k];return lab(f.label,`<input class="fin" type="text" data-r17s-ov="${H(k)}" value="${H(cur==null?"":cur)}">`)}).join("")}</div></details>`;
 return `<div class="r17s-af r17s-tctl">${lab("Rule",ruleSel)}${lab("Table",entSel)}${lab("Run as if",sel('data-r17s-tt',T.trigger,trigOpts()))}<div class="r17s-fl">${recPick}</div>
  <label class="r17s-cx small"><input type="checkbox" data-r17s-tnew ${T.isNew?"checked":""}> Treat it as a new record</label>${T.ruleId&&T.ruleId===U.sel&&U.draft?`<label class="r17s-cx small"><input type="checkbox" data-r17s-tdraft ${T.useDraft?"checked":""}> Use the draft from the Editor${U.dirty?" (has unsaved edits)":""}</label>`:""}</div>
  ${ovs}<div class="row"><button type="button" class="btn primary" data-r17s-runtest>Run test (nothing is saved)</button></div><div id="r17s-tres">${resultHTML(T.res)}</div>`}
UI.test=()=>`<div class="r17s-stack"><section class="card glass r17s-c"><div class="cardhead"><div><h3>Test on a record</h3><span class="muted small">A dry run on real data: which rules fire and in what order, what would change, which messages and notifications would appear, and whether a save would be blocked. Running a test on one rule marks it as tested, which activation requires.</span></div></div><div id="r17s-tbody">${testBody()}</div></section></div>`;
function paintTest(){const el=DOC.getElementById("r17s-tbody");if(el)el.innerHTML=testBody()}
DOC.addEventListener("change",e=>{const el=e.target;if(!el.matches)return;
 if(el.matches("[data-r17s-tr]")){T.ruleId=el.value;if(T.ruleId){const r=R.get(T.ruleId);T.entity=r.body.entity;T.trigger=r.body.trigger;autoPick(r)}T.res=null;paintTest();return}
 if(el.matches("[data-r17s-te]")){T.entity=el.value;T.recId="";T.flat=null;T.over={};T.res=null;autoPick(null);paintTest();return}
 if(el.matches("[data-r17s-tt]")){T.trigger=el.value;return}
 if(el.matches("[data-r17s-tnew]")){T.isNew=el.checked;return}
 if(el.matches("[data-r17s-tdraft]")){T.useDraft=el.checked;return}
 if(el.matches("[data-r17s-ov]")){const k=el.dataset.r17sOv;const f=R.fieldList(T.entity).find(x=>x.k===k)||{};let v=el.value;if(f.type==="number"&&v!==""&&!isNaN(parseFloat(v)))v=parseFloat(v);else if(f.type==="bool")v=/^(true|yes|1)$/i.test(v);if(String(v)===String(T.flat&&T.flat[k]==null?"":T.flat&&T.flat[k]))delete T.over[k];else T.over[k]=v}});
UI.runTest=runTest;UI.testState=T;UI.paintTest=paintTest;
})();

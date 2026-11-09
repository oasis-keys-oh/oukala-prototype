/* ===== Round 15, Agent B: All budget lines (bud_lines). Every line item with filters, sort, group, column chooser,
   totals row, CSV export, sticky headers and paging (tested with a 5,000 line enterprise sample). ===== */
(function(){
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tryv=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const K=()=>window.BUDX||null;
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const D$=n=>"$"+Math.round(n).toLocaleString("en-US"),C$=n=>Math.abs(n)>=1e6?"$"+(n/1e6).toFixed(2)+"M":Math.abs(n)>=1e3?"$"+Math.round(n/1e3)+"K":"$"+Math.round(n);
const sg=v=>(v>0?"+":v<0?"−":"")+D$(Math.abs(v));
const TOWER={Labor:"IT workforce",Vendor:"Application services",Hardware:"End user and devices",Cloud:"Compute and hosting",Licences:"Applications and software"};
const COLS=[
 {k:"id",label:"Line",on:1,tok:1},{k:"n",label:"Description",on:1,wrap:1},{k:"proj",label:"Project",on:1},{k:"prog",label:"Program"},{k:"cc",label:"Cost center",on:1},{k:"unit",label:"Org unit"},{k:"tower",label:"Tower"},{k:"cat",label:"Category"},
 {k:"owner",label:"Line owner",on:1},{k:"ccOwner",label:"Cost center owner"},{k:"vendor",label:"Vendor"},{k:"color",label:"Funding color",on:1},
 {k:"appr",label:"Approved",num:1,on:1},{k:"fcst",label:"Forecast",num:1,on:1},{k:"act",label:"Actual",num:1,on:1},{k:"comm",label:"Committed",num:1,on:1},{k:"vari",label:"Variance",num:1,on:1},{k:"pct",label:"Spent",num:1,pct:1}];
const GROUPS=[["","No grouping"],["cc","Cost center"],["proj","Project"],["tower","Tower"],["owner","Line owner"],["ccOwner","Cost center owner"],["color","Funding color"],["cat","Category"],["unit","Org unit"],["vendor","Vendor"]];
const FILTERS=[["cc","Cost center"],["proj","Project"],["cat","Category"],["tower","Tower"],["owner","Line owner"],["color","Funding color"],["var","Variance"]];
const S_=S.bl=Object.assign({q:"",f:{},sort:{k:"appr",d:-1},group:"",page:0,size:50,cols:null,collapsed:{},scale:"real"},S.bl||{});
try{if(!S_.cols){const s=U.store.get("oukala.bl.cols",null);if(Array.isArray(s)&&s.length)S_.cols=s}}catch(e){}
if(!S_.cols)S_.cols=COLS.filter(c=>c.on).map(c=>c.k);
const saveCols=()=>{U.store.set("oukala.bl.cols",S_.cols)};
/* ---- rows ---- */
let REAL=null,REALKEY="";
function colorOf(id){const r=tryv(()=>BUDREQ.requests().find(x=>x.lineId===id||x.line===id&&x.st==="funded"),null);return r&&r.color?r.color:"OP-U"}
function buildReal(){const k=K();if(!k)return [];const B=k.B(),cm=window.CCMAP;
 return B.lines.map(l=>{const p=k.PJ(l.p)||{},cc=cm?cm.ccOfLine(l):null,vid=(k.LV||{})[l.id],vn=vid?tryv(()=>k.VID(vid).n,vid):"";
  return {id:l.id,real:1,n:l.n,pid:l.p,proj:(p.short||l.p),prog:k.PRG[l.p]||"",cat:l.cat,tower:TOWER[l.cat]||l.cat,cc:cc?cc.code:"Unmapped",ccn:cc?cc.name:"",unit:cc&&cc.units.length?(cc.units.length>1?cc.units[0]+" +"+(cc.units.length-1):cc.units[0]):"No org unit",owner:l.own,ccOwner:cc&&cc.owner?cc.owner:"No owner",vendor:vn||"Internal",color:colorOf(l.id),appr:l.appr,comm:l.comm,act:l.act,fcst:l.fcst}})}
function rng(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
let ENT=null;
function buildEnt(n){const r=rng(15),pick=a=>a[Math.floor(r()*a.length)],cats=Object.keys(TOWER),cms=(window.CCMAP?CCMAP.rows():[{code:"CC-4411",owner:"Elena Marsh",units:["Editorial"],name:"Editorial"}]);
 const owners=tryv(()=>DIR.filter(d=>d.kind==="human").map(d=>d.name),["Priya Shah","Dev Rao","Tom Becker"]),vend=["Internal","Lumen Data Partners","Northwind Cloud","Microsoft","Apex Print","Cobalt Security","Brightline Staffing","Contoso Cloud Operations","Fabrikam Consulting","Tailspin Analytics"],cols=["OP-U","OP-U","OP-U","OP-U","BD-C","BD-O","XR-P","CT-R"];
 const out=[];for(let i=0;i<n;i++){const cat=pick(cats),cc=pick(cms),a=Math.round((20+r()*900)*1e3/1e3)*1e3,pr=1+Math.floor(r()*120),sp=r()*.9,f=a*(.85+r()*.35);
  out.push({id:"L"+String(10000+i),real:0,n:cat+" spend, "+pick(["platform","portal","records","analytics","security","migration","support","licences","devices","integration"])+" "+(1+Math.floor(r()*40)),pid:"PX"+pr,proj:"Initiative "+String(pr).padStart(3,"0"),prog:pick(["Digital Publishing","Operational Resilience","Records and Contracts","Member Experience","Data Foundation"]),cat,tower:TOWER[cat],cc:cc.code,ccn:cc.name,unit:cc.units&&cc.units[0]||"No org unit",owner:pick(owners),ccOwner:cc.owner||"No owner",vendor:pick(vend),color:pick(cols),appr:a,comm:Math.round(a*(.5+r()*.5)),act:Math.round(a*sp),fcst:Math.round(f)})}
 return out}
function base(){if(S_.scale==="ent"){if(!ENT)ENT=buildEnt(5000);return ENT}
 const key=tryv(()=>JSON.stringify(K().B().lines.map(l=>[l.id,l.appr,l.fcst,l.act,l.comm,l.dept,l.own,l.n]))+JSON.stringify(window.CCMAP?CCMAP.rows():[]),"");if(!REAL||key!==REALKEY){REAL=buildReal();REALKEY=key}return REAL}
const derive=r=>{r.vari=r.fcst-r.appr;r.pct=r.appr?Math.round(100*r.act/r.appr):0;return r};
function filtered(){const f=S_.f,q=S_.q.trim().toLowerCase();let rows=base().map(derive);
 rows=rows.filter(r=>{for(const k of ["cc","proj","cat","tower","owner","color"])if(f[k]&&r[k]!==f[k])return false;
  if(f.var==="over"&&!(r.vari>0))return false;if(f.var==="under"&&!(r.vari<0))return false;if(f.var==="on"&&r.vari!==0)return false;
  if(q&&!(r.id+" "+r.n+" "+r.proj+" "+r.cc+" "+r.ccn+" "+r.owner+" "+r.ccOwner+" "+r.vendor+" "+r.color+" "+r.tower+" "+r.unit).toLowerCase().includes(q))return false;return true});
 const s=S_.sort;if(s){rows=rows.slice().sort((a,b)=>{const x=a[s.k],y=b[s.k];return(typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y),undefined,{numeric:true}))*s.d})}return rows}
const tot=a=>({appr:sum(a,r=>r.appr),comm:sum(a,r=>r.comm),act:sum(a,r=>r.act),fcst:sum(a,r=>r.fcst)});
/* ---- rendering ---- */
const visCols=()=>COLS.filter(c=>S_.cols.includes(c.k));
function cell(c,r){const v=r[c.k];
 switch(c.k){case"id":return r.real?`<button type="button" class="bd-n bd-row" data-bd="line:${H(r.id)}"><b>${H(r.id)}</b></button>`:`<button type="button" class="bd-n bd-row" data-bl-open="${H(r.id)}"><b>${H(r.id)}</b></button>`;
 case"n":return H(v);case"cc":return `<span class="tok" title="${H(r.ccn)}">${H(v)}</span>`;
 case"color":return `<span class="pill mute bl-col" data-c="${H(v)}">${H(v)}</span>`;
 case"vari":return v>0?`<span class="bud-bad">${sg(v)}</span>`:v<0?`<span style="color:var(--good-f)">${sg(v)}</span>`:`<span class="muted">0</span>`;
 case"pct":return v+"%";case"appr":case"fcst":case"act":case"comm":return D$(v);
 case"owner":case"ccOwner":return v==="No owner"?`<span class="pill bad">No owner</span>`:H(v);
 case"unit":return v==="No org unit"?`<span class="pill warn">No org unit</span>`:H(v);
 default:return H(v)}}
function head(){const s=S_.sort;return `<tr>${visCols().map(c=>`<th scope="col" class="${c.num?"num":""}" aria-sort="${s&&s.k===c.k?(s.d>0?"ascending":"descending"):"none"}"><button type="button" data-bl-sort="${c.k}">${H(c.label)}<span class="sar">${s&&s.k===c.k?(s.d>0?"▲":"▼"):""}</span></button></th>`).join("")}</tr>`}
function body(rows){const cols=visCols(),n=cols.length;let items=[];
 if(S_.group){const m=new Map();rows.forEach(r=>{const k=String(r[S_.group]);(m.get(k)||m.set(k,[]).get(k)).push(r)});
  [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).forEach(([k,v])=>{const t=tot(v);items.push({g:k,n:v.length,t});if(!S_.collapsed[S_.group+":"+k])v.forEach(r=>items.push({r}))})}
 else items=rows.map(r=>({r}));
 const size=S_.size,pages=Math.max(1,Math.ceil(items.length/size));if(S_.page>=pages)S_.page=pages-1;const slice=items.slice(S_.page*size,S_.page*size+size);
 const trs=slice.map(x=>{if(x.g!==undefined){const open=!S_.collapsed[S_.group+":"+x.g];return `<tr class="bl-grp"><td colspan="${n}"><button type="button" data-bl-grp="${H(x.g)}" aria-expanded="${open}"><i>${open?"▾":"▸"}</i><b>${H(x.g)}</b> <span class="muted">${U.esc(x.n)} line${x.n===1?"":"s"} · approved ${C$(x.t.appr)} · forecast ${C$(x.t.fcst)} · variance ${sg(x.t.fcst-x.t.appr)}</span></button></td></tr>`}
  return `<tr>${cols.map(c=>`<td class="${c.num?"num tabular":""} ${c.wrap?"wrap":""} ${c.tok?"tok":""}">${cell(c,x.r)}</td>`).join("")}</tr>`}).join("")||`<tr><td colspan="${n}" class="muted" style="padding:24px">No lines match. Clear a filter or the search.</td></tr>`;
 const t=tot(rows),foot=`<tr class="bl-tot">${cols.map((c,i)=>{if(i===0)return `<td><b>Total</b></td>`;if(i===1&&!c.num)return `<td class="muted">${rows.length.toLocaleString("en-US")} line${rows.length===1?"":"s"}${hasFilter()?" (filtered)":""}</td>`;
  if(c.k==="appr")return `<td class="num tabular"><b>${D$(t.appr)}</b></td>`;if(c.k==="fcst")return `<td class="num tabular"><b>${D$(t.fcst)}</b></td>`;if(c.k==="act")return `<td class="num tabular"><b>${D$(t.act)}</b></td>`;if(c.k==="comm")return `<td class="num tabular"><b>${D$(t.comm)}</b></td>`;
  if(c.k==="vari")return `<td class="num tabular"><b>${sg(t.fcst-t.appr)}</b></td>`;if(c.k==="pct")return `<td class="num tabular"><b>${t.appr?Math.round(100*t.act/t.appr):0}%</b></td>`;return `<td></td>`}).join("")}</tr>`;
 const from=items.length?S_.page*size+1:0,to=Math.min(items.length,S_.page*size+size);
 const pager=`<div class="bl-pager"><span class="muted small" aria-live="polite">${from.toLocaleString("en-US")} to ${to.toLocaleString("en-US")} of ${items.length.toLocaleString("en-US")}${S_.group?" rows and groups":" lines"}</span><span class="row"><label class="muted small">Rows <select data-bl-size aria-label="Rows per page">${[25,50,100,250].map(v=>`<option ${v===size?"selected":""}>${v}</option>`).join("")}</select></label><button class="btn quiet" data-bl-pg="-1" ${S_.page<=0?"disabled":""}>Previous</button><span class="small">Page ${S_.page+1} of ${pages}</span><button class="btn quiet" data-bl-pg="1" ${S_.page>=pages-1?"disabled":""}>Next</button></span></div>`;
 return `<div class="bl-scroll" tabindex="0" role="region" aria-label="Budget lines table"><table class="bl-t"><thead>${head()}</thead><tbody>${trs}</tbody><tfoot>${foot}</tfoot></table></div>${pager}`}
const hasFilter=()=>!!(S_.q||Object.values(S_.f).some(Boolean));
function opts(k,rows){if(k==="var")return [["over","Over approved"],["under","Under approved"],["on","On budget"]];return [...new Set(rows.map(r=>r[k]))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true})).map(v=>[v,v])}
function toolbar(){const all=base().map(derive);
 return `<div class="bl-bar"><input type="search" class="fin bl-q" data-bl-q placeholder="Search ${all.length.toLocaleString("en-US")} lines by id, project, owner, vendor" aria-label="Search budget lines" value="${H(S_.q)}">
 ${FILTERS.map(([k,l])=>`<label class="muted small bl-f">${l}<select data-bl-f="${k}" aria-label="Filter by ${l}"><option value="">All</option>${opts(k,all).map(o=>`<option value="${H(o[0])}" ${S_.f[k]===o[0]?"selected":""}>${H(o[1])}</option>`).join("")}</select></label>`).join("")}
 <label class="muted small bl-f">Group by<select data-bl-group aria-label="Group by">${GROUPS.map(g=>`<option value="${g[0]}" ${S_.group===g[0]?"selected":""}>${g[1]}</option>`).join("")}</select></label>
 <details class="bl-cols"><summary class="btn quiet">Columns (${S_.cols.length})</summary><div class="bl-colpop glass" role="group" aria-label="Choose columns">${COLS.map(c=>`<label><input type="checkbox" data-bl-col="${c.k}" ${S_.cols.includes(c.k)?"checked":""}> ${H(c.label)}</label>`).join("")}<div class="row"><button type="button" class="btn quiet" data-bl-colreset>Reset</button></div></div></details>
 <button type="button" class="btn quiet" data-bl-clear>Clear filters</button><button type="button" class="btn" data-bl-csv>Export CSV</button></div>`}
function view(){const k=K();if(!k)return `<div class="screen">${hero("Budgets","All budget lines","The budget module is not loaded.","")}</div>`;const rows=filtered(),t=tot(rows);
 return `<div class="screen">${hero("Budgets · every line item","All budget lines",`<b>${rows.length.toLocaleString("en-US")}</b> line${rows.length===1?"":"s"}: approved <b>${C$(t.appr)}</b>, forecast <b>${C$(t.fcst)}</b>, actual <b>${C$(t.act)}</b>, committed <b>${C$(t.comm)}</b>, variance <b>${sg(t.fcst-t.appr)}</b>. Select a line id to open the line.`,
  `<div class="row"><button class="btn primary" data-bud-req-new>Request budget</button><button class="btn" data-go="bud_over">Budget home</button><button class="btn" data-go="bud_ccmap">Cost center mapping</button><label class="bl-scale"><input type="checkbox" data-bl-scale ${S_.scale==="ent"?"checked":""}> Enterprise scale sample (5,000 lines)</label></div>`)}
  ${S_.scale==="ent"?`<div class="lensnote glass" style="gap:8px"><b>Sample data</b><span class="muted small">5,000 generated lines to test filtering, grouping and paging at enterprise size. These are not Atlantic Systems' budget lines.</span></div>`:""}
  ${card("Budget lines","Filter, sort, group and choose columns. Totals follow the filter. Export gives the filtered lines as CSV.",`<div class="bl-wrap">${toolbar()}<div data-bl-tbl>${body(rows)}</div></div>`)}</div>`}
/* PR-32 B5: under a tenant other than Atlantic Systems this screen is drawn from the tenant's rows only (DATA.get), through the shared
   tenant view kit FIN.tv (mod_plat_fin); a view with no rows of its own is a labeled gap (R18). Atlantic Systems renders as before. */
DATA.screen("bud_lines",{mode:"data",entities:["budget_lines","projects"],note:"mod_r15b_lines (PR-32 B5)"});
REG("bud_lines","All budget lines","portfolio","M4 6h16M4 10h16M4 14h16M4 18h10",()=>{const v=window.FIN&&FIN.tv;if(!v||!v.TEN())return view();const L=v.L();
 return v.Sc("bud_lines","Budgets: All budget lines",L.length?`${L.length} lines: approved ${money(sum(L,l=>+l.appr||0))}, forecast ${money(sum(L,l=>+l.fcst||0))}. Sample figures, simulated.`:"No budget lines in this sample company yet.",[["Lines",()=>v.lines("Budget lines",L.length+" in this sample company",L)]])});
function paint(){const el=document.querySelector("[data-bl-tbl]");if(!el)return render();const rows=filtered();el.innerHTML=body(rows);const h=document.querySelector(".hero .story");if(h){const t=tot(rows);h.innerHTML=`<b>${rows.length.toLocaleString("en-US")}</b> line${rows.length===1?"":"s"}: approved <b>${C$(t.appr)}</b>, forecast <b>${C$(t.fcst)}</b>, actual <b>${C$(t.act)}</b>, committed <b>${C$(t.comm)}</b>, variance <b>${sg(t.fcst-t.appr)}</b>. Select a line id to open the line.`}}
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-bl-sort]")){const k=t.dataset.blSort;S_.sort=S_.sort&&S_.sort.k===k?{k,d:-S_.sort.d}:{k,d:COLS.find(c=>c.k===k).num?-1:1};S_.page=0;paint();return}
 if(t=e.target.closest("[data-bl-pg]")){S_.page=Math.max(0,S_.page+(+t.dataset.blPg));paint();const s=document.querySelector(".bl-scroll");if(s)s.scrollTop=0;return}
 if(t=e.target.closest("[data-bl-grp]")){const key=S_.group+":"+t.dataset.blGrp;S_.collapsed[key]=!S_.collapsed[key];paint();return}
 if(t=e.target.closest("[data-bl-clear]")){S_.q="";S_.f={};S_.page=0;render();return}
 if(t=e.target.closest("[data-bl-colreset]")){S_.cols=COLS.filter(c=>c.on).map(c=>c.k);saveCols();render();return}
 if(t=e.target.closest("[data-bl-csv]")){const rows=filtered(),cols=visCols();window.R15B&&R15B.csv("budget-lines",cols.map(c=>c.label),rows.map(r=>cols.map(c=>r[c.k])));return}
 if(t=e.target.closest("[data-bl-open]")){lineDrawer(t.dataset.blOpen);return}
 if(t=e.target.closest("[data-bud-req-new]")){if(window.BUDREQ&&BUDREQ.openForm)BUDREQ.openForm();return}});
document.addEventListener("input",e=>{const t=e.target.closest("[data-bl-q]");if(!t)return;S_.q=t.value;S_.page=0;clearTimeout(S_._t);S_._t=setTimeout(paint,120)});
document.addEventListener("change",e=>{let t;
 if(t=e.target.closest("[data-bl-f]")){S_.f[t.dataset.blF]=t.value;S_.page=0;paint();return}
 if(t=e.target.closest("[data-bl-group]")){S_.group=t.value;S_.page=0;paint();return}
 if(t=e.target.closest("[data-bl-size]")){S_.size=+t.value;S_.page=0;paint();return}
 if(t=e.target.closest("[data-bl-scale]")){S_.scale=t.checked?"ent":"real";S_.f={};S_.page=0;render();return}
 if(t=e.target.closest("[data-bl-col]")){const k=t.dataset.blCol;S_.cols=COLS.filter(c=>c.k===k?t.checked:S_.cols.includes(c.k)).map(c=>c.k);if(!S_.cols.length)S_.cols=["id"];saveCols();const d=document.querySelector(".bl-cols"),open=d&&d.open;paint();const th=document.querySelector(".bl-cols summary");if(th)th.textContent="Columns ("+S_.cols.length+")";return}});
function lineDrawer(id){const r=base().find(x=>x.id===id);if(!r)return;derive(r);
 openDrawer(`<h3 class="ftitle">${H(r.id)} · ${H(r.n)}</h3><dl class="kv"><dt>Project</dt><dd>${H(r.proj)} (${H(r.prog)})</dd><dt>Cost center</dt><dd>${H(r.cc)} ${H(r.ccn)}</dd><dt>Org unit</dt><dd>${H(r.unit)}</dd><dt>Line owner</dt><dd>${r.owner?ownerChip(r.owner,{role:"Owner"}):""}</dd><dt>Cost center owner</dt><dd>${H(r.ccOwner)}</dd><dt>Tower</dt><dd>${H(r.tower)}</dd><dt>Vendor</dt><dd>${H(r.vendor)}</dd><dt>Funding color</dt><dd>${H(r.color)}</dd><dt>Approved</dt><dd class="tabular">${D$(r.appr)}</dd><dt>Committed</dt><dd class="tabular">${D$(r.comm)}</dd><dt>Actual</dt><dd class="tabular">${D$(r.act)}</dd><dt>Forecast</dt><dd class="tabular">${D$(r.fcst)}</dd><dt>Variance</dt><dd class="tabular">${sg(r.vari)}</dd></dl><p class="small muted">Sample line generated for the scale test.</p>`)}
/* ---- metric, process model ---- */
Object.assign(METRICS,{m_bl_over:{n:"Budget lines forecast above approved",f:"Lines whose forecast at completion is above approved ÷ all budget lines × 100",u:"%",cur:47,tgt:25,badAt:50,dir:"min",max:100,tr:[30,34,38,41,41,44,47,47],owner:"Victor Amaya",use:["All budget lines"],rem:{kind:"sop",ref:"SOP-BL1",title:"Review lines over approved and decide: absorb, reserve or reforecast",agent:"",auto:false,state:"idle",prog:""}}});
function syncM(){const m=METRICS.m_bl_over,L=tryv(()=>K().B().lines,[]);if(!m||!L.length)return;const v=Math.round(100*L.filter(l=>l.fcst>l.appr).length/L.length);m.cur=v;m.tr=m.tr.slice(0,7).concat([v])}
syncM();
if(typeof PROC!=="undefined")PROC.reg("bud_lines",{title:"Review the full budget line by line",std:["tbm"],steps:[
 {n:"Open all budget lines",d:"One click from the budget home. Every line with approved, forecast, actual, committed, variance, owner, cost center, project, vendor and funding color.",who:"human",owner:"Budget owner",sla:"Instant",in:"Budget lines",out:"Line list"},
 {n:"Filter, group and sort",d:"Group by cost center, project, tower, owner or funding color; totals follow the filter.",who:"human",owner:"Budget owner",sla:"Instant",in:"Line list",out:"Focused view"},
 {n:"Drill into a line",d:"Open the line to see its story, reserve draws and invoices; edit it or reforecast.",who:"human",owner:"Line owner",sla:"Instant",in:"Focused view",out:"Line decision"},
 {n:"Export and share",d:"CSV of the filtered lines for finance and the audit trail records the export.",who:"robot",owner:"Finance systems",sla:"Instant",in:"Focused view",out:"CSV, audit entry"}]});
/* ---- API, wiring ---- */
window.BUDLINES={rows:()=>filtered(),all:()=>base().map(derive),state:()=>S_,columns:()=>COLS.map(c=>c.k)};
const W={};
function wire(){try{
 if(window.NAVX&&NAVX.add&&!W.nav){NAVX.add("bud_lines",{group:"money",label:"All budget lines",hint:"Every line item with filters, grouping and export",sub:"Budgets and funding",kw:"all budget lines line items full budget detail list export csv approved forecast actual committed variance owner cost center vendor funding color tower"});W.nav=1}
 if(!W.ent&&window.COVER&&COVER.recs){if(!COVER.recs.some(x=>x.key==="BUDLINES"))COVER.recs.push({key:"BUDLINES",label:"All budget lines view",scr:["bud_lines"],mod:"bud_lines",n:17,ent:"budget_line",how:"direct",path:"S.bud.lines"});W.ent=1}
 if(!W.mod&&W.ent&&window.MODMAP&&MODMAP.addModule&&tryv(()=>MODMAP.modules.some(m=>m.id==="bud_over")&&MODMAP.modules.some(m=>m.id==="bud_ccmap"),false)){
  const band=tryv(()=>MODMAP.modules.find(m=>m.id==="bud_over").band,"fin");
  const r=MODMAP.addModule({id:"bud_lines",name:"All budget lines",sn:"All budget lines",band,own:"Victor Amaya",proposed:false,r:["budget_line","cost_center","project","person"],w:["audit_event"],
   flows:[{dir:"pull",other:"bud_over",data:"Every budget line with approved, forecast, actual and committed",entity:"budget_line",mode:"api",trig:"Screen opened"},{dir:"pull",other:"bud_ccmap",data:"Cost center, org unit and owner for each line",entity:"cost_center",mode:"api",trig:"Screen opened"},
    {dir:"push",other:"adm_audit",data:"Export events",entity:"audit_event",mode:"event",trig:"CSV export"}]});
  if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.mod=1}

 if(!W.proc&&W.mod&&window.PROCLIB&&PROCLIB.addProcess){const s0=PROC.defs.bud_lines.steps;
  const r=PROCLIB.addProcess({id:"budget_line_review",name:"Review the full budget line by line",module:"bud_lines",family:"fin",owner:"Victor Amaya",backup:"Avery Chen",trigger:"Monthly forecast review or a question about where the money is",std:["tbm"],
   steps:s0.map((x,i)=>({n:x.n,d:x.d+(i===0?" RACI: Responsible budget owner, Accountable controller, Consulted finance, Informed portfolio office.":""),who:x.who,owner:x.owner,sla:x.sla,in:x.in,out:x.out})),
   inputs:["Budget lines","Cost center mapping","Funding colors"],outputs:["Filtered line list","CSV export","Audit entry"],entities:["budget_line","cost_center"],metrics:["m_bl_over","m_cc_cov"],model:"cmmi"});
  if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))W.proc=1;window.BUDLINES.procWarn=r&&r.warnings}
 }catch(e){console.error("budlines wire",e)}if(W.mod&&W.proc&&!W.ref&&window.MODMAP&&MODMAP.refresh){W.ref=1;tryv(()=>MODMAP.refresh())}}
window.BUDLINES.wire=wire;[700,2200,4500,8500].forEach(t=>setTimeout(wire,t));
if(typeof SEARCHX!=="undefined")SEARCHX.push(()=>[{g:"Budgets",t:"All budget lines",m:"Every line item: filter, group, export",c:"--accent",f:()=>go("bud_lines"),k:"all budget lines line items full budget list detail export csv"}]);
if(typeof ASKX!=="undefined")ASKX.push(q=>{const t=String(q||"").toLowerCase();if(/(all|every|full|whole).*(budget lines?|line items?)|budget line items|view the full budget/.test(t)){go("bud_lines");say(q,{t:"Opened <b>All budget lines</b>: "+base().length+" lines with filters, grouping, column chooser and CSV export.",steps:["Opened All budget lines"]});return true}return false});
})();

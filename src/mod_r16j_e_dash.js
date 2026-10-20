/* ===== Round 16, Agent J: dashboard layout engine for every dashboard-type screen. window.DASHX
   Edit mode (drag to reorder, resize in 12-column grid steps, hide or show, add from a library of saved charts, metrics and reports, remove),
   a personal layout per user saved to STORE, Reset to default, and Publish as default (scope: everyone, role or team) gated by a permission
   (executives and platform admins), with version history, diff and approval by a group for the "dashboard default change" process.
   Tiles are discovered from the rendered screen; nothing changes on a screen until someone customizes it or a default is published. ===== */
(function(){
const W=window;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const H=U.esc;
const slug=s=>String(s||"").toLowerCase().replace(/[0-9$%.,]+/g," ").replace(/[^a-z]+/g,"-").replace(/^-+|-+$/g,"").slice(0,32);
const D=S.r16d=S.r16d||{edit:false,work:null,mine:{},defs:{},hist:{},pend:[],charts:null,seq:1,perm:{publish:["admin","exec"],team:["admin","exec","portfolio"]},group:{name:"Dashboard governance group",members:["Avery Chen","Maya Ortiz","Jordan Lee"],owner:"Jordan Lee",backup:"Maya Ortiz"},seen:{},loaded:false,log:[]};
const me=()=>G(()=>INBOX.me(),"Casey Rowan");
const roleId=u=>G(()=>GUARD.roleOf(u||me()).id,"exec");
const roleName=u=>G(()=>GUARD.roleOf(u||me()).n,"Executive");
const myTeam=u=>{u=u||me();return G(()=>(DIR.find(d=>d.name===u)||{}).team,"")||G(()=>CCMAP.unitOfPerson(u),"")||""};
const now=()=>new Date().toISOString().slice(0,16).replace("T"," ");
const emit=(id,p)=>G(()=>W.EVENTS&&EVENTS.emit(id,p||{},{source:"r16j_dash",actor:me()}));
const audit_=(a,b)=>G(()=>audit(a,b));
/* ---------- persistence (STORE when the entity is defined, memory always) ---------- */
const PEND=[];let ftimer=0;
const schemaOK=en=>G(()=>!!(DATAMODEL.tables[en]&&DATAMODEL.tables[en].fields&&DATAMODEL.tables[en].fields.length),false);
function sput(en,rec){const clean={};Object.keys(rec).forEach(k=>{const v=rec[k];clean[k]=typeof v==="object"&&v!==null?JSON.stringify(v):v});
 if(W.STORE&&STORE.put&&schemaOK(en)){G(()=>STORE.put(en,clean));return}PEND.push([en,clean]);if(!ftimer){let n=0;ftimer=setInterval(()=>{n++;if(W.STORE&&STORE.put&&PEND.length&&PEND.every(p=>schemaOK(p[0]))||n>12){while(PEND.length){const p=PEND.shift();if(schemaOK(p[0]))G(()=>STORE.put(p[0],p[1]))}clearInterval(ftimer);ftimer=0}},2500)}}
function sdel(en,id){G(()=>schemaOK(en)&&STORE.delete&&STORE.delete(en,id))}
function hydrate(){if(D.loaded)return;D.loaded=true;
 G(()=>{(STORE.all("dashboard_layout")||[]).forEach(r=>{try{const u=r.user,sc=r.screen;D.mine[u]=D.mine[u]||{};D.mine[u][sc]=Object.assign(JSON.parse(r.body),{v:r.version,at:r.updated})}catch(e){}})});}
G(()=>W.STORE&&STORE.onHydrate&&STORE.onHydrate(()=>{D.loaded=false;hydrate()}));
/* ---------- layout model ---------- */
const blank=()=>({order:{},hidden:[],span:{},added:[]});
const clone=o=>JSON.parse(JSON.stringify(o||blank()));
function scopeMatch(v,user){if(v.scope==="everyone")return true;if(v.scope==="role")return v.value===roleId(user);if(v.scope==="team")return v.value===myTeam(user);return false}
const SPEC={team:3,role:2,everyone:1};
function defaultFor(screen,user){const hs=(D.hist[screen]||[]).filter(v=>v.status==="active"&&scopeMatch(v,user));hs.sort((a,b)=>SPEC[b.scope]-SPEC[a.scope]||b.n-a.n);return hs[0]||null}
function effective(screen,user){user=user||me();hydrate();const mine=(D.mine[user]||{})[screen];if(mine)return {src:"personal",layout:mine,v:mine.v||1,def:defaultFor(screen,user)};const d=defaultFor(screen,user);if(d)return {src:"default",layout:d.layout,v:d.n,def:d,label:d.scope==="everyone"?"everyone":d.scope+" "+d.value};return {src:"built-in",layout:blank(),v:0}}
const isEmpty=l=>!l||(!Object.keys(l.order||{}).length&&!(l.hidden||[]).length&&!Object.keys(l.span||{}).length&&!(l.added||[]).length);
/* ---------- tile discovery ---------- */
const TILE=":scope>.card,:scope>section.card,:scope>.glass,:scope>.grid,:scope>.statrow,:scope>.kpis,:scope>.kpirow,:scope>.split,:scope>.tile,:scope>article,:scope>.panel";
const SKIP=".hero,.views,.vsw,.r16-pha,#r16Pha,.dl-bar,.lensnote,.dl-ui,.hint,.nx-ph,.ownx-slot";
function paneOf(sc){const v=sc.querySelector(":scope>.views[data-views]");if(!v)return null;const ins=[...v.querySelectorAll(":scope>input[type=radio]")];const i=ins.findIndex(x=>x.checked);const panes=v.querySelector(":scope>.panes");return panes&&panes.children[i<0?0:i]||null}
function discover(){const sc=document.querySelector("#view>.screen")||document.querySelector("#view .screen");if(!sc)return null;const out=[];let n=0;
 const add=(el,ck,depth)=>{const tiles=[...el.children].filter(c=>c.matches(TILE.replace(/:scope>/g,""))&&!c.matches(SKIP)&&c.offsetParent!==null||c.classList&&c.classList.contains("dl-hid")&&c.matches(TILE.replace(/:scope>/g,"")));
  if(tiles.length<(depth?2:1))return;const used=new Set();const list=tiles.map((t,i)=>{let h=(t.querySelector(":scope h2,:scope h3,:scope h4,:scope .cardhead h3,:scope .lbl,:scope .eyebrow,:scope .tl")||{}).textContent;let k=ck+":"+(slug(h)||"tile"+i);let u=k,j=2;while(used.has(u))u=k+"-"+j++;used.add(u);return {el:t,key:u,title:(h||"Tile "+(i+1)).trim().slice(0,60)}});
  out.push({el,ck,tiles:list,depth});n+=list.length;
  list.forEach(t=>{if(depth<1&&t.el.matches(".grid,.statrow,.kpis,.kpirow,.split"))add(t.el,t.key,depth+1)})};
 add(sc,"root",0);const pane=paneOf(sc);if(pane){const ck="pane"+[...pane.parentElement.children].indexOf(pane);add(pane,ck,0)}
 return {sc,conts:out,count:out.reduce((a,c)=>a+(c.depth?0:c.tiles.length),0)+out.filter(c=>c.depth).reduce((a,c)=>a+c.tiles.length,0)}}
/* ---------- apply ---------- */
function cols(c){if(c.el.dataset.dlCols)return +c.el.dataset.dlCols;const cs=getComputedStyle(c.el);let n=0;if(cs.display==="grid")n=cs.gridTemplateColumns.split(" ").filter(x=>x).length;else if(cs.display==="flex"&&c.depth)n=Math.min(c.tiles.length,6);if(!n)n=1;c.el.dataset.dlCols=n;return n}
function activeLayout(screen){if(D.edit&&D.work&&D.work.screen===screen)return D.work.layout;return effective(screen).layout}
function applyLayout(){const scr=S.screen;if(!scr||scr==="r16j_dash")return;const d=discover();if(!d)return;document.querySelectorAll(".dl-added,.dl-bar,.dl-tb").forEach(x=>x.remove());
 const info=D.seen[scr]={count:d.count,conts:d.conts.length};const lay=activeLayout(scr),ed=D.edit&&D.work&&D.work.screen===scr;
 /* added tiles go to the root container */
 const root=d.conts.find(c=>c.ck==="root");(lay.added||[]).forEach(a=>{if(!root)return;const el=document.createElement("section");el.className="card glass dl-added";el.dataset.dlKey=a.key;el.innerHTML=addedHTML(a);root.el.appendChild(el);root.tiles.push({el,key:a.key,title:a.title||a.key,added:a})});
 d.conts.forEach(c=>{const custom=!isEmpty(lay)||ed;const order=lay.order[c.ck];if(!custom){c.tiles.forEach(t=>{t.el.classList.remove("dl-hid")});return}
  const n=c.depth?cols(c):1;const base=c.depth?Math.max(1,Math.floor(12/n)):12;
  c.el.classList.add("dl-grid");c.el.dataset.dlC=c.ck;
  const idx=k=>{const i=order?order.indexOf(k):-1;return i<0?9000:i};const sorted=c.tiles.map((t,i)=>({t,i})).sort((a,b)=>idx(a.t.key)-idx(b.t.key)||a.i-b.i);
  sorted.forEach((s,i)=>{const t=s.t,el=t.el;el.dataset.dlKey=t.key;el.dataset.dlTile="1";el.style.order=i;const sp=lay.span[t.key]||(c.depth?base:(el.matches(".grid,.statrow,.kpis,.kpirow,.split")?12:12));el.style.gridColumn="span "+sp;el.dataset.dlSpan=sp;
   const hid=(lay.hidden||[]).includes(t.key);el.classList.toggle("dl-hid",hid&&!ed);el.classList.toggle("dl-ghost",hid&&ed);
   if(ed){el.classList.add("dl-edit");el.draggable=true;el.insertAdjacentHTML("afterbegin",tbHTML(t,c,i,sorted.length,sp,hid))}else{el.classList.remove("dl-edit","dl-ghost");el.draggable=false}});
  c.sorted=sorted});
 /* non tile children (hero, tabs) keep full width */
 d.conts.filter(c=>!c.depth).forEach(c=>[...c.el.children].forEach(ch=>{if(!ch.dataset.dlTile&&c.el.classList.contains("dl-grid")){ch.style.gridColumn="1 / -1";ch.style.order="-1"}}));
 if(ed)d.sc.querySelector(":scope>.hero")?d.sc.querySelector(":scope>.hero").insertAdjacentHTML("afterend",barHTML(scr,lay,d)):d.sc.insertAdjacentHTML("afterbegin",barHTML(scr,lay,d));
 slotButton(scr,info.count>=3,d)}
const STEPS=[3,4,6,8,12];
function tbHTML(t,c,i,n,sp,hid){const k=H(t.key),cc=H(c.ck);return `<div class="dl-tb dl-ui" role="toolbar" aria-label="Tile controls: ${H(t.title)}"><span class="dl-grip" title="Drag to reorder" aria-hidden="true">⠿</span><b class="dl-tt">${H(t.title)}</b><button type="button" data-dl="up" data-k="${k}" data-c="${cc}" aria-label="Move ${H(t.title)} earlier" ${i?"":"disabled"}>↑</button><button type="button" data-dl="down" data-k="${k}" data-c="${cc}" aria-label="Move ${H(t.title)} later" ${i<n-1?"":"disabled"}>↓</button><button type="button" data-dl="narrow" data-k="${k}" data-c="${cc}" aria-label="Narrower">◀</button><span class="dl-sp" aria-label="Width ${sp} of 12">${sp}/12</span><button type="button" data-dl="wide" data-k="${k}" data-c="${cc}" aria-label="Wider">▶</button><button type="button" data-dl="hide" data-k="${k}" data-c="${cc}" aria-pressed="${!!hid}">${hid?"Show":"Hide"}</button>${t.added?`<button type="button" data-dl="remove" data-k="${k}" class="dl-rm">Remove</button>`:""}</div>`}
function barHTML(scr,lay,d){const ef=effective(scr);const hidden=(lay.hidden||[]);const can=canPublish();
 return `<div class="dl-bar dl-ui" role="toolbar" aria-label="Customize this dashboard"><b>Customizing this dashboard</b><span class="muted small">${ef.src==="personal"?"Your layout":ef.src==="default"?"Default for "+H(ef.label):"Built-in layout"}${hidden.length?" · "+hidden.length+" hidden":""}. Drag a tile or use the arrows. Widths are in 12-column steps.</span><span class="dl-sp2"></span>
 <button type="button" class="btn" data-dl="add">Add from library</button>${hidden.length?`<button type="button" class="btn" data-dl="unhide">Show hidden (${hidden.length})</button>`:""}<button type="button" class="btn" data-dl="reset" ${ef.src==="personal"||!isEmpty(lay)?"":"disabled"}>Reset to default</button><button type="button" class="btn" data-dl="hist">Version history</button><button type="button" class="btn" data-dl="publish" ${can.any?"":"disabled"} title="${can.any?"":"Executives and platform admins can publish defaults"}">Publish as default…</button><button type="button" class="btn quiet" data-dl="cancel">Cancel</button><button type="button" class="btn primary" data-dl="save">Save my layout</button></div>`}
/* the Customize button lives in the page-header actions slot (right aligned, same place on every screen) */
function slotButton(scr,ok,d){document.querySelectorAll("[data-dl-open]").forEach(x=>x.remove());if(!ok||D.edit&&D.work&&D.work.screen===scr)return;
 const v=document.getElementById("view");let slot=document.getElementById("r16Pha");if(!slot&&v){slot=document.createElement("div");slot.id="r16Pha";slot.className="r16-pha";slot.setAttribute("role","group");slot.setAttribute("aria-label","Page actions");v.insertBefore(slot,v.firstChild)}
 if(!slot)return;const ef=effective(scr);const b=document.createElement("button");b.type="button";b.className="btn quiet dl-open";b.dataset.dlOpen="1";b.setAttribute("aria-label","Customize this dashboard layout");b.innerHTML=`Customize${ef.src==="personal"?' <span class="pill info">Mine</span>':ef.src==="default"?' <span class="pill mute">Default</span>':""}`;slot.insertBefore(b,slot.firstChild);
 const pend=(D.pend||[]).filter(p=>p.screen===scr&&p.status==="pending").length;if(pend){b.insertAdjacentHTML("beforeend",` <span class="pill warn">${pend} pending</span>`)}}
/* ---------- permission ---------- */
function canPublish(scope,user){user=user||me();const r=roleId(user);const any=D.perm.publish.includes(r);const team=D.perm.team.includes(r);return {any:any||team,everyone:any,role:any,team:team,role_id:r,why:any||team?"":roleName(user)+" cannot publish dashboard defaults"}}
G(()=>{if(W.GUARD&&GUARD.actions&&!GUARD.actions["dashboard.publish"])GUARD.actions["dashboard.publish"]={n:"Publish a dashboard default",any:["config","approve"]}});
/* ---------- editing ---------- */
function startEdit(){const scr=S.screen;D.edit=true;D.work={screen:scr,layout:clone(effective(scr).layout),base:clone(effective(scr).layout)};applyLayout();G(()=>announce("Customizing the layout. Drag tiles or use the arrow buttons."))}
function announce(t){let n=document.getElementById("dlLive");if(!n){n=document.createElement("div");n.id="dlLive";n.className="sr";n.setAttribute("aria-live","polite");document.body.appendChild(n)}n.textContent=t}
function contTiles(ck){const d=discover();const c=d&&d.conts.find(x=>x.ck===ck);return c?c.sorted?c.sorted.map(s=>s.t):c.tiles:[]}
function curOrder(ck){const d=discover();const c=d.conts.find(x=>x.ck===ck);const lay=D.work.layout;const order=lay.order[ck];const idx=k=>{const i=order?order.indexOf(k):-1;return i<0?9000:i};return c.tiles.map((t,i)=>({k:t.key,i})).sort((a,b)=>idx(a.k)-idx(b.k)||a.i-b.i).map(x=>x.k)}
function move(ck,k,dir){const o=curOrder(ck);const i=o.indexOf(k),j=i+dir;if(i<0||j<0||j>=o.length)return;o.splice(j,0,o.splice(i,1)[0]);D.work.layout.order[ck]=o;applyLayout();const el=document.querySelector(`[data-dl-key="${CSS.escape(k)}"] [data-dl="${dir<0?"up":"down"}"]`);if(el)el.focus();announce("Moved to position "+(j+1))}
function drop(ck,from,to){const o=curOrder(ck);const i=o.indexOf(from),j=o.indexOf(to);if(i<0||j<0||i===j)return;o.splice(j,0,o.splice(i,1)[0]);D.work.layout.order[ck]=o;applyLayout()}
function resize(k,dir){const el=document.querySelector(`[data-dl-key="${CSS.escape(k)}"]`);const cur=+(el&&el.dataset.dlSpan)||12;let i=STEPS.findIndex(s=>s>=cur);if(i<0)i=STEPS.length-1;i=Math.max(0,Math.min(STEPS.length-1,i+dir));D.work.layout.span[k]=STEPS[i];applyLayout();const b=document.querySelector(`[data-dl-key="${CSS.escape(k)}"] [data-dl="${dir<0?"narrow":"wide"}"]`);if(b)b.focus()}
function savePersonal(){const w=D.work;if(!w)return;const u=me();const lay=clone(w.layout);const prev=(D.mine[u]||{})[w.screen];lay.v=(prev&&prev.v||0)+1;lay.at=now();
 if(isEmpty(lay)){delete (D.mine[u]||{})[w.screen];sdel("dashboard_layout",u+"|"+w.screen)}else{D.mine[u]=D.mine[u]||{};D.mine[u][w.screen]=lay;sput("dashboard_layout",{id:u+"|"+w.screen,user:u,screen:w.screen,body:{order:lay.order,hidden:lay.hidden,span:lay.span,added:lay.added},scope:"personal",version:lay.v,updated:lay.at})}
 emit("dashboard.layout_saved",{screen:w.screen,user:u,version:lay.v});audit_("saved personal dashboard layout",w.screen+" · "+u);D.edit=false;D.work=null;G(()=>toast("Your layout for this dashboard is saved","good"));render()}
function resetMine(){const w=D.work,scr=w?w.screen:S.screen,u=me();delete (D.mine[u]||{})[scr];sdel("dashboard_layout",u+"|"+scr);D.edit=false;D.work=null;emit("dashboard.layout_reset",{screen:scr,user:u});audit_("reset dashboard layout to default",scr);G(()=>toast("Back to the default layout","good"));render()}
/* ---------- diff and versions ---------- */
function diff(a,b){a=a||blank();b=b||blank();const out=[];const A=new Set(Object.values(a.order||{}).flat()),B=new Set(Object.values(b.order||{}).flat());
 Object.keys(Object.assign({},a.order,b.order)).forEach(ck=>{const x=(a.order||{})[ck]||[],y=(b.order||{})[ck]||[];x.forEach((k,i)=>{const j=y.indexOf(k);if(j>=0&&j!==i)out.push(["~","Moved "+label(k)+" from position "+(i+1)+" to "+(j+1)])});y.forEach(k=>{if(!x.includes(k)&&(a.order||{})[ck])out.push(["+","Placed "+label(k)])})});
 (b.hidden||[]).filter(k=>!(a.hidden||[]).includes(k)).forEach(k=>out.push(["-","Hidden "+label(k)]));(a.hidden||[]).filter(k=>!(b.hidden||[]).includes(k)).forEach(k=>out.push(["+","Shown "+label(k)]));
 Object.keys(Object.assign({},a.span,b.span)).forEach(k=>{if((a.span||{})[k]!==(b.span||{})[k])out.push(["~","Resized "+label(k)+" "+((a.span||{})[k]||"auto")+" to "+((b.span||{})[k]||"auto")+" of 12"])});
 (b.added||[]).filter(x=>!(a.added||[]).some(y=>y.key===x.key)).forEach(x=>out.push(["+","Added "+x.title]));(a.added||[]).filter(x=>!(b.added||[]).some(y=>y.key===x.key)).forEach(x=>out.push(["-","Removed "+x.title]));
 return out}
const label=k=>String(k).replace(/^[^:]*:/,"").replace(/^add:[a-z]+:/,"").replace(/-/g," ").replace(/\b\w/,c=>c.toUpperCase());
function publish(scr,layout,scope,value,note){const p=canPublish();if(!p.any||(scope==="everyone"&&!p.everyone)||(scope==="role"&&!p.role)||(scope==="team"&&!p.team)){audit_("Denied: publish dashboard default",me()+" · "+roleName());G(()=>toast(p.why||"Your role cannot publish this scope","bad"));return null}
 const hs=D.hist[scr]=D.hist[scr]||[];const n=(hs[0]?hs[0].n:0)+1;const prev=defaultFor(scr,me());
 const v={id:"DD-"+scr+"-"+n,screen:scr,n,scope,value:value||"",layout:clone(layout),by:me(),at:now(),note:note||"",diff:diff(prev?prev.layout:blank(),layout),status:scope==="everyone"?"pending":"active",group:D.group.name};
 hs.unshift(v);if(v.status==="pending")D.pend.unshift(v);else v.approved="Pre-approved by policy: "+scope+" scope";
 sput("dashboard_default",{id:v.id,screen:scr,scope:scope,scope_value:v.value,body:v.layout,version:n,status:v.status,by:v.by,approver_group:D.group.name,note:v.note});
 emit("dashboard.default_proposed",{screen:scr,version:n,scope});audit_("proposed dashboard default",scr+" v"+n+" · "+scope+(v.value?" "+v.value:""));
 G(()=>toast(v.status==="pending"?"Sent to "+D.group.name+" for approval":"Published to "+scope+(v.value?" "+v.value:""),"good"));return v}
function decide(id,ok){let v=null;Object.values(D.hist).forEach(hs=>hs.forEach(x=>{if(x.id===id)v=x}));if(!v||v.status!=="pending")return;const u=me();
 if(!D.group.members.includes(u)){G(()=>toast("Only members of "+D.group.name+" can decide","bad"));audit_("Denied: decide dashboard default",u);return}
 if(v.by===u){G(()=>toast("You proposed this change; another group member must decide (separation of duties)","bad"));return}
 v.status=ok?"active":"rejected";v.approved=ok?"Approved by "+u+" for "+D.group.name+" on "+now():"";v.decidedBy=u;v.decidedAt=now();D.pend=D.pend.filter(x=>x.id!==id);
 if(ok)(D.hist[v.screen]||[]).forEach(x=>{if(x!==v&&x.status==="active"&&x.scope===v.scope&&x.value===v.value)x.status="superseded"});
 sput("dashboard_default",{id:v.id,screen:v.screen,scope:v.scope,scope_value:v.value,body:v.layout,version:v.n,status:v.status,by:v.by,approver_group:D.group.name,note:v.note});
 emit(ok?"dashboard.default_approved":"dashboard.default_rejected",{screen:v.screen,version:v.n});audit_((ok?"approved":"rejected")+" dashboard default",v.screen+" v"+v.n);G(()=>toast(ok?"Default is live for everyone":"Change rejected","good"));render()}
/* ---------- drawers ---------- */
function histDrawer(scr){const hs=D.hist[scr]||[];const mine=(D.mine[me()]||{})[scr];
 openDrawer(`<div class="eyebrow">Dashboard layout</div><h2 style="font-size:24px;margin:6px 0">Version history: ${H(scrName(scr))}</h2><p class="muted small">${hs.length?hs.length+" published version"+(hs.length>1?"s":""):"No default has been published; everyone sees the built-in layout."}${mine?" You have a personal layout (v"+mine.v+") which overrides defaults for you.":""}</p>
 ${hs.map(v=>`<div class="dl-ver"><div class="row"><b>v${U.esc(v.n)}</b><span class="pill ${v.status==="active"?"good":v.status==="pending"?"warn":v.status==="rejected"?"bad":"mute"}">${H(v.status)}</span><span class="pill info">${H(v.scope==="everyone"?"Everyone":v.scope+": "+v.value)}</span><span class="muted small">${H(v.by)} · ${H(v.at)}</span></div>${v.note?`<p>${H(v.note)}</p>`:""}<ul class="dl-diff">${v.diff.length?v.diff.map(d=>`<li class="${d[0]==="+"?"add":d[0]==="-"?"del":"chg"}"><b>${d[0]}</b> ${H(d[1])}</li>`).join(""):'<li class="muted">No change from the built-in layout.</li>'}</ul>${v.approved?`<div class="muted small">${H(v.approved)}</div>`:""}</div>`).join("")}`)}
const scrName=id=>G(()=>SCREENS.find(s=>s[0]===id)[1],id);
function publishForm(){const w=D.work;if(!w)return;const p=canPublish();if(!p.any){audit_("Denied: publish dashboard default",me()+" · "+roleName());openDrawer(`<div class="eyebrow">Not permitted</div><h2 style="font-size:24px;margin:6px 0">${H(roleName())} cannot publish dashboard defaults</h2><p class="muted">Executives and platform admins can publish. You can keep your own layout, or ask the ${H(D.group.name)} to publish it.</p><div class="row"><button class="btn primary" data-dl="ask">Ask ${H(D.group.name)}</button></div>`);return}
 const ef=effective(w.screen);const d=diff(ef.def?ef.def.layout:blank(),w.layout);const roles=G(()=>S.adm.roles.map(r=>[r.id,r.n]),[["exec","Executive"],["admin","Platform admin"]]);const teams=G(()=>TEAMS.map(t=>[t.n,t.n]),[]);
 FORMST.dl_pub={vals:{scope:"everyone",role:roles[0][0],team:teams[0]?teams[0][0]:"",note:""},err:{}};
 openForm({id:"dl_pub",title:"Publish as default: "+H(scrName(w.screen)),story:`Everyone sees this layout unless they have a personal one. Publishing to everyone needs approval by the ${H(D.group.name)}; a role or team default is pre-approved by policy and logged. ${d.length} change${d.length===1?"":"s"} from the current default.`,submit:"Publish",
  fields:[{k:"scope",label:"Who gets it",type:"chips",opts:[["everyone","Everyone"],["role","A role"],["team","A team"]]},{k:"role",label:"Role",type:"pick",noun:"roles",src:roles,show:v=>v.scope==="role"},{k:"team",label:"Team",type:"pick",noun:"teams",src:"teams",show:v=>v.scope==="team"},{k:"note",label:"What changed and why",type:"longtext",rows:2,req:true}],
  live:v=>`<ul class="dl-diff">${d.map(x=>`<li class="${x[0]==="+"?"add":x[0]==="-"?"del":"chg"}"><b>${x[0]}</b> ${H(x[1])}</li>`).join("")||'<li class="muted">No change from the current default.</li>'}</ul>`,
  onSubmit:v=>{const sc=v.scope||"everyone";const val=sc==="role"?v.role:sc==="team"?v.team:"";if(!(v.note||"").trim()){G(()=>toast("Say what changed and why","warn"));return {close:false}}const r=publish(w.screen,w.layout,sc,val,v.note);if(!r)return {close:false};D.edit=false;D.work=null;setTimeout(render,0);return {toast:r.status==="pending"?"Sent for approval":"Published"}}})}
function libDrawer(){const items=W.DASHX&&DASHX.library?DASHX.library():[];
 openDrawer(`<div class="eyebrow">Add to this dashboard</div><h2 style="font-size:24px;margin:6px 0">Library</h2><p class="muted small">Saved charts, governed metrics and reports. Everything here comes from the semantic layer or the metric dictionary, so the number matches everywhere.</p><div class="dl-lib">${PICKER.html({id:"dl_lib",inline:true,noun:"charts, metrics and reports",source:items,height:380,recent:"dash_library",onPick:v=>{const it=items.find(x=>x.v===v);if(!it)return;addTile(it);closeDrawer()}})}</div>`)}
function addTile(it){const w=D.work;if(!w)return;const key="add:"+it.kind+":"+it.ref;if((w.layout.added||[]).some(a=>a.key===key)){G(()=>toast("Already on this dashboard","info"));return}w.layout.added.push({key,kind:it.kind,ref:it.ref,title:it.l});applyLayout();G(()=>toast("Added "+it.l,"good"));setTimeout(()=>{const el=document.querySelector(`[data-dl-key="${CSS.escape(key)}"]`);if(el)el.scrollIntoView({block:"center",behavior:"smooth"})},60)}
function addedHTML(a){if(W.DASHX&&DASHX.tileHTML)return DASHX.tileHTML(a);return `<div class="cardhead"><h3>${H(a.title)}</h3></div>`}
/* ---------- events ---------- */
ROUTER.on("click",e=>{const o=e.target.closest("[data-dl-open]");if(o){e.preventDefault();return startEdit()}
 const b=e.target.closest("[data-dl]");if(!b)return;const a=b.dataset.dl,k=b.dataset.k,c=b.dataset.c;
 switch(a){case "up":return move(c,k,-1);case "down":return move(c,k,1);case "narrow":return resize(k,-1);case "wide":return resize(k,1);
 case "hide":{const h=D.work.layout.hidden;const i=h.indexOf(k);if(i<0)h.push(k);else h.splice(i,1);return applyLayout()}
 case "unhide":D.work.layout.hidden=[];return applyLayout();
 case "remove":D.work.layout.added=D.work.layout.added.filter(x=>x.key!==k);D.work.layout.hidden=D.work.layout.hidden.filter(x=>x!==k);return applyLayout();
 case "add":return libDrawer();case "hist":return histDrawer(S.screen);case "publish":return publishForm();
 case "ask":{const r=publish(S.screen,D.work.layout,"role","exec","Requested by "+me());closeDrawer();return}
 case "reset":D.work.layout=blank();return resetMine();
 case "cancel":D.edit=false;D.work=null;return render();case "save":return savePersonal();
 case "apply-default":{const u=me();delete (D.mine[u]||{})[k];sdel("dashboard_layout",u+"|"+k);render();return}}});
let dragK=null,dragC=null;
ROUTER.on("dragstart","[data-dl-tile].dl-edit",(e,t)=>{dragK=t.dataset.dlKey;dragC=t.parentElement.dataset.dlC;e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",dragK)}catch(x){}t.classList.add("dl-drag")});
ROUTER.on("dragover",e=>{const t=e.target.closest&&e.target.closest("[data-dl-tile].dl-edit");if(!t||!dragK||t.parentElement.dataset.dlC!==dragC)return;e.preventDefault();document.querySelectorAll(".dl-over").forEach(x=>x.classList.remove("dl-over"));if(t.dataset.dlKey!==dragK)t.classList.add("dl-over")});
ROUTER.on("drop",e=>{const t=e.target.closest&&e.target.closest("[data-dl-tile].dl-edit");if(!t||!dragK)return;e.preventDefault();drop(dragC,dragK,t.dataset.dlKey);dragK=null});
ROUTER.on("dragend",()=>{dragK=null;document.querySelectorAll(".dl-over,.dl-drag").forEach(x=>x.classList.remove("dl-over","dl-drag"))});
ROUTER.on("keydown",e=>{if(!D.edit)return;const b=e.target.closest&&e.target.closest("[data-dl-tile].dl-edit");if(e.key==="Escape"&&!document.querySelector(".pk2-pop:not([hidden])")&&!document.getElementById("drawer").classList.contains("open")){}
 if(b&&e.altKey&&(e.key==="ArrowUp"||e.key==="ArrowDown")&&e.target.closest(".dl-tb")){e.preventDefault();move(b.parentElement.dataset.dlC,b.dataset.dlKey,e.key==="ArrowUp"?-1:1)}});
/* ---------- hook ---------- */
const _ca=W.coreAfter;W.coreAfter=function(){const r=_ca&&_ca.apply(this,arguments);try{applyLayout()}catch(e){console.error("r16j dash",e)}return r};
W.DASHX=Object.assign(W.DASHX||{},{D,effective,defaultFor,publish,decide,diff,canPublish,startEdit,applyLayout,discover,savePersonal,histDrawer,scrName,sput,me,roleId,myTeam,hydrate,isEmpty,blank,clone,slug});
})();

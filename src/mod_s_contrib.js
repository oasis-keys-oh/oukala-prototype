/* ===== mod_s_contrib: the contribution anchor (PR-33, design in docs/ia/navigation-architecture.md section f). CSS prefix ctb-.
   Everyone sees which part of the enterprise they contribute to:
   1. The thread in the top bar slot #tbThread on every screen: Company > Enterprise objective > Group objective > Team objective >
      This screen. Each segment is a number chip that opens THREAD.open. On a screen anchored to a team objective the viewer belongs
      to, the last segment reads "your team" and shows the team's key result.
   2. My contribution: a card on Home and in My work (not a new screen), by level (R38): executive, manager, individual. Points are
      modeled, display only, never a rating or a ranking of people, and no review or pay process reads them (decision 8, section i).
   3. A small anchor mark on menu entries that serve the viewer's objectives, and the All screens filter "Serves my objectives".
   4. Gaps: a screen or a piece of work with no path to an objective shows "Not linked to an objective", styled like "No backup".
   Compute: record > project or process > objective > group > enterprise > company. Person to team from the people directory and
   ownership; a person's share of a team objective is equal by default, or hours on linked work from timesheets; robot and agent
   work is credited to the human sponsor's team, never to a person. Points = Σ team leaf contribution (EXE.cascade, DC-12) × share.
   Meridian reads the DC-12 cascade (read only); every other tenant builds the same shape from DATA objectives and key results, with
   equal weights (modeled) and no group level when its pack records none. Reads only through DATA, EXE, NUM, REG.meta and NAVX.
   window.CONTRIB = {model, viewer, anchor, serves, points, threadHTML, cardHTML, badge, gaps, open}. ===== */
(function(){
"use strict";
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>U.esc(s);
const arr=x=>Array.isArray(x)?x:[];
const r1=v=>Math.round((+v||0)*10)/10;
const prog=v=>v==null?"n/a":Math.round(v*100)+"%";
const ten=()=>G(()=>DATA.tenant(),"core");
const rowsOf=(e,t)=>arr(G(()=>DATA.get(e,{tenant:t||ten()}),[]));
const own=(name,rec)=>name?G(()=>ownerChip(name,{record:rec||"",role:"Owner",size:20}),H(name)):`<span class="small muted">No owner recorded</span>`;
const LV={company:"Company",enterprise:"Enterprise objective",group:"Group objective",team:"Team objective"};
const MODELED=`<span class="pill info ctb-tag" title="Modeled: weights and shares are sample assumptions; key result values are prototype facts">modeled</span>`;
const RULE="Display only. Points describe how work connects to the objectives: they are not a rating, there is no ranking of people, and no review or pay process reads them.";
const ANCHOR=`<svg class="ctb-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 13a7 7 0 0 0 14 0M8 11h8"/></svg>`;

/* ---------- 1. the cascade for a tenant: company, enterprise, group (Meridian only), team leaves ---------- */
/* Meridian team words in the people directory that name a team in the DC-12 cascade (sample mapping, modeled) */
const CORE_TEAM={"Platform team":"Platform team","Platform engineering":"Platform team","Editorial":"Editors","Editors":"Editors","Ops team":"Ops team",
 "Service desk":"Ops team","Service desk and operations":"Ops team","Architecture":"Architecture","Finance":"Finance","Legal and compliance":"Contracts","Contracts":"Contracts","Vendor management":"Vendor management"};
/* the business areas each Meridian team objective serves first (screen anchor, section f: the REG objective level picks how far up) */
const CORE_AREA={strat:["T1","T2","T5","T8","T10"],deliver:["T1","T2","T3","T11"],ops:["T5","T6","T7"],money:["T10","T11","T7"],people:["T4","T2"],
 risk:["T8","T9","T6"],transform:["T1","T3","T9"],build:["T8","T9"],my:[],ask:[],home:[]};
/* screens that serve one team objective directly (Meridian ids; ignored where the screen or node is absent) */
const CORE_SCREEN={inv:"T10",bud_ven:"T7",ppm_sow:"T7",grc_ven:"T7",itsm_prb:"T6",itsm_inc:"T5",itsm_home:"T5"};

function coreModel(){const X=G(()=>EXE.cascade(),null);if(!X||!X.company)return null;
 const nodes=X.nodes.map(n=>({id:n.id,lvl:n.lvl,n:n.n,owner:n.owner,up:Object.assign({},n.up),p:n.p,contrib:n.contrib,share:n.share,kr:n.kr||"",team:n.team||"",grp:n.grp||"",st:n.st,kids:arr(n.kids).slice()}));
 const by={};nodes.forEach(n=>by[n.id]=n);
 nodes.forEach(n=>{n.num=n.lvl==="enterprise"?G(()=>NUM.rec("obj",n.id),""):n.lvl==="team"&&n.kr?G(()=>NUM.rec("kr",n.kr),""):""});
 const links=G(()=>EXE.E.links,{})||{};
 const projOf=objId=>Object.keys(links).map(p=>({p,w:+((links[p]||{})[objId])||0})).filter(x=>x.w>0);
 return {t:"core",company:by[X.company.id],nodes,by,group:true,projOf,teamOf:name=>CORE_TEAM[name]||"",orphan:arr(X.orphan).map(n=>n.id)}}

function packModel(t){const info=G(()=>DATA.tenantInfo(t),{})||{};const objs=rowsOf("objectives",t),krs=rowsOf("key_results",t);if(!objs.length)return null;
 const att=k=>G(()=>ROLLUP.att(k.cur,k.tgt,k.start),null);
 const company={id:"CO-"+t,lvl:"company",n:(info.org||t)+": all objectives",owner:"",up:{},kids:[],num:""};
 const nodes=[company],by={[company.id]:company};
 objs.forEach(o=>{const n={id:o.id,lvl:"enterprise",n:o.n,owner:o.owner||"",up:{[company.id]:1},kids:[],num:G(()=>NUM.rec("obj",o.id,t),"")};nodes.push(n);by[n.id]=n;company.kids.push(n.id)});
 const people=rowsOf("people",t);const teamOfPerson=name=>(people.find(p=>p.name===name)||{}).team||"";
 krs.forEach(k=>{if(!by[k.o])return;const n={id:k.id,lvl:"team",n:k.n,owner:k.owner||"",up:{[k.o]:1},kids:[],kr:k.id,team:teamOfPerson(k.owner),num:G(()=>NUM.rec("kr",k.id,t),""),p:att(k)};
  nodes.push(n);by[n.id]=n;by[k.o].kids.push(n.id)});
 const mean=a=>{const v=a.filter(x=>x!=null);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null};
 nodes.filter(n=>n.lvl==="enterprise").forEach(n=>{n.p=mean(n.kids.map(id=>by[id].p))});company.p=mean(company.kids.map(id=>by[id].p));
 /* equal weights at every level (modeled): share = 1/objectives × 1/key results of that objective */
 const ne=company.kids.length||1;nodes.forEach(n=>{if(n.lvl==="company")n.share=1;else if(n.lvl==="enterprise")n.share=1/ne;else{const par=by[Object.keys(n.up)[0]];n.share=(1/ne)*(1/(par.kids.length||1))}
  n.contrib=n.p==null?null:n.p*n.share*100});
 const projs=rowsOf("projects",t);
 const projOf=objId=>projs.filter(p=>p.obj===objId||arr(p.objs).indexOf(objId)>=0).map(p=>({p:p.id,w:1}));
 return {t,company,nodes,by,group:false,projOf,teamOf:name=>name||"",orphan:nodes.filter(n=>n.lvl==="enterprise"&&!n.kids.length).map(n=>n.id)}}

/* ---------- 2. the viewer: the persona's person, their teams, their level ---------- */
const EXEC=["exec","ceo","cco","cfo","coo","chro","ciso","caio","clo","board"];
/* in another tenant the persona's seat is the person whose role fits it (sample mapping, labeled on screen) */
const SEAT={exec:/chief information|chief technology|chief digital|technology|information/i,ceo:/chief executive|president/i,cco:/commercial|sales|customer|member|revenue/i,
 cfo:/chief financial|finance/i,coo:/chief operating|operations/i,chro:/people|human|workforce/i,ciso:/security|risk/i,caio:/\bAI\b|data|analytics|digital/i,clo:/legal|counsel|compliance/i,
 board:/chief executive|president/i,portfolio:/portfolio|program|transformation/i,audit:/audit|compliance|risk/i,pm:/project|program|planning/i,ops:/service|support|desk|operations/i,
 dist:/distribution|logistics|order|supply/i,fac:/facilit|maintenance|reliability/i,scm:/procure|supply|purchas/i,plant:/plant|site|mine|production|clinical/i,proc:/control|process|safety/i,
 change:/change|release/i,arch:/architect|engineer|platform/i,admin:/admin|platform|systems/i,fin:/finance|accounts|billing|revenue cycle/i};
const humans=t=>rowsOf("people",t).filter(p=>p&&p.name&&(!p.kind||p.kind==="human"));
function seatOf(key,t){const ps=humans(t);if(!ps.length)return null;const re=SEAT[key];const staff=ps.filter(p=>p.team!=="Executive office");
 let hit=re?ps.find(p=>re.test(p.role||"")):null;if(!hit&&re)hit=ps.find(p=>re.test(p.team||""));
 if(!hit){const pool=EXEC.indexOf(key)>=0?ps:(staff.length?staff:ps);let h=0;for(const c of String(key))h=(h*31+c.charCodeAt(0))>>>0;hit=pool[h%pool.length]}
 return hit}
function viewer(M){const t=M?M.t:ten();const key=G(()=>S.persona,"exec")||"exec";const P=G(()=>PERSONAS[key],{})||{};
 let name=P.as||"",mapped=false,person=null;
 if(t==="core")person=humans("core").find(p=>p.name===name)||null;
 else{person=seatOf(key,t);name=person?person.name:"";mapped=true}
 const teams=new Set();if(person&&M){const tm=M.teamOf(person.team);if(tm)teams.add(tm)}
 if(M){M.nodes.forEach(n=>{if(n.lvl==="team"&&n.owner===name&&n.team)teams.add(n.team)});
  rowsOf("teams",t).forEach(x=>{if(x&&x.mgr===name){const tm=M.teamOf(x.n);if(tm)teams.add(tm)}})}
 const owns=M?M.nodes.filter(n=>n.lvl!=="company"&&n.owner===name).map(n=>n.id):[];
 const level=EXEC.indexOf(key)>=0?"executive":owns.some(id=>M.by[id].lvl==="group"||M.by[id].lvl==="enterprise")||rowsOf("teams",t).some(x=>x&&x.mgr===name)?"manager":"individual";
 return {key,persona:P.n||key,name,person,mapped,teams:[...teams],owns,level,team:person?person.team:""}}

/* ---------- 3. shares and points ---------- */
const sheets=t=>rowsOf("timesheets",t).filter(r=>r&&r.person&&Array.isArray(r.rows));
const sumH=r=>arr(r.hrs).reduce((s,x)=>s+(+x||0),0);
function membersOf(M,team){const t=M.t;return humans(t).filter(p=>{if(M.teamOf(p.team)===team)return true;
 if(M.nodes.some(n=>n.lvl==="team"&&n.team===team&&n.owner===p.name))return true;return rowsOf("teams",t).some(x=>x&&x.mgr===p.name&&M.teamOf(x.n)===team)}).map(p=>p.name)}
function entOf(M,n){let c=n,guard=0;while(c&&c.lvl!=="enterprise"&&guard++<6)c=parentOf(M,c);return c}
function parentOf(M,n){const ups=Object.keys(n.up||{}).filter(u=>M.by[u]&&n.up[u]>0);if(!ups.length)return null;ups.sort((a,b)=>n.up[b]-n.up[a]);return M.by[ups[0]]}
function chainOf(M,n){const out=[];let c=n,guard=0;while(c&&guard++<8){out.unshift(c);c=parentOf(M,c)}return out}
function hoursOn(M,leaf,names){const e=entOf(M,leaf);if(!e)return {};const pw={};M.projOf(e.id).forEach(x=>pw[x.p]=x.w);const out={};
 sheets(M.t).forEach(s=>{if(names.indexOf(s.person)<0)return;arr(s.rows).forEach(r=>{const w=pw[r.proj];if(w)out[s.person]=(out[s.person]||0)+sumH(r)*w})});return out}
function shareOf(M,leaf,name){const mem=membersOf(M,leaf.team);if(mem.indexOf(name)<0)mem.push(name);const hrs=hoursOn(M,leaf,mem);const team=Object.keys(hrs).reduce((s,k)=>s+hrs[k],0);
 if(team>0)return {share:(hrs[name]||0)/team,method:"hours",mine:r1(hrs[name]||0),team:r1(team),members:mem.length};
 return {share:1/mem.length,method:"equal",members:mem.length}}
function agentsOf(M,team,mem){const ag=rowsOf("agents",M.t);return ag.filter(a=>{const o=a&&(a.sponsor||a.owner||"");return o&&(mem.indexOf(o)>=0||M.teamOf(o)===team||o===team)}).length}
function points(M,V){V=V||viewer(M);const rows=M.nodes.filter(n=>n.lvl==="team"&&n.team&&V.teams.indexOf(n.team)>=0).map(n=>{const s=shareOf(M,n,V.name);const mem=membersOf(M,n.team);
  return {leaf:n,share:s,pts:(n.contrib||0)*s.share,potential:(n.share||0)*100*s.share,agents:agentsOf(M,n.team,mem)}});
 return {rows,total:rows.reduce((s,r)=>s+r.pts,0),potential:rows.reduce((s,r)=>s+r.potential,0)}}

/* ---------- 4. the viewer's own work and its path to an objective ---------- */
function workOf(M,V){const t=M.t,name=V.name,out=[];if(!name)return out;const ents=new Set(M.nodes.filter(n=>n.lvl==="enterprise").map(n=>n.id));
 const projObjs=p=>{if(t==="core"){const l=G(()=>EXE.E.links[p.id],{})||{};return Object.keys(l).filter(o=>l[o]>0&&ents.has(o))}return [p.obj].concat(arr(p.objs)).filter(o=>o&&ents.has(o))};
 const projs=rowsOf("projects",t);const seen=new Set();
 projs.filter(p=>p&&p.owner===name).forEach(p=>{seen.add(p.id);out.push({kind:"Project",id:p.id,n:p.n,num:G(()=>NUM.rec("proj",p.id,t),""),objs:projObjs(p),closed:/closed|done|complete/i.test(p.st||p.status||"")})});
 const hrs={};sheets(t).filter(s=>s.person===name).forEach(s=>arr(s.rows).forEach(r=>{if(r.proj)hrs[r.proj]=(hrs[r.proj]||0)+sumH(r)}));
 Object.keys(hrs).forEach(pid=>{const p=projs.find(x=>x&&x.id===pid);if(seen.has(pid)){const o=out.find(x=>x.id===pid);if(o)o.hrs=hrs[pid];return}seen.add(pid);
  out.push({kind:"Time on work",id:pid,n:p?p.n:pid,num:p?G(()=>NUM.rec("proj",pid,t),""):"",objs:p?projObjs(p):[],hrs:hrs[pid]})});
 rowsOf("key_results",t).filter(k=>k&&k.owner===name).forEach(k=>out.push({kind:"Key result",id:k.id,n:k.n,num:G(()=>NUM.rec("kr",k.id,t),""),objs:ents.has(k.o)?[k.o]:[]}));
 rowsOf("work_items",t).filter(w=>w&&w.owner===name).slice(0,6).forEach(w=>{const p=w.pr&&projs.find(x=>x&&x.id===w.pr);
  out.push({kind:"Work item",id:w.id,n:w.n||w.t||w.title||w.id,num:"",objs:p?projObjs(p):[],closed:/closed|done|resolved/i.test(w.st||w.status||"")})});
 return out}

/* ---------- 5. the model for this render pass (memo cleared before every render and on a tenant change) ---------- */
let MEMO=null;
function model(){const t=ten(),k=t+"|"+G(()=>DATA.version,0)+"|"+G(()=>S.persona,"");if(MEMO&&MEMO.k===k)return MEMO.M;
 const M=(t==="core"?coreModel():packModel(t))||null;if(M){M.leaves=M.nodes.filter(n=>n.lvl==="team");M.V=viewer(M);M.anchors={}}
 MEMO={k,M};return M}
G(()=>HOOKS.on("beforeRender",()=>{MEMO=null},{id:"contrib.memo"}));
G(()=>HOOKS.on("tenantChange",()=>{MEMO=null},{id:"contrib.memo.tenant"}));

/* ---------- 6. screen anchor: REG objective level decides how far up; area and viewer pick the team objective ---------- */
function anchor(id){const M=model();if(!M)return {gap:true,why:"This tenant records no objectives yet."};if(M.anchors[id])return M.anchors[id];
 const meta=G(()=>REG.meta(id),{})||{};const lvl=meta.objective||"";let a;
 if(!lvl||!/^(company|enterprise|group|team|individual)$/.test(lvl))a={gap:true,lvl,why:lvl==="platform"?"A platform screen: it builds the product, it serves no business objective directly.":"No objective level is declared for this screen."};
 else{const V=M.V;const mine=M.leaves.filter(n=>V.teams.indexOf(n.team)>=0);
  let cand=[];if(M.t==="core"){const o=CORE_SCREEN[id];if(o&&M.by[o])cand=[o];else cand=arr(CORE_AREA[meta.area]).filter(x=>M.by[x])}
  else cand=M.leaves.slice().sort((x,y)=>(y.contrib||0)-(x.contrib||0)).map(n=>n.id);
  const personal=lvl==="individual"||/^(my|ask|home)$/.test(meta.area||"");
  /* a business screen has one anchor for everyone (its first candidate); My work, Ask and Home follow the viewer's own team */
  let leaf=(personal?mine[0]:null)||M.by[cand[0]]||M.leaves.slice().sort((x,y)=>(y.contrib||0)-(x.contrib||0))[0];
  if(!leaf)a={gap:true,lvl,why:"No team objective is recorded in this tenant."};
  else{let chain=chainOf(M,leaf);const cut={company:1,enterprise:2,group:M.group?3:2,team:9,individual:9}[lvl];chain=chain.slice(0,cut);
   a={gap:false,lvl,chain,leaf,mine:chain[chain.length-1]===leaf&&mine.indexOf(leaf)>=0,area:meta.area||""}}}
 M.anchors[id]=a;return a}
function serves(id){const M=model();if(!M)return false;const a=anchor(id);if(a.gap||a.lvl==="company")return false;if(a.mine)return true;
 const last=a.chain[a.chain.length-1];return M.leaves.some(n=>M.V.teams.indexOf(n.team)>=0&&chainOf(M,n).indexOf(last)>=0)}

/* ---------- 7. render: the thread, the gap badge, the metric chip, the card ---------- */
const badge=why=>`<span class="pill warn ownx-badge ctb-gapb" title="${H(why||"No path from this to an objective: it is counted in the gaps list")}"><i class="ownx-bd" aria-hidden="true"></i>Not linked to an objective</span>`;
/* THREAD.open takes a number: an objective or key result opens itself; a company or group node opens the enterprise objective it rolls into */
function openTarget(M,n,ent){if(n.num)return n.num;if(n.lvl==="group"||n.lvl==="team"){const e=entOf(M,n);return e?e.num:""}
 if(n.lvl==="company"){const e=ent||M.nodes.find(x=>x.lvl==="enterprise"&&x.num);return e?e.num:""}return ""}
function seg(M,n,o){o=o||{};const tgt=openTarget(M,n,o.ent);const lab=LV[n.lvl]||n.lvl;const kr=n.kr&&o.mine?G(()=>M.t==="core"?EXE.E.krs.find(k=>k.id===n.kr):rowsOf("key_results",M.t).find(k=>k.id===n.kr),null):null;
 const krTxt=kr?G(()=>M.t==="core"?EXE.fmtKr(kr)+" toward "+EXE.fmtKr(kr,kr.tgt):(kr.cur+(kr.u||"")+" toward "+kr.tgt+(kr.u||"")),""):"";
 const title=lab+(n.num?" "+n.num:"")+": "+n.n+(o.mine?" (your team"+(n.team?", "+n.team:"")+")":"")+(krTxt?". Key result: "+kr.n+", "+krTxt:"")+". Open the thread";
 const tag=n.num?`<span class="num-chip">${H(n.num)}</span>`:`<span class="ctb-lv">${H(n.lvl==="company"?"Company":n.lvl==="group"?"Group":n.lvl==="team"?"Key result":"")}</span>`;
 return `<button type="button" class="ctb-seg${o.mine?" ctb-mine":""}" data-ctb-open="${H(tgt)}" data-ctb-lvl="${H(n.lvl)}" title="${H(title)}" aria-label="${H(title)}">${tag}<span class="ctb-sn">${H(n.n)}</span>${o.mine?`<b class="ctb-yt">your team</b>${krTxt?`<span class="ctb-kr">${H(krTxt)}</span>`:""}`:""}</button>`}
const SEP=`<span class="ctb-sep" aria-hidden="true">›</span>`;
function threadHTML(id){const M=model();const a=anchor(id);const scr=G(()=>NAVX.label(id),"")||G(()=>(SCREENS.find(s=>s[0]===id)||[])[1],id);
 const me=`<button type="button" class="ctb-me" data-ctb-me="1" title="My contribution: how your work connects to the objectives" aria-label="My contribution">${ANCHOR}</button>`;
 if(!M||a.gap)return `${me}${badge(a.why)}<span class="ctb-here small muted">${H(scr)}</span>`;
 const ent=a.chain.find(n=>n.lvl==="enterprise");const segs=a.chain.map((n,i)=>seg(M,n,{ent,mine:a.mine&&i===a.chain.length-1,last:i===a.chain.length-1}));
 return `${me}${segs.join(SEP)}${a.mine?"":SEP+`<span class="ctb-here" title="This screen: ${H(scr)}">This screen</span>`}`}

function fx(M,V,P){const pid=G(()=>U.uid("ctbfx"),"ctbfx"+Date.now());const ownerN=M.nodes.map(n=>n.owner).find(o=>o&&humans(M.t).some(p=>p.name===o))||"";
 return `<button type="button" class="fchip ctb-fx" popovertarget="${pid}" aria-label="Formula for contribution points">ƒ Contribution points</button><div popover id="${pid}" class="pop glass ctb-pop"><div class="eyebrow">Metric · modeled</div><h3>Contribution points</h3>
 <div class="formula">Points = Σ over your team objectives of (that objective's points of the company score × your share of the team). Points of the company score = key result progress × the product of the normalized weights up to the company (DC-12). Share = equal among the team's members, or your hours on work linked to the objective ÷ the team's hours when timesheets record them. Robot and agent work counts for the sponsor's team, never for a person.</div>
 <dl class="ctb-dl"><dt>Owner</dt><dd>${ownerN?own(ownerN,"metric:contribution_points"):badge("No person owns the objectives in this tenant")}</dd><dt>Target</dt><dd>${r1(P.potential)} points: your share if every one of your team objectives is fully met (modeled)</dd><dt>Label</dt><dd>Modeled. Weights and shares are sample assumptions; key result values are prototype facts.</dd><dt>Use</dt><dd>${H(RULE)}</dd></dl>
 <div class="row"><button class="btn" type="button" popovertarget="${pid}" popovertargetaction="hide">Close</button></div></div>`}

let LVSEL="";
function levelsFor(V){return V.level==="executive"?["executive","manager","individual"]:V.level==="manager"?["manager","individual"]:["individual"]}
function nodeRow(M,n,extra){const ch=chainOf(M,n).slice(1);return `<li class="ctb-row"><div class="ctb-rh">${ch.map(c=>seg(M,c,{})).join(SEP)}</div><div class="ctb-rm"><span class="small" data-role="metric">${prog(n.p)} progress · ${n.contrib==null?"no progress yet":r1(n.contrib)+" points of the company score"}</span>${own(n.owner,"objective:"+n.id)}${extra||""}</div></li>`}
function cardHTML(){const M=model();if(!M)return `<section class="card glass ctb-card" data-ctb-card="1"><div class="eyebrow">My contribution</div><p class="small">This tenant records no objectives yet, so nothing can be traced.</p>${badge()}</section>`;
 const V=M.V,P=points(M,V),W0=workOf(M,V);const lvls=levelsFor(V);const cur=lvls.indexOf(LVSEL)>=0?LVSEL:lvls[0];
 const top=P.rows.slice().sort((a,b)=>b.pts-a.pts)[0];
 const who=V.name?own(V.name,"person:"+V.name):`<span class="small muted">No person in this seat</span>`;
 const head=P.rows.length?`Your work this quarter: <b class="num" data-role="metric">${r1(P.total)}</b> points of the company score ${MODELED}, through ${H(top.leaf.n)}${P.rows.length>1?" and "+(P.rows.length-1)+" more":""}.`
  :`No team objective is linked to your team yet ${MODELED}.`;
 const tabs=lvls.length>1?`<div class="row ctb-tabs" role="group" aria-label="View by level">${lvls.map(l=>`<button type="button" class="chip" data-ctb-lv="${l}" aria-pressed="${l===cur}">${l==="executive"?"Company and enterprise":l==="manager"?"Groups and teams":"My thread"}</button>`).join("")}</div>`:"";
 let body="";
 if(cur==="executive"){const ents=M.nodes.filter(n=>n.lvl==="enterprise");
  body=`<p class="small">Company score <b class="num" data-role="metric">${prog(M.company.p)}</b> ${MODELED}. Each enterprise objective, with its points of the company score; open one to drill down.</p><ul class="ctb-list">${ents.map(n=>nodeRow(M,n)).join("")}</ul>`}
 else if(cur==="manager"){const mine=M.nodes.filter(n=>(n.lvl==="group"||n.lvl==="team")&&(V.owns.indexOf(n.id)>=0||(n.lvl==="team"&&V.teams.indexOf(n.team)>=0)||(n.lvl==="group"&&V.level==="executive")));
  const list=(mine.length?mine:M.nodes.filter(n=>n.lvl===(M.group?"group":"team")));
  body=`<p class="small">Team views are totals for the team; no person is listed or compared.</p><ul class="ctb-list">${list.map(n=>{const mem=n.lvl==="team"?membersOf(M,n.team):[];return nodeRow(M,n,n.lvl==="team"?`<span class="small muted">${H(n.team||"Team not recorded")} · ${mem.length} member${mem.length===1?"":"s"}${agentsOf(M,n.team,mem)?" · "+agentsOf(M,n.team,mem)+" agents and robots credited to the team":""}</span>`:"")}).join("")}</ul>`}
 else{const rows=P.rows.map(r=>{const s=r.share;return nodeRow(M,r.leaf,`<span class="small" data-role="metric">Your share ${Math.round(s.share*100)}% (${s.method==="hours"?`${s.mine} of ${s.team} hours on linked work`:`equal among ${s.members} members`}) = <b>${r1(r.pts)}</b> points ${MODELED}</span>${r.agents?`<span class="small muted">${r.agents} agents and robots sponsored in this team: their work counts for the team, not for a person</span>`:""}`)}).join("");
  const work=W0.slice(0,8).map(w=>{const o=w.objs.map(id=>M.by[id]).filter(Boolean);return `<li class="ctb-w"><span class="small muted">${H(w.kind)}${w.closed?" · closed":" · open"}${w.hrs?" · "+r1(w.hrs)+" hours":""}</span>${w.num?`<button type="button" class="ctb-seg" data-ctb-open="${H(w.num)}" title="Open the thread for ${H(w.num)}"><span class="num-chip">${H(w.num)}</span><span class="ctb-sn">${H(w.n)}</span></button>`:`<b class="small">${H(w.n)}</b>`}${o.length?SEP+o.map(n=>seg(M,n,{})).join(" "):badge()}</li>`}).join("");
  body=`${rows?`<ul class="ctb-list">${rows}</ul>`:`<p class="small">${V.team?H(V.team)+" has no team objective in the cascade. ":""}${badge("Your team has no team objective in the cascade")}</p>`}
  <div class="ctb-sub"><span class="eyebrow">Your open and closed work</span>${work?`<ul class="ctb-wl">${work}</ul>`:`<p class="small muted">No projects, hours or key results are recorded for you in this tenant.</p>`}</div>`}
 const gaps=W0.filter(w=>!w.objs.length).length;
 return `<section class="card glass ctb-card" data-ctb-card="1" aria-label="My contribution"><div class="ctb-ch"><div><div class="eyebrow">${ANCHOR} My contribution</div><h3 class="ctb-h">${head}</h3>
 <p class="small muted">Viewing as ${who} (${H(V.persona)}${V.mapped?", the person in this seat in this tenant: a sample mapping":""}). ${V.teams.length?"Your teams: "+V.teams.map(H).join(", ")+".":"No team in the cascade."}${gaps?" "+gaps+" of your items are not linked to an objective.":""}</p></div>${fx(M,V,P)}</div>
 ${tabs}${body}<p class="small ctb-rule" data-ctb-rule="1"><b>Not a rating.</b> ${H(RULE)}</p></section>`}

/* ---------- 8. wiring: thread slot, cards, menu marks, All screens filter ---------- */
function fillThread(){const s=D.getElementById("tbThread");if(!s)return false;const id=G(()=>S.screen,"");if(!id){s.hidden=true;return true}
 const html=threadHTML(id);if(s.getAttribute("data-ctb")!==id+"|"+html.length){s.innerHTML=html;s.setAttribute("data-ctb",id+"|"+html.length)}
 s.classList.add("ctb-thread");s.hidden=false;return true}
function cardHost(){const id=G(()=>S.screen,"");if(id!=="home"&&id!=="flw_appr")return;const v=D.getElementById("view");if(!v)return;const host=v.querySelector(".screen")||v;
 const old=host.querySelector("[data-ctb-card]");const html=cardHTML();if(old){old.outerHTML=html;return}
 const after=host.querySelector(":scope > .nx-hpins")||host.querySelector(":scope > .hero")||host.querySelector(":scope > section.hero");
 if(after)after.insertAdjacentHTML("afterend",html);else host.insertAdjacentHTML("afterbegin",html)}
function markMenus(root){root=root||D;const M=model();if(!M)return;
 [...root.querySelectorAll("#nav [data-nav],#nxFly [data-nav],#nxAll [data-nav]")].forEach(b=>{const id=b.getAttribute("data-nav");const on=serves(id);const has=b.querySelector(".ctb-anc");
  if(on&&!has){const i=D.createElement("span");i.className="ctb-anc";i.title="Serves your objectives";i.setAttribute("role","img");i.setAttribute("aria-label","Serves your objectives");i.innerHTML=ANCHOR;b.appendChild(i)}
  else if(!on&&has)has.remove()})}
let pend=0;
function pass(){pend=0;G(()=>{if(!fillThread())setTimeout(()=>G(fillThread),80)});G(cardHost);G(()=>markMenus())}
G(()=>HOOKS.on("afterRender",()=>{G(pass)},{id:"contrib.render",order:1200}));
const later=()=>{if(pend)return;pend=setTimeout(()=>{pend=0;G(()=>markMenus())},0)};

/* All screens: "Serves my objectives" replaces the interim "Only my areas" chip; the list is filtered after nav draws it */
const AS={serve:false};
function allPost(){const p=D.getElementById("nxAll");if(!p)return;const mine=p.querySelector("[data-nx-all-mine]");
 if(mine){const b=D.createElement("button");b.type="button";b.className="chip";b.setAttribute("data-ctb-serve","1");b.setAttribute("aria-pressed",String(AS.serve));b.innerHTML=ANCHOR+"<span>Serves my objectives</span>";mine.replaceWith(b)}
 G(()=>{if(NAVX.allScreens&&NAVX.allScreens.state)NAVX.allScreens.state.mine=false});
 let n=0;[...p.querySelectorAll(".nx-alli[data-nav]")].forEach(b=>{const show=!AS.serve||serves(b.getAttribute("data-nav"));b.hidden=!show;if(show)n++});
 [...p.querySelectorAll(".nx-allsub")].forEach(s=>{s.hidden=![...s.querySelectorAll(".nx-alli")].some(b=>!b.hidden)});
 [...p.querySelectorAll(".nx-allsp")].forEach(s=>{s.hidden=![...s.querySelectorAll(".nx-allsub")].some(b=>!b.hidden)});
 const c=p.querySelector("[data-nx-all-n]");if(c)c.textContent=n+" screen"+(n===1?"":"s")+(AS.serve?" serve your objectives":"");
 markMenus(p)}
const allLater=()=>setTimeout(()=>G(allPost),0);
G(()=>{ROUTER.on("click","[data-nx-all]",allLater,{id:"contrib.all.open"});ROUTER.on("click","[data-nx-all-sp]",allLater,{id:"contrib.all.sp"});
 ROUTER.on("input","[data-nx-all-q]",allLater,{id:"contrib.all.q"});
 ROUTER.on("click","[data-ctb-serve]",e=>{e.preventDefault();AS.serve=!AS.serve;const p=D.getElementById("nxAll");if(p)G(()=>{p.innerHTML=NAVX.allScreens.html()});allPost()},{id:"contrib.all.serve"});
 ROUTER.on("click","#nav",later,{id:"contrib.nav.marks"});
 ROUTER.on("click","[data-ctb-open]",(e,t)=>{e.preventDefault();e.stopPropagation();const n=t.getAttribute("data-ctb-open");if(n&&W.THREAD)THREAD.open(n);else G(()=>toast("Nothing to trace for this level yet","warn"))},{id:"contrib.open"});
 ROUTER.on("click","[data-ctb-me]",e=>{e.preventDefault();open()},{id:"contrib.me"});
 ROUTER.on("click","[data-ctb-lv]",(e,t)=>{LVSEL=t.getAttribute("data-ctb-lv");const c=t.closest("[data-ctb-card]");if(c)c.outerHTML=cardHTML()},{id:"contrib.lv"})});
/* the drawer form of the card, from the anchor at the start of the thread */
function open(){G(()=>openDrawer(`<div class="ctb-dr">${cardHTML()}</div>`));return true}

/* every screen with no path to an objective, for the gaps list (the cascade's orphan list is kept by mod_exec) */
function gaps(){return G(()=>SCREENS.map(s=>s[0]),[]).filter(id=>anchor(id).gap)}
W.CONTRIB={model,viewer:()=>{const M=model();return M?M.V:viewer(null)},anchor,serves,points:()=>{const M=model();return M?points(M,M.V):{rows:[],total:0,potential:0}},
 threadHTML,cardHTML,badge,gaps,open,RULE,work:()=>{const M=model();return M?workOf(M,M.V):[]}};
})();

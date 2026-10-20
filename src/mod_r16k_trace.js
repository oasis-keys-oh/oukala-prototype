/* Round 16, Agent K. Strategy to execution (canonical screen id strat_exec; the old id "trace" aliases here).
   Chain: Strategic goal > Capabilities the goal depends on (maturity engine: level now, target, gap) > Maturity roadmap items (credits that move a
   capability from level to level, with dates) > Projects (read from the one project registry) > Money (approved, forecast, actual) and Work (tasks, FTE).
   Nothing is copied: goals come from EXE.E.objs, capabilities and roadmap items from MAT (mod_mat), projects from PROJ / DEMAND / SCALE.projects,
   money from BUDX budget lines, work from PTASKS and the plan. Edits write back to those sources. */
(function(){
"use strict";
const W=window;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const E=U.esc;
const SX=S.sx=S.sx||{open:{},sel:null,gaps:false,ver:0,own:null,tab:0};
const OWN="Maya Ortiz",BK="Priya Shah";
SX.own=SX.own||{gc:{o:OWN,b:BK},cr:{o:OWN,b:BK},rp:{o:OWN,b:BK}};
const LINKS={gc:"Goal to capability",cr:"Capability to roadmap item",rp:"Roadmap item to project"};

/* ---------------- formatting ---------------- */
const fm=n=>{n=Math.round(n||0);if(!n)return "$0";const a=Math.abs(n);return (n<0?"-":"")+"$"+(a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e3?Math.round(a/1e3)+"K":a)};
const fmd=n=>{n=Math.round(n||0);return (n<0?"-":"+")+fm(Math.abs(n))};
const LASTWD=G(()=>WD.length-1,0),LASTT=G(()=>WD[LASTWD],0);
const dOf=w=>{try{return w<=LASTWD?dateOf(w):new Date(LASTT+Math.round((w-LASTWD)*7/5)*864e5)}catch(e){return U.todayDate()}};
const dtxt=w=>dOf(w).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
const lvName=(n,v)=>{const m=G(()=>MAT.ALLM().find(x=>x.id===n.model),null);return m&&m.lv[Math.round(v)-1]?m.lv[Math.round(v)-1][0]:"Level "+v};

/* ---------------- metrics ---------------- */
const M0=(id,n,f,u,cur,tgt,bad,dir,mx,own,rem)=>{if(typeof METRICS==="undefined"||METRICS[id])return;METRICS[id]={n,f,u,cur,tgt,badAt:bad,dir,max:mx,tr:[0,1,2,3,4,5,6,7].map(i=>Math.round((cur+(dir==="max"?-1:1)*(7-i)*1.4)*10)/10),owner:own,use:["Strategy to execution"],rem}};
function metricsInit(){
 M0("m_sx_cover","Alignment coverage","Funded dollars that reach a strategic goal through a goal link, a capability and a roadmap item ÷ all funded dollars × 100","%",78,90,70,"max",100,"Portfolio office",{kind:"sop",ref:"SOP-SX-01",title:"Map unlinked funded work to a goal or stop it",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Lists funded projects with no goal and suggests the nearest goal from their capability credits"});
 M0("m_sx_orphan","Orphan spend ($K)","Σ approved dollars of funded work that has no goal link and no capability credit ÷ 1,000","K",140,0,150,"min",600,"Portfolio office",{kind:"sop",ref:"SOP-SX-02",title:"Review orphan work at the monthly portfolio board",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Flags each orphan project with its owner and spend to date"});
 M0("m_sx_gaps","Capabilities without a roadmap","Capabilities below their Year 1 target level with no funded roadmap item that reaches the target","",5,0,6,"min",20,"CIO office",{kind:"sop",ref:"SOP-MAT-02",title:"Turn an uncovered maturity gap into a funded demand request",agent:"Portfolio Agent",auto:false,state:"idle",prog:"Drafts a demand request for each uncovered capability gap"})}

/* ---------------- the project registry, read from the sources ---------------- */
function registry(snap){
 const reg=new Map(),bl=G(()=>BUDX.B().lines,[]),P=snap.P,today=G(()=>TODAY,0);
 const work=id=>{const ts=G(()=>PTASKS(id),[]);let n=0,d=0,ms=0,msd=0,fte=0;const ppl=new Set();
  ts.forEach(t=>{if(t.ms){ms++;if(t.pct>=100)msd++;return}n++;if(t.pct>=100)d++;const r=P&&P.R&&P.R[t.id];if(t.pct<100&&r&&r.es<=today&&today<r.ef){(t.res||[]).forEach(x=>fte+=x[1]);(t.asg||[]).forEach(a=>ppl.add(a[0]));if(t.own)ppl.add(t.own)}});
  return {n,d,ms,msd,fte:Math.round(fte*10)/10,ppl:ppl.size}};
 PROJ.forEach(p=>{const L=bl.filter(l=>l.p===p.id),s=k=>L.reduce((a,l)=>a+l[k],0);
  reg.set(p.id,{id:p.id,n:p.n,kind:"Project",owner:p.owner,funded:true,go:"ppm_proj",appr:L.length?s("appr"):p.bac*1e3,fcst:L.length?s("fcst"):p.bac*1e3,act:L.length?s("act"):p.paid*1e3,bud:true,w:work(p.id)})});
 (snap.L||[]).filter(d=>!(S.merged||{})[d.id]).forEach(d=>{const f=!!d.fund;reg.set(d.id,{id:d.id,n:d.n,kind:"Request",owner:d.sp||d.who||"",funded:f,go:"port",appr:f?d.cost*1e3:0,fcst:f?d.cost*1e3:0,act:0,req:d.cost*1e3,bud:false,w:{n:0,d:0,ms:0,msd:0,fte:(d.res||[]).reduce((a,x)=>a+x[1],0),ppl:0}})});
 reg.set("X1",{id:"X1",n:"Laptop refresh (run budget)",kind:"Run budget",owner:"IT operations",funded:true,go:"home",appr:140e3,fcst:140e3,act:0,bud:false,w:{n:0,d:0,ms:0,msd:0,fte:0,ppl:0}});
 if(G(()=>SCALE.on,false))G(()=>SCALE.projects(),[]).forEach(p=>{const paid=(p.paid!=null?p.paid:Math.round(p.bac*p.pct/100*.85))*1e3,f=p.status==="bad"?1.08:p.status==="warn"?1.03:1;
  reg.set(p.id,{id:p.id,n:p.n,kind:"Project",owner:p.owner||"",funded:true,go:"ppm_proj",appr:p.bac*1e3,fcst:Math.round(p.bac*1e3*f),act:paid,bud:false,gen:true,w:{n:0,d:0,ms:0,msd:0,fte:0,ppl:0,pct:p.pct}})});
 return reg}

/* ---------------- build the chain ---------------- */
let CK="",CV=null;
function build(){
 if(!(W.EXE&&W.MAT&&W.BUDX))return null;
 const Ex=EXE.E,snap=EXE.snap();
 const key=JSON.stringify([SX.ver,G(()=>SCALE.on,0),S.imsSlip,MAT.M.acc,MAT.M.as,MAT.M.tg,S.merged,S.conv,S.w,S.env,S.cap,Ex.links,Ex.objs.length]);
 if(key===CK&&CV)return CV;
 const goals=Ex.objs,leaves=MAT.leaves(),rows=MAT.crRows(),reg=registry(snap);
 /* rows carry the project info from the maturity engine; make sure every project they name exists in the registry */
 rows.forEach(r=>{const p=r.p;if(p&&p.id&&!reg.has(p.id))reg.set(p.id,{id:p.id,n:p.n,kind:p.kind||"Program",owner:p.owner||"",funded:!!p.funded,go:p.go||"plan",appr:0,fcst:0,act:0,bud:false,nobudget:true,w:{n:0,d:0,ms:0,msd:0,fte:0,ppl:0}})});
 const rowsOf={};rows.forEach(r=>{(rowsOf[r.n.id]=rowsOf[r.n.id]||[]).push(r)});
 /* goal weights of a project: the Strategy alignment links when present, else derived from the capabilities it credits */
 const lw=id=>Ex.links[id]||{},ls=id=>Object.values(lw(id)).reduce((a,v)=>a+v,0);
 const derived={};rows.forEach(r=>{const id=r.p&&r.p.id;if(!id)return;(r.n.objs||[]).forEach(o=>{(derived[id]=derived[id]||new Set()).add(o)})});
 const gw=id=>{if(ls(id)>0)return Object.assign({},lw(id));const s=derived[id];if(!s||!s.size)return {};const o={};s.forEach(g=>o[g]=1/s.size);return o};
 const gwc={};reg.forEach((p,id)=>gwc[id]=gw(id));
 const unl=id=>Math.max(0,1-Math.min(1,Object.values(gwc[id]||{}).reduce((a,v)=>a+v,0)));
 const flags=[],fseen=new Set();const F=(kind,id,t,sub,go,st)=>{const k=kind+"|"+id+"|"+(kind==="cap_noroad"||kind==="goal_nocap"?"":t);if(fseen.has(k))return;fseen.add(k);flags.push({kind,id,t,sub,go,st:st||"warn"})};
 /* count a project's roadmap rows inside each goal */
 const cnt={};goals.forEach(g=>{cnt[g.id]={};leaves.filter(n=>n.objs.includes(g.id)).forEach(n=>(rowsOf[n.id]||[]).forEach(r=>{const id=r.p&&r.p.id;if(id)cnt[g.id][id]=(cnt[g.id][id]||0)+1}))});
 const mk=(k,o)=>Object.assign({k,kids:[],m:{appr:0,fcst:0,act:0,req:0},ps:new Set(),fl:[],nfl:0},o);
 const addM=(a,b)=>{a.appr+=b.appr;a.fcst+=b.fcst;a.act+=b.act;a.req+=b.req||0};
 const projNode=(pid,gid,share,rowKey)=>{const p=reg.get(pid)||{id:pid,n:pid,kind:"Project",funded:false,appr:0,fcst:0,act:0,w:{n:0,d:0,ms:0,msd:0,fte:0,ppl:0}};
  const nd=mk("p:"+rowKey+":"+pid,{kind:"proj",id:pid,label:p.n,sub:p.kind+" · "+(p.owner||"no owner"),p,go:p.go});
  nd.m={appr:p.appr*share,fcst:p.fcst*share,act:p.act*share,req:(p.req||0)*share};nd.ps.add(pid);
  if(!p.funded&&p.kind==="Request")nd.fl.push({kind:"road_nofund",t:"Project not funded",fix:"Fund the request or move the roadmap item to a funded project."});
  if(p.nobudget)nd.fl.push({kind:"prog_nobudget",t:"No budget line",fix:"Program is credited on the roadmap but has no budget line in Budgets overall."});
  if(gid&&share===0&&p.funded)nd.fl.push({kind:"mismatch",t:"Not linked to this goal",fix:"Strategy alignment links this project to other goals only. Link it here or move the roadmap item."});
  return nd};
 const goalNodes=goals.map(g=>{
  const caps=leaves.filter(n=>n.objs.includes(g.id));
  const gn=mk("g:"+g.id,{kind:"goal",id:g.id,label:g.n,sub:"Owner "+(g.owner||"unassigned"),goal:g});
  caps.forEach(n=>{
   const rs=rowsOf[n.id]||[],c=MAT.cur(n),t1=MAT.tgtN(n,0),gap=Math.max(0,t1-c);
   const cn=mk("c:"+g.id+":"+n.id,{kind:"cap",id:n.id,label:n.name,sub:MAT.mname(n.model)+" · owner "+(n.owner||"unassigned"),n,cur:c,t1,t3:MAT.tgtN(n,1),t5:MAT.tgtN(n,2),gap});
   rs.forEach(r=>{
    const pid=r.p&&r.p.id,share=pid?((gwc[pid]||{})[g.id]||0)/(cnt[g.id][pid]||1):0;
    const rn=mk("r:"+g.id+":"+r.key,{kind:"road",id:r.key,label:"Level "+r.c.from+" to "+r.c.to+" ("+lvName(n,r.c.to)+")",sub:r.state+" · counts "+dtxt(r.cd),row:r,n,from:r.c.from,to:r.c.to,date:r.cd,st:r.state});
    if(!pid){rn.fl.push({kind:"road_noproj",t:"No project",fix:"Assign a funded project that delivers this level."});rn.m={appr:0,fcst:0,act:0,req:0}}
    else{const pn=projNode(pid,g.id,share,r.key);rn.kids.push(pn);rn.fl=rn.fl.concat([]);}
    cn.kids.push(rn)});
   const reach=rs.some(r=>r.c.to>=t1&&r.p&&r.p.funded);
   if(gap>.001&&!reach)cn.fl.push({kind:"cap_noroad",t:rs.length?"Roadmap does not reach the target":"No roadmap",fix:rs.length?"No funded roadmap item reaches level "+MAT.fv(t1)+".":"Add a roadmap item and a funded project."});
   gn.kids.push(cn)});
  /* projects linked to the goal with no capability path in it */
  const dir=[];reg.forEach((p,id)=>{const w=(gwc[id]||{})[g.id]||0;if(w>0&&p.funded&&!cnt[g.id][id])dir.push(id)});
  if(dir.length){const dn=mk("d:"+g.id,{kind:"direct",id:"direct:"+g.id,label:"Linked to this goal, no capability",sub:dir.length+" project"+(dir.length===1?"":"s")+" with no roadmap item here"});
   dir.forEach(id=>{const pn=projNode(id,g.id,(gwc[id]||{})[g.id],"direct");pn.fl.push({kind:"proj_nocap",t:"No capability or roadmap item",fix:"Name the capability this project improves and add a roadmap item."});dn.kids.push(pn)});gn.kids.push(dn)}
  if(!caps.length)gn.fl.push({kind:"goal_nocap",t:"No capability mapped",fix:"Map the capabilities this goal depends on."});
  return gn});
 /* orphan bucket: funded work, or the unlinked share of it, with no goal */
 const on=mk("o:orphan",{kind:"orphan",id:"orphan",label:"Not connected to any goal",sub:"Orphan work"});
 reg.forEach((p,id)=>{if(!p.funded)return;const u=unl(id);if(u<=0.0001)return;const pn=projNode(id,null,u,"orphan");pn.fl.push({kind:"proj_orphan",t:"No goal",fix:"Link the project to a goal in Strategy alignment, or stop it."});on.kids.push(pn)});
 /* roll up */
 const roll=nd=>{nd.kids.forEach(roll);if(nd.kind!=="proj"){nd.m={appr:0,fcst:0,act:0,req:0};nd.kids.forEach(k=>{addM(nd.m,k.m);k.ps.forEach(x=>nd.ps.add(x))})}
  nd.nfl=nd.fl.length+nd.kids.reduce((a,k)=>a+k.nfl,0);if(nd.kind==='goal')nd.kids.sort((a,b)=>(b.fl.length>0)-(a.fl.length>0)||(b.gap||0)-(a.gap||0)||b.m.appr-a.m.appr)};
 goalNodes.forEach(roll);roll(on);
 const wk=ps=>{const o={n:0,d:0,ms:0,msd:0,fte:0,ppl:0,pct:null};ps.forEach(id=>{const p=reg.get(id);if(!p||!p.w)return;o.n+=p.w.n;o.d+=p.w.d;o.ms+=p.w.ms;o.msd+=p.w.msd;o.fte+=p.w.fte;o.ppl+=p.w.ppl});o.fte=Math.round(o.fte*10)/10;return o};
 /* totals and reconciliation */
 let T={appr:0,fcst:0,act:0},PR={appr:0,fcst:0,act:0},RQ=0,RUN=0;
 reg.forEach(p=>{if(!p.funded)return;T.appr+=p.appr;T.fcst+=p.fcst;T.act+=p.act;if(p.kind==="Project"&&p.bud){PR.appr+=p.appr;PR.fcst+=p.fcst;PR.act+=p.act}else if(p.kind==="Request")RQ+=p.appr;else if(p.kind==="Run budget")RUN+=p.appr;});
 const trAppr=goalNodes.reduce((a,g)=>a+g.m.appr,0),orAppr=on.m.appr;
 const bud=G(()=>BUDX.T(BUDX.B().lines),{appr:0,fcst:0,act:0});
 const sa=G(()=>EXE.coverage(),null);
 /* gap register */
 goalNodes.forEach(g=>{if(g.fl.length)F("goal_nocap",g.id,g.label,"No capability is mapped to this goal","exe_mat","bad");
  g.kids.forEach(c=>{if(c.kind==="cap"&&c.fl.length)F("cap_noroad",c.id,c.label,c.fl[0].t+" · level "+MAT.fv(c.cur)+" of "+MAT.fv(c.t1)+" · "+g.label,"exe_mat",c.gap>=1?"bad":"warn");
   if(c.kind==="cap")c.kids.forEach(r=>{if(r.fl.length)F("road_noproj",r.id,c.label+": "+r.label,r.fl[0].t,"exe_mat");r.kids.forEach(p=>p.fl.forEach(f=>{if(f.kind==="road_nofund")F("road_nofund",r.id,c.label+": "+r.label,p.label+" is not funded","port")}))})})});
 on.kids.forEach(p=>F("proj_orphan",p.id,p.label,fm(p.m.appr)+" approved with no goal · "+p.p.kind,p.go,"bad"));
 reg.forEach((p,id)=>{if(p.nobudget&&p.funded)F("prog_nobudget",id,p.n,"Credited on the roadmap, no budget line","bud_lines")});
 const seenMm={};goalNodes.forEach(g=>g.kids.forEach(c=>{c.kids&&c.kids.forEach(r=>r.kids.forEach(p=>p.fl.filter(f=>f.kind==="mismatch").forEach(()=>{const k=p.id+"|"+g.id;if(!seenMm[k]){seenMm[k]=1;F("mismatch",p.id,p.label,"Credits a capability of "+g.label+" but is not linked to that goal","exe_strat","info")}})))}));
 leaves.forEach(n=>{if(!(n.objs||[]).length)F("cap_nogoal",n.id,n.name,"Capability is not mapped to any goal","exe_mat","info")});
 const cnt2=k=>flags.filter(f=>f.kind===k).length;
 const mapped=leaves.filter(n=>(n.objs||[]).length),below=mapped.filter(n=>MAT.tgtN(n,0)-MAT.cur(n)>.001);
 const nRoad=rows.length,traced=reg.size?[...reg.values()].filter(p=>p.funded&&unl(p.id)<.9999).length:0,nFunded=[...reg.values()].filter(p=>p.funded).length;
 const out={goals,goalNodes,orphan:on,reg,rows,leaves,mapped,flags,gwc,wk,T,PR,RQ,RUN,trAppr,orAppr,bud,sa,snap,
  cover:T.appr?trAppr/T.appr*100:100,nBelow:below.length,nNoRoad:cnt2("cap_noroad"),nRoad,nRoadNoProj:cnt2("road_noproj")+cnt2("road_nofund"),nOrphan:on.kids.length,traced,nFunded,nodesById:null};
 /* live metric values */
 if(typeof METRICS!=="undefined"){const set=(id,v)=>{if(METRICS[id]){METRICS[id].cur=v;METRICS[id].tr[7]=v}};set("m_sx_cover",Math.round(out.cover*10)/10);set("m_sx_orphan",Math.round(orAppr/1e3));set("m_sx_gaps",out.nNoRoad)}
 CK=key;CV=out;return out}

/* ---------------- filters ---------------- */
function prune(nd,pf,gapsOnly){
 if(nd.kind==="proj"){if(pf&&!pf.has(nd.id))return null;if(gapsOnly&&!nd.fl.length)return null;return nd}
 const kids=nd.kids.map(k=>prune(k,pf,gapsOnly)).filter(Boolean);
 if((pf||gapsOnly)&&nd.kind!=="goal"&&!kids.length&&!(gapsOnly&&nd.fl.length&&!pf))return null;
 if(pf&&nd.kind==="road"&&!kids.length)return null;
 if(gapsOnly&&nd.kind==="goal"&&!kids.length&&!nd.fl.length)return null;
 return Object.assign({},nd,{kids})}
SX.f=SX.f||{};
const usePK=()=>!!(W.PICKER&&typeof PICKER.html==="function");
function selOf(id,all){if(usePK()){const v=(SX.f[id]||[]).filter(x=>all.includes(x));return v.length?v:all}const m=mpGet(id);return m.length?m:all}
function view(D){
 const gs=selOf("sx_goal",D.goals.map(g=>g.id)),ps=selOf("sx_proj",[...D.reg.keys()]),allP=ps.length===[...D.reg.keys()].length;
 const pf=allP?null:new Set(ps);
 let g=D.goalNodes.filter(n=>gs.includes(n.id)).map(n=>prune(n,pf,SX.gaps)).filter(Boolean);
 let o=gs.length===D.goals.length?prune(D.orphan,pf,SX.gaps):null;
 if(o&&!o.kids.length)o=null;
 return {goals:g,orphan:o}}

/* ---------------- tree ---------------- */
const KL={goal:"Goal",cap:"Capability",road:"Roadmap",proj:"Project",direct:"Direct",orphan:"Orphan"};
const isOpen=nd=>SX.open[nd.k]!==undefined?SX.open[nd.k]:((nd.kind==="goal"&&innerWidth>600)||nd.kind==="orphan"&&false);
function levelCell(D,nd){
 if(nd.kind==="cap"){const mx=5;return `<span class="sx-lv" title="Level ${MAT.fv(nd.cur)} now, ${MAT.fv(nd.t1)} Year 1 target"><i style="width:${Math.min(100,nd.cur/mx*100)}%"></i><b style="left:${Math.min(100,nd.t1/mx*100)}%"></b></span><span class="sx-lt">${MAT.fv(nd.cur)} to ${MAT.fv(nd.t1)}${nd.gap>.001?` <em>gap ${MAT.fv(nd.gap)}</em>`:""}</span>`}
 if(nd.kind==="goal"){const R=G(()=>MAT.roll(nd.kids.filter(k=>k.kind==="cap").map(k=>k.n)),null);return R&&R.n?`<span class="sx-lt">${MAT.fv(R.cur)} to ${MAT.fv(R.t1)} <em>${U.esc(R.n)} capabilities</em></span>`:`<span class="sx-lt muted">none</span>`}
 if(nd.kind==="road")return `<span class="sx-lt">L${nd.from} to L${nd.to}</span>`;
 if(nd.kind==="proj"){const p=nd.p;return `<span class="sx-lt">${p.funded?"Funded":"Not funded"}</span>`}
 return ""}
function workCell(D,nd){const w=D.wk(nd.ps);if(nd.kind==="goal"||nd.kind==="cap"||nd.kind==="road"||nd.kind==="proj"||nd.kind==="orphan"||nd.kind==="direct"){
  if(!nd.ps.size)return `<span class="muted">none</span>`;
  const t=w.n?`${w.d}/${w.n} tasks`:"",ms=w.ms?`${w.msd}/${w.ms} milestones`:"",f=w.fte?`${w.fte} FTE now`:"";
  const pct=nd.kind==="proj"&&nd.p.w.pct!=null?`${nd.p.w.pct}% complete`:"";
  return `<span>${[t,ms,pct,f].filter(Boolean).join(" · ")||"no tasks"}</span>`}return ""}
function rowHTML(D,nd,depth){
 const open=isOpen(nd),has=nd.kids.length>0,k=E(nd.k);
 const fl=nd.fl.map(f=>`<span class="pill ${f.kind==="mismatch"||f.kind==="cap_nogoal"?"info":f.kind==="proj_orphan"||f.kind==="goal_nocap"?"bad":"warn"} sx-flag" title="${E(f.fix||"")}">${E(f.t)}</span>`).join("");
 const sub=nd.nfl-nd.fl.length;
 const roll=(!open||!has)?"":"";
 const link=nd.kind==="proj"?`<button type="button" class="sx-open" data-sx-open="${E(nd.kind)}:${E(nd.id)}:${E(nd.go||"")}" aria-label="Open ${E(nd.label)}">Open</button>`:nd.kind==="cap"?`<button type="button" class="sx-open" data-sx-open="cap:${E(nd.id)}" aria-label="Open capability ${E(nd.label)}">Open</button>`:nd.kind==="goal"?`<button type="button" class="sx-open" data-sx-open="goal:${E(nd.id)}" aria-label="Open goal ${E(nd.label)}">Open</button>`:nd.kind==="road"?`<button type="button" class="sx-open" data-sx-edit="cr|${E(nd.id)}" aria-label="Edit this roadmap item">Edit</button>`:"";
 const mon=nd.kind==="road"&&!nd.kids.length?`<span class="muted">none</span>`:`<b data-role="metric">${fm(nd.m.appr)}</b>${nd.m.req&&!nd.m.appr?`<small class="muted">${fm(nd.m.req)} requested</small>`:""}`;
 let h=`<div class="sx-row sx-${nd.kind} ${nd.nfl?"has-fl":""} ${SX.sel===nd.k?"is-sel":""}" role="treeitem" aria-level="${depth+1}" ${has?`aria-expanded="${open}"`:""} style="--d:${depth}">
  <div class="sx-name">${has?`<button type="button" class="sx-tg" data-sx-tg="${k}" aria-label="${open?"Collapse":"Expand"} ${E(nd.label)}"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`:`<span class="sx-tg sx-leaf" aria-hidden="true"></span>`}
   <span class="sx-body"><span class="sx-top"><span class="sx-kind">${KL[nd.kind]}</span>${has?`<button type="button" class="sx-lab" data-sx-tg="${k}">${E(nd.label)}</button>`:`<span class="sx-lab">${E(nd.label)}</span>`}</span><span class="sx-sub muted small">${E(nd.sub||"")}</span></span></div>
  <div class="sx-c sx-clv" data-l="Level">${levelCell(D,nd)}</div>
  <div class="sx-c sx-$" data-l="Approved">${mon}</div>
  <div class="sx-c sx-$" data-l="Forecast"><span data-role="metric">${nd.kind==="road"&&!nd.kids.length?"":fm(nd.m.fcst)}</span>${nd.m.fcst-nd.m.appr>500?`<small class="bad-t">${fmd(nd.m.fcst-nd.m.appr)}</small>`:""}</div>
  <div class="sx-c sx-$" data-l="Actual"><span data-role="metric">${nd.kind==="road"&&!nd.kids.length?"":fm(nd.m.act)}</span></div>
  <div class="sx-c sx-wk" data-l="Work">${workCell(D,nd)}</div>
  <div class="sx-c sx-fl" data-l="Flags">${fl}${sub>0&&!open?`<span class="pill mute sx-flag" title="Gaps further down this branch">${sub} below</span>`:""}</div>
  <div class="sx-c sx-ac">${link}</div></div>`;
 if(has&&open){const kids=nd.kids,lim=SX.more&&SX.more[nd.k]?1e9:30;h+=`<div role="group">${kids.slice(0,lim).map(c=>rowHTML(D,c,depth+1)).join("")}${kids.length>lim?`<div class="sx-more" style="--d:${depth+1}"><button type="button" class="btn quiet" data-sx-more="${k}">Show ${kids.length-lim} more of ${kids.length}</button></div>`:""}</div>`}
 return h}
function treeHTML(D){
 const V=view(D);const all=V.goals.concat(V.orphan?[V.orphan]:[]);
 if(!all.length)return empty("Nothing matches these filters","Clear a filter or turn off Gaps only.");
 return `<div class="sx-head" aria-hidden="true"><span>Goal, capability, roadmap item, project</span><span>Level</span><span>Approved</span><span>Forecast</span><span>Actual</span><span>Work</span><span>Gaps</span><span></span></div><div role="tree" aria-label="Strategy to execution tree">${all.map(n=>rowHTML(D,n,0)).join("")}</div>`}

/* ---------------- trace graph (left to right) ---------------- */
function graphHTML(D){
 const V=view(D),CW=172,GAP=42,NH=46,VG=10,PADX=12,PADY=34,LIM={c:14,r:18,p:14};
 const roads=[],projs=[],edges=[],eseen=new Set(),seen={r:{},p:{}};
 const E2=(a,b)=>{const k=a+">"+b;if(!eseen.has(k)){eseen.add(k);edges.push([a,b])}};
 const capMap=new Map();V.goals.forEach(g=>g.kids.forEach(c=>{if(c.kind!=="cap")return;let e=capMap.get(c.id);if(!e){e={c,gs:[]};capMap.set(c.id,e)}e.gs.push(g)}));
 const capAll=[...capMap.values()].sort((a,b)=>(b.c.nfl>0)-(a.c.nfl>0)||b.c.gap-a.c.gap||b.c.m.appr-a.c.m.appr);
 const showCaps=capAll.slice(0,LIM.c);
 showCaps.forEach(x=>{x.gs.forEach(g=>E2(g.k,"C:"+x.c.id));x.c.kids.forEach(r=>{if(roads.length<LIM.r&&!seen.r[r.id]){seen.r[r.id]=1;roads.push(Object.assign({cap:x.c},r))}if(seen.r[r.id]){E2("C:"+x.c.id,"R:"+r.id);r.kids.forEach(p=>{const pk="P:"+p.id;if(!seen.p[pk]&&projs.length<LIM.p){seen.p[pk]=1;projs.push(p)}if(seen.p[pk])E2("R:"+r.id,pk)})}})});
 const goalsN=V.goals,pos={},cols=[goalsN.map(g=>({key:g.k,nd:g})),showCaps.map(x=>({key:"C:"+x.c.id,nd:x.c})),roads.map(r=>({key:"R:"+r.id,nd:r})),projs.map(p=>({key:"P:"+p.id,nd:p}))];
 const maxN=Math.max(...cols.map(c=>c.length),1),H=PADY+maxN*(NH+VG)+8,Wd=PADX*2+5*CW+4*GAP,colX=i=>PADX+i*(CW+GAP);
 cols.forEach((col,i)=>{const off=(maxN-col.length)*(NH+VG)/2;col.forEach((o,j)=>{pos[o.key]={x:colX(i),y:PADY+off+j*(NH+VG),nd:o.nd,i}})});
 const t=(s,n)=>{s=String(s);return s.length>n?s.slice(0,n-1)+"…":s};
 const hl=new Set();if(SX.sel&&pos[SX.sel]){hl.add(SX.sel);const walk=fwd=>{const st=[SX.sel],vis=new Set(st);while(st.length){const k=st.pop();edges.filter(e=>fwd?e[0]===k:e[1]===k).forEach(e=>{const n=fwd?e[1]:e[0];if(!vis.has(n)){vis.add(n);hl.add(n);st.push(n)}})}};walk(true);walk(false)}
 const dim=k=>SX.sel&&pos[SX.sel]&&!hl.has(k)?" sx-dim":"";
 let s=`<svg class="sx-svg" viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}" role="img" aria-label="Trace graph from goals to capabilities, roadmap items, projects, money and work">`;
 ["Goals","Capabilities","Roadmap items","Projects","Money and work"].forEach((l,i)=>{s+=`<text class="sx-colh" x="${colX(i)}" y="18">${l}</text>`});
 edges.forEach(([a,b])=>{const A=pos[a],B=pos[b];if(!A||!B)return;const x1=A.x+CW,y1=A.y+NH/2,x2=B.x,y2=B.y+NH/2,mx=(x1+x2)/2;s+=`<path class="sx-edge${(SX.sel&&hl.has(a)&&hl.has(b))?" on":""}${dim(a)}" d="M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`});
 const flagCls=nd=>nd.fl.length?(nd.fl.some(f=>f.kind==="proj_orphan"||f.kind==="goal_nocap")?" bad":" warn"):"";
 Object.keys(pos).forEach(key=>{const {x,y,nd,i}=pos[key];
  let l1=t(i===2?"L"+nd.from+" to L"+nd.to+" · "+nd.cap.label:nd.label,i===0?24:25),l2="";
  if(i===0)l2=fm(nd.m.appr)+" approved";
  else if(i===1)l2="Level "+MAT.fv(nd.cur)+" to "+MAT.fv(nd.t1)+(nd.gap>.001?" · gap "+MAT.fv(nd.gap):"");
  else if(i===2)l2=t(nd.st,18)+" · "+dtxt(nd.date).replace(/, \d{4}/,"");
  else l2=t((nd.p.kind||"")+" · "+(nd.p.owner||"no owner"),27);
  s+=`<g class="sx-n sx-n${i}${flagCls(nd)}${SX.sel===key?" sel":""}${dim(key)}" data-sx-sel="${E(key)}" tabindex="0" role="button" aria-label="${E(nd.label)}"><rect x="${x}" y="${y}" width="${CW}" height="${NH}" rx="9"/><text class="l1" x="${x+9}" y="${y+19}">${E(l1)}</text><text class="l2" x="${x+9}" y="${y+36}">${E(l2)}</text><title>${E(nd.label)}</title></g>`;
  if(i===3){const p=nd.p,mx=Math.max(p.appr,p.fcst,1),x5=colX(4),bw=CW-18,wk=p.w,pc=wk.n?Math.round(wk.d/wk.n*100):(wk.pct!=null?wk.pct:0);
   s+=`<path class="sx-edge${dim(key)}" d="M${x+CW} ${y+NH/2}H${x5}"/><g class="sx-n sx-n4${dim(key)}" data-sx-sel="${E(key)}"><rect x="${x5}" y="${y}" width="${CW}" height="${NH}" rx="9"/><text class="l1" x="${x5+9}" y="${y+16}">${fm(p.appr)} · ${fm(p.fcst)} · ${fm(p.act)}</text>
    <rect class="b0" x="${x5+9}" y="${y+22}" width="${bw}" height="5" rx="2.5"/><rect class="b1" x="${x5+9}" y="${y+22}" width="${bw*Math.min(1,p.act/mx)}" height="5" rx="2.5"/><rect class="b2" x="${x5+9+bw*Math.min(1,p.appr/mx)-1}" y="${y+19}" width="2" height="11"/>
    <text class="l2" x="${x5+9}" y="${y+41}">${pc}% done${wk.fte?" · "+wk.fte+" FTE":""}${wk.ppl?" · "+wk.ppl+" people":""}</text></g>`}});
 s+=`</svg>`;
 const more=[capAll.length>LIM.c?`${capAll.length-LIM.c} more capabilities`:"",roads.length>=LIM.r?"more roadmap items":""].filter(Boolean).join(", ");
 return `<div class="sx-graphwrap tscroll">${s}</div>${legend([["Approved (tick), actual (fill), then forecast","--accent"],["Gap flag on this node","--warn-f"],["Orphan or unmapped","--bad-f"]])}<p class="muted small" style="margin-top:8px">Select a node to light its whole path. Money column reads approved, forecast, actual. Showing the ${Math.min(LIM.c,capAll.length)} capabilities with the most gaps${more?"; "+more+" are hidden, so filter by goal or project to see them":""}.</p>`}

/* ---------------- gaps ---------------- */
const GK=[["goal_nocap","Goal with no capability mapping","bad"],["cap_noroad","Capability below target with no roadmap that reaches it","warn"],["road_noproj","Roadmap item with no project","warn"],["road_nofund","Roadmap item whose project is not funded","warn"],["proj_orphan","Orphan work: funded project with no goal","bad"],["prog_nobudget","Funded program with no budget line","info"],["mismatch","Roadmap credits a goal the project is not linked to","info"],["cap_nogoal","Capability not mapped to any goal","info"]];
function gapsHTML(D){
 const groups=GK.map(([k,l,st])=>({key:k,label:l,rows:D.flags.filter(f=>f.kind===k).map((f,i)=>({id:f.id+"|"+i,t:f.t,sub:f.sub,tag:String(f.id).split("|")[0],st:f.st,go:()=>{if(/^(CAP|[A-Z]+\.\d)/.test(f.id)&&G(()=>MAT.openCap,0))return MAT.openCap(f.id);go(f.go||"exe_mat")}}))})).filter(g=>g.rows.length);
 if(!groups.length)return empty("No gaps","Every goal reaches a capability, a roadmap item and a funded project.");
 return `<div class="statrow">${GK.map(([k,l,st])=>{const n=D.flags.filter(f=>f.kind===k).length;return kpi(l,n,n?"open":"none",{keep:true})}).join("")}</div>`+lrHTML({id:"sx_gaps",groups,limit:8,search:true})}

/* ---------------- mapping (editable) ---------------- */
function linkRows(D){
 const out=[];D.leaves.forEach(n=>{(n.objs||[]).forEach(g=>out.push({id:"gc|"+n.id+"|"+g,type:"gc",from:(D.goals.find(x=>x.id===g)||{n:g}).n,to:n.name,state:"Linked"}));
  if(!(n.objs||[]).length)out.push({id:"gc|"+n.id+"|",type:"gc",from:"(no goal)",to:n.name,state:"Missing"})});
 D.rows.forEach(r=>{out.push({id:"cr|"+r.key,type:"cr",from:r.n.name,to:"L"+r.c.from+" to L"+r.c.to+" by "+dtxt(r.cd).replace(/, \d{4}/,""),state:r.state});
  out.push({id:"rp|"+r.key,type:"rp",from:"L"+r.c.from+" to L"+r.c.to+" · "+r.n.name,to:(r.p&&r.p.id?r.p.id+" "+r.p.n:"(no project)"),state:r.p&&r.p.id?(r.p.funded?"Funded":"Not funded"):"Missing"})});
 return out.map(r=>Object.assign(r,{lt:LINKS[r.type],own:SX.own[r.type].o,bk:SX.own[r.type].b}))}
function mappingHTML(D){
 const ow=Object.keys(LINKS).map(k=>`<tr><td>${E(LINKS[k])}</td><td>${typeof pchip==="function"?pchip(SX.own[k].o):E(SX.own[k].o)}</td><td>${typeof pchip==="function"?pchip(SX.own[k].b):E(SX.own[k].b)}</td></tr>`).join("");
 return `<div class="row" style="margin-bottom:12px"><button class="btn primary" data-sx-form="gc">Map goals to a capability</button><button class="btn" data-sx-form="crnew">Add a roadmap item</button><button class="btn" data-sx-form="goal">Link a project to a goal</button><button class="btn quiet" data-sx-form="own">Change owners</button></div>
 <p class="muted small" style="margin-bottom:10px">Each row below is one link. Select a row to edit it. Edits write to the maturity models and to Strategy alignment, so every screen shows the same chain.</p>
 <div class="tscroll" style="margin-bottom:14px"><table class="tbl"><thead><tr><th>Link register</th><th>Owner</th><th>Backup</th></tr></thead><tbody>${ow}</tbody></table></div>
 ${btHTML({id:"sx_links",cols:[{k:"lt",label:"Link type"},{k:"from",label:"From",wrap:1},{k:"to",label:"To",wrap:1},{k:"state",label:"State",fmt:r=>`<span class="pill ${/Missing|Not funded/.test(r.state)?"bad":/Awaiting|Planned/.test(r.state)?"info":"good"}">${E(r.state)}</span>`},{k:"own",label:"Owner"},{k:"bk",label:"Backup"}],rows:()=>linkRows(D),key:"id",h:420,rowH:44,facets:["lt","state"],exportName:"strategy-links",open:id=>editLink(id)})}`}

function pickRow(key){const D=build();return D&&D.rows.find(r=>r.key===key)}
function whoOpts(){return G(()=>PEOPLE.map(p=>p[0]),[])}
function ownFields(t){return [{section:"Who is accountable"},{k:"owner",label:"Mapping owner",type:"people",req:true},{k:"backup",label:"Backup",type:"people",req:true}]}
function saved(msg,det){SX.ver++;CK="";G(()=>MAT.sync(),0);audit(msg,det);toast(msg,"good");closeDrawer();render()}
function editLink(id){const a=String(id).split("|");
 if(a[0]==="gc"){gcForm(a[1]);return}
 if(a[0]==="cr"||a[0]==="rp"){crForm(a.slice(1).join("|"));return}}
function gcForm(capId){const D=build();const n=D.leaves.find(x=>x.id===capId)||D.leaves[0];
 openForm({id:"sx_gc",title:"Map goals to a capability",story:"A capability can serve several goals. Money and work under each goal follow this mapping, so Strategy to execution and Maturity models agree.",submit:"Save mapping",
  fields:[{section:"Capability"},{k:"cap",label:"Capability",type:"select",opts:D.leaves.map(x=>[x.id,x.name+" ("+MAT.mname(x.model)+")"]),req:true},{k:"goals",label:"Goals it supports",type:"multi",opts:D.goals.map(g=>[g.id,g.n])}].concat(ownFields()),
  defaults:{cap:n.id,goals:n.objs.slice(),owner:SX.own.gc.o,backup:SX.own.gc.b},
  live:v=>{const c=D.leaves.find(x=>x.id===v.cap);return c?`<p class="story">${E(c.name)} is at level ${MAT.fv(MAT.cur(c))} with a Year 1 target of ${MAT.fv(MAT.tgtN(c,0))}. ${(v.goals||[]).length?"It will appear under "+(v.goals||[]).length+" goal"+((v.goals||[]).length===1?"":"s")+".":"With no goal it is listed as unmapped."}</p>`:""},
  onSubmit:v=>{const c=D.leaves.find(x=>x.id===v.cap);if(!c)return;c.objs=(v.goals||[]).slice();SX.own.gc={o:v.owner,b:v.backup};saved("Mapped capability to goals",c.name+" → "+(c.objs.join(", ")||"none"))}})}
function crForm(key){const D=build();const r=D.rows.find(x=>x.key===key);if(!r){toast("Roadmap item not found","warn");return}
 const projOpts=[["","(no project yet)"]].concat([...D.reg.values()].filter(p=>p.kind!=="Run budget").slice(0,300).map(p=>[p.id,p.id+" "+p.n+(p.funded?"":" (not funded)")]));
 openForm({id:"sx_cr",title:"Edit roadmap item",story:"Moves "+r.n.name+" from level "+r.c.from+" to "+r.c.to+". Change the project that delivers it, the lag until the level counts, or remove it.",submit:"Save roadmap item",
  fields:[{section:"Roadmap item"},{k:"proj",label:"Delivering project",type:"select",opts:projOpts},{k:"lag",label:"Work days after delivery until the level counts",type:"number",min:0,max:400},{k:"del",label:"Remove this roadmap item",type:"toggle"}].concat(ownFields()),
  defaults:{proj:r.c.p||"",lag:r.c.lag,del:false,owner:SX.own.cr.o,backup:SX.own.cr.b},
  onSubmit:v=>{if(v.del){r.n.cr=r.n.cr.filter(c=>c!==r.c);saved("Removed roadmap item",r.n.name)}else{r.c.p=v.proj;r.c.lag=+v.lag||0;SX.own.cr={o:v.owner,b:v.backup};SX.own.rp={o:v.owner,b:v.backup};saved("Updated roadmap item",r.n.name+" → "+(v.proj||"no project"))}}})}
function crNewForm(){const D=build();
 const projOpts=[["","(no project yet)"]].concat([...D.reg.values()].filter(p=>p.kind!=="Run budget").slice(0,300).map(p=>[p.id,p.id+" "+p.n+(p.funded?"":" (not funded)")]));
 openForm({id:"sx_crn",title:"Add a roadmap item",story:"A roadmap item says which project moves a capability from one level to the next, and how long after delivery the new level counts. It appears under every goal the capability serves.",submit:"Add roadmap item",
  fields:[{section:"Roadmap item"},{k:"cap",label:"Capability",type:"select",opts:D.leaves.map(x=>[x.id,x.name+" (level "+MAT.fv(MAT.cur(x))+")"]),req:true},{k:"from",label:"From level",type:"number",min:1,max:5,req:true},{k:"to",label:"To level",type:"number",min:2,max:5,req:true},{k:"proj",label:"Delivering project",type:"select",opts:projOpts},{k:"lag",label:"Work days after delivery until the level counts",type:"number",min:0,max:400}].concat(ownFields()),
  defaults:{cap:(D.leaves.find(n=>MAT.tgtN(n,0)>MAT.cur(n)&&!(D.rows.some(r=>r.n.id===n.id)))||D.leaves[0]).id,from:2,to:3,proj:"",lag:30,owner:SX.own.cr.o,backup:SX.own.cr.b},
  onSubmit:v=>{const c=D.leaves.find(x=>x.id===v.cap);if(!c)return;if(+v.to<=+v.from){toast("The target level must be above the start level","warn");return}c.cr.push({p:v.proj,ms:v.proj&&/^PR/.test(v.proj)?(G(()=>PTASKS(v.proj).filter(t=>t.ms).slice(-1)[0].id,"CI")):"CI",from:+v.from,to:+v.to,lag:+v.lag||0,conf:.6});SX.own.cr={o:v.owner,b:v.backup};saved("Added roadmap item",c.name+" L"+v.from+" to L"+v.to)}})}
function goalForm(){const D=build();
 openForm({id:"sx_goal",title:"Link a project to a goal",story:"Sets how much of a project's money counts toward a goal in Strategy alignment. Weights across goals should add to 100%.",submit:"Save link",
  fields:[{section:"Link"},{k:"proj",label:"Project or request",type:"select",opts:[...D.reg.values()].slice(0,300).map(p=>[p.id,p.id+" "+p.n]),req:true},{k:"goal",label:"Goal",type:"select",opts:D.goals.map(g=>[g.id,g.n]),req:true},{k:"w",label:"Share of the project toward this goal (%)",type:"number",min:0,max:100,req:true}].concat(ownFields()),
  defaults:{proj:(D.orphan.kids[0]||{}).id||[...D.reg.keys()][0],goal:D.goals[0].id,w:100,owner:SX.own.rp.o,backup:SX.own.rp.b},
  onSubmit:v=>{const L=EXE.E.links;L[v.proj]=L[v.proj]||{};if(+v.w>0)L[v.proj][v.goal]=(+v.w)/100;else delete L[v.proj][v.goal];SX.own.rp={o:v.owner,b:v.backup};saved("Linked project to goal",v.proj+" → "+v.goal+" at "+v.w+"%")}})}
function ownForm(){openForm({id:"sx_own",title:"Owners of the strategy-to-portfolio mapping",story:"Each link register has one accountable person and one backup. Both are shown on this screen and in the platform ownership register.",submit:"Save owners",
  fields:[{section:"Goal to capability"},{k:"o1",label:"Owner",type:"people",req:true},{k:"b1",label:"Backup",type:"people",req:true},{section:"Capability to roadmap item"},{k:"o2",label:"Owner",type:"people",req:true},{k:"b2",label:"Backup",type:"people",req:true},{section:"Roadmap item to project"},{k:"o3",label:"Owner",type:"people",req:true},{k:"b3",label:"Backup",type:"people",req:true}],
  defaults:{o1:SX.own.gc.o,b1:SX.own.gc.b,o2:SX.own.cr.o,b2:SX.own.cr.b,o3:SX.own.rp.o,b3:SX.own.rp.b},
  onSubmit:v=>{SX.own={gc:{o:v.o1,b:v.b1},cr:{o:v.o2,b:v.b2},rp:{o:v.o3,b:v.b3}};saved("Changed mapping owners","")}})}

/* ---------------- record chain (the old trace, kept as a view) ---------------- */
function chainView(){
 if(typeof flowSVG!=="function"||typeof chainHTML!=="function")return empty("Record lineage is not available","");
 const r=N(S.rec),recs=["I2","I1","INC1","B2","PR1","R1"];
 return `<div class="row" style="margin-bottom:12px"><span class="eyebrow">Follow one record</span><div class="recchips">${recs.map(id=>`<button class="chip" data-rec-pick="${id}" aria-pressed="${S.rec===id}">${E(N(id).n)}</button>`).join("")}</div>${typeof keyPop==="function"?keyPop():""}</div>
 <div class="card glass flowcard"><div class="flowscroll flow">${flowSVG()}</div></div>
 <div class="card glass" style="margin-top:18px"><div class="cardhead"><div><h3>${E(r.n)}: where it comes from and what it touches</h3><span class="muted small">${E(r.story)}</span></div><button class="btn" data-impact="${S.rec}">Run impact analysis</button></div>${chainHTML(S.rec)}</div>
 <div style="margin-top:18px">${tableHTML()}</div>`}

/* ---------------- reconciliation ---------------- */
function reconHTML(D){
 const eq=(a,b)=>Math.abs(a-b)<1000;
 const line=(l,a,b,src,go)=>`<tr><td>${E(l)}</td><td class="num">${fm(a)}</td><td class="num">${b==null?"":fm(b)}</td><td>${b==null?"":eq(a,b)?'<span class="pill good">Matches</span>':'<span class="pill warn">'+fmd(a-b)+'</span>'}</td><td><button type="button" class="sx-open" data-go="${go}">${E(src)}</button></td></tr>`;
 const bridge=D.PR.appr+D.RQ+D.RUN;
 return card("Totals reconcile to Budgets and the portfolio","The tree adds up to the same numbers as the screens it reads from. Projects split across goals by their Strategy alignment weights; a project with no weights splits across the goals its capabilities serve.",
 `<div class="tscroll"><table class="tbl"><thead><tr><th>Check</th><th>This screen</th><th>Other screen</th><th>Result</th><th>Source</th></tr></thead><tbody>
 ${line("Approved, project budget lines",D.PR.appr,D.bud.appr,"Budgets overall","bud_over")}
 ${line("Forecast, project budget lines",D.PR.fcst,D.bud.fcst,"Budgets overall","bud_over")}
 ${line("Actual, project budget lines",D.PR.act,D.bud.act,"Budgets overall","bud_over")}
 ${line("Approved, projects (portfolio snapshot)",D.PR.appr,D.snap.approved*1e3,"Leadership dashboard","exe_dash")}
 ${line("Funded work: budgeted projects + funded requests + run budget",bridge,D.T.appr,"Strategy alignment","exe_strat")}
 ${line("Goal-linked + orphan = funded work",D.trAppr+D.orAppr,D.T.appr,"This tree","strat_exec")}
 </tbody></table></div>
 <dl class="kv" style="margin-top:12px"><dt>Reaches a goal</dt><dd data-role="metric">${fm(D.trAppr)} of ${fm(D.T.appr)} (${Math.round(D.cover)}%)</dd><dt>Orphan spend</dt><dd data-role="metric">${fm(D.orAppr)} across ${D.nOrphan} project${D.nOrphan===1?"":"s"}</dd><dt>Funded requests not yet in a budget line</dt><dd>${fm(D.RQ)}</dd><dt>Run budget with no project</dt><dd>${fm(D.RUN)}</dd></dl>`)}

/* ---------------- screen ---------------- */
function kpis(D){
 return `<div class="statrow">${[
  kpi("Goals",D.goals.length,D.goalNodes.filter(g=>g.nfl).length+" with gaps",{keep:true}),
  kpi("Capabilities below target",D.nBelow+" of "+D.mapped.length,D.nNoRoad+" without a roadmap",{metric:"m_sx_gaps",keep:true}),
  kpi("Roadmap items",D.nRoad,D.nRoadNoProj+" without a funded project",{keep:true}),
  kpi("Funded projects traced",D.traced+" of "+D.nFunded,D.nOrphan+" orphan",{keep:true}),
  kpi("Reaches a goal",Math.round(D.cover)+"%",fm(D.trAppr)+" of "+fm(D.T.appr),{metric:"m_sx_cover",keep:true}),
  kpi("Orphan spend",fm(D.orAppr),D.nOrphan+" project"+(D.nOrphan===1?"":"s"),{metric:"m_sx_orphan",keep:true})].join("")}</div>`}
function pickers(D){
 const px=cfg=>usePK()?PICKER.html({id:cfg.id,label:cfg.label,multi:true,source:cfg.opts,value:SX.f[cfg.id]||[],none:cfg.all,placeholder:cfg.all,noun:cfg.label,onPick:v=>{SX.f[cfg.id]=v;render()}}):mpHTML(cfg);
 const projs=[...D.reg.values()].sort((a,b)=>b.appr-a.appr).map(p=>({v:p.id,l:p.id+" "+p.n,sub:fm(p.appr),grp:p.kind}));
 return `<div class="row sx-filters">${px({id:"sx_goal",label:"Goals",opts:D.goals.map(g=>({v:g.id,l:g.n,sub:g.owner})),all:"All goals"})}${px({id:"sx_proj",label:"Projects",opts:projs,all:"All projects"})}
 <button type="button" class="chip" data-sx-gaps aria-pressed="${!!SX.gaps}">Gaps only</button><button type="button" class="chip" data-sx-all="1">Expand all</button><button type="button" class="chip" data-sx-all="0">Collapse all</button></div>`}
function screen(){
 const D=build();if(!D)return `<div class="screen">${hero("Strategy and performance","Strategy to execution","Required modules are not loaded.","")}</div>`;
 const t=S.v.sx||0;
 const pk=pickers(D);const tree=`<div class="sx-tree" id="sx-tree">${treeHTML(D)}</div>`;
 const worst=D.flags.filter(f=>f.st==="bad").length;
 return `<div class="screen sx-screen">${hero("Strategy and performance","Strategy to execution",`<b data-role="metric">${D.goals.length}</b> goals depend on <b data-role="metric">${D.mapped.length}</b> capabilities; <b data-role="metric">${D.nBelow}</b> are below their Year 1 target and <b data-role="metric">${D.nNoRoad}</b> of those have no roadmap that reaches it. <b data-role="metric">${D.nRoad}</b> roadmap items are delivered by <b data-role="metric">${D.traced}</b> funded projects. <b data-role="metric">${fm(D.trAppr)}</b> of <b data-role="metric">${fm(D.T.appr)}</b> funded work reaches a goal; <b data-role="metric">${fm(D.orAppr)}</b> is orphan work.`,
  `<div class="row">${fchip("m_sx_cover")}${fchip("m_sx_orphan")}${fchip("m_sx_gaps")}${typeof stdChip==="function"?stdChip("togaf","Business capability to project mapping follows the TOGAF capability-based planning idea."):""}<button class="btn primary" data-sx-form="crnew">Add a roadmap item</button><button class="btn" data-sx-form="gc">Map goals to a capability</button>${whyPop("A CIO traces each strategic goal to the capabilities it needs, the maturity roadmap that closes the gap, and the projects, money and people doing it.")}</div>`)}${lensNote()}
  ${kpis(D)}
  ${pk}
  ${views("sx",["Tree","Trace graph","Gaps ("+D.flags.length+")","Mapping","Record chain"],[card("Goals, capabilities, roadmap and projects","Open a row to go one level down. Money is split across goals by Strategy alignment weights.",tree),card("Trace graph","Left to right: goal, capability, roadmap item, project, then money and work.",graphHTML(D)),card("Gaps","Where the chain breaks, worst first.",gapsHTML(D)),card("Mapping","Edit the three links. Each has a named owner and backup.",mappingHTML(D)),chainView()])}
  ${reconHTML(D)}
  ${typeof procCard==="function"?procCard("strat_exec"):""}</div>`}

REG("strat_exec","Strategy to execution","portfolio","M4 5h4v4H4zM4 15h4v4H4zM16 10h4v4h-4zM8 7h4a2 2 0 0 1 2 2v1M8 17h4a2 2 0 0 0 2-2v-1",screen);
/* Round 17 Q: read-only summary for the Value screen (computed lazily, cached by build()) */
W.SXSUM=function(){const D=build();return D?{cover:D.cover,trAppr:D.trAppr,orAppr:D.orAppr,total:D.T.appr,nOrphan:D.nOrphan,traced:D.traced,nFunded:D.nFunded,goals:D.goals.length,nBelow:D.nBelow,nNoRoad:D.nNoRoad}:null};

/* ---------------- events ---------------- */
function refreshTree(){const el=document.getElementById("sx-tree"),D=build();if(el&&D)el.innerHTML=treeHTML(D)}
document.addEventListener("click",e=>{const t=e.target;let b;
 if(b=t.closest("[data-sx-tg]")){const k=b.dataset.sxTg;const find=(arr)=>{for(const n of arr){if(n.k===k)return n;const r=find(n.kids);if(r)return r}return null};const D=build();const V=view(D);const nd=find(V.goals.concat(V.orphan?[V.orphan]:[]));SX.open[k]=!(nd?isOpen(nd):false);refreshTree();return}
 if(b=t.closest("[data-sx-more]")){SX.more=SX.more||{};SX.more[b.dataset.sxMore]=1;refreshTree();return}
 if(b=t.closest("[data-sx-all]")){const D=build(),V=view(D),open=b.dataset.sxAll==="1";const walk=n=>{if(n.kids.length){SX.open[n.k]=open;n.kids.forEach(walk)}};V.goals.concat(V.orphan?[V.orphan]:[]).forEach(walk);if(open)SX.more=null;refreshTree();return}
 if(b=t.closest("[data-sx-gaps]")){SX.gaps=!SX.gaps;render();return}
 if(b=t.closest("[data-sx-sel]")){SX.sel=SX.sel===b.dataset.sxSel?null:b.dataset.sxSel;S.v.sx=1;render();return}
 if(b=t.closest("[data-sx-form]")){const k=b.dataset.sxForm;({gc:()=>gcForm(),crnew:crNewForm,goal:goalForm,own:ownForm})[k]();return}
 if(b=t.closest("[data-sx-edit]")){editLink(b.dataset.sxEdit);return}
 if(b=t.closest("[data-sx-open]")){const a=b.dataset.sxOpen.split(":");
  if(a[0]==="cap"){if(G(()=>MAT.openCap,0))MAT.openCap(a[1]);else go("exe_mat")}
  else if(a[0]==="goal")go("exe_strat");
  else {const id=a[1],g=a[2];if(/^PR\d$/.test(id))go("plan");else go(g||"ppm_proj")}
  return}});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.closest&&e.target.closest("g[data-sx-sel]")){e.preventDefault();e.target.closest("g[data-sx-sel]").dispatchEvent(new MouseEvent("click",{bubbles:true}))}});

/* ---------------- one name: the old id aliases here ---------------- */
const R15=W.R15=W.R15||{};R15.alias=R15.alias||{};R15.hidden=R15.hidden||{};
R15.alias.trace={to:"strat_exec"};R15.hidden.trace=1;
if(R15.names)R15.names.strat_exec="Strategy to execution";
/* CL-35: lifecycle through HOOKS, not a go wrapper */
if(!W._sxGo){W._sxGo=1;HOOKS.on("beforeGo",(screen,arg)=>{if((screen==="trace"||screen==="strat_exec")&&arg){S.rec=arg;S.flowSel=null;S.v.sx=4}},{id:"sx.go"})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-rec-pick]");if(b&&S.screen==="strat_exec"){S.rec=b.dataset.recPick;S.flowSel=null;S.v.sx=4;render()}});

/* ---------------- search, chat, navigation ---------------- */
G(()=>NAVX.add("strat_exec",{group:"strat",label:"Strategy to execution",hint:"Goals, the capabilities they need, the maturity roadmap, projects, money and work",sub:"Goals to work",kw:"strategy execution trace goals objectives capabilities maturity roadmap projects money work orphan gap alignment traceability"}),0);
SEARCHX.push(()=>{const D=G(()=>build(),null);const out=[{g:"Go to",t:"Strategy to execution",m:"Goals to capabilities, roadmap, projects, money, work",c:"--p4",f:()=>go("strat_exec"),k:"strategy execution trace goals money work orphan roadmap capability gap"}];
 if(D){D.goals.forEach(g=>out.push({g:"Goals",t:g.n,m:"Trace to capabilities and projects",c:"--p4",f:()=>{S.v.sx=0;SX.open["g:"+g.id]=true;go("strat_exec")},k:"goal objective "+g.id+" trace"}));
  D.flags.slice(0,40).forEach(f=>out.push({g:"Strategy gaps",t:f.t,m:f.sub,c:"--warn-f",f:()=>{S.v.sx=2;go("strat_exec")},k:"gap orphan "+f.kind+" "+f.id}))}return out});
ASKX.unshift(q=>{if(!/\b(orphan (work|spend)|strategy to execution|trace (a )?goal|goals? (with )?(no|without) capabilit|capabilit\w+ (with )?(no|without) roadmap|roadmap item (with )?no project|work (not )?(tied|linked) to (a )?goal)/i.test(q))return false;
 const D=build();if(!D)return false;S.v.sx=/orphan|no project|without/i.test(q)?2:0;go("strat_exec");
 say(q,{t:`${fm(D.orAppr)} of funded work has no goal (${D.nOrphan} project${D.nOrphan===1?"":"s"}); ${D.nNoRoad} capabilities below target have no roadmap that reaches it; ${D.nRoadNoProj} roadmap items have no funded project. ${Math.round(D.cover)}% of funded dollars reach a goal.`,steps:["Opened Strategy to execution","Read goals, maturity roadmap, project registry and budget lines"]});return true});

/* ---------------- Feature Contract wiring (lazy, once) ---------------- */
const F1=(k,label,type,req,ref)=>({k,label,type,authority:"platform",classification:"internal",req:!!req,ref});
const SC={id:"strat_exec",name:"Strategy to execution",own:OWN,bk:BK,
 ents:[
  {id:"goal_capability_link",label:"Goal to capability link",note:"Which capabilities a strategic goal depends on. Reuses objective and maturity_capability; stores only the link and its owner.",fields:[F1("goal_id","Goal","ref",1,"objective"),F1("capability_id","Capability","ref",1,"maturity_capability"),F1("owner","Mapping owner","ref",1,"person"),F1("backup","Backup","ref",0,"person")]},
  {id:"capability_roadmap_item",label:"Capability roadmap item",note:"A dated step that moves a capability from one maturity level to the next, delivered by a project. Reuses the maturity credit; adds nothing parallel.",fields:[F1("capability_id","Capability","ref",1,"maturity_capability"),F1("from_level","From level","number",1),F1("to_level","To level","number",1),F1("counts_on","Counts on","date"),F1("project_id","Delivering project","ref",0,"project")]},
  {id:"roadmap_project_link",label:"Roadmap item to project link",note:"Which project delivers a roadmap item, with its money and work read from the project registry and budget lines.",fields:[F1("roadmap_item","Roadmap item","ref",1,"capability_roadmap_item"),F1("project_id","Project","ref",1,"project"),F1("share","Share of project money","number"),F1("owner","Mapping owner","ref",1,"person")]}],
 steps:[["Set goals","Strategic goals and their owners are set in Strategy alignment.","human","Casey Rowan","Quarterly","Strategy","Goals"],["Map capabilities","Link each goal to the capabilities it depends on, with current and target maturity level.","human",OWN,"2 weeks","Goals","Goal to capability links"],["Plan the roadmap","Add dated roadmap items that move each capability from level to level.","human","Capability owners","1 month","Capability gaps","Roadmap items"],["Fund and assign","A funded project delivers each roadmap item; the portfolio board decides.","gate","Portfolio board","2 weeks","Roadmap items","Funded projects"],["Reconcile","Money and work roll up to roadmap item, capability and goal and reconcile to Budgets.","robot","Strategy trace service","Immediate","Funded projects, budget lines","Rollups and gaps"],["Review gaps","Goals with no capability, capabilities with no roadmap, roadmap items with no project, orphan work.","human",OWN,"Monthly","Gaps",  "Closed gaps"]],
 met:["m_sx_cover","m_sx_orphan","m_sx_gaps"],
 fin:[["exe_strat","Strategy alignment","objective"],["exe_mat","Maturity models","maturity_capability"],["ppm_proj","Projects and teams","project"],["bud_over","Budgets overall","project"]],fout:[["exe_dash","Leadership dashboard","goal_capability_link"],["exe_board","Board pack","roadmap_project_link"],["chat_home","Ask","capability_roadmap_item"]]};
const WS={};
function wire(){
 try{
  if(typeof METRICS!=="undefined"&&!WS.m){metricsInit();WS.m=1}
  if(!WS.ent&&W.ATLAS&&ATLAS.addEntity){
   SC.ents.forEach(s=>G(()=>ATLAS.addEntity({id:s.id,label:s.label,domain:"gov",source:SC.name,ownerApp:SC.id,ownerMod:SC.id,status:"live",note:s.note,fields:s.fields}),null));
   if(W.COVER&&Array.isArray(COVER.recs))SC.ents.forEach(s=>{if(!COVER.recs.some(r=>r.key===SC.id+"."+s.id))COVER.recs.push({key:SC.id+"."+s.id,label:s.label+" view",scr:[SC.id],mod:SC.id,n:0,ent:s.id,how:"new",path:"S.sx"})});
   if(W.DATAMODEL&&DATAMODEL.register)SC.ents.forEach(s=>G(()=>DATAMODEL.register(s.id,{label:s.label,source:SC.name,fields:s.fields.map(f=>({k:f.k,label:f.label,type:f.type==="ref"?"ref":f.type,ref:f.ref}))}),0));
   WS.ent=1}
  if(!WS.mod&&W.MODMAP&&MODMAP.addModule&&WS.ent){
   const r=G(()=>MODMAP.addModule({id:SC.id,name:SC.name,sn:SC.name,band:"plt",own:SC.own,proposed:false,scr:SC.id,r:["objective","maturity_capability","project"],w:SC.ents.map(e=>e.id),
    flows:SC.fin.map(f=>({dir:"pull",other:f[0],data:f[1]+" data",entity:f[2],mode:"api",trig:"Screen opened"})).concat(SC.fout.map(f=>({dir:"push",other:f[0],data:SC.name+" result",entity:f[2],mode:"event",trig:"Mapping changed"})))}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))WS.mod=1}
  if(!WS.proc&&W.PROCLIB&&PROCLIB.addProcess&&WS.mod){
   const fam=G(()=>PROCLIB.get("plat_gate").family,undefined),st=SC.steps.map(x=>({n:x[0],d:x[1],who:x[2],owner:x[3],sla:x[4],in:x[5],out:x[6]}));
   const r=G(()=>PROCLIB.addProcess({id:"strat_exec_process",name:"Strategy-to-portfolio mapping",module:SC.id,family:fam,owner:SC.own,backup:SC.bk,trigger:"A goal, capability, roadmap item or project changes",steps:st,inputs:["Goals","Capability gaps"],outputs:["Rollups and gaps"],entities:SC.ents.map(e=>e.id),metrics:SC.met,model:"cmmi"}),null);
   if(r&&(r.ok||/already exists/.test((r.warnings||[]).join(" "))))WS.proc=1}
  if(WS.proc&&!WS.pr){G(()=>PROC.reg(SC.id,{title:"Strategy-to-portfolio mapping",std:["togaf","cmmi"],steps:SC.steps.map(x=>({n:x[0],d:x[1],who:x[2],owner:x[3],sla:x[4],in:x[5],out:x[6]}))}),0);WS.pr=1}
 }catch(e){console.error("r16k contract",e)}
 if(WS.proc&&!WS.rf&&W.MODMAP&&MODMAP.refresh){G(()=>MODMAP.refresh(),0);WS.rf=1}}
G(()=>{if(typeof PROC!=="undefined"&&PROC.reg)PROC.reg("strat_exec",{title:"Strategy-to-portfolio mapping",std:["togaf","cmmi"],steps:SC.steps.map(x=>({n:x[0],d:x[1],who:x[2],owner:x[3],sla:x[4],in:x[5],out:x[6]}))})},0);
G(()=>{if(typeof STD!=="undefined"&&!STD.togaf)STD.togaf={n:"TOGAF",by:"The Open Group",d:"Capability-based planning: map business capabilities to the initiatives that change them."}},0);
metricsInit();
setTimeout(wire,900);setTimeout(wire,3000);setTimeout(wire,6800);
W.R16K=W.R16K||{};R16K.sx={build,state:()=>Object.assign({},WS),contract:SC};
})();

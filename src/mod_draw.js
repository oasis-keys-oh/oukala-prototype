/* ===== mod_draw: Process drawing studio (prefix dr). Part 1 of 2: the engine.
   Shape catalog, document model, auto-connect planner, smart elbow router, validation, steps <-> drawing round trip, tidy layout, AI next-step drafts.
   Globals: window.DRAW {SHAPES, CATS, newDoc, fromSteps, toSteps, plan, route, validate, tidy, lanes, suggest, ...}. mod_draw2.js draws the studio and wires the app.
   Reuses PROC / PROCLIB (steps, owners, who acts), ORGX / DIR (owners), S.flw.dmn (decision rules). Loads before mod_flow and mod_plat_proclib, so every outside global is read lazily. */
(function(){
"use strict";
const H=s=>esc(s==null?"":String(s));
const D=window.DRAW=window.DRAW||{};
S.draw=S.draw||{};
Object.assign(S.draw,Object.assign({docs:{},cur:null,pal:true,grid:true,snap:true,cats:{},saved:{},log:[],ai:0,auto:0,conns:0,drawn:0},S.draw));

/* ---------- catalog ---------- */
const IC={
 start:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM10 9l5 3-5 3z",end:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9 9h6v6H9z",
 task:"M5 7h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z",subprocess:"M5 7h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM12 11v4M10 13h4",
 gateway:"M12 3l9 9-9 9-9-9zM9.5 9.5l5 5M14.5 9.5l-5 5",parallel:"M12 3l9 9-9 9-9-9zM12 8v8M8 12h8",merge:"M12 3l9 9-9 9-9-9zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
 wait:"M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2",document:"M5 4h14v13c-3 3-5-1-7 1s-4 1-7-1z",datastore:"M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3",
 humantask:"M12 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20c0-4 3-6 7-6s7 2 7 6",aistep:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z",
 approval:"M5 12l4 4 10-10M4 4h16v16H4z",notification:"M4 6h16v12H4zM4 7l8 6 8-6",
 sysaction:"M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
 integration:"M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4",apicall:"M8 5c-2 0-3 1-3 3v2c0 1-1 2-2 2 1 0 2 1 2 2v2c0 2 1 3 3 3M16 5c2 0 3 1 3 3v2c0 1 1 2 2 2-1 0-2 1-2 2v2c0 2-1 3-3 3",
 note:"M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6",swimlane:"M3 5h18v14H3zM8 5v14M8 12h13",risk:"M12 3l10 18H2zM12 10v5M12 17.5v.5",control:"M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6zM9.5 11h5v4h-5zM10.5 11V9.8a1.5 1.5 0 0 1 3 0V11"};
const CATS=[["flow","Flow"],["people","People and AI"],["systems","Systems"],["annot","Annotation"]];
const SH=[
 ["start","flow","Start",48,48,"","Start event (BPMN). The trigger that begins the process. Keep exactly one."],
 ["end","flow","End",48,48,"","End event (BPMN). Where a path finishes. Every path should reach an end."],
 ["task","flow","Task",160,64,"human","Task (BPMN). One unit of work done by one actor. In ITIL, an activity inside a practice."],
 ["subprocess","flow","Subprocess",160,64,"human","Sub-process (BPMN). A collapsed child process. Reuse a documented process here instead of redrawing it."],
 ["gateway","flow","Decision",72,72,"auto","Exclusive gateway (BPMN). Exactly one exit is taken, chosen by a rule. Label the exits Yes and No."],
 ["parallel","flow","Parallel",72,72,"auto","Parallel gateway (BPMN AND). Every exit runs at the same time."],
 ["merge","flow","Merge",72,72,"auto","Merge or join (BPMN). Paths come back together; a parallel join waits for all of them."],
 ["wait","flow","Wait or timer",56,56,"auto","Timer event (BPMN). The process pauses for a time or until something happens. In ITIL this is where an SLA clock runs."],
 ["document","flow","Document",130,70,"","Data object (BPMN). A form, record or report that is created or read. Joined with a dashed data association."],
 ["datastore","flow","Data store",90,72,"","Data store (BPMN). A system of record that keeps data, such as the CMDB or the ledger."],
 ["humantask","people","Human task",160,64,"human","User task (BPMN). A person does this and uses judgment. RACI: the Responsible role."],
 ["aistep","people","AI agent step",170,72,"agent","AI agent step. An agent drafts or decides inside guardrails; a person accepts or overrides (human in the loop). Dashed with an AI badge."],
 ["approval","people","Approval gate",160,64,"gate","Approval gate (ITIL change authority; BPMN user task with a decision). A named person or board must approve before work continues. RACI: Accountable."],
 ["notification","people","Notification",150,56,"auto","Send task or message event (BPMN). Informs a person or system. No answer is needed. RACI: Informed."],
 ["sysaction","systems","System action",160,64,"auto","Service task (BPMN). A system does this on its own with no person involved."],
 ["integration","systems","Integration",160,64,"auto","Integration (BPMN message flow). Data moves between two systems through a connector."],
 ["apicall","systems","API or MCP call",160,64,"auto","API or MCP call (BPMN service task). Calls an API or a Model Context Protocol tool."],
 ["note","annot","Note",160,70,"","Text annotation (BPMN). Explains a step. It is not part of the flow."],
 ["swimlane","annot","Swimlane",880,150,"","Lane (BPMN pool and lane). A band for one role or team. Shapes inside it belong to that role."],
 ["risk","annot","Risk",56,52,"","Risk marker (ISO 31000, ITIL). Something that can go wrong at this step. Link it to a control."],
 ["control","annot","Control",150,52,"","Control (COBIT, ISO 27001). A check that reduces a risk, such as a four-eyes review or a limit."]
].map(a=>({id:a[0],cat:a[1],name:a[2],w:a[3],h:a[4],who:a[5],tip:a[6],ic:IC[a[0]]}));
const BY={};SH.forEach(s=>BY[s.id]=s);
const ACT=new Set(["task","subprocess","humantask","aistep","approval","notification","sysaction","integration","apicall"]);
const EVT=new Set(["start","end","wait"]),GW=new Set(["gateway","parallel","merge"]),DATA=new Set(["document","datastore"]),ANN=new Set(["note","swimlane","risk","control"]);
const isFlow=t=>ACT.has(t)||EVT.has(t)||GW.has(t);
const WHOL={human:"Person",agent:"AI agent",auto:"Robot",robot:"Robot",gate:"Approval gate"};
const WHOS=["human","agent","auto","gate"];
D.SHAPES=SH;D.CATS=CATS;D.BY=BY;D.isFlow=isFlow;D.ACT=ACT;D.GW=GW;D.EVT=EVT;D.DATA=DATA;D.ANN=ANN;D.WHOL=WHOL;D.WHOS=WHOS;D.IC=IC;

/* ---------- document model ---------- */
const clone=o=>JSON.parse(JSON.stringify(o));
function newDoc(name,pid){return{pid:pid||null,name:name||"Untitled process",shapes:[],conns:[],seq:1,rev:0,basis:null}}
function addShape(doc,t,x,y,over){const c=BY[t];if(!c)return null;const s=Object.assign({id:"n"+(doc.seq++),t,x:Math.round(x),y:Math.round(y),w:c.w,h:c.h,n:defName(t),who:c.who||"",owner:"",sla:"",inp:"",out:"",sys:"",ctl:"",rule:"",note:"",lane:""},over||{});doc.shapes.push(s);if(t==="swimlane")doc.shapes.sort((a,b)=>(a.t==="swimlane"?0:1)-(b.t==="swimlane"?0:1));return s}
function defName(t){return({start:"Start",end:"End",gateway:"Is it approved?",parallel:"Do in parallel",merge:"Merge",wait:"Wait",note:"Note",swimlane:"Role",risk:"Risk",control:"Control",document:"Document",datastore:"System of record"})[t]||("New "+BY[t].name.toLowerCase())}
function getS(doc,id){return doc.shapes.find(s=>s.id===id)}
function addConn(doc,a,b,ap,bp,o){const c=Object.assign({id:"c"+(doc.seq++),a,b,ap,bp,lb:"",kind:"flow",auto:false},o||{});doc.conns.push(c);return c}
const outs=(doc,id)=>doc.conns.filter(c=>c.a===id&&c.kind==="flow"),ins=(doc,id)=>doc.conns.filter(c=>c.b===id&&c.kind==="flow");
D.newDoc=newDoc;D.addShape=addShape;D.addConn=addConn;D.getS=getS;D.outs=outs;D.ins=ins;D.clone=clone;

/* ---------- geometry ---------- */
const DIRV={t:[0,-1],r:[1,0],b:[0,1],l:[-1,0]};
const OPP={t:"b",b:"t",l:"r",r:"l"};
function portPt(s,p){return p==="t"?[s.x+s.w/2,s.y]:p==="b"?[s.x+s.w/2,s.y+s.h]:p==="l"?[s.x,s.y+s.h/2]:[s.x+s.w,s.y+s.h/2]}
const ctr=s=>[s.x+s.w/2,s.y+s.h/2];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function clean(pts){const o=[];pts.forEach(p=>{const l=o[o.length-1];if(!l||Math.abs(l[0]-p[0])>.5||Math.abs(l[1]-p[1])>.5)o.push(p)});
 for(let i=o.length-2;i>0;i--){const a=o[i-1],b=o[i],c=o[i+1];if((Math.abs(a[0]-b[0])<.5&&Math.abs(b[0]-c[0])<.5)||(Math.abs(a[1]-b[1])<.5&&Math.abs(b[1]-c[1])<.5))o.splice(i,1)}return o}
function route(doc,c){
 const A=getS(doc,c.a),B=getS(doc,c.b);if(!A||!B)return[];
 const p1=portPt(A,c.ap),p2=portPt(B,c.bp),d1=DIRV[c.ap],d2=DIRV[c.bp],S=20;
 const a=[p1[0]+d1[0]*S,p1[1]+d1[1]*S],b=[p2[0]+d2[0]*S,p2[1]+d2[1]*S];
 const h1=d1[0]!==0,h2=d2[0]!==0;let mid=[];
 const gapX=()=>A.x+A.w+12<B.x?(A.x+A.w+B.x)/2:B.x+B.w+12<A.x?(B.x+B.w+A.x)/2:Math.max(A.x+A.w,B.x+B.w)+34;
 const gapY=()=>A.y+A.h+12<B.y?(A.y+A.h+B.y)/2:B.y+B.h+12<A.y?(B.y+B.h+A.y)/2:Math.max(A.y+A.h,B.y+B.h)+34;
 if(h1&&h2){
  if(d1[0]!==d2[0]&&(b[0]-a[0])*d1[0]>=0){const mx=(a[0]+b[0])/2;mid=[[mx,a[1]],[mx,b[1]]]}
  else if(d1[0]===d2[0]){const x=d1[0]>0?Math.max(a[0],b[0]):Math.min(a[0],b[0]);mid=[[x,a[1]],[x,b[1]]]}
  else{const y=gapY();mid=[[a[0],y],[b[0],y]]}
 }else if(!h1&&!h2){
  if(d1[1]!==d2[1]&&(b[1]-a[1])*d1[1]>=0){const my=(a[1]+b[1])/2;mid=[[a[0],my],[b[0],my]]}
  else if(d1[1]===d2[1]){const y=d1[1]>0?Math.max(a[1],b[1]):Math.min(a[1],b[1]);mid=[[a[0],y],[b[0],y]]}
  else{const x=gapX();mid=[[x,a[1]],[x,b[1]]]}
 }else if(h1){
  mid=((b[0]-a[0])*d1[0]>=0&&(p2[1]-a[1])*(-d2[1])>=0)?[[b[0],a[1]]]:[[a[0],b[1]]];
 }else{
  mid=((b[1]-a[1])*d1[1]>=0&&(p2[0]-a[0])*(-d2[0])>=0)?[[a[0],b[1]]]:[[b[0],a[1]]];
 }
 return clean([p1,a].concat(mid,[b,p2]));
}
function pathD(pts,r){r=r==null?9:r;if(pts.length<2)return"";let d="M"+pts[0][0]+" "+pts[0][1];
 for(let i=1;i<pts.length-1;i++){const p0=pts[i-1],p1=pts[i],p2=pts[i+1],l1=dist(p0,p1),l2=dist(p1,p2),rr=Math.min(r,l1/2,l2/2);
  d+=" L"+(p1[0]+(p0[0]-p1[0])/l1*rr)+" "+(p1[1]+(p0[1]-p1[1])/l1*rr)+" Q"+p1[0]+" "+p1[1]+" "+(p1[0]+(p2[0]-p1[0])/l2*rr)+" "+(p1[1]+(p2[1]-p1[1])/l2*rr)}
 const e=pts[pts.length-1];return d+" L"+e[0]+" "+e[1]}
function labelPt(pts){let best=0,bi=0;for(let i=1;i<pts.length;i++){const l=dist(pts[i-1],pts[i]);if(l>best){best=l;bi=i}}const a=pts[bi-1]||pts[0],b=pts[bi]||pts[0];return[(a[0]+b[0])/2,(a[1]+b[1])/2]}
function ptSeg(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function hitConn(doc,p,tol,skip){let best=null,bd=tol||12;doc.conns.forEach(c=>{if(c.kind!=="flow"||(skip&&skip.includes(c.id)))return;const pts=route(doc,c);for(let i=1;i<pts.length;i++){const d=ptSeg(p,pts[i-1],pts[i]);if(d<bd){bd=d;best={c,i,pts}}}});return best}
D.portPt=portPt;D.ctr=ctr;D.route=route;D.pathD=pathD;D.labelPt=labelPt;D.hitConn=hitConn;D.OPP=OPP;D.DIRV=DIRV;

/* ---------- auto-connect planner (pure: returns what would be connected, mutates nothing) ---------- */
const REACH=330;
function openOut(doc,s){
 if(!isFlow(s.t)||s.t==="end")return false;
 const n=outs(doc,s.id).length;
 if(s.t==="gateway")return n<3;if(s.t==="parallel")return n<4;return n===0;
}
function freePort(doc,s,pref,out){
 const used=new Set();doc.conns.forEach(c=>{if(c.kind!=="flow")return;if(c.a===s.id)used.add(c.ap);if(c.b===s.id)used.add(c.bp)});
 const order=out?(s.t==="gateway"||s.t==="parallel"?[pref,"r","b","t"]:[pref,"r","b"]):[pref,"l","t","b"];
 for(const p of order)if(p&&!used.has(p))return p;return null;
}
function branchLabel(doc,src){if(src.t!=="gateway")return"";const n=outs(doc,src.id).length;return["Yes","No","Other"][Math.min(n,2)]}
function plan(doc,ns){
 /* ns: a shape (already positioned, maybe not yet in doc). Returns {kind:"flow"|"assoc"|"insert"|null, conn:{a,b,ap,bp,lb}, src, dst, via} */
 const others=doc.shapes.filter(s=>s.id!==ns.id);
 const c0=ctr(ns);
 if(ANN.has(ns.t)&&ns.t!=="swimlane"||DATA.has(ns.t)){
  let best=null,bd=230;others.forEach(s=>{if(!ACT.has(s.t))return;const d=dist(c0,ctr(s));if(d<bd){bd=d;best=s}});
  if(!best)return{kind:null};
  const dx=c0[0]-ctr(best)[0],dy=c0[1]-ctr(best)[1],horiz=Math.abs(dx)>Math.abs(dy)*1.3;
  const ap=horiz?(dx>0?"r":"l"):(dy>0?"b":"t");
  const dataOut=DATA.has(ns.t);
  return{kind:"assoc",src:best,dst:ns,conn:{a:best.id,b:ns.id,ap,bp:OPP[ap],kind:"assoc",lb:"",arrow:dataOut}};
 }
 if(!isFlow(ns.t))return{kind:null};
 /* drop on a connector: insert */
 if(!EVT.has(ns.t)||ns.t==="wait"){
  const hit=hitConn(doc,c0,14,[]);
  if(hit&&hit.c.a!==ns.id&&hit.c.b!==ns.id){
   const seg=[hit.pts[hit.i-1],hit.pts[hit.i]],horiz=Math.abs(seg[0][1]-seg[1][1])<1;
   const lr=seg[1][0]>=seg[0][0],ud=seg[1][1]>=seg[0][1];
   const inP=horiz?(lr?"l":"r"):(ud?"t":"b"),outP=OPP[inP];
   return{kind:"insert",via:hit.c,conn:{a:hit.c.a,b:ns.id,ap:hit.c.ap,bp:inP,lb:hit.c.lb||""},conn2:{a:ns.id,b:hit.c.b,ap:outP,bp:hit.c.bp,lb:""}};
  }
 }
 const flow=others.filter(s=>isFlow(s.t));
 if(!flow.length)return{kind:null};
 const canIn=ns.t!=="start";
 const canOut=ns.t!=="end";
 let best=null;
 /* downstream: an existing shape with a free output sends to the new shape */
 if(canIn){
  flow.forEach(s=>{
   if(!openOut(doc,s))return;
   const cs=ctr(s),dx=c0[0]-cs[0],dy=c0[1]-cs[1],d=dist(c0,cs);
   const onlyStart=flow.length===1&&s.t==="start";
   if(d>REACH&&!onlyStart)return;
   let pref=null;
   if(Math.abs(dx)>=Math.abs(dy)*.8){if(dx>-s.w*.25)pref="r"}
   if(!pref&&dy>s.h*.4)pref="b";
   if(!pref&&dy<-s.h*.4&&(s.t==="gateway"))pref="t";
   if(!pref&&onlyStart)pref="r";
   if(!pref)return;
   const ap=freePort(doc,s,pref,true);if(!ap)return;
   const sc=d+(ap===pref?0:60)+(s.t==="start"?-10:0);
   if(!best||sc<best.sc)best={sc,src:s,ap,dir:"down"};
  });
 }
 if(best){
  const s=best.src,ap=best.ap,bp=freePort(doc,ns,OPP[ap],false)||OPP[ap];
  return{kind:"flow",src:s,dst:ns,conn:{a:s.id,b:ns.id,ap,bp,lb:branchLabel(doc,s)}};
 }
 /* upstream: the new shape feeds an existing shape that has no entry yet */
 if(canOut){
  let up=null;
  flow.forEach(t=>{
   if(t.t==="start"||ins(doc,t.id).length)return;
   const ct=ctr(t),dx=ct[0]-c0[0],dy=ct[1]-c0[1],d=dist(c0,ct);if(d>REACH)return;
   let ap=null;if(Math.abs(dx)>=Math.abs(dy)*.8){if(dx>0)ap="r"}else if(dy>0)ap="b";if(!ap)return;
   if(!up||d<up.d)up={d,t,ap};
  });
  if(up)return{kind:"flow",src:ns,dst:up.t,conn:{a:ns.id,b:up.t.id,ap:up.ap,bp:OPP[up.ap],lb:""},up:true};
 }
 return{kind:null};
}
/* nudge a dropped shape so it does not sit on another shape, and align it with its source when close */
function settle(doc,ns,p){
 if(p&&p.kind==="flow"&&!p.up){const s=p.src,ap=p.conn.ap;
  if(ap==="r"){if(Math.abs((ns.y+ns.h/2)-(s.y+s.h/2))<56)ns.y=Math.round(s.y+s.h/2-ns.h/2);const gap=ns.x-(s.x+s.w);if(gap<56||gap>150)ns.x=s.x+s.w+(gap<56?72:Math.min(gap,110))}
  else if(ap==="b"){if(Math.abs((ns.x+ns.w/2)-(s.x+s.w/2))<70)ns.x=Math.round(s.x+s.w/2-ns.w/2);const gap=ns.y-(s.y+s.h);if(gap<40||gap>130)ns.y=s.y+s.h+(gap<40?64:Math.min(gap,96))}
 }
 let guard=0;const hits=()=>doc.shapes.find(o=>o.id!==ns.id&&o.t!=="swimlane"&&ns.t!=="swimlane"&&!ANN.has(o.t)&&!ANN.has(ns.t)&&ns.x<o.x+o.w+8&&ns.x+ns.w+8>o.x&&ns.y<o.y+o.h+8&&ns.y+ns.h+8>o.y);
 let o;while((o=hits())&&guard++<20){ns.y=o.y+o.h+34}
 return ns;
}
D.plan=plan;D.settle=settle;D.openOut=openOut;D.branchLabel=branchLabel;D.freePort=freePort;
/* apply a plan to the doc (after the shape is in it) */
function applyPlan(doc,ns,p){
 if(!p||!p.kind)return[];
 if(p.kind==="insert"){const v=p.via;doc.conns=doc.conns.filter(c=>c.id!==v.id);return[addConn(doc,p.conn.a,p.conn.b,p.conn.ap,p.conn.bp,{lb:p.conn.lb,auto:true}),addConn(doc,p.conn2.a,p.conn2.b,p.conn2.ap,p.conn2.bp,{auto:true})]}
 return[addConn(doc,p.conn.a,p.conn.b,p.conn.ap,p.conn.bp,{lb:p.conn.lb||"",auto:true,kind:p.kind==="assoc"?"assoc":"flow",arrow:p.conn.arrow})];
}
D.applyPlan=applyPlan;

/* ---------- validation ---------- */
function reach(doc){const st=doc.shapes.find(s=>s.t==="start"),seen=new Set();if(!st)return seen;const q=[st.id];while(q.length){const id=q.pop();if(seen.has(id))continue;seen.add(id);outs(doc,id).forEach(c=>q.push(c.b))}return seen}
function validate(doc){
 const L=[],fs=doc.shapes.filter(s=>isFlow(s.t)),acts=doc.shapes.filter(s=>ACT.has(s.t));
 const add=(id,lv,title,detail,ids)=>L.push({id,lv,title,detail,ids:ids||[]});
 const st=fs.filter(s=>s.t==="start"),en=fs.filter(s=>s.t==="end");
 if(st.length===1)add("one_start","ok","One start","The process begins in one place.");else add("one_start","err","One start",st.length?st.length+" start shapes. Keep one and remove the others.":"There is no start shape. Add Start from the Flow group.",st.map(s=>s.id));
 if(en.length>=1)add("has_end","ok","At least one end",en.length+" end"+(en.length>1?"s":"")+".");else add("has_end","err","At least one end","No end shape. Every path must finish at an end.");
 const dang=fs.filter(s=>s.t!=="end"&&outs(doc,s.id).length===0);
 if(!dang.length)add("dangling","ok","No dangling ends","Every shape except End leads somewhere.");else add("dangling","err","No dangling ends",dang.map(s=>s.n).slice(0,4).join(", ")+(dang.length>4?" and "+(dang.length-4)+" more":"")+" lead"+(dang.length===1?"s":"")+" nowhere. Connect "+(dang.length===1?"it":"them")+" onward or finish with an End.",dang.map(s=>s.id));
 const endBad=en.filter(s=>outs(doc,s.id).length);if(endBad.length)add("end_exit","err","Ends do not continue","An End shape has a connector leaving it.",endBad.map(s=>s.id));
 const noIn=fs.filter(s=>s.t!=="start"&&ins(doc,s.id).length===0);const rs=reach(doc);const unr=fs.filter(s=>st.length&&!rs.has(s.id)&&!noIn.includes(s));
 if(!noIn.length&&!unr.length)add("entry","ok","Every step is reachable","Each shape can be reached from the start.");else add("entry","err","Every step is reachable",noIn.concat(unr).map(s=>s.n).slice(0,4).join(", ")+" cannot be reached from the start.",noIn.concat(unr).map(s=>s.id));
 const gws=fs.filter(s=>s.t==="gateway"||s.t==="parallel"),badGw=gws.filter(s=>outs(doc,s.id).length<2);
 if(!badGw.length)add("gw_exits","ok","Every gateway has 2 or more exits",gws.length?gws.length+" gateway"+(gws.length>1?"s":"")+" checked.":"No gateways yet.");else add("gw_exits","err","Every gateway has 2 or more exits",badGw.map(s=>s.n).join(", ")+" "+(badGw.length>1?"have":"has")+" fewer than 2 exits. A decision needs at least a Yes and a No.",badGw.map(s=>s.id));
 const unl=fs.filter(s=>s.t==="gateway").filter(s=>outs(doc,s.id).some(c=>!c.lb));
 if(unl.length)add("gw_labels","warn","Decision exits are labeled","Label each exit of "+unl.map(s=>s.n).join(", ")+" so readers know when it is taken.",unl.map(s=>s.id));
 const mg=fs.filter(s=>s.t==="merge"&&ins(doc,s.id).length<2);if(mg.length)add("merge_in","warn","Merges join 2 or more paths",mg.map(s=>s.n).join(", ")+" has fewer than 2 entries.",mg.map(s=>s.id));
 const nn=acts.filter(s=>!s.n||/^New /i.test(s.n)||/^(Task|Step)$/i.test(s.n));if(!nn.length)add("named","ok","Every step is named","Names say what is done.");else add("named","warn","Every step is named",nn.length+" step"+(nn.length>1?"s have":" has")+" a placeholder name.",nn.map(s=>s.id));
 const no=acts.filter(s=>!s.owner);if(!no.length)add("owner","ok","Every step has an owner","Each step names who is accountable.");else add("owner","warn","Every step has an owner",no.length+" of "+acts.length+" steps have no owner. Select a step and set Owner.",no.map(s=>s.id));
 const ap=acts.filter(s=>s.t==="approval"&&!s.owner);if(ap.length)add("gate_owner","err","Approval gates name an approver",ap.map(s=>s.n).join(", ")+" has no approver.",ap.map(s=>s.id));
 const ai=acts.filter(s=>s.t==="aistep"||s.who==="agent");const aiBad=ai.filter(s=>{const nx=outs(doc,s.id).map(c=>getS(doc,c.b)).filter(Boolean);return !nx.some(x=>x.t==="approval"||x.t==="humantask"||x.who==="human"||x.who==="gate"||x.t==="gateway")});
 if(ai.length&&!aiBad.length)add("ai_check","ok","AI steps are followed by a person","Each AI draft is reviewed before it takes effect.");else if(aiBad.length)add("ai_check","warn","AI steps are followed by a person",aiBad.map(s=>s.n).join(", ")+" acts with no person checking the result. Add an approval gate or a human task after it.",aiBad.map(s=>s.id));
 const dr=fs.filter(s=>s.t==="gateway"&&!s.rule);if(dr.length)add("rule","warn","Decisions link to a rule",dr.length+" decision"+(dr.length>1?"s have":" has")+" no decision rule linked. Pick a table in Decision rule.",dr.map(s=>s.id));
 const errs=L.filter(x=>x.lv==="err").length,warns=L.filter(x=>x.lv==="warn").length,oks=L.filter(x=>x.lv==="ok").length;
 return{items:L,errs,warns,oks,total:L.length,valid:errs===0&&fs.length>0,empty:!fs.length,issuesFor:id=>L.filter(x=>x.lv!=="ok"&&x.ids.includes(id))};
}
D.validate=validate;

/* ---------- drawing -> process steps ---------- */
function order(doc){
 const st=doc.shapes.find(s=>s.t==="start"),seen=new Set(),res=[];
 const pr={r:0,b:1,t:2,l:3};
 (function walk(s){if(!s||seen.has(s.id))return;seen.add(s.id);res.push(s);outs(doc,s.id).sort((a,b)=>pr[a.ap]-pr[b.ap]).forEach(c=>walk(getS(doc,c.b)))})(st);
 doc.shapes.filter(s=>isFlow(s.t)&&!seen.has(s.id)).sort((a,b)=>a.x-b.x||a.y-b.y).forEach(s=>{seen.add(s.id);res.push(s)});
 return res;
}
function whoOf(s){const w=s.who==="robot"?"auto":s.who;return w&&WHOS.includes(w)?w:(BY[s.t].who||"human")}
function toSteps(doc){
 const ord=order(doc),steps=[];
 ord.forEach(s=>{
  if(!(ACT.has(s.t)||GW.has(s.t)||s.t==="wait"))return;
  if(s.t==="merge")return;
  const o=outs(doc,s.id).map(c=>{const t=getS(doc,c.b);return(c.lb?c.lb+": ":"")+(t?t.n:"")});
  const assoc=doc.conns.filter(c=>c.kind==="assoc");
  const data=(sid,asOut)=>assoc.filter(c=>asOut?c.a===sid:c.b===sid).map(c=>getS(doc,asOut?c.b:c.a)).filter(x=>x&&DATA.has(x.t)).map(x=>x.n);
  const around=assoc.filter(c=>c.a===s.id||c.b===s.id).map(c=>getS(doc,c.a===s.id?c.b:c.a)).filter(Boolean);
  const ctl=[s.ctl].concat(around.filter(x=>x.t==="control").map(x=>x.n)).filter(Boolean).join("; ");
  const dOut=data(s.id,true),dIn=data(s.id,false);
  const gw=GW.has(s.t);
  const rec={n:s.n,d:s.note||(gw?(s.t==="parallel"?"All of these run together: ":"The path depends on a rule. ")+o.join("; "):(o.length>1?"Leads to: "+o.join("; "):"")),
   who:gw?(s.who&&WHOS.includes(s.who)&&s.who!=="auto"?s.who:"robot"):(whoOf(s)==="auto"?"robot":whoOf(s)),owner:s.owner||"",sla:s.sla||"",in:s.inp||dIn.join("; "),out:s.out||dOut.join("; "),shape:s.t};
  if(s.sys)rec.sys=s.sys;if(ctl)rec.ctl=ctl;if(s.rule)rec.rule=s.rule;
  const risk=around.filter(x=>x.t==="risk").map(x=>x.n);if(risk.length)rec.risk=risk.join("; ");
  if(s.t==="aistep")rec.mode="ai";
  steps.push(rec);
 });
 return steps;
}
D.toSteps=toSteps;D.order=order;

/* ---------- process steps -> drawing (round trip) ---------- */
function fromSteps(steps,name,pid){
 const doc=newDoc(name,pid),X0=80,DX=230,DY=130,PER=5;
 const st=addShape(doc,"start",X0,60+(64-48)/2,{n:"Start"});let prev=st,col=1,row=0,dir=1;
 const place=(c,r)=>({x:X0+48+54+(r%2?PER-1-c:c)*DX,y:60+r*DY});
 steps.forEach(s=>{
  const w=whoOf(s),t=s.shape&&BY[s.shape]&&isFlow(s.shape)?s.shape:(w==="agent"?"aistep":w==="auto"?"sysaction":w==="gate"?"approval":"humantask");
  const p=place(col-1,row),c=BY[t];
  const sh=addShape(doc,t,p.x,p.y+(64-c.h)/2,{n:s.n||"Step",who:w,owner:s.owner||"",sla:s.sla||"",inp:s.in||"",out:s.out||"",sys:s.sys||"",ctl:s.ctl||"",rule:s.rule||"",note:s.d||""});
  const rowChange=col>PER;
  if(prev){const same=prev.y+prev.h/2>0&&Math.abs(ctr(prev)[1]-ctr(sh)[1])<40;
   if(same)addConn(doc,prev.id,sh.id,(row%2)?"l":"r",(row%2)?"r":"l",{auto:true});else addConn(doc,prev.id,sh.id,"b","t",{auto:true})}
  prev=sh;col++;if(col>PER){col=1;row++}
 });
 const lastRow=col===1?row-1:row;
 const lp=prev&&prev!==st?ctr(prev):null;
 let ex,ey,ap="r",bp="l";
 if(!prev||prev===st){ex=X0+48+80;ey=60+8}else if(lastRow%2===0){ex=prev.x+prev.w+70;ey=prev.y+prev.h/2-24}else{ex=prev.x-70-48;ey=prev.y+prev.h/2-24;ap="l";bp="r"}
 const en=addShape(doc,"end",ex,ey,{n:"Done"});addConn(doc,prev.id,en.id,ap,bp,{auto:true});
 return doc;
}
D.fromSteps=fromSteps;

/* ---------- tidy layout (layered), and swimlanes by role ---------- */
function layout(doc){
 const ord=order(doc),st=doc.shapes.find(s=>s.t==="start"),depth={},state={},back=new Set();
 (function dfs(id){state[id]=1;outs(doc,id).forEach(c=>{if(state[c.b]===1){back.add(c.id);return}if(!state[c.b])dfs(c.b)});state[id]=2})(st?st.id:(ord[0]&&ord[0].id));
 const fw=doc.conns.filter(c=>c.kind==="flow"&&!back.has(c.id));
 ord.forEach(s=>depth[s.id]=0);
 for(let p=0;p<ord.length+1;p++){let ch=false;fw.forEach(c=>{if(depth[c.b]<depth[c.a]+1){depth[c.b]=depth[c.a]+1;ch=true}});if(!ch)break}
 const cols={};ord.forEach(s=>{(cols[depth[s.id]]=cols[depth[s.id]]||[]).push(s)});
 const pos={};let x=80;Object.keys(cols).map(Number).sort((a,b)=>a-b).forEach(d=>{const col=cols[d],mw=Math.max(...col.map(s=>s.w));col.forEach((s,i)=>{pos[s.id]=[Math.round(x+(mw-s.w)/2),Math.round(200+(i-(col.length-1)/2)*118-s.h/2)]});x+=mw+90});
 return pos;
}
function ownerRole(o){if(!o)return"";try{const r=window.who&&who(o);if(r&&r.role)return r.role}catch(e){}return o}
function laneKey(s){return s.lane||ownerRole(s.owner)||WHOL[whoOf(s)]||"Unassigned"}
function makeLanes(doc){
 doc.shapes=doc.shapes.filter(s=>s.t!=="swimlane");
 const fs=doc.shapes.filter(s=>isFlow(s.t)&&s.t!=="start"&&s.t!=="end"),keys=[];
 order(doc).forEach(s=>{if(s.t==="start"||s.t==="end"||!isFlow(s.t))return;const k=laneKey(s);if(!keys.includes(k))keys.push(k)});
 if(!keys.length)return 0;
 const LH=150,x0=0,maxX=Math.max(...doc.shapes.map(s=>s.x+s.w))+90;
 keys.forEach((k,i)=>{addShape(doc,"swimlane",x0,i*LH,{n:k,w:Math.max(880,maxX),h:LH,lane:k})});
 const laneOf=s=>Math.max(0,keys.indexOf(laneKey(s)));
 doc.shapes.forEach(s=>{if(!isFlow(s.t))return;if(s.t==="start"||s.t==="end"){const nx=s.t==="start"?outs(doc,s.id)[0]:ins(doc,s.id)[0];const o=nx&&getS(doc,s.t==="start"?nx.b:nx.a);const li=o?laneOf(o):0;s.y=li*LH+LH/2-s.h/2;return}const li=laneOf(s);s.y=li*LH+LH/2-s.h/2;if(s.x<70)s.x=96});
 doc.shapes.forEach(s=>{if(ANN.has(s.t)&&s.t!=="swimlane"||DATA.has(s.t)){const c=doc.conns.find(c=>c.kind==="assoc"&&(c.a===s.id||c.b===s.id));const o=c&&getS(doc,c.a===s.id?c.b:c.a);if(o&&isFlow(o.t))s.y=o.y+o.h+16}});
 doc.shapes.sort((a,b)=>(a.t==="swimlane"?0:1)-(b.t==="swimlane"?0:1));
 return keys.length;
}
D.layout=layout;D.makeLanes=makeLanes;D.laneKey=laneKey;

/* ---------- AI draft: suggested next steps (always a draft; a person accepts) ---------- */
function suggest(doc,from){
 const fs=doc.shapes.filter(s=>isFlow(s.t));
 let s=from;if(!s){s=fs.filter(x=>x.t!=="end"&&openOut(doc,x)).sort((a,b)=>b.x-a.x)[0]||null}
 const R=[],add=(t,n,why,conf,extra)=>{if(!R.some(r=>r.n===n))R.push(Object.assign({t,n,why,conf},extra||{}))};
 if(!s){add("start","Start","A process begins with one trigger.",.9);add("humantask","Receive and log the request","Most processes begin when someone raises a request.",.8);return R}
 const nm=(s.n||"").toLowerCase();
 if(s.t==="start"){add("humantask","Receive and log the request","The first step usually captures what was asked and by whom.",.84,{owner:"Service desk"});add("aistep","Classify and route the request","An agent can read the request and pick the queue, with a person checking.",.78,{who:"agent"});add("sysaction","Create the record in the system of record","Starting from a record keeps every later step traceable.",.7)}
 else if(s.t==="gateway"){const n=outs(doc,s.id).length;if(n===0){add("approval","Approve","The Yes path usually needs an approver.",.8);add("sysaction","Proceed automatically","If the rule is clear, the Yes path can run on its own.",.66)}else{add("humantask","Return for rework","The No path normally goes back to the requester with a reason.",.82);add("notification","Tell the requester why","Declines should say why and what to do next.",.74);add("end","Closed without action","A No path may simply finish.",.6)}}
 else if(s.t==="aistep"){add("approval","Person accepts or overrides the AI draft","An AI draft needs a named person to accept it (human in the loop).",.9,{who:"gate"});add("humantask","Review the AI result","A quick review step keeps accountability with a person.",.8)}
 else if(s.t==="approval"){add("gateway","Approved?","An approval has two outcomes, so it needs a decision.",.86);add("sysaction","Record the decision","The decision is written to the system of record for the audit trail.",.76)}
 else if(/review|check|validate|assess|verify/.test(nm)){add("gateway","Meets the criteria?","A review ends in a pass or fail decision.",.86);add("aistep","Draft the review summary","An agent can pre-fill the findings for the reviewer.",.7,{who:"agent"})}
 else if(s.t==="sysaction"||s.t==="integration"||s.t==="apicall"){add("notification","Notify the owner","People should hear when a system has acted.",.78);add("humantask","Verify the result","A spot check catches integration errors early.",.66);add("end","Done","If nothing else follows, finish here.",.6)}
 else if(s.t==="notification"){add("end","Done","A notification usually closes the path.",.82);add("wait","Wait for a reply","If an answer is needed, pause with a timer.",.62)}
 else if(s.t==="wait"){add("gateway","Replied in time?","A timer needs a timeout branch.",.8);add("notification","Send a reminder","A reminder keeps the SLA clock honest.",.72)}
 else{add("approval","Approve","Work with spend or risk usually needs an approval.",.78);add("sysaction","Update the record","The result should reach the system of record.",.76);add("notification","Notify the requester","Close the loop with the person who asked.",.72);add("end","Done","Finish if this is the last step.",.55)}
 if(fs.length>=6&&!fs.some(x=>x.t==="end"))add("end","Done","The drawing has no end yet.",.85);
 return R.slice(0,4);
}
D.suggest=suggest;

/* ---------- JSON export / import ---------- */
function toJSON(doc){return JSON.stringify({format:"oukala.process-drawing",version:1,process:{id:doc.pid,name:doc.name},exportedAt:new Date().toISOString(),shapes:doc.shapes,connectors:doc.conns},null,2)}
function fromJSON(txt){let o;try{o=JSON.parse(txt)}catch(e){return{ok:false,msg:"That is not valid JSON."}}
 if(!o||o.format!=="oukala.process-drawing"||!Array.isArray(o.shapes))return{ok:false,msg:"This file is not an "+BRAND.name+" process drawing."};
 const doc=newDoc(o.process&&o.process.name||"Imported process",o.process&&o.process.id||null);
 doc.shapes=o.shapes.filter(s=>BY[s.t]).map(s=>Object.assign({id:"n"+(doc.seq++),t:"task",x:0,y:0,w:BY[s.t].w,h:BY[s.t].h,n:"",who:"",owner:"",sla:"",inp:"",out:"",sys:"",ctl:"",rule:"",note:"",lane:""},s));
 const ids=new Set(doc.shapes.map(s=>s.id));
 doc.conns=(o.connectors||[]).filter(c=>ids.has(c.a)&&ids.has(c.b)&&DIRV[c.ap]&&DIRV[c.bp]).map(c=>Object.assign({id:"c"+(doc.seq++),lb:"",kind:"flow",auto:false},c));
 doc.seq=Math.max(doc.seq,doc.shapes.length+doc.conns.length+10)+100;
 return{ok:true,doc};
}
D.toJSON=toJSON;D.fromJSON=fromJSON;
D.sig=steps=>{let h=0;const t=JSON.stringify((steps||[]).map(s=>[s.n,s.who,s.owner,s.sla]));for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return h};

/* ---------- R14: collision avoidance and insert-between ---------- */
const solid=s=>s.t!=="swimlane",loose=s=>ANN.has(s.t)||DATA.has(s.t);
function gapFor(doc,a,b){if(loose(a)||loose(b))return[0,0];const lab=s=>s.t==="gateway"&&outs(doc,s.id).length>0;return[lab(a)||lab(b)?60:36,24]}
function boxHit(doc,a,b){const g=gapFor(doc,a,b);return a.x<b.x+b.w+g[0]&&b.x<a.x+a.w+g[0]&&a.y<b.y+b.h+g[1]&&b.y<a.y+a.h+g[1]}
function downOf(doc,id){const seen=new Set([id]),q=[id];while(q.length){const i=q.pop();outs(doc,i).forEach(c=>{if(!seen.has(c.b)){seen.add(c.b);q.push(c.b)}})}return seen}
/* strict list of overlapping pairs among real shapes (used by the tests and the checker) */
function overlaps(doc){const L=doc.shapes.filter(s=>solid(s)&&!loose(s)),r=[];for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)r.push([a.id,b.id])}return r}
/* resolve(doc,pinned): pinned shapes never move (unless they sit upstream of what they hit); everything downstream of a collision slides away */
function resolve(doc,pin){
 pin=new Set(pin||[]);const touched=new Set(pin);let n=0;
 for(let it=0;it<90;it++){
  const L=doc.shapes.filter(solid);let P=null,M=null;
  for(let i=0;i<L.length&&!P;i++)for(let j=i+1;j<L.length;j++){
   const a=L[i],b=L[j];if(!(touched.has(a.id)||touched.has(b.id)))continue;if(pin.has(a.id)&&pin.has(b.id))continue;if(!boxHit(doc,a,b))continue;
   if(pin.has(a.id)){P=a;M=b}else if(pin.has(b.id)){P=b;M=a}
   else if(touched.has(a.id)&&!touched.has(b.id)){P=a;M=b}else if(touched.has(b.id)&&!touched.has(a.id)){P=b;M=a}
   else{if(a.x+a.y<=b.x+b.y){P=a;M=b}else{P=b;M=a}}
   break}
  if(!P)break;
  const g=gapFor(doc,P,M),dx=ctr(M)[0]-ctr(P)[0],dy=ctr(M)[1]-ctr(P)[1];
  const hor=Math.abs(dx)/((P.w+M.w)/2)>=Math.abs(dy)/((P.h+M.h)/2);
  if(hor){
   if(dx>=0){const d=Math.ceil(P.x+P.w+g[0]-M.x);doc.shapes.forEach(o=>{if(solid(o)&&!pin.has(o.id)&&o.id!==P.id&&o.x>=M.x-1){o.x+=d;touched.add(o.id)}});if(d>0)n++}
   else{P.x=Math.ceil(M.x+M.w+g[0]);touched.add(P.id);n++}
  }else{
   if(dy>=0){const d=Math.ceil(P.y+P.h+g[1]-M.y),set=downOf(doc,M.id);set.add(M.id);doc.shapes.forEach(o=>{if(solid(o)&&set.has(o.id)&&!pin.has(o.id)&&o.id!==P.id){o.y+=d;touched.add(o.id)}});n++}
   else{P.y=Math.ceil(M.y+M.h+g[1]);touched.add(P.id);n++}
  }
 }
 return n;
}
/* insert shape ns into connector c (a to b): re-wire both halves, keep the branch label on the first half, slide downstream shapes apart */
function insertInto(doc,c,ns){
 const A=getS(doc,c.a),B=getS(doc,c.b);if(!A||!B)return[];
 const G=A.t==="gateway"?74:60;
 doc.conns=doc.conns.filter(x=>x.id!==c.id);
 let ap1=c.ap,bp1,ap2,bp2=c.bp;
 if(B.x>A.x+A.w&&c.ap!=="b"&&c.ap!=="t"){
  const gap=B.x-(A.x+A.w),need=ns.w+2*G;if(gap<need){const sh=need-gap;doc.shapes.forEach(o=>{if(solid(o)&&o.id!==ns.id&&o.x>=B.x-1)o.x+=sh})}
  const g2=B.x-(A.x+A.w);ns.x=Math.round(A.x+A.w+(g2-ns.w)/2);ns.y=Math.round(A.y+A.h/2-ns.h/2);bp1="l";ap2="r";if(bp2==="r"||bp2==="b"||bp2==="t")bp2="l";
 }else if(B.y>A.y+A.h&&c.ap!=="l"){
  const gap=B.y-(A.y+A.h),need=ns.h+2*52;if(gap<need){const sh=need-gap,set=downOf(doc,B.id);doc.shapes.forEach(o=>{if(solid(o)&&o.id!==ns.id&&set.has(o.id))o.y+=sh})}
  const g2=B.y-(A.y+A.h);ns.y=Math.round(A.y+A.h+(g2-ns.h)/2);ns.x=Math.round(A.x+A.w/2-ns.w/2);bp1="t";ap2="b";if(bp2!=="t")bp2="t";
 }else{
  const p1=portPt(A,c.ap),p2=portPt(B,c.bp);ns.x=Math.round((p1[0]+p2[0])/2-ns.w/2);ns.y=Math.round((p1[1]+p2[1])/2-ns.h/2);
  const f1=ns.x>=A.x+A.w?["r","l"]:ns.y>=A.y+A.h?["b","t"]:["l","r"];bp1=f1[1];ap2=OPP[bp1]}
 return[addConn(doc,A.id,ns.id,ap1,bp1,{lb:c.lb||"",auto:true}),addConn(doc,ns.id,B.id,ap2,bp2,{lb:ns.t==="gateway"?"Yes":"",auto:true})];
}
/* lift a connected shape out of its place (bridging its neighbours) so it can be inserted elsewhere. false when it has a real fan-in or fan-out */
function detach(doc,s){
 const I=ins(doc,s.id),O=outs(doc,s.id);if(I.length>1||O.length>1)return false;
 doc.conns=doc.conns.filter(c=>!(c.kind==="flow"&&(c.a===s.id||c.b===s.id)));
 if(I.length&&O.length)addConn(doc,I[0].a,O[0].b,I[0].ap,O[0].bp,{lb:I[0].lb||"",auto:true});
 return true;
}
/* drop a shape on a box: zone is "before", "after" or "branch" */
function insertBox(doc,T,zone,ns){
 const I=ins(doc,T.id),O=outs(doc,T.id),G=68;
 if(zone==="before"&&T.t==="start")zone="after";
 if(zone==="after"&&T.t==="end")zone="before";
 if(zone==="before"){
  if(I.length)return insertInto(doc,I[0],ns);
  ns.x=T.x-ns.w-G;ns.y=Math.round(T.y+T.h/2-ns.h/2);return[addConn(doc,ns.id,T.id,"r","l",{auto:true})];
 }
 if(zone==="after"){
  if(O.length)return insertInto(doc,O[0],ns);
  ns.x=T.x+T.w+G;ns.y=Math.round(T.y+T.h/2-ns.h/2);return[addConn(doc,T.id,ns.id,"r","l",{lb:branchLabel(doc,T),auto:true})];
 }
 /* branch */
 if(T.t==="gateway"||T.t==="parallel"||!I.length){
  const ap=freePort(doc,T,"b",true)||"b";ns.y=T.y+T.h+54;ns.x=ap==="b"?Math.round(T.x+T.w/2-ns.w/2):T.x+T.w+G;
  if(ap==="r"){ns.y=Math.round(T.y+T.h/2-ns.h/2)}
  return[addConn(doc,T.id,ns.id,ap,OPP[ap],{lb:branchLabel(doc,T),auto:true})];
 }
 const P=getS(doc,I[0].a),out=[];ns.x=T.x;ns.y=T.y+T.h+54;
 const ap=freePort(doc,P,P.t==="gateway"?"b":"r",true)||"b";
 out.push(addConn(doc,P.id,ns.id,ap,ap==="b"?"t":"l",{lb:branchLabel(doc,P),auto:true}));
 if(O.length)out.push(addConn(doc,ns.id,O[0].b,"r",O[0].bp,{auto:true}));
 return out;
}
D.resolve=resolve;D.overlaps=overlaps;D.insertInto=insertInto;D.insertBox=insertBox;D.detach=detach;D.boxHit=boxHit;D.downOf=downOf;
/* middle point of a connector along its length */
function midPt(doc,c,fr){const pts=route(doc,c);if(pts.length<2)return null;let tot=0;for(let i=1;i<pts.length;i++)tot+=dist(pts[i-1],pts[i]);let h=tot*(fr==null?.5:fr);for(let i=1;i<pts.length;i++){const l=dist(pts[i-1],pts[i]);if(h<=l||i===pts.length-1){const t=l?h/l:0;return[pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t,pts]}h-=l}return null}
D.midPt=midPt;
})();

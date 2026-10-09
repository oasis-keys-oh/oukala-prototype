/* ---------- metrics ---------- */
Object.assign(METRICS,{
 m_mm_pp:{n:"Modules with a documented push and pull",f:"Modules that have at least one outgoing and one incoming data flow, each carrying a registered entity ÷ all modules × 100",u:"%",cur:90,tgt:100,badAt:70,dir:"max",max:100,tr:[52,60,66,72,78,84,88,90],owner:"Platform team",use:["Master process flow"],rem:{kind:"sop",ref:"SOP-720",title:"Document a module's data flows",agent:"Registry Agent",auto:false,state:"idle",prog:"Proposes the missing flow and the registry entity it should carry"}},
 m_mm_ct:{n:"Cross-module flows with a registered data contract",f:"Flows whose data maps to at least one registered entity ÷ all documented flows × 100",u:"%",cur:85,tgt:95,badAt:70,dir:"max",max:100,tr:[48,55,63,70,76,80,83,85],owner:"Data council",use:["Master process flow","Platform registry"],rem:{kind:"agent",ref:"AG-MM1",title:"Register the missing entity",agent:"Registry Agent",auto:false,state:"idle",prog:"Drafts the entity with owner and steward from the planned list"}},
 m_mm_live:{n:"Flows on a live or near-live path",f:"Flows whose slowest field is live or near-live ÷ flows with a registered contract × 100",u:"%",cur:60,tgt:70,badAt:40,dir:"max",max:100,tr:[40,44,48,52,55,57,59,60],owner:"Integration lead",use:["Master process flow","Integration fabric"],rem:{kind:"kb",ref:"KB0722",title:"Move a batch flow to events",agent:"Integration Agent",auto:false,state:"idle",prog:"Finds batch flows whose source can publish events"}}
});
/* ---------- state ---------- */
let READY=false,MODS=[],MB={},FL=[],OUT={},INN={},PLN={},DROP=[],PAIRN=new Map(),LAY=null;
const FRESH=["live","near-live","hourly","daily"],MODEN={e:"event",b:"batch",h:"human"};
const NW=150,NH=54,GX=22,GL=104,ROWP=80,LTOP=40,LGAP=12,MAXC=8;
const scName=id=>{const s=SCREENS.find(x=>x[0]===id);return s?s[1]:id};
const stepsOf=id=>{const d=window.PROC&&PROC.defs[id];return d?(S.proc&&S.proc[id])||d.steps||[]:null};
function init(){
 if(READY)return true;
 if(!window.PLAT||!PLAT.entities||!window.PROC)return false;
 const ents=PLAT.entities();PLN={};(PLAT.PLANNED||[]).forEach(p=>PLN[p[0]]={id:p[0],dom:p[1],label:p[2],steward:p[3],why:p[4],use:p[5]});
 const entMap={};ents.forEach(e=>entMap[e.id]=e);
 MODS=[];MB={};
 CUR.split("\n").forEach(line=>{
  const c=line.split("|");if(c.length<5)return;
  const id=c[0],ap=PLAT.APPS.find(a=>a.id===id);
  const r=new Set(ap?ap.reads:[]),w=new Set(ap?ap.writes:[]);
  (c[5]||"").split(",").filter(Boolean).forEach(x=>{if(entMap[x])r.add(x)});(c[6]||"").split(",").filter(Boolean).forEach(x=>{if(entMap[x])w.add(x)});
  const st=stepsOf(id);
  const m={id,sn:c[1],name:scName(id),band:c[2],bi:BI[c[2]],own:c[3],al:c[4].split(",").map(s=>s.trim().toLowerCase()).filter(Boolean),app:ap?ap.id:null,r:[...r],w:[...w],proc:st?id:null,steps:st?st.length:0,scr:id};
  m.al.push(m.sn.toLowerCase());if(m.name.toLowerCase()!==m.sn.toLowerCase())m.al.push(m.name.toLowerCase());
  MODS.push(m);MB[id]=m;
 });
 /* flows */
 FL=[];OUT={};INN={};DROP=[];PAIRN=new Map();
 MODS.forEach(m=>{OUT[m.id]=[];INN[m.id]=[]});
 FLOWS.forEach((line,i)=>{
  const p=line.split("|");if(p.length<6)return;
  const ft=p[0].split(">"),a=ft[0],b=ft[1];
  if(!MB[a]||!MB[b]||a===b){DROP.push({flow:p[0],why:"Unknown module"});return}
  const refs=[];
  if(p[2]!=="-")p[2].split(";").forEach(tok=>{
   const q=tok.split("."),id=q[0],fs=(q[1]||"").split(",").filter(Boolean),e=entMap[id];
   if(e){const keys={};e.fields.forEach(f=>keys[f.k]=f);const ok=[];fs.forEach(k=>{if(keys[k])ok.push(k);else DROP.push({flow:p[0],why:"Unknown field "+id+"."+k})});
    refs.push({id,kind:"reg",label:e.label,owner:e.owner,steward:e.steward,cls:e.cls,f:ok.map(k=>{const fm=PLAT.fieldMeta(id,keys[k]);return Object.assign({k,label:keys[k].label||k,type:keys[k].type||"string"},fm)})})}
   else if(PLN[id])refs.push({id,kind:"plan",label:PLN[id].label,owner:"Not yet registered",steward:PLN[id].steward,why:PLN[id].why,f:[]});
   else DROP.push({flow:p[0],why:"Unknown entity "+id});
  });
  const reg=refs.some(r=>r.kind==="reg"),plan=refs.some(r=>r.kind==="plan");
  let fresh=null;refs.forEach(r=>r.f.forEach(f=>{const ix=FRESH.indexOf(f.fresh);if(ix>=0&&(fresh===null||ix>FRESH.indexOf(fresh)))fresh=f.fresh}));
  const f={id:"f"+FL.length,from:a,to:b,data:p[1],refs,trig:p[3],mode:MODEN[p[4]]||"event",why:p[5],reg,plan,partial:reg&&plan,status:reg?"registered":plan?"planned":"none",fresh:fresh||(reg?"live":"unknown")};
  FL.push(f);OUT[a].push(f);INN[b].push(f);
  const k=a+">"+b;if(!PAIRN.has(k))PAIRN.set(k,[]);PAIRN.get(k).push(f);
 });
 const NOW=PLAT.nonOwnerWrites();
 MODS.forEach(m=>{m.out=OUT[m.id];m.inn=INN[m.id];m.nout=OUT[m.id].length;m.nin=INN[m.id].length;
  m.eo=new Set();m.out.forEach(f=>f.refs.forEach(r=>m.eo.add(r.id)));m.ei=new Set();m.inn.forEach(f=>f.refs.forEach(r=>m.ei.add(r.id)));
  m.nonOwn=NOW.filter(x=>x.app===m.id)});
 layout();stats();
 READY=true;return true;
}
function layout(){
 const rowsOf=[];let y=0;const lanes=[];
 BANDS.forEach((bd,bi)=>{
  const ms=MODS.filter(m=>m.band===bd[0]);const per=ms.length>MAXC?Math.ceil(ms.length/2):MAXC;const rows=Math.max(1,Math.ceil(ms.length/per));
  const h=LTOP+rows*ROWP-14+14;
  ms.forEach((m,i)=>{const r=Math.floor(i/per),c=i%per;m.col=c;m.row=r;m.x=GL+18+c*(NW+GX);m.y=y+LTOP+r*ROWP;m.cx=m.x+NW/2;m.cy=m.y+NH/2});
  lanes.push({b:bd[0],name:bd[1],bi,y,h,n:ms.length});y+=h+LGAP;
 });
 LAY={lanes,W:GL+18+MAXC*(NW+GX)+10,H:y};
}
function stats(){
 const n=MODS.length,nf=FL.length;
 const pp=MODS.filter(m=>m.out.some(f=>f.reg)&&m.inn.some(f=>f.reg)).length;
 const ct=FL.filter(f=>f.reg).length;
 const reg=FL.filter(f=>f.reg);const live=reg.filter(f=>f.fresh==="live"||f.fresh==="near-live").length;
 METRICS.m_mm_pp.cur=Math.round(100*pp/Math.max(1,n));METRICS.m_mm_ct.cur=Math.round(100*ct/Math.max(1,nf));METRICS.m_mm_live.cur=Math.round(100*live/Math.max(1,reg.length));
 const bandPairs=new Map();FL.forEach(f=>{const a=MB[f.from].bi,b=MB[f.to].bi;if(a===b)return;const k=Math.min(a,b)+"-"+Math.max(a,b);bandPairs.set(k,(bandPairs.get(k)||[]).concat(f))});
 const fnd={noPush:MODS.filter(m=>!m.nout),noPull:MODS.filter(m=>!m.nin),noProc:MODS.filter(m=>!m.proc),noReg:MODS.filter(m=>!m.out.some(f=>f.reg)||!m.inn.some(f=>f.reg)),
  nonOwn:MODS.filter(m=>m.nonOwn.length),planned:{}};
 FL.forEach(f=>f.refs.forEach(r=>{if(r.kind==="plan")fnd.planned[r.id]=(fnd.planned[r.id]||0)+1}));
 fnd.noContract=FL.filter(f=>!f.reg);fnd.batch=FL.filter(f=>f.mode==="batch").length;
 window._mmStats=Object.assign({n,nf,pp,ct,live,reg:reg.length,bandPairs},{fnd});
}
const ST=()=>{init();return window._mmStats};
/* ---------- graph helpers ---------- */
const flowsBetween=(a,b)=>PAIRN.get(a+">"+b)||[];
const nameOf=id=>MB[id]?MB[id].sn:id;
function neighbors(id){const o=new Set(),i=new Set();(OUT[id]||[]).forEach(f=>o.add(f.to));(INN[id]||[]).forEach(f=>i.add(f.from));return{push:[...o],pull:[...i]}}
function blastOf(id,maxHop){
 maxHop=maxHop||3;const seen=new Set([id]);let fr=[id];const lv=[];
 for(let h=1;h<=maxHop;h++){const nx=[];fr.forEach(x=>(OUT[x]||[]).forEach(f=>{if(!seen.has(f.to)){seen.add(f.to);nx.push(f.to)}}));lv.push(nx);fr=nx}
 return lv;
}
function between(a,b){
 const direct=flowsBetween(a,b),rev=flowsBetween(b,a),two=[];
 MODS.forEach(x=>{if(x.id===a||x.id===b)return;
  const f1=flowsBetween(a,x.id),f2=flowsBetween(x.id,b);if(f1.length&&f2.length)two.push({dir:"ab",via:x.id,h:[f1,f2]});
  const g1=flowsBetween(b,x.id),g2=flowsBetween(x.id,a);if(g1.length&&g2.length)two.push({dir:"ba",via:x.id,h:[g1,g2]});});
 two.sort((p,q)=>(q.h[0].length*q.h[1].length)-(p.h[0].length*p.h[1].length)||nameOf(p.via).localeCompare(nameOf(q.via)));
 let chain=null;
 if(!direct.length&&!rev.length&&!two.length){
  const bfs=(s,t,undirected)=>{const prev={};prev[s]=null;let fr=[s];for(let d=0;d<5&&fr.length;d++){const nx=[];for(const x of fr){const nb=undirected?neighbors(x).push.concat(neighbors(x).pull):neighbors(x).push;for(const y of nb)if(!(y in prev)){prev[y]=x;if(y===t){const path=[t];let c=t;while(prev[c]!==null){c=prev[c];path.unshift(c)}return path}nx.push(y)}}fr=nx}return null};
  chain=bfs(a,b,false)||bfs(b,a,false)||bfs(a,b,true);
 }
 return{a,b,direct,rev,two,chain};
}
function matchMods(text){
 init();const t=" "+text.toLowerCase().replace(/[?.,]/g," ")+" ";const al=[];
 MODS.forEach(m=>m.al.forEach(x=>al.push([x,m.id])));al.sort((p,q)=>q[0].length-p[0].length);
 const found=[];let work=t;
 al.forEach(([x,id])=>{let i=work.indexOf(" "+x+" ");if(i<0)i=work.indexOf(" "+x+"s ");if(i<0)i=work.indexOf(" "+x+"'s ");if(i>=0){found.push([i,id]);const len=x.length+2;work=work.slice(0,i)+" ".repeat(len)+work.slice(i+len)}});
 const out=[];found.sort((p,q)=>p[0]-q[0]).forEach(f=>{if(!out.includes(f[1]))out.push(f[1])});return out;
}
window.MODMAP={
 get modules(){init();return MODS},get flows(){init();return FL},get bands(){return BANDS.map(b=>({id:b[0],name:b[1]}))},get dropped(){init();return DROP},
 between(a,b){init();return between(a,b)},neighbors(id){init();return neighbors(id)},blast(id,h){init();return blastOf(id,h)},match:matchMods,stats(){return ST()}
};

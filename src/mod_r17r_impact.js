/* R17 Impact and knowledge graph: choose any process (or scenario) as the starting point. Prefix r17imp- */
(function(){
 const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
 const ST={q:"",built:null};
 function ensureTypes(){try{if(typeof KT!=="undefined"){KT.proc=KT.proc||["Process","--p4"]}}catch(e){}}
 function procList(){return G(()=>LINKS.processes(),[])}
 function startLabel(){
  const id=S.kgStart;if(id&&String(id).indexOf("p:")===0){const n=(S.kgNew||[]).find(x=>x.id===id);return n?n.n:id}
  const n=G(()=>ANODE(id),null);return n?n.n:""
 }
 /* build the downstream process graph for pid into the engine's extra nodes and edges */
 function build(pid){
  ensureTypes();
  S.kgNew=(S.kgNew||[]).filter(n=>!n.dyn);window.KG_EXTRA=(window.KG_EXTRA||[]).filter(e=>!e.dyn);
  const procs=procList(),byId=new Map(procs.map(p=>[p.id,p]));if(!byId.has(pid))return false;
  const edges=G(()=>LINKS.processEdges(),[]);
  const depth=new Map([[pid,0]]),parent=new Map(),eds=[];let fr=[pid];
  while(fr.length&&depth.size<18){const nx=[];fr.forEach(u=>{edges.filter(e=>e.from===u&&(e.mode!=="data"&&e.kind!=="data"||u===pid)).forEach(e=>{if(depth.get(u)>=3)return;if(!depth.has(e.to)&&depth.size<18){depth.set(e.to,depth.get(u)+1);nx.push(e.to)}if(depth.has(e.to)&&depth.get(e.to)===depth.get(u)+1)eds.push(e)})});fr=nx}
  const cols={};depth.forEach((d,id)=>{(cols[d]=cols[d]||[]).push(id)});
  const NW=172,COLW=218,H=730;
  const nodes=[];
  Object.keys(cols).forEach(d=>{const ids=cols[d],step=Math.min(100,(H-120)/Math.max(1,ids.length));const y0=(H-step*(ids.length-1)-58)/2;
   ids.forEach((id,i)=>{const p=byId.get(id),pl=G(()=>PROCLIB.get(id),null);
    nodes.push({id:"p:"+id,dyn:1,t:"proc",n:p.name,owner:(pl&&pl.owner)||"Unassigned",sub:(p.family||"")+"",hrs:2,x:30+d*COLW,y:Math.max(10,y0+i*step)})})});
  S.kgNew.push(...nodes);
  const ent=e=>G(()=>PLAT.ent(e).label,String(e).replace(/_/g," "));
  eds.forEach(e=>{const lab=(e.kind==="data"||e.mode==="data")?("data: "+(e.entities||[]).slice(0,2).map(ent).join(", ")):"hands off to";const a=["p:"+e.from,"p:"+e.to,lab];a.dyn=1;window.KG_EXTRA.push(a)});
  return true;
 }
 function choose(v){
  if(!v)return;
  if(String(v).indexOf("s:")===0){S.kgStart=v.slice(2)}
  else{if(!build(v)){try{toast("That process has no downstream links to draw.","info")}catch(e){}return}S.kgStart="p:"+v}
  S.kgTasks=null;S.kgDone={};try{audit("Impact graph: started from "+(v))}catch(e){}render();
 }
 function picker(){
  if(!window.PICKER)return"";
  const procs=procList();
  const src=[].concat(G(()=>KSCEN,[]).map(k=>({v:"s:"+k[0],l:k[1],sub:"Scenario",grp:"Scenarios"})),procs.map(p=>({v:p.id,l:p.name,sub:(p.entities&&p.entities.all?p.entities.all.length:"")+"",grp:"Processes: "+(p.family||"Other")})).sort((a,b)=>a.grp.localeCompare(b.grp)||a.l.localeCompare(b.l)));
  src.forEach(x=>{if(x.grp!=="Scenarios")x.sub=""});
  const cur=String(S.kgStart||"");
  const val=cur.indexOf("p:")===0?cur.slice(2):("s:"+cur);
  return `<div class="r17imp-pick"><div class="r17imp-lbl small muted">Start from any process or scenario</div>${PICKER.html({id:"kg_start",label:"Start from",noun:"processes",source:src,value:val,none:"",group:true,height:320,placeholder:"Search "+procs.length+" processes",onPick:choose})}<span class="small muted">${procs.length} of ${G(()=>PROCLIB.list().length,procs.length)} processes have documented links and can be traced. Select a card in the graph to move the start point.</span></div>`;
 }
 window.R17IMP={picker,choose,build,startLabel,procCount:()=>procList().length};
})();

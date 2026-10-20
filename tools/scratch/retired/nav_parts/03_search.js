
/* =====================================================================================
   GLOBAL SEARCH: one lazily built index over screens, records, people, processes, data,
   metrics, knowledge and actions. Ranks prefix, then word, then fuzzy; favors favorites
   and recently visited; stays fast with 100k+ records by capping and time-slicing.
   ===================================================================================== */
const SCOPES=[["all","All"],["screen","Screens"],["record","Records"],["person","People"],["process","Processes"],["data","Data"],["metric","Metrics"],["knowledge","Knowledge"],["action","Actions"]];
const TYL={screen:"Screens and modules",record:"Records",person:"People",process:"Processes",data:"Data entities and fields",metric:"Metrics",knowledge:"Knowledge articles",action:"Actions you can take"};
const TYORD=["action","screen","record","person","process","data","metric","knowledge"];
const TYW={action:6,screen:10,person:3,process:4,data:1,metric:2,knowledge:2,record:0};
const TYCOL={screen:"--accent",record:"--e4",person:"--p4",process:"--s3",data:"--u3",metric:"--metric-f",knowledge:"--story-f",action:"--good-f"};
const TYICO={screen:ICO.plat,record:ICO.doc,person:ICO.user,process:ICO.flow,data:ICO.table,metric:ICO.chart,knowledge:ICO.doc,action:ICO.bolt};
const SCOPE_ALIAS={screen:"screen",screens:"screen",module:"screen",modules:"screen",menu:"screen",record:"record",records:"record",ticket:"record",tickets:"record",person:"person",people:"person",user:"person",users:"person",team:"person",process:"process",processes:"process",flow:"process",flows:"process",data:"data",field:"data",fields:"data",entity:"data",entities:"data",table:"data",tables:"data",metric:"metric",metrics:"metric",kpi:"metric",knowledge:"knowledge",kb:"knowledge",article:"knowledge",articles:"knowledge",action:"action",actions:"action",do:"action",all:"all"};
const SYN={inc:["incident"],incident:["inc"],chg:["change"],change:["chg"],prb:["problem"],problem:["prb"],kb:["knowledge","article"],ci:["configuration item"],cis:["configuration item"],cmdb:["configuration"],sla:["service level"],ola:["operational level"],po:["purchase order"],pr:["project"],ritm:["request"],req:["request"],reqs:["request"],doa:["delegation"],raid:["risk"],tbm:["cost transparency"],mtg:["meeting"],ppl:["people"],hr:["people"],ap:["invoice"],bill:["invoice"],bills:["invoice"],pay:["invoice","payment"],oncall:["on call"],pto:["calendar"],wbs:["work breakdown"],okr:["objective"],okrs:["objective"],dmn:["decision"],bpmn:["process"],finops:["cloud cost"],it:["technology"],owner:["owner"],laptop:["order","request"],access:["security","request"],broken:["incident"],outage:["incident"],down:["incident"],slow:["incident"],buy:["order","purchase"],boss:["manager"],approvals:["approval","approve"],approval:["approvals","approve"],approve:["approval"],ticket:["incident","request"],tickets:["incident","request"],vendor:["vendors","supplier"],contract:["contracts"],budget:["budgets"],hire:["onboarding"],joiner:["onboarding"],leaver:["offboarding"]};
const STOP=new Set(["the","a","an","to","of","for","my","i","me","how","do","can","in","on","and","or","with","want","need","would","like","please","show","open","go","find","get","is","are","where","what","which","that","this","about","it","some","new"]);
const HEAVY=/computeAll\(|LIN\.(trace|ids)\(|SCALE\.(cis|tickets|incidents|changes)\(/;
const IDX={items:[],built:false,building:false,dirty:false,sig:"",vocab:new Set(),keys:new Set(),timings:[],done:0,total:0,gen:0,lastMs:0,partial:false,skipped:[]};
NAVX.index=IDX;
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function acro(t){const w=String(t).replace(/\([^)]*\)/g,"").split(/[^A-Za-z0-9]+/).filter(x=>x&&!/^(and|of|the|a|to|for|in|on)$/i.test(x));return w.length>=2?w.map(x=>x[0]).join("").toLowerCase():""}
function mkItem(ty,t,m,c,f,k,key,x){t=String(t==null?"":t).replace(/\s+/g," ").trim();if(!t)return null;const it={ty,t,m:String(m==null?"":m),c:c||TYCOL[ty]||"--accent",f,k:String(k||""),key:key||""};
 it.tl=t.toLowerCase();it.h=(it.tl+" "+it.m.toLowerCase()+" "+it.k.toLowerCase()).slice(0,520);if(ty==="screen"||ty==="process"||ty==="data"||ty==="metric"||ty==="knowledge"||ty==="action"){const a=acro(t);it.ac=a+(x&&x.ac?" "+x.ac:"")}if(x)Object.assign(it,x);return it}
function pushTo(B,it){if(!it||B.n>=B.cap)return;const dk=it.ty+"|"+(/^([A-Z]{1,6}-?\d{2,})\b/.test(it.t)?RegExp.$1.toLowerCase():norm(it.t));if(B.keys.has(dk))return;B.keys.add(dk);B.items.push(it);
 if(B.items.length<=90000){it.tl.split(/[^a-z0-9]+/).forEach(w=>{if(w.length>=3&&B.vocab.size<60000)B.vocab.add(w)})}}
const GMAP=[[/^(go to|screens?|modules?)$/i,"screen"],[/^(people|contractors|providers|ai agents)$/i,"person"],[/process|workflows?$|journeys|^flows?$/i,"process"],[/^(data model|data diagram|proposed entities|data connections|registry|metric calculations|chart data sources|integration fabric|data model coverage|data model gaps)|^data /i,"data"],[/^metrics$/i,"metric"],[/^(knowledge|knowledge articles|knowledge items|prompts|terms playbook|agent skills|ai test suites)$/i,"knowledge"],[/^(chat tools|agent tools|mcp tools|actions)$/i,"action"]];
const tyOfGroup=g=>{for(const r of GMAP){if(r[0].test(g))return r[1]}return"record"};
const goTbl=(screen,id)=>()=>{go(screen);let n=0;const iv=setInterval(()=>{const i=q1("#view [data-bt-q]");if(i){clearInterval(iv);i.value=id;i.dispatchEvent(new Event("input",{bubbles:true}))}else if(++n>12)clearInterval(iv)},150)};
function sources(){const L=[];
 L.push(["Screens",()=>{const o=[];const MA={};G(()=>MODMAP.modules).forEach(md=>{if(md&&md.scr)MA[md.scr]=((MA[md.scr]||"")+" "+(md.al||[]).join(" ")+" "+(md.name||"")).trim()});SCREENS.forEach(s=>{const id=s[0],m=resolve(id),f=formal(id);const ex=[m.kw,f,hintOf(id),OLDGN[oldGroup(id)]||"",m.sub,gLabel(m.g)].join(" ");
  o.push(mkItem("screen",m.l,gLabel(m.g)+(hintOf(id)?" · "+hintOf(id):""),"--accent",()=>go(id),ex+" "+(MA[id]||""),"screen:"+id,{sid:id,ac:acro(f)}))});
  G(()=>MODMAP.modules).forEach(md=>{if(!md||!md.id||(md.scr&&screenRow(md.scr)))return;o.push(mkItem("screen",md.name||md.sn,"Module · process flow","--p4",()=>MODMAP.select(md.id),(md.al||[]).join(" ")+" "+md.id,"module:"+md.id,{ac:acro(md.sn||md.name)}))});return o}]);
 L.push(["Actions",()=>actionItems()]);
 L.push(["People",()=>(G(()=>DIR)||[]).map(d=>mkItem("person",d.name,d.role+" · "+d.team,d.c||"--p4",()=>person360(d.name),(d.skills||[]).join(" ")+" "+(d.email||"")+" "+d.kind+" "+(d.loc||""),"person:"+d.name))]);
 L.push(["Records",()=>{const o=[];G(()=>NODES).forEach(n=>o.push(mkItem("record",n.n,TYPES[n.t][0]+" · "+n.id,TYPES[n.t][1],()=>recDrawer(n.id),n.story,"record:"+n.id)));
  G(()=>KGN).forEach(n=>o.push(mkItem("knowledge",n.n,KT[n.t][0],KT[n.t][1],()=>go("kg",n.id),n.sub,"kg:"+n.id)));
  G(()=>MEETINGS).forEach(m=>o.push(mkItem("record",m.t,"Meeting · Oct "+m.d,"--e4",()=>go("fo",m.id),"","meeting:"+m.id)));
  G(()=>INVOICES).forEach(i=>o.push(mkItem("record",i.id+" · "+i.vendor,"Invoice · "+money(i.amt),"--e4",()=>go("inv",i.id),"","invoice:"+i.id)));
  G(()=>DEMAND).forEach(d=>o.push(mkItem("record",d.n,"Demand · "+K$(d.cost),"--u3",()=>{go("port");demandDrawer(d.id)},d.why,"demand:"+d.id)));return o}]);
 L.push(["Metrics",()=>Object.keys(METRICS).map(id=>{const m=METRICS[id];return mkItem("metric",m.n,mfmt(m)+" · "+m.owner,"--metric-f",()=>go("metrics",id),m.f+" "+id,"metric:"+id)})]);
 L.push(["Processes",()=>(G(()=>PROCLIB.list())||[]).map(p=>mkItem("process",p.name,"Process · "+(p.familyName||"")+" · level "+p.level,"--s3",()=>PROCLIB.open(p.id),p.owner+" "+p.module+" "+p.id,"process:"+p.id))]);
 L.push(["Data entities",()=>(G(()=>PLAT.entities())||[]).map(e=>mkItem("data",e.label,"Data entity · "+(e.domain||"")+" · "+(e.nf||(e.fields||[]).length)+" fields","--u3",()=>ATLAS.focus(e.id),e.id+" "+(e.owner||"")+" "+(e.note||""),"entity:"+e.id))]);
 const sx=typeof SEARCHX!=="undefined"?SEARCHX:[];sx.forEach((fn,i)=>L.push(["Provider "+(i+1),()=>{const r=fn()||[];const o=[];for(let j=0;j<r.length&&j<6000;j++){const x=r[j];if(!x||!x.t)continue;const ty=tyOfGroup(String(x.g||""));if(ty==="screen")continue;o.push(mkItem(ty,x.t,(x.g?x.g+" · ":"")+(x.m||""),x.c,x.f,x.k,"",{g:x.g}))}return o},HEAVY.test(String(fn))?"heavy":"prov"]));
 L.push(["Data fields",()=>{const o=[];(G(()=>PLAT.entities())||[]).forEach(e=>(e.fields||[]).forEach(f=>{if(o.length<9000)o.push(mkItem("data",f.label||f.k,"Field · "+e.label,"--u3",()=>ATLAS.focus(e.id),f.k+" "+(f.type||"")+" "+e.id,"field:"+e.id+"."+f.k))}));return o}]);
 if(W.SCALE&&SCALE.on){
  L.push(["Enterprise incidents",()=>(G(()=>ITSMX.incidents)||[]).slice(0,1500).map(i=>mkItem("record",i.id+" "+(i.t||i.title||""),"Incident · "+(i.st||i.state||""),"--bad-f",goTbl("itsm_inc",i.id),i.svc||i.service||"","inc:"+i.id))]);
  L.push(["Enterprise changes",()=>(G(()=>ITSMX.changes)||[]).slice(0,1200).map(i=>mkItem("record",i.id+" "+(i.t||i.title||""),"Change · "+(i.st||i.state||""),"--warn-f",goTbl("itsm_chg",i.id),i.svc||i.service||"","chg:"+i.id))]);
  L.push(["Enterprise problems",()=>(G(()=>ITSMX.problems)||[]).slice(0,800).map(i=>mkItem("record",i.id+" "+(i.t||i.title||""),"Problem","--warn-f",goTbl("itsm_prb",i.id),i.svc||i.service||"","prb:"+i.id))]);
  L.push(["Enterprise projects",()=>(G(()=>SCALE.projects())||[]).slice(0,300).map(p=>mkItem("record",p.n||p.name||p.id,"Project · "+(p.phase||""),"--p4",goTbl("ppm_proj",p.id),p.owner||"","proj:"+p.id))]);
  L.push(["Enterprise RAID",()=>(G(()=>SCALE.raid())||[]).slice(0,1500).map(r=>mkItem("record",r.id+" "+r.t,"RAID · "+r.kind+" · "+r.project,"--warn-f",goTbl("ppm_raid",r.id),r.owner||"","raid:"+r.id))])}
 return L}
function sigNow(){return [W.SCALE&&SCALE.on?1:0,SCREENS.length,G(()=>DIR.length),G(()=>SEARCHX.length),G(()=>PROCLIB.list().length),G(()=>Object.keys(DATAMODEL.tables).length),G(()=>Object.keys(METRICS).length),Object.keys(MAP).length,Object.keys(OVR).length].join("|")}
let buildTimer=0;
function ensureIndex(force){const sg=sigNow();if(IDX.building)return;if(IDX.built&&!force&&!IDX.dirty&&IDX.sig===sg)return;
 IDX.building=true;IDX.heavyWait=0;IDX.dirty=false;IDX.sig=sg;const B={items:[],keys:new Set(),vocab:new Set(),n:0,cap:120000};const first=!IDX.built;const t0=performance.now();
 let L=sources();L=L.filter(s=>s[2]!=="heavy").concat(L.filter(s=>s[2]==="heavy"));IDX.total=L.length;IDX.done=0;IDX.timings=[];IDX.skipped=[];if(first){IDX.items=B.items;IDX.vocab=B.vocab;IDX.keys=B.keys}
 let i=0;const step=()=>{if(i>=L.length){IDX.items=B.items;IDX.vocab=B.vocab;IDX.keys=B.keys;IDX.built=true;IDX.building=false;IDX.buildMs=Math.round(performance.now()-t0);if(PAL.open)refreshPal();return}
  const s=L[i];if(s[2]==="heavy"&&W.SCALE&&SCALE.on){if(PAL.open){buildTimer=setTimeout(step,2500);return}if(!IDX.heavyWait){IDX.heavyWait=1;buildTimer=setTimeout(step,4000);return}}
  i++;const ts=performance.now();let n=0;
  try{const r=s[1]()||[];r.forEach(it=>{if(it){it.f=it.f||(()=>{});const b=B.items.length;pushTo(B,it);B.n=B.items.length}});n=r.length}catch(e){IDX.skipped.push(s[0])}
  const ms=Math.round(performance.now()-ts);IDX.timings.push([s[0],ms,n]);IDX.done=i;
  if(PAL.open&&(first||i%6===0))refreshPal(true);
  buildTimer=setTimeout(step,ms>120?30:0)};
 buildTimer=setTimeout(step,0)}
NAVX.ensureIndex=ensureIndex;
/* lazy refresh: rebuild after the data volume changes, but only if search has been used */
(function(){const w=()=>{if(W.SCALE&&SCALE.set&&!SCALE.set.__nx){const f=SCALE.set;SCALE.set=function(){const r=f.apply(this,arguments);if(IDX.built||IDX.building){IDX.dirty=true;if(!IDX.building)setTimeout(()=>ensureIndex(true),900)}return r};SCALE.set.__nx=1}};w();setTimeout(w,0)})();

/* ---------- ranking ---------- */
function toks(raw,describe){let t=raw.toLowerCase().split(/[^a-z0-9#._-]+/).filter(Boolean);const nonstop=t.filter(x=>!STOP.has(x));if(nonstop.length>=1&&(describe||t.length>2||nonstop.length<t.length&&nonstop.length>=1))t=nonstop;return t.slice(0,8)}
function alts(tok){const a=[tok];if(tok.length>3&&tok.slice(-1)==="s")a.push(tok.slice(0,-1));else if(tok.length>2)a.push(tok+"s");if(tok.length>4&&/ies$/.test(tok))a.push(tok.slice(0,-3)+"y");(SYN[tok]||[]).forEach(x=>a.push(x));return a}
function lev(a,b,max){const al=a.length,bl=b.length;if(Math.abs(al-bl)>max)return max+1;let p=new Array(bl+1),c=new Array(bl+1);for(let j=0;j<=bl;j++)p[j]=j;
 for(let i=1;i<=al;i++){c[0]=i;let mn=c[0];for(let j=1;j<=bl;j++){let v=a.charCodeAt(i-1)===b.charCodeAt(j-1)?p[j-1]:p[j-1]+1;if(p[j]+1<v)v=p[j]+1;if(c[j-1]+1<v)v=c[j-1]+1;if(i>1&&j>1&&a.charCodeAt(i-1)===b.charCodeAt(j-2)&&a.charCodeAt(i-2)===b.charCodeAt(j-1)&&p[j-2]+1<v)v=p[j-2]+1;c[j]=v;if(v<mn)mn=v}if(mn>max)return max+1;const t=p;p=c;c=t}return p[bl]}
function fixTok(tok){if(tok.length<4)return null;const V=IDX.vocab;if(V.has(tok))return null;let pre=false;const max=tok.length<=5?1:2;let best=null,bd=9;
 V.forEach(w=>{if(!pre&&w.indexOf(tok)===0)pre=true;if(Math.abs(w.length-tok.length)>max)return;const d=lev(tok,w,max);if(d<bd||(d===bd&&best&&w.length<best.length)){bd=d;best=w}});
 return pre?null:(bd<=max?best:null)}
function pref(){const s=st();const fav=new Set(),hs=new Map();s.fav.forEach(f=>{fav.add(f.title.toLowerCase());if(f.kind==="screen")fav.add("screen:"+f.key)});s.hist.slice(0,40).forEach((h,i)=>{hs.set(h.title.toLowerCase(),40-i);if(h.kind==="screen")hs.set("screen:"+h.key,40-i)});return {fav,hs}}
function scoreItem(it,T,A,q,P,acro_){let sc=0,all=true;const tl=it.tl,h=it.h;
 for(let i=0;i<T.length;i++){let best=0;const al=A[i];for(let j=0;j<al.length;j++){const a=al[j];const p=tl.indexOf(a);let s=0;
   if(p===0)s=34;else if(p>0&&(tl.charCodeAt(p-1)<48||(tl.charCodeAt(p-1)>57&&tl.charCodeAt(p-1)<97)))s=28;else if(p>0)s=14;else if(h.indexOf(a)>=0)s=(h.indexOf(" "+a)>=0?9:6);
   if(j>0&&s)s-=4;if(s>best)best=s}
  if(!best){if(acro_&&i===0&&T.length===1&&it.ac&&(it.ac.split(" ").indexOf(T[0])>=0||it.ac.indexOf(T[0])===0)){best=40}else{all=false;break}}
  sc+=best}
 if(!all)return 0;
 if(tl===q)sc+=110;else if(tl.indexOf(q)===0)sc+=48;else if(tl.indexOf(q)>0)sc+=16;
 if(it.key&&(it.key.slice(it.key.indexOf(":")+1).toLowerCase()===q))sc+=90;
 sc+=TYW[it.ty]||0;sc-=Math.min(14,tl.length/12);
 const bs=P.hs.get(it.key)||P.hs.get(tl);if(bs)sc+=12+bs*.45;if(P.fav.has(it.key)||P.fav.has(tl))sc+=34;
 return sc}
function runSearch(raw,o){o=o||{};const t0=performance.now();let q=String(raw||"").trim(),scope=o.scope||"all";
 const m=q.match(/^in:\s*([a-z]+)\s*(.*)$/i)||q.match(/^(.*?)\s+in:\s*([a-z]+)$/i);
 if(m){const isFirst=/^in:/i.test(q);const key=(isFirst?m[1]:m[2]).toLowerCase(),rest=isFirst?m[2]:m[1];if(SCOPE_ALIAS[key]){scope=SCOPE_ALIAS[key];q=rest}}
 const ql=q.toLowerCase();const T=toks(q,o.describe);const out={q,scope,tokens:T,by:{},total:0,fixed:null,ms:0,counts:{}};
 if(!T.length){out.ms=0;return out}
 const P=pref();let A=T.map(alts);const items=IDX.items,N=items.length;const per={},cnt={};
 const pass=(A2,T2,penalty)=>{const acro_=T2.length===1&&T2[0].length>=2&&T2[0].length<=6;
  for(let i=0;i<N;i++){const it=items[i];if(scope!=="all"&&it.ty!==scope)continue;if(o.describe&&it.ty!=="screen"&&it.ty!=="action")continue;
   const s=scoreItem(it,T2,A2,ql,P,acro_);if(s>0){cnt[it.ty]=(cnt[it.ty]||0)+1;let a=per[it.ty];if(!a)a=per[it.ty]=[];const sc=s-penalty;
    if(a.length<260||sc>a.min){a.push({it,sc});if(a.length>=520){a.sort((x,y)=>y.sc-x.sc);a.length=260}a.min=Math.min(a.min==null?1e9:a.min,sc)}}}};
 pass(A,T,0);
 let total=0;for(const k in cnt)total+=cnt[k];
 if(total<5){const T2=T.map(t=>{const f=fixTok(t);return f||t});const changed=T2.some((t,i)=>t!==T[i]);if(changed){const A2=T2.map(alts);const before=total;pass(A2,T2,22);out.fixed=T2.join(" ");total=0;for(const k in cnt)total+=cnt[k];if(total===before)out.fixed=null}}
 for(const k in per){per[k].sort((x,y)=>y.sc-x.sc)}
 out.by=per;out.counts=cnt;out.total=total;out.ms=Math.round((performance.now()-t0)*10)/10;IDX.lastMs=out.ms;return out}
NAVX.search=function(q,o){o=o||{};const r=runSearch(q,o);const lim=o.limit||20;const all=[];Object.keys(r.by).forEach(k=>r.by[k].forEach(x=>all.push(x)));all.sort((a,b)=>b.sc-a.sc);return {q:r.q,scope:r.scope,total:r.total,ms:r.ms,fixed:r.fixed,counts:r.counts,results:all.slice(0,lim).map(x=>({type:x.it.ty,title:x.it.t,meta:x.it.m,score:Math.round(x.sc),open:x.it.f}))}};

/* ---------- quick actions ---------- */
function runAct(sc,re){if(!screenRow(sc))return;go(sc);if(!re)return;let n=0;const iv=setInterval(()=>{const b=qa("#view button").find(x=>re.test((x.textContent||"").trim().replace(/\s+/g," ")));if(b){clearInterval(iv);b.click()}else if(++n>16)clearInterval(iv)},150)}
function actionItems(){const A=[];const add=(t,m,k,f,x)=>A.push(mkItem("action",t,m,"--good-f",f,k,"action:"+t,x));
 const has=id=>!!screenRow(id);
 if(has("itsm_inc"))add("Create an incident","Log something that is broken","new log report broken outage create incident",()=>runAct("itsm_inc",/^Log incident$/));
 if(has("itsm_chg"))add("Raise a change","Ask to change a service","new request change create raise cab",()=>runAct("itsm_chg",/^Request change$/));
 if(has("itsm_prb"))add("Open a problem record","Find the root cause of repeat incidents","new problem root cause",()=>runAct("itsm_prb",/^New problem$/));
 if(has("flw_appr"))add("Open my approvals","Everything waiting for your decision","approvals approve decisions waiting inbox",()=>go("flw_appr"));
 if(has("meet_hub"))add("Schedule a meeting","Set a time, invite people, add an agenda","schedule meeting calendar invite agenda",()=>go("meet_hub"));else if(has("ppl_av"))add("Schedule a meeting","Book a room and set a time","schedule meeting calendar invite room",()=>runAct("ppl_av",/^Book a room$/));
 if(has("ppl_av"))add("Book a room","Reserve a room or a hybrid setup","book room conference",()=>runAct("ppl_av",/^Book a room$/));
 if(has("svc_portal"))add("Report a problem","Tell the service desk what is wrong","report problem broken help",()=>go("svc_portal"));
 if(has("svc_cat"))add("Order something","Laptop, access, software, new hire","order request laptop access software catalog",()=>go("svc_cat"));
 if(has("port"))add("Submit a project request","Propose new work for the portfolio","new project request demand idea",()=>runAct("port",/^New request$/));
 if(has("bud_ven")){add("Add a vendor","Register a supplier","new vendor supplier",()=>runAct("bud_ven",/^New vendor$/));add("Add a contract","Record a vendor contract","new contract vendor",()=>runAct("bud_ven",/^New contract$/));add("Add a purchase order","Create a purchase order","new purchase order po",()=>runAct("bud_ven",/^New purchase order$/))}
 if(has("ppm_raid"))add("Add a risk or issue","Log it in the RAID log","new risk issue assumption dependency raid",()=>runAct("ppm_raid",/^Add an entry$/));
 if(has("flw_design"))add("Start a new workflow","Design an automated process","new workflow automation design",()=>runAct("flw_design",/^New workflow$/));
 if(has("inv"))add("Approve invoices","Review invoices waiting for you","invoice approve pay hold",()=>go("inv"));
 add("Star this page","Add the current screen to favorites","star favorite pin bookmark",()=>{toggleFav(DR.cur&&q1("#drawer:popover-open")?DR.cur:mkScreen(S.screen));syncStars()});
 add("Show my favorites","Open your starred items","favorites starred bookmarks",()=>{const b=q1("#nxFavBtn")||q1("[popovertarget=nxFavPop]");lastInvoker=b;try{q1("#nxFavPop").showPopover()}catch(e){}});
 add("Show my history","Screens and records you visited","history recent visited yesterday",()=>{const b=q1("#nxHistBtn")||q1("[popovertarget=nxHistPop]");lastInvoker=b;try{q1("#nxHistPop").showPopover()}catch(e){}});
 add("Back to where I was","Return to the previous screen or record","back previous return",()=>goBack());
 add("Switch light or dark theme","Change how Oukala looks","theme dark light mode appearance",()=>{PREF.theme=(document.documentElement.getAttribute("data-theme")==="dark")?"light":"dark";applyPrefs();savePrefs();toast("Theme: "+PREF.theme)});
 add("Turn Clarity lens on or off","Show which fields tell the story","clarity lens story metric",()=>{const l=q1("#lens");if(l){l.checked=!l.checked}});
 add("Ask Oukala","Open the chat","chat ask assistant ai",()=>{if(W.CHATX&&CHATX.open)CHATX.open("chat");else{const c=q1("#chatOpen");if(c)c.checked=true}});
 return A}

/* ---------- palette ---------- */
const PAL={open:false,q:"",scope:"all",sel:0,rows:[],describe:false,res:null,prev:null,opened:0,activated:false,zero:false,had:false,more:{}};
function buildPalette(){const p=document.createElement("div");p.id="nxPal";p.className="nx-pal";p.hidden=true;p.setAttribute("role","dialog");p.setAttribute("aria-modal","true");p.setAttribute("aria-label","Search Oukala");
 p.innerHTML=`<div class="nx-palbox glass"><div class="nx-phead">${SVG(ICO.search,20,2)}<input id="nxPalIn" type="text" role="combobox" aria-expanded="true" aria-controls="nxPalList" aria-autocomplete="list" aria-label="Search" placeholder="Search screens, records, people, processes, data, or type in:people" autocomplete="off" spellcheck="false"><button type="button" class="nx-pesc" data-nx-pclose aria-label="Close search">Esc</button></div>
 <div class="nx-chips" role="group" aria-label="Search scope">${SCOPES.map(s=>`<button type="button" class="chip nx-chip" data-nx-scope="${s[0]}" aria-pressed="${s[0]==="all"}">${s[1]}<em></em></button>`).join("")}</div>
 <div class="nx-pnote" id="nxPalNote" hidden></div>
 <div class="nx-pbody"><ul id="nxPalList" class="nx-plist2" role="listbox" aria-label="Results"></ul><aside id="nxPrev" class="nx-prev" aria-label="Preview"></aside></div>
 <div class="nx-pfoot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>Tab</kbd> next type</span><span><kbd>Ctrl</kbd>+<kbd>↵</kbd> ask Oukala</span><span><kbd>Esc</kbd> close</span><span class="nx-pstat" id="nxPalStat" aria-live="polite"></span></div></div>`;
 document.body.appendChild(p);
 p.addEventListener("mousedown",e=>{if(e.target===p){e.preventDefault();closePalette()}});
 p.addEventListener("click",e=>{const t=e.target;let b;
  if(t.closest("[data-nx-pclose]")){closePalette();return}
  if((b=t.closest("[data-nx-scope]"))){setScope(b.dataset.nxScope);return}
  if((b=t.closest("[data-nx-more]"))){PAL.more[b.dataset.nxMore]=(PAL.more[b.dataset.nxMore]||0)+25;refreshPal();return}
  if((b=t.closest("[data-nx-i]"))){const r=PAL.rows[+b.dataset.nxI];if(r)activate(r,e)}
  if((b=t.closest("[data-nx-pact]"))){const r=PAL.rows[PAL.sel];if(!r)return;const a=b.dataset.nxPact;if(a==="open")activate(r,e);else if(a==="star"){const en=entryOf(r);if(en){toggleFav(en);syncStars();drawPrev()}}else if(a==="ask")askFrom(PAL.q||r.t)}});
 p.addEventListener("mousemove",e=>{const li=e.target.closest&&e.target.closest("[data-nx-i]");if(li){const i=+li.dataset.nxI;if(i!==PAL.sel&&(e.movementX||e.movementY)){select(i,true)}}});
 const inp=q1("#nxPalIn",p);let dt=0;
 inp.addEventListener("input",()=>{clearTimeout(dt);dt=setTimeout(()=>{PAL.q=inp.value;PAL.sel=0;PAL.more={};refreshPal()},IDX.items.length>20000?90:45)});
 inp.addEventListener("keydown",onPalKey)}
function onPalKey(e){const k=e.key;
 if(k==="ArrowDown"){e.preventDefault();select(PAL.sel+1)}else if(k==="ArrowUp"){e.preventDefault();select(PAL.sel-1)}
 else if(k==="PageDown"){e.preventDefault();select(PAL.sel+6)}else if(k==="PageUp"){e.preventDefault();select(PAL.sel-6)}
 else if(k==="Home"&&e.ctrlKey){e.preventDefault();select(0)}else if(k==="End"&&e.ctrlKey){e.preventDefault();select(PAL.rows.length-1)}
 else if(k==="Enter"){e.preventDefault();clearTimeout(0);flushInput();if(e.ctrlKey||e.metaKey||e.shiftKey){askFrom(PAL.q)}else{const r=PAL.rows[PAL.sel];if(r)activate(r,e);else if(PAL.q)askFrom(PAL.q)}}
 else if(k==="Tab"){e.preventDefault();const i=SCOPES.findIndex(s=>s[0]===PAL.scope);setScope(SCOPES[(i+(e.shiftKey?-1:1)+SCOPES.length)%SCOPES.length][0])}
 else if(k==="Escape"){e.preventDefault();e.stopPropagation();closePalette()}
 else if(k==="Backspace"&&!e.target.value&&PAL.scope!=="all"){setScope("all")}}
function flushInput(){const i=q1("#nxPalIn");if(i&&i.value!==PAL.q){PAL.q=i.value;PAL.sel=0;refreshPal()}}
function setScope(s){PAL.scope=s;PAL.sel=0;PAL.more={};qa("#nxPal [data-nx-scope]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.nxScope===s)));refreshPal();const i=q1("#nxPalIn");if(i)i.focus()}
function openPalette(o){o=o||{};ensureChrome();const p=q1("#nxPal");if(!p)return;const i=q1("#nxPalIn");
 if(!PAL.open){PAL.prev=document.activeElement&&document.activeElement.id!=="q"&&document.activeElement!==document.body?document.activeElement:null;PAL.opened=now();PAL.activated=false;PAL.had=false;PAL.zero=false}
 PAL.open=true;p.hidden=false;document.documentElement.classList.add("nx-pal-open");
 PAL.describe=!!o.describe;PAL.scope=o.scope||(o.describe?"screen":"all");PAL.q=o.q||"";PAL.sel=0;PAL.more={};i.value=PAL.q;
 qa("#nxPal [data-nx-scope]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.nxScope===PAL.scope)));
 ensureIndex();refreshPal();setTimeout(()=>{i.focus();i.setSelectionRange(i.value.length,i.value.length)},10)}
function closePalette(){if(!PAL.open)return;
 if(PAL.q.trim().length>=2&&!PAL.activated){const t=tel();t.searches++;if(PAL.zero)t.zero++;pushMetrics();trackQuery(PAL.q,false)}
 PAL.open=false;const p=q1("#nxPal");if(p)p.hidden=true;document.documentElement.classList.remove("nx-pal-open");
 if(PAL.prev&&document.contains(PAL.prev)){try{PAL.prev.focus()}catch(e){}}}
function trackQuery(q,ok){const s=st();q=q.trim();if(q.length<2)return;if(!s.zq)s.zq=[];if(!ok){if(PAL.zero){s.zq=[q].concat(s.zq.filter(x=>x!==q)).slice(0,20)}}persistSoon()}
function togglePalette(){PAL.open?closePalette():openPalette({})}
NAVX.palette={open:openPalette,close:closePalette,toggle:togglePalette,state:()=>PAL};
function entryOf(r){if(!r)return null;if(r.entry)return r.entry;if(r.ty==="screen"&&r.sid)return mkScreen(r.sid);
 if(r.ty==="action"||r.ty==="ask")return null;
 const key=r.key||("q:"+hash(r.t));const kind=/^(record|person|meeting|process|entity|module|metric):/.test(key)?key.split(":")[0]:"search";
 if(kind==="search")return {id:"search:"+hash(r.t.toLowerCase()),kind:"search",type:({record:"Record",person:"Person",process:"Process",data:"Data",metric:"Metric",knowledge:"Knowledge"})[r.ty]||"Record",key:r.t.toLowerCase(),title:r.t,sub:r.m};
 const v=key.slice(key.indexOf(":")+1);const type={record:"Record",person:"Person",meeting:"Meeting",process:"Process",entity:"Data entity",module:"Module",metric:"Metric"}[kind];return {id:kind+":"+v,kind,type,key:v,title:r.t,sub:r.m}}
function askFrom(q){q=String(q||"").trim();if(!q)return;PAL.activated=true;const t=tel();t.searches++;t.ok++;pushMetrics();closePalette();SRC="ask";
 try{if(W.CHATX&&CHATX.open)CHATX.open("chat")}catch(e){}ask(q)}
function activate(r,ev){if(!r)return;if(r.ty==="ask"){askFrom(PAL.q);return}
 if(r.ty==="query"){closePalette();setTimeout(()=>{try{r.f&&r.f()}catch(e){}},20);return}
 PAL.activated=true;const q=PAL.q.trim();const t=tel();if(q.length>=1){t.searches++;t.ok++;if(q.length>=2){const s=st();s.rs=[q].concat(s.rs.filter(x=>x!==q)).slice(0,8)}}
 noteOpen(r.src||"search",r.src==="hist"||r.src==="fav"?1:2);pushMetrics();closePalette();
 setTimeout(()=>{try{r.f&&r.f()}catch(e){console.error(e)}},20)}
function select(i,noScroll){const n=PAL.rows.length;if(!n)return;PAL.sel=((i%n)+n)%n;const ul=q1("#nxPalList");qa("[data-nx-i]",ul).forEach(li=>li.setAttribute("aria-selected",String(+li.dataset.nxI===PAL.sel)));
 const cur=q1(`[data-nx-i="${PAL.sel}"]`,ul);const inp=q1("#nxPalIn");if(inp&&cur)inp.setAttribute("aria-activedescendant",cur.id);if(cur&&!noScroll)cur.scrollIntoView({block:"nearest"});drawPrev()}
const mark=(txt,toksA)=>{let s=E(txt);if(!toksA||!toksA.length)return s;const low=txt.toLowerCase();const spans=[];toksA.forEach(t=>{if(t.length<2)return;let p=low.indexOf(t);if(p>=0)spans.push([p,p+t.length])});if(!spans.length)return s;spans.sort((a,b)=>a[0]-b[0]);let out="",pos=0;spans.forEach(sp=>{if(sp[0]<pos)return;out+=E(txt.slice(pos,sp[0]))+"<mark>"+E(txt.slice(sp[0],sp[1]))+"</mark>";pos=sp[1]});return out+E(txt.slice(pos))};
function rowHTML(r,i,T){const fav=r.fav?`<span class="nx-ofav" title="Favorite" aria-label="Favorite">${SVG(ICO.star,13,1.8)}</span>`:"";
 const ic=r.ty==="screen"&&r.sid&&screenRow(r.sid)?IC(screenRow(r.sid)[2]):SVG(r.icon||TYICO[r.ty]||ICO.doc,18,1.8);
 return `<li role="option" id="nxo${i}" class="nx-opt" data-nx-i="${i}" data-ty="${r.ty}" aria-selected="${i===PAL.sel}"><span class="nx-oi" style="--c:var(${r.c||TYCOL[r.ty]||"--accent"})">${ic}</span><span class="nx-otx"><b>${mark(r.t,T)}</b><small>${E(r.m||"")}</small></span>${fav}${r.badge?`<em class="nx-obadge">${E(r.badge)}</em>`:""}</li>`}
function emptyRows(){const s=st(),rows=[];const P=pref();
 const sec=(title,list)=>{if(list.length){rows.push({sec:title});list.forEach(x=>rows.push(x))}};
 sec("Recently viewed",s.hist.filter(h=>h.id!=="screen:"+S.screen).slice(0,6).map(h=>({ty:h.kind==="screen"?"screen":"record",sid:h.kind==="screen"?h.key:null,t:h.kind==="screen"?labelOf(h.key):h.title,m:(h.kind==="screen"?"Module":h.type)+" · "+ago(h.t),entry:h,src:"hist",f:()=>openEntry(h,"hist"),icon:h.kind==="screen"?null:typeIcon(h.type),fav:s.fav.some(f=>f.id===h.id)})));
 sec("Favorites",s.fav.slice(0,6).map(h=>({ty:h.kind==="screen"?"screen":"record",sid:h.kind==="screen"?h.key:null,t:h.label||(h.kind==="screen"?labelOf(h.key):h.title),m:(h.kind==="screen"?"Module":h.type)+" · starred",entry:h,src:"fav",f:()=>openEntry(h,"fav"),icon:h.kind==="screen"?null:typeIcon(h.type),fav:true})));
 sec("Recent searches",s.rs.slice(0,5).map(x=>({ty:"query",t:x,m:"Search again",icon:ICO.search,f:()=>{openPalette({q:x})},keep:true})));
 sec("Quick actions",IDX.items.filter(i=>i.ty==="action").slice(0,6).map(a=>({ty:"action",t:a.t,m:a.m,f:a.f})));
 if(!IDX.items.length)rows.push({sec:"Quick actions"},{ty:"query",t:"Loading the search index",m:"One moment",icon:ICO.clock,f:()=>{},keep:true});
 return rows}
function refreshPal(soft){if(!PAL.open)return;const ul=q1("#nxPalList");if(!ul)return;const raw=PAL.q;const T0=toks(raw.replace(/^in:\s*[a-z]+\s*/i,"").replace(/\s+in:\s*[a-z]+$/i,""),PAL.describe);
 let rows=[],hdrs=[],html="",res=null;const P=pref();
 if(!raw.trim()){rows=emptyRows()}else{
  res=runSearch(raw,{scope:PAL.scope,describe:PAL.describe});PAL.res=res;const T=res.tokens;
  const order=PAL.scope==="all"?TYORD:[PAL.scope];
  order.forEach(ty=>{const a=res.by[ty];if(!a||!a.length)return;const lim=PAL.scope==="all"?(ty==="screen"?6:4):60+(PAL.more[ty]||0);const total=res.counts[ty]||a.length;
   rows.push({sec:TYL[ty],ty,count:total,all:PAL.scope==="all"&&total>lim});
   a.slice(0,lim).forEach(x=>{const it=x.it;rows.push({ty:it.ty,t:it.t,m:it.m,c:it.c,f:it.f,key:it.key,sid:it.sid,src:"search",fav:P.fav.has(it.key)||P.fav.has(it.tl),sc:Math.round(x.sc),k:it.k,g:it.g})});
   if(PAL.scope!=="all"&&total>lim)rows.push({more:ty,t:"Show 25 more of "+total.toLocaleString("en-US")})})}
 /* navigable rows only */
 const nav=[];let h="";rows.forEach(r=>{if(r.sec){h+=`<li class="nx-grp eyebrow" role="presentation">${E(r.sec)}${r.count!=null?`<em>${r.count.toLocaleString("en-US")}</em>`:""}${r.all?`<button type="button" class="nx-seeall" data-nx-scope="${r.ty}">See all</button>`:""}</li>`}else if(r.more){h+=`<li class="nx-moreli" role="presentation"><button type="button" class="btn quiet" data-nx-more="${r.more}">${E(r.t)}</button></li>`}else{const i=nav.length;nav.push(r);h+=rowHTML(r,i,res?res.tokens:T0)}});
 /* fall through to Ask Oukala is always one keystroke away */
 const hasQ=raw.trim().length>0;
 if(hasQ){const i=nav.length;const askR={ty:"ask",t:"Ask Oukala: "+raw.trim(),m:"Ctrl+Enter from anywhere in this list",icon:ICO.search,c:"--accent",f:()=>askFrom(raw)};nav.push(askR);h+=`<li class="nx-grp eyebrow" role="presentation">Not what you meant?</li><li role="option" id="nxo${i}" class="nx-opt nx-ask" data-nx-i="${i}" data-ty="ask" aria-selected="${i===PAL.sel}"><span class="nx-oi" style="--c:var(--accent)">${SVG(ICO.ai,18,1.8)}</span><span class="nx-otx"><b>Ask Oukala: ${E(raw.trim())}</b><small>Get an answer in chat instead of a list</small></span><em class="nx-obadge">Ctrl ↵</em></li>`}
 if(hasQ&&res&&!res.total&&!(IDX.building&&!IDX.built)){PAL.zero=true;h=`<li class="nx-zero" role="presentation"><b>No match for “${E(raw.trim())}”.</b><span>Try fewer words, another spelling, or ask Oukala. Press Enter to ask.</span></li>`+h;PAL.sel=nav.length-1}else PAL.zero=false;
 if(hasQ&&res&&res.fixed){h=`<li class="nx-fixed" role="presentation">Showing results for <b>${E(res.fixed)}</b></li>`+h}
 PAL.rows=nav;if(PAL.sel>=nav.length)PAL.sel=0;ul.innerHTML=h;
 /* chip counts */
 qa("#nxPal .nx-chip").forEach(c=>{const ty=c.dataset.nxScope;const em=c.querySelector("em");if(!em)return;em.textContent=(hasQ&&res&&ty!=="all"&&res.counts[ty]!=null&&PAL.scope==="all")?(res.counts[ty]>999?"999+":res.counts[ty]):""});
 const note=q1("#nxPalNote");if(note){if(PAL.describe){note.hidden=false;note.textContent="Describing what you want to do: showing screens and actions that fit. Not there? Ask Oukala."}else if(res&&res.scope!=="all"&&/^in:|\sin:/i.test(raw)){note.hidden=false;note.textContent="Searching only "+TYL[res.scope].toLowerCase()+". Press Backspace on an empty box or pick All to widen."}else note.hidden=true}
 const stat=q1("#nxPalStat");if(stat){const parts=[];if(IDX.building)parts.push("Indexing "+IDX.done+" of "+IDX.total);else if(IDX.items.length)parts.push(IDX.items.length.toLocaleString("en-US")+" items indexed");if(res)parts.push(res.total.toLocaleString("en-US")+" matches in "+res.ms+" ms");stat.textContent=parts.join(" · ")}
 if(PAL.rows.length){const sel=Math.min(PAL.sel,PAL.rows.length-1);PAL.sel=sel;const cur=q1(`[data-nx-i="${sel}"]`,ul);if(cur){cur.setAttribute("aria-selected","true");const inp=q1("#nxPalIn");if(inp)inp.setAttribute("aria-activedescendant",cur.id)}}
 drawPrev()}

/* ---------- preview pane ---------- */
function timeLabel(h){return h?"Last opened "+ago(h.t)+(h.n>1?", "+h.n+" visits":""):"Not opened before"}
function drawPrev(){const box=q1("#nxPrev");if(!box)return;const r=PAL.rows[PAL.sel];if(!r){box.innerHTML=`<div class="nx-pv-empty"><b>Search everything</b><p class="muted small">Screens, records, people, processes, data, metrics, knowledge and actions you can take.</p><ul class="nx-tips"><li><kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> opens search from anywhere</li><li>Type <b>in:people</b> to search one type</li><li>Describe it: “approve an invoice”, “who is on call”</li><li>Press <kbd>Ctrl</kbd>+<kbd>↵</kbd> to ask Oukala instead</li></ul></div>`;return}
 const s=st();const hist=s.hist.find(h=>(r.sid&&h.id==="screen:"+r.sid)||h.title===r.t);let body="";const en=entryOf(r);const isFav=en&&s.fav.some(f=>f.id===en.id);
 const head=`<div class="nx-pv-h"><span class="nx-oi big" style="--c:var(${r.c||TYCOL[r.ty]||"--accent"})">${r.ty==="screen"&&r.sid&&screenRow(r.sid)?IC(screenRow(r.sid)[2]):SVG(r.icon||TYICO[r.ty]||ICO.doc,22,1.8)}</span><div><div class="eyebrow">${E(r.ty==="ask"?"Ask Oukala":(TYL[r.ty]||"Result").replace(/s and modules$/,"").replace(/ you can take$/,""))}</div><h3>${E(r.t)}</h3></div></div>`;
 try{
  if(r.ty==="screen"&&r.sid){const m=resolve(r.sid),def=G(()=>PROC.defs[r.sid]);body=`<p class="muted">${E(hintOf(r.sid)?"Formal name: "+hintOf(r.sid):"Formal name: "+formal(r.sid))}</p><dl class="kv"><dt>Where</dt><dd>${E(gLabel(m.g))}${m.sub?" · "+E(m.sub):""}</dd><dt>History</dt><dd>${E(timeLabel(hist))}</dd></dl>${def&&def.steps?`<div class="eyebrow" style="margin:10px 0 6px">Process behind it</div><ol class="nx-steps">${def.steps.slice(0,4).map(x=>`<li>${E(x.n||x.d||"")}</li>`).join("")}</ol>`:""}`}
  else if(r.ty==="person"){const nm=r.t,d=G(()=>who(nm));if(d){const wl=G(()=>workload(nm));body=`<div class="row" style="gap:10px">${G(()=>avatar(nm,{size:44}))||""}<div><b>${E(d.role||"")}</b><div class="muted small">${E(d.team||"")} · ${E(d.kind||"")}</div></div></div><dl class="kv"><dt>Email</dt><dd>${E(d.email||"")}</dd><dt>Location</dt><dd>${E(d.loc||"")}</dd>${wl?`<dt>Workload</dt><dd>${wl.pct}% of ${wl.cap} hours</dd>`:""}<dt>Skills</dt><dd>${E((d.skills||[]).slice(0,5).join(", "))}</dd></dl>`}}
  else if(r.ty==="metric"){const id=(r.key||"").replace(/^metric:/,"");body=METRICS[id]?`<div class="nx-pv-kpi">${kpiBox(id)}</div>`:`<p class="muted">${E(r.m)}</p>`}
  else if(r.ty==="process"){const id=(r.key||"").replace(/^process:/,"");const p=G(()=>PROCLIB.get(id))||G(()=>PROCLIB.list().find(x=>x.id===id));body=p?`<dl class="kv"><dt>Owner</dt><dd>${E(p.owner||"")}</dd><dt>Family</dt><dd>${E(p.familyName||p.family||"")}</dd><dt>Steps</dt><dd>${E(Array.isArray(p.steps)?p.steps.length:p.steps)}</dd><dt>Maturity</dt><dd>Level ${E(p.level)} of target ${E(p.target)}</dd></dl>`:`<p class="muted">${E(r.m)}</p>`}
  else if(r.ty==="data"){const id=(r.key||"").replace(/^(entity|field):/,"").split(".")[0];const e=G(()=>PLAT.ent(id));body=e?`<dl class="kv"><dt>${/^field:/.test(r.key||"")?"Field of":"Domain"}</dt><dd>${E(/^field:/.test(r.key||"")?e.label:e.domain)}</dd><dt>Fields</dt><dd>${E(e.nf||(e.fields||[]).length)}</dd><dt>Owner</dt><dd>${E(e.owner||"")}</dd><dt>Classification</dt><dd>${E(e.cls||"")}</dd></dl><p class="muted small">${E((e.fields||[]).slice(0,8).map(f=>f.label||f.k).join(", "))}</p>`:`<p class="muted">${E(r.m)}</p>`}
  else if(r.ty==="action"){body=`<p>${E(r.m)}</p><p class="muted small">Opens the right screen and starts the form for you. Nothing is saved until you confirm.</p>`}
  else if(r.ty==="ask"){body=`<p>Send “${E(PAL.q)}” to Oukala chat. It can answer from your records, explain, or take you there.</p>`}
  else if(r.ty==="query"){body=`<p class="muted">Run this search again.</p>`}
  else{body=`<p>${E(r.m||"")}</p>${r.k?`<p class="muted small">${E(String(r.k).slice(0,220))}</p>`:""}<dl class="kv"><dt>History</dt><dd>${E(timeLabel(hist))}</dd></dl>`}
 }catch(x){body=`<p class="muted">${E(r.m||"")}</p>`}
 const acts=`<div class="nx-pv-a"><button type="button" class="btn primary" data-nx-pact="open">Open <kbd>↵</kbd></button>${en?`<button type="button" class="btn" data-nx-pact="star" aria-pressed="${!!isFav}">${isFav?"Unstar":"Star"}</button>`:""}<button type="button" class="btn quiet" data-nx-pact="ask">Ask Oukala</button></div>`;
 box.innerHTML=head+body+acts}

/* global keys: Ctrl or Cmd + K, and "/" */
document.addEventListener("keydown",e=>{const mod=e.ctrlKey||e.metaKey;
 if(mod&&!e.shiftKey&&!e.altKey&&(e.key==="k"||e.key==="K")){e.preventDefault();e.stopImmediatePropagation();togglePalette();return}
 if(e.key==="/"&&!mod&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"")&&!(e.target&&e.target.isContentEditable)){e.preventDefault();e.stopImmediatePropagation();openPalette({})}
 if(e.key==="Escape"&&PAL.open&&!(e.target&&e.target.id==="nxPalIn")){closePalette()}
},true);
/* warm the index in idle time so the first search is instant (small data only) */
setTimeout(()=>{if(!(W.SCALE&&SCALE.on)&&!IDX.built&&!IDX.building){const f=()=>ensureIndex();if(W.requestIdleCallback)requestIdleCallback(f,{timeout:4000});else setTimeout(f,2500)}},1800);

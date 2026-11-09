
/* ================= GRAPH INDEX, CMDB HEALTH, TRAVERSAL ================= */
const HB={key:null};
let GB={key:null};
function G_(){const key=CIREG.length+"|"+CIEDGE.length+"|"+SVCREG.length+"|"+I.rev;if(GB.key===key)return GB;
 const out=new Map(),inn=new Map(),cim=new Map();CIREG.forEach(c=>cim.set(c.id,c));
 const add=e=>{let a=out.get(e[0]);if(!a)out.set(e[0],a=[]);a.push(e);let b=inn.get(e[1]);if(!b)inn.set(e[1],b=[]);b.push(e)};
 CIEDGE.forEach(add);SVCREG.forEach(s=>(s.deps||[]).forEach(d=>add([s.id,d,"depends on","svcdep"])));
 GB={key,out,inn,cim,sup:null};return GB}
function supSet(){const g=G_();if(g.sup)return g.sup;const s=new Set(),q=SVCREG.map(x=>x.id);q.forEach(i=>s.add(i));while(q.length){const u=q.pop();(g.out.get(u)||[]).forEach(e=>{if(!s.has(e[1])){s.add(e[1]);q.push(e[1])}})}g.sup=s;return s}
const degOf=id=>{const g=G_();return(g.out.get(id)||[]).length+(g.inn.get(id)||[]).length};
function famOf(cls){if(isA(cls,"cmdb_ci_service")||cls==="cmdb_ci_query_based_service"||cls==="cmdb_ci_business_capability")return"svc";if(isA(cls,"cmdb_ci_software"))return"sw";if(isA(cls,"cmdb_ci_cloud"))return"cl";if(isA(cls,"cmdb_ci_hardware"))return"hw";if(isA(cls,"cmdb_ci_site"))return"loc";return"rec"}
const FAMC={svc:["Services and capabilities","--u3"],sw:["Software","--p4"],hw:["Hardware","--s3"],cl:["Cloud","--w1"],loc:["Locations","--e4"],rec:["Vendors, contracts, information","--p2"]};
const normName=n=>String(n||"").toLowerCase().replace(/\.(atlantic\.local|atlantic\.example|local)$/,"").replace(/[^a-z0-9]+/g,"");
const ruleApplies=(r,c)=>isA(c.cls,r.cls)&&!(r.id==="RR1"&&c.cls==="cmdb_ci_business_app")&&!c.svcLayer&&(!r.onlyIf||r.onlyIf(c));
const crOff=I.crOff=I.crOff||{};
function relFail(r,c){const g=G_(),L=g.out.get(c.id)||[];let n=0;for(const e of L){const t=ciOf(e[1]);if(t&&r.to.some(x=>isA(t.cls,x)))n++}return n<r.min}
const COMP=[
 {id:"CR1",n:"Every CI has a named owner",why:"Someone must be accountable for a change, an outage and a recertification.",test:c=>!blank(c.owner)},
 {id:"CR2",n:"Every CI has a support group",why:"Incidents route to the support group; without one they land in the general queue.",test:c=>!blank(c.grp)},
 {id:"CR3",n:"Mission-critical CIs are monitored",why:"A CI marked mission critical must report availability from a monitoring source.",appl:c=>upApplies(c)&&String(c.crit).startsWith("1"),test:c=>c.usrc!=="none"},
 {id:"CR4",n:"Production CIs are not still in Planned or Build",why:"A production CI in a planning stage means the lifecycle was never advanced.",appl:c=>c.env==="Production",test:c=>!["Planned","Build"].includes(c.life)},
 {id:"CR5",n:"Operational status matches lifecycle",why:"A retired CI cannot be Operational, and an operational CI cannot be Retired.",test:c=>(c.life==="Retired")===(c.status==="Retired")}];
function compRules(){return COMP.concat(RULES.map(r=>({id:r.id,n:"Relationship: "+clsLabel(r.cls)+" "+r.rel+" "+r.to.map(clsLabel).join(" or "),why:r.why,rel:1,appl:c=>ruleApplies(r,c),test:c=>!relFail(r,c),rule:r})))}
function health(){ensure();const g=G_();const key=g.key+"|"+Object.keys(crOff).join()+RULES.length+"|"+Object.keys(I.dupNo).length;if(HB.key===key)return HB;
 const sup=supSet(),rules=compRules().filter(r=>!crOff[r.id]);const act=CIREG.filter(c=>c.life!=="Retired"&&!c.merged);
 /* duplicates */
 const bn=new Map();act.forEach(c=>{if(c.isSvc)return;const k=normName(c.name);let a=bn.get(k);if(!a)bn.set(k,a=[]);a.push(c)});
 const dupPairs=[],dupSet=new Set();bn.forEach(arr=>{if(arr.length<2)return;for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){const a=arr[i],b=arr[j];let sc=60;const why=["Same name after removing the domain"];const ipSame=a.ip&&a.ip===b.ip;if(ipSame){sc+=30;why.push("Same IP address "+a.ip)}if(a.a&&b.a&&a.a.serial_number&&a.a.serial_number===b.a.serial_number){sc+=10;why.push("Same serial number")}if(a.cls===b.cls){sc+=5}
  if(!(ipSame||a.svc&&a.svc===b.svc||a.dupOfId===b.id||b.dupOfId===a.id))continue;const key=a.id+"|"+b.id;if(I.dupNo[key])continue;
  const ds=x=>(blank(x.owner)?0:2)+degOf(x.id)*.1+(/\.(local|example)$/.test(x.name)?-1:0)+(x.src==="manual"?.3:0);const sv=ds(a)>=ds(b)?a:b,du=sv===a?b:a;dupPairs.push({id:key,a:sv,b:du,score:Math.min(100,sc),why});dupSet.add(du.id)}});
 let wf=0,wt=0,stale=[],orph=[],noOwner=[],noGrp=[],disc=0,discN=0,upSum=0,upN=0,upApp=0,okAll=0,sumScore=0;const fails={},bySrc={},upBySrc={},byCls={},issues={};rules.forEach(r=>fails[r.id]=0);
 act.forEach(c=>{const at=attrsOf(c.cls);let f=0,t=0;at.forEach(a=>{if(!(a.req||a.rec))return;const w=a.req?2:1;t+=w;if(!blank(getV(c,a.k)))f+=w});wf+=f;wt+=t;const comp=t?f/t*100:100;
  const fl=[];const isStale=!c.isSvc&&c.src!=="manual"&&c.seen>60;if(isStale){fl.push("stale");stale.push(c)}const isOrph=needsSvc(c)&&!sup.has(c.id);if(isOrph){fl.push("orphan");orph.push(c)}if(dupSet.has(c.id))fl.push("duplicate");
  const fx=[];rules.forEach(r=>{if(r.appl&&!r.appl(c))return;if(!r.test(c)){fx.push(r.id);fails[r.id]++}});
  if(blank(c.owner))noOwner.push(c);if(blank(c.grp))noGrp.push(c);
  if(discApplies(c)){discN++;if(c.src!=="manual"&&c.seen<=14)disc++}
  if(upApplies(c)){upApp++;if(c.usrc!=="none"){upN++;upSum+=+c.uptime||0;const b=upBySrc[c.usrc]=upBySrc[c.usrc]||{n:0,s:0};b.n++;b.s+=+c.uptime||0}}
  const corr=100-(isStale?40:0)-(isOrph?30:0)-(fl.includes("duplicate")?30:0),cmp=Math.max(0,100-20*fx.length);const score=.4*comp+.3*corr+.3*cmp;
  c._h={comp,corr,cmp,score,flags:fl,fails:fx};sumScore+=score;fl.forEach(x=>issues[x]=(issues[x]||0)+1);if(!fl.length&&!fx.length)okAll++;
  bySrc[c.src]=(bySrc[c.src]||0)+1;byCls[c.cls]=(byCls[c.cls]||0)+1});
 const n=act.length||1,badCorr=new Set([...stale,...orph].map(c=>c.id));dupSet.forEach(i=>badCorr.add(i));
 const comp=wt?wf/wt*100:100,corr=(1-badCorr.size/n)*100,failSet=act.filter(c=>c._h.fails.length).length,compl=(1-failSet/n)*100;
 Object.assign(HB,{wf,wt,badN:badCorr.size,key,act,n:act.length,comp,corr,compl,score:.4*comp+.3*corr+.3*compl,stale,orph,dupPairs,dupSet,noOwner,noGrp,discPct:discN?disc/discN*100:100,disc,discN,upAvg:upN?upSum/upN:0,upN,upApp,upCov:upApp?upN/upApp*100:100,upBySrc,fails,rules,bySrc,byCls,issues,okAll,failSet,avg:sumScore/n});
 syncMetrics();return HB}
/* ---------- traversal ---------- */
function clsOk(id,set){const n=nd(id);if(!n)return false;for(const s of set)if(isA(n.cls,s))return true;return false}
function reach(start,mode,depth,relSet,clsSet){const g=G_(),seen=new Map([[start,{d:0,p:null,e:null,w:null}]]);let fr=[start];
 for(let d=1;d<=depth&&fr.length;d++){const nx=[];for(let i=0;i<fr.length;i++){const u=fr[i];
  if(mode!=="causes"){const L=g.inn.get(u);if(L)for(let j=0;j<L.length;j++){const e=L[j],v=e[0];if(seen.has(v)||(relSet&&!relSet.has(e[2]))||(clsSet&&!clsOk(v,clsSet)))continue;seen.set(v,{d,p:u,e,w:"in"});nx.push(v)}}
  if(mode!=="impact"){const L=g.out.get(u);if(L)for(let j=0;j<L.length;j++){const e=L[j],v=e[1];if(seen.has(v)||(relSet&&!relSet.has(e[2]))||(clsSet&&!clsOk(v,clsSet)))continue;seen.set(v,{d,p:u,e,w:"out"});nx.push(v)}}}
  fr=nx}
 return seen}
const pathTo=(R,id)=>{const a=[];let x=id,g=0;while(x!==null&&x!==undefined&&g++<20){a.unshift(x);const r=R.get(x);x=r?r.p:null}return a};
function findPath(a,b){if(a===b)return[{id:a}];const g=G_(),prev=new Map([[a,null]]);let fr=[a];while(fr.length&&!prev.has(b)){const nx=[];for(const u of fr){const L=[];(g.inn.get(u)||[]).forEach(e=>L.push([e[0],e,"in"]));(g.out.get(u)||[]).forEach(e=>L.push([e[1],e,"out"]));for(const [v,e,w] of L){if(prev.has(v))continue;prev.set(v,{u,e,w});nx.push(v)}}fr=nx}
 if(!prev.has(b))return null;const p=[];let x=b;while(x!==null){const r=prev.get(x);p.unshift({id:x,e:r?r.e:null,w:r?r.w:null});x=r?r.u:null}return p}
function impactSum(id){try{const r=impactOf(id);return{svcs:r.services.filter(s=>s.id!==id),cis:r.cis.length,users:r.users,cost:r.cost,tier1:r.tier1,projects:r.projects,order:r.order.length}}catch(e){return{svcs:[],cis:0,users:0,cost:0,tier1:0,projects:[],order:0}}}
function whatIf(id){const g=G_(),c=ciOf(id);const dep=(g.inn.get(id)||[]).filter(e=>!e[3]);const lonely=[];dep.forEach(e=>{const d=ciOf(e[0]);if(!d)return;const alt=(g.out.get(d.id)||[]).filter(x=>x[1]!==id&&x[2]===e[2]&&ciOf(x[1])&&isA(ciOf(x[1]).cls,c.cls.startsWith("cmdb_ci_vm")?"cmdb_ci_vm_instance":chainOf(c.cls)[Math.min(2,chainOf(c.cls).length-1)].id));if(!alt.length)lonely.push(d)});
 const imp=impactSum(id);const t1=imp.svcs.filter(s=>s.tier==="Tier 1");const verdict=!dep.length?["good","Safe to retire: nothing depends on it."]:lonely.length&&t1.length?["bad","Do not retire yet: "+lonely.length+" dependents have no alternative and "+t1.length+" Tier 1 services sit above them."]:lonely.length?["warn","Retire with a plan: "+lonely.length+" dependents lose their only "+rtFw(dep[0][2]).toLowerCase()+" target."]:["good","Retire after a change record: dependents have an alternative."];
 return{dep,lonely,imp,t1,verdict}}
/* walk (dot-walk) */
function walkSets(){const g=G_(),w=I.g.walk,sets=[new Set([w.start])];let cur=sets[0];for(const st of w.steps){const nx=new Set();cur.forEach(id=>{const L=(st.dir==="up"?g.inn.get(id):g.out.get(id))||[];L.forEach(e=>{const v=st.dir==="up"?e[0]:e[1],n=nd(v);if(n&&isA(n.cls,st.cls))nx.add(v)})});sets.push(nx);cur=nx;if(!nx.size)break}return sets}
function nextOptions(set){const g=G_(),m=new Map();set.forEach(id=>{[["down",g.out.get(id)||[],1],["up",g.inn.get(id)||[],0]].forEach(([dir,L,k])=>L.forEach(e=>{const v=e[k],n=nd(v);if(!n)return;const key=dir+"|"+n.cls;let s=m.get(key);if(!s)m.set(key,s=new Set());s.add(v)}))});return[...m.entries()].map(([k,s])=>{const[dir,cls]=k.split("|");return{dir,cls,n:s.size}}).sort((a,b)=>b.n-a.n)}
/* uptime and service availability from CIs */
const CW=c=>String(c.crit).startsWith("1")?3:String(c.crit).startsWith("2")?2:1;
function svcDerived(sid){const g=G_();const l=CIREG.filter(c=>c.svc===sid&&upApplies(c)&&c.usrc!=="none"&&c.life!=="Retired");if(!l.length)return null;let w=0,s=0,min=100;l.forEach(c=>{const x=CW(c);w+=x;s+=x*(+c.uptime||0);min=Math.min(min,+c.uptime||100)});return{avg:s/w,min,n:l.length,w,all:CIREG.filter(c=>c.svc===sid&&upApplies(c)).length}}

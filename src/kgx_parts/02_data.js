/* ============ Knowledge ecosystem graph and GAAP vault graph data ============ */
(function(){
const G=window.GAAPDATA||{nodes:[],edges:[],unresolved:[]};
const KX=()=>window.KCSX;
const TSV={"Standards Portal":"svc_portal","Search":"svc_search","Contract Repository":"svc_cr","Lease subledger":"svc_erp","Identity":"svc_id","Email and collaboration":"svc_m365","Data platform":"svc_data","Network and VPN":"svc_net","Endpoint":"svc_end","Integration hub":"svc_int","Standards Portal ":"svc_portal"};
const GROUPS={know:{l:"Knowledge item",c:"--p4"},svc:{l:"Service",c:"--accent"},ci:{l:"Configuration item",c:"--s3"},proc:{l:"Process",c:"--w1",shape:"square"},proj:{l:"Project",c:"--u3",shape:"square"},person:{l:"Person or agent",c:"--e4"},skill:{l:"Agent skill",c:"--good-f",shape:"diamond"},wf:{l:"Workflow",c:"--u1",shape:"square"},inc:{l:"Incident",c:"--bad-f"},prompt:{l:"Prompt",c:"--p2",shape:"diamond"},gap:{l:"Knowledge gap",c:"--warn-f"}};
let cache=null,ckey="";
function eco(){const x=KX();if(!x)return {nodes:[],edges:[]};const key=[SCALE.on,x.version(),WFX&&WFX.defs.length,x.skills().length].join("|");if(cache&&ckey===key)return cache;
 const nodes=[],edges=[],have=new Set();const N=(id,label,type,o)=>{if(have.has(id))return;have.add(id);nodes.push(Object.assign({id,label,type},o||{}))};const Ed=(a,b,t)=>{if(have.has(a)&&have.has(b))edges.push({a,b,t})};
 SVCREG.forEach(s=>N("s:"+s.id,s.n,"svc",{sub:s.tier,w:s.users,group:"svc"}));
 const cisAll=CIREG.slice();CIREG.forEach(c=>N("c:"+c.id,c.name,"ci",{sub:c.class+" · "+svcName(c.svc),group:svcName(c.svc)}));
 PRCN().forEach(p=>N("p:"+p[0],p[1],"proc",{sub:"Process"}));
 PROJ.forEach(p=>N("j:"+p.id,p.n,"proj",{sub:p.id}));
 (window.SCALE&&SCALE.on?SCALE.projects():[]).forEach(p=>N("j:"+p.id,p.n,"proj",{sub:p.id}));
 const people=new Set();
 const items=x.items();items.forEach(k=>{N("k:"+k.id,k.t,"know",{sub:k.type+" · "+k.id,w:k.views,group:k.svcN,st:k.st==="Published"&&k.fresh.startsWith("Stale")?"stale":k.st==="Draft"?"stub":""});people.add(k.own)});
 x.skills().forEach(s=>{N("a:"+s.id,s.name,"skill",{sub:s.status+" · "+s.id,w:s.runs});people.add(s.owner)});
 SVCREG.forEach(s=>{people.add(s.owner)});
 [...people].forEach(p=>N("u:"+p,p,"person",{sub:(who(p)||{}).role||"",group:"people"}));
 x.INCS.forEach(i=>N("i:"+i[0],i[1],"inc",{sub:i[0]+" · "+svcName(i[2]),group:svcName(i[2])}));
 x.GAPN.forEach((g,n)=>N("g:"+n,g[0],"gap",{sub:"Search with no answer",st:"gap"}));
 T_PR().forEach(p=>N("m:"+p.id,p.name,"prompt",{sub:p.id+" · "+p.status}));
 if(window.WFX)WFX.defs.forEach(w=>N("w:"+w.id,w.name,"wf",{sub:w.kind,group:"wf"}));
 if(SCALE.on){SCALE.cis().forEach(c=>{const sid=TSV[c.svc]||"svc_cod";N("c:"+c.id,c.name,"ci",{sub:c.class+" · "+svcName(sid),group:svcName(sid),st:c.status!=="Operational"?"risk":""});});
  SCALE.tickets().filter(t=>t.kind==="Incident").forEach(t=>N("i:"+t.id,t.t,"inc",{sub:t.id+" · "+t.svc,group:svcName(TSV[t.svc]||"svc_cod"),st:t.pri==="P1"?"risk":""}));
  DIR.filter(d=>d.generated).forEach(d=>N("u:"+d.name,d.name,"person",{sub:d.role,group:"people"}))}
 /* edges */
 SVCREG.forEach(s=>{s.deps.forEach(d=>Ed("s:"+s.id,"s:"+d,"depends on"));s.proj.forEach(p=>Ed("s:"+s.id,"j:"+p,"improved by"));Ed("s:"+s.id,"u:"+s.owner,"owned by")});
 CIREG.forEach(c=>Ed("s:"+c.svc,"c:"+c.id,"runs on"));CIEDGE.forEach(e=>Ed("c:"+e[0],"c:"+e[1],e[2]||"depends on"));
 const sciBy={};if(SCALE.on)SCALE.cis().forEach(c=>{const sid=TSV[c.svc]||"svc_cod";(sciBy[sid]=sciBy[sid]||[]).push(c.id)});
 const ciOfScaled=k=>{const a=sciBy[k.svc]||[];return a.length?a[Math.floor(x.hsh(k.id)*a.length)]:null};
 items.forEach(k=>{const id="k:"+k.id;Ed(id,"s:"+k.svc,"documents");(k.xsvc||[]).forEach(s=>Ed(id,"s:"+s,"documents"));
  if(k.gen){const c=ciOfScaled(k);if(c)Ed(id,"c:"+c,"describes")}else x.ciOf(k).concat(k.xci||[]).forEach(c=>Ed(id,"c:"+c,"describes"));
  (k.proc||[]).forEach(p=>Ed(id,"p:"+p,"supports"));Ed(id,"u:"+k.own,"owned by");(k.ev||[]).forEach(e=>{if(/^PR\d/.test(e))Ed(id,"j:"+e,"evidence for");else Ed(id,"k:"+e,"evidence for")})});
 x.skills().concat(SCALE.on?x.skills().filter(()=>false):[]).forEach(()=>{});
 x.skills().forEach(s=>{Ed("a:"+s.id,"k:"+s.kb,"built from");Ed("a:"+s.id,"u:"+s.owner,"owned by");const k=x.itOf(s.kb);if(k)Ed("a:"+s.id,"s:"+k.svc,"acts on");if(window.WFX&&WFX.get("wf_skill_"+s.id.toLowerCase().replace("-","")))Ed("w:wf_skill_"+s.id.toLowerCase().replace("-",""),"a:"+s.id,"runs skill")});
 if(window.WFX)WFX.defs.forEach(w=>{const sv=SVCREG.find(s=>s.n===w.service);if(sv)Ed("w:"+w.id,"s:"+sv.id,"serves")});
 x.INCS.forEach(i=>{Ed("i:"+i[0],"s:"+i[2],"affected");Ed("i:"+i[0],"k:"+i[3],"resolved with")});
 x.GAPN.forEach((g,n)=>Ed("g:"+n,"s:"+g[1],"missing for"));
 T_PR().forEach(p=>{items.filter(k=>!k.gen&&(x.hsh(p.id+k.id)<.12||(p.id==="P101"&&k.views>200))).slice(0,4).forEach(k=>Ed("m:"+p.id,"k:"+k.id,"cites"))});
 if(SCALE.on){const r=RNG("kgx-inc"),kBy={};items.filter(k=>k.gen).forEach(k=>(kBy[k.svc]=kBy[k.svc]||[]).push(k.id));SCALE.tickets().filter(t=>t.kind==="Incident").forEach(t=>{const sid=TSV[t.svc]||"svc_cod";Ed("i:"+t.id,"s:"+sid,"affected");const a=kBy[sid];if(a&&r()<.55)Ed("i:"+t.id,"k:"+a[Math.floor(r()*a.length)],"resolved with")})}
 cache={nodes,edges};ckey=key;return cache}
function PRCN(){return KX().PRC}
function T_PR(){return (window.KCS_TEST&&KCS_TEST.PR)||[]}
function svcName(id){return KX().svcName(id)}
const TYPEMAP={root:"root",area:"area",topic:"topic",subtopic:"subtopic",section:"section",meta:"meta",dashboard:"meta"};
const VG={root:{l:"Root",c:"--accent"},area:{l:"Area",c:"--w1"},topic:{l:"Topic",c:"--p4"},subtopic:{l:"Subtopic",c:"--s3"},section:{l:"Section",c:"--u3"},meta:{l:"Meta",c:"--muted"}};
let vc=null;function vault(){if(vc)return vc;const nodes=G.nodes.map((x,i)=>({id:"v"+i,label:x[2],type:TYPEMAP[x[3]]||"meta",sub:x[1]||"",st:x[4]==="stub"?"stub":"",ex:x[6],status:x[4]}));const edges=G.edges.map(([a,b])=>({a:"v"+a,b:"v"+b,t:"links to"}));G.nodes.forEach((x,i)=>{if(x[8]>=0&&x[8]!==i)edges.push({a:"v"+i,b:"v"+x[8],t:"is under"})});return vc={nodes,edges}}
window.KGXDATA={eco,vault,GROUPS,VG};
})();

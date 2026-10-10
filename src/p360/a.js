(function(){
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const N=n=>Math.round(n).toLocaleString("en-US");
const D$=n=>"$"+N(n);
const has=id=>SCREENS.some(s=>s[0]===id);
const goG=(id,fn)=>{if(has(id)){go(id);if(fn)setTimeout(fn,60)}else toast("That screen is not part of this build","info")};
S.svc360=S.svc360||{sel:null,hint:null,tabHint:0};
S.imp=S.imp||{focus:null,fails:[],dir:"up",depth:3,hours:4,ctx:null,exp:{},mit:{},q:""};
const SV=window.SVCX=window.SVCX||{};
SV.created=SV.created||[];SV.attach=SV.attach||{};

/* ================= service model: layers, extras, objectives ================= */
const LAYER={svc_net:1,svc_id:1,svc_data:1,svc_int:1,svc_end:1,svc_m365:1,svc_search:1};
const layerOf=id=>LAYER[id]||2;
const CSDM_CLASS=id=>layerOf(id)===1?"Technology management service":"Business service";
const EXT={
 svc_cod:{rev:0,int:1,aud:"Editors and reviewers",cap:["Standards authoring","Editorial review","Publishing"],rto:4,rpo:1,life:"Invest"},
 svc_portal:{rev:9400000,int:0,aud:"Public readers and subscribers",cap:["Standards distribution","Subscription sales","API licensing"],rto:2,rpo:.25,life:"Invest"},
 svc_search:{rev:0,int:0,aud:"Readers and editors",cap:["Discovery of standards","Related content"],rto:4,rpo:4,life:"Invest"},
 svc_cr:{rev:0,int:1,aud:"Legal and finance staff",cap:["Contract management","Obligation tracking"],rto:8,rpo:4,life:"Migrate"},
 svc_erp:{rev:0,int:1,aud:"Finance staff",cap:["Lease accounting","Financial close"],rto:8,rpo:1,life:"Sunset"},
 svc_fin:{rev:0,int:1,aud:"Finance staff",cap:["Accounts payable","Financial reporting"],rto:8,rpo:4,life:"Maintain"},
 svc_id:{rev:0,int:1,aud:"All staff and contractors",cap:["Access management","Zero trust"],rto:1,rpo:0,life:"Invest"},
 svc_m365:{rev:0,int:1,aud:"All staff",cap:["Collaboration","Messaging"],rto:2,rpo:1,life:"Maintain"},
 svc_data:{rev:0,int:1,aud:"Analysts and data stewards",cap:["Data management","Analytics"],rto:12,rpo:4,life:"Invest"},
 svc_net:{rev:0,int:1,aud:"All staff and sites",cap:["Connectivity","Remote work"],rto:1,rpo:0,life:"Maintain"},
 svc_end:{rev:0,int:1,aud:"All staff",cap:["Workplace technology"],rto:24,rpo:24,life:"Maintain"},
 svc_int:{rev:0,int:1,aud:"Application teams",cap:["Integration","API management"],rto:8,rpo:1,life:"Invest"},
 svc_desk:{rev:0,int:1,aud:"All staff",cap:["IT support","Knowledge"],rto:4,rpo:1,life:"Maintain"}};
const ext=id=>EXT[id]||(EXT[id]={rev:0,int:1,aud:"Staff",cap:["Capability to define"],rto:8,rpo:4,life:"Maintain"});
const ALIASX=[[/portal/i,"svc_portal"],[/search|indexer|lumen/i,"svc_search"],[/codification platform|^codification$|editor/i,"svc_cod"],[/contract/i,"svc_cr"],[/lease|erp/i,"svc_erp"],[/finance/i,"svc_fin"],[/entra|identity|sign-in/i,"svc_id"],[/email|m365|collab|teams|sharepoint/i,"svc_m365"],[/data platform|lakehouse|data hub|warehouse/i,"svc_data"],[/network|vpn|firewall/i,"svc_net"],[/endpoint|intune|laptop/i,"svc_end"],[/integration|api gateway/i,"svc_int"],[/service desk/i,"svc_desk"]];
const svcId=x=>{if(!x)return null;if(typeof x==="object")x=x.id||x.n||"";const s=SVCREG.find(v=>v.id===x||v.n===x||v.n.toLowerCase()===String(x).toLowerCase());if(s)return s.id;const a=ALIASX.find(r=>r[0].test(String(x)));return a?a[1]:null};
SV.svcId=svcId;
const SVN=id=>(svcOf(id)||{n:id}).n;
const OBJS=()=>[...new Set(SVCREG.flatMap(s=>s.obj))];
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"_").slice(0,28);

/* ================= configuration items: CIREG plus scale data ================= */
const scaleSvc={"Standards Portal":"svc_portal","Search":"svc_search","Contract Repository":"svc_cr","Lease subledger":"svc_erp","Identity":"svc_id","Email and collaboration":"svc_m365","Data platform":"svc_data","Network and VPN":"svc_net","Endpoint":"svc_end","Integration hub":"svc_int"};
let _sc=null,_scN=-1;
const scaled=()=>{if(!(window.SCALE&&SCALE.on))return[];if(_sc&&_scN===SCALE.n.cis)return _sc;_sc=SCALE.cis().map(c=>Object.assign({},c,{svcI:scaleSvc[c.svc]||svcId(c.svc)||"svc_data",scaled:1}));_scN=SCALE.n.cis;return _sc};
const scMap=()=>{const m={};scaled().forEach(c=>(m[c.svcI]=m[c.svcI]||[]).push(c));return m};
let _scm=null,_scmS=null;const scBy=id=>{const s=scaled();if(_scmS!==s){_scmS=s;_scm=scMap()}return(_scm&&_scm[id])||[]};
const ciAll=()=>CIREG.concat(scaled());
const ciOf=id=>CIREG.find(c=>c.id===id)||(scaled().find(c=>c.id===id));
const svcCIs=id=>CIREG.filter(c=>c.svc===id);
const tok=s=>String(s).toLowerCase().replace(/\(.*?\)/g," ").split(/[^a-z0-9]+/).filter(t=>t.length>1&&!/^(the|and|of|service|prod|production)$/.test(t));
function resolveCI(name,svc){if(!name)return null;const ex=CIREG.find(c=>c.id===name||c.name.toLowerCase()===String(name).toLowerCase());if(ex)return ex.id;const sc=scaled().find(c=>c.id===name);if(sc)return sc.id;
 const t=tok(name);if(!t.length)return null;const pool=svc?svcCIs(svc):CIREG;let best=null,bs=0;(pool.length?pool:CIREG).forEach(c=>{const ct=tok(c.name+" "+c.class);let sc=0;t.forEach(w=>{if(ct.some(x=>x===w||x.startsWith(w)||w.startsWith(x)))sc++});if(sc>bs){bs=sc;best=c}});return bs>=1&&(pool.length||bs>=2)?best.id:null}
SV.resolveCI=resolveCI;
const nameOf=id=>{const s=svcOf(id);if(s)return s.n;const c=ciOf(id);if(c)return c.name;if(/^aud_/.test(id))return ext(id.slice(4)).aud;if(/^obj_/.test(id))return OBJS().find(o=>"obj_"+slug(o)===id)||id;return id};

/* ================= graph model: depends-on (down) and used-by (up) ================= */
let curFails=new Set();
function down(id){if(/^(aud_|obj_)/.test(id))return[];const s=svcOf(id);
 if(s&&s.id===id){const o=s.deps.slice();svcCIs(id).forEach(c=>o.push(c.id));curFails.forEach(f=>{const c=ciOf(f);if(c&&c.scaled&&c.svcI===id)o.push(f)});return o}
 return CIEDGE.filter(e=>e[0]===id).map(e=>e[1])}
function up(id){if(/^(aud_|obj_)/.test(id))return[];const s=svcOf(id);const o=[];
 if(s&&s.id===id){SVCREG.forEach(v=>{if(v.deps.includes(id))o.push(v.id)});return o}
 CIEDGE.forEach(e=>{if(e[1]===id)o.push(e[0])});const c=ciOf(id);if(c){const sv=c.scaled?c.svcI:c.svc;if(sv&&svcOf(sv))o.push(sv)}return o}
function kindOf(id){if(/^aud_/.test(id))return"aud";if(/^obj_/.test(id))return"obj";return svcOf(id)&&svcOf(id).id===id?"svc":"ci"}
function propagate(fails){curFails=new Set(fails);const memo={},vis=new Set();
 const st=id=>{if(curFails.has(id)){const c=ciOf(id);if(c&&c.scaled)return/^(Test|Dev)/.test(c.env||"")?"ok":"degraded";return"down"}if(memo[id])return memo[id];if(vis.has(id))return"ok";vis.add(id);
  const ds=down(id);const groups={};ds.forEach(d=>{const k=kindOf(d)==="svc"?"s:"+d:(ciOf(d)?(ciOf(d).scaled?"pool:"+id:"c:"+ciOf(d).class):"x");(groups[k]=groups[k]||[]).push(d)});
  let r="ok";Object.entries(groups).forEach(([k,m])=>{const f=m.filter(x=>st(x)==="down").length,g=m.filter(x=>st(x)==="degraded").length;
   if(k.startsWith("pool:")){if(f+g>0&&r==="ok")r="degraded";return}
   if(f===m.length&&f>0)r="down";else if((f>0||g>0)&&r!=="down")r="degraded"});
  vis.delete(id);memo[id]=r;return r};
 const out={};const cache=id=>out[id]||(out[id]=st(id));cache.all=()=>{SVCREG.forEach(s=>cache(s.id));CIREG.forEach(c=>cache(c.id));return out};return cache}

/* neighborhood: BFS with direction and depth */
function hood(focus,dir,depth){const nodes=new Map([[focus,0]]),edges=[];let fr=[focus];
 for(let d=1;d<=depth;d++){const nx=[];fr.forEach(n=>{if(/^(aud_|obj_)/.test(n))return;
  if(dir!=="up"){down(n).forEach(m=>{edges.push([n,m]);if(!nodes.has(m)){nodes.set(m,-d);nx.push(m)}})}
  if(dir!=="down"){up(n).forEach(m=>{edges.push([m,n]);if(!nodes.has(m)){nodes.set(m,d);nx.push(m)}})}});fr=nx}
 /* business services bring in their customers and objectives */
 [...nodes.keys()].forEach(id=>{const s=svcOf(id);if(s&&s.id===id&&layerOf(id)===2&&(dir!=="down"||id===focus)){const a="aud_"+id;nodes.set(a,nodes.get(id)+1);edges.push([a,id]);s.obj.forEach(o=>{const oid="obj_"+slug(o);if(!nodes.has(oid))nodes.set(oid,nodes.get(id)+1);edges.push([oid,id])})}});
 const seen=new Set(),E=edges.filter(e=>{const k=e[0]+">"+e[1];if(seen.has(k)||!nodes.has(e[0])||!nodes.has(e[1]))return false;seen.add(k);return true});return{nodes,edges:E}}

const SEV={down:3,degraded:2,ok:0};
function layerIdx(id){const k=kindOf(id);return k==="ci"?0:k==="svc"?layerOf(id):3}

/* draw the layered map; returns svg markup and counts of hidden nodes */
function drawMap(o){const {focus,dir,depth,fails,exp,onlyView}=o;const stf=propagate(fails||[]);const h=hood(focus,dir,depth);
 const prio=id=>{const s=stf(id);const sv=svcOf(id);return -(SEV[s]||0)*10-(id===focus?100:0)-(sv&&sv.id===id&&sv.tier==="Tier 1"?2:0)+Math.abs(h.nodes.get(id))*.1};
 const byLayer={0:[],1:[],2:[],3:[]};[...h.nodes.keys()].forEach(id=>byLayer[layerIdx(id)].push(id));
 let hiddenTotal=0;const hiddenGroups=[];const CAP=o.cap||{0:7,1:7,2:7,3:8};
 [0,1,2,3].forEach(L=>{const arr=byLayer[L].sort((a,b)=>prio(a)-prio(b));const cap=exp[L]?24:CAP[L];if(arr.length>cap){const hid=arr.slice(cap-1);byLayer[L]=arr.slice(0,cap-1);const mk="more_"+L;byLayer[L].push(mk);h.nodes.set(mk,0);hiddenGroups.push({L,ids:hid,key:mk});hiddenTotal+=hid.length;hid.forEach(x=>h.nodes.delete(x))}});
 /* scale: collapse the other configuration items of services in view */
 let extraCI=0;if(window.SCALE&&SCALE.on){[...h.nodes.keys()].forEach(id=>{if(kindOf(id)==="svc")extraCI+=scBy(id).length});extraCI-=[...h.nodes.keys()].filter(i=>ciOf(i)&&ciOf(i).scaled).length}
 const E=h.edges.filter(e=>h.nodes.has(e[0])&&h.nodes.has(e[1]));
 /* sub ranks inside a layer: longest dependency chain among visible nodes */
 const rank={};const sub=id=>{if(rank[id]!=null)return rank[id];rank[id]=0;let r=0;E.forEach(e=>{if(e[0]===id&&layerIdx(e[1])===layerIdx(id)&&e[1]!==id)r=Math.max(r,sub(e[1])+1)});return rank[id]=r};
 const rows=[];[3,2,1,0].forEach(L=>{const m={};byLayer[L].forEach(id=>{const r=id.startsWith("more_")?0:sub(id);(m[r]=m[r]||[]).push(id)});Object.keys(m).map(Number).sort((a,b)=>b-a).forEach(r=>rows.push({L,r,ids:m[r]}))});
 const NW=140,NH=48,GX=16,GY=28,LM=140;const maxN=Math.max(1,...rows.map(r=>r.ids.length));const W=Math.max(760,LM+maxN*(NW+GX)+10);const Hh=rows.length*(NH+GY)+16;
 const pos={};rows.forEach((r,ri)=>{r.ids.forEach((id,i)=>{pos[id]={x:LM+(W-LM-10-r.ids.length*(NW+GX)+GX)/2+i*(NW+GX),y:8+ri*(NH+GY),row:ri}})});
 for(let pass=0;pass<3;pass++)rows.forEach((r,ri)=>{const bc=id=>{const ns=E.filter(e=>e[0]===id||e[1]===id).map(e=>e[0]===id?e[1]:e[0]).filter(x=>pos[x]);return ns.length?ns.reduce((a,x)=>a+pos[x].x,0)/ns.length:pos[id].x};const sorted=r.ids.slice().sort((a,b)=>bc(a)-bc(b));const xs=r.ids.map(id=>pos[id].x).sort((a,b)=>a-b);sorted.forEach((id,i)=>pos[id].x=xs[i]);r.ids=sorted});
 const sc=n=>stf(n);const col2=s=>s==="down"?"--bad-f":s==="degraded"?"--warn-f":null;
 let g="";const showState=(fails||[]).length>0;
 E.forEach(e=>{const a=pos[e[0]],b=pos[e[1]];if(!a||!b)return;const x1=a.x+NW/2,y1=a.y+NH,x2=b.x+NW/2,y2=b.y;let d;const same=a.row===b.row;
  if(same){const my=a.y-14;d=`M${a.x+NW/2} ${a.y} C${a.x+NW/2} ${my-10} ${b.x+NW/2} ${my-10} ${b.x+NW/2} ${b.y}`}else{const dy=(y2-y1);const ym=y1+dy/2;d=y2>y1?`M${x1} ${y1} C${x1} ${ym} ${x2} ${ym} ${x2} ${y2}`:`M${x1} ${a.y} C${x1} ${a.y-30} ${x2} ${b.y+NH+30} ${x2} ${b.y+NH}`}
  const sd=showState?sc(e[1]):"ok";const c=col2(sd);g+=`<path d="${d}" class="svx-e ${sd!=="ok"?"hot "+sd:""}" fill="none" stroke="${c?`var(${c})`:"var(--line-art)"}" stroke-width="${sd!=="ok"?2.4:1.4}" ${kindOf(e[0])==="aud"||kindOf(e[0])==="obj"?'stroke-dasharray="4 4"':""}/>`});
 const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+"…":s;
 Object.entries(pos).forEach(([id,p])=>{const k=id.startsWith("more_")?"more":kindOf(id);let st="ok";if(showState&&k!=="more"){st=k==="aud"?sc(id.slice(4)):k==="obj"?(()=>{const lab=OBJS().find(x=>"obj_"+slug(x)===id);return SVCREG.filter(s=>s.obj.includes(lab)).reduce((a,s)=>SEV[sc(s.id)]>SEV[a]?sc(s.id):a,"ok")})():sc(id)}
  const cls=`svx-n k-${k} ${st} ${id===focus?"focus":""}`;
  if(k==="more"){const L=+id.slice(5);const hg=hiddenGroups.find(x=>x.L===L);g+=`<g class="svx-n k-more" data-imp-more="${L}" tabindex="0" role="button" aria-label="Show ${hg.ids.length} more"><rect x="${p.x}" y="${p.y}" width="${NW}" height="${NH}" rx="12"/><text x="${p.x+NW/2}" y="${p.y+21}" text-anchor="middle" class="t1">+${hg.ids.length} more</text><text x="${p.x+NW/2}" y="${p.y+37}" text-anchor="middle" class="t2">${["configuration items","technology services","business services","customers and goals"][L]}</text></g>`;return}
  const nm=nameOf(id);let sub2="";if(k==="svc"){const s=svcOf(id);sub2=s.tier+" · "+N(s.users)+" users"}else if(k==="ci"){const c=ciOf(id);sub2=c.class+(c.env&&c.env!=="Production"?" · "+c.env:"")}else if(k==="aud"){sub2=N(svcOf(id.slice(4)).users)+" people"}else sub2="Strategic objective";
  const l1=trunc(nm,22);g+=`<g class="${cls}" data-imp-node="${H(id)}" tabindex="0" role="button" aria-label="${H(nm)}, ${H(sub2)}${st!=="ok"?", "+st:""}"><title>${H(nm)} · ${H(sub2)}${st!=="ok"?" · "+(st==="down"?"failing":"degraded"):""}. Click to center the map here.</title><rect x="${p.x}" y="${p.y}" width="${NW}" height="${NH}" rx="12"/><text x="${p.x+10}" y="${p.y+20}" class="t1">${H(l1)}</text><text x="${p.x+10}" y="${p.y+37}" class="t2">${H(trunc(sub2,24))}</text>${id===focus?`<text x="${p.x+4}" y="${p.y-5}" class="tf">FOCUS</text>`:""}${st==="down"?`<circle cx="${p.x+NW-9}" cy="${p.y+NH-12}" r="5" class="dd"/>`:st==="degraded"?`<circle cx="${p.x+NW-9}" cy="${p.y+NH-12}" r="5" class="dw"/>`:""}</g>`});
 const labels=[];let prevL=-1;rows.forEach((r,ri)=>{if(r.L!==prevL){labels.push(`<text x="4" y="${8+ri*(NH+GY)+27}" class="rl">${["Configuration items","Technology services","Business services","Customers and goals"][r.L]}</text>`);prevL=r.L}});
 return {svg:`<svg class="svx" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Dependency map" style="min-width:${Math.min(W,820)}px;max-width:${Math.round(W*1.2)}px">${labels.join("")}${g}</svg>`,n:h.nodes.size,hidden:hiddenTotal,extraCI,hiddenGroups,stf,h}}
SV.drawMap=drawMap;

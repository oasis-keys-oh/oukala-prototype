/* ===== mod_r31_jx: data layer for the journey maps.
   Trace numbers, strategy metrics, processes behind every step, how processes connect, and avatars.
   Every figure here is a sample value (modeled or hypothesis). Nothing is measured and nothing is live. ===== */
(function(){
const W=window;const X=W.JYX;if(!X||!X.api||!W.SCN||!SCN.pack)return;
const A=()=>X.api;
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const hash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const JXR=W.JXR={E,hash,pad};
const allPacks=()=>Object.keys(SCN.pack).map(k=>({k,pk:SCN.pack[k]}));
const everyBox=()=>{const o=[];allPacks().forEach(({k,pk})=>pk.jys.forEach(j=>j.stages.forEach(s=>s.boxes.forEach(b=>o.push({k,j,s,b})))));return o};

/* ---------- 1. trace numbers: JH3-07 is the same step on every tab ---------- */
function stamp(){allPacks().forEach(({pk})=>pk.jys.forEach(j=>{let n=0;j.stages.forEach(s=>s.boxes.forEach(b=>{if(b.tn&&b.tn.split("-")[0]===j.id)n=Math.max(n,+b.tn.split("-")[1]||0)}));
 j.stages.forEach(s=>s.boxes.forEach(b=>{if(!b.tn||b.tn.split("-")[0]!==j.id)b.tn=j.id+"-"+pad(++n)}))}))}
JXR.tn=(j,b)=>{if(!b.tn||b.tn.split("-")[0]!==j.id){let n=0;j.stages.forEach(s=>s.boxes.forEach(x=>{if(x.tn&&x.tn.split("-")[0]===j.id)n=Math.max(n,+x.tn.split("-")[1]||0)}));b.tn=j.id+"-"+pad(n+1)}return b.tn};
JXR.numText=b=>{const p=b.procs&&b.procs[0];if(!p||!W.NUM)return "";const key=p.src+"|"+p.ref;return (p.step&&NUM.stepById(key,p.step))||NUM.proc(key)||""};
JXR.numTail=b=>{const t=JXR.numText(b);return t?` <span class="num-chip" title="The process step that serves this step. Type it in search to open it.">\u2192 ${E(t)}</span>`:""};
JXR.tnChip=(j,b)=>`<span class="jtn" title="Trace number. The same number follows this step on every tab.">${E(JXR.tn(j,b))}</span>${JXR.numTail(b)}`;

/* ---------- 2. strategy metrics ---------- */
/* label, unit, today, target, weight (t: elapsed minutes, r: friction hours, c: cost), decimals. Sample values, not measured. */
const KV={
 JY5:["Time from need to published standard","days",540,420,"t"],JY1:["Days until a new hire is fully set up","days",9,5,"t"],JY2:["Days from request to a working laptop","days",11,6,"t"],JY3:["Median time to restore service","hours",9.5,5.5,"t",1],JY4:["Days from idea to funded project","days",62,38,"t"],
 JH0:["Episode satisfaction","of 5",3.6,4.2,"r",1],JH1:["Days from referral to first visit","days",21,12,"t"],JH2:["30-day readmission rate","%",15.5,12.5,"r",1],JH3:["ED length of stay","min",245,205,"t"],JH4:["On-time first-case starts","%",62,82,"r"],JH5:["Discharge before noon","%",18,38,"r"],JH6:["Postpartum follow-up completion","%",58,80,"r"],JH7:["Avoidable ED visits per 1,000 members","",74,58,"r"],JH8:["Days in accounts receivable","days",52,44,"t"],JH9:["Nurse overtime","% of paid hours",6.8,4.8,"r",1],
 JM0:["Cost per tonne (index, today = 100)","",100,94,"c"],JM1:["Unplanned downtime","hours a month",310,240,"t"],JM2:["Days to close a corrective action","days",21,12,"t"],
 JS0:["Net revenue retention","%",104,110,"r"],JS1:["Days from evaluation to protected","days",38,24,"t"],JS2:["Time to restore after a data event","hours",14,8,"t"]};
X.KPI=X.KPI||{};Object.keys(KV).forEach(id=>{X.KPI[id]=KV[id][0]});
const kvOf=j=>{const r=KV[j.id]||["Journey outcome","",100,90,"t"];return {label:r[0],unit:r[1],base:r[2],tgt:r[3],w:r[4]||"t",d:r[5]||0,down:r[3]<r[2]}};
JXR.kv=kvOf;
JXR.fv=(k,v)=>{const s=(+v).toFixed(k.d);return k.unit==="%"?s+"%":k.unit?s+" "+k.unit:s};
const fric=b=>b.min*b.vol/60*(5-b.em)/4;
/* share of a journey's target that fixing this step could reach: its weight times how much of it the best action removes */
function potentials(j){const a=A(),k=kvOf(j),L=a.allBoxes(j),out=new Map();let tot=0;
 L.forEach(({b})=>{const r=a.rec(b);const w=k.w==="t"?Math.max(b.min,.5):k.w==="c"?Math.max(b.cost*b.vol,1):Math.max(fric(b),.5);
  const f=r.st==="cand"?a.REC_SAVE[r.k]:(b.pain&&b.em<=2)?.4:r.st==="running"?.05:.15;const p=w*f;out.set(b,{p,f});tot+=p});
 out.forEach(v=>{v.share=tot?v.p/tot:0});out.tot=tot;return out}
JXR.pot=potentials;
JXR.slice=(j,b)=>{const k=kvOf(j),p=potentials(j).get(b);return p?{share:p.share,delta:(k.tgt-k.base)*p.share,k}:{share:0,delta:0,k}};
/* the fix set: rows of {j,b} at an effort percentage (80 reaches the whole target if every step is fixed) */
JXR.rollup=(rows,pct)=>{const by=new Map();const sc=Math.min(1,(pct||80)/80);
 rows.forEach(({j,b})=>{const o=by.get(j.id)||{j,k:kvOf(j),share:0,n:0};o.share+=potentials(j).get(b)?potentials(j).get(b).share:0;o.n++;by.set(j.id,o)});
 const out=[...by.values()].map(o=>{const sh=o.share*sc;return Object.assign(o,{sh,after:o.k.base+(o.k.tgt-o.k.base)*sh,delta:(o.k.tgt-o.k.base)*sh})});
 out.sort((p,q)=>q.sh-p.sh);return out};
JXR.targets=(rows,pct)=>JXR.rollup(rows,pct).reduce((s,o)=>s+o.sh,0);
function objectives(j,b){const a=A(),r=a.rec(b),k=kvOf(j),L=a.allBoxes(j),avg=L.reduce((s,x)=>s+x.b.min,0)/(L.length||1),o=[];
 if(b.em<=2)o.push("Experience");
 if(k.w==="t"&&(b.min>=60||b.min>avg*1.4))o.push("Throughput");
 if(r.st==="cand"&&!r.pt&&r.save>=20)o.push("Capacity");
 if(b.cost*b.vol>=4000)o.push("Cost to serve");
 if(b.risk>=4)o.push("Quality and risk");
 if(!o.length)o.push(k.w==="t"?"Throughput":"Experience");return o}
JXR.objectives=objectives;
/* best action on a step: share of effort removed, hours and dollars, and the lift in how it feels */
JXR.fixOf=(j,b)=>{const a=A(),r=a.rec(b);const f=r.st==="cand"?a.REC_SAVE[r.k]:(b.pain&&b.em<=2)?.4:0;const raw=b.min*b.vol/60*f,hrs=a.capSave?a.capSave(raw):raw;
 return {f,hrs,capped:raw>hrs,usd:b.who==="Patient"?0:hrs*a.REC_RATE,pt:b.who==="Patient",lift:f>0?Math.min(1,5-b.em):0}};
/* DC-01: the FTE model in one place (mod_people journey section): 140 hours a month is one FTE; one step releases at most REC_CAP_FTE. Modeled. */
JXR.FTE_H=()=>A().FTE_H||140;
/* JM-04: one counting rule for proposed teammates, used by the Build list, the org chart, orgprop and the Personas tab.
   A build is one agent or one robot. Recommended steps of the same kind that share a process (else a shared touchpoint, else a stage) are one build.
   Scope: "detail" leaves out an end-to-end journey when detailed journeys exist (it summarizes the same work); "all" counts every journey. */
JXR.scope={sel:null};
JXR.hasDetail=()=>X.JY.list.some(j=>j.cat!=="End to end");
JXR.scopeNow=()=>JXR.scope.sel||(JXR.hasDetail()?"detail":"all");
JXR.inScope=j=>!(JXR.scopeNow()==="detail"&&j.cat==="End to end"&&JXR.hasDetail());
JXR.buildGroup=(j,s,b)=>b.procs.length?pk_(b.procs[0]):b.key?"tp:"+b.key:"st:"+j.id+":"+s.id;
JXR.buildKey=(j,s,b,r)=>r.k+":"+JXR.buildGroup(j,s,b);
JXR.countBuilds=rows=>{const ag=new Set(),rb=new Set();rows.forEach(x=>{const r=x.r||A().rec(x.b);if(r.st!=="cand"||(r.k!=="agent"&&r.k!=="robot"))return;(r.k==="agent"?ag:rb).add(JXR.buildKey(x.j,x.s,x.b,r))});return {agents:ag.size,robots:rb.size,keys:[...ag,...rb]}};
JXR.capNote=()=>`Each step releases at most ${A().REC_CAP_FTE||2} FTE (${A().REC_CAP_H||280} hours a month), modeled`;

/* ---------- 3. avatars ---------- */
const AGN=["Atlas","Sage","Nova","Iris","Orion","Lyra","Quill","Vega"],RBN=["Bolt","Gear","Rivet","Relay","Cog","Torque","Switch","Sprocket"];
JXR.dwName=(b,k)=>(k==="robot"?"Robot ":"Agent ")+(k==="robot"?RBN:AGN)[hash(b.tn||b.t)%8];
JXR.av=(kind,name,sz,cls)=>{sz=sz||28;const t=E(name||kind);
 if(kind==="robot")return `<span class="jav jav-robot ${cls||""}" style="--s:${sz}px" role="img" aria-label="${t}" title="${t}"><svg viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="2" width="36" height="36" rx="11" class="a-bg"/><path d="M20 8V5M17.5 5h5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/><rect x="9" y="11" width="22" height="19" rx="6" fill="#fff" opacity=".95"/><circle cx="15.5" cy="20" r="2.6" class="a-fg"/><circle cx="24.5" cy="20" r="2.6" class="a-fg"/><path d="M15 26h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="a-fgs"/></svg></span>`;
 if(kind==="agent")return `<span class="jav jav-agent ${cls||""}" style="--s:${sz}px" role="img" aria-label="${t}" title="${t}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" class="a-bg"/><path d="M19 9l2.6 7.4L29 19l-7.4 2.6L19 29l-2.6-7.4L9 19l7.4-2.6z" fill="#fff"/><path d="M29.5 24.5l1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2z" fill="#fff" opacity=".9"/></svg></span>`;
 const h=hash(name),hue=h%360,hr=h%3;
 return `<span class="jav jav-human ${cls||""}" style="--s:${sz}px" role="img" aria-label="${t}" title="${t}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="hsl(${hue} 42% 84%)"/><path d="M5 37c1.4-7.5 7.2-11 15-11s13.6 3.5 15 11a19 19 0 01-30 0z" fill="hsl(${hue} 36% 40%)"/><rect x="17" y="21" width="6" height="6" rx="2" fill="hsl(${hue} 28% 58%)"/><ellipse cx="20" cy="16" rx="6.6" ry="7.4" fill="hsl(${hue} 30% 66%)"/>${hr===0?`<path d="M13 15.5c0-5 3-8 7-8s7 3 7 8c-2-2.6-4-3.6-7-3.6s-5 1-7 3.6z" fill="hsl(${hue} 30% 26%)"/>`:hr===1?`<path d="M12.6 17c-.8-6.5 3-10 7.4-10s8.2 3.5 7.4 10c-.6-4-3-6-7.4-6s-6.8 2-7.4 6zM12.6 17c.2 3 .8 5 1.6 6.4l-1.8-.4c-1-2-1.2-4-.8-6zM27.4 17c-.2 3-.8 5-1.6 6.4l1.8-.4c1-2 1.2-4 .8-6z" fill="hsl(${hue} 30% 26%)"/>`:`<path d="M13.4 14c1.2-4.4 4-6.4 6.6-6.4s5.4 2 6.6 6.4c-2.2-1.6-4.4-2.4-6.6-2.4s-4.4.8-6.6 2.4z" fill="hsl(${hue} 22% 34%)"/>`}</svg></span>`};
/* persona avatar plus the digital worker doing or proposed for the step */
JXR.crew=(b,r,sz)=>{sz=sz||30;const who=JXR.av("human",b.who,sz);
 if(r&&r.k!=="people"&&(r.st==="running"||r.st==="cand")){const nm=JXR.dwName(b,r.k);return `<span class="jcrew" title="${E(b.who)} with ${E(nm)}${r.st==="cand"?" (proposed)":" (automated today, modeled)"}">${who}${JXR.av(r.k,nm+(r.st==="cand"?" (proposed)":" (automated today, modeled)"),Math.round(sz*.78),"jav-ov"+(r.st==="cand"?" jav-cand":""))}</span>`}
 return `<span class="jcrew" title="${E(b.who)}">${who}</span>`};
/* a face for the experience curve: 1 frustrated to 5 delighted */
JXR.face=(em,cx,cy,r)=>{const q=(em-3)*.5*r,my=cy+.34*r;return `<circle class="jfc" cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx-.36*r}" cy="${cy-.22*r}" r="${.11*r}" class="jfe"/><circle cx="${cx+.36*r}" cy="${cy-.22*r}" r="${.11*r}" class="jfe"/><path class="jfm" d="M${cx-.46*r} ${my}Q${cx} ${my+q} ${cx+.46*r} ${my}" fill="none"/>`};

/* ---------- 4. processes behind every step ---------- */
const jshort=j=>{if(j.cat==="End to end")return "End to end";const n=String(j.n).replace(/^[A-Za-z ]+: /,"").split(",")[0];return n.charAt(0).toUpperCase()+n.slice(1)};
JXR.jshort=jshort;
const common=a=>{const m={};a.forEach(x=>{if(x)m[x]=(m[x]||0)+1});return Object.keys(m).sort((p,q)=>m[q]-m[p])[0]||"Operations"};
function generate(){allPacks().forEach(({k,pk})=>{const ind=SCN.list[k].ind;
 const un=[];pk.jys.forEach(j=>j.stages.forEach(s=>s.boxes.forEach(b=>{if(!b.procs.length)un.push({j,s,b})})));
 /* leave three loud, painful steps unlinked so the red flag stays in the demo */
 const keep=new Set(un.filter(x=>x.b.pain).sort((p,q)=>fric(q.b)-fric(p.b)).slice(0,3).map(x=>x.b));
 const groups=new Map();un.forEach(x=>{if(keep.has(x.b))return;const g=x.b.key?"tp:"+x.b.key:"st:"+x.j.id+":"+x.s.id;(groups.get(g)||groups.set(g,[]).get(g)).push(x)});
 groups.forEach((rows,g)=>{const tp=g.indexOf("tp:")===0&&X.TP&&X.TP[g.slice(3)];const f=rows[0];
  const name=tp?tp.n:f.j.cat==="End to end"?f.s.n+" (end to end)":jshort(f.j)+": "+f.s.n;
  const id="wf_gx_"+(tp?"tp_"+g.slice(3).toLowerCase():f.j.id.toLowerCase()+"_"+f.s.id);
  const owner=common(rows.map(x=>x.b.owner));
  const mk=(i,n,type,team,sla,cost,sys,rv)=>({id:"st"+i,n,type,owner:team,team,sla,olaHrs:0,cost,in:[],out:[],cond:"",next:[],requesterVisible:!!rv,system:sys||""});
  const steps=[mk(1,"Receive the request","human",owner,"Same day",0,rows[0].b.sys,false)];
  rows.forEach((x,i)=>steps.push(Object.assign(mk(i+2,x.b.t,/approv|authori[sz]/i.test(x.b.t)||x.b.who==="Approver"?"gate":"human",x.b.owner||owner,x.b.min+" min",x.b.cost,x.b.sys,x.b.who===x.j.persona),{olaHrs:+(x.b.min/60).toFixed(2)})));
  steps.push(mk(steps.length+1,"Record the outcome","human",owner,"Same day",0,rows[rows.length-1].b.sys,false));
  steps.forEach((s,i)=>{s.next=i<steps.length-1?["st"+(i+2)]:[]});
  const def={id,name,kind:"request",service:f.j.cat,owner,steps,visibleToRequester:steps.filter(s=>s.requesterVisible).map(s=>s.id),std:[],drafted:"journey-map"};if(ind)def.industry=ind;
  pk.wfs.push(def);if(k===SCN.cur&&W.WFX)WFX.reg(def);
  rows.forEach((x,i)=>{const pr=X.px("WFX",id,name,0,owner);pr.step="st"+(i+2);x.b.procs.push(pr)})})})}

/* ---------- 5. how processes connect ---------- */
const pk_=p=>p.src+"|"+p.ref;
JXR.pkey=pk_;
function pindex(){const M=new Map();X.JY.list.forEach(j=>{const L=A().allBoxes(j);L.forEach(({b,s},i)=>b.procs.forEach(p=>{const o=M.get(pk_(p))||{p,rows:[]};o.rows.push({j,s,b,i,L});M.set(pk_(p),o)}))});return M}
JXR.pindex=pindex;
JXR.conn=key=>{const M=pindex(),me=M.get(key);const up=new Map(),dn=new Map(),pe=new Map(),js=new Map();if(!me)return {me:null,up,dn,pe,js};
 const add=(m,p,why)=>{const k=pk_(p);if(k===key)return;const o=m.get(k)||{p,n:0};o.n++;m.set(k,o)};
 me.rows.forEach(({j,b,i,L})=>{js.set(j.id,j);
  [i-1,i-2].filter(x=>x>=0).slice(0,1).forEach(x=>L[x].b.procs.forEach(p=>add(up,p)));
  [i+1].filter(x=>x<L.length).forEach(x=>L[x].b.procs.forEach(p=>add(dn,p)));
  if(b.key)M.forEach((o2,k2)=>{if(k2!==key&&o2.rows.some(r=>r.b.key===b.key&&r.b!==b))add(pe,o2.p)})});
 return {me,up,dn,pe,js}};
JXR.procSteps=p=>{if(p.src==="WFX"){const w=W.WFX&&WFX.get(p.ref);return w?w.steps.map(s=>({id:s.id,n:s.n,t:s.type,o:s.owner||s.team||"",sla:s.sla||""})):[]}
 const d=W.PROC&&PROC.defs[p.ref];return d&&d.steps?d.steps.map((s,i)=>({id:"P"+i,n:s.n,t:s.who,o:s.owner||"",sla:s.sla||""})):[]};

stamp();generate();stamp();
try{X.syncJy()}catch(e){}
/* images for the boxes: drop files in assets/journey and list them in manifest.json (see the README there) */
/* JM-06: keys, most specific first: the trace number ("JH3-07"), "tp:<touchpoint key>" (JYX.TP), "persona:<name>", "default".
   tp: and persona: keys match without regard to case. Keys starting with "_" are comments; an empty value is skipped, so the step keeps its tinted placeholder.
   JXR.setManifest(m) sets the manifest without a fetch (a page opened from a file cannot fetch it); window.JOURNEY_MANIFEST is read if present. */
JXR.manifest={};
const MIDX={};
const norm=k=>{const s=String(k);const i=s.indexOf(":");return i>0?s.slice(0,i).toLowerCase()+":"+s.slice(i+1).trim().toLowerCase():s.trim()};
JXR.setManifest=function(m,noRender){JXR.manifest=m&&typeof m==="object"?m:{};Object.keys(MIDX).forEach(k=>delete MIDX[k]);
 Object.keys(JXR.manifest).forEach(k=>{const v=JXR.manifest[k];if(k.charAt(0)==="_"||typeof v!=="string"||!v.trim())return;MIDX[norm(k)]=v.trim()});
 if(!noRender)try{if(S.screen==="ppl_jrny")render()}catch(e){}return Object.keys(MIDX).length};
if(W.JOURNEY_MANIFEST)JXR.setManifest(W.JOURNEY_MANIFEST,true);
try{fetch("journey/manifest.json",{cache:"no-store"}).then(r=>r.ok?r.json():{}).then(m=>{if(m&&Object.keys(m).length)JXR.setManifest(m)}).catch(()=>{})}catch(e){}
JXR.imgKey=b=>{if(!b)return "";const c=[b.tn,b.key?"tp:"+b.key:"",b.who?"persona:"+b.who:"","default"].filter(Boolean);for(const k of c){if(MIDX[norm(k)])return k}return ""};
JXR.img=(b)=>{const k=JXR.imgKey(b);const f=k?MIDX[norm(k)]:"";return f?"url(journey/"+encodeURI(f)+")":""};
})();

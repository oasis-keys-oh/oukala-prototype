/* ================= rule context, price and approvals ================= */
const optsOf=v=>typeof v.o==="function"?v.o():(v.o||[]);
const oVal=o=>o&&typeof o==="object"?o.v:o;
const oObj=o=>typeof o==="object"?o:{v:o,sub:"",pr:0};
const defVals=it=>{const o={};it.vars.forEach(v=>{if(v.d!==undefined)o[v.k]=Array.isArray(v.d)?v.d.slice():v.d;else if(v.t==="multi")o[v.k]=[];else if(v.t==="toggle")o[v.k]=false});return o};
const CSP={"Hana Koval":"Dev Rao","Marco Ellis":"Dev Rao","Ravi Menon":"Sam Patel","Elise Park":"Priya Shah"};
const MGRS2=n=>{const r=who(n);if(r&&r.kind==="contractor"&&CSP[n])return CSP[n];return MGRS(n)};
RESOLVE.manager.f=c=>{if(c.vals&&c.vals.mgr&&c.item==="onboarding")return c.vals.mgr;let m=MGRS2(c.for);if(m===c.by)m=MGRS2(m);if(m===c.for)m=MGRS2(m);return m};
RESOLVE.sponsor.f=c=>MGRS2(c.for);
const subjectOf=(it,vals,forWho)=>it.id==="offboarding"||it.id==="move"?(vals.who||forWho):it.id==="onboarding"?(vals.name||"New hire"):forWho;
const LICPOOL=()=>({});
function ctxOf(it,vals,forWho,by){
 const base=Object.assign(defVals(it),vals||{});const sub=subjectOf(it,base,forWho);
 const c=Object.assign({},base,{item:it.id,svc:it.svc,for:it.id==="onboarding"?(base.mgr||forWho):sub,by:by||forWho,vals:base,expedite:false,tier:"Standard",restricted:false,poolempty:false});
 c.worker=it.id==="onboarding"||(it.id==="vendor")?(base.worker||"Employee"):WORKER(it.id==="onboarding"?base.mgr:sub);
 c.region=(base.loc==="Remote EU"||base.country&&base.country!=="United States"&&it.id==="vendor")?"EU":REGION(c.for);
 c.level=LEVEL(c.for);c.region2=c.region;
 if(it.derive)Object.assign(c,it.derive(base));
 if(it.id==="software"){c.restricted=RESTRICTED.includes(base.title);const l=LIC.find(x=>x.n===base.title);c.poolempty=!!l&&l.asg>=l.ent}
 const lead=it.id==="onboarding"?14:it.id==="laptop"?4:0;const dt=base.needby||(it.id==="onboarding"?base.start:null);c.expedite=!!(lead&&dt&&ms(dt)<NOW+lead*DAY);
 c.price=priceOf(it,base,null);c.price=priceOf(it,base,c);
 return c}
function priceOf(it,vals,ctx){let p=0;const v0=Object.assign(defVals(it),vals||{});
 it.vars.forEach(v=>{if(v.sh&&ctx&&!evalCond(v.sh,ctx))return;const val=v0[v.k],op=optsOf(v);if(v.t==="toggle"){if(val)p+=v.pr||0}else if(op.length&&typeof op[0]==="object"){if(v.t==="multi")(val||[]).forEach(x=>{const o=op.find(o=>o.v===x);p+=o?o.pr||0:0});else{const o=op.find(o=>o.v===val);p+=o?o.pr||0:0}}});
 if(ctx)(it.pr||[]).forEach(([l,w,a])=>{if(a&&evalCond(w,ctx))p+=a});
 if(it.priceFn)p+=it.priceFn(v0);
 if(it.id==="project"||it.id==="newsvc")p=0;
 return Math.round(p)}
function apprFor(it,vals,forWho,by){const ctx=ctxOf(it,vals,forWho,by),out=[],seen={};
 it.appr.forEach(rule=>{const trig=evalCond(rule.when,ctx);let w=resolveAp(rule.who,ctx),note="";if(trig){if(w===(by||forWho)&&w!==ctx.for&&false){}if(w===by&&by===ctx.for){const m=MGRS2(w);note="Requester cannot approve their own request, so it goes to "+m;w=m}if(seen[w]){out.push({id:rule.id,n:rule.n,kind:rule.kind,why:rule.why,trig:true,dup:true,who:w,note:w+" already approves this request under "+seen[w]+"; counted once."});return}seen[w]=rule.n}
  out.push({id:rule.id,n:rule.n,kind:rule.kind,why:rule.why,trig:trig,dup:false,who:w,note:note,when:rule.when,rule:rule.who})});
 return {ctx,list:out}}
const ruleOf=(it,id)=>it.appr.find(a=>a.id===id);

/* ================= flattened workflow templates (sub-workflows expanded) ================= */
const TPLC={};
function tplOf(fid){if(TPLC[fid])return TPLC[fid];const f=FLOW(fid),out=[];
 const expand=(flow,prefix,par,depth,inh)=>{const gl=flow.steps.filter(s=>s.type==="gate").map(s=>s.id);
  flow.steps.forEach((s,i)=>{let p=s.p===GATES?gl.slice():(s.p||(i?[flow.steps[i-1].id]:[]));const c=Object.assign({},s,{id:prefix+s.id,p:p.map(x=>prefix+x),par:par,depth:depth,fl:flow.id,sg:!!prefix&&s.type==="gate"});
   if(prefix&&!p.length)c.p=inh.slice();
   out.push(c);if(s.type==="sub")expand(FLOW(s.sub),c.id+".",c.id,depth+1,c.p)})};
 expand(f,"",null,0,[]);return TPLC[fid]=out}
const kids=(tpl,id)=>tpl.filter(x=>x.id.startsWith(id+".")&&x.par===id||x.par===id);
const allKids=(tpl,id)=>tpl.filter(x=>x.id.startsWith(id+"."));
function skipSet(it,r,ctx,aps){const tpl=tplOf(it.flow),sk=new Set();
 tpl.forEach(s=>{if(s.type==="gate"){if(s.sg){sk.add(s.id);return}const a=aps.find(x=>x.id===s.ap);if(!a||!a.trig||a.dup)sk.add(s.id)}else if(s.cond&&!evalCond(s.cond,ctx))sk.add(s.id)});
 tpl.filter(s=>s.type==="sub"&&sk.has(s.id)).forEach(s=>allKids(tpl,s.id).forEach(k=>sk.add(k.id)));
 /* onboarding sub-flow context: the laptop and phone follow the order's choices */
 return [...sk]}
const stepName=(it,s)=>{if(s.type==="gate"){const r=ruleOf(it,s.ap);return r?"Approval: "+r.n:"Approval"}return s.n};
/* the sub-flow context for the laptop inside an onboarding order */
const subCtx=(ctx,sf)=>{const c=Object.assign({},ctx);if(sf==="wf_laptop"){c.reason="New hire";c.model=ctx.laptop;c.provision="Zero touch (Autopilot)";c.deliver=/Remote/.test(ctx.loc||"")?"Home (remote)":"Parker HQ desk"}if(sf==="wf_phone")c.model="iPhone 16";return c};

/* ================= request store ================= */
const REQS=[];window.REQREG=REQS;
let REQV=0,reqSeq=10100,bulkOn=null;
const hrOf=(a,b)=>(b-a)/HR;
const rnd=(seed)=>{const r=RNG(seed);return r};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const poolPeople=()=>DIR.filter(d=>d.kind==="human"||d.kind==="contractor");
const actualDur=(s,r,rr)=>{const m=s.type==="gate"?.35+1.5*rr():s.type==="wait"?.7+.45*rr():.4+.75*rr();return Math.max(.05,s.t*m)};
function layout(r,tpl,sk,rr,delayH){const off={},sks=new Set(sk),unplaced=tpl.slice();let guard=0,gEnd=0;
 const placed=id=>off[id]!==undefined;
 while(unplaced.length&&guard++<80){for(let i=0;i<unplaced.length;i++){const s=unplaced[i];
  if(s.type==="sub"){const ch=allKids(tpl,s.id);if(!ch.every(k=>placed(k.id)))continue;const live=ch.filter(k=>!sks.has(k.id)&&off[k.id].e>off[k.id].s);const st=live.length?Math.min(...live.map(k=>off[k.id].s)):Math.max(0,...(s.p||[]).map(p=>placed(p)?off[p].e:0));off[s.id]={s:st,e:live.length?Math.max(...live.map(k=>off[k.id].e)):st,d:0};unplaced.splice(i,1);i--;continue}
  if(!s.p.every(placed))continue;let st=s.p.length?Math.max(...s.p.map(p=>off[p].e)):0;
  if(s.type!=="gate"&&s.id!=="s1"&&delayH&&!s.id.includes("."))st=Math.max(st,gEnd+delayH);
  else if(s.type!=="gate"&&s.id!=="s1"&&delayH)st=Math.max(st,gEnd+delayH);
  const sk1=sks.has(s.id);const d=sk1?0:actualDur(s,r,rr);const rw=!sk1&&s.rw&&rr()*100<s.rw*0.9;const dd=rw?d*1.45:d;off[s.id]={s:st,e:st+dd,d:dd,rw:rw};
  if(s.type==="gate"&&!sk1&&!s.sg)gEnd=Math.max(gEnd,st+dd);unplaced.splice(i,1);i--}}
 return off}
const TEAMPICK=(r,team,human)=>{const g=GRPS[team];if(!g)return null;const m=g.members.filter(x=>human?!isAI(x):true);return m.length?m[Math.floor(r()*m.length)]:null};
/* build one request. state: pending | approved | fulfilling | deployed | decommissioned | rejected */
function mk(itemId,state,o){o=o||{};const it=ITEM(itemId),r0=rnd((o.id||"r"+reqSeq)+itemId);const P=poolPeople();
 const by=o.by||pick(r0,P).name;let fw=o.for||(r0()<.14?pick(r0,P).name:by);
 const vals=o.vals?Object.assign({},o.vals):genVals(it,r0);
 const {ctx,list}=apprFor(it,vals,fw,by);const tpl=tplOf(it.flow);const sk=skipSet(it,null,ctx,list);
 const r={id:o.id||"RITM00"+(reqSeq++),req:o.req||"REQ00"+(10100+Math.floor(reqSeq/1.3)),item:itemId,flow:it.flow,service:it.svc,offering:it.off,requester:by,onBehalfOf:fw!==by?fw:null,for:fw,vals:vals,sk:sk,ap:{},ts:{},as:{},cm:o.cm||[],tasks:[],price:ctx.price,state:state,pr:o.pr||(r0()<.07?1:r0()<.2?2:3),delayH:0,decom:null,rej:null,ctxs:{tier:ctx.tier,region:ctx.region,worker:ctx.worker,level:ctx.level},xla:null};
 list.forEach(a=>{if(a.trig&&!a.dup)r.ap[a.id]={who:a.who,st:"pending",note:a.note||""}});
 if(state==="approved")r.delayH=o.delayH||(24+Math.floor(r0()*120));
 const off=layout(r,tpl,sk,r0,r.delayH);const total=Math.max(...Object.values(off).map(x=>x.e));
 const gates=tpl.filter(s=>s.type==="gate"&&!sk.includes(s.id));const gEnd=gates.length?Math.max(...gates.map(g=>off[g.id].e)):0;
 let cut,ageH=0,rejGate=null;
 const fr=o.frac!=null?o.frac:.15+.7*r0();
 if(state==="deployed"||state==="decommissioned"){cut=1e9;ageH=(o.ageDays!=null?o.ageDays:state==="decommissioned"?70+r0()*220:1+r0()*38)*24;r.doneAtOff=total}
 else if(state==="fulfilling"){const a=Math.max(0,gEnd);cut=a+r.delayH+fr*(total-a-r.delayH)*.92+.01;if(cut>=total)cut=total*.9}
 else if(state==="approved"){cut=gEnd+r.delayH*(.2+.5*r0())}
 else if(state==="pending"){const g=gates.length?(o.gate?gates.find(x=>x.ap===o.gate)||pick(r0,gates):pick(r0,gates)):null;cut=g?off[g.id].s+off[g.id].d*(.25+.6*fr):1}
 else{const g=gates.length?pick(r0,gates):null;rejGate=g;cut=g?off[g.id].e:1}
 const elapsed=cut>=1e8?total+ageH:cut;r.created=o.created||Math.round(NOW-elapsed*HR);
 const done=(a)=>a.e<=cut+1e-9,act=(a)=>a.s<=cut&&!done(a);
 tpl.forEach(s=>{if(sk.includes(s.id))return;const a=off[s.id];if(!a)return;const st=Math.round(r.created+a.s*HR),en=Math.round(r.created+a.e*HR);
  if(done(a)){const t={s:st,e:en,rw:a.rw?1:0};t.by=s.type==="gate"?(r.ap[s.ap]||{}).who:s.owner&&!isAI(s.owner)&&s.type==="human"?s.owner:s.type==="auto"?"Oukala automation":s.type==="agent"?s.owner:s.type==="wait"?(s.team):s.team==="Requester"?r.requester:TEAMPICK(r0,s.team,true)||s.team;r.ts[s.id]=t;if(s.type==="gate"&&r.ap[s.ap]){r.ap[s.ap].st="approved";r.ap[s.ap].at=en;r.ap[s.ap].fta=!a.rw}}
  else if(act(a)&&s.type!=="sub"||(act(a)&&s.type==="sub")){r.ts[s.id]={s:st};if(s.type==="human"||s.type==="wait"){const p=r0()<.55&&s.type==="human"&&s.team!=="Requester"?TEAMPICK(r0,s.team,true):"";r.as[s.id]={t:s.team,p:p||"",why:p?"Claimed from the "+s.team+" queue":""}}}});
 if(state==="rejected"&&rejGate){const gr=r.ap[rejGate.ap];if(gr){gr.st="rejected";gr.at=Math.round(r.created+off[rejGate.id].e*HR);gr.note=pick(r0,["Not justified for this role.","Duplicate of an existing request.","Budget is frozen until November.","Security cannot approve this software."])}r.rej={at:gr?gr.at:r.created,by:gr?gr.who:"",rule:rejGate.ap};tpl.forEach(s=>{if(r.ts[s.id]&&!r.ts[s.id].e)delete r.ts[s.id]});Object.keys(r.ap).forEach(k=>{if(r.ap[k].st==="pending")r.ap[k].st="cancelled"})}
 if(state==="decommissioned"){r.decom=Math.round(NOW-(o.decomDays!=null?o.decomDays:r0()*60)*DAY)}
 if(state==="deployed"||state==="decommissioned"){r.xla=Math.max(1,Math.min(5,Math.round((4.3+(r0()-.5)*2.2+(r0()<.07?-1.8:0))*10)/10))}
 touch(r);return r}
/* values for generated requests */
function genVals(it,r){const v=defVals(it);it.vars.forEach(x=>{const op=optsOf(x);if(!op.length||x.t==="multi"||x.t==="people")return;if(x.t==="select"||x.t==="cards"||x.t==="chips"){const w=op.map(oVal);v[x.k]=r()<.62&&v[x.k]!==undefined?v[x.k]:pick(r,w)}else if(x.t==="toggle")v[x.k]=r()<.3});
 if(it.id==="laptop"){v.provision=r()<.78?"Zero touch (Autopilot)":"Prepared by IT";v.reason=pick(r,["New hire","Replacement, end of life","Replacement, end of life","Replacement, end of life","Additional device","Lost or stolen"]);v.monitor=r()<.25;v.deliver=r()<.78?"Parker HQ desk":"Home (remote)"}
 if(it.id==="project"){v.cost=Math.round((10+r()*r()*400))*1000;v.data=pick(r,["Public","Internal","Internal","Restricted"]);v.vendor=r()<.3;v.ai=r()<.2}
 if(it.id==="aiaccess"){v.tokens=Math.round(10+r()*140);v.cur=Math.round(5+r()*40)}
 if(it.id==="vendor"){v.spend=Math.round(5+r()*r()*400)*1000}
 if(it.id==="onboarding"){v.name=pick(r,["Alex","Jamie","Morgan","Riley","Casey","Quinn"])+" "+pick(r,["Nguyen","Okafor","Santos","Kim","Rossi","Haddad"]);v.mgr=pick(r,poolPeople().filter(d=>d.kind==="human")).name;v.start=iso(NOW+(r()*30-20)*DAY);v.phone=r()<.25;v.badge=r()<.7;v.laptop=pick(r,["Standard 14-inch","Standard 14-inch","Developer 16-inch"])}
 if(it.id==="offboarding"||it.id==="move"){v.who=pick(r,poolPeople().filter(d=>d.kind==="human")).name}
 return v}
/* recompute everything derived from the step records */
function touch(r){const it=ITEM(r.item),tpl=tplOf(it.flow),sk=new Set(r.sk);let done=true,started=false,gatesPending=false,gE=r.created,costDone=0,costPlan=0,olaN=0,olaMiss=0,rework=0,minS=Infinity,maxE=0;const act=[],work=[],pause=[];
 const live=tpl.filter(s=>!sk.has(s.id));
 live.forEach(s=>{const t=r.ts[s.id];if(s.type!=="sub"){const c=s.cost*(t&&t.rw?1.5:1);costPlan+=s.cost;if(t&&t.e)costDone+=c}
  if(t&&t.e){if(s.type==="gate"&&!s.sg)gE=Math.max(gE,t.e);if(s.type!=="sub"){olaN++;const dur=(t.e-t.s)/HR;if(dur>s.t*1.0&&s.type!=="gate")olaMiss++;if(t.rw)rework++}minS=Math.min(minS,t.s);maxE=Math.max(maxE,t.e)}
  else{if(!r.rej)done=false;if(t&&t.s&&!r.rej)act.push(s)}
  if(t&&t.s&&s.type!=="gate"&&s.id!=="s1"&&s.type!=="sub")started=true;
  if(t&&t.s&&s.type!=="sub"&&s.id!=="s1"){const iv=[t.s,t.e||NOW];(s.pause||s.type==="gate"?pause:work).push(iv)}
  if(s.type==="gate"&&!(t&&t.e)&&t&&t.s&&!r.rej)gatesPending=true});
 const U=a=>{a=a.slice().sort((x,y)=>x[0]-y[0]);let l=0,e=-1e18,s0=0;a.forEach(([x,y])=>{if(x>e){l+=e>-1e17?e-s0:0;s0=x;e=y}else if(y>e)e=y});return a.length?l+(e-s0):0};
 r.ola={n:olaN,miss:olaMiss};r.rework=rework;r.costDone=Math.round(costDone*100)/100;r.costPlan=Math.round(costPlan*100)/100;
 const end=r.rej?r.rej.at:(done&&maxE?maxE:NOW);const elapsed=(end-r.created)/HR;const paused=Math.max(0,U(work.concat(pause))-U(work));
 r.cycle=Math.max(0,elapsed);r.slaUsed=Math.max(0,elapsed-paused/HR);r.slaTgt=it.slaH;r.sl=Math.round(r.slaUsed/it.slaH*100);r.done=done&&!r.rej?maxE:null;
 if(r.rej)r.state="rejected";else if(r.decom)r.state="decommissioned";else if(done)r.state="deployed";else if(!started)r.state=gatesPending?"pending":"approved";else r.state="fulfilling";
 if(r.state==="approved"){r.slaUsed=0;r.sl=0}r.cost=Math.round(r.price+r.costDone);r.act=act.map(s=>s.id);
 /* who is it sitting with */
 const w=[];act.forEach(s=>{if(s.type==="sub")return;const a=r.as[s.id]||{};if(s.type==="gate"){const ap=r.ap[s.ap]||{};w.push({k:"person",n:ap.who,step:stepName(it,s),role:"Approver"})}else if(s.type==="human"){if(s.team==="Requester")w.push({k:"person",n:r.requester===r.for?r.for:r.requester,step:s.n,role:"Requester"});else w.push(a.p?{k:"person",n:a.p,step:s.n,role:a.t}:{k:"team",n:s.team,step:s.n,role:"Queue"})}else if(s.type==="agent")w.push({k:"agent",n:s.owner||"AI agent",step:s.n,role:"AI agent"});else if(s.type==="wait")w.push({k:"team",n:s.team,step:s.n,role:"Waiting"});else w.push({k:"auto",n:"Oukala automation",step:s.n,role:"Automatic"})});
 r.w=w;const p0=w.find(x=>x.k==="person"||x.k==="team")||w[0];r.withN=r.state==="approved"?"Scheduled":p0?p0.n:"";r.withK=p0?p0.k:"";r.stepN=w.length?w[0].step:"";r.nap=Object.values(r.ap).filter(a=>a.st==="pending").length;r.clr=r.sl>=100?"bad":r.sl>=75?"warn":"good";
 r.startAt=r.state==="approved"?(gE+Math.max(1,r.delayH)*HR*.8):0}

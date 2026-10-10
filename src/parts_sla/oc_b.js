
/* ---------------- rota engine ---------------- */
const TIERS=["First responder","Primary","Secondary","Escalation"],REQT=["Primary","Secondary"];
const ANCH=Date.UTC(2026,8,29,10),ALLD=[0,1,2,3,4,5,6],WK=[1,2,3,4,5];
const MSP_RATE={"Northwind Managed Services":38,"Contoso Cloud Operations":44,"Lumen Search Services":52};
let _lid=0;
const rot=(tier,n,members,o)=>Object.assign({id:"L"+(++_lid),kind:"rot",tier,n,members,len:168,anchor:ANCH,days:ALLD,from:0,to:24},o||{});
const fix=(tier,n,who,days,from,to)=>({id:"L"+(++_lid),kind:"fixed",tier,n,who,days:days||ALLD,from:from==null?0:from,to:to==null?24:to});
function seedRotas(){_lid=0;const R=(id,n,scope,target,tier,req,resp,layers,o)=>Object.assign({id,n,scope,target,tier,req,reqN:{},sla:{respMin:resp},layers,esc:"E_"+id,rate:{p:2.5,s:1.25}},o||{});
 return [
 R("R1","Service desk on-call","team","Service desk","Tier 2",{Primary:"ext",Secondary:"biz"},30,[fix("First responder","MSP tier 1 desk","Northwind Managed Services",WK,5,17),rot("Primary","Weekly primary",["Tom Becker","Nia Brooks","Priya Shah"]),rot("Secondary","Weekly secondary",["Priya Shah","Tom Becker","Nia Brooks"])],{ai:{agent:"Triage Agent",afterMin:2,guards:["Reads the incident and similar records only","Can classify, link a known error and suggest a fix","Cannot restart services or change configuration","Pages a human if not acknowledged in 2 minutes"]}}),
 R("R2","Platform engineering","team","Ops team","Tier 1",{Primary:"24x7",Secondary:"24x7"},15,[fix("First responder","MSP monitoring","Contoso Cloud Operations"),rot("Primary","Weekly primary",["Sam Patel","Jordan Lee","Ravi Menon"]),rot("Secondary","Weekly secondary",["Ravi Menon","Sam Patel","Jordan Lee"]),fix("Escalation","Service owner","Sam Patel",WK,8,17)],{ai:{agent:"Triage Agent",afterMin:1,guards:["Runs approved diagnostics only (read only)","Cannot scale, restart or deploy","Every action is written to the incident"]}}),
 R("R3","Search and indexing (Lumen)","service","svc_search","Tier 1",{Primary:"24x7",Secondary:"24x7"},15,[rot("Primary","Weekly primary",["Dev Rao","Maya Ortiz","Hana Koval"]),fix("Secondary","MSP tier 2 (24x5)","Lumen Search Services",WK,0,24),fix("Escalation","Lumen duty manager","Marco Ellis")]),
 R("R4","Identity and security","service","svc_id","Tier 1",{Primary:"24x7",Secondary:"ext"},15,[rot("Primary","Weekly primary",["Rina Okafor","Sam Patel"]),rot("Secondary","Weekday secondary",["Jordan Lee","Ravi Menon"],{days:WK,from:6,to:20}),fix("Escalation","Security lead","Rina Okafor")]),
 R("R5","Standards Platform","service","svc_cod","Tier 1",{Primary:"24x7",Secondary:"ext"},15,[rot("Primary","Weekly primary",["Priya Shah","Jordan Lee","Dev Rao"]),rot("Secondary","Weekday secondary",["Sam Patel","Ravi Menon"],{days:WK,from:6,to:20}),fix("Escalation","Chief Editor (business owner)","Chief Editor",WK,8,17)]),
 R("R6","Database class cover","asset","Database","Tier 2",{Primary:"ext"},60,[rot("Primary","Daily primary",["Dev Rao","Jordan Lee"],{len:24,days:WK,from:6,to:20})]),
 R("R7","Network device cover","asset","Network device","Tier 1",{Primary:"24x7"},15,[rot("Primary","Weekly primary",["Sam Patel","Ravi Menon"])]),
 R("R8","Global follow-the-sun desk","fts","Americas, Europe, Asia Pacific","Tier 1",{Primary:"24x7"},15,[rot("Primary","Europe (08:00 to 16:00 CEST)",["Hana Koval","Marco Ellis"],{len:24,from:0,to:8}),rot("Primary","Americas (08:00 to 16:00 MT)",["Tom Becker","Nia Brooks"],{len:24,days:WK,from:8,to:16}),fix("Primary","Asia Pacific (managed service provider)","Northwind Managed Services",ALLD,16,24),fix("First responder","AI first responder","Triage Agent")],{ai:{agent:"Triage Agent",afterMin:2,guards:["Acts on P3 and P4 only without a human","Cannot close an incident","Hands over with a written summary"]}}),
 R("R9","Finance systems","service","svc_fin","Tier 2",{Primary:"biz"},120,[rot("Primary","Business-hours primary",["Jordan Lee","Sam Patel"],{days:WK,from:8,to:17})]),
 R("R10","Endpoint management","service","svc_end","Tier 2",{Primary:"ext"},60,[fix("Primary","MSP tier 1 (7am to 7pm Eastern)","Northwind Managed Services",WK,5,17),fix("Escalation","Service desk lead","Tom Becker",WK,8,17)])]}
function rotas(){if(!OC.rotas)OC.rotas=seedRotas();if(!SCALE.on)return OC.rotas;if(OC._sg!==DIR.length){OC._sg=DIR.length;OC._gen=genRotas()}return OC.rotas.concat(OC._gen)}
function genRotas(){const out=[];const r=RNG("genrota");const teams=TEAMS.filter(t=>t.id!=="agents");let n=11;
 teams.forEach(t=>{const m=DIR.filter(d=>d.kind==="human"&&d.team===t.n).map(d=>d.name);if(m.length<3)return;const pool=m.slice(0,9);out.push({id:"RG"+(++n),gen:1,n:t.n+" on-call (enterprise)",scope:"team",target:t.n,tier:r()<.4?"Tier 1":"Tier 2",req:{Primary:r()<.5?"24x7":"ext",Secondary:r()<.5?"biz":"none"},reqN:{},sla:{respMin:r()<.5?15:30},layers:[rot("Primary","Weekly primary",pool.slice(0,5)),rot("Secondary","Weekly secondary",pool.slice(2,6).concat(pool[0]),r()<.5?{days:WK,from:8,to:17}:{})],esc:"E_default",rate:{p:2.5,s:1.25}})});
 SVCREG.filter(s=>!OC.rotas.some(x=>x.scope==="service"&&x.target===s.id)).forEach(s=>{const g=DIR.filter(d=>d.kind==="human"&&(d.name===s.owner||d.team===(who(s.owner)||{}).team)).map(d=>d.name).slice(0,6);if(g.length<2)return;out.push({id:"RG"+(++n),gen:1,n:s.n+" cover",scope:"service",target:s.id,tier:s.tier,req:{Primary:s.tier==="Tier 1"?"24x7":"ext"},reqN:{},sla:{respMin:s.tier==="Tier 1"?15:60},layers:[rot("Primary","Weekly primary",g)],esc:"E_default",rate:{p:2.5,s:1.25}})});
 ["Server","Virtual machine","Application","Storage","Load balancer","Cloud resource","Container"].forEach(c=>{const g=DIR.filter(d=>d.kind==="human"&&d.team==="Ops team").map(d=>d.name).slice(0,6);if(g.length<2)return;out.push({id:"RG"+(++n),gen:1,n:c+" class cover",scope:"asset",target:c,tier:"Tier 2",req:{Primary:"ext"},reqN:{},sla:{respMin:60},layers:[rot("Primary","Daily primary",g,{len:24,days:WK,from:6,to:20})],esc:"E_default",rate:{p:2.5,s:1.25}})});
 return out}
const rotaById=id=>rotas().find(x=>x.id===id);
const REQF={"24x7":()=>1,ext:(d,h)=>d>=1&&d<=5&&h>=6&&h<20?1:0,biz:(d,h)=>d>=1&&d<=5&&h>=8&&h<17?1:0,wk24:(d,h)=>d>=1&&d<=5?1:0,none:()=>0};
function needAt(R,tier,t){if(R.reqGrid&&R.reqGrid[tier])return R.reqGrid[tier][hw(t)]||0;const spec=(R.req||{})[tier]||"none";const d=new Date(t);return (REQF[spec]||REQF.none)(d.getUTCDay(),d.getUTCHours())*((R.reqN||{})[tier]||1)}
function layerWho(L,t){const d=new Date(t),dow=d.getUTCDay(),h=d.getUTCHours();if(!inHours(L,h,dow))return[];if(L.kind==="rot"){const n=L.members.length;if(!n)return[];const k=Math.floor((t-L.anchor)/(L.len*HR));return [L.members[((k%n)+n)%n]]}return [].concat(L.who)}
function at(R,tier,t){let p=[];R.layers.forEach(L=>{if(L.tier===tier)layerWho(L,t).forEach(w=>{if(!p.some(x=>x.who===w))p.push({who:w,src:L.id,lay:L.n})})});
 OC.ov.forEach(o=>{if(o.rota===R.id&&o.tier===tier&&o.from<=t&&t<o.to){if(o.was)p=p.filter(x=>x.who!==o.was);if(o.who&&!p.some(x=>x.who===o.who))p.push({who:o.who,src:o.id,lay:o.type==="swap"?"Swap":"Override",ov:true})}});return p}
const GC=new Map();
function grid(R,tier,w0){const key=R.id+"|"+tier+"|"+w0+"|"+OC.ver+"|"+DIR.length+"|"+(R.layers.length);if(GC.has(key))return GC.get(key);if(GC.size>4000)GC.clear();const g=[];
 for(let i=0;i<168;i++){const t=w0+i*HR,p=at(R,tier,t),need=needAt(R,tier,t);const eff=p.filter(x=>{const h=ptoHit(x.who,t);return !(h&&h.st==="approved")});const pend=p.some(x=>{const h=ptoHit(x.who,t);return h&&h.st==="pending"});
  let s;if(need===0)s=p.length?"x":"-";else if(!eff.length)s=p.length?"pto":"gap";else if(eff.length<need)s="part";else s=eff.length>need?"sur":"ok";g.push({t,p,need,n:eff.length,s,pend})}
 GC.set(key,g);return g}
function stats(R,from,days){const out={req:0,ok:0,gap:0,part:0,pto:0,surplus:0,hrs:{}};const w0=monOf(from);const end=from+days*DAY;
 REQT.forEach(tier=>{if(!(R.req||{})[tier]&&!R.reqGrid)return;for(let w=w0;w<end;w+=7*DAY){const g=grid(R,tier,w);g.forEach(c=>{if(c.t<from||c.t>=end||!c.need)return;out.req++;out.hrs[tier]=(out.hrs[tier]||0)+1;if(c.s==="ok"||c.s==="sur")out.ok++;else if(c.s==="part"){out.part++}else if(c.s==="pto")out.pto++;else out.gap++;if(c.s==="sur")out.surplus++})}});
 out.pct=out.req?Math.round(out.ok/out.req*1000)/10:100;return out}
const SC=new Map();
function rstats(R){const k=R.id+"|"+OC.ver+"|"+DIR.length+"|"+R.layers.length;if(SC.has(k))return SC.get(k);if(SC.size>800)SC.clear();const s=stats(R,d0(NOW),14);SC.set(k,s);return s}
function nowOn(R,tier){return at(R,tier||"Primary",NOW).map(x=>x.who)}
/* who is on call right now across rotas, for chat and Person 360 */
const onCallNow=name=>rotas().filter(R=>TIERS.some(t=>at(R,t,NOW).some(x=>x.who===name)));
/* fairness and cost over a window */
const NIGHT=h=>h>=22||h<6;
function load(R,from,days){const per={};const end=from+days*DAY;["Primary","Secondary"].forEach(tier=>{for(let t=from;t<end;t+=HR){at(R,tier,t).forEach(x=>{const o=per[x.who]=per[x.who]||{who:x.who,h:0,night:0,wkend:0,p:0,s:0,cost:0};const d=new Date(t),dw=d.getUTCDay();o.h++;if(tier==="Primary")o.p++;else o.s++;if(NIGHT(d.getUTCHours()))o.night++;if(dw===0||dw===6)o.wkend++;o.cost+=rate(x.who,tier,R)})}});return per}
function rate(name,tier,R){const r=who(name)||{kind:"human"};if(tier==="First responder")return r.kind==="ai"?.9:0;if(r.kind==="msp")return MSP_RATE[name]||40;if(r.kind==="ai")return .9;if(r.kind==="contractor")return (r.rate||120)*.1;const p=(R&&R.rate)||{p:2.5,s:1.25};return tier==="Primary"?p.p:p.s}
const fairIdx=per=>{const v=Object.values(per).filter(x=>who(x.who)&&who(x.who).kind!=="msp"&&who(x.who).kind!=="ai").map(x=>x.h);if(v.length<2)return 100;const m=v.reduce((a,b)=>a+b,0)/v.length;if(!m)return 100;const sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/v.length);return Math.max(0,Math.round(100-sd/m*100))};

/* ---------------- routeBy: ranked candidates for skills, team, service, priority, language, time ---------------- */
function routeBy(o){o=o||{};const at_=o.at!=null?toMs(o.at):NOW;const need=(o.skills||[]).map(s=>{const id=resolveSkill(s&&s.id?s.id:s);return id?{id,min:(s&&s.min)||o.minLevel||3}:null}).filter(Boolean);const lang=o.language?resolveSkill(o.language):null;const prio=o.priority||"P3";const sv=o.service?svcOf(o.service):null;
 const rotaPeople=new Set();rotas().forEach(R=>{if((sv&&R.scope==="service"&&R.target===sv.id)||(o.team&&R.scope==="team"&&R.target===o.team))R.layers.forEach(L=>(L.members||[].concat(L.who)).forEach(w=>rotaPeople.add(w)))});
 const primaryNow=new Map();rotas().forEach(R=>{if(!((sv&&R.scope==="service"&&R.target===sv.id)||(o.team&&R.scope==="team"&&R.target===o.team)))return;["Primary","Secondary"].forEach(tier=>at(R,tier,at_).forEach(x=>primaryNow.set(x.who,tier+" on call for "+R.n)))});
 const ex=new Set(o.exclude||[]);let pool=DIR.filter(d=>!ex.has(d.name)&&(d.kind!=="ai"||/P3|P4/.test(prio)||o.ai)&&(!o.kinds||o.kinds.includes(d.kind)));
 const cand=pool.map(d=>{const why=[],warn=[];let sc=0,sk=0;
  if(need.length){need.forEach(n=>{const lv=levelOf(d.name,n.id),s=skillById(n.id);const f=lv>=n.min?1:lv?lv/n.min*.55:0;sk+=f;if(lv>=n.min)why.push("Level "+lv+" "+s.n);else if(lv)warn.push(s.n+" level "+lv+" (needs "+n.min+")");else warn.push("No "+s.n)});sk=sk/need.length;sc+=sk*40}else sc+=20;
  const av=AVAIL(d.name,at_);if(av.ok){sc+=25;why.push(av.reason)}else warn.push(av.reason);
  if(o.team&&d.team===o.team){sc+=10;why.push("On the "+o.team)}else if(rotaPeople.has(d.name)){sc+=6;why.push("On the rota for this service")}
  if(sv&&(sv.owner===d.name||(sv.sme||[]).includes(d.name))){sc+=6;why.push((sv.owner===d.name?"Owns ":"Expert on ")+sv.n)}
  if(primaryNow.has(d.name)){sc+=10;why.push(primaryNow.get(d.name))}
  if(lang){const lv=levelOf(d.name,lang);if(lv>=3){sc+=5;why.push("Speaks "+skillById(lang).n)}else warn.push("No "+skillById(lang).n)}
  if(d.kind==="contractor"){sc-=2;why.push("Contractor, billable")}if(d.kind==="msp"){sc-=3;why.push("Managed service provider")}if(d.kind==="ai"){sc+=3;why.push("AI first responder, guardrails apply")}
  return {name:d.name,kind:d.kind,score:sc,skill:Math.round(sk*100),av,why,warn}});
 cand.sort((a,b)=>b.score-a.score);const top=cand.slice(0,Math.max(o.limit||8,8)*2);
 top.forEach(c=>{let pct=0;try{pct=workload(c.name).pct}catch(e){}c.load=pct;const l=Math.max(0,Math.min(15,15*(1-pct/110)));c.score+=l;c.why.push("Load "+pct+"%")});
 top.sort((a,b)=>b.score-a.score);top.forEach(c=>c.score=Math.round(c.score*10)/10);return top.slice(0,o.limit||8)}
window.routeBy=routeBy;
window.ONCALL={rotas:()=>rotas(),now:nowOn,at,stats,onCallNow,coverage:()=>{let r=0,k=0;rotas().forEach(R=>{const s=rstats(R);r+=s.req;k+=s.ok});return r?Math.round(k/r*1000)/10:100}};

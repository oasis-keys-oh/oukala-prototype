
/* ---------------- coverage recommendation engine ---------------- */
const SVCSK={svc_search:["search","inc"],svc_id:["entra","inc"],svc_cod:["cod","inc"],svc_fin:["lease","inc"],svc_end:["intune","inc"],svc_net:["net","inc"],svc_data:["de","inc"],svc_cr:["crepo","inc"],svc_erp:["lease","inc"],svc_m365:["m365","inc"],svc_portal:["cod","inc"],svc_int:["integ","inc"],svc_desk:["t1","inc"]};
const CLSK={"Database":["sql","inc"],"Network device":["net","inc"],"Server":["azure","inc"],"Virtual machine":["azure","inc"]};
function rotaSkills(R){if(R.skills&&R.skills.length)return R.skills;if(R.scope==="service")return SVCSK[R.target]||["inc"];if(R.scope==="asset")return CLSK[R.target]||["azure","inc"];if(R.scope==="team")return (TEAMDOM[R.target]||["inc"]).slice(0,2);return ["inc"]}
const rotaTeam=R=>R.scope==="team"?R.target:(R.scope==="service"&&svcOf(R.target)?((who(svcOf(R.target).owner)||{}).team||""):"");
const rotaName=R=>R.n;
function targetName(R){if(R.scope==="service"){const s=svcOf(R.target);return s?s.n:R.target}return R.target}
const dowOf=i=>(Math.floor(i/24)+1)%7;
function volProfile(weekly){const raw=[];let sum=0;for(let i=0;i<168;i++){const d=dowOf(i),h=i%24,wd=d>=1&&d<=5;const v=(wd?1:.35)*(h>=8&&h<18?1:h>=6&&h<22?.5:.18)*((h===9||h===10||h===14||h===15)?1.3:1);raw.push(v);sum+=v}return raw.map(v=>v/sum*weekly)}
function recommend(inp,R){const lam=volProfile(+inp.vol||20),util=(+inp.util||60)/100,hm=(+inp.handle||45)/60,resp=+inp.resp||15,t1=inp.tier==="Tier 1";
 const erl=lam.map(x=>x*hm);const P=[],Sx=[];
 for(let i=0;i<168;i++){const d=dowOf(i),h=i%24;const wk=d>=1&&d<=5;const ext=wk&&h>=6&&h<20,biz=wk&&h>=8&&h<17;const extra=Math.max(0,Math.ceil(erl[i]/util)-1);
  let p=resp<=30?1:resp<=120?(ext?1:0):(biz?1:0);if(p)p+=extra;
  let s=0;if(t1&&resp<=15)s=1;else if(t1)s=ext?1:0;else if(resp<=60)s=biz?1:0;P.push(p);Sx.push(s)}
 const blocks=[];[["Primary",P],["Secondary",Sx]].forEach(([tier,arr])=>{const byKey={};for(let d=0;d<7;d++){const dw=(d+1)%7;const spans=[];let cur=null;for(let h=0;h<24;h++){const n=arr[d*24+h];if(n>0&&cur&&cur.n===n)cur.to=h+1;else{if(cur)spans.push(cur);cur=n>0?{from:h,to:h+1,n}:null}}if(cur)spans.push(cur);spans.forEach(sp=>{const k=sp.from+"-"+sp.to+"x"+sp.n;(byKey[k]=byKey[k]||{tier,from:sp.from,to:sp.to,n:sp.n,days:[]}).days.push(dw)})}Object.values(byKey).forEach(b=>blocks.push(b))});
 const skills=inp.skills||[];const team=R?rotaTeam(R):"";
 blocks.forEach(b=>{b.hours=b.days.length*(b.to-b.from)*b.n;b.night=b.days.length*Array.from({length:b.to-b.from},(_,k)=>b.from+k).filter(NIGHT).length*b.n;b.allday=b.from===0&&b.to===24;
  const mid=Date.UTC(2026,9,5+((b.days[0]+6)%7),Math.floor((b.from+b.to)/2));const c=routeBy({skills,team,service:R&&R.scope==="service"?R.target:"",priority:"P2",at:mid,limit:12,kinds:["human","contractor"],exclude:[]}).filter(x=>x.skill>=60||!skills.length);b.cands=c;
  const ring=Math.max(b.allday?4:3,Math.min(b.n+2,6));b.members=c.filter(x=>x.av.ok||b.allday).slice(0,Math.max(ring,b.n)).map(x=>x.name);b.ring=b.members.length;b.label=(b.days.length===7?"Every day":b.days.length===5&&!b.days.includes(0)&&!b.days.includes(6)?"Monday to Friday":b.days.map(d=>DN[d]).join(", "))+" "+fh(b.from)+" to "+fh(b.to)});
 const wk=4.35;const sumH=f=>blocks.filter(f).reduce((a,b)=>a+b.hours,0);
 const humanCost=blocks.reduce((a,b)=>a+b.hours*(b.tier==="Primary"?2.5:1.25),0)*wk;
 const nightH=blocks.reduce((a,b)=>a+b.night,0),dayCost=(blocks.reduce((a,b)=>a+(b.hours-b.night)*(b.tier==="Primary"?2.5:1.25),0))*wk;
 const optA={id:"A",n:"Employees only",cost:humanCost,note:"Every hour staffed by a rotation of employees and contractors.",members:Math.max(4,Math.min(7,Math.ceil(sumH(()=>true)/60))),fair:nightH*wk},
  optB={id:"B",n:"Employees by day, managed service provider overnight",cost:dayCost+nightH*wk*(MSP_RATE[inp.sup||"Northwind Managed Services"]||40)*.55,note:"Overnight hours (22:00 to 06:00) go to "+(inp.sup||"Northwind Managed Services")+" at the contract rate with a "+(inp.ai?"AI first responder in front":"human desk in front")+".",members:Math.max(3,Math.min(5,Math.ceil((sumH(()=>true)-nightH)/60))),fair:0},
  optC={id:"C",n:"Follow-the-sun with AI first responder",cost:dayCost*.85+nightH*wk*.9+nightH*wk*.25*(MSP_RATE[inp.sup||"Northwind Managed Services"]||40)*.4,note:"An AI agent answers overnight P3 and P4 within guardrails and pages a human only for P1 and P2. Cheapest, but needs your approval of the guardrails.",members:3,fair:nightH*wk*.2};
 const opts=[optA,optB,optC];const pickC=(inp.resp>15&&!/Tier 1/.test(inp.tier))?"C":nightH>30&&optB.cost<optA.cost?"B":"A";
 return {lam,erl,P,Sx,blocks,opts,pick:pickC,nightH,peak:Math.max(...erl),total:sumH(()=>true)}}
function applyRec(rec,inp,R){let newR=false;if(!R){newR=true;R={id:"R"+(rotas().length+1+Math.floor(Math.random()*90)),n:inp.name||"New rota",scope:inp.scope||"service",target:inp.target||"svc_cr",tier:inp.tier,req:{},reqN:{},sla:{respMin:+inp.resp},layers:[],esc:"E_default",rate:{p:2.5,s:1.25}};OC.rotas.push(R)}
 R.reqGrid=R.reqGrid||{};R.reqGrid.Primary=rec.P.slice();R.reqGrid.Secondary=rec.Sx.slice();R.req=Object.assign({},R.req,{Primary:rec.P.some(x=>x)?"custom":"none",Secondary:rec.Sx.some(x=>x)?"custom":"none"});R.sla=Object.assign({},R.sla,{respMin:+inp.resp});
 const opt=inp.opt||rec.pick;R.layers=R.layers.filter(L=>!L.rec);
 rec.blocks.forEach(b=>{const night=b.from<6||b.to>22;if(opt!=="A"&&b.allday&&b.tier==="Primary"){R.layers.push(Object.assign(rot("Primary","Recommended day shift",b.members,{days:b.days,from:6,to:22}),{rec:1}));R.layers.push(Object.assign(fix("Primary","Recommended overnight provider",inp.sup||"Northwind Managed Services",b.days,22,24),{rec:1}));R.layers.push(Object.assign(fix("Primary","Recommended overnight provider (after midnight)",inp.sup||"Northwind Managed Services",b.days,0,6),{rec:1}));return}
  R.layers.push(Object.assign(rot(b.tier,"Recommended "+b.tier.toLowerCase(),b.members.length?b.members:["Sam Patel"],{days:b.days,from:b.from,to:b.to,len:b.allday&&b.days.length===7?168:24}),{rec:1}))});
 if(opt==="C"&&inp.ai){R.layers.push(Object.assign(fix("First responder","AI first responder (P3 and P4)","Triage Agent"),{rec:1}));R.ai=R.ai||{agent:"Triage Agent",afterMin:2,guards:["Acts on P3 and P4 only","Cannot restart or change anything","Pages a human for P1 and P2"]}}
 OC.ver++;GC.clear();SC.clear();audit("applied coverage recommendation",R.n+" option "+opt);return R}
/* PTO conflicts: scheduled people with time off in the next 28 days, grouped into runs */
function conflicts(){const out=[];const end=d0(NOW)+28*DAY;rotas().forEach(R=>{const map={};REQT.forEach(tier=>{for(let w=monOf(d0(NOW));w<end;w+=7*DAY){grid(R,tier,w).forEach(c=>{if(c.t<d0(NOW)||c.t>=end)return;c.p.forEach(x=>{const h=ptoHit(x.who,c.t);if(!h)return;const k=tier+"|"+x.who+"|"+h.id;const o=map[k]=map[k]||{rota:R.id,tier,who:x.who,pto:h,from:c.t,to:c.t+HR,need:c.need,covered:0};o.to=Math.max(o.to,c.t+HR);o.from=Math.min(o.from,c.t);if(c.need&&c.n>=c.need)o.covered++})})}});Object.values(map).forEach(o=>out.push(o))});
 return out.sort((a,b)=>a.from-b.from)}
function gapRuns(R){const out=[];REQT.forEach(tier=>{let cur=null;const w0=monOf(d0(NOW));for(let w=w0;w<d0(NOW)+14*DAY+7*DAY;w+=7*DAY){grid(R,tier,w).forEach(c=>{if(c.t<d0(NOW)||c.t>=d0(NOW)+14*DAY)return;const bad=c.need&&(c.s==="gap"||c.s==="pto"||c.s==="part");if(bad&&cur&&cur.to===c.t&&cur.s===c.s)cur.to=c.t+HR;else{if(cur)out.push(cur);cur=bad?{rota:R.id,tier,from:c.t,to:c.t+HR,s:c.s}:null}})}if(cur)out.push(cur)});return out}
const hrsStr=ms=>{const h=Math.round(ms/HR);return h>=48?Math.round(h/24)+" days":h+" hours"};

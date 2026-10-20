/* ---------- Line types ---------- */
const TYP={deliverable:["Deliverable","--p1"],milestone:["Milestone","--p4"],commitment:["Commitment","--p5"],outcome:["Outcome","--p6"],kpi:["Measure or KPI","--w1"],sla:["Service level","--w3"],payment:["Payment or invoice term","--e1"],assumption:["Assumption","--e4"],dependency:["Dependency","--s1"],obl_us:["Our obligation","--s3"],obl_vendor:["Vendor obligation","--s4"],risk:["Risk","--u1"],term:["Term, renewal, termination","--u3"],liability:["Liability and indemnity","--u4"],data:["Data protection and security","--accent"],ip:["Intellectual property","--bad"],warranty:["Warranty","--good"],price:["Price or rate card","--warn"],change:["Change control","--story"],legal:["General legal term","--metric"]};
const TR=[
 ["milestone",s=>/^milestone \d+\s*:/.test(s)],
 ["sla",s=>/availab(?:le|ility)|uptime|service credit|sev(?:erity)?\s*(?:1|one|2)\b|response time|resolution time|recovery (?:time|point)/.test(s)],
 ["change",s=>/change (?:order|request|control)|changes (?:require|must)/.test(s)],
 ["legal",s=>/press release|case stud|publicity|solicit|governed by|governing law|confidential|insurance|exclusiv/.test(s)],
 ["data",s=>!/terminat/.test(s)&&/personal data|customer data|meridian data|data protection|breach|security incident|subprocessor|sub-processor|subcontract|encrypt|soc ?2|iso ?27001|penetration|documented instructions|data processing|stored in|machine learning|train[^.]*model|improve[^.]*models?|artificial intelligence|multi-?factor/.test(s)],
 ["liability",s=>/liabilit|indemnif|\bdefend\b|consequential|exclusive remedy/.test(s)],
 ["ip",s=>/intellectual property|work product|copyright|background (?:tools|ip)|\bowns?\b|ownership|grants? [^.]*licen[sc]e|royalty/.test(s)&&!/infring/.test(s)],
 ["warranty",s=>/warrant|non-?conform|at no charge/.test(s)],
 ["price",s=>/(?:increase|adjust|escalat|uplift)[^.]*(?:fees?|rates?|prices?)|(?:fees?|rates?|prices?)[^.]*(?:increase|adjust|fixed for)|rate card/.test(s)],
 ["term",s=>/terminat|renew|initial term|expire|term of this/.test(s)],
 ["payment",s=>/invoice|net \d+|payable|payment|in advance/.test(s)],
 ["price",s=>/\$\s?\d|per hour|hourly|fixed fee|time and materials|per user|per seat|per query|pricing|expenses|travel|fees? (?:is|are)/.test(s)],
 ["assumption",s=>/assum|any delay|delay in|provided that|contingent/.test(s)],
 ["dependency",s=>/depends on|dependent on|prerequisite|relies on|(?:meridian|customer) (?:shall|will|must) (?:provide|make|grant|assign)/.test(s)],
 ["risk",s=>/\brisk\b|may delay|could delay|not responsible for delays/.test(s)],
 ["outcome",s=>/outcome|objective|\bgoal\b|so that|result in/.test(s)],
 ["deliverable",s=>/deliver|will produce|documentation|report|runbook|design document|source code|training|onboarding/.test(s)],
 ["kpi",s=>/(?:accuracy|relevance|latency|precision|throughput|kpi)/.test(s)&&/\d/.test(s)||/measured (?:by|quarterly|monthly)/.test(s)],
 ["obl_us",s=>/review (?:each|the)|deemed accept|acceptance (?:period|criteria)/.test(s)],
 ["obligation",s=>/\b(?:shall|must|will|agrees to|responsible for)\b/.test(s)]
];
const STOP=new Set("the a an of to and or for in on at by is are be will shall may must any each all this that with from as its their his her it not no than then also under over into per which who".split(" "));
const words=s=>String(s).toLowerCase().replace(/[^a-z0-9$%. -]/g," ").split(/\s+/).filter(Boolean);
const ovl=(a,b)=>{const A=new Set(words(a).filter(w=>w.length>4&&!STOP.has(w)));return words(b).filter(w=>w.length>4&&A.has(w)).length};
function dateIn(o,ct){let m=o.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i);if(m)return m[3]+"-"+String(MONF[m[1].toLowerCase()]).padStart(2,"0")+"-"+String(+m[2]).padStart(2,"0");
 m=o.match(/\b(\d{4}-\d{2}-\d{2})\b/);if(m)return m[1];
 m=o.toLowerCase().match(R_("within NUM (?:business |calendar |working )?days of (?:the )?(?:effective date|signature|signing|execution)"));if(m&&ct&&ct.start)return addD(ct.start,Math.round(nOf(m[1])*(/business|working/.test(m[0])?1.4:1)));return ""}
const METW=[["availability",/availab|uptime/],["Severity 1 response",/sev(?:erity)?\s*(?:1|one)|response time/],["Relevance accuracy",/relevance accuracy|accuracy|precision/],["Query latency",/latency/],["Service credit",/service credit/],["Resolution time",/resolution/],["Recovery objective",/recovery/]];
function normOf(type,o,s,pr,due){const am=o.match(/\$\s?([\d,]+(?:\.\d+)?)/),pc=pctOf(s),bits=[];let val=null,unit="";
 if(am){val=parseFloat(am[1].replace(/,/g,""));unit="USD";bits.push((val<10?"$"+val:D$(val)))}
 if(pc!=null){if(val==null){val=pc;unit="%"}bits.push(pc+"%")}
 const dd=m1(s,R_("NUM (?:business |calendar |working )?days")),hh=m1(s,R_("NUM hours?")),mm=m1(s,/(\d+)\s*minutes/),ms_=m1(s,/(\d+)\s*milliseconds/);
 if(dd!=null){if(val==null){val=dd;unit="days"}bits.push(dd+" days")}if(hh!=null)bits.push(hh+" hours");if(mm!=null)bits.push(mm+" minutes");if(ms_!=null)bits.push(ms_+" ms");
 const mo=m1(s,R_("NUM months?"));if(mo!=null)bits.push(mo+" months");
 const us=m1(s,R_("NUM named users"));if(us!=null)bits.push(us+" named users");
 const nt=s.match(/net\s*(\d+)/);if(nt)bits.unshift("Net "+nt[1]);
 const base=bits.join(" · ");let norm;if(type==="milestone"&&due)norm="Due "+fdt(due);else if(pr&&pr.v)norm=(type==="price"&&am)?base:pr.v+(base&&!/\d/.test(pr.v)?" · "+base:"");else norm=base||(due?"Due "+fdt(due):"Stated");
 return {norm:norm,val:val,unit:unit}}
function keyOf(L){const s=L.src.toLowerCase();if(L.type==="milestone"){const n=s.match(/^milestone (\d+)/);return "ms"+(n?n[1]:L.ref)}
 if(L.pbs&&L.pbs.length)return L.pbs[0]+(L.type==="payment"&&/advance|signature/.test(s)?"-adv":"");
 const ex=Object.values(NTN).find(t=>t.re.test(s));if(ex&&L.m==="new")return ex.id;
 const w=words(s.replace(/\d+/g," ")).filter(x=>x.length>3&&!STOP.has(x)&&!/^(lumen|meridian|beacon|northwind|shall|will|provide|deliver)$/.test(x));return L.type+":"+w.slice(0,2).join("-")}
function analyze(text,ct,doc){ct=ct||{};const out=[];const hasSec=/^\s*\d+\.\s+\S/m.test(text)||/^\s*\d+\.\d+\s/m.test(text);
 const vw=new RegExp("^(?:"+words(ct.vendor||"vendor").filter(w=>w.length>3).concat(["supplier","vendor","contractor","provider"]).join("|")+")\\b");
 let sec="",off=0,n=0,started=!hasSec;
 String(text).replace(/\r/g,"").split("\n").forEach(raw=>{const ln=raw.trim();off+=raw.length+1;if(!ln)return;
  const m=ln.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/);let ref="",body=ln;if(m){ref=m[1];body=m[2]}
  const head=m&&ref.indexOf(".")<0&&body.length<54&&!/[.;:]$/.test(body);
  if(head){sec=ref;started=true;return}
  if(!started||(!m&&/^[A-Z0-9 ,:'().-]{8,}$/.test(ln)))return;
  body.split(/(?<=[.;])\s+(?=[A-Z])/).forEach((o,i)=>{o=o.trim();if(o.length<12)return;n++;
   const s=o.toLowerCase();let type=(TR.find(r=>r[1](s))||["commitment"])[0];
   let party=/^(?:meridian|the foundation|customer)\b/.test(s)?"Meridian":vw.test(s)?"Vendor":null;
   if(!party)party=({deliverable:"Vendor",milestone:"Vendor",sla:"Vendor",kpi:"Vendor",warranty:"Vendor",data:"Vendor",payment:"Meridian",dependency:"Meridian",obl_us:"Meridian"})[type]||"Both";
   if(type==="obligation")type=party==="Meridian"?"obl_us":party==="Vendor"?"obl_vendor":"commitment";
   // playbook match
   const hits=[];PB.forEach(p=>{if(p.types&&p.types.indexOf(type)<0)return;if(p.re.test(s)){const r=p.chk(s);if(r)hits.push({p:p,r:r})}});
   let mt="std",pb="",pr=null,ours="",nt=null,pbs=hits.map(h=>h.p.id),rk=({liability:"High",data:"High",ip:"Medium",term:"Medium",payment:"Medium",warranty:"Medium",price:"Medium",sla:"Medium",change:"Medium"})[type]||"Low",why="",rec="ai",fb=false,trap=false,vend="",rlab="";
   if(hits.length){const h=hits.find(x=>!x.r.ok)||hits[0];pr=h.r;pb=h.p.id;ours=h.p.std;rk=h.p.risk;vend=h.r.v;trap=!!h.r.trap;
    if(h.r.ok){mt="std";why="Meets our standard clause "+h.p.n+": "+h.r.v+(h.r.fbUsed?" (inside the approved fallback)":"")+"."}
    else{mt="var";why=h.r.why;fb=!!h.r.fb;rec=fb?"ai":rk==="High"?"legal":"shared"}}
   else{nt=NEWT.find(t=>t.id!=="NT-GEN"&&t.re.test(s))||((type==="liability"||type==="data")?NTN["NT-GEN"]:null);
    if(nt){mt="new";pb=nt.id;ours=nt.draft;rk=nt.risk;why=nt.why;rec=nt.risk==="High"?"legal":"shared";vend="Not in playbook"}
    else{why="Operational line. The playbook sets no position on it, so the business owner confirms the value."}}
   const due=dateIn(o,ct),nv=normOf(type,o,s,pr,due);
   let metric="",target="";if(type==="sla"||type==="kpi"){metric=(METW.find(w=>w[1].test(s))||["Measure"])[0];const cmp=/at least|no less|minimum|or better|not below/.test(s)?"At least ":/not exceed|no more than|within|maximum|at most/.test(s)?"Within ":"";target=cmp+(nv.norm.replace(/^Stated$/,"")||"")}
   else if(type==="milestone"){metric="Accepted by Meridian";target=due?"By "+fdt(due):""}else if(type==="deliverable"){metric="Accepted by Meridian";target=due?"By "+fdt(due):/review/.test(s)?"":"Review in 10 business days"}else if(type==="payment")metric="Matches accepted work";
   let owner=party==="Meridian"?(type==="payment"?"Avery Chen":ct.owner||"Dev Rao"):party==="Vendor"?(ct.vOwner||ct.vendor||"Vendor"):(ct.owner||"Dev Rao");
   if(/meridian monitoring|measured by meridian/.test(s))owner="Contract Analyst Agent";
   const watch=type==="payment"?"Invoice Advisor":(type==="sla"||type==="kpi"||type==="milestone"||due)?"Contract Analyst Agent":"";
   // suggested links
   const lk={wbs:"",sla:"",inv:"",raid:"",bud:""};
   if(type==="milestone"||type==="deliverable"){const T=(typeof TASKS!=="undefined"&&ct.proj)?TASKS.filter(t=>t.p===ct.proj).map(t=>({t:t,o:ovl(t.n,o)})).sort((a,b)=>b.o-a.o)[0]:null;lk.wbs=T&&T.o>0?T.t.id+" "+T.t.n:"New WBS line"}
   if(type==="sla"||type==="kpi")lk.sla=metric;
   if(type==="payment"||(type==="price"&&nv.unit==="USD")){lk.inv=/milestone (\d)/.test(s)?"Invoice schedule, milestone "+s.match(/milestone (\d)/)[1]:"Invoice schedule";lk.bud=ct.line||"Vendor services"}
   if(type==="assumption"||type==="dependency"||type==="risk"||mt!=="std"){const rr=(typeof window!=="undefined"&&window.PPMRAID&&ct.proj)?window.PPMRAID.filter(x=>x.p===ct.proj).map(x=>({x:x,o:ovl(x.n+" "+x.d,o)})).sort((a,b)=>b.o-a.o)[0]:null;lk.raid=rr&&rr.o>1?rr.x.id:"New RAID item"}
   let conf=.92;if(o.length>230)conf-=.07;const amb=(s.match(/reasonable|as appropriate|best efforts|from time to time|may |substantially|typically/g)||[]).length;conf-=Math.min(.12,amb*.04);if(!TR.some(r=>r[1](s)))conf-=.2;if(nv.norm==="Stated"&&type!=="outcome")conf-=.05;conf+=((hash(o)%7)-3)/100;conf=Math.max(.52,Math.min(.98,conf));
   const L={id:"L"+String(ct.num||"0")+(doc==="proposal"?"P":doc==="contract"?"C":"A")+String(n).padStart(2,"0"),ct:ct.id,doc:doc,ref:(ref||"p"+n)+(i>0?"("+String.fromCharCode(97+i)+")":""),page:1+Math.floor(off/1700),src:o,type:type,norm:nv.norm,val:nv.val,unit:nv.unit,party:party,owner:owner,watch:watch,due:due,measure:metric,target:target,conf:Math.round(conf*100)/100,status:"proposed",lk:lk,m:mt,pb:pb,pbs:pbs,vend:vend,why:why,fb:fb,risk:rk,rec:rec,route:"",trap:trap,routine:!pb,ours:ours,thread:[],by:"AI suggested",lg:false,fbUsed:!!(pr&&pr.fbUsed)};
   L.key=keyOf(L);out.push(L)})});
 return out}
/* word-level redline: strike vendor words not in ours, underline our words not in theirs */
const nw=w=>w.toLowerCase().replace(/[^a-z0-9$%]/g,"");
function diffW(a,b){const A=a.split(/\s+/).filter(Boolean),B=b.split(/\s+/).filter(Boolean),n=A.length,m=B.length;const L=[];for(let i=0;i<=n;i++)L.push(new Uint16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=nw(A[i])===nw(B[j])?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 const o=[];let i=0,j=0;while(i<n&&j<m){if(nw(A[i])===nw(B[j])){o.push(["=",A[i]]);i++;j++}else if(L[i+1][j]>=L[i][j+1]){o.push(["-",A[i++]])}else{o.push(["+",B[j++]])}}while(i<n)o.push(["-",A[i++]]);while(j<m)o.push(["+",B[j++]]);return o}
function redlineHTML(theirs,ours){return diffW(theirs,ours).map(x=>x[0]==="="?esc(x[1]):x[0]==="-"?`<del class="sow-del">${esc(x[1])}</del>`:`<ins class="sow-ins">${esc(x[1])}</ins>`).join(" ")}

RESOLVE.budgetOwner.f=c=>{const r=who(c.for);if(r&&r.kind!=="human")return"Avery Chen";const t=TEAMS.find(x=>r&&x.n===r.team);let b=t?t.mgr:"Avery Chen";if(b===c.for||b==="Chief Editor"||b===c.by)b=b===c.by&&b!==c.for?"Avery Chen":"Avery Chen";return b};
/* ================= software licenses ================= */
const LICB=[
 {id:"SW-001",n:"Microsoft 365 E5",v:"Microsoft",m:"Per user",ent:450,asg:462,un:41,price:684,renew:"2027-06-30",own:"Jordan Lee",life:"Active"},
 {id:"SW-002",n:"Adobe Acrobat Pro",v:"Adobe",m:"Per user",ent:120,asg:131,un:14,price:240,renew:"2027-01-31",own:"Nia Brooks",life:"Active"},
 {id:"SW-003",n:"Microsoft Visio Plan 2",v:"Microsoft",m:"Per user",ent:40,asg:37,un:3,price:180,renew:"2027-06-30",own:"Jordan Lee",life:"Active"},
 {id:"SW-004",n:"Power BI Pro",v:"Microsoft",m:"Per user",ent:85,asg:85,un:6,price:120,renew:"2027-06-30",own:"Dev Rao",life:"Active"},
 {id:"SW-005",n:"Tableau Creator",v:"Tableau",m:"Per user",ent:10,asg:12,un:3,price:900,renew:"2026-12-15",own:"Jordan Lee",life:"Sunset"},
 {id:"SW-006",n:"Figma Full seat",v:"Figma",m:"Per user",ent:15,asg:13,un:1,price:540,renew:"2027-03-01",own:"Maya Ortiz",life:"Active"},
 {id:"SW-007",n:"Adobe InDesign",v:"Adobe",m:"Per user",ent:12,asg:12,un:1,price:624,renew:"2027-01-31",own:"Maya Ortiz",life:"Active"},
 {id:"SW-008",n:"Docker Desktop",v:"Docker",m:"Per user",ent:15,asg:15,un:2,price:110,renew:"2027-04-30",own:"Sam Patel",life:"Active"},
 {id:"SW-009",n:"Claude Team seats",v:"Anthropic",m:"Per seat",ent:60,asg:58,un:5,price:360,renew:"2027-02-28",own:"Jordan Lee",life:"Active"},
 {id:"SW-010",n:"Defender for Endpoint P2",v:"Microsoft",m:"Per device",ent:700,asg:652,un:0,price:60,renew:"2027-06-30",own:"Rina Okafor",life:"Active"},
 {id:"SW-011",n:"Intune Suite",v:"Microsoft",m:"Per device",ent:700,asg:652,un:0,price:48,renew:"2027-06-30",own:"Sam Patel",life:"Active"}];
const LIC=LICB;const LF=()=>SCALE.on?5:1;
const lv=l=>Object.assign({},l,{ent:l.ent*LF(),asg:l.asg*LF(),un:l.un*LF()});
const expo=l=>Math.max(0,l.asg-l.ent)*l.price;
const lstat=l=>l.asg>l.ent?["True-up risk","bad"]:l.asg===l.ent?["At the limit","warn"]:(l.ent-l.asg)/l.ent<.05?["Thin headroom","warn"]:["Compliant","good"];
const RECL=[];
/* ================= hardware assets ================= */
const AST_ST=["Ordered","Received","In stock","Deployed","In repair","Retired","Decommissioned"];
const ASSETS=[];window.SVC_ASSETS=ASSETS;
const AMOD={Laptop:[["Dell Latitude 7450 14\"",1840],["Dell Precision 5690",2650],["Dell Precision 5860",3380],["MacBook Pro 16\"",2899],["Dell Latitude 7430 14\"",1640]],Phone:[["iPhone 16",829],["iPhone 16 Pro",1099],["Galaxy S25",799],["Teams desk phone",260]],Monitor:[["Dell UltraSharp 27\"",420],["Dell UltraSharp 32\"",640]],Dock:[["Dell WD22TB4 dock",210]],Network:[["Cisco Catalyst 9300",8900],["Aruba AP-635",1200]],AV:[["Poly Studio X70",4200],["Teams Room kit",5400]]};
const ABASE=[
 ["MSF-10231","Laptop",'Dell Latitude 7430 14"',"Deployed","Priya Shah",1640,"2022-11-14","Parker HQ"],["MSF-10208","Laptop",'Dell Latitude 7430 14"',"Retired","",1640,"2022-09-02","Parker HQ stockroom"],["MSF-10412","Laptop",'Dell Latitude 7450 14"',"In stock","",1840,"2026-08-20","Parker HQ stockroom"],["MSF-10377","Laptop",'MacBook Pro 16"',"Deployed","Jordan Lee",2899,"2024-02-06","Parker HQ"],["MSF-10390","Laptop","Dell Precision 5680","Deployed","Dev Rao",3240,"2024-05-21","Remote"],["MSF-10455","Laptop",'Dell Latitude 7450 14"',"Deployed","Tom Becker",1840,"2025-03-11","Parker HQ"],["MSF-10488","Laptop",'Dell Latitude 7450 14"',"In repair","Nia Brooks",1840,"2025-06-30","Vendor depot"],["MSF-10461","Monitor",'Dell UltraSharp 27"',"Deployed","Maya Ortiz",520,"2024-09-10","Parker HQ"],["MSF-10470","Phone","iPhone 15","Deployed","Maya Ortiz",829,"2024-01-15","Mobile"],["MSF-10102","Network","Cisco Catalyst 9300","Deployed","Sam Patel",8900,"2021-11-30","Parker HQ, 2nd floor"],["MSF-10103","AV","Poly Studio X70","Deployed","Nia Brooks",4200,"2023-04-18","Boardroom"],["MSF-10499","Laptop",'Dell Latitude 7450 14" (3 on order)',"Ordered","",5520,"2026-10-02","Vendor"]];
const WAR_Y={Laptop:3,Phone:2,Monitor:3,Dock:3,Network:5,AV:3};
let AST_SEQ=10600;
const hsh=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
function mkAsset(o){const y=WAR_Y[o.cls]||3;const bought=typeof o.bought==="number"?o.bought:ms(o.bought);return Object.assign({serial:"MSF"+(hsh(o.id)%90000000+10000000).toString(36).toUpperCase(),who:"",loc:"Parker HQ",intune:o.cls==="Laptop"||o.cls==="Phone"?hsh(o.id)%100<96:null,req:"",ci:"",war:bought+y*365*DAY,bought:bought},o,{bought:bought,war:o.war||bought+y*365*DAY})}
function buildAssets(){ASSETS.length=0;ABASE.forEach(a=>ASSETS.push(mkAsset({id:a[0],cls:a[1],model:a[2],st:a[3],who:a[4],cost:a[5],bought:a[6],loc:a[7],war:a[1]==="Phone"&&a[0]==="MSF-10470"?ms("2026-12-15"):a[0]==="MSF-10102"?ms("2026-11-30"):a[0]==="MSF-10103"?ms("2026-10-31"):undefined})));
 REQS.forEach(r=>{if(r.item!=="laptop"&&r.item!=="phone"&&r.item!=="onboarding")return;const cls=r.item==="phone"?"Phone":"Laptop";const mods=AMOD[cls];const mname=(r.vals&&(r.vals.model||r.vals.laptop))||"";const m=mods.find(x=>x[0].includes(String(mname).split(" ")[0]))||mods[0];
  const s6=r.ts["s6"]||r.ts["sub1.s6"];const id="MSF-"+(AST_SEQ++);
  if(r.state==="deployed"||r.state==="decommissioned"){ASSETS.push(mkAsset({id,cls,model:m[0],st:r.state==="deployed"?"Deployed":"Decommissioned",who:r.state==="deployed"?(r.item==="onboarding"?r.requester:r.for):"",cost:m[1],bought:s6?s6.s:r.created,loc:/Home/.test((r.vals||{}).deliver||"")?"Remote":"Parker HQ",req:r.id}))}
  else if(r.state==="fulfilling"&&s6){const rcv=!!s6.e;ASSETS.push(mkAsset({id,cls,model:m[0],st:rcv?"Received":"Ordered",who:"",cost:m[1],bought:s6.s,loc:rcv?"Parker HQ dock":"Vendor",req:r.id}))}});
 const target=SCALE.on?3100:140,r0=RNG("assets"+(SCALE.on?"s":"d"));const P=poolPeople();
 const mix=[["Laptop",.5],["Phone",.18],["Monitor",.14],["Dock",.1],["Network",.04],["AV",.04]],stm=[["Deployed",.6],["In stock",.09],["Ordered",.03],["Received",.02],["In repair",.03],["Retired",.09],["Decommissioned",.14]];
 while(ASSETS.length<target){const cls=(()=>{let x=r0();for(const m of mix){x-=m[1];if(x<=0)return m[0]}return"Laptop"})();const st=(()=>{let x=r0();for(const m of stm){x-=m[1];if(x<=0)return m[0]}return"Deployed"})();const md=pick(r0,AMOD[cls]);
  const id="MSF-"+(AST_SEQ++);const bought=NOW-Math.floor(30+r0()*1400)*DAY;
  const p=st==="Deployed"||st==="In repair"?pick(r0,P).name:"";
  ASSETS.push(mkAsset({id,cls,model:md[0],st,who:p,cost:md[1],bought:bought,loc:pick(r0,["Parker HQ","Parker HQ","Remote","Parker HQ stockroom","Mobile","Vendor depot"].slice(0,st==="Deployed"?3:6)),req:""}))}}
function assetHook(r,s){if(s.hook==="asset"){const cls=r.item==="phone"?"Phone":"Laptop",m=AMOD[cls][0];if(!ASSETS.some(a=>a.req===r.id)){ASSETS.unshift(mkAsset({id:"MSF-"+(AST_SEQ++),cls,model:m[0],st:"Received",cost:m[1],bought:NOW,loc:"Parker HQ dock",req:r.id}));audit("asset created",r.id)}}
 if(s.hook==="decom"){ASSETS.filter(a=>a.who===(r.vals.who||r.for)&&a.st==="Deployed").forEach(a=>{a.st="Decommissioned";a.who="";a.dec=NOW;a.req=a.req||r.id})}}

/* ================= engine actions ================= */
const log=(r,tx,by)=>{(r.log=r.log||[]).push({t:NOW,tx,by:by||PERSONAS[S.persona].n})};
function advance(r){const it=ITEM(r.item),tpl=tplOf(it.flow),sk=new Set(r.sk);let ch=true,g=0;const isDone=id=>sk.has(id)||(r.ts[id]&&r.ts[id].e);
 while(ch&&g++<80){ch=false;if(r.rej||r.cancelled)break;
  tpl.forEach(s=>{if(sk.has(s.id))return;const t=r.ts[s.id];
   if(s.type==="sub"){const c2=allKids(tpl,s.id).filter(k=>!sk.has(k.id));if(!t&&(c2.some(k=>r.ts[k.id])||!c2.length&&s.p.every(isDone))){r.ts[s.id]={s:NOW};ch=true}
    const t3=r.ts[s.id];if(t3&&!t3.e&&c2.every(k=>r.ts[k.id]&&r.ts[k.id].e)){t3.e=NOW;ch=true}return}
   if(!t){if(s.p.every(isDone)){if(r.startAt&&r.startAt>NOW&&s.type!=="gate"&&s.id!=="s1")return;r.ts[s.id]={s:NOW};ch=true}}
   const t2=r.ts[s.id];if(t2&&!t2.e&&(s.type==="auto"||s.type==="agent")){t2.e=NOW;t2.by=s.type==="agent"?s.owner:"Oukala automation";ch=true;if(s.hook)assetHook(r,s)}})}
 touch(r);REQV++}
const stepOf=(r,id)=>tplOf(ITEM(r.item).flow).find(s=>s.id===id);
function approve(r,apId,note){const s=tplOf(ITEM(r.item).flow).find(x=>x.ap===apId&&!x.sg),a=r.ap[apId];if(!s||!a||a.st!=="pending")return false;a.st="approved";a.at=NOW;a.note=note||a.note;a.fta=true;const t=r.ts[s.id]||(r.ts[s.id]={s:NOW});t.e=NOW;t.by=a.who;log(r,a.who+" approved: "+stepName(ITEM(r.item),s)+(note?" ("+note+")":""),a.who);audit("approved",r.id+" "+apId);advance(r);return true}
function reject(r,apId,why){const s=tplOf(ITEM(r.item).flow).find(x=>x.ap===apId&&!x.sg),a=r.ap[apId];if(!s||!a)return false;a.st="rejected";a.at=NOW;a.note=why||"";r.rej={at:NOW,by:a.who,rule:apId};Object.keys(r.ap).forEach(k=>{if(r.ap[k].st==="pending")r.ap[k].st="cancelled"});tplOf(ITEM(r.item).flow).forEach(x=>{const t=r.ts[x.id];if(t&&!t.e)delete r.ts[x.id]});log(r,a.who+" rejected"+(why?": "+why:""),a.who);audit("rejected",r.id);touch(r);REQV++;return true}
function completeStep(r,id,by){const t=r.ts[id],s=stepOf(r,id);if(!t||t.e||!s)return false;t.e=NOW;t.by=by||(r.as[id]&&r.as[id].p)||s.owner||s.team;log(r,"Completed: "+s.n,t.by);if(s.hook)assetHook(r,s);audit("completed step",r.id+" "+s.n);advance(r);return true}
function assignTeam(r,id,team){const s=stepOf(r,id);r.as[id]={t:team,p:"",why:""};log(r,"Step '"+s.n+"' assigned to team "+team);audit("assigned to team",r.id+" "+team);touch(r);REQV++}
function claimStep(r,id,person,reason){const s=stepOf(r,id),a=r.as[id]||(r.as[id]={t:s.team,p:"",why:""});a.p=person;a.why=reason||"Claimed from the "+a.t+" queue";log(r,person+(reason?" assigned (reason: "+reason+")":" claimed")+" '"+s.n+"'",person);audit(reason?"assigned person":"claimed",r.id+" "+person);touch(r);REQV++}
function cancelReq(r,why){r.rej={at:NOW,by:PERSONAS[S.persona].n,rule:"cancel"};r.cancelled=true;Object.keys(r.ap).forEach(k=>{if(r.ap[k].st==="pending")r.ap[k].st="cancelled"});tplOf(ITEM(r.item).flow).forEach(x=>{const t=r.ts[x.id];if(t&&!t.e)delete r.ts[x.id]});log(r,"Cancelled"+(why?": "+why:""));audit("cancelled request",r.id);touch(r);REQV++}
function expedite(r){r.startAt=0;r.exp=1;log(r,"Expedited: scheduled start released");audit("expedited",r.id);advance(r)}
function addTask(r,t){(r.tasks=r.tasks||[]).push(Object.assign({id:"T"+(r.tasks.length+1),st:"Open",at:NOW},t));log(r,"Task added: "+t.t+" ("+t.team+")");audit("added task",r.id+" "+t.t);REQV++}
function decomReq(r){r.decom=NOW;ASSETS.filter(a=>a.req===r.id).forEach(a=>{a.st="Decommissioned";a.who="";a.dec=NOW});log(r,"Decommissioned");audit("decommissioned",r.id);touch(r);REQV++}
function createReq(it,vals,by,fw,extra){const {ctx,list}=apprFor(it,vals,fw,by),tpl=tplOf(it.flow),sk=skipSet(it,null,ctx,list);
 const r=Object.assign({id:"RITM00"+(reqSeq++),req:"REQ00"+(10100+Math.floor(reqSeq/1.3)),item:it.id,flow:it.flow,service:it.svc,offering:it.off,requester:by,onBehalfOf:fw!==by?fw:null,for:fw,vals:Object.assign({},vals),sk,ap:{},ts:{s1:{s:NOW,e:NOW,by:"Oukala portal"}},as:{},cm:[],tasks:[],price:ctx.price,created:NOW,pr:3,delayH:0,ctxs:{tier:ctx.tier,region:ctx.region,worker:ctx.worker,level:ctx.level},xla:null,log:[{t:NOW,tx:"Submitted by "+by+(fw!==by?" on behalf of "+fw:""),by}]},extra||{});
 list.forEach(a=>{if(a.trig&&!a.dup)r.ap[a.id]={who:a.who,st:"pending",note:a.note||""}});
 if(ctx.expedite&&it.id==="onboarding")r.exp=1;
 REQS.unshift(r);advance(r);const ap=Object.values(r.ap);log(r,ap.length?"Approvals requested from "+uniq(ap.map(a=>a.who)).join(", "):"No approval needed. Sent to fulfillment.");if(r.state==="approved"&&!ap.length){}audit("created request",r.id+" "+it.n);ap.forEach(a=>{try{NOTI("e4",a.who,r)}catch(x){}});REQV++;return r}

/* ================= seeded requests (fixed narrative) ================= */
const DEVVALS={reason:"Replacement, end of life",model:"Developer 16-inch",memory:"Add 16 GB",monitor:true,dock:false,oldtag:"MSF-10231",deliver:"Parker HQ desk",provision:"Zero touch (Autopilot)",just:"Large Gantt models in the PPM workspace need 32 GB of memory.",apps:["Microsoft 365 apps","Power BI Desktop"]};
const SEEDS=[
 ["laptop","pending",{id:"RITM0010441",req:"REQ0010188",by:"Priya Shah",vals:DEVVALS,hold:["A2"],frac:.5}],
 ["report","fulfilling",{id:"RITM0010437",req:"REQ0010185",by:"Priya Shah",vals:{domain:"Service delivery",title:"Milestone slippage by vendor",aud:"Portfolio steering group",freq:"Monthly",due:"2026-10-23",pii:false},frac:.55}],
 ["software","deployed",{id:"RITM0010419",req:"REQ0010171",by:"Priya Shah",vals:{title:"Microsoft Visio Plan 2",device:"Windows laptop",term:"Permanent",why:"Dependency diagrams for the Lumen indexer plan."},ageDays:13}],
 ["onboarding","fulfilling",{id:"RITM0010432",req:"REQ0010180",by:"Dev Rao",vals:{name:"Rosa Delgado",start:"2026-10-19",mgr:"Dev Rao",worker:"Employee",family:"Standards editor",loc:"Parker HQ",laptop:"Standard 14-inch",monitor:true,phone:false,tier:"Standard",repo:true,training:["Security awareness","Confidentiality"],badge:true,buddy:"Priya Shah"},frac:.42}],
 ["software","pending",{id:"RITM0010443",req:"REQ0010190",by:"Jordan Lee",vals:{title:"Tableau Creator",device:"Windows laptop",why:"Prototype the lease analytics for the CFO review.",term:"90 days"},hold:["A2","A3"]}],
 ["av","fulfilling",{id:"RITM0010445",req:"REQ0010192",by:"Maya Ortiz",vals:{room:"Boardroom",date:"2026-10-14",slot:"09:00",kind:["Hybrid meeting","Recording"],guests:18},frac:.2}],
 ["laptop","pending",{id:"RITM0010450",req:"REQ0010196",by:"Maya Ortiz",for:"Hana Koval",vals:{reason:"New hire",model:"Developer 16-inch",memory:"As shipped",monitor:true,deliver:"Home (remote)",addr:"Vinohradska 42, Prague 3",provision:"Zero touch (Autopilot)",just:"Taxonomy builds need 32 GB; she starts on the Lumen SOW-4 extension.",apps:["Microsoft 365 apps"]},hold:["A5"]}],
 ["laptop","deployed",{id:"RITM0010425",req:"REQ0010174",by:"Sam Patel",vals:{reason:"Replacement, end of life",model:"Developer 16-inch",memory:"As shipped",monitor:false,oldtag:"MSF-10208",deliver:"Parker HQ desk",provision:"Prepared by IT",just:"Builds on the Standards Platform run out of memory."},ageDays:3}],
 ["laptop","decommissioned",{id:"RITM0010102",req:"REQ0010098",by:"Priya Shah",vals:{reason:"New hire",model:"Standard 14-inch",deliver:"Parker HQ desk",provision:"Zero touch (Autopilot)"},ageDays:1320,decomDays:30}],
 ["aiaccess","pending",{id:"RITM0010452",req:"REQ0010197",by:"Avery Chen",vals:{kind:"Raise Claude token limit",agent:"Invoice Advisor",cur:20,tokens:60,dclass:"Restricted",auto:"Propose then approve",why:"Quarter-end invoice volume doubled. The agent reaches its limit on day 18 and pauses."},hold:["A3","A4"]}],
 ["offboarding","approved",{id:"RITM0010455",req:"REQ0010199",by:"Priya Shah",vals:{who:"Elise Park",last:"2026-12-18",reason:"End of contract",hold:false,handoff:"Priya Shah",device:"Prepaid shipping box",access:"End of last day"},delayH:240}],
 ["software","rejected",{id:"RITM0010399",req:"REQ0010161",by:"Nia Brooks",vals:{title:"Wireshark",device:"Windows laptop",why:"Look at packet loss on the 2nd-floor switch."}}],
 ["project","pending",{id:"RITM0010458",req:"REQ0010201",by:"Dev Rao",vals:{title:"Lumen search relevance phase 2",problem:"Editors cannot find superseded standards; relevance tuning is manual.",obj:"Modernize standards publishing",svcs:["Search and indexing"],cost:180000,dur:9,hours:900,benefit:310000,sponsor:"Maya Ortiz",vendor:true,data:"Internal",ai:true},hold:["A2","A6"]}],
 ["apikey","fulfilling",{id:"RITM0010460",req:"REQ0010203",by:"Jordan Lee",vals:{api:"Taxonomy API",env:"Production",scope:["read","write"],rate:1200,exp:"90 days",app:"Taxonomy sync job"},frac:.6}],
 ["access","deployed",{id:"RITM0010428",req:"REQ0010176",by:"Dev Rao",vals:{system:"Contract Repository",role:"Contributor",scope:["Standards licensing"],dur:"Permanent"},ageDays:9}],
 ["phone","fulfilling",{id:"RITM0010462",req:"REQ0010205",by:"Maya Ortiz",vals:{reason:"Replacement, end of life",model:"iPhone 16 Pro",case:true,plan:"International roaming",port:false,trips:["United Kingdom","Czechia"]},frac:.4}],
 ["move","approved",{id:"RITM0010464",req:"REQ0010207",by:"Tom Becker",vals:{who:"Nia Brooks",eff:"2026-11-02",team:"Security",newmgr:"Rina Okafor",loc:"Same",keep:false,tier:"Elevated",cc:true},delayH:150}],
 ["newsvc","pending",{id:"RITM0010466",req:"REQ0010209",by:"Maya Ortiz",vals:{sname:"Digital signatures",owner:"Avery Chen",tier:"Tier 2",users:120,offs:"Sign documents\nTemplates and bulk send",tbm:"Applications",cost:64000,deps:["Identity (Entra ID)","Contract Repository"]},hold:["A2"]}],
 ["vendor","fulfilling",{id:"RITM0010468",req:"REQ0010211",by:"Avery Chen",vals:{vname:"Meridian Translate GmbH",country:"Germany",kind:"Professional services",spend:140000,data:true,ai:false},frac:.5}],
 ["mailbox","deployed",{id:"RITM0010470",req:"REQ0010213",by:"Tom Becker",vals:{kind:"Shared mailbox",name:"standards-support",owners:"Tom Becker",guest:false},ageDays:5}]];
const BULKN=()=>SCALE.on?6400:240;
const ITW=()=>CAT.map(c=>[c.id,c.pop]);
const STW=[["deployed",.55],["fulfilling",.2],["pending",.09],["approved",.05],["decommissioned",.07],["rejected",.04]];
const DECOK=["laptop","phone","software","access","apikey","mailbox","aiaccess","onboarding"];
function buildReqs(){REQS.length=0;reqSeq=10500;
 SEEDS.forEach(s=>{try{const o=Object.assign({},s[2]);if(!o.vals.who&&false){}const r=mk(s[0],s[1],o);if(o.hold){const it=ITEM(r.item),tp=tplOf(it.flow),off=null;tp.filter(x=>x.type==="gate").forEach(g=>{const a=r.ap[g.ap];if(!a||r.sk.includes(g.id))return;const t=r.ts[g.id]||(r.ts[g.id]={s:r.created+HR});if(o.hold.includes(g.ap)){delete t.e;delete t.by;a.st="pending";delete a.at}else{t.e=Math.min(NOW-HR/2,t.s+3*HR);t.by=a.who;a.st="approved";a.at=t.e}});tp.forEach(x=>{if(x.type!=="gate"&&x.id!=="s1"&&r.ts[x.id])delete r.ts[x.id]});touch(r)}
  if(s[2].delayH){r.delayH=s[2].delayH;touch(r)}REQS.push(r)}catch(e){console.error("seed failed",s[0],e)}});
 const rr=RNG("bulk"+(SCALE.on?"s":"d")),n=BULKN()-REQS.length,iw=ITW(),tw=sum(iw,x=>x[1]);
 for(let i=0;i<n;i++){let x=rr()*tw,id="laptop";for(const w of iw){x-=w[1];if(x<=0){id=w[0];break}}let y=rr(),st="deployed";for(const w of STW){y-=w[1];if(y<=0){st=w[0];break}}if(st==="decommissioned"&&!DECOK.includes(id))st="deployed";
  try{REQS.push(mk(id,st,{}))}catch(e){if(i<2)console.error("bulk failed",id,st,e)}}
 REQS.sort((a,b)=>b.created-a.created);REQV++;buildAssets();bulkOn=!!SCALE.on}
const ensure=()=>{if(bulkOn!==!!SCALE.on)buildReqs()};
(function(){const o=SCALE.set;SCALE.set=function(on){this.on=!!on;try{buildReqs();try{agg();astAgg()}catch(x){}}catch(e){console.error(e)}return o.apply(this,arguments)}})();
/* service levels are calibrated once from simulated deliveries so every item's SLA is reachable and the on-time rate is realistic */
function calibrate(){const KEEP=["onboarding","offboarding","project","newsvc"];CAT.forEach(it=>{if(it._cal)return;const su=[],cy=[];for(let i=0;i<30;i++){try{const r=mk(it.id,"deployed",{id:"CAL"+i});su.push(r.slaUsed);cy.push(r.cycle)}catch(e){}}
 su.sort((a,b)=>a-b);cy.sort((a,b)=>a-b);if(su.length>=10){it.slaH=Math.max(4,Math.round(su[Math.floor(su.length*.9)]*1.03));if(!KEEP.includes(it.id)){const bd=Math.max(1,Math.round(cy[Math.floor(cy.length/2)]/24*5/7));it.est=bd+" business day"+(bd>1?"s":"")}}it._cal=1})}
calibrate();
buildReqs();
const RQ=id=>REQS.find(r=>r.id===id);

/* ============ SOW and contract analyzer (prefix sow) ============
   Screen ppm_sow. Repository of proposals and executed contracts, AI line-by-line analysis, terms playbook,
   proposal vs contract compare, change control, obligations and calendar. */
(function(){
S.sow=S.sow||{ct:"CLM-1002",doc:"proposal",scope:"doc",cmp:"CLM-1001",run:null,line:null,crSel:null,oSel:null,more:{},rq:"all",pbq:""};
const SW=S.sow;
/* ---------- dates ---------- */
const TDY=window.U.TODAY_ISO,DMS=864e5,t0=iso=>Date.parse(iso+"T00:00:00Z");
const addD=(iso,n)=>new Date(t0(iso)+n*DMS).toISOString().slice(0,10);
const difD=(a,b)=>Math.round((t0(a)-t0(b))/DMS);
const fdt=(iso,noy)=>iso?new Date(t0(iso)).toLocaleDateString("en-US",Object.assign({month:"short",day:"numeric",timeZone:"UTC"},noy?{}:{year:"numeric"})):"None";
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONF={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const D$=n=>"$"+Math.round(Math.abs(n)).toLocaleString("en-US");
const S$=n=>(n<0?"-":n>0?"+":"")+D$(n);
const pct1=n=>(Math.round(n*10)/10)+"%";
const sum=(a,f)=>a.reduce((x,y)=>x+(f?f(y):y),0);
const hash=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
const ID=(p)=>p+Math.random().toString(36).slice(2,7);
/* ---------- numbers in words ---------- */
const W2N={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,twelve:12,fifteen:15,twenty:20,thirty:30,sixty:60,ninety:90,"forty-five":45};
const NUMW="(\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty-five|sixty|ninety)";
const nOf=x=>{x=String(x).toLowerCase();return W2N[x]!=null?W2N[x]:parseFloat(x.replace(/,/g,""))};
const m1=(s,re)=>{const m=s.match(re);return m?nOf(m[1]):null};
const R_=(src)=>new RegExp(src.replace(/NUM/g,NUMW));
const pctOf=s=>m1(s,/(\d+(?:\.\d+)?)\s*(?:percent|%)/);
/* ---------- people used here ---------- */
const LEGAL="Meridian Legal";
const TIERS=[{id:"T1",max:10000,role:"Budget owner",who:"Maya Ortiz"},{id:"T2",max:25000,role:"Portfolio lead",who:"Maya Ortiz"},{id:"T3",max:100000,role:"CIO",who:"Casey Rowan"},{id:"T4",max:250000,role:"CFO",who:"CFO"},{id:"T5",max:1000000,role:"CEO",who:"CEO"},{id:"T6",max:Infinity,role:"Board finance committee",who:"Board finance committee"}];
const tierOf=amt=>TIERS.find(t=>Math.abs(amt)<=t.max)||TIERS[5];
const chainFor=amt=>{const t=tierOf(amt),out=[{r:"Contract owner",who:null,why:"Confirms the business need"},{r:LEGAL,who:null,why:"Reviews any change to legal terms"}];if(Math.abs(amt)>10000)out.push({r:"Controller",who:"Avery Chen",why:"Orders above $10,000 need finance review"});out.push({r:t.role,who:t.who,why:"Delegation of authority "+t.id+" covers up to "+(t.max===Infinity?"any amount":D$(t.max))});return out};

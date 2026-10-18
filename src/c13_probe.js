const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('file://'+path.resolve('out_c13/full.html'));await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const L=PROCLIB.list();const out={n:L.length,keys:Object.keys(L[0]),sample:L[0]};
const by={};let dp=0,wp=0;const dist={};L.forEach(x=>{const g=PROCLIB.get(x.id);const st=g.stepsList;st.forEach(s=>{dist[s.who]=(dist[s.who]||0)+1});const d=st.filter(s=>s.who==="gate");if(d.length){wp++;dp+=d.length}});
out.withGate=wp;out.gates=dp;out.who=dist;out.oneProc=PROCLIB.get(L[3].id);out.orgx=!!window.ORGX;out.dmn=(window.FLOWX&&Object.keys(FLOWX)).slice(0,40);return out});
console.log(JSON.stringify(r,null,1).slice(0,3500));console.log(errs);process.exit(0)})();

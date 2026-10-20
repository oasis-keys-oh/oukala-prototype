const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.argv[2]+'/full.html');await p.waitForTimeout(800);
const t0=Date.now();
const r=await p.evaluate(()=>{const t=performance.now();go('plat_map');const ms=performance.now()-t;const M=MODMAP;return {ms,mods:M.modules.length,flows:M.flows.length,dropped:M.dropped,stats:(({n,nf,pp,ct,live,reg})=>({n,nf,pp,ct,live,reg}))(M.stats()),fnd:Object.fromEntries(Object.entries(M.stats().fnd).map(([k,v])=>[k,Array.isArray(v)?v.map(x=>x.id):v])),noFlow:M.modules.filter(m=>!m.nout||!m.nin).map(m=>m.id)}});
console.log(JSON.stringify(r,null,1));console.log('errs',errs.slice(0,8));await b.close()})();

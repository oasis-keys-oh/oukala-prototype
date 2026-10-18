const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve('scr/base.html'));await p.waitForTimeout(800);
const r=await p.evaluate(()=>{
 const sh=(o,d=0)=>{if(o==null)return String(o);if(typeof o==='function')return 'fn';if(Array.isArray(o))return 'arr['+o.length+']'+(o.length&&d<1?'<'+sh(o[0],d+1)+'>':'');if(typeof o==='object'){const k=Object.keys(o);return d<1?'{'+k.slice(0,25).map(x=>x+':'+sh(o[x],d+1)).join(', ')+'}':'obj['+k.length+']'}return typeof o==='string'?JSON.stringify(o.slice(0,40)):String(o)};
 const out={};
 for(const n of ['ATLAS','MODMAP','PROCLIB','PROC','ORGX','OWNX','MCPX','CONTRACT','DATAMODEL','INBOX','APPROVALS','NOTIF','WF','WORKFLOWS','DEC','DECX','LINKS','PLAT','RAID','FIN','MAT','SEARCHX','ASKX','DEBT','GATE','NODES','SVCREG','CIREG','DIR','PROJ','TASKS','MEETINGS','INVOICES','DEMAND','TBM','MEET','FLOWX','EVT','EVENTS','BUS','REGISTRY','REG']) {try{out[n]=sh(window[n]||eval('typeof '+n+'!=="undefined"?'+n+':undefined'))}catch(e){out[n]='ERR '+e.message}}
 out.screens=Object.keys(window.SCREENS||{}).length;
 return out});
for(const k in r)console.log(k,'=',r[k]);console.log(errs);await b.close()})();

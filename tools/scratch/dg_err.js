const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:900}});p.on('pageerror',e=>console.log('ERR',e.message,(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text())});
await p.goto('file://'+path.resolve(process.argv[2],'full.html'));await p.waitForTimeout(500);
for(const [sc,v,n] of [['plat_debt','debt',6],['plat_gate','gate',7],['plat_mcp','mcp',6]]){for(let i=0;i<n;i++){await p.evaluate(([s,v,i])=>{go(s);S.v[v]=i;render()},[sc,v,i]);await p.waitForTimeout(150);console.log(sc,i,'ok')}}
await p.close();await b.close()})();

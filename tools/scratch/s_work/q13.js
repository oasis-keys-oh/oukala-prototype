 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 const c=FAB.connectors;o.cn=c.length;o.c0=sh(c[0],500);o.cnames=sh(c.map(x=>x.n||x.name||x.id),900);
 const k={};c.forEach(x=>{k[x.type||x.kind||x.cat]=(k[x.type||x.kind||x.cat]||0)+1});o.ctypes=sh(k);
 o.limits=sh(FAB.limits&&FAB.limits(),400);o.fresh=sh(FAB.freshness&&FAB.freshness(),600);o.edition=sh(FAB.edition&&FAB.edition());
 o.runs=sh(FAB.runs&&FAB.runs.length);o.q=sh(FAB.quarantine&&FAB.quarantine.length);
 o.src=sh(R16M.sources&&typeof R16M.sources);
 o.ntfN=sh(Object.keys(S).filter(k=>/ntf|notif/i.test(k)));
 o.ntfS=sh(S.r16i&&Object.keys(S.r16i));
 try{const reg=R16I.store&&R16I.store;o.store=sh(Object.keys(reg))}catch(e){}
 o.R15E=sh(Object.keys(R15E));
 return o;

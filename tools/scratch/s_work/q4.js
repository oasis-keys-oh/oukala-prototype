 const o={};const sh=(x,n=1800)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.RULES=sh(R16M.ov.RULES.map(r=>r.id+': '+(r.n||r.t||r.label)),2000);
 o.protected=sh(R16M.ov.protected&&(typeof R16M.ov.protected==='function'?'fn':R16M.ov.protected),600);
 o.OEstate=sh(R16M.OE.status,300);
 o.ovtext=sh(R16M.ov.opText&&String(R16M.ov.opText).slice(0,500));
 o.grp0=sh((typeof R16M.groups==='function'?R16M.groups():R16M.groups)[0],700);
 o.tenant=sh(typeof R16M.tenant==='function'?R16M.tenant():R16M.tenant,500);
 return o;

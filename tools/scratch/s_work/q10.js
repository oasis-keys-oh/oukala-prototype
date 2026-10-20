 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.rev=sh(S.adm.rev&&{n:(S.adm.rev.items||S.adm.rev.rows||[]).length,keys:Object.keys(S.adm.rev)},600);
 o.sodN=sh(Object.keys(S.r15i));
 o.grants=S.r15i.grants.length;o.reqs=S.r15i.reqs.length;
 o.masking=sh(PERM.maskValue&&String(PERM.maskValue).slice(0,300));
 o.revealEv=sh(EVENTS.catalog&&0);
 return o;

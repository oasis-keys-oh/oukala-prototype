 const o={};const sh=(x,n=700)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.guidesT=typeof R16M.guides; o.guidesKeys=sh(Object.keys(R16M.guides||{}));
 o.OEkeys=sh(Object.keys(R16M.OE||{}));o.ovKeys=sh(Object.keys(R16M.ov||{}));
 o.groups=sh((typeof R16M.groups==='function'?R16M.groups():R16M.groups).map?.(g=>g.id+':'+g.n+':'+(g.members||[]).length),1500);
 o.EDITIONS=sh(R16M.EDITIONS,900);o.DEPLOY=sh(R16M.DEPLOY,900);o.STEPS=sh(R16M.STEPS,900);o.TPL=sh(Object.keys(R16M.TPL||{}),600);
 o.tenants=sh(R16M.tenants,400);o.ENTS=sh(R16M.ENTS&&Object.keys(R16M.ENTS),500);
 return o;

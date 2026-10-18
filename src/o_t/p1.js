(()=>{const o={};
o.procKeys=Object.keys(PROCLIB).join(",");
const l=PROCLIB.list();o.n=l.length;o.sample=l[0];
o.owners=[...new Set(l.map(p=>p.owner))].slice(0,40);
o.metOwners=[...new Set(Object.values(METRICS).map(m=>m.owner))].slice(0,60);
o.metN=Object.keys(METRICS).length;
o.getKeys=Object.keys(PROCLIB.get(l[0].id));
o.mat=PROCLIB.maturity(l[0].id);
o.modmap=Object.keys(MODMAP).join(",");
o.mod=MODMAP.modules.find(m=>m.id==="ppl_org");
o.bands=MODMAP.bands;
o.platKeys=Object.keys(PLAT).join(",");
return o})()

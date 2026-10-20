(()=>{const o={};o.ents=PLAT.entities().map(e=>e.id).join(' ');o.lin=Object.keys(LIN);o.atl=Object.keys(ATLAS);o.kcs=KCSX.items().slice(0,1);o.kcsn=KCSX.items().length;o.kcstypes=KCSX.TYPES;
const t=LIN.all().find(x=>x.status==='none');o.trace=t;o.ovr=Object.keys(S.atlas.ovr||{}).length;o.ovr1=Object.entries(S.atlas.ovr||{}).slice(0,1);
o.team=PLAT.ent('person').fields.filter(f=>f.type==='ref');o.ents2=Object.keys(DATAMODEL);o.dm=DATAMODEL.register?DATAMODEL.register.toString().slice(0,600):'';
return o})()

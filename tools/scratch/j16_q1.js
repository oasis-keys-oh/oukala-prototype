(()=>{const o={};const g=(k,f)=>{try{o[k]=f()}catch(e){o[k]='ERR '+e.message}};
g('PROJ',()=>PROJ.map(p=>p.id+':'+(p.short||p.n)).join(','));
g('PROJkeys',()=>Object.keys(PROJ[0]).join(','));
g('UPROJ',()=>UPROJ().length);g('SCALEproj',()=>SCALE.projects().length+' '+JSON.stringify(SCALE.projects()[0]));
g('DEMAND',()=>DEMAND.length+' '+DEMAND.slice(0,3).map(d=>d.id));
g('DIR',()=>DIR.length+' '+Object.keys(DIR[0]).join(','));g('PEOPLE',()=>PEOPLE.length);
g('SVCREG',()=>SVCREG.length+' '+Object.keys(SVCREG[0]).join(','));
g('VEND',()=>typeof VENDORS!=='undefined'?VENDORS.length:'none');
g('globals',()=>Object.keys(window).filter(k=>/^(VEND|CC|TEAM|ENT|ORG|LISTS|REGISTRY|DATAMODEL|ATLAS|METRICS|PROCLIB|PROC|STORE|GUARD|PERM|EVENTS|ORGX|CCMAP|SEM|REPORT|RPT|DASH|LAYOUT)/i.test(k)).join(','));
g('N',()=>JSON.stringify(['I2','I1','INC1','B2','PR1','R1'].map(i=>N(i).n)));
g('allProjN',()=>typeof allProj);
g('dm',()=>Object.keys(DATAMODEL).join(',')+' tables:'+Object.keys(DATAMODEL.tables).length);
g('atlas',()=>Object.keys(ATLAS).join(','));
g('metrics',()=>Object.keys(METRICS).length);
return o})()

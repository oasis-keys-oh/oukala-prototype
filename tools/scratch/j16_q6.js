(()=>{const o={};const g=(k,f)=>{try{o[k]=f()}catch(e){o[k]='ERR '+e.message}};
g('TEAMS',()=>JSON.stringify(TEAMS.slice(0,2)));
g('BUDX',()=>Object.keys(BUDX).join(','));
g('VID',()=>JSON.stringify(BUDX.VID&&BUDX.VID('v1')));g('vendors',()=>BUDX.B&&Object.keys(BUDX.B()).join(','));
g('vend',()=>JSON.stringify((BUDX.B().vendors||BUDX.VENDORS||[]).slice(0,2)));
g('DEPTS',()=>JSON.stringify((BUDX.DEPTS||[]).slice(0,3)));
g('CCMAP',()=>Object.keys(CCMAP).join(','));
g('CCunits',()=>JSON.stringify(CCMAP.units&&CCMAP.units().slice(0,2)));
g('PROCLIB',()=>Object.keys(PROCLIB).join(','));
g('proclist',()=>{const l=PROCLIB.list?PROCLIB.list():[];return l.length+' '+JSON.stringify(l[0]).slice(0,200)});
g('itsm',()=>typeof itsm==='function'?Object.keys(itsm()).join(','):'-');
g('ci',()=>{const i=itsm();return JSON.stringify((i.cis||i.cmdb||[]).slice(0,1)).slice(0,300)});
g('incs',()=>itsm().incidents.length+' '+itsm().changes.length);
g('CMDB',()=>typeof CMDBX!=='undefined'?Object.keys(CMDBX).join(','):typeof ITOMX);
g('MATmodels',()=>typeof MODELS);
g('entsATLAS',()=>ATLAS.coverage().modules.length);
g('platEnts',()=>PLAT.entities().length+' '+JSON.stringify(PLAT.entities()[0]).slice(0,300));
g('SVC',()=>JSON.stringify(SVCREG[0]).slice(0,200));
return o})()

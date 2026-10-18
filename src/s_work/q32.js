 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.decKinds=sh(DECX.kinds);o.decModes=sh(DECX.modes);o.decCov=sh(DECX.coverage&&DECX.coverage(),500);
 try{o.decN=DECX.rulesFor&&sh(Object.keys(S.dec||{}))}catch(e){}
 o.flowSt=sh(FLOWX.stats&&FLOWX.stats(),500);o.flows=sh((FLOWX.flows&&FLOWX.flows()).length);
 const fl=FLOWX.flows();const kinds={};fl.forEach(f=>(f.nodes||[]).forEach(n=>kinds[n.type||n.kind||n.t]=(kinds[n.type||n.kind||n.t]||0)+1));o.nodeKinds=sh(kinds);o.f0=sh(fl[0],500);
 o.runtime=sh(FLOWX.runtime&&Object.keys(FLOWX.runtime));
 o.guides=sh(typeof GUIDES!=="undefined"?GUIDES.length:(S.svc&&S.svc.guides&&S.svc.guides.length));
 return JSON.stringify(o,null,1);

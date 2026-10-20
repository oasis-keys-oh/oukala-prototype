 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 const d=BCX.D();o.fw=sh(d.fw,1400);o.tiers=sh(d.tiers,2500);o.wins=sh(d.wins,1800);o.groups=sh(d.groups,600);o.map=sh(d.map,600);o.cls=sh(d.cls,600);
 o.counts=sh({apps:d.appx&&Object.keys(d.appx).length,sites:d.sites.length,equip:d.equip.length,data:d.data.length,roles:d.roles.length,vendors:d.vendors.length,plans:d.plans.length,ex:d.ex.length,decl:d.decl.length,sops:d.sops.length,comms:d.comms.length,trees:d.trees.length,cix:d.cix&&Object.keys(d.cix).length,bps:d.bps.length});
 o.apps=sh(BCX.apps().length);o.comps=sh(BCX.comps().length);o.plans=BCX.plans().length;o.exs=BCX.exs().length;
 o.ML=sh(BCX.ML);o.GAPK=sh(BCX.GAPK);
 o.stats=sh(BCX.appStats&&BCX.appStats(),600);
 o.obl=sh(BCX.obligations().length);
 o.tn=sh(d.programStart);
 return JSON.stringify(o,null,1);

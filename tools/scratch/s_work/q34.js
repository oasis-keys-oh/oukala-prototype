 const o={};const sh=(x,n=900)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.cstats=sh(CONTRACT.stats());
 o.gate=sh(GATE.CHECKS.map(c=>c.id+':'+c.tier),1200);o.gateN=GATE.CHECKS.length;
 o.ownStats=sh(OWNX.stats(),900);
 try{o.zl=sh(ZLINK.score&&ZLINK.score(),400)}catch(e){}
 o.zlKeys=sh(Object.keys(ZLINK));
 o.facts=sh(Object.keys(FACTS));
 return JSON.stringify(o,null,1);

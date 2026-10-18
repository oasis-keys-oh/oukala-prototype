 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 const d=BCX.D();o.dims=sh(d.fw.dims.map(x=>x.letter+':'+x.n+':t'+x.target));o.TYPEN=sh(BCX.TYPEN);
 o.metrics=sh(Object.keys(METRICS).filter(k=>/^m_bc/.test(k)).map(k=>k+':'+METRICS[k].n+'|'+METRICS[k].f));
 o.trace=sh(BCX.nodes&&BCX.nodes().length);o.gaps=sh(BCX.gaps&&Object.fromEntries(Object.entries(BCX.gaps()).map(([k,v])=>[k,Array.isArray(v)?v.length:v])),900);
 o.plan0=sh(d.plans[0],700);o.ex0=sh(d.ex[0],500);o.decl=sh(d.decl[0],500);o.trees=sh(d.trees[0],300);
 o.apps0=sh(BCX.apps().slice(0,3),500);
 o.tierCounts=sh(BCX.apps().reduce((a,x)=>{const t=BCX.tierOf(x.id||x);a[t]=(a[t]||0)+1;return a},{}));
 return JSON.stringify(o,null,1);

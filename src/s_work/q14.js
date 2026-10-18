 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 const t=NTFX.types();o.n=t.length;o.t0=sh(t[0],400);const m={};t.forEach(x=>m[x.module||x.cat||x.group]=(m[x.module||x.cat||x.group]||0)+1);o.byMod=sh(m);
 o.ch=sh(Object.keys(NTFX.state.route).length);
 o.notifTypes=sh(NOTIF.state.items.length);
 return o;

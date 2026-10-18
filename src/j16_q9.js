(()=>{const o={};const g=(k,f)=>{try{o[k]=f()}catch(e){o[k]='ERR '+e.message}};
g('keys',()=>Object.keys(VIZ).join(','));g('lib',()=>JSON.stringify((VIZ.lib||[]).slice(0,2)).slice(0,500)+' n='+(VIZ.lib||[]).length);
g('Zkeys',()=>Object.keys(S.viz).join(','));g('dash',()=>JSON.stringify(S.viz.dash||'null').slice(0,400));
g('libS',()=>S.viz.lib&&S.viz.lib.length);
return o})()

(()=>{const o={};const g=(k,f)=>{try{o[k]=f()}catch(e){o[k]='ERR '+e.message}};
g('vend',()=>JSON.stringify(BUDX.B().vend).slice(0,300));
g('vid',()=>JSON.stringify(BUDX.VID('V1')));
g('ci',()=>typeof CMDBX.ci+' '+CMDBX.ci.toString().slice(0,200));
g('MODELS',()=>typeof SVCREG);
g('ITOMa',()=>Object.keys(window).filter(k=>/ITOM|CMDB|SVCX|SVC360|ITSM/.test(k)).join(','));
return o})()

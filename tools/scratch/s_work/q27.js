 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.keys=Object.keys(BCX).join(',');
 const d=BCX.d?BCX.d():S.bc.d;o.dKeys=sh(Object.keys(d||{}));
 return JSON.stringify(o);

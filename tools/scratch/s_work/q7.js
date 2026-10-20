 const o={};const sh=(x,n=900)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.scheds=sh((R15R.state.scheds||[]).length);o.reports=sh((R15R.state.reports||[]).length);o.rep0=sh(R15R.state.reports[0],500);o.sched0=sh(R15R.state.scheds[0],500);o.meas=sh(R15R.MEAS.map?R15R.MEAS.map(m=>m.id||m.k||m.n):R15R.MEAS,700);
 const mm=Object.keys(MAT.M);o.pl=sh(PROCLIB.maturity('ims'),700);
 o.matModels=sh(MAT.mname.toString().slice(0,600));
 o.cap=sh(typeof MATCAP!=="undefined"?1:0);
 return o;

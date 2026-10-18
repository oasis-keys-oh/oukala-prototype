 const o={};const sh=(x,n=700)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 const st=R16H.status.state;o.statuses=st.defs.map(d=>d.id+'/'+d.cat+'/'+d.handover+'/'+(d.launches||[]).map(l=>l.kind+':'+l.ref).join('+')).join(' ; ');
 const cis=CMDBX.all();o.ciN=cis.length;const k={};cis.forEach(c=>{k[c.ownKind]=(k[c.ownKind]||0)+1});o.ownKind=sh(k);
 o.withOG=cis.filter(c=>c.ownerGroup).length;o.withAG=cis.filter(c=>c.approverGroup).length;o.withGrp=cis.filter(c=>c.grp).length;o.withOwner=cis.filter(c=>c.owner).length;
 const cl={};cis.forEach(c=>cl[c.class]=(cl[c.class]||0)+1);o.classes=sh(cl,900);o.nclasses=Object.keys(cl).length;
 const crit={};cis.forEach(c=>crit[c.crit]=(crit[c.crit]||0)+1);o.crit=sh(crit);
 const ls={};cis.forEach(c=>ls[c.life]=(ls[c.life]||0)+1);o.life=sh(ls);
 try{o.ccCov=sh(CCMAP.coverage(),600);o.ccrows=sh(CCMAP.rows().length);o.ccrow0=sh(CCMAP.rows()[0],500);o.ccGaps=sh(CCMAP.gaps().length)}catch(e){o.ccerr=e.message}
 try{o.stats5=sh(ORGX.stats5(),500)}catch(e){o.s5=e.message}
 o.staff0=sh(ORGX.staff&&ORGX.staff[0],600);o.staffN=ORGX.staff&&ORGX.staff.length;
 try{o.vacs=sh(typeof ORGX.vacs==='function'?ORGX.vacs().length:ORGX.vacs.length)}catch(e){}
 return o;

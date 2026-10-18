 const o={};const sh=(x,n=1500)=>{try{return JSON.stringify(x).slice(0,n)}catch(e){return 'err'}};
 o.r16i=sh(Object.keys(R16I));o.ntf=typeof NTF!=="undefined"?sh(Object.keys(NTF)):'';
 o.ntfReg=sh(typeof R16I.notif!=="undefined"?Object.keys(R16I.notif):'');
 o.mcp=typeof MCPX!=="undefined"?sh(Object.keys(MCPX),500):'noMCPX';
 try{o.tools=sh((MCPX.tools||MCPX.TOOLS).map(t=>t.name||t.id||t.n),2500);o.toolN=(MCPX.tools||MCPX.TOOLS).length}catch(e){o.toolsErr=e.message}
 o.fab=typeof FAB!=="undefined"?sh(Object.keys(FAB)):'noFAB';
 o.conn=sh(typeof FABX!=="undefined"?Object.keys(FABX):'');
 o.sources=sh(R16M.sources&&(R16M.sources.length||Object.keys(R16M.sources)));
 return o;

(async()=>{await new Promise(r=>setTimeout(r,3500));const o={log:INBOXCON.log,mat:INBOXCON.mat,pl:INBOXCON.pl&&INBOXCON.pl.ok,w:INBOXCON.pl&&INBOXCON.pl.warnings.length};
o.tables=["inbox_item","approval_decision","delegation_rule","notification_preference"].map(t=>!!DATAMODEL.tables[t]);
const t0=performance.now();SCALE.set(true);INBOX.refresh();o.scaleN=INBOX.items().length;o.scaleMs=Math.round(performance.now()-t0);
go('inbox');const t1=performance.now();INBOX.openPanel();o.panelMs=Math.round(performance.now()-t1);o.panelRows=document.querySelectorAll('#inbxPanel .inbx-row').length;
o.ask=(()=>{S.chat=[];ask("what needs my approval");return S.chat.length})();
o.sim=INBOX.simNow().title;o.banners=document.querySelectorAll('.inbx-banner').length;
return o})()
